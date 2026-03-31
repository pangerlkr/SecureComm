import React, { useEffect, useRef, useState } from 'react';
import { Shield } from 'lucide-react';

export default function HeroSection() {
  const shieldRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = ((e.clientY - cy) / cy) * 12;
      const y = ((e.clientX - cx) / cx) * -12;
      setTilt({ x, y });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-10">
      <div
        className="relative z-10 text-center"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x * 0.3}deg) rotateY(${tilt.y * 0.3}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div
          className={`mb-10 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div
            ref={shieldRef}
            className="inline-block animate-float-slow"
            style={{
              transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.15s ease-out',
              filter: 'drop-shadow(0 0 40px rgba(56,189,248,0.5))',
            }}
          >
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-400/30 backdrop-blur-sm animate-pulse-slow" />
              <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-sky-500/10 to-emerald-500/10 border border-sky-400/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-16 h-16 text-sky-400" strokeWidth={1.5} />
              </div>
              <div className="absolute -inset-4 rounded-full border border-sky-400/10 animate-spin-very-slow" />
              <div className="absolute -inset-8 rounded-full border border-emerald-400/5 animate-spin-very-slow-reverse" />
              <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping-slow" />
              <div className="absolute bottom-2 left-0 w-2 h-2 rounded-full bg-sky-400 animate-ping-slow delay-500" />
            </div>
          </div>
        </div>

        <div className={`transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-400/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sky-300 text-sm font-medium tracking-wide">End-to-End Encrypted</span>
          </div>
        </div>

        <h1 className={`text-6xl lg:text-8xl font-bold leading-none tracking-tight whitespace-nowrap transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-white">Secure</span>
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Comm</span>
        </h1>

        <p className={`mt-6 text-lg lg:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Private conversations that leave no trace. Military-grade encryption, zero data retention, no registration required.
        </p>

        <div className={`mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 transition-all duration-1000 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {['AES-256-GCM', 'Zero Knowledge', 'Open Source', 'No Logs'].map((tag) => (
            <span key={tag} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-sky-400" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce-slow">
        <div className="flex flex-col items-center gap-1 text-slate-600">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
        </div>
      </div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-sky-500/5 blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none animate-float-medium" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/3 blur-3xl pointer-events-none" />
    </section>
  );
}
