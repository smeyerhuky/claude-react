import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer 
} from 'recharts';
import { 
  Play, Pause, Download, Upload, Settings, Code, Layers, 
  Save, Trash2, Plus, ArrowRight, Zap, Copy, Check
} from 'lucide-react';

/**
 * Enhanced Text Buffer Processor with Pipeline Support
 * 
 * New Features:
 * - Processor Pipeline for chaining transformations
 * - Custom Processor Editor with live preview
 * - Export/Import functionality
 * - Processor Library with save/load
 * - Performance comparison mode
 */

// Buffer size calculations (unchanged from original)
const BUFFER_SIZES = {
  32: 2**5, 64: 2**6, 128: 2**7, 256: 2**8, 512: 2**9,
  1024: 2**10, 2048: 2**11, 4096: 2**12, 8192: 2**13,
  16384: 2**14, 32768: 2**15, 65536: 2**16
};

const calculateAutoBufferSize = (textLength) => {
  if (textLength < 100) return 32;
  if (textLength < 1000) return 64;
  if (textLength < 10000) return 256;
  if (textLength < 100000) return 1024;
  if (textLength < 1000000) return 8192;
  return 32768;
};

// Built-in processors library
const BUILTIN_PROCESSORS = {
  rot13: {
    name: 'ROT13',
    description: 'Rotate letters by 13 positions',
    code: `(char, context) => {
  if (char >= 'a' && char <= 'z') {
    return { 
      result: String.fromCharCode((char.charCodeAt(0) - 97 + 13) % 26 + 97)
    };
  } else if (char >= 'A' && char <= 'Z') {
    return { 
      result: String.fromCharCode((char.charCodeAt(0) - 65 + 13) % 26 + 65)
    };
  }
  return { result: char };
}`
  },
  uppercase: {
    name: 'Uppercase',
    description: 'Convert to uppercase',
    code: `(char, context) => ({ result: char.toUpperCase() })`
  },
  lowercase: {
    name: 'Lowercase',
    description: 'Convert to lowercase',
    code: `(char, context) => ({ result: char.toLowerCase() })`
  },
  reverse: {
    name: 'Reverse Case',
    description: 'Swap uppercase and lowercase',
    code: `(char, context) => {
  if (char >= 'a' && char <= 'z') return { result: char.toUpperCase() };
  if (char >= 'A' && char <= 'Z') return { result: char.toLowerCase() };
  return { result: char };
}`
  },
  obfuscate: {
    name: 'Obfuscate',
    description: 'Replace every 3rd character with asterisk',
    code: `(char, context) => {
  if (char === ' ') return { result: char };
  if (context.charIndex % 3 === 0) {
    return { result: '*', metadata: { obfuscated: true, originalChar: char } };
  }
  return { result: char };
}`
  },
  l33t: {
    name: 'L33t Speak',
    description: 'Convert to l33t speak',
    code: `(char, context) => {
  const l33tMap = { 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7' };
  const lower = char.toLowerCase();
  return { result: l33tMap[lower] || char };
}`
  },
  vowelHighlight: {
    name: 'Vowel Highlighter',
    description: 'Mark vowels with brackets',
    code: `(char, context) => {
  if ('aeiouAEIOU'.includes(char)) {
    return { result: \`[\${char}]\`, metadata: { isVowel: true } };
  }
  return { result: char };
}`
  }
};

