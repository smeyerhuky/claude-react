import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

const ImageToFourierTransform = () => {
  // Canvas references
  const imageCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  
  // File and image state
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  
  // Processing parameters
  const [thresholdValue, setThresholdValue] = useState(128);
  const [blurRadius, setBlurRadius] = useState(2);
  const [contourSimplification, setContourSimplification] = useState(5);
  const [fourierTerms, setFourierTerms] = useState(50);
  
  // Animation state
  const [contours, setContours] = useState([]);
  const [fourierCoefficients, setFourierCoefficients] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [drawingPath, setDrawingPath] = useState([]);
  const [currentContourIndex, setCurrentContourIndex] = useState(0);
  
  // Setup animation loop
  const animationFrameRef = useRef(null);
  
  // Canvas dimensions
  const canvasWidth = 400;
  const canvasHeight = 400;
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.match('image.*')) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);
      
      // Reset state when a new image is selected
      setContours([]);
      setFourierCoefficients([]);
      setDrawingPath([]);
      setIsPlaying(false);
      setTime(0);
    } else {
      alert('Please select an image file');
    }
  };
  
  // Draw the original image to canvas when loaded
  useEffect(() => {
    if (!imageUrl || !imageCanvasRef.current) return;
    
    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scaling to fit canvas while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      // Draw image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    };
    
    img.src = imageUrl;
  }, [imageUrl]);
  
  // Process the image to extract contours
  const processImage = async () => {
    if (!imageCanvasRef.current || !processedCanvasRef.current) return;
    
    setIsProcessing(true);
    setProcessingStep('Preparing image...');
    
    // Get image data from canvas
    const imageCanvas = imageCanvasRef.current;
    const imageCtx = imageCanvas.getContext('2d');
    const imageData = imageCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
    
    // Create a worker or use setTimeout to avoid UI freezing
    setTimeout(() => {
      // Step 1: Convert to grayscale and apply blur
      setProcessingStep('Converting to grayscale...');
      const grayscaleData = convertToGrayscale(imageData);
      
      setProcessingStep('Applying Gaussian blur...');
      const blurredData = applyGaussianBlur(grayscaleData, blurRadius);
      
      // Step 2: Apply threshold
      setProcessingStep('Applying threshold...');
      const thresholdedData = applyThreshold(blurredData, thresholdValue);
      
      // Step 3: Find edges
      setProcessingStep('Finding edges...');
      const edgeData = findEdges(thresholdedData);
      
      // Draw processed image
      const processedCanvas = processedCanvasRef.current;
      const processedCtx = processedCanvas.getContext('2d');
      processedCtx.putImageData(edgeData, 0, 0);
      
      // Step 4: Extract contours
      setProcessingStep('Extracting contours...');
      const extractedContours = extractContours(edgeData);
      
      // Step 5: Simplify contours
      setProcessingStep('Simplifying contours...');
      const simplifiedContours = simplifyContours(extractedContours, contourSimplification);
      setContours(simplifiedContours);
      
      // Step 6: Calculate Fourier coefficients
      setProcessingStep('Calculating Fourier coefficients...');
      const allCoefficients = [];
      
      for (const contour of simplifiedContours) {
        const coeffs = calculateFourierCoefficients(contour, fourierTerms);
        allCoefficients.push(coeffs);
      }
      
      setFourierCoefficients(allCoefficients);
      setIsProcessing(false);
      setProcessingStep('');
    }, 100);
  };
  
  // Image processing functions
  
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
    // Simple box blur as an approximation for this demo
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
  
  // Apply threshold to create binary image
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
  
  // Simple edge detection
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
  
  // Extract contours from the edge image
  const extractContours = (edgeData) => {
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
    
    return contours;
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
  
  // Calculate position from Fourier series at time t
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
  
  // Animation loop for drawing the contour using Fourier series
  useEffect(() => {
    if (!isPlaying || !drawingCanvasRef.current || fourierCoefficients.length === 0) return;
    
    // Get the current contour's coefficients
    const currentCoeffs = fourierCoefficients[currentContourIndex];
    if (!currentCoeffs) return;
    
    const animate = () => {
      setTime(prevTime => {
        const newTime = prevTime + 0.01 * speed;
        
        // Calculate the new position
        const pos = calculatePosition(currentCoeffs, newTime);
        
        // Update the drawing path
        setDrawingPath(prevPath => {
          const newPath = [...prevPath, { 
            x: pos.x + canvasWidth/2, 
            y: pos.y + canvasHeight/2 
          }];
          
          // Limit path length to prevent performance issues
          if (newPath.length > 2000) {
            return newPath.slice(-2000);
          }
          
          return newPath;
        });
        
        // Complete one cycle
        if (newTime >= 2 * Math.PI) {
          return 0;
        }
        
        return newTime;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, fourierCoefficients, currentContourIndex, speed]);
  
  // Draw the path on the canvas
  useEffect(() => {
    if (!drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw path
    if (drawingPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(drawingPath[0].x, drawingPath[0].y);
      
      for (let i = 1; i < drawingPath.length; i++) {
        ctx.lineTo(drawingPath[i].x, drawingPath[i].y);
      }
      
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw the epicycles if time > 0
    if (time > 0 && fourierCoefficients.length > 0) {
      const currentCoeffs = fourierCoefficients[currentContourIndex];
      if (!currentCoeffs) return;
      
      let x = canvasWidth/2;
      let y = canvasHeight/2;
      
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
  }, [time, drawingPath, fourierCoefficients, currentContourIndex]);
  
  // Reset the drawing
  const resetDrawing = () => {
    setDrawingPath([]);
    setTime(0);
  };
  
  // Change the current contour
  const changeContour = (direction) => {
    setCurrentContourIndex(prev => {
      let newIndex = prev + direction;
      if (newIndex < 0) newIndex = fourierCoefficients.length - 1;
      if (newIndex >= fourierCoefficients.length) newIndex = 0;
      return newIndex;
    });
    resetDrawing();
  };
  
  return (
    <div className="flex flex-col p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Image to Fourier Transform Drawing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side - Image Input and Controls */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Input Image</h2>
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="border rounded overflow-hidden bg-gray-100">
              <canvas
                ref={imageCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-w-full mx-auto"
              />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Contour Extraction Settings</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Threshold: {thresholdValue}</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Blur Radius: {blurRadius}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contour Simplification: {contourSimplification}</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={contourSimplification}
                  onChange={(e) => setContourSimplification(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Fourier Terms: {fourierTerms}</label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={fourierTerms}
                  onChange={(e) => setFourierTerms(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <button
                onClick={processImage}
                disabled={!imageUrl || isProcessing}
                className={`w-full py-2 rounded ${
                  !imageUrl || isProcessing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isProcessing ? processingStep : 'Process Image'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Processed Image and Drawing */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Processed Image (Edges)</h2>
            <div className="border rounded overflow-hidden bg-gray-100">
              <canvas
                ref={processedCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-w-full mx-auto"
              />
            </div>
            
            {contours.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {contours.length} contours extracted
              </div>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Fourier Drawing</h2>
            <div className="border rounded overflow-hidden bg-gray-100">
              <canvas
                ref={drawingCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-w-full mx-auto"
              />
            </div>
            
            {fourierCoefficients.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`px-4 py-2 rounded ${
                        isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                      }`}
                    >
                      {isPlaying ? 'Pause' : 'Draw'}
                    </button>
                    
                    <button
                      onClick={resetDrawing}
                      className="px-4 py-2 bg-gray-200 rounded"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => changeContour(-1)}
                      className="px-2 py-1 bg-gray-200 rounded"
                      disabled={fourierCoefficients.length <= 1}
                    >
                      ←
                    </button>
                    
                    <span className="text-sm">
                      Contour {currentContourIndex + 1}/{fourierCoefficients.length}
                    </span>
                    
                    <button
                      onClick={() => changeContour(1)}
                      className="px-2 py-1 bg-gray-200 rounded"
                      disabled={fourierCoefficients.length <= 1}
                    >
                      →
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Speed:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="flex-grow"
                  />
                  <span className="text-sm">{speed.toFixed(1)}x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm">
        <h2 className="font-semibold mb-2">How It Works</h2>
        <p className="mb-3">
          This tool converts images to line drawings using Fourier transforms. The process works in several steps:
        </p>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>The image is converted to grayscale and blurred to reduce noise</li>
          <li>A threshold is applied to create a black and white image</li>
          <li>Edge detection finds the outlines in the image</li>
          <li>Contours are extracted by tracing the edges</li>
          <li>Each contour is simplified and converted to a Fourier series</li>
          <li>The Fourier coefficients control rotating circles (epicycles) that trace the drawing</li>
        </ol>
        <p className="mt-3">
          You can adjust the parameters to optimize for different images. More Fourier terms produces a more accurate drawing but runs slower.
        </p>
      </div>
    </div>
  );
};

export default ImageToFourierTransform;