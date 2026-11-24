import type { DependencyList, RefObject } from 'react';
import { useGsap } from './useGsap';

/**
 * Révèle tous les titres `[data-reveal="lines"]` du scope : chaque `[data-line]`
 * glisse de 110 % → 0 dans son masque. Reduced-motion : simple fondu.
 * Le contenu n'est jamais bloqué : animations `once`, état final = état CSS naturel.
 */
export function useRevealLines(
  scope: RefObject<HTMLElement | null>,
  { enabled, reduced }: { enabled: boolean; reduced: boolean },
  deps: DependencyList,
): void {
  useGsap(
    scope,
    ({ gsap, ScrollTrigger }) => {
      if (!enabled) return;
      const headings = gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]');
      headings.forEach((heading) => {
        const inView = ScrollTrigger.isInViewport(heading, 0.05);
        const scrollTrigger = { trigger: heading, start: 'top 88%', once: true };
        if (reduced) {
          gsap.from(heading, { opacity: 0, duration: 0.6, ease: 'none', scrollTrigger });
          return;
        }
        gsap.from(heading.querySelectorAll('[data-line]'), {
          yPercent: 110,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.09,
          delay: inView ? 0.15 : 0,
          scrollTrigger,
        });
      });
    },
    [enabled, reduced, ...deps],
  );
}
