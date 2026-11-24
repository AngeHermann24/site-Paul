/**
 * Domaines métier — miroir exact des contraintes CHECK des migrations
 * (supabase/migrations). Toute modification SQL doit être répercutée ici.
 */
export type ContentStatus = 'draft' | 'published' | 'archived';
export type RequestStatus = 'new' | 'in_review' | 'contacted' | 'accepted' | 'rejected' | 'archived';

export type FightCategory = 'professional' | 'amateur' | 'exhibition';
export type FightStatus = 'scheduled' | 'completed' | 'cancelled';
export type FightResult = 'win' | 'loss' | 'draw' | 'no_contest';
export type FightMethod =
  | 'ko'
  | 'tko'
  | 'unanimous_decision'
  | 'split_decision'
  | 'majority_decision'
  | 'technical_decision'
  | 'rtd'
  | 'dq'
  | 'other';

export type AchievementKind = 'title' | 'award' | 'milestone' | 'record' | 'other';
export type PerformanceCategory =
  | 'preparation'
  | 'training'
  | 'strength'
  | 'endurance'
  | 'technique'
  | 'discipline'
  | 'nutrition'
  | 'advice';

export type GymServiceKind = 'discipline' | 'class' | 'equipment' | 'service';
export type Level = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type BillingPeriod = 'session' | 'week' | 'month' | 'quarter' | 'year' | 'one_time';

export type CommentaryRole = 'lead_commentator' | 'color_commentator' | 'analyst' | 'host' | 'ringside_reporter' | 'other';

export type MediaKind = 'image' | 'video' | 'audio';
export type MediaCategory = 'fight' | 'training' | 'gym' | 'commentary' | 'event' | 'portrait' | 'press' | 'other';

export type ArticleCategory = 'news' | 'fight' | 'gym' | 'commentary' | 'partnership' | 'press';

export type SponsorTier = 'main' | 'gold' | 'silver' | 'official' | 'technical' | 'media' | 'event';

export type ContactType = 'professional' | 'collaboration' | 'booking' | 'media' | 'sponsorship' | 'gym' | 'other';

export interface AudienceMetric {
  label_fr: string;
  label_en: string;
  value: string;
  source?: string;
  verified_on?: string;
}
