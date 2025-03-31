import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const ProjectShiftPro = () => {
  // References
  const animationRef = useRef(null);
  
  // Initialize dates for demonstration (3 weeks)
  const startDate = new Date('2025-04-01');
  const endDate = new Date('2025-04-21');
  
  // Time window and animation states
  const [currentDate, setCurrentDate] = useState(new Date('2025-04-01'));
  const [timeWindowSize, setTimeWindowSize] = useState('week'); // 'day', 'week', 'month'
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 2
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeChart, setActiveChart] = useState('stacked'); // 'stacked', 'bar', 'radar'
  const [showMatrixDetails, setShowMatrixDetails] = useState(false);
  
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
  
  // Get current window of dates based on currentDate and timeWindowSize
  const getCurrentTimeWindow = () => {
    const windowStart = new Date(currentDate);
    const windowEnd = new Date(currentDate);
    
    if (timeWindowSize === 'day') {
      // Just the current day
    } else if (timeWindowSize === 'week') {
      // Start of week (Sunday) to end of week (Saturday)
      const day = windowStart.getDay();
      windowStart.setDate(windowStart.getDate() - day);
      windowEnd.setDate(windowEnd.getDate() + (6 - day));
    } else if (timeWindowSize === 'month') {
      // Start of month to end of month
      windowStart.setDate(1);
      windowEnd.setMonth(windowEnd.getMonth() + 1);
      windowEnd.setDate(0);
    }
    
    return {
      start: windowStart,
      end: windowEnd,
      dates: getDatesArray(windowStart, windowEnd)
    };
  };
  
  const currentTimeWindow = getCurrentTimeWindow();
  
  // Initial data
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', hoursPerDay: 8, discipline: 'Development', role: 'Frontend' },
    { id: 2, name: 'Bob Smith', hoursPerDay: 8, discipline: 'Design', role: 'UI/UX' },
    { id: 3, name: 'Carol Davis', hoursPerDay: 6, discipline: 'Development', role: 'Backend' }, // Part-time
    { id: 4, name: 'Dave Wilson', hoursPerDay: 8, discipline: 'QA', role: 'Tester' }
  ]);
  
  const [projects, setProjects] = useState([
    { id: 1, name: 'Website Redesign', priority: 1 },
    { id: 2, name: 'Mobile App Development', priority: 2 },
    { id: 3, name: 'Internal Dashboard', priority: 3 }
  ]);
  
  // Initial tasks that evolve over time to demonstrate animation
  const initialTasks = [
    { id: 1, name: 'Homepage UI', userId: 2, projectId: 1, startDate: new Date('2025-04-01'), endDate: new Date('2025-04-05'), allocation: 75 },
    { id: 2, name: 'Frontend Implementation', userId: 1, projectId: 1, startDate: new Date('2025-04-03'), endDate: new Date('2025-04-10'), allocation: 50 },
    { id: 3, name: 'API Integration', userId: 3, projectId: 1, startDate: new Date('2025-04-08'), endDate: new Date('2025-04-15'), allocation: 100 },
    { id: 4, name: 'Mobile UI Design', userId: 2, projectId: 2, startDate: new Date('2025-04-06'), endDate: new Date('2025-04-12'), allocation: 50 },
    { id: 5, name: 'Dashboard Backend', userId: 3, projectId: 3, startDate: new Date('2025-04-10'), endDate: new Date('2025-04-18'), allocation: 75 },
    { id: 6, name: 'QA Testing', userId: 4, projectId: 1, startDate: new Date('2025-04-11'), endDate: new Date('2025-04-16'), allocation: 100 },
    { id: 7, name: 'Mobile Testing', userId: 4, projectId: 2, startDate: new Date('2025-04-13'), endDate: new Date('2025-04-20'), allocation: 50 }
  ];
  
  // Task changes that happen over time (to demonstrate state changes)
  const taskChanges = [
    { day: '2025-04-05', type: 'complete', taskId: 1 },
    { day: '2025-04-07', type: 'allocation_change', taskId: 2, newAllocation: 75 },
    { day: '2025-04-09', type: 'extend', taskId: 4, newEndDate: new Date('2025-04-14') },
    { day: '2025-04-12', type: 'add', task: { id: 8, name: 'New Requirement', userId: 1, projectId: 1, startDate: new Date('2025-04-12'), endDate: new Date('2025-04-17'), allocation: 25 }},
    { day: '2025-04-15', type: 'allocation_change', taskId: 5, newAllocation: 100 }
  ];
  
  // State for the current tasks based on the current date
  const [tasks, setTasks] = useState([...initialTasks]);
  
  const [timeOff, setTimeOff] = useState([
    { id: 1, userId: 1, startDate: new Date('2025-04-07'), endDate: new Date('2025-04-08'), type: 'Vacation' },
    { id: 2, userId: 2, startDate: new Date('2025-04-15'), endDate: new Date('2025-04-16'), type: 'Personal' },
    { id: 3, userId: 3, startDate: new Date('2025-04-04'), endDate: new Date('2025-04-04'), type: 'Sick' }
  ]);
  
  const [holidays, setHolidays] = useState([
    { id: 1, date: new Date('2025-04-19'), name: 'Company Event' }
  ]);
  
  // Skills matrix: skills proficiency per user (0-1 scale)
  const [skillsMatrix, setSkillsMatrix] = useState([
    // Frontend, Backend, Design, Testing, DevOps
    [0.9, 0.4, 0.3, 0.5, 0.2], // Alice
    [0.3, 0.1, 0.9, 0.2, 0.1], // Bob
    [0.4, 0.9, 0.2, 0.6, 0.7], // Carol
    [0.2, 0.3, 0.1, 0.9, 0.4]  // Dave
  ]);
  
  // Collaboration matrix: how well users work together (0-1 scale)
  const [collaborationMatrix, setCollaborationMatrix] = useState([
    [1.0, 0.8, 0.5, 0.7], // Alice works with: Alice, Bob, Carol, Dave
    [0.8, 1.0, 0.3, 0.6], // Bob works with: Alice, Bob, Carol, Dave
    [0.5, 0.3, 1.0, 0.9], // Carol works with: Alice, Bob, Carol, Dave
    [0.7, 0.6, 0.9, 1.0]  // Dave works with: Alice, Bob, Carol, Dave
  ]);
  
  const skillNames = ['Frontend', 'Backend', 'Design', 'Testing', 'DevOps'];
  
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
  
  // Update tasks based on current date
  useEffect(() => {
    let updatedTasks = [...initialTasks];
    
    // Apply all changes up to the current date
    taskChanges.forEach(change => {
      const changeDate = new Date(change.day);
      
      if (changeDate <= currentDate) {
        if (change.type === 'complete') {
          // Remove completed task
          updatedTasks = updatedTasks.filter(task => task.id !== change.taskId);
        } else if (change.type === 'allocation_change') {
          // Update task allocation
          updatedTasks = updatedTasks.map(task => 
            task.id === change.taskId 
              ? { ...task, allocation: change.newAllocation } 
              : task
          );
        } else if (change.type === 'extend') {
          // Extend task end date
          updatedTasks = updatedTasks.map(task => 
            task.id === change.taskId 
              ? { ...task, endDate: change.newEndDate } 
              : task
          );
        } else if (change.type === 'add') {
          // Add new task
          if (!updatedTasks.some(task => task.id === change.task.id)) {
            updatedTasks.push(change.task);
          }
        }
      }
    });
    
    setTasks(updatedTasks);
  }, [currentDate]);
  
  // Animation control
  useEffect(() => {
    const animate = () => {
      if (isPlaying) {
        setCurrentDate(prevDate => {
          const nextDate = new Date(prevDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          // Stop at the end date
          if (nextDate > endDate) {
            setIsPlaying(false);
            return prevDate;
          }
          
          return nextDate;
        });
        
        // Schedule next frame based on playback speed
        animationRef.current = setTimeout(animate, 1000 / playbackSpeed);
      }
    };
    
    if (isPlaying) {
      animationRef.current = setTimeout(animate, 1000 / playbackSpeed);
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, endDate]);
  
  // Calculate available hours for each user on each date
  const calculateAvailabilityMatrix = () => {
    const availabilityMatrix = [];
    
    users.forEach(user => {
      const userAvailability = [];
      
      currentTimeWindow.dates.forEach(date => {
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
      const userAllocation = Array(currentTimeWindow.dates.length).fill(0);
      
      // Find all tasks assigned to this user
      const userTasks = tasks.filter(task => task.userId === user.id);
      
      userTasks.forEach(task => {
        // Calculate allocation hours for each date within the task's duration
        currentTimeWindow.dates.forEach((date, dateIndex) => {
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
  
  // Calculate project allocation matrix
  const calculateProjectAllocationMatrix = () => {
    const projectMatrix = [];
    
    projects.forEach(project => {
      const projectAllocation = Array(currentTimeWindow.dates.length).fill(0);
      
      // Find all tasks for this project
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      
      projectTasks.forEach(task => {
        // Get the user for this task
        const user = users.find(u => u.id === task.userId);
        if (!user) return;
        
        // Calculate allocation hours for each date within the task's duration
        currentTimeWindow.dates.forEach((date, dateIndex) => {
          if (date >= task.startDate && date <= task.endDate) {
            // Calculate hours based on allocation percentage
            const allocatedHours = (user.hoursPerDay * task.allocation) / 100;
            projectAllocation[dateIndex] += allocatedHours;
          }
        });
      });
      
      projectMatrix.push(projectAllocation);
    });
    
    return projectMatrix;
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
    
    return currentTimeWindow.dates.map((date, dateIndex) => {
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
  
  // Get project allocation data for stacked area chart
  const getProjectAllocationData = () => {
    const projectMatrix = calculateProjectAllocationMatrix();
    
    return currentTimeWindow.dates.map((date, dateIndex) => {
      const dateData = {
        date: formatDate(date),
        dateObj: date,
      };
      
      projects.forEach((project, projectIndex) => {
        dateData[project.name] = projectMatrix[projectIndex][dateIndex];
      });
      
      return dateData;
    });
  };
  
  // Get radar chart data for skills
  const getSkillsRadarData = () => {
    const filteredUsers = getFilteredUsers();
    const filteredUserIds = filteredUsers.map(user => user.id);
    
    // For each skill, get the maximum proficiency across all selected users
    return skillNames.map(skill => {
      const skillIndex = skillNames.indexOf(skill);
      const dataPoint = { skill };
      
      filteredUsers.forEach(user => {
        const userIndex = users.findIndex(u => u.id === user.id);
        dataPoint[user.name] = skillsMatrix[userIndex][skillIndex] * 100;
      });
      
      return dataPoint;
    });
  };
  
  // Determine utilization status color
  const getUtilizationColor = (utilization) => {
    if (utilization > 100) return '#ff4d4d'; // Overallocated (red)
    if (utilization >= 80) return '#6dc36d'; // Well utilized (green)
    return '#7fbdff';                      // Underutilized (blue)
  };
  
  // Calculate current state for matrix display
  const getCurrentMatrixState = () => {
    const availabilityMatrix = calculateAvailabilityMatrix();
    const allocationMatrix = calculateAllocationMatrix();
    const utilizationMatrix = calculateUtilizationMatrix(allocationMatrix, availabilityMatrix);
    
    // For simple display, just get the first day's data if viewing by week/month
    const dayIndex = 0;
    
    const displayMatrices = {
      availability: availabilityMatrix.map(row => [row[dayIndex]]),
      allocation: allocationMatrix.map(row => [row[dayIndex]]),
      utilization: utilizationMatrix.map(row => [row[dayIndex]])
    };
    
    return displayMatrices;
  };
  
  // Playback controls handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleStepForward = () => {
    if (currentDate < endDate) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      setCurrentDate(nextDate);
    }
  };
  
  const handleStepBackward = () => {
    if (currentDate > startDate) {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      setCurrentDate(prevDate);
    }
  };
  
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };
  
  const handleTimeWindowChange = (size) => {
    setTimeWindowSize(size);
  };
  
  // Handle date scrubber change
  const handleDateScrubberChange = (e) => {
    const dayOffset = parseInt(e.target.value);
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + dayOffset);
    setCurrentDate(newDate);
  };
  
  // Calculate total days for scrubber
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  const currentDayOffset = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  
  // Get current matrix state for visualization
  const matrixState = getCurrentMatrixState();
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 md:hidden">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Filter Groups */}
            <div className="space-y-4">
              {/* Resources Filter */}
              <div>
                <h3 className="font-medium mb-2">Resources</h3>
                <div className="space-y-1">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`mobile-user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserFilterChange(user.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`mobile-user-${user.id}`}>{user.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Projects Filter */}
              <div>
                <h3 className="font-medium mb-2">Projects</h3>
                <div className="space-y-1">
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`mobile-project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => handleProjectFilterChange(project.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`mobile-project-${project.id}`}>{project.name}</label>
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
                        id={`mobile-discipline-${discipline}`}
                        checked={selectedDisciplines.includes(discipline)}
                        onChange={() => handleDisciplineFilterChange(discipline)}
                        className="mr-2"
                      />
                      <label htmlFor={`mobile-discipline-${discipline}`}>{discipline}</label>
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
                        id={`mobile-role-${role}`}
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleFilterChange(role)}
                        className="mr-2"
                      />
                      <label htmlFor={`mobile-role-${role}`}>{role}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded w-full"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Main Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 md:p-6 rounded-t-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-0">ProjectShift Pro</h1>
          
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="bg-white bg-opacity-20 text-white py-1 px-3 rounded flex items-center md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          
          {/* Current Date Display */}
          <div className="bg-white bg-opacity-10 rounded px-3 py-1 text-white">
            Current Date: <span className="font-semibold">{formatDate(currentDate)}, {weekdays[currentDate.getDay()]}</span>
          </div>
        </div>
      </div>
      
      {/* Time Scrubber and Controls */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex flex-col space-y-3">
          {/* Date Scrubber */}
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-600 w-20">{formatDate(startDate)}</div>
            <input
              type="range"
              min="0"
              max={totalDays}
              value={currentDayOffset}
              onChange={handleDateScrubberChange}
              className="flex-grow h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-sm font-medium text-gray-600 w-20">{formatDate(endDate)}</div>
          </div>
          
          {/* Playback Controls */}
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleStepBackward}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
                disabled={currentDate <= startDate}
                aria-label="Previous day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handlePlayPause}
                className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} p-2 rounded`}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m-9-3a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={handleStepForward}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
                disabled={currentDate >= endDate}
                aria-label="Next day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Playback Speed */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="bg-white border rounded p-1 text-sm"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
            </div>
            
            {/* Time Window Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">View:</span>
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={() => handleTimeWindowChange('day')}
                  className={`px-2 py-1 text-sm ${timeWindowSize === 'day' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Day
                </button>
                <button
                  onClick={() => handleTimeWindowChange('week')}
                  className={`px-2 py-1 text-sm ${timeWindowSize === 'week' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => handleTimeWindowChange('month')}
                  className={`px-2 py-1 text-sm ${timeWindowSize === 'month' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Month
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 md:flex">
        {/* Filters - Desktop Only */}
        <div className="hidden md:block w-64 bg-gray-50 p-4 rounded-lg mr-4 shrink-0">
          <h2 className="text-lg font-semibold mb-3">Filters</h2>
          
          {/* Resources Filter */}
          <div className="mb-4">
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
          <div className="mb-4">
            <h3 className="font-medium mb-2">Projects</h3>
            <div className="space-y-1">
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
          <div className="mb-4">
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
        
        {/* Main Content */}
        <div className="flex-grow">
          {/* Chart Type Selection */}
          <div className="mb-4 bg-white border rounded-lg p-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Visualization</h2>
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={() => setActiveChart('stacked')}
                  className={`px-3 py-1 text-sm ${activeChart === 'stacked' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Stacked Area
                </button>
                <button
                  onClick={() => setActiveChart('bar')}
                  className={`px-3 py-1 text-sm ${activeChart === 'bar' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setActiveChart('radar')}
                  className={`px-3 py-1 text-sm ${activeChart === 'radar' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Radar
                </button>
              </div>
            </div>
            
            {/* Stacked Area Chart */}
            {activeChart === 'stacked' && (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getProjectAllocationData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} hours`, '']} />
                    <Legend />
                    {projects.map((project, index) => (
                      <Area
                        key={project.id}
                        type="monotone"
                        dataKey={project.name}
                        stackId="1"
                        stroke={`hsl(${(index * 120) % 360}, 70%, 50%)`}
                        fill={`hsl(${(index * 120) % 360}, 70%, 70%)`}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
                <div className="text-center text-sm text-gray-600 mt-2">
                  Project Allocation (Hours) - Stacked by Project
                </div>
              </div>
            )}
            
            {/* Bar Chart */}
            {activeChart === 'bar' && (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getUtilizationData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                    <Legend />
                    {getFilteredUsers().map((user, index) => (
                      <Bar
                        key={user.id}
                        dataKey={user.name}
                        fill={`hsl(${(index * 90) % 360}, 70%, 60%)`}
                      />
                    ))}
                    {/* Reference line for 100% utilization */}
                    <Bar dataKey={() => 100} fill="transparent" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm text-gray-600 mt-2">
                  Resource Utilization (%) - Grouped by Day
                </div>
              </div>
            )}
            
            {/* Radar Chart */}
            {activeChart === 'radar' && (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="80%" data={getSkillsRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    {getFilteredUsers().map((user, index) => (
                      <Radar
                        key={user.id}
                        name={user.name}
                        dataKey={user.name}
                        stroke={`hsl(${(index * 90) % 360}, 70%, 50%)`}
                        fill={`hsl(${(index * 90) % 360}, 70%, 60%)`}
                        fillOpacity={0.6}
                      />
                    ))}
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm text-gray-600 mt-2">
                  Resource Skills Distribution (%)
                </div>
              </div>
            )}
          </div>
          
          {/* Matrix Details Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowMatrixDetails(!showMatrixDetails)}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center w-full"
            >
              <span className="flex-grow text-left font-medium">
                Matrix Operations {showMatrixDetails ? '(Click to Hide)' : '(Click to Show)'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${showMatrixDetails ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Matrix Operations */}
          {showMatrixDetails && (
            <div className="mb-4 bg-white border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Matrix Operations - {formatDate(currentDate)}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Availability Matrix */}
                <div className="border rounded p-3">
                  <h3 className="font-medium mb-2 text-center">Availability Matrix</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-1">Resource</th>
                        <th className="text-center p-1">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixState.availability.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="p-1">{users[rowIndex].name}</td>
                          <td className="text-center p-1">{row[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-xs text-gray-500 mt-2">
                    Hours available per resource, accounting for time off and holidays
                  </div>
                </div>
                
                {/* Allocation Matrix */}
                <div className="border rounded p-3">
                  <h3 className="font-medium mb-2 text-center">Allocation Matrix</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-1">Resource</th>
                        <th className="text-center p-1">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixState.allocation.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="p-1">{users[rowIndex].name}</td>
                          <td className="text-center p-1">{row[0].toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-xs text-gray-500 mt-2">
                    Hours allocated to tasks per resource based on task assignments
                  </div>
                </div>
                
                {/* Utilization Matrix */}
                <div className="border rounded p-3">
                  <h3 className="font-medium mb-2 text-center">Utilization Matrix</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-1">Resource</th>
                        <th className="text-center p-1">Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixState.utilization.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="p-1">{users[rowIndex].name}</td>
                          <td 
                            className="text-center p-1"
                            style={{
                              backgroundColor: getUtilizationColor(row[0] * 100),
                              color: row[0] > 1 ? 'white' : 'black'
                            }}
                          >
                            {(row[0] * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-xs text-gray-500 mt-2">
                    Percentage of available hours allocated (Allocation ÷ Availability)
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Matrix Operations Explained</h3>
                <div className="text-sm">
                  <p>The matrices shown above represent the current state of resource allocation for {formatDate(currentDate)}.</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>
                      <strong>Availability Matrix</strong> (A): Shows available hours for each resource
                    </li>
                    <li>
                      <strong>Allocation Matrix</strong> (B): Shows allocated hours for each resource based on task assignments
                    </li>
                    <li>
                      <strong>Utilization Matrix</strong> (U): Calculated as U = B ÷ A (element-wise division)
                    </li>
                  </ul>
                  
                  <div className="mt-3">
                    <p>As time progresses, these matrices evolve as:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Tasks start and end</li>
                      <li>Time off and holidays occur</li>
                      <li>Task allocations change</li>
                    </ul>
                  </div>
                  
                  <div className="mt-3">
                    <p>Resource states transition between:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li><span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-1"></span> <strong>Underutilized</strong>: &lt; 80% utilization</li>
                      <li><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> <strong>Optimal</strong>: 80-100% utilization</li>
                      <li><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span> <strong>Overallocated</strong>: &gt; 100% utilization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Current Task State */}
          <div className="mb-4 bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Current Task Assignments - {formatDate(currentDate)}</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks
                    .filter(task => 
                      currentDate >= task.startDate && 
                      currentDate <= task.endDate
                    )
                    .map(task => {
                      const project = projects.find(p => p.id === task.projectId);
                      const user = users.find(u => u.id === task.userId);
                      
                      if (!project || !user) return null;
                      
                      return (
                        <tr key={task.id}>
                          <td className="px-3 py-2 whitespace-nowrap">{task.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{project.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{user.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatDate(task.startDate)} - {formatDate(task.endDate)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span 
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                task.allocation > 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {task.allocation}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            
            {tasks.filter(task => 
              currentDate >= task.startDate && 
              currentDate <= task.endDate
            ).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No active tasks on this date
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with Additional Information */}
      <div className="bg-gray-50 p-4 rounded-b-lg border-t">
        <h2 className="text-lg font-semibold mb-3">Matrix Extensions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium mb-2">Tensor Operations</h3>
            <p>
              The time dimension creates a 3D tensor (Users × Days × Metrics) that enables tracking state transitions over time. This allows for:
            </p>
            <ul className="list-disc pl-4 mt-2">
              <li>Trend analysis and forecasting</li>
              <li>Anomaly detection in allocation patterns</li>
              <li>Dynamic resource optimization</li>
            </ul>
          </div>
          
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium mb-2">Skills Matrix Integration</h3>
            <p>
              The skills matrix (Users × Skills) enables more intelligent resource allocation by:
            </p>
            <ul className="list-disc pl-4 mt-2">
              <li>Matching task requirements with resource capabilities</li>
              <li>Identifying skill gaps across teams</li>
              <li>Optimizing team composition based on complementary skills</li>
            </ul>
          </div>
          
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium mb-2">Next Steps</h3>
            <p>
              Future enhancements to the matrix operations include:
            </p>
            <ul className="list-disc pl-4 mt-2">
              <li>Constraint-based optimization for automatic task assignment</li>
              <li>Machine learning for improved resource allocation suggestions</li>
              <li>Risk analysis using Monte Carlo simulations on utilization matrices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectShiftPro;
