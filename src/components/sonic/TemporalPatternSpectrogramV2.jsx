import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Play, Square, Download, Settings, Camera, Video, 
  Upload, Maximize2, Minimize2,
  Music, Waves, Box, Grid3x3, Zap, Activity, Sparkles
} from 'lucide-react';

const TemporalPatternSpectrogramV2 = () => {
  // Core state
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Visualization state
  const [visualMode, setVisualMode] = useState('patternField3d');
  const [colorScheme, setColorScheme] = useState('cyberpunk');
  
  // Alternative Timeline: Pattern Recognition settings (NO FFT!)
  const defaultSettings = useMemo(() => ({
    // Universal pattern analysis settings
    sensitivity: 1.2,
    patternWindowSize: 4096, // Raw sample window for pattern detection
    temporalSmoothing: 0.75,
    
    // Pattern field 3D mode optimized settings
    patternField3d: {
      fieldCount: 4,
      recognitionStyle: 'rhythmic', // rhythmic, harmonic, melodic, energetic
      fieldInteraction: true,
      particleCount: 1500,
      trailLength: 0.85
    },
    
    // Temporal resonance optimized settings  
    temporalResonance: {
      stringCount: 6,
      stringTension: 0.8,
      stringDamping: 0.9,
      stringThickness: 4,
      stringSegments: 30,
      stringLayout: 'horizontal',
      bassPosition: 'bottom',
      enableParticles: true,
      particleCount: 25,
      trailLength: 0.92
    },
    
    // Pattern correlation optimized settings
    patternCorrelation: {
      correlationBins: 128,
      minCorrelation: 0.1,
      maxCorrelation: 1.0,
      trailLength: 0.95,
      sensitivity: 1.0
    },
    
    // Standard pattern field optimized settings
    patternSpectrum: {
      trailLength: 0.88,
      sensitivity: 1.3
    },
    
    // Waveform optimized settings
    waveform: {
      trailLength: 0.8,
      sensitivity: 1.5
    },
    
    // Particle field optimized settings
    particleField: {
      particleDensity: 8,
      particleSize: 4,
      movementIntensity: 3,
      colorSaturation: 70,
      trailLength: 0.9
    }
  }), []);

  const [settings, setSettings] = useState({
    // Universal settings
    sensitivity: defaultSettings.sensitivity,
    patternWindowSize: defaultSettings.patternWindowSize,
    temporalSmoothing: defaultSettings.temporalSmoothing,
    correlationBins: defaultSettings.patternCorrelation.correlationBins,
    minCorrelation: defaultSettings.patternCorrelation.minCorrelation,
    maxCorrelation: defaultSettings.patternCorrelation.maxCorrelation,
    trailLength: defaultSettings.patternField3d.trailLength,
    
    // Pattern field settings
    fieldCount: defaultSettings.patternField3d.fieldCount,
    recognitionStyle: defaultSettings.patternField3d.recognitionStyle,
    fieldInteraction: defaultSettings.patternField3d.fieldInteraction,
    
    // String settings
    stringCount: defaultSettings.temporalResonance.stringCount,
    stringTension: defaultSettings.temporalResonance.stringTension,
    stringDamping: defaultSettings.temporalResonance.stringDamping,
    stringThickness: defaultSettings.temporalResonance.stringThickness,
    stringSegments: defaultSettings.temporalResonance.stringSegments,
    stringLayout: defaultSettings.temporalResonance.stringLayout,
    bassPosition: defaultSettings.temporalResonance.bassPosition,
    enableParticles: defaultSettings.temporalResonance.enableParticles,
    particleCount: defaultSettings.patternField3d.particleCount,
    
    // Particle field settings
    particleDensity: defaultSettings.particleField.particleDensity,
    particleSize: defaultSettings.particleField.particleSize,
    movementIntensity: defaultSettings.particleField.movementIntensity,
    colorSaturation: defaultSettings.particleField.colorSaturation,
    
    // Legacy compatibility
    bloomStrength: 1.5,
    windowFunction: 'temporal-correlation'
  });
  
  // Audio analysis state - NO frequency analysis!
  const [rhythmLevel, setRhythmLevel] = useState(0);
  const [harmonicLevel, setHarmonicLevel] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [patternDetected, setPatternDetected] = useState(false);
  const [bpm] = useState(0);
  
  // Recording state
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoChunks, setVideoChunks] = useState([]);
  
  // Refs
  const containerRef = useRef(null);
  const canvas2DRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const animationRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const patternFieldsRef = useRef([]);
  const particlesRef = useRef(null);
  const patternHistoryRef = useRef([]);
  const beatHistoryRef = useRef([]);
  const settingsRef = useRef(settings);
  const colorSchemeRef = useRef(colorScheme);
  const visualModeRef = useRef(visualMode);
  
  // Alternative Timeline: Raw sample buffer for pattern analysis
  const rawSampleBufferRef = useRef(new Float32Array(8192));
  const patternCacheRef = useRef({
    rhythmicPatterns: [],
    harmonicRatios: [],
    energyFlow: [],
    temporalCorrelations: []
  });

  // Update refs when state changes
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  
  useEffect(() => {
    colorSchemeRef.current = colorScheme;
  }, [colorScheme]);
  
  useEffect(() => {
    visualModeRef.current = visualMode;
  }, [visualMode]);

  // Color schemes
  const colorSchemes = useMemo(() => ({
    cyberpunk: {
      rhythm: [255, 0, 128],
      harmonic: [0, 255, 255],
      energy: [255, 255, 0],
      background: '#0a0a0a',
      accent: '#ff0080'
    },
    temporal: {
      rhythm: [255, 102, 0],
      harmonic: [0, 204, 102],
      energy: [102, 0, 204],
      background: '#0a0014',
      accent: '#ff6600'
    },
    nature: {
      rhythm: [34, 139, 34],
      harmonic: [70, 130, 180],
      energy: [255, 215, 0],
      background: '#0d1117',
      accent: '#228b22'
    },
    aurora: {
      rhythm: [0, 255, 127],
      harmonic: [64, 224, 208],
      energy: [173, 216, 230],
      background: '#001122',
      accent: '#00ff7f'
    }
  }), []);

  // Alternative Timeline: Temporal Pattern Recognition Engine
  // This replaces FFT with pattern detection in the time domain
  
  // 1. Autocorrelation-based rhythm detection
  const detectRhythmicPatterns = useCallback((audioSamples) => {
    const windowSize = Math.min(audioSamples.length, 2048);
    const correlations = [];
    
    // Calculate autocorrelation at different lag times
    for (let lag = 1; lag < windowSize / 4; lag++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < windowSize - lag; i++) {
        correlation += audioSamples[i] * audioSamples[i + lag];
        count++;
      }
      
      correlations.push({
        lag: lag,
        correlation: correlation / count,
        bpm: 60 * 44100 / lag, // Estimate BPM from lag
        strength: Math.abs(correlation / count)
      });
    }
    
    // Find peaks in autocorrelation (repeating patterns)
    let maxCorrelation = 0;
    let dominantPattern = null;
    
    correlations.forEach((corr, index) => {
      if (corr.strength > maxCorrelation && corr.bpm > 60 && corr.bpm < 200) {
        maxCorrelation = corr.strength;
        dominantPattern = corr;
      }
    });
    
    return {
      patterns: correlations.slice(0, 32), // Top 32 correlations
      dominantPattern: dominantPattern,
      rhythmicStrength: maxCorrelation,
      averageStrength: correlations.reduce((sum, c) => sum + c.strength, 0) / correlations.length
    };
  }, []);

  // 2. Harmonic ratio analysis (NOT frequency domain!)
  const analyzeHarmonicRatios = useCallback((audioSamples) => {
    const ratios = [];
    const windowSize = Math.min(audioSamples.length, 1024);
    
    // Look for mathematical ratios in peak patterns
    const peaks = [];
    for (let i = 1; i < windowSize - 1; i++) {
      if (audioSamples[i] > audioSamples[i-1] && audioSamples[i] > audioSamples[i+1] && Math.abs(audioSamples[i]) > 0.1) {
        peaks.push({ position: i, amplitude: Math.abs(audioSamples[i]) });
      }
    }
    
    // Calculate ratios between peak positions
    for (let i = 0; i < peaks.length - 1; i++) {
      for (let j = i + 1; j < Math.min(peaks.length, i + 5); j++) {
        const ratio = peaks[j].position / peaks[i].position;
        const harmonicScore = Math.abs(ratio - Math.round(ratio));
        
        // Look for simple integer ratios (harmonic relationships)
        if (harmonicScore < 0.1) {
          ratios.push({
            ratio: ratio,
            harmonicScore: 1 - harmonicScore,
            strength: (peaks[i].amplitude + peaks[j].amplitude) / 2,
            type: ratio < 1.5 ? 'unison' : ratio < 2.5 ? 'octave' : ratio < 3.5 ? 'fifth' : 'complex'
          });
        }
      }
    }
    
    // Calculate overall harmonic content
    const totalHarmonicStrength = ratios.reduce((sum, r) => sum + r.strength * r.harmonicScore, 0);
    const averageHarmonic = ratios.length > 0 ? totalHarmonicStrength / ratios.length : 0;
    
    return {
      ratios: ratios.slice(0, 16),
      harmonicStrength: averageHarmonic,
      peakCount: peaks.length,
      dominantRatio: ratios.reduce((max, r) => r.strength > max.strength ? r : max, { strength: 0 })
    };
  }, []);

  // 3. Energy flow momentum analysis
  const analyzeEnergyFlow = useCallback((audioSamples) => {
    const flowData = [];
    const windowSize = Math.min(audioSamples.length, 512);
    const segmentSize = Math.floor(windowSize / 8);
    
    // Divide into 8 segments and track energy flow between them
    for (let segment = 0; segment < 8; segment++) {
      const startIdx = segment * segmentSize;
      const endIdx = Math.min(startIdx + segmentSize, windowSize);
      
      let segmentEnergy = 0;
      let segmentMomentum = 0;
      
      for (let i = startIdx; i < endIdx; i++) {
        const sample = audioSamples[i];
        segmentEnergy += sample * sample; // Energy
        
        // Calculate momentum (rate of change)
        if (i > startIdx) {
          segmentMomentum += Math.abs(audioSamples[i] - audioSamples[i-1]);
        }
      }
      
      flowData.push({
        segment: segment,
        energy: Math.sqrt(segmentEnergy / segmentSize),
        momentum: segmentMomentum / segmentSize,
        flow: segment > 0 ? flowData[segment-1].energy - Math.sqrt(segmentEnergy / segmentSize) : 0
      });
    }
    
    // Calculate overall energy characteristics
    const totalEnergy = flowData.reduce((sum, f) => sum + f.energy, 0);
    const totalMomentum = flowData.reduce((sum, f) => sum + f.momentum, 0);
    const energyVariance = flowData.reduce((sum, f) => sum + Math.pow(f.energy - totalEnergy/8, 2), 0) / 8;
    
    return {
      segments: flowData,
      totalEnergy: totalEnergy / 8,
      averageMomentum: totalMomentum / 8,
      energyVariance: Math.sqrt(energyVariance),
      flowDirection: flowData.reduce((sum, f) => sum + f.flow, 0)
    };
  }, []);

  // 4. Zero-crossing rate and temporal texture analysis
  const analyzeTemporalTexture = useCallback((audioSamples) => {
    const windowSize = Math.min(audioSamples.length, 1024);
    let zeroCrossings = 0;
    let totalAbsValue = 0;
    let peakDensity = 0;
    let sustainedRegions = 0;
    
    let currentSign = audioSamples[0] >= 0 ? 1 : -1;
    let sustainedCount = 0;
    
    for (let i = 1; i < windowSize; i++) {
      const sample = audioSamples[i];
      const sign = sample >= 0 ? 1 : -1;
      
      // Zero crossing detection
      if (sign !== currentSign) {
        zeroCrossings++;
        currentSign = sign;
      }
      
      totalAbsValue += Math.abs(sample);
      
      // Peak density (local maxima)
      if (i > 1 && i < windowSize - 1) {
        if (Math.abs(sample) > Math.abs(audioSamples[i-1]) && Math.abs(sample) > Math.abs(audioSamples[i+1])) {
          peakDensity++;
        }
      }
      
      // Sustained regions (consecutive samples above threshold)
      if (Math.abs(sample) > 0.1) {
        sustainedCount++;
      } else {
        if (sustainedCount > 10) {
          sustainedRegions++;
        }
        sustainedCount = 0;
      }
    }
    
    return {
      zeroCrossingRate: zeroCrossings / windowSize,
      averageAbsValue: totalAbsValue / windowSize,
      peakDensity: peakDensity / windowSize,
      sustainedRegions: sustainedRegions,
      textureComplexity: (zeroCrossings / windowSize) * (peakDensity / windowSize)
    };
  }, []);

  // Alternative Timeline: Comprehensive Pattern Analysis
  const analyzeTemporalPatterns = useCallback((audioSamples) => {
    const rhythmicAnalysis = detectRhythmicPatterns(audioSamples);
    const harmonicAnalysis = analyzeHarmonicRatios(audioSamples);
    const energyAnalysis = analyzeEnergyFlow(audioSamples);
    const textureAnalysis = analyzeTemporalTexture(audioSamples);
    
    // Combine all analyses into comprehensive pattern data
    return {
      rhythmic: rhythmicAnalysis,
      harmonic: harmonicAnalysis,
      energy: energyAnalysis,
      texture: textureAnalysis,
      
      // Overall pattern scores
      patternComplexity: (rhythmicAnalysis.averageStrength + harmonicAnalysis.harmonicStrength + textureAnalysis.textureComplexity) / 3,
      temporalStability: 1 - energyAnalysis.energyVariance,
      musicalCoherence: (harmonicAnalysis.harmonicStrength + rhythmicAnalysis.rhythmicStrength) / 2
    };
  }, [detectRhythmicPatterns, analyzeHarmonicRatios, analyzeEnergyFlow, analyzeTemporalTexture]);

  // Pattern-based beat detection (NOT frequency-based!)
  const detectPatternBeat = useCallback((patternData) => {
    const currentBeatStrength = patternData.rhythmic.rhythmicStrength + patternData.energy.totalEnergy;
    
    beatHistoryRef.current.push(currentBeatStrength);
    if (beatHistoryRef.current.length > 30) { // Shorter history for pattern-based detection
      beatHistoryRef.current.shift();
    }
    
    if (beatHistoryRef.current.length < 5) return false;
    
    const average = beatHistoryRef.current.reduce((a, b) => a + b) / beatHistoryRef.current.length;
    const variance = beatHistoryRef.current.reduce((a, b) => a + Math.pow(b - average, 2), 0) / beatHistoryRef.current.length;
    const threshold = average + Math.sqrt(variance) * 1.5;
    
    // Also check for rhythmic pattern consistency
    const rhythmicConsistency = patternData.rhythmic.dominantPattern?.strength || 0;
    
    return currentBeatStrength > threshold && rhythmicConsistency > 0.3;
  }, []);

  // Initialize audio with raw sample analysis (NO FFT!)
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100 // Standard rate for pattern analysis
        } 
      });
      
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create ScriptProcessorNode for raw sample access (alternative to AnalyserNode)
      const bufferSize = settings.patternWindowSize;
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Store raw samples for pattern analysis
        rawSampleBufferRef.current.set(inputData);
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      // Store processor reference
      analyserRef.current = processor;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      setIsAnalyzing(true);
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access microphone. Please check permissions.');
      return false;
    }
  };

  // Main animation loop - NO FFT, pure pattern analysis!
  const animate = useCallback(() => {
    if (!rawSampleBufferRef.current) return;
    
    // Get raw audio samples (NOT frequency data!)
    const audioSamples = Array.from(rawSampleBufferRef.current);
    
    // Alternative Timeline: Analyze temporal patterns instead of frequencies
    const patternData = analyzeTemporalPatterns(audioSamples);
    
    // Extract pattern-based "levels" (NOT frequency bands!)
    const rhythmicLevel = Math.min(patternData.rhythmic.rhythmicStrength * settingsRef.current.sensitivity, 1.0);
    const harmonicLevel = Math.min(patternData.harmonic.harmonicStrength * settingsRef.current.sensitivity, 1.0);
    const energyLevel = Math.min(patternData.energy.totalEnergy * settingsRef.current.sensitivity, 1.0);
    
    setRhythmLevel(rhythmicLevel);
    setHarmonicLevel(harmonicLevel);
    setEnergyLevel(energyLevel);
    
    // Pattern-based beat detection
    const beat = detectPatternBeat(patternData);
    setPatternDetected(beat);
    
    // Store pattern history
    patternHistoryRef.current.push(patternData);
    if (patternHistoryRef.current.length > 100) {
      patternHistoryRef.current.shift();
    }
    
    // Update visualizations based on PATTERNS, not frequencies
    if (canvas2DRef.current) {
      drawPatternVisualization(patternData);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [analyzeTemporalPatterns, detectPatternBeat]);

  // Draw pattern-based visualization (NOT frequency-based!)
  const drawPatternVisualization = useCallback((patternData) => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const scale = window.devicePixelRatio || 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    
    const scaledWidth = width / scale;
    const scaledHeight = height / scale;
    
    // Clear with pattern trail effect
    ctx.fillStyle = `rgba(10, 10, 10, ${1 - settingsRef.current.trailLength})`;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    
    const colors = colorSchemes[colorSchemeRef.current];
    
    // Draw based on PATTERN ANALYSIS, not frequency analysis
    if (visualModeRef.current === 'patternSpectrum') {
      // Rhythmic patterns visualization
      const rhythmicPatterns = patternData.rhythmic.patterns || [];
      const barWidth = scaledWidth / rhythmicPatterns.length;
      
      rhythmicPatterns.forEach((pattern, i) => {
        const barHeight = (pattern.strength || 0) * scaledHeight * settingsRef.current.sensitivity;
        const x = i * barWidth;
        
        // Color based on BPM/tempo, not frequency
        const hue = ((pattern.bpm - 60) / 140) * 240; // 60-200 BPM mapped to blue-red
        ctx.fillStyle = `hsl(${Math.max(0, Math.min(240, hue))}, 70%, 60%)`;
        ctx.fillRect(x, scaledHeight - barHeight, barWidth - 1, barHeight);
      });
    } else if (visualModeRef.current === 'energyFlow') {
      // Energy flow visualization
      const segments = patternData.energy.segments || [];
      const segmentWidth = scaledWidth / segments.length;
      
      segments.forEach((segment, i) => {
        const energyHeight = segment.energy * scaledHeight * 0.5;
        const momentumHeight = segment.momentum * scaledHeight * 0.3;
        const x = i * segmentWidth;
        
        // Energy bars
        ctx.fillStyle = `rgb(${colors.energy.join(',')})`;
        ctx.fillRect(x, scaledHeight - energyHeight, segmentWidth * 0.6, energyHeight);
        
        // Momentum bars
        ctx.fillStyle = `rgb(${colors.rhythm.join(',')})`;
        ctx.fillRect(x + segmentWidth * 0.6, scaledHeight - momentumHeight, segmentWidth * 0.4, momentumHeight);
      });
    } else {
      // Default: Combined pattern visualization
      const rhythmHeight = rhythmLevel * scaledHeight * 0.3;
      const harmonicHeight = harmonicLevel * scaledHeight * 0.3;
      const energyHeight = energyLevel * scaledHeight * 0.4;
      
      // Draw pattern-based bars
      ctx.fillStyle = `rgb(${colors.rhythm.join(',')})`;
      ctx.fillRect(0, scaledHeight - rhythmHeight, scaledWidth * 0.33, rhythmHeight);
      
      ctx.fillStyle = `rgb(${colors.harmonic.join(',')})`;
      ctx.fillRect(scaledWidth * 0.33, scaledHeight - harmonicHeight, scaledWidth * 0.33, harmonicHeight);
      
      ctx.fillStyle = `rgb(${colors.energy.join(',')})`;
      ctx.fillRect(scaledWidth * 0.66, scaledHeight - energyHeight, scaledWidth * 0.34, energyHeight);
    }
    
    // Draw pattern beat indicator
    if (patternDetected) {
      ctx.fillStyle = `rgba(${colors.rhythm.join(',')}, 0.3)`;
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    }
  }, [colorSchemes]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Start/stop recording
  const startRecording = async () => {
    try {
      if (!isAnalyzing) {
        const success = await initializeAudio();
        if (!success) return;
      }
      
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setRecordedChunks([]);
      mediaRecorderRef.current?.start();
      setIsRecording(true);
      
      animate();
    } catch (err) {
      console.error('Error starting recording:', err);
      setIsRecording(false);
      setIsAnalyzing(false);
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setIsAnalyzing(false);
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  // Update canvas size
  useEffect(() => {
    if (!canvas2DRef.current) return;
    
    const updateCanvasSize = () => {
      const canvas = canvas2DRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [visualMode]);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      animationRef.current && cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" ref={containerRef}>
      {/* Main visualization container */}
      <div className="absolute top-24 bottom-40 left-4 right-4 border border-orange-800/30 rounded-lg overflow-hidden">
        <canvas
          key={`canvas-${visualMode}-${colorScheme}`}
          ref={canvas2DRef}
          className="absolute inset-0 w-full h-full"
          style={{ backgroundColor: colorSchemes[colorScheme].background }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-white text-xl font-bold mb-1">Temporal Pattern Spectrogram - Alternative Timeline</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Pattern BPM: {bpm || '--'}</span>
            <span>Mode: {visualMode}</span>
            {patternDetected && <span className="text-orange-500 animate-pulse">PATTERN</span>}
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="pointer-events-auto p-2 bg-orange-600/20 hover:bg-orange-600/40 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Settings panel */}
      <div
        className={`absolute top-0 right-0 h-full bg-orange-900/95 backdrop-blur-md transition-transform duration-300 overflow-y-auto z-50 ${
          showSettings ? 'translate-x-0' : 'translate-x-full'
        } ${isMobile ? 'w-full' : 'w-96'}`}
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Pattern Analysis Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Visualization Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pattern Visualization Mode
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { id: 'patternField3d', icon: Box, label: 'Pattern Field' },
                { id: 'temporalResonance', icon: Activity, label: 'Temporal Resonance' },
                { id: 'patternSpectrum', icon: Grid3x3, label: 'Pattern Spectrum' },
                { id: 'energyFlow', icon: Waves, label: 'Energy Flow' },
                { id: 'waveform', icon: Music, label: 'Waveform' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setVisualMode(id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                    visualMode === id
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color Scheme
            </label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2"
            >
              {Object.keys(colorSchemes).map(scheme => (
                <option key={scheme} value={scheme}>
                  {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Core Pattern Analysis Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pattern Analysis (NO FFT!)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Sensitivity</span>
                  <span>{settings.sensitivity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) => setSettings({ ...settings, sensitivity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Temporal Smoothing</span>
                  <span>{settings.temporalSmoothing.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.99"
                  step="0.01"
                  value={settings.temporalSmoothing}
                  onChange={(e) => setSettings({ ...settings, temporalSmoothing: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Pattern Window Size</span>
                <span>{settings.patternWindowSize}</span>
              </label>
              <select
                value={settings.patternWindowSize}
                onChange={(e) => setSettings({ ...settings, patternWindowSize: parseInt(e.target.value) })}
                className="w-full bg-gray-800 text-white rounded px-2 py-1"
              >
                {[1024, 2048, 4096, 8192].map(size => (
                  <option key={size} value={size}>{size} samples</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-orange-300 mb-2">Alternative Timeline Technology</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Autocorrelation-based rhythm detection</li>
              <li>• Harmonic ratio analysis (time domain)</li>
              <li>• Energy flow momentum tracking</li>
              <li>• Zero-crossing rate analysis</li>
              <li>• Temporal texture recognition</li>
              <li>• NO frequency domain analysis!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pattern level indicators */}
      <div className="absolute bottom-24 left-4 right-4 flex gap-2 pointer-events-none">
        <div className="flex-1 bg-orange-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">RHYTHM</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-600 to-red-600 transition-all duration-100"
              style={{ width: `${Math.min(100, rhythmLevel * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-orange-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">HARMONIC</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-teal-600 transition-all duration-100"
              style={{ width: `${Math.min(100, harmonicLevel * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-orange-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">ENERGY</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all duration-100"
              style={{ width: `${Math.min(100, energyLevel * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-orange-900/90 backdrop-blur-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span className={isMobile ? 'hidden' : ''}>Start Pattern Analysis</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors"
              >
                <Square className="w-5 h-5" />
                <span className={isMobile ? 'hidden' : ''}>Stop</span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Take pattern snapshot"
            >
              <Camera className="w-5 h-5" />
            </button>

            {recordedChunks.length > 0 && (
              <button
                onClick={() => {
                  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pattern-analysis-${Date.now()}.webm`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Download pattern recording"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions overlay */}
      {!isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">
              Temporal Pattern Visualizer
            </h2>
            <p className="text-gray-300 mb-2">
              Experience your music through temporal pattern recognition in an alternative timeline where frequency analysis was never discovered.
            </p>
            <p className="text-orange-300 text-sm mb-6">
              Using autocorrelation, harmonic ratios, and energy flow analysis - NO FFT!
            </p>
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg px-6 py-3 font-semibold transition-all transform hover:scale-105"
            >
              Begin Pattern Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporalPatternSpectrogramV2;