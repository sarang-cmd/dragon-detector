'use client';

import * as React from 'react';
import { useRole, ROLES, ROLE_LABELS } from '@/context/role-context';
import { Selector } from '@/components/ui/selector';

/**
 * Footer "Viewing as" switcher. Changes role (and Learn reading level /
 * activity visibility) immediately; the choice persists in localStorage.
 * Hidden until a role exists so first-visit users go through onboarding.
 */
export function RoleSwitcher() {
  const { role, setRole } = useRole();
  if (!role) return null;

  return (
    <div className="flex items-center gap-2">
      <span id="role-switcher-label" className="label">
        Viewing as
      </span>
      <Selector
        label="Viewing as"
        value={role}
        options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        onChange={setRole}
      />
    </div>
  );
}
