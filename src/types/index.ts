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
}

export interface Room {
  id: string;
  participants: Participant[];
  messages: Message[];
  createdAt: number;
  isDestroyed: boolean;
}

export interface CallState {
  isActive: boolean;
  isVideo: boolean;
  isIncoming: boolean;
  participantName?: string;
}
