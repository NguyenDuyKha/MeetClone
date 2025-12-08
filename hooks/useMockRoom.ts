import { useState, useEffect, useCallback } from 'react';
import { Participant } from '../types';

const MOCK_NAMES = [
  "Alice Johnson", "Bob Smith", "Charlie Davis", "Dana Lee", "Evan Wright",
  "Fiona Green", "George King", "Hannah Scott", "Ian Baker", "Julia Hill",
  "Kevin Young", "Laura Adams", "Mike Carter", "Nina Perez", "Oscar Nelson"
];

export function useMockRoom(
  localStream: MediaStream | null, 
  isJoined: boolean,
  localScreenStream: MediaStream | null
) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [screenSharingId, setScreenSharingId] = useState<string | null>(null);

  // Initialize local participant (Camera)
  useEffect(() => {
    if (!isJoined) return;

    setParticipants(prev => {
        if (prev.some(p => p.id === 'local-user')) return prev;

        const localParticipant: Participant = {
            id: 'local-user',
            name: 'You',
            isLocal: true,
            hasAudio: true,
            hasVideo: true,
            isScreenSharing: false,
            isSpeaking: false,
            stream: localStream || undefined
        };
        return [localParticipant, ...prev];
    });
  }, [isJoined]);

  // Update local camera stream
  useEffect(() => {
    setParticipants(prev => prev.map(p => 
      p.id === 'local-user' ? { ...p, stream: localStream || undefined } : p
    ));
  }, [localStream]);

  // Manage Local Screen Share Participant
  useEffect(() => {
    if (localScreenStream) {
        // Add separate participant for screen share
        setParticipants(prev => {
            const exists = prev.some(p => p.id === 'local-screen');
            if (exists) {
                return prev.map(p => p.id === 'local-screen' ? { ...p, stream: localScreenStream } : p);
            }
            const screenParticipant: Participant = {
                id: 'local-screen',
                name: 'You (Presentation)',
                isLocal: true,
                hasAudio: false,
                hasVideo: true,
                isScreenSharing: true,
                isSpeaking: false,
                stream: localScreenStream
            };
            return [...prev, screenParticipant];
        });
        setScreenSharingId('local-screen');
    } else {
        // Remove screen share participant
        setParticipants(prev => prev.filter(p => p.id !== 'local-screen'));
        
        // Only clear ID if it was us sharing
        setScreenSharingId(prev => prev === 'local-screen' ? null : prev);
    }
  }, [localScreenStream]);

  // Simulate remote users joining
  useEffect(() => {
    if (!isJoined) return;

    const interval = setInterval(() => {
      if (participants.filter(p => !p.isLocal).length < 12 && Math.random() > 0.7) {
        const id = `user-${Date.now()}`;
        const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
        const newPeer: Participant = {
          id,
          name,
          isLocal: false,
          hasAudio: true,
          hasVideo: Math.random() > 0.2,
          isScreenSharing: false,
          isSpeaking: false,
          avatarUrl: `https://picsum.photos/seed/${id}/200`
        };
        setParticipants(prev => [...prev, newPeer]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isJoined, participants.length]);

  // Simulate speaking activity
  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => {
      setParticipants(prev => prev.map(p => ({
        ...p,
        isSpeaking: !p.isLocal && !p.isScreenSharing && Math.random() > 0.8
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, [isJoined]);

  // Mock Remote Screen Share Toggle
  const simulateRemoteScreenShare = useCallback(() => {
    const remoteUsers = participants.filter(p => !p.isLocal && !p.isScreenSharing);
    if (remoteUsers.length === 0) return;

    // Check if a remote user is already sharing
    const currentSharer = participants.find(p => !p.isLocal && p.isScreenSharing);

    if (currentSharer) {
      // Stop sharing
      setScreenSharingId(null);
      setParticipants(prev => prev.map(p => 
        p.id === currentSharer.id ? { ...p, isScreenSharing: false } : p
      ));
    } else {
      // Start sharing
      // Note: In a real app, a user might add a 2nd tile. 
      // For mock simplicity, we just flag the existing user as sharing to trigger UI changes.
      const sharer = remoteUsers[Math.floor(Math.random() * remoteUsers.length)];
      setScreenSharingId(sharer.id);
      setParticipants(prev => prev.map(p => 
        p.id === sharer.id ? { ...p, isScreenSharing: true } : p
      ));
    }
  }, [participants]);

  const addDummyParticipant = () => {
     const id = `user-added-${Date.now()}`;
     const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
     const newPeer: Participant = {
        id,
        name,
        isLocal: false,
        hasAudio: true,
        hasVideo: true,
        isScreenSharing: false,
        isSpeaking: false,
        avatarUrl: `https://picsum.photos/seed/${id}/200`
     };
     setParticipants(prev => [...prev, newPeer]);
  };

  return {
    participants,
    screenSharingId,
    simulateRemoteScreenShare,
    addDummyParticipant
  };
}