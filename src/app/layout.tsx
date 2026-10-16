import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProviderWrapper } from '@/components/theme-provider';
import { UnitProvider } from '@/context/unit-context';
import { RoleProvider } from '@/context/role-context';
import { AuthProvider } from '@/context/auth-context';
import { RoleOnboarding } from '@/components/onboarding/RoleOnboarding';
import { DashboardEffectsProvider } from '@/components/effects/DashboardEffectsProvider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'DIS Weather Station', template: '%s | DIS Weather Station' },
  description: 'Live weather from the DIS Weather Club station on the school grounds in Dresden.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  themeColor: '#00529E',
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
          <UnitProvider>
            <RoleProvider>
              <AuthProvider>
                <DashboardEffectsProvider>
                  {children}
                  <RoleOnboarding />
                </DashboardEffectsProvider>
              </AuthProvider>
            </RoleProvider>
          </UnitProvider>
        </ThemeProviderWrapper>
        <SpeedInsights />
      </body>
    </html>
  );
}
