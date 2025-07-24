import { Routes, Route, useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import './App.css' 

// import MagyarSoundGarden from './components/languages/MagyarSoundGarden'
// import MediterraneanLatinoRecipesEnglish from './components/diet/MediterraneanLatinoRecipesEnglish'
// import MSG from './components/languages/MSG'
// import MagyarCore100 from './components/languages/MagyarCore100'
// import Hungarian100WordsV1 from './components/languages/Hungarian100WordsV1'

import ESP32ThereminInterface from './components/sonic/ESP32ThereminInterface'
import ConcertSpectogram from './components/sonic/ConcertSpectogram'
import EDMSpectrogram from './components/sonic/EDMSpectrogram'
import AdvancedSpectrogram from './components/sonic/AdvancedSpectrogramV2'
import ImageSonificationDJMixer from './components/sonic/ImageSonificationDJMixer'
import GuitarSynthesizer from './components/sonic/GuitarSynthesizer'
import MusicVisualizationToolkit from './components/sonic/MusicVisualizationToolkit'
import TemporalPatternSpectrogramV2 from './components/sonic/TemporalPatternSpectrogramV2'
import RiNoMusicCalendar from './components/concerts/RiNoMusicCalendar'


// Navigation items configuration
const navigationItems = [
  { id: 'esp-muse', label: "ESP 32 Music", component: ESP32ThereminInterface },
  { id: 'sonique', label: 'DJ Sonique', component: ImageSonificationDJMixer },
  { id: 'concert-spectrogram', label: "Concert Spectrogram", component: ConcertSpectogram },
  { id: 'edm-spectrogram', label: "EDM Spectrogram", component: EDMSpectrogram },
  { id: 'quantum', label: "Temporal Pattern Spectrogram", component: TemporalPatternSpectrogramV2 },
  { id: 'advanced-spectrogram', label: "Advanced Spectrogram", component: AdvancedSpectrogram },
  { id: 'music-visualization-toolkit', label: "Music Visualization Toolkit", component: MusicVisualizationToolkit },
  { id: 'guitar-synthesizer', label: "Guitar Synthesizer", component: GuitarSynthesizer },
  { id: 'concerts-rino', label: "Concerts in RiNo", component: RiNoMusicCalendar },
  // { id: 'diet-med-lat', label: 'MediterraneanLatino Recipes', component: MediterraneanLatinoRecipesEnglish },
  // { id: 'languages-hu', label: 'Magyar Soundgarden', component: MagyarSoundGarden },
  // { id: 'msg', label: "MSG - Magyar Sound Garden", component: MSG },
  // { id: '100-words-v1', label: "Magyar - 100 Words (v1)", component: Hungarian100WordsV1 },
  // { id: '100-words-final', label: "Magyar - 100 Words (final)", component: MagyarCore100 },
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
function ComponentView() {
  const { componentId } = useParams();
  const navigate = useNavigate();
  
  // Find the component by ID
  const item = navigationItems.find(item => item.id === componentId);
  
  if (!item) {
    return <Navigate to="/" />;
  }
  
  return (
    <div>
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
      <div className="px-4">
        <item.component />
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={
          <>
            <header className="py-4 px-6 bg-white border-b">
              <h1 className="text-2xl font-bold text-gray-800">Shuky&apos;s Demos & Components</h1>
              <p className="text-gray-600">Select a component to view</p>
            </header>
            <HomePage />
          </>
        } />
        <Route path="/:componentId" element={<ComponentView />} />
      </Routes>
    </div>
  )
}

export default App
