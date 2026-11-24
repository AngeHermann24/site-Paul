import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listPerformanceContents } from '@/services/editorial';
import { listMedia } from '@/services/media';
import { PAGE_HERO_IMAGES } from '@/config/media';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { RichText } from '@/components/data/RichText/RichText';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { Heading } from '@/components/ui/Heading/Heading';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { RevealImage } from '@/components/motion/RevealImage/RevealImage';
import { MediaGallery } from '@/components/sections/MediaGallery/MediaGallery';
import { VideoBlock } from '@/components/sections/VideoBlock/VideoBlock';
import styles from './PerformancePage.module.css';

export default function PerformancePage() {
  const { t } = useTranslation();
  const lang = useLang();

  const contents = useServiceQuery(() => listPerformanceContents(lang), [lang]);
  const gallery = useServiceQuery(() => listMedia(lang, { kind: 'image', category: 'training', limit: 8 }), [lang]);

  const items = contents.status === 'success' ? contents.data : [];
  const advice = items.filter((c) => c.category === 'advice');
  const pillars = items.filter((c) => c.category !== 'advice');

  return (
    <>
      <Seo title={t('pages.performance.title')} description={t('pages.performance.intro')} />
      <PageHero index="03" label={t('nav.performance')} title={t('pages.performance.title')} intro={t('pages.performance.intro')} image={PAGE_HERO_IMAGES.performance} />

      {/* 01 — Les piliers : contenus éditoriaux de la base */}
      <Section index="01" label={t('performancePage.pillars')} spacing="tight" aria-label={t('performancePage.pillars')}>
        <DataState query={contents} isEmpty={(c) => c.length === 0} loading={<Skeleton height="24rem" />}>
          {() => (
            <div className={styles.pillars}>
              {pillars.map((c, i) => (
                <article key={c.id} className={cx(styles.pillar, i % 2 === 1 && styles.pillarFlip)}>
                  <div className={styles.pillarText}>
                    <p className={cx('mono', styles.pillarMeta)}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <span>{t(`enums.performanceCategory.${c.category}`)}</span>
                    </p>
                    <h2 className={cx('display', styles.pillarTitle)}>{c.title}</h2>
                    {c.excerpt && <p className={styles.pillarExcerpt}>{c.excerpt}</p>}
                    {c.body && <RichText text={c.body} className={styles.pillarBody} />}
                  </div>
                  <div className={styles.pillarMedia}>
                    {c.videoUrl ? (
                      <VideoBlock url={c.videoUrl} poster={c.cover?.url} title={c.title} />
                    ) : (
                      <RevealImage src={c.cover?.url} alt={c.cover?.alt || c.title} placeholderLabel={t('media.placeholder')} ratio="4 / 5" />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </DataState>
      </Section>

      {/* 02 — Conseils (catégorie dédiée, affichage distinct) */}
      {advice.length > 0 && (
        <Section index="02" label={t('performancePage.advice')} tone="elevated" aria-labelledby="advice-title">
          <Heading id="advice-title" size="2xl" className={styles.blockTitle}>
            {t('performancePage.advice')}
          </Heading>
          <ul role="list" className={styles.advice}>
            {advice.map((c) => (
              <li key={c.id} className={styles.adviceItem}>
                <h3 className={cx('display', styles.adviceTitle)}>{c.title}</h3>
                {c.excerpt && <p className={styles.adviceExcerpt}>{c.excerpt}</p>}
                {c.body && <RichText text={c.body} />}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 03 — Galerie entraînement */}
      <Section index="03" label={t('performancePage.gallery')} divider aria-labelledby="perf-gallery-title">
        <Heading id="perf-gallery-title" size="2xl" className={styles.blockTitle}>
          {t('performancePage.gallery')}
        </Heading>
        <DataState query={gallery} isEmpty={(g) => g.items.length === 0}>
          {(g) => <MediaGallery items={g.items} layout="grid" />}
        </DataState>
      </Section>
    </>
  );
}
