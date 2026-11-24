/**
 * Génère `public/sitemap.xml` — routes statiques FR/EN + contenus publiés
 * (combats, articles) si l'API Supabase est configurée.
 * Usage : `VITE_SITE_URL=https://paul-xxx.com node scripts/gen-sitemap.mjs`
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
// Charge VITE_SITE_URL depuis l'env, sinon .env.local / .env.production
let siteUrl = process.env.VITE_SITE_URL;
for (const f of ['.env.production', '.env.local', '.env']) {
  if (siteUrl) break;
  try {
    const m = readFileSync(resolve(root, f), 'utf8').match(/^VITE_SITE_URL=(.+)$/m);
    if (m) siteUrl = m[1].trim();
  } catch {
    /* absent */
  }
}
if (!siteUrl) {
  console.error('VITE_SITE_URL manquant — le renseigner dans .env.local ou l’environnement.');
  process.exit(1);
}
const base = siteUrl.replace(/\/+$/, '');

const STATIC_ROUTES = ['', 'champion', 'combats', 'performance', 'gym', 'commentateur', 'actualites', 'medias', 'sponsors', 'contact', 'mentions-legales', 'confidentialite', 'cookies'];
const langs = ['fr', 'en'];
const today = new Date().toISOString().slice(0, 10);

const urls = [];
for (const lang of langs) {
  for (const route of STATIC_ROUTES) {
    const path = `/${lang}${route ? `/${route}` : ''}`;
    urls.push({ loc: `${base}${path}`, lastmod: today });
  }
}

// Contenus dynamiques publiés (facultatif — API configurée uniquement)
let apiUrl = process.env.VITE_SUPABASE_URL;
let anonKey = process.env.VITE_SUPABASE_ANON_KEY;
for (const f of ['.env.production', '.env.local', '.env']) {
  try {
    const env = readFileSync(resolve(root, f), 'utf8');
    apiUrl ??= env.match(/^VITE_SUPABASE_URL=(.+)$/m)?.[1].trim();
    anonKey ??= env.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m)?.[1].trim();
  } catch {
    /* absent */
  }
}
if (apiUrl && anonKey) {
  const headers = { apikey: anonKey, authorization: `Bearer ${anonKey}` };
  const fetchSlugs = async (table, select) => {
    const r = await fetch(`${apiUrl}/rest/v1/${table}?select=${select}&status=eq.published&is_demo=not.is.true`, { headers });
    return r.ok ? await r.json() : [];
  };
  for (const f of await fetchSlugs('fights', 'slug,updated_at')) {
    for (const lang of langs) urls.push({ loc: `${base}/${lang}/combats/${f.slug}`, lastmod: f.updated_at?.slice(0, 10) });
  }
  for (const a of await fetchSlugs('articles', 'slug,updated_at')) {
    for (const lang of langs) urls.push({ loc: `${base}/${lang}/actualites/${a.slug}`, lastmod: a.updated_at?.slice(0, 10) });
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
writeFileSync(resolve(root, 'public/sitemap.xml'), xml);
console.log(`sitemap.xml : ${urls.length} URLs (${base})`);
