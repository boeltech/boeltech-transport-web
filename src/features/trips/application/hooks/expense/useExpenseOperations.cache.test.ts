import { describe, expect, it, vi, beforeEach } from "vitest";

import { tripQueryKeys } from "@features/trips/domain";
import {
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "./useExpenseOperations";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

vi.mock("@features/approvals/application", () => ({
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

vi.mock("@features/trips/infrastructure", () => ({
  expenseRepository: {},
}));

vi.mock("../../useCases/expense/ExpenseUseCases", () => ({
  createGetExpensesUseCase: vi.fn(),
  createGetExpensesSummaryUseCase: vi.fn(),
  createAddExpenseUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createUpdateExpenseUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createDeleteExpenseUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createApproveExpenseUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createRejectExpenseUseCase: vi.fn(() => ({ execute: vi.fn() })),
  createReturnExpenseUseCase: vi.fn(() => ({ execute: vi.fn() })),
}));

describe("expense mutation cache invalidation", () => {
  const tripId = "trip-expense-1";

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    useMutationMock.mockClear();
  });

  it.each([
    ["useAddExpense", () => useAddExpense(tripId)],
    ["useUpdateExpense", () => useUpdateExpense(tripId)],
    ["useDeleteExpense", () => useDeleteExpense(tripId)],
  ] as const)("%s invalidates expenses, detail and lists", async (_name, factory) => {
    const mutationConfig = factory() as unknown as {
      onSuccess: (
        data: unknown,
        variables: unknown,
        context: unknown,
        mutation: unknown,
      ) => Promise<void>;
    };

    await mutationConfig.onSuccess({}, {}, {}, {});

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.expenses(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
  });
});
