import React, { useState } from 'react';
import { Shield, MessageSquare, Users, Zap, Copy, CheckCircle2, ExternalLink } from 'lucide-react';

interface LandingProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function Landing({ onCreateRoom, onJoinRoom }: LandingProps) {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      setIsJoining(true);
      setTimeout(() => {
        onJoinRoom(joinRoomId.trim());
        setIsJoining(false);
      }, 1000);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'End-to-End Encryption',
      description: 'Military-grade encryption ensures your conversations remain private'
    },
    {
      icon: Zap,
      title: 'Self-Destruct Messages',
      description: 'Rooms automatically destroy when all participants leave'
    },
    {
      icon: Users,
      title: 'Zero Knowledge',
      description: 'No registration required, no data stored on servers'
    },
    {
      icon: MessageSquare,
      title: 'Rich Communication',
      description: 'Text, voice, video calls, and file sharing in one platform'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3B82F6 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #10B981 0%, transparent 50%)`
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-500/20 rounded-full backdrop-blur-sm border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            SecureComm
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {' '}Chat
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            End-to-end encrypted communication platform for sensitive conversations. 
            Create secure rooms, share safely, communicate privately.
          </p>
        </div>

        {/* Action Cards */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Room Card */}
            <div className="group">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6 group-hover:bg-blue-500/30 transition-colors">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Create New Room</h3>
                  <p className="text-slate-300 mb-8">
                    Start a secure conversation and invite others with a shareable link
                  </p>
                  <button
                    onClick={onCreateRoom}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/25"
                  >
                    <Users className="w-5 h-5" />
                    <span>Create Secure Room</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Join Room Card */}
            <div className="group">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-emerald-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-6 group-hover:bg-emerald-500/30 transition-colors">
                    <MessageSquare className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Join Room</h3>
                  <p className="text-slate-300 mb-6">
                    Enter a room ID to join an existing secure conversation
                  </p>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter Room ID (e.g., ABC123XYZ)"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                      maxLength={10}
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={!joinRoomId.trim() || isJoining}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isJoining ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                      <span>{isJoining ? 'Joining...' : 'Join Room'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-4">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create Room</h3>
              <p className="text-slate-400 text-sm">Generate a secure room with unique ID</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 rounded-full mb-4">
                <span className="text-emerald-400 font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Share Link</h3>
              <p className="text-slate-400 text-sm">Send the room link to your contact</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-full mb-4">
                <span className="text-purple-400 font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Chat Securely</h3>
              <p className="text-slate-400 text-sm">Communicate with end-to-end encryption</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Military-Grade Security Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-20 pt-8 border-t border-white/10">
          <p className="text-slate-400">
            No registration required • Zero data retention • Open source security
          </p>
        </div>
      </div>
    </div>
  );
}
