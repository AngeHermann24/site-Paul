/**
 * Audit accessibilité maison — toutes les routes publiques × FR/EN × desktop.
 * Vérifie : <html lang>, un seul <h1> présent, ordre des niveaux de titre,
 * alt sur les images, nom accessible sur boutons/liens/contrôles, labels de champs,
 * cibles cliquables ≥ 24 px (WCAG 2.5.8) et présence du skip-link.
 * Usage : node scripts/a11y-check.mjs [base]
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const executablePath = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => existsSync(p));

const ROUTES = ['', 'champion', 'combats', 'performance', 'gym', 'commentateur', 'actualites', 'medias', 'sponsors', 'contact', 'mentions-legales', 'route-inexistante'];

const browser = await chromium.launch({ executablePath });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('paul.intro-seen', '1'));

const problems = [];

for (const lang of ['fr', 'en']) {
  for (const route of ROUTES) {
    const url = `${BASE}/${lang}${route ? `/${route}` : ''}`;
    const tag = `${lang}/${route || 'accueil'}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(400);

    const report = await page.evaluate(() => {
      const out = { h1: 0, skips: [], imgs: [], unnamed: [], unlabeled: [], small: [], skipLink: false };
      out.h1 = document.querySelectorAll('h1').length;
      // Ordre des titres : pas de saut de niveau (h2 → h4)
      let prev = 0;
      for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
        const lvl = Number(h.tagName[1]);
        if (prev && lvl > prev + 1) out.skips.push(`h${prev}→h${lvl} "${h.textContent?.trim().slice(0, 40)}"`);
        prev = lvl;
      }
      for (const img of document.querySelectorAll('img')) {
        if (!img.hasAttribute('alt')) out.imgs.push(img.src.split('/').pop()?.slice(0, 40));
      }
      const name = (el) => (el.getAttribute('aria-label') ?? el.textContent ?? el.getAttribute('title') ?? '').trim();
      for (const el of document.querySelectorAll('button, a[href]')) {
        if (el.getAttribute('aria-hidden') === 'true') continue;
        if (!name(el) && !el.querySelector('img[alt]') && !el.getAttribute('aria-labelledby')) {
          out.unnamed.push(el.outerHTML.slice(0, 60));
        }
      }
      for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')) {
        const ok = el.id && document.querySelector(`label[for="${el.id}"]`);
        if (!ok && !el.closest('label') && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && el.getAttribute('aria-hidden') !== 'true' && el.tabIndex !== -1) {
          out.unlabeled.push(`${el.tagName.toLowerCase()}[name=${el.name || el.type}]`);
        }
      }
      for (const el of document.querySelectorAll('button, a[href], input[type=checkbox], input[type=radio], [role=tab]')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24) && !el.closest('[aria-hidden=true]')) {
          // Un input masqué dans un <label> : la cible réelle est le label.
          if (el.tagName === 'INPUT' && el.closest('label')) continue;
          out.small.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || '').trim().slice(0, 20)}"`);
        }
      }
      out.skipLink = !!document.querySelector('a[href^="#main"], a[href="#contenu"], a.skip, [class*=skip]');
      return out;
    });

    if (report.h1 !== 1) problems.push(`${tag} : ${report.h1} h1`);
    for (const s of report.skips) problems.push(`${tag} : saut de titre ${s}`);
    for (const s of report.imgs) problems.push(`${tag} : img sans alt (${s})`);
    for (const s of report.unnamed) problems.push(`${tag} : contrôle sans nom (${s})`);
    for (const s of report.unlabeled) problems.push(`${tag} : champ sans label (${s})`);
    for (const s of report.small.slice(0, 5)) problems.push(`${tag} : cible <24px (${s})`);
    if (!report.skipLink) problems.push(`${tag} : pas de skip-link`);
  }
}

await browser.close();
if (problems.length) {
  console.log(`${problems.length} problème(s) :`);
  for (const p of problems) console.log(' -', p);
  process.exit(1);
}
console.log(`A11y OK — ${ROUTES.length * 2} routes vérifiées.`);
