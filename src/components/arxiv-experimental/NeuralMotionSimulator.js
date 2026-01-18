/**
 * Neural Motion Simulator
 * Simulates what a trained neural network would do:
 * Maps high-level style inputs (mood, energy) to physics parameters
 *
 * In production, this would be replaced with ONNX.js running trained models
 */

export class NeuralMotionSimulator {
  constructor() {
    this.isReady = true; // Simulate async model loading
  }

  /**
   * Maps mood and energy to physics parameters
   * This simulates what a trained neural network would learn
   *
   * @param {Object} styleInput - { mood, energy, targetX, targetY }
   * @returns {Object} Physics parameters for spring-mass-damper system
   */
  getPhysicsParameters(styleInput) {
    const { mood = 0.5, energy = 0.5 } = styleInput;

    // Mood affects how the motion "feels":
    // Low mood (0.0): Slow, smooth, molasses-like
    // Mid mood (0.5): Natural, responsive
    // High mood (1.0): Jittery, overshooting, energetic

    // Energy affects overall activity level:
    // Low energy (0.0): Heavy, damped
    // High energy (1.0): Light, bouncy

    // Spring stiffness: Higher mood = higher stiffness (faster response)
    // Range: [20, 400]
    const springK = this.mapRange(mood, 0, 1, 20, 400);

    // Damping: Lower mood = higher damping (smoother)
    // Range: [5, 80]
    const damping = this.mapRange(mood, 0, 1, 80, 5);

    // Mass: Lower energy = higher mass (heavier, slower)
    // Range: [0.5, 5]
    const mass = this.mapRange(energy, 0, 1, 5, 0.5);

    // Overshoot: Higher mood = more overshoot
    // This is a visual parameter, not directly used in physics
    const overshoot = this.mapRange(mood, 0, 1, 0, 0.4);

    // Add some non-linearity for more interesting behavior
    // At extreme moods, behavior becomes more exaggerated
    const moodIntensity = Math.abs(mood - 0.5) * 2; // 0 at center, 1 at extremes
    const energyIntensity = Math.abs(energy - 0.5) * 2;

    // Apply non-linear transformations
    const adjustedSpringK = springK * (1 + moodIntensity * 0.5);
    const adjustedDamping = damping * (1 - moodIntensity * 0.3);
    const adjustedMass = mass * (1 + energyIntensity * 0.2);

    // Clamp to safe ranges (physics stability)
    const params = {
      springK: this.clamp(adjustedSpringK, 10, 500),
      damping: this.clamp(adjustedDamping, 1, 100),
      mass: this.clamp(adjustedMass, 0.1, 10),
      overshoot: this.clamp(overshoot, 0, 0.5)
    };

    return params;
  }

  /**
   * Linear interpolation between two values
   */
  mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  /**
   * Clamp value between min and max
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get style features from existing motion (inverse problem)
   * This would be used for training in the full system
   */
  extractStyleFromMotion(motionData) {
    // Calculate features from motion trajectory
    const { positions, target } = motionData;

    // Feature 1: Response speed
    let time_to_90_percent = 0;
    for (let i = 0; i < positions.length; i++) {
      const dist = Math.hypot(
        positions[i].x - target.x,
        positions[i].y - target.y
      );
      const initialDist = Math.hypot(
        positions[0].x - target.x,
        positions[0].y - target.y
      );
      if (dist < initialDist * 0.1) {
        time_to_90_percent = i;
        break;
      }
    }
    const responseSpeed = 1.0 - time_to_90_percent / positions.length;

    // Feature 2: Overshoot detection
    // ... (simplified for now)

    return {
      mood: responseSpeed,
      energy: 0.5 // Placeholder
    };
  }

  /**
   * Simulate model loading delay
   */
  async initialize() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isReady = true;
        resolve(true);
      }, 100);
    });
  }
}

/**
 * Creates physics parameters with smooth interpolation
 * Useful for transitioning between different mood/energy states
 */
export function interpolateParams(params1, params2, alpha) {
  return {
    springK: params1.springK * (1 - alpha) + params2.springK * alpha,
    damping: params1.damping * (1 - alpha) + params2.damping * alpha,
    mass: params1.mass * (1 - alpha) + params2.mass * alpha,
    overshoot: params1.overshoot * (1 - alpha) + params2.overshoot * alpha
  };
}
