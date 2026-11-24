import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LANGS, switchLangInPath } from '@/routes/paths';
import { useLang } from '@/hooks/useLang';
import { cx } from '@/utils/cx';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
  className?: string;
  size?: 'sm' | 'lg';
}

/** Conserve la page courante (pathname + query + hash) en changeant uniquement le préfixe de langue. */
export function LanguageSwitcher({ className, size = 'sm' }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const current = useLang();
  const { pathname, search, hash } = useLocation();

  return (
    <nav aria-label={t('a11y.languageSwitcher')} className={cx('mono', styles.switcher, styles[size], className)}>
      <ul role="list" className={styles.list}>
        {LANGS.map((lang, i) => {
          const active = lang === current;
          return (
            <li key={lang} className={styles.item}>
              {i > 0 && (
                <span className={styles.sep} aria-hidden="true">
                  /
                </span>
              )}
              {active ? (
                <span className={cx(styles.link, styles.active)} aria-current="true" title={t(`languages.${lang}`)}>
                  <span className="sr-only">{t('a11y.currentLanguage', { lang: t(`languages.${lang}`) })}</span>
                  <span aria-hidden="true">{lang.toUpperCase()}</span>
                </span>
              ) : (
                <Link
                  to={`${switchLangInPath(pathname, lang)}${search}${hash}`}
                  className={styles.link}
                  hrefLang={lang}
                  lang={lang}
                  data-cursor="link"
                  preventScrollReset
                >
                  <span className="sr-only">{t('a11y.switchTo', { lang: t(`languages.${lang}`) })}</span>
                  <span aria-hidden="true">{lang.toUpperCase()}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
