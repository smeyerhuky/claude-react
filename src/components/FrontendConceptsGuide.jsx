import React, { useState, useEffect, useRef } from 'react';
import { Code, Database, Cpu, BarChart2, RefreshCw, PlusCircle, MinusCircle, ArrowRight, Eye, Info, AlertTriangle, X } from 'lucide-react';

const FrontendConceptsGuide = () => {
  // Sample DOM structure
  const initialTree = {
    id: 'root',
    type: 'div',
    props: { className: 'container' },
    children: [
      {
        id: 'header',
        type: 'header',
        props: { className: 'header' },
        children: [
          {
            id: 'nav',
            type: 'nav',
            props: { className: 'navigation' },
            children: [
              {
                id: 'home-link',
                type: 'a',
                props: { href: '#', className: 'nav-link' },
                content: 'Home',
                children: []
              },
              {
                id: 'about-link',
                type: 'a',
                props: { href: '#', className: 'nav-link' },
                content: 'About',
                children: []
              }
            ]
          },
          {
            id: 'title',
            type: 'h1',
            props: { className: 'title' },
            content: 'Welcome to Virtual DOM Explorer',
            children: []
          }
        ]
      },
      {
        id: 'main',
        type: 'main',
        props: { className: 'main-content' },
        children: [
          {
            id: 'article',
            type: 'article',
            props: { className: 'article' },
            children: [
              {
                id: 'article-title',
                type: 'h2',
                props: { className: 'article-title' },
                content: 'Understanding React Rendering',
                children: []
              },
              {
                id: 'article-p1',
                type: 'p',
                props: { className: 'paragraph' },
                content: 'The Virtual DOM is like a write-ahead log in databases.',
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'footer',
        type: 'footer',
        props: { className: 'footer' },
        children: [
          {
            id: 'copyright',
            type: 'p',
            props: { className: 'copyright' },
            content: '© 2025 Virtual DOM Explorer',
            children: []
          }
        ]
      }
    ]
  };

  // State for current and previous DOM trees
  const [currentTree, setCurrentTree] = useState(initialTree);
  const [previousTree, setPreviousTree] = useState(null);
  
  // State for selected node and operation
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [operation, setOperation] = useState('add'); // 'add', 'update', 'delete'
  
  // State for showing various views
  const [showDiff, setShowDiff] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newComponentType, setNewComponentType] = useState('div');
  const [newComponentName, setNewComponentName] = useState('');
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer', 'performance', 'code', 'rendered'
  
  // State for performance metrics
  const [renderMetrics, setRenderMetrics] = useState({
    virtualDOMTime: 0,
    diffingTime: 0,
    domUpdateTime: 0,
    nodesChanged: 0,
    totalNodes: 0
  });
  
  // Refs for measuring performance
  const performanceRef = useRef({
    startTime: 0,
    diffingStartTime: 0
  });
  
  // State for keeping track of operation history
  const [operationHistory, setOperationHistory] = useState([]);
  
  // Expanded nodes state
  const [expandedNodes, setExpandedNodes] = useState({root: true});
  
  // Toggle node expansion
  const toggleNodeExpansion = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };
  
  // Select a node
  const selectNode = (nodeId) => {
    setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
  };
  
  // Helper functions for tree operations
  
  // Deep clone a tree
  const cloneTree = (tree) => {
    return JSON.parse(JSON.stringify(tree));
  };
  
  // Find a node by ID
  const findNodeById = (tree, id) => {
    if (tree.id === id) {
      return tree;
    }
    
    if (tree.children) {
      for (const child of tree.children) {
        const found = findNodeById(child, id);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  };
  
  // Find parent of a node
  const findParentNode = (tree, id, parent = null) => {
    if (tree.id === id) {
      return parent;
    }
    
    if (tree.children) {
      for (const child of tree.children) {
        const found = findParentNode(child, id, tree);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  };
  
  // Show add dialog
  const showAddNodeDialog = () => {
    if (!selectedNodeId) return;
    setShowAddDialog(true);
  };
  
  // Add a new node
  const addNode = () => {
    if (!selectedNodeId) return;
    
    performanceRef.current.startTime = performance.now();
    
    // Save previous tree for diffing
    setPreviousTree(cloneTree(currentTree));
    
    const newTree = cloneTree(currentTree);
    const selectedNode = findNodeById(newTree, selectedNodeId);
    
    if (!selectedNode) return;
    
    // Create a new node
    const newNodeId = `node-${Date.now()}`;
    let newNode = {
      id: newNodeId,
      type: newComponentType,
      props: { className: newComponentName ? `${newComponentName}` : 'new-node' },
      children: []
    };
    
    // Add content for text elements
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'li', 'label'].includes(newComponentType)) {
      newNode.content = newComponentName ? newComponentName : 'New Component';
    }
    
    // Special handling for specific element types
    if (newComponentType === 'img') {
      newNode.props.src = 'https://example.com/image.jpg';
      newNode.props.alt = 'Image description';
    } else if (newComponentType === 'a') {
      newNode.props.href = '#';
    } else if (newComponentType === 'input') {
      newNode.props.type = 'text';
      newNode.props.placeholder = 'Enter text';
    }
    
    // Add to selected node's children
    if (!selectedNode.children) {
      selectedNode.children = [];
    }
    
    selectedNode.children.push(newNode);
    
    // Expand the parent node
    setExpandedNodes(prev => ({
      ...prev,
      [selectedNodeId]: true
    }));
    
    // Calculate performance metrics
    const virtualDOMTime = performance.now() - performanceRef.current.startTime;
    performanceRef.current.diffingStartTime = performance.now();
    
    // Update tree
    setCurrentTree(newTree);
    
    // Add to operation history
    setOperationHistory(prev => [
      ...prev, 
      { 
        type: 'add', 
        nodeId: newNodeId, 
        parentId: selectedNodeId,
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
    
    // Select the new node
    setSelectedNodeId(newNodeId);
    
    // Reset and close add dialog
    setNewComponentType('div');
    setNewComponentName('');
    setShowAddDialog(false);
  };
  
  // Update a node
  const updateNode = () => {
    if (!selectedNodeId) return;
    
    performanceRef.current.startTime = performance.now();
    
    // Save previous tree for diffing
    setPreviousTree(cloneTree(currentTree));
    
    const newTree = cloneTree(currentTree);
    const selectedNode = findNodeById(newTree, selectedNodeId);
    
    if (!selectedNode) return;
    
    // Update the node content
    if (selectedNode.content) {
      selectedNode.content = `${selectedNode.content} (Updated)`;
    } else if (selectedNode.props) {
      // Add a data attribute if no content
      selectedNode.props['data-updated'] = 'true';
      selectedNode.props.className = `${selectedNode.props.className || ''} updated`.trim();
    }
    
    // Calculate performance metrics
    const virtualDOMTime = performance.now() - performanceRef.current.startTime;
    performanceRef.current.diffingStartTime = performance.now();
    
    // Update tree
    setCurrentTree(newTree);
    
    // Add to operation history
    setOperationHistory(prev => [
      ...prev, 
      { 
        type: 'update', 
        nodeId: selectedNodeId,
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
  };
  
  // Delete a node
  const deleteNode = () => {
    if (!selectedNodeId || selectedNodeId === 'root') return;
    
    performanceRef.current.startTime = performance.now();
    
    // Save previous tree for diffing
    setPreviousTree(cloneTree(currentTree));
    
    const newTree = cloneTree(currentTree);
    const parentNode = findParentNode(newTree, selectedNodeId);
    
    if (!parentNode) return;
    
    // Find the index of the node to delete
    const nodeIndex = parentNode.children.findIndex(child => child.id === selectedNodeId);
    
    if (nodeIndex === -1) return;
    
    // Remove the node
    parentNode.children.splice(nodeIndex, 1);
    
    // Calculate performance metrics
    const virtualDOMTime = performance.now() - performanceRef.current.startTime;
    performanceRef.current.diffingStartTime = performance.now();
    
    // Update tree
    setCurrentTree(newTree);
    
    // Add to operation history
    setOperationHistory(prev => [
      ...prev, 
      { 
        type: 'delete', 
        nodeId: selectedNodeId,
        parentId: parentNode.id,
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
    
    // Clear selection
    setSelectedNodeId(null);
  };
  
  // Perform the selected operation
  const performOperation = () => {
    switch (operation) {
      case 'add':
        showAddNodeDialog();
        break;
      case 'update':
        updateNode();
        break;
      case 'delete':
        deleteNode();
        break;
      default:
        break;
    }
  };
  
  // Reset to initial state
  const resetTree = () => {
    setPreviousTree(cloneTree(currentTree));
    setCurrentTree(cloneTree(initialTree));
    setSelectedNodeId(null);
    setOperationHistory([]);
    setRenderMetrics({
      virtualDOMTime: 0,
      diffingTime: 0,
      domUpdateTime: 0,
      nodesChanged: 0,
      totalNodes: 0
    });
  };
  
  // Count the total number of nodes in a tree
  const countNodes = (tree) => {
    let count = 1; // Count the current node
    
    if (tree.children) {
      for (const child of tree.children) {
        count += countNodes(child);
      }
    }
    
    return count;
  };
  
  // Find differences between previous and current trees
  const findDifferences = (prevTree, currTree) => {
    if (!prevTree || !currTree) return [];
    
    const differences = [];
    
    // Compare tree structures and identify differences
    const compareTrees = (prev, curr, path = '') => {
      // Node was added or removed
      if (!prev || !curr) {
        differences.push({
          type: !prev ? 'added' : 'removed',
          path,
          nodeId: !prev ? curr.id : prev.id
        });
        return;
      }
      
      // Node was updated
      if (prev.id === curr.id) {
        // Check content changes
        if (prev.content !== curr.content) {
          differences.push({
            type: 'updated',
            path: `${path}/${curr.id}`,
            nodeId: curr.id,
            property: 'content'
          });
        }
        
        // Check props changes
        if (prev.props && curr.props) {
          // Compare className
          if (prev.props.className !== curr.props.className) {
            differences.push({
              type: 'updated',
              path: `${path}/${curr.id}`,
              nodeId: curr.id,
              property: 'className'
            });
          }
          
          // Compare other props
          const allProps = new Set([
            ...Object.keys(prev.props),
            ...Object.keys(curr.props)
          ]);
          
          for (const prop of allProps) {
            if (prop === 'className') continue; // Already checked
            
            if (prev.props[prop] !== curr.props[prop]) {
              differences.push({
                type: 'updated',
                path: `${path}/${curr.id}`,
                nodeId: curr.id,
                property: prop
              });
            }
          }
        }
        
        // Check children changes
        if (prev.children && curr.children) {
          // Map children by ID for easier comparison
          const prevChildrenMap = new Map(
            prev.children.map(child => [child.id, child])
          );
          
          const currChildrenMap = new Map(
            curr.children.map(child => [child.id, child])
          );
          
          // Check for removed children
          for (const [id, child] of prevChildrenMap) {
            if (!currChildrenMap.has(id)) {
              compareTrees(child, null, `${path}/${curr.id}`);
            }
          }
          
          // Check for added children
          for (const [id, child] of currChildrenMap) {
            if (!prevChildrenMap.has(id)) {
              compareTrees(null, child, `${path}/${curr.id}`);
            }
          }
          
          // Recursively compare common children
          for (const [id, currChild] of currChildrenMap) {
            if (prevChildrenMap.has(id)) {
              compareTrees(
                prevChildrenMap.get(id),
                currChild,
                `${path}/${curr.id}`
              );
            }
          }
        } else if (prev.children || curr.children) {
          // One has children, the other doesn't
          differences.push({
            type: 'updated',
            path: `${path}/${curr.id}`,
            nodeId: curr.id,
            property: 'children'
          });
        }
      }
    };
    
    compareTrees(prevTree, currTree);
    return differences;
  };
  
  // Update performance metrics after tree changes
  useEffect(() => {
    if (previousTree) {
      const diffingTime = performance.now() - performanceRef.current.diffingStartTime;
      const domUpdateTime = Math.random() * 5 + 1; // Simulate DOM update time
      
      const differences = findDifferences(previousTree, currentTree);
      const totalNodes = countNodes(currentTree);
      
      // Update metrics
      setRenderMetrics({
        virtualDOMTime: performance.now() - performanceRef.current.startTime - diffingTime,
        diffingTime,
        domUpdateTime,
        nodesChanged: differences.length,
        totalNodes
      });
    }
  }, [currentTree, previousTree]);
  
  // Render a node in the tree view
  const renderTreeNode = (node, depth = 0, isDiff = false) => {
    const isExpanded = expandedNodes[node.id] || false;
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    
    // Check if node has differences for diff highlighting
    let differenceType = null;
    if (isDiff && previousTree && showDiff) {
      const differences = findDifferences(previousTree, currentTree);
      const nodeDiff = differences.find(diff => diff.nodeId === node.id);
      if (nodeDiff) {
        differenceType = nodeDiff.type;
      }
    }
    
    // Determine node classes based on state
    let nodeClasses = "flex items-start py-1 rounded transition-colors";
    let tagClasses = "font-mono";
    
    if (isSelected) {
      nodeClasses += " bg-blue-100";
    }
    
    if (differenceType === 'added') {
      tagClasses += " text-green-600 font-bold";
      nodeClasses += " bg-green-50";
    } else if (differenceType === 'updated') {
      tagClasses += " text-amber-600 font-bold";
      nodeClasses += " bg-amber-50";
    } else if (differenceType === 'removed') {
      tagClasses += " text-red-600 font-bold line-through";
      nodeClasses += " bg-red-50";
    } else {
      tagClasses += " text-purple-600";
    }
    
    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div 
          className={nodeClasses}
          onClick={() => selectNode(node.id)}
        >
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button 
              className="mr-1 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(node.id);
              }}
            >
              {isExpanded ? 
                <MinusCircle size={16} className="text-gray-500" /> : 
                <PlusCircle size={16} className="text-gray-500" />
              }
            </button>
          ) : (
            <span className="w-4 mr-1"></span>
          )}
          
          {/* Node content */}
          <div>
            <span className={tagClasses}>
              &lt;{node.type}
              {node.props && Object.keys(node.props).length > 0 && (
                <span className="text-blue-600 text-xs ml-1">
                  {Object.entries(node.props)
                    .map(([key, value]) => `${key}="${value}"`)
                    .join(' ')}
                </span>
              )}
              &gt;
            </span>
            
            {/* Node content if any */}
            {node.content && (
              <span className="text-gray-700 ml-1 text-sm">{node.content}</span>
            )}
            
            {/* Closing tag if no children or not expanded */}
            {(!hasChildren || !isExpanded) && (
              <span className={tagClasses}>&lt;/{node.type}&gt;</span>
            )}
          </div>
        </div>
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="children ml-4">
            {node.children.map(child => renderTreeNode(child, depth + 1, isDiff))}
          </div>
        )}
        
        {/* Closing tag if has children and is expanded */}
        {hasChildren && isExpanded && (
          <div 
            className="ml-0 py-1"
            style={{ marginLeft: `${depth * 20}px` }}
          >
            <span className={tagClasses}>&lt;/{node.type}&gt;</span>
          </div>
        )}
      </div>
    );
  };
  
  // Generate a React element tree from the virtual DOM structure
  const generateRealDOM = (node) => {
    if (!node) return null;
    
    // Extract props from the node
    const { id, type, props, content, children } = node;
    
    // Create props object for the element
    const elementProps = { 
      key: id, 
      id,
      ...props,
      className: `${props?.className || ''} ${selectedNodeId === id ? 'rendered-selected' : ''}`
    };
    
    // Create child elements
    let childElements = [];
    
    // Add content as a child if it exists
    if (content) {
      childElements.push(content);
    }
    
    // Add children if they exist
    if (children && children.length > 0) {
      childElements = [
        ...childElements,
        ...children.map(child => generateRealDOM(child))
      ];
    }
    
    // Create the element
    return React.createElement(type, elementProps, ...childElements);
  };
  
  // Render the virtual DOM explorer view
  const renderExplorerView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left panel: Tree view */}
        <div className="col-span-2 bg-white border rounded-lg p-4 overflow-auto" style={{ maxHeight: '600px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Code size={18} className="mr-2" />
              {showDiff ? 'Virtual DOM with Diff Highlighting' : 'Virtual DOM Structure'}
            </h3>
            <div className="flex space-x-2">
              <button
                className={`px-2 py-1 rounded text-xs ${showDiff ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
                onClick={() => setShowDiff(!showDiff)}
              >
                {showDiff ? 'Hide Diff' : 'Show Diff'}
              </button>
            </div>
          </div>
          
          <div className="tree-container overflow-auto">
            {renderTreeNode(currentTree, 0, true)}
          </div>
        </div>
        
        {/* Right panel: Controls and info */}
        <div className="flex flex-col space-y-4">
          {/* Operations panel */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Cpu size={18} className="mr-2" />
              DOM Operations
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Selected Node: <span className="font-mono text-blue-600">{selectedNodeId || 'None'}</span>
                </p>
                
                <div className="flex space-x-2 mb-4">
                  <button
                    className={`px-3 py-1 rounded text-sm ${operation === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setOperation('add')}
                  >
                    Add
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${operation === 'update' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setOperation('update')}
                  >
                    Update
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${operation === 'delete' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setOperation('delete')}
                  >
                    Delete
                  </button>
                </div>
                
                <button
                  className="w-full px-3 py-2 bg-green-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={performOperation}
                  disabled={!selectedNodeId}
                >
                  Execute Operation
                </button>
              </div>
              
              <div className="pt-2 border-t">
                <button
                  className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  onClick={resetTree}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset DOM Tree
                </button>
              </div>
            </div>
          </div>
          
          {/* Performance metrics panel */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <BarChart2 size={18} className="mr-2" />
              Performance Metrics
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Virtual DOM Update:</span>
                <span className="font-mono">{renderMetrics.virtualDOMTime.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Diffing Algorithm:</span>
                <span className="font-mono">{renderMetrics.diffingTime.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DOM Update:</span>
                <span className="font-mono">{renderMetrics.domUpdateTime.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nodes Changed:</span>
                <span className="font-mono">{renderMetrics.nodesChanged}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Nodes:</span>
                <span className="font-mono">{renderMetrics.totalNodes}</span>
              </div>
            </div>
          </div>
          
          {/* Operation history panel */}
          <div className="bg-white border rounded-lg p-4 overflow-auto" style={{ maxHeight: '200px' }}>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Database size={18} className="mr-2" />
              Operation Log
            </h3>
            
            {operationHistory.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {operationHistory.map((op, index) => (
                  <li key={index} className="flex">
                    <span className="text-gray-500 text-xs mr-2">{op.timestamp}</span>
                    <span className={`
                      px-1.5 py-0.5 rounded text-xs mr-2
                      ${op.type === 'add' ? 'bg-green-100 text-green-800' : 
                        op.type === 'update' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'}
                    `}>
                      {op.type}
                    </span>
                    <span className="font-mono text-xs">
                      {op.type === 'add' ? 
                        `${op.nodeId} to ${op.parentId}` : 
                        op.type === 'delete' ? 
                        `${op.nodeId} from ${op.parentId}` : 
                        op.nodeId}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No operations performed yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the code view
  const renderCodeView = () => {
    // Convert current tree to React JSX-like code
    const generateJSX = (node, depth = 0) => {
      const indent = '  '.repeat(depth);
      let jsx = `${indent}<${node.type}`;
      
      // Add props
      if (node.props && Object.keys(node.props).length > 0) {
        Object.entries(node.props).forEach(([key, value]) => {
          jsx += ` ${key}="${value}"`;
        });
      }
      
      // Handle self-closing or nested elements
      if (!node.children || node.children.length === 0) {
        if (node.content) {
          jsx += `>${node.content}</${node.type}>`;
        } else {
          jsx += ' />';
        }
      } else {
        jsx += '>\n';
        
        // Add children
        node.children.forEach(child => {
          jsx += generateJSX(child, depth + 1) + '\n';
        });
        
        // Closing tag
        jsx += `${indent}</${node.type}>`;
      }
      
      return jsx;
    };
    
    const jsxCode = generateJSX(currentTree);
    
    // Generate React component code
    const reactComponentCode = `import React from 'react';

// This is equivalent to the current Virtual DOM state
const MyComponent = () => {
  return (
${jsxCode}
  );
};

export default MyComponent;`;
    
    return (
      <div className="bg-white border rounded-lg p-4 overflow-auto" style={{ maxHeight: '600px' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Code size={18} className="mr-2" />
          Equivalent React Component
        </h3>
        
        <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto font-mono text-left">
          {reactComponentCode}
        </pre>
      </div>
    );
  };
  
  // Render the performance view
  const renderPerformanceView = () => {
    return (
      <div className="bg-white border rounded-lg p-4 overflow-auto" style={{ maxHeight: '600px' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart2 size={18} className="mr-2" />
          Reconciliation Process Visualization
        </h3>
        
        <div className="space-y-6">
          {/* Transaction visualization */}
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">React Rendering as a Transaction</h4>
            
            <div className="flex flex-wrap items-center justify-center gap-1 md:gap-3">
              <div className="bg-blue-100 border border-blue-300 rounded p-2 text-center text-sm w-28 md:w-32">
                <p className="font-medium">State Change</p>
                <p className="text-xs text-gray-500">Component re-render triggered</p>
              </div>
              
              <ArrowRight className="text-gray-400" />
              
              <div className="bg-green-100 border border-green-300 rounded p-2 text-center text-sm w-28 md:w-32">
                <p className="font-medium">Virtual DOM</p>
                <p className="text-xs text-gray-500">New tree constructed</p>
              </div>
              
              <ArrowRight className="text-gray-400" />
              
              <div className="bg-amber-100 border border-amber-300 rounded p-2 text-center text-sm w-28 md:w-32">
                <p className="font-medium">Diffing</p>
                <p className="text-xs text-gray-500">Changes identified</p>
              </div>
              
              <ArrowRight className="text-gray-400" />
              
              <div className="bg-purple-100 border border-purple-300 rounded p-2 text-center text-sm w-28 md:w-32">
                <p className="font-medium">Reconciliation</p>
                <p className="text-xs text-gray-500">DOM updates batched</p>
              </div>
              
              <ArrowRight className="text-gray-400" />
              
              <div className="bg-red-100 border border-red-300 rounded p-2 text-center text-sm w-28 md:w-32">
                <p className="font-medium">Commit</p>
                <p className="text-xs text-gray-500">DOM updated in batch</p>
              </div>
            </div>
          </div>
          
          {/* Database comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Database Transaction</h4>
              
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">1</span>
                  <span>Transaction begins with proposed changes</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">2</span>
                  <span>Write-ahead log records intended changes</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">3</span>
                  <span>Transaction validation checks consistency</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">4</span>
                  <span>Changes committed in a batch for efficiency</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">5</span>
                  <span>Indexes and cache updated if needed</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">React Rendering</h4>
              
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">1</span>
                  <span>Component state/props change triggers re-render</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">2</span>
                  <span>Virtual DOM creates new UI representation</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">3</span>
                  <span>Diffing algorithm compares old and new trees</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">4</span>
                  <span>Changes batched into minimal update operations</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 shrink-0">5</span>
                  <span>Actual DOM updated in a single reconciliation pass</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Performance metrics visualization */}
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Current Operation Performance</h4>
            
            {renderMetrics.nodesChanged > 0 ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Virtual DOM Update</span>
                    <span className="font-mono">{renderMetrics.virtualDOMTime.toFixed(2)} ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded" 
                      style={{ 
                        width: `${Math.min(100, renderMetrics.virtualDOMTime * 2)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Diffing Algorithm</span>
                    <span className="font-mono">{renderMetrics.diffingTime.toFixed(2)} ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-4">
                    <div 
                      className="bg-amber-500 h-4 rounded" 
                      style={{ 
                        width: `${Math.min(100, renderMetrics.diffingTime * 2)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>DOM Update</span>
                    <span className="font-mono">{renderMetrics.domUpdateTime.toFixed(2)} ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-4">
                    <div 
                      className="bg-red-500 h-4 rounded" 
                      style={{ 
                        width: `${Math.min(100, renderMetrics.domUpdateTime * 10)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm pt-2">
                  <span>Efficiency Ratio:</span>
                  <span className="font-mono">
                    {renderMetrics.nodesChanged} / {renderMetrics.totalNodes} nodes updated
                    ({((renderMetrics.nodesChanged / renderMetrics.totalNodes) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No operations performed yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the preview of the actual DOM
  const renderRenderedView = () => {
    // Generate a real DOM element from our virtual DOM
    const renderedElement = generateRealDOM(currentTree);
    
    // CSS for the rendered preview
    const previewStyles = `
      .rendered-preview {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        border: 1px solid #e5e7eb;
        background-color: white;
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .rendered-preview .container {
        margin: 0 auto;
        max-width: 100%;
      }
      
      .rendered-preview .header {
        padding: 1rem 0;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 1rem;
      }
      
      .rendered-preview .navigation {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }
      
      .rendered-preview .nav-link {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 500;
      }
      
      .rendered-preview .title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0.5rem 0;
      }
      
      .rendered-preview .main-content {
        padding: 1rem 0;
      }
      
      .rendered-preview .article {
        margin-bottom: 1rem;
      }
      
      .rendered-preview .article-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0.5rem 0;
      }
      
      .rendered-preview .paragraph {
        margin: 0.5rem 0;
        line-height: 1.5;
      }
      
      .rendered-preview .footer {
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        margin-top: 1rem;
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .rendered-preview .copyright {
        margin: 0;
      }
      
      .rendered-selected {
        outline: 2px solid #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
        transition: all 0.2s ease-in-out;
      }
      
      .rendered-preview .new-node {
        padding: 0.5rem;
        border: 1px dashed #3b82f6;
        border-radius: 0.25rem;
        margin: 0.5rem 0;
      }
      
      .rendered-preview .updated {
        background-color: rgba(245, 158, 11, 0.1);
        outline: 2px solid #f59e0b;
      }
    `;
    
    return (
      <div className="bg-white border rounded-lg p-4 overflow-auto" style={{ maxHeight: '600px' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Eye size={18} className="mr-2" />
          Rendered DOM Preview
        </h3>
        
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="text-sm">
            This preview shows how the current Virtual DOM structure would render in the browser. 
            The selected node is highlighted with a blue outline. Try selecting nodes in the explorer 
            view to see them highlighted here, or modify the DOM to see the changes reflected in real-time.
          </p>
        </div>
        
        <style>{previewStyles}</style>
        
        <div className="rendered-preview">
          {renderedElement}
        </div>
      </div>
    );
  };
  
  // Render add component dialog
  const renderAddDialog = () => {
    if (!showAddDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Add New Component</h3>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowAddDialog(false)}
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newComponentType}
                onChange={(e) => setNewComponentType(e.target.value)}
              >
                <option value="div">div - Container</option>
                <option value="section">section - Semantic section</option>
                <option value="article">article - Content article</option>
                <option value="p">p - Paragraph</option>
                <option value="h1">h1 - Heading 1</option>
                <option value="h2">h2 - Heading 2</option>
                <option value="h3">h3 - Heading 3</option>
                <option value="span">span - Inline text</option>
                <option value="a">a - Link</option>
                <option value="button">button - Button</option>
                <option value="input">input - Input field</option>
                <option value="img">img - Image</option>
                <option value="ul">ul - Unordered list</option>
                <option value="ol">ol - Ordered list</option>
                <option value="li">li - List item</option>
                <option value="nav">nav - Navigation</option>
                <option value="header">header - Header</option>
                <option value="footer">footer - Footer</option>
                <option value="form">form - Form</option>
                <option value="label">label - Form label</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Component Name/Content</label>
              <input 
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                placeholder="Enter content or class name..."
              />
              <p className="text-xs text-gray-500 mt-1">
                For text elements (p, h1, etc.), this will be the content. For other elements, this will be the CSS class.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={addNode}
            >
              Add Component
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Virtual DOM Explorer</h1>
        <p className="text-gray-600">
          For backend engineers: This interactive tool demonstrates how React's Virtual DOM works, 
          similar to database transaction planning and differential updates.
        </p>
      </div>
      
      {/* Main content tabs */}
      <div className="mb-4 border-b">
        <div className="flex space-x-4">
          <button
            className={`pb-2 px-1 ${activeTab === 'explorer' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('explorer')}
          >
            <span className="flex items-center">
              <Code size={16} className="mr-2" />
              DOM Explorer
            </span>
          </button>
          
          <button
            className={`pb-2 px-1 ${activeTab === 'rendered' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('rendered')}
          >
            <span className="flex items-center">
              <Eye size={16} className="mr-2" />
              Rendered Preview
            </span>
          </button>
          
          <button
            className={`pb-2 px-1 ${activeTab === 'performance' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('performance')}
          >
            <span className="flex items-center">
              <BarChart2 size={16} className="mr-2" />
              Reconciliation Process
            </span>
          </button>
          
          <button
            className={`pb-2 px-1 ${activeTab === 'code' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('code')}
          >
            <span className="flex items-center">
              <Database size={16} className="mr-2" />
              React Component
            </span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="main-content">
        {activeTab === 'explorer' && renderExplorerView()}
        {activeTab === 'rendered' && renderRenderedView()}
        {activeTab === 'performance' && renderPerformanceView()}
        {activeTab === 'code' && renderCodeView()}
      </div>
      
      {/* Backend dev guide */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <Info size={18} className="mr-2 text-blue-500" />
          For Backend Engineers: Key Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm mb-1">What's Happening Behind the Scenes</h3>
            <ul className="text-sm space-y-1">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>React maintains a lightweight copy of the DOM in memory (Virtual DOM)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Changes to state/props are first applied to this virtual representation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>A diffing algorithm identifies exactly what changed (like a database diff)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Only the necessary DOM operations are performed, in a batched update</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-1">Backend Parallels</h3>
            <ul className="text-sm space-y-1">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Similar to transaction planning before committing to a database</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Comparable to copy-on-write optimizations in data systems</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Memoization is like query result caching in databases</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>React's component structure mirrors service-oriented architecture</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-blue-200 text-sm flex items-start">
          <AlertTriangle size={16} className="text-amber-500 mr-2 mt-0.5" />
          <span>
            <strong>Why This Matters:</strong> Understanding the Virtual DOM helps backend engineers design APIs that work efficiently with React's update model. 
            For example, providing data in a shape that minimizes component re-renders can significantly improve frontend performance.
          </span>
        </div>
      </div>
      
      {/* Add Component Dialog */}
      {renderAddDialog()}
    </div>
  );
};

export default FrontendConceptsGuide;