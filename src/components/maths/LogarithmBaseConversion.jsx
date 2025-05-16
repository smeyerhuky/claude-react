// import React, { useState, useEffect } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, CalculatorIcon } from 'recharts';

// const LogarithmBaseConversion = () => {
//   // State for interactive inputs
//   const [value, setValue] = useState(8);
//   const [sourceBase, setSourceBase] = useState(10);
//   const [targetBase, setTargetBase] = useState(2);
//   const [showSteps, setShowSteps] = useState(true);
//   const [showGraph, setShowGraph] = useState(true);
//   const [activeTab, setActiveTab] = useState('converter');
  
//   // For logarithm tutorial section
//   const [tutorialBase, setTutorialBase] = useState(5);
//   const [tutorialValue, setTutorialValue] = useState(25);
//   const [tutorialEquationX, setTutorialEquationX] = useState(25);
//   const [tutorialStep, setTutorialStep] = useState(1);
  
//   // For tutorial equation solving
//   const solveLogEquation = (base, result) => {
//     return Math.pow(base, result);
//   };
  
//   // Calculate the logarithm with base conversion
//   const calculateLog = (x, base) => {
//     if (x <= 0) return NaN; // Logarithm is only defined for positive numbers
//     if (base <= 0 || base === 1) return NaN; // Base must be positive and not 1
    
//     if (base === 10) return Math.log10(x);
//     if (base === Math.E) return Math.log(x);
//     if (base === 2) return Math.log2(x);
    
//     // For other bases, use change of base formula: log_b(x) = log_c(x) / log_c(b)
//     return Math.log10(x) / Math.log10(base);
//   };
  
//   const result = calculateLog(value, sourceBase);
//   const convertedResult = calculateLog(value, targetBase);
  
//   // Generate data for the logarithm graphs
//   const generateLogData = () => {
//     const data = [];
//     const maxPoints = 20;
//     const step = value * 1.5 / maxPoints;
    
//     for (let i = 0; i < maxPoints; i++) {
//       const x = step * (i + 1);
//       data.push({
//         x,
//         [`log_${sourceBase}`]: calculateLog(x, sourceBase),
//         [`log_${targetBase}`]: calculateLog(x, targetBase),
//         log_10: Math.log10(x),
//         log_e: Math.log(x),
//         log_2: Math.log2(x)
//       });
//     }
    
//     return data;
//   };
  
//   // Sample examples
//   const examples = [
//     { value: 10, sourceBase: 10, targetBase: 2, explanation: "Converting log₁₀(10) to log₂(10)" },
//     { value: 32, sourceBase: 2, targetBase: 10, explanation: "Converting log₂(32) to log₁₀(32)" },
//     { value: 100, sourceBase: 10, targetBase: Math.E, explanation: "Converting log₁₀(100) to ln(100)" },
//     { value: 16, sourceBase: 4, targetBase: 2, explanation: "Converting log₄(16) to log₂(16)" }
//   ];
  
//   // Function to load an example
//   const loadExample = (example) => {
//     setValue(example.value);
//     setSourceBase(example.sourceBase);
//     setTargetBase(example.targetBase);
//     setActiveTab('converter');
//   };
  
//   // Format the base display (use 'e' for Math.E)
//   const formatBase = (base) => {
//     if (base === Math.E) return 'e';
//     return base;
//   };
  
//   // Format the logarithm expression
//   const formatLog = (x, base) => {
//     if (base === Math.E) return `ln(${x})`;
//     return `log₍${formatBase(base)}₎(${x})`;
//   };
  
//   return (
//     <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
//       <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">Logarithm Base Conversion Explorer</h1>
      
//       {/* Tab Navigation */}
//       <div className="flex mb-4 border-b overflow-x-auto">
//         <button 
//           className={`px-4 py-2 ${activeTab === 'converter' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
//           onClick={() => setActiveTab('converter')}
//         >
//           Converter
//         </button>
//         <button 
//           className={`px-4 py-2 ${activeTab === 'tutorial' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
//           onClick={() => setActiveTab('tutorial')}
//         >
//           Logarithm Tutorial
//         </button>
//         <button 
//           className={`px-4 py-2 ${activeTab === 'examples' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
//           onClick={() => setActiveTab('examples')}
//         >
//           Examples
//         </button>
//         <button 
//           className={`px-4 py-2 ${activeTab === 'theory' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
//           onClick={() => setActiveTab('theory')}
//         >
//           Theory
//         </button>
//         <button 
//           className={`px-4 py-2 ${activeTab === 'theory' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-t-lg mr-1`}
//           onClick={() => setActiveTab('theory')}
//         >
//           TI-30XS Mulitview Example
//         </button>
//       </div>
      
//       {/* Converter Tab */}
//       {activeTab === 'converter' && (
//         <div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h2 className="text-xl font-semibold mb-3">Interactive Logarithm Converter</h2>
              
//               {/* Value input */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Value (x): {value}
//                 </label>
//                 <div className="flex items-center">
//                   <input
//                     type="range"
//                     min="1"
//                     max="100"
//                     step="1"
//                     value={value}
//                     onChange={(e) => setValue(Number(e.target.value))}
//                     className="w-3/4 mr-3"
//                   />
//                   <input
//                     type="number"
//                     min="1"
//                     max="1000"
//                     value={value}
//                     onChange={(e) => setValue(Number(e.target.value))}
//                     className="w-1/4 p-1 border rounded"
//                   />
//                 </div>
//               </div>
              
//               {/* Source base input */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Source Base: {formatBase(sourceBase)}
//                 </label>
//                 <div className="flex mb-2">
//                   <button
//                     className={`px-3 py-1 rounded mr-2 ${sourceBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setSourceBase(10)}
//                   >
//                     10
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded mr-2 ${sourceBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setSourceBase(2)}
//                   >
//                     2
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded mr-2 ${sourceBase === Math.E ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setSourceBase(Math.E)}
//                   >
//                     e
//                   </button>
//                 </div>
//                 <div className="flex items-center">
//                   <input
//                     type="range"
//                     min="2"
//                     max="20"
//                     step="1"
//                     value={sourceBase === Math.E ? 2.718 : sourceBase}
//                     onChange={(e) => setSourceBase(Number(e.target.value))}
//                     disabled={sourceBase === Math.E}
//                     className="w-3/4 mr-3"
//                   />
//                   <input
//                     type="number"
//                     min="2"
//                     max="100"
//                     value={sourceBase === Math.E ? 'e' : sourceBase}
//                     onChange={(e) => {
//                       if (e.target.value === 'e') setSourceBase(Math.E);
//                       else setSourceBase(Number(e.target.value));
//                     }}
//                     className="w-1/4 p-1 border rounded"
//                   />
//                 </div>
//               </div>
              
//               {/* Target base input */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Target Base: {formatBase(targetBase)}
//                 </label>
//                 <div className="flex mb-2">
//                   <button
//                     className={`px-3 py-1 rounded mr-2 ${targetBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTargetBase(10)}
//                   >
//                     10
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded mr-2 ${targetBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTargetBase(2)}
//                   >
//                     2
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded mr-2 ${targetBase === Math.E ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTargetBase(Math.E)}
//                   >
//                     e
//                   </button>
//                 </div>
//                 <div className="flex items-center">
//                   <input
//                     type="range"
//                     min="2"
//                     max="20"
//                     step="1"
//                     value={targetBase === Math.E ? 2.718 : targetBase}
//                     onChange={(e) => setTargetBase(Number(e.target.value))}
//                     disabled={targetBase === Math.E}
//                     className="w-3/4 mr-3"
//                   />
//                   <input
//                     type="number"
//                     min="2"
//                     max="100"
//                     value={targetBase === Math.E ? 'e' : targetBase}
//                     onChange={(e) => {
//                       if (e.target.value === 'e') setTargetBase(Math.E);
//                       else setTargetBase(Number(e.target.value));
//                     }}
//                     className="w-1/4 p-1 border rounded"
//                   />
//                 </div>
//               </div>
              
//               {/* Display options */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Display Options:
//                 </label>
//                 <div className="flex flex-wrap">
//                   <label className="inline-flex items-center mr-4 mb-2">
//                     <input
//                       type="checkbox"
//                       checked={showSteps}
//                       onChange={() => setShowSteps(!showSteps)}
//                       className="form-checkbox h-4 w-4 text-blue-600"
//                     />
//                     <span className="ml-2 text-sm">Show Steps</span>
//                   </label>
//                   <label className="inline-flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={showGraph}
//                       onChange={() => setShowGraph(!showGraph)}
//                       className="form-checkbox h-4 w-4 text-blue-600"
//                     />
//                     <span className="ml-2 text-sm">Show Graph</span>
//                   </label>
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h2 className="text-xl font-semibold mb-3">Conversion Result</h2>
              
//               <div className="mb-4 bg-white p-3 rounded border">
//                 <p className="mb-2">
//                   <span className="font-medium">Source:</span>{' '}
//                   {formatLog(value, sourceBase)} = {result.toFixed(6)}
//                 </p>
//                 <p>
//                   <span className="font-medium">Target:</span>{' '}
//                   {formatLog(value, targetBase)} = {convertedResult.toFixed(6)}
//                 </p>
//               </div>
              
//               {showSteps && (
//                 <div className="bg-white p-3 rounded border">
//                   <h3 className="font-medium mb-2">Step-by-Step Conversion:</h3>
                  
//                   <p className="mb-1">1. Start with the change of base formula:</p>
//                   <div className="bg-blue-50 p-2 rounded mb-3 text-center">
//                     log<sub>{formatBase(targetBase)}</sub>(x) = 
//                     log<sub>10</sub>(x) ÷ log<sub>10</sub>({formatBase(targetBase)})
//                   </div>
                  
//                   <p className="mb-1">2. Calculate log<sub>10</sub>({value}):</p>
//                   <div className="bg-green-50 p-2 rounded mb-3">
//                     log<sub>10</sub>({value}) = {Math.log10(value).toFixed(6)}
//                   </div>
                  
//                   <p className="mb-1">3. Calculate log<sub>10</sub>({formatBase(targetBase)}):</p>
//                   <div className="bg-green-50 p-2 rounded mb-3">
//                     log<sub>10</sub>({formatBase(targetBase)}) = {Math.log10(targetBase).toFixed(6)}
//                   </div>
                  
//                   <p className="mb-1">4. Divide these values:</p>
//                   <div className="bg-green-50 p-2 rounded mb-3">
//                     {Math.log10(value).toFixed(6)} ÷ {Math.log10(targetBase).toFixed(6)} = {convertedResult.toFixed(6)}
//                   </div>
                  
