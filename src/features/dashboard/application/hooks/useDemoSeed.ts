/**
 * Demo seed status + apply/purge mutations (F2).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { trackActivationEvent } from "../../domain/trackActivationEvent";
import { demoSeedApi } from "../../infrastructure/demoSeedApi";
import { dashboardQueryKeys } from "../dashboardQueryKeys";
import { invalidateAfterDemoSeedChange } from "../invalidateAfterDemoSeedChange";

export function useDemoSeedStatus(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: dashboardQueryKeys.demoSeed(),
    queryFn: () => demoSeedApi.getStatus(),
    enabled: isAuthenticated && enabled,
    staleTime: 60_000,
  });
}

export function useApplyDemoSeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { includeDraftTrip?: boolean }) =>
      demoSeedApi.apply(options),
    onSuccess: () => {
      trackActivationEvent("activation_demo_seed_loaded");
      invalidateAfterDemoSeedChange(queryClient);
    },
  });
}

export function usePurgeDemoSeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => demoSeedApi.purge(),
    onSuccess: () => {
      trackActivationEvent("activation_demo_seed_purged");
      invalidateAfterDemoSeedChange(queryClient);
    },
  });
}
