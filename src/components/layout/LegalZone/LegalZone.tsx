import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useLocalePath } from '@/hooks/useLang';
import { cx } from '@/utils/cx';
import { Container } from '@/components/ui/Container/Container';
import { LEGAL_NAV } from '../navItems';
import styles from './LegalZone.module.css';

/**
 * Zone légale discrète en fin de page (pas de footer massif).
 * Réseaux sociaux : uniquement ceux renseignés dans `site_settings` (rien n'est inventé).
 */
export function LegalZone() {
  const { t } = useTranslation();
  const to = useLocalePath();
  const settings = useSiteSettings();
  const year = new Date().getFullYear();
  const socials = settings?.socials ?? [];

  return (
    <footer className={styles.zone}>
      <Container className={cx('mono', styles.inner)}>
        <p className={styles.copy}>{t('legalZone.copyright', { year })}</p>
        {socials.length > 0 && (
          <nav aria-label={t('a11y.social')}>
            <ul role="list" className={styles.links}>
              {socials.map((s) => (
                <li key={s.network}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer me" className={styles.link} data-cursor="link">
                    {t(`socials.${s.network}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <nav aria-label={t('a11y.legalNav')}>
          <ul role="list" className={styles.links}>
            {LEGAL_NAV.map((key) => (
              <li key={key}>
                <Link to={to(key)} className={styles.link} data-cursor="link">
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
