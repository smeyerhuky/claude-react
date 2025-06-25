import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Book, Mic, RotateCcw, ChevronDown, ChevronUp, Target, Shuffle, Check, X, Plus } from 'lucide-react';

const MagyarCore100 = () => {
  // Core state
  const [voices, setVoices] = useState([]);
  const [hungarianVoice, setHungarianVoice] = useState(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [activeTab, setActiveTab] = useState('words');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [audioStatus, setAudioStatus] = useState({ show: false, text: '' });
  
  // Learning state
  const [masteredWords, setMasteredWords] = useState(new Set());
  const [currentSentence, setCurrentSentence] = useState([]);
  const [draggedWord, setDraggedWord] = useState(null);
  const [sentenceResult, setSentenceResult] = useState(null);
  const [practiceMode, setPracticeMode] = useState('explore');

  const currentUtteranceRef = useRef(null);

  // The Core 100 Hungarian Words (organized by frequency and function)
  const core100Words = [
    // Essential Function Words (1-20)
    { id: 1, hungarian: 'a/az', english: 'the', category: 'article', type: 'function', frequency: 1, cases: ['a ház - the house', 'az alma - the apple'] },
    { id: 2, hungarian: 'és', english: 'and', category: 'conjunction', type: 'function', frequency: 2, cases: ['kenyér és vaj - bread and butter'] },
    { id: 3, hungarian: 'van', english: 'is/there is', category: 'verb', type: 'function', frequency: 3, cases: ['Itt van - here it is', 'Van idő? - is there time?'] },
    { id: 4, hungarian: 'egy', english: 'one/a/an', category: 'number', type: 'function', frequency: 4, cases: ['egy nap - one day', 'egy alma - an apple'] },
    { id: 5, hungarian: 'nem', english: 'no/not', category: 'negation', type: 'function', frequency: 5, cases: ['Nem tudom - I don\'t know'] },
    { id: 6, hungarian: 'hogy', english: 'that/how', category: 'conjunction', type: 'function', frequency: 6, cases: ['Azt hiszem, hogy... - I think that...'] },
    { id: 7, hungarian: 'ez', english: 'this', category: 'pronoun', type: 'function', frequency: 7, cases: ['Ez jó - this is good'] },
    { id: 8, hungarian: 'én', english: 'I', category: 'pronoun', type: 'function', frequency: 8, cases: ['Én magyar vagyok - I am Hungarian'] },
    { id: 9, hungarian: 'be', english: 'in/into', category: 'preposition', type: 'function', frequency: 9, cases: ['bemegy - goes in'] },
    { id: 10, hungarian: 'ki', english: 'who/out', category: 'pronoun', type: 'function', frequency: 10, cases: ['Ki vagy? - Who are you?', 'kimegy - goes out'] },
    
    // Common Verbs (21-35)
    { id: 21, hungarian: 'megy', english: 'go', category: 'verb', type: 'action', frequency: 21, cases: ['megyek haza - I go home'] },
    { id: 22, hungarian: 'jön', english: 'come', category: 'verb', type: 'action', frequency: 22, cases: ['jövök - I am coming'] },
    { id: 23, hungarian: 'ad', english: 'give', category: 'verb', type: 'action', frequency: 23, cases: ['adj nekem - give me'] },
    { id: 24, hungarian: 'vesz', english: 'take/buy', category: 'verb', type: 'action', frequency: 24, cases: ['veszek egy almát - I buy an apple'] },
    { id: 25, hungarian: 'lát', english: 'see', category: 'verb', type: 'action', frequency: 25, cases: ['látom - I see it'] },
    { id: 26, hungarian: 'tud', english: 'know/can', category: 'verb', type: 'mental', frequency: 26, cases: ['tudok magyarul - I can speak Hungarian'] },
    { id: 27, hungarian: 'akar', english: 'want', category: 'verb', type: 'mental', frequency: 27, cases: ['akarok - I want'] },
    { id: 28, hungarian: 'beszél', english: 'speak', category: 'verb', type: 'action', frequency: 28, cases: ['beszélek angolul - I speak English'] },
    { id: 29, hungarian: 'eszik', english: 'eat', category: 'verb', type: 'action', frequency: 29, cases: ['eszem - I eat'] },
    { id: 30, hungarian: 'iszik', english: 'drink', category: 'verb', type: 'action', frequency: 30, cases: ['iszom - I drink'] },
    
    // Essential Nouns (36-60)
    { id: 36, hungarian: 'ember', english: 'person', category: 'noun', type: 'person', frequency: 36, cases: ['egy ember - a person'] },
    { id: 37, hungarian: 'nő', english: 'woman', category: 'noun', type: 'person', frequency: 37, cases: ['a nő - the woman'] },
    { id: 38, hungarian: 'férfi', english: 'man', category: 'noun', type: 'person', frequency: 38, cases: ['a férfi - the man'] },
    { id: 39, hungarian: 'gyerek', english: 'child', category: 'noun', type: 'person', frequency: 39, cases: ['a gyerek - the child'] },
    { id: 40, hungarian: 'ház', english: 'house', category: 'noun', type: 'place', frequency: 40, cases: ['a ház - the house'] },
    { id: 41, hungarian: 'város', english: 'city', category: 'noun', type: 'place', frequency: 41, cases: ['a város - the city'] },
    { id: 42, hungarian: 'utca', english: 'street', category: 'noun', type: 'place', frequency: 42, cases: ['az utca - the street'] },
    { id: 43, hungarian: 'kéz', english: 'hand', category: 'noun', type: 'body', frequency: 43, cases: ['a kéz - the hand'] },
    { id: 44, hungarian: 'szem', english: 'eye', category: 'noun', type: 'body', frequency: 44, cases: ['a szem - the eye'] },
    { id: 45, hungarian: 'víz', english: 'water', category: 'noun', type: 'substance', frequency: 45, cases: ['a víz - the water'] },
    
    // Travel Essentials (61-80)
    { id: 61, hungarian: 'hotel', english: 'hotel', category: 'noun', type: 'travel', frequency: 61, cases: ['a hotel - the hotel'] },
    { id: 62, hungarian: 'vonat', english: 'train', category: 'noun', type: 'travel', frequency: 62, cases: ['a vonat - the train'] },
    { id: 63, hungarian: 'repülő', english: 'airplane', category: 'noun', type: 'travel', frequency: 63, cases: ['a repülő - the airplane'] },
    { id: 64, hungarian: 'étterem', english: 'restaurant', category: 'noun', type: 'travel', frequency: 64, cases: ['az étterem - the restaurant'] },
    { id: 65, hungarian: 'bolt', english: 'shop', category: 'noun', type: 'travel', frequency: 65, cases: ['a bolt - the shop'] },
    { id: 66, hungarian: 'pénz', english: 'money', category: 'noun', type: 'travel', frequency: 66, cases: ['a pénz - the money'] },
    { id: 67, hungarian: 'jegy', english: 'ticket', category: 'noun', type: 'travel', frequency: 67, cases: ['a jegy - the ticket'] },
    { id: 68, hungarian: 'szoba', english: 'room', category: 'noun', type: 'travel', frequency: 68, cases: ['a szoba - the room'] },
    { id: 69, hungarian: 'ágy', english: 'bed', category: 'noun', type: 'travel', frequency: 69, cases: ['az ágy - the bed'] },
    { id: 70, hungarian: 'fürdő', english: 'bathroom', category: 'noun', type: 'travel', frequency: 70, cases: ['a fürdő - the bathroom'] },
    
    // Food & Basic Needs (81-100)
    { id: 81, hungarian: 'kenyér', english: 'bread', category: 'noun', type: 'food', frequency: 81, cases: ['a kenyér - the bread'] },
    { id: 82, hungarian: 'tej', english: 'milk', category: 'noun', type: 'food', frequency: 82, cases: ['a tej - the milk'] },
    { id: 83, hungarian: 'alma', english: 'apple', category: 'noun', type: 'food', frequency: 83, cases: ['az alma - the apple', 'almát kérek - I want an apple'] },
    { id: 84, hungarian: 'kávé', english: 'coffee', category: 'noun', type: 'food', frequency: 84, cases: ['a kávé - the coffee'] },
    { id: 85, hungarian: 'sör', english: 'beer', category: 'noun', type: 'food', frequency: 85, cases: ['a sör - the beer'] },
    { id: 86, hungarian: 'hús', english: 'meat', category: 'noun', type: 'food', frequency: 86, cases: ['a hús - the meat'] },
    { id: 87, hungarian: 'hal', english: 'fish', category: 'noun', type: 'food', frequency: 87, cases: ['a hal - the fish'] },
    { id: 88, hungarian: 'sajt', english: 'cheese', category: 'noun', type: 'food', frequency: 88, cases: ['a sajt - the cheese'] },
    { id: 89, hungarian: 'tojás', english: 'egg', category: 'noun', type: 'food', frequency: 89, cases: ['a tojás - the egg'] },
    { id: 90, hungarian: 'cukor', english: 'sugar', category: 'noun', type: 'food', frequency: 90, cases: ['a cukor - the sugar'] },
    
    // Essential Phrases building blocks
    { id: 91, hungarian: 'kérek', english: 'I ask for/want', category: 'verb', type: 'polite', frequency: 91, cases: ['Kérek egy kávét - I\'d like a coffee'] },
    { id: 92, hungarian: 'köszönöm', english: 'thank you', category: 'expression', type: 'polite', frequency: 92, cases: ['Köszönöm szépen - thank you very much'] },
    { id: 93, hungarian: 'elnézést', english: 'excuse me', category: 'expression', type: 'polite', frequency: 93, cases: ['Elnézést! - Excuse me!'] },
    { id: 94, hungarian: 'igen', english: 'yes', category: 'response', type: 'polite', frequency: 94, cases: ['Igen, köszönöm - Yes, thank you'] },
    { id: 95, hungarian: 'hol', english: 'where', category: 'question', type: 'polite', frequency: 95, cases: ['Hol van...? - Where is...?'] },
    { id: 96, hungarian: 'mit', english: 'what', category: 'question', type: 'polite', frequency: 96, cases: ['Mit csinál? - What are you doing?'] },
    { id: 97, hungarian: 'mikor', english: 'when', category: 'question', type: 'polite', frequency: 97, cases: ['Mikor jön? - When are you coming?'] },
    { id: 98, hungarian: 'miért', english: 'why', category: 'question', type: 'polite', frequency: 98, cases: ['Miért? - Why?'] },
    { id: 99, hungarian: 'mennyibe', english: 'how much (cost)', category: 'question', type: 'polite', frequency: 99, cases: ['Mennyibe kerül? - How much does it cost?'] },
    { id: 100, hungarian: 'segítség', english: 'help', category: 'noun', type: 'polite', frequency: 100, cases: ['Segítség! - Help!', 'Kérek segítséget - I need help'] }
  ];

  // Common travel sentence templates
  const sentenceTemplates = [
    {
      id: 'ask-for-item',
      pattern: ['kérek', 'egy', '[food/drink]'],
      english: 'I would like a [item]',
      example: 'Kérek egy almát',
      difficulty: 'beginner'
    },
    {
      id: 'where-is',
      pattern: ['hol', 'van', 'a/az', '[place]'],
      english: 'Where is the [place]?',
      example: 'Hol van a hotel?',
      difficulty: 'beginner'
    },
    {
      id: 'how-much',
      pattern: ['mennyibe', 'kerül', 'a/az', '[item]'],
      english: 'How much does the [item] cost?',
      example: 'Mennyibe kerül a kávé?',
      difficulty: 'intermediate'
    },
    {
      id: 'need-help',
      pattern: ['kérek', 'segítséget'],
      english: 'I need help',
      example: 'Kérek segítséget',
      difficulty: 'beginner'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Words', icon: '📚' },
    { id: 'function', name: 'Function Words', icon: '⚙️' },
    { id: 'verb', name: 'Action Words', icon: '🏃' },
    { id: 'noun', name: 'Things & Places', icon: '🏠' },
    { id: 'travel', name: 'Travel Essentials', icon: '✈️' },
    { id: 'food', name: 'Food & Drink', icon: '🍎' },
    { id: 'polite', name: 'Polite Phrases', icon: '🙏' }
  ];

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechAvailable(true);
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        const hungarian = availableVoices.find(voice =>
          voice.lang.startsWith('hu') || voice.lang.includes('HU')
        );
        setHungarianVoice(hungarian);
        
        if (hungarian) {
          setVoiceStatus('✅ Hungarian voice ready!');
        } else {
          setVoiceStatus('⚠️ Using default voice (Hungarian voice not found)');
        }
      };
      
      speechSynthesis.onvoiceschanged = loadVoices;
      if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
      }
    } else {
      setVoiceStatus('🔇 Audio features not available in this browser');
    }
  }, []);

  // Speech function
  const speak = useCallback((text, rate = null) => {
    if (!speechAvailable) {
      setAudioStatus({ show: true, text: `🔇 ${text} (audio not available)` });
      setTimeout(() => setAudioStatus({ show: false, text: '' }), 2000);
      return;
    }

    if (currentUtteranceRef.current) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hu-HU';
    utterance.rate = rate || speechRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (hungarianVoice) {
      utterance.voice = hungarianVoice;
    }

    setAudioStatus({ show: true, text: `🔊 ${text}` });

    utterance.onend = () => {
      setAudioStatus({ show: false, text: '' });
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [speechAvailable, speechRate, hungarianVoice]);

  // Word mastery toggle
  const toggleWordMastery = useCallback((wordId) => {
    setMasteredWords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  }, []);

  // Filter words by category
  const filteredWords = selectedCategory === 'all' 
    ? core100Words 
    : core100Words.filter(word => word.category === selectedCategory || word.type === selectedCategory);

  // Drag and drop handlers
  const handleDragStart = (e, word) => {
    setDraggedWord(word);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedWord) {
      setCurrentSentence(prev => [...prev, draggedWord]);
      setDraggedWord(null);
    }
  };

  const removeFromSentence = (index) => {
    setCurrentSentence(prev => prev.filter((_, i) => i !== index));
  };

  const clearSentence = () => {
    setCurrentSentence([]);
    setSentenceResult(null);
  };

  const analyzeSentence = () => {
    if (currentSentence.length === 0) return;

    const sentence = currentSentence.map(word => word.hungarian).join(' ');
    const englishTranslation = currentSentence.map(word => word.english).join(' ');
    
    // Check against known patterns
    const matchedTemplate = sentenceTemplates.find(template => {
      const patternWords = template.pattern.filter(word => !word.startsWith('['));
      return patternWords.every(word => 
        currentSentence.some(sentenceWord => sentenceWord.hungarian === word)
      );
    });

    setSentenceResult({
      hungarian: sentence,
      english: englishTranslation,
      template: matchedTemplate,
      isValid: matchedTemplate ? true : false
    });
  };

  const speakSentence = () => {
    if (currentSentence.length > 0) {
      const sentence = currentSentence.map(word => word.hungarian).join(' ');
      speak(sentence);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-700 text-center mb-2">
            🎯 Magyar Core 100 Workshop
          </h1>
          <p className="text-center text-gray-600 italic text-lg mb-4">
            Master the 100 most essential Hungarian words that unlock 50% of everyday conversation
          </p>
          
          {/* Voice Status */}
          {voiceStatus && (
            <div className="mt-4 mx-auto max-w-md">
              <div className={`p-3 rounded-lg text-center text-sm ${
                speechAvailable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {voiceStatus}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex justify-center mt-6">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setActiveTab('words')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'words' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                📚 Learn Words
              </button>
              <button
                onClick={() => setActiveTab('sentences')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'sentences' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                🔧 Build Sentences
              </button>
            </div>
          </div>
        </div>

        {/* Words Tab */}
        {activeTab === 'words' && (
          <>
            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Choose Your Focus</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedCategory === category.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-sm font-medium">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {masteredWords.size}
                  </div>
                  <div className="text-gray-600">Words Mastered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((masteredWords.size / 100) * 100)}%
                  </div>
                  <div className="text-gray-600">Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {filteredWords.length}
                  </div>
                  <div className="text-gray-600">In Current Category</div>
                </div>
              </div>
            </div>

            {/* Words Grid */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Core Words {selectedCategory !== 'all' && `- ${categories.find(c => c.id === selectedCategory)?.name}`}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWords.map((word) => {
                  const isMastered = masteredWords.has(word.id);
                  return (
                    <div
                      key={word.id}
                      className={`
                        relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300
                        ${isMastered 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                        }
                      `}
                    >
                      {/* Mastery Toggle */}
                      <button
                        onClick={() => toggleWordMastery(word.id)}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isMastered 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {isMastered && <Check className="w-4 h-4" />}
                      </button>

                      {/* Word Content */}
                      <div 
                        onClick={() => speak(word.hungarian)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs text-gray-500">#{word.frequency}</span>
                        </div>
                        
                        <div className="text-2xl font-bold text-indigo-700 mb-1">
                          {word.hungarian}
                        </div>
                        
                        <div className="text-gray-600 font-medium mb-3">
                          {word.english}
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          {word.category} • {word.type}
                        </div>
                        
                        {/* Example Cases */}
                        <div className="space-y-1">
                          {word.cases.slice(0, 1).map((example, i) => (
                            <div key={i} className="text-xs italic text-gray-600 bg-gray-50 p-2 rounded">
                              {example}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Sentences Tab */}
        {activeTab === 'sentences' && (
          <>
            {/* Sentence Builder */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🔧 Sentence Construction Zone</h3>
              
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="min-h-32 border-2 border-dashed border-indigo-300 rounded-xl p-6 mb-4 bg-indigo-50"
              >
                <div className="text-center text-gray-500 mb-4">
                  Drag words here to build your sentence
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  {currentSentence.map((word, index) => (
                    <div
                      key={`${word.id}-${index}`}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <span>{word.hungarian}</span>
                      <button
                        onClick={() => removeFromSentence(index)}
                        className="hover:bg-indigo-700 rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={speakSentence}
                  disabled={currentSentence.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  Speak Sentence
                </button>
                <button
                  onClick={analyzeSentence}
                  disabled={currentSentence.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Analyze
                </button>
                <button
                  onClick={clearSentence}
                  disabled={currentSentence.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </button>
              </div>

              {/* Sentence Analysis */}
              {sentenceResult && (
                <div className="mt-6 p-4 rounded-xl bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-2">Analysis Results:</h4>
                  <div className="space-y-2">
                    <div><strong>Hungarian:</strong> {sentenceResult.hungarian}</div>
                    <div><strong>English:</strong> {sentenceResult.english}</div>
                    {sentenceResult.template && (
                      <div className="bg-green-100 p-3 rounded-lg">
                        <strong>✅ Recognized Pattern:</strong> {sentenceResult.template.english}
                        <br />
                        <small>Example: {sentenceResult.template.example}</small>
                      </div>
                    )}
                    {!sentenceResult.isValid && (
                      <div className="bg-yellow-100 p-3 rounded-lg">
                        <strong>⚠️ Experimental sentence:</strong> This might not follow standard Hungarian patterns. Try using our templates below!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Common Sentence Templates */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📝 Common Travel Patterns</h3>
              <div className="grid gap-4">
                {sentenceTemplates.map(template => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-indigo-700">{template.english}</div>
                        <div className="text-gray-600 font-mono text-sm">{template.example}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        template.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {template.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Pattern: {template.pattern.join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Draggable Words Bank */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🏦 Word Bank</h3>
              <p className="text-gray-600 mb-4">Drag these words to build sentences above</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {core100Words.slice(0, 50).map((word) => (
                  <div
                    key={word.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, word)}
                    className="bg-gray-100 hover:bg-indigo-100 border-2 border-transparent hover:border-indigo-300 p-3 rounded-lg cursor-move transition-all"
                  >
                    <div className="text-sm font-bold text-indigo-700">{word.hungarian}</div>
                    <div className="text-xs text-gray-600">{word.english}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Audio Status */}
      {audioStatus.show && (
        <div className="fixed bottom-6 right-6 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg transition-opacity">
          {audioStatus.text}
        </div>
      )}
    </div>
  );
};

export default MagyarCore100;
