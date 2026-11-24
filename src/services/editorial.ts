/**
 * Contenus éditoriaux simples : palmarès, performance, gym, commentateur.
 * Tous filtrés sur `status = published` (doublé par la RLS) et hors DEMO en production.
 */
import { GYM_CLASSES } from '@/config/gym';
import { LOCAL_ACHIEVEMENTS } from '@/config/profile';
import { publicStorageUrl } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';
import type {
  AchievementKind,
  BillingPeriod,
  CommentaryRole,
  GymServiceKind,
  Level,
  PerformanceCategory,
} from '@/types/domain';
import { allowDemoContent, pick, run, success, type ServiceResult } from './_shared';
import type { LocalizedImage } from './fights';

const image = (lang: Lang, url: string | null, altFr: string | null, altEn: string | null): LocalizedImage | null => {
  const resolved = publicStorageUrl('media', url);
  return resolved ? { url: resolved, alt: pick(lang, altFr, altEn) ?? '' } : null;
};

// --------------------------------------------------------------- Palmarès
export interface Achievement {
  id: string;
  kind: AchievementKind;
  title: string;
  description: string | null;
  organization: string | null;
  achievedOn: string | null;
  year: number | null;
  fightId: string | null;
  image: LocalizedImage | null;
  showInTimeline: boolean;
}

export async function listAchievements(lang: Lang, opts: { timelineOnly?: boolean } = {}): Promise<ServiceResult<Achievement[]>> {
  const res = await run((db) => {
    let q = db.from('achievements').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    if (opts.timelineOnly) q = q.eq('show_in_timeline', true);
    return q.order('year', { ascending: true, nullsFirst: false }).order('achieved_on', { ascending: true }).order('sort_order');
  });
  const real = res.error ? [] : res.data.filter((r) => !r.is_demo);
  if (real.length === 0) {
    return success(
      opts.timelineOnly
        ? []
        : LOCAL_ACHIEVEMENTS.map((a) => ({
            id: a.id,
            kind: a.kind,
            title: a.title[lang],
            description: a.description?.[lang] ?? null,
            organization: a.organization,
            achievedOn: null,
            year: null,
            fightId: null,
            image: null,
            showInTimeline: false,
          })),
    );
  }
  return success(
    real.map((r) => ({
      id: r.id,
      kind: r.kind as AchievementKind,
      title: pick(lang, r.title_fr, r.title_en),
      description: pick(lang, r.description_fr, r.description_en),
      organization: r.organization,
      achievedOn: r.achieved_on,
      year: r.year ?? (r.achieved_on ? Number(r.achieved_on.slice(0, 4)) : null),
      fightId: r.fight_id,
      image: image(lang, r.image_url, r.image_alt_fr, r.image_alt_en),
      showInTimeline: r.show_in_timeline,
    })),
  );
}

// --------------------------------------------------------------- Performance
export interface PerformanceContent {
  id: string;
  slug: string;
  category: PerformanceCategory;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover: LocalizedImage | null;
  videoUrl: string | null;
}

export async function listPerformanceContents(
  lang: Lang,
  category?: PerformanceCategory,
): Promise<ServiceResult<PerformanceContent[]>> {
  const res = await run((db) => {
    let q = db.from('performance_contents').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    if (category) q = q.eq('category', category);
    return q.order('sort_order').order('published_at', { ascending: false });
  });
  if (res.error) return res;
  return success(
    res.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      category: r.category as PerformanceCategory,
      title: pick(lang, r.title_fr, r.title_en),
      excerpt: pick(lang, r.excerpt_fr, r.excerpt_en),
      body: pick(lang, r.body_fr, r.body_en),
      cover: image(lang, r.cover_url, r.cover_alt_fr, r.cover_alt_en),
      videoUrl: r.video_url,
    })),
  );
}

// --------------------------------------------------------------- Gym
export interface GymService {
  id: string;
  slug: string;
  kind: GymServiceKind;
  title: string;
  description: string | null;
  level: Level;
  image: LocalizedImage | null;
}

export interface GymCoach {
  id: string;
  slug: string;
  fullName: string;
  role: string | null;
  bio: string | null;
  specialties: string[];
  photo: LocalizedImage | null;
  instagramUrl: string | null;
}

export interface GymScheduleSlot {
  id: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  label: string;
  coachName: string | null;
  /** `null` = niveau non précisé (horaires locaux). */
  level: Level | null;
  room: string | null;
  capacity: number | null;
  notes: string | null;
}

export interface GymMembership {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** `null` = tarif sur demande (jamais inventé). */
  priceCents: number | null;
  currency: string;
  billingPeriod: BillingPeriod;
  features: string[];
  isFeatured: boolean;
}

