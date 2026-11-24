/**
 * Test fonctionnel du formulaire de contact contre la mock API.
 * 1. ?type=gym présélectionne le chip « Paul Gym »
 * 2. Envoi <3 s après affichage → succès simulé, aucun appel réseau (piège temporel)
 * 3. Formulaire vide (après délai) → erreurs localisées, aucun appel réseau
 * 4. Honeypot rempli → confirmation simulée, aucun appel réseau
 * 5. Envoi légitime → POST /functions/v1/submit-request 200 (mock de l'Edge Function,
 *    insertion en « service_role » — le trigger anti-spam reste actif) + confirmation
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
const fnStatuses = [];
page.on('request', (r) => {
  if (r.method() === 'POST' && r.url().includes('/functions/v1/submit-request')) fnCalls += 1;
});
page.on('response', (r) => {
  if (r.url().includes('/functions/v1/submit-request')) fnStatuses.push(`${r.request().method()}:${r.status()}`);
});

const isSent = () => page.locator('[role=status]').count();
const alerts = () => page.locator('[role=alert]').count();

const fillHoneypot = (value) =>
  page.evaluate((v) => {
    const el = document.querySelector('form [aria-hidden] input');
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, value);

async function fillValidForm() {
  await page.locator('input[name=fullName]').fill('Jean Test');
  await page.locator('input[name=email]').fill('jean.test@example.com');
  await page.locator('input[name=subject]').fill('Demande de test e2e');
  await page.locator('textarea[name=message]').fill('Ceci est un message de test suffisamment long.');
  await page.locator('input[type=checkbox]:not(.sr-only)').check();
}

await page.goto(`${BASE}/fr/contact?type=gym`, { waitUntil: 'networkidle' });
await page.waitForSelector('form', { timeout: 15000 });
check('préselection ?type=gym', await page.locator('input[type=radio][value=gym]').isChecked());

// 2. Soumission immédiate (<3 s) → piège temporel : succès simulé, zéro INSERT
await page.locator('button[type=submit]').click();
await page.waitForSelector('[role=status]', { timeout: 5000 }).catch(() => null);
check('envoi <3s → succès simulé (piège temporel)', (await isSent()) === 1);
check('envoi <3s → aucun INSERT', fnCalls === 0);

// Retour au formulaire
await page.locator('button', { hasText: 'Envoyer un autre message' }).click();
await page.waitForSelector('form', { timeout: 5000 });
await page.waitForTimeout(3400); // délai anti-spam dépassé

// 3. Formulaire vide → validation localisée, aucun INSERT
await page.locator('button[type=submit]').click();
await page.waitForSelector('[role=alert]', { timeout: 5000 }).catch(() => null);
check('validation bloque le formulaire vide', (await alerts()) >= 4, `${await alerts()} alertes`);
check('aucun POST sur formulaire invalide', fnCalls === 0);

// 4. Honeypot → succès simulé sans INSERT
check('honeypot rempli', await fillHoneypot('http://spam.example'));
await fillValidForm();
await page.locator('button[type=submit]').click();
await page.waitForSelector('[role=status]', { timeout: 5000 }).catch(() => null);
check('honeypot → confirmation simulée', (await isSent()) === 1);
check('honeypot → aucun INSERT', fnCalls === 0, `${fnCalls} POST`);

// 5. Envoi légitime → POST 201 via RLS + confirmation
await page.locator('button', { hasText: 'Envoyer un autre message' }).click();
await page.waitForSelector('form', { timeout: 5000 });
await page.waitForTimeout(3400);
await fillValidForm();
await page.locator('button[type=submit]').click();
await page.waitForSelector('[role=status]', { timeout: 8000 }).catch(() => null);
check('envoi légitime → confirmation', (await isSent()) === 1);
check('envoi via Edge Function (POST → 200)', fnCalls === 1 && fnStatuses.includes('POST:200'), `${fnCalls} POST — ${fnStatuses.join(', ')}`);

await browser.close();
console.log(fails.length ? `\n${fails.length} échec(s)` : '\nTous les tests du formulaire passent.');
process.exit(fails.length ? 1 : 0);
