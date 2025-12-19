import { useRef, useState, useEffect, useCallback } from 'react';
import { HandTrackingService } from '../ml/handTracking';
import { GestureRecognizer } from '../ml/gestureRecognizer';

// Musical scales - intervals from root (in semitones)
const SCALES = {
  major: { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  minor: { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  pentatonic: { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9, 12] },
  pentatonicMinor: { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10, 12] },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10, 12] },
  dorian: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
  mixolydian: { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10, 12] },
  phrygian: { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10, 12] },
  wholeTone: { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10, 12] },
  chromatic: { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
};

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Voice types with different timbres
const VOICES = {
  sine: { name: 'Pure Tone', type: 'sine', harmonics: [] },
  warm: { name: 'Warm Pad', type: 'sine', harmonics: [0.5, 0.25, 0.125] },
  bright: { name: 'Bright Lead', type: 'sawtooth', harmonics: [] },
  hollow: { name: 'Hollow', type: 'square', harmonics: [] },
  ethereal: { name: 'Ethereal', type: 'triangle', harmonics: [0.3, 0.15] },
};

// Convert MIDI note to frequency
const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Get note name from MIDI
const midiToNoteName = (midi) => {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
};

export default function HandMusicInstrument() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const recognizersRef = useRef([null, null]);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const voicesRef = useRef({});
  const lastNotesRef = useRef({ left: null, right: null });

  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState({ fps: 0, handsDetected: 0 });
  const [handStates, setHandStates] = useState([null, null]);

  // Music configuration
  const [config, setConfig] = useState({
    rootNote: 'C',
    octave: 4,
    scale: 'pentatonic',
    voice: 'warm',
    // Conductor mode - music only plays when enabled
    musicEnabled: false,
    // Which hand controls what
    leftHandMode: 'bass', // bass, chord, or off
    rightHandMode: 'melody', // melody, lead, or off
    // Dynamics
    volumeSensitivity: 0.8,
    pitchRange: 2, // octaves
    vibratoAmount: 0.3,
    attackTime: 0.05,
    releaseTime: 0.3,
  });

  // Current musical state
  const [musicState, setMusicState] = useState({
    activeNotes: [],
    currentChord: null,
    dynamics: 0.5,
    isPlaying: false,
  });

  // Initialize Web Audio
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    masterGainRef.current = audioContextRef.current.createGain();
    masterGainRef.current.gain.value = 0;
    masterGainRef.current.connect(audioContextRef.current.destination);
  }, []);

  // Create a voice (oscillator + gain)
  const createVoice = useCallback((frequency, voiceType, handId) => {
    if (!audioContextRef.current) return null;

    const ctx = audioContextRef.current;
    const voiceConfig = VOICES[voiceType];

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const vibratoOsc = ctx.createOscillator();
    const vibratoGain = ctx.createGain();

    oscillator.type = voiceConfig.type;
    oscillator.frequency.value = frequency;

    // Vibrato LFO
    vibratoOsc.frequency.value = 5;
    vibratoGain.gain.value = frequency * config.vibratoAmount * 0.02;
    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(oscillator.frequency);
    vibratoOsc.start();

    // Additional harmonics for richer sound
    const harmonicOscs = voiceConfig.harmonics.map((amp, i) => {
      const harmOsc = ctx.createOscillator();
      const harmGain = ctx.createGain();
      harmOsc.type = voiceConfig.type;
      harmOsc.frequency.value = frequency * (i + 2);
      harmGain.gain.value = amp;
      harmOsc.connect(harmGain);
      harmGain.connect(gainNode);
      harmOsc.start();
      return { osc: harmOsc, gain: harmGain };
    });

    gainNode.gain.value = 0;
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    oscillator.start();

    return {
      oscillator,
      gainNode,
      vibratoOsc,
      vibratoGain,
      harmonicOscs,
      frequency,
    };
  }, [config.vibratoAmount]);

  // Play a note with attack envelope
  const playNote = useCallback((midiNote, velocity, handId) => {
    if (!audioContextRef.current || !config.musicEnabled) return;

    const frequency = midiToFreq(midiNote);
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // Stop existing voice for this hand
    if (voicesRef.current[handId]) {
      const oldVoice = voicesRef.current[handId];
      oldVoice.gainNode.gain.cancelScheduledValues(now);
      oldVoice.gainNode.gain.setValueAtTime(oldVoice.gainNode.gain.value, now);
      oldVoice.gainNode.gain.exponentialApproachValueAtTime(0.001, now, config.releaseTime / 2);
      setTimeout(() => {
        oldVoice.oscillator.stop();
        oldVoice.vibratoOsc.stop();
        oldVoice.harmonicOscs.forEach(h => h.osc.stop());
      }, config.releaseTime * 1000);
    }

    const voice = createVoice(frequency, config.voice, handId);
    if (!voice) return;

    voicesRef.current[handId] = voice;

    // Attack envelope
    const targetGain = velocity * config.volumeSensitivity;
    voice.gainNode.gain.setValueAtTime(0.001, now);
    voice.gainNode.gain.exponentialApproachValueAtTime(targetGain, now, config.attackTime);

    lastNotesRef.current[handId] = midiNote;

    setMusicState(prev => ({
      ...prev,
      activeNotes: [...prev.activeNotes.filter(n => n.handId !== handId), { handId, midiNote, frequency }],
      isPlaying: true,
    }));
  }, [config, createVoice]);

  // Update note (pitch bend / modulation)
  const updateNote = useCallback((midiNote, velocity, vibrato, handId) => {
    const voice = voicesRef.current[handId];
    if (!voice || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const frequency = midiToFreq(midiNote);

    // Smooth pitch transition
    voice.oscillator.frequency.cancelScheduledValues(now);
    voice.oscillator.frequency.setValueAtTime(voice.oscillator.frequency.value, now);
    voice.oscillator.frequency.exponentialApproachValueAtTime(frequency, now, 0.05);

    // Update harmonics
    voice.harmonicOscs.forEach((h, i) => {
      h.osc.frequency.cancelScheduledValues(now);
      h.osc.frequency.exponentialApproachValueAtTime(frequency * (i + 2), now, 0.05);
    });

    // Update vibrato intensity
    voice.vibratoGain.gain.value = frequency * vibrato * 0.02;

    // Update volume
    const targetGain = velocity * config.volumeSensitivity;
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialApproachValueAtTime(Math.max(0.001, targetGain), now, 0.05);

    lastNotesRef.current[handId] = midiNote;
  }, [config.volumeSensitivity]);

  // Stop a note with release envelope
  const stopNote = useCallback((handId) => {
    const voice = voicesRef.current[handId];
    if (!voice || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialApproachValueAtTime(0.001, now, config.releaseTime);

    setTimeout(() => {
      voice.oscillator.stop();
      voice.vibratoOsc.stop();
      voice.harmonicOscs.forEach(h => h.osc.stop());
      delete voicesRef.current[handId];
    }, config.releaseTime * 1000 + 100);

    lastNotesRef.current[handId] = null;

    setMusicState(prev => ({
      ...prev,
      activeNotes: prev.activeNotes.filter(n => n.handId !== handId),
      isPlaying: prev.activeNotes.length > 1,
    }));
  }, [config.releaseTime]);

  // Map hand Y position to MIDI note in current scale
  const yToMidi = useCallback((y, isLeftHand) => {
    const scale = SCALES[config.scale];
    const rootMidi = ROOT_NOTES.indexOf(config.rootNote) + (config.octave + (isLeftHand ? -1 : 0)) * 12 + 12;

    // Y from 0 (top) to 1 (bottom) - invert so higher hand = higher pitch
    const normalizedY = 1 - Math.max(0, Math.min(1, y));

    // Map to scale degrees across pitch range
    const totalNotes = scale.intervals.length * config.pitchRange;
    const noteIndex = Math.floor(normalizedY * totalNotes);

    const octaveOffset = Math.floor(noteIndex / scale.intervals.length);
    const scaleIndex = noteIndex % scale.intervals.length;

    return rootMidi + scale.intervals[scaleIndex] + (octaveOffset * 12);
  }, [config.scale, config.rootNote, config.octave, config.pitchRange]);

  // Get scale notes for display
  const getScaleNotes = useCallback(() => {
    const scale = SCALES[config.scale];
    const rootMidi = ROOT_NOTES.indexOf(config.rootNote) + config.octave * 12 + 12;

    return scale.intervals.map(interval => {
      const midi = rootMidi + interval;
      return {
        midi,
        name: midiToNoteName(midi),
        frequency: midiToFreq(midi),
      };
    });
  }, [config.scale, config.rootNote, config.octave]);

  const handleHandData = useCallback((handData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw scale visualization
    drawScaleVisualization(ctx, width, height);

    const newHandStates = [null, null];

    handData.forEach((hand, idx) => {
      if (!recognizersRef.current[idx]) {
        recognizersRef.current[idx] = new GestureRecognizer(3);
      }

      recognizersRef.current[idx].detectGesture(hand);
      const gesture = recognizersRef.current[idx].getSmoothedPrediction();

      const isLeftHand = hand.handedness === 'Right'; // Mirrored
      const handId = isLeftHand ? 'left' : 'right';
      const handMode = isLeftHand ? config.leftHandMode : config.rightHandMode;

      newHandStates[idx] = {
        ...hand,
        gesture,
        side: handId,
        mode: handMode,
      };

      // Draw hand
      drawHand(ctx, hand, width, height, gesture, handId);

      // Process music based on gesture and mode
      if (config.musicEnabled && handMode !== 'off') {
        const y = hand.palmCenter.y;
        const x = 1 - hand.palmCenter.x; // Mirror
        const depth = hand.depth.normalized;
        const spread = hand.fingerSpread;

        const midiNote = yToMidi(y, isLeftHand);
        const velocity = 0.3 + depth * 0.7; // Depth controls volume
        const vibrato = spread * config.vibratoAmount; // Spread controls vibrato

        if (gesture.gesture === 'pinch' || gesture.gesture === 'grab') {
          // Playing - pinch or grab triggers/sustains notes
          if (lastNotesRef.current[handId] !== midiNote) {
            playNote(midiNote, velocity, handId);
          } else {
            updateNote(midiNote, velocity, vibrato, handId);
          }

          // Draw note indicator
          drawNoteIndicator(ctx, x * width, y * height, midiNote, true);
        } else if (gesture.gesture === 'point') {
          // Pointing - preview note without sustain
          if (lastNotesRef.current[handId] !== midiNote) {
            playNote(midiNote, velocity * 0.5, handId);
          }
          drawNoteIndicator(ctx, x * width, y * height, midiNote, false);
        } else if (gesture.gesture === 'open_palm') {
          // Open palm - stop note (conductor cut)
          if (lastNotesRef.current[handId] !== null) {
            stopNote(handId);
          }
        } else {
          // Other gestures - gentle fade
          if (lastNotesRef.current[handId] !== null && gesture.gesture === 'none') {
            stopNote(handId);
          }
        }
      } else if (lastNotesRef.current[handId] !== null) {
        stopNote(handId);
      }
    });

    // Check for conductor gestures (two hands)
    if (handData.length === 2) {
      const gesture1 = newHandStates[0]?.gesture;
      const gesture2 = newHandStates[1]?.gesture;

      // Both open palms held = toggle music
      if (gesture1?.gesture === 'open_palm' && gesture2?.gesture === 'open_palm' &&
          gesture1.held && gesture2.held && gesture1.holdDuration > 1000 && gesture2.holdDuration > 1000) {
        // Toggle on first detection
        if (!config._togglePending) {
          setConfig(prev => ({ ...prev, musicEnabled: !prev.musicEnabled, _togglePending: true }));
        }
      } else {
        setConfig(prev => ({ ...prev, _togglePending: false }));
      }
    }

    setHandStates(newHandStates);

    if (trackerRef.current) {
      setStats(trackerRef.current.getPerformanceStats());
    }
  }, [config, yToMidi, playNote, updateNote, stopNote]);

  const drawScaleVisualization = (ctx, width, height) => {
    const scaleNotes = getScaleNotes();
    const noteHeight = height / (scaleNotes.length + 1);

    ctx.globalAlpha = 0.3;
    scaleNotes.forEach((note, i) => {
      const y = height - (i + 1) * noteHeight;
      const isActive = musicState.activeNotes.some(n => n.midiNote % 12 === note.midi % 12);

      // Note lane
      ctx.fillStyle = isActive ? '#22c55e' : '#374151';
      ctx.fillRect(0, y - noteHeight / 2, width, noteHeight - 2);

      // Note label
      ctx.fillStyle = isActive ? '#fff' : '#9ca3af';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(note.name, 10, y + 4);
    });
    ctx.globalAlpha = 1;
  };

  const drawHand = (ctx, hand, width, height, gesture, handId) => {
    const { landmarks, depth } = hand;
    const isPlaying = gesture.gesture === 'pinch' || gesture.gesture === 'grab';

    // Palm glow based on state
    const palmX = (1 - hand.palmCenter.x) * width;
    const palmY = hand.palmCenter.y * height;
    const glowRadius = 40 + depth.normalized * 30;

    const gradient = ctx.createRadialGradient(palmX, palmY, 0, palmX, palmY, glowRadius);
    if (isPlaying && config.musicEnabled) {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
    } else if (gesture.gesture === 'open_palm') {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(palmX, palmY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Finger tips
    const fingerTips = [4, 8, 12, 16, 20];
    fingerTips.forEach((tipIdx) => {
      const point = landmarks[tipIdx];
      const x = (1 - point.x) * width;
      const y = point.y * height;
      const size = 6 + depth.normalized * 6;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = isPlaying ? '#22c55e' : '#3b82f6';
      ctx.fill();
    });

    // Hand label
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(
      `${handId.toUpperCase()} - ${gesture.gesture}`,
      palmX,
      palmY - glowRadius - 10
    );
  };

  const drawNoteIndicator = (ctx, x, y, midiNote, isPlaying) => {
    const noteName = midiToNoteName(midiNote);

    // Note bubble
    ctx.beginPath();
    ctx.roundRect(x - 25, y - 35, 50, 25, 8);
    ctx.fillStyle = isPlaying ? '#22c55e' : '#6b7280';
    ctx.fill();

    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(noteName, x, y - 18);

    // Frequency
    ctx.font = '10px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${Math.round(midiToFreq(midiNote))}Hz`, x, y - 6);
  };

  const startTracking = useCallback(async () => {
    if (!videoRef.current) return;

    setStatus('loading');
    initAudio();

    try {
      trackerRef.current = new HandTrackingService(videoRef.current, {
        maxNumHands: 2,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      recognizersRef.current = [new GestureRecognizer(3), new GestureRecognizer(3)];

      await trackerRef.current.initialize();
      trackerRef.current.subscribe(handleHandData);

      // Enable master volume
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = 0.5;
      }

      setStatus('running');
    } catch (error) {
      console.error('Failed to initialize:', error);
      setStatus('error');
    }
  }, [handleHandData, initAudio]);

  const stopTracking = useCallback(() => {
    // Stop all notes
    Object.keys(voicesRef.current).forEach(stopNote);

    if (trackerRef.current) {
      trackerRef.current.destroy();
      trackerRef.current = null;
    }
    recognizersRef.current = [null, null];
    setStatus('idle');
    setHandStates([null, null]);
    setMusicState({ activeNotes: [], currentChord: null, dynamics: 0.5, isPlaying: false });
  }, [stopNote]);

  useEffect(() => {
    return () => {
      Object.keys(voicesRef.current).forEach(id => {
        const voice = voicesRef.current[id];
        if (voice) {
          voice.oscillator.stop();
          voice.vibratoOsc.stop();
        }
      });
      if (trackerRef.current) {
        trackerRef.current.destroy();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const scaleNotes = getScaleNotes();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Camera/Performance view */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
          <div className="relative aspect-[4/3] bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-30"
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
                  <div className="text-6xl mb-4">🎵🖐️</div>
                  <p className="text-gray-300 mb-4">Hand Music Instrument</p>
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
                <div className="animate-spin text-4xl">⏳</div>
              </div>
            )}

            {/* Music status indicator */}
            {status === 'running' && (
              <>
                <div className="absolute top-3 left-3 bg-black/60 px-3 py-2 rounded-lg text-sm">
                  <div className="text-green-400">{stats.fps} FPS</div>
                  <div className="text-gray-400">{stats.handsDetected} hands</div>
                </div>

                <div className={`absolute top-3 right-3 px-4 py-2 rounded-full text-sm font-medium ${
                  config.musicEnabled ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {config.musicEnabled ? '🎵 MUSIC ON' : '🔇 MUSIC OFF'}
                </div>

                {/* Active notes display */}
                {musicState.activeNotes.length > 0 && (
                  <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-2 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Playing:</div>
                    <div className="flex gap-2">
                      {musicState.activeNotes.map((note, i) => (
                        <span key={i} className="px-2 py-1 bg-green-600 text-white rounded text-sm font-mono">
                          {midiToNoteName(note.midiNote)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls bar */}
          <div className="p-3 bg-gray-800 flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span className="text-gray-400">
                {config.rootNote} {SCALES[config.scale].name}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{VOICES[config.voice].name}</span>
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

        {/* Configuration panel */}
        <div className="space-y-4">
          {/* Music toggle */}
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Conductor Control</h3>
            <button
              onClick={() => setConfig(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }))}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                config.musicEnabled
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {config.musicEnabled ? '🎵 Music Playing' : '🔇 Music Off'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Or hold both palms open for 1s to toggle
            </p>
          </div>

          {/* Scale & Key */}
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Scale & Key</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Root Note</label>
                <div className="grid grid-cols-6 gap-1">
                  {ROOT_NOTES.map(note => (
                    <button
                      key={note}
                      onClick={() => setConfig(prev => ({ ...prev, rootNote: note }))}
                      className={`py-1 text-xs font-medium rounded ${
                        config.rootNote === note
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Scale</label>
                <select
                  value={config.scale}
                  onChange={(e) => setConfig(prev => ({ ...prev, scale: e.target.value }))}
                  className="w-full p-2 border rounded text-sm"
                >
                  {Object.entries(SCALES).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Octave: {config.octave}</label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={config.octave}
                  onChange={(e) => setConfig(prev => ({ ...prev, octave: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Voice */}
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Voice</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(VOICES).map(([key, { name }]) => (
                <button
                  key={key}
                  onClick={() => setConfig(prev => ({ ...prev, voice: key }))}
                  className={`py-2 text-xs font-medium rounded ${
                    config.voice === key
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Hand modes */}
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Hand Modes</h3>
            <div className="space-y-2">
              {['left', 'right'].map(hand => (
                <div key={hand} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-12 capitalize">{hand}:</span>
                  <div className="flex gap-1 flex-1">
                    {['melody', 'bass', 'off'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          [`${hand}HandMode`]: mode
                        }))}
                        className={`flex-1 py-1 text-xs rounded ${
                          config[`${hand}HandMode`] === mode
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current scale notes */}
          <div className="bg-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Scale Notes</h3>
            <div className="flex flex-wrap gap-1">
              {scaleNotes.map((note, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 text-xs rounded ${
                    musicState.activeNotes.some(n => n.midiNote % 12 === note.midi % 12)
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  {note.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">How to Play</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Gestures</h4>
            <ul className="space-y-1">
              <li><span className="font-medium">Pinch/Grab:</span> Play & sustain notes</li>
              <li><span className="font-medium">Point:</span> Preview notes (softer)</li>
              <li><span className="font-medium">Open Palm:</span> Stop/mute (conductor cut)</li>
              <li><span className="font-medium">Both Palms (1s):</span> Toggle music on/off</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Expression</h4>
            <ul className="space-y-1">
              <li><span className="font-medium">Hand Height:</span> Pitch (higher = higher notes)</li>
              <li><span className="font-medium">Depth (Z):</span> Volume/dynamics</li>
              <li><span className="font-medium">Finger Spread:</span> Vibrato intensity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
