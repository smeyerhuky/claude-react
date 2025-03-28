import { useState } from 'react'
import './App.css'

// Component imports
import RechartsExample from './components/RechartsExample'
import AnimationExample from './components/AnimationExample'
import PendulumSimulation from './components/Pendulum'
import TimeSeriesEPM from './components/ReleaseArticle'
import VSCodeAnimation from './components/VSCodeAnimation'
// import ImageManipulator from './components/ImageManipulator/ImageManipulator'
import ArticlePage from './components/WebArticle'
// import GitHubActionsMobileManager from './components/thehub/github-actions-mobile-ui'
// import MotionAmplification from './components/vid/VideoDemo'
// import PulseDetectionVisualizer from './components/vid/PulseExample'
import FourierSeriesExplorer from './components/fourier/demos/FourierFirst'
import FourierSeriesTeacher from './components/fourier/demos/Teacher'
// import { FourierVisualizerTabs } from './components/FourierVisualizations';
import NetworkQueuesBlog from './network-queue-blog-rendered'
import DistributedQueuesBlog from './DistributedArticlePart1'
// import DistributedQueuesBlogPart2 from './DistributedArticlePart2'
import ProjectTracker from './components/project-tracker.jsx'

// Component keys enum
const COMPONENTS = {
  CV: 'CV',
  NET: 'net',
  Q1: 'dist-1',
  // Q2: 'dist-2',
  // FOURIER_TABS: 'fouriter-tabs',
  FOURIER: 'fourier',
  FOURIER_TEACHER: 'fourier-teacher',
  // PULSE: 'pulse-demo',
  // GH_DEMO: 'gh-demo',
  // IMAGE_DEMO: 'image-demo',
  ARTICLE_DEMO: 'article-demo',
  CODE_DEMO: 'code-demo',
  RECHARTS_DEMO: 'recharts-demo',
  ANIMATION_DEMO: 'animation-demo',
  PENDULUM_DEMO: 'pendulum-demo',
  // AMPLIFY_DEMO: 'motion-demo',
  RM: 'rm'
}

// Navigation items configuration
const navigationItems = [
  { id: COMPONENTS.CV, label: 'CV Blog', component: TimeSeriesEPM },
  { id: COMPONENTS.RM, label: "PmRm", component: ProjectTracker },
  { id: COMPONENTS.Q1, label: "Distributed Part 1", component: DistributedQueuesBlog },
  // { id: COMPONENTS.Q2, label: "Distributed Part 2", component: DistributedQueuesBlogPart2 },
  { id: COMPONENTS.NET, label: "Networks", component: NetworkQueuesBlog },
  // { id: COMPONENTS.FOURIER_TABS, label: 'FourierMain', component: FourierVisualizerTabs },
  { id: COMPONENTS.FOURIER, label: 'Drawing With Fourier', component: FourierSeriesExplorer },
  { id: COMPONENTS.FOURIER_TEACHER, label: 'Teaching Fouriers', component: FourierSeriesTeacher },
  // { id: COMPONENTS.PULSE, label: 'Pulse Demo', component: PulseDetectionVisualizer },
  // { id: COMPONENTS.GH_DEMO, label: 'GH Demo', component: GitHubActionsMobileManager },
  // { id: COMPONENTS.IMAGE_DEMO, label: 'Image Manipulation Demo', component: ImageManipulator },
  { id: COMPONENTS.ARTICLE_DEMO, label: 'Tau - XIAO ESP32S3 Sense Article', component: ArticlePage },
  { id: COMPONENTS.CODE_DEMO, label: 'VSCode Demo', component: VSCodeAnimation },
  { id: COMPONENTS.RECHARTS_DEMO, label: 'Recharts Demo', component: RechartsExample },
  { id: COMPONENTS.ANIMATION_DEMO, label: 'Animation Demo', component: AnimationExample },
  { id: COMPONENTS.PENDULUM_DEMO, label: 'Pendulum Demo', component: PendulumSimulation },
  // { id: COMPONENTS.AMPLIFY_DEMO, label: 'Motion Amp Demo', component: MotionAmplification }
]

// Navigation component
const NavItem = ({ id, label, isActive, onClick }) => (
  <button
    className={`py-2 px-4 font-medium ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
    onClick={() => onClick(id)}
  >
    {label}
  </button>
)

function App() {
  // State to track which component is active
  const [activeComponent, setActiveComponent] = useState(COMPONENTS.CV)
  const [isNavOpen, setIsNavOpen] = useState(false)

  // Get active component from configuration
  const getActiveComponent = () => {
    const item = navigationItems.find(item => item.id === activeComponent)
    return item ? <item.component /> : <FourierSeriesExplorer />
  }

  // Find the active navigation item
  const activeNavItem = navigationItems.find(item => item.id === activeComponent)

  return (
    <div className="app-container">
      {/* Navigation Bar - Responsive with dropdown for smaller screens */}
      <nav className="border-b mb-4">
        <div className="hidden md:flex">
          {/* Desktop navigation - full tabs */}
          {navigationItems.map(item => (
            <NavItem
              key={item.id}
              id={item.id}
              label={item.label}
              isActive={activeComponent === item.id}
              onClick={setActiveComponent}
            />
          ))}
        </div>

        {/* Mobile navigation - dropdown */}
        <div className="md:hidden relative">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="w-full py-2 px-4 flex justify-between items-center bg-white border-b"
          >
            <span className="font-medium">{activeNavItem?.label || 'Select Component'}</span>
            <svg
              className={`w-5 h-5 transition-transform ${isNavOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isNavOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border shadow-lg z-10">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  className={`w-full text-left py-3 px-4 hover:bg-gray-100 ${activeComponent === item.id ? 'bg-blue-50 text-blue-600' : ''}`}
                  onClick={() => {
                    setActiveComponent(item.id)
                    setIsNavOpen(false)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Content Area */}
      <div className="content-area">
        {getActiveComponent()}
      </div>
    </div>
  )
}

export default App
