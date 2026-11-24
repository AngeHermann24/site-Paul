import type { SponsorTier } from '@/types/domain';

/**
 * Sponsors réels de Paul, logos servis depuis `public/logos/` (récupérés sur les sites officiels).
 * Affichés tant qu'aucun sponsor réel (non DEMO) n'est actif dans l'admin.
 */
export interface LocalSponsor {
  slug: string;
  name: string;
  logo: string;
  websiteUrl: string;
  tier: SponsorTier;
}

export const LOCAL_SPONSORS: readonly LocalSponsor[] = [
  {
    slug: 'air-cote-divoire',
    name: 'Air Côte d’Ivoire',
    logo: '/logos/air-cote-divoire.png',
    websiteUrl: 'https://www.aircotedivoire.com/',
    tier: 'official',
  },
  {
    slug: 'nouvelle-parfumerie-gandour',
    name: 'Nouvelle Parfumerie Gandour',
    logo: '/logos/npg-gandour.png',
    websiteUrl: 'https://npgandour.com/fr/',
    tier: 'official',
  },
  {
    slug: 'at225',
    name: 'AT225 — Assistance Technique 225',
    logo: '/logos/at225.png',
    websiteUrl: 'https://www.assistancetechnique225.com/',
    tier: 'official',
  },
  {
    slug: 'hotel-tiama',
    name: 'Hôtel TIAMA Abidjan',
    logo: '/logos/hotel-tiama.png',
    websiteUrl: 'https://hotel.tiama.ci/',
    tier: 'official',
  },
];
