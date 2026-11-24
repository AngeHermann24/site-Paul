import styles from './GridLines.module.css';

/** Lignes de grille verticales fines, fixes, purement décoratives. */
export function GridLines() {
  return (
    <div className={styles.grid} aria-hidden="true">
      <div className={styles.inner}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={styles.line} />
        ))}
      </div>
    </div>
  );
}
