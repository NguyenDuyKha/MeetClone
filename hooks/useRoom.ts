import { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../libs/firebase';
import { 
  ref, push, set, remove, 
  onDisconnect, child, onChildAdded, update, onValue, DataSnapshot
} from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { Participant, SignalData, ParticipantData, ScreenShareData } from '../utils/types';

const ICE_SERVERS = {
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
  
  // Persistent User ID
  const [userId] = useState(() => {
    const storageKey = `meet_uid_${roomId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) return stored;
    const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(storageKey, newId);
    return newId;
  });

  // --- Refs for WebRTC & State (Mutable, stable across renders) ---
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({}); 
  const streamsRef = useRef<Record<string, MediaStream>>({});
  
  // Store latest props in refs to access them inside stale closures (event listeners)
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
    signInAnonymously(auth).catch(console.error);
  }, []);

  // --- 2. Track Management (Sync local stream changes to PeerConnections) ---
  useEffect(() => {
    // When local stream changes (e.g. video toggled off/on), update all peer connections
    Object.entries(pcsRef.current).forEach(([key, pc]) => {
        // We only manage standard camera/mic connections here, not screen share/viewers
        if (!key.includes('_screen') && !key.includes('_viewer')) {
            const transceivers = pc.getTransceivers();
            const newAudioTrack = localStream?.getAudioTracks()[0];
            const newVideoTrack = localStream?.getVideoTracks()[0];

            transceivers.forEach(transceiver => {
                const sender = transceiver.sender;
                // Identify the type of media this transceiver handles based on the receiver's track kind
                // This is stable even if the sender track is currently null
                const kind = transceiver.receiver.track.kind;

                if (kind === 'audio') {
                    if (newAudioTrack) {
                        if (sender.track?.id !== newAudioTrack.id) {
                            sender.replaceTrack(newAudioTrack).catch(e => console.error("Audio replace failed", e));
                        }
                    } 
                }

                if (kind === 'video') {
                    if (newVideoTrack) {
                        // Video is enabled (or re-enabled)
                        if (sender.track?.id !== newVideoTrack.id) {
                            console.log("Replacing video track with new one");
                            sender.replaceTrack(newVideoTrack).catch(e => console.error("Video replace failed", e));
                        }
                    } else {
                        // Video is disabled (track removed from stream)
                        // Explicitly set sender track to null to ensure clean state
                        if (sender.track !== null) {
                            console.log("Setting video sender to null (Video Off)");
                            sender.replaceTrack(null).catch(e => console.error("Video disable failed", e));
                        }
                    }
                }
            });
            
            // Check if we need to ADD tracks (e.g. if we started without video but added it later)
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    const hasTransceiver = transceivers.some(t => t.receiver.track.kind === track.kind);
                    if (!hasTransceiver && pc.signalingState === 'stable') {
                        console.log("Adding new track to PC:", track.kind);
                        pc.addTrack(track, localStream);
                    }
                });
            }
        }
    });
  }, [localStream]);

  // --- 3. Presence Lifecycle (Participant) ---
  useEffect(() => {
    if (!roomId || !userId) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const myParticipantRef = child(roomRef, `participants/${userId}`);
    const mySignalsRef = child(roomRef, `signals/${userId}`);

    // Initial Registration
    update(myParticipantRef, {
        id: userId,
        name: userNameRef.current,
        isAudioEnabled: isAudioEnabled,
        isVideoEnabled: isVideoEnabled,
        joinedAt: Date.now()
    });

    // Server-side Cleanup (Tab Close / Crash)
    onDisconnect(myParticipantRef).remove();
    onDisconnect(mySignalsRef).remove();

    return () => {
        // Client-side Cleanup (Navigation / Component Unmount)
        remove(myParticipantRef);
        remove(mySignalsRef);
    };
  }, [roomId, userId]);

  // --- 3.1 Presence Metadata Updates (Participant) ---
  useEffect(() => {
    if (!roomId || !userId) return;
    const myParticipantRef = ref(db, `rooms/${roomId}/participants/${userId}`);

    update(myParticipantRef, {
        name: userName,
        isAudioEnabled: isAudioEnabled,
        isVideoEnabled: isVideoEnabled
    });
  }, [roomId, userId, userName, isAudioEnabled, isVideoEnabled]);

  // --- 3.2 Screen Share Lifecycle ---
  useEffect(() => {
    if (!roomId || !userId || !screenStream) return;
    
    const roomRef = ref(db, `rooms/${roomId}`);
    const myScreenRef = child(roomRef, `screens/${userId}`);
    const myScreenSignalsRef = child(roomRef, `signals/${userId}_screen`);

    set(myScreenRef, {
        id: userId,
        name: `${userNameRef.current} (Screen)`,
        isAudioEnabled: screenStream.getAudioTracks().length > 0,
        createdAt: Date.now()
    });

    onDisconnect(myScreenRef).remove();
    onDisconnect(myScreenSignalsRef).remove();

    return () => {
        remove(myScreenRef);
        remove(myScreenSignalsRef);
        
        // Cleanup viewer connections (people watching me)
        Object.keys(pcsRef.current).forEach(key => {
            if (key.endsWith('_viewer')) {
                pcsRef.current[key]?.close();
                delete pcsRef.current[key];
            }
        });
    };
  }, [roomId, userId, screenStream]); // Re-run if stream object changes (e.g. stop/start)

  // --- 3.3 Screen Share Metadata Updates ---
  useEffect(() => {
    if (!roomId || !userId || !screenStream) return;
    
    // Update name if it changes during screen share
    const myScreenRef = ref(db, `rooms/${roomId}/screens/${userId}`);
    update(myScreenRef, {
        name: `${userName} (Screen)`
    });
  }, [roomId, userId, screenStream, userName]);


  // --- 4. UI Recalculation ---
  const recalculateParticipants = useCallback(() => {
      const all: Participant[] = [];
      const now = Date.now();

      // Me
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

      // My Screen
      if (screenStreamRef.current) {
          all.push({
              id: `${userId}_screen`,
              name: `${userNameRef.current} (You)`,
              isLocal: true,
              isAudioEnabled: screenStreamRef.current.getAudioTracks().length > 0,
              isVideoEnabled: true,
              isScreenSharing: true,
              stream: screenStreamRef.current,
              joinedAt: now
          });
      }

      // Remote Peers
      Object.values(participantsDataRef.current).forEach(p => {
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

      // Remote Screens
      const remoteScreens = Object.values(screensDataRef.current);
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
  }, [userId, isAudioEnabled, isVideoEnabled, localStream, screenStream]); 

  // Update UI when media flags change
  useEffect(() => { recalculateParticipants(); }, [recalculateParticipants]);


  // --- 5. WebRTC Factory ---
  const createPCRef = useRef<((key: string, targetInbox: string, stream: MediaStream | null) => RTCPeerConnection) | null>(null);

  useEffect(() => {
    createPCRef.current = (pcKey: string, targetInboxPath: string, streamToSend: MediaStream | null) => {
        if (pcsRef.current[pcKey]) return pcsRef.current[pcKey];

        console.log(`[WebRTC] Creating PC: ${pcKey}`);
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcsRef.current[pcKey] = pc;

        if (streamToSend) {
            streamToSend.getTracks().forEach(track => pc.addTrack(track, streamToSend));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                let senderId = userId;
                if (pcKey.endsWith('_viewer')) senderId = `${userId}_screen`;

                push(child(ref(db), targetInboxPath), {
                    type: 'candidate',
                    payload: event.candidate.toJSON(),
                    senderId: senderId,
                    senderName: userNameRef.current
                }).catch(e => console.error("Signal Push Error", e));
            }
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Track received on ${pcKey}`);
            streamsRef.current[pcKey] = event.streams[0];
            recalculateParticipants();
        };

        pc.onconnectionstatechange = () => {
             if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                 console.log(`[WebRTC] Disconnected: ${pcKey}`);
                 pc.close();
                 delete pcsRef.current[pcKey];
                 delete streamsRef.current[pcKey];
                 recalculateParticipants();
             }
        };

        return pc;
    };
  }, [userId, recalculateParticipants]);


  // --- 6. Signal Handling ---
  const handleSignalRef = useRef<((snap: DataSnapshot, isScreen: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
      handleSignalRef.current = async (snapshot: DataSnapshot, isScreenInbox: boolean) => {
          const data = snapshot.val() as SignalData;
          if (!data) return;
          
          remove(snapshot.ref);

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

          const createPC = createPCRef.current;
          if (!createPC) return;

          let pc = pcsRef.current[pcKey];

          try {
              if (type === 'offer') {
                  const streamToAnswer = isScreenInbox ? screenStreamRef.current : localStreamRef.current;
                  
                  if (!pc) {
                      pc = createPC(pcKey, targetInbox, streamToAnswer);
                  }

                  if (pc.signalingState !== 'stable') {
                      await Promise.all([
                          pc.setLocalDescription({type: "rollback"} as any),
                          pc.setRemoteDescription(new RTCSessionDescription(payload))
                      ]);
                  } else {
                      await pc.setRemoteDescription(new RTCSessionDescription(payload));
                  }

                  const answer = await pc.createAnswer({});
                  await pc.setLocalDescription(answer);

                  const replySenderId = isScreenInbox ? `${userId}_screen` : userId;

                  push(child(ref(db), targetInbox), {
                      type: 'answer',
                      payload: { type: answer.type, sdp: answer.sdp },
                      senderId: replySenderId,
                      senderName: userNameRef.current
                  });

              } else if (type === 'answer') {
                  if (pc && pc.signalingState !== 'stable') {
                      await pc.setRemoteDescription(new RTCSessionDescription(payload));
                  }
              } else if (type === 'candidate') {
                  if (pc && pc.remoteDescription) {
                      await pc.addIceCandidate(payload);
                  }
              }
          } catch (err) {
              console.error("Signal Error", err, data);
          }
      };
  }, [roomId, userId]);


  // --- 7. Main Listeners (Stable) ---
  useEffect(() => {
      if (!roomId || !userId) return;
      const roomBase = `rooms/${roomId}`;

      // A. Participants List (onValue for state sync)
      const unsubParticipants = onValue(child(ref(db), `${roomBase}/participants`), (snap) => {
          const data = snap.val() || {};
          participantsDataRef.current = data;
          
          Object.keys(pcsRef.current).forEach(key => {
                if (!key.includes('_screen') && !key.includes('_viewer') && !data[key]) {
                   pcsRef.current[key]?.close();
                   delete pcsRef.current[key];
                   delete streamsRef.current[key];
                }
                // Viewer connections (I am sharing my screen TO this participant)
               else if (key.endsWith('_viewer')) {
                   const viewerId = key.replace('_viewer', '');
                   if (!data[viewerId]) {
                       console.log(`[WebRTC] Cleanup Viewer: ${key}`);
                       pcsRef.current[key]?.close();
                       delete pcsRef.current[key];
                       // No stream ref for viewers (outgoing only)
                   }
               }

          });

          Object.values(data).forEach((p: any) => {
               if (p.id === userId) return;
               if (userId > p.id) {
                   const pcKey = p.id;
                   if (!pcsRef.current[pcKey] && createPCRef.current) {
                       const pc = createPCRef.current(pcKey, `${roomBase}/signals/${p.id}`, localStreamRef.current);
                       if (pc) {
                           pc.createOffer({}).then(offer => {
                               pc.setLocalDescription(offer);
                               push(child(ref(db), `${roomBase}/signals/${p.id}`), {
                                   type: 'offer',
                                   payload: { type: offer.type, sdp: offer.sdp },
                                   senderId: userId,
                                   senderName: userNameRef.current
                               });
                           });
                       }
                   }
               }
          });

          recalculateParticipants();
      });

      // B. Screens List
      const unsubScreens = onValue(child(ref(db), `${roomBase}/screens`), (snap) => {
          const data = snap.val() || {};
          screensDataRef.current = data;
 
          // Cleanup watcher connections (I am watching THIS screen)
          Object.keys(pcsRef.current).forEach(key => {
             if (key.endsWith('_screen')) {
                 const ownerId = key.replace('_screen', '');
                 if (!data[ownerId]) {
                     console.log(`[WebRTC] Cleanup Screen Watcher: ${key}`);
                     pcsRef.current[key]?.close();
                     delete pcsRef.current[key];
                     delete streamsRef.current[key];
                 }
             }
          });

          Object.values(data).forEach((s: any) => {
               if (s.id === userId) return;
               
               const pcKey = `${s.id}_screen`;
               const targetInbox = `${roomBase}/signals/${s.id}_screen`;
               
               if (!pcsRef.current[pcKey] && createPCRef.current) {
                   const pc = createPCRef.current(pcKey, targetInbox, null);
                   if (pc) {
                       pc.addTransceiver('video', { direction: 'recvonly' });
                       pc.addTransceiver('audio', { direction: 'recvonly' });

                       pc.createOffer({}).then(offer => {
                           pc.setLocalDescription(offer);
                           push(child(ref(db), targetInbox), {
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

      // C. Signal Streams
      const signalsRef = child(ref(db), `${roomBase}/signals/${userId}`);
      const screenSignalsRef = child(ref(db), `${roomBase}/signals/${userId}_screen`);

      const unsubSignals = onChildAdded(signalsRef, (snap) => {
          if (handleSignalRef.current) handleSignalRef.current(snap, false);
      });

      const unsubScreenSignals = onChildAdded(screenSignalsRef, (snap) => {
          if (handleSignalRef.current) handleSignalRef.current(snap, true);
      });

      return () => {
          unsubParticipants();
          unsubScreens();
          unsubSignals();
          unsubScreenSignals();
      };

  }, [roomId, userId, recalculateParticipants]);

  return {
    participants,
    screenSharingId,
    addDummyParticipant: () => {}
  };
}
