import React, { useState, useReducer, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, Server, Cpu, Thermometer, Wind, Droplets, 
  Sun, Zap, Wifi, Database, Code, Home, 
  ArrowRight, Check, AlertCircle, ChevronRight, 
  ChevronLeft, Play, Pause, Repeat, Settings, 
  FileText, CircleOff, CheckCircle, Timer
} from 'lucide-react';

// Component Registry - define all components that can be dynamically loaded
const componentRegistry = {
  Overview: ({ data }) => <OverviewComponent data={data} />,
  HardwareBOM: ({ data }) => <HardwareBOMComponent data={data} />,
  SoftwareBOM: ({ data }) => <SoftwareBOMComponent data={data} />,
  SystemArchitecture: ({ data }) => <SystemArchitectureComponent data={data} />,
  StateMachines: ({ data }) => <StateMachinesComponent data={data} />,
  Implementation: ({ data }) => <ImplementationComponent data={data} />,
  Conclusion: ({ data }) => <ConclusionComponent data={data} />
};

// Initial state for the application
const initialState = {
  activeTab: "overview",
  scrubberPosition: 0,
  simulationState: "stopped", // "running", "stopped", "paused"
  simulationSpeed: 1,
  currentStep: 0,
  weatherQuery: "What's the current temperature?",
  systemStatus: {
    sensors: { status: "online", lastUpdate: "2 min ago" },
    mcp: { status: "online", lastUpdate: "1 min ago" },
    local_cloud: { status: "online", lastUpdate: "30 sec ago" },
    llm_agent: { status: "online", lastUpdate: "45 sec ago" }
  }
};

// State machine data for each component
const stateMachines = {
  weatherQuery: {
    nodes: [
      { id: "user_input", label: "User Input", icon: <FileText size={20} />, color: "#4A8FE7" },
      { id: "llm_processing", label: "LLM Processing", icon: <Cpu size={20} />, color: "#8256D0" },
      { id: "query_parsing", label: "Query Parsing", icon: <Code size={20} />, color: "#5D6D7E" },
      { id: "sensor_selection", label: "Sensor Selection", icon: <Settings size={20} />, color: "#F1C40F" },
      { id: "data_retrieval", label: "Data Retrieval", icon: <Database size={20} />, color: "#27AE60" },
      { id: "data_analysis", label: "Data Analysis", icon: <Cpu size={20} />, color: "#E67E22" },
      { id: "response_generation", label: "Response Generation", icon: <FileText size={20} />, color: "#3498DB" },
      { id: "response_delivery", label: "Response Delivery", icon: <ArrowRight size={20} />, color: "#2ECC71" }
    ],
    transitions: [
      { from: "user_input", to: "llm_processing", label: "Submit Query" },
      { from: "llm_processing", to: "query_parsing", label: "Process Query" },
      { from: "query_parsing", to: "sensor_selection", label: "Identify Required Sensors" },
      { from: "sensor_selection", to: "data_retrieval", label: "Request Data" },
      { from: "data_retrieval", to: "data_analysis", label: "Process Data" },
      { from: "data_analysis", to: "response_generation", label: "Generate Response" },
      { from: "response_generation", to: "response_delivery", label: "Deliver to User" }
    ],
    steps: [
      { id: "user_input", message: "User asks: 'What's the current temperature?'" },
      { id: "llm_processing", message: "LLM agent recognizes weather-related query" },
      { id: "query_parsing", message: "Query parsed: temperature data request" },
      { id: "sensor_selection", message: "Selected BME280 temperature sensor" },
      { id: "data_retrieval", message: "Latest temperature: 72°F from Node #2" },
      { id: "data_analysis", message: "Processing data with historical context" },
      { id: "response_generation", message: "Response drafted: 'The current temperature is 72°F, which is 3 degrees warmer than yesterday at this time.'" },
      { id: "response_delivery", message: "Response delivered to user interface" }
    ]
  }
};

