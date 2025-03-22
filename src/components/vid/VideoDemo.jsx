import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Upload, Settings, Film, RefreshCw, ChevronRight, 
  ChevronLeft, FastForward, SkipBack, Square, Pause,
  RotateCcw, Info, AlertCircle, Eye, Sliders, Maximize
} from 'lucide-react';

const MotionAmplification = () => {
  // State for different views
  const [activeView, setActiveView] = useState('upload'); // upload, preview, processing, playback
  
  // State for video data
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoFrames, setVideoFrames] = useState([]);
  const [processedFrames, setProcessedFrames] = useState([]);
  const [videoInfo, setVideoInfo] = useState({ width: 0, height: 0, duration: 0, fps: 0 });
  
  // State for processing parameters with default values
  const defaultParams = {
    vectorThreshold: 0.05,
    pixelAmplification: 2.0,
    sensitivityRange: [0.1, 0.5],
    colorAmplification: true,
    motionBlur: 0,
    framesToAnalyze: 10,
  };
  
  const [params, setParams] = useState({...defaultParams});
  
  // State for example previews
  const [showExamples, setShowExamples] = useState(false);
  const [activeExample, setActiveExample] = useState(null);
  
  // Processing state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Playback state
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentFrame: 0,
    direction: 1, // 1 for forward, -1 for reverse
    speed: 1,
  });
  
  // UI state
  const [showParameterHelp, setShowParameterHelp] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  
  // Refs for video elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  
  // Handle video file upload
  const handleVideoUpload = (file) => {
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setActiveView('preview');
      
      // Reset states
      setVideoFrames([]);
      setProcessedFrames([]);
      setProcessingProgress(0);
    }
  };
  
  // Extract video information when a video is loaded
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      const video = videoRef.current;
      
      video.onloadedmetadata = () => {
        setVideoInfo({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          fps: 30, // Assume 30 fps initially
        });
      };
    }
  }, [videoUrl]);
  
  // Handle parameter changes
  const handleParameterChange = (paramName, value) => {
    setParams(prevParams => ({
      ...prevParams,
      [paramName]: value
    }));
  };
  
  // Reset all parameters to default values
  const resetAllParameters = () => {
    setParams({...defaultParams});
  };
  
  // Reset individual parameter to default value
  const resetParameter = (paramName) => {
    setParams(prevParams => ({
      ...prevParams,
      [paramName]: defaultParams[paramName]
    }));
  };
  
  // Extract frames from video for preview
  const extractPreviewFrames = async () => {
    if (!videoRef.current || !videoUrl) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Calculate frame extraction points
    const framesCount = params.framesToAnalyze;
    const frames = [];
    
    // Wait for video to be ready
    await new Promise(resolve => {
      video.onloadeddata = resolve;
      if (video.readyState >= 2) resolve(); // Already loaded
    });
    
    // Extract frames at regular intervals
    for (let i = 0; i < framesCount; i++) {
      const time = (video.duration / framesCount) * i;
      video.currentTime = time;
      
      // Wait for seek to complete
      await new Promise(resolve => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      frames.push({
        time,
        imageData,
      });
    }
    
    setVideoFrames(frames);
    return frames;
  };
  
  // Process frames using vector decomposition and mean pixel analysis
  const processVideoFrames = async () => {
    setIsProcessing(true);
    
    try {
      // Extract frames if not already done
      let frames = videoFrames;
      if (frames.length === 0) {
        frames = await extractPreviewFrames();
      }
      
      // Process the frames
      const processed = [];
      
      for (let i = 0; i < frames.length - 1; i++) {
        // Update progress
        setProcessingProgress((i / (frames.length - 1)) * 100);
        
        // Get current and next frame
        const currentFrame = frames[i].imageData;
        const nextFrame = frames[i + 1].imageData;
        
        // Process using vector decomposition
        const processedFrame = processFramePair(currentFrame, nextFrame, params);
        
        processed.push({
          time: frames[i].time,
          imageData: processedFrame,
        });
        
        // Small delay to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setProcessedFrames(processed);
      setProcessingProgress(100);
      
      // Move to playback view after a delay
      setTimeout(() => {
        setActiveView('playback');
        setIsProcessing(false);
      }, 500);
      
    } catch (error) {
      console.error('Error processing video:', error);
      setIsProcessing(false);
    }
  };
  
  // Process a pair of frames using vector decomposition 
  const processFramePair = (frame1, frame2, params) => {
    const { pixelAmplification, vectorThreshold, sensitivityRange, colorAmplification, motionBlur } = params;
    
    // Create new ImageData for the processed frame
    const processedFrame = new ImageData(
      new Uint8ClampedArray(frame1.data.length),
      frame1.width,
      frame1.height
    );
    
    // Process each pixel
    for (let y = 1; y < frame1.height - 1; y++) {
      for (let x = 1; x < frame1.width - 1; x++) {
        const i = (y * frame1.width + x) * 4;
        
        // Calculate temporal gradient (frame difference)
        const dtR = frame2.data[i] - frame1.data[i];
        const dtG = frame2.data[i + 1] - frame1.data[i + 1];
        const dtB = frame2.data[i + 2] - frame1.data[i + 2];
        
        // Simple spatial gradients (for optical flow estimation)
        // Horizontal gradient
        const dxR = (frame1.data[i + 4] - frame1.data[i - 4]) / 2;
        const dxG = (frame1.data[i + 5] - frame1.data[i - 3]) / 2;
        const dxB = (frame1.data[i + 6] - frame1.data[i - 2]) / 2;
        
        // Vertical gradient
        const dyR = (frame1.data[i + frame1.width * 4] - frame1.data[i - frame1.width * 4]) / 2;
        const dyG = (frame1.data[i + frame1.width * 4 + 1] - frame1.data[i - frame1.width * 4 + 1]) / 2;
        const dyB = (frame1.data[i + frame1.width * 4 + 2] - frame1.data[i - frame1.width * 4 + 2]) / 2;
        
        // Simplified motion vector calculation (based on Lucas-Kanade method)
        const dxAvg = (Math.abs(dxR) + Math.abs(dxG) + Math.abs(dxB)) / 3;
        const dyAvg = (Math.abs(dyR) + Math.abs(dyG) + Math.abs(dyB)) / 3;
        const dtAvg = (Math.abs(dtR) + Math.abs(dtG) + Math.abs(dtB)) / 3;
        
        // Calculate motion magnitude
        const gradientMagnitude = Math.sqrt(dxAvg * dxAvg + dyAvg * dyAvg);
        let motionMagnitude = 0;
        
        if (gradientMagnitude > 0.1) {  // Avoid division by zero
          // Estimate motion magnitude
          motionMagnitude = dtAvg / gradientMagnitude;
        }
        
        // Normalize to 0-1 range
        const normalizedMagnitude = Math.min(1, Math.abs(motionMagnitude) / 10);
        
        // Check if motion is within sensitivity range and above threshold
        const isInRange = normalizedMagnitude >= sensitivityRange[0] && 
                        normalizedMagnitude <= sensitivityRange[1];
        
        // Apply amplification if motion meets criteria
        if (normalizedMagnitude > vectorThreshold && isInRange) {
          // Calculate amplification factor
          const ampFactor = pixelAmplification * normalizedMagnitude;
          
          if (colorAmplification) {
            // Amplify color changes
            processedFrame.data[i] = Math.min(255, Math.max(0, frame1.data[i] + dtR * ampFactor));
            processedFrame.data[i + 1] = Math.min(255, Math.max(0, frame1.data[i + 1] + dtG * ampFactor));
            processedFrame.data[i + 2] = Math.min(255, Math.max(0, frame1.data[i + 2] + dtB * ampFactor));
          } else {
            // Amplify luminance only
            const luminance = (0.299 * dtR + 0.587 * dtG + 0.114 * dtB) * ampFactor;
            processedFrame.data[i] = Math.min(255, Math.max(0, frame1.data[i] + luminance));
            processedFrame.data[i + 1] = Math.min(255, Math.max(0, frame1.data[i + 1] + luminance));
            processedFrame.data[i + 2] = Math.min(255, Math.max(0, frame1.data[i + 2] + luminance));
          }
        } else {
          // Keep original pixel
          processedFrame.data[i] = frame1.data[i];
          processedFrame.data[i + 1] = frame1.data[i + 1];
          processedFrame.data[i + 2] = frame1.data[i + 2];
        }
        
        // Alpha channel
        processedFrame.data[i + 3] = 255;
      }
    }
    
    // Apply motion blur if needed
    if (motionBlur > 0) {
      return applyMotionBlur(processedFrame, motionBlur);
    }
    
    return processedFrame;
  };
  
  // Apply motion blur to processed frame
  const applyMotionBlur = (frame, blurAmount) => {
    // Simple box blur implementation
    const blurred = new ImageData(
      new Uint8ClampedArray(frame.data.length),
      frame.width,
      frame.height
    );
    
    // Copy data initially
    blurred.data.set(frame.data);
    
    // Apply horizontal blur
    const radius = blurAmount;
    
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        let rSum = 0, gSum = 0, bSum = 0;
        let count = 0;
        
        // Box blur kernel
        for (let rx = -radius; rx <= radius; rx++) {
          const nx = x + rx;
          if (nx >= 0 && nx < frame.width) {
            const i = (y * frame.width + nx) * 4;
            rSum += frame.data[i];
            gSum += frame.data[i + 1];
            bSum += frame.data[i + 2];
            count++;
          }
        }
        
        const i = (y * frame.width + x) * 4;
        blurred.data[i] = rSum / count;
        blurred.data[i + 1] = gSum / count;
        blurred.data[i + 2] = bSum / count;
        blurred.data[i + 3] = 255;
      }
    }
    
    return blurred;
  };
  
  // Start processing the full video
  const handleProcessVideo = () => {
    setActiveView('processing');
    // Start processing after a short delay
    setTimeout(processVideoFrames, 100);
  };
  
  // Toggle parameter help overlay
  const toggleParameterHelp = () => {
    setShowParameterHelp(!showParameterHelp);
  };
  
  // Toggle example previews
  const toggleExamples = () => {
    setShowExamples(!showExamples);
  };
  
  // Toggle fullscreen preview
  const toggleFullscreen = () => {
    setFullscreenPreview(!fullscreenPreview);
  };
  
  // Render main component view
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className={`transition-all duration-300 ${fullscreenPreview ? 'p-0' : 'p-4'}`}>
        <h1 className={`text-2xl font-bold mb-6 text-center ${fullscreenPreview ? 'hidden' : 'block'}`}>
          Motion Analysis & Amplification
        </h1>
        
        {/* Navigation tabs */}
        <div className={`flex justify-center mb-6 ${fullscreenPreview ? 'hidden' : 'block'}`}>
          <div className="flex bg-white rounded-lg shadow overflow-hidden">
            <button 
              className={`flex items-center px-4 py-2 ${activeView === 'upload' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              onClick={() => setActiveView('upload')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button><br/>
            <button 
              className={`flex items-center px-4 py-2 ${activeView === 'preview' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              onClick={() => videoUrl && setActiveView('preview')}
              disabled={!videoUrl}
            >
              <Settings className="w-4 h-4 mr-2" />
              Preview
            </button><br />
            <button 
              className={`flex items-center px-4 py-2 ${activeView === 'processing' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              disabled={true}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Processing
            </button>
            <button 
              className={`flex items-center px-4 py-2 ${activeView === 'playback' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              onClick={() => processedFrames.length > 0 && setActiveView('playback')}
              disabled={processedFrames.length === 0}
            >
              <Film className="w-4 h-4 mr-2" />
              Playback
            </button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className={`mx-auto bg-white rounded-lg shadow ${fullscreenPreview ? 'p-0' : 'p-6'} ${fullscreenPreview ? 'max-w-none' : 'max-w-4xl'}`}>
          {activeView === 'upload' && (
            <VideoUploader onUpload={handleVideoUpload} />
          )}
          
          {activeView === 'preview' && (
            <div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className={`${fullscreenPreview ? 'w-full' : 'md:w-2/3'}`}>
                  <VideoPreview 
                    videoUrl={videoUrl} 
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    videoInfo={videoInfo}
                    extractFrames={extractPreviewFrames}
                    videoFrames={videoFrames}
                    onToggleFullscreen={toggleFullscreen}
                    isFullscreen={fullscreenPreview}
                  />
                </div>
                
                {!fullscreenPreview && (
                  <div className="md:w-1/3">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Processing Parameters</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={toggleParameterHelp}
                          className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
                          title="Parameter Help"
                        >
                          <Info className="w-5 h-5" />
                        </button>
                        <button
                          onClick={toggleExamples}
                          className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
                          title="Show Examples"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={resetAllParameters}
                          className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
                          title="Reset All Parameters"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {showParameterHelp ? (
                      <ParameterHelp onClose={toggleParameterHelp} />
                    ) : showExamples ? (
                      <ParameterExamples
                        activeExample={activeExample}
                        setActiveExample={setActiveExample}
                        onClose={toggleExamples}
                      />
                    ) : (
                      <ParameterControls 
                        params={params} 
                        defaultParams={defaultParams}
                        onParamChange={handleParameterChange}
                        onResetParam={resetParameter}
                        onResetAll={resetAllParameters}
                        setActiveExample={setActiveExample}
                      />
                    )}
                  </div>
                )}
              </div>
              
              {!fullscreenPreview && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleProcessVideo}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                    disabled={isProcessing}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Process Video
                  </button>
                </div>
              )}
              
              {!fullscreenPreview && <MotionAmplificationExplainer />}
            </div>
          )}
          
          {activeView === 'processing' && (
            <ProcessingView 
              progress={processingProgress}
              videoInfo={videoInfo}
            />
          )}
          
          {activeView === 'playback' && (
            <VideoPlayer 
              processedFrames={processedFrames}
              videoInfo={videoInfo}
              outputCanvasRef={outputCanvasRef}
              playbackState={playbackState}
              setPlaybackState={setPlaybackState}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={fullscreenPreview}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Component for video upload
const VideoUploader = ({ onUpload }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter - 1 === 0) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };
  
  const demoVideos = [
    { name: "Hand Movement", size: "2.3 MB", duration: "4 sec" },
    { name: "Machinery Vibration", size: "3.8 MB", duration: "6 sec" },
    { name: "Building Sway", size: "5.1 MB", duration: "8 sec" },
  ];
  
  return (
    <div className="space-y-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-medium mb-2">Upload a Video</h2>
        <p className="text-gray-500 mb-4">Drag and drop a video file here, or click to select</p>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Select Video
        </button>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center">
          <Info className="w-4 h-4 mr-2 text-blue-500" />
          Sample Videos
        </h3>
        <p className="text-sm text-gray-600 mb-4">Try one of these sample videos to see how motion amplification works:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {demoVideos.map((video, index) => (
            <button
              key={index}
              className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 text-left hover:border-blue-300 transition-colors"
              // This would load a sample video in a real application
              onClick={() => alert(`Sample video would load: ${video.name}`)}
            >
              <div className="flex items-center text-gray-800 font-medium mb-1">
                <Film className="w-4 h-4 mr-2 text-blue-500" />
                {video.name}
              </div>
              <div className="text-xs text-gray-500">
                {video.size} • {video.duration}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Component for video preview
const VideoPreview = ({ 
  videoUrl, 
  videoRef, 
  canvasRef, 
  videoInfo, 
  extractFrames, 
  videoFrames,
  onToggleFullscreen,
  isFullscreen 
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);
  
  const handleExtractFrames = async () => {
    setIsExtracting(true);
    await extractFrames();
    setIsExtracting(false);
  };
  
  // Display a preview frame when available
  useEffect(() => {
    if (videoFrames.length > 0 && canvasRef.current) {
      const frameIndex = Math.min(1, videoFrames.length - 1);
      setSelectedFrame(frameIndex);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoFrames[frameIndex].imageData.width;
      canvas.height = videoFrames[frameIndex].imageData.height;
      
      ctx.putImageData(videoFrames[frameIndex].imageData, 0, 0);
    }
  }, [videoFrames]);
  
  return (
    <div className={`${isFullscreen ? '' : 'bg-gray-50 p-4 rounded-lg'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Video Preview</h3>
        <button
          onClick={onToggleFullscreen}
          className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      
      <div className="aspect-video bg-black rounded relative overflow-hidden">
        {videoFrames.length > 0 && selectedFrame !== null ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />
        ) : (
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            controls
          />
        )}
      </div>
      
      {videoInfo.width > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <p>Resolution: {videoInfo.width} × {videoInfo.height}</p>
          <p>Duration: {videoInfo.duration.toFixed(2)} seconds</p>
        </div>
      )}
      
      <div className="mt-4">
        {videoFrames.length === 0 ? (
          <button
            onClick={handleExtractFrames}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center"
            disabled={isExtracting}
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Extracting Frames...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Extract Preview Frames
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {videoFrames.length} frames extracted. Use the processor to analyze motion patterns.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFrame(prev => Math.max(0, prev - 1))}
                disabled={selectedFrame <= 0}
                className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 flex-1 text-center">
                Frame {selectedFrame !== null ? selectedFrame + 1 : 0} of {videoFrames.length}
              </span>
              <button
                onClick={() => setSelectedFrame(prev => Math.min(videoFrames.length - 1, prev + 1))}
                disabled={selectedFrame >= videoFrames.length - 1}
                className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component for parameter controls with reset buttons
const ParameterControls = ({ 
  params, 
  defaultParams, 
  onParamChange, 
  onResetParam,
  onResetAll,
  setActiveExample
}) => {
  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      {/* Vector Threshold Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Vector Threshold: {params.vectorThreshold.toFixed(2)}
            <button
              onClick={() => setActiveExample('vectorThreshold')}
              className="ml-1 text-blue-500 hover:text-blue-700"
              title="See Example"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </label>
          <button
            onClick={() => onResetParam('vectorThreshold')}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to ${defaultParams.vectorThreshold}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={params.vectorThreshold}
          onChange={(e) => onParamChange('vectorThreshold', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimum movement required to be detected
        </p>
      </div>
      
      {/* Pixel Amplification Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Amplification: {params.pixelAmplification.toFixed(1)}×
            <button
              onClick={() => setActiveExample('pixelAmplification')}
              className="ml-1 text-blue-500 hover:text-blue-700"
              title="See Example"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </label>
          <button
            onClick={() => onResetParam('pixelAmplification')}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to ${defaultParams.pixelAmplification}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.1"
          value={params.pixelAmplification}
          onChange={(e) => onParamChange('pixelAmplification', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          How much to amplify detected movements
        </p>
      </div>
      
      {/* Sensitivity Range */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Sensitivity Range: [{params.sensitivityRange[0].toFixed(1)}, {params.sensitivityRange[1].toFixed(1)}]
            <button
              onClick={() => setActiveExample('sensitivityRange')}
              className="ml-1 text-blue-500 hover:text-blue-700"
              title="See Example"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </label>
          <button
            onClick={() => onResetParam('sensitivityRange')}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to [${defaultParams.sensitivityRange[0]}, ${defaultParams.sensitivityRange[1]}]`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={params.sensitivityRange[0]}
            onChange={(e) => onParamChange('sensitivityRange', [parseFloat(e.target.value), params.sensitivityRange[1]])}
            className="w-full"
          />
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={params.sensitivityRange[1]}
            onChange={(e) => onParamChange('sensitivityRange', [params.sensitivityRange[0], parseFloat(e.target.value)])}
            className="w-full"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Range of movement magnitudes to amplify
        </p>
      </div>
      
      {/* Color Amplification Toggle */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <span>Color Amplification</span>
            <button
              onClick={() => setActiveExample('colorAmplification')}
              className="ml-1 text-blue-500 hover:text-blue-700"
              title="See Example"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </label>
          <button
            onClick={() => onResetParam('colorAmplification')}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to ${defaultParams.colorAmplification ? 'enabled' : 'disabled'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={params.colorAmplification}
            onChange={(e) => onParamChange('colorAmplification', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            {params.colorAmplification ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Amplify color changes in addition to movement
        </p>
      </div>
      
      {/* Motion Blur Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Motion Blur: {params.motionBlur}
            <button
              onClick={() => setActiveExample('motionBlur')}
              className="ml-1 text-blue-500 hover:text-blue-700"
              title="See Example"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </label>
          <button
            onClick={() => onResetParam('motionBlur')}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to ${defaultParams.motionBlur}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={params.motionBlur}
          onChange={(e) => onParamChange('motionBlur', parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Smoothing applied to motion trails
        </p>
      </div>
      
      {/* Frames to Analyze */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Preview Frames: {params.framesToAnalyze}
          </label>
          <button
            onClick={() => onResetParam('framesToAnalyze')}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to ${defaultParams.framesToAnalyze}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="2"
          max="30"
          step="1"
          value={params.framesToAnalyze}
          onChange={(e) => onParamChange('framesToAnalyze', parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Number of frames to extract for preview
        </p>
      </div>
      
      {/* Reset all button */}
      <div className="pt-2">
        <button
          onClick={onResetAll}
          className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Parameters
        </button>
      </div>
    </div>
  );
};

// Component for parameter help overlay
const ParameterHelp = ({ onClose }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium flex items-center">
          <Info className="w-4 h-4 mr-2 text-blue-500" />
          Parameter Guide
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
      </div>
      
      <div className="space-y-4 text-sm">
        <div className="p-3 bg-white rounded border border-gray-200">
          <h4 className="font-medium text-blue-600">Vector Threshold</h4>
          <p className="text-gray-700 mt-1">
            Sets the minimum amount of movement needed before amplification occurs. 
            Lower values capture subtle motion but may increase noise. Higher values 
            only amplify more significant movement.
          </p>
        </div>
        
        <div className="p-3 bg-white rounded border border-gray-200">
          <h4 className="font-medium text-blue-600">Amplification</h4>
          <p className="text-gray-700 mt-1">
            Controls how much detected motion is magnified. Higher values make subtle 
            movements more visible but can cause artifacts. Start with lower values (2-4) 
            and increase gradually.
          </p>
        </div>
        
        <div className="p-3 bg-white rounded border border-gray-200">
          <h4 className="font-medium text-blue-600">Sensitivity Range</h4>
          <p className="text-gray-700 mt-1">
            Defines which magnitude of movements to amplify. The left slider sets the 
            minimum (ignoring tiny movements), while the right slider sets the maximum 
            (ignoring large movements).
          </p>
        </div>
        
        <div className="p-3 bg-white rounded border border-gray-200">
          <h4 className="font-medium text-blue-600">Color Amplification</h4>
          <p className="text-gray-700 mt-1">
            When enabled, amplifies color changes along with movement. This can reveal 
            subtle color variations due to movement. When disabled, only brightness changes 
            are amplified.
          </p>
        </div>
        
        <div className="p-3 bg-white rounded border border-gray-200">
          <h4 className="font-medium text-blue-600">Motion Blur</h4>
          <p className="text-gray-700 mt-1">
            Applies a smoothing effect to motion trails. Higher values create more 
            obvious motion paths but reduce detail. Useful for visualizing the direction 
            of movement.
          </p>
        </div>
      </div>
    </div>
  );
};

// Component for parameter examples
const ParameterExamples = ({ activeExample, setActiveExample, onClose }) => {
  const examples = [
    { id: 'vectorThreshold', name: 'Vector Threshold' },
    { id: 'pixelAmplification', name: 'Amplification' },
    { id: 'sensitivityRange', name: 'Sensitivity Range' },
    { id: 'colorAmplification', name: 'Color Amplification' },
    { id: 'motionBlur', name: 'Motion Blur' },
  ];
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium flex items-center">
          <Eye className="w-4 h-4 mr-2 text-blue-500" />
          Parameter Examples
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
      </div>
      
      <div className="flex overflow-x-auto space-x-2 py-2 mb-3">
        {examples.map(example => (
          <button
            key={example.id}
            className={`px-3 py-1 text-sm whitespace-nowrap rounded ${
              activeExample === example.id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
            }`}
            onClick={() => setActiveExample(example.id)}
          >
            {example.name}
          </button>
        ))}
      </div>
      
      {activeExample === 'vectorThreshold' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Vector Threshold controls which movements are detected:
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Low Threshold (0.01)
              </div>
              <div className="bg-gray-800 h-28 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Detects very subtle movements, but may include noise
              </p>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                High Threshold (0.2)
              </div>
              <div className="bg-gray-800 h-28 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Only detects more significant movements
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeExample === 'pixelAmplification' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Amplification controls how much movement is magnified:
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Low (1.5×)
              </div>
              <div className="bg-gray-800 h-24 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Subtle enhancement
              </p>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Medium (4×)
              </div>
              <div className="bg-gray-800 h-24 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Balanced enhancement
              </p>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                High (8×)
              </div>
              <div className="bg-gray-800 h-24 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Dramatic enhancement
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeExample === 'sensitivityRange' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Sensitivity Range filters which magnitudes of motion are amplified:
          </p>
          
          <div className="relative h-24 bg-gray-200 rounded mb-2">
            <div className="absolute inset-y-0 left-0 w-1/4 bg-blue-200 border-r border-blue-300"></div>
            <div className="absolute inset-y-0 left-1/4 right-1/4 bg-blue-400"></div>
            <div className="absolute inset-y-0 right-0 w-1/4 bg-blue-200 border-l border-blue-300"></div>
            
            <div className="absolute inset-0 flex items-center justify-around">
              <div className="text-xs text-gray-700 font-medium">Small Motion</div>
              <div className="text-xs text-white font-medium">Medium Motion</div>
              <div className="text-xs text-gray-700 font-medium">Large Motion</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Narrow Range [0.3, 0.6]
              </div>
              <p className="text-xs text-gray-700 mt-1">
                Only amplifies medium-sized movements, ignoring both small jitters and large movements.
              </p>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Wide Range [0.1, 0.9]
              </div>
              <p className="text-xs text-gray-700 mt-1">
                Amplifies almost all movements except the very smallest and largest.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeExample === 'colorAmplification' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Color Amplification affects how color changes are enhanced:
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Color Amplification OFF
              </div>
              <div className="bg-gray-800 h-28 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Only brightness changes are amplified
              </p>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Color Amplification ON
              </div>
              <div className="bg-gray-800 h-28 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Both color and brightness changes are amplified
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeExample === 'motionBlur' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Motion Blur controls the smoothing of movement trails:
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                No Blur (0)
              </div>
              <div className="bg-gray-800 h-24 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Sharp edges
              </p>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                Medium Blur (2)
              </div>
              <div className="bg-gray-800 h-24 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Smoother trails
              </p>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-center text-xs text-gray-600 mb-1">
                High Blur (5)
              </div>
              <div className="bg-gray-800 h-24 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  Visual Example
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Long motion trails
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component for processing view
const ProcessingView = ({ progress, videoInfo }) => {
  // Processing stages
  const stages = [
    { name: "Extracting frames", complete: progress >= 20 },
    { name: "Analyzing motion vectors", complete: progress >= 40 },
    { name: "Applying amplification", complete: progress >= 60 },
    { name: "Creating output frames", complete: progress >= 80 },
    { name: "Finalizing video", complete: progress >= 95 }
  ];
  
  // Current stage
  const currentStage = Math.min(4, Math.floor(progress / 20));
  
  return (
    <div className="text-center py-8">
      <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
      <h3 className="text-xl font-medium mb-2">Processing Video</h3>
      <p className="text-gray-600 mb-4">Analyzing and amplifying motion patterns...</p>
      
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4 max-w-md mx-auto">
        <div 
          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p className="text-gray-500 mb-6">
        Processing {Math.round(progress)}% complete
      </p>
      
      {/* Processing stages */}
      <div className="max-w-md mx-auto">
        <ul className="space-y-2">
          {stages.map((stage, index) => (
            <li 
              key={index} 
              className={`flex items-center ${
                currentStage === index ? 'text-blue-600 font-medium' : 
                stage.complete ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center mr-2 rounded-full ${
                stage.complete ? 'bg-blue-100 text-blue-500' : 
                currentStage === index ? 'bg-blue-100 text-blue-500 animate-pulse' : 
                'bg-gray-100 text-gray-400'
              }`}>
                {stage.complete ? '✓' : ''}
              </span>
              {stage.name}
            </li>
          ))}
        </ul>
      </div>
      
      {videoInfo.width > 0 && (
        <div className="mt-8 text-sm text-gray-600 max-w-sm mx-auto p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Video Information</h4>
          <p>Resolution: {videoInfo.width} × {videoInfo.height}</p>
          <p>Duration: {videoInfo.duration.toFixed(2)} seconds</p>
          <p className="mt-2 text-xs text-gray-500">Higher resolution and longer videos will take more time to process.</p>
        </div>
      )}
    </div>
  );
};

// Component for video playback
const VideoPlayer = ({ 
  processedFrames, 
  videoInfo, 
  outputCanvasRef, 
  playbackState, 
  setPlaybackState,
  onToggleFullscreen,
  isFullscreen
}) => {
  // Animation frame request ID
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  
  // Initialize canvas and start playback
  useEffect(() => {
    if (processedFrames.length === 0 || !outputCanvasRef.current) return;
    
    const canvas = outputCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = videoInfo.width;
    canvas.height = videoInfo.height;
    
    // Function to render a specific frame
    const renderFrame = (frameIndex) => {
      if (frameIndex < 0 || frameIndex >= processedFrames.length) return;
      
      const frame = processedFrames[frameIndex];
      ctx.putImageData(frame.imageData, 0, 0);
    };
    
    // Animation loop
    const animate = (timestamp) => {
      // Calculate frame timing based on playback speed
      const frameTime = 1000 / (videoInfo.fps * playbackState.speed); 
      
      if (playbackState.isPlaying && timestamp - lastFrameTimeRef.current > frameTime) {
        lastFrameTimeRef.current = timestamp;
        
        // Calculate next frame index
        let nextFrame = playbackState.currentFrame + playbackState.direction;
        
        // Handle loop boundaries
        if (nextFrame >= processedFrames.length) {
          nextFrame = 0;
        } else if (nextFrame < 0) {
          nextFrame = processedFrames.length - 1;
        }
        
        // Update playback state
        setPlaybackState(prev => ({
          ...prev,
          currentFrame: nextFrame
        }));
        
        // Render the frame
        renderFrame(nextFrame);
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Render initial frame
    renderFrame(playbackState.currentFrame);
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [processedFrames, outputCanvasRef, videoInfo, playbackState.isPlaying, playbackState.currentFrame, playbackState.direction, playbackState.speed]);
  
  // Toggle play/pause
  const togglePlayback = () => {
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };
  
  // Toggle playback direction
  const toggleDirection = () => {
    setPlaybackState(prev => ({
      ...prev,
      direction: prev.direction * -1
    }));
  };
  
  // Set playback speed
  const setSpeed = (speed) => {
    setPlaybackState(prev => ({
      ...prev,
      speed
    }));
  };
  
  // Handle scrubber change
  const handleScrubberChange = (e) => {
    const frameIndex = parseInt(e.target.value);
    setPlaybackState(prev => ({
      ...prev,
      currentFrame: frameIndex
    }));
  };
  
  // Skip to start
  const skipToStart = () => {
    setPlaybackState(prev => ({
      ...prev,
      currentFrame: 0
    }));
  };
  
  // Skip to end
  const skipToEnd = () => {
    setPlaybackState(prev => ({
      ...prev,
      currentFrame: processedFrames.length - 1
    }));
  };
  
  return (
    <div className={isFullscreen ? '' : 'space-y-4'}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Processed Video</h3>
        <button
          onClick={onToggleFullscreen}
          className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      
      <div className="bg-black rounded-lg overflow-hidden">
        <canvas 
          ref={outputCanvasRef}
          className="w-full aspect-video object-contain"
        />
      </div>
      
      <div className="mt-4">
        {/* Scrubber */}
        <input
          type="range"
          min="0"
          max={processedFrames.length - 1}
          value={playbackState.currentFrame}
          onChange={handleScrubberChange}
          className="w-full"
        />
        
        {/* Frame counter */}
        <div className="text-sm text-gray-600 mb-2 text-center">
          Frame {playbackState.currentFrame + 1} of {processedFrames.length}
        </div>
        
        {/* Playback controls */}
        <div className="flex flex-wrap justify-center items-center gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={skipToStart}
              className="p-2 rounded hover:bg-gray-100"
              title="Skip to Start"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleDirection}
              className={`p-2 rounded hover:bg-gray-100 ${playbackState.direction < 0 ? 'text-blue-500' : ''}`}
              title={playbackState.direction < 0 ? "Playing Backwards" : "Playing Forwards"}
            >
              {playbackState.direction < 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            
            <button
              onClick={togglePlayback}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              title={playbackState.isPlaying ? "Pause" : "Play"}
            >
              {playbackState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={skipToEnd}
              className="p-2 rounded hover:bg-gray-100"
              title="Skip to End"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Speed controls */}
        <div className="flex justify-center mt-4 space-x-2">
          {[0.25, 0.5, 1, 2, 4].map(speed => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`px-2 py-1 rounded-md text-sm ${playbackState.speed === speed ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              title={`${speed}x Speed`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
      
      {!isFullscreen && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-2">Analysis Notes</h4>
              <p className="text-sm text-gray-600">
                The processed video highlights motion patterns by amplifying pixel changes between frames. Subtle movements that 
                may be invisible to the naked eye have been enhanced based on your selected parameters.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Play the video forwards and backwards at different speeds to analyze the motion patterns. Try comparing 
                the original and processed videos to see what subtle movements were revealed.
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Sliders className="w-4 h-4 mr-1 text-blue-500" />
              Applied Parameters
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
              <li>• Vector Threshold: Low (0.05)</li>
              <li>• Amplification: Medium (2.0×)</li>
              <li>• Sensitivity Range: [0.1, 0.5]</li>
              <li>• Color Amplification: Enabled</li>
              <li>• Motion Blur: None (0)</li>
              <li>• Processed Frames: {processedFrames.length}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Motion amplification explainer component
const MotionAmplificationExplainer = () => {
  return (
    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-medium mb-2 flex items-center">
        <Info className="w-4 h-4 mr-2 text-blue-500" />
        How Motion Amplification Works
      </h3>
      <p className="text-sm text-gray-700 mb-3">
        This tool uses a technique similar to Eulerian Video Magnification to detect and amplify subtle 
        movements in videos that are often invisible to the naked eye.
      </p>
      
      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
        <li>
          <strong>Motion Detection:</strong> The system analyzes pairs of frames to identify pixel changes.
        </li>
        <li>
          <strong>Vector Decomposition:</strong> Movement is broken down into components and filtered by magnitude.
        </li>
        <li>
          <strong>Selective Amplification:</strong> Only motions within specific ranges are enhanced, allowing you to 
          target subtle movements like breathing, vibrations, or slight shifts.
        </li>
        <li>
          <strong>Visualization:</strong> The amplified movements are rendered, making invisible motion visible.
        </li>
      </ol>
      
      <div className="mt-4 pt-4 border-t border-blue-100">
        <h4 className="font-medium text-sm mb-2">Applications</h4>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="font-medium text-blue-700">Structural Analysis</p>
            <p className="text-gray-600">Detect building vibrations, bridge oscillations, and structural weaknesses.</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="font-medium text-blue-700">Medical Monitoring</p>
            <p className="text-gray-600">Visualize pulse, breathing patterns, and subtle body movements.</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="font-medium text-blue-700">Machine Diagnostics</p>
            <p className="text-gray-600">Identify equipment vibrations and mechanical issues.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotionAmplification;
