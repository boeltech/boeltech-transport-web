import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BatchTemplateAssignmentPayload } from "../../domain/entities";
import { compensationQueryKeys } from "../compensationQueryKeys";
import {
  useBatchAssignmentPreview,
  useDeleteTemplateAssignment,
  useUpdateTemplateAssignment,
} from "./useAssignments";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    updateAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
    previewBatchAssignments: vi.fn(),
  },
}));

vi.mock("../../infrastructure/compensationApi", () => ({ compensationApi: mockApi }));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const emptyPreview = {
  wouldCreateCount: 0,
  wouldSkipCount: 0,
  employees: [],
  conflicts: [],
  closures: [],
};

describe("useUpdate/DeleteTemplateAssignment — invalidación (api#63 C15)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const previewKey = compensationQueryKeys.assignmentBatchPreview({ templateId: "tpl-v2" });
  const templatesKey = compensationQueryKeys.templatesList({ page: 1 });

  function seed(queryClient: QueryClient) {
    queryClient.setQueryData(previewKey, emptyPreview);
    queryClient.setQueryData(templatesKey, { data: [] });
  }

  it("actualizar invalida la vista previa y los conteos del listado", async () => {
    mockApi.updateAssignment.mockResolvedValue({ id: "asg-1" });
    const { queryClient, wrapper } = createWrapper();
    seed(queryClient);
    const { result } = renderHook(() => useUpdateTemplateAssignment(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "asg-1", payload: { isActive: false } });
    });

    expect(queryClient.getQueryState(previewKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(templatesKey)?.isInvalidated).toBe(true);
  });

  it("eliminar invalida la vista previa y los conteos del listado", async () => {
    mockApi.deleteAssignment.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    seed(queryClient);
    const { result } = renderHook(() => useDeleteTemplateAssignment(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("asg-1");
    });

    expect(queryClient.getQueryState(previewKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(templatesKey)?.isInvalidated).toBe(true);
  });
});

describe("useBatchAssignmentPreview (api#63 G)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.previewBatchAssignments.mockResolvedValue(emptyPreview);
  });

  const base: BatchTemplateAssignmentPayload = {
    templateId: "tpl-v2",
    employeeIds: ["emp-1", "emp-2", "emp-1"],
    effectiveFrom: "2026-09-01",
    closePreviousAssignment: true,
    reason: "",
  };

  it("pide la vista previa tras la espera, con ids únicos y sin el motivo", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBatchAssignmentPreview(base), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.previewBatchAssignments).toHaveBeenCalledTimes(1);
    expect(mockApi.previewBatchAssignments).toHaveBeenCalledWith({
      templateId: "tpl-v2",
      employeeIds: ["emp-1", "emp-2"],
      effectiveFrom: "2026-09-01",
      effectiveTo: null,
      closePreviousAssignment: true,
    });
  });

  it("escribir el motivo no vuelve a pedirla; marcar la casilla sí", async () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      (payload: BatchTemplateAssignmentPayload) => useBatchAssignmentPreview(payload),
      { wrapper, initialProps: base },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ ...base, reason: "Cambio de versión" });
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mockApi.previewBatchAssignments).toHaveBeenCalledTimes(1);

    rerender({ ...base, closePreviousAssignment: false });
    await waitFor(() => expect(mockApi.previewBatchAssignments).toHaveBeenCalledTimes(2));
    expect(mockApi.previewBatchAssignments).toHaveBeenLastCalledWith(
      expect.objectContaining({ closePreviousAssignment: false }),
    );
  });

  it.each([
    ["sin operadores", { employeeIds: [] }],
    ["más de 100 operadores", { employeeIds: Array.from({ length: 101 }, (_, i) => `emp-${i}`) }],
    ["fecha incompleta", { effectiveFrom: "2026-09" }],
    ["«hasta» antes de «desde»", { effectiveTo: "2026-08-31" }],
    ["sin plantilla", { templateId: "" }],
  ])("no la pide %s", async (_label, overrides) => {
    const { wrapper } = createWrapper();
    renderHook(() => useBatchAssignmentPreview({ ...base, ...overrides }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mockApi.previewBatchAssignments).not.toHaveBeenCalled();
  });

  it("no la pide con el sheet cerrado (enabled = false)", async () => {
    const { wrapper } = createWrapper();
    renderHook(() => useBatchAssignmentPreview(base, { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mockApi.previewBatchAssignments).not.toHaveBeenCalled();
  });
});
