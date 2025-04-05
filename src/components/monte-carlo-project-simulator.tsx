import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ReferenceLine
} from 'recharts';

const MonteCarloProjectSimulator = () => {
  // Sample project data - tasks with dependencies and duration estimates
  const [tasks, setTasks] = useState([
    { id: 1, name: "Requirements Analysis", dependencies: [], optimistic: 3, mostLikely: 5, pessimistic: 10 },
    { id: 2, name: "UI Design", dependencies: [1], optimistic: 4, mostLikely: 7, pessimistic: 12 },
    { id: 3, name: "Backend Architecture", dependencies: [1], optimistic: 5, mostLikely: 8, pessimistic: 14 },
    { id: 4, name: "Frontend Development", dependencies: [2], optimistic: 8, mostLikely: 12, pessimistic: 20 },
    { id: 5, name: "Backend Development", dependencies: [3], optimistic: 10, mostLikely: 15, pessimistic: 25 },
    { id: 6, name: "Integration", dependencies: [4, 5], optimistic: 4, mostLikely: 6, pessimistic: 10 },
    { id: 7, name: "Testing", dependencies: [6], optimistic: 5, mostLikely: 8, pessimistic: 15 },
    { id: 8, name: "Deployment", dependencies: [7], optimistic: 2, mostLikely: 3, pessimistic: 5 }
  ]);
  
  // Simulation controls
  const [iterations, setIterations] = useState(1000);
  const [simulationResults, setSimulationResults] = useState(null);
  const [targetDate, setTargetDate] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [whatIfScenario, setWhatIfScenario] = useState(null);
  
  // Generate a random duration using triangular distribution
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
  
  // Run Monte Carlo simulation
  const runSimulation = () => {
    setIsRunning(true);
    
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      const completionDates = [];
      
      // Get task list based on scenario
      const taskList = whatIfScenario ? whatIfScenario.tasks : tasks;
      
      for (let i = 0; i < iterations; i++) {
        // Generate random durations for this iteration
        const taskDurations = taskList.map(task => 
          generateRandomDuration(task.optimistic, task.mostLikely, task.pessimistic)
        );
        
        // Calculate earliest start times
        const earliestStart = calculateEarliestStartTimes(taskList, taskDurations);
        
        // Calculate completion times
        const completionTimes = earliestStart.map(
          (start, index) => start + taskDurations[index]
        );
        
        // Project completion is the latest task completion
        const projectCompletion = Math.max(...completionTimes);
        completionDates.push(projectCompletion);
      }
      
      // Sort completion dates to analyze distribution
      completionDates.sort((a, b) => a - b);
      
      // Calculate key statistics
      const min = Math.floor(completionDates[0]);
      const max = Math.ceil(completionDates[completionDates.length - 1]);
      const mean = completionDates.reduce((sum, date) => sum + date, 0) / completionDates.length;
      const median = completionDates[Math.floor(completionDates.length / 2)];
      
      // Calculate percentiles
      const p10 = completionDates[Math.floor(completionDates.length * 0.1)];
      const p25 = completionDates[Math.floor(completionDates.length * 0.25)];
      const p75 = completionDates[Math.floor(completionDates.length * 0.75)];
      const p90 = completionDates[Math.floor(completionDates.length * 0.9)];
      
      // Calculate probability of meeting target date
      const targetProbability = completionDates.filter(date => date <= targetDate).length / completionDates.length * 100;
      
      // Prepare histogram data
      const bucketSize = Math.max(1, Math.ceil((max - min) / 20));
      const histogramData = [];
      
      for (let i = min; i <= max; i += bucketSize) {
        const count = completionDates.filter(date => 
          date >= i && date < i + bucketSize
        ).length;
        
        histogramData.push({
          range: `${i}-${i + bucketSize - 1}`,
          count,
          probability: count / completionDates.length * 100,
          midpoint: i + bucketSize / 2
        });
      }
      
      // Prepare cumulative distribution data
      const cumulativeData = [];
      let cumulative = 0;
      
      for (let i = 0; i < histogramData.length; i++) {
        cumulative += histogramData[i].count;
        cumulativeData.push({
          range: histogramData[i].range,
          midpoint: histogramData[i].midpoint,
          probability: cumulative / completionDates.length * 100
        });
      }
      
      // Set simulation results
      setSimulationResults({
        min,
        max,
        mean,
        median,
        p10,
        p25,
        p75,
        p90,
        targetProbability,
        histogramData,
        cumulativeData,
        completionDates
      });
      
      setIsRunning(false);
    }, 50);
  };
  
  // Create a "what if" scenario by modifying task durations
  const createWhatIfScenario = (scenarioType) => {
    let newTasks = [...tasks];
    
    switch (scenarioType) {
      case 'optimistic':
        // Reduce task durations by 20%
        newTasks = tasks.map(task => ({
          ...task,
          optimistic: Math.max(1, task.optimistic * 0.8),
          mostLikely: Math.max(1, task.mostLikely * 0.8),
          pessimistic: Math.max(1, task.pessimistic * 0.8)
        }));
        setWhatIfScenario({ name: 'Optimistic Scenario', tasks: newTasks });
        break;
        
      case 'pessimistic':
        // Increase task durations by 30%
        newTasks = tasks.map(task => ({
          ...task,
          optimistic: task.optimistic * 1.3,
          mostLikely: task.mostLikely * 1.3,
          pessimistic: task.pessimistic * 1.3
        }));
        setWhatIfScenario({ name: 'Pessimistic Scenario', tasks: newTasks });
        break;
        
      case 'add-resources':
        // Simulate adding resources to critical tasks (4, 5, 7)
        newTasks = tasks.map(task => {
          if ([4, 5, 7].includes(task.id)) {
            return {
              ...task,
              optimistic: Math.max(1, task.optimistic * 0.7),
              mostLikely: Math.max(1, task.mostLikely * 0.7),
              pessimistic: Math.max(1, task.pessimistic * 0.7)
            };
          }
          return task;
        });
        setWhatIfScenario({ name: 'Added Resources Scenario', tasks: newTasks });
        break;
        
      case 'parallel-tasks':
        // Simulate running tasks 3 and 2 in parallel (remove dependency on 1 for task 3)
        newTasks = tasks.map(task => {
          if (task.id === 3) {
            return {
              ...task,
              dependencies: []
            };
          }
          return task;
        });
        setWhatIfScenario({ name: 'Parallel Tasks Scenario', tasks: newTasks });
        break;
        
      default:
        setWhatIfScenario(null);
    }
  };
  
  // Function to reset the what-if scenario
  const resetScenario = () => {
    setWhatIfScenario(null);
    setSimulationResults(null);
  };
  
  // Function to update individual task duration
  const updateTaskDuration = (taskId, field, value) => {
    // Update the task in the original task list or what-if scenario
    const targetTasks = whatIfScenario ? [...whatIfScenario.tasks] : [...tasks];
    
    const updatedTasks = targetTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, [field]: parseFloat(value) };
      }
      return task;
    });
    
    if (whatIfScenario) {
      setWhatIfScenario({ ...whatIfScenario, tasks: updatedTasks });
    } else {
      setTasks(updatedTasks);
    }
    
    // Clear simulation results since task data changed
    setSimulationResults(null);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Monte Carlo Project Simulator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Simulation Controls</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Iterations:</label>
            <input 
              type="number" 
              value={iterations} 
              onChange={e => setIterations(Math.max(100, parseInt(e.target.value) || 100))}
              className="w-full px-3 py-2 border rounded"
              min="100"
              max="10000"
              step="100"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Target Completion Date (days):</label>
            <input 
              type="number" 
              value={targetDate} 
              onChange={e => setTargetDate(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border rounded"
              min="1"
            />
          </div>
          
          <button 
            onClick={runSimulation}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-4"
          >
            {isRunning ? 'Simulating...' : 'Run Simulation'}
          </button>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">What-If Scenarios:</h3>
            <div className="space-y-2">
              <button 
                onClick={() => createWhatIfScenario('optimistic')}
                className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm w-full text-left"
              >
                Optimistic (-20% duration)
              </button>
              <button 
                onClick={() => createWhatIfScenario('pessimistic')}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm w-full text-left"
              >
                Pessimistic (+30% duration)
              </button>
              <button 
                onClick={() => createWhatIfScenario('add-resources')}
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm w-full text-left"
              >
                Add Resources to Critical Tasks
              </button>
              <button 
                onClick={() => createWhatIfScenario('parallel-tasks')}
                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm w-full text-left"
              >
                Run Selected Tasks in Parallel
              </button>
            </div>
          </div>
          
          {whatIfScenario && (
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Active Scenario:</h3>
                <button 
                  onClick={resetScenario}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Reset
                </button>
              </div>
              <div className="bg-blue-50 p-2 rounded border border-blue-200 mt-1">
                {whatIfScenario.name}
              </div>
            </div>
          )}
        </div>
        
        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Project Tasks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left">Task</th>
                  <th className="border px-4 py-2 text-left">Dependencies</th>
                  <th className="border px-4 py-2 text-right">Optimistic</th>
                  <th className="border px-4 py-2 text-right">Most Likely</th>
                  <th className="border px-4 py-2 text-right">Pessimistic</th>
                </tr>
              </thead>
              <tbody>
                {(whatIfScenario ? whatIfScenario.tasks : tasks).map(task => (
                  <tr key={task.id}>
                    <td className="border px-4 py-2">{task.name}</td>
                    <td className="border px-4 py-2">
                      {task.dependencies.length > 0 
                        ? task.dependencies.map(depId => {
                            const depTask = tasks.find(t => t.id === depId);
                            return depTask ? depTask.name : '';
                          }).join(', ')
                        : 'None'
                      }
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={task.optimistic}
                        onChange={e => updateTaskDuration(task.id, 'optimistic', e.target.value)}
                        className="w-full text-right px-2 py-1 border rounded"
                        min="1"
                        step="0.5"
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={task.mostLikely}
                        onChange={e => updateTaskDuration(task.id, 'mostLikely', e.target.value)}
                        className="w-full text-right px-2 py-1 border rounded"
                        min="1"
                        step="0.5"
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={task.pessimistic}
                        onChange={e => updateTaskDuration(task.id, 'pessimistic', e.target.value)}
                        className="w-full text-right px-2 py-1 border rounded"
                        min="1"
                        step="0.5"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {simulationResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Simulation Results</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Minimum</div>
                <div className="text-xl font-semibold">{simulationResults.min.toFixed(1)} days</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Maximum</div>
                <div className="text-xl font-semibold">{simulationResults.max.toFixed(1)} days</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Mean</div>
                <div className="text-xl font-semibold">{simulationResults.mean.toFixed(1)} days</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">Median (P50)</div>
                <div className="text-xl font-semibold">{simulationResults.median.toFixed(1)} days</div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Confidence Intervals:</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">P10</div>
                  <div className="font-semibold">{simulationResults.p10.toFixed(1)}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">P25</div>
                  <div className="font-semibold">{simulationResults.p25.toFixed(1)}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">P75</div>
                  <div className="font-semibold">{simulationResults.p75.toFixed(1)}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-xs text-gray-500">P90</div>
                  <div className="font-semibold">{simulationResults.p90.toFixed(1)}</div>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Probability of Meeting Target:</h3>
              <div className={`p-3 rounded ${
                simulationResults.targetProbability > 80 ? 'bg-green-100 text-green-800' :
                simulationResults.targetProbability > 50 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                <div className="flex justify-between items-center">
                  <span>Completing in {targetDate} days or less:</span>
                  <span className="font-bold">{simulationResults.targetProbability.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Completion Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simulationResults.histogramData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  <ReferenceLine x={targetDate} stroke="red" strokeDasharray="3 3" label={{ value: 'Target', position: 'top', fill: 'red' }} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Cumulative Probability</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationResults.cumulativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="midpoint" 
                    label={{ value: 'Project Duration (days)', position: 'insideBottom', offset: -5 }}
                    tickFormatter={value => Math.round(value)}
                  />
                  <YAxis 
                    label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value.toFixed(1)}%`, 'Probability']}
                    labelFormatter={value => `Duration: ~${Math.round(value)} days`}
                  />
                  <ReferenceLine x={targetDate} stroke="red" strokeDasharray="3 3" label={{ value: 'Target', position: 'top', fill: 'red' }} />
                  <ReferenceLine y={90} stroke="green" strokeDasharray="3 3" label={{ value: '90%', position: 'right', fill: 'green' }} />
                  <ReferenceLine y={50} stroke="orange" strokeDasharray="3 3" label={{ value: '50%', position: 'right', fill: 'orange' }} />
                  <Area type="monotone" dataKey="probability" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Interpretation</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Minimum Completion Time:</span>{' '}
                The most optimistic outcome is {simulationResults.min.toFixed(1)} days, but this has a very low probability of occurring.
              </p>
              <p>
                <span className="font-medium">P10 - P90 Range:</span>{' '}
                There is an 80% chance the project will complete between {simulationResults.p10.toFixed(1)} and {simulationResults.p90.toFixed(1)} days.
              </p>
              <p>
                <span className="font-medium">Expected Completion:</span>{' '}
                The median completion time is {simulationResults.median.toFixed(1)} days, meaning there's a 50% chance of finishing before this date.
              </p>
              <p>
                <span className="font-medium">Target Date Analysis:</span>{' '}
                The probability of meeting the target date of {targetDate} days is {simulationResults.targetProbability.toFixed(1)}%.
              </p>
              <p>
                <span className="font-medium">For 90% Confidence:</span>{' '}
                Plan for approximately {simulationResults.p90.toFixed(1)} days to have 90% confidence in meeting the deadline.
              </p>
              {whatIfScenario && (
                <p className="mt-4 bg-blue-50 p-2 rounded">
                  <span className="font-medium">Scenario Analysis:</span>{' '}
                  Under the "{whatIfScenario.name}", the median completion time is {simulationResults.median.toFixed(1)} days, 
                  compared to the baseline scenario.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonteCarloProjectSimulator;