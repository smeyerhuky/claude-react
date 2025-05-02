import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

// Main component for the DJ Sonification Tool
const DJSonificationTool = () => {
  // Application state
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(60); // Default 60 seconds
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'combined'
  const [activeTab, setActiveTab] = useState('mixer'); // 'mixer', 'sonify', 'export'
  const [activeTrackModal, setActiveTrackModal] = useState(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaLibrary, setMediaLibrary] = useState({
    audio: [],
    images: [],
    videos: []
  });
  const [exportSettings, setExportSettings] = useState({
    format: 'mp3',
    quality: 'high',
    includeVisuals: false
  });
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8); // 0-1 range
  
  // Refs
  const timelineRef = useRef(null);
  const spectrogramCanvasRefs = useRef({});
  const combinedSpectrogramRef = useRef(null);
  const requestAnimationRef = useRef(null);
  const toneTransportRef = useRef(null);
  const trackProcessorsRef = useRef({});
  const analyzerNodesRef = useRef({});
  const masterVolumeNodeRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Initialize Tone.js
  useEffect(() => {
    // Start Tone.js context when user interacts
    const setupTone = async () => {
      await Tone.start();
      console.log("Tone.js is ready");
      
      // Set up master volume node
      const masterVol = new Tone.Volume(Tone.gainToDb(masterVolume)).toDestination();
      masterVolumeNodeRef.current = masterVol;
      
      // Set up transport (playback timeline)
      toneTransportRef.current = Tone.Transport;
      
      // Create default project if none exists
      if (projects.length === 0) {
        createNewProject();
      }
    };
    
    // Call setup on first user interaction
    const handleFirstInteraction = () => {
      setupTone();
      window.removeEventListener('click', handleFirstInteraction);
    };
    
    window.addEventListener('click', handleFirstInteraction);
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      // Clean up Tone.js resources
      if (masterVolumeNodeRef.current) {
        masterVolumeNodeRef.current.dispose();
      }
      
      // Dispose all track processors
      Object.values(trackProcessorsRef.current).forEach(processor => {
        if (processor && processor.dispose) {
          processor.dispose();
        }
      });
      
      // Dispose all analyzer nodes
      Object.values(analyzerNodesRef.current).forEach(analyzer => {
        if (analyzer && analyzer.dispose) {
          analyzer.dispose();
        }
      });
    };
  }, []);
  
  // Update master volume when changed
  useEffect(() => {
    if (masterVolumeNodeRef.current) {
      masterVolumeNodeRef.current.volume.value = Tone.gainToDb(masterVolume);
    }
  }, [masterVolume]);
  
  // Update playhead position during playback
  useEffect(() => {
    if (!toneTransportRef.current) return;
    
    const updatePlayhead = () => {
      if (isPlaying) {
        // Get current time from Tone.js transport
        const currentTime = toneTransportRef.current.seconds;
        // Convert to percentage for positioning
        const percentage = (currentTime / totalDuration) * 100;
        setPlayheadPosition(percentage);
      }
      
      requestAnimationRef.current = requestAnimationFrame(updatePlayhead);
    };
    
    requestAnimationRef.current = requestAnimationFrame(updatePlayhead);
    
    return () => {
      cancelAnimationFrame(requestAnimationRef.current);
    };
  }, [isPlaying, totalDuration]);
  
  // Handle playback state
  useEffect(() => {
    if (!toneTransportRef.current) return;
    
    if (isPlaying) {
      toneTransportRef.current.start();
    } else {
      toneTransportRef.current.pause();
    }
    
    return () => {
      if (toneTransportRef.current.state === 'started') {
        toneTransportRef.current.pause();
      }
    };
  }, [isPlaying]);
  
  // Create a new empty project
  const createNewProject = () => {
    const newProject = {
      id: Date.now(),
      name: `Project ${projects.length + 1}`,
      createdAt: new Date(),
      bpm: 120,
      timeSignature: [4, 4],
      tracks: [],
    };
    
    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
    
    // Create default tracks
    const defaultTracks = [
      {
        id: Date.now(),
        name: "Main Audio",
        type: "audio",
        mediaId: null,
        isExpanded: true,
        height: 120,
        muted: false,
        solo: false,
        volume: 0.8,
        pan: 0,
        effects: [],
        sonificationSettings: {
          method: "direct", // Default to direct audio playback
          synthType: "Synth",
          speed: 1.0,
          resolution: 0.5,
          effectMix: 0.3
        }
      },
      {
        id: Date.now() + 1,
        name: "Image Track",
        type: "image",
        mediaId: null,
        isExpanded: true,
        height: 120,
        muted: false,
        solo: false,
        volume: 0.7,
        pan: 0,
        effects: [],
        sonificationSettings: {
          method: "colorToPitch",  // Convert color data to musical notes
          synthType: "AMSynth",
          speed: 1.0,
          resolution: 0.5,
          effectMix: 0.3
        }
      },
      {
        id: Date.now() + 2,
        name: "Video Track",
        type: "video",
        mediaId: null,
        isExpanded: true,
        height: 120,
        muted: false,
        solo: false,
        volume: 0.7,
        pan: 0,
        effects: [],
        sonificationSettings: {
          method: "spatialToArpeggio", // Convert frame data to arpeggiated patterns
          synthType: "FMSynth",
          speed: 1.0,
          resolution: 0.5,
          effectMix: 0.3
        }
      }
    ];
    
    setTracks(defaultTracks);
    
    // Initialize Tone.js for the tracks
    if (Tone.Transport) {
      Tone.Transport.bpm.value = newProject.bpm;
      Tone.Transport.timeSignature = newProject.timeSignature;
    }
  };
  
  // Handle track playback
  const togglePlayback = () => {
    if (!toneTransportRef.current) return;
    
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If at the end, reset to beginning
      if (playheadPosition >= 99.9) {
        setPlayheadPosition(0);
        toneTransportRef.current.seconds = 0;
      }
      setIsPlaying(true);
    }
  };
  
  // Handle importing media files
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      // Process based on file type
      if (file.type.startsWith('audio/')) {
        processAudioFile(file);
      } else if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else if (file.type.startsWith('video/')) {
        processVideoFile(file);
      } else {
        console.warn(`Unsupported file type: ${file.type}`);
      }
    });
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };
  
  // Process audio file
  const processAudioFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      
      try {
        // Decode audio data
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create blob URL for playback
        const blob = new Blob([arrayBuffer], { type: file.type });
        const audioUrl = URL.createObjectURL(blob);
        
        // Add to media library
        const newAudio = {
          id: Date.now(),
          name: file.name,
          type: 'audio',
          url: audioUrl,
          duration: audioBuffer.duration,
          channels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate,
          size: file.size,
          originalFile: file,
          buffer: audioBuffer,
          waveform: generateWaveformData(audioBuffer)
        };
        
        setMediaLibrary(prev => ({
          ...prev,
          audio: [...prev.audio, newAudio]
        }));
        
        // If the first audio track is empty, automatically add this audio
        const audioTracks = tracks.filter(track => track.type === 'audio');
        if (audioTracks.length > 0 && audioTracks[0].mediaId === null) {
          assignMediaToTrack(audioTracks[0].id, newAudio.id);
        }
        
      } catch (error) {
        console.error("Error processing audio file:", error);
        // Show user-friendly error
        alert(`Could not process audio file ${file.name}. It may be corrupted or in an unsupported format.`);
      }
    };
    
    reader.onerror = () => {
      console.error("Error reading file");
      alert(`Error reading file ${file.name}`);
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Process image file
  const processImageFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      
      // Create an image element to get dimensions
      const img = new Image();
      img.onload = () => {
        // Add to media library
        const newImage = {
          id: Date.now(),
          name: file.name,
          type: 'image',
          url: imageUrl,
          width: img.width,
          height: img.height,
          size: file.size,
          originalFile: file,
          // Extract color data for sonification
          colorData: extractImageColorData(img)
        };
        
        setMediaLibrary(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
        
        // If the first image track is empty, automatically add this image
        const imageTracks = tracks.filter(track => track.type === 'image');
        if (imageTracks.length > 0 && imageTracks[0].mediaId === null) {
          assignMediaToTrack(imageTracks[0].id, newImage.id);
        }
      };
      
      img.onerror = () => {
        console.error("Error loading image");
        alert(`Error loading image ${file.name}`);
      };
      
      img.src = imageUrl;
    };
    
    reader.onerror = () => {
      console.error("Error reading file");
      alert(`Error reading file ${file.name}`);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Process video file
  const processVideoFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const videoUrl = e.target.result;
      
      // Create a video element to get metadata
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Add to media library
        const newVideo = {
          id: Date.now(),
          name: file.name,
          type: 'video',
          url: videoUrl,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          originalFile: file,
          // We'll extract frame data on demand when sonifying
          hasAudio: video.mozHasAudio || Boolean(video.webkitAudioDecodedByteCount) || Boolean(video.audioTracks?.length)
        };
        
        setMediaLibrary(prev => ({
          ...prev,
          videos: [...prev.videos, newVideo]
        }));
        
        // If the first video track is empty, automatically add this video
        const videoTracks = tracks.filter(track => track.type === 'video');
        if (videoTracks.length > 0 && videoTracks[0].mediaId === null) {
          assignMediaToTrack(videoTracks[0].id, newVideo.id);
        }
      };
      
      video.onerror = () => {
        console.error("Error loading video");
        alert(`Error loading video ${file.name}`);
      };
      
      video.src = videoUrl;
    };
    
    reader.onerror = () => {
      console.error("Error reading file");
      alert(`Error reading file ${file.name}`);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Assign media to a track
  const assignMediaToTrack = (trackId, mediaId) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, mediaId: mediaId } 
        : track
    ));
    
    // Set up or update Tone.js processors for this track
    setupTrackProcessor(trackId, mediaId);
  };
  
  // Set up Tone.js processing chain for a track
  const setupTrackProcessor = (trackId, mediaId) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    // Clean up any existing processor
    if (trackProcessorsRef.current[trackId] && trackProcessorsRef.current[trackId].dispose) {
      trackProcessorsRef.current[trackId].dispose();
    }
    
    // Find the media
    let media = null;
    if (track.type === 'audio') {
      media = mediaLibrary.audio.find(a => a.id === mediaId);
    } else if (track.type === 'image') {
      media = mediaLibrary.images.find(i => i.id === mediaId);
    } else if (track.type === 'video') {
      media = mediaLibrary.videos.find(v => v.id === mediaId);
    }
    
    if (!media) return;
    
    // Create analyzer node for visualization
    const analyzer = new Tone.FFT(1024);
    analyzerNodesRef.current[trackId] = analyzer;
    
    let processor = null;
    
    // Set up appropriate processor based on track type and sonification method
    if (track.type === 'audio') {
      // For audio, just play it directly
      const player = new Tone.Player({
        url: media.url,
        loop: false,
        volume: track.volume,
      }).connect(analyzer);
      
      // Add panner if needed
      if (track.pan !== 0) {
        const panner = new Tone.Panner(track.pan);
        player.chain(panner, masterVolumeNodeRef.current);
      } else {
        player.connect(masterVolumeNodeRef.current);
      }
      
      // Add any effects
      if (track.effects && track.effects.length > 0) {
        applyEffectsToTrack(player, track.effects);
      }
      
      // Schedule the player to start at the correct time
      toneTransportRef.current.schedule((time) => {
        player.start(time);
      }, 0);
      
      processor = player;
      
    } else if (track.type === 'image') {
      // For images, convert pixel data to sound based on sonification method
      const synth = new Tone[track.sonificationSettings.synthType]({
        volume: track.volume,
      }).connect(analyzer);
      
      // Add panner if needed
      if (track.pan !== 0) {
        const panner = new Tone.Panner(track.pan);
        synth.chain(panner, masterVolumeNodeRef.current);
      } else {
        synth.connect(masterVolumeNodeRef.current);
      }
      
      // Add any effects
      if (track.effects && track.effects.length > 0) {
        applyEffectsToTrack(synth, track.effects);
      }
      
      // Generate a sequence from the image data
      const sequence = createSequenceFromImage(
        media.colorData, 
        track.sonificationSettings
      );
      
      // Create a Tone.js sequence to play the notes
      const toneSequence = new Tone.Sequence((time, note) => {
        if (note && !track.muted) {
          synth.triggerAttackRelease(
            note.pitch, 
            note.duration, 
            time, 
            note.velocity
          );
        }
      }, sequence).start(0);
      
      processor = {
        synth,
        sequence: toneSequence,
        dispose: () => {
          toneSequence.dispose();
          synth.dispose();
        }
      };
      
    } else if (track.type === 'video') {
      // For videos, we need to process frame-by-frame
      // This is a simplified approach - in a full implementation,
      // you would extract frames at regular intervals and sonify them
      
      // Create a video element to process
      const videoEl = document.createElement('video');
      videoEl.src = media.url;
      videoEl.crossOrigin = 'anonymous';
      
      // Create a synth
      const synth = new Tone[track.sonificationSettings.synthType]({
        volume: track.volume,
      }).connect(analyzer);
      
      // Add panner if needed
      if (track.pan !== 0) {
        const panner = new Tone.Panner(track.pan);
        synth.chain(panner, masterVolumeNodeRef.current);
      } else {
        synth.connect(masterVolumeNodeRef.current);
      }
      
      // Add any effects
      if (track.effects && track.effects.length > 0) {
        applyEffectsToTrack(synth, track.effects);
      }
      
      // Extract frames and create a sequence
      // This is simplified - a real implementation would use Web Workers for performance
      const frameRate = 30;
      const duration = media.duration;
      const numFrames = Math.floor(duration * frameRate);
      
      // Pre-extract a subset of frames
      // In a real implementation, you would do this more efficiently with VideoFrame API
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = media.width;
      canvas.height = media.height;
      
      let frameData = [];
      let framesExtracted = 0;
      
      const extractFrames = () => {
        if (framesExtracted >= numFrames) {
          // Done extracting frames
          videoEl.removeEventListener('seeked', seekHandler);
          
          // Create sequence from frame data
          const sequence = createSequenceFromFrames(
            frameData, 
            track.sonificationSettings
          );
          
          // Create a Tone.js sequence
          const toneSequence = new Tone.Sequence((time, note) => {
            if (note && !track.muted) {
              synth.triggerAttackRelease(
                note.pitch, 
                note.duration, 
                time, 
                note.velocity
              );
            }
          }, sequence).start(0);
          
          processor.sequence = toneSequence;
          return;
        }
        
        // Seek to the next frame position
        const time = framesExtracted / frameRate;
        videoEl.currentTime = time;
      };
      
      const seekHandler = () => {
        // Extract frame data
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process frame for sonification
        // Simple example - extract average colors from regions
        const frameInfo = analyzeVideoFrame(imageData.data, canvas.width, canvas.height);
        frameData.push(frameInfo);
        
        // Move to next frame
        framesExtracted++;
        extractFrames();
      };
      
      videoEl.addEventListener('seeked', seekHandler);
      
      // Start frame extraction when video is loaded
      videoEl.addEventListener('loadedmetadata', () => {
        extractFrames();
      });
      
      videoEl.load();
      
      processor = {
        synth,
        video: videoEl,
        dispose: () => {
          if (processor.sequence) {
            processor.sequence.dispose();
          }
          synth.dispose();
          videoEl.src = '';
        }
      };
    }
    
    // Store the processor for later use
    trackProcessorsRef.current[trackId] = processor;
  };
  
  // Apply effects to a track
  const applyEffectsToTrack = (audioNode, effects) => {
    if (!effects || effects.length === 0) return;
    
    // Disconnect from destination
    audioNode.disconnect();
    
    let lastNode = audioNode;
    
    // Chain effects
    effects.forEach(effect => {
      let effectNode;
      
      switch (effect.type) {
        case 'reverb':
          effectNode = new Tone.Reverb({
            decay: effect.decay || 1.5,
            wet: effect.wet || 0.5
          });
          break;
        case 'delay':
          effectNode = new Tone.FeedbackDelay({
            delayTime: effect.delayTime || 0.25,
            feedback: effect.feedback || 0.5,
            wet: effect.wet || 0.5
          });
          break;
        case 'distortion':
          effectNode = new Tone.Distortion({
            distortion: effect.amount || 0.4,
            wet: effect.wet || 0.5
          });
          break;
        case 'filter':
          effectNode = new Tone.Filter({
            frequency: effect.frequency || 1000,
            type: effect.filterType || 'lowpass',
            Q: effect.Q || 1
          });
          break;
        default:
          return; // Skip unknown effect types
      }
      
      // Connect the last node to this effect
      lastNode.connect(effectNode);
      lastNode = effectNode;
    });
    
    // Connect the last effect to the analyzer and destination
    const trackId = tracks.findIndex(track => 
      trackProcessorsRef.current[track.id] === audioNode);
      
    if (trackId >= 0 && analyzerNodesRef.current[trackId]) {
      lastNode.connect(analyzerNodesRef.current[trackId]);
    }
    
    // Connect to master volume
    lastNode.connect(masterVolumeNodeRef.current);
  };
  
  // Create musical sequence from image data
  const createSequenceFromImage = (colorData, settings) => {
    const { method, speed, resolution } = settings;
    
    // Map methods to different strategies
    switch (method) {
      case 'colorToPitch':
        return convertColorsToPitches(colorData, speed, resolution);
      case 'brightnessToRhythm':
        return convertBrightnessToRhythm(colorData, speed, resolution);
      case 'spatialToArpeggio':
        return convertSpatialToArpeggio(colorData, speed, resolution);
      case 'colorChords':
        return convertColorsToChords(colorData, speed, resolution);
      default:
        // Default fallback
        return convertColorsToPitches(colorData, speed, resolution);
    }
  };
  
  // Create musical sequence from video frames
  const createSequenceFromFrames = (frameData, settings) => {
    const { method, speed, resolution } = settings;
    
    // Similar mapping strategies as with images, but frame-by-frame
    switch (method) {
      case 'spatialToArpeggio':
        return convertFramesToArpeggios(frameData, speed, resolution);
      case 'motionToExpression':
        return convertMotionToExpression(frameData, speed, resolution);
      case 'colorEvolution':
        return convertColorEvolution(frameData, speed, resolution);
      default:
        // Default fallback
        return convertFramesToArpeggios(frameData, speed, resolution);
    }
  };
  
  // Extract color data from an image for sonification
  const extractImageColorData = (imgElement) => {
    // Create a canvas to extract pixel data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize to manageable dimensions for analysis
    const maxDim = 100; // Limit to 100x100 grid for performance
    const aspectRatio = imgElement.width / imgElement.height;
    
    let width, height;
    if (aspectRatio > 1) {
      width = maxDim;
      height = Math.floor(maxDim / aspectRatio);
    } else {
      height = maxDim;
      width = Math.floor(maxDim * aspectRatio);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image and get pixel data
    ctx.drawImage(imgElement, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Process pixel data into a more useful format
    const colorGrid = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        row.push({
          r: imageData.data[i],
          g: imageData.data[i + 1],
          b: imageData.data[i + 2],
          a: imageData.data[i + 3],
          // Pre-calculate useful derived values
          brightness: (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3 / 255,
          hue: rgbToHue(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]),
          saturation: rgbToSaturation(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2])
        });
      }
      colorGrid.push(row);
    }
    
    return {
      width,
      height,
      grid: colorGrid
    };
  };
  
  // Analyze video frame for sonification
  const analyzeVideoFrame = (pixelData, width, height) => {
    // Simplified frame analysis - in a real implementation, you would 
    // use more sophisticated techniques like optical flow, edge detection, etc.
    
    // Divide the frame into regions (e.g., 4x4 grid)
    const regionSize = 4;
    const regionsX = Math.floor(width / regionSize);
    const regionsY = Math.floor(height / regionSize);
    
    const regions = [];
    
    for (let ry = 0; ry < regionsY; ry++) {
      for (let rx = 0; rx < regionsX; rx++) {
        // Calculate region boundaries
        const startX = rx * regionSize;
        const startY = ry * regionSize;
        const endX = Math.min(startX + regionSize, width);
        const endY = Math.min(startY + regionSize, height);
        
        // Collect pixel data for this region
        let rSum = 0, gSum = 0, bSum = 0;
        let pixelCount = 0;
        
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const i = (y * width + x) * 4;
            rSum += pixelData[i];
            gSum += pixelData[i + 1];
            bSum += pixelData[i + 2];
            pixelCount++;
          }
        }
        
        // Calculate averages
        const avgR = rSum / pixelCount;
        const avgG = gSum / pixelCount;
        const avgB = bSum / pixelCount;
        
        // Store region data
        regions.push({
          x: rx,
          y: ry,
          r: avgR,
          g: avgG,
          b: avgB,
          brightness: (avgR + avgG + avgB) / 3 / 255,
          hue: rgbToHue(avgR, avgG, avgB),
          saturation: rgbToSaturation(avgR, avgG, avgB)
        });
      }
    }
    
    return {
      regions,
      regionsX,
      regionsY
    };
  };
  
  // RGB to hue conversion helper
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
  
  // RGB to saturation conversion helper
  const rgbToSaturation = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    if (max === min) {
      return 0; // achromatic
    } else {
      const d = max - min;
      return l > 0.5 ? d / (2 - max - min) : d / (max + min);
    }
  };
  
  // Generate waveform data for audio visualization
  const generateWaveformData = (audioBuffer) => {
    const numPoints = 1000; // Number of points in the waveform display
    const channelData = audioBuffer.getChannelData(0); // Use the first channel
    const blockSize = Math.floor(channelData.length / numPoints);
    
    const waveform = [];
    
    for (let i = 0; i < numPoints; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[blockStart + j]);
      }
      
      waveform.push(sum / blockSize);
    }
    
    return waveform;
  };
  
  // Sonification methods
  
  // Convert colors to musical pitches
  const convertColorsToPitches = (colorData, speed, resolution) => {
    const { width, height, grid } = colorData;
    
    // Define a pentatonic scale for more pleasing sonification
    const scale = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
    
    // Create a sequence of notes
    const sequence = [];
    
    // Determine step size based on resolution
    const step = Math.max(1, Math.round(1 / resolution));
    
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const pixel = grid[y][x];
        
        // Map hue to pitch
        const noteIndex = Math.floor(pixel.hue * scale.length);
        const pitch = scale[noteIndex];
        
        // Map brightness to velocity
        const velocity = 0.3 + (pixel.brightness * 0.7);
        
        // Map saturation to note duration
        const baseDuration = 0.2 / speed;
        const duration = baseDuration * (0.5 + pixel.saturation);
        
        // Add note to sequence
        sequence.push({
          pitch,
          velocity,
          duration,
          time: (y * width + x) * (0.1 / speed)
        });
      }
    }
    
    return sequence;
  };
  
  // Convert brightness values to rhythmic patterns
  const convertBrightnessToRhythm = (colorData, speed, resolution) => {
    const { width, height, grid } = colorData;
    
    // Base note
    const basePitch = 'C4';
    
    // Rhythmic variations
    const rhythmPatterns = [
      [0.25, 0.25, 0.5],
      [0.125, 0.125, 0.25, 0.5],
      [0.5, 0.25, 0.25],
      [0.125, 0.125, 0.125, 0.125, 0.5]
    ];
    
    const sequence = [];
    let currentTime = 0;
    
    // Sample the image at resolution-determined intervals
    const step = Math.max(1, Math.round(1 / resolution));
    
    for (let y = 0; y < height; y += step) {
      // Use each row to create a rhythmic phrase
      let rowBrightness = 0;
      
      for (let x = 0; x < width; x += step) {
        rowBrightness += grid[y][x].brightness;
      }
      
      // Average brightness for the row
      rowBrightness /= Math.ceil(width / step);
      
      // Select a rhythm pattern based on brightness
      const patternIndex = Math.floor(rowBrightness * rhythmPatterns.length);
      const pattern = rhythmPatterns[patternIndex];
      
      // Create notes for this pattern
      for (let i = 0; i < pattern.length; i++) {
        const duration = pattern[i] / speed;
        
        // Alternate between octaves for more interest
        const octaveOffset = i % 2 === 0 ? "4" : "3";
        let pitch;
        
        // Use different pitch for accented beats
        if (i === 0) {
          pitch = `E${octaveOffset}`;
        } else if (i === Math.floor(pattern.length / 2)) {
          pitch = `G${octaveOffset}`;
        } else {
          pitch = `C${octaveOffset}`;
        }
        
        // Add note with varying velocity based on position in pattern
        sequence.push({
          pitch,
          velocity: i === 0 ? 0.8 : 0.5,
          duration,
          time: currentTime
        });
        
        currentTime += duration;
      }
    }
    
    return sequence;
  };
  
  // Convert spatial image data to arpeggiated patterns
  const convertSpatialToArpeggio = (colorData, speed, resolution) => {
    const { width, height, grid } = colorData;
    
    // Define chord types based on image characteristics
    const chords = [
      ['C3', 'E3', 'G3', 'C4'], // C major
      ['C3', 'Eb3', 'G3', 'Bb3'], // C minor 7
      ['D3', 'F#3', 'A3', 'D4'], // D major
      ['E3', 'G3', 'B3', 'E4'], // E minor
      ['F3', 'A3', 'C4', 'F4'], // F major
      ['G3', 'B3', 'D4', 'G4'], // G major
      ['A3', 'C4', 'E4', 'A4'], // A minor
      ['B3', 'D4', 'F#4', 'B4'] // B diminished
    ];
    
    const sequence = [];
    let currentTime = 0;
    
    // Step size based on resolution
    const step = Math.max(1, Math.round(1 / resolution));
    
    // Process image in blocks
    for (let y = 0; y < height; y += step * 2) {
      if (y + step >= height) continue;
      
      // Analyze color content of this block
      let blockHue = 0;
      let blockSaturation = 0;
      let blockBrightness = 0;
      let pixelCount = 0;
      
      for (let yOffset = 0; yOffset < step * 2 && y + yOffset < height; yOffset++) {
        for (let x = 0; x < width; x += step) {
          if (grid[y + yOffset] && grid[y + yOffset][x]) {
            blockHue += grid[y + yOffset][x].hue;
            blockSaturation += grid[y + yOffset][x].saturation;
            blockBrightness += grid[y + yOffset][x].brightness;
            pixelCount++;
          }
        }
      }
      
      if (pixelCount === 0) continue;
      
      blockHue /= pixelCount;
      blockSaturation /= pixelCount;
      blockBrightness /= pixelCount;
      
      // Select chord based on hue
      const chordIndex = Math.floor(blockHue * chords.length);
      const chord = chords[chordIndex];
      
      // Determine arpeggio pattern based on saturation
      let pattern;
      if (blockSaturation < 0.33) {
        pattern = [0, 1, 2, 3]; // Ascending
      } else if (blockSaturation < 0.66) {
        pattern = [0, 1, 3, 2]; // Mixed
      } else {
        pattern = [3, 2, 1, 0]; // Descending
      }
      
      // Determine note duration based on brightness
      const baseDuration = 0.2 / speed;
      let noteDuration = baseDuration;
      if (blockBrightness < 0.33) {
        noteDuration = baseDuration * 2; // Slower for darker regions
      } else if (blockBrightness > 0.66) {
        noteDuration = baseDuration * 0.5; // Faster for brighter regions
      }
      
      // Create arpeggio sequence
      for (let i = 0; i < pattern.length; i++) {
        const noteIndex = pattern[i];
        
        sequence.push({
          pitch: chord[noteIndex],
          velocity: 0.4 + (blockBrightness * 0.6),
          duration: noteDuration,
          time: currentTime
        });
        
        currentTime += noteDuration;
      }
      
      // Add a slight pause between arpeggios
      currentTime += noteDuration * 0.5;
    }
    
    return sequence;
  };
  
  // Convert colors to chord progressions
  const convertColorsToChords = (colorData, speed, resolution) => {
    const { width, height, grid } = colorData;
    
    // Define chord types
    const chordTypes = [
      { name: 'major', intervals: [0, 4, 7] },
      { name: 'minor', intervals: [0, 3, 7] },
      { name: 'diminished', intervals: [0, 3, 6] },
      { name: 'augmented', intervals: [0, 4, 8] },
      { name: 'sus4', intervals: [0, 5, 7] },
      { name: 'major7', intervals: [0, 4, 7, 11] },
      { name: 'minor7', intervals: [0, 3, 7, 10] }
    ];
    
    // Define base notes
    const baseNotes = [
      { name: 'C', value: 60 }, // MIDI note number for C4
      { name: 'D', value: 62 },
      { name: 'E', value: 64 },
      { name: 'F', value: 65 },
      { name: 'G', value: 67 },
      { name: 'A', value: 69 },
      { name: 'B', value: 71 }
    ];
    
    const sequence = [];
    let currentTime = 0;
    
    // Sample regions at intervals determined by resolution
    const regionWidth = Math.max(1, Math.floor(width / (10 * resolution)));
    const regionHeight = Math.max(1, Math.floor(height / (4 * resolution)));
    
    for (let y = 0; y < height; y += regionHeight) {
      for (let x = 0; x < width; x += regionWidth) {
        // Calculate average values for this region
        let hueSum = 0;
        let satSum = 0;
        let brightSum = 0;
        let count = 0;
        
        for (let dy = 0; dy < regionHeight && y + dy < height; dy++) {
          for (let dx = 0; dx < regionWidth && x + dx < width; dx++) {
            if (grid[y + dy] && grid[y + dy][x + dx]) {
              hueSum += grid[y + dy][x + dx].hue;
              satSum += grid[y + dy][x + dx].saturation;
              brightSum += grid[y + dy][x + dx].brightness;
              count++;
            }
          }
        }
        
        if (count === 0) continue;
        
        const avgHue = hueSum / count;
        const avgSat = satSum / count;
        const avgBright = brightSum / count;
        
        // Select chord base note based on hue
        const baseNoteIndex = Math.floor(avgHue * baseNotes.length);
        const baseNote = baseNotes[baseNoteIndex];
        
        // Select chord type based on saturation
        const chordTypeIndex = Math.floor(avgSat * chordTypes.length);
        const chordType = chordTypes[chordTypeIndex];
        
        // Determine chord duration based on brightness
        const duration = (1 + avgBright) / speed;
        
        // Build the chord
        const chord = chordType.intervals.map(interval => {
          // Convert MIDI note to frequency
          const midiNote = baseNote.value + interval;
          const pitch = Tone.Frequency(midiNote, "midi").toNote();
          
          return {
            pitch,
            velocity: 0.6 + (avgBright * 0.4),
            duration,
            time: currentTime
          };
        });
        
        // Add chord to sequence
        sequence.push(...chord);
        currentTime += duration;
      }
    }
    
    return sequence;
  };
  
  // Convert video frames to arpeggiated patterns
  const convertFramesToArpeggios = (frameData, speed, resolution) => {
    const sequence = [];
    let currentTime = 0;
    
    // Define chord types based on frame characteristics
    const chords = [
      ['C3', 'E3', 'G3', 'C4'], // C major
      ['C3', 'Eb3', 'G3', 'Bb3'], // C minor 7
      ['D3', 'F#3', 'A3', 'D4'], // D major
      ['E3', 'G3', 'B3', 'E4'], // E minor
      ['F3', 'A3', 'C4', 'F4'], // F major
      ['G3', 'B3', 'D4', 'G4'], // G major
      ['A3', 'C4', 'E4', 'A4'], // A minor
      ['B3', 'D4', 'F#4', 'B4'] // B diminished
    ];
    
    // Process frames at intervals based on resolution
    const frameStep = Math.max(1, Math.floor(frameData.length / (20 * resolution)));
    
    for (let frameIndex = 0; frameIndex < frameData.length; frameIndex += frameStep) {
      const frame = frameData[frameIndex];
      
      // Calculate average values for this frame
      let totalHue = 0;
      let totalSaturation = 0;
      let totalBrightness = 0;
      
      for (const region of frame.regions) {
        totalHue += region.hue;
        totalSaturation += region.saturation;
        totalBrightness += region.brightness;
      }
      
      const avgHue = totalHue / frame.regions.length;
      const avgSaturation = totalSaturation / frame.regions.length;
      const avgBrightness = totalBrightness / frame.regions.length;
      
      // Select chord based on hue
      const chordIndex = Math.floor(avgHue * chords.length);
      const chord = chords[chordIndex];
      
      // Determine pattern based on saturation
      let pattern;
      if (avgSaturation < 0.33) {
        pattern = [0, 1, 2, 3]; // Ascending
      } else if (avgSaturation < 0.66) {
        pattern = [0, 1, 3, 2]; // Mixed
      } else {
        pattern = [3, 2, 1, 0]; // Descending
      }
      
      // Determine note duration based on brightness
      const baseDuration = 0.2 / speed;
      let noteDuration = baseDuration;
      if (avgBrightness < 0.33) {
        noteDuration = baseDuration * 2; // Slower for darker frames
      } else if (avgBrightness > 0.66) {
        noteDuration = baseDuration * 0.5; // Faster for brighter frames
      }
      
      // Create arpeggio sequence
      for (let i = 0; i < pattern.length; i++) {
        const noteIndex = pattern[i];
        
        sequence.push({
          pitch: chord[noteIndex],
          velocity: 0.4 + (avgBrightness * 0.6),
          duration: noteDuration,
          time: currentTime
        });
        
        currentTime += noteDuration;
      }
      
      // Add a slight pause between arpeggios
      currentTime += noteDuration * 0.5;
    }
    
    return sequence;
  };
  
  // Convert motion between frames to musical expression
  const convertMotionToExpression = (frameData, speed, resolution) => {
    // This method would analyze motion between frames to create musical expression
    // For simplicity, we'll implement a basic version based on brightness changes
    
    const sequence = [];
    let currentTime = 0;
    
    // Base notes for the melody
    const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    
    // Process frames at intervals based on resolution
    const frameStep = Math.max(1, Math.floor(frameData.length / (30 * resolution)));
    
    for (let frameIndex = 0; frameIndex < frameData.length - frameStep; frameIndex += frameStep) {
      const currentFrame = frameData[frameIndex];
      const nextFrame = frameData[frameIndex + frameStep];
      
      // Calculate brightness for current and next frame
      let currentBrightness = 0;
      let nextBrightness = 0;
      
      for (let i = 0; i < currentFrame.regions.length; i++) {
        currentBrightness += currentFrame.regions[i].brightness;
      }
      
      for (let i = 0; i < nextFrame.regions.length; i++) {
        nextBrightness += nextFrame.regions[i].brightness;
      }
      
      currentBrightness /= currentFrame.regions.length;
      nextBrightness /= nextFrame.regions.length;
      
      // Calculate motion (brightness change)
      const brightnessDelta = Math.abs(nextBrightness - currentBrightness);
      
      // Select note based on current brightness
      const noteIndex = Math.floor(currentBrightness * scale.length);
      const pitch = scale[noteIndex];
      
      // Motion (brightness change) determines velocity and duration
      const velocity = 0.3 + (brightnessDelta * 5); // More change = louder
      const duration = 0.2 / speed - (brightnessDelta * 0.5); // More change = shorter notes
      
      // Add note to sequence
      sequence.push({
        pitch,
        velocity: Math.min(0.9, Math.max(0.3, velocity)),
        duration: Math.max(0.05, duration),
        time: currentTime
      });
      
      currentTime += duration;
    }
    
    return sequence;
  };
  
  // Convert color evolution across frames to musical phrases
  const convertColorEvolution = (frameData, speed, resolution) => {
    const sequence = [];
    let currentTime = 0;
    
    // Define chord progressions based on color evolution
    const progressions = [
      { name: 'I-IV-V-I', chords: [
        ['C3', 'E3', 'G3'], // C major (I)
        ['F3', 'A3', 'C4'], // F major (IV)
        ['G3', 'B3', 'D4'], // G major (V)
        ['C3', 'E3', 'G3']  // C major (I)
      ]},
      { name: 'I-V-vi-IV', chords: [
        ['C3', 'E3', 'G3'], // C major (I)
        ['G3', 'B3', 'D4'], // G major (V)
        ['A3', 'C4', 'E4'], // A minor (vi)
        ['F3', 'A3', 'C4']  // F major (IV)
      ]},
      { name: 'vi-IV-I-V', chords: [
        ['A3', 'C4', 'E4'], // A minor (vi)
        ['F3', 'A3', 'C4'], // F major (IV)
        ['C3', 'E3', 'G3'], // C major (I)
        ['G3', 'B3', 'D4']  // G major (V)
      ]}
    ];
    
    // Group frames for analysis
    const frameStep = Math.max(1, Math.floor(frameData.length / (10 * resolution)));
    const frameGroups = [];
    
    for (let i = 0; i < frameData.length; i += frameStep) {
      const groupEnd = Math.min(i + frameStep, frameData.length);
      frameGroups.push(frameData.slice(i, groupEnd));
    }
    
    // Process each group of frames
    for (let groupIndex = 0; groupIndex < frameGroups.length; groupIndex++) {
      const group = frameGroups[groupIndex];
      
      // Analyze color characteristics for this group
      let totalHue = 0;
      let totalSaturation = 0;
      let totalBrightness = 0;
      let regionCount = 0;
      
      for (const frame of group) {
        for (const region of frame.regions) {
          totalHue += region.hue;
          totalSaturation += region.saturation;
          totalBrightness += region.brightness;
          regionCount++;
        }
      }
      
      const avgHue = totalHue / regionCount;
      const avgSaturation = totalSaturation / regionCount;
      const avgBrightness = totalBrightness / regionCount;
      
      // Select progression based on hue
      const progressionIndex = Math.floor(avgHue * progressions.length);
      const progression = progressions[progressionIndex];
      
      // Determine chord rhythm based on brightness and saturation
      const baseChordDuration = (1 + avgBrightness) / speed;
      const isStaccato = avgSaturation > 0.7; // High saturation = staccato
      const noteDuration = isStaccato ? baseChordDuration * 0.6 : baseChordDuration * 0.9;
      
      // Create progression sequence
      for (let chordIndex = 0; chordIndex < progression.chords.length; chordIndex++) {
        const chord = progression.chords[chordIndex];
        
        // Calculate momentum (more notes toward the end of the progression)
        const momentum = chordIndex / progression.chords.length;
        const velocity = 0.4 + (avgBrightness * 0.4) + (momentum * 0.2);
        
        // Add chord notes
        for (const pitch of chord) {
          sequence.push({
            pitch,
            velocity,
            duration: noteDuration,
            time: currentTime
          });
        }
        
        currentTime += baseChordDuration;
      }
    }
    
    return sequence;
  };
  
  // Handle playhead interaction
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
  
  // Handle mouse events for playhead dragging
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
  
  // Toggle track expanded/collapsed
  const toggleTrackExpanded = (trackId) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, isExpanded: !track.isExpanded, height: !track.isExpanded ? 120 : 60 } 
        : track
    ));
  };
  
  // Show modal for track settings
  const showTrackModal = (trackId, e) => {
    // Don't show modal if clicking on the expand/collapse control
    if (e.target.closest('.track-controls')) return;
    
    setActiveTrackModal(trackId);
    e.stopPropagation();
  };
  
  // Toggle track mute
  const toggleTrackMute = (trackId) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, muted: !track.muted } 
        : track
    ));
    
    // Update processor if available
    const processor = trackProcessorsRef.current[trackId];
    if (processor) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        if (processor.synth) {
          processor.synth.volume.value = track.muted ? -Infinity : Tone.gainToDb(track.volume);
        } else if (processor.volume) {
          processor.volume.value = track.muted ? -Infinity : Tone.gainToDb(track.volume);
        }
      }
    }
  };
  
  // Update track settings
  const updateTrackSettings = (trackId, settings) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, ...settings } 
        : track
    ));
    
    // Update processor if needed
    const processor = trackProcessorsRef.current[trackId];
    const track = tracks.find(t => t.id === trackId);
    
    if (processor && track) {
      // Update volume
      if (settings.volume !== undefined && processor.synth) {
        processor.synth.volume.value = Tone.gainToDb(settings.volume);
      }
      
      // Update pan
      if (settings.pan !== undefined && processor.panner) {
        processor.panner.pan.value = settings.pan;
      }
      
      // If sonification settings changed, we need to rebuild the processor
      if (settings.sonificationSettings) {
        setupTrackProcessor(trackId, track.mediaId);
      }
    }
  };
  
  // Format time display (seconds to mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Add a new track
  const addTrack = (type) => {
    const newTrack = {
      id: Date.now(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${tracks.filter(t => t.type === type).length + 1}`,
      type,
      mediaId: null,
      isExpanded: true,
      height: 120,
      muted: false,
      solo: false,
      volume: 0.8,
      pan: 0,
      effects: [],
      sonificationSettings: {
        method: type === 'audio' ? 'direct' : type === 'image' ? 'colorToPitch' : 'spatialToArpeggio',
        synthType: 'Synth',
        speed: 1.0,
        resolution: 0.5,
        effectMix: 0.3
      }
    };
    
    setTracks([...tracks, newTrack]);
  };
  
  // Remove a track
  const removeTrack = (trackId) => {
    // Clean up any processor for this track
    if (trackProcessorsRef.current[trackId]) {
      if (trackProcessorsRef.current[trackId].dispose) {
        trackProcessorsRef.current[trackId].dispose();
      }
      delete trackProcessorsRef.current[trackId];
    }
    
    // Remove the track from the list
    setTracks(tracks.filter(track => track.id !== trackId));
  };
  
  // Export the current project
  const exportProject = async () => {
    // In a real implementation, this would use Tone.Offline
    // to render the audio and optionally create a visualization
    
    alert("Export functionality would be implemented here.\nIn a real app, this would render the current composition to an audio file.");
    
    // Example offline rendering with Tone.js
    /*
    const duration = totalDuration;
    
    // Set up offline context
    const offlineContext = new Tone.OfflineContext(2, duration, 44100);
    
    // Recreate all processors in the offline context
    // ...
    
    // Render audio
    const buffer = await offlineContext.render();
    
    // Convert to desired format (e.g., WAV, MP3)
    // ...
    
    // Create download link
    const blob = new Blob([...], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}.wav`;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    */
  };
  
  // Render MelSpectrogram with analyzer node
  const renderMelSpectrogram = (trackId, width = 800, height = 120) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track || !analyzerNodesRef.current[trackId]) {
      return null;
    }
    
    // For implementation, we'd use the MelSpectrogram component with the analyzer
    // Since we don't have direct access to the component here, we'll render a placeholder
    return (
      <div 
        className="bg-black relative" 
        style={{ width: '100%', height: `${height}px` }}
        ref={el => {
          spectrogramCanvasRefs.current[trackId] = el;
        }}
      >
        {/* This would be the actual MelSpectrogram component */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
          Mel Spectrogram Visualization
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col bg-gray-900 text-white min-h-screen">
      {/* Header/Navbar */}
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">DJ Sonification Tool</h1>
          
          <div className="flex items-center gap-4">
            <button 
              className={`px-3 py-1 rounded ${activeTab === 'mixer' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('mixer')}
            >
              Mixer
            </button>
            <button 
              className={`px-3 py-1 rounded ${activeTab === 'sonify' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('sonify')}
            >
              Sonify
            </button>
            <button 
              className={`px-3 py-1 rounded ${activeTab === 'export' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              value={currentProject ? currentProject.id : ''}
              onChange={(e) => {
                const projectId = parseInt(e.target.value);
                const selected = projects.find(p => p.id === projectId);
                if (selected) {
                  setCurrentProject(selected);
                }
              }}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            
            <button
              className="px-3 py-1 bg-green-600 rounded text-sm"
              onClick={createNewProject}
            >
              New Project
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 p-4">
        {activeTab === 'mixer' && (
          <div className="flex flex-col">
            {/* Transport Controls */}
            <div className="bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className={`p-2 rounded-full ${isPlaying ? 'bg-red-600' : 'bg-green-600'}`}
                  onClick={togglePlayback}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                
                <span className="font-mono">
                  {formatTime((playheadPosition / 100) * totalDuration)} / {formatTime(totalDuration)}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>BPM:</span>
                  <input
                    type="number"
                    min="60"
                    max="180"
                    value={currentProject ? currentProject.bpm : 120}
                    onChange={(e) => {
                      const bpm = parseInt(e.target.value);
                      if (currentProject && toneTransportRef.current) {
                        toneTransportRef.current.bpm.value = bpm;
                        setCurrentProject({
                          ...currentProject,
                          bpm
                        });
                      }
                    }}
                    className="bg-gray-700 border border-gray-600 rounded w-16 px-2 py-1"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    className={`px-2 py-1 rounded ${isMasterMuted ? 'bg-red-600' : 'bg-gray-700'}`}
                    onClick={() => setIsMasterMuted(!isMasterMuted)}
                  >
                    {isMasterMuted ? '🔇' : '🔊'}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-32"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span>View:</span>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1"
                  >
                    <option value="individual">Individual</option>
                    <option value="combined">Combined</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Tracks */}
            <div 
              className="bg-gray-800 rounded-lg flex-1 overflow-hidden relative"
              ref={timelineRef}
            >
              {/* Combined view */}
              {viewMode === 'combined' ? (
                <div className="p-2">
                  <h3 className="text-lg font-semibold mb-2">Combined Visualization</h3>
                  <div 
                    className="bg-black h-64 rounded"
                    ref={combinedSpectrogramRef}
                  >
                    {/* This would render the combined mel spectrogram */}
                  </div>
                </div>
              ) : (
                /* Individual track view */
                <div className="flex flex-col">
                  {tracks.map(track => (
                    <div 
                      key={track.id}
                      className={`border-b border-gray-700 relative ${track.isExpanded ? 'flex-1' : ''}`}
                      style={{ height: track.height, minHeight: track.height }}
                      onClick={(e) => showTrackModal(track.id, e)}
                    >
                      <div className="absolute top-0 left-0 bg-gray-800 bg-opacity-70 p-2 z-10 flex items-center track-controls">
                        <span className="font-medium mr-2">{track.name}</span>
                        <button
                          className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded mr-1"
                          onClick={() => toggleTrackExpanded(track.id)}
                        >
                          {track.isExpanded ? '−' : '+'}
                        </button>
                        <button
                          className={`w-6 h-6 flex items-center justify-center rounded mr-1 ${track.muted ? 'bg-red-600' : 'bg-gray-700'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrackMute(track.id);
                          }}
                        >
                          {track.muted ? '🔇' : '🔊'}
                        </button>
                      </div>
                      
                      {/* Track visualization */}
                      {renderMelSpectrogram(track.id, '100%', track.height)}
                      
                      {/* Media info */}
                      {track.mediaId && (
                        <div className="absolute top-0 right-0 bg-gray-800 bg-opacity-70 p-2 z-10 text-xs">
                          {track.type === 'audio' && mediaLibrary.audio.find(a => a.id === track.mediaId)?.name}
                          {track.type === 'image' && mediaLibrary.images.find(i => i.id === track.mediaId)?.name}
                          {track.type === 'video' && mediaLibrary.videos.find(v => v.id === track.mediaId)?.name}
                        </div>
                      )}
                      
                      {/* Track settings modal */}
                      {activeTrackModal === track.id && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg z-20 track-modal" style={{ width: '80%', maxWidth: '500px' }}>
                          <h3 className="text-lg font-bold mb-3">{track.name} Settings</h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm mb-1">Sonification Method</label>
                              <select 
                                className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2"
                                value={track.sonificationSettings.method}
                                onChange={(e) => {
                                  const method = e.target.value;
                                  updateTrackSettings(track.id, {
                                    sonificationSettings: {
                                      ...track.sonificationSettings,
                                      method
                                    }
                                  });
                                }}
                              >
                                {track.type === 'audio' && (
                                  <option value="direct">Direct Audio</option>
                                )}
                                {track.type === 'image' && (
                                  <>
                                    <option value="colorToPitch">Color to Pitch</option>
                                    <option value="brightnessToRhythm">Brightness to Rhythm</option>
                                    <option value="spatialToArpeggio">Spatial to Arpeggio</option>
                                    <option value="colorChords">Color Chords</option>
                                  </>
                                )}
                                {track.type === 'video' && (
                                  <>
                                    <option value="spatialToArpeggio">Spatial to Arpeggio</option>
                                    <option value="motionToExpression">Motion to Expression</option>
                                    <option value="colorEvolution">Color Evolution</option>
                                  </>
                                )}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm mb-1">Synth Type</label>
                              <select 
                                className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2"
                                value={track.sonificationSettings.synthType}
                                onChange={(e) => {
                                  const synthType = e.target.value;
                                  updateTrackSettings(track.id, {
                                    sonificationSettings: {
                                      ...track.sonificationSettings,
                                      synthType
                                    }
                                  });
                                }}
                              >
                                <option value="Synth">Synth</option>
                                <option value="AMSynth">AMSynth</option>
                                <option value="FMSynth">FMSynth</option>
                                <option value="MembraneSynth">MembraneSynth</option>
                                <option value="MetalSynth">MetalSynth</option>
                                <option value="PluckSynth">PluckSynth</option>
                              </select>
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm mb-1">Speed: {track.sonificationSettings.speed.toFixed(1)}x</label>
                              <input 
                                type="range" 
                                className="w-full" 
                                min="0.1" 
                                max="4" 
                                step="0.1" 
                                value={track.sonificationSettings.speed}
                                onChange={(e) => {
                                  const speed = parseFloat(e.target.value);
                                  updateTrackSettings(track.id, {
                                    sonificationSettings: {
                                      ...track.sonificationSettings,
                                      speed
                                    }
                                  });
                                }}
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm mb-1">Resolution: {track.sonificationSettings.resolution.toFixed(2)}</label>
                              <input 
                                type="range" 
                                className="w-full" 
                                min="0.1" 
                                max="1" 
                                step="0.05" 
                                value={track.sonificationSettings.resolution}
                                onChange={(e) => {
                                  const resolution = parseFloat(e.target.value);
                                  updateTrackSettings(track.id, {
                                    sonificationSettings: {
                                      ...track.sonificationSettings,
                                      resolution
                                    }
                                  });
                                }}
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm mb-1">Effect Mix: {(track.sonificationSettings.effectMix * 100).toFixed(0)}%</label>
                              <input 
                                type="range" 
                                className="w-full" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={track.sonificationSettings.effectMix}
                                onChange={(e) => {
                                  const effectMix = parseFloat(e.target.value);
                                  updateTrackSettings(track.id, {
                                    sonificationSettings: {
                                      ...track.sonificationSettings,
                                      effectMix
                                    }
                                  });
                                }}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm mb-1">Volume: {(track.volume * 100).toFixed(0)}%</label>
                              <input 
                                type="range" 
                                className="w-full" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={track.volume}
                                onChange={(e) => {
                                  const volume = parseFloat(e.target.value);
                                  updateTrackSettings(track.id, { volume });
                                }}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm mb-1">Pan: {track.pan.toFixed(1)}</label>
                              <input 
                                type="range" 
                                className="w-full" 
                                min="-1" 
                                max="1" 
                                step="0.1" 
                                value={track.pan}
                                onChange={(e) => {
                                  const pan = parseFloat(e.target.value);
                                  updateTrackSettings(track.id, { pan });
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4 border-t border-gray-700 pt-2">
                            <h4 className="font-medium mb-2">Effects</h4>
                            
                            {/* List existing effects */}
                            {track.effects && track.effects.length > 0 ? (
                              <div className="mb-2">
                                {track.effects.map((effect, index) => (
                                  <div key={index} className="flex justify-between items-center mb-1 bg-gray-700 p-2 rounded">
                                    <span>{effect.type}</span>
                                    <button 
                                      className="text-red-400 text-sm"
                                      onClick={() => {
                                        const newEffects = [...track.effects];
                                        newEffects.splice(index, 1);
                                        updateTrackSettings(track.id, { effects: newEffects });
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 mb-2">No effects added</p>
                            )}
                            
                            {/* Add effect selector */}
                            <div className="flex gap-2">
                              <select 
                                className="bg-gray-700 border border-gray-600 rounded py-1 px-2"
                                defaultValue=""
                              >
                                <option value="" disabled>Add Effect...</option>
                                <option value="reverb">Reverb</option>
                                <option value="delay">Delay</option>
                                <option value="distortion">Distortion</option>
                                <option value="filter">Filter</option>
                              </select>
                              
                              <button 
                                className="px-2 py-1 bg-blue-600 rounded text-sm"
                                onClick={() => {
                                  // In a real implementation, this would add the selected effect
                                  const newEffect = { type: 'reverb', decay: 1.5, wet: 0.5 };
                                  const newEffects = [...(track.effects || []), newEffect];
                                  updateTrackSettings(track.id, { effects: newEffects });
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between mt-4">
                            <button 
                              className="px-3 py-1 bg-red-600 rounded text-sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to remove this track?')) {
                                  removeTrack(track.id);
                                  setActiveTrackModal(null);
                                }
                              }}
                            >
                              Remove Track
                            </button>
                            
                            <div>
                              <button 
                                className="px-3 py-1 bg-green-600 rounded text-sm mr-2"
                                onClick={() => {
                                  // Apply any pending changes
                                  setActiveTrackModal(null);
                                }}
                              >
                                Apply
                              </button>
                              
                              <button 
                                className="px-3 py-1 bg-gray-600 rounded text-sm"
                                onClick={() => setActiveTrackModal(null)}
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Add track button */}
                  <div className="p-2 flex justify-center">
                    <div className="bg-gray-700 rounded p-2 inline-flex gap-2">
                      <button 
                        className="px-3 py-1 bg-blue-600 rounded text-sm"
                        onClick={() => addTrack('audio')}
                      >
                        Add Audio Track
                      </button>
                      <button 
                        className="px-3 py-1 bg-blue-600 rounded text-sm"
                        onClick={() => addTrack('image')}
                      >
                        Add Image Track
                      </button>
                      <button 
                        className="px-3 py-1 bg-blue-600 rounded text-sm"
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
            </div>
            
            {/* Timeline ruler */}
            <div className="h-6 bg-gray-800 rounded-lg mt-2 relative flex items-center px-2">
              <div className="absolute left-0 top-0 bottom-0 flex items-center text-xs px-2">
                {formatTime(0)}
              </div>
              <div className="absolute right-0 top-0 bottom-0 flex items-center text-xs px-2">
                {formatTime(totalDuration)}
              </div>
              <div className="absolute left-1/4 top-0 bottom-0 flex items-center text-xs">
                {formatTime(totalDuration * 0.25)}
              </div>
              <div className="absolute left-1/2 top-0 bottom-0 flex items-center text-xs">
                {formatTime(totalDuration * 0.5)}
              </div>
              <div className="absolute left-3/4 top-0 bottom-0 flex items-center text-xs">
                {formatTime(totalDuration * 0.75)}
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
        
        {activeTab === 'sonify' && (
          <div className="flex gap-4">
            {/* Media Library */}
            <div className="w-1/3 bg-gray-800 p-4 rounded-lg">
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
                  className="px-4 py-2 bg-blue-600 rounded w-full"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  Upload Media
                </button>
              </div>
              
              {/* Media tabs */}
              <div className="flex border-b border-gray-700 mb-2">
                <button 
                  className={`px-3 py-1 ${selectedMedia?.type === 'audio' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setSelectedMedia(mediaLibrary.audio[0] || null)}
                >
                  Audio ({mediaLibrary.audio.length})
                </button>
                <button 
                  className={`px-3 py-1 ${selectedMedia?.type === 'image' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setSelectedMedia(mediaLibrary.images[0] || null)}
                >
                  Images ({mediaLibrary.images.length})
                </button>
                <button 
                  className={`px-3 py-1 ${selectedMedia?.type === 'video' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setSelectedMedia(mediaLibrary.videos[0] || null)}
                >
                  Videos ({mediaLibrary.videos.length})
                </button>
              </div>
              
              {/* Media list */}
              <div className="h-96 overflow-y-auto">
                {selectedMedia?.type === 'audio' && (
                  <div>
                    {mediaLibrary.audio.length === 0 ? (
                      <p className="text-gray-400 text-center p-4">No audio files uploaded</p>
                    ) : (
                      <ul className="divide-y divide-gray-700">
                        {mediaLibrary.audio.map(audio => (
                          <li 
                            key={audio.id}
                            className="py-2 px-1 hover:bg-gray-700 cursor-pointer rounded"
                            onClick={() => setSelectedMedia(audio)}
                          >
                            <div className="flex justify-between items-center">
                              <span>{audio.name}</span>
                              <span className="text-xs text-gray-400">{formatTime(audio.duration)}</span>
                            </div>
                            
                            {/* Waveform preview */}
                            <div className="h-10 bg-gray-900 mt-1 rounded overflow-hidden relative">
                              {audio.waveform && (
                                <div className="absolute inset-0 flex items-center">
                                  {audio.waveform.map((value, i) => (
                                    <div
                                      key={i}
                                      className="bg-blue-500"
                                      style={{
                                        height: `${value * 100}%`,
                                        width: 1,
                                        marginRight: 1
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {selectedMedia?.type === 'image' && (
                  <div>
                    {mediaLibrary.images.length === 0 ? (
                      <p className="text-gray-400 text-center p-4">No images uploaded</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {mediaLibrary.images.map(image => (
                          <div 
                            key={image.id}
                            className={`p-1 hover:bg-gray-700 cursor-pointer rounded ${selectedMedia?.id === image.id ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setSelectedMedia(image)}
                          >
                            <img 
                              src={image.url} 
                              alt={image.name}
                              className="w-full h-32 object-contain bg-black rounded" 
                            />
                            <div className="text-xs mt-1 truncate">{image.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedMedia?.type === 'video' && (
                  <div>
                    {mediaLibrary.videos.length === 0 ? (
                      <p className="text-gray-400 text-center p-4">No videos uploaded</p>
                    ) : (
                      <ul className="space-y-2">
                        {mediaLibrary.videos.map(video => (
                          <li 
                            key={video.id}
                            className={`p-2 hover:bg-gray-700 cursor-pointer rounded ${selectedMedia?.id === video.id ? 'bg-gray-700' : ''}`}
                            onClick={() => setSelectedMedia(video)}
                          >
                            <div className="mb-1">{video.name}</div>
                            <video 
                              src={video.url}
                              className="w-full h-32 object-contain bg-black rounded"
                              controls
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>{video.width}x{video.height}</span>
                              <span>{formatTime(video.duration)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Media Preview & Sonification Controls */}
            <div className="w-2/3 bg-gray-800 p-4 rounded-lg">
              {selectedMedia ? (
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    {selectedMedia.name}
                  </h2>
                  
                  {/* Media preview */}
                  <div className="mb-4">
                    {selectedMedia.type === 'audio' && (
                      <div>
                        <audio 
                          src={selectedMedia.url} 
                          controls
                          className="w-full mb-2"
                        />
                        
                        {/* Waveform display */}
                        <div className="h-24 bg-gray-900 rounded overflow-hidden relative">
                          {selectedMedia.waveform && (
                            <div className="absolute inset-0 flex items-center">
                              {selectedMedia.waveform.map((value, i) => (
                                <div
                                  key={i}
                                  className="bg-blue-500"
                                  style={{
                                    height: `${value * 100}%`,
                                    width: 2,
                                    marginRight: 1
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedMedia.type === 'image' && (
                      <div className="flex justify-center bg-black p-4 rounded">
                        <img 
                          src={selectedMedia.url}
                          alt={selectedMedia.name}
                          className="max-h-64 object-contain"
                        />
                      </div>
                    )}
                    
                    {selectedMedia.type === 'video' && (
                      <div className="flex justify-center bg-black p-4 rounded">
                        <video 
                          src={selectedMedia.url}
                          controls
                          className="max-h-64"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Sonification controls */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Sonification Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Method</label>
                        <select className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2">
                          {selectedMedia.type === 'audio' && (
                            <option value="direct">Direct Audio</option>
                          )}
                          {selectedMedia.type === 'image' && (
                            <>
                              <option value="colorToPitch">Color to Pitch</option>
                              <option value="brightnessToRhythm">Brightness to Rhythm</option>
                              <option value="spatialToArpeggio">Spatial to Arpeggio</option>
                              <option value="colorChords">Color Chords</option>
                            </>
                          )}
                          {selectedMedia.type === 'video' && (
                            <>
                              <option value="spatialToArpeggio">Spatial to Arpeggio</option>
                              <option value="motionToExpression">Motion to Expression</option>
                              <option value="colorEvolution">Color Evolution</option>
                            </>
                          )}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Synth Type</label>
                        <select className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2">
                          <option>Synth</option>
                          <option>AMSynth</option>
                          <option>FMSynth</option>
                          <option>MembraneSynth</option>
                          <option>MetalSynth</option>
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
                    
                    <div className="flex justify-between mt-6">
                      <button className="px-4 py-2 bg-blue-600 rounded">
                        Preview Sonification
                      </button>
                      
                      <button 
                        className="px-4 py-2 bg-green-600 rounded"
                        onClick={() => {
                          // Add this media to an appropriate track
                          const trackType = selectedMedia.type;
                          const availableTracks = tracks.filter(t => t.type === trackType);
                          
                          if (availableTracks.length > 0) {
                            // Find first empty track or use the first track
                            const track = availableTracks.find(t => t.mediaId === null) || availableTracks[0];
                            assignMediaToTrack(track.id, selectedMedia.id);
                            
                            // Switch to mixer tab
                            setActiveTab('mixer');
                          } else {
                            // No appropriate tracks, create one
                            const newTrack = {
                              id: Date.now(),
                              name: `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track ${tracks.filter(t => t.type === trackType).length + 1}`,
                              type: trackType,
                              mediaId: selectedMedia.id,
                              isExpanded: true,
                              height: 120,
                              muted: false,
                              solo: false,
                              volume: 0.8,
                              pan: 0,
                              effects: [],
                              sonificationSettings: {
                                method: trackType === 'audio' ? 'direct' : trackType === 'image' ? 'colorToPitch' : 'spatialToArpeggio',
                                synthType: 'Synth',
                                speed: 1.0,
                                resolution: 0.5,
                                effectMix: 0.3
                              }
                            };
                            
                            setTracks([...tracks, newTrack]);
                            
                            // Set up processor
                            setupTrackProcessor(newTrack.id, selectedMedia.id);
                            
                            // Switch to mixer tab
                            setActiveTab('mixer');
                          }
                        }}
                      >
                        Add to Project
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xl text-gray-400">
                    Select a media file from the library to preview and sonify
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'export' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Export Project</h2>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
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
                      <option value="wav">WAV</option>
                      <option value="ogg">OGG</option>
                      <option value="flac">FLAC</option>
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
                </div>
              </div>
              
              <div>
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
                      <option>MP4</option>
                      <option>WebM</option>
                      <option>GIF (Animation)</option>
                    </select>
                  </div>
                  
                  <div className={!exportSettings.includeVisuals ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm mb-1">Resolution</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3">
                      <option>720p</option>
                      <option>1080p</option>
                      <option>1440p</option>
                      <option>4K</option>
                    </select>
                  </div>
                  
                  <div className={!exportSettings.includeVisuals ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm mb-1">Frame Rate</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3">
                      <option>24 fps</option>
                      <option>30 fps</option>
                      <option>60 fps</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Project Name</label>
                  <input 
                    type="text"
                    className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                    value={currentProject ? currentProject.name : ''}
                    onChange={(e) => {
                      if (currentProject) {
                        setCurrentProject({
                          ...currentProject,
                          name: e.target.value
                        });
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Artist Name</label>
                  <input 
                    type="text"
                    className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3"
                    placeholder="Your name or alias"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 h-24"
                    placeholder="Add project notes or description"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                className="px-8 py-3 bg-green-600 rounded-lg text-lg font-bold"
                onClick={exportProject}
              >
                Export Project
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DJSonificationTool;