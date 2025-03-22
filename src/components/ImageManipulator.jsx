import React, { useState, useRef, useEffect, useCallback } from 'react';

// Custom hook for managing image state with streamlined structure
const useImageProcessor = () => {
  // Core state
  const [image, setImage] = useState({
    source: "/api/placeholder/500/300",
    original: null,
    info: {
      width: 0,
      height: 0,
      avgColor: { r: 0, g: 0, b: 0 },
      histogram: { r: [], g: [], b: [] }
    }
  });

  // UI state
  const [ui, setUi] = useState({
    showGrid: false,
    isProcessing: false,
    activeTab: 'adjust',
    saveDialog: { open: false, filename: '', format: 'png' }
  });

  // Adjustments state - consolidated into a single object
  const [adjustments, setAdjustments] = useState({
    // RGB channels with min/max
    channels: {
      r: { value: 100, min: 0, max: 255 },
      g: { value: 100, min: 0, max: 255 },
      b: { value: 100, min: 0, max: 255 }
    },
    // Channel locks
    locks: { r: false, g: false, b: false, all: false },
    // Filters
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      grayscale: 0,
      invert: 0
    },
    // Transform
    transform: {
      rotate: 0,
      scale: 100,
      flipX: false,
      flipY: false
    }
  });

  // History management - simplified
  const [history, setHistory] = useState({
    states: [],
    labels: [],
    index: -1
  });

  // Generate image histogram and info
  const analyzeImage = useCallback((img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate averages and histogram
    let r = 0, g = 0, b = 0;
    const histR = Array(256).fill(0);
    const histG = Array(256).fill(0);
    const histB = Array(256).fill(0);

    // Sample pixels (every 10th for performance)
    for (let i = 0; i < data.length; i += 40) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];

      histR[data[i]]++;
      histG[data[i + 1]]++;
      histB[data[i + 2]]++;
    }

    const pixelCount = data.length / 4;
    const sampledPixels = pixelCount / 10;

    // Normalize histogram values
    const normalizeHist = hist => {
      const max = Math.max(...hist);
      return hist.map(v => max > 0 ? v / max * 100 : 0);
    };

    return {
      width: img.width,
      height: img.height,
      avgColor: {
        r: Math.round(r / sampledPixels),
        g: Math.round(g / sampledPixels),
        b: Math.round(b / sampledPixels)
      },
      histogram: {
        r: normalizeHist(histR),
        g: normalizeHist(histG),
        b: normalizeHist(histB)
      }
    };
  }, []);

  // Add state to history
  const addToHistory = useCallback((label = "Adjustment") => {
    // Create history entry with current state
    const newEntry = {
      image: image.source,
      adjustments: JSON.parse(JSON.stringify(adjustments))
    };

    // Update history by trimming if needed
    setHistory(prev => {
      const newStates = prev.index < prev.states.length - 1
        ? [...prev.states.slice(0, prev.index + 1), newEntry]
        : [...prev.states, newEntry];

      const newLabels = prev.index < prev.states.length - 1
        ? [...prev.labels.slice(0, prev.index + 1), label]
        : [...prev.labels, label];

      return {
        states: newStates,
        labels: newLabels,
        index: newStates.length - 1
      };
    });
  }, [image.source, adjustments]);

  // Navigate history
  const timeTravel = useCallback((index) => {
    if (index >= 0 && index < history.states.length) {
      const entry = history.states[index];
      setImage(prev => ({ ...prev, source: entry.image }));
      setAdjustments(entry.adjustments);
      setHistory(prev => ({ ...prev, index }));
    }
  }, [history.states]);

  // Convenience functions for history navigation
  const undo = useCallback(() => {
    timeTravel(history.index - 1);
  }, [timeTravel, history.index]);

  const redo = useCallback(() => {
    timeTravel(history.index + 1);
  }, [timeTravel, history.index]);

  // Reset all adjustments
  const resetAll = useCallback(() => {
    setAdjustments({
      channels: {
        r: { value: 100, min: 0, max: 255 },
        g: { value: 100, min: 0, max: 255 },
        b: { value: 100, min: 0, max: 255 }
      },
      locks: { r: false, g: false, b: false, all: false },
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        grayscale: 0,
        invert: 0
      },
      transform: {
        rotate: 0,
        scale: 100,
        flipX: false,
        flipY: false
      }
    });

    addToHistory("Reset All");
  }, [addToHistory]);

  // Load an image from file or URL
  const loadImage = useCallback((src, filename = null) => {
    setUi(prev => ({ ...prev, isProcessing: true }));

    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      // Update image state with new image and analysis
      setImage({
        source: src,
        original: img,
        info: analyzeImage(img)
      });

      // Reset channels to defaults
      setAdjustments(prev => ({
        ...prev,
        channels: {
          r: { value: 100, min: 0, max: 255 },
          g: { value: 100, min: 0, max: 255 },
          b: { value: 100, min: 0, max: 255 }
        }
      }));

      // Add to history
      addToHistory(filename ? `Loaded ${filename}` : "Loaded Image");

      // Update UI state
      setUi(prev => ({ ...prev, isProcessing: false }));
    };

    img.onerror = () => {
      setUi(prev => ({ ...prev, isProcessing: false }));
      console.error("Error loading image");
    };

    img.src = src;
  }, [analyzeImage, addToHistory]);

  return {
    // All state
    image, setImage,
    ui, setUi,
    adjustments, setAdjustments,
    history, setHistory,

    // Functions
    analyzeImage,
    addToHistory,
    timeTravel,
    undo, redo,
    resetAll,
    loadImage
  };
};

// Simplified image processing class
const ImageProcessor = {
  // Create a combined matrix from all adjustments
  createMatrix: (adjustments) => {
    const { channels, filters } = adjustments;

    // Create initial matrices
    const channelMatrix = [
      [channels.r.value / 100, 0, 0, 0, 0],
      [0, channels.g.value / 100, 0, 0, 0],
      [0, 0, channels.b.value / 100, 0, 0],
      [0, 0, 0, 1, 0]
    ];

    // Apply min/max ranges
    for (const ch of ['r', 'g', 'b']) {
      const idx = ch === 'r' ? 0 : ch === 'g' ? 1 : 2;
      const range = channels[ch].max - channels[ch].min;

      if (range > 0) {
        const scale = 255 / range;
        channelMatrix[idx][idx] *= scale;
        channelMatrix[idx][4] = -channels[ch].min * scale;
      }
    }

    // Create and combine other matrices
    let matrix = channelMatrix;

    // Brightness/contrast
    const b = filters.brightness / 100;
    const c = filters.contrast / 100 * 2;
    const offset = 128 * (1 - c);

    const bcMatrix = [
      [c * b, 0, 0, 0, offset * b],
      [0, c * b, 0, 0, offset * b],
      [0, 0, c * b, 0, offset * b],
      [0, 0, 0, 1, 0]
    ];

    matrix = ImageProcessor.multiplyMatrices(bcMatrix, matrix);

    // Saturation
    const s = filters.saturation / 100;
    const lumR = 0.3086, lumG = 0.6094, lumB = 0.0820;

    const satMatrix = [
      [(1 - s) * lumR + s, (1 - s) * lumR, (1 - s) * lumR, 0, 0],
      [(1 - s) * lumG, (1 - s) * lumG + s, (1 - s) * lumG, 0, 0],
      [(1 - s) * lumB, (1 - s) * lumB, (1 - s) * lumB + s, 0, 0],
      [0, 0, 0, 1, 0]
    ];

    matrix = ImageProcessor.multiplyMatrices(satMatrix, matrix);

    // Grayscale
    if (filters.grayscale > 0) {
      const g = filters.grayscale / 100;
      const gLumR = 0.2126, gLumG = 0.7152, gLumB = 0.0722;

      const grayMatrix = [
        [gLumR * g + (1 - g), gLumG * g, gLumB * g, 0, 0],
        [gLumR * g, gLumG * g + (1 - g), gLumB * g, 0, 0],
        [gLumR * g, gLumG * g, gLumB * g + (1 - g), 0, 0],
        [0, 0, 0, 1, 0]
      ];

      matrix = ImageProcessor.multiplyMatrices(grayMatrix, matrix);
    }

    // Invert
    if (filters.invert > 0) {
      const i = filters.invert / 100;

      const invertMatrix = [
        [1 - 2 * i, 0, 0, 0, 255 * i],
        [0, 1 - 2 * i, 0, 0, 255 * i],
        [0, 0, 1 - 2 * i, 0, 255 * i],
        [0, 0, 0, 1, 0]
      ];

      matrix = ImageProcessor.multiplyMatrices(invertMatrix, matrix);
    }

    // Hue rotation
    if (filters.hue !== 0) {
      const angle = (filters.hue * Math.PI) / 180;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const hLumR = 0.213, hLumG = 0.715, hLumB = 0.072;

      const hueMatrix = [
        [hLumR + cos * (1 - hLumR) + sin * (-hLumR), hLumG + cos * (-hLumG) + sin * (-hLumG), hLumB + cos * (-hLumB) + sin * (1 - hLumB), 0, 0],
        [hLumR + cos * (-hLumR) + sin * (0.143), hLumG + cos * (1 - hLumG) + sin * (0.140), hLumB + cos * (-hLumB) + sin * (-0.283), 0, 0],
        [hLumR + cos * (-hLumR) + sin * (-(1 - hLumR)), hLumG + cos * (-hLumG) + sin * (hLumG), hLumB + cos * (1 - hLumB) + sin * (hLumB), 0, 0],
        [0, 0, 0, 1, 0]
      ];

      matrix = ImageProcessor.multiplyMatrices(hueMatrix, matrix);
    }

    return matrix;
  },

  // Multiply two matrices
  multiplyMatrices: (m1, m2) => {
    const result = Array(4).fill().map(() => Array(5).fill(0));

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += m1[i][k] * m2[k][j];
        }
        // Handle the last column (constant term)
        if (j === 4) {
          sum += m1[i][4];
        }
        result[i][j] = sum;
      }
    }

    return result;
  },

  // Apply matrix to image data
  applyMatrix: (imageData, matrix) => {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Apply matrix to pixel
      data[i] = Math.max(0, Math.min(255, matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b + matrix[0][4]));
      data[i + 1] = Math.max(0, Math.min(255, matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b + matrix[1][4]));
      data[i + 2] = Math.max(0, Math.min(255, matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b + matrix[2][4]));
      // Alpha remains unchanged
    }

    return imageData;
  },

  // Apply blur
  applyBlur: (imageData, radius) => {
    if (radius <= 0) return imageData;

    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data);
    const sigma = radius / 2;
    const sigma2 = 2 * sigma * sigma;

    // Create kernel
    const kernelSize = Math.max(3, Math.ceil(radius * 2 + 1));
    const halfKernel = Math.floor(kernelSize / 2);
    const kernel = [];
    let kernelSum = 0;

    for (let y = -halfKernel; y <= halfKernel; y++) {
      for (let x = -halfKernel; x <= halfKernel; x++) {
        const weight = Math.exp(-(x * x + y * y) / sigma2) / (Math.PI * sigma2);
        kernel.push(weight);
        kernelSum += weight;
      }
    }

    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= kernelSum;
    }

    // Apply convolution
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let kernelIndex = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const pixelX = Math.min(width - 1, Math.max(0, x + kx));
            const pixelY = Math.min(height - 1, Math.max(0, y + ky));

            const pixelIndex = (pixelY * width + pixelX) * 4;
            const weight = kernel[kernelIndex++];

            r += data[pixelIndex] * weight;
            g += data[pixelIndex + 1] * weight;
            b += data[pixelIndex + 2] * weight;
            a += data[pixelIndex + 3] * weight;
          }
        }

        const outIndex = (y * width + x) * 4;
        output[outIndex] = r;
        output[outIndex + 1] = g;
        output[outIndex + 2] = b;
        output[outIndex + 3] = a;
      }
    }

    return new ImageData(output, width, height);
  }
};

