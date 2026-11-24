import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { adminDelete, adminGet, adminInsert, adminUpdate, type AdminRow } from '@/services/admin';
import { resourceByKey, resourceLabel } from '@/features/admin/resources';
import { ResourceForm, initialValues } from '@/features/admin/ResourceForm';
import { AdminError, AdminLoading, ConfirmButton } from '@/features/admin/ui';
import { useAdminAuth } from '@/features/admin/AdminAuth';
import { cx } from '@/utils/cx';
import styles from '@/features/admin/admin.module.css';

/** `/admin/contenus/:resource/(nouveau|:id)` — création et édition pilotées par la config. */
export default function ResourceEditPage() {
  const { resource: key = '', id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { role } = useAdminAuth();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const res = resourceByKey(key);
  const isNew = !id;

  const [row, setRow] = useState<AdminRow | null | 'loading'>(isNew ? null : 'loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!res || isNew) return;
    let cancelled = false;
    void adminGet(res.table, id).then((r) => {
      if (cancelled) return;
      if (r.error) setError(r.error.message);
      else setRow(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [res, id, isNew]);

  if (!res) return <AdminError message={'resource: ' + key} />;
  if (res.ownerOnly && role !== 'owner') return <AdminError message={t('admin.login.deniedBody')} />;
  if (error) return <AdminError message={error} />;
  if (row === 'loading') return <AdminLoading />;

  const back = `/admin/contenus/${res.key}`;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <Link to={back} className={cx('mono', styles.attachLink)}>
            {t('admin.edit.back')}
          </Link>
          <h1 className={styles.pageTitle}>
            {resourceLabel(res, lang)} — {isNew ? t('admin.edit.new') : String(row?.[res.titleCol] ?? '')}
          </h1>
        </div>
        {!isNew && <ConfirmButton label={t('admin.edit.delete')} confirmLabel={t('admin.edit.confirmDelete')} onConfirm={() => void adminDelete(res.table, id).then(() => navigate(back))} />}
      </div>
      <ResourceForm
        fields={res.fields}
        initial={initialValues(res.fields, row)}
        onSubmit={async (payload) => {
          const r = isNew ? await adminInsert(res.table, payload) : await adminUpdate(res.table, id, payload);
          if (r.error) return { ok: false, error: r.error.message };
          if (isNew) navigate(`${back}/${r.data.id}`);
          return { ok: true };
        }}
      />
    </>
  );
}
