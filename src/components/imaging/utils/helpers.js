/**
 * Debounce function - limits how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {Number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Create a throttled function that only invokes func at most once per wait period
   * @param {Function} func - The function to throttle
   * @param {Number} wait - Wait time in milliseconds
   * @returns {Function} - Throttled function
   */
  export function throttle(func, wait) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        return func(...args);
      }
    };
  }
  
  /**
   * Format bytes to human-readable size
   * @param {Number} bytes - Size in bytes
   * @param {Number} decimals - Decimal precision
   * @returns {String} - Formatted size
   */
  export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
  
  /**
   * Get file extension from filename
   * @param {String} filename - Name of the file
   * @returns {String} - File extension
   */
  export function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }
  
  /**
   * Generate a timestamp-based filename
   * @param {String} prefix - Prefix for the filename
   * @param {String} extension - File extension
   * @returns {String} - Generated filename
   */
  export function generateFilename(prefix = 'image', extension = 'png') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}_${timestamp}.${extension}`;
  }
  
  /**
   * Calculate the aspect ratio of dimensions
   * @param {Number} width - Width value
   * @param {Number} height - Height value
   * @returns {String} - Aspect ratio as string
   */
  export function calculateAspectRatio(width, height) {
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const divisor = gcd(width, height);
    
    return `${width / divisor}:${height / divisor}`;
  }
  
  /**
   * Create a canvas with the specified dimensions and return its context
   * @param {Number} width - Canvas width
   * @param {Number} height - Canvas height
   * @returns {Object} - Canvas context and element
   */
  export function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    return { ctx, canvas };
  }