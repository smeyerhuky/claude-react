import React, { memo } from 'react';
import Button from '../ui/Button';

// Save dialog component
const SaveDialog = memo(({ saveDialog, updateUi, saveImage }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full">
        <h3 className="text-lg font-bold mb-4">Save Image</h3>

        <div className="mb-4">
          <label htmlFor="filename" className="block text-sm font-medium mb-1">Filename:</label>
          <input
            type="text"
            id="filename"
            value={saveDialog.filename}
            onChange={(e) => updateUi({ saveDialog: { ...saveDialog, filename: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="format" className="block text-sm font-medium mb-1">Format:</label>
          <select
            id="format"
            value={saveDialog.format}
            onChange={(e) => updateUi({ saveDialog: { ...saveDialog, format: e.target.value } })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="png">PNG (lossless)</option>
            <option value="jpeg">JPEG (smaller size)</option>
            <option value="webp">WebP (best quality/size ratio)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {saveDialog.format === 'png' && 'PNG provides the best quality but largest file size'}
            {saveDialog.format === 'jpeg' && 'JPEG is suitable for photographs with smaller file size'}
            {saveDialog.format === 'webp' && 'WebP provides good quality with smaller file size but may not be supported by all software'}
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            onClick={() => updateUi({ saveDialog: { ...saveDialog, open: false } })}
            variant="default"
          >
            Cancel
          </Button>
          <Button
            onClick={saveImage}
            variant="success"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
});

export default SaveDialog;