'use client';
import { memo, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, Handle, Position,
  BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow,
  type Node, type Edge, type NodeProps, type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import clsx from 'clsx';
import { ArrowLeftRight, Building2, Flag, FileCode2, Shuffle, Wallet } from 'lucide-react';
import type { TraceCase, TraceNode, TraceEdge } from '@/lib/types';
import { layoutByHop } from '@/lib/layout';
import { fmtValue, riskTone, short, TYPE_LABEL } from '@/lib/format';
import { ChainMark, ExchangeMark } from './ChainMarks';

export type Selection = { kind: 'node' | 'edge'; id: string } | null;

const TONE = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--cyan)', clean: 'var(--green)' };
const ICON = { source: Flag, wallet: Wallet, exchange: Building2, mixer: Shuffle, bridge: ArrowLeftRight, contract: FileCode2 };

type WalletData = { node: TraceNode; selected: boolean; dim: boolean; fallbackChain?: string };
type FlowData = { edge: TraceEdge; hot: boolean; selected: boolean; dim: boolean; label: string | null };

const WalletNode = memo(function WalletNode({ data }: NodeProps<Node<WalletData>>) {
  const { node, selected, dim, fallbackChain } = data;
  const tone = node.type === 'source' ? 'var(--gold)' : TONE[riskTone(node.risk)];
  const Icon = ICON[node.type];
  const entity = node.type === 'mixer' || node.type === 'exchange' || node.type === 'bridge';
  const size = node.label || node.type !== 'wallet' ? 52 : 38;

  return (
    <div className={clsx('node-in flex flex-col items-center transition-opacity duration-500', dim && 'opacity-25')} style={{ width: 150 }}>
      <div className='relative grid place-items-center' style={{ width: size, height: size }}>
        <Handle type='target' position={Position.Left} />
        <Handle type='source' position={Position.Right} />
        {node.risk >= 70 && (
          <span className='ring-pulse absolute inset-0' style={{ border: `1.5px solid ${tone}`, borderRadius: entity ? 10 : '50%', transform: entity ? 'rotate(45deg)' : undefined }} />
        )}
        <span
          className='absolute inset-0 transition-all duration-300'
          style={{
            background: 'var(--panel-2)',
            border: `2px solid ${tone}`,
            borderRadius: entity ? 10 : '50%',
            transform: entity ? 'rotate(45deg) scale(.86)' : undefined,
            boxShadow: selected ? `0 0 0 4px var(--ink), 0 0 0 6px var(--cyan), 0 0 30px ${tone}` : `0 0 22px -6px ${tone}`,
          }}
        />
        {node.type === 'exchange' ? <ExchangeMark label={node.label} /> : <Icon className='relative' style={{ width: size * 0.36, height: size * 0.36, color: tone }} strokeWidth={2} />}
        <ChainMark chain={node.chain ?? fallbackChain} className='absolute -right-2 -top-1 h-[18px] min-w-[18px] px-1 text-[8px] shadow-lg ring-2 ring-ink' />
      </div>
      <div className='mt-2 text-center leading-tight'>
        {node.label && <div className='font-display text-[12px] font-bold uppercase tracking-[.12em] text-cream'>{node.label}</div>}
        <div className='mono text-[11.5px] text-muted'>{short(node.address ?? node.id, 6, 4)}</div>
        {node.type !== 'wallet' && node.type !== 'source' && !node.label && (
          <div className='text-[10px] uppercase tracking-[.14em] text-dim'>{TYPE_LABEL[node.type]}</div>
        )}
      </div>
    </div>
  );
});

