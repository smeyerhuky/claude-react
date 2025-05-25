# EDM Chain Builder Pro

A professional-grade React component for creating EDM track chains with real-time audio analysis and mixing capabilities.

## Features

🎵 **Track Management**
- Drag & drop audio file upload (MP3, WAV, OGG)
- Automatic track analysis (BPM, key detection)
- Track categorization (Major, Filler, Sample, Effect)
- Visual waveform and spectrogram display

🎛️ **Chain Building**
- Intuitive drag & drop chain builder
- Multiple transition types (Crossfade, Cut, Echo, Filter, Reverse)
- Real-time compatibility scoring
- Visual timeline with playback position

📊 **Real-time Analysis**
- Frequency spectrum analyzer
- Harmonic wheel for key matching
- Performance monitoring
- Debug console with metrics

🎧 **Audio Engine**
- Powered by Tone.js
- Real-time audio processing
- Professional-grade effects
- Low-latency playback

## Usage

The component is automatically available in the main navigation as "EDM Chain Builder Pro".

### Basic Workflow

1. **Upload Tracks**: Click "Add Tracks" or drag audio files into the library
2. **Build Chain**: Drag tracks from library to chain builder
3. **Configure Transitions**: Select transition types for each track
4. **Play & Preview**: Use transport controls to play the chain
5. **Export**: Export your chain configuration as JSON

### Performance Optimizations

- React.memo for component memoization
- useCallback for event handler optimization
- Lazy loading with Suspense
- Efficient canvas rendering
- Proper audio resource cleanup

## Architecture

```
edm-mixer/
├── EDMMixer.jsx           # Main component
├── components/            # UI components
│   ├── TrackLibrary.jsx   # Track management
│   ├── ChainBuilder.jsx   # Chain building interface
│   ├── AnalysisPanel.jsx  # Audio analysis
│   ├── TransportControls.jsx # Playback controls
│   └── DebugMonitor.jsx   # Performance monitoring
├── hooks/                 # Custom hooks
│   ├── useAudioEngine.js  # Tone.js management
│   ├── useTrackManager.js # Track state management
│   └── useVisualization.js # Canvas visualizations
└── index.js              # Exports
```

## Dependencies

- Tone.js 15.1.22 (audio processing)
- Radix UI components (UI primitives)
- Lucide React (icons)
- Tailwind CSS (styling)

## Browser Support

- Chrome/Edge 88+ (Web Audio API support)
- Firefox 84+ 
- Safari 14.1+

## Notes

- Requires user interaction to initialize audio context
- Large audio files may take time to analyze
- Performance monitoring shows real-time metrics
- Export functionality saves chain configuration only