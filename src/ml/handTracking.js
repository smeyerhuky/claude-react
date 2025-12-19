/**
 * HandTrackingService - MediaPipe Hands wrapper with depth analysis
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe';

// Landmark indices for reference
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;

export class HandTrackingService {
  constructor(videoElement, config = {}) {
    this.videoElement = videoElement;
    this.config = {
      maxNumHands: config.maxNumHands || 2,
      minDetectionConfidence: config.minDetectionConfidence || 0.5,
      minTrackingConfidence: config.minTrackingConfidence || 0.5,
      modelComplexity: config.modelComplexity || 1,
    };

    this.hands = null;
    this.camera = null;
    this.subscribers = [];
    this.isRunning = false;
    this.stats = { fps: 0, avgLatency: 0, handsDetected: 0, frameCount: 0, lastTime: 0 };
  }

  async initialize() {
    await this._loadScripts();
    await this._setupHands();
    await this._setupCamera();
    this.isRunning = true;
  }

  async _loadScripts() {
    const scripts = [
      { src: `${CDN_BASE}/hands@0.4.1675469240/hands.js`, global: 'Hands' },
      { src: `${CDN_BASE}/camera_utils@0.3.1675466862/camera_utils.js`, global: 'Camera' },
    ];

    for (const { src, global } of scripts) {
      if (window[global]) continue;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  async _setupHands() {
    const { Hands } = window;

    this.hands = new Hands({
      locateFile: (file) => `${CDN_BASE}/hands@0.4.1675469240/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: this.config.maxNumHands,
      modelComplexity: this.config.modelComplexity,
      minDetectionConfidence: this.config.minDetectionConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
    });

    this.hands.onResults((results) => this._onResults(results));
    await this.hands.initialize();
  }

  async _setupCamera() {
    const { Camera } = window;

    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.isRunning && this.hands) {
          const startTime = performance.now();
          await this.hands.send({ image: this.videoElement });
          this._updateStats(performance.now() - startTime);
        }
      },
      width: 640,
      height: 480,
    });

    await this.camera.start();
  }

  _calculatePalmCenter(landmarks) {
    // Calculate palm center from wrist and MCP joints
    const wrist = landmarks[WRIST];
    const indexMcp = landmarks[INDEX_MCP];
    const middleMcp = landmarks[MIDDLE_MCP];

    return {
      x: (wrist.x + indexMcp.x + middleMcp.x) / 3,
      y: (wrist.y + indexMcp.y + middleMcp.y) / 3,
      z: (wrist.z + indexMcp.z + middleMcp.z) / 3,
    };
  }

  _calculateHandSize(landmarks) {
    // Estimate hand size from wrist to middle fingertip distance
    const wrist = landmarks[WRIST];
    const middleTip = landmarks[MIDDLE_TIP];

    const dx = middleTip.x - wrist.x;
    const dy = middleTip.y - wrist.y;
    const dz = middleTip.z - wrist.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  _calculateDepthInfo(landmarks) {
    // Analyze depth (z-coordinate) for hand positioning
    const zValues = landmarks.map((l) => l.z);
    const avgZ = zValues.reduce((a, b) => a + b, 0) / zValues.length;
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);

    // Normalize depth: negative z means closer to camera
    // Convert to 0-1 range where 1 is closest
    const normalizedDepth = Math.max(0, Math.min(1, 1 + avgZ * 5));

    return {
      raw: avgZ,
      normalized: normalizedDepth,
      range: maxZ - minZ,
      isClose: avgZ < -0.1,
      isFar: avgZ > 0.05,
    };
  }

  _calculateFingerSpread(landmarks) {
    // Calculate spread between fingers
    const tips = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
    let totalSpread = 0;

    for (let i = 0; i < tips.length - 1; i++) {
      const tip1 = landmarks[tips[i]];
      const tip2 = landmarks[tips[i + 1]];
      const dx = tip2.x - tip1.x;
      const dy = tip2.y - tip1.y;
      totalSpread += Math.sqrt(dx * dx + dy * dy);
    }

    return totalSpread / (tips.length - 1);
  }

  _onResults(results) {
    const handData = [];

    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((landmarks, idx) => {
        const handedness = results.multiHandedness[idx];
        const palmCenter = this._calculatePalmCenter(landmarks);
        const depth = this._calculateDepthInfo(landmarks);
        const handSize = this._calculateHandSize(landmarks);
        const fingerSpread = this._calculateFingerSpread(landmarks);

        handData.push({
          landmarks,
          handedness: handedness.label,
          confidence: handedness.score,
          // Position tracking points
          position: {
            x: landmarks[INDEX_TIP].x,
            y: landmarks[INDEX_TIP].y,
            z: landmarks[INDEX_TIP].z,
          },
          palmCenter,
          pinchPoint: {
            x: (landmarks[THUMB_TIP].x + landmarks[INDEX_TIP].x) / 2,
            y: (landmarks[THUMB_TIP].y + landmarks[INDEX_TIP].y) / 2,
            z: (landmarks[THUMB_TIP].z + landmarks[INDEX_TIP].z) / 2,
          },
          // Depth analysis
          depth,
          // Hand metrics
          handSize,
          fingerSpread,
        });
      });
    }

    this.stats.handsDetected = handData.length;
    this.subscribers.forEach((callback) => callback(handData));
  }

  _updateStats(latency) {
    this.stats.frameCount++;
    const now = performance.now();

    if (this.stats.lastTime) {
      const elapsed = now - this.stats.lastTime;
      this.stats.fps = Math.round(1000 / elapsed);
    }

    this.stats.lastTime = now;
    this.stats.avgLatency = Math.round(
      (this.stats.avgLatency * 0.9) + (latency * 0.1)
    );
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.hands) {
      this.hands.setOptions(this.config);
    }
  }

  getPerformanceStats() {
    return { ...this.stats };
  }

  destroy() {
    this.isRunning = false;
    this.subscribers = [];

    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }

    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
  }
}

export default HandTrackingService;
