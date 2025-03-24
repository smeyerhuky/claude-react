import React from 'react';

/**
 * Component for controlling various parameters of the Fourier visualizations
 */
const ControlPanel = ({
  numTerms = 10,
  onNumTermsChange,
  speed = 1,
  onSpeedChange,
  className = ''
}) => {
  return (
    <div className={`control-panel bg-white p-4 rounded-lg shadow ${className}`}>
      <h2 className="text-lg font-semibold mb-3">Controls</h2>
      
      {/* Number of Fourier terms slider */}
      {onNumTermsChange && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Number of Terms: {numTerms}
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="1"
              max="50"
              value={numTerms}
              onChange={(e) => onNumTermsChange(parseInt(e.target.value))}
              className="flex-grow mr-2"
              aria-label="Number of Fourier terms"
            />
            <div className="flex">
              <button
                onClick={() => onNumTermsChange(Math.max(1, numTerms - 1))}
                className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300"
                aria-label="Decrease number of terms"
              >
                -
              </button>
              <button
                onClick={() => onNumTermsChange(numTerms + 1)}
                className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300"
                aria-label="Increase number of terms"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            More terms = more accurate approximation but slower performance
          </p>
        </div>
      )}
      
      {/* Animation speed slider */}
      {onSpeedChange && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Animation Speed: {speed.toFixed(1)}x
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="flex-grow mr-2"
              aria-label="Animation speed"
            />
            <div className="flex">
              <button
                onClick={() => onSpeedChange(Math.max(0.1, speed - 0.1))}
                className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300"
                aria-label="Decrease animation speed"
              >
                -
              </button>
              <button
                onClick={() => onSpeedChange(Math.min(3, speed + 0.1))}
                className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300"
                aria-label="Increase animation speed"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Adjust how fast the animation runs
          </p>
        </div>
      )}
      
      {/* Keyboard shortcuts info */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
        <h3 className="font-medium mb-2">Keyboard Shortcuts:</h3>
        <ul className="space-y-1 text-gray-700">
          <li>← → : Navigate between tabs</li>
          <li>+ - : Adjust number of terms</li>
          <li>Space : Play/Pause animation</li>
          <li>R : Reset/Clear drawing</li>
        </ul>
      </div>
    </div>
  );
};

export default ControlPanel;
