import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  adminDelete,
  listRequestRows,
  signedReadUrl,
  updateRequestRow,
  REQUEST_STATUSES,
  type AdminRow,
  type RequestStatus,
  type RequestTable,
} from '@/services/admin';
import { AdminDrawer, AdminEmpty, AdminError, AdminLoading, AdminTable, AdminTabs, ConfirmButton, AdminButton, StatusBadge } from '@/features/admin/ui';
import { cx } from '@/utils/cx';
import styles from '@/features/admin/admin.module.css';

type ReqTab = 'contact' | 'gym' | 'booking' | 'sponsorship';
const TABLES: readonly { value: RequestTable; tab: ReqTab; cols: readonly string[] }[] = [
  { value: 'contact_messages', tab: 'contact', cols: ['full_name', 'email', 'type', 'created_at', 'status'] },
  { value: 'gym_registration_requests', tab: 'gym', cols: ['full_name', 'email', 'experience_level', 'created_at', 'status'] },
  { value: 'booking_requests', tab: 'booking', cols: ['organizer_name', 'event_name', 'event_date', 'created_at', 'status'] },
  { value: 'sponsorship_requests', tab: 'sponsorship', cols: ['company_name', 'contact_name', 'package_tier', 'created_at', 'status'] },
];

const PAGE = 25;
/** Colonnes internes affichées dans des sections dédiées du drawer (jamais dans la grille générique). */
const INTERNAL = new Set(['id', 'status', 'internal_notes', 'handled_by', 'handled_at', 'assigned_to', 'email_notified_at', 'email_notification_error', 'created_at', 'updated_at']);
const ATTACHMENT_COLS = new Set(['logo_path', 'attachment_path']);

const fmtValue = (v: unknown): string => {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  return String(v);
};

function Cell({ v }: { v: unknown }) {
  if (v == null || v === '') return <>—</>;
  if (typeof v === 'boolean') return <>{v ? 'oui' : 'non'}</>;
  const s = String(v);
  return <>{s.length > 10 && /^\d{4}-\d{2}-\d{2}T/.test(s) ? new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : s}</>;
}

