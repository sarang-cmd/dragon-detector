// Interaction checks for /learn via raw CDP.
// Usage: node learn-check.mjs <baseUrl> <outDir>
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME =
  'C:\\Users\\Smriti\\.cache\\puppeteer\\chrome\\win64-146.0.7680.153\\chrome-win64\\chrome.exe';
const [base, outDir] = process.argv.slice(2);
const PORT = 9714;

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
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
  const shot = async (name, w, h) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: false,
    });
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${outDir}/${name}`, Buffer.from(data, 'base64'));
    console.log('saved', name);
  };
  const expr = async (expression) => {
    const { result } = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });
    return result?.value;
  };

  // 1. Default students view, desktop dark.
  await send('Page.navigate', { url: `${base}/learn` });
  await sleep(8000);
  await shot('learn-1440-dark.png', 1440, 1200);

  // 2. Click Kids toggle -> persistence + kids copy.
  await expr(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Kids').click()`);
  await sleep(1500);
  results.kidsStored = await expr(`localStorage.getItem('dis_learn_audience')`);
  results.kidsExampleVisible = await expr(
    `document.body.textContent.includes('Mirrors fog up in a steamy bathroom.')`
  );
  results.kidsClass = await expr(
    `document.querySelector('main').parentElement.parentElement.className.includes('audience-kids')`
  );
  await shot('learn-kids-1440-dark.png', 1440, 1200);

  // 3. Anchor deep link lands on the card.
  await send('Page.navigate', { url: `${base}/learn#pressure` });
  await sleep(8000);
  results.pressureCardAtAnchor = await expr(`(() => {
    const el = document.getElementById('pressure');
    if (!el) return 'missing';
    const r = el.getBoundingClientRect();
    return 'top=' + Math.round(r.top);
  })()`);

  // 4. Activity filter by age band.
  await send('Page.navigate', { url: `${base}/learn` });
  await sleep(8000);
  await expr(`(() => {
    const sel = document.getElementById('age-filter');
    sel.value = 'upper-secondary';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(1500);
  results.upperSecondaryCount = await expr(
    `document.querySelectorAll('.activity-sheet').length`
  );

  // 5. Print emulation: activities visible, header hidden, black on white.
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await sleep(1000);
  results.printHeaderHidden = await expr(`(() => {
    const h = document.querySelector('header');
    if (!h) return 'no-header-el';
    return getComputedStyle(h.parentElement).display;
  })()`);
  results.printBodyBg = await expr(`getComputedStyle(document.body).backgroundColor`);
  await shot('learn-print.png', 1200, 1600);
  await send('Emulation.setEmulatedMedia', { media: 'screen' });

  // 6. Mobile light, students view (fresh context = default).
  await send('Page.navigate', { url: `${base}/learn` });
  await sleep(8000);
  await shot('learn-390.png', 390, 1500);

  console.log('RESULTS ' + JSON.stringify(results, null, 2));
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}
