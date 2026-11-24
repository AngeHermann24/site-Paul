import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listAchievements } from '@/services/editorial';
import { LOCAL_IMAGES, PAGE_HERO_IMAGES } from '@/config/media';
import { listMedia, localImage } from '@/services/media';
import { getProfile } from '@/services/profile';
import { cx } from '@/utils/cx';
import { personJsonLd } from '@/utils/jsonLd';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { RichText } from '@/components/data/RichText/RichText';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { Heading } from '@/components/ui/Heading/Heading';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { RevealImage } from '@/components/motion/RevealImage/RevealImage';
import { MediaGallery } from '@/components/sections/MediaGallery/MediaGallery';
import { Timeline } from '@/components/sections/Timeline/Timeline';
import type { Achievement } from '@/services/editorial';
import styles from './ChampionPage.module.css';

/** Bloc biographie : titre + texte enrichi (rendu seulement si le contenu existe en base). */
function BioBlock({ index, label, text, flip }: { index: string; label: string; text: string | null; flip?: boolean }) {
  if (!text) return null;
  return (
    <Section index={index} label={label} aria-labelledby={`bio-${index}`} divider>
      <div className={cx(styles.bio, flip && styles.bioFlip)}>
        <Heading id={`bio-${index}`} size="xl" className={styles.bioTitle}>
          {label}
        </Heading>
        <RichText text={text} className={styles.bioText} />
      </div>
    </Section>
  );
}

export default function ChampionPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const settings = useSiteSettings();

  const profile = useServiceQuery(() => getProfile(lang), [lang]);
  const achievements = useServiceQuery(() => listAchievements(lang), [lang]);
  const timeline = useServiceQuery(() => listAchievements(lang, { timelineOnly: true }), [lang]);
  const gallery = useServiceQuery(() => listMedia(lang, { kind: 'image', limit: 8 }), [lang]);

  const p = profile.status === 'success' ? profile.data : null;
  const portrait = p?.portrait ?? localImage(lang, LOCAL_IMAGES.portrait);

  const facts: Array<{ label: string; value: string }> = p
    ? [
        p.nationality && { label: t('championPage.nationality'), value: p.nationality },
        p.hometown && { label: t('championPage.hometown'), value: p.hometown },
        p.weightClass && { label: t('championPage.weightClass'), value: p.weightClass },
        p.stance && { label: t('championPage.stance'), value: t(`championPage.stanceValues.${p.stance}`) },
        p.heightCm && { label: t('championPage.height'), value: `${p.heightCm} cm` },
        p.reachCm && { label: t('championPage.reach'), value: `${p.reachCm} cm` },
      ].filter((f): f is { label: string; value: string } => Boolean(f))
    : [];

  const hasBio = Boolean(p?.bio || p?.beginnings || p?.journey || p?.philosophy || p?.discipline);

  return (
    <>
      <Seo title={t('pages.champion.title')} description={p?.bioShort ?? t('pages.champion.intro')} jsonLd={personJsonLd(p, settings)} />
      <PageHero index="01" label={t('nav.champion')} title={t('pages.champion.title')} intro={p?.headline ?? t('pages.champion.intro')} image={PAGE_HERO_IMAGES.champion} />

      {/* 01 — Fiche + portrait */}
      <Section index="01" label={t('championPage.profileFacts')} spacing="tight" aria-label={t('championPage.profileFacts')}>
        <div className={styles.facts}>
          <RevealImage
            src={portrait.url}
            alt={portrait.alt || t('media.placeholderAlt')}
            placeholderLabel={t('media.placeholder')}
            ratio="3 / 4"
            priority
            className={styles.portrait}
          />
          {profile.status === 'loading' ? (
            <Skeleton height="16rem" />
          ) : facts.length > 0 ? (
            <dl className={styles.factList}>
              {facts.map((f) => (
                <div key={f.label} className={styles.fact}>
                  <dt className={cx('mono', styles.factLabel)}>{f.label}</dt>
                  <dd className={cx('display', styles.factValue)}>{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.noFacts}>{t('data.soonBody')}</p>
          )}
        </div>
      </Section>

      {/* Biographie : blocs publiés uniquement */}
      {p?.bio && (
        <Section index="02" label={t('championPage.journey')} tone="elevated" aria-labelledby="bio-main">
          <div className={styles.mainBio}>
            <Heading id="bio-main" size="2xl" className={styles.mainBioTitle}>
              {p.displayName}
            </Heading>
            <RichText text={p.bio} className={styles.mainBioText} />
          </div>
        </Section>
      )}
      <BioBlock index="03" label={t('championPage.beginnings')} text={p?.beginnings ?? null} />
      <BioBlock index="04" label={t('championPage.philosophy')} text={p?.philosophy ?? null} flip />
      <BioBlock index="05" label={t('championPage.discipline')} text={p?.discipline ?? null} />
      {!hasBio && profile.status === 'success' && (
        <Section spacing="tight">
          <p className={styles.noFacts}>{t('data.soon')} — {t('data.soonBody')}</p>
        </Section>
      )}

      {/* 06 — Palmarès */}
      <Section index="06" label={t('championPage.record')} divider aria-labelledby="record-title">
        <Heading id="record-title" size="2xl" className={styles.blockTitle}>
          {t('championPage.record')}
        </Heading>
        <DataState query={achievements} isEmpty={(a) => a.length === 0} loading={<Skeleton height="10rem" />}>
          {(list: Achievement[]) => (
            <ol className={styles.record}>
              {list.map((a) => (
                <li key={a.id} className={styles.recordRow}>
                  <span className={cx('mono', styles.recordKind)}>{t(`enums.achievementKind.${a.kind}`)}</span>
                  <span className={cx('display', styles.recordTitle)}>{a.title}</span>
                  <span className={cx('mono', styles.recordMeta)}>
                    {[a.organization, a.year].filter(Boolean).join(' · ') || '—'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </DataState>
      </Section>

      {/* 07 — Chronologie (horizontale épinglée desktop, verticale mobile) */}
      <DataState query={timeline} isEmpty={(l) => l.length === 0} hideWhenEmpty loading={null}>
        {(list) => (
          <Timeline
            label={t('championPage.timeline')}
            items={list.map((a) => ({
              id: a.id,
              year: a.year,
              title: a.title,
              description: a.description,
              tag: t(`enums.achievementKind.${a.kind}`),
            }))}
          />
        )}
      </DataState>

      {/* 08 — Galerie */}
      <Section index="08" label={t('championPage.gallery')} aria-labelledby="gallery-title">
        <Heading id="gallery-title" size="2xl" className={styles.blockTitle}>
          {t('championPage.gallery')}
        </Heading>
        <DataState query={gallery} isEmpty={(g) => g.items.length === 0}>
          {(g) => <MediaGallery items={g.items} layout="grid" />}
        </DataState>
      </Section>
    </>
  );
}
