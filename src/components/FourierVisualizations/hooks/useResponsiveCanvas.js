import { useState, useEffect } from 'react';

/**
 * Custom hook for handling responsive canvas with high-DPI display support
 * 
 * @param {React.RefObject} canvasRef - Reference to the canvas element
 * @param {Number} width - Desired width of the canvas
 * @param {Number} height - Desired height of the canvas
 * @returns {Object} Device pixel ratio and scaled dimensions
 */
export const useResponsiveCanvas = (canvasRef, width, height) => {
  // Get device pixel ratio
  const [dpr, setDpr] = useState(() => window.devicePixelRatio || 1);
  
  // Calculate canvas dimensions
  const [dimensions, setDimensions] = useState({
    canvasWidth: width * dpr,
    canvasHeight: height * dpr
  });
  
  // Update dimensions when width, height or dpr changes
  useEffect(() => {
    setDimensions({
      canvasWidth: width * dpr,
      canvasHeight: height * dpr
    });
  }, [width, height, dpr]);
  
  // Update dpr when the window resizes (e.g., if user moves window to a different screen)
  useEffect(() => {
    const handleResize = () => {
      const newDpr = window.devicePixelRatio || 1;
      if (newDpr !== dpr) {
        setDpr(newDpr);
      }
    };
    
    // Add event listener for resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dpr]);
  
  // Apply CSS sizing to the canvas element
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set CSS dimensions
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
  }, [canvasRef, width, height]);
  
  return {
    dpr,
    ...dimensions
  };
};
