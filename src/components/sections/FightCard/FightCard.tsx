import { useRef, type PointerEvent } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/contexts/MotionContext';
import { useLang, useLocalePath } from '@/hooks/useLang';
import type { Fight } from '@/services/fights';
import { formatDate } from '@/utils/format';
import { cx } from '@/utils/cx';
import styles from './FightCard.module.css';

interface FightCardProps {
  fight: Fight;
  /** `feature` : grande carte horizontale (dernier / prochain combat). */
  variant?: 'grid' | 'feature';
  headingLevel?: 'h2' | 'h3';
}

/** Carte de combat (recette 10) : tilt léger, zoom photo, résultat W/L/D révélé avec un trait rouge. */
export function FightCard({ fight, variant = 'grid', headingLevel: H = 'h3' }: FightCardProps) {
  const { t } = useTranslation();
  const lang = useLang();
  const to = useLocalePath();
  const { isTouch, reducedMotion } = useMotion();
  const card = useRef<HTMLAnchorElement>(null);
  const frame = useRef(0);

  const tilt = !isTouch && !reducedMotion;
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!tilt || !card.current) return;
    const el = card.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    if (card.current) card.current.style.transform = '';
  };

  const result = fight.result;
  const place = [fight.city, fight.country].filter(Boolean).join(', ');
  const outcome =
    fight.fightStatus === 'completed' && result
      ? [t(`enums.fightResult.${result}`), fight.method && t(`enums.fightMethod.${fight.method}`), fight.roundEnded && t('fight.round', { round: fight.roundEnded })]
          .filter(Boolean)
          .join(' · ')
      : t(`enums.fightStatus.${fight.fightStatus}`);

  return (
    <Link
      ref={card}
      to={to('fights', fight.slug)}
      className={cx(styles.card, styles[variant], result && styles[result])}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor="link"
      aria-label={`${t('fight.open')} : ${t('fight.vs')} ${fight.opponentName}, ${formatDate(lang, fight.eventDate)}`}
    >
      <div className={styles.media} aria-hidden="true">
        {fight.cover ? (
          <img className={styles.img} src={fight.cover.url} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className={styles.placeholder} />
        )}
        {result && <span className={cx('display', styles.badge)}>{t(`enums.fightResultShort.${result}`)}</span>}
      </div>

      <div className={styles.body}>
        <p className={cx('mono', styles.meta)}>
          <time dateTime={fight.eventDate}>{formatDate(lang, fight.eventDate, 'short')}</time>
          <span>{t(`enums.fightCategory.${fight.category}`)}</span>
        </p>
        <H className={cx('display', styles.title)}>
          <span className={styles.vs}>{t('fight.vs')}</span> {fight.opponentName}
        </H>
        {(fight.eventName || place) && <p className={styles.event}>{[fight.eventName, place].filter(Boolean).join(' — ')}</p>}
        <p className={cx('mono', styles.outcome)}>
          <span className={styles.line} aria-hidden="true" />
          {outcome}
        </p>
      </div>
    </Link>
  );
}
