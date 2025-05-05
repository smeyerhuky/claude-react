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

// Node types and roles
const NODE_TYPES = {
  SENSOR: 'sensor',
  RELAY: 'relay',
  BRIDGE: 'bridge',
  HYBRID: 'hybrid'  // Node that can change roles dynamically
};

// ESP32 processor cores
const CORES = {
  APP: 'app',    // Application core (Core 0)
  PRO: 'pro'     // Protocol core (Core 1)
};

// ESP32 power modes
const POWER_MODES = {
  ACTIVE: 'active',        // Both cores active, full power
  LIGHT_SLEEP: 'light',    // CPU suspended, peripherals active
  DEEP_SLEEP: 'deep',      // Only ULP coprocessor active, RTC memory retained
  MODEM_SLEEP: 'modem'     // WiFi/BT radio off, CPU active
};

// Initial mesh configuration
const initialNodes = [
  { 
    id: 1, 
    type: NODE_TYPES.HYBRID, 
    x: 150, 
    y: 150, 
    battery: 100, 
    active: true, 
    cores: {
      [CORES.APP]: { utilization: 10, task: 'sensor_reading' },
      [CORES.PRO]: { utilization: 5, task: 'esp_now_listen' }
    },
    currentRole: NODE_TYPES.SENSOR,
    powerMode: POWER_MODES.ACTIVE,
    powerConsumption: 160, // mA
    sensorData: { temp: 25.3, light: 512, humidity: 45 },
    espNowBuffer: [],
    espNowStats: { sent: 0, received: 0, failed: 0 },
    sleepSchedule: { interval: 10, duration: 2 }, // Wake every 10s, sleep for 2s
    lastWake: 0,
    memory: { total: 8192, used: 1024, free: 7168 } // Memory in KB
  },
  { 
    id: 2, 
    type: NODE_TYPES.HYBRID, 
    x: 450, 
    y: 120, 
    battery: 100, 
    active: true, 
    cores: {
      [CORES.APP]: { utilization: 15, task: 'sensor_reading' },
      [CORES.PRO]: { utilization: 20, task: 'esp_now_relay' }
    },
    currentRole: NODE_TYPES.SENSOR,
    powerMode: POWER_MODES.ACTIVE,
    powerConsumption: 180, // mA
    sensorData: { temp: 26.1, light: 490, humidity: 42 },
    espNowBuffer: [],
    espNowStats: { sent: 0, received: 0, failed: 0 },
    sleepSchedule: { interval: 10, duration: 2 },
    lastWake: 0,
    memory: { total: 8192, used: 1280, free: 6912 }
  },
  { 
    id: 3, 
    type: NODE_TYPES.HYBRID, 
    x: 300, 
    y: 300, 
    battery: 100, 
    active: true, 
    cores: {
      [CORES.APP]: { utilization: 5, task: 'network_management' },
      [CORES.PRO]: { utilization: 70, task: 'esp_now_routing' }
    },
    currentRole: NODE_TYPES.RELAY,
    powerMode: POWER_MODES.ACTIVE,
    powerConsumption: 220, // mA
    sensorData: { temp: 24.8, light: 520, humidity: 48 },
    espNowBuffer: [],
    espNowStats: { sent: 0, received: 0, failed: 0 },
    sleepSchedule: { interval: 0, duration: 0 }, // Always awake as relay
    lastWake: 0,
    memory: { total: 8192, used: 2048, free: 6144 }
  },
  { 
    id: 4, 
    type: NODE_TYPES.HYBRID, 
    x: 500, 
    y: 350, 
    battery: 100, 
    active: true, 
    cores: {
      [CORES.APP]: { utilization: 20, task: 'sensor_reading' },
      [CORES.PRO]: { utilization: 10, task: 'esp_now_listen' }
    },
    currentRole: NODE_TYPES.SENSOR,
    powerMode: POWER_MODES.ACTIVE,
    powerConsumption: 170, // mA
    sensorData: { temp: 25.7, light: 475, humidity: 40 },
    espNowBuffer: [],
    espNowStats: { sent: 0, received: 0, failed: 0 },
    sleepSchedule: { interval: 8, duration: 4 },
    lastWake: 0,
    memory: { total: 8192, used: 1536, free: 6656 }
  },
  { 
    id: 5, 
    type: NODE_TYPES.HYBRID, 
    x: 150, 
    y: 450, 
    battery: 100, 
    active: true, 
    cores: {
      [CORES.APP]: { utilization: 30, task: 'bridge_processing' },
      [CORES.PRO]: { utilization: 60, task: 'wifi_bridge' }
    },
    currentRole: NODE_TYPES.BRIDGE,
    powerMode: POWER_MODES.ACTIVE,
    powerConsumption: 260, // mA
    sensorData: { temp: 24.2, light: 530, humidity: 47 },
    espNowBuffer: [],
    espNowStats: { sent: 0, received: 0, failed: 0 },
    sleepSchedule: { interval: 0, duration: 0 }, // Always awake as bridge
    lastWake: 0,
    memory: { total: 8192, used: 2560, free: 5632 }
  }
];