// Main Component
const ImageManipulator = () => {
  // Use our custom hook
  const {
    image, setImage,
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
  const updateUi = (updates) => {
    setUi(prev => ({ ...prev, ...updates }));
  };

  // Helper to update adjustments
  const updateAdjustments = (path, value) => {
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
  };

  // Process the image - Simplified single function for all image processing
  const processImage = useCallback(() => {
    if (!canvasRef.current || !image.original || isProcessingRef.current) return;
    
    // Set processing flag
    isProcessingRef.current = true;
    
    try {
      updateUi({ isProcessing: true });
      
      const canvas = canvasRef.current;
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
      ctx.rotate((transform.rotate * Math.PI) / 180);
      ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
      ctx.drawImage(
        image.original, 
        -canvas.width / 2, 
        -canvas.height / 2, 
        canvas.width, 
        canvas.height
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
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      updateUi({ isProcessing: false });
      isProcessingRef.current = false;
    }
  }, [image.original, adjustments, ui.showGrid]);

  // Implement continuous render loop to keep canvas visible
  const renderLoop = useCallback(() => {
    processImage();
    renderRequestRef.current = requestAnimationFrame(renderLoop);
  }, [processImage]);

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

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      loadImage(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Toggle channel lock
  const toggleChannelLock = (channel) => {
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
  };

  // Handle channel value change
  const handleChannelChange = (channel, property, value) => {
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
  };

  // Handle filter changes
  const handleFilterChange = (filter, value) => {
    updateAdjustments(`filters.${filter}`, parseFloat(value));
  };

  // Handle transform changes
  const handleTransformChange = (property, value) => {
    updateAdjustments(`transform.${property}`, value);
  };

  // Save current image
  const saveImage = () => {
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
  };

  // Open save dialog
  const openSaveDialog = () => {
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
  };

  // Load default image
  useEffect(() => {
    loadImage("/api/placeholder/500/300");
  }, [loadImage]);

  // We can remove the resize handler since we have a continuous render loop now
  // The continuous loop will automatically handle resizing

  // Image display component
  const ImagePreview = () => (
    <div className="flex-1 mb-4">
      <div className="bg-white p-2 rounded shadow-inner flex items-center justify-center h-80 relative">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Processing indicator below image */}
      <div className="h-6 flex justify-center items-center">
        {ui.isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Processing image...</span>
          </div>
        )}
      </div>
    </div>
  );

  // Info panel with histogram
  const InfoPanel = () => (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {/* Basic info */}
      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold mb-2">Image Information</h3>
        <div>
          <p className="text-sm">Dimensions: {image.info.width} × {image.info.height}px</p>
          <p className="text-sm">Scale: {adjustments.transform.scale}%</p>
          <p className="text-sm">Effective Size: {Math.round(image.info.width * adjustments.transform.scale / 100)} × {Math.round(image.info.height * adjustments.transform.scale / 100)}px</p>

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

  // Control tabs component
  const ControlTabs = () => {
    const Tab = ({ id, label }) => (
      <button
        onClick={() => updateUi({ activeTab: id })}
        className={`flex-1 py-2 text-center ${ui.activeTab === id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
      >
        {label}
      </button>
    );

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          <Tab id="adjust" label="Colors & Adjustments" />
          <Tab id="transform" label="Transform" />
          <Tab id="history" label="History" />
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto">
          {ui.activeTab === 'adjust' && (
            <AdjustmentPanel />
          )}

          {ui.activeTab === 'transform' && (
            <TransformPanel />
          )}

          {ui.activeTab === 'history' && (
            <HistoryPanel />
          )}
        </div>
      </div>
    );
  };

  // RGB Channel controls
  const AdjustmentPanel = () => {
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
        <button
          onClick={() => toggleChannelLock('all')}
          className={`px-3 py-1 rounded text-sm w-full ${
            adjustments.locks.all ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {adjustments.locks.all ? 'Unlock All Channels' : 'Lock All Channels'}
        </button>
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
            <div className="mb-3" key={filter.name}>
              <div className="flex justify-between">
                <label className="text-sm flex items-center">
                  {filter.label}
                  {adjustments.filters[filter.name] !== filter.defaultValue && (
                    <button
                      onClick={() => {
                        handleFilterChange(filter.name, filter.defaultValue);
                        addToHistory(`Reset ${filter.label}`);
                      }}
                      className="ml-1 text-xs text-gray-500 hover:text-gray-700"
                      title={`Reset to ${filter.defaultValue}${filter.unit}`}
                    >
                      ↺
                    </button>
                  )}
                </label>
                <span className="text-sm">{adjustments.filters[filter.name]}{filter.unit}</span>
              </div>
              <input
                type="range"
                min={filter.min}
                max={filter.max}
                step={filter.step || 1}
                value={adjustments.filters[filter.name]}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                onMouseUp={() => addToHistory(`Adjust ${filter.label}`)}
                className="w-full"
              />
            </div>
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
  };

  // Transform controls
  const TransformPanel = () => {
    const { rotate, scale, flipX, flipY } = adjustments.transform;

    return (
      <div>
        <h3 className="font-semibold mb-2 flex justify-between items-center">
          <span>Transform</span>
          <button
            onClick={() => {
              updateAdjustments('transform', {
                rotate: 0,
                scale: 100,
                flipX: false,
                flipY: false
              });
              addToHistory("Reset Transform");
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center"
            title="Reset transform"
          >
            <span className="mr-1">↺</span> Reset
          </button>
        </h3>

        {/* Scale */}
        <div className="mb-3">
          <div className="flex justify-between">
            <label className="text-sm">Scale</label>
            <span className="text-sm">{scale}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            value={scale}
            onChange={(e) => handleTransformChange('scale', parseInt(e.target.value))}
            onMouseUp={() => addToHistory("Adjust Scale")}
            className="w-full"
          />
        </div>

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

        {/* Flip buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              handleTransformChange('flipX', !flipX);
              addToHistory(flipX ? "Unflip X" : "Flip X");
            }}
            className={`flex-1 py-2 rounded ${flipX ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Flip X
          </button>
          <button
            onClick={() => {
              handleTransformChange('flipY', !flipY);
              addToHistory(flipY ? "Unflip Y" : "Flip Y");
            }}
            className={`flex-1 py-2 rounded ${flipY ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Flip Y
          </button>
        </div>
      </div>
    );
  };

  // History panel
  const HistoryPanel = () => (
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

  // Quick actions panel
  const QuickActions = () => {
    const actions = [
      {
        name: "Grayscale",
        action: () => {
          updateAdjustments('filters.grayscale', 100);
          addToHistory("Convert to Grayscale");
        }
      },
      {
        name: "Invert",
        action: () => {
          updateAdjustments('filters.invert', 100);
          addToHistory("Invert Colors");
        }
      },
      {
        name: "Auto Enhance",
        action: () => {
          const newFilters = {
            ...adjustments.filters,
            brightness: 120,
            contrast: 120
          };
          updateAdjustments('filters', newFilters);
          addToHistory("Auto Enhance");
        }
      },
      {
        name: "Vibrance",
        action: () => {
          updateAdjustments('filters.saturation', 150);
          addToHistory("Increase Vibrance");
        }
      }
    ];

    return (
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h3 className="font-semibold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(action => (
            <button
              key={action.name}
              onClick={action.action}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              {action.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Save dialog
  const SaveDialog = () => {
    if (!ui.saveDialog.open) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full">
          <h3 className="text-lg font-bold mb-4">Save Image</h3>

          <div className="mb-4">
            <label htmlFor="filename" className="block text-sm font-medium mb-1">Filename:</label>
            <input
              type="text"
              id="filename"
              value={ui.saveDialog.filename}
              onChange={(e) => updateUi({ saveDialog: { ...ui.saveDialog, filename: e.target.value } })}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="format" className="block text-sm font-medium mb-1">Format:</label>
            <select
              id="format"
              value={ui.saveDialog.format}
              onChange={(e) => updateUi({ saveDialog: { ...ui.saveDialog, format: e.target.value } })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="png">PNG (lossless)</option>
              <option value="jpeg">JPEG (smaller size)</option>
              <option value="webp">WebP (best quality/size ratio)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {ui.saveDialog.format === 'png' && 'PNG provides the best quality but largest file size'}
              {ui.saveDialog.format === 'jpeg' && 'JPEG is suitable for photographs with smaller file size'}
              {ui.saveDialog.format === 'webp' && 'WebP provides good quality with smaller file size but may not be supported by all software'}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => updateUi({ saveDialog: { ...ui.saveDialog, open: false } })}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              onClick={saveImage}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main return
  return (
    <div className="flex flex-col bg-gray-100 rounded-lg p-4 max-w-6xl mx-auto shadow-md">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Image Manipulator</h2>
        <div className="space-x-2">
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Load Image
          </button>
          <button
            onClick={() => updateUi({ showGrid: !ui.showGrid })}
            className={`px-4 py-2 rounded ${ui.showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {ui.showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button
            onClick={undo}
            disabled={history.index <= 0}
            className={`px-4 py-2 rounded ${history.index <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800 text-white'}`}
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={history.index >= history.states.length - 1}
            className={`px-4 py-2 rounded ${history.index >= history.states.length - 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800 text-white'}`}
          >
            Redo
          </button>
          <button
            onClick={resetAll}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Reset All
          </button>
          <button
            onClick={openSaveDialog}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
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
          <ImagePreview />
          <InfoPanel />
        </div>

        {/* Right side - Controls */}
        <div className="w-2/5 flex flex-col">
          <ControlTabs />
          <QuickActions />
        </div>
      </div>

      {/* Save dialog */}
      <SaveDialog />
    </div>
  );
};

export default ImageManipulator;