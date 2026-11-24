import { LOCAL_IMAGES, type LocalImage } from '@/config/media';
import { publicStorageUrl } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';
import type { LocalizedImage } from './fights';
import type { MediaCategory, MediaKind } from '@/types/domain';
import { allowDemoContent, pick, run, success, type ServiceResult } from './_shared';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  category: MediaCategory;
  title: string | null;
  alt: string;
  caption: string | null;
  url: string;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  takenOn: string | null;
  credit: string | null;
  fightId: string | null;
  isFeatured: boolean;
}

export interface MediaFilters {
  kind?: MediaKind;
  category?: MediaCategory;
  fightId?: string;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}

export function localImage(lang: Lang, img: LocalImage): LocalizedImage {
  return { url: img.src, alt: img.alt[lang] };
}

/** Photos de `public/media/` correspondant aux filtres (1re page uniquement, jamais liées à un combat). */
function localMediaItems(lang: Lang, filters: MediaFilters): MediaItem[] {
  if (filters.fightId || (filters.offset ?? 0) > 0 || (filters.kind && filters.kind !== 'image')) return [];
  return Object.values(LOCAL_IMAGES as Record<string, LocalImage>)
    .filter((img) => !filters.category || img.category === filters.category)
    .map((img) => ({
      id: img.id,
      kind: 'image',
      category: img.category,
      title: null,
      alt: img.alt[lang],
      caption: null,
      url: img.src,
      posterUrl: null,
      width: img.width,
      height: img.height,
      durationSeconds: null,
      takenOn: null,
      credit: null,
      fightId: null,
      isFeatured: true,
    }));
}

export async function listMedia(lang: Lang, filters: MediaFilters = {}): Promise<ServiceResult<{ items: MediaItem[]; total: number }>> {
  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;
  const local = localMediaItems(lang, filters);
  const db = await run(async (client) => {
    let q = client.from('media').select('*', { count: 'exact' }).eq('status', 'published');
    if (!allowDemoContent) q = q.eq('is_demo', false);
    if (filters.kind) q = q.eq('kind', filters.kind);
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.fightId) q = q.eq('fight_id', filters.fightId);
    if (filters.featuredOnly) q = q.eq('is_featured', true);
    const { data, error, count } = await q.order('sort_order').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    return { data: data ? { rows: data, count: count ?? data.length } : null, error };
  });
  if (db.error) return local.length ? success({ items: local, total: local.length }) : db;
  const items = db.data.rows.flatMap((r): MediaItem[] => {
    const url = r.external_url ?? publicStorageUrl('media', r.storage_path);
    if (!url) return [];
    return [
      {
        id: r.id,
        kind: r.kind as MediaKind,
        category: r.category as MediaCategory,
        title: pick(lang, r.title_fr, r.title_en),
        alt: pick(lang, r.alt_fr, r.alt_en) ?? '',
        caption: pick(lang, r.caption_fr, r.caption_en),
        url,
        posterUrl: publicStorageUrl('media', r.poster_url),
        width: r.width,
        height: r.height,
        durationSeconds: r.duration_seconds,
        takenOn: r.taken_on,
        credit: r.credit,
        fightId: r.fight_id,
        isFeatured: r.is_featured,
      },
    ];
  });
  return success({ items: [...local, ...items], total: db.data.count + local.length });
}