// Hardware BOM data
const hardwareBOM = [
  {
    category: "Central Server",
    items: [
      { id: "hw-1", name: "Raspberry Pi 5", quantity: 1, purpose: "Central coordinator for the entire system", icon: <Server size={16} /> },
      { id: "hw-2", name: "MicroSD Card (32GB+)", quantity: 1, purpose: "Storage for OS and application data", icon: <Database size={16} /> },
      { id: "hw-3", name: "Power Supply (5V/3A USB-C)", quantity: 1, purpose: "Power for Raspberry Pi", icon: <Zap size={16} /> },
      { id: "hw-4", name: "Weatherproof Enclosure", quantity: 1, purpose: "Protect central hardware from elements", icon: <Home size={16} /> }
    ]
  },
  {
    category: "Sensor Nodes",
    items: [
      { id: "hw-5", name: "ESP32 Development Boards", quantity: 4, purpose: "Distributed sensing nodes", icon: <Cpu size={16} /> },
      { id: "hw-6", name: "BME280 Sensors", quantity: 4, purpose: "Temperature, humidity, and pressure sensing", icon: <Thermometer size={16} /> },
      { id: "hw-7", name: "Anemometer", quantity: 1, purpose: "Wind speed measurement", icon: <Wind size={16} /> },
      { id: "hw-8", name: "Wind Vane", quantity: 1, purpose: "Wind direction measurement", icon: <Wind size={16} /> },
      { id: "hw-9", name: "Rain Gauge", quantity: 1, purpose: "Precipitation measurement", icon: <Droplets size={16} /> },
      { id: "hw-10", name: "LDR Sensors", quantity: 4, purpose: "Light level measurement", icon: <Sun size={16} /> },
      { id: "hw-11", name: "Solar Panel Kits", quantity: 4, purpose: "Power for remote sensor nodes", icon: <Zap size={16} /> },
      { id: "hw-12", name: "LiPo Batteries", quantity: 4, purpose: "Energy storage for sensor nodes", icon: <Zap size={16} /> },
      { id: "hw-13", name: "Weatherproof Enclosures", quantity: 4, purpose: "Protect sensor hardware", icon: <Home size={16} /> }
    ]
  },
  {
    category: "Networking",
    items: [
      { id: "hw-14", name: "Outdoor WiFi Access Point", quantity: 1, purpose: "Extend network to backyard", icon: <Wifi size={16} /> },
      { id: "hw-15", name: "Ethernet Cable", quantity: 1, purpose: "Wired connection to main network", icon: <Wifi size={16} /> },
      { id: "hw-16", name: "Weatherproof Cable Conduit", quantity: "20m", purpose: "Protect outdoor cabling", icon: <Home size={16} /> }
    ]
  }
];

// Software BOM data
const softwareBOM = [
  {
    category: "Central Server Software",
    items: [
      { id: "sw-1", name: "Raspberry Pi OS", purpose: "Operating system for central server", icon: <Server size={16} /> },
      { id: "sw-2", name: "Taubytes/Tau ASM", purpose: "Local cloud infrastructure", icon: <Cloud size={16} /> },
      { id: "sw-3", name: "MQTT Broker (Mosquitto)", purpose: "Message broker for device communication", icon: <ArrowRight size={16} /> },
      { id: "sw-4", name: "TimescaleDB", purpose: "Time-series database for sensor data", icon: <Database size={16} /> },
      { id: "sw-5", name: "Flask API Server", purpose: "Backend for the LLM agent interface", icon: <Code size={16} /> }
    ]
  },
  {
    category: "LLM & Integration",
    items: [
      { id: "sw-6", name: "Local LLM Model", purpose: "Process natural language queries", icon: <Cpu size={16} /> },
      { id: "sw-7", name: "llama.cpp", purpose: "Efficient LLM inference", icon: <Cpu size={16} /> },
      { id: "sw-8", name: "LangChain", purpose: "Framework for LLM application", icon: <Code size={16} /> },
      { id: "sw-9", name: "Master Control Program", purpose: "Device orchestration and state management", icon: <Settings size={16} /> }
    ]
  },
  {
    category: "Sensor Node Software",
    items: [
      { id: "sw-10", name: "ESP-IDF Framework", purpose: "Development framework for ESP32", icon: <Code size={16} /> },
      { id: "sw-11", name: "Sensor Libraries", purpose: "Interface with physical sensors", icon: <Code size={16} /> },
      { id: "sw-12", name: "MQTT Client", purpose: "Communication with central server", icon: <ArrowRight size={16} /> },
      { id: "sw-13", name: "Power Management Code", purpose: "Optimize battery usage", icon: <Zap size={16} /> }
    ]
  },
  {
    category: "Frontend Interface",
    items: [
      { id: "sw-14", name: "React Web App", purpose: "User interface for system monitoring and control", icon: <Code size={16} /> },
      { id: "sw-15", name: "Grafana Dashboard", purpose: "Data visualization", icon: <Database size={16} /> },
      { id: "sw-16", name: "Voice Assistant Interface", purpose: "Audio interface for natural interaction", icon: <FileText size={16} /> }
    ]
  }
];

