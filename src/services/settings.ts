import type { Tables } from '@/integrations/supabase/database.types';
import { publicStorageUrl } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';
import type { AudienceMetric } from '@/types/domain';
import { pick, run, success, type ServiceResult } from './_shared';

export interface SocialLink {
  network: 'instagram' | 'youtube' | 'tiktok' | 'x' | 'facebook' | 'linkedin';
  url: string;
}

export interface SiteSettings {
  siteName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  bookingEmail: string | null;
  gym: {
    name: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    mapsUrl: string | null;
    openingHours: string | null;
    story: string | null;
    heroVideo: string | null;
    heroPoster: string | null;
  };
  socials: SocialLink[];
  seo: { title: string | null; description: string | null; ogImage: string | null };
  logoUrl: string | null;
  hero: { mp4: string | null; webm: string | null; mobile: string | null; poster: string | null };
  audience: Array<{ label: string; value: string; source: string | null; verifiedOn: string | null }>;
  legal: { notice: string | null; privacy: string | null; cookies: string | null };
}

const SOCIALS: Array<[SocialLink['network'], keyof Tables<'site_settings'>]> = [
  ['instagram', 'instagram_url'],
  ['youtube', 'youtube_url'],
  ['tiktok', 'tiktok_url'],
  ['x', 'x_url'],
  ['facebook', 'facebook_url'],
  ['linkedin', 'linkedin_url'],
];

const isAudienceMetric = (v: unknown): v is AudienceMetric =>
  typeof v === 'object' && v !== null && 'label_fr' in v && 'label_en' in v && 'value' in v;

export function mapSettings(row: Tables<'site_settings'>, lang: Lang): SiteSettings {
  const media = (p: string | null) => publicStorageUrl('media', p);
  const audience = Array.isArray(row.audience_metrics) ? (row.audience_metrics as unknown[]).filter(isAudienceMetric) : [];
  return {
    siteName: row.site_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    bookingEmail: row.booking_email,
    gym: {
      name: row.gym_name,
      address: row.gym_address,
      postalCode: row.gym_postal_code,
      city: row.gym_city,
      country: row.gym_country,
      latitude: row.gym_latitude,
      longitude: row.gym_longitude,
      mapsUrl: row.gym_maps_url,
      openingHours: pick(lang, row.gym_opening_hours_fr, row.gym_opening_hours_en),
      story: pick(lang, row.gym_story_fr, row.gym_story_en),
      heroVideo: media(row.gym_hero_video_url),
      heroPoster: media(row.gym_hero_poster_url),
    },
    socials: SOCIALS.flatMap(([network, key]) => {
      const url = row[key];
      return typeof url === 'string' && url ? [{ network, url }] : [];
    }),
    seo: {
      title: pick(lang, row.seo_title_fr, row.seo_title_en),
      description: pick(lang, row.seo_description_fr, row.seo_description_en),
      ogImage: media(row.og_image_url),
    },
    logoUrl: publicStorageUrl('logos', row.logo_url),
    hero: {
      mp4: media(row.hero_video_mp4_url),
      webm: media(row.hero_video_webm_url),
      mobile: media(row.hero_video_mobile_url),
      poster: media(row.hero_poster_url),
    },
    audience: audience.map((m) => ({
      label: pick(lang, m.label_fr, m.label_en),
      value: m.value,
      source: m.source ?? null,
      verifiedOn: m.verified_on ?? null,
    })),
    legal: {
      notice: pick(lang, row.legal_notice_fr, row.legal_notice_en),
      privacy: pick(lang, row.privacy_policy_fr, row.privacy_policy_en),
      cookies: pick(lang, row.cookies_policy_fr, row.cookies_policy_en),
    },
  };
}

export async function getSiteSettings(lang: Lang): Promise<ServiceResult<SiteSettings>> {
  const res = await run((db) => db.from('site_settings').select('*').limit(1).maybeSingle());
  return res.error ? res : success(mapSettings(res.data, lang));
}
