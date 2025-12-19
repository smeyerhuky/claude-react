import { useRef, useState, useEffect, useCallback } from 'react';
import { HandTrackingService } from '../ml/handTracking';
import { GestureRecognizer } from '../ml/gestureRecognizer';

// Musical scales - intervals from root (in semitones)
const SCALES = {
  pentatonic: { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9, 12, 14, 16] },
  pentatonicMinor: { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10, 12, 15, 17] },
  major: { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  minor: { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10, 12, 15] },
  dorian: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
};

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const VOICES = {
  warm: { name: 'Warm Pad', type: 'sine', harmonics: [0.4, 0.2] },
  pure: { name: 'Pure Sine', type: 'sine', harmonics: [] },
  bright: { name: 'Bright', type: 'sawtooth', harmonics: [] },
  soft: { name: 'Soft Square', type: 'triangle', harmonics: [0.2] },
};

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const midiToNoteName = (midi) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

export default function HandMusicInstrument() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const recognizersRef = useRef([null, null]);

  // Audio refs
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const voicesRef = useRef({});
  const currentNotesRef = useRef({ left: null, right: null });

  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState({ fps: 0, handsDetected: 0 });
  const [handStates, setHandStates] = useState([null, null]);
  const [audioReady, setAudioReady] = useState(false);

  // Config
  const [config, setConfig] = useState({
    rootNote: 'C',
    octave: 4,
    scale: 'pentatonic',
    voice: 'warm',
    musicEnabled: false,
    masterVolume: 0.3,
  });

  // Active notes display
  const [activeNotes, setActiveNotes] = useState([]);

  // Initialize audio on user click
  const initAudio = useCallback(async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      setAudioReady(true);
      return;
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    // Master gain with limiter
    const master = ctx.createGain();
    master.gain.value = config.masterVolume;

    // Simple compressor to prevent clipping
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;

    master.connect(compressor);
    compressor.connect(ctx.destination);
    masterGainRef.current = master;

    setAudioReady(true);
  }, [config.masterVolume]);

  // Create oscillator voice
  const createVoice = useCallback((frequency, voiceType) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return null;

    const voiceConfig = VOICES[voiceType];
    const now = ctx.currentTime;

    // Main oscillator
    const osc = ctx.createOscillator();
    osc.type = voiceConfig.type;
    osc.frequency.value = frequency;

    // Gain envelope
    const gain = ctx.createGain();
    gain.gain.value = 0;

    // Vibrato LFO
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5;
    vibratoGain.gain.value = 0; // Start with no vibrato
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // Harmonics
    const harmonics = voiceConfig.harmonics.map((amp, i) => {
      const harmOsc = ctx.createOscillator();
      const harmGain = ctx.createGain();
      harmOsc.type = voiceConfig.type;
      harmOsc.frequency.value = frequency * (i + 2);
      harmGain.gain.value = 0;
      harmOsc.connect(harmGain);
      harmGain.connect(masterGainRef.current);
      harmOsc.start(now);
      return { osc: harmOsc, gain: harmGain, amp };
    });

    osc.connect(gain);
    gain.connect(masterGainRef.current);

    osc.start(now);
    vibrato.start(now);

    return { osc, gain, vibrato, vibratoGain, harmonics, frequency };
  }, []);

  // Play note with envelope
  const playNote = useCallback((midiNote, velocity, handId) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !config.musicEnabled) return;

    const freq = midiToFreq(midiNote);
    const now = ctx.currentTime;

    // Stop existing note smoothly
    const existing = voicesRef.current[handId];
    if (existing) {
      existing.gain.gain.cancelScheduledValues(now);
      existing.gain.gain.setTargetAtTime(0, now, 0.1);
      existing.harmonics.forEach(h => h.gain.gain.setTargetAtTime(0, now, 0.1));
      setTimeout(() => {
        try {
          existing.osc.stop();
          existing.vibrato.stop();
          existing.harmonics.forEach(h => h.osc.stop());
        } catch (e) { /* already stopped */ }
      }, 200);
    }

    const voice = createVoice(freq, config.voice);
    if (!voice) return;

    voicesRef.current[handId] = voice;

    // Attack envelope - smooth fade in
    const targetGain = Math.min(0.4, velocity * 0.5);
    voice.gain.gain.setTargetAtTime(targetGain, now, 0.08);
    voice.harmonics.forEach(h => {
      h.gain.gain.setTargetAtTime(targetGain * h.amp, now, 0.08);
    });

    currentNotesRef.current[handId] = midiNote;
    setActiveNotes(prev => [...prev.filter(n => n.handId !== handId), { handId, midiNote, name: midiToNoteName(midiNote) }]);
  }, [config.musicEnabled, config.voice, createVoice]);

  // Update playing note
  const updateNote = useCallback((midiNote, velocity, vibratoAmt, handId) => {
    const ctx = audioCtxRef.current;
    const voice = voicesRef.current[handId];
    if (!ctx || !voice) return;

    const freq = midiToFreq(midiNote);
    const now = ctx.currentTime;

    // Smooth pitch change
    voice.osc.frequency.setTargetAtTime(freq, now, 0.05);
    voice.harmonics.forEach((h, i) => {
      h.osc.frequency.setTargetAtTime(freq * (i + 2), now, 0.05);
    });

    // Update vibrato
    voice.vibratoGain.gain.setTargetAtTime(freq * vibratoAmt * 0.01, now, 0.1);

    // Update volume
    const targetGain = Math.min(0.4, velocity * 0.5);
    voice.gain.gain.setTargetAtTime(targetGain, now, 0.05);

    if (currentNotesRef.current[handId] !== midiNote) {
      currentNotesRef.current[handId] = midiNote;
      setActiveNotes(prev => prev.map(n => n.handId === handId ? { ...n, midiNote, name: midiToNoteName(midiNote) } : n));
    }
  }, []);

  // Stop note with release
  const stopNote = useCallback((handId) => {
    const ctx = audioCtxRef.current;
    const voice = voicesRef.current[handId];
    if (!ctx || !voice) return;

    const now = ctx.currentTime;

    // Release envelope
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0, now, 0.15);
    voice.harmonics.forEach(h => {
      h.gain.gain.setTargetAtTime(0, now, 0.15);
    });

    setTimeout(() => {
      try {
        voice.osc.stop();
        voice.vibrato.stop();
        voice.harmonics.forEach(h => h.osc.stop());
      } catch (e) { /* already stopped */ }
      delete voicesRef.current[handId];
    }, 300);

    currentNotesRef.current[handId] = null;
    setActiveNotes(prev => prev.filter(n => n.handId !== handId));
  }, []);

  // Map Y position to MIDI note
  const yToMidi = useCallback((y, isLeftHand) => {
    const scale = SCALES[config.scale];
    const rootMidi = ROOT_NOTES.indexOf(config.rootNote) + (config.octave + (isLeftHand ? -1 : 0)) * 12 + 12;

    // Invert Y (0=top=high, 1=bottom=low)
    const normalizedY = 1 - Math.max(0.05, Math.min(0.95, y));
    const noteIndex = Math.floor(normalizedY * scale.intervals.length);

    return rootMidi + scale.intervals[Math.min(noteIndex, scale.intervals.length - 1)];
  }, [config.scale, config.rootNote, config.octave]);

  // Handle hand tracking data
  const handleHandData = useCallback((handData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw scale lanes
    const scale = SCALES[config.scale];
    const laneHeight = height / scale.intervals.length;
    scale.intervals.forEach((_, i) => {
      const y = height - (i + 1) * laneHeight;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(55, 65, 81, 0.3)' : 'rgba(75, 85, 99, 0.3)';
      ctx.fillRect(0, y, width, laneHeight);
    });

    const newHandStates = [null, null];

    handData.forEach((hand, idx) => {
      if (!recognizersRef.current[idx]) {
        recognizersRef.current[idx] = new GestureRecognizer(8);
      }

      recognizersRef.current[idx].detectGesture(hand);
      const gesture = recognizersRef.current[idx].getSmoothedPrediction();

      const isLeftHand = hand.handedness === 'Right'; // Mirrored
      const handId = isLeftHand ? 'left' : 'right';

      newHandStates[idx] = { ...hand, gesture, side: handId };

      // Draw hand
      const palmX = (1 - hand.palmCenter.x) * width;
      const palmY = hand.palmCenter.y * height;
      const isPlaying = (gesture.gesture === 'pinch' || gesture.gesture === 'grab') && gesture.held;

      // Palm glow
      const gradient = ctx.createRadialGradient(palmX, palmY, 0, palmX, palmY, 50);
      if (isPlaying && config.musicEnabled) {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.7)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      } else if (gesture.gesture === 'open_palm') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(palmX, palmY, 50, 0, Math.PI * 2);
      ctx.fill();

      // Finger tips
      [4, 8, 12, 16, 20].forEach((tipIdx) => {
        const pt = hand.landmarks[tipIdx];
        ctx.beginPath();
        ctx.arc((1 - pt.x) * width, pt.y * height, 8, 0, Math.PI * 2);
        ctx.fillStyle = isPlaying ? '#22c55e' : '#3b82f6';
        ctx.fill();
      });

      // Music logic - ONLY play when held
      if (config.musicEnabled && audioReady) {
        const y = hand.palmCenter.y;
        const depth = hand.depth?.normalized || 0.5;
        const spread = hand.fingerSpread || 0;

        const midiNote = yToMidi(y, isLeftHand);
        const velocity = 0.3 + depth * 0.5;
        const vibrato = spread * 0.3;

        // Only play when gesture is HELD (deliberate)
        if (isPlaying) {
          if (currentNotesRef.current[handId] === null) {
            playNote(midiNote, velocity, handId);
          } else {
            updateNote(midiNote, velocity, vibrato, handId);
          }

          // Show note
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 16px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(midiToNoteName(midiNote), palmX, palmY - 60);
        } else {
          // Stop if not playing gesture
          if (currentNotesRef.current[handId] !== null) {
            stopNote(handId);
          }
        }
      } else if (currentNotesRef.current[handId] !== null) {
        stopNote(handId);
      }

      // Hand label
      ctx.fillStyle = '#fff';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${handId} - ${gesture.gesture}${gesture.held ? ' (held)' : ''}`, palmX, palmY + 60);
    });

    // Stop notes for missing hands
    if (handData.length < 2 && currentNotesRef.current.left !== null && !handData.some(h => h.handedness === 'Right')) {
      stopNote('left');
    }
    if (handData.length < 2 && currentNotesRef.current.right !== null && !handData.some(h => h.handedness === 'Left')) {
      stopNote('right');
    }

    setHandStates(newHandStates);
    if (trackerRef.current) setStats(trackerRef.current.getPerformanceStats());
  }, [config, audioReady, yToMidi, playNote, updateNote, stopNote]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus('loading');

    await initAudio();

    try {
      trackerRef.current = new HandTrackingService(videoRef.current, {
        maxNumHands: 2,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });

      recognizersRef.current = [new GestureRecognizer(8), new GestureRecognizer(8)];
      await trackerRef.current.initialize();
      trackerRef.current.subscribe(handleHandData);
      setStatus('running');
    } catch (error) {
      console.error('Failed to initialize:', error);
      setStatus('error');
    }
  }, [handleHandData, initAudio]);

  const stopTracking = useCallback(() => {
    Object.keys(voicesRef.current).forEach(stopNote);
    if (trackerRef.current) {
      trackerRef.current.destroy();
      trackerRef.current = null;
    }
    setStatus('idle');
    setHandStates([null, null]);
    setActiveNotes([]);
  }, [stopNote]);

  useEffect(() => {
    return () => {
      Object.values(voicesRef.current).forEach(v => {
        try { v.osc.stop(); v.vibrato.stop(); } catch (e) {}
      });
      trackerRef.current?.destroy();
      audioCtxRef.current?.close();
    };
  }, []);

  const scaleNotes = SCALES[config.scale].intervals.map((interval, i) => {
    const midi = ROOT_NOTES.indexOf(config.rootNote) + config.octave * 12 + 12 + interval;
    return midiToNoteName(midi);
  });

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main view */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl overflow-hidden">
          <div className="relative aspect-[4/3] bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-30" />
            <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full" />

            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎵</div>
                  <p className="text-gray-300 mb-4">Hand Music Instrument</p>
                  <button onClick={startTracking} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                    Start
                  </button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="animate-spin text-4xl">⏳</div>
              </div>
            )}

            {status === 'running' && (
              <>
                <div className="absolute top-3 left-3 bg-black/70 px-3 py-2 rounded text-sm">
                  <div className="text-green-400">{stats.fps} FPS</div>
                </div>
                <div className={`absolute top-3 right-3 px-4 py-2 rounded-full text-sm font-bold ${config.musicEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {config.musicEnabled ? '🎵 ON' : '🔇 OFF'}
                </div>
                {activeNotes.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    {activeNotes.map((n, i) => (
                      <span key={i} className="px-3 py-1 bg-green-600 text-white rounded font-mono text-lg">{n.name}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 bg-gray-800 flex justify-between items-center">
            <span className="text-gray-400 text-sm">{config.rootNote} {SCALES[config.scale].name}</span>
            {status === 'running' && (
              <button onClick={stopTracking} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Stop</button>
            )}
          </div>
        </div>

        {/* Config */}
        <div className="space-y-4">
          {/* Music toggle */}
          <div className="bg-white rounded-xl p-4 shadow">
            <button
              onClick={() => setConfig(p => ({ ...p, musicEnabled: !p.musicEnabled }))}
              className={`w-full py-4 rounded-lg font-bold text-lg ${config.musicEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {config.musicEnabled ? '🎵 Music ON' : '🔇 Music OFF'}
            </button>
          </div>

          {/* Scale */}
          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-semibold mb-2">Scale</h3>
            <select
              value={config.scale}
              onChange={(e) => setConfig(p => ({ ...p, scale: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              {Object.entries(SCALES).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>

            <h3 className="font-semibold mt-4 mb-2">Root Note</h3>
            <div className="grid grid-cols-6 gap-1">
              {ROOT_NOTES.map(n => (
                <button
                  key={n}
                  onClick={() => setConfig(p => ({ ...p, rootNote: n }))}
                  className={`py-1 text-xs rounded ${config.rootNote === n ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                >
                  {n}
                </button>
              ))}
            </div>

            <h3 className="font-semibold mt-4 mb-2">Octave: {config.octave}</h3>
            <input
              type="range" min="2" max="6" value={config.octave}
              onChange={(e) => setConfig(p => ({ ...p, octave: +e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Voice */}
          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-semibold mb-2">Voice</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(VOICES).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setConfig(p => ({ ...p, voice: k }))}
                  className={`py-2 text-sm rounded ${config.voice === k ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Scale notes */}
          <div className="bg-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notes in Scale</h3>
            <div className="flex flex-wrap gap-1">
              {scaleNotes.map((n, i) => (
                <span key={i} className={`px-2 py-1 text-xs rounded ${activeNotes.some(a => a.name === n) ? 'bg-green-500 text-white' : 'bg-white'}`}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">How to Play</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700">Gestures (must HOLD)</h4>
            <ul className="mt-1 space-y-1">
              <li><b>Pinch + Hold:</b> Play note</li>
              <li><b>Grab + Hold:</b> Play note</li>
              <li><b>Open Palm:</b> Stop/mute</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Expression</h4>
            <ul className="mt-1 space-y-1">
              <li><b>Hand Height:</b> Pitch (high = high note)</li>
              <li><b>Depth:</b> Volume</li>
              <li><b>Finger Spread:</b> Vibrato</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
