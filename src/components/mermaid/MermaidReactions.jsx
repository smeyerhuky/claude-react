import React, { useState, useRef, useEffect } from 'react';

const MermaidReactions = () => {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clickedElement, setClickedElement] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedElements, setSelectedElements] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [diagramText, setDiagramText] = useState(`flowchart TD
    Start([Start Process]) --> Check{Check Input}
    Check -->|Valid| Process[Process Data]
    Check -->|Invalid| Error[Show Error]
    Process --> Save[(Save to DB)]
    Save --> Success([Success!])
    Error --> End([End])
    Success --> End
    
    classDef startEnd fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef decision fill:#fff3e0
    classDef error fill:#ffebee
    
    class Start,Success,End startEnd
    class Process,Save process
    class Check decision
    class Error error`);
  
  const containerRef = useRef(null);
  const diagramRef = useRef(null);
  const popoverRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef(null);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const wasClickRef = useRef(false);

  // Selection management
  const toggleElementSelection = (elementId, isMultiSelect = false) => {
    setSelectedElements(prev => {
      const newSelection = new Set(prev);
      
      if (!isMultiSelect) {
        newSelection.clear();
      }
      
      if (prev.has(elementId)) {
        newSelection.delete(elementId);
      } else {
        newSelection.add(elementId);
      }
      
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedElements(new Set());
    setShowBulkActions(false);
  };

  const calculatePopoverPosition = (element, event) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // Position popover to the right of the element, but keep it in bounds
    let x = elementRect.right - containerRect.left + 10;
    let y = elementRect.top - containerRect.top;
    
    // Adjust if popover would go off-screen
    const popoverWidth = 250; // Approximate popover width
    const popoverHeight = 120; // Approximate popover height
    
    if (x + popoverWidth > containerRect.width) {
      // Position to the left of element instead
      x = elementRect.left - containerRect.left - popoverWidth - 10;
    }
    
    if (y + popoverHeight > containerRect.height) {
      // Position above the element
      y = elementRect.bottom - containerRect.top - popoverHeight;
    }
    
    // Ensure it stays within bounds
    x = Math.max(10, Math.min(x, containerRect.width - popoverWidth - 10));
    y = Math.max(10, Math.min(y, containerRect.height - popoverHeight - 10));
    
    return { x, y };
  };

  const setClickedElementWithPosition = (elementData, element, event) => {
    setClickedElement(elementData);
    const position = calculatePopoverPosition(element, event);
    setPopoverPosition(position);
  };

  // Click outside handler for popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clickedElement && 
          popoverRef.current && 
          !popoverRef.current.contains(event.target) &&
          !event.target.closest('.node') &&
          !event.target.closest('.edgePath')) {
        setClickedElement(null);
      }
    };

    if (clickedElement) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [clickedElement]);

  const selectElementsInRectangle = (rect) => {
    if (!diagramRef.current) return;
    
    const svg = diagramRef.current.querySelector('svg');
    if (!svg) return;

    const elements = [...svg.querySelectorAll('.node, .edgePath')];
    const selectedInRect = new Set();

    elements.forEach((element, index) => {
      const bbox = element.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Adjust for current transform
      const elementX = (bbox.left - containerRect.left - translateX) / scale;
      const elementY = (bbox.top - containerRect.top - translateY) / scale;
      const elementRight = elementX + bbox.width / scale;
      const elementBottom = elementY + bbox.height / scale;
      
      // Check if element intersects with selection rectangle
      if (elementRight >= rect.left && elementX <= rect.right &&
          elementBottom >= rect.top && elementY <= rect.bottom) {
        const elementId = element.id || `${element.classList.contains('node') ? 'node' : 'edge'}-${index}`;
        selectedInRect.add(elementId);
      }
    });

    setSelectedElements(selectedInRect);
  };

  // Bulk actions
  const bulkHighlight = () => {
    if (!diagramRef.current) return;
    const svg = diagramRef.current.querySelector('svg');
    if (!svg) return;

    selectedElements.forEach(elementId => {
      const element = svg.querySelector(`#${elementId}`) || 
                    svg.querySelector(`[data-id="${elementId}"]`);
      if (element) {
        element.style.filter = 'drop-shadow(0 0 8px #ff6b6b)';
        element.style.opacity = '0.8';
      }
    });
  };

  const bulkRemoveHighlight = () => {
    if (!diagramRef.current) return;
    const svg = diagramRef.current.querySelector('svg');
    if (!svg) return;

    const allElements = svg.querySelectorAll('.node, .edgePath');
    allElements.forEach(element => {
      element.style.filter = '';
      element.style.opacity = '';
    });
  };

  const bulkGroup = () => {
    // Feature in development
  };

  const bulkDelete = () => {
    // Feature in development
  };

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedElements.size > 1);
  }, [selectedElements]);

  // Handle node clicks - removed problematic global click handlers
  useEffect(() => {
    // Cleanup any existing handlers
    if (window.handleNodeClick) {
      delete window.handleNodeClick;
    }
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
      diagramRef.current.innerHTML = diagramText;
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
      const elementId = node.id || `node-${index}`;
      node.style.cursor = 'pointer';
      node.setAttribute('data-element-id', elementId);
      
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!wasClickRef.current) {
          const isMultiSelect = e.ctrlKey || e.metaKey;
          const textContent = node.querySelector('span')?.textContent || node.textContent || `Node ${index}`;
          
          if (isMultiSelect) {
            toggleElementSelection(elementId, true);
          } else {
            const elementData = { id: elementId, type: 'node', content: textContent };
            setClickedElementWithPosition(elementData, node, e);
            toggleElementSelection(elementId, false);
          }
        }
      });
      
      // Add hover effect and selection styling
      const updateNodeStyle = () => {
        const isSelected = selectedElements.has(elementId);
        if (isSelected) {
          node.style.outline = '3px solid #3b82f6';
          node.style.outlineOffset = '2px';
        } else {
          node.style.outline = '';
          node.style.outlineOffset = '';
        }
      };
      
      // Initial style update
      updateNodeStyle();
      
      node.addEventListener('mouseenter', () => {
        if (!isDragging && !isSelecting) {
          node.style.opacity = '0.8';
        }
      });
      node.addEventListener('mouseleave', () => {
        node.style.opacity = selectedElements.has(elementId) ? '0.9' : '1';
      });
    });

    // Add click handlers to edges
    const edges = svg.querySelectorAll('.edgePath');
    edges.forEach((edge, index) => {
      const elementId = edge.id || `edge-${index}`;
      edge.style.cursor = 'pointer';
      edge.setAttribute('data-element-id', elementId);
      
      edge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!wasClickRef.current) {
          const isMultiSelect = e.ctrlKey || e.metaKey;
          
          if (isMultiSelect) {
            toggleElementSelection(elementId, true);
          } else {
            const elementData = { id: elementId, type: 'edge', content: `Edge ${index}` };
            setClickedElementWithPosition(elementData, edge, e);
            toggleElementSelection(elementId, false);
          }
        }
      });
      
      // Add hover effect and selection styling
      const updateEdgeStyle = () => {
        const isSelected = selectedElements.has(elementId);
        const path = edge.querySelector('path');
        if (path) {
          if (isSelected) {
            path.style.stroke = '#3b82f6';
            path.style.strokeWidth = '3px';
          } else {
            path.style.stroke = '';
            path.style.strokeWidth = '1.5px';
          }
        }
      };
      
      // Initial style update
      updateEdgeStyle();
      
      edge.addEventListener('mouseenter', () => {
        if (!isDragging && !isSelecting) {
          const path = edge.querySelector('path');
          if (path && !selectedElements.has(elementId)) {
            path.style.strokeWidth = '2.5px';
          }
        }
      });
      edge.addEventListener('mouseleave', () => {
        const path = edge.querySelector('path');
        if (path && !selectedElements.has(elementId)) {
          path.style.strokeWidth = '1.5px';
        }
      });
    });
  };

  useEffect(() => {
    if (window.mermaid) {
      renderDiagram();
    }
  }, [diagramText]);

  // Update selection styles when selectedElements changes
  useEffect(() => {
    if (!diagramRef.current) return;
    const svg = diagramRef.current.querySelector('svg');
    if (!svg) return;

    // Update node styles
    const nodes = svg.querySelectorAll('.node');
    nodes.forEach((node, index) => {
      const elementId = node.getAttribute('data-element-id') || node.id || `node-${index}`;
      const isSelected = selectedElements.has(elementId);
      
      if (isSelected) {
        node.style.outline = '3px solid #3b82f6';
        node.style.outlineOffset = '2px';
        node.style.opacity = '0.9';
      } else {
        node.style.outline = '';
        node.style.outlineOffset = '';
        node.style.opacity = '1';
      }
    });

    // Update edge styles
    const edges = svg.querySelectorAll('.edgePath');
    edges.forEach((edge, index) => {
      const elementId = edge.getAttribute('data-element-id') || edge.id || `edge-${index}`;
      const isSelected = selectedElements.has(elementId);
      const path = edge.querySelector('path');
      
      if (path) {
        if (isSelected) {
          path.style.stroke = '#3b82f6';
          path.style.strokeWidth = '3px';
        } else {
          path.style.stroke = '';
          path.style.strokeWidth = '1.5px';
        }
      }
    });
  }, [selectedElements]);

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
    if (e.target.closest('.controls') || e.target.closest('.modal') || e.target.closest('.bulk-actions')) return;
    
    wasClickRef.current = false;
    
    // Check if starting selection rectangle (Shift key or empty space click)
    if (e.shiftKey || (!e.target.closest('.node') && !e.target.closest('.edgePath'))) {
      setIsSelecting(true);
      const rect = containerRef.current.getBoundingClientRect();
      setSelectionStart({
        x: (e.clientX - rect.left - translateX) / scale,
        y: (e.clientY - rect.top - translateY) / scale
      });
      setSelectionEnd(null);
      return;
    }
    
    // Regular pan behavior
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - translateX, y: e.clientY - translateY };
  };

  const handleMouseMove = (e) => {
    if (isSelecting) {
      const rect = containerRef.current.getBoundingClientRect();
      setSelectionEnd({
        x: (e.clientX - rect.left - translateX) / scale,
        y: (e.clientY - rect.top - translateY) / scale
      });
      return;
    }
    
    if (!isDragging) return;
    wasClickRef.current = true; // Mark as drag, not click
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    updateTransform(scale, newX, newY);
  };

  const handleMouseUp = (e) => {
    if (isSelecting) {
      setIsSelecting(false);
      
      if (selectionStart && selectionEnd) {
        const rect = {
          left: Math.min(selectionStart.x, selectionEnd.x),
          right: Math.max(selectionStart.x, selectionEnd.x),
          top: Math.min(selectionStart.y, selectionEnd.y),
          bottom: Math.max(selectionStart.y, selectionEnd.y)
        };
        
        if (Math.abs(rect.right - rect.left) > 10 && Math.abs(rect.bottom - rect.top) > 10) {
          selectElementsInRectangle(rect);
        }
      }
      
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }
    
    // Clear selection if clicking empty space (not Ctrl/Cmd) - but preserve clickedElement
    if (!wasClickRef.current && !e.target.closest('.node') && !e.target.closest('.edgePath') && !e.ctrlKey && !e.metaKey) {
      clearSelection();
    }
    
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
        clearSelection();
        break;
      case 'a':
      case 'A':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Select all elements
          if (diagramRef.current) {
            const svg = diagramRef.current.querySelector('svg');
            if (svg) {
              const allElements = [...svg.querySelectorAll('.node, .edgePath')];
              const allIds = new Set(allElements.map((el, index) => 
                el.id || `${el.classList.contains('node') ? 'node' : 'edge'}-${index}`
              ));
              setSelectedElements(allIds);
            }
          }
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedElements.size > 0) {
          e.preventDefault();
          // Delete functionality would go here
        }
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
    <div className="w-full h-screen overflow-hidden border border-gray-300 relative bg-gray-50">
      {/* Title Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 z-40 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wider">
          MERM<span className="text-yellow-300">AI</span>D
        </h1>
        <p className="text-blue-100 text-sm">Interactive Diagram Editor</p>
      </div>

      <div
        ref={containerRef}
        className={`w-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: 'calc(100vh - 80px)', marginTop: '80px' }}
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
          
          {/* Selection Rectangle */}
          {isSelecting && selectionStart && selectionEnd && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 pointer-events-none"
              style={{
                left: Math.min(selectionStart.x, selectionEnd.x),
                top: Math.min(selectionStart.y, selectionEnd.y),
                width: Math.abs(selectionEnd.x - selectionStart.x),
                height: Math.abs(selectionEnd.y - selectionStart.y)
              }}
            />
          )}
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

        {/* Bulk Actions Panel */}
        {showBulkActions && (
          <div className="absolute top-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg bulk-actions">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {selectedElements.size} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={bulkHighlight}
                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                ✨ Highlight
              </button>
              <button
                onClick={bulkRemoveHighlight}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                🧹 Clear
              </button>
              <button
                onClick={bulkGroup}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                🔗 Group
              </button>
              <button
                onClick={bulkDelete}
                className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}

        {/* Selection Info */}
        {selectedElements.size > 0 && !showBulkActions && (
          <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
            <span className="text-blue-800">
              {selectedElements.size} element{selectedElements.size !== 1 ? 's' : ''} selected
            </span>
            <div className="text-xs text-blue-600 mt-1">
              Ctrl+Click for more • Shift+Drag to select area
            </div>
          </div>
        )}

        {/* Element Info Popover */}
        {clickedElement && (
          <div 
            ref={popoverRef}
            className="absolute bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-xs z-30 pointer-events-auto"
            style={{
              left: popoverPosition.x,
              top: popoverPosition.y,
              transform: 'translateZ(0)' // Force GPU acceleration for smooth positioning
            }}
          >
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
            <p className="text-sm text-gray-600 mb-2">
              <strong>Content:</strong> {clickedElement.content}
            </p>
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              Click elsewhere to close
            </div>
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
              <p><strong>Diagram Syntax:</strong> Use standard Mermaid syntax</p>
              <div className="bg-gray-50 p-2 rounded text-xs mt-1">
                <code>flowchart TD</code><br/>
                <code>A[Node] --&gt; B{Decision}</code><br/>
                <code>B --&gt;|Yes| C[Action]</code>
              </div>
              <p className="mt-2"><strong>Selection Controls:</strong></p>
              <ul className="text-xs mt-1 space-y-1">
                <li>• <kbd className="bg-gray-100 px-1 rounded">Ctrl+Click</kbd> - Multi-select</li>
                <li>• <kbd className="bg-gray-100 px-1 rounded">Shift+Drag</kbd> - Area select</li>
                <li>• <kbd className="bg-gray-100 px-1 rounded">Ctrl+A</kbd> - Select all</li>
                <li>• <kbd className="bg-gray-100 px-1 rounded">Esc</kbd> - Clear selection</li>
              </ul>
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