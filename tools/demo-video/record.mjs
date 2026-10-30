// Records the TraceX demo: drives the live app in Chrome, scene by scene, with a visible cursor.
// Each scene lasts at least as long as its narration (out/audio/durations.json from narrate step).
//   node record.mjs   (needs the frontend on :3300 and the backend on :4000 with real keys)
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const APP = process.env.APP_URL ?? 'http://localhost:3300';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const CASE_TX = '0x08bf5ce46d97ec6299b7a4d1ba9b37591a66c97775186ffd30a1cd023d909b90';
const DEPOSITOR = '0x884f0d4879613761eede606dab244ef288b5e79e';

const narration = JSON.parse(readFileSync('out/audio/durations.json', 'utf8'));
const length = Object.fromEntries(narration.map((s) => [s.id, s.seconds * 1000]));

rmSync('out/frames', { recursive: true, force: true });
mkdirSync('out/frames', { recursive: true });

// A visible cursor and click ripple - headless Chrome draws no pointer of its own
const overlay = `
  window.open = (url) => { location.href = url; return null; };
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.6L4 20z" fill="#fff" stroke="#07070d" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: 0, top: 0, zIndex: 2147483647, pointerEvents: 'none', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.6))' });
    const last = JSON.parse(sessionStorage.getItem('demo-cursor') || '[960,540]');
    c.style.transform = 'translate(' + last[0] + 'px,' + last[1] + 'px)';
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => {
      c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      sessionStorage.setItem('demo-cursor', JSON.stringify([e.clientX, e.clientY]));
    }, true);
    addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      Object.assign(r.style, { position: 'fixed', left: e.clientX - 22 + 'px', top: e.clientY - 22 + 'px', width: '44px', height: '44px', borderRadius: '50%',
        border: '3px solid #00e5ff', zIndex: 2147483646, pointerEvents: 'none', transition: 'transform .5s ease-out, opacity .5s ease-out' });
      document.body.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 600);
    }, true);
  });`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await context.addInitScript(overlay);
const page = await context.newPage();

// frames from Chrome's screencast: sharper than recordVideo, timestamped for exact audio sync
const frames = [];
const cdp = await context.newCDPSession(page);
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const i = frames.length;
  frames.push(metadata.timestamp);
  writeFileSync(`out/frames/${String(i).padStart(6, '0')}.jpg`, Buffer.from(data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });

const marks = [];
const holds = []; // moments that must play at full speed even without narration (results on screen)
async function show(run) {
  const start = Date.now() / 1000;
  await run();
  holds.push({ start, end: Date.now() / 1000 });
}
let mouse = [960, 540];
const sleep = (ms) => page.waitForTimeout(ms);

async function glide(x, y, ms = 700) {
  const steps = Math.max(12, Math.round(ms / 16));
  await page.mouse.move(x, y, { steps });
  mouse = [x, y];
}
async function point(locator, dx = 0, dy = 0, ms) {
  // a missing hover target shouldn't abort a 4-minute recording
  const box = await locator.boundingBox({ timeout: 8000 }).catch(() => null);
  if (!box) return console.log('  (skipped a pointer target)');
  await glide(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, ms);
}
async function click(locator, ms) {
  await point(locator, 0, 0, ms);
  await sleep(180);
  await page.mouse.down();
  await sleep(90);
  await page.mouse.up();
}
async function scene(id, run) {
  const start = Date.now() / 1000;
  marks.push({ id, start });
  console.log(`scene ${id}`);
  await run();
  const left = start * 1000 + length[id] + 700 - Date.now();
  if (left > 0) await sleep(left);
}

await page.goto(APP, { waitUntil: 'networkidle' });

await scene('intro', async () => {
  await sleep(2600); // the intro loader assembles the logo
  await glide(500, 380, 1400);
  await glide(900, 470, 1600);
  await sleep(2500);
  await point(page.locator('p:has-text("evidence-backed")').first(), -120, 0, 1500);
  await sleep(3000);
  await point(page.getByLabel('Transaction hash, wallet address or ENS name').first(), -200, 0, 1200);
});

await scene('paste', async () => {
  const input = page.getByLabel('Transaction hash, wallet address or ENS name').first();
  await click(input, 500);
  await page.keyboard.type(CASE_TX, { delay: 22 });
  await sleep(900);
  await point(page.getByLabel('Chain').first(), 0, 0, 900);
  await sleep(4500);
  await click(page.getByRole('button', { name: 'Investigate' }).first(), 800);
});

