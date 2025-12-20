import { useRef, useState, useEffect, useCallback } from 'react';
import { HandTrackingService } from '../ml/handTracking';
import { GestureRecognizer } from '../ml/gestureRecognizer';

// Simple pentatonic scale - always sounds good
const SCALES = {
  pentatonic: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21], // Extended pentatonic
  major: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16],
  minor: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15],
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const midiToName = (midi) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

export default function HandMusicInstrument() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const recognizerRef = useRef(null);

  // Audio
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeVoiceRef = useRef(null);
  const lastNoteRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [audioReady, setAudioReady] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [gesture, setGesture] = useState('none');
  const [isPlaying, setIsPlaying] = useState(false);

  // Simple config
  const [volume, setVolume] = useState(50);
  const [scale, setScale] = useState('pentatonic');
  const [octave, setOctave] = useState(4);
  const [mode, setMode] = useState('hold'); // 'hold' or 'pluck'

  // Initialize audio with user interaction
  const initAudio = useCallback(async () => {
    if (audioCtxRef.current?.state === 'running') {
      setAudioReady(true);
      return true;
    }

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Resume if suspended (required by browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create master gain
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume / 100, ctx.currentTime);
      master.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = master;
      setAudioReady(true);

      console.log('Audio initialized, state:', ctx.state);
      return true;
    } catch (err) {
      console.error('Audio init failed:', err);
      return false;
    }
  }, [volume]);

  // Update volume when slider changes
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      masterGainRef.current.gain.setTargetAtTime(volume / 100, now, 0.1);
    }
  }, [volume]);

  // Test beep to verify audio works
  const playTestBeep = useCallback(async () => {
    const ready = await initAudio();
    if (!ready) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 440;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(gain);
    gain.connect(masterGainRef.current);

    osc.start(now);
    osc.stop(now + 0.4);
  }, [initAudio]);

  // Play a note
  const playNote = useCallback((midiNote) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;

    const now = ctx.currentTime;
    const freq = midiToFreq(midiNote);

    // Stop previous note
    if (activeVoiceRef.current) {
      try {
        activeVoiceRef.current.gain.gain.setTargetAtTime(0, now, 0.05);
        setTimeout(() => {
          try { activeVoiceRef.current?.osc.stop(); } catch(e) {}
        }, 100);
      } catch(e) {}
    }

    // Create new voice
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Quick attack
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.02);

    osc.connect(gain);
    gain.connect(masterGainRef.current);

    osc.start(now);
    activeVoiceRef.current = { osc, gain };
    lastNoteRef.current = midiNote;

    setCurrentNote(midiToName(midiNote));
    setIsPlaying(true);
  }, []);

  // Stop note
  const stopNote = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !activeVoiceRef.current) return;

    const now = ctx.currentTime;

    try {
      activeVoiceRef.current.gain.gain.setTargetAtTime(0, now, 0.1);
      const voice = activeVoiceRef.current;
      setTimeout(() => {
        try { voice.osc.stop(); } catch(e) {}
      }, 200);
    } catch(e) {}

    activeVoiceRef.current = null;
    lastNoteRef.current = null;
    setCurrentNote(null);
    setIsPlaying(false);
  }, []);

  // Map Y position to note
  const yToNote = useCallback((y) => {
    const scaleNotes = SCALES[scale];
    const baseNote = 12 + octave * 12; // C of selected octave

    // y: 0 = top (high), 1 = bottom (low)
    const invY = 1 - Math.max(0, Math.min(1, y));
    const noteIdx = Math.floor(invY * scaleNotes.length);
    const interval = scaleNotes[Math.min(noteIdx, scaleNotes.length - 1)];

    return baseNote + interval;
  }, [scale, octave]);

  // Handle hand data
  const handleHandData = useCallback((handData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Draw note lanes
    const scaleNotes = SCALES[scale];
    const laneH = height / scaleNotes.length;
    scaleNotes.forEach((interval, i) => {
      const y = height - (i + 1) * laneH;
      const noteNum = 12 + octave * 12 + interval;
      const noteName = midiToName(noteNum);

      // Lane background
      ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#374151';
      ctx.fillRect(0, y, width, laneH);

      // Note label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(noteName, 10, y + laneH / 2 + 4);

      // Highlight if this is current note
      if (currentNote === noteName) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.fillRect(0, y, width, laneH);
      }
    });

    if (handData.length === 0) {
      if (isPlaying && mode === 'hold') stopNote();
      setGesture('none');
      return;
    }

    const hand = handData[0];

    // Update recognizer
    if (!recognizerRef.current) {
      recognizerRef.current = new GestureRecognizer(6);
    }
    recognizerRef.current.detectGesture(hand);
    const gestureResult = recognizerRef.current.getSmoothedPrediction();
    setGesture(gestureResult.gesture);

    // Get hand position (mirrored)
    const handX = (1 - hand.palmCenter.x) * width;
    const handY = hand.palmCenter.y * height;

    // Determine if should play
    const shouldPlay = mode === 'hold'
      ? (gestureResult.gesture === 'pinch' || gestureResult.gesture === 'grab')
      : (gestureResult.gesture === 'pinch'); // Pluck mode - just pinch

    // Get note for current position
    const noteNum = yToNote(hand.palmCenter.y);

    if (shouldPlay && audioReady) {
      // Play or update note
      if (!isPlaying || lastNoteRef.current !== noteNum) {
        playNote(noteNum);
      }
    } else if (isPlaying) {
      // In pluck mode, note continues until open palm
      if (mode === 'pluck') {
        if (gestureResult.gesture === 'open_palm') {
          stopNote();
        }
      } else {
        stopNote();
      }
    }

    // Draw hand indicator
    const indicatorColor = isPlaying ? '#22c55e' :
                          shouldPlay ? '#fbbf24' : '#3b82f6';

    // Glow
    const gradient = ctx.createRadialGradient(handX, handY, 0, handX, handY, 60);
    gradient.addColorStop(0, indicatorColor + '99');
    gradient.addColorStop(1, indicatorColor + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(handX, handY, 60, 0, Math.PI * 2);
    ctx.fill();

    // Center dot
    ctx.beginPath();
    ctx.arc(handX, handY, 15, 0, Math.PI * 2);
    ctx.fillStyle = indicatorColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gesture label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(gestureResult.gesture.toUpperCase(), handX, handY + 45);

  }, [scale, octave, mode, audioReady, yToNote, playNote, stopNote, isPlaying, currentNote]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus('loading');

    // Init audio first
    await initAudio();

    try {
      trackerRef.current = new HandTrackingService(videoRef.current, {
        maxNumHands: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      recognizerRef.current = new GestureRecognizer(6);
      await trackerRef.current.initialize();
      trackerRef.current.subscribe(handleHandData);

      setStatus('running');
    } catch (err) {
      console.error('Tracking failed:', err);
      setStatus('error');
    }
  }, [handleHandData, initAudio]);

  // Stop
  const stopTracking = useCallback(() => {
    stopNote();
    trackerRef.current?.destroy();
    trackerRef.current = null;
    setStatus('idle');
    setGesture('none');
  }, [stopNote]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopNote();
      trackerRef.current?.destroy();
      audioCtxRef.current?.close();
    };
  }, [stopNote]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Main area */}
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl">
        <div className="relative aspect-video bg-black">
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
            height={360}
            className="absolute inset-0 w-full h-full"
          />

          {/* Idle state */}
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95">
              <div className="text-center max-w-md px-4">
                <div className="text-6xl mb-4">🎹</div>
                <h2 className="text-2xl font-bold text-white mb-2">Hand Music</h2>
                <p className="text-gray-400 mb-6">
                  Control music with your hand. Move up/down to change notes.
                </p>
                <button
                  onClick={startTracking}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700"
                >
                  Start
                </button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95">
              <div className="text-5xl animate-spin">⏳</div>
            </div>
          )}

          {/* Playing indicator */}
          {status === 'running' && currentNote && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-500 text-white rounded-full font-bold text-2xl">
              {currentNote}
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="p-4 bg-gray-800 space-y-4">
          {/* Volume + Test */}
          <div className="flex items-center gap-4">
            <span className="text-white text-sm w-16">Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-gray-400 w-12 text-right">{volume}%</span>
            <button
              onClick={playTestBeep}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Test
            </button>
          </div>

          {/* Mode selector */}
          <div className="flex items-center gap-4">
            <span className="text-white text-sm w-16">Mode</span>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('hold')}
                className={`px-4 py-2 rounded font-medium ${
                  mode === 'hold' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Hold (Pinch = Play)
              </button>
              <button
                onClick={() => setMode('pluck')}
                className={`px-4 py-2 rounded font-medium ${
                  mode === 'pluck' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Pluck (Pinch = Trigger)
              </button>
            </div>
          </div>

          {/* Scale + Octave */}
          <div className="flex items-center gap-4">
            <span className="text-white text-sm w-16">Scale</span>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded"
            >
              <option value="pentatonic">Pentatonic (Easy)</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>

            <span className="text-white text-sm ml-4">Octave</span>
            <input
              type="range"
              min="2"
              max="6"
              value={octave}
              onChange={(e) => setOctave(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-gray-400">{octave}</span>

            {status === 'running' && (
              <button
                onClick={stopTracking}
                className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-white rounded-xl p-4 shadow">
        <h3 className="font-bold text-gray-800 mb-3">How to Play</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤏</span>
              <div>
                <b>Pinch</b> - {mode === 'hold' ? 'Hold to play notes' : 'Trigger a note'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🖐️</span>
              <div>
                <b>Open Palm</b> - {mode === 'hold' ? 'Notes stop automatically' : 'Stop the note'}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⬆️⬇️</span>
              <div>
                <b>Move Hand Up/Down</b> - Change pitch
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔊</span>
              <div>
                <b>Volume Slider</b> - Adjust loudness
              </div>
            </div>
          </div>
        </div>

        {/* Current state */}
        {status === 'running' && (
          <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm">
            <span className="text-gray-500">Gesture:</span>
            <span className={`font-bold ${gesture === 'pinch' ? 'text-green-600' : 'text-gray-700'}`}>
              {gesture || 'none'}
            </span>
            <span className="text-gray-500 ml-4">Playing:</span>
            <span className={`font-bold ${isPlaying ? 'text-green-600' : 'text-gray-400'}`}>
              {currentNote || 'None'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
