'use client';
import { useSyncExternalStore } from 'react';
import type { ProviderChoice } from './api';

// The AI model the user picked, shared by the brief, Ask and Recovery Kit and kept across visits
const KEY = 'tracex.provider';
const CHOICES: ProviderChoice[] = ['auto', 'meta', 'fireworks', 'baseten'];
const listeners = new Set<() => void>();

function read(): ProviderChoice {
  try {
    const v = localStorage.getItem(KEY) as ProviderChoice | null;
    return v && CHOICES.includes(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function setProviderChoice(choice: ProviderChoice) {
  try { localStorage.setItem(KEY, choice); } catch { /* private mode: keep it for this page only */ }
  current = choice;
  listeners.forEach((l) => l());
}

let current: ProviderChoice | null = null;
const snapshot = () => (current ??= read());

export function useProviderChoice() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    snapshot,
    () => 'auto' as ProviderChoice,
  );
}
