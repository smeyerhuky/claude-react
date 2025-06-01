import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Upload, Settings, Activity, Sliders, RefreshCw } from 'lucide-react';

const SmoothMotionStudio = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Performance metrics
  const [metrics, setMetrics] = useState({
    fps: 0,
    processingTime: 0,
    framesCached: 0,
    memoryUsage: 0
  });
  
  // Transform states
  const [transforms, setTransforms] = useState({
    motionDiff: false,
    timeShift: false,
    edgeDetect: false,
    amplification: false,
    opticalFlow: false,
    heatMap: false,
    colorShift: false
  });
  
  // Individual transform parameters
  const [transformParams, setTransformParams] = useState({
    motionDiff: {
      sensitivity: 30,
      colorMode: 'red', // red, green, blue, rainbow, monochrome
      threshold: 'adaptive', // fixed, adaptive
      blendMode: 'screen' // screen, overlay, multiply, normal
    },
    timeShift: {
      frameOffset: 5,
      mode: 'difference', // difference, blend, onion-skin
      opacity: 0.8,
      colorTint: 'cyan'
    },
    edgeDetect: {
      algorithm: 'sobel', // sobel, canny, roberts, prewitt
      thickness: 1,
      threshold: 50,
      color: 'white'
    },
    amplification: {
      factor: 2.5,
      method: 'temporal', // temporal, spatial, frequency
      smoothing: 0.3,
      clampLevels: true
    },
    opticalFlow: {
      blockSize: 8,
      searchRange: 16,
      vectorScale: 5,
      displayMode: 'vectors' // vectors, heatmap, streamlines
    },
    heatMap: {
      decayRate: 0.95,
      colormap: 'thermal', // thermal, viridis, plasma, cool
      accumulation: 'exponential', // exponential, linear, weighted
      resetInterval: 300 // frames
    },
    colorShift: {
      rShift: 2,
      gShift: 0,
      bShift: -2,
      mode: 'chromatic' // chromatic, glitch, vintage
    }
  });
  
  // Global processing parameters
  const [globalParams, setGlobalParams] = useState({
    processingQuality: 'high', // low, medium, high, ultra
    frameSkipping: 1, // Process every N frames
    smoothTransitions: true,
    blendMultipleEffects: true,
    maxFrameHistory: 60,
    adaptivePerformance: true
  });

  const videoRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  
  // Processing state
  const processingRef = useRef({
    frameHistory: [],
    processedCache: new Map(),
    edgeCache: new Map(),
    heatMapData: null,
    opticalFlowData: null,
    lastProcessedFrame: -1,
    isProcessing: false,
    bufferPool: []
  });
  
  // Performance monitoring
  const perfRef = useRef({
    frameCount: 0,
    lastTime: 0,
    processingTimes: [],
    droppedFrames: 0
  });

  // Quality settings based on processing quality
  const qualitySettings = useMemo(() => {
    const settings = {
      low: { scale: 0.5, skipFrames: 3, maxHistory: 20 },
      medium: { scale: 0.75, skipFrames: 2, maxHistory: 40 },
      high: { scale: 1.0, skipFrames: 1, maxHistory: 60 },
      ultra: { scale: 1.0, skipFrames: 1, maxHistory: 120 }
    };
    return settings[globalParams.processingQuality] || settings.high;
  }, [globalParams.processingQuality]);

  // Optimized image processing utilities
  const ImageProcessor = useMemo(() => ({
    // Motion difference with various color modes
    motionDifference: (current, previous, params) => {
      const { sensitivity, colorMode, blendMode } = params;
      const result = new Uint8ClampedArray(current.length);
      let motionPixels = 0;
      
      for (let i = 0; i < current.length; i += 4) {
        const rDiff = Math.abs(current[i] - previous[i]);
        const gDiff = Math.abs(current[i + 1] - previous[i + 1]);
        const bDiff = Math.abs(current[i + 2] - previous[i + 2]);
        const totalDiff = (rDiff + gDiff + bDiff) / 3;
        
        if (totalDiff > sensitivity) {
          motionPixels++;
          const intensity = Math.min(255, totalDiff * 2);
          
          switch (colorMode) {
            case 'red':
              result[i] = intensity;
              result[i + 1] = intensity * 0.3;
              result[i + 2] = intensity * 0.1;
              break;
            case 'green':
              result[i] = intensity * 0.1;
              result[i + 1] = intensity;
              result[i + 2] = intensity * 0.3;
              break;
            case 'blue':
              result[i] = intensity * 0.1;
              result[i + 1] = intensity * 0.3;
              result[i + 2] = intensity;
              break;
            case 'rainbow':
              const hue = (totalDiff / 255) * 360;
              const [r, g, b] = this.hsvToRgb(hue, 1, intensity / 255);
              result[i] = r * 255;
              result[i + 1] = g * 255;
              result[i + 2] = b * 255;
              break;
            default:
              result[i] = result[i + 1] = result[i + 2] = intensity;
          }
          result[i + 3] = 255;
        } else {
          result[i] = result[i + 1] = result[i + 2] = result[i + 3] = 0;
        }
      }
      
      return { data: result, motionPixels };
    },

    // Time shift with different blend modes
    timeShift: (current, shifted, params) => {
      const { mode, opacity, colorTint } = params;
      const result = new Uint8ClampedArray(current.length);
      
      for (let i = 0; i < current.length; i += 4) {
        switch (mode) {
          case 'difference':
            const diff = Math.abs(current[i] - shifted[i]) + 
                        Math.abs(current[i + 1] - shifted[i + 1]) + 
                        Math.abs(current[i + 2] - shifted[i + 2]);
            result[i] = result[i + 1] = result[i + 2] = Math.min(255, diff);
            break;
          case 'blend':
            result[i] = (current[i] * opacity + shifted[i] * (1 - opacity));
            result[i + 1] = (current[i + 1] * opacity + shifted[i + 1] * (1 - opacity));
            result[i + 2] = (current[i + 2] * opacity + shifted[i + 2] * (1 - opacity));
            break;
          case 'onion-skin':
            // Show both frames with transparency
            result[i] = Math.max(current[i] * 0.7, shifted[i] * 0.5);
            result[i + 1] = Math.max(current[i + 1] * 0.7, shifted[i + 1] * 0.5);
            result[i + 2] = Math.max(current[i + 2] * 0.7, shifted[i + 2] * 0.5);
            break;
        }
        
        // Apply color tint
        if (colorTint === 'cyan') {
          result[i + 1] = Math.min(255, result[i + 1] * 1.2);
          result[i + 2] = Math.min(255, result[i + 2] * 1.2);
        }
        
        result[i + 3] = 255;
      }
      
      return result;
    },

    // Enhanced edge detection
    edgeDetection: (imageData, params) => {
      const { algorithm, thickness, threshold, color } = params;
      const { width, height, data } = imageData;
      const result = new Uint8ClampedArray(data.length);
      
      for (let y = thickness; y < height - thickness; y++) {
        for (let x = thickness; x < width - thickness; x++) {
          let gx = 0, gy = 0;
          
          if (algorithm === 'sobel') {
            // Sobel operator
            const kernelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const kernelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
            
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4;
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const kernelIdx = (ky + 1) * 3 + (kx + 1);
                
                gx += gray * kernelX[kernelIdx];
                gy += gray * kernelY[kernelIdx];
              }
            }
          }
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const idx = (y * width + x) * 4;
          
          if (magnitude > threshold) {
            if (color === 'white') {
              result[idx] = result[idx + 1] = result[idx + 2] = Math.min(255, magnitude);
            } else {
              // Color-coded edges based on direction
              const direction = Math.atan2(gy, gx);
              const hue = ((direction + Math.PI) / (2 * Math.PI)) * 360;
              const [r, g, b] = this.hsvToRgb(hue, 1, magnitude / 255);
              result[idx] = r * 255;
              result[idx + 1] = g * 255;
              result[idx + 2] = b * 255;
            }
            result[idx + 3] = 255;
          }
        }
      }
      
      return result;
    },

    // Motion amplification
    amplifyMotion: (current, reference, params) => {
      const { factor, method, smoothing, clampLevels } = params;
      const result = new Uint8ClampedArray(current.length);
      
      for (let i = 0; i < current.length; i += 4) {
        // Calculate amplified values
        let rAmp = reference[i] + (current[i] - reference[i]) * factor;
        let gAmp = reference[i + 1] + (current[i + 1] - reference[i + 1]) * factor;
        let bAmp = reference[i + 2] + (current[i + 2] - reference[i + 2]) * factor;
        
        // Apply smoothing
        if (smoothing > 0) {
          rAmp = current[i] * smoothing + rAmp * (1 - smoothing);
          gAmp = current[i + 1] * smoothing + gAmp * (1 - smoothing);
          bAmp = current[i + 2] * smoothing + bAmp * (1 - smoothing);
        }
        
        // Clamp levels if requested
        if (clampLevels) {
          result[i] = Math.max(0, Math.min(255, rAmp));
          result[i + 1] = Math.max(0, Math.min(255, gAmp));
          result[i + 2] = Math.max(0, Math.min(255, bAmp));
        } else {
          result[i] = rAmp;
          result[i + 1] = gAmp;
          result[i + 2] = bAmp;
        }
        result[i + 3] = 255;
      }
      
      return result;
    },

    // Heat map accumulation
    updateHeatMap: (motionData, heatMapData, params) => {
      const { decayRate, colormap } = params;
      
      if (!heatMapData) {
        heatMapData = new Float32Array(motionData.length / 4);
      }
      
      const result = new Uint8ClampedArray(motionData.length);
      
      for (let i = 0; i < motionData.length; i += 4) {
        const pixelIdx = i / 4;
        const motion = (motionData[i] + motionData[i + 1] + motionData[i + 2]) / (3 * 255);
        
        // Update heat with decay
        heatMapData[pixelIdx] = Math.max(motion, heatMapData[pixelIdx] * decayRate);
        
        // Apply colormap
        const heat = heatMapData[pixelIdx];
        const [r, g, b] = this.applyColormap(heat, colormap);
        
        result[i] = r * 255;
        result[i + 1] = g * 255;
        result[i + 2] = b * 255;
        result[i + 3] = heat > 0.1 ? 255 : 0;
      }
      
      return { data: result, heatMapData };
    },

    // Color shift effects
    colorShift: (imageData, params) => {
      const { rShift, gShift, bShift, mode } = params;
      const { width, height, data } = imageData;
      const result = new Uint8ClampedArray(data.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Calculate shifted positions
          const rX = Math.max(0, Math.min(width - 1, x + rShift));
          const gX = x;
          const bX = Math.max(0, Math.min(width - 1, x + bShift));
          
          const rIdx = (y * width + rX) * 4;
          const gIdx = (y * width + gX) * 4;
          const bIdx = (y * width + bX) * 4;
          
          result[idx] = data[rIdx];
          result[idx + 1] = data[gIdx + 1];
          result[idx + 2] = data[bIdx + 2];
          result[idx + 3] = 255;
        }
      }
      
      return result;
    },

    // Utility functions
    hsvToRgb: (h, s, v) => {
      h = h / 360;
      const c = v * s;
      const x = c * (1 - Math.abs((h * 6) % 2 - 1));
      const m = v - c;
      
      let r, g, b;
      if (h < 1/6) [r, g, b] = [c, x, 0];
      else if (h < 2/6) [r, g, b] = [x, c, 0];
      else if (h < 3/6) [r, g, b] = [0, c, x];
      else if (h < 4/6) [r, g, b] = [0, x, c];
      else if (h < 5/6) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      
      return [r + m, g + m, b + m];
    },

    applyColormap: (value, colormap) => {
      switch (colormap) {
        case 'thermal':
          if (value < 0.5) return [0, value * 2, 1 - value * 2];
          else return [value * 2 - 1, 1 - (value - 0.5) * 2, 0];
        case 'viridis':
          return [value * 0.3, value * 0.9, value * 0.6];
        case 'plasma':
          return [value, value * 0.3, value * 0.8];
        default:
          return [value, value, value];
      }
    },

    // Blend multiple effects
    blendEffects: (effects, blendMode = 'screen') => {
      if (effects.length === 0) return null;
      if (effects.length === 1) return effects[0];
      
      const result = new Uint8ClampedArray(effects[0].length);
      
      for (let i = 0; i < result.length; i += 4) {
        let r = 0, g = 0, b = 0, a = 0;
        
        switch (blendMode) {
          case 'screen':
            r = g = b = 255;
            effects.forEach(effect => {
              r = 255 - (255 - r) * (255 - effect[i]) / 255;
              g = 255 - (255 - g) * (255 - effect[i + 1]) / 255;
              b = 255 - (255 - b) * (255 - effect[i + 2]) / 255;
            });
            a = Math.max(...effects.map(e => e[i + 3]));
            break;
          case 'overlay':
            effects.forEach((effect, idx) => {
              const weight = 1 / effects.length;
              r += effect[i] * weight;
              g += effect[i + 1] * weight;
              b += effect[i + 2] * weight;
              a = Math.max(a, effect[i + 3]);
            });
            break;
          default: // additive
            effects.forEach(effect => {
              r += effect[i];
              g += effect[i + 1];
              b += effect[i + 2];
              a = Math.max(a, effect[i + 3]);
            });
            r = Math.min(255, r);
            g = Math.min(255, g);
            b = Math.min(255, b);
        }
        
        result[i] = r;
        result[i + 1] = g;
        result[i + 2] = b;
        result[i + 3] = a;
      }
      
      return result;
    }
  }), []);

  // Main processing function
  const processFrame = useCallback(() => {
    if (!videoRef.current || !isVideoReady || !originalCanvasRef.current || !processedCanvasRef.current) return;
    if (processingRef.current.isProcessing) return;
    
    const startTime = performance.now();
    const video = videoRef.current;
    
    if (!video.videoWidth || !video.videoHeight) return;
    
    const frameNumber = Math.floor(currentTime * 30);
    
    // Skip if already processed or frame skipping
    if (frameNumber === processingRef.current.lastProcessedFrame) return;
    if (frameNumber % globalParams.frameSkipping !== 0) return;
    
    processingRef.current.isProcessing = true;
    
    try {
      const originalCanvas = originalCanvasRef.current;
      const processedCanvas = processedCanvasRef.current;
      
      // Apply quality scaling
      const scale = qualitySettings.scale;
      const width = Math.floor(video.videoWidth * scale);
      const height = Math.floor(video.videoHeight * scale);
      
      originalCanvas.width = processedCanvas.width = width;
      originalCanvas.height = processedCanvas.height = height;
      
      const originalCtx = originalCanvas.getContext('2d');
      const processedCtx = processedCanvas.getContext('2d');
      
      // Draw and get image data
      originalCtx.drawImage(video, 0, 0, width, height);
      const imageData = originalCtx.getImageData(0, 0, width, height);
      const currentData = new Uint8ClampedArray(imageData.data);
      
      // Store in history
      processingRef.current.frameHistory.push(currentData);
      if (processingRef.current.frameHistory.length > qualitySettings.maxHistory) {
        processingRef.current.frameHistory.shift();
      }
      
      const activeTransforms = Object.keys(transforms).filter(key => transforms[key]);
      
      if (activeTransforms.length === 0) {
        processedCtx.putImageData(imageData, 0, 0);
      } else {
        const effects = [];
        
        // Process each active transform
        activeTransforms.forEach(transform => {
          let effectData = null;
          
          switch (transform) {
            case 'motionDiff':
              if (processingRef.current.frameHistory.length > 1) {
                const prevData = processingRef.current.frameHistory[processingRef.current.frameHistory.length - 2];
                const result = ImageProcessor.motionDifference(currentData, prevData, transformParams.motionDiff);
                effectData = result.data;
              }
              break;
              
            case 'timeShift':
              const offset = transformParams.timeShift.frameOffset;
              if (processingRef.current.frameHistory.length > offset) {
                const shiftedData = processingRef.current.frameHistory[processingRef.current.frameHistory.length - offset - 1];
                effectData = ImageProcessor.timeShift(currentData, shiftedData, transformParams.timeShift);
              }
              break;
              
            case 'edgeDetect':
              effectData = ImageProcessor.edgeDetection(imageData, transformParams.edgeDetect);
              break;
              
            case 'amplification':
              if (processingRef.current.frameHistory.length > 10) {
                const refData = processingRef.current.frameHistory[0];
                effectData = ImageProcessor.amplifyMotion(currentData, refData, transformParams.amplification);
              }
              break;
              
            case 'heatMap':
              if (processingRef.current.frameHistory.length > 1) {
                const prevData = processingRef.current.frameHistory[processingRef.current.frameHistory.length - 2];
                const motionResult = ImageProcessor.motionDifference(currentData, prevData, { sensitivity: 20, colorMode: 'monochrome' });
                const heatResult = ImageProcessor.updateHeatMap(motionResult.data, processingRef.current.heatMapData, transformParams.heatMap);
                effectData = heatResult.data;
                processingRef.current.heatMapData = heatResult.heatMapData;
              }
              break;
              
            case 'colorShift':
              effectData = ImageProcessor.colorShift(imageData, transformParams.colorShift);
              break;
          }
          
          if (effectData) {
            effects.push(effectData);
          }
        });
        
        // Blend multiple effects if enabled
        let finalData;
        if (globalParams.blendMultipleEffects && effects.length > 1) {
          finalData = ImageProcessor.blendEffects(effects, 'screen');
        } else if (effects.length > 0) {
          finalData = effects[effects.length - 1]; // Use last effect
        } else {
          finalData = currentData;
        }
        
        if (finalData) {
          const outputImageData = new ImageData(finalData, width, height);
          processedCtx.putImageData(outputImageData, 0, 0);
        }
      }
      
      processingRef.current.lastProcessedFrame = frameNumber;
      
      // Update performance metrics
      const processingTime = performance.now() - startTime;
      perfRef.current.processingTimes.push(processingTime);
      if (perfRef.current.processingTimes.length > 60) {
        perfRef.current.processingTimes.shift();
      }
      
      perfRef.current.frameCount++;
      const now = performance.now();
      if (now - perfRef.current.lastTime >= 1000) {
        const avgProcessingTime = perfRef.current.processingTimes.reduce((a, b) => a + b, 0) / perfRef.current.processingTimes.length;
        
        setMetrics({
          fps: perfRef.current.frameCount,
          processingTime: avgProcessingTime,
          framesCached: processingRef.current.frameHistory.length,
          memoryUsage: (processingRef.current.frameHistory.length * width * height * 4) / (1024 * 1024)
        });
        
        perfRef.current.frameCount = 0;
        perfRef.current.lastTime = now;
      }
      
    } catch (error) {
      console.warn('Processing error:', error);
    } finally {
      processingRef.current.isProcessing = false;
    }
    
  }, [isVideoReady, currentTime, transforms, transformParams, globalParams, qualitySettings, ImageProcessor]);

  // Video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(URL.createObjectURL(file));
      setCurrentTime(0);
      setIsVideoReady(false);
      
      // Reset processing state
      processingRef.current = {
        frameHistory: [],
        processedCache: new Map(),
        edgeCache: new Map(),
        heatMapData: null,
        opticalFlowData: null,
        lastProcessedFrame: -1,
        isProcessing: false,
        bufferPool: []
      };
      
      perfRef.current = {
        frameCount: 0,
        lastTime: 0,
        processingTimes: [],
        droppedFrames: 0
      };
    }
  };

  // Video controls
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsVideoReady(true);
    }
  };

  const handleScrubberChange = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Processing loop
  useEffect(() => {
    if (videoFile && isVideoReady) {
      let animationId;
      let lastTime = 0;
      
      const animate = (timestamp) => {
        if (timestamp - lastTime >= 16) { // ~60fps max
          processFrame();
          lastTime = timestamp;
        }
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [videoFile, isVideoReady, processFrame]);

  const toggleTransform = (transform) => {
    setTransforms(prev => ({ ...prev, [transform]: !prev[transform] }));
  };

  const updateTransformParam = (transform, param, value) => {
    setTransformParams(prev => ({
      ...prev,
      [transform]: { ...prev[transform], [param]: value }
    }));
  };

  const updateGlobalParam = (param, value) => {
    setGlobalParams(prev => ({ ...prev, [param]: value }));
  };

  const resetAllTransforms = () => {
    setTransforms({
      motionDiff: false,
      timeShift: false,
      edgeDetect: false,
      amplification: false,
      opticalFlow: false,
      heatMap: false,
      colorShift: false
    });
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-4">
      <div className="max-w-8xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10 text-blue-400" />
              Smooth Motion Studio
            </h1>
            <p className="text-gray-300 text-lg">CPU-optimized real-time motion analysis with smooth transitions</p>
          </div>
          
          {videoFile && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{metrics.fps}</div>
                <div className="text-xs text-gray-400">FPS</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{metrics.processingTime.toFixed(1)}</div>
                <div className="text-xs text-gray-400">ms</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-400">{metrics.framesCached}</div>
                <div className="text-xs text-gray-400">Frames</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-400">{metrics.memoryUsage.toFixed(0)}</div>
                <div className="text-xs text-gray-400">MB</div>
              </div>
            </div>
          )}
        </div>

        {/* Upload */}
        {!videoFile && (
          <div className="border-2 border-dashed border-gray-600 rounded-xl p-16 text-center hover:border-gray-500 transition-all duration-300">
            <label className="cursor-pointer">
              <Upload className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <div className="text-2xl font-semibold mb-3">Upload Video for Analysis</div>
              <div className="text-gray-400 max-w-md mx-auto">
                Experience smooth, real-time motion processing with customizable transforms and parameters
              </div>
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
            
            {/* Video Display */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-black/40 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  📹 Original
                </h3>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoFile}
                    className="w-full"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    muted
                  />
                  <canvas ref={originalCanvasRef} className="absolute inset-0 w-full h-full opacity-0" />
                </div>
              </div>
              
              <div className="bg-black/40 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  ⚡ Processed
                  <span className="text-sm bg-green-600 px-2 py-1 rounded">
                    {Object.values(transforms).filter(Boolean).length} Effects
                  </span>
                </h3>
                <div className="bg-black rounded-lg overflow-hidden">
                  <canvas ref={processedCanvasRef} className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="bg-black/30 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, currentTime - 5))}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={() => videoRef.current && (videoRef.current.currentTime = Math.min(duration, currentTime + 5))}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                <div className="text-sm text-gray-300 min-w-max">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                
                <button
                  onClick={resetAllTransforms}
                  className="ml-auto flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset All
                </button>
              </div>
              
              <input
                type="range"
                min="0"
                max={duration}
                step="0.033"
                value={currentTime}
                onChange={handleScrubberChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Transform Controls */}
            <div className="grid xl:grid-cols-4 gap-6">
              
              {/* Global Settings */}
              <div className="bg-black/40 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Global Settings
                </h3>
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Processing Quality</label>
                    <select
                      value={globalParams.processingQuality}
                      onChange={(e) => updateGlobalParam('processingQuality', e.target.value)}
                      className="w-full p-2 bg-gray-700 rounded text-white"
                    >
                      <option value="low">Low (Fast)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="ultra">Ultra (Slow)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Frame Skip: {globalParams.frameSkipping}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={globalParams.frameSkipping}
                      onChange={(e) => updateGlobalParam('frameSkipping', parseInt(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={globalParams.blendMultipleEffects}
                        onChange={(e) => updateGlobalParam('blendMultipleEffects', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Blend Multiple Effects</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={globalParams.smoothTransitions}
                        onChange={(e) => updateGlobalParam('smoothTransitions', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Smooth Transitions</span>
                    </label>
                  </div>
                  
                </div>
              </div>

              {/* Transform Toggles */}
              <div className="bg-black/40 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sliders className="w-5 h-5" />
                  Active Transforms
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'motionDiff', label: 'Motion Difference', color: 'red' },
                    { key: 'timeShift', label: 'Time Shift', color: 'cyan' },
                    { key: 'edgeDetect', label: 'Edge Detection', color: 'yellow' },
                    { key: 'amplification', label: 'Amplification', color: 'purple' },
                    { key: 'heatMap', label: 'Heat Map', color: 'orange' },
                    { key: 'colorShift', label: 'Color Shift', color: 'green' }
                  ].map(transform => (
                    <label
                      key={transform.key}
                      className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-all ${
                        transforms[transform.key] ? 'bg-blue-600/20 border border-blue-500' : 'hover:bg-black/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={transforms[transform.key]}
                        onChange={() => toggleTransform(transform.key)}
                        className="rounded text-blue-600"
                      />
                      <span className="font-medium">{transform.label}</span>
                      <div className={`w-3 h-3 rounded-full bg-${transform.color}-400 ml-auto`}></div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Motion Difference Parameters */}
              {transforms.motionDiff && (
                <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
                  <h3 className="text-lg font-semibold mb-4 text-red-300">Motion Difference</h3>
                  <div className="space-y-4">
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Sensitivity: {transformParams.motionDiff.sensitivity}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={transformParams.motionDiff.sensitivity}
                        onChange={(e) => updateTransformParam('motionDiff', 'sensitivity', parseInt(e.target.value))}
                        className="w-full accent-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Color Mode</label>
                      <select
                        value={transformParams.motionDiff.colorMode}
                        onChange={(e) => updateTransformParam('motionDiff', 'colorMode', e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded text-white"
                      >
                        <option value="red">Red</option>
                        <option value="green">Green</option>
                        <option value="blue">Blue</option>
                        <option value="rainbow">Rainbow</option>
                        <option value="monochrome">Monochrome</option>
                      </select>
                    </div>
                    
                  </div>
                </div>
              )}

              {/* Time Shift Parameters */}
              {transforms.timeShift && (
                <div className="bg-cyan-900/20 rounded-xl p-6 border border-cyan-500/30">
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300">Time Shift</h3>
                  <div className="space-y-4">
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Frame Offset: {transformParams.timeShift.frameOffset}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={transformParams.timeShift.frameOffset}
                        onChange={(e) => updateTransformParam('timeShift', 'frameOffset', parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Mode</label>
                      <select
                        value={transformParams.timeShift.mode}
                        onChange={(e) => updateTransformParam('timeShift', 'mode', e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded text-white"
                      >
                        <option value="difference">Difference</option>
                        <option value="blend">Blend</option>
                        <option value="onion-skin">Onion Skin</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Opacity: {transformParams.timeShift.opacity.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={transformParams.timeShift.opacity}
                        onChange={(e) => updateTransformParam('timeShift', 'opacity', parseFloat(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                    
                  </div>
                </div>
              )}

              {/* Edge Detection Parameters */}
              {transforms.edgeDetect && (
                <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-500/30">
                  <h3 className="text-lg font-semibold mb-4 text-yellow-300">Edge Detection</h3>
                  <div className="space-y-4">
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Algorithm</label>
                      <select
                        value={transformParams.edgeDetect.algorithm}
                        onChange={(e) => updateTransformParam('edgeDetect', 'algorithm', e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded text-white"
                      >
                        <option value="sobel">Sobel</option>
                        <option value="canny">Canny</option>
                        <option value="roberts">Roberts</option>
                        <option value="prewitt">Prewitt</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Threshold: {transformParams.edgeDetect.threshold}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={transformParams.edgeDetect.threshold}
                        onChange={(e) => updateTransformParam('edgeDetect', 'threshold', parseInt(e.target.value))}
                        className="w-full accent-yellow-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Thickness: {transformParams.edgeDetect.thickness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={transformParams.edgeDetect.thickness}
                        onChange={(e) => updateTransformParam('edgeDetect', 'thickness', parseInt(e.target.value))}
                        className="w-full accent-yellow-500"
                      />
                    </div>
                    
                  </div>
                </div>
              )}

              {/* Additional parameter panels for other transforms... */}
              
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default SmoothMotionStudio;