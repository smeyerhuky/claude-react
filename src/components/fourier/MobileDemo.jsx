import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

const FourierSeriesExplorer = () => {
  // Canvas refs
  const mainCanvasRef = useRef(null);
  const componentCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const epicycleCanvasRef = useRef(null);
  const coefficientCanvasRef = useRef(null);
  const errorCanvasRef = useRef(null);
  
  // Function parameters
  const [targetFunction, setTargetFunction] = useState('square');
  const [numTerms, setNumTerms] = useState(5);
  const [customEquation, setCustomEquation] = useState('x^2 - PI^2/3');
  const [customCoefficients, setCustomCoefficients] = useState([]);
  
  // Display options
  const [showComponents, setShowComponents] = useState(false);
  const [showEpicycles, setShowEpicycles] = useState(false);
  const [showCoefficients, setShowCoefficients] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showTermControls, setShowTermControls] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Animation controls
  const [animateTerms, setAnimateTerms] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // Drawing mode
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  
  // Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [audioNode, setAudioNode] = useState(null);
  
  // Zoom and pan
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  
  // Interactive coefficients
  const [manualCoefficients, setManualCoefficients] = useState([]);
  const [useManualCoefficients, setUseManualCoefficients] = useState(false);
  
  // Animation refs
  const animationRef = useRef(null);
  const epicycleAnimationRef = useRef(null);
  
  // Constants for drawing
  const width = 800;
  const height = 400;
  const xScale = width / (2 * Math.PI);
  const yScale = height / 4;
  const xOffset = 0;
  const yOffset = height / 2;
  
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
  
  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const ctx = new AudioContext();
      setAudioContext(ctx);
    }
    
    return () => {
      if (audioNode) {
        audioNode.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
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
            const x = ((p.x / width) * 2 * Math.PI) - Math.PI;
            const y = -((p.y / height - 0.5) * 2); // Invert y since canvas y is top-down
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
          
          const y1 = -((drawingPoints[i].y / height - 0.5) * 2);
          const y2 = -((drawingPoints[nextI].y / height - 0.5) * 2);
          
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
    
    const coeffsToUse = useManualCoefficients && manualCoefficients.length > 0
      ? manualCoefficients.slice(0, activeTerms)
      : coefficients.slice(0, activeTerms);
    
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coeffsToUse[i] || { a: 0, b: 0 };
      sum += a * Math.cos(n * x) + b * Math.sin(n * x);
    }
    
    return sum;
  };
  
  // Draw function on main canvas
  const drawFunctions = () => {
    if (!mainCanvasRef.current) return;
    
    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const gridColor = isDarkMode ? '#444' : '#e5e5e5';
    const axisColor = isDarkMode ? '#666' : '#aaa';
    const textColor = isDarkMode ? '#ccc' : '#666';
    const targetColor = isDarkMode ? '#aaa' : '#999';
    const seriesColor = isDarkMode ? '#f55' : '#f00';
    
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Calculate Fourier coefficients
    const coefficients = calculateFourierCoefficients(targetFunction, numTerms);
    
    // Update manual coefficients if needed
    if (manualCoefficients.length === 0 || manualCoefficients.length !== numTerms) {
      setManualCoefficients(coefficients.slice());
    }
    
    // Active terms based on animation state
    let activeTerms = numTerms;
    if (animateTerms) {
      activeTerms = Math.max(1, Math.min(numTerms, Math.floor(1 + animationFrame / (20 / animationSpeed)) % (numTerms + 1)));
      if (activeTerms === 0) activeTerms = 1;
    }
    
    // Draw grid with zoom and pan
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);
    
    // Horizontal lines
    for (let y = -2; y <= 2; y += 0.5) {
      ctx.beginPath();
      ctx.moveTo(0, yOffset - y * yScale);
      ctx.lineTo(width, yOffset - y * yScale);
      
      if (y === 0) {
        ctx.strokeStyle = axisColor;
      } else {
        ctx.strokeStyle = gridColor;
      }
      
      ctx.stroke();
      
      // Add y-axis labels
      if (Number.isInteger(y)) {
        ctx.fillStyle = textColor;
        ctx.textAlign = 'right';
        ctx.fillText(y.toString(), 25, yOffset - y * yScale + 4);
      }
    }
    
    // Vertical lines (x-axis)
    for (let x = -Math.PI; x <= Math.PI; x += Math.PI / 2) {
      ctx.beginPath();
      ctx.moveTo(xOffset + (x + Math.PI) * xScale, 0);
      ctx.lineTo(xOffset + (x + Math.PI) * xScale, height);
      
      if (x === 0) {
        ctx.strokeStyle = axisColor;
      } else {
        ctx.strokeStyle = gridColor;
      }
      
      ctx.stroke();
      
      // Add x-axis labels
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      let label = '';
      if (x === -Math.PI) label = '-π';
      else if (x === -Math.PI/2) label = '-π/2';
      else if (x === 0) label = '0';
      else if (x === Math.PI/2) label = 'π/2';
      else if (x === Math.PI) label = 'π';
      
      ctx.fillText(label, xOffset + (x + Math.PI) * xScale, yOffset + 20);
    }
    
    // Draw target function
    ctx.beginPath();
    ctx.strokeStyle = targetColor;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= width; i++) {
      const x = (i / xScale) - Math.PI;
      const y = evaluateTargetFunction(targetFunction, x);
      
      if (i === 0) {
        ctx.moveTo(i, yOffset - y * yScale);
      } else {
        ctx.lineTo(i, yOffset - y * yScale);
      }
    }
    
    ctx.stroke();
    
    // Draw Fourier approximation
    ctx.beginPath();
    ctx.strokeStyle = seriesColor;
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= width; i++) {
      const x = (i / xScale) - Math.PI;
      const y = evaluateFourierSeries(coefficients, x, activeTerms);
      
      if (i === 0) {
        ctx.moveTo(i, yOffset - y * yScale);
      } else {
        ctx.lineTo(i, yOffset - y * yScale);
      }
    }
    
    ctx.stroke();
    
    // Restore canvas state
    ctx.restore();
    
    // Show active terms info
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    ctx.fillText(`Active terms: ${activeTerms} of ${numTerms}`, 10, 30);
    
    // Draw legend
    ctx.fillStyle = targetColor;
    ctx.fillRect(width - 140, 15, 15, 2);
    ctx.fillStyle = textColor;
    ctx.fillText('Target Function', width - 120, 20);
    
    ctx.fillStyle = seriesColor;
    ctx.fillRect(width - 140, 35, 15, 2);
    ctx.fillStyle = textColor;
    ctx.fillText('Fourier Series', width - 120, 40);
    
    // Update other visualizations
    if (showComponents) {
      drawComponents(coefficients, activeTerms);
    }
    
    if (showCoefficients) {
      drawCoefficientBars(coefficients, activeTerms);
    }
    
    if (showError) {
      drawErrorGraph(coefficients, activeTerms);
    }
    
    if (showEpicycles) {
      drawEpicycles(coefficients, activeTerms);
    }
  };
  
  // Draw individual Fourier components
  const drawComponents = (coefficients, activeTerms) => {
    if (!componentCanvasRef.current) return;
    
    const canvas = componentCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const gridColor = isDarkMode ? '#444' : '#e5e5e5';
    const textColor = isDarkMode ? '#ccc' : '#666';
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal line at y=0
    ctx.beginPath();
    ctx.moveTo(0, yOffset);
    ctx.lineTo(width, yOffset);
    ctx.stroke();
    
    // Get coefficients to use
    const coeffsToUse = useManualCoefficients && manualCoefficients.length > 0
      ? manualCoefficients.slice(0, activeTerms)
      : coefficients.slice(0, activeTerms);
    
    // Draw each component
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coeffsToUse[i];
      
      // Skip terms with zero coefficients
      if (Math.abs(a) < 1e-6 && Math.abs(b) < 1e-6) continue;
      
      // Calculate amplitude and phase
      const amplitude = Math.sqrt(a*a + b*b);
      
      // Skip very small terms
      if (amplitude < 0.01) continue;
      
      // Generate color based on term number
      const hue = (i * 137.5) % 360;
      const color = `hsl(${hue}, 70%, ${isDarkMode ? '60%' : '50%'})`;
      
      // Draw component
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      
      for (let j = 0; j <= width; j++) {
        const x = (j / xScale) - Math.PI;
        const y = a * Math.cos(n * x) + b * Math.sin(n * x);
        
        if (j === 0) {
          ctx.moveTo(j, yOffset - y * yScale);
        } else {
          ctx.lineTo(j, yOffset - y * yScale);
        }
      }
      
      ctx.stroke();
      
      // Add label for component
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.font = '12px Arial';
      ctx.fillText(`n=${n}: a=${a.toFixed(2)}, b=${b.toFixed(2)}`, 10, 20 + i * 20);
    }
  };
  
  // Draw coefficient bar chart
  const drawCoefficientBars = (coefficients, activeTerms) => {
    if (!coefficientCanvasRef.current) return;
    
    const canvas = coefficientCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const gridColor = isDarkMode ? '#444' : '#e5e5e5';
    const textColor = isDarkMode ? '#ccc' : '#666';
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal line at y=0
    ctx.beginPath();
    ctx.moveTo(0, yOffset);
    ctx.lineTo(width, yOffset);
    ctx.stroke();
    
    // Get coefficients to use
    const coeffsToUse = useManualCoefficients && manualCoefficients.length > 0
      ? manualCoefficients.slice(0, activeTerms)
      : coefficients.slice(0, activeTerms);
    
    // Find max amplitude for scaling
    let maxAmplitude = 0;
    for (let i = 0; i < activeTerms; i++) {
      const { a, b } = coeffsToUse[i];
      const amplitude = Math.sqrt(a*a + b*b);
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
      }
    }
    
    // Scale factor for bars
    const scaleFactor = (height / 2) / (maxAmplitude || 1);
    
    // Bar width
    const barWidth = Math.min(20, width / (activeTerms * 2));
    
    // Draw bars for each coefficient
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coeffsToUse[i];
      
      // Calculate amplitudes
      const aAmp = Math.abs(a);
      const bAmp = Math.abs(b);
      
      // Generate colors based on term number
      const hue = (i * 137.5) % 360;
      const aColor = `hsl(${hue}, 70%, ${isDarkMode ? '60%' : '50%'})`;
      const bColor = `hsl(${hue}, 50%, ${isDarkMode ? '80%' : '70%'})`;
      
      // X position
      const x = 50 + i * barWidth * 3;
      
      // Draw a coefficient bar
      if (aAmp > 0.001) {
        const height = aAmp * scaleFactor;
        ctx.fillStyle = aColor;
        ctx.fillRect(x, yOffset - (a > 0 ? height : 0), barWidth, height * (a > 0 ? 1 : -1));
        
        // Label
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.font = '10px Arial';
        ctx.fillText('a', x + barWidth / 2, yOffset + 20);
      }
      
      // Draw b coefficient bar
      if (bAmp > 0.001) {
        const height = bAmp * scaleFactor;
        ctx.fillStyle = bColor;
        ctx.fillRect(x + barWidth, yOffset - (b > 0 ? height : 0), barWidth, height * (b > 0 ? 1 : -1));
        
        // Label
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.font = '10px Arial';
        ctx.fillText('b', x + barWidth * 1.5, yOffset + 20);
      }
      
      // Term number
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.font = '10px Arial';
      ctx.fillText(`n=${n}`, x + barWidth, yOffset + 35);
    }
    
    // Legend
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillText('Coefficient Magnitudes', 10, 20);
  };
  
  // Draw error visualization
  const drawErrorGraph = (coefficients, activeTerms) => {
    if (!errorCanvasRef.current) return;
    
    const canvas = errorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const gridColor = isDarkMode ? '#444' : '#e5e5e5';
    const textColor = isDarkMode ? '#ccc' : '#666';
    const errorColor = isDarkMode ? '#f55' : '#f00';
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal line at y=0
    ctx.beginPath();
    ctx.moveTo(0, yOffset);
    ctx.lineTo(width, yOffset);
    ctx.stroke();
    
    // Draw error function
    ctx.beginPath();
    ctx.strokeStyle = errorColor;
    ctx.lineWidth = 1.5;
    
    // Calculate average error
    let totalError = 0;
    let errorCount = 0;
    
    for (let i = 0; i <= width; i++) {
      const x = (i / xScale) - Math.PI;
      const targetY = evaluateTargetFunction(targetFunction, x);
      const approximationY = evaluateFourierSeries(coefficients, x, activeTerms);
      const error = targetY - approximationY;
      
      totalError += Math.abs(error);
      errorCount++;
      
      if (i === 0) {
        ctx.moveTo(i, yOffset - error * yScale);
      } else {
        ctx.lineTo(i, yOffset - error * yScale);
      }
    }
    
    ctx.stroke();
    
    // Calculate average error
    const avgError = totalError / errorCount;
    
    // Fill area under the error curve
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0)';
    ctx.fillStyle = `${errorColor}33`;
    
    // Start at left edge
    ctx.moveTo(0, yOffset);
    
    // Draw the top of the fill area (same as the error curve)
    for (let i = 0; i <= width; i++) {
      const x = (i / xScale) - Math.PI;
      const targetY = evaluateTargetFunction(targetFunction, x);
      const approximationY = evaluateFourierSeries(coefficients, x, activeTerms);
      const error = targetY - approximationY;
      
      ctx.lineTo(i, yOffset - error * yScale);
    }
    
    // Close the path back to the start
    ctx.lineTo(width, yOffset);
    ctx.lineTo(0, yOffset);
    
    ctx.fill();
    
    // Show average error
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillText(`Mean Absolute Error: ${avgError.toFixed(4)}`, 10, 20);
    ctx.fillText(`RMS Error: ${Math.sqrt(totalError * totalError / errorCount).toFixed(4)}`, 10, 40);
  };
  
  // Draw epicycle visualization
  const drawEpicycles = (coefficients, activeTerms) => {
    if (!epicycleCanvasRef.current) return;
    
    const canvas = epicycleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply theme
    const bgColor = isDarkMode ? '#222' : '#fff';
    const textColor = isDarkMode ? '#ccc' : '#666';
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Get time from animation frame
    const time = (animationFrame % 200) / 100 * Math.PI;
    
    // Center point for epicycles
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Get coefficients to use
    const coeffsToUse = useManualCoefficients && manualCoefficients.length > 0
      ? manualCoefficients.slice(0, activeTerms)
      : coefficients.slice(0, activeTerms);
    
    // Draw epicycles
    let x = centerX;
    let y = centerY;
    
    // Sort coefficients by amplitude
    const sortedCoeffs = coeffsToUse.map((coeff, idx) => ({
      ...coeff,
      n: idx + 1,
      amplitude: Math.sqrt(coeff.a * coeff.a + coeff.b * coeff.b)
    })).sort((a, b) => b.amplitude - a.amplitude);
    
    // Path for trace
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Draw each circle
    for (let i = 0; i < sortedCoeffs.length; i++) {
      const { a, b, n, amplitude } = sortedCoeffs[i];
      
      // Skip very small amplitudes
      if (amplitude < 0.01) continue;
      
      // Calculate angle
      const angle = n * time;
      
      // Draw circle
      ctx.beginPath();
      ctx.strokeStyle = isDarkMode ? '#555' : '#ddd';
      ctx.lineWidth = 1;
      ctx.arc(x, y, amplitude * yScale, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Calculate next point
      const dx = amplitude * Math.cos(angle + Math.atan2(b, a)) * yScale;
      const dy = amplitude * Math.sin(angle + Math.atan2(b, a)) * yScale;
      
      // Draw radius
      ctx.beginPath();
      ctx.strokeStyle = isDarkMode ? '#aaa' : '#999';
      ctx.lineWidth = 1;
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
      
      // Update current point
      x += dx;
      y += dy;
    }
    
    // Draw final point
    ctx.beginPath();
    ctx.fillStyle = isDarkMode ? '#f55' : '#f00';
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Title
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillText('Epicycle Visualization', 10, 20);
    
    // Explanation
    ctx.fillText('Each circle represents a term in the Fourier series', 10, height - 30);
    ctx.fillText('The red dot traces the approximated curve', 10, height - 10);
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
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += height / 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical lines
    for (let x = 0; x < width; x += width / 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
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
  
  // Play audio representation of the Fourier series
  const playAudio = () => {
    if (!audioContext) return;
    
    if (isPlaying) {
      // Stop current playback
      if (audioNode) {
        audioNode.stop();
        audioNode.disconnect();
      }
      setIsPlaying(false);
      return;
    }
    
    // Get coefficients
    const coefficients = useManualCoefficients ? manualCoefficients : calculateFourierCoefficients(targetFunction, numTerms);
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set initial volume
    gainNode.gain.value = 0.3;
    
    // Fundamental frequency (C4 = 261.63 Hz)
    const fundamental = 261.63;
    
    // Create wave
    const real = new Float32Array(numTerms + 1);
    const imag = new Float32Array(numTerms + 1);
    
    // DC offset (a₀/2)
    real[0] = 0;
    imag[0] = 0;
    
    // Set harmonics from Fourier coefficients
    for (let i = 0; i < coefficients.length; i++) {
      const { a, b } = coefficients[i];
      real[i + 1] = a;
      imag[i + 1] = b;
    }
    
    // Create and set periodic wave
    const wave = audioContext.createPeriodicWave(real, imag);
    oscillator.setPeriodicWave(wave);
    
    // Set frequency
    oscillator.frequency.value = fundamental;
    
    // Start oscillator
    oscillator.start();
    
    // Store audio node for later cleanup
    setAudioNode(oscillator);
    setIsPlaying(true);
    
    // Stop after 2 seconds
    setTimeout(() => {
      oscillator.stop();
      oscillator.disconnect();
      setIsPlaying(false);
    }, 2000);
  };
  
  // Export the current view as an image
  const exportImage = () => {
    // Create a composite canvas with all visible elements
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = isDarkMode ? '#222' : '#fff';
    ctx.fillRect(0, 0, width, height);
    
    // Copy main canvas
    if (mainCanvasRef.current) {
      ctx.drawImage(mainCanvasRef.current, 0, 0);
    }
    
    // Create a download link
    const link = document.createElement('a');
    link.download = 'fourier-series.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };
  
  // Generate a shareable URL
  const generateShareableUrl = () => {
    // Create URL parameters
    const params = new URLSearchParams({
      func: targetFunction,
      terms: numTerms,
      dark: isDarkMode ? '1' : '0'
    });
    
    if (targetFunction === 'custom') {
      params.append('eq', encodeURIComponent(customEquation));
    }
    
    // Create and copy URL
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      alert('Shareable URL copied to clipboard!');
    }).catch(() => {
      alert('URL generated! Use this link to share: ' + url);
    });
  };
  
  // Load parameters from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      // Load function type
      const func = params.get('func');
      if (func && targetFunctions.find(f => f.id === func)) {
        setTargetFunction(func);
      }
      
      // Load number of terms
      const terms = params.get('terms');
      if (terms && !isNaN(parseInt(terms))) {
        setNumTerms(Math.min(50, Math.max(1, parseInt(terms))));
      }
      
      // Load dark mode setting
      const dark = params.get('dark');
      if (dark) {
        setIsDarkMode(dark === '1');
      }
      
      // Load custom equation
      const eq = params.get('eq');
      if (eq) {
        setCustomEquation(decodeURIComponent(eq));
      }
    }
  }, []);
  
  // Animation loop for visualizing terms being added
  useEffect(() => {
    if (animateTerms || showEpicycles) {
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
  }, [animateTerms, showEpicycles, animationSpeed]);
  
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
    drawFunctions();
  }, [
    targetFunction, 
    numTerms, 
    animationFrame, 
    showComponents, 
    showCoefficients, 
    showError, 
    showEpicycles, 
    customEquation,
    isDarkMode,
    zoom,
    panOffset,
    manualCoefficients,
    useManualCoefficients,
    drawingPoints
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
      <h1 className="text-2xl font-bold mb-4 text-center">Fourier Series Explorer</h1>
      
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
              max="500"
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
                  id="animateTerms"
                  checked={animateTerms}
                  onChange={() => setAnimateTerms(!animateTerms)}
                  className="mr-2"
                />
                <label htmlFor="animateTerms" className="text-sm">Animate Terms</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showComponents"
                  checked={showComponents}
                  onChange={() => setShowComponents(!showComponents)}
                  className="mr-2"
                />
                <label htmlFor="showComponents" className="text-sm">Show Components</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCoefficients"
                  checked={showCoefficients}
                  onChange={() => setShowCoefficients(!showCoefficients)}
                  className="mr-2"
                />
                <label htmlFor="showCoefficients" className="text-sm">Show Coefficients</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showError"
                  checked={showError}
                  onChange={() => setShowError(!showError)}
                  className="mr-2"
                />
                <label htmlFor="showError" className="text-sm">Show Error</label>
              </div>
              
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
                  id="showTermControls"
                  checked={showTermControls}
                  onChange={() => setShowTermControls(!showTermControls)}
                  className="mr-2"
                />
                <label htmlFor="showTermControls" className="text-sm">Edit Coefficients</label>
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
                onClick={playAudio}
                className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
              >
                {isPlaying ? '🔇 Stop Audio' : '🔊 Play Sound'}
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
        
        {/* Export and share buttons */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={exportImage}
            className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
          >
            📥 Export Image
          </button>
          
          <button
            onClick={generateShareableUrl}
            className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
          >
            🔗 Share URL
          </button>
        </div>
      </div>
      
      {/* Main visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
          <h2 className="text-lg font-medium mb-2">Fourier Series Visualization</h2>
          
          {isDrawingMode && targetFunction === 'drawing' ? (
            <canvas
              ref={drawingCanvasRef}
              width={width}
              height={height}
              className="w-full border rounded cursor-crosshair"
              onMouseDown={handleDrawingMouseDown}
              onMouseMove={handleDrawingMouseMove}
              onMouseUp={handleDrawingMouseUp}
              onMouseLeave={handleDrawingMouseUp}
              onTouchStart={handleDrawingTouchStart}
              onTouchMove={handleDrawingTouchMove}
              onTouchEnd={handleDrawingTouchEnd}
            />
          ) : (
            <canvas
              ref={mainCanvasRef}
              width={width}
              height={height}
              className="w-full border rounded cursor-grab"
              onMouseDown={handlePanStart}
              onMouseMove={handlePanMove}
              onMouseUp={handlePanEnd}
              onMouseLeave={handlePanEnd}
              onWheel={handleZoom}
            />
          )}
          
          <div className="flex justify-between mt-2">
            <div className="text-sm opacity-70">
              {!isDrawingMode && <>
                <button
                  onClick={() => {
                    setZoom(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-2 py-1 text-xs rounded mr-2 ${buttonSecondaryClass}`}
                >
                  Reset View
                </button>
                Zoom: {zoom.toFixed(1)}x
              </>}
            </div>
            <div className="text-sm opacity-70">
              {isDrawingMode && targetFunction === 'drawing' && 
                `Points: ${drawingPoints.length}`
              }
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          {/* Component visualization */}
          {showComponents && (
            <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
              <h2 className="text-lg font-medium mb-2">Individual Components</h2>
              <canvas
                ref={componentCanvasRef}
                width={width}
                height={height}
                className="w-full border rounded"
              />
            </div>
          )}
          
          {/* Coefficient visualization */}
          {showCoefficients && (
            <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
              <h2 className="text-lg font-medium mb-2">Coefficient Magnitudes</h2>
              <canvas
                ref={coefficientCanvasRef}
                width={width}
                height={height}
                className="w-full border rounded"
              />
            </div>
          )}
          
          {/* Error visualization */}
          {showError && (
            <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
              <h2 className="text-lg font-medium mb-2">Error Visualization</h2>
              <canvas
                ref={errorCanvasRef}
                width={width}
                height={height}
                className="w-full border rounded"
              />
            </div>
          )}
          
          {/* Epicycle visualization */}
          {showEpicycles && (
            <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
              <h2 className="text-lg font-medium mb-2">Epicycle Visualization</h2>
              <canvas
                ref={epicycleCanvasRef}
                width={width}
                height={height}
                className="w-full border rounded"
              />
            </div>
          )}
          
          {/* Interactive coefficient editor */}
          {showTermControls && (
            <div className={`p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium">Interactive Coefficients</h2>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useManualCoefficients"
                    checked={useManualCoefficients}
                    onChange={() => setUseManualCoefficients(!useManualCoefficients)}
                    className="mr-2"
                  />
                  <label htmlFor="useManualCoefficients" className="text-sm">Enable Manual Mode</label>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {manualCoefficients.slice(0, 10).map((coeff, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs mb-1">a₍{idx+1}₎: {coeff.a.toFixed(2)}</label>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.01"
                        value={coeff.a}
                        disabled={!useManualCoefficients}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setManualCoefficients(prev => {
                            const newCoeffs = [...prev];
                            newCoeffs[idx] = { ...newCoeffs[idx], a: newValue };
                            return newCoeffs;
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">b₍{idx+1}₎: {coeff.b.toFixed(2)}</label>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.01"
                        value={coeff.b}
                        disabled={!useManualCoefficients}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setManualCoefficients(prev => {
                            const newCoeffs = [...prev];
                            newCoeffs[idx] = { ...newCoeffs[idx], b: newValue };
                            return newCoeffs;
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {useManualCoefficients && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => {
                      const coeffs = calculateFourierCoefficients(targetFunction, numTerms);
                      setManualCoefficients(coeffs);
                    }}
                    className={`px-3 py-1 text-sm rounded ${buttonSecondaryClass}`}
                  >
                    Reset to Calculated Values
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={`mt-6 p-4 rounded-lg ${cardClass} transition-colors duration-300`}>
        <h2 className="text-lg font-medium mb-2">About Fourier Series</h2>
        <p className="mb-2">
          A Fourier series represents a periodic function as a sum of sine and cosine terms.
          The general form is:
        </p>
        <div className={`p-2 rounded mb-2 text-center italic ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          f(x) = a₀/2 + Σ[aₙ·cos(nx) + bₙ·sin(nx)]
        </div>
        <p className="mb-2">
          The more terms you include, the better the approximation. Each function has a unique 
          set of Fourier coefficients that determine how much each frequency contributes to the overall shape.
        </p>
        <p>
          Try the different visualizations to understand how Fourier series work:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Use the <b>Components</b> view to see individual frequency contributions</li>
          <li>Use the <b>Coefficients</b> view to see the magnitude of each frequency</li>
          <li>Use the <b>Error</b> view to see how the approximation improves with more terms</li>
          <li>Use the <b>Epicycles</b> view to see how rotating vectors create the function</li>
          <li>Try <b>Drawing</b> your own function to see how it's represented in frequency space</li>
          <li>Use <b>Interactive Coefficients</b> to manually adjust the frequency components</li>
        </ul>
      </div>
    </div>
  );
};

export default FourierSeriesExplorer;
