import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  Play, 
  Pause, 
  Settings, 
  Film, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  FastForward, 
  SkipBack, 
  SkipForward,
  Square, 
  X,
  Info,
  Download,
  Share2,
  Maximize2,
  Clock,
  Zap,
  Sliders,
  Building,
  Activity,
  Wind,
  Vibrate
} from 'lucide-react';

const MotionAmplification = () => {
  // State for different views
  const [activeView, setActiveView] = useState('upload'); // upload, preview, processing, playback
  
  // State for video data
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoFrames, setVideoFrames] = useState([]);
  const [processedFrames, setProcessedFrames] = useState([]);
  const [videoInfo, setVideoInfo] = useState({ width: 0, height: 0, duration: 0, fps: 30 });
  
  // State for processing parameters
  const [params, setParams] = useState({
    vectorThreshold: 0.05,
    pixelAmplification: 2.0,
    sensitivityRange: [0.1, 0.5],
    colorAmplification: true,
    motionBlur: 0,
    framesToAnalyze: 10, // Number of frames to use for preview
  });
  
  // State for mobile UI
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [bottomSheetTab, setBottomSheetTab] = useState('params');
  const [showTooltip, setShowTooltip] = useState(null);
  
  // Processing state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);
  
  // Playback state
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentFrame: 0,
    direction: 1, // 1 for forward, -1 for reverse
    speed: 1,
  });
  
  // Comparison view state
  const [showOriginal, setShowOriginal] = useState(false);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [fullscreen, setFullscreen] = useState(false);
  
  // Refs for video elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const bottomSheetRef = useRef(null);
  
  // Animation refs
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  
  // Touch gesture refs
  const startY = useRef(null);
  const currentY = useRef(null);
  const touchStartX = useRef(null);
  
  // Real-world examples data
  const realWorldExamples = [
    {
      id: 'building-sway',
      title: 'Building Sway Analysis',
      icon: Building,
      description: 'Detect and visualize subtle building movements caused by wind or structural factors.',
      longDescription: 'Tall buildings naturally sway due to wind forces, thermal expansion, and even earth's rotation. This movement is usually too subtle to see with the naked eye but can be detected and analyzed with motion amplification. Engineers use this technique to verify that building movement falls within design parameters.',
      settings: {
        vectorThreshold: 0.01,
        pixelAmplification: 20,
        sensitivityRange: [0.01, 0.1],
        colorAmplification: false,
        motionBlur: 1
      },
      recommendedSource: 'Stationary camera capturing the side of a tall building on a windy day',
      beforeImageUrl: '/api/placeholder/480/320',
      afterImageUrl: '/api/placeholder/480/320',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'pulse-detection',
      title: 'Pulse & Blood Flow',
      icon: Activity,
      description: 'Amplify microscopic skin changes to visualize blood flow and heartbeat.',
      longDescription: 'Human skin undergoes subtle color and positional changes as blood pulses through vessels. Motion amplification can enhance these changes, visualizing blood flow patterns and heart rate without physical contact. This non-invasive technique has applications in monitoring, biometrics, and sports medicine.',
      settings: {
        vectorThreshold: 0.01,
        pixelAmplification: 10,
        sensitivityRange: [0.01, 0.2],
        colorAmplification: true,
        motionBlur: 0
      },
      recommendedSource: 'Close-up video of face, wrist, or other area with visible skin/blood vessels in good lighting',
      beforeImageUrl: '/api/placeholder/480/320',
      afterImageUrl: '/api/placeholder/480/320',
      bgColor: 'bg-red-50'
    },
    {
      id: 'bridge-deflection',
      title: 'Bridge Deflection',
      icon: Wind,
      description: 'Observe how bridges flex and respond to traffic loads and wind forces.',
      longDescription: 'Bridges are designed to flex under load, but excessive or asymmetric deflection can indicate structural issues. Motion amplification allows engineers to visualize these movements and compare them to design specifications, potentially identifying problems before they become visible damage.',
      settings: {
        vectorThreshold: 0.02,
        pixelAmplification: 25,
        sensitivityRange: [0.02, 0.15],
        colorAmplification: false,
        motionBlur: 1
      },
      recommendedSource: 'Stationary camera capturing the bridge span, ideally when vehicles are crossing',
      beforeImageUrl: '/api/placeholder/480/320',
      afterImageUrl: '/api/placeholder/480/320',
      bgColor: 'bg-green-50'
    },
    {
      id: 'machine-vibration',
      title: 'Machine Vibration',
      icon: Vibrate,
      description: 'Identify abnormal vibrations in industrial equipment for preventative maintenance.',
      longDescription: 'All operating machinery produces vibrations, but changes in these patterns can indicate wear, misalignment, or impending failure. Motion amplification makes these vibrations visible, allowing maintenance teams to identify issues before they result in catastrophic failures, saving time and maintenance costs.',
      settings: {
        vectorThreshold: 0.02,
        pixelAmplification: 15,
        sensitivityRange: [0.05, 0.3],
        colorAmplification: false,
        motionBlur: 2
      },
      recommendedSource: 'Stationary camera focused on operating equipment, preferably with stable lighting',
      beforeImageUrl: '/api/placeholder/480/320',
      afterImageUrl: '/api/placeholder/480/320',
      bgColor: 'bg-yellow-50'
    }
  ];
  
  // Parameter tooltip content
  const tooltips = {
    vectorThreshold: (
      <div>
        <h4 className="font-medium mb-1">Vector Threshold</h4>
        <p className="text-xs">Sets minimum movement required to trigger amplification. Lower values catch subtler motion but may amplify noise.</p>
      </div>
    ),
    pixelAmplification: (
      <div>
        <h4 className="font-medium mb-1">Amplification Factor</h4>
        <p className="text-xs">Controls how much detected motion is enhanced. Higher values make motion more visible but may introduce artifacts.</p>
      </div>
    ),
    sensitivityRange: (
      <div>
        <h4 className="font-medium mb-1">Sensitivity Range</h4>
        <p className="text-xs">Defines which motion magnitudes to amplify. Useful for targeting specific types of movement while ignoring others.</p>
      </div>
    ),
    colorAmplification: (
      <div>
        <h4 className="font-medium mb-1">Color Amplification</h4>
        <p className="text-xs">Enhances color changes alongside motion. Useful for pulse detection and thermal changes.</p>
      </div>
    ),
    motionBlur: (
      <div>
        <h4 className="font-medium mb-1">Motion Blur</h4>
        <p className="text-xs">Adds blur to emphasize direction of movement. Higher values create more pronounced motion trails.</p>
      </div>
    )
  };

  // ==========================================
  // VIDEO UPLOAD AND INFORMATION HANDLING
  // ==========================================
  
  // Handle video file upload
  const handleVideoUpload = (file) => {
    if (file && file.type.startsWith('video/')) {
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
  
  // ==========================================
  // FRAME EXTRACTION - FIXED BLACK BACKGROUND ISSUE
  // ==========================================
  
  // Extract frames from video for preview - IMPROVED VERSION
  const extractFrames = async () => {
    if (!videoRef.current || !videoUrl) return;
    
    try {
      const video = videoRef.current;
      
      // Create an offscreen canvas for extraction
      const offscreenCanvas = document.createElement('canvas');
      // Use alpha: false to prevent transparency issues
      const ctx = offscreenCanvas.getContext('2d', { alpha: false });
      
      // Set canvas dimensions to match video
      offscreenCanvas.width = video.videoWidth;
      offscreenCanvas.height = video.videoHeight;
      
      // Calculate frame extraction points
      const framesCount = params.framesToAnalyze;
      const frames = [];
      
      // Wait for video to be ready
      await new Promise(resolve => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.onloadeddata = resolve;
        }
      });
      
      // Extract frames at regular intervals
      for (let i = 0; i < framesCount; i++) {
        // Update progress
        setProcessingProgress(Math.round((i / framesCount) * 100));
        
        // Set video to specific time
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
        
        // Clear canvas with white background - FIXES BLACK BACKGROUND ISSUE
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        
        // Draw the current video frame
        ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        
        // Generate thumbnail for UI
        const thumbnailUrl = offscreenCanvas.toDataURL('image/jpeg', 0.7);
        
        frames.push({
          time,
          imageData,
          thumbnailUrl,
          width: offscreenCanvas.width,
          height: offscreenCanvas.height
        });
        
        // Add a small delay to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setVideoFrames(frames);
      setProcessingProgress(100);
      
      // Display the first frame in the preview canvas
      if (frames.length > 0 && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        
        // Set canvas dimensions
        canvas.width = frames[0].width;
        canvas.height = frames[0].height;
        
        // Clear with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the frame
        ctx.putImageData(frames[0].imageData, 0, 0);
      }
      
      return frames;
    } catch (error) {
      console.error('Error extracting frames:', error);
      return [];
    }
  };
  
  // ==========================================
  // MOTION PROCESSING FUNCTIONS
  // ==========================================
  
  // Process frames using vector decomposition and mean pixel analysis
  const processVideoFrames = async () => {
    setIsProcessing(true);
    setProcessingStartTime(Date.now());
    setProcessingProgress(0);
    
    try {
      // Extract frames if not already done
      let frames = videoFrames;
      if (frames.length === 0) {
        frames = await extractFrames();
      }
      
      // Process the frames
      const processed = [];
      
      // Use a temporary canvas for processing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { alpha: false });
      tempCanvas.width = videoInfo.width;
      tempCanvas.height = videoInfo.height;
      
      // Start worker processing if supported by browser
      const deviceCapabilities = detectDeviceCapabilities();
      const useWorker = deviceCapabilities.useWebWorker && window.Worker;
      
      // Process frames sequentially (could be parallelized with web workers for better performance)
      for (let i = 0; i < frames.length - 1; i++) {
        // Update progress
        setProcessingProgress((i / (frames.length - 1)) * 100);
        
        // Update elapsed time display
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - processingStartTime) / 1000);
        setProcessingTime(elapsedSeconds);
        
        // Get current and next frame
        const currentFrame = frames[i].imageData;
        const nextFrame = frames[i + 1].imageData;
        
        // Process using vector decomposition
        const processedFrame = processFramePair(currentFrame, nextFrame, params);
        
        // Generate thumbnail for UI
        tempCtx.putImageData(processedFrame, 0, 0);
        const thumbnailUrl = tempCanvas.toDataURL('image/jpeg', 0.7);
        
        processed.push({
          time: frames[i].time,
          imageData: processedFrame,
          thumbnailUrl,
          width: processedFrame.width,
          height: processedFrame.height
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
  
  // ==========================================
  // BOTTOM SHEET HANDLING (MOBILE UI)
  // ==========================================
  
  // Handle touch gestures for bottom sheet
  const handleBottomSheetTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };
  
  const handleBottomSheetTouchMove = (e) => {
    if (!startY.current || !bottomSheetRef.current) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    // Only allow dragging downward to close
    if (deltaY > 0) {
      // Calculate percentage of sheet height
      const bottomSheet = bottomSheetRef.current;
      const percentage = deltaY / bottomSheet.clientHeight;
      
      // Apply transform with dampening
      const translateY = deltaY * 0.5;
      bottomSheet.style.transform = `translateY(${translateY}px)`;
      bottomSheet.style.opacity = 1 - percentage * 0.5;
    }
  };
  
  const handleBottomSheetTouchEnd = () => {
    if (!startY.current || !currentY.current || !bottomSheetRef.current) {
      startY.current = null;
      currentY.current = null;
      return;
    }
    
    // Calculate if we should close based on how far the user dragged
    const deltaY = currentY.current - startY.current;
    const bottomSheet = bottomSheetRef.current;
    
    if (deltaY > bottomSheet.clientHeight * 0.3) {
      // Close the bottom sheet
      setShowBottomSheet(false);
    } else {
      // Reset position
      bottomSheet.style.transform = `translateY(0)`;
      bottomSheet.style.opacity = 1;
    }
    
    startY.current = null;
    currentY.current = null;
  };
  
  // ==========================================
  // DEVICE CAPABILITY DETECTION (ADAPTIVE LOADING)
  // ==========================================
  
  // Detect device capabilities and adjust processing accordingly
  const detectDeviceCapabilities = () => {
    const capabilities = {
      isHighEnd: false,
      maxVideoSize: { width: 640, height: 480 },
      maxFrames: 30,
      useWebWorker: false
    };
    
    // Check available memory (if available in browser)
    if (navigator.deviceMemory) {
      capabilities.isHighEnd = navigator.deviceMemory >= 4; // 4GB+ RAM
      
      if (navigator.deviceMemory >= 8) {
        capabilities.maxVideoSize = { width: 1280, height: 720 };
        capabilities.maxFrames = 100;
        capabilities.useWebWorker = true;
      } else if (navigator.deviceMemory >= 4) {
        capabilities.maxVideoSize = { width: 854, height: 480 };
        capabilities.maxFrames = 60;
        capabilities.useWebWorker = true;
      }
    } else {
      // Fallback detection based on navigator.hardwareConcurrency
      const cores = navigator.hardwareConcurrency || 2;
      
      if (cores >= 4) {
        capabilities.isHighEnd = true;
        capabilities.maxVideoSize = { width: 854, height: 480 };
        capabilities.maxFrames = 60;
        capabilities.useWebWorker = true;
      }
    }
    
    // Check if running on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Reduce video size for mobile devices
      capabilities.maxVideoSize = { width: 480, height: 360 };
      capabilities.maxFrames = 30;
    }
    
    return capabilities;
  };
  
  // ==========================================
  // PLAYBACK AND RESULTS HANDLING
  // ==========================================
  
  // Draw frame to canvas
  const drawFrame = (frameData, canvasRef) => {
    if (!canvasRef.current || !frameData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // Prevent transparency issues
    
    // Set canvas dimensions
    canvas.width = frameData.width || frameData.imageData.width;
    canvas.height = frameData.height || frameData.imageData.height;
    
    // Clear canvas with white background to prevent black background issues
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw frame
    if (frameData.imageData) {
      ctx.putImageData(frameData.imageData, 0, 0);
    } else if (frameData.dataUrl) {
      // For optimized storage that uses compressed images
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = frameData.dataUrl;
    }
  };
  
  // Update canvas when frame changes in playback
  useEffect(() => {
    const { currentFrame } = playbackState;
    
    if (activeView === 'playback') {
      if (originalFrames && originalFrames.length > currentFrame) {
        drawFrame(originalFrames[currentFrame], originalCanvasRef);
      }
      
      if (processedFrames && processedFrames.length > currentFrame) {
        drawFrame(processedFrames[currentFrame], processedCanvasRef);
      }
    }
  }, [playbackState.currentFrame, activeView]);
  
  // Playback animation loop
  useEffect(() => {
    if (activeView !== 'playback' || !playbackState.isPlaying) return;
    
    const animate = (timestamp) => {
      const frameTime = 1000 / (videoInfo.fps * playbackState.speed); 
      
      if (timestamp - lastFrameTimeRef.current > frameTime) {
        lastFrameTimeRef.current = timestamp;
        
        // Update frame based on direction
        setPlaybackState(prev => {
          let nextFrame = prev.currentFrame + prev.direction;
          
          // Loop back when reaching boundaries
          if (nextFrame >= processedFrames.length) {
            nextFrame = 0;
          } else if (nextFrame < 0) {
            nextFrame = processedFrames.length - 1;
          }
          
          return {
            ...prev,
            currentFrame: nextFrame
          };
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeView, playbackState.isPlaying, playbackState.speed, processedFrames?.length, videoInfo.fps]);
  
  // Handle fullscreen for results viewer
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  
  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // ==========================================
  // TOUCH GESTURE HANDLING (MOBILE FRIENDLY)
  // ==========================================
  
  // Handle touch gestures for swiping between frames
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    
    // If swipe distance is significant, navigate frames
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous frame
        setPlaybackState(prev => ({
          ...prev,
          currentFrame: Math.max(0, prev.currentFrame - 1)
        }));
      } else {
        // Swipe left - next frame
        setPlaybackState(prev => ({
          ...prev,
          currentFrame: Math.min(processedFrames.length - 1, prev.currentFrame + 1)
        }));
      }
    }
    
    touchStartX.current = null;
  };
  
  // ==========================================
  // COMPONENT RENDERING HELPERS
  // ==========================================
  
  // Export current frame
  const exportCurrentFrame = () => {
    if (!processedCanvasRef.current) return;
    
    const canvas = processedCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `motion-amplified-${timestamp}.jpg`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format processing time for display
  const formatProcessingTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // ==========================================
  // UI COMPONENT RENDERERS
  // ==========================================
  
  // 1. Video Upload Component
  const VideoUploader = () => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('video/')) {
        handleVideoUpload(file);
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
        handleVideoUpload(file);
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
        <p className="text-gray-500 mb-4">Drag and drop a video file here, or tap to select</p>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />
        
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose File
          </button>
          
          <button
            type="button"
            onClick={() => alert('Camera capture would open here')}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center justify-center"
          >
            <Camera className="w-4 h-4 mr-2" />
            Record Video
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">
          Supported formats: MP4, WebM, MOV
        </p>
      </div>
    );
  };
  
  // 2. Video Preview Component
  const VideoPreview = () => {
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
        const ctx = canvas.getContext('2d', { alpha: false });
        
        canvas.width = videoFrames[frameIndex].width;
        canvas.height = videoFrames[frameIndex].height;
        
        // Clear with white background (prevents black background)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
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
  
  // 3. Parameter Controls Component (Mobile-optimized)
  const ParameterControls = () => {
    // Mobile view toggle for parameter controls
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Processing Parameters</h3>
          <button
            onClick={() => setShowBottomSheet(true)}
            className="flex items-center text-sm text-blue-600"
          >
            <Sliders className="w-4 h-4 mr-1" />
            Adjust All
          </button>
        </div>
        
        {/* Preview of current parameters */}
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
            <div className="flex justify-between">
              <span>Threshold:</span>
              <span className="font-medium">{params.vectorThreshold.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Amplify:</span>
              <span className="font-medium">{params.pixelAmplification.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between">
              <span>Range:</span>
              <span className="font-medium">[{params.sensitivityRange[0].toFixed(1)}, {params.sensitivityRange[1].toFixed(1)}]</span>
            </div>
            <div className="flex justify-between">
              <span>Color:</span>
              <span className="font-medium">{params.colorAmplification ? 'On' : 'Off'}</span>
            </div>
            <div className="flex justify-between">
              <span>Blur:</span>
              <span className="font-medium">{params.motionBlur}</span>
            </div>
          </div>
        </div>
        
        {/* Main Parameter that's most important */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Amplification Factor</label>
            <span className="text-sm font-medium">{params.pixelAmplification.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            step="0.5"
            value={params.pixelAmplification}
            onChange={(e) => setParams({
              ...params,
              pixelAmplification: parseFloat(e.target.value)
            })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtle (2x)</span>
            <span>Standard (10x)</span>
            <span>Dramatic (25x)</span>
          </div>
        </div>
        
        {/* Process button */}
        <button
          onClick={() => {
            setActiveView('processing');
            setTimeout(processVideoFrames, 100);
          }}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center"
        >
          <Zap className="w-5 h-5 mr-2" />
          Process Video
        </button>
      </div>
    );
  };
  
  // 4. Real-world Examples Component
  const RealWorldExamplesComponent = () => {
    const [selectedExample, setSelectedExample] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
    const carouselRef = useRef(null);
    
    // Handle example selection
    const handleSelectExample = (example) => {
      setSelectedExample(example);
      setShowInfoModal(true);
    };
    
    // Apply settings from example
    const applySettings = (settings) => {
      setParams(settings);
      setShowInfoModal(false);
    };
    
    // Handle carousel navigation
    const scrollToIndex = (index) => {
      if (index < 0) index = 0;
      if (index >= realWorldExamples.length) index = realWorldExamples.length - 1;
      
      setCurrentExampleIndex(index);
      
      if (carouselRef.current) {
        const scrollWidth = carouselRef.current.scrollWidth;
        const containerWidth = carouselRef.current.clientWidth;
        const itemWidth = scrollWidth / realWorldExamples.length;
        
        carouselRef.current.scrollTo({
          left: itemWidth * index,
          behavior: 'smooth'
        });
      }
    };
    
    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-3">Real-World Applications</h3>
        
        {/* Mobile carousel view */}
        <div className="relative">
          <div 
            ref={carouselRef}
            className="flex overflow-x-scroll snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {realWorldExamples.map((example) => (
              <div 
                key={example.id}
                className="flex-shrink-0 w-full snap-center px-2"
              >
                <div 
                  className={`rounded-xl p-4 ${example.bgColor} shadow-sm`}
                  onClick={() => handleSelectExample(example)}
                >
                  <div className="flex items-center mb-3">
                    <example.icon className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-semibold">{example.title}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {example.description}
                  </p>
                  
                  <div className="aspect-video bg-white rounded-lg overflow-hidden mb-3">
                    <img 
                      src={example.afterImageUrl} 
                      alt={example.title}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectExample(example);
                    }}
                    className="w-full py-2 bg-white text-blue-600 rounded-lg font-medium text-sm"
                  >
                    View Example
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation controls */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              onClick={() => scrollToIndex(currentExampleIndex - 1)}
              disabled={currentExampleIndex === 0}
              className={`p-1 rounded-full bg-white shadow ${
                currentExampleIndex === 0 ? 'opacity-50' : ''
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={() => scrollToIndex(currentExampleIndex + 1)}
              disabled={currentExampleIndex === realWorldExamples.length - 1}
              className={`p-1 rounded-full bg-white shadow ${
                currentExampleIndex === realWorldExamples.length - 1 ? 'opacity-50' : ''
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Dots indicator */}
          <div className="flex justify-center mt-3 space-x-1">
            {realWorldExamples.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentExampleIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Example info modal */}
        {showInfoModal && selectedExample && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <selectedExample.icon className="w-6 h-6 mr-2" />
                    <h3 className="text-xl font-bold">{selectedExample.title}</h3>
                  </div>
                  <button 
                    onClick={() => setShowInfoModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-gray-600 mb-4">{selectedExample.longDescription}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Recommended Source:</h4>
                  <p className="text-sm text-gray-600">{selectedExample.recommendedSource}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Recommended Settings:</h4>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Vector Threshold: {selectedExample.settings.vectorThreshold}</div>
                      <div>Amplification: {selectedExample.settings.pixelAmplification}x</div>
                      <div>Sensitivity Range: [{selectedExample.settings.sensitivityRange[0]}, {selectedExample.settings.sensitivityRange[1]}]</div>
                      <div>Color Amplification: {selectedExample.settings.colorAmplification ? 'Enabled' : 'Disabled'}</div>
                      <div>Motion Blur: {selectedExample.settings.motionBlur}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => applySettings(selectedExample.settings)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  >
                    Apply These Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // 5. Processing View Component
  const ProcessingView = () => {
    return (
      <div className="text-center py-8">
        <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
        <h3 className="text-xl font-medium mb-2">Processing Video</h3>
        <p className="text-gray-600 mb-4">Analyzing and amplifying motion patterns...</p>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 max-w-md mx-auto">
          <div 
            className="bg-blue-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          ></div>
        </div>
        
        <p className="text-gray-500">
          Processing {Math.round(processingProgress)}% complete
        </p>
        
        {processingTime > 0 && (
          <div className="mt-3 text-sm text-gray-500 flex items-center justify-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Time elapsed: {formatProcessingTime(processingTime)}</span>
          </div>
        )}
        
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
  
  // 6. Results Viewer Component (Enhanced)
  const ResultsViewer = () => {
    // The current frame to display
    const { currentFrame, isPlaying, speed } = playbackState;
    
    // Reset playback when switching to playback view
    useEffect(() => {
      if (activeView === 'playback') {
        setPlaybackState(prev => ({
          ...prev,
          currentFrame: 0,
          isPlaying: false
        }));
      }
    }, [activeView]);
    
    // Helper to render the results based on comparison mode
    const renderResultContent = () => {
      if (showSideBySide) {
        // Side-by-side comparison
        return (
          <div className="flex flex-col md:flex-row gap-2 h-full">
            <div className="flex-1 relative bg-black overflow-hidden rounded">
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Original
              </div>
              <canvas
                ref={originalCanvasRef}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 relative bg-black overflow-hidden rounded">
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Processed
              </div>
              <canvas
                ref={processedCanvasRef}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        );
      } else if (showOriginal) {
        // Toggle between original and processed
        return (
          <div 
            className="relative bg-black overflow-hidden h-full rounded"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={originalCanvasRef}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Original
            </div>
            <button
              onClick={() => setShowOriginal(false)}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-medium"
            >
              Show Processed
            </button>
          </div>
        );
      } else if (sliderPosition < 100) {
        // Slider comparison view
        return (
          <div 
            className="relative bg-black overflow-hidden h-full rounded"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Container for both canvases */}
            <div className="relative w-full h-full">
              {/* Original canvas (visible portion based on slider) */}
              <div 
                className="absolute top-0 left-0 h-full overflow-hidden z-10 border-r border-white"
                style={{ width: `${sliderPosition}%` }}
              >
                <canvas
                  ref={originalCanvasRef}
                  className="w-full h-full object-contain"
                  style={{ marginRight: `-${100 - sliderPosition}%` }}
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  Original
                </div>
              </div>
              
              {/* Processed canvas (full width, below original) */}
              <div className="absolute top-0 left-0 w-full h-full">
                <canvas
                  ref={processedCanvasRef}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  Processed
                </div>
              </div>
              
              {/* Slider control */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white z-20 cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                  <ChevronLeft className="w-3 h-3 text-gray-500" />
                  <div className="border-r border-gray-300 h-3 mx-0.5"></div>
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                </div>
              </div>
            </div>
            
            {/* Slider input for mobile */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(parseInt(e.target.value))}
              className="absolute bottom-0 left-0 right-0 w-full opacity-0 h-12 z-30"
            />
          </div>
        );
      } else {
        // Default view (processed only)
        return (
          <div 
            className="relative bg-black overflow-hidden h-full rounded"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={processedCanvasRef}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Processed
            </div>
            <button
              onClick={() => setShowOriginal(true)}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-medium"
            >
              Show Original
            </button>
          </div>
        );
      }
    };
    
    return (
      <div 
        ref={containerRef} 
        className={`bg-white rounded-lg shadow ${fullscreen ? 'fixed inset-0 z-50' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-lg">Amplified Motion Results</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBottomSheet(true)}
                className="p-1 rounded-full hover:bg-gray-100"
                title="View Parameters"
              >
                <Info className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={() => setShowSideBySide(!showSideBySide)}
                className={`p-1 rounded-full ${showSideBySide ? 'bg-blue-100 text-blue-500' : 'hover:bg-gray-100'}`}
                title="Side-by-side View"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="9" height="14" rx="1" />
                  <rect x="13" y="5" width="9" height="14" rx="1" />
                </svg>
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-1 rounded-full hover:bg-gray-100"
                title={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <Maximize2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Main content area */}
          <div className={`flex-1 ${fullscreen ? 'p-0' : 'p-4'}`}>
            {renderResultContent()}
          </div>
          
          {/* Controls */}
          <div className="p-4 border-t">
            {/* Frame scrubber */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max={processedFrames?.length ? processedFrames.length - 1 : 0}
                value={currentFrame}
                onChange={(e) => setPlaybackState(prev => ({
                  ...prev,
                  currentFrame: parseInt(e.target.value)
                }))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Frame {currentFrame + 1}</span>
                <span>Total: {processedFrames?.length || 0} frames</span>
              </div>
            </div>
            
            {/* Not using the slider comparison */}
            {sliderPosition === 100 && !showSideBySide && (
              <div className="mb-3">
                <button
                  onClick={() => setSliderPosition(50)}
                  className="w-full py-1.5 text-sm border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
                >
                  Enable Comparison Slider
                </button>
              </div>
            )}
            
            {/* Playback controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPlaybackState(prev => ({ ...prev, currentFrame: 0 }))}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <SkipBack className="w-5 h-5 text-gray-700" />
                </button>
                
                <button
                  onClick={() => setPlaybackState(prev => ({
                    ...prev,
                    currentFrame: Math.max(0, prev.currentFrame - 1)
                  }))}
                  className="p-2 rounded-full hover:bg-gray-100"
                  disabled={currentFrame <= 0}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                
                <button
                  onClick={() => setPlaybackState(prev => ({
                    ...prev, 
                    isPlaying: !prev.isPlaying
                  }))}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => setPlaybackState(prev => ({
                    ...prev,
                    currentFrame: Math.min(processedFrames?.length ? processedFrames.length - 1 : 0, prev.currentFrame + 1)
                  }))}
                  className="p-2 rounded-full hover:bg-gray-100"
                  disabled={!processedFrames || currentFrame >= processedFrames.length - 1}
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                
                <button
                  onClick={() => setPlaybackState(prev => ({ 
                    ...prev, 
                    currentFrame: processedFrames?.length ? processedFrames.length - 1 : 0 
                  }))}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <SkipForward className="w-5 h-5 text-gray-700" />
                </button>
                
                <select
                  value={speed}
                  onChange={(e) => setPlaybackState(prev => ({
                    ...prev,
                    speed: parseFloat(e.target.value)
                  }))}
                  className="ml-2 text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="4">4x</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportCurrentFrame}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Save Frame"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </button>
                
                <button
                  onClick={() => setActiveView('preview')}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Back to Settings"
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // ==========================================
  // BOTTOM SHEET COMPONENT (MOBILE UI)
  // ==========================================
  
  const ParameterBottomSheet = () => {
    if (!showBottomSheet) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowBottomSheet(false)}>
        <div 
          ref={bottomSheetRef}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 transition-transform"
          onClick={e => e.stopPropagation()}
          onTouchStart={handleBottomSheetTouchStart}
          onTouchMove={handleBottomSheetTouchMove}
          onTouchEnd={handleBottomSheetTouchEnd}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="w-1/3">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
            </div>
            <h3 className="text-lg font-semibold w-1/3 text-center">Parameters</h3>
            <div className="w-1/3 flex justify-end">
              <button
                onClick={() => setShowBottomSheet(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setBottomSheetTab('params')}
              className={`flex-1 py-2 text-center ${
                bottomSheetTab === 'params' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              Parameters
            </button>
            <button
              onClick={() => setBottomSheetTab('presets')}
              className={`flex-1 py-2 text-center ${
                bottomSheetTab === 'presets' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              Presets
            </button>
          </div>
          
          {/* Parameters tab content */}
          {bottomSheetTab === 'params' && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pb-4">
              {/* Vector Threshold */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <label className="text-sm font-medium">Vector Threshold</label>
                    <button 
                      className="ml-1 text-gray-400"
                      onClick={() => setShowTooltip(showTooltip === 'vectorThreshold' ? null : 'vectorThreshold')}
                    >
                      {showTooltip === 'vectorThreshold' ? <X className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                  <span className="text-sm font-medium">{params.vectorThreshold.toFixed(2)}</span>
                </div>
                
                {showTooltip === 'vectorThreshold' && (
                  <div className="p-2 bg-gray-50 rounded-md text-xs text-gray-700 mb-1">
                    {tooltips.vectorThreshold}
                  </div>
                )}
                
                <input
                  type="range"
                  min="0.01"
                  max="0.2"
                  step="0.01"
                  value={params.vectorThreshold}
                  onChange={(e) => setParams({
                    ...params,
                    vectorThreshold: parseFloat(e.target.value)
                  })}
                  className="w-full accent-blue-500"
                />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtle (0.01)</span>
                  <span>Standard (0.05)</span>
                  <span>Strong (0.2)</span>
                </div>
              </div>
              
              {/* Pixel Amplification */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <label className="text-sm font-medium">Amplification Factor</label>
                    <button 
                      className="ml-1 text-gray-400"
                      onClick={() => setShowTooltip(showTooltip === 'pixelAmplification' ? null : 'pixelAmplification')}
                    >
                      {showTooltip === 'pixelAmplification' ? <X className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                  <span className="text-sm font-medium">{params.pixelAmplification.toFixed(1)}x</span>
                </div>
                
                {showTooltip === 'pixelAmplification' && (
                  <div className="p-2 bg-gray-50 rounded-md text-xs text-gray-700 mb-1">
                    {tooltips.pixelAmplification}
                  </div>
                )}
                
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={params.pixelAmplification}
                  onChange={(e) => setParams({
                    ...params,
                    pixelAmplification: parseFloat(e.target.value)
                  })}
                  className="w-full accent-blue-500"
                />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtle (2x)</span>
                  <span>Standard (10x)</span>
                  <span>Dramatic (25x)</span>
                </div>
              </div>
              
              {/* Sensitivity Range */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <label className="text-sm font-medium">Sensitivity Range</label>
                    <button 
                      className="ml-1 text-gray-400"
                      onClick={() => setShowTooltip(showTooltip === 'sensitivityRange' ? null : 'sensitivityRange')}
                    >
                      {showTooltip === 'sensitivityRange' ? <X className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                  <span className="text-sm font-medium">
                    [{params.sensitivityRange[0].toFixed(1)}, {params.sensitivityRange[1].toFixed(1)}]
                  </span>
                </div>
                
                {showTooltip === 'sensitivityRange' && (
                  <div className="p-2 bg-gray-50 rounded-md text-xs text-gray-700 mb-1">
                    {tooltips.sensitivityRange}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.05"
                      value={params.sensitivityRange[0]}
                      onChange={(e) => setParams({
                        ...params,
                        sensitivityRange: [
                          parseFloat(e.target.value),
                          params.sensitivityRange[1]
                        ]
                      })}
                      className="w-full accent-blue-500"
                    />
                    <div className="text-xs text-gray-500 text-center">Min</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={params.sensitivityRange[1]}
                      onChange={(e) => setParams({
                        ...params,
                        sensitivityRange: [
                          params.sensitivityRange[0],
                          parseFloat(e.target.value)
                        ]
                      })}
                      className="w-full accent-blue-500"
                    />
                    <div className="text-xs text-gray-500 text-center">Max</div>
                  </div>
                </div>
              </div>
              
              {/* Color Amplification */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <label className="text-sm font-medium">Color Amplification</label>
                    <button 
                      className="ml-1 text-gray-400"
                      onClick={() => setShowTooltip(showTooltip === 'colorAmplification' ? null : 'colorAmplification')}
                    >
                      {showTooltip === 'colorAmplification' ? <X className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="colorAmplification" 
                      id="colorAmplification"
                      checked={params.colorAmplification}
                      onChange={(e) => setParams({
                        ...params,
                        colorAmplification: e.target.checked
                      })}
                      className="sr-only"
                    />
                    <label
                      htmlFor="colorAmplification"
                      className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                        params.colorAmplification ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                          params.colorAmplification ? 'translate-x-full' : 'translate-x-0'
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
                
                {showTooltip === 'colorAmplification' && (
                  <div className="p-2 bg-gray-50 rounded-md text-xs text-gray-700">
                    {tooltips.colorAmplification}
                  </div>
                )}
              </div>
              
              {/* Motion Blur */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <label className="text-sm font-medium">Motion Blur</label>
                    <button 
                      className="ml-1 text-gray-400"
                      onClick={() => setShowTooltip(showTooltip === 'motionBlur' ? null : 'motionBlur')}
                    >
                      {showTooltip === 'motionBlur' ? <X className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                  <span className="text-sm font-medium">{params.motionBlur}</span>
                </div>
                
                {showTooltip === 'motionBlur' && (
                  <div className="p-2 bg-gray-50 rounded-md text-xs text-gray-700 mb-1">
                    {tooltips.motionBlur}
                  </div>
                )}
                
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={params.motionBlur}
                  onChange={(e) => setParams({
                    ...params,
                    motionBlur: parseInt(e.target.value)
                  })}
                  className="w-full accent-blue-500"
                />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>None (0)</span>
                  <span>Medium (2)</span>
                  <span>High (5)</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Presets tab content */}
          {bottomSheetTab === 'presets' && (
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pb-4">
              {realWorldExamples.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setParams(preset.settings);
                    setShowBottomSheet(false);
                  }}
                  className="p-3 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center mb-1">
                    <preset.icon className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium">{preset.title}</span>
                  </div>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                </button>
              ))}
            </div>
          )}
          
          {/* Bottom actions */}
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setShowBottomSheet(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowBottomSheet(false);
                if (activeView === 'preview') {
                  setActiveView('processing');
                  setTimeout(processVideoFrames, 100);
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm flex items-center"
            >
              {activeView === 'preview' ? (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Process with these settings
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // ==========================================
  // MAIN COMPONENT RENDERING
  // ==========================================
  
  // Mobile-first navigation
  const MobileNavigation = () => (
    <div className="flex flex-wrap gap-2 mb-6 sticky top-0 z-10 bg-white pb-2 shadow-sm rounded-lg">
      {[
        { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
        { id: 'preview', label: 'Configure', icon: <Settings className="w-4 h-4" /> },
        { id: 'processing', label: 'Process', icon: <RefreshCw className="w-4 h-4" /> },
        { id: 'playback', label: 'Results', icon: <Film className="w-4 h-4" /> }
      ].map(tab => (
        <button 
          key={tab.id}
          onClick={() => {
            // Only allow navigation to previous steps or current step
            if (
              tab.id === activeView ||
              tab.id === 'upload' ||
              (tab.id === 'preview' && videoUrl) ||
              (tab.id === 'playback' && processedFrames.length > 0)
            ) {
              setActiveView(tab.id);
            }
          }}
          disabled={
            tab.id !== activeView &&
            !(
              tab.id === 'upload' ||
              (tab.id === 'preview' && videoUrl) ||
              (tab.id === 'playback' && processedFrames.length > 0)
            )
          }
          className={`flex-1 min-w-[5rem] py-3 rounded-full text-sm font-medium flex flex-col items-center gap-1
            ${activeView === tab.id 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 disabled:opacity-50'}`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
  
  // Main content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'upload':
        return <VideoUploader />;
      case 'preview':
        return (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <VideoPreview />
            </div>
            <div className="md:w-1/3">
              <ParameterControls />
              <RealWorldExamplesComponent />
            </div>
          </div>
        );
      case 'processing':
        return <ProcessingView />;
      case 'playback':
        return <ResultsViewer />;
      default:
        return <VideoUploader />;
    }
  };
  
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Motion Analysis & Amplification</h1>
      
      <MobileNavigation />
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        {renderContent()}
      </div>
      
      {/* Mobile Parameters Bottom Sheet */}
      <ParameterBottomSheet />
      
      {/* Tooltip for parameter explanations */}
      {showTooltip && (
        <div className="fixed bottom-4 inset-x-4 bg-white rounded-lg shadow-lg p-3 z-50 animate-fade-in">
          {tooltips[showTooltip]}
          <button
            onClick={() => setShowTooltip(null)}
            className="absolute top-2 right-2 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MotionAmplification;
