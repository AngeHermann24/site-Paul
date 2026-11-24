import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { getFightStats } from '@/services/fights';
import { PAGE_HERO_IMAGES } from '@/config/media';
import { listActiveSponsors, listSponsorshipPackages, SPONSOR_TIER_ORDER } from '@/services/sponsors';
import { formatDate, formatPrice } from '@/utils/format';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { DataState } from '@/components/data/DataState/DataState';
import { Skeleton, SkeletonGrid } from '@/components/data/Skeleton/Skeleton';
import { SponsorshipForm } from '@/features/forms/SponsorshipForm';
import { Button } from '@/components/ui/Button/Button';
import { Heading } from '@/components/ui/Heading/Heading';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { StatCounters } from '@/components/sections/StatCounters/StatCounters';
import styles from './SponsorsPage.module.css';

const OPPORTUNITIES = ['visibility', 'content', 'events', 'hospitality'] as const;
const FAQ = ['process', 'budget', 'duration', 'activities'] as const;
export default function SponsorsPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const settings = useSiteSettings();

  const stats = useServiceQuery(() => getFightStats(), []);
  const packages = useServiceQuery(() => listSponsorshipPackages(lang), [lang]);
  const sponsors = useServiceQuery(() => listActiveSponsors(lang), [lang]);

  const audience = settings?.audience ?? [];

  return (
    <>
      <Seo title={t('pages.sponsors.title')} description={t('pages.sponsors.intro')} />
      <PageHero index="08" label={t('nav.sponsors')} title={t('pages.sponsors.title')} intro={t('pages.sponsors.intro')} image={PAGE_HERO_IMAGES.sponsors} />

      {/* 01 — Introduction */}
      <Section index="01" label={t('sponsorsPage.introLabel')} spacing="tight" aria-labelledby="sp-intro">
        <div className={styles.intro}>
          <Heading id="sp-intro" size="2xl">
            {t('sponsorsPage.introTitle')}
          </Heading>
          <p className={styles.introBody}>{t('sponsorsPage.introBody')}</p>
        </div>
      </Section>

      {/* 02 — L'univers : trois activités */}
      <Section index="02" label={t('sponsorsPage.universe')} divider aria-label={t('sponsorsPage.universe')}>
        <ol className={styles.universe}>
          {(['boxing', 'gym', 'commentary'] as const).map((k, i) => (
            <li key={k} className={styles.universeItem}>
              <span className={cx('mono', styles.universeIndex)}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={cx('display', styles.universeTitle)}>
                {t(k === 'boxing' ? 'roles.boxer' : k === 'gym' ? 'roles.gymOwner' : 'roles.commentator')}
              </h3>
              <p className={styles.universeBody}>{t(`sponsorsPage.universeItems.${k}`)}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 03 — Chiffres vérifiés */}
      <Section index="03" label={t('sponsorsPage.figures')} tone="elevated" aria-labelledby="figures-title">
        <Heading id="figures-title" size="xl" className={styles.blockTitle}>
          {t('sponsorsPage.figures')}
        </Heading>
        <DataState query={stats} isEmpty={(s) => s.overall.total === 0} hideWhenEmpty loading={<Skeleton height="10rem" />}>
          {(s) => (
            <StatCounters
              note={t(s.source === 'official' ? 'stats.sourceOfficial' : 'sponsorsPage.figuresNote')}
              items={[
                { key: 'fights', label: t('stats.total'), value: s.overall.total },
                { key: 'wins', label: t('stats.wins'), value: s.overall.wins, accent: true },
                { key: 'ko', label: t('stats.koWins'), value: s.overall.koWins },
                { key: 'titles', label: t('stats.titleFights'), value: s.overall.titleFights },
              ]}
            />
          )}
        </DataState>
        {audience.length > 0 && (
          <div className={styles.audience}>
            <p className={cx('mono', styles.audienceLabel)}>{t('sponsorsPage.audience')}</p>
            <ul className={styles.audienceList}>
              {audience.map((m) => (
                <li key={`${m.label}-${m.value}`} className={styles.audienceItem}>
                  <span className={cx('display', styles.audienceValue)}>{m.value}</span>
                  <span className={styles.audienceName}>{m.label}</span>
                  <span className={cx('mono', styles.audienceSource)}>
                    {[m.source, m.verifiedOn ? formatDate(lang, m.verifiedOn, 'short') : null].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* 04 — Opportunités */}
      <Section index="04" label={t('sponsorsPage.opportunities')} divider aria-labelledby="opps-title">
        <Heading id="opps-title" size="2xl" className={styles.blockTitle}>
          {t('sponsorsPage.opportunities')}
        </Heading>
        <ul role="list" className={styles.opps}>
          {OPPORTUNITIES.map((k) => (
            <li key={k} className={styles.opp}>
              <h3 className={cx('display', styles.oppTitle)}>{t(`sponsorsPage.opportunityItems.${k}.title`)}</h3>
              <p className={styles.oppBody}>{t(`sponsorsPage.opportunityItems.${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 05 — Formules */}
      <Section index="05" label={t('sponsorsPage.packages')} tone="elevated" aria-labelledby="packages-title">
        <Heading id="packages-title" size="2xl" className={styles.blockTitle}>
          {t('sponsorsPage.packages')}
        </Heading>
        <DataState
          query={packages}
          isEmpty={(p) => p.length === 0}
          emptyTitle={t('sponsorsPage.noPackages')}
          loading={<SkeletonGrid count={3} ratio="4 / 3" />}
        >
          {(list) => {
            const ordered = [...list].sort(
              (a, b) => SPONSOR_TIER_ORDER.indexOf(a.tier) - SPONSOR_TIER_ORDER.indexOf(b.tier),
            );
            return (
              <ul role="list" className={styles.packages}>
                {ordered.map((p) => (
                  <li key={p.id} className={cx(styles.package, p.isFeatured && styles.featured)}>
                    <p className={cx('mono', styles.packageTier)}>{t(`enums.sponsorTier.${p.tier}`)}</p>
                    <h3 className={cx('display', styles.packageName)}>{p.name}</h3>
                    <p className={styles.packagePrice}>
                      {p.priceCents !== null ? formatPrice(lang, p.priceCents, p.currency) : t('gymPage.priceOnRequest')}
                    </p>
                    {p.description && <p className={styles.packageDesc}>{p.description}</p>}
                    {p.benefits.length > 0 && (
                      <>
                        <p className={cx('mono', styles.benefitsLabel)}>{t('sponsorsPage.benefits')}</p>
                        <ul className={styles.benefits}>
                          {p.benefits.map((b) => (
                            <li key={b}>
                              <Check size={14} aria-hidden="true" className={styles.benefitIcon} />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            );
          }}
        </DataState>
      </Section>

      {/* 06 — Sponsors actuels */}
      <DataState query={sponsors} isEmpty={(s) => s.length === 0} hideWhenEmpty loading={null}>
        {(list) => (
          <Section index="06" label={t('sponsorsPage.current')} divider aria-labelledby="current-title">
            <Heading id="current-title" size="2xl" className={styles.blockTitle}>
              {t('sponsorsPage.current')}
            </Heading>
            <ul role="list" className={styles.sponsors}>
              {list.map((s) => (
                <li key={s.id} className={styles.sponsor}>
                  {s.websiteUrl ? (
                    <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer sponsored" className={styles.sponsorLink}>
                      <SponsorMark name={s.name} logoUrl={s.logoUrl} />
                    </a>
                  ) : (
                    <SponsorMark name={s.name} logoUrl={s.logoUrl} />
                  )}
                  <p className={cx('mono', styles.sponsorTier)}>{t(`enums.sponsorTier.${s.tier}`)}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </DataState>

      {/* 07 — FAQ */}
      <Section index="07" label={t('sponsorsPage.faq')} divider aria-labelledby="faq-title">
        <Heading id="faq-title" size="2xl" className={styles.blockTitle}>
          {t('sponsorsPage.faq')}
        </Heading>
        <div className={styles.faq}>
          {FAQ.map((k) => (
            <details key={k} className={styles.faqItem}>
              <summary className={styles.faqQ}>
                <span>{t(`sponsorsPage.faqItems.${k}.q`)}</span>
                <span className={styles.faqIcon} aria-hidden="true" />
              </summary>
              <p className={styles.faqA}>{t(`sponsorsPage.faqItems.${k}.a`)}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* 08 — Demande de partenariat (formulaire 5 étapes) */}
      <Section index="08" label={t('sponsorsPage.formTitle')} tone="elevated" aria-labelledby="sp-form">
        <div className={styles.formSection}>
          <div className={styles.formText}>
            <Heading id="sp-form" size="2xl">
              {t('sponsorsPage.formTitle')}
            </Heading>
            <p className={styles.formBody}>{t('sponsorsPage.formBody')}</p>
            {settings?.contactEmail && (
              <Button href={`mailto:${settings.contactEmail}`} variant="ghost" icon={null}>
                {t('sponsorsPage.contactInstead')}
              </Button>
            )}
          </div>
          <SponsorshipForm packages={packages.status === 'success' ? packages.data : []} />
        </div>
      </Section>
    </>
  );
}

function SponsorMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return logoUrl ? (
    <img className={styles.sponsorLogo} src={logoUrl} alt={name} loading="lazy" decoding="async" />
  ) : (
    <span className={cx('display', styles.sponsorName)}>{name}</span>
  );
}
