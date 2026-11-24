import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/contexts/MotionContext';
import { IntroProvider, useIntro } from '@/contexts/IntroContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { PartnersSignature } from '@/components/sections/PartnersSignature/PartnersSignature';
import { useRevealLines } from '@/hooks/useRevealLines';
import { ROUTES, isLang, type RouteKey } from '@/routes/paths';
import { markPageReady } from '@/utils/assetGate';
import { getGsap } from '@/utils/gsap';
import { ErrorBoundary } from '@/components/system/ErrorBoundary/ErrorBoundary';
import { RouteFallback } from '@/components/system/RouteFallback/RouteFallback';
import { Seo } from '@/components/system/Seo/Seo';
import { CustomCursor } from '@/components/motion/CustomCursor/CustomCursor';
import { Grain } from '@/components/motion/Grain/Grain';
import { useMagnetic } from '@/components/motion/Magnetic/useMagnetic';
import { PageCurtain, type PageCurtainHandle } from '@/components/motion/PageCurtain/PageCurtain';
import { Preloader } from '@/components/motion/Preloader/Preloader';
import { ScrollProgress } from '@/components/motion/ScrollProgress/ScrollProgress';
import { GridLines } from '../GridLines/GridLines';
import { Header } from '../Header/Header';
import { LegalZone } from '../LegalZone/LegalZone';
import { SkipLink } from '../SkipLink/SkipLink';
import styles from './AppLayout.module.css';

/** Clé de vue indépendante de la langue : `/fr/gym` et `/en/gym` → `/gym` (pas de transition au changement de langue). */
function viewKeyOf(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isLang(parts[0])) parts.shift();
  return `/${parts.join('/')}`;
}

function routeKeyOf(viewKey: string): RouteKey | null {
  const segment = viewKey.split('/')[1] ?? '';
  const entry = (Object.entries(ROUTES) as Array<[RouteKey, string]>).find(([, value]) => value === segment);
  return entry ? entry[0] : null;
}

/** Signale le montage effectif de la page (après résolution du chunk lazy). */
function PageReady({ onReady }: { onReady: () => void }) {
  useLayoutEffect(() => {
    markPageReady();
    onReady();
  }, [onReady]);
  return null;
}

export function AppLayout() {
  const { reducedMotion } = useMotion();
  return (
    <IntroProvider disabled={reducedMotion}>
      <SiteSettingsProvider>
        <Shell />
      </SiteSettingsProvider>
    </IntroProvider>
  );
}

function Shell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const { reducedMotion, richMotion, isTouch, isMobile, scrollTo } = useMotion();
  const { introDone } = useIntro();

  const viewKey = viewKeyOf(pathname);
  const [view, setView] = useState<{ key: string; outlet: ReactNode }>({ key: viewKey, outlet });
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const latestOutlet = useRef(outlet);
  latestOutlet.current = outlet;
  const curtain = useRef<PageCurtainHandle>(null);
  const main = useRef<HTMLElement>(null);
  const readyWaiter = useRef<(() => void) | null>(null);
  const sequence = useRef(0);

  // Pendant le rideau, l'ancienne page reste affichée ; ensuite la nouvelle.
  const rendered = view.key === viewKey ? outlet : view.outlet;

  useEffect(() => {
    if (view.key === viewKey) return;
    const run = ++sequence.current;

    const swap = () => {
      setView({ key: viewKey, outlet: latestOutlet.current });
      scrollTo(0, { immediate: true });
      main.current?.focus({ preventScroll: true });
    };

    const handle = curtain.current;
    if (reducedMotion || !handle) {
      swap();
      return;
    }

    const routeKey = routeKeyOf(viewKey);
    const label = routeKey === 'home' ? 'PAUL' : routeKey ? t(`nav.${routeKey}`) : t('notFound.code');

    void (async () => {
      await handle.cover(label);
      if (run !== sequence.current) return;
      const ready = new Promise<void>((resolve) => {
        readyWaiter.current = resolve;
        window.setTimeout(resolve, 2500);
      });
      swap();
      await ready;
      await new Promise((r) => requestAnimationFrame(r));
      if (run !== sequence.current) return;
      getGsap()?.ScrollTrigger.refresh();
      await handle.reveal();
    })();
  }, [viewKey, view.key, reducedMotion, scrollTo, t]);

  const onPageReady = useRef(() => {
    setReadyKey(viewKeyOf(window.location.pathname));
    readyWaiter.current?.();
    readyWaiter.current = null;
  }).current;

  useRevealLines(main, { enabled: introDone && readyKey !== null, reduced: reducedMotion }, [readyKey]);
  useMagnetic(!isTouch && !reducedMotion);

  return (
    <div className={styles.app}>
      <Seo />
      <SkipLink />
      <ScrollProgress />
      <GridLines />
      <Header />
      <main id="main" ref={main} tabIndex={-1} className={styles.main}>
        <ErrorBoundary resetKey={view.key}>
          <Suspense fallback={<RouteFallback />}>
            {rendered}
            <PageReady key={view.key} onReady={onPageReady} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <PartnersSignature />
      <LegalZone />
      <PageCurtain ref={curtain} />
      <Preloader />
      {!isTouch && !reducedMotion && <CustomCursor />}
      {richMotion && !isMobile && <Grain />}
    </div>
  );
}
