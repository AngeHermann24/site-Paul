import { useEffect } from 'react';
import { loadGsap } from '@/utils/gsap';

const STRENGTH = 0.28;
const MAX = 12;

/**
 * Effet magnétique délégué : tout élément `[data-magnetic]` suit légèrement la souris.
 * À activer uniquement sur desktop sans reduced-motion.
 */
export function useMagnetic(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      type Movers = { x: (v: number) => void; y: (v: number) => void };
      const movers = new WeakMap<HTMLElement, Movers>();
      let active: HTMLElement | null = null;

      const moversFor = (el: HTMLElement): Movers => {
        let m = movers.get(el);
        if (!m) {
          m = {
            x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }),
            y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' }),
          };
          movers.set(el, m);
        }
        return m;
      };

      const release = (el: HTMLElement) => {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto', clearProps: 'transform' });
        movers.delete(el);
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const target = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-magnetic]') : null;
        if (active && active !== target) {
          release(active);
          active = null;
        }
        if (!target) return;
        active = target;
        const rect = target.getBoundingClientRect();
        const clamp = gsap.utils.clamp(-MAX, MAX);
        const m = moversFor(target);
        m.x(clamp((e.clientX - (rect.left + rect.width / 2)) * STRENGTH));
        m.y(clamp((e.clientY - (rect.top + rect.height / 2)) * STRENGTH));
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        if (active) release(active);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [enabled]);
}
