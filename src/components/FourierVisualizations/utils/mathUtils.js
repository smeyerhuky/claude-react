import * as math from 'mathjs';

/**
 * Calculate Fourier series coefficients for a set of points
 * 
 * @param {Array} points - Array of {x, y} points
 * @param {Number} numTerms - Number of terms to calculate
 * @returns {Array} Array of coefficient objects
 */
export const calculateFourierCoefficients = (points, numTerms) => {
  if (!points || points.length < 2) return [];
  
  // Number of points
  const N = points.length;
  
  // Convert points to complex numbers
  const complexPoints = points.map(point => 
    math.complex(point.x, point.y)
  );
  
  // Calculate coefficients
  const coefficients = [];
  
  // Calculate coefficients for different frequencies
  for (let k = -numTerms/2; k <= numTerms/2; k++) {
    let sum = math.complex(0, 0);
    
    for (let n = 0; n < N; n++) {
      // e^(-i2πkn/N)
      const angle = -2 * Math.PI * k * n / N;
      const term = math.multiply(
        complexPoints[n],
        math.complex(Math.cos(angle), Math.sin(angle))
      );
      
      sum = math.add(sum, term);
    }
    
    // Normalize
    sum = math.divide(sum, N);
    
    coefficients.push({
      frequency: k,
      amplitude: math.abs(sum),
      phase: math.arg(sum),
      real: sum.re,
      imaginary: sum.im
    });
  }
  
  // Sort by amplitude (highest first)
  return coefficients.sort((a, b) => b.amplitude - a.amplitude);
};

/**
 * Generate signal points from Fourier series coefficients
 * 
 * @param {Array} coefficients - Array of Fourier coefficients
 * @param {Number} numPoints - Number of points to generate
 * @returns {Array} Array of {x, y} points
 */
export const signalFromFourierSeries = (coefficients, numPoints) => {
  if (!coefficients || coefficients.length === 0 || numPoints <= 0) return [];
  
  const points = [];
  
  // Generate points at evenly spaced intervals
  for (let i = 0; i < numPoints; i++) {
    const t = (2 * Math.PI * i) / numPoints;
    
    // Start with zero
    let x = 0;
    let y = 0;
    
    // Add contribution from each frequency
    for (const coef of coefficients) {
      const { frequency, amplitude, phase } = coef;
      const angle = frequency * t + phase;
      
      x += amplitude * Math.cos(angle);
      y += amplitude * Math.sin(angle);
    }
    
    points.push({ x, y });
  }
  
  return points;
};

/**
 * Calculate Discrete Fourier Transform (DFT) for a 1D signal
 * 
 * @param {Array} signal - Array of values representing the signal
 * @returns {Array} Array of frequency components
 */
export const calculateDiscreteFourierTransform = (signal) => {
  const N = signal.length;
  const result = [];
  
  // For each frequency
  for (let k = 0; k < N; k++) {
    let real = 0;
    let imag = 0;
    
    // Calculate DFT
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      real += signal[n] * Math.cos(angle);
      imag += signal[n] * Math.sin(angle);
    }
    
    // Normalize
    real /= N;
    imag /= N;
    
    // Calculate magnitude and phase
    const magnitude = Math.sqrt(real * real + imag * imag);
    const phase = Math.atan2(imag, real);
    
    result.push({
      frequency: k,
      real,
      imaginary: imag,
      magnitude,
      phase
    });
  }
  
  return result;
};

/**
 * Calculate Inverse Fourier Transform to convert frequency data back to a signal
 * 
 * @param {Array} frequencyData - Array of frequency components
 * @param {Number} numPoints - Number of points to generate
 * @returns {Array} Reconstructed signal values
 */
export const calculateInverseFourierTransform = (frequencyData, numPoints) => {
  const N = numPoints;
  const result = new Array(N).fill(0);
  
  // For each time point
  for (let n = 0; n < N; n++) {
    let sum = 0;
    
    // Sum contribution from each frequency
    for (let k = 0; k < frequencyData.length; k++) {
      const { real, imaginary } = frequencyData[k];
      const angle = 2 * Math.PI * k * n / N;
      
      sum += real * Math.cos(angle) - imaginary * Math.sin(angle);
    }
    
    result[n] = sum;
  }
  
  return result;
};

/**
 * Linear interpolation between two values
 * 
 * @param {Number} a - First value
 * @param {Number} b - Second value
 * @param {Number} t - Interpolation parameter (0-1)
 * @returns {Number} Interpolated value
 */
export const lerp = (a, b, t) => {
  return a + (b - a) * t;
};

/**
 * Map a value from one range to another
 * 
 * @param {Number} value - Value to map
 * @param {Number} inMin - Input range minimum
 * @param {Number} inMax - Input range maximum
 * @param {Number} outMin - Output range minimum
 * @param {Number} outMax - Output range maximum
 * @returns {Number} Mapped value
 */
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
};
