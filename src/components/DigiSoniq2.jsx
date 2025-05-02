import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as Tone from 'tone';

// Utility Functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Convert RGB to Hue
const rgbToHue = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  
  if (max === min) {
    h = 0; // achromatic
  } else {
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  
  return h;
};

// Convert RGB to Saturation
const rgbToSaturation = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  if (max === 0) {
    return 0;
  }
  
  return d / max;
};

// Convert Hz to Mel scale
const hzToMel = hz => 2595 * Math.log10(1 + hz / 700);
  
// Convert Mel to Hz
const melToHz = mel => 700 * (Math.pow(10, mel / 2595) - 1);

// MelSpectrogram Component
const MelSpectrogramCanvas = ({ audioSource, width = 400, height = 200, colorMap = 'viridis' }) => {
  const canvasRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [melFilterBank, setMelFilterBank] = useState(null);
  const animationRef = useRef(null);
  const lastDrawTime = useRef(0);
  
  // Color mapping function
  const getColor = (value) => {
    // Normalize value between 0-1
    const v = Math.max(0, Math.min(1, value));
    
    switch(colorMap) {
      case 'viridis':
        return `rgb(${Math.floor(68 + 200 * v)}, ${Math.floor(1 + 200 * v)}, ${Math.floor(84 + (1-v) * 100)})`;
      case 'inferno':
        return `rgb(${Math.floor(20 + 230 * v)}, ${Math.floor(10 + 100 * v * v)}, ${Math.floor(90 * (1-v))})`;
      case 'magma':
        return `rgb(${Math.floor(10 + 200 * v)}, ${Math.floor(0 + 140 * v * v)}, ${Math.floor(100 * (1-v) + 100 * v)})`;
      case 'plasma':
        return `rgb(${Math.floor(20 + 200 * v)}, ${Math.floor(20 + 100 * Math.pow(v, 0.5))}, ${Math.floor(200 * (1-v))})`;
      default:
        return `rgb(${Math.floor(255 * v)}, ${Math.floor(255 * v)}, ${Math.floor(255 * v)})`;
    }
  };

  // Create mel filter bank
  const createMelFilterBank = (fftSize, sampleRate, melBands, minFreq, maxFreq) => {
    const lowMel = hzToMel(minFreq);
    const highMel = hzToMel(maxFreq);
    const melPoints = Array.from({length: melBands + 2}, (_, i) => 
      lowMel + (i * (highMel - lowMel) / (melBands + 1)));
    const hzPoints = melPoints.map(melToHz);
    const bins = hzPoints.map(hz => Math.floor((fftSize + 1) * hz / sampleRate));
    
    const filterBank = [];
    for (let i = 0; i < melBands; i++) {
      const filter = new Float32Array(fftSize / 2).fill(0);
      
      for (let j = bins[i]; j < bins[i + 1]; j++) {
        filter[j] = (j - bins[i]) / (bins[i + 1] - bins[i]);
      }
      for (let j = bins[i + 1]; j < bins[i + 2]; j++) {
        filter[j] = (bins[i + 2] - j) / (bins[i + 2] - bins[i + 1]);
      }
      
      filterBank.push(filter);
    }
    
    return filterBank;
  };

  // Apply mel filter bank to FFT data
  const applyMelFilterBank = (fftData, filterBank) => {
    const melSpectrum = new Float32Array(filterBank.length);
    
    for (let i = 0; i < filterBank.length; i++) {
      let sum = 0;
      for (let j = 0; j < fftData.length; j++) {
        // Convert dB to magnitude
        const magnitude = Math.pow(10, fftData[j] / 20);
        sum += magnitude * filterBank[i][j];
      }
      
      // Apply log to match human perception
      melSpectrum[i] = sum > 0 ? Math.log10(sum) : 0;
    }
    
    return melSpectrum;
  };

  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioSource) return;
    
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyzerNode = ctx.createAnalyser();
    analyzerNode.fftSize = 2048; // Must be power of 2
    analyzerNode.smoothingTimeConstant = 0.85;
    analyzerNode.minDecibels = -100;
    analyzerNode.maxDecibels = -30;
    
    setAudioContext(ctx);
    setAnalyser(analyzerNode);
    
    // Create mel filter bank
    const filters = createMelFilterBank(analyzerNode.fftSize, ctx.sampleRate, 64, 20, ctx.sampleRate / 2);
    setMelFilterBank(filters);
    
    // Connect audio source to analyzer
    let sourceNode;
    if (audioSource instanceof HTMLMediaElement) {
      sourceNode = ctx.createMediaElementSource(audioSource);
    } else if (audioSource instanceof MediaStream) {
      sourceNode = ctx.createMediaStreamSource(audioSource);
    } else if (audioSource.connect) {
      // Assume it's an AudioNode
      sourceNode = audioSource;
    }
    
    if (sourceNode) {
      sourceNode.connect(analyzerNode);
      // Only connect to destination if it's a media element
      if (audioSource instanceof HTMLMediaElement) {
        analyzerNode.connect(ctx.destination);
      }
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    };
  }, [audioSource]);

  // Draw function
  const draw = () => {
    if (!analyser || !melFilterBank || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    // Get frequency data
    analyser.getFloatFrequencyData(dataArray);
    
    // Convert to mel scale
    const melData = applyMelFilterBank(dataArray, melFilterBank);
    
    // Shift existing spectrogram to the left
    ctx.drawImage(canvas, 1, 0, width - 1, height, 0, 0, width - 1, height);
    
    // Draw new column
    for (let i = 0; i < melData.length; i++) {
      // Calculate y position (low frequencies at bottom)
      const y = height - Math.floor((i / melData.length) * height) - 1;
      
      // Normalize value between 0-1 for coloring
      const value = (melData[i] + 3) / 3; // Adjust scaling as needed
      const normalizedValue = Math.min(1, Math.max(0, value));
      
      ctx.fillStyle = getColor(normalizedValue);
      ctx.fillRect(width - 1, y, 1, 1);
    }
    
    animationRef.current = requestAnimationFrame(draw);
  };

  // Start visualization loop
  useEffect(() => {
    if (analyser && melFilterBank) {
      // Initialize canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      
      // Start animation
      animationRef.current = requestAnimationFrame(draw);
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, melFilterBank]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ backgroundColor: 'black' }}
    />
  );
};

