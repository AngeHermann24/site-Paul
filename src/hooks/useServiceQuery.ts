import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import type { ServiceError, ServiceResult } from '@/services/_shared';

export type QueryState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: ServiceError };

/**
 * Exécute un appel de service et expose loading / success / error.
 * Les réponses obsolètes (deps changées entre-temps) sont ignorées.
 */
export function useServiceQuery<T>(
  fetcher: () => Promise<ServiceResult<T>>,
  deps: DependencyList,
): QueryState<T> & { reload: () => void } {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading', data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', data: null, error: null });
    void fetcherRef.current().then((res) => {
      if (!alive) return;
      setState(res.error ? { status: 'error', data: null, error: res.error } : { status: 'success', data: res.data, error: null });
    });
    return () => {
      alive = false;
    };
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
