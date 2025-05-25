import React, { memo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const StatItem = memo(({ label, value, unit = '' }) => (
  <div className="bg-black/30 rounded-lg p-3 text-center border border-gray-700">
    <div className="text-2xl font-bold text-green-400">
      {value}{unit}
    </div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
));

StatItem.displayName = 'StatItem';

const HarmonicWheel = memo(({ currentKey, targetKey }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw harmonic wheel
    const gradient = ctx.createConicGradient(0, centerX, centerY);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.083, '#4ecdc4');
    gradient.addColorStop(0.167, '#45b7d1');
    gradient.addColorStop(0.25, '#96ceb4');
    gradient.addColorStop(0.333, '#ffeaa7');
    gradient.addColorStop(0.417, '#fab1a0');
    gradient.addColorStop(0.5, '#fd79a8');
    gradient.addColorStop(0.583, '#a29bfe');
    gradient.addColorStop(0.667, '#6c5ce7');
    gradient.addColorStop(0.75, '#74b9ff');
    gradient.addColorStop(0.833, '#00b894');
    gradient.addColorStop(0.917, '#00cec9');
    gradient.addColorStop(1, '#ff6b6b');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw inner circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Key positions (simplified)
    const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
    const keyAngles = {};
    keys.forEach((key, index) => {
      keyAngles[key] = (index * 30 - 90) * Math.PI / 180;
    });
    
    // Draw current key indicator
    if (currentKey) {
      const keyName = currentKey.split(' ')[0];
      const angle = keyAngles[keyName] || 0;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.fillStyle = '#00ff9d';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    // Draw target key indicator
    if (targetKey) {
      const keyName = targetKey.split(' ')[0];
      const angle = keyAngles[keyName] || 0;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.fillStyle = '#ff6b6b';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }, [currentKey, targetKey]);
  
  return (
    <div className="relative mx-auto">
      <canvas
        ref={canvasRef}
        width={180}
        height={180}
        className="w-full h-full"
      />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-gray-400">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span className="text-gray-400">Target</span>
        </div>
      </div>
    </div>
  );
});

HarmonicWheel.displayName = 'HarmonicWheel';

export const AnalysisPanel = memo(({
  chain,
  compatibility,
  onFrequencyCanvasReady,
  currentKey = 'C Major',
  targetKey = 'G Major'
}) => {
  const frequencyRef = useRef(null);
  
  useEffect(() => {
    if (frequencyRef.current) {
      onFrequencyCanvasReady?.(frequencyRef.current);
    }
  }, [onFrequencyCanvasReady]);
  
  const totalDuration = chain.reduce((sum, track) => sum + track.duration, 0);
  const avgBPM = chain.length > 0
    ? Math.round(chain.reduce((sum, track) => sum + track.tempo, 0) / chain.length)
    : 0;
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4">
      {/* Real-time Analysis */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400">Real-Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-black rounded-lg overflow-hidden border border-gray-700">
            <canvas
              ref={frequencyRef}
              className="w-full h-full"
              id="frequency-canvas"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Harmonic Matching */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400">Harmonic Matching</CardTitle>
        </CardHeader>
        <CardContent>
          <HarmonicWheel currentKey={currentKey} targetKey={targetKey} />
        </CardContent>
      </Card>
      
      {/* Chain Stats */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400">Chain Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Tracks" value={chain.length} />
            <StatItem label="Duration" value={formatDuration(totalDuration)} />
            <StatItem label="Avg BPM" value={avgBPM} />
            <StatItem label="Compatible" value={Math.round(compatibility * 100)} unit="%" />
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Compatibility Score</span>
              <span className="text-green-400">{Math.round(compatibility * 100)}%</span>
            </div>
            <Progress
              value={compatibility * 100}
              className="h-2"
            />
            <p className="text-xs text-gray-500 mt-2">
              {compatibility > 0.8
                ? '✅ Excellent flow!'
                : compatibility > 0.6
                ? 'ℹ️ Good compatibility'
                : '⚠️ Consider BPM/key adjustments'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

AnalysisPanel.displayName = 'AnalysisPanel';