import { useState } from 'react'
import './App.css'

// Component imports
import TimeSeriesEPM feom './components/TimeSeriesEPM'
import NetworkQueuesBlog from './network-queue-blog-rendered'
import DistributedQueuesBlog from './DistributedArticlePart1'
import ProjectTracker from './components/project-tracker'
import ProjectManagementMatrix from './components/pm/ProjectManagementMatrix’
import ProjectShift from './components/pm/ProjectShift'
import ProjectShiftPro from './components/pm/ProjectShiftPro'

// Component keys enum
const COMPONENTS = {
  CV: 'cv',
  NET: 'net',
  D1: 'dist',
  RM: 'rm',
  shift: 'shift',
  shiftpro: 'shiftpro',
  matrices: 'matrices',
}

// Navigation items configuration
const navigationItems = [  
  { id: COMPONENTS.shiftpro, label: "ProjectShift Pro", component: ProjectShiftPro },
  { id: COMPONENTS.shift, label: "Shift (simplified)", component: ProjectShift },
  { id: COMPONENTS.matrices, label: '"[The Matrix]"', component: ProjectManagementMatrix },
  { id: COMPONENTS.cv, label: "CV Concept", component: TimeSeriesEPM },
  { id: COMPONENTS.rm, label: "PM - RM", component: ProjectTracker },
  { id: COMPONENTS.dist, label: "Distributed Part 1", component: DistributedQueuesBlog },
  { id: COMPONENTS.NET, label: "Networks", component: NetworkQueuesBlog },
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
  const [activeComponent, setActiveComponent] = useState(COMPONENTS.matrices)
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
