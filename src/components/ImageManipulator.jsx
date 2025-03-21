import React, { useState, useRef, useEffect, useCallback } from 'react';

// Custom hook for managing image state and filters
const useImageState = () => {
    const [imageSource, setImageSource] = useState("/api/placeholder/500/300");
    const [originalImage, setOriginalImage] = useState(null);
    const [showGrid, setShowGrid] = useState(false);
    const [imageInfo, setImageInfo] = useState({
        width: 0,
        height: 0,
        avgColor: { r: 0, g: 0, b: 0 },
    });

    // Filter states
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        grayscale: 0,
        invert: 0
    });

    // RGB Channel controls - initializing to 100 as default
    const [rgbChannels, setRgbChannels] = useState({
        r: 100,
        g: 100,
        b: 100
    });

    const [channelLock, setChannelLock] = useState({
        r: false,
        g: false,
        b: false,
        all: false
    });

    // Transform states
    const [rotate, setRotate] = useState(0);
    const [scale, setScale] = useState(100);
    const [flipX, setFlipX] = useState(false);
    const [flipY, setFlipY] = useState(false);

    // History states
    const [imageHistory, setImageHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Calculate image info from image data
    const calculateImageInfo = useCallback((img) => {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });

        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        let r = 0, g = 0, b = 0;

        // Sample every 10th pixel for performance
        for (let i = 0; i < data.length; i += 40) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }

        const pixelCount = data.length;
        const sampledPixels = pixelCount;

        // Calculate average RGB values
        const avgR = Math.round(r / sampledPixels);
        const avgG = Math.round(g / sampledPixels);
        const avgB = Math.round(b / sampledPixels);

        // Update RGB channel values to match image's average colors
        // Converting 0-255 range to 0-100 percentage for slider
        setRgbChannels({
            r: 100,  // Starting with 100% as default, will be adjusted when image is analyzed
            g: 100,
            b: 100
        });

        return {
            width: img.width,
            height: img.height,
            avgColor: {
                r: avgR,
                g: avgG,
                b: avgB
            }
        };
    }, []);

    // Add current state to history
    const addToHistory = useCallback((source) => {
        if (historyIndex !== imageHistory.length - 1) {
            setImageHistory(prevHistory => prevHistory.slice(0, historyIndex + 1));
        }

        setImageHistory(prevHistory => [...prevHistory, {
            source,
            filters: { ...filters },
            rgbChannels: { ...rgbChannels },
            rotate,
            scale,
            flipX,
            flipY
        }]);

        setHistoryIndex(prevIndex => prevIndex + 1);
    }, [historyIndex, imageHistory.length, filters, rgbChannels, rotate, scale, flipX, flipY]);

    // Undo/Redo functions
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const prevState = imageHistory[newIndex];

            setImageSource(prevState.source);
            setFilters(prevState.filters);
            setRgbChannels(prevState.rgbChannels || { r: 100, g: 100, b: 100 });
            setRotate(prevState.rotate);
            setScale(prevState.scale || 100);
            setFlipX(prevState.flipX);
            setFlipY(prevState.flipY);
            setHistoryIndex(newIndex);
        }
    }, [historyIndex, imageHistory]);

    const redo = useCallback(() => {
        if (historyIndex < imageHistory.length - 1) {
            const newIndex = historyIndex + 1;
            const nextState = imageHistory[newIndex];

            setImageSource(nextState.source);
            setFilters(nextState.filters);
            setRgbChannels(nextState.rgbChannels || { r: 100, g: 100, b: 100 });
            setRotate(nextState.rotate);
            setScale(nextState.scale || 100);
            setFlipX(nextState.flipX);
            setFlipY(nextState.flipY);
            setHistoryIndex(newIndex);
        }
    }, [historyIndex, imageHistory]);

    // Reset all filters
    const resetFilters = useCallback(() => {
        setFilters({
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            grayscale: 0,
            invert: 0
        });

        // Reset RGB channels to 100% (neutral)
        setRgbChannels({
            r: 100,
            g: 100,
            b: 100
        });

        setRotate(0);
        setScale(100);
        setFlipX(false);
        setFlipY(false);

        // Add to history
        addToHistory(imageSource);
    }, [imageSource, addToHistory]);

    return {
        imageSource, setImageSource,
        originalImage, setOriginalImage,
        showGrid, setShowGrid,
        imageInfo, setImageInfo,
        filters, setFilters,
        rgbChannels, setRgbChannels,
        channelLock, setChannelLock,
        rotate, setRotate,
        scale, setScale,
        flipX, setFlipX,
        flipY, setFlipY,
        imageHistory, historyIndex,
        calculateImageInfo,
        addToHistory,
        undo, redo, resetFilters
    };
};

// Matrix operations for image processing
const ImageMatrix = {
    // Convert RGB to brightness/contrast matrix
    createBrightnessMatrix: (brightness, contrast) => {
        const b = brightness / 100;
        const c = contrast / 100;

        // Normalized contrast factor (1 is no change)
        const cf = c * 2; // Scale for more noticeable effect

        // Contrast is applied as a matrix operation with offset
        const offset = 128 * (1 - cf);

        return [
            [cf * b, 0, 0, 0, offset * b],
            [0, cf * b, 0, 0, offset * b],
            [0, 0, cf * b, 0, offset * b],
            [0, 0, 0, 1, 0]
        ];
    },

    // Create saturation matrix
    createSaturationMatrix: (saturation) => {
        // Convert to 0-2 range where 1 is normal
        const s = saturation / 100;

        // Constants for relative luminance
        const lumR = 0.3086;
        const lumG = 0.6094;
        const lumB = 0.0820;

        // Create saturation matrix
        const sr = (1 - s) * lumR;
        const sg = (1 - s) * lumG;
        const sb = (1 - s) * lumB;

        return [
            [sr + s, sr, sr, 0, 0],
            [sg, sg + s, sg, 0, 0],
            [sb, sb, sb + s, 0, 0],
            [0, 0, 0, 1, 0]
        ];
    },

    // Create hue rotation matrix
    createHueMatrix: (hue) => {
        const angle = (hue * Math.PI) / 180;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        // Constants for relative luminance
        const lumR = 0.213;
        const lumG = 0.715;
        const lumB = 0.072;

        // Create hue rotation matrix
        return [
            [lumR + cos * (1 - lumR) + sin * (-lumR), lumG + cos * (-lumG) + sin * (-lumG), lumB + cos * (-lumB) + sin * (1 - lumB), 0, 0],
            [lumR + cos * (-lumR) + sin * (0.143), lumG + cos * (1 - lumG) + sin * (0.140), lumB + cos * (-lumB) + sin * (-0.283), 0, 0],
            [lumR + cos * (-lumR) + sin * (-(1 - lumR)), lumG + cos * (-lumG) + sin * (lumG), lumB + cos * (1 - lumB) + sin * (lumB), 0, 0],
            [0, 0, 0, 1, 0]
        ];
    },

    // Create grayscale matrix
    createGrayscaleMatrix: (value) => {
        // 0 = no grayscale, 1 = full grayscale
        const g = value / 100;

        // Constants for relative luminance
        const lumR = 0.2126;
        const lumG = 0.7152;
        const lumB = 0.0722;

        // Create grayscale matrix with interpolation
        return [
            [lumR * g + (1 - g), lumG * g, lumB * g, 0, 0],
            [lumR * g, lumG * g + (1 - g), lumB * g, 0, 0],
            [lumR * g, lumG * g, lumB * g + (1 - g), 0, 0],
            [0, 0, 0, 1, 0]
        ];
    },

    // Create invert matrix
    createInvertMatrix: (value) => {
        // 0 = no inversion, 1 = full inversion
        const i = value / 100;

        return [
            [1 - 2 * i, 0, 0, 0, 255 * i],
            [0, 1 - 2 * i, 0, 0, 255 * i],
            [0, 0, 1 - 2 * i, 0, 255 * i],
            [0, 0, 0, 1, 0]
        ];
    },

    // Create RGB channel matrix
    createRGBMatrix: (r, g, b) => {
        return [
            [r / 100, 0, 0, 0, 0],
            [0, g / 100, 0, 0, 0],
            [0, 0, b / 100, 0, 0],
            [0, 0, 0, 1, 0]
        ];
    },

    // Multiply two matrices
    multiplyMatrix: (m1, m2) => {
        const result = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ];

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 5; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += m1[i][k] * m2[k][j];
                }
                // Handle the last column separately (the constant term)
                if (j === 4) {
                    sum += m1[i][4];
                }
                result[i][j] = sum;
            }
        }

        return result;
    },

    // Apply matrix to a pixel
    applyMatrixToPixel: (matrix, r, g, b, a) => {
        return {
            r: Math.min(255, Math.max(0, matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b + matrix[0][4])),
            g: Math.min(255, Math.max(0, matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b + matrix[1][4])),
            b: Math.min(255, Math.max(0, matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b + matrix[2][4])),
            a: a
        };
    },

    // Apply matrix to image data
    applyMatrix: (imageData, matrix) => {
        const data = imageData.data;

        // Process 4 pixels at a time for performance
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            const newPixel = ImageMatrix.applyMatrixToPixel(matrix, r, g, b, a);

            data[i] = newPixel.r;
            data[i + 1] = newPixel.g;
            data[i + 2] = newPixel.b;
            // Alpha remains unchanged
        }

        return imageData;
    },

    // Apply Gaussian blur
    applyBlur: (imageData, radius) => {
        if (radius <= 0) return imageData;

        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Create a copy of the image data
        const output = new Uint8ClampedArray(data);

        // Standard deviation
        const sigma = radius / 2;
        const sigma2 = 2 * sigma * sigma;

        // Calculate kernel size based on radius
        const kernelSize = Math.max(3, Math.ceil(radius * 2 + 1));
        const halfKernel = Math.floor(kernelSize / 2);

        // Create Gaussian kernel
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

        // Create a new ImageData object
        const result = new ImageData(output, width, height);
        return result;
    },

    // Combine all filter matrices
    createFilterMatrix: (filters, rgbChannels) => {
        // Start with RGB channel adjustments
        let matrix = ImageMatrix.createRGBMatrix(
            rgbChannels.r,
            rgbChannels.g,
            rgbChannels.b
        );

        // Apply brightness and contrast
        const bcMatrix = ImageMatrix.createBrightnessMatrix(
            filters.brightness,
            filters.contrast
        );
        matrix = ImageMatrix.multiplyMatrix(bcMatrix, matrix);

        // Apply saturation
        const satMatrix = ImageMatrix.createSaturationMatrix(filters.saturation);
        matrix = ImageMatrix.multiplyMatrix(satMatrix, matrix);

        // Apply hue rotation
        const hueMatrix = ImageMatrix.createHueMatrix(filters.hue);
        matrix = ImageMatrix.multiplyMatrix(hueMatrix, matrix);

        // Apply grayscale
        const grayMatrix = ImageMatrix.createGrayscaleMatrix(filters.grayscale);
        matrix = ImageMatrix.multiplyMatrix(grayMatrix, matrix);

        // Apply invert
        const invertMatrix = ImageMatrix.createInvertMatrix(filters.invert);
        matrix = ImageMatrix.multiplyMatrix(invertMatrix, matrix);

        return matrix;
    }
};

