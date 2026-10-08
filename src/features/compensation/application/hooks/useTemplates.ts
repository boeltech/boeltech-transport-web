import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { compensationApi } from "../../infrastructure/compensationApi";
import { COMPENSATION_ERROR_CODES } from "../../domain/enums";
import { compensationQueryKeys } from "../compensationQueryKeys";
import type {
  ActivateCompensationTemplatePayload,
  CreateCompensationTemplatePayload,
  ReplaceTemplateConfigurationPayload,
  UpdateCompensationTemplatePayload,
} from "../../domain/entities";
import type { CompensationTemplateStatus } from "../../domain/enums";

function invalidateTemplateFamily(
  queryClient: ReturnType<typeof useQueryClient>,
  templateId: string,
) {
  queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
  queryClient.invalidateQueries({
    queryKey: compensationQueryKeys.templateDetail(templateId),
  });
  queryClient.invalidateQueries({
    queryKey: compensationQueryKeys.templateVersions(templateId),
  });
  queryClient.invalidateQueries({
    queryKey: [...compensationQueryKeys.templates(), "activity", templateId],
  });
}

export function useCompensationTemplates(params?: {
  search?: string;
  status?: CompensationTemplateStatus;
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

export function useTemplateVersions(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: compensationQueryKeys.templateVersions(id ?? ""),
    queryFn: () => compensationApi.listTemplateVersions(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useTemplateActivity(
  id: string | undefined,
  params?: { page?: number; pageSize?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: compensationQueryKeys.templateActivity(id ?? "", params),
    queryFn: () => compensationApi.listTemplateActivity(id!, params),
    enabled: Boolean(id) && enabled,
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
    }: UpdateCompensationTemplatePayload & { id: string }) =>
      compensationApi.updateTemplate(id, payload),
    onSuccess: (_, variables) => {
      invalidateTemplateFamily(queryClient, variables.id);
    },
    onError: (error, variables) => {
      if (
        isApiError(error) &&
        error.code === COMPENSATION_ERROR_CODES.TEMPLATE_CONFIG_LOCKED
      ) {
        invalidateTemplateFamily(queryClient, variables.id);
      }
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
      invalidateTemplateFamily(queryClient, variables.id);
    },
  });
}

export function useActivateCompensationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: ActivateCompensationTemplatePayload & { id: string }) =>
      compensationApi.activateTemplate(id, payload),
    onSuccess: (template) => {
      invalidateTemplateFamily(queryClient, template.id);
      if (template.familyId !== template.id) {
        invalidateTemplateFamily(queryClient, template.familyId);
      }
    },
  });
}

export function useDeactivateCompensationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compensationApi.deactivateTemplate(id),
    onSuccess: (template) => {
      invalidateTemplateFamily(queryClient, template.id);
    },
  });
}

export function useCreateCompensationTemplateVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compensationApi.createTemplateVersion(id),
    onSuccess: (template, sourceId) => {
      invalidateTemplateFamily(queryClient, sourceId);
      invalidateTemplateFamily(queryClient, template.id);
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