// Node colors by type
const nodeColors = {
  [NODE_TYPES.SENSOR]: '#3B82F6', // Blue
  [NODE_TYPES.RELAY]: '#10B981',  // Green
  [NODE_TYPES.BRIDGE]: '#F59E0B',  // Orange
  [NODE_TYPES.HYBRID]: '#8B5CF6'   // Purple
};

// Get node color based on role
const getNodeColorByRole = (role) => {
  switch (role) {
    case NODE_TYPES.SENSOR: return nodeColors[NODE_TYPES.SENSOR];
    case NODE_TYPES.RELAY: return nodeColors[NODE_TYPES.RELAY];
    case NODE_TYPES.BRIDGE: return nodeColors[NODE_TYPES.BRIDGE];
    case NODE_TYPES.HYBRID: return nodeColors[NODE_TYPES.HYBRID];
    default: return '#6B7280'; // Gray
  }
};

// Power consumption map (mA)
const POWER_CONSUMPTION = {
  [POWER_MODES.ACTIVE]: {
    [NODE_TYPES.SENSOR]: 140,
    [NODE_TYPES.RELAY]: 220,
    [NODE_TYPES.BRIDGE]: 260,
    [NODE_TYPES.HYBRID]: 180
  },
  [POWER_MODES.LIGHT_SLEEP]: {
    [NODE_TYPES.SENSOR]: 20,
    [NODE_TYPES.RELAY]: 50,
    [NODE_TYPES.BRIDGE]: 80,
    [NODE_TYPES.HYBRID]: 40
  },
  [POWER_MODES.DEEP_SLEEP]: {
    [NODE_TYPES.SENSOR]: 5,
    [NODE_TYPES.RELAY]: 5,
    [NODE_TYPES.BRIDGE]: 5,
    [NODE_TYPES.HYBRID]: 5
  },
  [POWER_MODES.MODEM_SLEEP]: {
    [NODE_TYPES.SENSOR]: 40,
    [NODE_TYPES.RELAY]: 80,
    [NODE_TYPES.BRIDGE]: 100,
    [NODE_TYPES.HYBRID]: 60
  }
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
  const [showIntro, setShowIntro] = useState(false);
  const [showNodeDetails, setShowNodeDetails] = useState(true);
  
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
            
            // Update ESP-NOW stats for the node that received the message
            setNodes(prevNodes => {
              return prevNodes.map(node => {
                if (node.id === msg.nextNodeId) {
                  return {
                    ...node,
                    espNowStats: {
                      ...node.espNowStats,
                      received: (node.espNowStats?.received || 0) + 1
                    }
                  };
                }
                return node;
              });
            });
            
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
        if (!node.active) return node;
        
        // Only update if the node is a sensor or in sensor role
        if (node.type === NODE_TYPES.SENSOR || node.currentRole === NODE_TYPES.SENSOR || node.type === NODE_TYPES.HYBRID) {
          
          // If node should be sleeping, don't update sensor readings
          if (node.powerMode === POWER_MODES.DEEP_SLEEP) {
            return node;
          }
          
          // Update temperature with small random changes
          const tempChange = (Math.random() - 0.5) * 0.2;
          const newTemp = parseFloat((node.sensorData.temp + tempChange).toFixed(1));
          
          // Update light level with small random changes
          const lightChange = Math.floor((Math.random() - 0.5) * 10);
          const newLight = Math.max(0, Math.min(1023, node.sensorData.light + lightChange));
          
          // Update humidity with small random changes
          const humidityChange = (Math.random() - 0.5) * 0.3;
          const newHumidity = Math.max(0, Math.min(100, 
            node.sensorData.humidity ? node.sensorData.humidity + humidityChange : 45 + humidityChange
          ));
          
          // Calculate power consumption based on mode and role
          let newPowerConsumption = node.powerConsumption;
          if (node.powerMode && node.currentRole) {
            newPowerConsumption = POWER_CONSUMPTION[node.powerMode][node.currentRole];
          }
          
          // Battery drain based on power consumption
          // Higher consumption = faster drain, adjust for simulation speed
          const batteryDrain = (newPowerConsumption / 10000) * simulationSpeed;
          const newBattery = Math.max(0, node.battery - batteryDrain);
          
          // Update core utilization
          let appUtilization = node.cores[CORES.APP].utilization;
          let proUtilization = node.cores[CORES.PRO].utilization;
          
          // Randomly fluctuate utilization slightly
          appUtilization += (Math.random() - 0.5) * 2;
          proUtilization += (Math.random() - 0.5) * 2;
          
          // Ensure within bounds
          appUtilization = Math.max(0, Math.min(100, appUtilization));
          proUtilization = Math.max(0, Math.min(100, proUtilization));
          
          // Update memory usage
          const memoryUsed = Math.min(
            node.memory.total,
            node.memory.used + Math.floor((Math.random() - 0.48) * 50)
          );
          
          return {
            ...node,
            sensorData: {
              ...node.sensorData,
              temp: newTemp,
              light: newLight,
              humidity: parseFloat(newHumidity.toFixed(1))
            },
            powerConsumption: newPowerConsumption,
            battery: newBattery,
            cores: {
              ...node.cores,
              [CORES.APP]: {
                ...node.cores[CORES.APP],
                utilization: appUtilization
              },
              [CORES.PRO]: {
                ...node.cores[CORES.PRO],
                utilization: proUtilization
              }
            },
            memory: {
              ...node.memory,
              used: Math.max(0, memoryUsed),
              free: node.memory.total - Math.max(0, memoryUsed)
            }
          };
        }
        
        // For non-sensor nodes, just update battery
        const batteryDrain = node.powerConsumption ? 
          (node.powerConsumption / 10000) * simulationSpeed : 
          0.01 * simulationSpeed;
        
        return {
          ...node,
          battery: Math.max(0, node.battery - batteryDrain)
        };
      });
    });
  };
  
  // Main animation loop
  const animate = () => {
    if (isSimulationRunning) {
      // Update simulation time
      setSimulationTime(prevTime => prevTime + 0.1 * simulationSpeed);
      
      // Update sleep cycles for each node
      updateSleepCycles();
      
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
      
      // Update node roles based on network conditions
      if (Math.random() < 0.02) {
        updateNodeRoles();
      }
    }
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  };
  
  // Update sleep cycles based on schedules
  const updateSleepCycles = () => {
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        // Skip inactive nodes
        if (!node.active) return node;
        
        // Skip nodes without sleep schedule
        if (!node.sleepSchedule || node.sleepSchedule.interval === 0) {
          return {
            ...node,
            powerMode: POWER_MODES.ACTIVE,
            lastWake: simulationTime
          };
        }
        
        const timeSinceLastWake = simulationTime - node.lastWake;
        let newPowerMode = node.powerMode;
        let newLastWake = node.lastWake;
        
        // Time to wake up
        if (node.powerMode !== POWER_MODES.ACTIVE && 
            timeSinceLastWake >= node.sleepSchedule.duration) {
          newPowerMode = POWER_MODES.ACTIVE;
          newLastWake = simulationTime;
        } 
        // Time to sleep
        else if (node.powerMode === POWER_MODES.ACTIVE && 
                 timeSinceLastWake >= node.sleepSchedule.interval) {
          
          // Bridge and relay nodes don't go to deep sleep
          if (node.currentRole === NODE_TYPES.BRIDGE || node.currentRole === NODE_TYPES.RELAY) {
            newPowerMode = POWER_MODES.MODEM_SLEEP;
          } else {
            newPowerMode = POWER_MODES.DEEP_SLEEP;
          }
          newLastWake = simulationTime;
        }
        
        return {
          ...node,
          powerMode: newPowerMode,
          lastWake: newLastWake
        };
      });
    });
  };
  
  // Update node roles based on network conditions, battery life, and position
  const updateNodeRoles = () => {
    // Only analyze hybrid nodes for role changes
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.type !== NODE_TYPES.HYBRID || !node.active) return node;
        
        // Get current node details
        const batteryLevel = node.battery;
        const neighbors = connections.filter(conn => 
          conn.from === node.id || conn.to === node.id
        ).length;
        
        let newRole = node.currentRole;
        let newCores = { ...node.cores };
        let newSleepSchedule = { ...node.sleepSchedule };
        
        // Low battery prioritizes power saving - become a sensor
        if (batteryLevel < 20) {
          newRole = NODE_TYPES.SENSOR;
          newCores = {
            [CORES.APP]: { utilization: 5, task: 'minimal_sensor' },
            [CORES.PRO]: { utilization: 2, task: 'esp_now_minimal' }
          };
          // Aggressive sleep schedule
          newSleepSchedule = { interval: 30, duration: 25 };
        }
        // High connectivity and good battery - become a relay
        else if (neighbors > 3 && batteryLevel > 70) {
          newRole = NODE_TYPES.RELAY;
          newCores = {
            [CORES.APP]: { utilization: 20, task: 'network_management' },
            [CORES.PRO]: { utilization: 60, task: 'esp_now_routing' }
          };
          // Relays need to stay awake
          newSleepSchedule = { interval: 0, duration: 0 };
        }
        // Bridge role - select one node that has good battery and is positioned well
        else if (node.id === 5 && batteryLevel > 50) { // Node 5 is a good candidate
          newRole = NODE_TYPES.BRIDGE;
          newCores = {
            [CORES.APP]: { utilization: 30, task: 'bridge_processing' },
            [CORES.PRO]: { utilization: 70, task: 'wifi_bridge' }
          };
          // Bridges need to stay awake
          newSleepSchedule = { interval: 0, duration: 0 };
        }
        // Default to sensor role
        else if (newRole !== NODE_TYPES.SENSOR) {
          newRole = NODE_TYPES.SENSOR;
          newCores = {
            [CORES.APP]: { utilization: 10, task: 'sensor_reading' },
            [CORES.PRO]: { utilization: 5, task: 'esp_now_listen' }
          };
          // Standard sleep schedule
          newSleepSchedule = { interval: 10, duration: 5 };
        }
        
        // Only update if role has changed
        if (newRole !== node.currentRole) {
          return {
            ...node,
            currentRole: newRole,
            cores: newCores,
            sleepSchedule: newSleepSchedule,
            // Reset ESP-NOW stats when role changes
            espNowStats: { sent: 0, received: 0, failed: 0 }
          };
        }
        
        return node;
      });
    });
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
        if (node.id !== nodeId) return node;
        
        return {
          ...node,
          active: !node.active
        };
      });
    });
    calculateConnections();
  };
  
  // Cycle through node roles for hybrid nodes
  const cycleNodeRole = (nodeId) => {
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.id !== nodeId || node.type !== NODE_TYPES.HYBRID) return node;
        
        // Define role cycle order
        const roleOrder = [
          NODE_TYPES.SENSOR,
          NODE_TYPES.RELAY,
          NODE_TYPES.BRIDGE
        ];
        
        // Find current index and get next role
        const currentIndex = roleOrder.indexOf(node.currentRole);
        const nextIndex = (currentIndex + 1) % roleOrder.length;
        const nextRole = roleOrder[nextIndex];
        
        // Update cores based on new role
        let newCores = { ...node.cores };
        let newSleepSchedule = { ...node.sleepSchedule };
        
        switch (nextRole) {
          case NODE_TYPES.SENSOR:
            newCores = {
              [CORES.APP]: { utilization: 10, task: 'sensor_reading' },
              [CORES.PRO]: { utilization: 5, task: 'esp_now_listen' }
            };
            newSleepSchedule = { interval: 10, duration: 5 };
            break;
          case NODE_TYPES.RELAY:
            newCores = {
              [CORES.APP]: { utilization: 20, task: 'network_management' },
              [CORES.PRO]: { utilization: 60, task: 'esp_now_routing' }
            };
            newSleepSchedule = { interval: 0, duration: 0 };
            break;
          case NODE_TYPES.BRIDGE:
            newCores = {
              [CORES.APP]: { utilization: 30, task: 'bridge_processing' },
              [CORES.PRO]: { utilization: 70, task: 'wifi_bridge' }
            };
            newSleepSchedule = { interval: 0, duration: 0 };
            break;
        }
        
        return {
          ...node,
          currentRole: nextRole,
          cores: newCores,
          sleepSchedule: newSleepSchedule,
          powerMode: POWER_MODES.ACTIVE, // Wake up when changing roles
          lastWake: simulationTime
        };
      });
    });
    
    // Recalculate connections after role change
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
    
    // Create new node with default values based on type
    const newNode = {
      id: Math.max(...nodes.map(n => n.id)) + 1,
      type,
      x,
      y,
      battery: 100,
      active: true,
      cores: {
        [CORES.APP]: { utilization: 10, task: 'startup' },
        [CORES.PRO]: { utilization: 5, task: 'network_init' }
      },
      currentRole: type,
      powerMode: POWER_MODES.ACTIVE,
      powerConsumption: POWER_CONSUMPTION.active[type],
      sensorData: { 
        temp: 25 + (Math.random() - 0.5) * 2, 
        light: 500 + Math.floor((Math.random() - 0.5) * 50),
        humidity: 45 + (Math.random() - 0.5) * 5
      },
      espNowBuffer: [],
      espNowStats: { sent: 0, received: 0, failed: 0 },
      sleepSchedule: { interval: 0, duration: 0 },
      lastWake: simulationTime,
      memory: { total: 8192, used: 1024, free: 7168 }
    };
    
    // Set role-specific properties
    if (type === NODE_TYPES.HYBRID) {
      newNode.currentRole = NODE_TYPES.SENSOR;
    }
    
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
  
  // Render node icon based on role
  const renderNodeIcon = (node) => {
    if (!node) return null;
    
    const { x, y, currentRole, type, powerMode } = node;
    const iconSize = 10;
    const yOffset = 20;
    
    // If node is in deep sleep, show a "sleeping" icon
    if (powerMode === POWER_MODES.DEEP_SLEEP) {
      return (
        <text 
          x={x} 
          y={y + yOffset} 
          textAnchor="middle" 
          fontSize="10" 
          className="text-gray-500"
        >
          💤
        </text>
      );
    }
    
    // For hybrid nodes, show icon based on current role
    const role = type === NODE_TYPES.HYBRID ? currentRole : type;
    
    switch (role) {
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
  
  // Render CPU cores visualization
  const renderCoreUtilization = (node) => {
    if (!node || !node.cores) return null;
    
    const { x, y } = node;
    const appUtilization = node.cores[CORES.APP].utilization;
    const proUtilization = node.cores[CORES.PRO].utilization;
    
    return (
      <>
        {/* APP Core (Core 0) - Red */}
        <rect
          x={x - 15}
          y={y - 35}
          width={30 * (appUtilization / 100)}
          height={3}
          className="fill-red-500"
          rx={1}
        />
        <rect
          x={x - 15}
          y={y - 35}
          width={30}
          height={3}
          fill="none"
          stroke="#000"
          strokeWidth={0.5}
          opacity={0.5}
          rx={1}
        />
        
        {/* PRO Core (Core 1) - Blue */}
        <rect
          x={x - 15}
          y={y - 30}
          width={30 * (proUtilization / 100)}
          height={3}
          className="fill-blue-500"
          rx={1}
        />
        <rect
          x={x - 15}
          y={y - 30}
          width={30}
          height={3}
          fill="none"
          stroke="#000"
          strokeWidth={0.5}
          opacity={0.5}
          rx={1}
        />
      </>
    );
  };
  
  // Render memory usage visualization
  const renderMemoryUsage = (node) => {
    if (!node || !node.memory) return null;
    
    const { x, y, memory } = node;
    const memoryPercentage = (memory.used / memory.total) * 100;
    
    // Memory color based on usage
    let memoryColor = 'fill-green-400';
    if (memoryPercentage > 80) memoryColor = 'fill-red-500';
    else if (memoryPercentage > 60) memoryColor = 'fill-yellow-500';
    
    return (
      <>
        <rect
          x={x - 15}
          y={y - 40}
          width={30 * (memory.used / memory.total)}
          height={3}
          className={memoryColor}
          rx={1}
        />
        <rect
          x={x - 15}
          y={y - 40}
          width={30}
          height={3}
          fill="none"
          stroke="#000"
          strokeWidth={0.5}
          opacity={0.5}
          rx={1}
        />
      </>
    );
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto p-2 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-bold">ESP32S3 Mesh Network Simulator</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowIntro(!showIntro)} 
            className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md"
          >
            {showIntro ? "Hide Info" : "Show Info"}
          </button>
          <button 
            onClick={toggleControlPanel}
            className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-all"
            aria-label="Toggle settings panel"
          >
            <Settings size={20} className="text-gray-700" />
          </button>
        </div>
      </div>
      
      {showIntro && (
        <div className="mb-2 bg-blue-50 p-2 rounded-lg text-xs">
          <p>
            This simulator demonstrates how ESP32S3 devices form a self-organizing mesh network using ESP-NOW protocol with TinyGo. 
            Click nodes to select them and observe message routing through the network.
          </p>
          <p className="mt-1">
            <strong>Visualization indicators:</strong>
            <span className="ml-1">🟥 App Core (Core 0),</span>
            <span className="ml-1">🟦 Pro Core (Core 1),</span>
            <span className="ml-1">🔋 Battery,</span>
            <span className="ml-1">🟩 Memory</span>
          </p>
        </div>
      )}
      
      {/* Main simulation area */}
      <div className="relative">
        {/* SVG for visualization */}
        <div className="w-full h-[450px] border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
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
              // Use role-based color for hybrid nodes
              const nodeColor = node.type === NODE_TYPES.HYBRID ? 
                getNodeColorByRole(node.currentRole) : 
                nodeColors[node.type] || '#777777';
                
              const isActive = node.active;
              const isSelected = node.id === selectedNode;
              
              return (
                <g 
                  key={node.id} 
                  className={`node cursor-pointer transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* Memory usage indicator (top) */}
                  {showNodeDetails && renderMemoryUsage(node)}
                  
                  {/* CPU utilization indicators (middle) */}
                  {showNodeDetails && renderCoreUtilization(node)}
                  
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
                  
                  {/* Node type/role label */}
                  <text
                    x={node.x}
                    y={node.y + 30}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#000000"
                    className="select-none pointer-events-none uppercase font-semibold"
                  >
                    {node.type === NODE_TYPES.HYBRID ? node.currentRole : node.type}
                  </text>
                  
                  {/* Node icon */}
                  {renderNodeIcon(node)}
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Compact Stats and Legend */}
        <div className="mt-2 bg-white p-2 rounded-lg border border-gray-200">
          <div className="flex flex-wrap justify-between items-center">
            {/* Network Statistics */}
            <div className="flex flex-wrap gap-2">
              <div className="bg-blue-50 px-2 py-1 rounded text-xs">
                <span className="text-blue-800 font-medium">{nodes.filter(n => n.active).length}/{nodes.length}</span> Nodes
              </div>
              <div className="bg-green-50 px-2 py-1 rounded text-xs">
                <span className="text-green-800 font-medium">{connections.length}</span> Connections
              </div>
              <div className="bg-yellow-50 px-2 py-1 rounded text-xs">
                <span className="text-yellow-800 font-medium">{messages.filter(m => !m.delivered).length}</span> Messages
              </div>
              <div className="bg-purple-50 px-2 py-1 rounded text-xs">
                <span className="text-purple-800 font-medium">{calculateNetworkHealth()}%</span> Resilience
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Sensor</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Relay</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Bridge</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Hybrid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Slide-out control panel */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${isControlPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-2 border-b">
          <h3 className="text-sm font-semibold">Controls</h3>
          <button 
            onClick={toggleControlPanel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close settings panel"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-2 overflow-y-auto h-full text-xs">
          {/* Quick Controls */}
          <div className="mb-3 pb-3 border-b">
            <div className="flex gap-2 mb-2">
              <button
                onClick={toggleSimulation}
                className={`flex-1 py-1 px-2 rounded-md transition-colors text-white text-xs ${
                  isSimulationRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isSimulationRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={resetSimulation}
                className="flex-1 py-1 px-2 rounded-md bg-gray-200 hover:bg-gray-300 text-xs"
              >
                Reset
              </button>
              <button
                onClick={rechargeBatteries}
                className="flex-1 py-1 px-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs"
              >
                Charge
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-1 mb-2">
              <button
                onClick={() => addNode(NODE_TYPES.HYBRID)}
                className="py-1 px-0 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs flex flex-col items-center"
              >
                <PlusCircle size={12} />
                Hybrid
              </button>
              <button
                onClick={() => addNode(NODE_TYPES.SENSOR)}
                className="py-1 px-0 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs flex flex-col items-center"
              >
                <PlusCircle size={12} />
                Sensor
              </button>
              <button
                onClick={() => addNode(NODE_TYPES.RELAY)}
                className="py-1 px-0 rounded-md bg-green-100 hover:bg-green-200 text-green-800 text-xs flex flex-col items-center"
              >
                <PlusCircle size={12} />
                Relay
              </button>
            </div>
            
            <button
              onClick={removeNode}
              disabled={!selectedNode}
              className={`w-full py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-colors text-xs ${
                selectedNode
                  ? 'bg-red-100 hover:bg-red-200 text-red-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MinusCircle size={12} />
              Remove Selected Node
            </button>
          </div>
          
          {/* Simulation Controls */}
          <div className="mb-3 pb-3 border-b">
            <h3 className="font-semibold mb-1 flex items-center gap-1 text-xs">
              <Activity size={12} /> Simulation Settings
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs mb-1">
                  Speed: {simulationSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              
              <div>
                <label className="block text-xs mb-1">
                  Range: {transmissionRange}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={transmissionRange}
                  onChange={(e) => setTransmissionRange(parseInt(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showPackets"
                    checked={showPackets}
                    onChange={() => setShowPackets(!showPackets)}
                    className="mr-1 h-3 w-3"
                  />
                  <label htmlFor="showPackets" className="text-xs">
                    Show Data Packets
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showAllRanges"
                    checked={showAllRanges}
                    onChange={() => setShowAllRanges(!showAllRanges)}
                    className="mr-1 h-3 w-3"
                  />
                  <label htmlFor="showAllRanges" className="text-xs">
                    Show All Ranges
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showNodeDetails"
                    checked={showNodeDetails}
                    onChange={() => setShowNodeDetails(!showNodeDetails)}
                    className="mr-1 h-3 w-3"
                  />
                  <label htmlFor="showNodeDetails" className="text-xs">
                    Show Node Stats
                  </label>
                </div>
              </div>
              
              <div className="text-xs bg-gray-50 p-1 rounded">
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{simulationTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span>{messageCount}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Selected Node Info */}
          {selectedNode && (
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-1 text-xs">
                <Cpu size={12} /> Node {selectedNode} Details
              </h3>
              
              {(() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;
                
                // Convert power mode to human-readable format
                const powerModeDisplay = {
                  [POWER_MODES.ACTIVE]: 'Active',
                  [POWER_MODES.LIGHT_SLEEP]: 'Light Sleep',
                  [POWER_MODES.DEEP_SLEEP]: 'Deep Sleep',
                  [POWER_MODES.MODEM_SLEEP]: 'Modem Sleep'
                };
                
                return (
                  <div className="space-y-2">
                    <div className="text-xs bg-gray-50 p-1 rounded">
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        <span>Type:</span>
                        <span className="font-medium">{node.type}</span>
                        
                        {node.type === NODE_TYPES.HYBRID && (
                          <>
                            <span>Role:</span>
                            <span className="font-medium">{node.currentRole}</span>
                          </>
                        )}
                        
                        <span>Status:</span>
                        <span className={`font-medium ${node.active ? 'text-green-600' : 'text-red-600'}`}>
                          {node.active ? 'Active' : 'Inactive'}
                        </span>
                        
                        <span>Power:</span>
                        <span className="font-medium">
                          {node.powerMode ? powerModeDisplay[node.powerMode] : 'Active'}
                        </span>
                        
                        <span>Battery:</span>
                        <span>{node.battery.toFixed(1)}%</span>
                        
                        <span>Draw:</span>
                        <span>{node.powerConsumption} mA</span>
                        
                        <span>Position:</span>
                        <span>({Math.round(node.x)}, {Math.round(node.y)})</span>
                        
                        {/* Show sensor data for sensor type or role */}
                        {(node.type === NODE_TYPES.SENSOR || node.currentRole === NODE_TYPES.SENSOR) && (
                          <>
                            <span>Temp:</span>
                            <span>{node.sensorData.temp.toFixed(1)}°C</span>
                            
                            <span>Light:</span>
                            <span>{node.sensorData.light}</span>
                            
                            {node.sensorData.humidity && (
                              <>
                                <span>Humidity:</span>
                                <span>{node.sensorData.humidity}%</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* CPU & Memory Section */}
                    <div className="text-xs bg-blue-50 p-1 rounded">
                      <h4 className="font-medium mb-1">CPU & Memory</h4>
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        {/* Core utilization */}
                        {node.cores && (
                          <>
                            <span>App Core:</span>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                              <span>{Math.round(node.cores[CORES.APP].utilization)}%</span>
                            </div>
                            
                            <span>Pro Core:</span>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                              <span>{Math.round(node.cores[CORES.PRO].utilization)}%</span>
                            </div>
                            
                            <span>APP Task:</span>
                            <span className="truncate" title={node.cores[CORES.APP].task}>
                              {node.cores[CORES.APP].task}
                            </span>
                            
                            <span>PRO Task:</span>
                            <span className="truncate" title={node.cores[CORES.PRO].task}>
                              {node.cores[CORES.PRO].task}
                            </span>
                          </>
                        )}
                        
                        {/* Memory usage */}
                        {node.memory && (
                          <>
                            <span>Memory:</span>
                            <span>{Math.round((node.memory.used / node.memory.total) * 100)}% used</span>
                            
                            <span>Free:</span>
                            <span>{(node.memory.free / 1024).toFixed(1)} MB</span>
                            
                            <span>Total:</span>
                            <span>{(node.memory.total / 1024).toFixed(1)} MB</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Network stats */}
                    <div className="text-xs bg-green-50 p-1 rounded">
                      <h4 className="font-medium mb-1">Network</h4>
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        <span>Connections:</span>
                        <span>{
                          connections.filter(conn => 
                            conn.from === node.id || conn.to === node.id
                          ).length
                        }</span>
                        
                        {/* ESP-NOW stats */}
                        {node.espNowStats && (
                          <>
                            <span>Messages sent:</span>
                            <span>{node.espNowStats.sent}</span>
                            
                            <span>Messages received:</span>
                            <span>{node.espNowStats.received}</span>
                            
                            <span>Packets failed:</span>
                            <span>{node.espNowStats.failed}</span>
                          </>
                        )}
                        
                        {/* Sleep schedule */}
                        {node.sleepSchedule && (
                          <>
                            <span>Sleep interval:</span>
                            <span>{node.sleepSchedule.interval}s</span>
                            
                            <span>Sleep duration:</span>
                            <span>{node.sleepSchedule.duration}s</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleNodeActive(node.id)}
                        className={`flex-1 py-1 px-1 rounded-md flex items-center justify-center gap-1 transition-colors text-xs ${
                          node.active
                            ? 'bg-red-100 hover:bg-red-200 text-red-800'
                            : 'bg-green-100 hover:bg-green-200 text-green-800'
                        }`}
                      >
                        {node.active ? (
                          <>
                            <ZapOff size={10} />
                            <span className="truncate">Deactivate</span>
                          </>
                        ) : (
                          <>
                            <Zap size={10} />
                            <span className="truncate">Activate</span>
                          </>
                        )}
                      </button>
                      
                      {node.type === NODE_TYPES.HYBRID && (
                        <button
                          onClick={() => cycleNodeRole(node.id)}
                          className="flex-1 py-1 px-1 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-800 flex items-center justify-center gap-1 text-xs"
                        >
                          <RefreshCw size={10} />
                          <span className="truncate">Change Role</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* About Section */}
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <p>
              This simulator demonstrates ESP32S3 dual-core architecture with intelligent power management. Hybrid nodes can switch between roles based on network conditions and power levels.
            </p>
            <p className="mt-1">
              The ESP32S3 uses Core 0 (APP) for application logic and Core 1 (PRO) for wireless communication, with multiple power modes for efficient battery use.
            </p>
            <p className="mt-1">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span> App Core (0)
              <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span> Pro Core (1)
              <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full"></span> Memory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SVGMeshNetworkSimulator;