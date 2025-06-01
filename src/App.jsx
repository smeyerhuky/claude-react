// import { useState, useEffect } from 'react'
import { Routes, Route, useParams, useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
import './App.css'

import MediterraneanMealPlanner from './components/medi/MediterraneanMealPlanner'
import MediterraneanMealPlanOriginal from './components/medi/MediterraneanMealPlanOriginal'
import MonteCarloProjectSimulator from './components/monte/MonteCarloProjectSimulator'
import MonteCarloAdvancedTutorial from'./components/monte/MonteCarloAdvancedTutorial'
import MatrixExplorer from './components/MatrixExplorer'
import EnhancedMatrixExplorerV2 from './components/EnhancedMatrixExplorerV2'
import TaubyteMeshPresentation from './components/TaubyteMeshPresentation'
import FrontendConceptsGuide from './components/FrontendConceptsGuide'
import ImageSonificationDJMixer from './components/sonic/ImageSonificationDJMixer'
import ImageSonificationDJMixerEnhanced from './components/sonic/ImageSonificationDJMixerEnhanced'
import DJSonificationTool from './components/sonic/DJSonificationTool'
import TabbedMuffinRecipes from './components/TabbedMuffinRecipes'
import UnifiedDashboard from './components/UnifiedDashboard'
import BackyardScience from './components/BackyardScience'
import MeshEdLanding from './components/MeshEdLanding'
import SVGMeshNetworkSimulator from './components/SVGMeshNetworkSimulator'
import MeshEdAnnouncement from './components/MeshEdAnnouncement'
import PromptEngineeringStateMachine from './components/PromptEngineeringStateMachine'
import SimplifiedNeuralVisualizer from './components/nn/SimplifiedNeuralVisualizer'
import LogarithmBaseConversion from './components/maths/LogarithmBaseConversion'
import DistributedFrameworkAnalysis from './DistributedArticlePart2'
import { EDMMixer } from './components/edm-mixer'
import MotionExtractionStudio from './components/motion/MotionExtractionStudio'
import VideoMotionToolkit from './components/motion/VideoMotionToolkit'
import MotionStudio from './components/motion/MotionStudio'
import StreamlinedMotionStudio from './components/motion/StreamlinedMotionStudio'
import HighPerformanceMotionStudio from './components/motion/HighPerformanceMotionStudio'

// Navigation items configuration
const navigationItems = [
  { id: 'edm-mixer', label: "EDM Chain Builder Pro", component: EDMMixer },
  { id: 'logarithms', label: "Learning Log Maths", component: LogarithmBaseConversion },
  { id: 'mediterranean-diet-v1', label: "Mediterranean Diet", component: MediterraneanMealPlanOriginal },
  { id: 'server', label: "Server Spec Proposal", component: DistributedFrameworkAnalysis },
  { id: 'muffins', label: "Muffins GF/DF/NF", component: TabbedMuffinRecipes },
  { id: 'prompt-engineering', label: "Prompt Engineering Tutorial", component: PromptEngineeringStateMachine },
  { id: 'nn-visual', label: "Prompt Engineering Visualization", component: SimplifiedNeuralVisualizer },
  { id: 'mesh-ed', label: "MeshEd", component: MeshEdLanding },
  { id: 'mesh-network', label: "Mesh Network Simulator", component: SVGMeshNetworkSimulator },
  { id: 'meshed-announcement', label: "MeshEd Announcement", component: MeshEdAnnouncement },
  { id: 'dj-sonic', label: "DJ Sonification Sampler", component: ImageSonificationDJMixer },
  { id: 'mediterranean-diet', label: "Mediterranean Diet Starter Kit", component: MediterraneanMealPlanner },
  { id: 'sim', label: 'Simulator', component: MonteCarloProjectSimulator },
  { id: 'gear-sim', label: 'Gear Simulator', component: UnifiedDashboard },
  { id: 'adv_tut', label: 'Advanced Monte Carlo Tutorial', component: MonteCarloAdvancedTutorial },
  { id: 'matrices', label: "Matrix Transforms", component: MatrixExplorer },
  { id: 'mv2', label: "Matrix Transforms V2", component: EnhancedMatrixExplorerV2 },
  { id: 'tau-mesh', label: "Tau Mesh Examples", component: TaubyteMeshPresentation },
  { id: 'frontend', label: "Learning Frontend Systems", component: FrontendConceptsGuide },
  { id: 'Sonify', label: "Digital Sonification", component: ImageSonificationDJMixerEnhanced },
  { id: 'SoniQToo', label: "SoniQ", component: DJSonificationTool },
  { id: 'backyard-science', label: "Backyard Science", component: BackyardScience },
  { id: 'motion-extraction', label: "Motion Extraction Studio", component: MotionExtractionStudio },
  { id: 'video-motion-toolkit', label: "Video Motion Toolkit", component: VideoMotionToolkit },
  { id: 'motion-studio', label: "Motion Studio", component: MotionStudio },
  { id: 'streamlined-motion-studio', label: "Streamlined Motion Studio", component: StreamlinedMotionStudio },
  { id: 'high-performance-motion-studio', label: "High Performance Motion Studio", component: HighPerformanceMotionStudio },
]

// Home page component showing all available components as cards
function HomePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {navigationItems.map(item => (
        <Link 
          key={item.id}
          to={`/${item.id}`} 
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-colors"
        >
          <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{item.label}</h3>
          <p className="text-gray-600">Click to view this component</p>
        </Link>
      ))}
    </div>
  );
}

