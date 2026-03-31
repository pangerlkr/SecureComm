import React from 'react';
import { PlusSquare, Share2, Lock } from 'lucide-react';
import { useStaggerReveal } from '../../hooks/useScrollReveal';

const steps = [
  {
    icon: PlusSquare,
    number: '01',
    title: 'Create a Room',
    description: 'Generate an encrypted room in one click. A unique ID is created — no sign-up, no setup.',
    color: 'sky',
  },
  {
    icon: Share2,
    number: '02',
    title: 'Share the Link',
    description: 'Send the room ID or link to anyone you want to talk to. Works on any device.',
    color: 'cyan',
  },
  {
    icon: Lock,
    number: '03',
    title: 'Chat Privately',
    description: 'All messages are encrypted end-to-end. When the room empties, everything is wiped.',
    color: 'emerald',
  },
];

const colorMap: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  sky: {
    border: 'border-sky-400/30',
    text: 'text-sky-400',
    bg: 'bg-sky-400/10',
    glow: 'shadow-sky-500/20',
  },
  cyan: {
    border: 'border-cyan-400/30',
    text: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    glow: 'shadow-cyan-500/20',
  },
  emerald: {
    border: 'border-emerald-400/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    glow: 'shadow-emerald-500/20',
  },
};

export default function HowItWorksSection() {
  const refs = useStaggerReveal<HTMLDivElement>(steps.length);

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sky-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Process</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Three steps to
            <span className="text-sky-400"> privacy</span>
          </h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px">
            <div className="w-full h-full bg-gradient-to-r from-sky-400/30 via-cyan-400/30 to-emerald-400/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400/60 via-cyan-400/60 to-emerald-400/60 animate-shimmer" />
          </div>

          {steps.map((step, i) => {
            const c = colorMap[step.color];
            return (
              <div
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                className="reveal-item group"
              >
                <div className={`relative rounded-2xl border ${c.border} bg-white/3 p-6 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.glow}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <span className={`text-4xl font-bold ${c.text} opacity-20 leading-none mt-1`}>{step.number}</span>
                  </div>
                  <h3 className={`text-lg font-semibold text-white mb-2`}>{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
