import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIntro } from '@/contexts/IntroContext';
import { useMotion } from '@/contexts/MotionContext';
import { getAssetProgress, trackAsset, trackCriticalFonts } from '@/utils/assetGate';
import { loadGsap } from '@/utils/gsap';
import { cx } from '@/utils/cx';
import styles from './Preloader.module.css';

/** Durée minimale courte : jamais de délai artificiel au-delà. */
const MIN_DURATION = 1200;
const HARD_CAP = 9000;

export function Preloader() {
  const { showPreloader } = useIntro();
  const [mounted, setMounted] = useState(showPreloader);
  if (!mounted) return null;
  return <PreloaderView onUnmount={() => setMounted(false)} />;
}

function PreloaderView({ onUnmount }: { onUnmount: () => void }) {
  const { t } = useTranslation();
  const { completeIntro } = useIntro();
  const { setScrollLocked } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const panelL = useRef<HTMLDivElement>(null);
  const panelR = useRef<HTMLDivElement>(null);
  const finishing = useRef(false);
  const raf = useRef(0);

  const finish = useCallback(
    async (fast: boolean) => {
      if (finishing.current) return;
      finishing.current = true;
      cancelAnimationFrame(raf.current);
      if (counter.current) counter.current.textContent = '100';
      if (bar.current) bar.current.style.transform = 'scaleX(1)';

      const { gsap } = await loadGsap();
      const tl = gsap.timeline({
        onComplete: () => {
          setScrollLocked(false);
          onUnmount();
        },
      });
      if (!fast) {
        tl.set(flash.current, { backgroundColor: '#ffffff' })
          .to(flash.current, { opacity: 0.85, duration: 0.05, ease: 'none' })
          .set(flash.current, { backgroundColor: '#E10613' })
          .to(flash.current, { opacity: 0, duration: 0.22, ease: 'power2.out' });
      }
      tl.to(content.current, { yPercent: -30, opacity: 0, duration: fast ? 0.25 : 0.45, ease: 'power3.in' }, fast ? 0 : '<')
        .add(() => completeIntro())
        .to(panelL.current, { clipPath: 'inset(0% 100% 0% 0%)', duration: fast ? 0.6 : 1, ease: 'expo.inOut' })
        .to(panelR.current, { clipPath: 'inset(0% 0% 0% 100%)', duration: fast ? 0.6 : 1, ease: 'expo.inOut' }, '<');
    },
    [completeIntro, onUnmount, setScrollLocked],
  );

  useEffect(() => {
    setScrollLocked(true);
    trackCriticalFonts();
    trackAsset(loadGsap());

    const start = performance.now();
    let shown = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const timeCap = Math.min(100, (elapsed / MIN_DURATION) * 100);
      const goal = elapsed > HARD_CAP ? 100 : Math.min(getAssetProgress() * 100, timeCap);
      shown += (goal - shown) * 0.14;
      if (goal - shown < 0.4) shown = goal;
      const value = Math.floor(shown);
      if (counter.current) counter.current.textContent = String(value).padStart(2, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${shown / 100})`;
      if (value >= 100) void finish(false);
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && void finish(true);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('keydown', onKey);
      setScrollLocked(false);
    };
  }, [finish, setScrollLocked]);

  return (
    <div ref={root} className={styles.preloader} role="status" aria-label={t('preloader.loading')}>
      <div ref={panelL} className={cx(styles.panel, styles.left)} aria-hidden="true" />
      <div ref={panelR} className={cx(styles.panel, styles.right)} aria-hidden="true" />

      <div ref={content} className={styles.content}>
        <div className={cx('mono', styles.hudTop)} aria-hidden="true">
          <span>{t('preloader.round')}</span>
          <span className={styles.live}>
            <span className={styles.dot} /> {t('preloader.loading')}
          </span>
        </div>

        <div className={styles.center} aria-hidden="true">
          <span className={cx('display', styles.logo)}>
            PAUL<span className={styles.mark} />
          </span>
          <span className={styles.counter}>
            <span ref={counter}>00</span>
          </span>
        </div>

        <div className={styles.bottom}>
          <span className={styles.track} aria-hidden="true">
            <span ref={bar} className={styles.bar} />
          </span>
          <button type="button" className={cx('mono', styles.skip)} onClick={() => void finish(true)}>
            {t('preloader.skip')}
          </button>
        </div>
      </div>

      <div ref={flash} className={styles.flash} aria-hidden="true" />
    </div>
  );
}
