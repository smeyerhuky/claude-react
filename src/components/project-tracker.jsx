import React, { createContext, useReducer, useContext, useState, useEffect } from 'react';
import { Calendar, Home, Users, PlusCircle } from 'lucide-react';

// =========== Context and Reducer ===========
// Define the initial state for our application
const initialState = {
  projects: [],
  tasks: [],
  users: [
    { id: 1, name: 'Alice Johnson', role: 'Developer' },
    { id: 2, name: 'Bob Smith', role: 'Designer' },
    { id: 3, name: 'Carol Williams', role: 'Project Manager' }
  ],
  assignments: []
};

// Define action types
const ActionTypes = {
  ADD_PROJECT: 'ADD_PROJECT',
  ADD_TASK: 'ADD_TASK',
  ADD_USER: 'ADD_USER',
  ASSIGN_TASK: 'ASSIGN_TASK',
  UPDATE_ASSIGNMENT: 'UPDATE_ASSIGNMENT',
  DELETE_TASK: 'DELETE_TASK',
  DELETE_PROJECT: 'DELETE_PROJECT',
  GENERATE_TASKS: 'GENERATE_TASKS'
};

// Reducer function to handle state updates
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_PROJECT:
      return {
        ...state,
        projects: [...state.projects, { 
          ...action.payload, 
          id: Date.now(),
          createdAt: new Date().toISOString()
        }]
      };

    case ActionTypes.ADD_TASK:
      return {
        ...state,
        tasks: [...state.tasks, { 
          ...action.payload, 
          id: Date.now()
        }]
      };

    case ActionTypes.ADD_USER:
      return {
        ...state,
        users: [...state.users, { 
          ...action.payload, 
          id: Date.now()
        }]
      };

    case ActionTypes.ASSIGN_TASK:
      return {
        ...state,
        assignments: [...state.assignments, { 
          ...action.payload, 
          id: Date.now()
        }]
      };

    case ActionTypes.UPDATE_ASSIGNMENT:
      return {
        ...state,
        assignments: state.assignments.map(assignment => 
          assignment.id === action.payload.id ? { ...assignment, ...action.payload } : assignment
        )
      };

    case ActionTypes.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        assignments: state.assignments.filter(assignment => assignment.taskId !== action.payload)
      };

    case ActionTypes.DELETE_PROJECT:
      const taskIdsToDelete = state.tasks
        .filter(task => task.projectId === action.payload)
        .map(task => task.id);
      
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        tasks: state.tasks.filter(task => task.projectId !== action.payload),
        assignments: state.assignments.filter(assignment => 
          !taskIdsToDelete.includes(assignment.taskId)
        )
      };

    case ActionTypes.GENERATE_TASKS: {
      const { projectId, count } = action.payload;
      const today = new Date();
      const newTasks = [];
      
      // Generate random tasks for the project
      for (let i = 0; i < count; i++) {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() + Math.floor(Math.random() * 14)); // Random start within 2 weeks
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 14) + 1); // Random duration 1-14 days
        
        newTasks.push({
          id: Date.now() + i,
          projectId,
          name: `Task ${i + 1}`,
          description: `Auto-generated task ${i + 1}`,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
      }
      
      // Create assignments for each task
      const newAssignments = newTasks.map(task => {
        const randomUserIndex = Math.floor(Math.random() * state.users.length);
        const randomAllocation = Math.floor(Math.random() * 50) + 25; // Random allocation between 25-75%
        
        return {
          id: Date.now() + task.id,
          taskId: task.id,
          userId: state.users[randomUserIndex].id,
          allocationPercentage: randomAllocation
        };
      });
      
      return {
        ...state,
        tasks: [...state.tasks, ...newTasks],
        assignments: [...state.assignments, ...newAssignments]
      };
    }

    default:
      return state;
  }
}

// Create the context
const AppContext = createContext();

// Provider component
const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// =========== Utility Functions ===========

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Get user by ID
const getUserById = (users, userId) => {
  return users.find(user => user.id === userId);
};

// Get task by ID
const getTaskById = (tasks, taskId) => {
  return tasks.find(task => task.id === taskId);
};

// Get project by ID
const getProjectById = (projects, projectId) => {
  return projects.find(project => project.id === projectId);
};

// Calculate total allocation for a user on a specific date
const calculateUserAllocationOnDate = (date, userId, tasks, assignments) => {
  return assignments
    .filter(assignment => assignment.userId === userId)
    .reduce((total, assignment) => {
      const task = getTaskById(tasks, assignment.taskId);
      if (!task) return total;
      
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const checkDate = new Date(date);
      
      // Only count if the date falls within the task's duration
      if (checkDate >= taskStart && checkDate <= taskEnd) {
        return total + assignment.allocationPercentage;
      }
      return total;
    }, 0);
};

// =========== Components ===========

// Header Component
const Header = () => {
  return (
    <header className="bg-blue-600 text-white p-4 shadow">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Project Tracker</h1>
        <nav>
          <ul className="flex space-x-4">
            <li><button className="hover:text-blue-200">Dashboard</button></li>
            <li><button className="hover:text-blue-200">Projects</button></li>
            <li><button className="hover:text-blue-200">Team</button></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

// Sidebar Component
const Sidebar = ({ activeView, setActiveView }) => {
  return (
    <aside className="bg-gray-100 w-64 p-4 h-full">
      <nav>
        <ul className="space-y-2">
          <li>
            <button 
              className={`flex items-center p-2 rounded w-full ${activeView === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              onClick={() => setActiveView('dashboard')}
            >
              <Home className="mr-2" size={18} />
              Dashboard
            </button>
          </li>
          <li>
            <button 
              className={`flex items-center p-2 rounded w-full ${activeView === 'projects' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              onClick={() => setActiveView('projects')}
            >
              <Calendar className="mr-2" size={18} />
              Projects
            </button>
          </li>
          <li>
            <button 
              className={`flex items-center p-2 rounded w-full ${activeView === 'team' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              onClick={() => setActiveView('team')}
            >
              <Users className="mr-2" size={18} />
              Team
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

// Project Form Component
const ProjectForm = () => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    dispatch({
      type: ActionTypes.ADD_PROJECT,
      payload: formData
    });
    
    // Reset form
    setFormData({
      name: '',
      description: ''
    });
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold mb-3">Add New Project</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
          <input
            type="text"
            id="projectName"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="projectDescription"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded"
            rows="3"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Create Project
        </button>
      </form>
    </div>
  );
};

// Task Form Component
const TaskForm = ({ projectId }) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    projectId
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) return;
    
    dispatch({
      type: ActionTypes.ADD_TASK,
      payload: formData
    });
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      projectId
    });
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold mb-3">Add New Task</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">Task Name</label>
          <input
            type="text"
            id="taskName"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="taskDescription"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded"
            rows="2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Add Task
        </button>
      </form>
    </div>
  );
};

// Assignment Form Component
const AssignmentForm = ({ taskId }) => {
  const { state, dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    userId: '',
    allocationPercentage: 50,
    taskId
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'allocationPercentage' ? parseInt(value) : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.userId) return;
    
    dispatch({
      type: ActionTypes.ASSIGN_TASK,
      payload: formData
    });
    
    // Reset form
    setFormData({
      userId: '',
      allocationPercentage: 50,
      taskId
    });
  };

  return (
    <div className="bg-gray-50 p-3 rounded border mt-2">
      <h4 className="text-sm font-medium mb-2">Assign User</h4>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="userId" className="block text-xs font-medium text-gray-700">User</label>
          <select
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            className="mt-1 block w-full p-1.5 text-sm border border-gray-300 rounded"
            required
          >
            <option value="">Select a user</option>
            {state.users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label htmlFor="allocationPercentage" className="block text-xs font-medium text-gray-700">
            Allocation (%)
          </label>
          <input
            type="number"
            id="allocationPercentage"
            name="allocationPercentage"
            value={formData.allocationPercentage}
            onChange={handleChange}
            className="mt-1 block w-full p-1.5 text-sm border border-gray-300 rounded"
            min="1"
            max="100"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded text-sm"
        >
          Assign
        </button>
      </form>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task }) => {
  const { state, dispatch } = useAppContext();
  const [showAssignForm, setShowAssignForm] = useState(false);
  
  const assignmentsForTask = state.assignments.filter(
    assignment => assignment.taskId === task.id
  );

  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch({
        type: ActionTypes.DELETE_TASK,
        payload: task.id
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-3">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{task.name}</h4>
          <p className="text-sm text-gray-600">{task.description}</p>
          <p className="text-sm mt-1">
            <span className="text-gray-500">Duration:</span> {formatDate(task.startDate)} - {formatDate(task.endDate)}
          </p>
        </div>
        <button 
          onClick={handleDeleteTask}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      </div>
      
      {/* Assignments */}
      {assignmentsForTask.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium mb-1">Assignments:</h5>
          <ul className="space-y-1">
            {assignmentsForTask.map(assignment => {
              const user = getUserById(state.users, parseInt(assignment.userId));
              return (
                <li key={assignment.id} className="text-sm flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{user?.name}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                    {assignment.allocationPercentage}% allocation
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      
      {/* Assign Button */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
        >
          <PlusCircle size={16} className="mr-1" />
          {showAssignForm ? 'Cancel' : 'Assign User'}
        </button>
      </div>
      
      {/* Assignment Form */}
      {showAssignForm && <AssignmentForm taskId={task.id} />}
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project }) => {
  const { state, dispatch } = useAppContext();
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  const tasksForProject = state.tasks.filter(
    task => task.projectId === project.id
  );

  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      dispatch({
        type: ActionTypes.DELETE_PROJECT,
        payload: project.id
      });
    }
  };

  const handleGenerateTasks = () => {
    const count = parseInt(prompt('How many tasks would you like to generate?', '5'));
    if (isNaN(count) || count <= 0) return;
    
    dispatch({
      type: ActionTypes.GENERATE_TASKS,
      payload: {
        projectId: project.id,
        count
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="border-b p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold">{project.name}</h3>
            <p className="text-gray-600">{project.description}</p>
            <p className="text-xs text-gray-500 mt-1">Created: {formatDate(project.createdAt)}</p>
          </div>
          <button 
            onClick={handleDeleteProject}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Tasks ({tasksForProject.length})</h4>
          <div className="space-x-2">
            <button
              onClick={handleGenerateTasks}
              className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-sm"
            >
              Generate Tasks
            </button>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
            >
              {showTaskForm ? 'Cancel' : 'Add Task'}
            </button>
          </div>
        </div>
        
        {showTaskForm && <TaskForm projectId={project.id} />}
        
        {tasksForProject.length > 0 ? (
          <div className="space-y-3">
            {tasksForProject.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-4">
            No tasks yet. Add or generate some tasks to get started.
          </p>
        )}
      </div>
    </div>
  );
};

// Timeline Component
const Timeline = () => {
  const { state } = useAppContext();
  const { tasks, assignments, users } = state;
  
  // Generate a 4-week timeline
  const generateTimelineDates = () => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay()); // Start from the beginning of the week
    
    for (let i = 0; i < 28; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const timelineDates = generateTimelineDates();
  
  // Group dates by week for display
  const weeks = [];
  for (let i = 0; i < timelineDates.length; i += 7) {
    weeks.push(timelineDates.slice(i, i + 7));
  }
  
  // Get all tasks that fall within the timeline
  const getTasksForTimeline = () => {
    const startDate = timelineDates[0];
    const endDate = timelineDates[timelineDates.length - 1];
    
    return tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      
      return (taskStart <= endDate && taskEnd >= startDate);
    });
  };
  
  const timelineTasks = getTasksForTimeline();

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Timeline & Resource Allocation</h3>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-max">
          {/* Timeline header */}
          <div className="sticky top-0 bg-gray-100 border-b flex">
            <div className="w-40 p-2 font-medium">User</div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex">
                {week.map((date, dateIndex) => (
                  <div 
                    key={dateIndex} 
                    className={`w-12 p-1 text-center text-xs border-r ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-200' : ''}`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    <div className="text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Timeline body */}
          <div>
            {users.map(user => {
              // Calculate allocation for each date
              const dateAllocations = timelineDates.map(date => {
                return calculateUserAllocationOnDate(
                  date.toISOString().split('T')[0],
                  user.id,
                  tasks,
                  assignments
                );
              });
              
              return (
                <div key={user.id} className="flex border-b hover:bg-gray-50">
                  <div className="w-40 p-2 font-medium">{user.name}</div>
                  {dateAllocations.map((allocation, dateIndex) => (
                    <div 
                      key={dateIndex} 
                      className={`w-12 p-1 text-center border-r ${timelineDates[dateIndex].getDay() === 0 || timelineDates[dateIndex].getDay() === 6 ? 'bg-gray-100' : ''}`}
                    >
                      {allocation > 0 && (
                        <div 
                          className={`text-xs font-medium rounded py-0.5 ${
                            allocation > 100 
                              ? 'bg-red-200 text-red-800' 
                              : allocation > 75 
                                ? 'bg-yellow-200 text-yellow-800' 
                                : 'bg-green-200 text-green-800'
                          }`}
                        >
                          {allocation}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-2 flex space-x-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-200 rounded mr-1"></div>
          <span>1-75% Allocation</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-200 rounded mr-1"></div>
          <span>76-100% Allocation</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-200 rounded mr-1"></div>
          <span>Over-allocated (&gt;100%)</span>
        </div>
      </div>
    </div>
  );
};

// Dashboard View
const DashboardView = () => {
  const { state } = useAppContext();
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium text-gray-500">Total Projects</h3>
          <p className="text-3xl font-bold">{state.projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium text-gray-500">Active Tasks</h3>
          <p className="text-3xl font-bold">{state.tasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium text-gray-500">Team Members</h3>
          <p className="text-3xl font-bold">{state.users.length}</p>
        </div>
      </div>
      
      {/* Timeline */}
      <Timeline />
      
      {/* Recent Activity */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Recent Projects</h3>
        
        {state.projects.length > 0 ? (
          <div>
            {state.projects.slice(0, 3).map(project => (
              <div key={project.id} className="bg-white p-4 rounded shadow mb-3">
                <h4 className="font-semibold">{project.name}</h4>
                <p className="text-sm text-gray-600">{project.description}</p>
                <p className="text-xs text-gray-500 mt-1">Created: {formatDate(project.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-gray-500">No projects yet. Add a new project to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Projects View
const ProjectsView = () => {
  const { state } = useAppContext();
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button
          onClick={() => setShowProjectForm(!showProjectForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
        >
          <PlusCircle size={18} className="mr-1" />
          {showProjectForm ? 'Cancel' : 'New Project'}
        </button>
      </div>
      
      {showProjectForm && <ProjectForm />}
      
      {state.projects.length > 0 ? (
        <div>
          {state.projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-lg text-gray-500">No projects yet. Create a new project to get started.</p>
        </div>
      )}
    </div>
  );
};

// Team View
const TeamView = () => {
  const { state } = useAppContext();
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Team</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Assignments</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Allocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {state.users.map(user => {
              // Get assignments for this user
              const userAssignments = state.assignments.filter(
                assignment => parseInt(assignment.userId) === user.id
              );
              
              // Calculate total allocation
              const today = new Date().toISOString().split('T')[0];
              const currentAllocation = calculateUserAllocationOnDate(
                today, 
                user.id, 
                state.tasks, 
                state.assignments
              );
              
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium">{user.name}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{user.role}</td>
                  <td className="py-4 px-4">
                    {userAssignments.length > 0 ? (
                      <div className="text-sm">
                        {userAssignments.length} active tasks
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No active assignments</div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-block px-2 py-1 rounded text-sm ${
                      currentAllocation > 100 
                        ? 'bg-red-100 text-red-800' 
                        : currentAllocation > 75 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : currentAllocation > 0 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currentAllocation}% allocated today
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main App Component
const ProjectTracker = () => {
  const [activeView, setActiveView] = useState('dashboard');
  
  // Render the active view
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'team':
        return <TeamView />;
      default:
        return <DashboardView />;
    }
  };
  
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <main className="flex-1 p-6 overflow-auto">
            {renderActiveView()}
          </main>
        </div>
      </div>
    </AppProvider>
  );
};

export default ProjectTracker;