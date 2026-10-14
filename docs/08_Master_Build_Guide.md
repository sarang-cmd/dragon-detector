# 08: Master Build Guide (how to actually do this)

Your tools: Freebuff (Desktop + CLI), OpenCode, Google Antigravity, Mistral Vibe, Mistral API.
Facts below are as of mid-October 2026. Model catalogs and free limits change often, so treat model names as "look for something like this" and confirm with `/model` (Freebuff), `/models` (OpenCode) or the model picker (Antigravity). I assumed "Desktop" means Freebuff Desktop. Tell me if you meant something else.

---
## 1. The one-page strategy
1. Your docs (00-07) are the single source of truth. Every agent reads `/docs` first, so you can switch tools mid-project without losing context.
2. Git is the handoff between agents. Commit after every prompt. A new agent starts from the repo, not from a chat.
3. `docs/PROGRESS.md` is the baton (template in section 7). Update it at the end of every prompt.
4. Use free, unmetered models for volume work (scaffolding, components, CSS, tests). Spend scarce quota (Antigravity's weekly allowance, Mistral limits) only on steps where a stronger model matters: design direction, architecture, the real API adapter, and the final audit.
5. One agent edits a branch at a time. A second agent may review (read-only prompt).

---
## 2. Tool roles
| Tool | Role in this project | Why |
|---|---|---|
| Freebuff Desktop | Main builder for sessions 1-2 | Free, runs tasks in parallel locally, easy to see diffs |
| Freebuff CLI | Same as Desktop when working in a terminal or over SSH | Same models and limits |
| OpenCode | Fallback builder and "model switchboard" | Works with many providers; connect your Mistral key; has free Zen models for a limited time |
| Google Antigravity | Design lead, hard problems, visual QA | Strong models (Gemini Pro class, Claude, etc.) and a browser agent for checking the UI, but limited free quota |
| Mistral Vibe | Reviewer, tests, refactors, docs | Terminal agent built around Devstral; limited on the free plan |
| Mistral API | Key that powers OpenCode and Vibe; optional Codestral autocomplete | Free Experiment tier: roughly 1B tokens/month but low per-second limits |

### What each tool's limits look like
- **Freebuff:** free and ad-supported. Several models are listed as unmetered in the picker (GLM 5.3 Flash, DeepSeek V4.1 Flash, MiMo 2.6 Flash, Solar Mini/Pro 4); premium models draw on daily sessions. Regions or VPN users get limited access, with a small daily Freebucks allowance (about 25/day, 20 on VPN). Do not use a VPN while building. Check in the app whether your region has full or limited access.
- **OpenCode:** the client is free. Zen free models are "limited time" and can return 429 (FreeUsageLimitError); other models bill per token. Changing client does not reset a provider's limits.
- **Antigravity (free Individual tier):** unlimited tab completions and command requests, but the agent has a basic weekly quota. Quota tracks how much work the agent does (planning, running, retrying), not how many prompts you send. Do not waste it on trivial edits.
- **Mistral API (Experiment tier):** no card needed; limits are shown in the console under Admin > Limits; expect about 1 request/second and lower priority at peak times. Keep parallel requests to 1.
- **Mistral Vibe:** the free Mistral plan includes limited Vibe usage.

---
## 3. Which model for which stage
Pick by job type, not by brand. Rough mapping:

| Job type | Pick | Examples from your tools |
|---|---|---|
| Planning, architecture, "read all docs and summarize" | Deepest reasoning model | Freebuff: GLM 5.3 Flash (unmetered) or DeepSeek V4 Pro class. Antigravity: Gemini Pro or Claude |
| Bulk coding: components, routes, CSS, tests | Fast tool-use model | Freebuff: DeepSeek V4.1 Flash or MiMo Flash. OpenCode: Zen free models |
| Anything with screenshots (UI iteration) | Model with image support | Freebuff: MiMo 2.6 Flash (default, supports images). Antigravity: Gemini |
| Design taste and "does this look AI-generated" review | Strongest model you have access to | Antigravity (Gemini Pro or Claude) |
| Tricky logic: API adapter, unit conversion, timezones | Strong reasoning + tests | GLM 5.3 Flash / Antigravity Pro model, then Devstral to write tests |
| Code review, tests, docs, refactors | Devstral via Vibe or OpenCode | Mistral Vibe / Mistral API |
| Final audit (Prompt 10) | Strongest + a second opinion | Antigravity first, Vibe second |

### Stage-by-stage plan
| Stage | Prompt | Primary tool and model | Backup |
|---|---|---|---|
| Context load | 0 | Freebuff Desktop, reasoning model | OpenCode |
| Scaffold | 1 | Freebuff Desktop, fast model | OpenCode |
| Design tokens and shell | 2 | **Antigravity** (strong model; design matters most here) | Freebuff with MiMo (images) |
| Types, mock, API route | 3 | Freebuff, reasoning model | OpenCode |
| Hook, live states | 4 | Freebuff, fast model | Vibe |
| Dashboard | 5 | Freebuff builds; Antigravity reviews screenshots | OpenCode |
| Data page | 6 | Freebuff, fast model | OpenCode |
| Learn page | 7 | Freebuff, fast model (content writing is fine on any) | Vibe |
| Canvas UI effects | 8 | Antigravity or Freebuff reasoning model; read docs/03b first | OpenCode |
| Station/display + real adapter | 9 | Reasoning model; Vibe writes tests | Antigravity |
| QA and launch | 10 | Antigravity audit + Vibe second pass | Freebuff |

---
## 4. Setup (do once, 30 minutes before session 1)
1. Create the repo and folder structure:
```
mkdir dis-weather && cd dis-weather && git init
mkdir docs public/brand
```
Unzip the project zip: docs go in `docs/`, logos in `public/brand/`.
2. Add a `.gitignore` containing `.env*.local`, `node_modules`, `.next`.
3. Install and sign in: Freebuff Desktop (and CLI), OpenCode, Antigravity, Mistral Vibe.
4. Mistral API: sign in to the Mistral console, create a free API key, and check Admin > Limits. Store it as an environment variable, e.g. `MISTRAL_API_KEY`, not in the repo.
5. In OpenCode: run `/connect`, pick Mistral, paste the key, then `/models` and choose a Devstral model. Do the same in Vibe following its setup prompt.
6. Create `AGENTS.md` in the repo root so every agent gets the same house rules (template in section 7). Many agents read this file automatically.
7. Commit: "docs: add project plan".

---
## 5. Session workflow (repeat for every prompt)
1. `git status` should be clean. Create the branch for the session if needed.
2. Open the agent in the repo root. If it is a fresh chat: "Read AGENTS.md and docs/PROGRESS.md first, then do the task."
3. Paste the prompt from `docs/05`.
4. Run `pnpm dev`, look at it in the browser (desktop and phone width). Do not trust "done".
5. If it is wrong: describe the exact problem and attach a screenshot. Avoid "make it better".
6. `pnpm build && pnpm lint` must pass.
7. Commit. Update `docs/PROGRESS.md`.
8. Optional: switch tool, run the "Review before commit" prompt (read-only).

Keep chats short. Start a new chat for each prompt. Long chats get slow, expensive and confused.

---
## 6. Rate limits: what to do
### Decision tree
1. **Read the error.** 429 with "per minute/second" = wait and retry. 429 with "quota/daily/weekly/session exhausted" = switch tool or model. Auth error = wrong key or provider.
2. **Per-second limit (Mistral):** reduce parallelism to 1, wait 10-60 s, retry. Do not let agents spawn parallel subagents on this key.
3. **Daily or session limit (Freebuff premium models):** switch to an unmetered model with `/model`, such as GLM 5.3 Flash or DeepSeek V4.1 Flash.
4. **OpenCode Zen free model 429:** the free pool is shared and limited; retry with delay, then change model or provider. Do not loop retries.
5. **Antigravity weekly quota gone:** do not wait. Move that task to Freebuff or OpenCode. Resume Antigravity for the final audit only. Quota reportedly refreshes weekly on free (some sources say on a rolling cycle); check its in-app usage panel.
6. **Everything is limited at once:** do non-AI work: run the app, write content in `docs/06`, collect assets, test on phones, write the Learn text yourself. Then resume.
7. **Do not** create extra accounts to dodge limits or use VPNs (violates terms, and Freebuff reduces access on VPNs).

### Handoff template when switching tools mid-task
Paste this into the new agent:
```
Continue an in-progress task. Read AGENTS.md, docs/PROGRESS.md and the last 3 git commits. Run `git diff` to see uncommitted changes. The task was: <prompt X>. The previous agent stopped because of a rate limit. Finish only what is missing; do not rewrite finished files.
```
Commit WIP before switching: `git add -A && git commit -m "wip: prompt X"`.

### Save quota
- Give precise prompts; avoid "explore the whole repo".
- Point to files: "edit src/components/weather/WindCompass.tsx only".
- Ask for plan first on big tasks, then approve.
- Use the cheap model to write, the expensive one to review a diff.

---
## 7. Templates
### `AGENTS.md`
```
# House rules
Project: DIS Weather Station website (Dresden International School). Station: Sainlogic WS3500 via Ecowitt cloud.
Read /docs before any work. Docs 00-07 are the source of truth; 03a has brand colors.
Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, pnpm.
Rules:
- Never read, print or commit .env files or API keys. Keys are server-only.
- UI only imports WeatherReading from src/lib/types.ts; only sources/ecowitt.ts knows Ecowitt.
- Follow the anti AI-look rules in docs/03. No gradients, emoji icons or decorative cards.
- Run pnpm build and pnpm lint before saying a task is done.
- Make minimal changes; do not rewrite files you were not asked to touch.
- After finishing, update docs/PROGRESS.md.
```
### `docs/PROGRESS.md`
```
# Progress
Current branch:
Last completed prompt:
Next prompt:
Known issues:
Decisions made (e.g. chose Droplets effect):
Tool/model used last:
```

---
## 8. Timeline with tools (6 hours, 3 sessions)
**Session 1 (2.5 h)**
- 0:00 Setup and commit docs (Section 4)
- 0:20 Prompt 0-1 Freebuff Desktop
- 0:45 Prompt 2 in Antigravity (spend quota here, attach logos and screenshots)
- 1:15 Prompt 3-4 Freebuff
- 1:45 Prompt 5 Freebuff; paste screenshots to Antigravity for a design critique ("Fix the AI look" prompt) and apply fixes in Freebuff

**Session 2 (2 h)**
- Prompt 6-7 Freebuff or OpenCode (volume work)
- Prompt 8 reasoning model; keep the effect optional
- Vibe: write tests for units, beaufort and summary
- Deploy a preview to Vercel; test on your phone

**Session 3 (1.5 h)**
- Get Ecowitt keys, put them in `.env.local` and the Vercel dashboard, save a redacted real JSON in docs
- Prompt 9 with a reasoning model; run the adapter tests
- Prompt 10 in Antigravity, second pass in Vibe
- Launch tasks from docs/06

---
## 9. Quality gates before moving on
- After 2: screenshots match the black-and-white brand; accent is amber (dark) and blue (light); logo displays correctly.
- After 5: looks good on a phone; no layout jump when numbers change.
- After 8: effect disabled with reduced motion; page still fine with effect removed.
- After 9: values match the WS View app; stale banner works when you simulate offline.
- After 10: no keys in the client bundle (`grep -r "ECOWITT" .next/static` returns nothing).

---
## 10. Common problems
| Problem | Fix |
|---|---|
| Agent invents Ecowitt field names | Give it the real sample JSON; forbid guessing |
| Result looks generic | Use "Fix the AI look" prompt with a screenshot; delete elements rather than adding |
| Agent rewrites everything | Add "edit only these files"; revert with `git checkout .` |
| Build fails after a switch of tool | Run the handoff template; ask for root cause first |
| API returns imperial numbers | Check unit IDs in the Ecowitt docs; use the adapter's conversion fallback |
| Values stale | Check console Wi-Fi (2.4 GHz) and upload interval in WS View |
| Key leaked | Regenerate on ecowitt.net immediately, update env vars, redeploy |
| Canvas effect janky | Remove it; ship without; add later |

---
## 11. Optional extras
- Vercel: connect the repo for automatic preview deployments on every push.
- Playwright screenshots: ask an agent to add a script that screenshots each page at 390 and 1440 px, so you can paste them into a design review.
- Cheap safety net: a GitHub Action running `pnpm build` and `pnpm test`.
