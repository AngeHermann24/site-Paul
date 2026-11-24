import { LOCAL_PROFILE } from '@/config/profile';
import { publicStorageUrl } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';
import { allowDemoContent, pick, run, success, type ServiceResult } from './_shared';
import type { LocalizedImage } from './fights';

export interface Profile {
  displayName: string;
  fullName: string | null;
  nickname: string | null;
  headline: string | null;
  bioShort: string | null;
  bio: string | null;
  beginnings: string | null;
  journey: string | null;
  philosophy: string | null;
  discipline: string | null;
  commentatorBio: string | null;
  nationality: string | null;
  hometown: string | null;
  birthDate: string | null;
  weightClass: string | null;
  stance: 'orthodox' | 'southpaw' | 'switch' | null;
  heightCm: number | null;
  reachCm: number | null;
  portrait: LocalizedImage | null;
}

function localProfile(lang: Lang): Profile {
  const p = LOCAL_PROFILE;
  return {
    displayName: p.displayName,
    fullName: p.fullName,
    nickname: p.nickname[lang],
    headline: p.headline[lang],
    bioShort: p.bioShort[lang],
    bio: p.bio[lang],
    beginnings: null,
    journey: null,
    philosophy: null,
    discipline: p.discipline[lang],
    commentatorBio: p.commentatorBio[lang],
    nationality: null,
    hometown: null,
    birthDate: null,
    weightClass: p.weightClass,
    stance: null,
    heightCm: null,
    reachCm: null,
    portrait: null,
  };
}

/** Profil public de Paul (slug `paul`) ; repli sur la bio locale si aucun profil réel n'est publié. */
export async function getProfile(lang: Lang): Promise<ServiceResult<Profile | null>> {
  const res = await run((db) => {
    let q = db.from('profiles').select('*').eq('status', 'published').eq('slug', 'paul').limit(1);
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q;
  });
  const row = res.error ? undefined : res.data.find((r) => !r.is_demo);
  if (!row) return success(localProfile(lang));
  const portraitUrl = publicStorageUrl('media', row.portrait_url);
  return success({
    displayName: row.display_name,
    fullName: row.full_name,
    nickname: row.nickname,
    headline: pick(lang, row.headline_fr, row.headline_en),
    bioShort: pick(lang, row.bio_short_fr, row.bio_short_en),
    bio: pick(lang, row.bio_fr, row.bio_en),
    beginnings: pick(lang, row.beginnings_fr, row.beginnings_en),
    journey: pick(lang, row.journey_fr, row.journey_en),
    philosophy: pick(lang, row.philosophy_fr, row.philosophy_en),
    discipline: pick(lang, row.discipline_fr, row.discipline_en),
    commentatorBio: pick(lang, row.commentator_bio_fr, row.commentator_bio_en),
    nationality: row.nationality,
    hometown: row.hometown,
    birthDate: row.birth_date,
    weightClass: row.weight_class,
    stance: row.stance as Profile['stance'],
    heightCm: row.height_cm,
    reachCm: row.reach_cm,
    portrait: portraitUrl ? { url: portraitUrl, alt: pick(lang, row.portrait_alt_fr, row.portrait_alt_en) ?? '' } : null,
  });
}
