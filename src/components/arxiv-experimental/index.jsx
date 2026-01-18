import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PhysicsEngine, MotionAnimator } from './PhysicsEngine';
import { NeuralMotionSimulator } from './NeuralMotionSimulator';
import './styles.css';

/**
 * Neural Procedural Animation System
 * Enhanced for mobile with multiple interaction modes and visual effects
 */
function NeuralProceduralAnimation() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [mood, setMood] = useState(0.5);
  const [energy, setEnergy] = useState(0.5);
  const [targets, setTargets] = useState([{ x: 0, y: 0, id: 0 }]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [particleCount, setParticleCount] = useState(150);
  const [showTrails, setShowTrails] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [interactionMode, setInteractionMode] = useState('follow');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [enableConnections, setEnableConnections] = useState(true);
  const [enableGlow, setEnableGlow] = useState(true);
  const [colorCycling, setColorCycling] = useState(true);
  const [autoCycleMode, setAutoCycleMode] = useState(false);

  // Store refs for animation loop
  const particlesRef = useRef([]);
  const neuralSimulatorRef = useRef(new NeuralMotionSimulator());
  const physicsEngineRef = useRef(new PhysicsEngine());
  const animationIdRef = useRef(null);
  const statsRef = useRef({ fps: 0, frameCount: 0, lastTime: performance.now() });
  const touchPointsRef = useRef(new Map());
  const explosionsRef = useRef([]);
  const drawPathRef = useRef([]);
  const gravityWellsRef = useRef([]);
  const timeRef = useRef(0);
  const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const modeCycleTimerRef = useRef(0);

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
      setTargets([{ x: width / 2, y: height / 2, id: 0 }]);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize particles
  useEffect(() => {
    const simulator = neuralSimulatorRef.current;
    const physics = physicsEngineRef.current;

    const physicsParams = simulator.getPhysicsParameters({ mood, energy });

    const particles = Array(particleCount)
      .fill(null)
      .map((_, i) => ({
        animator: new MotionAnimator(physicsParams, physics),
        baseHue: (i / particleCount) * 360,
        hue: (i / particleCount) * 360,
        id: i,
        size: 2 + Math.random() * 3,
        baseSize: 2 + Math.random() * 3,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitRadius: 50 + Math.random() * 100,
        life: 1,
        maxLife: 1,
        pulsePhase: Math.random() * Math.PI * 2,
      }));

    // Randomize initial positions
    particles.forEach(p => {
      p.animator.state.x = Math.random() * canvasSize.width;
      p.animator.state.y = Math.random() * canvasSize.height;
    });

    particlesRef.current = particles;
    setIsInitialized(true);
  }, [particleCount, canvasSize.width, canvasSize.height]);

  // Update physics parameters when mood/energy changes
  useEffect(() => {
    if (!isInitialized) return;

    const simulator = neuralSimulatorRef.current;
    const newParams = simulator.getPhysicsParameters({ mood, energy });

    particlesRef.current.forEach((particle) => {
      particle.animator.updateParams(newParams);
    });
  }, [mood, energy, isInitialized]);

  // Auto-cycle modes
  useEffect(() => {
    if (!autoCycleMode) return;

    const modes = ['follow', 'attract', 'repel', 'orbit', 'explode', 'draw'];
    let currentIndex = modes.indexOf(interactionMode);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % modes.length;
      setInteractionMode(modes[currentIndex]);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoCycleMode, interactionMode]);

  // Handle pointer move (mouse or touch)
  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();

    if (e.touches) {
      const newTargets = Array.from(e.touches).map((touch, i) => ({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        id: touch.identifier,
        age: 0
      }));
      setTargets(newTargets);

      newTargets.forEach(target => {
        touchPointsRef.current.set(target.id, target);
      });

      if (interactionMode === 'draw') {
        newTargets.forEach(target => {
          drawPathRef.current.push({ ...target, time: Date.now() });
        });
        if (drawPathRef.current.length > 150) {
          drawPathRef.current = drawPathRef.current.slice(-150);
        }
      }
    } else {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTargets([{ x, y, id: 0, age: 0 }]);

      if (interactionMode === 'draw') {
        drawPathRef.current.push({ x, y, time: Date.now() });
        if (drawPathRef.current.length > 150) {
          drawPathRef.current = drawPathRef.current.slice(-150);
        }
      }
    }
  }, [interactionMode]);

  // Handle tap/click
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();

    if (interactionMode === 'explode') {
      const points = e.touches ? Array.from(e.touches) : [e];
      points.forEach(point => {
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;
        explosionsRef.current.push({
          x, y,
          radius: 0,
          maxRadius: 250,
          strength: 800,
          time: Date.now()
        });

        // Add screen shake
        screenShakeRef.current.intensity = 10;
      });
    }

    handlePointerMove(e);
  }, [interactionMode, handlePointerMove]);

  // Clean up touch points
  const handlePointerUp = useCallback((e) => {
    if (e.changedTouches) {
      Array.from(e.changedTouches).forEach(touch => {
        touchPointsRef.current.delete(touch.identifier);
      });
      if (e.touches.length > 0) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newTargets = Array.from(e.touches).map(touch => ({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          id: touch.identifier,
          age: 0
        }));
        setTargets(newTargets);
      }
    }

    if (interactionMode === 'draw') {
      setTimeout(() => {
        drawPathRef.current = [];
      }, 2000);
    }
  }, [interactionMode]);

  // Calculate target position based on interaction mode
  const calculateTarget = useCallback((particle, time) => {
    const particles = particlesRef.current;

    switch (interactionMode) {
      case 'follow':
        if (targets.length === 0) return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
        let closestTarget = targets[0];
        let minDist = Infinity;
        targets.forEach(target => {
          const dist = Math.hypot(particle.animator.state.x - target.x, particle.animator.state.y - target.y);
          if (dist < minDist) {
            minDist = dist;
            closestTarget = target;
          }
        });
        return closestTarget;

      case 'attract':
        if (targets.length === 0) return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
        const avgX = targets.reduce((sum, t) => sum + t.x, 0) / targets.length;
        const avgY = targets.reduce((sum, t) => sum + t.y, 0) / targets.length;
        return { x: avgX, y: avgY };

      case 'repel':
        if (targets.length === 0) return particle.animator.state;
        let closestRepel = targets[0];
        let minRepelDist = Infinity;
        targets.forEach(target => {
          const dist = Math.hypot(particle.animator.state.x - target.x, particle.animator.state.y - target.y);
          if (dist < minRepelDist) {
            minRepelDist = dist;
            closestRepel = target;
          }
        });
        const dx = particle.animator.state.x - closestRepel.x;
        const dy = particle.animator.state.y - closestRepel.y;
        const dist = Math.hypot(dx, dy) || 1;
        return {
          x: particle.animator.state.x + (dx / dist) * 300,
          y: particle.animator.state.y + (dy / dist) * 300
        };

      case 'orbit':
        if (targets.length === 0) return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
        let orbitTarget = targets[0];
        let minOrbitDist = Infinity;
        targets.forEach(target => {
          const dist = Math.hypot(particle.animator.state.x - target.x, particle.animator.state.y - target.y);
          if (dist < minOrbitDist) {
            minOrbitDist = dist;
            orbitTarget = target;
          }
        });
        particle.orbitAngle += 0.03 * (1 + energy);
        const orbitX = orbitTarget.x + Math.cos(particle.orbitAngle) * particle.orbitRadius;
        const orbitY = orbitTarget.y + Math.sin(particle.orbitAngle) * particle.orbitRadius;
        return { x: orbitX, y: orbitY };

      case 'draw':
        if (drawPathRef.current.length === 0) {
          return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
        }
        const pathIndex = Math.floor((particle.id / particles.length) * drawPathRef.current.length);
        const pathPoint = drawPathRef.current[Math.min(pathIndex, drawPathRef.current.length - 1)];
        return { x: pathPoint.x, y: pathPoint.y };

      case 'explode':
        let explodeTarget = { ...particle.animator.state };
        explosionsRef.current.forEach(explosion => {
          const dx = particle.animator.state.x - explosion.x;
          const dy = particle.animator.state.y - explosion.y;
          const dist = Math.hypot(dx, dy);
          if (dist < explosion.radius) {
            const force = (1 - dist / explosion.radius) * explosion.strength;
            explodeTarget.x += (dx / (dist || 1)) * force * 0.15;
            explodeTarget.y += (dy / (dist || 1)) * force * 0.15;
          }
        });
        if (targets.length > 0 && explosionsRef.current.length === 0) {
          return targets[0];
        }
        return explodeTarget;

      default:
        return targets[0] || { x: canvasSize.width / 2, y: canvasSize.height / 2 };
    }
  }, [interactionMode, targets, energy, canvasSize]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let lastFrameTime = performance.now();

    function animate(currentTime) {
      const deltaTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      timeRef.current += deltaTime / 1000;

      // Calculate FPS
      statsRef.current.frameCount++;
      if (currentTime - statsRef.current.lastTime >= 1000) {
        statsRef.current.fps = statsRef.current.frameCount;
        statsRef.current.frameCount = 0;
        statsRef.current.lastTime = currentTime;
      }

      // Update screen shake
      if (screenShakeRef.current.intensity > 0) {
        screenShakeRef.current.x = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.y = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.intensity *= 0.9;
        if (screenShakeRef.current.intensity < 0.1) screenShakeRef.current.intensity = 0;
      }

      ctx.save();
      ctx.translate(screenShakeRef.current.x, screenShakeRef.current.y);

      // Clear canvas with trail effect
      if (showTrails) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update explosions
      explosionsRef.current = explosionsRef.current.filter(explosion => {
        explosion.radius += 8;
        return explosion.radius < explosion.maxRadius;
      });

      // Draw explosions with multiple rings
      explosionsRef.current.forEach(explosion => {
        const alpha = 1 - (explosion.radius / explosion.maxRadius);
        for (let i = 0; i < 3; i++) {
          const r = explosion.radius - i * 20;
          if (r > 0) {
            ctx.strokeStyle = `rgba(${255 - i * 50}, ${100 + i * 30}, 50, ${alpha * 0.4})`;
            ctx.lineWidth = 4 - i;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      // Draw path in draw mode
      if (interactionMode === 'draw' && drawPathRef.current.length > 1) {
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        drawPathRef.current.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }

      // Update gravity wells (stationary touch points become gravity wells)
      targets.forEach(target => {
        target.age = (target.age || 0) + deltaTime;
        if (target.age > 500) {
          gravityWellsRef.current.push({
            x: target.x,
            y: target.y,
            strength: 0.5,
            radius: 150
          });
        }
      });
      gravityWellsRef.current = gravityWellsRef.current.slice(-3);

      // Draw gravity wells
      gravityWellsRef.current.forEach(well => {
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Update and draw particles
      const particles = particlesRef.current;

      particles.forEach((particle) => {
        const target = calculateTarget(particle, currentTime);

        particle.animator.setTarget(target.x, target.y);
        const state = particle.animator.update();
        const velocity = particle.animator.getVelocity();

        // Apply gravity wells
        gravityWellsRef.current.forEach(well => {
          const dx = well.x - state.x;
          const dy = well.y - state.y;
          const dist = Math.hypot(dx, dy);
          if (dist < well.radius) {
            const force = well.strength * (1 - dist / well.radius);
            particle.animator.state.vx += (dx / (dist || 1)) * force;
            particle.animator.state.vy += (dy / (dist || 1)) * force;
          }
        });

        // Wrap around edges
        if (state.x < 0) state.x = canvas.width;
        if (state.x > canvas.width) state.x = 0;
        if (state.y < 0) state.y = canvas.height;
        if (state.y > canvas.height) state.y = 0;

        const speed = Math.hypot(velocity.vx, velocity.vy);

        // Update particle hue (color cycling)
        if (colorCycling) {
          particle.hue = (particle.baseHue + timeRef.current * 50 + speed * 2) % 360;
        } else {
          particle.hue = particle.baseHue;
        }

        // Pulsing size based on energy
        particle.pulsePhase += 0.05 + energy * 0.1;
        const pulse = Math.sin(particle.pulsePhase) * 0.5 + 0.5;
        particle.size = particle.baseSize * (1 + pulse * energy * 0.5);

        // Draw particle with glow
        if (enableGlow) {
          ctx.shadowBlur = 10 + speed * 0.3;
          ctx.shadowColor = `hsl(${particle.hue}, 70%, 60%)`;
        } else {
          ctx.shadowBlur = 0;
        }

        const size = particle.size + Math.min(speed / 80, 3);
        ctx.fillStyle = `hsl(${particle.hue}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(state.x, state.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw motion trail
        if (showTrails && speed > 2) {
          const alpha = Math.min(speed / 200, 0.9);
          ctx.shadowBlur = 5;
          ctx.strokeStyle = `hsla(${particle.hue}, 70%, 60%, ${alpha})`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(state.x, state.y);
          ctx.lineTo(state.x - velocity.vx * 0.6, state.y - velocity.vy * 0.6);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
      });

      // Draw connections between nearby particles
      if (enableConnections) {
        const maxConnectionDist = 100;
        ctx.lineWidth = 1;

        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i].animator.state;

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j].animator.state;
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

            if (dist < maxConnectionDist) {
              const alpha = (1 - dist / maxConnectionDist) * 0.3;
              const avgHue = (particles[i].hue + particles[j].hue) / 2;
              ctx.strokeStyle = `hsla(${avgHue}, 70%, 60%, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw target indicators
      targets.forEach(target => {
        const style = interactionMode === 'repel'
          ? 'rgba(255, 100, 100, 0.5)'
          : `hsla(${(timeRef.current * 100) % 360}, 70%, 60%, 0.5)`;
        ctx.strokeStyle = style;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 25 + Math.sin(timeRef.current * 3) * 5, 0, Math.PI * 2);
        ctx.stroke();

        if (interactionMode === 'orbit') {
          ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(target.x, target.y, 150, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw stats
      if (showStats) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = '14px monospace';
        ctx.shadowBlur = 0;
        ctx.fillText(`FPS: ${statsRef.current.fps}`, 10, 20);
        ctx.fillText(`Particles: ${particleCount}`, 10, 40);
        ctx.fillText(`Mode: ${interactionMode}`, 10, 60);
        ctx.fillText(`Targets: ${targets.length}`, 10, 80);
        ctx.fillText(`Connections: ${enableConnections ? 'ON' : 'OFF'}`, 10, 100);
      }

      ctx.restore();

      animationIdRef.current = requestAnimationFrame(animate);
    }

    animate(performance.now());

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isInitialized, targets, particleCount, showTrails, showStats, interactionMode, calculateTarget, canvasSize, enableConnections, enableGlow, colorCycling]);

  const modes = [
    { id: 'follow', label: 'Follow', icon: '→', description: 'Particles chase your touch' },
    { id: 'attract', label: 'Attract', icon: '◎', description: 'Particles gather at touch points' },
    { id: 'repel', label: 'Repel', icon: '✳', description: 'Particles flee from touch' },
    { id: 'orbit', label: 'Orbit', icon: '⟳', description: 'Particles orbit around touch' },
    { id: 'explode', label: 'Explode', icon: '✹', description: 'Tap to create shockwaves' },
    { id: 'draw', label: 'Draw', icon: '✎', description: 'Draw paths for particles' },
  ];

  return (
    <div className="neural-animation-fullscreen" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseMove={handlePointerMove}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="animation-canvas-fullscreen"
      />

      {/* Toggle controls button */}
      <button
        className="toggle-controls-btn"
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? '✕' : '☰'}
      </button>

      {/* Mobile-friendly controls panel */}
      <div className={`mobile-controls-panel ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-header">
          <h2>Neural Animation</h2>
          <p className="mode-description">
            {modes.find(m => m.id === interactionMode)?.description}
          </p>
        </div>

        {/* Interaction modes */}
        <div className="mode-selector">
          {modes.map(mode => (
            <button
              key={mode.id}
              className={`mode-btn ${interactionMode === mode.id ? 'active' : ''}`}
              onClick={() => setInteractionMode(mode.id)}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-label">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Mood and Energy controls */}
        <div className="param-controls">
          <div className="param-group">
            <label>
              <span className="param-label">Mood</span>
              <span className="param-value">{mood.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={mood}
              onChange={(e) => setMood(parseFloat(e.target.value))}
              className="param-slider"
            />
            <div className="param-labels">
              <span>Calm</span>
              <span>Frantic</span>
            </div>
          </div>

          <div className="param-group">
            <label>
              <span className="param-label">Energy</span>
              <span className="param-value">{energy.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={energy}
              onChange={(e) => setEnergy(parseFloat(e.target.value))}
              className="param-slider"
            />
            <div className="param-labels">
              <span>Heavy</span>
              <span>Light</span>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="preset-grid">
          <button onClick={() => { setMood(0.1); setEnergy(0.2); }}>Molasses</button>
          <button onClick={() => { setMood(0.5); setEnergy(0.5); }}>Balanced</button>
          <button onClick={() => { setMood(0.9); setEnergy(0.9); }}>Hyperactive</button>
          <button onClick={() => { setMood(0.2); setEnergy(0.9); }}>Floaty</button>
        </div>

        {/* Visual effects */}
        <div className="settings-group">
          <h3 className="section-title">Visual Effects</h3>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={enableConnections}
                onChange={(e) => setEnableConnections(e.target.checked)}
              />
              <span>Connections</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={enableGlow}
                onChange={(e) => setEnableGlow(e.target.checked)}
              />
              <span>Glow</span>
            </label>
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={colorCycling}
                onChange={(e) => setColorCycling(e.target.checked)}
              />
              <span>Color Cycle</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={autoCycleMode}
                onChange={(e) => setAutoCycleMode(e.target.checked)}
              />
              <span>Auto Mode</span>
            </label>
          </div>
        </div>

        {/* Additional settings */}
        <div className="settings-group">
          <h3 className="section-title">Settings</h3>

          <div className="setting-row">
            <label>
              <span>Particles</span>
              <span className="setting-value">{particleCount}</span>
            </label>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={particleCount}
              onChange={(e) => setParticleCount(parseInt(e.target.value))}
              className="setting-slider"
            />
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
              />
              <span>Motion Trails</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
              />
              <span>Stats</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NeuralProceduralAnimation;
