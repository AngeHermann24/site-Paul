import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Play, Volume2, X } from 'lucide-react';
import { useMotion } from '@/contexts/MotionContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { MediaItem } from '@/services/media';
import { isDirectVideo, videoEmbedUrl } from '@/utils/format';
import { cx } from '@/utils/cx';
import styles from './MediaGallery.module.css';

interface MediaGalleryProps {
  items: MediaItem[];
  /** `mosaic` : composition éditoriale (accueil) ; `grid` : médiathèque. */
  layout?: 'grid' | 'mosaic';
}

/** Galerie photo/vidéo/audio avec lightbox accessible (clavier, focus piégé, Échap, flèches). */
export function MediaGallery({ items, layout = 'grid' }: MediaGalleryProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <ul role="list" className={cx(styles.gallery, styles[layout])}>
        {items.map((item, i) => {
          const thumb = item.kind === 'image' ? item.url : item.posterUrl;
          const label = item.title ?? item.alt ?? t(`enums.mediaKind.${item.kind}`);
          return (
            <li key={item.id} className={styles.cell}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => setIndex(i)}
                aria-label={t('mediaPage.open', { title: label })}
                aria-haspopup="dialog"
                data-cursor={item.kind === 'image' ? 'link' : 'play'}
              >
                {thumb ? (
                  <img src={thumb} alt="" loading="lazy" decoding="async" className={styles.img} />
                ) : (
                  <span className={styles.placeholder} />
                )}
                {item.kind !== 'image' && (
                  <span className={styles.kind} aria-hidden="true">
                    {item.kind === 'video' ? <Play size={20} /> : <Volume2 size={20} />}
                  </span>
                )}
                <span className={cx('mono', styles.caption)} aria-hidden="true">
                  {t(`enums.mediaCategory.${item.category}`)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {createPortal(
        <AnimatePresence>
          {index !== null && <Lightbox items={items} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: MediaItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { setScrollLocked, reducedMotion } = useMotion();
  const dialog = useRef<HTMLDivElement>(null);
  const item = items[index];
  const total = items.length;

  useFocusTrap(dialog, onClose);

  useEffect(() => {
    setScrollLocked(true);
    return () => setScrollLocked(false);
  }, [setScrollLocked]);

  const go = useCallback((delta: number) => onIndex((index + delta + total) % total), [index, total, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (!item) return null;
  const title = item.title ?? item.alt;
  const embed = item.kind === 'video' && !isDirectVideo(item.url) ? videoEmbedUrl(item.url) : null;

  return (
    <m.div
      ref={dialog}
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={title || t(`enums.mediaKind.${item.kind}`)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25 }}
      data-lenis-prevent=""
    >
      <div className={styles.bar}>
        <p className="mono" aria-live="polite">
          {t('mediaPage.counter', { current: index + 1, total })}
        </p>
        <button type="button" className={styles.icon} onClick={onClose} aria-label={t('mediaPage.close')}>
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <figure className={styles.stage}>
        <m.div
          key={item.id}
          className={styles.frame}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {item.kind === 'image' && <img src={item.url} alt={item.alt} className={styles.full} />}
          {item.kind === 'video' &&
            (embed ? (
              <iframe
                className={styles.embed}
                src={embed}
                title={title || 'Video'}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <video className={styles.full} src={item.url} poster={item.posterUrl ?? undefined} controls playsInline autoPlay />
            ))}
          {item.kind === 'audio' && <audio className={styles.audio} src={item.url} controls autoPlay />}
        </m.div>
        {(item.caption || item.credit) && (
          <figcaption className={styles.figcaption}>
            {item.caption}
            {item.credit && <span className="mono"> © {item.credit}</span>}
          </figcaption>
        )}
      </figure>

      {total > 1 && (
        <div className={styles.nav}>
          <button type="button" className={styles.icon} onClick={() => go(-1)} aria-label={t('mediaPage.previous')}>
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
          <button type="button" className={styles.icon} onClick={() => go(1)} aria-label={t('mediaPage.next')}>
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        </div>
      )}
    </m.div>
  );
}
