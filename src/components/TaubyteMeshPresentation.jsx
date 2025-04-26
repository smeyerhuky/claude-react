import { useState, useEffect } from 'react';

const TaubyteMeshPresentation = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate SVG scaling for better responsiveness
  const getViewBoxScale = () => {
    if (windowWidth < 640) return 0.8; // Mobile
    if (windowWidth < 1024) return 0.9; // Tablet
    return 1; // Desktop
  };

  // SVG content from previously generated diagrams - with optimized spacing, fonts, and layout
  const diagrams = [
    {
      title: "Talking Points",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="900" height="500" fill="#f8f9fa" rx="10" ry="10"/>
  
  <!-- Title -->
  <rect x="50" y="20" width="800" height="40" rx="5" ry="5" fill="#6aa9e6" stroke="#333" stroke-width="1.5"/>
  <text x="450" y="45" font-family="Arial" font-size="18" text-anchor="middle" fill="#fff" font-weight="bold">Backyard Science Kit: ESP32S3 + Taubyte Mesh Network</text>
  
  <!-- Main sections -->
  <rect x="50" y="70" width="380" height="190" rx="10" ry="10" fill="#ffebcd" stroke="#333" stroke-width="1.5"/>
  <text x="240" y="95" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Project Vision</text>
  
  <rect x="50" y="275" width="380" height="210" rx="10" ry="10" fill="#e6f5d0" stroke="#333" stroke-width="1.5"/>
  <text x="240" y="300" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Technical Components</text>
  
  <rect x="450" y="70" width="400" height="190" rx="10" ry="10" fill="#d1e5f0" stroke="#333" stroke-width="1.5"/>
  <text x="650" y="95" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">User Experience</text>
  
  <rect x="450" y="275" width="400" height="210" rx="10" ry="10" fill="#f8d9d0" stroke="#333" stroke-width="1.5"/>
  <text x="650" y="300" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Business Model & Applications</text>
  
  <!-- Vision List -->
  <text x="70" y="125" font-family="Arial" font-size="14" fill="#333" font-weight="bold">1. Educational Citizen Science Platform</text>
  <text x="85" y="150" font-family="Arial" font-size="13" fill="#333">• Accessible IoT for teenagers and educators</text>
  <text x="85" y="170" font-family="Arial" font-size="13" fill="#333">• Collaborative data collection</text>
  <text x="85" y="190" font-family="Arial" font-size="13" fill="#333">• Customizable sensor ecosystem</text>
  
  <text x="70" y="215" font-family="Arial" font-size="14" fill="#333" font-weight="bold">2. "Virtual Click-Together" Concept</text>
  <text x="85" y="235" font-family="Arial" font-size="13" fill="#333">• Expandable mesh network</text>
  <text x="85" y="255" font-family="Arial" font-size="13" fill="#333">• Each device adds new capabilities</text>
  
  <!-- Technical Components List -->
  <text x="70" y="330" font-family="Arial" font-size="14" fill="#333" font-weight="bold">1. ESP32S3 Dual Role Capability</text>
  <text x="85" y="355" font-family="Arial" font-size="13" fill="#333">• Combined sensor/broker functionality</text>
  <text x="85" y="375" font-family="Arial" font-size="13" fill="#333">• Embedded MQTT broker compilation</text>
  <text x="85" y="395" font-family="Arial" font-size="13" fill="#333">• Dynamic role assignment in mesh</text>

  <text x="70" y="420" font-family="Arial" font-size="14" fill="#333" font-weight="bold">2. Taubyte Integration</text>
  <text x="85" y="440" font-family="Arial" font-size="13" fill="#333">• OTA firmware updates</text>
  <text x="85" y="460" font-family="Arial" font-size="13" fill="#333">• ESP-MESH for local communication</text>
  <text x="85" y="480" font-family="Arial" font-size="13" fill="#333">• Self-organizing network topology</text>
  
  <!-- User Experience List -->
  <text x="470" y="125" font-family="Arial" font-size="14" fill="#333" font-weight="bold">1. Simple Setup Process</text>
  <text x="485" y="150" font-family="Arial" font-size="13" fill="#333">• QR code-based registration</text>
  <text x="485" y="170" font-family="Arial" font-size="13" fill="#333">• Automatic device discovery</text>
  <text x="485" y="190" font-family="Arial" font-size="13" fill="#333">• Minimal configuration requirements</text>
  
  <text x="470" y="215" font-family="Arial" font-size="14" fill="#333" font-weight="bold">2. Web Dashboard</text>
  <text x="485" y="235" font-family="Arial" font-size="13" fill="#333">• Real-time sensor visualization</text>
  <text x="485" y="255" font-family="Arial" font-size="13" fill="#333">• Network health monitoring</text>
  
  <!-- Business Model List -->
  <text x="470" y="330" font-family="Arial" font-size="14" fill="#333" font-weight="bold">1. Hardware Product Line</text>
  <text x="485" y="355" font-family="Arial" font-size="13" fill="#333">• Base station (RPi + Taubyte)</text>
  <text x="485" y="375" font-family="Arial" font-size="13" fill="#333">• Variety of sensor modules</text>
  <text x="485" y="395" font-family="Arial" font-size="13" fill="#333">• Expansion kits and accessories</text>
  
  <text x="470" y="420" font-family="Arial" font-size="14" fill="#333" font-weight="bold">2. Software & Services</text>
  <text x="485" y="440" font-family="Arial" font-size="13" fill="#333">• Basic tier: device management</text>
  <text x="485" y="460" font-family="Arial" font-size="13" fill="#333">• Premium: data analytics, visualization</text>
  <text x="485" y="480" font-family="Arial" font-size="13" fill="#333">• Community: data sharing, projects</text>
</svg>`
    },
    {
      title: "System Architecture",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="500" fill="#f8f9fa" rx="10" ry="10"/>
  
  <!-- Title -->
  <text x="400" y="35" font-family="Arial" font-size="18" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 - Taubyte Mesh Network Architecture</text>
  
  <!-- Raspberry Pi 5 with Taubyte -->
  <rect x="300" y="60" width="200" height="80" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1.5"/>
  <text x="400" y="90" font-family="Arial" font-size="15" text-anchor="middle" fill="#333" font-weight="bold">Raspberry Pi 5</text>
  <rect x="330" y="105" width="140" height="25" rx="5" ry="5" fill="#d1f0e5" stroke="#333" stroke-width="1"/>
  <text x="400" y="122" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Taubyte Server</text>
  
  <!-- Edge Gateway ESP32S3 -->
  <rect x="300" y="170" width="200" height="60" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1.5"/>
  <text x="400" y="195" font-family="Arial" font-size="15" text-anchor="middle" fill="#333" font-weight="bold">Gateway ESP32S3</text>
  <text x="400" y="215" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">MQTT Broker + Bridge</text>
  
  <!-- WiFi Connection between RPi and Gateway -->
  <path d="M 400 140 L 400 170" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <circle cx="400" cy="155" r="8" fill="#a0c4ff" stroke="#333" stroke-width="1"/>
  <text x="415" y="158" font-family="Arial" font-size="12" fill="#333">WiFi</text>
  
  <!-- ESP32S3 Devices in Mesh -->
  <g id="esp-device-1">
    <rect x="130" y="270" width="120" height="55" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
    <text x="190" y="293" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Node</text>
    <text x="190" y="313" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">ESP-MESH</text>
  </g>
  
  <g id="esp-device-2">
    <rect x="340" y="320" width="120" height="55" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
    <text x="400" y="343" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Node</text>
    <text x="400" y="363" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">ESP-MESH</text>
  </g>
  
  <g id="esp-device-3">
    <rect x="550" y="270" width="120" height="55" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
    <text x="610" y="293" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Node</text>
    <text x="610" y="313" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">ESP-MESH</text>
  </g>
  
  <!-- Mesh connections -->
  <path d="M 350 200 L 190 270" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <path d="M 400 230 L 400 320" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <path d="M 450 200 L 570 270" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <path d="M 210 315 L 353 335" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <path d="M 445 335 L 560 315" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <!-- ESP-MESH Icon and Label -->
  <circle cx="360" y="270" r="18" fill="#ffb6c1" stroke="#333" stroke-width="1" opacity="0.6"/>
  <text x="360" y="274" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">MESH</text>
  
  <!-- Legend -->
  <rect x="610" y="60" width="160" height="125" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <text x="690" y="85" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Legend</text>
  
  <rect x="625" y="100" width="15" height="15" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="655" y="113" font-family="Arial" font-size="12" text-anchor="start" fill="#333">Taubyte Server</text>
  
  <rect x="625" y="125" width="15" height="15" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="655" y="138" font-family="Arial" font-size="12" text-anchor="start" fill="#333">Gateway Node</text>
  
  <rect x="625" y="150" width="15" height="15" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="655" y="163" font-family="Arial" font-size="12" text-anchor="start" fill="#333">ESP32S3 Node</text>
  
  <!-- Notes -->
  <rect x="40" y="390" width="720" height="100" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <text x="400" y="410" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Architecture Notes:</text>
  <text x="400" y="435" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">• Raspberry Pi 5 runs Taubyte for edge computing and communicates with gateway ESP32S3 via WiFi</text>
  <text x="400" y="460" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">• Gateway ESP32S3 runs MQTT broker and Taubyte bridge function to translate between protocols</text>
  <text x="400" y="485" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">• ESP32 nodes form a mesh network using ESP-MESH protocol while communicating with gateway via MQTT</text>
</svg>`
    },
    {
      title: "Data Flow",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="500" fill="#f8f9fa" rx="10" ry="10"/>
  
  <!-- Title -->
  <text x="400" y="30" font-family="Arial" font-size="18" text-anchor="middle" fill="#333" font-weight="bold">Data Flow Diagram: ESP32S3 - Taubyte MQTT Integration</text>
  
  <!-- Devices -->
  <rect x="50" y="60" width="150" height="50" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="125" y="80" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Node</text>
  <text x="125" y="100" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">(Sensor/Actuator)</text>
  
  <rect x="325" y="60" width="150" height="50" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1.5"/>
  <text x="400" y="80" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Gateway ESP32S3</text>
  <text x="400" y="100" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">(MQTT Broker)</text>
  
  <rect x="600" y="60" width="150" height="50" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1.5"/>
  <text x="675" y="80" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Raspberry Pi 5</text>
  <text x="675" y="100" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">(Taubyte Server)</text>
  
  <!-- Arrows for Sensor Data Flow -->
  <path d="M 200 75 L 325 75" stroke="#4285F4" stroke-width="1.5" marker-end="url(#arrow)"/>
  <path d="M 475 75 L 600 75" stroke="#4285F4" stroke-width="1.5" marker-end="url(#arrow)"/>
  
  <!-- Text for Sensor Data Flow -->
  <text x="262.5" y="65" font-family="Arial" font-size="12" text-anchor="middle" fill="#4285F4" font-weight="bold">Sensor Data</text>
  <text x="262.5" y="85" font-family="Arial" font-size="10" text-anchor="middle" fill="#4285F4">(MQTT Topic: sensors/data)</text>
  
  <text x="537.5" y="65" font-family="Arial" font-size="12" text-anchor="middle" fill="#4285F4" font-weight="bold">Forwarded Data</text>
  <text x="537.5" y="85" font-family="Arial" font-size="10" text-anchor="middle" fill="#4285F4">(Taubyte PubSub)</text>
  
  <!-- Arrows for Command Flow -->
  <path d="M 600 105 L 475 105" stroke="#DB4437" stroke-width="1.5" marker-end="url(#arrow)"/>
  <path d="M 325 105 L 200 105" stroke="#DB4437" stroke-width="1.5" marker-end="url(#arrow)"/>
  
  <!-- Text for Command Flow -->
  <text x="537.5" y="95" font-family="Arial" font-size="12" text-anchor="middle" fill="#DB4437" font-weight="bold">Commands</text>
  <text x="537.5" y="115" font-family="Arial" font-size="10" text-anchor="middle" fill="#DB4437">(Taubyte Function)</text>
  
  <text x="262.5" y="95" font-family="Arial" font-size="12" text-anchor="middle" fill="#DB4437" font-weight="bold">Commands</text>
  <text x="262.5" y="115" font-family="Arial" font-size="10" text-anchor="middle" fill="#DB4437">(MQTT Topic: commands/action)</text>
  
  <!-- Arrow Definitions -->
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#666" stroke="none"/>
    </marker>
  </defs>
  
  <!-- Components Detail -->
  <!-- ESP32S3 Node Components -->
  <rect x="50" y="130" width="150" height="240" rx="5" ry="5" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="125" y="150" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Node</text>
  
  <rect x="70" y="160" width="110" height="30" rx="5" ry="5" fill="#e2f0cb" stroke="#333" stroke-width="1"/>
  <text x="125" y="180" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Sensor Interface</text>
  
  <rect x="70" y="195" width="110" height="30" rx="5" ry="5" fill="#e2f0cb" stroke="#333" stroke-width="1"/>
  <text x="125" y="215" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">MQTT Client</text>
  
  <rect x="70" y="230" width="110" height="30" rx="5" ry="5" fill="#e2f0cb" stroke="#333" stroke-width="1"/>
  <text x="125" y="250" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">ESP-MESH</text>
  
  <rect x="70" y="265" width="110" height="30" rx="5" ry="5" fill="#e2f0cb" stroke="#333" stroke-width="1"/>
  <text x="125" y="285" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Message Cache</text>
  
  <rect x="70" y="300" width="110" height="30" rx="5" ry="5" fill="#e2f0cb" stroke="#333" stroke-width="1"/>
  <text x="125" y="320" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Configuration</text>
  
  <rect x="70" y="335" width="110" height="30" rx="5" ry="5" fill="#e2f0cb" stroke="#333" stroke-width="1"/>
  <text x="125" y="355" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Battery Management</text>
  
  <!-- Gateway ESP32S3 Components -->
  <rect x="325" y="130" width="150" height="240" rx="5" ry="5" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="400" y="150" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Gateway ESP32S3</text>
  
  <rect x="345" y="160" width="110" height="30" rx="5" ry="5" fill="#ffeeb2" stroke="#333" stroke-width="1"/>
  <text x="400" y="180" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">MQTT Broker</text>
  
  <rect x="345" y="195" width="110" height="30" rx="5" ry="5" fill="#ffeeb2" stroke="#333" stroke-width="1"/>
  <text x="400" y="215" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">WiFi Client</text>
  
  <rect x="345" y="230" width="110" height="30" rx="5" ry="5" fill="#ffeeb2" stroke="#333" stroke-width="1"/>
  <text x="400" y="250" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">ESP-MESH Root</text>
  
  <rect x="345" y="265" width="110" height="30" rx="5" ry="5" fill="#ffeeb2" stroke="#333" stroke-width="1"/>
  <text x="400" y="285" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Message Bridge</text>
  
  <rect x="345" y="300" width="110" height="30" rx="5" ry="5" fill="#ffeeb2" stroke="#333" stroke-width="1"/>
  <text x="400" y="320" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Device Management</text>
  
  <rect x="345" y="335" width="110" height="30" rx="5" ry="5" fill="#ffeeb2" stroke="#333" stroke-width="1"/>
  <text x="400" y="355" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Persistent Storage</text>
  
  <!-- Raspberry Pi 5 Components -->
  <rect x="600" y="130" width="150" height="240" rx="5" ry="5" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="675" y="150" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Raspberry Pi 5</text>
  
  <rect x="620" y="160" width="110" height="30" rx="5" ry="5" fill="#cfe2f3" stroke="#333" stroke-width="1"/>
  <text x="675" y="180" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Taubyte Core</text>
  
  <rect x="620" y="195" width="110" height="30" rx="5" ry="5" fill="#cfe2f3" stroke="#333" stroke-width="1"/>
  <text x="675" y="215" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">P2P Network</text>
  
  <rect x="620" y="230" width="110" height="30" rx="5" ry="5" fill="#cfe2f3" stroke="#333" stroke-width="1"/>
  <text x="675" y="250" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">MQTT-Bridge Fn</text>
  
  <rect x="620" y="265" width="110" height="30" rx="5" ry="5" fill="#cfe2f3" stroke="#333" stroke-width="1"/>
  <text x="675" y="285" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Data Processing</text>
  
  <rect x="620" y="300" width="110" height="30" rx="5" ry="5" fill="#cfe2f3" stroke="#333" stroke-width="1"/>
  <text x="675" y="320" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Visualization</text>
  
  <rect x="620" y="335" width="110" height="30" rx="5" ry="5" fill="#cfe2f3" stroke="#333" stroke-width="1"/>
  <text x="675" y="355" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Storage/Database</text>
  
  <!-- Flow connections between components -->
  <path d="M 125 190 L 125 195" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 125 225 L 125 230" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 125 260 L 125 265" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 125 295 L 125 300" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 125 330 L 125 335" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  
  <path d="M 400 190 L 400 195" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 400 225 L 400 230" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 400 260 L 400 265" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 400 295 L 400 300" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 400 330 L 400 335" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  
  <path d="M 675 190 L 675 195" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 675 225 L 675 230" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 675 260 L 675 265" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 675 295 L 675 300" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  <path d="M 675 330 L 675 335" stroke="#333" stroke-width="1" marker-end="url(#arrow)"/>
  
  <!-- Cross-component data flows -->
  <path d="M 180 205 Q 250 205 345 170" stroke="#4285F4" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arrow)" fill="none"/>
  <path d="M 455 170 Q 530 170 620 235" stroke="#4285F4" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arrow)" fill="none"/>
  <path d="M 620 270 Q 530 270 455 270" stroke="#DB4437" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arrow)" fill="none"/>
  <path d="M 345 270 Q 250 270 180 205" stroke="#DB4437" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arrow)" fill="none"/>
  
  <!-- Notes section -->
  <rect x="50" y="390" width="700" height="100" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <text x="400" y="410" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Data Flow Notes:</text>
  <text x="400" y="435" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">• ESP32S3 sensors collect data and send to Gateway via MQTT (Blue path)</text>
  <text x="400" y="460" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">• Gateway forwards data to Raspberry Pi Taubyte server for processing</text>
  <text x="400" y="485" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">• Commands flow from Raspberry Pi through Gateway to ESP32S3 nodes (Red path)</text>
