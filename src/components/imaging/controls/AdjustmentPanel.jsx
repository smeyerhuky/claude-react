import React, { memo } from 'react';
import Slider from '../ui/Slider';
import Button from '../ui/Button';

// Adjustment panel for color controls
const AdjustmentPanel = memo(({ context }) => {
  const {
    adjustments,
    updateAdjustments,
    addToHistory,
    toggleChannelLock,
    handleChannelChange,
    handleFilterChange
  } = context;

  // RGB Channel controls
  const RGBControls = () => (
    <div className="mb-6">
      <h3 className="font-semibold mb-2 flex justify-between items-center">
        <span>RGB Channels</span>
        <button
          onClick={() => {
            updateAdjustments('channels', {
              r: { value: 100, min: 0, max: 255 },
              g: { value: 100, min: 0, max: 255 },
              b: { value: 100, min: 0, max: 255 }
            });
            addToHistory("Reset RGB");
          }}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center"
          title="Reset RGB settings"
        >
          <span className="mr-1">↺</span> Reset
        </button>
      </h3>

      {['r', 'g', 'b'].map(ch => {
        const channel = adjustments.channels[ch];
        const locked = adjustments.locks[ch];

        const colorMap = {
          r: 'red',
          g: 'green',
          b: 'blue'
        };

        const colorClass = {
          r: 'bg-red-500',
          g: 'bg-green-500',
          b: 'bg-blue-500'
        };

        const lockColorClass = {
          r: 'bg-red-100',
          g: 'bg-green-100',
          b: 'bg-blue-100'
        };

        return (
          <div className="mb-4" key={ch}>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm flex items-center">
                <span className={`w-3 h-3 inline-block ${colorClass[ch]} mr-1 rounded-full`}></span>
                {colorMap[ch]}
              </label>
              <div className="flex items-center">
                <span className="text-sm mr-2">{channel.value}%</span>
                <button
                  onClick={() => toggleChannelLock(ch)}
                  className={`w-6 h-6 flex items-center justify-center rounded ${locked ? lockColorClass[ch] : 'bg-gray-100'}`}
                >
                  <span className="text-xs">{locked ? '🔒' : '🔓'}</span>
                </button>
              </div>
            </div>

            {/* Main intensity slider */}
            <input
              type="range"
              min="0"
              max="200"
              value={channel.value}
              onChange={(e) => handleChannelChange(ch, 'value', parseInt(e.target.value))}
              onMouseUp={() => addToHistory(`Adjust ${colorMap[ch]}`)}
              className="w-full"
            />

            {/* Min/max range sliders */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-xs text-gray-500 block">Min</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={channel.min}
                    onChange={(e) => handleChannelChange(ch, 'min', parseInt(e.target.value))}
                    onMouseUp={() => addToHistory(`Adjust ${colorMap[ch]} Range`)}
                    className="w-full"
                  />
                  <span className="text-xs ml-1 w-6 text-right">{channel.min}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Max</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={channel.max}
                    onChange={(e) => handleChannelChange(ch, 'max', parseInt(e.target.value))}
                    onMouseUp={() => addToHistory(`Adjust ${colorMap[ch]} Range`)}
                    className="w-full"
                  />
                  <span className="text-xs ml-1 w-6 text-right">{channel.max}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Lock all channels */}
      <Button
        onClick={() => toggleChannelLock('all')}
        variant={adjustments.locks.all ? "active" : "default"}
        fullWidth
      >
        {adjustments.locks.all ? 'Unlock All Channels' : 'Lock All Channels'}
      </Button>
    </div>
  );

  // Filter controls
  const FilterControls = () => {
    const filterConfig = [
      { name: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%', defaultValue: 100 },
      { name: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%', defaultValue: 100 },
      { name: 'saturation', label: 'Saturation', min: 0, max: 200, unit: '%', defaultValue: 100 },
      { name: 'hue', label: 'Hue Rotate', min: 0, max: 360, unit: '°', defaultValue: 0 },
      { name: 'blur', label: 'Blur', min: 0, max: 10, unit: 'px', defaultValue: 0, step: 0.1 },
      { name: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%', defaultValue: 0 },
      { name: 'invert', label: 'Invert', min: 0, max: 100, unit: '%', defaultValue: 0 }
    ];

    return (
      <div>
        <h3 className="font-semibold mb-2 flex justify-between items-center">
          <span>Adjustments</span>
          <button
            onClick={() => {
              updateAdjustments('filters', {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
                blur: 0,
                grayscale: 0,
                invert: 0
              });
              addToHistory("Reset Adjustments");
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center"
            title="Reset adjustments"
          >
            <span className="mr-1">↺</span> Reset
          </button>
        </h3>

        {filterConfig.map(filter => (
          <Slider
            key={filter.name}
            label={filter.label}
            value={adjustments.filters[filter.name]}
            min={filter.min}
            max={filter.max}
            step={filter.step || 1}
            unit={filter.unit}
            resetValue={filter.defaultValue}
            onChange={(value) => handleFilterChange(filter.name, value)}
            onAfterChange={() => addToHistory(`Adjust ${filter.label}`)}
            onReset={() => {
              handleFilterChange(filter.name, filter.defaultValue);
              addToHistory(`Reset ${filter.label}`);
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <RGBControls />
      <FilterControls />
    </div>
  );
});

export default AdjustmentPanel;