import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type Lenis from 'lenis';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDeviceProfile, type DeviceProfile } from '@/hooks/useDeviceProfile';
import { loadGsap } from '@/utils/gsap';

interface MotionContextValue extends DeviceProfile {
  reducedMotion: boolean;
  /** Animations riches autorisées (ni reduced-motion, ni appareil faible). */
  richMotion: boolean;
  lenis: Lenis | null;
  scrollTo: (target: number | string | HTMLElement, opts?: { immediate?: boolean; offset?: number }) => void;
  /** Bloque / débloque le scroll (menu, modals). */
  setScrollLocked: (locked: boolean) => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const device = useDeviceProfile();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Lenis : smooth scroll global, synchronisé avec le ticker GSAP et ScrollTrigger.
  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    Promise.all([loadGsap(), import('lenis')]).then(([{ gsap, ScrollTrigger }, { default: LenisCtor }]) => {
      if (cancelled) return;
      const instance = new LenisCtor({ autoRaf: false, lerp: 0.1, smoothWheel: true, anchors: true });
      const raf = (time: number) => instance.raf(time * 1000);
      instance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenisRef.current = instance;
      setLenis(instance);
      teardown = () => {
        gsap.ticker.remove(raf);
        instance.destroy();
        lenisRef.current = null;
        setLenis(null);
      };
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [reducedMotion]);

  const scrollTo = useCallback<MotionContextValue['scrollTo']>((target, opts = {}) => {
    const instance = lenisRef.current;
    if (instance) {
      instance.scrollTo(target, { immediate: opts.immediate ?? false, offset: opts.offset ?? 0, force: true });
      return;
    }
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'auto' });
      return;
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, []);

  const setScrollLocked = useCallback((locked: boolean) => {
    const instance = lenisRef.current;
    if (instance) {
      if (locked) instance.stop();
      else instance.start();
    }
    document.documentElement.style.overflow = locked ? 'hidden' : '';
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({
      ...device,
      reducedMotion,
      richMotion: !reducedMotion && !device.lowPower,
      lenis,
      scrollTo,
      setScrollLocked,
    }),
    [device, reducedMotion, lenis, scrollTo, setScrollLocked],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error('useMotion must be used inside <MotionProvider>');
  return ctx;
}
