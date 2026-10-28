'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, Copy, ExternalLink, MousePointerClick } from 'lucide-react';
import type { TraceCase, TraceEdge } from '@/lib/types';
import { fmtTime, fmtValue, riskTone, RISK_TITLE, short, TYPE_LABEL } from '@/lib/format';
import type { Selection } from './TraceGraph';

const TONE = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--cyan)', clean: 'var(--green)' };

function CopyField({ label, value, href }: { label: string; value: string; href?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };
  return (
    <div>
      <div className='font-display text-[10px] font-bold uppercase tracking-[.18em] text-dim'>{label}</div>
      <div className='mt-1.5 flex items-start gap-2 rounded-lg border border-line bg-panel-2 p-3'>
        <code className='mono flex-1 break-all text-[12px] leading-relaxed text-cream'>{value}</code>
        <button type='button' onClick={copy} className='text-dim hover:text-cream' aria-label={`Copy ${label}`}>
          {copied ? <Check className='h-4 w-4 text-risk-clean' /> : <Copy className='h-4 w-4' />}
        </button>
        {href && (
          <a href={href} target='_blank' rel='noreferrer' className='text-dim hover:text-cyan' aria-label='Open in block explorer'>
            <ExternalLink className='h-4 w-4' />
          </a>
        )}
      </div>
    </div>
  );
}

function TransferRow({ e, data, dir, onSelect }: { e: TraceEdge; data: TraceCase; dir?: 'in' | 'out'; onSelect: (s: Selection) => void }) {
  const other = data.nodes.find((n) => n.id === (dir === 'in' ? e.from : e.to));
  return (
    <button type='button' onClick={() => onSelect({ kind: 'edge', id: e.id })} className='flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-panel-2'>
      {dir === 'in' ? <ArrowDownLeft className='h-4 w-4 flex-none text-risk-clean' /> : <ArrowUpRight className='h-4 w-4 flex-none text-risk-medium' />}
      <div className='min-w-0 flex-1'>
        <div className='truncate text-[13px] text-cream'>{other?.label ?? short(other?.id ?? '', 8, 6)}</div>
        <div className='mono text-[11px] text-dim'>{short(e.txHash, 8, 6)}</div>
      </div>
      <div className='mono text-right text-[12.5px] text-cream'>{fmtValue(e.value, e.asset)}</div>
    </button>
  );
}

