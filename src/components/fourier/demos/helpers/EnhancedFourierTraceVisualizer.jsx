import React, { useState, useEffect, useRef, useCallback } from 'react';

// Enhanced trace visualization for Fourier Series Explorer
const EnhancedFourierTraceVisualizer = ({
  width = 800,
  height = 400,
  coefficients = [],
  targetFunction = 'square',
  isDarkMode = false,
  animationSpeed = 1,
  numTerms = 5,
  evaluateFourierSeries = null, // Function to evaluate Fourier series
  evaluateTargetFunction = null, // Function to evaluate target function
}) => {
  // Canvas refs
  const mainCanvasRef = useRef(null);
  const traceCanvasRef = useRef(null);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [timePosition, setTimePosition] = useState(0); // 0-100 for scrubber
  const animationRef = useRef(null);
  
  // Trace state
  const [tracePoints, setTracePoints] = useState([]);
  const [tracePersistence, setTracePersistence] = useState('fade'); // 'fade', 'persist', 'window'
  const [traceLength, setTraceLength] = useState(500); // Max points to display
  const [showPhaseDiagram, setShowPhaseDiagram] = useState(false);
  
  // Theme colors based on dark mode
  const theme = {
    bg: isDarkMode ? '#222' : '#fff',
    grid: isDarkMode ? '#444' : '#e5e5e5',
    trace: isDarkMode ? '#f55' : '#f00',
    target: isDarkMode ? '#aaa' : '#999',
    epicycle: isDarkMode ? '#55a' : '#33c',
    text: isDarkMode ? '#ccc' : '#666',
  };
  
  // Constants for visualization
  const yScale = height / 4;
  const yOffset = height / 2;
  const xScale = width / (2 * Math.PI);
  
  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;
    
    const animate = () => {
      setAnimationFrame(prev => prev + animationSpeed);
      // Update time position for scrubber (0-100)
      setTimePosition(prev => (prev + animationSpeed / 2) % 100);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, animationSpeed]);

  // Main drawing function
  const drawVisualization = useCallback(() => {
    // Get canvas contexts
    const mainCtx = mainCanvasRef.current?.getContext('2d');
    const traceCtx = traceCanvasRef.current?.getContext('2d');
    if (!mainCtx || !traceCtx || !evaluateFourierSeries || !evaluateTargetFunction) return;
    
    // Clear canvases
    mainCtx.fillStyle = theme.bg;
    mainCtx.fillRect(0, 0, width, height);
    traceCtx.fillStyle = theme.bg;
    traceCtx.fillRect(0, 0, width, height);
    
    // Calculate current time from animation frame
    const time = (animationFrame % 200) / 100 * Math.PI;
    
    // Draw grid on main canvas
    drawGrid(mainCtx);
    
    // Draw epicycles
    const finalPoint = drawEpicycles(mainCtx, time);
    
    // Draw trace
    drawTrace(traceCtx, time, finalPoint);
    
    // Draw time scrubber
    drawTimeScrubber(mainCtx);
    
    // Add current point to trace points
    if (isAnimating && finalPoint) {
      updateTracePoints(time, finalPoint);
    }
  }, [animationFrame, coefficients, numTerms, tracePersistence, traceLength, showPhaseDiagram]);
  
  // Draw grid
  const drawGrid = (ctx) => {
    // Horizontal lines
    for (let y = -2; y <= 2; y += 0.5) {
      ctx.beginPath();
      ctx.strokeStyle = y === 0 ? theme.grid : theme.grid + '80';
      ctx.lineWidth = y === 0 ? 1.5 : 0.5;
      ctx.moveTo(0, yOffset + y * yScale);
      ctx.lineTo(width, yOffset + y * yScale);
      ctx.stroke();
    }
    
    // Vertical lines (every π/2)
    for (let x = 0; x <= 2 * Math.PI; x += Math.PI / 2) {
      ctx.beginPath();
      ctx.strokeStyle = theme.grid + '80';
      ctx.lineWidth = 0.5;
      ctx.moveTo(x * xScale, 0);
      ctx.lineTo(x * xScale, height);
      ctx.stroke();
    }
    
    // Add labels
    ctx.fillStyle = theme.text;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('0', 0, yOffset + 15);
    ctx.fillText('π/2', Math.PI/2 * xScale, yOffset + 15);
    ctx.fillText('π', Math.PI * xScale, yOffset + 15);
    ctx.fillText('3π/2', Math.PI*1.5 * xScale, yOffset + 15);
    ctx.fillText('2π', Math.PI*2 * xScale, yOffset + 15);
  };
  
  // Draw epicycles
  const drawEpicycles = (ctx, time) => {
    // Center point for epicycles
    const centerX = width / 4;
    const centerY = yOffset;
    
    // Get active coefficients
    const activeCoeffs = coefficients.slice(0, numTerms);
    
    // Sort by amplitude for better visualization
    const sortedCoeffs = activeCoeffs.map((coeff, idx) => ({
      ...coeff,
      n: idx + 1,
      amplitude: Math.sqrt(coeff.a * coeff.a + coeff.b * coeff.b)
    })).sort((a, b) => b.amplitude - a.amplitude);
    
    // Draw each epicycle
    let x = centerX;
    let y = centerY;
    
    // Draw circles and vectors
    for (let i = 0; i < sortedCoeffs.length; i++) {
      const { a, b, n, amplitude } = sortedCoeffs[i];
      if (amplitude < 0.01) continue;
      
      // Calculate rotation angle
      const angle = n * time;
      const phase = Math.atan2(b, a);
      
      // Draw circle
      ctx.beginPath();
      ctx.strokeStyle = theme.epicycle + '40';
      ctx.lineWidth = 1;
      ctx.arc(x, y, amplitude * yScale, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Calculate endpoint
      const dx = amplitude * Math.cos(angle + phase) * yScale;
      const dy = amplitude * Math.sin(angle + phase) * yScale;
      
      // Draw vector
      ctx.beginPath();
      ctx.strokeStyle = theme.epicycle;
      ctx.lineWidth = 2;
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
      
      // Draw small circle at end of vector
      ctx.beginPath();
      ctx.fillStyle = theme.epicycle;
      ctx.arc(x + dx, y + dy, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Update position for next circle
      x += dx;
      y += dy;
    }
    
    // Draw final point (larger)
    ctx.beginPath();
    ctx.fillStyle = theme.trace;
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw connector line from epicycles to wave trace
    ctx.beginPath();
    ctx.strokeStyle = theme.trace + '80';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(x, y);
    ctx.lineTo(time * xScale, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw vertical line at current time
    ctx.beginPath();
    ctx.strokeStyle = theme.trace + '80';
    ctx.lineWidth = 1;
    ctx.moveTo(time * xScale, 0);
    ctx.lineTo(time * xScale, height);
    ctx.stroke();
    
    return { x: time * xScale, y };
  };
  
  // Update trace points
  const updateTracePoints = (time, finalPoint) => {
    setTracePoints(prev => {
      // Add new point
      const newPoints = [...prev, { time, x: time * xScale, y: finalPoint.y }];
      
      // If limited persistence, keep only recent points
      if (tracePersistence === 'fade' || tracePersistence === 'window') {
        return newPoints.slice(-traceLength);
      }
      
      // For full persistence, keep track of one full cycle (2π)
      const fullCycleTime = 2 * Math.PI;
      return newPoints.filter(p => (time - p.time) < fullCycleTime);
    });
  };
  
  // Draw trace
  const drawTrace = (ctx, time, finalPoint) => {
    if (!tracePoints.length) return;
    
    // Target function (for comparison)
    ctx.beginPath();
    ctx.strokeStyle = theme.target + '60';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < width; i += 2) {
      const x = i / xScale;
      const y = evaluateTargetFunction(targetFunction, x);
      if (i === 0) {
        ctx.moveTo(i, yOffset - y * yScale);
      } else {
        ctx.lineTo(i, yOffset - y * yScale);
      }
    }
    ctx.stroke();
    
    // Determine visible points based on persistence mode
    let visiblePoints = tracePoints;
    if (tracePersistence === 'window') {
      // Show only points within the current window
      const windowStart = Math.max(0, time - 2 * Math.PI);
      visiblePoints = tracePoints.filter(p => p.time >= windowStart && p.time <= time);
    }
    
    // Draw trace path
    if (visiblePoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = theme.trace;
      ctx.lineWidth = 2;
      
      let started = false;
      
      for (const point of visiblePoints) {
        // For windowed view, map the x position
        const x = tracePersistence === 'window' 
          ? ((point.time - (time - 2 * Math.PI)) / (2 * Math.PI)) * width
          : (point.time % (2 * Math.PI)) * xScale;
          
        if (!started) {
          ctx.moveTo(x, point.y);
          started = true;
        } else {
          ctx.lineTo(x, point.y);
        }
      }
      
      ctx.stroke();
      
      // Draw points with fading effect
      if (tracePersistence === 'fade') {
        visiblePoints.forEach((point, index) => {
          // Calculate opacity based on age (newer points are more opaque)
          const age = (time - point.time) / (2 * Math.PI);
          const opacity = Math.max(0.1, 1 - age);
          
          // Calculate x position
          const x = (point.time % (2 * Math.PI)) * xScale;
          
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
          const dotSize = Math.max(2, 4 * opacity);
          ctx.arc(x, point.y, dotSize, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    }
    
    // Draw phase diagram if enabled
    if (showPhaseDiagram) {
      drawPhaseDiagram(ctx);
    }
  };
  
  // Draw phase diagram (shows relationship between position and velocity)
  const drawPhaseDiagram = (ctx) => {
    if (tracePoints.length < 2) return;
    
    // Calculate derivatives from points
    const derivatives = [];
    
    for (let i = 1; i < tracePoints.length; i++) {
      const p1 = tracePoints[i-1];
      const p2 = tracePoints[i];
      
      // Calculate derivative (velocity)
      const dy = p2.y - p1.y;
      const dt = p2.time - p1.time;
      const derivative = dt === 0 ? 0 : dy / dt;
      
      derivatives.push({
        y: p2.y,
        dy: derivative,
        time: p2.time
      });
    }
    
    // Draw phase diagram in corner
    const diagramSize = 100;
    const diagramX = width - diagramSize - 10;
    const diagramY = 10;
    
    // Background
    ctx.fillStyle = theme.bg + 'D0';
    ctx.fillRect(diagramX, diagramY, diagramSize, diagramSize);
    ctx.strokeStyle = theme.grid;
    ctx.strokeRect(diagramX, diagramY, diagramSize, diagramSize);
    
    // Axes
    ctx.beginPath();
    ctx.strokeStyle = theme.grid;
    ctx.moveTo(diagramX, diagramY + diagramSize/2);
    ctx.lineTo(diagramX + diagramSize, diagramY + diagramSize/2);
    ctx.moveTo(diagramX + diagramSize/2, diagramY);
    ctx.lineTo(diagramX + diagramSize/2, diagramY + diagramSize);
    ctx.stroke();
    
    // Plot phase points
    ctx.beginPath();
    ctx.strokeStyle = theme.trace;
    
    // Scale factors for diagram
    const yMax = Math.max(...derivatives.map(d => Math.abs(d.y - yOffset)));
    const dyMax = Math.max(...derivatives.map(d => Math.abs(d.dy)));
    
    const yScale = (diagramSize/2) / (yMax || 1);
    const dyScale = (diagramSize/2) / (dyMax || 1);
    
    let first = true;
    for (const point of derivatives) {
      const x = diagramX + diagramSize/2 + (point.y - yOffset) * yScale;
      const y = diagramY + diagramSize/2 - point.dy * dyScale;
      
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Label
    ctx.fillStyle = theme.text;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Phase Diagram', diagramX + diagramSize/2, diagramY + diagramSize + 12);
  };
  
  // Draw time scrubber
  const drawTimeScrubber = (ctx) => {
    const scrubberHeight = 20;
    const scrubberY = height - scrubberHeight - 10;
    
    // Draw scrubber background
    ctx.fillStyle = theme.bg + '80';
    ctx.fillRect(0, scrubberY, width, scrubberHeight);
    ctx.strokeStyle = theme.grid;
    ctx.strokeRect(0, scrubberY, width, scrubberHeight);
    
    // Draw time markers
    for (let i = 0; i <= 4; i++) {
      const x = i * width / 4;
      ctx.beginPath();
      ctx.moveTo(x, scrubberY);
      ctx.lineTo(x, scrubberY + scrubberHeight);
      ctx.strokeStyle = theme.grid;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = theme.text;
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${i * Math.PI/2}π`, x, scrubberY + scrubberHeight + 12);
    }
    
    // Draw current position
    const scrubberX = timePosition / 100 * width;
    ctx.beginPath();
    ctx.arc(scrubberX, scrubberY + scrubberHeight/2, 6, 0, 2 * Math.PI);
    ctx.fillStyle = theme.trace;
    ctx.fill();
  };
  
  // Handle scrubber drag
  const handleScrubberMouseDown = (e) => {
    const rect = mainCanvasRef.current.getBoundingClientRect();
    const scrubberHeight = 20;
    const scrubberY = height - scrubberHeight - 10;
    
    const x = (e.clientX - rect.left) * (mainCanvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (mainCanvasRef.current.height / rect.height);
    
    // Check if click is in scrubber area
    if (y >= scrubberY && y <= scrubberY + scrubberHeight) {
      // Pause animation
      setIsAnimating(false);
      
      // Set time position based on click
      const newTimePosition = (x / width) * 100;
      setTimePosition(newTimePosition);
      
      // Update animation frame to match
      setAnimationFrame((newTimePosition / 100) * 200);
      
      // Add mouse move and mouse up listeners
      document.addEventListener('mousemove', handleScrubberMouseMove);
      document.addEventListener('mouseup', handleScrubberMouseUp);
    }
  };
  
  const handleScrubberMouseMove = (e) => {
    const rect = mainCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (mainCanvasRef.current.width / rect.width);
    
    // Update time position (clamped to 0-100)
    const newTimePosition = Math.max(0, Math.min(100, (x / width) * 100));
    setTimePosition(newTimePosition);
    
    // Update animation frame to match
    setAnimationFrame((newTimePosition / 100) * 200);
  };
  
  const handleScrubberMouseUp = () => {
    // Remove listeners
    document.removeEventListener('mousemove', handleScrubberMouseMove);
    document.removeEventListener('mouseup', handleScrubberMouseUp);
  };
  
  // Step forward/backward in animation
  const stepForward = () => {
    // Pause animation
    setIsAnimating(false);
    
    // Step forward by a small amount
    setTimePosition(prev => Math.min(100, prev + 1));
    setAnimationFrame(prev => prev + 2);
  };
  
  const stepBackward = () => {
    // Pause animation
    setIsAnimating(false);
    
    // Step backward by a small amount
    setTimePosition(prev => Math.max(0, prev - 1));
    setAnimationFrame(prev => Math.max(0, prev - 2));
  };
  
  // Update canvas when parameters change
  useEffect(() => {
    drawVisualization();
  }, [
    animationFrame, 
    coefficients, 
    numTerms, 
    tracePoints, 
    tracePersistence, 
    traceLength, 
    showPhaseDiagram,
    drawVisualization
  ]);
  
  return (
    <div className="fourier-trace-visualizer">
      <div className="canvas-container relative">
        {/* Main canvas for epicycles and UI elements */}
        <canvas
          ref={mainCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0"
          onMouseDown={handleScrubberMouseDown}
        />
        
        {/* Trace canvas (rendered below main canvas) */}
        <canvas
          ref={traceCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 z-0"
        />
      </div>
      
      {/* Controls */}
      <div className={`controls mt-4 p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex flex-wrap gap-3 justify-between items-center">
          {/* Animation controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAnimating(!isAnimating)}
              className={`px-3 py-1 rounded ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`}
            >
              {isAnimating ? 'Pause' : 'Play'}
            </button>
            
            <button 
              onClick={stepBackward}
              className={`px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
            >
              &lt;
            </button>
            
            <button 
              onClick={stepForward}
              className={`px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
            >
              &gt;
            </button>
          </div>
          
          {/* Trace options */}
          <div className="flex items-center gap-2">
            <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Trace:
              <select
                value={tracePersistence}
                onChange={(e) => setTracePersistence(e.target.value)}
                className={`ml-1 px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
              >
                <option value="fade">Fading</option>
                <option value="persist">Persistent</option>
                <option value="window">Windowed</option>
              </select>
            </label>
            
            <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input 
                type="checkbox" 
                checked={showPhaseDiagram}
                onChange={(e) => setShowPhaseDiagram(e.target.checked)}
                className="mr-1"
              />
              Phase Diagram
            </label>
          </div>
          
          {/* Length control */}
          <div className="flex items-center gap-1">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Length: {traceLength}
            </span>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={traceLength}
              onChange={(e) => setTraceLength(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFourierTraceVisualizer;