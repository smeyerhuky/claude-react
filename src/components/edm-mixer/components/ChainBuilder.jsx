import React, { memo, useCallback, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Edit, Trash2, Music } from 'lucide-react';
import { TRANSITION_TYPES } from '../hooks/useTrackManager';

const ChainTrack = memo(({
  track,
  isLast,
  onPlay,
  onEdit,
  onRemove,
  onTransitionChange,
  onWaveformReady,
  onSpectrogramReady
}) => {
  const waveformRef = useRef(null);
  const spectrogramRef = useRef(null);
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  React.useEffect(() => {
    if (waveformRef.current) {
      onWaveformReady?.(track.chainId, waveformRef.current);
    }
  }, [track.chainId, onWaveformReady]);
  
  React.useEffect(() => {
    if (spectrogramRef.current) {
      onSpectrogramReady?.(track.chainId, spectrogramRef.current);
    }
  }, [track.chainId, onSpectrogramReady]);
  
  return (
    <div className="relative group">
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-purple-500 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-green-400">{track.name}</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPlay(track.id)}
                className="hover:bg-green-600 hover:text-white"
              >
                <Play className="w-4 h-4 mr-1" /> Play
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(track.chainId)}
                className="hover:bg-blue-600 hover:text-white"
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(track.chainId)}
                className="hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Waveform */}
          <div className="h-20 bg-black/50 rounded-lg mb-4 overflow-hidden border border-gray-700">
            <canvas
              ref={waveformRef}
              className="w-full h-full"
              id={`waveform_${track.chainId}`}
            />
          </div>
          
          {/* Spectrogram */}
          <div className="h-24 bg-black/50 rounded-lg mb-4 overflow-hidden border border-gray-700">
            <canvas
              ref={spectrogramRef}
              className="w-full h-full"
              id={`spectrogram_${track.chainId}`}
            />
          </div>
          
          {/* Transition Controls */}
          <div className="bg-black/30 rounded-lg p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              <div>
                <label className="text-sm text-gray-400">Transition:</label>
                <Select
                  value={track.transitionType}
                  onValueChange={(value) => onTransitionChange(track.chainId, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TRANSITION_TYPES.CROSSFADE}>Crossfade</SelectItem>
                    <SelectItem value={TRANSITION_TYPES.CUT}>Hard Cut</SelectItem>
                    <SelectItem value={TRANSITION_TYPES.ECHO}>Echo Fade</SelectItem>
                    <SelectItem value={TRANSITION_TYPES.FILTER}>Filter Sweep</SelectItem>
                    <SelectItem value={TRANSITION_TYPES.REVERSE}>Reverse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-400">Duration:</span>
                <div className="font-semibold">{formatDuration(track.duration)}</div>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-400">BPM:</span>
                <div className="font-semibold">{track.tempo}</div>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-400">Key:</span>
                <div className="font-semibold">{track.key}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Transition Arrow */}
      {!isLast && (
        <div className="absolute -bottom-5 right-1/2 translate-x-1/2 z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer">
            🔄
          </div>
        </div>
      )}
    </div>
  );
});

ChainTrack.displayName = 'ChainTrack';

export const ChainBuilder = memo(({
  chain,
  onDrop,
  onTrackPlay,
  onTrackEdit,
  onTrackRemove,
  onTransitionChange,
  onWaveformReady,
  onSpectrogramReady
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const trackId = e.dataTransfer.getData('trackId');
    if (trackId) {
      onDrop?.(trackId);
    }
  }, [onDrop]);
  
  return (
    <Card className="h-full bg-gray-900/95 border-gray-700">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-purple-400">Chain Builder</h3>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="min-h-full"
          >
            {chain.length === 0 ? (
              <div
                className={`
                  min-h-[200px] border-2 border-dashed rounded-xl
                  flex items-center justify-center transition-all
                  ${isDragOver
                    ? 'border-green-400 bg-green-500/10 scale-105'
                    : 'border-gray-600 bg-gray-800/20'
                  }
                `}
              >
                <div className="text-center text-gray-400">
                  <Music className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xl mb-2">🎵 Drag audio files here to build your EDM chain</p>
                  <p className="text-sm">Supports MP3, WAV, OGG formats</p>
                  <p className="text-sm mt-2">Start with major tracks, then add fillers and samples</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 pb-8">
                {chain.map((track, index) => (
                  <ChainTrack
                    key={track.chainId}
                    track={track}
                    index={index}
                    isLast={index === chain.length - 1}
                    onPlay={onTrackPlay}
                    onEdit={onTrackEdit}
                    onRemove={onTrackRemove}
                    onTransitionChange={onTransitionChange}
                    onWaveformReady={onWaveformReady}
                    onSpectrogramReady={onSpectrogramReady}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

ChainBuilder.displayName = 'ChainBuilder';