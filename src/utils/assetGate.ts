/**
 * Registre des assets critiques attendus par le préloader.
 * Chaque tâche est plafonnée dans le temps : le préloader ne bloque jamais le contenu.
 */
type Listener = () => void;

const MAX_TASK_MS = 6000;
let total = 0;
let done = 0;
let pageReady = false;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

function withTimeout(p: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    p.then(
      () => resolve(),
      () => resolve(),
    ).finally(() => window.clearTimeout(timer));
  });
}

/** Déclare un asset critique (police, poster, vidéo…). */
export function trackAsset(p: Promise<unknown>, timeoutMs = MAX_TASK_MS): void {
  total += 1;
  notify();
  void withTimeout(p, timeoutMs).then(() => {
    done += 1;
    notify();
  });
}

/** Appelé quand la page de la route courante est montée (chunk lazy chargé). */
export function markPageReady(): void {
  if (pageReady) return;
  pageReady = true;
  notify();
}

/** Progression réelle 0 → 1. Plafonnée à 0.9 tant que la page n'est pas montée. */
export function getAssetProgress(): number {
  const ratio = total === 0 ? 1 : done / total;
  return pageReady ? ratio : Math.min(ratio, 1) * 0.9;
}

export function subscribeAssets(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Polices critiques : titres, texte, HUD. */
export function trackCriticalFonts(): void {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  trackAsset(
    Promise.all([
      document.fonts.load('400 1em "Anton"'),
      document.fonts.load('400 1em "Inter Variable"'),
      document.fonts.load('400 1em "JetBrains Mono"'),
    ]),
    3000,
  );
}
