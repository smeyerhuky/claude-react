import React, { createContext, useContext, useReducer, useEffect, useState, useMemo, memo } from 'react';
import * as math from 'mathjs';

// ===== Component Registry =====
const ComponentRegistry = {};

const registerComponent = (name, component) => {
  ComponentRegistry[name] = component;
};

const getComponent = (name) => {
  return ComponentRegistry[name] || (() => null);
};

// ===== Calendar Data Factory =====
class CalendarDataFactory {
  static DAY_START_HOUR = 8;  // 8:00 AM
  static DAY_END_HOUR = 19;   // 7:00 PM
  static MINUTES_PER_SLOT = 10;
  static WORKING_MINUTES_PER_DAY = (this.DAY_END_HOUR - this.DAY_START_HOUR) * 60;
  static SLOTS_PER_DAY = this.WORKING_MINUTES_PER_DAY / this.MINUTES_PER_SLOT;
  
  // Process meetings into calendar data
  static processCalendarData(meetings, users, dateRange, currentUserId) {
    const dates = this.getDatesInRange(dateRange.start, dateRange.end);
    const privatizedMeetings = this.applyPrivacyControls(meetings, currentUserId);
    const meetingsByDate = this.groupMeetingsByDate(privatizedMeetings);
    
    // Create calendar days with availability info
    const calendarDays = dates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayMeetings = meetingsByDate[dateStr] || [];
      
      // Calculate availability stats
      const totalMeetingMinutes = dayMeetings.reduce((total, meeting) => {
        return total + meeting.duration;
      }, 0);
      
      const avgMeetingMinutes = users.length > 0 ? totalMeetingMinutes / users.length : 0;
      const busyPercentage = Math.min(100, (avgMeetingMinutes / this.WORKING_MINUTES_PER_DAY) * 100);
      
      return {
        date,
        dateStr,
        meetings: dayMeetings,
        totalMeetings: dayMeetings.length,
        totalMeetingMinutes,
        busyPercentage,
        availabilityPercentage: 100 - busyPercentage
      };
    });
    
    return {
      days: calendarDays,
      weeks: this.organizeByWeek(calendarDays),
      months: this.organizeByMonth(calendarDays)
    };
  }
  
  // Apply privacy controls to meetings
  static applyPrivacyControls(meetings, currentUserId) {
    if (!currentUserId) return meetings;
    
    return meetings.map(meeting => {
      // Current user is an attendee - show full details
      if (meeting.attendees.some(a => a.id === currentUserId)) {
        return meeting;
      }
      
      // Public status - show status
      if (meeting.isPublicStatus) {
        return meeting;
      }
      
      // Private meeting - hide details
      return {
        ...meeting,
        title: 'Busy',
        location: null,
        privatized: true
      };
    });
  }
  
  // Get all dates in a range
  static getDatesInRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    
    return dates;
  }
  
  // Group meetings by date
  static groupMeetingsByDate(meetings) {
    const meetingsByDate = {};
    
    meetings.forEach(meeting => {
      const dateStr = new Date(meeting.start).toISOString().split('T')[0];
      
      if (!meetingsByDate[dateStr]) {
        meetingsByDate[dateStr] = [];
      }
      
      meetingsByDate[dateStr].push(meeting);
    });
    
    return meetingsByDate;
  }
  
  // Organize by month
  static organizeByMonth(days) {
    const months = {};
    
    days.forEach(day => {
      const date = new Date(day.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          year,
          month,
          monthName: date.toLocaleDateString('default', { month: 'long' }),
          days: []
        };
      }
      
      months[monthKey].days.push(day);
    });
    
    // Process each month (add empty days, etc.)
    Object.values(months).forEach(month => {
      month.days.sort((a, b) => a.date - b.date);
      this.addMonthPadding(month);
    });
    
    return Object.values(months).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }
  
  // Add padding days to month
  static addMonthPadding(month) {
    if (month.days.length === 0) return;
    
    const firstDay = month.days[0].date;
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty days at the beginning of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDate = new Date(firstDay);
      emptyDate.setDate(emptyDate.getDate() - (firstDayOfWeek - i));
      
      month.days.unshift({
        date: emptyDate,
        isEmpty: true
      });
    }
    
    // Add empty days at the end of the month
    const lastDay = month.days[month.days.length - 1].date;
    const lastDayOfWeek = lastDay.getDay();
    
    for (let i = lastDayOfWeek + 1; i < 7; i++) {
      const emptyDate = new Date(lastDay);
      emptyDate.setDate(emptyDate.getDate() + (i - lastDayOfWeek));
      
      month.days.push({
        date: emptyDate,
        isEmpty: true
      });
    }
  }
  
  // Organize by week
  static organizeByWeek(days) {
    const weeks = {};
    
    days.forEach(day => {
      const date = new Date(day.date);
      const weekNumber = this.getWeekNumber(date);
      const year = date.getFullYear();
      const weekKey = `${year}-W${weekNumber}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          year,
          weekNumber,
          days: []
        };
      }
      
      weeks[weekKey].days.push(day);
    });
    
    // Process each week
    Object.values(weeks).forEach(week => {
      week.days.sort((a, b) => a.date - b.date);
      
      // Calculate week stats
      week.totalMeetings = week.days.reduce((total, day) => total + day.totalMeetings, 0);
      week.busyPercentage = week.days.reduce((total, day) => total + day.busyPercentage, 0) / week.days.length;
      week.availabilityPercentage = 100 - week.busyPercentage;
    });
    
    return Object.values(weeks).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.weekNumber - b.weekNumber;
    });
  }
  
  // Get ISO week number
  static getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  
  // Create day timeline
  static createDayTimeline(day, meetings, userIds, currentUserId) {
    if (!day || !meetings) return null;
    
    const timeSlots = this.createTimeSlots(day.date);
    this.assignMeetingsToTimeSlots(timeSlots, meetings, userIds, currentUserId);
    
    return {
      date: day.date,
      timeSlots
    };
  }
  
  // Create time slots
  static createTimeSlots(date) {
    const timeSlots = [];
    const slotMinutes = 30; // 30-minute slots
    const slotsPerDay = (this.DAY_END_HOUR - this.DAY_START_HOUR) * (60 / slotMinutes);
    
    for (let i = 0; i < slotsPerDay; i++) {
      const slotStart = new Date(date);
      slotStart.setHours(this.DAY_START_HOUR + Math.floor((i * slotMinutes) / 60));
      slotStart.setMinutes(((i * slotMinutes) % 60));
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
      
      timeSlots.push({
        start: slotStart,
        end: slotEnd,
        meetings: [],
        userMeetings: {}
      });
    }
    
    return timeSlots;
  }
  
  // Assign meetings to time slots
  static assignMeetingsToTimeSlots(timeSlots, meetings, userIds, currentUserId) {
    meetings.forEach(meeting => {
      const meetingStart = new Date(meeting.start);
      const meetingEnd = new Date(meeting.end);
      
      // Skip meetings not on this day
      if (meetingStart.toDateString() !== timeSlots[0].start.toDateString()) return;
      
      // Apply privacy filter
      let visibleMeeting = meeting;
      if (currentUserId && !meeting.visibleToCurrentUser && !meeting.isPublicStatus) {
        visibleMeeting = {
          ...meeting,
          title: 'Busy',
          location: null,
          privatized: true
        };
      }
      
      // Assign to overlapping time slots
      timeSlots.forEach(slot => {
        if (meetingStart < slot.end && meetingEnd > slot.start) {
          slot.meetings.push(visibleMeeting);
          
          // Track meetings by user
          meeting.attendees.forEach(attendee => {
            if (userIds.includes(attendee.id)) {
              if (!slot.userMeetings[attendee.id]) {
                slot.userMeetings[attendee.id] = [];
              }
              slot.userMeetings[attendee.id].push(visibleMeeting);
            }
          });
        }
      });
    });
    
    // Calculate busy percentage for each slot
    timeSlots.forEach(slot => {
      const busyUsers = Object.keys(slot.userMeetings).length;
      slot.busyPercentage = userIds.length > 0 ? (busyUsers / userIds.length) * 100 : 0;
      slot.availabilityPercentage = 100 - slot.busyPercentage;
    });
  }
  
  // Find available meeting slots
  static findAvailableSlots(calendarData, userIds, duration = 30) {
    if (!calendarData || !userIds || userIds.length === 0) return [];
    
    const availableSlots = [];
    
    calendarData.days.forEach(day => {
      const dayMeetings = day.meetings || [];
      const timeline = this.createDayTimeline(day, dayMeetings, userIds);
      
      if (!timeline) return;
      
      this.findAvailableSlotsInTimeline(timeline, userIds, duration, availableSlots);
    });
    
    return availableSlots.sort((a, b) => a.start - b.start);
  }
  
  // Find available slots in a day's timeline
  static findAvailableSlotsInTimeline(timeline, userIds, duration, availableSlots) {
    const requiredConsecutiveSlots = Math.ceil(duration / 30); // each slot is 30 minutes
    let consecutiveAvailableSlots = 0;
    let startSlotIndex = -1;
    
    for (let i = 0; i < timeline.timeSlots.length; i++) {
      const slot = timeline.timeSlots[i];
      const allUsersAvailable = userIds.every(userId => 
        !slot.userMeetings[userId] || slot.userMeetings[userId].length === 0
      );
      
      if (allUsersAvailable) {
        if (consecutiveAvailableSlots === 0) {
          startSlotIndex = i;
        }
        consecutiveAvailableSlots++;
        
        if (consecutiveAvailableSlots >= requiredConsecutiveSlots) {
          const startSlot = timeline.timeSlots[startSlotIndex];
          const endSlot = timeline.timeSlots[i];
          
          availableSlots.push({
            date: new Date(timeline.date),
            start: new Date(startSlot.start),
            end: new Date(endSlot.end),
            duration: (consecutiveAvailableSlots * 30)
          });
          
          // Reset to find the next slot
          consecutiveAvailableSlots = 0;
          startSlotIndex = -1;
        }
      } else {
        consecutiveAvailableSlots = 0;
        startSlotIndex = -1;
      }
    }
  }
}

// ===== Mock API Service =====
class CalendarApiService {
  constructor(simulatedLatency = 400) {
    this.simulatedLatency = simulatedLatency;
    
    // Sample data
    this.users = [
      { id: 'user1', name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering', role: 'Developer', project: 'Atlas' },
      { id: 'user2', name: 'Bob Smith', email: 'bob@example.com', department: 'Engineering', role: 'Team Lead', project: 'Atlas' },
      { id: 'user3', name: 'Charlie Davis', email: 'charlie@example.com', department: 'Sales', role: 'Account Executive', project: 'Phoenix' },
      { id: 'user4', name: 'Diana Martinez', email: 'diana@example.com', department: 'Sales', role: 'Sales Manager', project: 'Phoenix' },
      { id: 'user5', name: 'Elijah Wilson', email: 'elijah@example.com', department: 'Marketing', role: 'Content Creator', project: 'Nexus' },
      { id: 'user6', name: 'Fiona Roberts', email: 'fiona@example.com', department: 'Marketing', role: 'Marketing Manager', project: 'Nexus' }
    ];
    
    this.departments = [
      { id: 'engineering', name: 'Engineering', color: '#4285F4' },
      { id: 'sales', name: 'Sales', color: '#EA4335' },
      { id: 'marketing', name: 'Marketing', color: '#FBBC05' },
      { id: 'product', name: 'Product', color: '#34A853' }
    ];
    
    this.publicStatuses = [
      { id: 'meeting', name: 'In a Meeting', color: '#E67C73' },
      { id: 'out-of-office', name: 'Out of Office', color: '#F6BF26' },
      { id: 'heads-down', name: 'Heads Down', color: '#33B679' }
    ];
  }
  
  // Add delay to simulate API calls
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.simulatedLatency));
  }
  
  // Get all users
  async getUsers() {
    await this.delay();
    return this.users;
  }
  
  // Get departments
  async getDepartments() {
    await this.delay();
    return this.departments;
  }
  
  // Get public statuses
  async getPublicStatuses() {
    await this.delay();
    return this.publicStatuses;
  }
  
  // Get meetings for a set of users
  async getMeetings(userIds, startDate, endDate, currentUserId) {
    await this.delay();
    
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    const meetings = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // For each day
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      // For each user
      for (const userId of userIds) {
        const user = this.users.find(u => u.id === userId);
        if (!user) continue;
        
        // Generate 2-5 meetings per day
        const numMeetings = Math.floor(Math.random() * 4) + 2;
        
        for (let i = 0; i < numMeetings; i++) {
          // Generate meeting start time (8 AM - 4 PM)
          const startHour = Math.floor(Math.random() * 8) + 8;
          const startMinute = Math.floor(Math.random() * 6) * 10; // 10-minute intervals
          
          const meetingStart = new Date(day);
          meetingStart.setHours(startHour, startMinute, 0, 0);
          
          // Duration (15-90 minutes)
          const durationMinutes = [15, 30, 45, 60, 90][Math.floor(Math.random() * 5)];
          
          const meetingEnd = new Date(meetingStart);
          meetingEnd.setMinutes(meetingEnd.getMinutes() + durationMinutes);
          
          // Random attendees (1-3 additional people)
          const numAttendees = Math.floor(Math.random() * 3) + 1;
          const attendees = [{ id: userId, name: user.name, department: user.department, role: user.role }];
          
          const potentialAttendees = this.users.filter(u => u.id !== userId);
          const shuffled = [...potentialAttendees].sort(() => 0.5 - Math.random());
          
          for (let j = 0; j < Math.min(numAttendees, shuffled.length); j++) {
            attendees.push({
              id: shuffled[j].id,
              name: shuffled[j].name,
              department: shuffled[j].department,
              role: shuffled[j].role
            });
          }
          
          // Determine if public status (15% chance)
          const isPublicStatus = Math.random() < 0.15;
          const publicStatus = isPublicStatus ? 
            this.publicStatuses[Math.floor(Math.random() * this.publicStatuses.length)] : null;
            
          // Determine if private (20% chance if not public)
          const isPrivate = !isPublicStatus && Math.random() < 0.2;
          
          // Generate meeting
          meetings.push({
            id: `meeting-${day.toISOString().split('T')[0]}-${userId}-${i}`,
            title: isPublicStatus ? publicStatus.name : `Meeting ${i+1}`,
            start: meetingStart,
            end: meetingEnd,
            duration: durationMinutes,
            attendees: attendees,
            organizer: { id: userId, name: user.name },
            isPrivate: isPrivate,
            isPublicStatus: isPublicStatus,
            publicStatus: publicStatus,
            department: user.department,
            color: isPublicStatus ? publicStatus.color : this.departments.find(d => d.name === user.department)?.color || '#888888',
            // Determine visibility for privacy
            visibleToCurrentUser: !currentUserId || attendees.some(a => a.id === currentUserId) || isPublicStatus
          });
        }
      }
    }
    
    return meetings;
  }
}

// ===== Calendar Context =====
const CalendarContext = createContext();

const initialState = {
  users: [],
  selectedUsers: [],
  departments: [],
  publicStatuses: [],
  meetings: [],
  calendarData: null,
  availableSlots: [],
  optimalMeetingTime: null,
  currentUser: null,
  viewMode: 'month',
  currentDate: new Date(),
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDay: null,
  selectedWeek: null,
  meetingDuration: 30,
  isLoading: true,
  loadingMessage: 'Loading...',
  dateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  }
};

function calendarReducer(state, action) {
  switch (action.type) {
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_SELECTED_USERS':
      return { ...state, selectedUsers: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    case 'SET_STATUSES':
      return { ...state, publicStatuses: action.payload };
    case 'SET_MEETINGS':
      return { ...state, meetings: action.payload };
    case 'SET_CALENDAR_DATA':
      return { ...state, calendarData: action.payload };
    case 'SET_AVAILABLE_SLOTS':
      return { ...state, availableSlots: action.payload };
    case 'SET_OPTIMAL_TIME':
      return { ...state, optimalMeetingTime: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_CURRENT_DATE':
      return { 
        ...state, 
        currentDate: action.payload,
        currentMonth: action.payload.getMonth(),
        currentYear: action.payload.getFullYear()
      };
    case 'SET_SELECTED_DAY':
      return { ...state, selectedDay: action.payload };
    case 'SET_SELECTED_WEEK':
      return { ...state, selectedWeek: action.payload };
    case 'SET_MEETING_DURATION':
      return { ...state, meetingDuration: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.isLoading, loadingMessage: action.payload.message || state.loadingMessage };
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    default:
      return state;
  }
}

// ===== Utility Functions =====
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getAvailabilityColor = (percentage) => {
  if (percentage >= 80) return 'bg-green-100'; // Very available
  if (percentage >= 60) return 'bg-green-50';  // Available
  if (percentage >= 40) return 'bg-yellow-50'; // Somewhat available
  if (percentage >= 20) return 'bg-orange-50'; // Busy
  return 'bg-red-50';                          // Very busy
};

const getAvailabilityTextColor = (percentage) => {
  if (percentage >= 60) return 'text-green-800';  // Available
  if (percentage >= 40) return 'text-yellow-800'; // Somewhat available
  return 'text-red-800';                          // Busy
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const getMeetingDisplayInfo = (meeting) => {
  if (meeting.isPublicStatus) {
    return {
      title: meeting.title,
      color: meeting.color,
      displayTitle: meeting.title,
      isPrivate: false
    };
  }
  
  if (meeting.privatized) {
    return {
      title: 'Busy',
      color: '#9CA3AF', // Gray
      displayTitle: 'Busy',
      isPrivate: true
    };
  }
  
  return {
    title: meeting.title,
    color: meeting.color,
    displayTitle: meeting.title,
    isPrivate: meeting.isPrivate
  };
};

// ===== Components =====

// MonthView Component
const MonthView = memo(({ currentMonth, currentYear }) => {
  const { state, dispatch } = useContext(CalendarContext);
  
  const currentMonthData = useMemo(() => {
    if (!state.calendarData || !state.calendarData.months) return null;
    return state.calendarData.months.find(month => 
      month.month === currentMonth && month.year === currentYear
    );
  }, [state.calendarData, currentMonth, currentYear]);
  
  if (!currentMonthData) return null;
  
  // Navigate to day or week
  const navigateToDay = (day) => {
    if (day.isEmpty) return;
    dispatch({ type: 'SET_SELECTED_DAY', payload: day });
  };
  
  const navigateToWeek = (date) => {
    if (!state.calendarData) return;
    
    const weekNumber = CalendarDataFactory.getWeekNumber(date);
    const week = state.calendarData.weeks.find(w => 
      w.weekNumber === weekNumber && w.year === date.getFullYear()
    );
    
    if (week) {
      dispatch({ type: 'SET_SELECTED_WEEK', payload: week });
    }
  };
  
  return (
    <div className="p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {currentMonthData.days.map((day, index) => {
          const isEmptyDay = day.isEmpty;
          const isTodayDate = !isEmptyDay && isToday(day.date);
          const isWeekendDate = isWeekend(day.date);
          
          // Determine color based on availability
          let availabilityClass = '';
          if (!isEmptyDay && !isWeekendDate) {
            availabilityClass = getAvailabilityColor(day.availabilityPercentage);
          }
          
          return (
            <div
              key={index}
              className={`min-h-24 border rounded overflow-hidden ${
                isEmptyDay 
                  ? 'bg-gray-50' 
                  : isWeekendDate
                    ? 'bg-gray-100'
                    : availabilityClass
              } ${isTodayDate ? 'border-blue-500 border-2' : ''}`}
            >
              {!isEmptyDay && (
                <div className="h-full flex flex-col">
                  {/* Day header */}
                  <div
                    className={`p-1 border-b ${isTodayDate ? 'bg-blue-50' : ''}`}
                    onClick={() => !isWeekendDate && navigateToWeek(day.date)}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : ''}`}>
                        {day.date.getDate()}
                      </span>
                      
                      {!isWeekendDate && (
                        <span 
                          className={`text-xs ${getAvailabilityTextColor(day.availabilityPercentage)}`}
                        >
                          {Math.round(day.availabilityPercentage)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Meetings */}
                  <div 
                    className="flex-1 p-1 overflow-hidden cursor-pointer"
                    onClick={() => navigateToDay(day)}
                  >
                    {!isWeekendDate && day.meetings && (
                      <div className="space-y-1">
                        {day.meetings.slice(0, 3).map(meeting => {
                          const displayInfo = getMeetingDisplayInfo(meeting);
                          
                          return (
                            <div 
                              key={meeting.id} 
                              className="text-xs p-1 rounded truncate flex items-center"
                              style={{ backgroundColor: `${displayInfo.color}40` }}
                            >
                              {displayInfo.isPrivate && (
                                <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                              )}
                              {formatTime(new Date(meeting.start))} {displayInfo.displayTitle}
                            </div>
                          );
                        })}
                        
                        {day.meetings.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{day.meetings.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// WeekView Component
const WeekView = memo(() => {
  const { state, dispatch } = useContext(CalendarContext);
  
  const currentWeekData = useMemo(() => {
    if (!state.calendarData || !state.calendarData.weeks) return null;
    
    const weekNumber = CalendarDataFactory.getWeekNumber(state.currentDate);
    return state.calendarData.weeks.find(week => 
      week.weekNumber === weekNumber && week.year === state.currentYear
    );
  }, [state.calendarData, state.currentDate, state.currentYear]);
  
  if (!currentWeekData) return null;
  
  const navigateToDay = (day) => {
    dispatch({ type: 'SET_SELECTED_DAY', payload: day });
  };
  
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => {
          const day = currentWeekData.days.find(d => new Date(d.date).getDay() === index);
          const dayDate = day ? new Date(day.date) : null;
          const isTodayDate = dayDate && isToday(dayDate);
          
          return (
            <div 
              key={dayName}
              className={`text-center ${isTodayDate ? 'bg-blue-50 rounded' : ''}`}
            >
              <div className="font-medium text-gray-500">{dayName}</div>
              {dayDate && (
                <div className={`text-sm ${isTodayDate ? 'text-blue-600 font-medium' : ''}`}>
                  {dayDate.getDate()}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Day columns */}
        {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
          const day = currentWeekData.days.find(d => new Date(d.date).getDay() === dayIndex);
          const isWeekendDate = dayIndex === 0 || dayIndex === 6;
          
          if (!day) {
            return (
              <div key={dayIndex} className="min-h-40 bg-gray-50 rounded"></div>
            );
          }
          
          // Determine color based on availability
          let availabilityClass = '';
          if (!isWeekendDate) {
            availabilityClass = getAvailabilityColor(day.availabilityPercentage);
          }
          
          return (
            <div 
              key={dayIndex}
              className={`min-h-40 border rounded ${
                isWeekendDate ? 'bg-gray-100' : availabilityClass
              } ${isToday(new Date(day.date)) ? 'border-blue-500 border-2' : ''}`}
              onClick={() => navigateToDay(day)}
            >
              <div className="h-full overflow-auto p-1">
                {!isWeekendDate && day.meetings && (
                  <div className="space-y-1">
                    {day.meetings.slice(0, 8).map(meeting => {
                      const displayInfo = getMeetingDisplayInfo(meeting);
                      
                      return (
                        <div 
                          key={meeting.id} 
                          className="text-xs p-1 rounded"
                          style={{ backgroundColor: `${displayInfo.color}40` }}
                        >
                          <div className="font-medium truncate flex items-center">
                            {displayInfo.isPrivate && (
                              <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                            )}
                            {formatTime(new Date(meeting.start))}
                          </div>
                          <div className="truncate">{displayInfo.displayTitle}</div>
                        </div>
                      );
                    })}
                    
                    {day.meetings.length > 8 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.meetings.length - 8} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// DayView Component
const DayView = memo(() => {
  const { state } = useContext(CalendarContext);
  
  const currentDayData = useMemo(() => {
    if (!state.calendarData || !state.calendarData.days) return null;
    
    const dateStr = state.currentDate.toISOString().split('T')[0];
    return state.calendarData.days.find(day => 
      day.dateStr === dateStr
    );
  }, [state.calendarData, state.currentDate]);
  
  const timeline = useMemo(() => {
    if (!currentDayData) return null;
    
    return CalendarDataFactory.createDayTimeline(
      currentDayData,
      currentDayData.meetings || [],
      state.selectedUsers,
      state.currentUser
    );
  }, [currentDayData, state.selectedUsers, state.currentUser]);
  
  if (!timeline) return null;
  
  return (
    <div className="p-4">
      <div className="bg-white rounded border">
        {/* Day header */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="font-medium">
              {new Date(timeline.date).toLocaleDateString('default', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
            <div className="text-sm">
              <span className="font-medium">
                {Math.round(currentDayData.availabilityPercentage)}%
              </span> availability
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {timeline.timeSlots.map((slot, index) => {
            const hour = new Date(slot.start).getHours();
            const minute = new Date(slot.start).getMinutes();
            const isHourStart = minute === 0;
            
            return (
              <div key={index} className="flex border-b last:border-b-0 hover:bg-gray-50">
                {/* Time column */}
                <div className={`w-20 py-2 px-2 text-right text-sm ${isHourStart ? 'font-medium' : ''}`}>
                  {formatTime(slot.start)}
                </div>
                
                {/* Availability indicator */}
                <div className="w-16 py-2 flex items-center">
                  <div 
                    className={`w-full h-5 rounded ${getAvailabilityColor(slot.availabilityPercentage)}`}
                    title={`${Math.round(slot.availabilityPercentage)}% available`}
                  >
                    <div className="text-xs text-center">{Math.round(slot.availabilityPercentage)}%</div>
                  </div>
                </div>
                
                {/* Meetings */}
                <div className="flex-1 py-1 px-2">
                  {slot.meetings.map(meeting => {
                    const displayInfo = getMeetingDisplayInfo(meeting);
                    
                    return (
                      <div 
                        key={meeting.id}
                        className="mb-1 p-2 rounded text-sm"
                        style={{ backgroundColor: `${displayInfo.color}20`, borderLeft: `3px solid ${displayInfo.color}` }}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium flex items-center">
                            {displayInfo.isPrivate && (
                              <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                            )}
                            {displayInfo.displayTitle}
                          </span>
                          <span>
                            {formatTime(new Date(meeting.start))} - {formatTime(new Date(meeting.end))}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {!displayInfo.isPrivate && meeting.attendees ? 
                            `${meeting.attendees.length} attendees` : 
                            'Status: Busy'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Sidebar Component
const Sidebar = memo(() => {
  const { state, dispatch } = useContext(CalendarContext);
  const api = useMemo(() => new CalendarApiService(), []);
  
  // Handle current user change
  const handleCurrentUserChange = async (userId) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: userId });
    
    if (state.selectedUsers.length > 0) {
      await fetchCalendarData(state.selectedUsers);
    }
  };
  
  // Handle meeting duration change
  const handleMeetingDurationChange = (duration) => {
    dispatch({ type: 'SET_MEETING_DURATION', payload: duration });
    
    if (state.calendarData) {
      // Find available slots with new duration
      const availableSlots = CalendarDataFactory.findAvailableSlots(
        state.calendarData,
        state.selectedUsers,
        duration
      );
      
      dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: availableSlots });
      
      // Find optimal meeting time
      const optimalMeetingTime = availableSlots.length > 0 ? availableSlots[0] : null;
      dispatch({ type: 'SET_OPTIMAL_TIME', payload: optimalMeetingTime });
    }
  };
  
  // Handle user selection change
  const handleUserSelectionChange = async (userIds) => {
    dispatch({ type: 'SET_SELECTED_USERS', payload: userIds });
    
    if (userIds.length > 0) {
      await fetchCalendarData(userIds);
    } else {
      dispatch({ type: 'SET_MEETINGS', payload: [] });
      dispatch({ type: 'SET_CALENDAR_DATA', payload: null });
      dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: [] });
      dispatch({ type: 'SET_OPTIMAL_TIME', payload: null });
    }
  };
  
  // Fetch calendar data
  const fetchCalendarData = async (userIds) => {
    dispatch({ 
      type: 'SET_LOADING', 
      payload: { isLoading: true, message: 'Fetching calendar data...' }
    });
    
    try {
      // Fetch meetings
      const meetings = await api.getMeetings(
        userIds,
        state.dateRange.start,
        state.dateRange.end,
        state.currentUser
      );
      
      dispatch({ type: 'SET_MEETINGS', payload: meetings });
      
      // Process calendar data
      const calendarData = CalendarDataFactory.processCalendarData(
        meetings,
        state.users.filter(u => userIds.includes(u.id)),
        state.dateRange,
        state.currentUser
      );
      
      dispatch({ type: 'SET_CALENDAR_DATA', payload: calendarData });
      
      // Find available slots
      const availableSlots = CalendarDataFactory.findAvailableSlots(
        calendarData,
        userIds,
        state.meetingDuration
      );
      
      dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: availableSlots });
      
      // Find optimal meeting time
      const optimalMeetingTime = availableSlots.length > 0 ? availableSlots[0] : null;
      dispatch({ type: 'SET_OPTIMAL_TIME', payload: optimalMeetingTime });
      
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  };
  
  const openDayDetails = (slot) => {
    // Find the day for this slot
    if (!state.calendarData) return;
    
    const day = state.calendarData.days.find(d => 
      new Date(d.date).toDateString() === new Date(slot.date).toDateString()
    );
    
    if (day) {
      dispatch({ type: 'SET_SELECTED_DAY', payload: day });
    }
  };
  
  return (
    <div className="w-64 bg-gray-100 p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Meeting Finder</h2>
      
      {/* Current user selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          View As
        </label>
        <select
          value={state.currentUser || ''}
          onChange={(e) => handleCurrentUserChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {state.users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          This simulates the current logged-in user
        </div>
      </div>
      
      {/* Meeting duration slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Meeting Duration: {state.meetingDuration} minutes
        </label>
        <input
          type="range"
          min="15"
          max="120"
          step="15"
          value={state.meetingDuration}
          onChange={(e) => handleMeetingDurationChange(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>15m</span>
          <span>30m</span>
          <span>60m</span>
          <span>120m</span>
        </div>
      </div>
      
      {/* User selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Users ({state.selectedUsers.length} selected)
        </label>
        <div className="max-h-48 overflow-y-auto border rounded bg-white">
          {state.users.map(user => (
            <div 
              key={user.id}
              className="flex items-center p-2 hover:bg-gray-50 border-b last:border-b-0"
            >
              <input
                type="checkbox"
                id={`user-${user.id}`}
                checked={state.selectedUsers.includes(user.id)}
                onChange={e => {
                  const updatedUsers = e.target.checked
                    ? [...state.selectedUsers, user.id]
                    : state.selectedUsers.filter(id => id !== user.id);
                  handleUserSelectionChange(updatedUsers);
                }}
                className="mr-2"
              />
              <label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer flex-1">
                <div>{user.name}</div>
                <div className="text-xs text-gray-500">{user.department} - {user.role}</div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Status Legend */}
      {state.publicStatuses.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status Legend</label>
          <div className="space-y-1 bg-white rounded border p-2">
            {state.publicStatuses.map(status => (
              <div key={status.id} className="flex items-center text-xs">
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: status.color }}
                ></span>
                {status.name}
              </div>
            ))}
            <div className="flex items-center text-xs mt-1 pt-1 border-t">
              <span className="w-3 h-3 rounded-full mr-2 bg-gray-400"></span>
              Busy (Private)
            </div>
          </div>
        </div>
      )}
      
      {/* Optimal meeting time */}
      <div className="mt-auto mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Optimal Meeting Time</h3>
        {state.optimalMeetingTime ? (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="font-medium text-sm mb-1">
              {formatDate(state.optimalMeetingTime.date)}
            </div>
            <div className="text-sm">
              {formatTime(state.optimalMeetingTime.start)} - {formatTime(state.optimalMeetingTime.end)}
            </div>
            <button
              className="mt-2 w-full px-2 py-1 bg-green-600 text-white text-xs rounded"
              onClick={() => openDayDetails(state.optimalMeetingTime)}
            >
              See Details
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 border rounded p-3 text-sm text-gray-500">
            No optimal time found
          </div>
        )}
      </div>
      
      {/* Available slots */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Available Slots</h3>
        </div>
        
        {state.availableSlots.length > 0 ? (
          <div className="space-y-2">
            {state.availableSlots.slice(0, 3).map((slot, index) => (
              <div 
                key={index} 
                className="bg-white border rounded p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => openDayDetails(slot)}
              >
                <div className="text-xs">{formatDate(slot.date)}</div>
                <div className="font-medium text-sm">
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </div>
              </div>
            ))}
            
            {state.availableSlots.length > 3 && (
              <div className="text-xs text-center text-blue-600">
                +{state.availableSlots.length - 3} more available times
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 border rounded p-3 text-sm text-gray-500">
            No available slots found
          </div>
        )}
      </div>
    </div>
  );
});

// DayModal Component
const DayModal = memo(() => {
  const { state, dispatch } = useContext(CalendarContext);
  const { selectedDay } = state;
  
  if (!selectedDay) return null;
  
  // Create timeline
  const timeline = useMemo(() => {
    return CalendarDataFactory.createDayTimeline(
      selectedDay,
      selectedDay.meetings || [],
      state.selectedUsers,
      state.currentUser
    );
  }, [selectedDay, state.selectedUsers, state.currentUser]);
  
  // Find available slots for this day
  const availableSlots = useMemo(() => {
    if (!timeline) return [];
    
    const dayData = {
      days: [selectedDay]
    };
    
    return CalendarDataFactory.findAvailableSlots(
      dayData, 
      state.selectedUsers, 
      state.meetingDuration
    );
  }, [timeline, selectedDay, state.selectedUsers, state.meetingDuration]);
  
  // Close modal
  const closeModal = () => {
    dispatch({ type: 'SET_SELECTED_DAY', payload: null });
  };
  
  // Prevent event propagation
  const stopPropagation = (e) => e.stopPropagation();
  
  if (!timeline) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={closeModal}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={stopPropagation}
      >
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h3 className="font-bold text-lg">
            {new Date(selectedDay.date).toLocaleDateString('default', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={closeModal}
          >
            ✕
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Timeline */}
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4 bg-blue-50 p-3 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-blue-700">Availability</div>
                  <div className="font-bold text-xl">{Math.round(selectedDay.availabilityPercentage)}%</div>
                </div>
                <div>
                  <div className="text-sm text-blue-700">Meetings</div>
                  <div className="font-bold text-xl">{selectedDay.meetings.length}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-700">Users</div>
                  <div className="font-bold text-xl">{state.selectedUsers.length}</div>
                </div>
              </div>
            </div>
            
            {/* Time slots */}
            {timeline.timeSlots.map((slot, index) => {
              const hour = new Date(slot.start).getHours();
              const minute = new Date(slot.start).getMinutes();
              const isHourStart = minute === 0;
              
              return (
                <div key={index} className="flex border-b last:border-b-0 hover:bg-gray-50">
                  {/* Time column */}
                  <div className={`w-20 py-2 px-2 text-right text-sm ${isHourStart ? 'font-medium' : ''}`}>
                    {formatTime(slot.start)}
                  </div>
                  
                  {/* Availability indicator */}
                  <div className="w-16 py-2 flex items-center">
                    <div 
                      className={`w-full h-5 rounded ${getAvailabilityColor(slot.availabilityPercentage)}`}
                      title={`${Math.round(slot.availabilityPercentage)}% available`}
                    >
                      <div className="text-xs text-center">{Math.round(slot.availabilityPercentage)}%</div>
                    </div>
                  </div>
                  
                  {/* Meetings */}
                  <div className="flex-1 py-1 px-2">
                    {slot.meetings.map(meeting => {
                      const displayInfo = getMeetingDisplayInfo(meeting);
                      
                      return (
                        <div 
                          key={meeting.id}
                          className="mb-1 p-2 rounded text-sm"
                          style={{ backgroundColor: `${displayInfo.color}20`, borderLeft: `3px solid ${displayInfo.color}` }}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium flex items-center">
                              {displayInfo.isPrivate && (
                                <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                              )}
                              {displayInfo.displayTitle}
                            </span>
                            <span>
                              {formatTime(new Date(meeting.start))} - {formatTime(new Date(meeting.end))}
                            </span>
                          </div>
                          {meeting.attendees && !displayInfo.isPrivate && (
                            <div className="text-xs text-gray-600">
                              {meeting.attendees.length} attendees
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Availability sidebar */}
          <div className="w-64 border-l overflow-auto bg-gray-50 p-4">
            <h4 className="font-medium mb-2">Available Slots ({availableSlots.length})</h4>
            
            {availableSlots.length > 0 ? (
              <div className="space-y-2">
                {availableSlots.map((slot, index) => (
                  <div 
                    key={index}
                    className="bg-white border rounded p-2"
                  >
                    <div className="font-medium">
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {slot.duration} minutes
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-100 p-2 rounded text-sm text-gray-500 text-center">
                No available slots found
              </div>
            )}
            
            <h4 className="font-medium mt-4 mb-2">User Availability</h4>
            <div className="space-y-2">
              {state.users
                .filter(u => state.selectedUsers.includes(u.id))
                .map(user => {
                  // Calculate user's availability for this day
                  const userMeetings = selectedDay.meetings.filter(meeting => 
                    meeting.attendees.some(a => a.id === user.id)
                  );
                  
                  const meetingMinutes = userMeetings.reduce((total, meeting) => 
                    total + meeting.duration, 0
                  );
                  
                  const totalMinutes = 660; // 11-hour day (8 AM - 7 PM)
                  const availabilityPercentage = Math.max(0, 100 - (meetingMinutes / totalMinutes) * 100);
                  
                  return (
                    <div key={user.id} className="bg-white border rounded p-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-gray-500">{userMeetings.length} meetings</div>
                        </div>
                        <div 
                          className={`px-2 py-1 rounded text-xs ${getAvailabilityColor(availabilityPercentage)}`}
                        >
                          {Math.round(availabilityPercentage)}%
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// WeekModal Component
const WeekModal = memo(() => {
  const { state, dispatch } = useContext(CalendarContext);
  const { selectedWeek } = state;
  
  if (!selectedWeek) return null;
  
  // Close modal
  const closeModal = () => {
    dispatch({ type: 'SET_SELECTED_WEEK', payload: null });
  };
  
  // Navigate to day
  const navigateToDay = (day) => {
    closeModal();
    dispatch({ type: 'SET_SELECTED_DAY', payload: day });
  };
  
  // Prevent event propagation
  const stopPropagation = (e) => e.stopPropagation();
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={closeModal}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={stopPropagation}
      >
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h3 className="font-bold text-lg">
            Week {selectedWeek.weekNumber}, {selectedWeek.year}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={closeModal}
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {/* Week summary */}
          <div className="mb-4 bg-blue-50 p-3 rounded">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-blue-700">Average Availability</div>
                <div className="font-bold text-xl">{Math.round(selectedWeek.availabilityPercentage)}%</div>
              </div>
              <div>
                <div className="text-sm text-blue-700">Total Meetings</div>
                <div className="font-bold text-xl">{selectedWeek.totalMeetings}</div>
              </div>
              <div>
                <div className="text-sm text-blue-700">Users</div>
                <div className="font-bold text-xl">{state.selectedUsers.length}</div>
              </div>
            </div>
          </div>
          
          {/* Days of the week */}
          <div className="grid grid-cols-1 gap-4">
            {selectedWeek.days
              .filter(day => !day.isEmpty)
              .map(day => {
                const date = new Date(day.date);
                const isWeekendDate = date.getDay() === 0 || date.getDay() === 6;
                
                if (isWeekendDate) return null;
                
                return (
                  <div 
                    key={day.dateStr}
                    className={`border rounded overflow-hidden cursor-pointer hover:border-blue-500 ${
                      getAvailabilityColor(day.availabilityPercentage)
                    }`}
                    onClick={() => navigateToDay(day)}
                  >
                    <div className="flex">
                      {/* Day info */}
                      <div className="w-40 p-3 bg-gray-50 border-r">
                        <div className="font-medium">{formatDate(date)}</div>
                        <div className="text-sm mt-1">
                          <span className="font-medium">{Math.round(day.availabilityPercentage)}%</span> available
                        </div>
                        <div className="text-sm text-gray-500">
                          {day.meetings.length} meetings
                        </div>
                      </div>
                      
                      {/* Meeting summary */}
                      <div className="flex-1 p-2">
                        <div className="space-y-1">
                          {day.meetings.slice(0, 3).map(meeting => {
                            const displayInfo = getMeetingDisplayInfo(meeting);
                            
                            return (
                              <div 
                                key={meeting.id}
                                className="flex justify-between text-sm p-1 rounded"
                                style={{ backgroundColor: `${displayInfo.color}20` }}
                              >
                                <span className="truncate flex items-center">
                                  {displayInfo.isPrivate && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                                  )}
                                  {displayInfo.displayTitle}
                                </span>
                                <span className="text-xs whitespace-nowrap ml-2">
                                  {formatTime(new Date(meeting.start))}
                                </span>
                              </div>
                            );
                          })}
                          
                          {day.meetings.length > 3 && (
                            <div className="text-xs text-center text-gray-500">
                              +{day.meetings.length - 3} more
                            </div>
                          )}
                          
                          {day.meetings.length === 0 && (
                            <div className="text-sm text-center text-gray-500 p-2">
                              No meetings scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
});

// Header Component
const Header = memo(() => {
  const { state, dispatch } = useContext(CalendarContext);
  
  // Navigation functions
  const navigateToPreviousMonth = () => {
    const newDate = new Date(state.currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    dispatch({ type: 'SET_CURRENT_DATE', payload: newDate });
  };
  
  const navigateToNextMonth = () => {
    const newDate = new Date(state.currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    dispatch({ type: 'SET_CURRENT_DATE', payload: newDate });
  };
  
  const navigateToToday = () => {
    dispatch({ type: 'SET_CURRENT_DATE', payload: new Date() });
  };
  
  return (
    <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold mr-4">
          {state.viewMode === 'month' && (
            new Date(state.currentYear, state.currentMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })
          )}
          {state.viewMode === 'week' && (
            `Week of ${formatDate(state.currentDate)}`
          )}
          {state.viewMode === 'day' && (
            formatDate(state.currentDate)
          )}
        </h1>
        <div className="flex space-x-2">
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={navigateToPreviousMonth}
          >
            &lt;
          </button>
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={navigateToToday}
          >
            Today
          </button>
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={navigateToNextMonth}
          >
            &gt;
          </button>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          className={`px-3 py-1 rounded ${state.viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'month' })}
        >
          Month
        </button>
        <button
          className={`px-3 py-1 rounded ${state.viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'week' })}
        >
          Week
        </button>
        <button
          className={`px-3 py-1 rounded ${state.viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'day' })}
        >
          Day
        </button>
      </div>
    </div>
  );
});

// Register components
registerComponent('MonthView', MonthView);
registerComponent('WeekView', WeekView);
registerComponent('DayView', DayView);

// Main Calendar Application
const CalendarAppContent = () => {
  const { state, dispatch } = useContext(CalendarContext);
  const api = useMemo(() => new CalendarApiService(), []);
  
  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Loading data...' } });
      
      try {
        // Fetch users
        const users = await api.getUsers();
        dispatch({ type: 'SET_USERS', payload: users });
        
        // Set current user
        dispatch({ type: 'SET_CURRENT_USER', payload: users[0].id });
        
        // Fetch departments
        const departments = await api.getDepartments();
        dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
        
        // Fetch public statuses
        const statuses = await api.getPublicStatuses();
        dispatch({ type: 'SET_STATUSES', payload: statuses });
        
        // Select engineering department users as default
        const engineeringUsers = users.filter(u => u.department === 'Engineering');
        dispatch({ type: 'SET_SELECTED_USERS', payload: engineeringUsers.map(u => u.id) });
        
        // Fetch calendar data
        const meetings = await api.getMeetings(
          engineeringUsers.map(u => u.id),
          state.dateRange.start,
          state.dateRange.end,
          users[0].id
        );
        
        dispatch({ type: 'SET_MEETINGS', payload: meetings });
        
        // Process calendar data
        const calendarData = CalendarDataFactory.processCalendarData(
          meetings,
          engineeringUsers,
          state.dateRange,
          users[0].id
        );
        
        dispatch({ type: 'SET_CALENDAR_DATA', payload: calendarData });
        
        // Find available slots
        const availableSlots = CalendarDataFactory.findAvailableSlots(
          calendarData,
          engineeringUsers.map(u => u.id),
          state.meetingDuration
        );
        
        dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: availableSlots });
        
        // Find optimal meeting time
        const optimalMeetingTime = availableSlots.length > 0 ? availableSlots[0] : null;
        dispatch({ type: 'SET_OPTIMAL_TIME', payload: optimalMeetingTime });
        
        dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
      } catch (error) {
        console.error('Error fetching initial data:', error);
        dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
      }
    };
    
    fetchInitialData();
  }, [api, dispatch, state.dateRange]);
  
  // Get appropriate view component
  const ViewComponent = getComponent(state.viewMode + 'View');
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Loading indicator */}
        {state.isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <div className="text-gray-500">{state.loadingMessage}</div>
            </div>
          </div>
        )}
        
        {/* Calendar view */}
        {!state.isLoading && state.calendarData && (
          <ViewComponent 
            currentMonth={state.currentMonth} 
            currentYear={state.currentYear} 
          />
        )}
        
        {/* Day modal */}
        {state.selectedDay && <DayModal />}
        
        {/* Week modal */}
        {state.selectedWeek && <WeekModal />}
      </div>
    </div>
  );
};

// Main App with Context
const Calendar = () => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  
  return (
    <CalendarContext.Provider value={{ state, dispatch }}>
      <CalendarAppContent />
    </CalendarContext.Provider>
  );
};

export default Calendar;