import styles from './RouteFallback.module.css';

/** Affiché pendant le chargement lazy d'une page : fine ligne rouge, jamais d'écran bloquant. */
export function RouteFallback() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <span className={styles.bar} aria-hidden="true" />
    </div>
  );
}
