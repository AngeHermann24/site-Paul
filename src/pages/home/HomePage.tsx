import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useLang, useLocalePath } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listArticles } from '@/services/articles';
import { listCommentaryEvents } from '@/services/editorial';
import { getFightStats, getLatestFight, getNextFight } from '@/services/fights';
import { LOCAL_IMAGES } from '@/config/media';
import { listMedia, localImage } from '@/services/media';
import { getProfile } from '@/services/profile';
import type { RouteKey } from '@/routes/paths';
import { formatDate } from '@/utils/format';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { Button } from '@/components/ui/Button/Button';
import { Heading } from '@/components/ui/Heading/Heading';
import { Section } from '@/components/ui/Section/Section';
import { RevealImage } from '@/components/motion/RevealImage/RevealImage';
import { ScrubText } from '@/components/motion/ScrubText/ScrubText';
import { ArticleCard } from '@/components/sections/ArticleCard/ArticleCard';
import { FightCard } from '@/components/sections/FightCard/FightCard';
import { MediaGallery } from '@/components/sections/MediaGallery/MediaGallery';
import { StatCounters } from '@/components/sections/StatCounters/StatCounters';
import { VideoBlock } from '@/components/sections/VideoBlock/VideoBlock';
import { Hero } from '@/features/home/Hero/Hero';
import { personJsonLd } from '@/utils/jsonLd';
import styles from './HomePage.module.css';

