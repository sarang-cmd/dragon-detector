import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 text-sm text-[var(--color-muted)] sm:px-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white p-1.5 shadow-sm">
              <Image
                src="/brand/dis-logo-horizontal.jpg"
                alt="Dresden International School"
                width={120}
                height={30}
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="ml-2 text-[var(--color-muted)]">Dresden, right now.</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Sainlogic WS3500</span>
            <span>Built by the DIS Weather Club</span>
            <span>Source: Ecowitt Cloud API</span>
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-[var(--color-text)]"
            >
              Privacy
            </Link>
            <Link
              href="/imprint"
              className="underline underline-offset-2 hover:text-[var(--color-text)]"
            >
              Imprint
            </Link>
            <span>© {new Date().getFullYear()} Dresden International School</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
