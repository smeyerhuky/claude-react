import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei';
import { LineChart, Line as RechartsLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import * as THREE from 'three';

// Tab Components
const TabContainer = ({ children, className = '' }) => (
  <div className={`tab-container ${className}`}>
    {children}
  </div>
);

const TabList = ({ children, className = '' }) => (
  <div className={`flex border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const Tab = ({ children, isActive, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 font-medium text-sm transition-all duration-200
      border-b-2 focus:outline-none
      ${isActive 
        ? 'border-blue-500 text-blue-600 bg-blue-50' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }
      ${className}
    `}
  >
    {children}
  </button>
);

const TabPanel = ({ children, isActive, className = '' }) => (
  <div 
    className={`tab-panel ${className}`}
    style={{ display: isActive ? 'block' : 'none' }}
  >
    {children}
  </div>
);

// Three.js 3D Components
const PanTiltMechanism3D = ({ panAngle, tiltAngle, showForces }) => {
  return (
    <group>
      {/* Base servo */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[1, 0.5, 0.8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      {/* Pan platform */}
      <group rotation-y={THREE.MathUtils.degToRad(panAngle)}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.2, 32]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        
        {/* Tilt mechanism */}
        <group position={[0, 0.2, 0]} rotation-x={THREE.MathUtils.degToRad(tiltAngle)}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.4]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          
          {/* Camera mount */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.3]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
        </group>
      </group>
      
      {/* Force vectors */}
      {showForces && (
        <group>
          <Line
            points={[
              [0, 0, 0], 
              [Math.sin(THREE.MathUtils.degToRad(panAngle)) * 1.5, 0, Math.cos(THREE.MathUtils.degToRad(panAngle)) * 1.5]
            ]}
            color="red"
            lineWidth={2}
          />
          <Line
            points={[
              [0, 0.2, 0],
              [0, 0.2 + Math.sin(THREE.MathUtils.degToRad(tiltAngle)) * 1.5, Math.cos(THREE.MathUtils.degToRad(tiltAngle)) * 1.5]
            ]}
            color="green"
            lineWidth={2}
          />
        </group>
      )}
    </group>
  );
};

// Main Unified Dashboard Component
const UnifiedDashboard = () => {
  // Core state management
  const [mode, setMode] = useState('simulator'); // 'simulator' or 'live'
  const [activeTab, setActiveTab] = useState(0);
  const [servoAngle, setServoAngle] = useState(90);
  const [panAngle, setPanAngle] = useState(0);
  const [tiltAngle, setTiltAngle] = useState(0);
  const [simulationAngle, setSimulationAngle] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showForces, setShowForces] = useState(true);
  const [camPhase, setCamPhase] = useState(0);
  const [view3D, setView3D] = useState(false);
  const [dataLog, setDataLog] = useState([]);
  
  // Live integration state
  const [isConnected, setIsConnected] = useState(false);
  const [carStatus, setCarStatus] = useState({
    ip: '192.168.4.1',
    batteryVoltage: 7.4,
    wifiStrength: -45,
    servos: { pan: 0, tilt: 0 },
    motors: { left: 0, right: 0 },
    sensors: { front: 100, left: 100, right: 100 }
  });
  
  const [telemetryData, setTelemetryData] = useState([]);
  const [logMessages, setLogMessages] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  
  const animationRef = useRef();
  const lastTimeRef = useRef(0);
  const wsRef = useRef(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const mechanismTypes = [
    {
      name: "Cam Mechanism",
      description: "Utilizes cam profiles for pan and tilt conversion",
      complexity: "Medium",
      cost: "Low"
    },
    {
      name: "Differential Gearbox",
      description: "Employs gear differentials for dual-axis control",
      complexity: "High",
      cost: "Medium"
    },
    {
      name: "Sequential Motion",
      description: "Alternates between axes using mechanical locks",
      complexity: "Low",
      cost: "Low"
    },
    {
      name: "Helical Coupling",
      description: "Uses helical guides for compound motion",
      complexity: "Medium",
      cost: "Medium"
    }
  ];

  // WebSocket connection management
  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(`ws://${carStatus.ip}:8080`);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        addLogMessage('WebSocket connected', 'success');
        
        // Send initial configuration
        sendCommand({
          action: 'set_mechanism',
          mechanism: mechanismTypes[activeTab].name.toLowerCase().replace(/\s+/g, '_')
        });
      };
      
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleIncomingMessage(message);
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        addLogMessage('WebSocket disconnected', 'error');
        attemptReconnect();
      };
      
      wsRef.current.onerror = (error) => {
        addLogMessage(`WebSocket error: ${error.message}`, 'error');
      };
    } catch (error) {
      addLogMessage(`Connection error: ${error.message}`, 'error');
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttempts < 3) {
      setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        connectWebSocket();
      }, 3000);
    }
  };

  const handleIncomingMessage = (message) => {
    switch (message.type) {
      case 'telemetry':
        updateTelemetry(message.payload);
        break;
      case 'status':
        updateCarStatus(message.payload);
        break;
      case 'command_ack':
        addLogMessage(`Command acknowledged: ${message.payload.command}`, 'info');
        break;
      default:
        addLogMessage(`Unknown message type: ${message.type}`, 'warning');
    }
  };

  const updateTelemetry = (payload) => {
    const newDataPoint = {
      timestamp: Date.now(),
      ...payload
    };
    
    setTelemetryData(prev => [...prev.slice(-100), newDataPoint]);
    setDataLog(prev => [...prev.slice(-100), newDataPoint]);
    
    if (mode === 'live') {
      setServoAngle(payload.servoAngle);
      setPanAngle(payload.panAngle);
      setTiltAngle(payload.tiltAngle);
    }
  };

  const updateCarStatus = (status) => {
    setCarStatus(prev => ({ ...prev, ...status }));
  };

  const addLogMessage = (message, type = 'info') => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    
    setLogMessages(prev => [...prev.slice(-50), logEntry]);
  };

  // Command sending functions
  const sendCommand = (command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const commandPacket = {
        type: 'command',
        timestamp: Date.now(),
        payload: command
      };
      
      wsRef.current.send(JSON.stringify(commandPacket));
      setCommandHistory(prev => [...prev.slice(-20), commandPacket]);
      addLogMessage(`Command sent: ${command.action}`, 'info');
    } else {
      addLogMessage('Cannot send command: Not connected', 'error');
    }
  };

  // Physics simulation effect
  useEffect(() => {
    if (isPlaying && mode === 'simulator') {
      const animate = (currentTime) => {
        if (!lastTimeRef.current) lastTimeRef.current = currentTime;
        const deltaTime = (currentTime - lastTimeRef.current) * 0.001;
        lastTimeRef.current = currentTime;

        setSimulationAngle(prevAngle => {
          let newAngle = prevAngle + speed * 45 * deltaTime;
          if (newAngle > 180) newAngle = 0;
          return newAngle;
        });

        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, mode]);

  // Update pan/tilt based on servo angle
  useEffect(() => {
    const angle = isPlaying ? simulationAngle : servoAngle;
    
    if (mode === 'simulator') {
      switch (activeTab) {
        case 0: // Cam Mechanism
          const camProfile = Math.sin(angle * Math.PI / 180) * 0.8 + Math.cos(angle * Math.PI / 90) * 0.2;
          setPanAngle(camProfile * 35);
          setTiltAngle(Math.cos(angle * Math.PI / 180) * 25);
          setCamPhase(angle);
          break;
        
        case 1: // Differential Gearbox
          const torqueRatio = 0.6;
          setPanAngle((angle - 90) * 0.7);
          setTiltAngle((angle - 90) * 0.4 * torqueRatio);
          break;
        
        case 2: // Sequential Motion
          const transitionPoint = 90;
          if (angle < transitionPoint) {
            setPanAngle((angle / transitionPoint) * 45 - 22.5);
            setTiltAngle(0);
          } else {
            setPanAngle(22.5);
            setTiltAngle(((angle - transitionPoint) / (180 - transitionPoint)) * 30 - 15);
          }
          break;
        
        case 3: // Helical Coupling
          const helixPitch = 2.0;
          setPanAngle(Math.sin(angle * Math.PI / 180 * helixPitch) * 40);
          setTiltAngle(Math.cos(angle * Math.PI / 90) * 30);
          break;
      }
    }
    
    if (mode === 'live' && isConnected) {
      sendCommand({
        action: 'servo_control',
        angle: angle,
        mechanism: mechanismTypes[activeTab].name.toLowerCase().replace(/\s+/g, '_')
      });
    }
  }, [servoAngle, simulationAngle, activeTab, isPlaying, mode, isConnected]);

  // Export functionality
  const exportData = () => {
    const dataStr = JSON.stringify(dataLog, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pantilt-data-${mechanismTypes[activeTab].name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // UI Components
  const ConnectionStatus = () => (
    <div className={`p-4 rounded-lg shadow-md ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`font-medium ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <div>IP: {carStatus.ip}</div>
        <div>WiFi: {carStatus.wifiStrength} dBm</div>
        <div>Battery: {carStatus.batteryVoltage.toFixed(1)}V</div>
      </div>
    </div>
  );

  const ModeSelector = () => (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => setMode('simulator')}
        className={`px-4 py-2 rounded transition-colors ${
          mode === 'simulator' 
            ? 'bg-white shadow text-blue-600 font-medium' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Simulator Mode
      </button>
      <button
        onClick={() => setMode('live')}
        className={`px-4 py-2 rounded transition-colors ${
          mode === 'live' 
            ? 'bg-white shadow text-green-600 font-medium' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Live Control
      </button>
    </div>
  );

  // SVG Components for visualization
  const ForceArrow = ({ x1, y1, x2, y2, color = "red", label = "" }) => (
    <g className={showForces ? "opacity-100" : "opacity-0"}>
      <defs>
        <marker 
          id={`arrow-${color}`} 
          viewBox="0 0 10 10" 
          refX="9" 
          refY="5" 
          markerWidth="6" 
          markerHeight="6" 
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line 
        x1={x1} 
        y1={y1} 
        x2={x2} 
        y2={y2} 
        stroke={color} 
        strokeWidth="2" 
        markerEnd={`url(#arrow-${color})`}
      />
      {label && (
        <text x={x2 + 5} y={y2 - 5} fill={color} fontSize="12">
          {label}
        </text>
      )}
    </g>
  );

  const CamMechanism = () => {
    const camRadius = 40;
    const camProfile = Array.from({ length: 36 }, (_, i) => {
      const angle = i * 10;
      const r = camRadius * (1 + 0.3 * Math.sin(angle * Math.PI / 180) + 0.1 * Math.cos(angle * Math.PI / 90));
      return `${r * Math.cos(angle * Math.PI / 180)}, ${r * Math.sin(angle * Math.PI / 180)}`;
    }).join(" ");

    return (
      <svg viewBox="-100 -100 200 200" className="w-full h-full">
        <g transform={`rotate(${camPhase})`}>
          <polygon points={camProfile} fill="#3b82f6" stroke="#1e293b" strokeWidth="2" />
          <circle r="5" fill="#1e293b" />
        </g>
        
        <g transform={`translate(${camRadius * Math.cos(camPhase * Math.PI / 180)}, ${camRadius * Math.sin(camPhase * Math.PI / 180)})`}>
          <circle r="8" fill="#ef4444" />
          <line x1="0" y1="0" x2={Math.cos(panAngle * Math.PI / 180) * 30} y2={Math.sin(panAngle * Math.PI / 180) * 30} stroke="#1e293b" strokeWidth="3" />
        </g>
        
        <ForceArrow 
          x1="0" 
          y1="0" 
          x2={Math.cos(camPhase * Math.PI / 180) * 50} 
          y2={Math.sin(camPhase * Math.PI / 180) * 50} 
          color="#ef4444" 
          label="F"
        />
      </svg>
    );
  };

  const DifferentialGearbox = () => {
    const angle = isPlaying ? simulationAngle : servoAngle;
    
    return (
      <svg viewBox="-100 -100 200 200" className="w-full h-full">
        {/* Main gear */}
        <g transform={`rotate(${angle})`}>
          <circle r="40" fill="none" stroke="#3b82f6" strokeWidth="8" />
          {Array.from({ length: 20 }, (_, i) => {
            const toothAngle = i * 18;
            return (
              <rect
                key={i}
                x="-5"
                y="36"
                width="10"
                height="8"
                fill="#3b82f6"
                transform={`rotate(${toothAngle})`}
              />
            );
          })}
          <circle r="5" fill="#1e293b" />
        </g>
        
        {/* Differential gears */}
        <g transform={`translate(45, 0) rotate(${-angle * 1.7})`}>
          <circle r="25" fill="none" stroke="#ef4444" strokeWidth="6" />
          {Array.from({ length: 12 }, (_, i) => {
            const toothAngle = i * 30;
            return (
              <rect
                key={i}
                x="-4"
                y="22"
                width="8"
                height="6"
                fill="#ef4444"
                transform={`rotate(${toothAngle})`}
              />
            );
          })}
        </g>
        
        <g transform={`translate(-45, 0) rotate(${angle * 0.7})`}>
          <circle r="25" fill="none" stroke="#10b981" strokeWidth="6" />
          {Array.from({ length: 12 }, (_, i) => {
            const toothAngle = i * 30;
            return (
              <rect
                key={i}
                x="-4"
                y="22"
                width="8"
                height="6"
                fill="#10b981"
                transform={`rotate(${toothAngle})`}
              />
            );
          })}
        </g>
        
        <ForceArrow 
          x1="0" 
          y1="0" 
          x2={Math.cos(angle * Math.PI / 180) * 50} 
          y2={Math.sin(angle * Math.PI / 180) * 50} 
          color="#3b82f6" 
          label="T"
        />
      </svg>
    );
  };

  const SequentialMotion = () => {
    const angle = isPlaying ? simulationAngle : servoAngle;
    const isFirstPhase = angle < 90;
    
    return (
      <svg viewBox="-100 -100 200 200" className="w-full h-full">
        {/* Servo wheel */}
        <g transform={`rotate(${angle})`}>
          <circle r="35" fill="#3b82f6" stroke="#1e293b" strokeWidth="2" />
          <line x1="0" y1="0" x2="35" y2="0" stroke="#1e293b" strokeWidth="4" />
          <circle r="5" fill="#1e293b" />
        </g>
        
        {/* Lock mechanism */}
        <g transform={`translate(0, -60)`}>
          <rect 
            x="-15" 
            y={isFirstPhase ? "-5" : "-15"} 
            width="30" 
            height="10" 
            fill={isFirstPhase ? "#ef4444" : "#10b981"} 
            stroke="#1e293b" 
            strokeWidth="2"
          />
          <text x="0" y={isFirstPhase ? "-10" : "-20"} textAnchor="middle" fontSize="10" fill="#1e293b">
            {isFirstPhase ? "PAN" : "TILT"}
          </text>
        </g>
        
        {/* Pan platform */}
        <g transform={`translate(0, 50) rotate(${panAngle})`}>
          <rect x="-40" y="-5" width="80" height="10" fill="#ef4444" stroke="#1e293b" strokeWidth="2" />
        </g>
        
        {/* Tilt platform */}
        <g transform={`translate(50, 0) rotate(${tiltAngle})`}>
          <rect x="-5" y="-30" width="10" height="60" fill="#10b981" stroke="#1e293b" strokeWidth="2" />
        </g>
        
        <ForceArrow 
          x1="0" 
          y1="0" 
          x2={Math.cos(angle * Math.PI / 180) * 50} 
          y2={Math.sin(angle * Math.PI / 180) * 50} 
          color="#3b82f6" 
          label="F"
        />
      </svg>
    );
  };

  const HelicalCoupling = () => {
    const angle = isPlaying ? simulationAngle : servoAngle;
    const helixRadius = 30;
    const helixHeight = 80;
    const helixTurns = 3;
    
    const helixPath = Array.from({ length: 100 }, (_, i) => {
      const t = i / 100 * helixTurns * Math.PI * 2;
      const x = helixRadius * Math.cos(t);
      const y = -helixHeight/2 + (i / 100) * helixHeight;
      return `${x},${y}`;
    }).join(" ");
    
    return (
      <svg viewBox="-100 -100 200 200" className="w-full h-full">
        {/* Helical guide */}
        <polyline 
          points={helixPath} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="4"
        />
        
        {/* Moving follower */}
        <g transform={`translate(${Math.sin(angle * Math.PI / 180 * 2) * helixRadius}, ${-helixHeight/2 + (angle / 180) * helixHeight})`}>
          <circle r="8" fill="#ef4444" stroke="#1e293b" strokeWidth="2" />
          <line 
            x1="0" 
            y1="0" 
            x2={Math.cos(panAngle * Math.PI / 180) * 30} 
            y2={Math.sin(panAngle * Math.PI / 180) * 30} 
            stroke="#1e293b" 
            strokeWidth="3"
          />
        </g>
        
        {/* Servo base */}
        <g transform={`translate(0, ${helixHeight/2 + 20}) rotate(${angle})`}>
          <rect x="-20" y="-5" width="40" height="10" fill="#10b981" stroke="#1e293b" strokeWidth="2" />
          <circle r="5" fill="#1e293b" />
        </g>
        
        <ForceArrow 
          x1="0" 
          y1={helixHeight/2 + 20} 
          x2={Math.cos(angle * Math.PI / 180) * 50} 
          y2={helixHeight/2 + 20 + Math.sin(angle * Math.PI / 180) * 50} 
          color="#3b82f6" 
          label="T"
        />
      </svg>
    );
  };

  const renderMechanism = () => {
    switch (activeTab) {
      case 0: return <CamMechanism />;
      case 1: return <DifferentialGearbox />;
      case 2: return <SequentialMotion />;
      case 3: return <HelicalCoupling />;
      default: 
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Visualization for {mechanismTypes[activeTab].name}
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-xl">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Single Servo Pan-Tilt Control System
        </h1>
        <div className="flex gap-4 items-center">
          <ModeSelector />
          {mode === 'live' && (
            <button
              onClick={connectWebSocket}
              disabled={isConnected}
              className={`px-4 py-2 rounded transition-colors ${
                isConnected 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isConnected ? 'Connected' : 'Connect'}
            </button>
          )}
          <button
            onClick={() => setView3D(!view3D)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
          >
            {view3D ? '2D View' : '3D View'}
          </button>
          <button
            onClick={exportData}
            disabled={dataLog.length === 0}
            className={`px-4 py-2 rounded transition-colors ${
              dataLog.length === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-violet-500 hover:bg-violet-600 text-white'
            }`}
          >
            Export Data
          </button>
        </div>
      </div>
      
      <TabContainer>
        <TabList>
          {mechanismTypes.map((type, index) => (
            <Tab
              key={index}
              isActive={activeTab === index}
              onClick={() => setActiveTab(index)}
            >
              {type.name}
            </Tab>
          ))}
        </TabList>

        {mechanismTypes.map((type, index) => (
          <TabPanel key={index} isActive={activeTab === index}>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              {/* Main Visualization Column */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4 text-slate-800">
                    {type.name} Visualization
                  </h2>
                  <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="aspect-square">
                      {view3D ? (
                        <Canvas>
                          <PerspectiveCamera makeDefault position={[3, 3, 3]} />
                          <OrbitControls enablePan={false} />
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[5, 5, 5]} intensity={1} />
                          <gridHelper args={[10, 10]} />
                          <PanTiltMechanism3D 
                            panAngle={panAngle} 
                            tiltAngle={tiltAngle} 
                            showForces={showForces} 
                          />
                        </Canvas>
                      ) : (
                        renderMechanism()
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-sm">{type.description}</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>Complexity: <span className="font-semibold">{type.complexity}</span></div>
                      <div>Cost Factor: <span className="font-semibold">{type.cost}</span></div>
                    </div>
                  </div>
                </div>

                {/* Telemetry Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Real-Time Telemetry</h3>
                  <div className="h-64">
                    <LineChart
                      width={600}
                      height={240}
                      data={telemetryData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} 
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <RechartsLine 
                        type="monotone" 
                        dataKey="panAngle" 
                        stroke="#8884d8" 
                        strokeWidth={2} 
                        name="Pan Angle"
                      />
                      <RechartsLine 
                        type="monotone" 
                        dataKey="tiltAngle" 
                        stroke="#82ca9d" 
                        strokeWidth={2} 
                        name="Tilt Angle"
                      />
                      <RechartsLine 
                        type="monotone" 
                        dataKey="servoAngle" 
                        stroke="#ffc658" 
                        strokeWidth={2} 
                        name="Servo Angle"
                      />
                    </LineChart>
                  </div>
                </div>
              </div>

              {/* Control Panel Column */}
              <div className="space-y-6">
                {mode === 'live' && <ConnectionStatus />}
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4 text-slate-800">
                    Control Parameters
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Servo Angle: {servoAngle}°
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="180"
                        value={isPlaying ? simulationAngle : servoAngle}
                        onChange={(e) => setServoAngle(Number(e.target.value))}
                        disabled={isPlaying}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={mode === 'live'}
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          mode === 'live'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isPlaying 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {isPlaying ? 'Stop Simulation' : 'Start Simulation'}
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-slate-700">Speed:</label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={speed}
                          onChange={(e) => setSpeed(Number(e.target.value))}
                          className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-slate-600">{speed.toFixed(1)}x</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showForces}
                          onChange={(e) => setShowForces(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">Display Force Vectors</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="font-semibold text-slate-700 mb-2">Pan Angle</h3>
                        <div className="text-2xl font-bold text-blue-600">{panAngle.toFixed(1)}°</div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="font-semibold text-slate-700 mb-2">Tilt Angle</h3>
                        <div className="text-2xl font-bold text-green-600">{tiltAngle.toFixed(1)}°</div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="font-semibold text-amber-800 mb-2">Performance Metrics</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-amber-700">
                        <div>Torque: {(10 * 0.05).toFixed(2)} Nm</div>
                        <div>Angular Velocity: {(Math.abs(servoAngle - 90) / 1).toFixed(2)} rad/s</div>
                        <div>Mechanical Advantage: {mechanismTypes[activeTab].complexity === 'High' ? '1.6' : '1.0'}</div>
                        <div>Efficiency: {activeTab === 2 ? '85' : '92'}%</div>
                      </div>
                    </div>

                    {dataLog.length > 0 && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h3 className="font-semibold text-emerald-800 mb-2">Data Recording</h3>
                        <p className="text-sm text-emerald-700">
                          Recording {dataLog.length} data points. Click "Export Data" to save.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Log Viewer */}
                {mode === 'live' && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">System Log</h3>
                    <div className="h-48 overflow-y-auto font-mono text-sm bg-gray-50 p-4 rounded">
                      {logMessages.map((log, index) => (
                        <div 
                          key={index} 
                          className={`mb-1 ${
                            log.type === 'error' ? 'text-red-600' : 
                            log.type === 'warning' ? 'text-yellow-600' : 
                            log.type === 'success' ? 'text-green-600' : 
                            'text-gray-800'
                          }`}
                        >
                          [{log.timestamp}] {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabPanel>
        ))}
      </TabContainer>

      {/* Firmware Example */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">MicroPython Implementation</h2>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`# Freenove 4WD Car - Single Servo Pan-Tilt Controller
# File: pantilt_controller.py

import machine
import json
import utime
import math
import network
import socket

class PanTiltController:
    def __init__(self, servo_pin=13):
        self.servo = machine.PWM(machine.Pin(servo_pin))
        self.servo.freq(50)
        self.current_angle = 90
        self.mechanism = 'cam'
        
    def set_mechanism(self, mechanism_type):
        """Set the mechanism type: cam, differential, sequential, helical"""
        self.mechanism = mechanism_type
        
    def set_angle(self, angle):
        """Set servo angle between 0-180 degrees"""
        angle = max(0, min(180, angle))
        duty = int((angle / 180) * 6000 + 2000)
        self.servo.duty_u16(duty)
        self.current_angle = angle
        
    def calculate_pan_tilt(self, angle):
        """Calculate pan and tilt angles based on mechanism type"""
        if self.mechanism == 'cam':
            cam_profile = math.sin(angle * math.pi / 180) * 0.8 + \\
                         math.cos(angle * math.pi / 90) * 0.2
            pan = cam_profile * 35
            tilt = math.cos(angle * math.pi / 180) * 25
            
        elif self.mechanism == 'differential':
            torque_ratio = 0.6
            pan = (angle - 90) * 0.7
            tilt = (angle - 90) * 0.4 * torque_ratio
            
        elif self.mechanism == 'sequential':
            transition_point = 90
            if angle < transition_point:
                pan = (angle / transition_point) * 45 - 22.5
                tilt = 0
            else:
                pan = 22.5
                tilt = ((angle - transition_point) / \\
                       (180 - transition_point)) * 30 - 15
                
        elif self.mechanism == 'helical':
            helix_pitch = 2.0
            pan = math.sin(angle * math.pi / 180 * helix_pitch) * 40
            tilt = math.cos(angle * math.pi / 90) * 30
            
        return pan, tilt
    
    def update_position(self, angle, mechanism=None):
        """Update servo position and return calculated pan/tilt angles"""
        if mechanism:
            self.set_mechanism(mechanism)
        
        self.set_angle(angle)
        pan, tilt = self.calculate_pan_tilt(angle)
        
        return {
            'servoAngle': angle,
            'panAngle': pan,
            'tiltAngle': tilt,
            'mechanism': self.mechanism,
            'timestamp': utime.ticks_ms()
        }

# WebSocket server implementation
class WebSocketServer:
    def __init__(self, controller):
        self.controller = controller
        self.clients = []
        
    def start(self, port=8080):
        addr = socket.getaddrinfo('0.0.0.0', port)[0][-1]
        self.socket = socket.socket()
        self.socket.bind(addr)
        self.socket.listen(1)
        print(f'WebSocket server listening on port {port}')
        
        while True:
            client, addr = self.socket.accept()
            print(f'Client connected from {addr}')
            self.handle_client(client)
    
    def handle_client(self, client):
        try:
            while True:
                data = client.recv(1024)
                if not data:
                    break
                    
                message = json.loads(data.decode())
                response = self.process_command(message)
                client.send(json.dumps(response).encode())
                
        except Exception as e:
            print(f'Client error: {e}')
        finally:
            client.close()
    
    def process_command(self, message):
        try:
            payload = message.get('payload', {})
            action = payload.get('action')
            
            if action == 'servo_control':
                angle = payload.get('angle', 90)
                mechanism = payload.get('mechanism')
                result = self.controller.update_position(angle, mechanism)
                return {'type': 'telemetry', 'payload': result}
                
            elif action == 'set_mechanism':
                mechanism = payload.get('mechanism')
                self.controller.set_mechanism(mechanism)
                return {'type': 'command_ack', 'payload': {'command': action}}
                
            elif action == 'emergency_stop':
                self.controller.set_angle(90)
                return {'type': 'command_ack', 'payload': {'command': action}}
                
            else:
                return {'type': 'error', 'payload': {'message': 'Unknown action'}}
                
        except Exception as e:
            return {'type': 'error', 'payload': {'message': str(e)}}

# Initialize system
controller = PanTiltController()
server = WebSocketServer(controller)

# Start server
server.start()
`}</pre>
      </div>
    </div>
  );
};

// Three.js 3D Components and SVG mechanism visualizations would be included here...
// (The complete code for these is the same as in the previous messages)

export default UnifiedDashboard;