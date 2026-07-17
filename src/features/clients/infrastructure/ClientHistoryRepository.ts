import { apiClient, type ApiSingleResponse } from "@shared/api";
import type {
  ClientSummary,
  ClientCreditSummary,
  ClientTripHistoryItem,
  ClientTripHistoryFilters,
  PaginatedResult,
  ClientSummaryApiResponse,
  ClientCreditSummaryApiResponse,
  ClientTripHistoryItemApiResponse,
  IClientHistoryRepository,
} from "../domain";
import { mapClientSummary, mapClientTripHistory, mapClientCreditSummary } from "./clientContactMappers";

class ClientHistoryRepository implements IClientHistoryRepository {
  async getSummary(clientId: string): Promise<ClientSummary> {
    const response = await apiClient.get<
      ApiSingleResponse<ClientSummaryApiResponse>
    >(`/clients/${clientId}/summary`);
    return mapClientSummary(response);
  }

  async getCreditSummary(
    clientId: string,
    prospectiveAmount?: number,
  ): Promise<ClientCreditSummary> {
    const params = new URLSearchParams();
    if (prospectiveAmount != null && prospectiveAmount > 0) {
      params.set("prospective_amount", String(prospectiveAmount));
    }
    const qs = params.toString();
    const response = await apiClient.get<
      ApiSingleResponse<ClientCreditSummaryApiResponse>
    >(`/clients/${clientId}/credit-summary${qs ? `?${qs}` : ""}`);
    return mapClientCreditSummary(response);
  }

  async getTripHistory(
    clientId: string,
    filters: ClientTripHistoryFilters = {},
  ): Promise<PaginatedResult<ClientTripHistoryItem>> {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.status) params.set("status", filters.status);
    if (filters.includeExcluded) params.set("include_excluded", "true");

    const qs = params.toString();
    const response = await apiClient.get<{
      data: ClientTripHistoryItemApiResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    }>(`/clients/${clientId}/trip-history${qs ? `?${qs}` : ""}`);

    return mapClientTripHistory(response);
  }
}

export const clientHistoryRepository = new ClientHistoryRepository();
