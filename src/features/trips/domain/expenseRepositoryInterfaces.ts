/**
 * Expense Repository Interfaces
 * Clean Architecture - Domain Layer (Ports)
 *
 * Interfaces para los repositorios de cargas y gastos.
 * Implementa el Enfoque B: operaciones separadas del viaje principal.
 */

import type { MappedActionResult, MappedSingleResult } from "@shared/api";
import type {
  TripExpense,
  ExpenseCategoryType,
  ExpenseStatusType,
} from "./entities";

// ============================================================================
// EXPENSE DTOs
// ============================================================================

/**
 * DTO para crear un gasto
 */
export interface CreateExpenseDTO {
  category: ExpenseCategoryType;
  description: string;
  amount: number;
  currency?: string;
  expenseDate?: string;
  location?: string;
  hasReceipt?: boolean;
  receiptUrl?: string;
  vendorName?: string;
  isEstimated?: boolean;
  notes?: string;
}

/**
 * DTO para actualizar un gasto
 */
export interface UpdateExpenseDTO {
  category?: ExpenseCategoryType;
  description?: string;
  amount?: number;
  currency?: string;
  expenseDate?: string;
  location?: string | null;
  hasReceipt?: boolean;
  receiptUrl?: string | null;
  vendorName?: string | null;
  isEstimated?: boolean;
  status?: ExpenseStatusType;
  notes?: string | null;
}

/**
 * Resumen de gastos de un viaje
 */
export interface ExpensesSummary {
  total: number;
  byCategory: Record<string, number>;
  estimatedCount: number;
  pendingCount: number;
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Interfaz del repositorio de gastos
 */
export interface IExpenseRepository {
  /**
   * Obtiene todos los gastos de un viaje
   */
  findByTripId(tripId: string): Promise<MappedSingleResult<TripExpense[]>>;

  /**
   * Obtiene el resumen de gastos de un viaje
   */
  getSummary(tripId: string): Promise<MappedSingleResult<ExpensesSummary>>;

  /**
   * Obtiene un gasto por ID
   */
  findById(
    tripId: string,
    expenseId: string,
  ): Promise<MappedSingleResult<TripExpense | null>>;

  /**
   * Agrega un gasto a un viaje
   */
  create(
    tripId: string,
    data: CreateExpenseDTO,
  ): Promise<MappedSingleResult<TripExpense>>;

  /**
   * Actualiza un gasto
   */
  update(
    tripId: string,
    expenseId: string,
    data: UpdateExpenseDTO,
  ): Promise<MappedSingleResult<TripExpense>>;

  /**
   * Elimina un gasto
   */
  delete(tripId: string, expenseId: string): Promise<MappedActionResult>;

  /**
   * Aprueba un gasto
   */
  approve(
    tripId: string,
    expenseId: string,
  ): Promise<MappedSingleResult<TripExpense>>;

  /**
   * Rechaza un gasto
   */
  reject(
    tripId: string,
    expenseId: string,
    reason?: string,
  ): Promise<MappedSingleResult<TripExpense>>;
}
