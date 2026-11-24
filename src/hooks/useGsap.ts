import { useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react';
import { getGsap, loadGsap, type GsapBundle } from '@/utils/gsap';

type Setup = (bundle: GsapBundle) => void | (() => void);

/**
 * Exécute des animations GSAP dans un `gsap.context()` limité à `scope`,
 * puis `ctx.revert()` automatiquement au démontage / changement de deps.
 * Si GSAP est déjà chargé, l'exécution est synchrone (aucun flash avant la 1re frame).
 */
export function useGsap(scope: RefObject<HTMLElement | null>, setup: Setup, deps: DependencyList = []): void {
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useLayoutEffect(() => {
    let cancelled = false;
    let revert: (() => void) | undefined;

    const run = (b: GsapBundle) => {
      if (cancelled || !scope.current) return;
      let cleanup: void | (() => void);
      const ctx = b.gsap.context(() => {
        cleanup = setupRef.current(b);
      }, scope.current);
      revert = () => {
        if (typeof cleanup === 'function') cleanup();
        ctx.revert();
      };
    };

    const loaded = getGsap();
    if (loaded) run(loaded);
    else void loadGsap().then(run);

    return () => {
      cancelled = true;
      revert?.();
    };
  }, deps);
}