await scene('graph', async () => {
  await page.waitForSelector('.react-flow__node', { timeout: 120_000 });
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__node').length >= 3, null, { timeout: 120_000 });
  await sleep(1800);
  const nodes = page.locator('.react-flow__node');
  for (let i = 0; i < (await nodes.count()); i++) {
    await point(nodes.nth(i), 0, -10, 900);
    await sleep(1600);
  }
  await point(page.locator('text=High risk').first(), 0, -40, 1000);
  await sleep(2200);
  await point(page.locator('text=Mixer interaction').first(), 40, 20, 900);
});

await scene('brief', async () => {
  await page.waitForSelector('text=via Meta Model API', { timeout: 120_000 });
  await point(page.locator('text=via Meta Model API').first(), -150, 60, 900);
  await sleep(5500); // the brief types itself out
  const cite = page.locator('aside .cite:not(.cite--addr)').first(); // a transaction, not a wallet
  await point(cite, 0, 0, 900);
  await sleep(700);
  await click(cite, 300);
  await sleep(1800);
  await click(page.getByRole('tab', { name: 'Evidence' }), 800);
  await sleep(1200);
  await point(page.locator('text=Transaction hash').first(), 100, 30, 900);
});

await scene('ask', async () => {
  await click(page.getByRole('tab', { name: 'Ask' }), 700);
  await sleep(500);
  await click(page.locator('button:has-text("Did these funds touch a mixer?")'), 700);
  await page.waitForFunction(() => !document.querySelector('.animate-bounce'), null, { timeout: 90_000 }).catch(() => {});
  await sleep(600);
  await glide(mouse[0], mouse[1] - 160, 900);
});

await scene('recovery', async () => {
  await click(page.getByRole('tab', { name: 'Recovery' }), 700);
  await sleep(900);
  const lang = page.locator('select:has(option[value="igbo"])');
  await point(lang, 0, 0, 800);
  await lang.selectOption('igbo');
  await sleep(900);
  await click(page.locator('button:has-text("Generate both drafts")'), 700);
  // the draft, or the panel's own error box (Next.js also renders a page-level role=alert announcer)
  const done = page.locator('text=Exchange freeze / preservation request').or(page.locator('p[role=alert]'));
  await done.first().waitFor({ timeout: 200_000 });
  await show(async () => {
    await sleep(800);
    await point(page.locator('text=Exchange freeze / preservation request').first(), 0, 120, 900);
    for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 220); await sleep(900); }
    await sleep(1200);
  });
});

await scene('report', async () => {
  await click(page.getByRole('button', { name: /Report/ }).first(), 800);
  await page.waitForSelector('text=Investigation report', { timeout: 30_000 });
  await show(async () => {
    await sleep(1500);
    await glide(960, 600, 800);
    for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, 260); await sleep(650); }
  });
});

await scene('shield', async () => {
  await page.goto(`${APP}/shield`, { waitUntil: 'networkidle' });
  const input = page.getByLabel('Wallet address to scan');
  await click(input, 600);
  await page.keyboard.type(DEPOSITOR, { delay: 22 });
  await sleep(500);
  await click(page.locator('button:has-text("Check wallet")'), 700);
  await page.waitForSelector('text=/look-?alike|impost/i', { timeout: 90_000 }).catch(() => {});
  await show(async () => {
    await sleep(1200);
    const hits = page.locator('text=/0x241e94|0x241b22|fake/i');
    for (let i = 0; i < Math.min(3, await hits.count()); i++) { await point(hits.nth(i), 0, 0, 900); await sleep(1700); }
  });
});

await scene('close', async () => {
  await page.goto(APP, { waitUntil: 'networkidle' });
  await sleep(1000);
  await glide(960, 700, 900);
  // smooth-scroll through every landing section (wheel events don't reach this page reliably)
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= height; y += 300) {
    await page.evaluate((top) => scrollTo({ top, behavior: 'smooth' }), y);
    await sleep(380);
  }
  await sleep(1500);
});

await sleep(1500);
await cdp.send('Page.stopScreencast');
await browser.close();
writeFileSync('out/timeline.json', JSON.stringify({ frames, marks, holds }, null, 1));
console.log(`captured ${frames.length} frames`);
