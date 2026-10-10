import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { compensationQueryKeys } from "../compensationQueryKeys";
import { useDeleteCompensationTemplate, useUpdateCompensationTemplate } from "./useTemplates";

const { mockUpdateTemplate, mockDeleteTemplate } = vi.hoisted(() => ({
  mockUpdateTemplate: vi.fn(),
  mockDeleteTemplate: vi.fn(),
}));

vi.mock("../../infrastructure/compensationApi", () => ({
  compensationApi: { updateTemplate: mockUpdateTemplate, deleteTemplate: mockDeleteTemplate },
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

function invalidatedKeys(spy: ReturnType<typeof setup>["invalidateSpy"]) {
  return spy.mock.calls.map(([filters]) => filters?.queryKey);
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
