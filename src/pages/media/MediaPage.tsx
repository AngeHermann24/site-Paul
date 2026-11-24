import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listMedia, type MediaItem } from '@/services/media';
import { PAGE_HERO_IMAGES } from '@/config/media';
import type { MediaCategory, MediaKind } from '@/types/domain';
import { Seo } from '@/components/system/Seo/Seo';
import { SkeletonGrid } from '@/components/data/Skeleton/Skeleton';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { ChipGroup, FilterBar } from '@/components/sections/FilterBar/FilterBar';
import { MediaGallery } from '@/components/sections/MediaGallery/MediaGallery';
import styles from './MediaPage.module.css';

const KINDS: MediaKind[] = ['image', 'video', 'audio'];
const CATEGORIES: MediaCategory[] = ['fight', 'training', 'gym', 'commentary', 'event', 'portrait', 'press', 'other'];
const PAGE_SIZE = 12;

export default function MediaPage() {
  const { t } = useTranslation();
  const lang = useLang();

  const [kind, setKind] = useState<MediaKind | null>(null);
  const [category, setCategory] = useState<MediaCategory | null>(null);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    setOffset(0);
    setItems([]);
  }, [kind, category, lang]);

  const query = useServiceQuery(
    () => listMedia(lang, { kind: kind ?? undefined, category: category ?? undefined, limit: PAGE_SIZE, offset }),
    [lang, kind, category, offset],
  );

  useEffect(() => {
    if (query.status === 'success') {
      const incoming = query.data.items;
      setItems((prev) => {
        if (offset === 0) return incoming;
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
      });
    }
  }, [query.status, query.data, offset]);

  const hasFilters = Boolean(kind || category);
  const reset = () => {
    setKind(null);
    setCategory(null);
  };
  const loading = query.status === 'loading';
  const total = query.status === 'success' ? query.data.total : null;
  const hasMore = total !== null && items.length < total;
  const empty = query.status === 'success' && items.length === 0;

  return (
    <>
      <Seo title={t('pages.media.title')} description={t('pages.media.intro')} />
      <PageHero index="07" label={t('nav.media')} title={t('pages.media.title')} intro={t('pages.media.intro')} image={PAGE_HERO_IMAGES.media} />

      <Section index="01" spacing="tight" aria-label={t('nav.media')}>
        <FilterBar count={total} onReset={reset} hasActiveFilters={hasFilters}>
          <ChipGroup
            label={t('filters.kind')}
            options={KINDS.map((k) => ({ value: k, label: t(`enums.mediaKind.${k}`) }))}
            value={kind}
            onChange={setKind}
          />
          <ChipGroup
            label={t('filters.category')}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`enums.mediaCategory.${c}`) }))}
            value={category}
            onChange={setCategory}
          />
        </FilterBar>

        <div className={styles.results}>
          {loading && offset === 0 ? (
            <SkeletonGrid count={8} ratio="1 / 1" />
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
              <MediaGallery items={items} layout="grid" />
              {hasMore && (
                <div className={styles.more}>
                  <Button variant="ghost" onClick={() => setOffset((o) => o + PAGE_SIZE)} disabled={loading}>
                    {loading ? t('data.loading') : t('mediaPage.loadMore')}
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
