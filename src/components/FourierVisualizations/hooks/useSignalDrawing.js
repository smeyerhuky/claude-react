import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling drawing interactions on a canvas
 * 
 * Manages mouse/touch events and coordinates for drawing signals
 * 
 * @param {React.RefObject} canvasRef - Reference to the canvas element
 * @param {Function} setPoints - State setter function for points array
 * @returns {Object} Drawing handlers and state
 */
export const useSignalDrawing = (canvasRef, setPoints) => {
  // Track whether user is currently drawing
  const [isDrawing, setIsDrawing] = useState(false);
  // Buffer for points being drawn in current session
  const [currentPoints, setCurrentPoints] = useState([]);
  
  // Get coordinates relative to canvas
  const getCoordinates = useCallback((event) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale coordinates for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    return {
      x: x * dpr,
      y: y * dpr
    };
  }, [canvasRef]);
  
  // Start drawing
  const startDrawing = useCallback((event) => {
    event.preventDefault();
    
    // Clear any existing points
    setCurrentPoints([]);
    
    // Get coordinates and start drawing
    const coords = getCoordinates(event);
    setCurrentPoints([coords]);
    setIsDrawing(true);
  }, [getCoordinates]);
  
  // Continue drawing
  const continueDrawing = useCallback((event) => {
    if (!isDrawing) return;
    event.preventDefault();
    
    // Get coordinates and add to current points
    const coords = getCoordinates(event);
    setCurrentPoints(prevPoints => [...prevPoints, coords]);
  }, [isDrawing, getCoordinates]);
  
  // End drawing
  const endDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    // Finalize drawing and update points in parent component
    setIsDrawing(false);
    setPoints(currentPoints);
  }, [isDrawing, currentPoints, setPoints]);
  
  // Clear drawing
  const clearDrawing = useCallback(() => {
    setCurrentPoints([]);
    setPoints([]);
  }, [setPoints]);
  
  // Update points in parent component as drawing progresses
  useEffect(() => {
    if (currentPoints.length > 0) {
      setPoints(currentPoints);
    }
  }, [currentPoints, setPoints]);
  
  // Clean up function (e.g., if component unmounts while drawing)
  useEffect(() => {
    return () => {
      if (isDrawing) {
        setIsDrawing(false);
      }
    };
  }, [isDrawing]);
  
  return {
    isDrawing,
    startDrawing,
    continueDrawing,
    endDrawing,
    clearDrawing,
    currentPoints
  };
};
