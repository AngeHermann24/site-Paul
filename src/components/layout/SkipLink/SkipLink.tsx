import { useTranslation } from 'react-i18next';
import styles from './SkipLink.module.css';

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main" className={`mono ${styles.skip}`}>
      {t('a11y.skipToContent')}
    </a>
  );
}
