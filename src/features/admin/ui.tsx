/**
 * Composants génériques du back-office — table de données, champs de formulaire
 * pilotés par `FieldDef`, badges de statut, onglets, panneau latéral, confirmations.
 * Styles : `admin.module.css`.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { adminList, type AdminRow } from '@/services/admin';
import type { FieldDef } from './resources';
import { cx } from '@/utils/cx';
import styles from './admin.module.css';

// ------------------------------------------------------------------ États
export function AdminLoading() {
  const { t } = useTranslation();
  return (
    <div className={styles.state} role="status">
      <span className={cx('mono', styles.stateLabel)}>{t('admin.loading')}</span>
    </div>
  );
}

export function AdminError({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div className={styles.state} role="alert">
      <span className={cx('mono', styles.stateLabel, styles.stateError)}>{t('admin.error')}</span>
      {message && <p className={styles.stateBody}>{message}</p>}
    </div>
  );
}

export function AdminEmpty({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className={styles.state}>
      <span className={cx('mono', styles.stateLabel)}>{children ?? t('admin.empty')}</span>
    </div>
  );
}

// ------------------------------------------------------------------ Badge statut
const STATUS_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'accent'> = {
  published: 'ok',
  draft: 'warn',
  archived: 'muted',
  new: 'accent',
  in_review: 'warn',
  contacted: 'warn',
  accepted: 'ok',
  rejected: 'muted',
};

const CONTENT_STATUS_KEYS = { draft: 'enums.status.draft', published: 'enums.status.published', archived: 'enums.status.archived' } as const;
const REQUEST_STATUS_KEYS = {
  new: 'enums.requestStatus.new',
  in_review: 'enums.requestStatus.in_review',
  contacted: 'enums.requestStatus.contacted',
  accepted: 'enums.requestStatus.accepted',
  rejected: 'enums.requestStatus.rejected',
  archived: 'enums.requestStatus.archived',
} as const;

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const { t } = useTranslation();
  if (!value) return null;
  const tone = STATUS_TONE[value] ?? 'muted';
  const key = (REQUEST_STATUS_KEYS as Record<string, string>)[value] ?? (CONTENT_STATUS_KEYS as Record<string, string>)[value];
  const badgeClass = { ok: styles.badgeOk, warn: styles.badgeWarn, muted: styles.badgeMuted, accent: styles.badgeAccent }[tone];
  return <span className={cx('mono', styles.badge, badgeClass)}>{key ? t(key as never) : value}</span>;
}

// ------------------------------------------------------------------ Table de données
export function AdminTable({
  columns,
  rows,
  title,
  onRowClick,
}: {
  columns: readonly string[];
  rows: readonly AdminRow[];
  title: (row: AdminRow, col: string) => ReactNode;
  onRowClick?: (row: AdminRow) => void;
}) {
  if (rows.length === 0) return <AdminEmpty />;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className="mono">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)} tabIndex={onRowClick ? 0 : undefined} onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}>
              {columns.map((c) => (
                <td key={c} className={c === 'status' || c === 'is_active' ? styles.cellStatus : undefined}>
                  {c === 'status' ? <StatusBadge value={row[c] as string} /> : c === 'is_active' ? <StatusBadge value={(row[c] as boolean) ? 'accepted' : 'rejected'} /> : title(row, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ Champs de formulaire
interface AdminInputProps {
  field: FieldDef;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

function useRefOptions(field: FieldDef) {
  const [options, setOptions] = useState<readonly { value: string; label: string }[]>([]);
  useEffect(() => {
    if (field.type !== 'ref' || !field.ref) return;
    let cancelled = false;
    const [col, dir] = (field.ref.order ?? 'created_at').split('.');
    void adminList(field.ref.table, { order: col, ascending: dir !== 'desc', limit: 500 }).then((res) => {
      if (cancelled || res.error) return;
      setOptions(
        res.data.rows.map((r) => ({
          value: r.id,
          label: field.ref!.labelCols.map((c) => r[c]).find((v) => v != null && v !== '') as string,
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [field]);
  return options;
}

function SingleField({ field, col, value, onChange }: AdminInputProps & { col: string }) {
  const { t } = useTranslation();
  const refOptions = useRefOptions(field);
  const str = value == null ? '' : String(value);

  switch (field.type) {
    case 'textarea':
    case 'richtext':
      return <textarea rows={field.type === 'richtext' ? 9 : 4} className={styles.input} value={str} onChange={(e) => onChange(col, e.target.value)} />;
    case 'select':
      return (
        <select className={styles.input} value={str} onChange={(e) => onChange(col, e.target.value || null)}>
          <option value="">{t('admin.selectPlaceholder')}</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'ref': {
      return (
        <select className={styles.input} value={str} onChange={(e) => onChange(col, e.target.value || null)}>
          <option value="">{t('admin.selectPlaceholder')}</option>
          {refOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    case 'checkbox':
      return (
        <label className={styles.check}>
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(col, e.target.checked)} />
          <span className="mono">{value ? 'oui' : 'non'}</span>
        </label>
      );
    case 'number':
      return <input type="number" step="any" className={styles.input} value={str} onChange={(e) => onChange(col, e.target.value === '' ? null : Number(e.target.value))} />;
    case 'date':
      return <input type="date" className={styles.input} value={str.slice(0, 10)} onChange={(e) => onChange(col, e.target.value || null)} />;
    case 'datetime':
      return <input type="datetime-local" className={styles.input} value={str.slice(0, 16)} onChange={(e) => onChange(col, e.target.value ? new Date(e.target.value).toISOString() : null)} />;
    case 'tags': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return <input type="text" className={styles.input} value={arr.join(', ')} onChange={(e) => onChange(col, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />;
    }
    case 'json': {
      const text = value == null ? '' : JSON.stringify(value, null, 2);
      return <textarea rows={6} className={cx(styles.input, 'mono')} value={text} onChange={(e) => {
        try {
          onChange(col, e.target.value === '' ? null : JSON.parse(e.target.value));
        } catch {
          onChange(col, e.target.value); // JSON invalide : conservé tel quel, la base rejettera
        }
      }} />;
    }
    default:
      return <input type="text" className={styles.input} value={str} onChange={(e) => onChange(col, e.target.value)} />;
  }
}

/** Rend un champ `FieldDef` — `localized` produit les colonnes `_fr`/`_en` côte à côte. */
export function AdminField({ field, values, onChange }: { field: FieldDef; values: Record<string, unknown>; onChange: (key: string, v: unknown) => void }) {
  const lang = useLang();
  const { t } = useTranslation();
  const cols = field.localized ? [`${field.key}_fr`, `${field.key}_en`] : [field.key];
  return (
    <div className={cx(styles.formField, field.half && styles.formFieldHalf, field.localized && !field.half && styles.formFieldWide)}>
      <span className={cx('mono', styles.formLabel)}>
        {field.label[lang]}
        {field.required && <i aria-hidden="true"> *</i>}
      </span>
      <div className={styles.formCols}>
        {cols.map((col, i) => (
          <div key={col} className={styles.formCol}>
            {cols.length > 1 && <span className={cx('mono', styles.formLang)}>{i === 0 ? 'FR' : 'EN'}</span>}
            <SingleField field={field} col={col} value={values[col]} onChange={onChange} />
          </div>
        ))}
      </div>
      {field.hint && <span className={cx('mono', styles.formHint)}>{field.hint[lang]}</span>}
      {field.type === 'richtext' && <span className={cx('mono', styles.formHint)}>{t('admin.richtextHint')}</span>}
    </div>
  );
}

