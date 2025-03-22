import React, { memo } from 'react';

/**
 * Tab component for navigation interfaces
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the tab
 * @param {string} props.label - Display text for the tab
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onTabChange - Callback when tab is clicked
 * @returns {JSX.Element} - Tab button component
 */
const Tab = memo(({ id, label, activeTab, onTabChange }) => (
  <button
    onClick={() => onTabChange(id)}
    className={`flex-1 py-2 text-center ${activeTab === id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
  >
    {label}
  </button>
));

export default Tab;