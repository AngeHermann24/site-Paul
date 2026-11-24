import { LOCAL_PRO_RECORD } from '@/config/profile';
import type { Tables } from '@/integrations/supabase/database.types';
import { publicStorageUrl } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';
import type { FightCategory, FightMethod, FightResult, FightStatus } from '@/types/domain';
import { allowDemoContent, pick, run, success, type ServiceResult } from './_shared';

export interface LocalizedImage {
  url: string;
  alt: string;
}

export interface Fight {
  id: string;
  slug: string;
  opponentName: string;
  opponentCountry: string | null;
  opponentRecord: string | null;
  eventName: string | null;
  eventDate: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  weightClass: string | null;
  category: FightCategory;
  fightStatus: FightStatus;
  result: FightResult | null;
  method: FightMethod | null;
  roundsScheduled: number | null;
  roundEnded: number | null;
  timeEnded: string | null;
  isTitleFight: boolean;
  titleName: string | null;
  summary: string | null;
  cover: LocalizedImage | null;
  videoUrl: string | null;
  ticketUrl: string | null;
  isFeatured: boolean;
}

export interface FightRecord {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  noContests: number;
  /** `null` = non communiqué (bilan officiel local). */
  koWins: number | null;
  titleFights: number | null;
}

export interface FightStats {
  overall: FightRecord;
  byCategory: Partial<Record<FightCategory, FightRecord>>;
  /** `fights` = calculé depuis les combats publiés ; `official` = bilan officiel local. */
  source: 'fights' | 'official';
}

export function mapFight(row: Tables<'fights'>, lang: Lang): Fight {
  const coverUrl = publicStorageUrl('media', row.cover_url);
  return {
    id: row.id,
    slug: row.slug,
    opponentName: row.opponent_name,
    opponentCountry: row.opponent_country,
    opponentRecord: row.opponent_record,
    eventName: row.event_name,
    eventDate: row.event_date,
    venue: row.venue,
    city: row.city,
    country: row.country,
    weightClass: row.weight_class,
    category: row.category as FightCategory,
    fightStatus: row.fight_status as FightStatus,
    result: row.result as FightResult | null,
    method: row.method as FightMethod | null,
    roundsScheduled: row.rounds_scheduled,
    roundEnded: row.round_ended,
    timeEnded: row.time_ended,
    isTitleFight: row.is_title_fight,
    titleName: row.title_name,
    summary: pick(lang, row.summary_fr, row.summary_en),
    cover: coverUrl ? { url: coverUrl, alt: pick(lang, row.cover_alt_fr, row.cover_alt_en) ?? '' } : null,
    videoUrl: row.video_url,
    ticketUrl: row.ticket_url,
    isFeatured: row.is_featured,
  };
}

/** Neutralise les caractères réservés de la syntaxe de filtre PostgREST. */
export const sanitizeSearch = (q: string) => q.replace(/[,()*%\\]/g, ' ').trim().slice(0, 80);

export interface FightFilters {
  fightStatus?: FightStatus;
  category?: FightCategory;
  result?: FightResult;
  search?: string;
  limit?: number;
  ascending?: boolean;
}

export async function listFights(lang: Lang, filters: FightFilters = {}): Promise<ServiceResult<Fight[]>> {
  const res = await run((db) => {
    let q = db.from('fights').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    if (filters.fightStatus) q = q.eq('fight_status', filters.fightStatus);
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.result) q = q.eq('result', filters.result);
    const search = filters.search ? sanitizeSearch(filters.search) : '';
    if (search) q = q.or(`opponent_name.ilike.%${search}%,event_name.ilike.%${search}%,city.ilike.%${search}%`);
    q = q.order('event_date', { ascending: filters.ascending ?? false });
    if (filters.limit) q = q.limit(filters.limit);
    return q;
  });
  return res.error ? res : success(res.data.map((r) => mapFight(r, lang)));
}

export async function getFightBySlug(lang: Lang, slug: string): Promise<ServiceResult<Fight>> {
  const res = await run((db) => {
    let q = db.from('fights').select('*').eq('status', 'published').eq('slug', slug);
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.maybeSingle();
  });
  return res.error ? res : success(mapFight(res.data, lang));
}

/** Dernier combat disputé. `data = null` si aucun. */
export async function getLatestFight(lang: Lang): Promise<ServiceResult<Fight | null>> {
  const res = await listFights(lang, { fightStatus: 'completed', limit: 1 });
  return res.error ? res : success(res.data[0] ?? null);
}

/** Prochain combat programmé (à venir). `data = null` s'il n'existe pas : la section ne s'affiche pas. */
export async function getNextFight(lang: Lang): Promise<ServiceResult<Fight | null>> {
  const today = new Date().toISOString().slice(0, 10);
  const res = await run((db) => {
    let q = db
      .from('fights')
      .select('*')
      .eq('status', 'published')
      .eq('fight_status', 'scheduled')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(1);
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q;
  });
  return res.error ? res : success(res.data[0] ? mapFight(res.data[0], lang) : null);
}

const emptyRecord = (): FightRecord => ({ total: 0, wins: 0, losses: 0, draws: 0, noContests: 0, koWins: 0, titleFights: 0 });

/** Statistiques de carrière calculées par la base (vue `fight_stats`, combats publiés uniquement). */
export async function getFightStats(): Promise<ServiceResult<FightStats>> {
  const res = await run((db) => {
    const q = db.from('fight_stats').select('*');
    return allowDemoContent ? q : q.eq('is_demo', false);
  });
  const real = res.error ? [] : res.data.filter((r) => !r.is_demo && Number(r.total ?? 0) > 0);
  if (real.length === 0) {
    const pro: FightRecord = { ...LOCAL_PRO_RECORD, noContests: 0, koWins: null, titleFights: null };
    return success({ overall: pro, byCategory: { professional: pro }, source: 'official' });
  }
  const stats: FightStats = { overall: emptyRecord(), byCategory: {}, source: 'fights' };
  for (const row of real) {
    const record: FightRecord = {
      total: Number(row.total ?? 0),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      draws: Number(row.draws ?? 0),
      noContests: Number(row.no_contests ?? 0),
      koWins: Number(row.ko_wins ?? 0),
      titleFights: Number(row.title_fights ?? 0),
    };
    if (row.category) stats.byCategory[row.category as FightCategory] = record;
    (Object.keys(record) as Array<keyof FightRecord>).forEach((k) => {
      stats.overall[k] = (stats.overall[k] ?? 0) + (record[k] ?? 0);
    });
  }
  return success(stats);
}
