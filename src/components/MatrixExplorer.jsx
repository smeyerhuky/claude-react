import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from 'recharts';

// Matrix operations library (pure JavaScript implementation)
const MatrixOps = {
  // Deep clone a matrix
  clone: (matrix) => {
    return matrix.map(row => [...row]);
  },
  
  // Element-wise addition of two matrices
  add: (matrixA, matrixB) => {
    return matrixA.map((row, i) => 
      row.map((val, j) => val + matrixB[i][j])
    );
  },
  
  // Element-wise subtraction of two matrices
  subtract: (matrixA, matrixB) => {
    return matrixA.map((row, i) => 
      row.map((val, j) => val - matrixB[i][j])
    );
  },
  
  // Element-wise multiplication of two matrices
  multiply: (matrixA, matrixB) => {
    return matrixA.map((row, i) => 
      row.map((val, j) => val * matrixB[i][j])
    );
  },
  
  // Element-wise division of two matrices
  divide: (matrixA, matrixB) => {
    return matrixA.map((row, i) => 
      row.map((val, j) => 
        matrixB[i][j] !== 0 ? val / matrixB[i][j] : 0
      )
    );
  },
  
  // Scale a matrix by a scalar value
  scale: (matrix, scalar) => {
    return matrix.map(row => 
      row.map(val => val * scalar)
    );
  },
  
  // Matrix multiplication: A(m×n) × B(n×p) = C(m×p)
  matMul: (matrixA, matrixB) => {
    if (!matrixA.length || !matrixB.length) return [];
    
    const numRowsA = matrixA.length;
    const numColsA = matrixA[0].length;
    const numRowsB = matrixB.length;
    const numColsB = matrixB[0].length;
    
    if (numColsA !== numRowsB) {
      throw new Error(`Cannot multiply matrices of dimensions ${numRowsA}×${numColsA} and ${numRowsB}×${numColsB}`);
    }
    
    const result = Array(numRowsA).fill().map(() => Array(numColsB).fill(0));
    
    for (let i = 0; i < numRowsA; i++) {
      for (let j = 0; j < numColsB; j++) {
        for (let k = 0; k < numColsA; k++) {
          result[i][j] += matrixA[i][k] * matrixB[k][j];
        }
      }
    }
    
    return result;
  },
  
  // Transpose a matrix: A(m×n) → A^T(n×m)
  transpose: (matrix) => {
    if (!matrix.length) return [];
    
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = Array(cols).fill().map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = matrix[i][j];
      }
    }
    
    return result;
  },
  
  // Calculate sum along an axis
  // axis = 0: column-wise, axis = 1: row-wise
  sum: (matrix, axis) => {
    if (!matrix.length) return [];
    
    if (axis === 0) {
      // Column-wise sum
      const result = Array(matrix[0].length).fill(0);
      
      for (let j = 0; j < matrix[0].length; j++) {
        for (let i = 0; i < matrix.length; i++) {
          result[j] += matrix[i][j];
        }
      }
      
      return result;
    } else {
      // Row-wise sum
      return matrix.map(row => row.reduce((sum, val) => sum + val, 0));
    }
  },
  
  // Calculate mean along an axis
  // axis = 0: column-wise, axis = 1: row-wise
  mean: (matrix, axis) => {
    if (!matrix.length) return [];
    
    if (axis === 0) {
      // Column-wise mean
      const result = Array(matrix[0].length).fill(0);
      
      for (let j = 0; j < matrix[0].length; j++) {
        for (let i = 0; i < matrix.length; i++) {
          result[j] += matrix[i][j];
        }
        result[j] /= matrix.length;
      }
      
      return result;
    } else {
      // Row-wise mean
      return matrix.map(row => row.reduce((sum, val) => sum + val, 0) / row.length);
    }
  },
  
  // Calculate variance along an axis
  variance: (matrix, axis) => {
    if (!matrix.length) return [];
    
    const means = MatrixOps.mean(matrix, axis);
    
    if (axis === 0) {
      // Column-wise variance
      const result = Array(matrix[0].length).fill(0);
      
      for (let j = 0; j < matrix[0].length; j++) {
        for (let i = 0; i < matrix.length; i++) {
          result[j] += Math.pow(matrix[i][j] - means[j], 2);
        }
        result[j] /= matrix.length;
      }
      
      return result;
    } else {
      // Row-wise variance
      return matrix.map((row, i) => {
        const mean = means[i];
        return row.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / row.length;
      });
    }
  },
  
  // Find max value along an axis
  max: (matrix, axis) => {
    if (!matrix.length) return [];
    
    if (axis === 0) {
      // Column-wise max
      const result = Array(matrix[0].length).fill(-Infinity);
      
      for (let j = 0; j < matrix[0].length; j++) {
        for (let i = 0; i < matrix.length; i++) {
          result[j] = Math.max(result[j], matrix[i][j]);
        }
      }
      
      return result;
    } else {
      // Row-wise max
      return matrix.map(row => Math.max(...row));
    }
  },
  
  // Find min value along an axis
  min: (matrix, axis) => {
    if (!matrix.length) return [];
    
    if (axis === 0) {
      // Column-wise min
      const result = Array(matrix[0].length).fill(Infinity);
      
      for (let j = 0; j < matrix[0].length; j++) {
        for (let i = 0; i < matrix.length; i++) {
          if (matrix[i][j] !== 0) { // Ignore zeros
            result[j] = Math.min(result[j], matrix[i][j]);
          }
        }
        if (result[j] === Infinity) result[j] = 0;
      }
      
      return result;
    } else {
      // Row-wise min
      return matrix.map(row => {
        const nonZeroValues = row.filter(val => val !== 0);
        return nonZeroValues.length ? Math.min(...nonZeroValues) : 0;
      });
    }
  },
  
  // Element-wise comparison: greater than
  greaterThan: (matrix, value) => {
    return matrix.map(row => row.map(val => val > value));
  },
  
  // Element-wise comparison: less than
  lessThan: (matrix, value) => {
    return matrix.map(row => row.map(val => val < value));
  },
  
  // Count true values in a boolean matrix
  countTrue: (boolMatrix) => {
    return boolMatrix.reduce((count, row) => 
      count + row.filter(Boolean).length, 0
    );
  },
  
  // Calculate correlation matrix
  correlationMatrix: (matrix) => {
    // Normalize each column (variable)
    const means = MatrixOps.mean(matrix, 0);
    const vars = MatrixOps.variance(matrix, 0);
    const stdDevs = vars.map(v => Math.sqrt(v));
    
    const normalized = matrix.map((row, i) => 
      row.map((val, j) => (val - means[j]) / (stdDevs[j] || 1))
    );
    
    // Calculate correlation matrix
    const numCols = matrix[0].length;
    const corrMatrix = Array(numCols).fill().map(() => Array(numCols).fill(0));
    
    for (let i = 0; i < numCols; i++) {
      for (let j = 0; j < numCols; j++) {
        let sum = 0;
        for (let k = 0; k < matrix.length; k++) {
          sum += normalized[k][i] * normalized[k][j];
        }
        corrMatrix[i][j] = sum / (matrix.length - 1);
      }
    }
    
    return corrMatrix;
  },
  
  // Get dimensions of a matrix as a string
  getDimensions: (matrix) => {
    if (!matrix || !matrix.length) return '0×0';
    if (!Array.isArray(matrix[0])) return `${matrix.length}×1`;
    return `${matrix.length}×${matrix[0].length}`;
  },
  
  // Create an identity matrix of size n
  identity: (n) => {
    const result = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      result[i][i] = 1;
    }
    return result;
  },
  
  // Create a random matrix with given dimensions
  random: (rows, cols, min = 0, max = 10) => {
    return Array(rows).fill().map(() => 
      Array(cols).fill().map(() => 
        Math.floor(Math.random() * (max - min + 1)) + min
      )
    );
  },
  
  // Return a submatrix (slice)
  slice: (matrix, startRow, endRow, startCol, endCol) => {
    return matrix.slice(startRow, endRow).map(row => 
      row.slice(startCol, endCol)
    );
  },
  
  // Find patterns using simple clustering
  findPatterns: (matrix, threshold = 0.8) => {
    if (!matrix.length) return [];
    
    // Calculate similarity between rows
    const numRows = matrix.length;
    const similarityMatrix = Array(numRows).fill().map(() => Array(numRows).fill(0));
    
    for (let i = 0; i < numRows; i++) {
      for (let j = i; j < numRows; j++) {
        // Calculate cosine similarity
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let k = 0; k < matrix[i].length; k++) {
          dotProduct += matrix[i][k] * matrix[j][k];
          normA += matrix[i][k] * matrix[i][k];
          normB += matrix[j][k] * matrix[j][k];
        }
        
        const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
        similarityMatrix[i][j] = similarity;
        similarityMatrix[j][i] = similarity;
      }
    }
    
    // Identify clusters based on similarity
    const visited = Array(numRows).fill(false);
    const clusters = [];
    
    for (let i = 0; i < numRows; i++) {
      if (visited[i]) continue;
      
      const cluster = [i];
      visited[i] = true;
      
      for (let j = 0; j < numRows; j++) {
        if (i === j || visited[j]) continue;
        
        if (similarityMatrix[i][j] >= threshold) {
          cluster.push(j);
          visited[j] = true;
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  },
  
  // Simple linear regression on two vectors
  linearRegression: (x, y) => {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Input vectors must have the same non-zero length');
    }
    
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    let totalSS = 0, residualSS = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      totalSS += Math.pow(y[i] - yMean, 2);
      residualSS += Math.pow(y[i] - predicted, 2);
    }
    
    const rSquared = 1 - (residualSS / totalSS);
    
    return { slope, intercept, rSquared };
  },
  
  // Predict values based on linear regression
  predictLinear: (x, slope, intercept) => {
    if (Array.isArray(x[0])) {
      // If x is a matrix, predict for each row
      return x.map(row => row.map(val => val * slope + intercept));
    } else {
      // If x is a vector
      return x.map(val => val * slope + intercept);
    }
  },
  
  // Generate forecasts from a time series
  forecast: (timeSeries, horizon, windowSize = 3) => {
    const result = [...timeSeries];
    
    // For each forecast step
    for (let h = 0; h < horizon; h++) {
      const historyWindow = result.slice(-windowSize);
      
      // Use linear regression or moving average
      if (historyWindow.length >= 2) {
        const x = Array.from({ length: historyWindow.length }, (_, i) => i);
        const { slope, intercept } = MatrixOps.linearRegression(x, historyWindow);
        
        // Predict next value
        const nextValue = slope * historyWindow.length + intercept;
        result.push(Math.max(0, nextValue)); // Ensure non-negative
      } else {
        // Fallback to simple average if not enough data
        const avg = historyWindow.reduce((a, b) => a + b, 0) / historyWindow.length;
        result.push(avg);
      }
    }
    
    return result.slice(-horizon);
  }
};

