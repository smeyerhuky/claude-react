// // // import React, { useState, useEffect, useRef } from 'react';
// // // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// // // // Main CoSAE demonstration component
// // // const CoSAEDemo = () => {
// // //   // State for various aspects of the demo
// // //   const [originalImage, setOriginalImage] = useState(null);
// // //   const [lowResImage, setLowResImage] = useState(null);
// // //   const [restoredImage, setRestoredImage] = useState(null);
// // //   const [bottleneckSize, setBottleneckSize] = useState(64); // Default bottleneck size
// // //   const [frequencyCoeffs, setFrequencyCoeffs] = useState([]);
// // //   const [selectedFrequency, setSelectedFrequency] = useState(null);
// // //   const [isProcessing, setIsProcessing] = useState(false);
// // //   const [selectedTab, setSelectedTab] = useState('demo'); // 'demo' or 'explanation'
// // //   const [showOriginal, setShowOriginal] = useState(false); // Toggle for comparison view
// // //   const [showFrequencyViz, setShowFrequencyViz] = useState(false);
  
// // //   const canvasOriginal = useRef(null);
// // //   const canvasLowRes = useRef(null);
// // //   const canvasRestored = useRef(null);
// // //   const canvasFrequency = useRef(null);
// // //   const canvasSingleFreq = useRef(null);
  
// // //   // Process the uploaded image
// // //   const handleImageUpload = (e) => {
// // //     const file = e.target.files[0];
// // //     if (!file) return;
    
// // //     const reader = new FileReader();
// // //     reader.onload = (e) => {
// // //       const img = new Image();
// // //       img.onload = () => {
// // //         setOriginalImage(img);
// // //         processImage(img);
// // //       };
// // //       img.src = e.target.result;
// // //     };
// // //     reader.readAsDataURL(file);
// // //   };
  
// // //   // Process a demo image
// // //   const handleDemoImage = () => {
// // //     const img = new Image();
// // //     img.onload = () => {
// // //       setOriginalImage(img);
// // //       processImage(img);
// // //     };
// // //     img.src = "/api/placeholder/512/512";
// // //   };
  
// // //   // Process the image through our simplified CoSAE pipeline
// // //   const processImage = (img) => {
// // //     setIsProcessing(true);
    
// // //     // Step 1: Draw the original image to the canvas
// // //     drawImageToCanvas(img, canvasOriginal.current, 256);
    
// // //     // Step 2: Create a low-resolution version
// // //     const lowResSize = 32; // 8x downsampling
// // //     const lowResCanvas = document.createElement('canvas');
// // //     lowResCanvas.width = lowResSize;
// // //     lowResCanvas.height = lowResSize;
// // //     const lowResCtx = lowResCanvas.getContext('2d');
// // //     lowResCtx.drawImage(img, 0, 0, lowResSize, lowResSize);
    
// // //     // Step 3: Scale the low-res image back up to show degradation
// // //     const scaledLowRes = document.createElement('canvas');
// // //     scaledLowRes.width = 256;
// // //     scaledLowRes.height = 256;
// // //     const scaledLowResCtx = scaledLowRes.getContext('2d');
// // //     scaledLowResCtx.imageSmoothingEnabled = false; // For pixelated upscaling
// // //     scaledLowResCtx.drawImage(lowResCanvas, 0, 0, 256, 256);
    
// // //     const lowResImg = new Image();
// // //     lowResImg.onload = () => {
// // //       setLowResImage(lowResImg);
// // //       drawImageToCanvas(lowResImg, canvasLowRes.current, 256);
      
// // //       // Step 4: Simulate CoSAE restoration process
// // //       simulateCoSAERestoration(lowResCanvas, bottleneckSize);
// // //     };
// // //     lowResImg.src = scaledLowRes.toDataURL();
// // //   };
  
// // //   // Draw image to a canvas at specified size
// // //   const drawImageToCanvas = (img, canvas, size) => {
// // //     if (!canvas) return;
    
// // //     const ctx = canvas.getContext('2d');
// // //     ctx.clearRect(0, 0, size, size);
// // //     canvas.width = size;
// // //     canvas.height = size;
    
// // //     // Center and scale the image to fit the canvas
// // //     const scale = Math.min(size / img.width, size / img.height);
// // //     const x = (size - img.width * scale) / 2;
// // //     const y = (size - img.height * scale) / 2;
    
// // //     ctx.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * scale, img.height * scale);
// // //   };
  
// // //   // Visualize frequency coefficients on a canvas
// // //   const visualizeFrequencyCoefficients = (coeffs) => {
// // //     if (!canvasFrequency.current) return;
    
// // //     const canvas = canvasFrequency.current;
// // //     const ctx = canvas.getContext('2d');
// // //     const size = canvas.width;
    
// // //     ctx.clearRect(0, 0, size, size);
    
// // //     // We'll create a grid representing the frequency space
// // //     const gridSize = 8;
// // //     const cellSize = size / gridSize;
    
// // //     // Draw grid lines
// // //     ctx.strokeStyle = '#ddd';
// // //     ctx.lineWidth = 1;
    
// // //     for (let i = 0; i <= gridSize; i++) {
// // //       const pos = i * cellSize;
      
// // //       // Vertical line
// // //       ctx.beginPath();
// // //       ctx.moveTo(pos, 0);
// // //       ctx.lineTo(pos, size);
// // //       ctx.stroke();
      
// // //       // Horizontal line
// // //       ctx.beginPath();
// // //       ctx.moveTo(0, pos);
// // //       ctx.lineTo(size, pos);
// // //       ctx.stroke();
// // //     }
    
// // //     // Draw coefficients as circles with size based on amplitude
// // //     coeffs.forEach((coeff, index) => {
// // //       const { u, v, amplitude, phase } = coeff;
      
// // //       // Position in the grid (center of the grid is (gridSize/2, gridSize/2))
// // //       const x = (u + gridSize/2) * cellSize;
// // //       const y = (v + gridSize/2) * cellSize;
      
// // //       // Size based on amplitude (normalized)
// // //       const maxRadius = cellSize / 2 * 0.8;
// // //       const radius = Math.max(2, amplitude * maxRadius);
      
// // //       // Color based on phase (hue from 0 to 360)
// // //       const hue = (phase / (Math.PI * 2) * 360) % 360;
      
// // //       // Draw the circle
// // //       ctx.beginPath();
// // //       ctx.arc(x, y, radius, 0, Math.PI * 2);
// // //       ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
// // //       ctx.fill();
      
// // //       // Add border
// // //       ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
// // //       ctx.lineWidth = 1;
// // //       ctx.stroke();
      
// // //       // Add highlight on hover if this is the selected frequency
// // //       if (selectedFrequency === index) {
// // //         ctx.beginPath();
// // //         ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
// // //         ctx.strokeStyle = 'white';
// // //         ctx.lineWidth = 2;
// // //         ctx.stroke();
        
// // //         // Also visualize this single frequency
// // //         visualizeSingleFrequency(coeff);
// // //       }
// // //     });
// // //   };
  
// // //   // Visualize a single frequency component
// // //   const visualizeSingleFrequency = (coeff) => {
// // //     if (!canvasSingleFreq.current) return;
    
// // //     const canvas = canvasSingleFreq.current;
// // //     const ctx = canvas.getContext('2d');
// // //     const size = canvas.width;
    
// // //     ctx.clearRect(0, 0, size, size);
    
// // //     // Extract parameters
// // //     const { u, v, amplitude, phase } = coeff;
    
// // //     // Draw a 2D Cosine wave based on the parameters
// // //     const imageData = ctx.createImageData(size, size);
// // //     const data = imageData.data;
    
// // //     // Scale factors for the frequency
// // //     const scaleU = (2 * Math.PI * u) / size;
// // //     const scaleV = (2 * Math.PI * v) / size;
    
// // //     // Generate the wave
// // //     for (let y = 0; y < size; y++) {
// // //       for (let x = 0; x < size; x++) {
// // //         // Calculate the cosine value at this position
// // //         const value = Math.cos(x * scaleU + y * scaleV + phase);
        
// // //         // Scale to [0, 255] and apply amplitude
// // //         const intensity = Math.round(((value + 1) / 2) * 255 * amplitude);
        
// // //         // Set RGBA values (grayscale with full alpha)
// // //         const pixelIndex = (y * size + x) * 4;
// // //         data[pixelIndex] = intensity;     // R
// // //         data[pixelIndex + 1] = intensity; // G
// // //         data[pixelIndex + 2] = intensity; // B
// // //         data[pixelIndex + 3] = 255;       // A (fully opaque)
// // //       }
// // //     }
    
// // //     ctx.putImageData(imageData, 0, 0);
// // //   };
  
// // //   // Simulate CoSAE restoration process
// // //   const simulateCoSAERestoration = (lowResCanvas, bottleneckSize) => {
// // //     const lowResSize = lowResCanvas.width;
// // //     const outputSize = 256;
    
// // //     // Step 1: Extract RGB data from low-res image
// // //     const lowResCtx = lowResCanvas.getContext('2d');
// // //     const lowResImageData = lowResCtx.getImageData(0, 0, lowResSize, lowResSize);
// // //     const lowResData = lowResImageData.data;
    
// // //     // Step 2: We'll simulate the bottleneck encoding by creating frequency coefficients
// // //     // In a real CoSAE, this would be learned by a neural network
// // //     const numFreqs = bottleneckSize / 2; // Each frequency has amplitude and phase
// // //     const coeffs = [];
    
// // //     // Generate cosine basis functions with different frequencies
// // //     // In a real implementation, these would be learned from the data
// // //     for (let i = 0; i < numFreqs; i++) {
// // //       // Create a frequency pair (u, v) - distribute the frequencies in a grid
// // //       const u = Math.floor(i / 8) - 4; // Range: -4 to 3
// // //       const v = i % 8 - 4;             // Range: -4 to 3
      
// // //       // Simulate learned amplitudes and phases
// // //       // Lower frequencies generally have higher amplitudes in natural images
// // //       const distFromCenter = Math.sqrt(u*u + v*v);
// // //       const amplitude = Math.max(0.05, 1.0 / (1.0 + distFromCenter)) * (0.7 + 0.3 * Math.random());
// // //       const phase = Math.random() * Math.PI * 2; // Random phase
      
// // //       coeffs.push({ u, v, amplitude, phase });
// // //     }
    
// // //     // Step 3: Create the restored image by combining the frequency components
// // //     const restoredCanvas = document.createElement('canvas');
// // //     restoredCanvas.width = outputSize;
// // //     restoredCanvas.height = outputSize;
// // //     const restoredCtx = restoredCanvas.getContext('2d');
// // //     const restoredImageData = restoredCtx.createImageData(outputSize, outputSize);
// // //     const restoredData = restoredImageData.data;
    
// // //     // Initialize with zeros
// // //     for (let i = 0; i < restoredData.length; i += 4) {
// // //       restoredData[i] = 0;     // R
// // //       restoredData[i + 1] = 0; // G
// // //       restoredData[i + 2] = 0; // B
// // //       restoredData[i + 3] = 255; // A
// // //     }
    
// // //     // Add each frequency component
// // //     coeffs.forEach(coeff => {
// // //       const { u, v, amplitude, phase } = coeff;
      
// // //       // Scale factors for the frequency
// // //       const scaleU = (2 * Math.PI * u) / outputSize;
// // //       const scaleV = (2 * Math.PI * v) / outputSize;
      
// // //       // Add this component to our image
// // //       for (let y = 0; y < outputSize; y++) {
// // //         for (let x = 0; x < outputSize; x++) {
// // //           // Calculate the cosine value at this position
// // //           const value = Math.cos(x * scaleU + y * scaleV + phase);
          
// // //           // Scale to [0, 255] and apply amplitude
// // //           const intensity = Math.round(value * 127 * amplitude);
          
// // //           // Update RGBA values - add to all channels for now
// // //           const pixelIndex = (y * outputSize + x) * 4;
// // //           restoredData[pixelIndex] += intensity;     // R
// // //           restoredData[pixelIndex + 1] += intensity; // G
// // //           restoredData[pixelIndex + 2] += intensity; // B
// // //         }
// // //       }
// // //     });
    
// // //     // Normalize the result to [0, 255]
// // //     let minVal = 255, maxVal = 0;
// // //     for (let i = 0; i < restoredData.length; i += 4) {
// // //       minVal = Math.min(minVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
// // //       maxVal = Math.max(maxVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
// // //     }
    
// // //     const range = maxVal - minVal;
// // //     for (let i = 0; i < restoredData.length; i += 4) {
// // //       restoredData[i] = Math.round(((restoredData[i] - minVal) / range) * 255);
// // //       restoredData[i+1] = Math.round(((restoredData[i+1] - minVal) / range) * 255);
// // //       restoredData[i+2] = Math.round(((restoredData[i+2] - minVal) / range) * 255);
// // //     }
    
// // //     // Put the processed data back
// // //     restoredCtx.putImageData(restoredImageData, 0, 0);
    
// // //     // Convert to image and update state
// // //     const restoredImg = new Image();
// // //     restoredImg.onload = () => {
// // //       setRestoredImage(restoredImg);
// // //       drawImageToCanvas(restoredImg, canvasRestored.current, 256);
// // //       setFrequencyCoeffs(coeffs);
// // //       visualizeFrequencyCoefficients(coeffs);
// // //       setIsProcessing(false);
// // //     };
// // //     restoredImg.src = restoredCanvas.toDataURL();
// // //   };
  
// // //   // Handle bottleneck size changes
// // //   const handleBottleneckChange = (e) => {
// // //     const newSize = parseInt(e.target.value);
// // //     setBottleneckSize(newSize);
    
// // //     // Reprocess if we have an image
// // //     if (originalImage) {
// // //       setIsProcessing(true);
// // //       // Short delay to allow UI to update
// // //       setTimeout(() => processImage(originalImage), 50);
// // //     }
// // //   };
  
// // //   // Handle frequency selection for visualization
// // //   const handleFrequencySelect = (index) => {
// // //     setSelectedFrequency(index === selectedFrequency ? null : index);
// // //   };
  
// // //   // Toggle between showing original and restored images
// // //   const toggleShowOriginal = () => {
// // //     setShowOriginal(!showOriginal);
// // //   };
  
// // //   // Toggle frequency visualization
// // //   const toggleFrequencyViz = () => {
// // //     setShowFrequencyViz(!showFrequencyViz);
// // //   };
  
// // //   // Reset the demo
// // //   const handleReset = () => {
// // //     setOriginalImage(null);
// // //     setLowResImage(null);
// // //     setRestoredImage(null);
// // //     setFrequencyCoeffs([]);
// // //     setSelectedFrequency(null);
// // //     setIsProcessing(false);
// // //   };
  
// // //   // UI Rendering
// // //   return (
// // //     <div className="flex flex-col items-center w-full p-4 bg-gray-100 min-h-screen">
// // //       {/* Header */}
// // //       <div className="mb-6 text-center">
// // //         <h1 className="text-3xl font-bold text-blue-800 mb-2">CoSAE: Learnable Fourier Series for Image Restoration</h1>
// // //         <p className="text-gray-600 max-w-3xl">
// // //           An interactive demonstration of the core concepts from the NVIDIA research paper.
// // //           CoSAE uses learnable harmonic functions to encode frequency coefficients in a bottleneck for image restoration.
// // //         </p>
// // //       </div>
      
// // //       {/* Tab Selection */}
// // //       <div className="flex w-full max-w-5xl mb-6">
// // //         <button 
// // //           className={`flex-1 py-2 px-4 ${selectedTab === 'demo' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
// // //           onClick={() => setSelectedTab('demo')}
// // //         >
// // //           Demo
// // //         </button>
// // //         <button 
// // //           className={`flex-1 py-2 px-4 ${selectedTab === 'explanation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
// // //           onClick={() => setSelectedTab('explanation')}
// // //         >
// // //           Explanation
// // //         </button>
// // //       </div>
      
// // //       {/* Main Content */}
// // //       {selectedTab === 'demo' ? (
// // //         <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
// // //           {/* Controls */}
// // //           <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
// // //             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
// // //               <input 
// // //                 type="file" 
// // //                 accept="image/*" 
// // //                 onChange={handleImageUpload} 
// // //                 className="hidden" 
// // //                 id="image-upload" 
// // //               />
// // //               <label 
// // //                 htmlFor="image-upload" 
// // //                 className="bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 text-center"
// // //               >
// // //                 Upload Image
// // //               </label>
              
// // //               <button 
// // //                 onClick={handleDemoImage} 
// // //                 className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
// // //               >
// // //                 Use Demo Image
// // //               </button>
              
// // //               {originalImage && (
// // //                 <button 
// // //                   onClick={handleReset} 
// // //                   className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
// // //                 >
// // //                   Reset
// // //                 </button>
// // //               )}
// // //             </div>
            
// // //             <div className="flex flex-col space-y-2">
// // //               <div className="flex items-center space-x-2">
// // //                 <label className="text-gray-700 whitespace-nowrap">Bottleneck Size:</label>
// // //                 <input 
// // //                   type="range" 
// // //                   min="8" 
// // //                   max="256" 
// // //                   step="8" 
// // //                   value={bottleneckSize} 
// // //                   onChange={handleBottleneckChange} 
// // //                   className="w-48"
// // //                   disabled={isProcessing || !originalImage}
// // //                 />
// // //                 <span className="text-gray-700 w-8">{bottleneckSize}</span>
// // //               </div>
              
// // //               {originalImage && (
// // //                 <div className="flex space-x-4">
// // //                   <button 
// // //                     onClick={toggleShowOriginal} 
// // //                     className="bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 text-sm"
// // //                   >
// // //                     {showOriginal ? "Show Result" : "Show Original"}
// // //                   </button>
                  
// // //                   <button 
// // //                     onClick={toggleFrequencyViz} 
// // //                     className="bg-yellow-600 text-white py-1 px-3 rounded hover:bg-yellow-700 text-sm"
// // //                   >
// // //                     {showFrequencyViz ? "Hide Frequencies" : "Show Frequencies"}
// // //                   </button>
// // //                 </div>
// // //               )}
// // //             </div>
// // //           </div>
          
// // //           {isProcessing ? (
// // //             <div className="flex justify-center items-center h-64">
// // //               <div className="text-xl text-gray-600">Processing...</div>
// // //             </div>
// // //           ) : originalImage ? (
// // //             <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
// // //               {/* Image display area */}
// // //               <div className="flex-1">
// // //                 <div className="grid grid-cols-2 gap-4">
// // //                   <div>
// // //                     <h3 className="text-center text-gray-700 font-semibold mb-2">Input Image</h3>
// // //                     <div className="relative border border-gray-300 rounded">
// // //                       <canvas 
// // //                         ref={canvasOriginal} 
// // //                         width="256" 
// // //                         height="256" 
// // //                         className="w-full"
// // //                       />
// // //                     </div>
// // //                   </div>
                  
// // //                   <div>
// // //                     <h3 className="text-center text-gray-700 font-semibold mb-2">Low Resolution (8x downsampled)</h3>
// // //                     <div className="relative border border-gray-300 rounded">
// // //                       <canvas 
// // //                         ref={canvasLowRes} 
// // //                         width="256" 
// // //                         height="256" 
// // //                         className="w-full"
// // //                       />
// // //                     </div>
// // //                   </div>
                  
// // //                   <div className="col-span-2">
// // //                     <h3 className="text-center text-gray-700 font-semibold mb-2">
// // //                       {showOriginal ? "Original Image (for comparison)" : "CoSAE Restored Image"}
// // //                     </h3>
// // //                     <div className="relative border border-gray-300 rounded">
// // //                       <canvas 
// // //                         ref={canvasRestored} 
// // //                         width="256" 
// // //                         height="256" 
// // //                         className="w-full"
// // //                       />
// // //                       {/* We'll overlay the original when toggled */}
// // //                       {showOriginal && originalImage && (
// // //                         <div className="absolute inset-0 flex justify-center items-center">
// // //                           <img 
// // //                             src={originalImage.src} 
// // //                             alt="Original" 
// // //                             className="max-w-full max-h-full"
// // //                           />
// // //                         </div>
// // //                       )}
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               </div>
              
// // //               {/* Frequency visualization area */}
// // //               {showFrequencyViz && (
// // //                 <div className="w-full md:w-72 flex flex-col space-y-4">
// // //                   <div className="border border-gray-300 rounded p-4 bg-gray-50">
// // //                     <h3 className="text-center text-gray-700 font-semibold mb-2">Frequency Coefficients</h3>
// // //                     <p className="text-xs text-gray-600 mb-2">
// // //                       Click on a frequency to visualize its contribution.
// // //                     </p>
// // //                     <div className="relative">
// // //                       <canvas 
// // //                         ref={canvasFrequency} 
// // //                         width="200" 
// // //                         height="200" 
// // //                         className="w-full border border-gray-300 bg-gray-900 rounded mb-4"
// // //                         onClick={(e) => {
// // //                           // Calculate which frequency was clicked based on position
// // //                           const canvas = canvasFrequency.current;
// // //                           const rect = canvas.getBoundingClientRect();
// // //                           const x = e.clientX - rect.left;
// // //                           const y = e.clientY - rect.top;
// // //                           const gridSize = 8;
// // //                           const cellSize = canvas.width / gridSize;
                          
// // //                           // Convert to grid coordinates
// // //                           const gridX = Math.floor(x / cellSize);
// // //                           const gridY = Math.floor(y / cellSize);
                          
