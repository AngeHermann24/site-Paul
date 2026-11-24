/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_HERO_VIDEO_MP4?: string;
  readonly VITE_HERO_VIDEO_WEBM?: string;
  readonly VITE_HERO_VIDEO_MOBILE_MP4?: string;
  readonly VITE_HERO_POSTER?: string;
  readonly VITE_ALLOW_DEMO_CONTENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
