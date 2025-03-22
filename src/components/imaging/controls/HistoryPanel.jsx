import React, { memo } from 'react';

// History panel component
const HistoryPanel = memo(({ context }) => {
  const { history, timeTravel } = context;

  return (
    <div>
      <h3 className="font-semibold mb-2">Edit History</h3>

      {history.labels.length > 0 ? (
        <div className="max-h-80 overflow-y-auto">
          {history.labels.map((label, index) => (
            <div
              key={index}
              onClick={() => timeTravel(index)}
              className={`py-1 px-2 rounded text-sm cursor-pointer mb-1 flex items-center ${
                index === history.index
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="w-4">{index + 1}.</span>
              <span className="flex-1">{label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No history yet</p>
      )}
    </div>
  );
});

export default HistoryPanel;