import React, { useState } from 'react';

const DistributedFrameworkAnalysis = () => {
  const [activeTab, setActiveTab] = useState('comparison');
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center text-indigo-800 mb-2">Framework Desktop Networking</h1>
      <h2 className="text-xl text-center text-indigo-600 mb-6">Two Mid-Range vs One High-End Analysis</h2>
      
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <button 
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'comparison' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 hover:bg-indigo-100'}`}
          onClick={() => setActiveTab('comparison')}
        >
          Cost-Benefit Analysis
        </button>
        <button 
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'technical' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 hover:bg-indigo-100'}`}
          onClick={() => setActiveTab('technical')}
        >
          Technical Deep Dive
        </button>
        <button 
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'use_cases' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 hover:bg-indigo-100'}`}
          onClick={() => setActiveTab('use_cases')}
        >
          Ideal Use Cases
        </button>
        <button 
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'setup' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 hover:bg-indigo-100'}`}
          onClick={() => setActiveTab('setup')}
        >
          Implementation Guide
        </button>
      </div>

      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-indigo-600 text-white p-3">
              <h3 className="text-xl font-bold">Configuration Comparison</h3>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Specification</th>
                      <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">1x High-End</th>
                      <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">2x Mid-Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-4 border-b font-medium">Configuration</td>
                      <td className="py-2 px-4 border-b">Ryzen AI Max+ 395, 128GB</td>
                      <td className="py-2 px-4 border-b">2× Ryzen AI Max+ 395, 64GB each</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b font-medium">Base Price</td>
                      <td className="py-2 px-4 border-b">$1,999</td>
                      <td className="py-2 px-4 border-b">$3,198 ($1,599 × 2)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b font-medium">Additional Costs</td>
                      <td className="py-2 px-4 border-b">~$322 (storage, fan, OS)</td>
                      <td className="py-2 px-4 border-b">~$644 (2× storage, fans, OS)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b font-medium">Total Cores</td>
                      <td className="py-2 px-4 border-b">16 cores / 32 threads</td>
                      <td className="py-2 px-4 border-b">32 cores / 64 threads</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b font-medium">Total GPU Compute</td>
                      <td className="py-2 px-4 border-b">40 CUs (Radeon 8060S)</td>
                      <td className="py-2 px-4 border-b">80 CUs (2× Radeon 8060S)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b font-medium">Total Memory</td>
                      <td className="py-2 px-4 border-b">128GB unified</td>
                      <td className="py-2 px-4 border-b">128GB (64GB per system)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b font-medium">Power Consumption</td>
                      <td className="py-2 px-4 border-b">~140W peak</td>
                      <td className="py-2 px-4 border-b">~280W peak (140W × 2)</td>
                    </tr>
                    <tr className="bg-indigo-50">
                      <td className="py-2 px-4 border-b font-bold">Approximate Total Cost</td>
                      <td className="py-2 px-4 border-b font-bold">$2,321</td>
                      <td className="py-2 px-4 border-b font-bold">$3,842</td>
                    </tr>
                    <tr className="bg-indigo-50">
                      <td className="py-2 px-4 border-b font-bold">Cost Difference</td>
                      <td className="py-2 px-4 border-b font-bold">Baseline</td>
                      <td className="py-2 px-4 border-b font-bold">+$1,521 (66% more)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-green-600 text-white p-3">
                <h3 className="text-xl font-bold">Advantages of Two Mid-Range Systems</h3>
              </div>
              <div className="p-4">
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li><span className="font-semibold">Higher Raw Compute:</span> Double the CPU cores and GPU compute units</li>
                  <li><span className="font-semibold">Workload Isolation:</span> Run different projects on separate machines</li>
                  <li><span className="font-semibold">Redundancy:</span> If one system fails, the other remains operational</li>
                  <li><span className="font-semibold">Horizontal Scaling:</span> Add more machines to the network in the future</li>
                  <li><span className="font-semibold">Physical Flexibility:</span> Place systems in different locations</li>
                  <li><span className="font-semibold">Task Parallelism:</span> Run entirely different workloads simultaneously</li>
                  <li><span className="font-semibold">Distribute AI Tasks:</span> Use llama.cpp RPC for distributed inference</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-red-600 text-white p-3">
                <h3 className="text-xl font-bold">Disadvantages of Two Mid-Range Systems</h3>
              </div>
              <div className="p-4">
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li><span className="font-semibold">Cost:</span> 66% more expensive overall ($1,521 difference)</li>
                  <li><span className="font-semibold">Network Bottleneck:</span> 5Gbit Ethernet is much slower than memory bus</li>
                  <li><span className="font-semibold">Memory Fragmentation:</span> Cannot use full 128GB unified for one task</li>
                  <li><span className="font-semibold">Complex Setup:</span> Requires networking configuration and RPC setup</li>
                  <li><span className="font-semibold">Increased Maintenance:</span> Two systems to manage and update</li>
                  <li><span className="font-semibold">Higher Power Consumption:</span> Double the electricity usage</li>
                  <li><span className="font-semibold">Limited Model Support:</span> Not all AI models support distributed inference</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="bg-indigo-600 text-white p-3 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('valueProp')}
            >
              <h3 className="text-xl font-bold">Value Proposition Analysis</h3>
              <span>{expandedSections.valueProp ? '▼' : '►'}</span>
            </div>
            {expandedSections.valueProp && (
              <div className="p-4">
                <p className="mb-4 text-gray-700">When evaluating the value proposition of two mid-range systems vs. one high-end system, consider these key factors:</p>
                
                <div className="mb-4">
                  <h4 className="font-bold text-indigo-700 mb-2">Performance per Dollar</h4>
                  <p className="text-gray-700">For raw computational power, two mid-range systems offer approximately:</p>
                  <ul className="list-disc pl-5 text-gray-700 mt-2">
                    <li>2× the CPU cores and threads</li>
                    <li>2× the GPU compute units</li>
                    <li>But at 1.66× the cost</li>
                  </ul>
                  <p className="text-gray-700 mt-2">This means you're getting about 20% more raw performance per dollar with the distributed approach, but only if you can fully utilize both systems efficiently.</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-bold text-indigo-700 mb-2">Memory Utilization</h4>
                  <p className="text-gray-700">For memory-intensive workloads like large AI models:</p>
                  <ul className="list-disc pl-5 text-gray-700 mt-2">
                    <li>The high-end system can run models requiring up to 128GB in a single instance</li>
                    <li>The distributed systems are limited to 64GB per instance unless using distributed inference</li>
                    <li>Distributed inference adds networking overhead that reduces efficiency</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                  <h4 className="font-bold text-amber-800 mb-2">Use Case Dependent Value</h4>
                  <p className="text-gray-700">The value proposition heavily depends on your specific use case:</p>
                  <ul className="list-disc pl-5 text-gray-700 mt-2">
                    <li><span className="font-semibold">For large, unified AI models:</span> The high-end system offers better value</li>
                    <li><span className="font-semibold">For multiple independent workloads:</span> Two mid-range systems may offer better value</li>
                    <li><span className="font-semibold">For distributed AI inference:</span> Two mid-range systems could potentially offer better throughput (but not lower latency)</li>
                  </ul>
                </div>
                
                <p className="text-gray-700">Overall, the 66% price premium for two systems makes it difficult to justify purely on a value basis unless you have specific workloads that benefit from physical separation or redundancy.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'technical' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-indigo-600 text-white p-3">
              <h3 className="text-xl font-bold">Networking Architecture</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 mb-4">The Framework Desktop is specifically designed with distributed computing capabilities in mind, featuring 5Gbit Ethernet and USB4 ports for interconnecting multiple units.</p>
              
              <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                <h4 className="font-bold text-indigo-700 mb-2">Distributed AI Inference with llama.cpp RPC</h4>
                <p className="text-gray-700 mb-2">Framework explicitly mentions using llama.cpp RPC (Remote Procedure Call) to distribute AI workloads across multiple Framework Desktop units. This enables:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  <li>Running larger language models than would fit in a single machine's memory</li>
                  <li>Distributing computational load across multiple devices</li>
                  <li>Potentially improving throughput for batch inference tasks</li>
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-bold text-blue-700 mb-2">5Gbit Ethernet</h4>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>5× faster than standard Gigabit Ethernet</li>
                    <li>625 MB/s theoretical maximum throughput</li>
                    <li>Primary connection for distributed workloads</li>
                    <li>Lower latency than USB4 for networking</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-bold text-purple-700 mb-2">USB4 Ports</h4>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Up to 40 Gbps theoretical bandwidth</li>
                    <li>Can be used for secondary connections</li>
                    <li>Support for Thunderbolt devices</li>
                    <li>Alternative networking option</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-bold text-indigo-700 mb-2">Network vs. Memory Bandwidth Comparison</h4>
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Connection Type</th>
                      <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Theoretical Bandwidth</th>
                      <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Practical Bandwidth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-4 border-b">LPDDR5x Memory Bus (256-bit)</td>
                      <td className="py-2 px-4 border-b">256 GB/s</td>
                      <td className="py-2 px-4 border-b">~230-250 GB/s</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">5Gbit Ethernet</td>
                      <td className="py-2 px-4 border-b">625 MB/s</td>
                      <td className="py-2 px-4 border-b">~500-550 MB/s</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">USB4 (40 Gbps)</td>
                      <td className="py-2 px-4 border-b">5 GB/s</td>
                      <td className="py-2 px-4 border-b">~3.5-4.5 GB/s</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-gray-600 mt-2 text-sm">Note: The memory bus is ~400-500× faster than 5Gbit Ethernet, creating a significant bottleneck for distributed workloads that require frequent data transfer.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="bg-indigo-600 text-white p-3 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('llamaRPC')}
            >
              <h3 className="text-xl font-bold">llama.cpp RPC: Technical Deep Dive</h3>
              <span>{expandedSections.llamaRPC ? '▼' : '►'}</span>
            </div>
            {expandedSections.llamaRPC && (
              <div className="p-4">
                <p className="text-gray-700 mb-4">The recent integration of RPC code into llama.cpp enables distributed inference across multiple machines, allowing AI models to be split across networked systems.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold text-gray-700 mb-2">RPC Server Setup</h4>
                    <p className="text-gray-700">Each Framework Desktop would run the RPC server, exposing GPU and memory resources over the network:</p>
                    <div className="bg-gray-100 p-2 rounded mt-2 text-sm font-mono">
                      # Run on each Framework Desktop<br/>
                      ./rpc-server --host 192.168.1.x<br/>
                      --port 5005x --mem 60000
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold text-gray-700 mb-2">Client Connection</h4>
                    <p className="text-gray-700">The client application connects to both servers for distributed inference:</p>
                    <div className="bg-gray-100 p-2 rounded mt-2 text-sm font-mono">
                      # Client application<br/>
                      ./llama-cli -m model.gguf<br/>
                      --rpc 192.168.1.1:50051,192.168.1.2:50052
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-bold text-indigo-700 mb-2">Current Limitations of llama.cpp RPC</h4>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Limited to FP16 precision (no quantization support yet)</li>
                    <li>Not compatible with all GPU backends (no Vulkan support)</li>
                    <li>Network bandwidth becomes the primary bottleneck</li>
                    <li>Increased latency compared to single-machine inference</li>
                    <li>Not all models are designed for or compatible with distributed inference</li>
                    <li>Still considered experimental/proof-of-concept</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-2">Performance Considerations</h4>
                  <p className="text-gray-700">Recent benchmarks with distributed llama.cpp show:</p>
                  <ul className="list-disc pl-5 text-gray-700 mt-2">
                    <li>Ethernet connections (5Gbit) can achieve up to ~48 tokens per second</li>
                    <li>This is significantly slower than single-machine inference with full memory bandwidth</li>
                    <li>Best suited for models that wouldn't fit in a single machine's memory</li>
                    <li>May be viable for throughput-oriented batch inference rather than latency-sensitive applications</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="bg-indigo-600 text-white p-3 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('memoryConsiderations')}
            >
              <h3 className="text-xl font-bold">Memory Architecture Considerations</h3>
              <span>{expandedSections.memoryConsiderations ? '▼' : '►'}</span>
            </div>
            {expandedSections.memoryConsiderations && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-bold text-indigo-700 mb-2">Single System (128GB)</h4>
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <ul className="list-disc pl-5 text-gray-700">
                        <li>Full 128GB available as unified memory</li>
                        <li>All memory accessible at 256GB/s bandwidth</li>
                        <li>Zero networking overhead</li>
                        <li>Optimal for large, memory-intensive AI models</li>
                        <li>Can run models like Llama 3.3 70B locally</li>
                        <li>Lower latency for single model inference</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-indigo-700 mb-2">Distributed Systems (64GB each)</h4>
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <ul className="list-disc pl-5 text-gray-700">
                        <li>128GB total memory split across two systems</li>
                        <li>Limited by 5Gbit Ethernet for data transfer</li>
                        <li>Significant networking overhead for shared tasks</li>
                        <li>Better for parallel, independent workloads</li>
                        <li>Requires distributed inference for large models</li>
                        <li>Higher latency for distributed model inference</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-bold text-indigo-700 mb-2">AI Model Memory Requirements</h4>
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Model</th>
                        <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">FP16 Size</th>
                        <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Q8 Size</th>
                        <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Q4 Size</th>
                        <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Viable on 64GB?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-4 border-b">Llama 3 8B</td>
                        <td className="py-2 px-4 border-b">~16GB</td>
                        <td className="py-2 px-4 border-b">~8GB</td>
                        <td className="py-2 px-4 border-b">~4GB</td>
                        <td className="py-2 px-4 border-b text-green-600">Yes (all formats)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Llama 3 70B</td>
                        <td className="py-2 px-4 border-b">~140GB</td>
                        <td className="py-2 px-4 border-b">~70GB</td>
                        <td className="py-2 px-4 border-b">~35GB</td>
                        <td className="py-2 px-4 border-b text-green-600">Yes (Q4/Q8)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Llama 3.3 70B</td>
                        <td className="py-2 px-4 border-b">~140GB</td>
                        <td className="py-2 px-4 border-b">~70GB</td>
                        <td className="py-2 px-4 border-b">~35GB</td>
                        <td className="py-2 px-4 border-b text-green-600">Yes (Q4/Q8)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Mistral 7B</td>
                        <td className="py-2 px-4 border-b">~14GB</td>
                        <td className="py-2 px-4 border-b">~7GB</td>
                        <td className="py-2 px-4 border-b">~3.5GB</td>
                        <td className="py-2 px-4 border-b text-green-600">Yes (all formats)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Claude 3 Haiku 100B</td>
                        <td className="py-2 px-4 border-b">~200GB</td>
                        <td className="py-2 px-4 border-b">~100GB</td>
                        <td className="py-2 px-4 border-b">~50GB</td>
                        <td className="py-2 px-4 border-b text-green-600">Yes (Q4 only)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Falcon 180B</td>
                        <td className="py-2 px-4 border-b">~360GB</td>
                        <td className="py-2 px-4 border-b">~180GB</td>
                        <td className="py-2 px-4 border-b">~90GB</td>
                        <td className="py-2 px-4 border-b text-red-600">No (requires distributed)</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-gray-600 mt-2 text-sm">Note: Memory requirements include space for model weights, KV cache, and overhead. Actual memory usage may vary.</p>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-2">Memory Access Speed Impact</h4>
                  <p className="text-gray-700">The performance difference between unified memory and distributed memory is substantial:</p>
                  <ul className="list-disc pl-5 text-gray-700 mt-2">
                    <li>Unified memory (256GB/s) is ~400-500× faster than 5Gbit Ethernet (~0.5GB/s)</li>
                    <li>For AI inference, this translates to significantly higher latency in distributed setups</li>
                    <li>Memory-bound operations will experience the most severe performance degradation</li>
                    <li>The primary benefit of distribution is enabling models that wouldn't fit in a single system's memory</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'use_cases' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-indigo-600 text-white p-3">
              <h3 className="text-xl font-bold">Ideal Use Cases for Each Approach</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-700 mb-3">Best for Single High-End System</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-3">
                    <li>
                      <span className="font-semibold">Large Single AI Models:</span>
                      <p className="mt-1">Running large language models like Llama 3.3 70B that benefit from unified memory access without networking overhead.</p>
                    </li>
                    <li>
                      <span className="font-semibold">Low-Latency Inference:</span>
                      <p className="mt-1">Applications requiring fast, real-time responses where network latency would be problematic.</p>
                    </li>
                    <li>
                      <span className="font-semibold">Memory-Intensive Workloads:</span>
                      <p className="mt-1">Tasks that require access to large amounts of memory in a single address space.</p>
                    </li>
                    <li>
                      <span className="font-semibold">Budget-Constrained Projects:</span>
                      <p className="mt-1">When maximizing performance per dollar is critical and splitting workloads isn't practical.</p>
                    </li>
                    <li>
                      <span className="font-semibold">Simplicity of Management:</span>
                      <p className="mt-1">When you prefer a simpler setup without networking configuration and maintenance.</p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-700 mb-3">Best for Two Mid-Range Systems</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-3">
                    <li>
                      <span className="font-semibold">Multiple Independent Projects:</span>
                      <p className="mt-1">Running completely separate workloads in parallel without resource competition.</p>
                    </li>
                    <li>
                      <span className="font-semibold">Development/Testing Environments:</span>
                      <p className="mt-1">Using one system for development and another for testing/staging.</p>
                    </li>
                    <li>
                      <span className="font-semibold">High Availability Requirements:</span>
                      <p className="mt-1">When system redundancy is crucial for fault tolerance.</p>
                    </li>
                    <li>
                      <span className="font-semibold">Ultra-Large AI Models:</span>
                      <p className="mt-1">Models exceeding 128GB that wouldn't fit on a single system even at highest configuration.</p>
                    </li>
                    <li>
                      <span className="font-semibold">Physical Location Flexibility:</span>
                      <p className="mt-1">When systems need to be in different physical locations.</p>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                <h4 className="font-bold text-indigo-700 mb-3">ESP32S3 Camera Pipeline Considerations</h4>
                <p className="text-gray-700 mb-3">For your specific use case with ESP32S3 camera nodes and image processing:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-indigo-600 mb-2">Single System Approach</h5>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      <li>Simpler network topology and data flow</li>
                      <li>Lower latency for image processing pipelines</li>
                      <li>Unified memory for both image storage and ML models</li>
                      <li>Easier coordination of multiple ESP32S3 nodes</li>
                      <li>More cost-effective for this specific use case</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-indigo-600 mb-2">Dual System Approach</h5>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      <li>Dedicate one system exclusively to ESP32S3 processing</li>
                      <li>Use second system for other projects simultaneously</li>
                      <li>Higher total throughput for multiple simultaneous tasks</li>
                      <li>Potential to scale by adding more systems later</li>
                      <li>Redundancy if one system experiences issues</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-bold text-purple-700 mb-3">Use Case Decision Matrix</h4>
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 bg-purple-100 text-left text-purple-800">Use Case</th>
                      <th className="py-2 px-4 bg-purple-100 text-center text-purple-800">Single High-End</th>
                      <th className="py-2 px-4 bg-purple-100 text-center text-purple-800">Two Mid-Range</th>
                      <th className="py-2 px-4 bg-purple-100 text-left text-purple-800">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-4 border-b">ESP32S3 Camera Pipeline</td>
                      <td className="py-2 px-4 border-b text-center">✅</td>
                      <td className="py-2 px-4 border-b text-center">⚠️</td>
                      <td className="py-2 px-4 border-b">Lower latency, simpler setup, cost-effective</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Multiple Separate Projects</td>
                      <td className="py-2 px-4 border-b text-center">⚠️</td>
                      <td className="py-2 px-4 border-b text-center">✅</td>
                      <td className="py-2 px-4 border-b">True isolation, separate resources</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Local LLM (70B-100B)</td>
                      <td className="py-2 px-4 border-b text-center">✅</td>
                      <td className="py-2 px-4 border-b text-center">⚠️</td>
                      <td className="py-2 px-4 border-b">Unified memory, no networking overhead</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Ultra Large Models (180B+)</td>
                      <td className="py-2 px-4 border-b text-center">❌</td>
                      <td className="py-2 px-4 border-b text-center">✅</td>
                      <td className="py-2 px-4 border-b">Distribution required for memory constraints</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">High Availability Service</td>
                      <td className="py-2 px-4 border-b text-center">❌</td>
                      <td className="py-2 px-4 border-b text-center">✅</td>
                      <td className="py-2 px-4 border-b">Redundancy provides fault tolerance</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">ML Training Workloads</td>
                      <td className="py-2 px-4 border-b text-center">✅</td>
                      <td className="py-2 px-4 border-b text-center">⚠️</td>
                      <td className="py-2 px-4 border-b">Training benefits from unified memory</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Multiple Location Deployment</td>
                      <td className="py-2 px-4 border-b text-center">❌</td>
                      <td className="py-2 px-4 border-b text-center">✅</td>
                      <td className="py-2 px-4 border-b">Systems can be physically separated</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-gray-600 mt-2 text-sm">✅ = Ideal, ⚠️ = Possible but suboptimal, ❌ = Not recommended</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="bg-indigo-600 text-white p-3 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('futureProofing')}
            >
              <h3 className="text-xl font-bold">Future-Proofing Considerations</h3>
              <span>{expandedSections.futureProofing ? '▼' : '►'}</span>
            </div>
            {expandedSections.futureProofing && (
              <div className="p-4">
                <p className="text-gray-700 mb-4">When making this decision, consider how your needs might evolve over time:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <h4 className="font-bold text-indigo-700 mb-2">Single System Evolution Path</h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-2">
                      <li>Start with the 128GB high-end system</li>
                      <li>Add external storage for data expansion</li>
                      <li>Connect external devices via USB4</li>
                      <li>If needed, add a completely new system later</li>
                      <li>Memory capacity limitations cannot be addressed</li>
                    </ul>
                  </div>
                  
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <h4 className="font-bold text-indigo-700 mb-2">Dual System Evolution Path</h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-2">
                      <li>Start with two 64GB mid-range systems</li>
                      <li>Add more systems to the network as needed</li>
                      <li>Distribute workloads across growing cluster</li>
                      <li>Replace individual systems incrementally</li>
                      <li>More flexible adaptation to changing needs</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                  <h4 className="font-bold text-amber-800 mb-2">Technology Landscape Changes</h4>
                  <p className="text-gray-700">Consider these potential future developments:</p>
                  <ul className="list-disc pl-5 text-gray-700 mt-2">
                    <li><span className="font-semibold">Distributed Inference Improvements:</span> llama.cpp RPC and similar technologies will likely improve, potentially reducing the current performance gap</li>
                    <li><span className="font-semibold">AI Model Efficiency:</span> Future AI models may be more efficient, reducing memory requirements</li>
                    <li><span className="font-semibold">Quantization Advances:</span> Better quantization techniques may allow larger models to fit in less memory</li>
                    <li><span className="font-semibold">New Framework Hardware:</span> Framework may release new, more powerful versions in the future</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 mb-2">Recommendations</h4>
                  <p className="text-gray-700 mb-2">For most users, the most future-proof approach would be:</p>
                  <ol className="list-decimal pl-5 text-gray-700 space-y-2">
                    <li>Start with a single high-end (128GB) system if budget allows</li>
                    <li>Thoroughly test your workloads and identify bottlenecks</li>
                    <li>If needed, add a second system later (potentially even a higher spec model in the future)</li>
                    <li>Experiment with distributed inference as the technology matures</li>
                  </ol>
                  <p className="text-gray-700 mt-2">This approach minimizes upfront cost while providing flexibility for future expansion.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-indigo-600 text-white p-3">
              <h3 className="text-xl font-bold">Implementation Guide: Two Mid-Range Systems</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 mb-4">If you decide to proceed with two mid-range Framework Desktop systems, here's how to set them up for distributed work:</p>
              
              <div className="mb-6">
                <h4 className="font-bold text-indigo-700 mb-2">Hardware Setup</h4>
                <ol className="list-decimal pl-5 text-gray-700 space-y-2">
                  <li>Purchase two Framework Desktop mid-range systems ($1,599 each) with 64GB memory</li>
                  <li>Add storage (at least 1TB NVMe SSD) to each system</li>
                  <li>Connect both systems to your network using their 5Gbit Ethernet ports</li>
                  <li>Ensure both systems have stable power connections, ideally with UPS protection</li>
                  <li>Consider cooling solutions for continuous operation (adequate ventilation)</li>
                </ol>
              </div>
              
              <div className="mb-6">
                <h4 className="font-bold text-indigo-700 mb-2">Software Configuration</h4>
                <ol className="list-decimal pl-5 text-gray-700 space-y-2">
                  <li>Install compatible operating systems on both machines (Linux recommended)</li>
                  <li>Configure static IP addresses for both systems</li>
                  <li>Set up SSH for remote management</li>
                  <li>Install required development tools (gcc/g++, git, cmake, etc.)</li>
                  <li>Configure firewall rules to allow necessary communications</li>
                </ol>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                <h4 className="font-bold text-indigo-700 mb-2">Distributed AI Setup with llama.cpp</h4>
                <p className="text-gray-700 mb-3">To enable distributed AI inference across your two Framework Desktop systems:</p>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-indigo-600 mb-1">Step 1: Build llama.cpp with RPC support</h5>
                    <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                      # On both systems<br/>
                      git clone https://github.com/ggml-org/llama.cpp.git<br/>
                      cd llama.cpp<br/>
                      GGML_RPC=ON make -j<br/>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-indigo-600 mb-1">Step 2: Start RPC servers on both systems</h5>
                    <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                      # System 1 (192.168.1.101)<br/>
                      ./bin/rpc-server -p 50051 --mem 60000<br/><br/>
                      # System 2 (192.168.1.102)<br/>
                      ./bin/rpc-server -p 50051 --mem 60000
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-indigo-600 mb-1">Step 3: Run distributed inference</h5>
                    <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                      # From either system<br/>
                      ./bin/llama-cli -m /path/to/model.gguf -ngl 99 \<br/>
                      --rpc 192.168.1.101:50051,192.168.1.102:50051 \<br/>
                      -p "Your prompt here"
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                <h4 className="font-bold text-indigo-700 mb-2">ESP32S3 Camera Integration</h4>
                <p className="text-gray-700 mb-3">To integrate your ESP32S3 camera nodes with your distributed setup:</p>
                
                <ol className="list-decimal pl-5 text-gray-700 space-y-2">
                  <li>Configure each ESP32S3 to connect to your network</li>
                  <li>Set up MQTT broker on one of the Framework Desktop systems</li>
                  <li>Program ESP32S3s to capture and publish images to the MQTT topic</li>
                  <li>Create a service that subscribes to the MQTT topic and processes images</li>
                  <li>Implement distributed processing using both systems as needed</li>
                </ol>
                
                <div className="bg-gray-100 p-2 rounded text-sm font-mono mt-3">
                  # Example MQTT broker setup on Framework Desktop<br/>
                  sudo apt install mosquitto mosquitto-clients<br/>
                  sudo systemctl enable mosquitto<br/>
                  sudo systemctl start mosquitto
                </div>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-800 mb-2">Performance Optimization Tips</h4>
                <ul className="list-disc pl-5 text-gray-700 mt-2">
                  <li>Use wired connections rather than Wi-Fi for all devices</li>
                  <li>Configure jumbo frames on your network for improved throughput</li>
                  <li>Minimize network hops between systems</li>
                  <li>Monitor system temperatures and adjust cooling as needed</li>
                  <li>Consider dedicated network switches for inter-system communication</li>
                  <li>Use monitoring tools (like Prometheus/Grafana) to track performance</li>
                  <li>Regularly update firmware and software for optimal performance</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="bg-indigo-600 text-white p-3 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('maintenanceConsiderations')}
            >
              <h3 className="text-xl font-bold">Maintenance and Long-term Considerations</h3>
              <span>{expandedSections.maintenanceConsiderations ? '▼' : '►'}</span>
            </div>
            {expandedSections.maintenanceConsiderations && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <h4 className="font-bold text-indigo-700 mb-2">Ongoing Maintenance: Single System</h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      <li>Simpler OS updates and software management</li>
                      <li>Single point of hardware maintenance</li>
                      <li>Lower power consumption and heat generation</li>
                      <li>Fewer components that could potentially fail</li>
                      <li>Only one system to back up and secure</li>
                    </ul>
                  </div>
                  
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <h4 className="font-bold text-indigo-700 mb-2">Ongoing Maintenance: Dual Systems</h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      <li>Twice the OS updates and software management</li>
                      <li>More complex network management</li>
                      <li>Higher power consumption and cooling needs</li>
                      <li>More components that could potentially fail</li>
                      <li>Two systems to back up and secure</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-bold text-indigo-700 mb-2">Long-term Cost Considerations</h4>
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 bg-indigo-100 text-left text-indigo-800">Expense Category</th>
                        <th className="py-2 px-4 bg-indigo-100 text-center text-indigo-800">Single High-End</th>
                        <th className="py-2 px-4 bg-indigo-100 text-center text-indigo-800">Two Mid-Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-4 border-b">Initial Hardware</td>
                        <td className="py-2 px-4 border-b text-center">$2,321</td>
                        <td className="py-2 px-4 border-b text-center">$3,842</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Annual Power Cost (24/7)</td>
                        <td className="py-2 px-4 border-b text-center">~$184</td>
                        <td className="py-2 px-4 border-b text-center">~$368</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Network Equipment</td>
                        <td className="py-2 px-4 border-b text-center">Basic ($0-100)</td>
                        <td className="py-2 px-4 border-b text-center">5GbE Switch ($150-300)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Cooling/Ventilation</td>
                        <td className="py-2 px-4 border-b text-center">Minimal</td>
                        <td className="py-2 px-4 border-b text-center">More Substantial</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Maintenance Time</td>
                        <td className="py-2 px-4 border-b text-center">Lower</td>
                        <td className="py-2 px-4 border-b text-center">Higher</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">3-Year Total Cost</td>
                        <td className="py-2 px-4 border-b text-center">~$2,873</td>
                        <td className="py-2 px-4 border-b text-center">~$5,046</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-gray-600 mt-2 text-sm">Power costs estimated at $0.15/kWh with 140W (single) or 280W (dual) consumption.</p>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-2">Final Recommendation</h4>
                  <p className="text-gray-700">Based on the comprehensive analysis of cost, performance, and maintenance considerations:</p>
                  <ul className="list-disc pl-5 text-gray-700 mt-2">
                    <li>For your ESP32S3 camera pipeline and general-purpose computing needs, the single high-end system (128GB) offers the best value.</li>
                    <li>The dual system approach would cost approximately 75% more over three years while introducing additional complexity.</li>
                    <li>Unless you specifically need physical separation or redundancy, the single system approach is recommended.</li>
                    <li>Consider starting with the single high-end system now, and if your needs expand beyond its capabilities, you can add a second system later.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <h3 className="text-xl font-bold text-indigo-700 mb-3">Summary</h3>
        <p className="text-gray-700 mb-3">The question of whether to buy two mid-range Framework Desktop systems versus one high-end system is complex, with tradeoffs in cost, performance, and flexibility.</p>
        
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg">
            <span className="font-semibold text-indigo-700">Two Mid-Range Systems ($3,842 total)</span>
            <ul className="list-disc pl-5 text-gray-700 mt-1">
              <li>Provides 2× the CPU cores and GPU compute units</li>
              <li>Offers workload isolation and redundancy</li>
              <li>Supports networking via 5Gbit Ethernet for distributed tasks</li>
              <li>Costs 66% more than a single high-end system</li>
              <li>Introduces network bottlenecks for shared workloads</li>
            </ul>
          </div>
          
          <div className="bg-white p-3 rounded-lg">
            <span className="font-semibold text-indigo-700">One High-End System ($2,321 total)</span>
            <ul className="list-disc pl-5 text-gray-700 mt-1">
              <li>Offers 128GB unified memory with 256GB/s bandwidth</li>
              <li>Provides lower latency for single-system workloads</li>
              <li>Simplifies setup, management, and maintenance</li>
              <li>More cost-effective for most use cases</li>
              <li>Limited by the resources of a single machine</li>
            </ul>
          </div>
        </div>
        
        <p className="mt-3 text-gray-700">The optimal choice depends on your specific requirements, but for the ESP32S3 camera pipeline and general-purpose computing, the single high-end system offers better value unless you specifically need physical separation or redundancy.</p>
      </div>
    </div>
  );
};

export default DistributedFrameworkAnalysis;