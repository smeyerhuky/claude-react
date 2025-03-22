import React, { memo } from 'react';
import Button from '../ui/Button';

// Quick actions panel
const QuickActions = memo(({ adjustments, updateAdjustments, addToHistory }) => {
  const actions = [
    {
      name: "Grayscale",
      action: () => {
        updateAdjustments('filters.grayscale', 100);
        addToHistory("Convert to Grayscale");
      }
    },
    {
      name: "Invert",
      action: () => {
        updateAdjustments('filters.invert', 100);
        addToHistory("Invert Colors");
      }
    },
    {
      name: "Auto Enhance",
      action: () => {
        const newFilters = {
          ...adjustments.filters,
          brightness: 120,
          contrast: 120
        };
        updateAdjustments('filters', newFilters);
        addToHistory("Auto Enhance");
      }
    },
    {
      name: "Vibrance",
      action: () => {
        updateAdjustments('filters.saturation', 150);
        addToHistory("Increase Vibrance");
      }
    },
    {
      name: "Cool Tone",
      action: () => {
        updateAdjustments('channels', {
          ...adjustments.channels,
          r: { ...adjustments.channels.r, value: 80 },
          b: { ...adjustments.channels.b, value: 120 }
        });
        addToHistory("Apply Cool Tone");
      }
    },
    {
      name: "Warm Tone",
      action: () => {
        updateAdjustments('channels', {
          ...adjustments.channels,
          r: { ...adjustments.channels.r, value: 120 },
          b: { ...adjustments.channels.b, value: 80 }
        });
        addToHistory("Apply Warm Tone");
      }
    }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="font-semibold mb-2">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(action => (
          <Button
            key={action.name}
            onClick={action.action}
            size="sm"
            variant="default"
          >
            {action.name}
          </Button>
        ))}
      </div>
    </div>
  );
});

export default QuickActions;