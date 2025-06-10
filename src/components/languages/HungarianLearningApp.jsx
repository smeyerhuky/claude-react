
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Volume2, Check, X, Award, BookOpen, Target, TrendingUp } from 'lucide-react';

const HungarianLearningApp = () => {
  // Swadesh 100 list + Yiddish-origin words
  const vocabulary = {
    pronouns: [
      { hungarian: "én", english: "I", pronunciation: "eːn", hebrew: null },
      { hungarian: "te", english: "you (singular)", pronunciation: "tɛ", hebrew: null },
      { hungarian: "ő", english: "he/she/it", pronunciation: "øː", hebrew: null },
      { hungarian: "mi", english: "we", pronunciation: "mi", hebrew: null },
      { hungarian: "ti", english: "you (plural)", pronunciation: "ti", hebrew: null },
      { hungarian: "ők", english: "they", pronunciation: "øːk", hebrew: null },
      { hungarian: "ez", english: "this", pronunciation: "ɛz", hebrew: null },
      { hungarian: "az", english: "that", pronunciation: "ɑz", hebrew: null },
      { hungarian: "itt", english: "here", pronunciation: "itː", hebrew: null },
      { hungarian: "ott", english: "there", pronunciation: "otː", hebrew: null },
      { hungarian: "ki", english: "who", pronunciation: "ki", hebrew: null },
      { hungarian: "mi", english: "what", pronunciation: "mi", hebrew: null },
      { hungarian: "hol", english: "where", pronunciation: "hol", hebrew: null },
      { hungarian: "mikor", english: "when", pronunciation: "mikor", hebrew: null },
      { hungarian: "hogyan", english: "how", pronunciation: "hoɟɑn", hebrew: null }
    ],
    numbers: [
      { hungarian: "egy", english: "one", pronunciation: "ɛɟ", hebrew: null },
      { hungarian: "kettő/két", english: "two", pronunciation: "kɛtːøː/keːt", hebrew: null },
      { hungarian: "három", english: "three", pronunciation: "haːrom", hebrew: null },
      { hungarian: "négy", english: "four", pronunciation: "neːɟ", hebrew: null },
      { hungarian: "öt", english: "five", pronunciation: "øt", hebrew: null }
    ],
    bodyParts: [
      { hungarian: "fej", english: "head", pronunciation: "fɛj", hebrew: null },
      { hungarian: "haj", english: "hair", pronunciation: "hɑj", hebrew: null },
      { hungarian: "szem", english: "eye", pronunciation: "sɛm", hebrew: null },
      { hungarian: "fül", english: "ear", pronunciation: "fyl", hebrew: null },
      { hungarian: "orr", english: "nose", pronunciation: "orː", hebrew: null },
      { hungarian: "száj", english: "mouth", pronunciation: "saːj", hebrew: null },
      { hungarian: "fog", english: "tooth", pronunciation: "fog", hebrew: null },
      { hungarian: "nyelv", english: "tongue", pronunciation: "ɲɛlv", hebrew: null },
      { hungarian: "kéz", english: "hand", pronunciation: "keːz", hebrew: null },
      { hungarian: "láb", english: "foot", pronunciation: "laːb", hebrew: null },
      { hungarian: "szív", english: "heart", pronunciation: "siːv", hebrew: null },
      { hungarian: "vér", english: "blood", pronunciation: "veːr", hebrew: null }
    ],
    nature: [
      { hungarian: "nap", english: "sun/day", pronunciation: "nɑp", hebrew: null },
      { hungarian: "hold", english: "moon", pronunciation: "hold", hebrew: null },
      { hungarian: "csillag", english: "star", pronunciation: "t͡ʃilːɑg", hebrew: null },
      { hungarian: "víz", english: "water", pronunciation: "viːz", hebrew: null },
      { hungarian: "eső", english: "rain", pronunciation: "ɛʃøː", hebrew: null },
      { hungarian: "kő", english: "stone", pronunciation: "køː", hebrew: null },
      { hungarian: "homok", english: "sand", pronunciation: "homok", hebrew: null },
      { hungarian: "föld", english: "earth", pronunciation: "føld", hebrew: null },
      { hungarian: "felhő", english: "cloud", pronunciation: "fɛlhøː", hebrew: null },
      { hungarian: "köd", english: "fog", pronunciation: "kød", hebrew: null },
      { hungarian: "ég", english: "sky", pronunciation: "eːg", hebrew: null },
      { hungarian: "szél", english: "wind", pronunciation: "seːl", hebrew: null },
      { hungarian: "hó", english: "snow", pronunciation: "hoː", hebrew: null },
      { hungarian: "jég", english: "ice", pronunciation: "jeːg", hebrew: null },
      { hungarian: "tűz", english: "fire", pronunciation: "tyːz", hebrew: null },
      { hungarian: "hamu", english: "ash", pronunciation: "hɑmu", hebrew: null },
      { hungarian: "ég", english: "burn", pronunciation: "eːg", hebrew: null },
      { hungarian: "út", english: "road", pronunciation: "uːt", hebrew: null },
      { hungarian: "hegy", english: "mountain", pronunciation: "hɛɟ", hebrew: null },
      { hungarian: "zöld", english: "green", pronunciation: "zøld", hebrew: null },
      { hungarian: "sárga", english: "yellow", pronunciation: "ʃaːrgɑ", hebrew: null },
      { hungarian: "fehér", english: "white", pronunciation: "fɛheːr", hebrew: null },
      { hungarian: "fekete", english: "black", pronunciation: "fɛkɛtɛ", hebrew: null },
      { hungarian: "éjszaka", english: "night", pronunciation: "eːjsɑkɑ", hebrew: null }
    ],
    commonWords: [
      { hungarian: "ember", english: "person/human", pronunciation: "ɛmbɛr", hebrew: null },
      { hungarian: "férfi", english: "man", pronunciation: "feːrfi", hebrew: null },
      { hungarian: "nő", english: "woman", pronunciation: "nøː", hebrew: null },
      { hungarian: "gyerek", english: "child", pronunciation: "ɟɛrɛk", hebrew: null },
      { hungarian: "név", english: "name", pronunciation: "neːv", hebrew: null },
      { hungarian: "hal", english: "fish", pronunciation: "hɑl", hebrew: null },
      { hungarian: "madár", english: "bird", pronunciation: "mɑdaːr", hebrew: null },
      { hungarian: "kutya", english: "dog", pronunciation: "kucɑ", hebrew: null },
      { hungarian: "tetű", english: "louse", pronunciation: "tɛtyː", hebrew: null },
      { hungarian: "fa", english: "tree", pronunciation: "fɑ", hebrew: null },
      { hungarian: "mag", english: "seed", pronunciation: "mɑg", hebrew: null },
      { hungarian: "levél", english: "leaf", pronunciation: "lɛveːl", hebrew: null },
      { hungarian: "gyökér", english: "root", pronunciation: "ɟøkeːr", hebrew: null },
      { hungarian: "kéreg", english: "bark", pronunciation: "keːrɛg", hebrew: null },
      { hungarian: "bőr", english: "skin", pronunciation: "bøːr", hebrew: null },
      { hungarian: "hús", english: "meat/flesh", pronunciation: "huːʃ", hebrew: null },
      { hungarian: "tojás", english: "egg", pronunciation: "tojaːʃ", hebrew: null },
      { hungarian: "szarv", english: "horn", pronunciation: "sɑrv", hebrew: null },
      { hungarian: "farok", english: "tail", pronunciation: "fɑrok", hebrew: null },
      { hungarian: "toll", english: "feather", pronunciation: "tolː", hebrew: null },
      { hungarian: "zsír", english: "fat", pronunciation: "ʒiːr", hebrew: null }
    ],
    verbs: [
      { hungarian: "iszik", english: "drink", pronunciation: "isik", hebrew: null },
      { hungarian: "eszik", english: "eat", pronunciation: "ɛsik", hebrew: null },
      { hungarian: "harap", english: "bite", pronunciation: "hɑrɑp", hebrew: null },
      { hungarian: "lát", english: "see", pronunciation: "laːt", hebrew: null },
      { hungarian: "hall", english: "hear", pronunciation: "hɑlː", hebrew: null },
      { hungarian: "tud", english: "know", pronunciation: "tud", hebrew: null },
      { hungarian: "alszik", english: "sleep", pronunciation: "ɑlsik", hebrew: null },
      { hungarian: "hal", english: "die", pronunciation: "hɑl", hebrew: null },
      { hungarian: "öl", english: "kill", pronunciation: "øl", hebrew: null },
      { hungarian: "úszik", english: "swim", pronunciation: "uːsik", hebrew: null },
      { hungarian: "repül", english: "fly", pronunciation: "rɛpyl", hebrew: null },
      { hungarian: "jár", english: "walk", pronunciation: "jaːr", hebrew: null },
      { hungarian: "jön", english: "come", pronunciation: "jøn", hebrew: null },
      { hungarian: "fekszik", english: "lie", pronunciation: "fɛksik", hebrew: null },
      { hungarian: "ül", english: "sit", pronunciation: "yl", hebrew: null },
      { hungarian: "áll", english: "stand", pronunciation: "aːlː", hebrew: null },
      { hungarian: "ad", english: "give", pronunciation: "ɑd", hebrew: null },
      { hungarian: "mond", english: "say", pronunciation: "mond", hebrew: null },
      { hungarian: "fordul", english: "turn", pronunciation: "fordul", hebrew: null }
    ],
    adjectives: [
      { hungarian: "minden", english: "all", pronunciation: "mindɛn", hebrew: null },
      { hungarian: "sok", english: "many", pronunciation: "ʃok", hebrew: null },
      { hungarian: "nagy", english: "big", pronunciation: "nɑɟ", hebrew: null },
      { hungarian: "hosszú", english: "long", pronunciation: "hosːuː", hebrew: null },
      { hungarian: "kicsi", english: "small", pronunciation: "kit͡ʃi", hebrew: null },
      { hungarian: "rövid", english: "short", pronunciation: "røvid", hebrew: null },
      { hungarian: "vastag", english: "thick", pronunciation: "vɑʃtɑg", hebrew: null },
      { hungarian: "vékony", english: "thin", pronunciation: "veːkoɲ", hebrew: null },
      { hungarian: "széles", english: "wide", pronunciation: "seːlɛʃ", hebrew: null },
      { hungarian: "keskeny", english: "narrow", pronunciation: "kɛʃkɛɲ", hebrew: null },
      { hungarian: "jó", english: "good", pronunciation: "joː", hebrew: null },
      { hungarian: "rossz", english: "bad", pronunciation: "rosː", hebrew: null },
      { hungarian: "új", english: "new", pronunciation: "uːj", hebrew: null },
      { hungarian: "régi", english: "old", pronunciation: "reːgi", hebrew: null },
      { hungarian: "meleg", english: "warm", pronunciation: "mɛlɛg", hebrew: null },
      { hungarian: "hideg", english: "cold", pronunciation: "hidɛg", hebrew: null },
      { hungarian: "tele", english: "full", pronunciation: "tɛlɛ", hebrew: null },
      { hungarian: "nedves", english: "wet", pronunciation: "nɛdvɛʃ", hebrew: null },
      { hungarian: "száraz", english: "dry", pronunciation: "saːrɑz", hebrew: null },
      { hungarian: "helyes", english: "correct", pronunciation: "hɛjɛʃ", hebrew: null }
    ],
    yiddishWords: [
      { hungarian: "haver", english: "friend/buddy", pronunciation: "hɑvɛr", hebrew: "חבר", yiddishOrigin: true },
      { hungarian: "mázli", english: "luck", pronunciation: "maːzli", hebrew: "מזל", yiddishOrigin: true },
      { hungarian: "meló", english: "work (informal)", pronunciation: "mɛloː", hebrew: "מלאכה", yiddishOrigin: true },
      { hungarian: "srác", english: "guy/youngster", pronunciation: "ʃraːt͡s", hebrew: null, yiddishOrigin: true },
      { hungarian: "balhé", english: "trouble/mess", pronunciation: "bɑlheː", hebrew: null, yiddishOrigin: true },
      { hungarian: "bóvli", english: "shoddy/cheap", pronunciation: "boːvli", hebrew: null, yiddishOrigin: true },
      { hungarian: "stikában", english: "secretly", pronunciation: "ʃtikɑːbɑn", hebrew: "בשתיקה", yiddishOrigin: true },
      { hungarian: "kóser", english: "fine/legitimate", pronunciation: "koːʃɛr", hebrew: "כשר", yiddishOrigin: true },
      { hungarian: "majré", english: "fear/anxiety", pronunciation: "mɑjreː", hebrew: "מורא", yiddishOrigin: true },
      { hungarian: "mesüge", english: "crazy", pronunciation: "mɛʃygɛ", hebrew: "משוגע", yiddishOrigin: true }
    ]
  };

  const [currentCategory, setCurrentCategory] = useState('pronouns');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [mode, setMode] = useState('learn'); // 'learn', 'quiz', 'practice'
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [progress, setProgress] = useState({});
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  // Initialize progress tracking
  useEffect(() => {
    const initialProgress = {};
    Object.keys(vocabulary).forEach(category => {
      initialProgress[category] = vocabulary[category].map(() => ({
        seen: false,
        correct: 0,
        attempts: 0
      }));
    });
    setProgress(initialProgress);
  }, []);

  const categories = Object.keys(vocabulary);
  const currentWords = vocabulary[currentCategory];
  const currentWord = currentWords[currentIndex];

  const playPronunciation = () => {
    // In a real app, this would use the Web Speech API
    const utterance = new SpeechSynthesisUtterance(currentWord.hungarian);
    utterance.lang = 'hu-HU';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const generateQuizOptions = (correctWord) => {
    const options = [correctWord];
    const allWords = Object.values(vocabulary).flat();
    
    while (options.length < 4) {
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
      if (!options.some(w => w.hungarian === randomWord.hungarian)) {
        options.push(randomWord);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setUserInput('');
    setFeedback('');
    setSelectedOption(null);
    setIsCorrect(null);
    
    if (currentIndex < currentWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (categories.indexOf(currentCategory) < categories.length - 1) {
      setCurrentCategory(categories[categories.indexOf(currentCategory) + 1]);
      setCurrentIndex(0);
    } else {
      setCurrentCategory(categories[0]);
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setUserInput('');
    setFeedback('');
    setSelectedOption(null);
    setIsCorrect(null);
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (categories.indexOf(currentCategory) > 0) {
      const prevCategory = categories[categories.indexOf(currentCategory) - 1];
      setCurrentCategory(prevCategory);
      setCurrentIndex(vocabulary[prevCategory].length - 1);
    }
  };

  const checkAnswer = () => {
    const isAnswerCorrect = userInput.toLowerCase().trim() === currentWord.hungarian.toLowerCase();
    setTotalAttempts(totalAttempts + 1);
    
    if (isAnswerCorrect) {
      setScore(score + 1);
      setFeedback('Excellent! 🎉');
      updateProgress(true);
    } else {
      setFeedback(`Not quite. The correct answer is: ${currentWord.hungarian}`);
      updateProgress(false);
    }
    setShowAnswer(true);
  };

  const handleQuizAnswer = (option) => {
    setSelectedOption(option);
    const correct = option.hungarian === currentWord.hungarian;
    setIsCorrect(correct);
    setTotalAttempts(totalAttempts + 1);
    
    if (correct) {
      setScore(score + 1);
      updateProgress(true);
    } else {
      updateProgress(false);
    }
  };

  const updateProgress = (correct) => {
    const newProgress = { ...progress };
    const categoryProgress = [...newProgress[currentCategory]];
    categoryProgress[currentIndex] = {
      seen: true,
      correct: categoryProgress[currentIndex].correct + (correct ? 1 : 0),
      attempts: categoryProgress[currentIndex].attempts + 1
    };
    newProgress[currentCategory] = categoryProgress;
    setProgress(newProgress);
  };

  const getProgressStats = () => {
    let totalSeen = 0;
    let totalCorrect = 0;
    let totalWords = 0;
    
    Object.keys(progress).forEach(category => {
      progress[category].forEach(word => {
        totalWords++;
        if (word.seen) totalSeen++;
        if (word.correct > 0) totalCorrect++;
      });
    });
    
    return { totalSeen, totalCorrect, totalWords };
  };

  const stats = getProgressStats();
  const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;

  useEffect(() => {
    if (mode === 'quiz' && currentWord) {
      setQuizOptions(generateQuizOptions(currentWord));
    }
  }, [mode, currentIndex, currentCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Hungarian Language Learning</h1>
          
          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSeen}</div>
              <div className="text-sm text-gray-600">Words Seen</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCorrect}</div>
              <div className="text-sm text-gray-600">Mastered</div>
            </div>
          </div>
          
          {/* Mode Selection */}
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('learn')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'learn' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BookOpen className="inline-block w-4 h-4 mr-2" />
              Learn
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'practice' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Target className="inline-block w-4 h-4 mr-2" />
              Practice
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'quiz' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Award className="inline-block w-4 h-4 mr-2" />
              Quiz
            </button>
          </div>
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setCurrentCategory(category);
                  setCurrentIndex(0);
                  setShowAnswer(false);
                  setUserInput('');
                  setFeedback('');
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  currentCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Learning Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Word Counter */}
          <div className="text-center text-sm text-gray-500 mb-4">
            Word {currentIndex + 1} of {currentWords.length} in {currentCategory}
          </div>

          {/* Learn Mode */}
          {mode === 'learn' && (
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-4xl font-bold text-gray-800 mb-2">{currentWord.hungarian}</h2>
                {currentWord.yiddishOrigin && (
                  <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mb-2">
                    Yiddish Origin {currentWord.hebrew && `• ${currentWord.hebrew}`}
                  </span>
                )}
                <div className="text-gray-600 text-lg mb-2">
                  [{currentWord.pronunciation}]
                  <button 
                    onClick={playPronunciation}
                    className="ml-2 text-blue-600 hover:text-blue-700"
                  >
                    <Volume2 className="inline-block w-5 h-5" />
                  </button>
                </div>
                <p className="text-2xl text-gray-700">{currentWord.english}</p>
              </div>
            </div>
          )}

          {/* Practice Mode */}
          {mode === 'practice' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                How do you say "{currentWord.english}" in Hungarian?
              </h2>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !showAnswer && checkAnswer()}
                className="w-full max-w-xs mx-auto block px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center text-lg"
                placeholder="Type your answer..."
                disabled={showAnswer}
              />
              {!showAnswer && (
                <button
                  onClick={checkAnswer}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!userInput.trim()}
                >
                  Check Answer
                </button>
              )}
              {feedback && (
                <div className={`mt-4 text-lg font-medium ${
                  feedback.includes('Excellent') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {feedback}
                </div>
              )}
            </div>
          )}

          {/* Quiz Mode */}
          {mode === 'quiz' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                What is the Hungarian word for "{currentWord.english}"?
              </h2>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {quizOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !selectedOption && handleQuizAnswer(option)}
                    disabled={selectedOption !== null}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedOption === option
                        ? isCorrect
                          ? 'bg-green-100 border-green-500'
                          : 'bg-red-100 border-red-500'
                        : selectedOption && option.hungarian === currentWord.hungarian
                        ? 'bg-green-100 border-green-500'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="font-medium text-lg">{option.hungarian}</div>
                    <div className="text-sm text-gray-600">[{option.pronunciation}]</div>
                  </button>
                ))}
              </div>
              {selectedOption && (
                <div className={`mt-4 text-lg font-medium ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrect ? 'Correct! 🎉' : `The correct answer is: ${currentWord.hungarian}`}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handlePrevious}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={currentIndex === 0 && categories.indexOf(currentCategory) === 0}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-yellow-50 rounded-lg shadow-lg p-6 mt-6">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-600" />
            Learning Tips
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Practice pronunciation by repeating each word 3-5 times</li>
            <li>• Notice patterns in Hungarian spelling and pronunciation</li>
            <li>• Words with Yiddish origins often relate to everyday life and emotions</li>
            <li>• Hungarian uses vowel harmony - front and back vowels don't mix in native words</li>
            <li>• The stress is always on the first syllable in Hungarian</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HungarianLearningApp;
