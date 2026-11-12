import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationQueryKeys } from "../compensationQueryKeys";
import {
  useActivateCompensationTemplate,
  useDeactivateCompensationTemplate,
  useDeleteCompensationTemplate,
  useUpdateCompensationTemplate,
} from "./useTemplates";

const SETTLEMENTS_PREVIEW_KEY = ["settlements", "preview"] as const;
const SETTLEMENTS_CUT_PREVIEW_KEY = ["settlements", "cut-preview"] as const;
const SETTLEMENTS_WORKBENCH_KEY = ["settlements", "workbench"] as const;
const SETTLEMENTS_OPERATORS_KEY = ["settlements", "operators"] as const;

const { mockUpdateTemplate, mockDeleteTemplate, mockActivateTemplate, mockDeactivateTemplate } =
  vi.hoisted(() => ({
    mockUpdateTemplate: vi.fn(),
    mockDeleteTemplate: vi.fn(),
    mockActivateTemplate: vi.fn(),
    mockDeactivateTemplate: vi.fn(),
  }));

vi.mock("../../infrastructure/compensationApi", () => ({
  compensationApi: {
    updateTemplate: mockUpdateTemplate,
    deleteTemplate: mockDeleteTemplate,
    activateTemplate: mockActivateTemplate,
    deactivateTemplate: mockDeactivateTemplate,
  },
}));

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateCompensationTemplate(), { wrapper });
  return { result, invalidateSpy };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function invalidatedKeys(spy: ReturnType<typeof setup>["invalidateSpy"]) {
  return spy.mock.calls.map(([filters]) => filters?.queryKey);
}

const activeTemplate = {
  id: "tpl-v1",
  familyId: "tpl-v1",
} as CompensationTemplate;

function seedSettlementsCaches(queryClient: QueryClient) {
  queryClient.setQueryData(SETTLEMENTS_OPERATORS_KEY, { data: [] });
  queryClient.setQueryData(SETTLEMENTS_PREVIEW_KEY, { data: [] });
  queryClient.setQueryData(SETTLEMENTS_CUT_PREVIEW_KEY, { data: [] });
  queryClient.setQueryData(SETTLEMENTS_WORKBENCH_KEY, { data: [] });
}

describe("useUpdateCompensationTemplate — 409 TEMPLATE_CONFIG_LOCKED (W5)", () => {
  beforeEach(() => {
    mockUpdateTemplate.mockReset();
  });

  it("refresca la plantilla, su lista y sus versiones al recibir el 409", async () => {
    mockUpdateTemplate.mockRejectedValue(
      new ApiError("Bloqueada", 409, "TEMPLATE_CONFIG_LOCKED", { reason: "superseded" }),
    );
    const { result, invalidateSpy } = setup();

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: "tpl-v2", name: "Cambio" }),
      ).rejects.toBeInstanceOf(ApiError);
    });

    const keys = invalidatedKeys(invalidateSpy);
    expect(keys).toContainEqual(compensationQueryKeys.templates());
    expect(keys).toContainEqual(compensationQueryKeys.templateDetail("tpl-v2"));
    expect(keys).toContainEqual(compensationQueryKeys.templateVersions("tpl-v2"));
  });

  it("no refresca ante otros errores", async () => {
    mockUpdateTemplate.mockRejectedValue(
      new ApiError("Inválido", 422, "VALIDATION_ERROR"),
    );
    const { result, invalidateSpy } = setup();

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: "tpl-v2", name: "Cambio" }),
      ).rejects.toBeInstanceOf(ApiError);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useDeleteCompensationTemplate — versiones de la borrada (F2b §3.2)", () => {
  beforeEach(() => {
    mockDeleteTemplate.mockReset();
  });

  it("quita del caché las versiones de la borrada antes de invalidar la lista", async () => {
    mockDeleteTemplate.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(compensationQueryKeys.templateVersions("tpl-draft"), []);
    queryClient.setQueryData(compensationQueryKeys.templateVersions("tpl-v1"), []);
    const calls: string[] = [];
    const removeSpy = vi
      .spyOn(queryClient, "removeQueries")
      .mockImplementation(function (this: QueryClient, ...args) {
        calls.push("remove");
        return QueryClient.prototype.removeQueries.apply(this, args);
      });
    vi.spyOn(queryClient, "invalidateQueries").mockImplementation(async () => {
      calls.push("invalidate");
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteCompensationTemplate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("tpl-draft");
    });

    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: compensationQueryKeys.templateVersions("tpl-draft"),
      exact: true,
    });
    expect(calls).toEqual(["remove", "invalidate"]);
    expect(
      queryClient.getQueryData(compensationQueryKeys.templateVersions("tpl-draft")),
    ).toBeUndefined();
    expect(queryClient.getQueryData(compensationQueryKeys.templateVersions("tpl-v1"))).toEqual(
      [],
    );
  });
});

describe("useActivate/DeactivateCompensationTemplate — settlements readiness", () => {
  beforeEach(() => {
    mockActivateTemplate.mockReset();
    mockDeactivateTemplate.mockReset();
  });

  it("activar invalida Operadores, preview, cut-preview y workbench", async () => {
    mockActivateTemplate.mockResolvedValue(activeTemplate);
    const { queryClient, wrapper } = createWrapper();
    seedSettlementsCaches(queryClient);
    const { result } = renderHook(() => useActivateCompensationTemplate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "tpl-v1" });
    });

    expect(queryClient.getQueryState(SETTLEMENTS_OPERATORS_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(SETTLEMENTS_PREVIEW_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(SETTLEMENTS_CUT_PREVIEW_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(SETTLEMENTS_WORKBENCH_KEY)?.isInvalidated).toBe(true);
  });

  it("desactivar invalida Operadores, preview, cut-preview y workbench", async () => {
    mockDeactivateTemplate.mockResolvedValue(activeTemplate);
    const { queryClient, wrapper } = createWrapper();
    seedSettlementsCaches(queryClient);
    const { result } = renderHook(() => useDeactivateCompensationTemplate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("tpl-v1");
    });

    expect(queryClient.getQueryState(SETTLEMENTS_OPERATORS_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(SETTLEMENTS_PREVIEW_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(SETTLEMENTS_CUT_PREVIEW_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(SETTLEMENTS_WORKBENCH_KEY)?.isInvalidated).toBe(true);
  });
});