export async function listGymServices(lang: Lang, kind?: GymServiceKind): Promise<ServiceResult<GymService[]>> {
  const res = await run((db) => {
    let q = db.from('gym_services').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    if (kind) q = q.eq('kind', kind);
    return q.order('sort_order');
  });
  if (res.error) return res;
  return success(
    res.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      kind: r.kind as GymServiceKind,
      title: pick(lang, r.title_fr, r.title_en),
      description: pick(lang, r.description_fr, r.description_en),
      level: r.level as Level,
      image: image(lang, r.image_url, r.image_alt_fr, r.image_alt_en),
    })),
  );
}

export async function listGymCoaches(lang: Lang): Promise<ServiceResult<GymCoach[]>> {
  const res = await run((db) => {
    let q = db.from('gym_coaches').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.order('sort_order');
  });
  if (res.error) return res;
  return success(
    res.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      fullName: r.full_name,
      role: pick(lang, r.role_fr, r.role_en),
      bio: pick(lang, r.bio_fr, r.bio_en),
      specialties: r.specialties,
      photo: image(lang, r.photo_url, r.photo_alt_fr, r.photo_alt_en),
      instagramUrl: r.instagram_url,
    })),
  );
}

function localGymSchedule(lang: Lang): GymScheduleSlot[] {
  return GYM_CLASSES.flatMap((c) =>
    c.slots.flatMap((s) =>
      s.days.map((day) => ({
        id: `${c.id}-${day}-${s.startsAt}`,
        dayOfWeek: day,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        label: c.label[lang],
        coachName: null,
        level: null,
        room: null,
        capacity: null,
        notes: null,
      })),
    ),
  ).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startsAt.localeCompare(b.startsAt));
}

export async function listGymSchedules(lang: Lang): Promise<ServiceResult<GymScheduleSlot[]>> {
  const res = await run((db) => {
    let q = db
      .from('gym_schedules')
      .select('*, service:gym_services(title_fr, title_en), coach:gym_coaches(full_name)')
      .eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.order('day_of_week').order('starts_at');
  });
  const real = res.error ? [] : res.data.filter((r) => !r.is_demo);
  if (real.length === 0) return success(localGymSchedule(lang));
  return success(
    real.map((r) => ({
      id: r.id,
      dayOfWeek: r.day_of_week,
      startsAt: r.starts_at.slice(0, 5),
      endsAt: r.ends_at.slice(0, 5),
      label: pick(lang, r.label_fr, r.label_en) ?? (r.service ? pick(lang, r.service.title_fr, r.service.title_en) : ''),
      coachName: r.coach?.full_name ?? null,
      level: r.level as Level,
      room: r.room,
      capacity: r.capacity,
      notes: pick(lang, r.notes_fr, r.notes_en),
    })),
  );
}

export async function listGymMemberships(lang: Lang): Promise<ServiceResult<GymMembership[]>> {
  const res = await run((db) => {
    let q = db.from('gym_memberships').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.order('sort_order');
  });
  if (res.error) return res;
  return success(
    res.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: pick(lang, r.name_fr, r.name_en),
      description: pick(lang, r.description_fr, r.description_en),
      priceCents: r.price_cents,
      currency: r.currency,
      billingPeriod: r.billing_period as BillingPeriod,
      features: pick(lang, r.features_fr, r.features_en),
      isFeatured: r.is_featured,
    })),
  );
}

// --------------------------------------------------------------- Commentateur
export interface CommentaryEvent {
  id: string;
  slug: string;
  eventName: string;
  eventDate: string | null;
  promotion: string | null;
  broadcaster: string | null;
  role: CommentaryRole;
  discipline: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  cover: LocalizedImage | null;
  videoUrl: string | null;
  audioUrl: string | null;
  isFeatured: boolean;
}

export interface CommentaryService {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  deliverables: string[];
}

export async function listCommentaryEvents(lang: Lang, opts: { limit?: number } = {}): Promise<ServiceResult<CommentaryEvent[]>> {
  const res = await run((db) => {
    let q = db.from('commentary_events').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    q = q.order('event_date', { ascending: false, nullsFirst: false });
    return opts.limit ? q.limit(opts.limit) : q;
  });
  if (res.error) return res;
  return success(
    res.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      eventName: r.event_name,
      eventDate: r.event_date,
      promotion: r.promotion,
      broadcaster: r.broadcaster,
      role: r.role as CommentaryRole,
      discipline: r.discipline,
      city: r.city,
      country: r.country,
      description: pick(lang, r.description_fr, r.description_en),
      cover: image(lang, r.cover_url, r.cover_alt_fr, r.cover_alt_en),
      videoUrl: r.video_url,
      audioUrl: r.audio_url,
      isFeatured: r.is_featured,
    })),
  );
}

export async function listCommentaryServices(lang: Lang): Promise<ServiceResult<CommentaryService[]>> {
  const res = await run((db) => {
    let q = db.from('commentary_services').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.order('sort_order');
  });
  if (res.error) return res;
  return success(
    res.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: pick(lang, r.title_fr, r.title_en),
      description: pick(lang, r.description_fr, r.description_en),
      deliverables: pick(lang, r.deliverables_fr, r.deliverables_en),
    })),
  );
}
