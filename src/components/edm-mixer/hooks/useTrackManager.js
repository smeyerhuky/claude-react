import { useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';

// Generate UUID using crypto API (browser built-in)
const generateId = () => {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Track types
export const TRACK_TYPES = {
  MAJOR: 'major',
  FILLER: 'filler',
  SAMPLE: 'sample',
  EFFECT: 'effect'
};

// Transition types
export const TRANSITION_TYPES = {
  CROSSFADE: 'crossfade',
  CUT: 'cut',
  ECHO: 'echo',
  FILTER: 'filter',
  REVERSE: 'reverse'
};

// Custom hook for managing tracks and chain
export const useTrackManager = (masterGain, logger = null, setIsPlaying = null) => {
  const [tracks, setTracks] = useState(new Map());
  const [chain, setChain] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [loading, setLoading] = useState(false);
  const playersRef = useRef({});
  const buffersRef = useRef({});
  
  // Analyze audio file and detect properties
  const analyzeAudioFile = useCallback(async (file) => {
    logger?.info(`Starting audio analysis for: ${file.name}`, 'ANALYZER', {
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    try {
      logger?.debug('Converting file to ArrayBuffer...', 'ANALYZER');
      const arrayBuffer = await file.arrayBuffer();
      logger?.success(`ArrayBuffer created: ${arrayBuffer.byteLength} bytes`, 'ANALYZER');
      
      logger?.debug('Getting Tone.js audio context...', 'ANALYZER');
      const audioContext = Tone.context;
      logger?.info(`Audio context state: ${audioContext.state}`, 'ANALYZER', {
        sampleRate: audioContext.sampleRate,
        currentTime: audioContext.currentTime
      });
      
      logger?.debug('Decoding audio data...', 'ANALYZER');
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      logger?.success(`Audio decoded successfully`, 'ANALYZER', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      });
      
      // Simple beat detection (simplified for demo)
      logger?.debug('Detecting tempo...', 'ANALYZER');
      const tempo = detectTempo();
      logger?.info(`Tempo detected: ${tempo} BPM`, 'ANALYZER');
      
      logger?.debug('Detecting key...', 'ANALYZER');
      const key = detectKey();
      logger?.info(`Key detected: ${key}`, 'ANALYZER');
      
      const duration = audioBuffer.duration;
      logger?.info(`Track duration: ${duration.toFixed(2)}s`, 'ANALYZER');
      
      // Classify track type based on duration
      let type = TRACK_TYPES.MAJOR;
      if (duration < 15) type = TRACK_TYPES.SAMPLE;
      else if (duration < 60) type = TRACK_TYPES.EFFECT;
      else if (duration < 90) type = TRACK_TYPES.FILLER;
      
      logger?.success(`Track classified as: ${type}`, 'ANALYZER');
      
      const analysis = {
        tempo,
        key,
        duration,
        type,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        audioBuffer // Include the decoded AudioBuffer
      };
      
      logger?.success('Audio analysis completed successfully', 'ANALYZER', analysis);
      return analysis;
    } catch (error) {
      logger?.error(`Audio analysis failed: ${error.message}`, 'ANALYZER', {
        name: error.name,
        stack: error.stack,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw error;
    }
  }, [logger]);
  
  // Simple tempo detection (placeholder - would use more sophisticated algorithm)
  const detectTempo = () => {
    // Simplified tempo detection
    return Math.floor(Math.random() * 40) + 110; // Random between 110-150 BPM
  };
  
  // Simple key detection (placeholder)
  const detectKey = () => {
    const keys = ['C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 
                  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor'];
    return keys[Math.floor(Math.random() * keys.length)];
  };
  
  // Load audio file as track
  const loadTrack = useCallback(async (file) => {
    logger?.info(`Loading track: ${file.name}`, 'LOADER');
    setLoading(true);
    
    try {
      logger?.debug('Starting audio analysis...', 'LOADER');
      const analysis = await analyzeAudioFile(file);
      
      logger?.debug('Generating track ID...', 'LOADER');
      const trackId = generateId();
      logger?.info(`Generated track ID: ${trackId}`, 'LOADER');
      
      // Create Tone.js buffer from decoded AudioBuffer
      logger?.debug('Creating Tone.js buffer from decoded AudioBuffer...', 'LOADER');
      const buffer = new Tone.ToneAudioBuffer();
      buffer.set(analysis.audioBuffer);
      logger?.success(`Tone.js buffer created successfully`, 'LOADER', {
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels
      });
      
      buffersRef.current[trackId] = buffer;
      logger?.info('Buffer stored in ref cache', 'LOADER');
      
      // Create track object
      const track = {
        id: trackId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        file,
        audioBuffer: analysis.audioBuffer,
        ...analysis
      };
      
      logger?.debug('Adding track to state...', 'LOADER');
      setTracks(prev => {
        const newTracks = new Map(prev);
        newTracks.set(trackId, track);
        logger?.success(`Track added to library. Total tracks: ${newTracks.size}`, 'LOADER');
        return newTracks;
      });
      
      logger?.success(`Track "${track.name}" loaded successfully!`, 'LOADER', track);
      return track;
    } catch (error) {
      logger?.error(`Failed to load track: ${error.message}`, 'LOADER', {
        name: error.name,
        stack: error.stack,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw error;
    } finally {
      logger?.debug('Setting loading state to false', 'LOADER');
      setLoading(false);
    }
  }, [analyzeAudioFile, logger]);
  
  // Calculate total chain duration
  const calculateChainDuration = useCallback(() => {
    return chain.reduce((total, track) => total + track.duration, 0);
  }, [chain]);

  // Add track to chain
  const addToChain = useCallback((trackId) => {
    const track = tracks.get(trackId);
    if (!track) return;
    
    const chainTrack = {
      ...track,
      chainId: generateId(),
      startTime: calculateChainDuration(),
      effects: [],
      transitionType: TRANSITION_TYPES.CROSSFADE,
      volume: 1.0
    };
    
    setChain(prev => [...prev, chainTrack]);
  }, [tracks, calculateChainDuration]);
  
  // Remove track from chain
  const removeFromChain = useCallback((chainId) => {
    setChain(prev => prev.filter(track => track.chainId !== chainId));
  }, []);
  
  // Play a single track
  const playTrack = useCallback(async (trackId) => {
    if (!masterGain) return;
    
    const buffer = buffersRef.current[trackId];
    if (!buffer) return;
    
    // Stop any existing player for this track
    if (playersRef.current[trackId]) {
      playersRef.current[trackId].stop();
      playersRef.current[trackId].dispose();
    }
    
    // Create new player
    const player = new Tone.Player(buffer).connect(masterGain);
    playersRef.current[trackId] = player;
    
    // Set playing state when starting
    if (setIsPlaying) {
      setIsPlaying(true);
    }
    
    // Handle playback end
    player.onstop = () => {
      if (setIsPlaying) {
        setIsPlaying(false);
      }
    };
    
    player.start();
    
    return player;
  }, [masterGain, setIsPlaying]);
  
  // Stop a single track
  const stopTrack = useCallback((trackId) => {
    if (playersRef.current[trackId]) {
      playersRef.current[trackId].stop();
      playersRef.current[trackId].dispose();
      delete playersRef.current[trackId];
    }
    
    // Update playing state if no tracks are playing
    if (setIsPlaying && Object.keys(playersRef.current).length === 0) {
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  // Stop all playback
  const stopAllTracks = useCallback(() => {
    Object.entries(playersRef.current).forEach(([, player]) => {
      if (player) {
        player.stop();
        player.dispose();
      }
    });
    playersRef.current = {};
    
    // Update playing state
    if (setIsPlaying) {
      setIsPlaying(false);
    }
  }, [setIsPlaying]);
  
  // Update track transition
  const updateTransition = useCallback((chainId, transitionType) => {
    setChain(prev => prev.map(track => 
      track.chainId === chainId 
        ? { ...track, transitionType }
        : track
    ));
  }, []);
  
  // Calculate chain compatibility
  const calculateChainCompatibility = useCallback(() => {
    if (chain.length < 2) return 1;
    
    let totalCompatibility = 0;
    let comparisons = 0;
    
    for (let i = 0; i < chain.length - 1; i++) {
      const track1 = chain[i];
      const track2 = chain[i + 1];
      
      // BPM compatibility
      const bpmDiff = Math.abs(track1.tempo - track2.tempo);
      const bpmCompatibility = Math.max(0, 1 - bpmDiff / 20);
      
      // Key compatibility (simplified)
      const keyCompatibility = track1.key === track2.key ? 1 : 0.7;
      
      totalCompatibility += (bpmCompatibility + keyCompatibility) / 2;
      comparisons++;
    }
    
    return comparisons > 0 ? totalCompatibility / comparisons : 1;
  }, [chain]);
  
  return {
    tracks,
    chain,
    selectedTrackId,
    loading,
    loadTrack,
    addToChain,
    removeFromChain,
    updateTransition,
    calculateChainDuration,
    calculateChainCompatibility,
    playTrack,
    stopTrack,
    stopAllTracks,
    setSelectedTrackId
  };
};