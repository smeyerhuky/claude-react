import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ScatterChart, Scatter, ZAxis 
} from 'recharts';

// Simple Matrix Explorer component
const EnhancedMatrixExplorerV2 = () => {
  // State for matrices and dimensions
  const [numRows, setNumRows] = useState(4);
  const [numCols, setNumCols] = useState(5);
  const [primaryMatrix, setPrimaryMatrix] = useState([]);
  const [secondaryMatrix, setSecondaryMatrix] = useState([]);
  const [resultMatrix, setResultMatrix] = useState([]);
  const [activeTab, setActiveTab] = useState('workloadUtilization');
  const [activeOperation, setActiveOperation] = useState('utilization');
  const [chartData, setChartData] = useState([]);
  const [explanation, setExplanation] = useState('');

  // Generate initial data
  useEffect(() => {
    generateData();
  }, [numRows, numCols]);

  // Process operation when active operation changes
  useEffect(() => {
    if (primaryMatrix.length > 0) {
      processOperation();
    }
  }, [activeOperation, primaryMatrix, secondaryMatrix]);

  // Generate random data
  const generateData = () => {
    try {
      // Create matrices with appropriate dimensions
      let workload, capacity;
      
      // Generate workload matrix (users x days)
      workload = Array(numRows).fill().map(() => 
        Array(numCols).fill().map(() => Math.floor(Math.random() * 9))
      );
      
      // Generate capacity matrix (users x days) - fixed at 8 hours per day
      capacity = Array(numRows).fill().map(() => 
        Array(numCols).fill().map(() => 8)
      );
      
      setPrimaryMatrix(workload);
      setSecondaryMatrix(capacity);
      
      setExplanation('This matrix explorer demonstrates operations on workload and capacity data. The workload matrix shows hours assigned to each user per day, while capacity shows available hours.');
    } catch (error) {
      console.error("Error generating data:", error);
    }
  };

  // Process the current operation
  const processOperation = () => {
    if (!primaryMatrix.length) return;
    
    try {
      // Process utilization operation
      if (activeOperation === 'utilization') {
        // Calculate utilization = workload / capacity
        const result = primaryMatrix.map((row, i) => 
          row.map((val, j) => val / (secondaryMatrix[i][j] || 1))
        );
        
        setResultMatrix(result);
        setExplanation('The utilization matrix shows how much of each user\'s capacity is being used each day. Values over 1.0 (100%) indicate overallocation.');
        
        // Prepare chart data
        const chartData = [];
        for (let j = 0; j < numCols; j++) {
          const dayData = { name: `Day ${j + 1}` };
          
          // Add workload data
          for (let i = 0; i < numRows; i++) {
            dayData[`User ${i + 1}`] = primaryMatrix[i][j];
            dayData[`Util ${i + 1}`] = Math.round(result[i][j] * 100);
          }
          
          chartData.push(dayData);
        }
        
        setChartData(chartData);
      }
    } catch (error) {
      console.error("Error processing operation:", error);
    }
  };
  
  // Format matrix value for display
  const formatValue = (val) => {
    if (val === undefined || val === null) return '-';
    if (typeof val === 'boolean') {
      return val ? 'true' : 'false';
    }
    if (typeof val === 'number') {
      // Round to 2 decimal places and remove trailing zeros
      return val.toFixed(2).replace(/\.00$/, '');
    }
    return val.toString();
  };

  // Generate labels for dimensions
  const userNames = Array.from({ length: numRows }, (_, i) => `User ${i + 1}`);
  const dayNames = Array.from({ length: numCols }, (_, i) => `Day ${i + 1}`);
  
  // Matrix Cell Component
  const MatrixCell = ({ value, isUtilization = false }) => {
    let className = "px-3 py-2 text-center ";
    
    // Add utilization color coding
    if (isUtilization) {
      if (value > 1) className += "bg-red-100 text-red-800 font-medium ";
      else if (value >= 0.8) className += "bg-green-100 text-green-800 font-medium ";
      else if (value > 0) className += "bg-blue-100 ";
    }
    
    return (
      <td className={className}>
        {formatValue(value)}
      </td>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Enhanced Matrix Explorer</h1>
      
      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Number of Users</label>
            <input
              type="range"
              min="2"
              max="8"
              value={numRows}
              onChange={(e) => setNumRows(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center">{numRows}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Number of Days</label>
            <input
              type="range"
              min="3"
              max="14"
              value={numCols}
              onChange={(e) => setNumCols(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center">{numCols}</div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Generate Random Data
            </button>
          </div>
        </div>
      </div>
      
      {/* Explanation */}
      {explanation && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            {explanation}
          </p>
        </div>
      )}
      
      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Workload by User</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {userNames.map((user, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={user}
                      stroke={`hsl(${i * 40}, 70%, 50%)`}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Utilization by User (%)</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 150]} label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {userNames.map((user, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={`Util ${i + 1}`}
                      stroke={`hsl(${i * 40}, 70%, 50%)`}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                  <Line
                    dataKey={() => 100}
                    stroke="red"
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={false}
                    name="100% Capacity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {/* Matrices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Workload Matrix */}
        {primaryMatrix.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Workload Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 px-3 py-2"></th>
                    {Array.from({ length: numCols }, (_, i) => (
                      <th key={i} className="border border-gray-300 bg-gray-100 px-3 py-2">Day {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {primaryMatrix.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">
                        User {rowIdx + 1}
                      </th>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="border border-gray-300 px-3 py-2 text-center">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Capacity Matrix */}
        {secondaryMatrix.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Capacity Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 px-3 py-2"></th>
                    {Array.from({ length: numCols }, (_, i) => (
                      <th key={i} className="border border-gray-300 bg-gray-100 px-3 py-2">Day {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {secondaryMatrix.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">
                        User {rowIdx + 1}
                      </th>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="border border-gray-300 px-3 py-2 text-center">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Utilization Matrix */}
        {resultMatrix.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Utilization Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 px-3 py-2"></th>
                    {Array.from({ length: numCols }, (_, i) => (
                      <th key={i} className="border border-gray-300 bg-gray-100 px-3 py-2">Day {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultMatrix.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">
                        User {rowIdx + 1}
                      </th>
                      {row.map((cell, colIdx) => (
                        <MatrixCell 
                          key={colIdx} 
                          value={cell} 
                          isUtilization={true}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMatrixExplorerV2;
