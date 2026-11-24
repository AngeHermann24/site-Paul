import type { RouteKey } from '@/routes/paths';

export interface NavItem {
  key: Exclude<RouteKey, 'legal' | 'privacy' | 'cookies'>;
  index: string;
}

export const MAIN_NAV: readonly NavItem[] = [
  { key: 'champion', index: '01' },
  { key: 'fights', index: '02' },
  { key: 'performance', index: '03' },
  { key: 'gym', index: '04' },
  { key: 'commentator', index: '05' },
  { key: 'news', index: '06' },
  { key: 'media', index: '07' },
  { key: 'sponsors', index: '08' },
  { key: 'contact', index: '09' },
];

export const LEGAL_NAV: readonly RouteKey[] = ['legal', 'privacy', 'cookies'];
