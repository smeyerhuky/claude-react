import { useState, useEffect } from 'react';

const AnimationExample = () => {
  // Animation states
  const [position, setPosition] = useState(0);
  const [color, setColor] = useState('#3b82f6');
  const [size, setSize] = useState(50);
  const [shape, setShape] = useState('circle');
  const [isAnimating, setIsAnimating] = useState(true);

  // Animation effect
  useEffect(() => {
    if (!isAnimating) return;

    const timer = setInterval(() => {
      // Update position (0-100%)
      setPosition(prev => (prev >= 100 ? 0 : prev + 1));

      // Update color every 25 frames
      if (position % 25 === 0) {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
        setColor(colors[Math.floor(position / 25) % colors.length]);
      }

      // Pulse the size
      setSize(50 + Math.sin(position * 0.1) * 20);
    }, 50);

    return () => clearInterval(timer);
  }, [position, isAnimating]);

  // Toggle shape
  const toggleShape = () => {
    setShape(shape === 'circle' ? 'square' : 'circle');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-8">Animation Demo</h1>

      <div className="relative w-full max-w-md h-12 bg-gray-200 rounded-full mb-8">
        {/* Animated element */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out
                     ${shape === 'circle' ? 'rounded-full' : 'rounded-md'}`}
          style={{
            left: `${position}%`,
            transform: `translateX(-50%) translateY(-50%)`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color
          }}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isAnimating ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={toggleShape}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Toggle Shape
        </button>
      </div>
    </div>
  );
};

export default AnimationExample;
