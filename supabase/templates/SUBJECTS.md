# Email subjects (pick one per template in the Supabase dashboard)

Paste the matching body from the `.html` file in this folder after setting
custom SMTP. Subjects are short on purpose so they survive phone inboxes.

## Supabase built-ins (paste + set subject)

- `confirm-signup.html` — Confirm Email
  - “Confirm your DIS Weather Station account” (recommended, matches the link flow)
  - “You are almost in — confirm your email”
  - “One tap to join the Weather Club”
- `invite-user.html` — Invite User
  - “You are invited to the DIS Weather Station” (recommended)
  - “Join the Weather Club”
- `magic-link.html` — Magic Link
  - “Your DIS Weather Station sign-in link” (recommended)
  - “Tap to sign in, no password needed”
- `change-email.html` — Change Email
  - “Confirm your new DIS Weather Station address” (recommended)
  - “One tap to move your account”
- `reset-password.html` — Reset Password
  - “Reset your DIS Weather Station password” (recommended)
  - “Password reset, coming up”

## Notifications (no Supabase hook sends these yet — ready for later)

Wire them through an edge function or `auth.admin` call when you need them:

- `password-changed.html`
  - “Your DIS Weather Station password was changed” (recommended)
  - “Heads up: password updated”
- `email-changed.html`
  - “Your DIS Weather Station sign-in email changed” (recommended)
- `reauthentication.html` — sensitive-action check
  - “Please confirm it is you” (recommended)
  - “Quick security check”

Style notes (kept consistent across all templates): DIS Blue header band,
amber CTA button with dark text, green security callouts, school footer, and
the tagline banner at the very bottom. Light single theme everywhere.