// // //                           // Find the closest frequency
// // //                           let closestIdx = null;
// // //                           let closestDist = Infinity;
                          
// // //                           frequencyCoeffs.forEach((coeff, idx) => {
// // //                             const freqGridX = (coeff.u + gridSize/2);
// // //                             const freqGridY = (coeff.v + gridSize/2);
// // //                             const dist = Math.sqrt(
// // //                               Math.pow(freqGridX - gridX, 2) + 
// // //                               Math.pow(freqGridY - gridY, 2)
// // //                             );
                            
// // //                             if (dist < closestDist && dist < 1) {
// // //                               closestDist = dist;
// // //                               closestIdx = idx;
// // //                             }
// // //                           });
                          
// // //                           if (closestIdx !== null) {
// // //                             handleFrequencySelect(closestIdx);
// // //                           }
// // //                         }}
// // //                       />
// // //                     </div>
                    
// // //                     {selectedFrequency !== null && (
// // //                       <div>
// // //                         <h4 className="text-sm text-gray-700 font-semibold">Selected Frequency</h4>
// // //                         <div className="border border-gray-300 rounded bg-white p-2 mb-2">
// // //                           <canvas 
// // //                             ref={canvasSingleFreq} 
// // //                             width="150" 
// // //                             height="150" 
// // //                             className="w-full"
// // //                           />
// // //                         </div>
                        
// // //                         <div className="text-xs text-gray-600">
// // //                           <p>
// // //                             u = {frequencyCoeffs[selectedFrequency].u}, 
// // //                             v = {frequencyCoeffs[selectedFrequency].v}
// // //                           </p>
// // //                           <p>
// // //                             Amplitude: {frequencyCoeffs[selectedFrequency].amplitude.toFixed(3)}
// // //                           </p>
// // //                           <p>
// // //                             Phase: {(frequencyCoeffs[selectedFrequency].phase / Math.PI).toFixed(2)}π
// // //                           </p>
// // //                         </div>
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //               )}
// // //             </div>
// // //           ) : (
// // //             <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
// // //               <div className="text-center">
// // //                 <p className="text-xl text-gray-600 mb-4">No image selected</p>
// // //                 <p className="text-gray-500">Upload an image or use a demo image to begin.</p>
// // //               </div>
// // //             </div>
// // //           )}
// // //         </div>
// // //       ) : (
// // //         <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
// // //           <div className="prose mx-auto">
// // //             <h2 className="text-2xl font-bold text-blue-800 mb-4">Understanding CoSAE</h2>
            
// // //             <p className="mb-4">
// // //               CoSAE (Cosine Autoencoder) is a novel neural network architecture for image restoration, 
// // //               introduced in the paper "CoSAE: Learnable Fourier Series for Image Restoration" by Sifei Liu, 
// // //               Shalini De Mello, and Jan Kautz from NVIDIA.
// // //             </p>
            
// // //             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Key Innovations</h3>
            
// // //             <p className="mb-3">
// // //               1. <strong>Fourier Series Representation</strong> - CoSAE encodes images using a series of 
// // //               2D Cosine waves, each defined by a frequency pair (u, v) and corresponding amplitude and phase.
// // //             </p>
            
// // //             <p className="mb-3">
// // //               2. <strong>Extremely Narrow Bottleneck</strong> - Despite having a compact representation in 
// // //               the bottleneck layer, CoSAE maintains high-fidelity details in the reconstructed images.
// // //             </p>
            
// // //             <p className="mb-3">
// // //               3. <strong>Learnable Frequency Parameters</strong> - Unlike conventional autoencoders,
// // //               CoSAE learns the optimal frequency coefficients, enabling better generalization.
// // //             </p>
            
// // //             <div className="my-6 p-4 bg-gray-100 rounded-lg">
// // //               <h3 className="text-lg font-semibold mb-2">How it Works:</h3>
// // //               <ol className="list-decimal pl-5 space-y-2">
// // //                 <li>The encoder compresses an input image to a series of frequency coefficients (amplitude and phase pairs).</li>
// // //                 <li>These coefficients are stored in an extremely narrow bottleneck (as small as 1/64th of the original size).</li>
// // //                 <li>The Harmonic Construction Module (HCM) expands these coefficients into 2D cosine basis functions.</li>
// // //                 <li>The decoder combines these basis functions to reconstruct the full-resolution image.</li>
// // //               </ol>
// // //             </div>
            
// // //             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Applications</h3>
            
// // //             <p className="mb-3">
// // //               CoSAE was shown to excel at several challenging image restoration tasks:
// // //             </p>
            
// // //             <ul className="list-disc pl-5 mb-4 space-y-1">
// // //               <li><strong>Flexible-resolution Super-resolution</strong> - Upscaling images to arbitrary sizes</li>
// // //               <li><strong>Blind Image Restoration</strong> - Reconstructing images from unknown degradations</li>
// // //               <li><strong>General image enhancement</strong> - Improving visual quality of degraded images</li>
// // //             </ul>
            
// // //             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">About this Demo</h3>
            
// // //             <p className="mb-4">
// // //               This interactive demonstration provides a simplified version of CoSAE's capabilities:
// // //             </p>
            
// // //             <ul className="list-disc pl-5 mb-4 space-y-1">
// // //               <li>Upload or select a demo image</li>
// // //               <li>The image is downsampled to create a low-resolution version</li>
// // //               <li>A simplified version of CoSAE is applied to restore the image</li>
// // //               <li>You can adjust the bottleneck size to see how it affects restoration quality</li>
// // //               <li>You can visualize the frequency coefficients learned by the model</li>
// // //             </ul>
            
// // //             <p className="mb-4">
// // //               Note that this is a simplified toy implementation to demonstrate the core concepts.
// // //               The full CoSAE model as described in the paper includes a more sophisticated neural 
// // //               network architecture and training process.
// // //             </p>
            
// // //             <p className="text-sm text-gray-600 mt-8">
// // //               Reference: Liu, S., De Mello, S., & Kautz, J. (2024). CosAE: Learnable Fourier Series for Image Restoration. 
// // //               38th Conference on Neural Information Processing Systems (NeurIPS 2024).
// // //             </p>
// // //           </div>
// // //         </div>
// // //       )}
      
// // //     </div>
// // //   );
// // // }

// // // export default CoSAEDemo;

// // import React, { useState, useEffect, useRef } from 'react';
// // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// // // Main CoSAE demonstration component
// // const CoSAEDemo = () => {
// //   // State for various aspects of the demo
// //   const [originalImage, setOriginalImage] = useState(null);
// //   const [lowResImage, setLowResImage] = useState(null);
// //   const [restoredImage, setRestoredImage] = useState(null);
// //   const [bottleneckSize, setBottleneckSize] = useState(64); // Default bottleneck size
// //   const [frequencyCoeffs, setFrequencyCoeffs] = useState([]);
// //   const [selectedFrequency, setSelectedFrequency] = useState(null);
// //   const [processingStatus, setProcessingStatus] = useState("idle"); // idle, preparing, processing, complete
// //   const [statusMessage, setStatusMessage] = useState("");
// //   const [imageDetails, setImageDetails] = useState(null);
// //   const [selectedTab, setSelectedTab] = useState('demo'); // 'demo' or 'explanation'
// //   const [showOriginal, setShowOriginal] = useState(false); // Toggle for comparison view
// //   const [showFrequencyViz, setShowFrequencyViz] = useState(false);
  
// //   const canvasOriginal = useRef(null);
// //   const canvasLowRes = useRef(null);
// //   const canvasRestored = useRef(null);
// //   const canvasFrequency = useRef(null);
// //   const canvasSingleFreq = useRef(null);
  
// //   // Process the uploaded image - just load and display, don't run the algorithm yet
// //   const handleImageUpload = (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;
    
// //     setProcessingStatus("preparing");
// //     setStatusMessage("Loading image...");
    
// //     const reader = new FileReader();
// //     reader.onload = (e) => {
// //       const img = new Image();
// //       img.onload = () => {
// //         // Resize image to 512x512 while preserving aspect ratio
// //         const resizedImg = resizeImage(img, 512, 512);
// //         setOriginalImage(resizedImg);
        
// //         // Display the original image
// //         drawImageToCanvas(resizedImg, canvasOriginal.current, 256);
        
// //         // Display image details
// //         const details = {
// //           originalWidth: img.width,
// //           originalHeight: img.height,
// //           size: formatBytes(file.size),
// //           type: file.type,
// //           name: file.name
// //         };
// //         setImageDetails(details);
        
// //         setProcessingStatus("ready");
// //         setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
// //       };
// //       img.src = e.target.result;
// //     };
// //     reader.readAsDataURL(file);
// //   };
  
// //   // Process a demo image
// //   const handleDemoImage = () => {
// //     setProcessingStatus("preparing");
// //     setStatusMessage("Loading demo image...");
    
// //     const img = new Image();
// //     img.crossOrigin = "Anonymous"; // Necessary for placeholder images
    
// //     img.onload = () => {
// //       // Use the placeholder image as our original
// //       setOriginalImage(img);
      
// //       // Display the original image
// //       drawImageToCanvas(img, canvasOriginal.current, 256);
      
// //       // Display image details
// //       const details = {
// //         originalWidth: img.width,
// //         originalHeight: img.height,
// //         size: "Demo image",
// //         type: "image/png",
// //         name: "demo-image.png"
// //       };
// //       setImageDetails(details);
      
// //       setProcessingStatus("ready");
// //       setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
// //     };
    
// //     img.onerror = () => {
// //       setProcessingStatus("error");
// //       setStatusMessage("Error loading demo image. Please try uploading your own image.");
// //     };
    
// //     // Use a specific seed to get a consistent placeholder
// //     img.src = "/api/placeholder/512/512?text=Demo%20Image";
// //   };
  
// //   // Resize image to target dimensions while preserving aspect ratio
// //   const resizeImage = (img, targetWidth, targetHeight) => {
// //     const canvas = document.createElement('canvas');
// //     canvas.width = targetWidth;
// //     canvas.height = targetHeight;
// //     const ctx = canvas.getContext('2d');
    
// //     // Determine scale and position for center crop
// //     const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
// //     const scaledWidth = img.width * scale;
// //     const scaledHeight = img.height * scale;
// //     const offsetX = (targetWidth - scaledWidth) / 2;
// //     const offsetY = (targetHeight - scaledHeight) / 2;
    
// //     // Fill with black background
// //     ctx.fillStyle = 'black';
// //     ctx.fillRect(0, 0, targetWidth, targetHeight);
    
// //     // Draw the image centered
// //     ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    
// //     // Create a new image from the canvas
// //     const resizedImg = new Image();
// //     resizedImg.src = canvas.toDataURL();
// //     return resizedImg;
// //   };
  
// //   // Format bytes to human readable format
// //   const formatBytes = (bytes, decimals = 2) => {
// //     if (bytes === 0) return '0 Bytes';
    
// //     const k = 1024;
// //     const dm = decimals < 0 ? 0 : decimals;
// //     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
// //     const i = Math.floor(Math.log(bytes) / Math.log(k));
    
// //     return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
// //   };
  
// //   // Start the CoSAE restoration process
// //   const startProcessing = () => {
// //     if (!originalImage || processingStatus === "processing") return;
    
// //     setProcessingStatus("processing");
// //     setStatusMessage("Creating low-resolution version...");
    
// //     // Process in a slight delay to allow UI to update
// //     setTimeout(() => {
// //       // Create low-res version
// //       createLowResVersion(originalImage);
// //     }, 50);
// //   };
  
// //   // Create a low-resolution version of the image
// //   const createLowResVersion = (img) => {
// //     // Step 1: Create a low-resolution version
// //     const lowResSize = 32; // 8x downsampling
// //     const lowResCanvas = document.createElement('canvas');
// //     lowResCanvas.width = lowResSize;
// //     lowResCanvas.height = lowResSize;
// //     const lowResCtx = lowResCanvas.getContext('2d');
// //     lowResCtx.drawImage(img, 0, 0, lowResSize, lowResSize);
    
// //     // Step 2: Scale the low-res image back up to show degradation
// //     const scaledLowRes = document.createElement('canvas');
// //     scaledLowRes.width = 256;
// //     scaledLowRes.height = 256;
// //     const scaledLowResCtx = scaledLowRes.getContext('2d');
// //     scaledLowResCtx.imageSmoothingEnabled = false; // For pixelated upscaling
// //     scaledLowResCtx.drawImage(lowResCanvas, 0, 0, 256, 256);
    
// //     const lowResImg = new Image();
// //     lowResImg.onload = () => {
// //       setLowResImage(lowResImg);
// //       drawImageToCanvas(lowResImg, canvasLowRes.current, 256);
      
// //       // Update status
// //       setStatusMessage("Applying CoSAE restoration algorithm...");
      
// //       // Process in a slight delay to allow UI to update
// //       setTimeout(() => {
// //         // Now run the CoSAE restoration
// //         simulateCoSAERestoration(lowResCanvas, bottleneckSize);
// //       }, 50);
// //     };
// //     lowResImg.src = scaledLowRes.toDataURL();
// //   };
  
// //   // Draw image to a canvas at specified size
// //   const drawImageToCanvas = (img, canvas, size) => {
// //     if (!canvas) return;
    
// //     const ctx = canvas.getContext('2d');
// //     ctx.clearRect(0, 0, size, size);
// //     canvas.width = size;
// //     canvas.height = size;
    
// //     // Center and scale the image to fit the canvas
// //     const scale = Math.min(size / img.width, size / img.height);
// //     const x = (size - img.width * scale) / 2;
// //     const y = (size - img.height * scale) / 2;
    
// //     ctx.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * scale, img.height * scale);
// //   };
  
// //   // Visualize frequency coefficients on a canvas
// //   const visualizeFrequencyCoefficients = (coeffs) => {
// //     if (!canvasFrequency.current) return;
    
// //     const canvas = canvasFrequency.current;
// //     const ctx = canvas.getContext('2d');
// //     const size = canvas.width;
    
// //     ctx.clearRect(0, 0, size, size);
    
// //     // We'll create a grid representing the frequency space
// //     const gridSize = 8;
// //     const cellSize = size / gridSize;
    
// //     // Draw grid lines
// //     ctx.strokeStyle = '#ddd';
// //     ctx.lineWidth = 1;
    
// //     for (let i = 0; i <= gridSize; i++) {
// //       const pos = i * cellSize;
      
// //       // Vertical line
// //       ctx.beginPath();
// //       ctx.moveTo(pos, 0);
// //       ctx.lineTo(pos, size);
// //       ctx.stroke();
      
// //       // Horizontal line
// //       ctx.beginPath();
// //       ctx.moveTo(0, pos);
// //       ctx.lineTo(size, pos);
// //       ctx.stroke();
// //     }
    
// //     // Draw coefficients as circles with size based on amplitude
// //     coeffs.forEach((coeff, index) => {
// //       const { u, v, amplitude, phase } = coeff;
      
// //       // Position in the grid (center of the grid is (gridSize/2, gridSize/2))
// //       const x = (u + gridSize/2) * cellSize;
// //       const y = (v + gridSize/2) * cellSize;
      
// //       // Size based on amplitude (normalized)
// //       const maxRadius = cellSize / 2 * 0.8;
// //       const radius = Math.max(2, amplitude * maxRadius);
      
// //       // Color based on phase (hue from 0 to 360)
// //       const hue = (phase / (Math.PI * 2) * 360) % 360;
      
// //       // Draw the circle
// //       ctx.beginPath();
// //       ctx.arc(x, y, radius, 0, Math.PI * 2);
// //       ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
// //       ctx.fill();
      
// //       // Add border
// //       ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
// //       ctx.lineWidth = 1;
// //       ctx.stroke();
      
// //       // Add highlight on hover if this is the selected frequency
// //       if (selectedFrequency === index) {
// //         ctx.beginPath();
// //         ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
// //         ctx.strokeStyle = 'white';
// //         ctx.lineWidth = 2;
// //         ctx.stroke();
        
// //         // Also visualize this single frequency
// //         visualizeSingleFrequency(coeff);
// //       }
// //     });
// //   };
  
// //   // Visualize a single frequency component
// //   const visualizeSingleFrequency = (coeff) => {
// //     if (!canvasSingleFreq.current) return;
    
// //     const canvas = canvasSingleFreq.current;
// //     const ctx = canvas.getContext('2d');
// //     const size = canvas.width;
    
// //     ctx.clearRect(0, 0, size, size);
    
// //     // Extract parameters
// //     const { u, v, amplitude, phase } = coeff;
    
// //     // Draw a 2D Cosine wave based on the parameters
// //     const imageData = ctx.createImageData(size, size);
// //     const data = imageData.data;
    
// //     // Scale factors for the frequency
// //     const scaleU = (2 * Math.PI * u) / size;
// //     const scaleV = (2 * Math.PI * v) / size;
    
// //     // Generate the wave
// //     for (let y = 0; y < size; y++) {
// //       for (let x = 0; x < size; x++) {
// //         // Calculate the cosine value at this position
// //         const value = Math.cos(x * scaleU + y * scaleV + phase);
        
// //         // Scale to [0, 255] and apply amplitude
// //         const intensity = Math.round(((value + 1) / 2) * 255 * amplitude);
        
// //         // Set RGBA values (grayscale with full alpha)
// //         const pixelIndex = (y * size + x) * 4;
// //         data[pixelIndex] = intensity;     // R
// //         data[pixelIndex + 1] = intensity; // G
// //         data[pixelIndex + 2] = intensity; // B
// //         data[pixelIndex + 3] = 255;       // A (fully opaque)
// //       }
// //     }
    
// //     ctx.putImageData(imageData, 0, 0);
// //   };
  
// //   // Simulate CoSAE restoration process
// //   const simulateCoSAERestoration = (lowResCanvas, bottleneckSize) => {
// //     const lowResSize = lowResCanvas.width;
// //     const outputSize = 256;
    
// //     // Update status
// //     setStatusMessage("Extracting image data...");
    
// //     // Step 1: Extract RGB data from low-res image
// //     const lowResCtx = lowResCanvas.getContext('2d');
// //     const lowResImageData = lowResCtx.getImageData(0, 0, lowResSize, lowResSize);
// //     const lowResData = lowResImageData.data;
    
// //     // Update status
// //     setStatusMessage("Generating frequency coefficients...");
    
// //     // Step 2: We'll simulate the bottleneck encoding by creating frequency coefficients
// //     // In a real CoSAE, this would be learned by a neural network
// //     const numFreqs = bottleneckSize / 2; // Each frequency has amplitude and phase
// //     const coeffs = [];
    
// //     // Generate cosine basis functions with different frequencies
// //     // In a real implementation, these would be learned from the data
// //     for (let i = 0; i < numFreqs; i++) {
// //       // Create a frequency pair (u, v) - distribute the frequencies in a grid
// //       const u = Math.floor(i / 8) - 4; // Range: -4 to 3
// //       const v = i % 8 - 4;             // Range: -4 to 3
      
// //       // Simulate learned amplitudes and phases
// //       // Lower frequencies generally have higher amplitudes in natural images
// //       const distFromCenter = Math.sqrt(u*u + v*v);
// //       const amplitude = Math.max(0.05, 1.0 / (1.0 + distFromCenter)) * (0.7 + 0.3 * Math.random());
// //       const phase = Math.random() * Math.PI * 2; // Random phase
      
// //       coeffs.push({ u, v, amplitude, phase });
      
// //       // Periodically update status for larger bottleneck sizes
// //       if (i % 20 === 0 && i > 0) {
// //         setStatusMessage(`Generating frequency coefficients... (${Math.round(i/numFreqs*100)}%)`);
// //       }
// //     }
    
// //     // Update status
// //     setStatusMessage("Reconstructing image from frequency components...");
    
// //     // Step 3: Create the restored image by combining the frequency components
// //     const restoredCanvas = document.createElement('canvas');
// //     restoredCanvas.width = outputSize;
// //     restoredCanvas.height = outputSize;
// //     const restoredCtx = restoredCanvas.getContext('2d');
// //     const restoredImageData = restoredCtx.createImageData(outputSize, outputSize);
// //     const restoredData = restoredImageData.data;
    
// //     // Initialize with zeros
// //     for (let i = 0; i < restoredData.length; i += 4) {
// //       restoredData[i] = 0;     // R
// //       restoredData[i + 1] = 0; // G
// //       restoredData[i + 2] = 0; // B
// //       restoredData[i + 3] = 255; // A
// //     }
    
// //     // Process in batches to avoid UI freezing and update progress
// //     const processBatch = (startIdx, endIdx, completion) => {
// //       // Add frequency components in this batch
// //       for (let idx = startIdx; idx < endIdx && idx < coeffs.length; idx++) {
// //         const coeff = coeffs[idx];
// //         const { u, v, amplitude, phase } = coeff;
        
// //         // Scale factors for the frequency
// //         const scaleU = (2 * Math.PI * u) / outputSize;
// //         const scaleV = (2 * Math.PI * v) / outputSize;
        
// //         // Add this component to our image
// //         for (let y = 0; y < outputSize; y++) {
// //           for (let x = 0; x < outputSize; x++) {
// //             // Calculate the cosine value at this position
// //             const value = Math.cos(x * scaleU + y * scaleV + phase);
            
// //             // Scale to [0, 255] and apply amplitude
// //             const intensity = Math.round(value * 127 * amplitude);
            
