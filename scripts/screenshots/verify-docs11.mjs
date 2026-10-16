// Verification captures for docs/11 (roles, gating, units, rain, admin panel).
// Usage: node verify-docs11.mjs <baseUrl> <repoRoot>
// Saves into <repoRoot>/screenshots/{onboarding,learn,station,home}/.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME =
  'C:\\Users\\Smriti\\.cache\\puppeteer\\chrome\\win64-146.0.7680.153\\chrome-win64\\chrome.exe';
const [base, repoRoot] = process.argv.slice(2);
const PORT = 9715;

const out = (sub, name) => {
  mkdirSync(join(repoRoot, 'screenshots', sub), { recursive: true });
  return join(repoRoot, 'screenshots', sub, name);
};

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
  '--force-prefers-color-scheme=dark',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {};
let ws;
try {
  let targets;
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      targets = await res.json();
      if (targets.length) break;
    } catch {}
  }
  const page = targets.find((t) => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(JSON.stringify(msg.error)));
      else res(msg.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const cur = ++id;
      pending.set(cur, { res, rej });
      ws.send(JSON.stringify({ id: cur, method, params }));
    });
  const shot = async (sub, name, w, h) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: false,
    });
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(out(sub, name), Buffer.from(data, 'base64'));
    console.log('saved', sub + '/' + name);
  };
  const expr = async (expression) => {
    const { result } = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });
    return result?.value;
  };
  const key = async (type, keyName) => {
    await send('Input.dispatchKeyEvent', { type, key: keyName });
    await sleep(120);
  };

  // 1. Fresh profile -> onboarding modal on first visit.
  await send('Page.navigate', { url: `${base}/` });
  await sleep(8000);
  results.onboardingVisible = await expr(
    `!!document.querySelector('[role="dialog"]')`
  );
  results.onboardingCards = await expr(
    `document.querySelectorAll('[role="dialog"] [aria-pressed]').length`
  );
  await shot('onboarding', 'onboarding-1440-dark.png', 1440, 900);

  // 2. Pick Teacher in the modal (click), expect modal gone + flag stored.
  await expr(
    `[ "[role=\\"dialog\\"] [data-role=\\"teacher\\"]" ].map(s => document.querySelector(s)?.click())`
  );
  await sleep(1500);
  results.teacherPickedStored = await expr(`localStorage.getItem('dis_role')`);
  results.modalGoneAfterPick = await expr(
    `!document.querySelector('[role="dialog"]')`
  );
  results.roleInFooter = await expr(
    `document.body.textContent.includes('Viewing as')`
  );

  // 3. Learn as teacher: activities + handout visible.
  await send('Page.navigate', { url: `${base}/learn` });
  await sleep(8000);
  results.teacherActivities = await expr(
    `document.querySelectorAll('.activity-sheet').length`
  );
  results.teacherHandout = await expr(
    `document.body.textContent.includes('Three steps for your lesson')`
  );
  await shot('learn', 'learn-teacher-1440-dark.png', 1440, 1400);

  // 4. Switch to PYP: kids copy, activities hidden with note.
  await expr(`localStorage.setItem('dis_role','pyp');localStorage.setItem('dis_role_set','1')`);
  await send('Page.navigate', { url: `${base}/learn` });
  await sleep(8000);
  results.pypKidsCopy = await expr(
    `document.body.textContent.includes('Mirrors fog up in a steamy bathroom.')`
  );
  results.pypNoActivities = await expr(
    `document.querySelectorAll('.activity-sheet').length`
  );
  results.pypGateNote = await expr(
    `document.body.textContent.includes('appear when viewing as a teacher')`
  );
  await shot('learn', 'learn-pyp-1440-dark.png', 1440, 1400);

  // 5. Station page imperial.
  await expr(`localStorage.setItem('dis_weather_unit_system','imperial')`);
  await send('Page.navigate', { url: `${base}/station` });
  await sleep(8000);
  results.stationImperial = await expr(
    `document.body.textContent.includes('−40 °F to +140 °F') || document.body.textContent.includes('-40 °F to +140 °F')`
  );
  results.stationFootnote = await expr(
    `document.body.textContent.includes('Values shown in imperial units')`
  );
  await shot('station', 'station-imperial-1440-dark.png', 1440, 1200);

  // 6. Rain scenario via cookie -> home tile shows non-zero today.
  await expr(`document.cookie='weather_scenario=rain; path=/; max-age=3600; samesite=lax'`);
  await send('Page.navigate', { url: `${base}/` });
  await sleep(12000);
  results.rainTileText = await expr(
    `(() => { const el=[...document.querySelectorAll('p')].find(p=>/No rain today|Trace of rain|Rate:/.test(p.textContent)); return el?el.textContent.trim().slice(0,60):'tile-text-missing'; })()`
  );
  await shot('home', 'home-rain-1440-dark.png', 1440, 1100);
  await expr(`document.cookie='weather_scenario=default; path=/; max-age=0; samesite=lax'`);

  // 7. Triple-press D reveals the admin panel (no visible button otherwise).
  await send('Page.navigate', { url: `${base}/` });
  await sleep(8000);
  results.noButtonBefore = await expr(
    `!document.body.textContent.includes('Scenario:')`
  );
  await key('keyDown', 'd');
  await key('keyDown', 'd');
  await key('keyDown', 'd');
  await sleep(1000);
  results.panelAfterTripleD = await expr(
    `!!document.getElementById('scenario-panel')`
  );
  await shot('home', 'home-admin-panel-1440-dark.png', 1440, 900);

  // 8. Top progress bar exists during navigation.
  await send('Page.navigate', { url: `${base}/data?range=24h&metric=temperature` });
  await sleep(400);
  results.topBarSeen = await expr(
    `(() => { const el=document.querySelector('.top-progress-track'); if(!el) return 'missing'; return el.getAttribute('data-visible'); })()`
  );

  console.log('RESULTS ' + JSON.stringify(results, null, 2));
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}
