import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIntro } from '@/contexts/IntroContext';
import { useMotion } from '@/contexts/MotionContext';
import { useGsap } from '@/hooks/useGsap';
import { useLocalePath } from '@/hooks/useLang';
import { HERO_MEDIA } from '@/config/media';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { trackAsset } from '@/utils/assetGate';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/Button/Button';
import { Container } from '@/components/ui/Container/Container';
import { RoundClock } from './RoundClock';
import styles from './Hero.module.css';

const LETTERS = ['P', 'A', 'U', 'L'] as const;

export function Hero({ nextId }: { nextId: string }) {
  const { t } = useTranslation();
  const to = useLocalePath();
  const { introDone } = useIntro();
  const { reducedMotion, isTouch, isMobile, constrainedNetwork, scrollTo } = useMotion();
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // `pending` : état initial caché posé en CSS pour éviter tout flash avant GSAP.
  const [phase, setPhase] = useState<'pending' | 'played'>(reducedMotion ? 'played' : 'pending');

  // Médias administrables (site_settings) prioritaires, sinon configuration d'environnement.
  const settings = useSiteSettings();
  const media = {
    videoMp4: settings?.hero.mp4 || HERO_MEDIA.videoMp4,
    videoWebm: settings?.hero.webm || HERO_MEDIA.videoWebm,
    videoMobileMp4: settings?.hero.mobile || HERO_MEDIA.videoMobileMp4,
    poster: settings?.hero.poster || HERO_MEDIA.poster,
  };
  const hasVideo = Boolean(
    media.videoMp4 || media.videoWebm || (isMobile && media.videoMobileMp4),
  );
  const playVideo = hasVideo && !constrainedNetwork && !reducedMotion;
  const videoSrc = isMobile && media.videoMobileMp4 ? media.videoMobileMp4 : media.videoMp4;

  // Assets critiques réels pour le préloader : poster décodé, vidéo prête.
  useEffect(() => {
    if (media.poster) {
      const img = new Image();
      img.src = media.poster;
      trackAsset(img.decode());
    }
    const v = video.current;
    if (playVideo && v) {
      trackAsset(
        new Promise<void>((resolve) => {
          if (v.readyState >= 2) return resolve();
          v.addEventListener('loadeddata', () => resolve(), { once: true });
          v.addEventListener('error', () => resolve(), { once: true });
        }),
        4000,
      );
    }
  }, [playVideo, media.poster]);

  // Pause de la vidéo hors écran (économie batterie/CPU).
  useEffect(() => {
    const v = video.current;
    const el = root.current;
    if (!v || !el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void v.play().catch(() => undefined);
      else v.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [playVideo, media.poster]);

  // Filet de sécurité : jamais de contenu bloqué si GSAP ne se charge pas.
  useEffect(() => {
    if (phase !== 'pending') return;
    const id = window.setTimeout(() => setPhase('played'), introDone ? 4000 : 12000);
    return () => window.clearTimeout(id);
  }, [phase, introDone]);

  // Timeline d'entrée.
  useGsap(
    root,
    ({ gsap }) => {
      if (reducedMotion || !introDone || phase !== 'pending') return;
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo('[data-hero-media]', { scale: 1.18, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.4 }, 0)
        // `y: 0` neutralise le translateY CSS de l'état `pending` (sinon GSAP le conserve en px).
        .fromTo('[data-hero-char]', { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.3, stagger: 0.075 }, 0.15)
        .fromTo('[data-hero-role]', { y: 0, yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.07 }, 0.55)
        .fromTo('[data-hero-fade]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.8)
        .fromTo('[data-hero-hud]', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'none' }, 0.9)
        .add(() => setPhase('played'));
    },
    [introDone, reducedMotion],
  );

  // Parallax souris (desktop) + lumière rouge qui suit le pointeur.
  useGsap(
    root,
    ({ gsap }) => {
      if (reducedMotion || isTouch || !root.current) return;
      const el = root.current;
      const light = el.querySelector('[data-hero-light]');
      const layers = gsap.utils.toArray<HTMLElement>('[data-depth]', el);
      const lightX = gsap.quickTo(light, 'x', { duration: 1.2, ease: 'power3.out' });
      const lightY = gsap.quickTo(light, 'y', { duration: 1.2, ease: 'power3.out' });
      const movers = layers.map((layer) => ({
        depth: Number(layer.dataset.depth) || 0,
        x: gsap.quickTo(layer, 'x', { duration: 1, ease: 'power3.out' }),
        y: gsap.quickTo(layer, 'y', { duration: 1, ease: 'power3.out' }),
      }));

      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        if (e.clientY > rect.bottom) return;
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        lightX(e.clientX - rect.left);
        lightY(e.clientY - rect.top);
        movers.forEach((m) => {
          m.x(nx * m.depth);
          m.y(ny * m.depth);
        });
      };
      gsap.set(light, { x: el.clientWidth * 0.68, y: el.clientHeight * 0.38 });
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    },
    [reducedMotion, isTouch],
  );

  // Sortie au scroll : le titre monte, le média s'enfonce, l'overlay se densifie.
  useGsap(
    root,
    ({ gsap }) => {
      if (reducedMotion || !root.current) return;
      const scrollTrigger = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('[data-hero-scroll="title"]', { yPercent: isMobile ? -10 : -22, ease: 'none', scrollTrigger });
      gsap.to('[data-hero-scroll="media"]', { yPercent: 18, scale: 1.08, ease: 'none', scrollTrigger });
      gsap.to('[data-hero-scroll="shade"]', { opacity: 0.85, ease: 'none', scrollTrigger });
    },
    [reducedMotion, isMobile],
  );

  return (
    <section ref={root} className={styles.hero} aria-labelledby="hero-title" data-phase={phase}>
      <div className={styles.mediaWrap} data-hero-scroll="media" aria-hidden="true">
        <div className={styles.mediaDepth} data-depth="-24">
          <div className={styles.media} data-hero-media="">
            {playVideo ? (
              <video
                ref={video}
                className={styles.video}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={media.poster || undefined}
                tabIndex={-1}
              >
                {media.videoWebm && !isMobile && <source src={media.videoWebm} type="video/webm" />}
                {videoSrc && <source src={videoSrc} type="video/mp4" />}
              </video>
            ) : media.poster ? (
              <img className={styles.video} src={media.poster} alt="" fetchPriority="high" decoding="async" />
            ) : (
              <div className={styles.placeholder} />
            )}
          </div>
        </div>
      </div>

      <div className={styles.light} data-hero-light="" aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.shadeScroll} data-hero-scroll="shade" aria-hidden="true" />

      <Container className={styles.top}>
        <div data-hero-hud="" className={cx('mono', styles.hudLeft)}>
          <span className={styles.liveDot} aria-hidden="true" />
          {t('home.eyebrow')}
        </div>
        <RoundClock running={!reducedMotion} className={cx('mono', styles.hudRight)} />
      </Container>

      <div className={styles.bottom}>
        <Container>
          <ul role="list" className={cx('mono', styles.roles)}>
            {(['boxer', 'gymOwner', 'commentator'] as const).map((role, i) => (
              <li key={role} className={styles.roleMask}>
                <span data-hero-role="" className={styles.role}>
                  {i > 0 && (
                    <span className={styles.roleSep} aria-hidden="true">
                      /
                    </span>
                  )}
                  {t(`roles.${role}`)}
                </span>
              </li>
            ))}
          </ul>
        </Container>

        <div data-hero-scroll="title">
          <Container data-depth="14" className={styles.titleDepth}>
            <h1 id="hero-title" className={cx('display', styles.title)}>
              <span className="sr-only">{t('hero.srTitle')}</span>
              <span className={styles.letters} aria-hidden="true">
                {LETTERS.map((l, i) => (
                  <span key={i} className={styles.charMask}>
                    <span data-hero-char="" className={styles.char}>
                      {l}
                    </span>
                  </span>
                ))}
              </span>
            </h1>
          </Container>
        </div>

        <Container className={styles.foot}>
          <p data-hero-fade="" className={styles.tagline}>
            {t('home.tagline')}
          </p>
          <div data-hero-fade="" className={styles.ctas}>
            <Button to={to('champion')} variant="primary" size="lg">
              {t('cta.discover')}
            </Button>
            <Button to={to('sponsors')} variant="ghost" size="lg">
              {t('cta.becomePartner')}
            </Button>
          </div>
          <button
            type="button"
            data-hero-fade=""
            className={cx('mono', styles.scrollCue)}
            onClick={() => scrollTo(`#${nextId}`)}
            aria-label={t('hero.scrollHint')}
          >
            <span className={styles.scrollLine} aria-hidden="true" />
            <span aria-hidden="true">{t('hero.scroll')}</span>
          </button>
        </Container>
      </div>
    </section>
  );
}
