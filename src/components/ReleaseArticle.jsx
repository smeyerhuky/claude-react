import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, HeatMap, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Database, Clock, Calendar, BarChart2, Activity, ArrowDown, Server, GitCommit, RefreshCw, Search, Grid, Calculator, Sigma, Settings } from 'lucide-react';
import * as math from 'mathjs';

// Main application component
const TimeSeriesEPM = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('simulation');
  
  // State for query diff example selection
  const [selectedQueryDiff, setSelectedQueryDiff] = useState('utilization');
  
  // State for chart options visibility
  const [chartOptionsOpen, setChartOptionsOpen] = useState(null);
  
  // State for simulation parameters
  const [simulationParams, setSimulationParams] = useState({
    projects: 3,
    teamSize: 5,
    startDate: '2023-01-01',
    endDate: '2023-03-31',
    allocationDistribution: 'balanced', // balanced, front-loaded, back-loaded
    holidayPattern: 'us', // us, uk, none
  });
  
  // State for generated data
  const [simulationData, setSimulationData] = useState(null);
  
  // Effect to generate data when parameters change
  useEffect(() => {
    const data = generateSimulationData(simulationParams);
    setSimulationData(data);
  }, [simulationParams]);

  // Function to handle parameter changes
  const handleParamChange = (param, value) => {
    setSimulationParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-800">TimeSeriesEPM: Relational to Timeseries Transformation</h1>
      
      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 flex-wrap">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'simulation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('simulation')}
        >
          Data Simulation
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'query' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('query')}
        >
          Query Visualization
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'code' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('code')}
        >
          Code Examples
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'performance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance Analysis
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'querydiff' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('querydiff')}
        >
          Query Syntax Diff
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'statemachine' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('statemachine')}
        >
          State Machine
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'matrix' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('matrix')}
        >
          Matrix Operations
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'simulation' && (
          <SimulationTab 
            params={simulationParams} 
            onParamChange={handleParamChange}
            simulationData={simulationData}
            chartOptionsOpen={chartOptionsOpen}
            setChartOptionsOpen={setChartOptionsOpen}
          />
        )}
        {activeTab === 'query' && <QueryVisualizationTab data={simulationData} chartOptionsOpen={chartOptionsOpen} setChartOptionsOpen={setChartOptionsOpen} />}
        {activeTab === 'code' && <CodeExamplesTab />}
        {activeTab === 'performance' && <PerformanceTab chartOptionsOpen={chartOptionsOpen} setChartOptionsOpen={setChartOptionsOpen} />}
        {activeTab === 'querydiff' && <QueryDiffTab selectedDiff={selectedQueryDiff} setSelectedDiff={setSelectedQueryDiff} />}
        {activeTab === 'statemachine' && <StateMachineTab />}
        {activeTab === 'matrix' && <MatrixTab chartOptionsOpen={chartOptionsOpen} setChartOptionsOpen={setChartOptionsOpen} />}
      </div>
    </div>
  );
};

