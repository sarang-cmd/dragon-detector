import type { Metadata } from 'next';
import { EmbedCard } from '@/components/embed/EmbedCard';

export const metadata: Metadata = {
  title: 'Live Weather — Embed',
  description:
    'A compact live card from the DIS Weather Station, built for embedding in another page.',
  robots: { index: false, follow: true },
};

/**
 * Embeddable live card: /embed?theme=dark|light
 * The host page supplies the iframe size; the card fills it. Theme follows
 * the visitor's system setting unless `theme` is passed.
 */
export default function EmbedPage({
  searchParams,
}: {
  searchParams?: { theme?: string };
}) {
  const theme = searchParams?.theme === 'light' ? 'light' : searchParams?.theme === 'dark' ? 'dark' : undefined;
  return <EmbedCard theme={theme} />;
}
