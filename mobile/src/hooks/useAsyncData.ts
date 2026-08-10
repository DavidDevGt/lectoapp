import { useCallback, useEffect, useRef, useState } from 'react';
import { isAborted } from '../api/errors';

interface AsyncData<T> {
  data: T | null;
  error: unknown;
  isLoading: boolean;
  isRefreshing: boolean;
  /** Recarga mostrando el estado de carga completo. */
  reload: () => void;
  /** Recarga en segundo plano, conservando los datos actuales (pull-to-refresh). */
  refresh: () => void;
}

/**
 * Carga de datos con cancelación.
 *
 * Cada ejecución aborta la anterior y solo aplica su resultado si sigue siendo la
 * más reciente. Sin esto, tocar los filtros rápido dejaba que una respuesta lenta
 * sobrescribiera a una posterior.
 */
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (mode: 'load' | 'refresh') => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const runId = ++runIdRef.current;
    if (mode === 'refresh') setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await fetcherRef.current(controller.signal);
      if (runId !== runIdRef.current) return;
      setData(result);
      setError(null);
    } catch (caught) {
      if (runId !== runIdRef.current || isAborted(caught) || controller.signal.aborted) return;
      setError(caught);
    } finally {
      if (runId === runIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void run('load');
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => void run('load'), [run]);
  const refresh = useCallback(() => void run('refresh'), [run]);

  return { data, error, isLoading, isRefreshing, reload, refresh };
}
