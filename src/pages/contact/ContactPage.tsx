import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSiteSettings, useSiteSettingsState } from '@/contexts/SiteSettingsContext';
import type { SocialLink } from '@/services/settings';
import { PAGE_HERO_IMAGES } from '@/config/media';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { Heading } from '@/components/ui/Heading/Heading';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { ContactForm } from '@/features/contact/ContactForm';
import styles from './ContactPage.module.css';

/** Monogrammes sobres des réseaux (pas d'icônes de marque dans lucide). */
const SOCIAL_SHORT: Record<SocialLink['network'], string> = {
  instagram: 'IG',
  youtube: 'YT',
  tiktok: 'TT',
  x: 'X',
  facebook: 'FB',
  linkedin: 'IN',
};

export default function ContactPage() {
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const settingsState = useSiteSettingsState();

  const addressLines = [
    settings?.gym.address,
    [settings?.gym.postalCode, settings?.gym.city].filter(Boolean).join(' '),
    settings?.gym.country,
  ].filter(Boolean);
  const hasDetails = Boolean(settings?.contactEmail || settings?.contactPhone || addressLines.length || settings?.socials.length);

  return (
    <>
      <Seo title={t('pages.contact.title')} description={t('pages.contact.intro')} />
      <PageHero index="09" label={t('nav.contact')} title={t('pages.contact.title')} intro={t('pages.contact.intro')} image={PAGE_HERO_IMAGES.contact} />

      <Section index="01" spacing="tight" aria-label={t('nav.contact')}>
        <div className={styles.layout}>
          {/* Coordonnées (paramètres du site) */}
          <aside className={styles.details} aria-label={t('contactPage.details')}>
            <Heading size="xl" className={styles.detailsTitle}>
              {t('contactPage.details')}
            </Heading>
            {settingsState.status === 'loading' ? (
              <Skeleton height="14rem" />
            ) : hasDetails ? (
              <ul className={styles.detailList}>
                {settings?.contactEmail && (
                  <li className={styles.detail}>
                    <Mail size={16} aria-hidden="true" className={styles.detailIcon} />
                    <div>
                      <p className={cx('mono', styles.detailLabel)}>{t('contactPage.email')}</p>
                      <a href={`mailto:${settings.contactEmail}`} className={styles.detailValue}>
                        {settings.contactEmail}
                      </a>
                    </div>
                  </li>
                )}
                {settings?.contactPhone && (
                  <li className={styles.detail}>
                    <Phone size={16} aria-hidden="true" className={styles.detailIcon} />
                    <div>
                      <p className={cx('mono', styles.detailLabel)}>{t('contactPage.phone')}</p>
                      <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`} className={styles.detailValue}>
                        {settings.contactPhone}
                      </a>
                    </div>
                  </li>
                )}
                {addressLines.length > 0 && (
                  <li className={styles.detail}>
                    <MapPin size={16} aria-hidden="true" className={styles.detailIcon} />
                    <div>
                      <p className={cx('mono', styles.detailLabel)}>{t('contactPage.address')}</p>
                      <address className={styles.detailValue}>
                        {settings?.gym.name && <strong>{settings.gym.name} — </strong>}
                        {addressLines.join(', ')}
                      </address>
                    </div>
                  </li>
                )}
                {settings && settings.socials.length > 0 && (
                  <li className={styles.detail}>
                    <span className={styles.detailIcon} aria-hidden="true" />
                    <div>
                      <p className={cx('mono', styles.detailLabel)}>{t('contactPage.socials')}</p>
                      <ul className={styles.socials}>
                        {settings.socials.map((s) => (
                          <li key={s.network}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cx('display', styles.social)}
                              aria-label={t(`socials.${s.network}`)}
                            >
                              {SOCIAL_SHORT[s.network]}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )}
              </ul>
            ) : (
              <p className={styles.noDetails}>{t('contactPage.noDetails')}</p>
            )}
          </aside>

          {/* Formulaire */}
          <div className={styles.formCol}>
            <Heading size="xl" className={styles.detailsTitle}>
              {t('contactPage.formTitle')}
            </Heading>
            <p className={styles.formIntro}>{t('contactPage.formBody')}</p>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
