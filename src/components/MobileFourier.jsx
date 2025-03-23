import React, { useState, useEffect, useRef, useCallback, useContext, createContext, useMemo } from 'react';
import * as math from 'mathjs';

// Create context for app-wide state management
const FourierContext = createContext();

// Custom hook for accessing camera
const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  
  // Toggle between front and back camera
  const toggleCamera = useCallback(() => {
    if (stream) {
      // Stop current stream
      stream.getTracks().forEach(track => track.stop());
      // Switch camera type
      setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
    }
  }, [stream]);
  
  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { facingMode },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(err.message || 'Could not access camera');
    }
  }, [facingMode]);
  
  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);
  
  // Take a snapshot from the current video feed
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !stream) {
      return null;
    }
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return {
      dataUrl: canvas.toDataURL('image/png'),
      blob: canvas.toBlob(blob => blob, 'image/png'),
      dimensions: { width: canvas.width, height: canvas.height }
    };
  }, [stream]);
  
  // Check if the device has a camera
  const checkCameraAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (err) {
      console.error('Error checking camera availability:', err);
      return false;
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  return {
    videoRef,
    stream,
    error,
    facingMode,
    startCamera,
    stopCamera,
    toggleCamera,
    takeSnapshot,
    checkCameraAvailability
  };
};

// Custom hook for file input handling
const useFileInput = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleFileChange = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create a preview URL for the file
      const fileUrl = URL.createObjectURL(selectedFile);
      setPreview(fileUrl);
    }
  }, []);
  
  const clearFile = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview]);
  
  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Clean up URL objects when component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  
  return {
    file,
    preview,
    fileInputRef,
    handleFileChange,
    clearFile,
    triggerFileInput
  };
};

