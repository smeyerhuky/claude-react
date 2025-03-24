import React, { useState } from 'react';
import FourierSeriesDemo from './FourierSeriesDemo';
import FourierTransformDemo from './FourierTransformDemo';
import ExplanationPanel from './components/ExplanationPanel';
import FourierPresetDemo from './components/PresetsDemo';

/**
 * Main container component with tabs for different Fourier visualizations
 */
const FourierVisualizerTabs = () => {
  // State to track the active tab
  const [activeTab, setActiveTab] = useState('series');
  // State to control visibility of explanation panel
  const [showExplanation, setShowExplanation] = useState(true);

  // Tab configuration
  const tabs = [
    { id: 'series', label: 'Fourier Series', component: FourierSeriesDemo },
    { id: 'transform', label: 'Fourier Transform', component: FourierTransformDemo },
    { id: 'presets', label: 'Presets Demo', component: FourierPresetDemo }
  ];

  // Get the active component based on the current tab
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || tabs[0].component;

  return (
    <div className="fourier-visualizer-container p-4 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Interactive Fourier Visualizations</h1>
        
        {/* Info toggle button */}
        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </button>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 font-medium ${
              activeTab === tab.id 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Explanation panel - visible by default but can be toggled */}
      {showExplanation && (
        <ExplanationPanel mode={activeTab} className="mb-6" />
      )}
      
      {/* The active visualization component */}
      <ActiveComponent />
      
      {/* Attribution footer */}
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Interactive Fourier visualizations for educational purposes.</p>
        <p className="mt-1">Created with React and modern web technologies.</p>
      </footer>
    </div>
  );
};

export default FourierVisualizerTabs;
