import React, { useState, useEffect, useRef } from 'react';

// Main application component
const VideoToMusicApp = () => {
  // State management
  const [isCapturing, setIsCapturing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    motionLevel: 0,
    edgeIntensity: 0,
    dominantHue: 0
  });
  
  // Audio parameters
  const [bassParams, setBassParams] = useState({
    frequency: 60,
    lfoRate: 4,
    filterQ: 10
  });
  
  const [rhythmParams, setRhythmParams] = useState({
    kickVolume: 0.7,
    hihatVolume: 0.5,
    bpm: 128
  });
  
  // References
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const animationRef = useRef(null);
  
  // Audio context and nodes
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef({
    oscillator: null,
    filter: null,
    lfo: null,
    gain: null,
    kickScheduler: null,
    hihatScheduler: null,
    nextKickTime: 0,
    nextHihatTime: 0
  });
  
  // Initialize audio engine
  useEffect(() => {
    if (audioEnabled && !audioContextRef.current) {
      // Create audio context
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      // Create wobble bass components
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = bassParams.frequency;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      filter.Q.value = bassParams.filterQ;
      
      const lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = bassParams.lfoRate;
      
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 500;
      
      const gain = audioCtx.createGain();
      gain.gain.value = 0;
      
      // Connect wobble bass components
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      // Start oscillators
      oscillator.start();
      lfo.start();
      
      // Store references
      audioNodesRef.current = {
        ...audioNodesRef.current,
        oscillator,
        filter,
        lfo,
        lfoGain,
        gain
      };
      
      // Set up rhythm schedulers
      const scheduleKick = () => {
        const kickTime = audioNodesRef.current.nextKickTime;
        
        // Create kick drum sound
        const kickOsc = audioCtx.createOscillator();
        kickOsc.frequency.value = 60;
        
        const kickGain = audioCtx.createGain();
        kickGain.gain.value = rhythmParams.kickVolume * (analysisData.edgeIntensity * 0.5 + 0.5);
        
        // Frequency envelope
        kickOsc.frequency.setValueAtTime(150, kickTime);
        kickOsc.frequency.exponentialRampToValueAtTime(0.01, kickTime + 0.3);
        
        // Amplitude envelope
        kickGain.gain.setValueAtTime(rhythmParams.kickVolume, kickTime);
        kickGain.gain.exponentialRampToValueAtTime(0.01, kickTime + 0.3);
        
        // Connect and start
        kickOsc.connect(kickGain);
        kickGain.connect(audioCtx.destination);
        kickOsc.start(kickTime);
        kickOsc.stop(kickTime + 0.3);
        
        // Calculate next kick time (4-on-the-floor pattern)
        const secondsPerBeat = 60 / rhythmParams.bpm;
        audioNodesRef.current.nextKickTime = kickTime + secondsPerBeat;
        
        // Schedule next kick
        const kickScheduler = setTimeout(scheduleKick, (audioNodesRef.current.nextKickTime - audioCtx.currentTime) * 1000 - 20);
        audioNodesRef.current.kickScheduler = kickScheduler;
      };
      
      const scheduleHihat = () => {
        const hihatTime = audioNodesRef.current.nextHihatTime;
        
        // Create hi-hat sound
        const hihatOsc = audioCtx.createOscillator();
        hihatOsc.type = 'square';
        hihatOsc.frequency.value = 800;
        
        const hihatFilter = audioCtx.createBiquadFilter();
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 7000;
        
        const hihatGain = audioCtx.createGain();
        hihatGain.gain.value = rhythmParams.hihatVolume * (analysisData.edgeIntensity * 0.7 + 0.3);
        
        // Amplitude envelope (short decay for hi-hat)
        hihatGain.gain.setValueAtTime(hihatGain.gain.value, hihatTime);
        hihatGain.gain.exponentialRampToValueAtTime(0.01, hihatTime + 0.05);
        
        // Connect and start
        hihatOsc.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(audioCtx.destination);
        hihatOsc.start(hihatTime);
        hihatOsc.stop(hihatTime + 0.05);
        
        // Calculate next hi-hat time (offbeat pattern)
        const secondsPerBeat = 60 / rhythmParams.bpm;
        audioNodesRef.current.nextHihatTime = hihatTime + secondsPerBeat / 2;
        
        // Schedule next hi-hat
        const hihatScheduler = setTimeout(scheduleHihat, (audioNodesRef.current.nextHihatTime - audioCtx.currentTime) * 1000 - 20);
        audioNodesRef.current.hihatScheduler = hihatScheduler;
      };
      
      // Initialize rhythm timers
      audioNodesRef.current.nextKickTime = audioCtx.currentTime;
      audioNodesRef.current.nextHihatTime = audioCtx.currentTime + (60 / rhythmParams.bpm) / 2;
      scheduleKick();
      scheduleHihat();
    }
    
    // Cleanup function
    return () => {
      if (audioContextRef.current) {
        if (audioNodesRef.current.oscillator) audioNodesRef.current.oscillator.stop();
        if (audioNodesRef.current.lfo) audioNodesRef.current.lfo.stop();
        if (audioNodesRef.current.kickScheduler) clearTimeout(audioNodesRef.current.kickScheduler);
        if (audioNodesRef.current.hihatScheduler) clearTimeout(audioNodesRef.current.hihatScheduler);
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioEnabled, bassParams.frequency, bassParams.lfoRate, bassParams.filterQ, rhythmParams]);
  
  // Update bass parameters when they change
  useEffect(() => {
    if (audioContextRef.current) {
      const { oscillator, filter, lfo } = audioNodesRef.current;
      
      if (oscillator) oscillator.frequency.value = bassParams.frequency;
      if (filter) filter.Q.value = bassParams.filterQ;
      if (lfo) lfo.frequency.value = bassParams.lfoRate;
    }
  }, [bassParams]);
  
  // Update gain based on motion level
  useEffect(() => {
    if (audioContextRef.current && audioNodesRef.current.gain) {
      const targetGain = Math.min(analysisData.motionLevel * 20, 0.7);
      audioNodesRef.current.gain.gain.setTargetAtTime(
        targetGain, 
        audioContextRef.current.currentTime, 
        0.1
      );
    }
  }, [analysisData.motionLevel]);
  
  // Start webcam capture
  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
        requestAnimationFrame(processFrame);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };
  
  // Stop webcam capture
  const stopCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };
  
  // Toggle audio
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };
  
  // Process video frame for analysis
  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const processCanvas = processCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    
    if (video && canvas && processCanvas && outputCanvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      // Get contexts
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const processCtx = processCanvas.getContext('2d', { willReadFrequently: true });
      const outputCtx = outputCanvas.getContext('2d');
      
      // Set canvas sizes
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      processCanvas.width = video.videoWidth;
      processCanvas.height = video.videoHeight;
      outputCanvas.width = video.videoWidth;
      outputCanvas.height = video.videoHeight;
      
      // Draw current frame to hidden canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get current frame data
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Perform edge detection
      processCtx.drawImage(video, 0, 0, processCanvas.width, processCanvas.height);
      const frameForEdges = processCtx.getImageData(0, 0, processCanvas.width, processCanvas.height);
      
      // Convert to grayscale for edge detection
      const grayscaleData = new Uint8ClampedArray(frameForEdges.data.length);
      for (let i = 0; i < frameForEdges.data.length; i += 4) {
        const r = frameForEdges.data[i];
        const g = frameForEdges.data[i + 1];
        const b = frameForEdges.data[i + 2];
        
        // Convert RGB to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        grayscaleData[i] = gray;
        grayscaleData[i + 1] = gray;
        grayscaleData[i + 2] = gray;
        grayscaleData[i + 3] = 255;
      }
      
      // Create a new ImageData object with the grayscale data
      const grayscaleImageData = new ImageData(grayscaleData, frameForEdges.width, frameForEdges.height);
      processCtx.putImageData(grayscaleImageData, 0, 0);
      
      // Simple edge detection (using a basic Sobel-like approach)
      const edgeData = new Uint8ClampedArray(frameForEdges.data.length);
      let edgeSum = 0;
      
      // Simplified edge detection by looking at neighboring pixels
      for (let y = 1; y < frameForEdges.height - 1; y++) {
        for (let x = 1; x < frameForEdges.width - 1; x++) {
          const pixelIndex = (y * frameForEdges.width + x) * 4;
          
          // Get surrounding pixels in grayscale
          const topLeft = grayscaleData[((y - 1) * frameForEdges.width + (x - 1)) * 4];
          const top = grayscaleData[((y - 1) * frameForEdges.width + x) * 4];
          const topRight = grayscaleData[((y - 1) * frameForEdges.width + (x + 1)) * 4];
          const left = grayscaleData[(y * frameForEdges.width + (x - 1)) * 4];
          const right = grayscaleData[(y * frameForEdges.width + (x + 1)) * 4];
          const bottomLeft = grayscaleData[((y + 1) * frameForEdges.width + (x - 1)) * 4];
          const bottom = grayscaleData[((y + 1) * frameForEdges.width + x) * 4];
          const bottomRight = grayscaleData[((y + 1) * frameForEdges.width + (x + 1)) * 4];
          
          // Horizontal edge detection (simplified Sobel)
          const edgeH = 
            -topLeft - 2 * top - topRight + 
            bottomLeft + 2 * bottom + bottomRight;
          
          // Vertical edge detection (simplified Sobel)
          const edgeV = 
            -topLeft - 2 * left - bottomLeft +
            topRight + 2 * right + bottomRight;
          
          // Calculate edge magnitude
          const edgeMagnitude = Math.sqrt(edgeH * edgeH + edgeV * edgeV);
          
          // Apply threshold
          const threshold = 50;
          const edgeValue = edgeMagnitude > threshold ? 255 : 0;
          
          // Set edge pixel (blue for visualization)
          edgeData[pixelIndex] = 0;
          edgeData[pixelIndex + 1] = 0;
          edgeData[pixelIndex + 2] = edgeValue;
          edgeData[pixelIndex + 3] = 255;
          
          edgeSum += edgeValue;
        }
      }
      
      // Calculate edge intensity (normalized)
      const pixelCount = frameForEdges.width * frameForEdges.height;
      const edgeIntensity = edgeSum / (255 * pixelCount);
      
      // Calculate motion level if previous frame exists
      let motionLevel = 0;
      const motionData = new Uint8ClampedArray(currentFrame.data.length);
      
      if (prevFrameRef.current) {
        const prevFrame = prevFrameRef.current;
        let motionSum = 0;
        
        // Simple motion detection by pixel differences
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          // Calculate pixel differences
          const rdiff = Math.abs(currentFrame.data[i] - prevFrame.data[i]);
          const gdiff = Math.abs(currentFrame.data[i + 1] - prevFrame.data[i + 1]);
          const bdiff = Math.abs(currentFrame.data[i + 2] - prevFrame.data[i + 2]);
          
          // Average difference
          const diff = (rdiff + gdiff + bdiff) / 3;
          
          // Apply threshold to reduce noise
          const threshold = 15;
          const motionValue = diff > threshold ? 255 : 0;
          
          // Store motion data for visualization (green for motion)
          motionData[i] = 0;
          motionData[i + 1] = motionValue;
          motionData[i + 2] = 0;
          motionData[i + 3] = motionValue > 0 ? 150 : 0;
          
          motionSum += motionValue;
        }
        
        // Calculate motion level (normalized)
        motionLevel = motionSum / (255 * pixelCount);
      }
      
      // Store current frame for next comparison
      prevFrameRef.current = currentFrame;
      
      // Calculate dominant hue (for future chord mapping)
      let totalHue = 0;
      let colorPixels = 0;
      
      for (let i = 0; i < currentFrame.data.length; i += 4) {
        const r = currentFrame.data[i];
        const g = currentFrame.data[i + 1];
        const b = currentFrame.data[i + 2];
        
        // Convert RGB to HSV
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        if (delta > 0) {
          let hue;
          
          if (max === r) {
            hue = ((g - b) / delta) % 6;
          } else if (max === g) {
            hue = (b - r) / delta + 2;
          } else {
            hue = (r - g) / delta + 4;
          }
          
          hue *= 60;
          if (hue < 0) hue += 360;
          
          totalHue += hue;
          colorPixels++;
        }
      }
      
      // Calculate average hue
      const dominantHue = colorPixels > 0 ? (totalHue / colorPixels) / 360 : 0;
      
      // Update analysis data
      setAnalysisData({
        motionLevel,
        edgeIntensity,
        dominantHue
      });
      
      // Draw video to output canvas
      outputCtx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
      
      // Overlay visualizations
      
      // Motion overlay (green)
      const motionImageData = new ImageData(motionData, currentFrame.width, currentFrame.height);
      outputCtx.putImageData(motionImageData, 0, 0);
      
      // Edge overlay (blue)
      const edgeImageData = new ImageData(edgeData, frameForEdges.width, frameForEdges.height);
      outputCtx.globalCompositeOperation = 'lighter';
      outputCtx.putImageData(edgeImageData, 0, 0);
      outputCtx.globalCompositeOperation = 'source-over';
      
      // Add metrics display
      outputCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      outputCtx.fillRect(10, 10, 200, 80);
      
      outputCtx.font = '12px Arial';
      outputCtx.fillStyle = 'white';
      outputCtx.fillText(`Motion: ${(motionLevel * 100).toFixed(2)}%`, 20, 30);
      outputCtx.fillText(`Edge Intensity: ${(edgeIntensity * 100).toFixed(2)}%`, 20, 50);
      outputCtx.fillText(`Dominant Hue: ${(dominantHue * 360).toFixed(0)}°`, 20, 70);
      
      // Draw beat visualization
      if (audioEnabled) {
        const beatVisSize = 30;
        const margin = 10;
        const kickBeatX = outputCanvas.width - margin - beatVisSize;
        const hihatBeatX = outputCanvas.width - margin - beatVisSize;
        
        // Calculate beat indicators
        if (audioContextRef.current) {
          const currentTime = audioContextRef.current.currentTime;
          const secondsPerBeat = 60 / rhythmParams.bpm;
          
          // Kick visualization (red circle)
          const kickTimeToNext = audioNodesRef.current.nextKickTime - currentTime;
          const kickProgress = 1 - (kickTimeToNext / secondsPerBeat);
          
          outputCtx.fillStyle = 'rgba(255, 50, 50, 0.8)';
          outputCtx.beginPath();
          outputCtx.arc(kickBeatX, margin + beatVisSize, beatVisSize * 0.8, 0, Math.PI * 2 * kickProgress);
          outputCtx.fill();
          
          // Hi-hat visualization (yellow circle)
          const hihatTimeToNext = audioNodesRef.current.nextHihatTime - currentTime;
          const hihatProgress = 1 - (hihatTimeToNext / (secondsPerBeat / 2));
          
          outputCtx.fillStyle = 'rgba(255, 255, 50, 0.8)';
          outputCtx.beginPath();
          outputCtx.arc(hihatBeatX, margin + beatVisSize * 3, beatVisSize * 0.6, 0, Math.PI * 2 * hihatProgress);
          outputCtx.fill();
        }
      }
    }
    
    // Continue processing frames
    animationRef.current = requestAnimationFrame(processFrame);
  };
  
  // Handle bass frequency change
  const handleBassFreqChange = (e) => {
    setBassParams({
      ...bassParams,
      frequency: Number(e.target.value)
    });
  };
  
  // Handle LFO rate change
  const handleLfoRateChange = (e) => {
    setBassParams({
      ...bassParams,
      lfoRate: Number(e.target.value)
    });
  };
  
  // Handle filter Q change
  const handleFilterQChange = (e) => {
    setBassParams({
      ...bassParams,
      filterQ: Number(e.target.value)
    });
  };
  
  // Handle BPM change
  const handleBpmChange = (e) => {
    setRhythmParams({
      ...rhythmParams,
      bpm: Number(e.target.value)
    });
  };
  
  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Video to House Music Generator</h1>
      
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        <button 
          onClick={isCapturing ? stopCapture : startCapture}
          className={`px-4 py-2 rounded-lg font-bold ${isCapturing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isCapturing ? 'Stop Camera' : 'Start Camera'}
        </button>
        
        <button 
          onClick={toggleAudio}
          className={`px-4 py-2 rounded-lg font-bold ${audioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          disabled={!isCapturing}
        >
          {audioEnabled ? 'Audio On' : 'Audio Off'}
        </button>
      </div>
      
      <div className="relative mb-6 border-2 border-cyan-800 rounded-lg overflow-hidden bg-black shadow-lg shadow-cyan-900/50">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          className="hidden"
        />
        <canvas 
          ref={canvasRef} 
          className="hidden"
        />
        <canvas 
          ref={processCanvasRef} 
          className="hidden"
        />
        <canvas 
          ref={outputCanvasRef} 
          className="w-full max-h-96 object-contain"
        />
      </div>
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border-2 border-cyan-800 rounded-lg bg-gray-800">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">Wobble Bass Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2">
                Bass Frequency: {bassParams.frequency} Hz
              </label>
              <input
                type="range"
                min="40"
                max="120"
                value={bassParams.frequency}
                onChange={handleBassFreqChange}
                className="w-full"
                disabled={!audioEnabled}
              />
              <div className="text-xs text-gray-400 mt-1">
                Controls the fundamental pitch of the bass sound
              </div>
            </div>
            
            <div>
              <label className="block mb-2">
                LFO Rate (Wobble Speed): {bassParams.lfoRate} Hz
              </label>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={bassParams.lfoRate}
                onChange={handleLfoRateChange}
                className="w-full"
                disabled={!audioEnabled}
              />
              <div className="text-xs text-gray-400 mt-1">
                Controls how fast the "wub wub" effect oscillates
              </div>
            </div>
            
            <div>
              <label className="block mb-2">
                Filter Resonance (Q): {bassParams.filterQ}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={bassParams.filterQ}
                onChange={handleFilterQChange}
                className="w-full"
                disabled={!audioEnabled}
              />
              <div className="text-xs text-gray-400 mt-1">
                Controls the sharpness/intensity of the filter effect
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-2 border-cyan-800 rounded-lg bg-gray-800">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">Rhythm Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2">
                Tempo: {rhythmParams.bpm} BPM
              </label>
              <input
                type="range"
                min="110"
                max="140"
                step="1"
                value={rhythmParams.bpm}
                onChange={handleBpmChange}
                className="w-full"
                disabled={!audioEnabled}
              />
              <div className="text-xs text-gray-400 mt-1">
                Controls the speed of the house beat
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Automatic Mappings:</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Motion → Wobble Bass Volume</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Edge Detection → Percussion Intensity</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span>Dominant Color → Future: Chord Progression</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 border-2 border-cyan-800 rounded-lg bg-gray-800 w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-2 text-cyan-400">How It Works</h2>
        <p className="text-sm">
          This application captures video from your webcam and analyzes it for motion and edges.
          The motion controls the wobble bass volume (shown in green overlay), while edge detection
          influences the percussion intensity (shown in blue overlay). Move in front of the camera
          to generate dynamic house music with characteristic wobble bass sounds. Adjust the controls
          to customize the music generated from your movements.
        </p>
      </div>
    </div>
  );
};

export default VideoToMusicApp;
