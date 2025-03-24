import React, { useState, useEffect, useRef } from 'react';
import { presets, generators } from '../utils/presets';
import { drawSignal, drawAxes } from '../utils/drawingUtils';

const FourierPresetDemo = () => {
  // State for selected preset
  const [selectedPreset, setSelectedPreset] = useState('sine');
  
  // State for custom wave parameters
  const [amplitude, setAmplitude] = useState(50);
  const [frequency, setFrequency] = useState(2);
  const [phase, setPhase] = useState(0);
  
  // Canvas references
  const originalCanvasRef = useRef(null);
  const customCanvasRef = useRef(null);
  
  // Draw original preset
  useEffect(() => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Draw axes
    drawAxes(ctx, width, height, '#ccc', true);
    
    // Find selected preset
    const preset = presets.find(p => p.id === selectedPreset);
    if (preset && preset.points && preset.points.length > 0) {
      // Draw the signal
      drawSignal(ctx, preset.points, 'blue', 2);
    }
  }, [selectedPreset]);
  
  // Draw custom sine wave with parameters
  useEffect(() => {
    const canvas = customCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Draw axes
    drawAxes(ctx, width, height, '#ccc', true);
    
    // Generate custom sine wave
    const points = generators.generateSineWave(
      amplitude,
      frequency,
      phase,
      200,
      width,
      height
    );
    
    // Draw the signal
    drawSignal(ctx, points, 'red', 2);
  }, [amplitude, frequency, phase]);
  
  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Fourier Visualization Demo</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left panel - Preset signals */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Preset Signals</h3>
          
          <div className="mb-4">
            <select 
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            
            {/* Description of selected preset */}
            <div className="mt-2 text-sm text-gray-600">
              {presets.find(p => p.id === selectedPreset)?.description}
            </div>
          </div>
          
          {/* Canvas for preset visualization */}
          <canvas 
            ref={originalCanvasRef}
            width={400}
            height={200}
            className="w-full border rounded"
          />
        </div>
        
        {/* Right panel - Custom sine wave */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Custom Sine Wave</h3>
          
          <div className="space-y-4 mb-4">
            {/* Amplitude slider */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amplitude: {amplitude}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={amplitude}
                onChange={(e) => setAmplitude(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Frequency slider */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency: {frequency}
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Phase slider */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phase: {phase.toFixed(2)} rad
              </label>
              <input
                type="range"
                min="0"
                max={Math.PI * 2}
                step="0.1"
                value={phase}
                onChange={(e) => setPhase(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Canvas for custom wave visualization */}
          <canvas 
            ref={customCanvasRef}
            width={400}
            height={200}
            className="w-full border rounded"
          />
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">About Fourier Series</h3>
        <p className="text-sm">
          Fourier series allows any periodic function to be represented as a sum of sine and cosine waves of different frequencies.
          The concept is fundamental to signal processing, acoustics, quantum mechanics, and many other fields.
          Adjust the parameters above to see how changing amplitude, frequency, and phase affects a sine wave.
        </p>
      </div>
    </div>
  );
};

export default FourierPresetDemo;
