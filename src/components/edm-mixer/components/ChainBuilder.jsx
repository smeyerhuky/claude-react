import React, { memo, useCallback, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Edit, Trash2, Music, Zap, Gauge, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { TRANSITION_TYPES } from '../hooks/useTrackManager';

const ChainTrack = memo(({
  track,
  isLast,
  onPlay,
  onEdit,
  onRemove,
  onTransitionChange,
  onCrossfadeDurationChange,
  onMixPointChange,
  onSetCuePoint,
  onWaveformReady,
  onSpectrogramReady,
  onSeekTrack,
  isPlaying = false,
  currentTime = 0
}) => {
  const waveformRef = useRef(null);
  const spectrogramRef = useRef(null);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [isHoveringWaveform, setIsHoveringWaveform] = useState(false);
  
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
  
  // Update playhead position based on current time
  React.useEffect(() => {
    if (isPlaying && !isDraggingPlayhead) {
      const position = track.duration > 0 ? (currentTime / track.duration) * 100 : 0;
      setPlayheadPosition(Math.min(100, Math.max(0, position)));
    }
  }, [currentTime, track.duration, isPlaying, isDraggingPlayhead]);
  
  const handlePlayheadDrag = useCallback((e) => {
    if (!isDraggingPlayhead) return;
    
    const rect = waveformRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setPlayheadPosition(percentage);
      
      // Calculate time and trigger seek
      const newTime = (percentage / 100) * track.duration;
      onSeekTrack?.(track.id, newTime);
    }
  }, [isDraggingPlayhead, track.duration, track.id, onSeekTrack]);
  
  const handlePlayheadMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingPlayhead(true);
    handlePlayheadDrag(e);
  }, [handlePlayheadDrag]);

  const handlePlayheadTouchStart = useCallback((e) => {
    e.preventDefault();
    setIsDraggingPlayhead(true);
    const touch = e.touches[0];
    const rect = waveformRef.current?.getBoundingClientRect();
    if (rect) {
      const x = touch.clientX - rect.left;
      const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setPlayheadPosition(percentage);
      const newTime = (percentage / 100) * track.duration;
      onSeekTrack?.(track.id, newTime);
    }
  }, [track.duration, track.id, onSeekTrack]);

  // Handle waveform click for instant seek
  const handleWaveformClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setPlayheadPosition(percentage);
    const newTime = (percentage / 100) * track.duration;
    onSeekTrack?.(track.id, newTime);
  }, [track.duration, track.id, onSeekTrack]);

  // Handle mouse move for hover preview
  const handleWaveformMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setHoverPosition(percentage);
  }, []);

  const handleWaveformMouseLeave = useCallback(() => {
    setHoverPosition(null);
    setIsHoveringWaveform(false);
  }, []);

  const handleWaveformMouseEnter = useCallback(() => {
    setIsHoveringWaveform(true);
  }, []);

  // Keyboard controls for fine seeking
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isExpanded) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          const leftTime = Math.max(0, (playheadPosition / 100) * track.duration - 1);
          const leftPercent = (leftTime / track.duration) * 100;
          setPlayheadPosition(leftPercent);
          onSeekTrack?.(track.id, leftTime);
          break;
        case 'ArrowRight':
          e.preventDefault();
          const rightTime = Math.min(track.duration, (playheadPosition / 100) * track.duration + 1);
          const rightPercent = (rightTime / track.duration) * 100;
          setPlayheadPosition(rightPercent);
          onSeekTrack?.(track.id, rightTime);
          break;
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded, playheadPosition, track.duration, track.id, onSeekTrack]);
  
  React.useEffect(() => {
    const handleMouseMove = (e) => handlePlayheadDrag(e);
    const handleTouchMove = (e) => {
      if (!isDraggingPlayhead) return;
      const touch = e.touches[0];
      const rect = waveformRef.current?.getBoundingClientRect();
      if (rect) {
        const x = touch.clientX - rect.left;
        const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
        setPlayheadPosition(percentage);
        const newTime = (percentage / 100) * track.duration;
        onSeekTrack?.(track.id, newTime);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      // Trigger final seek when mouse is released
      if (isDraggingPlayhead) {
        const rect = waveformRef.current?.getBoundingClientRect();
        if (rect) {
          const finalTime = (playheadPosition / 100) * track.duration;
          onSeekTrack?.(track.id, finalTime);
        }
      }
    };
    const handleTouchEnd = () => {
      setIsDraggingPlayhead(false);
      // Trigger final seek when touch ends
      if (isDraggingPlayhead) {
        const rect = waveformRef.current?.getBoundingClientRect();
        if (rect) {
          const finalTime = (playheadPosition / 100) * track.duration;
          onSeekTrack?.(track.id, finalTime);
        }
      }
    };
    
    if (isDraggingPlayhead) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDraggingPlayhead, handlePlayheadDrag, playheadPosition, track.duration, track.id, onSeekTrack]);
  
  return (
    <div className="relative group">
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20">
        <CardContent className={`${isExpanded ? 'p-4' : 'p-2'} transition-all duration-300`}>
          {/* Compact Header */}
          <div className={`flex justify-between items-center ${isExpanded ? 'mb-3' : 'mb-2'}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              <h3 className={`${isExpanded ? 'text-lg' : 'text-sm'} font-bold text-green-400 truncate`}>{track.name}</h3>
              {/* Compact Info */}
              {!isExpanded && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-cyan-400">{track.tempo} BPM</span>
                  <span className="text-purple-400">{track.key}</span>
                  <span className="text-gray-400">{formatDuration(track.duration)}</span>
                </div>
              )}
              {/* Speed Controls - Always visible */}
              <div className="flex items-center gap-1 bg-black/30 rounded px-1 py-0.5 ml-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); setPlaybackSpeed(Math.max(0.5, playbackSpeed - 0.1)); }}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                  title="Decrease speed"
                >
                  <Gauge className="w-3 h-3 text-cyan-400" />
                </button>
                <span className="text-xs font-mono text-white min-w-[2rem] text-center">
                  {playbackSpeed.toFixed(1)}x
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setPlaybackSpeed(Math.min(2.0, playbackSpeed + 0.1)); }}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                  title="Increase speed"
                >
                  <Zap className="w-3 h-3 text-yellow-400" />
                </button>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPlay(track.id)}
                className="h-7 px-2 hover:bg-green-600 hover:text-white"
              >
                <Play className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingInline(!isEditingInline)}
                className="h-7 px-2 hover:bg-blue-600 hover:text-white"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(track.chainId)}
                className="h-7 px-2 hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Waveform with Playhead */}
          <div 
            className={`relative ${isExpanded ? 'h-20' : 'h-12'} bg-black/50 rounded-lg ${isExpanded ? 'mb-4' : 'mb-2'} overflow-hidden border border-gray-700 transition-all duration-300 cursor-pointer group`}
            onClick={handleWaveformClick}
            onMouseMove={handleWaveformMouseMove}
            onMouseEnter={handleWaveformMouseEnter}
            onMouseLeave={handleWaveformMouseLeave}
          >
            <canvas
              ref={waveformRef}
              className="w-full h-full"
              id={`waveform_${track.chainId}`}
            />
            {/* Hover Preview Line */}
            {hoverPosition !== null && isHoveringWaveform && !isDraggingPlayhead && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 pointer-events-none transition-all"
                style={{ left: `${hoverPosition}%` }}
              >
                {/* Hover Time Tooltip */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs text-white whitespace-nowrap border border-gray-700">
                  {formatDuration((hoverPosition / 100) * track.duration)}
                </div>
              </div>
            )}
            
            {/* Interactive Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-2 -ml-1 cursor-ew-resize group/playhead touch-none z-10"
              style={{ left: `${playheadPosition}%` }}
              onMouseDown={(e) => { e.stopPropagation(); handlePlayheadMouseDown(e); }}
              onTouchStart={(e) => { e.stopPropagation(); handlePlayheadTouchStart(e); }}
              title={`${formatDuration((playheadPosition / 100) * track.duration)} / ${formatDuration(track.duration)}`}
            >
              {/* Playhead Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-red-500 shadow-lg transition-all group-hover/playhead:w-1.5 group-hover/playhead:bg-red-400" />
              
              {/* Playhead handle - more visible */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 group-hover/playhead:border-t-red-400 transition-colors" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-red-500 group-hover/playhead:border-b-red-400 transition-colors" />
              
              {/* Current Time Badge */}
              {(isDraggingPlayhead || isExpanded) && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap transform -translate-x-8">
                    {formatDuration((playheadPosition / 100) * track.duration)}
                  </div>
                </div>
              )}
            </div>
            {/* Progress overlay */}
            {isPlaying && (
              <div 
                className="absolute top-0 bottom-0 bg-green-500/20 pointer-events-none transition-all"
                style={{ width: `${playheadPosition}%` }}
              />
            )}
          </div>
          
          {/* Spectrogram with Playhead - Only in expanded view */}
          {isExpanded && (
            <div 
              className="relative h-24 bg-black/50 rounded-lg mb-4 overflow-hidden border border-gray-700 cursor-pointer group"
              onClick={handleWaveformClick}
              onMouseMove={handleWaveformMouseMove}
              onMouseEnter={handleWaveformMouseEnter}
              onMouseLeave={handleWaveformMouseLeave}
            >
              <canvas
                ref={spectrogramRef}
                className="w-full h-full"
                id={`spectrogram_${track.chainId}`}
              />
              {/* Hover Preview Line for Spectrogram */}
              {hoverPosition !== null && isHoveringWaveform && !isDraggingPlayhead && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white/30 pointer-events-none"
                  style={{ left: `${hoverPosition}%` }}
                />
              )}
              {/* Synchronized Playhead */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-red-500 shadow-lg pointer-events-none"
                style={{ left: `${playheadPosition}%` }}
              />
            </div>
          )}
          
          {/* Enhanced Transition & Mix Controls */}
          <div className={`bg-black/30 rounded-lg ${isExpanded ? 'p-3 space-y-3' : 'p-2'}`}>
            {/* Inline Editing Mode */}
            {isEditingInline && !isExpanded && (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue={track.mixPoint || 75}
                  className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  onChange={(e) => onMixPointChange?.(track.chainId, e.target.value)}
                />
                <Select
                  value={track.transitionType}
                  onValueChange={(value) => onTransitionChange(track.chainId, value)}
                >
                  <SelectTrigger className="w-32 h-7 bg-gray-800 border-gray-600 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 z-50" sideOffset={5}>
                    <SelectItem value={TRANSITION_TYPES.CROSSFADE} className="text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                      🌊 Fade
                    </SelectItem>
                    <SelectItem value={TRANSITION_TYPES.CUT} className="text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                      ✂️ Cut
                    </SelectItem>
                    <SelectItem value={TRANSITION_TYPES.ECHO} className="text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                      🔊 Echo
                    </SelectItem>
                    <SelectItem value={TRANSITION_TYPES.FILTER} className="text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                      🎵 Filter
                    </SelectItem>
                    <SelectItem value={TRANSITION_TYPES.REVERSE} className="text-white hover:bg-gray-700 focus:bg-gray-700 text-xs">
                      ⏪ Reverse
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Top Row - Basic Info (Only in expanded view) */}
            {isExpanded && (
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Duration:</span>
                  <div className="font-semibold text-green-400">{formatDuration(track.duration)}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">BPM:</span>
                  <div className="font-semibold text-cyan-400">{track.tempo}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Key:</span>
                  <div className="font-semibold text-purple-400">{track.key}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Type:</span>
                  <div className="font-semibold text-yellow-400">{track.type}</div>
                </div>
              </div>
            )}
            
            {/* Transition Controls - Only in expanded view */}
            {isExpanded && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Transition Type:</label>
                    <Select
                      value={track.transitionType}
                      onValueChange={(value) => onTransitionChange(track.chainId, value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 z-50" sideOffset={5}>
                        <SelectItem value={TRANSITION_TYPES.CROSSFADE} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          🌊 Crossfade
                        </SelectItem>
                        <SelectItem value={TRANSITION_TYPES.CUT} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          ✂️ Hard Cut
                        </SelectItem>
                        <SelectItem value={TRANSITION_TYPES.ECHO} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          🔊 Echo Fade
                        </SelectItem>
                        <SelectItem value={TRANSITION_TYPES.FILTER} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          🎵 Filter Sweep
                        </SelectItem>
                        <SelectItem value={TRANSITION_TYPES.REVERSE} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          ⏪ Reverse
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Crossfade Duration:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.5"
                        max="8"
                        step="0.1"
                        defaultValue={track.crossfadeDuration || 2}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        onChange={(e) => {
                          onCrossfadeDurationChange?.(track.chainId, e.target.value);
                        }}
                      />
                      <span className="text-xs text-gray-400 min-w-[2rem]">{track.crossfadeDuration || 2}s</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Mix Point:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        defaultValue={track.mixPoint || 75}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        onChange={(e) => {
                          onMixPointChange?.(track.chainId, e.target.value);
                        }}
                      />
                      <span className="text-xs text-gray-400 min-w-[2rem]">{track.mixPoint || 75}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Advanced Controls */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-gray-700">
                  <button 
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                    onClick={() => {
                      const currentPos = (playheadPosition / 100) * track.duration;
                      onSetCuePoint?.(track.chainId, currentPos);
                    }}
                  >
                    🎯 Set Cue
                  </button>
                  <button className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors">
                    🎵 BPM Match
                  </button>
                  <button className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-colors">
                    🎹 Key Sync
                  </button>
                  <button className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs font-medium transition-colors">
                    🔥 Preview
                  </button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Transition Indicator */}
      {!isLast && (
        <div className="absolute -bottom-3 left-0 right-0 z-10 px-4">
          <div className="relative h-6 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent rounded-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-900 px-2 py-0.5 rounded-full text-xs text-purple-400 font-medium border border-purple-500/50">
                {track.transitionType === TRANSITION_TYPES.CROSSFADE && `🌊 ${track.crossfadeDuration || 2}s fade`}
                {track.transitionType === TRANSITION_TYPES.CUT && '✂️ Cut'}
                {track.transitionType === TRANSITION_TYPES.ECHO && '🔊 Echo'}
                {track.transitionType === TRANSITION_TYPES.FILTER && '🎵 Filter'}
                {track.transitionType === TRANSITION_TYPES.REVERSE && '⏪ Reverse'}
              </div>
            </div>
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
  onCrossfadeDurationChange,
  onMixPointChange,
  onSetCuePoint,
  onWaveformReady,
  onSpectrogramReady,
  onSeekTrack,
  isPlaying = false,
  currentTime = 0
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
    <div className="h-full bg-gray-900/95 border border-gray-700 rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-bold text-purple-400">Chain Builder</h3>
      </div>
      
      <div 
        className="flex-1 p-4 overflow-y-auto"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {chain.length === 0 ? (
          <div
            className={`
              h-full border-2 border-dashed rounded-xl min-h-[400px]
              flex items-center justify-center transition-all
              ${isDragOver
                ? 'border-green-400 bg-green-500/10 scale-[1.02]'
                : 'border-gray-600 bg-gray-800/20'
              }
            `}
          >
            <div className="text-center text-gray-400">
              <Music className="w-20 h-20 mx-auto mb-6" />
              <p className="text-3xl mb-3">🎵 Drag tracks here to build your EDM chain</p>
              <p className="text-lg mb-2">Supports MP3, WAV, OGG formats</p>
              <p className="text-base mt-3">Start with major tracks, then add fillers and samples</p>
              <p className="text-sm mt-6 text-blue-400">Use the Track Library on the left to upload files</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
                onCrossfadeDurationChange={onCrossfadeDurationChange}
                onMixPointChange={onMixPointChange}
                onSetCuePoint={onSetCuePoint}
                onWaveformReady={onWaveformReady}
                onSpectrogramReady={onSpectrogramReady}
                onSeekTrack={onSeekTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ChainBuilder.displayName = 'ChainBuilder';