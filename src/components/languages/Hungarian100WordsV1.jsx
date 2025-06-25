import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Star, Award, RotateCcw, ChevronRight, ChevronLeft, Zap, BookOpen, Target, TrendingUp } from 'lucide-react';

const Hungarian100WordsV1 = () => {
  // Core word data - The 100 most essential Hungarian words
  const wordCategories = {
    basics: {
      title: "Survival Essentials",
      icon: "🏥",
      words: [
        { hu: "igen", en: "yes", phonetic: "EE-gen", category: "basics" },
        { hu: "nem", en: "no", phonetic: "nem", category: "basics" },
        { hu: "köszönöm", en: "thank you", phonetic: "KUH-suh-nuhm", category: "basics" },
        { hu: "kérem", en: "please", phonetic: "KAY-rem", category: "basics" },
        { hu: "bocsánat", en: "sorry", phonetic: "BOH-chah-naht", category: "basics" },
        { hu: "szia", en: "hi/bye", phonetic: "SEE-ah", category: "basics" },
        { hu: "viszlát", en: "goodbye", phonetic: "VEES-laht", category: "basics" },
        { hu: "segítség", en: "help", phonetic: "SHEH-geet-shayg", category: "basics" }
      ]
    },
    pronouns: {
      title: "People & Pronouns",
      icon: "👥",
      words: [
        { hu: "én", en: "I", phonetic: "ayn", category: "pronouns" },
        { hu: "te", en: "you", phonetic: "teh", category: "pronouns" },
        { hu: "ő", en: "he/she", phonetic: "uh", category: "pronouns" },
        { hu: "mi", en: "we", phonetic: "mee", category: "pronouns" },
        { hu: "ők", en: "they", phonetic: "uhk", category: "pronouns" },
        { hu: "ez", en: "this", phonetic: "ez", category: "pronouns" },
        { hu: "az", en: "that", phonetic: "ahz", category: "pronouns" },
        { hu: "ki", en: "who", phonetic: "kee", category: "pronouns" },
        { hu: "mit", en: "what", phonetic: "meet", category: "pronouns" }
      ]
    },
    verbs: {
      title: "Action Words",
      icon: "🏃",
      words: [
        { hu: "van", en: "is/are", phonetic: "vahn", category: "verbs" },
        { hu: "nincs", en: "there isn't", phonetic: "neench", category: "verbs" },
        { hu: "akar", en: "want", phonetic: "AH-kahr", category: "verbs" },
        { hu: "megy", en: "go", phonetic: "medj", category: "verbs" },
        { hu: "jön", en: "come", phonetic: "yuhn", category: "verbs" },
        { hu: "lát", en: "see", phonetic: "laht", category: "verbs" },
        { hu: "eszik", en: "eat", phonetic: "ES-eek", category: "verbs" },
        { hu: "iszik", en: "drink", phonetic: "EE-seek", category: "verbs" },
        { hu: "beszél", en: "speak", phonetic: "BES-ayl", category: "verbs" },
        { hu: "ért", en: "understand", phonetic: "ayrt", category: "verbs" },
        { hu: "tud", en: "know/can", phonetic: "tood", category: "verbs" },
        { hu: "kér", en: "ask for", phonetic: "kayr", category: "verbs" },
        { hu: "ad", en: "give", phonetic: "ahd", category: "verbs" },
        { hu: "vesz", en: "take/buy", phonetic: "ves", category: "verbs" },
        { hu: "szeret", en: "love/like", phonetic: "SEH-ret", category: "verbs" }
      ]
    },
    numbers: {
      title: "Numbers & Time",
      icon: "🔢",
      words: [
        { hu: "egy", en: "one", phonetic: "edj", category: "numbers" },
        { hu: "kettő", en: "two", phonetic: "KET-tuh", category: "numbers" },
        { hu: "három", en: "three", phonetic: "HAH-rohm", category: "numbers" },
        { hu: "négy", en: "four", phonetic: "naydj", category: "numbers" },
        { hu: "öt", en: "five", phonetic: "uht", category: "numbers" },
        { hu: "tíz", en: "ten", phonetic: "teez", category: "numbers" },
        { hu: "száz", en: "hundred", phonetic: "sahz", category: "numbers" },
        { hu: "most", en: "now", phonetic: "mohsht", category: "numbers" },
        { hu: "ma", en: "today", phonetic: "mah", category: "numbers" },
        { hu: "holnap", en: "tomorrow", phonetic: "HOHL-nahp", category: "numbers" },
        { hu: "tegnap", en: "yesterday", phonetic: "TEG-nahp", category: "numbers" }
      ]
    },
    questions: {
      title: "Question Words",
      icon: "❓",
      words: [
        { hu: "hol", en: "where", phonetic: "hohl", category: "questions" },
        { hu: "mikor", en: "when", phonetic: "MEE-kohr", category: "questions" },
        { hu: "miért", en: "why", phonetic: "MEE-ayrt", category: "questions" },
        { hu: "hogyan", en: "how", phonetic: "HOH-djahn", category: "questions" },
        { hu: "mennyi", en: "how much", phonetic: "MEN-nyee", category: "questions" },
        { hu: "melyik", en: "which", phonetic: "MEH-yeek", category: "questions" }
      ]
    },
    descriptors: {
      title: "Descriptions",
      icon: "🎨",
      words: [
        { hu: "jó", en: "good", phonetic: "yoh", category: "descriptors" },
        { hu: "rossz", en: "bad", phonetic: "rohs", category: "descriptors" },
        { hu: "nagy", en: "big", phonetic: "nahdj", category: "descriptors" },
        { hu: "kicsi", en: "small", phonetic: "KEE-chee", category: "descriptors" },
        { hu: "új", en: "new", phonetic: "ooy", category: "descriptors" },
        { hu: "régi", en: "old", phonetic: "RAY-gee", category: "descriptors" },
        { hu: "szép", en: "beautiful", phonetic: "sayp", category: "descriptors" },
        { hu: "drága", en: "expensive", phonetic: "DRAH-gah", category: "descriptors" },
        { hu: "olcsó", en: "cheap", phonetic: "OHL-choh", category: "descriptors" },
        { hu: "meleg", en: "hot/warm", phonetic: "MEH-leg", category: "descriptors" },
        { hu: "hideg", en: "cold", phonetic: "HEE-deg", category: "descriptors" }
      ]
    },
    places: {
      title: "Places & Directions",
      icon: "🗺️",
      words: [
        { hu: "itt", en: "here", phonetic: "eet", category: "places" },
        { hu: "ott", en: "there", phonetic: "oht", category: "places" },
        { hu: "bal", en: "left", phonetic: "bahl", category: "places" },
        { hu: "jobb", en: "right", phonetic: "yohb", category: "places" },
        { hu: "utca", en: "street", phonetic: "OOT-tsah", category: "places" },
        { hu: "ház", en: "house", phonetic: "hahz", category: "places" },
        { hu: "város", en: "city", phonetic: "VAH-rohsh", category: "places" },
        { hu: "ország", en: "country", phonetic: "OHR-sahg", category: "places" },
        { hu: "víz", en: "water", phonetic: "veez", category: "places" },
        { hu: "bolt", en: "shop", phonetic: "bohlt", category: "places" }
      ]
    },
    people: {
      title: "People & Family",
      icon: "👨‍👩‍👧‍👦",
      words: [
        { hu: "ember", en: "person", phonetic: "EM-ber", category: "people" },
        { hu: "férfi", en: "man", phonetic: "FAYR-fee", category: "people" },
        { hu: "nő", en: "woman", phonetic: "nuh", category: "people" },
        { hu: "gyerek", en: "child", phonetic: "DJEH-rek", category: "people" },
        { hu: "barát", en: "friend", phonetic: "BAH-raht", category: "people" },
        { hu: "család", en: "family", phonetic: "CHAH-lahd", category: "people" },
        { hu: "név", en: "name", phonetic: "nayv", category: "people" }
      ]
    },
    essentials: {
      title: "Daily Essentials",
      icon: "🍞",
      words: [
        { hu: "kenyér", en: "bread", phonetic: "KEN-yayr", category: "essentials" },
        { hu: "étel", en: "food", phonetic: "AY-tel", category: "essentials" },
        { hu: "ital", en: "drink", phonetic: "EE-tahl", category: "essentials" },
        { hu: "pénz", en: "money", phonetic: "paynz", category: "essentials" },
        { hu: "idő", en: "time", phonetic: "EE-duh", category: "essentials" },
        { hu: "nap", en: "day/sun", phonetic: "nahp", category: "essentials" },
        { hu: "év", en: "year", phonetic: "ayv", category: "essentials" },
        { hu: "dolog", en: "thing", phonetic: "DOH-lohg", category: "essentials" },
        { hu: "munka", en: "work", phonetic: "MOON-kah", category: "essentials" },
        { hu: "ár", en: "price", phonetic: "ahr", category: "essentials" }
      ]
    },
    connecting: {
      title: "Connecting Words",
      icon: "🔗",
      words: [
        { hu: "és", en: "and", phonetic: "aysh", category: "connecting" },
        { hu: "vagy", en: "or", phonetic: "vahdj", category: "connecting" },
        { hu: "de", en: "but", phonetic: "deh", category: "connecting" },
        { hu: "mert", en: "because", phonetic: "mert", category: "connecting" },
        { hu: "is", en: "also", phonetic: "eesh", category: "connecting" },
        { hu: "még", en: "still/yet", phonetic: "mayg", category: "connecting" },
        { hu: "már", en: "already", phonetic: "mahr", category: "connecting" },
        { hu: "majd", en: "will/then", phonetic: "mahyd", category: "connecting" },
        { hu: "csak", en: "only", phonetic: "chahk", category: "connecting" },
        { hu: "nagyon", en: "very", phonetic: "NAH-djon", category: "connecting" },
        { hu: "kell", en: "need/must", phonetic: "kel", category: "connecting" },
        { hu: "lehet", en: "can/possible", phonetic: "LEH-het", category: "connecting" }
      ]
    }
  };

  // Flatten all words for easy access
  const allWords = Object.values(wordCategories).flatMap(cat => cat.words);
  
  // State management
  const [currentCategory, setCurrentCategory] = useState('basics');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [voices, setVoices] = useState([]);
  const [hungarianVoice, setHungarianVoice] = useState(null);
  const [progress, setProgress] = useState({});
  const [showPhonetic, setShowPhonetic] = useState(true);
  const [practiceMode, setPracticeMode] = useState('browse'); // browse, flashcard, quiz
  const [quizOptions, setQuizOptions] = useState([]);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [streak, setStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [speechRate, setSpeechRate] = useState(0.8);
  
  // Refs
  const audioStatusTimeoutRef = useRef(null);
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      setSpeechAvailable(true);
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        const hungarian = availableVoices.find(voice => 
          voice.lang.startsWith('hu') || voice.lang.includes('HU')
        );
        setHungarianVoice(hungarian);
      };
      
      speechSynthesis.onvoiceschanged = loadVoices;
      if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
      }
    }
    
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('hungarian100Progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    
    const savedScore = localStorage.getItem('hungarian100Score');
    if (savedScore) {
      setTotalScore(parseInt(savedScore));
    }
  }, []);
  
  // Save progress
  useEffect(() => {
    localStorage.setItem('hungarian100Progress', JSON.stringify(progress));
  }, [progress]);
  
  useEffect(() => {
    localStorage.setItem('hungarian100Score', totalScore.toString());
  }, [totalScore]);
  
  // Speech function
  const speak = useCallback((text, lang = 'hu-HU') => {
    if (!speechAvailable) return;
    
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = speechRate;
    
    if (hungarianVoice) {
      utterance.voice = hungarianVoice;
    }
    
    speechSynthesis.speak(utterance);
  }, [speechAvailable, hungarianVoice, speechRate]);
  
  // Get current word
  const getCurrentWord = () => {
    return wordCategories[currentCategory].words[currentWordIndex];
  };
  
  // Mark word as learned
  const markAsLearned = (word) => {
    const key = `${word.hu}_${word.en}`;
    const newProgress = {
      ...progress,
      [key]: {
        learned: true,
        lastPracticed: Date.now(),
        strength: (progress[key]?.strength || 0) + 1
      }
    };
    setProgress(newProgress);
  };
  
  // Navigation
  const nextWord = () => {
    const categoryWords = wordCategories[currentCategory].words;
    if (currentWordIndex < categoryWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Move to next category
      const categories = Object.keys(wordCategories);
      const currentIdx = categories.indexOf(currentCategory);
      if (currentIdx < categories.length - 1) {
        setCurrentCategory(categories[currentIdx + 1]);
        setCurrentWordIndex(0);
      }
    }
  };
  
  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    } else {
      // Move to previous category
      const categories = Object.keys(wordCategories);
      const currentIdx = categories.indexOf(currentCategory);
      if (currentIdx > 0) {
        const prevCategory = categories[currentIdx - 1];
        setCurrentCategory(prevCategory);
        setCurrentWordIndex(wordCategories[prevCategory].words.length - 1);
      }
    }
  };
  
  // Generate quiz options
  const generateQuizOptions = (correctWord) => {
    const options = [correctWord];
    const usedIndices = new Set([allWords.indexOf(correctWord)]);
    
    while (options.length < 4) {
      const randomIdx = Math.floor(Math.random() * allWords.length);
      if (!usedIndices.has(randomIdx)) {
        usedIndices.add(randomIdx);
        options.push(allWords[randomIdx]);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };
  
  // Start quiz
  const startQuiz = () => {
    const word = getCurrentWord();
    setQuizOptions(generateQuizOptions(word));
    setQuizAnswer(null);
    setPracticeMode('quiz');
  };
  
  // Check quiz answer
  const checkAnswer = (selectedWord) => {
    const correctWord = getCurrentWord();
    const isCorrect = selectedWord.hu === correctWord.hu;
    
    setQuizAnswer(selectedWord);
    
    if (isCorrect) {
      setStreak(streak + 1);
      setTotalScore(totalScore + 10);
      markAsLearned(correctWord);
      
      setTimeout(() => {
        nextWord();
        setQuizOptions(generateQuizOptions(getCurrentWord()));
        setQuizAnswer(null);
      }, 1500);
    } else {
      setStreak(0);
      speak(correctWord.hu);
    }
  };
  
  // Calculate overall progress
  const calculateProgress = () => {
    const learned = Object.keys(progress).filter(key => progress[key].learned).length;
    return Math.round((learned / 100) * 100);
  };
  
  // Get word strength
  const getWordStrength = (word) => {
    const key = `${word.hu}_${word.en}`;
    return progress[key]?.strength || 0;
  };
  
  const currentWord = getCurrentWord();
  const overallProgress = calculateProgress();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            100 Essential Hungarian Words
          </h1>
          
          {/* Progress Overview */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium">Progress: {overallProgress}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="font-medium">Score: {totalScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Streak: {streak}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          
          {/* Speed Control */}
          {speechAvailable && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <label className="text-sm font-medium">Speech Speed:</label>
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-mono">{speechRate}x</span>
            </div>
          )}
        </div>
        
        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setPracticeMode('browse')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                practiceMode === 'browse' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Browse
            </button>
            <button
              onClick={() => setPracticeMode('flashcard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                practiceMode === 'flashcard' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Flashcards
            </button>
            <button
              onClick={startQuiz}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                practiceMode === 'quiz' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Quiz
            </button>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(wordCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => {
                  setCurrentCategory(key);
                  setCurrentWordIndex(0);
                }}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  currentCategory === key 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {practiceMode === 'browse' && (
            <div className="text-center">
              {/* Word Display */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <h2 className="text-5xl font-bold text-indigo-600">{currentWord.hu}</h2>
                  <button
                    onClick={() => speak(currentWord.hu)}
                    className="p-3 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
                  >
                    <Volume2 className="w-6 h-6 text-indigo-600" />
                  </button>
                </div>
                
                {showPhonetic && (
                  <p className="text-2xl text-gray-600 mb-2 font-mono">{currentWord.phonetic}</p>
                )}
                
                <p className="text-3xl font-medium text-gray-800">{currentWord.en}</p>
                
                {/* Word Strength Indicator */}
                <div className="mt-4 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Star
                      key={level}
                      className={`w-6 h-6 ${
                        getWordStrength(currentWord) >= level
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={prevWord}
                  className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
                  {currentWordIndex + 1} / {wordCategories[currentCategory].words.length}
                </span>
                
                <button
                  onClick={nextWord}
                  className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              
              {/* Mark as Learned */}
              <button
                onClick={() => markAsLearned(currentWord)}
                className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Mark as Learned
              </button>
            </div>
          )}
          
          {practiceMode === 'flashcard' && (
            <div className="text-center">
              <div 
                className="relative w-full max-w-md mx-auto h-64 cursor-pointer"
                onClick={() => setShowPhonetic(!showPhonetic)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg p-8 flex flex-col justify-center items-center text-white transform transition-transform duration-500 ${showPhonetic ? 'rotate-y-180' : ''}`}>
                  {!showPhonetic ? (
                    <>
                      <p className="text-2xl mb-2">What is:</p>
                      <p className="text-4xl font-bold">{currentWord.en}</p>
                      <p className="text-sm mt-4 opacity-75">Click to reveal</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-bold mb-4">{currentWord.hu}</p>
                      <p className="text-2xl font-mono">{currentWord.phonetic}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(currentWord.hu);
                        }}
                        className="mt-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Flashcard Navigation */}
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowPhonetic(false);
                    prevWord();
                  }}
                  className="px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    markAsLearned(currentWord);
                    setShowPhonetic(false);
                    nextWord();
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Got it! Next
                </button>
              </div>
            </div>
          )}
          
          {practiceMode === 'quiz' && (
            <div className="text-center">
              <div className="mb-8">
                <p className="text-2xl mb-4">How do you say:</p>
                <p className="text-4xl font-bold text-indigo-600 mb-8">{currentWord.en}</p>
                
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  {quizOptions.map((option, idx) => {
                    const isSelected = quizAnswer?.hu === option.hu;
                    const isCorrect = option.hu === currentWord.hu;
                    const showResult = quizAnswer !== null;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => !quizAnswer && checkAnswer(option)}
                        disabled={quizAnswer !== null}
                        className={`p-4 rounded-lg font-medium text-lg transition-all ${
                          showResult && isCorrect
                            ? 'bg-green-500 text-white'
                            : showResult && isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {option.hu}
                        {showResult && isCorrect && ' ✓'}
                        {showResult && isSelected && !isCorrect && ' ✗'}
                      </button>
                    );
                  })}
                </div>
                
                {quizAnswer && (
                  <div className="mt-6">
                    <p className="text-lg mb-2">
                      {quizAnswer.hu === currentWord.hu ? '🎉 Correct!' : '💭 Not quite...'}
                    </p>
                    <p className="text-xl font-mono text-gray-600">{currentWord.phonetic}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Word Grid Overview */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Your Learning Journey</h3>
          <div className="grid grid-cols-10 gap-2">
            {allWords.map((word, idx) => {
              const key = `${word.hu}_${word.en}`;
              const isLearned = progress[key]?.learned;
              
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded flex items-center justify-center text-xs font-bold ${
                    isLearned ? 'bg-green-500 text-white' : 'bg-gray-200'
                  }`}
                  title={`${word.hu} - ${word.en}`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hungarian100WordsV1;
