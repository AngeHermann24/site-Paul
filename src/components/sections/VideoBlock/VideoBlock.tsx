import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { isDirectVideo, videoEmbedUrl } from '@/utils/format';
import { cx } from '@/utils/cx';
import styles from './VideoBlock.module.css';

interface VideoBlockProps {
  url: string;
  title: string;
  poster?: string | null;
  className?: string;
}

/**
 * Lecteur vidéo à la demande : rien n'est chargé (ni iframe tierce, ni cookie) avant le clic.
 * YouTube → youtube-nocookie, Vimeo → dnt=1, fichiers MP4/WebM → <video>.
 */
export function VideoBlock({ url, title, poster, className }: VideoBlockProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const embed = isDirectVideo(url) ? null : videoEmbedUrl(url);

  if (!embed && !isDirectVideo(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cx(styles.block, className)} data-cursor="play">
        <Cover poster={poster} />
        <span className={cx('mono', styles.label)}>
          <span className={styles.play}>
            <Play size={20} aria-hidden="true" />
          </span>
          {title}
        </span>
      </a>
    );
  }

  return (
    <div className={cx(styles.block, className)}>
      {playing ? (
        embed ? (
          <iframe
            className={styles.media}
            src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video className={styles.media} src={url} poster={poster ?? undefined} controls autoPlay playsInline />
        )
      ) : (
        <button type="button" className={styles.trigger} onClick={() => setPlaying(true)} data-cursor="play">
          <Cover poster={poster} />
          <span className={cx('mono', styles.label)}>
            <span className={styles.play}>
              <Play size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="sr-only">{t('fight.watch')} : </span>
              {title}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

function Cover({ poster }: { poster?: string | null }) {
  return poster ? (
    <img src={poster} alt="" className={styles.media} loading="lazy" decoding="async" />
  ) : (
    <span className={cx(styles.media, styles.placeholder)} aria-hidden="true" />
  );
}
