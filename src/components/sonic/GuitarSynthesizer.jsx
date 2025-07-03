import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Settings, X, Music, Sliders, Volume2, MousePointer } from 'lucide-react';

const GuitarSynthesizer = () => {
  // Audio context and nodes
  const audioContextRef = useRef(null);
  const stringOscillatorsRef = useRef([]);
  const analyserRef = useRef(null);
  
  // Canvas reference
  const canvasRef = useRef(null);
  
  // Animation reference
  const animationRef = useRef(null);
  
  // Touch tracking
  const touchPointsRef = useRef(new Map());
  
  // Component state
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // New state for hover strumming mode
  const [hoverToStrum, setHoverToStrum] = useState(true);
  const [hoverSensitivity, setHoverSensitivity] = useState(2);
  
  // Track if mouse is over canvas
  const isMouseOverCanvasRef = useRef(false);
  
  // Last mouse position for hover mode
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  // Synth parameters
  const [synthParams, setSynthParams] = useState({
    stringCount: 6,
    pointsPerString: 25,
    tension: 0.3,
    damping: 0.995, // Less damping for longer sustain
    resonance: 0.5,
    waveform: 'triangle',
    attack: 0.001, // Very fast attack for plucked sound
    release: 3.0, // Longer release for guitar-like sustain
    volume: 0.7,
    detune: 0,
    harmonics: 3
  });
  
  // Guitar strings data
  const stringsRef = useRef([]);
  
  // Initialize Audio Context
  useEffect(() => {
    // Create audio context on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.connect(audioContextRef.current.destination);
        
        // Remove initialization listener once audio is set up
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
      }
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Initialize guitar visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size to full viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Initialize guitar strings
    initGuitarStrings();
    
    // Start animation
    startAnimation();
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-initialize strings on resize
      initGuitarStrings();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Event listeners for touch/mouse interaction
    setupInteractionListeners();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      removeInteractionListeners();
    };
  }, [synthParams, hoverToStrum, hoverSensitivity]);
  
  // Effect to initialize oscillators when playback state changes
  useEffect(() => {
    if (isPlaying) {
      initializeAudioOscillators();
    } else {
      stopAllOscillators();
    }
  }, [isPlaying]);
  
  // Initialize guitar strings
  const initGuitarStrings = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const stringCount = synthParams.stringCount;
    const pointsPerString = synthParams.pointsPerString;
    
    stringsRef.current = [];
    
    // Standard guitar tuning frequencies in Hz (from low to high): E2, A2, D3, G3, B3, E4
    const guitarFrequencies = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
    
    // Create each string - now with low E at the top (reversed order)
    for (let i = 0; i < stringCount; i++) {
      // Calculate y position (evenly spaced)
      // Now we place the low E string at the top (i=0) and high E at the bottom (i=5)
      const y = canvas.height * (i + 1) / (stringCount + 1);
      
      // Create string points
      const points = [];
      
      for (let j = 0; j < pointsPerString; j++) {
        points.push({
          x: (canvas.width * j) / (pointsPerString - 1),
          y: y,
          baseY: y, // Store original y position
          velocity: 0,
          force: 0
        });
      }
      
      // Add string to collection - use the correct frequency
      // Since we've reversed the display order, we need to get the correct frequency
      stringsRef.current.push({
        points: points,
        frequency: guitarFrequencies[i < guitarFrequencies.length ? i : i % guitarFrequencies.length],
        lastPlucked: 0,
        isActive: false
      });
    }
  };
  
  // Animation loop for guitar physics and rendering
  const startAnimation = () => {
    const animate = () => {
      updatePhysics();
      renderGuitar();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Update string physics
  const updatePhysics = () => {
    // Update each string
    stringsRef.current.forEach(string => {
      const points = string.points;
      
      // Calculate forces
      for (let i = 0; i < points.length; i++) {
        let force = 0;
        
        // Force from left neighbor
        if (i > 0) {
          force += (points[i-1].y - points[i].y) * synthParams.tension;
        }
        
        // Force from right neighbor
        if (i < points.length - 1) {
          force += (points[i+1].y - points[i].y) * synthParams.tension;
        }
        
        // Add force towards rest position
        force += (points[i].baseY - points[i].y) * (synthParams.tension * 0.1);
        
        // Store force
        points[i].force = force;
      }
      
      // Update velocities and positions
      for (let i = 0; i < points.length; i++) {
        // Skip endpoints (fixed)
        if (i === 0 || i === points.length - 1) continue;
        
        // Update velocity with damping
        points[i].velocity = points[i].velocity * synthParams.damping + points[i].force;
        
        // Update position
        points[i].y += points[i].velocity;
      }
      
      // Check if string is active (has movement)
      let isActive = false;
      for (let i = 1; i < points.length - 1; i++) {
        if (Math.abs(points[i].velocity) > 0.05) {
          isActive = true;
          break;
        }
      }
      
      string.isActive = isActive;
    });
  };
  
  // Render guitar
  const renderGuitar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple background
    drawSimpleBackground(ctx, canvas.width, canvas.height);
    
    // Draw string endpoints (bridge and nut)
    drawStringEndpoints(ctx);
    
    // Draw each string
    stringsRef.current.forEach((string, stringIndex) => {
      const points = string.points;
      
      // Draw the string with Bezier curves for smooth appearance
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        // Create control points for bezier curve
        const cp1x = points[i-1].x + (points[i].x - points[i-1].x) / 3;
        const cp1y = points[i-1].y;
        const cp2x = points[i].x - (points[i].x - points[i-1].x) / 3;
        const cp2y = points[i].y;
        
        // Draw bezier curve
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
      }
      
      // String style - thicker for bass strings, thinner for treble
      // Base thickness on string index (thickest string at top now)
      const baseThickness = 4;
      const thickness = baseThickness - (stringIndex * 0.4);
      
      // Different colors for active vs inactive strings
      ctx.strokeStyle = string.isActive ? '#f39c12' : '#e67e22';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Add a glow effect to active strings
      if (string.isActive) {
        ctx.save();
        ctx.shadowColor = 'rgba(243, 156, 18, 0.8)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }
      
      // Draw active vibration points
      if (string.isActive) {
        for (let i = 1; i < points.length - 1; i++) {
          const velocity = Math.abs(points[i].velocity);
          if (velocity > 0.05) {
            const opacity = Math.min(velocity / 3, 1);
            const size = 3 + velocity;
            
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(243, 156, 18, ${opacity})`;
            
            ctx.save();
            ctx.shadowColor = 'rgba(243, 156, 18, 0.8)';
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.restore();
          }
        }
      }
    });
    
    // Draw touch points for debugging (optional)
    if (touchPointsRef.current.size > 0) {
      ctx.save();
      touchPointsRef.current.forEach(touchPoint => {
        ctx.beginPath();
        ctx.arc(touchPoint.currentX, touchPoint.currentY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
      });
      ctx.restore();
    }
    
    // Draw mouse cursor in hover mode
    if (hoverToStrum && isMouseOverCanvasRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(lastMousePosRef.current.x, lastMousePosRef.current.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      ctx.restore();
    }
  };
  
  // Draw simple background without fret markers
  const drawSimpleBackground = (ctx, width, height) => {
    ctx.save();
    
    // Create a simple gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1a2530');
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
  };
  
  // Draw string endpoints (bridge and nut)
  const drawStringEndpoints = (ctx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ctx.save();
    
    // Draw bridge (right side)
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.rect(
      canvas.width - 20, 
      canvas.height * 0.1, 
      10, 
      canvas.height * 0.8
    );
    ctx.fill();
    
    // Draw nut (left side)
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.rect(
      10, 
      canvas.height * 0.1, 
      10, 
      canvas.height * 0.8
    );
    ctx.fill();
    
    ctx.restore();
  };
  
  // Set up touch and mouse interaction
  const setupInteractionListeners = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Touch events for multi-touch
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Mouse enter/leave for hover mode
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
  };
  
  // Remove event listeners
  const removeInteractionListeners = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    canvas.removeEventListener('touchcancel', handleTouchEnd);
    
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    canvas.removeEventListener('mouseenter', handleMouseEnter);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
  };
  
  // Mouse enter handler for hover mode
  const handleMouseEnter = (e) => {
    isMouseOverCanvasRef.current = true;
    
    // Initialize last position
    const canvasRect = canvasRef.current.getBoundingClientRect();
    lastMousePosRef.current = {
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top
    };
  };
  
  // Mouse leave handler for hover mode
  const handleMouseLeave = () => {
    isMouseOverCanvasRef.current = false;
    
    // Clear mouse touch point if in hover mode
    if (hoverToStrum) {
      touchPointsRef.current.delete('mouse');
    }
  };
  
  // Touch event handlers for multi-touch
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default to avoid scrolling
    
    // Process all new touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Create a new touch point
      touchPointsRef.current.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX - canvasRect.left,
        startY: touch.clientY - canvasRect.top,
        currentX: touch.clientX - canvasRect.left,
        currentY: touch.clientY - canvasRect.top,
        previousX: touch.clientX - canvasRect.left,
        previousY: touch.clientY - canvasRect.top,
        startTime: Date.now(),
        velocityX: 0,
        velocityY: 0,
        strumming: false
      });
    }
  };
  
  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent default to avoid scrolling
    
    // Process all active touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPoint = touchPointsRef.current.get(touch.identifier);
      
      if (touchPoint) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        // Update previous position
        touchPoint.previousX = touchPoint.currentX;
        touchPoint.previousY = touchPoint.currentY;
        
        // Update current position
        touchPoint.currentX = touch.clientX - canvasRect.left;
        touchPoint.currentY = touch.clientY - canvasRect.top;
        
        // Calculate velocity
        const timeDelta = Date.now() - touchPoint.startTime;
        if (timeDelta > 0) {
          touchPoint.velocityX = (touchPoint.currentX - touchPoint.previousX) / (timeDelta / 1000);
          touchPoint.velocityY = (touchPoint.currentY - touchPoint.previousY) / (timeDelta / 1000);
          touchPoint.startTime = Date.now();
        }
        
        // Check if this touch is crossing any strings
        checkTouchStringIntersection(touchPoint);
      }
    }
  };
  
  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent default behavior
    
    // Remove ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      touchPointsRef.current.delete(touch.identifier);
    }
  };
  
  // Mouse event handlers
  const handleMouseDown = (e) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Treat mouse like a single touch point
    touchPointsRef.current.set('mouse', {
      id: 'mouse',
      startX: e.clientX - canvasRect.left,
      startY: e.clientY - canvasRect.top,
      currentX: e.clientX - canvasRect.left,
      currentY: e.clientY - canvasRect.top,
      previousX: e.clientX - canvasRect.left,
      previousY: e.clientY - canvasRect.top,
      startTime: Date.now(),
      velocityX: 0,
      velocityY: 0,
      strumming: false
    });
  };
  
  const handleMouseMove = (e) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    // In hover mode, track mouse movement even without button press
    if (hoverToStrum) {
      // Create virtual touch point if it doesn't exist
      if (!touchPointsRef.current.has('mouse')) {
        touchPointsRef.current.set('mouse', {
          id: 'mouse',
          startX: lastMousePosRef.current.x,
          startY: lastMousePosRef.current.y,
          currentX: mouseX,
          currentY: mouseY,
          previousX: lastMousePosRef.current.x,
          previousY: lastMousePosRef.current.y,
          startTime: Date.now(),
          velocityX: 0,
          velocityY: 0,
          strumming: true
        });
      } else {
        // Update existing touch point
        const touchPoint = touchPointsRef.current.get('mouse');
        
        // Update previous position
        touchPoint.previousX = touchPoint.currentX;
        touchPoint.previousY = touchPoint.currentY;
        
        // Update current position
        touchPoint.currentX = mouseX;
        touchPoint.currentY = mouseY;
        
        // Calculate velocity
        const timeDelta = Date.now() - touchPoint.startTime;
        if (timeDelta > 0) {
          touchPoint.velocityX = (touchPoint.currentX - touchPoint.previousX) / (timeDelta / 1000);
          touchPoint.velocityY = (touchPoint.currentY - touchPoint.previousY) / (timeDelta / 1000);
          touchPoint.startTime = Date.now();
        }
        
        // Calculate movement distance for sensitivity threshold
        const distance = Math.sqrt(
          Math.pow(touchPoint.currentX - touchPoint.previousX, 2) +
          Math.pow(touchPoint.currentY - touchPoint.previousY, 2)
        );
        
        // Only check for string intersection if movement exceeds sensitivity threshold
        if (distance >= hoverSensitivity) {
          checkTouchStringIntersection(touchPoint);
          
          // Update start position after checking to avoid over-triggering
          touchPoint.startX = touchPoint.currentX;
          touchPoint.startY = touchPoint.currentY;
        }
      }
    } else {
      // Classic mode - only track if mouse button is down
      const touchPoint = touchPointsRef.current.get('mouse');
      
      if (touchPoint) {
        // Update previous position
        touchPoint.previousX = touchPoint.currentX;
        touchPoint.previousY = touchPoint.currentY;
        
        // Update current position
        touchPoint.currentX = mouseX;
        touchPoint.currentY = mouseY;
        
        // Calculate velocity
        const timeDelta = Date.now() - touchPoint.startTime;
        if (timeDelta > 0) {
          touchPoint.velocityX = (touchPoint.currentX - touchPoint.previousX) / (timeDelta / 1000);
          touchPoint.velocityY = (touchPoint.currentY - touchPoint.previousY) / (timeDelta / 1000);
          touchPoint.startTime = Date.now();
        }
        
        // Check if this touch is crossing any strings
        checkTouchStringIntersection(touchPoint);
      }
    }
    
    // Always update last mouse position
    lastMousePosRef.current = { x: mouseX, y: mouseY };
  };
  
  const handleMouseUp = () => {
    // Only clear if not in hover mode
    if (!hoverToStrum) {
      touchPointsRef.current.delete('mouse');
    }
  };
  
  // Check if a touch/mouse movement intersects with any strings
  const checkTouchStringIntersection = (touchPoint) => {
    // Get start and end points of the touch movement
    const startX = touchPoint.previousX;
    const startY = touchPoint.previousY;
    const endX = touchPoint.currentX;
    const endY = touchPoint.currentY;
    
    // Skip if movement is too small (adjusted for hover mode)
    const distanceThreshold = hoverToStrum ? hoverSensitivity : 3;
    const distance = Math.sqrt(
      Math.pow(endX - startX, 2) + 
      Math.pow(endY - startY, 2)
    );
    
    if (distance < distanceThreshold) return;
    
    // Calculate movement speed (pixels per second)
    const speed = Math.sqrt(
      Math.pow(touchPoint.velocityX, 2) + 
      Math.pow(touchPoint.velocityY, 2)
    );
    
    // Check each string for intersection
    stringsRef.current.forEach((string, stringIndex) => {
      // Use first point's y as the string's y position
      const stringY = string.points[0].baseY;
      
      // Check if line segment crosses this string
      if ((startY <= stringY && endY >= stringY) || 
          (startY >= stringY && endY <= stringY)) {
        
        // Calculate intersection point
        const t = (stringY - startY) / (endY - startY);
        const intersectionX = startX + t * (endX - startX);
        
        // Only pluck if intersection is within string bounds
        if (intersectionX >= 0 && intersectionX <= canvasRef.current.width) {
          // Don't pluck too frequently (debounce)
          const now = Date.now();
          // Adjust debounce time for hover mode
          const debounceTime = hoverToStrum ? 200 : 100; 
          if (now - string.lastPlucked > debounceTime) {
            string.lastPlucked = now;
            
            // Calculate pluck position relative to string length (0 to 1)
            const pluckPosition = intersectionX / canvasRef.current.width;
            
            // Calculate pluck intensity based on speed
            // Clamp between 0.2 and 10
            // Adjust intensity for hover mode (typically gentler)
            const intensityScale = hoverToStrum ? 0.7 : 1.0;
            const pluckIntensity = Math.min(Math.max((speed / 100) * intensityScale, 0.2), 10);
            
            // Pluck the string
            pluckString(stringIndex, pluckPosition, pluckIntensity);
          }
        }
      }
    });
  };
  
  // Pluck a string at the specified position with the given intensity
  const pluckString = (stringIndex, position, intensity) => {
    if (stringIndex < 0 || stringIndex >= stringsRef.current.length) return;
    
    const string = stringsRef.current[stringIndex];
    const points = string.points;
    
    // Find point index closest to pluck position
    const pointIndex = Math.floor(position * (points.length - 1));
    
    // Apply displacement based on position and intensity
    // The displacement direction alternates based on pluck direction
    const direction = Math.random() > 0.5 ? 1 : -1;
    const maxDisplacement = 30 * Math.min(intensity, 1);
    
    // Apply displacement to nearby points with falloff
    const halfWidth = Math.floor(points.length / 10);
    for (let i = Math.max(1, pointIndex - halfWidth); 
         i <= Math.min(points.length - 2, pointIndex + halfWidth); 
         i++) {
           
      // Calculate distance from center of pluck (0 to 1)
      const distanceFactor = 1 - (Math.abs(i - pointIndex) / halfWidth);
      
      // Apply displacement and velocity
      const displacement = maxDisplacement * distanceFactor;
      points[i].y = points[i].baseY + (direction * displacement);
      points[i].velocity = -direction * (intensity * distanceFactor);
    }
    
    // Play sound if enabled
    if (isPlaying) {
      playStringSound(stringIndex, position, intensity);
    }
  };
  
  // Initialize audio oscillators for each string
  const initializeAudioOscillators = () => {
    if (!audioContextRef.current) return;
    
    // Create a master limiter to prevent excessive volume
    const limiter = audioContextRef.current.createDynamicsCompressor();
    limiter.threshold.value = -3;  // Start compressing at -3dB
    limiter.knee.value = 6;        // Gentle knee for more musical compression
    limiter.ratio.value = 12;      // Strong limiting ratio
    limiter.attack.value = 0.003;  // Quick attack to catch transients
    limiter.release.value = 0.25;  // Release time
    limiter.connect(analyserRef.current);
    
    // Stop any existing oscillators
    stopAllOscillators();
    
    // Create oscillator for each string
    stringOscillatorsRef.current = stringsRef.current.map((string, index) => {
      // Create gain node (starts silent)
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.connect(limiter);
      
      // Create main oscillator
      const oscillator = audioContextRef.current.createOscillator();
      oscillator.type = synthParams.waveform;
      oscillator.frequency.setValueAtTime(string.frequency, audioContextRef.current.currentTime);
      oscillator.connect(gainNode);
      oscillator.start();
      
      // Add harmonics
      const harmonics = [];
      const harmonicGains = [];
      
      if (synthParams.harmonics > 1) {
        for (let h = 2; h <= synthParams.harmonics; h++) {
          const harmonic = audioContextRef.current.createOscillator();
          harmonic.type = synthParams.waveform;
          harmonic.frequency.setValueAtTime(string.frequency * h, audioContextRef.current.currentTime);
          
          // Create gain node for harmonic
          const harmonicGain = audioContextRef.current.createGain();
          harmonicGain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          harmonic.connect(harmonicGain);
          harmonicGain.connect(limiter);
          harmonic.start();
          
          harmonics.push(harmonic);
          harmonicGains.push(harmonicGain);
        }
      }
      
      return {
        oscillator,
        gain: gainNode,
        harmonics,
        harmonicGains
      };
    });
  };
  
  // Stop all oscillators
  const stopAllOscillators = () => {
    if (stringOscillatorsRef.current.length > 0) {
      stringOscillatorsRef.current.forEach(string => {
        if (string.oscillator) {
          const releaseTime = audioContextRef.current.currentTime + synthParams.release;
          
          // Apply release envelope
          string.gain.gain.cancelScheduledValues(audioContextRef.current.currentTime);
          string.gain.gain.setValueAtTime(string.gain.gain.value, audioContextRef.current.currentTime);
          string.gain.gain.exponentialRampToValueAtTime(0.001, releaseTime);
          
          // Schedule oscillator stop after release
          string.oscillator.stop(releaseTime + 0.1);
          
          // Also fade out and stop harmonics
          if (string.harmonics && string.harmonicGains) {
            string.harmonics.forEach((harmonic, i) => {
              string.harmonicGains[i].gain.cancelScheduledValues(audioContextRef.current.currentTime);
              string.harmonicGains[i].gain.setValueAtTime(
                string.harmonicGains[i].gain.value, 
                audioContextRef.current.currentTime
              );
              string.harmonicGains[i].gain.exponentialRampToValueAtTime(0.001, releaseTime);
              harmonic.stop(releaseTime + 0.1);
            });
          }
        }
      });
      
      // Clear references after longest release
      setTimeout(() => {
        stringOscillatorsRef.current = [];
      }, (synthParams.release + 0.2) * 1000);
    }
  };
  
  // Play sound for a specific string
  const playStringSound = (stringIndex, position, intensity) => {
    if (!isPlaying || !audioContextRef.current) return;
    if (stringIndex < 0 || stringIndex >= stringOscillatorsRef.current.length) return;
    
    const stringAudio = stringOscillatorsRef.current[stringIndex];
    if (!stringAudio || !stringAudio.oscillator) return;
    
    // Clamp intensity
    const normalizedIntensity = Math.min(Math.max(intensity / 5, 0.2), 1);
    
    // Calculate volume based on intensity and master volume
    const volume = normalizedIntensity * synthParams.volume * 0.5;
    
    // Calculate time constants
    const now = audioContextRef.current.currentTime;
    const attackTime = now + synthParams.attack;
    const releaseTime = attackTime + synthParams.release;
    
    // Calculate slight detune based on pluck position
    // Center of string = no detune, ends = more detune
    const detuneAmount = synthParams.detune * (0.5 - Math.abs(position - 0.5)) * 2;
    
    // Apply envelope to main oscillator
    stringAudio.gain.gain.cancelScheduledValues(now);
    stringAudio.gain.gain.setValueAtTime(stringAudio.gain.gain.value, now);
    stringAudio.gain.gain.linearRampToValueAtTime(volume, attackTime);
    stringAudio.gain.gain.exponentialRampToValueAtTime(0.001, releaseTime);
    
    // Apply detune based on pluck position
    stringAudio.oscillator.detune.cancelScheduledValues(now);
    stringAudio.oscillator.detune.setValueAtTime(stringAudio.oscillator.detune.value, now);
    stringAudio.oscillator.detune.linearRampToValueAtTime(detuneAmount, attackTime);
    
    // Also adjust harmonics if present
    if (stringAudio.harmonics && stringAudio.harmonicGains) {
      stringAudio.harmonics.forEach((harmonic, i) => {
        const harmonicIndex = i + 2; // Harmonics start at 2x frequency
        const harmonicVolume = volume / (harmonicIndex * 1.5); // Higher harmonics quieter
        
        stringAudio.harmonicGains[i].gain.cancelScheduledValues(now);
        stringAudio.harmonicGains[i].gain.setValueAtTime(
          stringAudio.harmonicGains[i].gain.value, 
          now
        );
        stringAudio.harmonicGains[i].gain.linearRampToValueAtTime(harmonicVolume, attackTime);
        stringAudio.harmonicGains[i].gain.exponentialRampToValueAtTime(0.001, releaseTime);
      });
    }
  };
  
  // Toggle play state
  const togglePlay = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context if it was suspended (happens in some browsers)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Create analyzer node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.85;
      analyserRef.current.connect(audioContextRef.current.destination);
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Toggle hover to strum mode
  const toggleHoverMode = () => {
    setHoverToStrum(!hoverToStrum);
    
    // Clear any existing mouse touch point
    touchPointsRef.current.delete('mouse');
  };
  
  // Update synth parameters
  const updateParam = (param, value) => {
    setSynthParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  // Render UI control for number parameters
  const renderControl = (param, label, min, max, step = 0.01, valueFormatter = null) => {
    const value = synthParams[param];
    const displayValue = valueFormatter ? valueFormatter(value) : value.toFixed(2);
    
    return (
      <div className="control-group">
        <label className="control-label">
          {label}
          <span className="control-value">{displayValue}</span>
        </label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => updateParam(param, parseFloat(e.target.value))}
          className="range-slider"
        />
      </div>
    );
  };
  
  // Render hover sensitivity control
  const renderHoverSensitivityControl = () => {
    return (
      <div className="control-group">
        <label className="control-label">
          Hover Sensitivity
          <span className="control-value">{hoverSensitivity.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={hoverSensitivity}
          onChange={(e) => setHoverSensitivity(parseFloat(e.target.value))}
          className="range-slider"
          disabled={!hoverToStrum}
        />
      </div>
    );
  };
  
  // Render dropdown for waveform selection
  const renderWaveformSelector = () => {
    return (
      <div className="control-group">
        <label className="control-label">
          Waveform
          <span className="control-value">{synthParams.waveform}</span>
        </label>
        <select
          value={synthParams.waveform}
          onChange={(e) => updateParam('waveform', e.target.value)}
          className="select-dropdown"
        >
          <option value="sine">Sine</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
          <option value="square">Square</option>
        </select>
      </div>
    );
  };
  
  // Render the guitar interface
  return (
    <div className="guitar-synth">
      {/* Main canvas for guitar visualization */}
      <canvas 
        ref={canvasRef} 
        className="guitar-canvas"
      />
      
      {/* Floating controls */}
      <div className="floating-controls">
        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          title={isPlaying ? "Stop" : "Play"}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        
        <button 
          className={`mode-button ${hoverToStrum ? 'hover-mode' : ''}`}
          onClick={toggleHoverMode}
          title={hoverToStrum ? "Switch to Click Mode" : "Switch to Hover Mode"}
        >
          <MousePointer size={20} />
        </button>
        
        <button 
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          title={showSettings ? "Hide Settings" : "Show Settings"}
        >
          <Settings size={20} />
        </button>
      </div>
      
      {/* Instructions overlay */}
      <div className="instructions-overlay">
        {hoverToStrum 
          ? "Move mouse across strings to strum" 
          : "Swipe across strings to strum"}
      </div>
      
      {/* Settings modal */}
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <div className="settings-header">
              <h2>Guitar Synthesizer Settings</h2>
              <button 
                className="close-button"
                onClick={() => setShowSettings(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="settings-body">
              <div className="controls-section">
                <h3><Music size={16} /> Synth Parameters</h3>
                {renderWaveformSelector()}
                {renderControl('volume', 'Volume', 0, 1, 0.01)}
                {renderControl('detune', 'Detune Amount (cents)', 0, 1200, 1, v => Math.round(v))}
                {renderControl('harmonics', 'Harmonics', 1, 8, 1, v => Math.round(v))}
              </div>
              
              <div className="controls-section">
                <h3><MousePointer size={16} /> Interaction Mode</h3>
                <div className="control-group">
                  <div className="toggle-container">
                    <label>
                      <span className={hoverToStrum ? "" : "active-mode"}>Click to Strum</span>
                      <div className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hoverToStrum}
                          onChange={toggleHoverMode}
                        />
                        <span className="toggle-slider"></span>
                      </div>
                      <span className={hoverToStrum ? "active-mode" : ""}>Hover to Strum</span>
                    </label>
                  </div>
                </div>
                {renderHoverSensitivityControl()}
              </div>
              
              <div className="controls-section">
                <h3><Sliders size={16} /> Guitar Physics</h3>
                {renderControl('tension', 'Tension', 0.1, 1, 0.01)}
                {renderControl('damping', 'Damping', 0.8, 0.999, 0.001)}
                {renderControl('resonance', 'Resonance', 0, 1, 0.01)}
                {renderControl('stringCount', 'String Count', 3, 12, 1, v => Math.round(v))}
              </div>
              
              <div className="controls-section">
                <h3><Volume2 size={16} /> Envelope</h3>
                {renderControl('attack', 'Attack (s)', 0.001, 0.1, 0.001)}
                {renderControl('release', 'Release (s)', 0.1, 10, 0.1)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .guitar-synth {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #34495e;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .guitar-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          touch-action: none;
          cursor: pointer;
        }
        
        .floating-controls {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 12px;
          z-index: 10;
        }
        
        .play-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #27ae60;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .play-button:hover {
          background: #2ecc71;
          transform: scale(1.05);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }
        
        .play-button.playing {
          background: #e74c3c;
        }
        
        .play-button.playing:hover {
          background: #c0392b;
        }
        
        .mode-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .mode-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        .mode-button.hover-mode {
          background: #3498db;
        }
        
        .mode-button.hover-mode:hover {
          background: #2980b9;
        }
        
        .settings-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .settings-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        .instructions-overlay {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          pointer-events: none;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        
        .instructions-overlay:hover {
          opacity: 0;
        }
        
        .settings-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          animation: fadeIn 0.2s ease;
        }
        
        .settings-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }
        
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .settings-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #7f8c8d;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }
        
        .close-button:hover {
          background: #f5f5f5;
          color: #34495e;
        }
        
        .settings-body {
          padding: 20px;
        }
        
        .controls-section {
          margin-bottom: 24px;
        }
        
        .controls-section:last-child {
          margin-bottom: 0;
        }
        
        .controls-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #34495e;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .control-group {
          margin-bottom: 16px;
        }
        
        .control-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 14px;
          color: #555;
        }
        
        .control-value {
          font-weight: 500;
          color: #2c3e50;
        }
        
        .range-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          background: #e0e0e0;
          outline: none;
          border-radius: 3px;
        }
        
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3498db;
          cursor: pointer;
          transition: background 0.15s ease;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .range-slider::-webkit-slider-thumb:hover {
          background: #2980b9;
        }
        
        .range-slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .select-dropdown {
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #ddd;
          background: #f7f8f9;
          font-size: 14px;
          color: #333;
          cursor: pointer;
        }
        
        .toggle-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toggle-container label {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          gap: 10px;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 30px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: #3498db;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(30px);
        }
        
        .active-mode {
          font-weight: 600;
          color: #3498db;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .play-button {
            width: 50px;
            height: 50px;
          }
          
          .mode-button, .settings-button {
            width: 40px;
            height: 40px;
          }
          
          .settings-content {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default GuitarSynthesizer;