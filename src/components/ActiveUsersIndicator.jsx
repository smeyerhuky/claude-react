import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Settings, Users, Eye, Code, Play, Pause } from 'lucide-react'

// Performance-optimized Active Users Indicator
const ActiveUsersIndicator = ({ 
  activeUsers = 0,
  size = 120,
  className = "",
  showCount = true
}) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastFrameTime = useRef(0)
  const [isAnimating, setIsAnimating] = useState(true)

  // Pre-calculated circle positions for different user counts (performance optimization)
  const circleConfigs = useMemo(() => {
    const configs = new Map()
    
    // Helper to generate positions
    const generatePositions = (count, boundaryRadius, circleRadius) => {
      if (count === 0) return []
      if (count === 1) return [{ x: 0, y: 0, radius: circleRadius * 1.1 }]
      
      if (count <= 4) {
        const patterns = {
          2: [{ x: -circleRadius * 0.7, y: 0 }, { x: circleRadius * 0.7, y: 0 }],
          3: [
            { x: 0, y: -circleRadius * 0.8 },
            { x: -circleRadius * 0.7, y: circleRadius * 0.4 },
            { x: circleRadius * 0.7, y: circleRadius * 0.4 }
          ],
          4: [
            { x: -circleRadius * 0.6, y: -circleRadius * 0.6 },
            { x: circleRadius * 0.6, y: -circleRadius * 0.6 },
            { x: -circleRadius * 0.6, y: circleRadius * 0.6 },
            { x: circleRadius * 0.6, y: circleRadius * 0.6 }
          ]
        }
        return patterns[count].map(pos => ({ ...pos, radius: circleRadius }))
      }
      
      // Concentric rings for larger counts
      const positions = []
      let placed = 0
      let ring = 0
      
      // Center
      positions.push({ x: 0, y: 0, radius: circleRadius * 0.9 })
      placed = 1
      
      while (placed < count && ring < 3) {
        ring++
        const ringRadius = circleRadius * (1.4 + ring * 1.1)
        const maxInRing = Math.min(6 * ring, count - placed)
        
        for (let i = 0; i < maxInRing; i++) {
          const angle = (i * 2 * Math.PI) / maxInRing
          positions.push({
            x: Math.cos(angle) * ringRadius,
            y: Math.sin(angle) * ringRadius,
            radius: circleRadius * (0.9 - ring * 0.1)
          })
        }
        placed += maxInRing
      }
      
      return positions
    }
    
    // Pre-calculate common configurations
    for (let users = 0; users <= 50; users++) {
      let circleCount = 0
      let phase = 'empty'
      
      if (users === 0) {
        circleCount = 0
        phase = 'empty'
      } else if (users <= 3) {
        circleCount = users
        phase = 'few'
      } else if (users <= 8) {
        circleCount = 3 + Math.floor((users - 3) / 2)
        phase = 'moderate'
      } else if (users <= 20) {
        circleCount = 6 + Math.floor((users - 8) / 4)
        phase = 'active'
      } else if (users <= 50) {
        circleCount = 9 + Math.floor((users - 20) / 8)
        phase = 'busy'
      }
      
      const finalCount = Math.min(circleCount, 15)
      const baseRadius = Math.max(4, (size * 0.25) / Math.sqrt(finalCount + 1))
      
      configs.set(users, {
        phase,
        circles: finalCount > 0 ? generatePositions(finalCount, size * 0.35, baseRadius) : [],
        showBadge: users > 50,
        intensity: Math.min(users / 50, 1) * 0.2 // Very subtle
      })
    }
    
    return configs
  }, [size])

  // Get current state (performance optimized lookup)
  const currentState = useMemo(() => {
    const users = Math.min(activeUsers, 50)
    return circleConfigs.get(users) || {
      phase: 'badge',
      circles: [],
      showBadge: true,
      intensity: 0.2
    }
  }, [activeUsers, circleConfigs])

  // Optimized wobble calculation
  const getWobble = useCallback((time, index) => {
    const wobbleAmount = currentState.intensity * 1.2
    const timeOffset = index * 0.6
    const slowTime = time * 0.0008 // Very slow, smooth animation
    
    return {
      x: Math.sin(slowTime + timeOffset) * wobbleAmount,
      y: Math.cos(slowTime * 0.7 + timeOffset) * wobbleAmount
    }
  }, [currentState.intensity])

  // High-performance canvas drawing
  const draw = useCallback((timestamp) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    // Clear canvas efficiently
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    ctx.save()
    ctx.translate(centerX, centerY)
    
    if (currentState.showBadge) {
      // Badge rendering
      const radius = size * 0.35
      
      // Single gradient creation (performance)
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(1, '#1d4ed8')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, 2 * Math.PI)
      ctx.fill()
      
      // Text
      ctx.fillStyle = 'white'
      ctx.font = `600 ${radius * 0.35}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(activeUsers > 99 ? '99+' : activeUsers.toString(), 0, 0)
      
    } else if (currentState.circles.length === 0) {
      // Empty state
      ctx.fillStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.12, 0, 2 * Math.PI)
      ctx.fill()
      
    } else {
      // Batch circle rendering for performance
      currentState.circles.forEach((circle, index) => {
        const wobble = getWobble(timestamp, index)
        const x = circle.x + wobble.x
        const y = circle.y + wobble.y
        
        // Reuse gradient if possible
        const gradient = ctx.createRadialGradient(
          x - circle.radius * 0.3, y - circle.radius * 0.3, 0,
          x, y, circle.radius
        )
        gradient.addColorStop(0, '#3b82f6')
        gradient.addColorStop(1, '#2563eb')
        
        ctx.fillStyle = gradient
        ctx.strokeStyle = '#1d4ed8'
        ctx.lineWidth = 1
        
        ctx.beginPath()
        ctx.arc(x, y, circle.radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      })
    }
    
    ctx.restore()
  }, [currentState, getWobble, size, activeUsers])

  // Optimized animation loop with frame throttling
  const animate = useCallback((timestamp) => {
    // Throttle to ~30fps for better performance
    if (timestamp - lastFrameTime.current < 33) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }
    
    lastFrameTime.current = timestamp
    draw(timestamp)
    
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [draw, isAnimating])

  // Canvas setup with proper cleanup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // High DPI setup
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    
    // Optimize canvas context
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [size])

  // Start/stop animation based on visibility and state changes
  useEffect(() => {
    if (isAnimating && currentState.intensity > 0) {
      animationRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate, isAnimating, currentState.intensity])

  // Stop animation when no users (performance optimization)
  useEffect(() => {
    setIsAnimating(activeUsers > 0)
  }, [activeUsers])

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-full"
        style={{ 
          filter: activeUsers > 0 ? 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.12))' : 'none',
          transition: 'filter 0.3s ease'
        }}
      />
      {showCount && (
        <span className="text-sm font-medium text-gray-600 mt-2">
          {activeUsers === 0 ? 'No viewers' : 
           activeUsers === 1 ? '1 viewer' : 
           `${activeUsers} viewers`}
        </span>
      )}
    </div>
  )
}

// Lightweight demo component
const ActiveUsersIndicatorDemo = () => {
  const [activeUsers, setActiveUsers] = useState(5)
  const [size, setSize] = useState(120)
  const [showModal, setShowModal] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const simulationRef = useRef(null)

  // Optimized simulation with proper cleanup
  useEffect(() => {
    if (!isSimulating) {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
        simulationRef.current = null
      }
      return
    }
    
    simulationRef.current = setInterval(() => {
      setActiveUsers(prev => {
        const change = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0
        return Math.max(0, Math.min(100, prev + change))
      })
    }, 2000)
    
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [isSimulating])

  const presets = [
    { label: 'Empty', users: 0 },
    { label: 'Few', users: 3 },
    { label: 'Moderate', users: 12 },
    { label: 'Active', users: 25 },
    { label: 'Busy', users: 45 },
    { label: 'Crowded', users: 75 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Active Users Indicator</h1>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Performance Optimized
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Description */}
        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-4">
            High-performance active users indicator optimized for production use. 
            Features efficient canvas rendering, smart animation throttling, and minimal resource usage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <strong className="text-blue-700">Performance:</strong> 30fps throttled animation, efficient canvas rendering
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <strong className="text-green-700">Memory:</strong> Pre-calculated positions, optimized state management
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <strong className="text-purple-700">Production:</strong> Auto-pause when inactive, minimal CPU usage
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Example */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Live Demo</h2>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isSimulating 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {isSimulating ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                {isSimulating ? 'Stop' : 'Simulate'}
              </button>
            </div>

            {/* Main indicator display */}
            <div className="flex justify-center mb-8">
              <ActiveUsersIndicator 
                activeUsers={activeUsers}
                size={size}
                showCount={true}
              />
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setActiveUsers(preset.users)}
                  className={`p-3 text-left border rounded-lg transition-colors hover:bg-gray-50 ${
                    activeUsers === preset.users 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{preset.label}</div>
                  <div className="text-xs text-gray-500">{preset.users} users</div>
                </button>
              ))}
            </div>
          </div>

          {/* Implementation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Usage</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <pre className="text-sm text-green-400">
{`<ActiveUsersIndicator 
  activeUsers={${activeUsers}}
  size={${size}}
  showCount={true}
/>`}
              </pre>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Performance Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 30fps throttled animation (vs 60fps for better efficiency)</li>
                  <li>• Pre-calculated circle positions for common user counts</li>
                  <li>• Auto-pause animation when no users active</li>
                  <li>• Efficient canvas batching and context optimization</li>
                  <li>• Minimal re-renders with optimized state management</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Props</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <code className="text-purple-600">activeUsers</code>
                    <span className="text-gray-500">number (0-100)</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-purple-600">size</code>
                    <span className="text-gray-500">number (80-200)</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-purple-600">showCount</code>
                    <span className="text-gray-500">boolean</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Configure Indicator</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Users: {activeUsers}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeUsers}
                  onChange={(e) => setActiveUsers(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size: {size}px
                </label>
                <input
                  type="range"
                  min="80"
                  max="200"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-center">
                  <ActiveUsersIndicator 
                    activeUsers={activeUsers}
                    size={size}
                    showCount={true}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActiveUsersIndicatorDemo
export { ActiveUsersIndicator }