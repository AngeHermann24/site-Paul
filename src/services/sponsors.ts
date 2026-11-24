import { LOCAL_SPONSORS } from '@/config/sponsors';
import { publicStorageUrl } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';
import type { SponsorTier } from '@/types/domain';
import { allowDemoContent, pick, run, success, type ServiceResult } from './_shared';

export interface Sponsor {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: SponsorTier;
  description: string | null;
  isFeatured: boolean;
}

export interface SponsorshipPackage {
  id: string;
  slug: string;
  tier: SponsorTier;
  name: string;
  description: string | null;
  benefits: string[];
  /** `null` = sur demande. */
  priceCents: number | null;
  currency: string;
  isFeatured: boolean;
}

/** Ordre d'affichage des catégories (du plus fort au plus spécialisé). */
export const SPONSOR_TIER_ORDER: readonly SponsorTier[] = ['main', 'gold', 'silver', 'official', 'technical', 'media', 'event'];

/** Sponsors actifs (la RLS filtre aussi la période de validité), ordonnés, mis en avant en premier. */
export async function listActiveSponsors(lang: Lang): Promise<ServiceResult<Sponsor[]>> {
  const res = await run((db) => {
    let q = db.from('sponsors').select('*').eq('is_active', true);
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.order('is_featured', { ascending: false }).order('sort_order');
  });
  const real = res.error ? [] : res.data.filter((r) => !r.is_demo);
  if (real.length === 0) {
    return success(
      LOCAL_SPONSORS.map((s) => ({
        id: `local-${s.slug}`,
        slug: s.slug,
        name: s.name,
        logoUrl: s.logo,
        websiteUrl: s.websiteUrl,
        tier: s.tier,
        description: null,
        isFeatured: false,
      })),
    );
  }
  return success(
    real.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      logoUrl: r.logo_url ?? publicStorageUrl('logos', r.logo_path),
      websiteUrl: r.website_url,
      tier: r.tier as SponsorTier,
      description: pick(lang, r.description_fr, r.description_en),
      isFeatured: r.is_featured,
    })),
  );
}

export async function listSponsorshipPackages(lang: Lang): Promise<ServiceResult<SponsorshipPackage[]>> {
  const res = await run((db) => {
    let q = db.from('sponsorship_packages').select('*').eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.order('sort_order');
  });
  if (res.error) return res;
  return success(
    res.data.map((r) => ({
      id: r.id,
      slug: r.slug,
      tier: r.tier as SponsorTier,
      name: pick(lang, r.name_fr, r.name_en),
      description: pick(lang, r.description_fr, r.description_en),
      benefits: pick(lang, r.benefits_fr, r.benefits_en),
      priceCents: r.price_cents,
      currency: r.currency,
      isFeatured: r.is_featured,
    })),
  );
}
