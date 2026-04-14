import React from 'react';

interface LoadingBarProps {
  isLoading: boolean;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-blue-100/30">
      <div 
        className="h-full bg-blue-600 animate-loading-bar shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-300"
        style={{ width: '100%' }}
      />
    </div>
  );
};