</svg>`
    },
    {
      title: "Network Topology",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="500" fill="#f8f9fa" rx="10" ry="10"/>
  
  <!-- Title -->
  <text x="400" y="35" font-family="Arial" font-size="18" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Network Topology Options</text>
  
  <!-- Option 1: Star Topology -->
  <text x="200" y="65" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Option 1: Star Topology</text>
  
  <rect x="200" y="75" width="60" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1.5"/>
  <text x="230" y="97" font-family="Arial" font-size="12" text-anchor="middle" fill="#333" font-weight="bold">Gateway</text>
  
  <circle cx="140" cy="160" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="140" y="164" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="200" cy="160" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="200" y="164" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="260" cy="160" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="260" y="164" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <!-- Star connections -->
  <line x1="200" y1="110" x2="140" y2="145" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="230" y1="110" x2="200" y2="145" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="260" y1="110" x2="260" y2="145" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <!-- Star Topology Notes -->
  <rect x="80" y="190" width="240" height="80" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <text x="200" y="210" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Star Topology Notes:</text>
  <text x="200" y="230" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• Single gateway ESP32S3 as coordinator</text>
  <text x="200" y="250" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• All nodes connect directly to gateway</text>
  <text x="200" y="270" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• Limited by gateway range</text>
  
  <!-- Option 2: Mesh Topology -->
  <text x="600" y="65" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Option 2: Mesh Topology</text>
  
  <rect x="600" y="75" width="60" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1.5"/>
  <text x="630" y="97" font-family="Arial" font-size="12" text-anchor="middle" fill="#333" font-weight="bold">Gateway</text>
  
  <circle cx="520" cy="140" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="520" y="144" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="600" cy="170" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="600" y="174" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="680" cy="140" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="680" y="144" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="520" cy="210" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="520" y="214" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="680" cy="210" r="20" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="680" y="214" font-family="Arial" font-size="11" text-anchor="middle" fill="#333">ESP32</text>
  
  <!-- Mesh connections -->
  <line x1="600" y1="110" x2="520" y2="140" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="600" y1="110" x2="600" y2="150" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="600" y1="110" x2="680" y2="140" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <line x1="520" y1="140" x2="600" y2="170" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="680" y1="140" x2="600" y2="170" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="520" y1="140" x2="520" y2="190" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="680" y1="140" x2="680" y2="190" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="520" y1="210" x2="600" y2="170" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="680" y1="210" x2="600" y2="170" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="520" y1="210" x2="680" y2="210" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <!-- Mesh Topology Notes -->
  <rect x="480" y="240" width="240" height="90" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <text x="600" y="260" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Mesh Topology Notes:</text>
  <text x="600" y="280" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• ESP32S3 nodes can relay messages</text>
  <text x="600" y="300" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• Uses ESP-MESH protocol for routing</text>
  <text x="600" y="320" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• Self-healing network topology</text>
  
  <!-- Option 3: Hybrid Topology -->
  <text x="400" y="350" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Option 3: Multi-Gateway Hybrid Topology</text>
  
  <rect x="300" y="370" width="60" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1.5"/>
  <text x="330" y="392" font-family="Arial" font-size="12" text-anchor="middle" fill="#333" font-weight="bold">Gateway1</text>
  
  <rect x="500" y="370" width="60" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1.5"/>
  <text x="530" y="392" font-family="Arial" font-size="12" text-anchor="middle" fill="#333" font-weight="bold">Gateway2</text>
  
  <rect x="400" y="430" width="60" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1.5"/>
  <text x="430" y="452" font-family="Arial" font-size="12" text-anchor="middle" fill="#333" font-weight="bold">RPi 5</text>
  
  <circle cx="250" cy="410" r="15" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="250" y="414" font-family="Arial" font-size="9" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="300" cy="430" r="15" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="300" y="434" font-family="Arial" font-size="9" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="350" cy="410" r="15" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="350" y="414" font-family="Arial" font-size="9" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="450" cy="380" r="15" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="450" y="384" font-family="Arial" font-size="9" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="550" cy="410" r="15" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="550" y="414" font-family="Arial" font-size="9" text-anchor="middle" fill="#333">ESP32</text>
  
  <circle cx="500" cy="430" r="15" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="500" y="434" font-family="Arial" font-size="9" text-anchor="middle" fill="#333">ESP32</text>
  
  <!-- Hybrid connections -->
  <line x1="300" y1="405" x2="250" y2="410" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="330" y1="405" x2="300" y2="420" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="360" y1="405" x2="350" y2="410" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <line x1="500" y1="405" x2="450" y2="380" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="530" y1="405" x2="550" y2="410" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="500" y1="405" x2="500" y2="415" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <line x1="250" y1="410" x2="300" y2="430" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="300" y1="430" x2="350" y2="410" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="450" y1="380" x2="500" y2="430" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="500" y1="430" x2="550" y2="410" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <line x1="330" y1="405" x2="400" y2="430" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="500" y1="405" x2="430" y2="430" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  
  <!-- Hybrid Topology Notes -->
  <rect x="600" y="370" width="180" height="90" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <text x="690" y="390" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Hybrid Topology Notes:</text>
  <text x="690" y="410" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• Multiple gateway nodes</text>
  <text x="690" y="430" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• Each forms local mesh</text>
  <text x="690" y="450" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">• Best for large areas</text>
</svg>`
    },
    {
      title: "Component Interaction",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="500" fill="#f8f9fa" rx="10" ry="10"/>
  
  <!-- Title -->
  <text x="400" y="30" font-family="Arial" font-size="18" text-anchor="middle" fill="#333" font-weight="bold">Component Interaction Diagram</text>
  
  <!-- Devices -->
  <rect x="50" y="45" width="200" height="420" rx="10" ry="10" fill="#f0f0f0" stroke="#333" stroke-width="1.5"/>
  <text x="150" y="70" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Node</text>
  
  <rect x="300" y="45" width="200" height="420" rx="10" ry="10" fill="#f0f0f0" stroke="#333" stroke-width="1.5"/>
  <text x="400" y="70" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Gateway ESP32S3</text>
  
  <rect x="550" y="45" width="200" height="420" rx="10" ry="10" fill="#f0f0f0" stroke="#333" stroke-width="1.5"/>
  <text x="650" y="70" font-family="Arial" font-size="16" text-anchor="middle" fill="#333" font-weight="bold">Raspberry Pi 5</text>
  
  <!-- ESP32S3 Node Components -->
  <rect x="75" y="85" width="150" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="150" y="107" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">ESP-IDF Framework</text>
  
  <rect x="75" y="130" width="150" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="150" y="152" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Sensor Driver APIs</text>
  
  <rect x="75" y="175" width="150" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="150" y="197" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">ESP-MESH Library</text>
  
  <rect x="75" y="220" width="150" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="150" y="242" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">MQTT Client Library</text>
  
  <rect x="75" y="265" width="150" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="150" y="287" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Message Queue</text>
  
  <rect x="75" y="310" width="150" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="150" y="332" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Configuration</text>
  
  <rect x="75" y="355" width="150" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <text x="150" y="377" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Battery Management</text>
  
  <!-- Gateway ESP32S3 Components -->
  <rect x="325" y="85" width="150" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="400" y="107" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">ESP-IDF Framework</text>
  
  <rect x="325" y="130" width="150" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="400" y="152" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">WiFi Station+AP</text>
  
  <rect x="325" y="175" width="150" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="400" y="197" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">ESP-MESH Root Node</text>
  
  <rect x="325" y="220" width="150" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="400" y="242" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">MQTT Broker</text>
  
  <rect x="325" y="265" width="150" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="400" y="287" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">MQTT-Taubyte Bridge</text>
  
  <rect x="325" y="310" width="150" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="400" y="332" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Device Management</text>
  
  <rect x="325" y="355" width="150" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <text x="400" y="377" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Persistent Storage</text>
  
  <!-- Raspberry Pi 5 Components -->
  <rect x="575" y="85" width="150" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="650" y="107" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Linux OS</text>
  
  <rect x="575" y="130" width="150" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="650" y="152" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Taubyte Core</text>
  
  <rect x="575" y="175" width="150" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="650" y="197" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Taubyte P2P Network</text>
  
  <rect x="575" y="220" width="150" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="650" y="242" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Taubyte PubSub</text>
  
  <rect x="575" y="265" width="150" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="650" y="287" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">MQTT Bridge Function</text>
  
  <rect x="575" y="310" width="150" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="650" y="332" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Data Storage</text>
  
  <rect x="575" y="355" width="150" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <text x="650" y="377" font-family="Arial" font-size="13" text-anchor="middle" fill="#333">Visualization</text>
  
  <!-- Interaction Lines -->
  <!-- ESP32S3 Internal -->
  <path d="M 150 120 L 150 130" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 150 165 L 150 175" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 150 210 L 150 220" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 150 255 L 150 265" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 150 300 L 150 310" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 150 345 L 150 355" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  
  <!-- Gateway Internal -->
  <path d="M 400 120 L 400 130" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 400 165 L 400 175" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 400 210 L 400 220" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 400 255 L 400 265" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 400 300 L 400 310" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 400 345 L 400 355" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  
  <!-- RPi5 Internal -->
  <path d="M 650 120 L 650 130" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 650 165 L 650 175" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 650 210 L 650 220" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 650 255 L 650 265" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 650 300 L 650 310" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  <path d="M 650 345 L 650 355" stroke="#333" stroke-width="1" marker-end="url(#triangle)"/>
  
  <!-- Cross-device interactions -->
  <!-- ESP-MESH Connection -->
  <path d="M 225 190 Q 275 190 325 190" stroke="#4285F4" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#triangle)"/>
  <text x="275" y="180" font-family="Arial" font-size="12" text-anchor="middle" fill="#4285F4" font-weight="bold">ESP-MESH</text>
  
  <!-- MQTT Connection -->
  <path d="M 225 235 Q 275 235 325 235" stroke="#DB4437" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#triangle)"/>
  <text x="275" y="225" font-family="Arial" font-size="12" text-anchor="middle" fill="#DB4437" font-weight="bold">MQTT</text>
  
  <!-- WiFi Connection -->
  <path d="M 475 145 Q 525 145 575 145" stroke="#0F9D58" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#triangle)"/>
  <text x="525" y="135" font-family="Arial" font-size="12" text-anchor="middle" fill="#0F9D58" font-weight="bold">WiFi</text>
  
  <!-- Bridge Connection -->
  <path d="M 475 280 Q 525 280 575 280" stroke="#F4B400" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#triangle)"/>
  <text x="525" y="270" font-family="Arial" font-size="12" text-anchor="middle" fill="#F4B400" font-weight="bold">Bridge</text>
  
  <defs>
    <marker id="triangle" viewBox="0 0 10 10" refX="1" refY="5"
            markerUnits="strokeWidth" markerWidth="10" markerHeight="10"
            orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#666"/>
    </marker>
  </defs>
  
  <!-- Legend -->
  <rect x="50" y="410" width="700" height="45" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <text x="400" y="430" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Legend:</text>
  
  <line x1="120" y1="430" x2="150" y2="430" stroke="#4285F4" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="180" y="435" font-family="Arial" font-size="12" text-anchor="start" fill="#333">ESP-MESH Protocol</text>
  
  <line x1="300" y1="430" x2="330" y2="430" stroke="#DB4437" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="360" y="435" font-family="Arial" font-size="12" text-anchor="start" fill="#333">MQTT Protocol</text>
  
  <line x1="480" y1="430" x2="510" y2="430" stroke="#0F9D58" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="540" y="435" font-family="Arial" font-size="12" text-anchor="start" fill="#333">WiFi Connection</text>
  
  <line x1="620" y1="430" x2="650" y2="430" stroke="#F4B400" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="680" y="435" font-family="Arial" font-size="12" text-anchor="start" fill="#333">Bridge</text>
</svg>`
    },
    {
      title: "Sequence Diagram",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="500" fill="#f8f9fa" rx="10" ry="10"/>
  
  <!-- Title -->
  <text x="400" y="30" font-family="Arial" font-size="18" text-anchor="middle" fill="#333" font-weight="bold">Message Flow Sequence Diagram</text>
  
  <!-- Actors -->
  <rect x="100" y="50" width="100" height="35" rx="5" ry="5" fill="#ffd6ff" stroke="#333" stroke-width="1.5"/>
  <text x="150" y="72" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">ESP32S3 Node</text>
  
  <rect x="350" y="50" width="100" height="35" rx="5" ry="5" fill="#ffcda8" stroke="#333" stroke-width="1.5"/>
  <text x="400" y="72" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Gateway</text>
  
  <rect x="600" y="50" width="100" height="35" rx="5" ry="5" fill="#b5e8d4" stroke="#333" stroke-width="1.5"/>
  <text x="650" y="72" font-family="Arial" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">Raspberry Pi 5</text>
  
  <!-- Lifelines -->
  <line x1="150" y1="85" x2="150" y2="470" stroke="#333" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="400" y1="85" x2="400" y2="470" stroke="#333" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="650" y1="85" x2="650" y2="470" stroke="#333" stroke-width="1" stroke-dasharray="4,4"/>
  
  <!-- Activation Boxes -->
  <!-- Device Initialization -->
  <rect x="145" y="100" width="10" height="35" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <rect x="395" y="110" width="10" height="25" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  
  <!-- ESP-MESH Network Formation -->
  <rect x="145" y="145" width="10" height="65" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <rect x="395" y="155" width="10" height="55" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  
  <!-- Gateway-Taubyte Connection -->
  <rect x="395" y="220" width="10" height="45" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <rect x="645" y="230" width="10" height="35" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  
  <!-- Sensor Data Flow -->
  <rect x="145" y="275" width="10" height="65" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  <rect x="395" y="285" width="10" height="55" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <rect x="645" y="305" width="10" height="35" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  
  <!-- Command Flow -->
  <rect x="645" y="350" width="10" height="45" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <rect x="395" y="360" width="10" height="35" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <rect x="145" y="380" width="10" height="15" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  
  <!-- OTA Update Flow -->
  <rect x="645" y="405" width="10" height="45" fill="#b5e8d4" stroke="#333" stroke-width="1"/>
  <rect x="395" y="415" width="10" height="35" fill="#ffcda8" stroke="#333" stroke-width="1"/>
  <rect x="145" y="435" width="10" height="15" fill="#ffd6ff" stroke="#333" stroke-width="1"/>
  
  <!-- Messages -->
  <!-- Device Initialization -->
  <path d="M 150 100 Q 200 95 400 110" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" fill="none"/>
  <text x="275" y="100" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">1. Device Discovery</text>
  
  <path d="M 400 135 Q 350 140 150 135" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" stroke-dasharray="2,2" fill="none"/>
  <text x="275" y="150" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">2. Discovery Response</text>
  
  <!-- ESP-MESH Network Formation -->
  <path d="M 150 145 Q 200 140 400 155" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" fill="none"/>
  <text x="275" y="145" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">3. Join Mesh Request</text>
  
  <path d="M 400 165 Q 350 170 150 165" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" stroke-dasharray="2,2" fill="none"/>
  <text x="275" y="180" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">4. Mesh Configuration</text>
  
  <path d="M 150 185 Q 200 190 400 185" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" fill="none"/>
  <text x="275" y="200" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">5. MQTT Connection</text>
  
  <path d="M 400 200 Q 350 205 150 200" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" stroke-dasharray="2,2" fill="none"/>
  <text x="275" y="215" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">6. Topic Subscriptions</text>
  
  <!-- Gateway-Taubyte Connection -->
  <path d="M 400 220 Q 450 215 650 230" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" fill="none"/>
  <text x="525" y="220" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">7. Bridge Connection</text>
  
  <path d="M 650 245 Q 600 250 400 245" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)" stroke-dasharray="2,2" fill="none"/>
  <text x="525" y="260" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">8. PubSub Channel Setup</text>
  
  <!-- Sensor Data Flow -->
  <path d="M 150 275 Q 200 270 400 285" stroke="#4285F4" stroke-width="1.2" marker-end="url(#arrowhead)" fill="none"/>
  <text x="275" y="275" font-family="Arial" font-size="10" text-anchor="middle" fill="#4285F4" font-weight="bold">9. Sensor Data (MQTT)</text>
  
  <path d="M 400 305 Q 450 300 650 305" stroke="#4285F4" stroke-width="1.2" marker-end="url(#arrowhead)" fill="none"/>
  <text x="525" y="300" font-family="Arial" font-size="10" text-anchor="middle" fill="#4285F4" font-weight="bold">10. Data to Taubyte</text>
  
  <path d="M 650 325 Q 600 330 400 325" stroke="#4285F4" stroke-width="1.2" marker-end="url(#arrowhead)" stroke-dasharray="2,2" fill="none"/>
  <text x="525" y="340" font-family="Arial" font-size="10" text-anchor="middle" fill="#4285F4" font-weight="bold">11. Data Ack</text>
  
  <!-- Command Flow -->
  <path d="M 650 350 Q 600 345 400 360" stroke="#DB4437" stroke-width="1.2" marker-end="url(#arrowhead)" fill="none"/>
  <text x="525" y="350" font-family="Arial" font-size="10" text-anchor="middle" fill="#DB4437" font-weight="bold">12. Command (PubSub)</text>
  
  <path d="M 400 380 Q 350 375 150 380" stroke="#DB4437" stroke-width="1.2" marker-end="url(#arrowhead)" fill="none"/>
  <text x="275" y="375" font-family="Arial" font-size="10" text-anchor="middle" fill="#DB4437" font-weight="bold">13. Command (MQTT)</text>
  
  <path d="M 150 390 Q 200 395 400 390" stroke="#DB4437" stroke-width="1.2" marker-end="url(#arrowhead)" stroke-dasharray="2,2" fill="none"/>
  <text x="275" y="405" font-family="Arial" font-size="10" text-anchor="middle" fill="#DB4437" font-weight="bold">14. Command Ack</text>
  
  <!-- OTA Update Flow -->
  <path d="M 650 405 Q 600 400 400 415" stroke="#0F9D58" stroke-width="1.2" marker-end="url(#arrowhead)" fill="none"/>
  <text x="525" y="410" font-family="Arial" font-size="10" text-anchor="middle" fill="#0F9D58" font-weight="bold">15. OTA Update (Taubyte)</text>
  
  <path d="M 400 435 Q 350 430 150 435" stroke="#0F9D58" stroke-width="1.2" marker-end="url(#arrowhead)" fill="none"/>
  <text x="275" y="430" font-family="Arial" font-size="10" text-anchor="middle" fill="#0F9D58" font-weight="bold">16. Firmware Update</text>
  
  <path d="M 150 445 Q 200 450 400 445" stroke="#0F9D58" stroke-width="1.2" marker-end="url(#arrowhead)" stroke-dasharray="2,2" fill="none"/>
  <text x="275" y="460" font-family="Arial" font-size="10" text-anchor="middle" fill="#0F9D58" font-weight="bold">17. Update Complete</text>
  
  <!-- Arrowhead Definition -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
    </marker>
  </defs>
  
  <!-- Time Phases -->
  <rect x="30" y="100" width="30" height="35" fill="#f0f0f0" stroke="#333" stroke-width="1" rx="5" ry="5"/>
  <text x="45" y="122" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold" transform="rotate(-90 45 122)">Init</text>
  
  <rect x="30" y="145" width="30" height="65" fill="#f0f0f0" stroke="#333" stroke-width="1" rx="5" ry="5"/>
  <text x="45" y="177" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold" transform="rotate(-90 45 177)">Network</text>
  
  <rect x="30" y="220" width="30" height="45" fill="#f0f0f0" stroke="#333" stroke-width="1" rx="5" ry="5"/>
  <text x="45" y="242" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold" transform="rotate(-90 45 242)">Bridge</text>
  
  <rect x="30" y="275" width="30" height="65" fill="#f0f0f0" stroke="#333" stroke-width="1" rx="5" ry="5"/>
  <text x="45" y="307" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold" transform="rotate(-90 45 307)">Data</text>
  
  <rect x="30" y="350" width="30" height="45" fill="#f0f0f0" stroke="#333" stroke-width="1" rx="5" ry="5"/>
  <text x="45" y="372" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold" transform="rotate(-90 45 372)">Commands</text>
  
  <rect x="30" y="405" width="30" height="45" fill="#f0f0f0" stroke="#333" stroke-width="1" rx="5" ry="5"/>
  <text x="45" y="427" font-family="Arial" font-size="10" text-anchor="middle" fill="#333" font-weight="bold" transform="rotate(-90 45 427)">Update</text>
  
  <!-- Legend -->
  <rect x="720" y="120" width="60" height="90" rx="5" ry="5" fill="white" stroke="#333" stroke-width="1" opacity="0.9"/>
  <line x1="730" y1="140" x2="770" y2="140" stroke="#4285F4" stroke-width="1.5"/>
  <text x="750" y="155" font-family="Arial" font-size="10" text-anchor="middle" fill="#4285F4" font-weight="bold">Data</text>
  
  <line x1="730" y1="170" x2="770" y2="170" stroke="#DB4437" stroke-width="1.5"/>
  <text x="750" y="185" font-family="Arial" font-size="10" text-anchor="middle" fill="#DB4437" font-weight="bold">Command</text>
  
  <line x1="730" y1="200" x2="770" y2="200" stroke="#0F9D58" stroke-width="1.5"/>
  <text x="750" y="215" font-family="Arial" font-size="10" text-anchor="middle" fill="#0F9D58" font-weight="bold">Update</text>
</svg>`
    }
  ];

  const TabButton = ({ title, index }) => (
    <button
      className={`py-2 px-4 text-sm font-medium rounded-t-lg mr-1 focus:outline-none whitespace-nowrap ${
        activeTab === index 
          ? 'bg-white text-blue-600 border border-b-0 border-gray-300 shadow-sm' 
          : 'bg-gray-50 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-transparent'
      }`}
      onClick={() => setActiveTab(index)}
    >
      {title}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 p-4 rounded-lg shadow-md max-h-screen">
      <h1 className="text-xl font-bold text-gray-800 mb-3">ESP32S3-Taubyte Mesh Network Design</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-300 mb-3 overflow-x-auto pb-0">
        {diagrams.map((diagram, index) => (
          <TabButton key={index} title={diagram.title} index={index} />
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="flex-grow bg-white p-4 rounded-lg shadow overflow-auto">
        <div className="flex justify-center items-center h-full">
          <div 
            className="w-full h-full" 
            style={{
              transform: `scale(${getViewBoxScale()})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease'
            }}
            dangerouslySetInnerHTML={{__html: diagrams[activeTab].content}}
          />
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className="flex justify-between mt-4 items-center">
        <button 
          className={`px-4 py-2 rounded bg-blue-500 text-white font-medium ${activeTab === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 shadow-sm'}`}
          onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
          disabled={activeTab === 0}
        >
          Previous
        </button>
        
        <div className="text-gray-700 font-medium">
          {activeTab + 1} of {diagrams.length}
        </div>
        
        <button 
          className={`px-4 py-2 rounded bg-blue-500 text-white font-medium ${activeTab === diagrams.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 shadow-sm'}`}
          onClick={() => setActiveTab(prev => Math.min(diagrams.length - 1, prev + 1))}
          disabled={activeTab === diagrams.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TaubyteMeshPresentation;