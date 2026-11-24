import { useTranslation } from 'react-i18next';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listGymCoaches, listGymMemberships, listGymSchedules, listGymServices } from '@/services/editorial';
import { listMedia } from '@/services/media';
import { PAGE_HERO_IMAGES } from '@/config/media';
import { formatPrice } from '@/utils/format';
import { gymJsonLd } from '@/utils/jsonLd';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { RichText } from '@/components/data/RichText/RichText';
import { Skeleton, SkeletonGrid } from '@/components/data/Skeleton/Skeleton';
import { GymRegistrationForm } from '@/features/forms/GymRegistrationForm';
import { Button } from '@/components/ui/Button/Button';
import { Heading } from '@/components/ui/Heading/Heading';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { MediaGallery } from '@/components/sections/MediaGallery/MediaGallery';
import { VideoBlock } from '@/components/sections/VideoBlock/VideoBlock';
import type { GymServiceKind } from '@/types/domain';
import styles from './GymPage.module.css';

const SERVICE_GROUPS: Array<{ kind: GymServiceKind; index: string; key: 'disciplines' | 'classes' | 'equipment' }> = [
  { kind: 'discipline', index: '02', key: 'disciplines' },
  { kind: 'class', index: '03', key: 'classes' },
  { kind: 'equipment', index: '04', key: 'equipment' },
];

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export default function GymPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const settings = useSiteSettings();

  const services = useServiceQuery(() => listGymServices(lang), [lang]);
  const schedules = useServiceQuery(() => listGymSchedules(lang), [lang]);
  const coaches = useServiceQuery(() => listGymCoaches(lang), [lang]);
  const memberships = useServiceQuery(() => listGymMemberships(lang), [lang]);
  const gallery = useServiceQuery(() => listMedia(lang, { kind: 'image', category: 'gym', limit: 8 }), [lang]);

  const gym = settings?.gym;
  const addressLines = [gym?.address, [gym?.postalCode, gym?.city].filter(Boolean).join(' '), gym?.country].filter(Boolean);
  const hasLocation = addressLines.length > 0 || gym?.openingHours || gym?.mapsUrl;

  return (
    <>
      <Seo
        title={t('pages.gym.title')}
        description={t('pages.gym.intro')}
        jsonLd={gymJsonLd(settings, typeof window !== 'undefined' ? window.location.href : '')}
      />
      <PageHero index="04" label={gym?.name ?? t('nav.gym')} title={t('pages.gym.title')} intro={t('pages.gym.intro')} image={PAGE_HERO_IMAGES.gym} />

      {/* 01 — Vidéo de la salle (seulement si configurée) */}
      {gym?.heroVideo && (
        <Section index="01" label={gym?.name ?? t('nav.gym')} spacing="tight" aria-label={gym?.name ?? t('nav.gym')}>
          <VideoBlock url={gym.heroVideo} poster={gym.heroPoster} title={gym.name ?? t('nav.gym')} />
        </Section>
      )}

      {/* Histoire */}
      {gym?.story && (
        <Section index="01" label={t('gymPage.story')} divider={!gym.heroVideo} aria-labelledby="gym-story">
          <div className={styles.story}>
            <Heading id="gym-story" size="xl" className={styles.storyTitle}>
              {t('gymPage.story')}
            </Heading>
            <RichText text={gym.story} />
          </div>
        </Section>
      )}

      {/* Disciplines / Cours / Équipements */}
      {SERVICE_GROUPS.map((group) => (
        <Section key={group.kind} index={group.index} label={t(`gymPage.${group.key}`)} divider aria-labelledby={`gym-${group.kind}`}>
          <Heading id={`gym-${group.kind}`} size="2xl" className={styles.blockTitle}>
            {t(`gymPage.${group.key}`)}
          </Heading>
          <DataState
            query={services}
            isEmpty={(s) => !s.some((x) => x.kind === group.kind)}
            loading={<SkeletonGrid count={3} ratio="3 / 2" />}
          >
            {(list) => (
              <ul role="list" className={styles.services}>
                {list
                  .filter((s) => s.kind === group.kind)
                  .map((s) => (
                    <li key={s.id} className={styles.service}>
                      <p className={cx('mono', styles.serviceLevel)}>{t(`enums.level.${s.level}`)}</p>
                      <h3 className={cx('display', styles.serviceTitle)}>{s.title}</h3>
                      {s.description && <p className={styles.serviceDesc}>{s.description}</p>}
                    </li>
                  ))}
              </ul>
            )}
          </DataState>
        </Section>
      ))}

      {/* 05 — Horaires */}
      <Section index="05" label={t('gymPage.schedule')} tone="elevated" aria-labelledby="schedule-title">
        <Heading id="schedule-title" size="2xl" className={styles.blockTitle}>
          {t('gymPage.schedule')}
        </Heading>
        <DataState query={schedules} isEmpty={(s) => s.length === 0} emptyTitle={t('gymPage.noSchedule')} loading={<Skeleton height="14rem" />}>
          {(slots) => (
            <ol className={styles.schedule}>
              {DAYS.map((day) => {
                const daySlots = slots.filter((s) => s.dayOfWeek === day);
                if (daySlots.length === 0) return null;
                return (
                  <li key={day} className={styles.day}>
                    <span className={cx('display', styles.dayName)}>{t(`enums.days.${day}`)}</span>
                    <ul className={styles.slots}>
                      {daySlots.map((s) => (
                        <li key={s.id} className={styles.slot}>
                          <span className="mono">
                            {s.startsAt} — {s.endsAt}
                          </span>
                          <span className={styles.slotLabel}>{s.label}</span>
                          <span className={cx('mono', styles.slotMeta)}>
                            {[s.coachName, s.room, s.level && t(`enums.level.${s.level}`)].filter(Boolean).join(' · ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          )}
        </DataState>
      </Section>

      {/* 06 — Coachs */}
      <Section index="06" label={t('gymPage.coaches')} divider aria-labelledby="coaches-title">
        <Heading id="coaches-title" size="2xl" className={styles.blockTitle}>
          {t('gymPage.coaches')}
        </Heading>
        <DataState query={coaches} isEmpty={(c) => c.length === 0}>
          {(list) => (
            <ul role="list" className={styles.coaches}>
              {list.map((c) => (
                <li key={c.id} className={styles.coach}>
                  <div className={styles.coachPhoto}>
                    {c.photo ? <img src={c.photo.url} alt={c.photo.alt || c.fullName} loading="lazy" decoding="async" /> : <span className={styles.coachPlaceholder} aria-hidden="true" />}
                  </div>
                  <div className={styles.coachBody}>
                    <h3 className={cx('display', styles.coachName)}>{c.fullName}</h3>
                    {c.role && <p className={cx('mono', styles.coachRole)}>{c.role}</p>}
                    {c.specialties.length > 0 && (
                      <ul className={styles.specialties}>
                        {c.specialties.map((sp) => (
                          <li key={sp} className="mono">
                            {sp}
                          </li>
                        ))}
                      </ul>
                    )}
                    {c.bio && <p className={styles.coachBio}>{c.bio}</p>}
                    {c.instagramUrl && (
                      <a href={c.instagramUrl} target="_blank" rel="noopener noreferrer" className={cx('mono', styles.coachInsta)}>
                        Instagram <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </Section>

      {/* 07 — Formules */}
      <Section index="07" label={t('gymPage.memberships')} tone="elevated" aria-labelledby="memberships-title">
        <Heading id="memberships-title" size="2xl" className={styles.blockTitle}>
          {t('gymPage.memberships')}
        </Heading>
        <DataState query={memberships} isEmpty={(m) => m.length === 0}>
          {(list) => (
            <ul role="list" className={styles.memberships}>
              {list.map((m) => (
                <li key={m.id} className={cx(styles.membership, m.isFeatured && styles.featured)}>
                  {m.isFeatured && <span className={cx('mono', styles.featuredTag)}>★</span>}
                  <h3 className={cx('display', styles.membershipName)}>{m.name}</h3>
                  <p className={styles.price}>
                    {m.priceCents !== null ? (
                      <>
                        <span className={cx('display', styles.priceValue)}>{formatPrice(lang, m.priceCents, m.currency)}</span>
                        <span className={cx('mono', styles.pricePeriod)}>{t('gymPage.per', { period: t(`enums.billing.${m.billingPeriod}`) })}</span>
                      </>
                    ) : (
                      <span className={cx('display', styles.priceValue, styles.priceOnRequest)}>{t('gymPage.priceOnRequest')}</span>
                    )}
                  </p>
                  {m.description && <p className={styles.membershipDesc}>{m.description}</p>}
                  {m.features.length > 0 && (
                    <ul className={styles.features}>
                      {m.features.map((feat) => (
                        <li key={feat}>{feat}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </Section>

      {/* 08 — Galerie */}
      <Section index="08" label={t('gymPage.gallery')} divider aria-labelledby="gym-gallery-title">
        <Heading id="gym-gallery-title" size="2xl" className={styles.blockTitle}>
          {t('gymPage.gallery')}
        </Heading>
        <DataState query={gallery} isEmpty={(g) => g.items.length === 0}>
          {(g) => <MediaGallery items={g.items} layout="grid" />}
        </DataState>
      </Section>

      {/* 09 — Nous trouver + inscription */}
      <Section index="09" label={t('gymPage.location')} tone="elevated" aria-labelledby="location-title">
        <div className={styles.location}>
          <div className={styles.locationText}>
            <Heading id="location-title" size="2xl" className={styles.locationTitle}>
              {t('gymPage.location')}
            </Heading>
            {hasLocation ? (
              <address className={styles.address}>
                {gym?.name && <strong>{gym.name}</strong>}
                {addressLines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </address>
            ) : (
              <p className={styles.noLocation}>{t('contactPage.noDetails')}</p>
            )}
            {gym?.openingHours && (
              <div className={styles.hours}>
                <p className={cx('mono', styles.hoursLabel)}>{t('gymPage.openingHours')}</p>
                <p>{gym.openingHours}</p>
              </div>
            )}
            {gym?.mapsUrl && (
              <Button href={gym.mapsUrl} variant="ghost" icon={<MapPin size={16} aria-hidden="true" />}>
                {t('gymPage.directions')}
              </Button>
            )}
          </div>
          <div className={styles.join}>
            <Heading size="xl">{t('gymPage.join')}</Heading>
            <p className={styles.joinBody}>{t('gymPage.joinBody')}</p>
            <GymRegistrationForm
              memberships={(memberships.data ?? []).map((m) => ({ id: m.id, name: m.name }))}
              disciplines={(services.data ?? [])
                .filter((s) => s.kind === 'discipline')
                .map((s) => ({ slug: s.slug, label: s.title }))}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
