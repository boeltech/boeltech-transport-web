import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import type { CompensationAgreementFormData } from "../../presentation/validation/settlementSchemas";

export function useCompensationAgreements(employeeId?: string) {
  return useQuery({
    queryKey: settlementsQueryKeys.agreementsList(employeeId),
    queryFn: () => settlementsApi.listAgreements(employeeId),
  });
}

export function useCreateCompensationAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompensationAgreementFormData) =>
      settlementsApi.createAgreement(data),
    onSuccess: (_, variables) => {
      invalidateAgreementQueries(queryClient, variables.employeeId);
    },
  });
}

export interface UpdateCompensationAgreementInput {
  id: string;
  employeeId: string;
  isActive?: boolean;
  effectiveTo?: string;
}

function invalidateAgreementQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  employeeId?: string,
) {
  queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.agreements(),
  });
  if (employeeId) {
    queryClient.invalidateQueries({
      queryKey: settlementsQueryKeys.agreementsList(employeeId),
    });
  }
  queryClient.invalidateQueries({
    queryKey: [...settlementsQueryKeys.all, "preview"],
  });
}

export function useUpdateCompensationAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive, effectiveTo }: UpdateCompensationAgreementInput) =>
      settlementsApi.updateAgreement(id, { isActive, effectiveTo }),
    onSuccess: (_, variables) => {
      invalidateAgreementQueries(queryClient, variables.employeeId);
    },
  });
}

export function useDeleteCompensationAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; employeeId: string }) =>
      settlementsApi.deleteAgreement(id),
    onSuccess: (_, variables) => {
      invalidateAgreementQueries(queryClient, variables.employeeId);
    },
  });
}
