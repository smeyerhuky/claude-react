// Simplified image processing class
const ImageProcessor = {
    // Create a combined matrix from all adjustments
    createMatrix: (adjustments) => {
      const { channels, filters } = adjustments;
  
      // Create initial matrices
      const channelMatrix = [
        [channels.r.value / 100, 0, 0, 0, 0],
        [0, channels.g.value / 100, 0, 0, 0],
        [0, 0, channels.b.value / 100, 0, 0],
        [0, 0, 0, 1, 0]
      ];
  
      // Apply min/max ranges
      for (const ch of ['r', 'g', 'b']) {
        const idx = ch === 'r' ? 0 : ch === 'g' ? 1 : 2;
        const range = channels[ch].max - channels[ch].min;
  
        if (range > 0) {
          const scale = 255 / range;
          channelMatrix[idx][idx] *= scale;
          channelMatrix[idx][4] = -channels[ch].min * scale;
        }
      }
  
      // Create and combine other matrices
      let matrix = channelMatrix;
  
      // Brightness/contrast
      const b = filters.brightness / 100;
      const c = filters.contrast / 100 * 2;
      const offset = 128 * (1 - c);
  
      const bcMatrix = [
        [c * b, 0, 0, 0, offset * b],
        [0, c * b, 0, 0, offset * b],
        [0, 0, c * b, 0, offset * b],
        [0, 0, 0, 1, 0]
      ];
  
      matrix = ImageProcessor.multiplyMatrices(bcMatrix, matrix);
  
      // Saturation
      const s = filters.saturation / 100;
      const lumR = 0.3086, lumG = 0.6094, lumB = 0.0820;
  
      const satMatrix = [
        [(1 - s) * lumR + s, (1 - s) * lumR, (1 - s) * lumR, 0, 0],
        [(1 - s) * lumG, (1 - s) * lumG + s, (1 - s) * lumG, 0, 0],
        [(1 - s) * lumB, (1 - s) * lumB, (1 - s) * lumB + s, 0, 0],
        [0, 0, 0, 1, 0]
      ];
  
      matrix = ImageProcessor.multiplyMatrices(satMatrix, matrix);
  
      // Grayscale
      if (filters.grayscale > 0) {
        const g = filters.grayscale / 100;
        const gLumR = 0.2126, gLumG = 0.7152, gLumB = 0.0722;
  
        const grayMatrix = [
          [gLumR * g + (1 - g), gLumG * g, gLumB * g, 0, 0],
          [gLumR * g, gLumG * g + (1 - g), gLumB * g, 0, 0],
          [gLumR * g, gLumG * g, gLumB * g + (1 - g), 0, 0],
          [0, 0, 0, 1, 0]
        ];
  
        matrix = ImageProcessor.multiplyMatrices(grayMatrix, matrix);
      }
  
      // Invert
      if (filters.invert > 0) {
        const i = filters.invert / 100;
  
        const invertMatrix = [
          [1 - 2 * i, 0, 0, 0, 255 * i],
          [0, 1 - 2 * i, 0, 0, 255 * i],
          [0, 0, 1 - 2 * i, 0, 255 * i],
          [0, 0, 0, 1, 0]
        ];
  
        matrix = ImageProcessor.multiplyMatrices(invertMatrix, matrix);
      }
  
      // Hue rotation
      if (filters.hue !== 0) {
        const angle = (filters.hue * Math.PI) / 180;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const hLumR = 0.213, hLumG = 0.715, hLumB = 0.072;
  
        const hueMatrix = [
          [hLumR + cos * (1 - hLumR) + sin * (-hLumR), hLumG + cos * (-hLumG) + sin * (-hLumG), hLumB + cos * (-hLumB) + sin * (1 - hLumB), 0, 0],
          [hLumR + cos * (-hLumR) + sin * (0.143), hLumG + cos * (1 - hLumG) + sin * (0.140), hLumB + cos * (-hLumB) + sin * (-0.283), 0, 0],
          [hLumR + cos * (-hLumR) + sin * (-(1 - hLumR)), hLumG + cos * (-hLumG) + sin * (hLumG), hLumB + cos * (1 - hLumB) + sin * (hLumB), 0, 0],
          [0, 0, 0, 1, 0]
        ];
  
        matrix = ImageProcessor.multiplyMatrices(hueMatrix, matrix);
      }
  
      return matrix;
    },
  
    // Multiply two matrices
    multiplyMatrices: (m1, m2) => {
      const result = Array(4).fill().map(() => Array(5).fill(0));
  
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
          let sum = 0;
          for (let k = 0; k < 4; k++) {
            sum += m1[i][k] * m2[k][j];
          }
          // Handle the last column (constant term)
          if (j === 4) {
            sum += m1[i][4];
          }
          result[i][j] = sum;
        }
      }
  
      return result;
    },
  
    // Apply matrix to image data
    applyMatrix: (imageData, matrix) => {
      const data = imageData.data;
  
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
  
        // Apply matrix to pixel
        data[i] = Math.max(0, Math.min(255, matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b + matrix[0][4]));
        data[i + 1] = Math.max(0, Math.min(255, matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b + matrix[1][4]));
        data[i + 2] = Math.max(0, Math.min(255, matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b + matrix[2][4]));
        // Alpha remains unchanged
      }
  
      return imageData;
    },
  
    // Apply blur
    applyBlur: (imageData, radius) => {
      if (radius <= 0) return imageData;
  
      const { width, height, data } = imageData;
      const output = new Uint8ClampedArray(data);
      const sigma = radius / 2;
      const sigma2 = 2 * sigma * sigma;
  
      // Create kernel
      const kernelSize = Math.max(3, Math.ceil(radius * 2 + 1));
      const halfKernel = Math.floor(kernelSize / 2);
      const kernel = [];
      let kernelSum = 0;
  
      for (let y = -halfKernel; y <= halfKernel; y++) {
        for (let x = -halfKernel; x <= halfKernel; x++) {
          const weight = Math.exp(-(x * x + y * y) / sigma2) / (Math.PI * sigma2);
          kernel.push(weight);
          kernelSum += weight;
        }
      }
  
      // Normalize kernel
      for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= kernelSum;
      }
  
      // Apply convolution
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, a = 0;
          let kernelIndex = 0;
  
          for (let ky = -halfKernel; ky <= halfKernel; ky++) {
            for (let kx = -halfKernel; kx <= halfKernel; kx++) {
              const pixelX = Math.min(width - 1, Math.max(0, x + kx));
              const pixelY = Math.min(height - 1, Math.max(0, y + ky));
  
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const weight = kernel[kernelIndex++];
  
              r += data[pixelIndex] * weight;
              g += data[pixelIndex + 1] * weight;
              b += data[pixelIndex + 2] * weight;
              a += data[pixelIndex + 3] * weight;
            }
          }
  
          const outIndex = (y * width + x) * 4;
          output[outIndex] = r;
          output[outIndex + 1] = g;
          output[outIndex + 2] = b;
          output[outIndex + 3] = a;
        }
      }
  
      return new ImageData(output, width, height);
    }
  };
  
  export default ImageProcessor;