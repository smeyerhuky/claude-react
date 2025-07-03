import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Settings } from 'lucide-react';

const ConcertSpectrogram = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState(new Array(256).fill(0));
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [highIntensity, setHighIntensity] = useState(0);
  const [particles, setParticles] = useState([]);
  const [visualMode, setVisualMode] = useState('spectrogram');
  const [sensitivity, setSensitivity] = useState(1.0);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const microphoneRef = useRef(null);
  const dataArrayRef = useRef(null);
  const streamRef = useRef(null);
  const spectrogramHistoryRef = useRef([]);

  // Initialize particles
  useEffect(() => {
    const initialParticles = Array(50).fill(null).map((_, i) => ({
      id: i,
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      alpha: Math.random() * 0.8 + 0.2
    }));
    setParticles(initialParticles);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyzerRef.current.fftSize = 512;
      analyzerRef.current.smoothingTimeConstant = 0.3;
      dataArrayRef.current = new Uint8Array(analyzerRef.current.frequencyBinCount);
      
      microphoneRef.current.connect(analyzerRef.current);
      
      setIsRecording(true);
      setIsPlaying(true);
      animate();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsRecording(false);
    setIsPlaying(false);
  };

  const animate = () => {
    if (!analyzerRef.current || !dataArrayRef.current) return;

    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate frequency band intensities
    const bassRange = dataArrayRef.current.slice(0, 32);
    const midRange = dataArrayRef.current.slice(32, 128);
    const highRange = dataArrayRef.current.slice(128, 256);
    
    const bassAvg = bassRange.reduce((a, b) => a + b) / bassRange.length;
    const midAvg = midRange.reduce((a, b) => a + b) / midRange.length;
    const highAvg = highRange.reduce((a, b) => a + b) / highRange.length;
    
    setBassIntensity(bassAvg * sensitivity);
    setMidIntensity(midAvg * sensitivity);
    setHighIntensity(highAvg * sensitivity);
    
    // Update audio data for visualization
    setAudioData([...dataArrayRef.current]);
    
    // Update spectrogram history
    spectrogramHistoryRef.current.push([...dataArrayRef.current]);
    if (spectrogramHistoryRef.current.length > 100) {
      spectrogramHistoryRef.current.shift();
    }
    
    // Update particles based on audio
    setParticles(prev => prev.map(particle => {
      const intensity = (bassAvg + midAvg + highAvg) / 3;
      const force = intensity * 0.1;
      
      return {
        ...particle,
        x: particle.x + particle.vx + (Math.random() - 0.5) * force,
        y: particle.y + particle.vy + (Math.random() - 0.5) * force,
        vx: particle.vx * 0.99 + (Math.random() - 0.5) * 0.1,
        vy: particle.vy * 0.99 + (Math.random() - 0.5) * 0.1,
        size: particle.size + Math.sin(Date.now() * 0.01 + particle.id) * 0.5,
        alpha: Math.min(1, particle.alpha + intensity * 0.01)
      };
    }));
    
    drawVisualization();
    animationRef.current = requestAnimationFrame(animate);
  };

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with trailing effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    if (visualMode === 'spectrogram') {
      // Draw spectrogram
      const barWidth = width / audioData.length;
      
      audioData.forEach((value, index) => {
        const barHeight = (value / 255) * height * 0.8;
        const hue = (index / audioData.length) * 360;
        const saturation = Math.min(100, value / 255 * 100 + 50);
        const lightness = Math.min(70, value / 255 * 50 + 20);
        
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(index * barWidth, height - barHeight, barWidth - 1, barHeight);
        
        // Add glow effect for high values
        if (value > 150) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.fillRect(index * barWidth, height - barHeight, barWidth - 1, barHeight);
          ctx.shadowBlur = 0;
        }
      });
      
      // Draw frequency band indicators
      ctx.fillStyle = `rgba(255, 0, 100, ${bassIntensity / 255})`;
      ctx.fillRect(0, height - 10, width * 0.25, 10);
      
      ctx.fillStyle = `rgba(0, 255, 100, ${midIntensity / 255})`;
      ctx.fillRect(width * 0.25, height - 10, width * 0.5, 10);
      
      ctx.fillStyle = `rgba(100, 100, 255, ${highIntensity / 255})`;
      ctx.fillRect(width * 0.75, height - 10, width * 0.25, 10);
    } else {
      // Draw particle system
      particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
    
    // Draw bass pulse effect
    if (bassIntensity > 100) {
      ctx.save();
      ctx.globalAlpha = (bassIntensity - 100) / 255;
      ctx.fillStyle = 'rgba(255, 0, 150, 0.3)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 800;
      canvas.height = 600;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const toggleVisualMode = () => {
    setVisualMode(prev => prev === 'spectrogram' ? 'particles' : 'spectrogram');
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DeadRocks Visualizer
            </h1>
            <p className="text-sm text-gray-400">Red Rocks • July 3, 2025</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleVisualMode}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
            >
              {visualMode === 'spectrogram' ? 'Particles' : 'Spectrogram'}
            </button>
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Visualization Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(1.2) contrast(1.1)' }}
      />

      {/* Frequency Band Indicators */}
      <div className="absolute bottom-20 left-4 right-4 flex space-x-2">
        <div className="flex-1 bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">BASS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-100"
              style={{ width: `${Math.min(100, (bassIntensity / 255) * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">MIDS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-100"
              style={{ width: `${Math.min(100, (midIntensity / 255) * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">HIGHS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
              style={{ width: `${Math.min(100, (highIntensity / 255) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full transition-all ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-400">{sensitivity.toFixed(1)}x</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">
              {isRecording ? 'LIVE' : 'READY'}
            </span>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="text-center p-8 bg-gray-900 bg-opacity-80 rounded-lg border border-purple-500">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome to DeadRocks
            </h2>
            <p className="text-gray-300 mb-6">
              Transform the sonic landscape into a visual symphony.<br />
              Tap the microphone to begin your journey.
            </p>
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Start Visualizing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConcertSpectrogram;