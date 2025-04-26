// import React, { useState, useEffect, useRef } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// // Main CoSAE demonstration component
// const CoSAEDemo = () => {
//   // State for various aspects of the demo
//   const [originalImage, setOriginalImage] = useState(null);
//   const [lowResImage, setLowResImage] = useState(null);
//   const [restoredImage, setRestoredImage] = useState(null);
//   const [bottleneckSize, setBottleneckSize] = useState(64); // Default bottleneck size
//   const [frequencyCoeffs, setFrequencyCoeffs] = useState([]);
//   const [selectedFrequency, setSelectedFrequency] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [selectedTab, setSelectedTab] = useState('demo'); // 'demo' or 'explanation'
//   const [showOriginal, setShowOriginal] = useState(false); // Toggle for comparison view
//   const [showFrequencyViz, setShowFrequencyViz] = useState(false);
  
//   const canvasOriginal = useRef(null);
//   const canvasLowRes = useRef(null);
//   const canvasRestored = useRef(null);
//   const canvasFrequency = useRef(null);
//   const canvasSingleFreq = useRef(null);
  
//   // Process the uploaded image
//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
    
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const img = new Image();
//       img.onload = () => {
//         setOriginalImage(img);
//         processImage(img);
//       };
//       img.src = e.target.result;
//     };
//     reader.readAsDataURL(file);
//   };
  
//   // Process a demo image
//   const handleDemoImage = () => {
//     const img = new Image();
//     img.onload = () => {
//       setOriginalImage(img);
//       processImage(img);
//     };
//     img.src = "/api/placeholder/512/512";
//   };
  
//   // Process the image through our simplified CoSAE pipeline
//   const processImage = (img) => {
//     setIsProcessing(true);
    
//     // Step 1: Draw the original image to the canvas
//     drawImageToCanvas(img, canvasOriginal.current, 256);
    
//     // Step 2: Create a low-resolution version
//     const lowResSize = 32; // 8x downsampling
//     const lowResCanvas = document.createElement('canvas');
//     lowResCanvas.width = lowResSize;
//     lowResCanvas.height = lowResSize;
//     const lowResCtx = lowResCanvas.getContext('2d');
//     lowResCtx.drawImage(img, 0, 0, lowResSize, lowResSize);
    
//     // Step 3: Scale the low-res image back up to show degradation
//     const scaledLowRes = document.createElement('canvas');
//     scaledLowRes.width = 256;
//     scaledLowRes.height = 256;
//     const scaledLowResCtx = scaledLowRes.getContext('2d');
//     scaledLowResCtx.imageSmoothingEnabled = false; // For pixelated upscaling
//     scaledLowResCtx.drawImage(lowResCanvas, 0, 0, 256, 256);
    
//     const lowResImg = new Image();
//     lowResImg.onload = () => {
//       setLowResImage(lowResImg);
//       drawImageToCanvas(lowResImg, canvasLowRes.current, 256);
      
//       // Step 4: Simulate CoSAE restoration process
//       simulateCoSAERestoration(lowResCanvas, bottleneckSize);
//     };
//     lowResImg.src = scaledLowRes.toDataURL();
//   };
  
//   // Draw image to a canvas at specified size
//   const drawImageToCanvas = (img, canvas, size) => {
//     if (!canvas) return;
    
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, size, size);
//     canvas.width = size;
//     canvas.height = size;
    
//     // Center and scale the image to fit the canvas
//     const scale = Math.min(size / img.width, size / img.height);
//     const x = (size - img.width * scale) / 2;
//     const y = (size - img.height * scale) / 2;
    
//     ctx.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * scale, img.height * scale);
//   };
  
//   // Visualize frequency coefficients on a canvas
//   const visualizeFrequencyCoefficients = (coeffs) => {
//     if (!canvasFrequency.current) return;
    
//     const canvas = canvasFrequency.current;
//     const ctx = canvas.getContext('2d');
//     const size = canvas.width;
    
//     ctx.clearRect(0, 0, size, size);
    
//     // We'll create a grid representing the frequency space
//     const gridSize = 8;
//     const cellSize = size / gridSize;
    