function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<Edge<FlowData>>) {
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  if (!data) return null;
  const { edge, hot, selected, dim, label } = data;
  const color = selected ? 'var(--cyan)' : edge.destinationTxHash ? 'var(--gold)' : hot ? 'var(--red)' : 'var(--violet-hi)';
  const width = 1.2 + Math.log10(edge.value + 1) * 1.8;

  return (
    <g className={clsx('transition-opacity duration-500', dim && 'opacity-15')}>
      <BaseEdge id={id} path={path} style={{ stroke: color, strokeOpacity: selected ? 0.5 : 0.22, strokeWidth: width + (selected ? 4 : 0), strokeDasharray: edge.destinationTxHash ? '6 4' : undefined }} />
      <path d={path} fill='none' stroke={color} strokeWidth={selected ? 2.4 : 1.6} className='flow-path' />
      {(label || selected) && <EdgeLabelRenderer>
        <div
          className={clsx(
            'nodrag nopan pointer-events-none absolute mono rounded px-1.5 py-0.5 text-[11.5px] transition-colors',
            selected ? 'bg-cyan text-ink' : 'bg-[rgba(7,7,13,.85)] text-muted',
            dim && 'opacity-20',
          )}
          style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)` }}
        >
          {selected ? fmtValue(edge.value, edge.asset) : label}
        </div>
      </EdgeLabelRenderer>}
    </g>
  );
}

const nodeTypes = { wallet: WalletNode };
const edgeTypes = { flow: FlowEdge };

interface Props {
  data: TraceCase;
  revealHop: number;
  selection: Selection;
  focusNonce: number;
  onSelect: (s: Selection) => void;
}

function Graph({ data, revealHop, selection, focusNonce, onSelect }: Props) {
  const rf = useReactFlow();
  const pos = useMemo(() => layoutByHop(data.nodes), [data.nodes]);
  const riskOf = useMemo(() => new Map(data.nodes.map((n) => [n.id, n.risk])), [data.nodes]);

  // what's connected to the selection stays lit, the rest dims
  const lit = useMemo(() => {
    if (!selection) return null;
    const ids = new Set<string>();
    if (selection.kind === 'node') {
      ids.add(selection.id);
      for (const e of data.edges) if (e.from === selection.id || e.to === selection.id) ids.add(e.id).add(e.from).add(e.to);
    } else {
      const e = data.edges.find((x) => x.id === selection.id);
      if (e) ids.add(e.id).add(e.from).add(e.to);
    }
    return ids;
  }, [selection, data.edges]);

  const nodes: Node<WalletData>[] = useMemo(
    () =>
      data.nodes
        .filter((n) => n.hop <= revealHop)
        .map((n) => ({
          id: n.id,
          type: 'wallet',
          position: { x: pos.get(n.id)!.x - 75, y: pos.get(n.id)!.y - 26 },
          data: { node: n, fallbackChain: data.chain, selected: selection?.kind === 'node' && selection.id === n.id, dim: !!lit && !lit.has(n.id) },
        })),
    [data.nodes, data.chain, pos, revealHop, selection, lit],
  );

  // parallel transfers between the same pair share one label: "600 ETH · 6 tx"
  const flowLabel = useMemo(() => {
    const groups = new Map<string, TraceEdge[]>();
    for (const e of data.edges) {
      const key = `${e.from}|${e.to}|${e.asset}`;
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    const label = new Map<string, string>();
    for (const g of groups.values()) {
      const total = g.reduce((s, e) => s + e.value, 0);
      label.set(g[0].id, `${g[0].destinationTxHash ? `${g[0].destinationChain?.toUpperCase()} · ` : ''}${fmtValue(total, g[0].asset)}${g.length > 1 ? ` · ${g.length} tx` : ''}`);
    }
    return label;
  }, [data.edges]);

  const edges: Edge<FlowData>[] = useMemo(
    () =>
      data.edges
        .filter((e) => e.hop <= revealHop)
        .map((e) => ({
          id: e.id,
          source: e.from,
          target: e.to,
          type: 'flow',
          data: { edge: e, hot: (riskOf.get(e.to) ?? 0) >= 70, selected: selection?.kind === 'edge' && selection.id === e.id, dim: !!lit && !lit.has(e.id), label: flowLabel.get(e.id) ?? null },
        })),
    [data.edges, revealHop, riskOf, selection, lit, flowLabel],
  );

  // frame by the known layout rather than measured nodes, so the camera is right
  // from the first frame while the graph is still growing hop by hop
  const frame = useCallback(
    (ids: string[], padding: number, duration: number) => {
      const pts = ids.map((id) => pos.get(id)).filter(Boolean) as { x: number; y: number }[];
      if (!pts.length) return;
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const x = Math.min(...xs) - 90, y = Math.min(...ys) - 50;
      rf.fitBounds({ x, y, width: Math.max(...xs) - x + 90, height: Math.max(...ys) - y + 80 }, { padding, duration });
    },
    [pos, rf],
  );

  const frameAll = useCallback(() => frame(data.nodes.map((n) => n.id), 0.06, 0), [data.nodes, frame]);

  // pan to a citation the user clicked
  useEffect(() => {
    if (!focusNonce || !selection) return;
    const ids = selection.kind === 'node' ? [selection.id] : (() => {
      const e = data.edges.find((x) => x.id === selection.id);
      return e ? [e.from, e.to] : [];
    })();
    frame(ids, 0.6, 700);
  }, [focusNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={(_, n) => onSelect({ kind: 'node', id: n.id })}
      onEdgeClick={(_, e) => onSelect({ kind: 'edge', id: e.id })}
      onPaneClick={() => onSelect(null)}
      nodesConnectable={false}
      nodesDraggable
      onInit={frameAll}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={28} size={1.2} color='rgba(154,141,255,.22)' />
      <Controls showInteractive={false} position='bottom-left' />
    </ReactFlow>
  );
}

export function TraceGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <Graph {...props} />
    </ReactFlowProvider>
  );
}
