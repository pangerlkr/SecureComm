import React from 'react';
import ParticleField from './landing/ParticleField';
import HeroSection from './landing/HeroSection';
import ActionSection from './landing/ActionSection';
import HowItWorksSection from './landing/HowItWorksSection';
import FeaturesSection from './landing/FeaturesSection';
import StatsSection from './landing/StatsSection';
import UseCasesSection from './landing/UseCasesSection';
import ShowcaseSlideshow from './landing/ShowcaseSlideshow';
import Footer from './landing/Footer';

interface LandingProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

function Divider() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
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

        <StatsSection />

        <Divider />

        <ActionSection onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />

        <Divider />

        <ShowcaseSlideshow />

        <Divider />

        <HowItWorksSection />

        <Divider />

        <UseCasesSection />

        <Divider />

        <FeaturesSection />

        <Footer />
      </div>
    </div>
  );
}
