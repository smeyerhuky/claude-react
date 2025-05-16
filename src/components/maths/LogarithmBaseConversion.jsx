import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, CalculatorIcon } from 'recharts';

const MatricesIcon = ( {className} ) => (
  <svg
    className={className}
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    width='24'
    height='24'
  >
    <path d='M20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2ZM8 20H4V16H8V20ZM8 14H4V10H8V14ZM8 8H4V4H8V8ZM14 20H10V16H14V20ZM14 14H10V10H14V14ZM14 8H10V4H14V8ZM20 20H16V16H20V20ZM20 14H16V10H20V14ZM20 8H16V4H20V8Z' />
  </svg>
);

const LogarithmBaseConversion = () => {
  // State for interactive inputs
  const [value, setValue] = useState(8);
  const [sourceBase, setSourceBase] = useState(10);
  const [targetBase, setTargetBase] = useState(2);
  const [showSteps, setShowSteps] = useState(true);
  const [showGraph, setShowGraph] = useState(true);
  const [activeTab, setActiveTab] = useState('converter');
  
  // For logarithm tutorial section
  const [tutorialBase, setTutorialBase] = useState(5);
  const [tutorialValue, setTutorialValue] = useState(25);
  const [tutorialEquationX, setTutorialEquationX] = useState(25);
  const [tutorialStep, setTutorialStep] = useState(1);
  
  // For tutorial equation solving
  const solveLogEquation = (base, result) => {
    return Math.pow(base, result);
  };
  
  // Calculate the logarithm with base conversion
  const calculateLog = (x, base) => {
    if (x <= 0) return NaN; // Logarithm is only defined for positive numbers
    if (base <= 0 || base === 1) return NaN; // Base must be positive and not 1
    
    if (base === 10) return Math.log10(x);
    if (base === Math.E) return Math.log(x);
    if (base === 2) return Math.log2(x);
    
    // For other bases, use change of base formula: log_b(x) = log_c(x) / log_c(b)
    return Math.log10(x) / Math.log10(base);
  };
  
  const result = calculateLog(value, sourceBase);
  const convertedResult = calculateLog(value, targetBase);
  
  // Generate data for the logarithm graphs
  const generateLogData = () => {
    const data = [];
    const maxPoints = 20;
    const step = value * 1.5 / maxPoints;
    
    for (let i = 0; i < maxPoints; i++) {
      const x = step * (i + 1);
      data.push({
        x,
        [`log_${sourceBase}`]: calculateLog(x, sourceBase),
        [`log_${targetBase}`]: calculateLog(x, targetBase),
        log_10: Math.log10(x),
        log_e: Math.log(x),
        log_2: Math.log2(x)
      });
    }
    
    return data;
  };
  
  // Sample examples
  const examples = [
    { value: 10, sourceBase: 10, targetBase: 2, explanation: "Converting log₁₀(10) to log₂(10)" },
    { value: 32, sourceBase: 2, targetBase: 10, explanation: "Converting log₂(32) to log₁₀(32)" },
    { value: 100, sourceBase: 10, targetBase: Math.E, explanation: "Converting log₁₀(100) to ln(100)" },
    { value: 16, sourceBase: 4, targetBase: 2, explanation: "Converting log₄(16) to log₂(16)" }
  ];
  
  // Function to load an example
  const loadExample = (example) => {
    setValue(example.value);
    setSourceBase(example.sourceBase);
    setTargetBase(example.targetBase);
    setActiveTab('converter');
  };
  
  // Format the base display (use 'e' for Math.E)
  const formatBase = (base) => {
    if (base === Math.E) return 'e';
    return base;
  };
  
  // Format the logarithm expression
  const formatLog = (x, base) => {
    if (base === Math.E) return `ln(${x})`;
    return `log₍${formatBase(base)}₎(${x})`;
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">Logarithm Base Conversion Explorer</h1>
      
      {/* Tab Navigation */}
      <div className="flex mb-4 border-b overflow-x-auto">
        <button 
          className={`px-4 py-2 ${activeTab === 'converter' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
          onClick={() => setActiveTab('converter')}
        >
          Converter
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'tutorial' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
          onClick={() => setActiveTab('tutorial')}
        >
          Logarithm Tutorial
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'examples' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
          onClick={() => setActiveTab('examples')}
        >
          Examples
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'theory' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
          onClick={() => setActiveTab('theory')}
        >
          Theory
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'theory' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
          onClick={() => setActiveTab('theory')}
        >
          {/* Add a calculator/math icon from lucide  and "TI-30xs Guide" */}
          <span><MatricesIcon /> TI-30xs Guide</span>
        </button>
      </div>
      
      {/* Converter Tab */}
      {activeTab === 'converter' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Interactive Logarithm Converter</h2>
              
              {/* Value input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value (x): {value}
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-3/4 mr-3"
                  />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-1/4 p-1 border rounded"
                  />
                </div>
              </div>
              
              {/* Source base input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Base: {formatBase(sourceBase)}
                </label>
                <div className="flex mb-2">
                  <button
                    className={`px-3 py-1 rounded mr-2 ${sourceBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setSourceBase(10)}
                  >
                    10
                  </button>
                  <button
                    className={`px-3 py-1 rounded mr-2 ${sourceBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setSourceBase(2)}
                  >
                    2
                  </button>
                  <button
                    className={`px-3 py-1 rounded mr-2 ${sourceBase === Math.E ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setSourceBase(Math.E)}
                  >
                    e
                  </button>
                </div>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={sourceBase === Math.E ? 2.718 : sourceBase}
                    onChange={(e) => setSourceBase(Number(e.target.value))}
                    disabled={sourceBase === Math.E}
                    className="w-3/4 mr-3"
                  />
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={sourceBase === Math.E ? 'e' : sourceBase}
                    onChange={(e) => {
                      if (e.target.value === 'e') setSourceBase(Math.E);
                      else setSourceBase(Number(e.target.value));
                    }}
                    className="w-1/4 p-1 border rounded"
                  />
                </div>
              </div>
              
              {/* Target base input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Base: {formatBase(targetBase)}
                </label>
                <div className="flex mb-2">
                  <button
                    className={`px-3 py-1 rounded mr-2 ${targetBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTargetBase(10)}
                  >
                    10
                  </button>
                  <button
                    className={`px-3 py-1 rounded mr-2 ${targetBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTargetBase(2)}
                  >
                    2
                  </button>
                  <button
                    className={`px-3 py-1 rounded mr-2 ${targetBase === Math.E ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTargetBase(Math.E)}
                  >
                    e
                  </button>
                </div>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={targetBase === Math.E ? 2.718 : targetBase}
                    onChange={(e) => setTargetBase(Number(e.target.value))}
                    disabled={targetBase === Math.E}
                    className="w-3/4 mr-3"
                  />
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={targetBase === Math.E ? 'e' : targetBase}
                    onChange={(e) => {
                      if (e.target.value === 'e') setTargetBase(Math.E);
                      else setTargetBase(Number(e.target.value));
                    }}
                    className="w-1/4 p-1 border rounded"
                  />
                </div>
              </div>
              
              {/* Display options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Options:
                </label>
                <div className="flex flex-wrap">
                  <label className="inline-flex items-center mr-4 mb-2">
                    <input
                      type="checkbox"
                      checked={showSteps}
                      onChange={() => setShowSteps(!showSteps)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Show Steps</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={showGraph}
                      onChange={() => setShowGraph(!showGraph)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Show Graph</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Conversion Result</h2>
              
              <div className="mb-4 bg-white p-3 rounded border">
                <p className="mb-2">
                  <span className="font-medium">Source:</span>{' '}
                  {formatLog(value, sourceBase)} = {result.toFixed(6)}
                </p>
                <p>
                  <span className="font-medium">Target:</span>{' '}
                  {formatLog(value, targetBase)} = {convertedResult.toFixed(6)}
                </p>
              </div>
              
              {showSteps && (
                <div className="bg-white p-3 rounded border">
                  <h3 className="font-medium mb-2">Step-by-Step Conversion:</h3>
                  
                  <p className="mb-1">1. Start with the change of base formula:</p>
                  <div className="bg-blue-50 p-2 rounded mb-3 text-center">
                    log<sub>{formatBase(targetBase)}</sub>(x) = 
                    log<sub>10</sub>(x) ÷ log<sub>10</sub>({formatBase(targetBase)})
                  </div>
                  
                  <p className="mb-1">2. Calculate log<sub>10</sub>({value}):</p>
                  <div className="bg-green-50 p-2 rounded mb-3">
                    log<sub>10</sub>({value}) = {Math.log10(value).toFixed(6)}
                  </div>
                  
                  <p className="mb-1">3. Calculate log<sub>10</sub>({formatBase(targetBase)}):</p>
                  <div className="bg-green-50 p-2 rounded mb-3">
                    log<sub>10</sub>({formatBase(targetBase)}) = {Math.log10(targetBase).toFixed(6)}
                  </div>
                  
                  <p className="mb-1">4. Divide these values:</p>
                  <div className="bg-green-50 p-2 rounded mb-3">
                    {Math.log10(value).toFixed(6)} ÷ {Math.log10(targetBase).toFixed(6)} = {convertedResult.toFixed(6)}
                  </div>
                  
                  <p className="font-medium mt-2">
                    Therefore, {formatLog(value, sourceBase)} = {formatLog(value, targetBase)} = {convertedResult.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {showGraph && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Logarithm Graph Visualization</h2>
              <p className="mb-3 text-sm text-gray-600">
                This graph shows logarithm functions with different bases. Notice how they 
                all have the same shape but different scaling factors.
              </p>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={generateLogData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" label={{ value: 'x', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis label={{ value: 'log(x)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => value.toFixed(4)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={`log_${sourceBase}`} 
                      name={`log₍${formatBase(sourceBase)}₎(x)`}
                      stroke="#8884d8" 
                      strokeWidth={3} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey={`log_${targetBase}`} 
                      name={`log₍${formatBase(targetBase)}₎(x)`}
                      stroke="#82ca9d" 
                      strokeWidth={3} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="log_10" 
                      name="log₁₀(x)" 
                      stroke="#ff7300" 
                      strokeWidth={sourceBase === 10 || targetBase === 10 ? 0 : 1.5} 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="log_e" 
                      name="ln(x)" 
                      stroke="#0088fe" 
                      strokeWidth={sourceBase === Math.E || targetBase === Math.E ? 0 : 1.5} 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="log_2" 
                      name="log₂(x)" 
                      stroke="#00C49F" 
                      strokeWidth={sourceBase === 2 || targetBase === 2 ? 0 : 1.5} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>Key Insight:</strong> All logarithmic functions are related by a constant multiple.
                  The graph shows how log<sub>a</sub>(x) and log<sub>b</sub>(x) have the same shape but different scales.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Logarithm Tutorial Tab */}
      {activeTab === 'tutorial' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Working with Logarithms in Different Bases</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Evaluating Logarithms Section */}
            <div className="bg-white border rounded p-4">
              <h3 className="font-medium text-lg mb-3">Evaluating log<sub>b</sub>(x)</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose base (b):
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    className={`px-3 py-1 rounded ${tutorialBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTutorialBase(2)}
                  >
                    2
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${tutorialBase === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTutorialBase(5)}
                  >
                    5
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${tutorialBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTutorialBase(10)}
                  >
                    10
                  </button>
                </div>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={tutorialBase}
                  onChange={(e) => setTutorialBase(Number(e.target.value))}
                  className="w-full p-2 border rounded mb-3"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose value (x):
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={tutorialValue}
                  onChange={(e) => setTutorialValue(Number(e.target.value))}
                  className="w-full p-2 border rounded mb-3"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded mb-4">
                <p className="text-center text-lg font-medium">
                  log<sub>{tutorialBase}</sub>({tutorialValue}) = {calculateLog(tutorialValue, tutorialBase).toFixed(6)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Step-by-Step Evaluation:</h4>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Apply the change of base formula to convert to a calculable form:
                    <div className="bg-white p-2 rounded mt-1">
                      log<sub>{tutorialBase}</sub>({tutorialValue}) = 
                      log<sub>10</sub>({tutorialValue}) ÷ log<sub>10</sub>({tutorialBase})
                    </div>
                  </li>
                  
                  <li>
                    Calculate log<sub>10</sub>({tutorialValue}):
                    <div className="bg-white p-2 rounded mt-1">
                      log<sub>10</sub>({tutorialValue}) = {Math.log10(tutorialValue).toFixed(6)}
                    </div>
                  </li>
                  
                  <li>
                    Calculate log<sub>10</sub>({tutorialBase}):
                    <div className="bg-white p-2 rounded mt-1">
                      log<sub>10</sub>({tutorialBase}) = {Math.log10(tutorialBase).toFixed(6)}
                    </div>
                  </li>
                  
                  <li>
                    Divide the results:
                    <div className="bg-white p-2 rounded mt-1">
                      {Math.log10(tutorialValue).toFixed(6)} ÷ {Math.log10(tutorialBase).toFixed(6)} = {calculateLog(tutorialValue, tutorialBase).toFixed(6)}
                    </div>
                  </li>
                </ol>
              </div>
              
              {Math.pow(tutorialBase, Math.round(calculateLog(tutorialValue, tutorialBase))) === tutorialValue && (
                <div className="mt-3 bg-green-50 p-2 rounded">
                  <p className="font-medium">
                    Notice: {tutorialBase}<sup>{Math.round(calculateLog(tutorialValue, tutorialBase))}</sup> = {tutorialValue}
                  </p>
                  <p className="text-sm">
                    This shows that log<sub>{tutorialBase}</sub>({tutorialValue}) = {Math.round(calculateLog(tutorialValue, tutorialBase))} exactly.
                  </p>
                </div>
              )}
            </div>
            
            {/* Solving Logarithmic Equations Section */}
            <div className="bg-white border rounded p-4">
              <h3 className="font-medium text-lg mb-3">Solving log<sub>b</sub>(x) = y</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose base (b):
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    className={`px-3 py-1 rounded ${tutorialBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTutorialBase(2)}
                  >
                    2
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${tutorialBase === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTutorialBase(5)}
                  >
                    5
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${tutorialBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTutorialBase(10)}
                  >
                    10
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose result (y):
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={tutorialStep}
                  onChange={(e) => setTutorialStep(Number(e.target.value))}
                  className="w-full p-2 border rounded mb-3"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded mb-4">
                <p className="text-center text-lg font-medium mb-2">
                  If log<sub>{tutorialBase}</sub>(x) = {tutorialStep}, then:
                </p>
                <p className="text-center text-xl font-medium">
                  x = {solveLogEquation(tutorialBase, tutorialStep).toFixed(4)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Step-by-Step Solution:</h4>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Start with the equation:
                    <div className="bg-white p-2 rounded mt-1">
                      log<sub>{tutorialBase}</sub>(x) = {tutorialStep}
                    </div>
                  </li>
                  
                  <li>
                    Apply the definition of logarithm:
                    <div className="bg-white p-2 rounded mt-1">
                      If log<sub>b</sub>(x) = y, then x = b<sup>y</sup>
                    </div>
                  </li>
                  
                  <li>
                    Substitute the values:
                    <div className="bg-white p-2 rounded mt-1">
                      x = {tutorialBase}<sup>{tutorialStep}</sup>
                    </div>
                  </li>
                  
                  <li>
                    Calculate the result:
                    <div className="bg-white p-2 rounded mt-1">
                      x = {tutorialBase}<sup>{tutorialStep}</sup> = {solveLogEquation(tutorialBase, tutorialStep).toFixed(4)}
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="mt-3 bg-yellow-50 p-2 rounded">
                <p className="font-medium">Verification:</p>
                <p>log<sub>{tutorialBase}</sub>({solveLogEquation(tutorialBase, tutorialStep).toFixed(4)}) = {calculateLog(solveLogEquation(tutorialBase, tutorialStep), tutorialBase).toFixed(4)} ≈ {tutorialStep}</p>
              </div>
            </div>
          </div>
          
          {/* Logarithm Properties Section */}
          <div className="bg-white border rounded p-4 mb-6">
            <h3 className="font-medium text-lg mb-3">Logarithm Properties with Examples</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Rule */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Product Rule</h4>
                <div className="bg-blue-50 p-2 rounded mb-2">
                  log<sub>b</sub>(x × y) = log<sub>b</sub>(x) + log<sub>b</sub>(y)
                </div>
                <p className="mb-2">Example with base {tutorialBase}:</p>
                <div className="bg-white p-2 rounded">
                  log<sub>{tutorialBase}</sub>(8 × 4) = log<sub>{tutorialBase}</sub>(32)<br />
                  = log<sub>{tutorialBase}</sub>(8) + log<sub>{tutorialBase}</sub>(4)<br />
                  = {calculateLog(8, tutorialBase).toFixed(4)} + {calculateLog(4, tutorialBase).toFixed(4)}<br />
                  = {(calculateLog(8, tutorialBase) + calculateLog(4, tutorialBase)).toFixed(4)}
                </div>
                <p className="mt-2 text-sm">
                  Verify: log<sub>{tutorialBase}</sub>(32) = {calculateLog(32, tutorialBase).toFixed(4)}
                </p>
              </div>
              
              {/* Quotient Rule */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Quotient Rule</h4>
                <div className="bg-blue-50 p-2 rounded mb-2">
                  log<sub>b</sub>(x ÷ y) = log<sub>b</sub>(x) - log<sub>b</sub>(y)
                </div>
                <p className="mb-2">Example with base {tutorialBase}:</p>
                <div className="bg-white p-2 rounded">
                  log<sub>{tutorialBase}</sub>(50 ÷ 5) = log<sub>{tutorialBase}</sub>(10)<br />
                  = log<sub>{tutorialBase}</sub>(50) - log<sub>{tutorialBase}</sub>(5)<br />
                  = {calculateLog(50, tutorialBase).toFixed(4)} - {calculateLog(5, tutorialBase).toFixed(4)}<br />
                  = {(calculateLog(50, tutorialBase) - calculateLog(5, tutorialBase)).toFixed(4)}
                </div>
                <p className="mt-2 text-sm">
                  Verify: log<sub>{tutorialBase}</sub>(10) = {calculateLog(10, tutorialBase).toFixed(4)}
                </p>
              </div>
              
              {/* Power Rule */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Power Rule</h4>
                <div className="bg-blue-50 p-2 rounded mb-2">
                  log<sub>b</sub>(x<sup>n</sup>) = n × log<sub>b</sub>(x)
                </div>
                <p className="mb-2">Example with base {tutorialBase}:</p>
                <div className="bg-white p-2 rounded">
                  log<sub>{tutorialBase}</sub>(4<sup>3</sup>) = log<sub>{tutorialBase}</sub>(64)<br />
                  = 3 × log<sub>{tutorialBase}</sub>(4)<br />
                  = 3 × {calculateLog(4, tutorialBase).toFixed(4)}<br />
                  = {(3 * calculateLog(4, tutorialBase)).toFixed(4)}
                </div>
                <p className="mt-2 text-sm">
                  Verify: log<sub>{tutorialBase}</sub>(64) = {calculateLog(64, tutorialBase).toFixed(4)}
                </p>
              </div>
              
              {/* Special Values */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Special Values</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-blue-50 p-2 rounded">
                    log<sub>b</sub>(1) = 0 (for any base b)
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    log<sub>b</sub>(b) = 1 (for any base b)
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    log<sub>b</sub>(b<sup>n</sup>) = n (for any base b and exponent n)
                  </div>
                </div>
                <p className="mt-2 mb-2">Examples with base {tutorialBase}:</p>
                <div className="bg-white p-2 rounded">
                  log<sub>{tutorialBase}</sub>(1) = 0<br />
                  log<sub>{tutorialBase}</sub>({tutorialBase}) = 1<br />
                  log<sub>{tutorialBase}</sub>({tutorialBase}<sup>3</sup>) = 3
                </div>
              </div>
            </div>
          </div>
          
          {/* Common Logarithm Problems */}
          <div className="bg-white border rounded p-4">
            <h3 className="font-medium text-lg mb-3">Common Logarithm Problems</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Example Problem 1 */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Evaluating log<sub>5</sub>(25)</h4>
                <div className="mb-2">
                  <span className="font-medium">Problem:</span> Calculate log<sub>5</sub>(25)
                </div>
                <div className="bg-white p-2 rounded mb-2">
                  <p className="mb-1"><strong>Method 1:</strong> Using the definition of logarithm</p>
                  <p>If log<sub>5</sub>(25) = x, then 5<sup>x</sup> = 25</p>
                  <p>Since 5<sup>2</sup> = 25, we have x = 2</p>
                  <p>Therefore, log<sub>5</sub>(25) = 2</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <p className="mb-1"><strong>Method 2:</strong> Using the change of base formula</p>
                  <p>log<sub>5</sub>(25) = log<sub>10</sub>(25) ÷ log<sub>10</sub>(5)</p>
                  <p>= {Math.log10(25).toFixed(4)} ÷ {Math.log10(5).toFixed(4)}</p>
                  <p>= {(Math.log10(25) / Math.log10(5)).toFixed(4)} = 2</p>
                </div>
              </div>
              
              {/* Example Problem 2 */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Solving log<sub>2</sub>(x) + log<sub>2</sub>(x+3) = 3</h4>
                <div className="mb-2">
                  <span className="font-medium">Problem:</span> Solve log<sub>2</sub>(x) + log<sub>2</sub>(x+3) = 3
                </div>
                <div className="bg-white p-2 rounded">
                  <p>Step 1: Apply the product rule of logarithms</p>
                  <p>log<sub>2</sub>(x) + log<sub>2</sub>(x+3) = log<sub>2</sub>(x(x+3)) = 3</p>
                  
                  <p className="mt-2">Step 2: Apply the definition of logarithm</p>
                  <p>If log<sub>2</sub>(x(x+3)) = 3, then x(x+3) = 2<sup>3</sup> = 8</p>
                  
                  <p className="mt-2">Step 3: Expand and solve the quadratic equation</p>
                  <p>x(x+3) = 8</p>
                  <p>x<sup>2</sup> + 3x = 8</p>
                  <p>x<sup>2</sup> + 3x - 8 = 0</p>
                  <p>(x + 4)(x - 1) = 0</p>
                  <p>x = -4 or x = 1</p>
                  
                  <p className="mt-2">Step 4: Check the solutions</p>
                  <p>Since logarithms are only defined for positive numbers, x = -4 is not valid.</p>
                  <p>For x = 1: log<sub>2</sub>(1) + log<sub>2</sub>(4) = 0 + 2 = 2 ≠ 3, so x = 1 is not a solution.</p>
                  
                  <p className="mt-2 font-medium">Therefore, the equation has no solution.</p>
                </div>
              </div>
              
              {/* Example Problem 3 */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Finding log<sub>10</sub>(500) using properties</h4>
                <div className="mb-2">
                  <span className="font-medium">Problem:</span> Calculate log<sub>10</sub>(500) using logarithm properties
                </div>
                <div className="bg-white p-2 rounded">
                  <p>Step 1: Express 500 as a product</p>
                  <p>500 = 5 × 100 = 5 × 10<sup>2</sup></p>
                  
                  <p className="mt-2">Step 2: Apply the product rule</p>
                  <p>log<sub>10</sub>(500) = log<sub>10</sub>(5 × 10<sup>2</sup>) = log<sub>10</sub>(5) + log<sub>10</sub>(10<sup>2</sup>)</p>
                  
                  <p className="mt-2">Step 3: Apply the power rule and simplify</p>
                  <p>log<sub>10</sub>(5) + log<sub>10</sub>(10<sup>2</sup>) = log<sub>10</sub>(5) + 2 × log<sub>10</sub>(10)</p>
                  <p>= log<sub>10</sub>(5) + 2 × 1</p>
                  <p>= log<sub>10</sub>(5) + 2</p>
                  <p>= {Math.log10(5).toFixed(4)} + 2 = {(Math.log10(5) + 2).toFixed(4)}</p>
                  
                  <p className="mt-2">Therefore, log<sub>10</sub>(500) = {Math.log10(500).toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Example Conversions</h2>
          <p className="mb-4 text-gray-600">
            Click on any example to load it into the converter.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example, index) => (
              <div 
                key={index}
                className="bg-white border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => loadExample(example)}
              >
                <h3 className="font-medium mb-2">{example.explanation}</h3>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="mb-1">
                    {formatLog(example.value, example.sourceBase)} = {calculateLog(example.value, example.sourceBase).toFixed(4)}
                  </p>
                  <p>
                    {formatLog(example.value, example.targetBase)} = {calculateLog(example.value, example.targetBase).toFixed(4)}
                  </p>
                </div>
                <div className="mt-2 text-sm text-blue-600">Click to load this example</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Common Base Relationships</h3>
            <ul className="list-disc pl-6 text-yellow-700">
              <li className="mb-1">log₁₀(x) = ln(x) ÷ ln(10) ≈ ln(x) ÷ 2.303</li>
              <li className="mb-1">ln(x) = log₁₀(x) × ln(10) ≈ log₁₀(x) × 2.303</li>
              <li className="mb-1">log₂(x) = log₁₀(x) ÷ log₁₀(2) ≈ log₁₀(x) ÷ 0.301</li>
              <li>log₂(x) = ln(x) ÷ ln(2) ≈ ln(x) ÷ 0.693</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Theory Tab */}
      {activeTab === 'theory' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Logarithm Base Conversion Theory</h2>
          
          <div className="bg-white border rounded p-4 mb-4">
            <h3 className="font-medium mb-2">What is a logarithm?</h3>
            <p className="mb-2">
              A logarithm is the inverse operation to exponentiation. The logarithm of a number x with 
              respect to base b is the exponent to which b must be raised to yield x.
            </p>
            <div className="bg-blue-50 p-2 rounded text-center mb-2">
              If y = log<sub>b</sub>(x), then b<sup>y</sup> = x
            </div>
            <p className="mb-2">
              For example, log<sub>10</sub>(100) = 2 because 10<sup>2</sup> = 100.
            </p>
          </div>
          
          <div className="bg-white border rounded p-4 mb-4">
            <h3 className="font-medium mb-2">Common Logarithm Bases</h3>
            <ul className="list-disc pl-6">
              <li className="mb-1">
                <strong>Base 10 (Common logarithm):</strong> Written as log<sub>10</sub>(x) or simply log(x)
              </li>
              <li className="mb-1">
                <strong>Base e (Natural logarithm):</strong> Written as log<sub>e</sub>(x) or ln(x), where e ≈ 2.71828
              </li>
              <li>
                <strong>Base 2 (Binary logarithm):</strong> Written as log<sub>2</sub>(x) or lg(x), common in computer science
              </li>
            </ul>
          </div>
          
          <div className="bg-white border rounded p-4 mb-4">
            <h3 className="font-medium mb-2">The Change of Base Formula</h3>
            <p className="mb-2">
              To convert a logarithm from one base to another, we use the change of base formula:
            </p>
            <div className="bg-blue-50 p-2 rounded text-center mb-2">
              log<sub>b</sub>(x) = log<sub>c</sub>(x) ÷ log<sub>c</sub>(b)
            </div>
            <p className="mb-2">
              Where:
            </p>
            <ul className="list-disc pl-6">
              <li className="mb-1">x is the input value</li>
              <li className="mb-1">b is the desired base</li>
              <li>c is any convenient base (often 10 or e)</li>
            </ul>
            <p className="mt-2">
              This formula allows us to compute logarithms in any base using the logarithm functions available 
              on calculators (typically base 10 or base e).
            </p>
          </div>
          
          <div className="bg-white border rounded p-4 mb-4">
            <h3 className="font-medium mb-2">Logarithm Properties</h3>
            <ul className="list-disc pl-6">
              <li className="mb-1">log<sub>b</sub>(xy) = log<sub>b</sub>(x) + log<sub>b</sub>(y)</li>
              <li className="mb-1">log<sub>b</sub>(x/y) = log<sub>b</sub>(x) - log<sub>b</sub>(y)</li>
              <li className="mb-1">log<sub>b</sub>(x<sup>n</sup>) = n × log<sub>b</sub>(x)</li>
              <li className="mb-1">log<sub>b</sub>(1) = 0 (since b<sup>0</sup> = 1)</li>
              <li>log<sub>b</sub>(b) = 1 (since b<sup>1</sup> = b)</li>
            </ul>
          </div>
          
          <div className="bg-white border rounded p-4">
            <h3 className="font-medium mb-2">Why Base Conversion Matters</h3>
            <p className="mb-2">
              Different applications use different logarithm bases:
            </p>
            <ul className="list-disc pl-6">
              <li className="mb-1">
                <strong>Base 10:</strong> Used in scientific notation, pH scale, Richter scale
              </li>
              <li className="mb-1">
                <strong>Base e:</strong> Used in calculus, statistics, compound interest, natural growth/decay
              </li>
              <li className="mb-1">
                <strong>Base 2:</strong> Used in computer science, information theory, music (octaves)
              </li>
            </ul>
            <p className="mt-2">
              Understanding how to convert between bases allows you to apply logarithmic concepts 
              across different domains and use available calculator functions for any base.
            </p>
          </div>
        </div>
      )}
      
      {/* Calculator Tab */}
      {activeTab === 'calculator' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">TIlculator Guide</h2>
          
          <div className="bg-white border rounded p-4 mb-4">
            <h3 className="font-medium mb-2">Using Built-in Logarithm Functions</h3>
            <p className="mb-2">
              The TI-30xs MultiView calculator has built-in functions for calculating 
              logarithms in base 10 and base e:
            </p>
            <ul className="list-disc pl-6">
              <li className="mb-1">
                <strong>Base 10 logarithm:</strong> Press the [LOG] button
              </li>
              <li>
                <strong>Natural logarithm (base e):</strong> Press the [LN] button
              </li>
            </ul>
          </div>
          
          <div className="bg-white border rounded p-4 mb-4">
            <h3 className="font-medium mb-2">Method 1: Using the Change of Base Formula</h3>
            <p className="mb-2">
              To calculate a logarithm in a base other than 10 or e, use the change of base formula:
            </p>
            <div className="bg-blue-50 p-3 rounded mb-3">
              <p className="font-medium">log<sub>b</sub>(x) = log<sub>10</sub>(x) ÷ log<sub>10</sub>(b)</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-3 py-1 mb-3">
              <strong>Example:</strong> Calculate log<sub>2</sub>(8)
            </div>
            
            <ol className="list-decimal pl-6 mb-3">
              <li className="mb-1">Press [LOG] button</li>
              <li className="mb-1">Enter 8</li>
              <li className="mb-1">Press [)]</li>
              <li className="mb-1">Press [÷]</li>
              <li className="mb-1">Press [LOG] button</li>
              <li className="mb-1">Enter 2</li>
              <li className="mb-1">Press [)]</li>
              <li>Press [=]</li>
            </ol>
            
            <p className="mb-2">The display should show 3, since 2<sup>3</sup> = 8.</p>
            
            <div className="bg-yellow-50 p-2 rounded">
              <p className="text-sm">
                <strong>Note:</strong> You can use [LN] instead of [LOG] in the above steps to use natural logarithms:
                log<sub>b</sub>(x) = ln(x) ÷ ln(b)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogarithmBaseConversion;
