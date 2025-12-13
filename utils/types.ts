export interface RoomInfo {
  id: string;
  createdAt: number;
}

export interface ParticipantData {
  id: string;
  name: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  joinedAt: number;
}

export interface ScreenShareData {
  id: string;
  name: string;
  isAudioEnabled: boolean;
  createdAt: number;
}

export interface Participant extends ParticipantData {
  isLocal: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
}

export interface GridLayout {
  rows: number;
  cols: number;
  tileWidth: number;
  tileHeight: number;
}

export type SignalType = "offer" | "answer" | "candidate";

export interface SignalPayload {
  type?: RTCSdpType;
  sdp?: string;
  [key: string]: any; // For candidate object properties
}

export interface SignalData {
  type: SignalType;
  payload: SignalPayload | RTCIceCandidateInit;
  senderId: string;
  senderName: string;
}

export interface LocalMediaState {
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  error: string | null;
  toggleAudio: () => void;
  toggleVideo: () => void;
}
