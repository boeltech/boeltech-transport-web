import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_OPERATIONAL_PLAN_CODE,
} from "./recommendOperationalPlan";
import {
  OPERATIONAL_PLAN_CATALOG,
  type OperationalPlanCatalogItem,
} from "./operationalPlanCatalog";
import { formatOperationalPlanForFunnel } from "./formatOperationalPlanForFunnel";
import { fetchPublicOperationalPlans } from "./publicOperationalPlansApi";

export const publicOperationalPlansQueryKey = [
  "onboarding",
  "plans",
] as const;

/**
 * Catálogo de planes para embudo público.
 * Usa GET /onboarding/plans; si falla o viene vacío, cae al catálogo estático.
 */
export function usePublicOperationalPlans() {
  const query = useQuery({
    queryKey: publicOperationalPlansQueryKey,
    queryFn: fetchPublicOperationalPlans,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const fromApi =
    query.data && query.data.length > 0
      ? query.data.map(formatOperationalPlanForFunnel)
      : null;

  const plans: readonly OperationalPlanCatalogItem[] =
    fromApi ?? OPERATIONAL_PLAN_CATALOG;

  const getByCode = (
    code: string | null | undefined,
  ): OperationalPlanCatalogItem =>
    plans.find((p) => p.code === code) ??
    plans.find((p) => p.code === DEFAULT_OPERATIONAL_PLAN_CODE) ??
    OPERATIONAL_PLAN_CATALOG[0]!;

  return {
    plans,
    getByCode,
    isLoading: query.isLoading,
    isError: query.isError,
    isFromApi: fromApi != null,
    refetch: query.refetch,
  };
}
