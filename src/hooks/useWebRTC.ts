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
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [remoteOnHold, setRemoteOnHold] = useState(false);

  const webrtcManagerRef = useRef<WebRTCManager | null>(null);
  const currentCallUserRef = useRef<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const resetCallState = () => {
    setIsCallActive(false);
    setCurrentCallUser(null);
    currentCallUserRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCurrentCallIsVideo(false);
    setRemoteCameraOff(false);
    setIsOnHold(false);
    setRemoteOnHold(false);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!enabled || !userName.trim() || !roomId.trim()) return;

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
        case 'call-start': {
          const data = signal.signal_data as { isVideo: boolean } | undefined;
          if (onIncomingCall && data) {
            setCurrentCallUser(signal.from_user);
            currentCallUserRef.current = signal.from_user;
            setCurrentCallIsVideo(data.isVideo);
            onIncomingCall({ from: signal.from_user, isVideo: data.isVideo });
          }
          break;
        }
        case 'camera-off':
          setRemoteCameraOff(true);
          break;
        case 'camera-on':
          setRemoteCameraOff(false);
          break;
        case 'call-hold':
          setRemoteOnHold(true);
          break;
        case 'call-unhold':
          setRemoteOnHold(false);
          break;
        case 'call-reject':
          resetCallState();
          onCallRejected?.();
          break;
        case 'call-end':
          resetCallState();
          onCallEnded?.();
          break;
      }
    });

    return () => {
      webrtcManagerRef.current?.disconnect();
      webrtcManagerRef.current = null;
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
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsCallActive(true);
      setCurrentCallUser(toUser);
      currentCallUserRef.current = toUser;
      setCurrentCallIsVideo(isVideo);
    }
  };

  const acceptCall = async (fromUser: string, isVideo: boolean) => {
    if (!webrtcManagerRef.current) return;
    const stream = await webrtcManagerRef.current.acceptCall(fromUser, isVideo);
    if (stream) {
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsCallActive(true);
      setCurrentCallUser(fromUser);
      currentCallUserRef.current = fromUser;
      setCurrentCallIsVideo(isVideo);
      onCallAccepted?.();
    }
  };

  const rejectCall = async (fromUser: string) => {
    if (!webrtcManagerRef.current) return;
    await webrtcManagerRef.current.rejectCall(fromUser);
    resetCallState();
    onCallRejected?.();
  };

  const endCall = async () => {
    if (!webrtcManagerRef.current) return;
    const target = currentCallUserRef.current;
    if (target) {
      await webrtcManagerRef.current.endCall(target);
    }
    resetCallState();
    onCallEnded?.();
  };

  const toggleAudio = (en: boolean) => webrtcManagerRef.current?.toggleAudio(en);
  const toggleVideo = (en: boolean) => webrtcManagerRef.current?.toggleVideo(en);

  const holdCall = async () => {
    await webrtcManagerRef.current?.holdCall();
    setIsOnHold(true);
  };

  const unholdCall = async () => {
    await webrtcManagerRef.current?.unholdCall();
    setIsOnHold(false);
  };

  return {
    localStream,
    remoteStream,
    isCallActive,
    currentCallUser,
    currentCallIsVideo,
    remoteCameraOff,
    isOnHold,
    remoteOnHold,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    holdCall,
    unholdCall,
    localVideoRef,
    remoteVideoRef
  };
}
