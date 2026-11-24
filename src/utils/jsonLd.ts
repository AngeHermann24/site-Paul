import type { ArticleSummary } from '@/services/articles';
import type { Profile } from '@/services/profile';
import type { SiteSettings } from '@/services/settings';
import { env } from './env';

const origin = () => env.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');

/** JSON-LD Person : uniquement les champs réellement renseignés en base. */
export function personJsonLd(profile: Profile | null, settings: SiteSettings | null): Record<string, unknown> {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile?.displayName ?? 'PAUL',
    url: origin(),
    jobTitle: ['Boxer', 'Gym owner', 'Sports commentator'],
  };
  if (profile?.fullName) data.alternateName = profile.fullName;
  if (profile?.nationality) data.nationality = profile.nationality;
  if (profile?.portrait) data.image = profile.portrait.url;
  if (profile?.bioShort) data.description = profile.bioShort;
  const sameAs = settings?.socials.map((s) => s.url) ?? [];
  if (sameAs.length) data.sameAs = sameAs;
  return data;
}

/** JSON-LD SportsOrganization (Paul Gym) : adresse uniquement si renseignée. */
export function gymJsonLd(settings: SiteSettings | null, pageUrl: string): Record<string, unknown> {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: settings?.gym.name ?? 'Paul Gym',
    url: pageUrl,
    sport: 'Boxing',
  };
  const g = settings?.gym;
  if (g?.address || g?.city) {
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: g.address ?? undefined,
      postalCode: g.postalCode ?? undefined,
      addressLocality: g.city ?? undefined,
      addressCountry: g.country ?? undefined,
    };
  }
  if (g?.latitude != null && g.longitude != null) {
    data.geo = { '@type': 'GeoCoordinates', latitude: g.latitude, longitude: g.longitude };
  }
  if (settings?.contactPhone) data.telephone = settings.contactPhone;
  return data;
}

export function articleJsonLd(
  article: ArticleSummary & { updatedAt: string; seoDescription: string | null },
  pageUrl: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seoDescription ?? article.excerpt ?? undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: article.cover ? [article.cover.url] : undefined,
    author: article.authorName ? { '@type': 'Person', name: article.authorName } : { '@type': 'Organization', name: 'PAUL' },
    mainEntityOfPage: pageUrl,
  };
}
