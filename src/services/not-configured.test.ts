import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/env', () => ({
  env: { siteUrl: '', supabaseUrl: '', supabaseAnonKey: '', turnstileSiteKey: '' },
  isSupabaseConfigured: false,
}));

describe('sans clés Supabase', () => {
  it('renvoie une erreur honnête « not_configured », sans appel réseau ni données simulées', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { listFights } = await import('./fights');
    const { submitContactMessage } = await import('./requests');

    const read = await listFights('fr');
    const write = await submitContactMessage({
      type: 'other',
      full_name: 'Test',
      email: 't@example.com',
      subject: 'Test',
      message: 'Message de test',
      consent: true,
    });

    expect(read).toEqual({ data: null, error: expect.objectContaining({ kind: 'not_configured' }) });
    expect(write.error?.kind).toBe('not_configured');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
