import type { Lang } from '@/routes/paths';

const LOCALE: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' };

/** Date ISO (`2025-03-15` ou timestamp) → texte localisé. Les dates seules sont traitées en UTC (pas de décalage). */
export function formatDate(lang: Lang, iso: string | null | undefined, style: 'long' | 'short' | 'month' = 'long'): string {
  if (!iso) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const date = new Date(dateOnly ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(date.getTime())) return '';
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : style === 'month'
        ? { month: 'short', year: 'numeric' }
        : { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(LOCALE[lang], { ...options, timeZone: dateOnly ? 'UTC' : undefined }).format(date);
}

export function formatPrice(lang: Lang, cents: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(LOCALE[lang]).format(value);
}

/** Jours restants avant une date (0 = aujourd'hui), négatif si passée. */
export function daysUntil(iso: string): number {
  const target = new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime();
  const today = new Date();
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - utcToday) / 86_400_000);
}

/** Extrait l'identifiant d'une vidéo YouTube / Vimeo pour un lecteur intégré sans cookies tiers. */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;
  return null;
}

export const isDirectVideo = (url: string | null | undefined) => Boolean(url && /\.(mp4|webm)(\?|$)/i.test(url));