/** `/admin/demandes` — boîte de réception des 4 formulaires publics. */
export default function RequestsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const table = (TABLES.find((x) => x.value === params.get('table')) ?? TABLES[0]!).value;
  const status = (params.get('status') ?? '') as RequestStatus | '';
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<AdminRow | null>(null);

  const def = TABLES.find((x) => x.value === table)!;

  const load = useCallback(async () => {
    setError(null);
    const res = await listRequestRows(table, { status, offset, limit: PAGE });
    if (res.error) {
      setError(res.error.message);
      setRows([]);
      return;
    }
    setRows(res.data.rows);
    setTotal(res.data.total);
  }, [table, status, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setOffset(0);
    setParams(next, { replace: true });
  };

  const onSaved = (row: AdminRow) => {
    setOpen(row);
    setRows((rs) => rs?.map((r) => (r.id === row.id ? row : r)) ?? rs);
  };

  const onDeleted = () => {
    setOpen(null);
    void load();
  };

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.req.title')}</h1>
          <p className={styles.pageSub}>
            {total} · {t(`admin.req.tabs.${def.tab}`)}
          </p>
        </div>
        <select className={cx(styles.input, 'mono')} style={{ width: 'auto' }} value={status} onChange={(e) => setParam('status', e.target.value)} aria-label={t('admin.req.status')}>
          <option value="">{t('admin.req.all')}</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`enums.requestStatus.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <AdminTabs
        tabs={TABLES.map((x) => ({ value: x.value, label: t(`admin.req.tabs.${x.tab}`) }))}
        value={table}
        onChange={(v) => setParam('table', v)}
      />

      {error ? (
        <AdminError message={error} />
      ) : rows === null ? (
        <AdminLoading />
      ) : rows.length === 0 ? (
        <AdminEmpty>{t('admin.req.empty')}</AdminEmpty>
      ) : (
        <>
          <AdminTable columns={def.cols} rows={rows} onRowClick={setOpen} title={(row, col) => <Cell v={row[col]} />} />
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

      <RequestDrawer table={table} row={open} onClose={() => setOpen(null)} onSaved={onSaved} onDeleted={onDeleted} />
    </>
  );
}

// ---------------------------------------------------------------------- Drawer détail
function RequestDrawer({
  table,
  row,
  onClose,
  onSaved,
  onDeleted,
}: {
  table: RequestTable;
  row: AdminRow | null;
  onClose: () => void;
  onSaved: (row: AdminRow) => void;
  onDeleted: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [draftStatus, setDraftStatus] = useState<RequestStatus>('new');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});

  const rowId = row?.id;
  useEffect(() => {
    if (!rowId) return;
    setDraftStatus((row?.status as RequestStatus) ?? 'new');
    setNotes((row?.internal_notes as string) ?? '');
    setFeedback(null);
    setLinks({});
    // URLs signées des pièces jointes (bucket privé `attachments`).
    for (const col of ATTACHMENT_COLS) {
      const path = row?.[col];
      if (typeof path === 'string' && path) {
        void signedReadUrl(path).then((res) => {
          if (res.data) setLinks((l) => ({ ...l, [col]: res.data }));
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset uniquement à l'ouverture d'une autre demande
  }, [rowId]);

  const details = useMemo(() => {
    if (!row) return [];
    return Object.entries(row).filter(([k, v]) => !INTERNAL.has(k) && v != null && v !== '');
  }, [row]);

  const save = async () => {
    if (!row) return;
    setSaving(true);
    setFeedback(null);
    const res = await updateRequestRow(table, row.id, { status: draftStatus, internal_notes: notes || null });
    setSaving(false);
    if (res.error) setFeedback({ kind: 'err', text: res.error.message });
    else {
      setFeedback({ kind: 'ok', text: t('admin.req.saved') });
      onSaved(res.data);
    }
  };

  const remove = async () => {
    if (!row) return;
    const res = await adminDelete(table, row.id);
    if (res.error) setFeedback({ kind: 'err', text: res.error.message });
    else onDeleted();
  };

  const title = (row && (fmtValue(row.full_name) !== '—' ? row.full_name : row.company_name ?? row.organizer_name)) as string;

  return (
    <AdminDrawer open={!!row} onClose={onClose} title={title ?? t('admin.req.detail')} wide>
      {row && (
        <>
          <div className={styles.chipRow}>
            <StatusBadge value={row.status as string} />
            <span className={styles.chip}>
              {t('admin.req.receivedAt')} {new Date(row.created_at as string).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            {typeof row.locale === 'string' && <span className={styles.chip}>{row.locale.toUpperCase()}</span>}
          </div>

          <div className={styles.detailGrid}>
            {details.map(([k, v]) =>
              k === 'logo_path' || k === 'attachment_path' ? (
                <div key={k} className={styles.detailRow}>
                  <span className={cx('mono', styles.detailLabel)}>{k === 'logo_path' ? t('admin.req.logo') : t('admin.req.file')}</span>
                  {links[k] ? (
                    <a href={links[k]} target="_blank" rel="noreferrer" className={styles.attachLink}>
                      {t('admin.req.viewFile')} ↗
                    </a>
                  ) : (
                    <span className={styles.detailValue}>…</span>
                  )}
                </div>
              ) : Array.isArray(v) ? (
                <div key={k} className={styles.detailRow}>
                  <span className={cx('mono', styles.detailLabel)}>{k}</span>
                  <div className={styles.chipRow}>
                    {(v as unknown[]).map((x) => (
                      <span key={String(x)} className={styles.chip}>
                        {String(x)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={k} className={styles.detailRow}>
                  <span className={cx('mono', styles.detailLabel)}>{k}</span>
                  <span className={styles.detailValue}>
                    {typeof v === 'string' && /^https?:\/\//.test(v) ? (
                      <a href={v} target="_blank" rel="noreferrer" className={styles.attachLink}>
                        {v}
                      </a>
                    ) : (
                      fmtValue(v)
                    )}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className={styles.detailSection}>
            <label className={styles.formField}>
              <span className={cx('mono', styles.formLabel)}>{t('admin.req.status')}</span>
              <select className={styles.input} value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as RequestStatus)}>
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`enums.requestStatus.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.formField} style={{ marginTop: '0.75rem' }}>
              <span className={cx('mono', styles.formLabel)}>{t('admin.req.notes')}</span>
              <textarea rows={4} className={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <div className={styles.formActions}>
              <AdminButton onClick={() => void save()} disabled={saving}>
                {saving ? t('admin.edit.saving') : t('admin.req.save')}
              </AdminButton>
              <ConfirmButton label={t('admin.req.delete')} confirmLabel={t('admin.req.confirmDelete')} onConfirm={() => void remove()} />
              {feedback && <span className={cx('mono', feedback.kind === 'ok' ? styles.saved : styles.stateError)}>{feedback.text}</span>}
            </div>
          </div>

          <div className={styles.detailSection}>
            {row.email_notification_error ? (
              <p className={cx(styles.notice, styles.noticeWarn)}>{t('admin.req.notifyError', { error: String(row.email_notification_error) })}</p>
            ) : row.email_notified_at ? (
              <p className={styles.notice}>
                {t('admin.req.notifiedAt')} {new Date(row.email_notified_at as string).toLocaleString(i18n.language)}
              </p>
            ) : (
              <p className={styles.notice}>{t('admin.req.notNotified')}</p>
            )}
          </div>
        </>
      )}
    </AdminDrawer>
  );
}
