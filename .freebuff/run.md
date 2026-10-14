# DIS Weather Station — how to run (dev preview)

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts + SWR. Mock data source by default (no env keys needed).

## 1. Reproduce the artifacts (fresh checkout)

```bash
pnpm install
```

- Having a `.env.local` isn't required in mock mode. If the main checkout `C:\Users\Smriti\Documents\Sarang\DragonDetector` has one, COPY it into this worktree (values, not symlinks; keys are server-only). Note that the source of truth is `.env.example`.
- Test run-before-commit uses `pnpm vitest run` (include path `src/**/*.test.{ts,tsx}`, alias `@` → `src`, jsdom, @vitejs/plugin-react).

## 2. Run the dev server

```bash
pnpm dev                # is equivalent to `npm run dev -- -p 3000`
```

- **Run exactly one dev server per worktree.** Multiple concurrent `next dev` processes against the same `.next` folder corrupt manifests mid-write (`Unexpected end of JSON input` at `loadManifest`). If chunks 404 after deleting/priming `.next` while a server was running, stop the server, delete `.next`, and start one fresh server.
- Port: project default is **3000**. If taken, pick a free one (`-p <port>` — note the extra `--` before `-p` when using `npm run` npm, e.g. `npm run dev -- -p 3000`).
- Current healthy instance (this thread): detached on port **3000**, pid **61432**, logs at `.freebuff/preview-c2f67de1-76ec-41a1-bd11-65061c007ed4.log` (stdout) and `.freebuff/preview-c2f67de1-76ec-41a1-bd11-65061c007ed4.log.err` (stderr, separate file as Start-Process requires).
- Windows detach recipe used:
  `powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','-p','3000' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"`
  (`npm.cmd` named exactly; PID printed; verify with `Get-Process -Id <pid>`.)

## 3. Check it's healthy

- `curl http://localhost:3000/` → 200 HTML
- `curl http://localhost:3000/api/weather` → 200 JSON (reading + history + meta)
- No 404s on `/_next/static/chunks/...` in the browser network log.

## Dev-only extras

- Floating "Scenario:" debug panel (bottom-right, dev builds only) switches the mock scenario by setting the `weather_scenario` cookie; both `/api/weather` and `/api/history` read it in non-production.
- `DATA_SOURCE=ecowitt` switches the source (stub currently throws "not implemented"); `NEXT_PUBLIC_DATA_MODE=real` would switch client polling to 60s (default mock = 5s).
