import { useState, useRef, useEffect } from 'react';
import { Play, Square, Download, Settings, Volume2 } from 'lucide-react';

const EDMSpectrogram = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [bassLevel, setBassLevel] = useState(0);
  const [midLevel, setMidLevel] = useState(0);
  const [highLevel, setHighLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.5);
  const [colorMode, setColorMode] = useState('edm');
  const [recordedChunks, setRecordedChunks] = useState([]);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  // Color schemes for different EDM vibes
  const colorSchemes = {
    edm: {
      bass: [138, 43, 226], // Deep purple
      mid: [0, 191, 255],   // Electric blue  
      high: [255, 215, 0],  // Gold
      particle: [255, 20, 147] // Hot pink
    },
    dubstep: {
      bass: [255, 0, 0],    // Red
      mid: [0, 255, 0],     // Green
      high: [255, 255, 255], // White
      particle: [255, 165, 0] // Orange
    },
    trance: {
      bass: [75, 0, 130],   // Indigo
      mid: [148, 0, 211],   // Dark violet
      high: [255, 192, 203], // Pink
      particle: [0, 255, 255] // Cyan
    }
  };

  // Particle system for bass drops
  class Particle {
    constructor(x, y, color, energy) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * energy * 4;
      this.vy = (Math.random() - 0.5) * energy * 4;
      this.color = color;
      this.life = 1.0;
      this.decay = 0.02 + Math.random() * 0.03;
      this.size = 2 + energy * 8;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.vx *= 0.99;
      this.vy *= 0.99;
    }

    draw(ctx) {
      if (this.life <= 0) return false;
      
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      return true;
    }
  }

  const initializeAudio = async () => {
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
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      source.connect(analyserRef.current);
      
      // Initialize MediaRecorder for saving audio
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      setIsAnalyzing(true);
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access microphone. Please check permissions.');
      return false;
    }
  };

  const startRecording = async () => {
    if (!isAnalyzing) {
      const success = await initializeAudio();
      if (!success) return;
    }
    
    setRecordedChunks([]);
    mediaRecorderRef.current.start();
    setIsRecording(true);
    startVisualization();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeds-dead-redrocks-${new Date().toISOString().slice(0, 19)}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const interpolateColor = (color1, color2, factor) => {
    return [
      Math.round(color1[0] + (color2[0] - color1[0]) * factor),
      Math.round(color1[1] + (color2[1] - color1[1]) * factor),
      Math.round(color1[2] + (color2[2] - color1[2]) * factor)
    ];
  };

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate frequency band levels
      const bassRange = Math.floor(bufferLength * 0.05); // 0-5% (roughly 0-1kHz)
      const midRange = Math.floor(bufferLength * 0.3);   // 5-30% (roughly 1-6kHz)
      const highRange = bufferLength;                     // 30-100% (6kHz+)
      
      let bassSum = 0, midSum = 0, highSum = 0;
      
      for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
      for (let i = bassRange; i < midRange; i++) midSum += dataArray[i];
      for (let i = midRange; i < highRange; i++) highSum += dataArray[i];
      
      const bassAvg = (bassSum / bassRange) / 255 * sensitivity;
      const midAvg = (midSum / (midRange - bassRange)) / 255 * sensitivity;
      const highAvg = (highSum / (highRange - midRange)) / 255 * sensitivity;
      
      setBassLevel(bassAvg);
      setMidLevel(midAvg);
      setHighLevel(highAvg);
      setVolume((bassAvg + midAvg + highAvg) / 3);

      // Create particles on bass drops
      if (bassAvg > 0.7) {
        const colors = colorSchemes[colorMode];
        for (let i = 0; i < Math.floor(bassAvg * 10); i++) {
          particlesRef.current.push(new Particle(
            Math.random() * rect.width,
            Math.random() * rect.height,
            colors.particle,
            bassAvg
          ));
        }
      }

      // Clear canvas with slight trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw spectrogram
      const barWidth = rect.width / bufferLength * 4;
      const colors = colorSchemes[colorMode];
      
      for (let i = 0; i < bufferLength / 4; i++) {
        const barHeight = (dataArray[i] / 255) * rect.height * sensitivity;
        const x = i * barWidth;
        
        // Determine color based on frequency range
        let color;
        if (i < bassRange / 4) {
          color = colors.bass;
        } else if (i < midRange / 4) {
          const factor = (i - bassRange / 4) / ((midRange - bassRange) / 4);
          color = interpolateColor(colors.bass, colors.mid, factor);
        } else {
          const factor = (i - midRange / 4) / ((highRange - midRange) / 4);
          color = interpolateColor(colors.mid, colors.high, factor);
        }
        
        // Add intensity-based brightness
        const intensity = dataArray[i] / 255;
        const brightenedColor = color.map(c => Math.min(255, c + intensity * 100));
        
        ctx.fillStyle = `rgb(${brightenedColor[0]}, ${brightenedColor[1]}, ${brightenedColor[2]})`;
        ctx.fillRect(x, rect.height - barHeight, barWidth - 1, barHeight);
        
        // Add glow effect for high intensity
        if (intensity > 0.8) {
          ctx.shadowColor = `rgb(${brightenedColor[0]}, ${brightenedColor[1]}, ${brightenedColor[2]})`;
          ctx.shadowBlur = 20;
          ctx.fillRect(x, rect.height - barHeight, barWidth - 1, barHeight);
          ctx.shadowBlur = 0;
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.update();
        return particle.draw(ctx);
      });

      // Draw frequency band indicators
      const indicatorHeight = 8;
      const indicatorY = 10;
      
      // Bass indicator
      ctx.fillStyle = `rgba(${colors.bass[0]}, ${colors.bass[1]}, ${colors.bass[2]}, 0.8)`;
      ctx.fillRect(10, indicatorY, rect.width * 0.25 * bassAvg, indicatorHeight);
      
      // Mid indicator  
      ctx.fillStyle = `rgba(${colors.mid[0]}, ${colors.mid[1]}, ${colors.mid[2]}, 0.8)`;
      ctx.fillRect(10, indicatorY + 15, rect.width * 0.25 * midAvg, indicatorHeight);
      
      // High indicator
      ctx.fillStyle = `rgba(${colors.high[0]}, ${colors.high[1]}, ${colors.high[2]}, 0.8)`;
      ctx.fillRect(10, indicatorY + 30, rect.width * 0.25 * highAvg, indicatorHeight);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsAnalyzing(false);
    setIsRecording(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900 to-blue-900 relative z-10">
        <div>
          <h1 className="text-xl font-bold">🎵 Red Rocks Visualizer</h1>
          <p className="text-sm opacity-75">Zeds Dead • July 3, 2025</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 bg-gray-900 rounded-lg p-4 z-20 min-w-[200px]">
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Color Scheme</label>
              <select 
                value={colorMode} 
                onChange={(e) => setColorMode(e.target.value)}
                className="w-full bg-gray-800 rounded px-2 py-1"
              >
                <option value="edm">EDM Classic</option>
                <option value="dubstep">Dubstep</option>
                <option value="trance">Trance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Sensitivity: {sensitivity.toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Visualizer */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)' }}
        />
        
        {/* Level Indicators Overlay */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Volume2 size={16} />
            <span>Volume: {(volume * 100).toFixed(0)}%</span>
          </div>
          <div className="text-xs space-y-1">
            <div style={{ color: `rgb(${colorSchemes[colorMode].bass.join(',')})` }}>
              Bass: {(bassLevel * 100).toFixed(0)}%
            </div>
            <div style={{ color: `rgb(${colorSchemes[colorMode].mid.join(',')})` }}>
              Mids: {(midLevel * 100).toFixed(0)}%
            </div>
            <div style={{ color: `rgb(${colorSchemes[colorMode].high.join(',')})` }}>
              Highs: {(highLevel * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 bg-black/50 rounded-lg backdrop-blur">
              <h2 className="text-2xl mb-4">Ready to Visualize the Bass?</h2>
              <p className="mb-4 opacity-75">
                Turn up your phone volume and point the mic toward the speakers!
              </p>
              <button
                onClick={startRecording}
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Start Visualizing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 flex justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center space-x-2 bg-green-600 px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
          >
            <Play size={20} />
            <span>Record & Visualize</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 bg-red-600 px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
          >
            <Square size={20} />
            <span>Stop Recording</span>
          </button>
        )}
        
        {recordedChunks.length > 0 && (
          <button
            onClick={downloadRecording}
            className="flex items-center space-x-2 bg-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            <span>Save Audio</span>
          </button>
        )}
      </div>

      {/* Bass Drop Alert */}
      {bassLevel > 0.8 && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 border-4 animate-pulse"
            style={{ 
              borderColor: `rgb(${colorSchemes[colorMode].particle.join(',')})`,
              backgroundColor: `rgba(${colorSchemes[colorMode].particle.join(',')}, 0.1)`
            }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold animate-bounce">
            🔊 BASS DROP! 🔊
          </div>
        </div>
      )}
    </div>
  );
};

export default EDMSpectrogram;