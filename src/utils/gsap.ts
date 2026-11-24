/**
 * Point d'entrée UNIQUE de GSAP.
 * - Chargé en lazy (chunk séparé) pour ne pas alourdir le bundle initial.
 * - Un seul `registerPlugin` pour tout le projet.
 * - Le découpage lettres/lignes/mots est fait en React (markup accessible), d'où l'absence de SplitText.
 */
import type { gsap as GsapInstance } from 'gsap';
import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger';

export interface GsapBundle {
  gsap: typeof GsapInstance;
  ScrollTrigger: typeof ScrollTriggerClass;
}

let bundle: GsapBundle | null = null;
let pending: Promise<GsapBundle> | null = null;

export function loadGsap(): Promise<GsapBundle> {
  if (bundle) return Promise.resolve(bundle);
  pending ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([core, st]) => {
    const { gsap } = core;
    gsap.registerPlugin(st.ScrollTrigger);
    gsap.defaults({ ease: 'power3.out', duration: 0.9 });
    st.ScrollTrigger.config({ ignoreMobileResize: true });
    bundle = { gsap, ScrollTrigger: st.ScrollTrigger };
    return bundle;
  });
  return pending;
}

/** Retourne le bundle s'il est déjà chargé (permet d'animer de façon synchrone, sans flash). */
export function getGsap(): GsapBundle | null {
  return bundle;
}
