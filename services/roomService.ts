import { db } from '../libs/firebase';
import { ref, child, update, remove, onDisconnect, push, DatabaseReference } from 'firebase/database';
import { ParticipantData, ScreenShareData, SignalData } from '../utils/types';

/**
 * Service to handle Firebase Realtime Database paths and atomic operations.
 */
export const RoomService = {
  // --- Paths ---
  getRoomRef: (roomId: string) => ref(db, `rooms/${roomId}`),
  getParticipantRef: (roomId: string, userId: string) => ref(db, `rooms/${roomId}/participants/${userId}`),
  getScreenRef: (roomId: string, userId: string) => ref(db, `rooms/${roomId}/screens/${userId}`),
  getSignalsRef: (roomId: string, userId: string) => ref(db, `rooms/${roomId}/signals/${userId}`),
  
  // --- Operations ---
  
  async registerParticipant(roomId: string, userId: string, data: ParticipantData) {
    const participantRef = this.getParticipantRef(roomId, userId);
    const signalsRef = this.getSignalsRef(roomId, userId);

    await update(participantRef, data);

    // Setup disconnect handlers
    onDisconnect(participantRef).remove();
    onDisconnect(signalsRef).remove();
    
    return { participantRef, signalsRef };
  },

  async updateParticipantStatus(roomId: string, userId: string, data: Partial<ParticipantData>) {
    const participantRef = this.getParticipantRef(roomId, userId);
    await update(participantRef, data);
  },

  async registerScreenShare(roomId: string, userId: string, data: ScreenShareData) {
    const screenRef = this.getScreenRef(roomId, userId);
    const signalsRef = this.getSignalsRef(roomId, `${userId}_screen`);

    await update(screenRef, data);

    onDisconnect(screenRef).remove();
    onDisconnect(signalsRef).remove();

    return { screenRef, signalsRef };
  },

  async removeScreenShare(roomId: string, userId: string) {
    const screenRef = this.getScreenRef(roomId, userId);
    const signalsRef = this.getSignalsRef(roomId, `${userId}_screen`);
    
    await remove(screenRef);
    await remove(signalsRef);
  },

  async leaveRoom(roomId: string, userId: string) {
    const participantRef = this.getParticipantRef(roomId, userId);
    const screenRef = this.getScreenRef(roomId, userId);
    const signalsRef = this.getSignalsRef(roomId, userId);
    const screenSignalsRef = this.getSignalsRef(roomId, `${userId}_screen`);
    
    // We remove them in parallel to ensure quick cleanup
    await Promise.all([
        remove(participantRef),
        remove(screenRef),
        remove(signalsRef),
        remove(screenSignalsRef)
    ]);
  },

  async sendSignal(targetInboxPath: string, signal: SignalData) {
    // Note: targetInboxPath is passed fully constructed because it might be a sub-path
    await push(child(ref(db), targetInboxPath), signal);
  },

  async removeSignal(signalRef: DatabaseReference) {
    await remove(signalRef);
  }
};