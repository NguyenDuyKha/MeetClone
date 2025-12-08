export interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  stream?: MediaStream; // For local user or real WebRTC
  avatarUrl?: string; // For mock users
}

export interface GridLayout {
  rows: number;
  cols: number;
  tileWidth: number;
  tileHeight: number;
}

export interface RoomState {
  id: string;
  isJoined: boolean;
  participants: Participant[];
  screenSharingId: string | null;
}