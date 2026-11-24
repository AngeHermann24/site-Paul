/**
 * Schémas de validation serveur des demandes publiques (Edge Function `submit-request`).
 *
 * ⚠️ Contrairement à `src/schemas/requests.ts` qui valide les champs de formulaire (camelCase),
 * ce fichier valide le **payload transport** = colonnes SQL (snake_case), construit par les
 * formulaires puis envoyé à la function. Les bornes reflètent les mêmes CHECK que
 * `supabase/migrations/20261121000300_requests.sql` — modifier les trois ensemble.
 */
import { z } from 'npm:zod@4';

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));
const reqText = (min: number, max: number) => z.string().trim().min(min).max(max);
const emailField = z.email().max(254);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const optUuid = z
  .union([z.uuid(), z.literal(''), z.null(), z.undefined()])
  .transform((v) => (typeof v === 'string' && v.length > 0 ? v : null));
const optDate = z
  .union([z.string().regex(DATE_RE), z.literal(''), z.null(), z.undefined()])
  .transform((v) => (typeof v === 'string' && v.length > 0 ? v : null));
const optEnum = <T extends readonly string[]>(values: T) =>
  z
    .union([z.enum(values), z.literal(''), z.null(), z.undefined()])
    .transform((v) => (typeof v === 'string' && v.length > 0 ? v : null));
const optInt = (min: number, max: number) =>
  z
    .union([z.coerce.number().int().min(min).max(max), z.literal(''), z.null(), z.undefined()])
    .transform((v) => (v === '' || v === null || v === undefined ? null : v));
const optHttpUrl = z
  .union([z.string().trim().regex(/^https?:\/\//).max(300), z.literal(''), z.null(), z.undefined()])
  .transform((v) => (typeof v === 'string' && v.length > 0 ? v : null));
const localeField = z
  .string()
  .trim()
  .max(10)
  .nullish()
  .transform((v) => v || 'fr');
const consentField = z.literal(true);
/** Honeypot : toléré dans le payload (le filtrage réel est fait avant la validation). */
const honeypot = z.string().max(100).nullish().optional();

export const contactSchema = z.object({
  type: z.enum(['professional', 'collaboration', 'booking', 'media', 'sponsorship', 'gym', 'other']),
  full_name: reqText(2, 120),
  email: emailField,
  phone: optText(40),
  organization: optText(160),
  subject: reqText(2, 200),
  message: reqText(10, 5000),
  consent: consentField,
  locale: localeField,
  website: honeypot,
});

export const gymSchema = z.object({
  full_name: reqText(2, 120),
  email: emailField,
  phone: optText(40),
  membership_id: optUuid,
  disciplines: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  experience_level: optEnum(['none', 'beginner', 'intermediate', 'advanced', 'competitor'] as const),
  preferred_contact: z.enum(['email', 'phone']),
  message: optText(3000),
  consent: consentField,
  locale: localeField,
  website: honeypot,
});

export const bookingSchema = z.object({
  organizer_name: reqText(2, 120),
  organization: optText(160),
  email: emailField,
  phone: optText(40),
  event_name: reqText(2, 200),
  event_date: optDate,
  event_city: optText(120),
  event_country: optText(80),
  discipline: optText(80),
  service_id: optUuid,
  broadcast_type: optEnum(['live_event', 'tv', 'streaming', 'podcast', 'corporate', 'other'] as const),
  audience_size: optEnum(['lt_500', '500_2k', '2k_10k', 'gt_10k', 'unknown'] as const),
  budget_range: optEnum(['lt_1k', '1k_3k', '3k_10k', 'gt_10k', 'undisclosed'] as const),
  message: reqText(10, 5000),
  consent: consentField,
  locale: localeField,
  website: honeypot,
});

export const sponsorshipSchema = z.object({
  company_name: reqText(2, 160),
  company_website: optHttpUrl,
  company_sector: optText(120),
  company_size: optEnum(['1-10', '11-50', '51-250', '251-1000', '1000+'] as const),
  company_country: optText(80),
  contact_name: reqText(2, 120),
  contact_role: optText(120),
  email: emailField,
  phone: optText(40),
  package_tier: optEnum(['main', 'gold', 'silver', 'official', 'technical', 'media', 'event', 'undecided'] as const),
  package_id: optUuid,
  activities: z.array(z.enum(['boxing', 'gym', 'commentary'])).max(3).default([]),
  objectives: z
    .array(z.enum(['visibility', 'image', 'community', 'content', 'events', 'hospitality', 'recruitment', 'other']))
    .max(10)
    .default([]),
  budget_range: optEnum(['lt_5k', '5k_15k', '15k_50k', '50k_150k', 'gt_150k', 'undisclosed'] as const),
  desired_start: optDate,
  duration_months: optInt(1, 60),
  presentation: reqText(20, 5000),
  consent: consentField,
  locale: localeField,
  website: honeypot,
});

export const SCHEMAS = {
  contact: contactSchema,
  gym: gymSchema,
  booking: bookingSchema,
  sponsorship: sponsorshipSchema,
} as const;

/** Limites fichiers — miroir du bucket `attachments` (migration 0500). */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
