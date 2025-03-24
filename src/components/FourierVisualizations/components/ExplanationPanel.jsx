import React, { useState } from 'react';

/**
 * Component that provides explanations for Fourier concepts
 * Adapts content based on the current mode (series or transform)
 */
const ExplanationPanel = ({
  mode = 'series', // 'series' or 'transform'
  className = ''
}) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    basics: true,
    math: false,
    applications: false
  });
  
  // Toggle a section's expanded state
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Content for Fourier Series explanations
  const seriesContent = {
    basics: (
      <>
        <p className="mb-2">
          A Fourier series represents a periodic function as a sum of sine and cosine waves. 
          Any periodic signal can be broken down into simpler sine waves of different frequencies, amplitudes, and phases.
        </p>
        <p>
          In this interactive visualization, you can draw a signal or select a preset, 
          and see how it can be approximated using a sum of sine and cosine functions. 
          The epicycles visualization shows how these sinusoids can be represented as rotating circles.
        </p>
      </>
    ),
    math: (
      <>
        <p className="mb-2">
          The Fourier series of a function f(x) is given by:
        </p>
        <div className="p-2 bg-gray-100 rounded font-mono text-sm overflow-x-auto mb-2">
          f(x) = a₀/2 + Σ[aₙ·cos(nx) + bₙ·sin(nx)]
        </div>
        <p className="mb-2">
          Where a₀, aₙ, and bₙ are the Fourier coefficients calculated by:
        </p>
        <div className="p-2 bg-gray-100 rounded font-mono text-sm overflow-x-auto mb-2">
          aₙ = (1/π)·∫f(x)·cos(nx)dx<br />
          bₙ = (1/π)·∫f(x)·sin(nx)dx
        </div>
        <p>
          The more terms (higher n values) we include, the better our approximation becomes.
        </p>
      </>
    ),
    applications: (
      <>
        <p className="mb-2">
          Fourier series have numerous applications across science and engineering:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Signal processing and filtering</li>
          <li>Audio compression (MP3, AAC)</li>
          <li>Image compression (JPEG)</li>
          <li>Solving partial differential equations</li>
          <li>Musical synthesis and analysis</li>
          <li>Crystallography and X-ray diffraction</li>
        </ul>
      </>
    )
  };
  
  // Content for Fourier Transform explanations
  const transformContent = {
    basics: (
      <>
        <p className="mb-2">
          While Fourier series deal with periodic functions, the Fourier transform extends this concept to non-periodic signals.
          It transforms a signal from the time domain to the frequency domain, revealing which frequencies are present in the signal.
        </p>
        <p>
          In this visualization, you can draw or select a signal and see its frequency spectrum.
          The filters allow you to remove certain frequency components and observe how this affects the signal.
        </p>
      </>
    ),
    math: (
      <>
        <p className="mb-2">
          The Fourier transform F(ω) of a function f(t) is given by:
        </p>
        <div className="p-2 bg-gray-100 rounded font-mono text-sm overflow-x-auto mb-2">
          F(ω) = ∫f(t)·e^(-iωt)dt
        </div>
        <p className="mb-2">
          And the inverse Fourier transform is:
        </p>
        <div className="p-2 bg-gray-100 rounded font-mono text-sm overflow-x-auto mb-2">
          f(t) = (1/2π)·∫F(ω)·e^(iωt)dω
        </div>
        <p>
          The discrete Fourier transform (DFT) is used for sampled signals, calculated using the Fast Fourier Transform (FFT) algorithm.
        </p>
      </>
    ),
    applications: (
      <>
        <p className="mb-2">
          The Fourier transform is fundamental in many fields:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Spectrum analysis in telecommunications</li>
          <li>MRI and CT scan image reconstruction</li>
          <li>Voice recognition and digital filtering</li>
          <li>Quantum mechanics and optics</li>
          <li>Data compression</li>
          <li>Vibration analysis in mechanical engineering</li>
        </ul>
      </>
    )
  };
  
  // Select content based on current mode
  const content = mode === 'series' ? seriesContent : transformContent;
  
  return (
    <div className={`explanation-panel bg-blue-50 p-4 rounded-lg ${className}`}>
      <h2 className="text-lg font-semibold text-blue-800 mb-3">
        {mode === 'series' ? 'Understanding Fourier Series' : 'Understanding Fourier Transforms'}
      </h2>
      
      {/* Basics section - always expanded by default */}
      <div className="explanation-section mb-3">
        <button
          onClick={() => toggleSection('basics')}
          className="flex items-center justify-between w-full text-left font-medium text-blue-700 mb-1"
          aria-expanded={expandedSections.basics}
        >
          <span>The Basics</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transform ${expandedSections.basics ? 'rotate-180' : ''} transition-transform`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedSections.basics && (
          <div className="pl-2 text-sm text-blue-900 border-l-2 border-blue-200">
            {content.basics}
          </div>
        )}
      </div>
      
      {/* Mathematical details section */}
      <div className="explanation-section mb-3">
        <button
          onClick={() => toggleSection('math')}
          className="flex items-center justify-between w-full text-left font-medium text-blue-700 mb-1"
          aria-expanded={expandedSections.math}
        >
          <span>Mathematical Details</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transform ${expandedSections.math ? 'rotate-180' : ''} transition-transform`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedSections.math && (
          <div className="pl-2 text-sm text-blue-900 border-l-2 border-blue-200">
            {content.math}
          </div>
        )}
      </div>
      
      {/* Applications section */}
      <div className="explanation-section">
        <button
          onClick={() => toggleSection('applications')}
          className="flex items-center justify-between w-full text-left font-medium text-blue-700 mb-1"
          aria-expanded={expandedSections.applications}
        >
          <span>Real-World Applications</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transform ${expandedSections.applications ? 'rotate-180' : ''} transition-transform`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedSections.applications && (
          <div className="pl-2 text-sm text-blue-900 border-l-2 border-blue-200">
            {content.applications}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplanationPanel;
