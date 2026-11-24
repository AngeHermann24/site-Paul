import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { adminList, adminUpdate, type AdminRow } from '@/services/admin';
import { resourceByKey, resourceLabel } from '@/features/admin/resources';
import { ResourceForm, initialValues } from '@/features/admin/ResourceForm';
import { AdminEmpty, AdminError, AdminLoading, AdminTable, AdminButton } from '@/features/admin/ui';
import { useAdminAuth } from '@/features/admin/AdminAuth';
import { cx } from '@/utils/cx';
import styles from '@/features/admin/admin.module.css';

const PAGE = 25;

/** `/admin/contenus/:resource` — liste générique, ou formulaire direct si `singleton`. */
export default function ResourceListPage() {
  const { resource: key = '' } = useParams();
  const { t, i18n } = useTranslation();
  const { role } = useAdminAuth();
  const navigate = useNavigate();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const res = resourceByKey(key);

  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!res || res.singleton) return;
    setError(null);
    const r = await adminList(res.table, {
      search,
      searchCols: res.searchCols,
      order: res.defaultOrder,
      ascending: res.ascending,
      offset,
      limit: PAGE,
    });
    if (r.error) {
      setError(r.error.message);
      setRows([]);
      return;
    }
    setRows(r.data.rows);
    setTotal(r.data.total);
  }, [res, search, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!res) return <AdminError message={'resource: ' + key} />;
  if (res.ownerOnly && role !== 'owner') {
    return <AdminError message={t('admin.login.deniedBody')} />;
  }
  if (res.singleton) return <SingletonForm table={res.table} fields={res.fields} />;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>{resourceLabel(res, lang)}</h1>
          <p className={styles.pageSub}>{t('admin.list.results', { count: total })}</p>
        </div>
        <Link to={`/admin/contenus/${res.key}/nouveau`} className={cx('mono', styles.btn, styles.btnPrimary)}>
          + {t('admin.list.new')}
        </Link>
      </div>
      {res.searchCols && (
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <input type="search" className={styles.input} placeholder={t('admin.list.search')} value={search} onChange={(e) => (setSearch(e.target.value), setOffset(0))} aria-label={t('admin.list.search')} />
          </div>
        </div>
      )}
      {error ? (
        <AdminError message={error} />
      ) : rows === null ? (
        <AdminLoading />
      ) : rows.length === 0 ? (
        <AdminEmpty>{t('admin.list.empty')}</AdminEmpty>
      ) : (
        <>
          <AdminTable columns={res.listCols} rows={rows} onRowClick={(r) => navigate(`/admin/contenus/${res.key}/${r.id}`)} title={(row, col) => <ListCell v={row[col]} />} />
          {total > PAGE && (
            <div className={styles.pager}>
              <AdminButton variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                {t('admin.list.prev')}
              </AdminButton>
              <span className="mono">{t('admin.list.page', { page: Math.floor(offset / PAGE) + 1 })}</span>
              <AdminButton variant="ghost" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
                {t('admin.list.next')}
              </AdminButton>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ListCell({ v }: { v: unknown }) {
  if (v == null || v === '') return <>—</>;
  if (typeof v === 'boolean') return <>{v ? '✓' : '—'}</>;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return <>{new Date(s).toLocaleDateString()}</>;
  return <>{s}</>;
}

/** Singleton (`profiles`) : chargement de la ligne unique puis formulaire d'édition. */
export function SingletonForm({ table, fields }: { table: string; fields: Parameters<typeof ResourceForm>[0]['fields'] }) {
  const { t } = useTranslation();
  const [row, setRow] = useState<AdminRow | null | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void adminList(table, { limit: 1 }).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error.message);
      else setRow(res.data.rows[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [table]);

  if (error) return <AdminError message={error} />;
  if (row === 'loading') return <AdminLoading />;
  if (row === null) return <AdminEmpty>{t('admin.list.empty')}</AdminEmpty>;

  return (
    <ResourceForm
      fields={fields}
      initial={initialValues(fields, row)}
      onSubmit={async (payload) => {
        const res = await adminUpdate(table, row.id, payload);
        return res.error ? { ok: false, error: res.error.message } : { ok: true };
      }}
    />
  );
}
