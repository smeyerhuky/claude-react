import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Play, Square, Download, Settings, Camera, Video, 
  Upload, Maximize2, Minimize2,
  Music, Waves, Box, Grid3x3, Zap
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
  // Optimized default settings for each visualization mode
  const defaultSettings = useMemo(() => ({
    // Universal audio settings (good for all modes)
    sensitivity: 1.2,
    fftSize: 2048,
    smoothing: 0.75,
    
    // Blob/3D mode optimized settings
    spectrogram3d: {
      blobCount: 3,
      blobVariants: ['pulsing', 'ripple', 'spiral'],
      blobDanceMode: 'orbit',
      blobInteraction: true,
      blobSize: 1.0,
      blobTension: 0.5,
      particleCount: 1500,
      trailLength: 0.85,
      blobElasticity: 0.7,
      internalForces: 8,
      ferroFluidMode: true
    },
    
    // String theory optimized settings
    stringTheory: {
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
    
    // Mel-spectrogram optimized settings
    melSpectrogram: {
      melBins: 128,
      minFreq: 20,
      maxFreq: 16000,
      trailLength: 0.95,
      sensitivity: 1.0
    },
    
    // Standard spectrogram optimized settings
    spectrogram: {
      trailLength: 0.88,
      sensitivity: 1.3
    },
    
    // Waveform optimized settings
    waveform: {
      trailLength: 0.8,
      sensitivity: 1.5
    }
  }), []);

  const [settings, setSettings] = useState({
    // Universal settings
    sensitivity: defaultSettings.sensitivity,
    fftSize: defaultSettings.fftSize,
    smoothing: defaultSettings.smoothing,
    melBins: defaultSettings.melSpectrogram.melBins,
    minFreq: defaultSettings.melSpectrogram.minFreq,
    maxFreq: defaultSettings.melSpectrogram.maxFreq,
    trailLength: defaultSettings.spectrogram3d.trailLength,
    
    // Blob settings
    blobCount: defaultSettings.spectrogram3d.blobCount,
    blobVariants: defaultSettings.spectrogram3d.blobVariants,
    blobDanceMode: defaultSettings.spectrogram3d.blobDanceMode,
    blobInteraction: defaultSettings.spectrogram3d.blobInteraction,
    blobSize: defaultSettings.spectrogram3d.blobSize,
    blobTension: defaultSettings.spectrogram3d.blobTension,
    blobElasticity: defaultSettings.spectrogram3d.blobElasticity,
    internalForces: defaultSettings.spectrogram3d.internalForces,
    ferroFluidMode: defaultSettings.spectrogram3d.ferroFluidMode,
    
    // String settings
    stringCount: defaultSettings.stringTheory.stringCount,
    stringTension: defaultSettings.stringTheory.stringTension,
    stringDamping: defaultSettings.stringTheory.stringDamping,
    stringThickness: defaultSettings.stringTheory.stringThickness,
    stringSegments: defaultSettings.stringTheory.stringSegments,
    stringLayout: defaultSettings.stringTheory.stringLayout,
    bassPosition: defaultSettings.stringTheory.bassPosition,
    enableParticles: defaultSettings.stringTheory.enableParticles,
    particleCount: defaultSettings.spectrogram3d.particleCount,
    
    // Legacy settings for backward compatibility
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
  const blobsRef = useRef([]); // Array to store multiple blobs
  const particlesRef = useRef(null);
  const melSpectrogramRef = useRef([]);
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
        // Keep universal audio settings
        sensitivity: modeDefaults.sensitivity || defaultSettings.sensitivity,
        fftSize: prev.fftSize, // Keep user's FFT preference
        smoothing: prev.smoothing // Keep user's smoothing preference
      }));
    }
  }, [defaultSettings]);

  // Reset all settings to optimal defaults
  const resetToDefaults = useCallback(() => {
    if (window.confirm('Reset all settings to factory defaults? This will override all your custom configurations.')) {
      setSettings({
        // Universal settings
        sensitivity: defaultSettings.sensitivity,
        fftSize: defaultSettings.fftSize,
        smoothing: defaultSettings.smoothing,
        melBins: defaultSettings.melSpectrogram.melBins,
        minFreq: defaultSettings.melSpectrogram.minFreq,
        maxFreq: defaultSettings.melSpectrogram.maxFreq,
        trailLength: defaultSettings.spectrogram3d.trailLength,
        
        // Blob settings
        blobCount: defaultSettings.spectrogram3d.blobCount,
        blobVariants: defaultSettings.spectrogram3d.blobVariants,
        blobDanceMode: defaultSettings.spectrogram3d.blobDanceMode,
        blobInteraction: defaultSettings.spectrogram3d.blobInteraction,
        blobSize: defaultSettings.spectrogram3d.blobSize,
        blobTension: defaultSettings.spectrogram3d.blobTension,
        blobElasticity: defaultSettings.spectrogram3d.blobElasticity,
        internalForces: defaultSettings.spectrogram3d.internalForces,
        ferroFluidMode: defaultSettings.spectrogram3d.ferroFluidMode,
        
        // String settings
        stringCount: defaultSettings.stringTheory.stringCount,
        stringTension: defaultSettings.stringTheory.stringTension,
        stringDamping: defaultSettings.stringTheory.stringDamping,
        stringThickness: defaultSettings.stringTheory.stringThickness,
        stringSegments: defaultSettings.stringTheory.stringSegments,
        stringLayout: defaultSettings.stringTheory.stringLayout,
        bassPosition: defaultSettings.stringTheory.bassPosition,
        enableParticles: defaultSettings.stringTheory.enableParticles,
        particleCount: defaultSettings.spectrogram3d.particleCount,
        
        // Legacy settings for backward compatibility
        bloomStrength: 1.5,
        windowFunction: 'hann'
      });
    }
  }, [defaultSettings]);
  
  // Color schemes - memoized to prevent dependency changes
  const colorSchemes = useMemo(() => ({
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
  }), []);

  // String physics simulation class
  class StringPhysics {
    constructor(segments, tension, damping, frequency = 82.41) {
      this.segments = segments;
      this.tension = tension;
      this.damping = damping;
      this.frequency = frequency; // Musical frequency for this string
      this.points = [];
      this.velocities = [];
      this.forces = [];
      this.isActive = false;
      this.lastPlucked = 0;
      this.sustainedEnergy = 0; // Track sustained energy for thickness
      this.particles = []; // Particle trail system
      
      // Initialize string points
      for (let i = 0; i <= segments; i++) {
        this.points.push({ x: 0, y: 0, baseY: 0 });
        this.velocities.push({ x: 0, y: 0 });
        this.forces.push({ x: 0, y: 0 });
      }
    }

    setEndpoints(x1, y1, x2, y2) {
      for (let i = 0; i <= this.segments; i++) {
        const t = i / this.segments;
        this.points[i].x = x1 + (x2 - x1) * t;
        this.points[i].y = y1 + (y2 - y1) * t;
        this.points[i].baseY = y1 + (y2 - y1) * t; // Store original Y position
      }
    }

    applyForce(segmentIndex, forceX, forceY) {
      if (segmentIndex >= 0 && segmentIndex < this.forces.length) {
        this.forces[segmentIndex].x += forceX;
        this.forces[segmentIndex].y += forceY;
      }
    }

    pluck(position, strength) {
      const segmentIndex = Math.floor(position * this.segments);
      const displacement = strength * 10;
      const direction = Math.random() > 0.5 ? 1 : -1;
      
      // Apply displacement to nearby points with falloff
      const halfWidth = Math.floor(this.segments / 8);
      for (let i = Math.max(1, segmentIndex - halfWidth); 
           i <= Math.min(this.segments - 1, segmentIndex + halfWidth); 
           i++) {
        const distanceFactor = 1 - (Math.abs(i - segmentIndex) / halfWidth);
        const pointDisplacement = displacement * distanceFactor;
        this.points[i].y = this.points[i].baseY + (direction * pointDisplacement);
        this.velocities[i].y = -direction * (strength * distanceFactor * 2);
      }
    }

    update() {
      // Calculate spring forces between adjacent points
      for (let i = 0; i < this.points.length; i++) {
        let force = 0;
        
        // Force from left neighbor
        if (i > 0) {
          force += (this.points[i-1].y - this.points[i].y) * this.tension;
        }
        
        // Force from right neighbor
        if (i < this.points.length - 1) {
          force += (this.points[i+1].y - this.points[i].y) * this.tension;
        }
        
        // Add force towards rest position
        force += (this.points[i].baseY - this.points[i].y) * (this.tension * 0.1);
        
        // Store force
        this.forces[i].y = force;
      }

      // Update velocities and positions (except endpoints)
      for (let i = 1; i < this.points.length - 1; i++) {
        // Update velocity with damping
        this.velocities[i].y = this.velocities[i].y * this.damping + this.forces[i].y;
        
        // Update position
        this.points[i].y += this.velocities[i].y;
        
        // Clear forces
        this.forces[i].y = 0;
      }

      // Check if string is active (has movement)
      let isActive = false;
      for (let i = 1; i < this.points.length - 1; i++) {
        if (Math.abs(this.velocities[i].y) > 0.05) {
          isActive = true;
          break;
        }
      }
      this.isActive = isActive;

      // Keep endpoints fixed (they don't move)
      // First and last points remain at their original positions
    }

    getPoints() {
      return this.points;
    }
  }

  // Guitar string frequencies (low to high)
  const guitarFrequencies = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]; // E-A-D-G-B-E
  
  // Frequency-based colors
  const getStringColor = (stringIndex) => {
    const frequencyColors = {
      0: [255, 68, 68],   // Red for bass (E)
      1: [255, 136, 68],  // Orange for low-mid (A)
      2: [255, 221, 68],  // Yellow for mid (D)
      3: [68, 255, 136],  // Green for high-mid (G)
      4: [68, 136, 255],  // Blue for treble (B)
      5: [136, 68, 255]   // Purple for high treble (E)
    };
    return frequencyColors[stringIndex] || [255, 255, 255];
  };

  // Initialize string physics systems
  const initializeStrings = useCallback((stringCount, segments, tension, damping) => {
    const strings = [];
    for (let i = 0; i < stringCount; i++) {
      const frequency = guitarFrequencies[i] || guitarFrequencies[guitarFrequencies.length - 1];
      strings.push(new StringPhysics(segments, tension, damping, frequency));
    }
    stringsRef.current = strings;
    stringPhysicsRef.current = { StringPhysics };
  }, [guitarFrequencies]);

  // Initialize mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create 3D spheroid blob materials with internal force fields (ferro-fluid like)
  const createSpheroidBlobMaterial = useCallback((variant, blobIndex) => {
    const shaders = {
      ferroFluid: {
        vertex: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform float blobIndex;
          uniform vec3 internalForces[8]; // Multiple internal force points
          uniform float elasticity;
          uniform float jitterAmount;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDistortion;
          
          // Noise function for jitter
          float noise(vec3 p) {
            return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
          }
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            
            vec3 newPosition = position;
            float totalForce = 0.0;
            
            // Apply internal forces from multiple points (like internal magnetic fields)
            for(int i = 0; i < 8; i++) {
              vec3 forcePoint = internalForces[i];
              float distance = length(position - forcePoint);
              
              // Different frequency bands affect different force points
              float forceStrength = 0.0;
              if(i < 3) {
                forceStrength = bassLevel * (2.0 + sin(time + float(i)));
              } else if(i < 6) {
                forceStrength = midLevel * (1.5 + cos(time * 1.3 + float(i)));
              } else {
                forceStrength = highLevel * (1.0 + sin(time * 2.0 + float(i)));
              }
              
              // Inverse square law for realistic force falloff
              float forceMagnitude = forceStrength / (distance * distance + 0.1);
              
              // Direction from force point to surface (outward push)
              vec3 forceDirection = normalize(position - forcePoint);
              
              // Apply force with distance attenuation
              newPosition += forceDirection * forceMagnitude * elasticity;
              totalForce += forceMagnitude;
            }
            
            // Add elastic jitter for organic feel
            float jitter = noise(position * 10.0 + time) * jitterAmount;
            newPosition += normal * jitter * (0.5 + 0.5 * sin(time * 3.0 + blobIndex));
            
            // Add breathing motion
            float breathing = sin(time * 1.5 + blobIndex) * 0.3;
            newPosition += normal * breathing;
            
            // Surface tension effects - pull vertices toward sphere when calm
            float tension = 1.0 - totalForce * 0.5;
            newPosition = mix(newPosition, normalize(position) * length(position), tension * 0.2);
            
            vPosition = newPosition;
            vDistortion = totalForce;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragment: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform vec3 colorScheme;
          uniform float blobIndex;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDistortion;
          
          void main() {
            // Dynamic color based on internal forces
            vec3 baseColor = colorScheme;
            
            // Color shifts based on distortion (ferro-fluid effect)
            vec3 distortionColor = vec3(
              0.8 + 0.4 * sin(time + vDistortion * 5.0),
              0.6 + 0.4 * cos(time * 1.2 + vDistortion * 3.0),
              0.9 + 0.3 * sin(time * 0.8 + vDistortion * 7.0)
            );
            
            // Mix colors based on audio levels
            vec3 finalColor = mix(baseColor, distortionColor, vDistortion * 0.7);
            
            // Add internal glow effect
            float glow = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
            finalColor += vec3(bassLevel, midLevel, highLevel) * glow * 0.3;
            
            // Fresnel-like effect for translucency
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            float alpha = 0.6 + fresnel * 0.4 + vDistortion * 0.2;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `
      },
      elasticBubble: {
        vertex: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform float blobIndex;
          uniform vec3 internalForces[8];
          uniform float elasticity;
          uniform float jitterAmount;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDistortion;
          
          float noise(vec3 p) {
            return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
          }
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec3 newPosition = position;
            
            // Bubble-like internal pressure
            float internalPressure = (bassLevel + midLevel + highLevel) * 0.5;
            
            // Multiple pressure points creating organic bulges
            float totalDistortion = 0.0;
            for(int i = 0; i < 8; i++) {
              vec3 pressurePoint = internalForces[i];
              float distance = length(position - pressurePoint);
              
              float pressure = 0.0;
              if(i < 4) {
                pressure = bassLevel * sin(time * 2.0 + float(i) + blobIndex);
              } else {
                pressure = (midLevel + highLevel) * cos(time * 1.5 + float(i) * 2.0);
              }
              
              // Bubble expansion from internal points
              float expansion = pressure / (distance + 0.5);
              vec3 expansionDir = normalize(position - pressurePoint);
              
              newPosition += expansionDir * expansion * elasticity;
              totalDistortion += abs(expansion);
            }
            
            // Elastic surface oscillations
            float elasticWave = sin(time * 4.0 + length(position) * 3.0 + blobIndex) * 0.2;
            newPosition += normal * elasticWave * elasticity;
            
            // Surface jitter
            float surfaceJitter = noise(position * 8.0 + time * 2.0) * jitterAmount;
            newPosition += normal * surfaceJitter;
            
            vPosition = newPosition;
            vDistortion = totalDistortion;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragment: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform vec3 colorScheme;
          uniform float blobIndex;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDistortion;
          
          void main() {
            vec3 baseColor = colorScheme;
            
            // Iridescent bubble effect
            float iridescence = sin(time + vDistortion * 10.0 + dot(vNormal, vec3(1.0, 0.5, 0.3))) * 0.5 + 0.5;
            vec3 bubbleColor = vec3(
              0.7 + 0.3 * iridescence,
              0.8 + 0.2 * sin(iridescence * 3.14159),
              0.9 + 0.1 * cos(iridescence * 6.28318)
            );
            
            vec3 finalColor = mix(baseColor, bubbleColor, 0.6);
            
            // Transparency with bubble-like qualities
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);
            float alpha = 0.4 + fresnel * 0.5 + vDistortion * 0.1;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `
      },
      morphicBlob: {
        vertex: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform float blobIndex;
          uniform vec3 internalForces[8];
          uniform float elasticity;
          uniform float jitterAmount;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDistortion;
          
          float noise(vec3 p) {
            return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
          }
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec3 newPosition = position;
            
            // Morphic transformation based on audio
            float morphFactor = (bassLevel * 2.0 + midLevel + highLevel * 0.5) / 3.5;
            
            // Multiple deformation centers
            float totalMorph = 0.0;
            for(int i = 0; i < 8; i++) {
              vec3 morphCenter = internalForces[i];
              float distance = length(position - morphCenter);
              
              float morphStrength = 0.0;
              if(i % 3 == 0) {
                morphStrength = bassLevel * sin(time + float(i));
              } else if(i % 3 == 1) {
                morphStrength = midLevel * cos(time * 1.3 + float(i) * 2.0);
              } else {
                morphStrength = highLevel * sin(time * 2.0 + float(i) * 0.5);
              }
              
              // Organic morphing effect
              float morphInfluence = morphStrength * exp(-distance * 2.0);
              vec3 morphDirection = normalize(position - morphCenter);
              
              newPosition += morphDirection * morphInfluence * elasticity;
              totalMorph += abs(morphInfluence);
            }
            
            // Chaotic jitter for organic feel
            vec3 chaosOffset = vec3(
              noise(position + time) - 0.5,
              noise(position.yzx + time * 1.1) - 0.5,
              noise(position.zxy + time * 0.9) - 0.5
            ) * jitterAmount * (1.0 + morphFactor);
            
            newPosition += chaosOffset;
            
            vPosition = newPosition;
            vDistortion = totalMorph;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragment: `
          uniform float time;
          uniform float bassLevel;
          uniform float midLevel;
          uniform float highLevel;
          uniform vec3 colorScheme;
          uniform float blobIndex;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDistortion;
          
          void main() {
            vec3 baseColor = colorScheme;
            
            // Morphic color shifting
            vec3 morphColor = vec3(
              0.5 + 0.5 * sin(time + vDistortion * 8.0),
              0.6 + 0.4 * cos(time * 1.2 + vDistortion * 6.0),
              0.7 + 0.3 * sin(time * 1.5 + vDistortion * 4.0)
            );
            
            vec3 finalColor = mix(baseColor, morphColor, vDistortion * 0.8);
            
            // Dynamic transparency
            float alpha = 0.5 + vDistortion * 0.3 + abs(sin(time + blobIndex)) * 0.2;
            alpha = clamp(alpha, 0.3, 0.9);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `
      }
    };
    
    const shaderType = variant === 'pulsing' ? 'ferroFluid' : 
                      variant === 'ripple' ? 'elasticBubble' : 'morphicBlob';
    const shader = shaders[shaderType];
    
    // Generate random internal force points
    const internalForces = [];
    for(let i = 0; i < 8; i++) {
      internalForces.push(new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      ));
    }
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bassLevel: { value: 0 },
        midLevel: { value: 0 },
        highLevel: { value: 0 },
        colorScheme: { value: new THREE.Vector3(1, 0, 0.5) },
        blobIndex: { value: blobIndex },
        internalForces: { value: internalForces },
        elasticity: { value: 0.5 + Math.random() * 0.5 }, // Varying elasticity per blob
        jitterAmount: { value: 0.1 + Math.random() * 0.1 }
      },
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);

  // Create multiple 3D spheroid dancing blobs
  const createDancingBlobs = useCallback((scene) => {
    // Clear existing blobs
    blobsRef.current.forEach(blob => {
      scene.remove(blob.mesh);
      blob.material.dispose();
      blob.geometry.dispose();
    });
    blobsRef.current = [];
    
    const currentSettings = settingsRef.current;
    const blobCount = currentSettings.blobCount;
    const variants = currentSettings.blobVariants;
    
    for (let i = 0; i < blobCount; i++) {
      const variant = variants[i % variants.length];
      
      // Create 3D spheroid geometry with high detail for smooth deformation
      const radius = 3 * currentSettings.blobSize * (0.8 + Math.random() * 0.4); // Varying sizes
      const geometry = new THREE.SphereGeometry(
        radius,
        64, // High subdivision for smooth deformation
        32
      );
      
      const material = createSpheroidBlobMaterial(variant, i);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position blobs in 3D space with varying depths
      const angle = (i / blobCount) * Math.PI * 2;
      const radiusPos = 8 + Math.random() * 5;
      const height = (Math.random() - 0.5) * 6;
      const depth = (Math.random() - 0.5) * 8;
      
      mesh.position.set(
        Math.cos(angle) * radiusPos,
        height,
        Math.sin(angle) * radiusPos * 0.7 + depth
      );
      
      // Random initial rotation
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Store blob data with enhanced 3D properties
      const blobData = {
        mesh,
        material,
        geometry,
        variant,
        index: i,
        basePosition: { 
          x: mesh.position.x, 
          y: mesh.position.y, 
          z: mesh.position.z 
        },
        baseRotation: {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z
        },
        dancePhase: Math.random() * Math.PI * 2,
        danceSpeed: 0.3 + Math.random() * 0.7,
        danceRadius: 3 + Math.random() * 4,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        depthOscillation: {
          amplitude: 5 + Math.random() * 5,
          frequency: 0.5 + Math.random() * 1.0,
          phase: Math.random() * Math.PI * 2
        },
        size: radius,
        elasticity: 0.5 + Math.random() * 0.5
      };
      
      blobsRef.current.push(blobData);
      scene.add(mesh);
    }
    
    // Keep reference to first blob for backward compatibility
    if (blobsRef.current.length > 0) {
      blobMeshRef.current = blobsRef.current[0].mesh;
    }
  }, [createSpheroidBlobMaterial]);

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
    
    // Clean up blob references
    blobsRef.current = [];
    blobMeshRef.current = null;
    particlesRef.current = null;
    cameraRef.current = null;
  }, []);

  // Initialize 3D scene
  const init3DScene = useCallback(() => {
    if (!containerRef.current || rendererRef.current) return;

    try {
      // Clean up any existing scene first
      cleanup3DScene();
      
      // Scene setup
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000000, 1, 100);
      sceneRef.current = scene;

      // Camera - calculate aspect ratio based on the padded visualization area dimensions
      const visualizationArea = containerRef.current.querySelector('div');
      const aspectRatio = visualizationArea ? 
        visualizationArea.clientWidth / visualizationArea.clientHeight :
        (containerRef.current.clientWidth - 32) / (containerRef.current.clientHeight - 256); // 32px = left/right padding, 256px = top/bottom safe zones
      
      const camera = new THREE.PerspectiveCamera(
        75,
        aspectRatio,
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
      
      // Set renderer size to match the padded visualization area
      const visualWidth = containerRef.current.clientWidth - 32; // 32px = left/right padding
      const visualHeight = containerRef.current.clientHeight - 256; // 256px = top/bottom safe zones
      renderer.setSize(visualWidth, visualHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;
      
      // Append to the visualization container, not the main container
      const visualizationContainer = containerRef.current.querySelector('div');
      if (visualizationContainer) {
        visualizationContainer.appendChild(renderer.domElement);
      } else {
        containerRef.current.appendChild(renderer.domElement);
      }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create multiple dancing blobs
    createDancingBlobs(scene);

    // Particle system will be initialized after createParticleSystem is defined

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const visualWidth = containerRef.current.clientWidth - 32; // 32px = left/right padding
      const visualHeight = containerRef.current.clientHeight - 256; // 256px = top/bottom safe zones
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
      // Fallback to 2D mode if 3D fails
      setVisualMode('stringTheory');
    }
  }, [cleanup3DScene]);

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
  
  // Initialize particle system when 3D scene is ready
  useEffect(() => {
    if (sceneRef.current && settingsRef.current.particleCount) {
      createParticleSystem(settingsRef.current.particleCount);
    }
  }, [createParticleSystem]);


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
      
      // Create AudioContext and ensure it's resumed after user gesture
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume AudioContext if it's suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
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

  // Update multiple 3D spheroid dancing blobs with internal force fields
  const updateDancingBlobs = useCallback((audioData, bassAvg, midAvg, highAvg) => {
    if (blobsRef.current.length === 0) return;
    
    const currentSettings = settingsRef.current;
    const colors = colorSchemes[colorSchemeRef.current];
    const time = performance.now() * 0.001;
    
    blobsRef.current.forEach((blob, index) => {
      if (!blob.material.uniforms) return;
      
      const uniforms = blob.material.uniforms;
      
      // Update time for animation
      uniforms.time.value = time;
      
      // Update audio levels with variations per blob type
      const bassVariation = 1 + Math.sin(time * 0.7 + index * 2.1) * 0.3;
      const midVariation = 1 + Math.cos(time * 1.1 + index * 1.7) * 0.3;
      const highVariation = 1 + Math.sin(time * 1.5 + index * 0.9) * 0.3;
      
      // Enhanced audio responsiveness
      uniforms.bassLevel.value = Math.min(bassAvg * bassVariation * 1.2, 2.0);
      uniforms.midLevel.value = Math.min(midAvg * midVariation * 1.1, 2.0);
      uniforms.highLevel.value = Math.min(highAvg * highVariation * 1.0, 2.0);
      
      // Update color scheme
      uniforms.colorScheme.value.set(
        colors.accent === '#ff0080' ? 1 : colors.bass[0] / 255,
        colors.accent === '#ff0080' ? 0 : colors.bass[1] / 255,
        colors.accent === '#ff0080' ? 0.5 : colors.bass[2] / 255
      );
      
      // Update internal force fields dynamically
      if (uniforms.internalForces) {
        uniforms.internalForces.value.forEach((force, i) => {
          // Animate internal force points based on audio
          const forceTime = time * (0.5 + i * 0.1);
          const audioInfluence = (bassAvg + midAvg + highAvg) / 3;
          
          force.x += Math.sin(forceTime * 2 + i) * audioInfluence * 0.02;
          force.y += Math.cos(forceTime * 1.5 + i * 2) * audioInfluence * 0.02;
          force.z += Math.sin(forceTime * 1.8 + i * 1.3) * audioInfluence * 0.02;
          
          // Keep forces within reasonable bounds
          force.clampLength(0, 2.0);
        });
      }
      
      // Advanced 3D choreography
      const danceMode = currentSettings.blobDanceMode;
      blob.dancePhase += blob.danceSpeed * 0.015;
      
      // Enhanced 3D movement patterns
      switch (danceMode) {
        case 'orbit':
          // Complex orbital patterns with depth changes
          const orbitRadius = blob.danceRadius + bassAvg * 4;
          const orbitAngle = blob.dancePhase + index * (Math.PI * 2 / blobsRef.current.length);
          const heightOscillation = Math.sin(time * blob.depthOscillation.frequency + blob.depthOscillation.phase);
          
          blob.mesh.position.x = Math.cos(orbitAngle) * orbitRadius;
          blob.mesh.position.z = Math.sin(orbitAngle) * orbitRadius * 0.7;
          blob.mesh.position.y = blob.basePosition.y + heightOscillation * blob.depthOscillation.amplitude + midAvg * 3;
          break;
          
        case 'follow':
          // 3D follow-the-leader with spiral movement
          if (index === 0) {
            const spiralRadius = 5 + bassAvg * 3;
            blob.mesh.position.x = Math.cos(blob.dancePhase) * spiralRadius;
            blob.mesh.position.z = Math.sin(blob.dancePhase * 0.8) * spiralRadius;
            blob.mesh.position.y = Math.sin(blob.dancePhase * 0.6) * 4 + highAvg * 2;
          } else {
            // Follow with 3D offset and lag
            const leader = blobsRef.current[index - 1];
            const followDelay = 0.3 + index * 0.1;
            const offset = index * 2;
            
            blob.mesh.position.x = leader.mesh.position.x + Math.cos(blob.dancePhase - followDelay) * offset;
            blob.mesh.position.z = leader.mesh.position.z + Math.sin(blob.dancePhase - followDelay) * offset;
            blob.mesh.position.y = leader.mesh.position.y + Math.sin(blob.dancePhase * 2 - followDelay) * 2;
          }
          break;
          
        case 'scatter':
          // Chaotic 3D movement with audio-reactive bounds
          const scatterIntensity = (bassAvg + midAvg + highAvg) / 3;
          blob.mesh.position.x = blob.basePosition.x + Math.cos(blob.dancePhase) * (blob.danceRadius + scatterIntensity * 4);
          blob.mesh.position.z = blob.basePosition.z + Math.sin(blob.dancePhase * 1.4) * (blob.danceRadius + scatterIntensity * 4);
          blob.mesh.position.y = blob.basePosition.y + Math.sin(blob.dancePhase * 0.9) * (3 + scatterIntensity * 3);
          break;
          
        case 'sync':
          // Synchronized 3D formations
          const syncPhase = time * 0.8 + index * 0.15;
          const formationRadius = 6 + (bassAvg + midAvg + highAvg) * 2;
          
          blob.mesh.position.x = Math.cos(syncPhase) * formationRadius;
          blob.mesh.position.z = Math.sin(syncPhase * 0.7) * formationRadius;
          blob.mesh.position.y = Math.sin(syncPhase * 1.2) * 3 + index * 1.5;
          break;
      }
      
      // Full 3D rotation with audio responsiveness
      blob.mesh.rotation.x += blob.rotationSpeed.x * (1 + bassAvg);
      blob.mesh.rotation.y += blob.rotationSpeed.y * (1 + midAvg);
      blob.mesh.rotation.z += blob.rotationSpeed.z * (1 + highAvg);
      
      // Enhanced blob interaction with 3D forces
      if (currentSettings.blobInteraction && blobsRef.current.length > 1) {
        blobsRef.current.forEach((otherBlob, otherIndex) => {
          if (index !== otherIndex) {
            const distance = blob.mesh.position.distanceTo(otherBlob.mesh.position);
            const audioForce = (bassAvg + midAvg + highAvg) * 0.15;
            
            if (distance < 12 && distance > 0.1) {
              // Complex 3D interaction forces
              const direction = blob.mesh.position.clone().sub(otherBlob.mesh.position).normalize();
              
              // Repulsion force
              if (distance < 8) {
                blob.mesh.position.add(direction.multiplyScalar(audioForce * 0.8));
              }
              
              // Orbital attraction at medium distance
              if (distance > 6 && distance < 10) {
                const tangent = new THREE.Vector3(-direction.z, 0, direction.x);
                blob.mesh.position.add(tangent.multiplyScalar(audioForce * 0.3));
              }
            }
          }
        });
      }
      
      // Dynamic scaling based on internal forces
      const totalAudio = bassAvg + midAvg + highAvg;
      const scaleVariation = 1 + totalAudio * 0.2 + Math.sin(time * 2 + index) * 0.1;
      blob.mesh.scale.setScalar(scaleVariation);
    });
  }, [colorSchemes]);

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
    
    // Apply very controlled beat-based string plucking (EDM bass-friendly)
    if (beat && visualModeRef.current === 'stringTheory' && stringsRef.current.length > 0) {
      const beatIntensity = (bassAvg + midAvg + highAvg) / 3;
      
      // Only respond to significant beats to avoid EDM bass overload
      if (beatIntensity > 0.5) {
        // Select only 2-3 strings for each beat to reduce chaos
        const activeStrings = Math.floor(Math.random() * 2) + 2; // 2-3 strings
        const stringIndices = Array.from({length: stringsRef.current.length}, (_, i) => i)
          .sort(() => Math.random() - 0.5)
          .slice(0, activeStrings);
        
        stringIndices.forEach((stringIndex, i) => {
          const string = stringsRef.current[stringIndex];
          if (string) {
            setTimeout(() => {
              const pluckPosition = 0.35 + Math.random() * 0.3;
              const pluckStrength = beatIntensity * (8 + Math.random() * 6); // Much gentler
              string.pluck(pluckPosition, pluckStrength);
            }, i * 50); // Slower stagger
          }
        });
      }
    }
    
    // Update mel-spectrogram
    const melData = calculateMelSpectrogram(dataArray);
    melSpectrogramRef.current.push(melData);
    if (melSpectrogramRef.current.length > 100) {
      melSpectrogramRef.current.shift();
    }
    
    // Update visualizations based on current mode
    if (visualModeRef.current === 'spectrogram3d' && sceneRef.current) {
      updateDancingBlobs(dataArray, bassAvg, midAvg, highAvg);
      
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
  }, [calculateMelSpectrogram, updateDancingBlobs]);

  // Particle system for string trails
  const updateStringParticles = (string, stringIndex) => {
    const currentSettings = settingsRef.current;
    if (!currentSettings.enableParticles) return;
    
    // Add new particles at active vibration points
    for (let i = 1; i < string.points.length - 1; i++) {
      const velocity = Math.abs(string.velocities[i].y);
      if (velocity > 0.1 && Math.random() > 0.7) {
        string.particles.push({
          x: string.points[i].x,
          y: string.points[i].y,
          vx: (Math.random() - 0.5) * 2,
          vy: string.velocities[i].y * 0.5,
          life: 1.0,
          maxLife: 60 + Math.random() * 40,
          size: 1 + velocity * 2,
          color: getStringColor(stringIndex, settingsRef.current.stringCount)
        });
      }
    }
    
    // Update existing particles
    string.particles = string.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life -= 1;
      return particle.life > 0;
    });
    
    // Limit particle count
    if (string.particles.length > currentSettings.particleCount) {
      string.particles = string.particles.slice(-currentSettings.particleCount);
    }
  };

  // Calculate string layout positions
  const getStringLayout = (stringIndex, stringCount, width, height, layout, bassPosition) => {
    const margin = width * 0.1;
    let stringY, startX, endX;
    
    switch (layout) {
      case 'vertical': {
        stringY = height * 0.2 + stringIndex * (height * 0.6 / (stringCount - 1));
        startX = width * 0.2;
        endX = width * 0.8;
        break;
      }
      case 'centered': {
        const centerY = height / 2;
        const spread = height * 0.3;
        stringY = centerY + (stringIndex - (stringCount - 1) / 2) * (spread / (stringCount - 1));
        startX = margin;
        endX = width - margin;
        break;
      }
      case 'mirrored': {
        if (bassPosition === 'center') {
          const centerY = height / 2;
          const spread = height * 0.4;
          stringY = centerY + (stringIndex - (stringCount - 1) / 2) * (spread / (stringCount - 1));
        } else {
          const reverseIndex = bassPosition === 'bottom' ? (stringCount - 1 - stringIndex) : stringIndex;
          stringY = (height / (stringCount + 1)) * (reverseIndex + 1);
        }
        startX = margin;
        endX = width - margin;
        break;
      }
      default: { // horizontal
        if (bassPosition === 'bottom') {
          stringY = (height / (stringCount + 1)) * (stringCount - stringIndex);
        } else {
          stringY = (height / (stringCount + 1)) * (stringIndex + 1);
        }
        startX = margin;
        endX = width - margin;
      }
    }
    
    return { stringY, startX, endX };
  };

  // Draw vibrating strings
  const drawStrings = useCallback((ctx, width, height, frequencyData) => {
    // Width and height are already scaled from the calling function
    const currentSettings = settingsRef.current;
    const stringCount = currentSettings.stringCount;
    
    if (stringsRef.current.length !== stringCount) {
      initializeStrings(stringCount, currentSettings.stringSegments, currentSettings.stringTension, currentSettings.stringDamping);
    }
    
    // Draw reactive background areas where interaction occurs
    const colors = colorSchemes[colorSchemeRef.current];
    
    // Create audio reactive background pulses
    const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length / 255;
    if (totalEnergy > 0.1) {
      const pulseCount = Math.floor(totalEnergy * 5) + 1;
      for (let p = 0; p < pulseCount; p++) {
        const centerX = width * (0.2 + Math.random() * 0.6);
        const centerY = height * (0.2 + Math.random() * 0.6);
        const radius = totalEnergy * 100 * (1 + Math.random());
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(${colors.accent === '#ff0080' ? '255,0,128' : colors.bass.join(',')}, ${totalEnergy * 0.3})`);
        gradient.addColorStop(0.5, `rgba(${colors.mid.join(',')}, ${totalEnergy * 0.15})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Divide frequency data into bands for each string
    const bandsPerString = Math.floor(frequencyData.length / stringCount);
    
    for (let stringIndex = 0; stringIndex < stringCount; stringIndex++) {
      const string = stringsRef.current[stringIndex];
      if (!string) continue;
      
      // Calculate string layout position
      const { stringY, startX, endX } = getStringLayout(
        stringIndex, stringCount, width, height, 
        currentSettings.stringLayout, currentSettings.bassPosition
      );
      
      // Set string endpoints
      string.setEndpoints(startX, stringY, endX, stringY);
      
      // Calculate frequency band energy for this string with enhanced sensitivity
      const startBand = stringIndex * bandsPerString;
      const endBand = Math.min((stringIndex + 1) * bandsPerString, frequencyData.length);
      let bandEnergy = 0;
      let peakEnergy = 0;
      
      for (let i = startBand; i < endBand; i++) {
        bandEnergy += frequencyData[i];
        peakEnergy = Math.max(peakEnergy, frequencyData[i]);
      }
      
      // Use balanced energy calculation optimized for EDM
      const avgEnergy = (bandEnergy / (endBand - startBand)) / 255;
      const normalizedPeak = peakEnergy / 255;
      bandEnergy = Math.max(avgEnergy, normalizedPeak * 0.3) * currentSettings.sensitivity * 0.8;
      
      // Update sustained energy for dynamic thickness (smooth decay)
      string.sustainedEnergy = string.sustainedEnergy * 0.95 + bandEnergy * 0.05;
      
      // Apply gentle plucks based on frequency analysis (EDM-friendly)
      if (bandEnergy > 0.4) { // Much higher threshold for EDM
        const numPlucks = Math.min(Math.floor(bandEnergy * 2), 2); // Max 2 plucks, less frequent
        for (let i = 0; i < numPlucks; i++) {
          const position = 0.35 + Math.random() * 0.3; // Smaller pluck area
          const pluckStrength = bandEnergy * (0.4 + Math.random() * 0.2) * 8; // Much gentler
          string.pluck(position, pluckStrength);
        }
      }
      
      // Very subtle continuous vibration only for high energy
      if (bandEnergy > 0.6) { // Only for very high energy
        const vibrateStrength = bandEnergy * 3; // Much reduced
        for (let i = 1; i < string.points.length - 1; i += 6) { // Even less frequent
          const randomForce = (Math.random() - 0.5) * vibrateStrength;
          string.velocities[i].y += randomForce;
        }
      }
      
      // Update string physics
      string.update();
      
      // Draw interaction areas around active string segments
      const points = string.getPoints();
      
      // Draw reactive field around string when active
      if (bandEnergy > 0.3) {
        for (let i = 1; i < points.length - 1; i += 3) {
          const segmentEnergy = Math.abs(string.velocities[i].y);
          if (segmentEnergy > 0.05) {
            const areaSize = 20 + segmentEnergy * 30;
            const areaAlpha = Math.min(segmentEnergy * 0.4, 0.2);
            
            const gradient = ctx.createRadialGradient(
              points[i].x, points[i].y, 0,
              points[i].x, points[i].y, areaSize
            );
            gradient.addColorStop(0, `rgba(${getStringColor(stringIndex, stringCount).join(',')}, ${areaAlpha})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.save();
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, areaSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      
      // Frequency-based string color
      const baseColor = getStringColor(stringIndex, stringCount);
      const intensity = Math.min(1, bandEnergy * 1.5);
      
      // Dynamic thickness: base + string index + sustained energy
      const baseThickness = currentSettings.stringThickness;
      const stringIndexThickness = (stringCount - stringIndex - 1) * 0.8; // Bass thicker
      const sustainedThickness = string.sustainedEnergy * 4; // Energy-based thickness
      const thickness = baseThickness + stringIndexThickness + sustainedThickness;
      
      // Different colors for active vs inactive strings (EDM-friendly threshold)
      const isStringActive = string.isActive || intensity > 0.35;
      ctx.strokeStyle = isStringActive 
        ? `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${0.9 + intensity * 0.1})` 
        : `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${0.6 + intensity * 0.2})`;
      ctx.lineWidth = thickness + intensity * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Add glow effect to active strings
      if (isStringActive) {
        ctx.save();
        ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.8)`;
        ctx.shadowBlur = 10 + intensity * 20;
      } else {
        ctx.shadowBlur = 0;
      }
      
      // Draw the string with dynamic morphing based on frequency bands
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      // Calculate frequency-based morphing
      const bassEnergy = bassLevel || 0;
      const midEnergy = midLevel || 0;
      const highEnergy = highLevel || 0;
      
      for (let i = 1; i < points.length; i++) {
        const segmentRatio = i / points.length;
        
        // Create control points with frequency-based morphing
        let cp1x = points[i-1].x + (points[i].x - points[i-1].x) / 3;
        let cp1y = points[i-1].y;
        let cp2x = points[i].x - (points[i].x - points[i-1].x) / 3;
        let cp2y = points[i].y;
        
        // Morph based on frequency bands
        if (segmentRatio < 0.33) {
          // Bass region - square-like segments
          const bassInfluence = bassEnergy * 5;
          cp1y += Math.sin(segmentRatio * Math.PI * 2) * bassInfluence;
          cp2y += Math.cos(segmentRatio * Math.PI * 2) * bassInfluence;
        } else if (segmentRatio < 0.66) {
          // Mid region - triangular waves
          const midInfluence = midEnergy * 3;
          const triangleWave = Math.abs((segmentRatio - 0.33) * 6 - 1) * 2 - 1;
          cp1y += triangleWave * midInfluence;
          cp2y += triangleWave * midInfluence * 0.5;
        } else {
          // High region - sharp, jagged morphing
          const highInfluence = highEnergy * 2;
          const jaggedWave = Math.sign(Math.sin(segmentRatio * Math.PI * 8)) * (segmentRatio - 0.66) * 3;
          cp1y += jaggedWave * highInfluence;
          cp2y += jaggedWave * highInfluence * 0.7;
        }
        
        // Draw morphed bezier curve
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
      }
      
      ctx.stroke();
      
      // Restore context if glow was applied
      if (isStringActive) {
        ctx.restore();
      }
      
      // Update and draw particle trails
      updateStringParticles(string, stringIndex);
      
      // Draw particle trails with different shapes
      string.particles.forEach((particle, index) => {
        const alpha = particle.life / particle.maxLife;
        const size = particle.size * alpha;
        const shapeType = index % 4; // Cycle through 4 different shapes
        
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${alpha * 0.6})`;
        ctx.strokeStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${alpha * 0.8})`;
        ctx.lineWidth = 1;
        
        switch(shapeType) {
          case 0: // Square
            ctx.fillRect(-size/2, -size/2, size, size);
            break;
          case 1: // Triangle
            ctx.beginPath();
            ctx.moveTo(0, -size/2);
            ctx.lineTo(-size/2, size/2);
            ctx.lineTo(size/2, size/2);
            ctx.closePath();
            ctx.fill();
            break;
          case 2: // Diamond
            ctx.beginPath();
            ctx.moveTo(0, -size/2);
            ctx.lineTo(size/2, 0);
            ctx.lineTo(0, size/2);
            ctx.lineTo(-size/2, 0);
            ctx.closePath();
            ctx.fill();
            break;
          case 3: // Line streak
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(size, 0);
            ctx.lineWidth = 2;
            ctx.stroke();
            break;
        }
        ctx.restore();
      });
      
      // Draw active vibration points with different shapes
      if (isStringActive) {
        for (let i = 1; i < points.length - 1; i++) {
          const velocity = Math.abs(string.velocities[i].y);
          if (velocity > 0.02) {
            const opacity = Math.min(velocity / 2, 0.9);
            const size = 2 + velocity * 3;
            
            ctx.save();
            ctx.translate(points[i].x, points[i].y);
            ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${opacity})`;
            ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.9)`;
            ctx.shadowBlur = 8 + velocity * 5;
            
            // Different vibration indicators based on string index
            const shapeType = stringIndex % 3;
            switch(shapeType) {
              case 0: // Pulsing hexagon for bass strings
                ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                  const x = Math.cos(angle) * size;
                  const y = Math.sin(angle) * size;
                  if (angle === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;
              case 1: // Rotating square for mid strings
                ctx.rotate(velocity * 10);
                ctx.fillRect(-size/2, -size/2, size, size);
                break;
              case 2: // Star burst for high strings
                ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                  const radius = (angle % (Math.PI / 2) === 0) ? size : size * 0.5;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  if (angle === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;
            }
            ctx.restore();
          }
        }
      }
      
      // Draw morphing string endpoints based on frequency content
      ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
      ctx.shadowBlur = 5;
      
      // Left endpoint - morphs based on bass
      const leftSize = 6 + (bassLevel || 0) * 4;
      const leftMorph = (bassLevel || 0) > 0.3 ? 'square' : 'circle';
      
      if (leftMorph === 'square') {
        ctx.fillRect(points[0].x - leftSize/2, points[0].y - leftSize/2, leftSize, leftSize);
      } else {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, leftSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Right endpoint - morphs based on highs
      const rightSize = 6 + (highLevel || 0) * 3;
      const rightMorph = (highLevel || 0) > 0.4 ? 'diamond' : 'circle';
      
      if (rightMorph === 'diamond') {
        ctx.save();
        ctx.translate(points[points.length - 1].x, points[points.length - 1].y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-rightSize/2, -rightSize/2, rightSize, rightSize);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(points[points.length - 1].x, points[points.length - 1].y, rightSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Draw frequency band label with musical note
      ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.7)`;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      const noteNames = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
      const freqLabel = noteNames[stringIndex] || `S${stringIndex + 1}`;
      const labelX = currentSettings.stringLayout === 'vertical' ? startX - 40 : startX - 60;
      ctx.fillText(freqLabel, labelX, stringY + 4);
      
      // Draw energy level indicator
      const indicatorWidth = 40;
      const indicatorHeight = 4;
      const indicatorX = currentSettings.stringLayout === 'vertical' ? startX - 50 : startX - 50;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(indicatorX, stringY + 10, indicatorWidth, indicatorHeight);
      ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
      ctx.fillRect(indicatorX, stringY + 10, indicatorWidth * intensity, indicatorHeight);
    }
  }, [initializeStrings]);

  // 2D visualization
  const draw2DVisualization = useCallback((frequencyData) => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Ensure proper scaling
    const scale = window.devicePixelRatio || 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    
    const scaledWidth = width / scale;
    const scaledHeight = height / scale;
    
    // Clear with trail effect
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - settingsRef.current.trailLength})`;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    
    const colors = colorSchemes[colorSchemeRef.current];
    const currentMode = visualModeRef.current;
    const currentSettings = settingsRef.current;
    
    if (currentMode === 'stringTheory') {
      // Draw vibrating strings
      drawStrings(ctx, scaledWidth, scaledHeight, frequencyData);
    } else if (currentMode === 'melSpectrogram') {
      // Draw mel-spectrogram heatmap
      const spectrogramWidth = scaledWidth / melSpectrogramRef.current.length;
      const binHeight = scaledHeight / currentSettings.melBins;
      
      melSpectrogramRef.current.forEach((column, x) => {
        column.forEach((value, y) => {
          const intensity = value / 255;
          const hue = 240 - intensity * 240; // Blue to red
          ctx.fillStyle = `hsl(${hue}, 100%, ${intensity * 50}%)`;
          ctx.fillRect(
            x * spectrogramWidth,
            scaledHeight - (y + 1) * binHeight,
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
      
      const sliceWidth = scaledWidth / frequencyData.length;
      let x = 0;
      
      for (let i = 0; i < frequencyData.length; i++) {
        const v = frequencyData[i] / 255 * currentSettings.sensitivity;
        const y = scaledHeight - (v * scaledHeight);
        
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
      const barWidth = scaledWidth / frequencyData.length * 2;
      
      for (let i = 0; i < frequencyData.length; i++) {
        const barHeight = (frequencyData[i] / 255) * scaledHeight * currentSettings.sensitivity;
        const x = i * barWidth;
        
        // Gradient based on frequency
        const gradient = ctx.createLinearGradient(0, scaledHeight - barHeight, 0, scaledHeight);
        gradient.addColorStop(0, `rgb(${colors.high.join(',')})`);
        gradient.addColorStop(0.5, `rgb(${colors.mid.join(',')})`);
        gradient.addColorStop(1, `rgb(${colors.bass.join(',')})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, scaledHeight - barHeight, barWidth - 1, barHeight);
      }
    }
    
    // Draw beat indicator
    if (beatDetected) {
      ctx.fillStyle = `rgba(${colors.bass.join(',')}, 0.3)`;
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    }
  }, [beatDetected]);

  // Handle visualization mode change
  useEffect(() => {
    if (!isRecording) return;
    
    if (visualMode === 'spectrogram3d') {
      init3DScene();
    } else {
      cleanup3DScene();
      
      // Force canvas refresh for 2D modes
      if (canvas2DRef.current) {
        const canvas = canvas2DRef.current;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        
        // Clear the canvas completely
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset the background
        const colors = colorSchemes[colorScheme];
        canvas.style.backgroundColor = colors.background;
        
        // Initialize strings immediately if switching to string mode
        if (visualMode === 'stringTheory') {
          initializeStrings(
            settings.stringCount, 
            settings.stringSegments, 
            settings.stringTension, 
            settings.stringDamping
          );
        }
      }
    }
  }, [visualMode, isRecording, init3DScene, cleanup3DScene, colorScheme, settings.stringCount, settings.stringSegments, settings.stringTension, settings.stringDamping, initializeStrings, colorSchemes]);

  // Update particle count when setting changes
  useEffect(() => {
    if (isRecording && visualMode === 'spectrogram3d' && sceneRef.current) {
      createParticleSystem(settings.particleCount);
    }
  }, [settings.particleCount, isRecording, visualMode, createParticleSystem]);

  // Update blobs when blob settings change
  useEffect(() => {
    if (isRecording && visualMode === 'spectrogram3d' && sceneRef.current) {
      createDancingBlobs(sceneRef.current);
    }
  }, [
    settings.blobCount, 
    settings.blobVariants, 
    settings.blobSize,
    isRecording, 
    visualMode, 
    createDancingBlobs
  ]);

  // Update string physics when string settings change
  useEffect(() => {
    if (isRecording && visualMode === 'stringTheory') {
      initializeStrings(
        settings.stringCount, 
        settings.stringSegments, 
        settings.stringTension, 
        settings.stringDamping
      );
    }
  }, [
    settings.stringCount, 
    settings.stringSegments, 
    settings.stringTension, 
    settings.stringDamping, 
    isRecording, 
    visualMode, 
    initializeStrings
  ]);

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
      
      // Use the constrained visualization area bounds
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      // Clear the canvas when resizing/mode switching
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [visualMode]); // Add visualMode as dependency to trigger on mode change

  // Start/stop recording
  const startRecording = async () => {
    try {
      if (!isAnalyzing) {
        const success = await initializeAudio();
        if (!success) return;
      }
      
      // Double-check AudioContext state
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setRecordedChunks([]);
      mediaRecorderRef.current?.start();
      setIsRecording(true);
      
      if (visualMode === 'spectrogram3d') {
        init3DScene();
      }
      
      animate();
    } catch (err) {
      console.error('Error starting recording:', err);
      // Reset states on error
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
      
      // Stop audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setIsAnalyzing(false);
    } catch (err) {
      console.error('Error stopping recording:', err);
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
      {/* Main visualization container - with safe zone padding */}
      <div className="absolute top-24 bottom-40 left-4 right-4 border border-gray-800/30 rounded-lg overflow-hidden">
        <canvas
          key={`canvas-${visualMode}-${colorScheme}`}
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => applyModeOptimizedSettings(visualMode)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                title="Reset to optimal defaults for current mode"
              >
                Optimize
              </button>
              <button
                onClick={resetToDefaults}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
                title="Reset all settings to factory defaults"
              >
                Defaults
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Visualization Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visualization Mode
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { id: 'spectrogram3d', icon: Box, label: '3D Blob' },
                { id: 'stringTheory', icon: Zap, label: 'String Theory' },
                { id: 'spectrogram', icon: Grid3x3, label: 'Spectrogram' },
                { id: 'melSpectrogram', icon: Waves, label: 'Mel-Spectrogram' },
                { id: 'waveform', icon: Music, label: 'Waveform' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setVisualMode(id);
                    // Auto-apply optimized settings after a short delay
                    setTimeout(() => applyModeOptimizedSettings(id), 100);
                  }}
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

          {/* Core Audio Settings - Always visible */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Audio</h3>
            
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
            </div>

            <details className="group">
              <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                Advanced Audio Settings ▼
              </summary>
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-700">
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
            </details>

            {visualMode === 'melSpectrogram' && (
              <details className="group">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                  Mel-Spectrogram Settings ▼
                </summary>
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-700">
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
                </div>
              </details>
            )}
          </div>

          {/* Dancing Blobs Settings */}
          {visualMode === 'spectrogram3d' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Dancing Blobs</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Count</span>
                    <span>{settings.blobCount}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={settings.blobCount}
                    onChange={(e) => setSettings({ ...settings, blobCount: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Size</span>
                    <span>{settings.blobSize.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="2.0"
                    step="0.1"
                    value={settings.blobSize}
                    onChange={(e) => setSettings({ ...settings, blobSize: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dance Mode
                </label>
                <select
                  value={settings.blobDanceMode}
                  onChange={(e) => setSettings({ ...settings, blobDanceMode: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded px-2 py-1"
                >
                  <option value="orbit">Orbit</option>
                  <option value="follow">Follow Leader</option>
                  <option value="scatter">Scatter</option>
                  <option value="sync">Synchronized</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Blob Types
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['pulsing', 'ripple', 'spiral'].map(variant => (
                    <button
                      key={variant}
                      onClick={() => {
                        const variants = settings.blobVariants.includes(variant)
                          ? settings.blobVariants.filter(v => v !== variant)
                          : [...settings.blobVariants, variant];
                        if (variants.length > 0) {
                          setSettings({ ...settings, blobVariants: variants });
                        }
                      }}
                      className={`p-2 rounded text-xs transition-colors ${
                        settings.blobVariants.includes(variant)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {variant.charAt(0).toUpperCase() + variant.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Blob Interaction</span>
                  <input
                    type="checkbox"
                    checked={settings.blobInteraction}
                    onChange={(e) => setSettings({ ...settings, blobInteraction: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Ferro-Fluid Mode</span>
                  <input
                    type="checkbox"
                    checked={settings.ferroFluidMode}
                    onChange={(e) => setSettings({ ...settings, ferroFluidMode: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Elasticity</span>
                  <span>{settings.blobElasticity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={settings.blobElasticity}
                  onChange={(e) => setSettings({ ...settings, blobElasticity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <details className="group">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                  Advanced Physics Settings ▼
                </summary>
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-700">
                  <div>
                    <label className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>Internal Force Points</span>
                      <span>{settings.internalForces}</span>
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="12"
                      step="1"
                      value={settings.internalForces}
                      onChange={(e) => setSettings({ ...settings, internalForces: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>Surface Tension</span>
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
                      min="500"
                      max="3000"
                      step="100"
                      value={settings.particleCount}
                      onChange={(e) => setSettings({ ...settings, particleCount: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* String Theory Settings */}
          {visualMode === 'stringTheory' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">String Physics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Count</span>
                    <span>{settings.stringCount}</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    step="1"
                    value={settings.stringCount}
                    onChange={(e) => setSettings({ ...settings, stringCount: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Thickness</span>
                    <span>{settings.stringThickness}</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="1"
                    value={settings.stringThickness}
                    onChange={(e) => setSettings({ ...settings, stringThickness: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Layout
                  </label>
                  <select
                    value={settings.stringLayout}
                    onChange={(e) => setSettings({ ...settings, stringLayout: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded px-2 py-1"
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="centered">Centered</option>
                    <option value="mirrored">Mirrored</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bass Position
                  </label>
                  <select
                    value={settings.bassPosition}
                    onChange={(e) => setSettings({ ...settings, bassPosition: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded px-2 py-1"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">String Particles</span>
                <input
                  type="checkbox"
                  checked={settings.enableParticles}
                  onChange={(e) => setSettings({ ...settings, enableParticles: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              
              <details className="group">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                  Advanced Physics Settings ▼
                </summary>
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-700">
                  <div>
                    <label className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>String Tension</span>
                      <span>{settings.stringTension.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="1.5"
                      step="0.1"
                      value={settings.stringTension}
                      onChange={(e) => setSettings({ ...settings, stringTension: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>String Damping</span>
                      <span>{settings.stringDamping.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.85"
                      max="0.95"
                      step="0.01"
                      value={settings.stringDamping}
                      onChange={(e) => setSettings({ ...settings, stringDamping: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>String Segments</span>
                      <span>{settings.stringSegments}</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="50"
                      step="5"
                      value={settings.stringSegments}
                      onChange={(e) => setSettings({ ...settings, stringSegments: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {settings.enableParticles && (
                    <div>
                      <label className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Particle Count</span>
                        <span>{settings.particleCount}</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="40"
                        step="5"
                        value={settings.particleCount}
                        onChange={(e) => setSettings({ ...settings, particleCount: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Settings Management */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white mb-2">Settings Management</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={resetToDefaults}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors"
                title="Reset all settings to factory defaults"
              >
                <Settings className="w-4 h-4" />
                Reset Defaults
              </button>
              <button
                onClick={() => applyModeOptimizedSettings(visualMode)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors"
                title="Optimize for current visualization mode"
              >
                <Zap className="w-4 h-4" />
                Optimize Mode
              </button>
            </div>
            
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