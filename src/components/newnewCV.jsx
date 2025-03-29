import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data for demonstrations
const sampleRelationalData = {
  projects: [
    { id: 1, name: "Website Redesign", start_date: "2023-05-01", end_date: "2023-06-15" },
    { id: 2, name: "Mobile App Development", start_date: "2023-05-15", end_date: "2023-07-30" }
  ],
  tasks: [
    { id: 101, project_id: 1, name: "UX Research", start_date: "2023-05-01", end_date: "2023-05-10" },
    { id: 102, project_id: 1, name: "Wireframing", start_date: "2023-05-05", end_date: "2023-05-15" },
    { id: 103, project_id: 1, name: "Frontend Development", start_date: "2023-05-16", end_date: "2023-06-05" },
    { id: 104, project_id: 1, name: "Testing", start_date: "2023-06-01", end_date: "2023-06-15" },
    { id: 201, project_id: 2, name: "Requirements Gathering", start_date: "2023-05-15", end_date: "2023-05-25" },
    { id: 202, project_id: 2, name: "Backend Development", start_date: "2023-05-26", end_date: "2023-06-25" },
    { id: 203, project_id: 2, name: "Mobile UI Implementation", start_date: "2023-06-01", end_date: "2023-07-10" },
    { id: 204, project_id: 2, name: "Testing & QA", start_date: "2023-07-11", end_date: "2023-07-30" }
  ],
  users: [
    { id: 1, name: "Alice Smith", discipline: "UX", role: "Designer", default_hours_per_day: 8 },
    { id: 2, name: "Bob Johnson", discipline: "Frontend", role: "Developer", default_hours_per_day: 8 },
    { id: 3, name: "Carol Williams", discipline: "Backend", role: "Developer", default_hours_per_day: 8 },
    { id: 4, name: "Dave Brown", discipline: "QA", role: "Tester", default_hours_per_day: 8 }
  ],
  allocations: [
    { id: 1001, task_id: 101, user_id: 1, percentage: 100 },
    { id: 1002, task_id: 102, user_id: 1, percentage: 80 },
    { id: 1003, task_id: 102, user_id: 2, percentage: 20 },
    { id: 1004, task_id: 103, user_id: 2, percentage: 100 },
    { id: 1005, task_id: 104, user_id: 4, percentage: 60 },
    { id: 1006, task_id: 201, user_id: 1, percentage: 50 },
    { id: 1007, task_id: 201, user_id: 3, percentage: 50 },
    { id: 1008, task_id: 202, user_id: 3, percentage: 100 },
    { id: 1009, task_id: 203, user_id: 2, percentage: 70 },
    { id: 1010, task_id: 204, user_id: 4, percentage: 100 }
  ],
  holidays: [
    { date: "2023-05-29", name: "Memorial Day" },
    { date: "2023-06-19", name: "Juneteenth" },
    { date: "2023-07-04", name: "Independence Day" }
  ],
  user_availability: [
    { user_id: 1, date: "2023-05-04", availability_hours: 0, reason: "Vacation" },
    { user_id: 1, date: "2023-05-05", availability_hours: 0, reason: "Vacation" },
    { user_id: 2, date: "2023-06-10", availability_hours: 0, reason: "Sick" },
    { user_id: 3, date: "2023-07-05", availability_hours: 0, reason: "Vacation" },
    { user_id: 3, date: "2023-07-06", availability_hours: 0, reason: "Vacation" },
    { user_id: 3, date: "2023-07-07", availability_hours: 0, reason: "Vacation" }
  ]
};