// Implementation steps
const implementationSteps = [
  {
    phase: "Setup & Infrastructure",
    steps: [
      { id: "impl-1", name: "Install Raspberry Pi OS on MicroSD", completed: false, icon: <Server size={16} /> },
      { id: "impl-2", name: "Configure network settings and SSH", completed: false, icon: <Wifi size={16} /> },
      { id: "impl-3", name: "Install Taubytes/Tau ASM framework", completed: false, icon: <Cloud size={16} /> },
      { id: "impl-4", name: "Set up MQTT broker and configure security", completed: false, icon: <ArrowRight size={16} /> },
      { id: "impl-5", name: "Install and configure TimescaleDB", completed: false, icon: <Database size={16} /> }
    ]
  },
  {
    phase: "Sensor Node Development",
    steps: [
      { id: "impl-6", name: "Assemble sensor hardware", completed: false, icon: <Thermometer size={16} /> },
      { id: "impl-7", name: "Flash ESP32 with initial firmware", completed: false, icon: <Cpu size={16} /> },
      { id: "impl-8", name: "Develop sensor reading & transmission code", completed: false, icon: <Code size={16} /> },
      { id: "impl-9", name: "Implement power management optimizations", completed: false, icon: <Zap size={16} /> },
      { id: "impl-10", name: "Test sensor nodes in controlled environment", completed: false, icon: <AlertCircle size={16} /> }
    ]
  },
  {
    phase: "LLM Agent Development",
    steps: [
      { id: "impl-11", name: "Set up local LLM model with llama.cpp", completed: false, icon: <Cpu size={16} /> },
      { id: "impl-12", name: "Develop LangChain integration", completed: false, icon: <Code size={16} /> },
      { id: "impl-13", name: "Create Master Control Program for device orchestration", completed: false, icon: <Settings size={16} /> },
      { id: "impl-14", name: "Implement natural language query parser", completed: false, icon: <FileText size={16} /> },
      { id: "impl-15", name: "Develop response generation system", completed: false, icon: <ArrowRight size={16} /> }
    ]
  },
  {
    phase: "Deployment & Testing",
    steps: [
      { id: "impl-16", name: "Install weatherproof enclosures", completed: false, icon: <Home size={16} /> },
      { id: "impl-17", name: "Deploy sensor nodes in backyard locations", completed: false, icon: <Thermometer size={16} /> },
      { id: "impl-18", name: "Run system integration tests", completed: false, icon: <AlertCircle size={16} /> },
      { id: "impl-19", name: "Calibrate sensors with reference instruments", completed: false, icon: <Settings size={16} /> },
      { id: "impl-20", name: "Perform end-to-end testing with natural language queries", completed: false, icon: <FileText size={16} /> }
    ]
  }
];

// Next steps and recommendations
const nextSteps = [
  { 
    id: "next-1", 
    title: "Advanced Weather Forecasting",
    description: "Integrate with external weather APIs to combine local sensor data with regional forecasts for more accurate predictions.",
    difficulty: "Medium",
    icon: <Cloud size={16} />
  },
  { 
    id: "next-2", 
    title: "Automated Garden Irrigation",
    description: "Expand the system to control irrigation based on soil moisture levels, weather forecasts, and plant-specific needs.",
    difficulty: "Hard",
    icon: <Droplets size={16} />
  },
  { 
    id: "next-3", 
    title: "Solar Output Optimization",
    description: "Add monitoring and predictive analytics for solar panel performance to maximize energy harvesting.",
    difficulty: "Medium",
    icon: <Sun size={16} />
  },
  { 
    id: "next-4", 
    title: "Edge ML for Sensor Fusion",
    description: "Implement machine learning at the edge for more intelligent sensor data processing and fusion.",
    difficulty: "Expert",
    icon: <Cpu size={16} />
  },
  { 
    id: "next-5", 
    title: "Voice-Controlled Outdoor Lighting",
    description: "Extend the system to control outdoor lighting through natural language commands.",
    difficulty: "Easy",
    icon: <Sun size={16} />
  }
];

