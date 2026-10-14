# DIS Weather Station Website: Start Here

Project: live weather website for Dresden International School (DIS), powered by a Sainlogic WS3500 station that uploads to the Ecowitt cloud (ecowitt.net) and is read through the Ecowitt Cloud API.
Build time: about 6 hours over 3 sessions. Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Canvas UI (canvasui.dev) + Recharts, deployed on Vercel.

## File index
1. `01_Project_Brief_and_Roadmap.md` - goals, scope, 3-day schedule with time boxes
2. `02_Ecowitt_API_and_Data_Model.md` - API endpoint, keys, units, mock to real switch
3. `03_Design_System_and_Branding.md` - black/white premium system, anti-"AI look" rules
   - `03a_DIS_Brand_Kit.md` - real DIS colors, logo rules, contrast fixes (overrides section 2 of 03)
   - `03b_Canvas_UI_Notes.md` - Canvas UI install, browser support, weather-themed picks
4. `04_Architecture_and_Build_Spec.md` - folders, components, server proxy, mock simulator, pages
5. `05_Agent_Prompts_Sequence.md` - 10 copy-paste prompts for OpenCode / Freebuff / Antigravity
6. `06_Education_Content_and_Launch.md` - teaching content, accessibility, QA, launch checklist
7. `07_Station_Hardware_WS3500.md` - your Sainlogic WS3500: sensors, specs, Wi-Fi, maintenance
`/brand` folder: the DIS logo files you sent (put them in `/public/brand` in the repo).

## Status
- [x] Logos, tagline banner and DIS website reviewed; colors extracted (DIS Blue #00529E, Amber #F6A800, Green #B3D236)
- [x] Station identified: Sainlogic WS3500 (WS View app, Ecowitt cloud)
- [ ] Missing: transparent SVG logo (+ white version), API keys, device MAC, real sample JSON, station latitude / longitude / elevation / mount height
- [ ] Missing: school permission for logo and subdomain, club member names for the About page

## What to attach to the agent
Session 1: this docs folder, the logo files, 3-5 DIS site screenshots, 2-3 canvasui.dev screenshots, a screenshot of the WS View app dashboard.
Session 3 only: `/docs/sample-real-time.json` (keys redacted). Keys go in `.env.local`, never in chat.

## Security rules (read once)
- Never paste the API key or Application Key into an AI chat, the repo or client code.
- All Ecowitt calls happen on the server (Next.js route handler). The browser only talks to your `/api/weather`.
- `.env.local` goes into `.gitignore` before the first commit. If a key leaks, regenerate it on ecowitt.net.

## Naming
The station is **Sainlogic** WS3500; the cloud/API service is **Ecowitt**.
