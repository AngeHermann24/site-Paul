/**
 * Test fonctionnel des formulaires gym / booking / sponsoring contre la mock API
 * (Edge Function `submit-request` simulée, insertion en « service_role »).
 *
 * 1. /fr/gym : formulaire d'inscription → envoi légitime → POST function 200 + confirmation
 * 2. /fr/commentateur : formulaire de booking → idem
 * 3. /fr/sponsors : parcours 5 étapes → validation bloquante à l'étape 1,
 *    pièce jointe PDF → upload signé vers /storage/v1/object/upload/sign/… → confirmation
 *
 * Prérequis : `npm run dev:e2e` (VITE_SUBMIT_FUNCTION=true).
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const executablePath = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => existsSync(p));

const browser = await chromium.launch({ executablePath });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.addInitScript(() => sessionStorage.setItem('paul.intro-seen', '1'));
const fails = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails.push(name);
};

let fnCalls = 0;
let uploads = 0;
const fnStatuses = [];
page.on('request', (r) => {
  if (r.method() === 'POST' && r.url().includes('/functions/v1/submit-request')) fnCalls += 1;
  if (r.url().includes('/storage/v1/object/upload/sign/')) uploads += 1;
});
page.on('response', (r) => {
  if (r.url().includes('/functions/v1/submit-request')) fnStatuses.push(`${r.request().method()}:${r.status()}`);
});

const consent = (scope) => scope.locator('input[type=checkbox]:not(.sr-only)');
const confirmation = () => page.locator('[role=status]').count();

// ------------------------------------------------------------------ 1. Gym
await page.goto(`${BASE}/fr/gym`, { waitUntil: 'networkidle' });
const gymForm = page.locator('form').last();
await gymForm.waitFor({ timeout: 15000 });
await page.waitForTimeout(3400); // délai anti-spam

await gymForm.getByLabel('Nom complet').fill('Karim Testeur');
await gymForm.locator('input[type=email]').fill('karim.test@example.com');
await gymForm.locator('label', { hasText: 'Formule souhaitée' }).locator('select').selectOption({ index: 1 });
await gymForm.locator('input[name=disciplines][type=checkbox]').first().check({ force: true });
await gymForm.locator('label', { hasText: 'Niveau de pratique' }).locator('select').selectOption('beginner');
await gymForm.locator('input[name=preferred_contact][value=email]').check({ force: true });
await gymForm.locator('textarea').fill('Je souhaite rejoindre la salle pour m’entraîner.');
await consent(gymForm).check();
await gymForm.locator('button[type=submit]').click();
await page.waitForSelector('[role=status]', { timeout: 8000 }).catch(() => null);
check('gym → confirmation', (await confirmation()) === 1);
check('gym → POST function', fnCalls === 1 && fnStatuses.at(-1) === 'POST:200', fnStatuses.join(', '));

// ------------------------------------------------------------------ 2. Booking commentateur
await page.goto(`${BASE}/fr/commentateur`, { waitUntil: 'networkidle' });
const bookingForm = page.locator('form').last();
await bookingForm.waitFor({ timeout: 15000 });
await page.waitForTimeout(3400);

await bookingForm.getByLabel('Votre nom').fill('Organisateur Test');
await bookingForm.locator('input[type=email]').fill('orga.test@example.com');
await bookingForm.getByLabel('Nom de l’événement').fill('Gala de boxe e2e');
await bookingForm.getByLabel('Date de l’événement').fill('2026-09-12');
await bookingForm.locator('textarea').fill('Nous cherchons un commentateur pour notre gala.');
await consent(bookingForm).check();
await bookingForm.locator('button[type=submit]').click();
await page.waitForSelector('[role=status]', { timeout: 8000 }).catch(() => null);
check('booking → confirmation', (await confirmation()) === 1);
check('booking → POST function', fnCalls === 2 && fnStatuses.at(-1) === 'POST:200', fnStatuses.join(', '));

// ------------------------------------------------------------------ 3. Sponsoring (5 étapes)
await page.goto(`${BASE}/fr/sponsors`, { waitUntil: 'networkidle' });
const spForm = page.locator('form').last();
await spForm.waitFor({ timeout: 15000 });
await page.waitForTimeout(3400);

// Étape 1 (entreprise) : tenter de continuer à vide → erreur bloquante, aucun appel.
await spForm.locator('button', { hasText: 'Continuer' }).click();
await page.waitForSelector('[role=alert]', { timeout: 5000 }).catch(() => null);
check('sponsors étape 1 vide → erreurs localisées', (await page.locator('[role=alert]').count()) >= 1);
check('sponsors étape 1 vide → aucun POST', fnCalls === 2);

await spForm.getByLabel('Nom de l’entreprise').fill('Acme Corp');
await spForm.locator('input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) });
await spForm.locator('button', { hasText: 'Continuer' }).click();

// Étape 2 (contact)
await spForm.getByLabel('Nom du contact').fill('Claire Sponsor');
await spForm.locator('input[type=email]').fill('claire@acme.example');
await spForm.locator('button', { hasText: 'Continuer' }).click();

// Étape 3 (partenariat) — tout optionnel : cocher deux activités pour couvrir les chips.
await spForm.locator('input[name=activities][value=boxing]').check({ force: true });
await spForm.locator('input[name=activities][value=gym]').check({ force: true });
await spForm.locator('button', { hasText: 'Continuer' }).click();

// Étape 4 (présentation) + pièce jointe PDF.
await spForm.locator('textarea').fill('Projet de partenariat e2e avec pièce jointe.');
await spForm.locator('input[type=file]').setInputFiles({ name: 'deck.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e') });
await spForm.locator('button', { hasText: 'Continuer' }).click();

// Étape 5 (revue) : consentement + envoi.
await consent(spForm).check();
await spForm.locator('button[type=submit]').click();
await page.waitForSelector('[role=status]', { timeout: 10000 }).catch(() => null);
check('sponsors → confirmation', (await confirmation()) === 1);
check('sponsors → POST function', fnCalls === 3 && fnStatuses.at(-1) === 'POST:200', fnStatuses.join(', '));
check('sponsors → uploads signés (logo + pièce jointe)', uploads === 2, `${uploads} upload(s)`);

await browser.close();
console.log(fails.length ? `\n${fails.length} échec(s)` : '\nTous les tests des formulaires passent.');
process.exit(fails.length ? 1 : 0);
