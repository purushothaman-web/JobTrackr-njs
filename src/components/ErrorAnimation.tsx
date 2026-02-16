import React from 'react';

const ErrorAnimation = () => {
  return (
    <div className="relative h-64 w-64">
      {/* Ghost Body */}
      <div className="animate-float absolute inset-0 z-10 flex flex-col items-center justify-center">
        <div className="relative h-48 w-40">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-xl">
            <path
              d="M100 20C55.8172 20 20 55.8172 20 100V190C20 195.523 24.4772 200 30 200C32.221 200 34.3436 199.274 36.0599 198.019L50 187.828L63.9401 198.019C65.6564 199.274 67.779 200 70 200C72.221 200 74.3436 199.274 76.0599 198.019L90 187.828L103.94 198.019C105.656 199.274 107.779 200 110 200C112.221 200 114.344 199.274 116.06 198.019L130 187.828L143.94 198.019C145.656 199.274 147.779 200 150 200C152.221 200 154.344 199.274 156.06 198.019L170 187.828L183.94 198.019C185.656 199.274 187.779 200 190 200C195.523 200 200 195.523 200 190V100C200 55.8172 164.183 20 120 20H100Z"
              fill="white"
            />
            {/* Eyes */}
            <circle cx="70" cy="90" r="10" fill="#334155" />
            <circle cx="130" cy="90" r="10" fill="#334155" />
            {/* Mouth */}
            <path d="M85 130 Q100 150 115 130" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            {/* Blusdh */}
            <circle cx="50" cy="110" r="8" fill="#FFB1B1" opacity="0.6" />
            <circle cx="150" cy="110" r="8" fill="#FFB1B1" opacity="0.6" />
          </svg>
        </div>
      </div>
      
      {/* Shadow */}
      <div className="absolute bottom-4 left-1/2 h-4 w-32 -translate-x-1/2 transform rounded-full bg-slate-900/10 blur-sm animate-float-shadow"></div>
    </div>
  );
};

export default ErrorAnimation;