// ------------------------------------------------------------------ Onglets
export function AdminTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" role="tab" aria-selected={tab.value === value} className={cx(styles.tab, tab.value === value && styles.tabActive)} onClick={() => onChange(tab.value)}>
          <span className="mono">{tab.label}</span>
          {tab.count !== undefined && <span className={cx('mono', styles.tabCount)}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Panneau latéral (détail)
export function AdminDrawer({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={styles.drawerOverlay} onClick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <aside className={cx(styles.drawer, wide && styles.drawerWide)} role="dialog" aria-modal="true" ref={ref}>
        <header className={styles.drawerHead}>
          <h2 className={styles.drawerTitle}>{title}</h2>
          <button type="button" className={cx('mono', styles.drawerClose)} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        <div className={styles.drawerBody}>{children}</div>
      </aside>
    </div>
  );
}

// ------------------------------------------------------------------ Bouton dangereux avec confirmation
export function ConfirmButton({ label, confirmLabel, onConfirm, danger = true }: { label: string; confirmLabel: string; onConfirm: () => void; danger?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button type="button" className={cx('mono', styles.btn, danger ? styles.btnDanger : styles.btnGhost, armed && styles.btnArmed)} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirmLabel : label}
    </button>
  );
}

// ------------------------------------------------------------------ Boutons admin
export function AdminButton({ variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const btnClass = { primary: styles.btnPrimary, ghost: styles.btnGhost, danger: styles.btnDanger }[variant];
  return <button type="button" className={cx('mono', styles.btn, btnClass, className)} {...props} />;
}

// ------------------------------------------------------------------ Carte KPI
export function KpiCard({ label, value, hint, to }: { label: string; value: ReactNode; hint?: string; to?: string }) {
  const inner = (
    <>
      <span className={cx('mono', styles.kpiLabel)}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
      {hint && <span className={cx('mono', styles.kpiHint)}>{hint}</span>}
    </>
  );
  return to ? (
    <a href={to} className={styles.kpi}>
      {inner}
    </a>
  ) : (
    <div className={styles.kpi}>{inner}</div>
  );
}
