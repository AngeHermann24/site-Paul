import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { QueryState } from '@/hooks/useServiceQuery';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonGrid } from '../Skeleton/Skeleton';

interface DataStateProps<T> {
  query: QueryState<T> & { reload: () => void };
  children: (data: T) => ReactNode;
  /** Données considérées vides (liste vide, null…) → état vide élégant. */
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  /** Rendu pendant le chargement (par défaut : grille de squelettes). */
  loading?: ReactNode;
  /** Si vide/non configuré, ne rien afficher du tout (sections optionnelles comme « prochain combat »). */
  hideWhenEmpty?: boolean;
}

const defaultIsEmpty = (d: unknown) => d === null || (Array.isArray(d) && d.length === 0);

/**
 * Enveloppe standard des sections alimentées par la base :
 * squelette → contenu | état vide honnête | erreur avec « Réessayer ».
 * Sans configuration Supabase : état vide (avec note technique en développement uniquement).
 */
export function DataState<T>({
  query,
  children,
  isEmpty = defaultIsEmpty,
  emptyTitle,
  emptyBody,
  emptyAction,
  loading,
  hideWhenEmpty = false,
}: DataStateProps<T>) {
  const { t } = useTranslation();

  if (query.status === 'loading') return <>{loading ?? <SkeletonGrid />}</>;

  const notConfigured = query.status === 'error' && query.error.kind === 'not_configured';
  const empty = notConfigured || (query.status === 'success' && isEmpty(query.data));

  if (empty) {
    if (hideWhenEmpty) return null;
    const body = [emptyBody ?? t('data.soonBody'), notConfigured && import.meta.env.DEV ? t('data.notConfigured') : null]
      .filter(Boolean)
      .join(' ');
    return <EmptyState title={emptyTitle ?? t('data.soon')} body={body} action={emptyAction} />;
  }

  if (query.status === 'error') {
    if (hideWhenEmpty) return null;
    return (
      <EmptyState
        title={t('data.error')}
        action={
          <Button variant="ghost" onClick={query.reload} icon={null}>
            {t('data.retry')}
          </Button>
        }
      />
    );
  }

  return <>{children(query.data)}</>;
}
