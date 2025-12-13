import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalMediaState } from '../utils/types';

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 }
};

export function useLocalMedia(): LocalMediaState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);

  // Sync ref for cleanup
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Initial Media Setup
  useEffect(() => {
    let mounted = true;

    const initMedia = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: VIDEO_CONSTRAINTS
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
        if (mounted) setError("Could not access camera/microphone. Check permissions.");
      }
    };

    initMedia();

    // Cleanup function to stop tracks
    const stopTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    // Handle tab close/reload
    window.addEventListener('beforeunload', stopTracks);

    return () => {
      mounted = false;
      window.removeEventListener('beforeunload', stopTracks);
      stopTracks();
    };
  }, []);

  const toggleAudio = useCallback(() => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  }, [stream]);

  const toggleVideo = useCallback(async () => {
    if (!stream) return;

    if (isVideoEnabled) {
      // Turn Video OFF
      // 1. Stop the video track to ensure the camera hardware/light turns off
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => track.stop());

      // 2. Create a new MediaStream with ONLY the existing audio tracks
      // This preserves the microphone session without interruption
      const audioTracks = stream.getAudioTracks();
      const newStream = new MediaStream(audioTracks);
      
      setStream(newStream);
      setIsVideoEnabled(false);
    } else {
      // Turn Video ON
      try {
        // 1. Request a new video track
        const videoStream = await navigator.mediaDevices.getUserMedia({
            video: VIDEO_CONSTRAINTS
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        
        // 2. Re-combine existing audio tracks with the new video track
        const audioTracks = stream.getAudioTracks();
        const newStream = new MediaStream([...audioTracks, newVideoTrack]);
        
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