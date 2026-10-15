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

# Session learnings

- Vitest needs `@vitejs/plugin-react` plus `resolve.alias: { "@": path.resolve(__dirname, "src") }` in `vitest.config.js`; `.tsx` tests must be added to `include` — without these, hooks/tests crash with misleading import-resolution errors.
- Wind/rain simulation in `src/lib/sources/mock.ts` must read the runtime `currentScenario`, not the constructor arg; `setScenario` only mutates the former, or the dev panel silently does nothing.
- `src/lib/sources/index.ts` caches the mock singleton; runtime `setScenario` mutations persist across requests — no per-request isolation in dev.
- SWR v2 has no `errorRetryFactor` option; backoff is `interval × 2^retryCount` off `errorRetryInterval` alone (the TS overload error on the unknown option cascades confusingly).
- The Freebuff preview webview compositor sometimes fails (`no frames`); verify pages with accessibility snapshots and `preview_evaluate` instead of screenshots.
- Windows: `Start-Process npm.cmd ... -PassThru` may print no pid when the shell waits; read the pid from `netstat` on the port shown in the log.

