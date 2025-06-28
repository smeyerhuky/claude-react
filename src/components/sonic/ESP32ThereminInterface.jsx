import React, { useState, useEffect, useRef, useCallback } from 'react';

const ESP32ThereminInterface = () => {
  // State management
  const [frequencies, setFrequencies] = useState(new Array(32).fill(0));
  const [beats, setBeats] = useState([false, false, false, false]);
  const [currentEffect, setCurrentEffect] = useState('spectrum');
  const [gesturePosition, setGesturePosition] = useState({ x: 0.5, y: 0.5 });
  const [intensity, setIntensity] = useState(0.8);
  const [colorTemp, setColorTemp] = useState(0.5);
  const [latency, setLatency] = useState(8);
  const [beatHistory, setBeatHistory] = useState(new Array(43).fill(0));
  const [lastBeatTime, setLastBeatTime] = useState(0);
  
  // Refs for animation frames
  const animationRef = useRef();
  const audioSimulationRef = useRef();
  
  // LED zone configurations
  const ledZones = {
    'zone-a': { count: 60, title: 'Main Stage (Zone A)' },
    'zone-b': { count: 40, title: 'Side Panels (Zone B)' },
    'zone-c': { count: 80, title: 'Floor Wash (Zone C)' },
    'zone-e': { count: 48, title: 'Ceiling Grid (Zone E)' }
  };

  // Device nodes
  const deviceNodes = [
    { id: 1, name: 'Master', ip: '192.168.1.100', active: true },
    { id: 2, name: 'Zone A', ip: '192.168.1.101', active: true },
    { id: 3, name: 'Zone B', ip: '192.168.1.102', active: true },
    { id: 4, name: 'Zone C', ip: '192.168.1.103', active: true },
    { id: 5, name: 'Zone D', ip: 'Offline', active: false },
    { id: 6, name: 'Zone E', ip: '192.168.1.105', active: true }
  ];

  // Beat detection logic
  const updateBeatDetection = useCallback((freqs) => {
    const bassEnergy = freqs.slice(0, 4).reduce((a, b) => a + b) / 4;
    const midEnergy = freqs.slice(4, 16).reduce((a, b) => a + b) / 12;
    const highEnergy = freqs.slice(16, 32).reduce((a, b) => a + b) / 16;
    const totalEnergy = (bassEnergy + midEnergy + highEnergy) / 3;
    
    const newHistory = [...beatHistory.slice(1), totalEnergy];
    setBeatHistory(newHistory);
    
    const avgEnergy = newHistory.reduce((a, b) => a + b) / newHistory.length;
    const variance = newHistory.reduce((sum, val) => sum + Math.pow(val - avgEnergy, 2), 0) / newHistory.length;
    const threshold = avgEnergy * (1.5 - 0.15 * variance);
    
    const now = Date.now();
    const isBeat = totalEnergy > threshold && now - lastBeatTime > 200;
    
    if (isBeat) {
      setLastBeatTime(now);
      setBeats([true, false, false, false]);
      setTimeout(() => setBeats([true, true, false, false]), 150);
      setTimeout(() => setBeats([true, true, true, false]), 300);
      setTimeout(() => setBeats([true, true, true, true]), 450);
    } else {
      setBeats(beats.map(beat => beat && Math.random() > 0.3));
    }
  }, [beatHistory, lastBeatTime]);

  // Audio simulation
  const simulateAudio = useCallback(() => {
    const time = Date.now() * 0.001;
    const newFrequencies = [];
    
    for (let i = 0; i < 32; i++) {
      const bassBoost = i < 4 ? 2 : 1;
      const midBoost = i > 8 && i < 16 ? 1.5 : 1;
      
      newFrequencies[i] = Math.max(0, 
        (Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5) * bassBoost * midBoost +
        Math.random() * 0.3 +
        Math.sin(time * 8) * 0.2 * (i < 8 ? 1 : 0.3)
      ) * intensity;
    }
    
    setFrequencies(newFrequencies);
    updateBeatDetection(newFrequencies);
    
    audioSimulationRef.current = setTimeout(simulateAudio, 16);
  }, [intensity, updateBeatDetection]);

  // LED color calculations
  const calculateLEDColor = useCallback((zoneIndex, ledIndex, totalLeds) => {
    const time = Date.now() * 0.001;
    
    switch (currentEffect) {
      case 'spectrum':
        const freqIndex = Math.floor((ledIndex / totalLeds) * 32);
        const specIntensity = frequencies[freqIndex] * intensity;
        if (specIntensity < 0.1) return '#111111';
        const hue = (freqIndex / 32) * 360 + gesturePosition.x * 60;
        const saturation = 80 + gesturePosition.y * 20;
        const lightness = Math.min(60, specIntensity * 60);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
      case 'pulse':
        const avgFreq = frequencies.reduce((a, b) => a + b) / 32;
        const pulse = Math.sin(time * 8 + zoneIndex) * 0.5 + 0.5;
        const pulseIntensity = avgFreq * pulse * intensity;
        if (pulseIntensity < 0.1) return '#111111';
        return `hsl(${gesturePosition.x * 360}, 90%, ${pulseIntensity * 50}%)`;
        
      case 'wave':
        const wave = Math.sin(time * 4 + (ledIndex / totalLeds) * Math.PI * 2 + zoneIndex) * 0.5 + 0.5;
        const waveAvgFreq = frequencies.reduce((a, b) => a + b) / 32;
        const waveIntensity = wave * waveAvgFreq * intensity;
        if (waveIntensity < 0.1) return '#111111';
        return `hsl(${(time * 30 + ledIndex * 2) % 360}, 80%, ${waveIntensity * 50}%)`;
        
      case 'sparkle':
        const sparkle = Math.random() < 0.1 ? 1 : 0;
        const sparkleFreqIntensity = frequencies[Math.floor(Math.random() * 32)];
        const sparkleIntensity = sparkle * sparkleFreqIntensity * intensity;
        if (sparkleIntensity < 0.3) return '#111111';
        return `hsl(${Math.random() * 360}, 100%, ${sparkleIntensity * 70}%)`;
        
      default:
        return '#333333';
    }
  }, [currentEffect, frequencies, intensity, gesturePosition]);

  // Animation loop
  const animate = useCallback(() => {
    setLatency(8 + Math.floor(Math.random() * 4));
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Initialize animations
  useEffect(() => {
    simulateAudio();
    animate();
    
    return () => {
      if (audioSimulationRef.current) clearTimeout(audioSimulationRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [simulateAudio, animate]);

  // Gesture control handler
  const handleGestureMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setGesturePosition({ x, y });
  };

  // Slider component
  const Slider = ({ label, value, onChange, id }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      onChange(percent / 100);
    };
    
    useEffect(() => {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);
    
    return (
      <div style={styles.controlSlider}>
        <label style={styles.sliderLabel}>{label}</label>
        <div 
          style={styles.slider}
          onMouseMove={handleMouseMove}
        >
          <div style={styles.sliderTrack}>
            <div style={{...styles.sliderFill, width: `${value * 100}%`}} />
          </div>
          <div 
            style={{...styles.sliderThumb, left: `${value * 100}%`}}
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
    );
  };

  // LED Zone component
  const LEDZone = ({ zoneId, config, zoneIndex }) => {
    return (
      <div style={styles.lightZone}>
        <div style={styles.zoneTitle}>{config.title}</div>
        <div style={styles.ledStrip}>
          {Array.from({ length: config.count }, (_, i) => {
            const color = calculateLEDColor(zoneIndex, i, config.count);
            return (
              <div
                key={i}
                style={{
                  ...styles.led,
                  background: color,
                  boxShadow: color !== '#111111' ? `0 0 6px ${color}` : 'none'
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.body}>
      <div style={styles.mainContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div>ESP32-S3 Light Theremin Performance Interface</div>
          <div style={styles.statusIndicator}>
            <span>System Active</span>
            <div style={styles.ledStatus} />
          </div>
        </div>
        
        {/* Control Panel */}
        <div style={styles.controlPanel}>
          <h3 style={styles.heading}>Audio Analysis</h3>
          
          <Slider 
            label="Sensitivity" 
            value={0.7} 
            onChange={() => {}} 
            id="sensitivity"
          />
          
          <Slider 
            label="Beat Threshold" 
            value={0.6} 
            onChange={() => {}} 
            id="beat"
          />
          
          <h3 style={styles.heading}>Effect Control</h3>
          <div style={styles.effectButtons}>
            {['spectrum', 'pulse', 'wave', 'sparkle'].map(effect => (
              <button
                key={effect}
                style={{
                  ...styles.effectBtn,
                  ...(currentEffect === effect ? styles.effectBtnActive : {})
                }}
                onClick={() => setCurrentEffect(effect)}
              >
                {effect.charAt(0).toUpperCase() + effect.slice(1)}
              </button>
            ))}
          </div>
          
          <h3 style={styles.heading}>ESP32 Network</h3>
          <div style={styles.deviceGrid}>
            {deviceNodes.map(node => (
              <div 
                key={node.id}
                style={{
                  ...styles.deviceNode,
                  ...(node.active ? styles.deviceNodeActive : {})
                }}
              >
                {node.name}<br/>{node.ip}
              </div>
            ))}
          </div>
          
          <div style={styles.performanceStats}>
            <div style={styles.statLine}>
              <span>Audio Latency:</span>
              <span>{latency}ms</span>
            </div>
            <div style={styles.statLine}>
              <span>FFT Rate:</span>
              <span>60 FPS</span>
            </div>
            <div style={styles.statLine}>
              <span>LED Count:</span>
              <span>2,048</span>
            </div>
            <div style={styles.statLine}>
              <span>Mesh Nodes:</span>
              <span>5/6</span>
            </div>
          </div>
        </div>
        
        {/* Main Display */}
        <div style={styles.mainDisplay}>
          <div style={styles.audioSection}>
            <h3 style={styles.heading}>Real-Time Audio Analysis</h3>
            
            <div style={styles.beatDetector}>
              <span>Beat Detection:</span>
              {beats.map((beat, i) => (
                <div 
                  key={i}
                  style={{
                    ...styles.beatIndicator,
                    ...(beat ? styles.beatIndicatorActive : {})
                  }}
                />
              ))}
              <span>128 BPM</span>
            </div>
            
            <div style={styles.fftDisplay}>
              {frequencies.map((freq, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.frequencyBar,
                    left: `${i * (100 / 32)}%`,
                    width: `${100 / 32 - 0.5}%`,
                    height: `${freq * 80}%`
                  }}
                />
              ))}
            </div>
            
            <div style={styles.lightsSection}>
              {Object.entries(ledZones).map(([zoneId, config], index) => (
                <LEDZone key={zoneId} zoneId={zoneId} config={config} zoneIndex={index} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Gesture Panel */}
        <div style={styles.gesturePanel}>
          <h3 style={styles.heading}>Gesture Control</h3>
          <div 
            style={styles.gestureArea}
            onMouseMove={handleGestureMove}
          >
            <div 
              style={{
                ...styles.gestureCursor,
                left: `${gesturePosition.x * 100}%`,
                top: `${gesturePosition.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${1 + gesturePosition.y})`
              }}
            />
          </div>
          
          <Slider 
            label="Intensity" 
            value={intensity} 
            onChange={setIntensity} 
            id="intensity"
          />
          
          <Slider 
            label="Color Temperature" 
            value={colorTemp} 
            onChange={setColorTemp} 
            id="color"
          />
        </div>
      </div>
    </div>
  );
};

// Styles object
const styles = {
  body: {
    background: 'linear-gradient(135deg, #0c0c0c, #1a1a2e, #16213e)',
    color: '#ffffff',
    fontFamily: "'Courier New', monospace",
    minHeight: '100vh',
    margin: 0,
    padding: 0
  },
  mainContainer: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr 250px',
    gridTemplateRows: '60px 1fr',
    height: '100vh',
    gap: '10px',
    padding: '10px'
  },
  header: {
    gridColumn: '1 / -1',
    background: 'rgba(0, 255, 150, 0.1)',
    border: '1px solid #00ff96',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  ledStatus: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#00ff96',
    animation: 'pulse 1.5s infinite'
  },
  controlPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '15px',
    backdropFilter: 'blur(10px)'
  },
  mainDisplay: {
    display: 'grid',
    gridTemplateRows: '1fr 1fr',
    gap: '10px'
  },
  audioSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(10px)'
  },
  fftDisplay: {
    height: '150px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    margin: '15px 0'
  },
  frequencyBar: {
    position: 'absolute',
    bottom: 0,
    background: 'linear-gradient(0deg, #ff3366, #ffaa00, #00ff96)',
    borderRadius: '2px 2px 0 0',
    transition: 'height 0.1s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  beatDetector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '10px 0'
  },
  beatIndicator: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#ff3366',
    opacity: 0.3,
    transition: 'all 0.1s ease'
  },
  beatIndicatorActive: {
    opacity: 1,
    transform: 'scale(1.3)',
    boxShadow: '0 0 20px #ff3366'
  },
  lightsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  lightZone: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '15px',
    position: 'relative'
  },
  zoneTitle: {
    fontSize: '12px',
    color: '#00ff96',
    marginBottom: '10px',
    textTransform: 'uppercase'
  },
  ledStrip: {
    display: 'flex',
    gap: '3px',
    flexWrap: 'wrap'
  },
  led: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#333',
    transition: 'all 0.1s ease'
  },
  gesturePanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '15px',
    backdropFilter: 'blur(10px)'
  },
  gestureArea: {
    width: '100%',
    height: '200px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '2px dashed rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    position: 'relative',
    margin: '15px 0',
    cursor: 'crosshair',
    overflow: 'hidden'
  },
  gestureCursor: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #00ff96, transparent)',
    pointerEvents: 'none',
    transition: 'all 0.1s ease'
  },
  controlSlider: {
    margin: '15px 0'
  },
  sliderLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '5px'
  },
  slider: {
    width: '100%',
    height: '30px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '15px',
    position: 'relative',
    cursor: 'pointer'
  },
  sliderTrack: {
    position: 'absolute',
    top: '50%',
    left: '5px',
    right: '5px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    transform: 'translateY(-50%)'
  },
  sliderFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff3366, #00ff96)',
    borderRadius: '2px',
    transition: 'width 0.2s ease'
  },
  sliderThumb: {
    position: 'absolute',
    top: '50%',
    width: '20px',
    height: '20px',
    background: '#00ff96',
    borderRadius: '50%',
    transform: 'translateY(-50%)',
    cursor: 'grab',
    boxShadow: '0 0 10px rgba(0, 255, 150, 0.5)'
  },
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    margin: '15px 0'
  },
  deviceNode: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    padding: '8px',
    textAlign: 'center',
    fontSize: '10px'
  },
  deviceNodeActive: {
    borderColor: '#00ff96',
    background: 'rgba(0, 255, 150, 0.1)'
  },
  performanceStats: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '11px',
    marginTop: '15px'
  },
  statLine: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '3px 0'
  },
  effectButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    margin: '15px 0'
  },
  effectBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    padding: '8px',
    color: 'white',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  effectBtnActive: {
    background: 'rgba(0, 255, 150, 0.3)',
    borderColor: '#00ff96'
  },
  heading: {
    fontSize: '14px',
    margin: '10px 0',
    color: '#00ff96'
  }
};

export default ESP32ThereminInterface;
