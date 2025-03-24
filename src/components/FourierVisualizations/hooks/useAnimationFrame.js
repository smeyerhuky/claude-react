import { useRef, useEffect } from 'react';

/**
 * Custom hook for managing animation frame loops
 * 
 * @param {Function} callback - Function to call on each animation frame
 * @param {Boolean} isActive - Whether the animation should be running
 */
export const useAnimationFrame = (callback, isActive = true) => {
  // Reference to store the RAF ID for cleanup
  const requestRef = useRef();
  // Reference to store the previous timestamp
  const previousTimeRef = useRef();
  
  // Animation loop
  useEffect(() => {
    if (!isActive) return;
    
    const animate = (time) => {
      // Initialize previousTimeRef on first call
      if (previousTimeRef.current === undefined) {
        previousTimeRef.current = time;
      }
      
      // Calculate delta time
      const deltaTime = time - previousTimeRef.current;
      
      // Call callback with delta time
      callback(deltaTime);
      
      // Update previous time
      previousTimeRef.current = time;
      
      // Schedule next frame
      requestRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      // Reset timestamp on cleanup
      previousTimeRef.current = undefined;
    };
  }, [callback, isActive]);
};