const ACTIVITIES: ReadonlyArray<{ key: RouteKey; role: 'boxer' | 'gymOwner' | 'commentator'; index: string }> = [
  { key: 'champion', role: 'boxer', index: '01' },
  { key: 'gym', role: 'gymOwner', index: '02' },
  { key: 'commentator', role: 'commentator', index: '03' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const lang = useLang();
  const to = useLocalePath();
  const settings = useSiteSettings();

  const profile = useServiceQuery(() => getProfile(lang), [lang]);
  const stats = useServiceQuery(() => getFightStats(), []);
  const latest = useServiceQuery(() => getLatestFight(lang), [lang]);
  const next = useServiceQuery(() => getNextFight(lang), [lang]);
  const gallery = useServiceQuery(() => listMedia(lang, { kind: 'image', featuredOnly: true, limit: 6 }), [lang]);
  const video = useServiceQuery(() => listMedia(lang, { kind: 'video', featuredOnly: true, limit: 1 }), [lang]);
  const events = useServiceQuery(() => listCommentaryEvents(lang, { limit: 4 }), [lang]);
  const news = useServiceQuery(() => listArticles(lang, { pageSize: 3 }), [lang]);

  const p = profile.status === 'success' ? profile.data : null;
  const portrait = p?.portrait ?? localImage(lang, LOCAL_IMAGES.portrait);
  const gymImage = settings?.gym.heroPoster ? { url: settings.gym.heroPoster, alt: t('media.placeholderAlt') } : localImage(lang, LOCAL_IMAGES.gym);

  return (
    <>
      <Seo jsonLd={personJsonLd(p, settings)} />
      <Hero nextId="presentation" />

      {/* 01 — Présentation : le seul paragraphe animé mot à mot du site */}
      <Section id="presentation" index="01" label={t('homePage.presentationLabel')} aria-labelledby="presentation-text">
        <div className={styles.presentation}>
          <div className={styles.presentationText}>
            <ScrubText id="presentation-text" text={p?.bioShort ?? t('home.manifesto')} className={styles.scrub} />
            <Button to={to('champion')} variant="link">
              {t('cta.discover')}
            </Button>
          </div>
          <RevealImage
            src={portrait.url}
            alt={portrait.alt || t('media.placeholderAlt')}
            placeholderLabel={t('media.placeholder')}
            ratio="4 / 5"
            className={styles.portrait}
            overlay={<span className={cx('mono', styles.tag)}>PAUL / 01</span>}
          />
        </div>
      </Section>

      {/* 02 — Statistiques (base uniquement) */}
      <Section index="02" label={t('homePage.statsLabel')} tone="elevated" aria-labelledby="stats-title">
        <Heading id="stats-title" size="3xl" className={styles.blockTitle}>
          {t('homePage.statsTitle')}
        </Heading>
        <DataState
          query={stats}
          isEmpty={(s) => s.overall.total === 0}
          emptyTitle={t('stats.empty')}
          loading={<Skeleton height="12rem" />}
        >
          {(s) => (
            <StatCounters
              note={t(s.source === 'official' ? 'stats.sourceOfficial' : 'stats.source')}
              items={[
                { key: 'total', label: t('stats.total'), value: s.overall.total },
                { key: 'wins', label: t('stats.wins'), value: s.overall.wins, accent: true },
                { key: 'ko', label: t('stats.koWins'), value: s.overall.koWins },
                { key: 'losses', label: t('stats.losses'), value: s.overall.losses },
                { key: 'draws', label: t('stats.draws'), value: s.overall.draws },
              ]}
            />
          )}
        </DataState>
      </Section>

      {/* 03 — Trois activités */}
      <Section index="03" label={t('home.activities')} aria-labelledby="activities-title">
        <Heading id="activities-title" size="3xl" className={styles.blockTitle}>
          {t('home.activitiesTitle')}
        </Heading>
        <ul role="list" className={styles.activities}>
          {ACTIVITIES.map((a) => (
            <li key={a.key}>
              <Link to={to(a.key)} className={styles.activity} data-cursor="link">
                <span className={cx('mono', styles.activityIndex)}>{a.index}</span>
                <span className={cx('display', styles.activityTitle)}>{t(`roles.${a.role}`)}</span>
                <ArrowUpRight className={styles.activityArrow} size={40} strokeWidth={1.25} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 04 — Dernier combat / prochain combat (seulement s'il existe) */}
      <Section index="04" label={t('homePage.fightsLabel')} divider aria-label={t('homePage.fightsLabel')}>
        <div className={styles.fights}>
          <DataState query={next} hideWhenEmpty loading={null}>
            {(fight) =>
              fight && (
                <div className={styles.fightBlock}>
                  <p className={cx('mono', styles.fightLabel)}>
                    <span className={styles.live} aria-hidden="true" />
                    {t('fight.next')} — {formatDate(lang, fight.eventDate)}
                  </p>
                  <FightCard fight={fight} variant="feature" headingLevel="h2" />
                </div>
              )
            }
          </DataState>
          <div className={styles.fightBlock}>
            <p className={cx('mono', styles.fightLabel)}>{t('fight.latest')}</p>
            <DataState query={latest} loading={<Skeleton height="22rem" />}>
              {(fight) => fight && <FightCard fight={fight} variant="feature" headingLevel="h2" />}
            </DataState>
          </div>
          <Button to={to('fights')} variant="ghost">
            {t('fight.back')}
          </Button>
        </div>
      </Section>

      {/* 05 — Galerie */}
      <Section index="05" label={t('homePage.galleryLabel')} aria-labelledby="gallery-title">
        <Heading id="gallery-title" size="3xl" className={styles.blockTitle}>
          {t('homePage.galleryTitle')}
        </Heading>
        <DataState query={gallery} isEmpty={(g) => g.items.length === 0}>
          {(g) => <MediaGallery items={g.items} layout="mosaic" />}
        </DataState>
        <div className={styles.more}>
          <Button to={to('media')} variant="link">
            {t('nav.media')}
          </Button>
        </div>
      </Section>

      {/* 06 — Paul Gym */}
      <Section index="06" label={t('homePage.gymLabel')} tone="elevated" aria-labelledby="gym-title">
        <div className={styles.split}>
          <div className={styles.splitText}>
            <Heading id="gym-title" size="2xl">
              {t('homePage.gymTitle')}
            </Heading>
            <p className={styles.lead}>{settings?.gym.story ? settings.gym.story.split('\n')[0] : t('homePage.gymBody')}</p>
            <div className={styles.ctaRow}>
              <Button to={to('gym')} variant="primary">
                {t('cta.joinGym')}
              </Button>
            </div>
          </div>
          <RevealImage
            src={gymImage.url}
            alt={gymImage.alt}
            placeholderLabel={t('media.placeholder')}
            ratio="16 / 11"
          />
        </div>
      </Section>

      {/* 07 — Commentateur */}
      <Section index="07" label={t('homePage.commentatorLabel')} aria-labelledby="commentator-title">
        <div className={styles.split}>
          <div className={styles.splitText}>
            <Heading id="commentator-title" size="2xl">
              {t('homePage.commentatorTitle')}
            </Heading>
            <p className={styles.lead}>{t('homePage.commentatorBody')}</p>
            <Button to={to('commentator')} variant="primary">
              {t('cta.bookCommentator')}
            </Button>
          </div>
          <DataState query={events} loading={<Skeleton height="16rem" />}>
            {(list) => (
              <ol className={styles.events}>
                {list.map((e) => (
                  <li key={e.id} className={styles.eventRow}>
                    <span className="mono">{e.eventDate ? formatDate(lang, e.eventDate, 'month') : '—'}</span>
                    <span className={cx('display', styles.eventName)}>{e.eventName}</span>
                    <span className={cx('mono', styles.eventRole)}>{t(`enums.commentaryRole.${e.role}`)}</span>
                  </li>
                ))}
              </ol>
            )}
          </DataState>
        </div>
      </Section>

      {/* 08 — Vidéo mise en avant (seulement si elle existe) */}
      <DataState query={video} isEmpty={(v) => v.items.length === 0} hideWhenEmpty loading={null}>
        {(v) =>
          v.items[0] && (
            <Section index="08" label={t('homePage.videoLabel')} spacing="tight" aria-label={t('homePage.videoLabel')}>
              <VideoBlock url={v.items[0].url} poster={v.items[0].posterUrl} title={v.items[0].title ?? t('homePage.videoLabel')} />
            </Section>
          )
        }
      </DataState>

      {/* 09 — Actualités */}
      <Section index="09" label={t('homePage.newsLabel')} divider aria-labelledby="news-title">
        <div className={styles.newsHead}>
          <Heading id="news-title" size="3xl">
            {t('homePage.newsTitle')}
          </Heading>
          <Button to={to('news')} variant="link">
            {t('homePage.allNews')}
          </Button>
        </div>
        <DataState query={news} isEmpty={(n) => n.items.length === 0}>
          {(n) => (
            <div className={styles.newsGrid}>
              {n.items.map((a, i) => (
                <ArticleCard key={a.id} article={a} index={i} />
              ))}
            </div>
          )}
        </DataState>
      </Section>

      {/* 10 — Sponsoring */}
      <Section index="10" label={t('homePage.sponsorLabel')} tone="elevated" aria-labelledby="sponsor-title">
        <div className={styles.sponsor}>
          <Heading id="sponsor-title" size="3xl">
            {t('homePage.sponsorTitle')}
          </Heading>
          <div className={styles.sponsorSide}>
            <p className={styles.lead}>{t('homePage.sponsorBody')}</p>
            <div className={styles.ctaRow}>
              <Button to={to('sponsors')} variant="primary" size="lg">
                {t('cta.becomePartner')}
              </Button>
              <Button to={to('contact')} variant="ghost" size="lg">
                {t('nav.contact')}
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
