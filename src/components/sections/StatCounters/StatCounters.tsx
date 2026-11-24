import { useRef } from 'react';
import { useLang } from '@/hooks/useLang';
import { useGsap } from '@/hooks/useGsap';
import { useMotion } from '@/contexts/MotionContext';
import { formatNumber } from '@/utils/format';
import { cx } from '@/utils/cx';
import styles from './StatCounters.module.css';

export interface StatItem {
  key: string;
  label: string;
  /** `null` = valeur non communiquée : la case n'est pas affichée. */
  value: number | null;
  accent?: boolean;
}

/**
 * Compteurs animés à l'entrée dans le viewport (recette 7).
 * Valeurs UNIQUEMENT fournies par la base ; la valeur finale est rendue dans le HTML
 * (accessibilité, SEO, aucun contenu bloqué), l'animation ne fait que la rejouer.
 */
export function StatCounters({ items: allItems, note, className }: { items: StatItem[]; note?: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const items = allItems.filter((i): i is StatItem & { value: number } => i.value !== null);
  const lang = useLang();
  const { reducedMotion } = useMotion();

  useGsap(
    root,
    ({ gsap }) => {
      if (reducedMotion) return;
      const counters = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-count]') ?? []);
      counters.forEach((el) => {
        const target = Number(el.dataset.count);
        const state = { v: 0 };
        el.textContent = formatNumber(lang, 0);
        gsap.to(state, {
          v: target,
          duration: Math.min(2.2, 0.9 + target / 40),
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = formatNumber(lang, Math.round(state.v));
          },
        });
      });
      // Au démontage / changement : la valeur réelle est toujours restaurée.
      return () => counters.forEach((el) => (el.textContent = formatNumber(lang, Number(el.dataset.count))));
    },
    [items, reducedMotion, lang],
  );

  return (
    <div ref={root} className={className}>
      <dl className={styles.grid}>
        {items.map((item) => (
          <div key={item.key} className={cx(styles.cell, item.accent && styles.accent)}>
            <dt className={cx('mono', styles.label)}>{item.label}</dt>
            <dd className={cx('display', styles.value)}>
              <span data-count={item.value}>{formatNumber(lang, item.value)}</span>
            </dd>
          </div>
        ))}
      </dl>
      {note && <p className={cx('mono', styles.note)}>{note}</p>}
    </div>
  );
}
