'use client';
import { Fragment } from 'react';
import clsx from 'clsx';
import type { TraceCase } from '@/lib/types';
import { short } from '@/lib/format';
import type { Selection } from './TraceGraph';

/**
 * Renders model output: a small markdown subset (headings, bullets, bold) where every
 * 0x tx hash / address becomes a citation chip that jumps to it in the graph.
 */

const TOKEN = /(0x[a-fA-F0-9]{64}|0x[a-fA-F0-9]{40}(?![a-fA-F0-9])|\*\*[^*]+\*\*)/g;

function Inline({ text, data, onCite }: { text: string; data: TraceCase; onCite: (s: Selection) => void }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (!part) return null;
        if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (/^0x[a-fA-F0-9]{64}$/.test(part)) {
          const edge = data.edges.find((e) => e.txHash.toLowerCase() === part.toLowerCase());
          return (
            <button key={i} type='button' title={part} disabled={!edge} onClick={() => edge && onCite({ kind: 'edge', id: edge.id })} className={clsx('cite', !edge && 'opacity-60')}>
              {short(part, 6, 4)}
            </button>
          );
        }
        if (/^0x[a-fA-F0-9]{40}$/.test(part)) {
          const node = data.nodes.find((n) => n.id.toLowerCase() === part.toLowerCase());
          return (
            <button key={i} type='button' title={part} disabled={!node} onClick={() => node && onCite({ kind: 'node', id: node.id })} className={clsx('cite cite--addr', !node && 'opacity-60')}>
              {node?.label ?? short(part, 6, 4)}
            </button>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export function RichText({ text, data, onCite, typing }: { text: string; data: TraceCase; onCite: (s: Selection) => void; typing?: boolean }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      const items = list;
      blocks.push(<ul key={blocks.length}>{items.map((li, i) => <li key={i}><Inline text={li} data={data} onCite={onCite} /></li>)}</ul>);
      list = [];
    }
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) { list.push(line.replace(/^([-*•]|\d+[.)])\s+/, '')); continue; }
    flush();
    if (!line) continue;
    if (/^#{1,6}\s/.test(line)) blocks.push(<h3 key={blocks.length}>{line.replace(/^#+\s*/, '').replace(/\*\*/g, '')}</h3>);
    else if (/^\*\*[^*]+\*\*:?$/.test(line)) blocks.push(<h3 key={blocks.length}>{line.replace(/\*\*|:$/g, '')}</h3>);
    else blocks.push(<p key={blocks.length}><Inline text={line} data={data} onCite={onCite} /></p>);
  }
  flush();
  return <div className={clsx('prose-ai text-[14.5px] leading-[1.75] text-white/85', typing && 'is-typing')}>{blocks}</div>;
}
