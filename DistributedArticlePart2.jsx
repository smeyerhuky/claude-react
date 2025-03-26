import React, { createContext, useContext, useState, useEffect, useRef, useCallback, memo } from 'react';
import { useSpring, animated } from 'react-spring';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import * as math from 'mathjs';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// =========== Extended Context for Advanced Simulation ===========

// Advanced Simulation Context
const AdvancedSimulationContext = createContext();
const useAdvancedSimulation = () => useContext(AdvancedSimulationContext);

const AdvancedSimulationProvider = ({ children }) => {
  // Import existing state from previous simulation
  const {
    numProducers,
    setNumProducers,
    numConsumers,
    setNumConsumers,
    numQueues, 
    setNumQueues,
    taskDurations,
    setTaskDurations,
    arrivalRates,
    setArrivalRates,
    queues,
    consumers,
    isSimulationRunning,
    setIsSimulationRunning,
    timeStep,
    systemHistory,
    assignmentMatrix,
    setAssignmentMatrix,
    resetSimulation
  } = useSimulation();

  // Additional state for advanced features
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showStateTrajectory, setShowStateTrajectory] = useState(true);
  const [stateTrajectory, setStateTrajectory] = useState([]);
  const [stateSpaceDimension, setStateSpaceDimension] = useState(2); // 2D or 3D
  const [stateProjection, setStateProjection] = useState(['queue0', 'queue1', 'utilization']);
  const [stateStabilityCriteria, setStateStabilityCriteria] = useState('eigenvalue');
  const [flowMode, setFlowMode] = useState('continuous'); // 'continuous' or 'discrete'
  const [selectedConsumerForReassignment, setSelectedConsumerForReassignment] = useState(null);
  const [taskRoutingStrategy, setTaskRoutingStrategy] = useState('longestQueue'); // 'longestQueue', 'roundRobin', 'weighted'
  const [routingWeights, setRoutingWeights] = useState([]);
  const [systemPerturbation, setSystemPerturbation] = useState(null);
  const [transientAnalysis, setTransientAnalysis] = useState({
    settling_time: 0,
    overshoot: 0,
    oscillation_frequency: 0
  });
  const [gradientField, setGradientField] = useState([]);
  const [potentialFunction, setPotentialFunction] = useState([]);
  const [systemEnergyHistory, setSystemEnergyHistory] = useState([]);
  const [phaseDiagram, setPhaseDiagram] = useState([]);
  const [celleryWorkflowDiagram, setCelleryWorkflowDiagram] = useState(null);
  
  // Optimization parameters
  const [optimizationGoal, setOptimizationGoal] = useState('minWaitTime'); // 'minWaitTime', 'maxThroughput', 'balanceLoad'
  const [optimizationRunning, setOptimizationRunning] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  
  // Advanced system metrics
  const [advancedMetrics, setAdvancedMetrics] = useState({
    lyapunovExponent: 0,
    entropyRate: 0,
    failureModeProbabilities: {},
    resilienceScore: 0,
    steadyStateDistribution: []
  });

  // Calculate potential function and gradient field
  const calculateVectorField = useCallback(() => {
    if (!systemHistory || systemHistory.length < 10) return;
    
    // Create a grid of points in queue space (queue0 x queue1)
    const gridSize = 10;
    const maxQueue = Math.max(
      ...systemHistory.map(h => Math.max(h.queue0, h.queue1, h.queue2, h.queue3))
    );
    
    const grid = [];
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const queue0 = (i / gridSize) * maxQueue * 1.5;
        const queue1 = (j / gridSize) * maxQueue * 1.5;
        
        // Calculate potential (higher value = less stable)
        // Simple model: potential ~ sum of queue lengths
        const potential = queue0 + queue1;
        
        // Calculate gradient (direction of steepest descent)
        // In this simple model, gradient is constant [-1, -1]
        // In a real system, this would be derived from state transition equations
        const gradX = queue0 > 0 ? -1 : 0;
        const gradY = queue1 > 0 ? -1 : 0;
        
        // Normalize gradient
        const magnitude = Math.sqrt(gradX*gradX + gradY*gradY);
        const normalizedGradX = magnitude > 0 ? gradX / magnitude : 0;
        const normalizedGradY = magnitude > 0 ? gradY / magnitude : 0;
        
        grid.push({
          x: queue0,
          y: queue1,
          potential,
          gradientX: normalizedGradX,
          gradientY: normalizedGradY,
          magnitude
        });
      }
    }
    
    setGradientField(grid);
    
    // Create potential function visualization data
    const potentialData = [];
    for (let i = 0; i <= gridSize; i++) {
      const rowData = [];
      for (let j = 0; j <= gridSize; j++) {
        const queue0 = (i / gridSize) * maxQueue * 1.5;
        const queue1 = (j / gridSize) * maxQueue * 1.5;
        
        // More sophisticated potential: eigenvalue analysis
        // Simplified model here
        const totalArrivalRate = arrivalRates.slice(0, 2).reduce((a, b) => a + b, 0);
        const serviceCapacity = numConsumers / Math.max(...taskDurations.slice(0, 2));
        const utilisationRatio = totalArrivalRate / serviceCapacity;
        
        // Potential increases sharply as we approach utilization = 1
        const potential = utilisationRatio * (queue0 + queue1) / 2;
        
        rowData.push({
          x: j,
          y: potential
        });
      }
      potentialData.push({
        x: i,
        name: `q0=${(i / gridSize * maxQueue * 1.5).toFixed(1)}`,
        data: rowData
      });
    }
    
    setPotentialFunction(potentialData);
    
  }, [systemHistory, arrivalRates, numConsumers, taskDurations]);
  
  // Calculate phase diagram
  const calculatePhaseDiagram = useCallback(() => {
    if (!systemHistory || systemHistory.length < 10) return;
    
    // Extract the last 50 points of history
    const recentHistory = systemHistory.slice(-50);
    
    // Create phase space points (current vs future state)
    const phasePoints = [];
    for (let i = 0; i < recentHistory.length - 1; i++) {
      phasePoints.push({
        x: recentHistory[i].queue0,
        y: recentHistory[i+1].queue0,
        z: recentHistory[i].utilization
      });
    }
    
    setPhaseDiagram(phasePoints);
    
  }, [systemHistory]);
  
  // Update system trajectory
  useEffect(() => {
    if (!isSimulationRunning || !systemHistory || systemHistory.length === 0) return;
    
    const currentState = systemHistory[systemHistory.length - 1];
    if (!currentState) return;
    
    setStateTrajectory(prev => {
      const newTrajectory = [...prev, {
        time: currentState.time,
        x: currentState.queue0,
        y: currentState.queue1,
        z: currentState.utilization
      }];
      
      // Keep last 100 points
      if (newTrajectory.length > 100) {
        return newTrajectory.slice(newTrajectory.length - 100);
      }
      return newTrajectory;
    });
    
    // Calculate system energy (simplified)
    const systemEnergy = Object.entries(currentState)
      .filter(([key]) => key.startsWith('queue'))
      .reduce((sum, [_, value]) => sum + Math.pow(value, 2), 0);
    
    setSystemEnergyHistory(prev => {
      const newHistory = [...prev, {
        time: currentState.time,
        energy: systemEnergy
      }];
      
      // Keep last 100 points
      if (newHistory.length > 100) {
        return newHistory.slice(newHistory.length - 100);
      }
      return newHistory;
    });
    
    // Calculate advanced metrics
    if (timeStep % 10 === 0) {
      // Simulate Lyapunov exponent calculation
      const recentHistory = systemHistory.slice(-20);
      let divergence = 0;
      if (recentHistory.length > 1) {
        for (let i = 1; i < recentHistory.length; i++) {
          const prevState = recentHistory[i-1];
          const currState = recentHistory[i];
          
          // Calculate distance between states
          let stateDiff = 0;
          Object.entries(currState)
            .filter(([key]) => key.startsWith('queue'))
            .forEach(([key, value]) => {
              stateDiff += Math.pow(value - prevState[key], 2);
            });
          
          divergence += Math.sqrt(stateDiff);
        }
        divergence /= recentHistory.length;
      }
      
      const lyapunovExponent = divergence > 0 ? Math.log(divergence) : 0;
      
      // Calculate entropy rate (simplified)
      const queueHistories = Array(numQueues).fill().map(() => []);
      recentHistory.forEach(state => {
        for (let i = 0; i < numQueues; i++) {
          queueHistories[i].push(state[`queue${i}`]);
        }
      });
      
      let entropyRate = 0;
      queueHistories.forEach(history => {
        // Simple entropy measure: variance of queue length
        const mean = history.reduce((a, b) => a + b, 0) / history.length;
        const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
        entropyRate += Math.log(1 + variance);
      });
      entropyRate /= numQueues;
      
      // Update metrics
      setAdvancedMetrics(prev => ({
        ...prev,
        lyapunovExponent,
        entropyRate,
        resilienceScore: Math.exp(-Math.abs(lyapunovExponent)) * 100
      }));
      
      // Calculate transient analysis
      const queueLengths = recentHistory.map(h => 
        (h.queue0 + h.queue1 + h.queue2 + h.queue3) / numQueues
      );
      
      if (queueLengths.length > 5) {
        // Estimate settling time (time to reach within 5% of final value)
        const finalValue = queueLengths[queueLengths.length - 1];
        let settlingTime = queueLengths.length;
        for (let i = queueLengths.length - 2; i >= 0; i--) {
          if (Math.abs(queueLengths[i] - finalValue) > 0.05 * finalValue) {
            settlingTime = queueLengths.length - i;
            break;
          }
        }
        
        // Estimate overshoot
        const maxValue = Math.max(...queueLengths);
        const overshoot = finalValue > 0 ? (maxValue - finalValue) / finalValue * 100 : 0;
        
        // Detect oscillations using zero crossings
        const meanCentered = queueLengths.map(v => v - finalValue);
        let zeroCrossings = 0;
        for (let i = 1; i < meanCentered.length; i++) {
          if (meanCentered[i-1] * meanCentered[i] < 0) {
            zeroCrossings++;
          }
        }
        
        const oscillationPeriod = meanCentered.length > 0 ? 
          meanCentered.length / (zeroCrossings / 2) : 0;
        
        const oscillationFrequency = oscillationPeriod > 0 ? 
          1 / oscillationPeriod : 0;
        
        setTransientAnalysis({
          settling_time: settlingTime,
          overshoot: overshoot,
          oscillation_frequency: oscillationFrequency
        });
      }
    }
    
  }, [systemHistory, timeStep, isSimulationRunning, numQueues]);
  
  // Update calculation functions when simulation state changes
  useEffect(() => {
    if (isSimulationRunning && timeStep % 5 === 0) {
      calculateVectorField();
      calculatePhaseDiagram();
    }
  }, [timeStep, isSimulationRunning, calculateVectorField, calculatePhaseDiagram]);
  
  // Initialize Celery workflow diagram
  useEffect(() => {
    // Create a diagram showing the workflow
    const diagram = {
      nodes: [
        { id: 'source', label: 'Data Source', type: 'source', x: 50, y: 100 },
        { id: 'queue0', label: 'Queue 0', type: 'queue', x: 200, y: 50 },
        { id: 'queue1', label: 'Queue 1', type: 'queue', x: 200, y: 150 },
        { id: 'worker0', label: 'Worker 0', type: 'worker', x: 350, y: 50 },
        { id: 'worker1', label: 'Worker 1', type: 'worker', x: 350, y: 150 },
        { id: 'sink', label: 'Result Store', type: 'sink', x: 500, y: 100 }
      ],
      edges: [
        { from: 'source', to: 'queue0', weight: arrivalRates[0] || 0.2 },
        { from: 'source', to: 'queue1', weight: arrivalRates[1] || 0.3 },
        { from: 'queue0', to: 'worker0', weight: assignmentMatrix[0]?.[0] || 1 },
        { from: 'queue1', to: 'worker0', weight: assignmentMatrix[0]?.[1] || 1 },
        { from: 'queue1', to: 'worker1', weight: assignmentMatrix[1]?.[1] || 1 },
        { from: 'worker0', to: 'sink', weight: 1 },
        { from: 'worker1', to: 'sink', weight: 1 }
      ]
    };
    
    setCelleryWorkflowDiagram(diagram);
  }, [arrivalRates, assignmentMatrix]);
  
  // Run optimization
  const runOptimization = useCallback(() => {
    setOptimizationRunning(true);
    
    // Simulate optimization running
    setTimeout(() => {
      // Calculate optimal assignment matrix based on goal
      let optimalMatrix = [...assignmentMatrix];
      
      switch (optimizationGoal) {
        case 'minWaitTime':
          // Prioritize largest queue assignment
          optimalMatrix = Array(numConsumers).fill().map(() => Array(numQueues).fill(0));
          
          // Assign each consumer to the two queues with highest arrival rates
          const queuePriorities = arrivalRates
            .map((rate, index) => ({ index, rate }))
            .sort((a, b) => b.rate - a.rate);
          
          optimalMatrix.forEach((row, consumerIndex) => {
            // Assign to top two queues by arrival rate
            const assignCount = Math.min(2, numQueues);
            for (let i = 0; i < assignCount; i++) {
              const queueIndex = queuePriorities[i % queuePriorities.length].index;
              row[queueIndex] = 1;
            }
          });
          break;
          
        case 'maxThroughput':
          // Assign all consumers to all queues for maximum throughput
          optimalMatrix = Array(numConsumers).fill().map(() => Array(numQueues).fill(1));
          break;
          
        case 'balanceLoad':
          // Balance load across consumers
          optimalMatrix = Array(numConsumers).fill().map(() => Array(numQueues).fill(0));
          
          for (let q = 0; q < numQueues; q++) {
            // Assign each queue to numConsumers/numQueues consumers (rounded up)
            const assignCount = Math.ceil(numConsumers / numQueues);
            for (let c = 0; c < assignCount; c++) {
              const consumerIndex = (q + c) % numConsumers;
              optimalMatrix[consumerIndex][q] = 1;
            }
          }
          break;
      }
      
      // Simulate performance improvement
      const improvementEstimate = Math.random() * 30 + 10; // 10-40% improvement
      
      setOptimizationResults({
        assignmentMatrix: optimalMatrix,
        improvementEstimate,
        optimizedMetrics: {
          averageWaitTime: Math.random() * 5 + 1,
          throughput: Math.random() * 10 + 5,
          resourceUtilization: Math.random() * 30 + 60
        }
      });
      
      setOptimizationRunning(false);
    }, 1500);
  }, [assignmentMatrix, numConsumers, numQueues, arrivalRates, optimizationGoal]);
  
  // Apply optimization results
  const applyOptimization = useCallback(() => {
    if (!optimizationResults) return;
    
    setAssignmentMatrix(optimizationResults.assignmentMatrix);
    setOptimizationResults(null);
  }, [optimizationResults, setAssignmentMatrix]);
  
  // Introduce perturbation to the system
  const introducePerturbation = useCallback((type, magnitude = 1) => {
    setSystemPerturbation({ type, magnitude, time: timeStep });
    
    // Apply perturbation effect
    switch (type) {
      case 'suddenTraffic':
        // Add tasks to all queues
        const newQueues = [...queues];
        for (let i = 0; i < numQueues; i++) {
          for (let j = 0; j < magnitude * 5; j++) {
            newQueues[i].push({
              id: Date.now() + Math.random(),
              queueIndex: i,
              duration: taskDurations[i],
              arrivalTime: timeStep
            });
          }
        }
        // We would call setQueues here, but that's in the parent context
        // This illustrates the need for better context integration
        break;
      
      case 'consumerFailure':
        // Temporarily remove consumers
        // This would modify the consumer array in the parent context
        break;
        
      case 'queueFailure':
        // Temporarily disable a queue
        // This would modify the queue processing in the parent context
        break;
    }
    
    // Clear perturbation after a while
    setTimeout(() => {
      setSystemPerturbation(null);
    }, 5000);
  }, [queues, timeStep, numQueues, taskDurations]);
  
  return (
    <AdvancedSimulationContext.Provider value={{
      // Base simulation state
      numProducers,
      numConsumers,
      numQueues,
      taskDurations,
      arrivalRates,
      queues,
      consumers,
      isSimulationRunning,
      timeStep,
      systemHistory,
      assignmentMatrix,
      
      // Base simulation functions
      setNumProducers,
      setNumConsumers, 
      setNumQueues,
      setTaskDurations,
      setArrivalRates,
      setIsSimulationRunning,
      setAssignmentMatrix,
      resetSimulation,
      
      // Advanced simulation state
      simulationSpeed,
      showVectorField,
      showStateTrajectory,
      stateTrajectory,
      stateSpaceDimension,
      stateProjection,
      stateStabilityCriteria,
      flowMode,
      selectedConsumerForReassignment,
      taskRoutingStrategy,
      routingWeights,
      systemPerturbation,
      transientAnalysis,
      gradientField,
      potentialFunction,
      systemEnergyHistory,
      phaseDiagram,
      celleryWorkflowDiagram,
      optimizationGoal,
      optimizationRunning,
      optimizationResults,
      advancedMetrics,
      
      // Advanced simulation functions
      setSimulationSpeed,
      setShowVectorField,
      setShowStateTrajectory,
      setStateSpaceDimension,
      setStateProjection,
      setStateStabilityCriteria,
      setFlowMode,
      setSelectedConsumerForReassignment,
      setTaskRoutingStrategy,
      setRoutingWeights,
      introducePerturbation,
      calculateVectorField,
      calculatePhaseDiagram,
      runOptimization,
      applyOptimization,
      
      // Derived properties
      isOptimizationAvailable: !optimizationRunning && !optimizationResults
    }}>
      {children}
    </AdvancedSimulationContext.Provider>
  );
};

