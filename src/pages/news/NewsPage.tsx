import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listArticles, type ArticleSummary } from '@/services/articles';
import { PAGE_HERO_IMAGES } from '@/config/media';
import type { ArticleCategory } from '@/types/domain';
import { Seo } from '@/components/system/Seo/Seo';
import { SkeletonGrid } from '@/components/data/Skeleton/Skeleton';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { ArticleCard } from '@/components/sections/ArticleCard/ArticleCard';
import { ChipGroup, FilterBar } from '@/components/sections/FilterBar/FilterBar';
import styles from './NewsPage.module.css';

const CATEGORIES: ArticleCategory[] = ['news', 'fight', 'gym', 'commentary', 'partnership', 'press'];
const PAGE_SIZE = 9;

export default function NewsPage() {
  const { t } = useTranslation();
  const lang = useLang();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ArticleCategory | null>(null);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Nouveau filtre → on repart de la première page.
  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [search, category, lang]);

  const query = useServiceQuery(
    () => listArticles(lang, { category: category ?? undefined, search: search || undefined, page, pageSize: PAGE_SIZE }),
    [lang, category, search, page],
  );

  // Chargement progressif : les pages s'accumulent (dédoublonnées par id).
  useEffect(() => {
    if (query.status === 'success') {
      const incoming = query.data.items;
      setItems((prev) => {
        if (page === 0) return incoming;
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...incoming.filter((a) => !seen.has(a.id))];
      });
    }
  }, [query.status, query.data, page]);

  const hasFilters = Boolean(search || category);
  const reset = () => {
    setSearchInput('');
    setSearch('');
    setCategory(null);
  };
  const loading = query.status === 'loading';
  const total = query.status === 'success' ? query.data.total : null;
  const hasMore = query.status === 'success' && query.data.hasMore;
  const empty = query.status === 'success' && items.length === 0;

  return (
    <>
      <Seo title={t('pages.news.title')} description={t('pages.news.intro')} />
      <PageHero index="06" label={t('nav.news')} title={t('pages.news.title')} intro={t('pages.news.intro')} image={PAGE_HERO_IMAGES.news} />

      <Section index="01" spacing="tight" aria-label={t('nav.news')}>
        <FilterBar
          search={searchInput}
          onSearch={setSearchInput}
          searchPlaceholder={t('filters.searchNews')}
          count={total}
          onReset={reset}
          hasActiveFilters={hasFilters}
        >
          <ChipGroup
            label={t('filters.category')}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`enums.articleCategory.${c}`) }))}
            value={category}
            onChange={setCategory}
          />
        </FilterBar>

        <div className={styles.results}>
          {loading && page === 0 ? (
            <SkeletonGrid count={6} ratio="4 / 5" />
          ) : empty ? (
            <EmptyState title={hasFilters ? t('filters.noResults') : t('data.soon')} body={hasFilters ? undefined : t('data.soonBody')} />
          ) : query.status === 'error' ? (
            <EmptyState
              title={t('data.error')}
              action={
                <Button variant="ghost" onClick={query.reload} icon={null}>
                  {t('data.retry')}
                </Button>
              }
            />
          ) : (
            <>
              <div className={styles.grid}>
                {items.map((a, i) => (
                  <ArticleCard key={a.id} article={a} index={i} titleLevel={2} />
                ))}
              </div>
              {hasMore && (
                <div className={styles.more}>
                  <Button variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={loading}>
                    {loading ? t('data.loading') : t('newsPage.loadMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Section>
    </>
  );
}
