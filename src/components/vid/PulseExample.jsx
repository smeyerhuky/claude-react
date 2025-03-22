import React, { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for pulse detection using RGB motion amplification
 */
const usePulseDetection = ({
  amplificationFactor = 5.0,
  lowFreqCutoff = 0.75,
  highFreqCutoff = 3.33,
  batchSize = 10,
  rgbMode = true,
  roiX = 0.4,
  roiY = 0.3,
  roiWidth = 0.2,
  roiHeight = 0.2
}) => {
  // Processing state
  const [videoSource, setVideoSource] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  
  // Results state
  const [originalFrames, setOriginalFrames] = useState([]);
  const [processedFrames, setProcessedFrames] = useState([]);
  const [pulseRate, setPulseRate] = useState(null);
  const [pulseWaveform, setPulseWaveform] = useState([]);
  const [timePoints, setTimePoints] = useState([]);
  
  // Processing references
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processingCancelRef = useRef(false);
  
  // For storing temporary batch data
  const batchDataRef = useRef({
    batchFrames: [],
    allOriginalFrames: [],
    allProcessedFrames: [],
    allTimePoints: [],
    colorSignals: {
      r: [],
      g: [],
      b: []
    }
  });

  /**
   * Process a video source (file or webcam stream)
   * @param {Object} source - Video source (File object or MediaStream)
   */
  const processVideoSource = (source) => {
    // Reset state
    setVideoSource(source);
    setIsProcessing(true);
    setProgress(0);
    setPulseRate(null);
    setPulseWaveform([]);
    setTimePoints([]);
    setOriginalFrames([]);
    setProcessedFrames([]);
    processingCancelRef.current = false;
    
    // Reset batch data
    batchDataRef.current = {
      batchFrames: [],
      allOriginalFrames: [],
      allProcessedFrames: [],
      allTimePoints: [],
      colorSignals: {
        r: [],
        g: [],
        b: []
      }
    };
    
    // Start processing in next tick to allow React to update
    setTimeout(() => {
      if (source instanceof File) {
        processVideoFile(source);
      } else if (source instanceof MediaStream) {
        processLiveStream(source);
      }
    }, 0);
  };

  /**
   * Process a video file for pulse detection in batches
   * @param {File} file - Video file to process
   */
  const processVideoFile = async (file) => {
    try {
      // Create URL for video element
      const videoUrl = URL.createObjectURL(file);
      
      // Set up video element
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      
      // Wait for video metadata to load
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      
      // Set video reference
      videoRef.current = video;
      
      // Calculate total batches
      const videoDuration = video.duration;
      const approxTotalFrames = videoDuration * 30; // Estimate at 30fps
      const totalBatches = Math.ceil(approxTotalFrames / batchSize);
      setTotalBatches(totalBatches);
      
      // Process video in batches
      await processInBatches(video, videoDuration);
      
      // Calculate pulse rate from collected data
      calculatePulseRate();
      
      // Clean up
      URL.revokeObjectURL(videoUrl);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error processing video file:', error);
      setIsProcessing(false);
    }
  };

  /**
   * Process live video stream for real-time pulse detection
   * @param {MediaStream} stream - Video stream to process
   */
  const processLiveStream = (stream) => {
    try {
      // Set up video element with stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.play();
      
      // Set video reference
      videoRef.current = video;
      
      // Start continuous processing
      processContinuously(video);
      
    } catch (error) {
      console.error('Error processing live stream:', error);
      setIsProcessing(false);
    }
  };

  /**
   * Process video in batches to manage memory and provide progress updates
   * @param {HTMLVideoElement} video - Video element to process
   * @param {number} duration - Duration of video in seconds
   */
  const processInBatches = async (video, duration) => {
    // Set up canvas for frame extraction
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Calculate region of interest
    const roi = {
      x: Math.floor(roiX * video.videoWidth),
      y: Math.floor(roiY * video.videoHeight),
      width: Math.floor(roiWidth * video.videoWidth),
      height: Math.floor(roiHeight * video.videoHeight)
    };
    
    // Calculate frames per second (assuming 30fps)
    const fps = 30;
    const totalFrames = Math.floor(duration * fps);
    
    // Calculate time between frames in seconds
    const frameTime = 1 / fps;
    
    // Process in batches
    for (let batchStart = 0; batchStart < totalFrames; batchStart += batchSize) {
      // Check if processing was cancelled
      if (processingCancelRef.current) {
        break;
      }
      
      // Reset batch frames
      batchDataRef.current.batchFrames = [];
      
      // Calculate current batch number
      const currentBatch = Math.floor(batchStart / batchSize);
      setCurrentBatch(currentBatch);
      
      // Process each frame in the batch
      for (let frameIndex = 0; frameIndex < batchSize; frameIndex++) {
        const actualFrameIndex = batchStart + frameIndex;
        
        // Break if we've reached the end of the video
        if (actualFrameIndex >= totalFrames) break;
        
        // Calculate time for this frame
        const frameTimeInSeconds = actualFrameIndex * frameTime;
        
        // Seek to frame
        video.currentTime = frameTimeInSeconds;
        
        // Wait for seeking to complete
        await new Promise(resolve => {
          const seekHandler = () => {
            video.removeEventListener('seeked', seekHandler);
            resolve();
          };
          video.addEventListener('seeked', seekHandler);
        });
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get full frame for visualization
        const fullFrameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Get region of interest for pulse detection
        const roiImageData = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
        
        // Extract color data from ROI
        const colorData = extractColorData(roiImageData);
        
        // Add frame data to batch
        batchDataRef.current.batchFrames.push({
          time: frameTimeInSeconds,
          fullFrameImageData,
          roiImageData,
          colorData
        });
        
        // Store time point
        batchDataRef.current.allTimePoints.push(frameTimeInSeconds);
        
        // Add to color signals
        batchDataRef.current.colorSignals.r.push(colorData.r);
        batchDataRef.current.colorSignals.g.push(colorData.g);
        batchDataRef.current.colorSignals.b.push(colorData.b);
        
        // Store original frame
        batchDataRef.current.allOriginalFrames.push(fullFrameImageData);
        
        // Update progress
        const newProgress = Math.min(100, Math.round((actualFrameIndex / totalFrames) * 100));
        setProgress(newProgress);
      }
      
      // Process this batch
      processFrameBatch();
      
      // Apply temporal filtering to enhance periodic signals
      if (batchDataRef.current.allProcessedFrames.length > fps * 2) {
        applyTemporalFiltering(fps);
      }
    }
    
    // Update state with all frames
    setOriginalFrames(batchDataRef.current.allOriginalFrames);
    setProcessedFrames(batchDataRef.current.allProcessedFrames);
    setTimePoints(batchDataRef.current.allTimePoints);
  };

  /**
   * Process video continuously for live streaming
   * @param {HTMLVideoElement} video - Video element with stream source
   */
  const processContinuously = (video) => {
    // Set up canvas for frame extraction
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Calculate region of interest
    const roi = {
      x: Math.floor(roiX * video.videoWidth),
      y: Math.floor(roiY * video.videoHeight),
      width: Math.floor(roiWidth * video.videoWidth),
      height: Math.floor(roiHeight * video.videoHeight)
    };
    
    // Set up window of frames for analysis (circular buffer)
    const maxBufferSize = 90; // 3 seconds at 30fps
    let frameCount = 0;
    
    // Animation loop for continuous processing
    const processFrame = () => {
      // Check if processing was cancelled
      if (processingCancelRef.current) {
        return;
      }
      
      // Only process if video is playing
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get full frame for visualization
        const fullFrameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Get region of interest for pulse detection
        const roiImageData = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
        
        // Extract color data from ROI
        const colorData = extractColorData(roiImageData);
        
        // Store time point (relative to start of stream)
        const currentTime = performance.now() / 1000;
        
        // If buffer is full, remove oldest frame
        if (batchDataRef.current.allTimePoints.length >= maxBufferSize) {
          batchDataRef.current.allTimePoints.shift();
          batchDataRef.current.allOriginalFrames.shift();
          batchDataRef.current.allProcessedFrames.shift();
          batchDataRef.current.colorSignals.r.shift();
          batchDataRef.current.colorSignals.g.shift();
          batchDataRef.current.colorSignals.b.shift();
        }
        
        // Add new frame data
        batchDataRef.current.allTimePoints.push(currentTime);
        batchDataRef.current.allOriginalFrames.push(fullFrameImageData);
        batchDataRef.current.colorSignals.r.push(colorData.r);
        batchDataRef.current.colorSignals.g.push(colorData.g);
        batchDataRef.current.colorSignals.b.push(colorData.b);
        
        // Process frame with motion amplification
        const processedFrame = amplifyPulseMotion(fullFrameImageData, colorData);
        batchDataRef.current.allProcessedFrames.push(processedFrame);
        
        // Update state every 5 frames to reduce render thrashing
        frameCount++;
        if (frameCount % 5 === 0) {
          setOriginalFrames([...batchDataRef.current.allOriginalFrames]);
          setProcessedFrames([...batchDataRef.current.allProcessedFrames]);
          setTimePoints([...batchDataRef.current.allTimePoints]);
          
          // Calculate pulse rate if we have enough frames
          if (batchDataRef.current.allTimePoints.length >= 60) {
            calculatePulseRate();
          }
        }
      }
      
      // Continue animation loop
      requestAnimationFrame(processFrame);
    };
    
    // Start processing
    requestAnimationFrame(processFrame);
  };

  /**
   * Extract average color data from an image region
   * @param {ImageData} imageData - Image data from canvas
   * @returns {Object} - Average RGB values
   */
  const extractColorData = (imageData) => {
    const data = imageData.data;
    let totalR = 0, totalG = 0, totalB = 0;
    const pixelCount = data.length / 4;
    
    // Sum all RGB values
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
    }
    
    // Calculate averages
    return {
      r: totalR / pixelCount / 255, // Normalize to 0-1
      g: totalG / pixelCount / 255,
      b: totalB / pixelCount / 255
    };
  };

  /**
   * Process a batch of frames using the current configuration
   */
  const processFrameBatch = () => {
    // Process each frame in the batch
    for (const frame of batchDataRef.current.batchFrames) {
      const processedFrame = amplifyPulseMotion(frame.fullFrameImageData, frame.colorData);
      batchDataRef.current.allProcessedFrames.push(processedFrame);
    }
  };

  /**
   * Apply temporal filtering to enhance periodic signals in the frequency range of pulse
   * @param {number} fps - Frames per second
   */
  const applyTemporalFiltering = (fps) => {
    // Only apply if we have enough frames
    if (batchDataRef.current.colorSignals.g.length < fps * 2) return;
    
    // Use all channels or just green based on mode
    let signalToAnalyze;
    
    if (rgbMode) {
      // In RGB mode, we'll use a weighted combination
      signalToAnalyze = batchDataRef.current.colorSignals.g.map((g, i) => {
        // Green has the highest weight as it's most responsive to blood volume changes
        return 0.2 * batchDataRef.current.colorSignals.r[i] + 
               0.7 * g + 
               0.1 * batchDataRef.current.colorSignals.b[i];
      });
    } else {
      // In green-only mode, just use the green channel
      signalToAnalyze = [...batchDataRef.current.colorSignals.g];
    }
    
    // Detrend the signal
    const detrendedSignal = detrendSignal(signalToAnalyze);
    
    // Store for pulse waveform display
    setPulseWaveform(detrendedSignal);
  };

  /**
   * Remove linear trend from a signal
   * @param {Array} signal - Signal to detrend
   * @returns {Array} - Detrended signal
   */
  const detrendSignal = (signal) => {
    const n = signal.length;
    
    // Calculate mean
    const mean = signal.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += signal[i];
      sumXY += i * signal[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Remove trend
    return signal.map((y, i) => y - (slope * i + intercept));
  };

  /**
   * Amplify pulse-related motion and color changes in video frame
   * @param {ImageData} frameImageData - Original frame image data
   * @param {Object} colorData - Average RGB values for reference
   * @returns {ImageData} - Processed frame with amplified pulse
   */
  const amplifyPulseMotion = (frameImageData, colorData) => {
    // Create a copy of the frame data
    const processedFrame = new ImageData(
      new Uint8ClampedArray(frameImageData.data),
      frameImageData.width,
      frameImageData.height
    );
    
    const data = processedFrame.data;
    
    // Determine which color channel(s) to amplify
    if (rgbMode) {
      // In RGB mode, we amplify each channel
      for (let i = 0; i < data.length; i += 4) {
        // Calculate the difference from the average color
        const rDiff = (data[i] / 255) - colorData.r;
        const gDiff = (data[i + 1] / 255) - colorData.g;
        const bDiff = (data[i + 2] / 255) - colorData.b;
        
        // Apply amplification with different weights for each channel
        // Green channel gets more amplification as it's most sensitive to blood volume changes
        data[i] = Math.max(0, Math.min(255, data[i] + rDiff * amplificationFactor * 255 * 0.5));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + gDiff * amplificationFactor * 255 * 0.9));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + bDiff * amplificationFactor * 255 * 0.3));
      }
    } else {
      // In green-only mode, we only amplify the green channel
      for (let i = 0; i < data.length; i += 4) {
        const gDiff = (data[i + 1] / 255) - colorData.g;
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + gDiff * amplificationFactor * 255));
      }
    }
    
    return processedFrame;
  };

  /**
   * Calculate pulse rate from collected color signals
   */
  const calculatePulseRate = () => {
    try {
      // Get signal to analyze based on mode
      let signalToAnalyze;
      
      if (rgbMode) {
        // In RGB mode, use weighted combination
        signalToAnalyze = batchDataRef.current.colorSignals.g.map((g, i) => {
          return 0.2 * batchDataRef.current.colorSignals.r[i] + 
                 0.7 * g + 
                 0.1 * batchDataRef.current.colorSignals.b[i];
        });
      } else {
        // In green-only mode, use just green channel
        signalToAnalyze = [...batchDataRef.current.colorSignals.g];
      }
      
      // Detrend the signal
      const detrendedSignal = detrendSignal(signalToAnalyze);
      
      // Get time interval
      const timeInterval = (batchDataRef.current.allTimePoints[batchDataRef.current.allTimePoints.length - 1] - 
                           batchDataRef.current.allTimePoints[0]) / 
                           (batchDataRef.current.allTimePoints.length - 1);
      
      // Calculate sampling rate
      const samplingRate = 1 / timeInterval;
      
      // Perform FFT to get frequency components
      const fftResult = simpleFFT(detrendedSignal);
      
      // Find the most prominent frequency in the pulse range
      const pulseFreq = findPulseFrequency(fftResult, samplingRate, lowFreqCutoff, highFreqCutoff);
      
      // Convert frequency to BPM
      const pulseBPM = Math.round(pulseFreq * 60);
      
      // Update state
      setPulseRate(pulseBPM);
      setPulseWaveform(detrendedSignal);
      
    } catch (error) {
      console.error('Error calculating pulse rate:', error);
    }
  };

  /**
   * Simple FFT implementation for frequency analysis
   * @param {Array} signal - Time-domain signal
   * @returns {Array} - Magnitude spectrum
   */
  const simpleFFT = (signal) => {
    // Get power of 2 size for FFT
    const n = signal.length;
    
    // Simple windowing to reduce spectral leakage
    const windowedSignal = signal.map((val, i) => {
      // Hann window
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
      return val * window;
    });
    
    // For a simple implementation, we'll just use a periodogram approach
    // This is a basic spectral estimation without a full FFT implementation
    
    const magnitudeSpectrum = [];
    const maxFrequency = 10; // We only care about frequencies up to 10Hz
    const frequencyStep = 0.05; // 0.05Hz steps
    
    for (let freq = 0; freq <= maxFrequency; freq += frequencyStep) {
      let realSum = 0;
      let imagSum = 0;
      
      for (let t = 0; t < n; t++) {
        const phase = 2 * Math.PI * freq * t / n;
        realSum += windowedSignal[t] * Math.cos(phase);
        imagSum -= windowedSignal[t] * Math.sin(phase);
      }
      
      // Magnitude at this frequency
      const magnitude = Math.sqrt(realSum * realSum + imagSum * imagSum) / n;
      magnitudeSpectrum.push({ frequency: freq, magnitude });
    }
    
    return magnitudeSpectrum;
  };

  /**
   * Find the most prominent frequency in the pulse range
   * @param {Array} fftResult - FFT magnitude spectrum
   * @param {number} samplingRate - Sampling rate in Hz
   * @param {number} lowFreqCutoff - Lower frequency bound in Hz
   * @param {number} highFreqCutoff - Upper frequency bound in Hz
   * @returns {number} - Detected pulse frequency in Hz
   */
  const findPulseFrequency = (fftResult, samplingRate, lowFreqCutoff, highFreqCutoff) => {
    // Filter FFT results to pulse frequency range
    const pulseRangeFFT = fftResult.filter(item => 
      item.frequency >= lowFreqCutoff && item.frequency <= highFreqCutoff
    );
    
    if (pulseRangeFFT.length === 0) return 0;
    
    // Find peak frequency
    let maxMagnitude = -Infinity;
    let peakFrequency = 0;
    
    for (const item of pulseRangeFFT) {
      if (item.magnitude > maxMagnitude) {
        maxMagnitude = item.magnitude;
        peakFrequency = item.frequency;
      }
    }
    
    return peakFrequency;
  };

  /**
   * Cancel ongoing processing
   */
  const cancelProcessing = () => {
    processingCancelRef.current = true;
    setIsProcessing(false);
  };

  return {
    // Video refs
    videoRef,
    canvasRef,
    
    // Processing state
    isProcessing,
    progress,
    currentBatch,
    totalBatches,
    
    // Results
    originalFrames,
    processedFrames,
    pulseRate,
    pulseWaveform,
    timePoints,
    
    // Methods
    processVideoSource,
    cancelProcessing
  };
};

