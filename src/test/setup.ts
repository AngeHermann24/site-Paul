import '@/locales'; // instance i18n globale (init synchrone) pour useTranslation() sans provider

// jsdom ne fournit pas ces API — polyfills minimaux pour les composants UI.
if (!('IntersectionObserver' in globalThis)) {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = IO as unknown as typeof IntersectionObserver;
}
if (!('matchMedia' in globalThis)) {
  globalThis.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof matchMedia;
}
if (!('scrollTo' in globalThis)) {
  globalThis.scrollTo = (() => {}) as typeof scrollTo;
}
