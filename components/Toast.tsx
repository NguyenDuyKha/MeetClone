import React from 'react';

interface Props {
  message: string | null;
}

export const Toast: React.FC<Props> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium backdrop-blur-sm animate-fade-in-down">
      {message}
    </div>
  );
};