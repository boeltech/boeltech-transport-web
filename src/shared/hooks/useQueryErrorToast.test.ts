import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQueryErrorToast } from "./useQueryErrorToast";

const toastMock = vi.fn();

vi.mock("./useToast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@shared/api/interceptors/error-handler", () => ({
  getErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

describe("useQueryErrorToast", () => {
  beforeEach(() => {
    toastMock.mockClear();
  });

  it("toasts once for the same error fingerprint", () => {
    const error = new Error("fallo de red");
    const { rerender } = renderHook(
      (props: { isError: boolean; error: unknown }) =>
        useQueryErrorToast({
          isError: props.isError,
          error: props.error,
          title: "Error al cargar",
        }),
      { initialProps: { isError: true, error } },
    );

    expect(toastMock).toHaveBeenCalledTimes(1);

    rerender({ isError: true, error });
    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("toasts again after error clears and a new error arrives", () => {
    const first = new Error("primero");
    const second = new Error("segundo");
    const { rerender } = renderHook(
      (props: { isError: boolean; error: unknown }) =>
        useQueryErrorToast({
          isError: props.isError,
          error: props.error,
          title: "Error al cargar",
        }),
      { initialProps: { isError: true, error: first } },
    );

    expect(toastMock).toHaveBeenCalledTimes(1);

    rerender({ isError: false, error: null });
    rerender({ isError: true, error: second });

    expect(toastMock).toHaveBeenCalledTimes(2);
    expect(toastMock.mock.calls[1]?.[0]).toMatchObject({
      title: "Error al cargar",
      description: "segundo",
    });
  });

  it("does not toast when enabled is false", () => {
    renderHook(() =>
      useQueryErrorToast({
        isError: true,
        error: new Error("oculto"),
        title: "Error",
        enabled: false,
      }),
    );

    expect(toastMock).not.toHaveBeenCalled();
  });
});