// Component wrapper that handles the active tab parameter
function TabComponent() {
  const { activeTab } = useParams();
  const navigate = useNavigate();
  
  // Check if this is a full-screen component
  const isFullScreenComponent = activeTab === 'edm-mixer';
  
  // Get component for the active tab
  const getActiveComponent = () => {
    const item = navigationItems.find(item => item.id === activeTab);
    return item ? (
      <div className={isFullScreenComponent ? "h-screen w-screen overflow-hidden" : ""}>
        {!isFullScreenComponent && (
          <div className="flex items-center mb-4 p-2 bg-gray-50 border-b">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 mr-4 flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
            <h2 className="text-lg font-semibold">{item.label}</h2>
          </div>
        )}
        <div className={isFullScreenComponent ? "" : "px-4"}>
          <item.component />
        </div>
      </div>
    ) : <Navigate to="/" />;
  }

  return getActiveComponent();
}

// Active component handler for /s/:active_component route
function ActiveComponentHandler() {
  const { active_component } = useParams();
  const navigate = useNavigate();
  
  // Find the component by ID
  const item = navigationItems.find(item => item.id === active_component);
  
  // Check if this is a full-screen component that needs special handling
  const isFullScreenComponent = active_component === 'edm-mixer';
  
  return item ? (
    <div className={isFullScreenComponent ? "h-screen w-screen overflow-hidden" : ""}>
      {!isFullScreenComponent && (
        <div className="flex items-center mb-4 p-2 bg-gray-50 border-b">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 mr-4 flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
          <h2 className="text-lg font-semibold">{item.label}</h2>
        </div>
      )}
      <div className={isFullScreenComponent ? "" : "px-4"}>
        <item.component />
      </div>
    </div>
  ) : <div>Component not found</div>;
}

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isEDMMixer = location.pathname === '/edm-mixer' || location.pathname === '/s/edm-mixer';

  return (
    <div className={isEDMMixer ? "h-screen w-screen overflow-hidden" : "app-container"}>
      {/* Only show navigation on home page */}
      {isHomePage && (
        <header className="py-4 px-6 bg-white border-b">
          <h1 className="text-2xl font-bold text-gray-800">Shuky&apos;s Demos & Components</h1>
          <p className="text-gray-600">Select a component to view</p>
        </header>
      )}

      {/* Content Area with Routes */}
      <div className={isEDMMixer ? "h-full w-full" : "content-area"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:activeTab" element={<TabComponent />} />
          <Route path="/s/:active_component" element={<ActiveComponentHandler />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
