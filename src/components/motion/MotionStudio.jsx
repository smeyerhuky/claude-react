import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Upload, Download, Settings, Activity, BarChart3, Eye, Palette, Sparkles, Timer, Camera, Wand2, Zap, Heart, Brain } from 'lucide-react';

const MotionStudio = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [motionData, setMotionData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // The heart of motion detection
  const [detectionMode, setDetectionMode] = useState('temporal'); // temporal, differential, hybrid
  const [timeShift, setTimeShift] = useState(1);
  const [sensitivity, setSensitivity] = useState(30);
  const [showOverlay, setShowOverlay] = useState(true);
  
  // The soul of artistic expression
  const [visualMode, setVisualMode] = useState('motion-only'); // motion-only, overlay, artistic
  const [colorPalette, setColorPalette] = useState('spectrum');
  const [enhancement, setEnhancement] = useState('subtle');
  const [glowIntensity, setGlowIntensity] = useState(15);
  const [blurRadius, setBlurRadius] = useState(2);
  const [rgbSeparation, setRgbSeparation] = useState(false);
  const [pulseWithMotion, setPulseWithMotion] = useState(false);
  
  // The mind of analysis
  const [frequencyFilter, setFrequencyFilter] = useState({ min: 0.5, max: 30 });
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(true);
  
  const [activeWorkspace, setActiveWorkspace] = useState('discover');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const motionCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const frameHistoryRef = useRef([]);
  const lastProcessTimeRef = useRef(0);

  // The gentle art of video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(URL.createObjectURL(file));
      setMotionData([]);
      setCurrentTime(0);
      frameHistoryRef.current = [];
      
      // A whispered promise of discoveries to come
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          });
        }
      }, 100);
    }
  };

  // The rhythmic dance of playback control
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

  // The alchemy of temporal motion detection
  const detectTemporalMotion = useCallback(async (video, canvas, timeShift) => {
    const ctx = canvas.getContext('2d');
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    if (!width || !height) return null;
    
    canvas.width = width;
    canvas.height = height;

    // Capture the present moment
    ctx.drawImage(video, 0, 0, width, height);
    const currentFrame = ctx.getImageData(0, 0, width, height);
    
    // Journey back in time
    const originalTime = video.currentTime;
    const targetTime = Math.max(0, originalTime - (timeShift / 30));
    
    return new Promise((resolve) => {
      const tempVideo = document.createElement('video');
      tempVideo.src = video.src;
      tempVideo.currentTime = targetTime;
      
      tempVideo.addEventListener('seeked', () => {
        ctx.drawImage(tempVideo, 0, 0, width, height);
        const pastFrame = ctx.getImageData(0, 0, width, height);
        
        // The moment of revelation - where past meets present
        const motionFrame = extractMotionEssence(currentFrame, pastFrame);
        resolve(motionFrame);
      }, { once: true });
    });
  }, []);

  // The poetry of differential motion detection
  const detectDifferentialMotion = useCallback((frame1, frame2) => {
    if (!frame1 || !frame2) return null;
    
    const data1 = frame1.data;
    const data2 = frame2.data;
    const motionData = new Uint8ClampedArray(data1.length);
    
    let totalMotion = 0;
    let motionPixels = 0;
    
    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
      
      // The whispered difference between moments
      const luminanceDiff = Math.abs((r1 + g1 + b1) - (r2 + g2 + b2)) / 3;
      const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      const motionIntensity = (luminanceDiff + colorDiff) / 2;
      
      // Adaptive threshold - let the image speak its own language
      const threshold = adaptiveThreshold ? 
        Math.max(sensitivity * 0.5, Math.min(sensitivity * 2, luminanceDiff * 0.8)) : 
        sensitivity;
      
      if (motionIntensity > threshold) {
        motionPixels++;
        totalMotion += motionIntensity;
        
        // Paint the motion with the chosen palette
        applyMotionColor(motionData, i, motionIntensity, colorPalette);
      } else {
        motionData[i] = motionData[i + 1] = motionData[i + 2] = 0;
        motionData[i + 3] = 0;
      }
    }
    
    return {
      imageData: new ImageData(motionData, frame1.width, frame1.height),
      motionLevel: (motionPixels / (frame1.width * frame1.height)) * 100,
      totalIntensity: totalMotion
    };
  }, [sensitivity, adaptiveThreshold, colorPalette]);

  // The artist's palette of motion colors
  const applyMotionColor = (motionData, index, intensity, palette) => {
    const normalizedIntensity = Math.min(255, intensity * 2);
    
    switch (palette) {
      case 'fire':
        motionData[index] = 255;
        motionData[index + 1] = Math.max(0, normalizedIntensity - 100);
        motionData[index + 2] = Math.max(0, normalizedIntensity - 200);
        break;
      case 'ocean':
        motionData[index] = Math.max(0, normalizedIntensity - 200);
        motionData[index + 1] = Math.max(0, normalizedIntensity - 100);
        motionData[index + 2] = 255;
        break;
      case 'forest':
        motionData[index] = Math.max(0, normalizedIntensity - 150);
        motionData[index + 1] = 255;
        motionData[index + 2] = Math.max(0, normalizedIntensity - 150);
        break;
      case 'spectrum':
        const hue = (intensity * 2) % 360;
        const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
        motionData[index] = r;
        motionData[index + 1] = g;
        motionData[index + 2] = b;
        break;
      default:
        motionData[index] = normalizedIntensity;
        motionData[index + 1] = normalizedIntensity * 0.5;
        motionData[index + 2] = normalizedIntensity * 0.8;
    }
    motionData[index + 3] = Math.min(255, normalizedIntensity + 50);
  };

  // The mathematical magic of color transformation
  const hslToRgb = (h, s, l) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    if (h < 1/6) [r, g, b] = [c, x, 0];
    else if (h < 2/6) [r, g, b] = [x, c, 0];
    else if (h < 3/6) [r, g, b] = [0, c, x];
    else if (h < 4/6) [r, g, b] = [0, x, c];
    else if (h < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  };

  // The essence extraction from temporal comparison
  const extractMotionEssence = (currentFrame, pastFrame) => {
    const current = currentFrame.data;
    const past = pastFrame.data;
    const motion = new Uint8ClampedArray(current.length);
    
    for (let i = 0; i < current.length; i += 4) {
      const diff = Math.abs(current[i] - past[i]) + 
                   Math.abs(current[i + 1] - past[i + 1]) + 
                   Math.abs(current[i + 2] - past[i + 2]);
      
      if (diff > sensitivity) {
        if (rgbSeparation) {
          motion[i] = current[i];
          motion[i + 1] = past[i + 1];
          motion[i + 2] = current[i + 2];
        } else {
          applyMotionColor(motion, i, diff, colorPalette);
        }
        motion[i + 3] = Math.min(255, diff * 2);
      } else {
        motion[i] = motion[i + 1] = motion[i + 2] = motion[i + 3] = 0;
      }
    }
    
    return new ImageData(motion, currentFrame.width, currentFrame.height);
  };

  // The real-time orchestration of motion revelation
  const updateMotionVisualization = useCallback(async () => {
    if (!videoRef.current || !motionCanvasRef.current) return;
    
    const now = performance.now();
    if (now - lastProcessTimeRef.current < 33) return; // Throttle to ~30fps
    lastProcessTimeRef.current = now;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!video.videoWidth || !video.videoHeight) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Capture the current moment
      ctx.drawImage(video, 0, 0);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      let motionResult = null;
      
      if (detectionMode === 'temporal' && frameHistoryRef.current.length > timeShift) {
        const pastFrame = frameHistoryRef.current[frameHistoryRef.current.length - timeShift];
        motionResult = detectDifferentialMotion(currentFrame, pastFrame);
      } else if (detectionMode === 'differential' && frameHistoryRef.current.length > 0) {
        const lastFrame = frameHistoryRef.current[frameHistoryRef.current.length - 1];
        motionResult = detectDifferentialMotion(currentFrame, lastFrame);
      } else if (detectionMode === 'hybrid') {
        // The wisdom of combining approaches
        if (frameHistoryRef.current.length > Math.max(1, timeShift)) {
          const recentFrame = frameHistoryRef.current[frameHistoryRef.current.length - 1];
          const distantFrame = frameHistoryRef.current[frameHistoryRef.current.length - Math.min(timeShift, frameHistoryRef.current.length)];
          
          const recentMotion = detectDifferentialMotion(currentFrame, recentFrame);
          const temporalMotion = detectDifferentialMotion(currentFrame, distantFrame);
          
          if (recentMotion && temporalMotion) {
            motionResult = blendMotionResults(recentMotion, temporalMotion);
          }
        }
      }
      
      // Remember this moment for future comparisons
      frameHistoryRef.current.push(currentFrame);
      if (frameHistoryRef.current.length > 150) { // Keep ~5 seconds at 30fps
        frameHistoryRef.current.shift();
      }
      
      // Paint the motion onto our canvas
      if (motionResult && showOverlay) {
        const motionCtx = motionCanvasRef.current.getContext('2d');
        motionCanvasRef.current.width = canvas.width;
        motionCanvasRef.current.height = canvas.height;
        
        // Apply artistic enhancements
        if (enhancement !== 'none') {
          applyVisualEnhancements(motionCtx, motionResult.imageData);
        } else {
          motionCtx.putImageData(motionResult.imageData, 0, 0);
        }
        
        // Update our understanding of motion
        setMotionData(prev => [...prev.slice(-299), {
          time: currentTime,
          level: motionResult.motionLevel || 0,
          intensity: motionResult.totalIntensity || 0
        }]);
      }
      
    } catch (error) {
      console.log('Motion continues to flow...', error.message);
    }
  }, [detectionMode, timeShift, detectDifferentialMotion, currentTime, showOverlay, enhancement]);

  // The artisan's touch - visual enhancements
  const applyVisualEnhancements = (ctx, imageData) => {
    ctx.putImageData(imageData, 0, 0);
    
    if (enhancement === 'ethereal') {
      ctx.shadowColor = colorPalette === 'fire' ? '#ff6b6b' : '#4ecdc4';
      ctx.shadowBlur = glowIntensity;
      ctx.globalCompositeOperation = 'screen';
    } else if (enhancement === 'dreamlike') {
      ctx.filter = `blur(${blurRadius}px) contrast(150%) brightness(120%)`;
    } else if (enhancement === 'cinematic') {
      ctx.globalCompositeOperation = 'overlay';
      ctx.filter = 'contrast(200%) saturate(150%)';
    }
    
    if (pulseWithMotion) {
      const currentMotion = motionData[motionData.length - 1];
      if (currentMotion) {
        const pulse = 0.7 + (currentMotion.level / 100) * 0.3;
        ctx.globalAlpha = pulse;
      }
    }
  };

  // The wisdom of blending motion techniques
  const blendMotionResults = (result1, result2) => {
    const data1 = result1.imageData.data;
    const data2 = result2.imageData.data;
    const blended = new Uint8ClampedArray(data1.length);
    
    for (let i = 0; i < data1.length; i += 4) {
      blended[i] = Math.max(data1[i], data2[i]);
      blended[i + 1] = Math.max(data1[i + 1], data2[i + 1]);
      blended[i + 2] = Math.max(data1[i + 2], data2[i + 2]);
      blended[i + 3] = Math.max(data1[i + 3], data2[i + 3]);
    }
    
    return {
      imageData: new ImageData(blended, result1.imageData.width, result1.imageData.height),
      motionLevel: Math.max(result1.motionLevel, result2.motionLevel),
      totalIntensity: result1.totalIntensity + result2.totalIntensity
    };
  };

  // The continuous dance of motion detection
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

  // The gift of motion data to the world
  const exportMotionArt = () => {
    const canvas = motionCanvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `motion-art-${Date.now()}.png`;
      a.click();
    });
  };

  const exportMotionData = () => {
    if (motionData.length === 0) return;
    
    const csvContent = [
      'Time (s),Motion Level (%),Intensity',
      ...motionData.map(d => `${d.time.toFixed(3)},${d.level.toFixed(3)},${d.intensity?.toFixed(3) || 0}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motion-analysis-${Date.now()}.csv`;
    a.click();
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentMotionLevel = () => {
    if (motionData.length === 0) return 0;
    const latest = motionData[motionData.length - 1];
    return latest ? latest.level : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          
          {/* The Welcome Portal */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <h1 className="text-4xl font-bold flex items-center gap-4 mb-4">
                <div className="relative">
                  <Camera className="w-12 h-12" />
                  <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-yellow-300" />
                </div>
                Motion Studio
              </h1>
              <p className="text-xl opacity-95 leading-relaxed max-w-4xl">
                Welcome to a sanctuary where science meets art, where every pixel becomes a poet 
                and every frame tells the story of movement invisible to the naked eye. Here, we don't just 
                detect motion—we reveal the hidden symphony of change that dances through every moment.
              </p>
            </div>
          </div>

          {/* The Sacred Upload Space */}
          {!videoFile && (
            <div className="p-16 text-center">
              <label className="cursor-pointer group block">
                <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-20 hover:border-indigo-400 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-indigo-50 group-hover:to-purple-50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/5 to-pink-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="relative mb-8">
                      <Upload className="w-24 h-24 mx-auto text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300" />
                      <Heart className="w-8 h-8 absolute -top-2 -right-2 text-pink-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110" />
                    </div>
                    <h3 className="text-3xl font-semibold text-slate-700 mb-4 group-hover:text-indigo-700 transition-colors">
                      Begin Your Journey of Discovery
                    </h3>
                    <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
                      Choose a video file and step into a world where the invisible becomes visible, 
                      where motion speaks in colors, and where every movement tells its story.
                    </p>
                  </div>
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

          {/* The Main Studio Experience */}
          {videoFile && (
            <div className="p-8">
              
              {/* The Workspace Navigation */}
              <div className="flex flex-wrap border-b border-slate-200 mb-8">
                {[
                  { id: 'discover', icon: Eye, label: 'Discover Motion', desc: 'Reveal hidden movements' },
                  { id: 'create', icon: Wand2, label: 'Artistic Expression', desc: 'Transform motion into art' },
                  { id: 'analyze', icon: Brain, label: 'Deep Analysis', desc: 'Understand the science' },
                  { id: 'enhance', icon: Zap, label: 'Advanced Tools', desc: 'Professional features' }
                ].map(workspace => (
                  <button
                    key={workspace.id}
                    onClick={() => setActiveWorkspace(workspace.id)}
                    className={`px-6 py-4 font-medium transition-all duration-300 border-b-2 ${
                      activeWorkspace === workspace.id 
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <workspace.icon className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">{workspace.label}</div>
                        <div className="text-xs opacity-75">{workspace.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* The Discovery Workspace */}
              {activeWorkspace === 'discover' && (
                <div className="grid xl:grid-cols-3 gap-8">
                  
                  {/* The Video Theater */}
                  <div className="xl:col-span-2 space-y-6">
                    <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
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
                          className={`absolute top-0 left-0 pointer-events-none transition-opacity duration-300 ${
                            visualMode === 'motion-only' ? 'opacity-100 mix-blend-normal' :
                            visualMode === 'overlay' ? 'opacity-80 mix-blend-screen' :
                            'opacity-90 mix-blend-overlay'
                          }`}
                          width={videoRef.current?.videoWidth || 0}
                          height={videoRef.current?.videoHeight || 0}
                        />
                      )}
                      
                      {/* The Gentle Motion Indicator */}
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                        <div className="text-sm opacity-75">Motion Level</div>
                        <div className="text-xl font-bold">
                          {getCurrentMotionLevel().toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* The Orchestration Panel */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                      <div className="flex items-center gap-4 mb-4">
                        <button
                          onClick={togglePlayPause}
                          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                        >
                          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                        </button>
                        <div className="flex-1">
                          <div className="text-slate-600 font-medium mb-1">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                          <div
                            className="w-full h-3 bg-slate-200 rounded-full cursor-pointer shadow-inner relative overflow-hidden"
                            onClick={handleSeek}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-150 relative"
                              style={{ width: `${(currentTime / duration) * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Controls */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Detection Method
                          </label>
                          <select
                            value={detectionMode}
                            onChange={(e) => setDetectionMode(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="differential">Moment-to-moment</option>
                            <option value="temporal">Time-shift reveal</option>
                            <option value="hybrid">Hybrid wisdom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Visual Mode
                          </label>
                          <select
                            value={visualMode}
                            onChange={(e) => setVisualMode(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="motion-only">Motion only</option>
                            <option value="overlay">Gentle overlay</option>
                            <option value="artistic">Artistic blend</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* The Motion Analytics Panel */}
                  <div className="space-y-6">
                    
                    {/* Live Motion Pulse */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Motion Heartbeat
                      </h3>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-2">
                          {getCurrentMotionLevel().toFixed(1)}%
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 relative"
                            style={{ width: `${Math.min(getCurrentMotionLevel(), 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Motion History */}
                    {motionData.length > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Motion Flow</h3>
                        <div className="h-32 relative">
                          <svg className="w-full h-full" viewBox="0 0 300 100">
                            <defs>
                              <linearGradient id="motionFlow" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                              </linearGradient>
                            </defs>
                            
                            <path
                              d={`M ${motionData.slice(-60).map((d, i) => 
                                `${i * 5} ${100 - (d.level * 0.8)}`
                              ).join(' L ')}`}
                              fill="url(#motionFlow)"
                              stroke="#3B82F6"
                              strokeWidth="2"
                            />
                            
                            <circle
                              cx={Math.min(295, (motionData.length - 1) * 5)}
                              cy={100 - (getCurrentMotionLevel() * 0.8)}
                              r="4"
                              fill="#EF4444"
                              className="animate-pulse"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOverlay}
                          onChange={(e) => setShowOverlay(e.target.checked)}
                          className="text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-slate-700 font-medium">Show motion overlay</span>
                      </label>
                      
                      <button
                        onClick={exportMotionArt}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        Capture this moment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* The Creative Workspace */}
              {activeWorkspace === 'create' && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">The Artist's Canvas</h2>
                    <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
                      Here, motion becomes poetry. Transform the raw essence of movement into visual symphonies 
                      that speak to the soul. Each adjustment is a brushstroke in your motion masterpiece.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* Color & Style Palette */}
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200">
                      <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Palette className="w-6 h-6 text-pink-600" />
                        Motion Palette
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">Color Story</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'fire', name: 'Fire Dance', colors: ['#FF6B6B', '#FF8E53'] },
                              { id: 'ocean', name: 'Ocean Depths', colors: ['#4ECDC4', '#44A08D'] },
                              { id: 'forest', name: 'Forest Whisper', colors: ['#A8E6CF', '#7FCDCD'] },
                              { id: 'spectrum', name: 'Rainbow Dreams', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] }
                            ].map(palette => (
                              <button
                                key={palette.id}
                                onClick={() => setColorPalette(palette.id)}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  colorPalette === palette.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex space-x-1 mb-2">
                                  {palette.colors.map((color, i) => (
                                    <div
                                      key={i}
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                                <div className="text-xs font-medium text-slate-700">{palette.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">Enhancement Spirit</label>
                          <select
                            value={enhancement}
                            onChange={(e) => setEnhancement(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white"
                          >
                            <option value="subtle">Subtle whisper</option>
                            <option value="ethereal">Ethereal glow</option>
                            <option value="dreamlike">Dreamlike blur</option>
                            <option value="cinematic">Cinematic drama</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Artistry */}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-200">
                      <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-violet-600" />
                        Artistic Flourishes
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ethereal Glow: {glowIntensity}px
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={glowIntensity}
                            onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                            className="w-full accent-violet-600"
                          />
                          <p className="text-xs text-slate-500 mt-1">Adds a mystical aura to motion</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Dream Blur: {blurRadius}px
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="15"
                            value={blurRadius}
                            onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                          <p className="text-xs text-slate-500 mt-1">Softens motion for dreamy effects</p>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rgbSeparation}
                              onChange={(e) => setRgbSeparation(e.target.checked)}
                              className="text-purple-600 rounded focus:ring-purple-500"
                            />
                            <div>
                              <div className="font-medium text-slate-700">RGB Time-Separation</div>
                              <div className="text-xs text-slate-500">Creates chromatic time-shift effects</div>
                            </div>
                          </label>
                          
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pulseWithMotion}
                              onChange={(e) => setPulseWithMotion(e.target.checked)}
                              className="text-purple-600 rounded focus:ring-purple-500"
                            />
                            <div>
                              <div className="font-medium text-slate-700">Pulse with Motion</div>
                              <div className="text-xs text-slate-500">Breathes with the rhythm of movement</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* The Analysis Workspace */}
              {activeWorkspace === 'analyze' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">The Laboratory of Understanding</h2>
                    <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
                      Peer into the very essence of motion itself. Here, science and intuition unite to reveal 
                      the hidden patterns and rhythms that govern the dance of movement around us.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* Motion Science */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-blue-600" />
                        Motion Intelligence
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Sensitivity Threshold: {sensitivity}
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={sensitivity}
                            onChange={(e) => setSensitivity(parseInt(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Whisper-sensitive</span>
                            <span>Thunder-only</span>
                          </div>
                        </div>
                        
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
                          <p className="text-xs text-slate-500 mt-1">
                            How far back in time should we look for changes?
                          </p>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={adaptiveThreshold}
                              onChange={(e) => setAdaptiveThreshold(e.target.checked)}
                              className="text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-slate-700">Adaptive Intelligence</div>
                              <div className="text-xs text-slate-500">Let the algorithm learn from the scene</div>
                            </div>
                          </label>
                          
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={noiseReduction}
                              onChange={(e) => setNoiseReduction(e.target.checked)}
                              className="text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-slate-700">Noise Wisdom</div>
                              <div className="text-xs text-slate-500">Filter out the digital whispers</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Statistics & Insights */}
                    <div className="space-y-6">
                      {motionData.length > 10 && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                          <h3 className="text-lg font-semibold text-slate-800 mb-4">Motion Insights</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-600">
                                {(motionData.reduce((sum, d) => sum + d.level, 0) / motionData.length).toFixed(1)}%
                              </div>
                              <div className="text-sm text-emerald-800">Average Motion</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-teal-600">
                                {Math.max(...motionData.map(d => d.level)).toFixed(1)}%
                              </div>
                              <div className="text-sm text-teal-800">Peak Motion</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={exportMotionData}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        Export Analysis Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* The Professional Tools Workspace */}
              {activeWorkspace === 'enhance' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">Professional Motion Laboratory</h2>
                    <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
                      For the serious motion artist and researcher. These tools unlock the full potential 
                      of motion analysis, offering precision control and advanced capabilities.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-xl border border-amber-200">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">🔬 Advanced Features Coming Soon</h3>
                    <p className="text-slate-600 leading-relaxed">
                      This workspace is being crafted with the same care and attention as the rest of Motion Studio. 
                      Soon, you'll find frequency filtering, advanced export options, batch processing, and more 
                      professional-grade tools to elevate your motion analysis to new heights.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden canvases for processing */}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={overlayCanvasRef} className="hidden" />
          <canvas ref={analysisCanvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default MotionStudio;