import React from 'react';

const ApertureLoader = () => {
  return (
    <div className="flex items-center justify-center p-16">
      <div className="relative w-24 h-24">
        
        {/* Layer 1: The Outer Slow Glow (Clockwise) */}
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite] opacity-30">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="gold-glow">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#gold-glow)" />
          </svg>
        </div>

        {/* Layer 2: The Main Iridescent Aperture (Counter-Clockwise) */}
        <div className="absolute inset-0 animate-[spin_4s_cubic-bezier(0.4,0,0.2,1)_infinite] direction-reverse">
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
            <defs>
              {/* Emerald to Teal Iridescence */}
              <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#6ee7b7" />
              </linearGradient>
            </defs>

            {[...Array(12)].map((_, i) => (
              <path
                key={i}
                d="M50 20 C60 20 75 35 50 50" // Elegant curved leaf shape
                stroke="url(#emerald-grad)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                transform={`rotate(${i * 30} 50 50)`}
                className="opacity-80"
              />
            ))}
          </svg>
        </div>

        {/* Layer 3: The Golden Iris (Fast Clockwise) */}
        <div className="absolute inset-2 animate-[spin_2s_ease-in-out_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <linearGradient id="gold-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            
            {[...Array(6)].map((_, i) => (
              <path
                key={i}
                d="M50 50 L70 35"
                stroke="url(#gold-line)"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${i * 60} 50 50)`}
              />
            ))}
          </svg>
        </div>

        {/* Center Point */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#fff] z-10" />
        </div>
      </div>
    </div>
  );
};

export default ApertureLoader;