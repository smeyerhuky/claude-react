import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Upload, Download, Settings, Activity, BarChart3, Eye } from 'lucide-react';

const VideoMotionToolkit = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [motionData, setMotionData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [threshold, setThreshold] = useState(30);
  const [showMotionOverlay, setShowMotionOverlay] = useState(true);
  const [activeTab, setActiveTab] = useState('analyze');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const animationRef = useRef(null);

  // Handle video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(URL.createObjectURL(file));
      setMotionData([]);
      setCurrentTime(0);
    }
  };

  // Video control functions
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Motion detection algorithm
  const detectMotion = useCallback((imageData1, imageData2, threshold) => {
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    let motionPixels = 0;
    const totalPixels = data1.length / 4;
    const motionMap = new Uint8ClampedArray(data1.length);

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
      
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      
      if (diff > threshold) {
        motionPixels++;
        motionMap[i] = 255;     // R
        motionMap[i + 1] = 0;   // G  
        motionMap[i + 2] = 0;   // B
        motionMap[i + 3] = 100; // A
      } else {
        motionMap[i] = 0;
        motionMap[i + 1] = 0;
        motionMap[i + 2] = 0;
        motionMap[i + 3] = 0;
      }
    }

    return {
      motionPercentage: (motionPixels / totalPixels) * 100,
      motionMap: new ImageData(motionMap, imageData1.width, imageData1.height)
    };
  }, []);

  // Analyze entire video for motion
  const analyzeVideoMotion = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const analysisData = [];
    const frameRate = 30; // Analyze at 30fps
    const interval = 1 / frameRate;
    let prevImageData = null;

    for (let time = 0; time < video.duration; time += interval) {
      video.currentTime = time;
      
      await new Promise(resolve => {
        video.addEventListener('seeked', resolve, { once: true });
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (prevImageData) {
        const motion = detectMotion(prevImageData, imageData, threshold);
        analysisData.push({
          time,
          motionLevel: motion.motionPercentage,
          motionMap: motion.motionMap
        });
      }

      prevImageData = imageData;
      setAnalysisProgress((time / video.duration) * 100);
    }

    setMotionData(analysisData);
    setIsAnalyzing(false);
    video.currentTime = 0;
  };

  // Real-time motion overlay
  const updateMotionOverlay = useCallback(() => {
    if (!videoRef.current || !showMotionOverlay || motionData.length === 0) return;

    const currentMotion = motionData.find(data => 
      Math.abs(data.time - currentTime) < 0.1
    );

    if (currentMotion && overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      ctx.putImageData(currentMotion.motionMap, 0, 0);
    }
  }, [currentTime, motionData, showMotionOverlay]);

  useEffect(() => {
    updateMotionOverlay();
  }, [updateMotionOverlay]);

  // Export motion data
  const exportMotionData = () => {
    const csvContent = [
      'Time (s),Motion Level (%)',
      ...motionData.map(d => `${d.time.toFixed(3)},${d.motionLevel.toFixed(3)}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motion-data.csv';
    a.click();
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentMotionLevel = () => {
    if (motionData.length === 0) return 0;
    const currentMotion = motionData.find(data => 
      Math.abs(data.time - currentTime) < 0.1
    );
    return currentMotion ? currentMotion.motionLevel : 0;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8" />
            Video Motion Extraction Toolkit
          </h1>
          <p className="mt-2 opacity-90">Analyze and extract motion data from video files</p>
        </div>

        {/* Upload Section */}
        {!videoFile && (
          <div className="p-8 text-center">
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 transition-colors">
                <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Video File</h3>
                <p className="text-gray-500">Select a video file to begin motion analysis</p>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Video Player and Analysis */}
        {videoFile && (
          <div className="p-6">
            {/* Tab Navigation */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'analyze' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Video Analysis
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'data' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Motion Data
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'settings' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>

            {activeTab === 'analyze' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Video Player */}
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoFile}
                      className="w-full"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                    />
                    {showMotionOverlay && (
                      <canvas
                        ref={overlayCanvasRef}
                        className="absolute top-0 left-0 pointer-events-none opacity-70"
                        width={videoRef.current?.videoWidth || 0}
                        height={videoRef.current?.videoHeight || 0}
                      />
                    )}
                  </div>

                  {/* Video Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlayPause}
                        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                      </button>
                      <span className="text-sm text-gray-600">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Analysis Panel */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Motion Analysis</h3>
                    <button
                      onClick={analyzeVideoMotion}
                      disabled={isAnalyzing}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isAnalyzing ? `Analyzing... ${analysisProgress.toFixed(0)}%` : 'Analyze Video Motion'}
                    </button>
                  </div>

                  {/* Real-time Motion Level */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Current Motion Level</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {getCurrentMotionLevel().toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(getCurrentMotionLevel(), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showMotionOverlay}
                        onChange={(e) => setShowMotionOverlay(e.target.checked)}
                        className="mr-2"
                      />
                      Show Motion Overlay
                    </label>
                    
                    {motionData.length > 0 && (
                      <button
                        onClick={exportMotionData}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Motion Data
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                {motionData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No motion data available. Please analyze the video first.</p>
                  </div>
                ) : (
                  <>
                    {/* Motion Chart */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">Motion Level Over Time</h3>
                      <div className="h-64 relative">
                        <svg className="w-full h-full" viewBox="0 0 800 200">
                          <defs>
                            <linearGradient id="motionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid lines */}
                          {[0, 25, 50, 75, 100].map(y => (
                            <line
                              key={y}
                              x1="0"
                              y1={200 - (y * 2)}
                              x2="800"
                              y2={200 - (y * 2)}
                              stroke="#E5E7EB"
                              strokeWidth="1"
                            />
                          ))}
                          
                          {/* Motion curve */}
                          <path
                            d={`M ${motionData.map((d, i) => 
                              `${(i / motionData.length) * 800} ${200 - (d.motionLevel * 2)}`
                            ).join(' L ')}`}
                            fill="url(#motionGradient)"
                            stroke="#3B82F6"
                            strokeWidth="2"
                          />
                          
                          {/* Current time indicator */}
                          <line
                            x1={(currentTime / duration) * 800}
                            y1="0"
                            x2={(currentTime / duration) * 800}
                            y2="200"
                            stroke="#EF4444"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Average Motion</h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {(motionData.reduce((sum, d) => sum + d.motionLevel, 0) / motionData.length).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800">Peak Motion</h4>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.max(...motionData.map(d => d.motionLevel)).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-800">Active Frames</h4>
                        <div className="text-2xl font-bold text-purple-600">
                          {motionData.filter(d => d.motionLevel > 5).length}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">Motion Detection Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motion Threshold: {threshold}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>More Sensitive</span>
                        <span>Less Sensitive</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">About This Tool</h3>
                  <p className="text-gray-600 leading-relaxed">
                    This toolkit analyzes video files frame-by-frame to detect motion by comparing 
                    pixel differences between consecutive frames. Motion is highlighted in red overlay 
                    and quantified as a percentage of pixels that changed beyond the threshold. 
                    The data can be exported for further analysis or integration with other tools.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default VideoMotionToolkit;
