/**
 * Schémas de validation des demandes publiques (zod).
 * Source unique client/serveur : l'Edge Function `supabase/functions/submit-request`
 * en maintient un miroir Deno (`_shared/request-schemas.ts`) — modifier les deux ensemble.
 * Les bornes reflètent les contraintes CHECK de supabase/migrations/20261121000300_requests.sql.
 */
import { z } from 'zod';
import type { ContactType } from '@/types/domain';

export const CONTACT_TYPES = [
  'professional',
  'collaboration',
  'booking',
  'media',
  'sponsorship',
  'gym',
  'other',
] as const satisfies readonly ContactType[];

const optionalText = (max: number) => z.string().trim().max(max).or(z.literal('')).optional();
const requiredText = (min: number, max: number) => z.string().trim().min(min).max(max);
const emailField = z.email().max(254);
const uuidField = z.uuid().optional().or(z.literal('').transform(() => undefined));
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal('').transform(() => undefined));
/** Honeypot : doit rester vide (les bots le remplissent). */
const honeypot = z.string().max(0).optional().or(z.literal(''));
const consentField = z.boolean().refine((v) => v === true);

export const contactSchema = z.object({
  type: z.enum(CONTACT_TYPES),
  fullName: requiredText(2, 120),
  email: emailField,
  phone: optionalText(40),
  organization: optionalText(160),
  subject: requiredText(2, 200),
  message: requiredText(10, 5000),
  consent: consentField,
  website: honeypot,
});

export type ContactFormValues = z.input<typeof contactSchema>;

/** Délai minimum entre l'affichage du formulaire et l'envoi (anti-robots). */
export const MIN_SUBMIT_DELAY_MS = 3000;

// ------------------------------------------------------------------ Gym
export const EXPERIENCE_LEVELS = ['none', 'beginner', 'intermediate', 'advanced', 'competitor'] as const;
export const PREFERRED_CONTACT = ['email', 'phone'] as const;

export const gymRegistrationSchema = z.object({
  fullName: requiredText(2, 120),
  email: emailField,
  phone: optionalText(40),
  membershipId: uuidField,
  disciplines: z.array(z.string().trim().min(1).max(80)).max(10),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional().or(z.literal('').transform(() => undefined)),
  preferredContact: z.enum(PREFERRED_CONTACT),
  message: optionalText(3000),
  consent: consentField,
  website: honeypot,
});

export type GymRegistrationValues = z.input<typeof gymRegistrationSchema>;

// ------------------------------------------------------------------ Booking
export const BROADCAST_TYPES = ['live_event', 'tv', 'streaming', 'podcast', 'corporate', 'other'] as const;
export const BOOKING_AUDIENCE = ['lt_500', '500_2k', '2k_10k', 'gt_10k', 'unknown'] as const;
export const BOOKING_BUDGETS = ['lt_1k', '1k_3k', '3k_10k', 'gt_10k', 'undisclosed'] as const;

export const bookingSchema = z.object({
  organizerName: requiredText(2, 120),
  organization: optionalText(160),
  email: emailField,
  phone: optionalText(40),
  eventName: requiredText(2, 200),
  eventDate: dateField,
  eventCity: optionalText(120),
  eventCountry: optionalText(80),
  discipline: optionalText(80),
  serviceId: uuidField,
  broadcastType: z.enum(BROADCAST_TYPES).optional().or(z.literal('').transform(() => undefined)),
  audienceSize: z.enum(BOOKING_AUDIENCE).optional().or(z.literal('').transform(() => undefined)),
  budgetRange: z.enum(BOOKING_BUDGETS).optional().or(z.literal('').transform(() => undefined)),
  message: requiredText(10, 5000),
  consent: consentField,
  website: honeypot,
});

export type BookingFormValues = z.input<typeof bookingSchema>;

// ------------------------------------------------------------------ Sponsoring (5 étapes)
export const SPONSOR_TIERS = ['main', 'gold', 'silver', 'official', 'technical', 'media', 'event', 'undecided'] as const;
export const SPONSOR_ACTIVITIES = ['boxing', 'gym', 'commentary'] as const;
export const SPONSOR_OBJECTIVES = [
  'visibility',
  'image',
  'community',
  'content',
  'events',
  'hospitality',
  'recruitment',
  'other',
] as const;
export const SPONSOR_BUDGETS = ['lt_5k', '5k_15k', '15k_50k', '50k_150k', 'gt_150k', 'undisclosed'] as const;
export const COMPANY_SIZES = ['1-10', '11-50', '51-250', '251-1000', '1000+'] as const;

const httpUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\//)
  .max(300)
  .optional()
  .or(z.literal('').transform(() => undefined));

export const sponsorshipSchema = z.object({
  // Étape 1 — entreprise (+ logo, fichier hors schéma)
  companyName: requiredText(2, 160),
  companyWebsite: httpUrl,
  companySector: optionalText(120),
  companySize: z.enum(COMPANY_SIZES).optional().or(z.literal('').transform(() => undefined)),
  companyCountry: optionalText(80),
  // Étape 2 — contact
  contactName: requiredText(2, 120),
  contactRole: optionalText(120),
  email: emailField,
  phone: optionalText(40),
  // Étape 3 — partenariat
  packageTier: z.enum(SPONSOR_TIERS).optional().or(z.literal('').transform(() => undefined)),
  packageId: uuidField,
  activities: z.array(z.enum(SPONSOR_ACTIVITIES)).max(3),
  objectives: z.array(z.enum(SPONSOR_OBJECTIVES)).max(10),
  budgetRange: z.enum(SPONSOR_BUDGETS).optional().or(z.literal('').transform(() => undefined)),
  desiredStart: dateField,
  durationMonths: z
    .union([z.coerce.number().int().min(1).max(60), z.literal('').transform(() => undefined)])
    .optional(),
  // Étape 4 — présentation (+ pièce jointe, fichier hors schéma)
  presentation: requiredText(20, 5000),
  // Méta
  consent: consentField,
  website: honeypot,
});

export type SponsorshipFormValues = z.input<typeof sponsorshipSchema>;

/** Champs validés à chaque étape du formulaire sponsors (étape 5 = consentement + revue). */
export const SPONSOR_STEP_FIELDS = [
  ['companyName', 'companyWebsite', 'companySector', 'companySize', 'companyCountry'],
  ['contactName', 'contactRole', 'email', 'phone'],
  ['packageTier', 'packageId', 'activities', 'objectives', 'budgetRange', 'desiredStart', 'durationMonths'],
  ['presentation'],
  ['consent'],
] as const satisfies readonly (readonly (keyof SponsorshipFormValues)[])[];

// ------------------------------------------------------------------ Pièces jointes
/** Limites alignées sur le bucket `attachments` (10 Mo, MIME allowlist migration 0500). */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;
/** Logo : mêmes règles que le bucket privé `attachments` (il y est stocké). */
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Identifiants des champs fichier côté client → colonnes `logo_path` / `attachment_path`. */
export const SPONSOR_FILE_FIELDS = ['logo', 'attachment'] as const;
export type SponsorFileField = (typeof SPONSOR_FILE_FIELDS)[number];
