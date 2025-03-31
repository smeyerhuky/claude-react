import React, { useState, useEffect } from 'react';
import * as math from 'mathjs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProjectShift = () => {
  // Initialize dates for demonstration (3 weeks)
  const startDate = new Date('2025-04-01');
  const endDate = new Date('2025-04-21');
  
  // Generate array of dates between start and end
  const getDatesArray = (start, end) => {
    const dates = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };
  
  const allDates = getDatesArray(startDate, endDate);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Format date as MM/DD
  const formatDate = (date) => {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  
  // Initial data
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', hoursPerDay: 8, discipline: 'Development', role: 'Frontend' },
    { id: 2, name: 'Bob Smith', hoursPerDay: 8, discipline: 'Design', role: 'UI/UX' },
    { id: 3, name: 'Carol Davis', hoursPerDay: 6, discipline: 'Development', role: 'Backend' }, // Part-time
    { id: 4, name: 'Dave Wilson', hoursPerDay: 8, discipline: 'QA', role: 'Tester' }
  ]);
  
  const [projects, setProjects] = useState([
    { id: 1, name: 'Website Redesign' },
    { id: 2, name: 'Mobile App Development' },
    { id: 3, name: 'Internal Dashboard' }
  ]);
  
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Homepage UI', userId: 2, projectId: 1, startDate: new Date('2025-04-01'), endDate: new Date('2025-04-05'), allocation: 75 },
    { id: 2, name: 'Frontend Implementation', userId: 1, projectId: 1, startDate: new Date('2025-04-03'), endDate: new Date('2025-04-10'), allocation: 50 },
    { id: 3, name: 'API Integration', userId: 3, projectId: 1, startDate: new Date('2025-04-08'), endDate: new Date('2025-04-15'), allocation: 100 },
    { id: 4, name: 'Mobile UI Design', userId: 2, projectId: 2, startDate: new Date('2025-04-06'), endDate: new Date('2025-04-12'), allocation: 50 },
    { id: 5, name: 'Dashboard Backend', userId: 3, projectId: 3, startDate: new Date('2025-04-10'), endDate: new Date('2025-04-18'), allocation: 75 },
    { id: 6, name: 'QA Testing', userId: 4, projectId: 1, startDate: new Date('2025-04-11'), endDate: new Date('2025-04-16'), allocation: 100 },
    { id: 7, name: 'Mobile Testing', userId: 4, projectId: 2, startDate: new Date('2025-04-13'), endDate: new Date('2025-04-20'), allocation: 50 }
  ]);
  
  const [timeOff, setTimeOff] = useState([
    { id: 1, userId: 1, startDate: new Date('2025-04-07'), endDate: new Date('2025-04-08'), type: 'Vacation' },
    { id: 2, userId: 2, startDate: new Date('2025-04-15'), endDate: new Date('2025-04-16'), type: 'Personal' },
    { id: 3, userId: 3, startDate: new Date('2025-04-04'), endDate: new Date('2025-04-04'), type: 'Sick' }
  ]);
  
  const [holidays, setHolidays] = useState([
    { id: 1, date: new Date('2025-04-19'), name: 'Company Event' }
  ]);
  
  // Filter states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  // Get unique disciplines and roles for filtering
  const disciplines = [...new Set(users.map(user => user.discipline))];
  const roles = [...new Set(users.map(user => user.role))];
  
  // Function to check if a date is a holiday
  const isHoliday = (date) => {
    return holidays.some(holiday => 
      holiday.date.getFullYear() === date.getFullYear() &&
      holiday.date.getMonth() === date.getMonth() &&
      holiday.date.getDate() === date.getDate()
    );
  };
  
  // Function to check if a user has time off on a specific date
  const hasTimeOff = (userId, date) => {
    return timeOff.some(item => 
      item.userId === userId &&
      date >= item.startDate &&
      date <= item.endDate
    );
  };
  
  // Calculate available hours for each user on each date
  const calculateAvailabilityMatrix = () => {
    const availabilityMatrix = [];
    
    users.forEach(user => {
      const userAvailability = [];
      
      allDates.forEach(date => {
        // Weekend check (0 = Sunday, 6 = Saturday)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // Check for holiday or time off
        const isUserTimeOff = hasTimeOff(user.id, date);
        const isCompanyHoliday = isHoliday(date);
        
        // Available hours
        let availableHours = 0;
        if (!isWeekend && !isUserTimeOff && !isCompanyHoliday) {
          availableHours = user.hoursPerDay;
        }
        
        userAvailability.push(availableHours);
      });
      
      availabilityMatrix.push(userAvailability);
    });
    
    return availabilityMatrix;
  };
  
  // Calculate allocation matrix based on tasks
  const calculateAllocationMatrix = () => {
    const allocationMatrix = [];
    
    users.forEach(user => {
      const userAllocation = Array(allDates.length).fill(0);
      
      // Find all tasks assigned to this user
      const userTasks = tasks.filter(task => task.userId === user.id);
      
      userTasks.forEach(task => {
        // Calculate allocation hours for each date within the task's duration
        allDates.forEach((date, dateIndex) => {
          if (date >= task.startDate && date <= task.endDate) {
            // Calculate hours based on allocation percentage
            const allocatedHours = (user.hoursPerDay * task.allocation) / 100;
            userAllocation[dateIndex] += allocatedHours;
          }
        });
      });
      
      allocationMatrix.push(userAllocation);
    });
    
    return allocationMatrix;
  };
  
  // Calculate utilization matrix (allocation / availability)
  const calculateUtilizationMatrix = (allocationMatrix, availabilityMatrix) => {
    return allocationMatrix.map((userAllocation, userIndex) => {
      const userAvailability = availabilityMatrix[userIndex];
      
      return userAllocation.map((allocatedHours, dateIndex) => {
        const availableHours = userAvailability[dateIndex];
        
        // Avoid division by zero
        if (availableHours === 0) return 0;
        
        return allocatedHours / availableHours;
      });
    });
  };
  
  // Apply filters to users
  const getFilteredUsers = () => {
    let filteredUsers = [...users];
    
    if (selectedUsers.length > 0) {
      filteredUsers = filteredUsers.filter(user => selectedUsers.includes(user.id));
    }
    
    if (selectedDisciplines.length > 0) {
      filteredUsers = filteredUsers.filter(user => selectedDisciplines.includes(user.discipline));
    }
    
    if (selectedRoles.length > 0) {
      filteredUsers = filteredUsers.filter(user => selectedRoles.includes(user.role));
    }
    
    return filteredUsers;
  };
  
  // Apply filters to tasks
  const getFilteredTasks = (filteredUsers) => {
    let filteredTasks = [...tasks];
    
    // Filter by selected users
    filteredTasks = filteredTasks.filter(task => 
      filteredUsers.some(user => user.id === task.userId)
    );
    
    // Filter by selected projects
    if (selectedProjects.length > 0) {
      filteredTasks = filteredTasks.filter(task => selectedProjects.includes(task.projectId));
    }
    
    return filteredTasks;
  };
  
  // Get filtered matrices
  const getFilteredMatrices = () => {
    const filteredUsers = getFilteredUsers();
    const filteredUserIds = filteredUsers.map(user => user.id);
    
    // Filter the original matrices to include only selected users
    const availabilityMatrix = calculateAvailabilityMatrix().filter((_, index) => 
      filteredUserIds.includes(users[index].id)
    );
    
    const allocationMatrix = calculateAllocationMatrix().filter((_, index) => 
      filteredUserIds.includes(users[index].id)
    );
    
    const utilizationMatrix = calculateUtilizationMatrix(allocationMatrix, availabilityMatrix);
    
    return {
      availability: availabilityMatrix,
      allocation: allocationMatrix,
      utilization: utilizationMatrix,
      users: filteredUsers
    };
  };
  
  // Handle filter changes
  const handleUserFilterChange = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  const handleProjectFilterChange = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };
  
  const handleDisciplineFilterChange = (discipline) => {
    setSelectedDisciplines(prev => {
      if (prev.includes(discipline)) {
        return prev.filter(d => d !== discipline);
      } else {
        return [...prev, discipline];
      }
    });
  };
  
  const handleRoleFilterChange = (role) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };
  
  // Calculate resource utilization data for visualization
  const getUtilizationData = () => {
    const { utilization, users: filteredUsers } = getFilteredMatrices();
    
    return allDates.map((date, dateIndex) => {
      const dateData = {
        date: formatDate(date),
        dateObj: date,
      };
      
      filteredUsers.forEach((user, userIndex) => {
        const utilRate = utilization[userIndex][dateIndex];
        dateData[`${user.name}`] = Number((utilRate * 100).toFixed(1));
      });
      
      return dateData;
    });
  };
  
  // Prepare summary data
  const getUtilizationSummary = () => {
    const { utilization, users: filteredUsers } = getFilteredMatrices();
    
    return filteredUsers.map((user, userIndex) => {
      const userUtilization = utilization[userIndex];
      
      // Calculate average utilization for working days only
      const workingDaysUtil = [];
      userUtilization.forEach((util, dateIndex) => {
        const date = allDates[dateIndex];
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHol = isHoliday(date);
        const isOff = hasTimeOff(user.id, date);
        
        if (!isWeekend && !isHol && !isOff) {
          workingDaysUtil.push(util);
        }
      });
      
      const avgUtilization = workingDaysUtil.length > 0 
        ? workingDaysUtil.reduce((sum, val) => sum + val, 0) / workingDaysUtil.length 
        : 0;
      
      // Find peak utilization
      const peakUtilization = Math.max(...userUtilization);
      
      // Count overallocated days (>100%)
      const overallocatedDays = userUtilization.filter(util => util > 1).length;
      
      return {
        user: user.name,
        avgUtilization: Number((avgUtilization * 100).toFixed(1)),
        peakUtilization: Number((peakUtilization * 100).toFixed(1)),
        overallocatedDays
      };
    });
  };
  
  // Determine utilization status color
  const getUtilizationColor = (utilization) => {
    if (utilization > 100) return '#ff4d4d'; // Overallocated (red)
    if (utilization >= 80) return '#6dc36d'; // Well utilized (green)
    return '#7fbdff';                      // Underutilized (blue)
  };
  
  // Generate example of matrix operations
  const generateMatrixOperationsExample = () => {
    // Create small example matrices
    const userAvailability = [
      [8, 8, 0, 0, 8], // User 1: 8hrs Mon-Tue, weekend, Mon
      [6, 6, 0, 0, 0]  // User 2: 6hrs Mon-Tue, weekend, Time off
    ];
    
    const taskAllocation = [
      [4, 6, 0, 0, 3], // User 1 allocations
      [3, 4, 0, 0, 0]  // User 2 allocations
    ];
    
    // Calculate utilization with math.js
    const utilization = math.dotDivide(taskAllocation, userAvailability).map(row => 
      row.map(cell => isNaN(cell) || !isFinite(cell) ? 0 : cell)
    );
    
    return {
      availability: userAvailability,
      allocation: taskAllocation,
      utilization: utilization
    };
  };
  
  const matrixExample = generateMatrixOperationsExample();
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">ProjectShift: Matrix-Based Resource Management</h1>
      
      {/* Filters Section */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Users Filter */}
          <div>
            <h3 className="font-medium mb-2">Resources</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {users.map(user => (
                <div key={user.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserFilterChange(user.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`user-${user.id}`}>{user.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Projects Filter */}
          <div>
            <h3 className="font-medium mb-2">Projects</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {projects.map(project => (
                <div key={project.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => handleProjectFilterChange(project.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`project-${project.id}`}>{project.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Disciplines Filter */}
          <div>
            <h3 className="font-medium mb-2">Disciplines</h3>
            <div className="space-y-1">
              {disciplines.map(discipline => (
                <div key={discipline} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`discipline-${discipline}`}
                    checked={selectedDisciplines.includes(discipline)}
                    onChange={() => handleDisciplineFilterChange(discipline)}
                    className="mr-2"
                  />
                  <label htmlFor={`discipline-${discipline}`}>{discipline}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Roles Filter */}
          <div>
            <h3 className="font-medium mb-2">Roles</h3>
            <div className="space-y-1">
              {roles.map(role => (
                <div key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleFilterChange(role)}
                    className="mr-2"
                  />
                  <label htmlFor={`role-${role}`}>{role}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Resource Utilization Chart */}
      <div className="mb-8 bg-white p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-3">Resource Utilization Over Time</h2>
        <p className="text-sm text-gray-600 mb-4">
          Shows percentage of available capacity utilized per resource per day. Values over 100% indicate overallocation.
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={getUtilizationData()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth()+1}`;
                }}
              />
              <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => [`${value}%`, '']}
                labelFormatter={(label) => {
                  const dateStr = label;
                  return `${dateStr}`;
                }}
              />
              <Legend />
              {getFilteredUsers().map((user, index) => (
                <Line 
                  key={user.id}
                  type="monotone" 
                  dataKey={user.name} 
                  stroke={`hsl(${(index * 137) % 360}, 70%, 50%)`} 
                  activeDot={{ r: 8 }}
                />
              ))}
              {/* Reference line for 100% utilization */}
              <Line 
                dataKey={() => 100} 
                stroke="red" 
                strokeDasharray="3 3" 
                dot={false}
                activeDot={false}
                label={{ value: '100%', position: 'right' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Resource Utilization Summary */}
      <div className="mb-8 bg-white p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-3">Resource Utilization Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Utilization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Utilization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overallocated Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUtilizationSummary().map((summary, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{summary.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{summary.avgUtilization}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{summary.peakUtilization}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{summary.overallocatedDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{ 
                        backgroundColor: getUtilizationColor(summary.peakUtilization),
                        color: summary.peakUtilization > 100 ? 'white' : 'black'
                      }}
                    >
                      {summary.peakUtilization > 100 ? 'Overallocated' : 
                       summary.avgUtilization >= 80 ? 'Well Utilized' : 'Underutilized'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Task Calendar View */}
      <div className="mb-8 bg-white p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-3">Task Calendar</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                {allDates.map((date, index) => (
                  <th key={index} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{
                    backgroundColor: (date.getDay() === 0 || date.getDay() === 6) ? '#f3f4f6' : 
                                     isHoliday(date) ? '#fee2e2' : '#fff'
                  }}>
                    <div>{formatDate(date)}</div>
                    <div>{weekdays[date.getDay()]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredUsers().map((user, userIndex) => {
                const { utilization } = getFilteredMatrices();
                const userTasks = tasks.filter(task => task.userId === user.id);
                
                return (
                  <tr key={user.id}>
                    <td className="px-2 py-2 whitespace-nowrap">{user.name}</td>
                    {allDates.map((date, dateIndex) => {
                      const userUtil = utilization[userIndex] ? utilization[userIndex][dateIndex] : 0;
                      const isOff = hasTimeOff(user.id, date);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isHol = isHoliday(date);
                      
                      // Get tasks active on this date
                      const activeTasks = userTasks.filter(task => 
                        date >= task.startDate && date <= task.endDate
                      );
                      
                      const taskTooltip = activeTasks.length > 0
                        ? activeTasks.map(task => `${task.name} (${task.allocation}%)`).join('\n')
                        : 'No tasks';
                      
                      return (
                        <td 
                          key={dateIndex} 
                          className="px-2 py-2 text-center whitespace-nowrap"
                          style={{
                            backgroundColor: isWeekend || isHol ? '#f3f4f6' :
                                           isOff ? '#fee2e2' :
                                           userUtil > 1 ? '#fee2e2' :
                                           userUtil >= 0.8 ? '#d1fae5' :
                                           userUtil > 0 ? '#e0f2fe' : '#fff',
                          }}
                          title={isOff ? 'Time Off' : taskTooltip}
                        >
                          {isOff ? 'OFF' : userUtil > 0 ? `${Math.round(userUtil * 100)}%` : ''}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Matrix Operations Section */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Matrix Operations Explained</h2>
        <p className="mb-4">
          ProjectShift uses three primary matrices to calculate resource utilization:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium mb-2">Availability Matrix</h3>
            <p className="text-sm mb-2">Available hours per resource per day, accounting for:</p>
            <ul className="text-sm list-disc pl-5 mb-2">
              <li>Standard working hours</li>
              <li>Weekends (zero hours)</li>
              <li>Time off (zero hours)</li>
              <li>Holidays (zero hours)</li>
            </ul>
            <p className="text-xs text-gray-500">Dimensions: [Users × Days]</p>
          </div>
          
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium mb-2">Allocation Matrix</h3>
            <p className="text-sm mb-2">Allocated hours per resource per day based on:</p>
            <ul className="text-sm list-disc pl-5 mb-2">
              <li>Tasks assigned to the resource</li>
              <li>Task start and end dates</li>
              <li>Allocation percentage per task</li>
              <li>Resource standard hours</li>
            </ul>
            <p className="text-xs text-gray-500">Dimensions: [Users × Days]</p>
          </div>
          
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium mb-2">Utilization Matrix</h3>
            <p className="text-sm mb-2">Calculated by dividing allocated hours by available hours:</p>
            <div className="text-center font-bold my-2">Utilization = Allocation ÷ Availability</div>
            <p className="text-sm">Values greater than 1.0 indicate overallocation.</p>
            <p className="text-xs text-gray-500">Dimensions: [Users × Days]</p>
          </div>
        </div>
        
        <h3 className="font-medium mb-2">Example Matrix Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Availability Matrix</h4>
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">User/Day</th>
                  <th className="border px-2 py-1">Mon</th>
                  <th className="border px-2 py-1">Tue</th>
                  <th className="border px-2 py-1">Sat</th>
                  <th className="border px-2 py-1">Sun</th>
                  <th className="border px-2 py-1">Mon</th>
                </tr>
              </thead>
              <tbody>
                {matrixExample.availability.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="border px-2 py-1">User {rowIndex + 1}</th>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border px-2 py-1 text-center">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Allocation Matrix</h4>
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">User/Day</th>
                  <th className="border px-2 py-1">Mon</th>
                  <th className="border px-2 py-1">Tue</th>
                  <th className="border px-2 py-1">Sat</th>
                  <th className="border px-2 py-1">Sun</th>
                  <th className="border px-2 py-1">Mon</th>
                </tr>
              </thead>
              <tbody>
                {matrixExample.allocation.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="border px-2 py-1">User {rowIndex + 1}</th>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border px-2 py-1 text-center">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Utilization Matrix</h4>
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">User/Day</th>
                  <th className="border px-2 py-1">Mon</th>
                  <th className="border px-2 py-1">Tue</th>
                  <th className="border px-2 py-1">Sat</th>
                  <th className="border px-2 py-1">Sun</th>
                  <th className="border px-2 py-1">Mon</th>
                </tr>
              </thead>
              <tbody>
                {matrixExample.utilization.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="border px-2 py-1">User {rowIndex + 1}</th>
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className="border px-2 py-1 text-center"
                        style={{
                          backgroundColor: cell > 1 ? '#fee2e2' :
                                         cell >= 0.8 ? '#d1fae5' :
                                         cell > 0 ? '#e0f2fe' : '#fff'
                        }}
                      >
                        {cell > 0 ? `${(cell * 100).toFixed(0)}%` : '0%'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="text-sm">
          <p>In this example:</p>
          <ul className="list-disc pl-5 mt-2 mb-4">
            <li>User 1 is overallocated on Tuesday (75% allocation on 8hrs availability)</li>
            <li>User 1 has 50% utilization on Monday (4hrs allocation on 8hrs availability)</li>
            <li>Weekend days have zero availability, so no utilization is calculated</li>
            <li>User 2 is unavailable on Monday (time off), so no utilization is calculated</li>
          </ul>
        </div>
      </div>
      
      {/* TimeSeries and Extension Section */}
      <div className="mb-8 bg-white p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-3">Extending the System with TimeSeries Concepts</h2>
        
        <p className="mb-4">
          The current matrix-based approach can be further enhanced using timeseries database concepts:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">TimeSeries Data Structure</h3>
            <p className="text-sm mb-3">
              Instead of using dense matrices, we can store allocation data in a timeseries format:
            </p>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
{`{
  "metric": "allocation",
  "tags": {
    "user_id": 1,
    "task_id": 2,
    "project_id": 1,
    "discipline": "Development",
    "role": "Frontend"
  },
  "timestamp": "2025-04-01T00:00:00Z",
  "value": 4.0  // Hours allocated
}`}
            </pre>
            <p className="text-sm mt-2">
              This approach allows for efficient storage and retrieval of time-based data, with O(1) inserts and efficient range queries.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Advantages</h3>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Efficient for sparse data (most days have no allocation for most user/task combinations)</li>
              <li>Easy to filter by any combination of tags (user, project, discipline, etc.)</li>
              <li>Scales better with time range expansion (e.g., planning a year ahead)</li>
              <li>Better performance for time-range queries (e.g., "show me next month's allocations")</li>
              <li>Can easily store historical allocation changes for auditing</li>
              <li>Facilitates complex aggregations like "utilization by discipline over time"</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Matrix Operations in a TimeSeries Context</h3>
          <p className="text-sm mb-3">
            Even with a timeseries database, we can still leverage matrix operations by:
          </p>
          <ol className="text-sm list-decimal pl-5 space-y-1">
            <li>Querying the raw timeseries data for a specific date range</li>
            <li>Transforming it into dense matrices for specific calculations</li>
            <li>Applying matrix operations (addition, multiplication, division)</li>
            <li>Storing the results back as timeseries data if needed</li>
          </ol>
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Example: Calculating Team Capacity</h4>
            <p className="text-sm">
              To calculate total capacity across teams, we can use matrix multiplication:
            </p>
            <pre className="bg-white p-2 mt-2 rounded text-xs overflow-x-auto">
{`// Matrix of users (rows) and skills (columns) with skill levels (0-1)
const skillMatrix = [
  [0.8, 0.4, 0.1],  // User 1: [Frontend, Backend, Design]
  [0.2, 0.9, 0.0],  // User 2: [Frontend, Backend, Design]
  [0.5, 0.2, 0.9]   // User 3: [Frontend, Backend, Design]
];

// Vector of availability percentage for each user
const availabilityVector = [
  [0.75],  // User 1: 75% available
  [1.0],   // User 2: 100% available
  [0.5]    // User 3: 50% available
];

// Calculate effective capacity per skill
const teamCapacity = math.multiply(
  math.transpose(skillMatrix),
  availabilityVector
);

// Result: capacity per skill area
// [0.8*0.75 + 0.2*1.0 + 0.5*0.5, 0.4*0.75 + 0.9*1.0 + 0.2*0.5, ...]
// = [0.85, 1.3, 0.53]`}
            </pre>
          </div>
        </div>
      </div>
      
      {/* Next Steps Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Next Steps for ProjectShift</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Near-Term Enhancements</h3>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Implement editable task and time-off entries in the UI</li>
              <li>Add drag-and-drop functionality for task scheduling</li>
              <li>Create project timeline views with task dependencies</li>
              <li>Add forecasting for future capacity requirements</li>
              <li>Implement automated over-allocation detection and alerting</li>
              <li>Add role-based capacity planning views</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Advanced Features</h3>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Implement skill matrices for better resource matching</li>
              <li>Add Monte Carlo simulations for project completion forecasting</li>
              <li>Create optimization algorithms for resource allocation</li>
              <li>Integrate with actual time tracking systems for utilization vs. reality comparisons</li>
              <li>Implement machine learning for predicting task duration based on historical data</li>
              <li>Add what-if scenario planning capabilities</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Architecture Evolution</h3>
          <p className="text-sm mb-3">
            To scale this system for enterprise use, consider these architectural enhancements:
          </p>
          <ol className="text-sm list-decimal pl-5 space-y-1">
            <li>Move to a dedicated timeseries database (InfluxDB, TimescaleDB) for better performance with large datasets</li>
            <li>Implement a caching layer for frequently accessed calculations</li>
            <li>Create a dedicated calculation service for complex matrix operations</li>
            <li>Develop a robust API for integration with other systems (HR, project management, time tracking)</li>
            <li>Implement real-time updates using WebSockets for collaborative planning</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ProjectShift;
