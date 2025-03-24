import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as math from 'mathjs';

const FourierSeriesExplorer = () => {
  // Canvas ref for the main visualization
  const canvasRef = useRef(null);
  
  // Function parameters
  const [targetFunction, setTargetFunction] = useState('square');
  const [numTerms, setNumTerms] = useState(25);
  const [customEquation, setCustomEquation] = useState('x^2 - PI^2/3');
  
  // Display options
  const [viewMode, setViewMode] = useState('combined'); // 'combined', 'epicycles', or 'trace'
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Animation controls
  const [animationFrame, setAnimationFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);
  const [tracePoints, setTracePoints] = useState([]);
  const [maxTracePoints, setMaxTracePoints] = useState(1500);
  
  // Drawing mode
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  
  // Zoom and pan
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  
  // Show zoom/pan controls
  const [showControls, setShowControls] = useState(false);
  
  // Animation refs
  const animationRef = useRef(null);
  const lastRenderTimeRef = useRef(0);
  
  // Constants for drawing
  const canvasWidth = 800;
  const canvasHeight = 400;
  
  // Layout constants based on view mode
  const getLayout = () => {
    switch (viewMode) {
      case 'epicycles':
        return {
          showEpicycles: true,
          showTrace: false,
          epicycleWidth: canvasWidth,
          traceWidth: 0,
          epicycleStartX: 0,
          traceStartX: 0
        };
      case 'trace':
        return {
          showEpicycles: false,
          showTrace: true,
          epicycleWidth: 0,
          traceWidth: canvasWidth,
          epicycleStartX: 0,
          traceStartX: 0
        };
      case 'combined':
      default:
        return {
          showEpicycles: true,
          showTrace: true,
          epicycleWidth: canvasWidth,
          traceWidth: canvasWidth,
          epicycleStartX: 0,
          traceStartX: canvasWidth
        };
    }
  };
  
  const layout = getLayout();
  
  // Target functions
  const targetFunctions = [
    { id: 'square', name: 'Square Wave' },
    { id: 'sawtooth', name: 'Sawtooth Wave' },
    { id: 'triangle', name: 'Triangle Wave' },
    { id: 'custom', name: 'Custom Function' },
    { id: 'drawing', name: 'Draw Your Own' }
  ];
  
  // Theme settings
  const theme = {
    bg: isDarkMode ? '#222' : '#fff',
    text: isDarkMode ? '#ccc' : '#666',
    grid: isDarkMode ? '#444' : '#e5e5e5',
    axis: isDarkMode ? '#666' : '#aaa',
    target: isDarkMode ? '#aaa' : '#999',
    series: isDarkMode ? '#f55' : '#f00',
    circle: isDarkMode ? '#555' : '#ddd',
    line: isDarkMode ? '#aaa' : '#999',
    dot: isDarkMode ? '#f55' : '#f00',
    drawing: isDarkMode ? '#3af' : '#06c',
    controlBg: isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    overlayBg: isDarkMode ? 'rgba(34, 34, 34, 0.7)' : 'rgba(255, 255, 255, 0.7)'
  };
  
  // Helper: Parse custom function
  const parseCustomFunction = (expression) => {
    try {
      const parsedExpr = math.parse(expression);
      return (x) => {
        try {
          const scope = { x, PI: Math.PI };
          return parsedExpr.evaluate(scope);
        } catch (error) {
          console.error("Error evaluating expression:", error);
          return 0;
        }
      };
    } catch (error) {
      console.error("Error parsing expression:", error);
      return () => 0;
    }
  };
  
  // Initialize theme
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);
  
  // Calculate Fourier coefficients
  const calculateFourierCoefficients = useCallback((func, n) => {
    const coefficients = [];
    
    // Calculate coefficients based on the function type
    switch(func) {
      case 'square':
        // For square wave: a_n = 0, b_n = 4/(nπ) for odd n, 0 for even n
        for (let i = 1; i <= n; i++) {
          if (i % 2 === 1) {
            coefficients.push({ a: 0, b: 4 / (i * Math.PI) });
          } else {
            coefficients.push({ a: 0, b: 0 });
          }
        }
        break;
        
      case 'sawtooth':
        // For sawtooth wave: a_n = 0, b_n = 2/nπ * (-1)^(n+1)
        for (let i = 1; i <= n; i++) {
          const sign = Math.pow(-1, i+1);
          coefficients.push({ a: 0, b: 2 / (i * Math.PI) * sign });
        }
        break;
        
      case 'triangle':
        // For triangle wave: a_n = 0, b_n = 8/(n^2 * π^2) for odd n, 0 for even n
        for (let i = 1; i <= n; i++) {
          if (i % 2 === 1) {
            coefficients.push({ a: 0, b: 8 / (i * i * Math.PI * Math.PI) });
          } else {
            coefficients.push({ a: 0, b: 0 });
          }
        }
        break;
        
      case 'custom':
        // For custom function: Use numerical integration
        const customFunc = parseCustomFunction(customEquation);
        for (let i = 1; i <= n; i++) {
          // Numerical integration to find a_n and b_n
          let a = 0, b = 0;
          const steps = 100;
          const dx = 2 * Math.PI / steps;
          
          for (let j = 0; j < steps; j++) {
            const x = j * dx - Math.PI;
            const fx = customFunc(x);
            
            a += fx * Math.cos(i * x) * dx / Math.PI;
            b += fx * Math.sin(i * x) * dx / Math.PI;
          }
          
          coefficients.push({ a, b });
        }
        break;
        
      case 'drawing':
        // Use the drawn points to calculate Fourier coefficients
        if (drawingPoints.length > 0) {
          // Convert drawing points to complex numbers
          const points = drawingPoints.map(p => {
            // Center and scale the points to fit in [-π, π]
            const x = ((p.x / canvasWidth) * 2 * Math.PI) - Math.PI;
            const y = -((p.y / canvasHeight - 0.5) * 2); // Invert y since canvas y is top-down
            return { x, y };
          });
          
          // Calculate coefficients using DFT
          for (let k = 1; k <= n; k++) {
            let a = 0, b = 0;
            const N = points.length;
            
            for (let i = 0; i < N; i++) {
              const t = (i / N) * 2 * Math.PI - Math.PI;
              const angle = k * t;
              a += points[i].y * Math.cos(angle) / N;
              b += points[i].y * Math.sin(angle) / N;
            }
            
            coefficients.push({ a, b });
          }
        } else {
          // If no drawing, use zeros
          for (let i = 1; i <= n; i++) {
            coefficients.push({ a: 0, b: 0 });
          }
        }
        break;
    }
    
    return coefficients;
  }, [customEquation, drawingPoints]);
  
  // Evaluate target function
  const evaluateTargetFunction = useCallback((func, x) => {
    // Normalize x to range [-π, π]
    const normalizedX = ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const mappedX = normalizedX > Math.PI ? normalizedX - 2 * Math.PI : normalizedX;
    
    switch(func) {
      case 'square':
        return mappedX >= 0 ? 1 : -1;
        
      case 'sawtooth':
        return mappedX / Math.PI;
        
      case 'triangle':
        const normalizedY = 2 * Math.abs(2 * (normalizedX / (2 * Math.PI) - Math.floor(normalizedX / (2 * Math.PI) + 0.5)));
        return 2 * normalizedY - 1;
        
      case 'custom':
        return parseCustomFunction(customEquation)(mappedX);
        
      case 'drawing':
        if (drawingPoints.length > 0) {
          // Interpolate between drawn points
          const pointIndex = ((normalizedX + Math.PI) / (2 * Math.PI)) * drawingPoints.length;
          const i = Math.floor(pointIndex) % drawingPoints.length;
          const t = pointIndex - i;
          const nextI = (i + 1) % drawingPoints.length;
          
          const y1 = -((drawingPoints[i].y / canvasHeight - 0.5) * 2);
          const y2 = -((drawingPoints[nextI].y / canvasHeight - 0.5) * 2);
          
          return y1 * (1 - t) + y2 * t;
        }
        return 0;
        
      default:
        return 0;
    }
  }, [customEquation, drawingPoints]);
  
  // Evaluate Fourier series
  const evaluateFourierSeries = useCallback((coefficients, x, activeTerms = coefficients.length) => {
    let sum = 0;
    
    const coeffsToUse = coefficients.slice(0, activeTerms);
    
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coeffsToUse[i] || { a: 0, b: 0 };
      sum += a * Math.cos(n * x) + b * Math.sin(n * x);
    }
    
    return sum;
  }, []);
  
  // Main drawing function
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { showEpicycles, showTrace, epicycleWidth, traceWidth, epicycleStartX, traceStartX } = getLayout();
    
    // Clear canvas
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate current time
    const time = (animationFrame % 200) / 100 * Math.PI;
    
    // Calculate Fourier coefficients
    const coefficients = calculateFourierCoefficients(targetFunction, numTerms);
    
    // Apply transformations for zoom and pan
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);
    
    // Draw dividing line if in combined mode
    if (viewMode === 'combined') {
      ctx.beginPath();
      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 1;
      ctx.moveTo(epicycleWidth, 0);
      ctx.lineTo(epicycleWidth, canvasHeight);
      ctx.stroke();
    }
    
    // Draw epicycles if enabled
    if (showEpicycles) {
      drawEpicycles(ctx, coefficients, epicycleStartX, epicycleWidth, time);
    }
    
    // Draw trace area if enabled
    if (showTrace) {
      drawTraceArea(ctx, coefficients, traceStartX, traceWidth, time);
    }
    
    // Restore canvas state
    ctx.restore();
    
    // Store timestamp for animation timing
    lastRenderTimeRef.current = Date.now();
  }, [
    viewMode, 
    targetFunction, 
    numTerms, 
    animationFrame, 
    isDarkMode, 
    zoom, 
    panOffset, 
    drawingPoints, 
    tracePoints,
    showControls,
    calculateFourierCoefficients,
    evaluateTargetFunction,
    evaluateFourierSeries
  ]);
  
  // Draw epicycles visualization
  const drawEpicycles = useCallback((ctx, coefficients, startX, width, time) => {
    if (width <= 0) return;
    
    const yScale = canvasHeight / 4;
    const yOffset = canvasHeight / 2;
    
    // Center point for epicycles
    const centerX = startX + width / 2;
    const centerY = yOffset;
    
    // Sort coefficients by amplitude
    const sortedCoeffs = coefficients.map((coeff, idx) => ({
      ...coeff,
      n: idx + 1,
      amplitude: Math.sqrt(coeff.a * coeff.a + coeff.b * coeff.b)
    })).sort((a, b) => b.amplitude - a.amplitude);
    
    // Draw epicycles
    let x = centerX;
    let y = centerY;
    let finalX = x;
    let finalY = y;
    
    // Draw each circle
    for (let i = 0; i < sortedCoeffs.length; i++) {
      const { a, b, n, amplitude } = sortedCoeffs[i];
      
      // Skip very small amplitudes
      if (amplitude < 0.01) continue;
      
      // Calculate angle
      const angle = n * time;
      
      // Draw circle
      ctx.beginPath();
      ctx.strokeStyle = theme.circle;
      ctx.lineWidth = 1;
      ctx.arc(x, y, amplitude * yScale, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Calculate next point
      const dx = amplitude * Math.cos(angle + Math.atan2(b, a)) * yScale;
      const dy = amplitude * Math.sin(angle + Math.atan2(b, a)) * yScale;
      
      // Draw radius
      ctx.beginPath();
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
      
      // Update current point
      x += dx;
      y += dy;
      finalX = x;
      finalY = y;
    }
    
    // Draw final point (red dot)
    ctx.beginPath();
    ctx.fillStyle = theme.dot;
    ctx.arc(finalX, finalY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw horizontal line from final point to trace area
    if (viewMode === 'combined') {
      ctx.beginPath();
      ctx.strokeStyle = theme.dot;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 3]);
      ctx.moveTo(finalX, finalY);
      ctx.lineTo(canvasWidth, finalY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Store the current point for tracing
    if (isAnimating) {
      // Calculate the y-value at the current time
      const traceY = evaluateFourierSeries(coefficients, time, coefficients.length);
      
      // Add point to trace points
      setTracePoints(prev => {
        const newPoints = [...prev, { time, x: time, y: traceY }];
        // Limit number of points to avoid performance issues
        if (newPoints.length > maxTracePoints) {
          return newPoints.slice(newPoints.length - maxTracePoints);
        }
        return newPoints;
      });
    }
    
    // Draw info label
    ctx.fillStyle = theme.text;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Epicycles', centerX, 25);
  }, [viewMode, theme, evaluateFourierSeries, isAnimating, maxTracePoints]);
  
  // Draw trace area
  const drawTraceArea = useCallback((ctx, coefficients, startX, width, currentTime) => {
    if (width <= 0) return;
    
    const yScale = canvasHeight / 4;
    const yOffset = canvasHeight / 2;
    
    // Draw grid and axes
    drawGrid(ctx, startX, width, yOffset, yScale);
    
    // The window shows a fixed width of time but slides as time progresses
    const windowWidth = Math.PI * 2; // Show 2π of x-axis at any time
    const windowStart = Math.max(0, currentTime - windowWidth);
    
    // Function to map time to screen x-coordinate
    const mapTimeToScreenX = (t) => {
      // Normalize time within the current window
      const normalizedT = (t - windowStart) / windowWidth;
      // Map to screen coordinates
      return startX + normalizedT * width;
    };
    
    // Function to map y value to screen y-coordinate
    const mapYToScreenY = (y) => {
      return yOffset - y * yScale;
    };
    
    // Draw target function
    drawTargetFunction(ctx, startX, width, yOffset, yScale, windowStart, windowWidth);
    
    // Draw Fourier approximation
    drawFourierApproximation(ctx, coefficients, startX, width, yOffset, yScale, windowStart, windowWidth);
    
    // Draw trace
    drawTrace(ctx, startX, width, yOffset, yScale, windowStart, windowWidth, currentTime, coefficients);
    
    // Draw info label
    ctx.fillStyle = theme.text;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Function Trace', startX + width / 2, 25);
  }, [theme, targetFunction, evaluateTargetFunction, evaluateFourierSeries]);
  
  // Draw grid and axes
  const drawGrid = useCallback((ctx, startX, width, yOffset, yScale) => {
    // Horizontal lines (y-axis gridlines)
    for (let y = -2; y <= 2; y += 0.5) {
      ctx.beginPath();
      ctx.moveTo(startX, yOffset - y * yScale);
      ctx.lineTo(startX + width, yOffset - y * yScale);
      
      if (y === 0) {
        ctx.strokeStyle = theme.axis;
      } else {
        ctx.strokeStyle = theme.grid;
      }
      
      ctx.stroke();
      
      // Add y-axis labels
      if (Number.isInteger(y)) {
        ctx.fillStyle = theme.text;
        ctx.textAlign = 'left';
        ctx.font = '12px Arial';
        ctx.fillText(y.toString(), startX + 5, yOffset - y * yScale + 4);
      }
    }
    
    // Vertical lines (x-axis gridlines)
    const xAxisLabels = ['0', 'π/2', 'π', '3π/2', '2π'];
    const numXDivisions = xAxisLabels.length - 1;
    
    for (let i = 0; i <= numXDivisions; i++) {
      const xPos = startX + (i / numXDivisions) * width;
      
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, canvasHeight);
      
      if (i === Math.floor(numXDivisions / 2)) {
        ctx.strokeStyle = theme.axis; // Highlight the middle (π)
      } else {
        ctx.strokeStyle = theme.grid;
      }
      
      ctx.stroke();
      
      // Add x-axis labels
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'center';
      ctx.fillText(xAxisLabels[i], xPos, yOffset + 20);
    }
  }, [theme]);
  
  // Draw target function
  const drawTargetFunction = useCallback((ctx, startX, width, yOffset, yScale, windowStart, windowWidth) => {
    ctx.beginPath();
    ctx.strokeStyle = theme.target;
    ctx.lineWidth = 1;
    
    const resolution = width;
    
    for (let i = 0; i <= resolution; i++) {
      const t = windowStart + (i / resolution) * windowWidth;
      const x = startX + (i / resolution) * width;
      const y = evaluateTargetFunction(targetFunction, t);
      
      if (i === 0) {
        ctx.moveTo(x, yOffset - y * yScale);
      } else {
        ctx.lineTo(x, yOffset - y * yScale);
      }
    }
    
    ctx.stroke();
  }, [theme, targetFunction, evaluateTargetFunction]);
  
  // Draw Fourier approximation
  const drawFourierApproximation = useCallback((ctx, coefficients, startX, width, yOffset, yScale, windowStart, windowWidth) => {
    ctx.beginPath();
    ctx.strokeStyle = theme.series;
    ctx.lineWidth = 1.2;
    
    const resolution = width;
    
    for (let i = 0; i <= resolution; i++) {
      const t = windowStart + (i / resolution) * windowWidth;
      const x = startX + (i / resolution) * width;
      const y = evaluateFourierSeries(coefficients, t, coefficients.length);
      
      if (i === 0) {
        ctx.moveTo(x, yOffset - y * yScale);
      } else {
        ctx.lineTo(x, yOffset - y * yScale);
      }
    }
    
    ctx.stroke();
  }, [theme, evaluateFourierSeries]);
  
  // Draw trace
  const drawTrace = useCallback((ctx, startX, width, yOffset, yScale, windowStart, windowWidth, currentTime, coefficients) => {
    // Calculate the view window for the sliding trace
    const mapTimeToScreenX = (t) => {
      // Normalize time within the current window
      const normalizedT = (t - windowStart) / windowWidth;
      // Map to screen coordinates
      return startX + normalizedT * width;
    };
    
    const mapYToScreenY = (y) => {
      return yOffset - y * yScale;
    };
    
    // Draw vertical line at current time position
    const currentX = mapTimeToScreenX(currentTime);
    
    ctx.beginPath();
    ctx.strokeStyle = theme.dot;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw trace dots with fading effect
    if (tracePoints.length > 0) {
      // Filter points that are within the view window
      const visiblePoints = tracePoints.filter(point => 
        point.time >= windowStart && point.time <= currentTime
      );
      
      if (visiblePoints.length > 1) {
        // Draw line connecting trace points
        ctx.beginPath();
        ctx.strokeStyle = theme.dot;
        ctx.lineWidth = 1.25;
        
        let firstPoint = true;
        
        for (const point of visiblePoints) {
          const x = mapTimeToScreenX(point.time);
          const y = mapYToScreenY(point.y);
          
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
        
        // Draw fading dots for trace points
        visiblePoints.forEach((point, index) => {
          // Calculate opacity based on age of point (newer points are more opaque)
          const age = (currentTime - point.time) / windowWidth;
          const opacity = 1 - Math.min(0.75, age); // Keep a minimum opacity of 0.1
          
          const x = mapTimeToScreenX(point.time);
          const y = mapYToScreenY(point.y);
          
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
          const dotSize = 2 * (opacity + 0.5); // Vary size with opacity
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Draw the current point larger
        if (visiblePoints.length > 0) {
          const latestPoint = visiblePoints[visiblePoints.length - 1];
          const x = mapTimeToScreenX(latestPoint.time);
          const y = mapYToScreenY(latestPoint.y);
          
          ctx.beginPath();
          ctx.fillStyle = theme.dot;
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [theme, tracePoints]);
  
  // Draw zoom and pan controls
  const drawZoomPanControls = useCallback((ctx) => {
    // Draw controls container
    const controlsWidth = 120;
    const controlsHeight = 140;
    const padding = 10;
    const buttonSize = 30;
    const margin = 5;
    
    // Position in bottom right corner
    const x = canvasWidth - controlsWidth - padding;
    const y = canvasHeight - controlsHeight - padding;
    
    // Semi-transparent background
    ctx.fillStyle = theme.controlBg;
    ctx.roundRect(x, y, controlsWidth, controlsHeight, 8);
    ctx.fill();
    
    // Draw zoom controls
    // Zoom in button
    ctx.fillStyle = isDarkMode ? '#444' : '#eee';
    ctx.roundRect(x + margin, y + margin, buttonSize, buttonSize, 4);
    ctx.fill();
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', x + margin + buttonSize / 2, y + margin + buttonSize / 2);
    
    // Zoom out button
    ctx.fillStyle = isDarkMode ? '#444' : '#eee';
    ctx.roundRect(x + margin, y + margin + buttonSize + margin, buttonSize, buttonSize, 4);
    ctx.fill();
    ctx.fillStyle = theme.text;
    ctx.fillText('-', x + margin + buttonSize / 2, y + margin + buttonSize + margin + buttonSize / 2);
    
    // Reset zoom/pan button
    ctx.fillStyle = isDarkMode ? '#444' : '#eee';
    ctx.roundRect(x + margin, y + margin + (buttonSize + margin) * 2, buttonSize, buttonSize, 4);
    ctx.fill();
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 12px Arial';
    ctx.fillText('R', x + margin + buttonSize / 2, y + margin + (buttonSize + margin) * 2 + buttonSize / 2);
    
    // Draw pan controls (arrow buttons)
    // Up arrow
    ctx.fillStyle = isDarkMode ? '#444' : '#eee';
    ctx.roundRect(x + margin * 2 + buttonSize + buttonSize / 2 - buttonSize / 2, y + margin, buttonSize, buttonSize, 4);
    ctx.fill();
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(x + margin * 2 + buttonSize + buttonSize / 2, y + margin + 10);
    ctx.lineTo(x + margin * 2 + buttonSize + buttonSize / 2 - 8, y + margin + 20);
    ctx.lineTo(x + margin * 2 + buttonSize + buttonSize / 2 + 8, y + margin + 20);
    ctx.closePath();
    ctx.fillStyle = theme.text;
    ctx.fill();
    
    // Left arrow
    ctx.fillStyle = isDarkMode ? '#444' : '#eee';
    ctx.roundRect(x + margin * 2 + buttonSize, y + margin + buttonSize + margin, buttonSize, buttonSize, 4);
    ctx.fill();
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(x + margin * 2 + buttonSize + 10, y + margin + buttonSize + margin + buttonSize / 2);
    ctx.lineTo(x + margin * 2 + buttonSize + 20, y + margin + buttonSize + margin + buttonSize / 2 - 8);
    ctx.lineTo(x + margin * 2 + buttonSize + 20, y + margin + buttonSize + margin + buttonSize / 2 + 8);
    ctx.closePath();
    ctx.fillStyle = theme.text;
    ctx.fill();
    
    // Right arrow
    ctx.fillStyle = isDarkMode ? '#444' : '#eee';
    ctx.roundRect(x + margin * 2 + buttonSize + buttonSize + margin, y + margin + buttonSize + margin, buttonSize, buttonSize, 4);
    ctx.fill();
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(x + margin * 2 + buttonSize + buttonSize + margin + 20, y + margin + buttonSize + margin + buttonSize / 2);
    ctx.lineTo(x + margin * 2 + buttonSize + buttonSize + margin + 10, y + margin + buttonSize + margin + buttonSize / 2 - 8);
    ctx.lineTo(x + margin * 2 + buttonSize + buttonSize + margin + 10, y + margin + buttonSize + margin + buttonSize / 2 + 8);
    ctx.closePath();
    ctx.fillStyle = theme.text;
    ctx.fill();
    
    // Down arrow
    ctx.fillStyle = isDarkMode ? '#444' : '#eee';
    ctx.roundRect(x + margin * 2 + buttonSize + buttonSize / 2 - buttonSize / 2, y + margin + (buttonSize + margin) * 2, buttonSize, buttonSize, 4);
    ctx.fill();
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(x + margin * 2 + buttonSize + buttonSize / 2, y + margin + (buttonSize + margin) * 2 + 20);
    ctx.lineTo(x + margin * 2 + buttonSize + buttonSize / 2 - 8, y + margin + (buttonSize + margin) * 2 + 10);
    ctx.lineTo(x + margin * 2 + buttonSize + buttonSize / 2 + 8, y + margin + (buttonSize + margin) * 2 + 10);
    ctx.closePath();
    ctx.fillStyle = theme.text;
    ctx.fill();
    
    // Store the control positions for hit testing
    const controls = {
      zoomIn: { x: x + margin, y: y + margin, width: buttonSize, height: buttonSize },
      zoomOut: { x: x + margin, y: y + margin + buttonSize + margin, width: buttonSize, height: buttonSize },
      reset: { x: x + margin, y: y + margin + (buttonSize + margin) * 2, width: buttonSize, height: buttonSize },
      panUp: { x: x + margin * 2 + buttonSize + buttonSize / 2 - buttonSize / 2, y: y + margin, width: buttonSize, height: buttonSize },
      panLeft: { x: x + margin * 2 + buttonSize, y: y + margin + buttonSize + margin, width: buttonSize, height: buttonSize },
      panRight: { x: x + margin * 2 + buttonSize + buttonSize + margin, y: y + margin + buttonSize + margin, width: buttonSize, height: buttonSize },
      panDown: { x: x + margin * 2 + buttonSize + buttonSize / 2 - buttonSize / 2, y: y + margin + (buttonSize + margin) * 2, width: buttonSize, height: buttonSize }
    };
    
    // Store in ref for hit testing
    window.controls = controls;
  }, [theme, isDarkMode]);
  
  // Add roundRect to canvas context if not supported
  useEffect(() => {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
      };
    }
  }, []);
  
  // Animation loop
  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        setAnimationFrame(prev => prev + animationSpeed);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isAnimating, animationSpeed]);
  
  // Draw visualization when parameters change
  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]);
  
  // Initialize drawing mode
  useEffect(() => {
    if (isDrawingMode && drawingCanvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw grid
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      
      // Draw horizontal lines
      for (let y = 0; y < canvasHeight; y += canvasHeight / 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
      
      // Draw vertical lines
      for (let x = 0; x < canvasWidth; x += canvasWidth / 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
    }
  }, [isDrawingMode, theme]);
  
  // Draw points when they change during drawing mode
  useEffect(() => {
    if (isDrawingMode && drawingPoints.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Draw path
      ctx.beginPath();
      ctx.strokeStyle = theme.drawing;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw each segment
      for (let i = 0; i < drawingPoints.length; i++) {
        const point = drawingPoints[i];
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      
      // Close the path if there are enough points
      if (drawingPoints.length > 2) {
        ctx.closePath();
      }
      
      ctx.stroke();
    }
  }, [drawingPoints, isDrawingMode, theme]);
  
  // Handle mouse events for drawing
  const handleDrawingMouseDown = useCallback((e) => {
    if (!isDrawingMode) return;
    
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setDrawingPoints([{ x, y }]);
  }, [isDrawingMode]);
  
  const handleDrawingMouseMove = useCallback((e) => {
    if (!isDrawing || !isDrawingMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setDrawingPoints(prevPoints => [...prevPoints, { x, y }]);
  }, [isDrawing, isDrawingMode]);
  
  const handleDrawingMouseUp = useCallback(() => {
    if (isDrawingMode) {
      setIsDrawing(false);
      
      // If we just finished drawing, switch to the drawing function
      if (drawingPoints.length > 0) {
        setTargetFunction('drawing');
      }
    }
  }, [isDrawingMode, drawingPoints]);
  
  // Handle touch events for drawing
  const handleDrawingTouchStart = useCallback((e) => {
    if (!isDrawingMode) return;
    
    e.preventDefault();
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    setDrawingPoints([{ x, y }]);
  }, [isDrawingMode]);
  
  const handleDrawingTouchMove = useCallback((e) => {
    if (!isDrawing || !isDrawingMode) return;
    
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    setDrawingPoints(prevPoints => [...prevPoints, { x, y }]);
  }, [isDrawing, isDrawingMode]);
  
  const handleDrawingTouchEnd = useCallback(() => {
    handleDrawingMouseUp();
  }, [handleDrawingMouseUp]);
  
  // Handle clicks on zoom/pan controls
  const handleCanvasClick = useCallback((e) => {
    if (!window.controls) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if click is on any of the controls
    for (const [name, control] of Object.entries(window.controls)) {
      if (
        x >= control.x && 
        x <= control.x + control.width && 
        y >= control.y && 
        y <= control.y + control.height
      ) {
        // Handle control click
        switch (name) {
          case 'zoomIn':
            setZoom(prev => Math.min(5, prev * 1.2));
            return;
          case 'zoomOut':
            setZoom(prev => Math.max(0.5, prev / 1.2));
            return;
          case 'reset':
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
            return;
          case 'panUp':
            setPanOffset(prev => ({ ...prev, y: prev.y + 20 }));
            return;
          case 'panLeft':
            setPanOffset(prev => ({ ...prev, x: prev.x + 20 }));
            return;
          case 'panRight':
            setPanOffset(prev => ({ ...prev, x: prev.x - 20 }));
            return;
          case 'panDown':
            setPanOffset(prev => ({ ...prev, y: prev.y - 20 }));
            return;
        }
      }
    }
  }, []);
  
  // Handle normal pan/zoom with mouse events
  const handleMouseDown = useCallback((e) => {
    if (isDrawingMode) {
      handleDrawingMouseDown(e);
      return;
    }
    
    setIsPanning(true);
    setStartPanPoint({
      x: e.clientX,
      y: e.clientY
    });
  }, [isDrawingMode, handleDrawingMouseDown]);
  
  const handleMouseMove = useCallback((e) => {
    if (isDrawingMode) {
      handleDrawingMouseMove(e);
      return;
    }
    
    if (!isPanning) return;
    
    const dx = e.clientX - startPanPoint.x;
    const dy = e.clientY - startPanPoint.y;
    
    setPanOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    setStartPanPoint({
      x: e.clientX,
      y: e.clientY
    });
  }, [isDrawingMode, isPanning, startPanPoint, handleDrawingMouseMove]);
  
  const handleMouseUp = useCallback((e) => {
    if (isDrawingMode) {
      handleDrawingMouseUp();
      return;
    }
    
    if (isPanning) {
      setIsPanning(false);
    } else {
      // Regular click
      handleCanvasClick(e);
    }
  }, [isDrawingMode, isPanning, handleDrawingMouseUp, handleCanvasClick]);
  
  const handleWheel = useCallback((e) => {
    if (isDrawingMode) return;
    
    e.preventDefault();
    
    const delta = e.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    
    setZoom(prev => Math.max(0.5, Math.min(5, prev * zoomFactor)));
  }, [isDrawingMode]);
  
  // Pinch zoom for touch devices
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      // Single touch - for drawing or panning
      if (isDrawingMode) {
        handleDrawingTouchStart(e);
      } else {
        // Start panning
        setIsPanning(true);
        setStartPanPoint({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      }
    } else if (e.touches.length === 2) {
      // Two touches - pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      e.currentTarget.dataset.initialPinchDistance = distance;
      e.currentTarget.dataset.initialZoom = zoom;
    }
  }, [isDrawingMode, zoom, handleDrawingTouchStart]);
  
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      // Single touch - for drawing or panning
      if (isDrawingMode) {
        handleDrawingTouchMove(e);
      } else if (isPanning) {
        // Panning
        const dx = e.touches[0].clientX - startPanPoint.x;
        const dy = e.touches[0].clientY - startPanPoint.y;
        
        setPanOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        
        setStartPanPoint({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      }
    } else if (e.touches.length === 2) {
      // Two touches - pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const initialDistance = parseFloat(e.currentTarget.dataset.initialPinchDistance);
      const initialZoom = parseFloat(e.currentTarget.dataset.initialZoom);
      
      if (initialDistance && initialZoom) {
        const zoomFactor = distance / initialDistance;
        const newZoom = Math.max(0.5, Math.min(5, initialZoom * zoomFactor));
        setZoom(newZoom);
      }
    }
  }, [isDrawingMode, isPanning, startPanPoint, handleDrawingTouchMove]);
  
  const handleTouchEnd = useCallback((e) => {
    if (isDrawingMode) {
      handleDrawingTouchEnd();
      return;
    }
    
    setIsPanning(false);
    
    // If it's a tap (not a pan or zoom) and no touches left
    if (e.touches.length === 0 && (
      !startPanPoint.x || 
      Math.abs(e.changedTouches[0].clientX - startPanPoint.x) < 5 && 
      Math.abs(e.changedTouches[0].clientY - startPanPoint.y) < 5
    )) {
      // Handle tap on controls
      const touchEvt = {
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY
      };
      handleCanvasClick(touchEvt);
    }
    
    // Reset pinch zoom tracking
    if (e.currentTarget) {
      delete e.currentTarget.dataset.initialPinchDistance;
      delete e.currentTarget.dataset.initialZoom;
    }
  }, [isDrawingMode, startPanPoint, handleDrawingTouchEnd, handleCanvasClick]);
  
  // Theme-based classes
  const containerClass = isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800';
  const cardClass = isDarkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md';
  const buttonClass = isDarkMode 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  const buttonSecondaryClass = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const inputClass = isDarkMode
    ? 'bg-gray-700 text-white border-gray-600'
    : 'bg-white text-gray-800 border-gray-300';
  
  // MOBILE-SPECIFIC STYLES
  const mobileStyles = `
    @media (max-width: 768px) {
      .controls-container {
        flex-direction: column;
      }
      
      .control-group {
        width: 100%;
        margin-bottom: 1rem;
      }
      
      .mobile-hint {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        opacity: 0.7;
      }
    }
  `;
  
  // Canvas help overlay - shown when canvas is empty
  const renderCanvasHelp = () => {
    if (isDrawingMode && drawingPoints.length === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-60 bg-black text-white p-4 text-center pointer-events-none">
          <div>
            <h3 className="text-xl font-bold mb-2">Drawing Mode</h3>
            <p>Draw a shape using your mouse or finger.<br/>The curve will be converted to Fourier series.</p>
          </div>
        </div>
      );
    }
    
    if (!isDrawingMode && zoom === 1 && panOffset.x === 0 && panOffset.y === 0 && showControls) {
      return (
        <div className="absolute bottom-36 right-6 bg-opacity-80 bg-black text-white p-2 rounded-lg text-sm pointer-events-none">
          <p>Use the controls to zoom and pan</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={`min-h-screen p-4 ${containerClass} transition-colors duration-300`}>
      <style>{mobileStyles}</style>
      
      <h1 className="text-2xl font-bold mb-4 text-center">Interactive Fourier Series Explorer</h1>
      
      <div className={`p-4 rounded-lg mb-6 ${cardClass} transition-colors duration-300`}>
        <div className="controls-container grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="control-group">
            <label className="block text-sm font-medium mb-1">Target Function:</label>
            <select
              value={targetFunction}
              onChange={(e) => setTargetFunction(e.target.value)}
              className={`w-full p-2 border rounded ${inputClass}`}
            >
              {targetFunctions.map(func => (
                <option key={func.id} value={func.id}>{func.name}</option>
              ))}
            </select>
            
            {targetFunction === 'custom' && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Custom Equation:</label>
                <input
                  type="text"
                  value={customEquation}
                  onChange={(e) => setCustomEquation(e.target.value)}
                  placeholder="e.g., x^2 - PI^2/3"
                  className={`w-full p-2 border rounded ${inputClass}`}
                />
                <p className="text-xs mt-1 opacity-70">
                  Use 'x' as the variable and 'PI' for π
                </p>
              </div>
            )}
          </div>
          
          <div className="control-group">
            <label className="block text-sm font-medium mb-1">Number of Terms: {numTerms}</label>
            <input
              type="range"
              min="1"
              max="50"
              value={numTerms}
              onChange={(e) => setNumTerms(parseInt(e.target.value))}
              className="w-full"
            />
            
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">
                Animation Speed: {animationSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.2"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="control-group flex flex-col justify-between">
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">View Mode:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className={`w-full p-2 border rounded ${inputClass}`}
              >
                <option value="combined">Combined View</option>
                <option value="epicycles">Epicycle View</option>
                <option value="trace">Trace View</option>
              </select>
            </div>
            
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
              >
                {isDarkMode ? '🌙 Dark' : '☀️ Light'}
              </button>
              
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
              >
                {isAnimating ? '⏸️ Pause' : '▶️ Play'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Drawing mode UI */}
        {targetFunction === 'drawing' && (
          <div className="mb-4 p-3 border rounded">
            <h3 className="text-lg font-medium mb-2">Drawing Mode</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsDrawingMode(true)}
                className={`px-3 py-1 text-sm rounded ${isDrawingMode ? buttonClass : buttonSecondaryClass}`}
              >
                Draw Function
              </button>
              
              <button
                onClick={() => {
                  setDrawingPoints([]);
                  setIsDrawingMode(true);
                }}
                className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
              >
                Clear Drawing
              </button>
              
              <button
                onClick={() => setIsDrawingMode(false)}
                className={`px-3 py-1 text-sm rounded ${!isDrawingMode ? buttonClass : buttonSecondaryClass}`}
              >
                View Result
              </button>
            </div>
            <p className="text-xs mt-2 opacity-70 mobile-hint">
              Draw a shape, then click "View Result" to see the Fourier representation.
            </p>
          </div>
        )}
        
        {/* Zoom and pan indicators */}
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm opacity-70">
            <span className="mr-2">Zoom: {zoom.toFixed(1)}x</span>
            <button
              onClick={() => {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className={`px-2 py-1 text-xs rounded ${buttonSecondaryClass}`}
            >
              Reset View
            </button>
          </div>
          
          <button
            onClick={() => {
              setTracePoints([]);
            }}
            className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
          >
            Clear Trace
          </button>
        </div>
      </div>
      
      {/* Main visualization */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-600 relative`}>
          <h2 className="text-lg font-medium mb-2">
            {viewMode === 'combined' ? 'Combined Visualization' : 
             viewMode === 'epicycles' ? 'Epicycles Visualization' : 
             'Trace Visualization'}
          </h2>
          
          {/* Main canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full border rounded relative z-10"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
            />
            
            {/* Canvas help overlay */}
            {renderCanvasHelp()}
          </div>
          
          <div className="flex justify-between mt-2">
            {viewMode === 'combined' && (
              <>
                <div className="text-sm opacity-70">
                  Left side: Epicycles visualization
                </div>
                <div className="text-sm opacity-70">
                  Right side: Function trace
                </div>
              </>
            )}
            
            {viewMode === 'epicycles' && (
              <div className="text-sm opacity-70 w-full text-center">
                Epicycles show how rotating circles create complex patterns
              </div>
            )}
            
            {viewMode === 'trace' && (
              <div className="text-sm opacity-70 w-full text-center">
                Trace shows the function over time with fading history
              </div>
            )}
          </div>
          
          <div className="text-sm mt-1 opacity-70 text-center mobile-hint">
            {!isDrawingMode && <span>Use the on-screen controls to zoom and pan</span>}
          </div>
        </div>
      </div>
      
      <div className={`mt-6 p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
        <h2 className="text-lg font-medium mb-2">About This Visualization</h2>
        <p className="mb-2">
          This interactive visualization demonstrates how Fourier series decompose periodic functions into sums of sine and cosine waves.
        </p>
        <p className="mb-2">
          <strong>Epicycles View:</strong> Shows how each term in the Fourier series can be represented as a rotating circle. The circles combine to trace the approximated function.
        </p>
        <p className="mb-2">
          <strong>Trace View:</strong> Shows the function being drawn over time as the epicycles rotate. The trace fades as it moves off-screen, creating a sense of motion.
        </p>
        <p>
          The horizontal line connects the current position of the epicycles to the corresponding point on the trace, showing how the epicycles' motion translates to the function's shape.
        </p>
      </div>
    </div>
  );
};

export default FourierSeriesExplorer;
