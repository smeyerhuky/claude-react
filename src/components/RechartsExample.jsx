import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Camera, BarChart3, Activity, CircleDot } from 'lucide-react';
import * as math from 'mathjs';

// Sample data that will be modified by user interactions
const initialData = [
  { name: 'Jan', value: 400, cost: 240 },
  { name: 'Feb', value: 300, cost: 180 },
  { name: 'Mar', value: 200, cost: 220 },
  { name: 'Apr', value: 278, cost: 250 },
  { name: 'May', value: 189, cost: 170 },
  { name: 'Jun', value: 239, cost: 210 }
];

const RechartsExample = () => {
  // State management
  const [data, setData] = useState(initialData);
  const [activeChart, setActiveChart] = useState('line');
  const [colorScheme, setColorScheme] = useState('#8884d8');
  const [secondaryColor, setSecondaryColor] = useState('#82ca9d');
  const [pointSize, setPointSize] = useState(8);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dataMultiplier, setDataMultiplier] = useState(1);
  const [showSecondMetric, setShowSecondMetric] = useState(true);
  const [legendPosition, setLegendPosition] = useState('bottom');

  // Update data based on multiplier
  const updateData = (multiplier) => {
    setDataMultiplier(multiplier);
    const newData = initialData.map(item => ({
      ...item,
      value: math.round(item.value * multiplier),
      cost: math.round(item.cost * multiplier)
    }));
    setData(newData);
  };

  // Random data generator for "Refresh Data" button
  const generateRandomData = () => {
    const newData = initialData.map(item => ({
      ...item,
      value: math.round(math.random(100, 500)),
      cost: math.round(math.random(100, 300))
    }));
    setData(newData);
  };

  // Chart type selector component
  const ChartTypeSelector = () => (
    <div className="flex gap-3 mb-4 items-center justify-center bg-gray-100 p-3 rounded-lg">
      <button
        className={`flex items-center gap-1 px-3 py-2 rounded ${activeChart === 'line' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        onClick={() => setActiveChart('line')}
      >
        <Activity size={16} /> Line
      </button>
      <button
        className={`flex items-center gap-1 px-3 py-2 rounded ${activeChart === 'bar' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        onClick={() => setActiveChart('bar')}
      >
        <BarChart3 size={16} /> Bar
      </button>
      <button
        className={`flex items-center gap-1 px-3 py-2 rounded ${activeChart === 'pie' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        onClick={() => setActiveChart('pie')}
      >
        <CircleDot size={16} /> Pie
      </button>
      <button
        className={`flex items-center gap-1 px-3 py-2 rounded ${activeChart === 'area' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        onClick={() => setActiveChart('area')}
      >
        <Camera size={16} /> Area
      </button>
    </div>
  );

  // Chart renderer based on selected type
  const renderChart = () => {
    switch (activeChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend layout="horizontal" verticalAlign={legendPosition} />
              <Line
                type="monotone"
                dataKey="value"
                name="Revenue"
                stroke={colorScheme}
                strokeWidth={strokeWidth}
                activeDot={{ r: pointSize }}
              />
              {showSecondMetric && (
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Cost"
                  stroke={secondaryColor}
                  strokeWidth={strokeWidth}
                  activeDot={{ r: pointSize }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend layout="horizontal" verticalAlign={legendPosition} />
              <Bar dataKey="value" name="Revenue" fill={colorScheme} radius={[pointSize/2, pointSize/2, 0, 0]} />
              {showSecondMetric && (
                <Bar dataKey="cost" name="Cost" fill={secondaryColor} radius={[pointSize/2, pointSize/2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill={colorScheme}
                label={({name, value}) => `${name}: ${value}`}
                strokeWidth={strokeWidth}
              />
              <Tooltip />
              <Legend layout="horizontal" verticalAlign={legendPosition} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend layout="horizontal" verticalAlign={legendPosition} />
              <Area
                type="monotone"
                dataKey="value"
                name="Revenue"
                stroke={colorScheme}
                fill={`${colorScheme}80`}
                strokeWidth={strokeWidth}
              />
              {showSecondMetric && (
                <Area
                  type="monotone"
                  dataKey="cost"
                  name="Cost"
                  stroke={secondaryColor}
                  fill={`${secondaryColor}80`}
                  strokeWidth={strokeWidth}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Dashboard layout with controls and visualization
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Hello World React Showcase</h1>
        <p className="text-gray-600">Interactive demonstration of React component capabilities</p>
      </div>

      <ChartTypeSelector />

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        {renderChart()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Visual Controls</h2>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color: {colorScheme}
            </label>
            <input
              type="color"
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              className="w-full h-8 rounded"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Color: {secondaryColor}
            </label>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-full h-8 rounded"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Point Size: {pointSize}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={pointSize}
              onChange={(e) => setPointSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stroke Width: {strokeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Legend Position:
            </label>
            <select
              value={legendPosition}
              onChange={(e) => setLegendPosition(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>

          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={showSecondMetric}
              onChange={(e) => setShowSecondMetric(e.target.checked)}
              className="mr-2"
              id="showSecondMetric"
            />
            <label htmlFor="showSecondMetric" className="text-sm font-medium text-gray-700">
              Show Second Metric (Cost)
            </label>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Data Controls</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Multiplier: {dataMultiplier}x
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={dataMultiplier}
              onChange={(e) => updateData(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <button
              onClick={generateRandomData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Refresh with Random Data
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={() => setData(initialData)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
            >
              Reset to Initial Data
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Current Dataset:</h3>
            <div className="bg-white p-3 rounded border text-sm">
              <pre className="overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Built with React and Rechart, Lucide-React, and MathJS</p>
        <p className="mt-1">Try changing the controls to see how props propagate through components</p>
      </div>
    </div>
  );
};

export default RechartsExample ;
