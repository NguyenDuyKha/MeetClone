import { useState, useEffect, useCallback } from 'react';
import { Participant } from '../utils/types';

const MOCK_NAMES = [
  "Alice Johnson", "Bob Smith", "Charlie Davis", "Dana Lee", "Evan Wright",
  "Fiona Green", "George King", "Hannah Scott", "Ian Baker", "Julia Hill",
  "Kevin Young", "Laura Adams", "Mike Carter", "Nina Perez", "Oscar Nelson"
];

export function useMockRoom(
  localStream: MediaStream | null, 
  isJoined: boolean,
  localScreenStream: MediaStream | null,
  localName: string,
  isAudioEnabled: boolean,
  isVideoEnabled: boolean
) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [screenSharingId, setScreenSharingId] = useState<string | null>(null);

  // Initialize local participant (Camera)
  useEffect(() => {
    if (!isJoined) return;

    setParticipants(prev => {
        if (prev.some(p => p.id === 'local-user')) {
             // Update name if it changed
             return prev.map(p => p.id === 'local-user' ? { ...p, name: localName } : p);
        }

        const localParticipant: Participant = {
            id: 'local-user',
            name: localName || 'You',
            isLocal: true,
            hasAudio: isAudioEnabled,
            hasVideo: isVideoEnabled,
            isScreenSharing: false,
            isSpeaking: false,
            stream: localStream || undefined
        };
        return [localParticipant, ...prev];
    });
  }, [isJoined, localName]); 

  // Update local camera stream and media states
  useEffect(() => {
    setParticipants(prev => prev.map(p => 
      p.id === 'local-user' ? { 
          ...p, 
          stream: localStream || undefined,
          hasAudio: isAudioEnabled,
          hasVideo: isVideoEnabled
      } : p
    ));
  }, [localStream, isAudioEnabled, isVideoEnabled]);

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
                name: `${localName || 'You'} (Presentation)`,
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
  }, [localScreenStream, localName]);

  // Manual helper to add a user for UI testing
  const addDummyParticipant = () => {
     const id = `user-added-${Date.now()}`;
     const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
     const newPeer: Participant = {
        id,
        name,
        isLocal: false,
        hasAudio: true, // Default to true for UI check
        hasVideo: false, // Default to false (avatar) for manual add
        isScreenSharing: false,
        isSpeaking: false,
        avatarUrl: `https://picsum.photos/seed/${id}/200`
     };
     setParticipants(prev => [...prev, newPeer]);
  };

  return {
    participants,
    screenSharingId,
    addDummyParticipant
  };
}