import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ReferenceLine
} from 'recharts';

const MonteCarloTutorial = () => {
  // State for tracking which tutorial step the user is on
  const [activeStep, setActiveStep] = useState(0);
  
  // Simple project with just 3 tasks for teaching purposes
  const [tasks, setTasks] = useState([
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
  ]);
  
  // State for each step's interactive elements
  const [singlePointEstimate, setSinglePointEstimate] = useState(10);
  const [selectedTask, setSelectedTask] = useState(0);
  const [threePointVisible, setThreePointVisible] = useState(false);
  const [simulationCount, setSimulationCount] = useState(10);
  const [simulationResults, setSimulationResults] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [targetDate, setTargetDate] = useState(35);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [whatIfScenario, setWhatIfScenario] = useState(null);
  const [histogramData, setHistogramData] = useState([]);
  const [selectedDistribution, setSelectedDistribution] = useState('triangular');
  
  // For Step 1: Single-point estimation
  const [singlePointProject, setSinglePointProject] = useState(0);
  
  // For Step 2: Distribution visualization
  const distributionCanvasRef = useRef(null);
  
  // For Step 3: Project network
  const networkCanvasRef = useRef(null);
  
  // For Step 5: Results interpretation
  const [confidenceLevel, setConfidenceLevel] = useState(80);
  
  // Tutorial steps content
  const tutorialSteps = [
    {
      title: "What is Monte Carlo Simulation?",
      description: "Monte Carlo simulation helps us understand uncertainty in projects by running many possible scenarios instead of making a single prediction."
    },
    {
      title: "The Problem with Single-Point Estimates",
      description: "Traditional project planning relies on single guesses for each task, which rarely match reality."
    },
    {
      title: "Three-Point Estimation",
      description: "A better approach uses three estimates: optimistic, most likely, and pessimistic. This creates a probability distribution for each task."
    },
    {
      title: "Project Dependencies",
      description: "Tasks depend on each other, forming a network. The simulation respects these dependencies when calculating completion dates."
    },
    {
      title: "Running the Simulation",
      description: "Now let's run multiple simulations, randomly sampling task durations from their distributions and calculating completion dates."
    },
    {
      title: "Understanding the Results",
      description: "Rather than a single date, we get probabilities of finishing by different dates - a much more realistic way to plan."
    },
    {
      title: "What-If Scenarios",
      description: "The true power comes from testing different scenarios to see how they affect your project timeline."
    }
  ];
  
  // Generate single point estimate for project
  useEffect(() => {
    if (activeStep === 1) {
      // Calculate single-point estimate based on "most likely" for each task
      let totalDuration = 0;
      let currentTasks = [...tasks];
      
      // Simple calculation that just adds up most likely estimates
      // This does account for dependencies in a simplified way
      currentTasks.forEach(task => {
        totalDuration += task.mostLikely;
      });
      
      setSinglePointProject(totalDuration);
    }
  }, [activeStep, tasks]);
  
  // Draw distribution visualization
  useEffect(() => {
    if (activeStep === 2 && distributionCanvasRef.current) {
      const canvas = distributionCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (selectedTask !== null && selectedTask < tasks.length) {
        const task = tasks[selectedTask];
        const { optimistic, mostLikely, pessimistic } = task;
        
        // Draw coordinate system
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(30, height - 30);
        ctx.lineTo(width - 10, height - 30);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(30, height - 30);
        ctx.stroke();
        
        // X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // Calculate scale
        const minX = optimistic - 2;
        const maxX = pessimistic + 2;
        const xRange = maxX - minX;
        const xScale = (width - 50) / xRange;
        
        // Draw X-axis ticks and labels
        for (let x = Math.ceil(minX); x <= maxX; x += Math.max(1, Math.round(xRange / 10))) {
          const xPos = 30 + (x - minX) * xScale;
          
          // Tick
          ctx.beginPath();
          ctx.moveTo(xPos, height - 30);
          ctx.lineTo(xPos, height - 25);
          ctx.stroke();
          
          // Label
          ctx.fillText(x.toString(), xPos, height - 15);
        }
        
        // Label for X-axis
        ctx.fillText('Task Duration (Days)', width / 2, height - 5);
        
        // Draw distribution based on selected type
        if (selectedDistribution === 'triangular') {
          // Triangular distribution
          const rangeO = mostLikely - optimistic;
          const rangeP = pessimistic - mostLikely;
          const totalRange = pessimistic - optimistic;
          const peakHeight = 2 / totalRange; // Height at most likely point
          
          ctx.beginPath();
          ctx.moveTo(30 + (optimistic - minX) * xScale, height - 30); // Start at optimistic, y=0
          ctx.lineTo(30 + (mostLikely - minX) * xScale, height - 30 - (peakHeight * (height - 60))); // Up to peak
          ctx.lineTo(30 + (pessimistic - minX) * xScale, height - 30); // Down to pessimistic, y=0
          ctx.closePath();
          
          // Fill with semi-transparent color
          ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
          ctx.fill();
          
          // Stroke with solid color
          ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Add annotations
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center';
          
          // Optimistic
          ctx.fillText('Optimistic', 30 + (optimistic - minX) * xScale, height - 40);
          ctx.fillText(`(${optimistic} days)`, 30 + (optimistic - minX) * xScale, height - 55);
          
          // Most Likely
          ctx.fillText('Most Likely', 30 + (mostLikely - minX) * xScale, height - 110);
          ctx.fillText(`(${mostLikely} days)`, 30 + (mostLikely - minX) * xScale, height - 125);
          
          // Pessimistic
          ctx.fillText('Pessimistic', 30 + (pessimistic - minX) * xScale, height - 40);
          ctx.fillText(`(${pessimistic} days)`, 30 + (pessimistic - minX) * xScale, height - 55);
        } else if (selectedDistribution === 'normal') {
          // Normal distribution (approximation)
          const mean = (optimistic + 4 * mostLikely + pessimistic) / 6;
          const stdDev = (pessimistic - optimistic) / 6;
          
          // Function to calculate normal distribution value
          const normalDist = (x) => {
            return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                    Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
          };
          
          // Find max value for scaling
          let maxValue = 0;
          for (let x = minX; x <= maxX; x += 0.1) {
            maxValue = Math.max(maxValue, normalDist(x));
          }
          
          const yScale = (height - 60) / maxValue;
          
          // Draw curve
          ctx.beginPath();
          ctx.moveTo(30 + (minX - minX) * xScale, height - 30);
          
          for (let x = minX; x <= maxX; x += 0.1) {
            const y = normalDist(x) * yScale;
            ctx.lineTo(30 + (x - minX) * xScale, height - 30 - y);
          }
          
          ctx.lineTo(30 + (maxX - minX) * xScale, height - 30);
          ctx.closePath();
          
          // Fill with semi-transparent color
          ctx.fillStyle = 'rgba(255, 123, 0, 0.3)';
          ctx.fill();
          
          // Stroke with solid color
          ctx.strokeStyle = 'rgba(255, 123, 0, 1)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Add annotations
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center';
          
          // Mean
          ctx.fillText('Mean', 30 + (mean - minX) * xScale, height - 90);
          ctx.fillText(`(${mean.toFixed(1)} days)`, 30 + (mean - minX) * xScale, height - 105);
          
          // -1 and +1 standard deviations
          ctx.fillText('-1σ', 30 + (mean - stdDev - minX) * xScale, height - 50);
          ctx.fillText('+1σ', 30 + (mean + stdDev - minX) * xScale, height - 50);
        }
      }
    }
  }, [activeStep, selectedTask, tasks, selectedDistribution]);
  
  // Draw project network
  useEffect(() => {
    if (activeStep === 3 && networkCanvasRef.current) {
      const canvas = networkCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Node positions (manually defined for our simple example)
      const nodePositions = [
        { x: 100, y: height / 2 }, // Task 1
        { x: width / 2, y: height / 2 }, // Task 2
        { x: width - 100, y: height / 2 } // Task 3
      ];
      
      // Draw nodes and connections
      tasks.forEach((task, index) => {
        const pos = nodePositions[index];
        
        // Draw connections (arrows) from dependencies
        task.dependencies.forEach(depId => {
          const depIndex = tasks.findIndex(t => t.id === depId);
          const depPos = nodePositions[depIndex];
          
          // Draw arrow
          ctx.beginPath();
          ctx.moveTo(depPos.x + 40, depPos.y); // Start from right side of dependency node
          ctx.lineTo(pos.x - 40, pos.y); // End at left side of current node
          
          // Arrow head
          const headLength = 15;
          const angle = Math.atan2(pos.y - depPos.y, pos.x - depPos.x);
          ctx.lineTo(pos.x - 40 - headLength * Math.cos(angle - Math.PI / 6), 
                    pos.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(pos.x - 40, pos.y);
          ctx.lineTo(pos.x - 40 - headLength * Math.cos(angle + Math.PI / 6), 
                    pos.y - headLength * Math.sin(angle + Math.PI / 6));
          
          // Style the arrow
          ctx.strokeStyle = showCriticalPath ? '#ff5722' : '#666';
          ctx.lineWidth = showCriticalPath ? 3 : 2;
          ctx.stroke();
          
          // Add duration label to arrow
          const labelX = (depPos.x + pos.x) / 2;
          const labelY = (depPos.y + pos.y) / 2 - 15;
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center';
          ctx.font = '12px Arial';
          if (showCriticalPath) {
            ctx.fillStyle = '#ff5722';
            ctx.font = 'bold 12px Arial';
          }
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
      
      // Add legend for critical path
      if (showCriticalPath) {
        ctx.fillStyle = '#ff5722';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Critical Path Highlighted', width / 2, 30);
      }
    }
  }, [activeStep, tasks, showCriticalPath]);
  
  // Generate random duration from triangular distribution
  const generateRandomDuration = (min, mostLikely, max) => {
    const u = Math.random();
    const f = (mostLikely - min) / (max - min);
    
    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (mostLikely - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mostLikely));
    }
  };
  
  // Calculate earliest start times based on dependencies
  const calculateEarliestStartTimes = (taskList, durations) => {
    const earliestStart = Array(taskList.length).fill(0);
    const calculatedTasks = new Set();
    let remainingTasks = [...Array(taskList.length).keys()];
    
    while (remainingTasks.length > 0) {
      // Find tasks that can be calculated (all dependencies are calculated)
      const tasksToCalculate = remainingTasks.filter(index => {
        const task = taskList[index];
        return task.dependencies.every(depId => 
          calculatedTasks.has(taskList.findIndex(t => t.id === depId))
        );
      });
      
      // Calculate earliest start for these tasks
      tasksToCalculate.forEach(index => {
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
        calculatedTasks.add(index);
      });
      
      // Remove calculated tasks from remaining
      remainingTasks = remainingTasks.filter(index => 
        !tasksToCalculate.includes(index)
      );
    }
    
    return earliestStart;
  };
  
  // Run a batch of simulations
  const runSimulation = () => {
    setIsSimulating(true);
    
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      const results = [];
      
      for (let i = 0; i < simulationCount; i++) {
        // Generate random durations for this iteration
        const taskDurations = tasks.map(task => 
          generateRandomDuration(task.optimistic, task.mostLikely, task.pessimistic)
        );
        
        // Calculate earliest start times
        const earliestStart = calculateEarliestStartTimes(tasks, taskDurations);
        
        // Calculate completion times
        const completionTimes = earliestStart.map(
          (start, index) => start + taskDurations[index]
        );
        
        // Project completion is the latest task completion
        const projectCompletion = Math.max(...completionTimes);
        results.push(projectCompletion);
      }
      
      // Sort results for easier analysis
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
      
      // Store results
      setSimulationResults(results);
      setIsSimulating(false);
    }, 50);
  };
  
  // Handle scenario selection
  const applyScenario = (scenario) => {
    let newTasks = [...tasks];
    
    switch(scenario) {
      case 'optimistic':
        // Reduce task durations by 20%
        newTasks = tasks.map(task => ({
          ...task,
          optimistic: Math.max(1, task.optimistic * 0.8),
          mostLikely: Math.max(1, task.mostLikely * 0.8),
          pessimistic: Math.max(1, task.pessimistic * 0.8)
        }));
        setWhatIfScenario('optimistic');
        break;
      case 'parallel':
        // Make task 2 not depend on task 1
        newTasks = tasks.map(task => {
          if (task.id === 2) {
            return {
              ...task,
              dependencies: []
            };
          }
          return task;
        });
        setWhatIfScenario('parallel');
        break;
      case 'resources':
        // Add resources to task 2 (shorten duration)
        newTasks = tasks.map(task => {
          if (task.id === 2) {
            return {
              ...task,
              optimistic: Math.max(1, task.optimistic * 0.6),
              mostLikely: Math.max(1, task.mostLikely * 0.6),
              pessimistic: Math.max(1, task.pessimistic * 0.6)
            };
          }
          return task;
        });
        setWhatIfScenario('resources');
        break;
      default:
        // Reset to original
        setWhatIfScenario(null);
    }
    
    setTasks(newTasks);
    // Clear previous results
    setSimulationResults([]);
  };
  
  // Calculate confidence level date
  const getConfidenceDate = (confidence) => {
    if (simulationResults.length === 0) return 'N/A';
    
    const index = Math.floor(simulationResults.length * confidence / 100);
    return simulationResults[index].toFixed(1);
  };
  
  // Handle next and previous step navigation
  const goToNextStep = () => {
    if (activeStep < tutorialSteps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };
  
  // Render the content for the current step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="mt-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Why We Need Monte Carlo Simulation</h3>
              <p className="mb-3">Imagine trying to predict exactly when you'll arrive at the airport for your next trip. There are many uncertain factors:</p>
              
              <ul className="list-disc pl-8 mb-4 space-y-2">
                <li>Traffic might be light or heavy</li>
                <li>Security lines could be short or long</li>
                <li>Your taxi might arrive on time or late</li>
                <li>Weather could delay your journey</li>
              </ul>
              
              <p className="mb-3">You could make a single guess, but how reliable would it be? That's the problem with traditional project planning - it asks for precise predictions in an uncertain world.</p>
              
              <p>Monte Carlo simulation is like playing out your journey to the airport hundreds of times with different random variations of these factors. Instead of a single arrival time, you get a range of possibilities with probabilities attached.</p>
            </div>
            
            <div className="mt-6 flex justify-center">
              <img 
                src="https://miro.medium.com/v2/resize:fit:1400/1*6WlSL8CmcoXBkjLaG58NEg.gif" 
                alt="Monte Carlo simulation concept" 
                className="rounded-lg shadow-lg max-w-full h-auto"
                style={{ maxHeight: '200px' }}
              />
            </div>
            
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
        );
        
      case 1:
        return (
          <div className="mt-6">
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">The Problem with Single-Point Estimates</h3>
              <p className="mb-3">In traditional project planning, we might add up the "most likely" duration for each task:</p>
              
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
              
              <p className="mb-3">This gives us a single date: <span className="font-semibold">{singlePointProject} days</span>. But how realistic is this?</p>
              
              <p>Research shows that single-point estimates are typically too optimistic. They don't account for:</p>
              <ul className="list-disc pl-8 mt-2 space-y-1">
                <li>The natural variation in how long tasks take</li>
                <li>Unexpected problems that arise during the project</li>
                <li>The statistical reality that not all tasks will finish exactly as planned</li>
              </ul>
            </div>
            
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
            
            <div className="mt-6 bg-red-50 p-5 rounded">
              <h4 className="font-medium mb-2">The Problem:</h4>
              <p className="mb-2">If you commit to a delivery date based on this single estimate:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Too early: You'll likely miss the deadline and disappoint stakeholders</li>
                <li>Too late: You might unnecessarily delay the project's benefits</li>
              </ul>
              <p className="mt-3">Without knowing the probabilities, how do you choose the right date?</p>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="mt-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Three-Point Estimation</h3>
              <p className="mb-3">A better approach is to capture the uncertainty in each task using three estimates:</p>
              
              <ul className="list-disc pl-8 mb-4 space-y-2">
                <li><strong>Optimistic (O):</strong> If everything goes perfectly, how quickly could we complete this task? (10% chance of finishing this quickly or quicker)</li>
                <li><strong>Most Likely (M):</strong> What's the most realistic duration for this task under normal circumstances?</li>
                <li><strong>Pessimistic (P):</strong> If we encounter significant problems, how long might this task take? (10% chance it would take this long or longer)</li>
              </ul>
              
              <p>These three points create a probability distribution that better represents the uncertainty in task durations.</p>
            </div>
            
            <div className="mt-6 bg-white p-4 rounded border">
              <div className="mb-3">
                <label className="font-medium block mb-2">Select a task to view its distribution:</label>
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
                  width={800} 
                  height={300}
                  className="w-full h-auto"
                ></canvas>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>With three-point estimates, we can now model uncertainty in each task. This distribution shows the range of possible durations for the selected task.</p>
              </div>
            </div>
            
            {selectedDistribution === 'normal' && (
              <div className="mt-4 bg-blue-50 p-4 rounded">
                <h4 className="font-medium mb-2">PERT Formula:</h4>
                <p>The Program Evaluation and Review Technique (PERT) uses a weighted average formula:</p>
                <div className="font-mono bg-white p-2 my-2 rounded text-center">
                  Expected Duration = (O + 4M + P) / 6
                </div>
                <p>This creates a bell-shaped curve that gives more weight to the "most likely" estimate while accounting for both best and worst cases.</p>
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="mt-6">
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Project Dependencies</h3>
              <p className="mb-3">Projects aren't just collections of independent tasks - they form interconnected networks. Some tasks can only start after others finish.</p>
              
              <p className="mb-3">In our example project:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Task 1 (Design) must be completed before Task 2 (Development) can begin</li>
                <li>Task 2 (Development) must be completed before Task 3 (Testing) can begin</li>
              </ul>
              
              <p>This creates a sequential chain of tasks, where delays in early tasks cascade through the entire project. This is called the <span className="font-semibold">critical path</span>.</p>
            </div>
            
            <div className="mt-6 bg-white p-4 rounded border">
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
                  width={800} 
                  height={200}
                  className="w-full h-auto"
                ></canvas>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>This network diagram shows how tasks depend on each other. In our simple example, all tasks are on the critical path, which means any delay in any task will delay the entire project.</p>
              </div>
            </div>
            
            {showCriticalPath && (
              <div className="mt-4 bg-orange-50 p-4 rounded">
                <h4 className="font-medium mb-2">The Critical Path:</h4>
                <p>The critical path is the longest sequence of dependent tasks that determines the minimum project duration. Tasks on this path have no "slack time" - any delay will push back the whole project.</p>
                <p className="mt-2">When running Monte Carlo simulations, we calculate many possible critical paths based on the randomly sampled durations.</p>
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="mt-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Running the Simulation</h3>
              <p className="mb-3">Now we're ready to run Monte Carlo simulations. Here's what happens behind the scenes:</p>
              
              <ol className="list-decimal pl-8 mb-4 space-y-2">
                <li>For each simulation run, we randomly sample a duration for each task from its probability distribution.</li>
                <li>We calculate the earliest start time for each task based on its dependencies.</li>
                <li>We add the task duration to its start time to find the completion time.</li>
                <li>The project completion date is the latest task completion time.</li>
                <li>We repeat this process many times to build a distribution of possible project end dates.</li>
              </ol>
              
              <p>The more simulations we run, the more accurate our probability distribution becomes.</p>
            </div>
            
            <div className="mt-6 bg-white p-4 rounded border">
              <div className="mb-4">
                <label className="font-medium block mb-2">
                  Number of simulations to run: {simulationCount}
                </label>
                <input
                  type="range" 
                  min={10} 
                  max={1000}
                  step={10}
                  value={simulationCount}
                  onChange={(e) => setSimulationCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>10 (Quick but less accurate)</span>
                  <span>1000 (More accurate but slower)</span>
                </div>
              </div>
              
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`w-full py-3 rounded font-medium text-white ${isSimulating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isSimulating ? 'Running Simulation...' : 'Run Monte Carlo Simulation'}
              </button>
            </div>
            
            {simulationResults.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded border">
                <h4 className="font-medium mb-3">Simulation Results:</h4>
                
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="midpoint" 
                        label={{ value: 'Project Duration (days)', position: 'insideBottom', offset: -5 }}
                        tickFormatter={value => Math.round(value)}
                      />
                      <YAxis 
                        label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value, 'Frequency']}
                        labelFormatter={value => `Duration: ~${Math.round(value)} days`}
                      />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Minimum Duration</div>
                    <div className="text-lg font-semibold">{simulationResults[0].toFixed(1)} days</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Maximum Duration</div>
                    <div className="text-lg font-semibold">{simulationResults[simulationResults.length - 1].toFixed(1)} days</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Instead of a single date, we now have a distribution of possible completion dates. The more times we run the simulation, the more refined this distribution becomes.</p>
                </div>
              </div>
            )}
          </div>
        );
        
      case 5:
        return (
          <div className="mt-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Understanding the Results</h3>
              <p className="mb-3">Monte Carlo simulation gives us a probability distribution instead of a single date. This allows us to make statements about confidence levels:</p>
              
              <ul className="list-disc pl-8 mb-4 space-y-2">
                <li>"We're 50% confident we'll finish by Day X" (the median)</li>
                <li>"We're 80% confident we'll finish by Day Y" (the 80th percentile)</li>
                <li>"We're 90% confident we'll finish by Day Z" (the 90th percentile)</li>
              </ul>
              
              <p>This helps stakeholders understand the range of possible outcomes and the level of certainty in the schedule.</p>
            </div>
            
            {simulationResults.length > 0 ? (
              <div className="mt-6 bg-white p-4 rounded border">
                <div className="mb-4">
                  <label className="font-medium block mb-2">
                    Select confidence level: {confidenceLevel}%
                  </label>
                  <input
                    type="range" 
                    min={10} 
                    max={90}
                    step={5}
                    value={confidenceLevel}
                    onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded mb-4">
                  <p className="text-lg">
                    We are <span className="font-bold">{confidenceLevel}% confident</span> that the project will finish in <span className="font-bold">{getConfidenceDate(confidenceLevel)} days</span> or less.
                  </p>
                </div>
                
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="midpoint" 
                        label={{ value: 'Project Duration (days)', position: 'insideBottom', offset: -5 }}
                        tickFormatter={value => Math.round(value)}
                      />
                      <YAxis 
                        label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value, 'Frequency']}
                        labelFormatter={value => `Duration: ~${Math.round(value)} days`}
                      />
                      <ReferenceLine 
                        x={parseFloat(getConfidenceDate(confidenceLevel))} 
                        stroke="red" 
                        label={{ value: `${confidenceLevel}% Confidence`, position: 'top', fill: 'red' }} 
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
                
                <div className="mt-4 bg-yellow-50 p-3 rounded">
                  <h4 className="font-medium mb-1">How to use this information:</h4>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li>For conservative planning, use the 80% or 90% confidence date</li>
                    <li>For internal targets, you might use the 50% date</li>
                    <li>The difference between these dates shows the uncertainty in your schedule</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200 text-center">
                Please go back to Step 4 and run the simulation first to see results.
              </div>
            )}
          </div>
        );
        
      case 6:
        return (
          <div className="mt-6">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">What-If Scenarios</h3>
              <p className="mb-3">The real power of Monte Carlo simulation comes from testing different scenarios to see how they affect your project timeline.</p>
              
              <p>Common what-if scenarios include:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>What if we add more resources to key tasks?</li>
                <li>What if we change the project structure to run tasks in parallel?</li>
                <li>What if we reduce task uncertainties through better planning?</li>
              </ul>
              
              <p>By comparing these scenarios, you can make data-driven decisions about the best way to optimize your project.</p>
            </div>
            
            <div className="mt-6 bg-white p-4 rounded border">
              <h4 className="font-medium mb-3">Explore Scenarios:</h4>
              
              <div className="space-y-2 mb-4">
                <button 
                  onClick={() => applyScenario('optimistic')}
                  className={`block w-full text-left px-4 py-2 rounded ${whatIfScenario === 'optimistic' ? 'bg-green-100 border border-green-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span className="font-medium">Optimistic Scenario</span>
                  <p className="text-sm text-gray-600">Reduce all task durations by 20%</p>
                </button>
                
                <button 
                  onClick={() => applyScenario('parallel')}
                  className={`block w-full text-left px-4 py-2 rounded ${whatIfScenario === 'parallel' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span className="font-medium">Parallel Tasks</span>
                  <p className="text-sm text-gray-600">Run Design and Development in parallel</p>
                </button>
                
                <button 
                  onClick={() => applyScenario('resources')}
                  className={`block w-full text-left px-4 py-2 rounded ${whatIfScenario === 'resources' ? 'bg-purple-100 border border-purple-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span className="font-medium">Add Resources</span>
                  <p className="text-sm text-gray-600">Add resources to Development (40% faster)</p>
                </button>
                
                <button 
                  onClick={() => applyScenario('reset')}
                  className="block w-full text-left px-4 py-2 rounded bg-gray-50 hover:bg-gray-100"
                >
                  <span className="font-medium">Reset to Original</span>
                  <p className="text-sm text-gray-600">Return to baseline scenario</p>
                </button>
              </div>
              
              {whatIfScenario && (
                <div className="mb-4">
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className={`w-full py-2 rounded font-medium text-white ${isSimulating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isSimulating ? 'Running Simulation...' : 'Run Simulation for This Scenario'}
                  </button>
                </div>
              )}
              
              {whatIfScenario && simulationResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Scenario Results:</h4>
                  
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="midpoint" 
                          label={{ value: 'Project Duration (days)', position: 'insideBottom', offset: -5 }}
                          tickFormatter={value => Math.round(value)}
                        />
                        <YAxis 
                          label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [value, 'Frequency']}
                          labelFormatter={value => `Duration: ~${Math.round(value)} days`}
                        />
                        <ReferenceLine x={targetDate} stroke="red" label={{ value: 'Target', position: 'top', fill: 'red' }} />
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
                      <div className="text-xs text-gray-500">Target Date</div>
                      <div className="font-semibold">{targetDate} days</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-green-50 p-3 rounded">
                    <h4 className="font-medium mb-1">Key Insights:</h4>
                    {whatIfScenario === 'optimistic' && (
                      <p>Reducing task durations by 20% improves the 80% confidence date from 45.4 days to 35.6 days, a 21.5% improvement.</p>
                    )}
                    {whatIfScenario === 'parallel' && (
                      <p>Running Design and Development in parallel has a dramatic effect, reducing the 80% confidence date by approximately 10 days. This structural change is very effective.</p>
                    )}
                    {whatIfScenario === 'resources' && (
                      <p>Adding resources to just the Development task improves the overall schedule, but not as much as changing the project structure to enable parallel work.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Monte Carlo Project Simulation</h1>
        <p className="text-gray-600 mb-6">An interactive guide for non-technical team members</p>
        
        {/* Progress indicator */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between mb-2">
            {tutorialSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`flex-1 text-center py-2 ${
                  index === activeStep 
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {/* Current step title */}
          <h2 className="text-xl font-semibold text-gray-800">{tutorialSteps[activeStep].title}</h2>
          <p className="text-gray-600">{tutorialSteps[activeStep].description}</p>
        </div>
        
        {/* Current step content */}
        <div className="bg-white rounded-lg shadow p-6">
          {renderStepContent()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={goToPreviousStep}
            disabled={activeStep === 0}
            className={`px-4 py-2 rounded ${
              activeStep === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          <button
            onClick={goToNextStep}
            disabled={activeStep === tutorialSteps.length - 1}
            className={`px-4 py-2 rounded ${
              activeStep === tutorialSteps.length - 1 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloTutorial;
