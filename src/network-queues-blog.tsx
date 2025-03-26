import React, { useState, useEffect, useRef } from 'react';
import { Line, Circle, Text } from 'lucide-react';

// Main Blog Article Component
const NetworkQueuesBlog = () => {
  // State for controlling visualizations
  const [arrivalRate, setArrivalRate] = useState(5);
  const [serviceRate, setServiceRate] = useState(6);
  const [showMath, setShowMath] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [isPaused, setIsPaused] = useState(false);
  const [systemLoad, setSystemLoad] = useState(0);

  // Calculate system load (rho) when rates change
  useEffect(() => {
    if (serviceRate > 0) {
      setSystemLoad(arrivalRate / serviceRate);
    }
  }, [arrivalRate, serviceRate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Network Queues: Linear Algebra and Signal Processing Perspectives</h1>
        <p className="text-gray-600 mb-4">Understanding queuing theory through the lens of mathematics</p>
        <div className="flex justify-center">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Interactive Tutorial
          </div>
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Introduction</h2>
        <p className="mb-4">
          Network queues are fundamental structures in computing systems, telecommunications, and data networks. 
          They represent waiting lines of data packets or jobs that are waiting to be processed by a server 
          or routed through a network node. In this interactive article, we'll explore how concepts from 
          linear algebra and signal processing can help us understand and analyze queuing systems.
        </p>
        <p className="mb-4">
          Whether you're designing network protocols, optimizing web servers, or studying traffic flow in a 
          distributed system, understanding queue behavior is essential. Let's dive into both the intuitive 
          visual representations and the mathematical foundations of these systems.
        </p>

        {/* Table of Contents */}
        <div className="bg-gray-50 p-6 rounded-lg my-6">
          <h3 className="text-lg font-medium mb-2">In this article:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li className="ml-4">Basic Queue Visualization and Parameters</li>
            <li className="ml-4">Queue Dynamics as Linear Systems</li>
            <li className="ml-4">Matrix Representations of Network Queues</li>
            <li className="ml-4">Signal Processing: Time and Frequency Domain Analysis</li>
            <li className="ml-4">Applications and Further Exploration</li>
          </ul>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="mb-8 border-b">
        <div className="flex space-x-2">
          <TabButton 
            label="Basic Queue" 
            active={activeTab === 'basic'} 
            onClick={() => setActiveTab('basic')} 
          />
          <TabButton 
            label="Linear Systems" 
            active={activeTab === 'linear'} 
            onClick={() => setActiveTab('linear')} 
          />
          <TabButton 
            label="Matrix Models" 
            active={activeTab === 'matrix'} 
            onClick={() => setActiveTab('matrix')} 
          />
          <TabButton 
            label="Signals Analysis" 
            active={activeTab === 'signals'} 
            onClick={() => setActiveTab('signals')} 
          />
        </div>
      </div>

      {/* Shared Controls Panel */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">
              Arrival Rate (λ): {arrivalRate} packets/sec
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={arrivalRate}
              onChange={(e) => setArrivalRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">
              Service Rate (μ): {serviceRate} packets/sec
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="0.1"
              value={serviceRate}
              onChange={(e) => setServiceRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showMath"
                checked={showMath}
                onChange={() => setShowMath(!showMath)}
                className="mr-2"
              />
              <label htmlFor="showMath" className="text-sm">Show Math</label>
            </div>
          </div>
        </div>

        {/* System Load Indicator */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">System Load (ρ = λ/μ): {systemLoad.toFixed(2)}</p>
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div 
              className={`h-full ${systemLoad < 0.8 ? 'bg-green-500' : systemLoad < 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(systemLoad * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs mt-1 text-gray-500">
            {systemLoad < 1 ? "Stable system (ρ < 1)" : "Unstable system (ρ ≥ 1) - queue will grow infinitely"}
          </p>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="mb-10">
        {activeTab === 'basic' && <BasicQueueSection isPaused={isPaused} arrivalRate={arrivalRate} serviceRate={serviceRate} showMath={showMath} />}
        {activeTab === 'linear' && <LinearSystemsSection isPaused={isPaused} arrivalRate={arrivalRate} serviceRate={serviceRate} showMath={showMath} />}
        {activeTab === 'matrix' && <MatrixModelSection isPaused={isPaused} arrivalRate={arrivalRate} serviceRate={serviceRate} showMath={showMath} />}
        {activeTab === 'signals' && <SignalsAnalysisSection isPaused={isPaused} arrivalRate={arrivalRate} serviceRate={serviceRate} showMath={showMath} />}
      </div>

      {/* Additional Resources Section */}
      <section className="mt-16 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Further Resources</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Queuing Theory</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Introduction to Queuing Theory</li>
              <li>Little's Law and Applications</li>
              <li>M/M/1 and M/M/c Queue Models</li>
              <li>Network of Queues</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Mathematical Foundations</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Linear Algebra for Network Analysis</li>
              <li>Markov Chains and Steady-State Analysis</li>
              <li>Fourier Analysis of Traffic Patterns</li>
              <li>Stochastic Processes in Queuing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t text-center text-gray-500">
        <p>© 2025 Network Mathematics Blog</p>
        <p className="text-sm mt-2">Interactive visualizations powered by React</p>
      </footer>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ label, active, onClick }) => (
  <button
    className={`px-4 py-2 ${active 
      ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
      : 'text-gray-500 hover:text-gray-700'}`}
    onClick={onClick}
  >
    {label}
  </button>
);

// Basic Queue Visualization Section
const BasicQueueSection = ({ isPaused, arrivalRate, serviceRate, showMath }) => {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [stats, setStats] = useState({
    avgQueueLength: 0,
    avgWaitTime: 0,
    throughput: 0,
  });
  
  // Animation frame reference
  const animationRef = useRef();
  const lastArrivalTime = useRef(0);
  const lastServiceTime = useRef(0);
  const currentTime = useRef(0);
  const completedJobs = useRef(0);
  const totalWaitTime = useRef(0);
  const queueLengthSum = useRef(0);
  const measurementCount = useRef(0);

  // Animate the queue
  useEffect(() => {
    if (isPaused) {
      cancelAnimationFrame(animationRef.current);
      return;
    }

    const updateQueue = (timestamp) => {
      if (!lastArrivalTime.current) {
        lastArrivalTime.current = timestamp;
        lastServiceTime.current = timestamp;
        currentTime.current = timestamp;
      }

      const deltaTime = timestamp - currentTime.current;
      currentTime.current = timestamp;

      // Add new packets based on arrival rate
      if (timestamp - lastArrivalTime.current > 1000 / arrivalRate) {
        setQueue(q => [...q, { id: Date.now(), arrivalTime: timestamp }]);
        lastArrivalTime.current = timestamp;
      }

      // Process packets based on service rate
      if (!processing && queue.length > 0 && timestamp - lastServiceTime.current > 1000 / serviceRate) {
        const nextPacket = queue[0];
        const serviceStartTime = timestamp;
        
        setProcessing(nextPacket);
        setQueue(q => q.slice(1));
        
        // Schedule completion
        setTimeout(() => {
          setProcessing(null);
          completedJobs.current++;
          totalWaitTime.current += serviceStartTime - nextPacket.arrivalTime;
          lastServiceTime.current = serviceStartTime + 1000 / serviceRate;
        }, 1000 / serviceRate);
      }

      // Update stats periodically
      if (timestamp % 300 < 20) { // update roughly every 300ms
        queueLengthSum.current += queue.length;
        measurementCount.current++;

        setStats({
          avgQueueLength: queueLengthSum.current / Math.max(1, measurementCount.current),
          avgWaitTime: totalWaitTime.current / Math.max(1, completedJobs.current),
          throughput: (completedJobs.current / (timestamp / 1000)) || 0,
        });
      }

      animationRef.current = requestAnimationFrame(updateQueue);
    };

    animationRef.current = requestAnimationFrame(updateQueue);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, queue, arrivalRate, serviceRate]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Basic Queue Visualization</h2>
      <p className="mb-4">
        At its core, a network queue is a waiting line of packets, jobs, or requests. This visualization 
        represents a simple M/M/1 queue - a single server with Markovian (exponential/random) arrival and service times.
      </p>
      
      {/* Queue Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 overflow-x-auto">
        <div className="h-48 flex items-center gap-6 min-w-[500px] relative">
          {/* Arrivals */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Circle className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-sm mt-1">Arrival λ</div>
            <div className="text-xs text-gray-500">{arrivalRate}/sec</div>
          </div>

          {/* Queue */}
          <div className="flex-1 flex items-center gap-1 bg-gray-100 rounded-lg p-4 h-24 overflow-x-auto">
            {queue.map((packet, index) => (
              <div key={packet.id} className="w-10 h-10 rounded-full bg-blue-200 flex-shrink-0 flex items-center justify-center">
                <div className="text-xs">{index+1}</div>
              </div>
            ))}
            {queue.length === 0 && (
              <div className="text-gray-400 italic">Empty Queue</div>
            )}
          </div>

          {/* Server */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center">
              {processing ? (
                <div className="w-10 h-10 rounded-full bg-blue-200 animate-pulse flex items-center justify-center">
                  <div className="text-xs">⚙️</div>
                </div>
              ) : (
                <div className="text-green-500">Server</div>
              )}
            </div>
            <div className="text-sm mt-1">Service μ</div>
            <div className="text-xs text-gray-500">{serviceRate}/sec</div>
          </div>

          {/* Departures */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Circle className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-sm mt-1">Departure</div>
            <div className="text-xs text-gray-500">{stats.throughput.toFixed(2)}/sec</div>
          </div>
        </div>

        {/* Queue Statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm font-medium">Average Queue Length (L)</div>
            <div className="text-2xl">{stats.avgQueueLength.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm font-medium">Average Wait Time (W)</div>
            <div className="text-2xl">{(stats.avgWaitTime / 1000).toFixed(2)} sec</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm font-medium">Utilization (ρ)</div>
            <div className="text-2xl">{Math.min(arrivalRate / serviceRate, 1).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Mathematical Explanation */}
      {showMath && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Mathematical Foundation</h3>
          <p className="mb-3">
            For an M/M/1 queue with arrival rate λ and service rate μ, the fundamental properties are:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">System Utilization (ρ):</p>
              <p className="font-mono bg-white p-2 rounded mt-1">ρ = λ/μ</p>
              <p className="text-sm mt-1">
                For stability, we require ρ &lt; 1, otherwise the queue grows infinitely.
              </p>
            </div>
            <div>
              <p className="font-medium">Average Queue Length (L):</p>
              <p className="font-mono bg-white p-2 rounded mt-1">L = ρ/(1-ρ)</p>
              <p className="text-sm mt-1">
                As ρ approaches 1, the queue length approaches infinity.
              </p>
            </div>
            <div>
              <p className="font-medium">Average Wait Time (W):</p>
              <p className="font-mono bg-white p-2 rounded mt-1">W = 1/(μ-λ)</p>
              <p className="text-sm mt-1">
                The average time a packet spends in the system (queue + service).
              </p>
            </div>
            <div>
              <p className="font-medium">Little's Law:</p>
              <p className="font-mono bg-white p-2 rounded mt-1">L = λW</p>
              <p className="text-sm mt-1">
                The relationship between queue length, arrival rate, and wait time.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mb-6">
        Try adjusting the arrival and service rates to see how they affect the queue behavior. 
        When λ approaches μ (system load approaches 1), the queue becomes increasingly unstable. 
        When λ exceeds μ, the queue will grow without bound over time.
      </p>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm">
          <strong>Note:</strong> This visualization simplifies real network behavior. Actual network 
          queues might have variable service times, multiple servers, different queue disciplines 
          (like priority queuing), or finite buffer sizes.
        </p>
      </div>
    </div>
  );
};

// Linear Systems Section
const LinearSystemsSection = ({ isPaused, arrivalRate, serviceRate, showMath }) => {
  const [timeValues, setTimeValues] = useState([]);
  const [queueLengths, setQueueLengths] = useState([]);
  const [serviceValues, setServiceValues] = useState([]);
  const timeRef = useRef(0);
  const queueRef = useRef(0);
  const serviceRef = useRef(0);
  const totalTimeRef = useRef(0);
  
  // Generate queue length over time based on differential equations
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      // Time advances consistently
      timeRef.current += 0.1;
      totalTimeRef.current += 0.1;
      
      // Calculate derivatives based on arrival/service rates
      // dQ/dt = λ - μ (when Q > 0)
      let queueDerivative = arrivalRate - serviceRate;
      
      // Ensure queue doesn't go negative
      if (queueRef.current <= 0 && queueDerivative < 0) {
        queueRef.current = 0;
        queueDerivative = Math.max(0, arrivalRate - serviceRate);
      } else {
        queueRef.current += queueDerivative * 0.1;
      }
      
      // Service rate is constant but with some noise to make visualization interesting
      serviceRef.current = serviceRate + (Math.random() - 0.5);
      
      // Update state by adding new points
      setTimeValues(prev => {
        const newValues = [...prev, timeRef.current];
        // Keep only last 100 points
        return newValues.length > 100 ? newValues.slice(-100) : newValues;
      });
      
      setQueueLengths(prev => {
        const newValues = [...prev, queueRef.current];
        return newValues.length > 100 ? newValues.slice(-100) : newValues;
      });
      
      setServiceValues(prev => {
        const newValues = [...prev, serviceRef.current];
        return newValues.length > 100 ? newValues.slice(-100) : newValues;
      });
      
      // Reset time periodically to keep graph moving
      if (timeRef.current > 10) {
        timeRef.current = 0;
        setTimeValues([]);
        setQueueLengths([]);
        setServiceValues([]);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPaused, arrivalRate, serviceRate]);
  
  // Draw the line graph
  const drawGraph = () => {
    if (timeValues.length < 2) return null;
    
    const maxQueueLength = Math.max(...queueLengths, 10);
    const width = 800;
    const height = 300;
    const padding = 40;
    
    // Map data points to SVG coordinates
    const points = timeValues.map((t, i) => ({
      x: padding + (t / 10) * (width - 2 * padding),
      y: height - padding - (queueLengths[i] / maxQueueLength) * (height - 2 * padding),
    }));
    
    // Create path for line
    let pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x},${points[i].y}`;
    }
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-lg shadow">
        {/* X and Y axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#888" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#888" strokeWidth="1" />
        
        {/* X-axis labels */}
        {[0, 2, 4, 6, 8, 10].map(tick => (
          <g key={`x-${tick}`}>
            <line 
              x1={padding + (tick / 10) * (width - 2 * padding)} 
              y1={height - padding} 
              x2={padding + (tick / 10) * (width - 2 * padding)} 
              y2={height - padding + 5} 
              stroke="#888" 
              strokeWidth="1" 
            />
            <text 
              x={padding + (tick / 10) * (width - 2 * padding)} 
              y={height - padding + 20} 
              fontSize="12" 
              textAnchor="middle"
            >
              {tick}s
            </text>
          </g>
        ))}
        
        {/* Y-axis labels */}
        {[0, maxQueueLength/4, maxQueueLength/2, 3*maxQueueLength/4, maxQueueLength].map(tick => (
          <g key={`y-${tick}`}>
            <line 
              x1={padding} 
              y1={height - padding - (tick / maxQueueLength) * (height - 2 * padding)} 
              x2={padding - 5} 
              y2={height - padding - (tick / maxQueueLength) * (height - 2 * padding)} 
              stroke="#888" 
              strokeWidth="1" 
            />
            <text 
              x={padding - 10} 
              y={height - padding - (tick / maxQueueLength) * (height - 2 * padding)} 
              fontSize="12" 
              textAnchor="end" 
              dominantBaseline="middle"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        
        {/* Queue length line */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />
        
        {/* Dashed line showing service rate */}
        <line 
          x1={padding} 
          y1={height - padding - (serviceRate / maxQueueLength) * (height - 2 * padding)} 
          x2={width - padding} 
          y2={height - padding - (serviceRate / maxQueueLength) * (height - 2 * padding)} 
          stroke="#10b981" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
        />
        
        {/* Dashed line showing arrival rate */}
        <line 
          x1={padding} 
          y1={height - padding - (arrivalRate / maxQueueLength) * (height - 2 * padding)} 
          x2={width - padding} 
          y2={height - padding - (arrivalRate / maxQueueLength) * (height - 2 * padding)} 
          stroke="#ef4444" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
        />
        
        {/* Axis labels */}
        <text x={width/2} y={height - 10} fontSize="14" textAnchor="middle">Time (seconds)</text>
        <text transform={`rotate(-90, 15, ${height/2})`} x="15" y={height/2} fontSize="14" textAnchor="middle">Queue Length</text>
        
        {/* Legend */}
        <rect x={width - 150} y="10" width="140" height="70" fill="white" opacity="0.8" rx="4" />
        <line x1={width - 140} y1="25" x2={width - 120} y2="25" stroke="#3b82f6" strokeWidth="2" />
        <text x={width - 115} y="28" fontSize="12">Queue Length</text>
        <line x1={width - 140} y1="45" x2={width - 120} y2="45" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
        <text x={width - 115} y="48" fontSize="12">Arrival Rate (λ)</text>
        <line x1={width - 140} y1="65" x2={width - 120} y2="65" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
        <text x={width - 115} y="68" fontSize="12">Service Rate (μ)</text>
      </svg>
    );
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Queue Dynamics as Linear Systems</h2>
      <p className="mb-4">
        Network queues can be modeled as linear differential equations, similar to physical systems
        like springs, circuits, or chemical reactions. This perspective allows us to apply linear algebra
        techniques and control theory to understand queue behavior.
      </p>
      
      {/* Dynamic Graph */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Queue Length Over Time</h3>
        {drawGraph()}
        <p className="mt-2 text-sm text-gray-600">
          The blue line shows queue length, the red dashed line shows arrival rate, 
          and the green dashed line shows service rate.
        </p>
      </div>
      
      {/* Mathematical Explanation */}
      {showMath && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">The Queue as a Differential Equation</h3>
          <p className="mb-4">
            We can model the queue length Q(t) as a function of time using a simple differential equation:
          </p>
          <div className="bg-white p-4 rounded mb-4 font-mono">
            dQ(t)/dt = λ(t) - μ(t) · min(1, Q(t))
          </div>
          <p className="mb-4">
            Where:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>dQ(t)/dt: Rate of change of queue length</li>
            <li>λ(t): Arrival rate (packets per unit time)</li>
            <li>μ(t): Service rate (packets per unit time)</li>
            <li>min(1, Q(t)): Ensures service only happens when queue is non-empty</li>
          </ul>
          <p className="mb-4">
            This is a first-order linear differential equation. For constant λ and μ, and Q(t) > 0, we can solve it to get:
          </p>
          <div className="bg-white p-4 rounded mb-4 font-mono">
            Q(t) = Q(0) + (λ - μ)t
          </div>
          <p>
            For a stable system (λ < μ), the queue will eventually empty and then fluctuate near zero.
            For an unstable system (λ > μ), the queue grows linearly with time.
          </p>
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-2">Key Insights from the Linear System View</h3>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Stability Analysis</h4>
          <p>
            Just like other linear systems, we can analyze queue stability through eigenvalues. 
            The system is stable when all eigenvalues have negative real parts, which corresponds to λ < μ.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Transient vs. Steady-State Behavior</h4>
          <p>
            Like electrical circuits, queues exhibit both transient (short-term) and steady-state (long-term) 
            behavior. The transient behavior depends on initial conditions, while the steady-state behavior 
            depends on system parameters.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Control Theory Applications</h4>
          <p>
            We can apply feedback control methods to regulate queue length. For example, Active Queue 
            Management (AQM) techniques like RED (Random Early Detection) adjust service rates based on queue length.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Network of Queues</h4>
          <p>
            Multiple connected queues form a network that can be represented as a system of coupled 
            differential equations. The output of one queue becomes the input to another.
          </p>
        </div>
      </div>
      
      <p className="mb-4">
        Viewing queues as linear systems connects queuing theory to the broader field of dynamical systems, 
        allowing us to leverage mathematical tools from control theory, optimization, and differential equations.
      </p>
    </div>
  );
};

// Matrix Model Section
const MatrixModelSection = ({ isPaused, arrivalRate, serviceRate, showMath }) => {
  // State for visualization
  const [networkState, setNetworkState] = useState([0, 0, 0, 0]); // States for 4 connected nodes
  const [transitionMatrix, setTransitionMatrix] = useState([
    [0.5, 0.5, 0, 0],
    [0.3, 0.3, 0.4, 0],
    [0, 0.3, 0.3, 0.4],
    [0, 0, 0.5, 0.5]
  ]);
  const [currentNode, setCurrentNode] = useState(null);
  const [packetHistory, setPacketHistory] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // References for animation
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  
  // Update transition matrix based on arrival/service rates
  useEffect(() => {
    // Normalize rates to ensure matrix rows sum to 1
    const normalized = arrivalRate / (arrivalRate + serviceRate);
    
    setTransitionMatrix([
      [1 - normalized, normalized, 0, 0],
      [0.3, 1 - 0.7 * normalized, 0.7 * normalized, 0],
      [0, 0.3, 1 - 0.7 * normalized, 0.7 * normalized],
      [0, 0, normalized, 1 - normalized]
    ]);
  }, [arrivalRate, serviceRate]);
  
  // Animation for packet flow
  useEffect(() => {
    if (isPaused) {
      cancelAnimationFrame(animationRef.current);
      return;
    }
    
    const updateNetwork = (timestamp) => {
      // Update roughly every 1000/arrivalRate milliseconds
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
      
      const deltaTime = timestamp - lastUpdateRef.current;
      setElapsedTime(prev => prev + deltaTime / 1000);
      
      if (deltaTime > 1000 / arrivalRate) {
        lastUpdateRef.current = timestamp;
        
        // If no packet is currently being processed, create a new one
        if (currentNode === null) {
          setCurrentNode(0); // Start at first node
          
          // Update node states
          setNetworkState(prev => {
            const newState = [...prev];
            newState[0] += 1; // Add packet to first node
            return newState;
          });
        } else {
          // Move packet according to transition probabilities
          const transitionProbs = transitionMatrix[currentNode];
          let rand = Math.random();
          let nextNode = currentNode; // Default to staying in current node
          
          // Determine next node based on transition probabilities
          let cumProb = 0;
          for (let i = 0; i < transitionProbs.length; i++) {
            cumProb += transitionProbs[i];
            if (rand < cumProb) {
              nextNode = i;
              break;
            }
          }
          
          // Update history
          if (nextNode !== currentNode) {
            setPacketHistory(prev => {
              const newHistory = [...prev, { from: currentNode, to: nextNode, time: elapsedTime.toFixed(1) }];
              return newHistory.length > 5 ? newHistory.slice(-5) : newHistory;
            });
          }
          
          // Update node states
          setNetworkState(prev => {
            const newState = [...prev];
            if (nextNode !== currentNode) {
              newState[currentNode] -= 1; // Remove from current
              newState[nextNode] += 1; // Add to next
            }
            return newState;
          });
          
          setCurrentNode(nextNode);
        }
      }
      
      animationRef.current = requestAnimationFrame(updateNetwork);
    };
    
    animationRef.current = requestAnimationFrame(updateNetwork);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, currentNode, transitionMatrix, arrivalRate]);
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Matrix Representations of Network Queues</h2>
      <p className="mb-4">
        Network queues form a connected system that can be elegantly represented using matrices. 
        Each node in the network is a queue, and the connections between nodes are represented by 
        transition probabilities. This matrix approach reveals the power of linear algebra in 
        modeling complex network behavior.
      </p>
      
      {/* Network Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-medium mb-4">Network of Queues Visualization</h3>
        
        <svg width="100%" height="200" viewBox="0 0 600 200">
          {/* Connections between nodes */}
          <path d="M150,100 C200,50 250,50 300,100" stroke="#ddd" strokeWidth="2" fill="none" />
          <path d="M300,100 C350,50 400,50 450,100" stroke="#ddd" strokeWidth="2" fill="none" />
          <path d="M150,100 C200,150 250,150 300,100" stroke="#ddd" strokeWidth="2" fill="none" />
          <path d="M300,100 C350,150 400,150 450,100" stroke="#ddd" strokeWidth="2" fill="none" />
          
          {/* Self-loops */}
          <path d="M150,100 C120,70 120,130 150,100" stroke="#ddd" strokeWidth="2" fill="none" />
          <path d="M300,100 C270,70 270,130 300,100" stroke="#ddd" strokeWidth="2" fill="none" />
          <path d="M450,100 C420,70 420,130 450,100" stroke="#ddd" strokeWidth="2" fill="none" />
          
          {/* Nodes */}
          {[0, 1, 2, 3].map(index => {
            const x = 150 + index * 100;
            const isActive = index === currentNode;
            const packets = networkState[index];
            
            return (
              <g key={index}>
                <circle 
                  cx={x} 
                  cy="100" 
                  r="30" 
                  fill={isActive ? "#e0f2fe" : "white"} 
                  stroke={isActive ? "#3b82f6" : "#cbd5e1"} 
                  strokeWidth="2" 
                />
                <text x={x} y="105" textAnchor="middle" fontSize="14" fontWeight={isActive ? "bold" : "normal"}>
                  Node {index+1}
                </text>
                {packets > 0 && (
                  <circle 
                    cx={x} 
                    cy="70" 
                    r="15" 
                    fill="#3b82f6" 
                    className={isActive ? "animate-pulse" : ""}
                  />
                )}
                {packets > 0 && (
                  <text x={x} y="75" textAnchor="middle" fontSize="12" fill="white">
                    {packets}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Transition Matrix Display */}
        <div className="mt-6">
          <h4 className="font-medium mb-2">Transition Probability Matrix</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2"></th>
                  {[1, 2, 3, 4].map(i => (
                    <th key={i} className="px-4 py-2 bg-gray-50">To Node {i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transitionMatrix.map((row, i) => (
                  <tr key={i}>
                    <th className="px-4 py-2 text-left bg-gray-50">From Node {i+1}</th>
                    {row.map((prob, j) => (
                      <td 
                        key={j} 
                        className={`px-4 py-2 text-center ${
                          i === currentNode ? 'bg-blue-50' : ''
                        } ${
                          prob > 0.1 ? 'font-medium' : ''
                        }`}
                        style={{ opacity: prob < 0.01 ? 0.3 : 1 }}
                      >
                        {prob.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Packet Movement History */}
        <div className="mt-6">
          <h4 className="font-medium mb-2">Recent Packet Movements</h4>
          {packetHistory.length > 0 ? (
            <div className="space-y-1">
              {packetHistory.slice().reverse().map((entry, i) => (
                <div key={i} className="text-sm">
                  <span className="text-gray-500">[{entry.time}s]</span> Packet moved from Node {entry.from + 1} to Node {entry.to + 1}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No movements yet</div>
          )}
        </div>
      </div>
      
      {/* Mathematical Explanation */}
      {showMath && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Markov Chain Analysis</h3>
          <p className="mb-3">
            The network of queues can be modeled as a Markov chain, where each state represents the number of 
            packets in a specific node, and transitions between states are governed by the transition matrix P.
          </p>
          
          <div className="mb-4">
            <p className="font-medium mb-1">State Vector and Transition Matrix</p>
            <div className="bg-white p-3 rounded mb-2 font-mono">
              π(t+1) = π(t) · P
            </div>
            <p className="text-sm">
              Where π(t) is the state probability vector at time t, and P is the transition matrix.
            </p>
          </div>
          
          <div className="mb-4">
            <p className="font-medium mb-1">Steady-State Analysis</p>
            <div className="bg-white p-3 rounded mb-2 font-mono">
              π = π · P
            </div>
            <p className="text-sm">
              In steady state, the probability distribution π doesn't change over time.
              This is an eigenvalue problem where π is the eigenvector of P with eigenvalue 1.
            </p>
          </div>
          
          <div>
            <p className="font-medium mb-1">Jackson Network Analysis</p>
            <p className="text-sm">
              For a network of M/M/1 queues (Jackson network), the joint probability distribution 
              has a product form solution:
            </p>
            <div className="bg-white p-3 rounded mt-2 font-mono">
              P(n₁, n₂, ..., nₘ) = P₁(n₁) · P₂(n₂) · ... · Pₘ(nₘ)
            </div>
            <p className="text-sm mt-2">
              Where Pⱼ(nⱼ) is the steady-state probability of having nⱼ packets in queue j.
            </p>
          </div>
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-2">Applications of Matrix-Based Analysis</h3>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Network Design Optimization</h4>
          <p>
            Matrix eigenvalue analysis helps optimize network topology for 
            minimal delay and maximum throughput by ensuring stability and 
            balanced load distribution.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Traffic Engineering</h4>
          <p>
            By modeling traffic flow as state transitions, network engineers 
            can predict congestion points and implement traffic shaping 
            policies to optimize performance.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Failure Analysis</h4>
          <p>
            Matrix models help analyze how network failures propagate through 
            the system and identify critical nodes that need redundancy or 
            special protection measures.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Quality of Service Guarantees</h4>
          <p>
            By understanding state probabilities, network providers can offer 
            statistical guarantees on packet delays and loss rates, essential 
            for real-time applications.
          </p>
        </div>
      </div>
      
      <p>
        The matrix perspective reveals the elegant mathematical structure underlying complex network behavior. 
        By leveraging linear algebra, we gain powerful tools for analyzing, predicting, and optimizing network 
        performance at scale.
      </p>
    </div>
  );
};

// Signal Processing Section
const SignalsAnalysisSection = ({ isPaused, arrivalRate, serviceRate, showMath }) => {
  // State for visualization
  const [timeData, setTimeData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filterCutoff, setFilterCutoff] = useState(5);
  const [noiseLevel, setNoiseLevel] = useState(0.3);
  
  // References for animation
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  
  // Generate signal with variable rate
  useEffect(() => {
    if (isPaused) {
      cancelAnimationFrame(animationRef.current);
      return;
    }
    
    const generateSignal = (timestamp) => {
      // Update time
      timeRef.current += 0.1;
      if (timeRef.current > 20) {
        timeRef.current = 0;
        setTimeData([]);
        setFrequencyData([]);
      }
      
      // Generate a signal with periodic arrivals plus some randomness
      // Base signal with frequency corresponding to arrival rate
      const baseSignal = Math.sin(2 * Math.PI * arrivalRate * timeRef.current / 10);
      
      // Add harmonics for more realistic network traffic
      const harmonics = 
        0.5 * Math.sin(2 * Math.PI * arrivalRate * 2 * timeRef.current / 10) + 
        0.25 * Math.sin(2 * Math.PI * arrivalRate * 3 * timeRef.current / 10);
      
      // Add noise
      const noise = (Math.random() - 0.5) * noiseLevel;
      
      // Combined signal
      const signal = baseSignal + harmonics + noise;
      
      // Update time domain data
      setTimeData(prev => {
        const newData = [...prev, { time: timeRef.current, value: signal }];
        return newData.length > 100 ? newData.slice(-100) : newData;
      });
      
      // Calculate frequency domain data (simple DFT approximation)
      if (timeRef.current % 0.5 < 0.1) { // Update spectrum every 0.5 time units
        const timeValues = [...timeData.map(point => point.value), signal];
        const frequencies = [];
        
        // Calculate simplified DFT for a range of frequencies
        for (let freq = 0; freq <= 15; freq += 0.5) {
          let real = 0;
          let imag = 0;
          
          for (let t = 0; t < timeValues.length; t++) {
            const time = t * 0.1;
            real += timeValues[t] * Math.cos(2 * Math.PI * freq * time);
            imag -= timeValues[t] * Math.sin(2 * Math.PI * freq * time);
          }
          
          // Magnitude
          const magnitude = Math.sqrt(real*real + imag*imag) / timeValues.length;
          frequencies.push({ frequency: freq, magnitude });
        }
        
        setFrequencyData(frequencies);
      }
      
      animationRef.current = requestAnimationFrame(generateSignal);
    };
    
    animationRef.current = requestAnimationFrame(generateSignal);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, arrivalRate, noiseLevel, timeData]);
  
  // Draw time domain graph
  const drawTimeGraph = () => {
    if (timeData.length < 2) return null;
    
    const width = 800;
    const height = 200;
    const padding = 40;
    
    // Map data points to SVG coordinates
    const points = timeData.map(point => ({
      x: padding + (point.time / 20) * (width - 2 * padding),
      y: height / 2 - point.value * (height / 4),
    }));
    
    // Create path for line
    let pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x},${points[i].y}`;
    }
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-lg shadow">
        {/* X and Y axes */}
        <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#888" strokeWidth="1" />
        <line x1={padding} y1={padding/2} x2={padding} y2={height - padding/2} stroke="#888" strokeWidth="1" />
        
        {/* Grid lines */}
        <line 
          x1={padding} 
          y1={height/2 - height/4} 
          x2={width - padding} 
          y2={height/2 - height/4} 
          stroke="#eee" 
          strokeWidth="1" 
        />
        <line 
          x1={padding} 
          y1={height/2 + height/4} 
          x2={width - padding} 
          y2={height/2 + height/4} 
          stroke="#eee" 
          strokeWidth="1" 
        />
        
        {/* X-axis labels */}
        {[0, 5, 10, 15, 20].map(tick => (
          <g key={`x-${tick}`}>
            <line 
              x1={padding + (tick / 20) * (width - 2 * padding)} 
              y1={height/2} 
              x2={padding + (tick / 20) * (width - 2 * padding)} 
              y2={height/2 + 5} 
              stroke="#888" 
              strokeWidth="1" 
            />
            <text 
              x={padding + (tick / 20) * (width - 2 * padding)} 
              y={height/2 + 20} 
              fontSize="12" 
              textAnchor="middle"
            >
              {tick}s
            </text>
          </g>
        ))}
        
        {/* Signal line */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />
        
        {/* Axis labels */}
        <text x={width/2} y={height - 10} fontSize="14" textAnchor="middle">Time (seconds)</text>
        <text transform={`rotate(-90, 15, ${height/2})`} x="15" y={height/2} fontSize="14" textAnchor="middle">Amplitude</text>
      </svg>
    );
  };
  
  // Draw frequency domain graph
  const drawFrequencyGraph = () => {
    if (frequencyData.length < 2) return null;
    
    const width = 800;
    const height = 200;
    const padding = 40;
    
    // Find max magnitude for scaling
    const maxMagnitude = Math.max(...frequencyData.map(point => point.magnitude), 0.5);
    
    // Apply low-pass filter if enabled
    const filteredData = showFilter 
      ? frequencyData.map(point => ({
          ...point, 
          magnitude: point.frequency > filterCutoff 
            ? point.magnitude * Math.exp(-(point.frequency - filterCutoff) / 2) 
            : point.magnitude
        }))
      : frequencyData;
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-lg shadow">
        {/* X and Y axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#888" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#888" strokeWidth="1" />
        
        {/* X-axis labels */}
        {[0, 5, 10, 15].map(tick => (
          <g key={`x-${tick}`}>
            <line 
              x1={padding + (tick / 15) * (width - 2 * padding)} 
              y1={height - padding} 
              x2={padding + (tick / 15) * (width - 2 * padding)} 
              y2={height - padding + 5} 
              stroke="#888" 
              strokeWidth="1" 
            />
            <text 
              x={padding + (tick / 15) * (width - 2 * padding)} 
              y={height - padding + 20} 
              fontSize="12" 
              textAnchor="middle"
            >
              {tick} Hz
            </text>
          </g>
        ))}
        
        {/* Bars for frequency components */}
        {filteredData.map((point, index) => (
          <rect 
            key={index}
            x={padding + (point.frequency / 15) * (width - 2 * padding) - 4}
            y={height - padding - (point.magnitude / maxMagnitude) * (height - 2 * padding)}
            width={8}
            height={(point.magnitude / maxMagnitude) * (height - 2 * padding)}
            fill={showFilter ? "#10b981" : "#3b82f6"}
          />
        ))}
        
        {/* Filter cutoff line */}
        {showFilter && (
          <line 
            x1={padding + (filterCutoff / 15) * (width - 2 * padding)}
            y1={padding}
            x2={padding + (filterCutoff / 15) * (width - 2 * padding)}
            y2={height - padding}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        
        {/* Axis labels */}
        <text x={width/2} y={height - 10} fontSize="14" textAnchor="middle">Frequency (Hz)</text>
        <text transform={`rotate(-90, 15, ${height/2})`} x="15" y={height/2} fontSize="14" textAnchor="middle">Magnitude</text>
      </svg>
    );
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Signal Processing: Time and Frequency Domain Analysis</h2>
      <p className="mb-4">
        Network traffic can be viewed as a signal varying over time. Signal processing techniques 
        allow us to analyze this traffic in both time domain (how it changes over time) and frequency 
        domain (what periodic patterns exist). This dual perspective is crucial for understanding 
        network behavior, optimizing performance, and detecting anomalies.
      </p>
      
      {/* Time Domain Visualization */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Time Domain Representation</h3>
          <div className="space-x-2">
            <label className="text-sm">
              Noise:
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={noiseLevel} 
                onChange={(e) => setNoiseLevel(parseFloat(e.target.value))} 
                className="ml-2 w-20"
              />
            </label>
          </div>
        </div>
        {drawTimeGraph()}
        <p className="mt-2 text-sm text-gray-600">
          The time domain shows packet arrivals as a signal varying over time. 
          The base frequency corresponds to the arrival rate (λ = {arrivalRate} packets/sec), 
          with additional harmonics and noise.
        </p>
      </div>
      
      {/* Frequency Domain Visualization */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Frequency Domain Representation</h3>
          <div className="space-x-3">
            <label className="text-sm flex items-center">
              <input 
                type="checkbox" 
                checked={showFilter} 
                onChange={() => setShowFilter(!showFilter)} 
                className="mr-2"
              />
              Apply Low-Pass Filter
            </label>
            {showFilter && (
              <label className="text-sm">
                Cutoff:
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.5" 
                  value={filterCutoff} 
                  onChange={(e) => setFilterCutoff(parseFloat(e.target.value))} 
                  className="ml-2 w-20"
                />
                {filterCutoff} Hz
              </label>
            )}
          </div>
        </div>
        {drawFrequencyGraph()}
        <p className="mt-2 text-sm text-gray-600">
          The frequency domain reveals periodic patterns in the traffic. 
          The main peak corresponds to the arrival rate (λ = {arrivalRate} packets/sec), 
          with harmonics at multiples of this frequency.
          {showFilter && ' The low-pass filter removes high-frequency noise, simulating traffic smoothing.'}
        </p>
      </div>
      
      {/* Mathematical Explanation */}
      {showMath && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Mathematical Foundation</h3>
          
          <div className="mb-4">
            <p className="font-medium mb-1">Fourier Transform</p>
            <div className="bg-white p-3 rounded mb-2 font-mono">
              X(f) = ∫ x(t) · e^(-j2πft) dt
            </div>
            <p className="text-sm">
              The Fourier transform converts a time-domain signal x(t) to its frequency domain 
              representation X(f), revealing the frequency components present in the signal.
            </p>
          </div>
          
          <div className="mb-4">
            <p className="font-medium mb-1">Power Spectral Density</p>
            <div className="bg-white p-3 rounded mb-2 font-mono">
              S_xx(f) = |X(f)|²
            </div>
            <p className="text-sm">
              The power spectral density shows how the power of the signal is distributed 
              across frequencies. This helps identify dominant periodicities in network traffic.
            </p>
          </div>
          
          <div className="mb-4">
            <p className="font-medium mb-1">Low-Pass Filter Transfer Function</p>
            <div className="bg-white p-3 rounded mb-2 font-mono">
              H(f) = { f ≤ f_c: 1, f > f_c: e^(-(f-f_c)/σ) }
            </div>
            <p className="text-sm">
              A low-pass filter attenuates high-frequency components while preserving 
              low-frequency ones. This can smooth out traffic and reduce noise.
            </p>
          </div>
          
          <div>
            <p className="font-medium mb-1">Cross-Correlation</p>
            <div className="bg-white p-3 rounded mb-2 font-mono">
              R_xy(τ) = ∫ x(t) · y(t+τ) dt
            </div>
            <p className="text-sm">
              Cross-correlation measures the similarity between two signals as a function of time lag.
              This is useful for detecting patterns or delays between input and output queue signals.
            </p>
          </div>
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-2">Applications in Network Analysis</h3>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Traffic Pattern Recognition</h4>
          <p>
            Frequency analysis can reveal periodic patterns in network traffic, 
            such as daily cycles, weekly peaks, or application-specific signatures. 
            This helps in capacity planning and anomaly detection.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Traffic Shaping and Filtering</h4>
          <p>
            Signal processing filters can be implemented to smooth traffic flows, 
            reduce burstiness, and prioritize certain types of traffic. Low-pass 
            filters help maintain stable network performance.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Anomaly Detection</h4>
          <p>
            Unusual frequency components or changes in the power spectrum can 
            indicate network attacks, equipment failures, or other anomalies. 
            Signal processing enables sophisticated real-time monitoring.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">Network Performance Characterization</h4>
          <p>
            Transfer function analysis between input and output signals helps 
            characterize how networks respond to different traffic patterns, 
            identifying potential bottlenecks or instabilities.
          </p>
        </div>
      </div>
      
      <p>
        Signal processing techniques provide powerful tools for understanding and optimizing network 
        performance. By viewing network traffic in both time and frequency domains, engineers can 
        gain deeper insights into network behavior, develop more effective traffic management 
        strategies, and build more robust systems.
      </p>
    </div>
  );
};

export default NetworkQueuesBlog;