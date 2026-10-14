import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProviderWrapper } from '@/components/theme-provider';
import { UnitProvider } from '@/context/unit-context';
import './globals.css';

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
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <ThemeProviderWrapper>
          <UnitProvider>{children}</UnitProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
