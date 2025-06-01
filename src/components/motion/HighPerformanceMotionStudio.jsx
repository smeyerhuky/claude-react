import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Upload, Zap, Cpu } from 'lucide-react';

const HighPerformanceMotionStudio = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fps, setFps] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Transform toggles
  const [transforms, setTransforms] = useState({
    motionDiff: false,
    timeShift: false,
    edgeDetect: false,
    amplification: false,
    colorShift: false
  });
  
  // Optimized parameters
  const [params, setParams] = useState({
    timeShiftFrames: 3,
    sensitivity: 0.1, // Normalized 0-1
    amplificationFactor: 2.0,
    edgeThreshold: 0.2,
    colorShiftAmount: 5,
    processEveryNFrames: 1, // Frame skip optimization
    useGPU: true
  });

  const videoRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  
  // High-performance refs
  const glRef = useRef(null);
  const programsRef = useRef({});
  const texturesRef = useRef([]);
  const framebuffersRef = useRef([]);
  const frameHistoryRef = useRef([]);
  const performanceRef = useRef({ lastTime: 0, frameCount: 0 });
  const processingRef = useRef({ 
    lastProcessedFrame: -1,
    bufferPool: [],
    isProcessing: false 
  });

  // WebGL shader programs for GPU acceleration
  const shaderSources = useMemo(() => ({
    vertex: `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `,
    
    motionDiff: `
      precision mediump float;
      uniform sampler2D u_texture1;
      uniform sampler2D u_texture2;
      uniform float u_sensitivity;
      varying vec2 v_texCoord;
      
      void main() {
        vec4 color1 = texture2D(u_texture1, v_texCoord);
        vec4 color2 = texture2D(u_texture2, v_texCoord);
        vec3 diff = abs(color1.rgb - color2.rgb);
        float intensity = (diff.r + diff.g + diff.b) / 3.0;
        
        if (intensity > u_sensitivity) {
          gl_FragColor = vec4(intensity, intensity * 0.5, intensity * 0.8, 1.0);
        } else {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      }
    `,
    
    edgeDetect: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_threshold;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texel = 1.0 / u_resolution;
        
        // Sobel X kernel
        float gx = 
          -1.0 * texture2D(u_texture, v_texCoord + vec2(-texel.x, -texel.y)).r +
          -2.0 * texture2D(u_texture, v_texCoord + vec2(-texel.x, 0.0)).r +
          -1.0 * texture2D(u_texture, v_texCoord + vec2(-texel.x, texel.y)).r +
           1.0 * texture2D(u_texture, v_texCoord + vec2(texel.x, -texel.y)).r +
           2.0 * texture2D(u_texture, v_texCoord + vec2(texel.x, 0.0)).r +
           1.0 * texture2D(u_texture, v_texCoord + vec2(texel.x, texel.y)).r;
        
        // Sobel Y kernel  
        float gy = 
          -1.0 * texture2D(u_texture, v_texCoord + vec2(-texel.x, -texel.y)).r +
          -2.0 * texture2D(u_texture, v_texCoord + vec2(0.0, -texel.y)).r +
          -1.0 * texture2D(u_texture, v_texCoord + vec2(texel.x, -texel.y)).r +
           1.0 * texture2D(u_texture, v_texCoord + vec2(-texel.x, texel.y)).r +
           2.0 * texture2D(u_texture, v_texCoord + vec2(0.0, texel.y)).r +
           1.0 * texture2D(u_texture, v_texCoord + vec2(texel.x, texel.y)).r;
        
        float magnitude = sqrt(gx * gx + gy * gy);
        
        if (magnitude > u_threshold) {
          gl_FragColor = vec4(magnitude, magnitude, magnitude, 1.0);
        } else {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      }
    `,
    
    amplification: `
      precision mediump float;
      uniform sampler2D u_current;
      uniform sampler2D u_reference;
      uniform float u_factor;
      varying vec2 v_texCoord;
      
      void main() {
        vec4 current = texture2D(u_current, v_texCoord);
        vec4 reference = texture2D(u_reference, v_texCoord);
        vec4 diff = current - reference;
        vec4 amplified = reference + diff * u_factor;
        gl_FragColor = clamp(amplified, 0.0, 1.0);
      }
    `,
    
    colorShift: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_shift;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texel = 1.0 / u_resolution;
        float shift = u_shift * texel.x;
        
        float r = texture2D(u_texture, v_texCoord + vec2(shift, 0.0)).r;
        float g = texture2D(u_texture, v_texCoord).g;
        float b = texture2D(u_texture, v_texCoord - vec2(shift, 0.0)).b;
        
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `
  }), []);

  // Initialize WebGL context and shaders
  const initWebGL = useCallback(() => {
    if (!processedCanvasRef.current) return false;
    
    const canvas = processedCanvasRef.current;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.warn('WebGL not supported, falling back to CPU processing');
      return false;
    }
    
    glRef.current = gl;
    
    // Compile shader
    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    
    // Create program
    const createProgram = (vertexSource, fragmentSource) => {
      const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
      const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
      
      if (!vertexShader || !fragmentShader) return null;
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        return null;
      }
      
      return program;
    };
    
    // Create all shader programs
    Object.keys(shaderSources).forEach(key => {
      if (key !== 'vertex') {
        programsRef.current[key] = createProgram(shaderSources.vertex, shaderSources[key]);
      }
    });
    
    // Create and bind vertex buffer
    const vertices = new Float32Array([
      -1, -1, 0, 0,  // bottom-left
       1, -1, 1, 0,  // bottom-right
      -1,  1, 0, 1,  // top-left
       1,  1, 1, 1   // top-right
    ]);
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // Store buffer reference for use in rendering
    programsRef.current.vertexBuffer = buffer;
    
    console.log('WebGL initialized successfully');
    return true;
  }, [shaderSources]);

  // Optimized buffer pool for reusing textures
  const getTexture = useCallback((width, height) => {
    const gl = glRef.current;
    if (!gl) return null;
    
    // Reuse texture from pool if available
    let texture = texturesRef.current.find(t => 
      t.width === width && t.height === height && !t.inUse
    );
    
    if (!texture) {
      const glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      
      texture = { glTexture, width, height, inUse: false };
      texturesRef.current.push(texture);
    }
    
    texture.inUse = true;
    return texture;
  }, []);

  const releaseTexture = useCallback((texture) => {
    if (texture) texture.inUse = false;
  }, []);

  // High-performance GPU processing
  const processFrameGPU = useCallback((imageData) => {
    const gl = glRef.current;
    if (!gl || !imageData) return null;
    
    const { width, height } = imageData;
    const startTime = performance.now();
    
    try {
      // Bind vertex buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, programsRef.current.vertexBuffer);
      
      // Create texture from current frame
      const currentTexture = getTexture(width, height);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture.glTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);
      
      let resultTexture = currentTexture;
      
      // Apply transforms efficiently on GPU
      if (transforms.motionDiff && frameHistoryRef.current.length > 0) {
        const prevTexture = frameHistoryRef.current[frameHistoryRef.current.length - 1];
        const program = programsRef.current.motionDiff;
        
        if (program) {
          gl.useProgram(program);
          
          // Set up vertex attributes
          const positionLocation = gl.getAttribLocation(program, 'a_position');
          const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
          
          gl.enableVertexAttribArray(positionLocation);
          gl.enableVertexAttribArray(texCoordLocation);
          gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
          gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
          
          // Set uniforms
          gl.uniform1i(gl.getUniformLocation(program, 'u_texture1'), 0);
          gl.uniform1i(gl.getUniformLocation(program, 'u_texture2'), 1);
          gl.uniform1f(gl.getUniformLocation(program, 'u_sensitivity'), params.sensitivity);
          
          // Bind textures
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, currentTexture.glTexture);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, prevTexture.glTexture);
          
          // Render to canvas directly
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, width, height);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          
          releaseTexture(currentTexture);
        }
      } else {
        // No processing, just display original
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Fall back to canvas 2D for simple display
        const canvas = processedCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Store frame in history
      frameHistoryRef.current.push(currentTexture);
      if (frameHistoryRef.current.length > 30) {
        const oldTexture = frameHistoryRef.current.shift();
        releaseTexture(oldTexture);
      }
      
      const endTime = performance.now();
      setProcessingTime(endTime - startTime);
      
      return resultTexture;
    } catch (error) {
      console.warn('GPU processing failed, falling back to CPU:', error);
      setParams(prev => ({ ...prev, useGPU: false }));
      return null;
    }
  }, [transforms, params, getTexture, releaseTexture]);

  // Optimized CPU fallback processing
  const processFrameCPU = useCallback((imageData) => {
    const startTime = performance.now();
    const { width, height, data } = imageData;
    
    // Reuse buffer from pool
    let outputData = processingRef.current.bufferPool.pop();
    if (!outputData || outputData.length !== data.length) {
      outputData = new Uint8ClampedArray(data.length);
    }
    
    let pixelsChanged = 0;
    
    if (transforms.motionDiff && frameHistoryRef.current.length > 0) {
      const prevData = frameHistoryRef.current[frameHistoryRef.current.length - 1];
      const sensitivity = params.sensitivity * 255;
      
      // Vectorized operations
      for (let i = 0; i < data.length; i += 4) {
        const diff = Math.abs(data[i] - prevData[i]) + 
                    Math.abs(data[i + 1] - prevData[i + 1]) + 
                    Math.abs(data[i + 2] - prevData[i + 2]);
        
        if (diff > sensitivity) {
          outputData[i] = Math.min(255, diff);
          outputData[i + 1] = Math.min(255, diff * 0.5);
          outputData[i + 2] = Math.min(255, diff * 0.8);
          outputData[i + 3] = 255;
          pixelsChanged++;
        } else {
          outputData[i] = outputData[i + 1] = outputData[i + 2] = 0;
          outputData[i + 3] = 255;
        }
      }
      
      // Debug logging
      if (frameHistoryRef.current.length === 1) {
        console.log(`Motion detection: ${pixelsChanged} pixels changed, sensitivity: ${sensitivity}`);
      }
      
    } else if (transforms.timeShift && frameHistoryRef.current.length > params.timeShiftFrames) {
      const shiftedData = frameHistoryRef.current[frameHistoryRef.current.length - params.timeShiftFrames - 1];
      const sensitivity = params.sensitivity * 255;
      
      for (let i = 0; i < data.length; i += 4) {
        const diff = Math.abs(data[i] - shiftedData[i]) + 
                    Math.abs(data[i + 1] - shiftedData[i + 1]) + 
                    Math.abs(data[i + 2] - shiftedData[i + 2]);
        
        if (diff > sensitivity) {
          outputData[i] = Math.min(255, diff);
          outputData[i + 1] = Math.min(255, diff * 0.5);
          outputData[i + 2] = Math.min(255, diff * 0.8);
          outputData[i + 3] = 255;
          pixelsChanged++;
        } else {
          outputData[i] = outputData[i + 1] = outputData[i + 2] = 0;
          outputData[i + 3] = 255;
        }
      }
    } else {
      // No processing, just copy original
      outputData.set(data);
    }
    
    // Store current frame in history as Uint8ClampedArray
    let historyData = processingRef.current.bufferPool.pop();
    if (!historyData || historyData.length !== data.length) {
      historyData = new Uint8ClampedArray(data.length);
    }
    historyData.set(data);
    
    frameHistoryRef.current.push(historyData);
    if (frameHistoryRef.current.length > 30) {
      const oldData = frameHistoryRef.current.shift();
      processingRef.current.bufferPool.push(oldData);
    }
    
    const endTime = performance.now();
    setProcessingTime(endTime - startTime);
    
    return new ImageData(outputData, width, height);
  }, [transforms, params]);

  // Intelligent frame processing with skipping
  const processFrame = useCallback(() => {
    if (!videoRef.current || !originalCanvasRef.current || !processedCanvasRef.current) return;
    if (processingRef.current.isProcessing) return;
    
    const video = videoRef.current;
    
    // Safety checks - ensure video is ready
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    
    const currentFrame = Math.floor(currentTime * 30); // Assuming 30fps
    
    // Skip frames for performance
    if (currentFrame === processingRef.current.lastProcessedFrame) return;
    if (currentFrame % params.processEveryNFrames !== 0) return;
    
    processingRef.current.isProcessing = true;
    processingRef.current.lastProcessedFrame = currentFrame;
    
    try {
      const originalCanvas = originalCanvasRef.current;
      const processedCanvas = processedCanvasRef.current;
      const originalCtx = originalCanvas.getContext('2d');
      const processedCtx = processedCanvas.getContext('2d');
      
      // Update canvas sizes if needed
      if (originalCanvas.width !== video.videoWidth || originalCanvas.height !== video.videoHeight) {
        originalCanvas.width = processedCanvas.width = video.videoWidth;
        originalCanvas.height = processedCanvas.height = video.videoHeight;
      }
      
      // Safety check for canvas dimensions
      if (originalCanvas.width <= 0 || originalCanvas.height <= 0) {
        processingRef.current.isProcessing = false;
        return;
      }
      
      // Draw original
      originalCtx.drawImage(video, 0, 0);
      const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
      
      // Always ensure we have output, even if no transforms are active
      let result;
      const hasActiveTransforms = Object.values(transforms).some(Boolean);
      
      if (hasActiveTransforms) {
        // Process based on capability and settings
        if (params.useGPU && glRef.current) {
          result = processFrameGPU(imageData);
          // GPU processes directly to canvas, no need to putImageData
        } else {
          result = processFrameCPU(imageData);
          if (result) {
            processedCtx.putImageData(result, 0, 0);
          }
        }
      } else {
        // No transforms active, just copy original to processed canvas
        processedCtx.putImageData(imageData, 0, 0);
      }
      
      // Update FPS counter
      const now = performance.now();
      performanceRef.current.frameCount++;
      if (now - performanceRef.current.lastTime >= 1000) {
        setFps(performanceRef.current.frameCount);
        performanceRef.current.frameCount = 0;
        performanceRef.current.lastTime = now;
      }
      
    } catch (error) {
      console.warn('Frame processing error:', error);
    } finally {
      processingRef.current.isProcessing = false;
    }
    
  }, [currentTime, params, transforms, processFrameGPU, processFrameCPU]);

  // Video upload handler
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(URL.createObjectURL(file));
      setCurrentTime(0);
      setFps(0);
      setIsVideoReady(false);
      frameHistoryRef.current = [];
      processingRef.current.lastProcessedFrame = -1;
      processingRef.current.bufferPool = [];
      
      // Clear any existing WebGL resources
      if (glRef.current) {
        texturesRef.current.forEach(texture => {
          if (texture.glTexture) {
            glRef.current.deleteTexture(texture.glTexture);
          }
        });
        texturesRef.current = [];
      }
      
      // Initialize WebGL after video loads with a delay
      setTimeout(() => {
        if (params.useGPU && processedCanvasRef.current) {
          const glSupported = initWebGL();
          if (!glSupported) {
            setParams(prev => ({ ...prev, useGPU: false }));
          }
        }
      }, 500); // Give video time to load
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
      setIsVideoReady(true);
      console.log('Video ready:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
    }
  };

  const handleScrubberChange = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Throttled processing loop
  useEffect(() => {
    if (videoFile && videoRef.current && isVideoReady) {
      let animationId;
      let lastTime = 0;
      
      const animate = (currentTime) => {
        // Throttle to ~30fps max
        if (currentTime - lastTime >= 33) {
          processFrame();
          lastTime = currentTime;
        }
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [videoFile, isVideoReady, processFrame]);

  const toggleTransform = (transform) => {
    setTransforms(prev => ({ ...prev, [transform]: !prev[transform] }));
  };

  const updateParam = (param, value) => {
    setParams(prev => ({ ...prev, [param]: value }));
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with performance stats */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Zap className="w-8 h-8 text-yellow-500" />
              High-Performance Motion Studio
            </h1>
            <p className="text-gray-400">GPU-accelerated real-time motion analysis</p>
          </div>
          
          {videoFile && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{fps} FPS</div>
              <div className="text-sm text-gray-400">
                Processing: {processingTime.toFixed(1)}ms
              </div>
              <div className="text-xs text-gray-500">
                {params.useGPU ? '🚀 GPU' : '🖥️ CPU'} | Skip: {params.processEveryNFrames}
              </div>
              <div className={`text-xs ${isVideoReady ? 'text-green-400' : 'text-yellow-400'}`}>
                {isVideoReady ? '✅ Ready' : '⏳ Loading...'}
              </div>
            </div>
          )}
        </div>

        {/* Upload */}
        {!videoFile && (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-gray-500 transition-colors">
            <label className="cursor-pointer">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <div className="text-xl font-semibold mb-2">Upload Video for Analysis</div>
              <div className="text-gray-400">Optimized for high-resolution, high-framerate content</div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  📹 Original
                  <span className="text-sm text-gray-400">
                    {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}
                  </span>
                </h3>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoFile}
                    className="w-full"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlayThrough={() => setIsVideoReady(true)}
                    onLoadedData={() => console.log('Video data loaded')}
                    muted
                  />
                  <canvas 
                    ref={originalCanvasRef} 
                    className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" 
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  ⚡ Processed
                  <span className="text-sm text-green-400">
                    {Object.values(transforms).filter(Boolean).length} active
                  </span>
                </h3>
                <div className="bg-black rounded-lg overflow-hidden h-full">
                  <canvas 
                    ref={processedCanvasRef} 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Optimized Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={skipBackward} className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button onClick={togglePlayPause} className="p-3 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                <button onClick={skipForward} className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
                
                <div className="text-sm text-gray-300 min-w-max">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Speed:</span>
                  {[0.25, 0.5, 1, 2, 4].map(rate => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
                        if (videoRef.current) videoRef.current.playbackRate = rate;
                      }}
                      className={`px-2 py-1 rounded text-sm transition-colors ${
                        playbackRate === rate ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max={duration}
                step="0.033" // ~30fps precision
                value={currentTime}
                onChange={handleScrubberChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
            </div>

            {/* Performance-Optimized Controls */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Transforms */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Transforms
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'motionDiff', label: 'Motion Difference', cost: '💚 Light' },
                    { key: 'timeShift', label: 'Time Shift', cost: '💛 Medium' },
                    { key: 'edgeDetect', label: 'Edge Detection', cost: '🧡 Heavy' },
                    { key: 'amplification', label: 'Motion Amplification', cost: '❤️ Heavy' },
                    { key: 'colorShift', label: 'RGB Color Shift', cost: '💚 Light' }
                  ].map(transform => (
                    <label key={transform.key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transforms[transform.key]}
                        onChange={() => toggleTransform(transform.key)}
                        className="rounded"
                      />
                      <span className="flex-1">{transform.label}</span>
                      <span className="text-xs">{transform.cost}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Performance Settings */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Performance</h3>
                <div className="space-y-4">
                  
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={params.useGPU}
                        onChange={(e) => updateParam('useGPU', e.target.checked)}
                        className="rounded"
                      />
                      <span>GPU Acceleration</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Process Every {params.processEveryNFrames} Frame(s)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={params.processEveryNFrames}
                      onChange={(e) => updateParam('processEveryNFrames', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Higher = Better performance, Lower quality
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Algorithm Parameters */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Parameters</h3>
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sensitivity: {(params.sensitivity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value={params.sensitivity}
                      onChange={(e) => updateParam('sensitivity', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Time Shift: {params.timeShiftFrames} frames
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
                      Amplification: {params.amplificationFactor.toFixed(1)}x
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
                  
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default HighPerformanceMotionStudio;