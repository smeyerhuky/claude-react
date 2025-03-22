import React, { useState, useRef, useEffect } from 'react';
import { Play, Upload, Settings, Film, RefreshCw, ChevronRight, ChevronLeft, FastForward, SkipBack, Square, Pause } from 'lucide-react';

const MotionAmplification = () => {
  // State for different views
  const [activeView, setActiveView] = useState('upload'); // upload, preview, processing, playback
  
  // State for video data
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoFrames, setVideoFrames] = useState([]);
  const [processedFrames, setProcessedFrames] = useState([]);
  const [videoInfo, setVideoInfo] = useState({ width: 0, height: 0, duration: 0, fps: 0 });
  
  // State for processing parameters
  const [params, setParams] = useState({
    vectorThreshold: 0.05,
    pixelAmplification: 2.0,
    sensitivityRange: [0.1, 0.5],
    colorAmplification: true,
    motionBlur: 0,
    framesToAnalyze: 10, // Number of frames to use for preview
  });
  
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
      
      // Use a temporary canvas for processing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = videoInfo.width;
      tempCanvas.height = videoInfo.height;
      
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
  
  // Motion amplification explainer component
  const MotionAmplificationExplainer = () => {
    return (
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">How Motion Amplification Works</h3>
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
        
        <p className="text-sm text-gray-700 mt-3">
          Adjust the parameters to fine-tune which movements are detected and how much they're amplified. 
          This technique is useful for detecting subtle movements like someone walking on a surface, structural vibrations, 
          or even a person's pulse visible in their face.
        </p>
      </div>
    );
  };
  
  // Render different views based on state
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Motion Analysis & Amplification</h1>
      
      {/* Navigation tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-white rounded-lg shadow overflow-hidden">
          <button 
            className={`flex items-center px-4 py-2 ${activeView === 'upload' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            onClick={() => setActiveView('upload')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </button>
          <button 
            className={`flex items-center px-4 py-2 ${activeView === 'preview' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            onClick={() => videoUrl && setActiveView('preview')}
            disabled={!videoUrl}
          >
            <Settings className="w-4 h-4 mr-2" />
            Preview
          </button>
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
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        {activeView === 'upload' && (
          <VideoUploader onUpload={handleVideoUpload} />
        )}
        
        {activeView === 'preview' && (
          <div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <VideoPreview 
                  videoUrl={videoUrl} 
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  videoInfo={videoInfo}
                  extractFrames={extractPreviewFrames}
                  videoFrames={videoFrames}
                />
              </div>
              <div className="md:w-1/3">
                <ParameterControls 
                  params={params} 
                  onParamChange={handleParameterChange} 
                />
              </div>
            </div>
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
            <MotionAmplificationExplainer />
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
          />
        )}
      </div>
    </div>
  );
};

// Component for video upload
const VideoUploader = ({ onUpload }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
  );
};

// Component for video preview
const VideoPreview = ({ videoUrl, videoRef, canvasRef, videoInfo, extractFrames, videoFrames }) => {
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
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-3">Video Preview</h3>
      
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

// Component for parameter controls
const ParameterControls = ({ params, onParamChange }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-3">Processing Parameters</h3>
      
      <div className="space-y-4">
        {/* Vector Threshold Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vector Threshold: {params.vectorThreshold.toFixed(2)}
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amplification: {params.pixelAmplification.toFixed(1)}×
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sensitivity Range: [{params.sensitivityRange[0].toFixed(1)}, {params.sensitivityRange[1].toFixed(1)}]
          </label>
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
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={params.colorAmplification}
              onChange={(e) => onParamChange('colorAmplification', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Color Amplification</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Amplify color changes in addition to movement
          </p>
        </div>
        
        {/* Motion Blur Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motion Blur: {params.motionBlur}
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preview Frames: {params.framesToAnalyze}
          </label>
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
      </div>
    </div>
  );
};

// Component for processing view
const ProcessingView = ({ progress, videoInfo }) => {
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
      
      <p className="text-gray-500">
        Processing {Math.round(progress)}% complete
      </p>
      
      {videoInfo.width > 0 && (
        <div className="mt-6 text-sm text-gray-600 max-w-sm mx-auto">
          <p>Video resolution: {videoInfo.width} × {videoInfo.height}</p>
          <p>Video duration: {videoInfo.duration.toFixed(2)} seconds</p>
          <p className="mt-2">Higher resolution and longer videos will take more time to process.</p>
        </div>
      )}
    </div>
  );
};

// Component for video playback
const VideoPlayer = ({ processedFrames, videoInfo, outputCanvasRef, playbackState, setPlaybackState }) => {
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
    <div>
      <h3 className="font-medium mb-3">Processed Video Playback</h3>
      
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
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={skipToStart}
            className="p-2 rounded hover:bg-gray-100"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleDirection}
            className={`p-2 rounded hover:bg-gray-100 ${playbackState.direction < 0 ? 'text-blue-500' : ''}`}
          >
            {playbackState.direction < 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          <button
            onClick={togglePlayback}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            {playbackState.isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={skipToEnd}
            className="p-2 rounded hover:bg-gray-100"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>
        
        {/* Speed controls */}
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setSpeed(0.5)}
            className={`px-2 py-1 rounded-md text-sm ${playbackState.speed === 0.5 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            0.5×
          </button>
          
          <button
            onClick={() => setSpeed(1)}
            className={`px-2 py-1 rounded-md text-sm ${playbackState.speed === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            1×
          </button>
          
          <button
            onClick={() => setSpeed(2)}
            className={`px-2 py-1 rounded-md text-sm ${playbackState.speed === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            2×
          </button>
          
          <button
            onClick={() => setSpeed(4)}
            className={`px-2 py-1 rounded-md text-sm ${playbackState.speed === 4 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            4×
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Analysis Notes</h4>
        <p className="text-sm text-gray-600">
          The processed video highlights motion patterns by amplifying pixel changes between frames. Subtle movements that 
          may be invisible to the naked eye have been enhanced based on your selected parameters.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Play the video forwards and backwards at different speeds to analyze the motion patterns. To further refine the 
          results, you can return to the Preview tab and adjust the parameters.
        </p>
      </div>
    </div>
  );
};

export default MotionAmplification;