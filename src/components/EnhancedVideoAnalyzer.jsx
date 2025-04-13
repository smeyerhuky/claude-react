import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as math from 'mathjs';
import { Settings, ChevronDown, ChevronUp, Play, Pause, Camera, Upload, Link, Grid3X3, Eye, ChevronRight } from 'lucide-react';

const EnhancedVideoAnalyzer = () => {
  // Refs for video and canvas elements
  const videoRef = useRef(null);
  const mainCanvasRef = useRef(null);
  const fftCanvasRef = useRef(null);
  const motionCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  
  // Core state
  const [videoSource, setVideoSource] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [useFallbackAnimation, setUseFallbackAnimation] = useState(false);
  const [fallbackStyle, setFallbackStyle] = useState('matrix');
  
  // UI state
  const [activePanel, setActivePanel] = useState('source');
  const [compactMode, setCompactMode] = useState(false);
  const [activeVisualization, setActiveVisualization] = useState('transform');
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  
  // Matrix transformation parameters
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [shearX, setShearX] = useState(0);
  const [shearY, setShearY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  
  // FFT analysis parameters
  const [fftEnabled, setFftEnabled] = useState(false);
  const [fftResolution, setFftResolution] = useState(256);
  const [fftLogScale, setFftLogScale] = useState(true);
  const [fftColormap, setFftColormap] = useState('viridis');
  
  // Motion analysis parameters
  const [motionAnalysisEnabled, setMotionAnalysisEnabled] = useState(false);
  const [motionSensitivity, setMotionSensitivity] = useState(5);
  const [motionThreshold, setMotionThreshold] = useState(25);
  const [motionTrailLength, setMotionTrailLength] = useState(10);
  const [motionVectors, setMotionVectors] = useState([]);
  
  // Bandpass motion amplification
  const [bandpassEnabled, setBandpassEnabled] = useState(false);
  const [lowFrequency, setLowFrequency] = useState(0.1);
  const [highFrequency, setHighFrequency] = useState(2.0);
  const [amplificationFactor, setAmplificationFactor] = useState(10);
  const [roiActive, setRoiActive] = useState(false);
  const [roi, setRoi] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // 3D visualization settings
  const [use3D, setUse3D] = useState(false);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
  const [elevation, setElevation] = useState(45);
  
  // Frame buffer for temporal processing
  const [frameBuffer, setFrameBuffer] = useState([]);
  const maxBufferLength = 30; // Store last 30 frames for analysis
  
  // Video dimensions and metadata
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 360 });
  const [frameRate, setFrameRate] = useState(30);
  
  // Computed FFT data
  const [fftData, setFftData] = useState(null);
  
  // =========================
  // Core video handling logic
  // =========================
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSource(url);
      setUseWebcam(false);
      setUseFallbackAnimation(false);
    }
  };
  
  // Handle URL input
  const handleUrlInput = (e) => {
    setVideoSource(e.target.value);
    setUseWebcam(false);
    setUseFallbackAnimation(false);
  };
  
  // Toggle webcam
  const toggleWebcam = async () => {
    if (!useWebcam) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setUseWebcam(true);
          setVideoSource('');
          setUseFallbackAnimation(false);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setUseWebcam(false);
    }
  };
  
  // Toggle fallback animation
  const toggleFallbackAnimation = () => {
    setUseFallbackAnimation(!useFallbackAnimation);
    if (!isPlaying) setIsPlaying(true);
    setUseWebcam(false);
    setVideoSource('');
  };
  
  // Generate SVG fallback animation frame
  const generateSvgFrame = (width, height, style) => {
    // This function is the same as before but abbreviated
    const colors = ['#00ff00', '#008800', '#004400', '#002200', '#88ff88'];
    let svgContent = '';
    
    // Matrix-style falling characters
    if (style === 'matrix') {
      const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      const cols = Math.floor(width / 20);
      const rows = Math.floor(height / 20);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (Math.random() > 0.7) {
            const char = characters.charAt(Math.floor(Math.random() * characters.length));
            const x = i * 20 + Math.random() * 5;
            const y = j * 20 + Math.random() * 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const fontSize = 10 + Math.floor(Math.random() * 10);
            const opacity = 0.3 + Math.random() * 0.7;
            
            svgContent += `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" opacity="${opacity}">${char}</text>`;
          }
        }
      }
    }
    // Add other styles as needed...
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: black;">
      ${svgContent}
    </svg>`;
  };
  
  // =========================
  // Analysis Functions
  // =========================
  
  // Perform FFT analysis on a frame
  const performFFT = (imageData, width, height) => {
    // Create a grayscale array from the image data
    const grayscaleData = new Float32Array(width * height);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4;
        // Convert RGB to grayscale using standard weights
        grayscaleData[i * width + j] = 
          0.299 * imageData.data[idx] + 
          0.587 * imageData.data[idx + 1] + 
          0.114 * imageData.data[idx + 2];
      }
    }
    
    // Create 2D matrix from grayscale data
    const matrix = [];
    for (let i = 0; i < height; i++) {
      const row = [];
      for (let j = 0; j < width; j++) {
        row.push(grayscaleData[i * width + j]);
      }
      matrix.push(row);
    }
    
    // Perform 2D FFT using mathjs
    const fftResult = math.fft(matrix);
    
    // Extract magnitude (absolute value) of complex numbers
    const magnitudes = fftResult.map(row => 
      row.map(val => math.abs(val))
    );
    
    // Shift zero frequency to center
    const shifted = fftShift(magnitudes);
    
    // Apply log scale if enabled
    const scaled = fftLogScale 
      ? shifted.map(row => row.map(val => val > 0 ? Math.log(val + 1) : 0))
      : shifted;
    
    return scaled;
  };
  
  // Helper function to shift zero frequency to center
  const fftShift = (matrix) => {
    const height = matrix.length;
    const width = matrix[0].length;
    const shifted = Array(height).fill().map(() => Array(width).fill(0));
    
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const newI = (i + Math.floor(height / 2)) % height;
        const newJ = (j + Math.floor(width / 2)) % width;
        shifted[newI][newJ] = matrix[i][j];
      }
    }
    
    return shifted;
  };
  
  // Render FFT visualization
  const renderFFT = (fftData, canvas) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Find max value for normalization
    let maxVal = 0;
    for (let i = 0; i < fftData.length; i++) {
      for (let j = 0; j < fftData[i].length; j++) {
        maxVal = Math.max(maxVal, fftData[i][j]);
      }
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Scale FFT data to fit canvas
    const scaleX = width / fftData[0].length;
    const scaleY = height / fftData.length;
    
    // Render as heatmap
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const fftX = Math.min(Math.floor(x / scaleX), fftData[0].length - 1);
        const fftY = Math.min(Math.floor(y / scaleY), fftData.length - 1);
        
        const normalizedValue = fftData[fftY][fftX] / maxVal;
        
        // Apply colormap (simple rainbow gradient)
        const idx = (y * width + x) * 4;
        
        // Simple viridis-like colormap
        if (fftColormap === 'viridis') {
          imageData.data[idx] = Math.floor(normalizedValue * 255); // Red
          imageData.data[idx + 1] = Math.floor(Math.sin(normalizedValue * Math.PI) * 255); // Green
          imageData.data[idx + 2] = Math.floor((1 - normalizedValue) * 255); // Blue
          imageData.data[idx + 3] = 255; // Alpha
        } else {
          // Grayscale
          const val = Math.floor(normalizedValue * 255);
          imageData.data[idx] = val;
          imageData.data[idx + 1] = val;
          imageData.data[idx + 2] = val;
          imageData.data[idx + 3] = 255;
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add labels and markers
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('Frequency Domain', 10, 20);
    ctx.fillText('DC', width/2, height/2 + 15);
    
    // Draw crosshair at DC component
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
  };
  
  // Detect and analyze motion between frames
  const analyzeMotion = (currentFrame, previousFrame, width, height) => {
    if (!previousFrame) return [];
    
    const blockSize = motionSensitivity * 2; // Size of blocks to analyze
    const vectors = [];
    
    // Process blocks to detect motion
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // Simple block matching (sum of absolute differences)
        let bestMatchX = 0;
        let bestMatchY = 0;
        let minDifference = Number.MAX_VALUE;
        
        // Search in a small neighborhood
        const searchRange = motionSensitivity;
        for (let dy = -searchRange; dy <= searchRange; dy++) {
          for (let dx = -searchRange; dx <= searchRange; dx++) {
            let totalDiff = 0;
            let samplesCompared = 0;
            
            // Compare current block with shifted block in previous frame
            for (let by = 0; by < blockSize && y + by < height; by += 2) {
              for (let bx = 0; bx < blockSize && x + bx < width; bx += 2) {
                const cy = y + by;
                const cx = x + bx;
                const py = y + by + dy;
                const px = x + bx + dx;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                  const currentIdx = (cy * width + cx) * 4;
                  const previousIdx = (py * width + px) * 4;
                  
                  // Sum differences across all channels
                  for (let c = 0; c < 3; c++) {
                    totalDiff += Math.abs(
                      currentFrame.data[currentIdx + c] - 
                      previousFrame.data[previousIdx + c]
                    );
                  }
                  samplesCompared++;
                }
              }
            }
            
            // Average difference
            if (samplesCompared > 0) {
              const avgDiff = totalDiff / samplesCompared;
              if (avgDiff < minDifference) {
                minDifference = avgDiff;
                bestMatchX = dx;
                bestMatchY = dy;
              }
            }
          }
        }
        
        // Only keep vectors with significant motion
        if (minDifference > motionThreshold) {
          vectors.push({
            x: x + blockSize/2,
            y: y + blockSize/2,
            dx: bestMatchX,
            dy: bestMatchY,
            magnitude: Math.sqrt(bestMatchX*bestMatchX + bestMatchY*bestMatchY)
          });
        }
      }
    }
    
    return vectors;
  };
  
  // Render motion vectors
  const renderMotionVectors = (vectors, canvas) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with semi-transparent black
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Find max magnitude for normalization
    const maxMagnitude = vectors.reduce((max, v) => Math.max(max, v.magnitude), 1);
    
    // Draw vectors
    vectors.forEach(v => {
      const normalizedMagnitude = v.magnitude / maxMagnitude;
      
      // Skip very small motions
      if (normalizedMagnitude < 0.1) return;
      
      // Color based on direction and magnitude
      const hue = (Math.atan2(v.dy, v.dx) * 180 / Math.PI + 180) % 360;
      const saturation = 100;
      const lightness = 50 + normalizedMagnitude * 50; // Brighter for stronger motion
      
      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.lineWidth = 1 + normalizedMagnitude * 2;
      
      // Draw arrow
      const arrowLength = 5 + normalizedMagnitude * 15;
      const endX = v.x + v.dx * arrowLength;
      const endY = v.y + v.dy * arrowLength;
      
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(endX, endY);
      
      // Arrow head
      const headLength = 5 + normalizedMagnitude * 3;
      const angle = Math.atan2(v.dy, v.dx);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI/6),
        endY - headLength * Math.sin(angle - Math.PI/6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI/6),
        endY - headLength * Math.sin(angle + Math.PI/6)
      );
      
      ctx.stroke();
    });
    
    // Add visualization labels
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('Motion Analysis', 10, 20);
    
    // Calculate motion statistics
    if (vectors.length > 0) {
      // Average magnitude
      const avgMagnitude = vectors.reduce((sum, v) => sum + v.magnitude, 0) / vectors.length;
      
      // Dominant direction
      let dirX = vectors.reduce((sum, v) => sum + v.dx, 0);
      let dirY = vectors.reduce((sum, v) => sum + v.dy, 0);
      const dirMag = Math.sqrt(dirX*dirX + dirY*dirY);
      if (dirMag > 0) {
        dirX /= dirMag;
        dirY /= dirMag;
      }
      const dirAngle = Math.atan2(dirY, dirX) * 180 / Math.PI;
      
      // Display statistics
      ctx.fillText(`Vectors: ${vectors.length}`, 10, height - 60);
      ctx.fillText(`Avg Magnitude: ${avgMagnitude.toFixed(2)}`, 10, height - 40);
      ctx.fillText(`Direction: ${dirAngle.toFixed(1)}°`, 10, height - 20);
    }
  };
  
  // Bandpass filter implementation
  const applyBandpassFilter = (frameBuffer, roi) => {
    if (frameBuffer.length < 3) return null;
    
    // Extract region of interest if specified
    const useRoi = roi.width > 0 && roi.height > 0;
    const width = useRoi ? roi.width : frameBuffer[0].width;
    const height = useRoi ? roi.height : frameBuffer[0].height;
    
    // Create output frame
    const output = new ImageData(width, height);
    
    // Apply temporal bandpass filter for each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelTimeSeries = [];
        
        // Extract pixel values across frames
        for (let f = 0; f < frameBuffer.length; f++) {
          const frame = frameBuffer[f];
          const sourceX = useRoi ? roi.x + x : x;
          const sourceY = useRoi ? roi.y + y : y;
          const idx = (sourceY * frame.width + sourceX) * 4;
          
          // Get grayscale value
          pixelTimeSeries.push(
            0.299 * frame.data[idx] + 
            0.587 * frame.data[idx + 1] + 
            0.114 * frame.data[idx + 2]
          );
        }
        
        // Apply bandpass filter
        const filtered = bandpassFilter(pixelTimeSeries, lowFrequency, highFrequency, frameRate);
        
        // Amplify and add to latest frame
        const latestFrame = frameBuffer[frameBuffer.length - 1];
        const sourceX = useRoi ? roi.x + x : x;
        const sourceY = useRoi ? roi.y + y : y;
        const sourceIdx = (sourceY * latestFrame.width + sourceX) * 4;
        const targetIdx = (y * width + x) * 4;
        
        // Amplify filtered signal
        const amplifiedDelta = filtered[filtered.length - 1] * amplificationFactor;
        
        // Apply to RGB channels
        for (let c = 0; c < 3; c++) {
          let value = latestFrame.data[sourceIdx + c] + amplifiedDelta;
          output.data[targetIdx + c] = Math.max(0, Math.min(255, value));
        }
        
        // Alpha channel remains unchanged
        output.data[targetIdx + 3] = latestFrame.data[sourceIdx + 3];
      }
    }
    
    return output;
  };
  
  // Simple bandpass filter implementation
  const bandpassFilter = (timeSeries, lowFreq, highFreq, sampleRate) => {
    // For simplicity, we'll use a basic FIR filter
    // In a real implementation, this would be more sophisticated
    
    if (timeSeries.length < 3) return timeSeries;
    
    const filtered = [...timeSeries];
    const dt = 1 / sampleRate;
    
    // Simple high-pass (remove DC and low frequencies)
    for (let i = 2; i < timeSeries.length; i++) {
      filtered[i] = 0.95 * filtered[i-1] + 0.95 * (timeSeries[i] - timeSeries[i-1]);
    }
    
    // Simple low-pass (remove high frequencies)
    for (let i = 2; i < filtered.length; i++) {
      filtered[i] = 0.15 * filtered[i] + 0.3 * filtered[i-1] + 0.15 * filtered[i-2];
    }
    
    return filtered;
  };
  
  // Apply matrix transformation
  const applyMatrixTransformation = (inputCtx, outputCtx, width, height) => {
    const imageData = inputCtx.getImageData(0, 0, width, height);
    const outputImageData = outputCtx.createImageData(width, height);
    
    // Create transformation matrix
    const rotationRad = (rotationDeg * Math.PI) / 180;
    
    const matrix = math.matrix([
      [scaleX * Math.cos(rotationRad), -Math.sin(rotationRad) + shearX, translateX],
      [Math.sin(rotationRad) + shearY, scaleY * Math.cos(rotationRad), translateY],
      [0, 0, 1]
    ]);
    
    const matrixArray = math.squeeze(matrix).toArray();
    
    // Apply the transformation to each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Apply transformation matrix to current coordinates
        const sourceCoords = math.multiply(
          matrixArray,
          [x, y, 1]
        );
        
        const sourceX = Math.round(sourceCoords[0]);
        const sourceY = Math.round(sourceCoords[1]);
        
        // Check if the source coordinates are within the image boundaries
        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const sourceIndex = (sourceY * width + sourceX) * 4;
          const targetIndex = (y * width + x) * 4;
          
          // Copy the pixel from source to target
          outputImageData.data[targetIndex] = imageData.data[sourceIndex];       // R
          outputImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1]; // G
          outputImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2]; // B
          outputImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3]; // A
        }
      }
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
  };
  
  // Main processing loop for video frames
  useEffect(() => {
    let animationFrameId;
    let lastFrameTime = 0;
    
    const processFrame = (timestamp) => {
      // Calculate frame rate
      if (lastFrameTime > 0) {
        const delta = timestamp - lastFrameTime;
        if (delta > 0) {
          // Smooth frame rate calculation
          setFrameRate(prev => 0.9 * prev + 0.1 * (1000 / delta));
        }
      }
      lastFrameTime = timestamp;
      
      // Skip processing if paused
      if (!isPlaying) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }
      
      // Get current frame
      const mainCanvas = mainCanvasRef.current;
      const mainCtx = mainCanvas.getContext('2d');
      let currentFrame = null;
      
      // Draw current frame from video or fallback
      if (videoRef.current && 
          (videoRef.current.readyState >= 2 || useWebcam) && 
          !useFallbackAnimation) {
        // Get frame from video
        const video = videoRef.current;
        mainCanvas.width = video.videoWidth;
        mainCanvas.height = video.videoHeight;
        
        mainCtx.drawImage(video, 0, 0, mainCanvas.width, mainCanvas.height);
        currentFrame = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
        
        // Update video dimensions
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight
        });
      } 
      else if (useFallbackAnimation) {
        // Use fallback SVG animation
        const width = mainCanvas.width || 640;
        const height = mainCanvas.height || 360;
        
        // Generate SVG frame
        const svgString = generateSvgFrame(width, height, fallbackStyle);
        
        // Draw SVG to canvas
        const img = new Image();
        img.onload = () => {
          mainCtx.clearRect(0, 0, width, height);
          mainCtx.drawImage(img, 0, 0, width, height);
          
          // Process SVG frame as we would a video frame
          currentFrame = mainCtx.getImageData(0, 0, width, height);
          processCurrentFrame(currentFrame, width, height);
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      }
      
      // If we have a valid frame, process it
      if (currentFrame) {
        processCurrentFrame(currentFrame, mainCanvas.width, mainCanvas.height);
      }
      
      animationFrameId = requestAnimationFrame(processFrame);
    };
    
    // Process the current frame with all enabled visualizations
    const processCurrentFrame = (frame, width, height) => {
      // Add frame to buffer for temporal processing
      setFrameBuffer(prev => {
        const newBuffer = [...prev, frame];
        if (newBuffer.length > maxBufferLength) {
          return newBuffer.slice(1);
        }
        return newBuffer;
      });
      
      // Process each enabled visualization
      if (activeVisualization === 'transform') {
        if (outputCanvasRef.current) {
          const canvas = outputCanvasRef.current;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Create a temporary canvas for source frame
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.putImageData(frame, 0, 0);
          
          // Apply matrix transformation
          applyMatrixTransformation(tempCtx, ctx, width, height);
        }
      }
      
      if (fftEnabled && fftCanvasRef.current) {
        const canvas = fftCanvasRef.current;
        canvas.width = width;
        canvas.height = height;
        
        // Compute FFT
        const fftResult = performFFT(frame, width, height);
        setFftData(fftResult);
        
        // Render FFT visualization
        renderFFT(fftResult, canvas);
      }
      
      if (motionAnalysisEnabled && motionCanvasRef.current && frameBuffer.length > 1) {
        const canvas = motionCanvasRef.current;
        canvas.width = width;
        canvas.height = height;
        
        // Analyze motion between current and previous frame
        const previousFrame = frameBuffer[frameBuffer.length - 2];
        const vectors = analyzeMotion(frame, previousFrame, width, height);
        
        // Update motion vectors state
        setMotionVectors(vectors);
        
        // Render motion vectors
        renderMotionVectors(vectors, canvas);
      }
      
      if (bandpassEnabled && outputCanvasRef.current && frameBuffer.length > 5) {
        const canvas = outputCanvasRef.current;
        canvas.width = width;
        canvas.height = height;
        
        // Apply bandpass motion amplification
        const amplifiedFrame = applyBandpassFilter(frameBuffer, roi);
        
        if (amplifiedFrame) {
          // Display the amplified frame
          const ctx = canvas.getContext('2d');
          ctx.putImageData(amplifiedFrame, 0, 0);
          
          // Highlight ROI if active
          if (roiActive && roi.width > 0 && roi.height > 0) {
            ctx.strokeStyle = 'rgba(255,255,0,0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
          }
        }
      }
    };
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(processFrame);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isPlaying,
    useWebcam,
    useFallbackAnimation,
    fallbackStyle,
    activeVisualization,
    frameBuffer,
    fftEnabled,
    fftResolution,
    fftLogScale,
    fftColormap,
    motionAnalysisEnabled,
    motionSensitivity,
    motionThreshold,
    bandpassEnabled,
    lowFrequency,
    highFrequency,
    amplificationFactor,
    roi,
    roiActive,
    scaleX,
    scaleY,
    rotationDeg,
    shearX,
    shearY,
    translateX,
    translateY,
    use3D,
    rotationX,
    rotationY,
    rotationZ,
    elevation
  ]);
  
  // Handle ROI selection
  const handleCanvasClick = (e) => {
    if (!roiActive || !outputCanvasRef.current) return;
    
    const canvas = outputCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Adjust for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Set ROI start point
    setRoi(prev => ({
      x: x * scaleX,
      y: y * scaleY,
      width: 0,
      height: 0,
      startX: x * scaleX,
      startY: y * scaleY
    }));
    
    // Add mouse move and up handlers
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e) => {
    if (!roiActive || !outputCanvasRef.current) return;
    
    const canvas = outputCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Adjust for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Update ROI dimensions
    setRoi(prev => {
      const currentX = x * scaleX;
      const currentY = y * scaleY;
      
      const width = Math.abs(currentX - prev.startX);
      const height = Math.abs(currentY - prev.startY);
      const newX = Math.min(currentX, prev.startX);
      const newY = Math.min(currentY, prev.startY);
      
      return {
        x: newX,
        y: newY,
        width,
        height,
        startX: prev.startX,
        startY: prev.startY
      };
    });
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };
  
  // =============================
  // UI Components
  // =============================
  
  // Panel component for collapsible sections
  const Panel = ({ title, active, onToggle, children }) => {
    return (
      <div className="mb-2 border rounded-lg overflow-hidden">
        <div 
          className="flex items-center justify-between p-3 bg-gray-100 cursor-pointer"
          onClick={onToggle}
        >
          <h3 className="font-medium">{title}</h3>
          {active ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {active && (
          <div className="p-3 bg-white">
            {children}
          </div>
        )}
      </div>
    );
  };
  
  // Toggle button component
  const ToggleButton = ({ isActive, onClick, children, className = "" }) => (
    <button
      className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
        isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
  
  // Control slider component
  const ControlSlider = ({ label, value, min, max, step, onChange, precision = 2 }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-medium">{typeof value === 'number' ? value.toFixed(precision) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
  
  // Main layout and rendering
  return (
    <div className="flex flex-col w-full">
      {/* Header with title and compact mode toggle */}
      <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
        <h1 className="text-xl font-bold">Enhanced Video Analyzer</h1>
        <button
          className="p-2 rounded-lg bg-gray-200"
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          title="Toggle configuration panel"
        >
          <Settings size={20} />
        </button>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col md:flex-row h-full">
        {/* Configuration panel */}
        {showConfigPanel && (
          <div className={`${compactMode ? 'w-16' : 'w-full md:w-72'} bg-white border-r p-2 overflow-y-auto`}>
            {compactMode ? (
              /* Compact mode with just icons */
              <div className="flex flex-col gap-4 items-center py-4">
                <button 
                  className={`p-2 rounded-full ${activePanel === 'source' ? 'bg-blue-100' : 'bg-gray-100'}`}
                  onClick={() => setActivePanel('source')}
                >
                  <Camera size={20} />
                </button>
                <button 
                  className={`p-2 rounded-full ${activePanel === 'transform' ? 'bg-blue-100' : 'bg-gray-100'}`}
                  onClick={() => setActivePanel('transform')}
                >
                  <Grid3X3 size={20} />
                </button>
                <button 
                  className={`p-2 rounded-full ${activePanel === 'analysis' ? 'bg-blue-100' : 'bg-gray-100'}`}
                  onClick={() => setActivePanel('analysis')}
                >
                  <Eye size={20} />
                </button>
                <button
                  className="p-2 rounded-full bg-gray-100 mt-auto"
                  onClick={() => setCompactMode(false)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              /* Full config panel */
              <div>
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <button
                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                    onClick={() => setCompactMode(true)}
                  >
                    Compact
                  </button>
                </div>
                
                {/* Source Panel */}
                <Panel 
                  title="Video Source" 
                  active={activePanel === 'source'} 
                  onToggle={() => setActivePanel(activePanel === 'source' ? null : 'source')}
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium">URL:</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={videoSource}
                          onChange={handleUrlInput}
                          placeholder="Enter video URL"
                          className="flex-1 p-2 border rounded-l"
                          disabled={useWebcam || useFallbackAnimation}
                        />
                        <button 
                          className="bg-blue-500 text-white px-2 rounded-r"
                          onClick={() => {
                            if (videoSource) setIsPlaying(true);
                          }}
                        >
                          <Play size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium">Upload:</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="w-full p-2 border rounded"
                        disabled={useWebcam || useFallbackAnimation}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <ToggleButton 
                        isActive={useWebcam} 
                        onClick={toggleWebcam}
                      >
                        <Camera size={16} />
                        {useWebcam ? 'Stop Camera' : 'Use Camera'}
                      </ToggleButton>
                      
                      <ToggleButton 
                        isActive={useFallbackAnimation} 
                        onClick={toggleFallbackAnimation}
                      >
                        <Grid3X3 size={16} />
                        {useFallbackAnimation ? 'Using SVG' : 'Use SVG'}
                      </ToggleButton>
                    </div>
                    
                    {useFallbackAnimation && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <h4 className="text-sm font-medium mb-2">Animation Style</h4>
                        <div className="flex gap-3">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="fallbackStyle"
                              value="matrix"
                              checked={fallbackStyle === 'matrix'}
                              onChange={() => setFallbackStyle('matrix')}
                              className="mr-1"
                            />
                            <span className="text-sm">Matrix</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="fallbackStyle"
                              value="geometric"
                              checked={fallbackStyle === 'geometric'}
                              onChange={() => setFallbackStyle('geometric')}
                              className="mr-1"
                            />
                            <span className="text-sm">Geometric</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="fallbackStyle"
                              value="wave"
                              checked={fallbackStyle === 'wave'}
                              onChange={() => setFallbackStyle('wave')}
                              className="mr-1"
                            />
                            <span className="text-sm">Wave</span>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-2 bg-gray-50 rounded text-xs">
                      <p><strong>Dimensions:</strong> {videoDimensions.width} × {videoDimensions.height}</p>
                      <p><strong>Frame Rate:</strong> {frameRate.toFixed(1)} fps</p>
                    </div>
                  </div>
                </Panel>
                
                {/* Transformation Panel */}
                <Panel 
                  title="Matrix Transformation" 
                  active={activePanel === 'transform'} 
                  onToggle={() => setActivePanel(activePanel === 'transform' ? null : 'transform')}
                >
                  <div className="space-y-3">
                    <ControlSlider 
                      label="Scale X"
                      value={scaleX}
                      min={0.1}
                      max={3}
                      step={0.1}
                      onChange={setScaleX}
                    />
                    
                    <ControlSlider 
                      label="Scale Y"
                      value={scaleY}
                      min={0.1}
                      max={3}
                      step={0.1}
                      onChange={setScaleY}
                    />
                    
                    <ControlSlider 
                      label="Rotation (°)"
                      value={rotationDeg}
                      min={0}
                      max={360}
                      step={1}
                      onChange={setRotationDeg}
                    />
                    
                    <ControlSlider 
                      label="Shear X"
                      value={shearX}
                      min={-1}
                      max={1}
                      step={0.1}
                      onChange={setShearX}
                    />
                    
                    <ControlSlider 
                      label="Shear Y"
                      value={shearY}
                      min={-1}
                      max={1}
                      step={0.1}
                      onChange={setShearY}
                    />
                    
                    <ControlSlider 
                      label="Translate X (px)"
                      value={translateX}
                      min={-100}
                      max={100}
                      step={1}
                      onChange={setTranslateX}
                    />
                    
                    <ControlSlider 
                      label="Translate Y (px)"
                      value={translateY}
                      min={-100}
                      max={100}
                      step={1}
                      onChange={setTranslateY}
                    />
                    
                    <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-gray-50 rounded">
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        {(scaleX * Math.cos((rotationDeg * Math.PI) / 180)).toFixed(2)}
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        {(-Math.sin((rotationDeg * Math.PI) / 180) + shearX).toFixed(2)}
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        {translateX}
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        {(Math.sin((rotationDeg * Math.PI) / 180) + shearY).toFixed(2)}
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        {(scaleY * Math.cos((rotationDeg * Math.PI) / 180)).toFixed(2)}
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        {translateY}
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        0
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        0
                      </div>
                      <div className="text-center text-xs font-mono bg-gray-200 p-1 rounded">
                        1
                      </div>
                    </div>
                  </div>
                </Panel>
                
                {/* Analysis Panel */}
                <Panel 
                  title="Analysis Tools" 
                  active={activePanel === 'analysis'} 
                  onToggle={() => setActivePanel(activePanel === 'analysis' ? null : 'analysis')}
                >
                  <div className="space-y-4">
                    {/* FFT Analysis */}
                    <div className="border-b pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">FFT Spectral Analysis</h3>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={fftEnabled}
                            onChange={(e) => setFftEnabled(e.target.checked)}
                            className="mr-1"
                          />
                          <span className="text-sm">Enable</span>
                        </label>
                      </div>
                      {fftEnabled && (
                        <div className="space-y-2">
                          <ControlSlider 
                            label="Resolution"
                            value={fftResolution}
                            min={64}
                            max={512}
                            step={64}
                            onChange={setFftResolution}
                          />
                          
                          <div className="flex items-center justify-between">
                            <label className="text-sm">Logarithmic Scale</label>
                            <input
                              type="checkbox"
                              checked={fftLogScale}
                              onChange={(e) => setFftLogScale(e.target.checked)}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm mb-1">Colormap</label>
                            <select 
                              value={fftColormap}
                              onChange={(e) => setFftColormap(e.target.value)}
                              className="w-full p-1 border rounded"
                            >
                              <option value="viridis">Viridis</option>
                              <option value="grayscale">Grayscale</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Motion Analysis */}
                    <div className="border-b pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Motion Analysis</h3>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={motionAnalysisEnabled}
                            onChange={(e) => setMotionAnalysisEnabled(e.target.checked)}
                            className="mr-1"
                          />
                          <span className="text-sm">Enable</span>
                        </label>
                      </div>
                      
                      {motionAnalysisEnabled && (
                        <div className="space-y-2">
                          <ControlSlider 
                            label="Sensitivity"
                            value={motionSensitivity}
                            min={1}
                            max={20}
                            step={1}
                            onChange={setMotionSensitivity}
                          />
                          
                          <ControlSlider 
                            label="Threshold"
                            value={motionThreshold}
                            min={5}
                            max={100}
                            step={5}
                            onChange={setMotionThreshold}
                          />
                          
                          <ControlSlider 
                            label="Trail Length"
                            value={motionTrailLength}
                            min={1}
                            max={30}
                            step={1}
                            onChange={setMotionTrailLength}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Bandpass Motion Amplification */}
                    <div className="border-b pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Motion Amplification</h3>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={bandpassEnabled}
                            onChange={(e) => setBandpassEnabled(e.target.checked)}
                            className="mr-1"
                          />
                          <span className="text-sm">Enable</span>
                        </label>
                      </div>
                      
                      {bandpassEnabled && (
                        <div className="space-y-2">
                          <ControlSlider 
                            label="Low Cutoff (Hz)"
                            value={lowFrequency}
                            min={0.05}
                            max={5}
                            step={0.05}
                            onChange={setLowFrequency}
                            precision={2}
                          />
                          
                          <ControlSlider 
                            label="High Cutoff (Hz)"
                            value={highFrequency}
                            min={0.5}
                            max={15}
                            step={0.5}
                            onChange={setHighFrequency}
                            precision={1}
                          />
                          
                          <ControlSlider 
                            label="Amplification"
                            value={amplificationFactor}
                            min={1}
                            max={50}
                            step={1}
                            onChange={setAmplificationFactor}
                          />
                          
                          <div className="flex items-center justify-between">
                            <label className="text-sm">Region of Interest</label>
                            <button
                              className={`px-2 py-1 text-xs rounded ${roiActive ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                              onClick={() => setRoiActive(!roiActive)}
                            >
                              {roiActive ? 'Cancel Selection' : 'Select ROI'}
                            </button>
                          </div>
                          
                          {roi.width > 0 && roi.height > 0 && (
                            <div className="text-xs bg-gray-50 p-2 rounded">
                              <p>ROI: {roi.x.toFixed(0)},{roi.y.toFixed(0)} ({roi.width.toFixed(0)}×{roi.height.toFixed(0)})</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 3D Visualization */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">3D Visualization</h3>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={use3D}
                            onChange={(e) => setUse3D(e.target.checked)}
                            className="mr-1"
                          />
                          <span className="text-sm">Enable</span>
                        </label>
                      </div>
                      
                      {use3D && (
                        <div className="space-y-2">
                          <div className="text-sm mb-2">Coming soon!</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </div>
            )}
          </div>
        )}
        
        {/* Video display area */}
        <div className={`flex-1 p-4 bg-gray-900 ${showConfigPanel ? '' : 'w-full'}`}>
          {/* Visualization type selector */}
          <div className="flex mb-4 gap-2 overflow-x-auto pb-2">
            <ToggleButton
              isActive={activeVisualization === 'transform'}
              onClick={() => setActiveVisualization('transform')}
              className="text-sm"
            >
              Matrix Transform
            </ToggleButton>
            
            <ToggleButton
              isActive={activeVisualization === 'fft' && fftEnabled}
              onClick={() => fftEnabled && setActiveVisualization('fft')}
              className={`text-sm ${!fftEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              FFT Analysis
            </ToggleButton>
            
            <ToggleButton
              isActive={activeVisualization === 'motion' && motionAnalysisEnabled}
              onClick={() => motionAnalysisEnabled && setActiveVisualization('motion')}
              className={`text-sm ${!motionAnalysisEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Motion Analysis
            </ToggleButton>
            
            <ToggleButton
              isActive={activeVisualization === 'bandpass' && bandpassEnabled}
              onClick={() => bandpassEnabled && setActiveVisualization('bandpass')}
              className={`text-sm ${!bandpassEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Motion Amplification
            </ToggleButton>
            
            <ToggleButton
              isActive={activeVisualization === 'grid'}
              onClick={() => setActiveVisualization('grid')}
              className="text-sm"
            >
              Grid View
            </ToggleButton>
          </div>
          
          {/* Video display container */}
          <div className="relative">
            {/* Main video player (hidden when not needed) */}
            <div className={`${activeVisualization !== 'source' ? 'hidden' : ''}`}>
              <video
                ref={videoRef}
                src={!useWebcam ? videoSource : undefined}
                controls
                className="w-full h-auto bg-black"
                crossOrigin="anonymous"
              />
            </div>
            
            {/* Canvas displays */}
            <div className={`${activeVisualization === 'grid' ? 'grid grid-cols-2 gap-4' : 'relative'}`}>
              {/* Input canvas */}
              <div className={`
                relative ${
                  activeVisualization === 'grid' 
                    ? 'aspect-video bg-black' 
                    : (activeVisualization === 'source' ? 'block' : 'hidden')
                }
              `}>
                <canvas 
                  ref={mainCanvasRef} 
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  Input
                </div>
              </div>
              
              {/* FFT canvas */}
              <div className={`
                relative ${
                  activeVisualization === 'grid' 
                    ? fftEnabled ? 'aspect-video bg-black' : 'hidden'
                    : (activeVisualization === 'fft' ? 'block' : 'hidden')
                }
              `}>
                <canvas 
                  ref={fftCanvasRef} 
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  FFT Analysis
                </div>
              </div>
              
              {/* Motion Analysis canvas */}
              <div className={`
                relative ${
                  activeVisualization === 'grid' 
                    ? motionAnalysisEnabled ? 'aspect-video bg-black' : 'hidden'
                    : (activeVisualization === 'motion' ? 'block' : 'hidden')
                }
              `}>
                <canvas 
                  ref={motionCanvasRef} 
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  Motion Analysis
                </div>
              </div>
              
              {/* Output canvas (transformation or bandpass) */}
              <div 
                className={`
                  relative ${
                    activeVisualization === 'grid' 
                      ? 'aspect-video bg-black'
                      : (['transform', 'bandpass'].includes(activeVisualization) ? 'block' : 'hidden')
                  }
                `}
                onClick={handleCanvasClick}
              >
                <canvas 
                  ref={outputCanvasRef} 
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  {activeVisualization === 'bandpass' ? 'Motion Amplification' : 'Matrix Transformation'}
                </div>
                
                {roiActive && (
                  <div className="absolute top-2 right-2 text-yellow-300 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                    Click and drag to select region of interest
                  </div>
                )}
              </div>
            </div>
            
            {/* Play/pause overlay if not using video controls */}
            {!videoRef.current && (
              <button
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-4"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={24} color="white" /> : <Play size={24} color="white" />}
              </button>
            )}
          </div>
          
          {/* Status bar */}
          <div className="mt-4 bg-gray-800 text-white p-2 rounded flex justify-between items-center text-sm">
            <div>
              {videoSource ? `Source: ${videoSource.substring(0, 30)}...` : 
               useWebcam ? 'Source: Webcam' :
               useFallbackAnimation ? 'Source: SVG Animation' : 
               'No source selected'}
            </div>
            <div>
              {frameRate > 0 && `${frameRate.toFixed(1)} fps`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoAnalyzer;