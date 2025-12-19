import { useRef, useState, useEffect, useCallback } from 'react';
import { HandTrackingService } from '../ml/handTracking';
import { GestureRecognizer } from '../ml/gestureRecognizer';

const GESTURE_LABELS = {
  open_palm: 'Open',
  pinch: 'Pinch',
  point: 'Point',
  grab: 'Grab',
  spread: 'Spread',
  none: '-',
};

// Sample images to manipulate
const SAMPLE_IMAGES = [
  'https://picsum.photos/seed/gesture1/400/300',
  'https://picsum.photos/seed/gesture2/400/300',
  'https://picsum.photos/seed/gesture3/400/300',
];

export default function GestureTestGame() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const recognizersRef = useRef([null, null]);
  const lastTwoHandStateRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState({ fps: 0, handsDetected: 0 });
  const [handStates, setHandStates] = useState([null, null]);

  // Image manipulation state
  const [imageState, setImageState] = useState({
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    imageIndex: 0,
    isDragging: false,
    isZooming: false,
  });

  // Hold progress for actions
  const [holdProgress, setHoldProgress] = useState({ left: 0, right: 0 });

  const calculateTwoHandDistance = (hand1, hand2) => {
    const dx = hand1.pinchPoint.x - hand2.pinchPoint.x;
    const dy = hand1.pinchPoint.y - hand2.pinchPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calculateTwoHandCenter = (hand1, hand2) => {
    return {
      x: (hand1.pinchPoint.x + hand2.pinchPoint.x) / 2,
      y: (hand1.pinchPoint.y + hand2.pinchPoint.y) / 2,
    };
  };

  const calculateTwoHandAngle = (hand1, hand2) => {
    const dx = hand2.pinchPoint.x - hand1.pinchPoint.x;
    const dy = hand2.pinchPoint.y - hand1.pinchPoint.y;
    return Math.atan2(dy, dx);
  };

  const handleHandData = useCallback((handData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Process each hand
    const newHandStates = [null, null];
    const newHoldProgress = { left: 0, right: 0 };

    handData.forEach((hand, idx) => {
      if (!recognizersRef.current[idx]) {
        recognizersRef.current[idx] = new GestureRecognizer(5);
      }

      const gesture = recognizersRef.current[idx].detectGesture(hand);
      const smoothed = recognizersRef.current[idx].getSmoothedPrediction();

      const handSide = hand.handedness === 'Left' ? 'right' : 'left'; // Mirrored
      newHandStates[idx] = {
        ...hand,
        gesture: smoothed,
        side: handSide,
      };

      // Track hold progress
      if (smoothed.gesture === 'pinch' && smoothed.holdDuration > 0) {
        const progress = Math.min(1, smoothed.holdDuration / 1000);
        newHoldProgress[handSide] = progress;
      }

      // Draw hand visualization
      drawHand(ctx, hand, width, height, smoothed);
    });

    setHandStates(newHandStates);
    setHoldProgress(newHoldProgress);

    // Two-hand manipulation logic
    if (handData.length === 2) {
      const [hand1, hand2] = handData;
      const gesture1 = newHandStates[0]?.gesture;
      const gesture2 = newHandStates[1]?.gesture;

      const bothPinching = gesture1?.gesture === 'pinch' && gesture2?.gesture === 'pinch';
      const bothHolding = gesture1?.held && gesture2?.held;

      if (bothPinching) {
        const currentDist = calculateTwoHandDistance(hand1, hand2);
        const currentCenter = calculateTwoHandCenter(hand1, hand2);
        const currentAngle = calculateTwoHandAngle(hand1, hand2);

        if (lastTwoHandStateRef.current && bothHolding) {
          const { dist: lastDist, angle: lastAngle, center: lastCenter } = lastTwoHandStateRef.current;

          // Zoom based on distance change
          const distRatio = currentDist / lastDist;
          const newScale = Math.max(0.2, Math.min(5, imageState.scale * distRatio));

          // Rotation based on angle change
          const angleDiff = currentAngle - lastAngle;
          const newRotation = imageState.rotation + (angleDiff * 180 / Math.PI);

          // Position based on center movement
          const newX = Math.max(0, Math.min(1, imageState.x + (lastCenter.x - currentCenter.x)));
          const newY = Math.max(0, Math.min(1, imageState.y + (lastCenter.y - currentCenter.y)));

          setImageState(prev => ({
            ...prev,
            scale: newScale,
            rotation: newRotation,
            x: newX,
            y: newY,
            isZooming: true,
          }));
        }

        lastTwoHandStateRef.current = {
          dist: currentDist,
          angle: currentAngle,
          center: currentCenter,
        };

        // Draw connection line between hands
        drawConnectionLine(ctx, hand1, hand2, width, height);
      } else {
        lastTwoHandStateRef.current = null;
        setImageState(prev => ({ ...prev, isZooming: false }));
      }
    } else {
      lastTwoHandStateRef.current = null;

      // Single hand interaction
      if (handData.length === 1) {
        const hand = handData[0];
        const gesture = newHandStates[0]?.gesture;

        // Point to move
        if (gesture?.gesture === 'point' && gesture.held) {
          setImageState(prev => ({
            ...prev,
            x: 1 - hand.position.x, // Mirror
            y: hand.position.y,
            isDragging: true,
          }));
        }
        // Grab to select/move
        else if (gesture?.gesture === 'grab' && gesture.held) {
          setImageState(prev => ({
            ...prev,
            x: 1 - hand.palmCenter.x,
            y: hand.palmCenter.y,
            isDragging: true,
          }));
        }
        // Open palm to reset
        else if (gesture?.gesture === 'open_palm' && gesture.holdDuration > 1500) {
          setImageState({
            x: 0.5,
            y: 0.5,
            scale: 1,
            rotation: 0,
            imageIndex: (imageState.imageIndex + 1) % SAMPLE_IMAGES.length,
            isDragging: false,
            isZooming: false,
          });
        } else {
          setImageState(prev => ({ ...prev, isDragging: false, isZooming: false }));
        }
      }
    }

    if (trackerRef.current) {
      setStats(trackerRef.current.getPerformanceStats());
    }
  }, [imageState.scale, imageState.rotation, imageState.x, imageState.y, imageState.imageIndex]);

  const drawHand = (ctx, hand, width, height, gesture) => {
    const { landmarks, depth } = hand;

    // Draw palm area with depth-based opacity
    const palmOpacity = 0.2 + depth.normalized * 0.3;
    ctx.fillStyle = `rgba(59, 130, 246, ${palmOpacity})`;
    ctx.beginPath();

    const palmPoints = [0, 5, 9, 13, 17];
    palmPoints.forEach((idx, i) => {
      const x = (1 - landmarks[idx].x) * width;
      const y = landmarks[idx].y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // Draw finger tips with gesture-based colors
    const fingerColors = gesture.gesture === 'pinch'
      ? ['#22c55e', '#22c55e', '#6b7280', '#6b7280', '#6b7280']
      : gesture.gesture === 'point'
        ? ['#6b7280', '#f59e0b', '#6b7280', '#6b7280', '#6b7280']
        : gesture.gesture === 'grab'
          ? ['#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444']
          : ['#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6'];

    const fingerTips = [4, 8, 12, 16, 20];
    fingerTips.forEach((tipIdx, i) => {
      const point = landmarks[tipIdx];
      const x = (1 - point.x) * width;
      const y = point.y * height;

      // Size based on depth
      const size = 8 + depth.normalized * 8;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = fingerColors[i];
      ctx.fill();

      if (gesture.held && (gesture.gesture === 'pinch' || gesture.gesture === 'grab')) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw pinch point if pinching
    if (gesture.gesture === 'pinch') {
      const px = (1 - hand.pinchPoint.x) * width;
      const py = hand.pinchPoint.y * height;

      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (gesture.held) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.fill();
      }
    }

    // Draw gesture label
    const labelX = (1 - hand.palmCenter.x) * width;
    const labelY = hand.palmCenter.y * height - 40;

    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(GESTURE_LABELS[gesture.gesture] || '-', labelX, labelY);

    // Draw hold progress ring
    if (gesture.holdDuration > 0 && gesture.holdDuration < 1500) {
      const progress = gesture.holdDuration / 1500;
      ctx.beginPath();
      ctx.arc(labelX, labelY + 50, 20, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  };

  const drawConnectionLine = (ctx, hand1, hand2, width, height) => {
    const x1 = (1 - hand1.pinchPoint.x) * width;
    const y1 = hand1.pinchPoint.y * height;
    const x2 = (1 - hand2.pinchPoint.x) * width;
    const y2 = hand2.pinchPoint.y * height;

    // Draw dashed line
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw center point
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const startTracking = useCallback(async () => {
    if (!videoRef.current) return;

    setStatus('loading');

    try {
      trackerRef.current = new HandTrackingService(videoRef.current, {
        maxNumHands: 2,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      recognizersRef.current = [new GestureRecognizer(5), new GestureRecognizer(5)];

      await trackerRef.current.initialize();
      trackerRef.current.subscribe(handleHandData);

      setStatus('running');
    } catch (error) {
      console.error('Failed to initialize hand tracking:', error);
      setStatus('error');
    }
  }, [handleHandData]);

  const stopTracking = useCallback(() => {
    if (trackerRef.current) {
      trackerRef.current.destroy();
      trackerRef.current = null;
    }
    recognizersRef.current = [null, null];
    setStatus('idle');
    setHandStates([null, null]);
  }, []);

  useEffect(() => {
    return () => {
      if (trackerRef.current) {
        trackerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camera view */}
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
          <div className="relative aspect-[4/3] bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-50"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full"
            />

            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center">
                  <div className="text-6xl mb-4">🖐️🤚</div>
                  <p className="text-gray-300 mb-4">Gesture Test Game</p>
                  <button
                    onClick={startTracking}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Start
                  </button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p className="text-gray-300">Loading...</p>
                </div>
              </div>
            )}

            {status === 'running' && (
              <div className="absolute top-3 left-3 bg-black/60 px-3 py-2 rounded-lg text-sm">
                <div className="text-green-400">{stats.fps} FPS</div>
                <div className="text-gray-400">{stats.handsDetected} hands</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-3 bg-gray-800 flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              {handStates.map((state, i) => (
                <div key={i} className="text-gray-300">
                  {state ? (
                    <span className={state.gesture.held ? 'text-green-400' : ''}>
                      {state.side}: {GESTURE_LABELS[state.gesture.gesture]}
                      {state.gesture.held && ' (held)'}
                    </span>
                  ) : (
                    <span className="text-gray-500">Hand {i + 1}: -</span>
                  )}
                </div>
              ))}
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

        {/* Image manipulation area */}
        <div className="bg-gray-100 rounded-xl overflow-hidden shadow-lg">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
            <div
              className="absolute transition-transform duration-75"
              style={{
                left: `${imageState.x * 100}%`,
                top: `${imageState.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${imageState.scale}) rotate(${imageState.rotation}deg)`,
              }}
            >
              <img
                src={SAMPLE_IMAGES[imageState.imageIndex]}
                alt="Manipulatable"
                className={`w-64 h-48 object-cover rounded-lg shadow-xl ${
                  imageState.isDragging ? 'ring-4 ring-blue-500' : ''
                } ${imageState.isZooming ? 'ring-4 ring-green-500' : ''}`}
                crossOrigin="anonymous"
              />
            </div>

            {/* Zoom indicator */}
            {imageState.isZooming && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Zooming: {Math.round(imageState.scale * 100)}%
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 bg-white">
            <h3 className="font-semibold text-gray-800 mb-2">Controls</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="font-medium">Point + Hold:</span> Move image to finger position</li>
              <li><span className="font-medium">Grab + Hold:</span> Drag image with palm</li>
              <li><span className="font-medium">Two-Hand Pinch:</span> Zoom &amp; rotate (Minority Report style)</li>
              <li><span className="font-medium">Open Palm (1.5s):</span> Reset &amp; next image</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Depth & metrics display */}
      {status === 'running' && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg text-white">
          <h3 className="font-semibold mb-3">Hand Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {handStates.map((state, i) => (
              <div key={i} className="bg-gray-700 rounded p-3">
                {state ? (
                  <>
                    <div className="text-sm text-gray-400 mb-2">
                      {state.side.toUpperCase()} HAND
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Depth:</span>
                        <div className="h-2 bg-gray-600 rounded mt-1">
                          <div
                            className="h-full bg-blue-500 rounded"
                            style={{ width: `${state.depth.normalized * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Spread:</span>
                        <span className="ml-2">{(state.fingerSpread * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Hold:</span>
                        <div className="h-2 bg-gray-600 rounded mt-1">
                          <div
                            className="h-full bg-yellow-500 rounded"
                            style={{ width: `${holdProgress[state.side] * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Size:</span>
                        <span className="ml-2">{(state.handSize * 100).toFixed(0)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No hand detected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gesture legend */}
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Simplified Gestures</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(GESTURE_LABELS)
            .filter(([key]) => key !== 'none')
            .map(([key, label]) => (
              <div
                key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  handStates.some(s => s?.gesture.gesture === key)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white text-gray-600'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  key === 'pinch' ? 'bg-green-500' :
                  key === 'point' ? 'bg-yellow-500' :
                  key === 'grab' ? 'bg-red-500' :
                  key === 'open_palm' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`} />
                <span className="capitalize">{label}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