//     // Draw grid lines
//     ctx.strokeStyle = '#ddd';
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
      
//       // Add highlight on hover if this is the selected frequency
//       if (selectedFrequency === index) {
//         ctx.beginPath();
//         ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
//         ctx.strokeStyle = 'white';
//         ctx.lineWidth = 2;
//         ctx.stroke();
        
//         // Also visualize this single frequency
//         visualizeSingleFrequency(coeff);
//       }
//     });
//   };
  
//   // Visualize a single frequency component
//   const visualizeSingleFrequency = (coeff) => {
//     if (!canvasSingleFreq.current) return;
    
//     const canvas = canvasSingleFreq.current;
//     const ctx = canvas.getContext('2d');
//     const size = canvas.width;
    
//     ctx.clearRect(0, 0, size, size);
    
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
//   };
  
//   // Simulate CoSAE restoration process
//   const simulateCoSAERestoration = (lowResCanvas, bottleneckSize) => {
//     const lowResSize = lowResCanvas.width;
//     const outputSize = 256;
    
//     // Step 1: Extract RGB data from low-res image
//     const lowResCtx = lowResCanvas.getContext('2d');
//     const lowResImageData = lowResCtx.getImageData(0, 0, lowResSize, lowResSize);
//     const lowResData = lowResImageData.data;
    
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
//     }
    
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
    
//     // Add each frequency component
//     coeffs.forEach(coeff => {
//       const { u, v, amplitude, phase } = coeff;
      
//       // Scale factors for the frequency
//       const scaleU = (2 * Math.PI * u) / outputSize;
//       const scaleV = (2 * Math.PI * v) / outputSize;
      
//       // Add this component to our image
//       for (let y = 0; y < outputSize; y++) {
//         for (let x = 0; x < outputSize; x++) {
//           // Calculate the cosine value at this position
//           const value = Math.cos(x * scaleU + y * scaleV + phase);
          
//           // Scale to [0, 255] and apply amplitude
//           const intensity = Math.round(value * 127 * amplitude);
          
//           // Update RGBA values - add to all channels for now
//           const pixelIndex = (y * outputSize + x) * 4;
//           restoredData[pixelIndex] += intensity;     // R
//           restoredData[pixelIndex + 1] += intensity; // G
//           restoredData[pixelIndex + 2] += intensity; // B
//         }
//       }
//     });
    
//     // Normalize the result to [0, 255]
//     let minVal = 255, maxVal = 0;
//     for (let i = 0; i < restoredData.length; i += 4) {
//       minVal = Math.min(minVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
//       maxVal = Math.max(maxVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
//     }
    
//     const range = maxVal - minVal;
//     for (let i = 0; i < restoredData.length; i += 4) {
//       restoredData[i] = Math.round(((restoredData[i] - minVal) / range) * 255);
//       restoredData[i+1] = Math.round(((restoredData[i+1] - minVal) / range) * 255);
//       restoredData[i+2] = Math.round(((restoredData[i+2] - minVal) / range) * 255);
//     }
    
//     // Put the processed data back
//     restoredCtx.putImageData(restoredImageData, 0, 0);
    
//     // Convert to image and update state
//     const restoredImg = new Image();
//     restoredImg.onload = () => {
//       setRestoredImage(restoredImg);
//       drawImageToCanvas(restoredImg, canvasRestored.current, 256);
//       setFrequencyCoeffs(coeffs);
//       visualizeFrequencyCoefficients(coeffs);
//       setIsProcessing(false);
//     };
//     restoredImg.src = restoredCanvas.toDataURL();
//   };
  
//   // Handle bottleneck size changes
//   const handleBottleneckChange = (e) => {
//     const newSize = parseInt(e.target.value);
//     setBottleneckSize(newSize);
    
//     // Reprocess if we have an image
//     if (originalImage) {
//       setIsProcessing(true);
//       // Short delay to allow UI to update
//       setTimeout(() => processImage(originalImage), 50);
//     }
//   };
  