// Enhanced hook with pipeline support
export const useEnhancedTextProcessor = (config = {}) => {
  const {
    bufferSize = 'AUTO',
    enableParallelProcessing = true,
    yieldInterval = 20
  } = config;

  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalChars: 0,
    processedChars: 0,
    processingTime: 0,
    bufferCount: 0,
    throughput: 0,
    actualBufferSize: 0,
    pipelineSteps: 0
  });

  // Create a pipeline processor from multiple processors
  const createPipeline = useCallback((processors) => {
    return (char, context) => {
      let result = char;
      let combinedMetadata = {};
      
      processors.forEach((processor, index) => {
        const output = processor(result, { ...context, pipelineStep: index });
        result = output.result !== undefined ? output.result : result;
        if (output.metadata) {
          combinedMetadata[`step_${index}`] = output.metadata;
        }
      });
      
      return { result, metadata: combinedMetadata };
    };
  }, []);

  // Process buffer (unchanged from original)
  const processBuffer = useCallback((buffer, bufferIndex, processor, parallel = true) => {
    const results = new Array(buffer.length);
    const metadata = {
      bufferIndex,
      originalLength: buffer.length,
      processingMode: parallel ? 'parallel' : 'sequential'
    };

    if (parallel) {
      buffer.forEach((char, idx) => {
        const processorResult = processor(char, {
          charIndex: idx,
          bufferIndex,
          globalIndex: bufferIndex * buffer.length + idx,
          isParallel: true
        });
        
        results[idx] = processorResult.result !== undefined ? processorResult.result : char;
        
        if (processorResult.metadata) {
          metadata[`char_${idx}`] = processorResult.metadata;
        }
      });
    } else {
      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];
        const processorResult = processor(char, {
          charIndex: i,
          bufferIndex,
          globalIndex: bufferIndex * buffer.length + i,
          isParallel: false,
          previousResult: i > 0 ? results[i - 1] : null
        });
        
        results[i] = processorResult.result !== undefined ? processorResult.result : char;
        
        if (processorResult.metadata) {
          metadata[`char_${i}`] = processorResult.metadata;
        }
      }
    }

    return { results, metadata };
  }, []);

  // Enhanced processText with pipeline support
  const processText = useCallback(async (inputText, processorOrPipeline, onProgress = null) => {
    if (!inputText) {
      throw new Error('Input text required');
    }

    // Handle both single processor and pipeline
    const processor = Array.isArray(processorOrPipeline) 
      ? createPipeline(processorOrPipeline)
      : processorOrPipeline;

    if (typeof processor !== 'function') {
      throw new Error('Valid processor function required');
    }

    setIsProcessing(true);
    const startTime = performance.now();

    const actualBufferSize = bufferSize === 'AUTO' 
      ? calculateAutoBufferSize(inputText.length)
      : (BUFFER_SIZES[bufferSize] || bufferSize);

    const totalBuffers = Math.ceil(inputText.length / actualBufferSize);
    let finalOutput = '';
    const allMetadata = [];
    
    for (let i = 0; i < totalBuffers; i++) {
      const start = i * actualBufferSize;
      const end = Math.min(start + actualBufferSize, inputText.length);
      const buffer = inputText.slice(start, end).split('');
      
      if (i > 0 && i % yieldInterval === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: totalBuffers,
          percent: ((i + 1) / totalBuffers) * 100
        });
      }
      
      const { results, metadata } = processBuffer(
        buffer, 
        i, 
        processor, 
        enableParallelProcessing
      );
      
      finalOutput += results.join('');
      allMetadata.push(metadata);
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    const throughput = inputText.length / (processingTime / 1000);
    
    const finalStats = {
      totalChars: inputText.length,
      processedChars: finalOutput.length,
      processingTime,
      bufferCount: totalBuffers,
      throughput,
      actualBufferSize,
      pipelineSteps: Array.isArray(processorOrPipeline) ? processorOrPipeline.length : 1
    };
    
    setStats(finalStats);
    setIsProcessing(false);
    
    return {
      output: finalOutput,
      metadata: allMetadata,
      stats: finalStats
    };
  }, [bufferSize, enableParallelProcessing, yieldInterval, processBuffer, createPipeline]);

  return {
    processText,
    createPipeline,
    isProcessing,
    stats,
    BUFFER_SIZES,
    calculateAutoBufferSize
  };
};

