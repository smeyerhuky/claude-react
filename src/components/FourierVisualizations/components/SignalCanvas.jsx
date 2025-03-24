import React, { forwardRef, useEffect, useRef } from 'react';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { drawSignal, drawAxes } from '../utils/drawingUtils';

/**
 * Canvas component for drawing and displaying signals
 * 
 * This component handles both:
 * 1. Interactive drawing of signals by the user
 * 2. Display of signals (original or reconstructed)
 * 
 * It uses a forward ref to allow parent components to access the canvas element
 */
const SignalCanvas = forwardRef(({
  width = 400,
  height = 300,
  points = [],
  originalPoints = [],
  showOriginal = false,
  approximation = false,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  backgroundColor = 'white',
  signalColor = 'blue',
  originalColor = 'rgba(0, 0, 255, 0.3)',
  approximationColor = 'red',
  lineWidth = 2,
  axisColor = '#ccc'
}, ref) => {
  // If ref is not provided, create an internal ref
  const internalCanvasRef = useRef(null);
  const canvasRef = ref || internalCanvasRef;
  
  // Use responsive canvas hook to handle scaling for high-DPI displays
  const { dpr, canvasWidth, canvasHeight } = useResponsiveCanvas(canvasRef, width, height);
  
  // Function to convert touch event to mouse event coordinates
  const getTouchPosition = (touchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
    
    return {
      x: (touch.clientX - rect.left) * dpr,
      y: (touch.clientY - rect.top) * dpr
    };
  };
  
  // Handler for touch events
  const handleTouchStart = (e) => {
    if (onTouchStart) {
      e.preventDefault(); // Prevent scrolling
      const { x, y } = getTouchPosition(e);
      onTouchStart({ clientX: x, clientY: y, preventDefault: () => {} });
    }
  };
  
  const handleTouchMove = (e) => {
    if (onTouchMove) {
      e.preventDefault(); // Prevent scrolling
      const { x, y } = getTouchPosition(e);
      onTouchMove({ clientX: x, clientY: y, preventDefault: () => {} });
    }
  };
  
  const handleTouchEnd = (e) => {
    if (onTouchEnd) {
      e.preventDefault();
      onTouchEnd();
    }
  };
  
  // Draw on canvas whenever points change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    drawAxes(ctx, canvas.width, canvas.height, axisColor);
    
    // Draw original signal if needed
    if (showOriginal && originalPoints && originalPoints.length > 0) {
      drawSignal(ctx, originalPoints, originalColor, lineWidth);
    }
    
    // Draw the main signal
    if (points && points.length > 0) {
      drawSignal(ctx, points, approximation ? approximationColor : signalColor, lineWidth);
    }
  }, [points, originalPoints, showOriginal, approximation, backgroundColor, signalColor, originalColor, approximationColor, lineWidth, axisColor]);
  
  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="signal-canvas border rounded"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        touchAction: 'none' // Prevent browser handling of touch gestures
      }}
    />
  );
});

// Display name for debugging
SignalCanvas.displayName = 'SignalCanvas';

export default SignalCanvas;