export function EvidencePanel({ data, selection, onSelect }: { data: TraceCase; selection: Selection; onSelect: (s: Selection) => void }) {
  const scan = !data.sample && data.explorer ? data.explorer : null;

  if (!selection) {
    return (
      <div className='p-5'>
        <div className='flex items-center gap-3 rounded-lg border border-dashed border-line-2 p-4 text-[13px] text-muted'>
          <MousePointerClick className='h-5 w-5 flex-none text-cyan' /> Click a wallet or transfer in the graph to inspect its evidence.
        </div>
        <div className='mt-6 eyebrow !text-[10.5px]'>All transfers · {data.edges.length}</div>
        <div className='mt-3 -mx-2'>
          {[...data.edges].sort((a, b) => b.value - a.value).map((e) => <TransferRow key={e.id} e={e} data={data} onSelect={onSelect} />)}
        </div>
      </div>
    );
  }

  if (selection.kind === 'node') {
    const n = data.nodes.find((x) => x.id === selection.id);
    if (!n) return null;
    const tone = n.type === 'source' ? 'var(--gold)' : TONE[riskTone(n.risk)];
    const inbound = data.edges.filter((e) => e.to === n.id);
    const outbound = data.edges.filter((e) => e.from === n.id);
    const flags = data.risks.filter((r) => r.address === n.id);
    return (
      <div className='space-y-6 p-5'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='chip' style={{ color: tone, borderColor: tone }}>{TYPE_LABEL[n.type]}</span>
            <span className='chip'>Hop {n.hop}</span>
          </div>
          <h3 className='display mt-4 text-[24px]'>{n.label ?? 'Unlabelled wallet'}</h3>
        </div>
        <div>
          <div className='flex items-baseline justify-between'>
            <span className='font-display text-[10px] font-bold uppercase tracking-[.18em] text-dim'>Wallet risk</span>
            <span className='display text-[20px]' style={{ color: tone }}>{n.risk}</span>
          </div>
          <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-panel-3'>
            <div className='h-full rounded-full transition-all duration-700' style={{ width: `${n.risk}%`, background: tone }} />
          </div>
        </div>
        <CopyField label='Address' value={n.id} href={scan ? `${scan}/address/${n.id}` : undefined} />
        {flags.map((r, i) => (
          <div key={i} className={clsx('rounded-lg border p-3.5', `tone-${r.severity}`)} style={{ borderColor: 'color-mix(in srgb, var(--tone) 35%, transparent)' }}>
            <div className='font-display text-[12px] font-bold' style={{ color: 'var(--tone)' }}>{RISK_TITLE[r.type] ?? r.type}</div>
            <p className='mt-1 text-[12.5px] text-muted'>{r.detail}</p>
          </div>
        ))}
        {!!inbound.length && <div><div className='eyebrow !text-[10.5px]'>Received · {inbound.length}</div><div className='-mx-2 mt-2'>{inbound.map((e) => <TransferRow key={e.id} e={e} data={data} dir='in' onSelect={onSelect} />)}</div></div>}
        {!!outbound.length && <div><div className='eyebrow !text-[10.5px]'>Sent · {outbound.length}</div><div className='-mx-2 mt-2'>{outbound.map((e) => <TransferRow key={e.id} e={e} data={data} dir='out' onSelect={onSelect} />)}</div></div>}
      </div>
    );
  }

  const e = data.edges.find((x) => x.id === selection.id);
  if (!e) return null;
  const from = data.nodes.find((n) => n.id === e.from);
  const to = data.nodes.find((n) => n.id === e.to);
  const flags = data.risks.filter((r) => r.tx === e.txHash);
  return (
    <div className='space-y-6 p-5'>
      <div>
        <span className='chip tone-low'>Transfer · hop {e.hop}</span>
        <div className='display mt-4 text-[34px] leading-none'>{fmtValue(e.value, e.asset)}</div>
        <div className='mt-2 text-[13px] text-muted'>{fmtTime(e.timestamp)}</div>
      </div>
      <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-2'>
        {[from, to].map((n, i) => (
          <button
            key={i}
            type='button'
            onClick={() => n && onSelect({ kind: 'node', id: n.id })}
            className={clsx('rounded-lg border border-line bg-panel-2 p-3 text-left transition-colors hover:border-[var(--line-v)]', i === 1 && 'col-start-3')}
          >
            <div className='font-display text-[10px] font-bold uppercase tracking-[.18em] text-dim'>{i ? 'To' : 'From'}</div>
            <div className='mt-1 truncate text-[13px] text-cream'>{n?.label ?? TYPE_LABEL[n?.type ?? 'wallet']}</div>
            <div className='mono text-[11px] text-muted'>{short(n?.id ?? '', 6, 4)}</div>
          </button>
        )).flatMap((el, i) => (i === 0 ? [el, <ArrowRight key='arrow' className='h-4 w-4 text-cyan' />] : [el]))}
      </div>
      <CopyField label='Transaction hash' value={e.txHash} href={scan ? `${scan}/tx/${e.txHash}` : undefined} />
      {flags.map((r, i) => (
        <div key={i} className={clsx('rounded-lg border p-3.5', `tone-${r.severity}`)} style={{ borderColor: 'color-mix(in srgb, var(--tone) 35%, transparent)' }}>
          <div className='font-display text-[12px] font-bold' style={{ color: 'var(--tone)' }}>{RISK_TITLE[r.type] ?? r.type} · evidence</div>
          <p className='mt-1 text-[12.5px] text-muted'>{r.detail}</p>
        </div>
      ))}
    </div>
  );
}
