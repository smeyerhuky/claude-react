import React, { useState, useEffect, useRef } from 'react';
import SignalCanvas from './components/SignalCanvas';
import EpicyclesVisualizer from './components/EpicyclesVisualizer';
import ControlPanel from './components/ControlPanel';
import PresetSelector from './components/PresetSelector';
import { useSignalDrawing } from './hooks/useSignalDrawing';
import { useFourierSeries } from './hooks/useFourierSeries';
import { useAnimationFrame } from './hooks/useAnimationFrame';
import { presets } from './utils/presets';

/**
 * Component for demonstrating Fourier Series concepts
 * Shows how a drawn or selected signal can be approximated using
 * a sum of sine and cosine waves (or equivalently, using epicycles)
 */
const FourierSeriesDemo = () => {
  // Canvas reference for the signal drawing
  const canvasRef = useRef(null);
  
  // State for the number of Fourier terms to use
  const [numTerms, setNumTerms] = useState(10);
  // State for animation time (0 to 2π)
  const [time, setTime] = useState(0);
  // State for whether the animation is running
  const [isAnimating, setIsAnimating] = useState(true);
  // State for animation speed
  const [speed, setSpeed] = useState(1);
  
  // State for user-drawn signal points
  const [signalPoints, setSignalPoints] = useState([]);
  // State for current preset (null for custom drawing)
  const [activePreset, setActivePreset] = useState(null);
  
  // Custom hook for drawing on canvas
  const { 
    isDrawing, 
    startDrawing, 
    continueDrawing, 
    endDrawing, 
    clearDrawing 
  } = useSignalDrawing(canvasRef, setSignalPoints);
  
  // Hook for computing Fourier series coefficients
  const { coefficients, approximation } = useFourierSeries(signalPoints, numTerms);
  
  // Load initial preset
  useEffect(() => {
    if (presets.length > 0 && !activePreset) {
      handlePresetSelect(presets[0].id);
    }
  }, []);
  
  // Animation loop using custom hook
  useAnimationFrame((deltaTime) => {
    if (isAnimating) {
      // Update time (0 to 2π) for the animation
      setTime((prevTime) => {
        const newTime = prevTime + deltaTime * 0.001 * speed;
        // Loop back to start when we reach 2π
        return newTime >= Math.PI * 2 ? 0 : newTime;
      });
    }
  }, isAnimating);
  
  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setActivePreset(preset);
      setSignalPoints(preset.points);
    }
  };
  
  // Toggle animation state
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };
  
  // Clear current drawing and reset to drawing mode
  const handleClearDrawing = () => {
    clearDrawing();
    setActivePreset(null);
  };
  
  // Handle term count change
  const handleTermCountChange = (value) => {
    setNumTerms(value);
  };
  
  // Handle speed change
  const handleSpeedChange = (value) => {
    setSpeed(value);
  };
  
  return (
    <div className="fourier-series-demo">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Signal canvas and drawing controls */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Signal Drawing</h2>
            
            <SignalCanvas 
              ref={canvasRef}
              width={300}
              height={300}
              points={signalPoints}
              onMouseDown={startDrawing}
              onMouseMove={continueDrawing}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={continueDrawing}
              onTouchEnd={endDrawing}
            />
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={handleClearDrawing}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex-grow"
                aria-label="Clear drawing"
              >
                Clear Drawing
              </button>
              
              <button
                onClick={toggleAnimation}
                className={`px-3 py-1 rounded flex-grow ${
                  isAnimating 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                aria-label={isAnimating ? "Pause animation" : "Start animation"}
              >
                {isAnimating ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>
          
          {/* Preset signal selector */}
          <PresetSelector 
            presets={presets}
            activePreset={activePreset}
            onSelectPreset={handlePresetSelect}
          />
        </div>
        
        {/* Center column: Epicycles visualization */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Epicycles Visualization</h2>
            
            <div className="flex-grow flex items-center justify-center">
              <EpicyclesVisualizer 
                coefficients={coefficients}
                time={time}
                width={300}
                height={300}
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>The epicycles represent the Fourier series terms as rotating circles.</p>
            </div>
          </div>
        </div>
        
        {/* Right column: Reconstructed signal and controls */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Reconstructed Signal</h2>
            
            <div className="border rounded-lg overflow-hidden">
              <SignalCanvas 
                width={300}
                height={300}
                points={approximation}
                originalPoints={signalPoints}
                showOriginal={true}
                approximation={true}
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>Blue: Original signal</p>
              <p>Red: Fourier series approximation with {numTerms} terms</p>
            </div>
          </div>
          
          {/* Controls for adjusting the visualization */}
          <ControlPanel 
            numTerms={numTerms}
            onNumTermsChange={handleTermCountChange}
            speed={speed}
            onSpeedChange={handleSpeedChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FourierSeriesDemo;
