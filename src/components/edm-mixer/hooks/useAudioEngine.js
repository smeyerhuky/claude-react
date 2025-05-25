import { useRef, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';

// Custom hook for managing the audio engine and Tone.js context
export const useAudioEngine = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const masterGainRef = useRef(null);
  const analyzerRef = useRef(null);
  const metersRef = useRef({});
  
  // Initialize Tone.js audio context (lazy initialization on user interaction)
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return true;
    
    try {
      // Check if audio context is already created but suspended
      if (Tone.context.state === 'suspended') {
        await Tone.start();
      }
      
      // Create master gain node
      if (!masterGainRef.current) {
        masterGainRef.current = new Tone.Gain(0.8).toDestination();
      }
      
      // Create analyzer for visualization
      if (!analyzerRef.current) {
        analyzerRef.current = new Tone.Analyser('waveform', 512);
        masterGainRef.current.connect(analyzerRef.current);
      }
      
      // Setup transport
      Tone.Transport.bpm.value = 128;
      Tone.Transport.loop = false;
      
      setIsInitialized(true);
      console.log('Tone.js initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Tone.js:', error);
      return false;
    }
  }, [isInitialized]);
  
  // Play/pause functionality
  const togglePlayback = useCallback(() => {
    if (!isInitialized) return;
    
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, [isInitialized]);
  
  // Stop playback
  const stopPlayback = useCallback(() => {
    if (!isInitialized) return;
    
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, [isInitialized]);
  
  // Set BPM
  const setBPM = useCallback((bpm) => {
    if (!isInitialized || !bpm || bpm < 60 || bpm > 200) return;
    Tone.Transport.bpm.value = bpm;
  }, [isInitialized]);
  
  // Get frequency data for visualization
  const getFrequencyData = useCallback(() => {
    if (!analyzerRef.current) return new Float32Array(512);
    return analyzerRef.current.getValue();
  }, []);
  
  // Create meter for a track
  const createMeter = useCallback((trackId) => {
    if (metersRef.current[trackId]) return metersRef.current[trackId];
    
    const meter = new Tone.Meter({
      normalRange: true,
      smoothing: 0.8
    });
    
    metersRef.current[trackId] = meter;
    return meter;
  }, []);
  
  // Get meter value
  const getMeterValue = useCallback((trackId) => {
    const meter = metersRef.current[trackId];
    if (!meter) return 0;
    return meter.getValue();
  }, []);
  
  // Update current time
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Tone.Transport.seconds);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        // Dispose of all meters
        Object.values(metersRef.current).forEach(meter => meter.dispose());
        
        if (masterGainRef.current) masterGainRef.current.dispose();
        if (analyzerRef.current) analyzerRef.current.dispose();
      }
    };
  }, [isInitialized]);
  
  return {
    isInitialized,
    isPlaying,
    currentTime,
    setIsPlaying,
    initializeAudio,
    togglePlayback,
    stopPlayback,
    setBPM,
    getFrequencyData,
    createMeter,
    getMeterValue,
    masterGain: masterGainRef.current,
    transport: Tone.Transport
  };
};