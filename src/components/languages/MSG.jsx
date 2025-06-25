import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Sun, Moon, Book, Mic, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const MSG = () => {
  // Core state
  const [voices, setVoices] = useState([]);
  const [hungarianVoice, setHungarianVoice] = useState(null);
  const [germanVoice, setGermanVoice] = useState(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [expandedPhrase, setExpandedPhrase] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [audioStatus, setAudioStatus] = useState({ show: false, text: '' });

  // Learning progress state
  const [clickCount, setClickCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    startTime: Date.now(),
    interactions: 0,
    timeOfDay: getTimeOfDay(new Date().getHours())
  });

  // Refs
  const currentUtteranceRef = useRef(null);
  const practiceStartTimeRef = useRef(Date.now());

  // Data
  const vowels = [
    { letter: 'a', sound: 'o in hot', ipa: 'aw', example: 'bal', meaning: 'left' },
    { letter: 'á', sound: 'ah in father', ipa: 'ah', example: 'ház', meaning: 'house' },
    { letter: 'e', sound: 'e in bet', ipa: 'eh', example: 'nem', meaning: 'no' },
    { letter: 'é', sound: 'ay in say', ipa: 'ay', example: 'szép', meaning: 'beautiful' },
    { letter: 'i', sound: 'ee in see', ipa: 'ee', example: 'itt', meaning: 'here' },
    { letter: 'í', sound: 'ee (longer)', ipa: 'eee', example: 'víz', meaning: 'water' },
    { letter: 'o', sound: 'aw in law', ipa: 'oh', example: 'bolt', meaning: 'shop' },
    { letter: 'ó', sound: 'oh in go', ipa: 'ohh', example: 'jó', meaning: 'good' },
    { letter: 'ö', sound: 'ur in fur', ipa: 'uh', example: 'öt', meaning: 'five' },
    { letter: 'ő', sound: 'ur (longer)', ipa: 'uhh', example: 'erő', meaning: 'strength' },
    { letter: 'u', sound: 'oo in book', ipa: 'oo', example: 'fut', meaning: 'run' },
    { letter: 'ú', sound: 'oo in food', ipa: 'ooo', example: 'út', meaning: 'road' },
    { letter: 'ü', sound: 'ee rounded', ipa: 'ew', example: 'fül', meaning: 'ear' },
    { letter: 'ű', sound: 'ee rounded long', ipa: 'eww', example: 'tűz', meaning: 'fire' }
  ];

  const consonants = [
    { letter: 'cs', sound: 'ch in church', ipa: 'ch', example: 'csak', meaning: 'only' },
    { letter: 'gy', sound: 'd in duke', ipa: 'dy', example: 'nagy', meaning: 'big' },
    { letter: 'ly', sound: 'y in yes', ipa: 'y', example: 'amely', meaning: 'which' },
    { letter: 'ny', sound: 'ny in canyon', ipa: 'ny', example: 'könnyű', meaning: 'easy' },
    { letter: 's', sound: 'sh in shop', ipa: 'sh', example: 'és', meaning: 'and' },
    { letter: 'sz', sound: 's in sun', ipa: 's', example: 'szép', meaning: 'beautiful' },
    { letter: 'ty', sound: 't in tune', ipa: 'ty', example: 'kutya', meaning: 'dog' },
    { letter: 'zs', sound: 's in measure', ipa: 'zh', example: 'zseb', meaning: 'pocket' }
  ];

  const phrases = [
    {
      id: 'greeting',
      text: 'Jó napot kívánok!',
      phonetic: 'yoh NAH-poht KEE-vah-nohk',
      meaning: 'Good day to you! (formal greeting)',
      syllables: [
        { text: 'Jó', phonetic: 'yoh', meaning: 'good' },
        { text: 'napot', phonetic: 'NAH-poht', meaning: 'day (accusative)' },
        { text: 'kívánok', phonetic: 'KEE-vah-nohk', meaning: 'I wish' }
      ],
      usage: 'Perfect for shops, restaurants, or meeting someone formally.'
    },
    {
      id: 'thanks',
      text: 'Köszönöm szépen!',
      phonetic: 'KUH-suh-nuhm SAY-pen',
      meaning: 'Thank you very much!',
      syllables: [
        { text: 'Köszönöm', phonetic: 'KUH-suh-nuhm', meaning: 'I thank' },
        { text: 'szépen', phonetic: 'SAY-pen', meaning: 'nicely/very much' }
      ],
      usage: 'The "ö" requires rounded lips—imagine you\'re about to whistle!'
    },
    {
      id: 'excuse',
      text: 'Elnézést, nem beszélek magyarul',
      phonetic: 'EL-nay-zaysht, nem BEH-say-lek MAH-dyah-rool',
      meaning: 'Excuse me, I don\'t speak Hungarian',
      syllables: [
        { text: 'Elnézést', phonetic: 'EL-nay-zaysht', meaning: 'excuse me' },
        { text: 'nem', phonetic: 'nem', meaning: 'not' },
        { text: 'beszélek', phonetic: 'BEH-say-lek', meaning: 'I speak' },
        { text: 'magyarul', phonetic: 'MAH-dyah-rool', meaning: 'Hungarian' }
      ],
      usage: 'Your golden key—Hungarians will immediately switch to English or German and appreciate your effort!'
    }
  ];

  // Helper functions
  function getTimeOfDay(hour) {
    if (hour >= 5 && hour < 9) {
      return {
        period: 'Early Morning (Kora reggel)',
        suggestion: 'Your mind is fresh! Perfect time for new vowel sounds.',
        focus: 'Master the difference between short and long vowels (a/á, e/é)'
      };
    } else if (hour >= 9 && hour < 12) {
      return {
        period: 'Morning (Délelőtt)',
        suggestion: 'Peak concentration hours - tackle those tricky consonant clusters!',
        focus: 'Practice gy, ny, ty combinations with coffee'
      };
    } else if (hour >= 12 && hour < 14) {
      return {
        period: 'Midday (Dél)',
        suggestion: 'Post-lunch learning - keep it light with common phrases.',
        focus: 'Restaurant phrases: "Kérek egy..." (I\'d like a...)'
      };
    } else if (hour >= 14 && hour < 17) {
      return {
        period: 'Afternoon (Délután)',
        suggestion: 'Afternoon brain fog? Time for interactive practice!',
        focus: 'Use the repeat and slow functions for muscle memory'
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        period: 'Evening (Este)',
        suggestion: 'Wind down with conversational phrases you\'ll use tomorrow.',
        focus: 'Social phrases: "Hogy vagy?" (How are you?)'
      };
    } else if (hour >= 20 && hour < 23) {
      return {
        period: 'Night (Éjszaka)',
        suggestion: 'Gentle review time - let the sounds settle into memory.',
        focus: 'Listen mode: Play phrases while relaxing'
      };
    } else {
      return {
        period: 'Late Night (Késő éjszaka)',
        suggestion: 'Dedication! Keep sessions short - your brain needs rest too.',
        focus: 'One phrase mastery: Pick one and perfect it'
      };
    }
  }

  // Console logging for time awareness
  const logTimeAwareness = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = getTimeOfDay(hour);

    console.log('═══════════════════════════════════════════');
    console.log(`🕐 Magyar Sound Garden initialized at ${now.toLocaleTimeString()}`);
    console.log(`🌍 Current environment: ${timeOfDay.period}`);
    console.log('═══════════════════════════════════════════');
    console.log(`💡 ${timeOfDay.suggestion}`);
    console.log(`🎵 Recommended focus: ${timeOfDay.focus}`);

    if (isDarkMode) {
      console.log('🌙 Dark mode detected - your eyes will thank you during evening practice!');
    } else {
      console.log('☀️ Light mode active - perfect for daytime learning!');
    }

    if (hour >= 23 || hour < 5) {
      console.log('🦉 Hooting with the owls, are we? Hungarian dreams await!');
    }

    console.log('═══════════════════════════════════════════');
    console.log('Pro tip: Open console to see learning insights and debug info');
  }, [isDarkMode]);

  // Log learning progress
  const logLearningProgress = useCallback((action, detail) => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    const sessionMinutes = Math.round((Date.now() - practiceStartTimeRef.current) / 60000);
    console.log(`📊 Action ${newCount}: ${action} - ${detail}`);

    if (newCount % 10 === 0) {
      console.log(`🎉 Milestone: ${newCount} interactions in ${sessionMinutes} minutes!`);
      console.log('💪 Your dedication rivals the builders of Buda Castle!');
    }
  }, [clickCount]);

  // Initialize speech synthesis
  useEffect(() => {
    // Check for speech synthesis support
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      setSpeechAvailable(true);
      console.log('🎵 Speech synthesis available - your garden can sing!');

      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);

        const hungarian = availableVoices.find(voice =>
          voice.lang.startsWith('hu') || voice.lang.includes('HU')
        );
        setHungarianVoice(hungarian);

        const german = availableVoices.find(voice => voice.lang.startsWith('de'));
        setGermanVoice(german);

        if (hungarian) {
          setVoiceStatus('✓ Hungarian voice ready!');
        } else {
          setVoiceStatus('⚠️ Using default voice (Hungarian voice not found)');
        }
      };

      speechSynthesis.onvoiceschanged = loadVoices;
      if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
      }
    } else {
      console.log('🔇 Speech synthesis not available in this browser');
      console.log('💡 Try Chrome, Firefox, Safari, or Edge for audio features');
      setVoiceStatus('🔇 Audio features not available in this browser. Try Chrome, Firefox, Safari, or Edge for the full experience.');
    }

    // Dark mode detection
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeQuery.matches);

      const handleChange = (e) => setIsDarkMode(e.matches);
      darkModeQuery.addEventListener('change', handleChange);

      return () => darkModeQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Log initialization
  useEffect(() => {
    logTimeAwareness();

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👋 Magyar Garden paused - see you soon!');
        console.log(`⏱️ Practice time: ${Math.round(performance.now() / 1000)} seconds`);
      } else {
        console.log('👋 Welcome back to your Magyar Garden!');
        console.log('🌱 Your pronunciation seeds are still growing...');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up debug tools
    window.magyarDebug = {
      showVoices: () => {
        if (!speechAvailable) {
          console.log('❌ Speech synthesis not available in this browser');
          return;
        }
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        console.log('Hungarian voice:', hungarianVoice ? hungarianVoice.name : 'Not found');
      },
      testPhrase: (phrase) => {
        console.log(`Testing: "${phrase}"`);
        speak(phrase, 'hu-HU', 0.7);
      },
      showStats: () => {
        console.log(`Session stats:
        - Interactions: ${clickCount}
        - Time: ${Math.round((Date.now() - practiceStartTimeRef.current) / 60000)} minutes
        - Speech available: ${speechAvailable ? 'Yes' : 'No'}
        - Browser: ${navigator.userAgent}`);
      },
      checkBrowserSupport: () => {
        console.log('Browser Support Check:');
        console.log('- Speech Synthesis:', speechAvailable ? '✅' : '❌');
        console.log('- Dark Mode Detection:', window.matchMedia ? '✅' : '❌');
        console.log('- Page Visibility API:', 'hidden' in document ? '✅' : '❌');
        console.log('\nFor full features, use a modern browser like:');
        console.log('Chrome 33+, Firefox 49+, Safari 7+, Edge 14+');
      }
    };

    console.log('🛠️ Debug tools available: magyarDebug.showVoices(), magyarDebug.testPhrase("text"), magyarDebug.showStats(), magyarDebug.checkBrowserSupport()');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logTimeAwareness, voices, hungarianVoice, clickCount, speechAvailable]);

  // Speech function
  const speak = useCallback((text, lang = 'hu-HU', rate = null, voice = null) => {
    if (!speechAvailable) {
      setAudioStatus({ show: true, text: `🔇 ${text} (audio not available)` });
      setTimeout(() => setAudioStatus({ show: false, text: '' }), 2000);
      console.log(`Would speak: "${text}" in ${lang}`);
      return;
    }

    if (currentUtteranceRef.current) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate || speechRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (voice) {
      utterance.voice = voice;
    } else if (hungarianVoice && lang.startsWith('hu')) {
      utterance.voice = hungarianVoice;
    }

    setAudioStatus({ show: true, text: `🔊 Speaking: ${text}` });

    utterance.onend = () => {
      setAudioStatus({ show: false, text: '' });
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [speechAvailable, speechRate, hungarianVoice]);

  // Letter card click handler
  const handleLetterClick = useCallback((letter, type) => {
    setActiveCard(`${type}-${letter.letter}`);
    logLearningProgress(`${type} practice`, `Letter ${letter.letter} - ${letter.example}`);

    // Special handling for ö/ü with German voice
    if (['ö', 'ő', 'ü', 'ű'].includes(letter.letter) && germanVoice) {
      speak(letter.letter, 'de-DE', 0.6, germanVoice);
    } else {
      speak(letter.letter, 'hu-HU', 0.6);
    }

    setTimeout(() => {
      speak(letter.example, 'hu-HU', 0.7);
      setTimeout(() => setActiveCard(null), 1000);
    }, 1000);
  }, [speak, germanVoice, logLearningProgress]);

  // Phrase functions
  const speakPhrase = useCallback((text, rate = null) => {
    speak(text, 'hu-HU', rate || speechRate);
  }, [speak, speechRate]);

  const repeatPhrase = useCallback((text, times) => {
    let count = 0;
    function speakNext() {
      if (count < times) {
        speak(text, 'hu-HU', 0.8);
        count++;
        setTimeout(speakNext, 2500);
      }
    }
    speakNext();
  }, [speak]);

  const buildUpPhrase = useCallback((text) => {
    const words = text.split(' ');
    let current = '';
    let index = 0;

    function speakNext() {
      if (index < words.length) {
        current += (current ? ' ' : '') + words[index];
        speak(current, 'hu-HU', 0.7);
        index++;
        setTimeout(speakNext, 2000);
      }
    }
    speakNext();
  }, [speak]);

  const practiceWithMe = useCallback((text) => {
    setAudioStatus({ show: true, text: 'Listen first...' });
    speak(text, 'hu-HU', 0.7);

    setTimeout(() => {
      setAudioStatus({ show: true, text: 'Now you try! 🎤' });
      setTimeout(() => {
        setAudioStatus({ show: true, text: 'Listen again...' });
        speak(text, 'hu-HU', 0.6);
      }, 3000);
    }, 2500);
  }, [speak]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (speechAvailable && speechSynthesis.speaking) {
          speechSynthesis.cancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [speechAvailable]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-red-700 text-center mb-2">
            🌸 Your Magyar Sound Garden 🌸
          </h1>
          <p className="text-center text-gray-600 italic text-lg">
            Where Hungarian Letters Bloom Into Living Sound
          </p>

          {/* Voice Status */}
          {voiceStatus && (
            <div className="mt-6 mx-auto max-w-md">
              <div className={`p-4 rounded-lg text-center ${
                speechAvailable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {voiceStatus}
              </div>
            </div>
          )}

          {/* Speed Control */}
          {speechAvailable && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <label className="font-medium text-gray-700">Speaking Speed:</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-48"
              />
              <span className="font-mono text-sm">{speechRate}x</span>
            </div>
          )}
        </div>

        {/* Vowels Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🎵</span> The Vowel Symphony
          </h2>
          <p className="text-gray-600 mb-6">
            Click any letter to hear its authentic sound. The accent marks are like musical notations—they stretch the sound!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {vowels.map((vowel) => (
              <div
                key={vowel.letter}
                onClick={() => handleLetterClick(vowel, 'vowel')}
                className={`
                  relative bg-gray-50 border-2 rounded-xl p-4 cursor-pointer
                  transition-all duration-300 hover:shadow-lg hover:border-red-400
                  ${activeCard === `vowel-${vowel.letter}` ? 'bg-red-600 text-white scale-110' : ''}
                `}
              >
                <Volume2 className="absolute top-2 right-2 w-4 h-4 opacity-30" />
                <div className="text-3xl font-bold text-center mb-2">{vowel.letter}</div>
                <div className="text-xs text-center opacity-70">{vowel.sound}</div>
                <div className="text-xs text-center italic mt-1">
                  {vowel.example} ({vowel.meaning})
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <strong>Your Hebrew Connection:</strong> Just as Hebrew distinguishes between קָמַץ גָּדוֹל and קָמַץ קָטָן,
            Hungarian uses accents to show vowel length. When you see á, hold it like a sustained note in a nigun!
          </div>
        </div>

        {/* Consonants Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🎭</span> The Consonant Theater
          </h2>
          <p className="text-gray-600 mb-6">
            These letter pairs dance together to create single sounds—click to hear their harmonious performance.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {consonants.map((consonant) => (
              <div
                key={consonant.letter}
                onClick={() => handleLetterClick(consonant, 'consonant')}
                className={`
                  relative bg-gray-50 border-2 rounded-xl p-4 cursor-pointer
                  transition-all duration-300 hover:shadow-lg hover:border-red-400
                  ${activeCard === `consonant-${consonant.letter}` ? 'bg-red-600 text-white scale-110' : ''}
                `}
              >
                <Volume2 className="absolute top-2 right-2 w-4 h-4 opacity-30" />
                <div className="text-3xl font-bold text-center mb-2">{consonant.letter}</div>
                <div className="text-xs text-center opacity-70">{consonant.sound}</div>
                <div className="text-xs text-center italic mt-1">
                  {consonant.example} ({consonant.meaning})
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400 relative">
            <span className="absolute left-4 top-4 text-2xl">💡</span>
            <div className="pl-8">
              <strong>The Magic of 'gy':</strong> This sound doesn't exist in English!
              It's like starting to say "duke" but with your tongue touching more of your palate.
              Native speakers will be impressed when you master this!
            </div>
          </div>
        </div>

        {/* Phrases Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🌟</span> Living Phrases: Your First Conversations
          </h2>
          <p className="text-gray-600 mb-6">
            Click the phrases to hear them spoken. Use the buttons to control playback speed and repetition.
          </p>

          {phrases.map((phrase) => (
            <div key={phrase.id} className="mb-6 p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <h3
                  onClick={() => speakPhrase(phrase.text)}
                  className="text-2xl font-bold text-red-700 cursor-pointer hover:underline"
                >
                  {phrase.text}
                </h3>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => speakPhrase(phrase.text, 0.5)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    🐌 Slow
                  </button>
                  <button
                    onClick={() => repeatPhrase(phrase.text, 3)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    🔁 Repeat 3x
                  </button>
                  <button
                    onClick={() => practiceWithMe(phrase.text)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" /> Practice
                  </button>
                  <button
                    onClick={() => buildUpPhrase(phrase.text)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    🏗️ Build Up
                  </button>
                </div>
              </div>

              <button
                onClick={() => setExpandedPhrase(expandedPhrase === phrase.id ? null : phrase.id)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Book className="w-4 h-4" />
                See Breakdown
                {expandedPhrase === phrase.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedPhrase === phrase.id && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="font-bold mb-2">{phrase.meaning}</p>
                  <div className="mb-3 p-3 bg-gray-100 rounded font-mono">
                    {phrase.phonetic.split(' ').map((word, i) => (
                      <span key={i}>
                        {word.split('-').map((syllable, j) => (
                          <span key={j} className={syllable === syllable.toUpperCase() ? 'text-red-600 font-bold' : ''}>
                            {syllable}
                            {j < word.split('-').length - 1 && '-'}
                          </span>
                        ))}
                        {i < phrase.phonetic.split(' ').length - 1 && ' '}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {phrase.syllables.map((syllable, i) => (
                      <span
                        key={i}
                        onClick={() => speak(syllable.phonetic, 'hu-HU', 0.6)}
                        className="px-3 py-2 bg-blue-100 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors"
                      >
                        {syllable.text} = {syllable.meaning}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm italic text-gray-600">✨ {phrase.usage}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Learning Tips */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">🎪 The Sound Laboratory</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
              <h3 className="font-bold mb-2">Pro Tip:</h3>
              <p>Download the "Nemo Hungarian" app (free) for offline pronunciation practice during your journey.
              The basic version includes all essential travel phrases with native audio!</p>
            </div>

            <div className="p-6 bg-green-50 rounded-xl border-l-4 border-green-400">
              <h3 className="font-bold mb-2">Your Daily Practice Ritual:</h3>
              <p>Morning coffee? Say "Jó reggelt!" (Good morning)<br />
              Afternoon tea? Practice "Délután" (Afternoon)<br />
              Evening wind-down? Master "Jó éjszakát!" (Good night)</p>
              <p className="text-sm italic mt-2">Each phrase anchored to your day becomes a permanent friend.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Status */}
      {audioStatus.show && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg transition-opacity">
          {audioStatus.text}
        </div>
      )}
    </div>
  );
};

export default MSG;
