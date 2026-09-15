import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { compensationApi } from "../../infrastructure/compensationApi";
import { compensationQueryKeys } from "../compensationQueryKeys";
import type {
  CompensationTemplateRule,
  CreateCompensationTemplatePayload,
  ReplaceTemplateConfigurationPayload,
  TemplateFixedAllowance,
} from "../../domain/entities";

export function useCompensationTemplates(params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: compensationQueryKeys.templatesList(params),
    queryFn: () => compensationApi.listTemplates(params),
  });
}

export function useCompensationTemplate(id: string | undefined) {
  return useQuery({
    queryKey: compensationQueryKeys.templateDetail(id ?? ""),
    queryFn: () => compensationApi.getTemplateById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCompensationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompensationTemplatePayload) =>
      compensationApi.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
    },
  });
}

export function useUpdateCompensationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      description?: string | null;
      isActive?: boolean;
      midTripPayoutPolicy?: string;
      rules?: CompensationTemplateRule[];
      fixedAllowances?: TemplateFixedAllowance[];
      corridorIds?: string[];
    }) => compensationApi.updateTemplate(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
      queryClient.invalidateQueries({
        queryKey: compensationQueryKeys.templateDetail(variables.id),
      });
    },
  });
}

export function useReplaceTemplateConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReplaceTemplateConfigurationPayload;
    }) => compensationApi.replaceTemplateConfiguration(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
      queryClient.invalidateQueries({
        queryKey: compensationQueryKeys.templateDetail(variables.id),
      });
    },
  });
}

export function useDeleteCompensationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compensationApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
    },
  });
}
