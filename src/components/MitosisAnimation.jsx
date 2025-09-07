import { useState, useEffect, useMemo } from 'react'

const MitosisAnimation = ({ 
  hits = 0,
  size = 200, 
  className = "",
  onClick = null 
}) => {
  const [animationTime, setAnimationTime] = useState(0)

  // Animation loop for wobble effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTime(prev => prev + 0.1)
    }, 30) // Faster for smoother jitter
    return () => clearInterval(interval)
  }, [])

  // Generate Fibonacci sequence for division boundaries
  const getFibonacciSequence = (limit) => {
    const fib = [1, 1]
    while (fib[fib.length - 1] < limit) {
      const next = fib[fib.length - 1] + fib[fib.length - 2]
      fib.push(next)
    }
    return fib.slice(2) // Skip first two 1s, start from 2
  }


  // Generate positions for circles with better spacing (restored original approach)
  const generateCirclePositions = (count, boundaryRadius, circleRadius) => {
    const circles = []
    
    if (count === 1) {
      circles.push({ x: 0, y: 0, radius: circleRadius, generation: 0 })
    } else if (count <= 4) {
      // Small counts - arrange in simple patterns
      if (count === 2) {
        const offset = circleRadius * 1.2
        circles.push({ x: -offset, y: 0, radius: circleRadius, generation: 1 })
        circles.push({ x: offset, y: 0, radius: circleRadius, generation: 1 })
      } else if (count === 3) {
        const radius = circleRadius * 1.5
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2
          circles.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            radius: circleRadius,
            generation: 1
          })
        }
      } else { // count === 4
        const offset = circleRadius * 1.3
        circles.push({ x: -offset, y: -offset, radius: circleRadius, generation: 1 })
        circles.push({ x: offset, y: -offset, radius: circleRadius, generation: 1 })
        circles.push({ x: -offset, y: offset, radius: circleRadius, generation: 1 })
        circles.push({ x: offset, y: offset, radius: circleRadius, generation: 1 })
      }
    } else {
      // Multiple generations - distribute in rings with proper spacing
      let generated = 0
      let generation = 1
      let currentRingSize = Math.min(6, count) // Start with max 6 in first ring
      let ringRadius = circleRadius * 2.5
      
      while (generated < count && ringRadius < boundaryRadius) {
        const circlesInRing = Math.min(currentRingSize, count - generated)
        
        for (let i = 0; i < circlesInRing; i++) {
          const angle = (i * 2 * Math.PI) / circlesInRing
          const slight_jitter = (Math.random() - 0.5) * circleRadius * 0.3
          circles.push({
            x: Math.cos(angle) * ringRadius + slight_jitter,
            y: Math.sin(angle) * ringRadius + slight_jitter,
            radius: circleRadius,
            generation
          })
        }
        
        generated += circlesInRing
        generation++
        currentRingSize = Math.min(currentRingSize + 2, 12) // Gradually increase ring capacity
        ringRadius += circleRadius * 2.2 // Better spacing between rings
      }
    }
    
    return circles
  }

  // Calculate mitosis state based on hits with Fibonacci divisions
  const mitosisState = useMemo(() => {
    const state = {
      phase: 'single',
      cells: [],
      growthIntensity: 0,
      glowIntensity: 0,
      showBadge: false,
      divisionLevel: 0,
      cellCount: 1
    }

    // Fibonacci sequence for division boundaries (much denser divisions)
    const fibSequence = getFibonacciSequence(1000)
    const divisionThresholds = fibSequence.slice(0, 15) // Use first 15 Fibonacci numbers
    
    // Calculate growth intensity based on proximity to next division
    let currentDivision = 0
    let nextThreshold = divisionThresholds[0] || hits + 1
    
    for (let i = 0; i < divisionThresholds.length; i++) {
      if (hits >= divisionThresholds[i]) {
        currentDivision = i + 1
        nextThreshold = divisionThresholds[i + 1] || 1000
      } else {
        break
      }
    }
    
    // Growth intensity increases as we approach next division
    const prevThreshold = currentDivision > 0 ? divisionThresholds[currentDivision - 1] : 0
    const progressToNext = (hits - prevThreshold) / (nextThreshold - prevThreshold)
    state.growthIntensity = Math.min(progressToNext * 1.2, 1)
    state.glowIntensity = state.growthIntensity
    state.divisionLevel = currentDivision

    // Use a more gradual progression - not pure binary
    // Fibonacci progression but capped reasonably: 1, 2, 3, 4, 6, 8, 12, 16, 24, 32...
    let totalCircles = 1
    if (currentDivision > 0) {
      const progression = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128]
      totalCircles = Math.min(progression[Math.min(currentDivision, progression.length - 1)], 128)
    }
    
    state.cellCount = totalCircles
    
    // Determine circle size - more generous sizing
    const baseCircleRadius = Math.max(6, (size * 0.25) / Math.sqrt(totalCircles + 1))
    
    // Check if circles are too small (< 4px) - switch to badge mode  
    if (baseCircleRadius < 4 || totalCircles > 64) {
      state.showBadge = true
      state.phase = 'badge'
    } else {
      state.phase = totalCircles === 1 ? 'single' : 'multiple'
      state.circles = generateCirclePositions(totalCircles, size * 0.4, baseCircleRadius)
    }

    return state
  }, [hits, size])

  // Calculate wobble offset for animation
  const getWobble = (baseIntensity, circleIndex = 0) => {
    const wobbleAmount = baseIntensity * 3
    const timeOffset = circleIndex * 0.5
    return {
      x: Math.sin(animationTime + timeOffset) * wobbleAmount,
      y: Math.cos(animationTime * 1.2 + timeOffset) * wobbleAmount
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div 
      className={`relative inline-block cursor-pointer ${className}`}
      onClick={handleClick}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`${-size/2} ${-size/2} ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Boundary circle */}
        <circle
          cx={0}
          cy={0}
          r={size * 0.45}
          fill="none"
          stroke="rgba(156, 163, 175, 0.3)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        {/* Mitosis circles or badge */}
        {mitosisState.showBadge ? (
          // Badge mode - filled circle with hit count
          <g>
            <circle
              cx={0}
              cy={0}
              r={size * 0.45}
              fill="rgb(59, 130, 246)"
              opacity="0.9"
              filter="url(#glow)"
            />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={size * 0.15}
              fontWeight="bold"
            >
              {hits > 999 ? "1K+" : hits.toLocaleString()}
            </text>
          </g>
        ) : (
          // Circle mode - restored original clean style
          mitosisState.circles.map((circle, index) => {
            const wobble = getWobble(mitosisState.growthIntensity, index)
            const glowRadius = circle.radius + mitosisState.glowIntensity * 6
            
            return (
              <g key={index}>
                {/* Glow effect */}
                {mitosisState.glowIntensity > 0 && (
                  <circle
                    cx={circle.x + wobble.x}
                    cy={circle.y + wobble.y}
                    r={glowRadius}
                    fill="rgba(59, 130, 246, 0.2)"
                    opacity={mitosisState.glowIntensity * 0.5}
                  />
                )}
                {/* Main circle */}
                <circle
                  cx={circle.x + wobble.x}
                  cy={circle.y + wobble.y}
                  r={circle.radius}
                  fill="rgb(59, 130, 246)"
                  opacity="0.8"
                  stroke="rgb(37, 99, 235)"
                  strokeWidth="1"
                />
              </g>
            )
          })
        )}

        {/* SVG filter definitions */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="cellGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="cellBlur"/>
            <feMerge> 
              <feMergeNode in="cellBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  )
}

// Demo component with enhanced controls
const MitosisDemo = () => {
  const [hits, setHits] = useState(0)
  const [size, setSize] = useState(240)
  const [showConfig, setShowConfig] = useState(true)
  const [autoIncrement, setAutoIncrement] = useState(false)
  const [jumpAmount, setJumpAmount] = useState(1)
  const [randomPlay, setRandomPlay] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(300) // milliseconds

  // Generate Fibonacci sequence for transition points
  const getFibonacci = (limit) => {
    const fib = [1, 1]
    while (fib[fib.length - 1] < limit) {
      const next = fib[fib.length - 1] + fib[fib.length - 2]
      fib.push(next)
    }
    return fib.slice(2)
  }
  
  const fibSequence = getFibonacci(1000)
  const transitionPoints = fibSequence.slice(0, 15)

  // Auto increment hits for testing with random jumps
  useEffect(() => {
    if (!autoIncrement && !randomPlay) return
    
    const interval = setInterval(() => {
      if (randomPlay) {
        // Random jumps in random directions
        const jumpSize = Math.floor(Math.random() * jumpAmount * 2) + 1
        const direction = Math.random() > 0.5 ? 1 : -1
        setHits(prev => Math.max(0, Math.min(1000, prev + (jumpSize * direction))))
      } else if (autoIncrement) {
        setHits(prev => Math.min(1000, prev + jumpAmount))
      }
    }, playSpeed)
    
    return () => clearInterval(interval)
  }, [autoIncrement, randomPlay, jumpAmount, playSpeed])

  // Size increments for notched slider
  const sizeNotches = [120, 160, 200, 240, 280, 320, 360, 400]
  
  // Quick jump to transition points (Fibonacci boundaries)
  const transitionPresets = transitionPoints.map((value, index) => ({
    label: `F${index + 1} (${value})`,
    value,
    cells: Math.pow(2, index + 1)
  }))
  
  // Additional presets for key phases
  const phasePresets = [
    { label: 'Start', value: 0, cells: 1 },
    { label: 'Dense Pack', value: 500, cells: '512+' },
    { label: 'Badge Mode', value: 800, cells: '1K+' },
    { label: 'Maximum', value: 1000, cells: 'MAX' }
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-50 min-h-screen">
      {/* Animation Display */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Mitosis Animation</h2>
        
        <MitosisAnimation
          hits={hits}
          size={size}
          onClick={() => setHits(prev => prev + 1)}
          className="mb-6"
        />

        <div className="text-center text-gray-600">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-lg font-bold text-gray-800">{hits.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Hits</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">
                {(() => {
                  const fibIndex = transitionPoints.findIndex(t => hits < t)
                  const currentDivision = fibIndex === -1 ? transitionPoints.length : fibIndex
                  const progression = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128]
                  return currentDivision === 0 ? 1 : Math.min(progression[Math.min(currentDivision, progression.length - 1)], 128)
                })()}
              </p>
              <p className="text-xs text-gray-500">Circles</p>
            </div>
          </div>
          <p className="text-sm">Click animation or use controls below</p>
        </div>
      </div>

      {/* Control Panel */}
      {showConfig && (
        <div className="w-80 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Controls</h3>
            <button
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Jump Controls */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Jump Amount: {jumpAmount}
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setHits(Math.max(0, hits - jumpAmount))}
                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
              >
                -{jumpAmount}
              </button>
              <button
                onClick={() => setHits(Math.min(1000, hits + jumpAmount))}
                className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium"
              >
                +{jumpAmount}
              </button>
              <button
                onClick={() => setHits(0)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Reset
              </button>
            </div>

            {/* Jump Amount Slider */}
            <input
              type="range"
              min="1"
              max="50"
              value={jumpAmount}
              onChange={(e) => setJumpAmount(parseInt(e.target.value))}
              className="w-full mb-3"
            />

            {/* Automation Controls */}
            <div className="space-y-2 mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoIncrement}
                  onChange={(e) => {
                    setAutoIncrement(e.target.checked)
                    if (e.target.checked) setRandomPlay(false)
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Auto increment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={randomPlay}
                  onChange={(e) => {
                    setRandomPlay(e.target.checked)
                    if (e.target.checked) setAutoIncrement(false)
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Random play</span>
              </label>
            </div>

            {/* Speed Control */}
            {(autoIncrement || randomPlay) && (
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Speed: {(1000 / playSpeed).toFixed(1)}/sec
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Manual Slider */}
            <input
              type="range"
              min="0"
              max="1000"
              value={hits}
              onChange={(e) => setHits(parseInt(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)`
              }}
            />
          </div>

          {/* Notched Size Control */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Size: {size}px
            </label>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {sizeNotches.map((notchSize) => (
                <button
                  key={notchSize}
                  onClick={() => setSize(notchSize)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    size === notchSize
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {notchSize}
                </button>
              ))}
            </div>
            <input
              type="range"
              min="120"
              max="400"
              step="20"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Transition Points (Fibonacci) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fibonacci Transitions
            </label>
            <div className="grid grid-cols-3 gap-1 mb-3">
              {transitionPresets.slice(0, 9).map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setHits(preset.value)}
                  className={`px-1 py-1 text-xs rounded transition-colors ${
                    hits === preset.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {preset.value}
                </button>
              ))}
            </div>
            
            {/* Phase Presets */}
            <div className="grid grid-cols-2 gap-2">
              {phasePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setHits(preset.value)}
                  className="px-2 py-2 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200 transition-colors"
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs opacity-75">{preset.cells} cells</div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Info */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <h4 className="font-medium mb-2">Current State:</h4>
            <div className="space-y-1">
              <div>Division Level: {Math.floor(Math.log2(Math.max(1, hits))) + 1}</div>
              <div>Next Transition: {transitionPoints.find(t => t > hits) || 'Max reached'}</div>
              <div>Growth: {Math.floor((hits % 100) / 100 * 100)}%</div>
              <div>Crowding Factor: {hits > 100 ? 'High' : hits > 50 ? 'Medium' : 'Low'}</div>
            </div>
            
            <div className="mt-3 text-xs">
              <strong>Fibonacci Sequence:</strong>
              <div className="text-xs mt-1 opacity-75">
                Binary divisions at: {transitionPoints.slice(0, 8).join(', ')}...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Config Button */}
      {!showConfig && (
        <button
          onClick={() => setShowConfig(true)}
          className="fixed top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
        >
          Show Controls
        </button>
      )}
    </div>
  )
}

export default MitosisDemo
export { MitosisAnimation }