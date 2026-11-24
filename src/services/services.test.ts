/**
 * Vérifie la couche services : requêtes PostgREST réellement construites par supabase-js
 * (filtres publiés, exclusion DEMO en prod, recherche plein texte, insert sans select)
 * et mapping bilingue. Le réseau est remplacé par un fetch simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/env', () => ({
  env: { siteUrl: '', supabaseUrl: 'https://demo-project.supabase.co', supabaseAnonKey: 'anon-test-key', turnstileSiteKey: '' },
  isSupabaseConfigured: true,
}));

interface Captured {
  method: string;
  url: URL;
  body: unknown;
  headers: Headers;
}

let calls: Captured[] = [];
let nextBody: unknown = [];
let nextStatus = 200;

beforeEach(() => {
  calls = [];
  nextBody = [];
  nextStatus = 200;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      calls.push({
        method: init?.method ?? 'GET',
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
        headers: new Headers(init?.headers),
      });
      return new Response(nextStatus === 204 ? null : JSON.stringify(nextBody), {
        status: nextStatus,
        headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const fightRow = {
  id: '1',
  slug: 'combat-1',
  opponent_name: 'Opponent',
  opponent_country: null,
  opponent_record: null,
  event_name: 'Gala',
  event_date: '2025-01-01',
  venue: null,
  city: null,
  country: null,
  weight_class: null,
  category: 'professional',
  fight_status: 'completed',
  result: 'win',
  method: 'ko',
  rounds_scheduled: 8,
  round_ended: 3,
  time_ended: '2:14',
  is_title_fight: false,
  title_name: null,
  summary_fr: 'Résumé',
  summary_en: 'Summary',
  cover_url: 'fights/cover.jpg',
  cover_alt_fr: 'Photo FR',
  cover_alt_en: 'Photo EN',
  video_url: null,
  ticket_url: null,
  is_featured: false,
  status: 'published',
  is_demo: false,
  created_at: '',
  updated_at: '',
  created_by: null,
};

describe('services/fights', () => {
  it('ne demande que le contenu publié, trié, et mappe la langue', async () => {
    nextBody = [fightRow];
    const { listFights } = await import('./fights');
    const res = await listFights('en', { fightStatus: 'completed', search: 'opp,(x)' });

    expect(res.error).toBeNull();
    expect(res.data?.[0]).toMatchObject({
      summary: 'Summary',
      result: 'win',
      cover: { url: 'https://demo-project.supabase.co/storage/v1/object/public/media/fights/cover.jpg', alt: 'Photo EN' },
    });
    const { url, headers } = calls[0]!;
    expect(url.pathname).toBe('/rest/v1/fights');
    expect(url.searchParams.get('status')).toBe('eq.published');
    expect(url.searchParams.get('fight_status')).toBe('eq.completed');
    expect(url.searchParams.get('order')).toBe('event_date.desc');
    // caractères réservés neutralisés dans le filtre `or`
    expect(url.searchParams.get('or')).toBe('(opponent_name.ilike.%opp  x%,event_name.ilike.%opp  x%,city.ilike.%opp  x%)');
    expect(headers.get('apikey')).toBe('anon-test-key');
  });

  it('renvoie null quand aucun prochain combat (section masquée)', async () => {
    nextBody = [];
    const { getNextFight } = await import('./fights');
    const res = await getNextFight('fr');
    expect(res).toEqual({ data: null, error: null });
    expect(calls[0]!.url.searchParams.get('fight_status')).toBe('eq.scheduled');
  });

  it('agrège les statistiques uniquement depuis la vue fight_stats', async () => {
    nextBody = [
      { category: 'professional', is_demo: false, total: 3, wins: 2, losses: 1, draws: 0, no_contests: 0, ko_wins: 1, title_fights: 0 },
      { category: 'amateur', is_demo: false, total: 2, wins: 1, losses: 0, draws: 1, no_contests: 0, ko_wins: 0, title_fights: 0 },
    ];
    const { getFightStats } = await import('./fights');
    const res = await getFightStats();
    expect(calls[0]!.url.pathname).toBe('/rest/v1/fight_stats');
    expect(res.data?.overall).toMatchObject({ total: 5, wins: 3, losses: 1, draws: 1, koWins: 1 });
    expect(res.data?.byCategory.professional?.wins).toBe(2);
  });
});

describe('services/articles', () => {
  it('recherche plein texte dans la langue courante (config french)', async () => {
    nextBody = [];
    const { listArticles } = await import('./articles');
    await listArticles('fr', { search: 'entraînement', page: 1, pageSize: 6 });
    const { url } = calls[0]!;
    expect(url.searchParams.get('search_fr')).toBe('wfts(french).entraînement');
    expect(url.searchParams.get('status')).toBe('eq.published');
    // page 1, 6 par page → éléments 6 à 11
    expect(url.searchParams.get('offset')).toBe('6');
    expect(url.searchParams.get('limit')).toBe('6');
  });
});

describe('services/requests', () => {
  it('fait un INSERT sans demander la ligne en retour (aucun SELECT public)', async () => {
    nextStatus = 201;
    nextBody = null;
    const { submitContactMessage } = await import('./requests');
    const res = await submitContactMessage({
      type: 'media',
      full_name: 'Jean',
      email: 'jean@example.com',
      subject: 'Sujet',
      message: 'Un message assez long',
      consent: true,
      locale: 'fr',
    });
    expect(res.error).toBeNull();
    const { method, url, headers, body } = calls[0]!;
    expect(method).toBe('POST');
    expect(url.pathname).toBe('/rest/v1/contact_messages');
    expect(url.searchParams.has('select')).toBe(false);
    expect(headers.get('prefer') ?? '').not.toContain('return=representation');
    expect(body).toMatchObject({ email: 'jean@example.com', consent: true });
  });

  it('traduit l’erreur anti-spam de la base en rate_limited', async () => {
    nextStatus = 400;
    nextBody = { code: 'P0001', message: 'RATE_LIMITED', details: null, hint: 'Trop de demandes' };
    const { submitBookingRequest } = await import('./requests');
    const res = await submitBookingRequest({
      organizer_name: 'Org',
      email: 'o@example.com',
      event_name: 'Gala',
      message: 'Bonjour, booking ?',
      consent: true,
    });
    expect(res.error?.kind).toBe('rate_limited');
  });
});

describe('services/sponsors', () => {
  it('liste uniquement les sponsors actifs, mis en avant d’abord', async () => {
    nextBody = [];
    const { listActiveSponsors } = await import('./sponsors');
    await listActiveSponsors('fr');
    const { url } = calls[0]!;
    expect(url.searchParams.get('is_active')).toBe('eq.true');
    expect(url.searchParams.get('order')).toBe('is_featured.desc,sort_order.asc');
  });
});
