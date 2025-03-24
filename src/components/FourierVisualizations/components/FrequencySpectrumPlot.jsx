import React, { useEffect, useRef } from 'react';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { drawAxes } from '../utils/drawingUtils';

/**
 * Component for visualizing the frequency spectrum of a signal
 * Can display magnitude, phase, or real/imaginary components
 */
const FrequencySpectrumPlot = ({
  frequencyData = [],
  displayMode = 'magnitude', // 'magnitude', 'phase', 'real', 'imaginary'
  width = 500,
  height = 300,
  scale = 1,
  lowPassCutoff = 1.0,
  highPassCutoff = 0.0,
  barColor = 'blue',
  cutoffColor = 'red',
  backgroundColor = 'white',
  axisColor = '#ccc'
}) => {
  const canvasRef = useRef(null);
  
  // Use responsive canvas hook to handle scaling for high-DPI displays
  const { dpr, canvasWidth, canvasHeight } = useResponsiveCanvas(canvasRef, width, height);
  
  // Draw spectrum whenever data or display settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frequencyData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    drawAxes(ctx, canvas.width, canvas.height, axisColor);
    
    // Get the correct data based on display mode
    const getData = (item) => {
      switch (displayMode) {
        case 'magnitude':
          return item.magnitude;
        case 'phase':
          return item.phase;
        case 'real':
          return item.real;
        case 'imaginary':
          return item.imaginary;
        default:
          return item.magnitude;
      }
    };
    
    // Find maximum value for scaling
    let maxValue = Math.max(
      ...frequencyData.map(item => Math.abs(getData(item)))
    );
    
    // If all values are 0, set a default max value
    if (maxValue === 0) maxValue = 1;
    
    // Calculate bar width based on canvas size and number of frequencies
    const barWidth = canvas.width / frequencyData.length;
    // Reserve space at the top and bottom
    const padding = 20;
    const availableHeight = canvas.height - 2 * padding;
    
    // Draw frequency bars
    frequencyData.forEach((item, index) => {
      const normFrequency = index / frequencyData.length;
      const x = index * barWidth;
      
      // Get value based on current display mode
      const value = getData(item);
      
      // Scale the value (apply user scale and normalize by max value)
      const normalizedValue = (value / maxValue) * scale;
      
      // Determine if this frequency is being filtered
      const isFiltered = normFrequency > lowPassCutoff || normFrequency < highPassCutoff;
      
      // For phase, center at the middle
      let barHeight, y;
      if (displayMode === 'phase') {
        // Phase ranges from -π to π, so center it
        const normalizedPhase = normalizedValue / (Math.PI * 2) * availableHeight;
        barHeight = Math.abs(normalizedPhase);
        y = canvas.height / 2 - (normalizedPhase > 0 ? barHeight : 0);
      } else {
        // For magnitude, real, imaginary - start from bottom
        barHeight = Math.abs(normalizedValue) * availableHeight;
        y = canvas.height - padding - barHeight;
        
        // For real and imaginary, values can be negative
        if ((displayMode === 'real' || displayMode === 'imaginary') && value < 0) {
          y = canvas.height / 2;
        }
      }
      
      // Draw bar
      ctx.fillStyle = isFiltered ? `rgba(200, 200, 200, 0.3)` : barColor;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
    
    // Draw cutoff lines
    if (lowPassCutoff < 1.0) {
      const cutoffX = lowPassCutoff * canvas.width;
      ctx.beginPath();
      ctx.moveTo(cutoffX, 0);
      ctx.lineTo(cutoffX, canvas.height);
      ctx.strokeStyle = cutoffColor;
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw label
      ctx.fillStyle = cutoffColor;
      ctx.font = '12px Arial';
      ctx.fillText('Low-pass', cutoffX + 5, 15);
    }
    
    if (highPassCutoff > 0.0) {
      const cutoffX = highPassCutoff * canvas.width;
      ctx.beginPath();
      ctx.moveTo(cutoffX, 0);
      ctx.lineTo(cutoffX, canvas.height);
      ctx.strokeStyle = cutoffColor;
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw label
      ctx.fillStyle = cutoffColor;
      ctx.font = '12px Arial';
      ctx.fillText('High-pass', cutoffX - 60, 15);
    }
    
    // Draw labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('Frequency', canvas.width / 2, canvas.height - 5);
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(10, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(displayMode.charAt(0).toUpperCase() + displayMode.slice(1), 0, 0);
    ctx.restore();
    
  }, [frequencyData, displayMode, scale, lowPassCutoff, highPassCutoff, barColor, cutoffColor, backgroundColor, axisColor]);
  
  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="frequency-spectrum-plot border rounded"
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    />
  );
};

export default FrequencySpectrumPlot;
