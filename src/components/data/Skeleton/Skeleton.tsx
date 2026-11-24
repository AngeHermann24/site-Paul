import type { CSSProperties } from 'react';
import { cx } from '@/utils/cx';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  /** Ratio réservé (ex. "16 / 9") ; sinon hauteur. */
  ratio?: string;
  height?: string;
  width?: string;
  className?: string;
}

export function Skeleton({ ratio, height, width, className }: SkeletonProps) {
  const style: CSSProperties = { aspectRatio: ratio, height: ratio ? undefined : (height ?? '1rem'), width };
  return <span className={cx(styles.skeleton, className)} style={style} aria-hidden="true" />;
}

/** Grille de squelettes (listes, cartes). */
export function SkeletonGrid({ count = 3, ratio = '4 / 5', className }: { count?: number; ratio?: string; className?: string }) {
  return (
    <div className={cx(styles.grid, className)} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} ratio={ratio} />
      ))}
    </div>
  );
}
