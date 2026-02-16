import React from 'react';

interface LoadingProps {
  message?: string;
  fullHeight?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', fullHeight = false }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullHeight ? 'min-h-[60vh]' : 'py-12'
      }`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--accent)]"></div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
    </div>
  );
};

export default Loading;
