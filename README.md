# React Showcase UI

A simple framework for showcasing different React components and visualizations with an easy-to-use navigation system.

## Requirements

- Node.js version: v21.x or higher (check .nvmrc file for specific version)
- npm (Node Package Manager)
- Yarn (recommended for package management)

## Getting Started

### Clone the Repository

```bash
git clone git@github.com:smeyerhuky/claude-react.git
cd react-showcase
```

### Install Dependencies

```bash
yarn
```

### Run Development Server

```bash
yarn dev
```

This will start a local development server, typically at http://localhost:5173/ (or 5174, 5175, etc. if 5173 is in use). Open this URL in your web browser to view the application.

## Adding New Components

To add a new component to the navigation system in App.jsx, follow these steps:

1. Create your new component in the `src/components` directory
2. Import the component at the top of App.jsx:
   ```jsx
   import YourNewComponent from './components/YourNewComponent'
   ```

3. Update the navigationItems array to include your new component:
   ```jsx
   const navigationItems = [
     { name: 'Recharts Demo', component: 'recharts-demo' },
     { name: 'Animation Demo', component: 'animation-demo' },
     { name: 'Your New Demo', component: 'your-new-component' } // Add this new item
   ];
   ```

4. Test it out!!!


## Project Structure

- `src/App.jsx`: Main application file with navigation system
- `src/components`: Contains all demo components
- `src/components/ui/`: Shadow UI components - these are the components that are used to build the UI of the application. They are not meant to be used as standalone components, but rather as building blocks for other components.
- `src/assets`: Static assets like images and icons
- `src/public`: Public assets that are served directly
- `src/lib`: Utility functions and reusable code

## Recent Enhancements

### Advanced Spectrogram V2 - String Visualization Improvements

The Advanced Spectrogram component has been significantly enhanced with cutting-edge visual improvements:

#### 🎨 **Visual Enhancements**
- **Dynamic Pulsing Fields**: Replaced static circular blob with shader-based pulsing areas that respond to audio frequencies
- **Varied Particle Shapes**: String particles now cycle through squares, triangles, diamonds, and line streaks instead of circles
- **Reactive Interaction Areas**: Visual zones appear where audio processing is actively affecting the visualization
- **Frequency-Based Morphing**: String segments morph dynamically based on bass, mid, and high frequency content:
  - Bass regions: Square-like wave segments
  - Mid regions: Triangular wave patterns  
  - High regions: Sharp, jagged morphing

#### 🎵 **Audio Physics Improvements**
- **Musical String Frequencies**: Strings now correspond to actual guitar frequencies (E-A-D-G-B-E)
- **Enhanced String Physics**: Improved tension, damping, and particle trail systems
- **Smart Layout Options**: Multiple string arrangements (horizontal, vertical, centered, mirrored)
- **Dynamic Thickness**: String thickness responds to sustained energy and frequency content

#### 🔧 **Technical Fixes**
- **Shader Compatibility**: Fixed Vector3 uniform methods for cross-browser compatibility
- **AudioContext Reliability**: Resolved initialization issues and improved start/stop functionality
- **Error Handling**: Added comprehensive fallback mechanisms and error recovery
- **Performance Optimization**: Better function ordering and memory management

#### 🎛️ **New Features**
- **Shape-Based Vibration Indicators**: Different shapes for bass (hexagons), mid (rotating squares), and high (star bursts) frequencies
- **Morphing Endpoints**: String endpoints change shape based on frequency content
- **Particle Trails**: Enhanced trail systems with gravity and lifecycle management
- **Background Pulses**: Reactive background areas that pulse with audio energy

These improvements create a more immersive and responsive audio visualization experience that moves beyond simple circular shapes to provide rich, frequency-aware visual feedback.

## Purpose

This project serves as a sandbox for experimenting with and showcasing React components generated AI. It provides a convenient way to visualize and interact with different UI elements and charts in a single application.

It also provides a good set of instructions for setting up a React project with Vite, Tailwind CSS, and Recharts, making it a useful reference for future projects.

