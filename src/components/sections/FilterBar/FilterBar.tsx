import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { cx } from '@/utils/cx';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  /** Champ de recherche contrôlé ; omis → pas de champ de recherche. */
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  /** Nombre de résultats affiché à droite ; `null` masque le compteur. */
  count?: number | null;
  /** Groupes de chips (résultat, catégorie…). */
  children?: ReactNode;
  onReset?: () => void;
  /** `true` quand au moins un filtre est actif. */
  hasActiveFilters?: boolean;
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T | null) => void;
  /** Libellé du chip « tout » (par défaut `filters.all`). */
  allLabel?: string;
}

/** Groupe de chips exclusives (un seul choix actif, ou aucun = tout). */
export function ChipGroup<T extends string>({ label, options, value, onChange, allLabel }: ChipGroupProps<T>) {
  const { t } = useTranslation();
  return (
    <fieldset className={styles.group}>
      <legend className="sr-only">{label}</legend>
      <span className={cx('mono', styles.groupLabel)} aria-hidden="true">
        {label}
      </span>
      <ul role="list" className={styles.chips}>
        <li>
          <button type="button" className={cx(styles.chip, value === null && styles.active)} onClick={() => onChange(null)} aria-pressed={value === null}>
            {allLabel ?? t('filters.all')}
          </button>
        </li>
        {options.map((opt) => (
          <li key={opt.value}>
            <button
              type="button"
              className={cx(styles.chip, value === opt.value && styles.active)}
              onClick={() => onChange(value === opt.value ? null : opt.value)}
              aria-pressed={value === opt.value}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/** Barre de filtres des pages liste : recherche + chips + compteur + réinitialisation. */
export function FilterBar({ search, onSearch, searchPlaceholder, count, children, onReset, hasActiveFilters }: FilterBarProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.bar}>
      {search !== undefined && onSearch && (
        <div className={styles.search}>
          <Search size={16} aria-hidden="true" className={styles.searchIcon} />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={t('filters.search')}
            className={styles.input}
          />
        </div>
      )}
      {children}
      <div className={styles.meta}>
        {count !== null && count !== undefined && (
          <p className={cx('mono', styles.count)} role="status">
            {t('filters.results', { count })}
          </p>
        )}
        {hasActiveFilters && onReset && (
          <button type="button" className={cx('mono', styles.reset)} onClick={onReset}>
            {t('filters.reset')}
          </button>
        )}
      </div>
    </div>
  );
}
