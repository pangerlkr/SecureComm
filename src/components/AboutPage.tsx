import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Shield, Code2, Cpu, Globe, Mail, Phone,
  Github, Linkedin, Twitter, Instagram, Facebook,
  ArrowLeft, ExternalLink, ChevronRight,
} from 'lucide-react';
import ParticleField from './landing/ParticleField';
import { useDirectionalReveal, useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';

/* ─── Marquee Belt ─────────────────────────────────────────── */
const tags = [
  'AES-256-GCM', 'Penetration Testing', 'WebRTC', 'Cybersecurity',
  'NEXUSCIPHERGUARD', 'Nagaland, India', 'Aegis Mind Technologies',
  'Ethical Hacking', 'Zero Trust', 'E2E Encryption', 'Threat Analysis',
  'Advisory', 'Open Source', 'Social Engineering', 'OSINT',
  'Offensive Security', 'Vulnerability Assessment', 'North-East India',
];

function MarqueeBelt() {
  const repeated = [...tags, ...tags, ...tags];
  return (
    <div className="relative overflow-hidden py-4 border-y border-white/5">
      <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-[#030d1a] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-[#030d1a] to-transparent z-10 pointer-events-none" />
      <div className="flex gap-4 marquee-track whitespace-nowrap">
        {repeated.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/15 bg-sky-400/5 text-sky-300/70 text-xs font-medium flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-sky-400/50" />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── 3D Tilt Card ─────────────────────────────────────────── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (cy - 0.5) * -14, y: (cx - 0.5) * 14 });
    setGlow({ x: cx * 100, y: cy * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlow({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group ${className}`}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(14,165,233,0.12), transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ─── Typewriter Quote ─────────────────────────────────────── */
function TypewriterQuote({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [started, text]);

  return (
    <div ref={ref} className="min-h-[2rem]">
      <span className="text-white/90">{displayed}</span>
      {started && displayed.length < text.length && (
        <span className="inline-block w-0.5 h-5 bg-sky-400 ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
}

/* ─── Venture Card ─────────────────────────────────────────── */
interface Venture {
  name: string;
  role: string;
  description: string;
  tags: string[];
  color: string;
  icon: React.ElementType;
  link?: string;
}

function VentureCard({ venture, direction }: { venture: Venture; direction: 'left' | 'right' }) {
  const ref = useDirectionalReveal<HTMLDivElement>(direction);
  const colorMap: Record<string, { border: string; text: string; bg: string; tag: string }> = {
    sky:     { border: 'border-sky-400/20',     text: 'text-sky-400',     bg: 'bg-sky-400/10',     tag: 'bg-sky-400/10 text-sky-300' },
    emerald: { border: 'border-emerald-400/20', text: 'text-emerald-400', bg: 'bg-emerald-400/10', tag: 'bg-emerald-400/10 text-emerald-300' },
    amber:   { border: 'border-amber-400/20',   text: 'text-amber-400',   bg: 'bg-amber-400/10',   tag: 'bg-amber-400/10 text-amber-300' },
    cyan:    { border: 'border-cyan-400/20',    text: 'text-cyan-400',    bg: 'bg-cyan-400/10',    tag: 'bg-cyan-400/10 text-cyan-300' },
  };
  const c = colorMap[venture.color];

  return (
    <div ref={ref}>
      <TiltCard className="h-full">
        <div className={`h-full rounded-2xl border ${c.border} bg-white/[0.02] p-6 flex flex-col gap-4`}>
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
              <venture.icon className={`w-5 h-5 ${c.text}`} />
            </div>
            {venture.link && (
              <a
                href={venture.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${c.text} opacity-50 hover:opacity-100 transition-opacity`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div>
            <div className={`text-xs font-semibold ${c.text} uppercase tracking-widest mb-1`}>{venture.role}</div>
            <h4 className="text-white font-semibold text-base">{venture.name}</h4>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed flex-1">{venture.description}</p>
          <div className="flex flex-wrap gap-2">
            {venture.tags.map((t, i) => (
              <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${c.tag}`}>{t}</span>
            ))}
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

const ventures: Venture[] = [
  {
    name: 'NEXUSCIPHERGUARD India',
    role: 'Founder',
    description: 'A cybersecurity initiative delivering awareness programs, consulting, advisory, and vulnerability assessment solutions. Built with a long-term vision of becoming a regional cybersecurity force.',
    tags: ['Cybersecurity', 'Advisory', 'Consulting', 'Awareness'],
    color: 'sky',
    icon: Shield,
  },
  {
    name: 'Aegis Mind Technologies',
    role: 'Acquisition · Bangalore',
    description: 'Strategic acquisition that strengthened technical and development capabilities, expanding operational reach beyond regional boundaries and integrating technology services with cybersecurity vision.',
    tags: ['Acquisition', 'Technology', 'Development', 'Bangalore'],
    color: 'emerald',
    icon: Cpu,
  },
  {
    name: 'MMB Cyber School',
    role: 'Cybersecurity Advisor',
    description: 'Strategic and technical guidance for a non-profit cyber school. Supporting digital literacy initiatives, curriculum development, and long-term cybersecurity ecosystem development.',
    tags: ['Advisory', 'Non-Profit', 'Education', 'Digital Literacy'],
    color: 'cyan',
    icon: Code2,
  },
];

const socials = [
  { icon: Github,    label: 'GitHub',      href: 'https://github.com/pangerlkr' },
  { icon: Linkedin,  label: 'LinkedIn',    href: 'https://linkedin.com/in/pangerlkr' },
  { icon: Twitter,   label: 'X / Twitter', href: 'https://x.com/panger__lkr' },
  { icon: Instagram, label: 'Instagram',   href: 'https://instagram.com/panger__lkr' },
  { icon: Facebook,  label: 'Facebook',    href: 'https://facebook.com/lkr.panger' },
  { icon: Globe,     label: 'Website',     href: 'https://pangerlkr.link' },
];

/* ─── About Page ───────────────────────────────────────────── */
interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const profileRef = useScrollReveal<HTMLDivElement>();
  const quoteSectionRef = useScrollReveal<HTMLDivElement>();
  const socialRefs = useStaggerReveal<HTMLDivElement>(socials.length);
  const venturesHeadRef = useScrollReveal<HTMLDivElement>();
  const contactRef = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-[#030d1a] text-white overflow-x-hidden">
      <ParticleField />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] rounded-full bg-sky-500/4 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] rounded-full bg-emerald-500/4 blur-[80px]" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between max-w-5xl mx-auto px-4 py-5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back
          </button>

          <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <span className="text-white">Secure</span>
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Comm</span>
          </div>

          <a
            href="https://pangerlkr.link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors duration-200"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">pangerlkr.link</span>
          </a>
        </nav>

        {/* Page header */}
        <header className="max-w-5xl mx-auto px-4 pt-8 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 mb-4">
            <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Maintainer</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">About the Author</h1>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            The person behind SecureComm — background, philosophy, ventures, and ways to connect.
          </p>
        </header>

        <MarqueeBelt />

        {/* Maintainer Hero */}
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-10">
          <div ref={profileRef} className="reveal-item">
            <TiltCard>
              <div className="rounded-2xl border border-sky-400/10 bg-white/[0.02] p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-sky-500/4 blur-[60px] pointer-events-none" />

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 border-sky-400/30 ring-4 ring-sky-400/8 bg-slate-800/60">
                        <img
                          src="/panger-lkr.png"
                          alt="Panger Lkr"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#030d1a] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase">Maintainer</span>
                      <span className="w-12 h-px bg-sky-400/30" />
                      <span className="text-slate-500 text-xs">Nagaland, India</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-1">Panger Lkr</h2>
                    <p className="text-slate-400 text-sm mb-4">Pangerkumzuk Longkumer</p>
                    <p className="text-slate-300 leading-relaxed max-w-xl">
                      Cybersecurity professional and entrepreneur. Operates with an offensive mindset and defensive execution —
                      building awareness, resilience, and systems that withstand real-world threats.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-5">
                      {['Offensive Security', 'Threat Analysis', 'Entrepreneur', 'Open Source'].map((t, i) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-full border border-sky-400/15 text-sky-300/60 bg-sky-400/5">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Philosophy */}
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div ref={quoteSectionRef} className="reveal-item">
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] px-8 lg:px-12 py-8 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-sky-400/60 via-sky-400/30 to-transparent" />
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Philosophy</p>
              <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed">
                <TypewriterQuote text="Security is not broken by sophistication. It is broken by oversight." />
              </blockquote>
              <p className="text-slate-500 text-sm mt-4">— Panger Lkr</p>
            </div>
          </div>
        </div>

        {/* Ventures */}
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div ref={venturesHeadRef} className="reveal-item text-center mb-10">
            <span className="text-sky-400 text-xs font-semibold tracking-widest uppercase mb-3 block">Ventures &amp; Roles</span>
            <h3 className="text-2xl font-bold text-white">Building the ecosystem</h3>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {ventures.map((v, i) => (
              <VentureCard key={i} venture={v} direction={i % 2 === 0 ? 'left' : 'right'} />
            ))}
          </div>
        </div>

        {/* Contact + Social */}
        <div className="max-w-5xl mx-auto px-4 py-10 pb-20">
          <div ref={contactRef} className="reveal-item">
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-8 lg:p-10">
              <div className="grid lg:grid-cols-2 gap-10">

                <div>
                  <p className="text-sky-400 text-xs font-semibold tracking-widest uppercase mb-6">Connect</p>
                  <div className="grid grid-cols-3 gap-3">
                    {socials.map((s, i) => (
                      <div
                        key={i}
                        ref={(el) => { socialRefs.current[i] = el; }}
                        className="reveal-item"
                        style={{ transitionDelay: `${i * 80}ms` }}
                      >
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-sky-400/25 hover:bg-sky-400/5 transition-all duration-300"
                        >
                          <s.icon className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors duration-300" />
                          <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors duration-300 text-center leading-tight">{s.label}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sky-400 text-xs font-semibold tracking-widest uppercase mb-6">Direct Contact</p>
                  <div className="space-y-4">
                    <a
                      href="mailto:contact@pangerlkr.link"
                      className="group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-sky-400/20 hover:bg-sky-400/5 transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Email</div>
                        <div className="text-white text-sm group-hover:text-sky-300 transition-colors">contact@pangerlkr.link</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 ml-auto transition-colors" />
                    </a>

                    <a
                      href="tel:+918132872135"
                      className="group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-emerald-400/20 hover:bg-emerald-400/5 transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Phone (IST)</div>
                        <div className="text-white text-sm group-hover:text-emerald-300 transition-colors">+91 81328 72135</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 ml-auto transition-colors" />
                    </a>

                    <a
                      href="https://pangerlkr.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Website</div>
                        <div className="text-white text-sm group-hover:text-cyan-300 transition-colors">pangerlkr.link</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 ml-auto transition-colors" />
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-sky-400/20 bg-slate-800/80 flex-shrink-0">
                <img src="/panger-lkr.png" alt="Panger Lkr" className="w-full h-full object-cover" />
              </div>
              <span className="text-slate-500 text-xs">
                Built &amp; maintained by{' '}
                <a href="https://pangerlkr.link" target="_blank" rel="noopener noreferrer" className="text-sky-400/80 hover:text-sky-400 transition-colors">
                  Panger Lkr
                </a>
                {' '}·{' '}
                <a href="https://pangerlkr.link" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 transition-colors">
                  pangerlkr.link
                </a>
              </span>
            </div>
            <button onClick={onBack} className="text-slate-500 hover:text-slate-300 text-xs transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3" />
              Back to SecureComm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
