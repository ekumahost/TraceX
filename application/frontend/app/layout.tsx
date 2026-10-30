import type { Metadata, Viewport } from 'next';
import { Montserrat, EB_Garamond, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ServerWake } from '@/components/ServerWake';

const display = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--f-display' });
const serif = EB_Garamond({ subsets: ['latin'], style: ['italic'], weight: ['400', '500'], variable: '--f-serif' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--f-mono' });

export const metadata: Metadata = {
  title: 'TraceX AI — Follow the money. Prove it.',
  description:
    'AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#07070d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body className='grain' style={{ ['--f-body' as string]: 'var(--f-display)' }}>
        {children}
        <ServerWake />
      </body>
    </html>
  );
}
