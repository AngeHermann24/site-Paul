/**
 * Configuration des ressources administrables — pilote les pages liste/édition de `/admin`.
 *
 * Chaque `FieldDef` décrit un champ du formulaire ; `localized: true` rend deux champs
 * `<key>_fr` / `<key>_en`. Les labels sont littéraux {fr, en} (outil interne : seule la
 * chrome UI passe par les fichiers de traduction).
 *
 * Types de champ : text, textarea, richtext, url, slug, date, datetime, number, select,
 * checkbox, tags (text[] ↔ liste séparée par virgules), ref (FK → select peuplé d'une
 * autre table), json (objets structurés édités en JSON brut).
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'url'
  | 'slug'
  | 'date'
  | 'datetime'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'tags'
  | 'ref'
  | 'json';

export interface FieldRef {
  table: string;
  /** Colonnes affichées dans le select (la première non nulle est retenue). */
  labelCols: readonly string[];
  order?: string;
}

export interface FieldDef {
  key: string;
  label: { fr: string; en: string };
  type: FieldType;
  localized?: boolean;
  required?: boolean;
  /** select */
  options?: readonly string[];
  /** ref */
  ref?: FieldRef;
  /** mise en page : demi-largeur dans la grille du formulaire */
  half?: boolean;
  hint?: { fr: string; en: string };
}

export type ResourceGroup = 'fights' | 'news' | 'performance' | 'gym' | 'commentary' | 'media' | 'sponsors' | 'site';

export interface ResourceDef {
  key: string;
  table: string;
  group: ResourceGroup;
  label: { fr: string; en: string };
  titleCol: string;
  listCols: readonly string[];
  searchCols?: readonly string[];
  defaultOrder?: string;
  ascending?: boolean;
  singleton?: boolean;
  /** owner uniquement (gestion de l'équipe admin) */
  ownerOnly?: boolean;
  fields: readonly FieldDef[];
}

const L = (fr: string, en: string) => ({ fr, en });
const title = (required = true): FieldDef => ({ key: 'title', label: L('Titre', 'Title'), type: 'text', localized: true, required });
const desc = (key = 'description'): FieldDef => ({ key, label: L('Description', 'Description'), type: 'textarea', localized: true });
const alt = (key: string): FieldDef => ({ key, label: L('Texte alternatif', 'Alt text'), type: 'text', localized: true, half: true });
const slugF: FieldDef = { key: 'slug', label: L('Slug (URL)', 'Slug (URL)'), type: 'slug', required: true, half: true, hint: L('minuscules, chiffres et tirets', 'lowercase, digits and dashes') };
const statusF: FieldDef = { key: 'status', label: L('Statut', 'Status'), type: 'select', options: ['draft', 'published', 'archived'], required: true, half: true };
const sortF: FieldDef = { key: 'sort_order', label: L('Ordre', 'Order'), type: 'number', half: true };
const featuredF: FieldDef = { key: 'is_featured', label: L('À la une', 'Featured'), type: 'checkbox', half: true };
const demoF: FieldDef = { key: 'is_demo', label: L('Contenu DEMO', 'DEMO content'), type: 'checkbox', half: true, hint: L('visible en dev / préproduction uniquement', 'visible in dev / staging only') };

