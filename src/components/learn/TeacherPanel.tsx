'use client';

import * as React from 'react';
import Link from 'next/link';
import { MonitorPlay, Download, FlaskConical } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * "For teachers" panel (docs/06 §3 handout).
 * The QR code is rendered client-side as SVG with qrcode.react: no network
 * calls and no tracking (house privacy rule), crisp at any print size.
 * It encodes this site's /display URL once the page mounts; before that a
 * labelled placeholder box holds the layout (no layout shift).
 */
export function TeacherPanel() {
  const [displayUrl, setDisplayUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDisplayUrl(`${window.location.origin}/display`);
  }, []);

  const steps = [
    {
      icon: MonitorPlay,
      title: 'Show the class',
      text: 'Open the lobby display on the projector. It cycles temperature, wind and rain.',
      href: '/display',
      linkLabel: 'Open /display',
    },
    {
      icon: Download,
      title: 'Get the data',
      text: 'Pick a measurement and range, inspect the table, then download the CSV for your lesson.',
      href: '/data?range=24h&metric=temperature',
      linkLabel: 'Open /data',
    },
    {
      icon: FlaskConical,
      title: 'Lesson ideas',
      text: 'Eight classroom activities above, with age bands, materials and curriculum links.',
      href: '#activities',
      linkLabel: 'Jump to activities',
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <div>
            <span className="label">Teacher handout</span>
            <h3 className="mt-1 text-xl font-medium text-[var(--color-text)]">
              Three steps for your lesson
            </h3>
          </div>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)]"
                >
                  <step.icon className="h-4 w-4 stroke-[1.5] text-[var(--color-text)]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    <span className="numeric mr-2 text-[var(--color-muted)]">
                      {i + 1}.
                    </span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-muted)]">
                    {step.text}{' '}
                    <Link
                      href={step.href}
                      className="text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                    >
                      {step.linkLabel}
                    </Link>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-relaxed text-[var(--color-muted)]">
            Weather Club contact lives on the school intranet — ask your
            teacher sponsor for the club email.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-[var(--color-border)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {displayUrl ? (
            <QRCodeSVG
              value={displayUrl}
              size={140}
              level="M"
              bgColor="transparent"
              fgColor="var(--color-text)"
              role="img"
              aria-label={`QR code linking to ${displayUrl}`}
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-[140px] w-[140px] animate-pulse rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)]"
            />
          )}
          <p className="max-w-[180px] text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
            Scan to open the lobby display
            {displayUrl && (
              <>
                <br />
                <span className="numeric break-all">{displayUrl}</span>
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
