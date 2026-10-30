// Refreshes docs/screenshots from the live app (same real case as the demo video).
import { chromium } from 'playwright-core';
const APP = process.env.APP_URL ?? 'http://localhost:3300';
const OUT = '../../docs/screenshots';
const CASE_TX = '0x08bf5ce46d97ec6299b7a4d1ba9b37591a66c97775186ffd30a1cd023d909b90';
const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { window.open = (u) => { location.href = u; return null; }; });
const p = await ctx.newPage();
const shot = (name) => p.screenshot({ path: `${OUT}/${name}.png` });

await p.goto(APP, { waitUntil: 'networkidle' }); await p.waitForTimeout(3500); await shot('landing');
await p.evaluate(() => document.getElementById('method')?.scrollIntoView()); await p.waitForTimeout(1800); await shot('adinkra-method');

await p.goto(`${APP}/investigate?q=${CASE_TX}`, { waitUntil: 'networkidle' });
await p.waitForSelector('text=via Meta Model API', { timeout: 120000 }); await p.waitForTimeout(9000); await shot('workspace-tornado');
await p.locator('aside .cite:not(.cite--addr)').first().click(); await p.getByRole('tab', { name: 'Evidence' }).click(); await p.waitForTimeout(1500); await shot('workspace-evidence');
await p.getByRole('tab', { name: 'Recovery' }).click();
await p.locator('select:has(option[value="igbo"])').selectOption('igbo');
await p.locator('button:has-text("Generate both drafts")').click();
await p.locator('text=Exchange freeze / preservation request').or(p.locator('p[role=alert]')).first().waitFor({ timeout: 200000 });
await p.waitForTimeout(1200); await shot('recovery-kit-igbo');
await p.getByRole('button', { name: /Report/ }).first().click(); await p.waitForSelector('text=Investigation report'); await p.waitForTimeout(1500); await shot('report');

await p.goto(`${APP}/shield`, { waitUntil: 'networkidle' });
await p.getByLabel('Wallet address to scan').fill('0x884f0d4879613761eede606dab244ef288b5e79e');
await p.locator('button:has-text("Check wallet")').click();
await p.waitForSelector('text=/look-?alike|impost/i', { timeout: 90000 }).catch(() => {}); await p.waitForTimeout(1500); await shot('poisoning-shield');

const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto(`${APP}/investigate?q=${CASE_TX}`, { waitUntil: 'networkidle' });
await m.waitForSelector('.react-flow__node', { timeout: 120000 }); await m.waitForTimeout(3000);
await m.screenshot({ path: `${OUT}/mobile.png` });
await b.close();
console.log('screenshots refreshed');
