import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLocalePath } from '@/hooks/useLang';
import { cx } from '@/utils/cx';
import { Logo } from '../Logo/Logo';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { MobileMenu, type MenuOrigin } from '../MobileMenu/MobileMenu';
import { MAIN_NAV } from '../navItems';
import styles from './Header.module.css';

export function Header() {
  const { t } = useTranslation();
  const to = useLocalePath();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [origin, setOrigin] = useState<MenuOrigin | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = useCallback(() => setOrigin(null), []);

  // Fermeture automatique à chaque navigation.
  useEffect(() => closeMenu(), [pathname, closeMenu]);

  const openMenu = () => {
    const rect = menuButton.current?.getBoundingClientRect();
    setOrigin(
      rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth, y: 0 },
    );
  };

  return (
    <>
      <header className={cx(styles.header, scrolled && styles.scrolled)}>
        <div className={styles.inner}>
          <Logo />

          <nav aria-label={t('a11y.mainNav')} className={styles.desktopNav}>
            <ul role="list" className={styles.navList}>
              {MAIN_NAV.map((item) => (
                <li key={item.key}>
                  <NavLink
                    to={to(item.key)}
                    className={({ isActive }) => cx('mono', styles.navLink, isActive && styles.active)}
                    data-cursor="link"
                  >
                    <span className={styles.navIndex} aria-hidden="true">
                      {item.index}
                    </span>
                    {t(`nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <LanguageSwitcher className={styles.lang} />
            <button
              ref={menuButton}
              type="button"
              className={cx('mono', styles.menuButton)}
              aria-expanded={origin !== null}
              aria-controls="mobile-menu"
              aria-label={t('a11y.openMenu')}
              onClick={openMenu}
              data-cursor="link"
            >
              <span aria-hidden="true">{t('nav.menu')}</span>
              <span className={styles.burger} aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu origin={origin} onClose={closeMenu} />
    </>
  );
}
