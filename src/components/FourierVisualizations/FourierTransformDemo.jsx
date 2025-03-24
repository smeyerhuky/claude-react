import React, { useState, useRef, useEffect } from 'react';
import SignalCanvas from './components/SignalCanvas';
import FrequencySpectrumPlot from './components/FrequencySpectrumPlot';
import ControlPanel from './components/ControlPanel';
import PresetSelector from './components/PresetSelector';
import { useSignalDrawing } from './hooks/useSignalDrawing';
import { useFourierTransform } from './hooks/useFourierTransform';
import { presets } from './utils/presets';

/**
 * Component for demonstrating Fourier Transform concepts
 * Shows the relationship between a signal in the time domain
 * and its representation in the frequency domain
 */
const FourierTransformDemo = () => {
  // Canvas reference for the signal drawing
  const canvasRef = useRef(null);
  
  // State for the signal points
  const [signalPoints, setSignalPoints] = useState([]);
  // State for active preset
  const [activePreset, setActivePreset] = useState(null);
  // State for display mode (magnitude, phase, real/imaginary)
  const [displayMode, setDisplayMode] = useState('magnitude');
  // State for visualization scale
  const [scale, setScale] = useState(1);
  
  // Custom hook for drawing on canvas
  const { 
    isDrawing, 
    startDrawing, 
    continueDrawing, 
    endDrawing, 
    clearDrawing 
  } = useSignalDrawing(canvasRef, setSignalPoints);
  
  // Hook for computing Fourier transform
  const { 
    frequencyData, 
    inverseFourierTransform 
  } = useFourierTransform(signalPoints);
  
  // Load initial preset
  useEffect(() => {
    if (presets.length > 0 && !activePreset) {
      handlePresetSelect(presets[0].id);
    }
  }, []);
  
  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setActivePreset(preset);
      setSignalPoints(preset.points);
    }
  };
  
  // Clear current drawing and reset to drawing mode
  const handleClearDrawing = () => {
    clearDrawing();
    setActivePreset(null);
  };
  
  // Handle display mode change
  const handleDisplayModeChange = (mode) => {
    setDisplayMode(mode);
  };
  
  // Handle scale change
  const handleScaleChange = (value) => {
    setScale(value);
  };
  
  // Draw frequency-filtered reconstruction
  const [filterFrequencies, setFilterFrequencies] = useState({
    lowPass: 1.0,  // Value between 0-1, representing cutoff as fraction of max frequency
    highPass: 0.0  // Value between 0-1, representing cutoff as fraction of max frequency
  });
  
  // Apply frequency filtering
  const handleLowPassChange = (value) => {
    setFilterFrequencies(prev => ({ ...prev, lowPass: value }));
  };
  
  const handleHighPassChange = (value) => {
    setFilterFrequencies(prev => ({ ...prev, highPass: value }));
  };
  
  // Get the reconstructed signal after frequency filtering
  const filteredSignal = inverseFourierTransform(
    filterFrequencies.lowPass,
    filterFrequencies.highPass
  );
  
  return (
    <div className="fourier-transform-demo">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Signal drawing and input */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Time Domain Signal</h2>
            
            <SignalCanvas 
              ref={canvasRef}
              width={500}
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
            </div>
          </div>
          
          {/* Preset signal selector */}
          <PresetSelector 
            presets={presets}
            activePreset={activePreset}
            onSelectPreset={handlePresetSelect}
          />
        </div>
        
        {/* Right column: Frequency spectrum and filtered signal */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Frequency Domain Representation</h2>
            
            <FrequencySpectrumPlot 
              frequencyData={frequencyData}
              displayMode={displayMode}
              width={500}
              height={300}
              scale={scale}
              lowPassCutoff={filterFrequencies.lowPass}
              highPassCutoff={filterFrequencies.highPass}
            />
            
            {/* Display mode selector */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['magnitude', 'phase', 'real', 'imaginary'].map(mode => (
                <button
                  key={mode}
                  onClick={() => handleDisplayModeChange(mode)}
                  className={`px-3 py-1 rounded text-sm ${
                    displayMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Filtered signal reconstruction */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Filtered Signal Reconstruction</h2>
            
            <SignalCanvas 
              width={500}
              height={200}
              points={filteredSignal}
              originalPoints={signalPoints}
              showOriginal={true}
              approximation={true}
            />
            
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Low-pass Filter: {Math.round(filterFrequencies.lowPass * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={filterFrequencies.lowPass}
                  onChange={(e) => handleLowPassChange(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Removes high-frequency components above the cutoff
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  High-pass Filter: {Math.round(filterFrequencies.highPass * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={filterFrequencies.highPass}
                  onChange={(e) => handleHighPassChange(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Removes low-frequency components below the cutoff
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Visualization Scale: {scale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FourierTransformDemo;
