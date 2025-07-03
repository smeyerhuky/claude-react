import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Play, Square, Download, Settings, Camera, Video, 
  Upload, Maximize2, Minimize2,
  Music, Waves, Box, Grid3x3, Zap, Activity, Sparkles
} from 'lucide-react';

const QuantumSpectrogramV2 = () => {
  // Core state matching original structure
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Visualization state
  const [visualMode, setVisualMode] = useState('quantumField3d');
  const [colorScheme, setColorScheme] = useState('cyberpunk');
  
  // Alternative Timeline: Quantum-optimized settings
  const defaultSettings = useMemo(() => ({
    // Universal quantum analysis settings
    sensitivity: 1.2,
    resonanceDepth: 8, // Instead of fftSize
    fieldSmoothing: 0.75,
    
    // Quantum field 3D mode optimized settings
    quantumField3d: {
      fieldCount: 4,
      resonanceStyle: 'entangled', // entangled, coherent, superposed, collapsed
      fieldInteraction: true,
      particleCount: 1500,
      trailLength: 0.85
    },
    
    // Harmonic resonance optimized settings  
    harmonicResonance: {
      stringCount: 6,
      stringTension: 0.8,
      stringDamping: 0.9,
      stringThickness: 4,
      stringSegments: 30,
      stringLayout: 'horizontal',
      bassPosition: 'bottom',
      enableParticles: true,
      particleCount: 25,
      trailLength: 0.92
    },
    
    // Quantum crystallogram optimized settings
    quantumCrystal: {
      crystalBins: 128,
      minResonance: 20,
      maxResonance: 16000,
      trailLength: 0.95,
      sensitivity: 1.0
    },
    
    // Standard quantum field optimized settings
    quantumSpectrum: {
      trailLength: 0.88,
      sensitivity: 1.3
    },
    
    // Waveform optimized settings
    waveform: {
      trailLength: 0.8,
      sensitivity: 1.5
    },
    
    // Particle field optimized settings
    particleField: {
      particleDensity: 8,
      particleSize: 4,
      movementIntensity: 3,
      colorSaturation: 70,
      trailLength: 0.9
    }
  }), []);

  const [settings, setSettings] = useState({
    // Universal settings
    sensitivity: defaultSettings.sensitivity,
    resonanceDepth: defaultSettings.resonanceDepth,
    fieldSmoothing: defaultSettings.fieldSmoothing,
    crystalBins: defaultSettings.quantumCrystal.crystalBins,
    minResonance: defaultSettings.quantumCrystal.minResonance,
    maxResonance: defaultSettings.quantumCrystal.maxResonance,
    trailLength: defaultSettings.quantumField3d.trailLength,
    
    // Simplified quantum field settings
    fieldCount: defaultSettings.quantumField3d.fieldCount,
    resonanceStyle: defaultSettings.quantumField3d.resonanceStyle,
    fieldInteraction: defaultSettings.quantumField3d.fieldInteraction,
    
    // String settings
    stringCount: defaultSettings.harmonicResonance.stringCount,
    stringTension: defaultSettings.harmonicResonance.stringTension,
    stringDamping: defaultSettings.harmonicResonance.stringDamping,
    stringThickness: defaultSettings.harmonicResonance.stringThickness,
    stringSegments: defaultSettings.harmonicResonance.stringSegments,
    stringLayout: defaultSettings.harmonicResonance.stringLayout,
    bassPosition: defaultSettings.harmonicResonance.bassPosition,
    enableParticles: defaultSettings.harmonicResonance.enableParticles,
    particleCount: defaultSettings.quantumField3d.particleCount,
    
    // Particle field settings
    particleDensity: defaultSettings.particleField.particleDensity,
    particleSize: defaultSettings.particleField.particleSize,
    movementIntensity: defaultSettings.particleField.movementIntensity,
    colorSaturation: defaultSettings.particleField.colorSaturation,
    
    // Legacy compatibility
    bloomStrength: 1.5,
    windowFunction: 'quantum-hann'
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
  const quantumFieldsRef = useRef([]);
  const particlesRef = useRef(null);
  const quantumCrystalRef = useRef([]);
  const beatHistoryRef = useRef([]);
  const settingsRef = useRef(settings);
  const colorSchemeRef = useRef(colorScheme);
  const visualModeRef = useRef(visualMode);
  const stringsRef = useRef([]);
  const stringPhysicsRef = useRef(null);
  
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

  // Auto-optimize settings when switching visualization modes
  const applyModeOptimizedSettings = useCallback((mode) => {
    const modeDefaults = defaultSettings[mode];
    if (modeDefaults) {
      setSettings(prev => ({
        ...prev,
        ...modeDefaults,
        sensitivity: modeDefaults.sensitivity || defaultSettings.sensitivity,
        resonanceDepth: prev.resonanceDepth,
        fieldSmoothing: prev.fieldSmoothing
      }));
    }
  }, [defaultSettings]);

  // Define quantum resonance style presets
  const resonanceStylePresets = useMemo(() => ({
    entangled: {
      elasticity: 0.8,
      internalForces: 8,
      movementSpeed: 0.6,
      interactionStrength: 0.9,
      physicsLimits: { max: 1.8, tension: 0.4 },
      description: 'Quantum entangled fields that react instantaneously to each other'
    },
    coherent: {
      elasticity: 0.6,
      internalForces: 6,
      movementSpeed: 0.5,
      interactionStrength: 0.4,
      physicsLimits: { max: 1.5, tension: 0.7 },
      description: 'Coherent wave-like movements with synchronized patterns'
    },
    superposed: {
      elasticity: 1.0,
      internalForces: 10,
      movementSpeed: 0.8,
      interactionStrength: 0.7,
      physicsLimits: { max: 1.2, tension: 0.5 },
      description: 'Multiple quantum states existing simultaneously'
    },
    collapsed: {
      elasticity: 0.4,
      internalForces: 4,
      movementSpeed: 0.3,
      interactionStrength: 0.2,
      physicsLimits: { max: 0.8, tension: 0.9 },
      description: 'Collapsed wave function creating stable, defined states'
    }
  }), []);

  // Color schemes
  const colorSchemes = useMemo(() => ({
    cyberpunk: {
      bass: [255, 0, 128],
      mid: [0, 255, 255],
      high: [255, 255, 0],
      background: '#0a0a0a',
      accent: '#ff0080'
    },
    quantum: {
      bass: [138, 43, 226],
      mid: [75, 0, 130],
      high: [147, 112, 219],
      background: '#0a0020',
      accent: '#8a2be2'
    },
    nature: {
      bass: [34, 139, 34],
      mid: [70, 130, 180],
      high: [255, 215, 0],
      background: '#0d1117',
      accent: '#228b22'
    },
    aurora: {
      bass: [0, 255, 127],
      mid: [64, 224, 208],
      high: [173, 216, 230],
      background: '#001122',
      accent: '#00ff7f'
    }
  }), []);

  // Alternative Timeline: Quantum Resonance Field Analysis
  class QuantumResonanceField {
    constructor(segments, tension, damping, frequency = 82.41) {
      this.segments = segments;
      this.tension = tension;
      this.damping = damping;
      this.frequency = frequency;
      this.quantumStates = [];
      this.waveFunction = [];
      this.entanglementMatrix = [];
      this.resonanceNodes = [];
      this.isActive = false;
      this.lastQuantumEvent = 0;
      this.coherenceLevel = 0;
      this.particles = [];
      
      // Initialize quantum field points
      for (let i = 0; i <= segments; i++) {
        this.quantumStates.push({ 
          position: { x: 0, y: 0, baseY: 0 },
          probability: Math.random(),
          phase: Math.random() * Math.PI * 2,
          entanglement: 0
        });
        this.waveFunction.push({ amplitude: 0, frequency: 0, phase: 0 });
        this.resonanceNodes.push({ energy: 0, coherence: 0 });
      }
      
      // Initialize entanglement matrix
      for (let i = 0; i < segments; i++) {
        this.entanglementMatrix[i] = [];
        for (let j = 0; j < segments; j++) {
          this.entanglementMatrix[i][j] = i === j ? 1 : Math.exp(-Math.abs(i - j) * 0.5);
        }
      }
    }

    setEndpoints(x1, y1, x2, y2) {
      for (let i = 0; i <= this.segments; i++) {
        const t = i / this.segments;
        this.quantumStates[i].position.x = x1 + (x2 - x1) * t;
        this.quantumStates[i].position.y = y1 + (y2 - y1) * t;
        this.quantumStates[i].position.baseY = y1 + (y2 - y1) * t;
      }
    }

    // Alternative Timeline: Quantum Entanglement Pluck
    quantumPluck(position, strength) {
      const segmentIndex = Math.floor(position * this.segments);
      const quantumDisplacement = strength * 15;
      
      // Create quantum superposition across entangled segments
      for (let i = 0; i < this.segments; i++) {
        const entanglement = this.entanglementMatrix[segmentIndex][i];
        const probability = Math.random();
        
        // Quantum tunnel effect - sometimes affects distant segments
        if (probability < entanglement || (probability < 0.1 && Math.random() < 0.3)) {
          const displacement = quantumDisplacement * entanglement * (Math.random() > 0.5 ? 1 : -1);
          this.quantumStates[i].position.y = this.quantumStates[i].position.baseY + displacement;
          this.quantumStates[i].phase += Math.PI * strength * entanglement;
          this.quantumStates[i].probability = Math.min(1, this.quantumStates[i].probability + strength * 0.1);
        }
      }
      
      // Update wave function
      this.updateWaveFunction();
    }

    // Alternative Timeline: Wave Function Collapse Analysis
    updateWaveFunction() {
      for (let i = 0; i < this.segments; i++) {
        const state = this.quantumStates[i];
        
        // Calculate wave function based on quantum state
        this.waveFunction[i].amplitude = state.probability * Math.sin(state.phase);
        this.waveFunction[i].frequency = this.frequency * (1 + state.entanglement * 0.1);
        this.waveFunction[i].phase = state.phase;
        
        // Calculate resonance energy
        let resonanceEnergy = 0;
        for (let j = 0; j < this.segments; j++) {
          if (i !== j) {
            const distance = Math.abs(i - j);
            const entanglement = this.entanglementMatrix[i][j];
            resonanceEnergy += this.quantumStates[j].probability * entanglement / distance;
          }
        }
        
        this.resonanceNodes[i].energy = resonanceEnergy;
        this.resonanceNodes[i].coherence = Math.abs(this.waveFunction[i].amplitude);
      }
    }

    // Alternative Timeline: Quantum Field Evolution
    update() {
      // Update quantum states with coherence decay
      for (let i = 0; i < this.segments; i++) {
        const state = this.quantumStates[i];
        
        // Quantum decoherence
        state.probability *= this.damping;
        state.phase += 0.1 * (1 - this.damping);
        
        // Resonance interaction with neighbors
        if (i > 0 && i < this.segments - 1) {
          const leftInfluence = this.quantumStates[i-1].probability * this.tension;
          const rightInfluence = this.quantumStates[i+1].probability * this.tension;
          const centeringForce = (state.position.baseY - state.position.y) * this.tension * 0.1;
          
          state.position.y += (leftInfluence + rightInfluence + centeringForce) * 0.01;
        }
        
        // Update entanglement based on resonance
        for (let j = 0; j < this.segments; j++) {
          if (i !== j) {
            const resonance = this.resonanceNodes[j].energy;
            this.entanglementMatrix[i][j] = Math.max(0.1, 
              this.entanglementMatrix[i][j] * 0.99 + resonance * 0.01);
          }
        }
      }
      
      // Update wave function
      this.updateWaveFunction();
      
      // Check if field is active
      this.isActive = this.quantumStates.some(state => state.probability > 0.05);
      
      // Update overall coherence level
      this.coherenceLevel = this.resonanceNodes.reduce((sum, node) => sum + node.coherence, 0) / this.segments;
    }

    getQuantumStates() {
      return this.quantumStates;
    }

    getWaveFunction() {
      return this.waveFunction;
    }

    getResonanceNodes() {
      return this.resonanceNodes;
    }
  }

  // Guitar string frequencies (quantum harmonics)
  const quantumFrequencies = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
  
  // Quantum field colors
  const getQuantumFieldColor = (fieldIndex) => {
    const quantumColors = {
      0: [138, 43, 226],   // Purple for low quantum states
      1: [75, 0, 130],     // Indigo for mid-low states
      2: [147, 112, 219],  // Violet for mid states
      3: [186, 85, 211],   // Medium orchid for high-mid states
      4: [221, 160, 221],  // Plum for high states
      5: [238, 130, 238]   // Violet for ultra-high states
    };
    return quantumColors[fieldIndex] || [255, 255, 255];
  };

  // Initialize quantum resonance fields
  const initializeQuantumFields = useCallback((fieldCount, segments, tension, damping) => {
    const fields = [];
    for (let i = 0; i < fieldCount; i++) {
      const frequency = quantumFrequencies[i] || quantumFrequencies[quantumFrequencies.length - 1];
      fields.push(new QuantumResonanceField(segments, tension, damping, frequency));
    }
    stringsRef.current = fields;
    stringPhysicsRef.current = { QuantumResonanceField };
  }, []);

  // Create 3D quantum field materials
  const createQuantumFieldMaterial = useCallback((resonanceRange, fieldIndex) => {
    const shaders = {
      entangled: {
        vertex: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform float fieldIndex;
          uniform vec3 quantumFields[8]; // Quantum field positions
          uniform float coherence;
          uniform float entanglement;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vQuantumState;
          
          // Quantum noise function
          float quantumNoise(vec3 p) {
            return fract(sin(dot(p, vec3(13.9898, 79.233, 47.164))) * 43758.5453);
          }
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            
            vec3 newPosition = position;
            float totalQuantumEnergy = 0.0;
            
            // Apply quantum field effects
            for(int i = 0; i < 8; i++) {
              vec3 quantumCenter = quantumFields[i];
              float distance = length(position - quantumCenter);
              
              // Quantum field strength varies by frequency band
              float fieldStrength = 0.0;
              if(i < 3) {
                fieldStrength = bassLevel * (3.0 + sin(time * 0.7 + float(i)));
              } else if(i < 6) {
                fieldStrength = midLevel * (2.0 + cos(time * 1.1 + float(i)));
              } else {
                fieldStrength = highLevel * (1.5 + sin(time * 1.8 + float(i)));
              }
              
              // Quantum tunneling effect - non-local influence
              float quantumTunneling = exp(-distance * 0.5) + 0.1 * quantumNoise(position + time);
              float fieldMagnitude = fieldStrength * quantumTunneling * coherence;
              
              // Entangled motion - instantaneous correlation
              vec3 entangledDirection = normalize(position - quantumCenter);
              float entangledMagnitude = fieldMagnitude * entanglement;
              
              newPosition += entangledDirection * clamp(entangledMagnitude, 0.0, 1.2);
              totalQuantumEnergy += fieldMagnitude;
            }
            
            // Quantum uncertainty principle - controlled randomness
            float uncertainty = quantumNoise(position * 8.0 + time) * 0.4 * coherence;
            newPosition += normal * clamp(uncertainty * (0.3 + 0.7 * sin(time * 2.5 + fieldIndex)), -0.3, 0.3);
            
            // Wave-particle duality breathing
            float waveMotion = sin(time * 1.2 + fieldIndex) * 0.2 * entanglement;
            newPosition += normal * clamp(waveMotion, -0.4, 0.4);
            
            // Quantum decoherence prevents explosion
            float decoherence = 1.0 - totalQuantumEnergy * 0.2;
            newPosition = mix(newPosition, normalize(position) * length(position), max(decoherence * 0.3, 0.1));
            
            vPosition = newPosition;
            vQuantumState = totalQuantumEnergy;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragment: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform vec3 colorScheme;
          uniform float fieldIndex;
          uniform float coherence;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vQuantumState;
          
          void main() {
            // Quantum color superposition
            vec3 baseColor = colorScheme;
            
            // Quantum interference patterns
            vec3 interferenceColor = vec3(
              0.7 + 0.3 * sin(time + vQuantumState * 6.0),
              0.5 + 0.5 * cos(time * 1.4 + vQuantumState * 4.0),
              0.9 + 0.2 * sin(time * 0.6 + vQuantumState * 8.0)
            );
            
            // Mix colors based on quantum state
            vec3 finalColor = mix(baseColor, interferenceColor, vQuantumState * 0.8);
            
            // Quantum glow effect
            float quantumGlow = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
            finalColor += vec3(bassLevel, midLevel, highLevel) * quantumGlow * 0.4;
            
            // Quantum transparency with coherence
            float quantumAlpha = 0.5 + coherence * 0.3 + vQuantumState * 0.2;
            
            gl_FragColor = vec4(finalColor, quantumAlpha);
          }
        `
      },
      coherent: {
        vertex: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform float fieldIndex;
          uniform vec3 quantumFields[8];
          uniform float coherence;
          uniform float entanglement;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vQuantumState;
          
          float quantumNoise(vec3 p) {
            return fract(sin(dot(p, vec3(13.9898, 79.233, 47.164))) * 43758.5453);
          }
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec3 newPosition = position;
            
            // Coherent wave motion
            float coherentPhase = time * 1.5 + fieldIndex * 2.0;
            
            // Multiple coherent wave sources
            float totalCoherence = 0.0;
            for(int i = 0; i < 8; i++) {
              vec3 waveSource = quantumFields[i];
              float distance = length(position - waveSource);
              
              float waveAmplitude = 0.0;
              if(i < 4) {
                waveAmplitude = bassLevel * sin(coherentPhase * 2.0 + float(i) + fieldIndex);
              } else {
                waveAmplitude = (midLevel + highLevel) * cos(coherentPhase * 1.3 + float(i) * 1.5);
              }
              
              // Coherent wave propagation
              float waveExpansion = waveAmplitude / (distance + 0.5);
              vec3 waveDirection = normalize(position - waveSource);
              
              newPosition += waveDirection * waveExpansion * coherence;
              totalCoherence += abs(waveExpansion);
            }
            
            // Coherent oscillations
            float coherentWave = sin(time * 3.0 + length(position) * 2.5 + fieldIndex) * 0.25;
            newPosition += normal * coherentWave * coherence;
            
            vPosition = newPosition;
            vQuantumState = totalCoherence;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragment: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform vec3 colorScheme;
          uniform float fieldIndex;
          uniform float coherence;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vQuantumState;
          
          void main() {
            vec3 baseColor = colorScheme;
            
            // Coherent wave interference
            float coherentPattern = sin(time + vQuantumState * 12.0 + dot(vNormal, vec3(1.0, 0.7, 0.4))) * 0.5 + 0.5;
            vec3 coherentColor = vec3(
              0.6 + 0.4 * coherentPattern,
              0.7 + 0.3 * sin(coherentPattern * 3.14159),
              0.8 + 0.2 * cos(coherentPattern * 6.28318)
            );
            
            vec3 finalColor = mix(baseColor, coherentColor, 0.7);
            
            // Coherence-based transparency
            float alpha = 0.3 + coherence * 0.5 + vQuantumState * 0.15;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `
      }
    };
    
    const shaderType = resonanceRange === 'bass' ? 'entangled' : 'coherent';
    const shader = shaders[shaderType];
    
    // Generate quantum field positions
    const quantumFields = [];
    for(let i = 0; i < 8; i++) {
      quantumFields.push(new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0
      ));
    }
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bassLevel: { value: 0 },
        midLevel: { value: 0 },
        highLevel: { value: 0 },
        colorScheme: { value: new THREE.Vector3(0.5, 0, 1) },
        fieldIndex: { value: fieldIndex },
        quantumFields: { value: quantumFields },
        coherence: { value: 0.5 + Math.random() * 0.5 },
        entanglement: { value: 0.3 + Math.random() * 0.4 }
      },
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  // Create spectrum-mapped quantum fields
  const createQuantumFields = useCallback((scene) => {
    // Clear existing fields
    quantumFieldsRef.current.forEach(field => {
      scene.remove(field.mesh);
      field.material.dispose();
      field.geometry.dispose();
    });
    quantumFieldsRef.current = [];
    
    const currentSettings = settingsRef.current;
    const fieldCount = currentSettings.fieldCount;
    const resonanceStyle = resonanceStylePresets[currentSettings.resonanceStyle] || resonanceStylePresets.entangled;
    
    // Define quantum resonance mapping
    const quantumMapping = [
      { range: 'bass', color: [0.5, 0.2, 1.0], name: 'Low Quantum' },
      { range: 'lowMid', color: [0.3, 0.0, 0.8], name: 'Mid-Low Quantum' },
      { range: 'mid', color: [0.6, 0.4, 0.9], name: 'Mid Quantum' },
      { range: 'highMid', color: [0.7, 0.3, 1.0], name: 'High-Mid Quantum' },
      { range: 'presence', color: [0.9, 0.5, 0.9], name: 'Presence Quantum' },
      { range: 'brilliance', color: [1.0, 0.7, 0.8], name: 'Brilliance Quantum' }
    ];
    
    for (let i = 0; i < Math.min(fieldCount, 6); i++) {
      const quantumData = quantumMapping[i];
      
      // Create quantum field geometry
      const baseSize = 3.0 + (i * 0.4);
      const geometry = new THREE.SphereGeometry(baseSize, 32, 16);
      
      const material = createQuantumFieldMaterial(quantumData.range, i);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position fields in quantum arrangement
      const angle = (i / fieldCount) * Math.PI * 2;
      const radiusPos = 7 + i * 1.8;
      const height = Math.sin(angle) * 2.5;
      const depth = Math.cos(angle * 0.8) * 3.5;
      
      mesh.position.set(
        Math.cos(angle) * radiusPos,
        height,
        Math.sin(angle) * radiusPos * 0.7 + depth
      );
      
      // Quantum rotation
      mesh.rotation.set(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
      );
      
      // Store quantum field data
      const fieldData = {
        mesh,
        material,
        geometry,
        resonanceRange: quantumData.range,
        quantumColor: quantumData.color,
        quantumName: quantumData.name,
        index: i,
        basePosition: { 
          x: mesh.position.x, 
          y: mesh.position.y, 
          z: mesh.position.z 
        },
        quantumPhase: Math.random() * Math.PI * 2,
        resonanceSpeed: resonanceStyle.movementSpeed * (0.7 + Math.random() * 0.6),
        quantumRadius: 3 + i * 0.7,
        entanglementLevel: resonanceStyle.interactionStrength,
        size: baseSize
      };
      
      quantumFieldsRef.current.push(fieldData);
      scene.add(mesh);
    }
  }, [createQuantumFieldMaterial, resonanceStylePresets]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Alternative Timeline: Quantum Resonance Analysis
  const generateQuantumResonanceData = useCallback((audioData) => {
    // Instead of FFT, use quantum field analysis
    const quantumBands = [];
    const bandSize = Math.floor(audioData.length / 8);
    
    for (let band = 0; band < 8; band++) {
      const startIndex = band * bandSize;
      const endIndex = Math.min((band + 1) * bandSize, audioData.length);
      
      let resonanceEnergy = 0;
      let phaseCoherence = 0;
      let quantumEntanglement = 0;
      
      // Calculate quantum resonance instead of frequency magnitude
      for (let i = startIndex; i < endIndex; i++) {
        const amplitude = audioData[i] / 255;
        
        // Quantum resonance is based on phase relationships
        const phase = (i - startIndex) / (endIndex - startIndex) * Math.PI * 2;
        const resonance = amplitude * Math.sin(phase + performance.now() * 0.001);
        
        resonanceEnergy += Math.abs(resonance);
        phaseCoherence += Math.cos(phase) * amplitude;
        
        // Entanglement with neighboring bands
        if (band > 0 && i > 0) {
          const prevBandIndex = Math.max(0, (band - 1) * bandSize + (i - startIndex));
          if (prevBandIndex < audioData.length) {
            const entanglement = Math.abs(audioData[i] - audioData[prevBandIndex]) / 255;
            quantumEntanglement += entanglement;
          }
        }
      }
      
      quantumBands.push({
        band: band,
        resonanceEnergy: resonanceEnergy / (endIndex - startIndex),
        phaseCoherence: Math.abs(phaseCoherence) / (endIndex - startIndex),
        quantumEntanglement: quantumEntanglement / (endIndex - startIndex),
        frequency: 55 * Math.pow(2, band * 1.5), // Quantum frequency mapping
        quantumState: Math.random() > 0.7 ? 'superposed' : 'coherent'
      });
    }
    
    return quantumBands;
  }, []);

  // Initialize audio with quantum analysis
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
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = Math.pow(2, settings.resonanceDepth);
      analyserRef.current.smoothingTimeConstant = settings.fieldSmoothing;
      
      source.connect(analyserRef.current);
      
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

  // Alternative Timeline: Quantum beat detection
  const detectQuantumBeat = (quantumEnergy) => {
    beatHistoryRef.current.push(quantumEnergy);
    if (beatHistoryRef.current.length > 43) {
      beatHistoryRef.current.shift();
    }
    
    if (beatHistoryRef.current.length < 10) return false;
    
    const average = beatHistoryRef.current.reduce((a, b) => a + b) / beatHistoryRef.current.length;
    const variance = beatHistoryRef.current.reduce((a, b) => a + Math.pow(b - average, 2), 0) / beatHistoryRef.current.length;
    const quantumThreshold = average + Math.sqrt(variance) * 1.8;
    
    return quantumEnergy > quantumThreshold && quantumEnergy > average * 1.4;
  };

  // Update quantum fields
  const updateQuantumFields = useCallback((audioData, bassAvg, midAvg, highAvg) => {
    if (quantumFieldsRef.current.length === 0) return;
    
    const time = performance.now() * 0.001;
    const quantumBands = generateQuantumResonanceData(audioData);
    
    quantumFieldsRef.current.forEach((field, index) => {
      if (!field.material.uniforms) return;
      
      const uniforms = field.material.uniforms;
      const quantumData = quantumBands[index] || quantumBands[0];
      
      // Update quantum uniforms
      uniforms.time.value = time;
      uniforms.bassLevel.value = Math.min(quantumData.resonanceEnergy * 1.5, 2.0);
      uniforms.midLevel.value = Math.min(quantumData.phaseCoherence * 1.3, 1.8);
      uniforms.highLevel.value = Math.min(quantumData.quantumEntanglement * 1.1, 1.5);
      
      // Quantum color mapping
      uniforms.colorScheme.value.set(
        field.quantumColor[0],
        field.quantumColor[1],
        field.quantumColor[2]
      );
      
      // Update quantum field positions
      if (uniforms.quantumFields) {
        uniforms.quantumFields.value.forEach((qField, i) => {
          const qTime = time * (0.4 + i * 0.08);
          const quantumInfluence = (bassAvg + midAvg + highAvg) / 3;
          
          qField.x += Math.sin(qTime * 1.8 + i) * quantumInfluence * 0.015;
          qField.y += Math.cos(qTime * 1.3 + i * 1.7) * quantumInfluence * 0.015;
          qField.z += Math.sin(qTime * 1.6 + i * 1.1) * quantumInfluence * 0.015;
          
          qField.clampLength(0, 2.5);
        });
      }
      
      // Quantum field movement
      field.quantumPhase += field.resonanceSpeed * 0.012;
      
      const quantumIntensity = quantumData.resonanceEnergy;
      const movementRadius = field.quantumRadius + quantumIntensity * 2.5;
      
      field.mesh.position.x = field.basePosition.x + Math.cos(field.quantumPhase) * movementRadius;
      field.mesh.position.z = field.basePosition.z + Math.sin(field.quantumPhase * 0.7) * movementRadius * 0.8;
      field.mesh.position.y = field.basePosition.y + Math.sin(time * 0.8 + field.quantumPhase) * 2 + quantumIntensity * 1.5;
      
      // Quantum entanglement effects
      if (settingsRef.current.fieldInteraction && quantumFieldsRef.current.length > 1) {
        quantumFieldsRef.current.forEach((otherField, otherIndex) => {
          if (index !== otherIndex) {
            const distance = field.mesh.position.distanceTo(otherField.mesh.position);
            const entanglementForce = quantumData.quantumEntanglement * field.entanglementLevel * 0.08;
            
            // Quantum tunneling - instantaneous effect regardless of distance
            if (Math.random() < 0.1) {
              const direction = field.mesh.position.clone().sub(otherField.mesh.position).normalize();
              field.mesh.position.add(direction.multiplyScalar(entanglementForce * 0.3));
            }
          }
        });
      }
      
      // Quantum scaling
      const scaleVariation = 1 + quantumData.phaseCoherence * 0.2;
      field.mesh.scale.setScalar(Math.min(scaleVariation, 1.6));
    });
  }, [generateQuantumResonanceData]);

  // Main animation loop
  const animate = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Alternative Timeline: Quantum frequency band analysis
    const bassRange = Math.floor(bufferLength * 0.06);
    const midRange = Math.floor(bufferLength * 0.45);
    
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
    
    // Quantum beat detection
    const quantumEnergy = (bassAvg + midAvg + highAvg) / 3;
    const beat = detectQuantumBeat(quantumEnergy);
    setBeatDetected(beat);
    
    // Apply quantum resonance to fields
    if (beat && visualModeRef.current === 'harmonicResonance' && stringsRef.current.length > 0) {
      const beatIntensity = quantumEnergy;
      
      if (beatIntensity > 0.4) {
        const activeFields = Math.floor(Math.random() * 2) + 2;
        const fieldIndices = Array.from({length: stringsRef.current.length}, (_, i) => i)
          .sort(() => Math.random() - 0.5)
          .slice(0, activeFields);
        
        fieldIndices.forEach((fieldIndex, i) => {
          const field = stringsRef.current[fieldIndex];
          if (field) {
            setTimeout(() => {
              const quantumPosition = 0.3 + Math.random() * 0.4;
              const quantumStrength = beatIntensity * (6 + Math.random() * 8);
              field.quantumPluck(quantumPosition, quantumStrength);
            }, i * 60);
          }
        });
      }
    }
    
    // Update quantum crystal data
    const quantumData = generateQuantumResonanceData(dataArray);
    quantumCrystalRef.current.push(quantumData);
    if (quantumCrystalRef.current.length > 100) {
      quantumCrystalRef.current.shift();
    }
    
    // Update visualizations
    if (visualModeRef.current === 'quantumField3d' && sceneRef.current) {
      updateQuantumFields(dataArray, bassAvg, midAvg, highAvg);
      
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
        particlesRef.current.rotation.y += 0.0008;
      }
      
      rendererRef.current?.render(sceneRef.current, cameraRef.current);
    } else if (canvas2DRef.current) {
      draw2DVisualization(dataArray);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [generateQuantumResonanceData, updateQuantumFields]);

  // Draw 2D visualization placeholder
  const draw2DVisualization = useCallback((frequencyData) => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const scale = window.devicePixelRatio || 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    
    const scaledWidth = width / scale;
    const scaledHeight = height / scale;
    
    // Clear with quantum trail effect
    ctx.fillStyle = `rgba(10, 0, 32, ${1 - settingsRef.current.trailLength})`;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    
    const colors = colorSchemes[colorSchemeRef.current];
    
    // Draw quantum spectrum visualization
    const barWidth = scaledWidth / frequencyData.length * 2;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * scaledHeight * settingsRef.current.sensitivity;
      const x = i * barWidth;
      
      // Quantum gradient
      const gradient = ctx.createLinearGradient(0, scaledHeight - barHeight, 0, scaledHeight);
      gradient.addColorStop(0, `rgb(${colors.high.join(',')})`);
      gradient.addColorStop(0.5, `rgb(${colors.mid.join(',')})`);
      gradient.addColorStop(1, `rgb(${colors.bass.join(',')})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, scaledHeight - barHeight, barWidth - 1, barHeight);
    }
    
    // Draw quantum beat indicator
    if (beatDetected) {
      ctx.fillStyle = `rgba(${colors.bass.join(',')}, 0.4)`;
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    }
  }, [beatDetected, colorSchemes]);

  // Initialize 3D scene
  const init3DScene = useCallback(() => {
    if (!containerRef.current || rendererRef.current) return;

    try {
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000020, 1, 100);
      sceneRef.current = scene;

      const visualizationArea = containerRef.current.querySelector('div');
      const aspectRatio = visualizationArea ? 
        visualizationArea.clientWidth / visualizationArea.clientHeight :
        (containerRef.current.clientWidth - 32) / (containerRef.current.clientHeight - 256);
      
      const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
      camera.position.set(0, 6, 22);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true 
      });
      
      const visualWidth = containerRef.current.clientWidth - 32;
      const visualHeight = containerRef.current.clientHeight - 256;
      renderer.setSize(visualWidth, visualHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;
      
      const visualizationContainer = containerRef.current.querySelector('div');
      if (visualizationContainer) {
        visualizationContainer.appendChild(renderer.domElement);
      } else {
        containerRef.current.appendChild(renderer.domElement);
      }

      // Quantum lighting
      const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0x8a2be2, 1.2, 100);
      pointLight.position.set(12, 12, 12);
      scene.add(pointLight);

      // Create quantum fields
      createQuantumFields(scene);

      const handleResize = () => {
        if (!containerRef.current) return;
        const visualWidth = containerRef.current.clientWidth - 32;
        const visualHeight = containerRef.current.clientHeight - 256;
        camera.aspect = visualWidth / visualHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(visualWidth, visualHeight);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (err) {
      console.error('Error initializing 3D scene:', err);
      setVisualMode('harmonicResonance');
    }
  }, [createQuantumFields]);

  // Cleanup 3D scene
  const cleanup3DScene = useCallback(() => {
    if (rendererRef.current) {
      if (rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    
    if (sceneRef.current) {
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
    
    quantumFieldsRef.current = [];
    particlesRef.current = null;
    cameraRef.current = null;
  }, []);

  // Handle visualization mode change
  useEffect(() => {
    if (!isRecording) return;
    
    if (visualMode === 'quantumField3d') {
      init3DScene();
    } else {
      cleanup3DScene();
      
      if (canvas2DRef.current) {
        const canvas = canvas2DRef.current;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const colors = colorSchemes[colorScheme];
        canvas.style.backgroundColor = colors.background;
        
        if (visualMode === 'harmonicResonance') {
          initializeQuantumFields(
            settings.stringCount, 
            settings.stringSegments, 
            settings.stringTension, 
            settings.stringDamping
          );
        }
      }
    }
  }, [visualMode, isRecording, init3DScene, cleanup3DScene, colorScheme, settings, initializeQuantumFields, colorSchemes]);

  // Start/stop recording
  const startRecording = async () => {
    try {
      if (!isAnalyzing) {
        const success = await initializeAudio();
        if (!success) return;
      }
      
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setRecordedChunks([]);
      mediaRecorderRef.current?.start();
      setIsRecording(true);
      
      if (visualMode === 'quantumField3d') {
        init3DScene();
      }
      
      animate();
    } catch (err) {
      console.error('Error starting recording:', err);
      setIsRecording(false);
      setIsAnalyzing(false);
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setIsAnalyzing(false);
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  // Update canvas size for 2D visualizations
  useEffect(() => {
    if (!canvas2DRef.current) return;
    
    const updateCanvasSize = () => {
      const canvas = canvas2DRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [visualMode]);

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
      <div className="absolute top-24 bottom-40 left-4 right-4 border border-purple-800/30 rounded-lg overflow-hidden">
        <canvas
          key={`canvas-${visualMode}-${colorScheme}`}
          ref={canvas2DRef}
          className={`absolute inset-0 w-full h-full ${visualMode !== 'quantumField3d' ? 'block' : 'hidden'}`}
          style={{ backgroundColor: colorSchemes[colorScheme].background }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-white text-xl font-bold mb-1">Quantum Spectrogram - Alternative Timeline</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Quantum BPM: {bpm || '--'}</span>
            <span>Mode: {visualMode}</span>
            {beatDetected && <span className="text-purple-500 animate-pulse">Q-BEAT</span>}
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="pointer-events-auto p-2 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Simplified settings panel */}
      <div
        className={`absolute top-0 right-0 h-full bg-purple-900/95 backdrop-blur-md transition-transform duration-300 overflow-y-auto z-50 ${
          showSettings ? 'translate-x-0' : 'translate-x-full'
        } ${isMobile ? 'w-full' : 'w-96'}`}
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Quantum Settings</h2>
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
              Quantum Visualization Mode
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { id: 'quantumField3d', icon: Box, label: 'Quantum Field' },
                { id: 'harmonicResonance', icon: Activity, label: 'Harmonic Resonance' },
                { id: 'particleField', icon: Sparkles, label: 'Particle Field' },
                { id: 'quantumSpectrum', icon: Grid3x3, label: 'Quantum Spectrum' },
                { id: 'quantumCrystal', icon: Waves, label: 'Quantum Crystal' },
                { id: 'waveform', icon: Music, label: 'Waveform' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setVisualMode(id);
                    setTimeout(() => applyModeOptimizedSettings(id), 100);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                    visualMode === id
                      ? 'bg-purple-600 text-white'
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
              Quantum Color Scheme
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

          {/* Core Quantum Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quantum Audio Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4">
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
                  <span>Field Smoothing</span>
                  <span>{settings.fieldSmoothing.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.99"
                  step="0.01"
                  value={settings.fieldSmoothing}
                  onChange={(e) => setSettings({ ...settings, fieldSmoothing: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Resonance Depth</span>
                <span>{Math.pow(2, settings.resonanceDepth)}</span>
              </label>
              <select
                value={settings.resonanceDepth}
                onChange={(e) => setSettings({ ...settings, resonanceDepth: parseInt(e.target.value) })}
                className="w-full bg-gray-800 text-white rounded px-2 py-1"
              >
                {[9, 10, 11, 12, 13].map(depth => (
                  <option key={depth} value={depth}>{Math.pow(2, depth)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantum Field Settings */}
          {visualMode === 'quantumField3d' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quantum Fields</h3>
              
              <div>
                <label className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Field Count</span>
                  <span>{settings.fieldCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={settings.fieldCount}
                  onChange={(e) => setSettings({ ...settings, fieldCount: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resonance Style
                </label>
                <select
                  value={settings.resonanceStyle}
                  onChange={(e) => setSettings({ ...settings, resonanceStyle: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded px-2 py-1"
                >
                  <option value="entangled">Entangled - Instantaneous correlation</option>
                  <option value="coherent">Coherent - Wave-like synchronization</option>
                  <option value="superposed">Superposed - Multiple states</option>
                  <option value="collapsed">Collapsed - Stable, defined states</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Quantum Interactions</span>
                <input
                  type="checkbox"
                  checked={settings.fieldInteraction}
                  onChange={(e) => setSettings({ ...settings, fieldInteraction: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quantum frequency indicators */}
      <div className="absolute bottom-24 left-4 right-4 flex gap-2 pointer-events-none">
        <div className="flex-1 bg-purple-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">Q-BASS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all duration-100"
              style={{ width: `${Math.min(100, bassLevel * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-purple-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">Q-MIDS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-100"
              style={{ width: `${Math.min(100, midLevel * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex-1 bg-purple-900/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1">Q-HIGHS</div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-pink-600 transition-all duration-100"
              style={{ width: `${Math.min(100, highLevel * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-purple-900/90 backdrop-blur-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span className={isMobile ? 'hidden' : ''}>Start Quantum Analysis</span>
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
          </div>

          <div className="flex gap-2">
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Take quantum snapshot"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions overlay */}
      {!isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">
              Quantum Audio Visualizer
            </h2>
            <p className="text-gray-300 mb-2">
              Experience your music through quantum resonance field analysis in an alternative timeline where FFT was never discovered.
            </p>
            <p className="text-purple-300 text-sm mb-6">
              Using quantum entanglement, field coherence, and resonance cascades for audio visualization.
            </p>
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg px-6 py-3 font-semibold transition-all transform hover:scale-105"
            >
              Begin Quantum Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumSpectrogramV2;