# House rules

Project: DIS Weather Station website (Dresden International School). Station: Sainlogic WS3500 via Ecowitt cloud.
Read `/docs` before any work. Docs 00-07 are the source of truth; 03a has brand colors.

Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, pnpm.

Rules:
- Never read, print or commit `.env` files or API keys. Keys are server-only.
- UI only imports `WeatherReading` from `src/lib/types.ts`; only `src/sources/ecowitt.ts` knows Ecowitt.
- Follow the anti-AI-look rules in docs/03. No gradients, emoji icons or decorative cards.
- Dark mode accent = DIS Amber (#F6A800); light mode accent = DIS Blue (#00529E); green only for live/fresh status.
- Run `pnpm build` and `pnpm lint` before saying a task is done.
- Make minimal changes; do not rewrite files you were not asked to touch.
- After finishing, update `docs/PROGRESS.md`.
