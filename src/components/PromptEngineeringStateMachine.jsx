// This code should go in: /Users/smeyer/Tools/react-showcase/src/components/PromptEngineeringStateMachine.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';

/**
 * PromptEngineeringStateMachine - Visualizes how prompt techniques guide LLM behavior
 * 
 * @component
 * @description
 * Creates an interactive graph visualization that demonstrates how different 
 * prompt engineering techniques affect the path a language model takes through 
 * its "possibility space" toward generating specific outputs.
 * 
 * The visualization represents the LLM's state space as a network of nodes connected
 * by edges. Different prompt techniques apply different guidance forces that
 * influence the path the model takes through this space.
 */
const PromptEngineeringStateMachine = () => {
  const networkRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedTechnique, setSelectedTechnique] = useState('basic');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [network, setNetwork] = useState(null);
  const [nodes, setNodes] = useState(null);
  const [edges, setEdges] = useState(null);

  // Initialize the network graph
  useEffect(() => {
    if (!containerRef.current) return;

    // Generate the graph data
    const generateGraphData = () => {
      // Create nodes array for the graph
      const nodesArray = [
        { id: 'start', label: 'Start State', group: 'start' },
        { id: 'target', label: 'Desired Output', group: 'target' }
      ];

      // Add intermediate state nodes
      for (let i = 1; i <= 30; i++) {
        nodesArray.push({
          id: `state_${i}`,
          label: `State ${i}`,
          group: i % 5 === 0 ? 'key' : 'normal'
        });
      }

      // Create edges array for the graph
      const edgesArray = [];

      // Create random connections between nodes
      for (let i = 0; i < nodesArray.length; i++) {
        const source = nodesArray[i].id;
        
        // Each state connects to 2-4 other random states
        const connections = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < connections; j++) {
          let target;
          do {
            const randomIndex = Math.floor(Math.random() * nodesArray.length);
            target = nodesArray[randomIndex].id;
          } while (target === source || edgesArray.some(e => e.from === source && e.to === target));
          
          edgesArray.push({
            from: source,
            to: target,
            value: Math.random() // This represents transition probability
          });
        }
      }

      // Ensure there's at least one path from start to target
      edgesArray.push({ from: 'start', to: 'state_1', value: 0.8 });
      edgesArray.push({ from: 'state_5', to: 'state_10', value: 0.7 });
      edgesArray.push({ from: 'state_10', to: 'state_15', value: 0.9 });
      edgesArray.push({ from: 'state_15', to: 'target', value: 0.8 });

      return { nodesArray, edgesArray };
    };

    const { nodesArray, edgesArray } = generateGraphData();

    // Create vis-network nodes dataset
    const nodesDataset = new DataSet(nodesArray.map(node => ({
      id: node.id,
      label: node.label,
      group: node.group,
      font: { size: 14 },
      // Style nodes based on type
      color: node.id === 'start' ? 
        { background: '#4CAF50', border: '#2E7D32', highlight: { background: '#81C784', border: '#2E7D32' } } : 
        node.id === 'target' ? 
        { background: '#F44336', border: '#C62828', highlight: { background: '#E57373', border: '#C62828' } } :
        node.group === 'key' ? 
        { background: '#FF9800', border: '#EF6C00', highlight: { background: '#FFB74D', border: '#EF6C00' } } :
        { background: '#2196F3', border: '#1565C0', highlight: { background: '#64B5F6', border: '#1565C0' } }
    })));

    // Create vis-network edges dataset
    const edgesDataset = new DataSet(edgesArray.map(edge => ({
      from: edge.from, 
      to: edge.to,
      value: edge.value * 5, // Scale up value for better visualization
      width: edge.value * 2,
      color: { opacity: 0.6 }
    })));

    setNodes(nodesDataset);
    setEdges(edgesDataset);

    // Network configuration options
    const options = {
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          face: 'Roboto, Arial',
          color: '#212121'
        },
        borderWidth: 2
      },
      edges: {
        smooth: {
          type: 'continuous'
        },
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 }
        }
      },
      physics: {
        barnesHut: {
          gravitationalConstant: -5000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04
        },
        stabilization: {
          iterations: 200
        }
      },
      groups: {
        start: { color: { background: '#4CAF50', border: '#2E7D32' } },
        target: { color: { background: '#F44336', border: '#C62828' } },
        key: { color: { background: '#FF9800', border: '#EF6C00' } },
        normal: { color: { background: '#2196F3', border: '#1565C0' } }
      },
      layout: {
        improvedLayout: true
      },
      interaction: {
        hover: true,
        navigationButtons: true,
        keyboard: true
      }
    };

    // Create the network instance
    const networkInstance = new Network(
      containerRef.current,
      { nodes: nodesDataset, edges: edgesDataset },
      options
    );

    // Store network in state for later access
    setNetwork(networkInstance);
    networkRef.current = networkInstance;

    // Focus on start node initially
    setTimeout(() => {
      networkInstance.focus('start', {
        scale: 0.8,
        animation: true
      });
    }, 1000);

    // Clean up function for unmounting
    return () => {
      if (networkInstance) {
        networkInstance.destroy();
      }
    };
  }, []);

  // Handle technique simulation
  useEffect(() => {
    if (!isSimulating || !network || !nodes || !edges) return;

    /**
     * Simulates how different prompt engineering techniques
     * affect the path through the LLM's state space
     */
    const simulateTechnique = async () => {
      // Reset any previous highlighted path
      edges.forEach(edge => {
        edges.update({
          id: edge.id,
          color: { opacity: 0.6, color: '#999' },
          width: edge.value * 2
        });
      });

      let path = ['start'];
      let currentState = 'start';
      
      /**
       * Determines the next state based on the current prompt technique
       * Different techniques lead to different pathfinding behaviors:
       * - basic: Random exploration (basic prompting)
       * - zero-shot: Direct path toward target (zero-shot prompting)
       * - few-shot: Following example paths (few-shot examples)
       * - chain-of-thought: Step-by-step reasoning through key states
       * 
       * @param {string} current - Current state ID
       * @returns {Object} - Next state to transition to
       */
      const findNextState = (current) => {
        // Get all edges leading from current state
        const possibleTransitions = edges.get().filter(edge => edge.from === current);
        
        if (!possibleTransitions.length) return null;

        switch (selectedTechnique) {
          case 'zero-shot':
            // Direct path logic: favor edges that lead toward the target
            // Get target node position
            const targetPosition = network.getPositions(['target']).target;
            
            // Find nodes that are closer to the target
            return possibleTransitions.sort((a, b) => {
              const aNodePosition = network.getPositions([a.to])[a.to];
              const bNodePosition = network.getPositions([b.to])[b.to];
              
              // Calculate distances to target
              const distanceA = Math.sqrt(
                Math.pow(aNodePosition.x - targetPosition.x, 2) + 
                Math.pow(aNodePosition.y - targetPosition.y, 2)
              );
              
              const distanceB = Math.sqrt(
                Math.pow(bNodePosition.x - targetPosition.x, 2) + 
                Math.pow(bNodePosition.y - targetPosition.y, 2)
              );
              
              return distanceA - distanceB; // Sort by closest to target
            })[0];
            
          case 'few-shot':
            // Few-shot example logic: follow our predefined "golden path"
            if (current === 'start') {
              return possibleTransitions.find(t => t.to === 'state_1');
            } 
            if (current === 'state_1') {
              return possibleTransitions.find(t => t.to === 'state_5') || possibleTransitions[0];
            }
            if (current === 'state_5') {
              return possibleTransitions.find(t => t.to === 'state_10') || possibleTransitions[0];
            }
            if (current === 'state_10') {
              return possibleTransitions.find(t => t.to === 'state_15') || possibleTransitions[0];
            }
            if (current === 'state_15') {
              return possibleTransitions.find(t => t.to === 'target') || possibleTransitions[0];
            }
            break;
            
          case 'chain-of-thought':
            // Chain of thought logic: prioritize visiting key reasoning states
            const keyCandidates = possibleTransitions.filter(t => {
              const node = nodes.get(t.to);
              return node && node.group === 'key';
            });
            
            if (keyCandidates.length > 0) {
              return keyCandidates[Math.floor(Math.random() * keyCandidates.length)];
            }
            break;
            
          case 'basic':
          default:
            // Basic prompting logic: some randomness with bias toward higher value transitions
            return possibleTransitions.sort((a, b) => b.value - a.value)[0];
        }
        
        // Default fallback - take highest value transition
        return possibleTransitions.sort((a, b) => b.value - a.value)[0];
      };
      
      /**
       * Simulates pathfinding through the state space, highlighting nodes and edges
       * to visualize the path taken by the model
       */
      const simulatePath = async () => {
        let steps = 0;
        const maxSteps = 20; // Prevent infinite loops
        
        while (currentState !== 'target' && steps < maxSteps) {
          const transition = findNextState(currentState);
          if (!transition) break;
          
          const nextState = transition.to;
          path.push(nextState);
          
          // Highlight the current edge
          edges.update({
            id: transition.id,
            color: { color: '#FF4081', opacity: 1 },
            width: 4
          });
          
          // Highlight the current node
          nodes.update({
            id: nextState,
            borderWidth: 3,
            borderWidthSelected: 5
          });
          
          // Focus the network on the current node
          network.focus(nextState, {
            scale: 0.9,
            animation: {
              duration: 800,
              easingFunction: 'easeInOutQuad'
            }
          });
          
          // Update current state
          currentState = nextState;
          
          // Wait for animation to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          steps++;
          
          // If we've reached the target, celebrate with a short pulse animation
          if (currentState === 'target') {
            nodes.update({ 
              id: 'target', 
              borderWidth: 5,
              size: 25
            });
            setTimeout(() => {
              nodes.update({ 
                id: 'target', 
                borderWidth: 2,
                size: 20
              });
            }, 700);
          }
        }
        
        setCurrentPath(path);
        setIsSimulating(false);
      };
      
      // Start the simulation process
      simulatePath();
    };
    
    simulateTechnique();
  }, [isSimulating, selectedTechnique, network, nodes, edges]);

  return (
    <div className="w-full h-[600px] relative border rounded-lg shadow-md overflow-hidden bg-white">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 p-4 bg-white/95 rounded shadow-md border border-gray-200">
        <h3 className="text-lg font-bold mb-3">Prompt Engineering Visualization</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="technique-select" className="block text-sm font-medium mb-1 text-gray-700">
              Select Prompt Technique:
            </label>
            <select
              id="technique-select"
              value={selectedTechnique}
              onChange={(e) => setSelectedTechnique(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSimulating}
            >
              <option value="basic">Basic Prompting</option>
              <option value="zero-shot">Zero-Shot Guidance</option>
              <option value="few-shot">Few-Shot Examples</option>
              <option value="chain-of-thought">Chain of Thought</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsSimulating(true)}
            disabled={isSimulating}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
        
        <div className="mt-4 text-sm p-3 border-l-4 border-blue-500 bg-blue-50">
          <p className="font-semibold">Current Technique: {selectedTechnique}</p>
          {selectedTechnique === 'basic' && (
            <p>Basic prompting with minimal guidance. Model explores with high variance.</p>
          )}
          {selectedTechnique === 'zero-shot' && (
            <p>Direct instruction guiding the model toward target, but may miss important reasoning steps.</p>
          )}
          {selectedTechnique === 'few-shot' && (
            <p>Examples guide the model along known good paths toward the desired output.</p>
          )}
          {selectedTechnique === 'chain-of-thought' && (
            <p>Step-by-step reasoning through key intermediate states for more reliable results.</p>
          )}
        </div>
      </div>
      
      {/* Path display */}
      {currentPath.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10 p-3 bg-white/95 rounded shadow-md border border-gray-200 max-h-32 overflow-y-auto">
          <p className="font-bold">Path Taken:</p>
          <p className="text-sm font-mono">{currentPath.join(' → ')}</p>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-4 right-4 max-w-xs z-10 p-3 bg-white/95 rounded shadow-md border border-gray-200 text-sm">
        <h4 className="font-bold mb-2">Understanding the Visualization</h4>
        <ul className="space-y-1">
          <li className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span> 
            Start state
          </li>
          <li className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span> 
            Target output
          </li>
          <li className="flex items-center">
            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span> 
            Key reasoning states
          </li>
          <li className="flex items-center">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span> 
            Possible states
          </li>
          <li className="flex items-center">
            <span className="inline-block w-3 h-3 bg-pink-500 rounded-full mr-2"></span> 
            Active path
          </li>
        </ul>
      </div>
      
      {/* Graph container */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default PromptEngineeringStateMachine;
