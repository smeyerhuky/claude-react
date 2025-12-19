import { Routes, Route, useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import './App.css' 

import AdvancedSpectrogram from './components/sonic/AdvancedSpectrogramV2'
import GuitarSynthesizer from './components/sonic/GuitarSynthesizer'
import AIWritingAnalyzer from './components/llm-tools/AIWritingAnalyzer'
import MarkdownCommentSystem from './components/MarkdownCommentSystem'
import AdvancedSpackleDashboard from './components/AdvancedSpackleDashboard'
import MitosisDemo from './components/MitosisAnimation'
import EnhancedTextBufferProcessor from './components/EnhancedTextBufferProcessor'
import MermaidReactions from './components/mermaid/MermaidReactions'
import AWSWars from './components/AWSWars'
import SyncAudioMesh from './components/SyncAudioMesh'
import MarkdownViewer from './components/markdown/MarkdownViewer'
import ShiftBiddingSimulator from './components/ShiftBiddingSimulator'
import HandGestureTracker from './components/HandGestureTracker'
import GestureTestGame from './components/GestureTestGame'
import HandMusicInstrument from './components/HandMusicInstrument'

// Navigation items configuration
const navigationItems = [
  { id: 'advanced-spectrogram', label: "Advanced Spectrogram", component: AdvancedSpectrogram },
  { id: 'guitar-synthesizer', label: "Guitar Synthesizer", component: GuitarSynthesizer },
  { id: 'ai-writing-analyzer', label: 'AI Writing Analyzer', component: AIWritingAnalyzer },
  { id: 'markdown-comment', label: 'Markdown Comments', component: MarkdownCommentSystem},
  { id: 'markdown-viewer', label: 'Markdown Viewer', component: MarkdownViewer},
  { id: 'spackle-dashboard', label: 'Spackle Dashboard', component: AdvancedSpackleDashboard},
  { id: 'mitosis-animation', label: 'Mitosis Animation', component: MitosisDemo},
  { id: 'text-buffer-processor', label: 'Text Buffer Processor', component: EnhancedTextBufferProcessor},
  { id: 'mermaid-diagram', label: 'Mermaid Diagram', component: MermaidReactions},
  { id: 'aws-wars', label: 'AWS Wars Game', component: AWSWars},
  { id: 'audio', label: 'Audio Mesh', component: SyncAudioMesh },
  { id: 'shift-bidding-app', label: 'Shift Bidding App', component: ShiftBiddingSimulator },
  { id: 'hand-gesture-tracker', label: 'Hand Gesture Tracker', component: HandGestureTracker },
  { id: 'gesture-test-game', label: 'Gesture Test Game', component: GestureTestGame },
  { id: 'hand-music', label: 'Hand Music Instrument', component: HandMusicInstrument },
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