// Generate daily data points from relational data
const generateTimeSeriesData = () => {
  const timeseriesData = [];
  
  // Get date range for all projects
  const startDate = new Date("2023-05-01");
  const endDate = new Date("2023-07-30");
  
  // Create a lookup for holidays
  const holidayLookup = {};
  sampleRelationalData.holidays.forEach(holiday => {
    holidayLookup[holiday.date] = holiday.name;
  });
  
  // Create a lookup for user availability exceptions
  const availabilityLookup = {};
  sampleRelationalData.user_availability.forEach(item => {
    if (!availabilityLookup[item.date]) {
      availabilityLookup[item.date] = {};
    }
    availabilityLookup[item.date][item.user_id] = item.availability_hours;
  });
  
  // Process each day in the date range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const isHoliday = holidayLookup[dateStr] ? true : false;
    const dayOfWeek = currentDate.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    // Initialize data for this day
    const dayData = {
      date: dateStr,
      isHoliday,
      isWeekend,
      totalWorkload: 0,
      totalCapacity: 0,
      byUser: {},
      byDiscipline: {},
      byRole: {},
      byProject: {}
    };
    
    // Initialize capacity for each user
    sampleRelationalData.users.forEach(user => {
      let capacity = 0;
      
      // Check if it's a working day
      if (!isWeekend && !isHoliday) {
        // Check for any availability exceptions
        if (availabilityLookup[dateStr] && availabilityLookup[dateStr][user.id] !== undefined) {
          capacity = availabilityLookup[dateStr][user.id];
        } else {
          capacity = user.default_hours_per_day;
        }
      }
      
      // Initialize user in dayData
      dayData.byUser[user.id] = {
        workload: 0,
        capacity,
        name: user.name,
        discipline: user.discipline,
        role: user.role
      };
      
      // Add to total capacity
      dayData.totalCapacity += capacity;
      
      // Initialize discipline and role if not already done
      if (!dayData.byDiscipline[user.discipline]) {
        dayData.byDiscipline[user.discipline] = { workload: 0, capacity: 0 };
      }
      dayData.byDiscipline[user.discipline].capacity += capacity;
      
      if (!dayData.byRole[user.role]) {
        dayData.byRole[user.role] = { workload: 0, capacity: 0 };
      }
      dayData.byRole[user.role].capacity += capacity;
    });
    
    // Initialize project data
    sampleRelationalData.projects.forEach(project => {
      dayData.byProject[project.id] = { workload: 0, name: project.name };
    });
    
    // Calculate workload based on task allocations
    sampleRelationalData.tasks.forEach(task => {
      const taskStartDate = new Date(task.start_date);
      const taskEndDate = new Date(task.end_date);
      
      // Check if the current date falls within the task duration
      if (currentDate >= taskStartDate && currentDate <= taskEndDate) {
        const project = sampleRelationalData.projects.find(p => p.id === task.project_id);
        
        // Find allocations for this task
        const taskAllocations = sampleRelationalData.allocations.filter(a => a.task_id === task.id);
        
        taskAllocations.forEach(allocation => {
          const user = sampleRelationalData.users.find(u => u.id === allocation.user_id);
          
          // Calculate workload for this allocation on this day
          let workload = 0;
          if (!isWeekend && !isHoliday) {
            const baseWorkload = user.default_hours_per_day * (allocation.percentage / 100);
            // If user has 0 capacity on this day, they can't contribute workload
            if (dayData.byUser[user.id].capacity > 0) {
              workload = baseWorkload;
            }
          }
          
          // Update user workload
          dayData.byUser[user.id].workload += workload;
          
          // Update discipline and role workload
          dayData.byDiscipline[user.discipline].workload += workload;
          dayData.byRole[user.role].workload += workload;
          
          // Update project workload
          dayData.byProject[project.id].workload += workload;
          
          // Update total workload
          dayData.totalWorkload += workload;
        });
      }
    });
    
    // Add the day's data to the timeseries
    timeseriesData.push(dayData);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return timeseriesData;
};

// Pre-compute time series data
const timeSeriesData = generateTimeSeriesData();

// Get summary data for visualization
const generateSummaryData = () => {
  const summary = [];
  
  timeSeriesData.forEach(day => {
    summary.push({
      date: day.date,
      workload: day.totalWorkload,
      capacity: day.totalCapacity,
      utilization: day.totalCapacity > 0 ? (day.totalWorkload / day.totalCapacity) * 100 : 0
    });
  });
  
  return summary;
};

// Get discipline data for visualization
const generateDisciplineData = () => {
  const disciplines = {};
  
  // Initialize with all known disciplines
  sampleRelationalData.users.forEach(user => {
    if (!disciplines[user.discipline]) {
      disciplines[user.discipline] = [];
    }
  });
  
  // Fill in data for each discipline
  Object.keys(disciplines).forEach(discipline => {
    timeSeriesData.forEach(day => {
      if (day.byDiscipline[discipline]) {
        disciplines[discipline].push({
          date: day.date,
          workload: day.byDiscipline[discipline].workload,
          capacity: day.byDiscipline[discipline].capacity,
          utilization: day.byDiscipline[discipline].capacity > 0 
            ? (day.byDiscipline[discipline].workload / day.byDiscipline[discipline].capacity) * 100 
            : 0
        });
      }
    });
  });
  
  return disciplines;
};

