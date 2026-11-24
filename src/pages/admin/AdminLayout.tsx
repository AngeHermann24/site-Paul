import { NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/features/admin/AdminAuth';
import { RESOURCES, resourceLabel, type ResourceGroup } from '@/features/admin/resources';
import { Seo } from '@/components/system/Seo/Seo';
import { cx } from '@/utils/cx';
import styles from '@/features/admin/admin.module.css';

const GROUP_ORDER: ResourceGroup[] = ['fights', 'news', 'performance', 'gym', 'commentary', 'media', 'sponsors', 'site'];

/** Squelette `/admin` protégé : session admin requise, sinon `/admin/login`. */
export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { status, user, role, signOut } = useAdminAuth();

  if (status === 'loading') {
    return (
      <div className={styles.login}>
        <p className={cx('mono', styles.stateLabel)}>{t('admin.loading')}</p>
      </div>
    );
  }
  if (status === 'anonymous') return <Navigate to="/admin/login" state={{ from: location.pathname + location.search }} replace />;
  if (status === 'denied') {
    return (
      <div className={styles.login}>
        <div className={styles.loginCard}>
          <p className={styles.loginError} role="alert">
            {t('admin.login.denied')}
          </p>
          <p className={styles.loginSub}>
            {t('admin.login.deniedBody')}
            {user?.email ? ` (${user.email})` : ''}
          </p>
          <button type="button" className={cx('mono', styles.btn, styles.btnGhost)} onClick={() => void signOut()}>
            {t('admin.nav.logout')}
          </button>
        </div>
      </div>
    );
  }

  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const groups = GROUP_ORDER.map((g) => ({ group: g, items: RESOURCES.filter((r) => r.group === g && (!r.ownerOnly || role === 'owner')) })).filter((s) => s.items.length > 0);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <NavLink to="/admin" end className={styles.brand}>
          PAUL<span>.</span>
        </NavLink>
        <nav className={styles.navGroup} aria-label="Admin">
          <NavLink to="/admin" end className={({ isActive }) => cx(styles.navLink, isActive && styles.navLinkActive)}>
            {t('admin.nav.dashboard')}
          </NavLink>
          <NavLink to="/admin/demandes" className={({ isActive }) => cx(styles.navLink, isActive && styles.navLinkActive)}>
            {t('admin.nav.requests')}
          </NavLink>
        </nav>
        {groups.map(({ group, items }) => (
          <nav key={group} className={styles.navGroup} aria-label={t(`admin.nav.groups.${group}` as never)}>
            <p className={cx('mono', styles.navGroupLabel)}>{t(`admin.nav.groups.${group}` as never)}</p>
            {items.map((r) => (
              <NavLink key={r.key} to={`/admin/contenus/${r.key}`} className={({ isActive }) => cx(styles.navLink, isActive && styles.navLinkActive)}>
                {resourceLabel(r, lang)}
              </NavLink>
            ))}
          </nav>
        ))}
        <div className={styles.sidebarFoot}>
          <div className={styles.userCard}>
            <span className={styles.userEmail}>{user?.email}</span>
            <span className={cx('mono', styles.userRole)}>{role}</span>
          </div>
          <NavLink to="/admin/reglages" className={({ isActive }) => cx('mono', styles.navLink, isActive && styles.navLinkActive)}>
            {t('admin.nav.settings')}
          </NavLink>
          <a href={`/${lang}`} className={cx('mono', styles.navLink)}>
            {t('admin.nav.backToSite')}
          </a>
          <button type="button" className={cx('mono', styles.btn, styles.btnGhost)} onClick={() => void signOut()}>
            {t('admin.nav.logout')}
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Seo noindex />
        <Outlet />
      </main>
    </div>
  );
}
