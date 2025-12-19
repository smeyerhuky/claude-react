/**
 * GestureRecognizer - Detects hand gestures from MediaPipe landmarks
 * Recognizes: open_palm, point, peace, ok, pinch, fist, wave, rock
 */

// Landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;

const THUMB_MCP = 2;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;

export class GestureRecognizer {
  constructor(bufferSize = 5) {
    this.bufferSize = bufferSize;
    this.gestureBuffer = [];
    this.lastPosition = null;
    this.movementHistory = [];
  }

  detectGesture(hand) {
    const { landmarks } = hand;
    if (!landmarks || landmarks.length < 21) {
      return { gesture: 'unknown', confidence: 0 };
    }

    // Track movement for wave detection
    this._trackMovement(landmarks[WRIST]);

    // Check each gesture
    const fingerStates = this._getFingerStates(landmarks);
    const gesture = this._classifyGesture(fingerStates, landmarks);

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
      index: this._isFingerExtended(landmarks, INDEX_TIP, INDEX_MCP),
      middle: this._isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_MCP),
      ring: this._isFingerExtended(landmarks, RING_TIP, RING_MCP),
      pinky: this._isFingerExtended(landmarks, PINKY_TIP, PINKY_MCP),
    };
  }

  _isThumbExtended(landmarks) {
    const thumbTip = landmarks[THUMB_TIP];
    const thumbMcp = landmarks[THUMB_MCP];
    const wrist = landmarks[WRIST];

    // Thumb is extended if tip is far from wrist horizontally
    const dist = Math.abs(thumbTip.x - wrist.x);
    return dist > 0.1;
  }

  _isFingerExtended(landmarks, tipIdx, mcpIdx) {
    const tip = landmarks[tipIdx];
    const mcp = landmarks[mcpIdx];

    // Finger is extended if tip is above (lower y) the MCP joint
    return tip.y < mcp.y - 0.02;
  }

  _getDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _trackMovement(wrist) {
    if (this.lastPosition) {
      const movement = this._getDistance(wrist, this.lastPosition);
      this.movementHistory.push(movement);
      if (this.movementHistory.length > 10) {
        this.movementHistory.shift();
      }
    }
    this.lastPosition = { ...wrist };
  }

  _isWaving() {
    if (this.movementHistory.length < 5) return false;
    const avgMovement = this.movementHistory.reduce((a, b) => a + b, 0) / this.movementHistory.length;
    return avgMovement > 0.02;
  }

  _classifyGesture(fingers, landmarks) {
    const { thumb, index, middle, ring, pinky } = fingers;

    // Pinch: thumb and index tips close together
    const thumbIndexDist = this._getDistance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
    if (thumbIndexDist < 0.05) {
      return { gesture: 'pinch', confidence: 0.9 };
    }

    // OK: thumb and index form circle (close but others extended)
    if (thumbIndexDist < 0.08 && middle && ring) {
      return { gesture: 'ok', confidence: 0.85 };
    }

    // Fist: all fingers curled
    if (!thumb && !index && !middle && !ring && !pinky) {
      return { gesture: 'fist', confidence: 0.9 };
    }

    // Point: only index extended
    if (index && !middle && !ring && !pinky) {
      return { gesture: 'point', confidence: 0.9 };
    }

    // Peace: index and middle extended
    if (index && middle && !ring && !pinky) {
      return { gesture: 'peace', confidence: 0.9 };
    }

    // Rock: index and pinky extended
    if (index && !middle && !ring && pinky) {
      return { gesture: 'rock', confidence: 0.85 };
    }

    // Open palm: all fingers extended
    if (thumb && index && middle && ring && pinky) {
      // Check for wave (open palm + movement)
      if (this._isWaving()) {
        return { gesture: 'wave', confidence: 0.8 };
      }
      return { gesture: 'open_palm', confidence: 0.9 };
    }

    return { gesture: 'unknown', confidence: 0.5 };
  }

  getSmoothedPrediction() {
    if (this.gestureBuffer.length === 0) {
      return { gesture: 'unknown', confidence: 0 };
    }

    // Count gesture occurrences
    const counts = {};
    this.gestureBuffer.forEach(({ gesture }) => {
      counts[gesture] = (counts[gesture] || 0) + 1;
    });

    // Find most common gesture
    let maxCount = 0;
    let dominantGesture = 'unknown';

    for (const [gesture, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantGesture = gesture;
      }
    }

    const confidence = maxCount / this.gestureBuffer.length;
    return { gesture: dominantGesture, confidence };
  }

  reset() {
    this.gestureBuffer = [];
    this.movementHistory = [];
    this.lastPosition = null;
  }
}

export default GestureRecognizer;