// Get project data for visualization
const generateProjectData = () => {
  const projects = {};
  
  // Initialize with all known projects
  sampleRelationalData.projects.forEach(project => {
    projects[project.id] = {
      name: project.name,
      data: []
    };
  });
  
  // Fill in data for each project
  Object.keys(projects).forEach(projectId => {
    timeSeriesData.forEach(day => {
      if (day.byProject[projectId]) {
        projects[projectId].data.push({
          date: day.date,
          workload: day.byProject[projectId].workload
        });
      }
    });
  });
  
  return projects;
};

// Pre-compute summary and dimension data
const summaryData = generateSummaryData();
const disciplineData = generateDisciplineData();
const projectData = generateProjectData();

const BlogHeader = () => (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold mb-2">TimeScale for TimeManagement</h1>
      <h2 className="text-xl text-gray-600">Revolutionizing Our Project Analytics with Time Series Data</h2>
      <div className="mt-2 text-sm text-gray-500">By Shuky Meyer (PE) - July 2023</div>
    </div>
  </div>
);

const PrfaqSection = () => (
  <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg mb-8">
    <h2 className="text-2xl font-bold mb-4">PR/FAQ: Moving to Time Series for Resource Management</h2>
    
    <h3 className="text-xl font-semibold mt-6 mb-2">Problem</h3>
    <p className="mb-4">
      Our enterprise project management system currently stores resource allocation data in a relational database. While this works for basic project tracking, it creates significant performance challenges when analyzing resource utilization across time, particularly when we need to:
    </p>
    <ul className="list-disc ml-8 mb-4">
      <li>Calculate actual vs. available capacity for teams and disciplines over time</li>
      <li>Forecast resource needs based on upcoming project demands</li>
      <li>Analyze historical utilization patterns by role, discipline, or project</li>
      <li>Generate real-time dashboards showing utilization metrics across the organization</li>
    </ul>
    <p className="mb-4">
      These operations require complex joins and date-range calculations that become increasingly slow as our data grows.
    </p>
    
    <h3 className="text-xl font-semibold mt-6 mb-2">Solution</h3>
    <p className="mb-4">
      We're implementing a time series data model using TimescaleDB to transform our resource allocation data from relational structures into daily data points. Each day's record will contain pre-calculated workload (λ) and capacity (μ) metrics for every relevant dimension (user, discipline, role, project).
    </p>
    <p className="mb-4">
      By structuring our data this way, we'll achieve:
    </p>
    <ol className="list-decimal ml-8 mb-4">
      <li>10-100x faster query performance for time-based analytics</li>
      <li>Simplified visualization of resource utilization over time</li>
      <li>More accurate capacity planning with granular daily metrics</li>
      <li>Better scalability as our project portfolio grows</li>
    </ol>
    
    <h3 className="text-xl font-semibold mt-6 mb-2">FAQ</h3>
    <div className="space-y-4 mb-4">
      <div>
        <h4 className="font-bold">Q: Will this replace our existing relational database?</h4>
        <p>
          A: No. We'll maintain our existing Rails/MySQL system for transactional data and CRUD operations. The time series database will be an analytics layer that complements our current system.
        </p>
      </div>
      
      <div>
        <h4 className="font-bold">Q: How will we handle updates to historical data?</h4>
        <p>
          A: Unlike traditional time series use cases, we'll need to support updates to historical data when project plans change. TimescaleDB supports this well since it's built on PostgreSQL. We'll implement efficient update functions that only recompute the affected date ranges.
        </p>
      </div>
      
      <div>
        <h4 className="font-bold">Q: Will this increase our storage requirements?</h4>
        <p>
          A: Yes, there will be some duplication of data. However, TimescaleDB includes compression features that minimize the storage impact. The performance benefits far outweigh the modest increase in storage needs.
        </p>
      </div>
      
      <div>
        <h4 className="font-bold">Q: How will this affect our Rails application?</h4>
        <p>
          A: We'll add a new data service layer that handles the time series operations. Our Rails app will maintain its Active Record implementation for the relational model, with a new adapter for interacting with the time series data.
        </p>
      </div>
    </div>
  </div>
);

