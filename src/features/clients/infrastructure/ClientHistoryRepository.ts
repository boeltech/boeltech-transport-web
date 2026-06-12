import { apiClient, type ApiSingleResponse } from "@shared/api";
import type {
  ClientSummary,
  ClientTripHistoryFilters,
  ClientTripHistoryItem,
  IClientHistoryRepository,
  PaginatedResult,
  ClientSummaryApiResponse,
  ClientTripHistoryItemApiResponse,
} from "../domain";
import { mapClientSummary, mapClientTripHistory } from "./clientContactMappers";

class ClientHistoryRepository implements IClientHistoryRepository {
  async getSummary(clientId: string): Promise<ClientSummary> {
    const response = await apiClient.get<
      ApiSingleResponse<ClientSummaryApiResponse>
    >(`/clients/${clientId}/summary`);
    return mapClientSummary(response);
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
