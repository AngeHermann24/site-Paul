import styles from './Grain.module.css';

/** Grain de film : bruit SVG très léger animé en steps (désactivé en reduced-motion / mobile / appareils faibles). */
export function Grain() {
  return <div className={styles.grain} aria-hidden="true" />;
}
