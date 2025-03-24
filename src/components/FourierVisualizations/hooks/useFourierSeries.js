import { useState, useEffect } from 'react';
import { calculateFourierCoefficients, signalFromFourierSeries } from '../utils/mathUtils';

/**
 * Custom hook for calculating Fourier series coefficients and approximations
 * 
 * @param {Array} points - Array of {x, y} points representing the signal
 * @param {Number} numTerms - Number of terms to include in the series
 * @returns {Object} Coefficients and approximated signal
 */
export const useFourierSeries = (points, numTerms = 10) => {
  // State for Fourier coefficients
  const [coefficients, setCoefficients] = useState([]);
  // State for approximated signal
  const [approximation, setApproximation] = useState([]);
  
  // Calculate Fourier coefficients when points or numTerms change
  useEffect(() => {
    if (!points || points.length < 2) {
      setCoefficients([]);
      setApproximation([]);
      return;
    }
    
    // Calculate Fourier coefficients
    const coefs = calculateFourierCoefficients(points, numTerms);
    setCoefficients(coefs);
    
    // Generate approximated signal using the coefficients
    const approxPoints = signalFromFourierSeries(coefs, points.length);
    setApproximation(approxPoints);
    
  }, [points, numTerms]);
  
  return {
    coefficients,
    approximation,
  };
};
