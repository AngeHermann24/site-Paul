import { cx } from '@/utils/cx';
import styles from './Eyebrow.module.css';

interface EyebrowProps {
  /** Numérotation de section : "01", "02"… */
  index?: string;
  label: string;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

/** Micro-label technique façon HUD : `01 —— CHAMPION`. */
export function Eyebrow({ index, label, className, as: Tag = 'p' }: EyebrowProps) {
  return (
    <Tag className={cx('mono', styles.eyebrow, className)}>
      {index && <span className={styles.index}>{index}</span>}
      {index && <span className={styles.bar} aria-hidden="true" />}
      <span>{label}</span>
    </Tag>
  );
}
