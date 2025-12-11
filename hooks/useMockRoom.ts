import { useState, useEffect } from 'react';
import { Participant } from '../utils/types';

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

  useEffect(() => {
    if (!isJoined) return;

    setParticipants(prev => {
        if (prev.some(p => p.id === 'local-user')) {
             return prev.map(p => p.id === 'local-user' ? { 
               ...p, 
               name: localName,
               isAudioEnabled,
               isVideoEnabled
             } : p);
        }

        const localParticipant: Participant = {
            id: 'local-user',
            name: localName || 'You',
            isLocal: true,
            isAudioEnabled,
            isVideoEnabled,
            isScreenSharing: false,
            stream: localStream || undefined,
            joinedAt: Date.now()
        };
        return [localParticipant, ...prev];
    });
  }, [isJoined, localName, isAudioEnabled, isVideoEnabled, localStream]); 

  useEffect(() => {
    if (localScreenStream) {
        setParticipants(prev => {
            const exists = prev.some(p => p.id === 'local-screen');
            if (exists) {
                return prev.map(p => p.id === 'local-screen' ? { ...p, stream: localScreenStream } : p);
            }
            const screenParticipant: Participant = {
                id: 'local-screen',
                name: `${localName || 'You'} (Presentation)`,
                isLocal: true,
                isAudioEnabled: false,
                isVideoEnabled: true,
                isScreenSharing: true,
                stream: localScreenStream,
                joinedAt: Date.now()
            };
            return [...prev, screenParticipant];
        });
        setScreenSharingId('local-screen');
    } else {
        setParticipants(prev => prev.filter(p => p.id !== 'local-screen'));
        setScreenSharingId(prev => prev === 'local-screen' ? null : prev);
    }
  }, [localScreenStream, localName]);

  const addDummyParticipant = () => {
     // No-op or minimal impl to satisfy interface
  };

  return {
    participants,
    screenSharingId,
    addDummyParticipant
  };
}