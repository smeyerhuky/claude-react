import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Activity, Cpu, HardDrive, Volume2 } from 'lucide-react';

const MetricItem = memo(({ icon: Icon, label, value, unit = '', color = 'text-green-400' }) => (
  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700">
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <span className={`font-mono font-bold ${color}`}>
      {value}{unit}
    </span>
  </div>
));

MetricItem.displayName = 'MetricItem';

export const DebugMonitor = memo(({
  isPlaying,
  currentTime,
  chain,
  audioEngine,
  getMeterValue
}) => {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    latency: 0,
    bufferSize: 0
  });
  
  const [trackLevels, setTrackLevels] = useState({});
  
  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      // Simulated metrics - in production, these would come from actual measurements
      setMetrics({
        cpu: Math.random() * 30 + 10, // 10-40%
        memory: Math.random() * 200 + 100, // 100-300MB
        latency: Math.random() * 5 + 3, // 3-8ms
        bufferSize: 512
      });
      
      // Update track levels
      const levels = {};
      chain.forEach(track => {
        const level = getMeterValue ? getMeterValue(track.id) : Math.random();
        levels[track.chainId] = level;
      });
      setTrackLevels(levels);
    };
    
    const interval = setInterval(updateMetrics, 100);
    return () => clearInterval(interval);
  }, [chain, getMeterValue]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  return (
    <Card className="bg-gray-900/95 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-400">Debug Monitor</CardTitle>
          <Badge variant={isPlaying ? 'default' : 'secondary'} className="animate-pulse">
            {isPlaying ? 'PLAYING' : 'STOPPED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-3 mt-4">
            <MetricItem
              icon={Cpu}
              label="CPU Usage"
              value={metrics.cpu.toFixed(1)}
              unit="%"
              color={metrics.cpu > 30 ? 'text-yellow-400' : 'text-green-400'}
            />
            <MetricItem
              icon={HardDrive}
              label="Memory"
              value={metrics.memory.toFixed(0)}
              unit="MB"
            />
            <MetricItem
              icon={Activity}
              label="Latency"
              value={metrics.latency.toFixed(1)}
              unit="ms"
              color={metrics.latency > 6 ? 'text-yellow-400' : 'text-green-400'}
            />
            <MetricItem
              icon={HardDrive}
              label="Buffer Size"
              value={metrics.bufferSize}
              unit=" samples"
            />
          </TabsContent>
          
          <TabsContent value="tracks" className="space-y-3 mt-4">
            {chain.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No tracks loaded</p>
            ) : (
              chain.map(track => (
                <div key={track.chainId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate flex-1">
                      {track.name}
                    </span>
                    <Volume2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <Progress
                    value={(trackLevels[track.chainId] || 0) * 100}
                    className="h-2"
                  />
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="transport" className="space-y-3 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Position</span>
                <span className="font-mono text-green-400">{formatTime(currentTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">State</span>
                <span className="font-mono text-green-400">
                  {isPlaying ? 'PLAYING' : 'STOPPED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">BPM</span>
                <span className="font-mono text-green-400">128</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Sample Rate</span>
                <span className="font-mono text-green-400">48000 Hz</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

DebugMonitor.displayName = 'DebugMonitor';