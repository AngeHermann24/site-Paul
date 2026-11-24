import type { Tables } from '@/integrations/supabase/database.types';
import { publicStorageUrl } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';
import type { ArticleCategory } from '@/types/domain';
import { allowDemoContent, pick, run, success, type ServiceResult } from './_shared';
import { sanitizeSearch, type LocalizedImage } from './fights';

export interface ArticleSummary {
  id: string;
  slug: string;
  category: ArticleCategory;
  title: string;
  excerpt: string | null;
  cover: LocalizedImage | null;
  authorName: string | null;
  tags: string[];
  publishedAt: string;
  isFeatured: boolean;
}

export interface Article extends ArticleSummary {
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

const SUMMARY_COLUMNS =
  'id, slug, category, title_fr, title_en, excerpt_fr, excerpt_en, cover_url, cover_alt_fr, cover_alt_en, author_name, tags, published_at, is_featured';

type SummaryRow = Pick<
  Tables<'articles'>,
  | 'id'
  | 'slug'
  | 'category'
  | 'title_fr'
  | 'title_en'
  | 'excerpt_fr'
  | 'excerpt_en'
  | 'cover_url'
  | 'cover_alt_fr'
  | 'cover_alt_en'
  | 'author_name'
  | 'tags'
  | 'published_at'
  | 'is_featured'
>;

function mapSummary(r: SummaryRow, lang: Lang): ArticleSummary {
  const cover = publicStorageUrl('media', r.cover_url);
  return {
    id: r.id,
    slug: r.slug,
    category: r.category as ArticleCategory,
    title: pick(lang, r.title_fr, r.title_en),
    excerpt: pick(lang, r.excerpt_fr, r.excerpt_en),
    cover: cover ? { url: cover, alt: pick(lang, r.cover_alt_fr, r.cover_alt_en) ?? '' } : null,
    authorName: r.author_name,
    tags: r.tags,
    // La contrainte articles_publish_requirements garantit published_at pour un article publié.
    publishedAt: r.published_at ?? '',
    isFeatured: r.is_featured,
  };
}

export interface ArticleFilters {
  category?: ArticleCategory;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Liste paginée (chargement progressif) avec recherche plein texte dans la langue courante. */
export async function listArticles(
  lang: Lang,
  filters: ArticleFilters = {},
): Promise<ServiceResult<{ items: ArticleSummary[]; total: number; hasMore: boolean }>> {
  const pageSize = filters.pageSize ?? 9;
  const page = Math.max(0, filters.page ?? 0);
  const from = page * pageSize;
  const res = await run(async (db) => {
    let q = db
      .from('articles')
      .select(SUMMARY_COLUMNS, { count: 'exact' })
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString());
    if (!allowDemoContent) q = q.eq('is_demo', false);
    if (filters.category) q = q.eq('category', filters.category);
    const search = filters.search ? sanitizeSearch(filters.search) : '';
    if (search) {
      q = q.textSearch(lang === 'fr' ? 'search_fr' : 'search_en', search, {
        type: 'websearch',
        config: lang === 'fr' ? 'french' : 'english',
      });
    }
    const { data, error, count } = await q.order('published_at', { ascending: false }).range(from, from + pageSize - 1);
    return { data: data ? { rows: data, count: count ?? 0 } : null, error };
  });
  if (res.error) return res;
  const items = res.data.rows.map((r) => mapSummary(r, lang));
  return success({ items, total: res.data.count, hasMore: from + items.length < res.data.count });
}

export async function getArticleBySlug(lang: Lang, slug: string): Promise<ServiceResult<Article>> {
  const res = await run<Tables<'articles'>>((db) => {
    let q = db.from('articles').select('*').eq('status', 'published').eq('slug', slug);
    if (!allowDemoContent) q = q.eq('is_demo', false);
    return q.maybeSingle();
  });
  if (res.error) return res;
  const r = res.data;
  return success({
    ...mapSummary(r, lang),
    body: pick(lang, r.body_fr, r.body_en) ?? '',
    seoTitle: pick(lang, r.seo_title_fr, r.seo_title_en),
    seoDescription: pick(lang, r.seo_description_fr, r.seo_description_en),
    updatedAt: r.updated_at,
  });
}
