import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useSiteSettingsState } from '@/contexts/SiteSettingsContext';
import { Seo } from '@/components/system/Seo/Seo';
import { RichText } from '@/components/data/RichText/RichText';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import styles from './LegalPage.module.css';

interface LegalPageProps {
  page: 'legal' | 'privacy' | 'cookies';
}

const FIELD = { legal: 'notice', privacy: 'privacy', cookies: 'cookies' } as const;

/** Page légale : le contenu vient de `site_settings` (éditable en admin), sinon état honnête. */
export default function LegalPage({ page }: LegalPageProps) {
  const { t } = useTranslation();
  const settings = useSiteSettings();
  const state = useSiteSettingsState();

  const title = t(`pages.${page}.title`);
  const intro = t(`pages.${page}.intro`);
  const body = settings?.legal[FIELD[page]] ?? null;

  return (
    <>
      <Seo title={title} description={intro} />
      <PageHero index="—" label={title} title={title} intro={intro} />
      <Section spacing="tight" aria-label={title}>
        {state.status === 'loading' ? (
          <Skeleton height="16rem" />
        ) : body ? (
          <div className={styles.content}>
            <RichText text={body} />
          </div>
        ) : (
          <EmptyState title={t('legalPage.empty')} />
        )}
      </Section>
    </>
  );
}
