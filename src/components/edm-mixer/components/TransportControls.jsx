import React, { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw, Download, Save, SkipForward, SkipBack, FastForward, Rewind } from 'lucide-react';

export const TransportControls = memo(({
  isPlaying,
  currentTime,
  totalDuration,
  onPlay,
  onStop,
  onPreview,
  onExportChain,
  onRenderMix,
  onSeek,
  onNextTrack,
  onPrevTrack,
  chain = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleSeek = useCallback((value) => {
    const newTime = (value[0] / 100) * totalDuration;
    onSeek?.(newTime);
  }, [totalDuration, onSeek]);
  
  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  
  const currentTrackIndex = chain.findIndex(track => {
    // This would need to be enhanced to track which track is currently playing
    return true; // Placeholder
  });
  
  const canGoNext = currentTrackIndex < chain.length - 1;
  const canGoPrev = currentTrackIndex > 0;
  
  return (
    <div className="bg-gray-900/95 border-t border-gray-700 p-3">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{formatTime(currentTime)}</span>
          <span className="text-purple-400">Chain Progress</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
        <div className="relative">
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-gray-800"
          />
          {/* Track markers on the progress bar */}
          {chain.length > 0 && (
            <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
              {chain.map((track, index) => {
                const trackStart = chain.slice(0, index).reduce((sum, t) => sum + t.duration, 0);
                const position = totalDuration > 0 ? (trackStart / totalDuration) * 100 : 0;
                return (
                  <div
                    key={track.chainId}
                    className="absolute top-0 bottom-0 w-px bg-cyan-400 opacity-70"
                    style={{ left: `${position}%` }}
                    title={`Track ${index + 1}: ${track.name}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onPrevTrack}
            disabled={!canGoPrev}
            className="hover:bg-blue-600 hover:border-blue-600"
          >
            <SkipBack className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="hover:bg-gray-600"
          >
            <Rewind className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            onClick={onPlay}
            className={`px-4 ${isPlaying
              ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-black'
              : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isPlaying ? (
              <><Pause className="w-4 h-4 mr-1" /> Pause</>
            ) : (
              <><Play className="w-4 h-4 mr-1" /> Play</>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onStop}
            className="hover:bg-red-600 hover:border-red-600"
          >
            <Square className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="hover:bg-gray-600"
          >
            <FastForward className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onNextTrack}
            disabled={!canGoNext}
            className="hover:bg-blue-600 hover:border-blue-600"
          >
            <SkipForward className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Time Display */}
        <div className="font-mono text-sm text-green-400 bg-black/60 px-3 py-1 rounded border border-green-400/30 min-w-[100px] text-center">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
        
        {/* Chain Info */}
        <div className="text-xs text-gray-400 min-w-[80px] text-center">
          {chain.length > 0 ? (
            <>
              <div>Track {currentTrackIndex + 1} / {chain.length}</div>
              <div className="text-purple-400">{chain[currentTrackIndex]?.name || 'Unknown'}</div>
            </>
          ) : (
            <div>No tracks</div>
          )}
        </div>
        
        {/* Export Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={onPreview}
            variant="outline"
            className="hover:bg-blue-600 hover:border-blue-600"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Preview
          </Button>
          
          <Button
            size="sm"
            onClick={onExportChain}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
          
          <Button
            size="sm"
            onClick={onRenderMix}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Save className="w-3 h-3 mr-1" /> Render
          </Button>
        </div>
      </div>
    </div>
  );
});

TransportControls.displayName = 'TransportControls';