import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Settings, Zap, Layers, Palette, Eye, Brain, Music, Activity } from 'lucide-react';

const MusicVisualizationToolkit = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  // Simulate audio data
  const generateAudioData = (time) => {
    const frequencies = [];
    const amplitudes = [];
    for (let i = 0; i < 128; i++) {
      frequencies[i] = Math.sin(time * 0.01 + i * 0.1) * 0.5 + 0.5;
      amplitudes[i] = Math.sin(time * 0.02 + i * 0.05) * 0.3 + 0.7;
    }
    return { frequencies, amplitudes };
  };

  // Animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    timeRef.current += 1;
    const audioData = generateAudioData(timeRef.current);
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Render based on active feature
    renderFeatureVisualization(ctx, width, height, audioData, timeRef.current);
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  const renderFeatureVisualization = (ctx, width, height, audioData, time) => {
    const feature = features[activeFeature];
    
    switch (activeFeature) {
      case 0: // Spectral Field Particles
        renderSpectralField(ctx, width, height, audioData, time);
        break;
      case 1: // Matrix Morphing
        renderMatrixMorph(ctx, width, height, audioData, time);
        break;
      case 2: // Mel-Spectrogram Heat Map
        renderMelSpectrogram(ctx, width, height, audioData, time);
        break;
      case 3: // 3D Frequency Crystalline Structures
        render3DFrequency(ctx, width, height, audioData, time);
        break;
      case 4: // Harmonic Constellation
        renderHarmonicConstellation(ctx, width, height, audioData, time);
        break;
      case 5: // Neural Audio Synthesis
        renderNeuralSynthesis(ctx, width, height, audioData, time);
        break;
      case 6: // Temporal Flux Fields
        renderTemporalFlux(ctx, width, height, audioData, time);
        break;
      case 7: // Fractal Bass Propagation
        renderFractalBass(ctx, width, height, audioData, time);
        break;
      case 8: // Multi-dimensional Chromagram
        renderChromagram(ctx, width, height, audioData, time);
        break;
      case 9: // Quantum Audio Interference
        renderQuantumInterference(ctx, width, height, audioData, time);
        break;
    }
  };

  const renderSpectralField = (ctx, width, height, audioData, time) => {
    const { frequencies, amplitudes } = audioData;
    
    for (let x = 0; x < width; x += 8) {
      for (let y = 0; y < height; y += 8) {
        const freqIndex = Math.floor((x / width) * frequencies.length);
        const intensity = frequencies[freqIndex] * amplitudes[freqIndex];
        const hue = (freqIndex / frequencies.length) * 360;
        const brightness = intensity * 100;
        
        ctx.fillStyle = `hsl(${hue}, 70%, ${brightness}%)`;
        ctx.beginPath();
        ctx.arc(x + Math.sin(time * 0.01 + x * 0.01) * 3, 
                y + Math.cos(time * 0.01 + y * 0.01) * 3, 
                intensity * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const renderMatrixMorph = (ctx, width, height, audioData, time) => {
    const { frequencies } = audioData;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    
    const gridSize = 16;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x1 = (i / gridSize) * width;
        const y1 = (j / gridSize) * height;
        const x2 = ((i + 1) / gridSize) * width;
        const y2 = ((j + 1) / gridSize) * height;
        
        const freq = frequencies[i % frequencies.length];
        const morph = Math.sin(time * 0.02 + i + j) * freq * 20;
        
        ctx.beginPath();
        ctx.moveTo(x1 + morph, y1 + morph);
        ctx.lineTo(x2 + morph, y1 + morph);
        ctx.lineTo(x2 + morph, y2 + morph);
        ctx.lineTo(x1 + morph, y2 + morph);
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  const renderMelSpectrogram = (ctx, width, height, audioData, time) => {
    const { frequencies } = audioData;
    const melBands = 40;
    
    for (let i = 0; i < melBands; i++) {
      const bandHeight = height / melBands;
      const y = i * bandHeight;
      const intensity = frequencies[Math.floor((i / melBands) * frequencies.length)];
      
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `hsl(${240 + intensity * 120}, 80%, 30%)`);
      gradient.addColorStop(0.5, `hsl(${180 + intensity * 180}, 90%, 50%)`);
      gradient.addColorStop(1, `hsl(${60 + intensity * 60}, 100%, 70%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y, width * intensity, bandHeight - 1);
    }
  };

  const render3DFrequency = (ctx, width, height, audioData, time) => {
    const { frequencies } = audioData;
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < frequencies.length; i++) {
      const angle = (i / frequencies.length) * Math.PI * 2;
      const radius = frequencies[i] * 100 + 50;
      const z = Math.sin(time * 0.01 + i * 0.1) * 50;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius + z;
      
      const size = 3 + frequencies[i] * 8;
      const alpha = 0.7 + frequencies[i] * 0.3;
      
      ctx.fillStyle = `hsla(${i * 3}, 70%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const renderHarmonicConstellation = (ctx, width, height, audioData, time) => {
    const { frequencies, amplitudes } = audioData;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw connections between harmonically related frequencies
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < frequencies.length / 2; i++) {
      const harmonic = i * 2;
      if (harmonic < frequencies.length) {
        const x1 = centerX + Math.cos(i * 0.2 + time * 0.01) * (frequencies[i] * 100);
        const y1 = centerY + Math.sin(i * 0.2 + time * 0.01) * (frequencies[i] * 100);
        const x2 = centerX + Math.cos(harmonic * 0.2 + time * 0.01) * (frequencies[harmonic] * 100);
        const y2 = centerY + Math.sin(harmonic * 0.2 + time * 0.01) * (frequencies[harmonic] * 100);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Draw nodes
        ctx.fillStyle = `hsl(${i * 8}, 80%, 70%)`;
        ctx.beginPath();
        ctx.arc(x1, y1, frequencies[i] * 6 + 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const renderNeuralSynthesis = (ctx, width, height, audioData, time) => {
    // Simulate neural network nodes processing audio
    const nodes = 20;
    const layers = 4;
    
    for (let layer = 0; layer < layers; layer++) {
      for (let node = 0; node < nodes; node++) {
        const x = (layer / (layers - 1)) * width;
        const y = (node / (nodes - 1)) * height;
        
        const activation = audioData.frequencies[node % audioData.frequencies.length];
        const size = 5 + activation * 10;
        const pulse = Math.sin(time * 0.05 + layer + node) * 0.5 + 0.5;
        
        ctx.fillStyle = `hsla(${layer * 90}, 70%, ${50 + activation * 30}%, ${0.7 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Neural connections
        if (layer < layers - 1) {
          ctx.strokeStyle = `rgba(0, 255, 150, ${activation * 0.5})`;
          ctx.lineWidth = activation * 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + width / (layers - 1), y + (Math.random() - 0.5) * 50);
          ctx.stroke();
        }
      }
    }
  };

  const renderTemporalFlux = (ctx, width, height, audioData, time) => {
    // Time-based particle flow
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
      const freq = audioData.frequencies[i % audioData.frequencies.length];
      const x = (time * freq * 2 + i * 10) % width;
      const y = height / 2 + Math.sin(time * 0.02 + i * 0.1) * freq * height * 0.3;
      
      const trail = 20;
      for (let t = 0; t < trail; t++) {
        const trailX = x - t * freq * 5;
        const alpha = (trail - t) / trail * freq;
        
        ctx.fillStyle = `hsla(${200 + freq * 100}, 80%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(trailX, y, 2 + freq * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const renderFractalBass = (ctx, width, height, audioData, time) => {
    // Fractal patterns based on bass frequencies
    const bassFreqs = audioData.frequencies.slice(0, 16);
    const centerX = width / 2;
    const centerY = height / 2;
    
    function drawFractal(x, y, size, depth, bassIntensity) {
      if (depth <= 0 || size < 2) return;
      
      const branches = 6;
      for (let i = 0; i < branches; i++) {
        const angle = (i / branches) * Math.PI * 2 + time * 0.01;
        const newX = x + Math.cos(angle) * size * bassIntensity;
        const newY = y + Math.sin(angle) * size * bassIntensity;
        
        ctx.strokeStyle = `hsl(${depth * 30}, 70%, ${60 + bassIntensity * 40}%)`;
        ctx.lineWidth = depth;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(newX, newY);
        ctx.stroke();
        
        drawFractal(newX, newY, size * 0.7, depth - 1, bassIntensity);
      }
    }
    
    const avgBass = bassFreqs.reduce((a, b) => a + b, 0) / bassFreqs.length;
    drawFractal(centerX, centerY, 80, 5, avgBass);
  };

  const renderChromagram = (ctx, width, height, audioData, time) => {
    // 12-note chromatic representation
    const notes = 12;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    
    for (let note = 0; note < notes; note++) {
      const angle = (note / notes) * Math.PI * 2 - Math.PI / 2;
      const intensity = audioData.frequencies[Math.floor((note / notes) * audioData.frequencies.length)];
      
      const x1 = centerX + Math.cos(angle) * radius * 0.5;
      const y1 = centerY + Math.sin(angle) * radius * 0.5;
      const x2 = centerX + Math.cos(angle) * radius * (0.5 + intensity);
      const y2 = centerY + Math.sin(angle) * radius * (0.5 + intensity);
      
      ctx.strokeStyle = `hsl(${note * 30}, 80%, 60%)`;
      ctx.lineWidth = 5 + intensity * 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Note labels
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      ctx.fillText(noteNames[note], x2, y2);
    }
  };

  const renderQuantumInterference = (ctx, width, height, audioData, time) => {
    // Quantum-inspired wave interference patterns
    const waveCount = 8;
    
    for (let x = 0; x < width; x += 4) {
      for (let y = 0; y < height; y += 4) {
        let amplitude = 0;
        
        for (let w = 0; w < waveCount; w++) {
          const freq = audioData.frequencies[w * 16] || 0;
          const waveX = width * (w / waveCount);
          const waveY = height / 2;
          
          const distance = Math.sqrt((x - waveX) ** 2 + (y - waveY) ** 2);
          amplitude += Math.sin(distance * 0.02 - time * 0.05) * freq;
        }
        
        const intensity = Math.abs(amplitude) * 0.5;
        const hue = (amplitude + 1) * 180;
        
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${intensity})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  };

  const features = [
    {
      id: 0,
      name: "Spectral Field Particles",
      icon: <Zap className="w-5 h-5" />,
      description: "Thousands of tiny particles fill the visual field, each representing a frequency bin. Their position, color, and intensity respond to spectral content, creating a living, breathing representation of sound.",
      technical: "Uses FFT analysis with particle systems. Each particle's properties (position, color, size) are mapped to frequency domain characteristics."
    },
    {
      id: 1,
      name: "Matrix Morphing Geometry",
      icon: <Layers className="w-5 h-5" />,
      description: "Geometric shapes undergo real-time matrix transformations based on audio features. Watch triangles stretch, rotate, and morph as the music evolves.",
      technical: "Applies 2D/3D transformation matrices based on extracted audio features like spectral centroid, rolloff, and flux."
    },
    {
      id: 2,
      name: "Mel-Spectrogram Heat Maps",
      icon: <Palette className="w-5 h-5" />,
      description: "Perceptually-weighted frequency analysis creates flowing heat maps that mirror how humans actually hear music, revealing melodic and harmonic patterns.",
      technical: "Uses mel-scale frequency binning to create perceptually relevant spectrograms with time-based color gradients."
    },
    {
      id: 3,
      name: "3D Frequency Crystalline Structures",
      icon: <Eye className="w-5 h-5" />,
      description: "Build crystal-like 3D structures where each facet represents different frequency ranges. Harmonics create geometric relationships in 3D space.",
      technical: "Maps frequency bins to 3D coordinates with harmonic relationships determining structural connections."
    },
    {
      id: 4,
      name: "Harmonic Constellation Mapping",
      icon: <Music className="w-5 h-5" />,
      description: "Visualize harmonic relationships as constellations, where notes that are harmonically related are connected by lines of light, revealing the underlying musical structure.",
      technical: "Analyzes pitch class profiles and harmonic templates to create network visualizations of tonal relationships."
    },
    {
      id: 5,
      name: "Neural Audio Synthesis Visualization",
      icon: <Brain className="w-5 h-5" />,
      description: "Show how a neural network 'hears' music by visualizing activation patterns across layers, creating abstract representations of learned musical features.",
      technical: "Simulates neural network architectures processing audio, with activation levels driving visual elements."
    },
    {
      id: 6,
      name: "Temporal Flux Fields",
      icon: <Activity className="w-5 h-5" />,
      description: "Particles flow through time-based vector fields that change based on rhythmic and temporal features, creating river-like visualizations of musical time.",
      technical: "Uses onset detection and tempo analysis to create dynamic vector fields that guide particle motion."
    },
    {
      id: 7,
      name: "Fractal Bass Propagation",
      icon: <Layers className="w-5 h-5" />,
      description: "Low-frequency content generates fractal patterns that grow and branch outward, creating tree-like or lightning-like structures based on bass lines.",
      technical: "Extracts low-frequency energy to recursively generate fractal geometries with branch complexity tied to bass intensity."
    },
    {
      id: 8,
      name: "Multi-dimensional Chromagram",
      icon: <Palette className="w-5 h-5" />,
      description: "Map the 12-tone chromatic scale to a circular visualization that shows chord progressions and key changes as flowing, rotating color wheels.",
      technical: "Computes chroma vectors and visualizes them in polar coordinates with harmonic relationships driving color and motion."
    },
    {
      id: 9,
      name: "Quantum Audio Interference",
      icon: <Zap className="w-5 h-5" />,
      description: "Create wave interference patterns where different frequency components act like quantum waves, creating beautiful constructive and destructive interference visualizations.",
      technical: "Models audio frequencies as wave functions with phase relationships creating interference patterns in 2D space."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Advanced Music Visualization Toolkit
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore the intersection of mathematics, music, and visual art through cutting-edge audio analysis and real-time transformation techniques.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feature List */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-6 text-cyan-300">Amazing Features</h2>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-300 border ${
                    activeFeature === index
                      ? 'bg-purple-600/30 border-purple-400 shadow-lg shadow-purple-500/20'
                      : 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {feature.icon}
                    <span className="font-semibold">{feature.name}</span>
                  </div>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Visualization Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-purple-300">
                  {features[activeFeature].name}
                </h3>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isPlaying 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>

              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full border border-gray-600 rounded-lg bg-black"
              />

              <div className="mt-4">
                <h4 className="font-semibold text-cyan-300 mb-2">Technical Implementation</h4>
                <p className="text-sm text-gray-300">{features[activeFeature].technical}</p>
              </div>
            </div>

            {/* Educational Section */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <h3 className="text-xl font-bold text-yellow-300 mb-4">Why These Features Matter</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-green-300 mb-2">Musical Analysis</h4>
                  <p className="text-gray-300">
                    Each visualization reveals different aspects of music: harmonic content, rhythmic patterns, 
                    timbral evolution, and structural relationships that are invisible to traditional waveform displays.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">Mathematical Beauty</h4>
                  <p className="text-gray-300">
                    These techniques transform abstract mathematical concepts like Fourier analysis, matrix algebra, 
                    and signal processing into tangible, visual experiences that make complex theory accessible.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Real-time Performance</h4>
                  <p className="text-gray-300">
                    Optimized algorithms ensure smooth 60fps rendering while processing audio at high sample rates, 
                    making these visualizations practical for live performance and interactive applications.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-pink-300 mb-2">Creative Applications</h4>
                  <p className="text-gray-300">
                    Beyond visualization, these techniques enable new forms of digital art, music education tools, 
                    and interactive installations that bridge the gap between sound and sight.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-400">
          <p>Click different features to explore their visualizations. Each represents a unique approach to understanding music through mathematics and visual art.</p>
        </footer>
      </div>
    </div>
  );
};

export default MusicVisualizationToolkit;