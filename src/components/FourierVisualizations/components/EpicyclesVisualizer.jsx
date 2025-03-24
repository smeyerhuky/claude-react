import React, { useEffect, useRef, useState } from 'react';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { useAnimationFrame } from '../hooks/useAnimationFrame';

/**
 * Component that visualizes Fourier series as a set of rotating circles (epicycles)
 * Each circle represents a term in the Fourier series
 */
const EpicyclesVisualizer = ({
  coefficients = [],
  time = 0,
  width = 300,
  height = 300,
  maxCircles = 20,
  trailLength = 100,
  circleColor = 'rgba(0, 0, 255, 0.3)',
  lineColor = 'rgba(0, 0, 255, 0.5)',
  trailColor = 'blue',
  dotColor = 'red',
  backgroundColor = 'white'
}) => {
  const canvasRef = useRef(null);
  
  // State for trail of points drawn by the epicycles
  const [trail, setTrail] = useState([]);
  
  // Use responsive canvas hook to handle scaling for high-DPI displays
  const { dpr, canvasWidth, canvasHeight } = useResponsiveCanvas(canvasRef, width, height);
  
  // Update trail when time changes
  useEffect(() => {
    if (coefficients.length === 0) return;
    
    // Calculate the final point of the epicycles
    let x = 0;
    let y = 0;
    
    // Sort coefficients by frequency
    const sortedCoeffs = [...coefficients].sort((a, b) => Math.abs(a.frequency) - Math.abs(b.frequency));
    
    // Limit the number of circles to maxCircles
    const limitedCoeffs = sortedCoeffs.slice(0, maxCircles);
    
    // Calculate position based on epicycles
    for (const coef of limitedCoeffs) {
      const { frequency, amplitude, phase } = coef;
      const angle = frequency * time + phase;
      
      x += amplitude * Math.cos(angle);
      y += amplitude * Math.sin(angle);
    }
    
    // Add point to trail
    setTrail(prevTrail => {
      const newTrail = [...prevTrail, { x, y }];
      // Limit trail length
      if (newTrail.length > trailLength) {
        return newTrail.slice(newTrail.length - trailLength);
      }
      return newTrail;
    });
  }, [coefficients, time, maxCircles, trailLength]);
  
  // Draw the visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || coefficients.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sort coefficients by frequency
    const sortedCoeffs = [...coefficients].sort((a, b) => Math.abs(a.frequency) - Math.abs(b.frequency));
    
    // Limit the number of circles to maxCircles
    const limitedCoeffs = sortedCoeffs.slice(0, maxCircles);
    
    // Draw epicycles
    let x = centerX;
    let y = centerY;
    
    // Draw each circle and line
    for (const coef of limitedCoeffs) {
      const { frequency, amplitude, phase } = coef;
      const angle = frequency * time + phase;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, amplitude, 0, 2 * Math.PI);
      ctx.strokeStyle = circleColor;
      ctx.stroke();
      
      // Calculate next center point
      const nextX = x + amplitude * Math.cos(angle);
      const nextY = y + amplitude * Math.sin(angle);
      
      // Draw line from center to edge
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nextX, nextY);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Update current position for next circle
      x = nextX;
      y = nextY;
    }
    
    // Draw the trail
    if (trail.length > 1) {
      ctx.beginPath();
      
      // Start from the first point
      ctx.moveTo(centerX + trail[0].x, centerY + trail[0].y);
      
      // Connect the dots
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(centerX + trail[i].x, centerY + trail[i].y);
      }
      
      ctx.strokeStyle = trailColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw a dot at the end
    if (trail.length > 0) {
      const lastPoint = trail[trail.length - 1];
      ctx.beginPath();
      ctx.arc(centerX + lastPoint.x, centerY + lastPoint.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }
    
  }, [coefficients, time, trail, maxCircles, circleColor, lineColor, trailColor, dotColor, backgroundColor]);
  
  // Return the canvas element
  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="epicycles-visualizer border rounded"
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    />
  );
};

export default EpicyclesVisualizer;
