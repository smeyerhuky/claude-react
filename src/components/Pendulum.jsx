import React, { useState, useEffect, useRef } from 'react';

const PendulumSimulation = () => {
  // Configurable parameters with state
  const [length, setLength] = useState(100);
  const [gravity, setGravity] = useState(9.8);
  const [damping, setDamping] = useState(0.999);
  const [isRunning, setIsRunning] = useState(true);
  const [trailEnabled, setTrailEnabled] = useState(true);

  // Animation state
  const [angle, setAngle] = useState(Math.PI / 4); // Initial angle (45 degrees)
  const [angularVelocity, setAngularVelocity] = useState(0);
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const animationRef = useRef(null);

  // Calculate pendulum position
  const calculatePosition = () => {
    const x = length * Math.sin(angle);
    const y = length * Math.cos(angle);
    return { x, y };
  };

  // Physics update function
  const updatePhysics = (timestamp) => {
    if (!isRunning) return;

    // Calculate angular acceleration based on physics
    const angularAcceleration = -gravity / length * Math.sin(angle);

    // Update angular velocity with damping
    const newAngularVelocity = (angularVelocity + angularAcceleration * 0.05) * damping;
    setAngularVelocity(newAngularVelocity);

    // Update angle
    setAngle(angle + newAngularVelocity * 0.05);

    // Store position for trail
    if (trailEnabled) {
      const { x, y } = calculatePosition();
      trailRef.current = [...trailRef.current.slice(-50), { x, y }];
    } else {
      trailRef.current = [];
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(updatePhysics);
  };

  // Setup animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [angle, angularVelocity, length, gravity, damping, isRunning, trailEnabled]);

  // Draw function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = 50;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw trail
    if (trailEnabled && trailRef.current.length > 1) {
      ctx.beginPath();
      trailRef.current.forEach((pos, index) => {
        const alpha = index / trailRef.current.length;
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        if (index === 0) {
          ctx.moveTo(centerX + pos.x, centerY + pos.y);
        } else {
          ctx.lineTo(centerX + pos.x, centerY + pos.y);
        }
      });
      ctx.stroke();
    }

    // Draw pendulum rod
    const { x, y } = calculatePosition();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + x, centerY + y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pendulum bob
    ctx.beginPath();
    ctx.arc(centerX + x, centerY + y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0066cc';
    ctx.fill();
    ctx.strokeStyle = '#003366';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw pivot point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
  }, [angle, length, trailEnabled]);

  // Reset the pendulum
  const resetPendulum = () => {
    setAngle(Math.PI / 4);
    setAngularVelocity(0);
    trailRef.current = [];
  };

  // Toggle animation
  const toggleAnimation = () => {
    setIsRunning(!isRunning);
  };

  // Apply an impulse to the pendulum
  const applyImpulse = () => {
    setAngularVelocity(angularVelocity + 0.5);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Interactive Pendulum Simulation</h2>

      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="border border-gray-300 bg-white mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Pendulum Length: {length}
            <input
              type="range"
              min="50"
              max="150"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="block text-sm font-medium">
            Gravity: {gravity.toFixed(1)}
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={gravity}
              onChange={(e) => setGravity(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="block text-sm font-medium">
            Damping: {damping.toFixed(3)}
            <input
              type="range"
              min="0.9"
              max="1"
              step="0.001"
              value={damping}
              onChange={(e) => setDamping(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAnimation}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isRunning ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={resetPendulum}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset
            </button>

            <button
              onClick={applyImpulse}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Push
            </button>
          </div>

          <label className="flex items-center text-sm font-medium">
            <input
              type="checkbox"
              checked={trailEnabled}
              onChange={() => setTrailEnabled(!trailEnabled)}
              className="mr-2"
            />
            Show Motion Trail
          </label>

          <div className="text-sm mt-2">
            <p>Current angle: {(angle * 180 / Math.PI).toFixed(1)}°</p>
            <p>Angular velocity: {angularVelocity.toFixed(2)} rad/s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendulumSimulation;
