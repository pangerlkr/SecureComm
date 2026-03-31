import React from 'react';
import { useCountUp, useScrollReveal } from '../../hooks/useScrollReveal';

interface StatProps {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  sublabel: string;
  color: string;
}

function StatCard({ value, suffix, prefix = '', label, sublabel, color }: StatProps) {
  const { count, ref } = useCountUp(value, 2000);

  const colorMap: Record<string, { text: string; border: string; glow: string }> = {
    sky:     { text: 'text-sky-400',     border: 'border-sky-400/20',     glow: 'bg-sky-400/5' },
    emerald: { text: 'text-emerald-400', border: 'border-emerald-400/20', glow: 'bg-emerald-400/5' },
    cyan:    { text: 'text-cyan-400',    border: 'border-cyan-400/20',    glow: 'bg-cyan-400/5' },
    amber:   { text: 'text-amber-400',   border: 'border-amber-400/20',   glow: 'bg-amber-400/5' },
  };
  const c = colorMap[color] ?? colorMap.sky;

  return (
    <div className={`relative rounded-2xl border ${c.border} ${c.glow} p-6 text-center overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02]" />
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={`text-5xl lg:text-6xl font-bold ${c.text} leading-none mb-1 tabular-nums`}
      >
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-white font-semibold mt-2">{label}</div>
      <div className="text-slate-500 text-xs mt-1">{sublabel}</div>
    </div>
  );
}

const stats: StatProps[] = [
  { value: 256, suffix: '-bit', label: 'Encryption Strength', sublabel: 'AES-256-GCM standard', color: 'sky' },
  { value: 0,   suffix: '',     label: 'Data Retained',       sublabel: 'Absolute zero storage', color: 'emerald' },
  { value: 100, suffix: '%',    label: 'Peer-to-Peer',        sublabel: 'Direct WebRTC tunneling', color: 'cyan' },
  { value: 0,   suffix: '',     label: 'Registration Needed', sublabel: 'Anonymous by design',   color: 'amber' },
];

export default function StatsSection() {
  const headRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-sky-500/5 blur-[80px] pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <div ref={headRef} className="reveal-item text-center mb-14">
          <span className="text-sky-400 text-sm font-semibold tracking-widest uppercase mb-3 block">By the numbers</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Security you can
            <span className="text-sky-400"> measure</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {stats.map((s, i) => (
            <div
              key={i}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
