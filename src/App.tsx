import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import ChatRoom from './components/ChatRoom';

function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningFromLink, setIsJoiningFromLink] = useState(false);

  useEffect(() => {
    // Check for room ID in URL params when component mounts
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');
      
      console.log('URL params check:', { roomId, search: window.location.search });
      
      if (roomId && roomId.trim()) {
        console.log('Found room ID in URL:', roomId);
        setIsJoiningFromLink(true);
        
        // Small delay to show joining state
        setTimeout(() => {
          setCurrentRoom(roomId.trim().toUpperCase());
          setIsJoiningFromLink(false);
        }, 1000);
      }
    };

    // Check immediately
    checkUrlParams();
    
    // Also check after a small delay in case URL changes
    const timeoutId = setTimeout(checkUrlParams, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');
      
      if (roomId && roomId.trim()) {
        setCurrentRoom(roomId.trim().toUpperCase());
      } else {
        setCurrentRoom(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const generateRoomId = (): string => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
    setTimeout(() => {
      const roomId = generateRoomId();
      setCurrentRoom(roomId);
      // Update URL without page reload
      window.history.pushState({}, '', `?room=${roomId}`);
      setIsCreatingRoom(false);
    }, 1500);
  };

  const handleJoinRoom = (roomId: string) => {
    if (roomId && roomId.trim()) {
      const cleanRoomId = roomId.trim().toUpperCase();
      setCurrentRoom(cleanRoomId);
      // Update URL without page reload
      window.history.pushState({}, '', `?room=${cleanRoomId}`);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
  };

  // Debug logging
  console.log('App state:', { 
    currentRoom, 
    isCreatingRoom, 
    isJoiningFromLink, 
    urlSearch: window.location.search 
  });

  // Show joining state when accessing via shared link
  if (isJoiningFromLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
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

  // Show creating room state
  if (isCreatingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
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

  // Show chat room if user is in a room
  if (currentRoom) {
    return <ChatRoom roomId={currentRoom} onLeave={handleLeaveRoom} />;
  }

  // Show landing page
  return <Landing onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
}

export default App;