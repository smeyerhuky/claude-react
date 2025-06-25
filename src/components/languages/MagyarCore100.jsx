import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Star, Award, RotateCcw, ChevronRight, ChevronLeft, Zap, BookOpen, Target, TrendingUp, Check, X, Search, Plus, Shuffle } from 'lucide-react';

const MagyarCore100 = () => {
  // Core word data - The 100 most essential Hungarian words with enhanced structure
  const wordCategories = {
    basics: {
      title: "Survival Essentials",
      icon: "🏥",
      words: [
        { id: 1, hu: "igen", en: "yes", phonetic: "EE-gen", category: "basics", frequency: 1 },
        { id: 2, hu: "nem", en: "no", phonetic: "nem", category: "basics", frequency: 2 },
        { id: 3, hu: "köszönöm", en: "thank you", phonetic: "KUH-suh-nuhm", category: "basics", frequency: 3 },
        { id: 4, hu: "kérem", en: "please", phonetic: "KAY-rem", category: "basics", frequency: 4 },
        { id: 5, hu: "bocsánat", en: "sorry", phonetic: "BOH-chah-naht", category: "basics", frequency: 5 },
        { id: 6, hu: "szia", en: "hi/bye", phonetic: "SEE-ah", category: "basics", frequency: 6 },
        { id: 7, hu: "viszlát", en: "goodbye", phonetic: "VEES-laht", category: "basics", frequency: 7 },
        { id: 8, hu: "segítség", en: "help", phonetic: "SHEH-geet-shayg", category: "basics", frequency: 8 }
      ]
    },
    pronouns: {
      title: "People & Pronouns",
      icon: "👥",
      words: [
        { id: 9, hu: "én", en: "I", phonetic: "ayn", category: "pronouns", frequency: 9 },
        { id: 10, hu: "te", en: "you", phonetic: "teh", category: "pronouns", frequency: 10 },
        { id: 11, hu: "ő", en: "he/she", phonetic: "uh", category: "pronouns", frequency: 11 },
        { id: 12, hu: "mi", en: "we", phonetic: "mee", category: "pronouns", frequency: 12 },
        { id: 13, hu: "ők", en: "they", phonetic: "uhk", category: "pronouns", frequency: 13 },
        { id: 14, hu: "ez", en: "this", phonetic: "ez", category: "pronouns", frequency: 14 },
        { id: 15, hu: "az", en: "that", phonetic: "ahz", category: "pronouns", frequency: 15 },
        { id: 16, hu: "ki", en: "who", phonetic: "kee", category: "pronouns", frequency: 16 },
        { id: 17, hu: "mit", en: "what", phonetic: "meet", category: "pronouns", frequency: 17 }
      ]
    },
    verbs: {
      title: "Action Words",
      icon: "🏃",
      words: [
        { id: 18, hu: "van", en: "is/are", phonetic: "vahn", category: "verbs", frequency: 18 },
        { id: 19, hu: "nincs", en: "there isn't", phonetic: "neench", category: "verbs", frequency: 19 },
        { id: 20, hu: "akar", en: "want", phonetic: "AH-kahr", category: "verbs", frequency: 20 },
        { id: 21, hu: "megy", en: "go", phonetic: "medj", category: "verbs", frequency: 21 },
        { id: 22, hu: "jön", en: "come", phonetic: "yuhn", category: "verbs", frequency: 22 },
        { id: 23, hu: "lát", en: "see", phonetic: "laht", category: "verbs", frequency: 23 },
        { id: 24, hu: "eszik", en: "eat", phonetic: "ES-eek", category: "verbs", frequency: 24 },
        { id: 25, hu: "iszik", en: "drink", phonetic: "EE-seek", category: "verbs", frequency: 25 },
        { id: 26, hu: "beszél", en: "speak", phonetic: "BES-ayl", category: "verbs", frequency: 26 },
        { id: 27, hu: "ért", en: "understand", phonetic: "ayrt", category: "verbs", frequency: 27 },
        { id: 28, hu: "tud", en: "know/can", phonetic: "tood", category: "verbs", frequency: 28 },
        { id: 29, hu: "kér", en: "ask for", phonetic: "kayr", category: "verbs", frequency: 29 },
        { id: 30, hu: "ad", en: "give", phonetic: "ahd", category: "verbs", frequency: 30 },
        { id: 31, hu: "vesz", en: "take/buy", phonetic: "ves", category: "verbs", frequency: 31 },
        { id: 32, hu: "szeret", en: "love/like", phonetic: "SEH-ret", category: "verbs", frequency: 32 }
      ]
    },
    numbers: {
      title: "Numbers & Time",
      icon: "🔢",
      words: [
        { id: 33, hu: "egy", en: "one", phonetic: "edj", category: "numbers", frequency: 33 },
        { id: 34, hu: "kettő", en: "two", phonetic: "KET-tuh", category: "numbers", frequency: 34 },
        { id: 35, hu: "három", en: "three", phonetic: "HAH-rohm", category: "numbers", frequency: 35 },
        { id: 36, hu: "négy", en: "four", phonetic: "naydj", category: "numbers", frequency: 36 },
        { id: 37, hu: "öt", en: "five", phonetic: "uht", category: "numbers", frequency: 37 },
        { id: 38, hu: "tíz", en: "ten", phonetic: "teez", category: "numbers", frequency: 38 },
        { id: 39, hu: "száz", en: "hundred", phonetic: "sahz", category: "numbers", frequency: 39 },
        { id: 40, hu: "most", en: "now", phonetic: "mohsht", category: "numbers", frequency: 40 },
        { id: 41, hu: "ma", en: "today", phonetic: "mah", category: "numbers", frequency: 41 },
        { id: 42, hu: "holnap", en: "tomorrow", phonetic: "HOHL-nahp", category: "numbers", frequency: 42 },
        { id: 43, hu: "tegnap", en: "yesterday", phonetic: "TEG-nahp", category: "numbers", frequency: 43 }
      ]
    },
    questions: {
      title: "Question Words",
      icon: "❓",
      words: [
        { id: 44, hu: "hol", en: "where", phonetic: "hohl", category: "questions", frequency: 44 },
        { id: 45, hu: "mikor", en: "when", phonetic: "MEE-kohr", category: "questions", frequency: 45 },
        { id: 46, hu: "miért", en: "why", phonetic: "MEE-ayrt", category: "questions", frequency: 46 },
        { id: 47, hu: "hogyan", en: "how", phonetic: "HOH-djahn", category: "questions", frequency: 47 },
        { id: 48, hu: "mennyi", en: "how much", phonetic: "MEN-nyee", category: "questions", frequency: 48 },
        { id: 49, hu: "melyik", en: "which", phonetic: "MEH-yeek", category: "questions", frequency: 49 }
      ]
    },
    descriptors: {
      title: "Descriptions",
      icon: "🎨",
      words: [
        { id: 50, hu: "jó", en: "good", phonetic: "yoh", category: "descriptors", frequency: 50 },
        { id: 51, hu: "rossz", en: "bad", phonetic: "rohs", category: "descriptors", frequency: 51 },
        { id: 52, hu: "nagy", en: "big", phonetic: "nahdj", category: "descriptors", frequency: 52 },
        { id: 53, hu: "kicsi", en: "small", phonetic: "KEE-chee", category: "descriptors", frequency: 53 },
        { id: 54, hu: "új", en: "new", phonetic: "ooy", category: "descriptors", frequency: 54 },
        { id: 55, hu: "régi", en: "old", phonetic: "RAY-gee", category: "descriptors", frequency: 55 },
        { id: 56, hu: "szép", en: "beautiful", phonetic: "sayp", category: "descriptors", frequency: 56 },
        { id: 57, hu: "drága", en: "expensive", phonetic: "DRAH-gah", category: "descriptors", frequency: 57 },
        { id: 58, hu: "olcsó", en: "cheap", phonetic: "OHL-choh", category: "descriptors", frequency: 58 },
        { id: 59, hu: "meleg", en: "hot/warm", phonetic: "MEH-leg", category: "descriptors", frequency: 59 },
        { id: 60, hu: "hideg", en: "cold", phonetic: "HEE-deg", category: "descriptors", frequency: 60 }
      ]
    },
    places: {
      title: "Places & Directions",
      icon: "🗺️",
      words: [
        { id: 61, hu: "itt", en: "here", phonetic: "eet", category: "places", frequency: 61 },
        { id: 62, hu: "ott", en: "there", phonetic: "oht", category: "places", frequency: 62 },
        { id: 63, hu: "bal", en: "left", phonetic: "bahl", category: "places", frequency: 63 },
        { id: 64, hu: "jobb", en: "right", phonetic: "yohb", category: "places", frequency: 64 },
        { id: 65, hu: "utca", en: "street", phonetic: "OOT-tsah", category: "places", frequency: 65 },
        { id: 66, hu: "ház", en: "house", phonetic: "hahz", category: "places", frequency: 66 },
        { id: 67, hu: "város", en: "city", phonetic: "VAH-rohsh", category: "places", frequency: 67 },
        { id: 68, hu: "ország", en: "country", phonetic: "OHR-sahg", category: "places", frequency: 68 },
        { id: 69, hu: "víz", en: "water", phonetic: "veez", category: "places", frequency: 69 },
        { id: 70, hu: "bolt", en: "shop", phonetic: "bohlt", category: "places", frequency: 70 }
      ]
    },
    people: {
      title: "People & Family",
      icon: "👨‍👩‍👧‍👦",
      words: [
        { id: 71, hu: "ember", en: "person", phonetic: "EM-ber", category: "people", frequency: 71 },
        { id: 72, hu: "férfi", en: "man", phonetic: "FAYR-fee", category: "people", frequency: 72 },
        { id: 73, hu: "nő", en: "woman", phonetic: "nuh", category: "people", frequency: 73 },
        { id: 74, hu: "gyerek", en: "child", phonetic: "DJEH-rek", category: "people", frequency: 74 },
        { id: 75, hu: "barát", en: "friend", phonetic: "BAH-raht", category: "people", frequency: 75 },
        { id: 76, hu: "család", en: "family", phonetic: "CHAH-lahd", category: "people", frequency: 76 },
        { id: 77, hu: "név", en: "name", phonetic: "nayv", category: "people", frequency: 77 }
      ]
    },
    essentials: {
      title: "Daily Essentials",
      icon: "🍞",
      words: [
        { id: 78, hu: "kenyér", en: "bread", phonetic: "KEN-yayr", category: "essentials", frequency: 78 },
        { id: 79, hu: "étel", en: "food", phonetic: "AY-tel", category: "essentials", frequency: 79 },
        { id: 80, hu: "ital", en: "drink", phonetic: "EE-tahl", category: "essentials", frequency: 80 },
        { id: 81, hu: "pénz", en: "money", phonetic: "paynz", category: "essentials", frequency: 81 },
        { id: 82, hu: "idő", en: "time", phonetic: "EE-duh", category: "essentials", frequency: 82 },
        { id: 83, hu: "nap", en: "day/sun", phonetic: "nahp", category: "essentials", frequency: 83 },
        { id: 84, hu: "év", en: "year", phonetic: "ayv", category: "essentials", frequency: 84 },
        { id: 85, hu: "dolog", en: "thing", phonetic: "DOH-lohg", category: "essentials", frequency: 85 },
        { id: 86, hu: "munka", en: "work", phonetic: "MOON-kah", category: "essentials", frequency: 86 },
        { id: 87, hu: "ár", en: "price", phonetic: "ahr", category: "essentials", frequency: 87 }
      ]
    },
    connecting: {
      title: "Connecting Words",
      icon: "🔗",
      words: [
        { id: 88, hu: "és", en: "and", phonetic: "aysh", category: "connecting", frequency: 88 },
        { id: 89, hu: "vagy", en: "or", phonetic: "vahdj", category: "connecting", frequency: 89 },
        { id: 90, hu: "de", en: "but", phonetic: "deh", category: "connecting", frequency: 90 },
        { id: 91, hu: "mert", en: "because", phonetic: "mert", category: "connecting", frequency: 91 },
        { id: 92, hu: "is", en: "also", phonetic: "eesh", category: "connecting", frequency: 92 },
        { id: 93, hu: "még", en: "still/yet", phonetic: "mayg", category: "connecting", frequency: 93 },
        { id: 94, hu: "már", en: "already", phonetic: "mahr", category: "connecting", frequency: 94 },
        { id: 95, hu: "majd", en: "will/then", phonetic: "mahyd", category: "connecting", frequency: 95 },
        { id: 96, hu: "csak", en: "only", phonetic: "chahk", category: "connecting", frequency: 96 },
        { id: 97, hu: "nagyon", en: "very", phonetic: "NAH-djon", category: "connecting", frequency: 97 },
        { id: 98, hu: "kell", en: "need/must", phonetic: "kel", category: "connecting", frequency: 98 },
        { id: 99, hu: "lehet", en: "can/possible", phonetic: "LEH-het", category: "connecting", frequency: 99 },
        { id: 100, hu: "kérek", en: "I ask for", phonetic: "KAY-rek", category: "connecting", frequency: 100 }
      ]
    }
  };

  // Flatten all words for easy access
  const allWords = Object.values(wordCategories).flatMap(cat => cat.words);

  // Sentence templates for building practice
  const sentenceTemplates = [
    {
      id: 'ask-for-item',
      pattern: ['kérek', 'egy', '[item]'],
      english: 'I would like a [item]',
      example: 'Kérek egy kenyeret',
      difficulty: 'beginner'
    },
    {
      id: 'where-is',
      pattern: ['hol', 'van', 'a/az', '[place]'],
      english: 'Where is the [place]?',
      example: 'Hol van a bolt?',
      difficulty: 'beginner'
    },
    {
      id: 'i-want',
      pattern: ['én', 'akar', '[item]'],
      english: 'I want [item]',
      example: 'Én akar víz',
      difficulty: 'beginner'
    }
  ];

  // Quick access word sets
  const quickAccessSets = {
    travel: [3, 4, 5, 8, 44, 70, 81, 100], // thank you, please, sorry, help, where, shop, money, I ask for
    food: [24, 25, 78, 79, 80, 100, 33], // eat, drink, bread, food, drink, I ask for, one
    basics: [1, 2, 3, 6, 7, 9, 10, 18], // yes, no, thank you, hi, goodbye, I, you, is
    questions: [44, 45, 46, 47, 48, 16, 17] // where, when, why, how, how much, who, what
  };

  // State management
  const [activeMode, setActiveMode] = useState('learn'); // learn, build, flashcard, quiz
  const [currentCategory, setCurrentCategory] = useState('basics');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quickAccessCategory, setQuickAccessCategory] = useState('basics');

  // Speech synthesis state
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [voices, setVoices] = useState([]);
  const [hungarianVoice, setHungarianVoice] = useState(null);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [audioStatus, setAudioStatus] = useState({ show: false, text: '' });

  // Learning progress state
  const [progress, setProgress] = useState({});
  const [streak, setStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [masteredWords, setMasteredWords] = useState(new Set());

  // Sentence building state
  const [currentSentence, setCurrentSentence] = useState([]);
  const [sentenceResult, setSentenceResult] = useState(null);
  const [recentWords, setRecentWords] = useState([]);

  // Flashcard and quiz state
  const [showPhonetic, setShowPhonetic] = useState(true);
  const [quizOptions, setQuizOptions] = useState([]);
  const [quizAnswer, setQuizAnswer] = useState(null);

  const currentUtteranceRef = useRef(null);

  // Initialize speech synthesis and load progress
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
    const savedProgress = localStorage.getItem('oneHundredMagyarProgress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    
    const savedScore = localStorage.getItem('oneHundredMagyarScore');
    if (savedScore) {
      setTotalScore(parseInt(savedScore));
    }

    const savedStreak = localStorage.getItem('oneHundredMagyarStreak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak));
    }

    const savedMastered = localStorage.getItem('oneHundredMagyarMastered');
    if (savedMastered) {
      setMasteredWords(new Set(JSON.parse(savedMastered)));
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('oneHundredMagyarProgress', JSON.stringify(progress));
  }, [progress]);
  
  useEffect(() => {
    localStorage.setItem('oneHundredMagyarScore', totalScore.toString());
  }, [totalScore]);

  useEffect(() => {
    localStorage.setItem('oneHundredMagyarStreak', streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('oneHundredMagyarMastered', JSON.stringify([...masteredWords]));
  }, [masteredWords]);

  // Speech function
  const speak = useCallback((text, lang = 'hu-HU') => {
    if (!speechAvailable) {
      setAudioStatus({ show: true, text: `🔇 ${text} (audio not available)` });
      setTimeout(() => setAudioStatus({ show: false, text: '' }), 2000);
      return;
    }
    
    if (currentUtteranceRef.current) {
      speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = speechRate;
    
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
  }, [speechAvailable, hungarianVoice, speechRate]);

  // Word mastery functions
  const markAsLearned = useCallback((word) => {
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
    setMasteredWords(prev => new Set([...prev, word.id]));
    setTotalScore(prev => prev + 10);
  }, [progress]);

  const getWordStrength = useCallback((word) => {
    const key = `${word.hu}_${word.en}`;
    return progress[key]?.strength || 0;
  }, [progress]);

  // Navigation functions
  const getCurrentWord = useCallback(() => {
    return wordCategories[currentCategory].words[currentWordIndex];
  }, [currentCategory, currentWordIndex]);

  const nextWord = useCallback(() => {
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
  }, [currentCategory, currentWordIndex]);

  const prevWord = useCallback(() => {
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
  }, [currentCategory, currentWordIndex]);

  // Sentence building functions
  const addWordToSentence = useCallback((word) => {
    setCurrentSentence(prev => [...prev, word]);
    
    // Add to recent words
    setRecentWords(prev => {
      const newRecent = [word, ...prev.filter(w => w.id !== word.id)].slice(0, 8);
      return newRecent;
    });
  }, []);

  const removeFromSentence = useCallback((index) => {
    setCurrentSentence(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearSentence = useCallback(() => {
    setCurrentSentence([]);
    setSentenceResult(null);
  }, []);

  const analyzeSentence = useCallback(() => {
    if (currentSentence.length === 0) return;

    const sentence = currentSentence.map(word => word.hu).join(' ');
    const englishTranslation = currentSentence.map(word => word.en).join(' ');
    
    // Check against known patterns
    const matchedTemplate = sentenceTemplates.find(template => {
      const patternWords = template.pattern.filter(word => !word.startsWith('['));
      return patternWords.every(word => 
        currentSentence.some(sentenceWord => sentenceWord.hu === word)
      );
    });

    setSentenceResult({
      hungarian: sentence,
      english: englishTranslation,
      template: matchedTemplate,
      isValid: matchedTemplate ? true : false
    });
  }, [currentSentence]);

  const speakSentence = useCallback(() => {
    if (currentSentence.length > 0) {
      const sentence = currentSentence.map(word => word.hu).join(' ');
      speak(sentence);
    }
  }, [currentSentence, speak]);

  // Quiz functions
  const generateQuizOptions = useCallback((correctWord) => {
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
  }, [allWords]);

  const startQuiz = useCallback(() => {
    const word = getCurrentWord();
    setQuizOptions(generateQuizOptions(word));
    setQuizAnswer(null);
    setActiveMode('quiz');
  }, [getCurrentWord, generateQuizOptions]);

  const checkAnswer = useCallback((selectedWord) => {
    const correctWord = getCurrentWord();
    const isCorrect = selectedWord.hu === correctWord.hu;
    
    setQuizAnswer(selectedWord);
    
    if (isCorrect) {
      setStreak(prev => prev + 1);
      setTotalScore(prev => prev + 10);
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
  }, [getCurrentWord, markAsLearned, nextWord, generateQuizOptions, speak]);

  // Filter and access functions
  const getFilteredWords = useCallback(() => {
    let words = selectedCategory === 'all' 
      ? allWords 
      : allWords.filter(word => word.category === selectedCategory);
    
    if (searchTerm) {
      words = words.filter(word => 
        word.hu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.en.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return words;
  }, [selectedCategory, searchTerm, allWords]);

  const getQuickAccessWords = useCallback(() => {
    const wordIds = quickAccessSets[quickAccessCategory] || [];
    return allWords.filter(word => wordIds.includes(word.id));
  }, [quickAccessCategory, allWords]);

  // Calculate overall progress
  const calculateProgress = useCallback(() => {
    return Math.round((masteredWords.size / 100) * 100);
  }, [masteredWords.size]);

  const overallProgress = calculateProgress();
  const currentWord = getCurrentWord();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            🇭🇺 OneHundredMagyar
          </h1>
          <p className="text-center text-gray-600 italic mb-4">
            Master 100 essential Hungarian words through immersive learning
          </p>
          
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
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Speed Control */}
          {speechAvailable && (
            <div className="flex items-center justify-center gap-4 text-sm">
              <label className="font-medium">Speech Speed:</label>
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="font-mono">{speechRate}x</span>
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setActiveMode('learn')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeMode === 'learn' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Learn Words
            </button>
            <button
              onClick={() => setActiveMode('build')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeMode === 'build' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Build Sentences
            </button>
            <button
              onClick={() => setActiveMode('flashcard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeMode === 'flashcard' 
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
                activeMode === 'quiz' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Quiz Mode
            </button>
          </div>
        </div>

        {/* Learn Words Mode */}
        {activeMode === 'learn' && (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search words..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(wordCategories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.icon} {category.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Words Grid */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {getFilteredWords().map((word) => {
                  const isMastered = masteredWords.has(word.id);
                  const strength = getWordStrength(word);
                  
                  return (
                    <div
                      key={word.id}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${isMastered 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                        }
                      `}
                    >
                      {/* Mastery Toggle */}
                      <button
                        onClick={() => markAsLearned(word)}
                        className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isMastered 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {isMastered && <Check className="w-3 h-3" />}
                      </button>

                      {/* Word Content */}
                      <div onClick={() => speak(word.hu)} className="cursor-pointer">
                        <div className="flex items-center gap-1 mb-1">
                          <Volume2 className="w-3 h-3 text-indigo-500" />
                          <span className="text-xs text-gray-500">#{word.frequency}</span>
                        </div>
                        
                        <div className="text-xl font-bold text-indigo-700 mb-1">
                          {word.hu}
                        </div>
                        
                        <div className="text-sm font-mono text-gray-500 mb-1">
                          {word.phonetic}
                        </div>
                        
                        <div className="text-gray-600 font-medium mb-2">
                          {word.en}
                        </div>
                        
                        {/* Word Strength */}
                        <div className="flex gap-1">
                          {[1, 2, 3].map((level) => (
                            <Star
                              key={level}
                              className={`w-3 h-3 ${
                                strength >= level
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
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

        {/* Build Sentences Mode */}
        {activeMode === 'build' && (
          <div className="space-y-4">
            {/* Sentence Builder */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🔧 Sentence Construction</h3>
              
              {/* Current Sentence Display */}
              <div className="mb-4">
                <div className="min-h-16 border-2 border-dashed border-indigo-300 rounded-lg p-3 bg-indigo-50">
                  <div className="text-sm text-gray-600 mb-2">Your sentence:</div>
                  <div className="flex flex-wrap gap-2">
                    {currentSentence.length === 0 ? (
                      <span className="text-gray-400 italic">Click words below to build...</span>
                    ) : (
                      currentSentence.map((word, index) => (
                        <div
                          key={`${word.id}-${index}`}
                          className="bg-indigo-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <span>{word.hu}</span>
                          <button
                            onClick={() => removeFromSentence(index)}
                            className="hover:bg-indigo-700 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={speakSentence}
                  disabled={currentSentence.length === 0}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                >
                  <Volume2 className="w-4 h-4" />
                  Speak
                </button>
                <button
                  onClick={analyzeSentence}
                  disabled={currentSentence.length === 0}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                >
                  <Target className="w-4 h-4" />
                  Analyze
                </button>
                <button
                  onClick={clearSentence}
                  disabled={currentSentence.length === 0}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </button>
              </div>

              {/* Sentence Analysis */}
              {sentenceResult && (
                <div className="mb-4 p-3 rounded-lg bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-2">Analysis:</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Hungarian:</strong> {sentenceResult.hungarian}</div>
                    <div><strong>English:</strong> {sentenceResult.english}</div>
                    {sentenceResult.template && (
                      <div className="bg-green-100 p-2 rounded-lg">
                        <strong>✅ Pattern:</strong> {sentenceResult.template.english}
                      </div>
                    )}
                    {!sentenceResult.isValid && (
                      <div className="bg-yellow-100 p-2 rounded-lg">
                        <strong>⚠️ Experimental:</strong> Try our templates below!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access Word Bank */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-800">🎯 Quick Words</h3>
                <select
                  value={quickAccessCategory}
                  onChange={(e) => setQuickAccessCategory(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="basics">Basics</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="questions">Questions</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {getQuickAccessWords().map((word) => (
                  <button
                    key={word.id}
                    onClick={() => addWordToSentence(word)}
                    className="bg-gray-100 hover:bg-indigo-100 border-2 border-transparent hover:border-indigo-300 p-2 rounded-lg cursor-pointer transition-all text-sm"
                  >
                    <div className="font-bold text-indigo-700">{word.hu}</div>
                    <div className="text-xs text-gray-600">{word.en}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Words */}
            {recentWords.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">🕒 Recently Used</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {recentWords.map((word) => (
                    <button
                      key={`recent-${word.id}`}
                      onClick={() => addWordToSentence(word)}
                      className="bg-purple-100 hover:bg-purple-200 p-2 rounded-lg transition-all text-sm"
                    >
                      <div className="font-bold text-purple-700">{word.hu}</div>
                      <div className="text-xs text-purple-600">{word.en}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flashcard Mode */}
        {activeMode === 'flashcard' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div 
                className="relative w-full max-w-md mx-auto h-64 cursor-pointer"
                onClick={() => setShowPhonetic(!showPhonetic)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg p-8 flex flex-col justify-center items-center text-white transform transition-transform duration-500`}>
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
          </div>
        )}

        {/* Quiz Mode */}
        {activeMode === 'quiz' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
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
          </div>
        )}

        {/* Word Grid Overview */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Your Learning Journey</h3>
          <div className="grid grid-cols-10 gap-2">
            {allWords.map((word, idx) => {
              const isMastered = masteredWords.has(word.id);
              
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded flex items-center justify-center text-xs font-bold ${
                    isMastered ? 'bg-green-500 text-white' : 'bg-gray-200'
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

      {/* Audio Status */}
      {audioStatus.show && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg transition-opacity text-sm">
          {audioStatus.text}
        </div>
      )}
    </div>
  );
};

export default MagyarCore100;
