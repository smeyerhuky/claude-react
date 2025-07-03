import { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, Square, Download, Settings, Camera, Video, 
  Upload, Maximize2, Minimize2,
  Music, Waves, Box, Grid3x3
} from 'lucide-react';

const AdvancedSpectrogramV2 = () => {
  // Core state
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Visualization state
  const [visualMode, setVisualMode] = useState('spectrogram3d');
  const [colorScheme, setColorScheme] = useState('cyberpunk');
  const [settings, setSettings] = useState({
    sensitivity: 1.5,
    fftSize: 2048,
    smoothing: 0.8,
    melBins: 128,
    minFreq: 20,
    maxFreq: 20000,
    blobTension: 0.5,
    particleCount: 1000,
    trailLength: 0.9,
    bloomStrength: 1.5,
    windowFunction: 'hann'
  });
  
  // Audio analysis state
  const [bassLevel, setBassLevel] = useState(0);
  const [midLevel, setMidLevel] = useState(0);
  const [highLevel, setHighLevel] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);
  const [bpm] = useState(0);
  
  // Recording state
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoChunks, setVideoChunks] = useState([]);
  
  // Refs
  const containerRef = useRef(null);
  const canvas2DRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const animationRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const blobMeshRef = useRef(null);
  const particlesRef = useRef(null);
  const melSpectrogramRef = useRef([]);
  const beatHistoryRef = useRef([]);
  const settingsRef = useRef(settings);
  const colorSchemeRef = useRef(colorScheme);
  const visualModeRef = useRef(visualMode);
  
  // Update refs when state changes
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  
  useEffect(() => {
    colorSchemeRef.current = colorScheme;
  }, [colorScheme]);
  
  useEffect(() => {
    visualModeRef.current = visualMode;
  }, [visualMode]);
  
  // Color schemes
  const colorSchemes = {
    cyberpunk: {
      bass: [255, 0, 128],
      mid: [0, 255, 255],
      high: [255, 255, 0],
      background: '#0a0a0a',
      accent: '#ff0080'
    },
    nature: {
      bass: [34, 139, 34],
      mid: [70, 130, 180],
      high: [255, 215, 0],
      background: '#0d1117',
      accent: '#228b22'
    },
    sunset: {
      bass: [255, 94, 77],
      mid: [255, 157, 77],
      high: [255, 206, 84],
      background: '#1a1a2e',
      accent: '#ff5e4d'
    },
    vaporwave: {
      bass: [255, 71, 233],
      mid: [131, 58, 180],
      high: [252, 176, 69],
      background: '#190134',
      accent: '#ff47e9'
    }
  };

  // Initialize mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize 3D scene
  const init3DScene = useCallback(() => {
    if (!containerRef.current || rendererRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 100);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create blob mesh
    const geometry = new THREE.IcosahedronGeometry(5, 4);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0080,
      emissive: 0xff0080,
      emissiveIntensity: 0.2,
      shininess: 100,
      wireframe: false
    });
    const blob = new THREE.Mesh(geometry, material);
    scene.add(blob);
    blobMeshRef.current = blob;

    // Create initial particle system
    createParticleSystem(settingsRef.current.particleCount);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Create/update particle system
  const createParticleSystem = useCallback((particleCount) => {
    if (!sceneRef.current) return;
    
    // Remove old particle system
    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current);
      particlesRef.current.geometry.dispose();
      particlesRef.current.material.dispose();
      particlesRef.current = null;
    }
    
    // Create new particle system
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 50;
      colors[i] = Math.random();
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    sceneRef.current.add(particleSystem);
    particlesRef.current = particleSystem;
  }, []);

  // Clean up 3D scene
  const cleanup3DScene = useCallback(() => {
    if (rendererRef.current) {
      if (rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    
    if (sceneRef.current) {
      // Dispose of all objects in the scene
      sceneRef.current.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      sceneRef.current = null;
    }
    
    blobMeshRef.current = null;
    particlesRef.current = null;
    cameraRef.current = null;
  }, []);

  // Initialize audio
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        } 
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = settings.fftSize;
      analyserRef.current.smoothingTimeConstant = settings.smoothing;
      
      source.connect(analyserRef.current);
      
      // Initialize MediaRecorder
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

  // Mel-scale conversion
  const freqToMel = (freq) => 2595 * Math.log10(1 + freq / 700);
  const melToFreq = (mel) => 700 * (Math.pow(10, mel / 2595) - 1);

  // Calculate mel-spectrogram
  const calculateMelSpectrogram = useCallback((frequencyData) => {
    const { melBins, minFreq, maxFreq } = settingsRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const nyquist = sampleRate / 2;
    const fftBins = frequencyData.length;
    
    const minMel = freqToMel(minFreq);
    const maxMel = freqToMel(maxFreq);
    const melScale = new Float32Array(melBins);
    
    for (let i = 0; i < melBins; i++) {
      const mel = minMel + (maxMel - minMel) * i / (melBins - 1);
      const freq = melToFreq(mel);
      const bin = Math.floor(freq / nyquist * fftBins);
      
      let sum = 0;
      const width = Math.max(1, Math.floor(fftBins / melBins));
      for (let j = 0; j < width && bin + j < fftBins; j++) {
        sum += frequencyData[bin + j];
      }
      melScale[i] = sum / width;
    }
    
    return melScale;
  }, []);

  // Beat detection
  const detectBeat = (bassEnergy) => {
    beatHistoryRef.current.push(bassEnergy);
    if (beatHistoryRef.current.length > 43) { // ~1 second at 60fps
      beatHistoryRef.current.shift();
    }
    
    if (beatHistoryRef.current.length < 10) return false;
    
    const average = beatHistoryRef.current.reduce((a, b) => a + b) / beatHistoryRef.current.length;
    const variance = beatHistoryRef.current.reduce((a, b) => a + Math.pow(b - average, 2), 0) / beatHistoryRef.current.length;
    const threshold = average + Math.sqrt(variance) * 1.5;
    
    return bassEnergy > threshold && bassEnergy > average * 1.3;
  };

  // Update blob deformation
  const updateBlobGeometry = useCallback((audioData) => {
    if (!blobMeshRef.current) return;
    
    const geometry = blobMeshRef.current.geometry;
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      vertex.normalize();
      
      const frequency = Math.floor((i / positions.count) * audioData.length);
      const amplitude = audioData[frequency] / 255 * settingsRef.current.sensitivity;
      const scale = 5 + amplitude * settingsRef.current.blobTension * 3;
      
      vertex.multiplyScalar(scale);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }, []);

  // Main animation loop
  const animate = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate frequency bands
    const bassRange = Math.floor(bufferLength * 0.05);
    const midRange = Math.floor(bufferLength * 0.4);
    
    let bassSum = 0, midSum = 0, highSum = 0;
    for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
    for (let i = bassRange; i < midRange; i++) midSum += dataArray[i];
    for (let i = midRange; i < bufferLength; i++) highSum += dataArray[i];
    
    const bassAvg = (bassSum / bassRange / 255) * settingsRef.current.sensitivity;
    const midAvg = (midSum / (midRange - bassRange) / 255) * settingsRef.current.sensitivity;
    const highAvg = (highSum / (bufferLength - midRange) / 255) * settingsRef.current.sensitivity;
    
    setBassLevel(bassAvg);
    setMidLevel(midAvg);
    setHighLevel(highAvg);
    
    // Beat detection
    const beat = detectBeat(bassAvg);
    setBeatDetected(beat);
    
    // Update mel-spectrogram
    const melData = calculateMelSpectrogram(dataArray);
    melSpectrogramRef.current.push(melData);
    if (melSpectrogramRef.current.length > 100) {
      melSpectrogramRef.current.shift();
    }
    
    // Update visualizations based on current mode
    if (visualModeRef.current === 'spectrogram3d' && sceneRef.current) {
      updateBlobGeometry(dataArray);
      
      // Rotate blob
      if (blobMeshRef.current) {
        blobMeshRef.current.rotation.x += 0.01;
        blobMeshRef.current.rotation.y += 0.005;
        
        // Color based on frequency and color scheme
        const colors = colorSchemes[colorSchemeRef.current];
        const color = new THREE.Color();
        const intensity = (bassAvg + midAvg + highAvg) / 3;
        color.setRGB(
          (colors.bass[0] * bassAvg + colors.mid[0] * midAvg + colors.high[0] * highAvg) / 3 / 255,
          (colors.bass[1] * bassAvg + colors.mid[1] * midAvg + colors.high[1] * highAvg) / 3 / 255,
          (colors.bass[2] * bassAvg + colors.mid[2] * midAvg + colors.high[2] * highAvg) / 3 / 255
        );
        blobMeshRef.current.material.color = color;
        blobMeshRef.current.material.emissive = color;
        blobMeshRef.current.material.emissiveIntensity = 0.2 + intensity * 0.3;
      }
      
      // Update particles
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position;
        const colors = particlesRef.current.geometry.attributes.color;
        
        for (let i = 0; i < positions.count; i++) {
          const i3 = i * 3;
          positions.array[i3 + 1] += (Math.random() - 0.5) * bassAvg;
          
          colors.array[i3] = bassAvg;
          colors.array[i3 + 1] = midAvg;
          colors.array[i3 + 2] = highAvg;
        }
        
        positions.needsUpdate = true;
        colors.needsUpdate = true;
        particlesRef.current.rotation.y += 0.001;
      }
      
      rendererRef.current?.render(sceneRef.current, cameraRef.current);
    } else if (canvas2DRef.current) {
      draw2DVisualization(dataArray);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [calculateMelSpectrogram, updateBlobGeometry]);

  // 2D visualization
  const draw2DVisualization = useCallback((frequencyData) => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear with trail effect
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - settingsRef.current.trailLength})`;
    ctx.fillRect(0, 0, width, height);
    
    const colors = colorSchemes[colorSchemeRef.current];
    const currentMode = visualModeRef.current;
    const currentSettings = settingsRef.current;
    
    if (currentMode === 'melSpectrogram') {
      // Draw mel-spectrogram heatmap
      const spectrogramWidth = width / melSpectrogramRef.current.length;
      const binHeight = height / currentSettings.melBins;
      
      melSpectrogramRef.current.forEach((column, x) => {
        column.forEach((value, y) => {
          const intensity = value / 255;
          const hue = 240 - intensity * 240; // Blue to red
          ctx.fillStyle = `hsl(${hue}, 100%, ${intensity * 50}%)`;
          ctx.fillRect(
            x * spectrogramWidth,
            height - (y + 1) * binHeight,
            spectrogramWidth,
            binHeight
          );
        });
      });
    } else if (currentMode === 'waveform') {
      // Draw waveform
      ctx.strokeStyle = `rgb(${colors.mid.join(',')})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = width / frequencyData.length;
      let x = 0;
      
      for (let i = 0; i < frequencyData.length; i++) {
        const v = frequencyData[i] / 255 * currentSettings.sensitivity;
        const y = height - (v * height);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      
      ctx.stroke();
    } else {
      // Standard spectrogram
      const barWidth = width / frequencyData.length * 2;
      
      for (let i = 0; i < frequencyData.length; i++) {
        const barHeight = (frequencyData[i] / 255) * height * currentSettings.sensitivity;
        const x = i * barWidth;
        
        // Gradient based on frequency
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, `rgb(${colors.high.join(',')})`);
        gradient.addColorStop(0.5, `rgb(${colors.mid.join(',')})`);
        gradient.addColorStop(1, `rgb(${colors.bass.join(',')})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      }
    }
    
    // Draw beat indicator
    if (beatDetected) {
      ctx.fillStyle = `rgba(${colors.bass.join(',')}, 0.3)`;
      ctx.fillRect(0, 0, width, height);
    }
  }, [beatDetected]);

  // Handle visualization mode change
  useEffect(() => {
    if (!isRecording) return;
    
    if (visualMode === 'spectrogram3d') {
      init3DScene();
    } else {
      cleanup3DScene();
    }
  }, [visualMode, isRecording, init3DScene, cleanup3DScene]);

  // Update particle count when setting changes
  useEffect(() => {
    if (isRecording && visualMode === 'spectrogram3d' && sceneRef.current) {
      createParticleSystem(settings.particleCount);
    }
  }, [settings.particleCount, isRecording, visualMode, createParticleSystem]);

  // Update analyser settings when they change
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = settings.fftSize;
      analyserRef.current.smoothingTimeConstant = settings.smoothing;
    }
  }, [settings.fftSize, settings.smoothing]);

  // Update canvas size for 2D visualizations
  useEffect(() => {
    if (!canvas2DRef.current) return;
    
    const updateCanvasSize = () => {
      const canvas = canvas2DRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Start/stop recording
  const startRecording = async () => {
    if (!isAnalyzing) {
      const success = await initializeAudio();
      if (!success) return;
    }
    
    setRecordedChunks([]);
    mediaRecorderRef.current?.start();
    setIsRecording(true);
    
    if (visualMode === 'spectrogram3d') {
      init3DScene();
    }
    
    animate();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Video recording
  const startVideoRecording = () => {
    const canvas = visualMode === 'spectrogram3d' 
      ? rendererRef.current?.domElement 
      : canvas2DRef.current;
      
    if (!canvas) return;
    
    const stream = canvas.captureStream(30);
    videoRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: 2500000
    });
    
    videoRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setVideoChunks(prev => [...prev, event.data]);
      }
    };
    
    videoRecorderRef.current.start();
    setIsVideoRecording(true);
  };

  const stopVideoRecording = () => {
    videoRecorderRef.current?.stop();
    setIsVideoRecording(false);
  };

  // Export functions
  const exportSettings = () => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spectrogram-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setSettings({ ...settings, ...imported });
      } catch (err) {
        alert('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const takeSnapshot = () => {
    const canvas = visualMode === 'spectrogram3d' 
      ? rendererRef.current?.domElement 
      : canvas2DRef.current;
      
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spectrogram-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const downloadRecording = (type = 'audio') => {
    const chunks = type === 'audio' ? recordedChunks : videoChunks;
    if (chunks.length === 0) return;
    
    const mimeType = type === 'audio' ? 'audio/webm' : 'video/webm';
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spectrogram-${type}-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      animationRef.current && cancelAnimationFrame(animationRef.current);
      cleanup3DScene();
    };
  }, [cleanup3DScene]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" ref={containerRef}>
      {/* Main visualization container */}
      <div className="absolute inset-0">
        <canvas
          ref={canvas2DRef}
          className={`absolute inset-0 w-full h-full ${visualMode !== 'spectrogram3d' ? 'block' : 'hidden'}`}
          style={{ backgroundColor: colorSchemes[colorScheme].background }}
        />
      </div>

      {/* Header with minimal UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-white text-xl font-bold mb-1">Advanced Spectrogram</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>BPM: {bpm || '--'}</span>
            <span>Mode: {visualMode}</span>
            {beatDetected && <span className="text-red-500 animate-pulse">BEAT</span>}
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Slide-out settings panel */}
      <div
        className={`absolute top-0 right-0 h-full bg-gray-900/95 backdrop-blur-md transition-transform duration-300 overflow-y-auto z-50 ${
          showSettings ? 'translate-x-0' : 'translate-x-full'
        } ${isMobile ? 'w-full' : 'w-96'}`}
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Visualization Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visualization Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'spectrogram3d', icon: Box, label: '3D Blob' },
                { id: 'spectrogram', icon: Grid3x3, label: 'Spectrogram' },
                { id: 'melSpectrogram', icon: Waves, label: 'Mel-Spectrogram' },
                { id: 'waveform', icon: Music, label: 'Waveform' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setVisualMode(id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                    visualMode === id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color Scheme
            </label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2"
            >
              {Object.keys(colorSchemes).map(scheme => (
                <option key={scheme} value={scheme}>
                  {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Audio Analysis</h3>
            
            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Sensitivity</span>
                <span>{settings.sensitivity.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={settings.sensitivity}
                onChange={(e) => setSettings({ ...settings, sensitivity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-1">
                <span>FFT Size</span>
                <span>{settings.fftSize}</span>
              </label>
              <select
                value={settings.fftSize}
                onChange={(e) => setSettings({ ...settings, fftSize: parseInt(e.target.value) })}
                className="w-full bg-gray-800 text-white rounded px-2 py-1"
              >
                {[512, 1024, 2048, 4096, 8192].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Smoothing</span>
                <span>{settings.smoothing.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.99"
                step="0.01"
                value={settings.smoothing}
                onChange={(e) => setSettings({ ...settings, smoothing: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {visualMode === 'melSpectrogram' && (
              <>
                <div>
                  <label className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Mel Bins</span>
                    <span>{settings.melBins}</span>
                  </label>
                  <input
                    type="range"
                    min="32"
                    max="256"
                    step="32"
                    value={settings.melBins}
                    onChange={(e) => setSettings({ ...settings, melBins: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-300">Min Freq (Hz)</label>
                    <input
                      type="number"
                      value={settings.minFreq}
                      onChange={(e) => setSettings({ ...settings, minFreq: parseInt(e.target.value) })}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Max Freq (Hz)</label>
                    <input
                      type="number"
                      value={settings.maxFreq}
                      onChange={(e) => setSettings({ ...settings, maxFreq: parseInt(e.target.value) })}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1 mt-1"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Trail Effect</span>
                <span>{settings.trailLength.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.99"
                step="0.01"
                value={settings.trailLength}
                onChange={(e) => setSettings({ ...settings, trailLength: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Visual Effects */}
          {visualMode === 'spectrogram3d' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">3D Effects</h3>
              
              <div>
                <label className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Blob Tension</span>
                  <span>{settings.blobTension.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.blobTension}
                  onChange={(e) => setSettings({ ...settings, blobTension: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Particle Count</span>
                  <span>{settings.particleCount}</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={settings.particleCount}
                  onChange={(e) => setSettings({ ...settings, particleCount: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Export/Import */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white mb-2">Settings Management</h3>
            <button
              onClick={exportSettings}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-4 py-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Settings
            </button>
            <label className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-4 py-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Settings
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Frequency level indicators */}
      <div className="absolute bottom-24 left-4 right-4 flex gap-2 pointer-events-none">
        <div className="flex-1 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">BASS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-pink-600 transition-all duration-100"
              style={{ width: `${Math.min(100, bassLevel * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">MIDS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 transition-all duration-100"
              style={{ width: `${Math.min(100, midLevel * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">HIGHS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-orange-600 transition-all duration-100"
              style={{ width: `${Math.min(100, highLevel * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span className={isMobile ? 'hidden' : ''}>Start</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors"
              >
                <Square className="w-5 h-5" />
                <span className={isMobile ? 'hidden' : ''}>Stop</span>
              </button>
            )}

            {isRecording && (
              <button
                onClick={isVideoRecording ? stopVideoRecording : startVideoRecording}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                  isVideoRecording 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
              >
                <Video className="w-5 h-5" />
                <span className={isMobile ? 'hidden' : ''}>{isVideoRecording ? 'Stop' : 'Record'} Video</span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={takeSnapshot}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Take snapshot"
            >
              <Camera className="w-5 h-5" />
            </button>

            {recordedChunks.length > 0 && (
              <button
                onClick={() => downloadRecording('audio')}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Download audio"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            {videoChunks.length > 0 && (
              <button
                onClick={() => downloadRecording('video')}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                title="Download video"
              >
                <Video className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions overlay */}
      {!isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">
              Advanced Audio Visualizer
            </h2>
            <p className="text-gray-300 mb-6">
              Experience your music in multiple dimensions with real-time analysis,
              3D visualization, and professional audio processing.
            </p>
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg px-6 py-3 font-semibold transition-all transform hover:scale-105"
            >
              Begin Visualization
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSpectrogramV2;