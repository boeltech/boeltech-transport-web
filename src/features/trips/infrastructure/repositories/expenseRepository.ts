/**
 * Expense Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementa la interfaz IExpenseRepository.
 * Enfoque B: Operaciones separadas del viaje principal.
 */

import {
  apiClient,
  type ApiSingleResponse,
  type MappedActionResult,
  type MappedSingleResult,
} from "@shared/api";
import type {
  IExpenseRepository,
  ExpensesSummary,
  TripExpense,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@features/trips/domain";
import type {
  ApiExpenseResponse,
  ApiExpensesSummaryResponse,
} from "../api/api-types";
import {
  mapExpenseResponse,
  mapExpensesResponse,
  mapExpensesSummaryResponse,
} from "../api/mappers";

// ============================================================================
// CONSTANTS
// ============================================================================

const TRIPS_ENDPOINT = "/trips";

// ============================================================================
// EXPENSE REPOSITORY
// ============================================================================

export class ExpenseRepository implements IExpenseRepository {
  /**
   * Obtiene todos los gastos de un viaje
   */
  async findByTripId(
    tripId: string,
  ): Promise<MappedSingleResult<TripExpense[]>> {
    const response = await apiClient.get<
      ApiSingleResponse<ApiExpenseResponse[]>
    >(`${TRIPS_ENDPOINT}/${tripId}/expenses`);

    return mapExpensesResponse(response);
  }

  /**
   * Obtiene el resumen de gastos de un viaje
   */
  async getSummary(
    tripId: string,
  ): Promise<MappedSingleResult<ExpensesSummary>> {
    const response = await apiClient.get<
      ApiSingleResponse<ApiExpensesSummaryResponse>
    >(`${TRIPS_ENDPOINT}/${tripId}/expenses/summary`);

    return mapExpensesSummaryResponse(response);
  }

  /**
   * Obtiene un gasto por ID
   */
  async findById(
    tripId: string,
    expenseId: string,
  ): Promise<MappedSingleResult<TripExpense | null>> {
    try {
      const response = await apiClient.get<
        ApiSingleResponse<ApiExpenseResponse>
      >(`${TRIPS_ENDPOINT}/${tripId}/expenses/${expenseId}`);

      return mapExpenseResponse(response);
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return { data: null, message: "Gasto no encontrado" };
      }
      throw error;
    }
  }

  /**
   * Agrega un gasto a un viaje
   */
  async create(
    tripId: string,
    input: CreateExpenseInput,
  ): Promise<MappedSingleResult<TripExpense>> {
    // const apiData = toApiCreateExpense(data);

    const response = await apiClient.post<
      ApiSingleResponse<ApiExpenseResponse>
    >(`${TRIPS_ENDPOINT}/${tripId}/expenses`, input);

    return mapExpenseResponse(response);
  }

  /**
   * Actualiza un gasto
   */
  async update(
    tripId: string,
    expenseId: string,
    input: UpdateExpenseInput,
  ): Promise<MappedSingleResult<TripExpense>> {
    // const apiData = toApiUpdateExpense(input);

    const response = await apiClient.put<ApiSingleResponse<ApiExpenseResponse>>(
      `${TRIPS_ENDPOINT}/${tripId}/expenses/${expenseId}`,
      input,
    );

    return mapExpenseResponse(response);
  }

  /**
   * Elimina un gasto
   */
  async delete(tripId: string, expenseId: string): Promise<MappedActionResult> {
    await apiClient.delete(
      `${TRIPS_ENDPOINT}/${tripId}/expenses/${expenseId}`,
    );

    return { message: "Gasto eliminado exitosamente" };
  }

  /**
   * Aprueba un gasto
   */
  async approve(
    tripId: string,
    expenseId: string,
  ): Promise<MappedSingleResult<TripExpense>> {
    const response = await apiClient.patch<
      ApiSingleResponse<ApiExpenseResponse>
    >(`${TRIPS_ENDPOINT}/${tripId}/expenses/${expenseId}/approve`, {});

    return mapExpenseResponse(response);
  }

  /**
   * Rechaza un gasto
   */
  async reject(
    tripId: string,
    expenseId: string,
    reason?: string,
  ): Promise<MappedSingleResult<TripExpense>> {
    const response = await apiClient.patch<
      ApiSingleResponse<ApiExpenseResponse>
    >(`${TRIPS_ENDPOINT}/${tripId}/expenses/${expenseId}/reject`, { reason });

    return mapExpenseResponse(response);
  }

  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === "object") {
      const axiosError = error as { response?: { status?: number } };
      return axiosError.response?.status === 404;
    }
    return false;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createExpenseRepository(): IExpenseRepository {
  return new ExpenseRepository();
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const expenseRepository = new ExpenseRepository();
