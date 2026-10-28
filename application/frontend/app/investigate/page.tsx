'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Workspace } from '@/components/workspace/Workspace';

function Investigate() {
  const params = useSearchParams();
  const q = params.get('q') ?? 'sample';
  const chain = params.get('chain') ?? 'auto';
  return <Workspace key={`${q}|${chain}`} query={q} chain={chain} />;
}

export default function InvestigatePage() {
  return (
    <Suspense>
      <Investigate />
    </Suspense>
  );
}
