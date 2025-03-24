// Main entry point for Fourier visualization components
import FourierSeriesDemo from './FourierSeriesDemo';
import FourierTransformDemo from './FourierTransformDemo';
import FourierVisualizerTabs from './FourierVisualizerTabs';

// UI Components
import SignalCanvas from './components/SignalCanvas';
import FrequencySpectrumPlot from './components/FrequencySpectrumPlot';
import ControlPanel from './components/ControlPanel';
import PresetSelector from './components/PresetSelector';
import EpicyclesVisualizer from './components/EpicyclesVisualizer';
import ExplanationPanel from './components/ExplanationPanel';

// Custom hooks
import { useFourierTransform } from './hooks/useFourierTransform';
import { useFourierSeries } from './hooks/useFourierSeries';
import { useAnimationFrame } from './hooks/useAnimationFrame';
import { useResponsiveCanvas } from './hooks/useResponsiveCanvas';
import { useSignalDrawing } from './hooks/useSignalDrawing';

// Export main components
export {
  // Main components
  FourierSeriesDemo,
  FourierTransformDemo,
  FourierVisualizerTabs,
  
  // UI Components
  SignalCanvas,
  FrequencySpectrumPlot,
  ControlPanel,
  PresetSelector,
  EpicyclesVisualizer,
  ExplanationPanel,
  
  // Custom hooks
  useFourierTransform,
  useFourierSeries,
  useAnimationFrame,
  useResponsiveCanvas,
  useSignalDrawing
};
