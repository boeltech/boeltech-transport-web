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
  LastCollection,
  ClientByChannel,
} from "../domain";
import {
  mapClientSummary,
  mapClientTripHistory,
  mapClientCreditSummary,
  mapLastCollection,
  mapClientByChannel,
} from "./clientContactMappers";

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

  async getLastCollection(clientId: string): Promise<LastCollection | null> {
    const response = await apiClient.get<{ data: unknown | null }>(
      `/clients/${clientId}/last-collection`,
    );
    return mapLastCollection(response.data);
  }

  async getByChannel(clientId: string): Promise<ClientByChannel> {
    const response = await apiClient.get<{
      data: unknown;
      by_channel?: unknown;
    }>(`/finance/account-statement?client_id=${encodeURIComponent(clientId)}`);
    return mapClientByChannel(response.by_channel);
  }
}

export const clientHistoryRepository = new ClientHistoryRepository();
