import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { invalidationGroups } from "@/lib/queryConfig";

type InvalidationGroup = keyof typeof invalidationGroups;

interface MutationWithInvalidationOptions<TData, TError, TVariables, TContext> 
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onSuccess'> {
  invalidateGroups?: InvalidationGroup[];
  invalidateKeys?: string[][];
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>;
}

/**
 * Custom hook that wraps useMutation with automatic query invalidation
 * 
 * @example
 * const mutation = useMutationWithInvalidation({
 *   mutationFn: async (data) => await supabase.from('products').insert(data),
 *   invalidateGroups: ['stock'], // Will invalidate all stock-related queries
 *   invalidateKeys: [['customKey']], // Additional specific keys to invalidate
 * });
 */
export function useMutationWithInvalidation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(options: MutationWithInvalidationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const { invalidateGroups: groups, invalidateKeys, onSuccess, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      // Invalidate by groups
      if (groups) {
        const keysToInvalidate = groups.flatMap(group => invalidationGroups[group]);
        await Promise.all(
          keysToInvalidate.map(key => 
            queryClient.invalidateQueries({ queryKey: [key] })
          )
        );
      }

      // Invalidate specific keys
      if (invalidateKeys) {
        await Promise.all(
          invalidateKeys.map(key => 
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      }

      // Call original onSuccess
      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
  });
}
