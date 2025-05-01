import React, { useState, useEffect, useRef } from 'react';
import { StandardMarkDown } from "@ant/chat/components/StandardMarkDown";
import { ArrowRight, Code, Package, Globe, RefreshCw, Send } from 'lucide-react';

// Color constants for consistent styling
const COLORS = { 
  RED: '#B54369', 
  PURPLE: '#4D44AB', 
  BLUE: '#1B67B2', 
  BLACK: '#202020', 
  GREEN: '#568C1C', 
  ORANGE: '#C77F1A' 
};

// Text style constants
const PLOT_CAPTION_STYLE = "text-sm font-semibold text-center text-gray-600 px-10";
const MARKDOWN_STYLE = "py-3 px-10 flex flex-col gap-3 overflow-hidden research-report-content";

// Virtual DOM node types for visualization
const NODE_TYPES = {
  ELEMENT: 'element',
  TEXT: 'text'
};

// Simulated tree-shaking example
const MODULES_TREE = {
  name: 'node_modules',
  children: [
    {
      name: 'react',
      used: true,
      size: '122KB',
      children: [
        { name: 'cjs', used: true, size: '45KB' },
        { name: 'umd', used: false, size: '77KB' },
        { name: 'jsx-runtime', used: true, size: '10KB' }
      ]
    },
    {
      name: 'lodash',
      used: true,
      size: '533KB',
      children: [
        { name: 'map.js', used: true, size: '8KB' },
        { name: 'filter.js', used: true, size: '7KB' },
        { name: 'reduce.js', used: false, size: '8KB' },
        { name: 'merge.js', used: false, size: '12KB' },
        { name: 'cloneDeep.js', used: true, size: '15KB' },
        { name: 'omit.js', used: false, size: '8KB' }
      ]
    },
    {
      name: 'unused-lib',
      used: false,
      size: '247KB',
      children: [
        { name: 'index.js', used: false, size: '112KB' },
        { name: 'utils.js', used: false, size: '135KB' }
      ]
    }
  ]
};

