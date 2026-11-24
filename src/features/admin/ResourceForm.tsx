import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminField } from './ui';
import { fieldColumns, type FieldDef } from './resources';
import { cx } from '@/utils/cx';
import styles from './admin.module.css';

/** Construit le payload SQL : seules les colonnes du formulaire, `''` → null (sauf champs requis). */
export function buildPayload(fields: readonly FieldDef[], values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    for (const col of fieldColumns(f)) {
      const v = values[col];
      payload[col] = v === '' && !f.required ? null : v === undefined ? null : v;
    }
  }
  return payload;
}

/** Colonnes requises vides — bloque l'envoi avant même un aller-retour base. */
export function missingRequired(fields: readonly FieldDef[], values: Record<string, unknown>, lang: 'fr' | 'en'): string[] {
  const missing: string[] = [];
  for (const f of fields) {
    if (!f.required) continue;
    const cols = fieldColumns(f);
    if (cols.some((c) => values[c] == null || values[c] === '')) missing.push(f.label[lang]);
  }
  return missing;
}

/** Valeurs initiales d'un formulaire : ligne existante ou défauts de création. */
export function initialValues(fields: readonly FieldDef[], row: Record<string, unknown> | null): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const f of fields) {
    for (const col of fieldColumns(f)) {
      const v = row?.[col];
      values[col] =
        v === undefined
          ? f.type === 'checkbox'
            ? false
            : f.type === 'select' && f.key === 'status'
              ? 'draft'
              : null
          : v;
    }
  }
  return values;
}

/**
 * Formulaire générique piloté par `FieldDef[]` — utilisé par l'édition d'une
 * ressource, les singletons (`profiles`) et les réglages (`site_settings`).
 */
export function ResourceForm({
  fields,
  initial,
  onSubmit,
  footer,
}: {
  fields: readonly FieldDef[];
  initial: Record<string, unknown>;
  onSubmit: (payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  footer?: React.ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fieldList = useMemo(() => fields, [fields]);

  const onChange = (col: string, v: unknown) => {
    setValues((s) => ({ ...s, [col]: v }));
    setFeedback(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = missingRequired(fieldList, values, lang);
    if (missing.length) {
      setFeedback({ kind: 'err', text: t('admin.edit.required', { fields: missing.join(', ') }) });
      return;
    }
    setSaving(true);
    const res = await onSubmit(buildPayload(fieldList, values));
    setSaving(false);
    setFeedback(res.ok ? { kind: 'ok', text: t('admin.edit.saved') } : { kind: 'err', text: t('admin.edit.error', { message: res.error }) });
  };

  return (
    <form onSubmit={(e) => void submit(e)}>
      <div className={styles.formGrid}>
        {fieldList.map((f) => (
          <AdminField key={f.key} field={f} values={values} onChange={onChange} />
        ))}
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={cx('mono', styles.btn, styles.btnPrimary)} disabled={saving}>
          {saving ? t('admin.edit.saving') : t('admin.edit.save')}
        </button>
        {footer}
        {feedback && (
          <span className={cx('mono', feedback.kind === 'ok' ? styles.saved : styles.stateError)} role={feedback.kind === 'err' ? 'alert' : 'status'}>
            {feedback.text}
          </span>
        )}
      </div>
    </form>
  );
}
