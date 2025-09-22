import React, { useState, useRef, useEffect } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const MermaidReactions = () => {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clickedElement, setClickedElement] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [diagramText, setDiagramText] = useState(`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E

    click A "handleNodeClick" "Start process"
    click B "handleNodeClick" "Make decision"
    click C "handleNodeClick" "Execute action 1"
    click D "handleNodeClick" "Execute action 2"
    click E "handleNodeClick" "Process complete"`);

  const containerRef = useRef(null);
  const diagramRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef(null);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const wasClickRef = useRef(false);

  // Debounce the diagram text to prevent expensive re-renders on every keystroke
  const debouncedDiagramText = useDebounce(diagramText, 500);

  // Add notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Handle node clicks - this function is called by Mermaid
  useEffect(() => {
    window.handleNodeClick = (nodeId) => {
      setClickedElement({ id: nodeId, type: 'node', content: nodeId });
      addNotification(`Clicked on node: ${nodeId}`, 'success');
      console.log('Node clicked:', nodeId);
    };

    return () => {
      delete window.handleNodeClick;
    };
  }, []);

  // Initialize Mermaid
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js';
    script.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose', // Allow click handlers
        theme: 'default'
      });
      renderDiagram();
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const renderDiagram = () => {
    if (window.mermaid && diagramRef.current) {
      diagramRef.current.innerHTML = debouncedDiagramText;
      diagramRef.current.removeAttribute('data-processed');
      window.mermaid.init(undefined, diagramRef.current).then(() => {
        // Add additional click handlers after Mermaid renders
        addClickHandlers();
      });
    }
  };

  const addClickHandlers = () => {
    if (!diagramRef.current) return;

    // Find all nodes and edges in the SVG
    const svg = diagramRef.current.querySelector('svg');
    if (!svg) return;

    // Add click handlers to nodes
    const nodes = svg.querySelectorAll('.node');
    nodes.forEach((node, index) => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!wasClickRef.current) {
          const nodeId = node.id || `node-${index}`;
          const textContent = node.querySelector('span')?.textContent || node.textContent || `Node ${index}`;
          setClickedElement({ id: nodeId, type: 'node', content: textContent });
          addNotification(`🟦 Node clicked: ${textContent}`, 'success');
        }
      });

      // Add hover effect
      node.addEventListener('mouseenter', () => {
        if (!isDragging) {
          node.style.opacity = '0.8';
        }
      });
      node.addEventListener('mouseleave', () => {
        node.style.opacity = '1';
      });
    });

    // Add click handlers to edges
    const edges = svg.querySelectorAll('.edgePath');
    edges.forEach((edge, index) => {
      edge.style.cursor = 'pointer';
      edge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!wasClickRef.current) {
          const edgeId = edge.id || `edge-${index}`;
          setClickedElement({ id: edgeId, type: 'edge', content: `Edge ${index}` });
          addNotification(`🔗 Edge clicked: Connection ${index}`, 'info');
        }
      });

      // Add hover effect to edges
      edge.addEventListener('mouseenter', () => {
        if (!isDragging) {
          const path = edge.querySelector('path');
          if (path) path.style.strokeWidth = '3px';
        }
      });
      edge.addEventListener('mouseleave', () => {
        const path = edge.querySelector('path');
        if (path) path.style.strokeWidth = '1.5px';
      });
    });
  };

  // Use debounced diagram text for rendering
  useEffect(() => {
    if (window.mermaid) {
      renderDiagram();
    }
  }, [debouncedDiagramText]);

  const updateTransform = (newScale, newX, newY) => {
    setScale(newScale);
    setTranslateX(newX);
    setTranslateY(newY);
  };

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 5);
    updateTransform(newScale, translateX, translateY);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.1);
    updateTransform(newScale, translateX, translateY);
  };

  const resetView = () => {
    updateTransform(1, 0, 0);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldScale = scale;
    let newScale;
    if (e.deltaY < 0) {
      newScale = Math.min(scale * 1.1, 5);
    } else {
      newScale = Math.max(scale / 1.1, 0.1);
    }

    const scaleChange = newScale / oldScale;
    const newX = mouseX - (mouseX - translateX) * scaleChange;
    const newY = mouseY - (mouseY - translateY) * scaleChange;

    updateTransform(newScale, newX, newY);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.controls') || e.target.closest('.modal')) return;
    wasClickRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - translateX, y: e.clientY - translateY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    wasClickRef.current = true; // Mark as drag, not click
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    updateTransform(scale, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset click flag after a short delay
    setTimeout(() => {
      wasClickRef.current = false;
    }, 100);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      initialDistanceRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchStartRef.current) {
      const newX = e.touches[0].clientX - touchStartRef.current.x;
      const newY = e.touches[0].clientY - touchStartRef.current.y;
      updateTransform(scale, newX, newY);
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.max(0.1, Math.min(5, initialScaleRef.current * (distance / initialDistanceRef.current)));
      updateTransform(newScale, translateX, translateY);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
      case '=':
      case '+':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetView();
        break;
      case 'Escape':
        setClickedElement(null);
        break;
    }
  };

  const updateDiagram = () => {
    setShowModal(false);
    // Trigger re-render in next tick
    setTimeout(renderDiagram, 0);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden border border-gray-300 relative">
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="transform-gpu transition-transform duration-100 ease-out origin-top-left"
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`
          }}
        >
          <div
            ref={diagramRef}
            className="mermaid"
          />
        </div>

        <div className="absolute top-4 right-4 flex gap-2 z-10 controls">
          <button
            className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-200"
            onClick={zoomIn}
          >
            🔍+
          </button>
          <button
            className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-200"
            onClick={zoomOut}
          >
            🔍-
          </button>
          <button
            className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-200"
            onClick={resetView}
          >
            🎯
          </button>
          <button
            className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-200"
            onClick={() => setShowModal(true)}
          >
            ✏️
          </button>
        </div>

        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
          {Math.round(scale * 100)}%
        </div>

        {/* Notifications */}
        <div className="absolute top-4 left-4 z-20 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-3 py-2 rounded-md text-sm font-medium shadow-lg transition-all duration-300 ${
                notification.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>

        {/* Element Info Panel */}
        {clickedElement && (
          <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">
                {clickedElement.type === 'node' ? '🟦 Node' : '🔗 Edge'}
              </h4>
              <button
                onClick={() => setClickedElement(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <strong>ID:</strong> {clickedElement.id}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Content:</strong> {clickedElement.content}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white p-6 rounded-lg w-4/5 max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Mermaid Diagram</h3>
            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Tip:</strong> Add click handlers with:</p>
              <code className="bg-gray-100 px-2 py-1 rounded">click NodeID "handleNodeClick" "Description"</code>
              <p className="mt-2 text-xs text-blue-600">⚡ Renders 500ms after you stop typing</p>
            </div>
            <textarea
              className="w-full h-48 p-2 border border-gray-300 rounded font-mono text-sm"
              value={diagramText}
              onChange={(e) => setDiagramText(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={updateDiagram}
              >
                Update
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MermaidReactions;