// Reducer for managing application state
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SCRUBBER_POSITION':
      return { ...state, scrubberPosition: action.payload, currentStep: Math.floor(action.payload * (stateMachines.weatherQuery.steps.length - 1)) };
    case 'SET_SIMULATION_STATE':
      return { ...state, simulationState: action.payload };
    case 'SET_SIMULATION_SPEED':
      return { ...state, simulationSpeed: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload, scrubberPosition: action.payload / (stateMachines.weatherQuery.steps.length - 1) };
    case 'SET_WEATHER_QUERY':
      return { ...state, weatherQuery: action.payload };
    case 'TOGGLE_IMPLEMENTATION_STEP':
      const newImplementationSteps = [...implementationSteps];
      const phaseIndex = newImplementationSteps.findIndex(phase => 
        phase.steps.some(step => step.id === action.payload)
      );
      if (phaseIndex !== -1) {
        const stepIndex = newImplementationSteps[phaseIndex].steps.findIndex(step => 
          step.id === action.payload
        );
        if (stepIndex !== -1) {
          newImplementationSteps[phaseIndex].steps[stepIndex].completed = 
            !newImplementationSteps[phaseIndex].steps[stepIndex].completed;
          return { ...state, implementationSteps: newImplementationSteps };
        }
      }
      return state;
    default:
      return state;
  }
}

