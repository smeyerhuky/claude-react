import React from 'react';

/**
 * Component for selecting preset signal patterns
 * Displays a list of available presets with visual previews
 */
const PresetSelector = ({
  presets = [],
  activePreset = null,
  onSelectPreset
}) => {
  // If no presets available, don't render anything
  if (presets.length === 0) return null;
  
  return (
    <div className="preset-selector bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">Preset Signals</h2>
      
      <div className="space-y-2">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset.id)}
            className={`w-full text-left p-2 rounded transition-colors flex items-center ${
              activePreset && activePreset.id === preset.id
                ? 'bg-blue-100 border border-blue-300'
                : 'hover:bg-gray-100 border border-gray-200'
            }`}
            aria-pressed={activePreset && activePreset.id === preset.id}
          >
            {/* Preset preview */}
            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
              {preset.preview ? (
                <img 
                  src={preset.preview} 
                  alt={preset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PresetPreview points={preset.points} />
              )}
            </div>
            
            <div>
              <div className="font-medium">{preset.name}</div>
              <div className="text-xs text-gray-500">{preset.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Select a preset or draw your own signal on the canvas.</p>
      </div>
    </div>
  );
};

/**
 * Creates a small preview of a signal based on its points
 */
const PresetPreview = ({ points }) => {
  if (!points || points.length === 0) return null;
  
  const width = 48;
  const height = 48;
  
  // Find min/max values to scale the points
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  points.forEach(point => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });
  
  // Add padding
  const padding = 4;
  const scaleX = (width - 2 * padding) / (maxX - minX || 1);
  const scaleY = (height - 2 * padding) / (maxY - minY || 1);
  
  // Scale points to fit preview size
  const scaledPoints = points.map(point => ({
    x: padding + (point.x - minX) * scaleX,
    y: padding + (point.y - minY) * scaleY
  }));
  
  // Create SVG path
  let path = '';
  scaledPoints.forEach((point, index) => {
    path += `${index === 0 ? 'M' : 'L'} ${point.x},${point.y} `;
  });
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke="blue" strokeWidth="1" />
    </svg>
  );
};

export default PresetSelector;
