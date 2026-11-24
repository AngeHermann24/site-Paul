import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listCommentaryEvents, listCommentaryServices } from '@/services/editorial';
import { getProfile } from '@/services/profile';
import { LOCAL_IMAGES, PAGE_HERO_IMAGES } from '@/config/media';
import { localImage } from '@/services/media';
import { formatDate } from '@/utils/format';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { RichText } from '@/components/data/RichText/RichText';
import { Skeleton, SkeletonGrid } from '@/components/data/Skeleton/Skeleton';
import { BookingForm } from '@/features/forms/BookingForm';
import { Button } from '@/components/ui/Button/Button';
import { Heading } from '@/components/ui/Heading/Heading';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { RevealImage } from '@/components/motion/RevealImage/RevealImage';
import { VideoBlock } from '@/components/sections/VideoBlock/VideoBlock';
import styles from './CommentatorPage.module.css';

export default function CommentatorPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const settings = useSiteSettings();

  const profile = useServiceQuery(() => getProfile(lang), [lang]);
  const events = useServiceQuery(() => listCommentaryEvents(lang), [lang]);
  const services = useServiceQuery(() => listCommentaryServices(lang), [lang]);

  const p = profile.status === 'success' ? profile.data : null;
  const portrait = p?.portrait ?? localImage(lang, LOCAL_IMAGES.victoire);
  const list = events.status === 'success' ? events.data : [];
  const disciplines = [...new Set(list.map((e) => e.discipline).filter((d): d is string => Boolean(d)))];
  const withVideo = list.filter((e) => e.videoUrl);
  const withAudio = list.filter((e) => e.audioUrl);
  const bookingMail = settings?.bookingEmail ?? settings?.contactEmail;

  return (
    <>
      <Seo title={t('pages.commentator.title')} description={p?.commentatorBio ?? t('pages.commentator.intro')} />
      <PageHero index="05" label={t('nav.commentator')} title={t('pages.commentator.title')} intro={p?.headline ?? t('pages.commentator.intro')} image={PAGE_HERO_IMAGES.commentator} />

      {/* 01 — Présentation */}
      <Section index="01" label={t('commentatorPage.presentation')} spacing="tight" aria-labelledby="commentator-pres">
        <div className={styles.presentation}>
          <div className={styles.presentationText}>
            <Heading id="commentator-pres" size="xl">
              {t('commentatorPage.presentation')}
            </Heading>
            {p?.commentatorBio ? (
              <RichText text={p.commentatorBio} />
            ) : (
              <p className={styles.lead}>{t('homePage.commentatorBody')}</p>
            )}
          </div>
          <RevealImage
            src={portrait.url}
            alt={portrait.alt || t('media.placeholderAlt')}
            placeholderLabel={t('media.placeholder')}
            ratio="4 / 5"
            className={styles.portrait}
          />
        </div>
      </Section>

      {/* 02 — Événements commentés */}
      <Section index="02" label={t('commentatorPage.events')} divider aria-labelledby="events-title">
        <Heading id="events-title" size="2xl" className={styles.blockTitle}>
          {t('commentatorPage.events')}
        </Heading>
        <DataState query={events} isEmpty={(e) => e.length === 0} loading={<Skeleton height="16rem" />}>
          {(list) => (
            <ol className={styles.events}>
              {list.map((e) => (
                <li key={e.id} className={styles.event}>
                  <div className={styles.eventHead}>
                    <span className={cx('mono', styles.eventDate)}>
                      {e.eventDate ? formatDate(lang, e.eventDate, 'month') : '—'}
                    </span>
                    <div className={styles.eventMain}>
                      <h3 className={cx('display', styles.eventName)}>{e.eventName}</h3>
                      <p className={cx('mono', styles.eventMeta)}>
                        {[e.promotion, e.broadcaster, [e.city, e.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className={cx('mono', styles.eventRole)}>{t(`enums.commentaryRole.${e.role}`)}</span>
                  </div>
                  {e.description && <p className={styles.eventDesc}>{e.description}</p>}
                </li>
              ))}
            </ol>
          )}
        </DataState>
      </Section>

      {/* 03 — Disciplines (issues des événements réels) */}
      {disciplines.length > 0 && (
        <Section index="03" label={t('commentatorPage.disciplines')} tone="elevated" aria-label={t('commentatorPage.disciplines')}>
          <ul className={styles.disciplines}>
            {disciplines.map((d) => (
              <li key={d} className={cx('display', styles.discipline)}>
                {d}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 04 — Extraits vidéo / audio */}
      {(withVideo.length > 0 || withAudio.length > 0) && (
        <Section index="04" label={t('commentatorPage.media')} divider aria-labelledby="extracts-title">
          <Heading id="extracts-title" size="2xl" className={styles.blockTitle}>
            {t('commentatorPage.media')}
          </Heading>
          <div className={styles.extracts}>
            {withVideo.map((e) => (
              <figure key={e.id} className={styles.extract}>
                <VideoBlock url={e.videoUrl!} poster={e.cover?.url} title={e.eventName} />
                <figcaption className={cx('mono', styles.extractCaption)}>{e.eventName}</figcaption>
              </figure>
            ))}
            {withAudio.map((e) => (
              <figure key={e.id} className={styles.extract}>
                <p className={cx('mono', styles.audioLabel)}>{t('commentatorPage.listen')}</p>
                <audio className={styles.audio} src={e.audioUrl!} controls preload="none" />
                <figcaption className={cx('mono', styles.extractCaption)}>{e.eventName}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* 05 — Prestations */}
      <Section index="05" label={t('commentatorPage.services')} tone="elevated" aria-labelledby="services-title">
        <Heading id="services-title" size="2xl" className={styles.blockTitle}>
          {t('commentatorPage.services')}
        </Heading>
        <DataState query={services} isEmpty={(s) => s.length === 0} loading={<SkeletonGrid count={3} ratio="3 / 2" />}>
          {(list) => (
            <ul role="list" className={styles.services}>
              {list.map((s, i) => (
                <li key={s.id} className={styles.service}>
                  <span className={cx('mono', styles.serviceIndex)}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={cx('display', styles.serviceTitle)}>{s.title}</h3>
                  {s.description && <p className={styles.serviceDesc}>{s.description}</p>}
                  {s.deliverables.length > 0 && (
                    <ul className={styles.deliverables}>
                      {s.deliverables.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </Section>

      {/* 06 — Booking */}
      <Section index="06" label={t('commentatorPage.book')} tone="elevated" aria-labelledby="booking-title">
        <div className={styles.booking}>
          <div>
            <Heading id="booking-title" size="2xl">
              {t('commentatorPage.book')}
            </Heading>
            <p className={styles.bookingBody}>{t('commentatorPage.bookBody')}</p>
            {bookingMail && (
              <Button href={`mailto:${bookingMail}`} variant="ghost" icon={null} className={styles.bookingMail}>
                {bookingMail}
              </Button>
            )}
          </div>
          <BookingForm services={(services.data ?? []).map((s) => ({ id: s.id, title: s.title }))} />
        </div>
      </Section>
    </>
  );
}