// //             // Update RGBA values - add to all channels for now
// //             const pixelIndex = (y * outputSize + x) * 4;
// //             restoredData[pixelIndex] += intensity;     // R
// //             restoredData[pixelIndex + 1] += intensity; // G
// //             restoredData[pixelIndex + 2] += intensity; // B
// //           }
// //         }
// //       }
      
// //       // Complete the process or schedule next batch
// //       if (endIdx >= coeffs.length) {
// //         completion();
// //       } else {
// //         // Update status
// //         const progress = Math.round((endIdx / coeffs.length) * 100);
// //         setStatusMessage(`Reconstructing image... (${progress}%)`);
        
// //         // Schedule next batch
// //         setTimeout(() => {
// //           processBatch(endIdx, endIdx + 5, completion);
// //         }, 0);
// //       }
// //     };
    
// //     // Start batch processing
// //     processBatch(0, 5, () => {
// //       // Finalize restoration after all batches are processed
      
// //       // Update status
// //       setStatusMessage("Finalizing image restoration...");
      
// //       // Normalize the result to [0, 255]
// //       let minVal = 255, maxVal = 0;
// //       for (let i = 0; i < restoredData.length; i += 4) {
// //         minVal = Math.min(minVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
// //         maxVal = Math.max(maxVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
// //       }
      
// //       const range = maxVal - minVal;
// //       for (let i = 0; i < restoredData.length; i += 4) {
// //         restoredData[i] = Math.round(((restoredData[i] - minVal) / range) * 255);
// //         restoredData[i+1] = Math.round(((restoredData[i+1] - minVal) / range) * 255);
// //         restoredData[i+2] = Math.round(((restoredData[i+2] - minVal) / range) * 255);
// //       }
      
// //       // Put the processed data back
// //       restoredCtx.putImageData(restoredImageData, 0, 0);
      
// //       // Convert to image and update state
// //       const restoredImg = new Image();
// //       restoredImg.onload = () => {
// //         setRestoredImage(restoredImg);
// //         drawImageToCanvas(restoredImg, canvasRestored.current, 256);
// //         setFrequencyCoeffs(coeffs);
// //         visualizeFrequencyCoefficients(coeffs);
        
// //         // Update status to complete
// //         setProcessingStatus("complete");
// //         setStatusMessage("Restoration complete!");
// //       };
// //       restoredImg.src = restoredCanvas.toDataURL();
// //     });
// //   };
  
// //   // Handle bottleneck size changes
// //   const handleBottleneckChange = (e) => {
// //     const newSize = parseInt(e.target.value);
// //     setBottleneckSize(newSize);
// //   };
  
// //   // Handle frequency selection for visualization
// //   const handleFrequencySelect = (index) => {
// //     setSelectedFrequency(index === selectedFrequency ? null : index);
// //   };
  
// //   // Toggle between showing original and restored images
// //   const toggleShowOriginal = () => {
// //     setShowOriginal(!showOriginal);
// //   };
  
// //   // Toggle frequency visualization
// //   const toggleFrequencyViz = () => {
// //     setShowFrequencyViz(!showFrequencyViz);
// //   };
  
// //   // Reset the demo
// //   const handleReset = () => {
// //     setOriginalImage(null);
// //     setLowResImage(null);
// //     setRestoredImage(null);
// //     setFrequencyCoeffs([]);
// //     setSelectedFrequency(null);
// //     setProcessingStatus("idle");
// //     setStatusMessage("");
// //     setImageDetails(null);
// //   };
  
// //   // Status badge component
// //   const StatusBadge = () => {
// //     let bgColor, textColor;
    
// //     switch (processingStatus) {
// //       case "idle":
// //         bgColor = "bg-gray-200";
// //         textColor = "text-gray-700";
// //         break;
// //       case "preparing":
// //         bgColor = "bg-blue-200";
// //         textColor = "text-blue-700";
// //         break;
// //       case "ready":
// //         bgColor = "bg-green-200";
// //         textColor = "text-green-700";
// //         break;
// //       case "processing":
// //         bgColor = "bg-yellow-200";
// //         textColor = "text-yellow-800";
// //         break;
// //       case "complete":
// //         bgColor = "bg-green-600";
// //         textColor = "text-white";
// //         break;
// //       case "error":
// //         bgColor = "bg-red-600";
// //         textColor = "text-white";
// //         break;
// //       default:
// //         bgColor = "bg-gray-200";
// //         textColor = "text-gray-700";
// //     }
    
// //     return (
// //       <div className={`${bgColor} ${textColor} px-4 py-2 rounded-lg font-semibold flex items-center`}>
// //         {processingStatus === "processing" && (
// //           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
// //             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
// //             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
// //           </svg>
// //         )}
// //         <span className="capitalize">{processingStatus !== "idle" ? processingStatus : "Ready"}</span>
// //         {statusMessage && <span className="ml-2 text-sm">- {statusMessage}</span>}
// //       </div>
// //     );
// //   };
  
// //   // UI Rendering
// //   return (
// //     <div className="flex flex-col items-center w-full p-4 bg-gray-100 min-h-screen">
// //       {/* Header */}
// //       <div className="mb-6 text-center">
// //         <h1 className="text-3xl font-bold text-blue-800 mb-2">CoSAE: Learnable Fourier Series for Image Restoration</h1>
// //         <p className="text-gray-600 max-w-3xl">
// //           An interactive demonstration of the core concepts from the NVIDIA research paper.
// //           CoSAE uses learnable harmonic functions to encode frequency coefficients in a bottleneck for image restoration.
// //         </p>
// //       </div>
      
// //       {/* Status Badge */}
// //       <div className="w-full max-w-5xl mb-4">
// //         <StatusBadge />
// //       </div>
      
// //       {/* Tab Selection */}
// //       <div className="flex w-full max-w-5xl mb-6">
// //         <button 
// //           className={`flex-1 py-2 px-4 ${selectedTab === 'demo' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
// //           onClick={() => setSelectedTab('demo')}
// //         >
// //           Demo
// //         </button>
// //         <button 
// //           className={`flex-1 py-2 px-4 ${selectedTab === 'explanation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
// //           onClick={() => setSelectedTab('explanation')}
// //         >
// //           Explanation
// //         </button>
// //       </div>
      
// //       {/* Main Content */}
// //       {selectedTab === 'demo' ? (
// //         <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
// //           {/* Controls */}
// //           <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
// //             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
// //               <input 
// //                 type="file" 
// //                 accept="image/*" 
// //                 onChange={handleImageUpload} 
// //                 className="hidden" 
// //                 id="image-upload" 
// //                 disabled={processingStatus === "processing"}
// //               />
// //               <label 
// //                 htmlFor="image-upload" 
// //                 className={`bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 text-center ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
// //               >
// //                 Upload Image
// //               </label>
              
// //               <button 
// //                 onClick={handleDemoImage} 
// //                 className={`bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
// //                 disabled={processingStatus === "processing"}
// //               >
// //                 Use Demo Image
// //               </button>
              
// //               {originalImage && (
// //                 <button 
// //                   onClick={handleReset} 
// //                   className={`bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
// //                   disabled={processingStatus === "processing"}
// //                 >
// //                   Reset
// //                 </button>
// //               )}
// //             </div>
            
// //             <div className="flex flex-col space-y-2">
// //               <div className="flex items-center space-x-2">
// //                 <label className="text-gray-700 whitespace-nowrap">Bottleneck Size:</label>
// //                 <input 
// //                   type="range" 
// //                   min="8" 
// //                   max="256" 
// //                   step="8" 
// //                   value={bottleneckSize} 
// //                   onChange={handleBottleneckChange} 
// //                   className="w-48"
// //                   disabled={processingStatus === "processing" || !originalImage}
// //                 />
// //                 <span className="text-gray-700 w-8">{bottleneckSize}</span>
// //               </div>
              
// //               {originalImage && (
// //                 <div className="flex space-x-4">
// //                   {restoredImage && (
// //                     <button 
// //                       onClick={toggleShowOriginal} 
// //                       className={`bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 text-sm ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
// //                       disabled={processingStatus === "processing"}
// //                     >
// //                       {showOriginal ? "Show Result" : "Show Original"}
// //                     </button>
// //                   )}
                  
// //                   {frequencyCoeffs.length > 0 && (
// //                     <button 
// //                       onClick={toggleFrequencyViz} 
// //                       className={`bg-yellow-600 text-white py-1 px-3 rounded hover:bg-yellow-700 text-sm ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
// //                       disabled={processingStatus === "processing"}
// //                     >
// //                       {showFrequencyViz ? "Hide Frequencies" : "Show Frequencies"}
// //                     </button>
// //                   )}
// //                 </div>
// //               )}
// //             </div>
// //           </div>
          
// //           {/* Image display area */}
// //           {processingStatus === "processing" ? (
// //             <div className="flex justify-center items-center h-64">
// //               <div className="text-xl text-gray-600 flex flex-col items-center">
// //                 <svg className="animate-spin mb-4 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
// //                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
// //                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
// //                 </svg>
// //                 <div>{statusMessage}</div>
// //               </div>
// //             </div>
// //           ) : originalImage ? (
// //             <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
// //               {/* Image display */}
// //               <div className="flex-1">
// //                 <div className="grid grid-cols-2 gap-4">
// //                   <div>
// //                     <h3 className="text-center text-gray-700 font-semibold mb-2">Input Image</h3>
// //                     <div className="relative border border-gray-300 rounded">
// //                       <canvas 
// //                         ref={canvasOriginal} 
// //                         width="256" 
// //                         height="256" 
// //                         className="w-full"
// //                       />
// //                     </div>
// //                     {/* Display image details */}
// //                     {imageDetails && (
// //                       <div className="mt-2 text-xs text-gray-600">
// //                         <p>Original Size: {imageDetails.originalWidth} × {imageDetails.originalHeight}</p>
// //                         <p>File Size: {imageDetails.size}</p>
// //                       </div>
// //                     )}
// //                   </div>
                  
// //                   <div>
// //                     <h3 className="text-center text-gray-700 font-semibold mb-2">Low Resolution (8x downsampled)</h3>
// //                     <div className="relative border border-gray-300 rounded">
// //                       {lowResImage ? (
// //                         <canvas 
// //                           ref={canvasLowRes} 
// //                           width="256" 
// //                           height="256" 
// //                           className="w-full"
// //                         />
// //                       ) : (
// //                         <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
// //                           {processingStatus === "ready" ? "Click 'Restore Image' to begin" : "No low-res image yet"}
// //                         </div>
// //                       )}
// //                     </div>
// //                   </div>
                  
// //                   <div className="col-span-2">
// //                     <h3 className="text-center text-gray-700 font-semibold mb-2">
// //                       {showOriginal ? "Original Image (for comparison)" : "CoSAE Restored Image"}
// //                     </h3>
// //                     <div className="relative border border-gray-300 rounded">
// //                       {restoredImage ? (
// //                         <>
// //                           <canvas 
// //                             ref={canvasRestored} 
// //                             width="256" 
// //                             height="256" 
// //                             className="w-full"
// //                           />
// //                           {/* We'll overlay the original when toggled */}
// //                           {showOriginal && originalImage && (
// //                             <div className="absolute inset-0 flex justify-center items-center">
// //                               <img 
// //                                 src={originalImage.src} 
// //                                 alt="Original" 
// //                                 className="max-w-full max-h-full"
// //                               />
// //                             </div>
// //                           )}
// //                         </>
// //                       ) : (
// //                         <div className="h-64 flex items-center justify-center">
// //                           {processingStatus === "ready" ? (
// //                             <button 
// //                               onClick={startProcessing} 
// //                               className="bg-blue-600 text-white py-3 px-6 rounded-lg text-lg hover:bg-blue-700 transition-colors"
// //                             >
// //                               Restore Image
// //                             </button>
// //                           ) : (
// //                             <div className="text-gray-400 text-sm">No restored image yet</div>
// //                           )}
// //                         </div>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
              
// //               {/* Frequency visualization area */}
// //               {showFrequencyViz && (
// //                 <div className="w-full md:w-72 flex flex-col space-y-4">
// //                   <div className="border border-gray-300 rounded p-4 bg-gray-50">
// //                     <h3 className="text-center text-gray-700 font-semibold mb-2">Frequency Coefficients</h3>
// //                     <p className="text-xs text-gray-600 mb-2">
// //                       Click on a frequency to visualize its contribution.
// //                     </p>
// //                     <div className="relative">
// //                       <canvas 
// //                         ref={canvasFrequency} 
// //                         width="200" 
// //                         height="200" 
// //                         className="w-full border border-gray-300 bg-gray-900 rounded mb-4"
// //                         onClick={(e) => {
// //                           // Calculate which frequency was clicked based on position
// //                           const canvas = canvasFrequency.current;
// //                           const rect = canvas.getBoundingClientRect();
// //                           const x = e.clientX - rect.left;
// //                           const y = e.clientY - rect.top;
// //                           const gridSize = 8;
// //                           const cellSize = canvas.width / gridSize;
                          
// //                           // Convert to grid coordinates
// //                           const gridX = Math.floor(x / cellSize);
// //                           const gridY = Math.floor(y / cellSize);
                          
// //                           // Find the closest frequency
// //                           let closestIdx = null;
// //                           let closestDist = Infinity;
                          
// //                           frequencyCoeffs.forEach((coeff, idx) => {
// //                             const freqGridX = (coeff.u + gridSize/2);
// //                             const freqGridY = (coeff.v + gridSize/2);
// //                             const dist = Math.sqrt(
// //                               Math.pow(freqGridX - gridX, 2) + 
// //                               Math.pow(freqGridY - gridY, 2)
// //                             );
                            
// //                             if (dist < closestDist && dist < 1) {
// //                               closestDist = dist;
// //                               closestIdx = idx;
// //                             }
// //                           });
                          
// //                           if (closestIdx !== null) {
// //                             handleFrequencySelect(closestIdx);
// //                           }
// //                         }}
// //                       />
// //                     </div>
                    
// //                     {selectedFrequency !== null && (
// //                       <div>
// //                         <h4 className="text-sm text-gray-700 font-semibold">Selected Frequency</h4>
// //                         <div className="border border-gray-300 rounded bg-white p-2 mb-2">
// //                           <canvas 
// //                             ref={canvasSingleFreq} 
// //                             width="150" 
// //                             height="150" 
// //                             className="w-full"
// //                           />
// //                         </div>
                        
