import { useMediaQuery } from './useMediaQuery';

/** `true` si l'utilisateur a demandé à réduire les animations (prefers-reduced-motion: reduce). */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
