import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

const KalmanFilterVisualization = () => {
  // State for filter parameters (adjustable via sliders)
  const [processNoise, setProcessNoise] = useState(0.01);
  const [measurementNoise, setMeasurementNoise] = useState(0.1);
  const [initialUncertainty, setInitialUncertainty] = useState(1.0);
  const [motionSpeed, setMotionSpeed] = useState(0.1);
  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // State for tracking
  const [truePositions, setTruePositions] = useState([50]);
  const [measuredPositions, setMeasuredPositions] = useState([50]);
  const [estimatedPositions, setEstimatedPositions] = useState([50]);
  const [uncertainties, setUncertainties] = useState([initialUncertainty]);
  const [timeStep, setTimeStep] = useState(0);

  // Kalman filter state
  const [x, setX] = useState(50); // Initial position
  const [P, setP] = useState(initialUncertainty); // Initial uncertainty

  // Constants
  const maxTimeSteps = 100;
  const width = 600;
  const height = 300;
  const padding = 40;
  const pointRadius = 4;

  // Animation reference
  const animationRef = useRef(null);

  // Reset simulation
  const resetSimulation = () => {
    setTimeStep(0);
    setTruePositions([50]);
    setMeasuredPositions([50]);
    setEstimatedPositions([50]);
    setUncertainties([initialUncertainty]);
    setX(50);
    setP(initialUncertainty);
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Toggle simulation
  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  // Step forward one time step
  const stepForward = () => {
    if (timeStep < maxTimeSteps) {
      updateKalmanFilter();
    }
  };

  // Update the Kalman filter
  const updateKalmanFilter = () => {
    // Process model (constant velocity with random acceleration)
    const A = 1; // State transition model (position update)
    const Q = processNoise; // Process noise covariance

    // Measurement model
    const H = 1; // Measurement model (we directly observe position)
    const R = measurementNoise; // Measurement noise covariance

    // Generate true position (with some random acceleration)
    const randomAcceleration = (Math.random() - 0.5) * motionSpeed * 2;
    const newTruePosition = truePositions[timeStep] + motionSpeed + randomAcceleration;

    // Generate measured position (true position + measurement noise)
    const measurementError = (Math.random() - 0.5) * Math.sqrt(R) * 2;
    const newMeasuredPosition = newTruePosition + measurementError;

    // Kalman filter prediction step
    const x_pred = A * x;
    const P_pred = A * P * A + Q;

    // Kalman filter update step
    const K = P_pred * H / (H * P_pred * H + R); // Kalman gain
    const x_update = x_pred + K * (newMeasuredPosition - H * x_pred);
    const P_update = (1 - K * H) * P_pred;

    // Update states
    setX(x_update);
    setP(P_update);
    setTruePositions([...truePositions, newTruePosition]);
    setMeasuredPositions([...measuredPositions, newMeasuredPosition]);
    setEstimatedPositions([...estimatedPositions, x_update]);
    setUncertainties([...uncertainties, P_update]);
    setTimeStep(timeStep + 1);
  };

  // Animation loop
  useEffect(() => {
    if (isRunning && timeStep < maxTimeSteps) {
      const animate = () => {
        updateKalmanFilter();
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isRunning, timeStep]);

  // X-scale for visualization
  const xScale = (t) => padding + (t / maxTimeSteps) * (width - 2 * padding);

  // Y-scale for visualization
  const yScale = (pos) => height - padding - ((pos - 0) / (100 - 0)) * (height - 2 * padding);

  // Draw uncertainty bounds as a shaded region
  const getUncertaintyPath = () => {
    let path = "";

    // Upper bound
    for (let t = 0; t <= timeStep; t++) {
      const x = xScale(t);
      const y = yScale(estimatedPositions[t] + Math.sqrt(uncertainties[t]) * 2);
      if (t === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }

    // Lower bound (in reverse)
    for (let t = timeStep; t >= 0; t--) {
      const x = xScale(t);
      const y = yScale(estimatedPositions[t] - Math.sqrt(uncertainties[t]) * 2);
      path += ` L ${x} ${y}`;
    }

    path += " Z";
    return path;
  };

  // Generate SVG paths for visualization
  const truePath = truePositions
    .map((pos, t) => `${t === 0 ? "M" : "L"} ${xScale(t)} ${yScale(pos)}`)
    .join(" ");

  const measurementPath = measuredPositions
    .map((pos, t) => `${t === 0 ? "M" : "L"} ${xScale(t)} ${yScale(pos)}`)
    .join(" ");

  const estimatedPath = estimatedPositions
    .map((pos, t) => `${t === 0 ? "M" : "L"} ${xScale(t)} ${yScale(pos)}`)
    .join(" ");

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">Kalman Filter Visualization</h2>

      {/* Visualization SVG */}
      <div className="relative bg-white rounded border">
        <svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <g key={`grid-${y}`}>
              <line
                x1={padding}
                y1={yScale(y)}
                x2={width - padding}
                y2={yScale(y)}
                stroke="#e5e5e5"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 5}
                y={yScale(y)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill="#666"
              >
                {y}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#333"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#333"
          />

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="12"
            fill="#333"
          >
            Time Steps
          </text>
          <text
            x={10}
            y={height / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#333"
            transform={`rotate(-90, 10, ${height / 2})`}
          >
            Position
          </text>

          {/* Uncertainty region */}
          {showHistory && (
            <path
              d={getUncertaintyPath()}
              fill="rgba(100, 149, 237, 0.2)"
              stroke="none"
            />
          )}

          {/* Paths */}
          {showHistory && (
            <>
              <path
                d={truePath}
                fill="none"
                stroke="green"
                strokeWidth="2"
              />
              <path
                d={measurementPath}
                fill="none"
                stroke="red"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <path
                d={estimatedPath}
                fill="none"
                stroke="blue"
                strokeWidth="2"
              />
            </>
          )}

          {/* Current points */}
          {timeStep > 0 && (
            <>
              <circle
                cx={xScale(timeStep)}
                cy={yScale(truePositions[timeStep])}
                r={pointRadius}
                fill="green"
              />
              <circle
                cx={xScale(timeStep)}
                cy={yScale(measuredPositions[timeStep])}
                r={pointRadius}
                fill="red"
              />
              <circle
                cx={xScale(timeStep)}
                cy={yScale(estimatedPositions[timeStep])}
                r={pointRadius}
                fill="blue"
              />
            </>
          )}

          {/* Legend */}
          <g transform={`translate(${width - 120}, 20)`}>
            <circle cx="5" cy="5" r="4" fill="green" />
            <text x="15" y="8" fontSize="10" fill="#333">True Position</text>

            <circle cx="5" cy="25" r="4" fill="red" />
            <text x="15" y="28" fontSize="10" fill="#333">Measured</text>

            <circle cx="5" cy="45" r="4" fill="blue" />
            <text x="15" y="48" fontSize="10" fill="#333">Kalman Estimate</text>

            <rect x="2" y="65" width="8" height="8" fill="rgba(100, 149, 237, 0.2)" />
            <text x="15" y="72" fontSize="10" fill="#333">Uncertainty</text>
          </g>
        </svg>
      </div>

      {/* Control panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Kalman Filter Parameters</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm flex justify-between">
              <span>Process Noise (Q): {processNoise.toFixed(3)}</span>
              <span className="text-xs text-gray-500">How unpredictable is the system?</span>
            </label>
            <input
              type="range"
              min="0.001"
              max="0.5"
              step="0.001"
              value={processNoise}
              onChange={(e) => setProcessNoise(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm flex justify-between">
              <span>Measurement Noise (R): {measurementNoise.toFixed(3)}</span>
              <span className="text-xs text-gray-500">How noisy are the measurements?</span>
            </label>
            <input
              type="range"
              min="0.01"
              max="5"
              step="0.01"
              value={measurementNoise}
              onChange={(e) => setMeasurementNoise(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm flex justify-between">
              <span>Initial Uncertainty (P): {initialUncertainty.toFixed(1)}</span>
              <span className="text-xs text-gray-500">Starting uncertainty level</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={initialUncertainty}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setInitialUncertainty(value);
                if (timeStep === 0) {
                  setP(value);
                  setUncertainties([value]);
                }
              }}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm flex justify-between">
              <span>Motion Speed: {motionSpeed.toFixed(2)}</span>
              <span className="text-xs text-gray-500">How fast the object moves</span>
            </label>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={motionSpeed}
              onChange={(e) => setMotionSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-semibold">Simulation Controls</h3>

          <div className="flex gap-2">
            <button
              onClick={toggleSimulation}
              className={`px-4 py-2 rounded ${
                isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              } text-white font-medium`}
            >
              {isRunning ? "Pause" : "Start"}
            </button>

            <button
              onClick={stepForward}
              disabled={isRunning}
              className={`px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium ${
                isRunning ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Step
            </button>

            <button
              onClick={resetSimulation}
              className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white font-medium"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="showHistory"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
            />
            <label htmlFor="showHistory" className="text-sm">
              Show history paths
            </label>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-semibold text-sm mb-1">Current State:</h4>
            <div className="text-sm">
              <div>Time Step: {timeStep}</div>
              <div>True Position: {truePositions[timeStep]?.toFixed(2) || "N/A"}</div>
              <div>Measured Position: {measuredPositions[timeStep]?.toFixed(2) || "N/A"}</div>
              <div>Kalman Estimate: {estimatedPositions[timeStep]?.toFixed(2) || "N/A"}</div>
              <div>Current Uncertainty: {uncertainties[timeStep]?.toFixed(3) || "N/A"}</div>
              <div>Kalman Gain: {timeStep > 0 ? (1 - uncertainties[timeStep] / (P + processNoise)).toFixed(3) : "N/A"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-2 p-4 bg-gray-100 rounded text-sm">
        <h3 className="font-bold mb-2">How to Understand This Visualization:</h3>
        <p className="mb-2">
          This visualization demonstrates a one-dimensional Kalman filter tracking an object's position.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-semibold text-green-700">Green line</span>: True position (normally unknown in real applications)</li>
          <li><span className="font-semibold text-red-700">Red dashed line</span>: Noisy measurements</li>
          <li><span className="font-semibold text-blue-700">Blue line</span>: Kalman filter's estimate</li>
          <li><span className="font-semibold text-blue-300">Blue shaded area</span>: Uncertainty bounds (±2σ)</li>
        </ul>
        <p className="mt-2">
          Try adjusting the sliders to see how different parameters affect the filter's performance:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Increase <strong>process noise</strong> to make the filter more responsive to new measurements</li>
          <li>Increase <strong>measurement noise</strong> to make the filter trust its internal model more</li>
          <li>Adjust <strong>initial uncertainty</strong> to see how quickly the filter converges</li>
          <li>Change <strong>motion speed</strong> to alter how fast the object moves</li>
        </ul>
      </div>
    </div>
  );
};

export default KalmanFilterVisualization;
