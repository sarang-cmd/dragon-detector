'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

// We use next-themes directly and skip a custom context wrapper so the provider
// tree is shallow and the build sees both the client component and the provider.
export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