export const RESOURCES: readonly ResourceDef[] = [
  // ------------------------------------------------------------------ Combats
  {
    key: 'combats',
    table: 'fights',
    group: 'fights',
    label: L('Combats', 'Fights'),
    titleCol: 'opponent_name',
    listCols: ['opponent_name', 'event_date', 'category', 'result', 'status'],
    searchCols: ['opponent_name', 'event_name', 'city'],
    defaultOrder: 'event_date',
    ascending: false,
    fields: [
      slugF,
      { key: 'opponent_name', label: L('Adversaire', 'Opponent'), type: 'text', required: true },
      { key: 'opponent_country', label: L('Pays de l’adversaire', 'Opponent country'), type: 'text', half: true },
      { key: 'opponent_record', label: L('Bilan de l’adversaire', 'Opponent record'), type: 'text', half: true },
      { key: 'event_name', label: L('Événement', 'Event'), type: 'text', half: true },
      { key: 'event_date', label: L('Date', 'Date'), type: 'datetime', required: true, half: true },
      { key: 'venue', label: L('Salle', 'Venue'), type: 'text', half: true },
      { key: 'city', label: L('Ville', 'City'), type: 'text', half: true },
      { key: 'country', label: L('Pays', 'Country'), type: 'text', half: true },
      { key: 'weight_class', label: L('Catégorie de poids', 'Weight class'), type: 'text', half: true },
      { key: 'category', label: L('Catégorie', 'Category'), type: 'select', options: ['professional', 'amateur', 'exhibition'], required: true, half: true },
      { key: 'fight_status', label: L('État', 'State'), type: 'select', options: ['scheduled', 'completed', 'cancelled'], required: true, half: true },
      { key: 'result', label: L('Résultat', 'Result'), type: 'select', options: ['win', 'loss', 'draw', 'no_contest'], half: true },
      { key: 'method', label: L('Méthode', 'Method'), type: 'select', options: ['ko', 'tko', 'unanimous_decision', 'split_decision', 'majority_decision', 'technical_decision', 'rtd', 'dq', 'other'], half: true },
      { key: 'rounds_scheduled', label: L('Rounds prévus', 'Scheduled rounds'), type: 'number', half: true },
      { key: 'round_ended', label: L('Round d’arrêt', 'End round'), type: 'number', half: true },
      { key: 'time_ended', label: L('Temps d’arrêt', 'End time'), type: 'text', half: true },
      { key: 'is_title_fight', label: L('Combat pour un titre', 'Title fight'), type: 'checkbox', half: true },
      { key: 'title_name', label: L('Nom du titre', 'Title name'), type: 'text', half: true },
      { key: 'summary', label: L('Résumé', 'Summary'), type: 'richtext', localized: true },
      { key: 'cover_url', label: L('Visuel (URL)', 'Cover (URL)'), type: 'url' },
      alt('cover_alt'),
      { key: 'video_url', label: L('Vidéo (URL)', 'Video (URL)'), type: 'url', half: true },
      { key: 'ticket_url', label: L('Billetterie (URL)', 'Ticketing (URL)'), type: 'url', half: true },
      featuredF,
      statusF,
      demoF,
    ],
  },
  {
    key: 'palmares',
    table: 'achievements',
    group: 'fights',
    label: L('Palmarès', 'Achievements'),
    titleCol: 'title_fr',
    listCols: ['title_fr', 'kind', 'year', 'achieved_on', 'status'],
    searchCols: ['title_fr', 'title_en', 'organization'],
    defaultOrder: 'sort_order',
    fields: [
      { key: 'kind', label: L('Type', 'Kind'), type: 'select', options: ['title', 'award', 'milestone', 'record', 'other'], required: true, half: true },
      { key: 'achieved_on', label: L('Date d’obtention', 'Achieved on'), type: 'date', half: true },
      { key: 'year', label: L('Année', 'Year'), type: 'number', half: true },
      { key: 'organization', label: L('Organisation', 'Organization'), type: 'text', half: true },
      title(),
      desc(),
      { key: 'fight_id', label: L('Combat lié', 'Linked fight'), type: 'ref', ref: { table: 'fights', labelCols: ['opponent_name', 'event_name'], order: 'event_date.desc' }, half: true, hint: L('optionnel', 'optional') },
      { key: 'image_url', label: L('Image (URL)', 'Image (URL)'), type: 'url' },
      alt('image_alt'),
      { key: 'show_in_timeline', label: L('Dans la frise carrière', 'In career timeline'), type: 'checkbox', half: true },
      sortF,
      statusF,
      demoF,
    ],
  },
  // ------------------------------------------------------------------ Actualités
  {
    key: 'actualites',
    table: 'articles',
    group: 'news',
    label: L('Actualités', 'News'),
    titleCol: 'title_fr',
    listCols: ['title_fr', 'category', 'published_at', 'status'],
    searchCols: ['title_fr', 'title_en', 'excerpt_fr'],
    defaultOrder: 'published_at',
    ascending: false,
    fields: [
      slugF,
      { key: 'category', label: L('Catégorie', 'Category'), type: 'select', options: ['news', 'fight', 'gym', 'commentary', 'partnership', 'press'], required: true, half: true },
      title(),
      { key: 'excerpt', label: L('Chapô', 'Excerpt'), type: 'textarea', localized: true },
      { key: 'body', label: L('Corps de l’article', 'Body'), type: 'richtext', localized: true },
      { key: 'cover_url', label: L('Couverture (URL)', 'Cover (URL)'), type: 'url' },
      alt('cover_alt'),
      { key: 'author_name', label: L('Auteur', 'Author'), type: 'text', half: true },
      { key: 'tags', label: L('Tags', 'Tags'), type: 'tags', half: true },
      { key: 'seo_title', label: L('Titre SEO', 'SEO title'), type: 'text', localized: true, half: true },
      { key: 'seo_description', label: L('Description SEO', 'SEO description'), type: 'textarea', localized: true },
      { key: 'published_at', label: L('Date de publication', 'Published at'), type: 'datetime', half: true },
      featuredF,
      statusF,
      demoF,
    ],
  },
  // ------------------------------------------------------------------ Performance
  {
    key: 'performance',
    table: 'performance_contents',
    group: 'performance',
    label: L('Performance', 'Performance'),
    titleCol: 'title_fr',
    listCols: ['title_fr', 'category', 'sort_order', 'status'],
    searchCols: ['title_fr', 'title_en'],
    defaultOrder: 'sort_order',
    fields: [
      slugF,
      { key: 'category', label: L('Catégorie', 'Category'), type: 'select', options: ['preparation', 'training', 'strength', 'endurance', 'technique', 'discipline', 'nutrition', 'advice'], required: true, half: true },
      title(),
      { key: 'excerpt', label: L('Chapô', 'Excerpt'), type: 'textarea', localized: true },
      { key: 'body', label: L('Contenu', 'Body'), type: 'richtext', localized: true },
      { key: 'cover_url', label: L('Visuel (URL)', 'Cover (URL)'), type: 'url' },
      alt('cover_alt'),
      { key: 'video_url', label: L('Vidéo (URL)', 'Video (URL)'), type: 'url' },
      sortF,
      { key: 'published_at', label: L('Publié le', 'Published at'), type: 'datetime', half: true },
      statusF,
      demoF,
    ],
  },
  // ------------------------------------------------------------------ Gym
  {
    key: 'gym-services',
    table: 'gym_services',
    group: 'gym',
    label: L('Disciplines & prestations', 'Disciplines & services'),
    titleCol: 'title_fr',
    listCols: ['title_fr', 'kind', 'level', 'sort_order', 'status'],
    searchCols: ['title_fr', 'title_en'],
    defaultOrder: 'sort_order',
    fields: [
      slugF,
      { key: 'kind', label: L('Type', 'Kind'), type: 'select', options: ['discipline', 'class', 'equipment', 'service'], required: true, half: true },
      { key: 'level', label: L('Niveau', 'Level'), type: 'select', options: ['all', 'beginner', 'intermediate', 'advanced'], half: true },
      title(),
      desc(),
      { key: 'image_url', label: L('Image (URL)', 'Image (URL)'), type: 'url' },
      alt('image_alt'),
      sortF,
      statusF,
      demoF,
    ],
  },
  {
    key: 'gym-coachs',
    table: 'gym_coaches',
    group: 'gym',
    label: L('Coachs', 'Coaches'),
    titleCol: 'full_name',
    listCols: ['full_name', 'role_fr', 'sort_order', 'status'],
    searchCols: ['full_name', 'role_fr'],
    defaultOrder: 'sort_order',
    fields: [
      slugF,
      { key: 'full_name', label: L('Nom complet', 'Full name'), type: 'text', required: true },
      { key: 'role', label: L('Rôle', 'Role'), type: 'text', localized: true, half: true },
      { key: 'bio', label: L('Bio', 'Bio'), type: 'textarea', localized: true },
      { key: 'specialties', label: L('Spécialités', 'Specialties'), type: 'tags' },
      { key: 'photo_url', label: L('Photo (URL)', 'Photo (URL)'), type: 'url' },
      alt('photo_alt'),
      { key: 'instagram_url', label: L('Instagram (URL)', 'Instagram (URL)'), type: 'url', half: true },
      sortF,
      statusF,
      demoF,
    ],
  },
  {
    key: 'gym-horaires',
    table: 'gym_schedules',
    group: 'gym',
    label: L('Horaires', 'Schedule'),
    titleCol: 'label_fr',
    listCols: ['label_fr', 'day_of_week', 'starts_at', 'ends_at', 'status'],
    defaultOrder: 'day_of_week',
    fields: [
      { key: 'service_id', label: L('Prestation', 'Service'), type: 'ref', ref: { table: 'gym_services', labelCols: ['title_fr', 'title_en'], order: 'sort_order' }, half: true },
      { key: 'coach_id', label: L('Coach', 'Coach'), type: 'ref', ref: { table: 'gym_coaches', labelCols: ['full_name'], order: 'sort_order' }, half: true },
      { key: 'label', label: L('Libellé', 'Label'), type: 'text', localized: true, required: true },
      { key: 'day_of_week', label: L('Jour (1 = lundi … 7 = dimanche)', 'Day (1 = Monday … 7 = Sunday)'), type: 'number', required: true, half: true },
      { key: 'starts_at', label: L('Début', 'Starts'), type: 'text', half: true, hint: L('HH:MM', 'HH:MM') },
      { key: 'ends_at', label: L('Fin', 'Ends'), type: 'text', half: true, hint: L('HH:MM', 'HH:MM') },
      { key: 'level', label: L('Niveau', 'Level'), type: 'select', options: ['all', 'beginner', 'intermediate', 'advanced'], half: true },
      { key: 'room', label: L('Salle / zone', 'Room / area'), type: 'text', half: true },
      { key: 'capacity', label: L('Capacité', 'Capacity'), type: 'number', half: true },
      { key: 'notes', label: L('Notes', 'Notes'), type: 'textarea', localized: true },
      statusF,
      demoF,
    ],
  },
  {
    key: 'gym-formules',
    table: 'gym_memberships',
    group: 'gym',
    label: L('Formules', 'Memberships'),
    titleCol: 'name_fr',
    listCols: ['name_fr', 'price_cents', 'billing_period', 'sort_order', 'status'],
    searchCols: ['name_fr', 'name_en'],
    defaultOrder: 'sort_order',
    fields: [
      slugF,
      { key: 'name', label: L('Nom', 'Name'), type: 'text', localized: true, required: true },
      desc(),
      { key: 'price_cents', label: L('Prix (centimes, vide = sur demande)', 'Price (cents, empty = on request)'), type: 'number', half: true },
      { key: 'currency', label: L('Devise', 'Currency'), type: 'text', half: true, hint: L('EUR, USD…', 'EUR, USD…') },
      { key: 'billing_period', label: L('Période', 'Billing period'), type: 'select', options: ['session', 'week', 'month', 'quarter', 'year', 'one_time'], half: true },
      { key: 'features', label: L('Avantages (un par ligne via virgules)', 'Features (comma separated)'), type: 'tags', localized: true },
      featuredF,
      sortF,
      statusF,
      demoF,
    ],
  },
  // ------------------------------------------------------------------ Commentateur
  {
    key: 'prestations',
    table: 'commentary_services',
    group: 'commentary',
    label: L('Prestations', 'Services'),
    titleCol: 'title_fr',
    listCols: ['title_fr', 'sort_order', 'status'],
    searchCols: ['title_fr', 'title_en'],
    defaultOrder: 'sort_order',
    fields: [
      slugF,
      title(),
      desc(),
      { key: 'deliverables', label: L('Livrables', 'Deliverables'), type: 'tags', localized: true },
      sortF,
      statusF,
      demoF,
    ],
  },
  {
    key: 'evenements-commentes',
    table: 'commentary_events',
    group: 'commentary',
    label: L('Événements commentés', 'Commented events'),
    titleCol: 'event_name',
    listCols: ['event_name', 'event_date', 'role', 'broadcaster', 'status'],
    searchCols: ['event_name', 'promotion', 'broadcaster'],
    defaultOrder: 'event_date',
    ascending: false,
    fields: [
      slugF,
      { key: 'event_name', label: L('Événement', 'Event'), type: 'text', required: true },
      { key: 'event_date', label: L('Date', 'Date'), type: 'date', half: true },
      { key: 'promotion', label: L('Promotion / organisation', 'Promotion / organization'), type: 'text', half: true },
      { key: 'broadcaster', label: L('Diffuseur', 'Broadcaster'), type: 'text', half: true },
      { key: 'role', label: L('Rôle', 'Role'), type: 'select', options: ['lead_commentator', 'color_commentator', 'analyst', 'host', 'ringside_reporter', 'other'], required: true, half: true },
      { key: 'discipline', label: L('Discipline', 'Discipline'), type: 'text', half: true },
      { key: 'city', label: L('Ville', 'City'), type: 'text', half: true },
      { key: 'country', label: L('Pays', 'Country'), type: 'text', half: true },
      desc(),
      { key: 'cover_url', label: L('Visuel (URL)', 'Cover (URL)'), type: 'url' },
      alt('cover_alt'),
      { key: 'video_url', label: L('Vidéo (URL)', 'Video (URL)'), type: 'url', half: true },
      { key: 'audio_url', label: L('Audio (URL)', 'Audio (URL)'), type: 'url', half: true },
      featuredF,
      statusF,
      demoF,
    ],
  },
  // ------------------------------------------------------------------ Médias
  {
    key: 'medias',
    table: 'media',
    group: 'media',
    label: L('Médias', 'Media'),
    titleCol: 'title_fr',
    listCols: ['title_fr', 'kind', 'category', 'taken_on', 'status'],
    searchCols: ['title_fr', 'title_en', 'credit'],
    defaultOrder: 'taken_on',
    ascending: false,
    fields: [
      { key: 'kind', label: L('Type', 'Kind'), type: 'select', options: ['image', 'video', 'audio'], required: true, half: true },
      { key: 'category', label: L('Catégorie', 'Category'), type: 'select', options: ['fight', 'training', 'gym', 'commentary', 'event', 'portrait', 'press', 'other'], required: true, half: true },
      title(),
      { key: 'alt', label: L('Texte alternatif', 'Alt text'), type: 'text', localized: true, half: true },
      { key: 'caption', label: L('Légende', 'Caption'), type: 'textarea', localized: true },
      { key: 'storage_path', label: L('Chemin storage', 'Storage path'), type: 'text', half: true, hint: L('ex. media/fights/x.jpg (bucket public)', 'e.g. media/fights/x.jpg (public bucket)') },
      { key: 'external_url', label: L('URL externe', 'External URL'), type: 'url', half: true },
      { key: 'poster_url', label: L('Poster (URL)', 'Poster (URL)'), type: 'url', half: true },
      { key: 'width', label: L('Largeur (px)', 'Width (px)'), type: 'number', half: true },
      { key: 'height', label: L('Hauteur (px)', 'Height (px)'), type: 'number', half: true },
      { key: 'duration_seconds', label: L('Durée (s)', 'Duration (s)'), type: 'number', half: true },
      { key: 'taken_on', label: L('Date de prise', 'Taken on'), type: 'date', half: true },
      { key: 'credit', label: L('Crédit', 'Credit'), type: 'text', half: true },
      { key: 'fight_id', label: L('Combat lié', 'Linked fight'), type: 'ref', ref: { table: 'fights', labelCols: ['opponent_name', 'event_name'], order: 'event_date.desc' }, half: true },
      sortF,
      featuredF,
      statusF,
      demoF,
    ],
  },
  // ------------------------------------------------------------------ Sponsors
  {
    key: 'formules-sponsors',
    table: 'sponsorship_packages',
    group: 'sponsors',
    label: L('Formules sponsors', 'Sponsorship packages'),
    titleCol: 'name_fr',
    listCols: ['name_fr', 'tier', 'price_cents', 'sort_order', 'status'],
    searchCols: ['name_fr', 'name_en'],
    defaultOrder: 'sort_order',
    fields: [
      slugF,
      { key: 'tier', label: L('Catégorie', 'Tier'), type: 'select', options: ['main', 'gold', 'silver', 'official', 'technical', 'media', 'event'], required: true, half: true },
      { key: 'name', label: L('Nom', 'Name'), type: 'text', localized: true, required: true },
      desc(),
      { key: 'benefits', label: L('Avantages', 'Benefits'), type: 'tags', localized: true },
      { key: 'price_cents', label: L('Prix (centimes, vide = sur demande)', 'Price (cents, empty = on request)'), type: 'number', half: true },
      { key: 'currency', label: L('Devise', 'Currency'), type: 'text', half: true },
      featuredF,
      sortF,
      statusF,
      demoF,
    ],
  },
  {
    key: 'partenaires',
    table: 'sponsors',
    group: 'sponsors',
    label: L('Partenaires', 'Partners'),
    titleCol: 'name',
    listCols: ['name', 'tier', 'is_active', 'starts_on', 'ends_on'],
    searchCols: ['name'],
    defaultOrder: 'sort_order',
    fields: [
      slugF,
      { key: 'name', label: L('Nom', 'Name'), type: 'text', required: true },
      { key: 'tier', label: L('Catégorie', 'Tier'), type: 'select', options: ['main', 'gold', 'silver', 'official', 'technical', 'media', 'event'], required: true, half: true },
      { key: 'package_id', label: L('Formule liée', 'Linked package'), type: 'ref', ref: { table: 'sponsorship_packages', labelCols: ['name_fr', 'name_en'], order: 'sort_order' }, half: true },
      { key: 'logo_path', label: L('Logo (chemin storage)', 'Logo (storage path)'), type: 'text', half: true, hint: L('bucket public `logos`', 'public `logos` bucket') },
      { key: 'logo_url', label: L('Logo (URL externe)', 'Logo (external URL)'), type: 'url', half: true },
      { key: 'website_url', label: L('Site web (URL)', 'Website (URL)'), type: 'url' },
      desc(),
      { key: 'is_active', label: L('Partenaire actif', 'Active partner'), type: 'checkbox', half: true },
      { key: 'starts_on', label: L('Début du partenariat', 'Partnership start'), type: 'date', half: true },
      { key: 'ends_on', label: L('Fin du partenariat', 'Partnership end'), type: 'date', half: true },
      featuredF,
      sortF,
      demoF,
    ],
  },
  // ------------------------------------------------------------------ Site (singletons + équipe)
  {
    key: 'profil',
    table: 'profiles',
    group: 'site',
    label: L('Profil de Paul', 'Paul’s profile'),
    titleCol: 'display_name',
    listCols: [],
    singleton: true,
    fields: [
      slugF,
      { key: 'display_name', label: L('Nom affiché', 'Display name'), type: 'text', required: true, half: true },
      { key: 'full_name', label: L('Nom complet', 'Full name'), type: 'text', half: true },
      { key: 'nickname', label: L('Surnom', 'Nickname'), type: 'text', half: true },
      { key: 'headline', label: L('Accroche', 'Headline'), type: 'text', localized: true },
      { key: 'bio_short', label: L('Bio courte', 'Short bio'), type: 'textarea', localized: true },
      { key: 'bio', label: L('Bio complète', 'Full bio'), type: 'richtext', localized: true },
      { key: 'beginnings', label: L('Débuts', 'Beginnings'), type: 'richtext', localized: true },
      { key: 'journey', label: L('Parcours', 'Journey'), type: 'richtext', localized: true },
      { key: 'philosophy', label: L('Philosophie', 'Philosophy'), type: 'textarea', localized: true },
      { key: 'discipline', label: L('Discipline (approche)', 'Discipline (approach)'), type: 'textarea', localized: true },
      { key: 'commentator_bio', label: L('Bio commentateur', 'Commentator bio'), type: 'richtext', localized: true },
      { key: 'nationality', label: L('Nationalité', 'Nationality'), type: 'text', half: true },
      { key: 'hometown', label: L('Ville d’origine', 'Hometown'), type: 'text', half: true },
      { key: 'birth_date', label: L('Date de naissance', 'Birth date'), type: 'date', half: true },
      { key: 'weight_class', label: L('Catégorie de poids', 'Weight class'), type: 'text', half: true },
      { key: 'stance', label: L('Garde', 'Stance'), type: 'select', options: ['orthodox', 'southpaw', 'switch'], half: true },
      { key: 'height_cm', label: L('Taille (cm)', 'Height (cm)'), type: 'number', half: true },
      { key: 'reach_cm', label: L('Allonge (cm)', 'Reach (cm)'), type: 'number', half: true },
      { key: 'portrait_url', label: L('Portrait (URL)', 'Portrait (URL)'), type: 'url' },
      alt('portrait_alt'),
      statusF,
      demoF,
    ],
  },
  {
    key: 'equipe',
    table: 'admin_users',
    group: 'site',
    label: L('Équipe admin', 'Admin team'),
    titleCol: 'email',
    listCols: ['email', 'display_name', 'role', 'is_active'],
    searchCols: ['email', 'display_name'],
    defaultOrder: 'created_at',
    ownerOnly: true,
    fields: [
      { key: 'user_id', label: L('UUID du compte Auth', 'Auth user UUID'), type: 'text', required: true, hint: L('créer d’abord l’utilisateur dans Supabase Auth', 'create the user in Supabase Auth first') },
      { key: 'email', label: L('Email', 'Email'), type: 'text', required: true },
      { key: 'display_name', label: L('Nom affiché', 'Display name'), type: 'text', half: true },
      { key: 'role', label: L('Rôle', 'Role'), type: 'select', options: ['owner', 'admin', 'editor'], required: true, half: true },
      { key: 'is_active', label: L('Actif', 'Active'), type: 'checkbox', half: true, hint: L('le dernier owner actif ne peut pas être retiré (protection base)', 'the last active owner cannot be removed (DB protection)') },
    ],
  },
];

