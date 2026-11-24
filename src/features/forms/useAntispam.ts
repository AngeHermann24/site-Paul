import { useRef } from 'react';
import { MIN_SUBMIT_DELAY_MS } from '@/schemas/requests';

/**
 * Pièges anti-robots partagés : délai minimum de soumission + détection honeypot.
 * La vérification se fait AVANT la validation du schéma : un robot qui remplit le
 * champ `website` ou envoie instantanément reçoit un faux succès, sans insertion.
 */
export function useAntispam() {
  const mountedAt = useRef(Date.now());
  const isSpam = (websiteValue: string | undefined | null) =>
    Boolean(websiteValue) || Date.now() - mountedAt.current < MIN_SUBMIT_DELAY_MS;
  /** À appeler quand le formulaire est ré-affiché (nouveau délai à respecter). */
  const reset = () => {
    mountedAt.current = Date.now();
  };
  return { isSpam, reset };
}
