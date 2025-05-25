import { useRef, useCallback, useEffect } from 'react';

// Custom hook for audio visualization
export const useVisualization = (getFrequencyData, isPlaying) => {
  const animationIdRef = useRef(null);
  const canvasRefs = useRef({});
  
  // Register canvas for visualization
  const registerCanvas = useCallback((id, canvas) => {
    if (canvas) {
      canvasRefs.current[id] = canvas;
    } else {
      delete canvasRefs.current[id];
    }
  }, []);
  
  // Draw waveform
  const drawWaveform = useCallback((canvas, audioBuffer) => {
    if (!canvas || !audioBuffer) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size for high DPI displays
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw waveform
    const channelData = audioBuffer.getChannelData(0);
    const samples = Math.min(width * 2, channelData.length);
    const step = Math.floor(channelData.length / samples);
    
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * width;
      const sample = channelData[i * step] || 0;
      const y = height / 2 + (sample * height / 2 * 0.8);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }, []);
  
  // Draw frequency spectrum
  const drawFrequencySpectrum = useCallback((canvas) => {
    if (!canvas || !getFrequencyData) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const height = rect.height;
    
    // Get frequency data
    const dataArray = getFrequencyData();
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw bars
    const barCount = 32;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const value = (dataArray[Math.floor(i * dataArray.length / barCount)] + 140) / 140;
      const barHeight = Math.max(0, value) * height * 0.8;
      const hue = (i / barCount) * 120 + 180; // Blue to cyan
      
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
  }, [getFrequencyData]);
  
  // Draw spectrogram
  const drawSpectrogram = useCallback((canvas) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Simple spectrogram visualization
    const timeSteps = 100;
    const freqBins = 40;
    
    const stepX = width / timeSteps;
    const stepY = height / freqBins;
    
    for (let t = 0; t < timeSteps; t++) {
      for (let f = 0; f < freqBins; f++) {
        let amplitude = Math.random() * 0.3;
        
        // Add some structure
        if (f < 10) amplitude += Math.sin(t * 0.1) * 0.4; // Bass
        if (f > 20 && f < 30) amplitude += Math.sin(t * 0.05) * 0.3; // Mids
        if (f > 30) amplitude += Math.random() * 0.2; // Highs
        
        amplitude = Math.max(0, Math.min(1, amplitude));
        
        // Color mapping
        let r, g, b;
        if (amplitude < 0.5) {
          r = 0;
          g = Math.floor(amplitude * 2 * 255);
          b = 255;
        } else {
          r = Math.floor((amplitude - 0.5) * 2 * 255);
          g = 255 - Math.floor((amplitude - 0.5) * 2 * 255);
          b = 0;
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          t * stepX, 
          height - (f + 1) * stepY, 
          Math.ceil(stepX), 
          Math.ceil(stepY)
        );
      }
    }
  }, []);
  
  // Animation loop
  const animate = useCallback(() => {
    // Update frequency spectrum
    const frequencyCanvas = canvasRefs.current['frequency'];
    if (frequencyCanvas) {
      drawFrequencySpectrum(frequencyCanvas);
    }
    
    // Continue animation if playing
    if (isPlaying) {
      animationIdRef.current = requestAnimationFrame(animate);
    }
  }, [drawFrequencySpectrum, isPlaying]);
  
  // Start/stop animation based on playback state
  useEffect(() => {
    if (isPlaying) {
      animate();
    } else if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isPlaying, animate]);
  
  return {
    registerCanvas,
    drawWaveform,
    drawFrequencySpectrum,
    drawSpectrogram
  };
};