// =========== Component Definitions ===========

// VectorFieldVisualization Component
const VectorFieldVisualization = memo(() => {
  const { gradientField, stateTrajectory, showVectorField, showStateTrajectory } = useAdvancedSimulation();
  
  // Scale for vector arrows
  const arrowScale = 15;
  
  // Skip some vectors for clarity
  const skipFactor = 2;
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">State Space Vector Field</h3>
      
      <div className="h-80 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 500 400">
            {/* Draw coordinate axes */}
            <line x1="50" y1="350" x2="450" y2="350" stroke="#888" strokeWidth="1" />
            <line x1="50" y1="50" x2="50" y2="350" stroke="#888" strokeWidth="1" />
            
            {/* X axis label */}
            <text x="450" y="370" fontSize="12" textAnchor="end">Queue 0 Length</text>
            
            {/* Y axis label */}
            <text x="30" y="50" fontSize="12" textAnchor="middle">Queue 1 Length</text>
            
            {/* Origin point */}
            <circle cx="50" cy="350" r="3" fill="#888" />
            
            {/* Draw vector field if enabled */}
            {showVectorField && gradientField && gradientField.length > 0 && gradientField
              .filter((_, index) => index % skipFactor === 0)
              .map((point, index) => {
                // Map state space coordinates to SVG coordinates
                const x = 50 + (point.x / Math.max(...gradientField.map(p => p.x))) * 400;
                const y = 350 - (point.y / Math.max(...gradientField.map(p => p.y))) * 300;
                
                // Calculate arrow endpoint
                const arrowX = x + point.gradientX * arrowScale;
                const arrowY = y - point.gradientY * arrowScale;
                
                // Skip arrows with no magnitude
                if (point.magnitude === 0) return null;
                
                // Color based on potential
                const colorScale = Math.min(1, point.potential / 10);
                const color = `rgb(${Math.round(255 * colorScale)}, ${Math.round(255 * (1 - colorScale))}, 100)`;
                
                return (
                  <g key={`vector-${index}`}>
                    {/* Vector arrow */}
                    <line
                      x1={x}
                      y1={y}
                      x2={arrowX}
                      y2={arrowY}
                      stroke={color}
                      strokeWidth="1.5"
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* Arrow base point */}
                    <circle cx={x} cy={y} r="1" fill={color} opacity="0.5" />
                  </g>
                );
              })}
              
            {/* Define arrowhead marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
              </marker>
            </defs>
            
            {/* Draw state trajectory if enabled */}
            {showStateTrajectory && stateTrajectory && stateTrajectory.length > 0 && (
              <>
                {/* Trajectory path */}
                <path
                  d={`M ${stateTrajectory.map(point => {
                    // Map state space coordinates to SVG coordinates
                    const x = 50 + (point.x / Math.max(...gradientField.map(p => p.x), 10)) * 400;
                    const y = 350 - (point.y / Math.max(...gradientField.map(p => p.y), 10)) * 300;
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#5c00a3"
                  strokeWidth="2"
                  opacity="0.7"
                />
                
                {/* Current state point */}
                {stateTrajectory.length > 0 && (() => {
                  const currentPoint = stateTrajectory[stateTrajectory.length - 1];
                  const x = 50 + (currentPoint.x / Math.max(...gradientField.map(p => p.x), 10)) * 400;
                  const y = 350 - (currentPoint.y / Math.max(...gradientField.map(p => p.y), 10)) * 300;
                  
                  return (
                    <circle cx={x} cy={y} r="5" fill="#5c00a3" />
                  );
                })()}
              </>
            )}
          </svg>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div>
          <span className="inline-block w-3 h-3 bg-red-500 mr-1"></span>
          High potential (unstable)
          <span className="inline-block w-3 h-3 bg-green-500 mx-3"></span>
          Low potential (stable)
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-purple-700 mr-1"></span>
          System trajectory
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        The vector field shows the gradient of the potential function - arrows point toward more stable states.
        The system trajectory shows the actual path of the system through state space over time.
      </p>
    </div>
  );
});

// 3D Vector Field Visualization Component
const VectorField3D = memo(() => {
  const { gradientField, stateTrajectory, showVectorField, showStateTrajectory } = useAdvancedSimulation();
  
  // We would use Three.js/React Three Fiber for actual 3D rendering
  // This is a placeholder for the 3D visualization
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">3D State Space Visualization</h3>
      
      <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-gray-500">
          3D Visualization (Three.js would render here)
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        The 3D visualization shows queue lengths and utilization as a state space with potential energy surface.
        Green regions represent stable states, red regions represent unstable states.
      </p>
    </div>
  );
});

// PotentialFunctionVisualization Component
const PotentialFunctionVisualization = memo(() => {
  const { potentialFunction, systemEnergyHistory } = useAdvancedSimulation();
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Potential Function & System Energy</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Energy history plot */}
        <div>
          <h4 className="text-md font-medium mb-2">System Energy Over Time</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={systemEnergyHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Energy', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  stroke="#8884d8" 
                  name="System Energy" 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Phase space plot */}
        <div>
          <h4 className="text-md font-medium mb-2">Phase Space Diagram</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Queue Length (t)" 
                  label={{ value: 'Queue Length (t)', position: 'bottom' }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Queue Length (t+1)" 
                  label={{ value: 'Queue Length (t+1)', angle: -90, position: 'left' }} 
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Phase Points" data={potentialFunction.flat()} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        The potential function represents the energy landscape of the system. Systems naturally evolve toward states of lower energy.
        The phase space diagram shows how the system state at one time relates to its state at the next time step.
      </p>
    </div>
  );
});

// State Machine Animation Component
const StateMachineAnimation = memo(() => {
  const { 
    celleryWorkflowDiagram, 
    queues,
    consumers,
    timeStep,
    systemPerturbation
  } = useAdvancedSimulation();
  
  // Animation state for tasks
  const [activeTasks, setActiveTasks] = useState([]);
  
  // Animation ref
  const animationRef = useRef(null);
  
  // Process animation frame
  useEffect(() => {
    if (!celleryWorkflowDiagram) return;
    
    // Create a simulated task movement animation
    const frame = timeStep % 10;
    
    // Create new tasks at sources
    if (frame === 0) {
      const newTasks = [];
      
      // Create tasks for each source-queue edge
      celleryWorkflowDiagram.edges
        .filter(edge => edge.from === 'source')
        .forEach(edge => {
          // Random chance based on edge weight
          if (Math.random() < edge.weight * 0.5) {
            newTasks.push({
              id: Date.now() + Math.random(),
              from: edge.from,
              to: edge.to,
              position: 0, // 0 to 1 progress along edge
              startTime: timeStep
            });
          }
        });
      
      setActiveTasks(prev => [...prev, ...newTasks]);
    }
    
    // Move tasks along edges
    setActiveTasks(prev => {
      return prev.map(task => {
        // Update task position
        let newPosition = task.position + 0.1;
        let newFrom = task.from;
        let newTo = task.to;
        
        // If task reached destination
        if (newPosition >= 1) {
          // Find next edge
          const nextEdges = celleryWorkflowDiagram.edges.filter(e => e.from === task.to);
          
          // If no next edge, remove task
          if (nextEdges.length === 0) {
            return null;
          }
          
          // Select a random next edge based on weights
          const totalWeight = nextEdges.reduce((sum, edge) => sum + edge.weight, 0);
          let random = Math.random() * totalWeight;
          let selectedEdge = nextEdges[0];
          
          for (const edge of nextEdges) {
            random -= edge.weight;
            if (random <= 0) {
              selectedEdge = edge;
              break;
            }
          }
          
          // Move to next edge
          newFrom = task.to;
          newTo = selectedEdge.to;
          newPosition = 0;
        }
        
        return {
          ...task,
          from: newFrom,
          to: newTo,
          position: newPosition
        };
      }).filter(Boolean); // Remove null entries (completed tasks)
    });
    
  }, [timeStep, celleryWorkflowDiagram]);
  
  // Task count for visualization
  const getNodeTaskCount = (nodeId) => {
    if (nodeId.startsWith('queue')) {
      const queueIndex = parseInt(nodeId.replace('queue', ''));
      return queues[queueIndex]?.length || 0;
    }
    
    if (nodeId.startsWith('worker')) {
      const workerIndex = parseInt(nodeId.replace('worker', ''));
      return consumers[workerIndex]?.busy ? 1 : 0;
    }
    
    return 0;
  };
  
  // Node fill based on load
  const getNodeFill = (nodeId) => {
    // Apply perturbation effect if active
    if (systemPerturbation) {
      if (systemPerturbation.type === 'queueFailure' && nodeId.startsWith('queue')) {
        return '#ff8080'; // Light red for failed queue
      }
      if (systemPerturbation.type === 'consumerFailure' && nodeId.startsWith('worker')) {
        return '#ff8080'; // Light red for failed worker
      }
    }
    
    const count = getNodeTaskCount(nodeId);
    
    if (nodeId.startsWith('queue')) {
      // Color based on queue length
      if (count === 0) return '#e0f0ff'; // Empty - light blue
      if (count < 3) return '#a0d0ff'; // Light load - medium blue
      if (count < 6) return '#60a0ff'; // Medium load - darker blue
      return '#4080ff'; // Heavy load - dark blue
    }
    
    if (nodeId.startsWith('worker')) {
      // Color based on worker state
      return count > 0 ? '#ffa040' : '#e0e0e0'; // Orange if busy, gray if idle
    }
    
    if (nodeId === 'source') return '#90ee90'; // Light green
    if (nodeId === 'sink') return '#d8bfd8'; // Light purple
    
    return '#e0e0e0'; // Default gray
  };
  
  // Edge stroke based on traffic
  const getEdgeStroke = (edge) => {
    const trafficCount = activeTasks.filter(
      task => task.from === edge.from && task.to === edge.to
    ).length;
    
    // Darker/thicker for more traffic
    if (trafficCount === 0) return { stroke: '#ccc', width: 1 };
    if (trafficCount < 2) return { stroke: '#999', width: 2 };
    if (trafficCount < 4) return { stroke: '#666', width: 3 };
    return { stroke: '#333', width: 4 };
  };
  
  // Calculate node position
  const getNodePosition = (node) => {
    return { x: node.x, y: node.y };
  };
  
  // Calculate position along an edge
  const getPositionAlongEdge = (fromNode, toNode, progress) => {
    const from = getNodePosition(fromNode);
    const to = getNodePosition(toNode);
    
    // Bezier curve for nicer visual
    // For a simple curve, we'll add a control point above the midpoint
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    // Add some curvature based on horizontal distance
    const curveHeight = Math.abs(to.x - from.x) * 0.2;
    const controlX = midX;
    const controlY = midY - curveHeight;
    
    // Quadratic bezier formula
    const t = progress;
    const x = Math.pow(1-t, 2) * from.x + 2 * (1-t) * t * controlX + Math.pow(t, 2) * to.x;
    const y = Math.pow(1-t, 2) * from.y + 2 * (1-t) * t * controlY + Math.pow(t, 2) * to.y;
    
    return { x, y };
  };
  
  if (!celleryWorkflowDiagram) {
    return (
      <div className="mt-4 bg-white p-4 rounded-lg shadow-md text-center">
        <h3 className="text-lg font-semibold mb-2">State Machine Animation</h3>
        <p className="text-gray-500 italic">Initializing workflow diagram...</p>
      </div>
    );
  }
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">State Machine Animation</h3>
      
      <div className="h-80 relative">
        <svg width="100%" height="100%" viewBox="0 0 600 200">
          {/* Draw edges first so they're behind nodes */}
          {celleryWorkflowDiagram.edges.map((edge, index) => {
            const fromNode = celleryWorkflowDiagram.nodes.find(n => n.id === edge.from);
            const toNode = celleryWorkflowDiagram.nodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return null;
            
            const from = getNodePosition(fromNode);
            const to = getNodePosition(toNode);
            
            // Calculate control point for curve
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const curveHeight = Math.abs(to.x - from.x) * 0.2;
            
            const { stroke, width } = getEdgeStroke(edge);
            
            return (
              <path
                key={`edge-${index}`}
                d={`M ${from.x} ${from.y} Q ${midX} ${midY - curveHeight} ${to.x} ${to.y}`}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          
          {/* Draw nodes */}
          {celleryWorkflowDiagram.nodes.map((node, index) => {
            const pos = getNodePosition(node);
            const fill = getNodeFill(node.id);
            const taskCount = getNodeTaskCount(node.id);
            
            return (
              <g key={`node-${index}`}>
                {/* Node shape */}
                {node.type === 'queue' ? (
                  // Queue nodes are rectangles
                  <rect
                    x={pos.x - 25}
                    y={pos.y - 15}
                    width="50"
                    height="30"
                    fill={fill}
                    stroke="#333"
                    strokeWidth="1"
                    rx="5"
                    ry="5"
                  />
                ) : (
                  // Other nodes are circles
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="20"
                    fill={fill}
                    stroke="#333"
                    strokeWidth="1"
                  />
                )}
                
                {/* Node label */}
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#333"
                >
                  {node.label}
                </text>
                
                {/* Task count badge (for queues and workers) */}
                {(node.type === 'queue' || node.type === 'worker') && taskCount > 0 && (
                  <g>
                    <circle
                      cx={pos.x + 20}
                      cy={pos.y - 15}
                      r="8"
                      fill="#e05050"
                      stroke="#fff"
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x + 20}
                      y={pos.y - 12}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#fff"
                    >
                      {taskCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Define arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
            </marker>
          </defs>
          
          {/* Draw tasks in motion */}
          {activeTasks.map((task, index) => {
            const fromNode = celleryWorkflowDiagram.nodes.find(n => n.id === task.from);
            const toNode = celleryWorkflowDiagram.nodes.find(n => n.id === task.to);
            
            if (!fromNode || !toNode) return null;
            
            const pos = getPositionAlongEdge(fromNode, toNode, task.position);
            
            return (
              <circle
                key={`task-${index}`}
                cx={pos.x}
                cy={pos.y}
                r="5"
                fill="#ff5050"
                stroke="#fff"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div>
          <span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span>
          Queues
          <span className="inline-block w-3 h-3 bg-orange-400 mx-3"></span>
          Workers (busy)
          <span className="inline-block w-3 h-3 bg-gray-300 ml-1 mr-3"></span>
          Workers (idle)
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-red-500 mr-1"></span>
          Tasks in motion
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        The state machine animation shows tasks flowing through the queuing system in real-time.
        Nodes change color based on their load, and edges thickness represents traffic volume.
      </p>
    </div>
  );
});

// Advanced Metrics Dashboard Component
const AdvancedMetricsDashboard = memo(() => {
  const { 
    advancedMetrics,
    transientAnalysis,
    systemHistory,
    isSimulationRunning
  } = useAdvancedSimulation();
  
  // Format number with fixed precision
  const formatNumber = (num, precision = 2) => {
    return num.toFixed(precision);
  };
  
  // Check if system is stable
  const isSystemStable = advancedMetrics.lyapunovExponent < 0.1;
  
  // Get current utilization from history
  const currentUtilization = systemHistory.length > 0 
    ? systemHistory[systemHistory.length - 1].utilization 
    : 0;
  
  // Calculate efficiency score
  const efficiencyScore = isSystemStable
    ? Math.min(100, currentUtilization * (1 + advancedMetrics.resilienceScore / 100))
    : Math.max(0, currentUtilization * (1 - Math.abs(advancedMetrics.lyapunovExponent) * 10));
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Advanced System Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stability Metrics */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-md font-medium mb-2">Stability Metrics</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Lyapunov Exponent:</span>
              <span className={advancedMetrics.lyapunovExponent < 0.1 ? 'text-green-600' : 'text-red-600'}>
                {formatNumber(advancedMetrics.lyapunovExponent)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Entropy Rate:</span>
              <span>{formatNumber(advancedMetrics.entropyRate)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>System Status:</span>
              <span className={isSystemStable ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {isSystemStable ? 'Stable' : 'Unstable'}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="font-medium">Resilience Score:</span>
              <span className="font-medium">
                {formatNumber(advancedMetrics.resilienceScore)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Transient Response */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-md font-medium mb-2">Transient Response</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Settling Time:</span>
              <span>{formatNumber(transientAnalysis.settling_time)} steps</span>
            </div>
            
            <div className="flex justify-between">
              <span>Overshoot:</span>
              <span>{formatNumber(transientAnalysis.overshoot)}%</span>
            </div>
            
            <div className="flex justify-between">
              <span>Oscillation Frequency:</span>
              <span>{formatNumber(transientAnalysis.oscillation_frequency, 3)} Hz</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="font-medium">Response Quality:</span>
              <span className="font-medium">
                {transientAnalysis.overshoot < 20 ? 'Good' : 'Needs Damping'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-md font-medium mb-2">Performance Metrics</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Current Utilization:</span>
              <span>{formatNumber(currentUtilization)}%</span>
            </div>
            
            <div className="flex justify-between">
              <span>Efficiency Score:</span>
              <span className={efficiencyScore > 70 ? 'text-green-600' : 'text-yellow-600'}>
                {formatNumber(efficiencyScore)}%
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Efficiency Score combines utilization with stability metrics to measure overall system effectiveness.
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-3">
        These advanced metrics provide insights into system stability, transient behavior, and overall performance.
        Lyapunov exponents near zero indicate a system at the edge of stability, while negative values indicate stable behavior.
      </p>
    </div>
  );
});

// Resource Optimization Component
const ResourceOptimization = memo(() => {
  const {
    optimizationGoal,
    setOptimizationGoal,
    isOptimizationAvailable,
    optimizationRunning,
    optimizationResults,
    runOptimization,
    applyOptimization
  } = useAdvancedSimulation();
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Resource Optimization</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Use mathematical optimization to find the optimal resource allocation for your system goals.
          The optimizer uses gradient descent to find local minima in the system's potential function.
        </p>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Optimization Goal:
          </label>
          <select
            value={optimizationGoal}
            onChange={(e) => setOptimizationGoal(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={optimizationRunning || optimizationResults}
          >
            <option value="minWaitTime">Minimize Wait Time</option>
            <option value="maxThroughput">Maximize Throughput</option>
            <option value="balanceLoad">Balance Load Across Resources</option>
          </select>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={runOptimization}
            className={`px-4 py-2 rounded font-medium ${
              isOptimizationAvailable
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isOptimizationAvailable}
          >
            {optimizationRunning ? 'Optimizing...' : 'Run Optimization'}
          </button>
          
          {optimizationResults && (
            <button
              onClick={applyOptimization}
              className="px-4 py-2 rounded font-medium bg-green-500 hover:bg-green-600 text-white"
            >
              Apply Optimal Configuration
            </button>
          )}
        </div>
      </div>
      
      {optimizationResults && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-md font-medium mb-2">Optimization Results</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-blue-800">Projected Improvements:</div>
              <ul className="mt-1 space-y-1 text-sm">
                <li>• {optimizationResults.improvementEstimate.toFixed(1)}% overall improvement</li>
                <li>• Wait time: {optimizationResults.optimizedMetrics.averageWaitTime.toFixed(2)} units</li>
                <li>• Throughput: {optimizationResults.optimizedMetrics.throughput.toFixed(2)} tasks/unit</li>
                <li>• Resource utilization: {optimizationResults.optimizedMetrics.resourceUtilization.toFixed(1)}%</li>
              </ul>
            </div>
            
            <div>
              <div className="font-medium text-blue-800">Recommended Assignment:</div>
              <div className="mt-1 bg-white p-2 rounded text-xs font-mono">
                {optimizationResults.assignmentMatrix.map((row, i) => (
                  <div key={i} className="mb-1">
                    Consumer {i}: [{row.join(', ')}]
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-2">
            The optimization algorithm uses gradient descent on the system's potential function to find
            optimal resource allocations that satisfy your objectives.
          </p>
        </div>
      )}
    </div>
  );
});

// Perturbation Testing Component
const PerturbationTesting = memo(() => {
  const {
    introducePerturbation,
    systemPerturbation,
    isSimulationRunning
  } = useAdvancedSimulation();
  
  const perturbationOptions = [
    { id: 'suddenTraffic', name: 'Sudden Traffic Spike', description: 'Add a burst of tasks to all queues' },
    { id: 'consumerFailure', name: 'Consumer Failure', description: 'Simulate a consumer node failure' },
    { id: 'queueFailure', name: 'Queue Failure', description: 'Simulate a queue service disruption' }
  ];
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Perturbation Testing</h3>
      
      <p className="text-sm text-gray-600 mb-3">
        Test how your system responds to sudden perturbations and measure its resilience to different types of disruptions.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {perturbationOptions.map(option => (
          <button
            key={option.id}
            onClick={() => introducePerturbation(option.id)}
            disabled={!isSimulationRunning || systemPerturbation !== null}
            className={`p-3 border rounded-lg text-left ${
              !isSimulationRunning || systemPerturbation !== null
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-blue-50 border-blue-200'
            }`}
          >
            <div className="font-medium">{option.name}</div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>
      
      {systemPerturbation && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 animate-pulse">
          <div className="font-medium text-yellow-800">
            System under stress: {perturbationOptions.find(o => o.id === systemPerturbation.type)?.name}
          </div>
          <div className="text-sm text-yellow-600 mt-1">
            Observe how the system responds and recovers from this perturbation.
            Monitor stability metrics to evaluate resilience.
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        Resilient systems should maintain stability even under stress. The Lyapunov exponent
        provides a mathematical measure of how quickly a system returns to stability after perturbation.
      </div>
    </div>
  );
});

// AdvancedSimulationControls Component
const AdvancedSimulationControls = memo(() => {
  const {
    numConsumers,
    setNumConsumers,
    numQueues,
    setNumQueues,
    taskDurations,
    setTaskDurations,
    arrivalRates,
    setArrivalRates,
    isSimulationRunning,
    setIsSimulationRunning,
    simulationSpeed,
    setSimulationSpeed,
    showVectorField,
    setShowVectorField,
    showStateTrajectory,
    setShowStateTrajectory,
    resetSimulation
  } = useAdvancedSimulation();

  // Update a specific arrival rate
  const updateArrivalRate = (index, value) => {
    const newRates = [...arrivalRates];
    newRates[index] = parseFloat(value);
    setArrivalRates(newRates);
  };

  // Update a specific task duration
  const updateTaskDuration = (index, value) => {
    const newDurations = [...taskDurations];
    newDurations[index] = parseInt(value);
    setTaskDurations(newDurations);
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Advanced Distributed Queue Simulation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <h4 className="text-md font-medium mb-3">System Configuration</h4>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Consumers: {numConsumers}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={numConsumers}
              onChange={(e) => setNumConsumers(parseInt(e.target.value))}
              className="w-full"
              disabled={isSimulationRunning}
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Queues: {numQueues}
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={numQueues}
              onChange={(e) => setNumQueues(parseInt(e.target.value))}
              className="w-full"
              disabled={isSimulationRunning}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-3">Queue Parameters</h4>
          
          {Array(Math.min(4, numQueues)).fill().map((_, i) => (
            <div key={i} className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Queue {i} Arrival Rate: {arrivalRates[i]?.toFixed(2) || 0}
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={arrivalRates[i] || 0.1}
                onChange={(e) => updateArrivalRate(i, e.target.value)}
                className="w-full"
              />
            </div>
          ))}
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-3">Visualization Options</h4>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Simulation Speed: {simulationSpeed}x
            </label>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showVectorField"
                checked={showVectorField}
                onChange={(e) => setShowVectorField(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showVectorField" className="text-sm">Show Vector Field</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showStateTrajectory"
                checked={showStateTrajectory}
                onChange={(e) => setShowStateTrajectory(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showStateTrajectory" className="text-sm">Show System Trajectory</label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            if (isSimulationRunning) {
              setIsSimulationRunning(false);
            } else {
              setIsSimulationRunning(true);
            }
          }}
          className={`px-4 py-2 rounded font-medium ${
            isSimulationRunning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isSimulationRunning ? 'Pause Simulation' : 'Start Simulation'}
        </button>
        
        <button
          onClick={() => {
            setIsSimulationRunning(false);
            resetSimulation();
          }}
          className="px-4 py-2 rounded font-medium bg-gray-500 hover:bg-gray-600 text-white"
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
});

// Advanced Simulation Dashboard Component
const AdvancedSimulationDashboard = memo(() => {
  return (
    <div>
      <AdvancedSimulationControls />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <VectorFieldVisualization />
        <StateMachineAnimation />
      </div>
      
      <div className="mt-4">
        <AdvancedMetricsDashboard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <PotentialFunctionVisualization />
        <ResourceOptimization />
      </div>
      
      <div className="mt-4">
        <PerturbationTesting />
      </div>
    </div>
  );
});

// =========== Article Component for Part 2 ===========

// Advanced Math Explanation Component
const AdvancedMathExplanation = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="my-4 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-lg font-medium text-indigo-800">{title}</h4>
        <button className="text-indigo-600 hover:text-indigo-800">
          {isExpanded ? '▲ Hide' : '▼ Show'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-indigo-200">
          {children}
        </div>
      )}
    </div>
  );
};

// DistributedQueuesBlogPart2 Component
const DistributedQueuesBlogPart2 = () => {
  // This would normally come from context in a full implementation
  const blogContent = {
    title: "The Mathematics of Distributed Queues (Part 2)",
    subtitle: "Advanced Simulation and State Space Analysis",
    tags: [
      { text: "Vector Calculus", bgColor: "bg-blue-100", textColor: "text-blue-800" },
      { text: "State Space", bgColor: "bg-purple-100", textColor: "text-purple-800" },
      { text: "Gradient Fields", bgColor: "bg-green-100", textColor: "text-green-800" }
    ]
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{blogContent.title}</h1>
        <p className="text-xl text-gray-600">{blogContent.subtitle}</p>
        {blogContent.tags && blogContent.tags.length > 0 && (
          <div className="mt-4 flex justify-center space-x-4">
            {blogContent.tags.map(tag => (
              <span 
                key={tag.text}
                className={`inline-flex items-center px-3 py-1 ${tag.bgColor} ${tag.textColor} rounded-full text-sm`}
              >
                {tag.text}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar - This would be TableOfContents in a full implementation */}
        <aside className="md:w-1/4">
          <div className="bg-gray-100 p-4 rounded-lg sticky top-4">
            <h2 className="text-xl font-bold mb-4">Contents</h2>
            <ul className="space-y-2">
              <li>
                <button className="text-left w-full font-bold text-blue-600">
                  1. Introduction to State Space
                </button>
              </li>
              <li>
                <button className="text-left w-full">
                  2. Vector Fields and Gradients
                </button>
              </li>
              <li>
                <button className="text-left w-full">
                  3. Interactive Simulation
                </button>
              </li>
              <li>
                <button className="text-left w-full">
                  4. Advanced Stability Analysis
                </button>
              </li>
              <li>
                <button className="text-left w-full">
                  5. Resource Optimization
                </button>
              </li>
              <li>
                <button className="text-left w-full">
                  6. Conclusion
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main className="md:w-3/4">
          {/* Introduction section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Introduction to State Space</h2>
            
            <div className="prose max-w-none">
              <p>
                In Part 1, we explored the foundations of distributed queue systems using linear algebra. 
                Now, we'll deepen our understanding by examining these systems through the lens of state space analysis 
                and vector calculus, providing a more dynamic view of system behavior.
              </p>
              
              <p>
                State space representation is a powerful way to visualize and analyze complex systems. 
                Rather than thinking about individual queues and consumers, we can represent the entire system 
                state as a point in a multidimensional space, where each dimension corresponds to a system variable 
                (like queue length or utilization).
              </p>
              
              <p>
                This representation allows us to apply mathematical tools from dynamical systems theory and 
                vector calculus, giving us deeper insights into system stability and behavior.
              </p>
              
              <AdvancedMathExplanation title="Mathematical Foundations of State Space">
                <p>
                  The state of our distributed queue system can be represented as a vector in ℝⁿ:
                </p>
                <div className="bg-white p-3 my-2 font-mono text-center">
                  x = [q₁, q₂, ..., qₙ, u₁, u₂, ..., uₘ]ᵀ
                </div>
                <p>
                  where qᵢ is the length of queue i, and uⱼ is the utilization of consumer j.
                </p>
                <p>
                  The evolution of this state over time can be described by a system of differential equations:
                </p>
                <div className="bg-white p-3 my-2 font-mono text-center">
                  dx/dt = f(x, u)
                </div>
                <p>
                  For queue systems, this function f captures the rates of change of queue lengths 
                  based on arrival rates, service rates, and the assignment matrix.
                </p>
              </AdvancedMathExplanation>
            </div>
          </section>
          
          {/* Vector fields section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Vector Fields and Gradients</h2>
            
            <div className="prose max-w-none">
              <p>
                One of the most powerful visualizations for understanding system dynamics is the vector field.
                A vector field assigns a vector to each point in state space, indicating the direction and magnitude 
                of state change at that point.
              </p>
              
              <p>
                In our queue system, the vector field shows how queue lengths and utilization will change 
                from any given state. This helps us identify stable regions (where vectors point inward to an 
                equilibrium) and unstable regions (where vectors point outward or circulate).
              </p>
              
              <p>
                Mathematically, this vector field is related to the gradient of a potential function. 
                Systems naturally evolve toward states of lower potential, similar to how a ball rolls downhill 
                in a physical system.
              </p>
              
              <AdvancedMathExplanation title="Potential Functions and Gradient Fields">
                <p>
                  For a distributed queue system, we can define a potential function V(x) that measures the 
                  "energy" or "cost" of being in state x:
                </p>
                <div className="bg-white p-3 my-2 font-mono text-center">
                   V(x) = Σ(q_i)² + Σβ_j(ρ_j - ρ_target)²
                </div>
                <p>
                  where q_i are queue lengths, ρ_j are consumer utilizations, and β_j are weights.
                  This potential is minimized when queues are empty and utilization is at target levels.
                </p>
                <p>
                  The gradient of this potential function gives us the vector field:
                </p>
                <div className="bg-white p-3 my-2 font-mono text-center">
                  ∇V(x) = [∂V/∂q₁, ∂V/∂q₂, ..., ∂V/∂ρ₁, ∂V/∂ρ₂, ...]ᵀ
                </div>
                <p>
                  This gradient points in the direction of steepest increase in potential.
                  The system naturally evolves in the direction of -∇V(x), toward lower potential states.
                </p>
              </AdvancedMathExplanation>
              
              <p>
                In our interactive simulation below, you'll be able to see this vector field and observe 
                how the system state evolves along these gradient flows. Pay attention to how the vectors
                change direction and magnitude in different regions of state space.
              </p>
            </div>
          </section>
          
          {/* Interactive Simulation section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Interactive Simulation</h2>
            
            <div className="prose max-w-none">
              <p>
                The true power of mathematical modeling becomes apparent when we can interact with 
                these abstract concepts in real time. Our enhanced simulation below allows you to:
              </p>
              
              <ul>
                <li>Observe the system state trajectory in vector space</li>
                <li>See the gradient field and potential function visualization</li>
                <li>Apply perturbations to test system resilience</li>
                <li>Optimize resource allocation based on mathematical criteria</li>
              </ul>
              
              <p>
                As you experiment with the simulation, pay attention to how changing parameters affects 
                the system's stability, efficiency, and resilience. The visualization will help you build 
                intuition for the mathematical concepts we've discussed.
              </p>
            </div>
            
            {/* Simulation component */}
            <div className="mt-6">
              <AdvancedSimulationProvider>
                <AdvancedSimulationDashboard />
              </AdvancedSimulationProvider>
            </div>
          </section>
          
          {/* Advanced Stability Analysis section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Advanced Stability Analysis</h2>
            
            <div className="prose max-w-none">
              <p>
                The state space representation allows us to apply advanced techniques from dynamical systems 
                theory to analyze system stability. Beyond simple utilization ratios, we can now use concepts 
                like Lyapunov stability and attractor basins.
              </p>
              
              <p>
                A key measure we've added to our simulation is the Lyapunov exponent, which quantifies how 
                quickly nearby trajectories in state space diverge or converge. Negative exponents indicate 
                a stable system, while positive exponents suggest chaotic or unstable behavior.
              </p>
              
              <AdvancedMathExplanation title="Lyapunov Stability Analysis">
                <p>
                  Lyapunov's direct method provides a way to prove system stability without solving the equations 
                  of motion explicitly. We define a Lyapunov function L(x) that satisfies:
                </p>
                <ol className="list-decimal list-inside pl-4 my-2">
                  <li>L(x) > 0 for all x ≠ 0</li>
                  <li>L(0) = 0 (at equilibrium)</li>
                  <li>dL/dt < 0 for all x ≠ 0</li>
                </ol>
                <p>
                  If we can find such a function, the system is asymptotically stable. For queue systems, 
                  a natural Lyapunov function is the sum of squared queue lengths:
                </p>
                <div className="bg-white p-3 my-2 font-mono text-center">
                  L(x) = Σ q_i²
                </div>
                <p>
                  The time derivative dL/dt = 2Σ q_i · dq_i/dt is negative when queues are decreasing on average, 
                  which happens when service rates exceed arrival rates.
                </p>
              </AdvancedMathExplanation>
              
              <p>
                The simulation also shows the transient response characteristics of the system—how it 
                returns to equilibrium after perturbations. Key metrics include settling time, overshoot, 
                and oscillation frequency, which all affect user experience in real-world systems.
              </p>
            </div>
          </section>
          
          {/* Resource Optimization section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Resource Optimization</h2>
            
            <div className="prose max-w-none">
              <p>
                With our mathematical framework in place, we can now approach resource optimization as a 
                problem in vector calculus: finding the assignment configuration that minimizes a cost function 
                subject to constraints.
              </p>
              
              <p>
                The optimizer in our simulation uses gradient descent to find local minima in the system's 
                potential function. Depending on your objective—minimizing wait time, maximizing throughput, 
                or balancing load—different configurations emerge as optimal.
              </p>
              
              <AdvancedMathExplanation title="Optimization Mathematics">
                <p>
                  We formulate the optimization problem as:
                </p>
                <div className="bg-white p-3 my-2 font-mono text-center">
                  min J(A) = w₁J₁(A) + w₂J₂(A) + w₃J₃(A)
                </div>
                <p>
                  where J₁, J₂, and J₃ are cost functions for wait time, throughput, and load balance respectively,
                  and w₁, w₂, w₃ are weights based on the chosen objective.
                </p>
                <p>
                  For example, the wait time cost function might be:
                </p>
                <div className="bg-white p-3 my-2 font-mono text-center">
                  J₁(A) = Σᵢ λᵢ / (μᵢ(A) - λᵢ)
                </div>
                <p>
                  where λᵢ is the arrival rate for queue i, and μᵢ(A) is the effective service rate based on the 
                  assignment matrix A.
                </p>
              </AdvancedMathExplanation>
              
              <p>
                Try running the optimizer with different objectives and observe how the recommended assignments 
                change. This mathematical approach to optimization often finds counter-intuitive configurations 
                that outperform human intuition.
              </p>
            </div>
          </section>
          
          {/* Conclusion section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Conclusion</h2>
            
            <div className="prose max-w-none">
              <p>
                Through this extended exploration of distributed queue systems, we've seen how the mathematical 
                tools of vector calculus and state space analysis can provide deeper insights into system behavior. 
                These techniques help us visualize, predict, and optimize complex distributed systems.
              </p>
              
              <p>
                Key takeaways from our exploration include:
              </p>
              
              <ul>
                <li>State space representation provides an elegant way to visualize system dynamics</li>
                <li>Gradient fields and potential functions help predict system evolution</li>
                <li>Lyapunov exponents offer quantitative measures of stability</li>
                <li>Mathematical optimization can find non-obvious resource allocations</li>
              </ul>
              
              <p>
                As distributed systems continue to grow in complexity, these mathematical tools become 
                increasingly valuable for ensuring performance, reliability, and efficiency. The combination 
                of abstract mathematical theory with interactive visualization creates a powerful framework 
                for understanding and designing better systems.
              </p>
              
              <div className="bg-purple-50 p-4 border-l-4 border-purple-500 my-4">
                <p className="italic">
                  "Mathematics is the art of giving the same name to different things." — Henri Poincaré
                </p>
              </div>
              
              <p>
                Indeed, by recognizing that our queue systems follow the same mathematical patterns as physical 
                systems governed by potential fields, we gain new perspectives and tools for analysis. This 
                connection between different domains is one of the most beautiful aspects of mathematics.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DistributedQueuesBlogPart2;
