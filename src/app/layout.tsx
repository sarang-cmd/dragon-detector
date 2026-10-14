import type { Metadata } from 'next';
import { ThemeProviderWrapper } from '@/components/theme-provider';
import './globals.css';

// Geist Sans was added to Google Fonts in 2024, but older Next.js/font caches may
// not resolve it. Define both fonts statically so the build can tree-shake unknown
// ones, and fall back to system fonts if either is unavailable.
let geistSans = { variable: '--font-geist-sans', className: 'font-sans' };
let geistMono = { variable: '--font-geist-mono', className: 'font-mono' };

try {
  const { Geist_Sans, Geist_Mono } = require('next/font/google');
  geistSans = Geist_Sans({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' });
  geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
} catch {
  // If fonts are unavailable, keep the CSS variables but rely on the system stack.
  geistSans = { variable: '', className: '' };
  geistMono = { variable: '', className: '' };
}

export const metadata: Metadata = {
  title: { default: 'DIS Weather Station', template: '%s | DIS Weather Station' },
  description: 'Live weather from the DIS Weather Club station on the school grounds in Dresden.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} ${geistMono.className} font-sans`}>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  );
}
