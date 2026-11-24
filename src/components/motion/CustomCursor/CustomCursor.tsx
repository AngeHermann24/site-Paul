import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { loadGsap } from '@/utils/gsap';
import styles from './CustomCursor.module.css';

const INTERACTIVE = 'a, button, [role="button"], [data-cursor], label, select, summary, video';
const TEXT_INPUT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea, [contenteditable="true"]';

/**
 * Curseur personnalisé (cercle + point). Monté uniquement sur desktop sans reduced-motion.
 * Grossit sur liens / boutons / vidéos ; libellé contextuel via `data-cursor="play"`.
 */
export function CustomCursor() {
  const { t } = useTranslation();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void loadGsap().then(({ gsap }) => {
      if (cancelled || !dot.current || !ring.current) return;
      const d = dot.current;
      const r = ring.current;
      const dx = gsap.quickTo(d, 'x', { duration: 0.12, ease: 'power3.out' });
      const dy = gsap.quickTo(d, 'y', { duration: 0.12, ease: 'power3.out' });
      const rx = gsap.quickTo(r, 'x', { duration: 0.45, ease: 'power3.out' });
      const ry = gsap.quickTo(r, 'y', { duration: 0.45, ease: 'power3.out' });
      let visible = false;

      document.documentElement.classList.add('has-custom-cursor');

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        dx(e.clientX);
        dy(e.clientY);
        rx(e.clientX);
        ry(e.clientY);
        if (!visible) {
          visible = true;
          gsap.set([d, r], { x: e.clientX, y: e.clientY });
          gsap.to([d, r], { opacity: 1, duration: 0.3 });
        }
      };

      const onOver = (e: PointerEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        if (!target) return;
        const textInput = target.closest(TEXT_INPUT);
        const interactive = !textInput && target.closest(INTERACTIVE);
        const mode = interactive instanceof HTMLElement ? interactive.dataset.cursor : undefined;
        r.dataset.state = textInput ? 'hidden' : interactive ? (mode === 'play' ? 'play' : 'hover') : 'idle';
        d.dataset.state = textInput ? 'hidden' : interactive ? 'hover' : 'idle';
        if (label.current) label.current.textContent = mode === 'play' ? t('cursor.play') : '';
      };

      const onLeave = () => {
        visible = false;
        gsap.to([d, r], { opacity: 0, duration: 0.2 });
      };
      const onDown = () => r.classList.add(styles.pressed ?? '');
      const onUp = () => r.classList.remove(styles.pressed ?? '');

      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerover', onOver, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });

      cleanup = () => {
        document.documentElement.classList.remove('has-custom-cursor');
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerover', onOver);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [t]);

  return (
    <div className={styles.layer} aria-hidden="true">
      <div ref={ring} className={styles.ring} data-state="idle">
        <span ref={label} className={styles.label} />
      </div>
      <div ref={dot} className={styles.dot} data-state="idle" />
    </div>
  );
}
