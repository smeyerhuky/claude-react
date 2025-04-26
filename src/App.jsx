import { useState, useEffect } from 'react'
import { Routes, Route, useParams, useNavigate, NavLink, useLocation } from 'react-router-dom'
import './App.css'

import MonteCarloProjectSimulator from './components/monte/MonteCarloProjectSimulator'
import MonteCarloAdvancedTutorial from'./components/monte/MonteCarloAdvancedTutorial'
import VideoToMusicApp from './components/VideoToMusicApp'
import EnhancedVideoAnalyzer from './components/EnhancedVideoAnalyzer'
import MatrixExplorer from './components/MatrixExplorer'
import EnhancedMatrixExplorerV2 from './components/EnhancedMatrixExplorerV2'
import TaubyteMeshPresentation from './components/TaubyteMeshPresentation'
import CoSAEDemo from './components/CoSAEDemo'

// Navigation items configuration
const navigationItems = [  
  { id:'sim', label: 'Simulator', component: MonteCarloProjectSimulator },
  { id: 'adv_tut', label: 'Advanced Monte Carlo Tutorial', component: MonteCarloAdvancedTutorial },
  { id: 'vids', label: "Video <> Music", component: VideoToMusicApp },
  { id: 'vids_2', label: "Video Transformer", component: EnhancedVideoAnalyzer },
  { id: 'matrices', label: "Matrix Transforms", component: MatrixExplorer },
  { id: 'mv2', label: "Matrix Transforms V2", component: EnhancedMatrixExplorerV2 },
  { id: 'tau-mesh', label: "Tau Mesh Examples", component: TaubyteMeshPresentation },
  { id: 'cosae', label: "CoSAE Demo", component: CoSAEDemo },
]

// Component wrapper that handles the active tab parameter
function TabComponent() {
  const { activeTab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // If no tab is specified, redirect to the default tab
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/adv_tut');
    }
  }, [location.pathname, navigate]);

  // Get component for the active tab
  const getActiveComponent = () => {
    const item = navigationItems.find(item => item.id === activeTab);
    return item ? <item.component /> : null;
  }

  return getActiveComponent();
}

// Active component handler for /s/:active_component route
function ActiveComponentHandler() {
  const { active_component } = useParams();
  
  // Find the component by ID
  const item = navigationItems.find(item => item.id === active_component);
  return item ? <item.component /> : <div>Component not found</div>;
}

// Navigation component using NavLink for routing
const NavItem = ({ id, label }) => (
  <NavLink
    to={`/${id}`}
    className={({ isActive }) => 
      `py-2 px-4 font-medium ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`
    }
  >
    {label}
  </NavLink>
)

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'adv_tut';

  // Find the active navigation item for mobile dropdown display
  const activeNavItem = navigationItems.find(item => item.id === activeTab);

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
                <NavLink
                  key={item.id}
                  to={`/${item.id}`}
                  className={({ isActive }) => 
                    `block w-full text-left py-3 px-4 hover:bg-gray-100 ${isActive ? 'bg-blue-50 text-blue-600' : ''}`
                  }
                  onClick={() => setIsNavOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Content Area with Routes */}
      <div className="content-area">
        <Routes>
          <Route path="/" element={<TabComponent />} />
          <Route path="/:activeTab" element={<TabComponent />} />
          <Route path="/s/:active_component" element={<ActiveComponentHandler />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
