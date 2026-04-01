import React, { useState } from 'react';
import { ArrowLeft, GitFork, Copy, Check, Terminal, ExternalLink, Github } from 'lucide-react';
import ParticleField from './landing/ParticleField';

interface Method {
  id: string;
  label: string;
  badge: string;
  description: string;
  steps: { comment: string; command: string }[];
}

const methods: Method[] = [
  {
    id: 'dev',
    label: 'Local Development',
    badge: 'Recommended',
    description: 'Start a local dev server with hot reloading. Best suited for contributors, testers, and developers who want to explore the codebase.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Install dependencies', command: 'npm install' },
      { comment: '# Start the dev server', command: 'npm run dev' },
    ],
  },
  {
    id: 'prod',
    label: 'Production Build',
    badge: 'Node.js',
    description: 'Build and serve an optimised production bundle. Recommended for deploying SecureComm on a server or VPS.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Install dependencies', command: 'npm install' },
      { comment: '# Build optimised assets', command: 'npm run build' },
      { comment: '# Start the production server', command: 'npm start' },
    ],
  },
  {
    id: 'docker',
    label: 'Docker',
    badge: 'Container',
    description: 'Build and run a containerised image. Isolates all dependencies for reproducible, portable deployments.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Build the Docker image', command: 'docker build -t securecomm .' },
      { comment: '# Run the container on port 3000', command: 'docker run -p 3000:3000 securecomm' },
    ],
  },
  {
    id: 'compose',
    label: 'Docker Compose',
    badge: 'Scalable',
    description: 'Use Docker Compose for structured and scalable deployments. Requires Docker and Docker Compose installed on the host.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Build and start all services', command: 'docker-compose up --build' },
    ],
  },
  {
    id: 'env',
    label: 'Env Configuration',
    badge: 'Custom Setup',
    description: 'Configure environment variables before building. Required when pointing to a custom Supabase project or enabling optional feature flags.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Copy the example env file', command: 'cp .env.example .env' },
      { comment: '# Edit values as needed (use any editor)', command: 'nano .env' },
      { comment: '# Install dependencies and build', command: 'npm install && npm run build' },
      { comment: '# Start the production server', command: 'npm start' },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all duration-200"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy all'}
    </button>
  );
}

interface ForkPageProps {
  onBack: () => void;
}

export default function ForkPage({ onBack }: ForkPageProps) {
  const [active, setActive] = useState('dev');
  const method = methods.find((m) => m.id === active)!;
  const allCommands = method.steps.map((s) => s.command).join('\n');

  return (
    <div className="min-h-screen bg-[#030d1a] text-white overflow-x-hidden">
      <ParticleField />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-sky-500/4 blur-[100px]" />
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
            href="https://github.com/pangerlkr/SecureComm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors duration-200"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>

        {/* Hero */}
        <header className="max-w-5xl mx-auto px-4 pt-10 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 mb-5">
            <GitFork className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Open Source</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Fork &amp; self-host in
            <span className="text-emerald-400"> minutes</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base lg:text-lg leading-relaxed">
            SecureComm is fully open source. Clone the repo, choose a deployment method below, and run your own end-to-end encrypted chat platform.
          </p>
          <a
            href="https://github.com/pangerlkr/SecureComm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-7 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-medium transition-all duration-200"
          >
            <GitFork className="w-4 h-4" />
            github.com/pangerlkr/SecureComm
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-4 pb-24">
          {/* Method selector */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                  active === m.id
                    ? 'border-emerald-400/40 bg-emerald-400/8 text-white'
                    : 'border-white/8 bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${active === m.id ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {m.badge}
                </div>
                <div className="text-sm font-medium leading-tight">{m.label}</div>
              </button>
            ))}
          </div>

          {/* Terminal block */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-white font-semibold">{method.label}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                      {method.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{method.description}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl m-4 bg-[#020b14] border border-white/8 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Terminal className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">bash</span>
                  </div>
                </div>
                <CopyButton text={allCommands} />
              </div>

              <div className="p-6 space-y-0.5 font-mono text-sm leading-relaxed overflow-x-auto">
                {method.steps.map((step, i) => (
                  <div key={i} className={i > 0 ? 'mt-4' : ''}>
                    <div className="text-slate-600 text-xs mb-1 select-none">{step.comment}</div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 select-none flex-shrink-0">$</span>
                      <span className="text-slate-200">{step.command}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
              { label: 'License', value: 'MIT', sub: 'Free to use and modify' },
              { label: 'Stack', value: 'React + Vite', sub: 'TypeScript, Tailwind, Supabase' },
              { label: 'Encryption', value: 'AES-256-GCM', sub: 'End-to-end, zero knowledge' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">{card.label}</div>
                <div className="text-white font-semibold mb-0.5">{card.value}</div>
                <div className="text-slate-500 text-xs">{card.sub}</div>
              </div>
            ))}
          </div>
        </main>

        {/* Bottom strip */}
        <div className="border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500 text-xs">
                Built &amp; maintained by{' '}
                <a href="https://pangerlkr.link" target="_blank" rel="noopener noreferrer" className="text-sky-400/80 hover:text-sky-400 transition-colors">
                  Panger Lkr
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
