import React, { useState, useEffect, useRef } from 'react';

// Main application component
const VideoToMusicApp = () => {
  // State for application status
  const [isCapturing, setIsCapturing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // State for visual analysis metrics
  const [visualMetrics, setVisualMetrics] = useState({
    motionLevel: 0,
    edgeIntensity: 0,
    colorValues: {
      hue: 0,
      saturation: 0,
      brightness: 0
    },
    sceneChange: false
  });
  
  // State for audio parameters
  const [audioParams, setAudioParams] = useState({
    // Wobble bass parameters
    bassFrequency: 60,
    lfoRate: 4,
    filterQ: 10,
    
    // Rhythm parameters
    bpm: 128,
    kickVolume: 0.7,
    hihatVolume: 0.5,
    
    // Atmospheric parameters
    padVolume: 0.3,
    reverbMix: 0.4
  });
  
  // References for DOM elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const motionCanvasRef = useRef(null);
  const edgeCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const animationRef = useRef(null);
  
  // References for audio context and nodes
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef({
    // Wobble bass nodes
    oscillator: null,
    filter: null,
    lfo: null,
    lfoGain: null,
    bassGain: null,
    
    // Rhythm nodes
    nextKickTime: 0,
    nextHihatTime: 0,
    kickSchedulerId: null,
    hihatSchedulerId: null,
    
    // Atmospheric nodes
    pad: null,
    padGain: null,
    reverb: null,
    
    // Master gain
    masterGain: null
  });
  
  // Effect to initialize audio system when enabled
  useEffect(() => {
    // Only initialize when audio is enabled and context doesn't exist
    if (audioEnabled && !audioContextRef.current) {
      initAudioSystem();
    }
    
    // Cleanup function to stop audio when component unmounts or audio is disabled
    return () => {
      if (audioContextRef.current) {
        cleanupAudioSystem();
      }
    };
  }, [audioEnabled]);
  
  // Effect to update audio parameters when they change
  useEffect(() => {
    if (audioContextRef.current) {
      updateAudioParameters();
    }
  }, [audioParams]);
  
  // Effect to update audio based on visual metrics
  useEffect(() => {
    if (audioContextRef.current) {
      mapVisualMetricsToAudio();
    }
  }, [visualMetrics]);
  
  // Initialize the audio system with all required nodes
  const initAudioSystem = () => {
    // Create audio context (with fallback for different browsers)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;
    
    // Create master gain node for volume control
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
    
    // ===== WOBBLE BASS SYSTEM =====
    
    // Create oscillator for bass sound
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sawtooth';  // Sawtooth gives rich harmonic content for bass
    oscillator.frequency.value = audioParams.bassFrequency;
    
    // Create filter for the wobble effect (low-pass filter with modulation)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;  // Starting frequency
    filter.Q.value = audioParams.filterQ;  // Resonance amount
    
    // Create LFO (Low Frequency Oscillator) to modulate the filter cutoff
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = audioParams.lfoRate;  // How fast the wobble happens
    
    // LFO gain to control modulation depth
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 500;  // How wide the filter sweeps
    
    // Bass output gain
    const bassGain = audioCtx.createGain();
    bassGain.gain.value = 0;  // Start silent
    
    // Connect wobble bass components
    oscillator.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(masterGain);
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    // Start oscillators
    oscillator.start();
    lfo.start();
    
    // ===== RHYTHM SYSTEM =====
    
    // Set initial rhythm times
    const currentTime = audioCtx.currentTime;
    const secondsPerBeat = 60 / audioParams.bpm;
    
    // We start scheduling the first beat immediately
    const nextKickTime = currentTime;
    const nextHihatTime = currentTime + secondsPerBeat / 2;  // Offbeat hi-hats
    
    // Begin the rhythm schedulers
    const kickSchedulerId = scheduleKick(nextKickTime);
    const hihatSchedulerId = scheduleHihat(nextHihatTime);
    
    // ===== ATMOSPHERIC SYSTEM =====
    
    // Create pad synthesizer with chord capabilities
    const padGain = audioCtx.createGain();
    padGain.gain.value = audioParams.padVolume;
    
    // Create simple reverb effect
    const reverb = audioCtx.createConvolver();
    // Create impulse response for reverb (simplified version)
    const impulseLength = audioCtx.sampleRate * 2.5; // 2.5 seconds reverb
    const impulse = audioCtx.createBuffer(2, impulseLength, audioCtx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        // Exponential decay for reverb tail
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impulseLength / 6));
      }
    }
    
    reverb.buffer = impulse;
    
    // Connect pad to reverb
    padGain.connect(reverb);
    reverb.connect(masterGain);
    
    // Start a simple pad sound (will be changed by color analysis)
    const pad = startPadSound(audioCtx, padGain);
    
    // Store all audio nodes for later reference
    audioNodesRef.current = {
      oscillator,
      filter,
      lfo,
      lfoGain,
      bassGain,
      nextKickTime,
      nextHihatTime,
      kickSchedulerId,
      hihatSchedulerId,
      pad,
      padGain,
      reverb,
      masterGain
    };
    
    // Function to schedule kick drum sounds
    function scheduleKick(kickTime) {
      // Create and schedule kick drum sound
      const kick = createKickDrum(audioCtx, kickTime, audioParams.kickVolume, masterGain);
      
      // Calculate next kick time (4-on-the-floor pattern)
      const nextTime = kickTime + (60 / audioParams.bpm);
      audioNodesRef.current.nextKickTime = nextTime;
      
      // Schedule next kick slightly before it's needed (10ms buffer)
      const lookAhead = 10; // ms
      const schedulerTime = (nextTime - audioCtx.currentTime) * 1000 - lookAhead;
      
      // Ensure we don't schedule in the past
      const delay = Math.max(10, schedulerTime);
      
      // Return the timeout ID so we can cancel it later if needed
      return setTimeout(() => scheduleKick(nextTime), delay);
    }
    
    // Function to schedule hi-hat sounds
    function scheduleHihat(hihatTime) {
      // Create and schedule hi-hat sound
      const hihat = createHihat(audioCtx, hihatTime, audioParams.hihatVolume, masterGain);
      
      // Calculate next hi-hat time (offbeat, twice per beat)
      const nextTime = hihatTime + (60 / audioParams.bpm) / 2;
      audioNodesRef.current.nextHihatTime = nextTime;
      
      // Schedule next hi-hat slightly before it's needed (10ms buffer)
      const lookAhead = 10; // ms
      const schedulerTime = (nextTime - audioCtx.currentTime) * 1000 - lookAhead;
      
      // Ensure we don't schedule in the past
      const delay = Math.max(10, schedulerTime);
      
      // Return the timeout ID so we can cancel it later if needed
      return setTimeout(() => scheduleHihat(nextTime), delay);
    }
    
    // Function to start a continuous pad sound (atmospheric background)
    function startPadSound(audioCtx, outputNode) {
      // Create three oscillators for a simple chord
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const osc3 = audioCtx.createOscillator();
      
      // Use sine waves for soft sound
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc3.type = 'sine';
      
      // Create a basic C major chord
      osc1.frequency.value = 261.63; // C4
      osc2.frequency.value = 329.63; // E4
      osc3.frequency.value = 392.00; // G4
      
      // Create individual gain nodes for each oscillator
      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();
      const gain3 = audioCtx.createGain();
      
      gain1.gain.value = 0.2;
      gain2.gain.value = 0.2;
      gain3.gain.value = 0.2;
      
      // Connect oscillators to their gain nodes
      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);
      
      // Connect gain nodes to output
      gain1.connect(outputNode);
      gain2.connect(outputNode);
      gain3.connect(outputNode);
      
      // Start oscillators
      osc1.start();
      osc2.start();
      osc3.start();
      
      // Return references for later updates
      return { osc1, osc2, osc3, gain1, gain2, gain3 };
    }
  };
  
  // Clean up audio system when done
  const cleanupAudioSystem = () => {
    const { kickSchedulerId, hihatSchedulerId, oscillator, lfo, pad } = audioNodesRef.current;
    
    // Clear rhythm schedulers
    clearTimeout(kickSchedulerId);
    clearTimeout(hihatSchedulerId);
    
    // Stop oscillators
    if (oscillator) oscillator.stop();
    if (lfo) lfo.stop();
    
    // Stop pad oscillators
    if (pad) {
      pad.osc1.stop();
      pad.osc2.stop();
      pad.osc3.stop();
    }
    
    // Close audio context
    audioContextRef.current.close();
    audioContextRef.current = null;
  };
  
  // Update audio parameters when sliders change
  const updateAudioParameters = () => {
    const nodes = audioNodesRef.current;
    const ctx = audioContextRef.current;
    
    // Update wobble bass parameters
    if (nodes.oscillator) {
      nodes.oscillator.frequency.value = audioParams.bassFrequency;
    }
    
    if (nodes.filter) {
      nodes.filter.Q.value = audioParams.filterQ;
    }
    
    if (nodes.lfo) {
      nodes.lfo.frequency.value = audioParams.lfoRate;
    }
    
    // Update pad volume
    if (nodes.padGain) {
      nodes.padGain.gain.value = audioParams.padVolume;
    }
    
    // We don't update BPM immediately as it would interrupt the current rhythm
    // It would require more complex logic to smoothly transition BPM
  };
  
  // Map visual analysis metrics to audio parameters
  const mapVisualMetricsToAudio = () => {
    if (!audioContextRef.current) return;
    
    const nodes = audioNodesRef.current;
    const ctx = audioContextRef.current;
    
    // Map motion level to wobble bass volume
    if (nodes.bassGain) {
      const targetGain = Math.min(visualMetrics.motionLevel * 0.8, 0.7);
      nodes.bassGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
    }
    
    // Map edge intensity to percussion volumes
    const kickVolumeMod = audioParams.kickVolume * (visualMetrics.edgeIntensity * 0.5 + 0.5);
    const hihatVolumeMod = audioParams.hihatVolume * (visualMetrics.edgeIntensity * 0.7 + 0.3);
    
    // Map color values to pad chord pitches
    if (nodes.pad) {
      // Use hue to determine base chord frequency (map 0-360 to 120-480 Hz)
      const baseFreq = 120 + (visualMetrics.colorValues.hue * 360);
      
      // Use brightness to determine chord type (major/minor)
      const isMajor = visualMetrics.colorValues.brightness > 0.5;
      const thirdInterval = isMajor ? 5/4 : 6/5; // Major third (5/4) or minor third (6/5)
      
      // Use saturation to determine chord inversion/voicing
      const voicing = Math.floor(visualMetrics.colorValues.saturation * 3);
      
      // Set chord frequencies with smooth transitions
      const transitionTime = 0.3; // seconds
      
      nodes.pad.osc1.frequency.setTargetAtTime(baseFreq, ctx.currentTime, transitionTime);
      nodes.pad.osc2.frequency.setTargetAtTime(baseFreq * thirdInterval, ctx.currentTime, transitionTime);
      nodes.pad.osc3.frequency.setTargetAtTime(baseFreq * 3/2, ctx.currentTime, transitionTime); // Perfect fifth
      
      // Adjust volumes based on saturation
      nodes.pad.gain1.gain.setTargetAtTime(0.2 * (1 - visualMetrics.colorValues.saturation * 0.5), ctx.currentTime, transitionTime);
      nodes.pad.gain2.gain.setTargetAtTime(0.2 * (visualMetrics.colorValues.saturation * 0.8 + 0.2), ctx.currentTime, transitionTime);
      nodes.pad.gain3.gain.setTargetAtTime(0.2 * (visualMetrics.colorValues.brightness * 0.8 + 0.2), ctx.currentTime, transitionTime);
    }
    
    // Handle scene changes with special audio effects
    if (visualMetrics.sceneChange) {
      // Add a filter sweep effect when scene changes detected
      const sweepFilter = ctx.createBiquadFilter();
      sweepFilter.type = 'lowpass';
      
      // Insert filter temporarily
      nodes.masterGain.disconnect();
      nodes.masterGain.connect(sweepFilter);
      sweepFilter.connect(ctx.destination);
      
      // Create filter sweep effect
      sweepFilter.frequency.setValueAtTime(100, ctx.currentTime);
      sweepFilter.frequency.exponentialRampToValueAtTime(15000, ctx.currentTime + 0.5);
      
      // Remove filter after sweep completes
      setTimeout(() => {
        nodes.masterGain.disconnect();
        nodes.masterGain.connect(ctx.destination);
      }, 500);
    }
  };
  
  // Create a kick drum sound
  const createKickDrum = (audioCtx, time, volume, outputNode) => {
    // Create oscillator for kick sound
    const kickOsc = audioCtx.createOscillator();
    kickOsc.frequency.value = 150;
    
    // Create gain node for volume envelope
    const kickGain = audioCtx.createGain();
    kickGain.gain.value = 0;
    
    // Connect nodes
    kickOsc.connect(kickGain);
    kickGain.connect(outputNode);
    
    // Set frequency envelope (pitch drop for kick drum)
    kickOsc.frequency.setValueAtTime(150, time);
    kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    // Set volume envelope (quick attack, medium decay)
    kickGain.gain.setValueAtTime(0, time);
    kickGain.gain.linearRampToValueAtTime(volume, time + 0.01);
    kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    // Schedule playback
    kickOsc.start(time);
    kickOsc.stop(time + 0.3);
    
    return { kickOsc, kickGain };
  };
  
  // Create a hi-hat sound
  const createHihat = (audioCtx, time, volume, outputNode) => {
    // Create noise source for hi-hat (using oscillators)
    const hihatOsc1 = audioCtx.createOscillator();
    const hihatOsc2 = audioCtx.createOscillator();
    const hihatOsc3 = audioCtx.createOscillator();
    
    // Use high frequencies and detuning for metallic sound
    hihatOsc1.type = 'square';
    hihatOsc2.type = 'square';
    hihatOsc3.type = 'square';
    
    hihatOsc1.frequency.value = 802;
    hihatOsc2.frequency.value = 1201;
    hihatOsc3.frequency.value = 1599;
    
    // Create filter for hi-hat tone
    const hihatFilter = audioCtx.createBiquadFilter();
    hihatFilter.type = 'highpass';
    hihatFilter.frequency.value = 7000;
    
    // Create gain node for volume envelope
    const hihatGain = audioCtx.createGain();
    hihatGain.gain.value = 0;
    
    // Connect nodes
    hihatOsc1.connect(hihatFilter);
    hihatOsc2.connect(hihatFilter);
    hihatOsc3.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    hihatGain.connect(outputNode);
    
    // Set volume envelope (very quick attack, short decay)
    hihatGain.gain.setValueAtTime(0, time);
    hihatGain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.005);
    hihatGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    // Schedule playback
    hihatOsc1.start(time);
    hihatOsc2.start(time);
    hihatOsc3.start(time);
    
    hihatOsc1.stop(time + 0.05);
    hihatOsc2.stop(time + 0.05);
    hihatOsc3.stop(time + 0.05);
    
    return { hihatOsc1, hihatOsc2, hihatOsc3, hihatFilter, hihatGain };
  };
  
  // Start webcam capture
  const startCapture = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
        
        // Begin processing video frames
        requestAnimationFrame(processVideoFrame);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access webcam. Please check permissions and try again.");
    }
  };
  
  // Stop webcam capture
  const stopCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      // Stop all video tracks
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      
      // Update state and stop animation
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
  
  // Process video frames for analysis
  const processVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const motionCanvas = motionCanvasRef.current;
    const edgeCanvas = edgeCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    
    // Make sure all elements exist and video is playing
    if (video && canvas && motionCanvas && edgeCanvas && outputCanvas && 
        video.readyState === video.HAVE_ENOUGH_DATA) {
      
      // Set up canvas contexts
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });
      const edgeCtx = edgeCanvas.getContext('2d', { willReadFrequently: true });
      const outputCtx = outputCanvas.getContext('2d');
      
      // Set canvas dimensions to match video
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      canvas.width = width;
      canvas.height = height;
      motionCanvas.width = width;
      motionCanvas.height = height;
      edgeCanvas.width = width;
      edgeCanvas.height = height;
      outputCanvas.width = width;
      outputCanvas.height = height;
      
      // Draw current frame to main canvas
      ctx.drawImage(video, 0, 0, width, height);
      
      // Get current frame data
      const currentFrame = ctx.getImageData(0, 0, width, height);
      const currentFrameData = currentFrame.data;
      
      // ===== MOTION DETECTION =====
      
      // Initialize motion metrics
      let motionLevel = 0;
      const motionData = new Uint8ClampedArray(currentFrameData.length);
      
      // Compare with previous frame if available
      if (prevFrameRef.current) {
        const prevFrameData = prevFrameRef.current.data;
        let motionSum = 0;
        let sceneChangeSum = 0;
        
        // Process each pixel for motion detection
        for (let i = 0; i < currentFrameData.length; i += 4) {
          // Calculate RGB differences between frames
          const rDiff = Math.abs(currentFrameData[i] - prevFrameData[i]);
          const gDiff = Math.abs(currentFrameData[i+1] - prevFrameData[i+1]);
          const bDiff = Math.abs(currentFrameData[i+2] - prevFrameData[i+2]);
          
          // Average difference for this pixel
          const avgDiff = (rDiff + gDiff + bDiff) / 3;
          
          // Apply threshold to reduce noise
          const threshold = 15;
          const motionValue = avgDiff > threshold ? 255 : 0;
          
          // Store motion data (green visualization)
          motionData[i] = 0;          // R
          motionData[i+1] = motionValue; // G
          motionData[i+2] = 0;          // B
          motionData[i+3] = motionValue > 0 ? 150 : 0; // Alpha
          
          // Accumulate motion metrics
          motionSum += motionValue;
          sceneChangeSum += avgDiff;
        }
        
        // Calculate normalized motion level (0-1)
        const pixelCount = currentFrameData.length / 4;
        motionLevel = motionSum / (255 * pixelCount);
        
        // Detect scene changes (large differences across the entire frame)
        const avgSceneChange = sceneChangeSum / pixelCount;
        const sceneChangeThreshold = 30;
        const sceneChange = avgSceneChange > sceneChangeThreshold;
        
        // Create motion visualization
        const motionImageData = new ImageData(motionData, width, height);
        motionCtx.putImageData(motionImageData, 0, 0);
      }
      
      // Store current frame for next comparison
      prevFrameRef.current = currentFrame;
      
      // ===== EDGE DETECTION =====
      
      // Draw frame to edge canvas for processing
      edgeCtx.drawImage(video, 0, 0, width, height);
      const edgeFrame = edgeCtx.getImageData(0, 0, width, height);
      const edgeData = new Uint8ClampedArray(edgeFrame.data.length);
      
      // Convert to grayscale for edge detection
      const grayscaleData = new Uint8ClampedArray(edgeFrame.data.length);
      for (let i = 0; i < edgeFrame.data.length; i += 4) {
        const r = edgeFrame.data[i];
        const g = edgeFrame.data[i+1];
        const b = edgeFrame.data[i+2];
        
        // Standard grayscale conversion
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        for (let j = 0; j < 3; j++) {
          grayscaleData[i+j] = gray;
        }
        grayscaleData[i+3] = 255;
      }
      
      // Apply Sobel operator for edge detection
      let edgeSum = 0;
      const sobelThreshold = 50;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const pixelIndex = (y * width + x) * 4;
          
          // Get 3x3 grid of pixels around current pixel
          const topLeft = grayscaleData[((y-1) * width + (x-1)) * 4];
          const top = grayscaleData[((y-1) * width + x) * 4];
          const topRight = grayscaleData[((y-1) * width + (x+1)) * 4];
          const left = grayscaleData[(y * width + (x-1)) * 4];
          const right = grayscaleData[(y * width + (x+1)) * 4];
          const bottomLeft = grayscaleData[((y+1) * width + (x-1)) * 4];
          const bottom = grayscaleData[((y+1) * width + x) * 4];
          const bottomRight = grayscaleData[((y+1) * width + (x+1)) * 4];
          
          // Sobel kernels for horizontal and vertical edges
          const horizEdge = 
            -topLeft - 2*top - topRight + 
            bottomLeft + 2*bottom + bottomRight;
            
          const vertEdge = 
            -topLeft - 2*left - bottomLeft +
            topRight + 2*right + bottomRight;
          
          // Edge magnitude
          const edgeMagnitude = Math.sqrt(horizEdge*horizEdge + vertEdge*vertEdge);
          
          // Apply threshold
          const edgeValue = edgeMagnitude > sobelThreshold ? 255 : 0;
          
          // Set edge pixel (blue for visualization)
          edgeData[pixelIndex] = 0;       // R
          edgeData[pixelIndex+1] = 0;     // G
          edgeData[pixelIndex+2] = edgeValue; // B
          edgeData[pixelIndex+3] = 255;     // Alpha
          
          edgeSum += edgeValue;
        }
      }
      
      // Calculate edge intensity (normalized)
      const pixelCount = width * height;
      const edgeIntensity = edgeSum / (255 * pixelCount);
      
      // Create edge detection visualization
      const edgeImageData = new ImageData(edgeData, width, height);
      edgeCtx.putImageData(edgeImageData, 0, 0);
      
      // ===== COLOR ANALYSIS =====
      
      // Extract dominant colors
      let totalHue = 0;
      let totalSaturation = 0;
      let totalBrightness = 0;
      let colorPixels = 0;
      
      // Sample every 10th pixel for performance
      for (let i = 0; i < currentFrameData.length; i += 40) {
        const r = currentFrameData[i];
        const g = currentFrameData[i+1];
        const b = currentFrameData[i+2];
        
        // Convert RGB to HSV
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        // Calculate brightness (value) - normalized to 0-1
        const brightness = max / 255;
        
        // Calculate saturation - normalized to 0-1
        const saturation = max === 0 ? 0 : delta / max;
        
        // Calculate hue - normalized to 0-1
        let hue = 0;
        if (delta > 0) {
          if (max === r) {
            hue = ((g - b) / delta) % 6;
          } else if (max === g) {
            hue = (b - r) / delta + 2;
          } else {
            hue = (r - g) / delta + 4;
          }
          
          hue *= 60;
          if (hue < 0) hue += 360;
          
          hue /= 360; // Normalize to 0-1
        }
        
        totalHue += hue;
        totalSaturation += saturation;
        totalBrightness += brightness;
        colorPixels++;
      }
      
      // Calculate average HSV values
      const avgHue = colorPixels > 0 ? totalHue / colorPixels : 0;
      const avgSaturation = colorPixels > 0 ? totalSaturation / colorPixels : 0;
      const avgBrightness = colorPixels > 0 ? totalBrightness / colorPixels : 0;
      
      // Update visual metrics
      setVisualMetrics({
        motionLevel,
        edgeIntensity,
        colorValues: {
          hue: avgHue,
          saturation: avgSaturation,
          brightness: avgBrightness
        },
        sceneChange: prevFrameRef.current ? avgSceneChange > sceneChangeThreshold : false
      });
      
      // ===== CREATE OUTPUT VISUALIZATION =====
      
      // Draw original video
      outputCtx.drawImage(video, 0, 0, width, height);
      
      // Add motion overlay in green (semi-transparent)
      outputCtx.globalCompositeOperation = 'lighter';
      outputCtx.drawImage(motionCanvas, 0, 0, width, height);
      
      // Add edge overlay in blue (semi-transparent)
      outputCtx.drawImage(edgeCanvas, 0, 0, width, height);
      
      // Reset composite operation
      outputCtx.globalCompositeOperation = 'source-over';
      
      // Add metrics display
      outputCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      outputCtx.fillRect(10, 10, 200, 110);
      
      outputCtx.font = '14px Arial';
      outputCtx.fillStyle = 'white';
      outputCtx.fillText(`Motion: ${(motionLevel * 100).toFixed(1)}%`, 20, 30);
      outputCtx.fillText(`Edges: ${(edgeIntensity * 100).toFixed(1)}%`, 20, 50);
      outputCtx.fillText(`Hue: ${Math.round(avgHue * 360)}°`, 20, 70);
      outputCtx.fillText(`Saturation: ${(avgSaturation * 100).toFixed(1)}%`, 20, 90);
      outputCtx.fillText(`Brightness: ${(avgBrightness * 100).toFixed(1)}%`, 20, 110);
      
      // Add color indicator circle
      const colorSize = 30;
      const colorX = width - colorSize - 20;
      const colorY = 30;
      
      // Convert HSV to RGB for display
      const displayColor = hsvToRgb(avgHue, avgSaturation, avgBrightness);
      
      outputCtx.fillStyle = `rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})`;
      outputCtx.beginPath();
      outputCtx.arc(colorX, colorY, colorSize, 0, Math.PI * 2);
      outputCtx.fill();
      
      // Add mapping visualization
      if (audioEnabled) {
        // Bass intensity indicator
        const bassIntensity = audioNodesRef.current.bassGain ? 
          audioNodesRef.current.bassGain.gain.value : 0;
        
        outputCtx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        outputCtx.fillRect(width - 120, 70, 100 * bassIntensity, 10);
        
        outputCtx.strokeStyle = 'white';
        outputCtx.strokeRect(width - 120, 70, 100, 10);
        outputCtx.fillStyle = 'white';
        outputCtx.fillText('Bass', width - 120, 65);
        
        // Beat indicators
        if (audioContextRef.current) {
          const currentTime = audioContextRef.current.currentTime;
          const kickTimeToNext = audioNodesRef.current.nextKickTime - currentTime;
          const hihatTimeToNext = audioNodesRef.current.nextHihatTime - currentTime;
          
          const secondsPerBeat = 60 / audioParams.bpm;
          const kickProgress = 1 - (kickTimeToNext / secondsPerBeat);
          const hihatProgress = 1 - (hihatTimeToNext / (secondsPerBeat / 2));
          
          // Kick drum indicator
          outputCtx.fillStyle = 'rgba(255, 100, 100, 0.8)';
          outputCtx.beginPath();
          outputCtx.arc(width - 70, 110, 15, 0, Math.PI * 2 * kickProgress);
          outputCtx.fill();
          outputCtx.strokeStyle = 'white';
          outputCtx.beginPath();
          outputCtx.arc(width - 70, 110, 15, 0, Math.PI * 2);
          outputCtx.stroke();
          outputCtx.fillStyle = 'white';
          outputCtx.fillText('Kick', width - 90, 115);
          
          // Hi-hat indicator
          outputCtx.fillStyle = 'rgba(255, 255, 100, 0.8)';
          outputCtx.beginPath();
          outputCtx.arc(width - 30, 110, 10, 0, Math.PI * 2 * hihatProgress);
          outputCtx.fill();
          outputCtx.strokeStyle = 'white';
          outputCtx.beginPath();
          outputCtx.arc(width - 30, 110, 10, 0, Math.PI * 2);
          outputCtx.stroke();
          outputCtx.fillStyle = 'white';
          outputCtx.fillText('Hat', width - 40, 135);
        }
      }
    }
    
    // Continue processing frames
    animationRef.current = requestAnimationFrame(processVideoFrame);
  };
  
  // Convert HSV to RGB (helper function)
  const hsvToRgb = (h, s, v) => {
    let r, g, b;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };
  
  // Handle bass frequency change
  const handleBassFreqChange = (e) => {
    setAudioParams(prev => ({
      ...prev,
      bassFrequency: Number(e.target.value)
    }));
  };
  
  // Handle LFO rate change
  const handleLfoRateChange = (e) => {
    setAudioParams(prev => ({
      ...prev,
      lfoRate: Number(e.target.value)
    }));
  };
  
  // Handle filter Q change
  const handleFilterQChange = (e) => {
    setAudioParams(prev => ({
      ...prev,
      filterQ: Number(e.target.value)
    }));
  };
  
  // Handle BPM change
  const handleBpmChange = (e) => {
    setAudioParams(prev => ({
      ...prev,
      bpm: Number(e.target.value)
    }));
  };
  
  // Handle pad volume change
  const handlePadVolumeChange = (e) => {
    setAudioParams(prev => ({
      ...prev,
      padVolume: Number(e.target.value)
    }));
  };
  
  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };
  
  // Toggle advanced controls
  const toggleAdvancedControls = () => {
    setShowAdvanced(!showAdvanced);
  };
  
  // Render function for explanation content
  const renderExplanationContent = () => {
    switch (activeSection) {
      case 'introduction':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">How Video Becomes House Music</h3>
            <p>
              This system transforms visual elements from video into house music with characteristic 
              wobble bass sounds. It analyzes three key aspects of the video:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-bold text-green-400">Motion</span> - Detected by comparing frames, 
                controls wobble bass volume and intensity
              </li>
              <li>
                <span className="font-bold text-blue-400">Edges</span> - Detected using Sobel filters, 
                controls rhythm patterns and percussion
              </li>
              <li>
                <span className="font-bold text-yellow-400">Color</span> - Analyzed for hue, saturation and brightness, 
                influences harmonic elements and pad sounds
              </li>
            </ul>
            <p>
              The system runs in real-time, analyzing each frame from your webcam and instantly 
              converting the visual information into musical parameters.
            </p>
          </div>
        );
      
      case 'motion':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Motion Analysis & Wobble Bass</h3>
            <p>
              Motion is detected by comparing pixel values between consecutive video frames. Areas with 
              significant changes appear as green in the visualization.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold">Technical Process:</h4>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Capture current video frame</li>
                  <li>Compare pixel RGB values with previous frame</li>
                  <li>Calculate difference magnitude for each pixel</li>
                  <li>Apply threshold to reduce noise</li>
                  <li>Calculate overall motion level</li>
                </ol>
              </div>
              <div>
                <h4 className="font-bold">Motion to Audio Mapping:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Overall motion → Bass volume</li>
                  <li>Motion intensity → Filter modulation depth</li>
                  <li>Sudden large motion → Trigger special effects</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-md mt-2">
              <h4 className="font-bold">Wobble Bass Generation:</h4>
              <p className="text-sm">
                The wobble bass uses a sawtooth oscillator fed through a low-pass filter. A low-frequency 
                oscillator (LFO) modulates the filter's cutoff frequency, creating the characteristic "wub wub" sound. 
                The LFO rate controls how fast the wobble happens, while the filter's resonance (Q) controls its intensity.
              </p>
            </div>
          </div>
        );
      
      case 'edge':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Edge Detection & Rhythm Generation</h3>
            <p>
              Edge detection identifies boundaries between objects in the video. These edges appear as blue 
              in the visualization and drive the rhythm patterns.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold">Technical Process:</h4>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Convert frame to grayscale</li>
                  <li>Apply Sobel operator for gradient detection</li>
                  <li>Calculate edge magnitude at each pixel</li>
                  <li>Apply threshold to identify strong edges</li>
                  <li>Calculate overall edge intensity</li>
                </ol>
              </div>
              <div>
                <h4 className="font-bold">Edge to Audio Mapping:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Edge intensity → Percussion volume</li>
                  <li>Horizontal edges → Kick drum emphasis</li>
                  <li>Vertical edges → Hi-hat emphasis</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-md mt-2">
              <h4 className="font-bold">Rhythm Generation:</h4>
              <p className="text-sm">
                The rhythm system generates a classic 4/4 house beat with kick drums on the beat and hi-hats 
                on the offbeats. Edge detection influences percussion intensity and pattern variations. 
                The BPM (beats per minute) controls the overall tempo of the rhythm.
              </p>
            </div>
          </div>
        );
      
      case 'color':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Color Analysis & Harmonic Elements</h3>
            <p>
              Color analysis extracts hue, saturation, and brightness values from the video. These 
              parameters influence the harmonic elements of the music.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold">Technical Process:</h4>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Sample pixels from current frame</li>
                  <li>Convert RGB to HSV color space</li>
                  <li>Calculate average hue, saturation, brightness</li>
                  <li>Track color changes over time</li>
                </ol>
              </div>
              <div>
                <h4 className="font-bold">Color to Audio Mapping:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Hue → Chord base frequency</li>
                  <li>Saturation → Chord voicing/complexity</li>
                  <li>Brightness → Chord type (major/minor)</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-md mt-2">
              <h4 className="font-bold">Harmonic Generation:</h4>
              <p className="text-sm">
                The harmonic system generates atmospheric pad sounds using three oscillators to create 
                chords. Hue values are mapped to base frequencies, brightness determines whether chords 
                are major or minor, and saturation influences chord voicings and complexity.
              </p>
            </div>
          </div>
        );
      
      case 'tech':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Technical Implementation</h3>
            <p>
              This system is built using modern web technologies and demonstrates real-time audio-visual 
              interaction principles.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold">Video Processing:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>getUserMedia API for webcam access</li>
                  <li>Canvas API for frame analysis</li>
                  <li>requestAnimationFrame for smooth rendering</li>
                  <li>ImageData manipulation for pixel-level analysis</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold">Audio Synthesis:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Web Audio API for real-time synthesis</li>
                  <li>OscillatorNode for sound generation</li>
                  <li>BiquadFilterNode for filtering</li>
                  <li>GainNode for amplitude control</li>
                  <li>Precise timing scheduling for rhythms</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-md mt-2">
              <h4 className="font-bold">System Architecture:</h4>
              <p className="text-sm">
                The system follows a processing pipeline architecture: video input → feature extraction → 
                parameter mapping → sound synthesis. Each frame goes through motion detection, edge analysis, 
                and color extraction. These visual features are then mapped to corresponding audio parameters 
                which control the synthesizers in real-time.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            Video to House Music Converter
          </h1>
          <p className="text-lg text-gray-300">
            Transform visual elements into dynamic house music with wobble bass
          </p>
        </header>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Video display */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="mb-4 flex flex-wrap gap-3 justify-center">
                <button 
                  onClick={isCapturing ? stopCapture : startCapture}
                  className={`px-4 py-2 rounded-md font-bold ${
                    isCapturing 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isCapturing ? 'Stop Camera' : 'Start Camera'}
                </button>
                
                <button 
                  onClick={toggleAudio}
                  className={`px-4 py-2 rounded-md font-bold ${
                    audioEnabled 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  disabled={!isCapturing}
                >
                  {audioEnabled ? 'Audio On' : 'Audio Off'}
                </button>
              </div>
              
              <div className="relative rounded-lg overflow-hidden bg-black border border-gray-700">
                {/* Hidden video and canvas elements */}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="hidden"
                />
                <canvas ref={canvasRef} className="hidden" />
                <canvas ref={motionCanvasRef} className="hidden" />
                <canvas ref={edgeCanvasRef} className="hidden" />
                
                {/* Visible output canvas */}
                <canvas 
                  ref={outputCanvasRef} 
                  className="w-full h-auto max-h-96 mx-auto"
                />
                
                {/* Overlay for when no video is active */}
                {!isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="text-center p-4">
                      <div className="text-cyan-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Camera Not Active</h3>
                      <p className="text-gray-400">Click "Start Camera" to begin video analysis and music generation</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wobble Bass Controls */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-400">Wobble Bass Controls</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label>Bass Frequency</label>
                        <span>{audioParams.bassFrequency} Hz</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="120"
                        value={audioParams.bassFrequency}
                        onChange={handleBassFreqChange}
                        className="w-full"
                        disabled={!audioEnabled}
                      />
                      <p className="text-xs text-gray-400 mt-1">Controls the fundamental bass pitch</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label>LFO Rate (Wobble Speed)</label>
                        <span>{audioParams.lfoRate} Hz</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="15"
                        step="0.5"
                        value={audioParams.lfoRate}
                        onChange={handleLfoRateChange}
                        className="w-full"
                        disabled={!audioEnabled}
                      />
                      <p className="text-xs text-gray-400 mt-1">Controls "wub wub" speed</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label>Filter Resonance</label>
                        <span>{audioParams.filterQ}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={audioParams.filterQ}
                        onChange={handleFilterQChange}
                        className="w-full"
                        disabled={!audioEnabled}
                      />
                      <p className="text-xs text-gray-400 mt-1">Controls filter intensity</p>
                    </div>
                  </div>
                </div>
                
                {/* Rhythm Controls */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-400">Rhythm & Atmosphere Controls</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label>Tempo</label>
                        <span>{audioParams.bpm} BPM</span>
                      </div>
                      <input
                        type="range"
                        min="110"
                        max="150"
                        step="1"
                        value={audioParams.bpm}
                        onChange={handleBpmChange}
                        className="w-full"
                        disabled={!audioEnabled}
                      />
                      <p className="text-xs text-gray-400 mt-1">Controls beat speed</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label>Pad Volume</label>
                        <span>{audioParams.padVolume.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.1"
                        value={audioParams.padVolume}
                        onChange={handlePadVolumeChange}
                        className="w-full"
                        disabled={!audioEnabled}
                      />
                      <p className="text-xs text-gray-400 mt-1">Atmospheric pad volume</p>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="font-semibold text-sm">Visual-Audio Mappings:</h4>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                        <li className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                          <span>Motion → Bass</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                          <span>Edges → Drums</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                          <span>Hue → Chord</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
                          <span>Bright → Major</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Educational content */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-2xl font-bold mb-4 text-cyan-400">How It Works</h2>
              
              {/* Section navigation */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button 
                  onClick={() => handleSectionChange('introduction')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    activeSection === 'introduction' 
                      ? 'bg-cyan-700 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => handleSectionChange('motion')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    activeSection === 'motion' 
                      ? 'bg-green-700 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Motion → Bass
                </button>
                <button 
                  onClick={() => handleSectionChange('edge')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    activeSection === 'edge' 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Edges → Rhythm
                </button>
                <button 
                  onClick={() => handleSectionChange('color')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    activeSection === 'color' 
                      ? 'bg-yellow-700 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Color → Harmony
                </button>
                <button 
                  onClick={() => handleSectionChange('tech')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    activeSection === 'tech' 
                      ? 'bg-purple-700 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Technical Details
                </button>
              </div>
              
              {/* Section content */}
              <div className="bg-gray-700 rounded-lg p-4">
                {renderExplanationContent()}
              </div>
              
              {/* Tips and instructions */}
              <div className="mt-6 bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">Tips for Best Results</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">•</span>
                    <span>Move around to generate wobble bass intensity - more movement equals louder bass</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">•</span>
                    <span>Try different colored backgrounds to change harmonic elements</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">•</span>
                    <span>Show objects with strong edges to intensify percussion sounds</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">•</span>
                    <span>Quick scene changes trigger special transition effects</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Built with React, Web Audio API, and Canvas</p>
        </footer>
      </div>
    </div>
  );
};

export default VideoToMusicApp;
