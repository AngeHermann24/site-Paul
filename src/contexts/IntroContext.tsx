import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const SESSION_KEY = 'paul.intro-seen';

function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

interface IntroContextValue {
  /** Le préloader doit-il être affiché (1re visite de la session) ? */
  showPreloader: boolean;
  /** `true` dès que le rideau du préloader commence à s'ouvrir (ou immédiatement s'il n'y a pas de préloader). */
  introDone: boolean;
  completeIntro: () => void;
}

const IntroContext = createContext<IntroContextValue | null>(null);

export function IntroProvider({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  const [showPreloader] = useState(() => !disabled && !hasSeenIntro());
  const [introDone, setIntroDone] = useState(!showPreloader);

  const completeIntro = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignoré
    }
    setIntroDone(true);
  }, []);

  const value = useMemo(() => ({ showPreloader, introDone, completeIntro }), [showPreloader, introDone, completeIntro]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export function useIntro(): IntroContextValue {
  const ctx = useContext(IntroContext);
  if (!ctx) throw new Error('useIntro must be used inside <IntroProvider>');
  return ctx;
}
