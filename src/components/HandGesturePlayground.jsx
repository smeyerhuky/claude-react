import { useRef, useState, useEffect, useCallback } from 'react';
import { HandTrackingService } from '../ml/handTracking';
import { GestureRecognizer } from '../ml/gestureRecognizer';

// Physics constants
const GRAVITY = 0.3;
const FRICTION = 0.98;
const BOUNCE = 0.6;

// Ball colors
const BALL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

// Initial ball generator
const createBall = (x, y, size = 30) => ({
  id: Math.random().toString(36).substr(2, 9),
  x,
  y,
  vx: 0,
  vy: 0,
  size,
  baseSize: size,
  color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
  isHeld: false,
  heldBy: null,
});

export default function HandGesturePlayground() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const recognizersRef = useRef([null, null]);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState({ fps: 0, handsDetected: 0 });
  const [showTutorial, setShowTutorial] = useState(true);
  const [score, setScore] = useState(0);

  // Game state refs (to avoid re-renders during animation)
  const ballsRef = useRef([]);
  const handStatesRef = useRef([null, null]);
  const focusedBallRef = useRef({ left: null, right: null });

  // Sensitivity settings
  const [settings, setSettings] = useState({
    grabDistance: 60, // How close to grab a ball
    focusDistance: 100, // How close to focus/highlight
    fingerSpreadSensitivity: 2, // How much spread affects size
    minBallSize: 15,
    maxBallSize: 80,
  });

  // Bucket positions (will be set based on canvas size)
  const bucketsRef = useRef({
    source: { x: 100, y: 400, width: 150, height: 100 },
    target: { x: 540, y: 400, width: 150, height: 100 },
  });

  // Initialize balls in source bucket
  const initializeBalls = useCallback(() => {
    const bucket = bucketsRef.current.source;
    const balls = [];
    for (let i = 0; i < 6; i++) {
      const x = bucket.x + 30 + (i % 3) * 40;
      const y = bucket.y - 30 - Math.floor(i / 3) * 50;
      balls.push(createBall(x, y, 25 + Math.random() * 15));
    }
    ballsRef.current = balls;
  }, []);

  // Check if ball is in target bucket
  const isInTargetBucket = useCallback((ball) => {
    const bucket = bucketsRef.current.target;
    return (
      ball.x > bucket.x &&
      ball.x < bucket.x + bucket.width &&
      ball.y > bucket.y - 50 &&
      ball.y < bucket.y + bucket.height
    );
  }, []);

  // Physics update
  const updatePhysics = useCallback((deltaTime) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;
    const balls = ballsRef.current;

    balls.forEach((ball) => {
      if (ball.isHeld) return;

      // Apply gravity
      ball.vy += GRAVITY;

      // Apply velocity
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Apply friction
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Floor collision
      if (ball.y + ball.size > height - 10) {
        ball.y = height - 10 - ball.size;
        ball.vy *= -BOUNCE;
        ball.vx *= 0.9;
      }

      // Wall collisions
      if (ball.x - ball.size < 0) {
        ball.x = ball.size;
        ball.vx *= -BOUNCE;
      }
      if (ball.x + ball.size > width) {
        ball.x = width - ball.size;
        ball.vx *= -BOUNCE;
      }

      // Check if scored
      if (isInTargetBucket(ball) && !ball.scored) {
        ball.scored = true;
        setScore((s) => s + 1);
      }
    });
  }, [isInTargetBucket]);

  // Find closest ball to a point
  const findClosestBall = useCallback((x, y, maxDistance) => {
    let closest = null;
    let minDist = maxDistance;

    ballsRef.current.forEach((ball) => {
      if (ball.isHeld) return;
      const dx = ball.x - x;
      const dy = ball.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = ball;
      }
    });

    return closest;
  }, []);

  // Handle hand tracking data
  const handleHandData = useCallback((handData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;

    handData.forEach((hand, idx) => {
      if (!recognizersRef.current[idx]) {
        recognizersRef.current[idx] = new GestureRecognizer(8);
      }

      recognizersRef.current[idx].detectGesture(hand);
      const gesture = recognizersRef.current[idx].getSmoothedPrediction();

      const isLeftHand = hand.handedness === 'Right'; // Mirrored
      const handId = isLeftHand ? 'left' : 'right';

      // Get pinch point in canvas coordinates
      const pinchX = (1 - hand.pinchPoint.x) * width;
      const pinchY = hand.pinchPoint.y * height;

      // Get finger spread for resizing
      const fingerSpread = hand.fingerSpread || 0;

      handStatesRef.current[idx] = {
        ...hand,
        gesture,
        side: handId,
        canvasX: pinchX,
        canvasY: pinchY,
        fingerSpread,
      };

      const isPinching = gesture.gesture === 'pinch' && gesture.held;
      const isGrabbing = gesture.gesture === 'grab' && gesture.held;
      const isHolding = isPinching || isGrabbing;

      // Find ball currently held by this hand
      const heldBall = ballsRef.current.find((b) => b.heldBy === handId);

      if (isHolding) {
        if (heldBall) {
          // Move held ball with hand
          heldBall.x = pinchX;
          heldBall.y = pinchY;
          heldBall.vx = 0;
          heldBall.vy = 0;

          // Resize based on finger spread (while grabbing)
          if (isGrabbing) {
            const spreadDelta = (fingerSpread - 0.1) * settings.fingerSpreadSensitivity;
            const newSize = heldBall.baseSize * (1 + spreadDelta * 2);
            heldBall.size = Math.max(
              settings.minBallSize,
              Math.min(settings.maxBallSize, newSize)
            );
          }
        } else {
          // Try to grab a new ball
          const closestBall = findClosestBall(pinchX, pinchY, settings.grabDistance);
          if (closestBall) {
            closestBall.isHeld = true;
            closestBall.heldBy = handId;
            closestBall.baseSize = closestBall.size; // Remember size for resizing
          }
        }

        // Update focused ball
        focusedBallRef.current[handId] = heldBall?.id || null;
      } else {
        // Release held ball
        if (heldBall) {
          heldBall.isHeld = false;
          heldBall.heldBy = null;
          // Give it a small velocity based on recent movement
          heldBall.vy = 2; // Drop with gravity
        }

        // Update focus (for highlighting)
        const nearBall = findClosestBall(pinchX, pinchY, settings.focusDistance);
        focusedBallRef.current[handId] = nearBall?.id || null;
      }
    });

    // Clear hands that are no longer tracked
    if (handData.length < 2) {
      for (let i = handData.length; i < 2; i++) {
        const handId = i === 0 ? 'left' : 'right';
        const heldBall = ballsRef.current.find((b) => b.heldBy === handId);
        if (heldBall) {
          heldBall.isHeld = false;
          heldBall.heldBy = null;
        }
        handStatesRef.current[i] = null;
        focusedBallRef.current[handId] = null;
      }
    }

    if (trackerRef.current) {
      setStats(trackerRef.current.getPerformanceStats());
    }
  }, [settings, findClosestBall]);

  // Render loop
  const render = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Calculate delta time
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Update physics
    updatePhysics(deltaTime);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Draw floor
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, height - 10, width, 10);

    // Draw buckets
    const drawBucket = (bucket, label, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bucket.x, bucket.y - 60);
      ctx.lineTo(bucket.x, bucket.y + bucket.height);
      ctx.lineTo(bucket.x + bucket.width, bucket.y + bucket.height);
      ctx.lineTo(bucket.x + bucket.width, bucket.y - 60);
      ctx.stroke();

      ctx.fillStyle = `${color}33`;
      ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(label, bucket.x + bucket.width / 2, bucket.y + bucket.height + 20);
    };

    drawBucket(bucketsRef.current.source, 'Source', '#3b82f6');
    drawBucket(bucketsRef.current.target, 'Target', '#22c55e');

    // Draw balls
    ballsRef.current.forEach((ball) => {
      const isFocused =
        focusedBallRef.current.left === ball.id ||
        focusedBallRef.current.right === ball.id;

      // Glow effect for focused/held balls
      if (isFocused || ball.isHeld) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.size + 8, 0, Math.PI * 2);
        ctx.fillStyle = ball.isHeld ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      }

      // Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        ball.x - ball.size * 0.3,
        ball.y - ball.size * 0.3,
        0,
        ball.x,
        ball.y,
        ball.size
      );
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, ball.color);
      gradient.addColorStop(1, ball.color + '88');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Scored indicator
      if (ball.scored) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', ball.x, ball.y);
      }
    });

    // Draw hands
    handStatesRef.current.forEach((hand) => {
      if (!hand) return;

      const { canvasX, canvasY, gesture, side } = hand;
      const isHolding = (gesture.gesture === 'pinch' || gesture.gesture === 'grab') && gesture.held;

      // Hand indicator
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, isHolding ? 20 : 15, 0, Math.PI * 2);
      ctx.fillStyle = isHolding ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hand label
      ctx.fillStyle = '#fff';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${side}`, canvasX, canvasY + 35);
      ctx.fillText(`${gesture.gesture}`, canvasX, canvasY + 48);
    });

    animationRef.current = requestAnimationFrame(render);
  }, [updatePhysics]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus('loading');

    try {
      trackerRef.current = new HandTrackingService(videoRef.current, {
        maxNumHands: 2,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });

      recognizersRef.current = [new GestureRecognizer(8), new GestureRecognizer(8)];
      initializeBalls();

      await trackerRef.current.initialize();
      trackerRef.current.subscribe(handleHandData);

      // Start render loop
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(render);

      setStatus('running');
    } catch (error) {
      console.error('Failed to initialize:', error);
      setStatus('error');
    }
  }, [handleHandData, initializeBalls, render]);

  const stopTracking = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (trackerRef.current) {
      trackerRef.current.destroy();
      trackerRef.current = null;
    }
    setStatus('idle');
    setScore(0);
  }, []);

  const resetGame = useCallback(() => {
    initializeBalls();
    setScore(0);
  }, [initializeBalls]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      trackerRef.current?.destroy();
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main game area */}
        <div className="lg:col-span-3 bg-gray-900 rounded-xl overflow-hidden relative">
          <div className="relative aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-20"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full"
            />

            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Hand-Gesture Playground</h2>
                  <p className="text-gray-400 mb-6">Pick up balls and move them to the target!</p>
                  <button
                    onClick={startTracking}
                    className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700"
                  >
                    Start Playing
                  </button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="animate-spin text-5xl">⏳</div>
              </div>
            )}

            {status === 'running' && (
              <>
                {/* Stats */}
                <div className="absolute top-3 left-3 bg-black/70 px-3 py-2 rounded text-sm">
                  <div className="text-green-400">{stats.fps} FPS</div>
                  <div className="text-gray-400">{stats.handsDetected} hands</div>
                </div>

                {/* Score */}
                <div className="absolute top-3 right-3 bg-green-600 px-4 py-2 rounded-full">
                  <span className="text-white font-bold">Score: {score}</span>
                </div>

                {/* Tutorial overlay */}
                {showTutorial && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md mx-4">
                      <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
                      <div className="space-y-3 text-gray-300 text-sm">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">👆</span>
                          <div>
                            <b className="text-white">Point</b> at a ball to highlight it
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🤏</span>
                          <div>
                            <b className="text-white">Pinch + Hold</b> near a ball to grab it
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">✊</span>
                          <div>
                            <b className="text-white">Grab + Hold</b> to pick up and resize
                            <br />
                            <span className="text-gray-400">Spread fingers = bigger ball</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🖐️</span>
                          <div>
                            <b className="text-white">Open hand</b> to drop the ball
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <b className="text-white">Goal:</b> Move balls from blue bucket to green!
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTutorial(false)}
                        className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls bar */}
          <div className="p-3 bg-gray-800 flex justify-between items-center">
            <div className="flex gap-2">
              {status === 'running' && (
                <>
                  <button
                    onClick={resetGame}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
                  >
                    Reset Balls
                  </button>
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
                  >
                    Show Tutorial
                  </button>
                </>
              )}
            </div>
            {status === 'running' && (
              <button
                onClick={stopTracking}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Settings panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-bold text-gray-800 mb-4">Sensitivity Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Grab Distance: {settings.grabDistance}px
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={settings.grabDistance}
                  onChange={(e) => setSettings((s) => ({ ...s, grabDistance: +e.target.value }))}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">How close to grab a ball</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Focus Distance: {settings.focusDistance}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={settings.focusDistance}
                  onChange={(e) => setSettings((s) => ({ ...s, focusDistance: +e.target.value }))}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">How close to highlight a ball</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Resize Sensitivity: {settings.fingerSpreadSensitivity.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.5"
                  value={settings.fingerSpreadSensitivity}
                  onChange={(e) => setSettings((s) => ({ ...s, fingerSpreadSensitivity: +e.target.value }))}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">How much spread affects size</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-4">
            <h3 className="font-bold text-gray-800 mb-2">Gesture Reference</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>🤏 Pinch</span>
                <span className="text-gray-500">Grab ball</span>
              </div>
              <div className="flex justify-between">
                <span>✊ Grab</span>
                <span className="text-gray-500">Hold + Resize</span>
              </div>
              <div className="flex justify-between">
                <span>🖐️ Open</span>
                <span className="text-gray-500">Drop ball</span>
              </div>
              <div className="flex justify-between">
                <span>👆 Point</span>
                <span className="text-gray-500">Focus/Highlight</span>
              </div>
            </div>
          </div>

          {status === 'running' && (
            <div className="bg-green-100 rounded-xl p-4">
              <h3 className="font-bold text-green-800 mb-2">Current Score</h3>
              <div className="text-4xl font-bold text-green-600 text-center">{score}</div>
              <p className="text-sm text-green-700 text-center mt-1">balls delivered</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
