import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Upload, Download, Settings, Activity, BarChart3, Eye, Palette, Sparkles, Timer, Camera } from 'lucide-react';

const MotionExtractionStudio = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [motionData, setMotionData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Motion extraction settings
  const [timeShift, setTimeShift] = useState(1); // frames
  const [extractionMethod, setExtractionMethod] = useState('timeshift');
  const [showOverlay, setShowOverlay] = useState(true);
  const [enhancementMode, setEnhancementMode] = useState('normal');
  const [colorMode, setColorMode] = useState('monochrome');
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [blurAmount, setBlurAmount] = useState(0);
  const [rgbShift, setRgbShift] = useState(false);
  const [sensitivity, setSensitivity] = useState(30);
  const [activeTab, setActiveTab] = useState('extract');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const motionCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Handle video upload with elegance
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(URL.createObjectURL(file));
      setMotionData([]);
      setCurrentTime(0);
    }
  };

  // Video control orchestration
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
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Time-shift motion extraction - the heart of artistic revelation
  const extractMotionTimeshift = useCallback(async (canvas, video, frameShift) => {
    const ctx = canvas.getContext('2d');
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    canvas.width = width;
    canvas.height = height;

    // Capture current frame
    ctx.drawImage(video, 0, 0, width, height);
    const currentFrame = ctx.getImageData(0, 0, width, height);
    
    // Time-shift calculation
    const shiftTime = frameShift / 30; // Assuming 30fps
    const targetTime = Math.max(0, video.currentTime - shiftTime);
    
    // Store current time
    const originalTime = video.currentTime;
    
    // Seek to shifted time
    video.currentTime = targetTime;
    await new Promise(resolve => {
      const handler = () => {
        video.removeEventListener('seeked', handler);
        resolve();
      };
      video.addEventListener('seeked', handler);
    });
    
    // Capture shifted frame
    ctx.drawImage(video, 0, 0, width, height);
    const shiftedFrame = ctx.getImageData(0, 0, width, height);
    
    // Restore original time
    video.currentTime = originalTime;
    
    // Create motion extraction
    const motionFrame = ctx.createImageData(width, height);
    const current = currentFrame.data;
    const shifted = shiftedFrame.data;
    const motion = motionFrame.data;
    
    for (let i = 0; i < current.length; i += 4) {
      // Calculate difference with artistic sensitivity
      const rDiff = Math.abs(current[i] - shifted[i]);
      const gDiff = Math.abs(current[i + 1] - shifted[i + 1]);
      const bDiff = Math.abs(current[i + 2] - shifted[i + 2]);
      const totalDiff = (rDiff + gDiff + bDiff) / 3;
      
      if (totalDiff > sensitivity) {
        if (rgbShift) {
          // RGB time-shifting for artistic effect
          motion[i] = current[i];     // Red from current
          motion[i + 1] = shifted[i + 1]; // Green from shifted
          motion[i + 2] = current[i + 2]; // Blue from current
        } else if (colorMode === 'color') {
          // Preserve original colors in motion
          motion[i] = current[i];
          motion[i + 1] = current[i + 1];
          motion[i + 2] = current[i + 2];
        } else {
          // Monochrome motion extraction
          const intensity = totalDiff * 2;
          motion[i] = intensity;
          motion[i + 1] = intensity;
          motion[i + 2] = intensity;
        }
        motion[i + 3] = Math.min(255, totalDiff * 3); // Alpha based on motion intensity
      } else {
        motion[i] = motion[i + 1] = motion[i + 2] = 0;
        motion[i + 3] = 0;
      }
    }
    
    return motionFrame;
  }, [sensitivity, rgbShift, colorMode]);

  // Advanced pixel-level motion detection
  const detectPixelMotion = useCallback((imageData1, imageData2, threshold) => {
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    let motionPixels = 0;
    const totalPixels = data1.length / 4;
    const motionMap = new Uint8ClampedArray(data1.length);

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
      
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      
      if (diff > threshold) {
        motionPixels++;
        if (enhancementMode === 'glow') {
          motionMap[i] = 255;
          motionMap[i + 1] = 100;
          motionMap[i + 2] = 255;
        } else {
          motionMap[i] = 255;
          motionMap[i + 1] = 0;
          motionMap[i + 2] = 0;
        }
        motionMap[i + 3] = Math.min(255, diff);
      } else {
        motionMap[i] = motionMap[i + 1] = motionMap[i + 2] = motionMap[i + 3] = 0;
      }
    }

    return {
      motionPercentage: (motionPixels / totalPixels) * 100,
      motionMap: new ImageData(motionMap, imageData1.width, imageData1.height)
    };
  }, [enhancementMode]);

  // Real-time motion visualization
  const updateMotionVisualization = useCallback(async () => {
    if (!videoRef.current || !motionCanvasRef.current) return;

    try {
      let motionImageData;
      
      if (extractionMethod === 'timeshift') {
        motionImageData = await extractMotionTimeshift(motionCanvasRef.current, videoRef.current, timeShift);
      } else {
        // Traditional frame comparison method
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        ctx.drawImage(videoRef.current, 0, 0);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (window.lastFrame) {
          const motion = detectPixelMotion(window.lastFrame, currentFrame, sensitivity);
          motionImageData = motion.motionMap;
        }
        
        window.lastFrame = currentFrame;
      }
      
      if (motionImageData) {
        const motionCtx = motionCanvasRef.current.getContext('2d');
        
        // Apply enhancements
        if (blurAmount > 0) {
          motionCtx.filter = `blur(${blurAmount}px)`;
        }
        
        if (glowIntensity > 0) {
          motionCtx.shadowColor = '#00ffff';
          motionCtx.shadowBlur = glowIntensity;
        }
        
        motionCtx.putImageData(motionImageData, 0, 0);
        
        // Reset filters
        motionCtx.filter = 'none';
        motionCtx.shadowBlur = 0;
      }
    } catch (error) {
      console.log('Motion processing continues...', error.message);
    }
  }, [extractionMethod, timeShift, detectPixelMotion, extractMotionTimeshift, blurAmount, glowIntensity]);

  // Continuous motion extraction during playback
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      const animate = () => {
        updateMotionVisualization();
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, updateMotionVisualization]);

  // Export extracted motion as video-like data
  const exportMotionData = () => {
    const canvas = motionCanvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'motion-extraction.png';
      a.click();
    });
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Eloquent Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 mb-3">
            <Camera className="w-10 h-10" />
            Motion Extraction Studio
          </h1>
          <p className="text-lg opacity-90 leading-relaxed">
            Transform the invisible into the visible. Like having millions of sensors scattered across your scene, 
            this studio reveals the subtle dance of motion that surrounds us—from the gentle sway of plants 
            to the imperceptible vibrations that tell stories our eyes cannot see.
          </p>
        </div>

        {/* Upload Sanctuary */}
        {!videoFile && (
          <div className="p-12 text-center">
            <label className="cursor-pointer group">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 hover:border-indigo-400 transition-all duration-300 group-hover:bg-indigo-50">
                <Upload className="w-20 h-20 mx-auto text-slate-400 mb-6 group-hover:text-indigo-500 transition-colors" />
                <h3 className="text-2xl font-semibold text-slate-700 mb-3">Begin Your Motion Journey</h3>
                <p className="text-slate-500 text-lg">Choose a video file to unveil its hidden movements and stories</p>
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

        {/* Main Studio Interface */}
        {videoFile && (
          <div className="p-8">
            {/* Navigation Palette */}
            <div className="flex border-b border-slate-200 mb-8">
              <button
                onClick={() => setActiveTab('extract')}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === 'extract' 
                    ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-5 h-5 inline mr-2" />
                Motion Extraction
              </button>
              <button
                onClick={() => setActiveTab('enhance')}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === 'enhance' 
                    ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Palette className="w-5 h-5 inline mr-2" />
                Artistic Enhancement
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === 'analysis' 
                    ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Deep Analysis
              </button>
            </div>

            {activeTab === 'extract' && (
              <div className="grid xl:grid-cols-2 gap-8">
                {/* Video Theater */}
                <div className="space-y-6">
                  <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
                    <video
                      ref={videoRef}
                      src={videoFile}
                      className="w-full"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                    />
                    {showOverlay && (
                      <canvas
                        ref={motionCanvasRef}
                        className="absolute top-0 left-0 pointer-events-none mix-blend-screen opacity-80"
                        width={videoRef.current?.videoWidth || 0}
                        height={videoRef.current?.videoHeight || 0}
                      />
                    )}
                  </div>

                  {/* Orchestration Controls */}
                  <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlayPause}
                        className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                      </button>
                      <div className="text-slate-600 font-medium">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>

                    {/* Temporal Navigation */}
                    <div
                      className="w-full h-3 bg-slate-200 rounded-full cursor-pointer shadow-inner"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Motion Laboratory */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800">Extraction Method</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="method"
                          value="timeshift"
                          checked={extractionMethod === 'timeshift'}
                          onChange={(e) => setExtractionMethod(e.target.value)}
                          className="text-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-slate-700">Time-Shift Extraction</div>
                          <div className="text-sm text-slate-500">Reveals changes across time by comparing shifted frames</div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="method"
                          value="realtime"
                          checked={extractionMethod === 'realtime'}
                          onChange={(e) => setExtractionMethod(e.target.value)}
                          className="text-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-slate-700">Real-time Detection</div>
                          <div className="text-sm text-slate-500">Live frame-by-frame motion analysis</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Time Manipulation Controls */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
                      <Timer className="w-5 h-5" />
                      Temporal Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Time Shift: {timeShift} frames ({(timeShift / 30).toFixed(2)}s)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="150"
                          value={timeShift}
                          onChange={(e) => setTimeShift(parseInt(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Fast Changes (1 frame)</span>
                          <span>Slow Changes (5 seconds)</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Sensitivity: {sensitivity}
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={sensitivity}
                          onChange={(e) => setSensitivity(parseInt(e.target.value))}
                          className="w-full accent-purple-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visualization Controls */}
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border border-green-200">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800">Display Options</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={showOverlay}
                          onChange={(e) => setShowOverlay(e.target.checked)}
                          className="text-green-600 rounded"
                        />
                        <span className="text-slate-700">Show Motion Overlay</span>
                      </label>
                      
                      <div className="pt-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Color Mode</label>
                        <select
                          value={colorMode}
                          onChange={(e) => setColorMode(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="monochrome">Monochrome</option>
                          <option value="color">Preserve Colors</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={exportMotionData}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-3 font-medium shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Capture Motion Frame
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'enhance' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-violet-50 to-pink-50 p-6 rounded-xl border border-violet-200">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800">Artistic Enhancements</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Glow Intensity: {glowIntensity}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={glowIntensity}
                          onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                          className="w-full accent-pink-600"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Blur Amount: {blurAmount}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={blurAmount}
                          onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                          className="w-full accent-violet-600"
                        />
                        <p className="text-xs text-slate-500 mt-1">Higher values highlight larger motion features</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800">Color Manipulation</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={rgbShift}
                          onChange={(e) => setRgbShift(e.target.checked)}
                          className="text-orange-600 rounded"
                        />
                        <div>
                          <div className="font-medium text-slate-700">RGB Time-Shift</div>
                          <div className="text-sm text-slate-500">Artistic color separation across time</div>
                        </div>
                      </label>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Enhancement Mode</label>
                        <select
                          value={enhancementMode}
                          onChange={(e) => setEnhancementMode(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="normal">Standard</option>
                          <option value="glow">Ethereal Glow</option>
                          <option value="artistic">Artistic Enhancement</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-8 rounded-xl border border-indigo-200">
                  <h3 className="text-2xl font-semibold mb-4 text-slate-800">The Art of Motion Revelation</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    Like a master painter revealing hidden layers beneath the surface, these enhancements transform 
                    subtle movements into visual poetry. The glow effect creates an ethereal quality that makes 
                    motion appear to breathe with life, while blur helps you focus on the grand gestures rather 
                    than fleeting details. RGB time-shifting creates a dreamlike temporal separation, where past 
                    and present dance together in chromatic harmony.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-xl border border-slate-200">
                  <h3 className="text-2xl font-semibold mb-4 text-slate-800">Understanding Motion Through Science</h3>
                  <p className="text-slate-600 leading-relaxed text-lg mb-6">
                    Every pixel becomes a sensor, every frame a measurement. Like the industrial systems described 
                    in our research, this studio transforms your camera into millions of motion detectors, 
                    capable of revealing vibrations and movements invisible to the naked eye.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-blue-100 p-6 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Temporal Resolution</h4>
                      <div className="text-3xl font-bold text-blue-600">{timeShift}</div>
                      <div className="text-sm text-blue-700">frames shifted</div>
                    </div>
                    <div className="bg-green-100 p-6 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Sensitivity Level</h4>
                      <div className="text-3xl font-bold text-green-600">{sensitivity}</div>
                      <div className="text-sm text-green-700">detection threshold</div>
                    </div>
                    <div className="bg-purple-100 p-6 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Enhancement</h4>
                      <div className="text-lg font-bold text-purple-600">{enhancementMode}</div>
                      <div className="text-sm text-purple-700">visual mode</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-8 rounded-xl border border-amber-200">
                  <h3 className="text-xl font-semibold mb-4 text-slate-800">The Philosophy of Invisible Motion</h3>
                  <p className="text-slate-600 leading-relaxed">
                    In every scene, there exists a hidden world of movement—the gentle sway of air currents, 
                    the subtle shift of shadows, the imperceptible vibrations that tell stories of life and 
                    energy. This studio doesn't just show you motion; it reveals the very essence of change 
                    itself, making visible the poetry that exists in every moment.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default MotionExtractionStudio;
