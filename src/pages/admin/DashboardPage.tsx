import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { fetchDashboardCounts, type DashboardCounts, type RequestTable } from '@/services/admin';
import { AdminError, AdminLoading, KpiCard } from '@/features/admin/ui';
import { cx } from '@/utils/cx';
import styles from '@/features/admin/admin.module.css';

const TAB_LABEL: Record<RequestTable, 'contact' | 'gym' | 'booking' | 'sponsorship'> = {
  contact_messages: 'contact',
  gym_registration_requests: 'gym',
  booking_requests: 'booking',
  sponsorship_requests: 'sponsorship',
};

/** `/admin` — compteurs demandes + contenus, raccourcis vers l'inbox. */
export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchDashboardCounts().then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error.message);
      else setData(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <AdminError message={error} />;
  if (!data) return <AdminLoading />;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.dash.title')}</h1>
          <p className={styles.pageSub}>{t('admin.dash.sub')}</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard label={t('admin.dash.newRequests')} value={data.newRequests} to="/admin/demandes" />
        {(Object.entries(data.requests) as [RequestTable, number][]).map(([table, n]) => (
          <KpiCard key={table} label={t(`admin.req.tabs.${TAB_LABEL[table]}`)} value={n} to={`/admin/demandes?table=${table}`} />
        ))}
      </div>

      <h2 className={styles.sectionTitle}>{t('admin.dash.contentsTitle')}</h2>
      <div className={styles.kpiGrid}>
        <KpiCard label={t('admin.nav.groups.fights')} value={data.contents.fights} to="/admin/contenus/combats" />
        <KpiCard label={t('admin.nav.groups.news')} value={data.contents.articles} to="/admin/contenus/actualites" />
        <KpiCard label={t('admin.nav.groups.media')} value={data.contents.media} to="/admin/contenus/medias" />
        <KpiCard label={t('admin.nav.groups.sponsors')} value={data.contents.sponsors} to="/admin/contenus/partenaires" />
        <KpiCard label={t('admin.dash.drafts')} value={data.drafts} to="/admin/contenus/combats" />
      </div>

      {data.newRequests > 0 && (
        <p className={styles.pageSub}>
          <Link to="/admin/demandes" className={cx('mono', styles.attachLink)}>
            {t('admin.dash.newRequests')} →
          </Link>
        </p>
      )}
    </>
  );
}
