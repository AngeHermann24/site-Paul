import { useTranslation } from 'react-i18next';
import { Seo } from '@/components/system/Seo/Seo';
import { PageHero } from '@/components/ui/PageHero/PageHero';
import { Section } from '@/components/ui/Section/Section';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import type { CommonTranslation } from '@/locales/fr/common';

export type StubPageKey = keyof CommonTranslation['pages'];

interface StubPageProps {
  page: StubPageKey;
  index: string;
}

/**
 * Page provisoire honnête (phase 1) : en-tête réel + état "contenu en préparation".
 * Chaque route sera remplacée par sa page complète en phase 4.
 */
export function StubPage({ page, index }: StubPageProps) {
  const { t } = useTranslation();
  const title = t(`pages.${page}.title`);
  const intro = t(`pages.${page}.intro`);

  return (
    <>
      <Seo title={title} description={intro} />
      <PageHero index={index} label={title} title={title} intro={intro} />
      <Section spacing="tight">
        <EmptyState title={t('status.inProgress')} body={t('status.inProgressBody')} />
      </Section>
    </>
  );
}
