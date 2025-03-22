import React, { memo, useCallback } from 'react';
import Tab from '../ui/Tab';
import AdjustmentPanel from './AdjustmentPanel';
import TransformPanel from './TransformPanel';
import HistoryPanel from './HistoryPanel';

// Tab container component
const ControlTabs = memo(({ context }) => {
  const { ui, updateUi } = context;
  
  // Memoize the tab change handler
  const handleTabChange = useCallback((tabId) => {
    updateUi({ activeTab: tabId });
  }, [updateUi]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex border-b">
        <Tab id="adjust" label="Colors & Adjustments" activeTab={ui.activeTab} onTabChange={handleTabChange} />
        <Tab id="transform" label="Transform" activeTab={ui.activeTab} onTabChange={handleTabChange} />
        <Tab id="history" label="History" activeTab={ui.activeTab} onTabChange={handleTabChange} />
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto">
        {ui.activeTab === 'adjust' && <AdjustmentPanel context={context} />}
        {ui.activeTab === 'transform' && <TransformPanel context={context} />}
        {ui.activeTab === 'history' && <HistoryPanel context={context} />}
      </div>
    </div>
  );
});

export default ControlTabs;