/**
 * A slider component that allows visual comparison between original and processed video frames
 */
const ComparisonSlider = ({
  originalFrame,
  processedFrame,
  width = 640,
  height = 480,
  showOriginal = true,
  showProcessed = true,
  sliderPosition = 50,
  onSliderPositionChange = () => {}
}) => {
  // Refs for canvas elements
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Local state for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [localSliderPosition, setLocalSliderPosition] = useState(sliderPosition);
  
  // Update canvas when frames or slider position change
  useEffect(() => {
    if (!canvasRef.current || !originalFrame || !processedFrame) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the original frame on the left side
    if (showOriginal) {
      const originalImageData = new ImageData(
        new Uint8ClampedArray(originalFrame.data),
        originalFrame.width,
        originalFrame.height
      );
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalFrame.width;
      tempCanvas.height = originalFrame.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(originalImageData, 0, 0);
      
      // Calculate the clip region based on slider position
      const clipWidth = Math.floor((canvas.width * localSliderPosition) / 100);
      
      // Draw original frame up to the slider position
      ctx.drawImage(
        tempCanvas,
        0, 0, originalFrame.width, originalFrame.height,
        0, 0, clipWidth, canvas.height
      );
    }
    
    // Draw the processed frame on the right side
    if (showProcessed) {
      const processedImageData = new ImageData(
        new Uint8ClampedArray(processedFrame.data),
        processedFrame.width,
        processedFrame.height
      );
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = processedFrame.width;
      tempCanvas.height = processedFrame.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(processedImageData, 0, 0);
      
      // Calculate the clip region based on slider position
      const clipWidth = Math.floor((canvas.width * localSliderPosition) / 100);
      
      // Draw processed frame from the slider position to the end
      ctx.drawImage(
        tempCanvas,
        clipWidth * (processedFrame.width / canvas.width), 0, 
        processedFrame.width - clipWidth * (processedFrame.width / canvas.width), processedFrame.height,
        clipWidth, 0, canvas.width - clipWidth, canvas.height
      );
    }
    
    // Draw the slider line
    const sliderX = Math.floor((canvas.width * localSliderPosition) / 100);
    
    ctx.beginPath();
    ctx.moveTo(sliderX, 0);
    ctx.lineTo(sliderX, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw slider handle
    ctx.beginPath();
    ctx.arc(sliderX, canvas.height / 2, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw arrows inside the handle
    ctx.beginPath();
    ctx.moveTo(sliderX - 7, canvas.height / 2);
    ctx.lineTo(sliderX - 2, canvas.height / 2 - 5);
    ctx.lineTo(sliderX - 2, canvas.height / 2 + 5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(sliderX + 7, canvas.height / 2);
    ctx.lineTo(sliderX + 2, canvas.height / 2 - 5);
    ctx.lineTo(sliderX + 2, canvas.height / 2 + 5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();
    
    // Draw labels
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.filter = 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.8))';
    
    // Original label (left side)
    ctx.fillText('Original', sliderX / 2, 25);
    
    // Processed label (right side)
    ctx.fillText('Processed', sliderX + (canvas.width - sliderX) / 2, 25);
    
    // Reset filter
    ctx.filter = 'none';
    
  }, [originalFrame, processedFrame, localSliderPosition, showOriginal, showProcessed]);
  
  // Handle slider position changes
  useEffect(() => {
    setLocalSliderPosition(sliderPosition);
  }, [sliderPosition]);
  
  // Set up event listeners for slider
  useEffect(() => {
    const handleMouseDown = (e) => {
      e.preventDefault();
      setIsDragging(true);
      updateSliderPosition(e);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        updateSliderPosition(e);
      }
    };
    
    const handleTouchStart = (e) => {
      e.preventDefault();
      setIsDragging(true);
      updateSliderPosition(e.touches[0]);
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    const handleTouchMove = (e) => {
      if (isDragging) {
        updateSliderPosition(e.touches[0]);
      }
    };
    
    const updateSliderPosition = (event) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      
      setLocalSliderPosition(percentage);
      onSliderPositionChange(percentage);
    };
    
    const canvas = canvasRef.current;
    
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
      
      canvas.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchmove', handleTouchMove);
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
        
        canvas.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isDragging, onSliderPositionChange]);
  
  return (
    <div className="comparison-slider-container relative" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="comparison-slider-canvas w-full h-full cursor-col-resize rounded-lg"
      />
      
      {/* Overlay instructions - fade out after 5 seconds */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm opacity-70">
        Drag the slider to compare original and processed video
      </div>
    </div>
  );
};

/**
 * Main component for pulse detection visualization
 */
const PulseDetectionVisualizer = () => {
  // State for UI
  const [videoSource, setVideoSource] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showPulseWaveform, setShowPulseWaveform] = useState(true);
  
  // Configuration state
  const [config, setConfig] = useState({
    amplificationFactor: 5.0,
    rgbMode: true,
    roiX: 0.4,
    roiY: 0.3,
    roiWidth: 0.2,
    roiHeight: 0.2,
    batchSize: 10,
    lowFreqCutoff: 0.75,  // 45 BPM
    highFreqCutoff: 3.33  // 200 BPM
  });
  
  // Animation ref
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Use our custom hook
  const {
    isProcessing,
    progress,
    originalFrames,
    processedFrames,
    pulseRate,
    pulseWaveform,
    timePoints,
    processVideoSource,
    cancelProcessing
  } = usePulseDetection(config);
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.includes('video')) {
      // Stop webcam if active
      if (isWebcamActive) {
        stopWebcam();
      }
      
      setVideoSource(file);
      processVideoSource(file);
    }
  };
  
  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsWebcamActive(true);
      setVideoSource(stream);
      processVideoSource(stream);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Could not access webcam. Please make sure you have granted permission.');
    }
  };
  
  // Stop webcam
  const stopWebcam = () => {
    if (videoSource && videoSource instanceof MediaStream) {
      videoSource.getTracks().forEach(track => track.stop());
    }
    setIsWebcamActive(false);
    setVideoSource(null);
  };
  
  // Handle configuration changes
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Animation loop for playback
  useEffect(() => {
    if (isPlaying && originalFrames.length > 0 && processedFrames.length > 0) {
      let lastTimestamp = 0;
      
      const animate = (timestamp) => {
        if (timestamp - lastTimestamp > 1000 / (30 * playbackSpeed)) {
          lastTimestamp = timestamp;
          
          setCurrentFrameIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= originalFrames.length) {
              return 0; // Loop back to beginning
            }
            return nextIndex;
          });
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, originalFrames, processedFrames, playbackSpeed]);
  
  // Draw pulse waveform
  const drawPulseWaveform = () => {
    if (!pulseWaveform || pulseWaveform.length === 0) return null;
    
    // Canvas dimensions
    const width = 640;
    const height = 120;
    
    // Prepare data for visualization
    const data = pulseWaveform.slice(-200); // Show last 200 values
    
    // Find min and max for scaling
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    // Calculate points
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height * 0.8) - (height * 0.1);
      return [x, y];
    });
    
    // Create SVG path
    const path = `M ${points.map(p => p.join(' ')).join(' L ')}`;
    
    return (
      <div className="pulse-waveform mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Pulse Waveform</h3>
          <div className="flex items-center">
            <button
              className={`px-2 py-1 text-xs rounded ${showPulseWaveform ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              onClick={() => setShowPulseWaveform(!showPulseWaveform)}
            >
              {showPulseWaveform ? 'Hide' : 'Show'} Waveform
            </button>
          </div>
        </div>
        
        {showPulseWaveform && (
          <div className="relative bg-gray-100 rounded-lg p-2 h-32">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
              {/* Center line */}
              <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#ccc" strokeWidth="1" />
              
              {/* Pulse waveform */}
              <path
                d={path}
                fill="none"
                stroke={pulseRate ? "#3b82f6" : "#9ca3af"}
                strokeWidth="2"
              />
              
              {/* BPM indicator */}
              {pulseRate && (
                <text
                  x={width - 80}
                  y="20"
                  fontFamily="sans-serif"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#3b82f6"
                >
                  {pulseRate} BPM
                </text>
              )}
            </svg>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="pulse-detection-container p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Pulse Detection with RGB Motion Amplification</h1>
      
      {/* Source selection */}
      <div className="source-controls mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-3">Video Source</h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
            disabled={isProcessing}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Video
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          
          {!isWebcamActive ? (
            <button
              onClick={startWebcam}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 flex items-center justify-center"
              disabled={isProcessing}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Webcam
            </button>
          ) : (
            <button
              onClick={stopWebcam}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Webcam
            </button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column - Video and controls */}
        <div className="flex-1 min-w-0">
          {/* Video preview */}
          <div className="bg-black rounded-lg overflow-hidden mb-4">
            {isProcessing ? (
              <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-800 text-white">
                <svg className="w-12 h-12 animate-spin mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p>Processing video: {progress}%</p>
              </div>
            ) : originalFrames.length > 0 && processedFrames.length > 0 ? (
              <ComparisonSlider
                originalFrame={originalFrames[currentFrameIndex]}
                processedFrame={processedFrames[currentFrameIndex]}
                width={640}
                height={360}
                sliderPosition={sliderPosition}
                onSliderPositionChange={setSliderPosition}
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-gray-800 text-white">
                <p>Upload a video or start webcam to begin</p>
              </div>
            )}
          </div>
          
          {/* Playback controls */}
          {originalFrames.length > 0 && processedFrames.length > 0 && (
            <div className="playback-controls bg-white p-4 rounded-lg shadow mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Playback Controls</h3>
                
                {pulseRate && (
                  <div className="pulse-rate flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-xl text-red-500">{pulseRate}</span>
                    <span className="text-sm text-gray-500 ml-1">BPM</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max={originalFrames.length - 1}
                  value={currentFrameIndex}
                  onChange={(e) => setCurrentFrameIndex(parseInt(e.target.value))}
                  className="flex-1"
                />
                
                <div className="frame-counter text-sm text-gray-500">
                  Frame {currentFrameIndex + 1} / {originalFrames.length}
                </div>
              </div>
              
              <div className="speed-controls flex items-center gap-2">
                <span className="text-sm text-gray-500">Speed:</span>
                {[0.25, 0.5, 1, 2, 4].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-1 text-xs rounded ${playbackSpeed === speed ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Pulse waveform */}
          {drawPulseWaveform()}
        </div>
        
        {/* Right column - Configuration */}
        <div className="md:w-72">
          <div className="settings bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Settings</h3>
            
            <div className="setting-group mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Amplification Factor: {config.amplificationFactor.toFixed(1)}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={config.amplificationFactor}
                onChange={(e) => handleConfigChange('amplificationFactor', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values make pulse more visible but can introduce artifacts
              </p>
            </div>
            
            <div className="setting-group mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.rgbMode}
                  onChange={(e) => handleConfigChange('rgbMode', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Use RGB Channels</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, uses all color channels. Otherwise, uses only green channel.
              </p>
            </div>
            
            <div className="setting-group mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Region of Interest</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">X: {config.roiX.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.01"
                    value={config.roiX}
                    onChange={(e) => handleConfigChange('roiX', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Y: {config.roiY.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.01"
                    value={config.roiY}
                    onChange={(e) => handleConfigChange('roiY', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Width: {config.roiWidth.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.01"
                    value={config.roiWidth}
                    onChange={(e) => handleConfigChange('roiWidth', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Height: {config.roiHeight.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.01"
                    value={config.roiHeight}
                    onChange={(e) => handleConfigChange('roiHeight', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                Select the area where pulse is most visible (e.g., face, wrist)
              </p>
            </div>
            
            <div className="setting-group mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pulse Frequency Range</h4>
              
              <div className="flex gap-2 mb-2">
                <div>
                  <label className="block text-xs text-gray-600">Min: {Math.round(config.lowFreqCutoff * 60)} BPM</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={config.lowFreqCutoff}
                    onChange={(e) => handleConfigChange('lowFreqCutoff', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Max: {Math.round(config.highFreqCutoff * 60)} BPM</label>
                  <input
                    type="range"
                    min="2"
                    max="4"
                    step="0.05"
                    value={config.highFreqCutoff}
                    onChange={(e) => handleConfigChange('highFreqCutoff', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                Frequency range to consider for pulse detection
              </p>
            </div>
            
            <div className="setting-group mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Batch Size: {config.batchSize}
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={config.batchSize}
                onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of frames to process at once (higher uses more memory)
              </p>
            </div>
            
            {/* Reset and apply buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setConfig({
                  amplificationFactor: 5.0,
                  rgbMode: true,
                  roiX: 0.4,
                  roiY: 0.3,
                  roiWidth: 0.2,
                  roiHeight: 0.2,
                  batchSize: 10,
                  lowFreqCutoff: 0.75,
                  highFreqCutoff: 3.33
                })}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Reset
              </button>
              
              <button
                onClick={() => {
                  if (videoSource) {
                    processVideoSource(videoSource);
                  }
                }}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={!videoSource || isProcessing}
              >
                Apply
              </button>
            </div>
          </div>
          
          {/* Information panel */}
          <div className="info-panel bg-blue-50 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">How It Works</h3>
            <p className="text-sm text-blue-900 mb-2">
              This pulse detector uses Eulerian Video Magnification to amplify subtle color changes in the skin that occur with each heartbeat.
            </p>
            <ol className="list-decimal list-inside text-sm text-blue-900 space-y-1">
              <li>Select a video or use your webcam</li>
              <li>Adjust the region of interest to focus on skin</li>
              <li>The system analyzes RGB color changes in each frame</li>
              <li>Pulse signal is extracted through frequency analysis</li>
              <li>Use the slider to compare original and processed video</li>
            </ol>
            <p className="text-xs text-blue-800 mt-2">
              For best results, ensure good lighting and minimize movement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulseDetectionVisualizer;