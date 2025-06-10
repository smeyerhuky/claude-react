import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Play, Pause, Download, Eye, Settings, Trash2, Volume2 } from 'lucide-react';

const UniversalWaveformExtractor = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [detectedContours, setDetectedContours] = useState([]);
  const [selectedContours, setSelectedContours] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Adjustable parameters
  const [edgeThreshold, setEdgeThreshold] = useState(50);
  const [minContourLength, setMinContourLength] = useState(30);
  const [smoothingFactor, setSmoothingFactor] = useState(3);
  const [sensitivityMode, setSensitivityMode] = useState('medium');
  
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);

  // Advanced edge detection using Sobel operators
  const detectEdges = useCallback((imageData, threshold = 50) => {
    const { data, width, height } = imageData;
    const edges = new Uint8ClampedArray(width * height);
    
    // Sobel kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    // Convert to grayscale and apply Sobel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            gx += gray * sobelX[ky + 1][kx + 1];
            gy += gray * sobelY[ky + 1][kx + 1];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = magnitude > threshold ? 255 : 0;
      }
    }
    
    return edges;
  }, []);

  // Find contours using a simplified approach
  const findContours = useCallback((edges, width, height, minLength = 30) => {
    const visited = new Array(width * height).fill(false);
    const contours = [];
    
    const traceContour = (startX, startY) => {
      const contour = [];
      const stack = [[startX, startY]];
      
      while (stack.length > 0) {
        const [x, y] = stack.pop();
        const idx = y * width + x;
        
        if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || edges[idx] === 0) {
          continue;
        }
        
        visited[idx] = true;
        contour.push({ x, y });
        
        // Check 8-connected neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            stack.push([x + dx, y + dy]);
          }
        }
      }
      
      return contour;
    };
    
    // Find all contours
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (edges[idx] > 0 && !visited[idx]) {
          const contour = traceContour(x, y);
          if (contour.length >= minLength) {
            contours.push(contour);
          }
        }
      }
    }
    
    return contours;
  }, []);

  // Classify contours based on their characteristics
  const classifyContour = (contour, imageWidth, imageHeight) => {
    if (contour.length < 10) return 'fragment';
    
    const xValues = contour.map(p => p.x);
    const yValues = contour.map(p => p.y);
    
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);
    
    const aspectRatio = xRange / yRange;
    const topHalf = yValues.filter(y => y < imageHeight / 2).length;
    const bottomHalf = yValues.filter(y => y >= imageHeight / 2).length;
    
    // Classification logic
    if (aspectRatio > 3 && topHalf > bottomHalf) return 'horizon';
    if (aspectRatio > 2) return 'edge';
    if (xRange > imageWidth * 0.6) return 'skyline';
    if (yRange > imageHeight * 0.4) return 'vertical';
    if (contour.length > 200) return 'complex';
    
    return 'natural';
  };

  // Convert contour to waveform
  const contourToWaveform = (contour) => {
    if (contour.length === 0) return [];
    
    // Sort points by x-coordinate
    const sortedPoints = [...contour].sort((a, b) => a.x - b.x);
    
    // Extract y-values and normalize
    const yValues = sortedPoints.map(p => p.y);
    const maxY = Math.max(...yValues);
    const minY = Math.min(...yValues);
    const range = maxY - minY;
    
    return yValues.map(y => range > 0 ? ((y - minY) / range - 0.5) * 2 : 0);
  };

  // Process uploaded image
  const processImage = useCallback(async () => {
    if (!uploadedImage || !imageData) return;
    
    setIsProcessing(true);
    
    try {
      // Apply edge detection
      const edges = detectEdges(imageData, edgeThreshold);
      
      // Find contours
      const contours = findContours(edges, imageData.width, imageData.height, minContourLength);
      
      // Process and classify contours
      const processedContours = contours.map((contour, index) => {
        const classification = classifyContour(contour, imageData.width, imageData.height);
        const waveform = contourToWaveform(contour);
        const color = getColorForType(classification);
        
        return {
          id: index,
          points: contour,
          waveform,
          classification,
          color,
          length: contour.length,
          selected: false
        };
      });
      
      // Sort by length (longer contours first)
      processedContours.sort((a, b) => b.length - a.length);
      
      setDetectedContours(processedContours);
      
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage, imageData, edgeThreshold, minContourLength, detectEdges, findContours]);

  // Get color for contour type
  const getColorForType = (type) => {
    const colors = {
      horizon: '#ff4444',
      skyline: '#4444ff',
      edge: '#44ff44',
      vertical: '#ff44ff',
      complex: '#ffaa00',
      natural: '#00ffff',
      fragment: '#888888'
    };
    return colors[type] || '#666666';
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        
        // Create canvas and extract image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setImageData(imgData);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Draw image and contours
  useEffect(() => {
    if (!uploadedImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    
    // Draw image
    ctx.drawImage(uploadedImage, 0, 0);
  }, [uploadedImage]);

  // Draw contour overlay
  useEffect(() => {
    if (!detectedContours.length || !overlayCanvasRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (uploadedImage) {
      canvas.width = uploadedImage.width;
      canvas.height = uploadedImage.height;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    detectedContours.forEach((contour) => {
      if (selectedContours.has(contour.id)) {
        ctx.strokeStyle = contour.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = contour.color;
        ctx.shadowBlur = 3;
        
        ctx.beginPath();
        contour.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  }, [detectedContours, selectedContours, uploadedImage]);

  // Draw combined waveform
  const drawCombinedWaveform = useCallback(() => {
    if (!waveformCanvasRef.current) return;
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw centerline
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Combine selected waveforms
    const selectedWaveforms = detectedContours
      .filter(c => selectedContours.has(c.id))
      .map(c => c.waveform)
      .filter(w => w.length > 0);
    
    if (selectedWaveforms.length === 0) return;
    
    // Concatenate waveforms
    const combinedWaveform = selectedWaveforms.flat();
    
    // Draw waveform
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const stepX = width / combinedWaveform.length;
    const centerY = height / 2;
    
    combinedWaveform.forEach((value, index) => {
      const x = index * stepX;
      const y = centerY + (value * centerY * 0.8);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }, [detectedContours, selectedContours]);

  useEffect(() => {
    drawCombinedWaveform();
  }, [drawCombinedWaveform]);

  // Toggle contour selection
  const toggleContour = (contourId) => {
    const newSelected = new Set(selectedContours);
    if (newSelected.has(contourId)) {
      newSelected.delete(contourId);
    } else {
      newSelected.add(contourId);
    }
    setSelectedContours(newSelected);
  };

  // Generate and play audio
  const playAudio = () => {
    const selectedWaveforms = detectedContours
      .filter(c => selectedContours.has(c.id))
      .map(c => c.waveform)
      .filter(w => w.length > 0);
    
    if (selectedWaveforms.length === 0) return;
    
    const combinedWaveform = selectedWaveforms.flat();
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    const sampleRate = audioContext.sampleRate;
    const duration = 4;
    
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    // Convert waveform to audio
    for (let i = 0; i < channelData.length; i++) {
      const waveformIndex = Math.floor((i / channelData.length) * combinedWaveform.length);
      const amplitude = combinedWaveform[waveformIndex] * 0.3;
      const frequency = 200 + (amplitude * 300);
      const time = i / sampleRate;
      channelData[i] = Math.sin(2 * Math.PI * frequency * time) * Math.abs(amplitude);
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    
    setIsPlaying(true);
    source.onended = () => setIsPlaying(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
      <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
        🔍 Universal Image Waveform Extractor 🎵
      </h2>
      
      {/* Upload Section */}
      <div className="mb-8 p-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Upload size={20} />
            Upload Image
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Upload any image to discover hidden waveforms and contours
          </p>
        </div>
      </div>

      {/* Controls */}
      {uploadedImage && (
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          <button
            onClick={processImage}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <Eye size={16} />
            {isProcessing ? 'Processing...' : 'Detect Waveforms'}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <Settings size={16} />
            Settings
          </button>
          
          <button
            onClick={playAudio}
            disabled={isPlaying || selectedContours.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {isPlaying ? <Pause size={16} /> : <Volume2 size={16} />}
            {isPlaying ? 'Playing...' : 'Play Selected'}
          </button>
          
          <button
            onClick={() => setSelectedContours(new Set())}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <Trash2 size={16} />
            Clear Selection
          </button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Detection Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Edge Threshold: {edgeThreshold}</label>
              <input
                type="range"
                min="10"
                max="200"
                value={edgeThreshold}
                onChange={(e) => setEdgeThreshold(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Min Contour Length: {minContourLength}</label>
              <input
                type="range"
                min="10"
                max="100"
                value={minContourLength}
                onChange={(e) => setMinContourLength(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Smoothing: {smoothingFactor}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={smoothingFactor}
                onChange={(e) => setSmoothingFactor(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {uploadedImage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Display */}
          <div className="space-y-4">
            <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="block w-full max-h-96 object-contain"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full max-h-96 object-contain pointer-events-none"
              />
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              <h3 className="font-semibold mb-3">Detected Contours ({detectedContours.length})</h3>
              <div className="space-y-2">
                {detectedContours.map((contour) => (
                  <div
                    key={contour.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                      selectedContours.has(contour.id) ? 'bg-blue-100' : 'bg-gray-50'
                    }`}
                    onClick={() => toggleContour(contour.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: contour.color }}
                      />
                      <span className="text-sm font-medium capitalize">
                        {contour.classification}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {contour.length} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Waveform Display */}
          <div className="space-y-4">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-2 text-sm font-semibold">
                Combined Waveform ({selectedContours.size} selected)
              </div>
              <canvas
                ref={waveformCanvasRef}
                width={600}
                height={300}
                className="w-full block bg-white"
              />
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Legend</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span>Horizon</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span>Skyline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span>Edge</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded"></div>
                  <span>Vertical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded"></div>
                  <span>Complex</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded"></div>
                  <span>Natural</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!uploadedImage && (
        <div className="text-center py-12 text-gray-500">
          Upload an image to begin discovering waveforms!
        </div>
      )}
    </div>
  );
};

export default UniversalWaveformExtractor;