import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLocalePath } from '@/hooks/useLang';
import { cx } from '@/utils/cx';
import styles from './Logo.module.css';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { t } = useTranslation();
  const to = useLocalePath();
  return (
    <Link to={to('home')} className={cx(styles.logo, className)} aria-label={t('a11y.home')} data-cursor="link" onClick={onClick}>
      <span className={cx('display', styles.word)} aria-hidden="true">
        PAUL
      </span>
      <span className={styles.mark} aria-hidden="true" />
    </Link>
  );
}
