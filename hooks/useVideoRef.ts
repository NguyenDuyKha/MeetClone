import { useCallback, useEffect, useState } from 'react';

export function useVideoRef(stream: MediaStream | undefined | null) {
  // We use a callback ref to be notified when the DOM node is mounted/unmounted.
  // Standard useRef does not trigger re-renders or effects when the current value changes.
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  
  const ref = useCallback((node: HTMLVideoElement | null) => {
    setVideoElement(node);
  }, []);

  // Track IDs state ensures we re-run the effect if tracks are added/removed 
  // even if the stream object identity remains the same.
  const [trackIds, setTrackIds] = useState<string>('');

  useEffect(() => {
    if (!stream) {
        setTrackIds('');
        return;
    }

    const updateTracks = () => {
        setTrackIds(stream.getTracks().map(t => t.id).join(','));
    };
    
    updateTracks();
    
    stream.addEventListener('addtrack', updateTracks);
    stream.addEventListener('removetrack', updateTracks);
    
    return () => {
        stream.removeEventListener('addtrack', updateTracks);
        stream.removeEventListener('removetrack', updateTracks);
    };
  }, [stream]);

  // This effect runs whenever the stream changes OR the video element instance changes (mounts)
  useEffect(() => {
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;
      
      const handlePlay = () => {
         if (videoElement.paused || videoElement.ended) {
             videoElement.play().catch(e => {
                 // Autoplay policies can block this, but usually allowed for muted/interaction
                 console.debug("Auto-play catch:", e);
             });
         }
      };

      handlePlay();

      // Listen for 'unmute' event on tracks (fires when remote enables video)
      const tracks = stream.getTracks();
      const onUnmute = () => {
          handlePlay();
      };
      
      tracks.forEach(t => t.addEventListener('unmute', onUnmute));
      
      // Handle metadata loaded (dimensions known)
      videoElement.addEventListener('loadedmetadata', handlePlay);

      return () => {
          tracks.forEach(t => t.removeEventListener('unmute', onUnmute));
          videoElement.removeEventListener('loadedmetadata', handlePlay);
          videoElement.srcObject = null;
      };
    } else {
      videoElement.srcObject = null;
    }
  }, [videoElement, stream, trackIds]);

  return ref;
}