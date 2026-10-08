import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { compensationQueryKeys } from "../compensationQueryKeys";
import { useUpdateCompensationTemplate } from "./useTemplates";

const { mockUpdateTemplate } = vi.hoisted(() => ({
  mockUpdateTemplate: vi.fn(),
}));

vi.mock("../../infrastructure/compensationApi", () => ({
  compensationApi: { updateTemplate: mockUpdateTemplate },
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
