import React, { useState, useEffect, useRef, useCallback, useReducer, createContext, useContext, memo } from 'react';
import { 
  Play, Upload, Settings, Film, RefreshCw, ChevronRight, 
  ChevronLeft, FastForward, SkipBack, Square, Pause,
  RotateCcw, Info, AlertCircle, Eye, Sliders, Maximize,
  ArrowLeft, ArrowRight, Layers
} from 'lucide-react';
import * as math from 'mathjs';

// -----------------------------------------------------
// Context & State Management
// -----------------------------------------------------

// Initial state for video processing
const initialState = {
  videoFile: null,
  videoUrl: null,
  videoFrames: [],
  processedFrames: [],
  frequencyData: [], // Frequency domain data for visualization
  motionVectors: [], // Motion vector data for visualization
  videoInfo: { width: 0, height: 0, duration: 0, fps: 30 },
  processingProgress: 0,
  processingState: 'idle', // idle, extracting, processing, completed
  activeView: 'upload', // upload, preview, processing, playback
  playbackState: {
    isPlaying: false,
    currentFrame: 0,
    direction: 1, // 1 for forward, -1 for reverse
    speed: 1,
  },
  // Parameters for processing
  processingParams: {
    amplificationFactor: 2.0,
    lowFrequencyCutoff: 0.1,
    highFrequencyCutoff: 0.5,
    colorAmplification: true,
    motionBlur: 0,
    framesToAnalyze: 10,
  }
};

// Reducer for managing video processing state
function videoProcessingReducer(state, action) {
  switch (action.type) {
    case 'SET_VIDEO':
      return { 
        ...state, 
        videoFile: action.payload.file,
        videoUrl: action.payload.url,
        activeView: 'preview'
      };
    case 'SET_VIDEO_INFO':
      return { ...state, videoInfo: action.payload };
    case 'SET_FRAMES':
      return { ...state, videoFrames: action.payload };
    case 'SET_PROCESSED_FRAMES':
      return { ...state, processedFrames: action.payload };
    case 'SET_FREQUENCY_DATA':
      return { ...state, frequencyData: action.payload };
    case 'SET_MOTION_VECTORS':
      return { ...state, motionVectors: action.payload };
    case 'SET_PROCESSING_PROGRESS':
      return { ...state, processingProgress: action.payload };
    case 'SET_PROCESSING_STATE':
      return { ...state, processingState: action.payload };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_PLAYBACK_STATE':
      return { 
        ...state, 
        playbackState: {
          ...state.playbackState,
          ...action.payload
        }
      };
    case 'UPDATE_PROCESSING_PARAM':
      return { 
        ...state, 
        processingParams: {
          ...state.processingParams,
          [action.payload.param]: action.payload.value
        }
      };
    case 'RESET_PROCESSING_PARAMS':
      return { 
        ...state, 
        processingParams: initialState.processingParams
      };
    default:
      return state;
  }
}

// Create context for video processing
const VideoProcessingContext = createContext();

// Custom hook for using video processing context
function useVideoProcessing() {
  const context = useContext(VideoProcessingContext);
  if (!context) {
    throw new Error('useVideoProcessing must be used within a VideoProcessingProvider');
  }
  return context;
}

