import { UseMutateFunction } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '../services/api-client';

interface MutateWithToastOptions {
  successMessage: string;
  errorFallback: string;
}

/**
 * Runs a TanStack Query mutation and reports the result via toast, using the
 * backend's error message when available and a fallback otherwise. Several
 * screens trigger a mutation purely to show a success/error toast (publish,
 * archive, approve) — this avoids repeating the same onSuccess/onError pair.
 */
export function mutateWithToast<TData, TError, TVariables>(
  mutate: UseMutateFunction<TData, TError, TVariables>,
  variables: TVariables,
  { successMessage, errorFallback }: MutateWithToastOptions,
) {
  mutate(variables, {
    onSuccess: () => toast.success(successMessage),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : errorFallback),
  });
}
