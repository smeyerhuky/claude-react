import { useState, useEffect, useCallback } from 'react';
import { calculateDiscreteFourierTransform, calculateInverseFourierTransform } from '../utils/mathUtils';

/**
 * Custom hook for calculating discrete Fourier transforms and inverse transforms
 * 
 * @param {Array} points - Array of {x, y} points representing the signal
 * @returns {Object} Frequency data and functions for working with the transform
 */
export const useFourierTransform = (points) => {
  // State for frequency domain representation
  const [frequencyData, setFrequencyData] = useState([]);
  
  // Calculate DFT when points change
  useEffect(() => {
    if (!points || points.length < 2) {
      setFrequencyData([]);
      return;
    }
    
    // Extract y-values for the transform
    const yValues = points.map(point => point.y);
    
    // Calculate the discrete Fourier transform
    const freqData = calculateDiscreteFourierTransform(yValues);
    setFrequencyData(freqData);
    
  }, [points]);
  
  /**
   * Apply frequency filters and calculate inverse transform
   * 
   * @param {Number} lowPassCutoff - Cutoff for low-pass filter (0-1)
   * @param {Number} highPassCutoff - Cutoff for high-pass filter (0-1)
   * @returns {Array} Filtered signal points
   */
  const inverseFourierTransform = useCallback((lowPassCutoff = 1.0, highPassCutoff = 0.0) => {
    if (frequencyData.length === 0 || points.length === 0) {
      return [];
    }
    
    // Apply frequency domain filtering
    const filteredFreqData = frequencyData.map((item, index) => {
      const normalizedFreq = index / frequencyData.length;
      
      // Apply low-pass and high-pass filters
      if (normalizedFreq > lowPassCutoff || normalizedFreq < highPassCutoff) {
        // Filter out this frequency component
        return {
          ...item,
          magnitude: 0,
          real: 0,
          imaginary: 0
        };
      }
      
      // Keep this frequency component
      return item;
    });
    
    // Calculate inverse Fourier transform
    const filteredSignal = calculateInverseFourierTransform(filteredFreqData, points.length);
    
    // Create points array with original x values
    return points.map((point, index) => ({
      x: point.x,
      y: filteredSignal[index] || 0
    }));
    
  }, [frequencyData, points]);
  
  return {
    frequencyData,
    inverseFourierTransform
  };
};
