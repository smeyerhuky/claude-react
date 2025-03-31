import React, { useState, useEffect } from 'react';
import * as math from 'mathjs';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';

const ProjectShiftEditor = () => {
  // Date formatting utilities
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = d.toLocaleString('default', { month: 'short' });
    return `${month} ${d.getDate()}, ${d.getFullYear()}`;
  };
  
  // Initialize state with demo data
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', hoursPerDay: 8, discipline: 'Development', role: 'Frontend' },
    { id: 2, name: 'Bob Smith', hoursPerDay: 8, discipline: 'Design', role: 'UI/UX' },
    { id: 3, name: 'Carol Davis', hoursPerDay: 6, discipline: 'Development', role: 'Backend' },
    { id: 4, name: 'Dave Wilson', hoursPerDay: 8, discipline: 'QA', role: 'Tester' }
  ]);
  
  const [projects, setProjects] = useState([
    { id: 1, name: 'Website Redesign', startDate: new Date('2025-04-01'), endDate: new Date('2025-04-15') },
    { id: 2, name: 'Mobile App Development', startDate: new Date('2025-04-06'), endDate: new Date('2025-04-20') },
    { id: 3, name: 'Internal Dashboard', startDate: new Date('2025-04-10'), endDate: new Date('2025-04-25') }
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
  
  // Form state for adding/editing items
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editMode, setEditMode] = useState(null); // null, 'add', 'edit'
  const [editFormData, setEditFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'delete', 'validation'
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [editingEntityType, setEditingEntityType] = useState(null); // 'user', 'project', 'task', etc.
  
  // Initialize dates for visualization (fixed for demo)
  const startDate = new Date('2025-04-01');
  const endDate = new Date('2025-04-30');
  
  // Generate array of dates for vizualization
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
  
  // Generate unique IDs for new items
  const generateId = (collection) => {
    return Math.max(0, ...collection.map(item => item.id)) + 1;
  };
  
  // Update project dates based on tasks
  useEffect(() => {
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        
        if (projectTasks.length === 0) {
          return project;
        }
        
        const taskStartDates = projectTasks.map(task => new Date(task.startDate));
        const taskEndDates = projectTasks.map(task => new Date(task.endDate));
        
        const earliestStart = new Date(Math.min(...taskStartDates));
        const latestEnd = new Date(Math.max(...taskEndDates));
        
        return {
          ...project,
          startDate: earliestStart,
          endDate: latestEnd
        };
      });
    });
  }, [tasks]);
  
  // Task manipulation helpers
  const getTaskById = (taskId) => {
    return tasks.find(task => task.id === taskId);
  };
  
  const validateTask = (task) => {
    if (!task.name) return 'Task name is required';
    if (!task.userId) return 'Please assign a resource to this task';
    if (!task.projectId) return 'Please select a project for this task';
    if (!task.startDate) return 'Start date is required';
    if (!task.endDate) return 'End date is required';
    if (new Date(task.startDate) > new Date(task.endDate)) return 'Start date must be before end date';
    if (task.allocation <= 0 || task.allocation > 100) return 'Allocation must be between 1 and 100 percent';
    
    // Check if user is overallocated during the task period
    const dailyAllocations = calculateDailyAllocations();
    const taskDateRange = getDatesArray(new Date(task.startDate), new Date(task.endDate));
    
    const user = users.find(u => u.id === task.userId);
    if (!user) return 'Invalid user selected';
    
    // For edit mode, exclude the current task from calculations
    const otherTasks = editMode === 'edit' ? tasks.filter(t => t.id !== task.id) : tasks;
    
    let overallocatedDates = [];
    
    taskDateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends and holidays
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isHoliday = holidays.some(h => 
        new Date(h.date).toISOString().split('T')[0] === dateStr
      );
      const isTimeOff = timeOff.some(to => 
        to.userId === task.userId &&
        new Date(to.startDate) <= date &&
        new Date(to.endDate) >= date
      );
      
      if (isWeekend || isHoliday || isTimeOff) return;
      
      // Calculate existing allocation for this user on this date
      const existingAllocation = otherTasks
        .filter(t => 
          t.userId === task.userId &&
          new Date(t.startDate) <= date &&
          new Date(t.endDate) >= date
        )
        .reduce((sum, t) => sum + t.allocation, 0);
      
      // Add the new task allocation
      const totalAllocation = existingAllocation + task.allocation;
      
      if (totalAllocation > 100) {
        overallocatedDates.push(formatDateForDisplay(date));
      }
    });
    
    if (overallocatedDates.length > 0) {
      return `Warning: ${user.name} will be overallocated on the following dates: ${overallocatedDates.join(', ')}`;
    }
    
    return '';
  };
  
  // Resources manipulation helpers
  const getUserById = (userId) => {
    return users.find(user => user.id === userId);
  };
  
  const validateUser = (user) => {
    if (!user.name) return 'Name is required';
    if (!user.hoursPerDay || user.hoursPerDay <= 0) return 'Hours per day must be greater than 0';
    if (!user.discipline) return 'Discipline is required';
    if (!user.role) return 'Role is required';
    
    return '';
  };
  
  const canDeleteUser = (userId) => {
    return !tasks.some(task => task.userId === userId);
  };
  
  // Projects manipulation helpers
  const getProjectById = (projectId) => {
    return projects.find(project => project.id === projectId);
  };
  
  const validateProject = (project) => {
    if (!project.name) return 'Project name is required';
    return '';
  };
  
  const canDeleteProject = (projectId) => {
    return !tasks.some(task => task.projectId === projectId);
  };
  
  // Time off manipulation helpers
  const getTimeOffById = (timeOffId) => {
    return timeOff.find(to => to.id === timeOffId);
  };
  
  const validateTimeOff = (timeOffEntry) => {
    if (!timeOffEntry.userId) return 'Please select a resource';
    if (!timeOffEntry.startDate) return 'Start date is required';
    if (!timeOffEntry.endDate) return 'End date is required';
    if (new Date(timeOffEntry.startDate) > new Date(timeOffEntry.endDate)) return 'Start date must be before end date';
    if (!timeOffEntry.type) return 'Time off type is required';
    
    return '';
  };
  
  // Holidays manipulation helpers
  const getHolidayById = (holidayId) => {
    return holidays.find(holiday => holiday.id === holidayId);
  };
  
  const validateHoliday = (holiday) => {
    if (!holiday.date) return 'Date is required';
    if (!holiday.name) return 'Holiday name is required';
    
    return '';
  };
  
  // Calculate resource utilization
  const calculateDailyAllocations = () => {
    const dailyAllocations = {};
    
    users.forEach(user => {
      dailyAllocations[user.id] = {};
      
      allDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        dailyAllocations[user.id][dateStr] = 0;
        
        // Skip weekends and holidays
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = holidays.some(h => 
          new Date(h.date).toISOString().split('T')[0] === dateStr
        );
        const isTimeOff = timeOff.some(to => 
          to.userId === user.id &&
          new Date(to.startDate) <= date &&
          new Date(to.endDate) >= date
        );
        
        if (isWeekend || isHoliday || isTimeOff) {
          dailyAllocations[user.id][dateStr] = null; // Unavailable day
          return;
        }
        
        // Calculate allocation percentage for this user on this date
        const userTasks = tasks.filter(task => 
          task.userId === user.id &&
          new Date(task.startDate) <= date &&
          new Date(task.endDate) >= date
        );
        
        dailyAllocations[user.id][dateStr] = userTasks.reduce((sum, task) => sum + task.allocation, 0);
      });
    });
    
    return dailyAllocations;
  };
  
  // Get data for visualization chart
  const getUtilizationChartData = () => {
    const dailyAllocations = calculateDailyAllocations();
    
    return allDates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = formatDateForDisplay(date);
      
      const data = {
        date: displayDate,
        dateObj: date,
      };
      
      users.forEach(user => {
        data[user.name] = dailyAllocations[user.id][dateStr] !== null 
          ? dailyAllocations[user.id][dateStr] 
          : 0;
      });
      
      return data;
    });
  };
  
  // Calculate project progress data
  const getProjectProgressData = () => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const totalTaskDays = projectTasks.reduce((sum, task) => {
        const taskDuration = Math.ceil(
          (new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24)
        ) + 1;
        return sum + taskDuration;
      }, 0);
      
      const today = new Date();
      
      const completedTaskDays = projectTasks.reduce((sum, task) => {
        if (new Date(task.endDate) < today) {
          // Task is completely done
          const taskDuration = Math.ceil(
            (new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24)
          ) + 1;
          return sum + taskDuration;
        } else if (new Date(task.startDate) < today) {
          // Task is partially done
          const taskDuration = Math.ceil(
            (today - new Date(task.startDate)) / (1000 * 60 * 60 * 24)
          );
          return sum + taskDuration;
        }
        return sum;
      }, 0);
      
      return {
        name: project.name,
        start: formatDateForDisplay(project.startDate),
        end: formatDateForDisplay(project.endDate),
        progress: totalTaskDays > 0 ? Math.round((completedTaskDays / totalTaskDays) * 100) : 0
      };
    });
  };
  
  // Form handling
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEditMode(null);
    setEditFormData({});
  };
  
  const handleAddNew = (entityType) => {
    setEditingEntityType(entityType);
    setEditMode('add');
    
    switch (entityType) {
      case 'user':
        setEditFormData({
          name: '',
          hoursPerDay: 8,
          discipline: '',
          role: ''
        });
        break;
      case 'project':
        setEditFormData({
          name: '',
          startDate: formatDateForInput(new Date()),
          endDate: formatDateForInput(new Date(new Date().setDate(new Date().getDate() + 14)))
        });
        break;
      case 'task':
        setEditFormData({
          name: '',
          userId: '',
          projectId: '',
          startDate: formatDateForInput(new Date()),
          endDate: formatDateForInput(new Date(new Date().setDate(new Date().getDate() + 7))),
          allocation: 50
        });
        break;
      case 'timeOff':
        setEditFormData({
          userId: '',
          startDate: formatDateForInput(new Date()),
          endDate: formatDateForInput(new Date()),
          type: 'Vacation'
        });
        break;
      case 'holiday':
        setEditFormData({
          date: formatDateForInput(new Date()),
          name: ''
        });
        break;
    }
  };
  
  const handleEdit = (entityType, id) => {
    setEditingEntityType(entityType);
    setEditMode('edit');
    
    switch (entityType) {
      case 'user':
        const user = getUserById(id);
        setEditFormData({
          id: user.id,
          name: user.name,
          hoursPerDay: user.hoursPerDay,
          discipline: user.discipline,
          role: user.role
        });
        break;
      case 'project':
        const project = getProjectById(id);
        setEditFormData({
          id: project.id,
          name: project.name,
          startDate: formatDateForInput(project.startDate),
          endDate: formatDateForInput(project.endDate)
        });
        break;
      case 'task':
        const task = getTaskById(id);
        setEditFormData({
          id: task.id,
          name: task.name,
          userId: task.userId,
          projectId: task.projectId,
          startDate: formatDateForInput(task.startDate),
          endDate: formatDateForInput(task.endDate),
          allocation: task.allocation
        });
        break;
      case 'timeOff':
        const timeOffEntry = getTimeOffById(id);
        setEditFormData({
          id: timeOffEntry.id,
          userId: timeOffEntry.userId,
          startDate: formatDateForInput(timeOffEntry.startDate),
          endDate: formatDateForInput(timeOffEntry.endDate),
          type: timeOffEntry.type
        });
        break;
      case 'holiday':
        const holiday = getHolidayById(id);
        setEditFormData({
          id: holiday.id,
          date: formatDateForInput(holiday.date),
          name: holiday.name
        });
        break;
    }
  };
  
  const handleDelete = (entityType, id) => {
    setEditingEntityType(entityType);
    setSelectedItemId(id);
    
    // Check if deletion is allowed
    if (entityType === 'user' && !canDeleteUser(id)) {
      setModalType('validation');
      setValidationMessage('Cannot delete this resource as they have tasks assigned to them.');
      setShowModal(true);
      return;
    }
    
    if (entityType === 'project' && !canDeleteProject(id)) {
      setModalType('validation');
      setValidationMessage('Cannot delete this project as it has tasks assigned to it.');
      setShowModal(true);
      return;
    }
    
    // If deletion is allowed, show confirmation modal
    setModalType('delete');
    setShowModal(true);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validate the form data
    let validationResult = '';
    
    switch (editingEntityType) {
      case 'user':
        validationResult = validateUser(editFormData);
        break;
      case 'project':
        validationResult = validateProject(editFormData);
        break;
      case 'task':
        validationResult = validateTask(editFormData);
        break;
      case 'timeOff':
        validationResult = validateTimeOff(editFormData);
        break;
      case 'holiday':
        validationResult = validateHoliday(editFormData);
        break;
    }
    
    if (validationResult) {
      setModalType('validation');
      setValidationMessage(validationResult);
      setShowModal(true);
      return;
    }
    
    // If validation passes, save the data
    saveFormData();
  };
  
  const saveFormData = () => {
    switch (editingEntityType) {
      case 'user':
        if (editMode === 'add') {
          setUsers(prev => [...prev, { ...editFormData, id: generateId(users) }]);
        } else {
          setUsers(prev => prev.map(user => 
            user.id === editFormData.id ? { ...editFormData } : user
          ));
        }
        break;
      case 'project':
        if (editMode === 'add') {
          setProjects(prev => [...prev, { 
            ...editFormData, 
            id: generateId(projects),
            startDate: new Date(editFormData.startDate),
            endDate: new Date(editFormData.endDate)
          }]);
        } else {
          setProjects(prev => prev.map(project => 
            project.id === editFormData.id ? { 
              ...editFormData, 
              startDate: new Date(editFormData.startDate),
              endDate: new Date(editFormData.endDate)
            } : project
          ));
        }
        break;
      case 'task':
        if (editMode === 'add') {
          setTasks(prev => [...prev, { 
            ...editFormData, 
            id: generateId(tasks),
            userId: parseInt(editFormData.userId),
            projectId: parseInt(editFormData.projectId),
            startDate: new Date(editFormData.startDate),
            endDate: new Date(editFormData.endDate),
            allocation: parseInt(editFormData.allocation)
          }]);
        } else {
          setTasks(prev => prev.map(task => 
            task.id === editFormData.id ? { 
              ...editFormData, 
              userId: parseInt(editFormData.userId),
              projectId: parseInt(editFormData.projectId),
              startDate: new Date(editFormData.startDate),
              endDate: new Date(editFormData.endDate),
              allocation: parseInt(editFormData.allocation)
            } : task
          ));
        }
        break;
      case 'timeOff':
        if (editMode === 'add') {
          setTimeOff(prev => [...prev, { 
            ...editFormData, 
            id: generateId(timeOff),
            userId: parseInt(editFormData.userId),
            startDate: new Date(editFormData.startDate),
            endDate: new Date(editFormData.endDate)
          }]);
        } else {
          setTimeOff(prev => prev.map(item => 
            item.id === editFormData.id ? { 
              ...editFormData, 
              userId: parseInt(editFormData.userId),
              startDate: new Date(editFormData.startDate),
              endDate: new Date(editFormData.endDate)
            } : item
          ));
        }
        break;
      case 'holiday':
        if (editMode === 'add') {
          setHolidays(prev => [...prev, { 
            ...editFormData, 
            id: generateId(holidays),
            date: new Date(editFormData.date)
          }]);
        } else {
          setHolidays(prev => prev.map(holiday => 
            holiday.id === editFormData.id ? { 
              ...editFormData, 
              date: new Date(editFormData.date)
            } : holiday
          ));
        }
        break;
    }
    
    // Reset form state
    setEditMode(null);
    setEditFormData({});
  };
  
  const confirmDelete = () => {
    switch (editingEntityType) {
      case 'user':
        setUsers(prev => prev.filter(user => user.id !== selectedItemId));
        break;
      case 'project':
        setProjects(prev => prev.filter(project => project.id !== selectedItemId));
        break;
      case 'task':
        setTasks(prev => prev.filter(task => task.id !== selectedItemId));
        break;
      case 'timeOff':
        setTimeOff(prev => prev.filter(item => item.id !== selectedItemId));
        break;
      case 'holiday':
        setHolidays(prev => prev.filter(holiday => holiday.id !== selectedItemId));
        break;
    }
    
    // Close the modal
    setShowModal(false);
    setSelectedItemId(null);
    setEditingEntityType(null);
  };
  
  const renderForm = () => {
    switch (editingEntityType) {
      case 'user':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={editFormData.name || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Hours Per Day</label>
              <input
                type="number"
                name="hoursPerDay"
                value={editFormData.hoursPerDay || ''}
                onChange={handleNumericChange}
                min="1"
                max="24"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Discipline</label>
              <input
                type="text"
                name="discipline"
                value={editFormData.discipline || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <input
                type="text"
                name="role"
                value={editFormData.role || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editMode === 'add' ? 'Add Resource' : 'Update Resource'}
              </button>
            </div>
          </form>
        );
      
      case 'project':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Name</label>
              <input
                type="text"
                name="name"
                value={editFormData.name || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={editFormData.startDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={editFormData.endDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editMode === 'add' ? 'Add Project' : 'Update Project'}
              </button>
            </div>
          </form>
        );
      
      case 'task':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Task Name</label>
              <input
                type="text"
                name="name"
                value={editFormData.name || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned Resource</label>
              <select
                name="userId"
                value={editFormData.userId || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Select a resource</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Project</label>
              <select
                name="projectId"
                value={editFormData.projectId || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={editFormData.startDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={editFormData.endDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allocation (%)
                <span className="ml-2 text-sm text-gray-500">
                  {editFormData.allocation || 0}%
                </span>
              </label>
              <input
                type="range"
                name="allocation"
                min="1"
                max="100"
                value={editFormData.allocation || 50}
                onChange={handleNumericChange}
                className="mt-1 block w-full"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editMode === 'add' ? 'Add Task' : 'Update Task'}
              </button>
            </div>
          </form>
        );
      
      case 'timeOff':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Resource</label>
              <select
                name="userId"
                value={editFormData.userId || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Select a resource</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={editFormData.startDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={editFormData.endDate || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={editFormData.type || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="Vacation">Vacation</option>
                <option value="Sick">Sick</option>
                <option value="Personal">Personal</option>
                <option value="Training">Training</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editMode === 'add' ? 'Add Time Off' : 'Update Time Off'}
              </button>
            </div>
          </form>
        );
      
      case 'holiday':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Holiday Name</label>
              <input
                type="text"
                name="name"
                value={editFormData.name || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={editFormData.date || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editMode === 'add' ? 'Add Holiday' : 'Update Holiday'}
              </button>
            </div>
          </form>
        );
      
      default:
        return null;
    }
  };
  
  // Determine utilization status color
  const getUtilizationColor = (utilization) => {
    if (utilization > 100) return '#ff4d4d'; // Overallocated (red)
    if (utilization >= 80) return '#6dc36d'; // Well utilized (green)
    return '#7fbdff';                      // Underutilized (blue)
  };
  
  // Render confirm/warning modal
  const renderModal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          {modalType === 'delete' ? (
            <>
              <h3 className="text-lg font-semibold mb-3">Confirm Delete</h3>
              <p className="mb-4">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-3">
                {validationMessage.startsWith('Warning') ? 'Warning' : 'Validation Error'}
              </h3>
              <p className="mb-4">{validationMessage}</p>
              {validationMessage.startsWith('Warning') ? (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      saveFormData();
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md"
                  >
                    Save Anyway
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                  >
                    Ok
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Render dashboard tab
  const renderDashboard = () => {
    const chartData = getUtilizationChartData();
    const dailyAllocations = calculateDailyAllocations();
    
    return (
      <div className="space-y-6">
        {/* Resource Utilization Chart */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium mb-4">Resource Utilization</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(',')[0]}
                />
                <YAxis
                  label={{ value: 'Allocation %', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, '']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                {users.map((user, index) => (
                  <Area
                    key={user.id}
                    type="monotone"
                    dataKey={user.name}
                    stackId="1"
                    stroke={`hsl(${(index * 90) % 360}, 70%, 50%)`}
                    fill={`hsl(${(index * 90) % 360}, 70%, 70%)`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Resource Summary */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium mb-4">Resource Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Allocation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => {
                  // Calculate average allocation excluding weekends, holidays, and time off
                  const userAllocations = Object.entries(dailyAllocations[user.id] || {})
                    .filter(([_, allocation]) => allocation !== null)
                    .map(([_, allocation]) => allocation);
                  
                  const avgAllocation = userAllocations.length > 0
                    ? userAllocations.reduce((sum, val) => sum + val, 0) / userAllocations.length
                    : 0;
                  
                  const allocationStatus = avgAllocation > 100 
                    ? 'Overallocated' 
                    : avgAllocation >= 80 
                      ? 'Well Allocated' 
                      : 'Underallocated';
                  
                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{user.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{user.role}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{Math.round(avgAllocation)}%</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: getUtilizationColor(avgAllocation),
                            color: avgAllocation > 100 ? 'white' : 'black'
                          }}
                        >
                          {allocationStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Project Progress */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium mb-4">Project Progress</h2>
          <div className="space-y-4">
            {getProjectProgressData().map(project => (
              <div key={project.name} className="border p-3 rounded">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium">{project.name}</h3>
                  <span className="text-sm text-gray-500">{project.progress}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{project.start}</span>
                  <span>{project.end}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render resources tab
  const renderResources = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Resources</h2>
          {editMode ? (
            <div className="text-lg font-medium">
              {editMode === 'add' ? 'Add New Resource' : 'Edit Resource'}
            </div>
          ) : (
            <button
              onClick={() => handleAddNew('user')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Resource
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="bg-white p-4 rounded-lg border">
            {renderForm()}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discipline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours/Day</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{user.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{user.discipline}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{user.role}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{user.hoursPerDay}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEdit('user', user.id)}
                        className="text-blue-600 hover:text-blue-900 px-2"
                        aria-label={`Edit ${user.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete('user', user.id)}
                        className="text-red-600 hover:text-red-900 px-2"
                        aria-label={`Delete ${user.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // Render projects tab
  const renderProjects = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Projects</h2>
          {editMode ? (
            <div className="text-lg font-medium">
              {editMode === 'add' ? 'Add New Project' : 'Edit Project'}
            </div>
          ) : (
            <button
              onClick={() => handleAddNew('project')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Project
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="bg-white p-4 rounded-lg border">
            {renderForm()}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map(project => {
                  const duration = Math.ceil(
                    (new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24)
                  ) + 1;
                  
                  return (
                    <tr key={project.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{project.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateForDisplay(project.startDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateForDisplay(project.endDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{duration} days</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEdit('project', project.id)}
                          className="text-blue-600 hover:text-blue-900 px-2"
                          aria-label={`Edit ${project.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete('project', project.id)}
                          className="text-red-600 hover:text-red-900 px-2"
                          aria-label={`Delete ${project.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // Render tasks tab
  const renderTasks = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Tasks</h2>
          {editMode ? (
            <div className="text-lg font-medium">
              {editMode === 'add' ? 'Add New Task' : 'Edit Task'}
            </div>
          ) : (
            <button
              onClick={() => handleAddNew('task')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Task
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="bg-white p-4 rounded-lg border">
            {renderForm()}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map(task => {
                  const project = getProjectById(task.projectId);
                  const user = getUserById(task.userId);
                  
                  if (!project || !user) return null;
                  
                  return (
                    <tr key={task.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{task.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{project.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{user.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateForDisplay(task.startDate)} - {formatDateForDisplay(task.endDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            task.allocation > 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {task.allocation}%
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEdit('task', task.id)}
                          className="text-blue-600 hover:text-blue-900 px-2"
                          aria-label={`Edit ${task.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete('task', task.id)}
                          className="text-red-600 hover:text-red-900 px-2"
                          aria-label={`Delete ${task.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // Render time off tab
  const renderTimeOff = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Time Off</h2>
          {editMode ? (
            <div className="text-lg font-medium">
              {editMode === 'add' ? 'Add New Time Off' : 'Edit Time Off'}
            </div>
          ) : (
            <button
              onClick={() => handleAddNew('timeOff')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Time Off
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="bg-white p-4 rounded-lg border">
            {renderForm()}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeOff.map(item => {
                  const user = getUserById(item.userId);
                  
                  if (!user) return null;
                  
                  const duration = Math.ceil(
                    (new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)
                  ) + 1;
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{user.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.type === 'Vacation' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'Sick' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateForDisplay(item.startDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateForDisplay(item.endDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{duration} day{duration !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEdit('timeOff', item.id)}
                          className="text-blue-600 hover:text-blue-900 px-2"
                          aria-label={`Edit time off for ${user.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete('timeOff', item.id)}
                          className="text-red-600 hover:text-red-900 px-2"
                          aria-label={`Delete time off for ${user.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // Render holidays tab
  const renderHolidays = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Holidays</h2>
          {editMode ? (
            <div className="text-lg font-medium">
              {editMode === 'add' ? 'Add New Holiday' : 'Edit Holiday'}
            </div>
          ) : (
            <button
              onClick={() => handleAddNew('holiday')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Holiday
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="bg-white p-4 rounded-lg border">
            {renderForm()}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day of Week</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holidays.map(holiday => {
                  const date = new Date(holiday.date);
                  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                  
                  return (
                    <tr key={holiday.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{holiday.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateForDisplay(holiday.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{dayOfWeek}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEdit('holiday', holiday.id)}
                          className="text-blue-600 hover:text-blue-900 px-2"
                          aria-label={`Edit ${holiday.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete('holiday', holiday.id)}
                          className="text-red-600 hover:text-red-900 px-2"
                          aria-label={`Delete ${holiday.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-4 md:px-8">
        <h1 className="text-white text-2xl md:text-3xl font-bold">ProjectShift Editor</h1>
        <p className="text-blue-100 mt-1">Complete Resource Management System</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <nav className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleTabChange('resources')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'resources'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap`}
            >
              Resources
            </button>
            <button
              onClick={() => handleTabChange('projects')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap`}
            >
              Projects
            </button>
            <button
              onClick={() => handleTabChange('tasks')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap`}
            >
              Tasks
            </button>
            <button
              onClick={() => handleTabChange('timeOff')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'timeOff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap`}
            >
              Time Off
            </button>
            <button
              onClick={() => handleTabChange('holidays')}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'holidays'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap`}
            >
              Holidays
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'timeOff' && renderTimeOff()}
        {activeTab === 'holidays' && renderHolidays()}
      </div>
      
      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default ProjectShiftEditor;