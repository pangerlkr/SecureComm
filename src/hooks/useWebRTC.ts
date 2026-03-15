import { useEffect, useRef, useState } from 'react';
import { WebRTCManager, WebRTCSignal } from '../utils/webrtc';

interface UseWebRTCProps {
  roomId: string;
  userName: string;
  enabled: boolean;
  onIncomingCall?: (data: { from: string; isVideo: boolean }) => void;
  onCallAccepted?: () => void;
  onCallRejected?: () => void;
  onCallEnded?: () => void;
}

export function useWebRTC({
  roomId,
  userName,
  enabled,
  onIncomingCall,
  onCallAccepted,
  onCallRejected,
  onCallEnded
}: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCallUser, setCurrentCallUser] = useState<string | null>(null);
  const [currentCallIsVideo, setCurrentCallIsVideo] = useState(false);

  const webrtcManagerRef = useRef<WebRTCManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!enabled || !userName.trim() || !roomId.trim()) {
      return;
    }

    const manager = new WebRTCManager(roomId, userName);
    webrtcManagerRef.current = manager;

    manager.initialize();

    manager.onRemoteStream((stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    manager.onSignal((signal: WebRTCSignal) => {
      switch (signal.signal_type) {
        case 'call-start':
          if (onIncomingCall && signal.signal_data) {
            setCurrentCallUser(signal.from_user);
            setCurrentCallIsVideo(signal.signal_data.isVideo);
            onIncomingCall({
              from: signal.from_user,
              isVideo: signal.signal_data.isVideo
            });
          }
          break;

        case 'call-reject':
          setIsCallActive(false);
          setCurrentCallUser(null);
          if (onCallRejected) {
            onCallRejected();
          }
          break;

        case 'call-end':
          setIsCallActive(false);
          setCurrentCallUser(null);
          setLocalStream(null);
          setRemoteStream(null);
          if (onCallEnded) {
            onCallEnded();
          }
          break;
      }
    });

    return () => {
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.disconnect();
      }
    };
  }, [roomId, userName, enabled]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startCall = async (toUser: string, isVideo: boolean) => {
    if (!webrtcManagerRef.current) return;

    const stream = await webrtcManagerRef.current.startCall(toUser, isVideo);
    if (stream) {
      setLocalStream(stream);
      setIsCallActive(true);
      setCurrentCallUser(toUser);
      setCurrentCallIsVideo(isVideo);
    }
  };

  const acceptCall = async (fromUser: string, isVideo: boolean) => {
    if (!webrtcManagerRef.current) return;

    const stream = await webrtcManagerRef.current.acceptCall(fromUser, isVideo);
    if (stream) {
      setLocalStream(stream);
      setIsCallActive(true);
      setCurrentCallUser(fromUser);
      setCurrentCallIsVideo(isVideo);
      if (onCallAccepted) {
        onCallAccepted();
      }
    }
  };

  const rejectCall = async (fromUser: string) => {
    if (!webrtcManagerRef.current) return;

    await webrtcManagerRef.current.rejectCall(fromUser);
    setCurrentCallUser(null);
    if (onCallRejected) {
      onCallRejected();
    }
  };

  const endCall = async () => {
    if (!webrtcManagerRef.current || !currentCallUser) return;

    await webrtcManagerRef.current.endCall(currentCallUser);
    setIsCallActive(false);
    setCurrentCallUser(null);
    setLocalStream(null);
    setRemoteStream(null);
    if (onCallEnded) {
      onCallEnded();
    }
  };

  const toggleAudio = (enabled: boolean) => {
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.toggleAudio(enabled);
    }
  };

  const toggleVideo = (enabled: boolean) => {
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.toggleVideo(enabled);
    }
  };

  return {
    localStream,
    remoteStream,
    isCallActive,
    currentCallUser,
    currentCallIsVideo,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    localVideoRef,
    remoteVideoRef
  };
}
