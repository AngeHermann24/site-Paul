/**
 * Captures d'animation (préloader, hero, rideau de transition, révélations au scroll).
 * Usage : node scripts/motion-shots.mjs [baseUrl] [mobile]
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const MOBILE = process.argv[3] === 'mobile';
const OUT = '.artifacts/motion';
mkdirSync(OUT, { recursive: true });
const executablePath = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => p && existsSync(p));

const browser = await chromium.launch({ executablePath, headless: true });
const ctx = await browser.newContext(
  MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } },
);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
const tag = MOBILE ? 'm' : 'd';
const shot = (name) => page.screenshot({ path: `${OUT}/${tag}-${name}.png` });

await page.goto(`${BASE}/fr`);
await page.waitForTimeout(350);
await shot('01-preloader');
await page.waitForTimeout(900);
await shot('02-preloader-late');
await page.waitForTimeout(1500);
await shot('03-hero-entering');
await page.waitForTimeout(2200);
if (!MOBILE) await page.mouse.move(1100, 300, { steps: 8 });
await page.waitForTimeout(1200);
await shot('04-hero-settled');

await page.mouse.wheel(0, 700);
await page.waitForTimeout(1200);
await shot('05-scroll-700');
await page.mouse.wheel(0, 700);
await page.waitForTimeout(1600);
await shot('06-scroll-1400');

// Transition de page
const link = MOBILE ? null : page.getByRole('navigation', { name: /navigation principale/i }).getByRole('link', { name: /gym/i });
if (link) {
  await link.click();
  await page.waitForTimeout(260);
  await shot('07-curtain');
  await page.waitForTimeout(1300);
  await shot('08-after-transition');
  const state = await page.evaluate(() => ({
    path: location.pathname,
    scrollY: window.scrollY,
    focused: document.activeElement?.id ?? document.activeElement?.tagName,
  }));
  console.log('transition →', state);
}

console.log(errors.length ? `ERREURS:\n${errors.join('\n')}` : 'aucune erreur console');
await browser.close();
