import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useDebounce } from "@shared/hooks";
import { compensationApi } from "../../infrastructure/compensationApi";
import { compensationQueryKeys } from "../compensationQueryKeys";
import { BATCH_ASSIGNMENT_MAX_EMPLOYEES } from "../../domain/enums";
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

export function useTemplateAssignment(
  id: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: compensationQueryKeys.assignmentDetail(id ?? ""),
    queryFn: () => compensationApi.getAssignment(id!),
    enabled: enabled && Boolean(id),
  });
}

export const BATCH_ASSIGNMENT_PREVIEW_DEBOUNCE_MS = 300;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type BatchPreviewParams = Required<
  Pick<
    BatchTemplateAssignmentPayload,
    "templateId" | "employeeIds" | "effectiveFrom" | "effectiveTo" | "closePreviousAssignment"
  >
>;

/** `reason` no entra: la vista previa lo ignora y no debe volver a pedirse al escribirlo. */
function toBatchPreviewParams(
  payload: BatchTemplateAssignmentPayload | null | undefined,
): BatchPreviewParams | null {
  if (!payload) return null;
  return {
    templateId: payload.templateId,
    employeeIds: [...new Set(payload.employeeIds)],
    effectiveFrom: payload.effectiveFrom,
    effectiveTo: payload.effectiveTo?.trim() ? payload.effectiveTo.trim() : null,
    closePreviousAssignment: payload.closePreviousAssignment ?? true,
  };
}

function canPreviewBatch(params: BatchPreviewParams | null): params is BatchPreviewParams {
  if (!params?.templateId) return false;
  const count = params.employeeIds.length;
  if (count === 0 || count > BATCH_ASSIGNMENT_MAX_EMPLOYEES) return false;
  if (!ISO_DATE.test(params.effectiveFrom)) return false;
  if (params.effectiveTo === null) return true;
  return ISO_DATE.test(params.effectiveTo) && params.effectiveTo >= params.effectiveFrom;
}

/**
 * Vista previa del lote en el servidor, con espera tras el último cambio.
 * Orientativa: si falla, el formulario sigue permitiendo confirmar.
 */
export function useBatchAssignmentPreview(
  payload: BatchTemplateAssignmentPayload | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const serialized = JSON.stringify(toBatchPreviewParams(payload));
  const debounced = useDebounce(serialized, BATCH_ASSIGNMENT_PREVIEW_DEBOUNCE_MS);
  const params = useMemo(
    () => JSON.parse(debounced) as BatchPreviewParams | null,
    [debounced],
  );
  const ready = canPreviewBatch(params);

  return useQuery({
    queryKey: compensationQueryKeys.assignmentBatchPreview(params ?? {}),
    queryFn: () => compensationApi.previewBatchAssignments(params!),
    enabled: enabled && ready,
    placeholderData: keepPreviousData,
    retry: false,
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
    onSuccess: () => invalidateAfterAssignmentChange(queryClient),
  });
}

export function useDeleteTemplateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compensationApi.deleteAssignment(id),
    onSuccess: () => invalidateAfterAssignmentChange(queryClient),
  });
}

/** Lista, detalle y vista previa cuelgan de `assignments()`; los conteos, de `templates()`. */
function invalidateAfterAssignmentChange(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: compensationQueryKeys.assignments() });
  queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
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

