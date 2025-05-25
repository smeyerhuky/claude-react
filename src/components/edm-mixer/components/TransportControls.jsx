import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Square, RotateCcw, Download, Save } from 'lucide-react';

export const TransportControls = memo(({
  isPlaying,
  currentTime,
  totalDuration,
  onPlay,
  onStop,
  onPreview,
  onExportChain,
  onRenderMix
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className="bg-gray-900/95 border-gray-700 p-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={onPlay}
            className={`${isPlaying
              ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-black'
              : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isPlaying ? (
              <><Pause className="w-3 h-3 mr-1" /> Pause</>
            ) : (
              <><Play className="w-3 h-3 mr-1" /> Play</>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onStop}
            className="hover:bg-red-600 hover:border-red-600"
          >
            <Square className="w-3 h-3 mr-1" /> Stop
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onPreview}
            className="hover:bg-blue-600 hover:border-blue-600"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Preview
          </Button>
        </div>
        
        {/* Time Display */}
        <div className="font-mono text-lg text-green-400 bg-black/60 px-3 py-1 rounded border border-green-400/30 min-w-[120px] text-center">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
        
        {/* Export Controls */}
        <div className="flex items-center gap-1">
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
    </Card>
  );
});

TransportControls.displayName = 'TransportControls';