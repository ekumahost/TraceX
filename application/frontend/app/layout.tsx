import './globals.css';
export const metadata = {
  title: 'TraceX AI - Blockchain Investigation',
  description: 'Intelligent blockchain investigation platform'
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='bg-[#0a0a0f] text-white antialiased tracex-grid min-h-screen'>{children}</body>
    </html>
  );
}
