import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Zap, Users, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const slides = [
  {
    icon: Shield,
    eyebrow: 'Encryption',
    title: 'Your messages are sealed before they move',
    body: 'Every character you type is encrypted with AES-256-GCM using a session key that exists only in memory — never persisted, never transmitted to our servers.',
    visual: 'encrypt',
    color: 'sky',
  },
  {
    icon: Users,
    eyebrow: 'Rooms',
    title: 'Invite anyone. No account required.',
    body: 'Share a 9-character room ID or link. Anyone can join instantly — no sign-up, no verification, no tracking cookies.',
    visual: 'room',
    color: 'emerald',
  },
  {
    icon: MessageSquare,
    eyebrow: 'Real-time',
    title: 'Text, voice, and video in one encrypted space',
    body: 'Chat messages broadcast over encrypted WebSocket channels. Voice and video stream peer-to-peer via WebRTC — no relay server in the middle.',
    visual: 'comms',
    color: 'cyan',
  },
  {
    icon: Zap,
    eyebrow: 'Ephemeral',
    title: 'Rooms self-destruct when empty',
    body: 'When the last participant leaves, the room and all associated data are permanently deleted. Not archived. Not anonymized. Gone.',
    visual: 'destruct',
    color: 'amber',
  },
];

const colorMap: Record<string, { text: string; border: string; bg: string; dot: string; bar: string }> = {
  sky:     { text: 'text-sky-400',     border: 'border-sky-400/30',     bg: 'bg-sky-400/10',     dot: 'bg-sky-400',     bar: 'bg-sky-400' },
  emerald: { text: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
  cyan:    { text: 'text-cyan-400',    border: 'border-cyan-400/30',    bg: 'bg-cyan-400/10',    dot: 'bg-cyan-400',    bar: 'bg-cyan-400' },
  amber:   { text: 'text-amber-400',   border: 'border-amber-400/30',   bg: 'bg-amber-400/10',   dot: 'bg-amber-400',   bar: 'bg-amber-400' },
};

function VisualEncrypt() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      {['Hello, are you there?', '••••• ••• •• ••• ••••?', 'AES256:8f3a…c91e'].map((line, i) => (
        <div key={i} className={`rounded-lg px-4 py-2.5 text-sm font-mono transition-all duration-700 ${
          i === 0 ? 'bg-white/5 text-slate-300 border border-white/10' :
          i === 1 ? 'bg-sky-400/10 text-sky-300 border border-sky-400/20' :
          'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 text-xs'
        }`}>
          {line}
        </div>
      ))}
      <div className="flex justify-center mt-2 gap-2">
        {['Plain', '→', 'Cipher', '→', 'Wire'].map((s, i) => (
          <span key={i} className={`text-xs ${i % 2 === 0 ? 'text-slate-400' : 'text-sky-400/50'}`}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function VisualRoom() {
  const avatars = ['A', 'J', 'M', 'S'];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 font-mono text-emerald-400 tracking-widest text-lg">
        XK9-TZ2-R4P
      </div>
      <div className="text-slate-500 text-xs">Room ID</div>
      <div className="flex -space-x-2">
        {avatars.map((a, i) => (
          <div key={i} className="w-9 h-9 rounded-full bg-sky-400/20 border-2 border-[#030d1a] flex items-center justify-center text-sky-400 text-xs font-bold">
            {a}
          </div>
        ))}
        <div className="w-9 h-9 rounded-full bg-white/5 border-2 border-[#030d1a] border-dashed border-white/20 flex items-center justify-center text-slate-500 text-xs">
          +
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        4 connected
      </div>
    </div>
  );
}

function VisualComms() {
  const messages = [
    { side: 'left',  text: 'Are we all encrypted?', time: '10:41' },
    { side: 'right', text: 'Yes — E2E active ✓',    time: '10:41' },
    { side: 'left',  text: 'Starting video now…',   time: '10:42' },
  ];
  return (
    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.side === 'right' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[70%] rounded-xl px-3 py-2 text-xs ${
            m.side === 'right'
              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/20'
              : 'bg-white/5 text-slate-300 border border-white/10'
          }`}>
            <span>{m.text}</span>
            <span className="block text-right opacity-40 mt-0.5">{m.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualDestruct() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);

  const labels = ['Room active', 'Last user left', 'Purging data…', 'Room deleted'];
  const colors = ['text-emerald-400', 'text-amber-400', 'text-orange-400', 'text-rose-400'];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-2xl border border-rose-400/20 bg-rose-400/5 flex items-center justify-center">
        <Zap className={`w-10 h-10 ${colors[frame]} transition-colors duration-500`} />
      </div>
      <div className={`text-sm font-medium ${colors[frame]} transition-colors duration-500`}>{labels[frame]}</div>
      <div className="flex gap-1.5">
        {labels.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === frame ? 'bg-rose-400 scale-125' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}

const visuals: Record<string, React.ReactNode> = {
  encrypt: <VisualEncrypt />,
  room:    <VisualRoom />,
  comms:   <VisualComms />,
  destruct:<VisualDestruct />,
};

export default function ShowcaseSlideshow() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const headRef = useScrollReveal<HTMLDivElement>();

  const go = useCallback((index: number, dir: 'next' | 'prev') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);
    setTimeout(() => {
      setActive(index);
      setAnimating(false);
    }, 320);
  }, [animating]);

  const next = useCallback(() => go((active + 1) % slides.length, 'next'), [active, go]);
  const prev = useCallback(() => go((active - 1 + slides.length) % slides.length, 'prev'), [active, go]);

  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [next]);

  const slide = slides[active];
  const c = colorMap[slide.color];

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-sky-500/4 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        <div ref={headRef} className="reveal-item text-center mb-14">
          <span className="text-sky-400 text-sm font-semibold tracking-widest uppercase mb-3 block">How it works</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            The security
            <span className="text-sky-400"> stack</span>
          </h2>
        </div>

        <div className={`rounded-2xl border ${c.border} bg-white/[0.02] overflow-hidden`}>
          <div className="grid lg:grid-cols-2 min-h-[380px]">
            <div
              className={`p-8 lg:p-10 flex flex-col justify-center slide-content ${animating ? (direction === 'next' ? 'slide-exit-left' : 'slide-exit-right') : 'slide-enter'}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
                  <slide.icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <span className={`text-xs font-semibold tracking-widest uppercase ${c.text}`}>{slide.eyebrow}</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-snug">{slide.title}</h3>
              <p className="text-slate-400 leading-relaxed">{slide.body}</p>
            </div>

            <div className={`border-t lg:border-t-0 lg:border-l ${c.border} bg-white/[0.01] flex items-center justify-center p-8 slide-content ${animating ? (direction === 'next' ? 'slide-exit-left' : 'slide-exit-right') : 'slide-enter'}`}>
              {visuals[slide.visual]}
            </div>
          </div>

          <div className={`border-t ${c.border} bg-white/[0.01] px-6 py-4 flex items-center justify-between`}>
            <div className="flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => go(i, i > active ? 'next' : 'prev')}
                  className="relative overflow-hidden"
                >
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? `w-8 ${colorMap[s.color].bar}` : 'w-4 bg-white/10 hover:bg-white/20'}`} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={next}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
