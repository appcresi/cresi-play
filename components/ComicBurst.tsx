// ComicBurst.tsx
import React from 'react';

interface ComicBurstProps {
  text: string;
  className?: string;
}

const ComicBurst: React.FC<ComicBurstProps> = ({ text, className = '' }) => (
  <div className={`absolute transform rotate-12 ${className}`}>
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <path 
          d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" 
          fill="#FF6B6B" 
          stroke="black" 
          strokeWidth="2" 
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
        {text}
      </span>
    </div>
  </div>
);

export default ComicBurst;