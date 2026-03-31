import React, { useState, useRef, useCallback } from 'react';
import { Users, MessageSquare, ArrowRight, Loader } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface ActionSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

function TiltCard({ children, accentColor }: { children: React.ReactNode; accentColor: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const tiltX = ((y - cy) / cy) * 8;
    const tiltY = ((x - cx) / cx) * -8;
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    setStyle({
      transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(4px)`,
      background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${accentColor}08, transparent 60%), rgba(255,255,255,0.03)`,
    });
  }, [accentColor]);

  const onMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      background: 'rgba(255,255,255,0.03)',
      transition: 'transform 0.5s ease, background 0.3s ease',
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ ...style, transition: 'transform 0.08s ease-out' }}
      className="h-full rounded-2xl border border-white/10 backdrop-blur-md p-8"
    >
      {children}
    </div>
  );
}

export default function ActionSection({ onCreateRoom, onJoinRoom }: ActionSectionProps) {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const sectionRef = useScrollReveal<HTMLDivElement>();

  const handleJoin = () => {
    if (!joinRoomId.trim()) return;
    setIsJoining(true);
    setTimeout(() => {
      onJoinRoom(joinRoomId.trim());
      setIsJoining(false);
    }, 1000);
  };

  return (
    <section className="relative py-24 px-4">
      <div ref={sectionRef} className="reveal-item max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Start communicating
            <span className="text-sky-400"> securely</span>
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">No accounts, no history, no compromise.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <TiltCard accentColor="#0ea5e9">
            <div className="text-center h-full flex flex-col">
              <div className="mb-6 relative inline-block mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-sky-400" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border border-sky-400/10 animate-pulse-slow" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">New Secure Room</h3>
              <p className="text-slate-400 text-sm mb-8 flex-1 leading-relaxed">
                Generate a fresh encrypted room with a unique shareable ID. Destroy on exit.
              </p>
              <button
                onClick={onCreateRoom}
                className="group w-full relative overflow-hidden bg-sky-500 text-white py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-sky-400 transition-colors duration-200"
              >
                <span>Create Room</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </TiltCard>

          <TiltCard accentColor="#10b981">
            <div className="text-center h-full flex flex-col">
              <div className="mb-6 relative inline-block mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border border-emerald-400/10 animate-pulse-slow" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Join a Room</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Enter a room ID to join an existing encrypted conversation.
              </p>
              <div className="space-y-3 mt-auto">
                <input
                  type="text"
                  placeholder="Room ID (e.g. ABC123XYZ)"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  maxLength={10}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all text-center tracking-widest font-mono"
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinRoomId.trim() || isJoining}
                  className="group w-full relative overflow-hidden bg-emerald-500 text-white py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Join Room</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
