import { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../libs/firebase';
import { ref, onValue, child, onChildAdded, DataSnapshot, off } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { Participant, SignalData, ParticipantData, ScreenShareData } from '../utils/types';
import { RoomService } from '../services/roomService';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

export function useRoom(
  roomId: string,
  localStream: MediaStream | null,
  screenStream: MediaStream | null,
  userName: string,
  isAudioEnabled: boolean,
  isVideoEnabled: boolean
) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [screenSharingId, setScreenSharingId] = useState<string | null>(null);
  
  // Persistent User ID for session
  const [userId] = useState(() => {
    const storageKey = `meet_uid_${roomId}`;
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) return stored;
        const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(storageKey, newId);
        return newId;
    }
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  });

  // --- Mutable State Refs (WebRTC & Data Snapshots) ---
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({}); 
  const streamsRef = useRef<Record<string, MediaStream>>({});
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const userNameRef = useRef(userName);
  
  const participantsDataRef = useRef<Record<string, ParticipantData>>({});
  const screensDataRef = useRef<Record<string, ScreenShareData>>({});

  // Sync refs
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { screenStreamRef.current = screenStream; }, [screenStream]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);

  // --- 1. Auth ---
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth failed:", err));
  }, []);

  // --- 2. Track Management (Sync local stream changes to PeerConnections) ---
  useEffect(() => {
    const connections = Object.entries(pcsRef.current);
    if (connections.length === 0) return;

    connections.forEach(([key, value]) => {
        const pc = value as RTCPeerConnection;
        if (key.includes('_screen') || key.includes('_viewer')) return;

        const transceivers = pc.getTransceivers();
        const newAudioTrack = localStream?.getAudioTracks()[0];
        const newVideoTrack = localStream?.getVideoTracks()[0];

        transceivers.forEach(transceiver => {
            const sender = transceiver.sender;
            const kind = transceiver.receiver.track.kind;

            if (kind === 'audio' && newAudioTrack) {
                if (sender.track?.id !== newAudioTrack.id) {
                    sender.replaceTrack(newAudioTrack).catch(e => console.warn("Audio replace failed", e));
                }
            }

            if (kind === 'video') {
                if (newVideoTrack) {
                    if (sender.track?.id !== newVideoTrack.id) {
                        sender.replaceTrack(newVideoTrack).catch(e => console.warn("Video replace failed", e));
                    }
                } else {
                    if (sender.track !== null) {
                        sender.replaceTrack(null).catch(e => console.warn("Video disable failed", e));
                    }
                }
            }
        });

        if (localStream) {
            localStream.getTracks().forEach(track => {
                const hasTransceiver = transceivers.some(t => t.receiver.track.kind === track.kind);
                if (!hasTransceiver && pc.signalingState === 'stable') {
                    pc.addTrack(track, localStream);
                }
            });
        }
    });
  }, [localStream]);

  // --- 3. Presence Lifecycle ---
  useEffect(() => {
    if (!roomId || !userId) return;

    RoomService.registerParticipant(roomId, userId, {
        id: userId,
        name: userNameRef.current,
        isAudioEnabled,
        isVideoEnabled,
        joinedAt: Date.now()
    }).catch(console.error);

    return () => {
        // Explicitly remove participant when the hook unmounts (user navigates away)
        RoomService.leaveRoom(roomId, userId);
    };
  }, [roomId, userId]);

  // Update Metadata - ensures participant name is always 'userName' regardless of screen share status
  useEffect(() => {
    if (!roomId || !userId) return;
    RoomService.updateParticipantStatus(roomId, userId, {
        name: userName, // Always use original name
        isAudioEnabled,
        isVideoEnabled
    });
  }, [roomId, userId, userName, isAudioEnabled, isVideoEnabled]);

  // --- 4. Screen Share Lifecycle ---
  useEffect(() => {
    if (!roomId || !userId) return;

    if (screenStream) {
        RoomService.registerScreenShare(roomId, userId, {
            id: userId,
            name: `${userNameRef.current} (Screen)`, // Only screen share record gets the suffix
            isAudioEnabled: screenStream.getAudioTracks().length > 0,
            createdAt: Date.now()
        });
    } else {
        RoomService.removeScreenShare(roomId, userId);
    }

    return () => {
         Object.keys(pcsRef.current).forEach(key => {
            if (key.endsWith('_viewer')) {
                pcsRef.current[key]?.close();
                delete pcsRef.current[key];
            }
        });
    };
  }, [roomId, userId, screenStream]);

  // --- 5. Logic: Recalculate Participants ---
  const recalculateParticipants = useCallback(() => {
      const all: Participant[] = [];
      const now = Date.now();

      // 1. Local User
      all.push({
          id: userId,
          name: userNameRef.current,
          isLocal: true,
          isAudioEnabled: isAudioEnabled,
          isVideoEnabled: isVideoEnabled,
          isScreenSharing: false,
          stream: localStreamRef.current || undefined,
          joinedAt: 0
      });

      // 2. Local Screen
      if (screenStreamRef.current) {
          all.push({
              id: `${userId}_screen`,
              name: `${userNameRef.current} (Screen)`,
              isLocal: true,
              isAudioEnabled: screenStreamRef.current.getAudioTracks().length > 0,
              isVideoEnabled: true,
              isScreenSharing: true,
              stream: screenStreamRef.current,
              joinedAt: now
          });
      }

      // 3. Remote Participants
      (Object.values(participantsDataRef.current) as ParticipantData[]).forEach(p => {
          if (p.id === userId) return;
          all.push({
              id: p.id,
              name: p.name,
              isLocal: false,
              isAudioEnabled: p.isAudioEnabled,
              isVideoEnabled: p.isVideoEnabled,
              isScreenSharing: false,
              stream: streamsRef.current[p.id],
              joinedAt: p.joinedAt
          });
      });

      // 4. Remote Screens
      const remoteScreens = Object.values(screensDataRef.current) as ScreenShareData[];
      remoteScreens.sort((a, b) => b.createdAt - a.createdAt);

      if (remoteScreens.length > 0) {
          const newest = remoteScreens[0];
          setScreenSharingId(newest.id === userId ? `${userId}_screen` : `${newest.id}_screen`);
      } else {
          setScreenSharingId(null);
      }

      remoteScreens.forEach(s => {
          if (s.id === userId) return;
          const remoteId = `${s.id}_screen`;
          all.push({
              id: remoteId,
              name: s.name, 
              isLocal: false,
              isAudioEnabled: s.isAudioEnabled,
              isVideoEnabled: true,
              isScreenSharing: true,
              stream: streamsRef.current[remoteId],
              joinedAt: s.createdAt
          });
      });

      setParticipants(all);
  }, [userId, isAudioEnabled, isVideoEnabled]);

  useEffect(() => { recalculateParticipants(); }, [recalculateParticipants, localStream, screenStream]);

  // --- 6. WebRTC Factory ---
  const createPC = useCallback((pcKey: string, targetInbox: string, streamToSend: MediaStream | null) => {
        if (pcsRef.current[pcKey]) return pcsRef.current[pcKey];

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcsRef.current[pcKey] = pc;

        if (streamToSend) {
            streamToSend.getTracks().forEach(track => pc.addTrack(track, streamToSend));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const senderId = pcKey.endsWith('_viewer') ? `${userId}_screen` : userId;
                RoomService.sendSignal(targetInbox, {
                    type: 'candidate',
                    payload: event.candidate.toJSON(),
                    senderId: senderId,
                    senderName: userNameRef.current
                });
            }
        };

        pc.ontrack = (event) => {
            streamsRef.current[pcKey] = event.streams[0];
            recalculateParticipants();
        };

        pc.onconnectionstatechange = () => {
             if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                 pc.close();
                 delete pcsRef.current[pcKey];
                 delete streamsRef.current[pcKey];
                 recalculateParticipants();
             }
        };

        return pc;
  }, [userId, recalculateParticipants]);

  // --- 7. Signal Processing ---
  const handleSignal = useCallback(async (snapshot: DataSnapshot, isScreenInbox: boolean) => {
      const data = snapshot.val() as SignalData;
      if (!data) return;
      
      RoomService.removeSignal(snapshot.ref);

      const { type, payload, senderId } = data;
      
      let pcKey = '';
      let targetInbox = '';

      if (isScreenInbox) {
          pcKey = `${senderId}_viewer`;
          targetInbox = `rooms/${roomId}/signals/${senderId}`;
      } else {
          if (senderId.endsWith('_screen')) {
              const baseId = senderId.replace('_screen', '');
              pcKey = `${baseId}_screen`; 
          } else {
              pcKey = senderId;
              targetInbox = `rooms/${roomId}/signals/${senderId}`;
          }
      }

      let pc = pcsRef.current[pcKey];

      try {
          if (type === 'offer') {
              const streamToAnswer = isScreenInbox ? screenStreamRef.current : localStreamRef.current;
              
              if (!pc) {
                  pc = createPC(pcKey, targetInbox, streamToAnswer);
              }

              if (pc.signalingState !== 'stable') {
                  await Promise.all([
                      pc.setLocalDescription({type: "rollback"}),
                      pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit))
                  ]);
              } else {
                  await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
              }

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              const replySenderId = isScreenInbox ? `${userId}_screen` : userId;

              RoomService.sendSignal(targetInbox, {
                  type: 'answer',
                  payload: { type: answer.type, sdp: answer.sdp },
                  senderId: replySenderId,
                  senderName: userNameRef.current
              });

          } else if (type === 'answer') {
              if (pc && pc.signalingState !== 'stable') {
                  await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
              }
          } else if (type === 'candidate') {
              if (pc && pc.remoteDescription) {
                  await pc.addIceCandidate(payload as RTCIceCandidateInit);
              }
          }
      } catch (err) {
          console.error("Signal Processing Error:", err);
      }
  }, [roomId, userId, createPC]);

  // --- 8. Event Listeners ---
  useEffect(() => {
      if (!roomId || !userId) return;

      const roomRef = RoomService.getRoomRef(roomId);
      const participantsRef = child(roomRef, 'participants');
      const screensRef = child(roomRef, 'screens');

      const unsubParticipants = onValue(participantsRef, (snap) => {
          const data = snap.val() || {};
          participantsDataRef.current = data;
          
          Object.keys(pcsRef.current).forEach(key => {
                const isViewer = key.endsWith('_viewer');
                const isScreenWatcher = key.endsWith('_screen');
                
                if (!isViewer && !isScreenWatcher && !data[key]) {
                   pcsRef.current[key]?.close();
                   delete pcsRef.current[key];
                   delete streamsRef.current[key];
                }
                else if (isViewer) {
                   const viewerId = key.replace('_viewer', '');
                   if (!data[viewerId]) {
                       pcsRef.current[key]?.close();
                       delete pcsRef.current[key];
                   }
                }
          });

          Object.values(data).forEach((p: any) => {
               if (p.id === userId) return;
               if (userId > p.id) {
                   const pcKey = p.id;
                   if (!pcsRef.current[pcKey]) {
                       const pc = createPC(pcKey, `rooms/${roomId}/signals/${p.id}`, localStreamRef.current);
                       pc.createOffer().then(offer => {
                           pc.setLocalDescription(offer);
                           RoomService.sendSignal(`rooms/${roomId}/signals/${p.id}`, {
                               type: 'offer',
                               payload: { type: offer.type, sdp: offer.sdp },
                               senderId: userId,
                               senderName: userNameRef.current
                           });
                       });
                   }
               }
          });
          recalculateParticipants();
      });

      const unsubScreens = onValue(screensRef, (snap) => {
          const data = snap.val() || {};
          screensDataRef.current = data;
 
          Object.keys(pcsRef.current).forEach(key => {
             if (key.endsWith('_screen')) {
                 const ownerId = key.replace('_screen', '');
                 if (!data[ownerId]) {
                     pcsRef.current[key]?.close();
                     delete pcsRef.current[key];
                     delete streamsRef.current[key];
                 }
             }
          });

          Object.values(data).forEach((s: any) => {
               if (s.id === userId) return;
               
               const pcKey = `${s.id}_screen`;
               const targetInbox = `rooms/${roomId}/signals/${s.id}_screen`;
               
               if (!pcsRef.current[pcKey]) {
                   const pc = createPC(pcKey, targetInbox, null);
                   pc.addTransceiver('video', { direction: 'recvonly' });
                   pc.addTransceiver('audio', { direction: 'recvonly' });

                   pc.createOffer().then(offer => {
                       pc.setLocalDescription(offer);
                       RoomService.sendSignal(targetInbox, {
                           type: 'offer',
                           payload: { type: offer.type, sdp: offer.sdp },
                           senderId: userId,
                           senderName: userNameRef.current
                       });
                   });
               }
          });
          recalculateParticipants();
      });

      const signalsRef = RoomService.getSignalsRef(roomId, userId);
      const screenSignalsRef = RoomService.getSignalsRef(roomId, `${userId}_screen`);

      const unsubSignals = onChildAdded(signalsRef, (snap) => handleSignal(snap, false));
      const unsubScreenSignals = onChildAdded(screenSignalsRef, (snap) => handleSignal(snap, true));

      return () => {
          unsubParticipants();
          unsubScreens();
          off(signalsRef);
          off(screenSignalsRef);
      };

  }, [roomId, userId, createPC, handleSignal, recalculateParticipants]);

  return {
    participants,
    screenSharingId,
    addDummyParticipant: () => {}
  };
}