const FrontendConceptsGuide = () => {
  const [activeTab, setActiveTab] = useState('dom');
  const [domExample, setDomExample] = useState({
    type: 'div',
    props: { className: 'container' },
    children: [
      {
        type: 'h1',
        props: { className: 'title' },
        children: ['Hello World']
      },
      {
        type: 'button',
        props: { className: 'btn', onClick: 'handleClick()' },
        children: ['Click Me']
      }
    ]
  });
  
  const [treeShaking, setTreeShaking] = useState({
    runTreeShake: false,
    originalSize: '902KB',
    optimizedSize: '207KB'
  });
  
  const [apiCallState, setApiCallState] = useState({
    status: 'idle',
    workerStatus: 'idle',
    count: 0
  });
  
  const blockCitations = [
    {
      "url": "https://react.dev/learn/preserving-and-resetting-state",
      "uuid": "react-docs-1",
      "title": "Preserving and Resetting State - React Docs",
      "metadata": {
        "type": "webpage_metadata",
        "site_name": "React",
        "site_domain": "react.dev"
      }
    },
    {
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers",
      "uuid": "mdn-web-workers",
      "title": "Using Web Workers - Web APIs | MDN",
      "metadata": {
        "type": "webpage_metadata",
        "site_name": "MDN Web Docs",
        "site_domain": "developer.mozilla.org"
      }
    },
    {
      "url": "https://webpack.js.org/guides/tree-shaking/",
      "uuid": "webpack-tree-shaking",
      "title": "Tree Shaking | webpack",
      "metadata": {
        "type": "webpage_metadata",
        "site_name": "webpack",
        "site_domain": "webpack.js.org"
      }
    }
  ];

  // DOM Visualization Component
  const DOMVisualization = () => {
    const [isUpdated, setIsUpdated] = useState(false);
    
    const toggleText = () => {
      const updatedDom = {...domExample};
      updatedDom.children[0].children[0] = isUpdated ? 'Hello World' : 'Updated Text';
      setDomExample(updatedDom);
      setIsUpdated(!isUpdated);
    };
    
    const renderVirtualDomNode = (node, index, depth = 0) => {
      if (typeof node === 'string') {
        return (
          <div 
            key={`text-${index}`} 
            className="ml-6 p-2 rounded bg-gray-100 text-gray-800 my-1"
            style={{ marginLeft: `${depth * 20}px` }}
          >
            "{node}"
          </div>
        );
      }
      
      return (
        <div key={`node-${index}`}>
          <div 
            className="p-2 rounded bg-blue-100 text-blue-800 my-1 flex items-center"
            style={{ marginLeft: `${depth * 20}px` }}
          >
            <span className="font-mono">&lt;{node.type}</span>
            {node.props && Object.keys(node.props).length > 0 && (
              <span className="ml-2 text-gray-600">
                {Object.entries(node.props).map(([key, value], i) => (
                  <span key={i}>
                    {` ${key}=`}<span className="text-green-600">"{value}"</span>
                  </span>
                ))}
              </span>
            )}
            <span className="font-mono">&gt;</span>
          </div>
          
          {node.children && node.children.map((child, i) => 
            renderVirtualDomNode(child, `${index}-${i}`, depth + 1)
          )}
          
          <div 
            className="p-2 rounded bg-blue-100 text-blue-800 my-1 flex items-center"
            style={{ marginLeft: `${depth * 20}px` }}
          >
            <span className="font-mono">&lt;/{node.type}&gt;</span>
          </div>
        </div>
      );
    };

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between mb-4 items-center">
          <h3 className="text-lg font-semibold">Virtual DOM Visualization</h3>
          <button 
            onClick={toggleText} 
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
          >
            <RefreshCw size={14} className="mr-1" /> Update DOM
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Virtual DOM Structure</h4>
            <div className="border rounded p-3 bg-gray-50 overflow-auto max-h-96">
              {renderVirtualDomNode(domExample, 'root')}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Rendered Result</h4>
            <div className="border rounded p-4 bg-gray-50 min-h-32 flex flex-col items-center justify-center">
              <h1 className="text-xl font-bold mb-3">{domExample.children[0].children[0]}</h1>
              <button className="bg-blue-500 text-white px-4 py-2 rounded">
                Click Me
              </button>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Process Explanation</h4>
              <div className="text-sm space-y-2">
                <p>1. <span className="font-semibold">React Component</span> → JavaScript creates elements</p>
                <p>2. <span className="font-semibold">Virtual DOM</span> → In-memory representation (left)</p>
                <p>3. <span className="font-semibold">Reconciliation</span> → Diff algorithm finds changes</p>
                <p>4. <span className="font-semibold">Real DOM Update</span> → Efficient targeted changes</p>
                <p>5. <span className="font-semibold">Browser Render</span> → Visual output (right)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tree Shaking Visualization
  const TreeShakingVisualization = () => {
    const [isOptimized, setIsOptimized] = useState(false);
    
    const toggleTreeShake = () => {
      setIsOptimized(!isOptimized);
      setTreeShaking({
        ...treeShaking,
        runTreeShake: !treeShaking.runTreeShake
      });
    };
    
    const renderTreeNode = (node, index, isOptimized) => {
      const isUsed = node.used;
      const shouldShow = !isOptimized || isUsed;
      
      if (!shouldShow) return null;
      
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <div key={`node-${index}`} className={`mb-2 ${isUsed ? '' : 'opacity-50'}`}>
          <div className={`flex items-center ${isUsed ? 'text-gray-800' : 'text-gray-400'}`}>
            <span className={`mr-2 ${hasChildren ? 'text-gray-500' : 'text-gray-400'}`}>
              {hasChildren ? '📁' : '📄'}
            </span>
            <span className="font-mono">{node.name}</span>
            {node.size && (
              <span className="ml-2 text-xs text-gray-500">({node.size})</span>
            )}
            {!isUsed && isOptimized && (
              <span className="ml-2 text-xs text-red-500">(unused - will be removed)</span>
            )}
            {!isUsed && !isOptimized && (
              <span className="ml-2 text-xs text-red-500">(unused)</span>
            )}
          </div>
          
          {hasChildren && (
            <div className="pl-6 border-l border-gray-200 ml-2 mt-1">
              {node.children.map((child, i) => renderTreeNode(child, `${index}-${i}`, isOptimized))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between mb-4 items-center">
          <h3 className="text-lg font-semibold">Tree Shaking Visualization</h3>
          <button 
            onClick={toggleTreeShake} 
            className={`${isOptimized ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded flex items-center`}
          >
            <Package size={14} className="mr-1" /> 
            {isOptimized ? 'View Full Bundle' : 'Apply Tree Shaking'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">
              {isOptimized ? 'Optimized Bundle' : 'Full Dependency Tree'} 
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({isOptimized ? treeShaking.optimizedSize : treeShaking.originalSize})
              </span>
            </h4>
            <div className="border rounded p-3 bg-gray-50 overflow-auto h-96">
              {renderTreeNode(MODULES_TREE, 'root', isOptimized)}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">What is Tree Shaking?</h4>
            <div className="text-sm space-y-3">
              <p>
                <span className="font-semibold">Tree shaking</span> is a build optimization technique that 
                eliminates dead code (unused exports) from your final bundle.
              </p>
              
              <div className="bg-gray-50 p-3 rounded border">
                <div className="font-medium mb-1">Before Tree Shaking:</div>
                <div className="flex items-center">
                  <div className="w-24 h-3 bg-blue-400 rounded-l"></div>
                  <div className="w-12 h-3 bg-gray-300"></div>
                  <div className="w-32 h-3 bg-green-400"></div>
                  <div className="w-20 h-3 bg-gray-300"></div>
                  <div className="w-16 h-3 bg-purple-400 rounded-r"></div>
                </div>
                <div className="text-xs mt-1 text-gray-500">Total Size: {treeShaking.originalSize}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <div className="font-medium mb-1">After Tree Shaking:</div>
                <div className="flex items-center">
                  <div className="w-24 h-3 bg-blue-400 rounded-l"></div>
                  <div className="w-32 h-3 bg-green-400"></div>
                  <div className="w-16 h-3 bg-purple-400 rounded-r"></div>
                </div>
                <div className="text-xs mt-1 text-gray-500">Total Size: {treeShaking.optimizedSize}</div>
              </div>
              
              <p className="mt-2">Tree shaking works by:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Analyzing the ES modules import/export statements</li>
                <li>Building a dependency graph of your code</li>
                <li>Identifying which exports are never imported</li>
                <li>Eliminating unused code during bundling</li>
              </ol>
              
              <p className="mt-2">
                <strong>Benefits:</strong> Smaller bundle sizes, faster load times, and improved 
                application performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Browser API Limitations Demo
  const APILimitationsDemo = () => {
    const [mainThreadState, setMainThreadState] = useState({
      isProcessing: false,
      progress: 0,
      uiBlocked: false
    });
    
    const [workerState, setWorkerState] = useState({
      isProcessing: false,
      progress: 0,
      uiBlocked: false
    });
    
    const [apiCallResult, setApiCallResult] = useState(null);
    
    // Simulate heavy processing on main thread
    const simulateMainThreadProcessing = () => {
      setMainThreadState({
        isProcessing: true,
        progress: 0,
        uiBlocked: true
      });
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setMainThreadState({
            isProcessing: true,
            progress,
            uiBlocked: true
          });
        } else {
          clearInterval(interval);
          setMainThreadState({
            isProcessing: false,
            progress: 100,
            uiBlocked: false
          });
          
          // Reset after 2 seconds
          setTimeout(() => {
            setMainThreadState({
              isProcessing: false,
              progress: 0,
              uiBlocked: false
            });
          }, 2000);
        }
      }, 300);
    };
    
    // Simulate worker thread processing
    const simulateWorkerProcessing = () => {
      setWorkerState({
        isProcessing: true,
        progress: 0,
        uiBlocked: false
      });
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setWorkerState({
            isProcessing: true,
            progress,
            uiBlocked: false
          });
        } else {
          clearInterval(interval);
          setWorkerState({
            isProcessing: false,
            progress: 100,
            uiBlocked: false
          });
          
          // Reset after 2 seconds
          setTimeout(() => {
            setWorkerState({
              isProcessing: false,
              progress: 0,
              uiBlocked: false
            });
          }, 2000);
        }
      }, 300);
    };
    
    // Simulate API call
    const simulateAPICall = () => {
      setApiCallResult({
        status: 'loading',
        message: 'Making API request...'
      });
      
      setTimeout(() => {
        setApiCallResult({
          status: 'success',
          message: 'API call completed successfully',
          data: {
            id: Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            result: 'Sample data from API'
          },
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': `req-${Math.random().toString(36).substr(2, 9)}`,
            'Server-Timing': 'db;dur=53, app;dur=47.2'
          }
        });
      }, 1500);
    };

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Browser API & Web Workers</h3>
          <p className="text-sm text-gray-600">
            Explore how web workers help overcome browser limitations
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">JavaScript Execution Comparison</h4>
            
            <div className="space-y-6">
              <div className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">Main Thread Processing</div>
                  <button 
                    onClick={simulateMainThreadProcessing}
                    disabled={mainThreadState.isProcessing}
                    className={`px-3 py-1 rounded text-white ${mainThreadState.isProcessing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    Run Task
                  </button>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <div 
                    className="h-2 bg-blue-500 rounded-full transition-all duration-300" 
                    style={{ width: `${mainThreadState.progress}%` }}
                  ></div>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  {mainThreadState.isProcessing 
                    ? `Processing... ${mainThreadState.progress}%` 
                    : mainThreadState.progress === 100 
                      ? 'Processing complete!' 
                      : 'Click "Run Task" to start processing'}
                </div>
                
                <div className="p-3 border rounded bg-white">
                  <div className="font-medium mb-2">UI Interaction Test:</div>
                  <p className="text-sm mb-2">
                    {mainThreadState.uiBlocked 
                      ? "Try clicking the buttons below - they're unresponsive!" 
                      : "Click buttons below - they respond normally"}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                      Button 1
                    </button>
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                      Button 2
                    </button>
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                      Button 3
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">Web Worker Processing</div>
                  <button 
                    onClick={simulateWorkerProcessing}
                    disabled={workerState.isProcessing}
                    className={`px-3 py-1 rounded text-white ${workerState.isProcessing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    Run Task
                  </button>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <div 
                    className="h-2 bg-green-500 rounded-full transition-all duration-300" 
                    style={{ width: `${workerState.progress}%` }}
                  ></div>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  {workerState.isProcessing 
                    ? `Processing in worker... ${workerState.progress}%` 
                    : workerState.progress === 100 
                      ? 'Processing complete!' 
                      : 'Click "Run Task" to start processing in a separate thread'}
                </div>
                
                <div className="p-3 border rounded bg-white">
                  <div className="font-medium mb-2">UI Interaction Test:</div>
                  <p className="text-sm mb-2">
                    {workerState.uiBlocked 
                      ? "Try clicking the buttons below - they're unresponsive!" 
                      : "Click buttons below - still responsive even during processing!"}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                      Button 1
                    </button>
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                      Button 2
                    </button>
                    <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                      Button 3
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">API Calls & Distributed Tracing</h4>
            
            <div className="border rounded p-4 bg-gray-50 mb-4">
              <div className="flex justify-between mb-3">
                <div className="font-medium">Simulated API Request</div>
                <button 
                  onClick={simulateAPICall}
                  className="px-3 py-1 rounded text-white bg-purple-500 hover:bg-purple-600 flex items-center"
                >
                  <Send size={14} className="mr-1" /> Make Request
                </button>
              </div>
              
              <div className="p-3 border rounded bg-white">
                {apiCallResult ? (
                  <div>
                    <div className={`text-sm font-medium ${
                      apiCallResult.status === 'loading' ? 'text-blue-500' : 'text-green-500'
                    }`}>
                      {apiCallResult.status === 'loading' ? 'Loading...' : 'Response'}
                    </div>
                    
                    {apiCallResult.status === 'success' && (
                      <>
                        <div className="my-2 p-2 bg-gray-100 rounded text-xs font-mono">
                          <div className="font-medium mb-1">Response Headers:</div>
                          {Object.entries(apiCallResult.headers).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-purple-700">{key}</span>: {value}
                            </div>
                          ))}
                        </div>
                        
                        <div className="my-2 p-2 bg-gray-100 rounded text-xs font-mono">
                          <div className="font-medium mb-1">Response Data:</div>
                          <pre>{JSON.stringify(apiCallResult.data, null, 2)}</pre>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Click "Make Request" to simulate an API call
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Browser API Call Limitations</h4>
              
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>Same-Origin Policy:</strong> Prevents requesting data from different domains</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>CORS Requirements:</strong> Server must include proper headers to allow cross-origin requests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>Request Limits:</strong> Browsers typically limit concurrent connections (usually 6-8 per domain)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-2">•</span>
                  <span><strong>Mixed Content:</strong> HTTPS pages cannot load resources from HTTP URLs</span>
                </li>
              </ul>
              
              <h4 className="font-medium mt-4">Distributed Tracing & Monitoring</h4>
              
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">•</span>
                  <span><strong>Trace IDs:</strong> Unique identifiers passed through services to track request flow</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">•</span>
                  <span><strong>Server Timing Headers:</strong> Add performance metrics to response headers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">•</span>
                  <span><strong>Performance API:</strong> Measure and log frontend performance metrics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">•</span>
                  <span><strong>Error Boundaries:</strong> Capture and report frontend errors without crashing the app</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tab content mapping
  const tabContent = {
    dom: (
      <div className="space-y-6">
        <StandardMarkDown 
          blockCitations={blockCitations}
          className={MARKDOWN_STYLE}
          text={`# The DOM and React
          
React's primary job is to make working with the DOM (Document Object Model) simpler and more efficient. As a backend engineer, you can think of the DOM as the API that browsers provide for manipulating what appears on the page.

## How the DOM Works

The DOM represents the page as a tree of nodes (HTML elements). It provides a programming interface for scripts to change the document structure, style, and content. When JavaScript modifies the DOM, the browser recalculates how the page should look and repaints the screen.

### The DOM Problem React Solves

**Direct DOM manipulation is:**
- Verbose (lots of code to make simple changes)
- Imperative (specifying exact steps to achieve a result)
- Error-prone (easy to miss edge cases)
- Inefficient (frequent repaints can be slow)

React addresses these issues with a declarative approach using a Virtual DOM.
`}
        />
        
        <DOMVisualization />
        
        <StandardMarkDown 
          blockCitations={blockCitations}
          className={MARKDOWN_STYLE}
          text={`## Transpiling and Build Tools

React code (especially JSX) needs to be transformed before browsers can run it. This is where transpilers and build tools come in:

### The Build Process

1. **Write Modern Code:** ES6+, JSX, TypeScript
2. **Transpiling:** Convert to compatible JavaScript (using Babel)
3. **Bundling:** Combine files and resolve dependencies (using Webpack/Vite)
4. **Optimization:** Minify, tree-shake, code-split
5. **Output:** Browser-compatible JavaScript

### Key Tools

- **Babel:** Converts JSX and modern JavaScript to browser-compatible code
- **Webpack:** The most established bundler with extensive plugins
- **Vite:** Modern, fast bundler using native ES modules during development
- **esbuild:** Ultra-fast JavaScript bundler used by many tools

### JSX Example

\`\`\`jsx
// JSX Code (What you write)
function Welcome() {
  return <h1 className="greeting">Hello, world!</h1>;
}

// Transpiled JavaScript (What runs in the browser)
function Welcome() {
  return React.createElement(
    'h1',
    { className: 'greeting' },
    'Hello, world!'
  );
}
\`\`\`

As a backend engineer, you can think of transpilation as similar to compiling code, but rather than going from higher to lower level, it's converting between different JavaScript dialects.

## Refs, Canvas, and CSS

### Refs in React

Refs provide direct access to DOM nodes when you need it. Think of them as escape hatches for cases where the declarative React approach isn't sufficient:

\`\`\`jsx
function TextInputWithFocusButton() {
  const inputRef = useRef(null);

  function focusInput() {
    // Direct DOM manipulation with ref
    inputRef.current.focus();
  }

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus the input</button>
    </>
  );
}
\`\`\`

### Canvas API

The Canvas API is used for drawing graphics via JavaScript. React components can use refs to get access to the canvas element:

\`\`\`jsx
function Canvas() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Draw on canvas using ctx
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 10, 150, 100);
  }, []);

  return <canvas ref={canvasRef} width="300" height="200" />;
}
\`\`\`

### CSS in React

There are multiple approaches to styling in React:

1. **CSS Files:** Traditional approach, imported into components
2. **CSS Modules:** Locally scoped CSS classes
3. **CSS-in-JS:** JavaScript for defining styles (styled-components, Emotion)
4. **Utility Classes:** Composing styles with utility classes (Tailwind CSS)

Each approach has tradeoffs between developer experience, performance, and maintainability.

## React's State Management

While the Virtual DOM is React's most visible feature, its state management is equally important. The component re-renders when its state or props change, creating a new Virtual DOM representation that gets reconciled with the real DOM. :antCitation[]{citations="react-docs-1"}
`}
        />
      </div>
    ),
    
    modules: (
      <div className="space-y-6">
        <StandardMarkDown 
          blockCitations={blockCitations}
          className={MARKDOWN_STYLE}
          text={`# Node Modules and Tree Shaking

## Understanding node_modules

The \`node_modules\` directory is where npm (Node Package Manager) stores the packages your project depends on. As a backend engineer, you're likely familiar with the concept, but frontend projects often have unique dependency management challenges.

### How Frontend Dependencies Work

1. **Package Definition:** \`package.json\` lists dependencies and their versions
2. **Installation:** \`npm install\` resolves and downloads packages to \`node_modules\`
3. **Importing:** Code imports specific functions or components from packages
4. **Bundling:** Build tools combine your code with dependencies into bundles

### The Frontend Dependency Challenge

Modern web applications often have hundreds of dependencies, which can lead to large JavaScript bundles. A typical React app might include:

- React and React DOM core libraries
- State management libraries (Redux, MobX, Zustand)
- UI component libraries (Material-UI, Chakra UI)
- Utility libraries (Lodash, date-fns)
- Many small supporting packages

Without optimization, this would result in multi-megabyte bundles, causing slow page loads. This is where tree shaking becomes essential.
`}
        />
        
        <TreeShakingVisualization />
        
        <StandardMarkDown 
          blockCitations={blockCitations}
          className={MARKDOWN_STYLE}
          text={`## Module Formats and Tree Shaking

Tree shaking relies on static module analysis, which requires ES Modules (ESM) format. :antCitation[]{citations="webpack-tree-shaking"}

### JavaScript Module Formats

1. **CommonJS (CJS):** Used by Node.js
   - Dynamic imports with \`require()\`
   - Not statically analyzable
   - Example: \`const React = require('react');\`

2. **ES Modules (ESM):** Modern standard
   - Static imports with \`import\` statement
   - Enables tree shaking
   - Example: \`import React from 'react';\`

### Why Tree Shaking Needs ES Modules

Tree shaking works because ESM imports/exports are:

- **Static:** Imports are declared at the top level
- **Immutable:** Imports cannot be modified at runtime
- **Analyzable:** Build tools can trace which exports are used

This allows build tools to:
1. Parse import/export statements
2. Build a dependency graph
3. Mark unused exports
4. Remove dead code during minification

### Optimizing for Tree Shaking

As a developer, you can enable better tree shaking by:

1. **Use ES Modules:** Write code using \`import\` and \`export\` statements
2. **Avoid side effects:** Mark modules without side effects in package.json
3. **Granular imports:** Import only what you need:
   ```javascript
   // Bad for tree shaking
   import _ from 'lodash';
   
   // Good for tree shaking
   import { map, filter } from 'lodash';
   
   // Even better (with supported libraries)
   import { map } from 'mathjs';
   import { filter } from 'd3';
   ```

4. **Use modern build tools:** Webpack, Rollup, or esbuild with proper configuration

## Beyond Tree Shaking: Advanced Optimization

Modern build tools offer additional optimizations:

1. **Code Splitting:** Breaking bundles into smaller chunks loaded on demand
2. **Dynamic Imports:** Loading modules only when needed
3. **Module Federation:** Sharing modules between separate applications
4. **Bundle Analysis:** Visualizing bundle contents to identify optimization opportunities

These techniques, combined with tree shaking, can dramatically reduce JavaScript bundle sizes, resulting in faster page loads and better user experience.
`}
        />
      </div>
    ),
    
    api: (
      <div className="space-y-6">
        <StandardMarkDown 
          blockCitations={blockCitations}
          className={MARKDOWN_STYLE}
          text={`# Browser API Limitations & Advanced Techniques

## Browser API Call Limitations

Browsers implement various security measures and performance optimizations that create limitations for frontend developers:

### Same-Origin Policy & CORS

The same-origin policy prevents JavaScript from making requests to a different domain than the one that served the page. This is a critical security feature that prevents malicious scripts from accessing data across sites.

**Cross-Origin Resource Sharing (CORS)** is a mechanism that allows servers to specify which origins can access their resources. For frontend developers, this means:

1. By default, browsers block cross-origin HTTP requests from scripts
2. Servers must include special headers to allow cross-origin requests
3. For complex requests, browsers send a preflight OPTIONS request first

### Performance Limitations

Browsers also impose limits for performance reasons:

1. **Connection Limits:** Browsers limit concurrent connections to a single domain (typically 6-8)
2. **Max Request Size:** There's a practical limit to request payload size
3. **Timeout Handling:** Browsers may timeout long-running requests
4. **Cookie Size:** Limited to 4KB per domain
5. **Local Storage:** Limited to 5MB per domain

### Mixed Content Restrictions

Modern browsers block mixed content - loading HTTP resources on HTTPS pages. This ensures that all content is encrypted and secure.
`}
        />
        
        <APILimitationsDemo />
        
        <StandardMarkDown 
          blockCitations={blockCitations}
          className={MARKDOWN_STYLE}
          text={`## Web Workers & Performance

Web Workers provide a way to run JavaScript in background threads, separate from the main execution thread. :antCitation[]{citations="mdn-web-workers"}

### Why Web Workers Matter

The main JavaScript thread handles:
- DOM updates
- User interactions (clicks, scrolling)
- Rendering
- All non-worker JavaScript execution

When this thread is busy with computation, the UI becomes unresponsive. Web Workers solve this by:
1. Running CPU-intensive tasks in separate threads
2. Keeping the main thread free for UI updates
3. Communicating with the main thread via message passing

### Types of Workers

1. **Dedicated Workers:** Used by a single script
2. **Shared Workers:** Accessible by multiple scripts/windows
3. **Service Workers:** Act as network proxies enabling offline functionality

### Web Worker Limitations

Workers cannot:
- Access the DOM directly
- Use certain browser APIs
- Directly access the parent page's variables
- Use methods like \`alert()\` or \`confirm()\`

## Distributed Tracing, Logging & Monitoring

### Frontend Observability

Modern frontend applications require robust monitoring to:
1. Track user experience
2. Debug production issues
3. Observe system behavior
4. Optimize performance

### Distributed Tracing

Distributed tracing tracks requests as they flow through various services:

1. **Trace Context:** Headers that propagate tracing information
   - \`traceparent\`: Contains trace ID, parent ID, and flags
   - \`tracestate\`: Vendor-specific tracing information

2. **OpenTelemetry:** Framework-agnostic way to instrument code
   - Standard API for generating telemetry data
   - Support for distributed context propagation
   - Integrations with popular monitoring tools

### Frontend Performance Monitoring

1. **Web Vitals:** Core metrics for user experience
   - LCP (Largest Contentful Paint): Loading performance
   - FID (First Input Delay): Interactivity
   - CLS (Cumulative Layout Shift): Visual stability

2. **Performance API:** Browser API for timing measurements
   - Navigation timing (page load events)
   - Resource timing (individual asset loading)
   - User timing (custom performance marks)

3. **Error Tracking:**
   - Global error handlers
   - React error boundaries
   - Promise rejection tracking
   - Services like Sentry, LogRocket, or Datadog

### Implementing Observability

A comprehensive frontend monitoring approach includes:

1. **Application Monitoring:**
   - Error tracking
   - Feature usage analytics
   - State transitions

2. **Network Monitoring:**
   - API call tracking
   - Response times
   - Error rates

3. **Performance Monitoring:**
   - Core Web Vitals
   - JavaScript execution time
   - Memory usage

4. **User Experience Monitoring:**
   - Custom events
   - User journeys
   - Session recordings

These techniques help bridge the gap between frontend and backend observability, giving engineers across the stack visibility into application behavior and performance.
`}
        />
      </div>
    )
  };

  return (
    <div className="flex justify-center min-h-screen antialiased relative" style={{ backgroundColor: "white", color: "#202020" }}>
      <div className="w-full max-w-4xl">
        <StandardMarkDown 
          blockCitations={blockCitations}
          className="py-6 px-10 text-center"
          text={`# Frontend Concepts for Backend Engineers
          
An interactive guide to key frontend concepts for system designers and backend engineers.`}
        />
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 ${activeTab === 'dom' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('dom')}
          >
            <div className="flex items-center">
              <Code size={18} className="mr-2" />
              <span>DOM & React</span>
            </div>
          </button>
          
          <button
            className={`py-3 px-6 ${activeTab === 'modules' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('modules')}
          >
            <div className="flex items-center">
              <Package size={18} className="mr-2" />
              <span>Modules & Tree Shaking</span>
            </div>
          </button>
          
          <button
            className={`py-3 px-6 ${activeTab === 'api' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('api')}
          >
            <div className="flex items-center">
              <Globe size={18} className="mr-2" />
              <span>Browser APIs & Workers</span>
            </div>
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-1">
          {tabContent[activeTab]}
        </div>
        
        {/* Footer with navigation help */}
        <div className="mt-6 mb-8 flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg text-gray-600 text-sm">
          <div>
            Click tabs above to navigate between topics
          </div>
          <div className="flex items-center">
            <span className="mr-2">Interactive examples included</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontendConceptsGuide;
