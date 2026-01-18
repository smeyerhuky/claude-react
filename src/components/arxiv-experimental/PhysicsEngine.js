/**
 * Physics Engine for Neural Procedural Animation
 * Implements spring-mass-damper systems and FABRIK IK
 */

export class PhysicsEngine {
  constructor() {
    this.dt = 1 / 60; // 60 fps timestep
  }

  /**
   * Simulate spring-mass-damper system
   * Returns new state after one timestep
   */
  simulateSpring(state, target, params) {
    const { springK, damping, mass } = params;

    // Current position and velocity
    const { x, y, vx, vy } = state;

    // Spring force: F = -k * displacement
    const dx = x - target.x;
    const dy = y - target.y;
    const fx = -springK * dx;
    const fy = -springK * dy;

    // Damping force: F = -damping * velocity
    const fdx = -damping * vx;
    const fdy = -damping * vy;

    // Acceleration: a = F / m
    const ax = (fx + fdx) / mass;
    const ay = (fy + fdy) / mass;

    // Integrate velocity and position (semi-implicit Euler)
    const new_vx = vx + ax * this.dt;
    const new_vy = vy + ay * this.dt;
    const new_x = x + new_vx * this.dt;
    const new_y = y + new_vy * this.dt;

    return {
      x: new_x,
      y: new_y,
      vx: new_vx,
      vy: new_vy
    };
  }

  /**
   * FABRIK Inverse Kinematics
   * For tentacle/limb animation (future use cases)
   */
  solveFABRIK(chain, target, tolerance = 0.01, maxIterations = 10) {
    const n = chain.length;
    const distances = [];

    // Store original segment lengths
    for (let i = 0; i < n - 1; i++) {
      const dx = chain[i + 1].x - chain[i].x;
      const dy = chain[i + 1].y - chain[i].y;
      distances[i] = Math.sqrt(dx * dx + dy * dy);
    }

    // Check if target is reachable
    const totalLength = distances.reduce((a, b) => a + b, 0);
    const baseToTarget = Math.hypot(
      target.x - chain[0].x,
      target.y - chain[0].y
    );

    if (baseToTarget > totalLength) {
      // Target unreachable - stretch toward it
      this.stretchChain(chain, target, distances);
      return chain;
    }

    // FABRIK algorithm
    const base = { ...chain[0] };
    let iteration = 0;
    let error = Infinity;

    while (error > tolerance && iteration < maxIterations) {
      // Forward reaching
      chain[n - 1] = { ...target };
      for (let i = n - 2; i >= 0; i--) {
        const dir = this.normalize({
          x: chain[i].x - chain[i + 1].x,
          y: chain[i].y - chain[i + 1].y
        });
        chain[i] = {
          x: chain[i + 1].x + dir.x * distances[i],
          y: chain[i + 1].y + dir.y * distances[i]
        };
      }

      // Backward reaching
      chain[0] = { ...base };
      for (let i = 0; i < n - 1; i++) {
        const dir = this.normalize({
          x: chain[i + 1].x - chain[i].x,
          y: chain[i + 1].y - chain[i].y
        });
        chain[i + 1] = {
          x: chain[i].x + dir.x * distances[i],
          y: chain[i].y + dir.y * distances[i]
        };
      }

      // Check convergence
      error = Math.hypot(
        chain[n - 1].x - target.x,
        chain[n - 1].y - target.y
      );
      iteration++;
    }

    return chain;
  }

  normalize(vec) {
    const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    return len > 0 ? { x: vec.x / len, y: vec.y / len } : { x: 0, y: 0 };
  }

  stretchChain(chain, target, distances) {
    const dir = this.normalize({
      x: target.x - chain[0].x,
      y: target.y - chain[0].y
    });

    for (let i = 1; i < chain.length; i++) {
      chain[i] = {
        x: chain[i - 1].x + dir.x * distances[i - 1],
        y: chain[i - 1].y + dir.y * distances[i - 1]
      };
    }
  }
}

/**
 * Motion Animator
 * Manages a single animated entity with physics parameters
 */
export class MotionAnimator {
  constructor(physicsParams, physicsEngine) {
    this.params = physicsParams;
    this.physics = physicsEngine;
    this.state = {
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: 0,
      vy: 0
    };
    this.target = { x: 400, y: 300 };
  }

  setTarget(x, y) {
    this.target = { x, y };
  }

  updateParams(physicsParams) {
    this.params = physicsParams;
  }

  update() {
    this.state = this.physics.simulateSpring(
      this.state,
      this.target,
      this.params
    );
    return this.state;
  }

  getPosition() {
    return { x: this.state.x, y: this.state.y };
  }

  getVelocity() {
    return { vx: this.state.vx, vy: this.state.vy };
  }
}
