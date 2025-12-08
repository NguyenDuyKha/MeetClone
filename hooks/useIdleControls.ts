import { useState, useRef, useCallback, useEffect } from 'react';

export function useIdleControls(timeout = 3000) {
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<any>(null);

  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
        setShowControls(false);
    }, timeout);
  }, [timeout]);

  const clearIdleTimer = useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setShowControls(true);
  }, []);

  useEffect(() => {
      const handleUserActivity = () => resetIdleTimer();

      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('touchstart', handleUserActivity);

      resetIdleTimer();

      return () => {
          window.removeEventListener('mousemove', handleUserActivity);
          window.removeEventListener('click', handleUserActivity);
          window.removeEventListener('keydown', handleUserActivity);
          window.removeEventListener('touchstart', handleUserActivity);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
  }, [resetIdleTimer]);

  return { showControls, resetIdleTimer, clearIdleTimer };
}