// Simulation Tab Component
const SimulationTab = ({ params, onParamChange, simulationData, chartOptionsOpen, setChartOptionsOpen }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Simulation Parameters</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Projects: {params.projects}
          </label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={params.projects}
            onChange={(e) => onParamChange('projects', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Size: {params.teamSize}
          </label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={params.teamSize}
            onChange={(e) => onParamChange('teamSize', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date:
          </label>
          <input 
            type="date" 
            value={params.startDate}
            onChange={(e) => onParamChange('startDate', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date:
          </label>
          <input 
            type="date" 
            value={params.endDate}
            onChange={(e) => onParamChange('endDate', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Allocation Distribution:
          </label>
          <select 
            value={params.allocationDistribution}
            onChange={(e) => onParamChange('allocationDistribution', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="balanced">Balanced</option>
            <option value="front-loaded">Front-loaded</option>
            <option value="back-loaded">Back-loaded</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Holiday Pattern:
          </label>
          <select 
            value={params.holidayPattern}
            onChange={(e) => onParamChange('holidayPattern', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="us">US Holidays</option>
            <option value="uk">UK Holidays</option>
            <option value="none">No Holidays</option>
          </select>
        </div>
      </div>
      
      <div className="md:col-span-2">
        <h2 className="text-lg font-semibold mb-4">Generated Data Preview</h2>
        
        {simulationData && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Resource Allocation (λ) Over Time</h3>
                <button 
                  className="p-1 hover:bg-gray-200 rounded-full" 
                  title="Chart Options"
                  onClick={() => setChartOptionsOpen(chartOptionsOpen === 'allocation' ? null : 'allocation')}
                >
                  <Settings size={16} className="text-gray-600" />
                </button>
                {chartOptionsOpen === 'allocation' && (
                  <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg z-10 p-2 w-48">
                    <div className="text-sm font-medium mb-2">Chart Options</div>
                    <label className="block text-sm mb-2">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Show Workload
                    </label>
                    <label className="block text-sm mb-2">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Show Capacity
                    </label>
                    <div className="text-sm mb-1">Chart Type</div>
                    <select className="w-full p-1 text-sm border rounded mb-2">
                      <option>Line Chart</option>
                      <option>Area Chart</option>
                      <option>Bar Chart</option>
                    </select>
                    <button className="w-full bg-blue-500 text-white rounded p-1 text-sm">
                      Apply Changes
                    </button>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={simulationData.timeseriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="lambda" stroke="#8884d8" name="Workload (λ)" />
                  <Line type="monotone" dataKey="mu" stroke="#82ca9d" name="Capacity (μ)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Discipline Utilization</h3>
                <button className="p-1 hover:bg-gray-200 rounded-full" title="Chart Options">
                  <Settings size={16} className="text-gray-600" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={simulationData.disciplineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilization" fill="#8884d8" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Query Visualization Tab Component
const QueryVisualizationTab = ({ data, chartOptionsOpen, setChartOptionsOpen }) => {
  const [queryType, setQueryType] = useState('discipline');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-03-31');
  const [selectedProjects, setSelectedProjects] = useState([1, 2]);
  const [selectedDisciplines, setSelectedDisciplines] = useState(['Engineering', 'Design']);
  
  // Mock query result
  const [queryResult, setQueryResult] = useState(null);
  
  // Effect to simulate query execution
  useEffect(() => {
    if (data) {
      // Simulate API call delay
      const timer = setTimeout(() => {
        const result = executeQuery(queryType, {
          startDate,
          endDate,
          projects: selectedProjects,
          disciplines: selectedDisciplines,
          data
        });
        setQueryResult(result);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [queryType, startDate, endDate, selectedProjects, selectedDisciplines, data]);
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Query Builder</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-2">Query Parameters</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Query Type:
            </label>
            <select 
              value={queryType}
              onChange={(e) => setQueryType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="discipline">Discipline Utilization</option>
              <option value="project">Project Allocation</option>
              <option value="user">User Workload</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range:
            </label>
            <div className="flex space-x-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selected Projects:
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map(projectId => (
                <label key={projectId} className="inline-flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedProjects.includes(projectId)}
                    onChange={() => {
                      if (selectedProjects.includes(projectId)) {
                        setSelectedProjects(prev => prev.filter(id => id !== projectId));
                      } else {
                        setSelectedProjects(prev => [...prev, projectId]);
                      }
                    }}
                    className="mr-1"
                  />
                  <span>Project {projectId}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selected Disciplines:
            </label>
            <div className="flex flex-wrap gap-2">
              {['Engineering', 'Design', 'Product'].map(discipline => (
                <label key={discipline} className="inline-flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedDisciplines.includes(discipline)}
                    onChange={() => {
                      if (selectedDisciplines.includes(discipline)) {
                        setSelectedDisciplines(prev => prev.filter(d => d !== discipline));
                      } else {
                        setSelectedDisciplines(prev => [...prev, discipline]);
                      }
                    }}
                    className="mr-1"
                  />
                  <span>{discipline}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-2">SQL Preview</h3>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
            {generateSampleSQL(queryType, {
              startDate,
              endDate,
              projects: selectedProjects,
              disciplines: selectedDisciplines
            })}
          </pre>
        </div>
      </div>
      
      {queryResult && (
        <div className="bg-gray-50 p-4 rounded-lg relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Query Results</h3>
            <button className="p-1 hover:bg-gray-200 rounded-full" title="Chart Options">
              <Settings size={16} className="text-gray-600" />
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            {queryType === 'discipline' ? (
              <LineChart data={queryResult}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedDisciplines.map(discipline => (
                  <Line 
                    key={discipline}
                    type="monotone" 
                    dataKey={discipline} 
                    stroke={getColorForDiscipline(discipline)} 
                    name={discipline} 
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={queryResult}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name={queryType === 'project' ? 'Allocation' : 'Workload'} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// Code Examples Tab Component
const CodeExamplesTab = () => {
  const [selectedExample, setSelectedExample] = useState('backfill');
  
  const codeExamples = {
    backfill: {
      title: 'Backfilling a New Task',
      relational: `# Rails ActiveRecord (MySQL)
def create_task_assignment(task, user, allocation_percentage)
  # Create a single record in the assignments table
  assignment = TaskAssignment.create!(
    task_id: task.id,
    user_id: user.id,
    allocation_percentage: allocation_percentage
  )
  
  # No built-in way to query by day, would need custom SQL
  # to analyze day-by-day impact on resources
  return assignment
end`,
      timeseries: `# TimescaleDB Approach
def create_task_assignment(task, user, allocation_percentage)
  # First, create the relational record
  assignment = TaskAssignment.create!(
    task_id: task.id,
    user_id: user.id,
    allocation_percentage: allocation_percentage
  )
  
  # Now, calculate and insert the day-by-day timeseries data
  start_date = task.start_date
  end_date = task.end_date
  
  # Prepare batch insertion for performance
  timeseries_records = []
  
  (start_date..end_date).each do |date|
    # Skip holidays and weekends
    next if holiday?(date, user.organization) || weekend?(date)
    
    # Calculate workload (lambda) for this day
    workload = calculate_daily_workload(task, user, allocation_percentage, date)
    
    # Calculate capacity (mu) for this day
    capacity = calculate_daily_capacity(user, date)
    
    # Prepare the record
    timeseries_records << {
      time: date,
      org_id: user.organization_id,
      project_id: task.project_id,
      task_id: task.id,
      user_id: user.id,
      discipline_id: user.discipline_id,
      role_id: user.role_id,
      lambda: workload,
      mu: capacity
    }
  end
  
  # Bulk insert into timeseries table
  ResourceTimeseries.insert_all(timeseries_records)
  
  # Update aggregations
  update_discipline_aggregations(user.discipline_id, start_date, end_date)
  
  return assignment
end`
    },
    query: {
      title: 'Querying Discipline Utilization',
      relational: `# Complex and Slow SQL for MySQL
def discipline_utilization(discipline_id, start_date, end_date)
  # This would be painfully slow for large datasets
  sql = <<-SQL
    SELECT 
      date_dim.date,
      SUM(ta.allocation_percentage * u.standard_hours / 100) as allocated,
      SUM(u.standard_hours) as capacity,
      (SUM(ta.allocation_percentage * u.standard_hours / 100) / 
       SUM(u.standard_hours)) * 100 as utilization_percentage
    FROM 
      date_dimension date_dim
    CROSS JOIN
      users u
    LEFT JOIN
      task_assignments ta ON ta.user_id = u.id
    LEFT JOIN
      tasks t ON ta.task_id = t.id AND 
                date_dim.date BETWEEN t.start_date AND t.end_date
    WHERE
      u.discipline_id = ? AND
      date_dim.date BETWEEN ? AND ? AND
      date_dim.is_weekday = true AND
      NOT EXISTS (
        SELECT 1 FROM holidays h 
        WHERE h.date = date_dim.date AND h.country = u.country
      )
    GROUP BY
      date_dim.date
    ORDER BY
      date_dim.date
  SQL
  
  # Execute raw SQL
  results = ActiveRecord::Base.connection.exec_query(
    sql, 
    "Discipline Utilization", 
    [discipline_id, start_date, end_date]
  )
  
  return results
end`,
      timeseries: `# Fast Range Query with TimescaleDB
def discipline_utilization(discipline_id, start_date, end_date)
  # Simple, efficient range query
  sql = <<-SQL
    SELECT 
      time_bucket('1 day', time) as date,
      SUM(lambda) as allocated,
      SUM(mu) as capacity,
      (SUM(lambda) / SUM(mu)) * 100 as utilization_percentage
    FROM 
      resource_timeseries
    WHERE
      discipline_id = ? AND
      time BETWEEN ? AND ?
    GROUP BY
      date
    ORDER BY
      date
  SQL
  
  # Execute raw SQL
  results = ActiveRecord::Base.connection.exec_query(
    sql, 
    "Discipline Utilization", 
    [discipline_id, start_date, end_date]
  )
  
  return results
end`
    },
    update: {
      title: 'Updating Task Allocations',
      relational: `# MySQL approach - complex to update
def update_task_allocation(assignment, new_percentage)
  # Update the assignment record
  assignment.update!(allocation_percentage: new_percentage)
  
  # No easy way to update day-by-day allocations
  # Would need to manually recalculate reports
end`,
      timeseries: `# TimescaleDB approach - efficient updates
def update_task_allocation(assignment, new_percentage)
  # Update the assignment record
  old_percentage = assignment.allocation_percentage
  assignment.update!(allocation_percentage: new_percentage)
  
  # Get task dates for timeseries update
  task = assignment.task
  user = assignment.user
  start_date = task.start_date
  end_date = task.end_date
  
  # Calculate the difference to apply to existing records
  percentage_change = new_percentage - old_percentage
  
  # Update existing timeseries records
  sql = <<-SQL
    UPDATE resource_timeseries
    SET 
      lambda = lambda + (? * daily_hours / 100)
    WHERE
      task_id = ? AND
      user_id = ? AND
      time BETWEEN ? AND ?
  SQL
  
  # Execute update
  ActiveRecord::Base.connection.execute(
    sql, 
    [percentage_change, task.id, user.id, start_date, end_date]
  )
  
  # Update aggregations
  update_discipline_aggregations(user.discipline_id, start_date, end_date)
end`
    }
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Code Examples</h2>
      
      <div className="flex border-b mb-6">
        {Object.keys(codeExamples).map(key => (
          <button 
            key={key}
            className={`px-4 py-2 font-medium ${selectedExample === key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setSelectedExample(key)}
          >
            {codeExamples[key].title}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-2">Relational Approach</h3>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
            {codeExamples[selectedExample].relational}
          </pre>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-2">TimescaleDB Approach</h3>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
            {codeExamples[selectedExample].timeseries}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Query Diff Tab Component - Updated to remove red/green coloring
const QueryDiffTab = ({ selectedDiff, setSelectedDiff }) => {
  const queryDiffs = {
    utilization: {
      title: "Discipline Utilization Query",
      description: "Compare how to query discipline utilization across a date range",
      relational: `-- MySQL complex query with joins and subqueries
SELECT 
  d.date,
  d.name AS discipline_name,
  COALESCE(SUM(ta.allocation_percentage * u.standard_hours / 100), 0) AS allocated_hours,
  SUM(u.standard_hours) AS capacity_hours,
  COALESCE(
    (SUM(ta.allocation_percentage * u.standard_hours / 100) / 
     NULLIF(SUM(u.standard_hours), 0)) * 100, 
    0
  ) AS utilization_percentage
FROM 
  disciplines disc
JOIN
  users u ON u.discipline_id = disc.id
LEFT JOIN
  (SELECT * FROM date_dimension WHERE date BETWEEN '2023-01-01' AND '2023-03-31') d 
    ON 1=1
LEFT JOIN
  task_assignments ta ON ta.user_id = u.id
LEFT JOIN
  tasks t ON ta.task_id = t.id 
    AND d.date BETWEEN t.start_date AND t.end_date
WHERE
  disc.id = 123
  AND d.is_weekday = 1
  AND NOT EXISTS (
    SELECT 1 FROM holidays h 
    WHERE h.date = d.date AND h.country = u.country
  )
GROUP BY
  d.date, d.name
ORDER BY
  d.date;
`,
      timeseries: `-- TimescaleDB simple range query
SELECT 
  time_bucket('1 day', time) AS date,
  SUM(lambda) AS allocated_hours,
  SUM(mu) AS capacity_hours,
  CASE 
    WHEN SUM(mu) > 0 THEN (SUM(lambda) / SUM(mu)) * 100
    ELSE 0
  END AS utilization_percentage
FROM 
  resource_timeseries
WHERE
  discipline_id = 123
  AND time BETWEEN '2023-01-01' AND '2023-03-31'
GROUP BY
  date
ORDER BY
  date;
`,
      highlights: [
        { relational: "FROM disciplines disc", timeseries: "FROM resource_timeseries" },
        { relational: "JOIN users u ON u.discipline_id = disc.id", timeseries: null },
        { relational: "LEFT JOIN date_dimension", timeseries: "time_bucket('1 day', time)" },
        { relational: "LEFT JOIN task_assignments ta", timeseries: null },
        { relational: "LEFT JOIN tasks t", timeseries: null },
        { relational: "WHERE disc.id = 123", timeseries: "WHERE discipline_id = 123" },
        { relational: "AND NOT EXISTS (SELECT 1 FROM holidays", timeseries: null },
      ]
    },
    project_allocation: {
      title: "Project Allocation Reporting",
      description: "Compare how to report on project allocations by resource",
      relational: `-- MySQL complex project allocation query
SELECT 
  p.name AS project_name,
  u.name AS user_name,
  u.email,
  r.name AS role_name,
  d.name AS discipline_name,
  SUM(
    CASE
      WHEN t.start_date <= CURDATE() AND t.end_date >= CURDATE() 
      THEN ta.allocation_percentage
      ELSE 0
    END
  ) AS current_allocation,
  COUNT(DISTINCT t.id) AS assigned_tasks,
  MIN(t.start_date) AS earliest_assignment,
  MAX(t.end_date) AS latest_assignment,
  SUM(
    DATEDIFF(
      LEAST(t.end_date, '2023-03-31'), 
      GREATEST(t.start_date, '2023-01-01')
    ) * ta.allocation_percentage * u.standard_hours / 100
  ) AS total_allocated_hours
FROM 
  projects p
JOIN 
  tasks t ON t.project_id = p.id
JOIN 
  task_assignments ta ON ta.task_id = t.id
JOIN 
  users u ON ta.user_id = u.id
JOIN 
  roles r ON u.role_id = r.id
JOIN 
  disciplines d ON u.discipline_id = d.id
WHERE 
  p.id IN (101, 102, 103)
  AND t.start_date <= '2023-03-31'
  AND t.end_date >= '2023-01-01'
GROUP BY 
  p.id, p.name, u.id, u.name, u.email, r.id, r.name, d.id, d.name
ORDER BY 
  p.name, current_allocation DESC;
`,
      timeseries: `-- TimescaleDB simplified project allocation query
SELECT 
  p.name AS project_name,
  u.name AS user_name,
  u.email,
  r.name AS role_name,
  d.name AS discipline_name,
  -- Current allocation (today's snapshot)
  (SELECT SUM(lambda) / NULLIF(SUM(mu), 0) * 100
   FROM resource_timeseries
   WHERE project_id = p.id AND user_id = u.id 
   AND time = CURRENT_DATE) AS current_allocation,
  -- Aggregated metrics from timeseries
  SUM(lambda) AS total_allocated_hours,
  COUNT(DISTINCT time_bucket('1 day', time)) AS allocated_days,
  MIN(time) AS earliest_assignment,
  MAX(time) AS latest_assignment
FROM 
  resource_timeseries rt
JOIN 
  projects p ON rt.project_id = p.id
JOIN 
  users u ON rt.user_id = u.id
JOIN 
  roles r ON rt.role_id = r.id
JOIN 
  disciplines d ON rt.discipline_id = d.id
WHERE 
  rt.project_id IN (101, 102, 103)
  AND time BETWEEN '2023-01-01' AND '2023-03-31'
GROUP BY 
  p.id, p.name, u.id, u.name, u.email, r.id, r.name, d.id, d.name
ORDER BY 
  p.name, current_allocation DESC;
`,
      highlights: [
        { relational: "SUM(DATEDIFF(LEAST(t.end_date, '2023-03-31'), GREATEST(t.start_date, '2023-01-01')))", timeseries: "SUM(lambda)" },
        { relational: "AND t.start_date <= '2023-03-31' AND t.end_date >= '2023-01-01'", timeseries: "AND time BETWEEN '2023-01-01' AND '2023-03-31'" },
        { relational: "CASE WHEN t.start_date <= CURDATE() AND t.end_date >= CURDATE()", timeseries: "(SELECT SUM(lambda) / NULLIF(SUM(mu), 0) * 100 ... WHERE ... time = CURRENT_DATE)" },
      ]
    },
    capacity_planning: {
      title: "Future Capacity Planning",
      description: "Compare how to analyze future capacity and allocations",
      relational: `-- MySQL complex future capacity query
WITH date_series AS (
  SELECT date FROM date_dimension
  WHERE date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
  AND is_weekday = 1
),
user_capacity AS (
  SELECT 
    u.id AS user_id,
    d.date,
    CASE
      WHEN h.id IS NOT NULL THEN 0 -- Holiday
      WHEN ua.id IS NOT NULL THEN COALESCE(ua.available_hours, 0) -- User availability override
      ELSE u.standard_hours -- Default capacity
    END AS available_hours
  FROM 
    users u
  CROSS JOIN 
    date_series d
  LEFT JOIN 
    holidays h ON h.date = d.date AND h.country = u.country
  LEFT JOIN 
    user_availability ua ON ua.user_id = u.id AND ua.date = d.date
  WHERE 
    u.active = 1
    AND u.discipline_id = 123
),
user_allocations AS (
  SELECT
    u.id AS user_id,
    d.date,
    COALESCE(SUM(ta.allocation_percentage * u.standard_hours / 100), 0) AS allocated_hours
  FROM
    users u
  CROSS JOIN
    date_series d
  LEFT JOIN
    task_assignments ta ON ta.user_id = u.id
  LEFT JOIN
    tasks t ON ta.task_id = t.id 
      AND d.date BETWEEN t.start_date AND t.end_date
  WHERE
    u.active = 1
    AND u.discipline_id = 123
  GROUP BY
    u.id, d.date
)
SELECT
  d.date,
  SUM(uc.available_hours) AS total_capacity,
  SUM(ua.allocated_hours) AS total_allocated,
  SUM(uc.available_hours - ua.allocated_hours) AS remaining_capacity,
  CASE 
    WHEN SUM(uc.available_hours) > 0 
    THEN (SUM(ua.allocated_hours) / SUM(uc.available_hours)) * 100
    ELSE 0
  END AS utilization_percentage
FROM
  date_series d
JOIN
  user_capacity uc ON uc.date = d.date
JOIN
  user_allocations ua ON ua.user_id = uc.user_id AND ua.date = d.date
GROUP BY
  d.date
ORDER BY
  d.date;
`,
      timeseries: `-- TimescaleDB simplified future capacity query
SELECT
  time_bucket('1 day', time) AS date,
  SUM(mu) AS total_capacity,
  SUM(lambda) AS total_allocated,
  SUM(mu - lambda) AS remaining_capacity,
  CASE 
    WHEN SUM(mu) > 0 
    THEN (SUM(lambda) / SUM(mu)) * 100
    ELSE 0
  END AS utilization_percentage
FROM
  resource_timeseries
WHERE
  discipline_id = 123
  AND time BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '90 days')
GROUP BY
  date
ORDER BY
  date;
`,
      highlights: [
        { relational: "WITH date_series AS (SELECT date FROM date_dimension", timeseries: null },
        { relational: "user_capacity AS (SELECT u.id AS user_id, d.date, CASE...", timeseries: null },
        { relational: "user_allocations AS (SELECT u.id AS user_id, d.date, COALESCE...", timeseries: null },
        { relational: "JOIN user_capacity uc ON uc.date = d.date", timeseries: null },
        { relational: "JOIN user_allocations ua ON ua.user_id = uc.user_id AND ua.date = d.date", timeseries: null },
        { relational: "SUM(uc.available_hours) AS total_capacity", timeseries: "SUM(mu) AS total_capacity" },
        { relational: "SUM(ua.allocated_hours) AS total_allocated", timeseries: "SUM(lambda) AS total_allocated" },
      ]
    }
  };

  // Current diff data
  const diffData = queryDiffs[selectedDiff];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Query Syntax Comparison</h2>
      
      {/* Query selector */}
      <div className="flex space-x-2 mb-6 flex-wrap">
        {Object.keys(queryDiffs).map(key => (
          <button
            key={key}
            className={`px-4 py-2 rounded ${selectedDiff === key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setSelectedDiff(key)}
          >
            {queryDiffs[key].title}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-blue-800">{diffData.description}</p>
      </div>
      
      {/* Side by side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-2 text-gray-700">Relational Approach (MySQL)</h3>
          <div className="bg-gray-800 p-3 rounded text-sm overflow-x-auto h-96">
            <pre className="text-white whitespace-pre-wrap">
              {diffData.relational}
            </pre>
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Pain points:</span> Multiple joins, complex date calculations, 
              temporary tables, and subqueries make this approach harder to maintain and scale.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-2 text-gray-700">TimescaleDB Approach</h3>
          <div className="bg-gray-800 p-3 rounded text-sm overflow-x-auto h-96">
            <pre className="text-white whitespace-pre-wrap">
              {diffData.timeseries}
            </pre>
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Benefits:</span> Simpler syntax, fewer joins, 
              time bucket functions, and efficient aggregations over time ranges with significantly 
              better performance.
            </p>
          </div>
        </div>
      </div>
      

    </div>
  );
};

// State Machine Tab Component
const StateMachineTab = () => {
  // State for controlling the animation
  const [currentState, setCurrentState] = useState('initial');
  const [animationSpeed, setAnimationSpeed] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [highlightedNode, setHighlightedNode] = useState(null);
  
  // Define state machine
  const stateMachine = {
    states: {
      initial: {
        label: "Initial State",
        description: "Relational Data Model",
        details: "Original relational database with Projects, Tasks, Assignments, and User data in normalized tables.",
        next: "transform",
        position: { x: 300, y: 40 },
        icon: Database
      },
      transform: {
        label: "Transform",
        description: "Data Transformation",
        details: "Extract day-by-day allocation data from relational tables and calculate λ (workload) and μ (capacity) values.",
        next: "timeseries",
        position: { x: 300, y: 150 },
        icon: Activity
      },
      timeseries: {
        label: "TimescaleDB",
        description: "Timeseries Storage",
        details: "Store transformed data in TimescaleDB hypertables with time as the primary dimension.",
        next: "query",
        position: { x: 300, y: 260 },
        icon: Server
      },
      query: {
        label: "Query",
        description: "Efficient Queries",
        details: "Execute range-based queries against the timeseries data for analytics and reporting.",
        next: "update",
        position: { x: 300, y: 370 },
        icon: Search
      },
      update: {
        label: "Update",
        description: "Task Update",
        details: "When a task or assignment is updated in the relational database, recalculate affected days and update timeseries records.",
        next: "initial",
        position: { x: 500, y: 200 },
        icon: RefreshCw
      }
    },
    transitions: [
      { from: "initial", to: "transform", label: "ETL Process", icon: ArrowDown },
      { from: "transform", to: "timeseries", label: "Store", icon: ArrowDown },
      { from: "timeseries", to: "query", label: "Range Query", icon: ArrowDown },
      { from: "query", to: "update", label: "Modify Task", icon: ArrowDown },
      { from: "update", to: "initial", label: "Backfill", icon: GitCommit }
    ]
  };
  
  // Function to advance to next state
  const advanceState = () => {
    const nextState = stateMachine.states[currentState].next;
    setCurrentState(nextState);
  };
  
  // Handle auto-advance
  useEffect(() => {
    let timer;
    if (isPlaying && autoAdvance) {
      timer = setTimeout(() => {
        advanceState();
      }, 1000 / animationSpeed);
    }
    return () => clearTimeout(timer);
  }, [currentState, isPlaying, autoAdvance, animationSpeed]);
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">State Machine Visualization</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg" style={{ height: '500px', position: 'relative' }}>
          {/* Render state nodes */}
          {Object.entries(stateMachine.states).map(([stateKey, state]) => (
            <div
              key={stateKey}
              className={`absolute rounded-lg p-3 border-2 transition-all duration-300 ${
                currentState === stateKey ? 'bg-blue-100 border-blue-500 shadow-lg' : 
                  (highlightedNode === stateKey ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300')
              }`}
              style={{ 
                left: `${state.position.x}px`, 
                top: `${state.position.y}px`,
                width: '160px',
                cursor: 'pointer',
                transform: currentState === stateKey ? 'scale(1.05)' : 'scale(1)'
              }}
              onClick={() => setCurrentState(stateKey)}
              onMouseEnter={() => setHighlightedNode(stateKey)}
              onMouseLeave={() => setHighlightedNode(null)}
            >
              <div className="font-bold text-sm">{state.label}</div>
              <div className="text-xs text-gray-600">{state.description}</div>
            </div>
          ))}
          
          {/* Render transitions */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            {stateMachine.transitions.map((transition, index) => {
              const fromState = stateMachine.states[transition.from];
              const toState = stateMachine.states[transition.to];
              
              // Calculate line coordinates
              let x1, y1, x2, y2;
              
              if (transition.from === 'update' && transition.to === 'timeseries') {
                // Special case for the loop back
                x1 = fromState.position.x + 80;
                y1 = fromState.position.y;
                x2 = toState.position.x + 80;
                y2 = toState.position.y + 40;
              } else {
                x1 = fromState.position.x + 160;
                y1 = fromState.position.y + 20;
                x2 = toState.position.x;
                y2 = toState.position.y + 20;
              }
              
              // Determine if this transition is active
              const isActive = transition.from === currentState;
              
              return (
                <g key={index}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isActive ? "#3B82F6" : "#CBD5E1"}
                    strokeWidth={isActive ? 3 : 2}
                    markerEnd="url(#arrowhead)"
                  />
                  
                  {/* Transition label */}
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 10}
                    textAnchor="middle"
                    fill={isActive ? "#3B82F6" : "#64748B"}
                    fontSize="12"
                  >
                    {transition.label}
                  </text>
                  
                  {/* Arrow marker definition */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={isActive ? "#3B82F6" : "#CBD5E1"}
                      />
                    </marker>
                  </defs>
                </g>
              );
            })}
          </svg>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-2">Current State: {stateMachine.states[currentState].label}</h3>
          
          <div className="bg-white p-3 rounded border mb-4">
            <p className="text-sm">{stateMachine.states[currentState].details}</p>
          </div>
          
          <h4 className="text-sm font-medium mb-2">Code Sample:</h4>
          
          <div className="bg-gray-800 p-3 rounded text-xs overflow-x-auto mb-4 h-40">
            <pre className="text-green-400 whitespace-pre-wrap">
              {currentState === 'initial' && 
                `// Relational data structure
const task = {
  id: 1,
  project_id: 42,
  start_date: '2023-01-15',
  end_date: '2023-01-28'
};

const assignment = {
  id: 101,
  task_id: 1,
  user_id: 5,
  allocation_percentage: 75
};`
              }
              {currentState === 'transform' && 
                `// Transform to day-by-day data
function transformToTimeseries(task, assignment, user) {
  const records = [];
  
  // For each day in the task duration
  for (let date = new Date(task.start_date); 
       date <= new Date(task.end_date); 
       date.setDate(date.getDate() + 1)) {
    
    // Skip weekends and holidays
    if (isWorkday(date, user.organization_id)) {
      // Calculate lambda (workload)
      const lambda = (assignment.allocation_percentage / 100) * 
                     user.standard_hours;
                     
      // Calculate mu (capacity)
      const mu = getUserCapacity(user, date);
      
      records.push({
        time: date,
        org_id: user.organization_id,
        project_id: task.project_id,
        task_id: task.id,
        user_id: user.id,
        lambda: lambda,
        mu: mu
      });
    }
  }
  
  return records;
}`
              }
              {currentState === 'timeseries' && 
                `// TimescaleDB Schema
CREATE TABLE resource_timeseries (
  time TIMESTAMPTZ NOT NULL,
  org_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  discipline_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  lambda FLOAT NOT NULL,  -- workload
  mu FLOAT NOT NULL       -- capacity
);

-- Convert to hypertable
SELECT create_hypertable('resource_timeseries', 'time',
  chunk_time_interval => INTERVAL '1 month');
  
-- Create indexes
CREATE INDEX ON resource_timeseries (org_id, time DESC);
CREATE INDEX ON resource_timeseries (project_id, time DESC);
CREATE INDEX ON resource_timeseries (discipline_id, time DESC);`
              }
              {currentState === 'query' && 
                `// Efficient range query for discipline utilization
SELECT 
  time_bucket('1 day', time) AS date,
  SUM(lambda) AS allocated_hours,
  SUM(mu) AS capacity_hours,
  CASE 
    WHEN SUM(mu) > 0 
    THEN (SUM(lambda) / SUM(mu)) * 100
    ELSE 0
  END AS utilization_percentage
FROM 
  resource_timeseries
WHERE
  discipline_id = 123
  AND time BETWEEN '2023-01-01' AND '2023-03-31'
GROUP BY
  date
ORDER BY
  date;`
              }
              {currentState === 'update' && 
                `// Update task allocation
def update_task_allocation(assignment, new_percentage):
  # Update the assignment record
  old_percentage = assignment.allocation_percentage
  assignment.update!(allocation_percentage: new_percentage)
  
  # Calculate the difference for timeseries
  percentage_diff = new_percentage - old_percentage
  
  # Update the timeseries records
  sql = """
    UPDATE resource_timeseries
    SET lambda = lambda + (? * daily_hours / 100)
    WHERE
      task_id = ? AND
      user_id = ? AND
      time BETWEEN ? AND ?
  """
  
  execute_sql(
    sql, 
    [percentage_diff, task.id, user.id, 
     task.start_date, task.end_date]
  )
  
  # Update aggregations
  update_discipline_aggregations(
    user.discipline_id, 
    task.start_date, 
    task.end_date
  )`
              }
            </pre>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Animation Speed: {animationSpeed}x
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="5" 
                step="0.5"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded ${isPlaying ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                onClick={advanceState}
                disabled={isPlaying && autoAdvance}
              >
                Next State
              </button>
            </div>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={() => setAutoAdvance(!autoAdvance)}
                className="mr-2"
              />
              <span className="text-sm">Auto-advance states</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Matrix Operations Tab Component (NEW)
const MatrixTab = ({ chartOptionsOpen, setChartOptionsOpen }) => {
  // State for the example matrix
  const [matrixSize, setMatrixSize] = useState(3);
  const [activeOperation, setActiveOperation] = useState('multiplication');
  const [animate, setAnimate] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [operationSpeed, setOperationSpeed] = useState(1);
  
  // Create example matrices
  const createStateMatrix = (size) => {
    const matrix = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        // Create a probability matrix with values that sum to 1 across rows
        let val = Math.random();
        row.push(Number(val.toFixed(2)));
      }
      
      // Normalize to ensure row sums to 1 (stochastic matrix)
      const sum = row.reduce((a, b) => a + b, 0);
      for (let j = 0; j < size; j++) {
        row[j] = Number((row[j] / sum).toFixed(2));
      }
      
      matrix.push(row);
    }
    return matrix;
  };
  
  // Lazily create matrices
  const [stateMatrix, setStateMatrix] = useState(() => createStateMatrix(matrixSize));
  const [initialState, setInitialState] = useState(() => {
    const state = Array(matrixSize).fill(0);
    state[0] = 1; // Start in state 0
    return state;
  });
  
  // Recalculate when matrix size changes
  useEffect(() => {
    setStateMatrix(createStateMatrix(matrixSize));
    const newState = Array(matrixSize).fill(0);
    newState[0] = 1;
    setInitialState(newState);
    setStepIndex(0);
  }, [matrixSize]);
  
  // Animation effect
  useEffect(() => {
    if (!animate) return;
    
    const timer = setTimeout(() => {
      setStepIndex(prev => (prev + 1) % 10); // Cycle through 10 steps
    }, 1000 / operationSpeed);
    
    return () => clearTimeout(timer);
  }, [animate, stepIndex, operationSpeed]);
  
  // Matrix multiplication operation
  const multiplyMatrixVector = (matrix, vector) => {
    const result = Array(matrix.length).fill(0);
    
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < vector.length; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
      result[i] = Number(result[i].toFixed(2));
    }
    
    return result;
  };
  
  // Calculate future states
  const calculateFutureStates = (steps) => {
    let currentState = [...initialState];
    const states = [currentState];
    
    for (let i = 0; i < steps; i++) {
      currentState = multiplyMatrixVector(stateMatrix, currentState);
      states.push([...currentState]);
    }
    
    return states;
  };
  
  // Calculate eigenvalues
  const calculateEigenvalues = () => {
    try {
      // Convert to mathjs matrix
      const m = math.matrix(stateMatrix);
      const eigs = math.eigs(m);
      
      // Sort by magnitude
      const values = eigs.values.toArray();
      const vectors = eigs.vectors.toArray();
      
      const combined = values.map((val, i) => ({
        value: Number(val.toFixed(3)),
        vector: vectors.map(v => Number(v[i].toFixed(3)))
      }));
      
      combined.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      
      return combined;
    } catch (error) {
      console.error("Error calculating eigenvalues:", error);
      return [];
    }
  };
  
  // Get operation description
  const getOperationDescription = () => {
    switch (activeOperation) {
      case 'multiplication':
        return `Matrix-vector multiplication is the key operation for determining future states in a Markov chain. By multiplying the current state vector by the transition matrix, we compute the probability distribution for the next state. This example shows how we can efficiently predict future states without simulating each transition step-by-step.`;
        
      case 'eigenvalues':
        return `Eigenvalues and eigenvectors reveal important properties of the system. The dominant eigenvalue (typically 1 for a stochastic matrix) indicates the system's long-term behavior. The corresponding eigenvector represents the equilibrium state - the stable distribution the system will converge to regardless of starting point.`;
        
      case 'transient':
        return `Transient analysis examines how quickly a system reaches its steady state. By tracking how fast the probability distribution converges, we can identify bottlenecks or imbalances in our resource allocation. The rate of convergence is determined by the second largest eigenvalue.`;
        
      default:
        return '';
    }
  };
  
  // Get future states up to stepIndex
  const futureStates = calculateFutureStates(10);
  const currentState = futureStates[Math.min(stepIndex, futureStates.length - 1)];
  
  // Get eigenvalues
  const eigenvalues = calculateEigenvalues();

  // Matrix visualization component
  const MatrixDisplay = ({ matrix, highlight = null }) => (
    <div className="inline-flex">
      <div className="text-xl mr-1">[</div>
      <div>
        {matrix.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => (
              <div 
                key={j}
                className={`w-14 h-10 flex items-center justify-center border m-1 font-mono text-sm
                  ${highlight && highlight.row === i && highlight.col === j 
                    ? 'bg-blue-200 border-blue-500' 
                    : 'bg-gray-50 border-gray-300'}`}
              >
                {typeof cell === 'number' ? cell.toFixed(2) : cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-xl ml-1">]</div>
    </div>
  );
  
  // Vector visualization component
  const VectorDisplay = ({ vector, label, highlight = null }) => (
    <div className="inline-flex flex-col items-center mx-4">
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}
      <div className="inline-flex">
        <div className="text-xl mr-1">[</div>
        <div className="flex flex-col">
          {vector.map((val, i) => (
            <div 
              key={i}
              className={`w-14 h-10 flex items-center justify-center border m-1 font-mono text-sm
                ${highlight === i ? 'bg-blue-200 border-blue-500' : 'bg-gray-50 border-gray-300'}`}
            >
              {typeof val === 'number' ? val.toFixed(2) : val}
            </div>
          ))}
        </div>
        <div className="text-xl ml-1">]</div>
      </div>
    </div>
  );
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Matrix Operations for State Analysis</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-blue-800">
          Matrix operations provide a powerful mathematical framework for analyzing and optimizing timeseries data systems. 
          By representing system states and transitions as matrices, we can efficiently compute future states, 
          identify stable configurations, and optimize resource allocation - all without having to run expensive simulations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg col-span-1">
          <h3 className="text-md font-medium mb-4">Matrix Parameters</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matrix Size: {matrixSize}x{matrixSize}
            </label>
            <input 
              type="range" 
              min="2" 
              max="5" 
              value={matrixSize}
              onChange={(e) => setMatrixSize(parseInt(e.target.value))}
              className="w-full"
              disabled={animate}
            />
            <p className="text-xs text-gray-500 mt-1">
              Represents the number of states in the system (e.g., resources, queues)
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation:
            </label>
            <select 
              value={activeOperation}
              onChange={(e) => setActiveOperation(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="multiplication">Matrix Multiplication</option>
              <option value="eigenvalues">Eigenvalue Analysis</option>
              <option value="transient">Transient Analysis</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animation Speed: {operationSpeed}x
            </label>
            <input 
              type="range" 
              min="0.5" 
              max="3" 
              step="0.5"
              value={operationSpeed}
              onChange={(e) => setOperationSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-between">
            <button
              className={`px-4 py-2 rounded ${animate ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}
              onClick={() => setAnimate(!animate)}
            >
              {animate ? 'Pause' : 'Animate'}
            </button>
            
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={() => setStateMatrix(createStateMatrix(matrixSize))}
              disabled={animate}
            >
              Regenerate Matrix
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg col-span-2">
          <h3 className="text-md font-medium mb-4">Operation: {activeOperation === 'multiplication' ? 'Matrix Multiplication' : activeOperation === 'eigenvalues' ? 'Eigenvalue Analysis' : 'Transient Analysis'}</h3>
          
          <p className="mb-4 text-sm text-gray-700">
            {getOperationDescription()}
          </p>
          
          {activeOperation === 'multiplication' && (
            <div className="flex flex-wrap items-center justify-center">
              {/* State transition matrix */}
              <div className="m-4">
                <div className="text-center mb-2">Transition Matrix P</div>
                <MatrixDisplay 
                  matrix={stateMatrix}
                  highlight={animate ? { row: Math.floor(stepIndex / matrixSize) % matrixSize, col: stepIndex % matrixSize } : null}
                />
                <div className="text-xs text-center mt-2">
                  Each cell P[i,j] = probability of moving from state j to state i
                </div>
              </div>
              
              <div className="flex items-center my-2">
                <Sigma size={32} />
              </div>
              
              {/* State vector */}
              <VectorDisplay 
                vector={initialState} 
                label="Initial State" 
                highlight={animate ? stepIndex % matrixSize : null}
              />
              
              <div className="flex items-center my-2">
                <span className="text-2xl">=</span>
              </div>
              
              {/* Result vector */}
              <VectorDisplay 
                vector={currentState} 
                label={`State after ${stepIndex} steps`}
                highlight={animate ? Math.floor(stepIndex / matrixSize) % matrixSize : null}
              />
            </div>
          )}
          
          {activeOperation === 'eigenvalues' && (
            <div>
              <div className="mb-4">
                <div className="text-center mb-2">Transition Matrix P</div>
                <div className="flex justify-center">
                  <MatrixDisplay matrix={stateMatrix} />
                </div>
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Eigenvalues and Eigenvectors:</h4>
                <div className="space-y-2">
                  {eigenvalues.map((eig, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <div className="text-sm font-medium">Eigenvalue {i+1}:</div>
                        <div className="bg-white p-2 rounded border text-center font-mono">
                          λ = {eig.value}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-medium">Eigenvector {i+1}:</div>
                        <div className="bg-white p-2 rounded border">
                          <div className="flex justify-center">
                            <VectorDisplay vector={eig.vector} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm">
                  <p className="font-medium">Key Insights:</p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>The dominant eigenvalue (λ = {eigenvalues[0]?.value}) determines system stability</li>
                    <li>The corresponding eigenvector represents the equilibrium distribution</li>
                    <li>The second eigenvalue ({eigenvalues[1]?.value}) determines convergence rate</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {activeOperation === 'transient' && (
            <div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">State Probability Evolution:</h4>
                  <button className="p-1 hover:bg-gray-200 rounded-full" title="Chart Options">
                    <Settings size={16} className="text-gray-600" />
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={futureStates.map((state, i) => {
                    const obj = { step: i };
                    state.forEach((val, j) => {
                      obj[`state${j}`] = val;
                    });
                    return obj;
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" label={{ value: 'Steps', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis label={{ value: 'Probability', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {Array(matrixSize).fill().map((_, i) => (
                      <Line 
                        key={i} 
                        type="monotone" 
                        dataKey={`state${i}`} 
                        name={`State ${i}`} 
                        stroke={getColorForState(i)} 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                
                <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Transient Analysis Insights:</h4>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li>
                      <span className="font-medium">Convergence Rate:</span> This system converges to steady state in approximately 
                      {eigenvalues.length > 1 ? 
                        ` ${Math.ceil(Math.log(0.001) / Math.log(Math.abs(eigenvalues[1]?.value)))} steps` : 
                        ' calculating...'}
                    </li>
                    <li>
                      <span className="font-medium">Dominant State:</span> The system tends to favor 
                      State {futureStates[9].indexOf(Math.max(...futureStates[9]))} in the long run
                    </li>
                    <li>
                      <span className="font-medium">Application:</span> In timeseries database design, this helps optimize chunk 
                      sizes and predict query patterns
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-md font-medium mb-4">Matrix Operations in Timeseries Databases</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Business Applications:</h4>
            <ul className="list-disc ml-5 space-y-2">
              <li>
                <span className="font-medium">Capacity Planning:</span> Matrix multiplication enables fast prediction of future resource needs based on current utilization patterns
              </li>
              <li>
                <span className="font-medium">Performance Optimization:</span> Eigenanalysis reveals bottlenecks and optimization opportunities in the system
              </li>
              <li>
                <span className="font-medium">Data Distribution:</span> Matrix operations guide optimal chunking strategies for timeseries data
              </li>
              <li>
                <span className="font-medium">Query Optimization:</span> State transition matrices help predict access patterns for precomputation and caching
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Implementation in TimescaleDB:</h4>
            <pre className="bg-gray-800 p-3 rounded text-xs text-green-400 overflow-x-auto">
{`-- Create a matrix representation table
CREATE TABLE state_transition_matrix (
  from_state INTEGER,
  to_state INTEGER,
  probability FLOAT,
  PRIMARY KEY (from_state, to_state)
);

-- Implement matrix multiplication in SQL
WITH current_state AS (
  SELECT state_id, probability 
  FROM system_state 
  WHERE timestamp = now() - interval '1 day'
),
next_state AS (
  SELECT 
    m.to_state,
    SUM(s.probability * m.probability) AS probability
  FROM current_state s
  JOIN state_transition_matrix m ON s.state_id = m.from_state
  GROUP BY m.to_state
)
-- Project future states
INSERT INTO system_state (timestamp, state_id, probability)
SELECT now(), state_id, probability FROM next_state;`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Analysis Tab Component
const PerformanceTab = ({ chartOptionsOpen, setChartOptionsOpen }) => {
  const [datasetSize, setDatasetSize] = useState(1);
  
  // Performance metrics data
  const performanceData = {
    queryTime: [
      { name: '1K Records', relational: 850, timeseries: 45 },
      { name: '10K Records', relational: 2300, timeseries: 85 },
      { name: '100K Records', relational: 11500, timeseries: 130 },
      { name: '1M Records', relational: 45000, timeseries: 220 },
      { name: '10M Records', relational: 350000, timeseries: 450 },
    ],
    storage: [
      { name: '1K Records', relational: 1, timeseries: 1.2 },
      { name: '10K Records', relational: 10, timeseries: 12 },
      { name: '100K Records', relational: 100, timeseries: 118 },
      { name: '1M Records', relational: 1000, timeseries: 980 },
      { name: '10M Records', relational: 10000, timeseries: 8500 },
    ]
  };
  
  // Helper function to safely get performance data
  const getPerformanceRatio = (dataType, index) => {
    // Map the slider value (1-5) to the corresponding array index (0-4)
    const safeIndex = Math.min(Math.max(0, index - 1), 4);
    
    if (dataType === 'queryTime') {
      const ratio = performanceData.queryTime[safeIndex].relational / 
                    performanceData.queryTime[safeIndex].timeseries;
      return Math.round(ratio);
    } else if (dataType === 'storage') {
      if (safeIndex < 3) { // First 3 entries where TimescaleDB uses more storage
        const percentage = performanceData.storage[safeIndex].timeseries / 
                          performanceData.storage[safeIndex].relational * 100;
        return Math.round(percentage);
      } else { // Last 2 entries where TimescaleDB is more efficient
        const ratio = performanceData.storage[safeIndex].relational / 
                      performanceData.storage[safeIndex].timeseries;
        return Math.round(ratio * 10) / 10;
      }
    }
    return 1;
  };
  
  // Map dataset size to the correct label
  const getDatasetSizeLabel = (size) => {
    const labels = ['1K', '10K', '100K', '1M', '10M'];
    return labels[Math.min(Math.max(0, size - 1), 4)];
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Performance Analysis</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dataset Size: {getDatasetSizeLabel(datasetSize)} Records
        </label>
        <input 
          type="range" 
          min="1" 
          max="5" 
          step="1"
          value={datasetSize}
          onChange={(e) => setDatasetSize(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Query Performance (ms)</h3>
            <button className="p-1 hover:bg-gray-200 rounded-full" title="Chart Options">
              <Settings size={16} className="text-gray-600" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.queryTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="relational" fill="#8884d8" name="MySQL" />
              <Bar dataKey="timeseries" fill="#82ca9d" name="TimescaleDB" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm">
            <p>Query: "Get resource utilization by discipline for Q1 2023"</p>
            <p className="text-green-600 font-medium mt-2">
              TimescaleDB is {getPerformanceRatio('queryTime', datasetSize)}x faster for this query at {getDatasetSizeLabel(datasetSize)} records
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Storage Efficiency (MB)</h3>
            <button className="p-1 hover:bg-gray-200 rounded-full" title="Chart Options">
              <Settings size={16} className="text-gray-600" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.storage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="relational" fill="#8884d8" name="MySQL" />
              <Bar dataKey="timeseries" fill="#82ca9d" name="TimescaleDB" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm">
            <p>Storage comparison for same dataset</p>
            <p className={`font-medium mt-2 ${datasetSize > 3 ? 'text-green-600' : 'text-yellow-600'}`}>
              {datasetSize > 3 
                ? `TimescaleDB is ${getPerformanceRatio('storage', datasetSize)}x more efficient at ${getDatasetSizeLabel(datasetSize)} records`
                : `TimescaleDB uses ${getPerformanceRatio('storage', datasetSize)}% more storage at ${getDatasetSizeLabel(datasetSize)} records, but compression improves at scale`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions

// Generate simulation data based on parameters
function generateSimulationData(params) {
  // Generate time series data
  const timeseriesData = [];
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isHoliday = params.holidayPattern !== 'none' && isHolidayDate(d, params.holidayPattern);
    
    // Skip weekends and holidays in the data
    if (!isWeekend && !isHoliday) {
      // Calculate day number for allocation distribution
      const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      const currentDay = Math.round((d - start) / (1000 * 60 * 60 * 24));
      const dayRatio = currentDay / totalDays;
      
      // Apply distribution curve
      let allocationMultiplier = 1;
      if (params.allocationDistribution === 'front-loaded') {
        allocationMultiplier = 1.5 - dayRatio;
      } else if (params.allocationDistribution === 'back-loaded') {
        allocationMultiplier = 0.5 + dayRatio;
      }
      
      // Calculate lambda (workload) and mu (capacity)
      const capacity = params.teamSize * 8; // 8 hours per team member
      const workload = Math.min(
        capacity * 1.2, // Can be overallocated
        params.projects * 2 * allocationMultiplier * 8
      );
      
      timeseriesData.push({
        date: d.toISOString().split('T')[0],
        lambda: Math.round(workload * 10) / 10,
        mu: capacity
      });
    }
  }
  
  // Generate discipline data
  const disciplines = ['Engineering', 'Design', 'Product'];
  const disciplineData = disciplines.map(name => {
    // Generate random utilization between 60-95%
    return {
      name,
      utilization: Math.round(60 + Math.random() * 35)
    };
  });
  
  return {
    timeseriesData,
    disciplineData
  };
}

// Check if a date is a holiday
function isHolidayDate(date, country) {
  // Simple mock implementation
  const holidays = {
    us: ['2023-01-01', '2023-01-16', '2023-02-20', '2023-05-29'],
    uk: ['2023-01-01', '2023-01-02', '2023-04-07', '2023-04-10']
  };
  
  const dateStr = date.toISOString().split('T')[0];
  return holidays[country].includes(dateStr);
}

// Execute a simulated query
function executeQuery(type, params) {
  switch (type) {
    case 'discipline':
      // Return discipline data over time
      return generateDisciplineData(params);
    case 'project':
      // Return project allocation data
      return generateProjectData(params);
    case 'user':
      // Return user workload data
      return generateUserData(params);
    default:
      return [];
  }
}

// Generate discipline data for queries
function generateDisciplineData({ startDate, endDate, disciplines }) {
  const result = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    
    // Skip weekends in the data
    if (!isWeekend) {
      const entry = {
        date: d.toISOString().split('T')[0],
      };
      
      // Add each discipline's utilization
      disciplines.forEach(discipline => {
        // Generate somewhat consistent but random-looking utilization
        const seed = d.getDate() + discipline.charCodeAt(0);
        entry[discipline] = 50 + Math.round(Math.sin(seed) * 25 + Math.random() * 20);
      });
      
      result.push(entry);
    }
  }
  
  return result;
}

// Generate project data for queries
function generateProjectData({ projects }) {
  return projects.map(id => ({
    name: `Project ${id}`,
    value: 40 + Math.round(Math.random() * 60)
  }));
}

// Generate user data for queries
function generateUserData() {
  // Mock data
  return [
    { name: 'User 1', value: 85 },
    { name: 'User 2', value: 67 },
    { name: 'User 3', value: 92 },
    { name: 'User 4', value: 73 },
    { name: 'User 5', value: 45 }
  ];
}

// Generate sample SQL for the query preview
function generateSampleSQL(type, params) {
  switch (type) {
    case 'discipline':
      return `-- TimescaleDB query for discipline utilization
SELECT 
  time_bucket('1 day', time) as date,
  SUM(CASE WHEN discipline_id = 1 THEN lambda ELSE 0 END) as "Engineering",
  SUM(CASE WHEN discipline_id = 2 THEN lambda ELSE 0 END) as "Design",
  SUM(CASE WHEN discipline_id = 3 THEN lambda ELSE 0 END) as "Product",
  SUM(CASE WHEN discipline_id = 1 THEN mu ELSE 0 END) as "Engineering_Capacity",
  SUM(CASE WHEN discipline_id = 2 THEN mu ELSE 0 END) as "Design_Capacity",
  SUM(CASE WHEN discipline_id = 3 THEN mu ELSE 0 END) as "Product_Capacity"
FROM 
  resource_timeseries
WHERE
  time BETWEEN '${params.startDate}' AND '${params.endDate}'
  AND discipline_id IN (1, 2, 3)
  AND project_id IN (${params.projects.join(', ')})
GROUP BY
  date
ORDER BY
  date;`;
      
    case 'project':
      return `-- TimescaleDB query for project allocation
SELECT 
  p.name,
  SUM(rt.lambda) as allocated,
  SUM(rt.mu) as capacity,
  (SUM(rt.lambda) / SUM(rt.mu)) * 100 as utilization_percentage
FROM 
  resource_timeseries rt
JOIN
  projects p ON rt.project_id = p.id
WHERE
  rt.time BETWEEN '${params.startDate}' AND '${params.endDate}'
  AND rt.project_id IN (${params.projects.join(', ')})
GROUP BY
  p.name
ORDER BY
  utilization_percentage DESC;`;
      
    case 'user':
      return `-- TimescaleDB query for user workload
SELECT 
  u.name,
  SUM(rt.lambda) as workload,
  SUM(rt.mu) as capacity,
  (SUM(rt.lambda) / SUM(rt.mu)) * 100 as utilization_percentage
FROM 
  resource_timeseries rt
JOIN
  users u ON rt.user_id = u.id
WHERE
  rt.time BETWEEN '${params.startDate}' AND '${params.endDate}'
  AND rt.project_id IN (${params.projects.join(', ')})
GROUP BY
  u.name
ORDER BY
  utilization_percentage DESC;`;
  }
}

// Get a consistent color for a discipline
function getColorForDiscipline(discipline) {
  const colors = {
    'Engineering': '#8884d8',
    'Design': '#82ca9d',
    'Product': '#ffc658'
  };
  
  return colors[discipline] || '#8884d8';
}

// Get a consistent color for a state
function getColorForState(stateIndex) {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
    '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
  ];
  
  return colors[stateIndex % colors.length];
}

export default TimeSeriesEPM;
