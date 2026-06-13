import { Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './components/layout/HomePage'
import ComponentView from './components/layout/ComponentView'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={
          <>
            <header className="sticky top-0 z-20 py-3 px-4 sm:px-6 bg-white border-b border-gray-200 shadow-sm">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Shuky&apos;s Demos & Components</h1>
              <p className="text-sm text-gray-500 mt-0.5">Select a demo to explore</p>
            </header>
            <main className="py-4 sm:py-6 sm:px-6">
              <HomePage />
            </main>
          </>
        } />
        <Route path="/:componentId" element={<ComponentView />} />
      </Routes>
    </div>
  )
}

export default App
