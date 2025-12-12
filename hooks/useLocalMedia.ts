import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);

  // Keep ref in sync for cleanup
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    let mounted = true;

    const initMedia = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (mounted) {
          setStream(localStream);
          setIsAudioEnabled(true);
          setIsVideoEnabled(true);
        } else {
           localStream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        if (mounted) setError("Could not access camera/microphone. Please check permissions.");
      }
    };

    initMedia();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [stream]);

  const toggleVideo = useCallback(async () => {
    if (!stream) return;

    if (isVideoEnabled) {
      // --- Turn Video OFF ---
      // Stop the track to turn off hardware light
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }

      // Create new stream with ONLY audio
      // This triggers useRoom to see that video is missing, allowing it to null the sender
      const newStream = new MediaStream(stream.getAudioTracks());
      setStream(newStream);
      setIsVideoEnabled(false);

    } else {
      // --- Turn Video ON ---
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        
        // Add new track to stream
        const newTracks = [...stream.getAudioTracks(), newVideoTrack];
        const newStream = new MediaStream(newTracks);
        
        setStream(newStream);
        setIsVideoEnabled(true);
      } catch (err) {
        console.error("Error restarting video:", err);
        setError("Could not restart camera.");
      }
    }
  }, [stream, isVideoEnabled]);

  return {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    error
  };
}