import React from 'react';

const ApertureLoader = () => {
  const colors = [
    '#3298db', // Blue
    '#e84c3d', // Red/Orange
    '#f1c40f', // Yellow
    '#2ecc71', // Green
    '#e67e22', // Orange
    '#34495e', // Dark Slate
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* Changed w-48 h-48 to w-12 h-12 for a small size */}
      <div className="relative w-12 h-12 animate-spin [animation-duration:2s]">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <mask id="aperture-mask-small">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <circle cx="50" cy="50" r="18" fill="black" />
            </mask>
          </defs>

          <g mask="url(#aperture-mask-small)">
            {[...Array(6)].map((_, i) => (
              <path
                key={i}
                d="M50 50 L100 50 A50 50 0 0 0 75 6.7 Z"
                fill={colors[i % colors.length]}
                transform={`rotate(${i * 60} 50 50)`}
                className="stroke-white stroke-[3px]" // Increased stroke slightly for visibility at small size
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default ApertureLoader;