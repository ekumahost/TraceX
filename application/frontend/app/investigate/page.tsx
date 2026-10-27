'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Workspace } from '@/components/workspace/Workspace';

function Investigate() {
  const q = useSearchParams().get('q') ?? 'sample';
  return <Workspace key={q} query={q} />;
}

export default function InvestigatePage() {
  return (
    <Suspense>
      <Investigate />
    </Suspense>
  );
}
