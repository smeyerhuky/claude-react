import React, { createContext, useContext, useReducer, useCallback, useRef, useState, useEffect } from 'react';
import * as math from 'mathjs';

// =============================================
// Context and State Management
// =============================================

// Initial state for the Fourier processing
const initialState = {
  // Image state
  originalImage: null,
  imageUrl: null,
  
  // Processing state
  processingStep: 'upload', // 'upload', 'preprocess', 'edges', 'contours', 'fourier', 'animation'
  isProcessing: false,
  
  // Processing parameters
  params: {
    blurRadius: 2,
    contourSimplification: 5,
    fourierTerms: 50,
    // Removed manual threshold - will be auto-calculated
  },
  
  // Result state
  preprocessedImageData: null,
  edgeImageData: null,
  contours: [],
  fourierCoefficients: [],
  
  // Animation state
  isPlaying: false,
  animationSpeed: 1,
  currentContourIndex: 0,
  drawingPath: []
};

// Action types
const actionTypes = {
  SET_IMAGE: 'SET_IMAGE',
  SET_PROCESSING_STEP: 'SET_PROCESSING_STEP',
  SET_PROCESSING_STATUS: 'SET_PROCESSING_STATUS',
  UPDATE_PARAMETER: 'UPDATE_PARAMETER',
  SET_PREPROCESSED_IMAGE: 'SET_PREPROCESSED_IMAGE',
  SET_EDGE_IMAGE: 'SET_EDGE_IMAGE',
  SET_CONTOURS: 'SET_CONTOURS',
  SET_FOURIER_COEFFICIENTS: 'SET_FOURIER_COEFFICIENTS',
  UPDATE_ANIMATION_STATE: 'UPDATE_ANIMATION_STATE',
  RESET_DRAWING: 'RESET_DRAWING',
  UPDATE_DRAWING_PATH: 'UPDATE_DRAWING_PATH'
};

// Reducer function
function fourierReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_IMAGE:
      return {
        ...state,
        originalImage: action.payload.image,
        imageUrl: action.payload.url,
        processingStep: 'preprocess',
        // Reset results when changing image
        preprocessedImageData: null,
        edgeImageData: null,
        contours: [],
        fourierCoefficients: [],
        drawingPath: []
      };
      
    case actionTypes.SET_PROCESSING_STEP:
      return {
        ...state,
        processingStep: action.payload
      };
      
    case actionTypes.SET_PROCESSING_STATUS:
      return {
        ...state,
        isProcessing: action.payload
      };
      
    case actionTypes.UPDATE_PARAMETER:
      return {
        ...state,
        params: {
          ...state.params,
          [action.payload.name]: action.payload.value
        }
      };
      
    case actionTypes.SET_PREPROCESSED_IMAGE:
      return {
        ...state,
        preprocessedImageData: action.payload
      };
      
    case actionTypes.SET_EDGE_IMAGE:
      return {
        ...state,
        edgeImageData: action.payload
      };
      
    case actionTypes.SET_CONTOURS:
      return {
        ...state,
        contours: action.payload
      };
      
    case actionTypes.SET_FOURIER_COEFFICIENTS:
      return {
        ...state,
        fourierCoefficients: action.payload,
        currentContourIndex: 0
      };
      
    case actionTypes.UPDATE_ANIMATION_STATE:
      return {
        ...state,
        isPlaying: action.payload.isPlaying !== undefined ? action.payload.isPlaying : state.isPlaying,
        animationSpeed: action.payload.speed !== undefined ? action.payload.speed : state.animationSpeed,
        currentContourIndex: action.payload.contourIndex !== undefined ? action.payload.contourIndex : state.currentContourIndex
      };
      
    case actionTypes.RESET_DRAWING:
      return {
        ...state,
        drawingPath: []
      };
      
    case actionTypes.UPDATE_DRAWING_PATH:
      return {
        ...state,
        drawingPath: action.payload
      };
      
    default:
      return state;
  }
}

