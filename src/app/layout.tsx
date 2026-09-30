import type { Metadata, Viewport } from 'next';
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AnnouncementBar from '@/components/site/AnnouncementBar';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import ScrollProgress from '@/components/site/ScrollProgress';
import HideOnAdmin from '@/components/site/HideOnAdmin';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap', axes: ['wdth'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-jb', display: 'swap', weight: ['500'] });

export const metadata: Metadata = {
  title: {
    default: 'BMSCE IEEE Student Branch',
    template: '%s | BMSCE IEEE',
  },
  description:
    'The official IEEE Student Branch of B.M.S. College of Engineering, Bengaluru. Chapters, events, and IEEE membership registration.',
  icons: { icon: '/brand/emblem.png' },
};

export const viewport: Viewport = {
  themeColor: '#f6f4ef',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${archivo.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <AnnouncementBar />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <HideOnAdmin>
          <Footer />
        </HideOnAdmin>
        <Analytics />
      </body>
    </html>
  );
}