//   // Handle frequency selection for visualization
//   const handleFrequencySelect = (index) => {
//     setSelectedFrequency(index === selectedFrequency ? null : index);
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
//     setOriginalImage(null);
//     setLowResImage(null);
//     setRestoredImage(null);
//     setFrequencyCoeffs([]);
//     setSelectedFrequency(null);
//     setIsProcessing(false);
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
      
//       {/* Tab Selection */}
//       <div className="flex w-full max-w-5xl mb-6">
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
//               />
//               <label 
//                 htmlFor="image-upload" 
//                 className="bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 text-center"
//               >
//                 Upload Image
//               </label>
              
//               <button 
//                 onClick={handleDemoImage} 
//                 className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
//               >
//                 Use Demo Image
//               </button>
              
//               {originalImage && (
//                 <button 
//                   onClick={handleReset} 
//                   className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
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
//                   disabled={isProcessing || !originalImage}
//                 />
//                 <span className="text-gray-700 w-8">{bottleneckSize}</span>
//               </div>
              
//               {originalImage && (
//                 <div className="flex space-x-4">
//                   <button 
//                     onClick={toggleShowOriginal} 
//                     className="bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 text-sm"
//                   >
//                     {showOriginal ? "Show Result" : "Show Original"}
//                   </button>
                  
//                   <button 
//                     onClick={toggleFrequencyViz} 
//                     className="bg-yellow-600 text-white py-1 px-3 rounded hover:bg-yellow-700 text-sm"
//                   >
//                     {showFrequencyViz ? "Hide Frequencies" : "Show Frequencies"}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {isProcessing ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="text-xl text-gray-600">Processing...</div>
//             </div>
//           ) : originalImage ? (
//             <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
//               {/* Image display area */}
//               <div className="flex-1">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <h3 className="text-center text-gray-700 font-semibold mb-2">Input Image</h3>
//                     <div className="relative border border-gray-300 rounded">
//                       <canvas 
//                         ref={canvasOriginal} 
//                         width="256" 
//                         height="256" 
//                         className="w-full"
//                       />
//                     </div>
//                   </div>
                  
//                   <div>
//                     <h3 className="text-center text-gray-700 font-semibold mb-2">Low Resolution (8x downsampled)</h3>
//                     <div className="relative border border-gray-300 rounded">
//                       <canvas 
//                         ref={canvasLowRes} 
//                         width="256" 
//                         height="256" 
//                         className="w-full"
//                       />
//                     </div>
//                   </div>
                  
//                   <div className="col-span-2">
//                     <h3 className="text-center text-gray-700 font-semibold mb-2">
//                       {showOriginal ? "Original Image (for comparison)" : "CoSAE Restored Image"}
//                     </h3>
//                     <div className="relative border border-gray-300 rounded">
//                       <canvas 
//                         ref={canvasRestored} 
//                         width="256" 
//                         height="256" 
//                         className="w-full"
//                       />
//                       {/* We'll overlay the original when toggled */}
//                       {showOriginal && originalImage && (
//                         <div className="absolute inset-0 flex justify-center items-center">
//                           <img 
//                             src={originalImage.src} 
//                             alt="Original" 
//                             className="max-w-full max-h-full"
//                           />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Frequency visualization area */}
//               {showFrequencyViz && (
//                 <div className="w-full md:w-72 flex flex-col space-y-4">
//                   <div className="border border-gray-300 rounded p-4 bg-gray-50">
//                     <h3 className="text-center text-gray-700 font-semibold mb-2">Frequency Coefficients</h3>
//                     <p className="text-xs text-gray-600 mb-2">
//                       Click on a frequency to visualize its contribution.
//                     </p>
//                     <div className="relative">
//                       <canvas 
//                         ref={canvasFrequency} 
//                         width="200" 
//                         height="200" 
//                         className="w-full border border-gray-300 bg-gray-900 rounded mb-4"
//                         onClick={(e) => {
//                           // Calculate which frequency was clicked based on position
//                           const canvas = canvasFrequency.current;
//                           const rect = canvas.getBoundingClientRect();
//                           const x = e.clientX - rect.left;
//                           const y = e.clientY - rect.top;
//                           const gridSize = 8;
//                           const cellSize = canvas.width / gridSize;
                          
//                           // Convert to grid coordinates
//                           const gridX = Math.floor(x / cellSize);
//                           const gridY = Math.floor(y / cellSize);
                          
//                           // Find the closest frequency
//                           let closestIdx = null;
//                           let closestDist = Infinity;
                          
//                           frequencyCoeffs.forEach((coeff, idx) => {
//                             const freqGridX = (coeff.u + gridSize/2);
//                             const freqGridY = (coeff.v + gridSize/2);
//                             const dist = Math.sqrt(
//                               Math.pow(freqGridX - gridX, 2) + 
//                               Math.pow(freqGridY - gridY, 2)
//                             );
                            
//                             if (dist < closestDist && dist < 1) {
//                               closestDist = dist;
//                               closestIdx = idx;
//                             }
//                           });
                          
//                           if (closestIdx !== null) {
//                             handleFrequencySelect(closestIdx);
//                           }
//                         }}
//                       />
//                     </div>
                    
//                     {selectedFrequency !== null && (
//                       <div>
//                         <h4 className="text-sm text-gray-700 font-semibold">Selected Frequency</h4>
//                         <div className="border border-gray-300 rounded bg-white p-2 mb-2">
//                           <canvas 
//                             ref={canvasSingleFreq} 
//                             width="150" 
//                             height="150" 
//                             className="w-full"
//                           />
//                         </div>
                        
//                         <div className="text-xs text-gray-600">
//                           <p>
//                             u = {frequencyCoeffs[selectedFrequency].u}, 
//                             v = {frequencyCoeffs[selectedFrequency].v}
//                           </p>
//                           <p>
//                             Amplitude: {frequencyCoeffs[selectedFrequency].amplitude.toFixed(3)}
//                           </p>
//                           <p>
//                             Phase: {(frequencyCoeffs[selectedFrequency].phase / Math.PI).toFixed(2)}π
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
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
//               <li>You can visualize the frequency coefficients learned by the model</li>
//             </ul>
            
//             <p className="mb-4">
//               Note that this is a simplified toy implementation to demonstrate the core concepts.
//               The full CoSAE model as described in the paper includes a more sophisticated neural 
//               network architecture and training process.
//             </p>
            
//             <p className="text-sm text-gray-600 mt-8">
//               Reference: Liu, S., De Mello, S., & Kautz, J. (2024). CosAE: Learnable Fourier Series for Image Restoration. 
//               38th Conference on Neural Information Processing Systems (NeurIPS 2024).
//             </p>
//           </div>
//         </div>
//       )}
      
//     </div>
//   );
// }

