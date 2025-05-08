import { useState, useEffect, useRef } from 'react';

const SimplifiedNeuralVisualizer = () => {
  // State for selected prompt
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [animationStep, setAnimationStep] = useState(4); // Default to showing full activation
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);

  // Sample prompts (simplified set)
  const prompts = [
    "Tell me about the solar system",
    "As an astronomy professor with 20 years of experience, explain the solar system in detail",
    "You are a science writer for children aged 8-10. Explain the solar system in a fun way",
    "Imagine you're Carl Sagan. Describe the solar system with your poetic style"
  ];

  // Simulated neuron activation patterns for each prompt (reduced complexity)
  const promptActivations = [
    // Basic prompt - scattered activations
    {
      inputLayer: [0.3, 0.2, 0.7, 0.4],
      hiddenLayer1: [0.2, 0.4, 0.3, 0.1],
      hiddenLayer2: [0.3, 0.2, 0.4, 0.2],
      outputLayer: [0.2, 0.3, 0.4, 0.2],
      pathStrength: 0.3,
      cohesion: 0.4
    },
    // Expert prompt - focused activations
    {
      inputLayer: [0.8, 0.9, 0.5, 0.2],
      hiddenLayer1: [0.9, 0.8, 0.3, 0.1],
      hiddenLayer2: [0.9, 0.7, 0.2, 0.1],
      outputLayer: [0.9, 0.7, 0.2, 0.1],
      pathStrength: 0.8,
      cohesion: 0.9
    },
    // Children's prompt - creative pattern
    {
      inputLayer: [0.2, 0.8, 0.9, 0.1],
      hiddenLayer1: [0.3, 0.9, 0.8, 0.2],
      hiddenLayer2: [0.2, 0.8, 0.9, 0.3],
      outputLayer: [0.3, 0.9, 0.7, 0.2],
      pathStrength: 0.7,
      cohesion: 0.8
    },
    // Carl Sagan style - balanced and poetic
    {
      inputLayer: [0.5, 0.7, 0.7, 0.3],
      hiddenLayer1: [0.6, 0.8, 0.6, 0.2],
      hiddenLayer2: [0.7, 0.7, 0.6, 0.3],
      outputLayer: [0.7, 0.8, 0.5, 0.2],
      pathStrength: 0.75,
      cohesion: 0.8
    }
  ];

  // Simulated output patterns (simplified)
  const outputPatterns = [
    {
      text: "The solar system consists of the Sun and the celestial objects that orbit around it...",
      topTokens: [
        { token: "The", prob: 0.35 },
        { token: "Our", prob: 0.18 }
      ]
    },
    {
      text: "The solar system is a gravitationally bound celestial structure consisting of the Sun and objects that orbit it...",
      topTokens: [
        { token: "The", prob: 0.65 },
        { token: "Our", prob: 0.22 }
      ]
    },
    {
      text: "Have you ever looked up at the night sky and wondered about all those shining dots? Let's go on an adventure!",
      topTokens: [
        { token: "Have", prob: 0.58 },
        { token: "Imagine", prob: 0.21 }
      ]
    },
    {
      text: "Consider for a moment that you're standing on a small, pale blue dot, suspended in a sunbeam...",
      topTokens: [
        { token: "Consider", prob: 0.48 },
        { token: "We", prob: 0.23 }
      ]
    }
  ];

  // Animation step descriptions
  const stepDescriptions = [
    "Initial network state",
    "Input layer activation",
    "Hidden layer 1 activation",
    "Hidden layer 2 activation",
    "Output layer activation"
  ];

  // Handle animation
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setTimeout(() => {
        if (animationStep < 4) {
          setAnimationStep(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1000);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, animationStep]);

  // Play animation
  const handlePlayAnimation = () => {
    if (animationStep === 4) {
      setAnimationStep(0);
    }
    setIsPlaying(true);
  };

  // Pause animation
  const handlePauseAnimation = () => {
    setIsPlaying(false);
  };

  // Reset animation
  const handleResetAnimation = () => {
    setIsPlaying(false);
    setAnimationStep(0);
  };

  // Handle animation step change
  const handleStepChange = (e) => {
    setAnimationStep(parseInt(e.target.value));
    setIsPlaying(false);
  };

  // Get node size based on activation value
  const getNodeSize = (value) => {
    const baseSize = 6;
    const maxSize = 16;
    return baseSize + value * (maxSize - baseSize);
  };

  // Get node opacity based on activation value and animation step
  const getNodeOpacity = (layer, index, value) => {
    if (layer === 'inputLayer' && animationStep >= 1) return value;
    if (layer === 'hiddenLayer1' && animationStep >= 2) return value;
    if (layer === 'hiddenLayer2' && animationStep >= 3) return value;
    if (layer === 'outputLayer' && animationStep >= 4) return value;
    return 0.1;
  };

  // Get connection opacity
  const getConnectionOpacity = (fromLayer, toLayer) => {
    if (fromLayer === 'inputLayer' && toLayer === 'hiddenLayer1' && animationStep >= 1) return 0.6;
    if (fromLayer === 'hiddenLayer1' && toLayer === 'hiddenLayer2' && animationStep >= 2) return 0.6;
    if (fromLayer === 'hiddenLayer2' && toLayer === 'outputLayer' && animationStep >= 3) return 0.6;
    return 0;
  };

  // Calculate maximum activation for highlighting the strongest path
  const findStrongestPath = () => {
    // This is a simplified approach
    const inputLayerMax = Math.max(...promptActivations[selectedPromptIndex].inputLayer);
    const inputNodeIndex = promptActivations[selectedPromptIndex].inputLayer.indexOf(inputLayerMax);
    
    const hiddenLayer1Max = Math.max(...promptActivations[selectedPromptIndex].hiddenLayer1);
    const hidden1NodeIndex = promptActivations[selectedPromptIndex].hiddenLayer1.indexOf(hiddenLayer1Max);
    
    const hiddenLayer2Max = Math.max(...promptActivations[selectedPromptIndex].hiddenLayer2);
    const hidden2NodeIndex = promptActivations[selectedPromptIndex].hiddenLayer2.indexOf(hiddenLayer2Max);
    
    const outputLayerMax = Math.max(...promptActivations[selectedPromptIndex].outputLayer);
    const outputNodeIndex = promptActivations[selectedPromptIndex].outputLayer.indexOf(outputLayerMax);
    
    return {
      inputNode: inputNodeIndex,
      hiddenNode1: hidden1NodeIndex,
      hiddenNode2: hidden2NodeIndex,
      outputNode: outputNodeIndex
    };
  };

  const strongestPath = findStrongestPath();

  // Check if a connection is part of the strongest path
  const isStrongestPathConnection = (fromLayer, fromIndex, toLayer, toIndex) => {
    if (fromLayer === 'inputLayer' && toLayer === 'hiddenLayer1') {
      return fromIndex === strongestPath.inputNode && toIndex === strongestPath.hiddenNode1;
    }
    
    if (fromLayer === 'hiddenLayer1' && toLayer === 'hiddenLayer2') {
      return fromIndex === strongestPath.hiddenNode1 && toIndex === strongestPath.hiddenNode2;
    }
    
    if (fromLayer === 'hiddenLayer2' && toLayer === 'outputLayer') {
      return fromIndex === strongestPath.hiddenNode2 && toIndex === strongestPath.outputNode;
    }
    
    return false;
  };

  // Get connection color
  const getConnectionColor = (fromLayer, fromIndex, toLayer, toIndex) => {
    if (isStrongestPathConnection(fromLayer, fromIndex, toLayer, toIndex)) {
      return '#ff9500'; // Highlight color for strongest path
    }
    
    if (fromLayer === 'inputLayer') return '#4F46E5'; // Input to hidden1
    if (fromLayer === 'hiddenLayer1') return '#8B5CF6'; // Hidden1 to hidden2
    if (fromLayer === 'hiddenLayer2') return '#EC4899'; // Hidden2 to output
    return '#888';
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-center mb-4">Neural Network Activation Visualizer</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Select a Prompt:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedPromptIndex(index);
                setAnimationStep(4); // Show full activation
              }}
              className={`p-3 border rounded-lg text-left transition-all ${
                selectedPromptIndex === index 
                  ? 'border-amber-500 bg-amber-50 shadow-md' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="line-clamp-2">
                {prompt}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected Prompt & Animation Controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="mb-2 font-medium">Selected Prompt:</div>
        <div className="italic border-l-4 border-amber-300 pl-3 py-1 mb-3">
          {prompts[selectedPromptIndex]}
        </div>
        
        {/* Animation Controls */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-sm text-gray-700">{stepDescriptions[animationStep]}</div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAnimation}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-700"
              aria-label="Reset Animation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </button>
            
            {isPlaying ? (
              <button
                onClick={handlePauseAnimation}
                className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                aria-label="Pause Animation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={handlePlayAnimation}
                className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                aria-label="Play Animation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
            )}
            
            <input
              type="range"
              min="0"
              max="4"
              value={animationStep}
              onChange={handleStepChange}
              className="w-32 h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {/* Neural Network Visualization */}
      <div className="relative h-80 bg-gray-50 border rounded-lg p-4 flex justify-center">
        <svg width="720px" height="100%" className="overflow-visible">
          {/* Connections between layers */}
          
          {/* Input to Hidden 1 */}
          {promptActivations[selectedPromptIndex].inputLayer.map((_, inputIndex) => (
            promptActivations[selectedPromptIndex].hiddenLayer1.map((_, hiddenIndex) => (
              <path 
                key={`in-h1-${inputIndex}-${hiddenIndex}`}
                d={`M120,${60 + inputIndex * 50} L280,${60 + hiddenIndex * 50}`}
                stroke={getConnectionColor('inputLayer', inputIndex, 'hiddenLayer1', hiddenIndex)}
                strokeWidth={isStrongestPathConnection('inputLayer', inputIndex, 'hiddenLayer1', hiddenIndex) ? 3 : 1}
                strokeOpacity={getConnectionOpacity('inputLayer', 'hiddenLayer1')}
                fill="none"
                className="transition-all duration-500"
              />
            ))
          ))}
          
          {/* Hidden 1 to Hidden 2 */}
          {promptActivations[selectedPromptIndex].hiddenLayer1.map((_, hiddenIndex1) => (
            promptActivations[selectedPromptIndex].hiddenLayer2.map((_, hiddenIndex2) => (
              <path 
                key={`h1-h2-${hiddenIndex1}-${hiddenIndex2}`}
                d={`M280,${60 + hiddenIndex1 * 50} L440,${60 + hiddenIndex2 * 50}`}
                stroke={getConnectionColor('hiddenLayer1', hiddenIndex1, 'hiddenLayer2', hiddenIndex2)}
                strokeWidth={isStrongestPathConnection('hiddenLayer1', hiddenIndex1, 'hiddenLayer2', hiddenIndex2) ? 3 : 1}
                strokeOpacity={getConnectionOpacity('hiddenLayer1', 'hiddenLayer2')}
                fill="none"
                className="transition-all duration-500"
              />
            ))
          ))}
          
          {/* Hidden 2 to Output */}
          {promptActivations[selectedPromptIndex].hiddenLayer2.map((_, hiddenIndex) => (
            promptActivations[selectedPromptIndex].outputLayer.map((_, outputIndex) => (
              <path 
                key={`h2-out-${hiddenIndex}-${outputIndex}`}
                d={`M440,${60 + hiddenIndex * 50} L600,${60 + outputIndex * 50}`}
                stroke={getConnectionColor('hiddenLayer2', hiddenIndex, 'outputLayer', outputIndex)}
                strokeWidth={isStrongestPathConnection('hiddenLayer2', hiddenIndex, 'outputLayer', outputIndex) ? 3 : 1}
                strokeOpacity={getConnectionOpacity('hiddenLayer2', 'outputLayer')}
                fill="none"
                className="transition-all duration-500"
              />
            ))
          ))}
          
          {/* Input Layer Nodes */}
          {promptActivations[selectedPromptIndex].inputLayer.map((value, index) => (
            <g key={`input-${index}`} className="transition-all duration-500">
              <circle 
                cx="120" 
                cy={60 + index * 50} 
                r={getNodeSize(value)}
                fill={index === strongestPath.inputNode ? '#ff9500' : '#4F46E5'}
                fillOpacity={getNodeOpacity('inputLayer', index, value)}
                stroke={index === strongestPath.inputNode && animationStep >= 1 ? '#ff9500' : '#4F46E5'}
                strokeWidth={index === strongestPath.inputNode && animationStep >= 1 ? 2 : 1}
              />
            </g>
          ))}
          
          {/* Hidden Layer 1 Nodes */}
          {promptActivations[selectedPromptIndex].hiddenLayer1.map((value, index) => (
            <g key={`hidden1-${index}`} className="transition-all duration-500">
              <circle 
                cx="280" 
                cy={60 + index * 50} 
                r={getNodeSize(value)}
                fill={index === strongestPath.hiddenNode1 ? '#ff9500' : '#8B5CF6'}
                fillOpacity={getNodeOpacity('hiddenLayer1', index, value)}
                stroke={index === strongestPath.hiddenNode1 && animationStep >= 2 ? '#ff9500' : '#8B5CF6'}
                strokeWidth={index === strongestPath.hiddenNode1 && animationStep >= 2 ? 2 : 1}
              />
            </g>
          ))}
          
          {/* Hidden Layer 2 Nodes */}
          {promptActivations[selectedPromptIndex].hiddenLayer2.map((value, index) => (
            <g key={`hidden2-${index}`} className="transition-all duration-500">
              <circle 
                cx="440" 
                cy={60 + index * 50} 
                r={getNodeSize(value)}
                fill={index === strongestPath.hiddenNode2 ? '#ff9500' : '#EC4899'}
                fillOpacity={getNodeOpacity('hiddenLayer2', index, value)}
                stroke={index === strongestPath.hiddenNode2 && animationStep >= 3 ? '#ff9500' : '#EC4899'}
                strokeWidth={index === strongestPath.hiddenNode2 && animationStep >= 3 ? 2 : 1}
              />
            </g>
          ))}
          
          {/* Output Layer Nodes */}
          {promptActivations[selectedPromptIndex].outputLayer.map((value, index) => (
            <g key={`output-${index}`} className="transition-all duration-500">
              <circle 
                cx="600" 
                cy={60 + index * 50} 
                r={getNodeSize(value)}
                fill={index === strongestPath.outputNode ? '#ff9500' : '#F59E0B'}
                fillOpacity={getNodeOpacity('outputLayer', index, value)}
                stroke={index === strongestPath.outputNode && animationStep >= 4 ? '#ff9500' : '#F59E0B'}
                strokeWidth={index === strongestPath.outputNode && animationStep >= 4 ? 2 : 1}
              />
            </g>
          ))}
          
          {/* Layer Labels */}
          <text x="120" y="260" textAnchor="middle" fill="#4F46E5" fontSize="14" fontWeight="bold">
            Input Layer
          </text>
          <text x="280" y="260" textAnchor="middle" fill="#8B5CF6" fontSize="14" fontWeight="bold">
            Hidden Layer 1
          </text>
          <text x="440" y="260" textAnchor="middle" fill="#EC4899" fontSize="14" fontWeight="bold">
            Hidden Layer 2
          </text>
          <text x="600" y="260" textAnchor="middle" fill="#F59E0B" fontSize="14" fontWeight="bold">
            Output Layer
          </text>
        </svg>
      </div>
      
      {/* Output Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Token Probabilities</h3>
          
          <div className="space-y-2">
            {outputPatterns[selectedPromptIndex].topTokens.map((token, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 font-medium">{token.token}</div>
                <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      index === 0 ? 'bg-green-500' : 'bg-blue-400'
                    }`}
                    style={{ width: `${token.prob * 100}%` }}
                  ></div>
                </div>
                <div className="w-12 text-right ml-2">
                  {(token.prob * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Generated Text</h3>
          <div className="p-2 bg-white rounded border">
            {outputPatterns[selectedPromptIndex].text}
          </div>
        </div>
      </div>
      
      {/* Quick Explanation */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-4">
        <h3 className="font-semibold mb-2">What's Happening?</h3>
        <p className="text-sm">
          This visualization shows how different prompts create different neural activation patterns.
          Notice how more specific prompts (like the expert prompt) create stronger, more focused activation pathways,
          represented by larger nodes and highlighted connections. These activation patterns directly influence
          the model's output, affecting both token probabilities and generated text.
        </p>
      </div>
    </div>
  );
};

export default SimplifiedNeuralVisualizer;
