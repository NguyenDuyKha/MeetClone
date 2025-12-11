import { useState, useEffect } from 'react';

export function useScreenShare() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleScreenShare = async () => {
    const isSharing = !!stream;

    if (isSharing) {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                track.onended = null;
            });
        }
        setStream(null);
    } else {
        try {
            setError(null);
            // Removing audio: true to prevent "Permission denied" on systems where audio share is blocked or restricted
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            setStream(displayStream);

            // Handle user clicking "Stop sharing" from the browser's native UI
            const videoTrack = displayStream.getVideoTracks()[0];
            videoTrack.onended = () => {
                setStream(null);
            };

        } catch (err) {
            console.error("Error starting screen share:", err);
            setError("Screen sharing was cancelled or denied.");
            setTimeout(() => setError(null), 5000);
        }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return { stream, error, toggleScreenShare };
}