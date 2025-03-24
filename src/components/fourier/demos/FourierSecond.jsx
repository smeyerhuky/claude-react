import React, { useState, useCallback } from 'react';
import EnhancedFourierTraceVisualizer from './helpers/EnhancedFourierTraceVisualizer';

// This wrapper component integrates the enhanced trace visualization 
// with your existing FourierSeriesExplorer (FourierFirst)
const EnhancedFourierExplorer = () => {
  // State (similar to your existing FourierFirst component)
  const [targetFunction, setTargetFunction] = useState('square');
  const [numTerms, setNumTerms] = useState(5);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Fourier calculation functions (moved from your FourierFirst component)
  const calculateFourierCoefficients = useCallback((func, n) => {
    const coefficients = [];
    
    // Implementation from your existing component
    switch(func) {
      case 'square':
        for (let i = 1; i <= n; i++) {
          if (i % 2 === 1) {
            coefficients.push({ a: 0, b: 4 / (i * Math.PI) });
          } else {
            coefficients.push({ a: 0, b: 0 });
          }
        }
        break;
        
      case 'sawtooth':
        for (let i = 1; i <= n; i++) {
          const sign = Math.pow(-1, i+1);
          coefficients.push({ a: 0, b: 2 / (i * Math.PI) * sign });
        }
        break;
        
      case 'triangle':
        for (let i = 1; i <= n; i++) {
          if (i % 2 === 1) {
            coefficients.push({ a: 0, b: 8 / (i * i * Math.PI * Math.PI) });
          } else {
            coefficients.push({ a: 0, b: 0 });
          }
        }
        break;
        
      // Add other cases from your existing component
      default:
        // Default to square wave
        for (let i = 1; i <= n; i++) {
          if (i % 2 === 1) {
            coefficients.push({ a: 0, b: 4 / (i * Math.PI) });
          } else {
            coefficients.push({ a: 0, b: 0 });
          }
        }
    }
    
    return coefficients;
  }, []);
  
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
        
      // Add other cases from your existing component
      default:
        return mappedX >= 0 ? 1 : -1;
    }
  }, []);
  
  // Evaluate Fourier series
  const evaluateFourierSeries = useCallback((coefficients, x, activeTerms = coefficients.length) => {
    let sum = 0;
    
    for (let i = 0; i < activeTerms; i++) {
      const n = i + 1;
      const { a, b } = coefficients[i] || { a: 0, b: 0 };
      sum += a * Math.cos(n * x) + b * Math.sin(n * x);
    }
    
    return sum;
  }, []);
  
  // Get coefficients for current function and terms
  const coefficients = calculateFourierCoefficients(targetFunction, numTerms);
  
  // Theme-based classes
  const containerClass = isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800';
  const cardClass = isDarkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md';
  
  return (
    <div className={`p-4 ${containerClass} transition-colors duration-300`}>
      <h1 className="text-2xl font-bold mb-4 text-center">Enhanced Fourier Explorer</h1>
      
      {/* Controls - similar to your existing UI */}
      <div className={`p-4 rounded-lg mb-6 ${cardClass}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Function:</label>
            <select
              value={targetFunction}
              onChange={(e) => setTargetFunction(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="square">Square Wave</option>
              <option value="sawtooth">Sawtooth Wave</option>
              <option value="triangle">Triangle Wave</option>
              {/* Add other options from your existing component */}
            </select>
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
            
            <label className="block text-sm font-medium mt-3 mb-1">
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
          
          <div className="flex items-center">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-4 py-2 rounded ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`}
            >
              {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Visualization Component */}
      <div className={`p-4 rounded-lg ${cardClass}`}>
        <EnhancedFourierTraceVisualizer
          width={800}
          height={400}
          coefficients={coefficients}
          targetFunction={targetFunction}
          isDarkMode={isDarkMode}
          animationSpeed={animationSpeed}
          numTerms={numTerms}
          evaluateFourierSeries={evaluateFourierSeries}
          evaluateTargetFunction={evaluateTargetFunction}
        />
      </div>
      
      {/* Educational notes - optional */}
      <div className={`mt-6 p-4 rounded-lg ${cardClass}`}>
        <h2 className="text-lg font-medium mb-2">Viewing Guide</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>The <strong>trace</strong> shows how the function evolves over time</li>
          <li>Use the <strong>scrubber</strong> at the bottom to move through time manually</li>
          <li>The <strong>phase diagram</strong> shows the relationship between position and velocity</li>
          <li>Try different <strong>trace modes</strong> to see various visualizations:
            <ul className="ml-5 mt-1 list-disc">
              <li><strong>Fading</strong>: Points fade out over time</li>
              <li><strong>Persistent</strong>: Shows the complete function</li>
              <li><strong>Windowed</strong>: Shows a sliding window of time</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedFourierExplorer;
