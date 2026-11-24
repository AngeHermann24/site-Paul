import { useEffect, useRef, useState } from 'react';
import { env } from '@/utils/env';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; theme?: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => string;
      reset: (id?: string) => void;
    };
  }
}

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile load failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Widget Cloudflare Turnstile, chargé uniquement si `VITE_TURNSTILE_SITE_KEY` est renseigné.
 * Sans clé : aucun widget, `token` reste `null` (la function saute la vérification si le
 * secret n'est pas configuré côté serveur non plus).
 */
export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const enabled = Boolean(env.turnstileSiteKey);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: env.turnstileSiteKey,
          theme: 'dark',
          callback: setToken,
          'expired-callback': () => setToken(null),
        });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    };
  }, [enabled]);

  const reset = () => {
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    setToken(null);
  };

  return { enabled, containerRef, token, reset };
}
