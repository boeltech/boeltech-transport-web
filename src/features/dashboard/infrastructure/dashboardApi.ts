import { apiClient } from "@shared/api";
import type { FinancialTrendData, TripsByDayData } from "../domain/types";
import { mapFinancialTrend, mapTripsByDay } from "./mappers";

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
};
