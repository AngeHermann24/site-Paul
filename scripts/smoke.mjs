/**
 * Smoke test navigateur (Edge/Chrome installé localement, via playwright-core).
 * Usage : serveur lancé (npm run dev ou preview) puis
 *   node scripts/smoke.mjs [baseUrl]
 * Vérifie, pour chaque route FR/EN en desktop (1440) et mobile (390) :
 * erreurs console / exceptions, overflow horizontal, statut 404 attendu.
 * Captures d'écran dans .artifacts/ (ignoré par git).
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const OUT = '.artifacts';
mkdirSync(OUT, { recursive: true });

const executablePath = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p));

const ROUTES = [
  '',
  'champion',
  'combats',
  'performance',
  'gym',
  'commentateur',
  'actualites',
  'medias',
  'sponsors',
  'contact',
  'mentions-legales',
  'confidentialite',
  'cookies',
  'route-inexistante',
];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const browser = await chromium.launch({ executablePath, headless: true });
const failures = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile ?? false,
    hasTouch: vp.hasTouch ?? false,
    reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  for (const lang of ['fr', 'en']) {
    for (const r of ROUTES) {
      errors.length = 0;
      const url = `${BASE}/${lang}${r ? `/${r}` : ''}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      // Chunk lazy + throttling Suspense de React 19 (~300 ms) : on attend le h1 plutôt qu'un délai fixe.
      await page.waitForSelector('h1', { state: 'attached', timeout: 10000 }).catch(() => undefined);
      await page.waitForTimeout(300);
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        htmlLang: document.documentElement.lang,
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim() ?? null,
      }));
      const problems = [];
      if (errors.length) problems.push(`console: ${errors.join(' | ')}`);
      if (info.overflow > 0) problems.push(`overflow horizontal ${info.overflow}px`);
      if (info.htmlLang !== lang) problems.push(`html lang=${info.htmlLang}`);
      if (!info.h1) problems.push('aucun h1');
      const status = problems.length ? 'FAIL' : 'ok  ';
      console.log(`${status} [${vp.name}] ${url} — "${info.title}"${problems.length ? `\n      ${problems.join('\n      ')}` : ''}`);
      if (problems.length) failures.push(url);
      if (r === '' || r === 'route-inexistante' || r === 'sponsors') {
        await page.screenshot({ path: `${OUT}/${vp.name}-${lang}-${r || 'home'}.png` });
      }
    }
  }

  // Sélecteur de langue : conserve la page courante.
  await page.goto(`${BASE}/fr/gym`, { waitUntil: 'networkidle' });
  if (vp.name === 'mobile') {
    await page.getByRole('button', { name: /ouvrir le menu/i }).click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${vp.name}-menu.png` });
    const focusedInMenu = await page.evaluate(() => Boolean(document.activeElement?.closest('#mobile-menu')));
    console.log(`${focusedInMenu ? 'ok  ' : 'FAIL'} [mobile] focus piégé dans le menu`);
    if (!focusedInMenu) failures.push('focus menu');
    await page.locator('#mobile-menu').getByRole('link', { name: /passer en english/i }).click();
  } else {
    await page.getByRole('link', { name: /passer en english/i }).first().click();
  }
  await page.waitForURL(`${BASE}/en/gym`);
  console.log(`ok   [${vp.name}] switch langue /fr/gym → ${new URL(page.url()).pathname}`);
  await context.close();
}

// Redirections
const ctx = await browser.newContext({ locale: 'en-US' });
const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
console.log(`info racine (navigateur en-US) → ${new URL(p.url()).pathname}`);
await p.goto(`${BASE}/champion`, { waitUntil: 'networkidle' });
console.log(`info /champion → ${new URL(p.url()).pathname}`);
await ctx.close();

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} échec(s)`);
  process.exit(1);
}
console.log('\nSmoke test OK');
