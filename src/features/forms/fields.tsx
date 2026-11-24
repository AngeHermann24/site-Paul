/**
 * Primitives partagées des formulaires publics (contact, booking, gym, sponsoring).
 * Styles unifiés : `fields.module.css`. Chaque formulaire garde son propre module pour la mise en page.
 */
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/Button/Button';
import styles from './fields.module.css';

// ------------------------------------------------------------------ Champ générique
interface FieldProps {
  label: string;
  error?: string;
  optional?: boolean;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, error, optional, required, children }: FieldProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        <span className={cx('mono', styles.label)}>
          {label}
          {optional && <span className={styles.optional}> — {t('form.optional')}</span>}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </span>
        {children}
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Chips (radio ou checkbox)
interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipsProps<T extends string> {
  options: readonly ChipOption<T>[];
  /** Sélection courante (radio) ou tableau des valeurs cochées (checkbox). */
  value: T | readonly T[];
  onChange: (value: T | readonly T[]) => void;
  multiple?: boolean;
  name: string;
}

export function Chips<T extends string>({ options, value, onChange, multiple, name }: ChipsProps<T>) {
  const isActive = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  const toggle = (v: T) => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };
  return (
    <div className={styles.chips} role={multiple ? 'group' : 'radiogroup'}>
      {options.map((o) => (
        <label key={o.value} className={styles.chipLabel}>
          <input
            type={multiple ? 'checkbox' : 'radio'}
            name={name}
            value={o.value}
            className="sr-only"
            checked={isActive(o.value)}
            onChange={() => toggle(o.value)}
          />
          <span className={cx(styles.chip, isActive(o.value) && styles.chipActive)}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Select natif stylé
export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <select className={cx(styles.input, styles.select)} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ------------------------------------------------------------------ Consentement
export function ConsentField({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <label className={styles.consent}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
        />
        <span className={styles.consentText}>{t('form.consent')}</span>
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Honeypot (invisible humains)
export function Honeypot(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={styles.honeypot} aria-hidden="true">
      <label>
        Website
        <input type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  );
}

// ------------------------------------------------------------------ Champ fichier
interface FileFieldProps {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  error?: string;
  optional?: boolean;
  disabled?: boolean;
  onSelect: (file: File | null) => void;
}

export function FileField({ label, hint, accept, file, error, optional, disabled, onSelect }: FileFieldProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.field}>
      <span className={cx('mono', styles.label)}>
        {label}
        {optional && <span className={styles.optional}> — {t('form.optional')}</span>}
      </span>
      <div className={styles.fileInput}>
        <label className={styles.fileButton}>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
          />
          <span className={file ? styles.fileName : undefined}>{file ? file.name : t('form.chooseFile')}</span>
          <span className="mono">{t('form.browse')}</span>
        </label>
        <span className={cx('mono', styles.fileHint)}>{hint}</span>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ États du formulaire
export type FormStatus = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

export function FormError({ status }: { status: FormStatus }) {
  const { t } = useTranslation();
  if (status !== 'error' && status !== 'rate_limited') return null;
  return (
    <div className={styles.formError} role="alert">
      <p className={cx('mono', styles.formErrorTitle)}>{status === 'rate_limited' ? t('form.rateLimited') : t('form.errorTitle')}</p>
      {status === 'error' && <p className={styles.formErrorBody}>{t('form.errorBody')}</p>}
    </div>
  );
}

export function FormSuccess({
  title,
  body,
  warning,
  againLabel,
  onAgain,
}: {
  title: string;
  body: string;
  warning?: string;
  againLabel: string;
  onAgain: () => void;
}) {
  return (
    <div className={styles.confirmation} role="status">
      <p className={cx('display', styles.confirmTitle)}>{title}</p>
      <p className={styles.confirmBody}>{body}</p>
      {warning && <p className={cx('mono', styles.confirmWarning)}>{warning}</p>}
      <Button variant="ghost" onClick={onAgain}>
        {againLabel}
      </Button>
    </div>
  );
}