const DataModelComparison = () => {
  const [showTimeSeries, setShowTimeSeries] = useState(false);
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4">Data Model Comparison</h2>
      
      <div className="flex justify-center mb-4">
        <button 
          className={`px-4 py-2 rounded-l-lg ${!showTimeSeries ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setShowTimeSeries(false)}
        >
          Relational Model
        </button>
        <button 
          className={`px-4 py-2 rounded-r-lg ${showTimeSeries ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setShowTimeSeries(true)}
        >
          Time Series Model
        </button>
      </div>
      
      {!showTimeSeries ? (
        <div>
          <h3 className="text-xl font-semibold mb-4">Relational Model</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-2">Projects Table</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">ID</th>
                      <th className="border px-4 py-2">Name</th>
                      <th className="border px-4 py-2">Start Date</th>
                      <th className="border px-4 py-2">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRelationalData.projects.map(project => (
                      <tr key={project.id}>
                        <td className="border px-4 py-2">{project.id}</td>
                        <td className="border px-4 py-2">{project.name}</td>
                        <td className="border px-4 py-2">{project.start_date}</td>
                        <td className="border px-4 py-2">{project.end_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">Tasks Table</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">ID</th>
                      <th className="border px-4 py-2">Project ID</th>
                      <th className="border px-4 py-2">Name</th>
                      <th className="border px-4 py-2">Start Date</th>
                      <th className="border px-4 py-2">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRelationalData.tasks.slice(0, 4).map(task => (
                      <tr key={task.id}>
                        <td className="border px-4 py-2">{task.id}</td>
                        <td className="border px-4 py-2">{task.project_id}</td>
                        <td className="border px-4 py-2">{task.name}</td>
                        <td className="border px-4 py-2">{task.start_date}</td>
                        <td className="border px-4 py-2">{task.end_date}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="5" className="border px-4 py-2 text-center text-gray-500">
                        (Showing 4 of {sampleRelationalData.tasks.length} tasks)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">Users Table</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">ID</th>
                      <th className="border px-4 py-2">Name</th>
                      <th className="border px-4 py-2">Discipline</th>
                      <th className="border px-4 py-2">Role</th>
                      <th className="border px-4 py-2">Hours/Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRelationalData.users.map(user => (
                      <tr key={user.id}>
                        <td className="border px-4 py-2">{user.id}</td>
                        <td className="border px-4 py-2">{user.name}</td>
                        <td className="border px-4 py-2">{user.discipline}</td>
                        <td className="border px-4 py-2">{user.role}</td>
                        <td className="border px-4 py-2">{user.default_hours_per_day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">Allocations Table</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">ID</th>
                      <th className="border px-4 py-2">Task ID</th>
                      <th className="border px-4 py-2">User ID</th>
                      <th className="border px-4 py-2">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRelationalData.allocations.slice(0, 5).map(allocation => (
                      <tr key={allocation.id}>
                        <td className="border px-4 py-2">{allocation.id}</td>
                        <td className="border px-4 py-2">{allocation.task_id}</td>
                        <td className="border px-4 py-2">{allocation.user_id}</td>
                        <td className="border px-4 py-2">{allocation.percentage}%</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="4" className="border px-4 py-2 text-center text-gray-500">
                        (Showing 5 of {sampleRelationalData.allocations.length} allocations)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h4 className="font-bold mb-2">Challenges with Relational Model:</h4>
            <ul className="list-disc ml-8">
              <li>Complex joins needed to calculate daily workload and capacity</li>
              <li>Performance degrades with date-range queries across many users and projects</li>
              <li>Difficult to efficiently query trends over time</li>
              <li>Resource-intensive calculations for real-time dashboards</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-4">Time Series Model</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Organization ID</th>
                  <th className="border px-4 py-2">Dimension</th>
                  <th className="border px-4 py-2">Dimension ID</th>
                  <th className="border px-4 py-2">λ (Workload)</th>
                  <th className="border px-4 py-2">μ (Capacity)</th>
                  <th className="border px-4 py-2">Metadata</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2">2023-05-01</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">user</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">8.0</td>
                  <td className="border px-4 py-2">8.0</td>
                  <td className="border px-4 py-2">{"name:Alice,discipline:UX,role:Designer"}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">2023-05-01</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">discipline</td>
                  <td className="border px-4 py-2">UX</td>
                  <td className="border px-4 py-2">8.0</td>
                  <td className="border px-4 py-2">8.0</td>
                  <td className="border px-4 py-2">{"user_count:1"}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">2023-05-01</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">project</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">8.0</td>
                  <td className="border px-4 py-2">null</td>
                  <td className="border px-4 py-2">{"name:Website Redesign"}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">2023-05-02</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">user</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">8.0</td>
                  <td className="border px-4 py-2">8.0</td>
                  <td className="border px-4 py-2">{"name:Alice,discipline:UX,role:Designer"}</td>
                </tr>
                <tr>
                  <td colSpan="7" className="border px-4 py-2 text-center text-gray-500">
                    (Showing 4 of {timeSeriesData.length * 12} sample timeseries records)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h4 className="font-bold mb-2">Benefits of Time Series Model:</h4>
            <ul className="list-disc ml-8">
              <li>Pre-calculated workload (λ) and capacity (μ) metrics for efficient queries</li>
              <li>Optimized for time-range scans with consistent performance</li>
              <li>Easy aggregation across dimensions (users, disciplines, projects)</li>
              <li>Native time-bucketing for flexible reporting periods (day/week/month)</li>
              <li>Efficient compression and retention policies with TimescaleDB</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-200">
        <h4 className="font-bold mb-2">Key Technical Insight:</h4>
        <p>
          By transforming relational allocations (Task spans from start_date to end_date with X% allocation)
          into daily timeseries data points, we convert <strong>computation time</strong> into <strong>storage space</strong>.
          This makes queries dramatically faster at the cost of some redundant storage.
        </p>
      </div>
    </div>
  );
};

const VisualizationDashboard = () => {
  const [selectedDiscipline, setSelectedDiscipline] = useState('UX');
  const [selectedDimension, setSelectedDimension] = useState('overall');
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4">Resource Utilization Dashboard</h2>
      <p className="mb-4">
        This dashboard demonstrates how time series data enables straightforward resource visualization
        across different dimensions and time periods.
      </p>
      
      <div className="flex mb-4">
        <div className="mr-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">View By:</label>
          <select 
            className="border rounded px-2 py-1"
            value={selectedDimension}
            onChange={(e) => setSelectedDimension(e.target.value)}
          >
            <option value="overall">Overall Organization</option>
            <option value="discipline">By Discipline</option>
            <option value="project">By Project</option>
          </select>
        </div>
        
        {selectedDimension === 'discipline' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discipline:</label>
            <select 
              className="border rounded px-2 py-1"
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
            >
              {Object.keys(disciplineData).map(discipline => (
                <option key={discipline} value={discipline}>{discipline}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {selectedDimension === 'overall' ? 'Overall Utilization' : 
           selectedDimension === 'discipline' ? `${selectedDiscipline} Discipline Utilization` :
           'Project Workload'}
        </h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {selectedDimension === 'project' ? (
              <BarChart
                data={Object.values(projectData).map(project => ({
                  name: project.name,
                  workload: project.data.reduce((sum, day) => sum + day.workload, 0)
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Total Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="workload" name="Total Workload" fill="#8884d8" />
              </BarChart>
            ) : (
              <LineChart
                data={selectedDimension === 'overall' ? 
                      summaryData : 
                      disciplineData[selectedDiscipline]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Utilization %', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="workload" name="Workload (λ)" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line yAxisId="left" type="monotone" dataKey="capacity" name="Capacity (μ)" stroke="#82ca9d" />
                <Line yAxisId="right" type="monotone" dataKey="utilization" name="Utilization %" stroke="#ff7300" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
        <h4 className="font-bold mb-2">Visualization Advantage:</h4>
        <p>
          With pre-calculated time series data, these visualizations load almost instantly, even with large datasets.
          The same charts using relational data would require complex queries joining multiple tables and
          performing date-range calculations for each data point.
        </p>
      </div>
    </div>
  );
};

const CodeExamples = () => {
  const [showSimple, setShowSimple] = useState(true);
  
  const simpleSchema = `CREATE TABLE time_metrics (
  time TIMESTAMPTZ NOT NULL,
  org_id INT NOT NULL,
  dimension TEXT NOT NULL, -- 'user', 'discipline', 'role', 'project'
  dimension_id TEXT NOT NULL,
  workload NUMERIC,
  capacity NUMERIC,
  metadata JSONB
);

-- Create TimescaleDB hypertable
SELECT create_hypertable('time_metrics', 'time');

-- Create indices for faster queries
CREATE INDEX ON time_metrics (org_id, dimension, dimension_id);
CREATE INDEX ON time_metrics (dimension, dimension_id, time DESC);`;

  const complexSchema = `-- Create organization table (used for multi-tenant support)
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  settings JSONB
);

-- Create the chunks table for more efficient queries
CREATE TABLE time_chunks (
  id SERIAL PRIMARY KEY,
  org_id INT NOT NULL REFERENCES organizations(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  UNIQUE (org_id, start_date, end_date)
);

-- Create the main time series metrics table
CREATE TABLE time_metrics (
  time TIMESTAMPTZ NOT NULL,
  chunk_id INT NOT NULL REFERENCES time_chunks(id),
  org_id INT NOT NULL REFERENCES organizations(id),
  dimension TEXT NOT NULL, -- 'user', 'discipline', 'role', 'project'
  dimension_id TEXT NOT NULL,
  workload NUMERIC,
  capacity NUMERIC,
  metadata JSONB,
  UNIQUE (time, org_id, dimension, dimension_id)
);

-- Create TimescaleDB hypertable
SELECT create_hypertable('time_metrics', 'time', chunk_time_interval => INTERVAL '1 month');

-- Create indices for faster queries
CREATE INDEX ON time_metrics (org_id, dimension, dimension_id, time DESC);
CREATE INDEX ON time_metrics (chunk_id, dimension);
CREATE INDEX ON time_metrics ((metadata->>'project_id')) WHERE dimension = 'user';

-- Compression policy (enterprise feature)
ALTER TABLE time_metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'org_id,dimension,dimension_id'
);
SELECT add_compression_policy('time_metrics', INTERVAL '7 days');`;

  const backfillFunctionRuby = `def backfill_timeseries_for_task(task_id)
  task = Task.find(task_id)
  project = task.project
  
  # Find all days between task start and end dates
  (task.start_date..task.end_date).each do |date|
    # Skip weekends and holidays
    next if date.saturday? || date.sunday? || Holiday.exists?(date: date)
    
    # Find allocations for this task
    task.allocations.each do |allocation|
      user = allocation.user
      
      # Check user availability for this date
      user_availability = user.availability_for_date(date)
      next if user_availability.hours_available == 0
      
      # Calculate workload hours for this user on this day
      workload = user.default_hours_per_day * (allocation.percentage / 100.0)
      
      # Update time metrics for user dimension
      upsert_time_metric(
        date: date,
        org_id: project.organization_id,
        dimension: 'user',
        dimension_id: user.id,
        workload: workload,
        capacity: user_availability.hours_available,
        metadata: {
          name: user.name,
          discipline: user.discipline,
          role: user.role,
          project_id: project.id
        }
      )
      
      # Update time metrics for discipline dimension
      upsert_time_metric(
        date: date,
        org_id: project.organization_id,
        dimension: 'discipline',
        dimension_id: user.discipline,
        workload: workload,
        capacity: user_availability.hours_available,
        metadata: {}
      )
      
      # Update time metrics for project dimension
      upsert_time_metric(
        date: date,
        org_id: project.organization_id,
        dimension: 'project',
        dimension_id: project.id,
        workload: workload,
        capacity: nil,
        metadata: { name: project.name }
      )
    end
  end
end

def upsert_time_metric(date:, org_id:, dimension:, dimension_id:, workload:, capacity:, metadata:)
  # Construct the SQL for upserting time metrics
  sql = <<-SQL
    INSERT INTO time_metrics (
      time, org_id, dimension, dimension_id, workload, capacity, metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    )
    ON CONFLICT (time, org_id, dimension, dimension_id) 
    DO UPDATE SET
      workload = time_metrics.workload + $5,
      capacity = $6,
      metadata = time_metrics.metadata || $7
  SQL
  
  # Execute the SQL
  ActiveRecord::Base.connection.exec_query(
    sql,
    'Upsert Time Metric',
    [[nil, date], [nil, org_id], [nil, dimension], [nil, dimension_id.to_s], 
     [nil, workload], [nil, capacity], [nil, metadata.to_json]]
  )
end`;

  const simpleQueryExample = `-- Get daily utilization for a discipline over a time range
SELECT 
  time::date as date,
  SUM(workload) as total_workload,
  SUM(capacity) as total_capacity,
  CASE WHEN SUM(capacity) > 0 
       THEN ROUND((SUM(workload) / SUM(capacity)) * 100, 2)
       ELSE 0 
  END as utilization_percentage
FROM time_metrics
WHERE 
  org_id = 1 AND
  dimension = 'discipline' AND
  dimension_id = 'UX' AND
  time BETWEEN '2023-05-01' AND '2023-06-30'
GROUP BY time::date
ORDER BY time::date;`;

  const complexQueryExample = `-- Compare utilization across disciplines for a specific project
WITH project_users AS (
  -- Find all users who worked on this project
  SELECT DISTINCT ((metadata->>'user_id')::int) as user_id
  FROM time_metrics
  WHERE 
    org_id = 1 AND
    dimension = 'project' AND
    dimension_id = '1' AND
    time BETWEEN '2023-05-01' AND '2023-06-30' AND
    metadata ? 'user_id'
),
discipline_stats AS (
  -- Get stats per discipline from user metrics
  SELECT
    time::date as date,
    u.discipline,
    SUM(tm.workload) as project_workload,
    SUM(tm.capacity) as total_capacity
  FROM time_metrics tm
  JOIN users u ON tm.dimension_id = u.id::text
  WHERE
    tm.org_id = 1 AND
    tm.dimension = 'user' AND
    tm.dimension_id::int IN (SELECT user_id FROM project_users) AND
    tm.time BETWEEN '2023-05-01' AND '2023-06-30'
  GROUP BY date, u.discipline
)
-- Calculate weekly averages by discipline
SELECT
  date_trunc('week', date) as week,
  discipline,
  ROUND(AVG(project_workload), 2) as avg_daily_workload,
  ROUND(AVG(total_capacity), 2) as avg_daily_capacity,
  ROUND(AVG(project_workload / NULLIF(total_capacity, 0) * 100), 2) as avg_utilization
FROM discipline_stats
GROUP BY week, discipline
ORDER BY week, discipline;`;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4">Implementation Details</h2>
      
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <button 
            className={`px-4 py-2 rounded-l-lg ${showSimple ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setShowSimple(true)}
          >
            Simple Implementation
          </button>
          <button 
            className={`px-4 py-2 rounded-r-lg ${!showSimple ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setShowSimple(false)}
          >
            Complex Implementation
          </button>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          {showSimple ? 'Basic Schema Design' : 'Advanced Schema Design'}
        </h3>
        
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
          <pre><code>{showSimple ? simpleSchema : complexSchema}</code></pre>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">Backfilling Time Series Data</h3>
        
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
          <pre><code>{backfillFunctionRuby}</code></pre>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">Sample Queries</h3>
        
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
          <pre><code>{showSimple ? simpleQueryExample : complexQueryExample}</code></pre>
        </div>
      </div>
      
      <div className="p-4 bg-green-50 rounded border border-green-200">
        <h4 className="font-bold mb-2">Backfilling Logic:</h4>
        <p className="mb-2">
          The backfill function demonstrates how to handle updates to historical data - a key challenge for this approach.
          When a task or allocation changes:
        </p>
        <ol className="list-decimal ml-8">
          <li>We delete existing time metrics for the affected date range and dimensions</li>
          <li>We recalculate metrics for each day in the range, accounting for holidays and availability</li>
          <li>We update aggregate dimensions (discipline, role, project) alongside user-level metrics</li>
        </ol>
        <p className="mt-2">
          The upsert operation (INSERT... ON CONFLICT... DO UPDATE) efficiently handles cumulative metrics like workload
          while replacing other values like capacity.
        </p>
      </div>
    </div>
  );
};

const RunTimePreparation = () => {
  const [showPrepared, setShowPrepared] = useState(false);
  
  // Sample performance metrics
  const runtimePerformance = [
    { operation: "Daily utilization by user", response_time: 850, description: "SQL JOIN across multiple tables with date calculations" },
    { operation: "Discipline workload for month", response_time: 1200, description: "Complex query with multiple JOINs and GROUP BY" },
    { operation: "Project resource forecast", response_time: 1500, description: "Multiple queries with date range calculations" },
    { operation: "Organization-wide dashboard", response_time: 3200, description: "Multiple dimension aggregations and date calculations" }
  ];
  
  const preparedPerformance = [
    { operation: "Daily utilization by user", response_time: 45, description: "Direct query on time_metrics with simple filter" },
    { operation: "Discipline workload for month", response_time: 65, description: "Simple aggregation query on pre-calculated metrics" },
    { operation: "Project resource forecast", response_time: 85, description: "Single query with time bucketing" },
    { operation: "Organization-wide dashboard", response_time: 120, description: "Parallel dimension queries on pre-calculated metrics" }
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4">Runtime vs Pre-calculated Approach</h2>
      
      <div className="flex justify-center mb-4">
        <button 
          className={`px-4 py-2 rounded-l-lg ${!showPrepared ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setShowPrepared(false)}
        >
          Runtime Calculation
        </button>
        <button 
          className={`px-4 py-2 rounded-r-lg ${showPrepared ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setShowPrepared(true)}
        >
          Pre-calculated Metrics
        </button>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">
          {showPrepared ? 'Pre-calculated Approach' : 'Runtime Calculation Approach'}
        </h3>
        
        <div className="p-4 bg-gray-50 rounded mb-4">
          <h4 className="font-bold mb-2">How It Works:</h4>
          {showPrepared ? (
            <div>
              <p className="mb-2">
                In the pre-calculated approach, we:
              </p>
              <ol className="list-decimal ml-8 mb-4">
                <li>Process allocations into daily data points at the time of creation/update</li>
                <li>Store derived metrics (workload, capacity) for each dimension and time point</li>
                <li>Query the pre-calculated metrics directly when needed</li>
              </ol>
              <p>
                This approach front-loads the computational cost during data changes,
                making queries much faster at the expense of some storage space and write complexity.
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-2">
                In the runtime calculation approach, we:
              </p>
              <ol className="list-decimal ml-8 mb-4">
                <li>Store only the raw allocation data in relational tables</li>
                <li>Perform complex SQL joins and date calculations when metrics are needed</li>
                <li>Calculate workload and capacity metrics on-the-fly for visualizations</li>
              </ol>
              <p>
                This approach minimizes storage requirements and write complexity,
                but results in slower query performance and higher server load for dashboards and reports.
              </p>
            </div>
          )}
        </div>
        
        <h4 className="font-bold mb-2">Sample Query Performance:</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="border px-4 py-2">Operation</th>
                <th className="border px-4 py-2">Response Time (ms)</th>
                <th className="border px-4 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {(showPrepared ? preparedPerformance : runtimePerformance).map((item, i) => (
                <tr key={i}>
                  <td className="border px-4 py-2">{item.operation}</td>
                  <td className="border px-4 py-2 text-center">{item.response_time}</td>
                  <td className="border px-4 py-2">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="w-full max-w-lg">
            <h4 className="font-bold mb-2 text-center">Performance Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={runtimePerformance.map((item, i) => ({
                  name: item.operation,
                  runtime: item.response_time,
                  prepared: preparedPerformance[i].response_time,
                  improvement: (item.response_time / preparedPerformance[i].response_time).toFixed(1) + 'x'
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value, name) => [value + ' ms', name === 'runtime' ? 'Runtime Calculation' : 'Pre-calculated']} />
                <Legend />
                <Bar dataKey="runtime" name="Runtime Calculation" fill="#ff7300" />
                <Bar dataKey="prepared" name="Pre-calculated" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-center text-sm text-gray-500">
              Performance improvement: 15-25x faster with pre-calculated metrics
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 rounded border border-blue-200">
        <h4 className="font-bold mb-2">Cost-Benefit Analysis:</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="border px-4 py-2">Factor</th>
                <th className="border px-4 py-2">Runtime Calculation</th>
                <th className="border px-4 py-2">Pre-calculated Metrics</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Query Performance</td>
                <td className="border px-4 py-2 text-red-500">Slow, especially with large datasets</td>
                <td className="border px-4 py-2 text-green-500">Very fast, consistent performance</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Storage Requirements</td>
                <td className="border px-4 py-2 text-green-500">Minimal, only raw data</td>
                <td className="border px-4 py-2 text-yellow-500">Higher, but TimescaleDB compression helps</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Write Performance</td>
                <td className="border px-4 py-2 text-green-500">Fast, simple inserts/updates</td>
                <td className="border px-4 py-2 text-yellow-500">More complex, batch processing helps</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Real-time Dashboards</td>
                <td className="border px-4 py-2 text-red-500">High server load, slow refresh</td>
                <td className="border px-4 py-2 text-green-500">Low server load, fast refresh</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Implementation Complexity</td>
                <td className="border px-4 py-2 text-green-500">Simple data model</td>
                <td className="border px-4 py-2 text-yellow-500">More complex ETL processes</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Scalability</td>
                <td className="border px-4 py-2 text-red-500">Poor, query time grows with data volume</td>
                <td className="border px-4 py-2 text-green-500">Excellent, query time nearly constant</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const BlogFooter = () => (
  <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg">
    <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
    <ul className="list-disc ml-8 mb-6">
      <li>Develop a proof-of-concept implementation with a subset of projects</li>
      <li>Design and implement the ETL processes for initial data migration</li>
      <li>Implement the Rails adapter for the TimescaleDB integration</li>
      <li>Set up monitoring and performance benchmarks</li>
      <li>Develop a rollout plan for gradually migrating all projects</li>
    </ul>
    
    <div className="text-center">
      <div className="font-medium mb-2">About the Author</div>
      <div className="text-sm text-gray-600">
        Shuky Meyer (PE) is Principal Engineer at Workstack Inc., specializing in database optimization
        and analytics for enterprise project management solutions.
      </div>
    </div>
  </div>
);

const BlogPost = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <BlogHeader />
      <PrfaqSection />
      <DataModelComparison />
      <VisualizationDashboard />
      <CodeExamples />
      <RunTimePreparation />
      <BlogFooter />
    </div>
  );
};

export default BlogPost;