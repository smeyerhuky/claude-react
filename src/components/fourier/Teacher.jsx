import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

const FourierSeriesTeacher = () => {
  // State for controlling the visualization
  const [targetFunction, setTargetFunction] = useState('square');
  const [numTerms, setNumTerms] = useState(5);
  const [animateTerms, setAnimateTerms] = useState(false);
  const [showComponents, setShowComponents] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  
  // Canvas references
  const mainCanvasRef = useRef(null);
  const componentCanvasRef = useRef(null);
  
  // Animation reference
  const animationRef = useRef(null);
  
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
    { id: 'custom', name: 'Custom (x^2)' }
  ];
  
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
        // For x^2 (shifted to be periodic): Use numerical integration
        // This is a simplified approximation
        for (let i = 1; i <= n; i++) {
          // Numerical integration to find a_n and b_n
          let a = 0, b = 0;
          const steps = 100;
          const dx = 2 * Math.PI / steps;
          
          for (let j = 0; j < steps; j++) {
            const x = j * dx - Math.PI;
            const fx = x * x - Math.PI * Math.PI / 3; // Shifted to have avg = 0
            
            a += fx * Math.cos(i * x) * dx / Math.PI;
            b += fx * Math.sin(i * x) * dx / Math.PI;
          }
          
          coefficients.push({ a, b });
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
        return mappedX * mappedX - Math.PI * Math.PI / 3; // Shifted to have avg = 0
        
      default:
        return 0;
    }
  };
  
  // Function to evaluate the Fourier series at a point
  const evaluateFourierSeries = (coefficients, x, activeTerms = coefficients.length) => {
    let sum = 0;
    
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coefficients[i];
      sum += a * Math.cos(n * x) + b * Math.sin(n * x);
    }
    
    return sum;
  };
  
  // Draw function on canvas
  const drawFunctions = () => {
    if (!mainCanvasRef.current) return;
    
    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate Fourier coefficients
    const coefficients = calculateFourierCoefficients(targetFunction, numTerms);
    
    // Active terms based on animation state
    let activeTerms = numTerms;
    if (animateTerms) {
      activeTerms = Math.max(1, Math.min(numTerms, Math.floor(1 + animationFrame / 20) % (numTerms + 1)));
      if (activeTerms === 0) activeTerms = 1;
    }
    
    // Draw grid
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let y = -2; y <= 2; y += 0.5) {
      ctx.beginPath();
      ctx.moveTo(0, yOffset - y * yScale);
      ctx.lineTo(width, yOffset - y * yScale);
      
      if (y === 0) {
        ctx.strokeStyle = '#aaa';
      } else {
        ctx.strokeStyle = '#e5e5e5';
      }
      
      ctx.stroke();
      
      // Add y-axis labels
      if (Number.isInteger(y)) {
        ctx.fillStyle = '#666';
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
        ctx.strokeStyle = '#aaa';
      } else {
        ctx.strokeStyle = '#e5e5e5';
      }
      
      ctx.stroke();
      
      // Add x-axis labels
      ctx.fillStyle = '#666';
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
    ctx.strokeStyle = '#999';
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
    ctx.strokeStyle = '#f00';
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
    
    // Show active terms info
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    ctx.fillText(`Active terms: ${activeTerms} of ${numTerms}`, 10, 30);
    
    // Draw legend
    ctx.fillStyle = '#999';
    ctx.fillRect(width - 140, 15, 15, 2);
    ctx.fillStyle = '#333';
    ctx.fillText('Target Function', width - 120, 20);
    
    ctx.fillStyle = '#f00';
    ctx.fillRect(width - 140, 35, 15, 2);
    ctx.fillStyle = '#333';
    ctx.fillText('Fourier Series', width - 120, 40);
    
    // Draw individual components if enabled
    if (showComponents) {
      drawComponents(coefficients, activeTerms);
    }
  };
  
  // Draw individual Fourier components
  const drawComponents = (coefficients, activeTerms) => {
    if (!componentCanvasRef.current) return;
    
    const canvas = componentCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    
    // Horizontal line at y=0
    ctx.beginPath();
    ctx.moveTo(0, yOffset);
    ctx.lineTo(width, yOffset);
    ctx.strokeStyle = '#aaa';
    ctx.stroke();
    
    // Draw each component
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coefficients[i];
      
      // Skip terms with zero coefficients
      if (Math.abs(a) < 1e-6 && Math.abs(b) < 1e-6) continue;
      
      // Calculate amplitude and phase
      const amplitude = Math.sqrt(a*a + b*b);
      const phase = Math.atan2(b, a);
      
      // Skip very small terms
      if (amplitude < 0.01) continue;
      
      // Generate color based on term number
      const hue = (i * 137.5) % 360;
      const color = `hsl(${hue}, 70%, 50%)`;
      
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
  
  // Animation loop for visualizing terms being added
  useEffect(() => {
    if (animateTerms) {
      const animate = () => {
        setAnimationFrame(prev => prev + 1);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [animateTerms]);
  
  // Redraw when parameters change
  useEffect(() => {
    drawFunctions();
  }, [targetFunction, numTerms, animationFrame, showComponents]);
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Fourier Series Explorer</h1>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Target Function:</label>
            <select
              value={targetFunction}
              onChange={(e) => setTargetFunction(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {targetFunctions.map(func => (
                <option key={func.id} value={func.id}>{func.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Number of Terms: {numTerms}</label>
            <input
              type="range"
              min="1"
              max="500"
              value={numTerms}
              onChange={(e) => setNumTerms(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
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
            <label htmlFor="showComponents" className="text-sm">Show Individual Components</label>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg shadow-md mb-6">
        <canvas
          ref={mainCanvasRef}
          width={width}
          height={height}
          className="w-full border rounded bg-white"
        />
      </div>
      
      {showComponents && (
        <div className="bg-gray-50 p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-medium mb-2">Individual Components</h2>
          <canvas
            ref={componentCanvasRef}
            width={width}
            height={height}
            className="w-full border rounded bg-white"
          />
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-medium mb-2">About Fourier Series</h2>
        <p className="mb-2">
          A Fourier series represents a periodic function as a sum of sine and cosine terms.
          The general form is:
        </p>
        <div className="p-2 bg-white rounded mb-2 text-center italic">
          f(x) = a₀/2 + Σ[aₙ·cos(nx) + bₙ·sin(nx)]
        </div>
        <p className="mb-2">
          The more terms you include, the better the approximation. Each function has a unique 
          set of Fourier coefficients that determine how much each frequency contributes to the overall shape.
        </p>
        <p>
          In this explorer, you can see how different periodic functions are approximated by their Fourier series
          and observe how adding more terms increases the accuracy of the approximation.
        </p>
      </div>
    </div>
  );
};

export default FourierSeriesTeacher;
