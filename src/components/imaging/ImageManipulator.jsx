import { useRef, useEffect, useCallback } from 'react';

// Import Hooks
import useImageProcessor from './hooks/useImageProcessor';

// Import Helpers
import ImageProcessor from './utils/ImageProcessor';
import { debounce } from './utils/helpers';

// Import sub-components
import InfoPanel from './InfoPanel';
import ControlTabs from './controls/ControlTabs';
import QuickActions from './controls/QuickActions';
import SaveDialog from './dialogs/SaveDialog';
import ImagePreview from './ImagePreview';
import Button from './ui/Button';


// Main component
const ImageManipulator = () => {
  // Use our custom hook
  const {
    image,
    ui, setUi,
    adjustments, setAdjustments,
    history,
    addToHistory,
    undo, redo,
    resetAll,
    loadImage
  } = useImageProcessor();

  // Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const renderRequestRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Helper to update UI state
  const updateUi = useCallback((updates) => {
    setUi(prev => ({ ...prev, ...updates }));
  }, [setUi]);

  // Helper to update adjustments with debouncing for improved performance
  const updateAdjustments = useCallback((path, value) => {
    // Immediately update UI for responsiveness
    setAdjustments(prev => {
      const newAdjustments = { ...prev };
      
      // Split path by dots to navigate the object
      const keys = path.split('.');
      let current = newAdjustments;
      
      // Navigate to the right property
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      // Set the value
      current[keys[keys.length - 1]] = value;
      
      return newAdjustments;
    });
  }, [setAdjustments]);

  // Debounced version of updateAdjustments for sliders
  const debouncedUpdateAdjustments = useCallback(
    debounce((path, value) => {
      updateAdjustments(path, value);
    }, 10),
    [updateAdjustments]
  );

  // Process the image - Improved function with debouncing
  const processImage = useCallback(() => {
    if (!canvasRef.current || !image.original || isProcessingRef.current) return;
    
    // Set processing flag
    isProcessingRef.current = true;
    
    try {
      updateUi({ isProcessing: true });
      
      // Delay the actual processing to prevent excessive rendering
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
          isProcessingRef.current = false;
          updateUi({ isProcessing: false });
          return;
        }
        
        const { transform, filters } = adjustments;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Calculate new dimensions based on scaling
        const newWidth = Math.round(image.original.width * (transform.scale / 100));
        const newHeight = Math.round(image.original.height * (transform.scale / 100));
        
        // Only resize if dimensions have changed
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply shear before rotation
        if (transform.shearX !== 0 || transform.shearY !== 0) {
          ctx.transform(
            1, transform.shearY / 50, // Divide by 50 to make the slider more manageable
            transform.shearX / 50, 1, // Divide by 50 to make the slider more manageable
            0, 0
          );
        }
        
        // Apply stretch (non-uniform scaling)
        const stretchX = transform.stretchX / 100;
        const stretchY = transform.stretchY / 100;
        ctx.scale(
          stretchX * (transform.flipX ? -1 : 1),
          stretchY * (transform.flipY ? -1 : 1)
        );
        
        // Apply rotation
        ctx.rotate((transform.rotate * Math.PI) / 180);
        
        // Apply uniform scaling
        ctx.drawImage(
          image.original,
          -image.original.width / 2,
          -image.original.height / 2,
          image.original.width,
          image.original.height
        );
        ctx.restore();
        
        // Get image data for processing
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Apply matrix filters
        const matrix = ImageProcessor.createMatrix(adjustments);
        imageData = ImageProcessor.applyMatrix(imageData, matrix);
        
        // Apply blur if needed
        if (filters.blur > 0) {
          imageData = ImageProcessor.applyBlur(imageData, filters.blur);
        }
        
        // Put processed image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Draw grid if needed
        if (ui.showGrid) {
          const width = canvas.width;
          const height = canvas.height;
          const gridSize = 20;
          
          // Draw grid lines
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.lineWidth = 1;
          
          // Vertical lines
          for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          
          // Horizontal lines
          for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
          
          // Center lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();
        }
        
        updateUi({ isProcessing: false });
        isProcessingRef.current = false;
      }, 10); // Small delay to improve performance
    } catch (error) {
      console.error("Error processing image:", error);
      updateUi({ isProcessing: false });
      isProcessingRef.current = false;
    }
  }, [image.original, adjustments, ui.showGrid, updateUi]);

  // Optimized render loop
  const renderLoop = useCallback(() => {
    if (!isProcessingRef.current) {
      processImage();
    }
    renderRequestRef.current = requestAnimationFrame(renderLoop);
  }, [processImage]);

  // Channel functions
  const toggleChannelLock = useCallback((channel) => {
    if (channel === 'all') {
      const newState = !adjustments.locks.all;
      updateAdjustments('locks', {
        r: newState,
        g: newState,
        b: newState,
        all: newState
      });
    } else {
      const newLocks = { ...adjustments.locks };
      newLocks[channel] = !newLocks[channel];

      // Update 'all' state
      newLocks.all = newLocks.r && newLocks.g && newLocks.b;

      updateAdjustments('locks', newLocks);
    }
  }, [adjustments.locks, updateAdjustments]);

  // Handle channel value change
  const handleChannelChange = useCallback((channel, property, value) => {
    // Update the channel property
    updateAdjustments(`channels.${channel}.${property}`, value);

    // If it's the main value and channels are locked, update all locked channels
    if (property === 'value' && adjustments.locks.all) {
      updateAdjustments('channels', {
        ...adjustments.channels,
        r: { ...adjustments.channels.r, value },
        g: { ...adjustments.channels.g, value },
        b: { ...adjustments.channels.b, value }
      });
    } else if (property === 'value') {
      // Update any individually locked channels
      Object.keys(adjustments.locks).forEach(ch => {
        if (ch !== 'all' && ch !== channel && adjustments.locks[ch]) {
          updateAdjustments(`channels.${ch}.value`, value);
        }
      });
    }
  }, [adjustments.channels, adjustments.locks, updateAdjustments]);

  // Handle filter changes
  const handleFilterChange = useCallback((filter, value) => {
    updateAdjustments(`filters.${filter}`, parseFloat(value));
  }, [updateAdjustments]);

  // Handle transform changes
  const handleTransformChange = useCallback((property, value) => {
    updateAdjustments(`transform.${property}`, value);
  }, [updateAdjustments]);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      loadImage(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }, [loadImage]);

  // Open save dialog
  const openSaveDialog = useCallback(() => {
    // Generate a default filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `image_${timestamp}`;

    updateUi({
      saveDialog: {
        open: true,
        filename,
        format: 'png'
      }
    });
  }, [updateUi]);

  // Save current image
  const saveImage = useCallback(() => {
    if (!canvasRef.current) return;

    const format = ui.saveDialog.format;
    let filename = ui.saveDialog.filename;

    // Ensure proper extension
    if (!filename.endsWith(`.${format}`)) {
      filename += `.${format}`;
    }

    // Download the image
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvasRef.current.toDataURL(`image/${format}`);
    link.click();

    // Update history
    addToHistory(`Saved as ${filename}`);

    // Close dialog
    updateUi({ saveDialog: { ...ui.saveDialog, open: false } });
  }, [ui.saveDialog, addToHistory, updateUi]);

  // Start render loop when component mounts, stop when unmounts
  useEffect(() => {
    // Initial processing
    if (image.original) {
      // Start the continuous render loop
      renderRequestRef.current = requestAnimationFrame(renderLoop);
    }
    
    // Clean up when component unmounts
    return () => {
      if (renderRequestRef.current) {
        cancelAnimationFrame(renderRequestRef.current);
      }
    };
  }, [renderLoop, image.original]);

  // Load default image on first render
  useEffect(() => {
    loadImage("/api/placeholder/500/300");
  }, [loadImage]);

  // Create a context for sharing functions with child components
  const manipulatorContext = {
    canvasRef,
    image,
    ui,
    adjustments,
    history,
    updateUi,
    updateAdjustments,
    debouncedUpdateAdjustments,
    addToHistory,
    toggleChannelLock,
    handleChannelChange,
    handleFilterChange,
    handleTransformChange,
    undo,
    redo,
    resetAll,
    openSaveDialog,
    saveImage,
  };

  // Main return
  return (
    <div className="flex flex-col bg-gray-100 rounded-lg p-4 max-w-6xl mx-auto shadow-md">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Image Manipulator</h2>
        <div className="space-x-2">
          <Button 
            onClick={() => fileInputRef.current.click()} 
            variant="primary"
          >
            Load Image
          </Button>
          <Button
            onClick={() => updateUi({ showGrid: !ui.showGrid })}
            variant={ui.showGrid ? "active" : "default"}
          >
            {ui.showGrid ? 'Hide Grid' : 'Show Grid'}
          </Button>
          <Button
            onClick={undo}
            disabled={history.index <= 0}
            variant="default"
          >
            Undo
          </Button>
          <Button
            onClick={redo}
            disabled={history.index >= history.states.length - 1}
            variant="default"
          >
            Redo
          </Button>
          <Button
            onClick={resetAll}
            variant="danger"
          >
            Reset All
          </Button>
          <Button
            onClick={openSaveDialog}
            variant="success"
          >
            Save
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Left side - Image and info */}
        <div className="w-3/5">
          <ImagePreview canvasRef={canvasRef} isProcessing={ui.isProcessing} />
          <InfoPanel image={image} adjustments={adjustments} />
        </div>

        {/* Right side - Controls */}
        <div className="w-2/5 flex flex-col">
          <ControlTabs 
            context={manipulatorContext}
          />
          <QuickActions 
            adjustments={adjustments}
            updateAdjustments={updateAdjustments}
            addToHistory={addToHistory}
          />
        </div>
      </div>

      {/* Save dialog */}
      {ui.saveDialog.open && (
        <SaveDialog 
          saveDialog={ui.saveDialog}
          updateUi={updateUi}
          saveImage={saveImage}
        />
      )}
    </div>
  );
};

export default ImageManipulator;