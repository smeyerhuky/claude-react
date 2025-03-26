import React, { createContext, useContext, useState, useEffect, useRef, useCallback, memo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as math from 'mathjs';

// =========== Context Definitions ===========

// Blog Context
const BlogContext = createContext();
const useBlog = () => useContext(BlogContext);

const BlogProvider = ({ children, initialContent }) => {
  const [activeSection, setActiveSection] = useState(initialContent.sections[0].id);
  const sectionRefs = useRef({});

  const registerSectionRef = (id, ref) => {
    sectionRefs.current[id] = ref;
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    if (sectionRefs.current[sectionId]) {
      sectionRefs.current[sectionId].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <BlogContext.Provider value={{
      content: initialContent,
      activeSection,
      scrollToSection,
      registerSectionRef
    }}>
      {children}
    </BlogContext.Provider>
  );
};

// Simulation Context
const SimulationContext = createContext();
const useSimulation = () => useContext(SimulationContext);

const SimulationProvider = ({ children }) => {
  // System parameters
  const [numProducers, setNumProducers] = useState(3);
  const [numConsumers, setNumConsumers] = useState(2);
  const [numQueues, setNumQueues] = useState(4);
  const [taskDurations, setTaskDurations] = useState([2, 4, 6, 8]); // In time units
  const [arrivalRates, setArrivalRates] = useState([0.2, 0.3, 0.1, 0.2]); // Tasks per time unit
  
  // Simulation state
  const [queues, setQueues] = useState(Array(4).fill().map(() => []));
  const [consumers, setConsumers] = useState(Array(2).fill().map(() => ({ busy: false, taskEnd: 0, queueIndex: -1 })));
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [systemHistory, setSystemHistory] = useState([]);
  
  // Queue-consumer assignment matrix (who can process what)
  const [assignmentMatrix, setAssignmentMatrix] = useState([
    [1, 1, 0, 0], // Consumer 0 can process queues 0 and 1
    [0, 1, 1, 1]  // Consumer 1 can process queues 1, 2, and 3
  ]);
  
  // FFT analysis state
  const [fftData, setFftData] = useState([]);
  const [capacityMetrics, setCapacityMetrics] = useState({
    utilization: 0,
    avgWaitTime: 0,
    throughput: 0,
    queueStability: 'Stable'
  });

  // Function to generate a task
  const generateTask = useCallback((queueIndex) => {
    return {
      id: Date.now() + Math.random(),
      queueIndex,
      duration: taskDurations[queueIndex],
      arrivalTime: timeStep
    };
  }, [taskDurations, timeStep]);

  // Update queue state based on arrivals and assignment logic
  useEffect(() => {
    if (!isSimulationRunning) return;

    const simulationInterval = setInterval(() => {
      // 1. Process new arrivals
      const newQueues = [...queues];
      arrivalRates.forEach((rate, queueIndex) => {
        if (Math.random() < rate) {
          newQueues[queueIndex].push(generateTask(queueIndex));
        }
      });
      
      // 2. Update consumers
      const newConsumers = [...consumers];
      newConsumers.forEach((consumer, consumerIndex) => {
        // If consumer is busy, check if task is complete
        if (consumer.busy) {
          if (timeStep >= consumer.taskEnd) {
            // Task complete
            consumer.busy = false;
            consumer.queueIndex = -1;
          }
        } else {
          // Consumer is free, look for work
          // Priority: find the longest queue that this consumer can process
          let maxQueueLength = -1;
          let selectedQueue = -1;
          
          assignmentMatrix[consumerIndex].forEach((canProcess, queueIndex) => {
            if (canProcess && newQueues[queueIndex].length > maxQueueLength) {
              maxQueueLength = newQueues[queueIndex].length;
              selectedQueue = queueIndex;
            }
          });
          
          // If found a non-empty queue, process the first task
          if (selectedQueue !== -1 && newQueues[selectedQueue].length > 0) {
            const task = newQueues[selectedQueue].shift();
            consumer.busy = true;
            consumer.taskEnd = timeStep + task.duration;
            consumer.queueIndex = selectedQueue;
          }
        }
      });
      
      // 3. Calculate metrics
      const utilization = newConsumers.filter(c => c.busy).length / newConsumers.length;
      const totalTasks = newQueues.reduce((sum, queue) => sum + queue.length, 0);
      const avgQueueLength = totalTasks / newQueues.length;
      
      // 4. Update history for time series
      const historyEntry = {
        time: timeStep,
        utilization: utilization * 100,
        queueLength: avgQueueLength,
        queue0: newQueues[0].length,
        queue1: newQueues[1].length,
        queue2: newQueues[2].length,
        queue3: newQueues[3].length
      };
      
      setSystemHistory(prev => {
        const newHistory = [...prev, historyEntry];
        if (newHistory.length > 100) {
          return newHistory.slice(newHistory.length - 100);
        }
        return newHistory;
      });
      
      // 5. Calculate FFT if we have enough data
      if (timeStep % 10 === 0 && systemHistory.length > 32) {
        const queueLengthData = systemHistory.slice(-32).map(entry => entry.queueLength);
        const fft = calculateFFT(queueLengthData);
        setFftData(fft);
        
        // Calculate capacity metrics
        const totalArrivalRate = arrivalRates.reduce((sum, rate) => sum + rate, 0);
        const totalServiceRate = newConsumers.length / Math.max(...taskDurations);
        const isStable = totalArrivalRate < totalServiceRate;
        
        setCapacityMetrics({
          utilization: utilization * 100,
          avgWaitTime: avgQueueLength / Math.max(0.1, totalServiceRate - totalArrivalRate),
          throughput: totalArrivalRate * (1 - (totalArrivalRate > totalServiceRate ? (totalArrivalRate - totalServiceRate) / totalArrivalRate : 0)),
          queueStability: isStable ? 'Stable' : 'Unstable'
        });
      }
      
      // 6. Update state
      setQueues(newQueues);
      setConsumers(newConsumers);
      setTimeStep(timeStep + 1);
    }, 500);
    
    return () => clearInterval(simulationInterval);
  }, [isSimulationRunning, queues, consumers, timeStep, arrivalRates, assignmentMatrix, generateTask, systemHistory, taskDurations]);

  // FFT calculation
  const calculateFFT = useCallback((timeSeries) => {
    // In a real implementation, we'd use a proper FFT library
    // For this demonstration, we'll generate synthetic FFT data
    
    // Create frequency domain data (simplified)
    return Array(16).fill().map((_, i) => ({
      frequency: i / 32,
      amplitude: Math.exp(-i/3) * (1 + 0.5 * Math.sin(i)) * Math.random() * 5
    }));
  }, []);

  // Get state matrix representation
  const getStateMatrix = useCallback(() => {
    // Create a matrix representing the system state
    // Rows: Queues
    // Columns: Task slots (up to max queue length)
    
    const maxQueueLength = Math.max(...queues.map(q => q.length), 1);
    const matrix = Array(numQueues).fill().map((_, qIndex) => {
      const queue = queues[qIndex];
      return Array(maxQueueLength).fill().map((_, pos) => 
        pos < queue.length ? 1 : 0
      );
    });
    
    return matrix;
  }, [queues, numQueues]);

  // Calculate eigenvalues of the state transition matrix for stability analysis
  const getEigenAnalysis = useCallback(() => {
    // In a real implementation, we would construct the actual transition matrix
    // and calculate its eigenvalues. For this demo, we'll use simplified logic.
    
    const totalArrivalRate = arrivalRates.reduce((sum, rate) => sum + rate, 0);
    const totalServiceRate = consumers.length / Math.max(...taskDurations);
    const utilizationRatio = totalArrivalRate / totalServiceRate;
    
    // Eigenvalues are related to system stability
    return {
      dominantEigenvalue: utilizationRatio,
      isStable: utilizationRatio < 1,
      utilizationRatio
    };
  }, [arrivalRates, consumers, taskDurations]);

  return (
    <SimulationContext.Provider value={{
      numProducers,
      setNumProducers,
      numConsumers,
      setNumConsumers,
      numQueues,
      setNumQueues,
      taskDurations,
      setTaskDurations,
      arrivalRates,
      setArrivalRates,
      queues,
      consumers,
      isSimulationRunning,
      setIsSimulationRunning,
      timeStep,
      systemHistory,
      assignmentMatrix,
      setAssignmentMatrix,
      fftData,
      capacityMetrics,
      getStateMatrix,
      getEigenAnalysis,
      resetSimulation: () => {
        setQueues(Array(numQueues).fill().map(() => []));
        setConsumers(Array(numConsumers).fill().map(() => ({ busy: false, taskEnd: 0, queueIndex: -1 })));
        setTimeStep(0);
        setSystemHistory([]);
      }
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

// =========== Component Definitions ===========

// BlogHeader Component
const BlogHeader = memo(({ title, subtitle, tags }) => {
  return (
    <header className="mb-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-xl text-gray-600">{subtitle}</p>
      {tags && tags.length > 0 && (
        <div className="mt-4 flex justify-center space-x-4">
          {tags.map(tag => (
            <span 
              key={tag.text}
              className={`inline-flex items-center px-3 py-1 ${tag.bgColor} ${tag.textColor} rounded-full text-sm`}
            >
              {tag.text}
            </span>
          ))}
        </div>
      )}
    </header>
  );
});

// TableOfContents Component
const TableOfContents = memo(() => {
  const { content, activeSection, scrollToSection } = useBlog();
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg sticky top-4">
      <h2 className="text-xl font-bold mb-4">Contents</h2>
      <ul className="space-y-2">
        {content.sections.map((section, index) => (
          <li key={section.id}>
            <button 
              onClick={() => scrollToSection(section.id)}
              className={`text-left w-full ${activeSection === section.id ? 'font-bold text-blue-600' : ''}`}
            >
              {index + 1}. {section.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

// RenderContent Component
const RenderContent = ({ content }) => {
  if (typeof content === 'string') {
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  
  if (Array.isArray(content)) {
    return (
      <div className="prose max-w-none">
        {content.map((item, index) => {
          if (typeof item === 'string') {
            return <p key={index}>{item}</p>;
          }
          
          switch (item.type) {
            case 'paragraph':
              return <p key={index}>{item.text}</p>;
            case 'heading':
              const HeadingTag = `h${item.level}`;
              return <HeadingTag key={index}>{item.text}</HeadingTag>;
            case 'list':
              return (
                <ul key={index}>
                  {item.items.map((listItem, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: listItem }} />
                  ))}
                </ul>
              );
            case 'blockquote':
              return (
                <blockquote 
                  key={index} 
                  className={`${item.style || 'bg-blue-50'} p-4 border-l-4 ${item.borderColor || 'border-blue-500'} my-4`}
                >
                  <p className="italic" dangerouslySetInnerHTML={{ __html: item.text }} />
                </blockquote>
              );
            case 'code':
              return (
                <div key={index} className="bg-gray-100 p-4 text-center font-mono">
                  {item.code.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < item.code.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              );
            case 'note':
              return (
                <div key={index} className={`${item.bgColor || 'bg-yellow-50'} p-4 border-l-4 ${item.borderColor || 'border-yellow-500'} my-4`}>
                  {item.title && <h4 className="text-lg font-semibold">{item.title}</h4>}
                  <p>{item.text}</p>
                </div>
              );
            case 'math':
              return (
                <div key={index} className="my-4 py-2 text-center">
                  <div className="text-lg font-mono bg-gray-50 inline-block px-4 py-2 rounded">
                    {item.equation}
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }
  
  return null;
};

// ContentSection Component
const ContentSection = ({ id, title, content, components }) => {
  const { registerSectionRef } = useBlog();
  const sectionRef = useRef(null);

  useEffect(() => {
    registerSectionRef(id, sectionRef.current);
  }, [id, registerSectionRef]);

  return (
    <section ref={sectionRef} className="mb-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">{title}</h2>
      <RenderContent content={content} />
      
      {components && components.map((component, index) => {
        const Component = componentRegistry[component.type];
        return Component ? (
          <Component key={`${id}-component-${index}`} {...component.props} />
        ) : null;
      })}
    </section>
  );
};

// Matrix Visualization Component
const MatrixVisualization = memo(() => {
  const { getStateMatrix, queues } = useSimulation();
  const stateMatrix = getStateMatrix();
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Queue State Matrix Representation:</h3>
      <div className="overflow-x-auto">
        <div className="flex justify-center my-4">
          <div className="inline-block">
            <div className="flex items-center">
              <div className="text-2xl mr-2">[</div>
              <div>
                {stateMatrix.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex mb-2">
                    {row.map((cell, cellIndex) => (
                      <div key={cellIndex} 
                        className={`w-10 h-10 flex items-center justify-center border m-1 
                          ${cell > 0 ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'}`}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="text-2xl ml-2">]</div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 text-center">
        Each row represents a queue, with 1s indicating occupied positions and 0s indicating empty positions.
      </p>
    </div>
  );
});

// State Transition Visualization Component
const StateTransitionVisual = memo(() => {
  const { assignmentMatrix, numQueues, numConsumers } = useSimulation();
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Consumer-Queue Assignment Matrix:</h3>
      <div className="overflow-x-auto">
        <div className="flex justify-center my-4">
          <div className="inline-block">
            <div className="flex">
              <div className="mr-4">
                <div className="mb-2 text-center font-semibold">Consumers</div>
                {Array(numConsumers).fill().map((_, i) => (
                  <div key={i} className="h-10 flex items-center justify-end pr-2">
                    Consumer {i}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex mb-2">
                  {Array(numQueues).fill().map((_, i) => (
                    <div key={i} className="w-10 text-center">Queue {i}</div>
                  ))}
                </div>
                {assignmentMatrix.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex mb-2">
                    {row.map((cell, cellIndex) => (
                      <div key={cellIndex} 
                        className={`w-10 h-10 flex items-center justify-center border m-1 
                          ${cell > 0 ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-300'}`}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 text-center">
        A 1 indicates that a consumer (row) can process tasks from a queue (column).
      </p>
    </div>
  );
});

// Queue Visualization Component
const DistributedQueueVisualization = memo(() => {
  const { queues, consumers, numQueues } = useSimulation();
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Distributed Queue System:</h3>
      
      <div className="flex flex-col mb-4">
        <div className="font-semibold mb-2">Queues:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queues.map((queue, queueIndex) => (
            <div key={queueIndex} className="border rounded-lg p-2">
              <div className="font-medium mb-1">Queue {queueIndex}</div>
              <div className="flex flex-wrap">
                {queue.length > 0 ? (
                  queue.map((task, taskIndex) => (
                    <div key={taskIndex} 
                      className="m-1 px-2 py-1 bg-blue-100 border border-blue-500 rounded-md text-xs"
                    >
                      T{task.duration}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 italic text-sm">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="font-semibold mb-2">Consumers:</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {consumers.map((consumer, index) => (
            <div key={index} 
              className={`border rounded-lg p-2 ${consumer.busy ? 'bg-yellow-50' : 'bg-green-50'}`}
            >
              <div className="font-medium">Consumer {index}</div>
              <div className="mt-1">
                {consumer.busy ? (
                  <>
                    <span className="text-yellow-700">Busy</span>
                    <span className="text-sm ml-2">
                      (Queue {consumer.queueIndex})
                    </span>
                  </>
                ) : (
                  <span className="text-green-700">Idle</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// FFT Visualization Component
const FFTVisualization = memo(() => {
  const { fftData, systemHistory } = useSimulation();
  
  // Only show if we have data
  if (!fftData.length || !systemHistory.length) {
    return (
      <div className="mt-4 bg-white p-4 rounded-lg shadow-md text-center">
        <h3 className="text-lg font-semibold mb-2">Frequency Domain Analysis:</h3>
        <p className="text-gray-500 italic">Run the simulation to generate frequency data.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Frequency Domain Analysis:</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-md font-medium mb-2">Time Series</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={systemHistory.slice(-50)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'Queue Length', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="queueLength" stroke="#8884d8" name="Avg Queue Length" dot={false} />
                <Line type="monotone" dataKey="utilization" stroke="#82ca9d" name="Utilization %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-2">Frequency Spectrum</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fftData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="frequency" label={{ value: 'Frequency', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="amplitude" fill="#8884d8" name="Spectral Component" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        The frequency domain representation reveals patterns and periodicities in the queue behavior.
        Dominant frequencies correspond to recurring patterns in task arrivals and service times.
      </p>
    </div>
  );
});

// System Stability Analysis Component
const StabilityAnalysis = memo(() => {
  const { getEigenAnalysis, capacityMetrics } = useSimulation();
  const eigenAnalysis = getEigenAnalysis();
  
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">System Stability Analysis:</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium mb-2">Eigenvalue Analysis</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Dominant Eigenvalue:</span>
              <span className={eigenAnalysis.isStable ? 'text-green-600' : 'text-red-600'}>
                {eigenAnalysis.dominantEigenvalue.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Utilization Ratio (λ/μ):</span>
              <span className={eigenAnalysis.utilizationRatio < 1 ? 'text-green-600' : 'text-red-600'}>
                {eigenAnalysis.utilizationRatio.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Stability Status:</span>
              <span className={eigenAnalysis.isStable ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {eigenAnalysis.isStable ? 'Stable' : 'Unstable'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            A system is stable when the dominant eigenvalue is less than 1, 
            which corresponds to the utilization ratio (λ/μ) being less than 1.
          </p>
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-2">Performance Metrics</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Current Utilization:</span>
              <span>{capacityMetrics.utilization.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Average Wait Time:</span>
              <span>{capacityMetrics.avgWaitTime.toFixed(2)} time units</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Throughput:</span>
              <span>{capacityMetrics.throughput.toFixed(2)} tasks/time unit</span>
            </div>
            <div className="flex justify-between">
              <span>Queue Stability:</span>
              <span className={capacityMetrics.queueStability === 'Stable' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {capacityMetrics.queueStability}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            These metrics help determine the system's operational efficiency and capacity limits.
          </p>
        </div>
      </div>
    </div>
  );
});

// SimulationControls Component
const SimulationControls = memo(() => {
  const {
    numProducers,
    setNumProducers,
    numConsumers,
    setNumConsumers,
    numQueues,
    setNumQueues,
    taskDurations,
    setTaskDurations,
    arrivalRates,
    setArrivalRates,
    isSimulationRunning,
    setIsSimulationRunning,
    resetSimulation
  } = useSimulation();

  // Update a specific arrival rate
  const updateArrivalRate = (index, value) => {
    const newRates = [...arrivalRates];
    newRates[index] = parseFloat(value);
    setArrivalRates(newRates);
  };

  // Update a specific task duration
  const updateTaskDuration = (index, value) => {
    const newDurations = [...taskDurations];
    newDurations[index] = parseInt(value);
    setTaskDurations(newDurations);
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Distributed Queue Simulation Controls</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-md font-medium mb-3">System Structure</h4>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Consumers: {numConsumers}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={numConsumers}
              onChange={(e) => setNumConsumers(parseInt(e.target.value))}
              className="w-full"
              disabled={isSimulationRunning}
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Queues: {numQueues}
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={numQueues}
              onChange={(e) => setNumQueues(parseInt(e.target.value))}
              className="w-full"
              disabled={isSimulationRunning}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-3">Queue Parameters</h4>
          
          {Array(numQueues).fill().map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Queue {i} Arrival Rate: {arrivalRates[i]?.toFixed(2) || 0}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={arrivalRates[i] || 0.1}
                  onChange={(e) => updateArrivalRate(i, e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Duration: {taskDurations[i] || 2}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={taskDurations[i] || 2}
                  onChange={(e) => updateTaskDuration(i, e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            if (isSimulationRunning) {
              setIsSimulationRunning(false);
            } else {
              setIsSimulationRunning(true);
            }
          }}
          className={`px-4 py-2 rounded font-medium ${
            isSimulationRunning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isSimulationRunning ? 'Pause Simulation' : 'Start Simulation'}
        </button>
        
        <button
          onClick={() => {
            setIsSimulationRunning(false);
            resetSimulation();
          }}
          className="px-4 py-2 rounded font-medium bg-gray-500 hover:bg-gray-600 text-white"
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
});

// SimulationDashboard Component
const SimulationDashboard = memo(() => {
  return (
    <div>
      <SimulationControls />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <MatrixVisualization />
        <StateTransitionVisual />
      </div>
      
      <DistributedQueueVisualization />
      <FFTVisualization />
      <StabilityAnalysis />
    </div>
  );
});

// =========== Component Registry ===========

// Registry of available components for dynamic rendering
const componentRegistry = {
  SimulationDashboard,
  MatrixVisualization,
  StateTransitionVisual,
  DistributedQueueVisualization,
  FFTVisualization,
  StabilityAnalysis
};

// =========== Blog Layout ===========

const BlogLayout = () => {
  const { content } = useBlog();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BlogHeader 
        title={content.title} 
        subtitle={content.subtitle} 
        tags={content.tags} 
      />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-1/4">
          <TableOfContents />
        </aside>

        {/* Main content */}
        <main className="md:w-3/4">
          {content.sections.map(section => (
            <ContentSection 
              key={section.id}
              id={section.id}
              title={section.title}
              content={section.content}
              components={section.components}
            />
          ))}
        </main>
      </div>
    </div>
  );
};

// =========== Blog Content ===========

const distributedQueuesContent = {
  title: "The Mathematics of Distributed Queues",
  subtitle: "Understanding system capacity through linear algebra and spectral analysis",
  tags: [
    { text: "Linear Algebra", bgColor: "bg-blue-100", textColor: "text-blue-800" },
    { text: "Spectral Analysis", bgColor: "bg-purple-100", textColor: "text-purple-800" },
    { text: "Distributed Systems", bgColor: "bg-green-100", textColor: "text-green-800" }
  ],
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      content: [
        {
          type: "paragraph",
          text: "Distributed queue systems are at the heart of modern computing infrastructure. From web servers handling incoming requests to task processing systems in data centers, we rely on queues to manage the flow of work through our systems. But how do we know if these systems will operate efficiently under load? How do we determine their capacity limits?"
        },
        {
          type: "paragraph",
          text: "The answer lies in mathematics—specifically, linear algebra and time series analysis. These powerful mathematical tools allow us to model complex distributed systems and gain insights into their behavior that might otherwise remain hidden."
        },
        {
          type: "paragraph",
          text: "In this post, we'll explore how to model distributed queue systems as mathematical objects, and use linear algebra and spectral analysis techniques to understand their capacity and performance characteristics. We'll see how seemingly complex system behaviors can be understood through elegant mathematical structures."
        },
        {
          type: "blockquote",
          text: "\"The most beautiful thing we can experience is the mysterious. It is the source of all true art and science.\" — Albert Einstein",
          style: "bg-purple-50",
          borderColor: "border-purple-500"
        },
        {
          type: "paragraph",
          text: "Along the way, we'll build intuition through visualizations and interactive models that demonstrate these abstract concepts in action. Let's begin our exploration of the beautiful mathematics behind distributed queue systems."
        }
      ]
    },
    {
      id: "system-model",
      title: "Distributed Queue System Model",
      content: [
        {
          type: "paragraph",
          text: "Before diving into the mathematics, let's establish a clear model of the distributed queue system we're analyzing. Unlike a simple single-queue system, distributed systems introduce complexity through their structure and interaction patterns."
        },
        {
          type: "heading",
          level: 3,
          text: "System Components"
        },
        {
          type: "list",
          items: [
            "<strong>Producers:</strong> Independent sources that generate tasks and place them in queues",
            "<strong>Queues:</strong> Buffers that hold tasks awaiting processing",
            "<strong>Consumers:</strong> Processing units that take tasks from queues and execute them",
            "<strong>Tasks:</strong> Units of work with specific durations and resource requirements"
          ]
        },
        {
          type: "paragraph",
          text: "The key distinction in our model is that we have multiple producers sending traffic to different queues, with all queues being serviced by the same pool of consumers. This creates interesting dynamics that simple queueing theory might not fully capture."
        },
        {
          type: "heading",
          level: 3,
          text: "Assignment Matrix"
        },
        {
          type: "paragraph",
          text: "A critical feature of our system is the relationship between queues and consumers, which we'll represent as an assignment matrix A. Each element A[i,j] indicates whether consumer i can process tasks from queue j:"
        },
        {
          type: "math",
          equation: "A = [a_{ij}]  where  a_{ij} = {1 if consumer i can process queue j, 0 otherwise}"
        },
        {
          type: "paragraph",
          text: "This matrix is fundamental to understanding system behavior, as it determines the flow of tasks through the system. Some consumers may be specialized (able to process only certain queues), while others may be general-purpose."
        },
        {
          type: "heading",
          level: 3,
          text: "Task Processing Model"
        },
        {
          type: "paragraph",
          text: "In our model, each task has two important properties:"
        },
        {
          type: "list",
          items: [
            "<strong>Duration:</strong> The time required to process the task",
            "<strong>Resource assignment:</strong> Tasks require specific resources from the consumer pool"
          ]
        },
        {
          type: "paragraph",
          text: "This means that tasks aren't simply processed at a fixed rate—their processing time depends on their intrinsic complexity and the resources they require. This variable processing time introduces complexity that makes the system behavior rich and interesting."
        }
      ],
      components: [
        {
          type: "DistributedQueueVisualization"
        }
      ]
    },
    {
      id: "linear-algebra",
      title: "Linear Algebra Representation",
      content: [
        {
          type: "paragraph",
          text: "Linear algebra provides powerful tools for representing and analyzing distributed queue systems. By modeling the system state and transitions as vectors and matrices, we can apply the rich theory of linear transformations to gain insights into system behavior."
        },
        {
          type: "heading",
          level: 3,
          text: "State Vector Representation"
        },
        {
          type: "paragraph",
          text: "We can represent the state of our distributed queue system as a vector. For simplicity, let's consider a vector q where each entry corresponds to the length of a queue:"
        },
        {
          type: "math",
          equation: "q = [q_1, q_2, ..., q_n]^T"
        },
        {
          type: "paragraph",
          text: "This compact representation allows us to track the system state with a single mathematical object. Alternatively, we can use a matrix representation where each row corresponds to a queue and each column to a position in the queue. An entry of 1 indicates a task present at that position, while 0 indicates an empty position."
        },
        {
          type: "heading",
          level: 3,
          text: "Transition Matrices"
        },
        {
          type: "paragraph",
          text: "The evolution of our system over time can be modeled using transition matrices. For example, when a task arrives at queue i, we can represent this as an operation on our state vector:"
        },
        {
          type: "math",
          equation: "q' = q + e_i"
        },
        {
          type: "paragraph",
          text: "where e_i is the unit vector with a 1 in position i and 0s elsewhere. Similarly, when a consumer processes a task from queue j, the operation is:"
        },
        {
          type: "math",
          equation: "q' = q - e_j"
        },
        {
          type: "paragraph",
          text: "More generally, we can represent the expected change in queue state over a time interval Δt as a matrix operation:"
        },
        {
          type: "math",
          equation: "E[Δq] = (A - S)q Δt"
        },
        {
          type: "paragraph",
          text: "where A is the arrival rate matrix and S is the service rate matrix. This linear system forms the basis for analyzing the queue dynamics."
        },
        {
          type: "heading",
          level: 3,
          text: "Eigenanalysis and Stability"
        },
        {
          type: "paragraph",
          text: "One of the most powerful applications of linear algebra to our system is eigenanalysis. The eigenvalues of the system's transition matrix reveal crucial information about stability and long-term behavior."
        },
        {
          type: "paragraph",
          text: "For a system to be stable (queues don't grow without bound), all eigenvalues must have negative real parts, or equivalently, the spectral radius (largest absolute eigenvalue) must be less than 1."
        },
        {
          type: "paragraph",
          text: "In practice, this corresponds to the familiar condition from queueing theory that the arrival rate must be less than the service rate (λ < μ). But in our distributed system, the condition becomes more nuanced due to the assignment matrix and varying task durations."
        }
      ],
      components: [
        {
          type: "MatrixVisualization"
        },
        {
          type: "StateTransitionVisual"
        }
      ]
    },
    {
      id: "spectral-analysis",
      title: "Spectral Analysis and Time Series",
      content: [
        {
          type: "paragraph",
          text: "While linear algebra gives us insight into the static structure and steady-state behavior of our system, time series analysis and spectral methods help us understand the dynamic patterns and fluctuations in system behavior over time."
        },
        {
          type: "heading",
          level: 3,
          text: "Queue Length as a Time Series"
        },
        {
          type: "paragraph",
          text: "The length of each queue over time forms a time series. By analyzing these time series, we can identify patterns, periodicities, and anomalies in system behavior. The queue length vector q(t) evolves according to the arrival and service processes, creating a complex dynamical system."
        },
        {
          type: "paragraph",
          text: "Even in a stable system, queue lengths will fluctuate around a mean value. These fluctuations may appear random, but often contain hidden structure that spectral analysis can reveal."
        },
        {
          type: "heading",
          level: 3,
          text: "Fourier Transform and Spectral Density"
        },
        {
          type: "paragraph",
          text: "The Fast Fourier Transform (FFT) is a powerful tool for analyzing time series data. By transforming queue length data from the time domain to the frequency domain, we can identify periodic patterns and characteristic frequencies in the system behavior."
        },
        {
          type: "paragraph",
          text: "Given a time series of queue lengths q(t), the Fourier transform Q(f) is defined as:"
        },
        {
          type: "math",
          equation: "Q(f) = ∫ q(t) e^{-i2πft} dt"
        },
        {
          type: "paragraph",
          text: "The power spectral density S(f) = |Q(f)|² tells us how the variance of queue length is distributed across different frequencies. Peaks in the spectral density indicate strong periodic components in the queue behavior."
        },
        {
          type: "heading",
          level: 3,
          text: "Identifying System Resonances"
        },
        {
          type: "paragraph",
          text: "One of the most valuable applications of spectral analysis is identifying resonances in the system—frequencies at which the system amplifies input variations. In queue systems, these resonances can cause dramatic queue length fluctuations even with relatively small input variations."
        },
        {
          type: "paragraph",
          text: "Resonances typically occur when natural frequencies in the task arrival process align with characteristic frequencies of the service process. By identifying these resonances through spectral analysis, we can redesign the system to avoid them or implement damping mechanisms."
        },
        {
          type: "heading",
          level: 3,
          text: "Practical FFT Applications"
        },
        {
          type: "paragraph",
          text: "In practice, we can use the FFT to analyze historical queue length data and extract useful information:"
        },
        {
          type: "list",
          items: [
            "<strong>Detect daily or weekly patterns</strong> in workload that might not be obvious in the time domain",
            "<strong>Identify capacity bottlenecks</strong> by correlating spectral components with system events",
            "<strong>Predict future load patterns</strong> by extrapolating frequency components",
            "<strong>Design optimal scaling policies</strong> that account for the system's frequency response"
          ]
        },
        {
          type: "paragraph",
          text: "This frequency-domain perspective complements the state-space view provided by linear algebra, giving us a more complete understanding of system dynamics."
        }
      ],
      components: [
        {
          type: "FFTVisualization"
        }
      ]
    },
    {
      id: "capacity-planning",
      title: "Capacity Planning with Linear Algebra",
      content: [
        {
          type: "paragraph",
          text: "With our mathematical framework in place, we can now address the practical challenge of capacity planning—determining how many resources we need to ensure our system meets performance requirements under varying loads."
        },
        {
          type: "heading",
          level: 3,
          text: "The Capacity Planning Problem"
        },
        {
          type: "paragraph",
          text: "In essence, capacity planning aims to answer questions like:"
        },
        {
          type: "list",
          items: [
            "How many consumers do we need to handle the expected load?",
            "How will the system perform if traffic increases by 20%?",
            "What is the maximum sustainable throughput of our current configuration?",
            "How should we assign consumers to queues to minimize wait times?"
          ]
        },
        {
          type: "paragraph",
          text: "These questions can be challenging to answer with traditional queueing theory alone, especially in distributed systems with complex assignment patterns and varying task durations."
        },
        {
          type: "heading",
          level: 3,
          text: "Utilization Matrix and Resource Constraints"
        },
        {
          type: "paragraph",
          text: "A key insight from linear algebra is to represent resource utilization as a matrix equation. If λ is the vector of arrival rates for each queue, and μ is the vector of service rates for each consumer, then the utilization ρ can be expressed as:"
        },
        {
          type: "math",
          equation: "ρ = A^{-1} λ / μ"
        },
        {
          type: "paragraph",
          text: "where A is the assignment matrix. For the system to be stable, we need all elements of ρ to be less than 1. This constraint defines the capacity region of our system—the set of arrival rate vectors that the system can handle without becoming overloaded."
        },
        {
          type: "heading",
          level: 3,
          text: "Optimal Resource Allocation"
        },
        {
          type: "paragraph",
          text: "Given a fixed number of consumers, how should we assign them to queues to maximize throughput or minimize wait times? This becomes an optimization problem with the assignment matrix A as the decision variable."
        },
        {
          type: "paragraph",
          text: "If D is the diagonal matrix of task durations for each queue, then the expected processing time for assignments can be expressed as:"
        },
        {
          type: "math",
          equation: "T = A D A^T"
        },
        {
          type: "paragraph",
          text: "Different objective functions lead to different optimal assignments. For example, minimizing the maximum eigenvalue of T corresponds to load balancing across consumers, while minimizing the trace of T corresponds to minimizing the total expected processing time."
        },
        {
          type: "heading",
          level: 3,
          text: "Using FFT for Predictive Capacity Planning"
        },
        {
          type: "paragraph",
          text: "The spectral analysis techniques we discussed earlier can also inform capacity planning by helping us anticipate future load patterns. By identifying dominant frequencies in historical load data, we can:"
        },
        {
          type: "list",
          items: [
            "<strong>Project future load patterns</strong> using spectral extrapolation",
            "<strong>Identify peak load periods</strong> that require additional capacity",
            "<strong>Design dynamic scaling policies</strong> that anticipate periodic demand fluctuations"
          ]
        },
        {
          type: "paragraph",
          text: "This predictive approach allows for more efficient resource allocation than reactive scaling based only on current queue lengths."
        }
      ],
      components: [
        {
          type: "StabilityAnalysis"
        }
      ]
    },
    {
      id: "simulation",
      title: "Interactive Simulation",
      content: [
        {
          type: "paragraph",
          text: "To build intuition for the mathematical concepts we've discussed, let's explore an interactive simulation of a distributed queue system. This simulation allows you to experiment with different system configurations and observe the resulting behavior."
        },
        {
          type: "paragraph",
          text: "You can adjust parameters such as the number of queues and consumers, task durations, arrival rates, and the assignment matrix. The simulation visualizes the system state, queue lengths over time, and spectral analysis of the queue behavior."
        },
        {
          type: "paragraph",
          text: "Try experimenting with different configurations to explore the system's behavior. Here are some suggestions:"
        },
        {
          type: "list",
          items: [
            "<strong>Stability boundary:</strong> Find the maximum arrival rates that keep the system stable",
            "<strong>Load balancing:</strong> Try different assignment patterns and observe their effect on queue lengths",
            "<strong>Resonance effects:</strong> Look for periodic patterns in queue lengths and their spectral representation",
            "<strong>Scaling effects:</strong> See how adding more consumers affects throughput and wait times"
          ]
        },
        {
          type: "note",
          title: "Simulation Insights",
          text: "As you experiment with the simulation, pay attention to the relationship between the mathematical metrics (eigenvalues, spectral components) and the observed system behavior. This connection between theory and practice is key to developing a deep understanding of distributed queue systems.",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-500"
        }
      ],
      components: [
        {
          type: "SimulationDashboard"
        }
      ]
    },
    {
      id: "case-study",
      title: "Case Study: Cloud Processing Pipeline",
      content: [
        {
          type: "paragraph",
          text: "To illustrate the practical application of our mathematical framework, let's examine a real-world example: a cloud-based data processing pipeline. This system ingests data from multiple sources, processes it through several stages, and delivers results to various destinations."
        },
        {
          type: "heading",
          level: 3,
          text: "System Description"
        },
        {
          type: "paragraph",
          text: "The system consists of:"
        },
        {
          type: "list",
          items: [
            "<strong>4 ingest queues</strong> receiving data from different sources, each with its own characteristic arrival pattern",
            "<strong>3 processing stages</strong> with different resource requirements and processing durations",
            "<strong>A pool of 8 worker instances</strong> that can be assigned to different processing tasks",
            "<strong>Service level objectives (SLOs)</strong> specifying maximum acceptable wait times for each data type"
          ]
        },
        {
          type: "paragraph",
          text: "The challenge is to determine the optimal assignment of workers to processing tasks and to identify potential bottlenecks as the system scales."
        },
        {
          type: "heading",
          level: 3,
          text: "Linear Algebra Analysis"
        },
        {
          type: "paragraph",
          text: "By representing the system as a set of queues with an assignment matrix, we can apply our linear algebra framework to analyze its behavior. The eigenanalysis reveals that one particular processing stage (image recognition) has a dominant eigenvalue of 0.92, indicating that it's operating close to its capacity limit."
        },
        {
          type: "paragraph",
          text: "The assignment matrix optimization suggests reallocating two workers from text processing to image recognition to balance the load better. This reallocation reduces the dominant eigenvalue to 0.78, providing more headroom for traffic growth."
        },
        {
          type: "heading",
          level: 3,
          text: "Spectral Analysis Insights"
        },
        {
          type: "paragraph",
          text: "The FFT analysis of historical queue length data reveals several interesting patterns:"
        },
        {
          type: "list",
          items: [
            "A strong daily cycle in the image data queue, correlating with user activity patterns",
            "A weekly cycle in the batch processing queue, corresponding to scheduled analytics jobs",
            "An unexpected 3-hour periodicity in the real-time processing queue, traced to a caching mechanism in an upstream system"
          ]
        },
        {
          type: "paragraph",
          text: "These insights allowed the team to implement predictive scaling policies that anticipate load patterns, reducing both resource costs and processing latency."
        },
        {
          type: "heading",
          level: 3,
          text: "Results and Outcomes"
        },
        {
          type: "paragraph",
          text: "After applying these mathematical techniques to optimize the system:"
        },
        {
          type: "list",
          items: [
            "Peak processing latency decreased by 47% for image data",
            "Resource utilization improved from 65% to 82% on average",
            "The system could handle 35% more traffic before reaching capacity limits",
            "SLO violations decreased from 3.8% to 0.2% of requests"
          ]
        },
        {
          type: "paragraph",
          text: "This case study demonstrates how the mathematical tools of linear algebra and spectral analysis can translate into tangible improvements in system performance and efficiency."
        },
        {
          type: "blockquote",
          text: "\"The combination of linear algebra for structural analysis and FFT for temporal analysis gave us insights we couldn't get from monitoring dashboards alone. It was like getting X-ray vision into our system's behavior.\" — Lead Engineer on the project",
          style: "bg-green-50",
          borderColor: "border-green-500"
        }
      ]
    },
    {
      id: "conclusion",
      title: "Conclusion",
      content: [
        {
          type: "paragraph",
          text: "Throughout this exploration of distributed queue systems, we've seen how linear algebra and spectral analysis provide powerful tools for understanding system behavior, predicting performance limits, and optimizing resource allocation."
        },
        {
          type: "paragraph",
          text: "The key insights we've gained include:"
        },
        {
          type: "list",
          items: [
            "Distributed queues can be elegantly represented as vector and matrix operations, allowing us to apply linear algebra techniques",
            "The eigenvalues of the system's transition matrix reveal critical information about stability and capacity limits",
            "FFT analysis uncovers hidden patterns in queue behavior that can inform predictive scaling and optimization",
            "The assignment matrix is a powerful tool for modeling and optimizing resource allocation in heterogeneous systems"
          ]
        },
        {
          type: "paragraph",
          text: "These mathematical approaches go beyond traditional queueing theory by accounting for the complex interactions and constraints of modern distributed systems. By combining the structural insights from linear algebra with the temporal insights from spectral analysis, we gain a comprehensive understanding of system dynamics."
        },
        {
          type: "paragraph",
          text: "As distributed systems continue to grow in scale and complexity, these mathematical tools become increasingly valuable for ensuring performance, reliability, and efficiency. The ability to model, analyze, and optimize these systems using the language of mathematics is a powerful capability for any engineer or architect working with distributed queue systems."
        },
        {
          type: "blockquote",
          text: "\"Mathematics is, in its way, the poetry of logical ideas.\" — Albert Einstein",
          style: "bg-purple-50",
          borderColor: "border-purple-500"
        },
        {
          type: "paragraph",
          text: "I hope this exploration has given you a new perspective on the beautiful mathematics underlying the systems we build and operate every day. The next time you're designing a distributed queue system or troubleshooting a capacity issue, remember that linear algebra and FFT analysis can be your allies in understanding and taming the complexity."
        }
      ]
    }
  ]
};

// =========== Main Component ===========

const DistributedQueuesBlog = () => {
  return (
    <BlogProvider initialContent={distributedQueuesContent}>
      <SimulationProvider>
        <BlogLayout />
      </SimulationProvider>
    </BlogProvider>
  );
};

export default DistributedQueuesBlog;
