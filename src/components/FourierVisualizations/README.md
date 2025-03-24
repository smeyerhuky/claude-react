# Fourier Visualizations Component

An interactive React component suite for teaching and visualizing Fourier transforms and Fourier series concepts. This toolkit provides interactive visualizations that help users understand the relationship between time domain signals and their frequency domain representations.

## Features

- Interactive signal drawing with real-time Fourier transform visualization
- Fourier series approximation with adjustable number of terms
- Preset signal patterns with educational explanations
- Responsive design for desktop and mobile devices
- Accessible controls with keyboard navigation support

## Installation

Follow these steps to add the Fourier Visualizations components to your project:

```bash
# Create the necessary directory structure
mkdir -p src/components/FourierVisualizations/{components,hooks,utils}

# Create the main component files
touch src/components/FourierVisualizations/index.js
touch src/components/FourierVisualizations/FourierSeriesDemo.jsx
touch src/components/FourierVisualizations/FourierTransformDemo.jsx
touch src/components/FourierVisualizations/FourierVisualizerTabs.jsx

# Create component files
touch src/components/FourierVisualizations/components/SignalCanvas.jsx
touch src/components/FourierVisualizations/components/FrequencySpectrumPlot.jsx
touch src/components/FourierVisualizations/components/ControlPanel.jsx
touch src/components/FourierVisualizations/components/PresetSelector.jsx
touch src/components/FourierVisualizations/components/EpicyclesVisualizer.jsx
touch src/components/FourierVisualizations/components/ExplanationPanel.jsx

# Create custom hooks
touch src/components/FourierVisualizations/hooks/useFourierTransform.js
touch src/components/FourierVisualizations/hooks/useFourierSeries.js
touch src/components/FourierVisualizations/hooks/useAnimationFrame.js
touch src/components/FourierVisualizations/hooks/useResponsiveCanvas.js
touch src/components/FourierVisualizations/hooks/useSignalDrawing.js

# Create utility files
touch src/components/FourierVisualizations/utils/mathUtils.js
touch src/components/FourierVisualizations/utils/drawingUtils.js
touch src/components/FourierVisualizations/utils/presets.js
```

## Integration with App.jsx

After creating all the necessary files, you need to integrate the Fourier visualization components into your main application. Add the following code to your `App.jsx` file:

```jsx
// In your App.jsx file
import { FourierVisualizerTabs } from './components/FourierVisualizations';

function App() {
  // ... existing code ...

  return (
    <div className="app-container">
      {/* ... existing components ... */}
      
      {/* Add the Fourier Visualization component */}
      <div className="content-area">
        <FourierVisualizerTabs />
      </div>
    </div>
  );
}

export default App;
```

If you're using the component navigation system as shown in the project files, you can integrate it by adding it to your navigation items array:

```jsx
// In your App.jsx file
import { FourierVisualizerTabs } from './components/FourierVisualizations';

// ... existing code ...

const navigationItems = [
  // ... existing navigation items ...
  { 
    id: 'fourier-visualizer', 
    label: 'Fourier Visualizer', 
    component: FourierVisualizerTabs 
  },
];

// ... rest of your App.jsx code ...
```

## Component Architecture

The Fourier visualization toolkit is organized as follows:

1. **Main Components**:
   - `FourierVisualizerTabs`: Container component with tabs for different visualizations
   - `FourierSeriesDemo`: Interactive demonstration of Fourier series approximation
   - `FourierTransformDemo`: Real-time visualization of Fourier transforms

2. **UI Components**:
   - `SignalCanvas`: Canvas for drawing and displaying signals
   - `FrequencySpectrumPlot`: Visualization of frequency domain representation
   - `ControlPanel`: Adjustable parameters for the visualizations
   - `PresetSelector`: Predefined signal patterns
   - `EpicyclesVisualizer`: Visualization of Fourier series using epicycles
   - `ExplanationPanel`: Educational content explaining the concepts

3. **Custom Hooks**:
   - `useFourierTransform`: Computes Discrete Fourier Transform
   - `useFourierSeries`: Computes Fourier series coefficients
   - `useAnimationFrame`: Manages animation timing
   - `useResponsiveCanvas`: Handles canvas resizing
   - `useSignalDrawing`: Manages drawing interaction on canvas

4. **Utilities**:
   - `mathUtils.js`: Mathematical functions for Fourier calculations
   - `drawingUtils.js`: Helper functions for canvas drawing
   - `presets.js`: Predefined signal patterns with explanations

Each component is designed to be used independently or as part of the complete visualization system.

## Usage

The main component can be used as follows:

```jsx
import { FourierVisualizerTabs } from './components/FourierVisualizations';

function MyComponent() {
  return (
    <div className="container">
      <h1>Fourier Visualizations</h1>
      <FourierVisualizerTabs />
    </div>
  );
}
```

For more specific use cases, you can import individual components:

```jsx
import { FourierSeriesDemo, FourierTransformDemo } from './components/FourierVisualizations';

function MyCustomComponent() {
  return (
    <div className="container">
      <h2>Fourier Series</h2>
      <FourierSeriesDemo />
      
      <h2>Fourier Transform</h2>
      <FourierTransformDemo />
    </div>
  );
}
```

## Extending the Components

Each component is designed to be easily extended or modified. For example, to add a new preset signal:

1. Add the new preset to `utils/presets.js`
2. It will automatically appear in the preset selector

To modify the visualization style:

1. Update the relevant drawing functions in `utils/drawingUtils.js`
2. The changes will be reflected across all visualizations

## Mobile Support

The components include touch event handling for drawing signals on mobile devices and responsive layouts that adapt to different screen sizes.