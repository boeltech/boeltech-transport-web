/**
 * Expense Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso para operaciones de gastos.
 * Enfoque B: Operaciones separadas del viaje principal.
 */

import type {
  TripExpense,
  ExpenseCategoryType,
} from "@features/trips/domain/entities/entities";
import type {
  IExpenseRepository,
  UpdateExpenseDTO,
  ExpensesSummary,
} from "@features/trips/domain";
import {
  mapBackendError,
  type MappedError,
  type UseCaseResult,
} from "@shared/utils/errorMapper";

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input para crear un gasto
 */
export interface CreateExpenseInput {
  category: ExpenseCategoryType;
  description: string;
  amount: number;
  currency?: string;
  expenseDate?: Date | string;
  location?: string;
  hasReceipt?: boolean;
  receiptUrl?: string;
  vendorName?: string;
  isEstimated?: boolean;
  notes?: string;
}

/**
 * Input para actualizar un gasto
 */
export interface UpdateExpenseInput {
  category?: ExpenseCategoryType;
  description?: string;
  amount?: number;
  currency?: string;
  expenseDate?: Date | string;
  location?: string | null;
  hasReceipt?: boolean;
  receiptUrl?: string | null;
  vendorName?: string | null;
  isEstimated?: boolean;
  notes?: string | null;
}

// ============================================================================
// GET EXPENSES USE CASE
// ============================================================================

export interface IGetExpensesUseCase {
  execute(tripId: string): Promise<UseCaseResult<TripExpense[]>>;
}

export class GetExpensesUseCase implements IGetExpensesUseCase {
  private readonly repository: IExpenseRepository;

  constructor(repository: IExpenseRepository) {
    this.repository = repository;
  }

  async execute(tripId: string): Promise<UseCaseResult<TripExpense[]>> {
    try {
      const result = await this.repository.findByTripId(tripId);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// GET EXPENSES SUMMARY USE CASE
// ============================================================================

export interface IGetExpensesSummaryUseCase {
  execute(tripId: string): Promise<UseCaseResult<ExpensesSummary>>;
}

export class GetExpensesSummaryUseCase implements IGetExpensesSummaryUseCase {
  private readonly repository: IExpenseRepository;

  constructor(repository: IExpenseRepository) {
    this.repository = repository;
  }

  async execute(tripId: string): Promise<UseCaseResult<ExpensesSummary>> {
    try {
      const result = await this.repository.getSummary(tripId);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// ADD EXPENSE USE CASE
// ============================================================================

export interface IAddExpenseUseCase {
  execute(
    tripId: string,
    input: CreateExpenseInput,
  ): Promise<UseCaseResult<TripExpense>>;
}

export class AddExpenseUseCase implements IAddExpenseUseCase {
  private readonly repository: IExpenseRepository;

  constructor(repository: IExpenseRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    input: CreateExpenseInput,
  ): Promise<UseCaseResult<TripExpense>> {
    try {
      // Validaciones de negocio
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Mapear input a DTO
      // const dto = this.mapInputToDTO(input);

      const result = await this.repository.create(tripId, input);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }

  private validateInput(input: CreateExpenseInput): MappedError | null {
    if (!input.category) {
      return {
        code: "CATEGORY_REQUIRED",
        message: "La categoría del gasto es requerida",
      };
    }

    if (!input.description?.trim()) {
      return {
        code: "DESCRIPTION_REQUIRED",
        message: "La descripción del gasto es requerida",
      };
    }

    if (input.amount === undefined || input.amount <= 0) {
      return {
        code: "INVALID_AMOUNT",
        message: "El monto debe ser mayor a cero",
      };
    }

    return null;
  }
}

// ============================================================================
// UPDATE EXPENSE USE CASE
// ============================================================================

export interface IUpdateExpenseUseCase {
  execute(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<UseCaseResult<TripExpense>>;
}

export class UpdateExpenseUseCase implements IUpdateExpenseUseCase {
  private readonly repository: IExpenseRepository;

  constructor(repository: IExpenseRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<UseCaseResult<TripExpense>> {
    try {
      // Validar monto si se proporciona
      if (input.amount !== undefined && input.amount <= 0) {
        return {
          success: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "El monto debe ser mayor a cero",
          },
        };
      }

      const dto: UpdateExpenseDTO = {
        category: input.category,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        expenseDate: input.expenseDate
          ? typeof input.expenseDate === "string"
            ? input.expenseDate
            : input.expenseDate.toISOString()
          : undefined,
        location: input.location,
        hasReceipt: input.hasReceipt,
        receiptUrl: input.receiptUrl,
        vendorName: input.vendorName,
        isEstimated: input.isEstimated,
        notes: input.notes,
      };

      const result = await this.repository.update(tripId, expenseId, dto);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// DELETE EXPENSE USE CASE
// ============================================================================

export interface IDeleteExpenseUseCase {
  execute(tripId: string, expenseId: string): Promise<UseCaseResult<void>>;
}

export class DeleteExpenseUseCase implements IDeleteExpenseUseCase {
  private readonly repository: IExpenseRepository;

  constructor(repository: IExpenseRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    expenseId: string,
  ): Promise<UseCaseResult<void>> {
    try {
      await this.repository.delete(tripId, expenseId);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// APPROVE EXPENSE USE CASE
// ============================================================================

export interface IApproveExpenseUseCase {
  execute(
    tripId: string,
    expenseId: string,
  ): Promise<UseCaseResult<TripExpense>>;
}

export class ApproveExpenseUseCase implements IApproveExpenseUseCase {
  private readonly repository: IExpenseRepository;

  constructor(repository: IExpenseRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    expenseId: string,
  ): Promise<UseCaseResult<TripExpense>> {
    try {
      const result = await this.repository.approve(tripId, expenseId);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// REJECT EXPENSE USE CASE
// ============================================================================

export interface IRejectExpenseUseCase {
  execute(
    tripId: string,
    expenseId: string,
    reason?: string,
  ): Promise<UseCaseResult<TripExpense>>;
}

export class RejectExpenseUseCase implements IRejectExpenseUseCase {
  private readonly repository: IExpenseRepository;

  constructor(repository: IExpenseRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    expenseId: string,
    reason?: string,
  ): Promise<UseCaseResult<TripExpense>> {
    try {
      const result = await this.repository.reject(tripId, expenseId, reason);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createGetExpensesUseCase(
  repository: IExpenseRepository,
): IGetExpensesUseCase {
  return new GetExpensesUseCase(repository);
}

export function createGetExpensesSummaryUseCase(
  repository: IExpenseRepository,
): IGetExpensesSummaryUseCase {
  return new GetExpensesSummaryUseCase(repository);
}

export function createAddExpenseUseCase(
  repository: IExpenseRepository,
): IAddExpenseUseCase {
  return new AddExpenseUseCase(repository);
}

export function createUpdateExpenseUseCase(
  repository: IExpenseRepository,
): IUpdateExpenseUseCase {
  return new UpdateExpenseUseCase(repository);
}

export function createDeleteExpenseUseCase(
  repository: IExpenseRepository,
): IDeleteExpenseUseCase {
  return new DeleteExpenseUseCase(repository);
}

export function createApproveExpenseUseCase(
  repository: IExpenseRepository,
): IApproveExpenseUseCase {
  return new ApproveExpenseUseCase(repository);
}

export function createRejectExpenseUseCase(
  repository: IExpenseRepository,
): IRejectExpenseUseCase {
  return new RejectExpenseUseCase(repository);
}