// Animation utility functions
const AnimationUtils = {
  // Linear interpolation between two matrices
  interpolateMatrices: (matrixA, matrixB, t) => {
    return matrixA.map((row, i) => 
      row.map((val, j) => val + (matrixB[i][j] - val) * t)
    );
  },
  
  // Ease-in-out function for smoother animations
  easeInOut: (t) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
};

const MatrixExplorer = () => {
  // State for matrices and data
  const [primaryMatrix, setPrimaryMatrix] = useState([]);
  const [secondaryMatrix, setSecondaryMatrix] = useState([]);
  const [resultMatrix, setResultMatrix] = useState([]);
  const [transitionMatrix, setTransitionMatrix] = useState(null); // For animations
  
  // State for dimensions
  const [numRows, setNumRows] = useState(4);
  const [numCols, setNumCols] = useState(5);
  const [numRolesOrDisciplines, setNumRolesOrDisciplines] = useState(3);
  
  // State for editing and interaction
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState('workloadUtilization');
  const [activeOperation, setActiveOperation] = useState('utilization');
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changedCells, setChangedCells] = useState({});
  const [operationLog, setOperationLog] = useState([]);
  
  // State for visualizations
  const [chartData, setChartData] = useState([]);
  const [patternData, setPatternData] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  
  // State for explanations
  const [explanation, setExplanation] = useState('');
  
  // State for optimization parameters
  const [optimizationParams, setOptimizationParams] = useState({
    balanceWorkload: 50, // 0-100, how much to balance workload across users
    minimizeOverallocation: 80, // 0-100, priority for reducing overallocation
    preserveSpecialization: 30, // 0-100, keep users on their specialized tasks
    forecastHorizon: 5 // Number of days to forecast
  });
  
  // Animation frame reference
  const animationFrameRef = useRef(null);
  
  // Names for dimensions
  const userNames = Array.from({ length: numRows }, (_, i) => `User ${i + 1}`);
  const dayNames = Array.from({ length: numCols }, (_, i) => `Day ${i + 1}`);
  const roleNames = ['Developer', 'Designer', 'QA'];
  const disciplineNames = ['Frontend', 'Backend'];
  
  // Generate initial data
  useEffect(() => {
    generateData();
  }, [numRows, numCols, numRolesOrDisciplines]);
  
  // Animation effect
  useEffect(() => {
    if (isAnimating && transitionMatrix) {
      const animate = () => {
        setAnimationProgress(prev => {
          const newProgress = prev + 0.02;
          
          // Animation complete
          if (newProgress >= 1) {
            setIsAnimating(false);
            setTransitionMatrix(null);
            return 0;
          }
          
          // Continue animation
          animationFrameRef.current = requestAnimationFrame(animate);
          return newProgress;
        });
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isAnimating, transitionMatrix]);
  
  // Process operation when active operation changes
  useEffect(() => {
    processOperation();
  }, [activeOperation, primaryMatrix, secondaryMatrix]);
  
  // Generate random data
  const generateData = () => {
    // Create matrices with appropriate dimensions
    let workload, capacity, roles, disciplines;
    
    // Clear logs
    setOperationLog([]);
    setChangedCells({});
    
    switch (activeTab) {
      case 'workloadUtilization':
        // Generate workload matrix (users x days)
        workload = Array(numRows).fill().map(() => 
          Array(numCols).fill().map(() => Math.floor(Math.random() * 9) + 0)
        );
        
        // Generate capacity matrix (users x days)
        capacity = Array(numRows).fill().map(() => 
          Array(numCols).fill().map(() => 8)
        );
        
        setPrimaryMatrix(workload);
        setSecondaryMatrix(capacity);
        break;
        
      case 'rolesDisciplines':
        // Generate workload matrix (users x days)
        workload = Array(numRows).fill().map(() => 
          Array(numCols).fill().map(() => Math.floor(Math.random() * 9) + 0)
        );
        
        // Generate roles matrix (users x roles)
        roles = Array(numRows).fill().map((_, i) => {
          const roleRow = Array(numRolesOrDisciplines).fill(0);
          roleRow[i % numRolesOrDisciplines] = 1; // Each user has one role
          return roleRow;
        });
        
        setPrimaryMatrix(workload);
        setSecondaryMatrix(roles);
        break;
        
      case 'patternDetection':
        // Generate workload matrix with patterns
        workload = Array(numRows).fill().map((_, i) => {
          if (i % 3 === 0) {
            // Pattern 1: High at start, low at end
            return Array(numCols).fill().map((_, j) => 
              Math.max(0, 8 - j + Math.floor(Math.random() * 3) - 1)
            );
          } else if (i % 3 === 1) {
            // Pattern 2: Alternating high/low
            return Array(numCols).fill().map((_, j) => 
              j % 2 === 0 ? 7 + Math.floor(Math.random() * 3) - 1 : 2 + Math.floor(Math.random() * 3) - 1
            );
          } else {
            // Pattern 3: Bell curve
            const mid = Math.floor(numCols / 2);
            return Array(numCols).fill().map((_, j) => 
              Math.max(0, 8 - Math.abs(j - mid) * 2 + Math.floor(Math.random() * 3) - 1)
            );
          }
        });
        
        setPrimaryMatrix(workload);
        break;
        
      case 'optimization':
        // Generate workload with some overallocation
        workload = Array(numRows).fill().map(() => 
          Array(numCols).fill().map(() => {
            const baseValue = Math.floor(Math.random() * 9);
            // 20% chance of overallocation
            return Math.random() < 0.2 ? baseValue + 4 : baseValue;
          })
        );
        
        // Generate capacity matrix (users x days)
        capacity = Array(numRows).fill().map(() => 
          Array(numCols).fill().map(() => 8)
        );
        
        setPrimaryMatrix(workload);
        setSecondaryMatrix(capacity);
        break;
        
      case 'forecasting':
        // Generate workload with trends for forecasting
        workload = Array(numRows).fill().map((_, i) => {
          if (i % 3 === 0) {
            // Trend 1: Gradually increasing
            return Array(numCols).fill().map((_, j) => 
              Math.min(8, 2 + j * 0.5 + Math.floor(Math.random() * 3) - 1)
            );
          } else if (i % 3 === 1) {
            // Trend 2: Cyclical
            return Array(numCols).fill().map((_, j) => 
              Math.min(8, 4 + 2 * Math.sin(j * 0.7) + Math.floor(Math.random() * 3) - 1)
            );
          } else {
            // Trend 3: Stable with noise
            return Array(numCols).fill().map(() => 
              Math.min(8, 5 + Math.floor(Math.random() * 3) - 1)
            );
          }
        });
        
        setPrimaryMatrix(workload);
        break;
        
      default:
        break;
    }
    
    // Trigger operation processing
    processOperation();
  };
  
  // Process the current operation
  const processOperation = () => {
    if (!primaryMatrix.length) return;
    
    let result = null;
    let operation = activeOperation;
    const isWorkloadUtilization = activeTab === 'workloadUtilization';
    const isRolesDisciplines = activeTab === 'rolesDisciplines';
    const isPatternDetection = activeTab === 'patternDetection';
    const isOptimization = activeTab === 'optimization';
    const isForecasting = activeTab === 'forecasting';
    
    // Reset explanation
    setExplanation('');
    
    try {
      // Process based on the active operation
      switch (operation) {
        case 'utilization':
          if (isWorkloadUtilization) {
            result = MatrixOps.divide(primaryMatrix, secondaryMatrix);
            addOperationLog(
              'Utilization Matrix', 
              'Element-wise Division', 
              'Workload ÷ Capacity',
              MatrixOps.getDimensions(primaryMatrix),
              MatrixOps.getDimensions(secondaryMatrix),
              MatrixOps.getDimensions(result)
            );
            setExplanation('The utilization matrix shows how much of each user\'s capacity is being used on each day. Values over 1.0 (100%) indicate overallocation. This is calculated by dividing each element in the workload matrix by the corresponding element in the capacity matrix.');
          }
          break;
          
        case 'roleWorkload':
          if (isRolesDisciplines) {
            const rolesTransposed = MatrixOps.transpose(secondaryMatrix);
            result = MatrixOps.matMul(rolesTransposed, primaryMatrix);
            addOperationLog(
              'Role Workload Matrix', 
              'Matrix Multiplication', 
              'Roles^T × Workload',
              MatrixOps.getDimensions(rolesTransposed),
              MatrixOps.getDimensions(primaryMatrix),
              MatrixOps.getDimensions(result)
            );
            setExplanation('The role workload matrix shows the total workload for each role on each day. This is calculated by multiplying the transposed role assignment matrix by the workload matrix. Each row represents a role, and each column represents a day.');
          }
          break;
          
        case 'correlation':
          if (isPatternDetection) {
            result = MatrixOps.correlationMatrix(primaryMatrix);
            addOperationLog(
              'Correlation Matrix', 
              'Statistical Analysis', 
              'Correlation(Workload)',
              MatrixOps.getDimensions(primaryMatrix),
              '',
              MatrixOps.getDimensions(result)
            );
            setExplanation('The correlation matrix shows the relationship between different users\' workload patterns. Values close to 1 indicate strong positive correlation (similar patterns), values close to -1 indicate strong negative correlation (opposite patterns), and values close to 0 indicate no correlation.');
            
            // Create correlation visualization data
            const corrData = [];
            for (let i = 0; i < result.length; i++) {
              for (let j = 0; j < result[i].length; j++) {
                if (i !== j) { // Skip self-correlations
                  corrData.push({
                    user1: `User ${i + 1}`,
                    user2: `User ${j + 1}`,
                    correlation: result[i][j]
                  });
                }
              }
            }
            setCorrelationData(corrData);
          }
          break;
          
        case 'patterns':
          if (isPatternDetection) {
            const clusters = MatrixOps.findPatterns(primaryMatrix, 0.7);
            
            // Format result as a readable matrix
            result = Array(numRows).fill().map((_, i) => {
              // Find which cluster this user belongs to
              const clusterIndex = clusters.findIndex(cluster => cluster.includes(i));
              return [clusterIndex + 1]; // +1 for better readability
            });
            
            addOperationLog(
              'Pattern Clusters', 
              'Clustering', 
              'FindPatterns(Workload)',
              MatrixOps.getDimensions(primaryMatrix),
              '',
              `${numRows}×1`
            );
            
            // Create pattern visualization data
            const patternDataArray = [];
            userNames.forEach((user, i) => {
              const userWorkload = primaryMatrix[i];
              
              // Find user's cluster
              const clusterIndex = clusters.findIndex(cluster => cluster.includes(i));
              
              // Create data points for each day
              dayNames.forEach((day, j) => {
                patternDataArray.push({
                  user,
                  day,
                  workload: userWorkload[j],
                  clusterIndex: clusterIndex + 1
                });
              });
            });
            setPatternData(patternDataArray);
            
            setExplanation(`Users have been clustered based on the similarity of their workload patterns. ${clusters.length} distinct patterns were identified. Users in the same cluster have similar allocation patterns across days.`);
          }
          break;
          
        case 'overallocation':
          if (isOptimization) {
            const utilization = MatrixOps.divide(primaryMatrix, secondaryMatrix);
            result = MatrixOps.greaterThan(utilization, 1.0);
            
            // Count overallocated cells
            const overallocatedCount = MatrixOps.countTrue(result);
            
            addOperationLog(
              'Overallocation Map', 
              'Threshold Comparison', 
              'Utilization > 1.0',
              MatrixOps.getDimensions(utilization),
              '',
              MatrixOps.getDimensions(result)
            );
            
            setExplanation(`The overallocation map shows where users are allocated beyond their capacity. There are ${overallocatedCount} instances of overallocation in the current workload. Cells with 'true' indicate days where a user is assigned more work than their capacity.`);
          }
          break;
          
        case 'optimizedWorkload':
          if (isOptimization) {
            // A simplified optimization that reduces overallocation
            // while trying to balance workload across users
            
            // Start with current workload
            const originalWorkload = MatrixOps.clone(primaryMatrix);
            const capacity = secondaryMatrix;
            
            // Calculate initial utilization
            const utilization = MatrixOps.divide(originalWorkload, capacity);
            
            // Clone workload for optimization
            result = MatrixOps.clone(originalWorkload);
            
            // Identify overallocated cells
            const overallocatedMask = MatrixOps.greaterThan(utilization, 1.0);
            
            // Balance factor (0-1)
            const balanceFactor = optimizationParams.balanceWorkload / 100;
            
            // For each overallocated cell
            for (let i = 0; i < numRows; i++) {
              for (let j = 0; j < numCols; j++) {
                if (overallocatedMask[i][j]) {
                  // How much to reduce
                  const excess = result[i][j] - capacity[i][j];
                  
                  // Find underutilized users for this day
                  const underutilizedUsers = [];
                  for (let k = 0; k < numRows; k++) {
                    if (k !== i && utilization[k][j] < 0.8) {
                      underutilizedUsers.push({
                        index: k,
                        available: capacity[k][j] - result[k][j]
                      });
                    }
                  }
                  
                  // Sort by availability
                  underutilizedUsers.sort((a, b) => b.available - a.available);
                  
                  // Redistribute excess
                  let remainingExcess = excess;
                  for (const user of underutilizedUsers) {
                    if (remainingExcess <= 0) break;
                    
                    const transferAmount = Math.min(remainingExcess, user.available);
                    result[i][j] -= transferAmount;
                    result[user.index][j] += transferAmount;
                    remainingExcess -= transferAmount;
                  }
                  
                  // If no users available, just cap at capacity
                  if (remainingExcess > 0) {
                    result[i][j] = capacity[i][j];
                  }
                }
              }
            }
            
            // Apply balance factor
            if (balanceFactor > 0) {
              // Calculate average workload per day
              const dailyTotals = MatrixOps.sum(result, 0);
              const userWorkloads = MatrixOps.sum(result, 1);
              const avgUserWorkload = userWorkloads.reduce((a, b) => a + b, 0) / userWorkloads.length;
              
              // For each day
              for (let j = 0; j < numCols; j++) {
                // For each user
                for (let i = 0; i < numRows; i++) {
                  // Skip if at capacity
                  if (result[i][j] >= capacity[i][j]) continue;
                  
                  // Calculate how far this user is from average
                  const userTotal = MatrixOps.sum(result, 1)[i];
                  const deviation = avgUserWorkload - userTotal;
                  
                  // If user is below average, try to increase their workload
                  if (deviation > 0) {
                    // Find users above average
                    for (let k = 0; k < numRows; k++) {
                      if (k === i) continue;
                      
                      const otherUserTotal = MatrixOps.sum(result, 1)[k];
                      if (otherUserTotal > avgUserWorkload && result[k][j] > 0) {
                        // Transfer some workload
                        const transferAmount = Math.min(
                          deviation * balanceFactor * 0.2, // Gradual transfer
                          result[k][j], // Don't take more than available
                          capacity[i][j] - result[i][j] // Don't exceed capacity
                        );
                        
                        if (transferAmount > 0) {
                          result[i][j] += transferAmount;
                          result[k][j] -= transferAmount;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            addOperationLog(
              'Optimized Workload', 
              'Optimization Algorithm', 
              'Optimize(Workload, Capacity, Params)',
              MatrixOps.getDimensions(primaryMatrix),
              MatrixOps.getDimensions(secondaryMatrix),
              MatrixOps.getDimensions(result)
            );
            
            // Calculate improvement metrics
            const originalOverallocation = MatrixOps.countTrue(overallocatedMask);
            const newUtilization = MatrixOps.divide(result, capacity);
            const newOverallocationMask = MatrixOps.greaterThan(newUtilization, 1.0);
            const newOverallocation = MatrixOps.countTrue(newOverallocationMask);
            
            const originalVariance = MatrixOps.variance(MatrixOps.sum(originalWorkload, 1), 0)[0];
            const newVariance = MatrixOps.variance(MatrixOps.sum(result, 1), 0)[0];
            
            setExplanation(`The optimization algorithm has redistributed workload to reduce overallocation and balance work across users. Overallocated instances reduced from ${originalOverallocation} to ${newOverallocation}. Workload variance across users reduced by ${Math.round((1 - newVariance/originalVariance) * 100)}%.`);
          }
          break;
          
        case 'forecast':
          if (isForecasting) {
            // Generate forecasts for each user
            result = primaryMatrix.map(userWorkload => {
              // Get the forecasted values
              const forecast = MatrixOps.forecast(
                userWorkload, 
                optimizationParams.forecastHorizon
              );
              return forecast;
            });
            
            // Create chart data combining historical and forecast
            const forecastChartData = [];
            
            // Historical data
            for (let j = 0; j < numCols; j++) {
              const dayData = { name: `Day ${j + 1}`, type: 'Historical' };
              for (let i = 0; i < numRows; i++) {
                dayData[`User ${i + 1}`] = primaryMatrix[i][j];
              }
              forecastChartData.push(dayData);
            }
            
            // Forecast data
            for (let j = 0; j < optimizationParams.forecastHorizon; j++) {
              const dayData = { 
                name: `Day ${numCols + j + 1}`, 
                type: 'Forecast' 
              };
              for (let i = 0; i < numRows; i++) {
                dayData[`User ${i + 1}`] = result[i][j];
              }
              forecastChartData.push(dayData);
            }
            
            setForecastData(forecastChartData);
            
            addOperationLog(
              'Workload Forecast', 
              'Time Series Analysis', 
              'Forecast(Workload, Horizon)',
              MatrixOps.getDimensions(primaryMatrix),
              '',
              `${numRows}×${optimizationParams.forecastHorizon}`
            );
            
            setExplanation(`The forecast shows predicted workload for each user over the next ${optimizationParams.forecastHorizon} days, based on historical patterns. Forecasting uses a combination of trend analysis and moving averages to predict future allocation patterns.`);
          }
          break;
          
        default:
          break;
      }
      
      // Update result matrix
      if (result !== null) {
        // Start animation to new result
        if (resultMatrix.length > 0 && 
            result.length === resultMatrix.length && 
            result[0].length === resultMatrix[0].length) {
          setTransitionMatrix(result);
          setIsAnimating(true);
          setAnimationProgress(0);
        } else {
          // Direct update if dimensions changed
          setResultMatrix(result);
        }
      }
      
      // Prepare chart data for visualization
      prepareChartData();
      
    } catch (error) {
      console.error("Error processing operation:", error);
      setExplanation(`Error: ${error.message}`);
    }
  };
  
  // Update result during animation
  useEffect(() => {
    if (isAnimating && transitionMatrix) {
      // Create interpolated matrix
      const easedProgress = AnimationUtils.easeInOut(animationProgress);
      const interpolated = AnimationUtils.interpolateMatrices(
        resultMatrix, 
        transitionMatrix, 
        easedProgress
      );
      
      // Update result matrix
      setResultMatrix(interpolated);
      
      // When animation completes
      if (animationProgress >= 1) {
        setResultMatrix(transitionMatrix);
      }
    }
  }, [animationProgress, isAnimating, transitionMatrix, resultMatrix]);
  
  // Prepare data for charts
  const prepareChartData = () => {
    if (!primaryMatrix.length) return;
    
    // Convert matrices to chart data
    const chartData = [];
    
    // For workload/utilization data
    if (activeTab === 'workloadUtilization' || activeTab === 'rolesDisciplines' || activeTab === 'optimization') {
      for (let j = 0; j < numCols; j++) {
        const dayData = { name: `Day ${j + 1}` };
        
        // Add workload data
        for (let i = 0; i < numRows; i++) {
          dayData[`User ${i + 1}`] = primaryMatrix[i][j];
        }
        
        // Add result data if available
        if (resultMatrix.length > 0) {
          // For utilization, scale to percentage
          if (activeOperation === 'utilization') {
            for (let i = 0; i < Math.min(numRows, resultMatrix.length); i++) {
              if (j < resultMatrix[i].length) {
                dayData[`Util ${i + 1}`] = Math.round(resultMatrix[i][j] * 100);
              }
            }
          }
          // For role workload
          else if (activeOperation === 'roleWorkload' && resultMatrix.length === numRolesOrDisciplines) {
            for (let i = 0; i < numRolesOrDisciplines; i++) {
              if (j < resultMatrix[i].length) {
                dayData[roleNames[i] || `Role ${i + 1}`] = resultMatrix[i][j];
              }
            }
          }
        }
        
        chartData.push(dayData);
      }
    }
    
    setChartData(chartData);
  };
  
  // Add an entry to the operation log
  const addOperationLog = (resultName, operation, formula, dimA, dimB, dimResult) => {
    setOperationLog(prev => [...prev, {
      resultName,
      operation,
      formula,
      dimA,
      dimB,
      dimResult,
      timestamp: new Date().toISOString()
    }]);
  };
  
  // Handle matrix cell click for editing
  const handleCellClick = (matrix, rowIdx, colIdx) => {
    let value;
    
    switch (matrix) {
      case 'primary':
        value = primaryMatrix[rowIdx][colIdx];
        break;
      case 'secondary':
        value = secondaryMatrix[rowIdx][colIdx];
        break;
      default:
        return;
    }
    
    setEditingCell({ matrix, rowIdx, colIdx });
    setEditValue(value.toString());
  };
  
  // Handle cell edit submission
  const handleCellEditSubmit = (e) => {
    e.preventDefault();
    
    if (!editingCell) return;
    
    const { matrix, rowIdx, colIdx } = editingCell;
    const newValue = parseFloat(editValue);
    
    if (isNaN(newValue)) {
      // Invalid input, cancel edit
      setEditingCell(null);
      setEditValue('');
      return;
    }
    
    // Create a key for this cell
    const cellKey = `${matrix}_${rowIdx}_${colIdx}`;
    
    // Update the appropriate matrix
    if (matrix === 'primary') {
      const newMatrix = MatrixOps.clone(primaryMatrix);
      const oldValue = newMatrix[rowIdx][colIdx];
      newMatrix[rowIdx][colIdx] = newValue;
      setPrimaryMatrix(newMatrix);
      
      // Track the change
      setChangedCells(prev => ({
        ...prev,
        [cellKey]: { oldValue, newValue }
      }));
    } else if (matrix === 'secondary') {
      const newMatrix = MatrixOps.clone(secondaryMatrix);
      const oldValue = newMatrix[rowIdx][colIdx];
      newMatrix[rowIdx][colIdx] = newValue;
      setSecondaryMatrix(newMatrix);
      
      // Track the change
      setChangedCells(prev => ({
        ...prev,
        [cellKey]: { oldValue, newValue }
      }));
    }
    
    // Clear edit state
    setEditingCell(null);
    setEditValue('');
  };
  
  // Handle cell edit cancel
  const handleCellEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };
  
  // Check if a cell is changed
  const isCellChanged = (matrix, rowIdx, colIdx) => {
    const cellKey = `${matrix}_${rowIdx}_${colIdx}`;
    return changedCells[cellKey] !== undefined;
  };
  
  // Render matrix table
  const renderMatrixTable = (matrix, matrixType, rowLabels, colLabels, title, isEditable = false) => {
    if (!matrix || !matrix.length) {
      return <div className="text-center text-gray-500">No data available</div>;
    }
    
    const formatValue = (val) => {
      if (typeof val === 'boolean') {
        return val ? 'true' : 'false';
      }
      if (typeof val === 'number') {
        return val.toFixed(2).replace(/\.00$/, '');
      }
      return val.toString();
    };
    
    const getCellClass = (rowIdx, colIdx) => {
      let className = "px-3 py-2 text-center ";
      
      // Add editable style
      if (isEditable) {
        className += "cursor-pointer hover:bg-gray-100 ";
      }
      
      // Add change highlight
      if (isCellChanged(matrixType, rowIdx, colIdx)) {
        className += "bg-yellow-200 ";
      }
      
      // Add utilization color coding
      if (activeOperation === 'utilization' && matrixType === 'result') {
        const val = matrix[rowIdx][colIdx];
        if (val > 1) className += "bg-red-100 text-red-800 font-medium ";
        else if (val >= 0.8) className += "bg-green-100 text-green-800 font-medium ";
        else if (val > 0) className += "bg-blue-100 ";
      }
      
      // Add overallocation color coding
      if (activeOperation === 'overallocation' && matrixType === 'result') {
        const val = matrix[rowIdx][colIdx];
        if (val) className += "bg-red-100 text-red-800 font-medium ";
      }
      
      return className;
    };
    
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-gray-500">{MatrixOps.getDimensions(matrix)}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 px-3 py-2"></th>
                {colLabels.map((label, idx) => (
                  <th key={idx} className="border border-gray-300 bg-gray-100 px-3 py-2">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">
                    {rowLabels[rowIdx] || `Row ${rowIdx + 1}`}
                  </th>
                  {Array.isArray(row) ? (
                    // For 2D matrices
                    row.map((cell, colIdx) => (
                      <td 
                        key={colIdx} 
                        className={getCellClass(rowIdx, colIdx)}
                        onClick={() => isEditable && handleCellClick(matrixType, rowIdx, colIdx)}
                      >
                        {formatValue(cell)}
                      </td>
                    ))
                  ) : (
                    // For column vectors
                    <td 
                      className={getCellClass(rowIdx, 0)}
                      onClick={() => isEditable && handleCellClick(matrixType, rowIdx, 0)}
                    >
                      {formatValue(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {isEditable && (
          <div className="mt-2 text-sm text-gray-600">Click on a cell to edit its value</div>
        )}
      </div>
    );
  };
  
  // Get labels for matrices based on active tab and operation
  const getMatrixLabels = () => {
    switch (activeTab) {
      case 'workloadUtilization':
        return {
          primary: {
            title: 'Workload Matrix',
            rowLabels: userNames,
            colLabels: dayNames
          },
          secondary: {
            title: 'Capacity Matrix',
            rowLabels: userNames,
            colLabels: dayNames
          },
          result: {
            title: 'Utilization Matrix',
            rowLabels: userNames,
            colLabels: dayNames
          }
        };
        
      case 'rolesDisciplines':
        return {
          primary: {
            title: 'Workload Matrix',
            rowLabels: userNames,
            colLabels: dayNames
          },
          secondary: {
            title: 'Role Assignment Matrix',
            rowLabels: userNames,
            colLabels: roleNames.slice(0, numRolesOrDisciplines)
          },
          result: {
            title: 'Role Workload Matrix',
            rowLabels: roleNames.slice(0, numRolesOrDisciplines),
            colLabels: dayNames
          }
        };
        
      case 'patternDetection':
        return {
          primary: {
            title: 'Workload Matrix',
            rowLabels: userNames,
            colLabels: dayNames
          },
          result: activeOperation === 'correlation' ? {
            title: 'Correlation Matrix',
            rowLabels: userNames,
            colLabels: userNames
          } : {
            title: 'Pattern Clusters',
            rowLabels: userNames,
            colLabels: ['Cluster']
          }
        };
        
      case 'optimization':
        return {
          primary: {
            title: 'Current Workload',
            rowLabels: userNames,
            colLabels: dayNames
          },
          secondary: {
            title: 'Capacity Matrix',
            rowLabels: userNames,
            colLabels: dayNames
          },
          result: activeOperation === 'overallocation' ? {
            title: 'Overallocation Map',
            rowLabels: userNames,
            colLabels: dayNames
          } : {
            title: 'Optimized Workload',
            rowLabels: userNames,
            colLabels: dayNames
          }
        };
        
      case 'forecasting':
        return {
          primary: {
            title: 'Historical Workload',
            rowLabels: userNames,
            colLabels: dayNames
          },
          result: {
            title: 'Forecasted Workload',
            rowLabels: userNames,
            colLabels: Array.from({ length: optimizationParams.forecastHorizon }, (_, i) => 
              `Day ${numCols + i + 1}`
            )
          }
        };
        
      default:
        return {};
    }
  };
  
  // Render charts based on active tab
  const renderCharts = () => {
    if (!primaryMatrix.length) {
      return <div className="text-center text-gray-500">No data available for visualization</div>;
    }
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];
    
    switch (activeTab) {
      case 'workloadUtilization':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Workload by User</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {userNames.map((user, i) => (
                      <Line
                        key={i}
                        type="monotone"
                        dataKey={user}
                        stroke={colors[i % colors.length]}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Utilization by User (%)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 150]} label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {userNames.map((user, i) => (
                      <Line
                        key={i}
                        type="monotone"
                        dataKey={`Util ${i + 1}`}
                        stroke={colors[i % colors.length]}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                    {/* Reference line for 100% utilization */}
                    <Line
                      dataKey={() => 100}
                      stroke="red"
                      strokeDasharray="3 3"
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
        
      case 'rolesDisciplines':
        return (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">Workload by Role</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {roleNames.slice(0, numRolesOrDisciplines).map((role, i) => (
                    <Bar key={i} dataKey={role} fill={colors[i % colors.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        
      case 'patternDetection':
        if (activeOperation === 'correlation' && correlationData.length > 0) {
          return (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-2">User Correlation Heatmap</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis 
                      type="category" 
                      dataKey="user1" 
                      name="User 1" 
                      allowDuplicatedCategory={false} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="user2" 
                      name="User 2" 
                      allowDuplicatedCategory={false} 
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="correlation" 
                      range={[0, 400]} 
                      name="Correlation" 
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter 
                      name="Correlation" 
                      data={correlationData} 
                      fill="#8884d8"
                      shape={(props) => {
                        const { cx, cy, size } = props;
                        const value = props.payload.correlation;
                        // Determine color based on correlation value
                        let fill = '#8884d8'; // Default purple
                        if (value > 0.7) fill = '#82ca9d'; // Strong positive: green
                        else if (value < -0.2) fill = '#ff7300'; // Negative: orange
                        
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={Math.abs(value) * 10} 
                            fill={fill} 
                            opacity={0.7} 
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Circle size represents correlation strength. Green circles indicate strong positive correlation.
              </p>
            </div>
          );
        } else if (activeOperation === 'patterns' && patternData.length > 0) {
          return (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-2">Workload Patterns</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis 
                      dataKey="day" 
                      name="Day" 
                    />
                    <YAxis 
                      dataKey="workload" 
                      name="Workload" 
                    />
                    <ZAxis 
                      range={[20, 200]} 
                      name="Size" 
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    {userNames.map((user, i) => (
                      <Scatter 
                        key={i}
                        name={user} 
                        data={patternData.filter(d => d.user === user)} 
                        fill={colors[i % colors.length]}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Each user's workload pattern is shown across days. Users with similar patterns have been grouped into clusters.
              </p>
            </div>
          );
        }
        return (
          <div className="text-center text-gray-500">
            Select an analysis operation to view pattern visualizations
          </div>
        );
        
      case 'optimization':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Current vs. Optimized Workload</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {userNames.map((user, i) => (
                      <Bar key={i} dataKey={user} fill={colors[i % colors.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Workload Distribution by User</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="80%" data={userNames.map((user, i) => ({
                    user,
                    totalWorkload: MatrixOps.sum(primaryMatrix, 1)[i],
                    avgWorkload: MatrixOps.mean(primaryMatrix, 1)[i],
                    maxWorkload: MatrixOps.max(primaryMatrix, 1)[i]
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="user" />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                    <Radar name="Total Workload" dataKey="totalWorkload" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Avg. Workload" dataKey="avgWorkload" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Max Workload" dataKey="maxWorkload" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
        
      case 'forecasting':
        if (forecastData.length > 0) {
          return (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-2">Workload Forecast</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {userNames.map((user, i) => (
                      <Line
                        key={i}
                        type="monotone"
                        dataKey={user}
                        stroke={colors[i % colors.length]}
                        strokeDasharray={forecastData.findIndex(d => d.type === 'Forecast') > -1 &&
                          (d => d.type === 'Forecast') ? '5 5' : '0'}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Historical data (solid lines) and forecasted workload (dashed lines) for the next {optimizationParams.forecastHorizon} days.
              </p>
            </div>
          );
        }
        return (
          <div className="text-center text-gray-500">
            Generate a forecast to view projected workload
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render optimization parameters
  const renderOptimizationParams = () => {
    if (activeTab !== 'optimization' && activeTab !== 'forecasting') return null;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTab === 'optimization' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Balance Workload: {optimizationParams.balanceWorkload}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={optimizationParams.balanceWorkload}
                  onChange={(e) => setOptimizationParams({
                    ...optimizationParams,
                    balanceWorkload: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher values prioritize equal distribution of work across users
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Minimize Overallocation: {optimizationParams.minimizeOverallocation}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={optimizationParams.minimizeOverallocation}
                  onChange={(e) => setOptimizationParams({
                    ...optimizationParams,
                    minimizeOverallocation: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher values prioritize reducing instances where users exceed capacity
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Preserve Specialization: {optimizationParams.preserveSpecialization}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={optimizationParams.preserveSpecialization}
                  onChange={(e) => setOptimizationParams({
                    ...optimizationParams,
                    preserveSpecialization: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher values keep work with users who specialize in similar tasks
                </p>
              </div>
            </>
          )}
          
          {activeTab === 'forecasting' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Forecast Horizon: {optimizationParams.forecastHorizon} days
              </label>
              <input
                type="range"
                min="1"
                max="14"
                value={optimizationParams.forecastHorizon}
                onChange={(e) => setOptimizationParams({
                  ...optimizationParams,
                  forecastHorizon: parseInt(e.target.value)
                })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of days to forecast into the future
              </p>
            </div>
          )}
          
          <div className="md:col-span-2">
            <button
              onClick={processOperation}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {activeTab === 'optimization' ? 'Reoptimize' : 'Generate Forecast'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Get operation options based on active tab
  const getOperationOptions = () => {
    switch (activeTab) {
      case 'workloadUtilization':
        return [
          { value: 'utilization', label: 'Utilization Analysis' }
        ];
      case 'rolesDisciplines':
        return [
          { value: 'roleWorkload', label: 'Role-based Workload' }
        ];
      case 'patternDetection':
        return [
          { value: 'correlation', label: 'Correlation Analysis' },
          { value: 'patterns', label: 'Pattern Clustering' }
        ];
      case 'optimization':
        return [
          { value: 'overallocation', label: 'Overallocation Map' },
          { value: 'optimizedWorkload', label: 'Optimized Workload' }
        ];
      case 'forecasting':
        return [
          { value: 'forecast', label: 'Workload Forecast' }
        ];
      default:
        return [];
    }
  };
  
  // Cell Edit Modal
  const renderCellEditModal = () => {
    if (!editingCell) return null;
    
    const { matrix, rowIdx, colIdx } = editingCell;
    const matrixLabels = getMatrixLabels();
    const rowLabel = matrix === 'primary' 
      ? matrixLabels.primary.rowLabels[rowIdx]
      : matrixLabels.secondary.rowLabels[rowIdx];
    const colLabel = matrix === 'primary'
      ? matrixLabels.primary.colLabels[colIdx]
      : matrixLabels.secondary.colLabels[colIdx];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-lg w-80">
          <h3 className="text-lg font-semibold mb-3">
            Edit {matrix === 'primary' ? matrixLabels.primary.title : matrixLabels.secondary.title}
          </h3>
          <form onSubmit={handleCellEditSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {rowLabel} × {colLabel}
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 border rounded"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCellEditCancel}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Matrix Operations Log
  const renderOperationLog = () => {
    if (operationLog.length === 0) return null;
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Matrix Operation Log</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Result Matrix</th>
                <th className="border px-3 py-2 text-left">Operation</th>
                <th className="border px-3 py-2 text-left">Formula</th>
                <th className="border px-3 py-2 text-left">Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {operationLog.map((log, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2">{log.resultName}</td>
                  <td className="border px-3 py-2">{log.operation}</td>
                  <td className="border px-3 py-2 font-mono">{log.formula}</td>
                  <td className="border px-3 py-2">
                    {log.dimB ? (
                      <>
                        <span className="text-green-600">{log.dimA}</span> + <span className="text-blue-600">{log.dimB}</span> → <span className="text-purple-600">{log.dimResult}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-green-600">{log.dimA}</span> → <span className="text-purple-600">{log.dimResult}</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Explanation panel
  const renderExplanation = () => {
    if (!explanation) return null;
    
    return (
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">How This Works</h3>
        <p className="text-sm">
          {explanation}
        </p>
      </div>
    );
  };
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Comprehensive Matrix Operations Explorer</h1>
      
      {/* Main navigation tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex space-x-2 overflow-x-auto py-2 px-4">
            <button
              onClick={() => {
                setActiveTab('workloadUtilization');
                setActiveOperation('utilization');
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'workloadUtilization' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Workload & Utilization
            </button>
            <button
              onClick={() => {
                setActiveTab('rolesDisciplines');
                setActiveOperation('roleWorkload');
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'rolesDisciplines' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Roles & Disciplines
            </button>
            <button
              onClick={() => {
                setActiveTab('patternDetection');
                setActiveOperation('correlation');
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'patternDetection' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Pattern Detection
            </button>
            <button
              onClick={() => {
                setActiveTab('optimization');
                setActiveOperation('optimizedWorkload');
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'optimization' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Workload Optimization
            </button>
            <button
              onClick={() => {
                setActiveTab('forecasting');
                setActiveOperation('forecast');
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'forecasting' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Forecasting
            </button>
          </nav>
        </div>
        
        {/* Operation controls */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number of Users</label>
              <input
                type="range"
                min="2"
                max="8"
                value={numRows}
                onChange={(e) => setNumRows(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{numRows}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Number of Days</label>
              <input
                type="range"
                min="3"
                max="14"
                value={numCols}
                onChange={(e) => setNumCols(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{numCols}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Operation</label>
              <select
                value={activeOperation}
                onChange={(e) => setActiveOperation(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {getOperationOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Generate Random Data
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Matrix and operation explanation */}
      {renderExplanation()}
      
      {/* Optimization parameters if applicable */}
      {renderOptimizationParams()}
      
      {/* Visualizations */}
      {renderCharts()}
      
      {/* Operation log */}
      {renderOperationLog()}
      
      {/* Matrix tables based on active tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Matrix */}
        {primaryMatrix.length > 0 && (
          renderMatrixTable(
            primaryMatrix,
            'primary',
            getMatrixLabels().primary?.rowLabels || [],
            getMatrixLabels().primary?.colLabels || [],
            getMatrixLabels().primary?.title || 'Primary Matrix',
            true
          )
        )}
        
        {/* Secondary Matrix if applicable */}
        {(activeTab === 'workloadUtilization' || activeTab === 'rolesDisciplines' || activeTab === 'optimization') && 
          secondaryMatrix && secondaryMatrix.length > 0 && (
            renderMatrixTable(
              secondaryMatrix,
              'secondary',
              getMatrixLabels().secondary?.rowLabels || [],
              getMatrixLabels().secondary?.colLabels || [],
              getMatrixLabels().secondary?.title || 'Secondary Matrix',
              true
            )
          )
        }
        
        {/* Result Matrix */}
        {resultMatrix && resultMatrix.length > 0 && (
          renderMatrixTable(
            resultMatrix,
            'result',
            getMatrixLabels().result?.rowLabels || [],
            getMatrixLabels().result?.colLabels || [],
            getMatrixLabels().result?.title || 'Result Matrix',
            false
          )
        )}
      </div>
      
      {/* Matrix Operations Guide */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Matrix Operations Guide</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Operation</th>
                <th className="border px-3 py-2 text-left">Description</th>
                <th className="border px-3 py-2 text-left">Mathematical Formula</th>
                <th className="border px-3 py-2 text-left">Resource Management Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border px-3 py-2 font-medium">Element-wise Division</td>
                <td className="border px-3 py-2">Divides each element in matrix A by corresponding element in B</td>
                <td className="border px-3 py-2 font-mono">C[i,j] = A[i,j] / B[i,j]</td>
                <td className="border px-3 py-2">Calculate utilization by dividing workload by capacity</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-3 py-2 font-medium">Matrix Multiplication</td>
                <td className="border px-3 py-2">Each element in output is dot product of row in A and column in B</td>
                <td className="border px-3 py-2 font-mono">C[i,j] = Σ A[i,k] × B[k,j]</td>
                <td className="border px-3 py-2">Aggregate workload by roles or disciplines</td>
              </tr>
              <tr className="bg-white">
                <td className="border px-3 py-2 font-medium">Matrix Transpose</td>
                <td className="border px-3 py-2">Flips matrix over its diagonal</td>
                <td className="border px-3 py-2 font-mono">A^T[j,i] = A[i,j]</td>
                <td className="border px-3 py-2">Transform role assignments for multiplication</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-3 py-2 font-medium">Correlation Analysis</td>
                <td className="border px-3 py-2">Measures relationship between rows</td>
                <td className="border px-3 py-2 font-mono">corr(X,Y) = cov(X,Y)/(σ_X × σ_Y)</td>
                <td className="border px-3 py-2">Identify users with similar workload patterns</td>
              </tr>
              <tr className="bg-white">
                <td className="border px-3 py-2 font-medium">Pattern Clustering</td>
                <td className="border px-3 py-2">Groups similar rows based on pattern similarity</td>
                <td className="border px-3 py-2 font-mono">similarity(X,Y) = X·Y/(|X|×|Y|)</td>
                <td className="border px-3 py-2">Group users by work pattern for resource planning</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border px-3 py-2 font-medium">Time Series Forecast</td>
                <td className="border px-3 py-2">Predicts future values based on historical data</td>
                <td className="border px-3 py-2 font-mono">f(t+h) = α₀ + α₁t + ε</td>
                <td className="border px-3 py-2">Project future workload based on historical trends</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Cell Edit Modal */}
      {renderCellEditModal()}
    </div>
  );
};

export default MatrixExplorer;
