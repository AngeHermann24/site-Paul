import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

/** État vide élégant : jamais de faux contenu, un message honnête et éventuellement une action. */
export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      <span className={styles.corner} aria-hidden="true" />
      <p className={cx('mono', styles.title)}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