//                   <p className="font-medium mt-2">
//                     Therefore, {formatLog(value, sourceBase)} = {formatLog(value, targetBase)} = {convertedResult.toFixed(6)}
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {showGraph && (
//             <div className="mt-6 bg-gray-50 p-4 rounded-lg">
//               <h2 className="text-xl font-semibold mb-3">Logarithm Graph Visualization</h2>
//               <p className="mb-3 text-sm text-gray-600">
//                 This graph shows logarithm functions with different bases. Notice how they 
//                 all have the same shape but different scaling factors.
//               </p>
              
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart
//                     data={generateLogData()}
//                     margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//                   >
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="x" label={{ value: 'x', position: 'insideBottomRight', offset: -5 }} />
//                     <YAxis label={{ value: 'log(x)', angle: -90, position: 'insideLeft' }} />
//                     <Tooltip formatter={(value) => value.toFixed(4)} />
//                     <Legend />
//                     <Line 
//                       type="monotone" 
//                       dataKey={`log_${sourceBase}`} 
//                       name={`log₍${formatBase(sourceBase)}₎(x)`}
//                       stroke="#8884d8" 
//                       strokeWidth={3} 
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey={`log_${targetBase}`} 
//                       name={`log₍${formatBase(targetBase)}₎(x)`}
//                       stroke="#82ca9d" 
//                       strokeWidth={3} 
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="log_10" 
//                       name="log₁₀(x)" 
//                       stroke="#ff7300" 
//                       strokeWidth={sourceBase === 10 || targetBase === 10 ? 0 : 1.5} 
//                       dot={false}
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="log_e" 
//                       name="ln(x)" 
//                       stroke="#0088fe" 
//                       strokeWidth={sourceBase === Math.E || targetBase === Math.E ? 0 : 1.5} 
//                       dot={false}
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="log_2" 
//                       name="log₂(x)" 
//                       stroke="#00C49F" 
//                       strokeWidth={sourceBase === 2 || targetBase === 2 ? 0 : 1.5} 
//                       dot={false}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
              
//               <div className="mt-4 text-sm text-gray-600">
//                 <p>
//                   <strong>Key Insight:</strong> All logarithmic functions are related by a constant multiple.
//                   The graph shows how log<sub>a</sub>(x) and log<sub>b</sub>(x) have the same shape but different scales.
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
      
//       {/* Logarithm Tutorial Tab */}
//       {activeTab === 'tutorial' && (
//         <div>
//           <h2 className="text-xl font-semibold mb-3">Working with Logarithms in Different Bases</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             {/* Evaluating Logarithms Section */}
//             <div className="bg-white border rounded p-4">
//               <h3 className="font-medium text-lg mb-3">Evaluating log<sub>b</sub>(x)</h3>
              
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Choose base (b):
//                 </label>
//                 <div className="flex flex-wrap gap-2 mb-2">
//                   <button
//                     className={`px-3 py-1 rounded ${tutorialBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTutorialBase(2)}
//                   >
//                     2
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded ${tutorialBase === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTutorialBase(5)}
//                   >
//                     5
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded ${tutorialBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTutorialBase(10)}
//                   >
//                     10
//                   </button>
//                 </div>
//                 <input
//                   type="number"
//                   min="2"
//                   max="100"
//                   value={tutorialBase}
//                   onChange={(e) => setTutorialBase(Number(e.target.value))}
//                   className="w-full p-2 border rounded mb-3"
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Choose value (x):
//                 </label>
//                 <input
//                   type="number"
//                   min="1"
//                   max="1000"
//                   value={tutorialValue}
//                   onChange={(e) => setTutorialValue(Number(e.target.value))}
//                   className="w-full p-2 border rounded mb-3"
//                 />
//               </div>
              
//               <div className="bg-blue-50 p-3 rounded mb-4">
//                 <p className="text-center text-lg font-medium">
//                   log<sub>{tutorialBase}</sub>({tutorialValue}) = {calculateLog(tutorialValue, tutorialBase).toFixed(6)}
//                 </p>
//               </div>
              
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Step-by-Step Evaluation:</h4>
                
//                 <ol className="list-decimal pl-5 space-y-2">
//                   <li>
//                     Apply the change of base formula to convert to a calculable form:
//                     <div className="bg-white p-2 rounded mt-1">
//                       log<sub>{tutorialBase}</sub>({tutorialValue}) = 
//                       log<sub>10</sub>({tutorialValue}) ÷ log<sub>10</sub>({tutorialBase})
//                     </div>
//                   </li>
                  
//                   <li>
//                     Calculate log<sub>10</sub>({tutorialValue}):
//                     <div className="bg-white p-2 rounded mt-1">
//                       log<sub>10</sub>({tutorialValue}) = {Math.log10(tutorialValue).toFixed(6)}
//                     </div>
//                   </li>
                  
//                   <li>
//                     Calculate log<sub>10</sub>({tutorialBase}):
//                     <div className="bg-white p-2 rounded mt-1">
//                       log<sub>10</sub>({tutorialBase}) = {Math.log10(tutorialBase).toFixed(6)}
//                     </div>
//                   </li>
                  
//                   <li>
//                     Divide the results:
//                     <div className="bg-white p-2 rounded mt-1">
//                       {Math.log10(tutorialValue).toFixed(6)} ÷ {Math.log10(tutorialBase).toFixed(6)} = {calculateLog(tutorialValue, tutorialBase).toFixed(6)}
//                     </div>
//                   </li>
//                 </ol>
//               </div>
              
//               {Math.pow(tutorialBase, Math.round(calculateLog(tutorialValue, tutorialBase))) === tutorialValue && (
//                 <div className="mt-3 bg-green-50 p-2 rounded">
//                   <p className="font-medium">
//                     Notice: {tutorialBase}<sup>{Math.round(calculateLog(tutorialValue, tutorialBase))}</sup> = {tutorialValue}
//                   </p>
//                   <p className="text-sm">
//                     This shows that log<sub>{tutorialBase}</sub>({tutorialValue}) = {Math.round(calculateLog(tutorialValue, tutorialBase))} exactly.
//                   </p>
//                 </div>
//               )}
//             </div>
            
//             {/* Solving Logarithmic Equations Section */}
//             <div className="bg-white border rounded p-4">
//               <h3 className="font-medium text-lg mb-3">Solving log<sub>b</sub>(x) = y</h3>
              
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Choose base (b):
//                 </label>
//                 <div className="flex flex-wrap gap-2 mb-2">
//                   <button
//                     className={`px-3 py-1 rounded ${tutorialBase === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTutorialBase(2)}
//                   >
//                     2
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded ${tutorialBase === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTutorialBase(5)}
//                   >
//                     5
//                   </button>
//                   <button
//                     className={`px-3 py-1 rounded ${tutorialBase === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                     onClick={() => setTutorialBase(10)}
//                   >
//                     10
//                   </button>
//                 </div>
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Choose result (y):
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   max="10"
//                   step="0.5"
//                   value={tutorialStep}
//                   onChange={(e) => setTutorialStep(Number(e.target.value))}
//                   className="w-full p-2 border rounded mb-3"
//                 />
//               </div>
              
//               <div className="bg-blue-50 p-3 rounded mb-4">
//                 <p className="text-center text-lg font-medium mb-2">
//                   If log<sub>{tutorialBase}</sub>(x) = {tutorialStep}, then:
//                 </p>
//                 <p className="text-center text-xl font-medium">
//                   x = {solveLogEquation(tutorialBase, tutorialStep).toFixed(4)}
//                 </p>
//               </div>
              
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Step-by-Step Solution:</h4>
                
//                 <ol className="list-decimal pl-5 space-y-2">
//                   <li>
//                     Start with the equation:
//                     <div className="bg-white p-2 rounded mt-1">
//                       log<sub>{tutorialBase}</sub>(x) = {tutorialStep}
//                     </div>
//                   </li>
                  
//                   <li>
//                     Apply the definition of logarithm:
//                     <div className="bg-white p-2 rounded mt-1">
//                       If log<sub>b</sub>(x) = y, then x = b<sup>y</sup>
//                     </div>
//                   </li>
                  
//                   <li>
//                     Substitute the values:
//                     <div className="bg-white p-2 rounded mt-1">
//                       x = {tutorialBase}<sup>{tutorialStep}</sup>
//                     </div>
//                   </li>
                  
//                   <li>
//                     Calculate the result:
//                     <div className="bg-white p-2 rounded mt-1">
//                       x = {tutorialBase}<sup>{tutorialStep}</sup> = {solveLogEquation(tutorialBase, tutorialStep).toFixed(4)}
//                     </div>
//                   </li>
//                 </ol>
//               </div>
              
//               <div className="mt-3 bg-yellow-50 p-2 rounded">
//                 <p className="font-medium">Verification:</p>
//                 <p>log<sub>{tutorialBase}</sub>({solveLogEquation(tutorialBase, tutorialStep).toFixed(4)}) = {calculateLog(solveLogEquation(tutorialBase, tutorialStep), tutorialBase).toFixed(4)} ≈ {tutorialStep}</p>
//               </div>
//             </div>
//           </div>
          
//           {/* Logarithm Properties Section */}
//           <div className="bg-white border rounded p-4 mb-6">
//             <h3 className="font-medium text-lg mb-3">Logarithm Properties with Examples</h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Product Rule */}
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Product Rule</h4>
//                 <div className="bg-blue-50 p-2 rounded mb-2">
//                   log<sub>b</sub>(x × y) = log<sub>b</sub>(x) + log<sub>b</sub>(y)
//                 </div>
//                 <p className="mb-2">Example with base {tutorialBase}:</p>
//                 <div className="bg-white p-2 rounded">
//                   log<sub>{tutorialBase}</sub>(8 × 4) = log<sub>{tutorialBase}</sub>(32)<br />
//                   = log<sub>{tutorialBase}</sub>(8) + log<sub>{tutorialBase}</sub>(4)<br />
//                   = {calculateLog(8, tutorialBase).toFixed(4)} + {calculateLog(4, tutorialBase).toFixed(4)}<br />
//                   = {(calculateLog(8, tutorialBase) + calculateLog(4, tutorialBase)).toFixed(4)}
//                 </div>
//                 <p className="mt-2 text-sm">
//                   Verify: log<sub>{tutorialBase}</sub>(32) = {calculateLog(32, tutorialBase).toFixed(4)}
//                 </p>
//               </div>
              
//               {/* Quotient Rule */}
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Quotient Rule</h4>
//                 <div className="bg-blue-50 p-2 rounded mb-2">
//                   log<sub>b</sub>(x ÷ y) = log<sub>b</sub>(x) - log<sub>b</sub>(y)
//                 </div>
//                 <p className="mb-2">Example with base {tutorialBase}:</p>
//                 <div className="bg-white p-2 rounded">
//                   log<sub>{tutorialBase}</sub>(50 ÷ 5) = log<sub>{tutorialBase}</sub>(10)<br />
//                   = log<sub>{tutorialBase}</sub>(50) - log<sub>{tutorialBase}</sub>(5)<br />
//                   = {calculateLog(50, tutorialBase).toFixed(4)} - {calculateLog(5, tutorialBase).toFixed(4)}<br />
//                   = {(calculateLog(50, tutorialBase) - calculateLog(5, tutorialBase)).toFixed(4)}
//                 </div>
//                 <p className="mt-2 text-sm">
//                   Verify: log<sub>{tutorialBase}</sub>(10) = {calculateLog(10, tutorialBase).toFixed(4)}
//                 </p>
//               </div>
              
//               {/* Power Rule */}
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Power Rule</h4>
//                 <div className="bg-blue-50 p-2 rounded mb-2">
//                   log<sub>b</sub>(x<sup>n</sup>) = n × log<sub>b</sub>(x)
//                 </div>
//                 <p className="mb-2">Example with base {tutorialBase}:</p>
//                 <div className="bg-white p-2 rounded">
//                   log<sub>{tutorialBase}</sub>(4<sup>3</sup>) = log<sub>{tutorialBase}</sub>(64)<br />
//                   = 3 × log<sub>{tutorialBase}</sub>(4)<br />
//                   = 3 × {calculateLog(4, tutorialBase).toFixed(4)}<br />
//                   = {(3 * calculateLog(4, tutorialBase)).toFixed(4)}
//                 </div>
//                 <p className="mt-2 text-sm">
//                   Verify: log<sub>{tutorialBase}</sub>(64) = {calculateLog(64, tutorialBase).toFixed(4)}
//                 </p>
//               </div>
              
//               {/* Special Values */}
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Special Values</h4>
//                 <div className="grid grid-cols-1 gap-2">
//                   <div className="bg-blue-50 p-2 rounded">
//                     log<sub>b</sub>(1) = 0 (for any base b)
//                   </div>
//                   <div className="bg-blue-50 p-2 rounded">
//                     log<sub>b</sub>(b) = 1 (for any base b)
//                   </div>
//                   <div className="bg-blue-50 p-2 rounded">
//                     log<sub>b</sub>(b<sup>n</sup>) = n (for any base b and exponent n)
//                   </div>
//                 </div>
//                 <p className="mt-2 mb-2">Examples with base {tutorialBase}:</p>
//                 <div className="bg-white p-2 rounded">
//                   log<sub>{tutorialBase}</sub>(1) = 0<br />
//                   log<sub>{tutorialBase}</sub>({tutorialBase}) = 1<br />
//                   log<sub>{tutorialBase}</sub>({tutorialBase}<sup>3</sup>) = 3
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           {/* Common Logarithm Problems */}
//           <div className="bg-white border rounded p-4">
//             <h3 className="font-medium text-lg mb-3">Common Logarithm Problems</h3>
            
//             <div className="grid grid-cols-1 gap-4">
//               {/* Example Problem 1 */}
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Evaluating log<sub>5</sub>(25)</h4>
//                 <div className="mb-2">
//                   <span className="font-medium">Problem:</span> Calculate log<sub>5</sub>(25)
//                 </div>
//                 <div className="bg-white p-2 rounded mb-2">
//                   <p className="mb-1"><strong>Method 1:</strong> Using the definition of logarithm</p>
//                   <p>If log<sub>5</sub>(25) = x, then 5<sup>x</sup> = 25</p>
//                   <p>Since 5<sup>2</sup> = 25, we have x = 2</p>
//                   <p>Therefore, log<sub>5</sub>(25) = 2</p>
//                 </div>
//                 <div className="bg-white p-2 rounded">
//                   <p className="mb-1"><strong>Method 2:</strong> Using the change of base formula</p>
//                   <p>log<sub>5</sub>(25) = log<sub>10</sub>(25) ÷ log<sub>10</sub>(5)</p>
//                   <p>= {Math.log10(25).toFixed(4)} ÷ {Math.log10(5).toFixed(4)}</p>
//                   <p>= {(Math.log10(25) / Math.log10(5)).toFixed(4)} = 2</p>
//                 </div>
//               </div>
              
//               {/* Example Problem 2 */}
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Solving log<sub>2</sub>(x) + log<sub>2</sub>(x+3) = 3</h4>
//                 <div className="mb-2">
//                   <span className="font-medium">Problem:</span> Solve log<sub>2</sub>(x) + log<sub>2</sub>(x+3) = 3
//                 </div>
//                 <div className="bg-white p-2 rounded">
//                   <p>Step 1: Apply the product rule of logarithms</p>
//                   <p>log<sub>2</sub>(x) + log<sub>2</sub>(x+3) = log<sub>2</sub>(x(x+3)) = 3</p>
                  
//                   <p className="mt-2">Step 2: Apply the definition of logarithm</p>
//                   <p>If log<sub>2</sub>(x(x+3)) = 3, then x(x+3) = 2<sup>3</sup> = 8</p>
                  
//                   <p className="mt-2">Step 3: Expand and solve the quadratic equation</p>
//                   <p>x(x+3) = 8</p>
//                   <p>x<sup>2</sup> + 3x = 8</p>
//                   <p>x<sup>2</sup> + 3x - 8 = 0</p>
//                   <p>(x + 4)(x - 1) = 0</p>
//                   <p>x = -4 or x = 1</p>
                  
//                   <p className="mt-2">Step 4: Check the solutions</p>
//                   <p>Since logarithms are only defined for positive numbers, x = -4 is not valid.</p>
//                   <p>For x = 1: log<sub>2</sub>(1) + log<sub>2</sub>(4) = 0 + 2 = 2 ≠ 3, so x = 1 is not a solution.</p>
                  
//                   <p className="mt-2 font-medium">Therefore, the equation has no solution.</p>
//                 </div>
//               </div>
              
//               {/* Example Problem 3 */}
//               <div className="bg-gray-50 p-3 rounded">
//                 <h4 className="font-medium mb-2">Finding log<sub>10</sub>(500) using properties</h4>
//                 <div className="mb-2">
//                   <span className="font-medium">Problem:</span> Calculate log<sub>10</sub>(500) using logarithm properties
//                 </div>
//                 <div className="bg-white p-2 rounded">
//                   <p>Step 1: Express 500 as a product</p>
//                   <p>500 = 5 × 100 = 5 × 10<sup>2</sup></p>
                  
//                   <p className="mt-2">Step 2: Apply the product rule</p>
//                   <p>log<sub>10</sub>(500) = log<sub>10</sub>(5 × 10<sup>2</sup>) = log<sub>10</sub>(5) + log<sub>10</sub>(10<sup>2</sup>)</p>
                  
//                   <p className="mt-2">Step 3: Apply the power rule and simplify</p>
//                   <p>log<sub>10</sub>(5) + log<sub>10</sub>(10<sup>2</sup>) = log<sub>10</sub>(5) + 2 × log<sub>10</sub>(10)</p>
//                   <p>= log<sub>10</sub>(5) + 2 × 1</p>
//                   <p>= log<sub>10</sub>(5) + 2</p>
//                   <p>= {Math.log10(5).toFixed(4)} + 2 = {(Math.log10(5) + 2).toFixed(4)}</p>
                  
//                   <p className="mt-2">Therefore, log<sub>10</sub>(500) = {Math.log10(500).toFixed(4)}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Examples Tab */}
//       {activeTab === 'examples' && (
//         <div>
//           <h2 className="text-xl font-semibold mb-3">Example Conversions</h2>
//           <p className="mb-4 text-gray-600">
//             Click on any example to load it into the converter.
//           </p>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {examples.map((example, index) => (
//               <div 
//                 key={index}
//                 className="bg-white border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors"
//                 onClick={() => loadExample(example)}
//               >
//                 <h3 className="font-medium mb-2">{example.explanation}</h3>
//                 <div className="bg-gray-50 p-2 rounded">
//                   <p className="mb-1">
//                     {formatLog(example.value, example.sourceBase)} = {calculateLog(example.value, example.sourceBase).toFixed(4)}
//                   </p>
//                   <p>
//                     {formatLog(example.value, example.targetBase)} = {calculateLog(example.value, example.targetBase).toFixed(4)}
//                   </p>
//                 </div>
//                 <div className="mt-2 text-sm text-blue-600">Click to load this example</div>
//               </div>
//             ))}
//           </div>
          
//           <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
//             <h3 className="font-medium text-yellow-800 mb-2">Common Base Relationships</h3>
//             <ul className="list-disc pl-6 text-yellow-700">
//               <li className="mb-1">log₁₀(x) = ln(x) ÷ ln(10) ≈ ln(x) ÷ 2.303</li>
//               <li className="mb-1">ln(x) = log₁₀(x) × ln(10) ≈ log₁₀(x) × 2.303</li>
//               <li className="mb-1">log₂(x) = log₁₀(x) ÷ log₁₀(2) ≈ log₁₀(x) ÷ 0.301</li>
//               <li>log₂(x) = ln(x) ÷ ln(2) ≈ ln(x) ÷ 0.693</li>
//             </ul>
//           </div>
//         </div>
//       )}
      
//       {/* Theory Tab */}
//       {activeTab === 'theory' && (
//         <div>
//           <h2 className="text-xl font-semibold mb-3">Logarithm Base Conversion Theory</h2>
          
//           <div className="bg-white border rounded p-4 mb-4">
//             <h3 className="font-medium mb-2">What is a logarithm?</h3>
//             <p className="mb-2">
//               A logarithm is the inverse operation to exponentiation. The logarithm of a number x with 
//               respect to base b is the exponent to which b must be raised to yield x.
//             </p>
//             <div className="bg-blue-50 p-2 rounded text-center mb-2">
//               If y = log<sub>b</sub>(x), then b<sup>y</sup> = x
//             </div>
//             <p className="mb-2">
//               For example, log<sub>10</sub>(100) = 2 because 10<sup>2</sup> = 100.
//             </p>
//           </div>
          
//           <div className="bg-white border rounded p-4 mb-4">
//             <h3 className="font-medium mb-2">Common Logarithm Bases</h3>
//             <ul className="list-disc pl-6">
//               <li className="mb-1">
//                 <strong>Base 10 (Common logarithm):</strong> Written as log<sub>10</sub>(x) or simply log(x)
//               </li>
//               <li className="mb-1">
//                 <strong>Base e (Natural logarithm):</strong> Written as log<sub>e</sub>(x) or ln(x), where e ≈ 2.71828
//               </li>
//               <li>
//                 <strong>Base 2 (Binary logarithm):</strong> Written as log<sub>2</sub>(x) or lg(x), common in computer science
//               </li>
//             </ul>
//           </div>
          
//           <div className="bg-white border rounded p-4 mb-4">
//             <h3 className="font-medium mb-2">The Change of Base Formula</h3>
//             <p className="mb-2">
//               To convert a logarithm from one base to another, we use the change of base formula:
//             </p>
//             <div className="bg-blue-50 p-2 rounded text-center mb-2">
//               log<sub>b</sub>(x) = log<sub>c</sub>(x) ÷ log<sub>c</sub>(b)
//             </div>
//             <p className="mb-2">
//               Where:
//             </p>
//             <ul className="list-disc pl-6">
//               <li className="mb-1">x is the input value</li>
//               <li className="mb-1">b is the desired base</li>
//               <li>c is any convenient base (often 10 or e)</li>
//             </ul>
//             <p className="mt-2">
//               This formula allows us to compute logarithms in any base using the logarithm functions available 
//               on calculators (typically base 10 or base e).
//             </p>
//           </div>
          
//           <div className="bg-white border rounded p-4 mb-4">
//             <h3 className="font-medium mb-2">Logarithm Properties</h3>
//             <ul className="list-disc pl-6">
//               <li className="mb-1">log<sub>b</sub>(xy) = log<sub>b</sub>(x) + log<sub>b</sub>(y)</li>
//               <li className="mb-1">log<sub>b</sub>(x/y) = log<sub>b</sub>(x) - log<sub>b</sub>(y)</li>
//               <li className="mb-1">log<sub>b</sub>(x<sup>n</sup>) = n × log<sub>b</sub>(x)</li>
//               <li className="mb-1">log<sub>b</sub>(1) = 0 (since b<sup>0</sup> = 1)</li>
//               <li>log<sub>b</sub>(b) = 1 (since b<sup>1</sup> = b)</li>
//             </ul>
//           </div>
          
//           <div className="bg-white border rounded p-4">
//             <h3 className="font-medium mb-2">Why Base Conversion Matters</h3>
//             <p className="mb-2">
//               Different applications use different logarithm bases:
//             </p>
//             <ul className="list-disc pl-6">
//               <li className="mb-1">
//                 <strong>Base 10:</strong> Used in scientific notation, pH scale, Richter scale
//               </li>
//               <li className="mb-1">
//                 <strong>Base e:</strong> Used in calculus, statistics, compound interest, natural growth/decay
//               </li>
//               <li className="mb-1">
//                 <strong>Base 2:</strong> Used in computer science, information theory, music (octaves)
//               </li>
//             </ul>
//             <p className="mt-2">
//               Understanding how to convert between bases allows you to apply logarithmic concepts 
//               across different domains and use available calculator functions for any base.
//             </p>
//           </div>
//         </div>
//       )}
      
//       {/* Calculator Tab */}
//       {activeTab === 'calculator' && (
//         <div>
//           <h2 className="text-xl font-semibold mb-3">TIlculator Guide</h2>
          
//           <div className="bg-white border rounded p-4 mb-4">
//             <h3 className="font-medium mb-2">Using Built-in Logarithm Functions</h3>
//             <p className="mb-2">
//               The TI-30xs MultiView calculator has built-in functions for calculating 
//               logarithms in base 10 and base e:
//             </p>
//             <ul className="list-disc pl-6">
//               <li className="mb-1">
//                 <strong>Base 10 logarithm:</strong> Press the [LOG] button
//               </li>
//               <li>
//                 <strong>Natural logarithm (base e):</strong> Press the [LN] button
//               </li>
//             </ul>
//           </div>
          
//           <div className="bg-white border rounded p-4 mb-4">
//             <h3 className="font-medium mb-2">Method 1: Using the Change of Base Formula</h3>
//             <p className="mb-2">
//               To calculate a logarithm in a base other than 10 or e, use the change of base formula:
//             </p>
//             <div className="bg-blue-50 p-3 rounded mb-3">
//               <p className="font-medium">log<sub>b</sub>(x) = log<sub>10</sub>(x) ÷ log<sub>10</sub>(b)</p>
//             </div>
            
//             <div className="border-l-4 border-green-500 pl-3 py-1 mb-3">
//               <strong>Example:</strong> Calculate log<sub>2</sub>(8)
//             </div>
            
//             <ol className="list-decimal pl-6 mb-3">
//               <li className="mb-1">Press [LOG] button</li>
//               <li className="mb-1">Enter 8</li>
//               <li className="mb-1">Press [)]</li>
//               <li className="mb-1">Press [÷]</li>
//               <li className="mb-1">Press [LOG] button</li>
//               <li className="mb-1">Enter 2</li>
//               <li className="mb-1">Press [)]</li>
//               <li>Press [=]</li>
//             </ol>
            
//             <p className="mb-2">The display should show 3, since 2<sup>3</sup> = 8.</p>
            
//             <div className="bg-yellow-50 p-2 rounded">
//               <p className="text-sm">
//                 <strong>Note:</strong> You can use [LN] instead of [LOG] in the above steps to use natural logarithms:
//                 log<sub>b</sub>(x) = ln(x) ÷ ln(b)
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LogarithmBaseConversion;

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as math from 'mathjs';

const LogarithmBaseConversion = () => {
  // State for interactive inputs
  const [value, setValue] = useState(8);
  const [sourceBase, setSourceBase] = useState(10);
  const [targetBase, setTargetBase] = useState(2);
  const [showSteps, setShowSteps] = useState(true);
  const [showGraph, setShowGraph] = useState(true);
  const [activeTab, setActiveTab] = useState('converter');

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

  // Helper function for better subscript numbers
  const getSubscript = (num) => {
    const subscripts = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      'e': 'ₑ'
    };

    return String(num).split('').map(char => subscripts[char] || char).join('');
  };

  // Format the logarithm expression with proper subscripts
  const formatLogWithSubscript = (x, base) => {
    if (base === Math.E) return `ln(${x})`;
    return `log${getSubscript(base)}(${x})`;
  };

  // Calculate results
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
      });
    }

    return data;
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header - MathIsFun style */}
      <div style={{
        background: '#4a98e2',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '10px 10px 0 0',
        borderBottom: '3px solid #2176c7'
      }}>
        <h1 style={{
          fontSize: '24px',
          margin: 0,
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Logarithm Base Conversion Explorer 🔄
        </h1>
      </div>

      {/* Navigation Tabs - MathIsFun style */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        background: '#f0f4f8'
      }}>
        {['Converter', 'Examples', 'Tutorial', 'Theory', 'Calculator'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{
              flex: 1,
              padding: '8px 15px',
              background: activeTab === tab.toLowerCase() ? '#4a98e2' : '#e6eef7',
              color: activeTab === tab.toLowerCase() ? 'white' : '#333',
              border: 'none',
              borderRight: '1px solid #ddd',
              borderBottom: activeTab === tab.toLowerCase() ? 'none' : '1px solid #ddd',
              borderTop: activeTab === tab.toLowerCase() ? '3px solid #ff9900' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.toLowerCase() ? 'bold' : 'normal',
              fontSize: '16px',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '15px', background: '#f8f9fa' }}>

        {/* Converter Tab */}
        {activeTab === 'converter' && (
          <div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              marginBottom: '15px'
            }}>
              {/* Input Panel */}
              <div style={{
                flex: '1 1 320px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{
                  color: '#4a98e2',
                  borderBottom: '2px solid #4a98e2',
                  paddingBottom: '5px',
                  marginTop: 0,
                  fontSize: '18px'
                }}>
                  Interactive Converter
                </h2>

                {/* Value input with friendly style */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '5px',
                    color: '#333'
                  }}>
                    Value to Convert (x): {value}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      style={{
                        flex: '1',
                        marginRight: '10px',
                        accentColor: '#4a98e2'
                      }}
                    />
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      style={{
                        width: '70px',
                        padding: '5px',
                        border: '2px solid #4a98e2',
                        borderRadius: '5px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>

                {/* Base selection with colorful buttons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  {/* Source Base */}
                  <div>
                    <label style={{
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '5px',
                      color: '#333'
                    }}>
                      Source Base: {formatBase(sourceBase)}
                    </label>
                    <div style={{ marginBottom: '8px' }}>
                      <button
                        onClick={() => setSourceBase(10)}
                        style={{
                          padding: '5px 12px',
                          marginRight: '5px',
                          background: sourceBase === 10 ? '#ff9900' : '#eee',
                          border: 'none',
                          borderRadius: '5px',
                          fontWeight: sourceBase === 10 ? 'bold' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        10
                      </button>
                      <button
                        onClick={() => setSourceBase(2)}
                        style={{
                          padding: '5px 12px',
                          marginRight: '5px',
                          background: sourceBase === 2 ? '#ff9900' : '#eee',
                          border: 'none',
                          borderRadius: '5px',
                          fontWeight: sourceBase === 2 ? 'bold' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        2
                      </button>
                      <button
                        onClick={() => setSourceBase(Math.E)}
                        style={{
                          padding: '5px 12px',
                          marginRight: '5px',
                          background: sourceBase === Math.E ? '#ff9900' : '#eee',
                          border: 'none',
                          borderRadius: '5px',
                          fontWeight: sourceBase === Math.E ? 'bold' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        e
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        step="1"
                        value={sourceBase === Math.E ? 2.718 : sourceBase}
                        onChange={(e) => setSourceBase(Number(e.target.value))}
                        disabled={sourceBase === Math.E}
                        style={{
                          flex: '1',
                          marginRight: '10px',
                          accentColor: '#ff9900'
                        }}
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
                        style={{
                          width: '70px',
                          padding: '5px',
                          border: '2px solid #ff9900',
                          borderRadius: '5px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Target Base */}
                  <div>
                    <label style={{
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '5px',
                      color: '#333'
                    }}>
                      Target Base: {formatBase(targetBase)}
                    </label>
                    <div style={{ marginBottom: '8px' }}>
                      <button
                        onClick={() => setTargetBase(10)}
                        style={{
                          padding: '5px 12px',
                          marginRight: '5px',
                          background: targetBase === 10 ? '#4dbd74' : '#eee',
                          border: 'none',
                          borderRadius: '5px',
                          fontWeight: targetBase === 10 ? 'bold' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        10
                      </button>
                      <button
                        onClick={() => setTargetBase(2)}
                        style={{
                          padding: '5px 12px',
                          marginRight: '5px',
                          background: targetBase === 2 ? '#4dbd74' : '#eee',
                          border: 'none',
                          borderRadius: '5px',
                          fontWeight: targetBase === 2 ? 'bold' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        2
                      </button>
                      <button
                        onClick={() => setTargetBase(Math.E)}
                        style={{
                          padding: '5px 12px',
                          marginRight: '5px',
                          background: targetBase === Math.E ? '#4dbd74' : '#eee',
                          border: 'none',
                          borderRadius: '5px',
                          fontWeight: targetBase === Math.E ? 'bold' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        e
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        step="1"
                        value={targetBase === Math.E ? 2.718 : targetBase}
                        onChange={(e) => setTargetBase(Number(e.target.value))}
                        disabled={targetBase === Math.E}
                        style={{
                          flex: '1',
                          marginRight: '10px',
                          accentColor: '#4dbd74'
                        }}
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
                        style={{
                          width: '70px',
                          padding: '5px',
                          border: '2px solid #4dbd74',
                          borderRadius: '5px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Display options */}
                <div style={{
                  background: '#f0f4f8',
                  padding: '10px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <label style={{ fontWeight: 'bold', marginRight: '10px' }}>
                    Show:
                  </label>
                  <label style={{
                    marginRight: '15px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <input
                      type="checkbox"
                      checked={showSteps}
                      onChange={() => setShowSteps(!showSteps)}
                      style={{ marginRight: '5px' }}
                    />
                    Steps
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <input
                      type="checkbox"
                      checked={showGraph}
                      onChange={() => setShowGraph(!showGraph)}
                      style={{ marginRight: '5px' }}
                    />
                    Graph
                  </label>
                </div>
              </div>

              {/* Result Panel */}
              <div style={{
                flex: '1 1 320px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{
                  color: '#4a98e2',
                  borderBottom: '2px solid #4a98e2',
                  paddingBottom: '5px',
                  marginTop: 0,
                  fontSize: '18px'
                }}>
                  Conversion Result
                </h2>

                {/* Result boxes with fun colors */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    background: '#fffcf0',
                    border: '2px solid #ff9900',
                    borderRadius: '5px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                      Source:
                    </span>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#ff9900',
                      padding: '5px 0'
                    }}>
                      {formatLogWithSubscript(value, sourceBase)} = {result.toFixed(6)}
                    </span>
                  </div>

                  <div style={{
                    background: '#f1fbf4',
                    border: '2px solid #4dbd74',
                    borderRadius: '5px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                      Target:
                    </span>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#4dbd74',
                      padding: '5px 0'
                    }}>
                      {formatLogWithSubscript(value, targetBase)} = {convertedResult.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Converter Tab */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px',
              marginTop: '20px'
            }}>
              {/* Step-by-Step Results */}
              {showSteps && (
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  padding: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <h2 style={{
                    color: '#4a98e2',
                    borderBottom: '2px solid #4a98e2',
                    paddingBottom: '15px',
                    marginTop: 0,
                    marginBottom: '15px',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#4a98e2" strokeWidth="2" />
                      <path d="M9 12L11 14L15 10" stroke="#4a98e2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Step-by-Step Conversion
                  </h2>

                  <div style={{ fontSize: '15px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#4a98e2',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginRight: '10px'
                      }}>1</span>
                      <span>Start with the change of base formula:</span>
                    </div>
                    <div style={{
                      background: '#f0f6ff',
                      border: '1px dashed #4a98e2',
                      borderRadius: '5px',
                      padding: '10px',
                      textAlign: 'center',
                      marginBottom: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      log{getSubscript(targetBase)}(x) =
                      log{getSubscript(10)}(x) ÷ log{getSubscript(10)}({formatBase(targetBase)})
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#4a98e2',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            marginRight: '10px'
                          }}>2</span>
                          <span>Calculate log<sub>10</sub>({value}):</span>
                        </div>
                        <div style={{
                          background: '#efffef',
                          border: '1px solid #4dbd74',
                          borderRadius: '5px',
                          padding: '8px',
                          fontWeight: 'bold'
                        }}>
                          log{getSubscript(10)}({value}) = {Math.log10(value).toFixed(6)}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#4a98e2',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            marginRight: '10px'
                          }}>3</span>
                          <span>Calculate log<sub>10</sub>({formatBase(targetBase)}):</span>
                        </div>
                        <div style={{
                          background: '#efffef',
                          border: '1px solid #4dbd74',
                          borderRadius: '5px',
                          padding: '8px',
                          fontWeight: 'bold'
                        }}>
                          log<sub>10</sub>({formatBase(targetBase)}) = {Math.log10(targetBase).toFixed(6)}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#4a98e2',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginRight: '10px'
                      }}>4</span>
                      <span>Divide these values:</span>
                    </div>
                    <div style={{
                      background: '#efffef',
                      border: '1px solid #4dbd74',
                      borderRadius: '5px',
                      padding: '8px',
                      fontWeight: 'bold',
                      marginBottom: '12px'
                    }}>
                      {Math.log10(value).toFixed(6)} ÷ {Math.log10(targetBase).toFixed(6)} = {convertedResult.toFixed(6)}
                    </div>

                    <div style={{
                      background: '#fffcf0',
                      border: '1px solid #ff9900',
                      borderRadius: '5px',
                      padding: '10px',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      Therefore, {formatLogWithSubscript(value, sourceBase)} = {formatLogWithSubscript(value, targetBase)} = {convertedResult.toFixed(6)}
                    </div>
                  </div>
                </div>
              )}
              {/* Graph visualization */}
              {showGraph && (<div style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{
                  color: '#4a98e2',
                  borderBottom: '2px solid #4a98e2',
                  paddingBottom: '15px',
                  marginTop: 0,
                  marginBottom: '15px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 16L7 12L11 16L21 6" stroke="#4a98e2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 6H21V10" stroke="#4a98e2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Logarithm Graph Visualization
                </h2>
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  This graph shows how logarithm functions with different bases have the same shape but different scaling factors.
                </p>

                <div style={{ height: '300px', background: '#f8fafc', padding: '15px', borderRadius: '5px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={generateLogData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                      <XAxis dataKey="x" stroke="#333" />
                      <YAxis stroke="#333" />
                      <Tooltip contentStyle={{ border: '1px solid #ddd', borderRadius: '5px' }} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={`log_${sourceBase}`}
                        name={`log base ${formatBase(sourceBase)}`}
                        stroke="#ff9900"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey={`log_${targetBase}`}
                        name={`log base ${formatBase(targetBase)}`}
                        stroke="#4dbd74"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{
                  marginTop: '10px',
                  background: '#f0f4f8',
                  padding: '10px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#4a98e2',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginRight: '10px'
                  }}>!</span>
                  <span>
                    <strong>Did you know?</strong> All logarithm functions look the same shape, just scaled differently.
                    When you change the base, you're just multiplying the function by a constant factor!
                  </span>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div>
            <h2 style={{
              color: '#4a98e2',
              fontSize: '20px',
              margin: '0 0 10px 0'
            }}>
              Example Conversions
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '15px' }}>
              Click on any example box to try it in the converter! ☝️
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {examples.map((example, index) => (
                <div
                  key={index}
                  onClick={() => loadExample(example)}
                  style={{
                    background: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#4a98e2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  {/* Corner banner */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: '#4a98e2',
                    color: 'white',
                    padding: '2px 12px',
                    transform: 'translateX(25%) translateY(-10%) rotate(45deg) translateX(25%)',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    Example {index + 1}
                  </div>

                  <h3 style={{
                    margin: '0 0 10px 0',
                    color: '#333',
                    fontSize: '16px'
                  }}>
                    {example.explanation}
                  </h3>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '5px',
                    padding: '10px',
                    fontSize: '15px'
                  }}>
                    <div style={{
                      marginBottom: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>
                        {example.sourceBase === Math.E ? 'ln' : 'log' + (example.sourceBase !== 10 ? '₍' + example.sourceBase + '₎' : '')}({example.value})
                      </span>
                      <span style={{ fontWeight: 'bold' }}>
                        = {calculateLog(example.value, example.sourceBase).toFixed(4)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>
                        {example.targetBase === Math.E ? 'ln' : 'log' + (example.targetBase !== 10 ? '₍' + example.targetBase + '₎' : '')}({example.value})
                      </span>
                      <span style={{ fontWeight: 'bold' }}>
                        = {calculateLog(example.value, example.targetBase).toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '10px',
                    color: '#4a98e2',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    👆 Click to try this example
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: '#fff4e5',
              border: '2px solid #ff9900',
              borderRadius: '8px',
              padding: '15px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '20px',
                background: '#ff9900',
                color: 'white',
                padding: '2px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Quick Reference
              </div>

              <h3 style={{
                margin: '10px 0 15px 0',
                color: '#333',
                fontSize: '18px',
                textAlign: 'center'
              }}>
                Common Base Relationships
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                fontSize: '16px'
              }}>
                <div style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  log₁₀(x) = ln(x) ÷ ln(10) ≈ ln(x) ÷ 2.303
                </div>
                <div style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  ln(x) = log₁₀(x) × ln(10) ≈ log₁₀(x) × 2.303
                </div>
                <div style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  log₂(x) = log₁₀(x) ÷ log₁₀(2) ≈ log₁₀(x) ÷ 0.301
                </div>
                <div style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  log₂(x) = ln(x) ÷ ln(2) ≈ ln(x) ÷ 0.693
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Tab */}
        {activeTab === 'tutorial' && (
          <div>
            <h2 style={{
              color: '#4a98e2',
              fontSize: '20px',
              margin: '0 0 15px 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{
                background: '#4a98e2',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '10px',
                fontSize: '16px'
              }}>?</span>
              Working with Logarithms in Different Bases
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {/* Evaluating Logs Section */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  background: '#4a98e2',
                  color: 'white',
                  padding: '10px 15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  </svg>
                  Evaluating log<sub>b</sub>(x)
                </div>

                <div style={{ padding: '15px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <label style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'block',
                        marginBottom: '5px'
                      }}>
                        Base (b):
                      </label>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '5px',
                        marginBottom: '5px'
                      }}>
                        <button style={{
                          padding: '3px 8px',
                          background: '#eee',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}>2</button>
                        <button style={{
                          padding: '3px 8px',
                          background: '#ff9900',
                          border: 'none',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}>5</button>
                        <button style={{
                          padding: '3px 8px',
                          background: '#eee',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}>10</button>
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'block',
                        marginBottom: '5px'
                      }}>
                        Value (x):
                      </label>
                      <input
                        type="number"
                        defaultValue="25"
                        style={{
                          width: '100%',
                          padding: '5px',
                          border: '2px solid #4a98e2',
                          borderRadius: '5px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    background: '#f0f6ff',
                    border: '2px solid #4a98e2',
                    borderRadius: '5px',
                    padding: '10px',
                    textAlign: 'center',
                    marginBottom: '15px'
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      log<sub>5</sub>(25) = 2
                    </span>
                  </div>

                  <div style={{
                    background: '#f0f4f8',
                    borderRadius: '5px',
                    padding: '10px'
                  }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '14px' }}>
                      Step-by-Step:
                    </p>

                    <ol style={{ paddingLeft: '20px', margin: '0' }}>
                      <li style={{ marginBottom: '5px' }}>
                        Use formula: log<sub>5</sub>(25) = log<sub>10</sub>(25) ÷ log<sub>10</sub>(5)
                      </li>
                      <li style={{ marginBottom: '5px' }}>
                        Numerator: log<sub>10</sub>(25) = 1.3979
                      </li>
                      <li style={{ marginBottom: '5px' }}>
                        Denominator: log<sub>10</sub>(5) = 0.6990
                      </li>
                      <li>
                        Result: 1.3979 ÷ 0.6990 = 2
                      </li>
                    </ol>
                  </div>

                  <div style={{
                    marginTop: '10px',
                    background: '#efffef',
                    border: '1px solid #4dbd74',
                    borderRadius: '5px',
                    padding: '10px',
                    fontSize: '14px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Notice:</span> 5<sup>2</sup> = 25<br />
                    This confirms that log<sub>5</sub>(25) = 2 exactly.
                  </div>
                </div>
              </div>

              {/* Solving Logs Section */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  background: '#4a98e2',
                  color: 'white',
                  padding: '10px 15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 21V8L12 4L20 8V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 12V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 12H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Solving log<sub>b</sub>(x) = y
                </div>

                <div style={{ padding: '15px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <label style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'block',
                        marginBottom: '5px'
                      }}>
                        Base (b):
                      </label>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '5px',
                        marginBottom: '5px'
                      }}>
                        <button style={{
                          padding: '3px 8px',
                          background: '#eee',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}>2</button>
                        <button style={{
                          padding: '3px 8px',
                          background: '#ff9900',
                          border: 'none',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}>5</button>
                        <button style={{
                          padding: '3px 8px',
                          background: '#eee',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}>10</button>
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'block',
                        marginBottom: '5px'
                      }}>
                        Result (y):
                      </label>
                      <input
                        type="number"
                        defaultValue="3"
                        style={{
                          width: '100%',
                          padding: '5px',
                          border: '2px solid #4a98e2',
                          borderRadius: '5px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    background: '#f0f6ff',
                    border: '2px solid #4a98e2',
                    borderRadius: '5px',
                    padding: '10px',
                    textAlign: 'center',
                    marginBottom: '15px'
                  }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                      If log<sub>5</sub>(x) = 3, then:
                    </p>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      x = 125
                    </span>
                  </div>

                  <div style={{
                    background: '#f0f4f8',
                    borderRadius: '5px',
                    padding: '10px'
                  }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '14px' }}>
                      Step-by-Step Solution:
                    </p>

                    <ol style={{ paddingLeft: '20px', margin: '0' }}>
                      <li style={{ marginBottom: '5px' }}>
                        Start with: log<sub>5</sub>(x) = 3
                      </li>
                      <li style={{ marginBottom: '5px' }}>
                        If log<sub>b</sub>(x) = y, then x = b<sup>y</sup>
                      </li>
                      <li style={{ marginBottom: '5px' }}>
                        Substitute: x = 5<sup>3</sup>
                      </li>
                      <li>
                        Calculate: x = 5<sup>3</sup> = 5 × 5 × 5 = 125
                      </li>
                    </ol>
                  </div>

                  <div style={{
                    marginTop: '10px',
                    background: '#fff5e6',
                    border: '1px solid #ff9900',
                    borderRadius: '5px',
                    padding: '10px',
                    fontSize: '14px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Verification:</span><br />
                    log<sub>5</sub>(125) = 3<br />
                    Because 5<sup>3</sup> = 125
                  </div>
                </div>
              </div>
            </div>

            {/* Logarithm Properties */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4L8 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 4H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 20H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Logarithm Properties
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  {/* Product Rule */}
                  <div style={{
                    background: '#f0f6ff',
                    border: '2px dashed #4a98e2',
                    borderRadius: '8px',
                    padding: '10px'
                  }}>
                    <h4 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg style={{ marginRight: '5px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 11H20V13H4V11Z" fill="#4a98e2" />
                        <path d="M13 4L13 20H11L11 4H13Z" fill="#4a98e2" />
                      </svg>
                      Product Rule
                    </h4>
                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      textAlign: 'center',
                      marginBottom: '5px',
                      fontWeight: 'bold'
                    }}>
                      log<sub>b</sub>(x × y) = log<sub>b</sub>(x) + log<sub>b</sub>(y)
                    </div>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      color: '#666'
                    }}>
                      Multiplying inside = adding outside
                    </p>
                  </div>

                  {/* Quotient Rule */}
                  <div style={{
                    background: '#f0f6ff',
                    border: '2px dashed #4a98e2',
                    borderRadius: '8px',
                    padding: '10px'
                  }}>
                    <h4 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg style={{ marginRight: '5px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 11H20V13H4V11Z" fill="#4a98e2" />
                      </svg>
                      Quotient Rule
                    </h4>
                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      textAlign: 'center',
                      marginBottom: '5px',
                      fontWeight: 'bold'
                    }}>
                      log<sub>b</sub>(x ÷ y) = log<sub>b</sub>(x) - log<sub>b</sub>(y)
                    </div>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      color: '#666'
                    }}>
                      Dividing inside = subtracting outside
                    </p>
                  </div>

                  {/* Power Rule */}
                  <div style={{
                    background: '#f0f6ff',
                    border: '2px dashed #4a98e2',
                    borderRadius: '8px',
                    padding: '10px'
                  }}>
                    <h4 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg style={{ marginRight: '5px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 20L20 20L12 4Z" fill="#4a98e2" />
                      </svg>
                      Power Rule
                    </h4>
                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      textAlign: 'center',
                      marginBottom: '5px',
                      fontWeight: 'bold'
                    }}>
                      log<sub>b</sub>(x<sup>n</sup>) = n × log<sub>b</sub>(x)
                    </div>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      color: '#666'
                    }}>
                      Exponents inside = multiplying outside
                    </p>
                  </div>

                  {/* Special Values */}
                  <div style={{
                    background: '#f0f6ff',
                    border: '2px dashed #4a98e2',
                    borderRadius: '8px',
                    padding: '10px'
                  }}>
                    <h4 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg style={{ marginRight: '5px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#4a98e2" />
                        <path d="M16 12L12 8L8 12L12 16L16 12Z" fill="white" />
                      </svg>
                      Special Values
                    </h4>
                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      textAlign: 'center',
                      marginBottom: '5px',
                      fontWeight: 'bold'
                    }}>
                      log<sub>b</sub>(1) = 0<br />
                      log<sub>b</sub>(b) = 1<br />
                      log<sub>b</sub>(b<sup>n</sup>) = n
                    </div>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      color: '#666'
                    }}>
                      Anchors of the logarithm function
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    color: '#333',
                    fontSize: '16px'
                  }}>
                    Try these examples:
                  </h4>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{
                      background: '#fff5e6',
                      border: '1px solid #ff9900',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        Product Rule with base 5:
                      </p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        log<sub>5</sub>(8 × 4) = log<sub>5</sub>(8) + log<sub>5</sub>(4)<br />
                        = 1.2920 + 0.8614 = 2.1534
                      </p>
                    </div>

                    <div style={{
                      background: '#fff5e6',
                      border: '1px solid #ff9900',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        Quotient Rule with base 5:
                      </p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        log<sub>5</sub>(50 ÷ 5) = log<sub>5</sub>(50) - log<sub>5</sub>(5)<br />
                        = 2.3010 - 1.0000 = 1.3010
                      </p>
                    </div>

                    <div style={{
                      background: '#fff5e6',
                      border: '1px solid #ff9900',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        Power Rule with base 5:
                      </p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        log<sub>5</sub>(4<sup>3</sup>) = 3 × log<sub>5</sub>(4)<br />
                        = 3 × 0.8614 = 2.5842
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Logarithm Problems */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.5 14.5L5 18L8.5 21.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 18H13C17.4183 18 21 14.4183 21 10C21 5.58172 17.4183 2 13 2H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Common Logarithm Problems
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{
                  marginBottom: '20px',
                  borderBottom: '1px dashed #ddd',
                  paddingBottom: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      borderRadius: '5px 5px 0 0',
                      display: 'inline-block',
                      alignSelf: 'flex-start'
                    }}>
                      Problem 1: Evaluating log<sub>5</sub>(25)
                    </div>
                    <div style={{
                      background: '#f0f6ff',
                      border: '2px solid #4a98e2',
                      borderRadius: '0 5px 5px 5px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      log<sub>5</sub>(25) = ?
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{
                      background: '#f8f9fa',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        Method 1: Using the definition
                      </div>
                      <ol style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>If log<sub>5</sub>(25) = x, then 5<sup>x</sup> = 25</li>
                        <li>Since 5<sup>2</sup> = 25, we have x = 2</li>
                        <li>Therefore, log<sub>5</sub>(25) = 2</li>
                      </ol>
                    </div>

                    <div style={{
                      background: '#f8f9fa',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        Method 2: Using the formula
                      </div>
                      <ol style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>log<sub>5</sub>(25) = log<sub>10</sub>(25) ÷ log<sub>10</sub>(5)</li>
                        <li>= 1.3979 ÷ 0.6990</li>
                        <li>= 2.0000</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginBottom: '20px',
                  borderBottom: '1px dashed #ddd',
                  paddingBottom: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      borderRadius: '5px 5px 0 0',
                      display: 'inline-block',
                      alignSelf: 'flex-start'
                    }}>
                      Problem 2: Finding log<sub>10</sub>(500)
                    </div>
                    <div style={{
                      background: '#f0f6ff',
                      border: '2px solid #4a98e2',
                      borderRadius: '0 5px 5px 5px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      log<sub>10</sub>(500) = ?
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '5px',
                    padding: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Using properties:
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '10px'
                    }}>
                      <div>
                        <ol style={{ margin: '0', paddingLeft: '20px' }}>
                          <li>Express 500 as a product: 500 = 5 × 100 = 5 × 10<sup>2</sup></li>
                          <li>log<sub>10</sub>(500) = log<sub>10</sub>(5 × 10<sup>2</sup>)</li>
                        </ol>
                      </div>
                      <div>
                        <ol style={{ margin: '0', paddingLeft: '20px', listStyleType: 'none' }}>
                          <li>3. Apply product rule: log<sub>10</sub>(5) + log<sub>10</sub>(10<sup>2</sup>)</li>
                          <li>4. log<sub>10</sub>(5) + 2 = 0.6990 + 2</li>
                          <li>5. log<sub>10</sub>(500) = 2.6990</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      borderRadius: '5px 5px 0 0',
                      display: 'inline-block',
                      alignSelf: 'flex-start'
                    }}>
                      Problem 3: Solving log<sub>2</sub>(x) = 3
                    </div>
                    <div style={{
                      background: '#f0f6ff',
                      border: '2px solid #4a98e2',
                      borderRadius: '0 5px 5px 5px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      x = ?
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '5px',
                    padding: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Direct solution:
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '10px'
                    }}>
                      <div>
                        <ol style={{ margin: '0', paddingLeft: '20px' }}>
                          <li>If log<sub>2</sub>(x) = 3, then x = 2<sup>3</sup></li>
                          <li>x = 8</li>
                        </ol>
                      </div>
                      <div>
                        <div style={{
                          background: '#efffef',
                          border: '1px solid #4dbd74',
                          borderRadius: '5px',
                          padding: '8px',
                          fontSize: '14px'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>Verification:</span><br />
                          log<sub>2</sub>(8) = 3<br />
                          Because 2<sup>3</sup> = 8
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculator Tab - TI-30xs Guide */}
        {activeTab === 'calculator' && (
          <div>
            <h2 style={{
              color: '#4a98e2',
              fontSize: '20px',
              margin: '0 0 15px 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{
                background: '#4a98e2',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '10px',
                fontSize: '16px'
              }}>🔢</span>
              TI-30xs MultiView Calculator Guide
            </h2>

            {/* Built-in Functions Section */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="4" width="14" height="17" rx="2" stroke="white" strokeWidth="2" />
                  <path d="M9 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 13H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 17H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Using Built-in Logarithm Functions
              </div>

              <div style={{ padding: '15px' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  The TI-30xs MultiView calculator has built-in functions for calculating
                  logarithms in base 10 and base e:
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    background: '#f0f6ff',
                    border: '1px solid #4a98e2',
                    borderRadius: '8px',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '5px 15px',
                      borderRadius: '20px',
                      marginBottom: '10px'
                    }}>
                      Base 10 Logarithm
                    </div>
                    <div style={{
                      background: '#ddd',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #999'
                    }}>
                      LOG
                    </div>
                    <p style={{
                      margin: '10px 0 0 0',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      Press the [LOG] button
                    </p>
                  </div>

                  <div style={{
                    background: '#f0f6ff',
                    border: '1px solid #4a98e2',
                    borderRadius: '8px',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '5px 15px',
                      borderRadius: '20px',
                      marginBottom: '10px'
                    }}>
                      Natural Logarithm (base e)
                    </div>
                    <div style={{
                      background: '#ddd',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #999'
                    }}>
                      LN
                    </div>
                    <p style={{
                      margin: '10px 0 0 0',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      Press the [LN] button
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change of Base Formula Section */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 20L20 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 4L20 4L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Method: Using the Change of Base Formula
              </div>

              <div style={{ padding: '15px' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  To calculate a logarithm in a base other than 10 or e, use the change of base formula:
                </p>

                <div style={{
                  background: '#f0f6ff',
                  border: '2px solid #4a98e2',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                  marginBottom: '15px',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  log<sub>b</sub>(x) = log<sub>10</sub>(x) ÷ log<sub>10</sub>(b)
                </div>

                <div style={{
                  background: '#fff5e6',
                  border: '2px solid #ff9900',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    borderBottom: '1px solid #ff9900',
                    marginBottom: '10px',
                    paddingBottom: '5px',
                    fontWeight: 'bold',
                    color: '#ff9900',
                    fontSize: '16px'
                  }}>
                    Example: Calculate log<sub>2</sub>(8)
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <ol style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>Press [LOG]</li>
                        <li>Enter 8</li>
                        <li>Press [)]</li>
                        <li>Press [÷]</li>
                      </ol>
                    </div>

                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <ol style={{ margin: '0', paddingLeft: '20px', listStyleType: 'none' }}>
                        <li>5. Press [LOG]</li>
                        <li>6. Enter 2</li>
                        <li>7. Press [)]</li>
                        <li>8. Press [=]</li>
                      </ol>
                    </div>
                  </div>

                  <div style={{
                    background: '#efffef',
                    border: '1px solid #4dbd74',
                    borderRadius: '5px',
                    padding: '8px',
                    marginTop: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    The display should show 3, since 2<sup>3</sup> = 8
                  </div>
                </div>

                <div style={{
                  background: '#f9f9f9',
                  border: '1px dashed #999',
                  borderRadius: '5px',
                  padding: '10px',
                  fontSize: '14px'
                }}>
                  <strong>Note:</strong> You can use [LN] instead of [LOG] in the above steps to use natural logarithms:
                  log<sub>b</sub>(x) = ln(x) ÷ ln(b)
                </div>
              </div>
            </div>

            {/* Practical Examples Section */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 6H3.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 12H3.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 18H3.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Practical Examples
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '15px'
                }}>
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      padding: '5px 10px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      Calculate log<sub>5</sub>(125)
                    </div>
                    <div style={{ padding: '10px' }}>
                      <div style={{
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        padding: '8px',
                        marginBottom: '8px',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}>
                        LOG(125) ÷ LOG(5) = 3
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        Since 5<sup>3</sup> = 125
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      padding: '5px 10px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      Calculate log<sub>4</sub>(16)
                    </div>
                    <div style={{ padding: '10px' }}>
                      <div style={{
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        padding: '8px',
                        marginBottom: '8px',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}>
                        LOG(16) ÷ LOG(4) = 2
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        Since 4<sup>2</sup> = 16
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      padding: '5px 10px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      Convert ln(50) to log<sub>10</sub>(50)
                    </div>
                    <div style={{ padding: '10px' }}>
                      <div style={{
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        padding: '8px',
                        marginBottom: '8px',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}>
                        LN(50) ÷ LN(10) ≈ 1.699
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        Using natural logs instead
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{
                      background: '#4a98e2',
                      color: 'white',
                      padding: '5px 10px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      Convert log<sub>10</sub>(75) to log<sub>2</sub>(75)
                    </div>
                    <div style={{ padding: '10px' }}>
                      <div style={{
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        padding: '8px',
                        marginBottom: '8px',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}>
                        LOG(75) ÷ LOG(2) ≈ 6.229
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        How many doublings to reach 75
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Elegance of Change of Base Formula */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                The Elegance of the Change of Base Formula
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  <div style={{
                    background: '#f0f6ff',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      fontSize: '16px'
                    }}>
                      Understanding the Formula
                    </h3>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      When we write log<sub>b</sub>(x), we're asking: "To what power must I raise b to get x?"
                      The formula log<sub>b</sub>(x) = log<sub>10</sub>(x) ÷ log<sub>10</sub>(b) works through a clever mathematical substitution.
                    </p>
                  </div>

                  <div style={{
                    background: '#f0f4f8',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      fontSize: '16px'
                    }}>
                      The Elegant Proof
                    </h3>
                    <div style={{ fontSize: '14px' }}>
                      <p style={{ margin: '0 0 5px 0' }}>Let y = log<sub>b</sub>(x)</p>
                      <p style={{ margin: '0 0 5px 0' }}>Then b<sup>y</sup> = x</p>
                      <p style={{ margin: '0 0 5px 0' }}>Taking log<sub>10</sub> of both sides:</p>
                      <p style={{ margin: '0 0 5px 0' }}>log<sub>10</sub>(b<sup>y</sup>) = log<sub>10</sub>(x)</p>
                      <p style={{ margin: '0 0 5px 0' }}>Using power rule: y × log<sub>10</sub>(b) = log<sub>10</sub>(x)</p>
                      <p style={{ margin: '0' }}>Solving for y: y = log<sub>10</sub>(x) ÷ log<sub>10</sub>(b)</p>
                    </div>
                  </div>

                  <div style={{
                    background: '#f0f4f8',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      fontSize: '16px'
                    }}>
                      Visual Interpretation
                    </h3>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                      Think of logarithms as measuring distances on different scales. The change of base formula
                      acts like a conversion factor between these scales.
                    </p>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      When we divide log<sub>10</sub>(x) by log<sub>10</sub>(b), we're finding how many "b-sized steps"
                      it takes to reach x, using the common base 10 as our measuring stick.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div>
            <h2 style={{
              color: '#4a98e2',
              fontSize: '20px',
              margin: '0 0 15px 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{
                background: '#4a98e2',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '10px',
                fontSize: '16px'
              }}>📚</span>
              Logarithm Base Conversion Theory
            </h2>

            {/* What is a logarithm section */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                What is a logarithm?
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '15px'
                }}>
                  <div>
                    <p style={{ margin: '0 0 10px 0' }}>
                      A logarithm is the <strong>inverse operation</strong> to exponentiation. The logarithm of a number x with
                      respect to base b is the exponent to which b must be raised to yield x.
                    </p>
                    <div style={{
                      background: '#f0f6ff',
                      border: '2px dashed #4a98e2',
                      borderRadius: '8px',
                      padding: '15px',
                      textAlign: 'center',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        If y = log<sub>b</sub>(x), then b<sup>y</sup> = x
                      </span>
                    </div>
                    <p style={{ margin: '0' }}>
                      For example, log<sub>10</sub>(100) = 2 because 10<sup>2</sup> = 100.
                    </p>
                  </div>

                  <div>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      Common Logarithm Bases
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: '10px'
                    }}>
                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        padding: '10px',
                        textAlign: 'center',
                        border: '1px solid #ddd'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          marginBottom: '5px',
                          color: '#4a98e2'
                        }}>
                          Base 10
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          log<sub>10</sub>(x)<br />
                          or log(x)
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          Scientific notation,<br />pH scale
                        </div>
                      </div>

                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        padding: '10px',
                        textAlign: 'center',
                        border: '1px solid #ddd'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          marginBottom: '5px',
                          color: '#4a98e2'
                        }}>
                          Base e
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          log<sub>e</sub>(x)<br />
                          or ln(x)
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          Calculus,<br />growth rates
                        </div>
                      </div>

                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        padding: '10px',
                        textAlign: 'center',
                        border: '1px solid #ddd'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          marginBottom: '5px',
                          color: '#4a98e2'
                        }}>
                          Base 2
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          log<sub>2</sub>(x)<br />
                          or lg(x)
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          Computer science,<br />binary data
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#fff5e6',
                  border: '1px solid #ff9900',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ff9900',
                      color: 'white',
                      fontWeight: 'bold',
                      marginRight: '10px'
                    }}>!</span>
                    <span style={{ fontWeight: 'bold' }}>
                      Fun Fact:
                    </span>
                  </div>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    The word "logarithm" comes from the Greek words "logos" (ratio) and "arithmos" (number).
                    Logarithms were invented in the early 17th century by John Napier to simplify calculations,
                    especially multiplication and division, which were converted to addition and subtraction using logarithm tables!
                  </p>
                </div>
              </div>
            </div>

            {/* Change of Base Formula */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 20L20 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 4L20 4L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                The Change of Base Formula
              </div>

              <div style={{ padding: '15px' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  To convert a logarithm from one base to another, we use the <strong>change of base formula</strong>:
                </p>

                <div style={{
                  background: '#f0f6ff',
                  border: '2px solid #4a98e2',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center',
                  marginBottom: '15px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '20px',
                    background: '#4a98e2',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '2px 10px',
                    borderRadius: '10px'
                  }}>
                    Key Formula
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    log<sub>b</sub>(x) = log<sub>c</sub>(x) ÷ log<sub>c</sub>(b)
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      x
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      input value
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      b
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      desired base
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      c
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      any base (10, e)
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#efffef',
                  border: '1px solid #4dbd74',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <h3 style={{
                    margin: '0 0 10px 0',
                    color: '#4dbd74',
                    fontSize: '16px'
                  }}>
                    Proof of the Change of Base Formula
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '10px'
                  }}>
                    <div>
                      <ol style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>Let y = log<sub>b</sub>(x)</li>
                        <li>By definition of logarithm: b<sup>y</sup> = x</li>
                        <li>Taking log base c of both sides:
                          <div style={{
                            background: 'white',
                            padding: '5px',
                            borderRadius: '5px',
                            marginTop: '5px'
                          }}>
                            log<sub>c</sub>(b<sup>y</sup>) = log<sub>c</sub>(x)
                          </div>
                        </li>
                      </ol>
                    </div>

                    <div>
                      <ol style={{ margin: '0', paddingLeft: '20px', listStyleType: 'none' }}>
                        <li>4. Using the power rule for logarithms:
                          <div style={{
                            background: 'white',
                            padding: '5px',
                            borderRadius: '5px',
                            marginTop: '5px'
                          }}>
                            y · log<sub>c</sub>(b) = log<sub>c</sub>(x)
                          </div>
                        </li>
                        <li>5. Solve for y:
                          <div style={{
                            background: 'white',
                            padding: '5px',
                            borderRadius: '5px',
                            marginTop: '5px'
                          }}>
                            y = log<sub>c</sub>(x) ÷ log<sub>c</sub>(b)
                          </div>
                        </li>
                        <li>6. Since y = log<sub>b</sub>(x), we have:
                          <div style={{
                            background: 'white',
                            padding: '5px',
                            borderRadius: '5px',
                            marginTop: '5px',
                            fontWeight: 'bold'
                          }}>
                            log<sub>b</sub>(x) = log<sub>c</sub>(x) ÷ log<sub>c</sub>(b)
                          </div>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#fff5e6',
                  border: '1px solid #ff9900',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h3 style={{
                    margin: '0 0 10px 0',
                    color: '#ff9900',
                    fontSize: '16px'
                  }}>
                    Most Common Conversions
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        From Base 10 to Base e:
                      </div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '5px',
                        borderRadius: '5px'
                      }}>
                        ln(x) = log<sub>10</sub>(x) × ln(10)
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '5px', color: '#666' }}>
                        ln(10) ≈ 2.303
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        From Base e to Base 10:
                      </div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '5px',
                        borderRadius: '5px'
                      }}>
                        log<sub>10</sub>(x) = ln(x) ÷ ln(10)
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '5px', color: '#666' }}>
                        1 ÷ ln(10) ≈ 0.434
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        From Base 10 to Base 2:
                      </div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '5px',
                        borderRadius: '5px'
                      }}>
                        log<sub>2</sub>(x) = log<sub>10</sub>(x) ÷ log<sub>10</sub>(2)
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '5px', color: '#666' }}>
                        1 ÷ log<sub>10</sub>(2) ≈ 3.32
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        From Base 2 to Base 10:
                      </div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '5px',
                        borderRadius: '5px'
                      }}>
                        log<sub>10</sub>(x) = log<sub>2</sub>(x) × log<sub>10</sub>(2)
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '5px', color: '#666' }}>
                        log<sub>10</sub>(2) ≈ 0.301
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logarithm Properties in Detail */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4L8 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 4H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 20H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Logarithm Properties in Detail
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{
                  marginBottom: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <p style={{ margin: '0 0 15px 0' }}>
                    These logarithm properties work with <strong>any base</strong> and are essential for simplifying calculations:
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '15px'
                  }}>
                    {/* Product Rule - Visual Explanation */}
                    <div style={{
                      border: '2px solid #4a98e2',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: '#4a98e2',
                        color: 'white',
                        padding: '5px 15px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        Product Rule
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '5px',
                          padding: '8px',
                          textAlign: 'center',
                          marginBottom: '10px',
                          fontWeight: 'bold'
                        }}>
                          log<sub>b</sub>(x × y) = log<sub>b</sub>(x) + log<sub>b</sub>(y)
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            background: '#fffcf0',
                            border: '1px solid #ff9900',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Multiplying
                          </div>
                          <div style={{
                            margin: '0 10px',
                            color: '#666'
                          }}>
                            becomes
                          </div>
                          <div style={{
                            background: '#f0f6ff',
                            border: '1px solid #4a98e2',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Adding
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Example: log<sub>10</sub>(1000) = log<sub>10</sub>(10 × 100) = log<sub>10</sub>(10) + log<sub>10</sub>(100) = 1 + 2 = 3
                        </div>
                      </div>
                    </div>

                    {/* Quotient Rule - Visual Explanation */}
                    <div style={{
                      border: '2px solid #4a98e2',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: '#4a98e2',
                        color: 'white',
                        padding: '5px 15px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        Quotient Rule
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '5px',
                          padding: '8px',
                          textAlign: 'center',
                          marginBottom: '10px',
                          fontWeight: 'bold'
                        }}>
                          log<sub>b</sub>(x ÷ y) = log<sub>b</sub>(x) - log<sub>b</sub>(y)
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            background: '#fffcf0',
                            border: '1px solid #ff9900',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Dividing
                          </div>
                          <div style={{
                            margin: '0 10px',
                            color: '#666'
                          }}>
                            becomes
                          </div>
                          <div style={{
                            background: '#f0f6ff',
                            border: '1px solid #4a98e2',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Subtracting
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Example: log<sub>10</sub>(10) = log<sub>10</sub>(100 ÷ 10) = log<sub>10</sub>(100) - log<sub>10</sub>(10) = 2 - 1 = 1
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '15px',
                    marginTop: '15px'
                  }}>
                    {/* Power Rule - Visual Explanation */}
                    <div style={{
                      border: '2px solid #4a98e2',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: '#4a98e2',
                        color: 'white',
                        padding: '5px 15px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        Power Rule
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '5px',
                          padding: '8px',
                          textAlign: 'center',
                          marginBottom: '10px',
                          fontWeight: 'bold'
                        }}>
                          log<sub>b</sub>(x<sup>n</sup>) = n × log<sub>b</sub>(x)
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            background: '#fffcf0',
                            border: '1px solid #ff9900',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Exponents
                          </div>
                          <div style={{
                            margin: '0 10px',
                            color: '#666'
                          }}>
                            become
                          </div>
                          <div style={{
                            background: '#f0f6ff',
                            border: '1px solid #4a98e2',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Multiplication
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Example: log<sub>10</sub>(1000) = log<sub>10</sub>(10<sup>3</sup>) = 3 × log<sub>10</sub>(10) = 3 × 1 = 3
                        </div>
                      </div>
                    </div>

                    {/* Change of Base - Visual Explanation */}
                    <div style={{
                      border: '2px solid #4a98e2',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: '#4a98e2',
                        color: 'white',
                        padding: '5px 15px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        Change of Base Rule
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '5px',
                          padding: '8px',
                          textAlign: 'center',
                          marginBottom: '10px',
                          fontWeight: 'bold'
                        }}>
                          log<sub>b</sub>(x) = log<sub>c</sub>(x) ÷ log<sub>c</sub>(b)
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            background: '#fffcf0',
                            border: '1px solid #ff9900',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Change base
                          </div>
                          <div style={{
                            margin: '0 10px',
                            color: '#666'
                          }}>
                            using
                          </div>
                          <div style={{
                            background: '#f0f6ff',
                            border: '1px solid #4a98e2',
                            borderRadius: '5px',
                            padding: '5px 15px'
                          }}>
                            Division
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Example: log<sub>2</sub>(8) = log<sub>10</sub>(8) ÷ log<sub>10</sub>(2) = 0.9031 ÷ 0.3010 = 3
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#efffef',
                  border: '1px solid #4dbd74',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h3 style={{
                    margin: '0 0 10px 0',
                    color: '#4dbd74',
                    fontSize: '16px'
                  }}>
                    Special Values to Remember
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        log<sub>b</sub>(1) = 0
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        For any base b: b<sup>0</sup> = 1
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        log<sub>b</sub>(b) = 1
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        For any base b: b<sup>1</sup> = b
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        log<sub>b</sub>(b<sup>n</sup>) = n
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        For any base b and number n
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Base Conversion Matters */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Why Base Conversion Matters
              </div>

              <div style={{ padding: '15px' }}>
                <p style={{ margin: '0 0 15px 0' }}>
                  Different fields use different logarithm bases for specific reasons. Being able to convert between
                  bases allows you to apply logarithmic concepts across various domains:
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    background: '#f0f6ff',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#4a98e2',
                      borderBottom: '2px solid #4a98e2',
                      paddingBottom: '5px',
                      fontSize: '16px'
                    }}>
                      Science & Engineering
                    </h3>
                    <ul style={{
                      margin: '0',
                      paddingLeft: '20px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      <li><strong>pH scale</strong> uses log<sub>10</sub> to measure hydrogen ion concentration</li>
                      <li><strong>Richter scale</strong> uses log<sub>10</sub> to measure earthquake intensity</li>
                      <li><strong>Decibels</strong> use log<sub>10</sub> for sound intensity levels</li>
                      <li><strong>Stellar brightness</strong> (magnitude) uses log<sub>10</sub> in astronomy</li>
                    </ul>
                  </div>

                  <div style={{
                    background: '#efffef',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#4dbd74',
                      borderBottom: '2px solid #4dbd74',
                      paddingBottom: '5px',
                      fontSize: '16px'
                    }}>
                      Mathematics & Economics
                    </h3>
                    <ul style={{
                      margin: '0',
                      paddingLeft: '20px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      <li><strong>Natural growth/decay</strong> uses ln (base e) for continuous processes</li>
                      <li><strong>Compound interest</strong> calculations use ln for continuous compounding</li>
                      <li><strong>Calculus</strong> prefers natural logarithms for differentiation and integration</li>
                      <li><strong>Economic models</strong> use logs to normalize data or model exponential growth</li>
                    </ul>
                  </div>

                  <div style={{
                    background: '#f8ebff',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#8a3ffc',
                      borderBottom: '2px solid #8a3ffc',
                      paddingBottom: '5px',
                      fontSize: '16px'
                    }}>
                      Computer Science
                    </h3>
                    <ul style={{
                      margin: '0',
                      paddingLeft: '20px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      <li><strong>Algorithm complexity</strong> uses log<sub>2</sub> to analyze binary search, trees</li>
                      <li><strong>Information theory</strong> uses log<sub>2</sub> to measure bits of information</li>
                      <li><strong>Shannon entropy</strong> measures uncertainty using log<sub>2</sub></li>
                      <li><strong>Memory sizing</strong> often relates to powers of 2 (log<sub>2</sub>)</li>
                    </ul>
                  </div>
                </div>

                <div style={{
                  background: '#fff5e6',
                  border: '1px solid #ff9900',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ff9900',
                      color: 'white',
                      fontWeight: 'bold',
                      marginRight: '10px',
                      fontSize: '14px'
                    }}>💡</span>
                    <span style={{ fontWeight: 'bold' }}>
                      Real-World Applications
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '10px'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        Earthquake Magnitude Example:
                      </p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        A magnitude 7 earthquake is 10 times stronger than a magnitude 6 earthquake because:<br />
                        10<sup>7</sup> ÷ 10<sup>6</sup> = 10<sup>(7-6)</sup> = 10<sup>1</sup> = 10
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        Algorithm Efficiency Example:
                      </p>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        Binary search on a million items takes log<sub>2</sub>(1,000,000) ≈ 20 steps<br />
                        Linear search would take up to 1,000,000 steps!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Insights */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                background: '#4a98e2',
                color: 'white',
                padding: '10px 15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 10.5L4.5 15.5L9.5 20.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 15.5H16C19.866 15.5 23 12.366 23 8.5C23 4.63401 19.866 1.5 16 1.5H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Additional Insights
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <h3 style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px'
                  }}>
                    Historical Note
                  </h3>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                    Before electronic calculators, logarithms were essential for complex calculations.
                    Mathematicians used logarithm tables to convert multiplication and division into
                    addition and subtraction, which were much easier to compute by hand.
                  </p>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    John Napier published his discovery of logarithms in 1614, and Henry Briggs later
                    developed the common (base-10) logarithm system that became standard for hundreds of years
                    of scientific and engineering calculations.
                  </p>
                </div>

                <div style={{
                  background: '#f0f4f8',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h3 style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px'
                  }}>
                    Logarithm Scales in Visualization
                  </h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                    Logarithmic scales are essential for visualizing data that spans many orders of magnitude.
                    They allow us to see patterns in both very large and very small values on the same graph.
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '5px',
                      padding: '10px',
                      border: '1px solid #ddd'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        On a linear scale:
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        Values: 1, 10, 100, 1000, 10000
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '5px'
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#999',
                          marginRight: '5px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#999',
                          marginRight: '85px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#999',
                          marginRight: '85px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#999',
                          marginRight: '85px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#999'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        Small values are crowded together and hard to distinguish
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      borderRadius: '5px',
                      padding: '10px',
                      border: '1px solid #ddd'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        On a log scale:
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        Values: 1, 10, 100, 1000, 10000
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '5px'
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#4a98e2',
                          marginRight: '45px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#4a98e2',
                          marginRight: '45px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#4a98e2',
                          marginRight: '45px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#4a98e2',
                          marginRight: '45px'
                        }}></div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#4a98e2'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        All values are equally spaced and visible
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with MathIsFun style */}
      <div style={{
        background: '#e6eef7',
        color: '#4a98e2',
        fontSize: '14px',
        padding: '8px',
        textAlign: 'center',
        borderRadius: '0 0 10px 10px',
        borderTop: '1px solid #ddd'
      }}>
        ✨ Math can be fun! Convert logarithms with ease ✨
      </div>
    </div>
  );
};

export default LogarithmBaseConversion;
