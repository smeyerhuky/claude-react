import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Activity, 
  Wifi, 
  ZapOff, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  Zap, 
  Database,
  ThermometerSun,
  Signal,
  Settings,
  X
} from 'lucide-react';

// Node types
const NODE_TYPES = {
  SENSOR: 'sensor',
  RELAY: 'relay',
  BRIDGE: 'bridge'
};

// Initial mesh configuration
const initialNodes = [
  { id: 1, type: NODE_TYPES.SENSOR, x: 150, y: 150, battery: 100, active: true, sensorData: { temp: 25.3, light: 512 } },
  { id: 2, type: NODE_TYPES.SENSOR, x: 450, y: 120, battery: 100, active: true, sensorData: { temp: 26.1, light: 490 } },
  { id: 3, type: NODE_TYPES.RELAY, x: 300, y: 300, battery: 100, active: true, sensorData: { temp: 24.8, light: 520 } },
  { id: 4, type: NODE_TYPES.SENSOR, x: 500, y: 350, battery: 100, active: true, sensorData: { temp: 25.7, light: 475 } },
  { id: 5, type: NODE_TYPES.BRIDGE, x: 150, y: 450, battery: 100, active: true, sensorData: { temp: 24.2, light: 530 } }
];

// Node colors by type
const nodeColors = {
  [NODE_TYPES.SENSOR]: '#3B82F6', // Blue
  [NODE_TYPES.RELAY]: '#10B981',  // Green
  [NODE_TYPES.BRIDGE]: '#F59E0B'  // Orange
};

