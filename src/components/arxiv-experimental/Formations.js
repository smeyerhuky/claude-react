/**
 * Preset formations for particle arrangements
 * Each formation defines target positions for particles
 */

export const formations = {
  // Animals
  elephant: {
    name: 'Elephant',
    icon: '🐘',
    category: 'animals',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Body (ellipse)
      const bodyCount = Math.floor(count * 0.4);
      for (let i = 0; i < bodyCount; i++) {
        const angle = (i / bodyCount) * Math.PI * 2;
        const rx = 120;
        const ry = 80;
        positions.push({
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry
        });
      }

      // Head (circle)
      const headCount = Math.floor(count * 0.2);
      for (let i = 0; i < headCount; i++) {
        const angle = (i / headCount) * Math.PI * 2;
        const r = 60;
        positions.push({
          x: cx - 150 + Math.cos(angle) * r,
          y: cy - 40 + Math.sin(angle) * r
        });
      }

      // Trunk (curve)
      const trunkCount = Math.floor(count * 0.15);
      for (let i = 0; i < trunkCount; i++) {
        const t = i / trunkCount;
        const x = cx - 180 + Math.sin(t * Math.PI * 2) * 30;
        const y = cy - 20 + t * 120;
        positions.push({ x, y });
      }

      // Ears (two large circles)
      const earCount = Math.floor(count * 0.15);
      for (let i = 0; i < earCount; i++) {
        const angle = (i / earCount) * Math.PI * 2;
        const r = 50;
        // Left ear
        positions.push({
          x: cx - 140 + Math.cos(angle) * r,
          y: cy - 80 + Math.sin(angle) * r
        });
        // Right ear
        if (positions.length < count) {
          positions.push({
            x: cx - 140 + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r
          });
        }
      }

      // Legs
      const legCount = Math.floor(count * 0.1);
      for (let i = 0; i < legCount && positions.length < count; i++) {
        const legX = [-80, -40, 40, 80];
        const legIdx = i % 4;
        positions.push({
          x: cx + legX[legIdx],
          y: cy + 80 + (i / legCount) * 60
        });
      }

      return positions;
    }
  },

  butterfly: {
    name: 'Butterfly',
    icon: '🦋',
    category: 'animals',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Wings (heart shapes)
      const wingCount = Math.floor(count * 0.8);
      for (let i = 0; i < wingCount; i++) {
        const t = (i / wingCount) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);

        // Left wing
        positions.push({
          x: cx - 60 - x * 5,
          y: cy - y * 5
        });

        // Right wing
        if (positions.length < count) {
          positions.push({
            x: cx + 60 + x * 5,
            y: cy - y * 5
          });
        }
      }

      // Body
      const bodyCount = count - positions.length;
      for (let i = 0; i < bodyCount; i++) {
        positions.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy - 60 + i * 3
        });
      }

      return positions;
    }
  },

  fish: {
    name: 'Fish',
    icon: '🐟',
    category: 'animals',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Body (fish shape)
      const bodyCount = Math.floor(count * 0.6);
      for (let i = 0; i < bodyCount; i++) {
        const t = (i / bodyCount) * Math.PI * 2;
        const r = 60 + 30 * Math.abs(Math.sin(t));
        positions.push({
          x: cx + Math.cos(t) * r,
          y: cy + Math.sin(t) * r * 0.6
        });
      }

      // Tail
      const tailCount = Math.floor(count * 0.3);
      for (let i = 0; i < tailCount; i++) {
        const t = (i / tailCount - 0.5) * Math.PI;
        positions.push({
          x: cx + 90 + i * 2,
          y: cy + Math.sin(t) * 50
        });
      }

      // Fins
      const finCount = count - positions.length;
      for (let i = 0; i < finCount; i++) {
        const angle = -Math.PI / 3 + (i / finCount) * Math.PI / 3;
        positions.push({
          x: cx - 30 + Math.cos(angle) * 40,
          y: cy - 40 + Math.sin(angle) * 40
        });
      }

      return positions;
    }
  },

  // Objects & Technology
  rocket: {
    name: 'Rocket',
    icon: '🚀',
    category: 'objects',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Nose cone
      const noseCount = Math.floor(count * 0.15);
      for (let i = 0; i < noseCount; i++) {
        const t = i / noseCount;
        const r = (1 - t) * 30;
        const angle = (Math.random() - 0.5) * Math.PI;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy - 150 - t * 40
        });
      }

      // Body
      const bodyCount = Math.floor(count * 0.4);
      for (let i = 0; i < bodyCount; i++) {
        const y = -150 + (i / bodyCount) * 200;
        const r = 30 + Math.abs(Math.sin((i / bodyCount) * Math.PI)) * 10;
        const angle = (i / bodyCount) * Math.PI * 2;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + y
        });
      }

      // Fins
      const finCount = Math.floor(count * 0.15);
      for (let i = 0; i < finCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const t = (i / finCount) * 0.5;
        positions.push({
          x: cx + side * (50 + t * 30),
          y: cy + 30 + t * 40
        });
      }

      // Exhaust flame
      const flameCount = count - positions.length;
      for (let i = 0; i < flameCount; i++) {
        const t = i / flameCount;
        const spread = t * 60;
        positions.push({
          x: cx + (Math.random() - 0.5) * spread,
          y: cy + 70 + t * 80
        });
      }

      return positions;
    }
  },

  warpDrive: {
    name: 'Warp Drive',
    icon: '⚡',
    category: 'objects',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Rotating rings
      const ringCount = 5;
      const particlesPerRing = Math.floor(count / ringCount);

      for (let ring = 0; ring < ringCount; ring++) {
        const radius = 60 + ring * 30;
        const rotation = time * (1 + ring * 0.5) + ring * Math.PI / 3;

        for (let i = 0; i < particlesPerRing && positions.length < count; i++) {
          const angle = (i / particlesPerRing) * Math.PI * 2 + rotation;
          const wobble = Math.sin(time * 3 + ring) * 10;
          positions.push({
            x: cx + Math.cos(angle) * (radius + wobble),
            y: cy + Math.sin(angle) * (radius + wobble) * 0.5
          });
        }
      }

      // Core energy
      const coreCount = count - positions.length;
      for (let i = 0; i < coreCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 40;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r * 0.5
        });
      }

      return positions;
    }
  },

  dna: {
    name: 'DNA Helix',
    icon: '🧬',
    category: 'objects',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2 - 100;
      const positions = [];

      const helixCount = count;
      for (let i = 0; i < helixCount; i++) {
        const t = (i / helixCount) * Math.PI * 4 + time;
        const y = (i / helixCount) * 400 - 200;

        // Strand 1
        positions.push({
          x: cx + Math.cos(t) * 60,
          y: cy + y
        });

        // Strand 2 (opposite phase)
        if (positions.length < count) {
          positions.push({
            x: cx + Math.cos(t + Math.PI) * 60,
            y: cy + y
          });
        }
      }

      return positions;
    }
  },

  // Geometric patterns
  heart: {
    name: 'Heart',
    icon: '❤️',
    category: 'shapes',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);

        positions.push({
          x: cx + x * 8,
          y: cy - y * 8
        });
      }

      return positions;
    }
  },

  star: {
    name: 'Star',
    icon: '⭐',
    category: 'shapes',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      const points = 5;
      const outerRadius = 100;
      const innerRadius = 40;

      for (let i = 0; i < count; i++) {
        const t = (i / count) * points * 2;
        const angle = (t * Math.PI) - Math.PI / 2;
        const radius = t % 2 < 1 ? outerRadius : innerRadius;

        positions.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      }

      return positions;
    }
  },

  galaxy: {
    name: 'Galaxy',
    icon: '🌌',
    category: 'shapes',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      for (let i = 0; i < count; i++) {
        const arm = i % 3;
        const t = (i / count) * 10;
        const angle = arm * (Math.PI * 2 / 3) + t + time * 0.5;
        const radius = t * 30;

        positions.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      }

      return positions;
    }
  },

  // Text patterns
  wave: {
    name: 'Wave',
    icon: '〰️',
    category: 'patterns',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const positions = [];

      for (let i = 0; i < count; i++) {
        const x = (i / count) * width;
        const y = height / 2 + Math.sin((i / count) * Math.PI * 4 + time * 2) * 100;

        positions.push({ x, y });
      }

      return positions;
    }
  },

  vortex: {
    name: 'Vortex',
    icon: '🌀',
    category: 'patterns',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 6;
        const r = (i / count) * 150;
        const angle = t + time * 2;

        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      return positions;
    }
  },

  grid: {
    name: 'Grid',
    icon: '▦',
    category: 'patterns',
    generate: (count, width, height) => {
      const positions = [];
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const spacing = Math.min(width / (cols + 1), height / (rows + 1));

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        positions.push({
          x: (col + 1) * spacing + (width - cols * spacing) / 2,
          y: (row + 1) * spacing + (height - rows * spacing) / 2
        });
      }

      return positions;
    }
  },

  // Fun animations
  explosion: {
    name: 'Explosion',
    icon: '💥',
    category: 'animations',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = 0.5 + Math.random() * 0.5;
        const r = time * 100 * speed;

        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      return positions;
    }
  },

  fireworks: {
    name: 'Fireworks',
    icon: '🎆',
    category: 'animations',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const positions = [];
      const burstCount = 3;
      const particlesPerBurst = Math.floor(count / burstCount);

      for (let b = 0; b < burstCount; b++) {
        const cx = width * (0.3 + b * 0.2);
        const cy = height * 0.3;
        const phase = (time + b * 2) % 4;

        for (let i = 0; i < particlesPerBurst && positions.length < count; i++) {
          const angle = (i / particlesPerBurst) * Math.PI * 2;
          const r = phase * 80;

          positions.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r - phase * 50
          });
        }
      }

      return positions;
    }
  },

  orbit: {
    name: 'Planetary Orbit',
    icon: '🪐',
    category: 'animations',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Sun/center
      const coreCount = Math.floor(count * 0.1);
      for (let i = 0; i < coreCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 30;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      // Orbiting planets
      const planets = 4;
      const particlesPerPlanet = Math.floor((count - coreCount) / planets);

      for (let p = 0; p < planets; p++) {
        const orbitRadius = 80 + p * 50;
        const orbitSpeed = 1 - p * 0.2;
        const angle = time * orbitSpeed + p * Math.PI / 2;

        const planetX = cx + Math.cos(angle) * orbitRadius;
        const planetY = cy + Math.sin(angle) * orbitRadius;

        for (let i = 0; i < particlesPerPlanet && positions.length < count; i++) {
          const a = (i / particlesPerPlanet) * Math.PI * 2;
          const r = 10 + p * 3;
          positions.push({
            x: planetX + Math.cos(a) * r,
            y: planetY + Math.sin(a) * r
          });
        }
      }

      return positions;
    }
  },

  // More Animals
  tree: {
    name: 'Tree',
    icon: '🌳',
    category: 'nature',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Trunk
      const trunkCount = Math.floor(count * 0.2);
      for (let i = 0; i < trunkCount; i++) {
        const y = 20 + (i / trunkCount) * 150;
        const wobble = Math.sin(i * 0.3) * 5;
        positions.push({
          x: cx + wobble,
          y: cy + y
        });
      }

      // Branches and leaves (fractal-like)
      const foliageCount = count - trunkCount;
      for (let i = 0; i < foliageCount; i++) {
        const angle = (i / foliageCount) * Math.PI * 4;
        const t = i / foliageCount;
        const r = 60 + t * 80;
        const spread = Math.sin(t * Math.PI) * 100;

        positions.push({
          x: cx + Math.cos(angle) * spread,
          y: cy - 50 - t * 120 + Math.sin(angle * 3) * 30
        });
      }

      return positions;
    }
  },

  flower: {
    name: 'Flower',
    icon: '🌸',
    category: 'nature',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Center
      const centerCount = Math.floor(count * 0.15);
      for (let i = 0; i < centerCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 20;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      // Petals (5 petals)
      const petalCount = Math.floor((count - centerCount) * 0.7);
      const petals = 5;
      for (let i = 0; i < petalCount; i++) {
        const petalIdx = Math.floor((i / petalCount) * petals);
        const t = (i % Math.ceil(petalCount / petals)) / Math.ceil(petalCount / petals);
        const angle = (petalIdx / petals) * Math.PI * 2;

        // Petal shape using parametric curve
        const petalR = 30 + t * 50;
        const petalAngle = angle + (t - 0.5) * 0.8;

        positions.push({
          x: cx + Math.cos(petalAngle) * petalR,
          y: cy + Math.sin(petalAngle) * petalR
        });
      }

      // Stem
      const stemCount = count - positions.length;
      for (let i = 0; i < stemCount; i++) {
        positions.push({
          x: cx + Math.sin(i * 0.1) * 5,
          y: cy + 30 + i * 2
        });
      }

      return positions;
    }
  },

  cat: {
    name: 'Cat',
    icon: '🐱',
    category: 'animals',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Head (circle)
      const headCount = Math.floor(count * 0.3);
      for (let i = 0; i < headCount; i++) {
        const angle = (i / headCount) * Math.PI * 2;
        const r = 50;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy - 50 + Math.sin(angle) * r
        });
      }

      // Ears (triangles)
      const earCount = Math.floor(count * 0.1);
      for (let i = 0; i < earCount; i++) {
        const side = i < earCount / 2 ? -1 : 1;
        const t = (i % Math.ceil(earCount / 2)) / Math.ceil(earCount / 2);
        positions.push({
          x: cx + side * (30 + t * 20),
          y: cy - 100 - t * 40
        });
      }

      // Body (oval)
      const bodyCount = Math.floor(count * 0.35);
      for (let i = 0; i < bodyCount; i++) {
        const angle = (i / bodyCount) * Math.PI * 2;
        const rx = 60;
        const ry = 40;
        positions.push({
          x: cx + Math.cos(angle) * rx,
          y: cy + 30 + Math.sin(angle) * ry
        });
      }

      // Tail (curve)
      const tailCount = count - positions.length;
      for (let i = 0; i < tailCount; i++) {
        const t = i / tailCount;
        positions.push({
          x: cx + 60 + t * 50,
          y: cy + 30 + Math.sin(t * Math.PI * 2) * 40
        });
      }

      return positions;
    }
  },

  // More Tech & Sci-Fi
  ufo: {
    name: 'UFO',
    icon: '🛸',
    category: 'objects',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Dome (top half of ellipse)
      const domeCount = Math.floor(count * 0.2);
      for (let i = 0; i < domeCount; i++) {
        const angle = Math.PI + (i / domeCount) * Math.PI;
        const rx = 60;
        const ry = 30;
        positions.push({
          x: cx + Math.cos(angle) * rx,
          y: cy - 40 + Math.sin(angle) * ry
        });
      }

      // Base/saucer (ellipse)
      const baseCount = Math.floor(count * 0.4);
      for (let i = 0; i < baseCount; i++) {
        const angle = (i / baseCount) * Math.PI * 2;
        const rx = 80;
        const ry = 20;
        positions.push({
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry
        });
      }

      // Lights around the rim (animated)
      const lightCount = Math.floor(count * 0.2);
      for (let i = 0; i < lightCount; i++) {
        const angle = (i / lightCount) * Math.PI * 2 + time * 2;
        const r = 75;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * 15
        });
      }

      // Beam (tractor beam effect)
      const beamCount = count - positions.length;
      for (let i = 0; i < beamCount; i++) {
        const t = i / beamCount;
        const spread = t * 100;
        const wobble = Math.sin(time * 5 + i) * 10;
        positions.push({
          x: cx + (Math.random() - 0.5) * spread + wobble,
          y: cy + 20 + t * 100
        });
      }

      return positions;
    }
  },

  atom: {
    name: 'Atom',
    icon: '⚛️',
    category: 'objects',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Nucleus
      const nucleusCount = Math.floor(count * 0.1);
      for (let i = 0; i < nucleusCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 15;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      // Electron orbits (3 orbits at different angles)
      const orbits = 3;
      const electronsPer = Math.floor((count - nucleusCount) / orbits);

      for (let orbit = 0; orbit < orbits; orbit++) {
        const orbitAngle = (orbit / orbits) * Math.PI;
        const orbitRotation = time + orbit * Math.PI / 3;

        for (let i = 0; i < electronsPer && positions.length < count; i++) {
          const t = (i / electronsPer) * Math.PI * 2 + orbitRotation;
          const r = 80;

          // Rotate orbit in 3D space (simulate with projection)
          const x = Math.cos(t) * r;
          const z = Math.sin(t) * r;
          const y = Math.sin(orbitAngle) * z;

          positions.push({
            x: cx + x,
            y: cy + y
          });
        }
      }

      return positions;
    }
  },

  speaker: {
    name: 'Speaker',
    icon: '🔊',
    category: 'objects',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Speaker cone (circles getting larger)
      const coneCount = Math.floor(count * 0.4);
      for (let i = 0; i < coneCount; i++) {
        const ring = Math.floor(i / (coneCount / 3));
        const ringProgress = (i % Math.ceil(coneCount / 3)) / Math.ceil(coneCount / 3);
        const angle = ringProgress * Math.PI * 2;
        const r = 30 + ring * 25;

        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      // Sound waves (animated)
      const waveCount = count - coneCount;
      const waves = 3;

      for (let w = 0; w < waves; w++) {
        const waveRadius = 100 + w * 40 + (time * 50) % 120;
        const particlesInWave = Math.ceil(waveCount / waves);

        for (let i = 0; i < particlesInWave && positions.length < count; i++) {
          const angle = (i / particlesInWave) * Math.PI * 2;
          const alpha = 1 - (waveRadius - 100) / 120;

          if (alpha > 0) {
            positions.push({
              x: cx + Math.cos(angle) * waveRadius,
              y: cy + Math.sin(angle) * waveRadius
            });
          }
        }
      }

      return positions;
    }
  },

  // Text & Symbols
  smile: {
    name: 'Smiley',
    icon: '😊',
    category: 'symbols',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Face (circle)
      const faceCount = Math.floor(count * 0.5);
      for (let i = 0; i < faceCount; i++) {
        const angle = (i / faceCount) * Math.PI * 2;
        const r = 100;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      // Eyes
      const eyeCount = Math.floor(count * 0.15);
      for (let i = 0; i < eyeCount; i++) {
        const side = i < eyeCount / 2 ? -1 : 1;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 8;
        positions.push({
          x: cx + side * 40 + Math.cos(angle) * r,
          y: cy - 30 + Math.sin(angle) * r
        });
      }

      // Smile (arc)
      const smileCount = count - positions.length;
      for (let i = 0; i < smileCount; i++) {
        const t = i / smileCount;
        const angle = Math.PI * 0.2 + t * Math.PI * 0.6;
        const r = 60;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      return positions;
    }
  },

  infinity: {
    name: 'Infinity',
    icon: '∞',
    category: 'symbols',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Lemniscate curve (infinity symbol)
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const scale = 80;

        // Parametric equations for infinity symbol
        const x = scale * Math.cos(t) / (1 + Math.pow(Math.sin(t), 2));
        const y = scale * Math.sin(t) * Math.cos(t) / (1 + Math.pow(Math.sin(t), 2));

        positions.push({
          x: cx + x,
          y: cy + y
        });
      }

      return positions;
    }
  },

  peace: {
    name: 'Peace',
    icon: '☮️',
    category: 'symbols',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Outer circle
      const circleCount = Math.floor(count * 0.6);
      for (let i = 0; i < circleCount; i++) {
        const angle = (i / circleCount) * Math.PI * 2;
        const r = 80;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      // Center line (vertical)
      const centerCount = Math.floor(count * 0.15);
      for (let i = 0; i < centerCount; i++) {
        const t = i / centerCount;
        positions.push({
          x: cx,
          y: cy - 80 + t * 160
        });
      }

      // Left diagonal
      const leftCount = Math.floor(count * 0.125);
      for (let i = 0; i < leftCount; i++) {
        const t = i / leftCount;
        positions.push({
          x: cx - t * 56,
          y: cy + t * 56
        });
      }

      // Right diagonal
      const rightCount = count - positions.length;
      for (let i = 0; i < rightCount; i++) {
        const t = i / rightCount;
        positions.push({
          x: cx + t * 56,
          y: cy + t * 56
        });
      }

      return positions;
    }
  },

  // More patterns
  spiral: {
    name: 'Spiral',
    icon: '🌀',
    category: 'patterns',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 8;
        const r = (i / count) * 120;

        positions.push({
          x: cx + Math.cos(t) * r,
          y: cy + Math.sin(t) * r
        });
      }

      return positions;
    }
  },

  hexagon: {
    name: 'Hexagon',
    icon: '⬡',
    category: 'shapes',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      const sides = 6;
      const radius = 100;

      for (let i = 0; i < count; i++) {
        const side = Math.floor((i / count) * sides);
        const t = (i % Math.ceil(count / sides)) / Math.ceil(count / sides);

        const angle1 = (side / sides) * Math.PI * 2 - Math.PI / 2;
        const angle2 = ((side + 1) / sides) * Math.PI * 2 - Math.PI / 2;

        const x1 = Math.cos(angle1) * radius;
        const y1 = Math.sin(angle1) * radius;
        const x2 = Math.cos(angle2) * radius;
        const y2 = Math.sin(angle2) * radius;

        positions.push({
          x: cx + x1 + (x2 - x1) * t,
          y: cy + y1 + (y2 - y1) * t
        });
      }

      return positions;
    }
  },

  donut: {
    name: 'Donut',
    icon: '🍩',
    category: 'shapes',
    generate: (count, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      // Outer ring
      const outerCount = Math.floor(count * 0.6);
      for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * Math.PI * 2;
        const r = 90;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      // Inner ring (hole)
      const innerCount = count - outerCount;
      for (let i = 0; i < innerCount; i++) {
        const angle = (i / innerCount) * Math.PI * 2;
        const r = 40;
        positions.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r
        });
      }

      return positions;
    }
  },

  tornado: {
    name: 'Tornado',
    icon: '🌪️',
    category: 'animations',
    animated: true,
    generate: (count, width, height, time = 0) => {
      const cx = width / 2;
      const cy = height / 2;
      const positions = [];

      for (let i = 0; i < count; i++) {
        const t = i / count;
        const y = -150 + t * 300;
        const radius = 10 + t * 80;
        const angle = t * Math.PI * 8 + time * 2;

        positions.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + y
        });
      }

      return positions;
    }
  }
};

export const formationCategories = {
  animals: '🦁 Animals',
  nature: '🌳 Nature',
  objects: '🚀 Objects',
  shapes: '⬡ Shapes',
  symbols: '☮️ Symbols',
  patterns: '〰️ Patterns',
  animations: '✨ Animations'
};

export function getFormationsByCategory() {
  const categorized = {};

  Object.entries(formations).forEach(([key, formation]) => {
    const category = formation.category || 'other';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push({ key, ...formation });
  });

  return categorized;
}
