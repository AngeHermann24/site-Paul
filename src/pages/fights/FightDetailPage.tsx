import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useLang, useLocalePath } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { getFightBySlug } from '@/services/fights';
import { listMedia } from '@/services/media';
import { daysUntil, formatDate } from '@/utils/format';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { RichText } from '@/components/data/RichText/RichText';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Section } from '@/components/ui/Section/Section';
import { Container } from '@/components/ui/Container/Container';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { MediaGallery } from '@/components/sections/MediaGallery/MediaGallery';
import { VideoBlock } from '@/components/sections/VideoBlock/VideoBlock';
import styles from './FightDetailPage.module.css';

export default function FightDetailPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const to = useLocalePath();
  const { slug = '' } = useParams();

  const fight = useServiceQuery(() => getFightBySlug(lang, slug), [lang, slug]);
  const f = fight.status === 'success' ? fight.data : null;
  const media = useServiceQuery(() => (f ? listMedia(lang, { fightId: f.id, limit: 12 }) : Promise.resolve({ data: { items: [], total: 0 }, error: null })), [lang, f?.id]);

  if (fight.status === 'loading') {
    return (
      <Section spacing="tight">
        <Skeleton height="60vh" />
      </Section>
    );
  }

  if (fight.status === 'error' || !f) {
    return (
      <Section spacing="tight">
        <Seo title={t('fight.notFoundTitle')} noindex />
        <EmptyState
          title={t('fight.notFoundTitle')}
          body={t('fight.notFoundBody')}
          action={
            <Button to={to('fights')} variant="ghost" icon={<ArrowLeft size={18} aria-hidden="true" />}>
              {t('fight.back')}
            </Button>
          }
        />
      </Section>
    );
  }

  const place = [f.city, f.country].filter(Boolean).join(', ');
  const days = f.fightStatus === 'scheduled' ? daysUntil(f.eventDate) : null;
  const outcome =
    f.fightStatus === 'completed' && f.result
      ? {
          short: t(`enums.fightResultShort.${f.result}`),
          long: [
            t(`enums.fightResult.${f.result}`),
            f.method && t(`enums.fightMethod.${f.method}`),
            f.roundEnded && t('fight.round', { round: f.roundEnded }),
            f.timeEnded && `${t('fight.time')} ${f.timeEnded}`,
          ]
            .filter(Boolean)
            .join(' · '),
        }
      : null;

  const details: Array<{ label: string; value: string }> = [
    { label: t('fight.date'), value: formatDate(lang, f.eventDate) },
    f.eventName && { label: t('fight.event'), value: f.eventName },
    f.venue && { label: t('fight.venue'), value: f.venue },
    place && { label: t('fight.place'), value: place },
    { label: t('fight.category'), value: t(`enums.fightCategory.${f.category}`) },
    f.weightClass && { label: t('fight.weightClass'), value: f.weightClass },
    f.isTitleFight && f.titleName && { label: t('fight.title'), value: f.titleName },
    f.opponentRecord && { label: t('fight.opponentRecord'), value: f.opponentRecord },
    f.roundsScheduled && { label: 'Rounds', value: String(f.roundsScheduled) },
  ].filter((d): d is { label: string; value: string } => Boolean(d));

  return (
    <>
      <Seo title={`${t('fight.vs')} ${f.opponentName}`} description={f.summary ?? t('pages.fights.intro')} />

      {/* En-tête de la fiche */}
      <header className={styles.hero}>
        <Container>
          <Eyebrow index={t(`enums.fightCategory.${f.category}`)} label={f.eventName ?? t('nav.fights')} />
          <h1 className={cx('display', styles.title)}>
            <span className={styles.vs}>{t('fight.vs')}</span> {f.opponentName}
          </h1>
          <div className={styles.metaRow}>
            <time dateTime={f.eventDate} className={cx('mono', styles.meta)}>
              {formatDate(lang, f.eventDate)}
            </time>
            {place && <span className={cx('mono', styles.meta)}>{place}</span>}
            {f.isTitleFight && <span className={cx('mono', styles.titleFight)}>{f.titleName ?? 'TITLE'}</span>}
          </div>

          {outcome ? (
            <p className={cx('display', styles.outcome, styles[f.result ?? ''])}>
              <span className={styles.outcomeShort}>{outcome.short}</span>
              <span className={styles.outcomeLong}>{outcome.long}</span>
            </p>
          ) : (
            <p className={cx('display', styles.outcome, styles.pending)}>
              <span className={styles.outcomeShort}>{days === 0 ? t('fight.countdown') : days !== null && days > 0 ? t('fight.inDays', { count: days }) : t(`enums.fightStatus.${f.fightStatus}`)}</span>
              {f.ticketUrl && (
                <Button href={f.ticketUrl} variant="primary" size="lg">
                  {t('fight.tickets')}
                </Button>
              )}
            </p>
          )}
        </Container>
      </header>

      {/* Détails */}
      <Section index="01" label={t('pages.fights.title')} spacing="tight" aria-label={t('pages.fights.title')}>
        <dl className={styles.details}>
          {details.map((d, i) => (
            <div key={`${d.label}-${i}`} className={styles.detail}>
              <dt className={cx('mono', styles.detailLabel)}>{d.label}</dt>
              <dd className={cx('display', styles.detailValue)}>{d.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Résumé */}
      {f.summary && (
        <Section index="02" label={t('fight.summary')} divider aria-labelledby="summary-title">
          <h2 id="summary-title" className={cx('display', styles.sectionTitle)}>
            {t('fight.summary')}
          </h2>
          <RichText text={f.summary} />
        </Section>
      )}

      {/* Vidéo */}
      {f.videoUrl && (
        <Section index="03" label={t('fight.watch')} spacing="tight" aria-label={t('fight.watch')}>
          <VideoBlock url={f.videoUrl} poster={f.cover?.url} title={`${t('fight.vs')} ${f.opponentName}`} />
        </Section>
      )}

      {/* Médias du combat */}
      <DataState query={media} isEmpty={(m) => m.items.length === 0} hideWhenEmpty loading={null}>
        {(m) => (
          <Section index="04" label={t('fight.media')} divider aria-label={t('fight.media')}>
            <MediaGallery items={m.items} layout="grid" />
          </Section>
        )}
      </DataState>

      <Section spacing="tight">
        <Button to={to('fights')} variant="ghost" icon={<ArrowLeft size={18} aria-hidden="true" />}>
          {t('fight.back')}
        </Button>
      </Section>
    </>
  );
}
