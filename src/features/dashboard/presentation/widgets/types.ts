import type { useNavigate } from "react-router-dom";
import type { useDashboard } from "../../application/hooks/useDashboard";
import type {
  ExpensesByDimensionItem,
  useFinanceSummary,
} from "@features/finance";
import type {
  FinancialTrendData,
  TripsByDayData,
} from "../../domain/types";
import type { FinancialTrendMonths } from "../components";

export const TRIPS_DAY_OPTIONS = [7, 30, 90] as const;
export type TripsDayRange = (typeof TRIPS_DAY_OPTIONS)[number];

export interface DashboardWidgetContext {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  navigate: ReturnType<typeof useNavigate>;
  /** `state.from` al salir del dashboard (Inicio o reenvío desde Reportes). */
  fromHref: string;
  tripsByDay?: TripsByDayData;
  tripsByDayLoading: boolean;
  tripsDays: TripsDayRange;
  setTripsDays: (days: TripsDayRange) => void;
  showFinance: boolean;
  financeLoading: boolean;
  financeSummary?: ReturnType<typeof useFinanceSummary>["data"];
  vehicleExpenseRanking?: ExpensesByDimensionItem[];
  vehicleExpenseRankingLoading: boolean;
  financialTrend?: FinancialTrendData;
  financialTrendLoading: boolean;
  financialTrendMonths: FinancialTrendMonths;
  setFinancialTrendMonths: (months: FinancialTrendMonths) => void;
  compareBranchIds?: string[];
}