// Custom hook for image processing
const useImageProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const [contours, setContours] = useState([]);
  const [thresholdValue, setThresholdValue] = useState(128);
  const [blurRadius, setBlurRadius] = useState(2);
  
  // Apply various image processing steps
  // FIX: Properly define applyImageProcessing as a regular function, not inside useCallback
  const applyImageProcessing = useCallback((imageData, threshold, blur) => {
    // Convert to grayscale
    const grayscaleData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    for (let i = 0; i < grayscaleData.data.length; i += 4) {
      const r = grayscaleData.data[i];
      const g = grayscaleData.data[i + 1];
      const b = grayscaleData.data[i + 2];
      
      // Luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      grayscaleData.data[i] = gray;
      grayscaleData.data[i + 1] = gray;
      grayscaleData.data[i + 2] = gray;
    }
    
    // Apply blur (simplified box blur)
    let blurredData = grayscaleData;
    if (blur > 0) {
      blurredData = applyBoxBlur(grayscaleData, blur);
    }
    
    // Apply threshold
    const thresholdedData = new ImageData(
      new Uint8ClampedArray(blurredData.data),
      blurredData.width,
      blurredData.height
    );
    
    for (let i = 0; i < thresholdedData.data.length; i += 4) {
      const v = thresholdedData.data[i] < threshold ? 0 : 255;
      
      thresholdedData.data[i] = v;
      thresholdedData.data[i + 1] = v;
      thresholdedData.data[i + 2] = v;
    }
    
    // Find edges (simple edge detection)
    const edgeData = findEdges(thresholdedData);
    
    return edgeData;
  }, []);
  
  // Apply a simple box blur
  const applyBoxBlur = useCallback((imageData, radius) => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    
    // Copy the original data
    result.set(data);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const i = (y * width + nx) * 4;
          
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        const i = (y * width + x) * 4;
        result[i] = r / count;
        result[i + 1] = g / count;
        result[i + 2] = b / count;
      }
    }
    
    // Vertical pass
    const temp = new Uint8ClampedArray(result);
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          const i = (ny * width + x) * 4;
          
          r += temp[i];
          g += temp[i + 1];
          b += temp[i + 2];
          count++;
        }
        
        const i = (y * width + x) * 4;
        result[i] = r / count;
        result[i + 1] = g / count;
        result[i + 2] = b / count;
      }
    }
    
    return new ImageData(result, width, height);
  }, []);
  
  // Simple edge detection
  const findEdges = useCallback((imageData) => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    
    // Initialize with black
    for (let i = 0; i < result.length; i++) {
      result[i] = 0;
      // Set alpha channel
      if ((i + 1) % 4 === 0) {
        result[i] = 255;
      }
    }
    
    // Simple edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Check neighbors
        const top = data[((y - 1) * width + x) * 4];
        const bottom = data[((y + 1) * width + x) * 4];
        const left = data[(y * width + (x - 1)) * 4];
        const right = data[(y * width + (x + 1)) * 4];
        const current = data[idx];
        
        // If there's a difference between any neighbors, it's an edge
        if (
          Math.abs(current - top) > 50 ||
          Math.abs(current - bottom) > 50 ||
          Math.abs(current - left) > 50 ||
          Math.abs(current - right) > 50
        ) {
          result[idx] = 255;
          result[idx + 1] = 255;
          result[idx + 2] = 255;
        }
      }
    }
    
    return new ImageData(result, width, height);
  }, []);
  
  // Extract contours from the edge image
  const extractContours = useCallback((edgeData) => {
    const { width, height, data } = edgeData;
    
    // Create a grid to track visited pixels
    const visited = Array(height).fill().map(() => Array(width).fill(false));
    const contours = [];
    
    // Helper function to check if a pixel is white (edge)
    const isEdge = (x, y) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      const idx = (y * width + x) * 4;
      return data[idx] > 128;
    };
    
    // Find starting points for contours
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isEdge(x, y) && !visited[y][x]) {
          // Start a new contour
          const contour = [];
          let cx = x;
          let cy = y;
          
          // Direction vectors for 8-way search
          const dx = [1, 1, 0, -1, -1, -1, 0, 1];
          const dy = [0, 1, 1, 1, 0, -1, -1, -1];
          
          // Simple boundary following
          let foundNext = true;
          while (foundNext && contour.length < 5000) { // Safety limit
            visited[cy][cx] = true;
            contour.push({ x: cx - width/2, y: cy - height/2 }); // Center the contour
            
            foundNext = false;
            for (let dir = 0; dir < 8; dir++) {
              const nx = cx + dx[dir];
              const ny = cy + dy[dir];
              
              if (isEdge(nx, ny) && !visited[ny][nx]) {
                cx = nx;
                cy = ny;
                foundNext = true;
                break;
              }
            }
          }
          
          // Only keep contours with sufficient points
          if (contour.length > 10) {
            // Simplify contour by keeping only every Nth point
            const simplifiedContour = [];
            const step = Math.max(1, Math.floor(contour.length / 100)); // Limit to ~100 points
            
            for (let i = 0; i < contour.length; i += step) {
              simplifiedContour.push(contour[i]);
            }
            
            contours.push(simplifiedContour);
          }
        }
      }
    }
    
    return contours;
  }, []);
  
  // Process image to extract contours
  const processImage = useCallback(async (imageUrl) => {
    if (!imageUrl) return;
    
    setProcessing(true);
    
    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Process the image (convert to grayscale, apply threshold, find edges)
      const processedData = applyImageProcessing(imageData, thresholdValue, blurRadius);
      
      // Extract contours from the processed image
      const extractedContours = extractContours(processedData);
      setContours(extractedContours);
      
      setProcessing(false);
      return extractedContours;
    } catch (err) {
      console.error('Error processing image:', err);
      setProcessing(false);
      return [];
    }
  }, [thresholdValue, blurRadius, applyImageProcessing, extractContours]);
  
  return {
    processing,
    contours,
    thresholdValue,
    setThresholdValue,
    blurRadius,
    setBlurRadius,
    processImage
  };
};

// Custom hook for Fourier transform
const useFourierTransform = () => {
  const [fourierTerms, setFourierTerms] = useState(20);
  const [fourierCoefficients, setFourierCoefficients] = useState([]);
  
  // Calculate Fourier coefficients for a contour
  const calculateFourierCoefficients = useCallback((contour, numTerms = fourierTerms) => {
    if (!contour || contour.length === 0) return [];
    
    // Convert (x,y) contour points to complex numbers
    const complexPoints = contour.map(point => 
      math.complex(point.x, point.y)
    );
    
    const N = complexPoints.length;
    const coefficients = [];
    
    // Calculate coefficients for different frequencies
    for (let k = -numTerms/2; k <= numTerms/2; k++) {
      let sum = math.complex(0, 0);
      
      for (let n = 0; n < N; n++) {
        // e^(-i2πkn/N)
        const angle = -2 * Math.PI * k * n / N;
        const term = math.multiply(
          complexPoints[n],
          math.complex(Math.cos(angle), Math.sin(angle))
        );
        
        sum = math.add(sum, term);
      }
      
      // Normalize
      sum = math.divide(sum, N);
      
      coefficients.push({
        frequency: k,
        amplitude: math.abs(sum),
        phase: math.arg(sum),
        real: sum.re,
        imag: sum.im
      });
    }
    
    // Sort by amplitude (highest first)
    return coefficients.sort((a, b) => b.amplitude - a.amplitude);
  }, [fourierTerms]);
  
  // Process contours and calculate Fourier coefficients
  const processFourierTransform = useCallback((contours) => {
    if (!contours || contours.length === 0) return [];
    
    const allCoefficients = contours.map(contour => 
      calculateFourierCoefficients(contour, fourierTerms)
    );
    
    setFourierCoefficients(allCoefficients);
    return allCoefficients;
  }, [calculateFourierCoefficients, fourierTerms]);
  
  return {
    fourierTerms,
    setFourierTerms,
    fourierCoefficients,
    setFourierCoefficients,
    calculateFourierCoefficients,
    processFourierTransform
  };
};

