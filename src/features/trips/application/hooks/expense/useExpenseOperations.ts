/**
 * Expense Hooks
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks de React Query para operaciones de gastos.
 * Sigue el patrón: Hook → UseCase → Repository
 *
 * Importante: no poner `...options` después de `onSuccess` — el caller
 * (toast) sobrescribiría la invalidación de cache.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { invalidateApprovalsRelatedQueries } from "@features/approvals";
import {
  tripQueryKeys,
  type CreateExpenseInput,
  type ExpensesSummary,
  type TripExpense,
  type UpdateExpenseInput,
} from "@features/trips/domain";
import { expenseRepository } from "@features/trips/infrastructure";
import {
  createGetExpensesUseCase,
  createGetExpensesSummaryUseCase,
  createAddExpenseUseCase,
  createUpdateExpenseUseCase,
  createDeleteExpenseUseCase,
  createApproveExpenseUseCase,
  createRejectExpenseUseCase,
} from "../../useCases/expense/ExpenseUseCases";

// ============================================================================
// ERROR CLASS
// ============================================================================

export class ExpenseError extends Error {
  code: string;
  originalMessage?: string;

  constructor(code: string, message: string, originalMessage?: string) {
    super(message);
    this.name = "ExpenseError";
    this.code = code;
    this.originalMessage = originalMessage;
  }
}

function splitMutationOptions<TData, TError, TVariables, TContext = unknown>(
  options?: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...rest
  } = options ?? {};
  return { userOnSuccess, userOnError, userOnSettled, rest };
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook para obtener los gastos de un viaje
 */
export function useTripExpenses(
  tripId: string,
  options?: Omit<
    UseQueryOptions<TripExpense[], ExpenseError>,
    "queryKey" | "queryFn"
  >,
) {
  const getExpensesUseCase = createGetExpensesUseCase(expenseRepository);

  return useQuery({
    queryKey: tripQueryKeys.expenses(tripId),
    queryFn: async () => {
      const result = await getExpensesUseCase.execute(tripId);

      if (!result.success) {
        throw new ExpenseError(result.error.code, result.error.message);
      }

      return result.data;
    },
    enabled: !!tripId,
    ...options,
  });
}

/**
 * Hook para obtener el resumen de gastos de un viaje
 */
export function useTripExpensesSummary(
  tripId: string,
  options?: Omit<
    UseQueryOptions<ExpensesSummary, ExpenseError>,
    "queryKey" | "queryFn"
  >,
) {
  const getSummaryUseCase = createGetExpensesSummaryUseCase(expenseRepository);

  return useQuery({
    queryKey: [...tripQueryKeys.expenses(tripId), "summary"],
    queryFn: async () => {
      const result = await getSummaryUseCase.execute(tripId);

      if (!result.success) {
        throw new ExpenseError(result.error.code, result.error.message);
      }

      return result.data;
    },
    enabled: !!tripId,
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook para agregar un gasto a un viaje
 */
export function useAddExpense(
  tripId: string,
  options?: UseMutationOptions<TripExpense, ExpenseError, CreateExpenseInput>,
) {
  const queryClient = useQueryClient();
  const addExpenseUseCase = createAddExpenseUseCase(expenseRepository);
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
    mutationFn: async (input: CreateExpenseInput) => {
      const result = await addExpenseUseCase.execute(tripId, input);

      if (!result.success) {
        throw new ExpenseError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.expenses(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}

/**
 * Hook para actualizar un gasto
 */
export function useUpdateExpense(
  tripId: string,
  options?: UseMutationOptions<
    TripExpense,
    ExpenseError,
    { expenseId: string; data: UpdateExpenseInput }
  >,
) {
  const queryClient = useQueryClient();
  const updateExpenseUseCase = createUpdateExpenseUseCase(expenseRepository);
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
    mutationFn: async ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: UpdateExpenseInput;
    }) => {
      const result = await updateExpenseUseCase.execute(
        tripId,
        expenseId,
        data,
      );

      if (!result.success) {
        throw new ExpenseError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.expenses(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}

/**
 * Hook para eliminar un gasto
 */
export function useDeleteExpense(
  tripId: string,
  options?: UseMutationOptions<void, ExpenseError, string>,
) {
  const queryClient = useQueryClient();
  const deleteExpenseUseCase = createDeleteExpenseUseCase(expenseRepository);
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
    mutationFn: async (expenseId: string) => {
      const result = await deleteExpenseUseCase.execute(tripId, expenseId);

      if (!result.success) {
        throw new ExpenseError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.expenses(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}

/**
 * Hook para aprobar un gasto
 */
export function useApproveExpense(
  tripId: string,
  options?: UseMutationOptions<TripExpense, ExpenseError, string>,
) {
  const queryClient = useQueryClient();
  const approveExpenseUseCase = createApproveExpenseUseCase(expenseRepository);
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
    mutationFn: async (expenseId: string) => {
      const result = await approveExpenseUseCase.execute(tripId, expenseId);

      if (!result.success) {
        throw new ExpenseError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.expenses(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      invalidateApprovalsRelatedQueries(queryClient);
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}

/**
 * Hook para rechazar un gasto
 */
export function useRejectExpense(
  tripId: string,
  options?: UseMutationOptions<
    TripExpense,
    ExpenseError,
    { expenseId: string; reason: string }
  >,
) {
  const queryClient = useQueryClient();
  const rejectExpenseUseCase = createRejectExpenseUseCase(expenseRepository);
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
    mutationFn: async ({
      expenseId,
      reason,
    }: {
      expenseId: string;
      reason: string;
    }) => {
      const result = await rejectExpenseUseCase.execute(
        tripId,
        expenseId,
        reason,
      );

      if (!result.success) {
        throw new ExpenseError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.expenses(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      invalidateApprovalsRelatedQueries(queryClient);
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}

// ============================================================================
// BULK OPERATIONS HOOK
// ============================================================================

/**
 * Hook para agregar múltiples gastos a un viaje
 * Útil para agregar gastos estimados en la creación del viaje
 */
export function useAddMultipleExpenses(
  tripId: string,
  options?: UseMutationOptions<
    TripExpense[],
    ExpenseError,
    CreateExpenseInput[]
  >,
) {
  const queryClient = useQueryClient();
  const addExpenseUseCase = createAddExpenseUseCase(expenseRepository);
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
    mutationFn: async (expenses: CreateExpenseInput[]) => {
      const results: TripExpense[] = [];

      for (const expense of expenses) {
        const result = await addExpenseUseCase.execute(tripId, expense);

        if (!result.success) {
          throw new ExpenseError(
            result.error.code,
            `Error agregando gasto "${expense.description}": ${result.error.message}`,
            result.error.originalMessage,
          );
        }

        results.push(result.data);
      }

      return results;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.expenses(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
