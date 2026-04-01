import React, { useState } from 'react';
import { GitFork, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface Method {
  id: string;
  label: string;
  description: string;
  steps: { comment: string; command: string }[];
}

const methods: Method[] = [
  {
    id: 'dev',
    label: 'Local Dev',
    description: 'Start a local development server with hot reloading. Best for contributors and testers.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Install dependencies', command: 'npm install' },
      { comment: '# Start the dev server', command: 'npm run dev' },
    ],
  },
  {
    id: 'prod',
    label: 'Production',
    description: 'Build and serve an optimised production bundle. Suitable for VPS or any Node.js host.',
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
    description: 'Build and run a containerised image. Isolates dependencies for reproducible deployments.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Build the Docker image', command: 'docker build -t securecomm .' },
      { comment: '# Run the container', command: 'docker run -p 3000:3000 securecomm' },
    ],
  },
  {
    id: 'compose',
    label: 'Compose',
    description: 'Use Docker Compose for structured, scalable deployments. Requires Docker and Compose installed.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Build and start services', command: 'docker-compose up --build' },
    ],
  },
  {
    id: 'env',
    label: 'Env Config',
    description: 'Configure environment variables before building. Required for custom Supabase endpoints or feature flags.',
    steps: [
      { comment: '# Clone the repository', command: 'git clone https://github.com/pangerlkr/SecureComm.git' },
      { comment: '# Enter the project directory', command: 'cd SecureComm' },
      { comment: '# Copy the example env file', command: 'cp .env.example .env' },
      { comment: '# Edit values as needed', command: 'nano .env' },
      { comment: '# Install and build', command: 'npm install && npm run build' },
      { comment: '# Start the server', command: 'npm start' },
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

export default function ForkSection() {
  const [active, setActive] = useState('dev');
  const ref = useScrollReveal<HTMLDivElement>();

  const method = methods.find((m) => m.id === active)!;
  const allCommands = method.steps.map((s) => s.command).join('\n');

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div ref={ref} className="reveal-item text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 mb-4">
            <GitFork className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Open Source</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Fork &amp; self-host in
            <span className="text-emerald-400"> minutes</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            SecureComm is fully open source. Clone the repo, pick a deployment method, and run your own encrypted chat platform.
          </p>
          <a
            href="https://github.com/pangerlkr/SecureComm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-medium transition-all duration-200"
          >
            <GitFork className="w-4 h-4" />
            github.com/pangerlkr/SecureComm
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-white/10 scrollbar-none">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 ${
                  active === m.id
                    ? 'text-emerald-400 border-emerald-400 bg-emerald-400/5'
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">{method.description}</p>

            <div className="rounded-xl bg-[#020b14] border border-white/8 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">bash</span>
                </div>
                <CopyButton text={allCommands} />
              </div>

              <div className="p-5 space-y-1 font-mono text-sm leading-relaxed overflow-x-auto">
                {method.steps.map((step, i) => (
                  <div key={i}>
                    <div className="text-slate-600 text-xs mt-3 first:mt-0 select-none">{step.comment}</div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 select-none flex-shrink-0">$</span>
                      <span className="text-slate-200">{step.command}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
