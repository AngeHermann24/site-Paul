import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/contexts/MotionContext';
import { useGsap } from '@/hooks/useGsap';
import { cx } from '@/utils/cx';
import styles from './Timeline.module.css';

export interface TimelineItem {
  id: string;
  year: number | null;
  title: string;
  description?: string | null;
  tag?: string;
}

/**
 * Timeline de carrière (recette 6).
 * Desktop : section épinglée, la piste défile horizontalement pendant le scroll vertical.
 * Mobile / reduced-motion : liste verticale native.
 */
export function Timeline({ items, label }: { items: TimelineItem[]; label: string }) {
  const { t } = useTranslation();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const { isMobile, reducedMotion } = useMotion();
  const horizontal = !isMobile && !reducedMotion;

  useGsap(
    root,
    ({ gsap }) => {
      if (!horizontal || !root.current || !track.current) return;
      const distance = () => Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth);
      if (distance() <= 0) return;
      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      gsap.fromTo(
        root.current.querySelector('[data-progress]'),
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: true } },
      );
    },
    [horizontal, items],
  );

  return (
    <section ref={root} className={cx(styles.timeline, horizontal ? styles.horizontal : styles.vertical)} aria-label={label}>
      <div className={styles.head}>
        <p className={cx('mono', styles.label)}>{label}</p>
        {horizontal && (
          <p className={cx('mono', styles.hint)} aria-hidden="true">
            {t('championPage.timelineHint')} →
          </p>
        )}
      </div>
      <ol ref={track} className={styles.track}>
        {items.map((item, i) => (
          <li key={item.id} className={styles.item}>
            <span className={cx('display', styles.year)}>{item.year ?? '—'}</span>
            <span className={cx('mono', styles.index)}>{String(i + 1).padStart(2, '0')}{item.tag ? ` — ${item.tag}` : ''}</span>
            <h3 className={cx('display', styles.title)}>{item.title}</h3>
            {item.description && <p className={styles.description}>{item.description}</p>}
          </li>
        ))}
      </ol>
      {horizontal && (
        <span className={styles.progress} aria-hidden="true">
          <span data-progress="" className={styles.progressBar} />
        </span>
      )}
    </section>
  );
}
