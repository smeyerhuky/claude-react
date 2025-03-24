/**
 * Utility functions for drawing on canvas elements
 * Used by SignalCanvas, FrequencySpectrumPlot, and other visualization components
 */

/**
 * Draw axes on a canvas
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Number} width - Canvas width
 * @param {Number} height - Canvas height
 * @param {String} color - Axis color
 * @param {Boolean} showGrid - Whether to show grid lines
 * @param {Number} gridSpacing - Space between grid lines (pixels)
 */
export const drawAxes = (ctx, width, height, color = '#ccc', showGrid = false, gridSpacing = 50) => {
    // Save context state
    ctx.save();
    
    // Draw horizontal axis (y = height/2)
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw vertical axis (x = width/2)
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.strokeStyle = color;
    ctx.stroke();
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.setLineDash([2, 2]); // Dashed lines for grid
      
      // Vertical grid lines
      for (let x = gridSpacing; x < width; x += gridSpacing) {
        // Skip the axis line
        if (Math.abs(x - width / 2) < 1) continue;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = gridSpacing; y < height; y += gridSpacing) {
        // Skip the axis line
        if (Math.abs(y - height / 2) < 1) continue;
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = color;
        ctx.stroke();
      }
      
      ctx.setLineDash([]); // Reset dash pattern
      ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    // Restore context state
    ctx.restore();
  };
  
  /**
   * Draw a signal path on canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} points - Array of {x, y} points to draw
   * @param {String} color - Signal line color
   * @param {Number} lineWidth - Width of the signal line
   * @param {Boolean} closed - Whether to close the path (connect last point to first)
   * @param {Boolean} fill - Whether to fill the path
   * @param {String} fillColor - Fill color if filling is enabled
   */
  export const drawSignal = (
    ctx, 
    points, 
    color = 'blue', 
    lineWidth = 2, 
    closed = false,
    fill = false,
    fillColor = 'rgba(0, 0, 255, 0.1)'
  ) => {
    if (!points || points.length < 2) return;
    
    // Save context state
    ctx.save();
    
    // Begin the path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // Draw lines to each point
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    // Close the path if specified
    if (closed) {
      ctx.closePath();
    }
    
    // Apply styles
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    // Draw the path
    ctx.stroke();
    
    // Fill if specified
    if (fill) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    // Restore context state
    ctx.restore();
  };
  
  /**
   * Draw a smooth curve through points using bezier curves
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} points - Array of {x, y} points to draw
   * @param {String} color - Signal line color
   * @param {Number} lineWidth - Width of the signal line
   * @param {Number} tension - Tension parameter for curve smoothness (0-1)
   * @param {Boolean} closed - Whether to close the path
   */
  export const drawSmoothSignal = (
    ctx, 
    points, 
    color = 'blue', 
    lineWidth = 2,
    tension = 0.5,
    closed = false
  ) => {
    if (!points || points.length < 2) return;
    
    // Save context state
    ctx.save();
    
    // Begin the path
    ctx.beginPath();
    
    // Calculate control points for smooth curve
    const controlPoints = calculateControlPoints(points, tension, closed);
    
    // Start at the first point
    ctx.moveTo(points[0].x, points[0].y);
    
    // Draw bezier curves through each point
    for (let i = 0; i < points.length - 1; i++) {
      ctx.bezierCurveTo(
        controlPoints.p1[i].x, controlPoints.p1[i].y,
        controlPoints.p2[i].x, controlPoints.p2[i].y,
        points[i + 1].x, points[i + 1].y
      );
    }
    
    // If closed, draw a curve back to the first point
    if (closed && points.length > 2) {
      const last = points.length - 1;
      ctx.bezierCurveTo(
        controlPoints.p1[last].x, controlPoints.p1[last].y,
        controlPoints.p2[last].x, controlPoints.p2[last].y,
        points[0].x, points[0].y
      );
    }
    
    // Apply styles
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    // Draw the path
    ctx.stroke();
    
    // Restore context state
    ctx.restore();
  };
  
  /**
   * Calculate control points for smooth bezier curves
   * 
   * @param {Array} points - Array of {x, y} points
   * @param {Number} tension - Tension parameter (0-1)
   * @param {Boolean} closed - Whether the curve is closed
   * @returns {Object} Object with two arrays of control points
   */
  const calculateControlPoints = (points, tension = 0.5, closed = false) => {
    const p1 = [];
    const p2 = [];
    const n = points.length;
    
    // If not enough points for a curve, return empty control points
    if (n < 2) return { p1, p2 };
    
    // For a line, use simple control points
    if (n === 2) {
      // Calculate control points for a single segment
      const xc = (points[0].x + points[1].x) / 2;
      const yc = (points[0].y + points[1].y) / 2;
      
      p1.push({ x: xc, y: yc });
      p2.push({ x: xc, y: yc });
      
      return { p1, p2 };
    }
    
    // Handle multi-point curves
    
    // Function to get point with wrapping for closed curves
    const getPoint = (i) => {
      if (closed) {
        // Wrap around for closed curves
        return points[(i + n) % n];
      } else {
        // Clamp to endpoints for open curves
        return points[Math.max(0, Math.min(n - 1, i))];
      }
    };
    
    // Calculate control points for each segment
    for (let i = 0; i < n; i++) {
      const prev = getPoint(i - 1);
      const curr = getPoint(i);
      const next = getPoint(i + 1);
      const nextNext = getPoint(i + 2);
      
      // Calculate tangent direction
      const dx = (next.x - prev.x) * tension;
      const dy = (next.y - prev.y) * tension;
      
      // Control points are offset from point in tangent direction
      p1.push({ x: curr.x + dx / 3, y: curr.y + dy / 3 });
      
      // Next control point
      const dx2 = (nextNext.x - curr.x) * tension;
      const dy2 = (nextNext.y - curr.y) * tension;
      
      p2.push({ x: next.x - dx2 / 3, y: next.y - dy2 / 3 });
    }
    
    return { p1, p2 };
  };
  
  /**
   * Draw a point/marker at specified coordinates
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   * @param {Number} radius - Point radius
   * @param {String} fillColor - Fill color
   * @param {String} strokeColor - Stroke color
   * @param {Number} lineWidth - Stroke width
   * @param {String} shape - Shape: 'circle', 'square', 'triangle', 'cross', 'plus'
   */
  export const drawPoint = (
    ctx, 
    x, 
    y, 
    radius = 5, 
    fillColor = 'red', 
    strokeColor = 'black', 
    lineWidth = 1,
    shape = 'circle'
  ) => {
    // Save context state
    ctx.save();
    
    switch (shape) {
      case 'square':
        ctx.beginPath();
        ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x + radius, y + radius);
        ctx.lineTo(x - radius, y + radius);
        ctx.closePath();
        break;
        
      case 'cross':
        ctx.beginPath();
        ctx.moveTo(x - radius, y - radius);
        ctx.lineTo(x + radius, y + radius);
        ctx.moveTo(x + radius, y - radius);
        ctx.lineTo(x - radius, y + radius);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = fillColor;
        ctx.stroke();
        ctx.restore();
        return;
        
      case 'plus':
        ctx.beginPath();
        ctx.moveTo(x - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x, y + radius);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = fillColor;
        ctx.stroke();
        ctx.restore();
        return;
        
      case 'circle':
      default:
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        break;
    }
    
    // Fill and stroke the shape
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    if (lineWidth > 0) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
    }
    
    // Restore context state
    ctx.restore();
  };
  
  /**
   * Draw text on the canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {String} text - Text to draw
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   * @param {Object} options - Text drawing options
   */
  export const drawText = (
    ctx, 
    text, 
    x, 
    y, 
    options = {}
  ) => {
    const {
      font = '12px Arial',
      fillColor = 'black',
      strokeColor = null,
      lineWidth = 0,
      textAlign = 'center',
      textBaseline = 'middle',
      maxWidth = undefined,
      angle = 0,
      backgroundColor = null,
      padding = 0
    } = options;
    
    // Save context state
    ctx.save();
    
    // Set text properties
    ctx.font = font;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    
    // Apply rotation if specified
    if (angle !== 0) {
      ctx.translate(x, y);
      ctx.rotate(angle);
      x = 0;
      y = 0;
    }
    
    // Draw background if specified
    if (backgroundColor) {
      const metrics = ctx.measureText(text);
      const width = metrics.width + padding * 2;
      const height = parseInt(font.split('px')[0], 10) + padding * 2;
      
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        x - (textAlign === 'center' ? width / 2 : (textAlign === 'right' ? width : 0)),
        y - (textBaseline === 'middle' ? height / 2 : (textBaseline === 'bottom' ? height : 0)),
        width,
        height
      );
    }
    
    // Draw text
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y, maxWidth);
    
    // Stroke text if specified
    if (strokeColor && lineWidth > 0) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(text, x, y, maxWidth);
    }
    
    // Restore context state
    ctx.restore();
  };
  
  /**
   * Draw a histogram/bar chart on canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} data - Array of values
   * @param {Number} width - Total width available
   * @param {Number} height - Total height available
   * @param {Object} options - Display options
   */
  export const drawHistogram = (
    ctx, 
    data, 
    width, 
    height, 
    options = {}
  ) => {
    if (!data || data.length === 0) return;
    
    const {
      barColor = 'blue',
      barSpacing = 1,
      borderColor = 'rgba(0, 0, 0, 0.5)',
      borderWidth = 1,
      baseline = height,
      centered = false,
      maxValue = Math.max(...data),
      minValue = Math.min(...data)
    } = options;
    
    // Save context state
    ctx.save();
    
    // Calculate bar width
    const totalBars = data.length;
    const barWidth = (width - (totalBars - 1) * barSpacing) / totalBars;
    
    // Calculate value range
    const valueRange = maxValue - minValue;
    
    // Draw each bar
    for (let i = 0; i < totalBars; i++) {
      const value = data[i];
      const normalizedValue = valueRange !== 0 ? (value - minValue) / valueRange : 0.5;
      
      // Calculate bar dimensions
      const x = i * (barWidth + barSpacing);
      let barHeight = normalizedValue * height;
      let y = baseline - barHeight;
      
      // For centered histograms (e.g., for positive and negative values)
      if (centered) {
        const zeroY = baseline - ((0 - minValue) / valueRange) * height;
        if (value >= 0) {
          y = zeroY - barHeight;
          barHeight = normalizedValue * height;
        } else {
          y = zeroY;
          barHeight = -normalizedValue * height;
        }
      }
      
      // Draw bar
      ctx.fillStyle = typeof barColor === 'function' ? barColor(value, i) : barColor;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw border if needed
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(x, y, barWidth, barHeight);
      }
    }
    
    // Restore context state
    ctx.restore();
  };
  
  /**
   * Draw a circular indicator/gauge
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Number} x - Center X coordinate
   * @param {Number} y - Center Y coordinate
   * @param {Number} radius - Radius of the gauge
   * @param {Number} value - Current value (0-1)
   * @param {Object} options - Display options
   */
  export const drawGauge = (
    ctx, 
    x, 
    y, 
    radius, 
    value, 
    options = {}
  ) => {
    const {
      startAngle = -Math.PI * 0.75,
      endAngle = Math.PI * 0.75,
      lineWidth = 10,
      trackColor = 'rgba(0, 0, 0, 0.1)',
      progressColor = 'blue',
      showValue = true,
      valueFormat = (val) => `${Math.round(val * 100)}%`,
      counterClockwise = false
    } = options;
    
    // Clamp value to 0-1 range
    value = Math.max(0, Math.min(1, value));
    
    // Calculate angles
    const angleRange = endAngle - startAngle;
    const valueAngle = startAngle + value * angleRange * (counterClockwise ? -1 : 1);
    
    // Save context state
    ctx.save();
    
    // Draw track (background)
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Draw progress
    ctx.beginPath();
    ctx.arc(
      x, 
      y, 
      radius, 
      startAngle, 
      valueAngle, 
      counterClockwise
    );
    ctx.strokeStyle = progressColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Draw value text if enabled
    if (showValue) {
      drawText(ctx, valueFormat(value), x, y, {
        font: `${radius / 3}px Arial`,
        fillColor: 'black',
        textAlign: 'center',
        textBaseline: 'middle'
      });
    }
    
    // Restore context state
    ctx.restore();
  };
  