# React Showcase UI

A simple framework for showcasing different React components and visualizations with an easy-to-use navigation system.

## Requirements

- Node.js version: v21.x or higher (check .nvmrc file for specific version)
- npm (Node Package Manager)
- Yarn (recommended for package management)

## Getting Started

### Clone the Repository

```bash
git clone git@github.com/smeyerhuky/claude-react/
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

## Purpose

This project serves as a sandbox for experimenting with and showcasing React components generated AI. It provides a convenient way to visualize and interact with different UI elements and charts in a single application.

It also provides a good set of instructions for setting up a React project with Vite, Tailwind CSS, and Recharts, making it a useful reference for future projects.

