import React, { memo } from 'react';
import { calculateAspectRatio } from './utils/helpers';

// Info panel with histogram
const InfoPanel = memo(({ image, adjustments }) => {
  // Calculate effective dimensions
  const effectiveWidth = Math.round(image.info.width * adjustments.transform.scale / 100);
  const effectiveHeight = Math.round(image.info.height * adjustments.transform.scale / 100);
  
  // Calculate aspect ratio
  const aspectRatio = calculateAspectRatio(effectiveWidth, effectiveHeight);

  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {/* Basic info */}
      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold mb-2">Image Information</h3>
        <div>
          <p className="text-sm">Original Size: {image.info.width} × {image.info.height}px</p>
          <p className="text-sm">Scale: {adjustments.transform.scale}%</p>
          <p className="text-sm">Current Size: {effectiveWidth} × {effectiveHeight}px</p>
          <p className="text-sm">Aspect Ratio: {aspectRatio}</p>
          
          <p className="text-sm mt-2">Average RGB:
            <span className="inline-block ml-2 w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: `rgb(${image.info.avgColor.r}, ${image.info.avgColor.g}, ${image.info.avgColor.b})` }}></span>
            <span className="ml-1">[{image.info.avgColor.r}, {image.info.avgColor.g}, {image.info.avgColor.b}]</span>
          </p>

          <div className="mt-2 flex flex-col gap-1">
            {['r', 'g', 'b'].map((ch) => {
              const colorClass = {
                r: 'bg-red-500',
                g: 'bg-green-500',
                b: 'bg-blue-500'
              }[ch];

              const value = image.info.avgColor[ch];

              return (
                <div className="flex items-center" key={ch}>
                  <span className={`w-2 h-2 ${colorClass} rounded-full mr-1`}></span>
                  <div className={`h-2 ${colorClass}`} style={{ width: `${value / 2.55}%` }}></div>
                  <span className="ml-1 text-xs">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Histogram */}
      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold mb-2">Histogram</h3>
        <div className="flex space-x-1 h-40">
          {['r', 'g', 'b'].map(channel => {
            const colorClass = {
              r: 'bg-red-500',
              g: 'bg-green-500',
              b: 'bg-blue-500'
            }[channel];

            const hist = image.info.histogram[channel];

            return (
              <div className="flex-1 flex flex-col" key={channel}>
                <div className="text-xs text-center font-medium">
                  {channel === 'r' ? 'Red' : channel === 'g' ? 'Green' : 'Blue'}
                </div>
                <div className="flex-1 relative bg-gray-100">
                  <div className="absolute inset-0 flex items-end">
                    {hist.map((value, index) => (
                      <div
                        key={index}
                        className={`w-1 ${colorClass} opacity-70`}
                        style={{ height: `${value}%`, marginRight: '1px' }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex justify-between mt-1">
                  <span>0</span>
                  <span>255</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default InfoPanel;