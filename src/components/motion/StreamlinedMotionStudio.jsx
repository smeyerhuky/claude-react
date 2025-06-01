import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Upload, RotateCcw, Settings } from 'lucide-react';

const StreamlinedMotionStudio = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Transform toggles
  const [transforms, setTransforms] = useState({
    motionDiff: false,
    timeShift: false,
    edgeDetect: false,
    opticalFlow: false,
    amplification: false,
    colorShift: false
  });
  
  // Transform parameters
  const [params, setParams] = useState({
    timeShiftFrames: 1,
    sensitivity: 30,
    amplificationFactor: 2,
    edgeThreshold: 50,
    colorShiftAmount: 5,
    blendMode: 'difference'
  });

  const videoRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  
  // Efficient frame cache and processing state
  const frameCache = useRef(new Map());
  const processingState = useRef({
    lastProcessedTime: -1,
    frameHistory: [],
    motionMatrix: null,
    gradientMatrix: null
  });

  // Matrix operations for efficient processing
  const MatrixOps = useMemo(() => ({
    // Create efficient typed arrays for pixel operations
    createMatrix: (width, height, channels = 4) => {
      return {
        data: new Float32Array(width * height * channels),
        width,
        height,
        channels
      };
    },

    // Fast difference calculation using SIMD-friendly operations
    difference: (matrix1, matrix2, threshold = 0) => {
      const { width, height, channels } = matrix1;
      const result = new Float32Array(matrix1.data.length);
      const len = matrix1.data.length;
      
      for (let i = 0; i < len; i += channels) {
        const r1 = matrix1.data[i], g1 = matrix1.data[i + 1], b1 = matrix1.data[i + 2];
        const r2 = matrix2.data[i], g2 = matrix2.data[i + 1], b2 = matrix2.data[i + 2];
        
        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        
        if (diff > threshold) {
          result[i] = diff;
          result[i + 1] = diff * 0.5;
          result[i + 2] = diff * 0.8;
          result[i + 3] = 255;
        } else {
          result[i] = result[i + 1] = result[i + 2] = result[i + 3] = 0;
        }
      }
      
      return { data: result, width, height, channels };
    },

    // Sobel edge detection with separable kernels
    sobelEdges: (matrix, threshold) => {
      const { width, height, channels } = matrix;
      const result = new Float32Array(matrix.data.length);
      
      // Horizontal and vertical Sobel kernels
      const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
      const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0, gy = 0;
          
          // Apply 3x3 convolution
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * channels;
              const gray = (matrix.data[idx] + matrix.data[idx + 1] + matrix.data[idx + 2]) / 3;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              
              gx += gray * sobelX[kernelIdx];
              gy += gray * sobelY[kernelIdx];
            }
          }
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const idx = (y * width + x) * channels;
          
          if (magnitude > threshold) {
            result[idx] = result[idx + 1] = result[idx + 2] = magnitude;
            result[idx + 3] = 255;
          }
        }
      }
      
      return { data: result, width, height, channels };
    },

    // Motion amplification using phase manipulation
    amplifyMotion: (current, reference, factor) => {
      const { width, height, channels } = current;
      const result = new Float32Array(current.data.length);
      
      for (let i = 0; i < current.data.length; i += channels) {
        const cr = current.data[i], cg = current.data[i + 1], cb = current.data[i + 2];
        const rr = reference.data[i], rg = reference.data[i + 1], rb = reference.data[i + 2];
        
        // Amplify the difference and add back to reference
        result[i] = Math.max(0, Math.min(255, rr + (cr - rr) * factor));
        result[i + 1] = Math.max(0, Math.min(255, rg + (cg - rg) * factor));
        result[i + 2] = Math.max(0, Math.min(255, rb + (cb - rb) * factor));
        result[i + 3] = 255;
      }
      
      return { data: result, width, height, channels };
    },

    // RGB color shifting for artistic effects
    rgbShift: (matrix, shiftAmount) => {
      const { width, height, channels } = matrix;
      const result = new Float32Array(matrix.data.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * channels;
          
          // Shift red channel
          const rShiftX = Math.max(0, Math.min(width - 1, x + shiftAmount));
          const rIdx = (y * width + rShiftX) * channels;
          
          // Shift blue channel
          const bShiftX = Math.max(0, Math.min(width - 1, x - shiftAmount));
          const bIdx = (y * width + bShiftX) * channels;
          
          result[idx] = matrix.data[rIdx]; // Red from shifted position
          result[idx + 1] = matrix.data[idx + 1]; // Green stays
          result[idx + 2] = matrix.data[bIdx + 2]; // Blue from shifted position
          result[idx + 3] = 255;
        }
      }
      
      return { data: result, width, height, channels };
    }
  }), []);

  // Efficient frame processing pipeline
  const processFrame = useCallback((timestamp) => {
    if (!videoRef.current || !originalCanvasRef.current || !processedCanvasRef.current) return;
    
    const video = videoRef.current;
    const originalCanvas = originalCanvasRef.current;
    const processedCanvas = processedCanvasRef.current;
    const originalCtx = originalCanvas.getContext('2d');
    const processedCtx = processedCanvas.getContext('2d');
    
    // Set canvas dimensions
    originalCanvas.width = video.videoWidth;
    originalCanvas.height = video.videoHeight;
    processedCanvas.width = video.videoWidth;
    processedCanvas.height = video.videoHeight;
    
    // Draw original frame
    originalCtx.drawImage(video, 0, 0);
    
    // Check if we need to process this frame
    const currentFrameKey = Math.floor(currentTime * 30); // Assuming 30fps
    if (processingState.current.lastProcessedTime === currentFrameKey) return;
    
    const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    const currentMatrix = {
      data: new Float32Array(imageData.data),
      width: imageData.width,
      height: imageData.height,
      channels: 4
    };
    
    // Update frame history for temporal operations
    processingState.current.frameHistory.push(currentMatrix);
    if (processingState.current.frameHistory.length > 150) { // Keep ~5 seconds at 30fps
      processingState.current.frameHistory.shift();
    }
    
    let resultMatrix = currentMatrix;
    
    // Apply transforms based on toggles
    if (transforms.motionDiff && processingState.current.frameHistory.length > 1) {
      const prevMatrix = processingState.current.frameHistory[processingState.current.frameHistory.length - 2];
      resultMatrix = MatrixOps.difference(currentMatrix, prevMatrix, params.sensitivity);
    }
    
    if (transforms.timeShift && processingState.current.frameHistory.length > params.timeShiftFrames) {
      const shiftedMatrix = processingState.current.frameHistory[processingState.current.frameHistory.length - params.timeShiftFrames - 1];
      resultMatrix = MatrixOps.difference(currentMatrix, shiftedMatrix, params.sensitivity);
    }
    
    if (transforms.edgeDetect) {
      resultMatrix = MatrixOps.sobelEdges(resultMatrix, params.edgeThreshold);
    }
    
    if (transforms.amplification && processingState.current.frameHistory.length > 1) {
      const refMatrix = processingState.current.frameHistory[0];
      resultMatrix = MatrixOps.amplifyMotion(resultMatrix, refMatrix, params.amplificationFactor);
    }
    
    if (transforms.colorShift) {
      resultMatrix = MatrixOps.rgbShift(resultMatrix, params.colorShiftAmount);
    }
    
    // Convert back to ImageData and draw
    const outputImageData = new ImageData(
      new Uint8ClampedArray(resultMatrix.data),
      resultMatrix.width,
      resultMatrix.height
    );
    
    processedCtx.putImageData(outputImageData, 0, 0);
    processingState.current.lastProcessedTime = currentFrameKey;
    
  }, [currentTime, transforms, params, MatrixOps]);

  // Video upload handler
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(URL.createObjectURL(file));
      setCurrentTime(0);
      frameCache.current.clear();
      processingState.current = {
        lastProcessedTime: -1,
        frameHistory: [],
        motionMatrix: null,
        gradientMatrix: null
      };
    }
  };

  // Playback controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 1);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 1);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleScrubberChange = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Toggle transform
  const toggleTransform = (transform) => {
    setTransforms(prev => ({
      ...prev,
      [transform]: !prev[transform]
    }));
  };

  // Update parameter
  const updateParam = (param, value) => {
    setParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Real-time processing
  useEffect(() => {
    if (videoFile) {
      const animate = () => {
        processFrame();
        requestAnimationFrame(animate);
      };
      const animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [videoFile, processFrame]);

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Motion Studio</h1>
          <p className="text-gray-400">Efficient real-time motion analysis and transformation</p>
        </div>

        {/* Upload */}
        {!videoFile && (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
            <label className="cursor-pointer">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <div className="text-xl font-semibold mb-2">Upload Video</div>
              <div className="text-gray-400">Select a video file to begin</div>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Main Interface */}
        {videoFile && (
          <div className="space-y-6">
            
            {/* Video Display - Before/After */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Original</h3>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoFile}
                    className="w-full"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    muted
                  />
                  <canvas ref={originalCanvasRef} className="absolute inset-0 w-full h-full" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Processed</h3>
                <div className="bg-black rounded-lg overflow-hidden h-full">
                  <canvas ref={processedCanvasRef} className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={skipBackward}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-blue-600 rounded-full hover:bg-blue-700"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={skipForward}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                <div className="text-sm text-gray-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm">Speed:</span>
                  {[0.25, 0.5, 1, 2, 4].map(rate => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`px-2 py-1 rounded text-sm ${
                        playbackRate === rate ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Scrubber */}
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={currentTime}
                onChange={handleScrubberChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Transform Controls */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Transform Toggles */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Transforms</h3>
                <div className="space-y-3">
                  {[
                    { key: 'motionDiff', label: 'Motion Difference' },
                    { key: 'timeShift', label: 'Time Shift' },
                    { key: 'edgeDetect', label: 'Edge Detection' },
                    { key: 'amplification', label: 'Motion Amplification' },
                    { key: 'colorShift', label: 'RGB Color Shift' },
                    { key: 'opticalFlow', label: 'Optical Flow (WIP)' }
                  ].map(transform => (
                    <label key={transform.key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transforms[transform.key]}
                        onChange={() => toggleTransform(transform.key)}
                        className="rounded"
                      />
                      <span>{transform.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Parameters</h3>
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Time Shift Frames: {params.timeShiftFrames}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={params.timeShiftFrames}
                      onChange={(e) => updateParam('timeShiftFrames', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sensitivity: {params.sensitivity}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={params.sensitivity}
                      onChange={(e) => updateParam('sensitivity', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Amplification: {params.amplificationFactor}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.1"
                      value={params.amplificationFactor}
                      onChange={(e) => updateParam('amplificationFactor', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Edge Threshold: {params.edgeThreshold}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={params.edgeThreshold}
                      onChange={(e) => updateParam('edgeThreshold', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Color Shift: {params.colorShiftAmount}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={params.colorShiftAmount}
                      onChange={(e) => updateParam('colorShiftAmount', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Performance Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div>Frame History: {processingState.current.frameHistory.length} frames</div>
                <div>Processing: Real-time matrix operations</div>
                <div>Memory: {(frameCache.current.size * 0.1).toFixed(1)}MB cached</div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default StreamlinedMotionStudio;