// export default CoSAEDemo;

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Main CoSAE demonstration component
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
  const [selectedTab, setSelectedTab] = useState('demo'); // 'demo' or 'explanation'
  const [showOriginal, setShowOriginal] = useState(false); // Toggle for comparison view
  const [showFrequencyViz, setShowFrequencyViz] = useState(false);
  
  const canvasOriginal = useRef(null);
  const canvasLowRes = useRef(null);
  const canvasRestored = useRef(null);
  const canvasFrequency = useRef(null);
  const canvasSingleFreq = useRef(null);
  
  // Process the uploaded image - just load and display, don't run the algorithm yet
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProcessingStatus("preparing");
    setStatusMessage("Loading image...");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to 512x512 while preserving aspect ratio
        const resizedImg = resizeImage(img, 512, 512);
        setOriginalImage(resizedImg);
        
        // Display the original image
        drawImageToCanvas(resizedImg, canvasOriginal.current, 256);
        
        // Display image details
        const details = {
          originalWidth: img.width,
          originalHeight: img.height,
          size: formatBytes(file.size),
          type: file.type,
          name: file.name
        };
        setImageDetails(details);
        
        setProcessingStatus("ready");
        setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  // Process a demo image
  const handleDemoImage = () => {
    setProcessingStatus("preparing");
    setStatusMessage("Loading demo image...");
    
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Necessary for placeholder images
    
    img.onload = () => {
      // Use the placeholder image as our original
      setOriginalImage(img);
      
      // Display the original image
      drawImageToCanvas(img, canvasOriginal.current, 256);
      
      // Display image details
      const details = {
        originalWidth: img.width,
        originalHeight: img.height,
        size: "Demo image",
        type: "image/png",
        name: "demo-image.png"
      };
      setImageDetails(details);
      
      setProcessingStatus("ready");
      setStatusMessage("Ready to process. Click 'Restore Image' to apply CoSAE algorithm.");
    };
    
    img.onerror = () => {
      setProcessingStatus("error");
      setStatusMessage("Error loading demo image. Please try uploading your own image.");
    };
    
    // Use a specific seed to get a consistent placeholder
    img.src = "/api/placeholder/512/512?text=Demo%20Image";
  };
  
  // Resize image to target dimensions while preserving aspect ratio
  const resizeImage = (img, targetWidth, targetHeight) => {
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
    
    // Create a new image from the canvas
    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL();
    return resizedImg;
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
  const startProcessing = () => {
    if (!originalImage || processingStatus === "processing") return;
    
    setProcessingStatus("processing");
    setStatusMessage("Creating low-resolution version...");
    
    // Process in a slight delay to allow UI to update
    setTimeout(() => {
      // Create low-res version
      createLowResVersion(originalImage);
    }, 50);
  };
  
  // Create a low-resolution version of the image
  const createLowResVersion = (img) => {
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
    
    const lowResImg = new Image();
    lowResImg.onload = () => {
      setLowResImage(lowResImg);
      drawImageToCanvas(lowResImg, canvasLowRes.current, 256);
      
      // Update status
      setStatusMessage("Applying CoSAE restoration algorithm...");
      
      // Process in a slight delay to allow UI to update
      setTimeout(() => {
        // Now run the CoSAE restoration
        simulateCoSAERestoration(lowResCanvas, bottleneckSize);
      }, 50);
    };
    lowResImg.src = scaledLowRes.toDataURL();
  };
  
  // Draw image to a canvas at specified size
  const drawImageToCanvas = (img, canvas, size) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    canvas.width = size;
    canvas.height = size;
    
    // Center and scale the image to fit the canvas
    const scale = Math.min(size / img.width, size / img.height);
    const x = (size - img.width * scale) / 2;
    const y = (size - img.height * scale) / 2;
    
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * scale, img.height * scale);
  };
  
  // Visualize frequency coefficients on a canvas
  const visualizeFrequencyCoefficients = (coeffs) => {
    if (!canvasFrequency.current) return;
    
    const canvas = canvasFrequency.current;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    ctx.clearRect(0, 0, size, size);
    
    // We'll create a grid representing the frequency space
    const gridSize = 8;
    const cellSize = size / gridSize;
    
    // Draw grid lines
    ctx.strokeStyle = '#ddd';
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
      
      // Add highlight on hover if this is the selected frequency
      if (selectedFrequency === index) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Also visualize this single frequency
        visualizeSingleFrequency(coeff);
      }
    });
  };
  
  // Visualize a single frequency component
  const visualizeSingleFrequency = (coeff) => {
    if (!canvasSingleFreq.current) return;
    
    const canvas = canvasSingleFreq.current;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    ctx.clearRect(0, 0, size, size);
    
    // Extract parameters
    const { u, v, amplitude, phase } = coeff;
    
    // Draw a 2D Cosine wave based on the parameters
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
  };
  
  // Simulate CoSAE restoration process
  const simulateCoSAERestoration = (lowResCanvas, bottleneckSize) => {
    const lowResSize = lowResCanvas.width;
    const outputSize = 256;
    
    // Update status
    setStatusMessage("Extracting image data...");
    
    // Step 1: Extract RGB data from low-res image
    const lowResCtx = lowResCanvas.getContext('2d');
    const lowResImageData = lowResCtx.getImageData(0, 0, lowResSize, lowResSize);
    const lowResData = lowResImageData.data;
    
    // Update status
    setStatusMessage("Generating frequency coefficients...");
    
    // Step 2: We'll simulate the bottleneck encoding by creating frequency coefficients
    // In a real CoSAE, this would be learned by a neural network
    const numFreqs = bottleneckSize / 2; // Each frequency has amplitude and phase
    const coeffs = [];
    
    // Generate cosine basis functions with different frequencies
    // In a real implementation, these would be learned from the data
    for (let i = 0; i < numFreqs; i++) {
      // Create a frequency pair (u, v) - distribute the frequencies in a grid
      const u = Math.floor(i / 8) - 4; // Range: -4 to 3
      const v = i % 8 - 4;             // Range: -4 to 3
      
      // Simulate learned amplitudes and phases
      // Lower frequencies generally have higher amplitudes in natural images
      const distFromCenter = Math.sqrt(u*u + v*v);
      const amplitude = Math.max(0.05, 1.0 / (1.0 + distFromCenter)) * (0.7 + 0.3 * Math.random());
      const phase = Math.random() * Math.PI * 2; // Random phase
      
      coeffs.push({ u, v, amplitude, phase });
      
      // Periodically update status for larger bottleneck sizes
      if (i % 20 === 0 && i > 0) {
        setStatusMessage(`Generating frequency coefficients... (${Math.round(i/numFreqs*100)}%)`);
      }
    }
    
    // Update status
    setStatusMessage("Reconstructing image from frequency components...");
    
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
    
    // Process in batches to avoid UI freezing and update progress
    const processBatch = (startIdx, endIdx, completion) => {
      // Add frequency components in this batch
      for (let idx = startIdx; idx < endIdx && idx < coeffs.length; idx++) {
        const coeff = coeffs[idx];
        const { u, v, amplitude, phase } = coeff;
        
        // Scale factors for the frequency
        const scaleU = (2 * Math.PI * u) / outputSize;
        const scaleV = (2 * Math.PI * v) / outputSize;
        
        // Add this component to our image
        for (let y = 0; y < outputSize; y++) {
          for (let x = 0; x < outputSize; x++) {
            // Calculate the cosine value at this position
            const value = Math.cos(x * scaleU + y * scaleV + phase);
            
            // Scale to [0, 255] and apply amplitude
            const intensity = Math.round(value * 127 * amplitude);
            
            // Update RGBA values - add to all channels for now
            const pixelIndex = (y * outputSize + x) * 4;
            restoredData[pixelIndex] += intensity;     // R
            restoredData[pixelIndex + 1] += intensity; // G
            restoredData[pixelIndex + 2] += intensity; // B
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
      let minVal = 255, maxVal = 0;
      for (let i = 0; i < restoredData.length; i += 4) {
        minVal = Math.min(minVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
        maxVal = Math.max(maxVal, restoredData[i], restoredData[i+1], restoredData[i+2]);
      }
      
      const range = maxVal - minVal;
      for (let i = 0; i < restoredData.length; i += 4) {
        restoredData[i] = Math.round(((restoredData[i] - minVal) / range) * 255);
        restoredData[i+1] = Math.round(((restoredData[i+1] - minVal) / range) * 255);
        restoredData[i+2] = Math.round(((restoredData[i+2] - minVal) / range) * 255);
      }
      
      // Put the processed data back
      restoredCtx.putImageData(restoredImageData, 0, 0);
      
      // Convert to image and update state
      const restoredImg = new Image();
      restoredImg.onload = () => {
        setRestoredImage(restoredImg);
        drawImageToCanvas(restoredImg, canvasRestored.current, 256);
        setFrequencyCoeffs(coeffs);
        visualizeFrequencyCoefficients(coeffs);
        
        // Update status to complete
        setProcessingStatus("complete");
        setStatusMessage("Restoration complete!");
      };
      restoredImg.src = restoredCanvas.toDataURL();
    });
  };
  
  // Handle bottleneck size changes
  const handleBottleneckChange = (e) => {
    const newSize = parseInt(e.target.value);
    setBottleneckSize(newSize);
  };
  
  // Handle frequency selection for visualization
  const handleFrequencySelect = (index) => {
    setSelectedFrequency(index === selectedFrequency ? null : index);
  };
  
  // Toggle between showing original and restored images
  const toggleShowOriginal = () => {
    setShowOriginal(!showOriginal);
  };
  
  // Toggle frequency visualization
  const toggleFrequencyViz = () => {
    setShowFrequencyViz(!showFrequencyViz);
  };
  
  // Reset the demo
  const handleReset = () => {
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
      <div className={`${bgColor} ${textColor} px-4 py-2 rounded-lg font-semibold flex items-center`}>
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
        <h1 className="text-3xl font-bold text-blue-800 mb-2">CoSAE: Learnable Fourier Series for Image Restoration</h1>
        <p className="text-gray-600 max-w-3xl">
          An interactive demonstration of the core concepts from the NVIDIA research paper.
          CoSAE uses learnable harmonic functions to encode frequency coefficients in a bottleneck for image restoration.
        </p>
      </div>
      
      {/* Status Badge */}
      <div className="w-full max-w-5xl mb-4">
        <StatusBadge />
      </div>
      
      {/* Tab Selection */}
      <div className="flex w-full max-w-5xl mb-6">
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
          Explanation
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
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <label className="text-gray-700 whitespace-nowrap">Bottleneck Size:</label>
                <input 
                  type="range" 
                  min="8" 
                  max="256" 
                  step="8" 
                  value={bottleneckSize} 
                  onChange={handleBottleneckChange} 
                  className="w-48"
                  disabled={processingStatus === "processing" || !originalImage}
                />
                <span className="text-gray-700 w-8">{bottleneckSize}</span>
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
                    <div className="relative border border-gray-300 rounded">
                      <canvas 
                        ref={canvasOriginal} 
                        width="256" 
                        height="256" 
                        className="w-full"
                      />
                    </div>
                    {/* Display image details */}
                    {imageDetails && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p>Original Size: {imageDetails.originalWidth} × {imageDetails.originalHeight}</p>
                        <p>File Size: {imageDetails.size}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-center text-gray-700 font-semibold mb-2">Low Resolution (8x downsampled)</h3>
                    <div className="relative border border-gray-300 rounded">
                      {lowResImage ? (
                        <canvas 
                          ref={canvasLowRes} 
                          width="256" 
                          height="256" 
                          className="w-full"
                        />
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                          {processingStatus === "ready" ? "Click 'Restore Image' to begin" : "No low-res image yet"}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-center text-gray-700 font-semibold mb-2">
                      {showOriginal ? "Original Image (for comparison)" : "CoSAE Restored Image"}
                    </h3>
                    <div className="relative border border-gray-300 rounded">
                      {restoredImage ? (
                        <>
                          <canvas 
                            ref={canvasRestored} 
                            width="256" 
                            height="256" 
                            className="w-full"
                          />
                          {/* We'll overlay the original when toggled */}
                          {showOriginal && originalImage && (
                            <div className="absolute inset-0 flex justify-center items-center">
                              <img 
                                src={originalImage.src} 
                                alt="Original" 
                                className="max-w-full max-h-full"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          {processingStatus === "ready" ? (
                            <button 
                              onClick={startProcessing} 
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
              </div>
              
              {/* Frequency visualization area */}
              {showFrequencyViz && (
                <div className="w-full md:w-72 flex flex-col space-y-4">
                  <div className="border border-gray-300 rounded p-4 bg-gray-50">
                    <h3 className="text-center text-gray-700 font-semibold mb-2">Frequency Coefficients</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      Click on a frequency to visualize its contribution.
                    </p>
                    <div className="relative">
                      <canvas 
                        ref={canvasFrequency} 
                        width="200" 
                        height="200" 
                        className="w-full border border-gray-300 bg-gray-900 rounded mb-4"
                        onClick={(e) => {
                          // Calculate which frequency was clicked based on position
                          const canvas = canvasFrequency.current;
                          const rect = canvas.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          const gridSize = 8;
                          const cellSize = canvas.width / gridSize;
                          
                          // Convert to grid coordinates
                          const gridX = Math.floor(x / cellSize);
                          const gridY = Math.floor(y / cellSize);
                          
                          // Find the closest frequency
                          let closestIdx = null;
                          let closestDist = Infinity;
                          
                          frequencyCoeffs.forEach((coeff, idx) => {
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
                          
                          if (closestIdx !== null) {
                            handleFrequencySelect(closestIdx);
                          }
                        }}
                      />
                    </div>
                    
                    {selectedFrequency !== null && (
                      <div>
                        <h4 className="text-sm text-gray-700 font-semibold">Selected Frequency</h4>
                        <div className="border border-gray-300 rounded bg-white p-2 mb-2">
                          <canvas 
                            ref={canvasSingleFreq} 
                            width="150" 
                            height="150" 
                            className="w-full"
                          />
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <p>
                            u = {frequencyCoeffs[selectedFrequency].u}, 
                            v = {frequencyCoeffs[selectedFrequency].v}
                          </p>
                          <p>
                            Amplitude: {frequencyCoeffs[selectedFrequency].amplitude.toFixed(3)}
                          </p>
                          <p>
                            Phase: {(frequencyCoeffs[selectedFrequency].phase / Math.PI).toFixed(2)}π
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
      ) : (
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
          <div className="prose mx-auto">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Understanding CoSAE</h2>
            
            <p className="mb-4">
              CoSAE (Cosine Autoencoder) is a novel neural network architecture for image restoration, 
              introduced in the paper "CoSAE: Learnable Fourier Series for Image Restoration" by Sifei Liu, 
              Shalini De Mello, and Jan Kautz from NVIDIA.
            </p>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Key Innovations</h3>
            
            <p className="mb-3">
              1. <strong>Fourier Series Representation</strong> - CoSAE encodes images using a series of 
              2D Cosine waves, each defined by a frequency pair (u, v) and corresponding amplitude and phase.
            </p>
            
            <p className="mb-3">
              2. <strong>Extremely Narrow Bottleneck</strong> - Despite having a compact representation in 
              the bottleneck layer, CoSAE maintains high-fidelity details in the reconstructed images.
            </p>
            
            <p className="mb-3">
              3. <strong>Learnable Frequency Parameters</strong> - Unlike conventional autoencoders,
              CoSAE learns the optimal frequency coefficients, enabling better generalization.
            </p>
            
            <div className="my-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">How it Works:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>The encoder compresses an input image to a series of frequency coefficients (amplitude and phase pairs).</li>
                <li>These coefficients are stored in an extremely narrow bottleneck (as small as 1/64th of the original size).</li>
                <li>The Harmonic Construction Module (HCM) expands these coefficients into 2D cosine basis functions.</li>
                <li>The decoder combines these basis functions to reconstruct the full-resolution image.</li>
              </ol>
            </div>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">Applications</h3>
            
            <p className="mb-3">
              CoSAE was shown to excel at several challenging image restoration tasks:
            </p>
            
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li><strong>Flexible-resolution Super-resolution</strong> - Upscaling images to arbitrary sizes</li>
              <li><strong>Blind Image Restoration</strong> - Reconstructing images from unknown degradations</li>
              <li><strong>General image enhancement</strong> - Improving visual quality of degraded images</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-blue-700 mt-6 mb-2">About this Demo</h3>
            
            <p className="mb-4">
              This interactive demonstration provides a simplified version of CoSAE's capabilities:
            </p>
            
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Upload or select a demo image</li>
              <li>The image is downsampled to create a low-resolution version</li>
              <li>A simplified version of CoSAE is applied to restore the image</li>
              <li>You can adjust the bottleneck size to see how it affects restoration quality</li>
              <li>You can visualize the frequency coefficients learned by the model</li>
            </ul>
            
            <p className="mb-4">
              Note that this is a simplified toy implementation to demonstrate the core concepts.
              The full CoSAE model as described in the paper includes a more sophisticated neural 
              network architecture and training process.
            </p>
            
            <p className="text-sm text-gray-600 mt-8">
              Reference: Liu, S., De Mello, S., & Kautz, J. (2024). CosAE: Learnable Fourier Series for Image Restoration. 
              38th Conference on Neural Information Processing Systems (NeurIPS 2024).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoSAEDemo;