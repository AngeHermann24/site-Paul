import sections from './sections';

const fr = {
  ...sections,
  meta: {
    siteName: 'PAUL — Official',
    defaultTitle: 'PAUL — Boxeur, Paul Gym & Commentateur sportif',
    defaultDescription:
      'Site officiel de PAUL : boxeur, propriétaire de Paul Gym et commentateur sportif. Combats, entraînement, salle, booking et partenariats.',
  },
  a11y: {
    skipToContent: 'Aller au contenu',
    mainNav: 'Navigation principale',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    languageSwitcher: 'Choisir la langue',
    currentLanguage: 'Langue actuelle : {{lang}}',
    switchTo: 'Passer en {{lang}}',
    home: 'PAUL — accueil',
    legalNav: 'Informations légales',
    social: 'Réseaux sociaux',
  },
  languages: {
    fr: 'Français',
    en: 'English',
  },
  nav: {
    home: 'Accueil',
    champion: 'Champion',
    fights: 'Combats',
    performance: 'Performance',
    gym: 'Paul Gym',
    commentator: 'Commentateur',
    news: 'Actualités',
    media: 'Médias',
    sponsors: 'Sponsors',
    contact: 'Contact',
    legal: 'Mentions légales',
    privacy: 'Confidentialité',
    cookies: 'Cookies',
    menu: 'Menu',
    close: 'Fermer',
  },
  roles: {
    boxer: 'Boxeur',
    gymOwner: 'Propriétaire de salle',
    commentator: 'Commentateur sportif',
  },
  cta: {
    becomePartner: 'Devenir partenaire',
    bookCommentator: 'Booker Paul',
    joinGym: "Rejoindre la salle",
    discover: 'Découvrir',
    backHome: "Retour à l'accueil",
  },
  pages: {
    champion: { title: 'Champion', intro: 'Biographie, parcours, philosophie et palmarès.' },
    fights: { title: 'Combats', intro: 'Statistiques de carrière et fiches de combat.' },
    performance: { title: 'Performance', intro: 'Préparation, force, endurance, technique, discipline.' },
    gym: { title: 'Paul Gym', intro: 'La salle : disciplines, cours, coachs, horaires et formules.' },
    commentator: { title: 'Commentateur', intro: 'Expérience, événements, extraits et booking.' },
    news: { title: 'Actualités', intro: 'Le magazine officiel.' },
    media: { title: 'Médias', intro: 'Photos et vidéos officielles.' },
    sponsors: {
      title: 'Associate your brand with greatness.',
      intro:
        'Construisons ensemble des partenariats qui donnent de la visibilité, de l’impact et de nouvelles perspectives au sport.',
    },
    contact: { title: 'Contact', intro: 'Professionnels, médias, booking, sponsoring, salle.' },
    legal: { title: 'Mentions légales', intro: 'Informations légales du site.' },
    privacy: { title: 'Confidentialité', intro: 'Politique de confidentialité et données personnelles.' },
    cookies: { title: 'Cookies', intro: 'Utilisation des cookies et traceurs.' },
  },
  status: {
    inProgress: 'Contenu en préparation',
    inProgressBody: 'Cette section est en cours de construction. Le contenu sera publié prochainement.',
  },
  home: {
    eyebrow: 'Official Boxing & Sports Experience',
    tagline: 'Discipline. Puissance. Intensité.',
    activities: 'Trois activités',
    activitiesTitle: 'Un homme.\nTrois rings.',
    manifestoLabel: 'Manifeste',
    manifesto:
      "Trois rings. Une seule exigence : la discipline. Round après round, sur le ring, dans la salle et derrière le micro, jusqu'à la dernière cloche.",
  },
  hero: {
    srTitle: 'PAUL — Boxeur, propriétaire de salle et commentateur sportif',
    scroll: 'Défiler',
    scrollHint: 'Faire défiler vers le contenu',
  },
  preloader: {
    loading: 'Chargement',
    round: 'Round 01',
    skip: "Passer l'intro",
  },
  cursor: {
    play: 'Play',
  },
  media: {
    placeholder: 'Média officiel à venir',
    placeholderAlt: 'Emplacement réservé à une photo officielle de Paul',
  },
  notFound: {
    code: '404',
    title: 'Hors du ring.',
    body: "Cette page n'existe pas ou a été déplacée.",
  },
  error: {
    title: 'Quelque chose a cassé.',
    body: 'Une erreur inattendue est survenue. Rechargez la page ou revenez plus tard.',
    reload: 'Recharger',
  },
  legalZone: {
    copyright: '© {{year}} PAUL. Tous droits réservés.',
  },
} as const;

type DeepStringify<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]> };
export type CommonTranslation = DeepStringify<typeof fr>;

export default fr as CommonTranslation;
