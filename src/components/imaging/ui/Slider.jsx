import React, { memo } from 'react';

/**
 * Reusable Slider component with label, value display, and reset functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the slider
 * @param {number} props.value - Current value
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {Function} props.onChange - Handler for value changes
 * @param {Function} props.onAfterChange - Handler called after interaction ends
 * @param {number} props.step - Step increment (default: 1)
 * @param {string} props.unit - Unit symbol to display (e.g., '%', 'px')
 * @param {number|null} props.resetValue - Value to reset to, null to hide reset button
 * @param {Function} props.onReset - Handler for reset action
 * @returns {JSX.Element} - Slider component
 */
const Slider = memo(({ 
  label, 
  value, 
  min, 
  max, 
  onChange, 
  onAfterChange, 
  step = 1,
  unit = '',
  resetValue = null,
  onReset = null,
}) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between">
        <label className="text-sm flex items-center">
          {label}
          {resetValue !== null && value !== resetValue && onReset && (
            <button
              onClick={onReset}
              className="ml-1 text-xs text-gray-500 hover:text-gray-700"
              title={`Reset to ${resetValue}${unit}`}
            >
              ↺
            </button>
          )}
        </label>
        <span className="text-sm">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={onAfterChange}
        className="w-full"
      />
    </div>
  );
});

export default Slider;