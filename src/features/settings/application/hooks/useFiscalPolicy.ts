import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SinCfdiMode } from "@boeltech/cfdi-domain";
import { settingsQueryKeys } from "../../domain";
import { fiscalPolicyApi } from "../../infrastructure/fiscalPolicyApi";

export function useFiscalPolicy(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settingsQueryKeys.fiscalPolicy(),
    queryFn: () => fiscalPolicyApi.get(),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useUpdateFiscalPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sinCfdiMode: SinCfdiMode) => fiscalPolicyApi.update(sinCfdiMode),
    onSuccess: (policy) => {
      queryClient.setQueryData(settingsQueryKeys.fiscalPolicy(), policy);
    },
  });
}
