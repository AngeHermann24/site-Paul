import { useRef, type ReactNode } from 'react';
import { useMotion } from '@/contexts/MotionContext';
import { useGsap } from '@/hooks/useGsap';
import { cx } from '@/utils/cx';
import styles from './RevealImage.module.css';

interface RevealImageProps {
  src?: string | null;
  alt: string;
  /** Ratio réservé (aucun layout shift), ex. "4 / 5". */
  ratio?: string;
  /** Légende / label superposé (2e profondeur de parallax). */
  overlay?: ReactNode;
  /** Texte du placeholder si aucune image. */
  placeholderLabel?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Image révélée par `clip-path: inset()` + zoom inversé (1.25 → 1) à l'entrée,
 * puis parallax interne à deux profondeurs (image / overlay) au scroll.
 * Sans `src` : placeholder sombre soigné (jamais de photo empruntée).
 */
export function RevealImage({
  src,
  alt,
  ratio = '4 / 5',
  overlay,
  placeholderLabel,
  className,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
}: RevealImageProps) {
  const root = useRef<HTMLElement>(null);
  const { reducedMotion, isMobile } = useMotion();

  useGsap(
    root,
    ({ gsap }) => {
      const el = root.current;
      if (!el) return;
      const frame = el.querySelector('[data-frame]');
      const media = el.querySelector('[data-media]');
      const over = el.querySelector('[data-overlay]');
      const trigger = { trigger: el, start: 'top 85%', once: true };

      if (reducedMotion) {
        gsap.from(frame, { opacity: 0, duration: 0.6, ease: 'none', scrollTrigger: trigger });
        return;
      }
      gsap
        .timeline({ scrollTrigger: trigger })
        .fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
        .fromTo(media, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, '<0.1');

      if (!isMobile) {
        const scrub = { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true };
        gsap.fromTo(el.querySelector('[data-depth]'), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: scrub });
        if (over) gsap.fromTo(over, { yPercent: 40 }, { yPercent: -40, ease: 'none', scrollTrigger: scrub });
      }
    },
    [reducedMotion, isMobile, src],
  );

  return (
    <figure ref={root} className={cx(styles.figure, className)} style={{ aspectRatio: ratio }}>
      <div data-frame="" className={styles.frame}>
        <div data-depth="" className={styles.depth}>
          <div data-media="" className={styles.media}>
            {src ? (
              <img
                src={src}
                alt={alt}
                sizes={sizes}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : 'auto'}
                className={styles.img}
              />
            ) : (
              <div className={styles.placeholder} role="img" aria-label={alt} />
            )}
          </div>
        </div>
        {!src && placeholderLabel && (
          <span className={cx('mono', styles.placeholderLabel)} aria-hidden="true">
            {placeholderLabel}
          </span>
        )}
      </div>
      {overlay && (
        <figcaption data-overlay="" className={styles.overlay}>
          {overlay}
        </figcaption>
      )}
    </figure>
  );
}
