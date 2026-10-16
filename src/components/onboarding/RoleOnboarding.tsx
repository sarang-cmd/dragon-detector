'use client';

import * as React from 'react';
import {
  Baby,
  BookOpen,
  GraduationCap,
  Presentation,
  Shapes,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useRole, ROLES, ROLE_LABELS, type Role } from '@/context/role-context';

const ROLE_META: Record<Role, { icon: LucideIcon; blurb: string }> = {
  kindergarten: {
    icon: Baby,
    blurb: 'Very simple words and big pictures.',
  },
  pyp: {
    icon: Shapes,
    blurb: 'Simple explanations of every measurement.',
  },
  myp: {
    icon: BookOpen,
    blurb: 'Full detail, charts and data downloads.',
  },
  dp: {
    icon: GraduationCap,
    blurb: 'Full detail, charts and data downloads.',
  },
  teacher: {
    icon: Presentation,
    blurb: 'Everything, plus classroom activities and the handout.',
  },
  family: {
    icon: Users,
    blurb: 'Plain words — is it raining, do we need jackets?',
  },
};

/**
 * First-visit role picker. Rendered from the root layout; appears only when
 * no role has been confirmed yet. Picking a card commits immediately —
 * there is intentionally no dismiss without a choice.
 */
export function RoleOnboarding() {
  const { role, hasOnboarded, ready, setRole } = useRole();
  const [selected, setSelected] = React.useState<Role>(role ?? 'myp');
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Keep the pre-selection in sync if a legacy audience was migrated in.
  React.useEffect(() => {
    if (role) setSelected(role);
  }, [role]);

  // Focus the selected card when the dialog appears.
  React.useEffect(() => {
    if (!hasOnboarded) {
      const el = dialogRef.current?.querySelector<HTMLButtonElement>(
        `[data-role="${selected}"]`
      );
      el?.focus();
    }
  }, [hasOnboarded, selected]);

  if (!ready || hasOnboarded) return null;

  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusables = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      ) ?? []
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 motion-reduce:bg-black/60"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-onboarding-title"
        aria-describedby="role-onboarding-desc"
        onKeyDown={onDialogKeyDown}
        className="w-full max-w-[560px] rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8"
      >
        <span className="label">Welcome to the DIS weather station</span>
        <h2
          id="role-onboarding-title"
          className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-text)]"
        >
          Who is looking at the weather?
        </h2>
        <p
          id="role-onboarding-desc"
          className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]"
        >
          We adjust the words and the activities to fit you. You can change
          this anytime in the footer.
        </p>
        <div
          role="group"
          aria-label="Choose your role"
          className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {ROLES.map((r) => {
            const meta = ROLE_META[r];
            const Icon = meta.icon;
            const active = selected === r;
            return (
              <button
                key={r}
                type="button"
                data-role={r}
                aria-pressed={active}
                onClick={() => {
                  setSelected(r);
                  setRole(r);
                }}
                onMouseEnter={() => setSelected(r)}
                onFocus={() => setSelected(r)}
                className={`flex min-h-[44px] items-center gap-3 rounded-[12px] border p-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--color-background)]'
                    : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-text)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <Icon className="h-5 w-5 stroke-[1.5] text-[var(--color-text)]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--color-text)]">
                    {ROLE_LABELS[r]}
                  </span>
                  <span className="block text-xs leading-relaxed text-[var(--color-muted)]">
                    {meta.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