// Create context
const FourierContext = createContext();

// Custom hook for using the Fourier context
function useFourier() {
  const context = useContext(FourierContext);
  if (!context) {
    throw new Error('useFourier must be used within a FourierProvider');
  }
  return context;
}

// =============================================
// Custom Hooks
// =============================================

// Hook for image loading and manipulation
function useImageLoader() {
  const { state, dispatch } = useFourier();
  
  // Load image from file
  const loadImage = useCallback((file) => {
    if (!file || !file.type.match('image.*')) return;
    
    const imageUrl = URL.createObjectURL(file);
    
    const image = new Image();
    image.onload = () => {
      dispatch({
        type: actionTypes.SET_IMAGE,
        payload: { image, url: imageUrl }
      });
    };
    image.src = imageUrl;
  }, [dispatch]);
  
  // Load demo image
  const loadDemoImage = useCallback((demoName) => {
    // In a real implementation, we would load predefined demo images
    alert(`Loading demo: ${demoName}`);
  }, []);
  
  return { loadImage, loadDemoImage };
}

// Hook for image processing operations
function useFourierProcessing() {
  const { state, dispatch } = useFourier();
  const canvasRef = useRef(null);
  
  // Process the image through the pipeline
  const processImage = useCallback(async () => {
    // Set processing flag
    dispatch({ type: actionTypes.SET_PROCESSING_STATUS, payload: true });
    
    try {
      // Preprocess step - convert to grayscale, blur, etc.
      const preprocessed = await preprocessImage(state.originalImage, state.params);
      dispatch({ type: actionTypes.SET_PREPROCESSED_IMAGE, payload: preprocessed });
      
      // Auto-threshold and edge detection
      const edgeData = await detectEdges(preprocessed);
      dispatch({ type: actionTypes.SET_EDGE_IMAGE, payload: edgeData });
      
      // Extract contours
      const contours = await extractContours(edgeData);
      
      // Simplify contours
      const simplifiedContours = simplifyContours(contours, state.params.contourSimplification);
      dispatch({ type: actionTypes.SET_CONTOURS, payload: simplifiedContours });
      
      // Calculate Fourier coefficients
      const coefficients = [];
      for (const contour of simplifiedContours) {
        if (contour.length > 10) { // Only process meaningful contours
          const coeffs = calculateFourierCoefficients(contour, state.params.fourierTerms);
          coefficients.push(coeffs);
        }
      }
      
      dispatch({ type: actionTypes.SET_FOURIER_COEFFICIENTS, payload: coefficients });
      
      // Move to fourier step
      dispatch({ type: actionTypes.SET_PROCESSING_STEP, payload: 'fourier' });
    } catch (error) {
      console.error('Error processing image:', error);
    }
    
    // Clear processing flag
    dispatch({ type: actionTypes.SET_PROCESSING_STATUS, payload: false });
  }, [state.originalImage, state.params, dispatch]);
  
  // Preprocess image (grayscale, blur)
  const preprocessImage = async (image, params) => {
    return new Promise(resolve => {
      // Create temporary canvas for processing
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      
      // Draw image to canvas
      ctx.drawImage(image, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Convert to grayscale
      const grayscaleData = convertToGrayscale(imageData);
      
      // Apply blur
      const blurredData = applyGaussianBlur(grayscaleData, params.blurRadius);
      
      // Resolve with processed data
      setTimeout(() => resolve(blurredData), 50); // Small delay for UI responsiveness
    });
  };
  
  // Convert image to grayscale
  const convertToGrayscale = (imageData) => {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  };
  
  // Apply Gaussian blur
  const applyGaussianBlur = (imageData, radius) => {
    // Simple box blur as an approximation
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    const result = new Uint8ClampedArray(data);
    
    // Skip blur if radius is 0
    if (radius <= 0) return imageData;
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let i = -radius; i <= radius; i++) {
          const cx = Math.min(width - 1, Math.max(0, x + i));
          const idx = (y * width + cx) * 4;
          
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
        
        const idx = (y * width + x) * 4;
        result[idx] = r / count;
        result[idx + 1] = g / count;
        result[idx + 2] = b / count;
        result[idx + 3] = a / count;
      }
    }
    
    // Vertical pass
    const temp = new Uint8ClampedArray(result);
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let i = -radius; i <= radius; i++) {
          const cy = Math.min(height - 1, Math.max(0, y + i));
          const idx = (cy * width + x) * 4;
          
          r += temp[idx];
          g += temp[idx + 1];
          b += temp[idx + 2];
          a += temp[idx + 3];
          count++;
        }
        
        const idx = (y * width + x) * 4;
        result[idx] = r / count;
        result[idx + 1] = g / count;
        result[idx + 2] = b / count;
        result[idx + 3] = a / count;
      }
    }
    
    return new ImageData(result, width, height);
  };
  
  // Auto threshold and edge detection
  const detectEdges = async (imageData) => {
    return new Promise(resolve => {
      // Auto-calculate threshold using Otsu's method
      const threshold = calculateOtsuThreshold(imageData);
      
      // Apply threshold
      const thresholdedData = applyThreshold(imageData, threshold);
      
      // Detect edges
      const edgeData = findEdges(thresholdedData);
      
      setTimeout(() => resolve(edgeData), 50); // Small delay for UI responsiveness
    });
  };
  
  // Calculate optimal threshold using Otsu's method
  const calculateOtsuThreshold = (imageData) => {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    
    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }
    
    const total = data.length / 4;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const variance = wB * wF * (mB - mF) * (mB - mF);
      
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }
    
    return threshold;
  };
  
  // Apply threshold
  const applyThreshold = (imageData, threshold) => {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i] < threshold ? 0 : 255;
      
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  };
  
  // Edge detection
  const findEdges = (imageData) => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
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
  };
  
  // Extract contours from edge image
  const extractContours = async (edgeData) => {
    return new Promise(resolve => {
      const width = edgeData.width;
      const height = edgeData.height;
      const data = edgeData.data;
      
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
              contour.push({ x: cx, y: cy });
              
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
              contours.push(contour);
            }
          }
        }
      }
      
      setTimeout(() => resolve(contours), 50); // Small delay for UI responsiveness
    });
  };
  
  // Simplify contours by removing redundant points
  const simplifyContours = (contours, tolerance) => {
    return contours.map(contour => {
      // Simple point reduction strategy - keep every nth point
      const simplified = [];
      for (let i = 0; i < contour.length; i += tolerance) {
        simplified.push(contour[i]);
      }
      
      // Ensure the contour is closed
      if (simplified.length > 0 && 
          (simplified[0].x !== simplified[simplified.length - 1].x || 
           simplified[0].y !== simplified[simplified.length - 1].y)) {
        simplified.push(simplified[0]);
      }
      
      return simplified;
    });
  };
  
  // Calculate Fourier coefficients for a contour
  const calculateFourierCoefficients = (contour, numTerms) => {
    // Canvas dimensions for centering
    const canvasWidth = 400; // Default width
    const canvasHeight = 400; // Default height
    
    // Convert (x,y) contour points to complex numbers
    const complexPoints = contour.map(point => 
      math.complex(point.x - canvasWidth/2, point.y - canvasHeight/2)
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
  };
  
  // Reset to a previous step
  const resetToStep = useCallback((step) => {
    dispatch({ type: actionTypes.SET_PROCESSING_STEP, payload: step });
    
    // Reset data based on the step
    if (step === 'upload') {
      dispatch({ type: actionTypes.SET_IMAGE, payload: { image: null, url: null } });
    } else if (step === 'preprocess') {
      dispatch({ type: actionTypes.SET_EDGE_IMAGE, payload: null });
      dispatch({ type: actionTypes.SET_CONTOURS, payload: [] });
      dispatch({ type: actionTypes.SET_FOURIER_COEFFICIENTS, payload: [] });
    } else if (step === 'edges') {
      dispatch({ type: actionTypes.SET_CONTOURS, payload: [] });
      dispatch({ type: actionTypes.SET_FOURIER_COEFFICIENTS, payload: [] });
    } else if (step === 'contours') {
      dispatch({ type: actionTypes.SET_FOURIER_COEFFICIENTS, payload: [] });
    }
    
    // Reset drawing path
    dispatch({ type: actionTypes.RESET_DRAWING });
  }, [dispatch]);
  
  return { 
    canvasRef,
    processImage,
    resetToStep
  };
}

// Hook for animation controls
function useAnimationControls() {
  const { state, dispatch } = useFourier();
  const animationRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  
  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    dispatch({
      type: actionTypes.UPDATE_ANIMATION_STATE,
      payload: { isPlaying: !state.isPlaying }
    });
  }, [state.isPlaying, dispatch]);
  
  // Set playback speed
  const setPlaybackSpeed = useCallback((speed) => {
    dispatch({
      type: actionTypes.UPDATE_ANIMATION_STATE,
      payload: { speed }
    });
  }, [dispatch]);
  
  // Change contour
  const changeContour = useCallback((direction) => {
    const currentIndex = state.currentContourIndex;
    const count = state.fourierCoefficients.length;
    
    if (count === 0) return;
    
    let newIndex = (currentIndex + direction) % count;
    if (newIndex < 0) newIndex = count - 1;
    
    dispatch({
      type: actionTypes.UPDATE_ANIMATION_STATE,
      payload: { contourIndex: newIndex }
    });
    
    // Reset drawing
    dispatch({ type: actionTypes.RESET_DRAWING });
  }, [state.currentContourIndex, state.fourierCoefficients.length, dispatch]);
  
  // Reset drawing
  const resetDrawing = useCallback(() => {
    dispatch({ type: actionTypes.RESET_DRAWING });
  }, [dispatch]);
  
  // Animation loop for drawing
  useEffect(() => {
    if (!state.isPlaying || !drawingCanvasRef.current || state.fourierCoefficients.length === 0) {
      // Clear animation frame when not playing
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    // Get the current contour's coefficients
    const currentCoeffs = state.fourierCoefficients[state.currentContourIndex];
    if (!currentCoeffs) return;
    
    let time = 0;
    const canvasWidth = 400; // Default width
    const canvasHeight = 400; // Default height
    
    const animate = () => {
      time += 0.01 * state.animationSpeed;
      
      // Calculate the new position
      const pos = calculatePosition(currentCoeffs, time);
      
      // Update the drawing path
      const newPath = [...state.drawingPath, { 
        x: pos.x + canvasWidth/2, 
        y: pos.y + canvasHeight/2 
      }];
      
      // Limit path length to prevent performance issues
      const limitedPath = newPath.length > 2000 ? newPath.slice(-2000) : newPath;
      
      dispatch({ 
        type: actionTypes.UPDATE_DRAWING_PATH, 
        payload: limitedPath 
      });
      
      // Complete one cycle
      if (time >= 2 * Math.PI) {
        time = 0;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    state.isPlaying, 
    state.fourierCoefficients, 
    state.currentContourIndex, 
    state.animationSpeed,
    state.drawingPath,
    dispatch
  ]);
  
  // Function to calculate position from Fourier series at time t
  const calculatePosition = (coefficients, t) => {
    let x = 0;
    let y = 0;
    
    for (const coef of coefficients) {
      const { frequency, amplitude, phase } = coef;
      const angle = frequency * t + phase;
      
      x += amplitude * Math.cos(angle);
      y += amplitude * Math.sin(angle);
    }
    
    return { x, y };
  };
  
  // Drawing effect
  useEffect(() => {
    if (!drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw path
    if (state.drawingPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(state.drawingPath[0].x, state.drawingPath[0].y);
      
      for (let i = 1; i < state.drawingPath.length; i++) {
        ctx.lineTo(state.drawingPath[i].x, state.drawingPath[i].y);
      }
      
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw the epicycles if drawing is active
    if (state.isPlaying && state.fourierCoefficients.length > 0) {
      const currentCoeffs = state.fourierCoefficients[state.currentContourIndex];
      if (!currentCoeffs) return;
      
      let x = canvas.width / 2;
      let y = canvas.height / 2;
      
      // Draw each circle (limited to first few for performance)
      const maxCircles = Math.min(20, currentCoeffs.length);
      
      for (let i = 0; i < maxCircles; i++) {
        const coef = currentCoeffs[i];
        const { frequency, amplitude, phase } = coef;
        
        // Calculate current time based on the position of the last point in the path
        const time = state.drawingPath.length === 0 ? 0 : 
          Math.atan2(
            state.drawingPath[state.drawingPath.length - 1].y - canvas.height / 2,
            state.drawingPath[state.drawingPath.length - 1].x - canvas.width / 2
          ) / frequency - phase;
          
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
  }, [state.drawingPath, state.isPlaying, state.fourierCoefficients, state.currentContourIndex]);
  
  return {
    drawingCanvasRef,
    togglePlayback,
    setPlaybackSpeed,
    changeContour,
    resetDrawing
  };
}

// =============================================
// UI Components
// =============================================

// Help tooltip component
const HelpTooltip = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs focus:outline-none"
        aria-label="Help"
      >
        ?
      </button>
      
      {isOpen && (
        <div className="absolute z-10 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 p-2 bg-white rounded shadow-lg text-sm text-gray-800 border border-gray-200">
          {text}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
        </div>
      )}
    </div>
  );
};

// Parameter control component with help tooltip
const ParameterControl = ({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  helpText,
  unit = "" 
}) => {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {label}: {value}{unit}
          {helpText && (
            <span className="ml-2">
              <HelpTooltip text={helpText} />
            </span>
          )}
        </label>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
};

// Processing step component
const ProcessingStep = ({
  stepId,
  title,
  icon,
  isActive,
  isComplete,
  onActivate,
  onReset,
  children,
}) => {
  return (
    <div className={`mb-4 rounded-lg overflow-hidden border 
      ${isActive ? 'border-blue-500 shadow-md' : 'border-gray-200'}`}
    >
      <div 
        className={`p-3 flex items-center justify-between cursor-pointer
          ${isActive ? 'bg-blue-50' : isComplete ? 'bg-gray-50' : 'bg-white'}`}
        onClick={onActivate}
      >
        <div className="flex items-center">
          <span className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
            {icon}
          </span>
          <h3 className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
            {title}
          </h3>
        </div>
        
        <div className="flex items-center">
          {isComplete && !isActive && (
            <span className="text-green-500 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          
          {isComplete && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onReset(stepId); 
              }}
              className="p-1 text-xs text-gray-500 hover:text-red-500"
              title="Reset this step"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ml-1 transition-transform ${isActive ? 'transform rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {isActive && (
        <div className="p-4 bg-white border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

// Comparison slider component
const ComparisonSlider = ({ originalData, processedData, width, height }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Handle slider position change
  const updateSliderPosition = (clientX) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };
  
  // Mouse event handlers
  const handleMouseDown = (e) => {
    updateSliderPosition(e.clientX);
    
    const handleMouseMove = (e) => {
      updateSliderPosition(e.clientX);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Touch event handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    updateSliderPosition(touch.clientX);
    
    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      updateSliderPosition(touch.clientX);
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  // Draw comparison view
  useEffect(() => {
    if (!canvasRef.current || !originalData || !processedData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create temporary canvases for both images
    const originalCanvas = document.createElement('canvas');
    originalCanvas.width = originalData.width;
    originalCanvas.height = originalData.height;
    const originalCtx = originalCanvas.getContext('2d');
    originalCtx.putImageData(originalData, 0, 0);
    
    const processedCanvas = document.createElement('canvas');
    processedCanvas.width = processedData.width;
    processedCanvas.height = processedData.height;
    const processedCtx = processedCanvas.getContext('2d');
    processedCtx.putImageData(processedData, 0, 0);
    
    // Calculate the clip position
    const clipPosition = Math.floor((canvas.width * sliderPosition) / 100);
    
    // Draw original on the left side
    ctx.drawImage(
      originalCanvas,
      0, 0, clipPosition, canvas.height,
      0, 0, clipPosition, canvas.height
    );
    
    // Draw processed on the right side
    ctx.drawImage(
      processedCanvas,
      clipPosition, 0, canvas.width - clipPosition, canvas.height,
      clipPosition, 0, canvas.width - clipPosition, canvas.height
    );
    
    // Draw slider line
    ctx.beginPath();
    ctx.moveTo(clipPosition, 0);
    ctx.lineTo(clipPosition, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw slider handle
    ctx.beginPath();
    ctx.arc(clipPosition, canvas.height / 2, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw arrows inside the handle
    ctx.beginPath();
    ctx.moveTo(clipPosition - 5, canvas.height / 2);
    ctx.lineTo(clipPosition - 2, canvas.height / 2 - 3);
    ctx.lineTo(clipPosition - 2, canvas.height / 2 + 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(clipPosition + 5, canvas.height / 2);
    ctx.lineTo(clipPosition + 2, canvas.height / 2 - 3);
    ctx.lineTo(clipPosition + 2, canvas.height / 2 + 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();
    
    // Draw labels
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    
    ctx.fillText('Original', clipPosition / 2, 10);
    ctx.fillText('Processed', clipPosition + (canvas.width - clipPosition) / 2, 10);
    
    ctx.shadowBlur = 0;
    
  }, [originalData, processedData, sliderPosition]);
  
  return (
    <div 
      ref={containerRef}
      className="comparison-slider relative w-full max-w-md mx-auto overflow-hidden rounded-lg cursor-col-resize"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <canvas
        ref={canvasRef}
        width={width || 400}
        height={height || 400}
        className="w-full bg-gray-900"
      />
      
      <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs text-shadow">
        Drag the slider to compare
      </div>
    </div>
  );
};

// =============================================
// Main Component
// =============================================

// Fourier provider component
const FourierProvider = ({ children }) => {
  const [state, dispatch] = useReducer(fourierReducer, initialState);
  
  return (
    <FourierContext.Provider value={{ state, dispatch }}>
      {children}
    </FourierContext.Provider>
  );
};

// Main component
const ImageToFourierTransform = () => {
  return (
    <FourierProvider>
      <FourierTransformApp />
    </FourierProvider>
  );
};

// Main application component
const FourierTransformApp = () => {
  const { state, dispatch } = useFourier();
  const { loadImage, loadDemoImage } = useImageLoader();
  const { processImage, resetToStep } = useFourierProcessing();
  const { drawingCanvasRef, togglePlayback, setPlaybackSpeed, changeContour, resetDrawing } = useAnimationControls();
  
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      loadImage(file);
    }
  };
  
  // Update a parameter
  const handleParameterChange = (name, value) => {
    dispatch({
      type: actionTypes.UPDATE_PARAMETER,
      payload: { name, value }
    });
  };
  
  // Move to a specific step
  const activateStep = (step) => {
    dispatch({ type: actionTypes.SET_PROCESSING_STEP, payload: step });
  };
  
  // Check if a step is active
  const isStepActive = (step) => state.processingStep === step;
  
  // Check if a step is complete
  const isStepComplete = (step) => {
    if (step === 'upload') return !!state.originalImage;
    if (step === 'preprocess') return !!state.preprocessedImageData;
    if (step === 'edges') return !!state.edgeImageData;
    if (step === 'contours') return state.contours.length > 0;
    if (step === 'fourier') return state.fourierCoefficients.length > 0;
    return false;
  };
  
  // Render the upload step
  const renderUploadStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-4 border-2 border-dashed border-blue-300 rounded-lg text-center hover:bg-blue-50 transition duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-blue-600 font-medium">Upload Image</p>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF</p>
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
        
        <button
          onClick={() => loadDemoImage('geometric')}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-700 font-medium">Use Demo Image</p>
          <p className="text-xs text-gray-500 mt-1">Try with a pre-loaded image</p>
        </button>
      </div>
      
      {state.imageUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Selected image:</p>
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={state.imageUrl} 
              alt="Selected" 
              className="max-w-full mx-auto max-h-64 object-contain" 
            />
          </div>
          
          <button
            onClick={() => activateStep('preprocess')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
          >
            Continue to Processing
          </button>
        </div>
      )}
    </div>
  );
  
  // Render the preprocessing step
  const renderPreprocessStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Original Image</h4>
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <img 
              src={state.imageUrl} 
              alt="Original" 
              className="max-w-full mx-auto max-h-64 object-contain" 
            />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Processing Parameters</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <ParameterControl
              label="Blur Radius"
              value={state.params.blurRadius}
              min={0}
              max={10}
              step={1}
              onChange={(val) => handleParameterChange('blurRadius', val)}
              helpText="Applies Gaussian blur to reduce noise. Higher values create smoother edges but may lose detail."
            />
            
            <ParameterControl
              label="Contour Simplification"
              value={state.params.contourSimplification}
              min={1}
              max={20}
              step={1}
              onChange={(val) => handleParameterChange('contourSimplification', val)}
              helpText="Reduces the number of points in each contour. Higher values improve performance but may reduce accuracy."
            />
            
            <ParameterControl
              label="Fourier Terms"
              value={state.params.fourierTerms}
              min={10}
              max={200}
              step={10}
              onChange={(val) => handleParameterChange('fourierTerms', val)}
              helpText="Number of terms in the Fourier series. More terms means more detail but slower performance."
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-2">
        <button
          onClick={processImage}
          disabled={state.isProcessing}
          className={`px-4 py-2 rounded-lg text-white ${
            state.isProcessing ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {state.isProcessing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Process Image'
          )}
        </button>
      </div>
    </div>
  );
  
  // Render the edges step
  const renderEdgesStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        The image has been processed to extract edges using adaptive thresholding - no manual adjustment needed!
      </p>
      
      {state.preprocessedImageData && state.edgeImageData && (
        <ComparisonSlider
          originalData={state.preprocessedImageData}
          processedData={state.edgeImageData}
          width={400}
          height={400}
        />
      )}
      
      <div className="flex justify-center mt-2">
        <button
          onClick={() => activateStep('contours')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Continue to Contours
        </button>
      </div>
    </div>
  );
  
  // Render the contours step
  const renderContoursStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        {state.contours.length} contours have been extracted from the image edges.
      </p>
      
      {state.edgeImageData && (
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <canvas
            width={state.edgeImageData.width}
            height={state.edgeImageData.height}
            className="max-w-full mx-auto"
            ref={(canvas) => {
              if (canvas && state.edgeImageData) {
                const ctx = canvas.getContext('2d');
                ctx.putImageData(state.edgeImageData, 0, 0);
                
                // Draw contours on top
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                
                state.contours.forEach(contour => {
                  ctx.beginPath();
                  contour.forEach((point, i) => {
                    if (i === 0) {
                      ctx.moveTo(point.x, point.y);
                    } else {
                      ctx.lineTo(point.x, point.y);
                    }
                  });
                  ctx.stroke();
                });
              }
            }}
          />
        </div>
      )}
      
      <div className="flex justify-center mt-2">
        <button
          onClick={() => activateStep('fourier')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Continue to Fourier Drawing
        </button>
      </div>
    </div>
  );
  
  // Render the Fourier animation step
  const renderFourierStep = () => (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <canvas
          ref={drawingCanvasRef}
          width={400}
          height={400}
          className="border rounded-lg bg-gray-50"
        />
        
        <div className="flex items-center justify-between w-full mt-4">
          <button
            onClick={resetDrawing}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeContour(-1)}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300"
              disabled={state.fourierCoefficients.length <= 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <span className="text-sm">
              Contour {state.currentContourIndex + 1}/{state.fourierCoefficients.length}
            </span>
            
            <button
              onClick={() => changeContour(1)}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300"
              disabled={state.fourierCoefficients.length <= 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={togglePlayback}
            className={`px-3 py-1 rounded text-white ${
              state.isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {state.isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
        
        <div className="w-full mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Speed:</span>
            <span className="text-sm font-medium">{state.animationSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={state.animationSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">How It Works</h4>
        <p className="text-sm text-blue-900">
          The image contours are transformed into a sum of rotating circles (epicycles) using Fourier transforms. 
          Each epicycle rotates at a different frequency and together they trace the original shape.
        </p>
        
        <div className="mt-2 text-xs text-blue-800">
          <div>• Total Circles: {state.fourierCoefficients[state.currentContourIndex]?.length || 0}</div>
          <div>• Displayed Epicycles: {Math.min(20, state.fourierCoefficients[state.currentContourIndex]?.length || 0)}</div>
          <div>• Drawing Points: {state.drawingPath.length}</div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Image to Fourier Transform Drawing</h1>
      
      {/* Processing Steps */}
      <ProcessingStep
        stepId="upload"
        title="Upload Image"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        }
        isActive={isStepActive('upload')}
        isComplete={isStepComplete('upload')}
        onActivate={() => activateStep('upload')}
        onReset={resetToStep}
      >
        {renderUploadStep()}
      </ProcessingStep>
      
      <ProcessingStep
        stepId="preprocess"
        title="Image Processing"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        }
        isActive={isStepActive('preprocess')}
        isComplete={isStepComplete('preprocess')}
        onActivate={() => state.originalImage && activateStep('preprocess')}
        onReset={resetToStep}
      >
        {renderPreprocessStep()}
      </ProcessingStep>
      
      <ProcessingStep
        stepId="edges"
        title="Edge Detection"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        }
        isActive={isStepActive('edges')}
        isComplete={isStepComplete('edges')}
        onActivate={() => state.preprocessedImageData && activateStep('edges')}
        onReset={resetToStep}
      >
        {renderEdgesStep()}
      </ProcessingStep>
      
      <ProcessingStep
        stepId="contours"
        title="Contour Extraction"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a1 1 0 10-2 0 8 8 0 0016 0 1 1 0 10-2 0 5.986 5.986 0 00-.454 2.916A5 5 0 008 11z" clipRule="evenodd" />
          </svg>
        }
        isActive={isStepActive('contours')}
        isComplete={isStepComplete('contours')}
        onActivate={() => state.edgeImageData && activateStep('contours')}
        onReset={resetToStep}
      >
        {renderContoursStep()}
      </ProcessingStep>
      
      <ProcessingStep
        stepId="fourier"
        title="Fourier Drawing"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
        }
        isActive={isStepActive('fourier')}
        isComplete={isStepComplete('fourier')}
        onActivate={() => state.contours.length > 0 && activateStep('fourier')}
        onReset={resetToStep}
      >
        {renderFourierStep()}
      </ProcessingStep>
      
      {/* Explanation */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg text-sm border border-gray-200">
        <h2 className="font-semibold mb-2">How This Works</h2>
        <p className="mb-3">
          This application converts images to animated line drawings using Fourier transforms - a mathematical technique that breaks down complex signals into simpler components.
        </p>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>The image is processed to find edges and contours</li>
          <li>Each contour is converted to a Fourier series (rotating circles)</li>
          <li>The epicycles (rotating circles) trace the drawing automatically</li>
        </ol>
        <p className="mt-3 text-gray-600">
          This demonstrates the powerful concept behind all signal processing - complex patterns can be broken down into simpler circular motions.
        </p>
      </div>
    </div>
  );
};

export default ImageToFourierTransform;