import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const ImageSonificationDJMixer = () => {
  // State management
  const [tracks, setTracks] = useState([]);
  const [sourceImages, setSourceImages] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10); // Duration in seconds
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [savedSets, setSavedSets] = useState([]);
  const [currentSetName, setCurrentSetName] = useState("");
  const [mixerMode, setMixerMode] = useState("tracks"); // "tracks" or "fx"
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showingTimeline, setShowingTimeline] = useState(true);
  
  // Refs
  const imageCanvasRef = useRef(null);
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const transportRef = useRef(null);
  const synthsRef = useRef({});
  const trackSchedulesRef = useRef({});
  
  // Initialize Tone.js
  useEffect(() => {
    try {
      // Initialize transport timeline
      transportRef.current = Tone.Transport;
      transportRef.current.bpm.value = 120;
      
      // Load saved sessions from localStorage if available
      const savedSessionsData = localStorage.getItem('sonificationSessions');
      if (savedSessionsData) {
        try {
          const parsedData = JSON.parse(savedSessionsData);
          setSavedSets(parsedData);
        } catch (e) {
          console.error("Error loading saved sessions:", e);
        }
      }
      
      // Clean up on unmount
      return () => {
        cleanupAllTracks();
      };
    } catch (err) {
      console.error("Error initializing audio system:", err);
    }
  }, []);
  
  const cleanupAllTracks = () => {
    // Stop transport
    if (transportRef.current) {
      transportRef.current.stop();
      transportRef.current.cancel();
    }
    
    // Dispose all synths
    Object.values(synthsRef.current).forEach(synthInfo => {
      if (synthInfo && synthInfo.synth && typeof synthInfo.synth.dispose === 'function') {
        synthInfo.synth.dispose();
      }
      if (synthInfo && synthInfo.effect && typeof synthInfo.effect.dispose === 'function') {
        synthInfo.effect.dispose();
      }
    });
    
    // Clear ref
    synthsRef.current = {};
    trackSchedulesRef.current = {};
  };
  
  // Handle timeline animation
  useEffect(() => {
    if (isPlaying) {
      const updateTime = () => {
        setCurrentTime(transportRef.current.seconds);
        
        // Check if we've reached the end
        if (transportRef.current.seconds >= duration) {
          transportRef.current.pause();
          setIsPlaying(false);
          return;
        }
        
        animationRef.current = requestAnimationFrame(updateTime);
      };
      
      animationRef.current = requestAnimationFrame(updateTime);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration]);
  
  // Start/stop playback
  const togglePlayback = async () => {
    try {
      // Initialize audio context if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      if (isPlaying) {
        transportRef.current.pause();
        setIsPlaying(false);
      } else {
        // If we're at the end, restart
        if (currentTime >= duration) {
          transportRef.current.seconds = 0;
          setCurrentTime(0);
        }
        
        // Make sure all tracks are properly scheduled
        tracks.forEach(track => {
          if (!trackSchedulesRef.current[track.id]) {
            scheduleTrackEvents(track.id, track);
          }
        });
        
        transportRef.current.start();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error toggling playback:", err);
    }
  };
  
  // Reset playback to beginning
  const resetPlayback = () => {
    transportRef.current.stop();
    transportRef.current.seconds = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };
  
  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        processImage(img, file.name);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  // Capture from webcam
  const captureFromWebcam = () => {
    const video = videoRef.current;
    const canvas = imageCanvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      // Match canvas size to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Draw the current video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to image and process
      const dataUrl = canvas.toDataURL('image/png');
      const img = new Image();
      img.onload = () => {
        processImage(img, "Webcam Capture " + new Date().toLocaleTimeString());
      };
      img.src = dataUrl;
    }
  };
  
  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = 'block';
        if (imageCanvasRef.current) {
          imageCanvasRef.current.style.display = 'none';
        }
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access webcam. Please check permissions.");
    }
  };
  
  // Stop webcam
  const stopWebcam = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
      video.style.display = 'none';
      if (imageCanvasRef.current) {
        imageCanvasRef.current.style.display = 'block';
      }
    }
  };
  
  // Process image and extract data
  const processImage = (img, imageName) => {
    const canvas = imageCanvasRef.current;
    const context = canvas.getContext('2d');
    
    // Size canvas to match image (with max dimensions for performance)
    const maxDim = 400;
    let width = img.width;
    let height = img.height;
    
    if (width > height && width > maxDim) {
      height = (height / width) * maxDim;
      width = maxDim;
    } else if (height > width && height > maxDim) {
      width = (width / height) * maxDim;
      height = maxDim;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image to canvas (resized)
    context.drawImage(img, 0, 0, width, height);
    canvas.style.display = 'block';
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
    
    // Get image data (efficiently in chunks for memory)
    const chunkSize = 25; // Process in 25px chunks
    const imageData = [];
    
    for (let y = 0; y < height; y += chunkSize) {
      for (let x = 0; x < width; x += chunkSize) {
        const chunkWidth = Math.min(chunkSize, width - x);
        const chunkHeight = Math.min(chunkSize, height - y);
        const data = context.getImageData(x, y, chunkWidth, chunkHeight).data;
        
        // Calculate average color and brightness for this chunk
        let r = 0, g = 0, b = 0, brightness = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          // Calculate perceived brightness
          brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          pixelCount++;
        }
        
        // Average values
        r /= pixelCount;
        g /= pixelCount;
        b /= pixelCount;
        brightness /= pixelCount;
        
        // Calculate normalized position
        const normalizedX = x / width;
        const normalizedY = y / height;
        
        // Store chunk data
        imageData.push({
          x: normalizedX,
          y: normalizedY,
          r, g, b,
          brightness: brightness / 255, // Normalize to 0-1
          hue: rgbToHue(r, g, b) / 360 // Normalize to 0-1
        });
      }
    }
    
    // Create a unique ID for the image
    const imageId = Date.now().toString();
    
    // Store image data with preview URL
    const newImage = {
      id: imageId,
      name: imageName || `Image ${sourceImages.length + 1}`,
      data: imageData,
      previewUrl: canvas.toDataURL('image/jpeg', 0.5) // Store a compressed preview
    };
    
    // Add to sources and select it
    setSourceImages(prev => [...prev, newImage]);
    setSelectedImage(newImage);
    
    // Create a default track from this image
    createTrack(imageId, imageName);
  };
  
  // RGB to Hue conversion
  const rgbToHue = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    
    if (max === min) {
      return 0; // achromatic
    }
    
    const d = max - min;
    
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else if (max === b) {
      h = (r - g) / d + 4;
    }
    
    return h * 60;
  };
  
  // Create a new sonification track
  const createTrack = (imageId, name, customSettings = {}) => {
    // Find the source image
    const sourceImage = sourceImages.find(img => img.id === imageId) || 
                       sourceImages[sourceImages.length - 1];
    
    if (!sourceImage) {
      console.error("No source image found for track creation");
      return;
    }
    
    // Create a unique ID for the track
    const trackId = `track_${Date.now()}`;
    
    // Set up sonification method - default color to pitch mapping with custom overrides
    const trackConfig = {
      id: trackId,
      name: customSettings.name || `${name || sourceImage.name} Track ${tracks.length + 1}`,
      imageId: sourceImage.id,
      method: customSettings.method || 'colorToPitch',
      volume: customSettings.volume || 0.8,
      synthType: customSettings.synthType || 'AMSynth',
      parameters: {
        speed: customSettings.speed || 1,
        resolution: customSettings.resolution || 0.5,
        pitchRange: customSettings.pitchRange || [220, 880], // A3 to A5
        attack: customSettings.attack || 0.01,
        release: customSettings.release || 0.3,
        filterQ: customSettings.filterQ || 5,
        effect: customSettings.effect || 'reverb',
        effectMix: customSettings.effectMix || 0.3,
        startTime: customSettings.startTime || 0, // Position in timeline
        endTime: customSettings.endTime || duration // End time in timeline
      },
      isActive: true,
      isMuted: false,
      isSoloed: false,
      color: customSettings.color || generateRandomColor()
    };
    
    // Create and setup synth
    setupTrackSynth(trackId, trackConfig);
    
    // Add track to state
    setTracks(prevTracks => [...prevTracks, trackConfig]);
    setSelectedTrack(trackConfig);
    
    return trackConfig;
  };
  
  // Generate a random color for track visualization
  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  // Duplicate an existing track
  const duplicateTrack = (trackId) => {
    const sourceTrack = tracks.find(t => t.id === trackId);
    if (!sourceTrack) return;
    
    // Create a copy with a new ID and slightly different name
    const newTrack = createTrack(
      sourceTrack.imageId,
      `${sourceTrack.name} Copy`,
      {
        ...sourceTrack.parameters,
        method: sourceTrack.method,
        synthType: sourceTrack.synthType,
        volume: sourceTrack.volume
      }
    );
    
    return newTrack;
  };
  
  // Setup synth for a track
  const setupTrackSynth = (trackId, trackConfig) => {
    try {
      // Clean up any existing synth
      if (synthsRef.current[trackId]) {
        const existing = synthsRef.current[trackId];
        if (existing.synth && typeof existing.synth.dispose === 'function') {
          existing.synth.dispose();
        }
        if (existing.effect && typeof existing.effect.dispose === 'function') {
          existing.effect.dispose();
        }
      }
      
      // Create effects chain
      const effectsConfig = {
        reverb: new Tone.Reverb({
          decay: 2,
          wet: trackConfig.parameters.effectMix
        }).toDestination(),
        delay: new Tone.FeedbackDelay({
          delayTime: 0.25,
          feedback: 0.3,
          wet: trackConfig.parameters.effectMix
        }).toDestination(),
        distortion: new Tone.Distortion({
          distortion: 0.4,
          wet: trackConfig.parameters.effectMix
        }).toDestination(),
        none: new Tone.Volume(0).toDestination()
      };
      
      // Choose effect from config
      const effect = effectsConfig[trackConfig.parameters.effect] || effectsConfig.none;
      
      // Create synth based on chosen type
      let synth;
      
      switch (trackConfig.synthType) {
        case 'FMSynth':
          synth = new Tone.FMSynth().connect(effect);
          break;
        case 'AMSynth':
          synth = new Tone.AMSynth().connect(effect);
          break;
        case 'MembraneSynth':
          synth = new Tone.MembraneSynth().connect(effect);
          break;
        case 'PluckSynth':
          synth = new Tone.PluckSynth().connect(effect);
          break;
        default:
          synth = new Tone.Synth().connect(effect);
      }
      
      // Set synth volume
      synth.volume.value = Tone.gainToDb(trackConfig.volume);
      
      // Store synth in ref
      synthsRef.current[trackId] = {
        synth,
        effect
      };
      
      // Schedule sonification events
      scheduleTrackEvents(trackId, trackConfig);
    } catch (err) {
      console.error("Error setting up track synth:", err);
    }
  };
  
  // Schedule sonification events for a track
  const scheduleTrackEvents = (trackId, trackConfig) => {
    try {
      // Find the source image data
      const sourceImage = sourceImages.find(img => img.id === trackConfig.imageId);
      if (!sourceImage) return;
      
      const { data: imageData } = sourceImage;
      const { parameters } = trackConfig;
      const { pitchRange, speed, startTime, endTime } = parameters;
      
      // Clear any previous events for this track
      if (trackSchedulesRef.current[trackId]) {
        trackSchedulesRef.current[trackId].forEach(id => {
          transportRef.current.clear(id);
        });
      }
      
      // Array to store event IDs
      const eventIds = [];
      
      // Track duration is end time - start time
      const trackDuration = endTime - startTime;
      
      // Compute event density based on image data and resolution
      const totalEvents = Math.ceil(imageData.length * parameters.resolution);
      
      // Schedule events based on sonification method
      switch (trackConfig.method) {
        case 'colorToPitch': {
          imageData.forEach((pixel, index) => {
            // Skip based on resolution
            if (index % Math.round(1 / parameters.resolution) !== 0) return;
            
            // Calculate time in the timeline
            const relativeTime = (index / imageData.length) * trackDuration / speed;
            const absoluteTime = startTime + relativeTime;
            
            // Skip if outside track bounds
            if (absoluteTime > endTime) return;
            
            // Map hue to pitch between range
            const pitch = pitchRange[0] + pixel.hue * (pitchRange[1] - pitchRange[0]);
            
            // Map brightness to velocity
            const velocity = 0.3 + pixel.brightness * 0.7;
            
            // Schedule note
            const eventId = transportRef.current.schedule((time) => {
              const trackSynth = synthsRef.current[trackId];
              if (trackSynth && trackConfig.isActive && !trackConfig.isMuted) {
                trackSynth.synth.triggerAttackRelease(
                  pitch, 
                  parameters.attack + parameters.release, 
                  undefined, 
                  velocity
                );
              }
            }, absoluteTime);
            
            eventIds.push(eventId);
          });
          break;
        }
        
        case 'brightnessToRhythm': {
          const rhythmThresholds = [0.2, 0.4, 0.6, 0.8];
          const pitches = ['C3', 'E3', 'G3', 'B3', 'C4'];
          
          imageData.forEach((pixel, index) => {
            // Skip based on resolution
            if (index % Math.round(1 / parameters.resolution) !== 0) return;
            
            // Calculate time in the timeline
            const relativeTime = (index / imageData.length) * trackDuration / speed;
            const absoluteTime = startTime + relativeTime;
            
            // Skip if outside track bounds
            if (absoluteTime > endTime) return;
            
            // Determine if we trigger based on brightness thresholds
            const thresholdIndex = rhythmThresholds.findIndex(t => pixel.brightness <= t);
            if (thresholdIndex >= 0) {
              const pitch = pitches[thresholdIndex];
              const velocity = 0.3 + pixel.brightness * 0.7;
              
              const eventId = transportRef.current.schedule((time) => {
                const trackSynth = synthsRef.current[trackId];
                if (trackSynth && trackConfig.isActive && !trackConfig.isMuted) {
                  trackSynth.synth.triggerAttackRelease(
                    pitch,
                    parameters.attack + parameters.release,
                    undefined,
                    velocity
                  );
                }
              }, absoluteTime);
              
              eventIds.push(eventId);
            }
          });
          break;
        }
        
        case 'spatialToArpeggio': {
          // Group pixels by their y-position (row)
          const rows = {};
          imageData.forEach(pixel => {
            const rowKey = Math.floor(pixel.y * 10) / 10; // Group by normalized rows
            if (!rows[rowKey]) rows[rowKey] = [];
            rows[rowKey].push(pixel);
          });
          
          // Create arpeggios for each row
          Object.entries(rows).forEach(([rowKey, pixels], rowIndex) => {
            // Sort pixels by x position for a left-to-right sweep
            pixels.sort((a, b) => a.x - b.x);
            
            // Map row to a chord (could be more sophisticated)
            const baseNote = 48 + (rowIndex * 5); // MIDI note value
            const chord = [baseNote, baseNote + 4, baseNote + 7]; // Major triad
            
            // Schedule notes
            pixels.forEach((pixel, pixelIndex) => {
              // Skip based on resolution
              if (pixelIndex % Math.round(1 / parameters.resolution) !== 0) return;
              
              // Calculate relative time within the track
              const rowOffset = rowIndex * 0.5;
              const pixelPosition = pixelIndex / pixels.length * 1.5;
              const relativeTime = (rowOffset + pixelPosition) * trackDuration / speed;
              const absoluteTime = startTime + relativeTime;
              
              // Skip if outside track bounds
              if (absoluteTime > endTime) return;
              
              const noteIndex = pixelIndex % chord.length;
              const note = Tone.Frequency(chord[noteIndex], "midi");
              const velocity = 0.3 + pixel.brightness * 0.7;
              
              const eventId = transportRef.current.schedule((time) => {
                const trackSynth = synthsRef.current[trackId];
                if (trackSynth && trackConfig.isActive && !trackConfig.isMuted) {
                  trackSynth.synth.triggerAttackRelease(
                    note,
                    parameters.attack + parameters.release,
                    undefined,
                    velocity
                  );
                }
              }, absoluteTime);
              
              eventIds.push(eventId);
            });
          });
          break;
        }
        
        case 'colorChords': {
          // Group pixels by hue ranges
          const hueRanges = [0, 0.2, 0.4, 0.6, 0.8];
          const chordTypes = [
            [0, 4, 7], // Major
            [0, 3, 7], // Minor
            [0, 4, 7, 11], // Major 7th
            [0, 3, 7, 10], // Minor 7th
            [0, 4, 8] // Augmented
          ];
          
          // Rootnote is based on the average brightness
          const avgBrightness = imageData.reduce((sum, pixel) => sum + pixel.brightness, 0) / imageData.length;
          const rootNote = 36 + Math.floor(avgBrightness * 24); // Range from C2 to C4
          
          imageData.forEach((pixel, index) => {
            // Skip based on resolution
            if (index % Math.round(1 / parameters.resolution) !== 0) return;
            
            // Calculate time in the timeline
            const relativeTime = (index / imageData.length) * trackDuration / speed;
            const absoluteTime = startTime + relativeTime;
            
            // Skip if outside track bounds
            if (absoluteTime > endTime) return;
            
            // Select chord based on hue
            const hueIndex = hueRanges.findIndex(h => pixel.hue <= h + 0.2);
            if (hueIndex >= 0) {
              const chordType = chordTypes[Math.min(hueIndex, chordTypes.length - 1)];
              
              // Create chord notes from the chord type
              const chord = chordType.map(interval => Tone.Frequency(rootNote + interval, "midi"));
              
              const velocity = 0.3 + pixel.brightness * 0.7;
              
              // Randomize whether to play full chord or arpeggio
              const isArpeggio = index % 3 === 0;
              
              if (isArpeggio) {
                // Play arpeggio
                chord.forEach((note, noteIndex) => {
                  const noteDelay = noteIndex * 0.1;
                  const eventId = transportRef.current.schedule((time) => {
                    const trackSynth = synthsRef.current[trackId];
                    if (trackSynth && trackConfig.isActive && !trackConfig.isMuted) {
                      trackSynth.synth.triggerAttackRelease(
                        note,
                        parameters.attack + parameters.release,
                        undefined,
                        velocity
                      );
                    }
                  }, absoluteTime + noteDelay);
                  
                  eventIds.push(eventId);
                });
              } else {
                // Play as chord - select one note
                const note = chord[index % chord.length];
                const eventId = transportRef.current.schedule((time) => {
                  const trackSynth = synthsRef.current[trackId];
                  if (trackSynth && trackConfig.isActive && !trackConfig.isMuted) {
                    trackSynth.synth.triggerAttackRelease(
                      note,
                      parameters.attack + parameters.release,
                      undefined,
                      velocity
                    );
                  }
                }, absoluteTime);
                
                eventIds.push(eventId);
              }
            }
          });
          break;
        }
      }
      
      // Store event IDs for later cleanup
      trackSchedulesRef.current[trackId] = eventIds;
      
    } catch (err) {
      console.error("Error scheduling track events:", err);
    }
  };
  
  // Update track parameters
  const updateTrackParameters = (trackId, paramName, value) => {
    try {
      setTracks(prevTracks => {
        const updatedTracks = prevTracks.map(track => {
          if (track.id === trackId) {
            // Update the specific parameter
            const updatedTrack = {
              ...track,
              parameters: {
                ...track.parameters,
                [paramName]: value
              }
            };
            
            return updatedTrack;
          }
          return track;
        });
        
        return updatedTracks;
      });
      
      // Find the updated track
      setTimeout(() => {
        const updatedTrack = tracks.find(t => t.id === trackId);
        if (updatedTrack) {
          // Reschedule track events with new parameters
          scheduleTrackEvents(trackId, updatedTrack);
        }
      }, 10);
    } catch (err) {
      console.error("Error updating track parameters:", err);
    }
  };
  
  // Change track sonification method
  const changeTrackMethod = (trackId, method) => {
    try {
      setTracks(prevTracks => {
        const updatedTracks = prevTracks.map(track => {
          if (track.id === trackId) {
            const updatedTrack = {
              ...track,
              method
            };
            
            return updatedTrack;
          }
          return track;
        });
        
        return updatedTracks;
      });
      
      // Find the updated track
      setTimeout(() => {
        const updatedTrack = tracks.find(t => t.id === trackId);
        if (updatedTrack) {
          // Reschedule track events with new method
          scheduleTrackEvents(trackId, updatedTrack);
        }
      }, 10);
    } catch (err) {
      console.error("Error changing track method:", err);
    }
  };
  
  // Change track synth type
  const changeTrackSynth = (trackId, synthType) => {
    try {
      setTracks(prevTracks => {
        const updatedTracks = prevTracks.map(track => {
          if (track.id === trackId) {
            const updatedTrack = {
              ...track,
              synthType
            };
            
            return updatedTrack;
          }
          return track;
        });
        
        return updatedTracks;
      });
      
      // Find the updated track
      setTimeout(() => {
        const updatedTrack = tracks.find(t => t.id === trackId);
        if (updatedTrack) {
          // Setup new synth
          setupTrackSynth(trackId, updatedTrack);
        }
      }, 10);
    } catch (err) {
      console.error("Error changing track synth:", err);
    }
  };
  
  // Toggle track mute
  const toggleTrackMute = (trackId) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId ? { ...track, isMuted: !track.isMuted } : track
      )
    );
  };
  
  // Toggle track solo
  const toggleTrackSolo = (trackId) => {
    setTracks(prevTracks => {
      // First update the soloed state of the current track
      const intermediate = prevTracks.map(track => 
        track.id === trackId ? { ...track, isSoloed: !track.isSoloed } : track
      );
      
      // If any track is soloed, only soloed tracks should play
      const hasSoloedTrack = intermediate.some(track => track.isSoloed);
      
      return intermediate.map(track => ({
        ...track,
        isActive: hasSoloedTrack ? track.isSoloed : true
      }));
    });
  };
  
  // Set track volume
  const setTrackVolume = (trackId, volume) => {
    try {
      // Update track state
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === trackId ? { ...track, volume } : track
        )
      );
      
      // Update synth volume directly
      if (synthsRef.current[trackId] && synthsRef.current[trackId].synth) {
        synthsRef.current[trackId].synth.volume.value = Tone.gainToDb(volume);
      }
    } catch (err) {
      console.error("Error setting track volume:", err);
    }
  };
  
  // Delete a track
  const deleteTrack = (trackId) => {
    try {
      // Remove scheduled events
      if (trackSchedulesRef.current[trackId]) {
        trackSchedulesRef.current[trackId].forEach(id => {
          transportRef.current.clear(id);
        });
        delete trackSchedulesRef.current[trackId];
      }
      
      // Dispose synth
      if (synthsRef.current[trackId]) {
        if (synthsRef.current[trackId].synth) {
          synthsRef.current[trackId].synth.dispose();
        }
        if (synthsRef.current[trackId].effect) {
          synthsRef.current[trackId].effect.dispose();
        }
        delete synthsRef.current[trackId];
      }
      
      // Remove from state
      setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
      
      // If selected track is deleted, clear selection
      if (selectedTrack && selectedTrack.id === trackId) {
        setSelectedTrack(null);
      }
    } catch (err) {
      console.error("Error deleting track:", err);
    }
  };
  
  // Delete a source image
  const deleteSourceImage = (imageId) => {
    try {
      // Delete all tracks that use this image
      const tracksToDelete = tracks.filter(track => track.imageId === imageId);
      tracksToDelete.forEach(track => {
        deleteTrack(track.id);
      });
      
      // Remove image from sources
      setSourceImages(prev => prev.filter(img => img.id !== imageId));
      
      // If selected image is deleted, clear selection
      if (selectedImage && selectedImage.id === imageId) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Error deleting source image:", err);
    }
  };
  
  // Create track from existing image
  const createTrackFromExistingImage = (imageId) => {
    // Find the source image
    const sourceImage = sourceImages.find(img => img.id === imageId);
    if (!sourceImage) return;
    
    // Create a new track with this image
    createTrack(imageId, sourceImage.name);
  };
  
  // Save current state to local storage
  const saveCurrentState = () => {
    try {
      if (!currentSetName) {
        alert("Please enter a name for this set");
        return;
      }
      
      // Prepare set data (omit image data to save space)
      const setData = {
        id: Date.now().toString(),
        name: currentSetName,
        date: new Date().toISOString(),
        tracks: tracks.map(track => ({
          ...track,
          // Keep reference to image but don't duplicate the data
          imageId: track.imageId
        })),
        images: sourceImages.map(img => ({
          id: img.id,
          name: img.name,
          previewUrl: img.previewUrl,
          // Include data for proper reloading
          data: img.data
        })),
        duration
      };
      
      // Add to saved sets
      const updatedSets = [...savedSets, setData];
      setSavedSets(updatedSets);
      
      // Save to localStorage
      localStorage.setItem('sonificationSessions', JSON.stringify(updatedSets));
      
      alert(`Set "${currentSetName}" saved successfully`);
    } catch (err) {
      console.error("Error saving state:", err);
      alert("Error saving state. Please try again.");
    }
  };
  
  // Load a saved set
  const loadSavedSet = (setId) => {
    try {
      const setToLoad = savedSets.find(set => set.id === setId);
      if (!setToLoad) return;
      
      // Confirm if current state will be lost
      if (tracks.length > 0 && !confirm("Loading this set will replace your current work. Continue?")) {
        return;
      }
      
      // Clean up current state
      cleanupAllTracks();
      
      // Set duration
      setDuration(setToLoad.duration || 10);
      
      // Load images
      setSourceImages(setToLoad.images || []);
      
      // Load tracks (without creating duplicates)
      setTracks([]);
      setTimeout(() => {
        if (setToLoad.tracks && setToLoad.tracks.length > 0) {
          // Create tracks in the correct order
          const newTracks = setToLoad.tracks.map(track => {
            // Create a new track with saved parameters
            return {
              ...track,
              isActive: true,
              isMuted: track.isMuted || false,
              isSoloed: track.isSoloed || false
            };
          });
          
          setTracks(newTracks);
          
          // Setup synths for all tracks
          newTracks.forEach(track => {
            setupTrackSynth(track.id, track);
          });
          
          // Set first track as selected
          setSelectedTrack(newTracks[0]);
        }
      }, 100);
      
      // Set name
      setCurrentSetName(setToLoad.name);
      
      // Select first image
      if (setToLoad.images && setToLoad.images.length > 0) {
        setSelectedImage(setToLoad.images[0]);
      }
      
      alert(`Set "${setToLoad.name}" loaded successfully`);
    } catch (err) {
      console.error("Error loading saved set:", err);
      alert("Error loading saved set. Please try again.");
    }
  };
  
  // Delete a saved set
  const deleteSavedSet = (setId) => {
    try {
      if (!confirm("Are you sure you want to delete this saved set?")) {
        return;
      }
      
      const updatedSets = savedSets.filter(set => set.id !== setId);
      setSavedSets(updatedSets);
      
      // Update localStorage
      localStorage.setItem('sonificationSessions', JSON.stringify(updatedSets));
      
      alert("Set deleted successfully");
    } catch (err) {
      console.error("Error deleting saved set:", err);
      alert("Error deleting saved set. Please try again.");
    }
  };
  
  // Export/Share state
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState('wav');
  const [exportQuality, setExportQuality] = useState('high');
  const [exportAllTracks, setExportAllTracks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedUrl, setExportedUrl] = useState(null);
  
  // Audio recorder
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Format time display (seconds to MM:SS)
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate track position in timeline
  const getTrackPosition = (track) => {
    const startPercent = (track.parameters.startTime / duration) * 100;
    const endPercent = (track.parameters.endTime / duration) * 100;
    const width = endPercent - startPercent;
    
    return {
      left: `${startPercent}%`,
      width: `${width}%`
    };
  };
  
  // Render time markers for timeline
  const renderTimeMarkers = () => {
    const markers = [];
    const step = duration <= 30 ? 5 : 10; // 5 second markers for shorter durations
    
    for (let i = 0; i <= duration; i += step) {
      const position = (i / duration) * 100;
      markers.push(
        <div 
          key={i} 
          className="absolute h-full border-l border-gray-600"
          style={{ left: `${position}%` }}
        >
          <div className="absolute -top-5 -ml-3 text-xs text-gray-400">
            {formatTime(i)}
          </div>
        </div>
      );
    }
    
    return markers;
  };
  
  // Render visualization of track events
  const renderTrackEventVisualization = (track) => {
    // Get source image data
    const sourceImage = sourceImages.find(img => img.id === track.imageId);
    if (!sourceImage) return null;
    
    // Get track timing info
    const startTime = track.parameters.startTime;
    const endTime = track.parameters.endTime;
    const trackDuration = endTime - startTime;
    
    // For visualization purposes, create simplified event markers
    // This simulates what would happen during sonification
    const events = [];
    const { data: imageData, parameters } = sourceImage;
    const resolution = track.parameters.resolution;
    
    // Use a maximum of 100 events for visualization
    const sampleStep = Math.max(1, Math.floor(imageData.length / 100));
    
    for (let i = 0; i < imageData.length; i += sampleStep) {
      const pixel = imageData[i];
      if (!pixel) continue;
      
      // Calculate relative position within track
      const relativePosition = i / imageData.length;
      
      // Map brightness to height
      const height = 0.2 + pixel.brightness * 0.8;
      
      // Determine color based on track method
      let color;
      switch (track.method) {
        case 'colorToPitch':
          // Map hue to color
          color = `hsl(${Math.round(pixel.hue * 360)}, 70%, 60%)`;
          break;
        case 'brightnessToRhythm':
          // Use brightness for intensity
          color = `rgba(255, 255, 255, ${pixel.brightness})`;
          break;
        case 'spatialToArpeggio':
          // Use position for color
          color = `hsl(${Math.round(pixel.y * 360)}, 70%, 60%)`;
          break;
        case 'colorChords':
          // Use a gradient based on hue
          color = `hsl(${Math.round(pixel.hue * 360)}, 70%, 60%)`;
          break;
        default:
          color = 'rgba(255, 255, 255, 0.5)';
      }
      
      events.push({
        position: relativePosition,
        height,
        color
      });
    }
    
    // Render events as bars
    return events.map((event, index) => (
      <div
        key={index}
        className="h-full w-1"
        style={{
          left: `${event.position * 100}%`,
          height: `${event.height * 100}%`,
          backgroundColor: event.color,
          position: 'absolute',
          bottom: 0
        }}
      />
    ));
  };
  
  // Open export modal
  const exportAudio = () => {
    setExportModalVisible(true);
    setExportComplete(false);
    setExportedUrl(null);
  };
  
  // Open share modal
  const shareProject = () => {
    setShareModalVisible(true);
  };
  
  // Start export process
  const startExport = async () => {
    setIsExporting(true);
    setExportStatus('Preparing for export...');
    
    try {
      if (exportFormat === 'wav') {
        await exportAudioToWav();
      } else {
        exportProjectToJson();
      }
    } catch (err) {
      console.error("Export error:", err);
      setExportStatus('Export failed: ' + err.message);
      setIsExporting(false);
    }
  };
  
  // Export audio to WAV file
  const exportAudioToWav = async () => {
    try {
      // Stop any ongoing playback
      if (isPlaying) {
        transportRef.current.pause();
        setIsPlaying(false);
      }
      
      // Reset playback position
      transportRef.current.seconds = 0;
      setCurrentTime(0);
      
      // Create a new audio context for recording
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const recordingContext = new AudioContext();
      
      // Set up sample rate based on quality
      let sampleRate;
      let channels;
      
      switch (exportQuality) {
        case 'high':
          sampleRate = 48000;
          channels = 2;
          break;
        case 'medium':
          sampleRate = 44100;
          channels = 2;
          break;
        case 'low':
          sampleRate = 22050;
          channels = 1;
          break;
        default:
          sampleRate = 44100;
          channels = 2;
      }
      
      // Create destination node
      const destination = recordingContext.createMediaStreamDestination();
      
      // Set up audio recorder
      const recorder = new MediaRecorder(destination.stream);
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      
      // Set up recorder events
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Update state
        setExportedUrl(audioUrl);
        setExportComplete(true);
        setIsExporting(false);
        setExportStatus('Export complete!');
      };
      
      // Start recording
      recorder.start();
      
      // Create temporary synths for each track
      setExportStatus('Setting up audio engine...');
      
      const exportSynths = {};
      const activeTracks = exportAllTracks 
        ? tracks 
        : tracks.filter(track => !track.isMuted);
      
      // Create synths for each track
      for (const track of activeTracks) {
        // Create synth
        let synth;
        
        switch (track.synthType) {
          case 'FMSynth':
            synth = new Tone.FMSynth();
            break;
          case 'AMSynth':
            synth = new Tone.AMSynth();
            break;
          case 'MembraneSynth':
            synth = new Tone.MembraneSynth();
            break;
          case 'PluckSynth':
            synth = new Tone.PluckSynth();
            break;
          default:
            synth = new Tone.Synth();
        }
        
        // Create effect
        let effect;
        
        switch (track.parameters.effect) {
          case 'reverb':
            effect = new Tone.Reverb({
              decay: 2,
              wet: track.parameters.effectMix
            });
            break;
          case 'delay':
            effect = new Tone.FeedbackDelay({
              delayTime: 0.25,
              feedback: 0.3,
              wet: track.parameters.effectMix
            });
            break;
          case 'distortion':
            effect = new Tone.Distortion({
              distortion: 0.4,
              wet: track.parameters.effectMix
            });
            break;
          default:
            effect = new Tone.Volume(0);
        }
        
        // Connect synth to effect
        synth.connect(effect);
        
        // Connect effect to destination
        effect.connect(destination);
        
        // Set volume
        synth.volume.value = Tone.gainToDb(track.volume);
        
        // Store synth
        exportSynths[track.id] = {
          synth,
          effect
        };
      }
      
      // Schedule all events
      setExportStatus('Scheduling audio events...');
      
      // Create a temporary timeline for export
      const exportTimeline = [];
      
      // Schedule events for each track
      for (const track of activeTracks) {
        // Get source image
        const sourceImage = sourceImages.find(img => img.id === track.imageId);
        if (!sourceImage) continue;
        
        const { data: imageData } = sourceImage;
        const { parameters } = track;
        const { pitchRange, speed, startTime, endTime } = parameters;
        
        // Track duration
        const trackDuration = endTime - startTime;
        
        // Schedule events based on method
        switch (track.method) {
          case 'colorToPitch': {
            imageData.forEach((pixel, index) => {
              // Skip based on resolution
              if (index % Math.round(1 / parameters.resolution) !== 0) return;
              
              // Calculate time
              const relativeTime = (index / imageData.length) * trackDuration / speed;
              const absoluteTime = startTime + relativeTime;
              
              // Skip if outside track bounds
              if (absoluteTime > endTime) return;
              
              // Map hue to pitch
              const pitch = pitchRange[0] + pixel.hue * (pitchRange[1] - pitchRange[0]);
              
              // Map brightness to velocity
              const velocity = 0.3 + pixel.brightness * 0.7;
              
              // Add event to timeline
              exportTimeline.push({
                time: absoluteTime,
                trackId: track.id,
                note: pitch,
                duration: parameters.attack + parameters.release,
                velocity
              });
            });
            break;
          }
          
          case 'brightnessToRhythm': {
            const rhythmThresholds = [0.2, 0.4, 0.6, 0.8];
            const pitches = ['C3', 'E3', 'G3', 'B3', 'C4'];
            
            imageData.forEach((pixel, index) => {
              // Skip based on resolution
              if (index % Math.round(1 / parameters.resolution) !== 0) return;
              
              // Calculate time
              const relativeTime = (index / imageData.length) * trackDuration / speed;
              const absoluteTime = startTime + relativeTime;
              
              // Skip if outside track bounds
              if (absoluteTime > endTime) return;
              
              // Determine if we trigger based on brightness
              const thresholdIndex = rhythmThresholds.findIndex(t => pixel.brightness <= t);
              if (thresholdIndex >= 0) {
                const pitch = pitches[thresholdIndex];
                const velocity = 0.3 + pixel.brightness * 0.7;
                
                // Add event to timeline
                exportTimeline.push({
                  time: absoluteTime,
                  trackId: track.id,
                  note: pitch,
                  duration: parameters.attack + parameters.release,
                  velocity
                });
              }
            });
            break;
          }
          
          case 'spatialToArpeggio': {
            // Group pixels by row
            const rows = {};
            imageData.forEach(pixel => {
              const rowKey = Math.floor(pixel.y * 10) / 10;
              if (!rows[rowKey]) rows[rowKey] = [];
              rows[rowKey].push(pixel);
            });
            
            // Create arpeggios for each row
            Object.entries(rows).forEach(([rowKey, pixels], rowIndex) => {
              // Sort pixels
              pixels.sort((a, b) => a.x - b.x);
              
              // Map row to chord
              const baseNote = 48 + (rowIndex * 5);
              const chord = [baseNote, baseNote + 4, baseNote + 7];
              
              // Schedule notes
              pixels.forEach((pixel, pixelIndex) => {
                // Skip based on resolution
                if (pixelIndex % Math.round(1 / parameters.resolution) !== 0) return;
                
                // Calculate time
                const rowOffset = rowIndex * 0.5;
                const pixelPosition = pixelIndex / pixels.length * 1.5;
                const relativeTime = (rowOffset + pixelPosition) * trackDuration / speed;
                const absoluteTime = startTime + relativeTime;
                
                // Skip if outside track bounds
                if (absoluteTime > endTime) return;
                
                const noteIndex = pixelIndex % chord.length;
                const note = Tone.Frequency(chord[noteIndex], "midi");
                const velocity = 0.3 + pixel.brightness * 0.7;
                
                // Add event to timeline
                exportTimeline.push({
                  time: absoluteTime,
                  trackId: track.id,
                  note,
                  duration: parameters.attack + parameters.release,
                  velocity
                });
              });
            });
            break;
          }
          
          case 'colorChords': {
            // Group by hue ranges
            const hueRanges = [0, 0.2, 0.4, 0.6, 0.8];
            const chordTypes = [
              [0, 4, 7], // Major
              [0, 3, 7], // Minor
              [0, 4, 7, 11], // Major 7th
              [0, 3, 7, 10], // Minor 7th
              [0, 4, 8] // Augmented
            ];
            
            // Root note based on brightness
            const avgBrightness = imageData.reduce((sum, pixel) => sum + pixel.brightness, 0) / imageData.length;
            const rootNote = 36 + Math.floor(avgBrightness * 24);
            
            imageData.forEach((pixel, index) => {
              // Skip based on resolution
              if (index % Math.round(1 / parameters.resolution) !== 0) return;
              
              // Calculate time
              const relativeTime = (index / imageData.length) * trackDuration / speed;
              const absoluteTime = startTime + relativeTime;
              
              // Skip if outside track bounds
              if (absoluteTime > endTime) return;
              
              // Select chord based on hue
              const hueIndex = hueRanges.findIndex(h => pixel.hue <= h + 0.2);
              if (hueIndex >= 0) {
                const chordType = chordTypes[Math.min(hueIndex, chordTypes.length - 1)];
                const chord = chordType.map(interval => Tone.Frequency(rootNote + interval, "midi"));
                const velocity = 0.3 + pixel.brightness * 0.7;
                
                // Arpeggio or chord
                const isArpeggio = index % 3 === 0;
                
                if (isArpeggio) {
                  // Arpeggio
                  chord.forEach((note, noteIndex) => {
                    const noteDelay = noteIndex * 0.1;
                    
                    // Add event to timeline
                    exportTimeline.push({
                      time: absoluteTime + noteDelay,
                      trackId: track.id,
                      note,
                      duration: parameters.attack + parameters.release,
                      velocity
                    });
                  });
                } else {
                  // Single note from chord
                  const note = chord[index % chord.length];
                  
                  // Add event to timeline
                  exportTimeline.push({
                    time: absoluteTime,
                    trackId: track.id,
                    note,
                    duration: parameters.attack + parameters.release,
                    velocity
                  });
                }
              }
            });
            break;
          }
        }
      }
      
      // Sort timeline by time
      exportTimeline.sort((a, b) => a.time - b.time);
      
      // Play all events
      setExportStatus('Generating audio...');
      
      // Start audio context
      await Tone.start();
      
      // Create a loop to play events in real time
      let currentIndex = 0;
      const startTime = Date.now();
      
      const playEvents = async () => {
        const currentTime = (Date.now() - startTime) / 1000;
        
        // Play all events up to current time
        while (currentIndex < exportTimeline.length && 
               exportTimeline[currentIndex].time <= currentTime) {
          const event = exportTimeline[currentIndex];
          
          // Get synth
          const synth = exportSynths[event.trackId]?.synth;
          if (synth) {
            // Play note
            synth.triggerAttackRelease(
              event.note,
              event.duration,
              undefined,
              event.velocity
            );
          }
          
          currentIndex++;
        }
        
        // Update status
        setExportStatus(`Generating audio (${Math.round(currentTime / duration * 100)}%)...`);
        
        // Continue if not done
        if (currentIndex < exportTimeline.length && currentTime < duration) {
          setTimeout(playEvents, 10);
        } else {
          // All events played or time exceeded
          
          // Wait a bit to let reverb tails finish
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Stop recording
          recorder.stop();
          
          // Clean up synths
          Object.values(exportSynths).forEach(({ synth, effect }) => {
            synth.dispose();
            effect.dispose();
          });
        }
      };
      
      // Start playback loop
      playEvents();
      
    } catch (err) {
      console.error("Error exporting audio:", err);
      setExportStatus("Export failed: " + err.message);
      setIsExporting(false);
    }
  };
  
  // Export project to JSON
  const exportProjectToJson = () => {
    try {
      // Prepare project data
      const projectData = exportProjectData();
      
      // Convert to JSON
      const jsonData = JSON.stringify(projectData, null, 2);
      
      // Create download link
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonData)}`;
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', dataUri);
      downloadLink.setAttribute('download', `sonification-project-${Date.now()}.json`);
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Update state
      setExportComplete(true);
      setIsExporting(false);
      setExportStatus('Project exported successfully!');
      
    } catch (err) {
      console.error("Error exporting project:", err);
      setExportStatus("Export failed: " + err.message);
      setIsExporting(false);
    }
  };
  
  // Prepare project data for export
  const exportProjectData = () => {
    return {
      name: currentSetName || "Sonification Project",
      date: new Date().toISOString(),
      duration,
      images: sourceImages.map(img => ({
        id: img.id,
        name: img.name,
        previewUrl: img.previewUrl,
        data: img.data
      })),
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        imageId: track.imageId,
        method: track.method,
        synthType: track.synthType,
        volume: track.volume,
        parameters: track.parameters,
        color: track.color,
        isMuted: track.isMuted,
        isSoloed: track.isSoloed
      })),
      version: "1.0"
    };
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Bar - Title and Main Controls */}
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Image Sonification DJ Mixer</h1>
          <div className="ml-4 flex items-center gap-2">
            <input
              type="text"
              value={currentSetName}
              onChange={(e) => setCurrentSetName(e.target.value)}
              placeholder="Set name..."
              className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
            />
            <button
              onClick={saveCurrentState}
              className="px-2 py-1 text-sm bg-green-700 text-white rounded hover:bg-green-600"
              disabled={!currentSetName}
            >
              Save
            </button>
            
            <select 
              className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded" 
              onChange={(e) => e.target.value && loadSavedSet(e.target.value)}
              value=""
            >
              <option value="">Load saved set...</option>
              {savedSets.map(set => (
                <option key={set.id} value={set.id}>
                  {set.name} ({new Date(set.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            id="image-upload"
            className="hidden"
            onChange={handleImageUpload}
          />
          <label 
            htmlFor="image-upload"
            className="px-2 py-1 text-sm bg-blue-700 text-white rounded cursor-pointer hover:bg-blue-600"
          >
            Upload Image
          </label>
          <button 
            onClick={startWebcam}
            className="px-2 py-1 text-sm bg-purple-700 text-white rounded hover:bg-purple-600"
          >
            Webcam
          </button>
          <button 
            onClick={captureFromWebcam}
            className="px-2 py-1 text-sm bg-green-700 text-white rounded hover:bg-green-600"
            disabled={!videoRef.current || !videoRef.current.srcObject}
          >
            Capture
          </button>
          <button 
            onClick={stopWebcam}
            className="px-2 py-1 text-sm bg-red-700 text-white rounded hover:bg-red-600"
          >
            Stop Cam
          </button>
        </div>
      </div>
      
      {/* Transport Controls */}
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={resetPlayback}
            className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            ⏮
          </button>
          <button
            onClick={togglePlayback}
            className="p-1 px-3 bg-blue-700 text-white text-xl rounded hover:bg-blue-600"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <span className="ml-2 text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={exportAudio}
            className="px-2 py-1 bg-green-700 text-white rounded hover:bg-green-600 flex items-center gap-1"
            title="Export audio as WAV file"
          >
            <span>Export</span>
          </button>
          
          <button
            onClick={shareProject}
            className="px-2 py-1 bg-purple-700 text-white rounded hover:bg-purple-600 flex items-center gap-1" 
            title="Share this project"
          >
            <span>Share</span>
          </button>
          
          <div className="h-4 border-l border-gray-600 mx-1"></div>
          
          <label className="text-sm">Duration:</label>
          <input
            type="number"
            min="5"
            max="120"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-16 p-1 bg-gray-700 border border-gray-600 rounded text-center"
          />
          <span className="text-sm">sec</span>
          
          <div className="h-4 border-l border-gray-600 mx-1"></div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMixerMode("tracks")}
              className={`px-2 py-1 text-sm rounded ${
                mixerMode === "tracks" ? "bg-blue-700" : "bg-gray-700"
              }`}
            >
              Tracks
            </button>
            <button
              onClick={() => setMixerMode("fx")}
              className={`px-2 py-1 text-sm rounded ${
                mixerMode === "fx" ? "bg-blue-700" : "bg-gray-700"
              }`}
            >
              FX
            </button>
            <button
              onClick={() => setShowingTimeline(!showingTimeline)}
              className={`px-2 py-1 text-sm rounded ${
                showingTimeline ? "bg-blue-700" : "bg-gray-700"
              }`}
            >
              Timeline
            </button>
            <select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
            >
              <option value="0.5">Zoom 50%</option>
              <option value="1">Zoom 100%</option>
              <option value="2">Zoom 200%</option>
              <option value="4">Zoom 400%</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Export/Share Modal */}
      {exportModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Export Project</h2>
            
            {isExporting ? (
              <div className="text-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>{exportStatus}</p>
              </div>
            ) : exportComplete ? (
              <div className="text-center py-4">
                <div className="text-green-500 text-4xl mb-2">✓</div>
                <p className="mb-4">Export complete!</p>
                {exportedUrl && (
                  <div className="mb-4">
                    <a 
                      href={exportedUrl} 
                      download={`sonification-${Date.now()}.wav`}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Download Audio
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block mb-2">Export Format</label>
                  <select 
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  >
                    <option value="wav">WAV Audio</option>
                    <option value="json">Project File (JSON)</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block mb-2">Quality</label>
                  <select 
                    value={exportQuality} 
                    onChange={(e) => setExportQuality(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                    disabled={exportFormat !== 'wav'}
                  >
                    <option value="high">High (48kHz, Stereo)</option>
                    <option value="medium">Medium (44.1kHz, Stereo)</option>
                    <option value="low">Low (22kHz, Mono)</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block mb-2">Export Options</label>
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      id="export-all-tracks" 
                      checked={exportAllTracks}
                      onChange={(e) => setExportAllTracks(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="export-all-tracks">Export all tracks (uncheck to export only unmuted tracks)</label>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              {!isExporting && !exportComplete && (
                <button
                  onClick={startExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                >
                  Export
                </button>
              )}
              <button
                onClick={() => {
                  setExportModalVisible(false);
                  setExportComplete(false);
                  setExportedUrl(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {exportComplete ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {shareModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Share Project</h2>
            
            <div className="mb-4">
              <p className="mb-4">Share your project with others:</p>
              
              <div className="mb-4">
                <label className="block mb-2">Project Link</label>
                <div className="flex">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-l"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2">Export Options</label>
                <button
                  onClick={() => {
                    setShareModalVisible(false);
                    setExportModalVisible(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Export Audio File
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2">Project Data</label>
                <button
                  onClick={() => {
                    const projectData = exportProjectData();
                    const dataStr = JSON.stringify(projectData);
                    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
                    
                    const exportLink = document.createElement('a');
                    exportLink.setAttribute('href', dataUri);
                    exportLink.setAttribute('download', `sonification-project-${Date.now()}.json`);
                    document.body.appendChild(exportLink);
                    exportLink.click();
                    document.body.removeChild(exportLink);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Download Project File
                </button>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShareModalVisible(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Timeline View */}
      {showingTimeline && (
        <div className="bg-gray-800 border-b border-gray-700 p-2">
          <div className="relative overflow-auto">
            <div 
              className="relative h-auto bg-gray-700 rounded overflow-hidden min-h-48"
              style={{ width: `${100 * zoomLevel}%` }}
            >
              {/* Time markers */}
              {renderTimeMarkers()}
              
              {/* Playhead */}
              <div 
                className="absolute top-0 h-full w-px bg-red-500 z-20"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Track lanes */}
              <div className="relative pt-6">
                {tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className="relative h-16 border-t border-gray-600 flex items-center px-2"
                  >
                    <div className="absolute left-0 top-0 h-full w-16 flex items-center justify-center bg-gray-800 border-r border-gray-600 z-10">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: track.color || '#4a5568' }}
                      >
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Track block */}
                    <div 
                      className={`absolute h-12 rounded cursor-move ${
                        track.isMuted ? 'opacity-50' : ''
                      } ${track.isSoloed ? 'border-2 border-yellow-400' : 'border border-gray-600'}`}
                      style={{
                        ...getTrackPosition(track),
                        backgroundColor: track.color || '#4a5568',
                        left: `calc(${getTrackPosition(track).left} + 16px)`,
                        zIndex: 5
                      }}
                      onClick={() => setSelectedTrack(track)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', track.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDrag={(e) => {
                        // Track current drag position for visual feedback
                        if (e.clientX === 0 && e.clientY === 0) return; // Ignore invalid positions
                        
                        const trackElement = e.target;
                        const timelineElement = trackElement.parentElement;
                        const timelineRect = timelineElement.getBoundingClientRect();
                        
                        // Calculate position as percentage of timeline width
                        const positionPercent = Math.max(0, Math.min(100, 
                          ((e.clientX - timelineRect.left) / timelineRect.width) * 100));
                        
                        // Store position for visualization
                        trackElement.dataset.dragPosition = positionPercent;
                      }}
                    >
                      {/* Resize handle - left */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startTime = track.parameters.startTime;
                          const trackDuration = track.parameters.endTime - track.parameters.startTime;
                          
                          // Handle mouse move for resizing
                          const handleMouseMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const containerWidth = e.target.parentElement.parentElement.clientWidth;
                            const timelineDuration = duration;
                            
                            // Convert pixel delta to time delta
                            const timeDelta = (deltaX / containerWidth) * timelineDuration;
                            
                            // Calculate new start time (bounded)
                            const newStartTime = Math.max(0, Math.min(
                              track.parameters.endTime - 0.5, // Ensure minimum track length
                              startTime + timeDelta
                            ));
                            
                            // Update track
                            updateTrackParameters(track.id, 'startTime', newStartTime);
                          };
                          
                          // Handle mouse up to stop resizing
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          // Add event listeners
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                      
                      {/* Resize handle - right */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startEndTime = track.parameters.endTime;
                          
                          // Handle mouse move for resizing
                          const handleMouseMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const containerWidth = e.target.parentElement.parentElement.clientWidth;
                            const timelineDuration = duration;
                            
                            // Convert pixel delta to time delta
                            const timeDelta = (deltaX / containerWidth) * timelineDuration;
                            
                            // Calculate new end time (bounded)
                            const newEndTime = Math.max(
                              track.parameters.startTime + 0.5, // Ensure minimum track length
                              Math.min(duration, startEndTime + timeDelta)
                            );
                            
                            // Update track
                            updateTrackParameters(track.id, 'endTime', newEndTime);
                          };
                          
                          // Handle mouse up to stop resizing
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          // Add event listeners
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                      
                      <div className="text-xs truncate px-2 pt-1 font-semibold">
                        {track.name}
                      </div>
                      <div className="text-xs px-2">
                        {track.method}
                      </div>
                      
                      {/* Visualization of track events */}
                      <div className="absolute bottom-0 left-0 right-0 h-4 overflow-hidden">
                        <div className="flex h-full">
                          {renderTrackEventVisualization(track)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Drop zone for track positioning */}
                <div 
                  className="absolute top-0 left-0 w-full h-full"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const trackId = e.dataTransfer.getData('text/plain');
                    if (!trackId) return;
                    
                    // Calculate drop position in timeline
                    const rect = e.currentTarget.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const positionPercent = offsetX / rect.width;
                    
                    // Convert to time
                    const dropTime = positionPercent * duration;
                    
                    // Get track
                    const track = tracks.find(t => t.id === trackId);
                    if (!track) return;
                    
                    // Calculate track duration
                    const trackDuration = track.parameters.endTime - track.parameters.startTime;
                    
                    // Update track position
                    const newStartTime = Math.max(0, Math.min(duration - trackDuration, dropTime));
                    const newEndTime = Math.min(duration, newStartTime + trackDuration);
                    
                    // Update track parameters
                    updateTrackParameters(track.id, 'startTime', newStartTime);
                    updateTrackParameters(track.id, 'endTime', newEndTime);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Source Images */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-2 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-sm font-semibold">Source Images</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {sourceImages.length === 0 ? (
              <div className="text-gray-400 text-center p-4 text-sm">
                Upload an image to get started
              </div>
            ) : (
              <div className="space-y-2">
                {sourceImages.map(img => (
                  <div 
                    key={img.id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedImage && selectedImage.id === img.id 
                        ? 'bg-blue-800' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm truncate">{img.name}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            createTrackFromExistingImage(img.id);
                          }}
                          className="p-1 text-xs rounded bg-green-700"
                          title="Create new track from this image"
                        >
                          +
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            deleteSourceImage(img.id);
                          }}
                          className="p-1 text-xs rounded bg-red-700"
                          title="Delete image and all related tracks"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="h-20 flex items-center justify-center overflow-hidden bg-black rounded">
                      {img.previewUrl && (
                        <img 
                          src={img.previewUrl}
                          alt={img.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Webcam/Canvas Container */}
          <div className="p-2 border-t border-gray-700">
            <div className="relative bg-black rounded overflow-hidden" style={{ height: "100px" }}>
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: 'none' }}
              />
              <canvas 
                ref={imageCanvasRef} 
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* Center Panel - Tracks List */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-2 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-sm font-semibold">Tracks</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {tracks.length === 0 ? (
              <div className="text-gray-400 text-center p-4 text-sm">
                Upload an image to create tracks
              </div>
            ) : (
              <div className="space-y-2">
                {tracks.map(track => (
                  <div 
                    key={track.id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedTrack && selectedTrack.id === track.id 
                        ? 'bg-blue-800' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    } ${track.isMuted ? 'opacity-50' : ''}`}
                    style={{ borderLeft: `4px solid ${track.color || '#4a5568'}` }}
                    onClick={() => setSelectedTrack(track)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{track.name}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleTrackMute(track.id); }}
                          className={`p-1 text-xs rounded ${track.isMuted ? 'bg-red-700' : 'bg-gray-600'}`}
                          title="Mute track"
                        >
                          M
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleTrackSolo(track.id); }}
                          className={`p-1 text-xs rounded ${track.isSoloed ? 'bg-yellow-600' : 'bg-gray-600'}`}
                          title="Solo track"
                        >
                          S
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={track.volume}
                        onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-2"
                      />
                      <span className="text-xs w-7">
                        {Math.round(track.volume * 100)}%
                      </span>
                    </div>
                    
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>{track.method}</span>
                      <span>{track.synthType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Panel - Track Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-800">
          <div className="p-2 border-b border-gray-700">
            <h2 className="text-sm font-semibold">Track Editor</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {selectedTrack ? (
              <div className="bg-gray-700 rounded p-3">
                <div className="flex justify-between items-center mb-3">
                  <input
                    type="text" 
                    value={selectedTrack.name}
                    onChange={(e) => {
                      setTracks(prevTracks => 
                        prevTracks.map(track => 
                          track.id === selectedTrack.id 
                            ? { ...track, name: e.target.value } 
                            : track
                        )
                      );
                    }}
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-lg font-semibold"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => duplicateTrack(selectedTrack.id)}
                      className="px-2 py-1 text-sm bg-blue-700 text-white rounded hover:bg-blue-600"
                      title="Duplicate track"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => deleteTrack(selectedTrack.id)}
                      className="px-2 py-1 text-sm bg-red-700 text-white rounded hover:bg-red-600"
                      title="Delete track"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Basic Parameters */}
                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="text-sm font-semibold mb-2">Basic Settings</h3>
                    
                    {/* Sonification Method */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">Sonification Method</label>
                      <select
                        value={selectedTrack.method}
                        onChange={(e) => changeTrackMethod(selectedTrack.id, e.target.value)}
                        className="w-full p-1 text-sm rounded bg-gray-700 border border-gray-600"
                      >
                        <option value="colorToPitch">Color to Pitch</option>
                        <option value="brightnessToRhythm">Brightness to Rhythm</option>
                        <option value="spatialToArpeggio">Spatial to Arpeggio</option>
                        <option value="colorChords">Color Chords</option>
                      </select>
                    </div>
                    
                    {/* Synth Type */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">Synth Type</label>
                      <select
                        value={selectedTrack.synthType}
                        onChange={(e) => changeTrackSynth(selectedTrack.id, e.target.value)}
                        className="w-full p-1 text-sm rounded bg-gray-700 border border-gray-600"
                      >
                        <option value="Synth">Basic Synth</option>
                        <option value="AMSynth">AM Synth</option>
                        <option value="FMSynth">FM Synth</option>
                        <option value="MembraneSynth">Membrane Synth</option>
                        <option value="PluckSynth">Pluck Synth</option>
                      </select>
                    </div>
                    
                    {/* Track Color */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">Track Color</label>
                      <input
                        type="color"
                        value={selectedTrack.color || "#4a5568"}
                        onChange={(e) => {
                          setTracks(prevTracks => 
                            prevTracks.map(track => 
                              track.id === selectedTrack.id 
                                ? { ...track, color: e.target.value } 
                                : track
                            )
                          );
                        }}
                        className="w-full h-8 rounded"
                      />
                    </div>
                    
                    {/* Track Timing */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">Start Time: {selectedTrack.parameters.startTime.toFixed(1)}s</label>
                      <input
                        type="range"
                        min="0"
                        max={duration - 1}
                        step="0.1"
                        value={selectedTrack.parameters.startTime}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'startTime', parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">End Time: {selectedTrack.parameters.endTime.toFixed(1)}s</label>
                      <input
                        type="range"
                        min={1}
                        max={duration}
                        step="0.1"
                        value={selectedTrack.parameters.endTime}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'endTime', parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Sound Parameters */}
                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="text-sm font-semibold mb-2">Sound Parameters</h3>
                    
                    {/* Speed */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">
                        Speed: {selectedTrack.parameters.speed.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="4"
                        step="0.1"
                        value={selectedTrack.parameters.speed}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'speed', parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Resolution */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">
                        Resolution: {selectedTrack.parameters.resolution.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={selectedTrack.parameters.resolution}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'resolution', parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Attack */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">
                        Attack: {selectedTrack.parameters.attack.toFixed(2)}s
                      </label>
                      <input
                        type="range"
                        min="0.01"
                        max="1"
                        step="0.01"
                        value={selectedTrack.parameters.attack}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'attack', parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Release */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">
                        Release: {selectedTrack.parameters.release.toFixed(2)}s
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={selectedTrack.parameters.release}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'release', parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Pitch Range (if applicable) */}
                    {(selectedTrack.method === 'colorToPitch') && (
                      <div className="mb-2">
                        <label className="block mb-1 text-xs">
                          Pitch Range: {selectedTrack.parameters.pitchRange[0]}Hz - {selectedTrack.parameters.pitchRange[1]}Hz
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="20"
                            max="1000"
                            value={selectedTrack.parameters.pitchRange[0]}
                            onChange={(e) => updateTrackParameters(
                              selectedTrack.id, 
                              'pitchRange', 
                              [parseInt(e.target.value), selectedTrack.parameters.pitchRange[1]]
                            )}
                            className="w-20 p-1 text-sm rounded bg-gray-700 border border-gray-600"
                          />
                          <span className="text-xs self-center">to</span>
                          <input
                            type="number"
                            min="20"
                            max="2000"
                            value={selectedTrack.parameters.pitchRange[1]}
                            onChange={(e) => updateTrackParameters(
                              selectedTrack.id, 
                              'pitchRange', 
                              [selectedTrack.parameters.pitchRange[0], parseInt(e.target.value)]
                            )}
                            className="w-20 p-1 text-sm rounded bg-gray-700 border border-gray-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Effects Parameters */}
                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="text-sm font-semibold mb-2">Effects</h3>
                    
                    {/* Effect Type */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">Effect Type</label>
                      <select
                        value={selectedTrack.parameters.effect}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'effect', e.target.value
                        )}
                        className="w-full p-1 text-sm rounded bg-gray-700 border border-gray-600"
                      >
                        <option value="none">None</option>
                        <option value="reverb">Reverb</option>
                        <option value="delay">Delay</option>
                        <option value="distortion">Distortion</option>
                      </select>
                    </div>
                    
                    {/* Effect Mix */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">
                        Effect Mix: {Math.round(selectedTrack.parameters.effectMix * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedTrack.parameters.effectMix}
                        onChange={(e) => updateTrackParameters(
                          selectedTrack.id, 'effectMix', parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Volume (duplicated for easy access) */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs">
                        Volume: {Math.round(selectedTrack.volume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedTrack.volume}
                        onChange={(e) => setTrackVolume(selectedTrack.id, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="bg-gray-700 p-2 rounded mt-4">
                      <div className="text-xs font-medium mb-1">Track Information</div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                        <div>Source Image:</div>
                        <div>{sourceImages.find(img => img.id === selectedTrack.imageId)?.name || "Unknown"}</div>
                        <div>Method:</div>
                        <div>{selectedTrack.method}</div>
                        <div>Synth:</div>
                        <div>{selectedTrack.synthType}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          // Restore all synths and schedules
                          setupTrackSynth(selectedTrack.id, selectedTrack);
                        }}
                        className="w-full px-2 py-1 text-sm bg-blue-700 text-white rounded hover:bg-blue-600"
                      >
                        Refresh Track
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 p-6 text-sm">
                Select a track to edit parameters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSonificationDJMixer;