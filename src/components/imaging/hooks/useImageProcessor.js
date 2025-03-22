import { useState, useRef, useCallback } from 'react';

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
    // Transform - with new properties
    transform: {
      rotate: 0,
      scale: 100,
      flipX: false,
      flipY: false,
      shearX: 0,
      shearY: 0,
      stretchX: 100,
      stretchY: 100
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
      // Avoid adding identical states
      const lastState = prev.states[prev.index];
      if (lastState && 
          JSON.stringify(lastState.adjustments) === JSON.stringify(newEntry.adjustments) &&
          lastState.image === newEntry.image) {
        return prev;
      }
      
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
        flipY: false,
        shearX: 0,
        shearY: 0,
        stretchX: 100,
        stretchY: 100
      }
    });

    // Force a delay before adding to history to ensure state is updated
    setTimeout(() => {
      addToHistory("Reset All");
    }, 50);
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
        },
        // Reset all other adjustments too
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
          flipY: false,
          shearX: 0,
          shearY: 0,
          stretchX: 100,
          stretchY: 100
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

export default useImageProcessor;