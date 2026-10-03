import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { compensationApi } from "../../infrastructure/compensationApi";
import { compensationQueryKeys } from "../compensationQueryKeys";
import type {
  BatchTemplateAssignmentPayload,
  UpdateTemplateAssignmentPayload,
  UpsertFixedAllowanceOverridePayload,
} from "../../domain/entities";

/** Prefijos de React Query en settlements (evitar import circular del barrel). */
const SETTLEMENTS_PREVIEW_KEY = ["settlements", "preview"] as const;
const SETTLEMENTS_WORKBENCH_KEY = ["settlements", "workbench"] as const;

export function useTemplateAssignments(params?: {
  templateId?: string;
  employeeId?: string;
  activeOn?: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params ?? {};
  const hasScope = Boolean(
    queryParams.templateId || queryParams.employeeId || queryParams.activeOn,
  );

  return useQuery({
    queryKey: compensationQueryKeys.assignmentsList(queryParams),
    queryFn: () => compensationApi.listAssignments(queryParams),
    enabled: enabled && hasScope,
  });
}

export function useBatchCreateTemplateAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchTemplateAssignmentPayload) =>
      compensationApi.batchCreateAssignments(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.assignments() });
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
      queryClient.invalidateQueries({ queryKey: SETTLEMENTS_PREVIEW_KEY });
      queryClient.invalidateQueries({ queryKey: SETTLEMENTS_WORKBENCH_KEY });
    },
  });
}

export function useUpdateTemplateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTemplateAssignmentPayload;
    }) => compensationApi.updateAssignment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.assignments() });
    },
  });
}

export function useDeleteTemplateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compensationApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.assignments() });
    },
  });
}

export function useFixedAllowanceOverrides(params?: {
  employeeId?: string;
  periodStart?: string;
  periodEnd?: string;
  enabled?: boolean;
}) {
  const { enabled = true, employeeId, periodStart, periodEnd } = params ?? {};
  const hasScope = Boolean(employeeId && periodStart && periodEnd);

  return useQuery({
    queryKey: compensationQueryKeys.allowanceOverridesList({
      employeeId,
      periodStart,
      periodEnd,
    }),
    queryFn: () =>
      compensationApi.listFixedAllowanceOverrides({
        employeeId: employeeId!,
        periodStart: periodStart!,
        periodEnd: periodEnd!,
      }),
    enabled: enabled && hasScope,
  });
}

export function useUpsertFixedAllowanceOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertFixedAllowanceOverridePayload) =>
      compensationApi.upsertFixedAllowanceOverride(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.allowanceOverrides() });
    },
  });
}

