# Project Brief and Roadmap

## 1. Problem
The school weather club runs a working station but the data sits in a private app. DIS students and teachers cannot easily see it or learn from it.

## 2. Goals
1. Public live dashboard for the DIS community: temperature, humidity, wind speed/gust/direction, rain, pressure, UV and light.
2. Zero learning curve: a teacher opening the page on a phone understands it in 10 seconds.
3. Learn mode: every measurement has a plain-language explanation, a "why it matters" line and a classroom question.
4. History: charts for 24 h and 7 days with min/max.
5. Premium black and white look, DIS branded, not AI-looking.
6. Built on mock data first; switching to the real API is one env variable.

## 3. Non-goals (v1)
No user accounts, no database, no admin panel, no forecast model (maybe v2: pressure-trend text), no push notifications.

## 4. Audience
| Persona | Needs | Design consequence |
|---|---|---|
| Younger student | Big numbers, icons, simple words | Kids mode in Learn |
| IB / MYP student | Data, units, charts, CSV | Data page, export, unit toggle |
| Teacher | Quick lesson link, projector view | /display kiosk mode, activities |
| Parent / visitor | Is it raining? Jacket? | Plain-language summary at top |

## 5. Pages
`/` live dashboard, `/learn`, `/data`, `/station`, `/display`, plus server routes `/api/weather` and `/api/history`.

## 6. Roadmap (about 6 hours, 3 sessions)

### Session 1 (2.5 h): foundation and mock dashboard
| Time | Task | Done when |
|---|---|---|
| 0:00-0:20 | Put docs, logos, screenshots in repo | `/docs` and `/public/brand` exist |
| 0:20-0:45 | Prompts 1-2: scaffold, theme tokens, fonts, shell | Themed blank site runs |
| 0:45-1:30 | Prompts 3-4: types, mock simulator, API route, hook | Values change live |
| 1:30-2:30 | Prompt 5: dashboard tiles, wind compass, rain, summary | Home complete on mock data |
Exit: phone + desktop screenshots, commit.

### Session 2 (2 h): depth and polish
| Time | Task | Done when |
|---|---|---|
| 0:00-0:40 | Prompt 6: /data charts, range switch, CSV | Charts render |
| 0:40-1:20 | Prompt 7: /learn and tooltips | Card per measurement |
| 1:20-1:50 | Prompt 8: Canvas UI accents | One tasteful effect, reduced-motion safe |
| 1:50-2:00 | Commit, Vercel preview | Preview URL works |

### Session 3 (1.5 h): real data and launch
| Time | Task | Done when |
|---|---|---|
| 0:00-0:30 | Create keys, env vars, real sample JSON | `/api/weather` returns live values |
| 0:30-0:50 | Prompt 9: Ecowitt adapter, units, stale states | `DATA_SOURCE=ecowitt` works |
| 0:50-1:10 | Prompt 10: accessibility, performance, QA | Lighthouse 90+ |
| 1:10-1:30 | Domain, school review, launch | Live URL announced |

## 7. Risks
| Risk | Mitigation |
|---|---|
| Console Wi-Fi drops (2.4 GHz only, needs adapter power) | Stale/offline states, ask IT for stable network |
| API limits or downtime | Server cache 60 s, last-good fallback |
| Generic AI look | Hard rules in 03 and 03a, screenshot review per prompt |
| Key leakage | Server-only env vars, rotate if exposed |
| Logo permission | Get school sign-off before launch |
