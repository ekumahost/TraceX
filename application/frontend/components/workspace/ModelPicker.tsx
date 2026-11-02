'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { fetchProviders, PROVIDER_LABEL, modelName, type ProviderChoice } from '@/lib/api';
import { setProviderChoice, useProviderChoice } from '@/lib/provider-choice';
import type { ProviderInfo } from '@/lib/types';

// Chooses which Meta model answers the brief, Ask and Recovery Kit. Auto starts with Muse Spark
// and switches to the next provider by itself if one is down or has no key.
export function ModelPicker() {
  const choice = useProviderChoice();
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);
  useEffect(() => { fetchProviders().then(setProviders).catch(() => setProviders(null)); }, []);

  const options: { id: ProviderChoice; label: string; title: string; off?: boolean }[] = [
    { id: 'auto', label: 'Auto', title: 'Muse Spark first; switches to Fireworks or Baseten automatically if a provider is unavailable' },
    ...(['meta', 'fireworks', 'baseten'] as const).map((id) => {
      const info = providers?.find((p) => p.id === id);
      return {
        id,
        label: PROVIDER_LABEL[id].short,
        title: info
          ? `${modelName(id, info.model)} via ${info.via}${info.configured ? '' : ' - no key on this server'}`
          : `${PROVIDER_LABEL[id].model} via ${PROVIDER_LABEL[id].via}`,
        off: info ? !info.configured : false,
      };
    }),
  ];

  return (
    <div className='flex flex-none items-center gap-3 border-b border-line px-4 py-2.5'>
      <span className='font-display text-[10px] font-semibold uppercase tracking-[.16em] text-dim'>Model</span>
      <div role='radiogroup' aria-label='AI model' className='flex flex-wrap gap-1.5'>
        {options.map((o) => (
          <button
            key={o.id}
            type='button'
            role='radio'
            aria-checked={choice === o.id}
            disabled={o.off}
            title={o.title}
            onClick={() => setProviderChoice(o.id)}
            className={clsx('chip !px-2.5 !py-1 !text-[9.5px] transition-colors', choice === o.id ? 'tone-low' : 'hover:text-cream', o.off && 'cursor-not-allowed opacity-40')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// "Switched from Muse Spark (timeout)" note when the chosen provider failed and another answered
export function FallbackNote({ from }: { from?: Array<{ provider: keyof typeof PROVIDER_LABEL; error: string }> }) {
  const real = from?.filter((f) => !/^no key/.test(f.error));
  if (!real?.length) return null;
  return (
    <p className='mb-4 text-[11.5px] leading-relaxed text-gold-soft'>
      Switched automatically: {real.map((f) => `${PROVIDER_LABEL[f.provider].short} was unavailable`).join(', ')}.
    </p>
  );
}