/** `site_settings` : singleton hors liste — formulaire direct dans `/admin/reglages`. */
export const SETTINGS_FIELDS: readonly FieldDef[] = [
  { key: 'site_name', label: L('Nom du site', 'Site name'), type: 'text', required: true, half: true },
  { key: 'contact_email', label: L('Email de contact', 'Contact email'), type: 'text', half: true },
  { key: 'contact_phone', label: L('Téléphone', 'Phone'), type: 'text', half: true },
  { key: 'booking_email', label: L('Email booking', 'Booking email'), type: 'text', half: true },
  { key: 'gym_name', label: L('Nom de la salle', 'Gym name'), type: 'text', half: true },
  { key: 'gym_address', label: L('Adresse', 'Address'), type: 'text', half: true },
  { key: 'gym_postal_code', label: L('Code postal', 'Postal code'), type: 'text', half: true },
  { key: 'gym_city', label: L('Ville', 'City'), type: 'text', half: true },
  { key: 'gym_country', label: L('Pays', 'Country'), type: 'text', half: true },
  { key: 'gym_maps_url', label: L('Lien Google Maps', 'Google Maps link'), type: 'url', half: true },
  { key: 'gym_opening_hours', label: L('Horaires d’ouverture', 'Opening hours'), type: 'textarea', localized: true },
  { key: 'gym_story', label: L('Histoire de la salle', 'Gym story'), type: 'richtext', localized: true },
  { key: 'instagram_url', label: L('Instagram', 'Instagram'), type: 'url', half: true },
  { key: 'youtube_url', label: L('YouTube', 'YouTube'), type: 'url', half: true },
  { key: 'tiktok_url', label: L('TikTok', 'TikTok'), type: 'url', half: true },
  { key: 'x_url', label: L('X (Twitter)', 'X (Twitter)'), type: 'url', half: true },
  { key: 'facebook_url', label: L('Facebook', 'Facebook'), type: 'url', half: true },
  { key: 'linkedin_url', label: L('LinkedIn', 'LinkedIn'), type: 'url', half: true },
  { key: 'seo_title', label: L('Titre SEO par défaut', 'Default SEO title'), type: 'text', localized: true, half: true },
  { key: 'seo_description', label: L('Description SEO par défaut', 'Default SEO description'), type: 'textarea', localized: true },
  { key: 'og_image_url', label: L('Image OG (URL)', 'OG image (URL)'), type: 'url', half: true },
  { key: 'logo_url', label: L('Logo du site (URL)', 'Site logo (URL)'), type: 'url', half: true },
  { key: 'hero_video_mp4_url', label: L('Hero vidéo MP4 (URL)', 'Hero video MP4 (URL)'), type: 'url', half: true },
  { key: 'hero_video_webm_url', label: L('Hero vidéo WebM (URL)', 'Hero video WebM (URL)'), type: 'url', half: true },
  { key: 'hero_video_mobile_url', label: L('Hero vidéo mobile (URL)', 'Hero mobile video (URL)'), type: 'url', half: true },
  { key: 'hero_poster_url', label: L('Hero poster (URL)', 'Hero poster (URL)'), type: 'url', half: true },
  { key: 'legal_notice', label: L('Mentions légales', 'Legal notice'), type: 'richtext', localized: true },
  { key: 'privacy_policy', label: L('Politique de confidentialité', 'Privacy policy'), type: 'richtext', localized: true },
  { key: 'cookies_policy', label: L('Politique cookies', 'Cookies policy'), type: 'richtext', localized: true },
];

export const resourceByKey = (key: string) => RESOURCES.find((r) => r.key === key);

export const resourceLabel = (r: ResourceDef, lang: 'fr' | 'en') => r.label[lang];

/** Clés de colonnes réelles : `key` ou `key_fr`/`key_en` si localized. */
export const fieldColumns = (f: FieldDef): string[] => (f.localized ? [`${f.key}_fr`, `${f.key}_en`] : [f.key]);
