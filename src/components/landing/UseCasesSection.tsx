import React from 'react';
import { FileText, Briefcase, HeartPulse, Scale, Globe, Users } from 'lucide-react';
import { useDirectionalReveal, useScrollReveal } from '../../hooks/useScrollReveal';

interface UseCase {
  icon: React.ElementType;
  tag: string;
  title: string;
  body: string;
  detail: string;
  color: string;
}

const useCases: UseCase[] = [
  {
    icon: FileText,
    tag: 'Journalism',
    title: 'Protect your sources',
    body: 'Investigative journalists and whistleblowers communicate without fear. Messages leave no trace on any server — ever.',
    detail: 'Used by reporters covering high-risk stories where source protection is non-negotiable.',
    color: 'sky',
  },
  {
    icon: Briefcase,
    tag: 'Business',
    title: 'Sensitive negotiations',
    body: 'M&A discussions, board-level decisions, and competitive intelligence stay entirely within your team.',
    detail: 'No corporate espionage vector. End-to-end encrypted with ephemeral rooms.',
    color: 'amber',
  },
  {
    icon: HeartPulse,
    tag: 'Healthcare',
    title: 'Patient-first privacy',
    body: 'Clinicians share sensitive patient information in compliance with privacy requirements — no data leaves the session.',
    detail: 'Ephemeral by design. Nothing persists after the consultation ends.',
    color: 'rose',
  },
  {
    icon: Scale,
    tag: 'Legal',
    title: 'Attorney-client privilege',
    body: 'Lawyers and clients communicate with the same discretion expected of privileged communication.',
    detail: 'Zero-knowledge architecture ensures only the parties in the room can read the exchange.',
    color: 'emerald',
  },
  {
    icon: Globe,
    tag: 'Activism',
    title: 'Organizing safely',
    body: 'Activists and civil society groups coordinate in regions with surveillance concerns, fully anonymously.',
    detail: 'No accounts, no metadata, no footprint. Just the conversation.',
    color: 'cyan',
  },
  {
    icon: Users,
    tag: 'Personal',
    title: 'Private conversations',
    body: 'Talk about anything without it being analyzed, mined, or sold. Your conversations stay between you and who you invited.',
    detail: 'The room vanishes the moment everyone leaves. No history, no cloud backup.',
    color: 'teal',
  },
];

const colorMap: Record<string, { border: string; text: string; bg: string; tagCls: string }> = {
  sky:     { border: 'border-sky-400/25',     text: 'text-sky-400',     bg: 'bg-sky-400/10',     tagCls: 'bg-sky-400/10 text-sky-300 border-sky-400/20' },
  amber:   { border: 'border-amber-400/25',   text: 'text-amber-400',   bg: 'bg-amber-400/10',   tagCls: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
  rose:    { border: 'border-rose-400/25',    text: 'text-rose-400',    bg: 'bg-rose-400/10',    tagCls: 'bg-rose-400/10 text-rose-300 border-rose-400/20' },
  emerald: { border: 'border-emerald-400/25', text: 'text-emerald-400', bg: 'bg-emerald-400/10', tagCls: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
  cyan:    { border: 'border-cyan-400/25',    text: 'text-cyan-400',    bg: 'bg-cyan-400/10',    tagCls: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' },
  teal:    { border: 'border-teal-400/25',    text: 'text-teal-400',    bg: 'bg-teal-400/10',    tagCls: 'bg-teal-400/10 text-teal-300 border-teal-400/20' },
};

function UseCaseCard({ useCase, direction }: { useCase: UseCase; direction: 'left' | 'right' }) {
  const ref = useDirectionalReveal<HTMLDivElement>(direction);
  const c = colorMap[useCase.color];

  return (
    <div ref={ref} className="group">
      <div className={`rounded-2xl border ${c.border} bg-white/[0.02] p-6 lg:p-8 flex gap-5 hover:bg-white/[0.04] transition-all duration-300`}>
        <div className="flex-shrink-0 mt-1">
          <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <useCase.icon className={`w-6 h-6 ${c.text}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.tagCls}`}>{useCase.tag}</span>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">{useCase.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">{useCase.body}</p>
          <p className={`text-xs ${c.text} opacity-70 leading-relaxed`}>{useCase.detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function UseCasesSection() {
  const headRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute right-0 top-1/3 w-[400px] h-[400px] rounded-full bg-emerald-500/4 blur-[100px] pointer-events-none" />
      <div className="max-w-4xl mx-auto relative">
        <div ref={headRef} className="reveal-item text-center mb-16">
          <span className="text-sky-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Use cases</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Who needs
            <span className="text-sky-400"> true privacy?</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            From journalists to professionals to everyday users — anyone who values conversation privacy.
          </p>
        </div>

        <div className="space-y-4">
          {useCases.map((uc, i) => (
            <UseCaseCard key={i} useCase={uc} direction={i % 2 === 0 ? 'left' : 'right'} />
          ))}
        </div>
      </div>
    </section>
  );
}