// Main DigiSoniq2 component - Advanced Media Sonification Platform
const DigiSoniq2 = () => {
  // ===== STATE MANAGEMENT =====
  // Core application state
  const [isInitialized, setIsInitialized] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [activeTab, setActiveTab] = useState('mixer'); // 'mixer', 'sonify', 'export', 'settings'
  const [visualMode, setVisualMode] = useState('individual'); // 'individual', 'combined', 'spectrum'
  
  // Playback & timeline state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineScroll, setTimelineScroll] = useState(0);
  const [totalDuration, setTotalDuration] = useState(60); // seconds
  const [loopActive, setLoopActive] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(totalDuration);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isSettingLoop, setIsSettingLoop] = useState(false);
  
  // UI interaction state
  const [activeTrackModal, setActiveTrackModal] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [automationMode, setAutomationMode] = useState(null); // parameter being automated
  const [automationTrack, setAutomationTrack] = useState(null); // track being automated
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Media library
  const [mediaLibrary, setMediaLibrary] = useState({
    audio: [],
    images: [],
    videos: []
  });
  
  // Project settings
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [projectName, setProjectName] = useState('New Project');
  const [exportSettings, setExportSettings] = useState({
    format: 'mp3',
    quality: 'high',
    includeVisuals: false,
    resolution: '1080p',
    frameRate: 30
  });
  
  // Application preferences
  const [preferences, setPreferences] = useState({
    autoAnalyze: true,
    autosaveInterval: 5, // minutes
    highPerformanceMode: false,
    theme: 'dark',
    vizQuality: 'medium',
    colorScheme: 'viridis'
  });
  
  // ===== REFS =====
  // Core engine refs
  const toneTransportRef = useRef(null);
  const masterVolumeNodeRef = useRef(null);
  const trackProcessorsRef = useRef({});
  const analyzerNodesRef = useRef({});
  const audioWorkerRef = useRef(null);
  const imageWorkerRef = useRef(null);
  const videoWorkerRef = useRef(null);
  
  // UI element refs
  const timelineRef = useRef(null);
  const spectrogramCanvasRefs = useRef({});
  const combinedSpectrogramRef = useRef(null);
  const fileInputRef = useRef(null);
  const automationCanvasRef = useRef(null);
  const requestAnimationRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  
  // Memoized helper values
  const colorMapFunctions = useMemo(() => ({
    viridis: (value) => {
      // Viridis-like colormap (simulated)
      const v = Math.max(0, Math.min(1, value));
      return `rgb(${Math.floor(68 + 200 * v)}, ${Math.floor(1 + 240 * v * v)}, ${Math.floor(84 + (1-v) * 140)})`;
    },
    magma: (value) => {
      // Magma-like colormap (simulated)
      const v = Math.max(0, Math.min(1, value));
      return `rgb(${Math.floor(10 + 200 * v * v)}, ${Math.floor(0 + 140 * v)}, ${Math.floor(100 * (1-v) + 100 * v * v)})`;
    },
    inferno: (value) => {
      // Inferno-like colormap (simulated)
      const v = Math.max(0, Math.min(1, value));
      return `rgb(${Math.floor(20 + 230 * v)}, ${Math.floor(10 + 80 * v * v)}, ${Math.floor(90 * (1-v) + 60 * v * v)})`;
    },
    plasma: (value) => {
      // Plasma-like colormap (simulated)
      const v = Math.max(0, Math.min(1, value));
      return `rgb(${Math.floor(20 + 200 * v)}, ${Math.floor(20 + 120 * Math.pow(v, 0.7))}, ${Math.floor(200 * (1-v))})`;
    },
    spectral: (value) => {
      // Spectral colormap (blue to red through green/yellow)
      const v = Math.max(0, Math.min(1, value));
      if (v < 0.25) {
        // Blue to cyan
        return `rgb(0, ${Math.floor(v * 4 * 255)}, 255)`;
      } else if (v < 0.5) {
        // Cyan to green
        return `rgb(0, 255, ${Math.floor(255 - (v - 0.25) * 4 * 255)})`;
      } else if (v < 0.75) {
        // Green to yellow
        return `rgb(${Math.floor((v - 0.5) * 4 * 255)}, 255, 0)`;
      } else {
        // Yellow to red
        return `rgb(255, ${Math.floor(255 - (v - 0.75) * 4 * 255)}, 0)`;
      }
    }
  }), []);
  
  // Initialize Tone.js and audio engine
  const initializeAudioEngine = async () => {
    try {
      // Start Tone.js context
      await Tone.start();
      console.log("Tone.js audio context started");
      
      // Set up master volume node
      const masterVol = new Tone.Volume(Tone.gainToDb(masterVolume)).toDestination();
      masterVolumeNodeRef.current = masterVol;
      
      // Set up transport (playback timeline)
      toneTransportRef.current = Tone.Transport;
      toneTransportRef.current.bpm.value = bpm;
      
      // Create default project if none exists
      if (projects.length === 0) {
        createNewProject();
      }
      
      setIsInitialized(true);
      showNotification("Audio engine initialized successfully", "success");
    } catch (error) {
      console.error("Error initializing audio engine:", error);
      showNotification("Failed to initialize audio engine. Please try again.", "error");
    }
  };
  
  // Create a new project
  const createNewProject = () => {
    const newProject = {
      id: Date.now(),
      name: `Project ${projects.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      bpm: 120,
      timeSignature: [4, 4],
      duration: 60, // seconds
      tracks: [],
      automations: {},
      // Additional metadata
      author: "",
      tags: [],
      notes: ""
    };
    
    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
    setProjectName(newProject.name);
    setBpm(newProject.bpm);
    setTotalDuration(newProject.duration);
    
    // Create default tracks
    const defaultTracks = [
      createTrack('audio', 'Main Audio'),
      createTrack('image', 'Image Track'),
      createTrack('video', 'Video Track')
    ];
    
    setTracks(defaultTracks);
    
    // Update Tone.js transport settings
    if (toneTransportRef.current) {
      toneTransportRef.current.bpm.value = newProject.bpm;
      // Reset playhead
      toneTransportRef.current.seconds = 0;
      setPlayheadPosition(0);
    }
    
    showNotification("New project created", "success");
    return newProject;
  };
  
  // Create a track with default settings
  const createTrack = (type, name = null) => {
    const trackCount = tracks.filter(t => t.type === type).length;
    const trackName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${trackCount + 1}`;
    
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: trackName,
      type,
      mediaId: null,
      isExpanded: true,
      height: 120,
      muted: false,
      solo: false,
      volume: 0.8,
      pan: 0,
      effects: [],
      // Advanced properties
      automation: {},
      color: getRandomTrackColor(),
      // Sonification settings
      sonificationSettings: {
        method: getSonificationMethodForType(type),
        synthType: "Synth",
        speed: 1.0,
        resolution: 0.5,
        effectMix: 0.3,
        // Advanced parameters
        scaleType: "pentatonic",
        rootNote: "C4",
        densityFactor: 0.5,
        expressiveness: 0.7,
        imageRegionSize: 16
      }
    };
  };
  
  // Get default sonification method for track type
  const getSonificationMethodForType = (type) => {
    switch (type) {
      case 'audio':
        return 'direct';
      case 'image':
        return 'colorToPitch';
      case 'video':
        return 'spatialToArpeggio';
      default:
        return 'direct';
    }
  };
  
  // Generate a unique color for track visualization
  const getRandomTrackColor = () => {
    const colors = [
      "#FF5555", "#55FF55", "#5555FF", 
      "#FFAA55", "#55FFAA", "#55AAFF", 
      "#FF55AA", "#AAFF55", "#AA55FF"
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Add a new track to the project
  const addTrack = (type) => {
    const newTrack = createTrack(type);
    setTracks([...tracks, newTrack]);
    showNotification(`New ${type} track added`, "info");
    return newTrack;
  };
  
  // Toggle track property (mute, solo, etc.)
  const toggleTrackProperty = (trackId, property) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, [property]: !track[property] } 
        : track
    ));
  };
  
  // Process uploaded files based on type
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    showNotification(`Processing ${files.length} file(s)...`, "info");
    
    // Process each file based on type
    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        processAudioFile(file);
      } else if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else if (file.type.startsWith('video/')) {
        processVideoFile(file);
      } else {
        showNotification(`Unsupported file type: ${file.type}`, "error");
      }
    });
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };
  
  // Process audio file
  const processAudioFile = (file) => {
    // For demo purposes, let's create a simulated processing
    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Create simulated audio entry
        const newAudio = {
          id: Date.now(),
          name: file.name,
          type: 'audio',
          url: e.target.result,
          duration: 120, // Simulated duration
          channels: 2,
          sampleRate: 44100,
          size: file.size,
          waveform: Array(100).fill().map(() => Math.random()), // Simulated waveform
          analysis: {
            averageVolume: 0.7,
            peakVolume: 0.9,
            spectralBalance: {
              lowEnergy: 0.6,
              midEnergy: 0.4,
              highEnergy: 0.3
            }
          },
          dateAdded: new Date()
        };
        
        setMediaLibrary(prev => ({
          ...prev,
          audio: [...prev.audio, newAudio]
        }));
        
        showNotification(`Audio file "${file.name}" processed`, "success");
        
        // Auto-assign to an audio track if enabled
        if (preferences.autoAnalyze) {
          const audioTracks = tracks.filter(track => track.type === 'audio');
          if (audioTracks.length > 0) {
            // Find first empty track or use the first track
            const track = audioTracks.find(t => t.mediaId === null) || audioTracks[0];
            setTracks(tracks.map(t => 
              t.id === track.id ? { ...t, mediaId: newAudio.id } : t
            ));
          }
        }
      };
      
      reader.readAsDataURL(file);
    }, 500);
  };
  
  // Process image file
  const processImageFile = (file) => {
    // For demo purposes, let's create a simulated processing
    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Create simulated image entry
        const newImage = {
          id: Date.now(),
          name: file.name,
          type: 'image',
          url: e.target.result,
          width: 800, // Simulated dimensions
          height: 600,
          size: file.size,
          colorData: {
            width: 100,
            height: 75,
            grid: [/* Would contain color data */]
          },
          analysis: {
            avgBrightness: 0.6,
            avgSaturation: 0.7,
            avgHue: 0.3,
            colorDiversity: 0.5
          },
          dateAdded: new Date()
        };
        
        setMediaLibrary(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
        
        showNotification(`Image file "${file.name}" processed`, "success");
        
        // Auto-assign to an image track if enabled
        if (preferences.autoAnalyze) {
          const imageTracks = tracks.filter(track => track.type === 'image');
          if (imageTracks.length > 0) {
            // Find first empty track or use the first track
            const track = imageTracks.find(t => t.mediaId === null) || imageTracks[0];
            setTracks(tracks.map(t => 
              t.id === track.id ? { ...t, mediaId: newImage.id } : t
            ));
          }
        }
      };
      
      reader.readAsDataURL(file);
    }, 500);
  };
  
  // Process video file
  const processVideoFile = (file) => {
    // For demo purposes, let's create a simulated processing
    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Create simulated video entry
        const newVideo = {
          id: Date.now(),
          name: file.name,
          type: 'video',
          url: e.target.result,
          duration: 90, // Simulated duration
          width: 1280, // Simulated dimensions
          height: 720,
          size: file.size,
          hasAudio: true,
          analysis: {
            avgBrightness: 0.5,
            colorVariance: 0.7,
            motionLevel: 0.6
          },
          dateAdded: new Date()
        };
        
        setMediaLibrary(prev => ({
          ...prev,
          videos: [...prev.videos, newVideo]
        }));
        
        showNotification(`Video file "${file.name}" processed`, "success");
        
        // Auto-assign to a video track if enabled
        if (preferences.autoAnalyze) {
          const videoTracks = tracks.filter(track => track.type === 'video');
          if (videoTracks.length > 0) {
            // Find first empty track or use the first track
            const track = videoTracks.find(t => t.mediaId === null) || videoTracks[0];
            setTracks(tracks.map(t => 
              t.id === track.id ? { ...t, mediaId: newVideo.id } : t
            ));
          }
        }
      };
      
      reader.readAsDataURL(file);
    }, 800);
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (!toneTransportRef.current) return;
    
    if (isPlaying) {
      toneTransportRef.current.pause();
      setIsPlaying(false);
    } else {
      // If at the end, reset to beginning
      if (playheadPosition >= 99.9) {
        setPlayheadPosition(0);
        toneTransportRef.current.seconds = 0;
      }
      
      toneTransportRef.current.start();
      setIsPlaying(true);
    }
  };
  
  // Reset playhead to beginning
  const resetPlayhead = () => {
    setPlayheadPosition(0);
    if (toneTransportRef.current) {
      toneTransportRef.current.seconds = 0;
    }
  };
  
  // Handle playhead drag
  const startPlayheadDrag = (e) => {
    setIsDraggingPlayhead(true);
    updatePlayheadPosition(e);
  };
  
  const updatePlayheadPosition = (e) => {
    if (!isDraggingPlayhead || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    setPlayheadPosition(percentage);
    
    // Update Tone.js transport position
    if (toneTransportRef.current) {
      toneTransportRef.current.seconds = (percentage / 100) * totalDuration;
    }
  };
  
  const stopPlayheadDrag = () => {
    setIsDraggingPlayhead(false);
  };

  // Toggle loop mode
  const toggleLoopMode = () => {
    if (!toneTransportRef.current) return;
    
    if (loopActive) {
      // Disable looping
      toneTransportRef.current.loop = false;
      setLoopActive(false);
    } else {
      // Enable looping
      toneTransportRef.current.loop = true;
      toneTransportRef.current.loopStart = loopStart;
      toneTransportRef.current.loopEnd = loopEnd;
      setLoopActive(true);
    }
  };
  
  // Show notification
  const showNotification = (message, type = "info") => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };
  
  // Toggle track expanded state
  const toggleTrackExpanded = (trackId) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, isExpanded: !track.isExpanded, height: !track.isExpanded ? 120 : 60 } 
        : track
    ));
  };
  
  // Show modal for track settings
  const showTrackModal = (trackId, e) => {
    // Don't show modal if clicking on the track controls
    if (e.target.closest('.track-controls')) return;
    
    setActiveTrackModal(trackId);
    e.stopPropagation();
  };
  
  // Setup track visualization and playback
  useEffect(() => {
    // This would update the track visualizations
    if (isPlaying) {
      const updateTrackVisuals = () => {
        // In a real implementation, this would update the visualizations
        // based on audio analysis
        
        // Update playhead position
        setPlayheadPosition(prev => {
          const newPos = prev + 0.1;
          return newPos >= 100 ? 0 : newPos;
        });
        
        requestAnimationRef.current = requestAnimationFrame(updateTrackVisuals);
      };
      
      requestAnimationRef.current = requestAnimationFrame(updateTrackVisuals);
    }
    
    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, [isPlaying]);
  
  // Handle playhead dragging
  useEffect(() => {
    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', updatePlayheadPosition);
      window.addEventListener('mouseup', stopPlayheadDrag);
      
      return () => {
        window.removeEventListener('mousemove', updatePlayheadPosition);
        window.removeEventListener('mouseup', stopPlayheadDrag);
      };
    }
  }, [isDraggingPlayhead]);
  
  // Get media name from ID for display
  const getMediaName = (type, mediaId) => {
    if (type === 'audio') {
      const media = mediaLibrary.audio.find(a => a.id === mediaId);
      return media ? media.name : 'Unknown audio';
    } else if (type === 'image') {
      const media = mediaLibrary.images.find(i => i.id === mediaId);
      return media ? media.name : 'Unknown image';
    } else if (type === 'video') {
      const media = mediaLibrary.videos.find(v => v.id === mediaId);
      return media ? media.name : 'Unknown video';
    }
    
    return 'Unknown media';
  };
  
  // Render track in timeline
  const renderTrack = (track) => {
    return (
      <div 
        key={track.id}
        className={`border-b border-gray-800 relative ${track.isExpanded ? 'flex-1' : ''}`}
        style={{ 
          height: track.height, 
          minHeight: track.height,
          backgroundColor: track.muted ? '#232323' : '#2a2a2a'
        }}
        onClick={(e) => showTrackModal(track.id, e)}
      >
        {/* Track controls */}
        <div className="absolute top-0 left-0 bg-gray-800 bg-opacity-80 p-2 z-10 flex items-center track-controls">
          <span className="font-medium mr-2" style={{ color: track.color }}>{track.name}</span>
          <button
            className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded mr-1"
            onClick={(e) => {
              e.stopPropagation();
              toggleTrackExpanded(track.id);
            }}
          >
            {track.isExpanded ? '−' : '+'}
          </button>
          <button
            className={`w-6 h-6 flex items-center justify-center rounded mr-1 ${track.muted ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTrackProperty(track.id, 'muted');
            }}
          >
            {track.muted ? 'M' : 'S'}
          </button>
          <button
            className={`w-6 h-6 flex items-center justify-center rounded mr-1 ${track.solo ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTrackProperty(track.id, 'solo');
            }}
          >
            S
          </button>
        </div>
        
        {/* Media info */}
        <div className="absolute top-0 right-0 bg-gray-800 bg-opacity-80 p-2 z-10 text-xs">
          {track.mediaId && getMediaName(track.type, track.mediaId)}
          {!track.mediaId && <span className="text-gray-400">No media assigned</span>}
        </div>
        
        {/* Track visualization */}
        <div 
          className="w-full h-full"
          ref={el => spectrogramCanvasRefs.current[track.id] = el}
        >
          {!track.mediaId ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No media assigned - click to add
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Preview of the media */}
              <div className="w-full h-2/3 bg-black relative">
                {track.type === 'image' && (
                  <div className="h-full flex justify-center items-center">
                    {(() => {
                      const imageItem = mediaLibrary.images.find(i => i.id === track.mediaId);
                      return imageItem ? (
                        <img 
                          src={imageItem.url} 
                          alt={imageItem.name}
                          className="max-h-full max-w-full object-contain opacity-40"
                        />
                      ) : null;
                    })()}
                  </div>
                )}
                {track.type === 'video' && (
                  <div className="h-full flex justify-center items-center">
                    {(() => {
                      const videoItem = mediaLibrary.videos.find(v => v.id === track.mediaId);
                      return videoItem ? (
                        <video 
                          src={videoItem.url}
                          className="max-h-full max-w-full object-contain opacity-40"
                          muted
                        />
                      ) : null;
                    })()}
                  </div>
                )}
                {track.type === 'audio' && (
                  <div className="h-full flex justify-center items-center">
                    {/* Simulated waveform for audio */}
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-full h-20 relative">
                        {(() => {
                          const audioItem = mediaLibrary.audio.find(a => a.id === track.mediaId);
                          if (!audioItem) return null;
                          
                          return audioItem.waveform?.map((value, i) => (
                            <div
                              key={i}
                              className="absolute bottom-1/2 bg-blue-500"
                              style={{
                                height: `${value * 100}%`,
                                width: '1px',
                                left: `${(i / audioItem.waveform.length) * 100}%`,
                                transform: 'translateY(50%)'
                              }}
                            />
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mel spectrogram visualization */}
              <div className="w-full h-1/3 bg-black">
                {track.type === 'audio' && (() => {
                  const audioItem = mediaLibrary.audio.find(a => a.id === track.mediaId);
                  if (!audioItem) return null;
                  
                  // This would be an actual audio source in a real implementation
                  // For the demo, we'll just use a placeholder
                  return (
                    <div className="w-full h-full flex items-center justify-center">
                      Mel Spectrogram Visualization
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
        
        {/* Track modal */}
        {activeTrackModal === track.id && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg z-20 track-modal" style={{ width: '80%', maxWidth: '500px' }}>
            <h3 className="text-lg font-bold mb-3">{track.name} Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Method</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2">
                  <option>colorToPitch</option>
                  <option>brightnessToRhythm</option>
                  <option>spatialToArpeggio</option>
                  <option>colorChords</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Synth Type</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2">
                  <option>AMSynth</option>
                  <option>FMSynth</option>
                  <option>MembraneSynth</option>
                  <option>PluckSynth</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm mb-1">Speed: 1.0x</label>
                <input type="range" className="w-full" min="0.1" max="4" step="0.1" defaultValue="1" />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm mb-1">Resolution: 0.5</label>
                <input type="range" className="w-full" min="0.1" max="1" step="0.05" defaultValue="0.5" />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm mb-1">Effect Mix: 30%</label>
                <input type="range" className="w-full" min="0" max="1" step="0.01" defaultValue="0.3" />
              </div>
            </div>
            
            <div className="flex justify-end mt-4 gap-2">
              <button className="px-3 py-1 bg-green-600 rounded">Apply</button>
              <button 
                className="px-3 py-1 bg-gray-600 rounded" 
                onClick={() => setActiveTrackModal(null)}
              >Close</button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render audio library items
  const renderAudioLibrary = () => {
    return (
      <div className="space-y-2">
        {mediaLibrary.audio.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No audio files in library
          </div>
        ) : (
          mediaLibrary.audio.map(audio => (
            <div 
              key={audio.id}
              className={`p-2 rounded cursor-pointer ${selectedMedia?.id === audio.id ? 'bg-blue-900' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => setSelectedMedia(audio)}
            >
              <div className="flex justify-between">
                <div className="font-medium">{audio.name}</div>
                <div className="text-xs text-gray-400">{formatTime(audio.duration)}</div>
              </div>
              <div className="text-xs text-gray-400">
                {audio.channels}ch • {audio.sampleRate}Hz
              </div>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // Render image library items
  const renderImageLibrary = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {mediaLibrary.images.length === 0 ? (
          <div className="text-center text-gray-500 py-4 col-span-2">
            No images in library
          </div>
        ) : (
          mediaLibrary.images.map(image => (
            <div 
              key={image.id}
              className={`p-2 rounded cursor-pointer ${selectedMedia?.id === image.id ? 'bg-blue-900' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => setSelectedMedia(image)}
            >
              <div className="aspect-square bg-black flex items-center justify-center overflow-hidden mb-1">
                <img 
                  src={image.url} 
                  alt={image.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="text-xs truncate">{image.name}</div>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // Render video library items
  const renderVideoLibrary = () => {
    return (
      <div className="space-y-2">
        {mediaLibrary.videos.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No videos in library
          </div>
        ) : (
          mediaLibrary.videos.map(video => (
            <div 
              key={video.id}
              className={`p-2 rounded cursor-pointer ${selectedMedia?.id === video.id ? 'bg-blue-900' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => setSelectedMedia(video)}
            >
              <div className="flex items-center gap-2">
                <div className="w-24 h-16 bg-black flex items-center justify-center overflow-hidden">
                  <video 
                    src={video.url}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-medium">{video.name}</div>
                  <div className="text-xs text-gray-400">
                    {formatTime(video.duration)} • {video.width}x{video.height}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // Render media editor
  const renderMediaEditor = () => {
    if (!selectedMedia) return null;
    
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-bold mb-4">{selectedMedia.name}</h2>
        
        {/* Preview area */}
        <div className="h-2/5 bg-black flex items-center justify-center mb-4 rounded">
          {selectedMedia.type === 'audio' && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <audio 
                src={selectedMedia.url}
                controls
                className="mb-4 w-3/4"
              />
              <div className="w-3/4 h-24 relative">
                {selectedMedia.waveform?.map((value, i) => (
                  <div
                    key={i}
                    className="absolute bottom-1/2 bg-blue-500"
                    style={{
                      height: `${value * 100}%`,
                      width: '1px',
                      left: `${(i / selectedMedia.waveform.length) * 100}%`,
                      transform: 'translateY(50%)'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {selectedMedia.type === 'image' && (
            <img 
              src={selectedMedia.url}
              alt={selectedMedia.name}
              className="max-h-full max-w-full object-contain"
            />
          )}
          
          {selectedMedia.type === 'video' && (
            <video 
              src={selectedMedia.url}
              controls
              className="max-h-full max-w-full"
            />
          )}
        </div>
        
        {/* Sonification controls */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Sonification Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Sonification Method</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                {selectedMedia.type === 'audio' ? (
                  <>
                    <option value="direct">Direct Playback</option>
                    <option value="pitchShift">Pitch Shift</option>
                    <option value="granular">Granular Synthesis</option>
                    <option value="spectralMap">Spectral Mapping</option>
                  </>
                ) : selectedMedia.type === 'image' ? (
                  <>
                    <option value="colorToPitch">Color to Pitch</option>
                    <option value="brightnessToRhythm">Brightness to Rhythm</option>
                    <option value="spatialToArpeggio">Spatial to Arpeggio</option>
                    <option value="colorChords">Color Chords</option>
                  </>
                ) : (
                  <>
                    <option value="motionToRhythm">Motion to Rhythm</option>
                    <option value="colorToMelody">Color to Melody</option>
                    <option value="frameSequence">Frame Sequence</option>
                    <option value="audioExtraction">Extract Audio</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Synthesizer Type</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                <option value="Synth">Basic Synth</option>
                <option value="AMSynth">AM Synth</option>
                <option value="FMSynth">FM Synth</option>
                <option value="MembraneSynth">Membrane Synth</option>
                <option value="MetalSynth">Metal Synth</option>
                <option value="PluckSynth">Pluck Synth</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm mb-1">Speed: 1.0x</label>
              <input type="range" className="w-full" min="0.1" max="4" step="0.1" defaultValue="1" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm mb-1">Resolution: 0.5</label>
              <input type="range" className="w-full" min="0.1" max="1" step="0.05" defaultValue="0.5" />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Root Note</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                <option value="C4">C4</option>
                <option value="D4">D4</option>
                <option value="E4">E4</option>
                <option value="F4">F4</option>
                <option value="G4">G4</option>
                <option value="A4">A4</option>
                <option value="B4">B4</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Scale Type</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="pentatonic">Pentatonic</option>
                <option value="blues">Blues</option>
                <option value="chromatic">Chromatic</option>
              </select>
            </div>
            
            {/* Advanced controls toggle */}
            <div className="col-span-2 pt-2">
              <button
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              >
                {showAdvancedControls ? '- Hide Advanced Controls' : '+ Show Advanced Controls'}
              </button>
            </div>
            
            {/* Advanced controls */}
            {showAdvancedControls && (
              <>
                <div>
                  <label className="block text-sm mb-1">Effect Type</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                    <option value="reverb">Reverb</option>
                    <option value="delay">Delay</option>
                    <option value="chorus">Chorus</option>
                    <option value="distortion">Distortion</option>
                    <option value="filter">Filter</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Effect Mix: 30%</label>
                  <input type="range" className="w-full" min="0" max="1" step="0.01" defaultValue="0.3" />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Density Factor: 0.5</label>
                  <input type="range" className="w-full" min="0.1" max="1" step="0.05" defaultValue="0.5" />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Expressiveness: 0.7</label>
                  <input type="range" className="w-full" min="0" max="1" step="0.05" defaultValue="0.7" />
                </div>
              </>
            )}
          </div>
          
          {/* Preview and assign buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">
              Preview Sonification
            </button>
            
            <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded">
              Assign to Track
            </button>
          </div>
          
          {/* Analysis visualization */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Media Analysis</h3>
            
            <div className="bg-gray-800 p-4 rounded">
              {selectedMedia.type === 'audio' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Volume Profile</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="bg-blue-600 h-full" style={{ width: `${selectedMedia.analysis.averageVolume * 100}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Average: {Math.round(selectedMedia.analysis.averageVolume * 100)}%</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Frequency Balance</h4>
                    <div className="flex h-20 bg-gray-900 rounded p-2 gap-1">
                      <div className="bg-blue-600 w-1/3 h-full" style={{ height: `${selectedMedia.analysis.spectralBalance.lowEnergy * 100}%` }}></div>
                      <div className="bg-green-600 w-1/3 h-full" style={{ height: `${selectedMedia.analysis.spectralBalance.midEnergy * 100}%` }}></div>
                      <div className="bg-purple-600 w-1/3 h-full" style={{ height: `${selectedMedia.analysis.spectralBalance.highEnergy * 100}%` }}></div>
                    </div>
                    <div className="flex text-xs text-gray-400 mt-1 justify-between">
                      <span>Low</span>
                      <span>Mid</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Dynamics</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="h-full flex items-end">
                        <div className="bg-red-600 w-full" style={{ height: `${selectedMedia.analysis.peakVolume * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Peak: {Math.round(selectedMedia.analysis.peakVolume * 100)}%</div>
                  </div>
                </div>
              )}
              
              {selectedMedia.type === 'image' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Brightness</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="bg-blue-600 h-full" style={{ width: `${selectedMedia.analysis.avgBrightness * 100}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Average: {Math.round(selectedMedia.analysis.avgBrightness * 100)}%</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Saturation</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="bg-green-600 h-full" style={{ width: `${selectedMedia.analysis.avgSaturation * 100}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Average: {Math.round(selectedMedia.analysis.avgSaturation * 100)}%</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Color Diversity</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="bg-purple-600 h-full" style={{ width: `${selectedMedia.analysis.colorDiversity * 100}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Score: {Math.round(selectedMedia.analysis.colorDiversity * 100)}%</div>
                  </div>
                </div>
              )}
              
              {selectedMedia.type === 'video' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Brightness</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="bg-blue-600 h-full" style={{ width: `${selectedMedia.analysis.avgBrightness * 100}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Average: {Math.round(selectedMedia.analysis.avgBrightness * 100)}%</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Color Variance</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="bg-green-600 h-full" style={{ width: `${selectedMedia.analysis.colorVariance * 100}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Score: {Math.round(selectedMedia.analysis.colorVariance * 100)}%</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Motion Level</h4>
                    <div className="h-20 bg-gray-900 rounded p-2">
                      <div className="bg-red-600 h-full" style={{ width: `${selectedMedia.analysis.motionLevel * 100}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Level: {Math.round(selectedMedia.analysis.motionLevel * 100)}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Track modal close handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeTrackModal && !e.target.closest('.track-modal')) {
        setActiveTrackModal(null);
      }
    };
    
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeTrackModal]);

  // ===== RENDER UI =====
  return (
    <div className="flex flex-col bg-gray-900 text-white h-screen">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`px-4 py-2 rounded shadow-lg ${
              notification.type === 'success' ? 'bg-green-600' :
              notification.type === 'error' ? 'bg-red-600' :
              'bg-blue-600'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>
      
      {/* Top Bar */}
      <div className="bg-gray-800 p-2 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            DigiSoniq<span className="text-lg">2</span>
          </h1>
          
          <div className="mx-4">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600"
            />
          </div>
          
          <button
            className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
            onClick={createNewProject}
          >
            New Project
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            className={`px-3 py-1 rounded ${activeTab === 'mixer' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setActiveTab('mixer')}
          >
            Mixer
          </button>
          <button 
            className={`px-3 py-1 rounded ${activeTab === 'sonify' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setActiveTab('sonify')}
          >
            Sonify
          </button>
          <button 
            className={`px-3 py-1 rounded ${activeTab === 'export' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button 
            className={`px-3 py-1 rounded ${activeTab === 'settings' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {!isInitialized ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl mb-4">Welcome to DigiSoniq2</h2>
              <p className="mb-6">Press the button below to initialize the audio engine</p>
              <button
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-bold"
                onClick={initializeAudioEngine}
              >
                Start Audio Engine
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mixer Tab */}
            {activeTab === 'mixer' && (
              <div className="h-full flex flex-col">
                {/* Transport Controls */}
                <div className="bg-gray-800 p-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1 rounded-full bg-gray-700 hover:bg-gray-600"
                      onClick={resetPlayhead}
                      title="Reset to Beginning"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="19 20 9 12 19 4 19 20"></polygon>
                        <line x1="5" y1="19" x2="5" y2="5"></line>
                      </svg>
                    </button>
                    
                    <button
                      className={`p-1 rounded-full ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                      onClick={togglePlayback}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </button>
                    
                    <button
                      className={`p-1 rounded-full ${loopActive ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={toggleLoopMode}
                      title={loopActive ? 'Disable Loop' : 'Enable Loop'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 2l4 4-4 4"></path>
                        <path d="M3 11v-1a4 4 0 014-4h14"></path>
                        <path d="M7 22l-4-4 4-4"></path>
                        <path d="M21 13v1a4 4 0 01-4 4H3"></path>
                      </svg>
                    </button>
                    
                    <div className="font-mono ml-2">
                      {formatTime((playheadPosition / 100) * totalDuration)} / {formatTime(totalDuration)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span>BPM:</span>
                      <input
                        type="number"
                        min="40"
                        max="240"
                        value={bpm}
                        onChange={(e) => {
                          const newBpm = parseInt(e.target.value);
                          setBpm(newBpm);
                          if (toneTransportRef.current) {
                            toneTransportRef.current.bpm.value = newBpm;
                          }
                        }}
                        className="bg-gray-700 border border-gray-600 rounded w-16 px-2 py-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        className={`p-1 rounded ${isMasterMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                        onClick={() => setIsMasterMuted(!isMasterMuted)}
                      >
                        {isMasterMuted ? 'M' : 'S'}
                      </button>
                      
                      <span>Vol:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={masterVolume}
                        onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                        className="w-24"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span>View:</span>
                      <select
                        value={visualMode}
                        onChange={(e) => setVisualMode(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1"
                      >
                        <option value="individual">Individual</option>
                        <option value="combined">Combined</option>
                        <option value="spectrum">Spectrum</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Tracks Area */}
                <div 
                  className="flex-1 overflow-auto relative"
                  ref={timelineRef}
                  style={{ backgroundColor: '#1c1c1c' }}
                >
                  {/* Combined View */}
                  {visualMode === 'combined' && (
                    <div className="p-2">
                      <h3 className="text-lg font-semibold mb-2">Combined Visualization</h3>
                      <div 
                        className="bg-black h-64 rounded"
                        ref={combinedSpectrogramRef}
                      >
                        {/* Combined visualization would be rendered here */}
                        <div className="h-full flex items-center justify-center text-gray-500">
                          Combined Mel Spectrogram Visualization
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Spectrum View */}
                  {visualMode === 'spectrum' && (
                    <div className="p-2">
                      <h3 className="text-lg font-semibold mb-2">Frequency Spectrum Analysis</h3>
                      <div className="bg-black h-64 rounded">
                        {/* Spectrum visualization would be rendered here */}
                        <div className="h-full flex items-center justify-center text-gray-500">
                          Real-time Spectrum Analyzer
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Individual Tracks View */}
                  {visualMode === 'individual' && (
                    <div className="flex flex-col h-full">
                      {/* Render all tracks */}
                      {tracks.map(track => renderTrack(track))}
                      
                      {/* Add track button */}
                      <div className="p-2 flex justify-center bg-gray-800">
                        <div className="inline-flex gap-2">
                          <button 
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                            onClick={() => addTrack('audio')}
                          >
                            Add Audio Track
                          </button>
                          <button 
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                            onClick={() => addTrack('image')}
                          >
                            Add Image Track
                          </button>
                          <button 
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                            onClick={() => addTrack('video')}
                          >
                            Add Video Track
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Playhead */}
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                    style={{ left: `${playheadPosition}%` }}
                  >
                    {/* Playhead handle */}
                    <div 
                      className="absolute bottom-0 transform -translate-x-1/2 cursor-ew-resize"
                      style={{ width: '30px', height: '20px' }}
                      onMouseDown={startPlayheadDrag}
                    >
                      <div className="flex items-center justify-center bg-red-500 rounded-t-md px-2 py-1 text-xs">
                        ||
                      </div>
                    </div>
                  </div>
                  
                  {/* Loop region indicator */}
                  {loopActive && (
                    <div 
                      className="absolute top-0 bottom-0 bg-blue-500 bg-opacity-20 border-l border-r border-blue-500"
                      style={{ 
                        left: `${(loopStart / totalDuration) * 100}%`,
                        width: `${((loopEnd - loopStart) / totalDuration) * 100}%`
                      }}
                    ></div>
                  )}
                </div>
                
                {/* Timeline ruler */}
                <div className="h-6 bg-gray-800 relative flex items-center px-2">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center text-xs px-2">
                    {formatTime(0)}
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 flex items-center text-xs px-2">
                    {formatTime(totalDuration)}
                  </div>
                  
                  {/* Quarter markers */}
                  <div className="absolute left-1/4 top-0 bottom-0 flex items-center text-xs">
                    <div className="absolute h-2 w-px bg-gray-500 top-0"></div>
                    <div className="mt-2">{formatTime(totalDuration * 0.25)}</div>
                  </div>
                  <div className="absolute left-1/2 top-0 bottom-0 flex items-center text-xs">
                    <div className="absolute h-2 w-px bg-gray-500 top-0"></div>
                    <div className="mt-2">{formatTime(totalDuration * 0.5)}</div>
                  </div>
                  <div className="absolute left-3/4 top-0 bottom-0 flex items-center text-xs">
                    <div className="absolute h-2 w-px bg-gray-500 top-0"></div>
                    <div className="mt-2">{formatTime(totalDuration * 0.75)}</div>
                  </div>
                  
                  {/* Current time indicator */}
                  <div 
                    className="absolute top-0 bottom-0 flex items-center text-xs text-red-400"
                    style={{ left: `${playheadPosition}%` }}
                  >
                    <div className="absolute whitespace-nowrap transform -translate-x-1/2">
                      {formatTime((playheadPosition / 100) * totalDuration)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sonify Tab */}
            {activeTab === 'sonify' && (
              <div className="h-full flex">
                {/* Media Library Panel */}
                <div className="w-1/3 bg-gray-800 p-4">
                  <h2 className="text-xl font-bold mb-4">Media Library</h2>
                  
                  {/* Upload controls */}
                  <div className="mb-4">
                    <input
                      type="file"
                      accept="audio/*,image/*,video/*"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded w-full"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      Upload Media
                    </button>
                  </div>
                  
                  {/* Media tabs */}
                  <div className="flex border-b border-gray-700 mb-2">
                    <button 
                      className={`px-3 py-1 ${selectedMedia?.type === 'audio' ? 'border-b-2 border-blue-500' : ''}`}
                      onClick={() => setSelectedMedia(mediaLibrary.audio[0] || { type: 'audio' })}
                    >
                      Audio ({mediaLibrary.audio.length})
                    </button>
                    <button 
                      className={`px-3 py-1 ${selectedMedia?.type === 'image' ? 'border-b-2 border-blue-500' : ''}`}
                      onClick={() => setSelectedMedia(mediaLibrary.images[0] || { type: 'image' })}
                    >
                      Images ({mediaLibrary.images.length})
                    </button>
                    <button 
                      className={`px-3 py-1 ${selectedMedia?.type === 'video' ? 'border-b-2 border-blue-500' : ''}`}
                      onClick={() => setSelectedMedia(mediaLibrary.videos[0] || { type: 'video' })}
                    >
                      Videos ({mediaLibrary.videos.length})
                    </button>
                  </div>
                  
                  {/* Media list */}
                  <div className="overflow-y-auto" style={{ height: 'calc(100vh - 250px)' }}>
                    {selectedMedia?.type === 'audio' && renderAudioLibrary()}
                    {selectedMedia?.type === 'image' && renderImageLibrary()}
                    {selectedMedia?.type === 'video' && renderVideoLibrary()}
                  </div>
                </div>
                
                {/* Media Preview & Sonification Panel */}
                <div className="w-2/3 bg-gray-900 p-4">
                  {selectedMedia?.id ? renderMediaEditor() : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xl text-gray-400">
                        Select a media file from the library to preview and sonify
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className="h-full p-6">
                <h2 className="text-2xl font-bold mb-6">Export Project</h2>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Audio Export Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1">Format</label>
                        <select 
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                          value={exportSettings.format}
                          onChange={(e) => setExportSettings({
                            ...exportSettings,
                            format: e.target.value
                          })}
                        >
                          <option value="mp3">MP3</option>
                          <option value="wav">WAV (Lossless)</option>
                          <option value="ogg">OGG Vorbis</option>
                          <option value="flac">FLAC (Lossless)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Quality</label>
                        <select 
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                          value={exportSettings.quality}
                          onChange={(e) => setExportSettings({
                            ...exportSettings,
                            quality: e.target.value
                          })}
                        >
                          <option value="low">Low (128kbps)</option>
                          <option value="medium">Medium (256kbps)</option>
                          <option value="high">High (320kbps)</option>
                          <option value="lossless">Lossless</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Normalize Audio</label>
                        <input type="checkbox" className="mr-2" defaultChecked={true} />
                        <span>Adjust volume levels for optimal output</span>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Include Metadata</label>
                        <input type="checkbox" className="mr-2" defaultChecked={true} />
                        <span>Save project information in file metadata</span>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Stem Export</label>
                        <input type="checkbox" className="mr-2" />
                        <span>Export individual tracks as separate files</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Visual Export Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1">Include Visuals</label>
                        <input 
                          type="checkbox" 
                          className="mr-2" 
                          checked={exportSettings.includeVisuals}
                          onChange={(e) => setExportSettings({
                            ...exportSettings,
                            includeVisuals: e.target.checked
                          })}
                        />
                        <span>Export as video with visualizations</span>
                      </div>
                      
                      <div className={!exportSettings.includeVisuals ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm mb-1">Video Format</label>
                        <select className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3">
                          <option>MP4 (H.264)</option>
                          <option>WebM (VP9)</option>
                          <option>GIF (Animated)</option>
                        </select>
                      </div>
                      
                      <div className={!exportSettings.includeVisuals ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm mb-1">Resolution</label>
                        <select 
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                          value={exportSettings.resolution}
                          onChange={(e) => setExportSettings({
                            ...exportSettings,
                            resolution: e.target.value
                          })}
                        >
                          <option value="720p">720p (1280x720)</option>
                          <option value="1080p">1080p (1920x1080)</option>
                          <option value="1440p">1440p (2560x1440)</option>
                          <option value="4K">4K (3840x2160)</option>
                        </select>
                      </div>
                      
                      <div className={!exportSettings.includeVisuals ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm mb-1">Frame Rate</label>
                        <select 
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                          value={exportSettings.frameRate}
                          onChange={(e) => setExportSettings({
                            ...exportSettings,
                            frameRate: parseInt(e.target.value)
                          })}
                        >
                          <option value="24">24 fps (Film)</option>
                          <option value="30">30 fps (Standard)</option>
                          <option value="60">60 fps (Smooth)</option>
                        </select>
                      </div>
                      
                      <div className={!exportSettings.includeVisuals ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm mb-1">Visual Style</label>
                        <select className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3">
                          <option>Mel Spectrogram</option>
                          <option>Frequency Spectrum</option>
                          <option>Waveform + Spectrogram</option>
                          <option>Media Visualization</option>
                          <option>Custom Style</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <button 
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-lg font-bold"
                  >
                    Export Project
                  </button>
                </div>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="h-full p-6">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Performance Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label>High Performance Mode</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={preferences.highPerformanceMode}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              highPerformanceMode: e.target.checked
                            })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Visualization Quality</label>
                        <select 
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                          value={preferences.vizQuality}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            vizQuality: e.target.value
                          })}
                        >
                          <option value="low">Low (Best Performance)</option>
                          <option value="medium">Medium (Balanced)</option>
                          <option value="high">High (Best Quality)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Color Scheme</label>
                        <select 
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                          value={preferences.colorScheme}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            colorScheme: e.target.value
                          })}
                        >
                          <option value="viridis">Viridis</option>
                          <option value="magma">Magma</option>
                          <option value="inferno">Inferno</option>
                          <option value="plasma">Plasma</option>
                          <option value="spectral">Spectral</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Timeline Zoom Level</label>
                        <input 
                          type="range" 
                          min="0.25" 
                          max="4" 
                          step="0.25" 
                          value={timelineZoom}
                          onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>0.25x</span>
                          <span>1x</span>
                          <span>4x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Project Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1">Project Duration (seconds)</label>
                        <input 
                          type="number"
                          min="10"
                          max="3600"
                          value={totalDuration}
                          onChange={(e) => setTotalDuration(parseInt(e.target.value))}
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Auto-Analyze Uploads</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={preferences.autoAnalyze}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              autoAnalyze: e.target.checked
                            })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-2">Automatically analyze and assign uploads</span>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Default BPM</label>
                        <input 
                          type="number"
                          min="40"
                          max="240"
                          value={bpm}
                          onChange={(e) => setBpm(parseInt(e.target.value))}
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Theme</label>
                        <select 
                          className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                          value={preferences.theme}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            theme: e.target.value
                          })}
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="blue">Blue</option>
                          <option value="purple">Purple</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">About DigiSoniq2</h3>
                  <p>
                    DigiSoniq2 is an advanced media sonification platform that allows you to 
                    transform visual elements from images and videos into musical compositions.
                    Mix multiple media sources, apply different sonification algorithms, and 
                    export high-quality audio or audio-visual content.
                  </p>
                  <div className="mt-4 text-sm text-gray-400">
                    Version 1.0.0 • Build 20250501-1
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// For demo purposes, here's a simple example with a mel spectrogram
const MelSpectrogramDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Mel Spectrogram Visualization</h2>
      
      <div className="mb-4">
        <audio 
          ref={audioRef} 
          src="https://tonejs.github.io/audio/berklee/gong_1.mp3" 
          className="w-full"
          controls
        />
      </div>
      
      <div className="mb-4">
        <MelSpectrogramCanvas 
          audioSource={audioRef.current} 
          width={800} 
          height={200} 
          colorMap="viridis"
        />
      </div>
    </div>
  );
};

export default DigiSoniq2;