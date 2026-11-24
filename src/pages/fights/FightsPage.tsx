import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { getFightStats, listFights } from '@/services/fights';
import { PAGE_HERO_IMAGES } from '@/config/media';
import type { FightCategory, FightResult } from '@/types/domain';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { Heading } from '@/components/ui/Heading/Heading';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { FightCard } from '@/components/sections/FightCard/FightCard';
import { ChipGroup, FilterBar } from '@/components/sections/FilterBar/FilterBar';
import { StatCounters } from '@/components/sections/StatCounters/StatCounters';
import styles from './FightsPage.module.css';

const RESULTS: FightResult[] = ['win', 'loss', 'draw', 'no_contest'];
const CATEGORIES: FightCategory[] = ['professional', 'amateur', 'exhibition'];

export default function FightsPage() {
  const { t } = useTranslation();
  const lang = useLang();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<FightResult | null>(null);
  const [category, setCategory] = useState<FightCategory | null>(null);

  // Recherche anti-rebond : la requête part 300 ms après la dernière frappe.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const stats = useServiceQuery(() => getFightStats(), []);
  const upcoming = useServiceQuery(() => listFights(lang, { fightStatus: 'scheduled', ascending: true }), [lang]);
  const fights = useServiceQuery(
    () => listFights(lang, { result: result ?? undefined, category: category ?? undefined, search: search || undefined }),
    [lang, result, category, search],
  );

  const hasFilters = Boolean(search || result || category);
  const reset = () => {
    setSearchInput('');
    setSearch('');
    setResult(null);
    setCategory(null);
  };

  const categories = useMemo(() => {
    if (stats.status !== 'success') return [];
    return CATEGORIES.filter((c) => stats.data.byCategory[c]);
  }, [stats]);

  return (
    <>
      <Seo title={t('pages.fights.title')} description={t('pages.fights.intro')} />
      <PageHero index="02" label={t('nav.fights')} title={t('pages.fights.title')} intro={t('pages.fights.intro')} image={PAGE_HERO_IMAGES.fights} />

      {/* 01 — Bilan de carrière (base uniquement) */}
      <Section index="01" label={t('fightsPage.record')} spacing="tight" aria-labelledby="record-title">
        <Heading id="record-title" size="xl" className={styles.blockTitle}>
          {t('fightsPage.record')}
        </Heading>
        <DataState query={stats} isEmpty={(s) => s.overall.total === 0} emptyTitle={t('stats.empty')} loading={<Skeleton height="12rem" />}>
          {(s) => (
            <>
              <StatCounters
                note={t(s.source === 'official' ? 'stats.sourceOfficial' : 'stats.source')}
                items={[
                  { key: 'total', label: t('stats.total'), value: s.overall.total },
                  { key: 'wins', label: t('stats.wins'), value: s.overall.wins, accent: true },
                  { key: 'ko', label: t('stats.koWins'), value: s.overall.koWins },
                  { key: 'losses', label: t('stats.losses'), value: s.overall.losses },
                  { key: 'draws', label: t('stats.draws'), value: s.overall.draws },
                  { key: 'titles', label: t('stats.titleFights'), value: s.overall.titleFights },
                ]}
              />
              {categories.length > 0 && (
                <ul className={styles.byCategory}>
                  {categories.map((c) => {
                    const r = s.byCategory[c]!;
                    return (
                      <li key={c} className={styles.categoryRow}>
                        <span className={cx('mono', styles.categoryName)}>{t(`enums.fightCategory.${c}`)}</span>
                        <span className={cx('display', styles.categoryRecord)}>
                          {r.wins} — {r.losses} — {r.draws}
                          {r.noContests > 0 ? ` — ${r.noContests}` : ''}
                        </span>
                        <span className={cx('mono', styles.categoryLegend)}>W — L — D{r.noContests > 0 ? ' — NC' : ''}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </DataState>
      </Section>

      {/* 02 — Combats à venir (seulement s'il en existe) */}
      <DataState query={upcoming} isEmpty={(f) => f.length === 0} hideWhenEmpty loading={null}>
        {(list) => (
          <Section index="02" label={t('fightsPage.upcoming')} tone="elevated" aria-labelledby="upcoming-title">
            <Heading id="upcoming-title" size="xl" className={styles.blockTitle}>
              {t('fightsPage.upcoming')}
            </Heading>
            <ul role="list" className={styles.upcoming}>
              {list.map((f) => (
                <li key={f.id}>
                  <FightCard fight={f} variant="feature" headingLevel="h3" />
                </li>
              ))}
            </ul>
          </Section>
        )}
      </DataState>

      {/* 03 — Tous les combats */}
      <Section index="03" label={t('fightsPage.list')} divider aria-labelledby="list-title">
        <Heading id="list-title" size="2xl" className={styles.blockTitle}>
          {t('fightsPage.list')}
        </Heading>
        <FilterBar
          search={searchInput}
          onSearch={setSearchInput}
          searchPlaceholder={t('filters.searchFights')}
          count={fights.status === 'success' ? fights.data.length : null}
          onReset={reset}
          hasActiveFilters={hasFilters}
        >
          <ChipGroup
            label={t('filters.result')}
            options={RESULTS.map((r) => ({ value: r, label: t(`enums.fightResult.${r}`) }))}
            value={result}
            onChange={setResult}
          />
          <ChipGroup
            label={t('filters.category')}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`enums.fightCategory.${c}`) }))}
            value={category}
            onChange={setCategory}
          />
        </FilterBar>

        <div className={styles.results}>
          <DataState
            query={fights}
            isEmpty={(f) => f.length === 0}
            emptyTitle={hasFilters ? t('filters.noResults') : t('data.soon')}
            emptyBody={hasFilters ? undefined : t('data.soonBody')}
            loading={<Skeleton height="20rem" />}
          >
            {(list) => (
              <ul role="list" className={styles.grid}>
                {list.map((f) => (
                  <li key={f.id}>
                    <FightCard fight={f} variant="grid" />
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </div>
      </Section>
    </>
  );
}
