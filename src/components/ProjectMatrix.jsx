import React, { useState } from 'react';
import * as math from 'mathjs';

const ProjectManagementMatrix = () => {
  // State for matrices
  const [taskDuration, setTaskDuration] = useState([
    [5, 0, 0, 0, 0],
    [0, 3, 0, 0, 0],
    [0, 0, 8, 0, 0],
    [0, 0, 0, 4, 0],
    [0, 0, 0, 0, 6]
  ]);
  
  const [dependencyMatrix, setDependencyMatrix] = useState([
    [0, 1, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0]
  ]);
  
  const [resourceAllocation, setResourceAllocation] = useState([
    [2, 1, 0],
    [1, 0, 2],
    [3, 2, 1],
    [0, 2, 1],
    [1, 1, 1]
  ]);
  
  const [resourceCost, setResourceCost] = useState([
    [50],
    [75],
    [60]
  ]);
  
  // Task names
  const taskNames = ['Task A', 'Task B', 'Task C', 'Task D', 'Task E'];
  const resourceNames = ['Developer', 'Designer', 'Tester'];
  
  // Calculate derived matrices
  const calculateTaskCost = () => {
    try {
      const result = math.multiply(resourceAllocation, resourceCost);
      return result;
    } catch (error) {
      return Array(taskNames.length).fill([0]);
    }
  };
  
  const calculateTotalCost = () => {
    try {
      const taskCosts = calculateTaskCost();
      let total = 0;
      for (let i = 0; i < taskCosts.length; i++) {
        total += taskCosts[i][0] * taskDuration[i][i];
      }
      return total;
    } catch (error) {
      return 0;
    }
  };
  
  const calculateCriticalPath = () => {
    try {
      // Create adjacency matrix for critical path
      const adjacency = [];
      for (let i = 0; i < dependencyMatrix.length; i++) {
        adjacency[i] = [];
        for (let j = 0; j < dependencyMatrix[i].length; j++) {
          if (dependencyMatrix[i][j] === 1) {
            adjacency[i][j] = taskDuration[j][j];
          } else {
            adjacency[i][j] = 0;
          }
        }
      }
      
      // Simple critical path calculation (not a full implementation)
      const earliestStart = Array(taskNames.length).fill(0);
      
      for (let i = 0; i < taskNames.length; i++) {
        for (let j = 0; j < i; j++) {
          if (dependencyMatrix[j][i] === 1) {
            earliestStart[i] = Math.max(earliestStart[i], earliestStart[j] + taskDuration[j][j]);
          }
        }
      }
      
      const latestFinish = Array(taskNames.length).fill(
        Math.max(...earliestStart.map((start, i) => start + taskDuration[i][i]))
      );
      
      for (let i = taskNames.length - 1; i >= 0; i--) {
        for (let j = taskNames.length - 1; j > i; j--) {
          if (dependencyMatrix[i][j] === 1) {
            latestFinish[i] = Math.min(latestFinish[i], latestFinish[j] - taskDuration[j][j]);
          }
        }
      }
      
      const slack = latestFinish.map((finish, i) => 
        finish - earliestStart[i] - taskDuration[i][i]
      );
      
      const criticalTasks = slack.map((slackTime, index) => 
        slackTime === 0 ? taskNames[index] : null
      ).filter(task => task !== null);
      
      return {
        earliestStart,
        latestFinish,
        slack,
        criticalTasks
      };
    } catch (error) {
      return {
        earliestStart: [],
        latestFinish: [],
        slack: [],
        criticalTasks: []
      };
    }
  };

  // Handle edits to matrix cells
  const handleTaskDurationChange = (taskIndex, value) => {
    const newTaskDuration = [...taskDuration];
    newTaskDuration[taskIndex][taskIndex] = parseInt(value) || 0;
    setTaskDuration(newTaskDuration);
  };
  
  const handleDependencyChange = (fromIndex, toIndex, value) => {
    const newDependencyMatrix = [...dependencyMatrix];
    newDependencyMatrix[fromIndex][toIndex] = parseInt(value) || 0;
    setDependencyMatrix(newDependencyMatrix);
  };
  
  const handleResourceAllocationChange = (taskIndex, resourceIndex, value) => {
    const newResourceAllocation = [...resourceAllocation];
    newResourceAllocation[taskIndex][resourceIndex] = parseInt(value) || 0;
    setResourceAllocation(newResourceAllocation);
  };
  
  const handleResourceCostChange = (resourceIndex, value) => {
    const newResourceCost = [...resourceCost];
    newResourceCost[resourceIndex][0] = parseInt(value) || 0;
    setResourceCost(newResourceCost);
  };
  
  // Render the interactive components
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Project Management Matrix Operations</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Duration Matrix */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Task Duration Matrix (days)</h2>
          <p className="text-sm text-gray-600 mb-4">Diagonal matrix representing the duration of each task</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2"></th>
                  {taskNames.map((task, index) => (
                    <th key={index} className="border p-2">{task}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskDuration.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="border p-2">{taskNames[rowIndex]}</th>
                    {row.map((value, colIndex) => (
                      <td key={colIndex} className="border p-2">
                        {rowIndex === colIndex ? (
                          <input
                            type="number"
                            min="0"
                            value={value}
                            onChange={(e) => handleTaskDurationChange(rowIndex, e.target.value)}
                            className="w-16 p-1 border rounded"
                          />
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Dependency Matrix */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Task Dependency Matrix</h2>
          <p className="text-sm text-gray-600 mb-4">1 indicates row task must be completed before column task</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2"></th>
                  {taskNames.map((task, index) => (
                    <th key={index} className="border p-2">{task}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dependencyMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="border p-2">{taskNames[rowIndex]}</th>
                    {row.map((value, colIndex) => (
                      <td key={colIndex} className="border p-2">
                        <select
                          value={value}
                          onChange={(e) => handleDependencyChange(rowIndex, colIndex, e.target.value)}
                          className="w-16 p-1 border rounded"
                          disabled={rowIndex === colIndex}
                        >
                          <option value="0">0</option>
                          <option value="1">1</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Resource Allocation Matrix */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Resource Allocation Matrix</h2>
          <p className="text-sm text-gray-600 mb-4">Number of each resource type assigned to each task</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2"></th>
                  {resourceNames.map((resource, index) => (
                    <th key={index} className="border p-2">{resource}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resourceAllocation.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="border p-2">{taskNames[rowIndex]}</th>
                    {row.map((value, colIndex) => (
                      <td key={colIndex} className="border p-2">
                        <input
                          type="number"
                          min="0"
                          value={value}
                          onChange={(e) => handleResourceAllocationChange(rowIndex, colIndex, e.target.value)}
                          className="w-16 p-1 border rounded"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Resource Cost Matrix */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Resource Cost Matrix ($/day)</h2>
          <p className="text-sm text-gray-600 mb-4">Daily cost of each resource type</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Resource</th>
                  <th className="border p-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {resourceCost.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="border p-2">{resourceNames[rowIndex]}</th>
                    <td className="border p-2">
                      <input
                        type="number"
                        min="0"
                        value={row[0]}
                        onChange={(e) => handleResourceCostChange(rowIndex, e.target.value)}
                        className="w-16 p-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div className="mt-8 border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Project Calculations</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Cost Matrix */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Task Daily Cost Matrix</h3>
            <p className="text-sm text-gray-600 mb-2">Cost of each task per day (Resource Allocation × Resource Cost)</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">Task</th>
                    <th className="border p-2">Daily Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateTaskCost().map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="border p-2">{taskNames[rowIndex]}</th>
                      <td className="border p-2">${row[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-bold">Total Project Cost: ${calculateTotalCost()}</p>
            </div>
          </div>
          
          {/* Critical Path Analysis */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Critical Path Analysis</h3>
            <p className="text-sm text-gray-600 mb-2">Tasks with zero slack form the critical path</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">Task</th>
                    <th className="border p-2">Duration</th>
                    <th className="border p-2">Earliest Start</th>
                    <th className="border p-2">Latest Finish</th>
                    <th className="border p-2">Slack</th>
                  </tr>
                </thead>
                <tbody>
                  {taskNames.map((task, index) => {
                    const criticalPath = calculateCriticalPath();
                    return (
                      <tr key={index} className={criticalPath.slack[index] === 0 ? "bg-yellow-100" : ""}>
                        <th className="border p-2">{task}</th>
                        <td className="border p-2">{taskDuration[index][index]}</td>
                        <td className="border p-2">{criticalPath.earliestStart[index]}</td>
                        <td className="border p-2">{criticalPath.latestFinish[index]}</td>
                        <td className="border p-2">{criticalPath.slack[index]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="font-bold">Critical Path Tasks: {calculateCriticalPath().criticalTasks.join(' → ')}</p>
              <p className="text-sm mt-1">Project Duration: {Math.max(...calculateCriticalPath().latestFinish)} days</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Matrix Operations Explained</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li><span className="font-semibold">Task Duration Matrix:</span> A diagonal matrix where each value represents a task's duration.</li>
          <li><span className="font-semibold">Dependency Matrix:</span> A binary adjacency matrix showing which tasks must be completed before others.</li>
          <li><span className="font-semibold">Resource Allocation Matrix:</span> Shows how resources (people, equipment) are assigned to each task.</li>
          <li><span className="font-semibold">Resource Cost Matrix:</span> A column vector representing the daily cost of each resource type.</li>
          <li><span className="font-semibold">Task Cost Calculation:</span> Multiplying Resource Allocation × Resource Cost gives the daily cost for each task.</li>
          <li><span className="font-semibold">Critical Path Analysis:</span> Uses the dependency matrix and task durations to identify the project's critical path.</li>
        </ul>
      </div>
    </div>
  );
};

export default ProjectManagementMatrix;