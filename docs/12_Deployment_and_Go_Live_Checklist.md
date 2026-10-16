# Deployment & Go-Live Guide

Everything that still needs a human (dashboard clicks, keys, the school).
Code work is done and pushed; nothing here requires editing source.

## 0. Where things stand

| Item | State |
|---|---|
| Vercel builds from `main` | ✅ Green (effects files included since `3843ca7`) |
| Mock data on the live site | ✅ Working |
| AI outlook sentence on the live site | ❌ Needs `GROQ_API_KEY` on Vercel (falls back to statistics until then) |
| Login / progress sync | ❌ Needs Supabase setup below |
| Real Ecowitt data | ❌ Not implemented yet (stub throws; see §4) |

## 1. Vercel environment variables (5 min)

Vercel Dashboard → project `dragon-detector` → **Settings → Environment
Variables**. Add for **Production** (and Preview if you want previews to match):

| Name | Value | Notes |
|---|---|---|
| `GROQ_API_KEY` | `gsk_…` (your key) | Enables the AI outlook sentence. Redeploy after adding, env changes need a new deployment. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mhbsnmtqzjehwglzcaay.supabase.co` | Already in local `.env.local`; Vercel needs its own copy. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` (your key) | Publishable key: public-by-design, RLS enforced. |
| `NEXT_PUBLIC_SITE_URL` | `https://dragon-detector.vercel.app` | Used for OAuth redirects. |
| `DATA_SOURCE` | *(leave unset for now)* | `mock` is the default. Only set `ecowitt` after §4 is built. |

Then **Deployments → ⋯ → Redeploy** (without build cache the first time,
to rule out the stale-cache failure we saw before).

## 2. Supabase Auth (10 min + Google Cloud)

Project: `mhbsnmtqzjehwglzcaay` ([dashboard](https://supabase.com/dashboard)).

1. **Authentication → Providers → Email**: enable it. Decide on
   **Confirm email**: ON = users click a link first (recommended);
   OFF = instant sign-up.
2. **Authentication → Providers → Google**: enable it. You need a Google
   Cloud OAuth client:
   - [Google Cloud Console](https://console.cloud.google.com) → APIs &
     Services → Credentials → Create **OAuth client ID** (Web application).
   - Authorized redirect URI: copy the **Callback URL** shown on Supabase's
     Google provider page (looks like
     `https://mhbsnmtqzjehwglzcaay.supabase.co/auth/v1/callback`).
   - Paste the Google **Client ID + Secret** back into Supabase and save.
3. **Authentication → URL Configuration**:
   - Site URL: `https://dragon-detector.vercel.app`
   - Redirect URLs: add `http://localhost:3000/**` (dev) and
     `https://dragon-detector.vercel.app/**`.
4. **SQL Editor → New query**: paste the full contents of
   `supabase/migrations/0001_track_progress.sql` in this repo and run it.
   It creates the progress table with owner-only row-level security.
5. **Same place**: run `supabase/migrations/0002_outlook_cache.sql` too.
   It creates the shared AI-outlook cache (one row per unit system, public
   read, writes only via a locked-down function) so the whole site shares
   a single forecast + AI call per 15 minutes on every server instance.
6. **Avatars**: run `supabase/migrations/0003_avatars.sql` to create the
   public `avatars` bucket with owner-only write policies. Profile photos
   then upload straight from the header account menu (2 MB limit).
6. **Brand the auth emails** (Authentication → Email Templates): replace the
   **Confirm signup** body with `supabase/templates/confirm-signup.html` and
   **Reset password** with `supabase/templates/recovery.html` from this repo
   (dark DIS card, amber button, correct school address). Also set
   **Mail → From name** to `DIS Weather Station` so inboxes show the brand
   instead of a generic sender. Note: the **template editor stays locked
   until custom SMTP is set up** (Supabase shows "Set up custom SMTP to edit
   templates"), and Supabase's built-in sender is rate-limited, so a whole
   class signing up at once would see failures. Set up SMTP first:

   **Option A — Resend (recommended, free 100 emails/day):**
   1. Sign up at [resend.com](https://resend.com), verify your email,
      create an API key (Sending access) and copy it.
   2. Supabase → **Project Settings → Auth → SMTP Settings**, enable
      custom SMTP: host `smtp.resend.com`, port `465`, username `resend`,
      password = the Resend API key, sender email `onboarding@resend.dev`
      (works immediately; switch to a school address after verifying the
      domain in Resend), sender name `DIS Weather Station`.
   3. Send the test email from the SMTP page, then the template editor
      unlocks — paste the two HTML files.

   **Option B — Gmail (no new account, ~500/day):** Google Account with
   2-step verification → App Passwords → generate one for "Mail". SMTP:
   host `smtp.gmail.com`, port `587` (STARTTLS), username = the Gmail
   address, password = the 16-letter app password. Sender will be that
   Gmail address with name `DIS Weather Station`.

   The app's "Open in Gmail" button searches for `DIS Weather Station`,
   so it keeps working whichever sender you use.
5. Sanity check: open `/login` on the live site → **Continue with Google**
   should go to Google and land back on `/learn` signed in. Sign out via the
   avatar menu in the header.

## 3. Verify the live site (5 min)

- `/`, hero shows the 12-hour graph; the sentence carries an
  **“AI outlook · N min ago”** badge (not “Station trends”).
  If it says “Station trends”: the Groq key is missing/mis-set on Vercel.
- `/learn`, path, XP bar, lessons, quizzes; complete a lesson signed in,
  reload, XP persists (cloud). Signed out, XP persists per browser.
- `/station`, toggle metric/imperial, table converts.
- First visit in a private window, role picker appears, choice persists.

## 4. Real Ecowitt data (later, dev work, not dashboard work)

`DATA_SOURCE=ecowitt` currently throws (`createEcowittSource` is a stub).
To go live for real:

1. Implement the source per `docs/02_Ecowitt_API_and_Data_Model.md`
   (application key + API key + MAC, server-only fetch + zonal cache).
2. Add `ECOWITT_APPLICATION_KEY`, `ECOWITT_API_KEY`, `ECOWITT_MAC`,
   `DATA_SOURCE=ecowitt` to Vercel env.
3. Keep `mock` for local dev (`MOCK_SCENARIO=storm|calm|rain|offline`).

## 5. Before telling the school

- [ ] Imprint + privacy show **Annenstraße 9, 01067 Dresden-Altstadt** (done in code, eyeball it live).
- [ ] `/login` works end-to-end (Google + one email account).
- [ ] Run the track once as Teacher and as PYP, activities hidden for PYP, handout for Teacher.
- [ ] Re-check with the school before launch: the canvas components are
      MIT + Commons Clause (no resale/redistribution), see
      `src/components/canvasui/LICENSE.md`.

## If a deploy fails

1. Read the **full** log tail, the real error is at the end
   (`Module not found` = a file was never pushed; commit it).
2. Redeploy **without** the build cache once before debugging further.
3. `themeColor`-style Next warnings are fixed via the `viewport` export,
   don't chase those.