// Main application component
const LLMAgentSystemPlanner = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Effect for animation when simulation is running
  useEffect(() => {
    let intervalId;
    if (state.simulationState === 'running') {
      intervalId = setInterval(() => {
        const nextStep = (state.currentStep + 1) % stateMachines.weatherQuery.steps.length;
        if (nextStep === 0) {
          // Reset to start or stop when it reaches the end
          dispatch({ type: 'SET_CURRENT_STEP', payload: 0 });
          dispatch({ type: 'SET_SIMULATION_STATE', payload: 'stopped' });
        } else {
          dispatch({ type: 'SET_CURRENT_STEP', payload: nextStep });
        }
      }, 2000 / state.simulationSpeed);
    }
    return () => clearInterval(intervalId);
  }, [state.simulationState, state.currentStep, state.simulationSpeed]);

  // Get the component based on the active tab
  const ActiveTabComponent = componentRegistry[
    Object.keys(componentRegistry).find(key => 
      key.toLowerCase() === state.activeTab.toLowerCase()
    )
  ] || componentRegistry.Overview;

  return (
    <div className="flex flex-col h-full space-y-4">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>LLM Agent System Project Planner</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Server size={14} />
                <span>Central Server: {state.systemStatus.mcp.status}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Thermometer size={14} />
                <span>Sensors: {state.systemStatus.sensors.status}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Cloud size={14} />
                <span>Local Cloud: {state.systemStatus.local_cloud.status}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Cpu size={14} />
                <span>LLM Agent: {state.systemStatus.llm_agent.status}</span>
              </Badge>
            </div>
          </div>
          <CardDescription>
            Integrate your backyard with an LLM agent system for automated monitoring and interaction
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={state.activeTab} onValueChange={value => dispatch({ type: 'SET_ACTIVE_TAB', payload: value })} className="flex-1">
        <TabsList className="grid grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hardwareBOM">Hardware BOM</TabsTrigger>
          <TabsTrigger value="softwareBOM">Software BOM</TabsTrigger>
          <TabsTrigger value="systemArchitecture">Architecture</TabsTrigger>
          <TabsTrigger value="stateMachines">State Machines</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="conclusion">Conclusion</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewComponent data={{ hardwareBOM, softwareBOM }} />
        </TabsContent>
        <TabsContent value="hardwareBOM" className="mt-4">
          <HardwareBOMComponent data={{ hardwareBOM }} />
        </TabsContent>
        <TabsContent value="softwareBOM" className="mt-4">
          <SoftwareBOMComponent data={{ softwareBOM }} />
        </TabsContent>
        <TabsContent value="systemArchitecture" className="mt-4">
          <SystemArchitectureComponent data={{ hardwareBOM, softwareBOM }} />
        </TabsContent>
        <TabsContent value="stateMachines" className="mt-4">
          <StateMachinesComponent 
            data={{ 
              stateMachines, 
              scrubberPosition: state.scrubberPosition, 
              simulationState: state.simulationState,
              simulationSpeed: state.simulationSpeed,
              currentStep: state.currentStep,
              weatherQuery: state.weatherQuery,
              dispatch
            }} 
          />
        </TabsContent>
        <TabsContent value="implementation" className="mt-4">
          <ImplementationComponent data={{ implementationSteps, dispatch }} />
        </TabsContent>
        <TabsContent value="conclusion" className="mt-4">
          <ConclusionComponent data={{ nextSteps }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Individual tab components
const OverviewComponent = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            This project integrates an LLM agent system with weather monitoring equipment in your backyard,
            using a Master Control Program (MCP) to orchestrate device interactions through a local cloud
            powered by Taubytes/Tau ASM.
          </p>
          <p>
            The system will provide natural language interfaces to query environmental conditions,
            analyze patterns, and potentially control other outdoor systems based on weather data.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Key Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server size={18} className="text-blue-500" />
              <span className="font-medium">Central Coordinator</span>
              <span className="text-sm text-gray-500">Raspberry Pi 5 running Taubytes/Tau ASM</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-green-500" />
              <span className="font-medium">Local LLM Agent</span>
              <span className="text-sm text-gray-500">Process natural language queries</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer size={18} className="text-red-500" />
              <span className="font-medium">Sensor Network</span>
              <span className="text-sm text-gray-500">ESP32-based distributed sensors</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={18} className="text-purple-500" />
              <span className="font-medium">Wireless Connectivity</span>
              <span className="text-sm text-gray-500">Mesh network for sensor communication</span>
            </div>
            <div className="flex items-center gap-2">
              <Database size={18} className="text-yellow-500" />
              <span className="font-medium">Time-Series Database</span>
              <span className="text-sm text-gray-500">TimescaleDB for historical data</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm md:col-span-2">
        <CardHeader>
          <CardTitle>System Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Natural Language Queries
              </h3>
              <p className="text-sm">
                Ask questions about current and historical weather conditions using natural language.
                The system understands context and can provide detailed responses.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Database size={18} className="text-green-500" />
                Historical Analysis
              </h3>
              <p className="text-sm">
                Track weather patterns over time with historical data storage and analysis capabilities.
                Generate trends and insights from your local microclimate.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Settings size={18} className="text-purple-500" />
                Extensible Platform
              </h3>
              <p className="text-sm">
                The system architecture allows for easy expansion to control irrigation systems,
                lighting, or other backyard automation based on weather conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const HardwareBOMComponent = ({ data }) => {
  return (
    <div className="space-y-6">
      {data.hardwareBOM.map((category, index) => (
        <Card key={index} className="shadow-sm">
          <CardHeader>
            <CardTitle>{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Item</th>
                    <th scope="col" className="px-4 py-3">Quantity</th>
                    <th scope="col" className="px-4 py-3">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item) => (
                    <tr key={item.id} className="bg-white border-b">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        {item.icon}
                        {item.name}
                      </td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{item.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const SoftwareBOMComponent = ({ data }) => {
  return (
    <div className="space-y-6">
      {data.softwareBOM.map((category, index) => (
        <Card key={index} className="shadow-sm">
          <CardHeader>
            <CardTitle>{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Software</th>
                    <th scope="col" className="px-4 py-3">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item) => (
                    <tr key={item.id} className="bg-white border-b">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        {item.icon}
                        {item.name}
                      </td>
                      <td className="px-4 py-3">{item.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const SystemArchitectureComponent = ({ data }) => {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>System Architecture Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg flex flex-col items-center">
            <div className="grid grid-cols-3 gap-8 w-full max-w-3xl">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Thermometer size={32} className="text-blue-600" />
                </div>
                <h3 className="font-medium">Sensor Layer</h3>
                <p className="text-xs">ESP32 nodes with environmental sensors</p>
              </div>
              
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-purple-100 p-4 rounded-full">
                  <Cloud size={32} className="text-purple-600" />
                </div>
                <h3 className="font-medium">Edge Cloud Layer</h3>
                <p className="text-xs">Taubytes/Tau ASM local cloud services</p>
              </div>
              
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <Cpu size={32} className="text-green-600" />
                </div>
                <h3 className="font-medium">Application Layer</h3>
                <p className="text-xs">LLM Agent & user interfaces</p>
              </div>
            </div>
            
            <div className="my-6 w-full max-w-3xl flex justify-center">
              <div className="w-3/4 h-2 bg-gray-200 relative">
                {/* Arrows */}
                <div className="absolute -top-3 left-1/4 transform -translate-x-1/2">
                  <div className="w-2 h-8 flex flex-col items-center">
                    <ArrowRight size={16} className="text-gray-500 rotate-90" />
                    <ArrowRight size={16} className="text-gray-500 -rotate-90" />
                  </div>
                </div>
                <div className="absolute -top-3 left-2/4 transform -translate-x-1/2">
                  <div className="w-2 h-8 flex flex-col items-center">
                    <ArrowRight size={16} className="text-gray-500 rotate-90" />
                    <ArrowRight size={16} className="text-gray-500 -rotate-90" />
                  </div>
                </div>
                <div className="absolute -top-3 left-3/4 transform -translate-x-1/2">
                  <div className="w-2 h-8 flex flex-col items-center">
                    <ArrowRight size={16} className="text-gray-500 rotate-90" />
                    <ArrowRight size={16} className="text-gray-500 -rotate-90" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 w-full max-w-3xl">
              <h3 className="font-medium text-center mb-2 flex items-center justify-center gap-2">
                <Settings size={20} className="text-yellow-600" />
                Master Control Program (MCP)
              </h3>
              <p className="text-sm text-center">
                Orchestrates data flow between layers and manages system state
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Data Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="flex items-start gap-2">
                <span className="mt-0.5"><Thermometer size={16} className="text-blue-500" /></span>
                <span>Sensors collect environmental data at configured intervals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5"><ArrowRight size={16} className="text-gray-500" /></span>
                <span>Data is transmitted via MQTT to the central server</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5"><Database size={16} className="text-yellow-500" /></span>
                <span>TimescaleDB stores time-series data for historical analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5"><Cpu size={16} className="text-purple-500" /></span>
                <span>LLM agent processes natural language queries about the data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5"><FileText size={16} className="text-green-500" /></span>
                <span>User receives responses via web interface or voice assistant</span>
              </li>
            </ol>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Key Interfaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded border">
                <h3 className="font-medium flex items-center gap-2">
                  <ArrowRight size={16} className="text-blue-500" />
                  MQTT Topics
                </h3>
                <ul className="text-sm mt-1 space-y-1 pl-6 list-disc">
                  <li><code>sensors/+/temperature</code> - Temperature readings</li>
                  <li><code>sensors/+/humidity</code> - Humidity readings</li>
                  <li><code>sensors/+/pressure</code> - Pressure readings</li>
                  <li><code>sensors/+/wind</code> - Wind data (speed/direction)</li>
                  <li><code>sensors/+/rain</code> - Precipitation data</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <h3 className="font-medium flex items-center gap-2">
                  <ArrowRight size={16} className="text-green-500" />
                  API Endpoints
                </h3>
                <ul className="text-sm mt-1 space-y-1 pl-6 list-disc">
                  <li><code>/api/query</code> - LLM natural language query endpoint</li>
                  <li><code>/api/data/current</code> - Current sensor readings</li>
                  <li><code>/api/data/historical</code> - Historical data query</li>
                  <li><code>/api/system/status</code> - System status information</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <h3 className="font-medium flex items-center gap-2">
                  <ArrowRight size={16} className="text-purple-500" />
                  User Interfaces
                </h3>
                <ul className="text-sm mt-1 space-y-1 pl-6 list-disc">
                  <li>Web dashboard for visualization and queries</li>
                  <li>Mobile app for on-the-go monitoring</li>
                  <li>Voice assistant integration for hands-free interaction</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StateMachinesComponent = ({ data }) => {
  const { stateMachines, scrubberPosition, simulationState, simulationSpeed, currentStep, weatherQuery, dispatch } = data;
  const weatherQueryMachine = stateMachines.weatherQuery;
  const currentNodeId = weatherQueryMachine.steps[currentStep].id;
  
  // Get step text for current state
  const currentStepText = weatherQueryMachine.steps[currentStep].message;
  
  // Find active transition
  const activeTransition = weatherQueryMachine.transitions.find(
    t => t.from === currentNodeId
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Weather Query State Machine</CardTitle>
            <div className="flex items-center gap-2">
              {simulationState === 'running' ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => dispatch({ type: 'SET_SIMULATION_STATE', payload: 'paused' })}
                >
                  <Pause size={16} />
                  <span className="ml-1">Pause</span>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => dispatch({ type: 'SET_SIMULATION_STATE', payload: 'running' })}
                >
                  <Play size={16} />
                  <span className="ml-1">Play</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  dispatch({ type: 'SET_CURRENT_STEP', payload: 0 });
                  dispatch({ type: 'SET_SIMULATION_STATE', payload: 'stopped' });
                }}
              >
                <Repeat size={16} />
                <span className="ml-1">Reset</span>
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs">Speed:</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.5"
                  value={simulationSpeed}
                  onChange={(e) => dispatch({ type: 'SET_SIMULATION_SPEED', payload: parseFloat(e.target.value) })}
                  className="w-20"
                />
                <span className="text-xs">{simulationSpeed}x</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Input 
                  value={weatherQuery}
                  onChange={(e) => dispatch({ type: 'SET_WEATHER_QUERY', payload: e.target.value })}
                  placeholder="Enter a weather-related query..."
                />
              </div>
              <Button variant="outline" onClick={() => {
                dispatch({ type: 'SET_CURRENT_STEP', payload: 0 });
                dispatch({ type: 'SET_SIMULATION_STATE', payload: 'running' });
              }}>
                Process Query
              </Button>
            </div>
            
            {/* Visualization */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between mb-6">
                {weatherQueryMachine.nodes.map((node, idx) => (
                  <div 
                    key={node.id} 
                    className={`
                      flex flex-col items-center transition-all duration-300
                      ${node.id === currentNodeId ? 'scale-110' : 'opacity-60'}
                    `}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                      style={{ 
                        backgroundColor: node.id === currentNodeId ? node.color : '#f3f4f6',
                        color: node.id === currentNodeId ? 'white' : '#4b5563'
                      }}
                    >
                      {node.icon}
                    </div>
                    <span className="text-xs text-center font-medium">{node.label}</span>
                  </div>
                ))}
              </div>
              
              {/* Progress line */}
              <div className="relative h-2 bg-gray-200 rounded-full mb-4">
                <div 
                  className="absolute h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / (weatherQueryMachine.steps.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {/* Scrubber */}
              <Slider
                value={[scrubberPosition * 100]}
                onValueChange={(value) => {
                  dispatch({ type: 'SET_SCRUBBER_POSITION', payload: value[0] / 100 });
                  dispatch({ type: 'SET_SIMULATION_STATE', payload: 'paused' });
                }}
                className="mb-6"
              />
              
              {/* Current state information */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: weatherQueryMachine.nodes.find(n => n.id === currentNodeId)?.color }}
                  >
                    {weatherQueryMachine.nodes.find(n => n.id === currentNodeId)?.icon}
                  </div>
                  <h3 className="font-medium">
                    {weatherQueryMachine.nodes.find(n => n.id === currentNodeId)?.label}
                  </h3>
                  {activeTransition && (
                    <div className="flex items-center ml-auto">
                      <span className="text-xs text-gray-500">Next: {activeTransition.label}</span>
                      <ArrowRight size={14} className="ml-1 text-gray-400" />
                      <span className="text-xs font-medium ml-1">
                        {weatherQueryMachine.nodes.find(n => n.id === activeTransition.to)?.label}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm">{currentStepText}</p>
              </div>
              
              {/* Step indicator */}
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>Step {currentStep + 1} of {weatherQueryMachine.steps.length}</span>
                <span>{Math.round((currentStep / (weatherQueryMachine.steps.length - 1)) * 100)}% Complete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>State Machine Design Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              The weather query state machine follows a standard NLP processing pipeline optimized
              for IoT sensor data retrieval and analysis. Key considerations include:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Query Understanding</h3>
                <p className="text-sm">
                  The LLM processes natural language queries to extract query intent,
                  requested information type, time references, and location specificity.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Sensor Selection</h3>
                <p className="text-sm">
                  Based on the parsed query, the system determines which sensors provide
                  the relevant data, considering sensor health, calibration status, and data freshness.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Data Retrieval Strategy</h3>
                <p className="text-sm">
                  For historical queries, the system accesses TimescaleDB with optimized
                  time-series queries. For real-time data, it prioritizes the most recent readings.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Response Generation</h3>
                <p className="text-sm">
                  The LLM transforms raw data into natural language responses, adding context
                  from historical patterns and comparison to typical conditions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ImplementationComponent = ({ data }) => {
  const { implementationSteps, dispatch } = data;
  
  return (
    <div className="space-y-6">
      {implementationSteps.map((phase, phaseIdx) => (
        <Card key={phaseIdx} className="shadow-sm">
          <CardHeader>
            <CardTitle>Phase {phaseIdx + 1}: {phase.phase}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {phase.steps.map((step, stepIdx) => (
                <div 
                  key={step.id} 
                  className="flex items-center p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-all duration-200"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={step.completed ? "text-green-500" : "text-gray-400"}
                    onClick={() => {}}
                  >
                    {step.completed ? <CheckCircle size={20} /> : <CircleOff size={20} />}
                  </Button>
                  <div className="ml-2">
                    <div className="flex items-center">
                      <span className="font-medium">{stepIdx + 1}. {step.name}</span>
                      {step.icon && <span className="ml-2">{step.icon}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => dispatch({ type: 'TOGGLE_IMPLEMENTATION_STEP', payload: step.id })}
                  >
                    {step.completed ? "Mark Incomplete" : "Mark Complete"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(phase.steps.filter(s => s.completed).length / phase.steps.length) * 100}%` 
                }}
              ></div>
            </div>
            <span className="ml-4 text-sm">
              {phase.steps.filter(s => s.completed).length} of {phase.steps.length} completed
            </span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const ConclusionComponent = ({ data }) => {
  const { nextSteps } = data;
  
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The Backyard LLM Agent System project combines modern edge computing with natural language processing 
            to create an intelligent environmental monitoring system. By deploying distributed sensor nodes
            and integrating them with a local LLM agent through Taubytes/Tau ASM, the system provides
            personalized weather insights and environmental monitoring through conversational interfaces.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              Key Advantages
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-1 text-green-500 flex-shrink-0" />
                <span>Privacy-focused design with on-premises processing</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-1 text-green-500 flex-shrink-0" />
                <span>Customized to your specific backyard microclimate</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-1 text-green-500 flex-shrink-0" />
                <span>Extensible architecture for future integrations</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-1 text-green-500 flex-shrink-0" />
                <span>Natural language interface for accessible interactions</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step) => (
              <div key={step.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    {step.icon}
                    {step.title}
                  </h3>
                  <Badge variant={
                    step.difficulty === "Easy" ? "default" : 
                    step.difficulty === "Medium" ? "secondary" : 
                    step.difficulty === "Hard" ? "destructive" : "outline"
                  }>
                    {step.difficulty}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Technical Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" />
                Power Optimization
              </h3>
              <p className="text-sm">
                Implement more sophisticated sleep cycles for sensor nodes to extend battery life.
                Consider adaptive sampling rates based on environmental conditions and power availability.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Wifi size={16} className="text-blue-500" />
                Enhanced Mesh Networking
              </h3>
              <p className="text-sm">
                Upgrade to a more resilient mesh protocol with self-healing capabilities.
                Consider implementing redundant communication paths for critical data.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Cpu size={16} className="text-purple-500" />
                LLM Model Optimization
              </h3>
              <p className="text-sm">
                Explore quantized models or specialized weather-domain fine-tuning to improve
                response quality while reducing computational requirements.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Timer size={16} className="text-red-500" />
                Predictive Maintenance
              </h3>
              <p className="text-sm">
                Implement sensor drift detection and calibration reminders.
                Add diagnostics to predict hardware failures before they occur.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            This project plan provides a comprehensive foundation for building your backyard LLM agent system.
            By following the implementation steps and considering the suggested improvements, you'll create
            a powerful, personalized environmental monitoring system that integrates seamlessly with your outdoor space.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LLMAgentSystemPlanner;
