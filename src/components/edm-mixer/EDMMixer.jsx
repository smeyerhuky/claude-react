import React, { Suspense, lazy, useCallback, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Terminal } from 'lucide-react';

// Lazy load components for better performance
const TrackLibrary = lazy(() => import('./components/TrackLibrary').then(m => ({ default: m.TrackLibrary })));
const ChainBuilder = lazy(() => import('./components/ChainBuilder').then(m => ({ default: m.ChainBuilder })));
const AnalysisPanel = lazy(() => import('./components/AnalysisPanel').then(m => ({ default: m.AnalysisPanel })));
const TransportControls = lazy(() => import('./components/TransportControls').then(m => ({ default: m.TransportControls })));
const DebugMonitor = lazy(() => import('./components/DebugMonitor').then(m => ({ default: m.DebugMonitor })));
const ConsoleDrawer = lazy(() => import('./components/ConsoleDrawer').then(m => ({ default: m.ConsoleDrawer })));

// Import hooks
import { useAudioEngine } from './hooks/useAudioEngine';
import { useTrackManager } from './hooks/useTrackManager';
import { useVisualization } from './hooks/useVisualization';
import { useConsoleLogger } from './hooks/useConsoleLogger';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
  </div>
);

export const EDMMixer = () => {
  const { toast } = useToast();
  
  // Initialize console logger
  const logger = useConsoleLogger();
  
  // Initialize audio engine
  const audioEngine = useAudioEngine();
  const {
    isInitialized,
    isPlaying,
    currentTime,
    setIsPlaying,
    initializeAudio,
    togglePlayback,
    stopPlayback,
    getFrequencyData,
    getMeterValue,
    masterGain
  } = audioEngine;
  
  // Initialize track manager
  const trackManager = useTrackManager(masterGain, logger, setIsPlaying);
  const {
    tracks,
    chain,
    loading,
    loadTrack,
    addToChain,
    removeFromChain,
    updateTransition,
    calculateChainDuration,
    calculateChainCompatibility,
    playTrack,
    stopTrack,
    stopAllTracks
  } = trackManager;
  
  // Initialize visualization
  const { registerCanvas, drawWaveform, drawSpectrogram } = useVisualization(
    getFrequencyData,
    isPlaying
  );
  
  // Show welcome message on mount (only once)
  useEffect(() => {
    logger.info('EDM Chain Builder Pro initialized', 'SYSTEM');
    logger.info('Tone.js version loaded', 'SYSTEM', { version: '15.1.22' });
    logger.info('Browser audio support detected', 'SYSTEM', {
      audioContext: typeof AudioContext !== 'undefined',
      webAudio: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined'
    });
    
    toast({
      title: "Welcome to EDM Chain Builder Pro!",
      description: "Upload audio files or interact with controls to start mixing. Check Console for details.",
    });
  }, []); // Empty dependency array to run only once

  // Initialize audio on first user interaction
  const handleFirstInteraction = useCallback(async () => {
    if (!isInitialized) {
      const success = await initializeAudio();
      if (success) {
        toast({
          title: "Audio System Ready",
          description: "EDM Chain Builder Pro initialized successfully!",
        });
      } else {
        toast({
          title: "Initialization Error",
          description: "Failed to initialize audio system. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [isInitialized, initializeAudio, toast]);
  
  // File upload handler
  const handleFileUpload = useCallback(async (files) => {
    logger.info(`File upload started with ${files.length} files`, 'UPLOAD');
    logger.open(); // Auto-open console when files are uploaded
    
    await handleFirstInteraction();
    
    for (const file of files) {
      try {
        logger.info(`Processing file: ${file.name}`, 'UPLOAD', {
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          type: file.type,
          lastModified: new Date(file.lastModified).toLocaleString()
        });
        
        await loadTrack(file);
        
        toast({
          title: "Track Loaded",
          description: `Successfully loaded ${file.name}`,
        });
        logger.success(`Track loaded and added to UI: ${file.name}`, 'UPLOAD');
      } catch (error) {
        toast({
          title: "Loading Error",
          description: `Failed to load ${file.name}`,
          variant: "destructive",
        });
        logger.error(`Failed to load file: ${file.name}`, 'UPLOAD', error);
      }
    }
    
    logger.info('File upload batch completed', 'UPLOAD');
  }, [loadTrack, toast, handleFirstInteraction, logger]);
  
  // Track play handler
  const handleTrackPlay = useCallback(async (trackId) => {
    await handleFirstInteraction();
    if (!isInitialized) return;
    
    stopAllTracks();
    await playTrack(trackId);
    
    const track = tracks.get(trackId);
    if (track) {
      toast({
        title: "Now Playing",
        description: track.name,
      });
    }
  }, [isInitialized, playTrack, stopAllTracks, tracks, toast, handleFirstInteraction]);

  // Track stop handler
  const handleTrackStop = useCallback((trackId) => {
    stopTrack(trackId);
    toast({
      title: "Stopped",
      description: "Track playback stopped",
    });
  }, [stopTrack, toast]);
  
  // Chain drop handler
  const handleChainDrop = useCallback((trackId) => {
    addToChain(trackId);
    const track = tracks.get(trackId);
    if (track) {
      toast({
        title: "Track Added",
        description: `Added "${track.name}" to chain`,
      });
    }
  }, [addToChain, tracks, toast]);
  
  // Track remove handler
  const handleTrackRemove = useCallback((chainId) => {
    removeFromChain(chainId);
    toast({
      title: "Track Removed",
      description: "Track removed from chain",
    });
  }, [removeFromChain, toast]);
  
  // Toggle playback with audio initialization
  const handleTogglePlayback = useCallback(async () => {
    await handleFirstInteraction();
    
    if (chain.length === 0) {
      toast({
        title: "No Tracks in Chain",
        description: "Add tracks to the chain before playing",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      // Stop current playback
      stopAllTracks();
    } else {
      // Start playing the first track in the chain
      await handleTrackPlay(chain[0].id);
    }
  }, [handleFirstInteraction, chain, isPlaying, stopAllTracks, handleTrackPlay, toast]);

  // Stop handler for footer controls
  const handleStop = useCallback(() => {
    stopAllTracks();
    toast({
      title: "Stopped",
      description: "All playback stopped",
    });
  }, [stopAllTracks, toast]);

  // Preview transition
  const handlePreviewTransition = useCallback(() => {
    toast({
      title: "Preview",
      description: "Transition preview feature coming soon!",
    });
  }, [toast]);
  
  // Export chain
  const handleExportChain = useCallback(() => {
    if (chain.length === 0) {
      toast({
        title: "Export Error",
        description: "No tracks in chain to export",
        variant: "destructive",
      });
      return;
    }
    
    const exportData = {
      chain: chain.map(track => ({
        name: track.name,
        artist: track.artist,
        type: track.type,
        tempo: track.tempo,
        key: track.key,
        duration: track.duration,
        transitionType: track.transitionType,
        startTime: track.startTime
      })),
      metadata: {
        totalDuration: calculateChainDuration(),
        compatibility: calculateChainCompatibility(),
        exported: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edm-chain-export.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Chain exported as JSON file",
    });
  }, [chain, calculateChainDuration, calculateChainCompatibility, toast]);
  
  // Render mix
  const handleRenderMix = useCallback(() => {
    toast({
      title: "Render Mix",
      description: "Mix rendering feature coming soon!",
    });
  }, [toast]);
  
  // Waveform ready handler
  const handleWaveformReady = useCallback((chainId, canvas) => {
    const track = chain.find(t => t.chainId === chainId);
    if (track && track.audioBuffer) {
      drawWaveform(canvas, track.audioBuffer);
    }
  }, [chain, drawWaveform]);
  
  // Spectrogram ready handler
  const handleSpectrogramReady = useCallback((_chainId, canvas) => {
    drawSpectrogram(canvas);
  }, [drawSpectrogram]);
  
  // Frequency canvas ready handler
  const handleFrequencyCanvasReady = useCallback((canvas) => {
    registerCanvas('frequency', canvas);
  }, [registerCanvas]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <Toaster />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              🎧 EDM Chain Builder Pro
            </h1>
            <button
              onClick={logger.toggle}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Terminal className="w-3 h-3" />
              Console {logger.isOpen ? '▼' : '▶'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Grid Layout */}
      <div className="container mx-auto p-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-[calc(100vh-100px)]">
          {/* Left Panel - Track Library */}
          <div className="lg:col-span-3 h-full overflow-hidden">
            <Suspense fallback={<LoadingSpinner />}>
              <TrackLibrary
                tracks={tracks}
                onFileUpload={handleFileUpload}
                onTrackDoubleClick={handleTrackPlay}
                onTrackStop={handleTrackStop}
              />
            </Suspense>
          </div>
          
          {/* Main Workspace - Chain Builder */}
          <div className="lg:col-span-6 h-full overflow-hidden">
            <Suspense fallback={<LoadingSpinner />}>
              <ChainBuilder
                chain={chain}
                onDrop={handleChainDrop}
                onTrackPlay={handleTrackPlay}
                onTrackEdit={(_chainId) => toast({ title: "Edit", description: "Track editing coming soon!" })}
                onTrackRemove={handleTrackRemove}
                onTransitionChange={updateTransition}
                onWaveformReady={handleWaveformReady}
                onSpectrogramReady={handleSpectrogramReady}
              />
            </Suspense>
          </div>
          
          {/* Right Panel - Analysis & Debug */}
          <div className="lg:col-span-3 h-full overflow-hidden">
            <div className="h-full overflow-y-auto space-y-4">
              <Suspense fallback={<LoadingSpinner />}>
                <AnalysisPanel
                  chain={chain}
                  compatibility={calculateChainCompatibility()}
                  onFrequencyCanvasReady={handleFrequencyCanvasReady}
                />
                <DebugMonitor
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  chain={chain}
                  audioEngine={audioEngine}
                  getMeterValue={getMeterValue}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transport Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-2">
        <div className="container mx-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <TransportControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              totalDuration={calculateChainDuration()}
              onPlay={handleTogglePlayback}
              onStop={handleStop}
              onPreview={handlePreviewTransition}
              onExportChain={handleExportChain}
              onRenderMix={handleRenderMix}
            />
          </Suspense>
        </div>
      </div>
      
      {/* Console Drawer */}
      <Suspense fallback={null}>
        <ConsoleDrawer
          logs={logger.logs}
          isOpen={logger.isOpen}
          onClear={logger.clear}
          onToggle={logger.toggle}
          onClose={logger.close}
        />
      </Suspense>
    </div>
  );
};