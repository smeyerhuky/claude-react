# Claude React UI Demo

This is a demo space for importing and testing React artifacts from Claude's web UI. The application provides a simple framework for showcasing different React components and visualizations with an easy-to-use navigation system.

## Requirements

- Node.js version: 18.x or higher (check .nvmrc file for specific version)
- npm (Node Package Manager)
- Yarn (recommended for package management)

## Getting Started

### Clone the Repository

```bash
git clone git@github.com:smeyerhuky/claude-react.git
cd claude-react
```

### Install Dependencies

```bash
yarn
```

### Run Development Server

```bash
yarn dev
```

This will start a local development server, typically at http://localhost:5173/

## Adding New Components

To add a new component to the navigation system in App.jsx, follow these steps:

1. Create your new component in the `src/components` directory
2. Import the component at the top of App.jsx:
   ```jsx
   import YourNewComponent from './components/YourNewComponent'
   ```

3. Add a new case in the `renderActiveComponent` function:
   ```jsx
   // Function to render the active component
   const renderActiveComponent = () => {
     switch (activeComponent) {
       case 'recharts-demo':
         return <RechartsExample />
       case 'animation-demo':
         return <AnimationExample />
       case 'your-new-component': // Add this new case
         return <YourNewComponent />
       default:
         return <RechartsExample />
     }
   }
   ```

4. Add a new button in the navigation bar:
   ```jsx
   <button
     className={`py-2 px-4 font-medium ${activeComponent === 'your-new-component' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
     onClick={() => setActiveComponent('your-new-component')}
   >
     Your New Demo
   </button>
   ```

## Project Structure

- `src/components`: Contains all demo components
- `src/App.jsx`: Main application file with navigation system
- `src/lib`: Utility functions and reusable code
- `src/assets`: Static assets like images and icons

## Purpose

This project serves as a sandbox for experimenting with and showcasing React components generated by Claude AI. It provides a convenient way to visualize and interact with different UI elements and charts in a single application.
