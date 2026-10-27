'use client';
import { useEffect, useRef } from 'react';

/**
 * Ambient fund-flow network behind the hero: wallets drift, nearby ones link up,
 * value packets travel along links, and a few flagged wallets pulse red.
 */
export function HeroNetwork({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, visible = true;

    type P = { x: number; y: number; vx: number; vy: number; r: number; kind: 'n' | 'gold' | 'flag' };
    type Packet = { a: number; b: number; t: number; speed: number };
    let pts: P[] = [];
    let packets: Packet[] = [];
    const LINK = 150;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      pts = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: 1.4 + Math.random() * 1.8,
        kind: i % 17 === 0 ? 'flag' : i % 7 === 0 ? 'gold' : 'n',
      }));
      packets = [];
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!reduced) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        }
      }
      // links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const o = (1 - d / LINK) * 0.35;
            ctx.strokeStyle = a.kind === 'flag' || b.kind === 'flag' ? `rgba(255,77,109,${o})` : `rgba(154,141,255,${o})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (!reduced && packets.length < 14 && Math.random() < 0.0009) packets.push({ a: i, b: j, t: 0, speed: 0.006 + Math.random() * 0.01 });
          }
        }
      }
      // packets of value moving along links
      packets = packets.filter((k) => {
        const a = pts[k.a], b = pts[k.b];
        if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) > LINK * 1.2) return false;
        k.t += k.speed;
        const x = a.x + (b.x - a.x) * k.t, y = a.y + (b.y - a.y) * k.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, 'rgba(0,229,255,.95)'); g.addColorStop(1, 'rgba(0,229,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
        return k.t < 1;
      });
      // wallets
      for (const p of pts) {
        if (p.kind === 'flag') {
          const pulse = (Math.sin(time / 600 + p.x) + 1) / 2;
          ctx.strokeStyle = `rgba(255,77,109,${0.5 - pulse * 0.4})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 4 + pulse * 8, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = p.kind === 'flag' ? '#ff4d6d' : p.kind === 'gold' ? '#f0b44c' : 'rgba(220,215,255,.75)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduced && visible) raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // stop burning battery when scrolled away
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden='true' />;
}
