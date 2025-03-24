import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

const FourierSeriesExplorer = () => {
  // Canvas refs
  const mainCanvasRef = useRef(null);
  const epicycleCanvasRef = useRef(null);
  const traceCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  
  // Function parameters
  const [targetFunction, setTargetFunction] = useState('square');
  const [numTerms, setNumTerms] = useState(5);
  const [customEquation, setCustomEquation] = useState('x^2 - PI^2/3');
  
  // Display options
  const [showEpicycles, setShowEpicycles] = useState(true);
  const [showTrace, setShowTrace] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Animation controls
  const [animationFrame, setAnimationFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);
  const [tracePoints, setTracePoints] = useState([]);
  const [maxTracePoints, setMaxTracePoints] = useState(500);
  const [traceMode, setTraceMode] = useState('animated'); // 'animated' or 'full'
  const [viewWindow, setViewWindow] = useState({ start: 0, width: 2 * Math.PI });
  
  // Drawing mode
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  
  // Zoom and pan
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  
  // Animation refs
  const animationRef = useRef(null);
  
  // Constants for drawing
  const canvasWidth = 800;
  const canvasHeight = 400;
  const epicycleWidth = canvasWidth / 2;
  const traceWidth = canvasWidth / 2;
  const xScale = traceWidth / (2 * Math.PI);
  const yScale = canvasHeight / 4;
  const xOffset = epicycleWidth;
  const yOffset = canvasHeight / 2;
  
  // Available target functions
  const targetFunctions = [
    { id: 'square', name: 'Square Wave' },
    { id: 'sawtooth', name: 'Sawtooth Wave' },
    { id: 'triangle', name: 'Triangle Wave' },
    { id: 'custom', name: 'Custom Function' },
    { id: 'drawing', name: 'Draw Your Own' }
  ];
  
  // Parse custom function
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
  
  // Function to calculate Fourier coefficients
  const calculateFourierCoefficients = (func, n) => {
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
  };
  
  // Function to evaluate the target function at a point
  const evaluateTargetFunction = (func, x) => {
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
  };
  
  // Function to evaluate the Fourier series at a point
  const evaluateFourierSeries = (coefficients, x, activeTerms = coefficients.length) => {
    let sum = 0;
    
    const coeffsToUse = coefficients.slice(0, activeTerms);
    
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coeffsToUse[i] || { a: 0, b: 0 };
      sum += a * Math.cos(n * x) + b * Math.sin(n * x);
    }
    
    return sum;
  };
  
  // Draw main visualization
  const drawMainVisualization = () => {
    if (!mainCanvasRef.current) return;
    
    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const gridColor = isDarkMode ? '#444' : '#e5e5e5';
    const axisColor = isDarkMode ? '#666' : '#aaa';
    const textColor = isDarkMode ? '#ccc' : '#666';
    const targetColor = isDarkMode ? '#aaa' : '#999';
    const seriesColor = isDarkMode ? '#f55' : '#f00';
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate Fourier coefficients
    const coefficients = calculateFourierCoefficients(targetFunction, numTerms);
    
    // Active terms
    const activeTerms = numTerms;
    
    // Draw a dividing line between epicycles and trace sides
    ctx.beginPath();
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.moveTo(epicycleWidth, 0);
    ctx.lineTo(epicycleWidth, canvasHeight);
    ctx.stroke();
    
    // Draw grid and axes on trace side (right side)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal lines (y-axis gridlines)
    for (let y = -2; y <= 2; y += 0.5) {
      ctx.beginPath();
      ctx.moveTo(epicycleWidth, yOffset - y * yScale);
      ctx.lineTo(canvasWidth, yOffset - y * yScale);
      
      if (y === 0) {
        ctx.strokeStyle = axisColor;
      } else {
        ctx.strokeStyle = gridColor;
      }
      
      ctx.stroke();
      
      // Add y-axis labels on the right side
      if (Number.isInteger(y)) {
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.font = '12px Arial';
        ctx.fillText(y.toString(), epicycleWidth + 5, yOffset - y * yScale + 4);
      }
    }
    
    // Vertical lines (x-axis gridlines)
    for (let x = 0; x <= 2 * Math.PI; x += Math.PI / 2) {
      const xPos = epicycleWidth + (x / (2 * Math.PI)) * traceWidth;
      
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, canvasHeight);
      
      if (Math.abs(x - Math.PI) < 0.01) {
        ctx.strokeStyle = axisColor; // Highlight the middle (π)
      } else {
        ctx.strokeStyle = gridColor;
      }
      
      ctx.stroke();
      
      // Add x-axis labels
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      let label = '';
      if (x === 0) label = '0';
      else if (x === Math.PI/2) label = 'π/2';
      else if (x === Math.PI) label = 'π';
      else if (x === 3*Math.PI/2) label = '3π/2';
      else if (x === 2*Math.PI) label = '2π';
      
      ctx.fillText(label, xPos, yOffset + 20);
    }
    
    // Draw target function on trace side
    ctx.beginPath();
    ctx.strokeStyle = targetColor;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= traceWidth; i++) {
      const normalizedX = (i / traceWidth) * 2 * Math.PI; // 0 to 2π
      const y = evaluateTargetFunction(targetFunction, normalizedX - Math.PI);
      
      if (i === 0) {
        ctx.moveTo(i + epicycleWidth, yOffset - y * yScale);
      } else {
        ctx.lineTo(i + epicycleWidth, yOffset - y * yScale);
      }
    }
    
    ctx.stroke();
    
    // Draw Fourier approximation on trace side
    ctx.beginPath();
    ctx.strokeStyle = seriesColor;
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= traceWidth; i++) {
      const normalizedX = (i / traceWidth) * 2 * Math.PI; // 0 to 2π
      const y = evaluateFourierSeries(coefficients, normalizedX - Math.PI, activeTerms);
      
      if (i === 0) {
        ctx.moveTo(i + epicycleWidth, yOffset - y * yScale);
      } else {
        ctx.lineTo(i + epicycleWidth, yOffset - y * yScale);
      }
    }
    
    ctx.stroke();
    
    // Show active terms info
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    ctx.fillText(`Active terms: ${activeTerms} of ${numTerms}`, 10, 30);
    
    // Draw legend
    ctx.fillStyle = targetColor;
    ctx.fillRect(canvasWidth - 140, 15, 15, 2);
    ctx.fillStyle = textColor;
    ctx.fillText('Target Function', canvasWidth - 120, 20);
    
    ctx.fillStyle = seriesColor;
    ctx.fillRect(canvasWidth - 140, 35, 15, 2);
    ctx.fillStyle = textColor;
    ctx.fillText('Fourier Series', canvasWidth - 120, 40);
    
    // Draw epicycles if enabled
    if (showEpicycles) {
      drawEpicycles(coefficients, activeTerms);
    }
    
    // Draw trace if enabled
    if (showTrace) {
      drawTrace();
    }
  };
  
  // Draw epicycles visualization
  const drawEpicycles = (coefficients, activeTerms) => {
    if (!epicycleCanvasRef.current) return;
    
    const canvas = epicycleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const textColor = isDarkMode ? '#ccc' : '#666';
    const circleColor = isDarkMode ? '#555' : '#ddd';
    const lineColor = isDarkMode ? '#aaa' : '#999';
    const dotColor = isDarkMode ? '#f55' : '#f00';
    
    // Clear canvas
    ctx.clearRect(0, 0, epicycleWidth, canvasHeight);
    
    // Get time from animation frame
    const time = (animationFrame % 200) / 100 * Math.PI;
    
    // Center point for epicycles
    const centerX = epicycleWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Sort coefficients by amplitude
    const sortedCoeffs = coefficients.map((coeff, idx) => ({
      ...coeff,
      n: idx + 1,
      amplitude: Math.sqrt(coeff.a * coeff.a + coeff.b * coeff.b)
    })).sort((a, b) => b.amplitude - a.amplitude);
    
    // Draw epicycles
    let x = centerX;
    let y = centerY;
    let finalY = 0; // Track the final Y position for the horizontal line
    
    // Draw each circle
    for (let i = 0; i < Math.min(sortedCoeffs.length, activeTerms); i++) {
      const { a, b, n, amplitude } = sortedCoeffs[i];
      
      // Skip very small amplitudes
      if (amplitude < 0.01) continue;
      
      // Calculate angle
      const angle = n * time;
      
      // Draw circle
      ctx.beginPath();
      ctx.strokeStyle = circleColor;
      ctx.lineWidth = 1;
      ctx.arc(x, y, amplitude * yScale, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Calculate next point
      const dx = amplitude * Math.cos(angle + Math.atan2(b, a)) * yScale;
      const dy = amplitude * Math.sin(angle + Math.atan2(b, a)) * yScale;
      
      // Draw radius
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
      
      // Update current point
      x += dx;
      y += dy;
      finalY = y; // Update final Y position
    }
    
    // Draw final point
    ctx.beginPath();
    ctx.fillStyle = dotColor;
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw horizontal line from final point to right edge
    ctx.beginPath();
    ctx.strokeStyle = dotColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(x, finalY);
    ctx.lineTo(canvasWidth, finalY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Store the current point for tracing
    if (isAnimating) {
      // Store the x value (0 to 2π) and the y value from our Fourier calculation
      const traceX = time;
      const traceY = evaluateFourierSeries(coefficients, time, activeTerms);
      
      // Add point to trace points
      setTracePoints(prev => {
        const newPoints = [...prev, { x: traceX, y: traceY }];
        // Limit number of points to avoid performance issues
        if (newPoints.length > maxTracePoints) {
          return newPoints.slice(newPoints.length - maxTracePoints);
        }
        return newPoints;
      });
    }
  };
  
  // Draw trace visualization
  const drawTrace = () => {
    if (!traceCanvasRef.current) return;
    
    const canvas = traceCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const traceColor = isDarkMode ? '#f55' : '#f00';
    const bgColor = isDarkMode ? '#222' : '#fff';
    
    // Clear only the right side of the canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(epicycleWidth, 0, traceWidth, canvasHeight);
    
    // Get time from animation frame
    const time = (animationFrame % 200) / 100 * Math.PI;
    
    // Calculate y-value at current time
    const currentX = time;
    const coefficients = calculateFourierCoefficients(targetFunction, numTerms);
    const currentY = evaluateFourierSeries(coefficients, currentX, numTerms);
    
    // Map x position to screen coordinates
    const mapXToScreen = (x) => {
      // Map x from 0-2π to across the right side of the screen
      return epicycleWidth + (x / (2 * Math.PI)) * traceWidth;
    };
    
    // Map y position to screen coordinates
    const mapYToScreen = (y) => {
      // Map y to screen coordinates centered on yOffset
      return yOffset - y * yScale;
    };
    
    // Draw trace line
    if (tracePoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 2;
      
      // Start at the first point
      let firstX = mapXToScreen(tracePoints[0].x);
      let firstY = mapYToScreen(tracePoints[0].y);
      ctx.moveTo(firstX, firstY);
      
      // Draw each point
      for (let i = 1; i < tracePoints.length; i++) {
        const x = mapXToScreen(tracePoints[i].x);
        const y = mapYToScreen(tracePoints[i].y);
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
  };
  
  // Initialize drawing canvas
  const initDrawingCanvas = () => {
    if (!drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const gridColor = isDarkMode ? '#444' : '#e5e5e5';
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid
    ctx.strokeStyle = gridColor;
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
  };
  
  // Draw the current points on the drawing canvas
  const drawDrawingPoints = () => {
    if (!drawingCanvasRef.current || drawingPoints.length === 0) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const lineColor = isDarkMode ? '#3af' : '#06c';
    
    // Draw path
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
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
  };
  
  // Handle mouse events for drawing
  const handleDrawingMouseDown = (e) => {
    if (!isDrawingMode) return;
    
    setIsDrawing(true);
    
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setDrawingPoints([{ x, y }]);
  };
  
  const handleDrawingMouseMove = (e) => {
    if (!isDrawing || !isDrawingMode) return;
    
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setDrawingPoints(prevPoints => [...prevPoints, { x, y }]);
  };
  
  const handleDrawingMouseUp = () => {
    setIsDrawing(false);
    
    // If we just finished drawing, switch to the drawing function
    if (isDrawingMode && drawingPoints.length > 0) {
      setTargetFunction('drawing');
    }
  };
  
  // Handle touch events for drawing (mobile)
  const handleDrawingTouchStart = (e) => {
    if (!isDrawingMode) return;
    
    e.preventDefault();
    setIsDrawing(true);
    
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    setDrawingPoints([{ x, y }]);
  };
  
  const handleDrawingTouchMove = (e) => {
    if (!isDrawing || !isDrawingMode) return;
    
    e.preventDefault();
    
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    setDrawingPoints(prevPoints => [...prevPoints, { x, y }]);
  };
  
  const handleDrawingTouchEnd = () => {
    setIsDrawing(false);
    
    // If we just finished drawing, switch to the drawing function
    if (isDrawingMode && drawingPoints.length > 0) {
      setTargetFunction('drawing');
    }
  };
  
  // Handle mouse events for panning
  const handlePanStart = (e) => {
    if (isDrawingMode) return;
    
    setIsPanning(true);
    setStartPanPoint({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handlePanMove = (e) => {
    if (!isPanning || isDrawingMode) return;
    
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
  };
  
  const handlePanEnd = () => {
    setIsPanning(false);
  };
  
  // Handle zoom with mouse wheel
  const handleZoom = (e) => {
    if (isDrawingMode) return;
    
    e.preventDefault();
    
    const delta = e.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    
    setZoom(prev => Math.max(0.1, Math.min(5, prev * zoomFactor)));
  };
  
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
  
  // Initialize drawing canvas when drawing mode changes
  useEffect(() => {
    if (isDrawingMode) {
      initDrawingCanvas();
    }
  }, [isDrawingMode, isDarkMode]);
  
  // Draw points when they change
  useEffect(() => {
    if (isDrawingMode && drawingPoints.length > 0) {
      initDrawingCanvas();
      drawDrawingPoints();
    }
  }, [drawingPoints, isDrawingMode]);
  
  // Redraw when parameters change
  useEffect(() => {
    drawMainVisualization();
  }, [
    targetFunction,
    numTerms,
    animationFrame,
    showEpicycles,
    showTrace,
    customEquation,
    isDarkMode,
    zoom,
    panOffset,
    drawingPoints,
    tracePoints
  ]);
  
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
  
  return (
    <div className={`min-h-screen p-4 ${containerClass} transition-colors duration-300`}>
      <h1 className="text-2xl font-bold mb-4 text-center">Fourier Series Explorer (Split View)</h1>
      
      <div className={`p-4 rounded-lg mb-6 ${cardClass} transition-colors duration-300`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
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
          
          <div>
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
                min="0.1"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showEpicycles"
                  checked={showEpicycles}
                  onChange={() => setShowEpicycles(!showEpicycles)}
                  className="mr-2"
                />
                <label htmlFor="showEpicycles" className="text-sm">Show Epicycles</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTrace"
                  checked={showTrace}
                  onChange={() => setShowTrace(!showTrace)}
                  className="mr-2"
                />
                <label htmlFor="showTrace" className="text-sm">Show Trace</label>
              </div>
            </div>
            
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
              >
                {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
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
                  initDrawingCanvas();
                }}
                className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
                disabled={!isDrawingMode}
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
            <p className="text-xs mt-2 opacity-70">
              Draw a shape in the canvas below, then click "View Result" to see the Fourier representation.
            </p>
          </div>
        )}
        
        {/* Zoom and pan controls */}
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
        <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-300 relative`}>
          <h2 className="text-lg font-medium mb-2">Split View Visualization</h2>
          
          {/* Main canvas for overall layout */}
          <canvas
            ref={mainCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full border rounded relative z-10"
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
            onWheel={handleZoom}
          />
          
          {/* Drawing canvas - only visible in drawing mode */}
          {isDrawingMode && targetFunction === 'drawing' && (
            <canvas
              ref={drawingCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full border rounded absolute top-0 left-0 z-20 cursor-crosshair"
              onMouseDown={handleDrawingMouseDown}
              onMouseMove={handleDrawingMouseMove}
              onMouseUp={handleDrawingMouseUp}
              onMouseLeave={handleDrawingMouseUp}
              onTouchStart={handleDrawingTouchStart}
              onTouchMove={handleDrawingTouchMove}
              onTouchEnd={handleDrawingTouchEnd}
            />
          )}
          
          {/* Epicycles canvas - positioned over the left side */}
          <canvas
            ref={epicycleCanvasRef}
            width={epicycleWidth}
            height={canvasHeight}
            className="absolute top-0 left-0 z-30 pointer-events-none"
          />
          
          {/* Trace canvas - positioned over the entire canvas */}
          <canvas
            ref={traceCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="absolute top-0 left-0 z-20 pointer-events-none"
          />
          
          <div className="flex justify-between mt-2">
            <div className="text-sm opacity-70">
              Left side: Epicycles visualization
            </div>
            <div className="text-sm opacity-70">
              Right side: Function trace
            </div>
          </div>
          
          <div className="text-sm mt-1 opacity-70">
            {!isDrawingMode && <span>Use mouse wheel to zoom and drag to pan</span>}
          </div>
        </div>
      </div>
      
      <div className={`mt-6 p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
        <h2 className="text-lg font-medium mb-2">About This Visualization</h2>
        <p className="mb-2">
          This split-view visualization shows the relationship between epicycles (rotating circles) and the function they represent.
        </p>
        <p className="mb-2">
          <strong>Left Side:</strong> Shows the epicycles representation, where each circle represents a term in the Fourier series.
        </p>
        <p className="mb-2">
          <strong>Right Side:</strong> Shows the function being approximated and the trace produced by the epicycles.
        </p>
        <p>
          The horizontal line connects the current position of the trace point to its corresponding position on the function curve.
          Watch how the epicycles combine to perfectly trace out the target function!
        </p>
      </div>
    </div>
  );
};

export default FourierSeriesExplorer;
