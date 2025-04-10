import React, { useState, useEffect, useRef } from 'react';
import { Mic, StopCircle, Save, Volume2, BarChart2, Layers, Settings, 
         AlertTriangle, Play, Pause, ChevronDown, ChevronUp, RefreshCw, 
         Download, Upload } from 'lucide-react';

// Mock model weights (in a real implementation you would load a proper model)
const MOCK_MODEL_WEIGHTS = {
  timeFeatures: { weights: [0.7, -0.3, 0.5, 0.8, -0.2], bias: 0.1 },
  freqFeatures: { weights: [0.6, 0.4, -0.5, 0.3, -0.7], bias: -0.2 },
  output: { weights: [0.8, 0.6], bias: 0.1 }
};

const AudioClassificationPipeline = () => {
  // State for audio recording and processing
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // State for classification
  const [classificationResults, setClassificationResults] = useState(null);
  const [classificationHistory, setClassificationHistory] = useState([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  
  // State for advanced settings
  const [showSettings, setShowSettings] = useState(false);
  const [processingInterval, setProcessingInterval] = useState(500); // ms
  const [featureCount, setFeatureCount] = useState(40);
  const [selectedModel, setSelectedModel] = useState('vape-detector-v1');
  
  // State for visualizations
  const [audioFeatures, setAudioFeatures] = useState([]);
  const [timeFeatures, setTimeFeatures] = useState([]);
  const [freqFeatures, setFreqFeatures] = useState([]);
  const [spectrumData, setSpectrumData] = useState(new Uint8Array(128).fill(0));
  const [waveformData, setWaveformData] = useState(new Uint8Array(128).fill(128));
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const audioElementRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const processingIntervalRef = useRef(null);
  
  // Available audio classification models
  const availableModels = [
    { id: 'vape-detector-v1', name: 'Vape Detector v1', 
      description: 'Optimized for detecting vaping sounds vs ambient noise' },
    { id: 'vape-detector-v2', name: 'Vape Detector v2', 
      description: 'Improved model with better false-positive rejection' },
    { id: 'audio-classifier-general', name: 'General Audio Classifier', 
      description: 'Classifies various sound types: vaping, talking, coughing, etc.' }
  ];
  
  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // For visualization
        
        // Connect analyzer to destination
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    };
    
    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      
      // Clean up
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);
  
  // Update recording timer
  useEffect(() => {
    let interval;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);
  
  // Start recording
  const startRecording = async () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      // Connect analyzer to destination
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create source from microphone
      const micSource = audioContextRef.current.createMediaStreamSource(stream);
      micSource.connect(analyserRef.current);
      sourceRef.current = micSource;
      
      // Start media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioBlob);
        setAudioURL(url);
        
        // Create audio element for playback
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio(url);
        } else {
          audioElementRef.current.src = url;
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start visualizing audio
      visualizeAudio();
      
      // Start real-time processing
      startAudioProcessing();
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop real-time processing
      stopAudioProcessing();
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      // Disconnect source if exists
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
    }
  };
  
  // Play/pause recorded audio
  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
      stopAudioProcessing();
    } else {
      audioElementRef.current.play();
      
      // Create source from audio element
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audioElementRef.current);
        source.connect(analyserRef.current);
        sourceRef.current = source;
        
        // Start visualizing
        visualizeAudio();
        
        // Start processing
        startAudioProcessing();
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle playback ended
  useEffect(() => {
    const handlePlaybackEnded = () => {
      setIsPlaying(false);
      stopAudioProcessing();
    };
    
    if (audioElementRef.current) {
      audioElementRef.current.addEventListener('ended', handlePlaybackEnded);
    }
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.removeEventListener('ended', handlePlaybackEnded);
      }
    };
  }, [audioElementRef.current]);
  
  // Visualize audio
  const visualizeAudio = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      // Get frequency data for visualization
      analyserRef.current.getByteFrequencyData(dataArray);
      setSpectrumData(dataArray);
      
      // Get time domain data
      const timeDataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(timeDataArray);
      setWaveformData(timeDataArray);
      
      // Draw visualization
      canvasCtx.fillStyle = 'rgb(240, 240, 245)';
      canvasCtx.fillRect(0, 0, width, height);
      
      // Draw frequency data
      canvasCtx.beginPath();
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgb(${Math.min(255, dataArray[i] + 50)}, 50, 150)`;
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      
      // Draw waveform
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 100, 255)';
      canvasCtx.beginPath();
      
      const sliceWidth = width / timeDataArray.length;
      x = 0;
      
      for (let i = 0; i < timeDataArray.length; i++) {
        const v = timeDataArray[i] / 128.0;
        const y = v * height / 2;
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
    };
    
    draw();
  };
  
  // Start audio processing
  const startAudioProcessing = () => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }
    
    setIsProcessing(true);
    
    // Process audio at regular intervals
    processingIntervalRef.current = setInterval(() => {
      processAudioFrame();
    }, processingInterval);
  };
  
  // Stop audio processing
  const stopAudioProcessing = () => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    setIsProcessing(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // Process a single frame of audio
  const processAudioFrame = () => {
    if (!analyserRef.current) return;
    
    // Extract features from current audio frame
    const features = extractAudioFeatures();
    setAudioFeatures(features);
    
    // Run classification
    const result = classifyAudio(features);
    
    // Update state with classification result
    setClassificationResults(result);
    
    // Add to history if confidence is above threshold
    if (result.confidence > confidenceThreshold) {
      const newHistoryItem = {
        ...result,
        timestamp: new Date().toISOString(),
        id: `classification-${classificationHistory.length + 1}`
      };
      
      setClassificationHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
    }
  };
  
  // Extract audio features
  const extractAudioFeatures = () => {
    if (!analyserRef.current) return Array(featureCount).fill(0);
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    
    // Get frequency data
    const freqData = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(freqData);
    
    // Get time domain data
    const timeData = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(timeData);
    
    // Compute time domain features
    const timeFeatures = computeTimeDomainFeatures(timeData);
    setTimeFeatures(timeFeatures);
    
    // Compute frequency domain features
    const frequencyFeatures = computeFrequencyFeatures(freqData);
    setFreqFeatures(frequencyFeatures);
    
    // Combine features
    return [...timeFeatures, ...frequencyFeatures];
  };
  
  // Compute time domain features
  const computeTimeDomainFeatures = (timeData) => {
    // Simple features for demonstration (in a real system, you'd use more sophisticated features)
    const features = [];
    
    // 1. Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i - 1] > 128 && timeData[i] <= 128) || 
          (timeData[i - 1] <= 128 && timeData[i] > 128)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / timeData.length;
    features.push(zcr);
    
    // 2. RMS energy
    let sumOfSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      const value = (timeData[i] - 128) / 128.0; // Normalize to [-1, 1]
      sumOfSquares += value * value;
    }
    const rms = Math.sqrt(sumOfSquares / timeData.length);
    features.push(rms);
    
    // 3. Peak amplitude
    let peakAmplitude = 0;
    for (let i = 0; i < timeData.length; i++) {
      const value = Math.abs((timeData[i] - 128) / 128.0);
      if (value > peakAmplitude) {
        peakAmplitude = value;
      }
    }
    features.push(peakAmplitude);
    
    // 4. Signal variance
    const mean = sumOfSquares / timeData.length;
    let variance = 0;
    for (let i = 0; i < timeData.length; i++) {
      const value = (timeData[i] - 128) / 128.0;
      variance += (value - mean) * (value - mean);
    }
    variance /= timeData.length;
    features.push(variance);
    
    // 5. Entropy
    let entropy = 0;
    // (simplified implementation for demo)
    features.push(0.5); // Placeholder
    
    return features;
  };
  
  // Compute frequency domain features
  const computeFrequencyFeatures = (freqData) => {
    const features = [];
    
    // 1. Spectral centroid
    let weightedSum = 0;
    let sum = 0;
    for (let i = 0; i < freqData.length; i++) {
      weightedSum += i * freqData[i];
      sum += freqData[i];
    }
    const centroid = sum > 0 ? weightedSum / sum : 0;
    features.push(centroid / freqData.length);
    
    // 2. Spectral flatness
    let geometricMean = 0;
    let arithmeticMean = 0;
    
    // Add small value to avoid log(0)
    for (let i = 0; i < freqData.length; i++) {
      const value = freqData[i] + 1e-10;
      geometricMean += Math.log(value);
      arithmeticMean += value;
    }
    
    geometricMean = Math.exp(geometricMean / freqData.length);
    arithmeticMean /= freqData.length;
    
    const flatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
    features.push(flatness);
    
    // 3. Energy in frequency bands
    // Divide spectrum into 3 bands
    const bandSize = Math.floor(freqData.length / 3);
    
    let lowBandEnergy = 0;
    let midBandEnergy = 0;
    let highBandEnergy = 0;
    
    for (let i = 0; i < bandSize; i++) {
      lowBandEnergy += freqData[i];
    }
    
    for (let i = bandSize; i < 2 * bandSize; i++) {
      midBandEnergy += freqData[i];
    }
    
    for (let i = 2 * bandSize; i < freqData.length; i++) {
      highBandEnergy += freqData[i];
    }
    
    // Normalize by band size
    lowBandEnergy /= bandSize * 255;
    midBandEnergy /= bandSize * 255;
    highBandEnergy /= bandSize * 255;
    
    features.push(lowBandEnergy);
    features.push(midBandEnergy);
    features.push(highBandEnergy);
    
    return features;
  };
  
  // Classify audio using a simple model
  const classifyAudio = (features) => {
    // In a real implementation, you would load a proper ML model (TensorFlow.js, ONNX, etc.)
    // This is a very simplified version for demonstration
    
    if (!features || features.length === 0) {
      return { label: 'unknown', confidence: 0, features: [] };
    }
    
    // Use first 5 time features and 5 frequency features
    const timeFeats = features.slice(0, 5);
    const freqFeats = features.slice(5, 10);
    
    // Simple feed-forward calculation
    let timeScore = 0;
    let freqScore = 0;
    
    // Time features
    for (let i = 0; i < timeFeats.length; i++) {
      timeScore += timeFeats[i] * MOCK_MODEL_WEIGHTS.timeFeatures.weights[i];
    }
    timeScore += MOCK_MODEL_WEIGHTS.timeFeatures.bias;
    
    // Frequency features
    for (let i = 0; i < freqFeats.length; i++) {
      freqScore += freqFeats[i] * MOCK_MODEL_WEIGHTS.freqFeatures.weights[i];
    }
    freqScore += MOCK_MODEL_WEIGHTS.freqFeatures.bias;
    
    // Output layer
    const score = timeScore * MOCK_MODEL_WEIGHTS.output.weights[0] + 
                  freqScore * MOCK_MODEL_WEIGHTS.output.weights[1] + 
                  MOCK_MODEL_WEIGHTS.output.bias;
    
    // Convert to probability with sigmoid
    const probability = 1 / (1 + Math.exp(-score));
    
    // Add randomization to make it more interesting
    const randomFactor = Math.random() * 0.2 - 0.1; // -0.1 to 0.1
    const adjustedProbability = Math.max(0, Math.min(1, probability + randomFactor));
    
    // Classification result
    let result;
    if (adjustedProbability > 0.9) {
      result = { label: 'vaping', confidence: adjustedProbability, features };
    } else if (adjustedProbability > 0.7) {
      result = { label: 'possible_vaping', confidence: adjustedProbability, features };
    } else if (adjustedProbability > 0.4) {
      result = { label: 'undetermined', confidence: 1 - adjustedProbability, features };
    } else {
      result = { label: 'not_vaping', confidence: 1 - adjustedProbability, features };
    }
    
    return result;
  };
  
  // Reset classification
  const resetClassification = () => {
    setClassificationResults(null);
    setClassificationHistory([]);
    stopAudioProcessing();
  };
  
  // Export classification history
  const exportResults = () => {
    if (classificationHistory.length === 0) return;
    
    const exportData = {
      sessionId: `session-${new Date().toISOString()}`,
      model: selectedModel,
      threshold: confidenceThreshold,
      timestamp: new Date().toISOString(),
      results: classificationHistory
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `vape-detection-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };
  
  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get color for confidence level
  const getConfidenceColor = (confidence, label) => {
    if (label === 'vaping') {
      return 'bg-red-500';
    } else if (label === 'possible_vaping') {
      return 'bg-yellow-500';
    } else if (label === 'not_vaping') {
      return 'bg-green-500';
    } else {
      return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Real-time Audio Classification Pipeline</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          {/* Recording Controls */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                <Mic className="mr-2" size={18} />
                Audio Input
              </h2>
              <div className="text-sm font-medium">
                {isRecording ? (
                  <span className="flex items-center text-red-500">
                    <span className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                    Recording: {formatTime(recordingTime)}
                  </span>
                ) : isProcessing ? (
                  <span className="flex items-center text-blue-500">
                    <span className="animate-pulse h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
                    Processing Audio
                  </span>
                ) : (
                  <span className="text-gray-500">Ready</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-500 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <StopCircle size={18} className="mr-2" />
                  Stop Recording
                </button>
              ) : recordedAudio ? (
                <>
                  <button
                    onClick={togglePlayback}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md flex items-center"
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={18} className="mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={18} className="mr-2" />
                        Play Recording
                      </>
                    )}
                  </button>
                  <button
                    onClick={startRecording}
                    className="bg-green-500 text-white py-2 px-4 rounded-md flex items-center"
                  >
                    <Mic size={18} className="mr-2" />
                    New Recording
                  </button>
                </>
              ) : (
                <button
                  onClick={startRecording}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <Mic size={18} className="mr-2" />
                  Start Recording
                </button>
              )}
              
              <button
                onClick={() => startAudioProcessing()}
                className={`py-2 px-4 rounded-md flex items-center ${
                  isProcessing 
                    ? 'bg-gray-300 text-gray-700' 
                    : 'bg-purple-500 text-white'
                }`}
                disabled={isProcessing || (!isRecording && !recordedAudio)}
              >
                <BarChart2 size={18} className="mr-2" />
                {isProcessing ? 'Processing...' : 'Process Audio'}
              </button>
              
              <button
                onClick={resetClassification}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md flex items-center"
              >
                <RefreshCw size={18} className="mr-2" />
                Reset
              </button>
            </div>
            
            {/* Audio Visualization */}
            <div className="rounded-lg overflow-hidden h-32 bg-gray-100 border border-gray-200">
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={128} 
                className="w-full h-full"
              ></canvas>
            </div>
          </div>
        </div>
        
        <div>
          {/* Classification Results */}
          <div className="bg-gray-50 p-4 rounded-lg h-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <BarChart2 className="mr-2" size={18} />
              Classification
            </h2>
            
            {classificationResults ? (
              <div className="mb-4">
                <div className={`p-3 rounded-md ${
                  classificationResults.label === 'vaping' 
                    ? 'bg-red-100 border border-red-300' 
                    : classificationResults.label === 'possible_vaping'
                    ? 'bg-yellow-100 border border-yellow-300'
                    : classificationResults.label === 'not_vaping'
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      classificationResults.label === 'vaping' 
                        ? 'bg-red-200 text-red-800' 
                        : classificationResults.label === 'possible_vaping'
                        ? 'bg-yellow-200 text-yellow-800'
                        : classificationResults.label === 'not_vaping'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {classificationResults.label === 'vaping' 
                        ? 'Vaping Detected' 
                        : classificationResults.label === 'possible_vaping'
                        ? 'Possible Vaping'
                        : classificationResults.label === 'not_vaping'
                        ? 'Not Vaping'
                        : 'Undetermined'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Real-time
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getConfidenceColor(
                          classificationResults.confidence,
                          classificationResults.label
                        )}`}
                        style={{ width: `${classificationResults.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">0%</span>
                      <span className="text-xs font-medium">
                        {(classificationResults.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                  </div>
                  
                  {classificationResults.label === 'vaping' && (
                    <div className="flex items-center text-xs text-red-800 mt-3">
                      <AlertTriangle size={14} className="mr-1" />
                      Vaping activity detected with high confidence
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="mb-2">No classification results yet</p>
                <p className="text-xs">Record or play audio to classify</p>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Classification Threshold</h3>
              <div className="flex items-center">
                <input 
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="flex-grow"
                />
                <span className="text-xs ml-2 w-12 text-center">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum confidence level to register a detection
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Extraction */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center">
            <Layers className="mr-2" size={18} />
            Feature Extraction
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings size={18} />
          </button>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Interval (ms)
                </label>
                <input
                  type="number"
                  min="100"
                  max="2000"
                  step="100"
                  value={processingInterval}
                  onChange={(e) => setProcessingInterval(parseInt(e.target.value))}
                  className="w-full border p-2 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time between each audio processing cycle
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feature Count
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={featureCount}
                  onChange={(e) => setFeatureCount(parseInt(e.target.value))}
                  className="w-full border p-2 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of features to extract from audio
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classification Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {availableModels.find(m => m.id === selectedModel)?.description}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Domain Features */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Time Domain Features</h3>
            <div className="h-32 bg-gray-100 rounded overflow-hidden relative">
              {timeFeatures.length > 0 ? (
                <div className="absolute inset-0 flex items-end">
                  {timeFeatures.map((feature, index) => (
                    <div 
                      key={index}
                      className="h-full flex-1 mx-0.5 flex flex-col justify-end"
                    >
                      <div 
                        className="bg-blue-500"
                        style={{ height: `${feature * 100}%` }}
                      ></div>
                      <div className="text-center text-xs text-gray-500 truncate">{index}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  No features extracted
                </div>
              )}
            </div>
          </div>
          
          {/* Frequency Domain Features */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Frequency Domain Features</h3>
            <div className="h-32 bg-gray-100 rounded overflow-hidden relative">
              {freqFeatures.length > 0 ? (
                <div className="absolute inset-0 flex items-end">
                  {freqFeatures.map((feature, index) => (
                    <div 
                      key={index}
                      className="h-full flex-1 mx-0.5 flex flex-col justify-end"
                    >
                      <div 
                        className="bg-purple-500"
                        style={{ height: `${feature * 100}%` }}
                      ></div>
                      <div className="text-center text-xs text-gray-500 truncate">{index}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  No features extracted
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Classification History */}
      {classificationHistory.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center">
              <List className="mr-2" size={18} />
              Detection History
            </h2>
            <button
              onClick={exportResults}
              className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm flex items-center"
            >
              <Download size={14} className="mr-1" />
              Export Results
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="max-h-64 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Time</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {classificationHistory.map((result, index) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          result.label === 'vaping' 
                            ? 'bg-red-100 text-red-800' 
                            : result.label === 'possible_vaping'
                            ? 'bg-yellow-100 text-yellow-800'
                            : result.label === 'not_vaping'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {result.label === 'vaping' 
                            ? 'Vaping Detected' 
                            : result.label === 'possible_vaping'
                            ? 'Possible Vaping'
                            : result.label === 'not_vaping'
                            ? 'Not Vaping'
                            : 'Undetermined'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div 
                              className={`h-full ${getConfidenceColor(
                                result.confidence,
                                result.label
                              )}`}
                              style={{ width: `${result.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Pipeline Explanation */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="font-medium text-blue-700 mb-1 flex items-center">
              <Mic size={16} className="mr-1" /> 
              1. Audio Capture
            </div>
            <p>Records or processes audio from the microphone in real-time using the Web Audio API.</p>
          </div>
          
          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="font-medium text-blue-700 mb-1 flex items-center">
              <BarChart2 size={16} className="mr-1" /> 
              2. Feature Extraction
            </div>
            <p>Extracts time and frequency domain features from audio frames that capture unique signatures of vaping.</p>
          </div>
          
          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="font-medium text-blue-700 mb-1 flex items-center">
              <Layers size={16} className="mr-1" /> 
              3. Classification
            </div>
            <p>Analyzes features using machine learning to determine if the audio contains vaping sounds.</p>
          </div>
          
          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="font-medium text-blue-700 mb-1 flex items-center">
              <AlertTriangle size={16} className="mr-1" /> 
              4. Detection
            </div>
            <p>Logs detections when confidence exceeds threshold and maintains a history of events.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioClassificationPipeline;
