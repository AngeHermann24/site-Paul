/**
 * Captures pleine page (après défilement progressif pour déclencher les révélations).
 * Usage : node scripts/page-shots.mjs <baseUrl> <chemin> [chemin…] [--mobile]
 * Sortie : .artifacts/pages/<viewport>-<chemin>.png + erreurs console.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const [base, ...paths] = args.filter((a) => a !== '--mobile');
const OUT = '.artifacts/pages';
mkdirSync(OUT, { recursive: true });
const executablePath = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => existsSync(p));

const browser = await chromium.launch({ executablePath });
const ctx = await browser.newContext(
  mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } },
);
// Pas de préloader pour les captures.
await ctx.addInitScript(() => sessionStorage.setItem('paul.intro-seen', '1'));
const page = await ctx.newPage();
let failed = false;

for (const path of paths) {
  const errors = [];
  const onConsole = (m) => m.type() === 'error' && errors.push(m.text());
  const onError = (e) => errors.push(String(e));
  page.on('console', onConsole);
  page.on('pageerror', onError);
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1', { state: 'attached', timeout: 10000 }).catch(() => undefined);
  await page.waitForTimeout(1200);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const name = `${mobile ? 'm' : 'd'}-${path.replace(/[/?=&]+/g, '_').replace(/^_/, '') || 'root'}`;
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  const issues = [...errors, ...(overflow > 0 ? [`overflow horizontal ${overflow}px`] : [])];
  if (issues.length) failed = true;
  console.log(`${issues.length ? 'FAIL' : 'ok  '} ${path}${issues.length ? `\n      ${issues.join('\n      ')}` : ''}`);
  page.off('console', onConsole);
  page.off('pageerror', onError);
}

await browser.close();
process.exit(failed ? 1 : 0);
