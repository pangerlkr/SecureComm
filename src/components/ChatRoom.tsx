import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Phone, Video, Paperclip, Shield, Users,
  Mic, MicOff, VideoOff,
  Download, X, Copy, CheckCircle2, LogOut, WifiOff,
  AlertTriangle, RefreshCw, MessageSquare, ExternalLink,
  Lock, Unlock, UserX, Ban, Crown, KeyRound
} from 'lucide-react';
import { Message, Participant, CallState } from '../types';
import { EncryptionManager } from '../utils/encryption';
import { useSupabaseChat } from '../hooks/useSupabaseChat';
import { useWebRTC } from '../hooks/useWebRTC';

interface ChatRoomProps {
  roomId: string;
  isHost?: boolean;
  hostSessionId?: string;
  onLeave: () => void;
}

export default function ChatRoom({ roomId, isHost = false, hostSessionId = '', onLeave }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [callState, setCallState] = useState<CallState>({ isActive: false, isVideo: false, isIncoming: false });
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; isVideo: boolean; callerId: string } | null>(null);

  const [showPincodeEntry, setShowPincodeEntry] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [pincodeVerified, setPincodeVerified] = useState(false);

  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [settingsLocked, setSettingsLocked] = useState(false);
  const [settingsPincode, setSettingsPincode] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'kick' | 'ban';
    participantName: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const encryptionManager = EncryptionManager.getInstance();

  const {
    isConnected,
    connectionError,
    messages,
    participants,
    typingUsers,
    joinStatus,
    roomHostName,
    roomIsLocked,
    sendMessage: sendSupabaseMessage,
    kickParticipant,
    banParticipant,
    updateRoomLock,
    verifyPincode,
    startTyping,
    stopTyping
  } = useSupabaseChat({
    roomId,
    userName: isNameSet ? userName : '',
    isHost,
    hostSessionId
  });

  const effectiveIsHost = isNameSet && roomHostName !== '' && roomHostName === userName;

  const {
    localStream: _localStream,
    remoteStream: _remoteStream,
    isCallActive: webrtcCallActive,
    currentCallUser: _currentCallUser,
    currentCallIsVideo: _currentCallIsVideo,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    localVideoRef,
    remoteVideoRef
  } = useWebRTC({
    roomId,
    userName: isNameSet ? userName : '',
    enabled: isNameSet,
    onIncomingCall: (data) => {
      setIncomingCall({
        from: data.from,
        isVideo: data.isVideo,
        callerId: data.from
      });
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

  useEffect(() => {
    if (joinStatus === 'kicked') {
      setIsNameSet(false);
    }
  }, [joinStatus]);

  useEffect(() => {
    if (isNameSet && roomIsLocked && !effectiveIsHost && !pincodeVerified) {
      setShowPincodeEntry(true);
    }
  }, [isNameSet, roomIsLocked, effectiveIsHost, pincodeVerified]);

  useEffect(() => {
    if (showRoomSettings) {
      setSettingsLocked(roomIsLocked);
    }
  }, [showRoomSettings, roomIsLocked]);

  const handleSetName = () => {
    if (userName.trim()) {
      setIsNameSet(true);
    }
  };

  const handlePincodeSubmit = async () => {
    setPincodeError('');
    const valid = await verifyPincode(pincodeInput);
    if (valid) {
      setPincodeVerified(true);
      setShowPincodeEntry(false);
      setPincodeInput('');
    } else {
      setPincodeError('Incorrect pincode. Please try again.');
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

      await sendSupabaseMessage(message);
      setNewMessage('');
      stopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (e.target.value.trim()) {
      startTyping();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    } else {
      stopTyping();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      await sendSupabaseMessage(message);
    }
  };

  const handleStartCall = async (isVideo: boolean) => {
    if (participants.length < 2) {
      alert('Waiting for another participant to join...');
      return;
    }

    const otherParticipant = participants.find(p => p.name !== userName);
    if (otherParticipant) {
      setCallState({ isActive: false, isVideo, isIncoming: false });
      await startCall(otherParticipant.name, isVideo);
    }
  };

  const handleAcceptCall = async () => {
    if (incomingCall) {
      await acceptCall(incomingCall.from, incomingCall.isVideo);
      setCallState({ isActive: true, isVideo: incomingCall.isVideo, isIncoming: true });
    }
  };

  const handleRejectCall = async () => {
    if (incomingCall) {
      await rejectCall(incomingCall.from);
      setIncomingCall(null);
    }
  };

  const handleEndCall = async () => {
    await endCall();
    setCallState({ isActive: false, isVideo: false, isIncoming: false });
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleAudio(!newMutedState);
  };

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    toggleVideo(!newVideoState);
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
    window.open('https://supabase.com/dashboard', '_blank');
  };

  const handleSaveRoomSettings = async () => {
    if (settingsLocked && (!settingsPincode.trim() || settingsPincode.length < 4)) {
      return;
    }
    setSettingsSaving(true);
    await updateRoomLock(settingsLocked, settingsPincode);
    setSettingsSaving(false);
    setShowRoomSettings(false);
    setSettingsPincode('');
  };

  const handleConfirmKick = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'kick') {
      await kickParticipant(confirmAction.participantName);
    } else {
      await banParticipant(confirmAction.participantName);
    }
    setConfirmAction(null);
  };

  const isBlocked = joinStatus === 'banned' || joinStatus === 'kicked';

  if (joinStatus === 'banned') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 backdrop-blur-md rounded-2xl p-8 border border-red-500/30 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <Ban className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-300 mb-6">You have been banned from this room.</p>
          <button
            onClick={onLeave}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (joinStatus === 'kicked') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-orange-500/10 backdrop-blur-md rounded-2xl p-8 border border-orange-500/30 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4">
            <UserX className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Removed from Room</h2>
          <p className="text-slate-300 mb-6">You have been removed from this room by the host.</p>
          <button
            onClick={onLeave}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isNameSet || isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isHost ? 'Create Secure Room' : 'Join Secure Room'}
            </h2>
            {isHost && (
              <div className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/30 mb-2">
                <Crown className="w-3 h-3" />
                <span>You are the host</span>
              </div>
            )}
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
              {isHost ? 'Enter Room as Host' : 'Join Room'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Pincode Modal */}
      {showPincodeEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-full mb-4">
                <KeyRound className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Room is Protected</h3>
              <p className="text-slate-400 text-sm">Enter the pincode to join this room</p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter pincode"
                value={pincodeInput}
                onChange={(e) => { setPincodeInput(e.target.value); setPincodeError(''); }}
                onKeyPress={(e) => e.key === 'Enter' && handlePincodeSubmit()}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-center text-lg tracking-widest"
                autoFocus
                maxLength={12}
              />
              {pincodeError && (
                <p className="text-red-400 text-sm text-center">{pincodeError}</p>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={onLeave}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 px-4 rounded-xl font-semibold transition-colors"
                >
                  Leave
                </button>
                <button
                  onClick={handlePincodeSubmit}
                  disabled={!pincodeInput.trim()}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enter Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Settings Modal (Host only) */}
      {showRoomSettings && effectiveIsHost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Room Settings</h3>
              <button onClick={() => setShowRoomSettings(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                <div>
                  <div className="text-white font-medium flex items-center space-x-2">
                    {settingsLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                    <span>Lock Room</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Require a pincode to join</div>
                </div>
                <button
                  onClick={() => setSettingsLocked(!settingsLocked)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsLocked ? 'bg-amber-500' : 'bg-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${settingsLocked ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {settingsLocked && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Set Pincode</label>
                  <input
                    type="text"
                    placeholder="Enter pincode (min 4 characters)"
                    value={settingsPincode}
                    onChange={(e) => setSettingsPincode(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    maxLength={12}
                  />
                  {settingsLocked && settingsPincode.length > 0 && settingsPincode.length < 4 && (
                    <p className="text-red-400 text-xs mt-1">Pincode must be at least 4 characters</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => { setShowRoomSettings(false); setSettingsPincode(''); }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 px-4 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoomSettings}
                  disabled={settingsSaving || (settingsLocked && (!settingsPincode.trim() || settingsPincode.length < 4))}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingsSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kick/Ban Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-sm w-full mx-4">
            <div className="text-center mb-5">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${confirmAction.type === 'ban' ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
                {confirmAction.type === 'ban'
                  ? <Ban className="w-6 h-6 text-red-400" />
                  : <UserX className="w-6 h-6 text-orange-400" />
                }
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {confirmAction.type === 'ban' ? 'Ban User' : 'Remove User'}
              </h3>
              <p className="text-slate-400 text-sm">
                {confirmAction.type === 'ban'
                  ? `Ban ${confirmAction.participantName} permanently from this room?`
                  : `Remove ${confirmAction.participantName} from this room?`
                }
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 px-4 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmKick}
                className={`flex-1 text-white py-2.5 px-4 rounded-xl font-semibold transition-colors ${confirmAction.type === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {confirmAction.type === 'ban' ? 'Ban' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center space-x-2">
              <div className="text-xs text-slate-500">
                Room: <span className="font-mono text-blue-400">{roomId}</span>
              </div>
              {roomIsLocked && (
                <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </div>
              )}
              {effectiveIsHost && (
                <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Crown className="w-3 h-3" />
                  <span>Host</span>
                </div>
              )}
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

            {effectiveIsHost && (
              <button
                onClick={() => setShowRoomSettings(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                title="Room settings"
              >
                {roomIsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span className="text-sm">Settings</span>
              </button>
            )}

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
                onClick={handleToggleMute}
                className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {callState.isVideo && (
                <button
                  onClick={handleToggleVideo}
                  className={`p-2 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
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

      {/* Video Call Area */}
      {(callState.isActive || webrtcCallActive) && callState.isVideo && (
        <div className="relative h-96 bg-slate-900">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-slate-600 shadow-lg" />
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
                  <div className="text-xs opacity-70 mb-1 font-medium">
                    {message.sender}
                    {message.sender === roomHostName && (
                      <span className="ml-1 text-amber-400">(Host)</span>
                    )}
                  </div>
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
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

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
                className="p-3 bg-slate-600/50 hover:bg-slate-600 text-slate-400 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Share file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

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

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="fixed right-0 top-0 h-full w-80 bg-slate-800/95 backdrop-blur-md border-l border-slate-700 p-4 z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Participants ({participants.length})</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {participants.map((participant: Participant) => (
              <div key={participant.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate flex items-center space-x-1">
                    <span>{participant.name}</span>
                    {participant.name === roomHostName && (
                      <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    )}
                    {participant.name === userName && (
                      <span className="text-xs text-slate-400">(You)</span>
                    )}
                  </div>
                  <div className="text-xs text-green-400">Active now</div>
                </div>
                {effectiveIsHost && participant.name !== userName && (
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      onClick={() => setConfirmAction({ type: 'kick', participantName: participant.name })}
                      className="p-1.5 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 rounded-lg transition-colors"
                      title="Remove user"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'ban', participantName: participant.name })}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                      title="Ban user"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {effectiveIsHost && (
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Host Controls</p>
              <button
                onClick={() => { setShowParticipants(false); setShowRoomSettings(true); }}
                className="w-full flex items-center space-x-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-sm"
              >
                {roomIsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span>{roomIsLocked ? 'Room is Locked' : 'Lock Room with Pincode'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
