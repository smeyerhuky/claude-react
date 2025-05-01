import React, { useState, useEffect, useRef } from 'react';

// Color constants
const COLORS = { 
  RED: '#B54369', 
  PURPLE: '#4D44AB', 
  BLUE: '#1B67B2', 
  BLACK: '#202020', 
  GREEN: '#568C1C', 
  ORANGE: '#C77F1A' 
};

const DomVirtualDomExplorer = () => {
  // Form state
  const [formData, setFormData] = useState({
    title: "My Product",
    price: 25,
    inStock: true,
    quantity: 1
  });

  // Track render counts for performance demonstration
  const [renderCounts, setRenderCounts] = useState({
    directDOM: 0,
    virtualDOM: 0
  });

  // Refs for direct DOM manipulation demo
  const directDomRef = useRef(null);
  const virtualDomContainerRef = useRef(null);

  // Track animation state
  const [showDiff, setShowDiff] = useState(false);
  const [highlightedElements, setHighlightedElements] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : 
                   type === 'number' ? Number(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Reset animation states
    setShowDiff(false);
    setHighlightedElements([]);
    
    // Show comparison after a brief delay
    setTimeout(() => {
      setShowDiff(true);
      
      // Determine which elements changed based on the field that was updated
      const changed = [];
      if (name === 'title') changed.push('title');
      if (name === 'price') changed.push('price');
      if (name === 'inStock') changed.push('stock-status');
      if (name === 'quantity') changed.push('quantity');
      
      setHighlightedElements(changed);
      
      // Update render counts to show performance difference
      setRenderCounts(prev => ({
        directDOM: prev.directDOM + 5, // Direct DOM updates multiple elements
        virtualDOM: prev.virtualDOM + 1 // React just rerenders once
      }));
      
      // Show comparison metrics
      setShowComparison(true);
    }, 500);
    
    // Also update the direct DOM example
    updateDirectDOM(name, newValue);
  };
  
  // Function to update DOM directly (to show the alternative)
  const updateDirectDOM = (field, value) => {
    if (!directDomRef.current) return;
    
    // Update the appropriate element directly
    if (field === 'title') {
      const titleEl = directDomRef.current.querySelector('.product-title');
      if (titleEl) titleEl.textContent = value;
    }
    else if (field === 'price') {
      const priceEl = directDomRef.current.querySelector('.product-price');
      if (priceEl) priceEl.textContent = `$${value.toFixed(2)}`;
    }
    else if (field === 'inStock') {
      const stockEl = directDomRef.current.querySelector('.product-stock');
      if (stockEl) {
        stockEl.textContent = value ? 'In Stock' : 'Out of Stock';
        stockEl.style.color = value ? 'green' : 'red';
      }
    }
    else if (field === 'quantity') {
      const quantityEl = directDomRef.current.querySelector('.product-quantity');
      if (quantityEl) quantityEl.textContent = value;
      
      // Also update total price (showing how direct DOM requires multiple updates)
      const totalEl = directDomRef.current.querySelector('.product-total');
      if (totalEl) totalEl.textContent = `$${(formData.price * value).toFixed(2)}`;
    }
  };
  
  // Initialize direct DOM example
  useEffect(() => {
    if (directDomRef.current) {
      const { title, price, inStock, quantity } = formData;
      
      const titleEl = directDomRef.current.querySelector('.product-title');
      const priceEl = directDomRef.current.querySelector('.product-price');
      const stockEl = directDomRef.current.querySelector('.product-stock');
      const quantityEl = directDomRef.current.querySelector('.product-quantity');
      const totalEl = directDomRef.current.querySelector('.product-total');
      
      if (titleEl) titleEl.textContent = title;
      if (priceEl) priceEl.textContent = `$${price.toFixed(2)}`;
      if (stockEl) {
        stockEl.textContent = inStock ? 'In Stock' : 'Out of Stock';
        stockEl.style.color = inStock ? 'green' : 'red';
      }
      if (quantityEl) quantityEl.textContent = quantity;
      if (totalEl) totalEl.textContent = `$${(price * quantity).toFixed(2)}`;
    }
  }, []);
  
  // Represents a simplified version of how React's Virtual DOM works
  const VirtualDomNode = ({ tag, props, children, indent = 0, name = null, highlight = false }) => {
    const className = `${highlight ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-200'} border rounded-md p-2 mb-2 transition-colors duration-300`;
    const indentStyle = { marginLeft: `${indent * 20}px` };
    
    return (
      <div className={className} style={indentStyle} data-node-name={name}>
        <div className="flex items-start">
          <span className="text-purple-600 font-mono">&lt;{tag}</span>
          {Object.entries(props).length > 0 && (
            <div className="ml-2">
              {Object.entries(props).map(([key, value], i) => (
                <span key={i} className="text-blue-600 font-mono">
                  {" "}{key}=
                  <span className="text-green-600">
                    "{typeof value === 'string' ? value : JSON.stringify(value)}"
                  </span>
                </span>
              ))}
            </div>
          )}
          <span className="text-purple-600 font-mono">&gt;</span>
        </div>
        
        <div className="ml-4">
          {typeof children === 'string' ? (
            <span className="text-gray-800 font-mono">{children}</span>
          ) : (
            Array.isArray(children) ? 
              children.map((child, i) => (
                <VirtualDomNode 
                  key={i} 
                  {...child} 
                  indent={indent + 1} 
                  highlight={highlight || (highlightedElements.includes(child.name) && showDiff)}
                />
              )) : null
          )}
        </div>
        
        <div className="text-purple-600 font-mono">&lt;/{tag}&gt;</div>
      </div>
    );
  };
  
  // Generate the virtual DOM representation based on current state
  const generateVirtualDOM = () => {
    return {
      tag: 'div',
      props: { className: 'product-card' },
      children: [
        {
          tag: 'h2',
          props: { className: 'product-title' },
          children: formData.title,
          name: 'title'
        },
        {
          tag: 'div',
          props: { className: 'product-details' },
          children: [
            {
              tag: 'span',
              props: { className: 'product-price' },
              children: `$${formData.price.toFixed(2)}`,
              name: 'price'
            },
            {
              tag: 'span',
              props: { 
                className: 'product-stock',
                style: { color: formData.inStock ? 'green' : 'red' }
              },
              children: formData.inStock ? 'In Stock' : 'Out of Stock',
              name: 'stock-status'
            }
          ]
        },
        {
          tag: 'div',
          props: { className: 'product-quantity-wrapper' },
          children: [
            {
              tag: 'span',
              props: { className: 'quantity-label' },
              children: 'Quantity: '
            },
            {
              tag: 'span',
              props: { className: 'product-quantity' },
              children: formData.quantity.toString(),
              name: 'quantity'
            }
          ]
        },
        {
          tag: 'div',
          props: { className: 'product-total-wrapper' },
          children: [
            {
              tag: 'span',
              props: { className: 'total-label' },
              children: 'Total: '
            },
            {
              tag: 'span',
              props: { className: 'product-total' },
              children: `$${(formData.price * formData.quantity).toFixed(2)}`,
              name: 'total'
            }
          ]
        }
      ]
    };
  };

  const virtualDomJSON = generateVirtualDOM();

  return (
    <div className="flex justify-center min-h-screen antialiased relative" style={{ backgroundColor: "white", color: "#202020" }}>
      <div className="w-full max-w-6xl">
        {/* Introduction Section */}
        <div className="py-2 px-4">
          <h1 className="text-2xl font-bold mb-2">DOM and Virtual DOM Explorer</h1>
          
          <h2 className="text-xl font-bold mb-2">Why This Matters for Backend Engineers</h2>
          <p className="mb-4">
            As a backend engineer, you're familiar with optimizing database operations and transaction planning. 
            The Virtual DOM operates on similar principles: it creates an abstraction layer that minimizes expensive operations.
          </p>
          <p className="mb-4">
            Just as you wouldn't update a database row 5 times when you could batch changes in a single transaction, 
            React avoids multiple expensive DOM manipulations by comparing a lightweight in-memory representation (Virtual DOM) 
            against the previous state, then applying only the necessary changes to the actual DOM.
          </p>
          <p className="mb-6">
            This interactive demo shows you how React's reconciliation process works at a high level, 
            comparing it with direct DOM manipulation techniques.
          </p>

          <h2 className="text-xl font-bold mb-2">How the Reconciliation Process Works</h2>
          <ol className="list-decimal ml-5 mb-4">
            <li><strong>Component State Changes</strong>: When state or props update, React creates a new Virtual DOM tree</li>
            <li><strong>Diffing Algorithm</strong>: React compares the new Virtual DOM with the previous one</li>
            <li><strong>Reconciliation</strong>: It identifies the minimum set of changes needed</li>
            <li><strong>Batched Updates</strong>: React efficiently applies only the necessary changes to the real DOM</li>
          </ol>
          <p className="mb-4">
            Try changing values in the form below to see this process in action. Notice how only the affected parts 
            of the Virtual DOM get highlighted, and how React renders more efficiently than direct DOM manipulation.
          </p>
        </div>

        {/* Interactive Form */}
        <div className="bg-gray-50 rounded-lg p-4 mx-4 mb-4 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Modify Product Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="inStock"
                id="inStock"
                checked={formData.inStock}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                In Stock
              </label>
            </div>
          </div>
        </div>

        {/* DOM Visualization */}
        <div className="flex flex-col lg:flex-row gap-4 px-4 mb-6">
          {/* Virtual DOM Side */}
          <div className="lg:w-1/2">
            <h3 className="text-lg font-semibold mb-1 text-center">Virtual DOM</h3>
            <div className="border border-gray-300 rounded-md p-3 bg-gray-50 h-auto max-h-screen overflow-auto" ref={virtualDomContainerRef}>
              <VirtualDomNode {...virtualDomJSON} />
            </div>
            <div className="mt-1 text-center text-sm text-gray-600">
              <span className="font-semibold">Render count: </span>
              <span className="text-green-600 font-semibold">{renderCounts.virtualDOM}</span>
            </div>
          </div>
          
          {/* Real DOM Side */}
          <div className="lg:w-1/2">
            <h3 className="text-lg font-semibold mb-1 text-center">Real DOM Result</h3>
            <div className="border border-gray-300 rounded-md p-3 bg-white h-auto max-h-screen overflow-auto">
              <div className="mb-3">
                <h4 className="text-base font-semibold mb-1 text-center">React-managed DOM</h4>
                <div className="border border-gray-200 rounded p-3 bg-white">
                  <h2 className={`text-xl font-bold mb-2 ${highlightedElements.includes('title') && showDiff ? 'bg-yellow-100 px-1 py-1 rounded' : ''}`}>
                    {formData.title}
                  </h2>
                  <div className="flex justify-between mb-3">
                    <span className={`font-semibold ${highlightedElements.includes('price') && showDiff ? 'bg-yellow-100 px-1 py-1 rounded' : ''}`}>
                      ${formData.price.toFixed(2)}
                    </span>
                    <span 
                      className={`${formData.inStock ? 'text-green-600' : 'text-red-600'} ${highlightedElements.includes('stock-status') && showDiff ? 'bg-yellow-100 px-1 py-1 rounded' : ''}`}
                    >
                      {formData.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="mb-1">
                    <span>Quantity: </span>
                    <span className={`font-semibold ${highlightedElements.includes('quantity') && showDiff ? 'bg-yellow-100 px-1 py-1 rounded' : ''}`}>
                      {formData.quantity}
                    </span>
                  </div>
                  <div>
                    <span>Total: </span>
                    <span className="font-semibold">
                      ${(formData.price * formData.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-base font-semibold mb-1 text-center">Direct DOM Manipulation</h4>
                <div className="border border-gray-200 rounded p-3 bg-white" ref={directDomRef}>
                  <h2 className="product-title text-xl font-bold mb-2"></h2>
                  <div className="flex justify-between mb-3">
                    <span className="product-price font-semibold"></span>
                    <span className="product-stock"></span>
                  </div>
                  <div className="mb-1">
                    <span>Quantity: </span>
                    <span className="product-quantity font-semibold"></span>
                  </div>
                  <div>
                    <span>Total: </span>
                    <span className="product-total font-semibold"></span>
                  </div>
                </div>
              </div>
              <div className="mt-1 text-center text-sm text-gray-600">
                <span className="font-semibold">DOM operations: </span>
                <span className="text-red-600 font-semibold">{renderCounts.directDOM}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation of what's happening */}
        {showComparison && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">What Just Happened?</h3>
            <p className="mb-1">When you changed a value in the form:</p>
            <ol className="list-decimal ml-4 mb-2 space-y-1">
              <li>React created a new Virtual DOM tree with your updated values</li>
              <li>It compared this new tree with the previous Virtual DOM</li>
              <li>It identified only the highlighted elements needed to change</li>
              <li>React updated only those specific DOM elements</li>
              <li>The direct DOM approach required separate operations for each affected element</li>
            </ol>
            <p className="font-semibold text-sm">
              Notice the difference in operation count: React's approach required fewer DOM operations,
              similar to how batched database transactions are more efficient than individual queries.
            </p>
          </div>
        )}

        {/* Key Takeaways */}
        <div className="bg-gray-50 rounded-lg p-4 mx-4 mb-4 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Key Takeaways for Backend Engineers</h3>
          <ul className="list-disc ml-4 space-y-1">
            <li>
              <span className="font-semibold">Conceptual Parallel:</span> Virtual DOM is to browser rendering what transaction planning is to database operations
            </li>
            <li>
              <span className="font-semibold">Performance Pattern:</span> Batching and minimizing expensive operations is a universal optimization strategy
            </li>
            <li>
              <span className="font-semibold">Abstraction Layer:</span> Just as ORMs abstract database operations, React abstracts DOM manipulation
            </li>
            <li>
              <span className="font-semibold">System Trade-offs:</span> The additional memory usage of the Virtual DOM is worth the performance gain from reduced DOM operations
            </li>
          </ul>
        </div>

        {/* Further Reading */}
        <div className="p-4 mx-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">Further Reading</h3>
          <ul className="list-disc ml-4 space-y-1 text-sm">
            <li><a href="https://reactjs.org/docs/reconciliation.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">React's Reconciliation Algorithm</a></li>
            <li><a href="https://calendar.perfplanet.com/2013/diff/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Virtual DOM Diffing</a></li>
            <li><a href="https://www.freecodecamp.org/news/how-virtual-dom-and-diffing-works-in-react-6fc805f9f84e/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">How Virtual DOM and Diffing Works in React</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DomVirtualDomExplorer;