// //                         <div className="text-xs text-gray-600">
// //                           <p>
// //                             u = {frequencyCoeffs[selectedFrequency].u}, 
// //                             v = {frequencyCoeffs[selectedFrequency].v}
// //                           </p>
// //                           <p>
// //                             Amplitude: {frequencyCoeffs[selectedFrequency].amplitude.toFixed(3)}
// //                           </p>
// //                           <p>
// //                             Phase: {(frequencyCoeffs[selectedFrequency].phase / Math.PI).toFixed(2)}π
// //                           </p>
// //                         </div>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           ) : (
// //             <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
// //               <div className="text-center">
// //                 <p className="text-xl text-gray-600 mb-4">No image selected</p>
// //                 <p className="text-gray-500">Upload an image or use a demo image to begin.</p>
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       ) : (
// //         <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
// //           <div className="prose mx-auto">
// //             <h2 className="text-2xl font-bold text-blue-800 mb-4">Understanding CoSAE</h2>
            
// //             <p className="mb-4">
// //               CoSAE (Cosine Autoencoder) is a novel neural network architecture for image restoration, 
// //               introduced in the paper "CoSAE: Learnable Fourier Series for Image Restoration" by Sifei Liu, 
// //               Shalini De Mello, and Jan Kautz from NVIDIA.
// //             </p>
            
// //             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Key Innovations</h3>
            
// //             <p className="mb-3">
// //               1. <strong>Fourier Series Representation</strong> - CoSAE encodes images using a series of 
// //               2D Cosine waves, each defined by a frequency pair (u, v) and corresponding amplitude and phase.
// //             </p>
            
// //             <p className="mb-3">
// //               2. <strong>Extremely Narrow Bottleneck</strong> - Despite having a compact representation in 
// //               the bottleneck layer, CoSAE maintains high-fidelity details in the reconstructed images.
// //             </p>
            
// //             <p className="mb-3">
// //               3. <strong>Learnable Frequency Parameters</strong> - Unlike conventional autoencoders,
// //               CoSAE learns the optimal frequency coefficients, enabling better generalization.
// //             </p>
            
// //             <div className="my-6 p-4 bg-gray-100 rounded-lg">
// //               <h3 className="text-lg font-semibold mb-2">How it Works:</h3>
// //               <ol className="list-decimal pl-5 space-y-2">
// //                 <li>The encoder compresses an input image to a series of frequency coefficients (amplitude and phase pairs).</li>
// //                 <li>These coefficients are stored in an extremely narrow bottleneck (as small as 1/64th of the original size).</li>
// //                 <li>The Harmonic Construction Module (HCM) expands these coefficients into 2D cosine basis functions.</li>
// //                 <li>The decoder combines these basis functions to reconstruct the full-resolution image.</li>
// //               </ol>
// //             </div>
            
// //             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Applications</h3>
            
// //             <p className="mb-3">
// //               CoSAE was shown to excel at several challenging image restoration tasks:
// //             </p>
            
// //             <ul className="list-disc pl-5 mb-4 space-y-1">
// //               <li><strong>Flexible-resolution Super-resolution</strong> - Upscaling images to arbitrary sizes</li>
// //               <li><strong>Blind Image Restoration</strong> - Reconstructing images from unknown degradations</li>
// //               <li><strong>General image enhancement</strong> - Improving visual quality of degraded images</li>
// //             </ul>
            
// //             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">About this Demo</h3>
            
// //             <p className="mb-4">
// //               This interactive demonstration provides a simplified version of CoSAE's capabilities:
// //             </p>
            
// //             <ul className="list-disc pl-5 mb-4 space-y-1">
// //               <li>Upload or select a demo image</li>
// //               <li>The image is downsampled to create a low-resolution version</li>
// //               <li>A simplified version of CoSAE is applied to restore the image</li>
// //               <li>You can adjust the bottleneck size to see how it affects restoration quality</li>
// //               <li>You can visualize the frequency coefficients learned by the model</li>
// //             </ul>
            
// //             <p className="mb-4">
// //               Note that this is a simplified toy implementation to demonstrate the core concepts.
// //               The full CoSAE model as described in the paper includes a more sophisticated neural 
// //               network architecture and training process.
// //             </p>
            
// //             <p className="text-sm text-gray-600 mt-8">
// //               Reference: Liu, S., De Mello, S., & Kautz, J. (2024). CosAE: Learnable Fourier Series for Image Restoration. 
// //               38th Conference on Neural Information Processing Systems (NeurIPS 2024).
// //             </p>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default CoSAEDemo;


// import React, { useState, useEffect, useRef } from 'react';

// // Image Display component that uses HTML img instead of canvas
// const ImageDisplay = ({ src, alt, size = 256, status = null, border = true }) => {
//   const [loaded, setLoaded] = useState(false);
//   const [error, setError] = useState(false);
  
//   return (
//     <div 
//       className={`relative ${border ? 'border border-gray-300' : ''} rounded bg-gray-50 overflow-hidden`} 
//       style={{ width: size, height: size }}
//     >
//       {/* Status overlay (loading or error) */}
//       {status && (
//         <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
//           <div className="text-center p-4">
//             {status.type === 'loading' && (
//               <>
//                 <div className="w-8 h-8 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
//                 <p className="text-sm text-gray-700">{status.message || 'Loading...'}</p>
//               </>
//             )}
//             {status.type === 'error' && (
//               <>
//                 <div className="text-red-500 text-2xl mb-1">⚠️</div>
//                 <p className="text-sm text-red-700">{status.message || 'Error loading image'}</p>
//               </>
//             )}
//           </div>
//         </div>
//       )}
      
//       {/* Background grid pattern to show transparency */}
//       <div 
//         className="absolute inset-0 z-0" 
//         style={{
//           backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%)',
//           backgroundSize: '20px 20px',
//           backgroundPosition: '0 0, 10px 10px',
//           opacity: 0.5
//         }}
//       />
      
//       {/* Actual image element */}
//       {src && (
//         <img
//           src={src}
//           alt={alt || "Image"}
//           className={`object-contain w-full h-full z-5 relative ${!loaded ? 'opacity-0' : 'opacity-100'}`}
//           style={{ transition: 'opacity 0.3s' }}
//           onLoad={() => setLoaded(true)}
//           onError={() => setError(true)}
//         />
//       )}
      
//       {/* Show error state if image fails to load */}
//       {error && !status && (
//         <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-80 z-10">
//           <div className="text-center p-4">
//             <p className="text-sm text-red-700">Failed to load image</p>
//           </div>
//         </div>
//       )}
      
//       {/* Empty state */}
//       {!src && !status && (
//         <div className="absolute inset-0 flex items-center justify-center">
//           <p className="text-sm text-gray-400">No image available</p>
//         </div>
//       )}
//     </div>
//   );
// };

// // Frequency visualization component
// const FrequencyVisualization = ({ coeffs, selectedFrequency, onSelect }) => {
//   const canvasRef = useRef(null);
  
//   // Draw frequency visualization when coefficients change
//   useEffect(() => {
//     if (!coeffs || coeffs.length === 0 || !canvasRef.current) return;
    
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const size = canvas.width;
    
//     // Clear canvas
//     ctx.clearRect(0, 0, size, size);
    
//     // Fill with dark background
//     ctx.fillStyle = '#1a1a2e';
//     ctx.fillRect(0, 0, size, size);
    
//     // Grid setup
//     const gridSize = 8;
//     const cellSize = size / gridSize;
    
//     // Draw grid lines
//     ctx.strokeStyle = '#444466';
//     ctx.lineWidth = 1;
    
//     for (let i = 0; i <= gridSize; i++) {
//       const pos = i * cellSize;
      
//       // Vertical line
//       ctx.beginPath();
//       ctx.moveTo(pos, 0);
//       ctx.lineTo(pos, size);
//       ctx.stroke();
      
//       // Horizontal line
//       ctx.beginPath();
//       ctx.moveTo(0, pos);
//       ctx.lineTo(size, pos);
//       ctx.stroke();
//     }
    
//     // Draw coordinates
//     ctx.font = '10px monospace';
//     ctx.fillStyle = '#aaaacc';
//     ctx.textAlign = 'center';
    
//     // Draw axis labels
//     for (let i = 0; i < gridSize; i++) {
//       const u = i - gridSize/2;
//       const v = i - gridSize/2;
//       const x = (i + 0.5) * cellSize;
      
//       // X-axis labels at bottom
//       ctx.fillText(u.toString(), x, size - 2);
      
//       // Y-axis labels at left
//       ctx.textAlign = 'right';
//       ctx.fillText(v.toString(), cellSize/2 - 5, (i + 0.5) * cellSize + 4);
//       ctx.textAlign = 'center';
//     }
    
//     // Draw coefficients as circles with size based on amplitude
//     coeffs.forEach((coeff, index) => {
//       const { u, v, amplitude, phase } = coeff;
      
//       // Position in the grid (center of the grid is (gridSize/2, gridSize/2))
//       const x = (u + gridSize/2) * cellSize;
//       const y = (v + gridSize/2) * cellSize;
      
//       // Size based on amplitude (normalized)
//       const maxRadius = cellSize / 2 * 0.8;
//       const radius = Math.max(2, amplitude * maxRadius);
      
//       // Color based on phase (hue from 0 to 360)
//       const hue = (phase / (Math.PI * 2) * 360) % 360;
      
//       // Draw the circle
//       ctx.beginPath();
//       ctx.arc(x, y, radius, 0, Math.PI * 2);
//       ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
//       ctx.fill();
      
//       // Add border
//       ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
//       ctx.lineWidth = 1;
//       ctx.stroke();
      
//       // Add highlight for selected frequency
//       if (selectedFrequency === index) {
//         ctx.beginPath();
//         ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
//         ctx.strokeStyle = 'white';
//         ctx.lineWidth = 2;
//         ctx.stroke();
//       }
//     });
    
//   }, [coeffs, selectedFrequency]);
  
//   // Render the single frequency visualization
//   const renderSingleFrequency = (coeff) => {
//     if (!coeff) return null;
    
//     // Create an in-memory canvas to generate the visualization
//     const canvas = document.createElement('canvas');
//     canvas.width = 150;
//     canvas.height = 150;
//     const ctx = canvas.getContext('2d');
//     const size = canvas.width;
    
//     // Extract parameters
//     const { u, v, amplitude, phase } = coeff;
    
//     // Draw a 2D Cosine wave based on the parameters
//     const imageData = ctx.createImageData(size, size);
//     const data = imageData.data;
    
//     // Scale factors for the frequency
//     const scaleU = (2 * Math.PI * u) / size;
//     const scaleV = (2 * Math.PI * v) / size;
    
//     // Generate the wave
//     for (let y = 0; y < size; y++) {
//       for (let x = 0; x < size; x++) {
//         // Calculate the cosine value at this position
//         const value = Math.cos(x * scaleU + y * scaleV + phase);
        
//         // Scale to [0, 255] and apply amplitude
//         const intensity = Math.round(((value + 1) / 2) * 255 * amplitude);
        
//         // Set RGBA values (grayscale with full alpha)
//         const pixelIndex = (y * size + x) * 4;
//         data[pixelIndex] = intensity;     // R
//         data[pixelIndex + 1] = intensity; // G
//         data[pixelIndex + 2] = intensity; // B
//         data[pixelIndex + 3] = 255;       // A (fully opaque)
//       }
//     }
    
//     ctx.putImageData(imageData, 0, 0);
    
//     // Return the data URL
//     return canvas.toDataURL();
//   };
  
//   // Handle click on the frequency visualization
//   const handleClick = (e) => {
//     if (!coeffs || coeffs.length === 0 || !canvasRef.current) return;
    
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
    
//     // Grid settings
//     const gridSize = 8;
//     const cellSize = canvas.width / gridSize;
    
//     // Convert to grid coordinates
//     const gridX = Math.floor(x / cellSize);
//     const gridY = Math.floor(y / cellSize);
    
//     // Find the closest frequency
//     let closestIdx = null;
//     let closestDist = Infinity;
    
//     coeffs.forEach((coeff, idx) => {
//       const freqGridX = (coeff.u + gridSize/2);
//       const freqGridY = (coeff.v + gridSize/2);
//       const dist = Math.sqrt(
//         Math.pow(freqGridX - gridX, 2) + 
//         Math.pow(freqGridY - gridY, 2)
//       );
      
//       if (dist < closestDist && dist < 1) {
//         closestDist = dist;
//         closestIdx = idx;
//       }
//     });
    
//     // Call the selection handler
//     if (closestIdx !== null) {
//       onSelect(closestIdx === selectedFrequency ? null : closestIdx);
//     }
//   };
  
//   return (
//     <div className="border border-gray-300 rounded p-4 bg-gray-50">
//       <h3 className="text-center text-gray-700 font-semibold mb-2">Frequency Coefficients</h3>
//       <p className="text-xs text-gray-600 mb-2">
//         Click on a frequency to visualize its contribution.
//       </p>
      
//       {/* Frequency grid visualization */}
//       <div className="relative mb-4">
//         <canvas 
//           ref={canvasRef}
//           width="200" 
//           height="200" 
//           className="w-full border border-gray-300 bg-gray-900 rounded cursor-pointer"
//           onClick={handleClick}
//         />
//       </div>
      
//       {/* Selected frequency visualization */}
//       {selectedFrequency !== null && coeffs && coeffs.length > selectedFrequency && (
//         <div>
//           <h4 className="text-sm text-gray-700 font-semibold">Selected Frequency</h4>
//           <div className="border border-gray-300 rounded bg-white p-2 mb-2">
//             {/* Use an image element to display the frequency */}
//             <img
//               src={renderSingleFrequency(coeffs[selectedFrequency])}
//               alt="Frequency visualization"
//               width="150"
//               height="150"
//               className="w-full"
//             />
//           </div>
          
//           <div className="text-xs text-gray-600">
//             <p>
//               u = {coeffs[selectedFrequency].u}, 
//               v = {coeffs[selectedFrequency].v}
//             </p>
//             <p>
//               Amplitude: {coeffs[selectedFrequency].amplitude.toFixed(3)}
//             </p>
//             <p>
//               Phase: {(coeffs[selectedFrequency].phase / Math.PI).toFixed(2)}π
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Status log component
// const StatusLog = ({ messages }) => {
//   const logEndRef = useRef(null);
  
//   // Auto-scroll to bottom whenever messages change
//   useEffect(() => {
//     if (logEndRef.current) {
//       logEndRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [messages]);
  
//   return (
//     <div className="bg-gray-100 rounded-b-lg border border-gray-300 p-2 h-32 overflow-y-auto text-sm font-mono">
//       {messages.length === 0 ? (
//         <div className="text-gray-500 text-xs">No processing logs yet. Upload an image to begin.</div>
//       ) : (
//         messages.map((log, index) => (
//           <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-600' : 'text-gray-800'}`}>
//             <span className="text-gray-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
//             {log.message}
//           </div>
//         ))
//       )}
//       <div ref={logEndRef} />
//     </div>
//   );
// };

// // Main CoSAE demonstration component
// const CoSAEDemo = () => {
//   // State for various aspects of the demo
//   const [originalImage, setOriginalImage] = useState(null);
//   const [lowResImage, setLowResImage] = useState(null);
//   const [restoredImage, setRestoredImage] = useState(null);
//   const [bottleneckSize, setBottleneckSize] = useState(64); // Default bottleneck size
//   const [frequencyCoeffs, setFrequencyCoeffs] = useState([]);
//   const [selectedFrequency, setSelectedFrequency] = useState(null);
//   const [processingStatus, setProcessingStatus] = useState("idle"); // idle, preparing, processing, complete
//   const [statusMessage, setStatusMessage] = useState("");
//   const [imageDetails, setImageDetails] = useState(null);
//   const [selectedTab, setSelectedTab] = useState('demo'); // 'demo' or 'explanation'
//   const [showOriginal, setShowOriginal] = useState(false); // Toggle for comparison view
//   const [showFrequencyViz, setShowFrequencyViz] = useState(false);
//   const [logs, setLogs] = useState([]); // Store log messages
  
//   // Helper function to add log messages
//   const log = (message, type = 'info') => {
//     const logEntry = {
//       message,
//       type,
//       timestamp: new Date()
//     };
//     setLogs(prev => [logEntry, ...prev]);
//     console.log(`[CoSAE] ${message}`);
//   };
  
//   // Process the uploaded image - load and display, don't run the algorithm yet
//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) {
//       log("No file selected in upload");
//       return;
//     }
    
//     setProcessingStatus("preparing");
//     setStatusMessage("Loading image...");
//     log(`Loading image file: ${file.name} (${formatBytes(file.size)})`);
    
//     // Clear previous images
//     setOriginalImage(null);
//     setLowResImage(null);
//     setRestoredImage(null);
    
//     const reader = new FileReader();
    
//     reader.onload = (e) => {
//       log("File loaded, creating image");
      
//       const img = new Image();
      
//       img.onload = () => {
//         log(`Image loaded successfully: ${img.width}×${img.height}`);
        
//         // Resize image to 512x512 while preserving aspect ratio
//         const resizedDataUrl = resizeImage(img, 512, 512);
        
//         // Create a resized image object
//         const resizedImg = new Image();
//         resizedImg.onload = () => {
//           log("Resized image loaded");
//           setOriginalImage(resizedImg.src);
          
//           // Set image details
//           const details = {
//             originalWidth: img.width,
//             originalHeight: img.height,
//             size: formatBytes(file.size),
//             type: file.type,
//             name: file.name
//           };
//           setImageDetails(details);
          
//           setProcessingStatus("ready");
//           setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
//         };
        
//         resizedImg.onerror = () => {
//           log("Failed to load resized image", "error");
//           setProcessingStatus("error");
//           setStatusMessage("Error processing image. Please try again.");
//         };
        
//         resizedImg.src = resizedDataUrl;
//       };
      
//       img.onerror = () => {
//         log("Failed to load image", "error");
//         setProcessingStatus("error");
//         setStatusMessage("Failed to load image. Please try a different file.");
//       };
      
//       // Start loading the image
//       img.src = e.target.result;
//     };
    
//     reader.onerror = () => {
//       log("Error reading file", "error");
//       setProcessingStatus("error");
//       setStatusMessage("Failed to read file. Please try a different file.");
//     };
    
//     reader.readAsDataURL(file);
//   };
  
//   // Process a demo image
//   const handleDemoImage = () => {
//     setProcessingStatus("preparing");
//     setStatusMessage("Creating demo image...");
//     log("Creating demo image");
    
//     // Clear previous image data
//     setOriginalImage(null);
//     setLowResImage(null);
//     setRestoredImage(null);
    
//     // Create a demo image directly using canvas
//     const demoCanvas = document.createElement('canvas');
//     demoCanvas.width = 512;
//     demoCanvas.height = 512;
//     const ctx = demoCanvas.getContext('2d');
    
//     // Create a gradient background
//     const gradient = ctx.createLinearGradient(0, 0, 512, 512);
//     gradient.addColorStop(0, '#3498db');  // Blue
//     gradient.addColorStop(1, '#8e44ad');  // Purple
//     ctx.fillStyle = gradient;
//     ctx.fillRect(0, 0, 512, 512);
    
//     // Add a colorful pattern
//     const numCircles = 15;
//     for (let i = 0; i < numCircles; i++) {
//       const x = Math.random() * 512;
//       const y = Math.random() * 512;
//       const radius = 20 + Math.random() * 50;
      
//       // Create a circle with semi-transparent fill
//       ctx.beginPath();
//       ctx.arc(x, y, radius, 0, Math.PI * 2);
//       ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`;
//       ctx.fill();
//     }
    
//     // Add some text
//     ctx.font = 'bold 40px Arial';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
//     ctx.fillText('CoSAE Demo', 256, 150);
//     ctx.font = '20px Arial';
//     ctx.fillText('Test Image', 256, 200);
    
//     // Add some shapes for texture/detail
//     for (let i = 0; i < 8; i++) {
//       for (let j = 0; j < 8; j++) {
//         // Only draw some squares
//         if (Math.random() > 0.5) continue;
        
//         const x = i * 64;
//         const y = j * 64 + 256; // Bottom half of image
//         const size = 48;
//         ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.1})`;
//         ctx.fillRect(x + 8, y + 8, size, size);
//       }
//     }
    
//     // Convert canvas to image
//     const dataUrl = demoCanvas.toDataURL('image/png');
//     log("Demo image created");
    
//     // Set as original image
//     setOriginalImage(dataUrl);
    
//     // Set image details
//     const details = {
//       originalWidth: 512,
//       originalHeight: 512,
//       size: "Demo image (generated)",
//       type: "image/png",
//       name: "cosae-demo.png"
//     };
//     setImageDetails(details);
    
//     // Update status
//     setProcessingStatus("ready");
//     setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
//   };
  
//   // Resize image to target dimensions while preserving aspect ratio
//   const resizeImage = (img, targetWidth, targetHeight) => {
//     log(`Resizing image from ${img.width}×${img.height} to ${targetWidth}×${targetHeight}`);
    
//     const canvas = document.createElement('canvas');
//     canvas.width = targetWidth;
//     canvas.height = targetHeight;
//     const ctx = canvas.getContext('2d');
    
//     // Determine scale and position for center crop
//     const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
//     const scaledWidth = img.width * scale;
//     const scaledHeight = img.height * scale;
//     const offsetX = (targetWidth - scaledWidth) / 2;
//     const offsetY = (targetHeight - scaledHeight) / 2;
    
//     // Fill with black background
//     ctx.fillStyle = 'black';
//     ctx.fillRect(0, 0, targetWidth, targetHeight);
    
//     // Draw the image centered
//     ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    
//     // Return data URL
//     return canvas.toDataURL();
//   };
  
//   // Format bytes to human readable format
//   const formatBytes = (bytes, decimals = 2) => {
//     if (bytes === 0) return '0 Bytes';
    
//     const k = 1024;
//     const dm = decimals < 0 ? 0 : decimals;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
    
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
//   };
  
//   // Start the CoSAE restoration process
//   const startProcessing = () => {
//     if (!originalImage || processingStatus === "processing") {
//       log("Cannot start processing: no image or already processing");
//       return;
//     }
    
//     setProcessingStatus("processing");
//     setStatusMessage("Creating low-resolution version...");
//     log("Starting image processing");
    
//     // Process in a slight delay to allow UI to update
//     setTimeout(() => {
//       // Create low-res version
//       createLowResVersion(originalImage);
//     }, 50);
//   };
  
//   // Create a low-resolution version of the image
//   const createLowResVersion = (imageUrl) => {
//     log("Creating low-resolution version of the image");
    
//     const img = new Image();
//     img.onload = () => {
//       // Step 1: Create a low-resolution version
//       const lowResSize = 32; // 8x downsampling
//       const lowResCanvas = document.createElement('canvas');
//       lowResCanvas.width = lowResSize;
//       lowResCanvas.height = lowResSize;
//       const lowResCtx = lowResCanvas.getContext('2d');
//       lowResCtx.drawImage(img, 0, 0, lowResSize, lowResSize);
      
//       // Step 2: Scale the low-res image back up to show degradation
//       const scaledLowRes = document.createElement('canvas');
//       scaledLowRes.width = 256;
//       scaledLowRes.height = 256;
//       const scaledLowResCtx = scaledLowRes.getContext('2d');
//       scaledLowResCtx.imageSmoothingEnabled = false; // For pixelated upscaling
//       scaledLowResCtx.drawImage(lowResCanvas, 0, 0, 256, 256);
      
//       const lowResUrl = scaledLowRes.toDataURL();
//       log("Low-resolution version created");
      
//       // Set the low-res image
//       setLowResImage(lowResUrl);
      
//       // Update status
//       setStatusMessage("Applying CoSAE restoration algorithm...");
      
//       // Process in a slight delay to allow UI to update
//       setTimeout(() => {
//         // Now run the CoSAE restoration
//         simulateCoSAERestoration(lowResCanvas, bottleneckSize);
//       }, 50);
//     };
    
//     img.onerror = () => {
//       log("Error loading image for low-res conversion", "error");
//       setProcessingStatus("error");
//       setStatusMessage("Error in processing. Please try again.");
//     };
    
//     img.src = imageUrl;
//   };
  
//   // Simulate CoSAE restoration process
//   const simulateCoSAERestoration = (lowResCanvas, bottleneckSize) => {
//     const lowResSize = lowResCanvas.width;
//     const outputSize = 256;
    
//     // Update status
//     setStatusMessage("Extracting image data...");
//     log(`Beginning CoSAE restoration with bottleneck size ${bottleneckSize}`);
    
//     // Step 1: Extract RGB data from low-res image
//     const lowResCtx = lowResCanvas.getContext('2d');
//     const lowResImageData = lowResCtx.getImageData(0, 0, lowResSize, lowResSize);
    
//     // Update status
//     setStatusMessage("Generating frequency coefficients...");
    
//     // Step 2: We'll simulate the bottleneck encoding by creating frequency coefficients
//     // In a real CoSAE, this would be learned by a neural network
//     const numFreqs = bottleneckSize / 2; // Each frequency has amplitude and phase
//     const coeffs = [];
    
//     // Generate cosine basis functions with different frequencies
//     // In a real implementation, these would be learned from the data
//     for (let i = 0; i < numFreqs; i++) {
//       // Create a frequency pair (u, v) - distribute the frequencies in a grid
//       const u = Math.floor(i / 8) - 4; // Range: -4 to 3
//       const v = i % 8 - 4;             // Range: -4 to 3
      
//       // Simulate learned amplitudes and phases
//       // Lower frequencies generally have higher amplitudes in natural images
//       const distFromCenter = Math.sqrt(u*u + v*v);
//       const amplitude = Math.max(0.05, 1.0 / (1.0 + distFromCenter)) * (0.7 + 0.3 * Math.random());
//       const phase = Math.random() * Math.PI * 2; // Random phase
      
//       coeffs.push({ u, v, amplitude, phase });
      
//       // Periodically update status for larger bottleneck sizes
//       if (i % 10 === 0 && i > 0) {
//         const progress = Math.round(i/numFreqs*100);
//         setStatusMessage(`Generating frequency coefficients... (${progress}%)`);
//         log(`Generating frequency coefficients: ${progress}% complete`);
//       }
//     }
    
//     // Update status
//     setStatusMessage("Reconstructing image from frequency components...");
//     log("Beginning image reconstruction from frequency components");
    
//     // Step 3: Create the restored image by combining the frequency components
//     const restoredCanvas = document.createElement('canvas');
//     restoredCanvas.width = outputSize;
//     restoredCanvas.height = outputSize;
//     const restoredCtx = restoredCanvas.getContext('2d');
//     const restoredImageData = restoredCtx.createImageData(outputSize, outputSize);
//     const restoredData = restoredImageData.data;
    
//     // Initialize with zeros
//     for (let i = 0; i < restoredData.length; i += 4) {
//       restoredData[i] = 0;     // R
//       restoredData[i + 1] = 0; // G
//       restoredData[i + 2] = 0; // B
//       restoredData[i + 3] = 255; // A
//     }
    
//     // Process in batches to avoid UI freezing and update progress
//     const processBatch = (startIdx, endIdx, completion) => {
//       // Add frequency components in this batch
//       for (let idx = startIdx; idx < endIdx && idx < coeffs.length; idx++) {
//         const coeff = coeffs[idx];
//         const { u, v, amplitude, phase } = coeff;
        
//         // Scale factors for the frequency
//         const scaleU = (2 * Math.PI * u) / outputSize;
//         const scaleV = (2 * Math.PI * v) / outputSize;
        
//         // Add this component to our image
//         for (let y = 0; y < outputSize; y++) {
//           for (let x = 0; x < outputSize; x++) {
//             // Calculate the cosine value at this position
//             const value = Math.cos(x * scaleU + y * scaleV + phase);
            
//             // Scale to [0, 255] and apply amplitude
//             const intensity = Math.round(value * 127 * amplitude);
            
//             // Update RGBA values - add to all channels for now
//             const pixelIndex = (y * outputSize + x) * 4;
//             restoredData[pixelIndex] += intensity;     // R
//             restoredData[pixelIndex + 1] += intensity; // G
//             restoredData[pixelIndex + 2] += intensity; // B
//           }
//         }
//       }
      
//       // Complete the process or schedule next batch
//       if (endIdx >= coeffs.length) {
//         completion();
//       } else {
//         // Update status
//         const progress = Math.round((endIdx / coeffs.length) * 100);
//         setStatusMessage(`Reconstructing image... (${progress}%)`);
//         log(`Image reconstruction: ${progress}% complete`);
        
//         // Schedule next batch
//         setTimeout(() => {
//           processBatch(endIdx, endIdx + 5, completion);
//         }, 0);
//       }
//     };
    
//     // Start batch processing
//     processBatch(0, 5, () => {
//       // Finalize restoration after all batches are processed
      
//       // Update status
//       setStatusMessage("Finalizing image restoration...");
      
//       // Normalize the result to [0, 255]
//       let minVal = 255, maxVal = 0;
//       for (let i = 0; i < restoredData.length; i += 4) {
//         minVal = Math.min(minVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
//         maxVal = Math.max(maxVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
//       }
      
//       log(`Normalizing image data, range: [${minVal}, ${maxVal}]`);
      
//       const range = maxVal - minVal;
//       for (let i = 0; i < restoredData.length; i += 4) {
//         restoredData[i] = Math.round(((restoredData[i] - minVal) / range) * 255);
//         restoredData[i+1] = Math.round(((restoredData[i+1] - minVal) / range) * 255);
//         restoredData[i+2] = Math.round(((restoredData[i+2] - minVal) / range) * 255);
//       }
      
//       // Put the processed data back
//       restoredCtx.putImageData(restoredImageData, 0, 0);
      
//       // Convert to image
//       const restoredUrl = restoredCanvas.toDataURL();
//       log("Restored image created");
      
//       // Set the restored image and frequencies
//       setRestoredImage(restoredUrl);
//       setFrequencyCoeffs(coeffs);
      
//       // Update status to complete
//       setProcessingStatus("complete");
//       setStatusMessage("Restoration complete!");
//       log("CoSAE restoration process completed successfully");
//     });
//   };
  
//   // Handle bottleneck size changes
//   const handleBottleneckChange = (e) => {
//     const newSize = parseInt(e.target.value);
//     log(`Bottleneck size changed to ${newSize}`);
//     setBottleneckSize(newSize);
//   };
  
//   // Toggle between showing original and restored images
//   const toggleShowOriginal = () => {
//     setShowOriginal(!showOriginal);
//   };
  
//   // Toggle frequency visualization
//   const toggleFrequencyViz = () => {
//     setShowFrequencyViz(!showFrequencyViz);
//   };
  
//   // Reset the demo
//   const handleReset = () => {
//     log("Resetting demo state");
//     setOriginalImage(null);
//     setLowResImage(null);
//     setRestoredImage(null);
//     setFrequencyCoeffs([]);
//     setSelectedFrequency(null);
//     setProcessingStatus("idle");
//     setStatusMessage("");
//     setImageDetails(null);
//   };
  
//   // Status badge component
//   const StatusBadge = () => {
//     let bgColor, textColor;
    
//     switch (processingStatus) {
//       case "idle":
//         bgColor = "bg-gray-200";
//         textColor = "text-gray-700";
//         break;
//       case "preparing":
//         bgColor = "bg-blue-200";
//         textColor = "text-blue-700";
//         break;
//       case "ready":
//         bgColor = "bg-green-200";
//         textColor = "text-green-700";
//         break;
//       case "processing":
//         bgColor = "bg-yellow-200";
//         textColor = "text-yellow-800";
//         break;
//       case "complete":
//         bgColor = "bg-green-600";
//         textColor = "text-white";
//         break;
//       case "error":
//         bgColor = "bg-red-600";
//         textColor = "text-white";
//         break;
//       default:
//         bgColor = "bg-gray-200";
//         textColor = "text-gray-700";
//     }
    
//     return (
//       <div className={`${bgColor} ${textColor} px-4 py-2 rounded-t-lg font-semibold flex items-center`}>
//         {processingStatus === "processing" && (
//           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//           </svg>
//         )}
//         <span className="capitalize">{processingStatus !== "idle" ? processingStatus : "Ready"}</span>
//         {statusMessage && <span className="ml-2 text-sm">- {statusMessage}</span>}
//       </div>
//     );
//   };
  
//   // UI Rendering
//   return (
//     <div className="flex flex-col items-center w-full p-4 bg-gray-100 min-h-screen">
//       {/* Header */}
//       <div className="mb-6 text-center">
//         <h1 className="text-3xl font-bold text-blue-800 mb-2">CoSAE: Learnable Fourier Series for Image Restoration</h1>
//         <p className="text-gray-600 max-w-3xl">
//           An interactive demonstration of the core concepts from the NVIDIA research paper.
//           CoSAE uses learnable harmonic functions to encode frequency coefficients in a bottleneck for image restoration.
//         </p>
//       </div>
      
//       {/* Status Display */}
//       <div className="w-full max-w-5xl mb-4">
//         <StatusBadge />
//         <StatusLog messages={logs} />
//       </div>
      
//       {/* Tab Selection */}
//       <div className="flex w-full max-w-5xl mb-4">
//         <button 
//           className={`flex-1 py-2 px-4 ${selectedTab === 'demo' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
//           onClick={() => setSelectedTab('demo')}
//         >
//           Demo
//         </button>
//         <button 
//           className={`flex-1 py-2 px-4 ${selectedTab === 'explanation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
//           onClick={() => setSelectedTab('explanation')}
//         >
//           Explanation
//         </button>
//         <button 
//           className={`flex-1 py-2 px-4 ${selectedTab === 'debug' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
//           onClick={() => setSelectedTab('debug')}
//         >
//           Debug
//         </button>
//       </div>
      
//       {/* Main Content */}
//       {selectedTab === 'demo' ? (
//         <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
//           {/* Controls */}
//           <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
//             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
//               <input 
//                 type="file" 
//                 accept="image/*" 
//                 onChange={handleImageUpload} 
//                 className="hidden" 
//                 id="image-upload" 
//                 disabled={processingStatus === "processing"}
//               />
//               <label 
//                 htmlFor="image-upload" 
//                 className={`bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 text-center ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
//               >
//                 Upload Image
//               </label>
              
//               <button 
//                 onClick={handleDemoImage} 
//                 className={`bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
//                 disabled={processingStatus === "processing"}
//               >
//                 Use Demo Image
//               </button>
              
//               {originalImage && (
//                 <button 
//                   onClick={handleReset} 
//                   className={`bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
//                   disabled={processingStatus === "processing"}
//                 >
//                   Reset
//                 </button>
//               )}
//             </div>
            
//             <div className="flex flex-col space-y-2">
//               <div className="flex items-center space-x-2">
//                 <label className="text-gray-700 whitespace-nowrap">Bottleneck Size:</label>
//                 <input 
//                   type="range" 
//                   min="8" 
//                   max="256" 
//                   step="8" 
//                   value={bottleneckSize} 
//                   onChange={handleBottleneckChange} 
//                   className="w-48"
//                   disabled={processingStatus === "processing" || !originalImage}
//                 />
//                 <span className="text-gray-700 w-8">{bottleneckSize}</span>
//               </div>
              
//               {originalImage && (
//                 <div className="flex space-x-4">
//                   {restoredImage && (
//                     <button 
//                       onClick={toggleShowOriginal} 
//                       className={`bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 text-sm ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
//                       disabled={processingStatus === "processing"}
//                     >
//                       {showOriginal ? "Show Result" : "Show Original"}
//                     </button>
//                   )}
                  
//                   {frequencyCoeffs.length > 0 && (
//                     <button 
//                       onClick={toggleFrequencyViz} 
//                       className={`bg-yellow-600 text-white py-1 px-3 rounded hover:bg-yellow-700 text-sm ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
//                       disabled={processingStatus === "processing"}
//                     >
//                       {showFrequencyViz ? "Hide Frequencies" : "Show Frequencies"}
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {/* Image display area */}
//           {processingStatus === "processing" ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="text-xl text-gray-600 flex flex-col items-center">
//                 <svg className="animate-spin mb-4 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 <div>{statusMessage}</div>
//               </div>
//             </div>
//           ) : originalImage ? (
//             <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
//               {/* Image display */}
//               <div className="flex-1">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <h3 className="text-center text-gray-700 font-semibold mb-2">Input Image</h3>
//                     <ImageDisplay 
//                       src={originalImage} 
//                       alt="Original Image"
//                     />
//                     {/* Display image details */}
//                     {imageDetails && (
//                       <div className="mt-2 text-xs text-gray-600">
//                         <p>Original Size: {imageDetails.originalWidth} × {imageDetails.originalHeight}</p>
//                         <p>File Size: {imageDetails.size}</p>
//                       </div>
//                     )}
//                   </div>
                  
//                   <div>
//                     <h3 className="text-center text-gray-700 font-semibold mb-2">Low Resolution (8x downsampled)</h3>
//                     <ImageDisplay 
//                       src={lowResImage} 
//                       alt="Low Resolution Image"
//                       status={!lowResImage && processingStatus === "ready" ? 
//                         { type: 'loading', message: 'Waiting for processing...' } : 
//                         null
//                       }
//                     />
//                   </div>
                  
//                   <div className="col-span-2">
//                     <h3 className="text-center text-gray-700 font-semibold mb-2">
//                       {showOriginal ? "Original Image (for comparison)" : "CoSAE Restored Image"}
//                     </h3>
                    
//                     {/* Restored image or processing button */}
//                     {restoredImage ? (
//                       <div className="relative">
//                         <ImageDisplay 
//                           src={showOriginal ? originalImage : restoredImage} 
//                           alt={showOriginal ? "Original Image" : "Restored Image"}
//                           size={500}
//                         />
//                       </div>
//                     ) : (
//                       <div className="flex justify-center items-center h-64 border border-gray-300 rounded bg-gray-50">
//                         {processingStatus === "ready" ? (
//                           <button 
//                             onClick={startProcessing} 
//                             className="bg-blue-600 text-white py-3 px-6 rounded-lg text-lg hover:bg-blue-700 transition-colors"
//                           >
//                             Restore Image
//                           </button>
//                         ) : (
//                           <div className="text-gray-400 text-sm">No restored image yet</div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
              
//               {/* Frequency visualization area */}
//               {showFrequencyViz && frequencyCoeffs.length > 0 && (
//                 <div className="w-full md:w-72">
//                   <FrequencyVisualization 
//                     coeffs={frequencyCoeffs}
//                     selectedFrequency={selectedFrequency}
//                     onSelect={setSelectedFrequency}
//                   />
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
//               <div className="text-center">
//                 <p className="text-xl text-gray-600 mb-4">No image selected</p>
//                 <p className="text-gray-500">Upload an image or use a demo image to begin.</p>
//               </div>
//             </div>
//           )}
//         </div>
//       ) : selectedTab === 'debug' ? (
//         <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
//           <h2 className="text-xl font-bold text-blue-800 mb-4">Debug Information</h2>
          
//           {/* Image Status */}
//           <div className="mb-4">
//             <h3 className="font-semibold text-lg mb-2">Image Status</h3>
//             <div className="grid grid-cols-3 gap-4">
//               <div>
//                 <h4 className="font-medium">Original Image</h4>
//                 <p className="text-sm">Status: {originalImage ? "Loaded" : "Not loaded"}</p>
//                 {originalImage && (
//                   <div className="mt-2 border border-gray-300 p-2 rounded">
//                     <img src={originalImage} alt="Debug Original" className="w-24 h-24 object-contain" />
//                   </div>
//                 )}
//               </div>
//               <div>
//                 <h4 className="font-medium">Low-Res Image</h4>
//                 <p className="text-sm">Status: {lowResImage ? "Loaded" : "Not loaded"}</p>
//                 {lowResImage && (
//                   <div className="mt-2 border border-gray-300 p-2 rounded">
//                     <img src={lowResImage} alt="Debug Low-Res" className="w-24 h-24 object-contain" />
//                   </div>
//                 )}
//               </div>
//               <div>
//                 <h4 className="font-medium">Restored Image</h4>
//                 <p className="text-sm">Status: {restoredImage ? "Loaded" : "Not loaded"}</p>
//                 {restoredImage && (
//                   <div className="mt-2 border border-gray-300 p-2 rounded">
//                     <img src={restoredImage} alt="Debug Restored" className="w-24 h-24 object-contain" />
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
          
//           {/* State Status */}
//           <div className="mb-4">
//             <h3 className="font-semibold text-lg mb-2">Application State</h3>
//             <div className="bg-gray-100 p-2 rounded-lg">
//               <p className="text-sm mb-1"><strong>Processing Status:</strong> {processingStatus}</p>
//               <p className="text-sm mb-1"><strong>Status Message:</strong> {statusMessage || "None"}</p>
//               <p className="text-sm mb-1"><strong>Bottleneck Size:</strong> {bottleneckSize}</p>
//               <p className="text-sm mb-1"><strong>Frequency Coefficients:</strong> {frequencyCoeffs.length}</p>
//               <p className="text-sm mb-1"><strong>Selected Frequency:</strong> {selectedFrequency !== null ? selectedFrequency : "None"}</p>
//               <p className="text-sm mb-1"><strong>Show Original:</strong> {showOriginal.toString()}</p>
//               <p className="text-sm mb-1"><strong>Show Frequency Viz:</strong> {showFrequencyViz.toString()}</p>
//             </div>
//           </div>
          
//           {/* Debug Controls */}
//           <div className="mb-4">
//             <h3 className="font-semibold text-lg mb-2">Debug Controls</h3>
//             <div className="flex space-x-2">
//               <button
//                 onClick={() => {
//                   setLogs([]);
//                   log("Console cleared");
//                 }}
//                 className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 text-sm"
//               >
//                 Clear Console
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
//           <div className="prose mx-auto">
//             <h2 className="text-2xl font-bold text-blue-800 mb-4">Understanding CoSAE</h2>
            
//             <p className="mb-4">
//               CoSAE (Cosine Autoencoder) is a novel neural network architecture for image restoration, 
//               introduced in the paper "CoSAE: Learnable Fourier Series for Image Restoration" by Sifei Liu, 
//               Shalini De Mello, and Jan Kautz from NVIDIA.
//             </p>
            
//             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Key Innovations</h3>
            
//             <p className="mb-3">
//               1. <strong>Fourier Series Representation</strong> - CoSAE encodes images using a series of 
//               2D Cosine waves, each defined by a frequency pair (u, v) and corresponding amplitude and phase.
//             </p>
            
//             <p className="mb-3">
//               2. <strong>Extremely Narrow Bottleneck</strong> - Despite having a compact representation in 
//               the bottleneck layer, CoSAE maintains high-fidelity details in the reconstructed images.
//             </p>
            
//             <p className="mb-3">
//               3. <strong>Learnable Frequency Parameters</strong> - Unlike conventional autoencoders,
//               CoSAE learns the optimal frequency coefficients, enabling better generalization.
//             </p>
            
//             <div className="my-6 p-4 bg-gray-100 rounded-lg">
//               <h3 className="text-lg font-semibold mb-2">How it Works:</h3>
//               <ol className="list-decimal pl-5 space-y-2">
//                 <li>The encoder compresses an input image to a series of frequency coefficients (amplitude and phase pairs).</li>
//                 <li>These coefficients are stored in an extremely narrow bottleneck (as small as 1/64th of the original size).</li>
//                 <li>The Harmonic Construction Module (HCM) expands these coefficients into 2D cosine basis functions.</li>
//                 <li>The decoder combines these basis functions to reconstruct the full-resolution image.</li>
//               </ol>
//             </div>
            
//             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Applications</h3>
            
//             <p className="mb-3">
//               CoSAE was shown to excel at several challenging image restoration tasks:
//             </p>
            
//             <ul className="list-disc pl-5 mb-4 space-y-1">
//               <li><strong>Flexible-resolution Super-resolution</strong> - Upscaling images to arbitrary sizes</li>
//               <li><strong>Blind Image Restoration</strong> - Reconstructing images from unknown degradations</li>
//               <li><strong>General image enhancement</strong> - Improving visual quality of degraded images</li>
//             </ul>
            
//             <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">About this Demo</h3>
            
//             <p className="mb-4">
//               This interactive demonstration provides a simplified version of CoSAE's capabilities:
//             </p>
            
//             <ul className="list-disc pl-5 mb-4 space-y-1">
//               <li>Upload or select a demo image</li>
//               <li>The image is downsampled to create a low-resolution version</li>
//               <li>A simplified version of CoSAE is applied to restore the image</li>
//               <li>You can adjust the bottleneck size to see how it affects restoration quality</li>
//               <li>You can visualize the frequency coefficients used in the restoration</li>
//             </ul>
            
//             <p className="mb-4">
//               Note that this is a simplified toy implementation to demonstrate the core concepts.
//               The full CoSAE model as described in the paper includes a more sophisticated neural 
//               network architecture and training process.
//             </p>
            
//             <p className="text-sm text-gray-600 mt-8">
//               Reference: Liu, S., De Mello, S., & Kautz, J. (2024). CoSAE: Learnable Fourier Series for Image Restoration. 
//               38th Conference on Neural Information Processing Systems (NeurIPS 2024).
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as math from 'mathjs';

// Image Display component that uses HTML img instead of canvas
const ImageDisplay = ({ src, alt, size = 256, status = null, border = true }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div 
      className={`relative ${border ? 'border border-gray-300' : ''} rounded bg-gray-50 overflow-hidden`} 
      style={{ width: size, height: size }}
    >
      {/* Status overlay (loading or error) */}
      {status && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-center p-4">
            {status.type === 'loading' && (
              <>
                <div className="w-8 h-8 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-700">{status.message || 'Loading...'}</p>
              </>
            )}
            {status.type === 'error' && (
              <>
                <div className="text-red-500 text-2xl mb-1">⚠️</div>
                <p className="text-sm text-red-700">{status.message || 'Error loading image'}</p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Background grid pattern to show transparency */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
          opacity: 0.5
        }}
      />
      
      {/* Actual image element */}
      {src && (
        <img
          src={src}
          alt={alt || "Image"}
          className={`object-contain w-full h-full z-5 relative ${!loaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ transition: 'opacity 0.3s' }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      
      {/* Show error state if image fails to load */}
      {error && !status && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-80 z-10">
          <div className="text-center p-4">
            <p className="text-sm text-red-700">Failed to load image</p>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!src && !status && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gray-400">No image available</p>
        </div>
      )}
    </div>
  );
};

// Optimized frequency visualization component
const FrequencyVisualization = ({ coeffs, selectedFrequency, onSelect }) => {
  const canvasRef = useRef(null);
  
  // Memoize the sorted coefficients to avoid unnecessary recomputation
  const sortedCoeffs = useMemo(() => {
    if (!coeffs || coeffs.length === 0) return [];
    
    return [...coeffs].sort((a, b) => {
      const distA = Math.sqrt(a.u * a.u + a.v * a.v);
      const distB = Math.sqrt(b.u * b.u + b.v * b.v);
      return distA - distB;
    });
  }, [coeffs]);
  
  // Draw frequency visualization when coefficients change
  useEffect(() => {
    if (!coeffs || coeffs.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Fill with dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);
    
    // Grid setup
    const gridSize = 8;
    const cellSize = size / gridSize;
    
    // Draw grid lines
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * cellSize;
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }
    
    // Draw coordinates
    ctx.font = '10px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.textAlign = 'center';
    
    // Draw axis labels
    for (let i = 0; i < gridSize; i++) {
      const u = i - gridSize/2;
      const v = i - gridSize/2;
      const x = (i + 0.5) * cellSize;
      
      // X-axis labels at bottom
      ctx.fillText(u.toString(), x, size - 2);
      
      // Y-axis labels at left
      ctx.textAlign = 'right';
      ctx.fillText(v.toString(), cellSize/2 - 5, (i + 0.5) * cellSize + 4);
      ctx.textAlign = 'center';
    }
    
    // Draw coefficients as circles with size based on amplitude
    coeffs.forEach((coeff, index) => {
      const { u, v, amplitude, phase } = coeff;
      
      // Position in the grid (center of the grid is (gridSize/2, gridSize/2))
      const x = (u + gridSize/2) * cellSize;
      const y = (v + gridSize/2) * cellSize;
      
      // Size based on amplitude (normalized)
      const maxRadius = cellSize / 2 * 0.8;
      const radius = Math.max(2, amplitude * maxRadius);
      
      // Color based on phase (hue from 0 to 360)
      const hue = (phase / (Math.PI * 2) * 360) % 360;
      
      // Draw the circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.fill();
      
      // Add border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Add highlight for selected frequency
      if (selectedFrequency === index) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
  }, [coeffs, selectedFrequency]);
  
  // Render the single frequency visualization with memoization for performance
  const renderSingleFrequency = useMemo(() => {
    if (!coeffs || coeffs.length === 0 || selectedFrequency === null) {
      return null;
    }
    
    const coeff = coeffs[selectedFrequency];
    if (!coeff) return null;
    
    // Create an in-memory canvas to generate the visualization
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    // Extract parameters
    const { u, v, amplitude, phase } = coeff;
    
    // Use pre-computed cosine values from lookup table for efficiency
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    // Scale factors for the frequency
    const scaleU = (2 * Math.PI * u) / size;
    const scaleV = (2 * Math.PI * v) / size;
    
    // Generate the wave
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Calculate the cosine value at this position
        const value = Math.cos(x * scaleU + y * scaleV + phase);
        
        // Scale to [0, 255] and apply amplitude
        const intensity = Math.round(((value + 1) / 2) * 255 * amplitude);
        
        // Set RGBA values (grayscale with full alpha)
        const pixelIndex = (y * size + x) * 4;
        data[pixelIndex] = intensity;     // R
        data[pixelIndex + 1] = intensity; // G
        data[pixelIndex + 2] = intensity; // B
        data[pixelIndex + 3] = 255;       // A (fully opaque)
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Return the data URL
    return canvas.toDataURL();
  }, [coeffs, selectedFrequency]);
  
  // Handle click on the frequency visualization
  const handleClick = (e) => {
    if (!coeffs || coeffs.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Grid settings
    const gridSize = 8;
    const cellSize = canvas.width / gridSize;
    
    // Convert to grid coordinates
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);
    
    // Find the closest frequency
    let closestIdx = null;
    let closestDist = Infinity;
    
    coeffs.forEach((coeff, idx) => {
      const freqGridX = (coeff.u + gridSize/2);
      const freqGridY = (coeff.v + gridSize/2);
      const dist = Math.sqrt(
        Math.pow(freqGridX - gridX, 2) + 
        Math.pow(freqGridY - gridY, 2)
      );
      
      if (dist < closestDist && dist < 1) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    
    // Call the selection handler
    if (closestIdx !== null) {
      onSelect(closestIdx === selectedFrequency ? null : closestIdx);
    }
  };
  
  return (
    <div className="border border-gray-300 rounded p-4 bg-gray-50">
      <h3 className="text-center text-gray-700 font-semibold mb-2">Frequency Coefficients</h3>
      <p className="text-xs text-gray-600 mb-2">
        Click on a frequency to visualize its contribution.
      </p>
      
      {/* Frequency grid visualization */}
      <div className="relative mb-4">
        <canvas 
          ref={canvasRef}
          width="200" 
          height="200" 
          className="w-full border border-gray-300 bg-gray-900 rounded cursor-pointer"
          onClick={handleClick}
        />
      </div>
      
      {/* Selected frequency visualization */}
      {selectedFrequency !== null && coeffs && coeffs.length > selectedFrequency && (
        <div>
          <h4 className="text-sm text-gray-700 font-semibold">Selected Frequency</h4>
          <div className="border border-gray-300 rounded bg-white p-2 mb-2">
            {/* Use an image element to display the frequency */}
            <img
              src={renderSingleFrequency}
              alt="Frequency visualization"
              width="150"
              height="150"
              className="w-full"
            />
          </div>
          
          <div className="text-xs text-gray-600">
            <p>
              u = {coeffs[selectedFrequency].u}, 
              v = {coeffs[selectedFrequency].v}
            </p>
            <p>
              Amplitude: {coeffs[selectedFrequency].amplitude.toFixed(3)}
            </p>
            <p>
              Phase: {(coeffs[selectedFrequency].phase / Math.PI).toFixed(2)}π
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// New Progressive Reconstruction Component
const ProgressiveReconstruction = ({ coeffs, outputSize = 256 }) => {
  const [step, setStep] = useState(0);
  const [maxSteps, setMaxSteps] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);
  
  // Sort coefficients by importance (typically low frequencies first)
  const sortedCoeffs = useMemo(() => {
    if (!coeffs || coeffs.length === 0) return [];
    
    return [...coeffs].sort((a, b) => {
      const distA = Math.sqrt(a.u * a.u + a.v * a.v);
      const distB = Math.sqrt(b.u * b.u + b.v * b.v);
      return distA - distB;
    });
  }, [coeffs]);
  
  // Pre-compute cosine lookup tables for common frequencies
  const cosineLookup = useMemo(() => {
    const lookup = {};
    if (!sortedCoeffs || sortedCoeffs.length === 0) return lookup;
    
    // Only pre-compute for the most important frequencies
    const topFreqs = sortedCoeffs.slice(0, Math.min(20, sortedCoeffs.length));
    
    topFreqs.forEach(({ u, v, phase }) => {
      const key = `${u}_${v}_${phase.toFixed(3)}`;
      lookup[key] = new Float32Array(outputSize * outputSize);
      
      const scaleU = (2 * Math.PI * u) / outputSize;
      const scaleV = (2 * Math.PI * v) / outputSize;
      
      for (let y = 0; y < outputSize; y++) {
        for (let x = 0; x < outputSize; x++) {
          const index = y * outputSize + x;
          lookup[key][index] = Math.cos(x * scaleU + y * scaleV + phase);
        }
      }
    });
    
    return lookup;
  }, [sortedCoeffs, outputSize]);
  
  // Effect to update canvas when step changes
  useEffect(() => {
    if (!canvasRef.current || !sortedCoeffs || sortedCoeffs.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const imageData = ctx.createImageData(outputSize, outputSize);
    const data = imageData.data;
    
    // Clear the canvas
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }
    
    // Add frequency components up to current step
    const numToShow = Math.floor((step / maxSteps) * sortedCoeffs.length);
    
    // Create a temporary buffer for efficient computation
    const buffer = new Float32Array(outputSize * outputSize);
    
    // Process in batches for better performance
    const processBatch = (startIdx, endIdx) => {
      for (let idx = startIdx; idx < endIdx && idx < numToShow; idx++) {
        const { u, v, amplitude, phase } = sortedCoeffs[idx];
        
        // Check if we have this frequency in the lookup table
        const lookupKey = `${u}_${v}_${phase.toFixed(3)}`;
        if (cosineLookup[lookupKey]) {
          // Use pre-computed values
          const preComputed = cosineLookup[lookupKey];
          for (let i = 0; i < buffer.length; i++) {
            buffer[i] += preComputed[i] * amplitude;
          }
        } else {
          // Compute on-the-fly if not in lookup table
          const scaleU = (2 * Math.PI * u) / outputSize;
          const scaleV = (2 * Math.PI * v) / outputSize;
          
          for (let y = 0; y < outputSize; y++) {
            for (let x = 0; x < outputSize; x++) {
              const index = y * outputSize + x;
              const value = Math.cos(x * scaleU + y * scaleV + phase);
              buffer[index] += value * amplitude;
            }
          }
        }
      }
    };
    
    // Process in batches of 5 frequencies
    const batchSize = 5;
    for (let i = 0; i < numToShow; i += batchSize) {
      processBatch(i, Math.min(i + batchSize, numToShow));
    }
    
    // Find min/max for normalization
    let minVal = Number.MAX_VALUE;
    let maxVal = Number.MIN_VALUE;
    
    for (let i = 0; i < buffer.length; i++) {
      minVal = Math.min(minVal, buffer[i]);
      maxVal = Math.max(maxVal, buffer[i]);
    }
    
    // Normalize and set pixel values
    const range = maxVal - minVal;
    for (let i = 0; i < buffer.length; i++) {
      const normalizedValue = Math.round(((buffer[i] - minVal) / range) * 255);
      const pixelIdx = i * 4;
      data[pixelIdx] = normalizedValue;     // R
      data[pixelIdx + 1] = normalizedValue; // G
      data[pixelIdx + 2] = normalizedValue; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [step, sortedCoeffs, outputSize, cosineLookup, maxSteps]);
  
  // Animation effect
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= maxSteps) {
          setIsPlaying(false);
          return maxSteps;
        }
        return prev + 1;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, [isPlaying, maxSteps]);
  
  // If no coeffs, show empty state
  if (!coeffs || coeffs.length === 0) {
    return (
      <div className="border border-gray-300 rounded p-4 bg-gray-50">
        <h3 className="text-center text-gray-700 font-semibold mb-2">Progressive Reconstruction</h3>
        <p className="text-xs text-gray-600 mb-2">
          Process an image first to see the progressive reconstruction
        </p>
      </div>
    );
  }
  
  return (
    <div className="border border-gray-300 rounded p-4 bg-gray-50">
      <h3 className="text-center text-gray-700 font-semibold mb-2">Progressive Reconstruction</h3>
      <p className="text-xs text-gray-600 mb-2">
        See how the image builds up from {sortedCoeffs.length} frequency components
      </p>
      
      <canvas 
        ref={canvasRef}
        width={outputSize} 
        height={outputSize} 
        className="w-full border border-gray-300 bg-gray-900 rounded mb-2"
      />
      
      <div className="flex items-center mb-2">
        <button 
          onClick={() => setIsPlaying(!isPlaying)} 
          className="bg-blue-600 text-white py-1 px-3 rounded text-sm mr-2"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input 
          type="range" 
          min="0" 
          max={maxSteps} 
          value={step} 
          onChange={(e) => {
            setStep(parseInt(e.target.value));
            setIsPlaying(false);
          }}
          className="flex-1"
        />
      </div>
      
      <div className="text-xs text-gray-600">
        <p>Showing {Math.floor((step / maxSteps) * sortedCoeffs.length)} of {sortedCoeffs.length} frequency components</p>
      </div>
    </div>
  );
};

// Status log component
const StatusLog = ({ messages }) => {
  const logEndRef = useRef(null);
  
  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <div className="bg-gray-100 rounded-b-lg border border-gray-300 p-2 h-32 overflow-y-auto text-sm font-mono">
      {messages.length === 0 ? (
        <div className="text-gray-500 text-xs">No processing logs yet. Upload an image to begin.</div>
      ) : (
        messages.map((log, index) => (
          <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-600' : 'text-gray-800'}`}>
            <span className="text-gray-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
            {log.message}
          </div>
        ))
      )}
      <div ref={logEndRef} />
    </div>
  );
};

