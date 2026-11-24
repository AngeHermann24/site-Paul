import { describe, expect, it } from 'vitest';
import { buildPayload, initialValues, missingRequired } from './ResourceForm';
import type { FieldDef } from './resources';

const F = (partial: Partial<FieldDef> & Pick<FieldDef, 'key' | 'type'>): FieldDef => ({ label: { fr: 'L', en: 'L' }, ...partial });

describe('admin ResourceForm helpers', () => {
  const fields: FieldDef[] = [
    F({ key: 'slug', type: 'slug', required: true }),
    F({ key: 'title', type: 'text', localized: true, required: true }),
    F({ key: 'bio', type: 'richtext', localized: true }),
    F({ key: 'price_cents', type: 'number' }),
    F({ key: 'is_active', type: 'checkbox' }),
    F({ key: 'tags', type: 'tags' }),
  ];

  it('buildPayload : garde les colonnes du form, vide → null (sauf requis)', () => {
    const p = buildPayload(fields, { slug: 'x', title_fr: 'T', title_en: '', bio_fr: '', price_cents: '', is_active: true, tags: ['a', 'b'] });
    expect(p.slug).toBe('x');
    expect(p.title_fr).toBe('T');
    expect(p.title_en).toBe(''); // requis → chaîne vide conservée
    expect(p.bio_fr).toBeNull();
    expect(p.bio_en).toBeNull();
    expect(p.price_cents).toBeNull();
    expect(p.is_active).toBe(true);
    expect(p.tags).toEqual(['a', 'b']);
    expect('extra' in p).toBe(false);
  });

  it('missingRequired : signale chaque colonne requise vide (bilingue inclus)', () => {
    const m = missingRequired(fields, { slug: 'ok', title_fr: 'T', title_en: '' }, 'fr');
    expect(m).toEqual(['L']);
    expect(missingRequired(fields, { slug: '', title_fr: 'a', title_en: 'b' }, 'en')).toEqual(['L']);
    expect(missingRequired(fields, { slug: 'a', title_fr: 'a', title_en: 'b' }, 'fr')).toEqual([]);
  });

  it('initialValues : défauts de création (checkbox false, status draft, sinon null)', () => {
    const v = initialValues([F({ key: 'status', type: 'select' }), F({ key: 'is_demo', type: 'checkbox' }), F({ key: 'name', type: 'text', localized: true })], null);
    expect(v).toEqual({ status: 'draft', is_demo: false, name_fr: null, name_en: null });
  });

  it('initialValues : reprend la ligne existante', () => {
    const v = initialValues(fields, { slug: 'abc', is_active: true, tags: ['x'] });
    expect(v.slug).toBe('abc');
    expect(v.is_active).toBe(true);
    expect(v.tags).toEqual(['x']);
  });
});
