import { useTranslation } from 'react-i18next';
import { useLocalePath } from '@/hooks/useLang';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { Button } from '@/components/ui/Button/Button';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const to = useLocalePath();

  return (
    <>
      <Seo title={t('notFound.title')} noindex />
      <section className={styles.wrap}>
        <p className={cx('display', styles.code)} aria-hidden="true">
          {t('notFound.code')}
        </p>
        <Container className={styles.content}>
          <p className="mono">{`ERR ${t('notFound.code')} — KO`}</p>
          <Heading as="h1" size="2xl">
            {t('notFound.title')}
          </Heading>
          <p className={styles.body}>{t('notFound.body')}</p>
          <Button to={to('home')} variant="primary" size="lg">
            {t('cta.backHome')}
          </Button>
        </Container>
      </section>
    </>
  );
}
