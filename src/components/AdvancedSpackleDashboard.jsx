import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, Scatter } from 'recharts';
import { Settings, X, Zap, ArrowRight, Maximize2, Minimize2, Copy, Download } from 'lucide-react';

const AdvancedSpackleDashboard = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [showConfig, setShowConfig] = useState(false);
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  
  // Text content
  const [rawInput, setRawInput] = useState('');
  const [spackledOutput, setSpackledOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Performance & tracking
  const [swapLog, setSwapLog] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({
    totalChars: 0,
    swappedChars: 0,
    processingTime: 0,
    bufferSize: 16,
    batchCount: 0,
    throughput: 0
  });
  
  // Configurable parameters
  const [config, setConfig] = useState({
    passthroughRate: 90,
    originalKeyWeight: 50,
    jitterAmount: 2,
    bufferSize: 16,
    enableParallelProcessing: true
  });
  
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  // QWERTY neighbor mapping
  const qwertyNeighbors = {
    'q': ['w', 'a', 's'], 'w': ['q', 'e', 'a', 's', 'd'], 'e': ['w', 'r', 's', 'd', 'f'],
    'r': ['e', 't', 'd', 'f', 'g'], 't': ['r', 'y', 'f', 'g', 'h'], 'y': ['t', 'u', 'g', 'h', 'j'],
    'u': ['y', 'i', 'h', 'j', 'k'], 'i': ['u', 'o', 'j', 'k', 'l'], 'o': ['i', 'p', 'k', 'l'],
    'p': ['o', 'l'], 'a': ['q', 'w', 's', 'z'], 's': ['q', 'w', 'e', 'a', 'd', 'z', 'x'],
    'd': ['w', 'e', 'r', 's', 'f', 'x', 'c'], 'f': ['e', 'r', 't', 'd', 'g', 'c', 'v'],
    'g': ['r', 't', 'y', 'f', 'h', 'v', 'b'], 'h': ['t', 'y', 'u', 'g', 'j', 'b', 'n'],
    'j': ['y', 'u', 'i', 'h', 'k', 'n', 'm'], 'k': ['u', 'i', 'o', 'j', 'l', 'm'],
    'l': ['i', 'o', 'p', 'k'], 'z': ['a', 's', 'x'], 'x': ['z', 's', 'd', 'c'],
    'c': ['x', 'd', 'f', 'v'], 'v': ['c', 'f', 'g', 'b'], 'b': ['v', 'g', 'h', 'n'],
    'n': ['b', 'h', 'j', 'm'], 'm': ['n', 'j', 'k']
  };

  const selectWeightedRandom = useCallback((originalKey, neighbors) => {
    const random = Math.random();
    
    if (random < (config.originalKeyWeight / 100)) {
      return originalKey;
    }
    
    if (neighbors.length === 0) return originalKey;
    
    const baseWeight = 1 / neighbors.length;
    const jitterRange = (config.jitterAmount / 100);
    const weights = neighbors.map(() => {
      const jitter = (Math.random() - 0.5) * jitterRange;
      return Math.max(0.01, baseWeight + jitter);
    });
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    const selector = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < neighbors.length; i++) {
      cumulative += normalizedWeights[i];
      if (selector <= cumulative) {
        return neighbors[i];
      }
    }
    
    return neighbors[neighbors.length - 1];
  }, [config.originalKeyWeight, config.jitterAmount]);

  // High-performance buffered processing
  const processBuffer = useCallback((buffer, bufferIndex) => {
    const results = [];
    const newSwaps = [];
    
    if (config.enableParallelProcessing) {
      // Process buffer in parallel chunks using forEach
      buffer.forEach((char, idx) => {
        const lowerChar = char.toLowerCase();
        
        if (!/^[a-z]$/.test(lowerChar)) {
          results[idx] = char;
          return;
        }
        
        if (Math.random() < (config.passthroughRate / 100)) {
          results[idx] = char;
          return;
        }
        
        const neighbors = qwertyNeighbors[lowerChar] || [];
        const selectedKey = selectWeightedRandom(lowerChar, neighbors);
        
        if (selectedKey !== lowerChar) {
          const finalKey = char === char.toUpperCase() ? selectedKey.toUpperCase() : selectedKey;
          results[idx] = finalKey;
          
          newSwaps.push({
            id: Date.now() + Math.random() + idx + bufferIndex * 1000,
            original: lowerChar,
            replacement: selectedKey,
            timestamp: Date.now(),
            timeString: new Date().toLocaleTimeString(),
            source: 'buffer',
            bufferIndex,
            charIndex: idx
          });
        } else {
          results[idx] = char;
        }
      });
    } else {
      // Sequential processing fallback
      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];
        const lowerChar = char.toLowerCase();
        
        if (!/^[a-z]$/.test(lowerChar)) {
          results[i] = char;
          continue;
        }
        
        if (Math.random() < (config.passthroughRate / 100)) {
          results[i] = char;
          continue;
        }
        
        const neighbors = qwertyNeighbors[lowerChar] || [];
        const selectedKey = selectWeightedRandom(lowerChar, neighbors);
        
        if (selectedKey !== lowerChar) {
          const finalKey = char === char.toUpperCase() ? selectedKey.toUpperCase() : selectedKey;
          results[i] = finalKey;
          
          newSwaps.push({
            id: Date.now() + Math.random() + i + bufferIndex * 1000,
            original: lowerChar,
            replacement: selectedKey,
            timestamp: Date.now(),
            timeString: new Date().toLocaleTimeString(),
            source: 'buffer',
            bufferIndex,
            charIndex: i
          });
        } else {
          results[i] = char;
        }
      }
    }
    
    return { results, newSwaps };
  }, [config, selectWeightedRandom, qwertyNeighbors]);

  const spackleText = useCallback(async () => {
    if (!rawInput.trim()) return;
    
    setIsProcessing(true);
    const startTime = performance.now();
    
    const text = rawInput;
    const bufferSize = config.bufferSize;
    const totalBuffers = Math.ceil(text.length / bufferSize);
    
    let finalOutput = '';
    let totalSwaps = [];
    let swapCount = 0;
    
    // Process in optimized buffers
    for (let i = 0; i < totalBuffers; i++) {
      const start = i * bufferSize;
      const end = Math.min(start + bufferSize, text.length);
      const buffer = text.slice(start, end).split('');
      
      // Add small delay for UI responsiveness with large texts
      if (i > 0 && i % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const { results, newSwaps } = processBuffer(buffer, i);
      finalOutput += results.join('');
      totalSwaps = [...totalSwaps, ...newSwaps];
      swapCount += newSwaps.length;
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    const throughput = text.length / (processingTime / 1000); // chars per second
    
    // Update state
    setSpackledOutput(finalOutput);
    setSwapLog(prev => [...totalSwaps.reverse(), ...prev.slice(0, 300 - totalSwaps.length)]);
    setPerformanceStats({
      totalChars: text.length,
      swappedChars: swapCount,
      processingTime,
      bufferSize,
      batchCount: totalBuffers,
      throughput
    });
    
    setIsProcessing(false);
  }, [rawInput, config.bufferSize, processBuffer]);

  // Graph data processing with enhanced performance analytics
  const graphData = useMemo(() => {
    const letterFreq = {};
    const swapPatterns = {};
    const bufferPerf = [];
    const performanceComparison = [];
    
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letter => {
      letterFreq[letter] = 0;
    });
    
    // Process swaps and create buffer performance data
    const bufferGroups = {};
    swapLog.forEach((swap, idx) => {
      letterFreq[swap.original]++;
      
      const pattern = `${swap.original}→${swap.replacement}`;
      swapPatterns[pattern] = (swapPatterns[pattern] || 0) + 1;
      
      // Group by buffer for performance analysis
      if (swap.bufferIndex !== undefined) {
        if (!bufferGroups[swap.bufferIndex]) {
          bufferGroups[swap.bufferIndex] = [];
        }
        bufferGroups[swap.bufferIndex].push(swap);
      }
    });

    // Generate buffer performance data
    Object.entries(bufferGroups).forEach(([bufferIndex, swaps]) => {
      bufferPerf.push({
        buffer: parseInt(bufferIndex),
        swapCount: swaps.length,
        avgSwapsPerChar: swaps.length / config.bufferSize,
        bufferEfficiency: (swaps.length / config.bufferSize) * 100
      });
    });

    // Generate performance comparison data for different buffer sizes
    [8, 16, 32, 64, 128].forEach(size => {
      const estimated = performanceStats.totalChars > 0 ? 
        (performanceStats.processingTime * (config.bufferSize / size)) : 0;
      performanceComparison.push({
        bufferSize: size,
        estimatedTime: estimated,
        estimatedThroughput: estimated > 0 ? (performanceStats.totalChars / (estimated / 1000)) : 0,
        isCurrent: size === config.bufferSize
      });
    });

    const frequencyData = Object.entries(letterFreq)
      .map(([letter, count]) => ({ 
        letter, 
        count, 
        neighbors: qwertyNeighbors[letter]?.length || 0,
        swapRate: count > 0 ? ((count / performanceStats.totalChars) * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const patternData = Object.entries(swapPatterns)
      .map(([pattern, count]) => ({ 
        pattern, 
        count,
        percentage: ((count / swapLog.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return { 
      frequencyData, 
      patternData, 
      bufferPerf: bufferPerf.sort((a, b) => a.buffer - b.buffer),
      performanceComparison
    };
  }, [swapLog, performanceStats, config.bufferSize, qwertyNeighbors]);

  const clearAll = useCallback(() => {
    setRawInput('');
    setSpackledOutput('');
    setSwapLog([]);
    setPerformanceStats({
      totalChars: 0,
      swappedChars: 0,
      processingTime: 0,
      bufferSize: config.bufferSize,
      batchCount: 0,
      throughput: 0
    });
  }, [config.bufferSize]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }, []);

  const downloadResults = useCallback(() => {
    const data = {
      config,
      performanceStats,
      swapLog,
      rawInput,
      spackledOutput,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spackle-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, performanceStats, swapLog, rawInput, spackledOutput]);

  const swapRate = performanceStats.totalChars > 0 ? (performanceStats.swappedChars / performanceStats.totalChars * 100).toFixed(1) : '0.0';

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden relative">
      
      {/* Floating Configuration Panel */}
      {showConfig && (
        <div className="fixed top-20 right-6 bg-white rounded-lg shadow-2xl border z-50 w-80">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-800">Configuration</h3>
            <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Passthrough Rate: {config.passthroughRate}%</label>
              <input
                type="range"
                min="70"
                max="98"
                value={config.passthroughRate}
                onChange={(e) => setConfig(prev => ({ ...prev, passthroughRate: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-600 block mb-1">Keep Original: {config.originalKeyWeight}%</label>
              <input
                type="range"
                min="20"
                max="80"
                value={config.originalKeyWeight}
                onChange={(e) => setConfig(prev => ({ ...prev, originalKeyWeight: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-600 block mb-1">Jitter: ±{config.jitterAmount}%</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={config.jitterAmount}
                onChange={(e) => setConfig(prev => ({ ...prev, jitterAmount: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-600 block mb-1">Buffer Size: {config.bufferSize}</label>
              <select
                value={config.bufferSize}
                onChange={(e) => setConfig(prev => ({ ...prev, bufferSize: Number(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value={8}>8 chars</option>
                <option value={16}>16 chars</option>
                <option value={32}>32 chars</option>
                <option value={64}>64 chars</option>
                <option value={128}>128 chars</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={config.enableParallelProcessing}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableParallelProcessing: e.target.checked }))}
                  className="w-4 h-4"
                />
                Enable Parallel Processing
              </label>
            </div>
            
            <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
              <div>Expected Error Rate: {((100 - config.passthroughRate) * (100 - config.originalKeyWeight) / 100).toFixed(1)}%</div>
              <div>Processing Mode: {config.enableParallelProcessing ? 'Parallel' : 'Sequential'}</div>
              <div>Buffer Efficiency: {performanceStats.throughput > 0 ? `${Math.round(performanceStats.throughput)} chars/sec` : 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Advanced Spackle Performance Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-3 text-sm">
              <span className="bg-blue-100 px-2 py-1 rounded">Chars: {performanceStats.totalChars}</span>
              <span className="bg-red-100 px-2 py-1 rounded">Swaps: {performanceStats.swappedChars}</span>
              <span className="bg-green-100 px-2 py-1 rounded">Time: {performanceStats.processingTime.toFixed(1)}ms</span>
              <span className="bg-purple-100 px-2 py-1 rounded">Rate: {swapRate}%</span>
              <span className="bg-orange-100 px-2 py-1 rounded">Speed: {Math.round(performanceStats.throughput)} c/s</span>
            </div>
            
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={downloadResults}
              disabled={!spackledOutput}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={clearAll}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        
        {/* Left Panel - Input/Output */}
        <div className="w-96 bg-white shadow-sm flex flex-col">
          
          {/* Input Section */}
          <div className="p-4 border-b flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Raw Input</label>
              <button
                onClick={() => setInputModalOpen(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            
            <textarea
              ref={inputRef}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Type or paste text here for bulk spackling..."
              className="w-full h-32 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              onClick={() => rawInput.length > 200 && setInputModalOpen(true)}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">
                {rawInput.length} chars | {Math.ceil(rawInput.length / config.bufferSize)} buffers
              </div>
              
              <button
                onClick={spackleText}
                disabled={!rawInput.trim() || isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Spackle
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Output Section */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Spackled Output</label>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(spackledOutput)}
                  disabled={!spackledOutput}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOutputModalOpen(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <textarea
              ref={outputRef}
              value={spackledOutput}
              readOnly
              placeholder="Spackled text will appear here after processing..."
              className="w-full h-32 p-3 border border-gray-300 rounded bg-gray-50 font-mono text-sm resize-none"
              onClick={() => spackledOutput.length > 200 && setOutputModalOpen(true)}
            />
            
            <div className="text-xs text-gray-500 mt-2">
              {spackledOutput.length} chars | {performanceStats.batchCount} batches | {performanceStats.throughput > 0 ? `${Math.round(performanceStats.throughput)} chars/sec` : 'Ready'}
            </div>
          </div>
          
          {/* Recent Swaps */}
          <div className="p-4 border-t">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Recent Buffer Swaps</h3>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {swapLog.slice(0, 6).map((swap) => (
                <div key={swap.id} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                  <span>
                    <span className="font-mono text-red-600">{swap.original}</span>
                    <span className="mx-1">→</span>
                    <span className="font-mono text-green-600">{swap.replacement}</span>
                    <span className="ml-1 text-blue-500">#{swap.bufferIndex}</span>
                  </span>
                  <span className="text-gray-500">{swap.timeString}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Visualizations */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="bg-white border-b px-6 flex gap-6">
            {[
              { id: 'performance', label: 'Performance' },
              { id: 'frequency', label: 'Letter Analysis' },
              { id: 'patterns', label: 'Swap Patterns' },
              { id: 'buffers', label: 'Buffer Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chart Content */}
          <div className="flex-1 bg-white p-4 overflow-auto">
            {activeTab === 'performance' && (
              <div className="h-full min-h-0">
                <h3 className="text-lg font-semibold mb-3">Performance & Buffer Comparison</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-96">
                  <div className="min-h-0">
                    <h4 className="text-md font-medium mb-2">Current Performance</h4>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-700">{performanceStats.processingTime.toFixed(1)}ms</div>
                        <div className="text-xs text-blue-600">Processing Time</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-700">{performanceStats.batchCount}</div>
                        <div className="text-xs text-green-600">Buffer Batches</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-purple-700">{config.bufferSize}</div>
                        <div className="text-xs text-purple-600">Buffer Size</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-orange-700">
                          {Math.round(performanceStats.throughput)}
                        </div>
                        <div className="text-xs text-orange-600">Chars/Second</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                      <div><strong>Configuration:</strong></div>
                      <div>Passthrough: {config.passthroughRate}% | Keep Original: {config.originalKeyWeight}%</div>
                      <div>Jitter: ±{config.jitterAmount}% | Parallel: {config.enableParallelProcessing ? 'Yes' : 'No'}</div>
                      <div className="text-blue-600 pt-1 border-t">
                        Expected Error Rate: {((100 - config.passthroughRate) * (100 - config.originalKeyWeight) / 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="min-h-0">
                    <h4 className="text-md font-medium mb-2">Buffer Size Comparison</h4>
                    <div className="w-full h-64 overflow-hidden">
                      {graphData.performanceComparison.length > 0 ? (
                        <BarChart width={Math.min(400, window.innerWidth - 500)} height={240} data={graphData.performanceComparison}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bufferSize" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [
                            name === 'estimatedThroughput' ? `${Math.round(value)} chars/sec` : `${value.toFixed(1)}ms`,
                            name === 'estimatedThroughput' ? 'Throughput' : 'Est. Time'
                          ]} />
                          <Bar dataKey="estimatedThroughput" fill="#82ca9d" />
                        </BarChart>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Process text to see performance comparison
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'frequency' && (
              <div className="h-full min-h-0">
                <h3 className="text-lg font-semibold mb-3">Letter Frequency & Swap Analysis</h3>
                <div className="w-full h-96 overflow-hidden">
                  {graphData.frequencyData.some(d => d.count > 0) ? (
                    <BarChart width={Math.min(800, window.innerWidth - 420)} height={360} data={graphData.frequencyData.slice(0, 15)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="letter" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'count' ? value : `${value}%`,
                        name === 'count' ? 'Swap Count' : 'Swap Rate'
                      ]} />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Process some text to see frequency analysis!
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'patterns' && (
              <div className="h-full min-h-0">
                <h3 className="text-lg font-semibold mb-3">Most Common Swap Patterns</h3>
                <div className="w-full h-96 overflow-hidden">
                  {graphData.patternData.length > 0 ? (
                    <BarChart width={Math.min(800, window.innerWidth - 420)} height={360} data={graphData.patternData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="pattern" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        `${value} (${graphData.patternData.find(d => d.count === value)?.percentage}%)`,
                        'Occurrences'
                      ]} />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Process some text to see swap patterns!
                    </div>
                    )}
                </div>
              </div>
            )}

            {activeTab === 'buffers' && (
              <div className="h-full min-h-0">
                <h3 className="text-lg font-semibold mb-3">Buffer Processing Analysis</h3>
                <div className="w-full h-96 overflow-hidden">
                  {graphData.bufferPerf.length > 0 ? (
                    <LineChart width={Math.min(800, window.innerWidth - 420)} height={360} data={graphData.bufferPerf}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="buffer" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'bufferEfficiency' ? `${value.toFixed(1)}%` : value,
                        name === 'bufferEfficiency' ? 'Efficiency' : 'Swaps'
                      ]} />
                      <Line type="monotone" dataKey="swapCount" stroke="#8884d8" name="Swaps per Buffer" />
                      <Line type="monotone" dataKey="bufferEfficiency" stroke="#82ca9d" name="Buffer Efficiency %" />
                    </LineChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Process some text to see buffer analysis!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Modal */}
      {inputModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-3/4 max-w-4xl h-3/4 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Raw Input - Expanded View</h3>
              <button
                onClick={() => setInputModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="flex-1 p-4 border-none focus:ring-0 resize-none font-mono text-sm"
              placeholder="Type or paste your text here for bulk spackling..."
              autoFocus
            />
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {rawInput.length} characters | {Math.ceil(rawInput.length / config.bufferSize)} buffers | {config.bufferSize} chars/buffer
              </div>
              <button
                onClick={() => {
                  spackleText();
                  setInputModalOpen(false);
                }}
                disabled={!rawInput.trim() || isProcessing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Spackle Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output Modal */}
      {outputModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-3/4 max-w-4xl h-3/4 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Spackled Output - Expanded View</h3>
              <button
                onClick={() => setOutputModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={spackledOutput}
              readOnly
              className="flex-1 p-4 border-none focus:ring-0 resize-none font-mono text-sm bg-gray-50"
              placeholder="Spackled text will appear here after processing..."
            />
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {spackledOutput.length} characters | {performanceStats.swappedChars} swaps | {swapRate}% error rate | {Math.round(performanceStats.throughput)} chars/sec
              </div>
              <button
                onClick={() => copyToClipboard(spackledOutput)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSpackleDashboard;