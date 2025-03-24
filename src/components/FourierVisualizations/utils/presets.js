/**
 * Predefined signal patterns for Fourier visualization demos
 * Each preset includes:
 * - id: unique identifier
 * - name: display name
 * - description: short explanation
 * - points: array of {x, y} coordinates
 * - preview: optional image URL for preview thumbnail
 */

import { mapRange } from './mathUtils';

/**
 * Generate a sine wave with specified parameters
 * 
 * @param {Number} amplitude - Wave amplitude
 * @param {Number} frequency - Wave frequency
 * @param {Number} phase - Phase shift (radians)
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} points
 */
const generateSineWave = (
  amplitude = 50,
  frequency = 1,
  phase = 0,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    const normalizedX = (i / (points - 1)) * Math.PI * 2;
    const y = centerY - amplitude * Math.sin(normalizedX * frequency + phase);
    
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a square wave with specified parameters
 * 
 * @param {Number} amplitude - Wave amplitude
 * @param {Number} frequency - Wave frequency
 * @param {Number} dutyCycle - Duty cycle (0-1)
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} points
 */
const generateSquareWave = (
  amplitude = 50,
  frequency = 1,
  dutyCycle = 0.5,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    const normalizedX = (i / (points - 1)) * frequency;
    const cyclePosition = normalizedX % 1;
    const y = centerY - amplitude * (cyclePosition < dutyCycle ? 1 : -1);
    
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a triangle wave with specified parameters
 * 
 * @param {Number} amplitude - Wave amplitude
 * @param {Number} frequency - Wave frequency
 * @param {Number} phase - Phase shift (0-1)
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} points
 */
const generateTriangleWave = (
  amplitude = 50,
  frequency = 1,
  phase = 0,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    let normalizedX = ((i / (points - 1)) * frequency + phase) % 1;
    
    // Triangle pattern: 0 to 1 to 0
    let triangleValue;
    if (normalizedX < 0.5) {
      triangleValue = normalizedX * 2; // Rising edge (0 to 1)
    } else {
      triangleValue = 1 - (normalizedX - 0.5) * 2; // Falling edge (1 to 0)
    }
    
    // Map from 0-1 to -1 to 1
    triangleValue = triangleValue * 2 - 1;
    
    const y = centerY - amplitude * triangleValue;
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a sawtooth wave with specified parameters
 * 
 * @param {Number} amplitude - Wave amplitude
 * @param {Number} frequency - Wave frequency
 * @param {Number} rising - Whether the sawtooth is rising (true) or falling (false)
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} points
 */
const generateSawtoothWave = (
  amplitude = 50,
  frequency = 1,
  rising = true,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    let normalizedX = (i / (points - 1)) * frequency % 1;
    
    // Sawtooth pattern: either 0 to 1 (rising) or 1 to 0 (falling)
    let sawtoothValue = rising ? normalizedX : 1 - normalizedX;
    
    // Map from 0-1 to -1 to 1
    sawtoothValue = sawtoothValue * 2 - 1;
    
    const y = centerY - amplitude * sawtoothValue;
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a pulse wave with specified parameters
 * 
 * @param {Number} amplitude - Wave amplitude
 * @param {Number} frequency - Wave frequency
 * @param {Number} pulseWidth - Width of each pulse (0-1)
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} points
 */
const generatePulseWave = (
  amplitude = 50,
  frequency = 1,
  pulseWidth = 0.2,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    const normalizedX = (i / (points - 1)) * frequency;
    const cyclePosition = normalizedX % 1;
    
    // Pulse is at start of each cycle
    const value = cyclePosition < pulseWidth ? 1 : -0.2;
    
    const y = centerY - amplitude * value;
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a circle shape
 * 
 * @param {Number} radius - Circle radius
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} points
 */
const generateCircle = (
  radius = 80,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a square shape
 * 
 * @param {Number} size - Square size
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} points
 */
const generateSquare = (
  size = 100,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const halfSize = size / 2;
  
  // Calculate how many points to put on each side
  const pointsPerSide = Math.ceil(points / 4);
  
  // Top side (left to right)
  for (let i = 0; i < pointsPerSide; i++) {
    const ratio = i / (pointsPerSide - 1);
    const x = centerX - halfSize + size * ratio;
    const y = centerY - halfSize;
    result.push({ x, y });
  }
  
  // Right side (top to bottom)
  for (let i = 0; i < pointsPerSide; i++) {
    const ratio = i / (pointsPerSide - 1);
    const x = centerX + halfSize;
    const y = centerY - halfSize + size * ratio;
    result.push({ x, y });
  }
  
  // Bottom side (right to left)
  for (let i = 0; i < pointsPerSide; i++) {
    const ratio = i / (pointsPerSide - 1);
    const x = centerX + halfSize - size * ratio;
    const y = centerY + halfSize;
    result.push({ x, y });
  }
  
  // Left side (bottom to top)
  for (let i = 0; i < pointsPerSide; i++) {
    const ratio = i / (pointsPerSide - 1);
    const x = centerX - halfSize;
    const y = centerY + halfSize - size * ratio;
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a star shape
 * 
 * @param {Number} outerRadius - Outer radius of the star
 * @param {Number} innerRadius - Inner radius of the star
 * @param {Number} points - Number of points on the star
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} coordinates
 */
const generateStar = (
  outerRadius = 80,
  innerRadius = 40,
  numPoints = 5,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  // We need 2 points per tip of the star
  const totalPoints = numPoints * 2;
  
  for (let i = 0; i < totalPoints; i++) {
    // Alternate between outer and inner radius
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / totalPoints) * Math.PI * 2;
    
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    result.push({ x, y });
  }
  
  // Close the shape by adding the first point again
  if (result.length > 0) {
    result.push({ ...result[0] });
  }
  
  return result;
};

/**
 * Generate a spiral shape
 * 
 * @param {Number} startRadius - Starting radius of the spiral
 * @param {Number} endRadius - Ending radius of the spiral
 * @param {Number} turns - Number of complete turns in the spiral
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} coordinates
 */
const generateSpiral = (
  startRadius = 10,
  endRadius = 80,
  turns = 3,
  points = 200,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const t = (i / (points - 1));
    const radius = startRadius + (endRadius - startRadius) * t;
    const angle = t * turns * Math.PI * 2;
    
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    result.push({ x, y });
  }
  
  return result;
};

/**
 * Generate a heart shape
 * 
 * @param {Number} size - Size of the heart
 * @param {Number} points - Number of points to generate
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @returns {Array} Array of {x, y} coordinates
 */
const generateHeart = (
  size = 80,
  points = 100,
  width = 300,
  height = 300
) => {
  const result = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < points; i++) {
    const t = (i / (points - 1)) * Math.PI * 2;
    
    // Heart curve parametric equation
    const x = centerX + size * 16 * Math.pow(Math.sin(t), 3);
    const y = centerY - size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    
    result.push({ x, y });
  }
  
  return result;
};

// Default canvas dimensions for presets
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 300;
const DEFAULT_POINTS = 200;

// Collection of preset signals
export const presets = [
  {
    id: 'sine',
    name: 'Sine Wave',
    description: 'The fundamental wave form in Fourier analysis',
    points: generateSineWave(50, 2, 0, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'square',
    name: 'Square Wave',
    description: 'Contains only odd harmonics with amplitudes that fall off as 1/n',
    points: generateSquareWave(50, 2, 0.5, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'triangle',
    name: 'Triangle Wave',
    description: 'Contains odd harmonics with amplitudes falling off as 1/n²',
    points: generateTriangleWave(50, 2, 0, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'sawtooth',
    name: 'Sawtooth Wave',
    description: 'Contains all harmonics with amplitudes falling off as 1/n',
    points: generateSawtoothWave(50, 2, true, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'pulse',
    name: 'Pulse Train',
    description: 'Series of short pulses with rich harmonic content',
    points: generatePulseWave(50, 3, 0.1, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'double-sine',
    name: 'Double Frequency',
    description: 'A combination of two sine waves with different frequencies',
    points: generateSineWave(30, 1, 0, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT).map((p, i) => {
      // Add a second sine wave with triple the frequency
      const secondSine = Math.sin((i / (DEFAULT_POINTS - 1)) * Math.PI * 2 * 3) * 20;
      return { x: p.x, y: p.y + secondSine };
    })
  },
  {
    id: 'circle',
    name: 'Circle',
    description: 'Perfect circle requiring only one frequency in complex Fourier series',
    points: generateCircle(80, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'square-shape',
    name: 'Square Shape',
    description: 'Geometric shape requiring many frequencies for sharp corners',
    points: generateSquare(120, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'star',
    name: 'Star',
    description: 'Five-pointed star with sharp cusps requiring high frequency components',
    points: generateStar(80, 40, 5, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'spiral',
    name: 'Spiral',
    description: 'Logarithmic spiral with continuously changing curvature',
    points: generateSpiral(10, 80, 3, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'heart',
    name: 'Heart Shape',
    description: 'Parametric heart curve with interesting Fourier decomposition',
    points: generateHeart(8, DEFAULT_POINTS, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  },
  {
    id: 'am-wave',
    name: 'Amplitude Modulation',
    description: 'Carrier wave with amplitude modulated by a slower wave',
    points: (() => {
      // Generate AM wave: carrier * modulator
      const result = [];
      const centerY = DEFAULT_HEIGHT / 2;
      
      for (let i = 0; i < DEFAULT_POINTS; i++) {
        const x = (i / (DEFAULT_POINTS - 1)) * DEFAULT_WIDTH;
        const t = (i / (DEFAULT_POINTS - 1)) * Math.PI * 2;
        
        // Carrier frequency is 8x the modulator
        const carrier = Math.sin(t * 8);
        const modulator = 0.5 + 0.5 * Math.sin(t);
        
        const y = centerY - 50 * carrier * modulator;
        result.push({ x, y });
      }
      
      return result;
    })()
  }
];

// Export the generation functions for custom uses
export const generators = {
  generateSineWave,
  generateSquareWave,
  generateTriangleWave,
  generateSawtoothWave,
  generatePulseWave,
  generateCircle,
  generateSquare,
  generateStar,
  generateSpiral,
  generateHeart
};

export default presets;
