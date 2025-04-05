import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ReferenceLine
} from 'recharts';
import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ReferenceLine
} from 'recharts';

// Component registry for reusable UI elements
const UI = {
  Card: ({ children, className = "" }) => (
    <div className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm border ${className}`}>
      {children}
    </div>
  ),
  
  InfoBox: ({ title, children, type = "info" }) => {
    const colors = {
      info: "bg-blue-50 border-blue-200",
      success: "bg-green-50 border-green-200",
      warning: "bg-yellow-50 border-yellow-200",
      danger: "bg-red-50 border-red-200",
      purple: "bg-purple-50 border-purple-200"
    };
    
    return (
      <div className={`p-3 sm:p-4 rounded-lg ${colors[type]} border mb-4 text-left`}>
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {children}
      </div>
    );
  },
  
  Button: ({ children, onClick, disabled, variant = "primary", className = "" }) => {
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
      success: "bg-green-600 hover:bg-green-700 text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white"
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-2 rounded ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {children}
      </button>
    );
  },
  
  Slider: ({ label, value, onChange, min, max, step = 1 }) => (
    <div className="mb-4 text-left">
      <label className="block text-sm font-medium mb-1">
        {label}: <span className="font-semibold">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
};

// Tab registry
const TABS = [
  {
    id: "intro",
    title: "What is Monte Carlo?",
    description: "Understanding uncertainty through simulation"
  },
  {
    id: "singlePoint",
    title: "Single-Point Problems",
    description: "Why one estimate isn't enough"
  },
  {
    id: "threePoint",
    title: "Three-Point Estimation",
    description: "Capturing uncertainty in each task"
  },
  {
    id: "dependencies",
    title: "Project Network",
    description: "How tasks depend on each other"
  },
  {
    id: "simulation",
    title: "Running Simulations",
    description: "Testing many possible futures"
  },
  {
    id: "results",
    title: "Understanding Results",
    description: "From dates to probabilities"
  },
  {
    id: "scenarios",
    title: "What-If Scenarios",
    description: "Testing different approaches"
  }
];

// Example project data
const INITIAL_TASKS = [
  { 
    id: 1, 
    name: "Design Phase", 
    dependencies: [], 
    optimistic: 5, 
    mostLikely: 10, 
    pessimistic: 20 
  },
  { 
    id: 2, 
    name: "Development", 
    dependencies: [1], 
    optimistic: 10, 
    mostLikely: 15, 
    pessimistic: 25 
  },
  { 
    id: 3, 
    name: "Testing", 
    dependencies: [2], 
    optimistic: 3, 
    mostLikely: 5, 
    pessimistic: 10 
  }
];

// Scenarios
const SCENARIOS = {
  optimistic: {
    name: "Optimistic Scenario",
    description: "Reduce all task durations by 20%",
    bgColor: "bg-green-100 border-green-300",
    transform: tasks => tasks.map(task => ({
      ...task,
      optimistic: Math.max(1, task.optimistic * 0.8),
      mostLikely: Math.max(1, task.mostLikely * 0.8),
      pessimistic: Math.max(1, task.pessimistic * 0.8)
    }))
  },
  parallel: {
    name: "Parallel Tasks",
    description: "Run Design and Development in parallel",
    bgColor: "bg-blue-100 border-blue-300",
    transform: tasks => tasks.map(task => 
      task.id === 2 ? { ...task, dependencies: [] } : task
    )
  },
  resources: {
    name: "Add Resources",
    description: "Add resources to Development (40% faster)",
    bgColor: "bg-purple-100 border-purple-300",
    transform: tasks => tasks.map(task => 
      task.id === 2 ? {
        ...task,
        optimistic: Math.max(1, task.optimistic * 0.6),
        mostLikely: Math.max(1, task.mostLikely * 0.6),
        pessimistic: Math.max(1, task.pessimistic * 0.6)
      } : task
    )
  }
};

const MonteCarloTutorial = () => {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [simulationCount, setSimulationCount] = useState(100);
  const [simulationResults, setSimulationResults] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [singlePointEstimate, setSinglePointEstimate] = useState(30);
  const [selectedTask, setSelectedTask] = useState(0);
  const [selectedDistribution, setSelectedDistribution] = useState('triangular');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(80);
  const [whatIfScenario, setWhatIfScenario] = useState(null);
  const [histogramData, setHistogramData] = useState([]);
  
  // Refs for canvas drawing
  const distributionCanvasRef = useRef(null);
  const networkCanvasRef = useRef(null);
  
  // Calculate single point estimate for project
  const singlePointProject = tasks.reduce((sum, task) => sum + task.mostLikely, 0);

  // Draw distribution visualization
  useEffect(() => {
    if (activeTab === 2 && distributionCanvasRef.current) {
      const canvas = distributionCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (selectedTask === null || selectedTask >= tasks.length) return;
      
      const task = tasks[selectedTask];
      const { optimistic, mostLikely, pessimistic } = task;
      
      // Draw coordinate system
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, height - 30);
      ctx.lineTo(width - 10, height - 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, 10);
      ctx.lineTo(30, height - 30);
      ctx.stroke();
      
      // Calculate scale
      const minX = optimistic - 2;
      const maxX = pessimistic + 2;
      const xRange = maxX - minX;
      const xScale = (width - 50) / xRange;
      
      // Draw X-axis ticks and labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      for (let x = Math.ceil(minX); x <= maxX; x += Math.max(1, Math.round(xRange / 10))) {
        const xPos = 30 + (x - minX) * xScale;
        ctx.beginPath();
        ctx.moveTo(xPos, height - 30);
        ctx.lineTo(xPos, height - 25);
        ctx.stroke();
        ctx.fillText(x.toString(), xPos, height - 15);
      }
      ctx.fillText('Task Duration (Days)', width / 2, height - 5);
      
      // Draw distribution
      if (selectedDistribution === 'triangular') {
        const totalRange = pessimistic - optimistic;
        const peakHeight = 2 / totalRange;
        
        ctx.beginPath();
        ctx.moveTo(30 + (optimistic - minX) * xScale, height - 30);
        ctx.lineTo(30 + (mostLikely - minX) * xScale, height - 30 - (peakHeight * (height - 60)));
        ctx.lineTo(30 + (pessimistic - minX) * xScale, height - 30);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add annotations
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Optimistic', 30 + (optimistic - minX) * xScale, height - 40);
        ctx.fillText(`(${optimistic} days)`, 30 + (optimistic - minX) * xScale, height - 55);
        ctx.fillText('Most Likely', 30 + (mostLikely - minX) * xScale, height - 110);
        ctx.fillText(`(${mostLikely} days)`, 30 + (mostLikely - minX) * xScale, height - 125);
        ctx.fillText('Pessimistic', 30 + (pessimistic - minX) * xScale, height - 40);
        ctx.fillText(`(${pessimistic} days)`, 30 + (pessimistic - minX) * xScale, height - 55);
      } else {
        // PERT/Beta distribution approximation
        const mean = (optimistic + 4 * mostLikely + pessimistic) / 6;
        const stdDev = (pessimistic - optimistic) / 6;
        
        const normalDist = (x) => {
          return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                  Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        };
        
        let maxValue = 0;
        for (let x = minX; x <= maxX; x += 0.1) {
          maxValue = Math.max(maxValue, normalDist(x));
        }
        
        const yScale = (height - 60) / maxValue;
        
        ctx.beginPath();
        ctx.moveTo(30 + (minX - minX) * xScale, height - 30);
        
        for (let x = minX; x <= maxX; x += 0.1) {
          const y = normalDist(x) * yScale;
          ctx.lineTo(30 + (x - minX) * xScale, height - 30 - y);
        }
        
        ctx.lineTo(30 + (maxX - minX) * xScale, height - 30);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(255, 123, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 123, 0, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Mean', 30 + (mean - minX) * xScale, height - 90);
        ctx.fillText(`(${mean.toFixed(1)} days)`, 30 + (mean - minX) * xScale, height - 105);
        ctx.fillText('-1σ', 30 + (mean - stdDev - minX) * xScale, height - 50);
        ctx.fillText('+1σ', 30 + (mean + stdDev - minX) * xScale, height - 50);
      }
    }
  }, [activeTab, selectedTask, tasks, selectedDistribution]);
  
  // Draw project network
  useEffect(() => {
    if (activeTab === 3 && networkCanvasRef.current) {
      const canvas = networkCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Node positions
      const nodePositions = [
        { x: 100, y: height / 2 },
        { x: width / 2, y: height / 2 },
        { x: width - 100, y: height / 2 }
      ];
      
      // Draw nodes and connections
      tasks.forEach((task, index) => {
        const pos = nodePositions[index];
        
        // Draw connections from dependencies
        task.dependencies.forEach(depId => {
          const depIndex = tasks.findIndex(t => t.id === depId);
          const depPos = nodePositions[depIndex];
          
          // Draw arrow
          ctx.beginPath();
          ctx.moveTo(depPos.x + 40, depPos.y);
          ctx.lineTo(pos.x - 40, pos.y);
          
          // Arrow head
          const headLength = 15;
          const angle = Math.atan2(pos.y - depPos.y, pos.x - depPos.x);
          ctx.lineTo(pos.x - 40 - headLength * Math.cos(angle - Math.PI / 6), 
                    pos.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(pos.x - 40, pos.y);
          ctx.lineTo(pos.x - 40 - headLength * Math.cos(angle + Math.PI / 6), 
                    pos.y - headLength * Math.sin(angle + Math.PI / 6));
          
          ctx.strokeStyle = showCriticalPath ? '#ff5722' : '#666';
          ctx.lineWidth = showCriticalPath ? 3 : 2;
          ctx.stroke();
          
          // Duration label
          const labelX = (depPos.x + pos.x) / 2;
          const labelY = (depPos.y + pos.y) / 2 - 15;
          ctx.fillStyle = showCriticalPath ? '#ff5722' : '#333';
          ctx.textAlign = 'center';
          ctx.font = showCriticalPath ? 'bold 12px Arial' : '12px Arial';
          ctx.fillText(`${task.mostLikely} days`, labelX, labelY);
        });
        
        // Draw node
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 40, 0, 2 * Math.PI);
        ctx.fillStyle = showCriticalPath ? '#fff3e0' : '#e3f2fd';
        ctx.fill();
        ctx.strokeStyle = showCriticalPath ? '#ff5722' : '#2196f3';
        ctx.lineWidth = showCriticalPath ? 3 : 2;
        ctx.stroke();
        
        // Add task name and ID
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.font = showCriticalPath ? 'bold 14px Arial' : '14px Arial';
        ctx.fillText(task.name, pos.x, pos.y);
        ctx.font = showCriticalPath ? 'bold 12px Arial' : '12px Arial';
        ctx.fillText(`Task ${task.id}`, pos.x, pos.y + 20);
      });
      
      // Legend for critical path
      if (showCriticalPath) {
        ctx.fillStyle = '#ff5722';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Critical Path Highlighted', width / 2, 30);
      }
    }
  }, [activeTab, tasks, showCriticalPath]);
  
  // Monte Carlo simulation functions
  const genRandomDuration = (min, likely, max) => {
    const u = Math.random();
    const f = (likely - min) / (max - min);
    
    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (likely - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - likely));
    }
  };
  
  const calcEarliestStarts = (taskList, durations) => {
    const earliestStart = Array(taskList.length).fill(0);
    const calculated = new Set();
    let remaining = [...Array(taskList.length).keys()];
    
    while (remaining.length > 0) {
      // Find tasks with all dependencies calculated
      const tasksToCalc = remaining.filter(index => {
        const task = taskList[index];
        return task.dependencies.every(depId => 
          calculated.has(taskList.findIndex(t => t.id === depId))
        );
      });
      
      // Calculate earliest start times
      tasksToCalc.forEach(index => {
        const task = taskList[index];
        if (task.dependencies.length === 0) {
          earliestStart[index] = 0;
        } else {
          let maxEndTime = 0;
          task.dependencies.forEach(depId => {
            const depIndex = taskList.findIndex(t => t.id === depId);
            const endTime = earliestStart[depIndex] + durations[depIndex];
            maxEndTime = Math.max(maxEndTime, endTime);
          });
          earliestStart[index] = maxEndTime;
        }
        calculated.add(index);
      });
      
      // Remove calculated tasks
      remaining = remaining.filter(idx => !tasksToCalc.includes(idx));
    }
    
    return earliestStart;
  };
  
  const runSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const results = [];
      
      for (let i = 0; i < simulationCount; i++) {
        // Generate random durations
        const taskDurations = tasks.map(task => 
          genRandomDuration(task.optimistic, task.mostLikely, task.pessimistic)
        );
        
        // Calculate earliest starts
        const earliestStart = calcEarliestStarts(tasks, taskDurations);
        
        // Calculate completion times
        const completionTimes = earliestStart.map(
          (start, index) => start + taskDurations[index]
        );
        
        // Project completion is latest task completion
        const projectCompletion = Math.max(...completionTimes);
        results.push(projectCompletion);
      }
      
      // Sort results
      results.sort((a, b) => a - b);
      
      // Create histogram data
      const min = Math.floor(results[0]);
      const max = Math.ceil(results[results.length - 1]);
      const bucketSize = Math.max(1, Math.ceil((max - min) / 10));
      const histogram = [];
      
      for (let i = min; i <= max; i += bucketSize) {
        const count = results.filter(date => date >= i && date < i + bucketSize).length;
        
        histogram.push({
          range: `${i}-${i + bucketSize - 1}`,
          count,
          probability: count / results.length * 100,
          midpoint: i + bucketSize / 2
        });
      }
      
      setHistogramData(histogram);
      setSimulationResults(results);
      setIsSimulating(false);
    }, 50);
  };
  
  // Apply what-if scenario
  const applyScenario = (scenarioKey) => {
    if (scenarioKey === 'reset') {
      setTasks(INITIAL_TASKS);
      setWhatIfScenario(null);
    } else {
      const scenario = SCENARIOS[scenarioKey];
      setTasks(scenario.transform([...INITIAL_TASKS]));
      setWhatIfScenario(scenarioKey);
    }
    setSimulationResults([]);
  };
  
  // Get confidence level date
  const getConfidenceDate = (confidence) => {
    if (simulationResults.length === 0) return 'N/A';
    
    const index = Math.floor(simulationResults.length * confidence / 100);
    return simulationResults[index].toFixed(1);
  };
  
  // Tab content components
  const TabContent = {
    intro: () => (
      <div className="text-left">
        <UI.InfoBox title="Why We Need Monte Carlo Simulation" type="info">
          <p className="mb-3">Imagine trying to predict exactly when you'll arrive at the airport. There are many uncertain factors:</p>
          <ul className="list-disc pl-5 sm:pl-8 mb-4 space-y-1 sm:space-y-2">
            <li>Traffic might be light or heavy</li>
            <li>Security lines could be short or long</li>
            <li>Your taxi might arrive on time or late</li>
            <li>Weather could delay your journey</li>
          </ul>
          <p>Monte Carlo simulation is like playing out your journey hundreds of times with different random variations of these factors.</p>
        </UI.InfoBox>
        
        <div className="mt-4 sm:mt-6 bg-gray-50 p-3 sm:p-4 rounded">
          <h4 className="font-medium mb-2">Key Benefits:</h4>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1">
            <li>Represents uncertainty realistically</li>
            <li>Provides probability-based estimates</li>
            <li>Helps identify and quantify risks</li>
            <li>Enables more informed decision-making</li>
          </ul>
        </div>
      </div>
    ),
    
    singlePoint: () => (
      <div className="text-left">
        <UI.InfoBox title="The Problem with Single-Point Estimates" type="warning">
          <p className="mb-3">Traditional project planning adds up the "most likely" duration for each task:</p>
          
          <div className="overflow-x-auto mb-4">
            <table className="w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-1 sm:py-2 px-2 sm:px-4 border-b text-left">Task</th>
                  <th className="py-1 sm:py-2 px-2 sm:px-4 border-b text-right">Days</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td className="py-1 sm:py-2 px-2 sm:px-4 border-b">{task.name}</td>
                    <td className="py-1 sm:py-2 px-2 sm:px-4 border-b text-right">{task.mostLikely}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-1 sm:py-2 px-2 sm:px-4 border-b">Total Duration</td>
                  <td className="py-1 sm:py-2 px-2 sm:px-4 border-b text-right">{singlePointProject}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p>This gives us a single date: <span className="font-semibold">{singlePointProject} days</span>. But how realistic is this?</p>
        </UI.InfoBox>
        
        <div className="mt-6 sm:mt-8 flex flex-col justify-center items-start">
          <div className="text-left w-full">
            <div className="font-medium mb-2">Try adjusting this single-point estimate:</div>
            <input
              type="range" 
              min={singlePointProject - 10} 
              max={singlePointProject + 10}
              value={singlePointEstimate}
              onChange={(e) => setSinglePointEstimate(parseInt(e.target.value))}
              className="w-full sm:w-64"
            />
            <div className="mt-2 text-lg font-semibold">{singlePointEstimate} days</div>
          </div>
        </div>
        
        <UI.InfoBox title="The Problem:" type="danger">
          <p className="mb-2">If you commit based on this single estimate:</p>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1">
            <li>Too early: You'll likely miss the deadline</li>
            <li>Too late: You might unnecessarily delay benefits</li>
          </ul>
          <p className="mt-2">Without knowing the probabilities, how do you choose the right date?</p>
        </UI.InfoBox>
      </div>
    ),
    
    threePoint: () => (
      <div className="text-left">
        <UI.InfoBox title="Three-Point Estimation" type="success">
          <p className="mb-3">A better approach captures uncertainty with three estimates:</p>
          
          <ul className="list-disc pl-5 sm:pl-6 mb-4 space-y-1 sm:space-y-2">
            <li><strong>Optimistic (O):</strong> If everything goes perfectly (10% chance)</li>
            <li><strong>Most Likely (M):</strong> Realistic duration under normal circumstances</li>
            <li><strong>Pessimistic (P):</strong> If significant problems occur (10% chance)</li>
          </ul>
          
          <p>These three points create a probability distribution for each task.</p>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <div className="mb-3">
            <label className="font-medium block mb-2">Select a task:</label>
            <select 
              className="border rounded px-2 sm:px-3 py-1 sm:py-2 w-full"
              value={selectedTask}
              onChange={(e) => setSelectedTask(parseInt(e.target.value))}
            >
              {tasks.map((task, index) => (
                <option key={task.id} value={index}>{task.name}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-3">
            <label className="font-medium block mb-2">Distribution type:</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="triangular" 
                  checked={selectedDistribution === 'triangular'}
                  onChange={() => setSelectedDistribution('triangular')}
                  className="mr-2"
                />
                Triangular
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="normal" 
                  checked={selectedDistribution === 'normal'}
                  onChange={() => setSelectedDistribution('normal')}
                  className="mr-2"
                />
                PERT (Beta)
              </label>
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <canvas 
              ref={distributionCanvasRef} 
              width={600} 
              height={250}
              className="w-full h-auto"
            ></canvas>
          </div>
        </UI.Card>
        
        {selectedDistribution === 'normal' && (
          <UI.InfoBox title="PERT Formula:" type="info" className="mt-4">
            <p>The PERT formula uses a weighted average:</p>
            <div className="font-mono bg-white p-2 my-2 rounded text-left sm:text-center">
              Expected Duration = (O + 4M + P) / 6
            </div>
            <p>This creates a bell-shaped curve that gives more weight to the "most likely" estimate.</p>
          </UI.InfoBox>
        )}
      </div>
    ),
    
    dependencies: () => (
      <div>
        <UI.InfoBox title="Project Dependencies" type="purple">
          <p className="mb-3">Projects form interconnected networks where tasks depend on each other:</p>
          
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Task 1 (Design) must be completed before Task 2 (Development)</li>
            <li>Task 2 (Development) must be completed before Task 3 (Testing)</li>
          </ul>
          
          <p>This creates a sequential chain where delays cascade through the project. This is called the <span className="font-semibold">critical path</span>.</p>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <div className="mb-3 flex justify-between items-center">
            <h4 className="font-medium">Project Network Diagram:</h4>
            <label className="inline-flex items-center">
              <input 
                type="checkbox" 
                checked={showCriticalPath}
                onChange={() => setShowCriticalPath(!showCriticalPath)}
                className="mr-2"
              />
              Show Critical Path
            </label>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <canvas 
              ref={networkCanvasRef} 
              width={600} 
              height={200}
              className="w-full h-auto"
            ></canvas>
          </div>
        </UI.Card>
        
        {showCriticalPath && (
          <UI.InfoBox title="The Critical Path:" type="warning" className="mt-4">
            <p>The critical path is the longest sequence of dependent tasks that determines the minimum project duration.</p>
            <p className="mt-2">When running Monte Carlo simulations, we calculate many possible critical paths based on randomly sampled durations.</p>
          </UI.InfoBox>
        )}
      </div>
    ),
    
    simulation: () => (
      <div>
        <UI.InfoBox title="Running the Simulation" type="info">
          <p className="mb-3">Here's what happens behind the scenes:</p>
          
          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>For each simulation, we randomly sample each task's duration</li>
            <li>We calculate earliest start times based on dependencies</li>
            <li>Project completion is determined by the latest task end</li>
            <li>We repeat this process many times to build a distribution</li>
          </ol>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <UI.Slider
            label="Number of simulations to run"
            value={simulationCount}
            onChange={setSimulationCount}
            min={10}
            max={1000}
            step={10}
          />
          
          <UI.Button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full py-3"
          >
            {isSimulating ? 'Running Simulation...' : 'Run Monte Carlo Simulation'}
          </UI.Button>
        </UI.Card>
        
        {simulationResults.length > 0 && (
          <UI.Card className="mt-4">
            <h4 className="font-medium mb-3">Simulation Results:</h4>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="midpoint" 
                    label={{ value: 'Duration (days)', position: 'insideBottom', offset: -5 }}
                    tickFormatter={value => Math.round(value)}
                  />
                  <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value) => [value, 'Frequency']}
                    labelFormatter={value => `~${Math.round(value)} days`}
                  />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Minimum</div>
                <div className="text-lg font-semibold">{simulationResults[0].toFixed(1)} days</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Maximum</div>
                <div className="text-lg font-semibold">
                  {simulationResults[simulationResults.length - 1].toFixed(1)} days
                </div>
              </div>
            </div>
          </UI.Card>
        )}
      </div>
    ),
    
    results: () => (
      <div>
        <UI.InfoBox title="Understanding the Results" type="success">
          <p className="mb-3">Monte Carlo simulation gives us confidence levels:</p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>"We're 50% confident we'll finish by Day X" (the median)</li>
            <li>"We're 80% confident we'll finish by Day Y" (80th percentile)</li>
            <li>"We're 90% confident we'll finish by Day Z" (90th percentile)</li>
          </ul>
          
          <p>This helps stakeholders understand the range of possible outcomes.</p>
        </UI.InfoBox>
        
        {simulationResults.length > 0 ? (
          <UI.Card className="mt-4">
            <UI.Slider
              label="Select confidence level"
              value={confidenceLevel}
              onChange={setConfidenceLevel}
              min={10}
              max={90}
              step={5}
            />
            
            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-lg">
                We are <span className="font-bold">{confidenceLevel}% confident</span> that the project will 
                finish in <span className="font-bold">{getConfidenceDate(confidenceLevel)} days</span> or less.
              </p>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="midpoint" 
                    tickFormatter={value => Math.round(value)}
                  />
                  <YAxis />
                  <Tooltip />
                  <ReferenceLine 
                    x={parseFloat(getConfidenceDate(confidenceLevel))} 
                    stroke="red" 
                    label={{ value: `${confidenceLevel}%`, position: 'top' }} 
                  />
                  <Area type="monotone" dataKey="count" fill="#8884d8" stroke="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">50% Confidence</div>
                <div className="font-semibold">{getConfidenceDate(50)} days</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">80% Confidence</div>
                <div className="font-semibold">{getConfidenceDate(80)} days</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">90% Confidence</div>
                <div className="font-semibold">{getConfidenceDate(90)} days</div>
              </div>
            </div>
            
            <UI.InfoBox title="How to use this information:" type="warning" className="mt-4">
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>For conservative planning, use the 80% or 90% confidence date</li>
                <li>For internal targets, consider the 50% date</li>
                <li>The gap between these dates shows your schedule uncertainty</li>
              </ul>
            </UI.InfoBox>
          </UI.Card>
        ) : (
          <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200 text-center">
            Please go back to the Simulation tab and run a simulation first.
          </div>
        )}
      </div>
    ),
    
    scenarios: () => (
      <div>
        <UI.InfoBox title="What-If Scenarios" type="purple">
          <p className="mb-3">The real power comes from testing different scenarios:</p>
          
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>What if we add more resources to key tasks?</li>
            <li>What if we change the project structure to run tasks in parallel?</li>
            <li>What if we reduce task uncertainties through better planning?</li>
          </ul>
          
          <p>By comparing scenarios, you can make data-driven optimization decisions.</p>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <h4 className="font-medium mb-3">Explore Scenarios:</h4>
          
          <div className="space-y-2 mb-4">
            {Object.entries(SCENARIOS).map(([key, scenario]) => (
              <button 
                key={key}
                onClick={() => applyScenario(key)}
                className={`block w-full text-left px-4 py-2 rounded ${
                  whatIfScenario === key ? scenario.bgColor : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">{scenario.name}</span>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </button>
            ))}
            
            <button 
              onClick={() => applyScenario('reset')}
              className="block w-full text-left px-4 py-2 rounded bg-gray-50 hover:bg-gray-100"
            >
              <span className="font-medium">Reset to Original</span>
              <p className="text-sm text-gray-600">Return to baseline scenario</p>
            </button>
          </div>
          
          {whatIfScenario && (
            <UI.Button
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full py-2 mb-4"
            >
              {isSimulating ? 'Running Simulation...' : 'Run Simulation for This Scenario'}
            </UI.Button>
          )}
          
          {whatIfScenario && simulationResults.length > 0 && (
            <>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="midpoint" 
                      tickFormatter={value => Math.round(value)}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">50% Confidence</div>
                  <div className="font-semibold">{getConfidenceDate(50)} days</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">80% Confidence</div>
                  <div className="font-semibold">{getConfidenceDate(80)} days</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">Scenario</div>
                  <div className="font-semibold">{SCENARIOS[whatIfScenario]?.name || 'Custom'}</div>
                </div>
              </div>
            </>
          )}
        </UI.Card>
      </div>
    )
  };
  
  return (
    <div className="bg-gray-100 min-h-screen p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 text-left">Monte Carlo Project Simulation</h1>
        <p className="text-gray-600 mb-4 sm:mb-6 text-left">An interactive guide for non-technical team members</p>
        
        {/* Progress indicator */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {TABS.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-1 sm:px-3 py-1 sm:py-2 text-center ${
                  index === activeTab 
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {/* Current step title */}
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 text-left">{TABS[activeTab].title}</h2>
          <p className="text-gray-600 text-left">{TABS[activeTab].description}</p>
        </div>
        
        {/* Current step content */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          {TabContent[TABS[activeTab].id]()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-4 sm:mt-6">
          <UI.Button
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
            variant="secondary"
          >
            Previous
          </UI.Button>
          
          <UI.Button
            onClick={() => setActiveTab(Math.min(TABS.length - 1, activeTab + 1))}
            disabled={activeTab === TABS.length - 1}
          >
            Next
          </UI.Button>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloTutorial;
// Component registry for reusable UI elements
const UI = {
  Card: ({ children, className = "" }) => (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${className}`}>
      {children}
    </div>
  ),
  
  InfoBox: ({ title, children, type = "info" }) => {
    const colors = {
      info: "bg-blue-50 border-blue-200",
      success: "bg-green-50 border-green-200",
      warning: "bg-yellow-50 border-yellow-200",
      danger: "bg-red-50 border-red-200",
      purple: "bg-purple-50 border-purple-200"
    };
    
    return (
      <div className={`p-4 rounded-lg ${colors[type]} border mb-4`}>
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {children}
      </div>
    );
  },
  
  Button: ({ children, onClick, disabled, variant = "primary", className = "" }) => {
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
      success: "bg-green-600 hover:bg-green-700 text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white"
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {children}
      </button>
    );
  },
  
  Slider: ({ label, value, onChange, min, max, step = 1 }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        {label}: <span className="font-semibold">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
};

// Tab registry
const TABS = [
  {
    id: "intro",
    title: "What is Monte Carlo?",
    description: "Understanding uncertainty through simulation"
  },
  {
    id: "singlePoint",
    title: "Single-Point Problems",
    description: "Why one estimate isn't enough"
  },
  {
    id: "threePoint",
    title: "Three-Point Estimation",
    description: "Capturing uncertainty in each task"
  },
  {
    id: "dependencies",
    title: "Project Network",
    description: "How tasks depend on each other"
  },
  {
    id: "simulation",
    title: "Running Simulations",
    description: "Testing many possible futures"
  },
  {
    id: "results",
    title: "Understanding Results",
    description: "From dates to probabilities"
  },
  {
    id: "scenarios",
    title: "What-If Scenarios",
    description: "Testing different approaches"
  }
];

// Example project data
const INITIAL_TASKS = [
  { 
    id: 1, 
    name: "Design Phase", 
    dependencies: [], 
    optimistic: 5, 
    mostLikely: 10, 
    pessimistic: 20 
  },
  { 
    id: 2, 
    name: "Development", 
    dependencies: [1], 
    optimistic: 10, 
    mostLikely: 15, 
    pessimistic: 25 
  },
  { 
    id: 3, 
    name: "Testing", 
    dependencies: [2], 
    optimistic: 3, 
    mostLikely: 5, 
    pessimistic: 10 
  }
];

// Scenarios
const SCENARIOS = {
  optimistic: {
    name: "Optimistic Scenario",
    description: "Reduce all task durations by 20%",
    bgColor: "bg-green-100 border-green-300",
    transform: tasks => tasks.map(task => ({
      ...task,
      optimistic: Math.max(1, task.optimistic * 0.8),
      mostLikely: Math.max(1, task.mostLikely * 0.8),
      pessimistic: Math.max(1, task.pessimistic * 0.8)
    }))
  },
  parallel: {
    name: "Parallel Tasks",
    description: "Run Design and Development in parallel",
    bgColor: "bg-blue-100 border-blue-300",
    transform: tasks => tasks.map(task => 
      task.id === 2 ? { ...task, dependencies: [] } : task
    )
  },
  resources: {
    name: "Add Resources",
    description: "Add resources to Development (40% faster)",
    bgColor: "bg-purple-100 border-purple-300",
    transform: tasks => tasks.map(task => 
      task.id === 2 ? {
        ...task,
        optimistic: Math.max(1, task.optimistic * 0.6),
        mostLikely: Math.max(1, task.mostLikely * 0.6),
        pessimistic: Math.max(1, task.pessimistic * 0.6)
      } : task
    )
  }
};

const MonteCarloAdvancedTutorial = () => {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [simulationCount, setSimulationCount] = useState(100);
  const [simulationResults, setSimulationResults] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [singlePointEstimate, setSinglePointEstimate] = useState(30);
  const [selectedTask, setSelectedTask] = useState(0);
  const [selectedDistribution, setSelectedDistribution] = useState('triangular');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(80);
  const [whatIfScenario, setWhatIfScenario] = useState(null);
  const [histogramData, setHistogramData] = useState([]);
  
  // Refs for canvas drawing
  const distributionCanvasRef = useRef(null);
  const networkCanvasRef = useRef(null);
  
  // Calculate single point estimate for project
  const singlePointProject = tasks.reduce((sum, task) => sum + task.mostLikely, 0);

  // Draw distribution visualization
  useEffect(() => {
    if (activeTab === 2 && distributionCanvasRef.current) {
      const canvas = distributionCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (selectedTask === null || selectedTask >= tasks.length) return;
      
      const task = tasks[selectedTask];
      const { optimistic, mostLikely, pessimistic } = task;
      
      // Draw coordinate system
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, height - 30);
      ctx.lineTo(width - 10, height - 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, 10);
      ctx.lineTo(30, height - 30);
      ctx.stroke();
      
      // Calculate scale
      const minX = optimistic - 2;
      const maxX = pessimistic + 2;
      const xRange = maxX - minX;
      const xScale = (width - 50) / xRange;
      
      // Draw X-axis ticks and labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      for (let x = Math.ceil(minX); x <= maxX; x += Math.max(1, Math.round(xRange / 10))) {
        const xPos = 30 + (x - minX) * xScale;
        ctx.beginPath();
        ctx.moveTo(xPos, height - 30);
        ctx.lineTo(xPos, height - 25);
        ctx.stroke();
        ctx.fillText(x.toString(), xPos, height - 15);
      }
      ctx.fillText('Task Duration (Days)', width / 2, height - 5);
      
      // Draw distribution
      if (selectedDistribution === 'triangular') {
        const totalRange = pessimistic - optimistic;
        const peakHeight = 2 / totalRange;
        
        ctx.beginPath();
        ctx.moveTo(30 + (optimistic - minX) * xScale, height - 30);
        ctx.lineTo(30 + (mostLikely - minX) * xScale, height - 30 - (peakHeight * (height - 60)));
        ctx.lineTo(30 + (pessimistic - minX) * xScale, height - 30);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add annotations
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Optimistic', 30 + (optimistic - minX) * xScale, height - 40);
        ctx.fillText(`(${optimistic} days)`, 30 + (optimistic - minX) * xScale, height - 55);
        ctx.fillText('Most Likely', 30 + (mostLikely - minX) * xScale, height - 110);
        ctx.fillText(`(${mostLikely} days)`, 30 + (mostLikely - minX) * xScale, height - 125);
        ctx.fillText('Pessimistic', 30 + (pessimistic - minX) * xScale, height - 40);
        ctx.fillText(`(${pessimistic} days)`, 30 + (pessimistic - minX) * xScale, height - 55);
      } else {
        // PERT/Beta distribution approximation
        const mean = (optimistic + 4 * mostLikely + pessimistic) / 6;
        const stdDev = (pessimistic - optimistic) / 6;
        
        const normalDist = (x) => {
          return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                  Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        };
        
        let maxValue = 0;
        for (let x = minX; x <= maxX; x += 0.1) {
          maxValue = Math.max(maxValue, normalDist(x));
        }
        
        const yScale = (height - 60) / maxValue;
        
        ctx.beginPath();
        ctx.moveTo(30 + (minX - minX) * xScale, height - 30);
        
        for (let x = minX; x <= maxX; x += 0.1) {
          const y = normalDist(x) * yScale;
          ctx.lineTo(30 + (x - minX) * xScale, height - 30 - y);
        }
        
        ctx.lineTo(30 + (maxX - minX) * xScale, height - 30);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(255, 123, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 123, 0, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Mean', 30 + (mean - minX) * xScale, height - 90);
        ctx.fillText(`(${mean.toFixed(1)} days)`, 30 + (mean - minX) * xScale, height - 105);
        ctx.fillText('-1σ', 30 + (mean - stdDev - minX) * xScale, height - 50);
        ctx.fillText('+1σ', 30 + (mean + stdDev - minX) * xScale, height - 50);
      }
    }
  }, [activeTab, selectedTask, tasks, selectedDistribution]);
  
  // Draw project network
  useEffect(() => {
    if (activeTab === 3 && networkCanvasRef.current) {
      const canvas = networkCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Node positions
      const nodePositions = [
        { x: 100, y: height / 2 },
        { x: width / 2, y: height / 2 },
        { x: width - 100, y: height / 2 }
      ];
      
      // Draw nodes and connections
      tasks.forEach((task, index) => {
        const pos = nodePositions[index];
        
        // Draw connections from dependencies
        task.dependencies.forEach(depId => {
          const depIndex = tasks.findIndex(t => t.id === depId);
          const depPos = nodePositions[depIndex];
          
          // Draw arrow
          ctx.beginPath();
          ctx.moveTo(depPos.x + 40, depPos.y);
          ctx.lineTo(pos.x - 40, pos.y);
          
          // Arrow head
          const headLength = 15;
          const angle = Math.atan2(pos.y - depPos.y, pos.x - depPos.x);
          ctx.lineTo(pos.x - 40 - headLength * Math.cos(angle - Math.PI / 6), 
                    pos.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(pos.x - 40, pos.y);
          ctx.lineTo(pos.x - 40 - headLength * Math.cos(angle + Math.PI / 6), 
                    pos.y - headLength * Math.sin(angle + Math.PI / 6));
          
          ctx.strokeStyle = showCriticalPath ? '#ff5722' : '#666';
          ctx.lineWidth = showCriticalPath ? 3 : 2;
          ctx.stroke();
          
          // Duration label
          const labelX = (depPos.x + pos.x) / 2;
          const labelY = (depPos.y + pos.y) / 2 - 15;
          ctx.fillStyle = showCriticalPath ? '#ff5722' : '#333';
          ctx.textAlign = 'center';
          ctx.font = showCriticalPath ? 'bold 12px Arial' : '12px Arial';
          ctx.fillText(`${task.mostLikely} days`, labelX, labelY);
        });
        
        // Draw node
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 40, 0, 2 * Math.PI);
        ctx.fillStyle = showCriticalPath ? '#fff3e0' : '#e3f2fd';
        ctx.fill();
        ctx.strokeStyle = showCriticalPath ? '#ff5722' : '#2196f3';
        ctx.lineWidth = showCriticalPath ? 3 : 2;
        ctx.stroke();
        
        // Add task name and ID
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.font = showCriticalPath ? 'bold 14px Arial' : '14px Arial';
        ctx.fillText(task.name, pos.x, pos.y);
        ctx.font = showCriticalPath ? 'bold 12px Arial' : '12px Arial';
        ctx.fillText(`Task ${task.id}`, pos.x, pos.y + 20);
      });
      
      // Legend for critical path
      if (showCriticalPath) {
        ctx.fillStyle = '#ff5722';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Critical Path Highlighted', width / 2, 30);
      }
    }
  }, [activeTab, tasks, showCriticalPath]);
  
  // Monte Carlo simulation functions
  const genRandomDuration = (min, likely, max) => {
    const u = Math.random();
    const f = (likely - min) / (max - min);
    
    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (likely - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - likely));
    }
  };
  
  const calcEarliestStarts = (taskList, durations) => {
    const earliestStart = Array(taskList.length).fill(0);
    const calculated = new Set();
    let remaining = [...Array(taskList.length).keys()];
    
    while (remaining.length > 0) {
      // Find tasks with all dependencies calculated
      const tasksToCalc = remaining.filter(index => {
        const task = taskList[index];
        return task.dependencies.every(depId => 
          calculated.has(taskList.findIndex(t => t.id === depId))
        );
      });
      
      // Calculate earliest start times
      tasksToCalc.forEach(index => {
        const task = taskList[index];
        if (task.dependencies.length === 0) {
          earliestStart[index] = 0;
        } else {
          let maxEndTime = 0;
          task.dependencies.forEach(depId => {
            const depIndex = taskList.findIndex(t => t.id === depId);
            const endTime = earliestStart[depIndex] + durations[depIndex];
            maxEndTime = Math.max(maxEndTime, endTime);
          });
          earliestStart[index] = maxEndTime;
        }
        calculated.add(index);
      });
      
      // Remove calculated tasks
      remaining = remaining.filter(idx => !tasksToCalc.includes(idx));
    }
    
    return earliestStart;
  };
  
  const runSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const results = [];
      
      for (let i = 0; i < simulationCount; i++) {
        // Generate random durations
        const taskDurations = tasks.map(task => 
          genRandomDuration(task.optimistic, task.mostLikely, task.pessimistic)
        );
        
        // Calculate earliest starts
        const earliestStart = calcEarliestStarts(tasks, taskDurations);
        
        // Calculate completion times
        const completionTimes = earliestStart.map(
          (start, index) => start + taskDurations[index]
        );
        
        // Project completion is latest task completion
        const projectCompletion = Math.max(...completionTimes);
        results.push(projectCompletion);
      }
      
      // Sort results
      results.sort((a, b) => a - b);
      
      // Create histogram data
      const min = Math.floor(results[0]);
      const max = Math.ceil(results[results.length - 1]);
      const bucketSize = Math.max(1, Math.ceil((max - min) / 10));
      const histogram = [];
      
      for (let i = min; i <= max; i += bucketSize) {
        const count = results.filter(date => date >= i && date < i + bucketSize).length;
        
        histogram.push({
          range: `${i}-${i + bucketSize - 1}`,
          count,
          probability: count / results.length * 100,
          midpoint: i + bucketSize / 2
        });
      }
      
      setHistogramData(histogram);
      setSimulationResults(results);
      setIsSimulating(false);
    }, 50);
  };
  
  // Apply what-if scenario
  const applyScenario = (scenarioKey) => {
    if (scenarioKey === 'reset') {
      setTasks(INITIAL_TASKS);
      setWhatIfScenario(null);
    } else {
      const scenario = SCENARIOS[scenarioKey];
      setTasks(scenario.transform([...INITIAL_TASKS]));
      setWhatIfScenario(scenarioKey);
    }
    setSimulationResults([]);
  };
  
  // Get confidence level date
  const getConfidenceDate = (confidence) => {
    if (simulationResults.length === 0) return 'N/A';
    
    const index = Math.floor(simulationResults.length * confidence / 100);
    return simulationResults[index].toFixed(1);
  };
  
  // Tab content components
  const TabContent = {
    intro: () => (
      <div>
        <UI.InfoBox title="Why We Need Monte Carlo Simulation" type="info">
          <p className="mb-3">Imagine trying to predict exactly when you'll arrive at the airport. There are many uncertain factors:</p>
          <ul className="list-disc pl-8 mb-4 space-y-2">
            <li>Traffic might be light or heavy</li>
            <li>Security lines could be short or long</li>
            <li>Your taxi might arrive on time or late</li>
            <li>Weather could delay your journey</li>
          </ul>
          <p>Monte Carlo simulation is like playing out your journey hundreds of times with different random variations of these factors.</p>
        </UI.InfoBox>
        
        <div className="mt-6 bg-gray-50 p-4 rounded">
          <h4 className="font-medium mb-2">Key Benefits:</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Represents uncertainty realistically</li>
            <li>Provides probability-based estimates</li>
            <li>Helps identify and quantify risks</li>
            <li>Enables more informed decision-making</li>
          </ul>
        </div>
      </div>
    ),
    
    singlePoint: () => (
      <div>
        <UI.InfoBox title="The Problem with Single-Point Estimates" type="warning">
          <p className="mb-3">Traditional project planning adds up the "most likely" duration for each task:</p>
          
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Task</th>
                  <th className="py-2 px-4 border-b text-right">Duration (days)</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td className="py-2 px-4 border-b">{task.name}</td>
                    <td className="py-2 px-4 border-b text-right">{task.mostLikely}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-2 px-4 border-b">Total Project Duration</td>
                  <td className="py-2 px-4 border-b text-right">{singlePointProject}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p>This gives us a single date: <span className="font-semibold">{singlePointProject} days</span>. But how realistic is this?</p>
        </UI.InfoBox>
        
        <div className="mt-8 flex justify-center items-center">
          <div className="text-center">
            <div className="font-medium mb-2">Try adjusting this single-point estimate:</div>
            <input
              type="range" 
              min={singlePointProject - 10} 
              max={singlePointProject + 10}
              value={singlePointEstimate}
              onChange={(e) => setSinglePointEstimate(parseInt(e.target.value))}
              className="w-64"
            />
            <div className="mt-2 text-lg font-semibold">{singlePointEstimate} days</div>
          </div>
        </div>
        
        <UI.InfoBox title="The Problem:" type="danger">
          <p className="mb-2">If you commit based on this single estimate:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Too early: You'll likely miss the deadline</li>
            <li>Too late: You might unnecessarily delay benefits</li>
          </ul>
          <p className="mt-2">Without knowing the probabilities, how do you choose the right date?</p>
        </UI.InfoBox>
      </div>
    ),
    
    threePoint: () => (
      <div>
        <UI.InfoBox title="Three-Point Estimation" type="success">
          <p className="mb-3">A better approach captures uncertainty with three estimates:</p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Optimistic (O):</strong> If everything goes perfectly (10% chance)</li>
            <li><strong>Most Likely (M):</strong> Realistic duration under normal circumstances</li>
            <li><strong>Pessimistic (P):</strong> If significant problems occur (10% chance)</li>
          </ul>
          
          <p>These three points create a probability distribution for each task.</p>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <div className="mb-3">
            <label className="font-medium block mb-2">Select a task:</label>
            <select 
              className="border rounded px-3 py-2 w-full"
              value={selectedTask}
              onChange={(e) => setSelectedTask(parseInt(e.target.value))}
            >
              {tasks.map((task, index) => (
                <option key={task.id} value={index}>{task.name}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-3">
            <label className="font-medium block mb-2">Distribution type:</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="triangular" 
                  checked={selectedDistribution === 'triangular'}
                  onChange={() => setSelectedDistribution('triangular')}
                  className="mr-2"
                />
                Triangular
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="normal" 
                  checked={selectedDistribution === 'normal'}
                  onChange={() => setSelectedDistribution('normal')}
                  className="mr-2"
                />
                PERT (Beta)
              </label>
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <canvas 
              ref={distributionCanvasRef} 
              width={600} 
              height={250}
              className="w-full h-auto"
            ></canvas>
          </div>
        </UI.Card>
        
        {selectedDistribution === 'normal' && (
          <UI.InfoBox title="PERT Formula:" type="info" className="mt-4">
            <p>The PERT formula uses a weighted average:</p>
            <div className="font-mono bg-white p-2 my-2 rounded text-center">
              Expected Duration = (O + 4M + P) / 6
            </div>
            <p>This creates a bell-shaped curve that gives more weight to the "most likely" estimate.</p>
          </UI.InfoBox>
        )}
      </div>
    ),
    
    dependencies: () => (
      <div>
        <UI.InfoBox title="Project Dependencies" type="purple">
          <p className="mb-3">Projects form interconnected networks where tasks depend on each other:</p>
          
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Task 1 (Design) must be completed before Task 2 (Development)</li>
            <li>Task 2 (Development) must be completed before Task 3 (Testing)</li>
          </ul>
          
          <p>This creates a sequential chain where delays cascade through the project. This is called the <span className="font-semibold">critical path</span>.</p>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <div className="mb-3 flex justify-between items-center">
            <h4 className="font-medium">Project Network Diagram:</h4>
            <label className="inline-flex items-center">
              <input 
                type="checkbox" 
                checked={showCriticalPath}
                onChange={() => setShowCriticalPath(!showCriticalPath)}
                className="mr-2"
              />
              Show Critical Path
            </label>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <canvas 
              ref={networkCanvasRef} 
              width={600} 
              height={200}
              className="w-full h-auto"
            ></canvas>
          </div>
        </UI.Card>
        
        {showCriticalPath && (
          <UI.InfoBox title="The Critical Path:" type="warning" className="mt-4">
            <p>The critical path is the longest sequence of dependent tasks that determines the minimum project duration.</p>
            <p className="mt-2">When running Monte Carlo simulations, we calculate many possible critical paths based on randomly sampled durations.</p>
          </UI.InfoBox>
        )}
      </div>
    ),
    
    simulation: () => (
      <div>
        <UI.InfoBox title="Running the Simulation" type="info">
          <p className="mb-3">Here's what happens behind the scenes:</p>
          
          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>For each simulation, we randomly sample each task's duration</li>
            <li>We calculate earliest start times based on dependencies</li>
            <li>Project completion is determined by the latest task end</li>
            <li>We repeat this process many times to build a distribution</li>
          </ol>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <UI.Slider
            label="Number of simulations to run"
            value={simulationCount}
            onChange={setSimulationCount}
            min={10}
            max={1000}
            step={10}
          />
          
          <UI.Button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full py-3"
          >
            {isSimulating ? 'Running Simulation...' : 'Run Monte Carlo Simulation'}
          </UI.Button>
        </UI.Card>
        
        {simulationResults.length > 0 && (
          <UI.Card className="mt-4">
            <h4 className="font-medium mb-3">Simulation Results:</h4>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="midpoint" 
                    label={{ value: 'Duration (days)', position: 'insideBottom', offset: -5 }}
                    tickFormatter={value => Math.round(value)}
                  />
                  <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value) => [value, 'Frequency']}
                    labelFormatter={value => `~${Math.round(value)} days`}
                  />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Minimum</div>
                <div className="text-lg font-semibold">{simulationResults[0].toFixed(1)} days</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Maximum</div>
                <div className="text-lg font-semibold">
                  {simulationResults[simulationResults.length - 1].toFixed(1)} days
                </div>
              </div>
            </div>
          </UI.Card>
        )}
      </div>
    ),
    
    results: () => (
      <div>
        <UI.InfoBox title="Understanding the Results" type="success">
          <p className="mb-3">Monte Carlo simulation gives us confidence levels:</p>
          
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>"We're 50% confident we'll finish by Day X" (the median)</li>
            <li>"We're 80% confident we'll finish by Day Y" (80th percentile)</li>
            <li>"We're 90% confident we'll finish by Day Z" (90th percentile)</li>
          </ul>
          
          <p>This helps stakeholders understand the range of possible outcomes.</p>
        </UI.InfoBox>
        
        {simulationResults.length > 0 ? (
          <UI.Card className="mt-4">
            <UI.Slider
              label="Select confidence level"
              value={confidenceLevel}
              onChange={setConfidenceLevel}
              min={10}
              max={90}
              step={5}
            />
            
            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-lg">
                We are <span className="font-bold">{confidenceLevel}% confident</span> that the project will 
                finish in <span className="font-bold">{getConfidenceDate(confidenceLevel)} days</span> or less.
              </p>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="midpoint" 
                    tickFormatter={value => Math.round(value)}
                  />
                  <YAxis />
                  <Tooltip />
                  <ReferenceLine 
                    x={parseFloat(getConfidenceDate(confidenceLevel))} 
                    stroke="red" 
                    label={{ value: `${confidenceLevel}%`, position: 'top' }} 
                  />
                  <Area type="monotone" dataKey="count" fill="#8884d8" stroke="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">50% Confidence</div>
                <div className="font-semibold">{getConfidenceDate(50)} days</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">80% Confidence</div>
                <div className="font-semibold">{getConfidenceDate(80)} days</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-xs text-gray-500">90% Confidence</div>
                <div className="font-semibold">{getConfidenceDate(90)} days</div>
              </div>
            </div>
            
            <UI.InfoBox title="How to use this information:" type="warning" className="mt-4">
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>For conservative planning, use the 80% or 90% confidence date</li>
                <li>For internal targets, consider the 50% date</li>
                <li>The gap between these dates shows your schedule uncertainty</li>
              </ul>
            </UI.InfoBox>
          </UI.Card>
        ) : (
          <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200 text-center">
            Please go back to the Simulation tab and run a simulation first.
          </div>
        )}
      </div>
    ),
    
    scenarios: () => (
      <div>
        <UI.InfoBox title="What-If Scenarios" type="purple">
          <p className="mb-3">The real power comes from testing different scenarios:</p>
          
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>What if we add more resources to key tasks?</li>
            <li>What if we change the project structure to run tasks in parallel?</li>
            <li>What if we reduce task uncertainties through better planning?</li>
          </ul>
          
          <p>By comparing scenarios, you can make data-driven optimization decisions.</p>
        </UI.InfoBox>
        
        <UI.Card className="mt-4">
          <h4 className="font-medium mb-3">Explore Scenarios:</h4>
          
          <div className="space-y-2 mb-4">
            {Object.entries(SCENARIOS).map(([key, scenario]) => (
              <button 
                key={key}
                onClick={() => applyScenario(key)}
                className={`block w-full text-left px-4 py-2 rounded ${
                  whatIfScenario === key ? scenario.bgColor : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">{scenario.name}</span>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </button>
            ))}
            
            <button 
              onClick={() => applyScenario('reset')}
              className="block w-full text-left px-4 py-2 rounded bg-gray-50 hover:bg-gray-100"
            >
              <span className="font-medium">Reset to Original</span>
              <p className="text-sm text-gray-600">Return to baseline scenario</p>
            </button>
          </div>
          
          {whatIfScenario && (
            <UI.Button
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full py-2 mb-4"
            >
              {isSimulating ? 'Running Simulation...' : 'Run Simulation for This Scenario'}
            </UI.Button>
          )}
          
          {whatIfScenario && simulationResults.length > 0 && (
            <>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="midpoint" 
                      tickFormatter={value => Math.round(value)}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">50% Confidence</div>
                  <div className="font-semibold">{getConfidenceDate(50)} days</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">80% Confidence</div>
                  <div className="font-semibold">{getConfidenceDate(80)} days</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">Scenario</div>
                  <div className="font-semibold">{SCENARIOS[whatIfScenario]?.name || 'Custom'}</div>
                </div>
              </div>
            </>
          )}
        </UI.Card>
      </div>
    )
  };
  
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Monte Carlo Project Simulation</h1>
        <p className="text-gray-600 mb-6">An interactive guide for non-technical team members</p>
        
        {/* Progress indicator */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap justify-between mb-2">
            {TABS.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-3 py-2 text-center ${
                  index === activeTab 
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {/* Current step title */}
          <h2 className="text-xl font-semibold text-gray-800">{TABS[activeTab].title}</h2>
          <p className="text-gray-600">{TABS[activeTab].description}</p>
        </div>
        
        {/* Current step content */}
        <div className="bg-white rounded-lg shadow p-6">
          {TabContent[TABS[activeTab].id]()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <UI.Button
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
            variant="secondary"
          >
            Previous
          </UI.Button>
          
          <UI.Button
            onClick={() => setActiveTab(Math.min(TABS.length - 1, activeTab + 1))}
            disabled={activeTab === TABS.length - 1}
          >
            Next
          </UI.Button>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloAdvancedTutorial;
