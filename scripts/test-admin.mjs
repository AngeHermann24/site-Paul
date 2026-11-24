/**
 * Test E2E du back-office /admin contre la mock API (auth Supabase simulée + RLS réelle).
 *  1. /admin anonyme → redirection /admin/login
 *  2. Mauvais mot de passe → message d'erreur
 *  3. Login admin@e2e.local → dashboard (KPI demandes + contenus)
 *  4. Sidebar : groupes + liens de ressources
 *  5. /admin/demandes → onglets, ligne « Test Visiteur »
 *  6. Clic ligne → drawer : statut → « contacted » + note → Enregistré → badge mis à jour
 *  7. /admin/contenus/combats → liste DEMO ; ouverture fiche ; modif → Enregistré
 *  8. /admin/reglages → formulaire settings → Enregistré
 *  9. /admin/contenus/equipe → liste admin_users (owner)
 * 10. Déconnexion → retour login ; /admin inaccessible
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

// 1. Guard : /admin anonyme → login
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
await page.waitForSelector('input[type=email]', { timeout: 15000 }).catch(() => {});
check('guard /admin → login', page.url().includes('/admin/login'), page.url());

// 2. Mauvais mot de passe
await page.locator('input[type=email]').fill('admin@e2e.local');
await page.locator('input[type=password]').fill('mauvais');
await page.getByRole('button', { name: /connecter|sign in/i }).click();
await page.waitForSelector('[role=alert]', { timeout: 8000 }).catch(() => {});
check('mauvais mot de passe → erreur', (await page.locator('[role=alert]').count()) > 0);

// 3. Vrai login → dashboard
await page.locator('input[type=password]').fill('e2e-pass');
await page.getByRole('button', { name: /connecter|sign in/i }).click();
await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);
check('login → dashboard', page.url().match(/\/admin\/?$/) !== null, page.url());
check('dashboard KPI demandes', (await page.locator('text=/Nouvelles demandes|New requests/i').count()) > 0);
check('sidebar groupes', (await page.locator('nav p').allTextContents()).some((s) => /COMBATS|FIGHTS/i.test(s)));

// 5. Inbox
await page.goto(`${BASE}/admin/demandes`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
check('inbox onglets', (await page.getByRole('tab').count()) >= 4, String(await page.getByRole('tab').count()));
check('inbox ligne visiteur', (await page.locator('td:has-text("Test Visiteur")').count()) > 0);

// 6. Drawer : statut + note
if ((await page.locator('td:has-text("Test Visiteur")').count()) > 0) {
  await page.locator('tr', { hasText: 'Test Visiteur' }).first().click();
  await page.waitForSelector('[role=dialog]', { timeout: 5000 });
  await page.locator('[role=dialog] select').first().selectOption('contacted');
  await page.locator('[role=dialog] textarea').fill('Note interne e2e');
  await page.locator('[role=dialog] button', { hasText: /Enregistrer|Save/i }).first().click();
  await page.locator('[role=dialog] [role=status], [role=dialog] [role=alert]').first().waitFor({ timeout: 8000 }).catch(() => {});
  const ok = /Enregistré|Saved/i.test(await page.locator('[role=dialog]').innerText());
  check('drawer sauvegarde statut', ok);
  await page.locator('[role=dialog] button[aria-label]').first().click();
  await page.waitForTimeout(500);
  check('badge maj → contacted', (await page.locator('td:has-text("Contacté"), td:has-text("Contacted")').count()) > 0);
}

// 7. CRUD contenus
await page.goto(`${BASE}/admin/contenus/combats`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const fightRows = await page.locator('tbody tr').count();
check('liste combats', fightRows > 0, String(fightRows));
if (fightRows > 0) {
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(1200);
  check('formulaire édition', (await page.locator('form input, form select, form textarea').count()) > 10);
  await page.getByRole('button', { name: /^Enregistrer$|^Save$/i }).click();
  await page.locator('form [role=status], form [role=alert]').first().waitFor({ timeout: 8000 }).catch(() => {});
  const saved = (await page.locator('[role=status]').allTextContents()).join(' ');
  check('édition enregistrée', /Enregistré|Saved/i.test(saved), saved.slice(0, 60));
}

// 8. Réglages
await page.goto(`${BASE}/admin/reglages`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const settingsInputs = await page.locator('form input, form textarea, form select').count();
check('formulaire réglages', settingsInputs > 10, String(settingsInputs));
await page.getByRole('button', { name: /^Enregistrer$|^Save$/i }).click();
await page.locator('form [role=status], form [role=alert]').first().waitFor({ timeout: 8000 }).catch(() => {});
const saved2 = (await page.locator('[role=status]').allTextContents()).join(' ');
check('réglages enregistrés', /Enregistré|Saved/i.test(saved2), saved2.slice(0, 60));

// 9. Équipe (owner)
await page.goto(`${BASE}/admin/contenus/equipe`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
check('équipe admin', (await page.locator('td:has-text("admin@e2e.local")').count()) > 0);

// 10. Déconnexion
await page.getByRole('button', { name: /déconnecter|sign out/i }).click();
await page.waitForTimeout(1500);
check('logout → login', page.url().includes('/admin/login'), page.url());
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
check('guard post-logout', page.url().includes('/admin/login'), page.url());

await browser.close();
console.log(fails.length ? `\n${fails.length} échec(s) : ${fails.join(', ')}` : '\nTous les checks admin passent.');
process.exit(fails.length ? 1 : 0);
