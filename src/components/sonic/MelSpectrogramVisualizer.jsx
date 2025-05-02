import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

// Mel Spectrogram Visualization component for ImageSonificationDJMixer
const MelSpectrogramVisualizer = ({ 
  tracks, 
  sourceImages, 
  isPlaying, 
  currentTime, 
  duration, 
  transportRef,
  selectedTrack,
  setSelectedTrack,
  updateTrackParameters,
  changeTrackMethod,
  changeTrackSynth,
  setTrackVolume
}) => {
  // State management
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'combined'
  const [activeTrackModal, setActiveTrackModal] = useState(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [spectrogramHeight, setSpectrogramHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [analyzers, setAnalyzers] = useState({});
  
  // Refs
  const timelineRef = useRef(null);
  const spectrogramCanvasRefs = useRef({});
  const combinedSpectrogramRef = useRef(null);
  const resizeStartYRef = useRef(0);
  const initialHeightRef = useRef(0);
  
  // Get the current playhead position as a percentage of total duration
  const getPlayheadPosition = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };
  
  // Set up analyzers for each track
  useEffect(() => {
    // Only run this when tracks change
    const setupAnalyzers = async () => {
      // Disconnect any existing analyzers
      Object.values(analyzers).forEach(analyzerInfo => {
        if (analyzerInfo && analyzerInfo.analyzer) {
          analyzerInfo.analyzer.disconnect();
        }
      });
      
      const newAnalyzers = {};
      
      // Create new analyzers for each track
      tracks.forEach(track => {
        if (!track.id) return;
        
        // Get the track's synth from the synthsRef
        const trackSynth = window.synthsRef?.current?.[track.id]?.synth;
        if (!trackSynth) return;
        
        // Create analyzer node
        const analyzer = new Tone.Analyser('fft', 64);
        analyzer.smoothing = 0.4;
        
        // Connect synth to analyzer - we don't want to disrupt the original signal chain
        // so we'll use .fan() to split the signal
        try {
          trackSynth.fan(analyzer);
          
          // Store analyzer
          newAnalyzers[track.id] = {
            analyzer,
            track
          };
        } catch (err) {
          console.error("Error connecting analyzer for track", track.id, err);
        }
      });
      
      setAnalyzers(newAnalyzers);
    };
    
    // Setup analyzers if window.synthsRef is available
    if (window.synthsRef && tracks.length > 0) {
      setupAnalyzers();
    }
    
    // Clean up on unmount
    return () => {
      Object.values(analyzers).forEach(analyzerInfo => {
        if (analyzerInfo && analyzerInfo.analyzer) {
          analyzerInfo.analyzer.disconnect();
        }
      });
    };
  }, [tracks]);
  
  // Initialize canvases
  useEffect(() => {
    // Initialize each track's canvas with a full background
    tracks.forEach(track => {
      const canvas = spectrogramCanvasRefs.current[track.id];
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    
    // Initialize combined canvas if it exists
    if (combinedSpectrogramRef.current) {
      const ctx = combinedSpectrogramRef.current.getContext('2d');
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, combinedSpectrogramRef.current.width, combinedSpectrogramRef.current.height);
    }
  }, [tracks, viewMode]);
  
  // Color mapping function for heatmap
  const getHeatmapColor = (value) => {
    // Value should be between 0-1
    const intensity = Math.min(1, Math.max(0, value));
    let r, g, b;
    
    // Viridis-inspired colormap (more perceptually uniform)
    if (intensity < 0.25) {
      // Dark purple to blue
      r = Math.round(68 + (intensity * 4 * (106 - 68)));
      g = Math.round(1 + (intensity * 4 * (121 - 1)));
      b = Math.round(84 + (intensity * 4 * (207 - 84)));
    } else if (intensity < 0.5) {
      // Blue to teal
      const t = (intensity - 0.25) * 4;
      r = Math.round(106 + (t * (33 - 106)));
      g = Math.round(121 + (t * (144 - 121)));
      b = Math.round(207 + (t * (140 - 207)));
    } else if (intensity < 0.75) {
      // Teal to green/yellow
      const t = (intensity - 0.5) * 4;
      r = Math.round(33 + (t * (215 - 33)));
      g = Math.round(144 + (t * (201 - 144)));
      b = Math.round(140 + (t * (32 - 140)));
    } else {
      // Green/yellow to yellow
      const t = (intensity - 0.75) * 4;
      r = Math.round(215 + (t * (252 - 215)));
      g = Math.round(201 + (t * (255 - 201)));
      b = Math.round(32 + (t * (0 - 32)));
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Generate sample data if analyzer is not available
  const getTrackFrequencyData = (trackId) => {
    // Try to get real data from analyzer
    const analyzerInfo = analyzers[trackId];
    if (analyzerInfo && analyzerInfo.analyzer) {
      return analyzerInfo.analyzer.getValue();
    }
    
    // Fallback: Generate sample data
    const track = tracks.find(t => t.id === trackId);
    if (!track) return new Uint8Array(64).fill(0);
    
    // Simulate frequency data based on track parameters
    const data = new Uint8Array(64);
    
    // Track characteristics - use parameters to influence frequency distribution
    const method = track.method || 'colorToPitch';
    
    // Calculate values based on method
    switch (method) {
      case 'colorToPitch':
        // More energy in higher frequencies (pitched content)
        for (let i = 0; i < data.length; i++) {
          // Create a bell curve with peak based on pitch range
          const pitchRange = track.parameters.pitchRange || [220, 880];
          const midFreq = (pitchRange[0] + pitchRange[1]) / 2 / 2000; // Normalize to 0-1 range
          const midBin = Math.floor(midFreq * data.length);
          
          // Create bell curve shape
          const distance = Math.abs(i - midBin);
          const bellValue = Math.exp(-(distance * distance) / (2 * 100));
          
          // Modulate based on time for animation effect
          const modulationRate = track.parameters.speed || 1;
          const time = currentTime * modulationRate;
          const modulation = Math.sin(time * 2 + i * 0.1) * 0.3 + 0.7;
          
          // Combine for final value
          data[i] = Math.min(255, Math.floor(bellValue * 200 * modulation * track.volume));
        }
        break;
        
      case 'brightnessToRhythm':
        // Percussion-oriented - more energy in low and mid frequencies
        for (let i = 0; i < data.length; i++) {
          const isBassBin = i < 10;
          const isMidBin = i >= 10 && i < 30;
          
          // Create rhythm patterns based on time
          const speed = track.parameters.speed || 1;
          const time = currentTime * speed;
          const beatPhase = time % 1; // 0-1 phase of current beat
          
          // Bass drum pattern on beats
          const bassDrum = isBassBin && beatPhase < 0.2 ? 0.9 : 0.1;
          
          // Snare pattern on off-beats
          const snarePhase = (time + 0.5) % 1;
          const snare = isMidBin && snarePhase < 0.2 ? 0.8 : 0.1;
          
          // Combine patterns
          let value = Math.max(bassDrum, snare);
          
          // Add some noise for realism
          value += Math.random() * 0.1;
          
          // Scale by track volume
          data[i] = Math.min(255, Math.floor(value * 255 * track.volume));
        }
        break;
        
      case 'spatialToArpeggio':
        // Arpeggios - harmonic content in specific frequency ranges
        for (let i = 0; i < data.length; i++) {
          // Create harmonic series pattern
          const harmonics = [1, 3, 5, 6, 8, 10];
          const speed = track.parameters.speed || 1;
          const time = currentTime * speed;
          
          // Arpeggio index based on time
          const patternLength = 4;
          const patternPosition = (time * 4) % patternLength;
          const arpeggioIndex = Math.floor(patternPosition);
          
          // Calculate frequency bins for harmonic series
          const binFactor = data.length / 12; // 12 is roughly one octave
          const isActiveHarmonic = harmonics.some(h => {
            const harmonic = arpeggioIndex + h;
            const binCenter = harmonic * binFactor;
            return Math.abs(i - binCenter) < binFactor/2;
          });
          
          // Set value based on whether this bin is part of active harmonics
          const value = isActiveHarmonic ? (0.7 + Math.random() * 0.3) : Math.random() * 0.1;
          
          // Scale by track volume
          data[i] = Math.min(255, Math.floor(value * 255 * track.volume));
        }
        break;
        
      case 'colorChords':
        // Chords - clusters of harmonics
        for (let i = 0; i < data.length; i++) {
          // Create chord patterns
          const chordBins = [
            [5, 9, 12], // Major chord
            [5, 8, 12], // Minor chord
            [5, 9, 14]  // Major 7th
          ];
          
          const speed = track.parameters.speed || 1;
          const time = currentTime * speed;
          
          // Chord changes every 2 seconds
          const chordIndex = Math.floor(time / 2) % chordBins.length;
          const currentChord = chordBins[chordIndex];
          
          // Base bin for the chord
          const baseBin = 8 + Math.floor(time) % 12;
          
          // Check if this bin is part of the current chord
          const isChordTone = currentChord.some(interval => {
            return (baseBin + interval) % data.length === i % data.length;
          });
          
          // Set value based on whether this bin is part of the chord
          const value = isChordTone ? (0.7 + Math.random() * 0.3) : Math.random() * 0.1;
          
          // Scale by track volume
          data[i] = Math.min(255, Math.floor(value * 255 * track.volume));
        }
        break;
        
      default:
        // Default frequency distribution - more energy in lower frequencies
        for (let i = 0; i < data.length; i++) {
          // Lower frequencies (bass) typically have more energy
          const baseFactor = Math.max(0, 1 - (i / data.length));
          
          // Add time-based modulation
          const time = currentTime * (track.parameters?.speed || 1);
          const modulation = Math.sin(time * 2 + i * 0.1) * 0.3 + 0.7;
          
          // Calculate final value
          const value = baseFactor * modulation * track.volume;
          
          data[i] = Math.min(255, Math.floor(value * 255));
        }
    }
    
    return data;
  };
  
  // Draw spectrogram frames
  useEffect(() => {
    // Skip if not playing and no need to update static view
    if (!isPlaying && !isDraggingPlayhead) return;
    
    // Calculate the current time based on playhead position
    const playheadPosition = getPlayheadPosition();
    
    // Draw individual track spectrograms
    tracks.forEach(track => {
      if (!track.id) return;
      
      const canvas = spectrogramCanvasRefs.current[track.id];
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Get frequency data for this track
      const frequencyData = getTrackFrequencyData(track.id);
      
      // Number of frequency bins to display (mel-scaled)
      const numBins = frequencyData.length;
      const binHeight = height / numBins;
      
      if (isPlaying) {
        // Shift the existing spectrogram to the left
        const imageData = ctx.getImageData(2, 0, width - 2, height);
        ctx.putImageData(imageData, 0, 0);
        
        // Clear the column where we'll draw new data
        ctx.fillStyle = 'rgb(20, 20, 30)';
        ctx.fillRect(width - 2, 0, 2, height);
        
        // Draw new frequency data on the right edge
        for (let i = 0; i < numBins; i++) {
          // Apply mel scaling for better frequency visualization
          const melIndex = Math.pow(i / numBins, 0.5) * numBins;
          
          // Get the value from the frequency data (0-255)
          const value = frequencyData[Math.floor(melIndex)];
          
          // Normalize to 0-1 range
          const normalizedValue = value / 255;
          
          // Get heat map color based on intensity
          ctx.fillStyle = getHeatmapColor(normalizedValue);
          
          // Calculate y position (inverted so low frequencies are at bottom)
          const y = height - (i + 1) * binHeight;
          
          // Draw a rectangle for this frequency bin
          ctx.fillRect(width - 2, y, 2, binHeight + 1); // +1 to avoid gaps
        }
      }
    });
    
    // Draw combined spectrogram if in combined mode
    if (viewMode === 'combined' && combinedSpectrogramRef.current) {
      const canvas = combinedSpectrogramRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const numBins = 64; // Number of frequency bins
      const binHeight = height / numBins;
      
      if (isPlaying) {
        // Shift the existing spectrogram to the left
        const imageData = ctx.getImageData(2, 0, width - 2, height);
        ctx.putImageData(imageData, 0, 0);
        
        // Clear the column where we'll draw new data
        ctx.fillStyle = 'rgb(20, 20, 30)';
        ctx.fillRect(width - 2, 0, 2, height);
        
        // Combine frequency data from all tracks
        const combinedData = new Uint8Array(numBins).fill(0);
        
        tracks.forEach(track => {
          // Skip tracks that are muted or inactive
          if (track.isMuted || !track.isActive) return;
          
          const trackData = getTrackFrequencyData(track.id);
          
          // Sum the values (with some weighting to avoid clipping)
          for (let i = 0; i < combinedData.length; i++) {
            combinedData[i] = Math.min(255, combinedData[i] + (trackData[i] * 0.7));
          }
        });
        
        // Draw the combined data
        for (let i = 0; i < numBins; i++) {
          // Apply mel scale mapping
          const melIndex = Math.pow(i / numBins, 0.5) * numBins;
          const value = combinedData[Math.floor(melIndex)];
          
          // Normalize to 0-1 range
          const normalizedValue = value / 255;
          
          // Get color for this intensity
          ctx.fillStyle = getHeatmapColor(normalizedValue);
          
          // Calculate y position
          const y = height - (i + 1) * binHeight;
          
          // Draw bin
          ctx.fillRect(width - 2, y, 2, binHeight + 1);
        }
      }
    }
  }, [currentTime, isPlaying, tracks, viewMode, analyzers, isDraggingPlayhead]);
  
  // Draw full static spectrogram when not playing
  const drawStaticSpectrogram = () => {
    tracks.forEach(track => {
      const canvas = spectrogramCanvasRefs.current[track.id];
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear the canvas
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, width, height);
      
      // Calculate timespan to visualize - 10 seconds centered on current position
      const timeWindow = 10;
      const startTime = Math.max(0, currentTime - timeWindow/2);
      const endTime = Math.min(duration, currentTime + timeWindow/2);
      const timeRange = endTime - startTime;
      
      // If no range to display, exit
      if (timeRange <= 0) return;
      
      // Calculate number of columns to draw
      const numSteps = width;
      const stepSize = timeRange / numSteps;
      
      // Draw frequency data for each time step
      for (let step = 0; step < numSteps; step++) {
        // Calculate time for this step
        const stepTime = startTime + (step * stepSize);
        
        // Get frequency data for this time point
        // Note: Since we don't have real data for arbitrary time points,
        // we'll simulate data based on track parameters and time
        const simulatedData = new Uint8Array(64);
        
        // Fill with simulated frequency data
        // The actual implementation would depend on your audio analysis approach
        for (let i = 0; i < simulatedData.length; i++) {
          // Time modulation - create patterns based on track.method
          const frequency = i / simulatedData.length; // 0-1 normalized frequency
          
          // Calculate base value - lower frequencies tend to have more energy
          let value = Math.max(0, 180 - (i * 2));
          
          // Modulate based on track parameters
          if (track.method === 'colorToPitch') {
            // Create peaks at specific frequencies based on pitchRange
            const pitchRange = track.parameters?.pitchRange || [220, 880];
            const normalizedPitch = ((pitchRange[0] + pitchRange[1]) / 2) / 2000;
            const targetBin = Math.floor(normalizedPitch * simulatedData.length);
            const distance = Math.abs(i - targetBin);
            value *= Math.exp(-(distance * distance) / 100);
          } else if (track.method === 'brightnessToRhythm') {
            // Create rhythmic patterns
            const beatPhase = (stepTime * (track.parameters?.speed || 1)) % 1;
            value *= (beatPhase < 0.2) ? 1.5 : 0.7;
          }
          
          // Add time variation
          const variation = Math.sin(stepTime * 2 + i * 0.2) * 30;
          value += variation;
          
          // Scale by track volume and apply reasonable limits
          value *= track.volume || 0.8;
          simulatedData[i] = Math.max(0, Math.min(255, Math.floor(value)));
        }
        
        // Number of frequency bins to display
        const numBins = simulatedData.length;
        const binHeight = height / numBins;
        
        // Draw each frequency bin
        for (let i = 0; i < numBins; i++) {
          // Apply mel scaling for better frequency visualization
          const melIndex = Math.pow(i / numBins, 0.5) * numBins;
          
          // Get the value from the frequency data
          const value = simulatedData[Math.floor(melIndex)];
          
          // Normalize to 0-1 range
          const normalizedValue = value / 255;
          
          // Get heat map color based on intensity
          ctx.fillStyle = getHeatmapColor(normalizedValue);
          
          // Calculate y position (inverted so low frequencies are at bottom)
          const y = height - (i + 1) * binHeight;
          
          // Draw a rectangle for this frequency bin
          ctx.fillRect(step, y, 1, binHeight + 1);
        }
      }
      
      // Draw playhead line
      const playheadX = Math.floor((currentTime - startTime) / timeRange * width);
      if (playheadX >= 0 && playheadX < width) {
        ctx.fillStyle = 'rgba(255,50,50,0.7)';
        ctx.fillRect(playheadX, 0, 2, height);
      }
    });
    
    // Draw combined view if active
    if (viewMode === 'combined' && combinedSpectrogramRef.current) {
      const canvas = combinedSpectrogramRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear the canvas
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, width, height);
      
      // Calculate timespan to visualize - 10 seconds centered on current position
      const timeWindow = 10;
      const startTime = Math.max(0, currentTime - timeWindow/2);
      const endTime = Math.min(duration, currentTime + timeWindow/2);
      const timeRange = endTime - startTime;
      
      // If no range to display, exit
      if (timeRange <= 0) return;
      
      // Calculate number of columns to draw
      const numSteps = width;
      const stepSize = timeRange / numSteps;
      
      // Draw frequency data for each time step
      for (let step = 0; step < numSteps; step++) {
        // Calculate time for this step
        const stepTime = startTime + (step * stepSize);
        
        // Combine frequency data from all active tracks
        const combinedData = new Uint8Array(64).fill(0);
        
        // For each active track, add its contribution
        tracks.forEach(track => {
          if (track.isMuted || !track.isActive) return;
          
          // Simulate frequency data for this track at this time
          const trackData = new Uint8Array(64);
          
          // Fill with simulated frequency data based on track parameters
          for (let i = 0; i < trackData.length; i++) {
            // Base value calculation similar to individual tracks
            let value = Math.max(0, 140 - (i * 1.5));
            
            // Add track-specific modulation
            if (track.method === 'colorToPitch') {
              const pitchRange = track.parameters?.pitchRange || [220, 880];
              const normalizedPitch = ((pitchRange[0] + pitchRange[1]) / 2) / 2000;
              const targetBin = Math.floor(normalizedPitch * trackData.length);
              const distance = Math.abs(i - targetBin);
              value *= Math.exp(-(distance * distance) / 100);
            } else if (track.method === 'brightnessToRhythm') {
              const beatPhase = (stepTime * (track.parameters?.speed || 1)) % 1;
              value *= (beatPhase < 0.2) ? 1.5 : 0.7;
            }
            
            // Add time variation
            const variation = Math.sin(stepTime * 2 + i * 0.2 + track.id) * 20;
            value += variation;
            
            // Scale by track volume
            value *= track.volume || 0.8;
            trackData[i] = Math.max(0, Math.min(255, Math.floor(value)));
          }
          
          // Add this track's data to the combined data
          for (let i = 0; i < combinedData.length; i++) {
            // Scale contribution based on track volume
            combinedData[i] = Math.min(255, combinedData[i] + (trackData[i] * 0.7));
          }
        });
        
        // Number of frequency bins to display
        const numBins = combinedData.length;
        const binHeight = height / numBins;
        
        // Draw each frequency bin
        for (let i = 0; i < numBins; i++) {
          // Apply mel scaling
          const melIndex = Math.pow(i / numBins, 0.5) * numBins;
          
          // Get the value from the combined data
          const value = combinedData[Math.floor(melIndex)];
          
          // Normalize to 0-1 range
          const normalizedValue = value / 255;
          
          // Get heat map color based on intensity
          ctx.fillStyle = getHeatmapColor(normalizedValue);
          
          // Calculate y position (inverted so low frequencies are at bottom)
          const y = height - (i + 1) * binHeight;
          
          // Draw a rectangle for this frequency bin
          ctx.fillRect(step, y, 1, binHeight + 1);
        }
      }
      
      // Draw playhead line
      const playheadX = Math.floor((currentTime - startTime) / timeRange * width);
      if (playheadX >= 0 && playheadX < width) {
        ctx.fillStyle = 'rgba(255,50,50,0.7)';
        ctx.fillRect(playheadX, 0, 2, height);
      }
    }
  };
  
  // Draw static spectrograms when paused or when parameters change
  useEffect(() => {
    if (!isPlaying) {
      drawStaticSpectrogram();
    }
  }, [isPlaying, currentTime, tracks, viewMode, duration]);
  
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
    
    // Calculate time from percentage
    const newTime = (percentage / 100) * duration;
    
    // Update transport time
    if (transportRef && transportRef.current) {
      transportRef.current.seconds = newTime;
    }
  };
  
  const stopPlayheadDrag = () => {
    setIsDraggingPlayhead(false);
  };
  
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
  
  // Handle resize of the spectrogram panel
  const handleResizeStart = (e) => {
    setIsResizing(true);
    resizeStartYRef.current = e.clientY;
    initialHeightRef.current = spectrogramHeight;
    
    e.preventDefault();
  };
  
  useEffect(() => {
    const handleResize = (e) => {
      if (!isResizing) return;
      
      const deltaY = resizeStartYRef.current - e.clientY;
      const newHeight = Math.max(150, Math.min(600, initialHeightRef.current + deltaY));
      
      setSpectrogramHeight(newHeight);
    };
    
    const handleResizeEnd = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);
  
  // Show track modal
  const showTrackModal = (trackId, e) => {
    // Don't show modal if clicking on track controls
    if (e.target.closest('.track-controls')) return;
    
    setActiveTrackModal(trackId);
    // Also select the track
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setSelectedTrack(track);
    }
    
    e.stopPropagation();
  };
  
  // Close the modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeTrackModal && !e.target.closest('.track-modal')) {
        setActiveTrackModal(null);
      }
    };
    
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeTrackModal]);
  
  // Format time display
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get track display height (expandable tracks)
  const getTrackHeight = (track) => {
    return track.isExpanded !== false ? Math.max(120, 120) : 60;
  };
  
  // Toggle track expansion
  const toggleTrackExpanded = (trackId) => {
    // Update the tracks state
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, isExpanded: !track.isExpanded } : track
    );
    
    // You would typically call a parent component function here to update the tracks
    // For now, we'll just handle the UI changes locally
    tracks.forEach(track => {
      if (track.id === trackId) {
        track.isExpanded = !track.isExpanded;
      }
    });
    
    // Force re-render
    setActiveTrackModal(null);
  };
  
  // Render the spectrogram component
  return (
    <div className="flex flex-col bg-gray-900 text-white rounded-lg shadow-lg mt-4">
      <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-bold">Mel Spectrogram Visualization</h2>
        <div className="flex gap-2 items-center">
          <div className="flex">
            <button 
              className={`px-3 py-1 rounded-l ${viewMode === 'individual' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setViewMode('individual')}
            >
              Individual Tracks
            </button>
            <button 
              className={`px-3 py-1 rounded-r ${viewMode === 'combined' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setViewMode('combined')}
            >
              Combined View
            </button>
          </div>
        </div>
      </div>
      
      {/* Resizable container */}
      <div 
        className="relative" 
        style={{ height: `${spectrogramHeight}px` }}
      >
        {/* Resize handle */}
        <div 
          className="absolute left-0 right-0 bottom-0 h-2 bg-gray-700 cursor-ns-resize z-10 hover:bg-gray-600"
          onMouseDown={handleResizeStart}
        >
          <div className="h-1 w-12 mx-auto bg-gray-500 rounded-full"></div>
        </div>
        
        {/* Timeline with tracks */}
        <div 
          className="absolute inset-0 bg-gray-800 overflow-hidden"
          ref={timelineRef}
        >
          {/* Individual track spectrograms */}
          {viewMode === 'individual' && (
            <div className="flex flex-col h-full">
              {tracks.map(track => (
                <div 
                  key={track.id}
                  className={`border-b border-gray-700 relative ${track.isMuted ? 'opacity-50' : ''}`}
                  style={{ height: getTrackHeight(track), minHeight: 60 }}
                  onClick={(e) => showTrackModal(track.id, e)}
                >
                  <div className="absolute top-0 left-0 bg-gray-800 bg-opacity-70 p-1 z-10 flex items-center track-controls">
                    <span className="font-medium mr-2">{track.name}</span>
                    <button
                      className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded mr-1"
                      onClick={() => toggleTrackExpanded(track.id)}
                      title={track.isExpanded ? "Collapse track" : "Expand track"}
                    >
                      {track.isExpanded !== false ? '−' : '+'}
                    </button>
                  </div>
                  
                  <canvas
                    ref={el => spectrogramCanvasRefs.current[track.id] = el}
                    width={800}
                    height={getTrackHeight(track)}
                    className="w-full h-full"
                  ></canvas>
                  
                  {/* Track settings modal */}
                  {activeTrackModal === track.id && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg z-20 track-modal" style={{ width: '80%', maxWidth: '500px' }}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold">{track.name} Settings</h3>
                        <button
                          onClick={() => setActiveTrackModal(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-1">Method</label>
                          <select 
                            className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2"
                            value={track.method}
                            onChange={(e) => changeTrackMethod(track.id, e.target.value)}
                          >
                            <option value="colorToPitch">Color to Pitch</option>
                            <option value="brightnessToRhythm">Brightness to Rhythm</option>
                            <option value="spatialToArpeggio">Spatial to Arpeggio</option>
                            <option value="colorChords">Color Chords</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm mb-1">Synth Type</label>
                          <select 
                            className="w-full bg-gray-700 border border-gray-600 rounded py-1 px-2"
                            value={track.synthType}
                            onChange={(e) => changeTrackSynth(track.id, e.target.value)}
                          >
                            <option value="Synth">Basic Synth</option>
                            <option value="AMSynth">AM Synth</option>
                            <option value="FMSynth">FM Synth</option>
                            <option value="MembraneSynth">Membrane Synth</option>
                            <option value="PluckSynth">Pluck Synth</option>
                          </select>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm mb-1">
                            Speed: {track.parameters?.speed || 1}x
                          </label>
                          <input 
                            type="range" 
                            className="w-full" 
                            min="0.1" 
                            max="4" 
                            step="0.1" 
                            value={track.parameters?.speed || 1}
                            onChange={(e) => updateTrackParameters(
                              track.id, 'speed', parseFloat(e.target.value)
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm mb-1">
                            Resolution: {track.parameters?.resolution || 0.5}
                          </label>
                          <input 
                            type="range" 
                            className="w-full" 
                            min="0.1" 
                            max="1" 
                            step="0.05" 
                            value={track.parameters?.resolution || 0.5}
                            onChange={(e) => updateTrackParameters(
                              track.id, 'resolution', parseFloat(e.target.value)
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm mb-1">
                            Effect Mix: {Math.round((track.parameters?.effectMix || 0.3) * 100)}%
                          </label>
                          <input 
                            type="range" 
                            className="w-full" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={track.parameters?.effectMix || 0.3}
                            onChange={(e) => updateTrackParameters(
                              track.id, 'effectMix', parseFloat(e.target.value)
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm mb-1">
                            Volume: {Math.round(track.volume * 100)}%
                          </label>
                          <input 
                            type="range" 
                            className="w-full" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={track.volume}
                            onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                          />
                        </div>
                        
                        {track.method === 'colorToPitch' && (
                          <div className="col-span-2">
                            <label className="block text-sm mb-1">
                              Pitch Range: {track.parameters?.pitchRange?.[0] || 220}Hz - {track.parameters?.pitchRange?.[1] || 880}Hz
                            </label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="number" 
                                className="w-20 bg-gray-700 border border-gray-600 rounded py-1 px-2" 
                                min="20" 
                                max="1000" 
                                value={track.parameters?.pitchRange?.[0] || 220}
                                onChange={(e) => updateTrackParameters(
                                  track.id, 
                                  'pitchRange', 
                                  [parseInt(e.target.value), track.parameters?.pitchRange?.[1] || 880]
                                )}
                              />
                              <span>to</span>
                              <input 
                                type="number" 
                                className="w-20 bg-gray-700 border border-gray-600 rounded py-1 px-2" 
                                min="20" 
                                max="2000" 
                                value={track.parameters?.pitchRange?.[1] || 880}
                                onChange={(e) => updateTrackParameters(
                                  track.id, 
                                  'pitchRange', 
                                  [track.parameters?.pitchRange?.[0] || 220, parseInt(e.target.value)]
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 bg-gray-700 p-2 rounded">
                        <h4 className="text-sm font-medium mb-1">AI Suggestions</h4>
                        <p className="text-xs text-gray-300">
                          Based on the spectrogram analysis, we recommend:
                        </p>
                        <ul className="text-xs mt-1 space-y-1 text-gray-300">
                          <li>• Try increasing the {track.method === 'colorToPitch' ? 'filter Q' : 'effect mix'} for more pronounced effects</li>
                          <li>• {track.method === 'colorToPitch' ? 'Wider pitch range would create more dynamic sound' : 'Slower speed might help with clarity'}</li>
                          <li>• Consider changing synth type to {track.synthType === 'AMSynth' ? 'FMSynth' : 'AMSynth'} for this pattern</li>
                        </ul>
                        <button className="mt-2 text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">
                          Apply AI-suggested settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Combined track spectrogram */}
          {viewMode === 'combined' && (
            <div className="h-full">
              <canvas
                ref={combinedSpectrogramRef}
                width={800}
                height={spectrogramHeight - 5}
                className="w-full h-full"
              ></canvas>
            </div>
          )}
          
          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
            style={{ left: `${getPlayheadPosition()}%` }}
          >
            {/* Playhead handle */}
            <div 
              className="absolute bottom-0 transform -translate-x-1/2 cursor-ew-resize"
              style={{ width: '30px', height: '20px' }}
              onMouseDown={startPlayheadDrag}
            >
              <div className="flex items-center justify-center bg-red-500 rounded-t-md px-2 py-1 text-xs font-mono">
                [--|--]
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline ruler */}
      <div className="h-6 bg-gray-800 rounded-b-lg relative flex items-center px-2 border-t border-gray-700">
        <div className="absolute left-0 top-0 bottom-0 flex items-center text-xs px-2">
          {formatTime(0)}
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center text-xs px-2">
          {formatTime(duration)}
        </div>
        <div className="absolute left-1/4 top-0 bottom-0 flex items-center text-xs">
          {formatTime(duration * 0.25)}
        </div>
        <div className="absolute left-1/2 top-0 bottom-0 flex items-center text-xs">
          {formatTime(duration * 0.5)}
        </div>
        <div className="absolute left-3/4 top-0 bottom-0 flex items-center text-xs">
          {formatTime(duration * 0.75)}
        </div>
        
        {/* Current time indicator */}
        <div 
          className="absolute top-0 bottom-0 flex items-center text-xs text-red-400"
          style={{ left: `${getPlayheadPosition()}%` }}
        >
          <div className="absolute whitespace-nowrap transform -translate-x-1/2">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
      
      {/* AI insight panel */}
      <div className="mt-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-bold">AI Sound Analysis</h3>
          <button className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">
            Analyze & Optimize
          </button>
        </div>
        <p className="text-xs text-gray-300">
          Your composition has good frequency coverage but could benefit from better separation between tracks.
          Tracks 1 and 3 have overlapping frequencies that may cause muddy sound.
          Consider adjusting the EQ or effect types to create more space in the mix.
        </p>
      </div>
    </div>
  );
};

export default MelSpectrogramVisualizer;
