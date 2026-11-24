/**
 * Tests des schémas de demandes publiques (miroir des CHECK SQL).
 * Le miroir serveur snake_case vit dans supabase/functions/_shared/request-schemas.ts.
 */
import { describe, expect, it } from 'vitest';
import {
  ATTACHMENT_MAX_BYTES,
  LOGO_MAX_BYTES,
  bookingSchema,
  contactSchema,
  gymRegistrationSchema,
  sponsorshipSchema,
} from './requests';

const base = { consent: true, website: '' };

describe('contactSchema', () => {
  const valid = {
    ...base,
    type: 'booking',
    fullName: 'Jean Dupont',
    email: 'jean@example.com',
    subject: 'Un sujet',
    message: 'Un message suffisamment long.',
  };
  it('accepte un message valide', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it('refuse consentement absent, email invalide, honeypot rempli, message trop court', () => {
    for (const patch of [
      { consent: false },
      { email: 'pas-un-email' },
      { website: 'http://spam' },
      { message: 'court' },
      { type: 'inconnu' },
    ]) {
      expect(contactSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  });
});

describe('gymRegistrationSchema', () => {
  const valid = { ...base, fullName: 'Karim Test', email: 'k@example.com', preferredContact: 'email', disciplines: [] };
  it('accepte le minimal requis', () => {
    expect(gymRegistrationSchema.safeParse(valid).success).toBe(true);
  });
  it('refuse un niveau ou un contact préféré hors domaine', () => {
    expect(gymRegistrationSchema.safeParse({ ...valid, experienceLevel: 'pro' }).success).toBe(false);
    expect(gymRegistrationSchema.safeParse({ ...valid, preferredContact: 'sms' }).success).toBe(false);
  });
});

describe('bookingSchema', () => {
  const valid = {
    ...base,
    organizerName: 'Organisateur',
    email: 'o@example.com',
    eventName: 'Gala',
    message: 'Un message suffisamment long.',
  };
  it('accepte le minimal requis', () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });
  it('refuse les enums hors domaine et une date mal formée', () => {
    for (const patch of [
      { broadcastType: 'radio_fm' },
      { audienceSize: 'huge' },
      { budgetRange: 'gratuit' },
      { eventDate: '12/09/2026' },
    ]) {
      expect(bookingSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  });
});

describe('sponsorshipSchema', () => {
  const valid = {
    ...base,
    companyName: 'Acme',
    contactName: 'Claire',
    email: 'c@acme.example',
    presentation: 'Un projet de partenariat suffisamment détaillé.',
    activities: [],
    objectives: [],
  };
  it('accepte le minimal requis et convertit durationMonths chaîne → nombre', () => {
    const parsed = sponsorshipSchema.safeParse({ ...valid, durationMonths: '12' });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.durationMonths).toBe(12);
  });
  it('accepte chaîne vide → undefined pour les optionnels', () => {
    const parsed = sponsorshipSchema.safeParse({ ...valid, packageId: '', desiredStart: '', companySize: '' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.packageId).toBeUndefined();
      expect(parsed.data.desiredStart).toBeUndefined();
    }
  });
  it('refuse hors bornes : présentation courte, budget inconnu, durée > 60, uuid bidon, url non http', () => {
    for (const patch of [
      { presentation: 'trop court' },
      { budgetRange: 'illimite' },
      { durationMonths: '99' },
      { packageId: 'pas-un-uuid' },
      { companyWebsite: 'ftp://x' },
      { activities: ['mma'] },
    ]) {
      expect(sponsorshipSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  });
});

describe('limites fichiers', () => {
  it('logo ≤ pièce jointe, bornes alignées sur le bucket attachments', () => {
    expect(LOGO_MAX_BYTES).toBeLessThanOrEqual(ATTACHMENT_MAX_BYTES);
    expect(ATTACHMENT_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});
