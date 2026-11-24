import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { LazyMotion, MotionConfig } from 'framer-motion';
import i18n from '@/locales';
import { MotionProvider } from '@/contexts/MotionContext';
import { ErrorBoundary } from '@/components/system/ErrorBoundary/ErrorBoundary';
import { AppRouter } from '@/routes/AppRouter';

export function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          {/* domAnimation chargé en async : framer-motion sort du bundle initial */}
          <LazyMotion features={() => import('framer-motion').then((res) => res.domAnimation)} strict>
            <MotionConfig reducedMotion="user">
              <MotionProvider>
                <AppRouter />
              </MotionProvider>
            </MotionConfig>
          </LazyMotion>
        </I18nextProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