// Main provider component for app-wide state
const FourierProvider = ({ children }) => {
  const camera = useCamera();
  const fileInput = useFileInput();
  const imageProcessing = useImageProcessing();
  const fourierTransform = useFourierTransform();
  
  // Combined state and methods
  const value = useMemo(() => ({
    ...camera,
    ...fileInput,
    ...imageProcessing,
    ...fourierTransform
  }), [camera, fileInput, imageProcessing, fourierTransform]);
  
  return (
    <FourierContext.Provider value={value}>
      {children}
    </FourierContext.Provider>
  );
};

// Custom hook to access the Fourier context
const useFourier = () => {
  const context = useContext(FourierContext);
  if (!context) {
    throw new Error('useFourier must be used within a FourierProvider');
  }
  return context;
};

// Component for camera input view
const CameraView = () => {
  const { 
    videoRef, startCamera, stopCamera, toggleCamera, 
    takeSnapshot, stream, error, facingMode 
  } = useFourier();
  
  // Start camera on mount
  useEffect(() => {
    startCamera();
    
    // Clean up on unmount
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);
  
  return (
    <div className="camera-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
        />
      </div>
      
      <div className="camera-controls">
        <button 
          className="camera-button toggle-camera"
          onClick={toggleCamera}
          disabled={!stream}
        >
          {facingMode === 'environment' ? 'Front Camera' : 'Back Camera'}
        </button>
        
        <button 
          className="camera-button capture"
          onClick={takeSnapshot}
          disabled={!stream}
        >
          Capture
        </button>
      </div>
    </div>
  );
};

// Component for file input view
const FileInputView = () => {
  const { 
    fileInputRef, handleFileChange, triggerFileInput,
    clearFile, preview, file 
  } = useFourier();
  
  return (
    <div className="file-input-container">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden-file-input"
        style={{ display: 'none' }}
      />
      
      <div className="file-input-controls">
        <button 
          className="file-button select-file"
          onClick={triggerFileInput}
        >
          Select Image
        </button>
        
        {file && (
          <button
            className="file-button clear-file"
            onClick={clearFile}
          >
            Clear
          </button>
        )}
      </div>
      
      {preview && (
        <div className="file-preview">
          <img 
            src={preview} 
            alt="Selected"
            className="preview-image"
          />
        </div>
      )}
    </div>
  );
};

// Component for displaying image processing controls
const ProcessingControls = () => {
  const { 
    thresholdValue, setThresholdValue,
    blurRadius, setBlurRadius,
    fourierTerms, setFourierTerms,
    processImage, preview, processing,
    processFourierTransform, contours
  } = useFourier();
  
  const handleProcess = useCallback(async () => {
    if (!preview) return;
    
    const extractedContours = await processImage(preview);
    if (extractedContours && extractedContours.length > 0) {
      processFourierTransform(extractedContours);
    }
  }, [preview, processImage, processFourierTransform]);
  
  return (
    <div className="processing-controls">
      <h3>Image Processing Settings</h3>
      
      <div className="control-group">
        <label htmlFor="threshold">Threshold: {thresholdValue}</label>
        <input 
          type="range"
          id="threshold"
          min="0"
          max="255"
          value={thresholdValue}
          onChange={(e) => setThresholdValue(parseInt(e.target.value))}
          className="slider"
        />
      </div>
      
      <div className="control-group">
        <label htmlFor="blur">Blur: {blurRadius}</label>
        <input 
          type="range"
          id="blur"
          min="0"
          max="10"
          value={blurRadius}
          onChange={(e) => setBlurRadius(parseInt(e.target.value))}
          className="slider"
        />
      </div>
      
      <div className="control-group">
        <label htmlFor="terms">Fourier Terms: {fourierTerms}</label>
        <input 
          type="range"
          id="terms"
          min="5"
          max="50"
          value={fourierTerms}
          onChange={(e) => setFourierTerms(parseInt(e.target.value))}
          className="slider"
        />
      </div>
      
      <button 
        className="process-button"
        onClick={handleProcess}
        disabled={!preview || processing}
      >
        {processing ? 'Processing...' : 'Process Image'}
      </button>
      
      {contours.length > 0 && (
        <div className="contour-info">
          <p>Found {contours.length} contours</p>
        </div>
      )}
    </div>
  );
};

// Component for displaying Fourier drawing
const FourierDrawing = () => {
  const { fourierCoefficients } = useFourier();
  const canvasRef = useRef(null);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentContourIndex, setCurrentContourIndex] = useState(0);
  const [path, setPath] = useState([]);
  const animationRef = useRef(null);
  
  // Calculate position from Fourier series at time t
  const calculatePosition = useCallback((coefficients, t) => {
    if (!coefficients || coefficients.length === 0) return { x: 0, y: 0 };
    
    let x = 0;
    let y = 0;
    
    for (const coef of coefficients) {
      const { frequency, amplitude, phase } = coef;
      const angle = frequency * t + phase;
      
      x += amplitude * Math.cos(angle);
      y += amplitude * Math.sin(angle);
    }
    
    return { x, y };
  }, []);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying || !fourierCoefficients.length) return;
    
    const currentCoeffs = fourierCoefficients[currentContourIndex];
    if (!currentCoeffs) return;
    
    const animate = () => {
      setTime(prevTime => {
        const newTime = prevTime + 0.01;
        
        // Calculate the new position
        const pos = calculatePosition(currentCoeffs, newTime);
        
        // Update the path
        setPath(prevPath => {
          const newPath = [...prevPath, pos];
          // Limit path length to prevent memory issues
          if (newPath.length > 500) {
            return newPath.slice(-500);
          }
          return newPath;
        });
        
        // Complete one cycle
        if (newTime >= 2 * Math.PI) {
          return 0;
        }
        
        return newTime;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, fourierCoefficients, currentContourIndex, calculatePosition]);
  
  // Draw on canvas
  useEffect(() => {
    if (!canvasRef.current || !fourierCoefficients.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw path
    if (path.length > 1) {
      ctx.beginPath();
      ctx.moveTo(centerX + path[0].x, centerY + path[0].y);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(centerX + path[i].x, centerY + path[i].y);
      }
      
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw epicycles if time > 0
    if (time > 0 && fourierCoefficients.length > 0) {
      const currentCoeffs = fourierCoefficients[currentContourIndex];
      if (!currentCoeffs) return;
      
      let x = centerX;
      let y = centerY;
      
      // Draw each circle (limited to first few for performance)
      const maxCircles = Math.min(20, currentCoeffs.length);
      
      for (let i = 0; i < maxCircles; i++) {
        const coef = currentCoeffs[i];
        const { frequency, amplitude, phase } = coef;
        const angle = frequency * time + phase;
        
        // Draw the circle
        ctx.beginPath();
        ctx.arc(x, y, amplitude, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.stroke();
        
        // Calculate next center point
        const dx = amplitude * Math.cos(angle);
        const dy = amplitude * Math.sin(angle);
        
        // Draw the radius
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.stroke();
        
        x += dx;
        y += dy;
      }
      
      // Draw a dot at the end
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  }, [time, path, fourierCoefficients, currentContourIndex]);
  
  // Reset the drawing
  const resetDrawing = useCallback(() => {
    setPath([]);
    setTime(0);
  }, []);
  
  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  // Change the current contour
  const changeContour = useCallback((direction) => {
    setCurrentContourIndex(prev => {
      let newIndex = prev + direction;
      if (newIndex < 0) newIndex = fourierCoefficients.length - 1;
      if (newIndex >= fourierCoefficients.length) newIndex = 0;
      return newIndex;
    });
    resetDrawing();
  }, [fourierCoefficients.length, resetDrawing]);
  
  if (!fourierCoefficients.length) {
    return (
      <div className="fourier-placeholder">
        <p>Process an image to see Fourier drawing</p>
      </div>
    );
  }
  
  return (
    <div className="fourier-container">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="fourier-canvas"
      />
      
      <div className="fourier-controls">
        <button
          className="control-button"
          onClick={togglePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button
          className="control-button"
          onClick={resetDrawing}
        >
          Reset
        </button>
        
        {fourierCoefficients.length > 1 && (
          <div className="contour-navigation">
            <button
              className="control-button"
              onClick={() => changeContour(-1)}
            >
              Prev
            </button>
            
            <span className="contour-info">
              {currentContourIndex + 1} / {fourierCoefficients.length}
            </span>
            
            <button
              className="control-button"
              onClick={() => changeContour(1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Tabs component
const Tabs = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {React.Children.map(children, (child, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {React.Children.toArray(children)[activeTab]}
      </div>
    </div>
  );
};

// Tab panel component
const TabPanel = ({ children, label }) => {
  return (
    <div className="tab-panel">
      {children}
    </div>
  );
};

// Main app component
const MobileFourierTransform = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <FourierProvider>
      <div className="mobile-fourier-app">
        <header className="app-header">
          <h1>Fourier Transform Drawing</h1>
        </header>
        
        <main className="app-content">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab}>
            <TabPanel label="Camera">
              <CameraView />
            </TabPanel>
            
            <TabPanel label="File">
              <FileInputView />
            </TabPanel>
            
            <TabPanel label="Process">
              <ProcessingControls />
            </TabPanel>
            
            <TabPanel label="Draw">
              <FourierDrawing />
            </TabPanel>
          </Tabs>
        </main>
        
        <style jsx>{`
          .mobile-fourier-app {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            max-width: 100%;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            min-height: 100vh;
          }
          
          .app-header {
            background-color: #3498db;
            color: white;
            padding: 1rem;
            text-align: center;
          }
          
          .app-header h1 {
            margin: 0;
            font-size: 1.5rem;
          }
          
          .app-content {
            padding: 1rem;
          }
          
          /* Tabs styling */
          .tabs-container {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .tabs-header {
            display: flex;
            background-color: #f1f1f1;
          }
          
          .tab-button {
            flex: 1;
            padding: 0.75rem 0;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 500;
            color: #666;
            transition: 0.3s;
          }
          
          .tab-button.active {
            background-color: #3498db;
            color: white;
          }
          
          .tab-content {
            padding: 1rem;
          }
          
          /* Camera view styling */
          .camera-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .video-container {
            width: 100%;
            aspect-ratio: 4/3;
            background-color: #000;
            overflow: hidden;
            border-radius: 8px;
            margin-bottom: 1rem;
          }
          
          .camera-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .camera-controls {
            display: flex;
            justify-content: space-between;
            width: 100%;
          }
          
          .camera-button {
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 6px;
            background-color: #3498db;
            color: white;
            font-weight: 500;
            cursor: pointer;
          }
          
          .camera-button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
          
          .camera-button.capture {
            background-color: #2ecc71;
          }
          
          .error-message {
            color: #e74c3c;
            margin-bottom: 1rem;
            text-align: center;
          }
          
          /* File input styling */
          .file-input-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .file-input-controls {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
            width: 100%;
          }
          
          .file-button {
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 6px;
            background-color: #3498db;
            color: white;
            font-weight: 500;
            cursor: pointer;
            flex: 1;
            max-width: 150px;
          }
          
          .file-button.clear-file {
            background-color: #e74c3c;
          }
          
          .file-preview {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-top: 1rem;
          }
          
          .preview-image {
            max-width: 100%;
            max-height: 300px;
            border-radius: 8px;
          }
          
          /* Processing controls styling */
          .processing-controls {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          .control-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .slider {
            width: 100%;
            -webkit-appearance: none;
            height: 8px;
            border-radius: 4px;
            background: #ddd;
            outline: none;
          }
          
          .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3498db;
            cursor: pointer;
          }
          
          .process-button {
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 6px;
            background-color: #2ecc71;
            color: white;
            font-weight: 500;
            cursor: pointer;
            margin-top: 1rem;
          }
          
          .process-button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
          
          /* Fourier drawing styling */
          .fourier-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          
          .fourier-canvas {
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: white;
            max-width: 100%;
            touch-action: none;
          }
          
          .fourier-controls {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
          }
          
          .control-button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            background-color: #3498db;
            color: white;
            font-weight: 500;
            cursor: pointer;
          }
          
          .contour-navigation {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .contour-info {
            font-size: 0.875rem;
          }
          
          .fourier-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 300px;
            background-color: #f9f9f9;
            border-radius: 8px;
            color: #666;
          }
        `}</style>
      </div>
    </FourierProvider>
  );
};

export default MobileFourierTransform;