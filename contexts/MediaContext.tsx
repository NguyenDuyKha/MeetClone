import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { LocalMediaState } from '../utils/types';

const MediaContext = createContext<LocalMediaState | null>(null);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mediaState = useLocalMedia();

  return (
    <MediaContext.Provider value={mediaState}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  return context;
};