// ImagePreview component
const ImagePreview = ({
    canvasRef, gridCanvasRef, showGrid
}) => {
    return (
        <div className="flex-1 mb-4">
            <div className="bg-white p-2 rounded shadow-inner flex items-center justify-center h-80 relative">
                <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full object-contain"
                />
                {showGrid && (
                    <canvas
                        ref={gridCanvasRef}
                        className="absolute top-0 left-0 pointer-events-none"
                    />
                )}
            </div>
        </div>
    );
};

// Image Information Panel
const ImageInfo = ({ imageInfo, scale }) => {
    return (
        <div className="bg-white p-3 rounded shadow mt-2">
            <h3 className="font-semibold mb-2">Image Information</h3>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <p className="text-sm">Dimensions: {imageInfo.width} × {imageInfo.height}px</p>
                    <p className="text-sm">Scale: {scale}%</p>
                    <p className="text-sm">Effective Size: {Math.round(imageInfo.width * scale / 100)} × {Math.round(imageInfo.height * scale / 100)}px</p>
                </div>
                <div>
                    <p className="text-sm">Average RGB:
                        <span className="inline-block ml-2 w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: `rgb(${imageInfo.avgColor.r}, ${imageInfo.avgColor.g}, ${imageInfo.avgColor.b})` }}></span>
                        <span className="ml-1">[{imageInfo.avgColor.r}, {imageInfo.avgColor.g}, {imageInfo.avgColor.b}]</span>
                    </p>
                    <div className="mt-2 flex flex-col gap-1">
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                            <div className="h-2 bg-red-500" style={{ width: `${imageInfo.avgColor.r / 2.55}%` }}></div>
                            <span className="ml-1 text-xs">{imageInfo.avgColor.r}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            <div className="h-2 bg-green-500" style={{ width: `${imageInfo.avgColor.g / 2.55}%` }}></div>
                            <span className="ml-1 text-xs">{imageInfo.avgColor.g}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                            <div className="h-2 bg-blue-500" style={{ width: `${imageInfo.avgColor.b / 2.55}%` }}></div>
                            <span className="ml-1 text-xs">{imageInfo.avgColor.b}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// RGBControls component
const RGBControls = ({
    rgbChannels, channelLock,
    onChannelChange, onChannelLockToggle,
    onFilterChangeEnd
}) => {
    return (
        <div>
            <h3 className="font-semibold mb-2">RGB Channels</h3>

            {['r', 'g', 'b'].map(channel => {
                const colorMap = {
                    r: 'red',
                    g: 'green',
                    b: 'blue'
                };

                const colorClass = {
                    r: 'bg-red-500',
                    g: 'bg-green-500',
                    b: 'bg-blue-100'
                };

                const lockColorClass = {
                    r: 'bg-red-100',
                    g: 'bg-green-100',
                    b: 'bg-blue-100'
                };

                return (
                    <div className="mb-3" key={channel}>
                        <div className="flex justify-between items-center">
                            <label htmlFor={channel} className="text-sm flex items-center">
                                <span className={`w-3 h-3 inline-block ${colorClass[channel]} mr-1 rounded-full`}></span>
                                {colorMap[channel]}
                            </label>
                            <div className="flex items-center">
                                <span className="text-sm mr-2">{rgbChannels[channel]}%</span>
                                <button
                                    onClick={() => onChannelLockToggle(channel)}
                                    className={`w-6 h-6 flex items-center justify-center rounded ${channelLock[channel] ? lockColorClass[channel] : 'bg-gray-100'}`}
                                >
                                    <span className="text-xs">{channelLock[channel] ? '🔒' : '🔓'}</span>
                                </button>
                            </div>
                        </div>
                        <input
                            type="range"
                            id={channel}
                            name={channel}
                            min="0"
                            max="200"
                            value={rgbChannels[channel]}
                            onChange={onChannelChange}
                            onMouseUp={() => onFilterChangeEnd()}
                            onTouchEnd={() => onFilterChangeEnd()}
                            className="w-full"
                        />
                    </div>
                );
            })}

            {/* Lock All Channels */}
            <div className="flex justify-center mt-2">
                <button
                    onClick={() => onChannelLockToggle('all')}
                    className={`px-3 py-1 rounded text-sm ${channelLock.all ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
                >
                    {channelLock.all ? 'Unlock All Channels' : 'Lock All Channels'}
                </button>
            </div>
        </div>
    );
};

// FilterControls component
const FilterControls = ({ filters, onFilterChange, onFilterChangeEnd }) => {
    // Filter configuration
    const filterConfig = [
        { name: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%', defaultValue: 100 },
        { name: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%', defaultValue: 100 },
        { name: 'saturation', label: 'Saturation', min: 0, max: 200, unit: '%', defaultValue: 100 },
        { name: 'hue', label: 'Hue Rotate', min: 0, max: 360, unit: '°', defaultValue: 0 },
        { name: 'blur', label: 'Blur', min: 0, max: 10, unit: 'px', defaultValue: 0, step: 0.1 },
        { name: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%', defaultValue: 0 },
        { name: 'invert', label: 'Invert', min: 0, max: 100, unit: '%', defaultValue: 0 }
    ];

    return (
        <div>
            <h3 className="font-semibold mb-2">Adjustments</h3>

            {filterConfig.map(filter => (
                <div className="mb-3" key={filter.name}>
                    <div className="flex justify-between">
                        <label htmlFor={filter.name} className="text-sm">{filter.label}</label>
                        <span className="text-sm">{filters[filter.name]}{filter.unit}</span>
                    </div>
                    <input
                        type="range"
                        id={filter.name}
                        name={filter.name}
                        min={filter.min}
                        max={filter.max}
                        step={filter.step || 1}
                        value={filters[filter.name]}
                        onChange={onFilterChange}
                        onMouseUp={() => onFilterChangeEnd()}
                        onTouchEnd={() => onFilterChangeEnd()}
                        className="w-full"
                    />
                </div>
            ))}
        </div>
    );
};

// TransformControls component
const TransformControls = ({
    rotate, setRotate,
    scale, setScale,
    flipX, setFlipX,
    flipY, setFlipY,
    onFilterChangeEnd
}) => {
    return (
        <div>
            <h3 className="font-semibold mb-2">Transform</h3>

            {/* Scale */}
            <div className="mb-3">
                <div className="flex justify-between">
                    <label htmlFor="scale" className="text-sm">Scale</label>
                    <span className="text-sm">{scale}%</span>
                </div>
                <input
                    type="range"
                    id="scale"
                    min="10"
                    max="200"
                    value={scale}
                    onChange={(e) => setScale(parseInt(e.target.value))}
                    onMouseUp={() => onFilterChangeEnd()}
                    onTouchEnd={() => onFilterChangeEnd()}
                    className="w-full"
                />
            </div>

            {/* Rotate */}
            <div className="mb-3">
                <div className="flex justify-between">
                    <label htmlFor="rotate" className="text-sm">Rotate</label>
                    <span className="text-sm">{rotate}°</span>
                </div>
                <input
                    type="range"
                    id="rotate"
                    min="0"
                    max="360"
                    value={rotate}
                    onChange={(e) => setRotate(parseInt(e.target.value))}
                    onMouseUp={() => onFilterChangeEnd()}
                    onTouchEnd={() => onFilterChangeEnd()}
                    className="w-full"
                />
            </div>

            {/* Flip buttons */}
            <div className="flex space-x-2">
                <button
                    onClick={() => {
                        setFlipX(!flipX);
                        onFilterChangeEnd();
                    }}
                    className={`flex-1 py-2 rounded ${flipX ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    Flip X
                </button>
                <button
                    onClick={() => {
                        setFlipY(!flipY);
                        onFilterChangeEnd();
                    }}
                    className={`flex-1 py-2 rounded ${flipY ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    Flip Y
                </button>
            </div>
        </div>
    );
};

// Main component
const ImageManipulator = () => {
    const {
        imageSource, setImageSource,
        originalImage, setOriginalImage,
        showGrid, setShowGrid,
        imageInfo, setImageInfo,
        filters, setFilters,
        rgbChannels, setRgbChannels,
        channelLock, setChannelLock,
        rotate, setRotate,
        scale, setScale,
        flipX, setFlipX,
        flipY, setFlipY,
        imageHistory, historyIndex,
        calculateImageInfo,
        addToHistory,
        undo, redo, resetFilters
    } = useImageState();

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const gridCanvasRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const processingTimerRef = useRef(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [saveFilename, setSaveFilename] = useState('');
    const [saveFormat, setSaveFormat] = useState('png');

    // Generate default filename with timestamp
    const generateDefaultFilename = useCallback(() => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        return `edited_image_${timestamp}`;
    }, []);

    // Open save dialog
    const handleSaveClick = useCallback(() => {
        setSaveFilename(generateDefaultFilename());
        setSaveDialogOpen(true);
    }, [generateDefaultFilename]);

    // Handle dialog close
    const handleSaveDialogClose = useCallback(() => {
        setSaveDialogOpen(false);
    }, []);

    // Save the image with specified filename
    const saveImage = useCallback((filename, format) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Ensure filename has proper extension
        const fileExtension = `.${format}`;
        const cleanFilename = filename.endsWith(fileExtension)
            ? filename
            : `${filename}${fileExtension}`;

        const link = document.createElement('a');
        link.download = cleanFilename;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();

        setSaveDialogOpen(false);
    }, []);

    // Handle save confirmation
    const handleSaveConfirm = useCallback(() => {
        saveImage(saveFilename || generateDefaultFilename(), saveFormat);
    }, [saveFilename, saveFormat, saveImage, generateDefaultFilename]);

    // Draw grid function - modified to properly attach to the image and transform with it
    const drawGrid = useCallback((gridCanvas, imageCanvas, transform) => {
        if (!gridCanvas || !imageCanvas) return;

        const ctx = gridCanvas.getContext('2d');
        const width = imageCanvas.width;
        const height = imageCanvas.height;

        // Set grid canvas size to match the image canvas
        gridCanvas.width = width;
        gridCanvas.height = height;

        // Clear the grid canvas
        ctx.clearRect(0, 0, width, height);

        // Apply the same transforms as the image for the grid
        ctx.save();

        // Grid size (pixels between lines)
        const gridSize = 20;

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw center lines with different color
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;

        // Vertical center line
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.restore();

        // Position the grid canvas directly over the image canvas
        gridCanvas.style.position = 'absolute';
        gridCanvas.style.left = `${imageCanvas.offsetLeft}px`;
        gridCanvas.style.top = `${imageCanvas.offsetTop}px`;
        gridCanvas.style.width = `${imageCanvas.offsetWidth}px`;
        gridCanvas.style.height = `${imageCanvas.offsetHeight}px`;
    }, []);

    // Apply filters to the image using matrix operations
    const applyFilters = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !originalImage) return;

        setIsProcessing(true);

        // Clear any existing processing timer
        if (processingTimerRef.current) {
            clearTimeout(processingTimerRef.current);
        }

        // Use a short timeout to debounce rapid changes and prevent UI lag
        processingTimerRef.current = setTimeout(() => {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Set canvas dimensions based on the original image
            let newWidth = originalImage.width * (scale / 100);
            let newHeight = originalImage.height * (scale / 100);

            // Update canvas size
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a temporary canvas for transformations
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;

            // Draw the original image to the temp canvas with transformations
            tempCtx.save();
            tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            tempCtx.rotate((rotate * Math.PI) / 180);
            tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            tempCtx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);
            tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.restore();

            // Get the image data
            let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            // Create a filter matrix combining all effects
            const filterMatrix = ImageMatrix.createFilterMatrix(filters, rgbChannels);

            // Apply the combined filter matrix
            imageData = ImageMatrix.applyMatrix(imageData, filterMatrix);

            // Apply blur separately if needed
            if (filters.blur > 0) {
                imageData = ImageMatrix.applyBlur(imageData, filters.blur);
            }

            // Draw filtered image to main canvas
            ctx.putImageData(imageData, 0, 0);

            // Update grid if needed
            if (showGrid && gridCanvasRef.current) {
                drawGrid(gridCanvasRef.current, canvas);
            }

            setIsProcessing(false);
        }, 10); // Short delay for better performance
    }, [originalImage, filters, rgbChannels, rotate, scale, flipX, flipY, showGrid, drawGrid]);

    // Update image when any parameter changes
    useEffect(() => {
        applyFilters();

        // Clean up the processing timer on unmount
        return () => {
            if (processingTimerRef.current) {
                clearTimeout(processingTimerRef.current);
            }
        };
    }, [applyFilters]);

    // Handle file upload
    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                setImageSource(event.target.result);

                // Calculate and set image info
                const info = calculateImageInfo(img);
                setImageInfo(info);

                // Initialize RGB channels to 100% (neutral) when loading a new image
                // This ensures we start with the original image colors
                setRgbChannels({
                    r: 100,
                    g: 100,
                    b: 100
                });

                // Add to history
                addToHistory(event.target.result);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }, [calculateImageInfo, setOriginalImage, setImageSource, setImageInfo, setRgbChannels, addToHistory]);

    // Add current state to history when sliders stop being adjusted
    const handleFilterChangeEnd = useCallback(() => {
        addToHistory(imageSource);
    }, [addToHistory, imageSource]);

    // Handle filter change with immediate update
    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: parseFloat(value)
        }));
    }, [setFilters]);

    // Handle RGB channel change
    const handleChannelChange = useCallback((e) => {
        const { name, value } = e.target;

        setRgbChannels(prev => {
            // If "all" is locked, update all channels
            if (channelLock.all) {
                return {
                    r: parseInt(value),
                    g: parseInt(value),
                    b: parseInt(value)
                };
            }

            // Update only the changed channel and any locked ones
            const newChannels = { ...prev };

            // Update the changed channel
            newChannels[name] = parseInt(value);

            // Check if other channels are locked to this one
            Object.keys(channelLock).forEach(channel => {
                if (channel !== 'all' && channel !== name && channelLock[channel]) {
                    newChannels[channel] = parseInt(value);
                }
            });

            return newChannels;
        });
    }, [channelLock, setRgbChannels]);

    // Toggle channel lock
    const toggleChannelLock = useCallback((channel) => {
        setChannelLock(prev => {
            const newLock = { ...prev };

            if (channel === 'all') {
                // If toggling "all", set all channels to the same state
                const newState = !prev.all;
                return {
                    r: newState,
                    g: newState,
                    b: newState,
                    all: newState
                };
            } else {
                // Toggle individual channel
                newLock[channel] = !prev[channel];

                // Check if all individual channels are locked or unlocked
                if (newLock.r && newLock.g && newLock.b) {
                    newLock.all = true;
                } else if (!newLock.r && !newLock.g && !newLock.b) {
                    newLock.all = false;
                }

                return newLock;
            }
        });
    }, [setChannelLock]);

    // Load default image on component mount
    useEffect(() => {
        const loadPlaceholderImage = () => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);

                // Calculate and set image info
                const info = calculateImageInfo(img);
                setImageInfo(info);

                // Initialize RGB channels to 100% (neutral) for the placeholder image
                setRgbChannels({
                    r: 100,
                    g: 100,
                    b: 100
                });

                // Add to history
                addToHistory(imageSource);
            };
            img.src = "/api/placeholder/500/300";
            img.crossOrigin = "Anonymous";
        };

        loadPlaceholderImage();

        // Add window resize event to update grid positioning
        const handleResize = () => {
            if (showGrid && canvasRef.current && gridCanvasRef.current) {
                drawGrid(gridCanvasRef.current, canvasRef.current);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [imageSource, calculateImageInfo, setImageInfo, setRgbChannels, addToHistory, showGrid, drawGrid]);

    // Monitor when canvas size changes to update grid
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            if (showGrid && canvasRef.current && gridCanvasRef.current) {
                requestAnimationFrame(() => {
                    drawGrid(gridCanvasRef.current, canvasRef.current);
                });
            }
        });

        if (canvasRef.current) {
            observer.observe(canvasRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [showGrid, drawGrid]);

    // Update grid when showGrid changes
    useEffect(() => {
        if (showGrid && canvasRef.current && gridCanvasRef.current) {
            drawGrid(gridCanvasRef.current, canvasRef.current);
        }
    }, [showGrid, drawGrid]);

    return (
        <div className="flex flex-col bg-gray-100 rounded-lg p-4 max-w-6xl mx-auto shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Image Manipulator</h2>
                <div className="space-x-2">
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Load Image
                    </button>
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`px-4 py-2 rounded ${showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        {showGrid ? 'Hide Grid' : 'Show Grid'}
                    </button>
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className={`px-4 py-2 rounded ${historyIndex <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800 text-white'}`}
                    >
                        Undo
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= imageHistory.length - 1}
                        className={`px-4 py-2 rounded ${historyIndex >= imageHistory.length - 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800 text-white'}`}
                    >
                        Redo
                    </button>
                    <button
                        onClick={resetFilters}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSaveClick}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                        Save
                    </button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            <div className="flex gap-6">
                {/* Left side - Image preview and info */}
                <div className="flex-1">
                    <ImagePreview
                        canvasRef={canvasRef}
                        gridCanvasRef={gridCanvasRef}
                        showGrid={showGrid}
                    />

                    {/* Image info panel */}
                    <ImageInfo
                        imageInfo={imageInfo}
                        scale={scale}
                    />
                    {/* Processing indicator */}
                    {isProcessing && (
                        <div className="text-xs text-blue-500 mb-1 text-center">Processing changes...</div>
                    )}
                </div>

                {/* Right side - Controls */}
                <div className="w-64 bg-white p-4 rounded shadow space-y-6">
                    {/* RGB Controls */}
                    <RGBControls
                        rgbChannels={rgbChannels}
                        channelLock={channelLock}
                        onChannelChange={handleChannelChange}
                        onChannelLockToggle={toggleChannelLock}
                        onFilterChangeEnd={handleFilterChangeEnd}
                    />

                    {/* Filter Controls */}
                    <FilterControls
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onFilterChangeEnd={handleFilterChangeEnd}
                    />

                    {/* Transform Controls */}
                    <TransformControls
                        rotate={rotate}
                        setRotate={setRotate}
                        scale={scale}
                        setScale={setScale}
                        flipX={flipX}
                        setFlipX={setFlipX}
                        flipY={flipY}
                        setFlipY={setFlipY}
                        onFilterChangeEnd={handleFilterChangeEnd}
                    />
                </div>
            </div>

            {/* Save Dialog */}
            {saveDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-4">Save Image</h3>
                        <div className="mb-4">
                            <label htmlFor="filename" className="block text-sm font-medium mb-1">Filename:</label>
                            <input
                                type="text"
                                id="filename"
                                value={saveFilename}
                                onChange={(e) => setSaveFilename(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="format" className="block text-sm font-medium mb-1">Format:</label>
                            <select
                                id="format"
                                value={saveFormat}
                                onChange={(e) => setSaveFormat(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="png">PNG</option>
                                <option value="jpeg">JPEG</option>
                                <option value="webp">WebP</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleSaveDialogClose}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConfirm}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageManipulator;
