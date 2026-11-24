import type { AchievementKind } from '@/types/domain';

/**
 * Biographie et palmarès réels de Paul. Affichés tant qu'aucun profil / palmarès
 * réel (non DEMO) n'est publié depuis l'admin.
 */
type L = { fr: string; en: string };

export const LOCAL_PROFILE = {
  displayName: 'PAUL',
  fullName: 'Paul Kouame Yao',
  nickname: { fr: 'La Légende', en: 'The Legend' } satisfies L,
  weightClass: '79 kg',
  headline: {
    fr: 'Boxeur professionnel international — 79 kg',
    en: 'International professional boxer — 79 kg',
  } satisfies L,
  bioShort: {
    fr: 'Boxeur professionnel et multiple champion dans les sports de combat, Paul « La Légende » repousse ses limites depuis plus de 17 ans pour faire rayonner la Côte d’Ivoire sur la scène internationale.',
    en: 'Professional boxer and multiple combat sports champion, Paul “The Legend” has been pushing his limits for more than 17 years to make Côte d’Ivoire shine on the international stage.',
  } satisfies L,
  bio: {
    fr: '**Paul « La Légende » Kouame Yao**, boxeur professionnel international (79 kg).\n\nBoxeur professionnel et multiple champion dans les sports de combat, Paul « La Légende » repousse ses limites depuis plus de 17 ans pour faire rayonner la Côte d’Ivoire sur la scène internationale.\n\nEn parallèle de sa carrière d’athlète, il est commentateur officiel de l’AML (African MMA League), diffusée sur Life TV et RTI 3 (La 3). Il partage son expertise lors des plus grands événements de MMA en Afrique de l’Ouest.',
    en: '**Paul “The Legend” Kouame Yao**, international professional boxer (79 kg).\n\nProfessional boxer and multiple combat sports champion, Paul “The Legend” has been pushing his limits for more than 17 years to make Côte d’Ivoire shine on the international stage.\n\nAlongside his athletic career, he is the official commentator of the AML (African MMA League), broadcast on Life TV and RTI 3 (La 3). He shares his expertise at the biggest MMA events in West Africa.',
  } satisfies L,
  commentatorBio: {
    fr: 'En parallèle de sa carrière d’athlète, Paul est commentateur officiel de l’AML (African MMA League), diffusée sur Life TV et RTI 3 (La 3).\n\nIl partage son expertise lors des plus grands événements de MMA en Afrique de l’Ouest.',
    en: 'Alongside his athletic career, Paul is the official commentator of the AML (African MMA League), broadcast on Life TV and RTI 3 (La 3).\n\nHe shares his expertise at the biggest MMA events in West Africa.',
  } satisfies L,
  discipline: {
    fr: 'Ceinture noire 3e dan en karaté, triple champion de Côte d’Ivoire.\n\nExpérience en :\n\n- Kickboxing\n- Full Contact\n- Krav Maga\n- Boxe française',
    en: '3rd dan black belt in karate, three-time champion of Côte d’Ivoire.\n\nExperience in:\n\n- Kickboxing\n- Full Contact\n- Krav Maga\n- French boxing (savate)',
  } satisfies L,
};

/** Bilan professionnel officiel (3 victoires, 0 défaite) — KO et combats pour un titre non communiqués. */
export const LOCAL_PRO_RECORD = { total: 3, wins: 3, losses: 0, draws: 0 } as const;

export interface LocalAchievement {
  id: string;
  kind: AchievementKind;
  title: L;
  description: L | null;
  organization: string | null;
}

export const LOCAL_ACHIEVEMENTS: readonly LocalAchievement[] = [
  {
    id: 'local-champion-afrique-kickboxing',
    kind: 'title',
    title: { fr: 'Champion d’Afrique de kickboxing', en: 'African kickboxing champion' },
    description: { fr: 'Détenteur de la ceinture continentale WAKO PRO.', en: 'Holder of the WAKO PRO continental belt.' },
    organization: 'WAKO PRO',
  },
  {
    id: 'local-champion-ci-boxe',
    kind: 'title',
    title: { fr: 'Champion de Côte d’Ivoire de boxe anglaise — mi-lourd', en: 'Côte d’Ivoire boxing champion — light heavyweight' },
    description: null,
    organization: null,
  },
  {
    id: 'local-record-amateur',
    kind: 'record',
    title: { fr: 'Boxe amateur : 81 victoires, 1 défaite', en: 'Amateur boxing: 81 wins, 1 loss' },
    description: null,
    organization: null,
  },
  {
    id: 'local-record-pro',
    kind: 'record',
    title: { fr: 'Boxe professionnelle : 3 victoires, 0 défaite', en: 'Professional boxing: 3 wins, 0 losses' },
    description: null,
    organization: null,
  },
  {
    id: 'local-karate',
    kind: 'title',
    title: { fr: 'Triple champion de Côte d’Ivoire de karaté — ceinture noire 3e dan', en: 'Three-time Côte d’Ivoire karate champion — 3rd dan black belt' },
    description: null,
    organization: null,
  },
];
