import { apiClient } from "@shared/api";
import type {
  BranchKpisData,
  BranchKpisPeriodValue,
  BranchKpisTrendData,
  FinancialTrendData,
  TripsByDayData,
} from "../domain/types";
import { DEFAULT_BRANCH_KPIS_PERIOD } from "../domain/types";
import {
  mapBranchKpis,
  mapBranchKpisTrend,
  mapFinancialTrend,
  mapTripsByDay,
} from "./mappers";

interface TripsByDayApiResponse {
  success: boolean;
  data: Record<string, unknown>;
}

export const dashboardApi = {
  getTripsByDay: async (days = 30): Promise<TripsByDayData> => {
    const response = await apiClient.get<TripsByDayApiResponse>(
      `/dashboard/trips-by-day?days=${days}`,
    );
    return mapTripsByDay(response.data as Record<string, unknown>);
  },

  getFinancialTrend: async (months = 12): Promise<FinancialTrendData> => {
    const response = await apiClient.get<TripsByDayApiResponse>(
      `/dashboard/financial-trend?months=${months}`,
    );
    return mapFinancialTrend(response.data as Record<string, unknown>);
  },

  getBranchKpis: async (params?: {
    branchIds?: string[];
    includeUnassigned?: boolean;
    period?: BranchKpisPeriodValue;
  }): Promise<BranchKpisData> => {
    const search = new URLSearchParams();
    const tokens: string[] = [...(params?.branchIds ?? [])];
    if (params?.includeUnassigned) {
      tokens.push("unassigned");
    }
    if (tokens.length > 0) {
      search.set("branch_ids", tokens.join(","));
    }
    const period = params?.period ?? DEFAULT_BRANCH_KPIS_PERIOD;
    search.set("period", period);
    const query = search.toString() ? `?${search.toString()}` : "";
    const response = await apiClient.get<TripsByDayApiResponse>(
      `/dashboard/branch-kpis${query}`,
    );
    return mapBranchKpis(response.data as Record<string, unknown>);
  },

  getBranchKpisTrend: async (params: {
    months: number;
    branchIds?: string[];
    includeUnassigned?: boolean;
  }): Promise<BranchKpisTrendData> => {
    const search = new URLSearchParams();
    search.set("months", String(params.months));
    const tokens: string[] = [...(params.branchIds ?? [])];
    if (params.includeUnassigned) {
      tokens.push("unassigned");
    }
    search.set("branch_ids", tokens.join(","));
    const response = await apiClient.get<TripsByDayApiResponse>(
      `/dashboard/branch-kpis/trend?${search.toString()}`,
    );
    return mapBranchKpisTrend(response.data as Record<string, unknown>);
  },
};
