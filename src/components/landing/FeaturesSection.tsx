import React from 'react';
import { Shield, Zap, Users, MessageSquare, Eye, Wifi } from 'lucide-react';
import { useStaggerReveal } from '../../hooks/useScrollReveal';

const features = [
  {
    icon: Shield,
    title: 'AES-256-GCM',
    description: 'Every message encrypted with military-grade AES-256-GCM before it leaves your device.',
    tag: 'Encryption',
    color: 'sky',
  },
  {
    icon: Zap,
    title: 'Self-Destruct',
    description: 'Rooms vanish completely when all participants leave. Zero trace, zero residue.',
    tag: 'Privacy',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Zero Registration',
    description: 'No email, no password, no account. Just a username and you\'re in.',
    tag: 'Anonymity',
    color: 'emerald',
  },
  {
    icon: Wifi,
    title: 'WebRTC P2P',
    description: 'Voice and video calls flow directly peer-to-peer, bypassing servers entirely.',
    tag: 'Direct',
    color: 'cyan',
  },
  {
    icon: Eye,
    title: 'No Surveillance',
    description: 'We cannot read your messages. Keys never leave your session.',
    tag: 'Zero Knowledge',
    color: 'rose',
  },
  {
    icon: MessageSquare,
    title: 'Rich Media',
    description: 'Text, voice, video, and file sharing — all end-to-end encrypted in one platform.',
    tag: 'Multimedia',
    color: 'teal',
  },
];

const colorMap: Record<string, { border: string; text: string; bg: string; tag: string }> = {
  sky:     { border: 'border-sky-400/20',     text: 'text-sky-400',     bg: 'bg-sky-400/10',     tag: 'bg-sky-400/10 text-sky-400' },
  amber:   { border: 'border-amber-400/20',   text: 'text-amber-400',   bg: 'bg-amber-400/10',   tag: 'bg-amber-400/10 text-amber-400' },
  emerald: { border: 'border-emerald-400/20', text: 'text-emerald-400', bg: 'bg-emerald-400/10', tag: 'bg-emerald-400/10 text-emerald-400' },
  cyan:    { border: 'border-cyan-400/20',    text: 'text-cyan-400',    bg: 'bg-cyan-400/10',    tag: 'bg-cyan-400/10 text-cyan-400' },
  rose:    { border: 'border-rose-400/20',    text: 'text-rose-400',    bg: 'bg-rose-400/10',    tag: 'bg-rose-400/10 text-rose-400' },
  teal:    { border: 'border-teal-400/20',    text: 'text-teal-400',    bg: 'bg-teal-400/10',    tag: 'bg-teal-400/10 text-teal-400' },
};

export default function FeaturesSection() {
  const refs = useStaggerReveal<HTMLDivElement>(features.length);

  return (
    <section className="relative py-24 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-950/10 to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <span className="text-sky-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Capabilities</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Built for
            <span className="text-sky-400"> uncompromising</span> security
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            Every feature is designed around one principle: your conversations are yours alone.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const c = colorMap[f.color];
            return (
              <div
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                className="reveal-item group"
              >
                <div className={`h-full rounded-2xl border ${c.border} bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <f.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.tag}`}>{f.tag}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
