/**
 * HandTrackingService - MediaPipe Hands wrapper for real-time hand detection
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe';

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

  _onResults(results) {
    const handData = [];

    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((landmarks, idx) => {
        const handedness = results.multiHandedness[idx];
        const indexTip = landmarks[8];

        handData.push({
          landmarks,
          handedness: handedness.label,
          confidence: handedness.score,
          position: { x: indexTip.x, y: indexTip.y },
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
