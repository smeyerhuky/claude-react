import React, { useState, useRef, useEffect, useCallback } from 'react';

// ComprehensiveImageManipulator component contains everything needed
const ComprehensiveImageManipulator = () => {
  // ======== STATE MANAGEMENT ========
  // Image related state
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('adjust');
  const [compareMode, setCompareMode] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // History state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Image settings
  const [settings, setSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    grayscale: 0,
    invert: 0,
    sepia: 0,
    transformations: {
      rotate: 0,
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0
    }
  });
  
  // ======== REFS ========
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // ======== EFFECTS ========
  // Responsive design handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Process image whenever settings change
  useEffect(() => {
    if (originalImage && !isProcessing) {
      processImage();
    }
  }, [settings]);
  
  // ======== IMAGE HANDLING FUNCTIONS ========
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setSettings({
          brightness: 100,
          contrast: 100,
          saturation: 100,
          hue: 0,
          blur: 0,
          grayscale: 0,
          invert: 0,
          sepia: 0,
          transformations: {
            rotate: 0,
            scaleX: 1,
            scaleY: 1,
            translateX: 0,
            translateY: 0
          }
        });
        
        // Initialize history
        setHistory([{
          brightness: 100,
          contrast: 100,
          saturation: 100,
          hue: 0,
          blur: 0,
          grayscale: 0,
          invert: 0,
          sepia: 0,
          transformations: {
            rotate: 0,
            scaleX: 1,
            scaleY: 1,
            translateX: 0,
            translateY: 0
          }
        }]);
        setHistoryIndex(0);
        
        // Process image with default settings
        processImage();
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  };
  
  // Process the image with current settings
  const processImage = useCallback(() => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    
    // Use setTimeout to give UI a chance to update
    setTimeout(() => {
      const canvas = processedCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match image
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      
      // Draw original image
      ctx.drawImage(originalImage, 0, 0);
      
      // Apply transformations
      applyTransformations(ctx, canvas.width, canvas.height);
      
      // Get image data for pixel manipulation
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply color adjustments
      imageData = applyColorAdjustments(imageData);
      
      // Put processed image data back to canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Apply blur if needed (as a post-process effect)
      if (settings.blur > 0) {
        applyBlur(ctx, canvas.width, canvas.height, settings.blur);
      }
      
      // Create an image from the processed canvas
      const processedImg = new Image();
      processedImg.onload = () => {
        setProcessedImage(processedImg);
        setIsProcessing(false);
      };
      processedImg.src = canvas.toDataURL();
    }, 0);
  }, [originalImage, settings]);
  
  // Apply geometric transformations
  const applyTransformations = (ctx, width, height) => {
    const { transformations } = settings;
    
    // Save the current state
    ctx.save();
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Move to center for transformations
    ctx.translate(width / 2, height / 2);
    
    // Apply rotation
    if (transformations.rotate !== 0) {
      ctx.rotate((transformations.rotate * Math.PI) / 180);
    }
    
    // Apply scaling
    ctx.scale(transformations.scaleX, transformations.scaleY);
    
    // Apply translation
    ctx.translate(
      (transformations.translateX / 100) * width,
      (transformations.translateY / 100) * height
    );
    
    // Draw the image centered
    ctx.drawImage(originalImage, -width / 2, -height / 2, width, height);
    
    // Restore the context
    ctx.restore();
  };
  
  // Apply color adjustments to image data
  const applyColorAdjustments = (imageData) => {
    const { data } = imageData;
    const {
      brightness,
      contrast,
      saturation,
      hue,
      grayscale,
      invert,
      sepia
    } = settings;
    
    // Create adjustment values
    const brightnessF = brightness / 100;
    const contrastF = contrast / 100;
    const saturationF = saturation / 100;
    
    // Contrast adjustment
    const factor = (259 * (contrastF * 255 + 255)) / (255 * (259 - contrastF * 255));
    
    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply brightness
      r *= brightnessF;
      g *= brightnessF;
      b *= brightnessF;
      
      // Apply contrast
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
      
      // Apply saturation
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = Math.max(0, Math.min(255, gray + saturationF * (r - gray)));
      g = Math.max(0, Math.min(255, gray + saturationF * (g - gray)));
      b = Math.max(0, Math.min(255, gray + saturationF * (b - gray)));
      
      // Apply grayscale
      if (grayscale > 0) {
        const grayValue = 0.2989 * r + 0.587 * g + 0.114 * b;
        const grayPercent = grayscale / 100;
        
        r = r * (1 - grayPercent) + grayValue * grayPercent;
        g = g * (1 - grayPercent) + grayValue * grayPercent;
        b = b * (1 - grayPercent) + grayValue * grayPercent;
      }
      
      // Apply sepia
      if (sepia > 0) {
        const sepiaR = (r * 0.393) + (g * 0.769) + (b * 0.189);
        const sepiaG = (r * 0.349) + (g * 0.686) + (b * 0.168);
        const sepiaB = (r * 0.272) + (g * 0.534) + (b * 0.131);
        const sepiaPercent = sepia / 100;
        
        r = r * (1 - sepiaPercent) + sepiaR * sepiaPercent;
        g = g * (1 - sepiaPercent) + sepiaG * sepiaPercent;
        b = b * (1 - sepiaPercent) + sepiaB * sepiaPercent;
      }
      
      // Apply invert
      if (invert > 0) {
        const invertPercent = invert / 100;
        
        r = r * (1 - invertPercent) + (255 - r) * invertPercent;
        g = g * (1 - invertPercent) + (255 - g) * invertPercent;
        b = b * (1 - invertPercent) + (255 - b) * invertPercent;
      }
      
      // Apply hue rotation (simplified implementation)
      if (hue !== 0) {
        const hueRadians = hue * Math.PI / 180;
        
        // Convert RGB to HSL
        let max = Math.max(r, g, b) / 255;
        let min = Math.min(r, g, b) / 255;
        let l = (max + min) / 2;
        
        if (max !== min) {
          const d = max - min;
          let h, s;
          
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          if (max === r / 255) {
            h = (g / 255 - b / 255) / d + (g < b ? 6 : 0);
          } else if (max === g / 255) {
            h = (b / 255 - r / 255) / d + 2;
          } else {
            h = (r / 255 - g / 255) / d + 4;
          }
          
          h /= 6;
          
          // Rotate hue
          h = (h + hueRadians / (2 * Math.PI)) % 1;
          
          // Convert back to RGB
          if (s === 0) {
            r = g = b = l * 255;
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hueToRgb(p, q, h + 1/3) * 255;
            g = hueToRgb(p, q, h) * 255;
            b = hueToRgb(p, q, h - 1/3) * 255;
          }
        }
      }
      
      // Update the image data
      data[i] = Math.round(Math.max(0, Math.min(255, r)));
      data[i + 1] = Math.round(Math.max(0, Math.min(255, g)));
      data[i + 2] = Math.round(Math.max(0, Math.min(255, b)));
    }
    
    return imageData;
  };
  
  // Helper for HSL to RGB conversion
  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  // Apply blur effect
  const applyBlur = (ctx, width, height, radius) => {
    // Simple implementation of box blur for demonstration
    // In a real app, use a more sophisticated Gaussian blur
    const iterations = Math.ceil(radius);
    
    for (let i = 0; i < iterations; i++) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const tempData = new Uint8ClampedArray(imageData.data);
      
      // Horizontal blur
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.min(Math.max(0, x + dx), width - 1);
            const idx = (y * width + nx) * 4;
            
            r += tempData[idx];
            g += tempData[idx + 1];
            b += tempData[idx + 2];
            a += tempData[idx + 3];
            count++;
          }
          
          const idx = (y * width + x) * 4;
          imageData.data[idx] = r / count;
          imageData.data[idx + 1] = g / count;
          imageData.data[idx + 2] = b / count;
          imageData.data[idx + 3] = a / count;
        }
      }
      
      // Update canvas with horizontal blur
      ctx.putImageData(imageData, 0, 0);
      
      // Get updated image data for vertical blur
      const vImageData = ctx.getImageData(0, 0, width, height);
      const vTempData = new Uint8ClampedArray(vImageData.data);
      
      // Vertical blur
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          
          for (let dy = -radius; dy <= radius; dy++) {
            const ny = Math.min(Math.max(0, y + dy), height - 1);
            const idx = (ny * width + x) * 4;
            
            r += vTempData[idx];
            g += vTempData[idx + 1];
            b += vTempData[idx + 2];
            a += vTempData[idx + 3];
            count++;
          }
          
          const idx = (y * width + x) * 4;
          vImageData.data[idx] = r / count;
          vImageData.data[idx + 1] = g / count;
          vImageData.data[idx + 2] = b / count;
          vImageData.data[idx + 3] = a / count;
        }
      }
      
      // Update canvas with vertical blur
      ctx.putImageData(vImageData, 0, 0);
    }
  };
  
  // ======== UI INTERACTION HANDLERS ========
  // Handle slider changes
  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings };
    
    if (key.includes('.')) {
      // Handle nested settings
      const [parentKey, childKey] = key.split('.');
      newSettings[parentKey] = {
        ...newSettings[parentKey],
        [childKey]: value
      };
    } else {
      newSettings[key] = value;
    }
    
    setSettings(newSettings);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSettings);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // History navigation
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setSettings(history[newIndex]);
  };
  
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setSettings(history[newIndex]);
  };
  
  // Reset to original
  const handleReset = () => {
    setSettings({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      grayscale: 0,
      invert: 0,
      sepia: 0,
      transformations: {
        rotate: 0,
        scaleX: 1,
        scaleY: 1,
        translateX: 0,
        translateY: 0
      }
    });
    
    // Update history
    const newHistory = [
      ...history.slice(0, historyIndex + 1),
      {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        grayscale: 0,
        invert: 0,
        sepia: 0,
        transformations: {
          rotate: 0,
          scaleX: 1,
          scaleY: 1,
          translateX: 0,
          translateY: 0
        }
      }
    ];
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Download processed image
  const handleDownload = () => {
    if (!processedCanvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = processedCanvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  // ======== RENDERING ========
  // Render a slider component
  const renderSlider = (label, key, min, max, step = 1) => {
    // Get current value (handle nested properties)
    let value;
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      value = settings[parentKey][childKey];
    } else {
      value = settings[key];
    }
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm text-gray-500">{value}</span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full">
          <div 
            className="absolute h-full bg-blue-500 rounded-full"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          ></div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleSettingChange(key, parseFloat(e.target.value))}
          className="absolute w-full h-2 opacity-0 cursor-pointer"
          style={{ marginTop: '-8px' }}
        />
      </div>
    );
  };

  // Main app renderer
  return (
    <div className="comprehensive-image-manipulator p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Image Manipulator</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Controls */}
        <div className={`bg-white p-4 rounded-lg shadow-md ${isMobile ? 'w-full' : 'w-80'}`}>
          {/* File upload section */}
          {!originalImage ? (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Upload an Image</h2>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer"
                onClick={() => fileInputRef.current.click()}
              >
                <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Click to select an image</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex mb-4 border-b">
                <button
                  className={`flex-1 py-2 text-center ${activeTab === 'adjust' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('adjust')}
                >
                  Adjust
                </button>
                <button
                  className={`flex-1 py-2 text-center ${activeTab === 'presets' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('presets')}
                >
                  Presets
                </button>
                <button
                  className={`flex-1 py-2 text-center ${activeTab === 'transform' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('transform')}
                >
                  Transform
                </button>
              </div>
              
              {/* Adjustment controls */}
              {activeTab === 'adjust' && (
                <div>
                  {renderSlider('Brightness', 'brightness', 0, 200)}
                  {renderSlider('Contrast', 'contrast', 0, 200)}
                  {renderSlider('Saturation', 'saturation', 0, 200)}
                  {renderSlider('Hue', 'hue', 0, 360)}
                  {renderSlider('Blur', 'blur', 0, 20, 0.5)}
                  {renderSlider('Grayscale', 'grayscale', 0, 100)}
                  {renderSlider('Invert', 'invert', 0, 100)}
                  {renderSlider('Sepia', 'sepia', 0, 100)}
                </div>
              )}
              
              {/* Presets */}
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded"
                    onClick={() => handleSettingChange('grayscale', 100)}
                  >
                    Grayscale
                  </button>
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded"
                    onClick={() => handleSettingChange('sepia', 100)}
                  >
                    Sepia
                  </button>
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded"
                    onClick={() => {
                      handleSettingChange('brightness', 120);
                      handleSettingChange('contrast', 120);
                    }}
                  >
                    Enhance
                  </button>
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded"
                    onClick={() => handleSettingChange('invert', 100)}
                  >
                    Invert
                  </button>
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded"
                    onClick={() => {
                      handleSettingChange('brightness', 80);
                      handleSettingChange('saturation', 120);
                    }}
                  >
                    Warm
                  </button>
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded"
                    onClick={() => {
                      handleSettingChange('brightness', 80);
                      handleSettingChange('saturation', 80);
                      handleSettingChange('hue', 180);
                    }}
                  >
                    Cool
                  </button>
                </div>
              )}
              
              {/* Transform controls */}
              {activeTab === 'transform' && (
                <div>
                  {renderSlider('Rotate', 'transformations.rotate', 0, 360)}
                  {renderSlider('Scale X', 'transformations.scaleX', -2, 2, 0.1)}
                  {renderSlider('Scale Y', 'transformations.scaleY', -2, 2, 0.1)}
                  {renderSlider('Translate X', 'transformations.translateX', -50, 50)}
                  {renderSlider('Translate Y', 'transformations.translateY', -50, 50)}
                </div>
              )}
              
              {/* History controls */}
              <div className="flex justify-between mt-4 pt-4 border-t">
                <button
                  className={`p-2 rounded ${historyIndex > 0 ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
                  Undo
                </button>
                <button
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={handleReset}
                >
                  Reset
                </button>
                <button
                  className={`p-2 rounded ${historyIndex < history.length - 1 ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  Redo
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Right panel - Image preview */}
        <div className="flex-1 bg-white p-4 rounded-lg shadow-md">
          {originalImage ? (
            <>
              {/* Toolbar */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Preview</h2>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setCompareMode(!compareMode)}
                  >
                    {compareMode ? 'Show Preview' : 'Compare'}
                  </button>
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={handleDownload}
                  >
                    Download
                  </button>
                </div>
              </div>
              
              {/* Image preview */}
              <div className="relative">
                {/* Processing indicator */}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  </div>
                )}
                
                {/* Canvas for processing (hidden) */}
                <canvas ref={originalCanvasRef} className="hidden" />
                <canvas ref={processedCanvasRef} className="hidden" />
                
                {/* Visual display */}
                {!compareMode ? (
                  <div className="flex justify-center">
                    {processedImage && (
                      <img 
                        src={processedImage.src} 
                        alt="Processed" 
                        className="max-w-full max-h-[50vh] object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="relative flex justify-center">
                    {/* Before/After comparison slider */}
                    <div className="relative max-w-full max-h-[50vh] overflow-hidden">
                      <div className="relative">
                        {/* Original image (left side) */}
                        <img 
                          src={originalImage.src} 
                          alt="Original" 
                          className="max-w-full max-h-[50vh] object-contain"
                        />
                        
                        {/* Processed image (right side) with clip path */}
                        <div 
                          className="absolute top-0 right-0 bottom-0 overflow-hidden"
                          style={{ width: `${sliderPosition}%` }}
                        >
                          {processedImage && (
                            <img 
                              src={processedImage.src} 
                              alt="Processed" 
                              className="max-w-full max-h-[50vh] object-contain"
                              style={{ 
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: `${10000 / sliderPosition}%`,
                                maxHeight: '50vh',
                                objectFit: 'contain',
                                transform: `translateX(${sliderPosition - 100}%)` 
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Slider control */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                          style={{ left: `${sliderPosition}%` }}
                          onMouseDown={(e) => {
                            const handleMove = (moveEvent) => {
                              const containerRect = e.currentTarget.parentElement.getBoundingClientRect();
                              const newPosition = Math.max(0, Math.min(100, 
                                ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100
                              ));
                              setSliderPosition(newPosition);
                            };
                            
                            const handleUp = () => {
                              document.removeEventListener('mousemove', handleMove);
                              document.removeEventListener('mouseup', handleUp);
                            };
                            
                            document.addEventListener('mousemove', handleMove);
                            document.addEventListener('mouseup', handleUp);
                          }}
                        >
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 8l-6 6-6-6" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Labels */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Original</div>
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Processed</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Image information */}
                {processedImage && (
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <h3 className="font-semibold mb-1">Image Information</h3>
                    <p>Original Size: {originalImage.width} × {originalImage.height}px</p>
                    <p>Aspect Ratio: {originalImage.width / originalImage.height > 1 ? 'Landscape' : 'Portrait'}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>Upload an image to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveImageManipulator;