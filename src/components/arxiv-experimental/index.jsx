import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PhysicsEngine, MotionAnimator } from './PhysicsEngine';
import { NeuralMotionSimulator } from './NeuralMotionSimulator';
import './styles.css';

/**
 * Neural Procedural Animation System
 * Use Case 1: Mood-Driven Particle Swarm
 *
 * A particle system where particles respond to user's mood/energy sliders.
 * The neural network (simulated) learns to map mood values to spring physics
 * parameters that create the appropriate visual feel.
 */
function NeuralProceduralAnimation() {
  const canvasRef = useRef(null);
  const [mood, setMood] = useState(0.5);
  const [energy, setEnergy] = useState(0.5);
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [particleCount, setParticleCount] = useState(50);
  const [showTrails, setShowTrails] = useState(true);
  const [showStats, setShowStats] = useState(false);

  // Store refs for animation loop
  const particlesRef = useRef([]);
  const neuralSimulatorRef = useRef(new NeuralMotionSimulator());
  const physicsEngineRef = useRef(new PhysicsEngine());
  const animationIdRef = useRef(null);
  const statsRef = useRef({ fps: 0, frameCount: 0, lastTime: performance.now() });

  // Initialize particles
  useEffect(() => {
    const simulator = neuralSimulatorRef.current;
    const physics = physicsEngineRef.current;

    // Get initial physics parameters
    const physicsParams = simulator.getPhysicsParameters({ mood, energy });

    // Create particles
    const particles = Array(particleCount)
      .fill(null)
      .map((_, i) => ({
        animator: new MotionAnimator(physicsParams, physics),
        hue: (i / particleCount) * 360,
        id: i
      }));

    particlesRef.current = particles;
    setIsInitialized(true);
  }, [particleCount]);

  // Update physics parameters when mood/energy changes
  useEffect(() => {
    if (!isInitialized) return;

    const simulator = neuralSimulatorRef.current;
    const newParams = simulator.getPhysicsParameters({ mood, energy });

    // Update all particle animators with new parameters
    particlesRef.current.forEach((particle) => {
      particle.animator.updateParams(newParams);
    });
  }, [mood, energy, isInitialized]);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let lastFrameTime = performance.now();

    function animate(currentTime) {
      // Calculate FPS
      const deltaTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;

      statsRef.current.frameCount++;
      if (currentTime - statsRef.current.lastTime >= 1000) {
        statsRef.current.fps = statsRef.current.frameCount;
        statsRef.current.frameCount = 0;
        statsRef.current.lastTime = currentTime;
      }

      // Clear canvas with trail effect
      if (showTrails) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Set target to mouse position
        particle.animator.setTarget(mousePos.x, mousePos.y);

        // Update physics
        const state = particle.animator.update();
        const velocity = particle.animator.getVelocity();

        // Calculate speed for visual effects
        const speed = Math.hypot(velocity.vx, velocity.vy);

        // Draw particle
        const size = 3 + Math.min(speed / 50, 3);
        ctx.fillStyle = `hsl(${particle.hue}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(state.x, state.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw motion trail based on velocity
        if (showTrails && speed > 1) {
          const alpha = Math.min(speed / 100, 0.6);
          ctx.strokeStyle = `hsla(${particle.hue}, 70%, 60%, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(state.x, state.y);
          ctx.lineTo(state.x - velocity.vx * 0.3, state.y - velocity.vy * 0.3);
          ctx.stroke();
        }
      });

      // Draw target indicator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mousePos.x - 20, mousePos.y);
      ctx.lineTo(mousePos.x + 20, mousePos.y);
      ctx.moveTo(mousePos.x, mousePos.y - 20);
      ctx.lineTo(mousePos.x, mousePos.y + 20);
      ctx.stroke();

      // Draw stats
      if (showStats) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${statsRef.current.fps}`, 10, 20);
        ctx.fillText(`Particles: ${particleCount}`, 10, 35);
        ctx.fillText(`Mood: ${mood.toFixed(2)}`, 10, 50);
        ctx.fillText(`Energy: ${energy.toFixed(2)}`, 10, 65);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    }

    animate(performance.now());

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isInitialized, mousePos, particleCount, showTrails, showStats, mood, energy]);

  return (
    <div className="neural-animation-container">
      <div className="header">
        <h1>Neural Procedural Animation</h1>
        <p className="subtitle">
          Use Case 1: Mood-Driven Particle Swarm
        </p>
        <p className="description">
          Particles respond to your mood and energy settings using learned physics parameters.
          Move your mouse to guide them.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseMove={handleMouseMove}
        className="animation-canvas"
      />

      <div className="controls-panel">
        <div className="control-section">
          <h3>Style Controls</h3>

          <div className="control-group">
            <label>
              <span className="label-text">
                Mood: <span className="mood-label">
                  {mood < 0.3 ? 'Calm & Smooth' : mood < 0.7 ? 'Natural' : 'Frantic & Jittery'}
                </span>
              </span>
              <div className="slider-container">
                <span className="slider-label">Calm</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mood}
                  onChange={(e) => setMood(parseFloat(e.target.value))}
                  className="slider mood-slider"
                />
                <span className="slider-label">Frantic</span>
              </div>
              <span className="value-display">{mood.toFixed(2)}</span>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span className="label-text">
                Energy: <span className="energy-label">
                  {energy < 0.3 ? 'Heavy & Slow' : energy < 0.7 ? 'Balanced' : 'Light & Bouncy'}
                </span>
              </span>
              <div className="slider-container">
                <span className="slider-label">Low</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={energy}
                  onChange={(e) => setEnergy(parseFloat(e.target.value))}
                  className="slider energy-slider"
                />
                <span className="slider-label">High</span>
              </div>
              <span className="value-display">{energy.toFixed(2)}</span>
            </label>
          </div>
        </div>

        <div className="control-section">
          <h3>Visual Settings</h3>

          <div className="control-group">
            <label>
              <span className="label-text">Particle Count</span>
              <div className="slider-container">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={particleCount}
                  onChange={(e) => setParticleCount(parseInt(e.target.value))}
                  className="slider"
                />
              </div>
              <span className="value-display">{particleCount}</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
              />
              <span>Show Motion Trails</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
              />
              <span>Show Stats</span>
            </label>
          </div>
        </div>

        <div className="info-section">
          <h3>How It Works</h3>
          <ul>
            <li><strong>Mood</strong> controls spring stiffness and damping (smooth vs. jittery motion)</li>
            <li><strong>Energy</strong> controls particle mass (heavy vs. light feel)</li>
            <li>The "neural network" maps these high-level controls to physics parameters</li>
            <li>Traditional physics ensures smooth, stable animation</li>
          </ul>
        </div>

        <div className="preset-section">
          <h3>Presets</h3>
          <div className="preset-buttons">
            <button onClick={() => { setMood(0.1); setEnergy(0.2); }}>
              Molasses
            </button>
            <button onClick={() => { setMood(0.5); setEnergy(0.5); }}>
              Natural
            </button>
            <button onClick={() => { setMood(0.9); setEnergy(0.8); }}>
              Hyperactive
            </button>
            <button onClick={() => { setMood(0.3); setEnergy(0.9); }}>
              Floaty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NeuralProceduralAnimation;
