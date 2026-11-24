import { useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';

export interface DeviceProfile {
  /** Écran tactile / pas de survol fiable : pas de curseur custom ni d'effets magnétiques. */
  isTouch: boolean;
  /** Viewport < 768px. */
  isMobile: boolean;
  /** Économie de données ou réseau lent : vidéo remplacée par le poster. */
  constrainedNetwork: boolean;
  /** Appareil peu puissant : pas de grain animé, parallax réduit. */
  lowPower: boolean;
}

export function useDeviceProfile(): DeviceProfile {
  const isTouch = useMediaQuery('(hover: none), (pointer: coarse)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  return useMemo(() => {
    const nav = typeof navigator === 'undefined' ? undefined : navigator;
    const conn = nav?.connection;
    const constrainedNetwork =
      Boolean(conn?.saveData) || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g' || conn?.effectiveType === '3g';
    const lowPower = (nav?.hardwareConcurrency ?? 8) <= 4 || (nav?.deviceMemory ?? 8) <= 4;
    return { isTouch, isMobile, constrainedNetwork, lowPower };
  }, [isTouch, isMobile]);
}
