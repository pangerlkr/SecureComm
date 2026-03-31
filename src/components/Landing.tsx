import React from 'react';
import ParticleField from './landing/ParticleField';
import HeroSection from './landing/HeroSection';
import ActionSection from './landing/ActionSection';
import HowItWorksSection from './landing/HowItWorksSection';
import FeaturesSection from './landing/FeaturesSection';

interface LandingProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function Landing({ onCreateRoom, onJoinRoom }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#030d1a] text-white overflow-x-hidden">
      <ParticleField />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-sky-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/4 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <HeroSection />

        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
        </div>

        <ActionSection onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />

        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        <HowItWorksSection />

        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        <FeaturesSection />

        <footer className="py-12 px-4 text-center border-t border-white/5">
          <p className="text-slate-600 text-sm">
            No registration &nbsp;&bull;&nbsp; Zero data retention &nbsp;&bull;&nbsp; Open source security
          </p>
        </footer>
      </div>
    </div>
  );
}
