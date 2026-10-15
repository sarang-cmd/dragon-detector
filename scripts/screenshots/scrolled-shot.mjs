// Scrolled-viewport screenshot via raw CDP (no extra deps).
// Usage: node scrolled-shot.mjs <url> <out.png> <scrollY> <width> <height> [dark]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME =
  'C:\\Users\\Smriti\\.cache\\puppeteer\\chrome\\win64-146.0.7680.153\\chrome-win64\\chrome.exe';
const [url, out, scrollY, w, h, dark] = process.argv.slice(2);
const PORT = 9713;

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
  ...(dark ? ['--force-prefers-color-scheme=dark'] : []),
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: Number(w),
    height: Number(h),
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url });
  await send('Page.loadEventFired').catch(() => {});
  await sleep(9000); // let SWR fetch + render settle
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, ${Number(scrollY)})`,
  });
  await sleep(1200);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('saved', out);
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
}
