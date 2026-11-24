import { useRef } from 'react';
import { useMotion } from '@/contexts/MotionContext';
import { useGsap } from '@/hooks/useGsap';
import { cx } from '@/utils/cx';
import styles from './ScrubText.module.css';

interface ScrubTextProps {
  text: string;
  className?: string;
  id?: string;
}

/**
 * Paragraphe dont les mots passent de 0.15 → 1 d'opacité, liés au scroll (scrub).
 * À réserver à UNE section clé. Reduced-motion : texte statique.
 */
export function ScrubText({ text, className, id }: ScrubTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { reducedMotion } = useMotion();
  const words = text.split(/\s+/).filter(Boolean);

  useGsap(
    ref,
    ({ gsap }) => {
      if (reducedMotion || !ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll('[data-word]'),
        { opacity: 0.15 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        },
      );
    },
    [reducedMotion, text],
  );

  return (
    <p ref={ref} id={id} className={cx(styles.text, className)}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} data-word="" className={styles.word}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
