import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-cyan-400 border-t-transparent ${sizeClasses[size] || sizeClasses.md} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}
