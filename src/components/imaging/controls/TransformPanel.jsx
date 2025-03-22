import React, { memo } from 'react';
import Slider from '../ui/Slider';
import Button from '../ui/Button';

// Transform panel for geometric transformations
const TransformPanel = memo(({ context }) => {
  const {
    adjustments,
    updateAdjustments,
    addToHistory,
    handleTransformChange
  } = context;

  const { rotate, scale, flipX, flipY, shearX, shearY, stretchX, stretchY } = adjustments.transform;

  // Reset all transforms
  const resetAllTransforms = () => {
    updateAdjustments('transform', {
      rotate: 0,
      scale: 100,
      flipX: false,
      flipY: false,
      shearX: 0,
      shearY: 0,
      stretchX: 100,
      stretchY: 100
    });
    addToHistory("Reset Transform");
  };

  return (
    <div>
      <h3 className="font-semibold mb-2 flex justify-between items-center">
        <span>Transform</span>
        <button
          onClick={resetAllTransforms}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center"
          title="Reset transform"
        >
          <span className="mr-1">↺</span> Reset
        </button>
      </h3>

      {/* Scale */}
      <Slider
        label="Scale"
        value={scale}
        min={10}
        max={200}
        unit="%"
        resetValue={100}
        onChange={(value) => handleTransformChange('scale', value)}
        onAfterChange={() => addToHistory("Adjust Scale")}
        onReset={() => {
          handleTransformChange('scale', 100);
          addToHistory("Reset Scale");
        }}
      />

      {/* Rotate */}
      <div className="mb-3">
        <div className="flex justify-between">
          <label className="text-sm">Rotate</label>
          <span className="text-sm">{rotate}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={rotate}
          onChange={(e) => handleTransformChange('rotate', parseInt(e.target.value))}
          onMouseUp={() => addToHistory("Adjust Rotation")}
          className="w-full"
        />

        {/* Quick rotation buttons */}
        <div className="flex justify-between mt-1">
          {[
            { label: "-90°", value: (rotate - 90 + 360) % 360 },
            { label: "0°", value: 0 },
            { label: "+90°", value: (rotate + 90) % 360 },
            { label: "180°", value: 180 }
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => {
                handleTransformChange('rotate', btn.value);
                addToHistory(`Rotate ${btn.label}`);
              }}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* NEW: Shear controls */}
      <div className="mb-3 p-3 bg-gray-50 rounded">
        <h4 className="text-sm font-medium mb-2">Shear (Skew)</h4>
        
        {/* Shear X */}
        <Slider
          label="Horizontal Shear"
          value={shearX}
          min={-50}
          max={50}
          resetValue={0}
          onChange={(value) => handleTransformChange('shearX', value)}
          onAfterChange={() => addToHistory("Adjust Horizontal Shear")}
          onReset={() => {
            handleTransformChange('shearX', 0);
            addToHistory("Reset Horizontal Shear");
          }}
        />
        
        {/* Shear Y */}
        <Slider
          label="Vertical Shear"
          value={shearY}
          min={-50}
          max={50}
          resetValue={0}
          onChange={(value) => handleTransformChange('shearY', value)}
          onAfterChange={() => addToHistory("Adjust Vertical Shear")}
          onReset={() => {
            handleTransformChange('shearY', 0);
            addToHistory("Reset Vertical Shear");
          }}
        />
      </div>

      {/* NEW: Stretch controls */}
      <div className="mb-3 p-3 bg-gray-50 rounded">
        <h4 className="text-sm font-medium mb-2">Stretch</h4>
        
        {/* Stretch X */}
        <Slider
          label="Horizontal Stretch"
          value={stretchX}
          min={10}
          max={200}
          unit="%"
          resetValue={100}
          onChange={(value) => handleTransformChange('stretchX', value)}
          onAfterChange={() => addToHistory("Adjust Horizontal Stretch")}
          onReset={() => {
            handleTransformChange('stretchX', 100);
            addToHistory("Reset Horizontal Stretch");
          }}
        />
        
        {/* Stretch Y */}
        <Slider
          label="Vertical Stretch"
          value={stretchY}
          min={10}
          max={200}
          unit="%"
          resetValue={100}
          onChange={(value) => handleTransformChange('stretchY', value)}
          onAfterChange={() => addToHistory("Adjust Vertical Stretch")}
          onReset={() => {
            handleTransformChange('stretchY', 100);
            addToHistory("Reset Vertical Stretch");
          }}
        />
      </div>

      {/* Flip buttons */}
      <div className="flex space-x-2">
        <Button
          onClick={() => {
            handleTransformChange('flipX', !flipX);
            addToHistory(flipX ? "Unflip X" : "Flip X");
          }}
          variant={flipX ? "active" : "default"}
          className="flex-1"
        >
          Flip X
        </Button>
        <Button
          onClick={() => {
            handleTransformChange('flipY', !flipY);
            addToHistory(flipY ? "Unflip Y" : "Flip Y");
          }}
          variant={flipY ? "active" : "default"}
          className="flex-1"
        >
          Flip Y
        </Button>
      </div>
      
      {/* Quick presets for shear/stretch combinations */}
      <div className="mt-3">
        <h4 className="text-sm font-medium mb-2">Transform Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              updateAdjustments('transform', {
                ...adjustments.transform,
                shearX: 25,
                shearY: 0,
                stretchX: 100,
                stretchY: 100
              });
              addToHistory("Apply Slant Right");
            }}
            size="sm"
          >
            Slant Right
          </Button>
          <Button
            onClick={() => {
              updateAdjustments('transform', {
                ...adjustments.transform,
                shearX: -25,
                shearY: 0,
                stretchX: 100,
                stretchY: 100
              });
              addToHistory("Apply Slant Left");
            }}
            size="sm"
          >
            Slant Left
          </Button>
          <Button
            onClick={() => {
              updateAdjustments('transform', {
                ...adjustments.transform,
                shearX: 0,
                shearY: 0,
                stretchX: 130,
                stretchY: 70
              });
              addToHistory("Apply Wide & Short");
            }}
            size="sm"
          >
            Wide & Short
          </Button>
          <Button
            onClick={() => {
              updateAdjustments('transform', {
                ...adjustments.transform,
                shearX: 0,
                shearY: 0,
                stretchX: 70,
                stretchY: 130
              });
              addToHistory("Apply Tall & Thin");
            }}
            size="sm"
          >
            Tall & Thin
          </Button>
        </div>
      </div>
    </div>
  );
});

export default TransformPanel;