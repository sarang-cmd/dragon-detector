import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { ClubGallery } from '@/components/about/ClubGallery';
import { CLUB, CLUB_PHOTOS } from '@/lib/content/club';

export const metadata = {
  title: 'About the Weather Station Club',
  description:
    'Six DIS students built the school weather station and this website as their CAS project. Meet the club, the station and what comes next.',
};

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-medium text-[var(--color-text)]">{children}</h2>
      {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}

export default function AboutPage() {
  const supervisors = CLUB.supervisors.join(' and ');

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 flex flex-col gap-4">
          <span className="label">{CLUB.label}</span>
          <h1 className="display text-[var(--color-text)]">{CLUB.title}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            {CLUB.intro}
          </p>
        </div>

        {/* Facts strip */}
        <dl className="mb-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Started', value: CLUB.started },
            { label: 'Meets', value: CLUB.meeting },
            { label: 'Team', value: `${CLUB.members.length} students` },
            { label: 'Supervised by', value: supervisors },
          ].map((fact) => (
            <div
              key={fact.label}
              className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <dt className="label">{fact.label}</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Photos */}
        {CLUB_PHOTOS.length > 0 && (
          <section className="mb-12">
            <SectionTitle hint="Add more by dropping a file in public/club and listing it in src/lib/content/club.ts">
              Photos
            </SectionTitle>
            <ClubGallery photos={CLUB_PHOTOS} />
          </section>
        )}

        {/* Who we are */}
        <section className="mb-12">
          <SectionTitle hint="The six of us, and what each of us does">
            Who we are
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CLUB.members.map((member) => (
              <li key={member.name}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-2 p-5">
                    <span className="text-base font-medium text-[var(--color-text)]">
                      {member.name}
                    </span>
                    <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                      {member.role}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Why and how */}
        <div className="mb-12 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="text-xl font-medium text-[var(--color-text)]">
                Why a weather station?
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                {CLUB.why}
              </p>
              <p className="border-t border-[var(--color-border)] pt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                {CLUB.session}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-medium text-[var(--color-text)]">
                What we set out to do
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {CLUB.goals.map((goal) => (
                  <li key={goal} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    />
                    {goal}
                  </li>
                ))}
              </ul>
              <div className="border-t border-[var(--color-border)] pt-3">
                <h3 className="label">And for ourselves</h3>
                <ul className="mt-2 space-y-1 text-sm leading-relaxed text-[var(--color-muted)]">
                  {CLUB.personalGoals.map((goal) => (
                    <li key={goal} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-border)]"
                      />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hardest / proudest */}
        <div className="mb-12 grid gap-6 lg:grid-cols-2">
          {[CLUB.hardest, CLUB.proudest].map((item) => (
            <Card key={item.question}>
              <CardContent className="space-y-2 p-6">
                <span className="label text-[var(--accent)]">{item.question}</span>
                <p className="text-base leading-relaxed text-[var(--color-text)]">
                  {item.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it happened */}
        <section className="mb-12">
          <SectionTitle hint="From an empty roof to a live website">
            How it happened
          </SectionTitle>
          <ol className="space-y-3">
            {CLUB.milestones.map((milestone, i) => (
              <li key={milestone.title}>
                <Card>
                  <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:gap-6">
                    <span className="label shrink-0 sm:w-32">{milestone.when}</span>
                    <div>
                      <h3 className="text-base font-medium text-[var(--color-text)]">
                        <span className="numeric mr-2 text-[var(--color-muted)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {milestone.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                        {milestone.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* What's next */}
        <section className="mb-12">
          <SectionTitle hint="Teaching the school how to use what we built">
            What comes next
          </SectionTitle>
          <div className="overflow-x-auto rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                The club&apos;s next steps and who is responsible for each
              </caption>
              <thead className="border-b border-[var(--color-border)]">
                <tr>
                  <th scope="col" className="label p-4 font-medium">
                    Next step
                  </th>
                  <th scope="col" className="label p-4 font-medium">
                    Who
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {CLUB.next.map((item) => (
                  <tr key={item.task}>
                    <td className="p-4 text-[var(--color-text)]">{item.task}</td>
                    <td className="whitespace-nowrap p-4 text-[var(--color-muted)]">
                      {item.who}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Closing note */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Users
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5] text-[var(--accent)]"
              />
              <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
                This station is our CAS project: a fixed group of six, running
                from {CLUB.started} and supervised by {supervisors}. The data is
                open to everyone at the school, though — take it into your
                geography or science work.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/data"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                Get the data
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 stroke-[1.5]" />
              </Link>
              <Link
                href="/learn"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                Learn how it works
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 stroke-[1.5]" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