// Provider component for video processing context
function VideoProcessingProvider({ children }) {
  const [state, dispatch] = useReducer(videoProcessingReducer, initialState);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const beforeCanvasRef = useRef(null);
  const afterCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  
  // Handle video file upload
  const handleVideoUpload = useCallback((file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      dispatch({ 
        type: 'SET_VIDEO', 
        payload: { file, url } 
      });
    }
  }, []);
  
  // Extract video information when a video is loaded
  useEffect(() => {
    if (state.videoUrl && videoRef.current) {
      const video = videoRef.current;
      
      video.onloadedmetadata = () => {
        dispatch({
          type: 'SET_VIDEO_INFO',
          payload: {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            fps: 30, // Assume 30 fps initially
          }
        });
      };
    }
  }, [state.videoUrl]);
  
  // Extract frames from video
  const extractFrames = useCallback(async () => {
    if (!videoRef.current || !state.videoUrl) return [];
    
    dispatch({ type: 'SET_PROCESSING_STATE', payload: 'extracting' });
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Calculate frame extraction points
    const framesCount = state.processingParams.framesToAnalyze;
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
      
      // Update progress
      dispatch({ 
        type: 'SET_PROCESSING_PROGRESS', 
        payload: (i / framesCount) * 100 
      });
      
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
    
    dispatch({ type: 'SET_FRAMES', payload: frames });
    dispatch({ type: 'SET_PROCESSING_STATE', payload: 'ready' });
    
    return frames;
  }, [state.videoUrl, state.processingParams.framesToAnalyze]);
  
  // Process frames using Fourier transform
  const processFrames = useCallback(async () => {
    let frames = state.videoFrames;
    if (frames.length === 0) {
      frames = await extractFrames();
    }
    
    if (frames.length < 2) return;
    
    dispatch({ type: 'SET_PROCESSING_STATE', payload: 'processing' });
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'processing' });
    
    const processed = [];
    const frequencyDataArray = [];
    const motionVectorsArray = [];
    
    // Process each frame
    for (let i = 0; i < frames.length - 1; i++) {
      // Update progress
      dispatch({ 
        type: 'SET_PROCESSING_PROGRESS', 
        payload: (i / (frames.length - 1)) * 100 
      });
      
      // Get current and next frame
      const currentFrame = frames[i].imageData;
      const nextFrame = frames[i + 1].imageData;
      
      // Process frame pair using Fourier transform
      const { processedFrame, frequencyData, motionVectors } = await processFramePairWithFourier(
        currentFrame, 
        nextFrame, 
        state.processingParams
      );
      
      processed.push({
        time: frames[i].time,
        imageData: processedFrame,
      });
      
      frequencyDataArray.push(frequencyData);
      motionVectorsArray.push(motionVectors);
      
      // Small delay to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    dispatch({ type: 'SET_PROCESSED_FRAMES', payload: processed });
    dispatch({ type: 'SET_FREQUENCY_DATA', payload: frequencyDataArray });
    dispatch({ type: 'SET_MOTION_VECTORS', payload: motionVectorsArray });
    dispatch({ type: 'SET_PROCESSING_PROGRESS', payload: 100 });
    
    // Move to playback view after a delay
    setTimeout(() => {
      dispatch({ type: 'SET_PROCESSING_STATE', payload: 'completed' });
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'playback' });
    }, 500);
  }, [state.videoFrames, state.processingParams, extractFrames]);
  
  // Fourier transform processing implementation
  const processFramePairWithFourier = useCallback(async (frame1, frame2, params) => {
    const { amplificationFactor, lowFrequencyCutoff, highFrequencyCutoff, colorAmplification } = params;
    
    // Create new ImageData for the processed frame
    const processedFrame = new ImageData(
      new Uint8ClampedArray(frame1.data.length),
      frame1.width,
      frame1.height
    );
    
    // Convert frames to frequency domain (simplified simulation)
    // Note: In a real implementation, this would use a proper 2D FFT library
    const frequencyData = simulateFourierTransform(frame1, frame2);
    
    // Apply band-pass filtering in frequency domain
    const filteredData = applyBandPassFilter(frequencyData, lowFrequencyCutoff, highFrequencyCutoff);
    
    // Amplify motion in frequency domain
    const amplifiedData = amplifyMotionInFrequencyDomain(filteredData, amplificationFactor);
    
    // Convert back to spatial domain and create processed frame
    // In a real implementation, this would involve inverse FFT
    const motionVectors = simulateMotionVectors(frame1, frame2, params);
    
    // Simulate processed frame based on motion vectors
    for (let y = 0; y < frame1.height; y++) {
      for (let x = 0; x < frame1.width; x++) {
        const i = (y * frame1.width + x) * 4;
        
        // Get motion vector at this position
        const vector = motionVectors[y][x];
        const magnitude = Math.sqrt(vector.dx * vector.dx + vector.dy * vector.dy);
        
        // Apply amplification if motion is in the right frequency range
        if (magnitude > lowFrequencyCutoff && magnitude < highFrequencyCutoff) {
          // Calculate temporal gradient (frame difference)
          const dtR = frame2.data[i] - frame1.data[i];
          const dtG = frame2.data[i + 1] - frame1.data[i + 1];
          const dtB = frame2.data[i + 2] - frame1.data[i + 2];
          
          // Apply amplification
          if (colorAmplification) {
            processedFrame.data[i] = Math.min(255, Math.max(0, 
              frame1.data[i] + dtR * amplificationFactor * magnitude
            ));
            processedFrame.data[i + 1] = Math.min(255, Math.max(0, 
              frame1.data[i + 1] + dtG * amplificationFactor * magnitude
            ));
            processedFrame.data[i + 2] = Math.min(255, Math.max(0, 
              frame1.data[i + 2] + dtB * amplificationFactor * magnitude
            ));
          } else {
            // Luminance-only amplification
            const luminance = (0.299 * dtR + 0.587 * dtG + 0.114 * dtB) * amplificationFactor * magnitude;
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
    
    return { processedFrame, frequencyData, motionVectors };
  }, []);
  
  // Simulate Fourier transform for demonstration
  const simulateFourierTransform = (frame1, frame2) => {
    // In a real implementation, this would be a 2D FFT
    // For the prototype, we'll just create a placeholder object
    return {
      magnitude: [], // Would contain magnitude spectrum
      phase: [],     // Would contain phase spectrum
      width: frame1.width,
      height: frame1.height
    };
  };
  
  // Apply band-pass filter in frequency domain
  const applyBandPassFilter = (frequencyData, lowCutoff, highCutoff) => {
    // In a real implementation, this would filter frequencies
    // For the prototype, we'll just return the input
    return frequencyData;
  };
  
  // Amplify motion in frequency domain
  const amplifyMotionInFrequencyDomain = (frequencyData, factor) => {
    // In a real implementation, this would amplify phase changes
    // For the prototype, we'll just return the input
    return frequencyData;
  };
  
  // Simulate motion vector calculation
  const simulateMotionVectors = (frame1, frame2, params) => {
    const width = frame1.width;
    const height = frame1.height;
    const blockSize = 16; // Size of blocks for motion estimation
    
    // Create a 2D array to store motion vectors
    const vectors = Array(height).fill().map(() => Array(width).fill().map(() => ({ dx: 0, dy: 0 })));
    
    // Calculate motion vectors for each block
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // Calculate motion for current block (simplified)
        const dx = Math.random() * 2 - 1; // Random motion for demonstration
        const dy = Math.random() * 2 - 1;
        
        // Fill the block with this motion vector
        for (let by = 0; by < blockSize && y + by < height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
            vectors[y + by][x + bx] = { dx, dy };
          }
        }
      }
    }
    
    return vectors;
  };
  
  // Playback control functions
  const togglePlayback = useCallback(() => {
    dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: { isPlaying: !state.playbackState.isPlaying }
    });
  }, [state.playbackState.isPlaying]);
  
  const toggleDirection = useCallback(() => {
    dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: { direction: state.playbackState.direction * -1 }
    });
  }, [state.playbackState.direction]);
  
  const setPlaybackSpeed = useCallback((speed) => {
    dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: { speed }
    });
  }, []);
  
  const setCurrentFrame = useCallback((frameIndex) => {
    dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: { currentFrame: frameIndex }
    });
  }, []);
  
  // Update processing parameters
  const updateProcessingParam = useCallback((param, value) => {
    dispatch({
      type: 'UPDATE_PROCESSING_PARAM',
      payload: { param, value }
    });
  }, []);
  
  const resetProcessingParams = useCallback(() => {
    dispatch({ type: 'RESET_PROCESSING_PARAMS' });
  }, []);
  
  // Change view
  const setActiveView = useCallback((view) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
  }, []);
  
  // Playback animation
  useEffect(() => {
    if (state.processedFrames.length === 0 || !outputCanvasRef.current) return;
    
    const canvas = outputCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = state.videoInfo.width;
    canvas.height = state.videoInfo.height;
    
    // Function to render a specific frame
    const renderFrame = (frameIndex) => {
      if (frameIndex < 0 || frameIndex >= state.processedFrames.length) return;
      
      const frame = state.processedFrames[frameIndex];
      ctx.putImageData(frame.imageData, 0, 0);
    };
    
    // Animation loop
    const animate = (timestamp) => {
      // Calculate frame timing based on playback speed
      const frameTime = 1000 / (state.videoInfo.fps * state.playbackState.speed); 
      
      if (state.playbackState.isPlaying && timestamp - lastFrameTimeRef.current > frameTime) {
        lastFrameTimeRef.current = timestamp;
        
        // Calculate next frame index
        let nextFrame = state.playbackState.currentFrame + state.playbackState.direction;
        
        // Handle loop boundaries
        if (nextFrame >= state.processedFrames.length) {
          nextFrame = 0;
        } else if (nextFrame < 0) {
          nextFrame = state.processedFrames.length - 1;
        }
        
        // Update playback state
        dispatch({
          type: 'SET_PLAYBACK_STATE',
          payload: { currentFrame: nextFrame }
        });
        
        // Render the frame
        renderFrame(nextFrame);
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Render initial frame
    renderFrame(state.playbackState.currentFrame);
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    state.processedFrames, 
    state.videoInfo, 
    state.playbackState.isPlaying, 
    state.playbackState.currentFrame, 
    state.playbackState.direction, 
    state.playbackState.speed
  ]);
  
  // Provide context value
  const value = {
    state,
    videoRef,
    canvasRef,
    outputCanvasRef,
    beforeCanvasRef,
    afterCanvasRef,
    handleVideoUpload,
    extractFrames,
    processFrames,
    togglePlayback,
    toggleDirection,
    setPlaybackSpeed,
    setCurrentFrame,
    updateProcessingParam,
    resetProcessingParams,
    setActiveView
  };
  
  return (
    <VideoProcessingContext.Provider value={value}>
      {children}
    </VideoProcessingContext.Provider>
  );
}

// -----------------------------------------------------
// Main Component
// -----------------------------------------------------

const EnhancedMotionAmplification = () => {
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  
  const toggleFullscreen = () => {
    setFullscreenPreview(!fullscreenPreview);
  };
  
  return (
    <VideoProcessingProvider>
      <div className="bg-gray-100 min-h-screen">
        <div className={`transition-all duration-300 ${fullscreenPreview ? 'p-0' : 'p-4'}`}>
          <h1 className={`text-2xl font-bold mb-6 text-center ${fullscreenPreview ? 'hidden' : 'block'}`}>
            Enhanced Motion Analysis & Amplification
          </h1>
          
          <MainContent 
            fullscreenPreview={fullscreenPreview}
            toggleFullscreen={toggleFullscreen}
          />
        </div>
      </div>
    </VideoProcessingProvider>
  );
};

// -----------------------------------------------------
// Main Content Component
// -----------------------------------------------------

const MainContent = ({ fullscreenPreview, toggleFullscreen }) => {
  const { state, setActiveView } = useVideoProcessing();
  
  // Render tabs navigation
  const renderTabs = () => (
    <div className={`flex justify-center mb-6 ${fullscreenPreview ? 'hidden' : 'block'}`}>
      <div className="flex bg-white rounded-lg shadow overflow-hidden">
        <button 
          className={`flex items-center px-4 py-2 ${state.activeView === 'upload' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
          onClick={() => setActiveView('upload')}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </button>
        <button 
          className={`flex items-center px-4 py-2 ${state.activeView === 'preview' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
          onClick={() => state.videoUrl && setActiveView('preview')}
          disabled={!state.videoUrl}
        >
          <Settings className="w-4 h-4 mr-2" />
          Preview
        </button>
        <button 
          className={`flex items-center px-4 py-2 ${state.activeView === 'processing' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
          disabled={true}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Processing
        </button>
        <button 
          className={`flex items-center px-4 py-2 ${state.activeView === 'playback' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
          onClick={() => state.processedFrames.length > 0 && setActiveView('playback')}
          disabled={state.processedFrames.length === 0}
        >
          <Film className="w-4 h-4 mr-2" />
          Playback
        </button>
      </div>
    </div>
  );
  
  // Render main content area based on active view
  const renderContent = () => {
    const contentClass = `mx-auto bg-white rounded-lg shadow ${fullscreenPreview ? 'p-0' : 'p-6'} ${fullscreenPreview ? 'max-w-none' : 'max-w-4xl'}`;
    
    switch (state.activeView) {
      case 'upload':
        return (
          <div className={contentClass}>
            <VideoUploader />
          </div>
        );
      case 'preview':
        return (
          <div className={contentClass}>
            <VideoPreview 
              fullscreenPreview={fullscreenPreview}
              toggleFullscreen={toggleFullscreen}
            />
          </div>
        );
      case 'processing':
        return (
          <div className={contentClass}>
            <ProcessingView />
          </div>
        );
      case 'playback':
        return (
          <div className={contentClass}>
            <VideoPlayer 
              fullscreenPreview={fullscreenPreview}
              toggleFullscreen={toggleFullscreen}
            />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      {renderTabs()}
      {renderContent()}
    </>
  );
};

// -----------------------------------------------------
// Video Uploader Component
// -----------------------------------------------------

const VideoUploader = () => {
  const { handleVideoUpload } = useVideoProcessing();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      handleVideoUpload(file);
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
      handleVideoUpload(file);
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

// -----------------------------------------------------
// Video Preview Component
// -----------------------------------------------------

const VideoPreview = ({ fullscreenPreview, toggleFullscreen }) => {
  const { 
    state, 
    videoRef, 
    canvasRef, 
    extractFrames, 
    processFrames,
    updateProcessingParam,
    resetProcessingParams
  } = useVideoProcessing();
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // video, parameters, analysis
  
  const handleExtractFrames = async () => {
    setIsExtracting(true);
    await extractFrames();
    setIsExtracting(false);
  };
  
  // Display a preview frame when available
  useEffect(() => {
    if (state.videoFrames.length > 0 && canvasRef.current) {
      const frameIndex = Math.min(1, state.videoFrames.length - 1);
      setSelectedFrame(frameIndex);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = state.videoFrames[frameIndex].imageData.width;
      canvas.height = state.videoFrames[frameIndex].imageData.height;
      
      ctx.putImageData(state.videoFrames[frameIndex].imageData, 0, 0);
    }
  }, [state.videoFrames]);
  
  // Render video preview content
  const renderVideoPreview = () => (
    <div className={`${fullscreenPreview ? '' : 'bg-gray-50 p-4 rounded-lg'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Video Preview</h3>
        <button
          onClick={toggleFullscreen}
          className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
          title={fullscreenPreview ? "Exit Fullscreen" : "Fullscreen Mode"}
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      
      <div className="aspect-video bg-black rounded relative overflow-hidden">
        {state.videoFrames.length > 0 && selectedFrame !== null ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />
        ) : (
          <video 
            ref={videoRef}
            src={state.videoUrl}
            className="w-full h-full"
            controls
          />
        )}
      </div>
      
      {state.videoInfo.width > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <p>Resolution: {state.videoInfo.width} × {state.videoInfo.height}</p>
          <p>Duration: {state.videoInfo.duration.toFixed(2)} seconds</p>
        </div>
      )}
      
      <div className="mt-4">
        {state.videoFrames.length === 0 ? (
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
              {state.videoFrames.length} frames extracted. Use the processor to analyze motion patterns.
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
                Frame {selectedFrame !== null ? selectedFrame + 1 : 0} of {state.videoFrames.length}
              </span>
              <button
                onClick={() => setSelectedFrame(prev => Math.min(state.videoFrames.length - 1, prev + 1))}
                disabled={selectedFrame >= state.videoFrames.length - 1}
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
  
  // Render processing parameters
  const renderParameters = () => (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Amplification Factor: {state.processingParams.amplificationFactor.toFixed(1)}×
          </label>
          <button
            onClick={() => updateProcessingParam('amplificationFactor', 2.0)}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to 2.0`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.1"
          value={state.processingParams.amplificationFactor}
          onChange={(e) => updateProcessingParam('amplificationFactor', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          How much to amplify detected movements
        </p>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Low Frequency Cutoff: {state.processingParams.lowFrequencyCutoff.toFixed(2)}
          </label>
          <button
            onClick={() => updateProcessingParam('lowFrequencyCutoff', 0.1)}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to 0.1`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="0.05"
          max="0.5"
          step="0.01"
          value={state.processingParams.lowFrequencyCutoff}
          onChange={(e) => updateProcessingParam('lowFrequencyCutoff', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Lower bound for frequencies to amplify
        </p>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            High Frequency Cutoff: {state.processingParams.highFrequencyCutoff.toFixed(2)}
          </label>
          <button
            onClick={() => updateProcessingParam('highFrequencyCutoff', 0.5)}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to 0.5`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="0.5"
          max="1.0"
          step="0.01"
          value={state.processingParams.highFrequencyCutoff}
          onChange={(e) => updateProcessingParam('highFrequencyCutoff', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Upper bound for frequencies to amplify
        </p>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            <span>Color Amplification</span>
          </label>
          <button
            onClick={() => updateProcessingParam('colorAmplification', true)}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to enabled`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={state.processingParams.colorAmplification}
            onChange={(e) => updateProcessingParam('colorAmplification', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            {state.processingParams.colorAmplification ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Amplify color changes in addition to movement
        </p>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Motion Blur: {state.processingParams.motionBlur}
          </label>
          <button
            onClick={() => updateProcessingParam('motionBlur', 0)}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to 0`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={state.processingParams.motionBlur}
          onChange={(e) => updateProcessingParam('motionBlur', parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Smoothing applied to motion trails
        </p>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Preview Frames: {state.processingParams.framesToAnalyze}
          </label>
          <button
            onClick={() => updateProcessingParam('framesToAnalyze', 10)}
            className="text-xs text-gray-500 hover:text-blue-500"
            title={`Reset to 10`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="range"
          min="2"
          max="30"
          step="1"
          value={state.processingParams.framesToAnalyze}
          onChange={(e) => updateProcessingParam('framesToAnalyze', parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Number of frames to extract for preview
        </p>
      </div>
      
      <div className="pt-2">
        <button
          onClick={resetProcessingParams}
          className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Parameters
        </button>
      </div>
    </div>
  );
  
  // Render analysis information
  const renderAnalysis = () => (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div>
        <h3 className="font-medium mb-2">Motion Amplification Technique</h3>
        <p className="text-sm text-gray-700">
          This tool uses Fourier transforms to isolate and amplify subtle movements in videos that would otherwise be invisible to the naked eye. By analyzing changes in the frequency domain, we can selectively enhance specific types of motion.
        </p>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-medium mb-2">How It Works</h3>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>
            <strong>Convert to Frequency Domain:</strong> Each frame is transformed to reveal motion patterns at different frequencies
          </li>
          <li>
            <strong>Band-Pass Filtering:</strong> Only frequencies within your specified range are selected for amplification
          </li>
          <li>
            <strong>Amplification:</strong> Motion is enhanced based on your amplification factor
          </li>
          <li>
            <strong>Reconstruction:</strong> Frames are converted back to the spatial domain to create the final video
          </li>
        </ol>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-medium mb-2">Tips for Best Results</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Use a stable camera to minimize unwanted movement</li>
          <li>Start with low amplification factors (2-3x) and gradually increase</li>
          <li>Adjust frequency cutoffs to isolate the motion of interest</li>
          <li>For structural vibrations, set a lower frequency range (0.1-0.3)</li>
          <li>For faster movements, use a higher frequency range (0.3-0.8)</li>
        </ul>
      </div>
    </div>
  );
  
  if (fullscreenPreview) {
    return renderVideoPreview();
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3">
          {/* Tabs for mobile */}
          <div className="md:hidden mb-4">
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                className={`flex-1 py-2 px-3 text-sm ${activeTab === 'video' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                onClick={() => setActiveTab('video')}
              >
                Preview
              </button>
              <button
                className={`flex-1 py-2 px-3 text-sm ${activeTab === 'parameters' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                onClick={() => setActiveTab('parameters')}
              >
                Controls
              </button>
              <button
                className={`flex-1 py-2 px-3 text-sm ${activeTab === 'analysis' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                onClick={() => setActiveTab('analysis')}
              >
                Info
              </button>
            </div>
          </div>
          
          {/* Video preview (always visible on desktop, conditionally on mobile) */}
          <div className={`${activeTab === 'video' ? 'block' : 'hidden md:block'}`}>
            {renderVideoPreview()}
          </div>
        </div>
        
        <div className="md:w-1/3">
          {/* Parameters and Analysis (tabs on mobile, stacked on desktop) */}
          <div className="hidden md:block space-y-4">
            <h3 className="font-medium">Processing Parameters</h3>
            {renderParameters()}
            
            <h3 className="font-medium mt-6">Analysis Information</h3>
            {renderAnalysis()}
          </div>
          
          {/* Mobile-only tab contents */}
          <div className="md:hidden">
            {activeTab === 'parameters' && (
              <div>
                <h3 className="font-medium mb-3">Processing Parameters</h3>
                {renderParameters()}
              </div>
            )}
            
            {activeTab === 'analysis' && (
              <div>
                <h3 className="font-medium mb-3">Analysis Information</h3>
                {renderAnalysis()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button 
          onClick={processFrames}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          disabled={state.videoFrames.length === 0}
        >
          <Play className="w-4 h-4 mr-2" />
          Process Video
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// Processing View Component
// -----------------------------------------------------

const ProcessingView = () => {
  const { state } = useVideoProcessing();
  
  // Processing stages
  const stages = [
    { name: "Extracting frames", complete: state.processingProgress >= 20 },
    { name: "Frequency domain conversion", complete: state.processingProgress >= 40 },
    { name: "Applying band-pass filter", complete: state.processingProgress >= 60 },
    { name: "Amplifying motion", complete: state.processingProgress >= 80 },
    { name: "Reconstructing frames", complete: state.processingProgress >= 95 }
  ];
  
  // Current stage
  const currentStage = Math.min(4, Math.floor(state.processingProgress / 20));
  
  return (
    <div className="text-center py-8">
      <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
      <h3 className="text-xl font-medium mb-2">Processing Video</h3>
      <p className="text-gray-600 mb-4">Analyzing and amplifying motion patterns...</p>
      
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4 max-w-md mx-auto">
        <div 
          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${state.processingProgress}%` }}
        ></div>
      </div>
      
      <p className="text-gray-500 mb-6">
        Processing {Math.round(state.processingProgress)}% complete
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
      
      {state.videoInfo.width > 0 && (
        <div className="mt-8 text-sm text-gray-600 max-w-sm mx-auto p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Video Information</h4>
          <p>Resolution: {state.videoInfo.width} × {state.videoInfo.height}</p>
          <p>Duration: {state.videoInfo.duration.toFixed(2)} seconds</p>
          <p className="mt-2 text-xs text-gray-500">Processing using Fourier transformation for optimal motion detection.</p>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------
// Video Player Component with Before/After Comparison
// -----------------------------------------------------

const VideoPlayer = ({ fullscreenPreview, toggleFullscreen }) => {
  const { 
    state, 
    outputCanvasRef,
    beforeCanvasRef,
    afterCanvasRef,
    togglePlayback, 
    toggleDirection, 
    setPlaybackSpeed,
    setCurrentFrame
  } = useVideoProcessing();
  
  const [comparisonMode, setComparisonMode] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [visualizationMode, setVisualizationMode] = useState('playback'); // playback, compare, frequency, motion
  const containerRef = useRef(null);
  
  // Handle slider position change
  const handleSliderChange = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };
  
  // Render comparison slider
  const renderComparisonSlider = () => {
    // In a real implementation, we would draw the original and processed frames
    // For this prototype, we'll just show the UI structure
    return (
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black rounded overflow-hidden cursor-col-resize"
        onMouseMove={handleSliderChange}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleSliderChange({ clientX: touch.clientX });
        }}
      >
        {/* Original video (shown on left side of slider) */}
        <div 
          className="absolute inset-0 overflow-hidden" 
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <canvas
            ref={beforeCanvasRef}
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Original
          </div>
        </div>
        
        {/* Processed video (shown on right side of slider) */}
        <div 
          className="absolute inset-0 overflow-hidden" 
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <canvas
            ref={afterCanvasRef}
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Processed
          </div>
        </div>
        
        {/* Slider handle */}
        <div
          className="absolute inset-y-0 w-1 bg-white cursor-col-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <div className="flex flex-col gap-1">
              <ArrowLeft className="w-3 h-3" />
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render visualization tabs
  const renderVisualizationTabs = () => {
    if (fullscreenPreview) return null;
    
    return (
      <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-4">
        <button
          className={`flex items-center py-2 px-4 text-sm ${visualizationMode === 'playback' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setVisualizationMode('playback')}
        >
          <Film className="w-4 h-4 mr-2" />
          Playback
        </button>
        <button
          className={`flex items-center py-2 px-4 text-sm ${visualizationMode === 'compare' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setVisualizationMode('compare')}
        >
          <Sliders className="w-4 h-4 mr-2" />
          Compare
        </button>
        <button
          className={`flex items-center py-2 px-4 text-sm ${visualizationMode === 'frequency' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setVisualizationMode('frequency')}
        >
          <Layers className="w-4 h-4 mr-2" />
          Frequency
        </button>
        <button
          className={`flex items-center py-2 px-4 text-sm ${visualizationMode === 'motion' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          onClick={() => setVisualizationMode('motion')}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Motion
        </button>
      </div>
    );
  };
  
  // Render playback controls
  const renderPlaybackControls = () => (
    <div className="mt-4">
      {/* Scrubber */}
      <input
        type="range"
        min="0"
        max={state.processedFrames.length - 1}
        value={state.playbackState.currentFrame}
        onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
        className="w-full"
      />
      
      {/* Frame counter */}
      <div className="text-sm text-gray-600 mb-2 text-center">
        Frame {state.playbackState.currentFrame + 1} of {state.processedFrames.length}
      </div>
      
      {/* Playback controls */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentFrame(0)}
            className="p-2 rounded hover:bg-gray-100"
            title="Skip to Start"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleDirection}
            className={`p-2 rounded hover:bg-gray-100 ${state.playbackState.direction < 0 ? 'text-blue-500' : ''}`}
            title={state.playbackState.direction < 0 ? "Playing Backwards" : "Playing Forwards"}
          >
            {state.playbackState.direction < 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          <button
            onClick={togglePlayback}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            title={state.playbackState.isPlaying ? "Pause" : "Play"}
          >
            {state.playbackState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setCurrentFrame(state.processedFrames.length - 1)}
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
            onClick={() => setPlaybackSpeed(speed)}
            className={`px-2 py-1 rounded-md text-sm ${state.playbackState.speed === speed ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            title={`${speed}x Speed`}
          >
            {speed}×
          </button>
        ))}
      </div>
    </div>
  );
  
  // Render frequency visualization
  const renderFrequencyVisualization = () => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-3">Frequency Domain Visualization</h3>
      <div className="aspect-video bg-gray-800 rounded relative flex items-center justify-center">
        <p className="text-white">This would show the frequency spectrum of the current frame</p>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Showing frequency components that were amplified during processing. Brighter areas represent frequencies with more motion.
      </p>
    </div>
  );
  
  // Render motion vector visualization
  const renderMotionVisualization = () => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-3">Motion Vector Visualization</h3>
      <div className="aspect-video bg-gray-800 rounded relative flex items-center justify-center">
        <p className="text-white">This would show motion vectors overlaid on the frame</p>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Arrows indicate direction and magnitude of detected motion. Color indicates amplification strength.
      </p>
    </div>
  );
  
  // Render main content based on visualization mode
  const renderMainContent = () => {
    switch (visualizationMode) {
      case 'playback':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <canvas 
              ref={outputCanvasRef}
              className="w-full aspect-video object-contain"
            />
          </div>
        );
      case 'compare':
        return renderComparisonSlider();
      case 'frequency':
        return renderFrequencyVisualization();
      case 'motion':
        return renderMotionVisualization();
      default:
        return null;
    }
  };
  
  // Main component render
  return (
    <div className={isNaN(fullscreenPreview) ? 'space-y-4' : ''}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Processed Video</h3>
        <button
          onClick={toggleFullscreen}
          className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
          title={fullscreenPreview ? "Exit Fullscreen" : "Fullscreen Mode"}
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      
      {renderVisualizationTabs()}
      {renderMainContent()}
      {renderPlaybackControls()}
      
      {!fullscreenPreview && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-2">Analysis Notes</h4>
              <p className="text-sm text-gray-600">
                The processed video highlights motion patterns by amplifying frequency components between
                {` ${state.processingParams.lowFrequencyCutoff.toFixed(2)}`} and
                {` ${state.processingParams.highFrequencyCutoff.toFixed(2)}`}. 
                Subtle movements that may be invisible to the naked eye have been enhanced by
                {` ${state.processingParams.amplificationFactor.toFixed(1)}×`}.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Use the comparison view to see the original vs. processed video side by side. The frequency
                and motion vector views provide additional insights into what's being amplified.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMotionAmplification;