'use client';
import { useState } from 'react';
import { Search, Shield, GitBranch, FileText } from 'lucide-react';

export default function Home() {
  const [input, setInput] = useState('');
  const [isTracing, setIsTracing] = useState(false);

  const handleTrace = () => {
    if (!input) return;
    setIsTracing(true);
    setTimeout(() => setIsTracing(false), 2000);
  };

  return (
    <main className='min-h-screen'>
      <div className='bg-gradient-to-r from-[#6d5bff] to-[#00e5ff] text-black text-center py-2 text-sm font-medium'>
        AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026 — <a href='https://cerebralvalley.ai/e/meta-ai-developer-hackathon' className='underline font-bold'>cerebralvalley.ai/e/meta-ai-developer-hackathon</a>
      </div>

      <header className='border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-[#6d5bff] to-[#00e5ff] flex items-center justify-center font-bold text-black'>T</div>
            <span className='font-bold text-xl tracking-tight'>TraceX AI</span>
            <span className='text-xs px-2 py-1 rounded-full bg-[#6d5bff]/20 text-[#6d5bff] border border-[#6d5bff]/30 ml-2'>Meta AI Hackathon 2026</span>
          </div>
          <div className='flex items-center gap-4 text-sm text-white/60'>
            <span>Ethereum Mainnet</span>
            <div className='w-2 h-2 rounded-full bg-green-400 animate-pulse'></div>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-6'>
            <span className='w-2 h-2 rounded-full bg-[#6d5bff] animate-pulse'></span>
            Official Submission — Meta AI Developer Hackathon 2026
          </div>
          <h1 className='text-5xl font-bold tracking-tight mb-4 leading-tight'>
            AI-powered blockchain forensics<br />
            <span className='bg-gradient-to-r from-[#6d5bff] to-[#00e5ff] bg-clip-text text-transparent'>that traces crypto flows</span>
          </h1>
          <p className='text-white/60 max-w-3xl mx-auto text-lg mt-6'>
            Investigates suspicious transactions and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026 with Llama, Muse Spark, and Muse Code.
          </p>
          <p className='text-white/40 max-w-2xl mx-auto text-sm mt-3'>
            Built for <a href='https://cerebralvalley.ai/e/meta-ai-developer-hackathon' className='text-[#6d5bff] underline'>https://cerebralvalley.ai/e/meta-ai-developer-hackathon</a> — $1M prize pool
          </p>
        </div>

        <div className='glass rounded-2xl p-2 max-w-3xl mx-auto mb-16 flex gap-2'>
          <div className='flex-1 flex items-center gap-3 px-4'>
            <Search className='w-5 h-5 text-white/40' />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='0x... transaction hash or wallet or ENS — try it'
              className='flex-1 bg-transparent outline-none placeholder:text-white/30'
            />
          </div>
          <button onClick={handleTrace} className='px-6 py-3 rounded-xl bg-[#6d5bff] hover:bg-[#5a4ae6] font-medium transition-colors'>
            {isTracing ? 'Tracing...' : 'Investigate'}
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
          <div className='glass rounded-2xl p-6'>
            <GitBranch className='w-8 h-8 text-[#6d5bff] mb-4' />
            <h3 className='font-semibold mb-2'>Fund Flow Graph</h3>
            <p className='text-sm text-white/60'>Interactive React Flow visualization. Follow money across wallets up to 20 hops with BFS + loop avoidance.</p>
          </div>
          <div className='glass rounded-2xl p-6'>
            <Shield className='w-8 h-8 text-[#00e5ff] mb-4' />
            <h3 className='font-semibold mb-2'>Heuristics Engine</h3>
            <p className='text-sm text-white/60'>Python + NetworkX detects mixers (Tornado Cash), peel chains, exchange hopping, high-velocity laundering.</p>
          </div>
          <div className='glass rounded-2xl p-6'>
            <FileText className='w-8 h-8 text-white/60 mb-4' />
            <h3 className='font-semibold mb-2'>Evidence-Backed AI</h3>
            <p className='text-sm text-white/60'>Meta Llama 3.3 via Muse Spark explains trails in plain English with tx hash citations — no hallucinations.</p>
          </div>
        </div>

        <div className='glass rounded-2xl p-8'>
          <h2 className='font-semibold mb-6'>How it works — Built for Meta AI Hackathon 2026</h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-sm'>
            <div><span className='text-[#6d5bff] font-bold'>01</span> Paste tx hash → Alchemy + Etherscan fetch</div>
            <div><span className='text-[#6d5bff] font-bold'>02</span> Build graph → Python heuristics + risk score</div>
            <div><span className='text-[#6d5bff] font-bold'>03</span> Llama explains → evidence-backed narrative</div>
            <div><span className='text-[#6d5bff] font-bold'>04</span> Export PDF → usable as evidence draft</div>
          </div>
          <div className='mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40'>
            <span>Built with Muse Spark, Llama 3.3, Meta AI, Muse Code</span>
            <a href='https://cerebralvalley.ai/e/meta-ai-developer-hackathon' className='text-[#6d5bff] hover:underline'>Hackathon Link →</a>
          </div>
        </div>
      </div>
    </main>
  );
}
