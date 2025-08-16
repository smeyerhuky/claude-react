import React, { useState, useMemo } from 'react';
import { AlertCircle, BarChart, TrendingUp, Hash, Type, Layers } from 'lucide-react';

const AIWritingAnalyzer = () => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Core computational linguistics functions
  const computeNGrams = (text, n) => {
    // Extract n-grams from text for pattern detection
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
    const ngrams = {};
    
    for (let i = 0; i <= words.length - n; i++) {
      const gram = words.slice(i, i + n).join(' ');
      ngrams[gram] = (ngrams[gram] || 0) + 1;
    }
    
    return ngrams;
  };

  const calculateLexicalDiversity = (text) => {
    // Type-token ratio: unique words / total words
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
    const uniqueWords = new Set(words);
    
    if (words.length === 0) return 0;
    
    // Yule's K - a more sophisticated diversity measure
    const frequencyMap = {};
    words.forEach(word => {
      frequencyMap[word] = (frequencyMap[word] || 0) + 1;
    });
    
    const frequencies = Object.values(frequencyMap);
    const m1 = words.length;
    const m2 = frequencies.reduce((sum, freq) => sum + freq * freq, 0);
    
    // Yule's K formula: 10^4 * (M2 - M1) / (M1^2)
    const yulesK = m1 > 0 ? 10000 * (m2 - m1) / (m1 * m1) : 0;
    
    return {
      ttr: uniqueWords.size / words.length,
      yulesK: yulesK,
      vocabularySize: uniqueWords.size,
      totalWords: words.length
    };
  };

  const detectTransitionPatterns = (text) => {
    // Common AI transition phrases with weights
    const transitions = {
      'moreover': 3, 'furthermore': 3, 'additionally': 3,
      'however': 2, 'therefore': 2, 'consequently': 3,
      'more importantly': 4, 'building on': 4, 'it\'s worth noting': 4,
      'in conclusion': 3, 'to summarize': 3, 'in summary': 3,
      'first': 2, 'second': 2, 'third': 2, 'finally': 2,
      'on the other hand': 3, 'for instance': 2, 'for example': 2,
      'as a result': 3, 'in addition': 3, 'specifically': 3,
      'essentially': 3, 'fundamentally': 3, 'notably': 3,
      'significantly': 3, 'importantly': 3, 'critically': 3
    };
    
    const sentences = text.split(/[.!?]+/);
    let transitionCount = 0;
    let weightedScore = 0;
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      Object.entries(transitions).forEach(([phrase, weight]) => {
        if (lower.includes(phrase)) {
          transitionCount++;
          weightedScore += weight;
        }
      });
    });
    
    return {
      count: transitionCount,
      density: sentences.length > 0 ? transitionCount / sentences.length : 0,
      weightedScore: weightedScore
    };
  };

  const analyzeSentenceComplexity = (text) => {
    // Flesch reading ease and sentence structure analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b[\w']+\b/g) || [];
    const syllables = words.reduce((count, word) => {
      // Simple syllable counting heuristic
      return count + word.toLowerCase().replace(/[^aeiou]/g, '').length || 1;
    }, 0);
    
    if (sentences.length === 0 || words.length === 0) return null;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula
    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    
    // Analyze sentence length variation (low variation = AI-like)
    const sentenceLengths = sentences.map(s => (s.match(/\b[\w']+\b/g) || []).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgLength > 0 ? stdDev / avgLength : 0;
    
    return {
      avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
      fleschScore: fleschScore.toFixed(1),
      sentenceVariation: coefficientOfVariation.toFixed(3),
      totalSentences: sentences.length
    };
  };

  const detectAIPhrases = (text) => {
    // Common AI-favored phrases and their frequencies
    const aiPhrases = [
      'delve into', 'tapestry', 'testament to', 'in summary', 'in conclusion',
      'it\'s important to note', 'it\'s worth noting', 'let\'s explore',
      'dive into', 'powerful tool', 'game-changer', 'transform',
      'leverage', 'utilize', 'implement', 'enhance', 'optimize',
      'force multiplier', 'paradigm', 'synergy', 'ecosystem',
      'holistic', 'robust', 'scalable', 'innovative', 'cutting-edge',
      'best practices', 'deep dive', 'key insights', 'strategic',
      'comprehensive', 'furthermore', 'moreover', 'additionally',
      'significant impact', 'dramatic improvement', 'substantial'
    ];
    
    const lower = text.toLowerCase();
    const foundPhrases = [];
    let totalOccurrences = 0;
    
    aiPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        foundPhrases.push({ phrase, count: matches.length });
        totalOccurrences += matches.length;
      }
    });
    
    const wordCount = (text.match(/\b[\w']+\b/g) || []).length;
    
    return {
      phrases: foundPhrases.sort((a, b) => b.count - a.count).slice(0, 10),
      totalOccurrences,
      density: wordCount > 0 ? (totalOccurrences / wordCount) * 100 : 0
    };
  };

  const detectHedgingLanguage = (text) => {
    // Hedging words that AI often overuses
    const hedgeWords = [
      'might', 'could', 'perhaps', 'possibly', 'potentially',
      'generally', 'typically', 'usually', 'often', 'sometimes',
      'appears', 'seems', 'suggests', 'indicates', 'tends',
      'relatively', 'somewhat', 'fairly', 'quite', 'rather'
    ];
    
    const lower = text.toLowerCase();
    let hedgeCount = 0;
    
    hedgeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) hedgeCount += matches.length;
    });
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      count: hedgeCount,
      perSentence: sentences.length > 0 ? (hedgeCount / sentences.length).toFixed(2) : 0
    };
  };

  const calculateRepetitionScore = (text) => {
    // Analyze repetitive patterns using bigrams and trigrams
    const bigrams = computeNGrams(text, 2);
    const trigrams = computeNGrams(text, 3);
    
    // Count repeated phrases (appearing more than once)
    const repeatedBigrams = Object.entries(bigrams).filter(([_, count]) => count > 1);
    const repeatedTrigrams = Object.entries(trigrams).filter(([_, count]) => count > 1);
    
    // Calculate repetition intensity
    const totalBigrams = Object.values(bigrams).reduce((a, b) => a + b, 0);
    const totalTrigrams = Object.values(trigrams).reduce((a, b) => a + b, 0);
    
    const bigramRepetitionRate = repeatedBigrams.length / Math.max(Object.keys(bigrams).length, 1);
    const trigramRepetitionRate = repeatedTrigrams.length / Math.max(Object.keys(trigrams).length, 1);
    
    return {
      bigramRepetition: (bigramRepetitionRate * 100).toFixed(1),
      trigramRepetition: (trigramRepetitionRate * 100).toFixed(1),
      topRepeatedPhrases: [...repeatedBigrams, ...repeatedTrigrams]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([phrase, count]) => ({ phrase, count }))
    };
  };

  // Main analysis computation
  const analysis = useMemo(() => {
    if (!inputText.trim()) return null;
    
    const lexicalDiversity = calculateLexicalDiversity(inputText);
    const transitions = detectTransitionPatterns(inputText);
    const sentenceComplexity = analyzeSentenceComplexity(inputText);
    const aiPhrases = detectAIPhrases(inputText);
    const hedging = detectHedgingLanguage(inputText);
    const repetition = calculateRepetitionScore(inputText);
    
    // Calculate composite AI score (0-100)
    let aiScore = 0;
    
    // Lexical diversity component (lower diversity = more AI-like)
    if (lexicalDiversity.ttr < 0.4) aiScore += 15;
    else if (lexicalDiversity.ttr < 0.5) aiScore += 10;
    else if (lexicalDiversity.ttr < 0.6) aiScore += 5;
    
    // Transition density (higher = more AI-like)
    if (transitions.density > 0.3) aiScore += 20;
    else if (transitions.density > 0.2) aiScore += 15;
    else if (transitions.density > 0.1) aiScore += 10;
    
    // AI phrase density
    if (aiPhrases.density > 2) aiScore += 20;
    else if (aiPhrases.density > 1) aiScore += 15;
    else if (aiPhrases.density > 0.5) aiScore += 10;
    
    // Sentence uniformity (low variation = more AI-like)
    if (sentenceComplexity && parseFloat(sentenceComplexity.sentenceVariation) < 0.3) aiScore += 15;
    else if (sentenceComplexity && parseFloat(sentenceComplexity.sentenceVariation) < 0.5) aiScore += 10;
    
    // Hedging language
    if (hedging.perSentence > 0.5) aiScore += 10;
    else if (hedging.perSentence > 0.3) aiScore += 5;
    
    // Repetition patterns
    if (parseFloat(repetition.bigramRepetition) > 20) aiScore += 10;
    else if (parseFloat(repetition.bigramRepetition) > 15) aiScore += 5;
    
    // Add weighted transition score
    aiScore += Math.min(transitions.weightedScore / 10, 10);
    
    // Cap at 100
    aiScore = Math.min(aiScore, 100);
    
    return {
      aiScore,
      lexicalDiversity,
      transitions,
      sentenceComplexity,
      aiPhrases,
      hedging,
      repetition
    };
  }, [inputText]);

  const getScoreColor = (score) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score < 30) return 'Likely Human';
    if (score < 60) return 'Mixed Signals';
    return 'Likely AI';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">AI Writing Pattern Analyzer</h1>
        <p className="text-gray-600 mb-6">
          This tool uses computational linguistics techniques from early NLP research to detect patterns commonly found in AI-generated text.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste or type text to analyze:
            </label>
            <textarea
              className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter text here to analyze for AI writing patterns..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            {inputText && `${(inputText.match(/\b[\w']+\b/g) || []).length} words`}
          </div>
        </div>
      </div>

      {analysis && (
        <>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Overall AI Score</h2>
              <div className={`text-4xl font-bold ${getScoreColor(analysis.aiScore)}`}> 
                {analysis.aiScore}%
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-lg font-semibold ${getScoreColor(analysis.aiScore)}`}> 
                {getScoreLabel(analysis.aiScore)}
              </span>
              <div className="w-64 bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${
                    analysis.aiScore < 30 ? 'bg-green-500' :
                    analysis.aiScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.aiScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['overview', 'lexical', 'patterns', 'structure'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-6 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center mb-2">
                        <Type className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">Lexical Diversity</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {(analysis.lexicalDiversity.ttr * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Type-Token Ratio</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">Transitions</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {(analysis.transitions.density * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Per Sentence</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">AI Phrases</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {analysis.aiPhrases.totalOccurrences}
                      </div>
                      <div className="text-xs text-gray-500">Detected</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center mb-2">
                        <BarChart className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">Hedging</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {analysis.hedging.perSentence}
                      </div>
                      <div className="text-xs text-gray-500">Per Sentence</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center mb-2">
                        <Layers className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">Sentence Var.</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {analysis.sentenceComplexity?.sentenceVariation || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Coefficient</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center mb-2">
                        <Hash className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">Repetition</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {analysis.repetition.bigramRepetition}%
                      </div>
                      <div className="text-xs text-gray-500">Bigram Rate</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Key Indicators</h3>
                    <ul className="space-y-2 text-sm">
                      {analysis.lexicalDiversity.ttr < 0.5 && (
                        <li className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          Low lexical diversity suggests repetitive vocabulary
                        </li>
                      )}
                      {analysis.transitions.density > 0.2 && (
                        <li className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          High transition word density typical of AI writing
                        </li>
                      )}
                      {analysis.aiPhrases.density > 1 && (
                        <li className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          Frequent use of AI-favored phrases detected
                        </li>
                      )}
                      {analysis.sentenceComplexity && parseFloat(analysis.sentenceComplexity.sentenceVariation) < 0.4 && (
                        <li className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          Uniform sentence structure suggests automated generation
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'lexical' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Vocabulary Analysis</h3>
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                      <div className="flex justify-between">
                        <span>Unique Words:</span>
                        <span className="font-mono">{analysis.lexicalDiversity.vocabularySize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Words:</span>
                        <span className="font-mono">{analysis.lexicalDiversity.totalWords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type-Token Ratio:</span>
                        <span className="font-mono">{(analysis.lexicalDiversity.ttr * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Yule's K (Diversity):</span>
                        <span className="font-mono">{analysis.lexicalDiversity.yulesK.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Most Repeated Phrases</h3>
                    {analysis.repetition.topRepeatedPhrases.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.repetition.topRepeatedPhrases.map((item, idx) => (
                          <div key={idx} className="flex justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{item.phrase}</span>
                            <span className="text-sm font-mono">{item.count}x</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No significant repetition detected</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'patterns' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">AI-Favored Phrases Found</h3>
                    {analysis.aiPhrases.phrases.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {analysis.aiPhrases.phrases.map((item, idx) => (
                          <div key={idx} className="flex justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{item.phrase}</span>
                            <span className="text-sm font-mono">{item.count}x</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No AI-typical phrases detected</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Transition Analysis</h3>
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                      <div className="flex justify-between">
                        <span>Transition Count:</span>
                        <span className="font-mono">{analysis.transitions.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weighted Score:</span>
                        <span className="font-mono">{analysis.transitions.weightedScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Density:</span>
                        <span className="font-mono">{(analysis.transitions.density * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Hedging Language</h3>
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                      <div className="flex justify-between">
                        <span>Total Hedges:</span>
                        <span className="font-mono">{analysis.hedging.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Per Sentence:</span>
                        <span className="font-mono">{analysis.hedging.perSentence}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'structure' && analysis.sentenceComplexity && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Sentence Structure Analysis</h3>
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                      <div className="flex justify-between">
                        <span>Total Sentences:</span>
                        <span className="font-mono">{analysis.sentenceComplexity.totalSentences}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Words/Sentence:</span>
                        <span className="font-mono">{analysis.sentenceComplexity.avgWordsPerSentence}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sentence Variation:</span>
                        <span className="font-mono">{analysis.sentenceComplexity.sentenceVariation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Flesch Reading Ease:</span>
                        <span className="font-mono">{analysis.sentenceComplexity.fleschScore}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Repetition Patterns</h3>
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                      <div className="flex justify-between">
                        <span>Bigram Repetition:</span>
                        <span className="font-mono">{analysis.repetition.bigramRepetition}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trigram Repetition:</span>
                        <span className="font-mono">{analysis.repetition.trigramRepetition}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Interpretation Guide</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• <strong>Low sentence variation</strong> (&lt;0.3) indicates uniform structure</li>
                      <li>• <strong>Flesch scores 30-50</strong> suggest formal, complex writing</li>
                      <li>• <strong>High repetition rates</strong> (&gt;20%) indicate formulaic patterns</li>
                      <li>• <strong>Low lexical diversity</strong> (&lt;40%) suggests limited vocabulary</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIWritingAnalyzer;