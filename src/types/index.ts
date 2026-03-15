export interface Message {
  id: string;
  content: string;
  timestamp: number;
  sender: string;
  type: 'text' | 'image' | 'video' | 'file' | 'system';
  fileName?: string;
  fileSize?: number;
  encrypted?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  isOnline: boolean;
  joinedAt: number;
  sessionId?: string;
}

export interface Room {
  id: string;
  participants: Participant[];
  messages: Message[];
  createdAt: number;
  isDestroyed: boolean;
  hostName?: string;
  isLocked?: boolean;
}

export interface CallState {
  isActive: boolean;
  isVideo: boolean;
  isIncoming: boolean;
  participantName?: string;
}

export interface RoomSettings {
  isHost: boolean;
  hostSessionId: string;
  isLocked: boolean;
  pincode: string;
}
