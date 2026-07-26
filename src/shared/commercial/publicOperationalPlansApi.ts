import { apiClient, type ApiSingleResponse } from "@shared/api";
import {
  mapApiPublicOperationalPlan,
  type ApiPublicOperationalPlan,
  type PublicOperationalPlan,
} from "./publicOperationalPlan.types";

/**
 * Catálogo público de planes Operación (sin JWT).
 * GET /onboarding/plans
 */
export async function fetchPublicOperationalPlans(): Promise<
  PublicOperationalPlan[]
> {
  const response = await apiClient.get<
    ApiSingleResponse<ApiPublicOperationalPlan[]>
  >("/onboarding/plans");
  const rows = response.data ?? [];
  return rows.map(mapApiPublicOperationalPlan);
}
