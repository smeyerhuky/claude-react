import React, { memo } from 'react';

// Image display component
const ImagePreview = memo(({ canvasRef, isProcessing }) => {
  return (
    <div className="flex-1 mb-4">
      <div className="bg-white p-2 rounded shadow-inner flex items-center justify-center h-80 relative">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Processing indicator below image */}
      <div className="h-6 flex justify-center items-center">
        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Processing image...</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default ImagePreview;