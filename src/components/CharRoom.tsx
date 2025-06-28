import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Phone, Video, Paperclip, Shield, Users, 
  Settings, MoreVertical, Mic, MicOff, VideoOff,
  Download, X, Copy, CheckCircle2, LogOut, Wifi, WifiOff,
  AlertTriangle, RefreshCw, MessageSquare, ExternalLink
} from 'lucide-react';
import { Message, Participant, CallState } from '../types';
import { EncryptionManager } from '../utils/encryption';
import { useSocket } from '../hooks/useSocket';

interface ChatRoomProps {
  roomId: string;
  onLeave: () => void;
}

export default function ChatRoom({ roomId, onLeave }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [callState, setCallState] = useState<CallState>({ isActive: false, isVideo: false, isIncoming: false });
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ from: string; isVideo: boolean; callerId: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const encryptionManager = EncryptionManager.getInstance();

  const {
    isConnected,
    connectionError,
    sendMessage,
    startTyping,
    stopTyping,
    startCall: socketStartCall,
    acceptCall,
    rejectCall,
    endCall: socketEndCall
  } = useSocket({
    roomId,
    userName: isNameSet ? userName : '', // Only pass userName when it's actually set
    onNewMessage: (message) => {
      setMessages(prev => {
        // Avoid duplicate messages
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    onParticipantsUpdate: (newParticipants) => {
      setParticipants(newParticipants);
    },
    onUserTyping: ({ userId, userName: typingUserName, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(typingUserName) ? prev : [...prev, typingUserName];
        } else {
          return prev.filter(name => name !== typingUserName);
        }
      });
    },
    onIncomingCall: (callData) => {
      setIncomingCall(callData);
    },
    onCallAccepted: () => {
      setCallState(prev => ({ ...prev, isActive: true }));
      setIncomingCall(null);
    },
    onCallRejected: () => {
      setCallState({ isActive: false, isVideo: false, isIncoming: false });
      setIncomingCall(null);
    },
    onCallEnded: () => {
      setCallState({ isActive: false, isVideo: false, isIncoming: false });
      setIncomingCall(null);
      setIsMuted(false);
      setIsVideoOff(false);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetName = () => {
    if (userName.trim()) {
      setIsNameSet(true);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && isNameSet && isConnected) {
      const message: Omit<Message, 'id' | 'timestamp'> = {
        content: newMessage.trim(),
        sender: userName,
        type: 'text',
        encrypted: true
      };
      
      sendMessage(message);
      setNewMessage('');
      stopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicators
    if (e.target.value.trim()) {
      startTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    } else {
      stopTyping();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && isNameSet && isConnected) {
      const message: Omit<Message, 'id' | 'timestamp'> = {
        content: `Shared ${file.type.startsWith('image/') ? 'image' : 'file'}: ${file.name}`,
        sender: userName,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileName: file.name,
        fileSize: file.size,
        encrypted: true
      };
      
      sendMessage(message);
    }
  };

  const handleStartCall = (isVideo: boolean) => {
    if (isConnected) {
      setCallState({ isActive: false, isVideo, isIncoming: false });
      socketStartCall(isVideo);
    }
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      acceptCall(incomingCall.callerId);
      setCallState({ isActive: true, isVideo: incomingCall.isVideo, isIncoming: true });
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      rejectCall(incomingCall.callerId);
      setIncomingCall(null);
    }
  };

  const handleEndCall = () => {
    socketEndCall();
    setCallState({ isActive: false, isVideo: false, isIncoming: false });
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const copyRoomLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const roomLink = `${baseUrl}?room=${roomId}`;
    
    navigator.clipboard.writeText(roomLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  };

  const handleLeave = () => {
    const confirmLeave = window.confirm(
      'Are you sure you want to leave? This room will self-destruct when all participants leave.'
    );
    if (confirmLeave) {
      onLeave();
    }
  };

  const handleRetryConnection = () => {
    window.location.reload();
  };

  const openServerStatus = () => {
    const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3001' 
      : 'https://panger-chat-server.onrender.com';
    window.open(serverUrl, '_blank');
  };

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Join Secure Room</h2>
            <p className="text-slate-300">Room ID: <span className="font-mono text-blue-400">{roomId}</span></p>
            {connectionError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-red-300 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-sm">{connectionError}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleRetryConnection}
                    className="flex items-center space-x-1 text-red-300 hover:text-red-200 text-sm px-2 py-1 bg-red-500/20 rounded"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                  <button
                    onClick={openServerStatus}
                    className="flex items-center space-x-1 text-red-300 hover:text-red-200 text-sm px-2 py-1 bg-red-500/20 rounded"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Check Server</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your display name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              onKeyPress={(e) => e.key === 'Enter' && handleSetName()}
              autoFocus
            />
            <button
              onClick={handleSetName}
              disabled={!userName.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-white font-semibold">SecureComm Chat</span>
              {!isConnected && <WifiOff className="w-4 h-4 text-red-400" />}
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <Shield className="w-4 h-4" />
              <span>E2E Encrypted</span>
              <span className="text-xs">({encryptionManager.getKeyFingerprint()})</span>
            </div>
            <div className="text-xs text-slate-500">
              Room: <span className="font-mono text-blue-400">{roomId}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={copyRoomLink}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Copy room link to share with others"
            >
              {linkCopied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className="text-sm">{linkCopied ? 'Copied!' : 'Share Link'}</span>
            </button>
            
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">{participants.length}</span>
            </button>
            
            <button
              onClick={handleLeave}
              className="flex items-center space-x-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-500/20 border-b border-red-500/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-300">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">
                {connectionError || 'Disconnected from server. Trying to reconnect...'}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRetryConnection}
                className="flex items-center space-x-1 px-3 py-1 bg-red-500/30 hover:bg-red-500/40 text-red-300 rounded text-sm transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
              <button
                onClick={openServerStatus}
                className="flex items-center space-x-1 px-3 py-1 bg-red-500/30 hover:bg-red-500/40 text-red-300 rounded text-sm transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Server Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                {incomingCall.isVideo ? <Video className="w-8 h-8 text-green-400" /> : <Phone className="w-8 h-8 text-green-400" />}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call</h3>
              <p className="text-slate-300 mb-8">From: {incomingCall.from}</p>
              <div className="flex space-x-4">
                <button
                  onClick={handleRejectCall}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Interface */}
      {callState.isActive && (
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white">
                {callState.isVideo ? 'Video Call' : 'Voice Call'} in progress
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {callState.isVideo && (
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-2 rounded-full transition-colors ${
                    isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={handleEndCall}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && isConnected && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Welcome to SecureComm Chat</h3>
              <p className="text-slate-400">Your messages are end-to-end encrypted and secure.</p>
              <p className="text-slate-500 text-sm mt-2">Start typing to begin the conversation...</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === userName ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                  message.type === 'system'
                    ? 'bg-blue-500/20 text-blue-300 text-center text-sm border border-blue-500/30'
                    : message.sender === userName
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-slate-700 text-white border border-slate-600'
                }`}
              >
                {message.type !== 'system' && (
                  <div className="text-xs opacity-70 mb-1 font-medium">{message.sender}</div>
                )}
                <div className="break-words leading-relaxed">
                  {message.content}
                </div>
                {(message.type === 'image' || message.type === 'file') && message.fileName && (
                  <div className="mt-2 p-2 bg-black/20 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1 mr-2">{message.fileName}</span>
                      <Download className="w-3 h-3 cursor-pointer hover:text-blue-300 transition-colors" />
                    </div>
                    {message.fileSize && (
                      <div className="text-xs opacity-60 mt-1">
                        {(message.fileSize / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs opacity-50 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-slate-700/50 px-4 py-2 rounded-2xl border border-slate-600/50">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-slate-800/50 backdrop-blur-md border-t border-slate-700/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            {/* Call Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleStartCall(false)}
                disabled={callState.isActive || !isConnected}
                className="p-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleStartCall(true)}
                disabled={callState.isActive || !isConnected}
                className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start video call"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected}
                className="p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Share file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            {/* Message Input */}
            <div className="flex-1 flex items-center space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={isConnected ? "Type an encrypted message..." : "Connecting..."}
                className="flex-1 bg-slate-700/50 border border-slate-600 rounded-full px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all disabled:opacity-50"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isConnected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="fixed right-0 top-0 h-full w-80 bg-slate-800/95 backdrop-blur-md border-l border-slate-700 p-4 z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Participants ({participants.length})</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className={`w-3 h-3 rounded-full ${participant.isOnline ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {participant.name}
                    {participant.name === userName && <span className="text-xs text-slate-400 ml-1">(You)</span>}
                  </div>
                  <div className="text-xs text-slate-400">
                    {participant.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
