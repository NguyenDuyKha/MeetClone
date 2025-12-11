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

export interface SignalData {
  type: "offer" | "answer" | "candidate";
  payload: any;
  senderId: string;
  senderName: string;
}