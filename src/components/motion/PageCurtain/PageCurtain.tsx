import { useImperativeHandle, useRef, type Ref } from 'react';
import { useAnimate } from 'framer-motion';
import { cx } from '@/utils/cx';
import styles from './PageCurtain.module.css';

export interface PageCurtainHandle {
  /** Couvre l'écran (rouge puis noir) et affiche le nom de la page de destination. */
  cover: (label: string) => Promise<void>;
  /** Découvre l'écran vers le haut. */
  reveal: () => Promise<void>;
}

const EASE = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Rideau de transition de page (~600 ms aller-retour), piloté par Framer Motion. */
export function PageCurtain({ ref }: { ref: Ref<PageCurtainHandle> }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const label = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => {
    const setOrigin = (origin: string) =>
      scope.current.querySelectorAll<HTMLElement>('[data-panel]').forEach((el) => {
        el.style.transformOrigin = origin;
      });

    return {
      async cover(text) {
        if (label.current) label.current.textContent = text;
        scope.current.style.visibility = 'visible';
        setOrigin('50% 100%');
        await Promise.all([
          animate('[data-panel="red"]', { scaleY: 1 }, { duration: 0.3, ease: EASE }),
          animate('[data-panel="black"]', { scaleY: 1 }, { duration: 0.3, ease: EASE, delay: 0.05 }),
          animate('[data-label]', { y: '0%' }, { duration: 0.3, ease: EASE_OUT, delay: 0.12 }),
        ]);
      },
      async reveal() {
        setOrigin('50% 0%');
        await Promise.all([
          animate('[data-label]', { y: '-105%' }, { duration: 0.22, ease: EASE }),
          animate('[data-panel="black"]', { scaleY: 0 }, { duration: 0.32, ease: EASE, delay: 0.04 }),
          animate('[data-panel="red"]', { scaleY: 0 }, { duration: 0.32, ease: EASE, delay: 0.1 }),
        ]);
        await animate('[data-label]', { y: '105%' }, { duration: 0 });
        scope.current.style.visibility = 'hidden';
      },
    };
  }, [animate, scope]);

  return (
    <div ref={scope} className={styles.curtain} aria-hidden="true">
      <div data-panel="red" className={cx(styles.panel, styles.red)} style={{ transform: 'scaleY(0)' }} />
      <div data-panel="black" className={cx(styles.panel, styles.black)} style={{ transform: 'scaleY(0)' }}>
        <span className={styles.mask}>
          <span ref={label} data-label="" className={cx('display', styles.label)} style={{ transform: 'translateY(105%)' }} />
        </span>
        <span className={cx('mono', styles.meta)}>PAUL — OFFICIAL</span>
      </div>
    </div>
  );
}
