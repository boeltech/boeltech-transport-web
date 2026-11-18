import type { EntitlementState } from "../../domain/entities";
import { useBillingAccess } from "./useBilling";

export interface UseEntitlementResult {
  state: EntitlementState;
  /** Query de /billing/access (puede estar off para roles exentos). */
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Estado de contrato de un complemento (DC2).
 *
 * - `unavailable` gana sobre `active`
 * - Roles exentos (`client`/`driver`): query off → `unknown` sin fetch (T9)
 * - `unknown` (error/idle) deja pasar a la API
 */
export function deriveEntitlementState(
  code: string,
  access: {
    isSuccess: boolean;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    data?: {
      effectiveModuleCodes: string[];
      unavailableModuleCodes: string[];
    };
  },
): EntitlementState {
  if (access.isSuccess && access.data) {
    const unavailable = access.data.unavailableModuleCodes ?? [];
    const effective = access.data.effectiveModuleCodes ?? [];
    if (unavailable.includes(code)) return "unavailable";
    if (effective.includes(code)) return "active";
    return "not_contracted";
  }

  if (access.isLoading || (access.isFetching && !access.isSuccess)) {
    return "loading";
  }

  // Query off (exento), error o idle sin success → unknown
  return "unknown";
}

export function useEntitlement(code: string): UseEntitlementResult {
  const access = useBillingAccess();
  const state = deriveEntitlementState(code, {
    isSuccess: access.isSuccess,
    isLoading: access.isLoading,
    isFetching: access.isFetching,
    isError: access.isError,
    data: access.data,
  });

  return {
    state,
    isLoading: access.isLoading,
    isFetching: access.isFetching,
    isSuccess: access.isSuccess,
    isError: access.isError,
  };
}
