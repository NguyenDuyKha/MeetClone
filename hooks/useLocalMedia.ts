import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let localStream: MediaStream;

    const initMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setStream(localStream);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError("Could not access camera/microphone. Please check permissions.");
      }
    };

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
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

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [stream]);

  return {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    error
  };
}
