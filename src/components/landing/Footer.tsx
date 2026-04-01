import React from 'react';
import { Github, User } from 'lucide-react';

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
    <div className="relative overflow-hidden py-5 border-y border-white/5">
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

interface FooterProps {
  onAbout: () => void;
}

export default function Footer({ onAbout }: FooterProps) {
  return (
    <footer className="relative overflow-hidden bg-[#020b16] border-t border-white/5">
      <div className="absolute top-0 left-1/4 w-[600px] h-[200px] rounded-full bg-sky-500/3 blur-[100px] pointer-events-none" />

      <MarqueeBelt />

      <div className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-sky-400/20 bg-slate-800/80 flex-shrink-0">
              <img src="/panger-lkr.png" alt="Panger Lkr" className="w-full h-full object-cover" />
            </div>
            <span className="text-slate-500 text-xs">
              Built &amp; maintained by{' '}
              <a
                href="https://pangerlkr.link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400/80 hover:text-sky-400 transition-colors"
              >
                Panger Lkr
              </a>
              {' '}·{' '}
              <a
                href="https://pangerlkr.link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-400 transition-colors"
              >
                pangerlkr.link
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onAbout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-sky-400 text-xs transition-colors duration-200"
            >
              <User className="w-3.5 h-3.5" />
              About the Author
            </button>
            <span className="text-slate-700">·</span>
            <span className="text-slate-600 text-xs">No registration &nbsp;·&nbsp; Zero data retention</span>
            <a
              href="https://github.com/pangerlkr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
