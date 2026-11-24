import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { AnimatePresence, m, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/contexts/MotionContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLocalePath } from '@/hooks/useLang';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/Button/Button';
import { Logo } from '../Logo/Logo';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { MAIN_NAV } from '../navItems';
import styles from './MobileMenu.module.css';

export interface MenuOrigin {
  x: number;
  y: number;
}

interface MobileMenuProps {
  /** Point d'origine de l'ouverture (centre du bouton). `null` = fermé. */
  origin: MenuOrigin | null;
  onClose: () => void;
}

const EASE = [0.76, 0, 0.24, 1] as const;

export function MobileMenu({ origin, onClose }: MobileMenuProps) {
  const lastOrigin = useRef<MenuOrigin>({ x: 0, y: 0 });
  if (origin) lastOrigin.current = origin;

  return <AnimatePresence>{origin && <MenuPanel origin={lastOrigin.current} onClose={onClose} />}</AnimatePresence>;
}

function MenuPanel({ origin, onClose }: { origin: MenuOrigin; onClose: () => void }) {
  const { t } = useTranslation();
  const to = useLocalePath();
  const { reducedMotion, setScrollLocked } = useMotion();
  const panel = useRef<HTMLDivElement>(null);

  useFocusTrap(panel, onClose);

  useEffect(() => {
    setScrollLocked(true);
    return () => setScrollLocked(false);
  }, [setScrollLocked]);

  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  const at = `at ${origin.x}px ${origin.y}px`;

  const panelVariants: Variants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } }, exit: { opacity: 0, transition: { duration: 0.2 } } }
    : {
        hidden: { clipPath: `circle(0px ${at})` },
        visible: { clipPath: `circle(${radius}px ${at})`, transition: { duration: 0.85, ease: EASE } },
        exit: { clipPath: `circle(0px ${at})`, transition: { duration: 0.6, ease: EASE, delay: 0.15 } },
      };

  const listVariants: Variants = {
    visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.055, delayChildren: reducedMotion ? 0 : 0.3 } },
    exit: { transition: { staggerChildren: 0.025, staggerDirection: -1 } },
  };

  const itemVariants: Variants = reducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        hidden: { y: '110%' },
        visible: { y: '0%', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
        exit: { y: '-110%', transition: { duration: 0.35, ease: EASE } },
      };

  return (
    <m.div
      ref={panel}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.menu')}
      className={styles.panel}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      data-lenis-prevent=""
    >
      <div className={styles.top}>
        <Logo onClick={onClose} />
        <button type="button" className={cx('mono', styles.close)} onClick={onClose} aria-label={t('a11y.closeMenu')}>
          <span aria-hidden="true">{t('nav.close')}</span>
          <span className={styles.cross} aria-hidden="true" />
        </button>
      </div>

      <nav aria-label={t('a11y.mainNav')} className={styles.nav}>
        <m.ol role="list" className={styles.list} variants={listVariants}>
          {MAIN_NAV.map((item) => (
            <li key={item.key} className={styles.item}>
              <span className={styles.mask}>
                <m.span className={styles.row} variants={itemVariants}>
                  <NavLink
                    to={to(item.key)}
                    className={({ isActive }) => cx('display', styles.link, isActive && styles.active)}
                    onClick={onClose}
                  >
                    <span className={cx('mono', styles.index)} aria-hidden="true">
                      {item.index}
                    </span>
                    {t(`nav.${item.key}`)}
                  </NavLink>
                </m.span>
              </span>
            </li>
          ))}
        </m.ol>
      </nav>

      <div className={styles.bottom}>
        <LanguageSwitcher size="lg" />
        <Button to={to('sponsors')} variant="primary" onClick={onClose}>
          {t('cta.becomePartner')}
        </Button>
      </div>
    </m.div>
  );
}
