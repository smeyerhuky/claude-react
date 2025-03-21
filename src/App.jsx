import './App.css'
import { useState } from 'react'

// Component imports
import RechartsExample from './components/RechartsExample'
import AnimationExample from './components/AnimationExample'
import PendulumSimulation from './components/Pendulum'
import VSCodeAnimation from './components/VSCodeAnimation'
import ImageManipulator from './components/ImageManipulator'
import ArticlePage from './components/WebArticle'

function App() {
  // State to track which component is active
  const [activeComponent, setActiveComponent] = useState('article-demo')

  // Function to render the active component
  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'recharts-demo':
        return <RechartsExample />
      case 'animation-demo':
        return <AnimationExample />
      case 'pendulum-demo':
        return <PendulumSimulation />
      case 'code-demo':
        return <VSCodeAnimation />
      case 'image-demo':
        return <ImageManipulator />
      case 'article-demo':
        return <ArticlePage />
        default:
        return <ArticlePage />
    }
  }

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="border-b mb-4">
        <div className="flex">
          <button
            className={`py-2 px-4 font-medium ${activeComponent === 'article-demo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveComponent('article-demo')}
          >
            Tau - XIAO ESP32S3 Sense Article
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeComponent === 'image-demo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveComponent('image-demo')}
          >
            Image Manipulation Demo
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeComponent === 'code-demo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveComponent('code-demo')}
          >
            VSCode Demo
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeComponent === 'recharts-demo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveComponent('recharts-demo')}
          >
            Recharts Demo
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeComponent === 'animation-demo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveComponent('animation-demo')}
          >
            Animation Demo
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeComponent === 'animation-demo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveComponent('pendulum-demo')}
          >
            Pendulum Demo
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <div className="content-area">
        {renderActiveComponent()}
      </div>
    </div>
  )
}

export default App