// SVG-based mesh network simulator
const SVGMeshNetworkSimulator = () => {
  // State
  const [nodes, setNodes] = useState(initialNodes);
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [showPackets, setShowPackets] = useState(true);
  const [showAllRanges, setShowAllRanges] = useState(false);
  const [transmissionRange, setTransmissionRange] = useState(150);
  const [simulationTime, setSimulationTime] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [nodeDragging, setNodeDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  
  // Ref for animation frame
  const animationFrameRef = useRef(null);
  const svgRef = useRef(null);
  
  // Calculate connections between nodes based on range
  const calculateConnections = () => {
    const newConnections = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        if (!node1.active || !node2.active) continue;
        
        const distance = Math.sqrt(
          Math.pow(node1.x - node2.x, 2) + 
          Math.pow(node1.y - node2.y, 2)
        );
        
        if (distance <= transmissionRange) {
          newConnections.push({
            id: `${node1.id}-${node2.id}`,
            from: node1.id,
            to: node2.id,
            strength: 1 - (distance / transmissionRange)
          });
        }
      }
    }
    
    setConnections(newConnections);
  };
  
  // Initialize network
  useEffect(() => {
    calculateConnections();
    startSimulation();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [transmissionRange]);
  
  // Effect to handle simulation pause/resume
  useEffect(() => {
    if (!isSimulationRunning && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    } else if (isSimulationRunning && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isSimulationRunning]);
  
  // Generate a new message
  const generateMessage = () => {
    if (!isSimulationRunning) return;
    
    const activeNodes = nodes.filter(node => node.active);
    if (activeNodes.length < 2) return;
    
    // Find random source and destination
    const sourceIndex = Math.floor(Math.random() * activeNodes.length);
    let destIndex;
    do {
      destIndex = Math.floor(Math.random() * activeNodes.length);
    } while (destIndex === sourceIndex);
    
    const source = activeNodes[sourceIndex];
    const destination = activeNodes[destIndex];
    
    // Create message
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sourceId: source.id,
      destinationId: destination.id,
      content: "sensor_data",
      currentNodeId: source.id,
      pathTaken: [source.id],
      x: source.x,
      y: source.y,
      progress: 0,
      nextNodeId: null,
      delivered: false,
      createdAt: simulationTime
    };
    
    // Find next hop using a simple routing algorithm
    newMessage.nextNodeId = findNextHop(newMessage);
    
    setMessages(prev => [...prev, newMessage]);
    setMessageCount(prev => prev + 1);
  };
  
  // Find next hop for a message using a simple routing algorithm
  const findNextHop = (message) => {
    const { currentNodeId, destinationId, pathTaken } = message;
    
    // Check if directly connected to destination
    const directConnection = connections.find(
      conn => 
        (conn.from === currentNodeId && conn.to === destinationId) ||
        (conn.to === currentNodeId && conn.from === destinationId)
    );
    
    if (directConnection) {
      return destinationId;
    }
    
    // Find all neighbors of current node
    const neighbors = connections
      .filter(conn => 
        (conn.from === currentNodeId || conn.to === currentNodeId) &&
        !pathTaken.includes(conn.from === currentNodeId ? conn.to : conn.from)
      )
      .map(conn => conn.from === currentNodeId ? conn.to : conn.from);
    
    if (neighbors.length === 0) {
      // No available paths - message will be dropped
      return null;
    }
    
    // Find destination node
    const destination = nodes.find(node => node.id === destinationId);
    if (!destination) return null;
    
    // Select neighbor closest to destination as next hop
    let bestNeighbor = null;
    let shortestDistance = Infinity;
    
    for (const neighborId of neighbors) {
      const neighbor = nodes.find(node => node.id === neighborId);
      if (!neighbor || !neighbor.active) continue;
      
      const distance = Math.sqrt(
        Math.pow(neighbor.x - destination.x, 2) + 
        Math.pow(neighbor.y - destination.y, 2)
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestNeighbor = neighborId;
      }
    }
    
    return bestNeighbor;
  };
  
  // Update message positions
  const updateMessages = () => {
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.delivered) return msg;
        
        // If no next node, message is lost
        if (!msg.nextNodeId) {
          return { ...msg, delivered: true };
        }
        
        // Find current and next nodes
        const currentNode = nodes.find(node => node.id === msg.currentNodeId);
        const nextNode = nodes.find(node => node.id === msg.nextNodeId);
        
        if (!currentNode || !nextNode || !nextNode.active) {
          // Recalculate route if next node is gone
          const newNextNodeId = findNextHop(msg);
          return { 
            ...msg, 
            nextNodeId: newNextNodeId,
            progress: 0
          };
        }
        
        // Update progress
        const newProgress = msg.progress + (0.02 * simulationSpeed);
        
        if (newProgress >= 1) {
          // Reached next node
          const newPathTaken = [...msg.pathTaken, msg.nextNodeId];
          
          // Check if destination reached
          if (msg.nextNodeId === msg.destinationId) {
            return {
              ...msg,
              currentNodeId: msg.nextNodeId,
              x: nextNode.x,
              y: nextNode.y,
              pathTaken: newPathTaken,
              delivered: true,
              progress: 1
            };
          } else {
            // Move to next node and calculate new next hop
            const newMsg = {
              ...msg,
              currentNodeId: msg.nextNodeId,
              x: nextNode.x,
              y: nextNode.y,
              pathTaken: newPathTaken,
              progress: 0
            };
            
            newMsg.nextNodeId = findNextHop(newMsg);
            return newMsg;
          }
        } else {
          // In transit between nodes
          const ratio = newProgress;
          return {
            ...msg,
            x: currentNode.x + (nextNode.x - currentNode.x) * ratio,
            y: currentNode.y + (nextNode.y - currentNode.y) * ratio,
            progress: newProgress
          };
        }
      }).filter(msg => {
        // Keep messages that are not too old (10 time units)
        return !msg.delivered || simulationTime - msg.createdAt < 10;
      });
    });
  };
  
  // Update sensor data
  const updateSensorData = () => {
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (!node.active || node.type !== NODE_TYPES.SENSOR) return node;
        
        // Update temperature with small random changes
        const tempChange = (Math.random() - 0.5) * 0.2;
        const newTemp = parseFloat((node.sensorData.temp + tempChange).toFixed(1));
        
        // Update light level with small random changes
        const lightChange = Math.floor((Math.random() - 0.5) * 10);
        const newLight = Math.max(0, Math.min(1023, node.sensorData.light + lightChange));
        
        // Update battery level (very slow drain)
        const newBattery = Math.max(0, node.battery - 0.01 * simulationSpeed);
        
        return {
          ...node,
          sensorData: {
            ...node.sensorData,
            temp: newTemp,
            light: newLight
          },
          battery: newBattery
        };
      });
    });
  };
  
  // Main animation loop
  const animate = () => {
    if (isSimulationRunning) {
      // Update simulation time
      setSimulationTime(prevTime => prevTime + 0.1 * simulationSpeed);
      
      // Generate messages occasionally
      if (Math.random() < 0.03 * simulationSpeed) {
        generateMessage();
      }
      
      // Update message positions
      updateMessages();
      
      // Update sensor data occasionally
      if (Math.random() < 0.05 * simulationSpeed) {
        updateSensorData();
      }
      
      // Check for battery depletion
      checkBatteries();
      
      // Recalculate connections occasionally
      if (Math.random() < 0.01) {
        calculateConnections();
      }
    }
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  };
  
  // Check for battery depletion
  const checkBatteries = () => {
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (!node.active) return node;
        
        // If battery depleted, deactivate node
        if (node.battery <= 0) {
          return { ...node, active: false };
        }
        
        return node;
      });
    });
  };
  
  // Start simulation
  const startSimulation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    animationFrameRef.current = requestAnimationFrame(animate);
    setIsSimulationRunning(true);
  };
  
  // Toggle simulation
  const toggleSimulation = () => {
    setIsSimulationRunning(prev => !prev);
    // If restarting the simulation, make sure animation loop is running
    if (!isSimulationRunning && animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };
  
  // Toggle node active state
  const toggleNodeActive = (nodeId) => {
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, active: !node.active };
        }
        return node;
      });
    });
    calculateConnections();
  };
  
  // Add a new node
  const addNode = (type) => {
    // Find a random position not too close to existing nodes
    let x, y, tooClose;
    do {
      x = 100 + Math.random() * 600;
      y = 100 + Math.random() * 400;
      tooClose = nodes.some(node => {
        const distance = Math.sqrt(
          Math.pow(node.x - x, 2) + 
          Math.pow(node.y - y, 2)
        );
        return distance < 50;
      });
    } while (tooClose);
    
    // Create new node
    const newNode = {
      id: Math.max(...nodes.map(n => n.id)) + 1,
      type,
      x,
      y,
      battery: 100,
      active: true,
      sensorData: { temp: 25 + (Math.random() - 0.5) * 2, light: 500 + (Math.random() - 0.5) * 50 }
    };
    
    setNodes(prev => [...prev, newNode]);
    calculateConnections();
  };
  
  // Remove selected node
  const removeNode = () => {
    if (!selectedNode) return;
    
    setNodes(prevNodes => prevNodes.filter(node => node.id !== selectedNode));
    setSelectedNode(null);
    calculateConnections();
  };
  
  // Reset all nodes
  const resetSimulation = () => {
    setNodes(initialNodes);
    setMessages([]);
    setSimulationTime(0);
    setMessageCount(0);
    calculateConnections();
  };
  
  // Recharge batteries
  const rechargeBatteries = () => {
    setNodes(prevNodes => {
      return prevNodes.map(node => ({
        ...node,
        battery: 100,
        active: true
      }));
    });
    calculateConnections();
  };
  
  // Handle node mouse down for dragging
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    
    setSelectedNode(nodeId);
    setNodeDragging(nodeId);
    
    // Calculate offset
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const offsetX = node.x - (e.clientX - svgRect.left);
      const offsetY = node.y - (e.clientY - svgRect.top);
      setDragOffset({ x: offsetX, y: offsetY });
    }
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!nodeDragging) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    // Update node position
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.id === nodeDragging) {
          return { 
            ...node, 
            x: mouseX + dragOffset.x,
            y: mouseY + dragOffset.y
          };
        }
        return node;
      });
    });
    
    // Recalculate connections
    calculateConnections();
  };
  
  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setNodeDragging(null);
  };
  
  // Calculate network health
  const calculateNetworkHealth = () => {
    const activeNodeCount = nodes.filter(n => n.active).length;
    
    if (activeNodeCount <= 1) return 0;
    
    // Maximum possible connections between n nodes: n(n-1)/2
    const maxConnections = activeNodeCount * (activeNodeCount - 1) / 2;
    
    // Calculate percentage of actual connections
    return Math.min(100, Math.round((connections.length / maxConnections) * 100));
  };
  
  // Get battery color class based on level
  const getBatteryColorClass = (level) => {
    if (level > 60) return 'fill-green-500';
    if (level > 30) return 'fill-yellow-500';
    return 'fill-red-500';
  };
  
  // Render node icon based on type
  const renderNodeIcon = (type, x, y) => {
    const iconSize = 10;
    const yOffset = 20;
    
    switch (type) {
      case NODE_TYPES.SENSOR:
        return <ThermometerSun className="text-blue-800" size={iconSize} x={x - iconSize/2} y={y + yOffset} />;
      case NODE_TYPES.RELAY:
        return <Signal className="text-green-800" size={iconSize} x={x - iconSize/2} y={y + yOffset} />;
      case NODE_TYPES.BRIDGE:
        return <Database className="text-yellow-800" size={iconSize} x={x - iconSize/2} y={y + yOffset} />;
      default:
        return null;
    }
  };

  // Toggle control panel
  const toggleControlPanel = () => {
    setIsControlPanelOpen(prev => !prev);
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">ESP32S3 Mesh Network SVG Simulator</h2>
      
      <div className="mb-4 bg-blue-50 p-4 rounded-lg">
        <p className="text-sm">
          This simulator demonstrates how ESP32S3 devices can form a self-organizing mesh network. 
          The nodes communicate using ESP-NOW protocol with TinyGo application logic. Click on nodes to
          select them, adjust settings, and observe how messages are routed through the network.
        </p>
      </div>
      
      {/* Main simulation area with gear icon */}
      <div className="relative">
        {/* SVG for visualization */}
        <div className="w-full h-[600px] border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
          <svg 
            ref={svgRef}
            width="100%" 
            height="100%" 
            viewBox="0 0 800 600"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Transmission range circles */}
            {nodes.map(node => {
              // Show range for selected node or all nodes if showAllRanges is true
              if ((selectedNode === node.id || showAllRanges) && node.active) {
                return (
                  <circle
                    key={`range-${node.id}`}
                    cx={node.x}
                    cy={node.y}
                    r={transmissionRange}
                    className={`fill-blue-100 opacity-20 stroke-blue-300 stroke-1 ${node.id === selectedNode ? 'stroke-2' : 'stroke-1'}`}
                  />
                );
              }
              return null;
            })}
            
            {/* Connections between nodes */}
            {connections.map(conn => {
              const sourceNode = nodes.find(n => n.id === conn.from);
              const targetNode = nodes.find(n => n.id === conn.to);
              if (!sourceNode || !targetNode) return null;
              
              return (
                <line
                  key={conn.id}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  className="stroke-gray-400"
                  strokeWidth={1}
                  strokeOpacity={conn.strength}
                />
              );
            })}
            
            {/* Messages/Data packets */}
            {showPackets && messages.map(msg => {
              if (msg.delivered) return null;
              
              return (
                <g key={msg.id} className="message-packet">
                  <circle
                    cx={msg.x}
                    cy={msg.y}
                    r={5}
                    className="fill-red-500 stroke-red-600 stroke-1"
                  >
                    <animate
                      attributeName="r"
                      values="4;6;4"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
            
            {/* Nodes */}
            {nodes.map(node => {
              const nodeColor = nodeColors[node.type] || '#777777';
              const isActive = node.active;
              const isSelected = node.id === selectedNode;
              
              return (
                <g 
                  key={node.id} 
                  className={`node cursor-pointer transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* Battery indicator */}
                  <rect
                    x={node.x - 15}
                    y={node.y - 25}
                    width={30 * (node.battery / 100)}
                    height={5}
                    className={getBatteryColorClass(node.battery)}
                    rx={1}
                  />
                  <rect
                    x={node.x - 15}
                    y={node.y - 25}
                    width={30}
                    height={5}
                    fill="none"
                    stroke="#000"
                    strokeWidth={0.5}
                    rx={1}
                  />
                  
                  {/* Node circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={15}
                    fill={nodeColor}
                    opacity={isActive ? 0.8 : 0.3}
                    stroke={isSelected ? '#000000' : '#666666'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-300"
                  >
                    {isActive && (
                      <animate
                        attributeName="opacity"
                        values="0.7;0.9;0.7"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                  
                  {/* Node ID */}
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#000000"
                    className="select-none pointer-events-none"
                  >
                    {node.id}
                  </text>
                  
                  {/* Node type label */}
                  <text
                    x={node.x}
                    y={node.y + 30}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#000000"
                    className="select-none pointer-events-none uppercase font-semibold"
                  >
                    {node.type}
                  </text>
                  
                  {/* Node icon */}
                  {renderNodeIcon(node.type, node.x, node.y)}
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Network Statistics (always visible at bottom) */}
        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">Active Nodes</div>
              <div className="text-xl font-semibold">
                {nodes.filter(n => n.active).length} / {nodes.length}
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-800">Active Connections</div>
              <div className="text-xl font-semibold">
                {connections.length}
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-800">Messages In Transit</div>
              <div className="text-xl font-semibold">
                {messages.filter(m => !m.delivered).length}
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-800">Network Resilience</div>
              <div className="text-xl font-semibold">
                {calculateNetworkHealth()}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 bg-gray-50 p-3 rounded-lg flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Sensor Node</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Relay Node</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Bridge Node</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Data Packet</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-1 bg-gray-400"></div>
            <span>Wireless Connection</span>
          </div>
        </div>
        
        {/* Gear icon for settings */}
        <button 
          onClick={toggleControlPanel}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all z-10"
          aria-label="Toggle settings panel"
        >
          <Settings size={24} className="text-gray-700" />
        </button>
      </div>
      
      {/* Slide-out control panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${isControlPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Simulation Controls</h3>
          <button 
            onClick={toggleControlPanel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close settings panel"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto h-full pb-32">
          {/* Simulation Controls */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Activity size={18} /> Simulation
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={toggleSimulation}
                className={`w-full py-2 px-4 rounded-md transition-colors ${
                  isSimulationRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSimulationRunning ? 'Pause' : 'Start'} Simulation
              </button>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Simulation Speed: {simulationSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="showPackets"
                  checked={showPackets}
                  onChange={() => setShowPackets(!showPackets)}
                  className="mr-2"
                />
                <label htmlFor="showPackets" className="text-sm">
                  Show Data Packets
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showAllRanges"
                  checked={showAllRanges}
                  onChange={() => setShowAllRanges(!showAllRanges)}
                  className="mr-2"
                />
                <label htmlFor="showAllRanges" className="text-sm">
                  Show All Transmission Ranges
                </label>
              </div>
              
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Simulation Time:</span>
                  <span>{simulationTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages Sent:</span>
                  <span>{messageCount}</span>
                </div>
              </div>
              
              <button
                onClick={resetSimulation}
                className="w-full py-2 px-4 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center gap-1 transition-colors"
              >
                <RefreshCw size={16} /> Reset Simulation
              </button>
              
              <button
                onClick={rechargeBatteries}
                className="w-full py-2 px-4 rounded-md bg-yellow-400 hover:bg-yellow-500 text-yellow-900 flex items-center justify-center gap-1 transition-colors"
              >
                <Zap size={16} /> Recharge All Batteries
              </button>
            </div>
          </div>
          
          {/* Network Controls */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Wifi size={18} /> Network
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission Range: {transmissionRange}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={transmissionRange}
                  onChange={(e) => setTransmissionRange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addNode(NODE_TYPES.SENSOR)}
                  className="py-1 px-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs flex flex-col items-center gap-1 transition-colors"
                >
                  <PlusCircle size={16} />
                  Sensor
                </button>
                
                <button
                  onClick={() => addNode(NODE_TYPES.RELAY)}
                  className="py-1 px-2 rounded-md bg-green-100 hover:bg-green-200 text-green-800 text-xs flex flex-col items-center gap-1 transition-colors"
                >
                  <PlusCircle size={16} />
                  Relay
                </button>
                
                <button
                  onClick={() => addNode(NODE_TYPES.BRIDGE)}
                  className="py-1 px-2 rounded-md bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs flex flex-col items-center gap-1 transition-colors"
                >
                  <PlusCircle size={16} />
                  Bridge
                </button>
              </div>
              
              <button
                onClick={removeNode}
                disabled={!selectedNode}
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-1 transition-colors ${
                  selectedNode
                    ? 'bg-red-100 hover:bg-red-200 text-red-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <MinusCircle size={16} />
                Remove Selected Node
              </button>
              
              <div className="flex items-center justify-center">
                <span className="text-xs text-gray-500">
                  Click and drag nodes to reposition them
                </span>
              </div>
            </div>
          </div>
          
          {/* Selected Node Info */}
          {selectedNode && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Cpu size={18} /> Node {selectedNode} Details
              </h3>
              
              {(() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;
                
                return (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">{node.type}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${node.active ? 'text-green-600' : 'text-red-600'}`}>
                          {node.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Battery:</span>
                        <span className="font-medium">{node.battery.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Position:</span>
                        <span>({Math.round(node.x)}, {Math.round(node.y)})</span>
                      </div>
                      
                      {node.type === NODE_TYPES.SENSOR && (
                        <>
                          <div className="flex justify-between">
                            <span>Temperature:</span>
                            <span>{node.sensorData.temp.toFixed(1)}°C</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Light Level:</span>
                            <span>{node.sensorData.light}</span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Connections:</span>
                        <span>{
                          connections.filter(conn => 
                            conn.from === node.id || conn.to === node.id
                          ).length
                        }</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleNodeActive(node.id)}
                      className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-1 transition-colors ${
                        node.active
                          ? 'bg-red-100 hover:bg-red-200 text-red-800'
                          : 'bg-green-100 hover:bg-green-200 text-green-800'
                      }`}
                    >
                      {node.active ? (
                        <>
                          <ZapOff size={16} />
                          Deactivate Node
                        </>
                      ) : (
                        <>
                          <Zap size={16} />
                          Activate Node
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SVGMeshNetworkSimulator;