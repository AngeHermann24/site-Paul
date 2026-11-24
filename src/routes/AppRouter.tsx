import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { LangLayout } from './LangLayout';
import { RootRedirect } from './RootRedirect';
import { ROUTES } from './paths';

// Code splitting par route.
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const ChampionPage = lazy(() => import('@/pages/champion/ChampionPage'));
const FightsPage = lazy(() => import('@/pages/fights/FightsPage'));
const FightDetailPage = lazy(() => import('@/pages/fights/FightDetailPage'));
const PerformancePage = lazy(() => import('@/pages/performance/PerformancePage'));
const GymPage = lazy(() => import('@/pages/gym/GymPage'));
const CommentatorPage = lazy(() => import('@/pages/commentator/CommentatorPage'));
const NewsPage = lazy(() => import('@/pages/news/NewsPage'));
const NewsDetailPage = lazy(() => import('@/pages/news/NewsDetailPage'));
const MediaPage = lazy(() => import('@/pages/media/MediaPage'));
const SponsorsPage = lazy(() => import('@/pages/sponsors/SponsorsPage'));
const ContactPage = lazy(() => import('@/pages/contact/ContactPage'));
const LegalPage = lazy(() => import('@/pages/legal/LegalPage'));
const NotFoundPage = lazy(() => import('@/pages/notFound/NotFoundPage'));
// Back-office (hors préfixe de langue).
const AdminRoot = lazy(() => import('@/pages/admin/AdminRoot'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminRequestsPage = lazy(() => import('@/pages/admin/RequestsPage'));
const AdminResourceListPage = lazy(() => import('@/pages/admin/ResourceListPage'));
const AdminResourceEditPage = lazy(() => import('@/pages/admin/ResourceEditPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<RootRedirect />} />
        <Route path="admin" element={<AdminRoot />}>
          <Route path="login" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="demandes" element={<AdminRequestsPage />} />
            <Route path="contenus/:resource" element={<AdminResourceListPage />} />
            <Route path="contenus/:resource/nouveau" element={<AdminResourceEditPage />} />
            <Route path="contenus/:resource/:id" element={<AdminResourceEditPage />} />
            <Route path="reglages" element={<AdminSettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
        <Route path=":lang" element={<LangLayout />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path={ROUTES.champion} element={<ChampionPage />} />
            <Route path={ROUTES.fights} element={<FightsPage />} />
            <Route path={`${ROUTES.fights}/:slug`} element={<FightDetailPage />} />
            <Route path={ROUTES.performance} element={<PerformancePage />} />
            <Route path={ROUTES.gym} element={<GymPage />} />
            <Route path={ROUTES.commentator} element={<CommentatorPage />} />
            <Route path={ROUTES.news} element={<NewsPage />} />
            <Route path={`${ROUTES.news}/:slug`} element={<NewsDetailPage />} />
            <Route path={ROUTES.media} element={<MediaPage />} />
            <Route path={ROUTES.sponsors} element={<SponsorsPage />} />
            <Route path={ROUTES.contact} element={<ContactPage />} />
            <Route path={ROUTES.legal} element={<LegalPage page="legal" />} />
            <Route path={ROUTES.privacy} element={<LegalPage page="privacy" />} />
            <Route path={ROUTES.cookies} element={<LegalPage page="cookies" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
