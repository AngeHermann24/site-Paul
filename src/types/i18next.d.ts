import 'i18next';
import type { CommonTranslation } from '@/locales/fr/common';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: CommonTranslation;
    };
  }
}
