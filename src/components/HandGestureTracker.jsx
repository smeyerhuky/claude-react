import { useRef, useState, useEffect, useCallback } from 'react';
import { HandTrackingService } from '../ml/handTracking';
import { GestureRecognizer } from '../ml/gestureRecognizer';

const GESTURE_ICONS = {
  open_palm: '🖐️',
  point: '👆',
  peace: '✌️',
  ok: '👌',
  pinch: '🤏',
  fist: '✊',
  wave: '👋',
  rock: '🤘',
  unknown: '❓',
};

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export default function HandGestureTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const recognizerRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [gesture, setGesture] = useState({ gesture: 'unknown', confidence: 0 });
  const [stats, setStats] = useState({ fps: 0, handsDetected: 0 });

  const drawHands = useCallback((handData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    handData.forEach((hand) => {
      const { landmarks } = hand;

      // Draw connections
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;

      // Palm connections
      const palmPoints = [0, 1, 2, 5, 9, 13, 17, 0];
      ctx.beginPath();
      palmPoints.forEach((idx, i) => {
        const x = (1 - landmarks[idx].x) * width;
        const y = landmarks[idx].y * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw finger tips
      FINGER_TIPS.forEach((tipIdx, i) => {
        const point = landmarks[tipIdx];
        const x = (1 - point.x) * width;
        const y = point.y * height;

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = FINGER_COLORS[i];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw wrist
      const wrist = landmarks[0];
      ctx.beginPath();
      ctx.arc((1 - wrist.x) * width, wrist.y * height, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    });
  }, []);

  const handleHandData = useCallback((handData) => {
    drawHands(handData);

    if (handData.length > 0 && recognizerRef.current) {
      recognizerRef.current.detectGesture(handData[0]);
      const smoothed = recognizerRef.current.getSmoothedPrediction();
      setGesture(smoothed);
    } else {
      setGesture({ gesture: 'unknown', confidence: 0 });
    }

    if (trackerRef.current) {
      setStats(trackerRef.current.getPerformanceStats());
    }
  }, [drawHands]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current) return;

    setStatus('loading');

    try {
      trackerRef.current = new HandTrackingService(videoRef.current, {
        maxNumHands: 2,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      recognizerRef.current = new GestureRecognizer(5);

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
    if (recognizerRef.current) {
      recognizerRef.current.reset();
    }
    setStatus('idle');
    setGesture({ gesture: 'unknown', confidence: 0 });
  }, []);

  useEffect(() => {
    return () => {
      if (trackerRef.current) {
        trackerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
        {/* Video/Canvas container */}
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full"
          />

          {/* Status overlay */}
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="text-6xl mb-4">🖐️</div>
                <p className="text-gray-300 mb-4">Hand Gesture Tracker</p>
                <button
                  onClick={startTracking}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Camera
                </button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-300">Loading MediaPipe...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-red-400 mb-4">Failed to initialize camera</p>
                <button
                  onClick={startTracking}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Stats overlay */}
          {status === 'running' && (
            <div className="absolute top-3 left-3 bg-black/60 px-3 py-2 rounded-lg text-sm">
              <div className="text-green-400">{stats.fps} FPS</div>
              <div className="text-gray-400">
                {stats.handsDetected} hand{stats.handsDetected !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Gesture display */}
        <div className="p-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{GESTURE_ICONS[gesture.gesture]}</span>
              <div>
                <div className="text-white font-medium capitalize">
                  {gesture.gesture.replace('_', ' ')}
                </div>
                <div className="text-gray-400 text-sm">
                  {Math.round(gesture.confidence * 100)}% confidence
                </div>
              </div>
            </div>

            {status === 'running' && (
              <button
                onClick={stopTracking}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gesture legend */}
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Supported Gestures</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(GESTURE_ICONS)
            .filter(([key]) => key !== 'unknown')
            .map(([key, icon]) => (
              <div
                key={key}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                  gesture.gesture === key
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white text-gray-600'
                }`}
              >
                <span>{icon}</span>
                <span className="capitalize">{key.replace('_', ' ')}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
