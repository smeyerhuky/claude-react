/**
 * GestureRecognizer - Simplified gesture detection from MediaPipe landmarks
 * Recognizes: open_palm, pinch, point, grab (simplified fist replacement)
 */

// Landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;

const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;

export class GestureRecognizer {
  constructor(bufferSize = 5) {
    this.bufferSize = bufferSize;
    this.gestureBuffer = [];
    this.holdTimers = {};
    this.lastGesture = null;
    this.gestureStartTime = null;
  }

  detectGesture(hand) {
    const { landmarks } = hand;
    if (!landmarks || landmarks.length < 21) {
      return { gesture: 'none', confidence: 0, held: false, holdDuration: 0 };
    }

    const fingerStates = this._getFingerStates(landmarks);
    const gesture = this._classifyGesture(fingerStates, landmarks);

    // Track hold duration
    const now = Date.now();
    if (gesture.gesture === this.lastGesture) {
      gesture.holdDuration = now - (this.gestureStartTime || now);
      gesture.held = gesture.holdDuration > 500; // 500ms threshold
    } else {
      this.lastGesture = gesture.gesture;
      this.gestureStartTime = now;
      gesture.holdDuration = 0;
      gesture.held = false;
    }

    // Buffer the result
    this.gestureBuffer.push(gesture);
    if (this.gestureBuffer.length > this.bufferSize) {
      this.gestureBuffer.shift();
    }

    return gesture;
  }

  _getFingerStates(landmarks) {
    return {
      thumb: this._isThumbExtended(landmarks),
      index: this._isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP, INDEX_MCP),
      middle: this._isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP),
      ring: this._isFingerExtended(landmarks, RING_TIP, RING_PIP, RING_MCP),
      pinky: this._isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP, PINKY_MCP),
    };
  }

  _isThumbExtended(landmarks) {
    const thumbTip = landmarks[THUMB_TIP];
    const thumbIp = landmarks[THUMB_IP];
    const wrist = landmarks[WRIST];
    const indexMcp = landmarks[INDEX_MCP];

    // Thumb is extended if tip is far from palm center
    const palmCenterX = (wrist.x + indexMcp.x) / 2;
    const dist = Math.abs(thumbTip.x - palmCenterX);
    return dist > 0.08;
  }

  _isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];

    // Finger is extended if tip is above PIP and PIP is above MCP
    return tip.y < pip.y && pip.y < mcp.y + 0.02;
  }

  _getDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  _getDistance2D(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _classifyGesture(fingers, landmarks) {
    const { thumb, index, middle, ring, pinky } = fingers;

    // Pinch: thumb and index tips close together
    const thumbIndexDist = this._getDistance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
    if (thumbIndexDist < 0.06 && !middle && !ring && !pinky) {
      return { gesture: 'pinch', confidence: 0.95 };
    }

    // Pinch with any finger state (more lenient)
    if (thumbIndexDist < 0.05) {
      return { gesture: 'pinch', confidence: 0.9 };
    }

    // Grab: all fingers curled toward palm (simplified from fist)
    const allCurled = !index && !middle && !ring && !pinky;
    if (allCurled) {
      return { gesture: 'grab', confidence: 0.9 };
    }

    // Point: only index extended
    if (index && !middle && !ring && !pinky) {
      return { gesture: 'point', confidence: 0.9 };
    }

    // Open palm: all fingers extended
    if (thumb && index && middle && ring && pinky) {
      return { gesture: 'open_palm', confidence: 0.9 };
    }

    // Spread: fingers extended but spread apart
    if (index && middle && ring && pinky) {
      return { gesture: 'spread', confidence: 0.85 };
    }

    return { gesture: 'none', confidence: 0.5 };
  }

  getSmoothedPrediction() {
    if (this.gestureBuffer.length === 0) {
      return { gesture: 'none', confidence: 0, held: false, holdDuration: 0 };
    }

    // Count gesture occurrences
    const counts = {};
    let totalHoldDuration = 0;

    this.gestureBuffer.forEach(({ gesture, holdDuration }) => {
      counts[gesture] = (counts[gesture] || 0) + 1;
      totalHoldDuration = Math.max(totalHoldDuration, holdDuration || 0);
    });

    // Find most common gesture
    let maxCount = 0;
    let dominantGesture = 'none';

    for (const [gesture, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantGesture = gesture;
      }
    }

    const confidence = maxCount / this.gestureBuffer.length;
    return {
      gesture: dominantGesture,
      confidence,
      held: totalHoldDuration > 500,
      holdDuration: totalHoldDuration,
    };
  }

  reset() {
    this.gestureBuffer = [];
    this.holdTimers = {};
    this.lastGesture = null;
    this.gestureStartTime = null;
  }
}

export default GestureRecognizer;
