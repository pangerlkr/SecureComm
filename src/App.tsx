import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import ChatRoom from './components/ChatRoom';

function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningFromLink, setIsJoiningFromLink] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [hostSessionId, setHostSessionId] = useState('');

  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');

      if (roomId && roomId.trim()) {
        setIsJoiningFromLink(true);
        setIsHost(false);
        setHostSessionId('');

        setTimeout(() => {
          setCurrentRoom(roomId.trim().toUpperCase());
          setIsJoiningFromLink(false);
        }, 1000);
      }
    };

    checkUrlParams();
    const timeoutId = setTimeout(checkUrlParams, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');

      if (roomId && roomId.trim()) {
        setCurrentRoom(roomId.trim().toUpperCase());
        setIsHost(false);
      } else {
        setCurrentRoom(null);
        setIsHost(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const generateRoomId = (): string => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  const generateSessionId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
    setTimeout(() => {
      const roomId = generateRoomId();
      const sessionId = generateSessionId();
      setCurrentRoom(roomId);
      setIsHost(true);
      setHostSessionId(sessionId);
      window.history.pushState({}, '', `?room=${roomId}`);
      setIsCreatingRoom(false);
    }, 1500);
  };

  const handleJoinRoom = (roomId: string) => {
    if (roomId && roomId.trim()) {
      const cleanRoomId = roomId.trim().toUpperCase();
      setCurrentRoom(cleanRoomId);
      setIsHost(false);
      setHostSessionId('');
      window.history.pushState({}, '', `?room=${cleanRoomId}`);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setIsHost(false);
    setHostSessionId('');
    window.history.pushState({}, '', window.location.pathname);
  };

  if (isJoiningFromLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-6">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Joining Secure Room...</h2>
          <p className="text-slate-300">Establishing encrypted connection</p>
          <p className="text-slate-500 text-sm mt-2">Room: {new URLSearchParams(window.location.search).get('room')}</p>
        </div>
      </div>
    );
  }

  if (isCreatingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6">
            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Creating Secure Room...</h2>
          <p className="text-slate-300">Generating encryption keys and secure environment</p>
        </div>
      </div>
    );
  }

  if (currentRoom) {
    return (
      <ChatRoom
        roomId={currentRoom}
        isHost={isHost}
        hostSessionId={hostSessionId}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return <Landing onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
}

export default App;