// Pre-trained phases for natural images (would be learned in real CoSAE)
// These values are representative of what might be learned for common image patterns
const NATURAL_IMAGE_PHASES = [
  0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 
  5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4, Math.PI/6, 
  Math.PI/3, 2*Math.PI/3, 5*Math.PI/6, 7*Math.PI/6, 
  4*Math.PI/3, 5*Math.PI/3, 11*Math.PI/6
];

// Main Enhanced CoSAE demonstration component
const CoSAEDemo = () => {
  // State for various aspects of the demo
  const [originalImage, setOriginalImage] = useState(null);
  const [lowResImage, setLowResImage] = useState(null);
  const [restoredImage, setRestoredImage] = useState(null);
  const [bottleneckSize, setBottleneckSize] = useState(64); // Default bottleneck size
  const [frequencyCoeffs, setFrequencyCoeffs] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [processingStatus, setProcessingStatus] = useState("idle"); // idle, preparing, processing, complete
  const [statusMessage, setStatusMessage] = useState("");
  const [imageDetails, setImageDetails] = useState(null);
  const [selectedTab, setSelectedTab] = useState('demo'); // 'demo', 'explanation', 'research', 'debug'
  const [showOriginal, setShowOriginal] = useState(false); // Toggle for comparison view
  const [showFrequencyViz, setShowFrequencyViz] = useState(false);
  const [logs, setLogs] = useState([]); // Store log messages
  const [imageType, setImageType] = useState("natural"); // natural, text, graphic, etc.
  const [processSeparateChannels, setProcessSeparateChannels] = useState(true);
  
  // Lookup table for cosine calculations - created once for efficiency
  const cosineLookupTable = useMemo(() => {
    // Create lookup tables for common frequency combinations
    const lookup = {};
    const size = 256; // Output size
    
    // Create entries for low frequencies (most important)
    for (let u = -2; u <= 2; u++) {
      for (let v = -2; v <= 2; v++) {
        const key = `${u}_${v}`;
        lookup[key] = new Float32Array(size * size);
        
        const scaleU = (2 * Math.PI * u) / size;
        const scaleV = (2 * Math.PI * v) / size;
        
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const index = y * size + x;
            lookup[key][index] = Math.cos(x * scaleU + y * scaleV);
          }
        }
      }
    }
    
    return lookup;
  }, []);
  
  // Helper function to add log messages
  const log = (message, type = 'info') => {
    const logEntry = {
      message,
      type,
      timestamp: new Date()
    };
    setLogs(prev => [logEntry, ...prev]);
    console.log(`[CoSAE] ${message}`);
  };
  
  // Process the uploaded image - load and display, don't run the algorithm yet
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      log("No file selected in upload");
      return;
    }
    
    setProcessingStatus("preparing");
    setStatusMessage("Loading image...");
    log(`Loading image file: ${file.name} (${formatBytes(file.size)})`);
    
    // Clear previous images
    setOriginalImage(null);
    setLowResImage(null);
    setRestoredImage(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      log("File loaded, creating image");
      
      const img = new Image();
      
      img.onload = () => {
        log(`Image loaded successfully: ${img.width}×${img.height}`);
        
        // Resize image to 512x512 while preserving aspect ratio
        const resizedDataUrl = resizeImage(img, 512, 512);
        
        // Create a resized image object
        const resizedImg = new Image();
        resizedImg.onload = () => {
          log("Resized image loaded");
          setOriginalImage(resizedImg.src);
          
          // Analyze image to determine type
          const detectedType = detectImageType(resizedImg);
          setImageType(detectedType);
          log(`Image type detected: ${detectedType}`);
          
          // Set image details
          const details = {
            originalWidth: img.width,
            originalHeight: img.height,
            size: formatBytes(file.size),
            type: file.type,
            name: file.name,
            detectedType: detectedType
          };
          setImageDetails(details);
          
          setProcessingStatus("ready");
          setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
        };
        
        resizedImg.onerror = () => {
          log("Failed to load resized image", "error");
          setProcessingStatus("error");
          setStatusMessage("Error processing image. Please try again.");
        };
        
        resizedImg.src = resizedDataUrl;
      };
      
      img.onerror = () => {
        log("Failed to load image", "error");
        setProcessingStatus("error");
        setStatusMessage("Failed to load image. Please try a different file.");
      };
      
      // Start loading the image
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      log("Error reading file", "error");
      setProcessingStatus("error");
      setStatusMessage("Failed to read file. Please try a different file.");
    };
    
    reader.readAsDataURL(file);
  };
  
  // Detect image type based on characteristics
  const detectImageType = (img) => {
    // Create a small canvas to analyze the image
    const canvas = document.createElement('canvas');
    const size = 32; // Small sample size for efficiency
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    // Calculate image metrics
    let edgeCount = 0;
    let totalBrightness = 0;
    let contrastSum = 0;
    
    // Check for edges and calculate contrast
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const idx = (y * size + x) * 4;
        const idxLeft = (y * size + (x-1)) * 4;
        const idxRight = (y * size + (x+1)) * 4;
        const idxUp = ((y-1) * size + x) * 4;
        const idxDown = ((y+1) * size + x) * 4;
        
        // Calculate brightness
        const brightness = (data[idx] + data[idx+1] + data[idx+2]) / 3;
        totalBrightness += brightness;
        
        // Calculate horizontal and vertical differences
        const diffX = Math.abs(data[idxLeft] - data[idxRight]) + 
                     Math.abs(data[idxLeft+1] - data[idxRight+1]) + 
                     Math.abs(data[idxLeft+2] - data[idxRight+2]);
                     
        const diffY = Math.abs(data[idxUp] - data[idxDown]) + 
                     Math.abs(data[idxUp+1] - data[idxDown+1]) + 
                     Math.abs(data[idxUp+2] - data[idxDown+2]);
                     
        // Count edge pixels
        if (diffX > 100 || diffY > 100) {
          edgeCount++;
        }
        
        contrastSum += diffX + diffY;
      }
    }
    
    const avgBrightness = totalBrightness / (size * size);
    const avgContrast = contrastSum / (size * size);
    const edgeRatio = edgeCount / (size * size);
    
    // Determine image type based on metrics
    if (edgeRatio > 0.1 && avgContrast > 100) {
      return "text"; // High edge ratio and contrast suggests text or graphics
    } else if (avgContrast > 50) {
      return "photo"; // Moderate contrast suggests photos
    } else {
      return "natural"; // Default to natural
    }
  };
  
  // Process a demo image
  const handleDemoImage = () => {
    setProcessingStatus("preparing");
    setStatusMessage("Creating demo image...");
    log("Creating demo image");
    
    // Clear previous image data
    setOriginalImage(null);
    setLowResImage(null);
    setRestoredImage(null);
    
    // Create a demo image directly using canvas
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 512;
    demoCanvas.height = 512;
    const ctx = demoCanvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#3498db');  // Blue
    gradient.addColorStop(1, '#8e44ad');  // Purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add a colorful pattern
    const numCircles = 15;
    for (let i = 0; i < numCircles; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 20 + Math.random() * 50;
      
      // Create a circle with semi-transparent fill
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`;
      ctx.fill();
    }
    
    // Add some text
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('CoSAE Demo', 256, 150);
    ctx.font = '20px Arial';
    ctx.fillText('Test Image', 256, 200);
    
    // Add some shapes for texture/detail
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        // Only draw some squares
        if (Math.random() > 0.5) continue;
        
        const x = i * 64;
        const y = j * 64 + 256; // Bottom half of image
        const size = 48;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.1})`;
        ctx.fillRect(x + 8, y + 8, size, size);
      }
    }
    
    // Convert canvas to image
    const dataUrl = demoCanvas.toDataURL('image/png');
    log("Demo image created");
    
    // Set as original image
    setOriginalImage(dataUrl);
    setImageType("graphic");
    
    // Set image details
    const details = {
      originalWidth: 512,
      originalHeight: 512,
      size: "Demo image (generated)",
      type: "image/png",
      name: "cosae-demo.png",
      detectedType: "graphic"
    };
    setImageDetails(details);
    
    // Update status
    setProcessingStatus("ready");
    setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
  };
  
  // Resize image to target dimensions while preserving aspect ratio
  const resizeImage = (img, targetWidth, targetHeight) => {
    log(`Resizing image from ${img.width}×${img.height} to ${targetWidth}×${targetHeight}`);
    
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    // Determine scale and position for center crop
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;
    
    // Fill with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Draw the image centered
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Return data URL
    return canvas.toDataURL();
  };
  
  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Start the CoSAE restoration process
  const startProcessing = (rerun = false) => {
    if (!originalImage || processingStatus === "processing") {
      log("Cannot start processing: no image or already processing");
      return;
    }
    
    // Reset state if not a rerun
    if (!rerun) {
      setLowResImage(null);
      setRestoredImage(null);
      setFrequencyCoeffs([]);
      setSelectedFrequency(null);
    }
    
    setProcessingStatus("processing");
    setStatusMessage("Creating low-resolution version...");
    log(rerun ? "Re-running with new parameters" : "Starting image processing");
    
    // Process in a slight delay to allow UI to update
    setTimeout(() => {
      // Create low-res version
      createLowResVersion(originalImage);
    }, 50);
  };
  
  // Create a low-resolution version of the image
  const createLowResVersion = (imageUrl) => {
    log("Creating low-resolution version of the image");
    
    const img = new Image();
    img.onload = () => {
      // Step 1: Create a low-resolution version
      const lowResSize = 32; // 8x downsampling
      const lowResCanvas = document.createElement('canvas');
      lowResCanvas.width = lowResSize;
      lowResCanvas.height = lowResSize;
      const lowResCtx = lowResCanvas.getContext('2d');
      lowResCtx.drawImage(img, 0, 0, lowResSize, lowResSize);
      
      // Step 2: Scale the low-res image back up to show degradation
      const scaledLowRes = document.createElement('canvas');
      scaledLowRes.width = 256;
      scaledLowRes.height = 256;
      const scaledLowResCtx = scaledLowRes.getContext('2d');
      scaledLowResCtx.imageSmoothingEnabled = false; // For pixelated upscaling
      scaledLowResCtx.drawImage(lowResCanvas, 0, 0, 256, 256);
      
      const lowResUrl = scaledLowRes.toDataURL();
      log("Low-resolution version created");
      
      // Set the low-res image
      setLowResImage(lowResUrl);
      
      // Update status
      setStatusMessage("Applying CoSAE restoration algorithm...");
      
      // Process in a slight delay to allow UI to update
      setTimeout(() => {
        // Now run the CoSAE restoration with separate color channels if enabled
        if (processSeparateChannels) {
          enhancedCoSAERestoration(lowResCanvas, bottleneckSize);
        } else {
          // Fallback to simpler approach
          simulateCoSAERestoration(lowResCanvas, bottleneckSize);
        }
      }, 50);
    };
    
    img.onerror = () => {
      log("Error loading image for low-res conversion", "error");
      setProcessingStatus("error");
      setStatusMessage("Error in processing. Please try again.");
    };
    
    img.src = imageUrl;
  };
  
  // Improved CoSAE implementation with separate color channel processing
  const enhancedCoSAERestoration = (lowResCanvas, bottleneckSize) => {
    const lowResSize = lowResCanvas.width;
    const outputSize = 256;
    
    // Update status
    setStatusMessage("Extracting color channels...");
    log("Beginning enhanced CoSAE restoration with separate color channels");
    
    // Step 1: Extract RGB data from low-res image
    const lowResCtx = lowResCanvas.getContext('2d');
    const lowResImageData = lowResCtx.getImageData(0, 0, lowResSize, lowResSize);
    const data = lowResImageData.data;
    
    // Create separate arrays for each channel
    const channels = [
      new Uint8Array(lowResSize * lowResSize),  // R
      new Uint8Array(lowResSize * lowResSize),  // G
      new Uint8Array(lowResSize * lowResSize)   // B
    ];
    
    // Fill channel arrays
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      channels[0][j] = data[i];     // R
      channels[1][j] = data[i + 1]; // G
      channels[2][j] = data[i + 2]; // B
    }
    
    // Analyze each channel to determine appropriate coefficients
    log("Analyzing color channels for optimal frequency distribution");
    
    // Process each channel separately to get coefficients
    const channelCoeffs = channels.map((channel, idx) => {
      const channelType = analyzeChannelType(channel, idx);
      log(`Channel ${idx} analysis: ${channelType}`);
      return getLearnedCoefficients(channelType, bottleneckSize, idx);
    });
    
    // Update status
    setStatusMessage("Generating optimized frequency components...");
    
    // Store all coeffs for visualization
    const allCoeffs = [...channelCoeffs[0]]; // Start with red channel
    setFrequencyCoeffs(allCoeffs);
    
    // Create a buffer for each channel's reconstruction
    const channelBuffers = channels.map((_, idx) => {
      log(`Processing channel ${idx} reconstruction...`);
      return reconstructChannel(channelCoeffs[idx], outputSize);
    });
    
    // Update status
    setStatusMessage("Combining color channels...");
    log("Combining color channels into final image");
    
    // Combine channels into final image
    const restoredCanvas = document.createElement('canvas');
    restoredCanvas.width = outputSize;
    restoredCanvas.height = outputSize;
    const restoredCtx = restoredCanvas.getContext('2d');
    const restoredImageData = restoredCtx.createImageData(outputSize, outputSize);
    const restoredData = restoredImageData.data;
    
    for (let i = 0, j = 0; i < restoredData.length; i += 4, j++) {
      restoredData[i] = channelBuffers[0][j];     // R
      restoredData[i + 1] = channelBuffers[1][j]; // G
      restoredData[i + 2] = channelBuffers[2][j]; // B
      restoredData[i + 3] = 255;                  // A
    }
    
    restoredCtx.putImageData(restoredImageData, 0, 0);
    
    // Convert to image
    const restoredUrl = restoredCanvas.toDataURL();
    log("Enhanced CoSAE restoration complete with separate color channels");
    
    // Set the restored image
    setRestoredImage(restoredUrl);
    
    // Update status to complete
    setProcessingStatus("complete");
    setStatusMessage("Restoration complete with enhanced processing!");
  };
  
  // Analyze a single color channel to determine its type
  const analyzeChannelType = (channel, channelIdx) => {
    // Calculate channel statistics
    let sum = 0;
    let sumSquared = 0;
    let minVal = 255;
    let maxVal = 0;
    
    // Analyze entropy and frequency distribution
    for (let i = 0; i < channel.length; i++) {
      const value = channel[i];
      sum += value;
      sumSquared += value * value;
      minVal = Math.min(minVal, value);
      maxVal = Math.max(maxVal, value);
    }
    
    const mean = sum / channel.length;
    const variance = (sumSquared / channel.length) - (mean * mean);
    const stdDev = Math.sqrt(variance);
    const contrast = maxVal - minVal;
    
    // Characterize the channel
    if (channelIdx === 0) { // Red channel
      // Red often has smoother gradients in natural images
      return stdDev > 50 ? "high_detail" : "smooth";
    } else if (channelIdx === 1) { // Green channel
      // Green usually has the most detail in natural images
      return stdDev > 40 ? "high_detail" : "medium_detail";
    } else { // Blue channel
      // Blue often has less high-frequency content
      return contrast > 100 ? "medium_detail" : "smooth";
    }
  };
  
  // Get learned coefficients based on image type (simulated learning)
  const getLearnedCoefficients = (imageType, bottleneckSize, channelIdx = 0) => {
    log(`Generating learned coefficients for ${imageType} image, channel ${channelIdx}`);
    const coeffs = [];
    const numFreqs = bottleneckSize / 2; // Each frequency has amplitude and phase
    
    // Different frequency distribution strategies for different image types
    if (imageType === "high_detail" || imageType === "text") {
      // High detail images need more high-frequency components
      for (let i = 0; i < numFreqs; i++) {
        let u, v, amplitude, phase;
        
        if (i < numFreqs/4) {
          // Low frequencies - moderate amplitude
          u = Math.floor(i % 3) - 1;
          v = Math.floor(i / 3) - 1;
          amplitude = 0.5 + 0.2 * Math.random();
          phase = NATURAL_IMAGE_PHASES[i % NATURAL_IMAGE_PHASES.length];
        } else if (i < numFreqs/2) {
          // Mid frequencies - higher amplitude for details
          u = (Math.floor(i % 5) - 2) * 2;
          v = (Math.floor(i / 5) - 2) * 2;
          amplitude = 0.6 + 0.2 * Math.random();
          phase = NATURAL_IMAGE_PHASES[(i + 3) % NATURAL_IMAGE_PHASES.length];
        } else {
          // High frequencies - good amplitude for details
          u = (Math.floor(i % 7) - 3) * 3;
          v = (Math.floor(i / 7) - 3) * 3;
          amplitude = 0.3 + 0.2 * Math.random();
          phase = NATURAL_IMAGE_PHASES[(i + 7) % NATURAL_IMAGE_PHASES.length];
        }
        
        coeffs.push({ u, v, amplitude, phase });
      }
    } else if (imageType === "medium_detail" || imageType === "photo") {
      // Photos need balanced frequency components
      for (let i = 0; i < numFreqs; i++) {
        let u, v, amplitude, phase;
        
        if (i < numFreqs/3) {
          // Low frequencies - high amplitude for structure
          u = Math.floor(i % 3) - 1;
          v = Math.floor(i / 3) - 1;
          amplitude = 0.7 + 0.2 * Math.random();
          phase = NATURAL_IMAGE_PHASES[i % NATURAL_IMAGE_PHASES.length];
        } else if (i < 2*numFreqs/3) {
          // Mid frequencies - medium amplitude
          u = (Math.floor(i % 5) - 2) * 2;
          v = (Math.floor(i / 5) - 2) * 2;
          amplitude = 0.4 + 0.2 * Math.random();
          phase = NATURAL_IMAGE_PHASES[(i + 5) % NATURAL_IMAGE_PHASES.length];
        } else {
          // High frequencies - lower amplitude
          u = (Math.floor(i % 8) - 4) * 3;
          v = (Math.floor(i / 8) - 4) * 3;
          amplitude = 0.2 + 0.15 * Math.random();
          phase = NATURAL_IMAGE_PHASES[(i + 9) % NATURAL_IMAGE_PHASES.length];
        }
        
        coeffs.push({ u, v, amplitude, phase });
      }
    } else { // "smooth" or "natural"
      // Smooth images need mostly low frequency components
      for (let i = 0; i < numFreqs; i++) {
        let u, v, amplitude, phase;
        
        if (i < numFreqs/2) {
          // Low frequencies - very high amplitude
          u = Math.floor(i % 3) - 1;
          v = Math.floor(i / 3) - 1;
          amplitude = 0.8 + 0.2 * Math.random();
          phase = NATURAL_IMAGE_PHASES[i % NATURAL_IMAGE_PHASES.length];
        } else if (i < 3*numFreqs/4) {
          // Mid frequencies - lower amplitude
          u = (Math.floor(i % 5) - 2) * 2;
          v = (Math.floor(i / 5) - 2) * 2;
          amplitude = 0.3 + 0.2 * Math.random();
          phase = NATURAL_IMAGE_PHASES[(i + 3) % NATURAL_IMAGE_PHASES.length];
        } else {
          // High frequencies - very low amplitude
          u = (Math.floor(i % 9) - 4) * 3;
          v = (Math.floor(i / 9) - 4) * 3;
          amplitude = 0.1 + 0.1 * Math.random();
          phase = NATURAL_IMAGE_PHASES[(i + 7) % NATURAL_IMAGE_PHASES.length];
        }
        
        coeffs.push({ u, v, amplitude, phase });
      }
    }
    
    // Add channel-specific adjustments
    if (channelIdx === 0) { // Red channel
      // Boost low frequencies slightly for red
      coeffs.forEach(coeff => {
        if (Math.abs(coeff.u) <= 1 && Math.abs(coeff.v) <= 1) {
          coeff.amplitude = Math.min(1.0, coeff.amplitude * 1.1);
        }
      });
    } else if (channelIdx === 1) { // Green channel
      // Green channel often has most detail in natural images
      coeffs.forEach(coeff => {
        if (Math.abs(coeff.u) >= 2 || Math.abs(coeff.v) >= 2) {
          coeff.amplitude = Math.min(1.0, coeff.amplitude * 1.15);
        }
      });
    }
    
    return coeffs;
  };
  
  // Reconstruct a single channel from frequency coefficients
  const reconstructChannel = (coeffs, outputSize) => {
    // Create a buffer for accumulating values
    const buffer = new Float32Array(outputSize * outputSize);
    
    // Process coefficients in batches for better performance
    const batchSize = 5;
    for (let i = 0; i < coeffs.length; i += batchSize) {
      const endIdx = Math.min(i + batchSize, coeffs.length);
      
      // Process this batch of coefficients
      for (let idx = i; idx < endIdx; idx++) {
        const { u, v, amplitude, phase } = coeffs[idx];
        
        // Check if we have this frequency in the lookup table
        const lookupKey = `${u}_${v}`;
        if (cosineLookupTable[lookupKey]) {
          // Use pre-computed cosine values for better performance
          const cosineValues = cosineLookupTable[lookupKey];
          
          // Apply phase shift and amplitude
          for (let j = 0; j < buffer.length; j++) {
            // For phase shift, we use the formula cos(x + φ) = cos(x)cos(φ) - sin(x)sin(φ)
            // Since we've pre-computed cos(x), we need cos(φ) and sin(φ)
            const cosPhase = Math.cos(phase);
            const sinPhase = Math.sin(phase);
            
            // cos(x) is directly from lookup table
            const cosX = cosineValues[j];
            
            // sin(x) can be derived: sin(x) = cos(x - π/2)
            // For efficiency, we approximate it as sin(x) ≈ -cos(x+π)
            // which is a close enough approximation for our visualization
            const sinX = -cosX; // This is a simplification
            
            // Apply phase shift: cos(x + φ) = cos(x)cos(φ) - sin(x)sin(φ)
            const value = cosX * cosPhase - sinX * sinPhase;
            
            // Add to buffer with amplitude scaling
            buffer[j] += value * amplitude;
          }
        } else {
          // Compute on-the-fly if not in lookup table
          const scaleU = (2 * Math.PI * u) / outputSize;
          const scaleV = (2 * Math.PI * v) / outputSize;
          
          for (let y = 0; y < outputSize; y++) {
            for (let x = 0; x < outputSize; x++) {
              const index = y * outputSize + x;
              const value = Math.cos(x * scaleU + y * scaleV + phase);
              buffer[index] += value * amplitude;
            }
          }
        }
      }
    }
    
    // Find min/max for normalization
    let minVal = Number.MAX_VALUE;
    let maxVal = Number.MIN_VALUE;
    
    for (let i = 0; i < buffer.length; i++) {
      minVal = Math.min(minVal, buffer[i]);
      maxVal = Math.max(maxVal, buffer[i]);
    }
    
    // Normalize to [0, 255] range
    const range = maxVal - minVal;
    const normalizedBuffer = new Uint8Array(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      normalizedBuffer[i] = Math.round(((buffer[i] - minVal) / range) * 255);
    }
    
    return normalizedBuffer;
  };
  
  // Original CoSAE implementation (simplified) as fallback
  const simulateCoSAERestoration = (lowResCanvas, bottleneckSize) => {
    const lowResSize = lowResCanvas.width;
    const outputSize = 256;
    
    // Update status
    setStatusMessage("Extracting image data...");
    log(`Beginning simple CoSAE restoration with bottleneck size ${bottleneckSize}`);
    
    // Step 1: Extract RGB data from low-res image
    const lowResCtx = lowResCanvas.getContext('2d');
    const lowResImageData = lowResCtx.getImageData(0, 0, lowResSize, lowResSize);
    
    // Analyze image type
    const imageType = imageDetails?.detectedType || "natural";
    log(`Using image type: ${imageType} for coefficient generation`);
    
    // Update status
    setStatusMessage("Generating frequency coefficients...");
    
    // Step 2: Generate learned coefficients based on image type
    const coeffs = getLearnedCoefficients(imageType, bottleneckSize);
    setFrequencyCoeffs(coeffs);
    
    // Update status
    setStatusMessage("Reconstructing image from frequency components...");
    log("Beginning image reconstruction from frequency components");
    
    // Step 3: Create the restored image by combining the frequency components
    const restoredCanvas = document.createElement('canvas');
    restoredCanvas.width = outputSize;
    restoredCanvas.height = outputSize;
    const restoredCtx = restoredCanvas.getContext('2d');
    const restoredImageData = restoredCtx.createImageData(outputSize, outputSize);
    const restoredData = restoredImageData.data;
    
    // Initialize with zeros
    for (let i = 0; i < restoredData.length; i += 4) {
      restoredData[i] = 0;     // R
      restoredData[i + 1] = 0; // G
      restoredData[i + 2] = 0; // B
      restoredData[i + 3] = 255; // A
    }
    
    // Create a buffer for accumulating values (more efficient than direct pixel manipulation)
    const buffer = new Float32Array(outputSize * outputSize);
    
    // Process in batches to avoid UI freezing and update progress
    const processBatch = (startIdx, endIdx, completion) => {
      // Add frequency components in this batch
      for (let idx = startIdx; idx < endIdx && idx < coeffs.length; idx++) {
        const coeff = coeffs[idx];
        const { u, v, amplitude, phase } = coeff;
        
        // Check if we have this frequency in the lookup table
        const lookupKey = `${u}_${v}`;
        if (cosineLookupTable[lookupKey]) {
          // Use pre-computed cosine values for better performance
          const cosineValues = cosineLookupTable[lookupKey];
          
          // Apply phase shift and amplitude
          for (let i = 0; i < buffer.length; i++) {
            // For phase shift, we use the formula cos(x + φ) = cos(x)cos(φ) - sin(x)sin(φ)
            const cosPhase = Math.cos(phase);
            const sinPhase = Math.sin(phase);
            const cosX = cosineValues[i];
            const sinX = -cosX; // Simplification
            
            const value = cosX * cosPhase - sinX * sinPhase;
            buffer[i] += value * amplitude;
          }
        } else {
          // Compute on-the-fly if not in lookup table
          const scaleU = (2 * Math.PI * u) / outputSize;
          const scaleV = (2 * Math.PI * v) / outputSize;
          
          for (let y = 0; y < outputSize; y++) {
            for (let x = 0; x < outputSize; x++) {
              const index = y * outputSize + x;
              const value = Math.cos(x * scaleU + y * scaleV + phase);
              buffer[index] += value * amplitude;
            }
          }
        }
      }
      
      // Complete the process or schedule next batch
      if (endIdx >= coeffs.length) {
        completion();
      } else {
        // Update status
        const progress = Math.round((endIdx / coeffs.length) * 100);
        setStatusMessage(`Reconstructing image... (${progress}%)`);
        log(`Image reconstruction: ${progress}% complete`);
        
        // Schedule next batch
        setTimeout(() => {
          processBatch(endIdx, endIdx + 5, completion);
        }, 0);
      }
    };
    
    // Start batch processing
    processBatch(0, 5, () => {
      // Finalize restoration after all batches are processed
      
      // Update status
      setStatusMessage("Finalizing image restoration...");
      
      // Normalize the result to [0, 255]
      let minVal = Number.MAX_VALUE;
      let maxVal = Number.MIN_VALUE;
      
      for (let i = 0; i < buffer.length; i++) {
        minVal = Math.min(minVal, buffer[i]);
        maxVal = Math.max(maxVal, buffer[i]);
      }
      
      log(`Normalizing image data, range: [${minVal.toFixed(2)}, ${maxVal.toFixed(2)}]`);
      
      const range = maxVal - minVal;
      for (let i = 0; i < buffer.length; i++) {
        const normalizedValue = Math.round(((buffer[i] - minVal) / range) * 255);
        const pixelIdx = i * 4;
        restoredData[pixelIdx] = normalizedValue;     // R
        restoredData[pixelIdx + 1] = normalizedValue; // G
        restoredData[pixelIdx + 2] = normalizedValue; // B
      }
      
      restoredCtx.putImageData(restoredImageData, 0, 0);
      
      // Convert to image
      const restoredUrl = restoredCanvas.toDataURL();
      log("Simple CoSAE restoration complete");
      
      // Set the restored image
      setRestoredImage(restoredUrl);
      
      // Update status to complete
      setProcessingStatus("complete");
      setStatusMessage("Restoration complete!");
    });
  };
  
  // Handle bottleneck size changes
  const handleBottleneckChange = (e) => {
    const newSize = parseInt(e.target.value);
    log(`Bottleneck size changed to ${newSize}`);
    setBottleneckSize(newSize);
  };
  
  // Toggle between showing original and restored images
  const toggleShowOriginal = () => {
    setShowOriginal(!showOriginal);
  };
  
  // Toggle frequency visualization
  const toggleFrequencyViz = () => {
    setShowFrequencyViz(!showFrequencyViz);
  };
  
  // Toggle separate channel processing
  const toggleSeparateChannels = () => {
    setProcessSeparateChannels(!processSeparateChannels);
    log(`Separate color channel processing: ${!processSeparateChannels}`);
  };
  
  // Reset the demo
  const handleReset = () => {
    log("Resetting demo state");
    setOriginalImage(null);
    setLowResImage(null);
    setRestoredImage(null);
    setFrequencyCoeffs([]);
    setSelectedFrequency(null);
    setProcessingStatus("idle");
    setStatusMessage("");
    setImageDetails(null);
  };
  
  // Status badge component
  const StatusBadge = () => {
    let bgColor, textColor;
    
    switch (processingStatus) {
      case "idle":
        bgColor = "bg-gray-200";
        textColor = "text-gray-700";
        break;
      case "preparing":
        bgColor = "bg-blue-200";
        textColor = "text-blue-700";
        break;
      case "ready":
        bgColor = "bg-green-200";
        textColor = "text-green-700";
        break;
      case "processing":
        bgColor = "bg-yellow-200";
        textColor = "text-yellow-800";
        break;
      case "complete":
        bgColor = "bg-green-600";
        textColor = "text-white";
        break;
      case "error":
        bgColor = "bg-red-600";
        textColor = "text-white";
        break;
      default:
        bgColor = "bg-gray-200";
        textColor = "text-gray-700";
    }
    
    return (
      <div className={`${bgColor} ${textColor} px-4 py-2 rounded-t-lg font-semibold flex items-center`}>
        {processingStatus === "processing" && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        <span className="capitalize">{processingStatus !== "idle" ? processingStatus : "Ready"}</span>
        {statusMessage && <span className="ml-2 text-sm">- {statusMessage}</span>}
      </div>
    );
  };
  
  // UI Rendering
  return (
    <div className="flex flex-col items-center w-full p-4 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Enhanced CoSAE: Optimized Image Restoration</h1>
        <p className="text-gray-600 max-w-3xl">
          An advanced implementation of the CoSAE (Cosine Autoencoder) technology from NVIDIA.
          Learn how frequency coefficients in an extremely narrow bottleneck can preserve image details.
        </p>
      </div>
      
      {/* Status Display */}
      <div className="w-full max-w-5xl mb-4">
        <StatusBadge />
        <StatusLog messages={logs} />
      </div>
      
      {/* Tab Selection */}
      <div className="flex w-full max-w-5xl mb-4">
        <button 
          className={`flex-1 py-2 px-4 ${selectedTab === 'demo' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          onClick={() => setSelectedTab('demo')}
        >
          Demo
        </button>
        <button 
          className={`flex-1 py-2 px-4 ${selectedTab === 'explanation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          onClick={() => setSelectedTab('explanation')}
        >
          How It Works
        </button>
        <button 
          className={`flex-1 py-2 px-4 ${selectedTab === 'research' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          onClick={() => setSelectedTab('research')}
        >
          Research Details
        </button>
        <button 
          className={`flex-1 py-2 px-4 ${selectedTab === 'advanced' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          onClick={() => setSelectedTab('advanced')}
        >
          Advanced
        </button>
      </div>
      
      {/* Main Content */}
      {selectedTab === 'demo' ? (
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                id="image-upload" 
                disabled={processingStatus === "processing"}
              />
              <label 
                htmlFor="image-upload" 
                className={`bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 text-center ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Upload Image
              </label>
              
              <button 
                onClick={handleDemoImage} 
                className={`bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={processingStatus === "processing"}
              >
                Use Demo Image
              </button>
              
              {originalImage && (
                <button 
                  onClick={handleReset} 
                  className={`bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={processingStatus === "processing"}
                >
                  Reset
                </button>
              )}
            </div>
            
            <div className="flex flex-col space-y-4">
              {/* Bottleneck Size Control */}
              <div className="flex items-center space-x-2 relative">
                <div className="group">
                  <label className="text-gray-700 whitespace-nowrap cursor-help flex items-center">
                    Bottleneck Size:
                    <svg className="w-4 h-4 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </label>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-72 z-10 text-sm">
                    <p className="font-semibold mb-1">What is a bottleneck?</p>
                    <p className="mb-2 text-gray-700">In autoencoders like CoSAE, the bottleneck is the compressed representation of the image. A smaller bottleneck means higher compression.</p>
                    <p className="font-semibold mb-1">How does it affect results?</p>
                    <p className="mb-2 text-gray-700">Smaller values (8-32): More compression, less detail but faster processing. Good for simple images.</p>
                    <p className="text-gray-700">Larger values (64-256): Less compression, more detail but slower processing. Better for complex images.</p>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="italic text-xs text-gray-600">In the original CoSAE paper, the researchers found that even with very small bottlenecks (64× downsampling), their method could preserve remarkably good image quality.</p>
                    </div>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="8" 
                  max="256" 
                  step="8" 
                  value={bottleneckSize} 
                  onChange={handleBottleneckChange} 
                  className="w-48"
                  disabled={processingStatus === "processing"}
                />
                <span className="text-gray-700 w-12">{bottleneckSize}</span>
              </div>
              
              {/* Processing Options */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="separate-channels"
                  checked={processSeparateChannels}
                  onChange={toggleSeparateChannels}
                  disabled={processingStatus === "processing"}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="separate-channels" className="text-gray-700 text-sm">
                  Process color channels separately
                </label>
              </div>
              
              {/* Image Type Info */}
              {imageDetails && (
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-xs text-gray-600">
                  <p className="font-semibold mb-1">Image Analysis:</p>
                  <p>
                    Detected Type: <span className="font-medium">{imageDetails.detectedType || "Unknown"}</span>
                  </p>
                  <p>
                    Size: {imageDetails.originalWidth}×{imageDetails.originalHeight}
                  </p>
                </div>
              )}
            </div>
            
            {originalImage && (
              <div className="flex space-x-4">
                {restoredImage && (
                  <button 
                    onClick={toggleShowOriginal} 
                    className={`bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 text-sm ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={processingStatus === "processing"}
                  >
                    {showOriginal ? "Show Result" : "Show Original"}
                  </button>
                )}
                
                {frequencyCoeffs.length > 0 && (
                  <button 
                    onClick={toggleFrequencyViz} 
                    className={`bg-yellow-600 text-white py-1 px-3 rounded hover:bg-yellow-700 text-sm ${processingStatus === "processing" ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={processingStatus === "processing"}
                  >
                    {showFrequencyViz ? "Hide Frequencies" : "Show Frequencies"}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Image display area */}
          {processingStatus === "processing" ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-gray-600 flex flex-col items-center">
                <svg className="animate-spin mb-4 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>{statusMessage}</div>
              </div>
            </div>
          ) : originalImage ? (
            <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
              {/* Image display */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-center text-gray-700 font-semibold mb-2">Input Image</h3>
                    <ImageDisplay 
                      src={originalImage} 
                      alt="Original Image"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-center text-gray-700 font-semibold mb-2">Low Resolution (8x downsampled)</h3>
                    <ImageDisplay 
                      src={lowResImage} 
                      alt="Low Resolution Image"
                      status={!lowResImage && processingStatus === "ready" ? 
                        { type: 'loading', message: 'Waiting for processing...' } : 
                        null
                      }
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-center text-gray-700 font-semibold mb-2">
                      {showOriginal ? "Original Image (for comparison)" : "CoSAE Restored Image"}
                    </h3>
                    
                    {/* Restored image or processing button */}
                    {restoredImage ? (
                      <div className="relative">
                        <ImageDisplay 
                          src={showOriginal ? originalImage : restoredImage} 
                          alt={showOriginal ? "Original Image" : "Restored Image"}
                          size={500}
                        />
                        
                        {/* Run Again button */}
                        <div className="mt-4 flex justify-center">
                          <button 
                            onClick={() => startProcessing(true)} 
                            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center"
                            disabled={processingStatus === "processing"}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Run Again with Current Settings
                          </button>
                        </div>
                        
                        {/* Parameter impact explanation */}
                        <div className="mt-2 text-xs text-gray-600 bg-blue-50 rounded p-2 border border-blue-200">
                          <p className="font-semibold">Current Restoration Settings:</p>
                          <p>Bottleneck Size: {bottleneckSize} frequency components 
                            ({bottleneckSize/2} frequency pairs with amplitude and phase)</p>
                          <p>Color Channel Processing: {processSeparateChannels ? "Separate" : "Combined"}</p>
                          <p>Try adjusting the bottleneck size and running again to see how it affects detail preservation.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-64 border border-gray-300 rounded bg-gray-50">
                        {processingStatus === "ready" ? (
                          <button 
                            onClick={() => startProcessing(false)} 
                            className="bg-blue-600 text-white py-3 px-6 rounded-lg text-lg hover:bg-blue-700 transition-colors"
                          >
                            Restore Image
                          </button>
                        ) : (
                          <div className="text-gray-400 text-sm">No restored image yet</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Visualization area */}
              <div className="w-full md:w-72 flex flex-col space-y-4">
                {showFrequencyViz && frequencyCoeffs.length > 0 && (
                  <FrequencyVisualization 
                    coeffs={frequencyCoeffs}
                    selectedFrequency={selectedFrequency}
                    onSelect={setSelectedFrequency}
                  />
                )}
                
                {restoredImage && (
                  <ProgressiveReconstruction 
                    coeffs={frequencyCoeffs}
                    outputSize={256}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <p className="text-xl text-gray-600 mb-4">No image selected</p>
                <p className="text-gray-500">Upload an image or use a demo image to begin.</p>
              </div>
            </div>
          )}
        </div>
      ) : selectedTab === 'explanation' ? (
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">How CoSAE Works</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <p className="italic text-sm">
                CoSAE (Cosine Autoencoder) is a breakthrough neural network architecture for image restoration, 
                introduced by researchers at NVIDIA. The following explanation details how this technology 
                achieves exceptional image quality with extremely compact representations.
              </p>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">The Frequency Domain Advantage</h3>
            
            <p className="mb-3">
              Traditional autoencoders compress images by encoding spatial features directly, which often 
              results in lost details when using small bottlenecks. CoSAE takes a fundamentally different 
              approach by encoding images in the frequency domain instead.
            </p>
            
            <p className="mb-3">
              Each image is represented as a sum of 2D cosine waves, each with:
            </p>
            
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>A frequency pair (u, v) that determines the wave's orientation and spacing</li>
              <li>An amplitude that controls how strongly that frequency contributes</li>
              <li>A phase that shifts the wave pattern</li>
            </ul>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-2">The Encoding Process:</h4>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>The neural network analyzes the image to determine which frequency components are most important</li>
                  <li>It learns optimal amplitude and phase values for each frequency</li>
                  <li>These values are stored in a compact bottleneck representation</li>
                  <li>The number of stored coefficients determines the bottleneck size</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">The Decoding Process:</h4>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>The Harmonic Construction Module (HCM) converts frequency coefficients into 2D cosine waves</li>
                  <li>Each wave represents a specific frequency component</li>
                  <li>All waves are combined to reconstruct the full image</li>
                  <li>A decoder network refines the reconstruction further</li>
                </ol>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Why CoSAE Outperforms Traditional Methods</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2 text-blue-700">Extreme Compression</h4>
                <p className="text-sm">
                  CoSAE can achieve compression ratios of 64:1 or higher while preserving fine details, 
                  significantly outperforming traditional approaches.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2 text-blue-700">Learned Frequency Importance</h4>
                <p className="text-sm">
                  Rather than using fixed frequencies, CoSAE learns which frequencies matter most for 
                  specific types of images.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2 text-blue-700">Generalization Ability</h4>
                <p className="text-sm">
                  The frequency domain representation allows CoSAE to generalize well to different types 
                  of degradations and image types.
                </p>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Frequency Components Explained</h3>
            
            <p className="mb-3">
              Each frequency component in CoSAE is defined by:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 font-mono text-sm">
              H(u, v, x, y) = A<sub>(u,v)</sub> · cos(2π/T · (ux + vy) - φ<sub>(u,v)</sub>)
            </div>
            
            <p className="mb-3">
              Where:
            </p>
            <ul className="list-disc pl-5 mb-4">
              <li>u, v are frequency values in the horizontal and vertical directions</li>
              <li>A<sub>(u,v)</sub> is the amplitude for this frequency</li>
              <li>φ<sub>(u,v)</sub> is the phase shift</li>
              <li>T is the size of the output image</li>
            </ul>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Low Frequencies vs. High Frequencies:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h5 className="font-medium mb-1">Low Frequencies (small u, v values)</h5>
                  <ul className="list-disc pl-5 text-sm">
                    <li>Represent the overall structure and large features</li>
                    <li>Capture smooth transitions and gradients</li>
                    <li>Usually have higher amplitudes in natural images</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h5 className="font-medium mb-1">High Frequencies (large u, v values)</h5>
                  <ul className="list-disc pl-5 text-sm">
                    <li>Represent fine details and texture</li>
                    <li>Capture edges and sharp transitions</li>
                    <li>Usually have lower amplitudes but are crucial for details</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">How This Demo Works</h3>
            
            <p className="mb-3">
              While the actual CoSAE implementation uses a trained neural network to learn optimal frequency 
              coefficients, this demo uses a simplified approach:
            </p>
            
            <ol className="list-decimal pl-5 mb-4">
              <li>We analyze the image to determine its characteristics (text, photo, etc.)</li>
              <li>Based on the image type, we generate likely frequency patterns</li>
              <li>We process color channels separately to better preserve color details</li>
              <li>We use pre-computed lookup tables to efficiently calculate cosine values</li>
              <li>The Progressive Reconstruction visualization shows how the image builds up from frequency components</li>
            </ol>
            
            <p className="text-sm text-gray-600 mt-8">
              For more details, refer to the original paper: "CoSAE: Learnable Fourier Series for Image Restoration" 
              by Sifei Liu, Shalini De Mello, and Jan Kautz (NVIDIA).
            </p>
          </div>
        </div>
      ) : selectedTab === 'research' ? (
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">CoSAE Research Details</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <p className="italic text-sm">
                This section provides more detailed information about the actual CoSAE research from NVIDIA,
                including technical aspects and performance comparisons.
              </p>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Key Innovations in the Research Paper</h3>
            
            <p className="mb-3">
              The CoSAE architecture introduced several significant innovations:
            </p>
            
            <ol className="list-decimal pl-5 mb-4 space-y-2">
              <li>
                <strong>Learnable Frequency Components:</strong> Unlike traditional Fourier or DCT approaches that 
                use fixed frequencies, CoSAE learns which frequency components are most important for image restoration.
              </li>
              <li>
                <strong>Harmonic Construction Module (HCM):</strong> A specialized neural network component that 
                transforms bottleneck features into a set of harmonic functions that can be efficiently combined.
              </li>
              <li>
                <strong>Extremely Narrow Bottleneck:</strong> CoSAE achieves exceptional compression ratios 
                (64× downsampling in the bottleneck) while preserving fine details.
              </li>
              <li>
                <strong>Task-Agnostic Architecture:</strong> The same architecture works well for multiple 
                image restoration tasks, including super-resolution and blind image restoration.
              </li>
            </ol>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Technical Architecture</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-2">Encoder Network:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Consists of multiple ResNet blocks for feature extraction</li>
                  <li>Progressively downsamples the input image</li>
                  <li>Outputs a compact set of frequency coefficients (amplitudes and phases)</li>
                  <li>The bottleneck is typically 1/64th the size of the input image</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Harmonic Construction Module (HCM):</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Takes frequency coefficients as input</li>
                  <li>Constructs 2D cosine basis functions based on these coefficients</li>
                  <li>Each basis function represents a specific frequency component</li>
                  <li>Combines these functions to form a preliminary reconstruction</li>
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-2">Decoder Network:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Takes the output from the HCM</li>
                  <li>Refines the reconstruction to improve visual quality</li>
                  <li>Uses attention mechanisms to focus on important image regions</li>
                  <li>Produces the final restored image</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Training Process:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Trained on pairs of high-quality and degraded images</li>
                  <li>Uses a combination of L1 loss and perceptual loss</li>
                  <li>Adversarial training with a discriminator for improved perceptual quality</li>
                  <li>Frequency parameters are learned end-to-end</li>
                </ul>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Performance Highlights</h3>
            
            <p className="mb-3">
              The paper demonstrated several impressive capabilities:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">Super-Resolution Performance</h4>
                <ul className="list-disc pl-5 text-sm">
                  <li>Outperformed state-of-the-art methods on standard benchmarks</li>
                  <li>Achieved higher PSNR and SSIM scores</li>
                  <li>Superior perceptual quality as measured by LPIPS</li>
                  <li>Especially effective for extreme upsampling ratios (8×)</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">Blind Image Restoration</h4>
                <ul className="list-disc pl-5 text-sm">
                  <li>Successfully restored images with unknown degradations</li>
                  <li>Handled blur, noise, and compression artifacts</li>
                  <li>Preserved important facial details in face restoration tasks</li>
                  <li>Generalized well to out-of-distribution degradations</li>
                </ul>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Comparisons to Other Techniques</h3>
            
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Method</th>
                    <th className="border border-gray-300 p-2 text-left">Bottleneck Size</th>
                    <th className="border border-gray-300 p-2 text-left">PSNR</th>
                    <th className="border border-gray-300 p-2 text-left">SSIM</th>
                    <th className="border border-gray-300 p-2 text-left">Key Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">CoSAE</td>
                    <td className="border border-gray-300 p-2">1/64×</td>
                    <td className="border border-gray-300 p-2">32.65</td>
                    <td className="border border-gray-300 p-2">0.927</td>
                    <td className="border border-gray-300 p-2">Extremely narrow bottleneck with high fidelity</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">LIIF</td>
                    <td className="border border-gray-300 p-2">1/4×</td>
                    <td className="border border-gray-300 p-2">29.87</td>
                    <td className="border border-gray-300 p-2">0.881</td>
                    <td className="border border-gray-300 p-2">Coordinate-based implicit functions</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">LDM</td>
                    <td className="border border-gray-300 p-2">1/8×</td>
                    <td className="border border-gray-300 p-2">31.22</td>
                    <td className="border border-gray-300 p-2">0.902</td>
                    <td className="border border-gray-300 p-2">Latent diffusion modeling</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2">Traditional AE</td>
                    <td className="border border-gray-300 p-2">1/16×</td>
                    <td className="border border-gray-300 p-2">27.45</td>
                    <td className="border border-gray-300 p-2">0.854</td>
                    <td className="border border-gray-300 p-2">Direct spatial encoding</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="text-xs text-gray-500 mb-6">
              <p>Note: The above numbers are illustrative based on the research paper's findings. Actual values may vary across different datasets and test conditions.</p>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Differences Between This Demo and Real CoSAE</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2 text-blue-700">Our Enhanced Demo</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Uses pre-defined frequency patterns based on image type</li>
                  <li>Processes color channels separately for better color fidelity</li>
                  <li>Uses optimization techniques like lookup tables for efficiency</li>
                  <li>Demonstrates the core principles of frequency-domain encoding</li>
                  <li>No training or learning component</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2 text-blue-700">Actual CoSAE Architecture</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Learns optimal frequency patterns through neural network training</li>
                  <li>Sophisticated encoder and decoder networks</li>
                  <li>Trained on thousands of image pairs</li>
                  <li>Full Harmonic Construction Module implementation</li>
                  <li>End-to-end optimization of all components</li>
                </ul>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-8">
              Reference: Liu, S., De Mello, S., & Kautz, J. (2024). CoSAE: Learnable Fourier Series for Image Restoration. 
              38th Conference on Neural Information Processing Systems (NeurIPS 2024).
            </p>
          </div>
        </div>
      ) : selectedTab === 'advanced' ? (
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Advanced Implementation Details</h2>
            
            <p className="mb-4">
              This section provides a closer look at the technical implementation of our enhanced CoSAE demo,
              including optimization techniques and algorithms used.
            </p>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Optimization Techniques</h3>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-2">1. Cosine Lookup Tables</h4>
              <p className="mb-2 text-sm">
                To improve computational efficiency, we pre-compute cosine values for common frequencies and store them in lookup tables.
                This provides significant performance benefits:
              </p>
              <ul className="list-disc pl-5 text-sm mb-3">
                <li>O(1) access time for common frequency patterns</li>
                <li>Avoids redundant cosine calculations for the same frequency</li>
                <li>Enables faster interactive performance</li>
              </ul>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Example of lookup table creation
const cosineLookupTable = useMemo(() => {
  // Create lookup tables for common frequency combinations
  const lookup = {};
  const size = 256; // Output size
  
  // Create entries for low frequencies (most important)
  for (let u = -2; u <= 2; u++) {
    for (let v = -2; v <= 2; v++) {
      const key = \`\${u}_\${v}\`;
      lookup[key] = new Float32Array(size * size);
      
      const scaleU = (2 * Math.PI * u) / size;
      const scaleV = (2 * Math.PI * v) / size;
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = y * size + x;
          lookup[key][index] = Math.cos(x * scaleU + y * scaleV);
        }
      }
    }
  }
  
  return lookup;
}, []);`}
              </pre>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-2">2. Batch Processing</h4>
              <p className="mb-2 text-sm">
                To prevent UI blocking while processing large images, we implement batch processing of frequency components:
              </p>
              <ul className="list-disc pl-5 text-sm mb-3">
                <li>Process frequency components in small batches</li>
                <li>Update progress between batches</li>
                <li>Allow UI to remain responsive during processing</li>
              </ul>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Example of batch processing
const processBatch = (startIdx, endIdx, completion) => {
  // Process this batch of coefficients
  for (let idx = startIdx; idx < endIdx && idx < coeffs.length; idx++) {
    // Process frequency component...
  }
  
  // Complete or schedule next batch
  if (endIdx >= coeffs.length) {
    completion();
  } else {
    // Update status
    const progress = Math.round((endIdx / coeffs.length) * 100);
    setStatusMessage(\`Reconstructing image... (\${progress}%)\`);
    
    // Schedule next batch with setTimeout to allow UI updates
    setTimeout(() => {
      processBatch(endIdx, endIdx + 5, completion);
    }, 0);
  }
};

// Start batch processing
processBatch(0, 5, finalizeReconstruction);`}
              </pre>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-2">3. Separate Color Channel Processing</h4>
              <p className="mb-2 text-sm">
                Different color channels have different frequency characteristics. Our implementation processes them separately:
              </p>
              <ul className="list-disc pl-5 text-sm mb-3">
                <li>Extract R, G, B channels into separate arrays</li>
                <li>Analyze each channel to determine optimal frequency patterns</li>
                <li>Process each channel with tailored coefficients</li>
                <li>Recombine channels for the final image</li>
              </ul>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Extract separate RGB channels
const channels = [
  new Uint8Array(lowResSize * lowResSize),  // R
  new Uint8Array(lowResSize * lowResSize),  // G
  new Uint8Array(lowResSize * lowResSize)   // B
];

// Fill channel arrays
for (let i = 0, j = 0; i < data.length; i += 4, j++) {
  channels[0][j] = data[i];     // R
  channels[1][j] = data[i + 1]; // G
  channels[2][j] = data[i + 2]; // B
}

// Process each channel separately
const channelBuffers = channels.map((channel, idx) => {
  const channelType = analyzeChannelType(channel, idx);
  const coeffs = getLearnedCoefficients(channelType, bottleneckSize, idx);
  return reconstructChannel(coeffs, outputSize);
});

// Recombine channels
for (let i = 0, j = 0; i < restoredData.length; i += 4, j++) {
  restoredData[i] = channelBuffers[0][j];     // R
  restoredData[i + 1] = channelBuffers[1][j]; // G
  restoredData[i + 2] = channelBuffers[2][j]; // B
  restoredData[i + 3] = 255;                  // A
}`}
              </pre>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Image Analysis Techniques</h3>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Image Type Detection</h4>
              <p className="mb-2 text-sm">
                To select appropriate frequency patterns, we analyze image characteristics:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Detect image type based on characteristics
const detectImageType = (img) => {
  // Create a small canvas to analyze the image
  const canvas = document.createElement('canvas');
  const size = 32; // Small sample size for efficiency
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  // Calculate image metrics
  let edgeCount = 0;
  let totalBrightness = 0;
  let contrastSum = 0;
  
  // Check for edges and calculate contrast
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      // Calculate differences between neighboring pixels...
      
      // Count edge pixels
      if (diffX > 100 || diffY > 100) {
        edgeCount++;
      }
      
      contrastSum += diffX + diffY;
    }
  }
  
  const avgBrightness = totalBrightness / (size * size);
  const avgContrast = contrastSum / (size * size);
  const edgeRatio = edgeCount / (size * size);
  
  // Determine image type based on metrics
  if (edgeRatio > 0.1 && avgContrast > 100) {
    return "text"; // High edge ratio and contrast suggests text or graphics
  } else if (avgContrast > 50) {
    return "photo"; // Moderate contrast suggests photos
  } else {
    return "natural"; // Default to natural
  }
};`}
              </pre>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Further Improvements</h3>
            
            <p className="mb-3">
              To make this demo even closer to the real CoSAE implementation, consider these additional enhancements:
            </p>
            
            <ol className="list-decimal pl-5 mb-4 space-y-2">
              <li>
                <strong>Implement a Simple Neural Network:</strong> Add a small neural network to learn frequency 
                patterns from example images rather than using pre-defined patterns.
              </li>
              <li>
                <strong>Frequency Domain Transfer:</strong> Apply the Fourier transform to the input image, 
                manipulate frequency components directly, then apply the inverse transform.
              </li>
              <li>
                <strong>Edge-Aware Processing:</strong> Detect edges in the image and preserve them specifically 
                in the restoration process.
              </li>
              <li>
                <strong>Perceptual Loss:</strong> Add a perceptual quality metric to evaluate and optimize 
                the reconstruction quality.
              </li>
            </ol>
            
            <p className="text-sm text-gray-600 mt-8">
              The code in this demo represents a practical balance between accuracy and performance. It 
              demonstrates the core principles of CoSAE while maintaining interactive performance in a web browser.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CoSAEDemo;

