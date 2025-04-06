import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const InteractivePMTensor = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cubesRef = useRef([]);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [dimensionValues, setDimensionValues] = useState({});
  const [isRotating, setIsRotating] = useState(true);
  
  // Project management dimensions
  const dimensions = [
    { id: 'time', name: 'Time', color: 0x3b82f6, position: 'right' },
    { id: 'cost', name: 'Cost', color: 0xef4444, position: 'left' },
    { id: 'scope', name: 'Scope', color: 0x10b981, position: 'top' },
    { id: 'quality', name: 'Quality', color: 0x8b5cf6, position: 'bottom' },
    { id: 'team', name: 'Team', color: 0xf59e0b, position: 'front' },
    { id: 'risk', name: 'Risk', color: 0xec4899, position: 'back' }
  ];
  
  // Impact relationships between dimensions
  const impactMatrix = {
    time: { cost: 0.7, scope: -0.8, quality: -0.6, team: -0.5, risk: 0.6 },
    cost: { time: -0.6, scope: -0.7, quality: 0.5, team: 0.6, risk: 0.4 },
    scope: { time: 0.8, cost: 0.7, quality: -0.5, team: -0.6, risk: 0.8 },
    quality: { time: 0.6, cost: 0.5, scope: 0.4, team: 0.5, risk: -0.7 },
    team: { time: -0.7, cost: -0.5, scope: 0.6, quality: 0.7, risk: -0.6 },
    risk: { time: 0.5, cost: 0.7, scope: -0.6, quality: -0.8, team: -0.5 }
  };
  
  useEffect(() => {
    // Initialize dimension values
    const initialValues = {};
    dimensions.forEach(dim => {
      initialValues[dim.id] = 0.5; // Start all at 50%
    });
    setDimensionValues(initialValues);
  }, []);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create 3D Rubik's cube representation
    createProjectCube();
    
    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Auto-rotate if not being dragged
      if (isRotating && !isDraggingRef.current) {
        scene.rotation.y += 0.005;
        scene.rotation.x += 0.002;
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      scene.clear();
    };
  }, [isRotating]);
  
  // Create the project management cube
  const createProjectCube = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Clear existing cubes
    cubesRef.current.forEach(cube => scene.remove(cube));
    cubesRef.current = [];
    
    // Create a 3x3x3 cube structure
    const size = 0.95;
    const spacing = 1;
    
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip the very center cube
          if (x === 0 && y === 0 && z === 0) continue;
          
          // Create cube geometry
          const geometry = new THREE.BoxGeometry(size, size, size);
          
          // Create materials for each face (6 faces)
          const materials = [];
          
          // Helper to determine if this cube is on the outer layer of a specific face
          const isOnFace = (position, coord, value) => {
            if (position === 'right' && coord === 'x') return value === 1;
            if (position === 'left' && coord === 'x') return value === -1;
            if (position === 'top' && coord === 'y') return value === 1;
            if (position === 'bottom' && coord === 'y') return value === -1;
            if (position === 'front' && coord === 'z') return value === 1;
            if (position === 'back' && coord === 'z') return value === -1;
            return false;
          };
          
          // Define colors for each face based on project dimensions
          for (let i = 0; i < 6; i++) {
            let color = 0x333333; // Default dark gray
            let dimension = null;
            
            // Map face index to dimension position
            // 0: right (x+), 1: left (x-), 2: top (y+), 3: bottom (y-), 4: front (z+), 5: back (z-)
            const positions = ['right', 'left', 'top', 'bottom', 'front', 'back'];
            const coords = ['x', 'x', 'y', 'y', 'z', 'z'];
            const values = [1, -1, 1, -1, 1, -1];
            
            // Find dimension for this face
            dimensions.forEach(dim => {
              if (dim.position === positions[i] && isOnFace(positions[i], coords[i], values[i])) {
                color = dim.color;
                dimension = dim.id;
              }
            });
            
            const material = new THREE.MeshStandardMaterial({
              color: color,
              metalness: 0.1,
              roughness: 0.7,
            });
            
            // Store dimension info for interaction
            material.userData = { dimension };
            materials.push(material);
          }
          
          // Create cube mesh
          const cube = new THREE.Mesh(geometry, materials);
          cube.position.set(x * spacing, y * spacing, z * spacing);
          cube.castShadow = true;
          cube.receiveShadow = true;
          
          // Store cube position data for later reference
          cube.userData = { x, y, z };
          
          scene.add(cube);
          cubesRef.current.push(cube);
        }
      }
    }
    
    // Add text labels
    dimensions.forEach(dim => {
      const position = getPositionForDimension(dim.position);
      createTextLabel(dim.name, position, dim.color);
    });
  };
  
  // Get position for dimension label
  const getPositionForDimension = (position) => {
    const offset = 2.5;
    switch (position) {
      case 'right': return new THREE.Vector3(offset, 0, 0);
      case 'left': return new THREE.Vector3(-offset, 0, 0);
      case 'top': return new THREE.Vector3(0, offset, 0);
      case 'bottom': return new THREE.Vector3(0, -offset, 0);
      case 'front': return new THREE.Vector3(0, 0, offset);
      case 'back': return new THREE.Vector3(0, 0, -offset);
      default: return new THREE.Vector3(0, 0, 0);
    }
  };
  
  // Create text label
  const createTextLabel = (text, position, color) => {
    if (!sceneRef.current) return;
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // Draw text
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 40px Arial';
    context.fillStyle = '#FFFFFF';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 15);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create sprite material
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(2, 1, 1);
    
    sceneRef.current.add(sprite);
  };
  
  // Mouse down handler for rotation
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };
  
  // Mouse move handler for rotation
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !sceneRef.current) return;
    
    const deltaMove = {
      x: e.clientX - previousMousePositionRef.current.x,
      y: e.clientY - previousMousePositionRef.current.y
    };
    
    // Rotate the entire scene based on mouse movement
    sceneRef.current.rotation.y += deltaMove.x * 0.01;
    sceneRef.current.rotation.x += deltaMove.y * 0.01;
    
    previousMousePositionRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };
  
  // Mouse up handler
  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };
  
  // Mouse wheel handler for zoom
  const handleWheel = (e) => {
    if (!cameraRef.current) return;
    
    // Zoom in/out based on wheel direction
    cameraRef.current.position.z += e.deltaY * 0.01;
    
    // Clamp zoom levels
    cameraRef.current.position.z = Math.max(2, Math.min(cameraRef.current.position.z, 10));
  };
  
  // Handle click for dimension selection and cube face rotation
  const handleClick = (e) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: mouseX, y: mouseY }, cameraRef.current);
    
    // Check for intersections with cubes
    const intersects = raycaster.intersectObjects(cubesRef.current);
    
    if (intersects.length > 0) {
      // Get the clicked face
      const faceIndex = intersects[0].faceIndex;
      const materialIndex = Math.floor(faceIndex / 2);
      const material = intersects[0].object.material[materialIndex];
      
      // Check if the face has a dimension
      if (material.userData && material.userData.dimension) {
        const dimensionId = material.userData.dimension;
        setSelectedDimension(dimensionId);
        
        // Simulate dimension value change
        updateDimension(dimensionId);
        
        // Rotate the corresponding slice of the cube
        rotateCubeSlice(intersects[0].object, materialIndex);
      }
    }
  };
  
  // Function to rotate a slice of the cube
  const rotateCubeSlice = (clickedCube, faceIndex) => {
    if (!sceneRef.current) return;
    
    // Determine which axis to rotate based on face
    let axis = '';
    let value = 0;
    
    if (faceIndex === 0 || faceIndex === 1) {
      axis = 'x';
      value = clickedCube.userData.x;
    } else if (faceIndex === 2 || faceIndex === 3) {
      axis = 'y';
      value = clickedCube.userData.y;
    } else if (faceIndex === 4 || faceIndex === 5) {
      axis = 'z';
      value = clickedCube.userData.z;
    }
    
    // Find all cubes in the same slice
    const sliceCubes = cubesRef.current.filter(cube => cube.userData[axis] === value);
    
    // Create a pivot point for rotation
    const pivot = new THREE.Object3D();
    sceneRef.current.add(pivot);
    
    // Store original positions
    const originalPositions = sliceCubes.map(cube => ({
      cube,
      position: cube.position.clone(),
      parent: cube.parent
    }));
    
    // Parent cubes to pivot
    sliceCubes.forEach(cube => {
      const worldPosition = new THREE.Vector3();
      cube.getWorldPosition(worldPosition);
      
      sceneRef.current.remove(cube);
      pivot.add(cube);
      cube.position.copy(worldPosition);
      pivot.updateMatrixWorld();
    });
    
    // Animate rotation
    let angle = 0;
    const targetAngle = Math.PI / 2; // 90 degrees
    const speed = 0.05;
    
    const animateRotation = () => {
      // Increment angle
      angle += speed;
      
      // Apply rotation
      if (axis === 'x') pivot.rotation.x = angle;
      if (axis === 'y') pivot.rotation.y = angle;
      if (axis === 'z') pivot.rotation.z = angle;
      
      // Continue animation
      if (angle < targetAngle) {
        requestAnimationFrame(animateRotation);
      } else {
        // Animation complete, reset cube positions
        sliceCubes.forEach(cube => {
          // Update cube position
          const worldPosition = new THREE.Vector3();
          cube.getWorldPosition(worldPosition);
          
          // Reparent to scene
          pivot.remove(cube);
          sceneRef.current.add(cube);
          
          // Set to final position
          cube.position.copy(worldPosition);
          
          // Reset rotation
          cube.rotation.set(0, 0, 0);
          
          // Round position to avoid floating point issues
          cube.position.x = Math.round(cube.position.x);
          cube.position.y = Math.round(cube.position.y);
          cube.position.z = Math.round(cube.position.z);
          
          // Update stored coordinates
          cube.userData.x = cube.position.x;
          cube.userData.y = cube.position.y;
          cube.userData.z = cube.position.z;
        });
        
        // Remove pivot
        sceneRef.current.remove(pivot);
      }
    };
    
    // Start animation
    animateRotation();
  };
  
  // Update dimension values
  const updateDimension = (dimensionId) => {
    // Toggle the selected dimension value
    const currentValue = dimensionValues[dimensionId];
    const newValue = currentValue < 0.5 ? 0.8 : 0.2;
    
    // Create a copy of current values
    const newValues = { ...dimensionValues };
    
    // Update the selected dimension
    newValues[dimensionId] = newValue;
    
    // Update related dimensions based on impact relationships
    Object.entries(impactMatrix[dimensionId]).forEach(([affectedDim, impact]) => {
      const valueChange = (newValue - currentValue) * impact;
      const currentAffectedValue = dimensionValues[affectedDim];
      
      // Apply change with limits
      newValues[affectedDim] = Math.max(0, Math.min(1, currentAffectedValue + valueChange));
    });
    
    setDimensionValues(newValues);
  };
  
  // Reset view
  const resetView = () => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    // Reset camera position
    cameraRef.current.position.set(0, 0, 5);
    
    // Reset scene rotation
    sceneRef.current.rotation.set(0, 0, 0);
    
    // Reset dimension values
    const initialValues = {};
    dimensions.forEach(dim => {
      initialValues[dim.id] = 0.5;
    });
    setDimensionValues(initialValues);
    
    // Clear selected dimension
    setSelectedDimension(null);
  };
  
  // Render dimension values panel
  const renderDimensionValues = () => {
    return (
      <div className="max-h-64 overflow-y-auto p-3 bg-white bg-opacity-90 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Dimension Values</h3>
        
        <div className="space-y-3">
          {dimensions.map(dim => {
            const value = dimensionValues[dim.id] || 0.5;
            const isSelected = selectedDimension === dim.id;
            
            return (
              <div key={dim.id} className={`flex items-center ${isSelected ? 'bg-blue-50 p-1 rounded' : ''}`}>
                <div className="w-16 font-medium" style={{ color: '#' + dim.color.toString(16) }}>
                  {dim.name}
                </div>
                
                <div className="flex-grow mx-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${value * 100}%`,
                        backgroundColor: '#' + dim.color.toString(16)
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="w-10 text-right text-sm">
                  {Math.round(value * 100)}%
                </div>
              </div>
            );
          })}
        </div>
        
        {selectedDimension && (
          <div className="mt-3 pt-2 border-t text-sm">
            <p className="font-medium">Impact Analysis:</p>
            {Object.entries(impactMatrix[selectedDimension]).map(([dim, impact]) => (
              <div key={dim} className="flex items-center mt-1">
                <span className="w-16">{dimensions.find(d => d.id === dim)?.name}</span>
                <span 
                  className={`${impact > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}
                >
                  {impact > 0 ? '+' : ''}{(impact * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-gray-100 flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 className="text-xl font-bold">Project Management Tensor Cube</h2>
          <p className="text-sm text-gray-600">Interact with dimensions as tensor operations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={resetView}
          >
            Reset View
          </button>
          
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={isRotating} 
              onChange={(e) => setIsRotating(e.target.checked)}
              className="mr-2"
            />
            <span>Auto-rotate</span>
          </label>
        </div>
      </div>
      
      <div className="flex-grow flex">
        {/* 3D canvas */}
        <div 
          className="flex-grow relative"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleClick}
        >
          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow max-w-xs">
            <h3 className="font-semibold mb-1">Instructions:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>Drag</strong> to rotate the cube</li>
              <li>• <strong>Scroll</strong> to zoom in/out</li>
              <li>• <strong>Click</strong> on a face to interact with dimension</li>
              <li>• Watch how dimensions impact each other</li>
            </ul>
          </div>
        </div>
        
        {/* Side panel */}
        <div className="w-64 bg-gray-100 p-3 overflow-y-auto">
          {renderDimensionValues()}
          
          <div className="mt-4 p-3 bg-white bg-opacity-90 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Tensor Relationships</h3>
            
            {selectedDimension ? (
              <div>
                <p className="text-sm mb-2">
                  Changing <span className="font-medium" style={{ color: '#' + dimensions.find(d => d.id === selectedDimension)?.color.toString(16) }}>
                    {dimensions.find(d => d.id === selectedDimension)?.name}
                  </span> propagates through the tensor field:
                </p>
                
                <div className="p-2 bg-gray-50 rounded text-xs font-mono">
                  ΔProject = T<sub>{selectedDimension}</sub> ⊗ [
                  {Object.entries(impactMatrix[selectedDimension])
                    .map(([dim, val]) => `${val > 0 ? '+' : ''}${val}D<sub>${dim}</sub>`)
                    .join(', ')}
                  ]
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Click on a dimension to see how tensor transformations propagate changes through the project system.
              </p>
            )}
            
            <div className="mt-3 pt-3 border-t text-sm">
              <p className="mb-1"><strong>What is this visualization?</strong></p>
              <p>This 3D cube represents project management dimensions as a tensor field, where each face is a dimension that interacts with all others through mathematical relationships.</p>
              <p className="mt-2">When you change one dimension (by clicking a face), watch how the cube physically transforms and how all connected dimensions are affected according to tensor operations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePMTensor;
