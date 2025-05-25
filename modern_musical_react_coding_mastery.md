import React, { useState, useRef, useEffect, useCallback } from 'react';

const InteractiveWebAudioDemo = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [frequency, setFrequency] = useState(440);
  const [waveform, setWaveform] = useState('sine');
  const [analyserData, setAnalyserData] = useState(new Uint8Array(128));
  const [isInitialized, setIsInitialized] = useState(false);
  
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Modern AudioContext initialization pattern
  const initializeAudio = useCallback(async () => {
    try {
      const ctx = new AudioContext();
      
      // Handle suspended state (modern browser requirement)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Create audio nodes following best practices
      const gainNode = ctx.createGain();
      const analyser = ctx.createAnalyser();
      
      // Configure analyser for visualization
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      // Connect audio graph
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);
      
      setAudioContext(ctx);
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;
      setIsInitialized(true);
      
      return ctx;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }, []);

  // Clean oscillator management pattern
  const startOscillator = useCallback(() => {
    if (!audioContext) return;
    
    // Clean up existing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    
    // Create new oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Connect to audio graph
    oscillator.connect(gainNodeRef.current);
    oscillator.start();
    
    oscillatorRef.current = oscillator;
    setIsPlaying(true);
  }, [audioContext, waveform, frequency]);

  const stopOscillator = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  // Parameter update with proper timing
  useEffect(() => {
    if (gainNodeRef.current && audioContext) {
      gainNodeRef.current.gain.setValueAtTime(
        volume, 
        audioContext.currentTime
      );
    }
  }, [volume, audioContext]);

  // Real-time visualization using requestAnimationFrame
  useEffect(() => {
    if (!analyserRef.current || !isPlaying) return;
    
    const updateVisualization = () => {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      setAnalyserData(dataArray);
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateVisualization);
      }
    };
    
    updateVisualization();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioContext]);

  // Simple canvas visualization
  const VisualizationCanvas = () => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw frequency bars
      const barWidth = width / analyserData.length;
      
      for (let i = 0; i < analyserData.length; i++) {
        const barHeight = (analyserData[i] / 255) * height * 0.8;
        const hue = (i / analyserData.length) * 360;
        
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(
          i * barWidth, 
          height - barHeight, 
          barWidth - 1, 
          barHeight
        );
      }
    }, [analyserData]);
    
    return (
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={200}
        className="border border-gray-600 rounded-lg bg-black"
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-900 to-black text-white rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        🎵 Interactive Web Audio Best Practices Demo
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Controls Panel */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-blue-300">Audio Controls</h3>
            
            {!isInitialized ? (
              <button
                onClick={initializeAudio}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                🎧 Initialize Audio System
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={isPlaying ? stopOscillator : startOscillator}
                    className={`flex-1 font-bold py-2 px-4 rounded-lg transition-all duration-200 ${
                      isPlaying 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isPlaying ? '⏹️ Stop' : '▶️ Play'}
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Volume: {Math.round(volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Frequency: {frequency} Hz
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="10"
                    value={frequency}
                    onChange={(e) => setFrequency(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Waveform Type
                  </label>
                  <select
                    value={waveform}
                    onChange={(e) => setWaveform(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="sine">Sine Wave</option>
                    <option value="square">Square Wave</option>
                    <option value="sawtooth">Sawtooth Wave</option>
                    <option value="triangle">Triangle Wave</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Best Practices Demonstrated</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                User gesture required for AudioContext initialization
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Proper cleanup of oscillators and event listeners
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Parameter updates using setValueAtTime()
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                requestAnimationFrame for smooth visualization
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                useRef for audio nodes (not useState)
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Proper audio graph connection patterns
              </li>
            </ul>
          </div>
        </div>
        
        {/* Visualization Panel */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Real-time Frequency Analysis</h3>
            <VisualizationCanvas />
            <p className="text-sm text-gray-400 mt-3">
              This visualization demonstrates proper canvas rendering with 60fps optimization using requestAnimationFrame.
            </p>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-yellow-300">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-700/50 p-3 rounded">
                <div className="text-gray-400">Audio Context State</div>
                <div className="font-mono text-green-400">
                  {audioContext?.state || 'Not initialized'}
                </div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded">
                <div className="text-gray-400">Sample Rate</div>
                <div className="font-mono text-blue-400">
                  {audioContext?.sampleRate || '0'} Hz
                </div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded">
                <div className="text-gray-400">Current Time</div>
                <div className="font-mono text-purple-400">
                  {audioContext?.currentTime?.toFixed(2) || '0.00'} s
                </div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded">
                <div className="text-gray-400">Nodes Active</div>
                <div className="font-mono text-orange-400">
                  {isPlaying ? '3' : '2'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>This demo showcases the essential patterns from our condensed Web Audio guide.</p>
        <p>Every technique shown here is production-ready and follows 2024-2025 best practices.</p>
      </div>
    </div>
  );
};

export default InteractiveWebAudioDemo;