// Main Enhanced Demo Component
const EnhancedTextBufferProcessor = () => {
  const [inputText, setInputText] = useState('Hello World! This is an enhanced text buffer processor with pipeline support.');
  const [outputText, setOutputText] = useState('');
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('process');
  const [copied, setCopied] = useState(false);
  
  // Pipeline state
  const [pipeline, setPipeline] = useState([]);
  const [savedProcessors, setSavedProcessors] = useState({});
  
  // Custom processor editor state
  const [customCode, setCustomCode] = useState(BUILTIN_PROCESSORS.rot13.code);
  const [customName, setCustomName] = useState('Custom Processor');
  const [codeError, setCodeError] = useState('');
  const [testOutput, setTestOutput] = useState('');
  
  // Configuration state
  const [bufferConfig, setBufferConfig] = useState({
    bufferSize: 'AUTO',
    enableParallelProcessing: true,
    yieldInterval: 20
  });
  
  // Performance comparison state
  const [comparisonData, setComparisonData] = useState([]);
  
  const processor = useEnhancedTextProcessor(bufferConfig);

  // Compile custom processor code
  const compileProcessor = useCallback((code) => {
    try {
      // Use Function constructor for safer evaluation than eval
      const fn = new Function('return ' + code)();
      if (typeof fn !== 'function') {
        throw new Error('Code must return a function');
      }
      setCodeError('');
      return fn;
    } catch (error) {
      setCodeError(error.message);
      return null;
    }
  }, []);

  // Test custom processor
  const testCustomProcessor = useCallback(() => {
    const fn = compileProcessor(customCode);
    if (fn) {
      try {
        const testText = 'Hello World 123!';
        const result = testText.split('').map((char, idx) => {
          const output = fn(char, { charIndex: idx, bufferIndex: 0, globalIndex: idx });
          return output.result || char;
        }).join('');
        setTestOutput(result);
      } catch (error) {
        setTestOutput(`Error: ${error.message}`);
      }
    }
  }, [customCode, compileProcessor]);

  // Add processor to pipeline
  const addToPipeline = useCallback((processorKey, isCustom = false) => {
    let processor;
    let name;
    
    if (isCustom) {
      processor = compileProcessor(customCode);
      name = customName;
      if (!processor) return;
    } else {
      processor = compileProcessor(BUILTIN_PROCESSORS[processorKey].code);
      name = BUILTIN_PROCESSORS[processorKey].name;
    }
    
    setPipeline(prev => [...prev, { key: Date.now(), name, processor }]);
  }, [customCode, customName, compileProcessor]);

  // Remove from pipeline
  const removeFromPipeline = useCallback((index) => {
    setPipeline(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear pipeline
  const clearPipeline = useCallback(() => {
    setPipeline([]);
  }, []);

  // Process with pipeline
  const processPipeline = useCallback(async () => {
    if (!inputText.trim() || pipeline.length === 0) return;
    
    try {
      const processors = pipeline.map(p => p.processor);
      const result = await processor.processText(
        inputText,
        processors,
        (prog) => setProgress(prog.percent)
      );
      
      setOutputText(result.output);
      
      // Update comparison data
      setComparisonData(prev => [...prev, {
        name: `Pipeline (${pipeline.length} steps)`,
        time: result.stats.processingTime,
        throughput: result.stats.throughput,
        steps: pipeline.length
      }].slice(-5));
    } catch (error) {
      console.error('Processing failed:', error);
    }
  }, [inputText, pipeline, processor]);

  // Process with single processor
  const processSingle = useCallback(async (processorKey) => {
    if (!inputText.trim()) return;
    
    try {
      const processorFn = compileProcessor(BUILTIN_PROCESSORS[processorKey].code);
      const result = await processor.processText(
        inputText,
        processorFn,
        (prog) => setProgress(prog.percent)
      );
      
      setOutputText(result.output);
      
      // Update comparison data
      setComparisonData(prev => [...prev, {
        name: BUILTIN_PROCESSORS[processorKey].name,
        time: result.stats.processingTime,
        throughput: result.stats.throughput,
        steps: 1
      }].slice(-5));
    } catch (error) {
      console.error('Processing failed:', error);
    }
  }, [inputText, processor, compileProcessor]);

  // Export functionality
  const exportData = useCallback(() => {
    const exportObj = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      input: inputText,
      output: outputText,
      pipeline: pipeline.map(p => p.name),
      stats: processor.stats,
      config: bufferConfig
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-processor-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [inputText, outputText, pipeline, processor.stats, bufferConfig]);

  // Import functionality
  const importData = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setInputText(data.input || '');
        setOutputText(data.output || '');
        // Could restore pipeline here if we saved processor code
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(outputText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [outputText]);

  // Save custom processor
  const saveCustomProcessor = useCallback(() => {
    const fn = compileProcessor(customCode);
    if (fn) {
      setSavedProcessors(prev => ({
        ...prev,
        [customName]: { code: customCode, processor: fn }
      }));
    }
  }, [customCode, customName, compileProcessor]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-xl shadow-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Enhanced Text Buffer Processor
        </h1>
        <p className="text-gray-600">
          Pipeline support • Custom processors • Performance analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('process')}
          className={`px-4 py-2 font-medium transition-all border-b-2 ${
            activeTab === 'process'
              ? 'text-blue-600 border-blue-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Layers className="inline w-4 h-4 mr-2" />
          Pipeline Builder
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 font-medium transition-all border-b-2 ${
            activeTab === 'editor'
              ? 'text-purple-600 border-purple-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Code className="inline w-4 h-4 mr-2" />
          Processor Editor
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition-all border-b-2 ${
            activeTab === 'analytics'
              ? 'text-green-600 border-green-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Zap className="inline w-4 h-4 mr-2" />
          Performance
        </button>
      </div>

      {/* Pipeline Builder Tab */}
      {activeTab === 'process' && (
        <div className="space-y-6">
          {/* Input/Output Areas */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Input Text</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to process..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Output</label>
                <button
                  onClick={copyToClipboard}
                  className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                value={outputText}
                readOnly
                placeholder="Processed text will appear here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
            </div>
          </div>

          {/* Pipeline Builder */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Processing Pipeline</h3>
              <button
                onClick={clearPipeline}
                className="text-sm px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded"
              >
                <Trash2 className="inline w-3 h-3 mr-1" />
                Clear
              </button>
            </div>

            {/* Pipeline Visualization */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg overflow-x-auto">
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                Input
              </div>
              {pipeline.map((step, index) => (
                <React.Fragment key={step.key}>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="relative group">
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                      {step.name}
                    </div>
                    <button
                      onClick={() => removeFromPipeline(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                </React.Fragment>
              ))}
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                Output
              </div>
            </div>

            {/* Processor Library */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {Object.entries(BUILTIN_PROCESSORS).map(([key, proc]) => (
                <button
                  key={key}
                  onClick={() => addToPipeline(key)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm text-left transition-colors"
                >
                  <div className="font-medium">{proc.name}</div>
                  <div className="text-xs text-gray-500">{proc.description}</div>
                </button>
              ))}
            </div>

            {/* Process Button */}
            <div className="flex gap-3">
              <button
                onClick={processPipeline}
                disabled={processor.isProcessing || pipeline.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 transition-all font-medium"
              >
                {processor.isProcessing ? (
                  <>Processing... {progress.toFixed(0)}%</>
                ) : (
                  <>
                    <Play className="inline w-4 h-4 mr-2" />
                    Run Pipeline ({pipeline.length} steps)
                  </>
                )}
              </button>
              
              <button
                onClick={exportData}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Download className="inline w-4 h-4 mr-2" />
                Export
              </button>
              
              <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                <Upload className="inline w-4 h-4 mr-2" />
                Import
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>

            {/* Progress Bar */}
            {processor.isProcessing && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Process</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(BUILTIN_PROCESSORS).slice(0, 4).map(([key, proc]) => (
                <button
                  key={key}
                  onClick={() => processSingle(key)}
                  disabled={processor.isProcessing}
                  className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-700 transition-colors"
                >
                  {proc.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processor Editor Tab */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="mb-4">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Processor Name"
                className="text-xl font-semibold bg-transparent border-b-2 border-gray-300 focus:border-purple-500 outline-none pb-1 w-full"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Processor Code</label>
                <textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full h-80 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  spellCheck={false}
                />
                {codeError && (
                  <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
                    {codeError}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={testCustomProcessor}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Test Processor
                  </button>
                  <button
                    onClick={() => addToPipeline(null, true)}
                    disabled={!!codeError}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    <Plus className="inline w-4 h-4 mr-1" />
                    Add to Pipeline
                  </button>
                  <button
                    onClick={saveCustomProcessor}
                    disabled={!!codeError}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                  >
                    <Save className="inline w-4 h-4 mr-1" />
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Documentation</label>
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3">
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">Function Signature:</div>
                    <code className="text-xs bg-white px-2 py-1 rounded">
                      (char: string, context: Object) => {`{ result: string, metadata?: any }`}
                    </code>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">Context Object:</div>
                    <ul className="text-xs space-y-1 ml-3">
                      <li>• charIndex: number - Position in buffer</li>
                      <li>• bufferIndex: number - Current buffer number</li>
                      <li>• globalIndex: number - Position in entire text</li>
                      <li>• isParallel: boolean - Processing mode</li>
                      <li>• pipelineStep: number - Position in pipeline</li>
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-700 mb-1">Test Output:</div>
                    <div className="bg-white p-2 rounded font-mono text-xs">
                      Input: "Hello World 123!"<br />
                      Output: {testOutput || '(Click "Test Processor" to see result)'}
                    </div>
                  </div>

                  {Object.keys(savedProcessors).length > 0 && (
                    <div>
                      <div className="font-semibold text-gray-700 mb-1">Saved Processors:</div>
                      <div className="space-y-1">
                        {Object.keys(savedProcessors).map(name => (
                          <div key={name} className="text-xs bg-white px-2 py-1 rounded">
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Current Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Current Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-700">
                    {processor.stats.throughput.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600">Chars/Second</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-2xl font-bold text-green-700">
                    {processor.stats.processingTime.toFixed(1)}ms
                  </div>
                  <div className="text-xs text-green-600">Processing Time</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-2xl font-bold text-purple-700">
                    {processor.stats.bufferCount}
                  </div>
                  <div className="text-xs text-purple-600">Buffers Used</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-2xl font-bold text-orange-700">
                    {processor.stats.pipelineSteps}
                  </div>
                  <div className="text-xs text-orange-600">Pipeline Steps</div>
                </div>
              </div>

              {/* Buffer Configuration */}
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-gray-700 mb-2">Buffer Configuration</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Size:</span>
                    <span className="font-medium">{bufferConfig.bufferSize === 'AUTO' ? 'AUTO' : `${bufferConfig.bufferSize} chars`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mode:</span>
                    <span className="font-medium">{bufferConfig.enableParallelProcessing ? 'Parallel' : 'Sequential'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Actual Buffer:</span>
                    <span className="font-medium">{processor.stats.actualBufferSize} chars</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Performance Comparison</h3>
              {comparisonData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="time" fill="#8884d8" name="Time (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 space-y-2">
                    {comparisonData.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name}:</span>
                        <span className="font-medium">
                          {item.time.toFixed(2)}ms / {Math.round(item.throughput).toLocaleString()} chars/s
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Run some processors to see performance comparison
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              <Settings className="inline w-5 h-5 mr-2" />
              Advanced Settings
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Buffer Size
                </label>
                <select
                  value={bufferConfig.bufferSize}
                  onChange={(e) => setBufferConfig(prev => ({ 
                    ...prev, 
                    bufferSize: e.target.value === 'AUTO' ? 'AUTO' : Number(e.target.value) 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="AUTO">AUTO (Smart Sizing)</option>
                  {Object.entries(BUFFER_SIZES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key} chars (2^{Math.log2(value)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Yield Interval: {bufferConfig.yieldInterval} buffers
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={bufferConfig.yieldInterval}
                  onChange={(e) => setBufferConfig(prev => ({ 
                    ...prev, 
                    yieldInterval: Number(e.target.value) 
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Controls UI responsiveness during processing
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Processing Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bufferConfig.enableParallelProcessing}
                      onChange={(e) => setBufferConfig(prev => ({ 
                        ...prev, 
                        enableParallelProcessing: e.target.checked 
                      }))}
                      className="w-4 h-4"
                    />
                    Enable Parallel Processing
                  </label>
                  <div className="text-xs text-gray-500">
                    Parallel mode is faster but doesn't preserve sequential dependencies
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTextBufferProcessor;