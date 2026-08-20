import { useQuery } from "@tanstack/react-query";
import {
  tripQueryKeys,
  type RouteEstimate,
  type RouteEstimateParams,
} from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

function hasEstimateQuery(params: RouteEstimateParams | undefined): boolean {
  if (!params?.clientId || params.clientId === "no-client") return false;
  if (params.corridorKey) return true;
  const origin = params.originCity?.trim() ?? "";
  const destination = params.destinationCity?.trim() ?? "";
  return origin.length >= 2 && destination.length >= 2;
}

export function useRouteEstimate(params: RouteEstimateParams | undefined) {
  const enabled = hasEstimateQuery(params);

  return useQuery<RouteEstimate | null>({
    queryKey: tripQueryKeys.routeEstimate(
      params ?? { clientId: "" },
    ),
    queryFn: () => tripsApi.getRouteEstimate(params!),
    enabled,
    staleTime: 30_000,
  });
}
