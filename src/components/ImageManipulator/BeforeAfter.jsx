// ImageManipulatorComplete.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * All-in-one Image Manipulation Component
 * Combines image uploading, processing, and comparison in a single component
 */
const ImageManipulator = () => {
  //================ STATE MANAGEMENT ================
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('adjustments');
  
  //================ REFS ================
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const workerRef = useRef(null);
  
  //================ CONSTANTS & DEFAULTS ================
  const DEFAULT_SETTINGS = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    grayscale: 0,
    invert: 0,
    sepia: 0,
    matrix: [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0
    ],
    transformations: {
      rotate: 0,
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0
    }
  };
  
  //================ UTILITY FUNCTIONS ================
  
  // Debounce function to limit how often a function is called
  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      const context = this;
      const later = () => {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Format bytes to human-readable size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  //================ WEB WORKER INITIALIZATION ================
  
  // Create and initialize the image processing worker
  useEffect(() => {
    // Create a string containing the worker code
    const workerCode = `
      self.onmessage = function(e) {
        const { type, imageData, settings } = e.data;
        
        if (type === 'process') {
          const result = processImage(imageData, settings);
          self.postMessage({ type: 'processed', imageData: result });
        } else if (type === 'blur') {
          const result = applyGaussianBlur(imageData, settings.blur);
          self.postMessage({ type: 'processed', imageData: result });
        }
      };
      
      // Process image with color transformations
      function processImage(imageData, settings) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data.length);
        
        // Create matrix from settings
        const matrix = createColorMatrix(settings);
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Apply the matrix transformation
          let newR = matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3] * a + matrix[4];
          let newG = matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[8] * a + matrix[9];
          let newB = matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[13] * a + matrix[14];
          let newA = matrix[15] * r + matrix[16] * g + matrix[17] * b + matrix[18] * a + matrix[19];
          
          // Apply additional effects not covered by the matrix
          
          // Grayscale
          if (settings.grayscale > 0) {
            const gray = 0.2126 * newR + 0.7152 * newG + 0.0722 * newB;
            const blend = settings.grayscale / 100;
            
            newR = newR * (1 - blend) + gray * blend;
            newG = newG * (1 - blend) + gray * blend;
            newB = newB * (1 - blend) + gray * blend;
          }
          
          // Invert
          if (settings.invert > 0) {
            const blend = settings.invert / 100;
            
            newR = newR * (1 - blend) + (255 - newR) * blend;
            newG = newG * (1 - blend) + (255 - newG) * blend;
            newB = newB * (1 - blend) + (255 - newB) * blend;
          }
          
          // Sepia
          if (settings.sepia > 0) {
            const blend = settings.sepia / 100;
            
            const sepiaR = (newR * 0.393) + (newG * 0.769) + (newB * 0.189);
            const sepiaG = (newR * 0.349) + (newG * 0.686) + (newB * 0.168);
            const sepiaB = (newR * 0.272) + (newG * 0.534) + (newB * 0.131);
            
            newR = newR * (1 - blend) + sepiaR * blend;
            newG = newG * (1 - blend) + sepiaG * blend;
            newB = newB * (1 - blend) + sepiaB * blend;
          }
          
          // Ensure values are within bounds
          result[i] = Math.max(0, Math.min(255, newR));
          result[i + 1] = Math.max(0, Math.min(255, newG));
          result[i + 2] = Math.max(0, Math.min(255, newB));
          result[i + 3] = Math.max(0, Math.min(255, newA));
        }
        
        return new ImageData(result, width, height);
      }
      
      // Create a color transformation matrix from settings
      function createColorMatrix(settings) {
        // If a custom matrix is provided, use it
        if (settings.matrix && settings.matrix.length === 20) {
          return settings.matrix;
        }
        
        // Default identity matrix
        let matrix = [
          1, 0, 0, 0, 0,  // Red channel
          0, 1, 0, 0, 0,  // Green channel
          0, 0, 1, 0, 0,  // Blue channel
          0, 0, 0, 1, 0   // Alpha channel
        ];
        
        // Apply brightness
        if (settings.brightness !== 100) {
          const b = settings.brightness / 100;
          const brightnessMatrix = [
            b, 0, 0, 0, 0,
            0, b, 0, 0, 0,
            0, 0, b, 0, 0,
            0, 0, 0, 1, 0
          ];
          
          matrix = multiplyMatrices(brightnessMatrix, matrix);
        }
        
        // Apply contrast
        if (settings.contrast !== 100) {
          const c = settings.contrast / 100;
          const t = 0.5 * (1 - c);
          
          const contrastMatrix = [
            c, 0, 0, 0, t * 255,
            0, c, 0, 0, t * 255,
            0, 0, c, 0, t * 255,
            0, 0, 0, 1, 0
          ];
          
          matrix = multiplyMatrices(contrastMatrix, matrix);
        }
        
        // Apply saturation
        if (settings.saturation !== 100) {
          const s = settings.saturation / 100;
          
          // Luminance coefficients
          const lr = 0.2126;
          const lg = 0.7152;
          const lb = 0.0722;
          
          // Calculate saturation matrix
          const sr = (1 - s) * lr;
          const sg = (1 - s) * lg;
          const sb = (1 - s) * lb;
          
          const saturationMatrix = [
            sr + s, sg, sb, 0, 0,
            sr, sg + s, sb, 0, 0,
            sr, sg, sb + s, 0, 0,
            0, 0, 0, 1, 0
          ];
          
          matrix = multiplyMatrices(saturationMatrix, matrix);
        }
        
        // Apply hue rotation
        if (settings.hue !== 0) {
          const h = settings.hue * Math.PI / 180;
          const cos = Math.cos(h);
          const sin = Math.sin(h);
          
          // Luminance-preserving hue rotation
          const lr = 0.2126;
          const lg = 0.7152;
          const lb = 0.0722;
          
          const hueMatrix = [
            lr + cos * (1 - lr) + sin * (-lr), lg + cos * (-lg) + sin * (-lg), lb + cos * (-lb) + sin * (1 - lb), 0, 0,
            lr + cos * (-lr) + sin * (0.143), lg + cos * (1 - lg) + sin * (0.140), lb + cos * (-lb) + sin * (-0.283), 0, 0,
            lr + cos * (-lr) + sin * (-(1 - lr)), lg + cos * (-lg) + sin * (lg), lb + cos * (1 - lb) + sin * (lb), 0, 0,
            0, 0, 0, 1, 0
          ];
          
          matrix = multiplyMatrices(hueMatrix, matrix);
        }
        
        return matrix;
      }
      
      // Multiply two 4x5 matrices
      function multiplyMatrices(m1, m2) {
        const result = new Array(20).fill(0);
        
        // For each row of the first matrix
        for (let i = 0; i < 4; i++) {
          // For each column of the second matrix
          for (let j = 0; j < 5; j++) {
            if (j === 4) {
              // Translation column
              result[i * 5 + j] = m1[i * 5 + j];
              
              // Add contribution from multiplication
              for (let k = 0; k < 4; k++) {
                result[i * 5 + j] += m1[i * 5 + k] * m2[k * 5 + j];
              }
            } else {
              // Normal matrix multiplication for the 4x4 part
              for (let k = 0; k < 4; k++) {
                result[i * 5 + j] += m1[i * 5 + k] * m2[k * 5 + j];
              }
            }
          }
        }
        
        return result;
      }
      
      // Apply Gaussian blur
      function applyGaussianBlur(imageData, radius) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Create a copy of the image data
        const result = new Uint8ClampedArray(data.length);
        
        // Calculate kernel size
        const size = Math.ceil(radius * 3);
        const sigma = radius / 2;
        
        // Create Gaussian kernel
        const kernel = createGaussianKernel(size, sigma);
        
        // Apply horizontal blur
        const temp = new Uint8ClampedArray(data.length);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
            
            for (let i = -size; i <= size; i++) {
              const kx = Math.min(Math.max(0, x + i), width - 1);
              const weight = kernel[i + size];
              const idx = (y * width + kx) * 4;
              
              r += data[idx] * weight;
              g += data[idx + 1] * weight;
              b += data[idx + 2] * weight;
              a += data[idx + 3] * weight;
              weightSum += weight;
            }
            
            const idx = (y * width + x) * 4;
            temp[idx] = r / weightSum;
            temp[idx + 1] = g / weightSum;
            temp[idx + 2] = b / weightSum;
            temp[idx + 3] = a / weightSum;
          }
        }
        
        // Apply vertical blur
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
            
            for (let j = -size; j <= size; j++) {
              const ky = Math.min(Math.max(0, y + j), height - 1);
              const weight = kernel[j + size];
              const idx = (ky * width + x) * 4;
              
              r += temp[idx] * weight;
              g += temp[idx + 1] * weight;
              b += temp[idx + 2] * weight;
              a += temp[idx + 3] * weight;
              weightSum += weight;
            }
            
            const idx = (y * width + x) * 4;
            result[idx] = r / weightSum;
            result[idx + 1] = g / weightSum;
            result[idx + 2] = b / weightSum;
            result[idx + 3] = a / weightSum;
          }
        }
        
        return new ImageData(result, width, height);
      }
      
      // Create a Gaussian kernel for blur
      function createGaussianKernel(size, sigma) {
        const kernel = new Array(size * 2 + 1).fill(0);
        let sum = 0;
        
        for (let i = -size; i <= size; i++) {
          const value = Math.exp(-(i * i) / (2 * sigma * sigma));
          kernel[i + size] = value;
          sum += value;
        }
        
        // Normalize the kernel
        for (let i = 0; i < kernel.length; i++) {
          kernel[i] /= sum;
        }
        
        return kernel;
      }
      
      // Get matrix for predefined effects
      function getEffectMatrix(effect) {
        switch (effect.toLowerCase()) {
          case 'normal':
            return [
              1, 0, 0, 0, 0,
              0, 1, 0, 0, 0,
              0, 0, 1, 0, 0,
              0, 0, 0, 1, 0
            ];
          
          case 'grayscale':
            return [
              0.2126, 0.7152, 0.0722, 0, 0,
              0.2126, 0.7152, 0.0722, 0, 0,
              0.2126, 0.7152, 0.0722, 0, 0,
              0, 0, 0, 1, 0
            ];
          
          case 'sepia':
            return [
              0.393, 0.769, 0.189, 0, 0,
              0.349, 0.686, 0.168, 0, 0,
              0.272, 0.534, 0.131, 0, 0,
              0, 0, 0, 1, 0
            ];
          
          case 'invert':
            return [
              -1, 0, 0, 0, 255,
              0, -1, 0, 0, 255,
              0, 0, -1, 0, 255,
              0, 0, 0, 1, 0
            ];
          
          case 'cool':
            return [
              1, 0, 0, 0, 0,
              0, 1, 0, 0, 0,
              0, 0, 1.2, 0, 0,
              0, 0, 0, 1, 0
            ];
          
          case 'warm':
            return [
              1.2, 0, 0, 0, 0,
              0, 1.1, 0, 0, 0,
              0, 0, 0.9, 0, 0,
              0, 0, 0, 1, 0
            ];
          
          case 'vintage':
            return [
              0.6, 0.3, 0.1, 0, 10,
              0.2, 0.7, 0.1, 0, 10,
              0.1, 0.2, 0.5, 0, 20,
              0, 0, 0, 1, 0
            ];
          
          default:
            return [
              1, 0, 0, 0, 0,
              0, 1, 0, 0, 0,
              0, 0, 1, 0, 0,
              0, 0, 0, 1, 0
            ];
        }
      }
    `;
    
    // Create a blob from the worker code
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerURL = URL.createObjectURL(blob);
    const worker = new Worker(workerURL);

    // Set up worker message handler
    worker.onmessage = (e) => {
      const { type, imageData } = e.data;
      
      if (type === 'processed') {
        // Draw the processed image data to the canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        // Create an image from the processed canvas
        const dataURL = canvas.toDataURL('image/png');
        const img = new Image();
        img.src = dataURL;
        img.onload = () => {
          setProcessedImage(img);
          setLoading(false);
        };
      }
    };
    
    // Save the worker to the ref
    workerRef.current = worker;
    
    // Handle window resize for responsive layout
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up function
    return () => {
      worker.terminate();
      URL.revokeObjectURL(workerURL);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  //================ IMAGE PROCESSING ================
  
  // Process image with current settings
  const processImage = useCallback(async (image, imageSettings) => {
    if (!image || !canvasRef.current || !workerRef.current) return;
    
    setLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Resize canvas to match image dimensions
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Apply geometric transformations
      applyGeometricTransformations(ctx, image, imageSettings.transformations);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Send image data to worker for processing
      workerRef.current.postMessage({
        type: 'process',
        imageData,
        settings: imageSettings
      });
      
    } catch (error) {
      console.error('Error processing image:', error);
      setLoading(false);
    }
  }, []);
  
  // Apply geometric transformations (rotate, scale, translate)
  const applyGeometricTransformations = (ctx, image, transformations) => {
    const { rotate, scaleX, scaleY, translateX, translateY } = transformations;
    
    // Get canvas dimensions
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Save context state
    ctx.save();
    
    // Move to center for rotation
    ctx.translate(width / 2, height / 2);
    
    // Apply rotation (convert to radians)
    if (rotate !== 0) {
      ctx.rotate(rotate * Math.PI / 180);
    }
    
    // Apply scaling
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }
    
    // Apply translation (convert from percentage to pixels)
    const tx = (translateX / 100) * width;
    const ty = (translateY / 100) * height;
    ctx.translate(tx, ty);
    
    // Draw the image centered
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    
    // Restore context state
    ctx.restore();
  };
  
  // Get effect matrix for preset filters
  const getEffectMatrix = (effect) => {
    switch (effect.toLowerCase()) {
      case 'normal':
        return [
          1, 0, 0, 0, 0,
          0, 1, 0, 0, 0,
          0, 0, 1, 0, 0,
          0, 0, 0, 1, 0
        ];
      
      case 'grayscale':
        return [
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0, 0, 0, 1, 0
        ];
      
      case 'sepia':
        return [
          0.393, 0.769, 0.189, 0, 0,
          0.349, 0.686, 0.168, 0, 0,
          0.272, 0.534, 0.131, 0, 0,
          0, 0, 0, 1, 0
        ];
      
      case 'invert':
        return [
          -1, 0, 0, 0, 255,
          0, -1, 0, 0, 255,
          0, 0, -1, 0, 255,
          0, 0, 0, 1, 0
        ];
      
      case 'cool':
        return [
          1, 0, 0, 0, 0,
          0, 1, 0, 0, 0,
          0, 0, 1.2, 0, 0,
          0, 0, 0, 1, 0
        ];
      
      case 'warm':
        return [
          1.2, 0, 0, 0, 0,
          0, 1.1, 0, 0, 0,
          0, 0, 0.9, 0, 0,
          0, 0, 0, 1, 0
        ];
      
      case 'vintage':
        return [
          0.6, 0.3, 0.1, 0, 10,
          0.2, 0.7, 0.1, 0, 10,
          0.1, 0.2, 0.5, 0, 20,
          0, 0, 0, 1, 0
        ];
      
      default:
        return [
          1, 0, 0, 0, 0,
          0, 1, 0, 0, 0,
          0, 0, 1, 0, 0,
          0, 0, 0, 1, 0
        ];
    }
  };
  
  //================ EVENT HANDLERS ================
  
  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;
    
    setLoading(true);
    
    try {
      const img = await createImageFromFile(file);
      setOriginalImage(img);
      
      // Reset settings and history
      setSettings(DEFAULT_SETTINGS);
      setHistory([DEFAULT_SETTINGS]);
      setHistoryIndex(0);
      
      // Initialize original canvas
      const originalCanvas = originalCanvasRef.current;
      const ctx = originalCanvas.getContext('2d');
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Process with default settings
      await processImage(img, DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error uploading image:', error);
      setLoading(false);
    }
  }, [processImage]);
  
  // Create image from file
  const createImageFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  // Debounced setting update to prevent excessive processing
  const updateSettings = useCallback(debounce((newSettings) => {
    setSettings(newSettings);
    
    // Add to history (removing any future states if we're not at the end)
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newSettings];
    });
    
    setHistoryIndex(prev => prev + 1);
    
    // Process image with new settings
    processImage(originalImage, newSettings);
  }, 200), [historyIndex, originalImage, processImage]);
  
  // Handle individual setting change
  const handleSettingChange = useCallback((key, value) => {
    const newSettings = { ...settings };
    
    if (key.includes('.')) {
      // Handle nested properties, e.g., 'transformations.rotate'
      const [parentKey, childKey] = key.split('.');
      newSettings[parentKey] = {
        ...newSettings[parentKey],
        [childKey]: value
      };
    } else {
      newSettings[key] = value;
    }
    
    updateSettings(newSettings);
  }, [settings, updateSettings]);
  
  // Apply matrix transformation
  const applyMatrix = useCallback((matrix) => {
    const newSettings = {
      ...settings,
      matrix: matrix
    };
    
    updateSettings(newSettings);
  }, [settings, updateSettings]);
  
  // Apply a preset effect
  const applyEffect = useCallback((effectName) => {
    const matrix = getEffectMatrix(effectName);
    applyMatrix(matrix);
  }, [applyMatrix]);
  
  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    const previousSettings = history[newIndex];
    setSettings(previousSettings);
    processImage(originalImage, previousSettings);
  }, [history, historyIndex, originalImage, processImage]);
  
  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    const nextSettings = history[newIndex];
    setSettings(nextSettings);
    processImage(originalImage, nextSettings);
  }, [history, historyIndex, originalImage, processImage]);
  
  // Reset to original image
  const handleReset = useCallback(() => {
    updateSettings(DEFAULT_SETTINGS);
  }, [updateSettings]);
  
  // Download processed image
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, []);
  
  // Toggle compare mode
  const handleToggleCompare = useCallback(() => {
    setCompareMode(prev => !prev);
  }, []);
  
  // Toggle panel visibility (for mobile)
  const handleTogglePanel = useCallback(() => {
    setShowPanel(prev => !prev);
  }, []);
  
  //================ UI COMPONENTS ================
  
  // Slider component
  const Slider = ({ label, value, min, max, step = 1, onChange, defaultValue = 0 }) => {
    const [isFocused, setIsFocused] = useState(false);
    const isDefaultValue = value === defaultValue;
    
    const handleReset = () => {
      onChange(defaultValue);
    };
    
    return (
      <div className="slider-component mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium">
            {label}
          </label>
          <div className="flex items-center">
            <span className="text-sm mr-2">{value}</span>
            {!isDefaultValue && (
              <button
                className="text-xs text-gray-500 hover:text-gray-800"
                onClick={handleReset}
                aria-label={`Reset ${label} to default`}
              >
                ↺
              </button>
            )}
          </div>
        </div>
        <div className={`relative h-2 bg-gray-200 rounded-full ${isFocused ? 'ring-2 ring-blue-400' : ''}`}>
          <div 
            className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          ></div>
        </div>
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          className="absolute top-0 w-full opacity-0 cursor-pointer h-2"
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label={`${label} slider`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
    );
  };
  
  // Image uploader component
  const ImageUploader = () => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    
    // Handle file selection
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      processFile(file);
    };
    
    // Process uploaded file
    const processFile = (file) => {
      // Reset error
      setError('');
      
      // Validate file
      if (!file) return;
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }
      
      // Pass the file to the parent component
      handleImageUpload(file);
    };
    
    // Handle drag events
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const file = e.dataTransfer.files[0];
      processFile(file);
    };
    
    // Handle button click to open file dialog
    const handleButtonClick = () => {
      fileInputRef.current.click();
    };
    
    return (
      <div className="image-uploader">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          aria-label="Upload image"
        />
        
        {/* Drag and drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <svg
              className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600">
              Drag and drop an image here, or
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleButtonClick}
            >
              Select Image
            </button>
            <p className="text-xs text-gray-500">
              Supported formats: JPEG, PNG, GIF, WEBP
            </p>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <p className="text-red-500 mt-2 text-sm">{error}</p>
        )}
      </div>
    );
  };

  // Effects panel component
  const EffectsPanel = () => {
    // Pre-defined effects
    const presetEffects = [
      { name: 'Normal', matrix: 'normal' },
      { name: 'Grayscale', matrix: 'grayscale' },
      { name: 'Sepia', matrix: 'sepia' },
      { name: 'Invert', matrix: 'invert' },
      { name: 'Cool', matrix: 'cool' },
      { name: 'Warm', matrix: 'warm' },
      { name: 'Vintage', matrix: 'vintage' }
    ];
    
    return (
      <div className="effects-panel">
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`flex-1 py-2 px-4 text-center ${activeTab === 'adjustments' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('adjustments')}
          >
            Adjustments
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${activeTab === 'presets' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Presets
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${activeTab === 'transform' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('transform')}
          >
            Transform
          </button>
        </div>
        
        {/* History controls */}
        <div className="flex justify-between mb-4">
          <button
            className={`p-2 rounded ${historyIndex > 0 ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400'}`}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            aria-label="Undo"
          >
            Undo
          </button>
          <button
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={handleReset}
            aria-label="Reset"
          >
            Reset
          </button>
          <button
            className={`p-2 rounded ${historyIndex < history.length - 1 ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400'}`}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            aria-label="Redo"
          >
            Redo
          </button>
        </div>
        
        {/* Adjustments Tab */}
        {activeTab === 'adjustments' && (
          <div className="space-y-4">
            <Slider
              label="Brightness"
              value={settings.brightness}
              min={0}
              max={200}
              defaultValue={100}
              onChange={(value) => handleSettingChange('brightness', value)}
            />
            
            <Slider
              label="Contrast"
              value={settings.contrast}
              min={0}
              max={200}
              defaultValue={100}
              onChange={(value) => handleSettingChange('contrast', value)}
            />
            
            <Slider
              label="Saturation"
              value={settings.saturation}
              min={0}
              max={200}
              defaultValue={100}
              onChange={(value) => handleSettingChange('saturation', value)}
            />
            
            <Slider
              label="Hue"
              value={settings.hue}
              min={0}
              max={360}
              defaultValue={0}
              onChange={(value) => handleSettingChange('hue', value)}
            />
            
            <Slider
              label="Blur"
              value={settings.blur}
              min={0}
              max={20}
              defaultValue={0}
              onChange={(value) => handleSettingChange('blur', value)}
            />
            
            <Slider
              label="Grayscale"
              value={settings.grayscale}
              min={0}
              max={100}
              defaultValue={0}
              onChange={(value) => handleSettingChange('grayscale', value)}
            />
            
            <Slider
              label="Invert"
              value={settings.invert}
              min={0}
              max={100}
              defaultValue={0}
              onChange={(value) => handleSettingChange('invert', value)}
            />
            
            <Slider
              label="Sepia"
              value={settings.sepia}
              min={0}
              max={100}
              defaultValue={0}
              onChange={(value) => handleSettingChange('sepia', value)}
            />
          </div>
        )}
        
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-2 gap-2">
            {presetEffects.map((effect) => (
              <button
                key={effect.name}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => applyEffect(effect.matrix)}
              >
                {effect.name}
              </button>
            ))}
          </div>
        )}
        
        {/* Transformations Tab */}
        {activeTab === 'transform' && (
          <div className="space-y-4">
            <Slider
              label="Rotate"
              value={settings.transformations.rotate}
              min={0}
              max={360}
              defaultValue={0}
              onChange={(value) => handleSettingChange('transformations.rotate', value)}
            />
            
            <Slider
              label="Scale X"
              value={settings.transformations.scaleX * 100}
              min={10}
              max={200}
              defaultValue={100}
              onChange={(value) => handleSettingChange('transformations.scaleX', value / 100)}
            />
            
            <Slider
              label="Scale Y"
              value={settings.transformations.scaleY * 100}
              min={10}
              max={200}
              defaultValue={100}
              onChange={(value) => handleSettingChange('transformations.scaleY', value / 100)}
            />
            
            <Slider
              label="Translate X"
              value={settings.transformations.translateX}
              min={-50}
              max={50}
              defaultValue={0}
              onChange={(value) => handleSettingChange('transformations.translateX', value)}
            />
            
            <Slider
              label="Translate Y"
              value={settings.transformations.translateY}
              min={-50}
              max={50}
              defaultValue={0}
              onChange={(value) => handleSettingChange('transformations.translateY', value)}
            />
            
            {/* Quick transform buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => handleSettingChange('transformations.rotate', (settings.transformations.rotate + 90) % 360)}
              >
                Rotate 90°
              </button>
              
              <button
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => handleSettingChange('transformations.rotate', (settings.transformations.rotate + 180) % 360)}
              >
                Rotate 180°
              </button>
              
              <button
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => handleSettingChange('transformations.scaleX', settings.transformations.scaleX * -1)}
              >
                Flip X
              </button>
              
              <button
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => handleSettingChange('transformations.scaleY', settings.transformations.scaleY * -1)}
              >
                Flip Y
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Before/After Slider component
  const BeforeAfterSlider = ({ beforeImage, afterImage }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);
    
    // Handle mouse/touch movement
    const handleMove = (clientX) => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const position = (x / rect.width) * 100;
      
      setSliderPosition(Math.max(0, Math.min(100, position)));
    };
    
    // Handle mouse events
    const handleMouseDown = (e) => {
      setIsDragging(true);
      handleMove(e.clientX);
    };
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    // Handle touch events
    const handleTouchStart = (e) => {
      setIsDragging(true);
      handleMove(e.touches[0].clientX);
    };
    
    const handleTouchMove = (e) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    useEffect(() => {
      // Add global event listeners
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);
      }
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }, [isDragging]);
    
    return (
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden cursor-col-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Before image (full width) */}
        <div className="absolute inset-0">
          {beforeImage}
        </div>
        
        {/* After image (clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          {afterImage}
        </div>
        
        {/* Slider line */}
        <div 
          className="absolute inset-y-0 w-0.5 bg-white shadow-md"
          style={{ left: `${sliderPosition}%` }}
        />
        
        {/* Slider handle */}
        <div 
          className="absolute w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center transform -translate-x-1/2"
          style={{ 
            left: `${sliderPosition}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 19l-8-8 8-8M21 19l-8-8 8-8" />
          </svg>
        </div>
        
        {/* Labels */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-sm py-1 px-2 rounded">
          Original
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-sm py-1 px-2 rounded">
          Processed
        </div>
      </div>
    );
  };
  
  //================ MAIN RENDER ================
  
  return (
    <div className="image-manipulator">
      <div className="flex flex-col lg:flex-row w-full gap-4">
        {/* Upload section - always visible */}
        <div className="w-full lg:w-auto p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Image Manipulator</h2>
          <ImageUploader />
          
          {/* Controls for mobile */}
          {isMobile && originalImage && (
            <button 
              className="mt-4 w-full p-2 bg-blue-500 text-white rounded"
              onClick={handleTogglePanel}
            >
              {showPanel ? 'Hide Controls' : 'Show Controls'}
            </button>
          )}
        </div>
        
        {/* Main content area - conditional based on originalImage */}
        {originalImage && (
          <div className="flex flex-col lg:flex-row flex-grow gap-4">
            {/* Effects panel - conditionally visible on mobile */}
            {(!isMobile || (isMobile && showPanel)) && (
              <div className="w-full lg:w-64 bg-white rounded-lg shadow p-4">
                <EffectsPanel />
              </div>
            )}
            
            {/* Preview area - main content */}
            <div className="flex-grow bg-white rounded-lg shadow p-4">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">Preview</h3>
                <div className="flex gap-2">
                  <button 
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={handleToggleCompare}
                  >
                    {compareMode ? 'Show Preview' : 'Compare'}
                  </button>
                  <button 
                    className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={handleDownload}
                  >
                    Download
                  </button>
                </div>
              </div>
              
              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {/* Canvas for original image (hidden) */}
              <canvas 
                ref={originalCanvasRef}
                className="hidden"
              />
              
              {/* Display area for processed result */}
              {!loading && !compareMode && (
                <div className="relative">
                  <canvas 
                    ref={canvasRef}
                    className="max-w-full max-h-[70vh] mx-auto border border-gray-200"
                  />
                </div>
              )}
              
              {/* Before/After comparison view */}
              {!loading && compareMode && originalImage && processedImage && (
                <div className="max-w-full max-h-[70vh] mx-auto">
                  <BeforeAfterSlider
                    beforeImage={
                      <img 
                        src={originalImage.src} 
                        alt="Original" 
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '70vh',
                          objectFit: 'contain' 
                        }} 
                      />
                    }
                    afterImage={
                      <img 
                        src={processedImage.src} 
                        alt="Processed" 
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '70vh',
                          objectFit: 'contain' 
                        }} 
                      />
                    }
                  />
                </div>
              )}
              
              {/* Image info */}
              {originalImage && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                  <p>
                    <strong>Original Size:</strong> {originalImage.width} × {originalImage.height}px
                    | <strong>Format:</strong> {originalImage.src.startsWith('data:image/png') ? 'PNG' : 
                      originalImage.src.startsWith('data:image/jpeg') ? 'JPEG' : 'Image'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageManipulator;