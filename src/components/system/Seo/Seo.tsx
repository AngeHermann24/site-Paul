import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANG, LANGS, switchLangInPath } from '@/routes/paths';
import { useLang } from '@/hooks/useLang';
import { env } from '@/utils/env';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  /** Objet(s) JSON-LD (Person, SportsOrganization, Article…). */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
}

const OG_LOCALE = { fr: 'fr_FR', en: 'en_US' } as const;

/** Balises meta par page et par langue : title, description, canonical, hreflang, Open Graph, Twitter, JSON-LD. */
export function Seo({ title, description, image, type = 'website', jsonLd, noindex }: SeoProps) {
  const { t } = useTranslation();
  const lang = useLang();
  const { pathname } = useLocation();
  const origin = env.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const siteName = t('meta.siteName');
  const fullTitle = title ? `${title} — PAUL` : t('meta.defaultTitle');
  const desc = description ?? t('meta.defaultDescription');
  const canonical = `${origin}${pathname}`;
  const ogImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : undefined;

  return (
    <Helmet prioritizeSeoTags>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonical} />
      {LANGS.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={`${origin}${switchLangInPath(pathname, l)}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${origin}${switchLangInPath(pathname, DEFAULT_LANG)}`} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={OG_LOCALE[lang]} />
      {LANGS.filter((l) => l !== lang).map((l) => (
        <meta key={l} property="og:locale:alternate" content={OG_LOCALE[l]} />
      ))}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
