import { useState } from 'react'
import './App.css'

// import MonteCarloTutorial from './components/monte/MonteCarloTutorial'
import MonteCarloProjectSimulator from './components/monte/MonteCarloProjectSimulator'
import MonteCarloAdvancedTutorial from './components/monte/MonteCarloAdvancedTutorial'
import VideoToMusicApp from './components/VideoToMusicApp'
// import InteractivePMTensor from './components/monte/InteractivePMTensor'
// import Calendar from './components/Calendar'
// import AudioClassificationPipeline from './components/AudioClassificationPipeline'


// Navigation items configuration
const navigationItems = [  
  { id:'sim', label: 'Simulator', component: MonteCarloProjectSimulator },
  // { id: 'tut', label: 'Tutorial', component: MonteCarloTutorial }, 
  { id: 'adv_tut', label: 'Advanced Monte Carlo Tutorial', component: MonteCarloAdvancedTutorial },
  { id: 'vids', label: "Video <> Music", component: VideoToMusicApp },
//  { id: 'tensors', label: 'An example of a tensor matrix', component: InteractivePMTensor },
  // { id: 'cal', label: 'Calendar Demo', component: Calendar },
  // { id: 'classy', label: 'Audio Tools', component: AudioClassificationPipeline },
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
  const [activeComponent, setActiveComponent] = useState('adv_tut')
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
          <buttonimport { useState } from 'react'
import './App.css'

// import MonteCarloTutorial from './components/monte/MonteCarloTutorial'
import MonteCarloProjectSimulator from './components/monte/MonteCarloProjectSimulator'
import MonteCarloAdvancedTutorial from './components/monte/MonteCarloAdvancedTutorial'
import  from './components/monte/MonteCarloAdvancedTutorial'
// import InteractivePMTensor from './components/monte/InteractivePMTensor'
// import Calendar from './components/Calendar'
// import AudioClassificationPipeline from './components/AudioClassificationPipeline'


// Navigation items configuration
const navigationItems = [  
  { id:'sim', label: 'Simulator', component: MonteCarloProjectSimulator },
  // { id: 'tut', label: 'Tutorial', component: MonteCarloTutorial }, 
  { id: 'adv_tut', label: 'Advanced Monte Carlo Tutorial', component: MonteCarloAdvancedTutorial },
  { id: 'vids', label: "Video <> Music", component: VideoToMusicApp },
//  { id: 'tensors', label: 'An example of a tensor matrix', component: InteractivePMTensor },
  // { id: 'cal', label: 'Calendar Demo', component: Calendar },
  // { id: 'classy', label: 'Audio Tools', component: AudioClassificationPipeline },
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
  const [activeComponent, setActiveComponent] = useState('adv_tut')
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
f 
