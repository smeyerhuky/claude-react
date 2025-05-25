import { memo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Clock, Hash, Square } from 'lucide-react';
import { TRACK_TYPES } from '../hooks/useTrackManager';

const TrackItem = memo(({ track, onDoubleClick, onDragStart, onStop }) => {
  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData('trackId', track.id);
    onDragStart?.(track.id);
  }, [track.id, onDragStart]);
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case TRACK_TYPES.MAJOR: return 'bg-gradient-to-r from-red-500 to-pink-500';
      case TRACK_TYPES.FILLER: return 'bg-gradient-to-r from-teal-500 to-cyan-500';
      case TRACK_TYPES.SAMPLE: return 'bg-gradient-to-r from-yellow-500 to-pink-400';
      case TRACK_TYPES.EFFECT: return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => onDoubleClick?.(track.id)}
      className="p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 hover:border-purple-500 transition-all cursor-grab active:cursor-grabbing hover:translate-x-1 group relative"
    >
      {/* Stop button - appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStop?.(track.id);
        }}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        title="Stop playback"
      >
        <Square className="w-3 h-3" />
      </button>

      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-green-400 truncate flex-1 pr-8">{track.name}</h4>
        <Badge className={`${getTypeColor(track.type)} text-white text-xs ml-2`}>
          {track.type.toUpperCase()}
        </Badge>
      </div>
      
      <div className="flex justify-between text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <Music className="w-3 h-3" />
          {track.artist}
        </span>
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          {track.tempo} BPM
        </span>
      </div>
      
      <div className="flex justify-between text-sm text-gray-400 mt-1">
        <span>{track.key}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
});

TrackItem.displayName = 'TrackItem';

export const TrackLibrary = memo(({ tracks, onTrackDoubleClick, onTrackStop, onFileUpload }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files);
    }
    e.target.value = ''; // Reset input
  }, [onFileUpload]);
  
  const filteredTracks = Array.from(tracks.values()).filter(track => 
    selectedCategory === 'all' || track.type === selectedCategory
  );
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 flex-shrink-0">
        <div className="mb-3">
          <label htmlFor="file-upload">
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-black font-bold"
              asChild
            >
              <span>➕ Add Tracks</span>
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-2 bg-gray-800 w-full">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600">
              All
            </TabsTrigger>
            <TabsTrigger value="major" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600">
              Major
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid grid-cols-2 bg-gray-800 w-full mt-1">
            <TabsTrigger value="filler" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600">
              Filler
            </TabsTrigger>
            <TabsTrigger value="sample" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600">
              Sample
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-3">🎵</div>
            <p className="text-sm">No {selectedCategory === 'all' ? '' : selectedCategory} tracks found</p>
            <p className="text-xs mt-1">Click Add Tracks to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTracks.map(track => (
              <TrackItem
                key={track.id}
                track={track}
                onDoubleClick={onTrackDoubleClick}
                onStop={onTrackStop}
                onDragStart={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

TrackLibrary.displayName = 'TrackLibrary';