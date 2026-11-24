/**
 * Emplacements médias configurables du hero.
 * Valeurs : chemin local (`/media/hero-1080.mp4` dans `public/media/`) ou URL Supabase Storage.
 * Vide = placeholder cinématique (noir + lumière rouge + grain), jamais de média emprunté.
 *
 * Recommandations : H.264 MP4 + WebM, 1080p max, 10–20 s, sans son, < 8 Mo ; version mobile 720p plus légère.
 */
const read = (v: string | undefined) => (v ?? '').trim();

export interface LocalImage {
  id: string;
  src: string;
  category: 'training' | 'gym' | 'portrait' | 'event';
  width: number;
  height: number;
  alt: { fr: string; en: string };
}

/** Photos réelles de Paul servies directement depuis `public/media/`. */
export const LOCAL_IMAGES = {
  portrait: {
    id: 'local-portrait',
    src: '/media/paul-portrait.jpg',
    category: 'portrait',
    width: 854,
    height: 1280,
    alt: { fr: 'Paul en garde, gants rouges et noirs, face à l’objectif', en: 'Paul in guard, red and black gloves, facing the camera' },
  },
  victoire: {
    id: 'local-victoire',
    src: '/media/paul-victoire.jpg',
    category: 'portrait',
    width: 854,
    height: 1280,
    alt: { fr: 'Paul de dos, le poing levé', en: 'Paul from behind, fist raised' },
  },
  garde: {
    id: 'local-garde',
    src: '/media/paul-garde.jpg',
    category: 'training',
    width: 854,
    height: 1280,
    alt: { fr: 'Paul de profil en garde', en: 'Paul in profile, in guard' },
  },
  gym: {
    id: 'local-gym',
    src: '/media/paul-gym-ceinture.jpg',
    category: 'gym',
    width: 1080,
    height: 1028,
    alt: { fr: 'Paul à la salle avec sa ceinture WAKO PRO', en: 'Paul at the gym with his WAKO PRO belt' },
  },
  sacFrappe: {
    id: 'local-sac-frappe',
    src: '/media/paul-sac-frappe.jpg',
    category: 'training',
    width: 1024,
    height: 970,
    alt: { fr: 'Paul frappe le sac à la salle, gants blancs', en: 'Paul hitting the heavy bag at the gym, white gloves' },
  },
  gantObjectif: {
    id: 'local-gant-objectif',
    src: '/media/paul-gant-objectif.jpg',
    category: 'training',
    width: 1024,
    height: 970,
    alt: { fr: 'Paul tend son gant blanc vers l’objectif', en: 'Paul pushing his white glove toward the camera' },
  },
  trone: {
    id: 'local-trone',
    src: '/media/paul-trone-certification.jpg',
    category: 'event',
    width: 1024,
    height: 682,
    alt: { fr: 'Paul assis sur un trône avec sa ceinture, recevant un certificat', en: 'Paul seated on a throne with his belt, receiving a certificate' },
  },
  salleCeinture: {
    id: 'local-salle-ceinture',
    src: '/media/paul-salle-ceinture.jpg',
    category: 'gym',
    width: 1024,
    height: 995,
    alt: { fr: 'Paul à genou entre deux sacs de frappe, ceinture WAKO PRO à la main', en: 'Paul kneeling between two heavy bags, holding his WAKO PRO belt' },
  },
} as const satisfies Record<string, LocalImage>;

/** Photo d'ambiance de l'en-tête de chaque page interne (`position` = cadrage CSS `object-position`). */
export const PAGE_HERO_IMAGES = {
  champion: { src: LOCAL_IMAGES.victoire.src, position: 'center 20%' },
  fights: { src: LOCAL_IMAGES.garde.src, position: 'center 25%' },
  performance: { src: LOCAL_IMAGES.sacFrappe.src, position: '40% 30%' },
  gym: { src: LOCAL_IMAGES.salleCeinture.src, position: 'center 30%' },
  commentator: { src: LOCAL_IMAGES.trone.src, position: '45% 30%' },
  news: { src: LOCAL_IMAGES.portrait.src, position: 'center 20%' },
  media: { src: LOCAL_IMAGES.gantObjectif.src, position: 'center 40%' },
  sponsors: { src: LOCAL_IMAGES.gym.src, position: '55% 30%' },
  contact: { src: LOCAL_IMAGES.portrait.src, position: 'center 15%' },
} as const;

/** Médias du hero : variables `VITE_HERO_*` si définies, sinon fichiers versionnés de `public/media/`. */
export const HERO_MEDIA = {
  videoMp4: read(import.meta.env.VITE_HERO_VIDEO_MP4),
  videoWebm: read(import.meta.env.VITE_HERO_VIDEO_WEBM),
  videoMobileMp4: read(import.meta.env.VITE_HERO_VIDEO_MOBILE_MP4) || '/media/hero-mobile.mp4',
  poster: read(import.meta.env.VITE_HERO_POSTER) || LOCAL_IMAGES.victoire.src,
} as const;
