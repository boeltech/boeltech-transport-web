import { vi } from "vitest";
import type { UseToastReturn } from "@shared/hooks";

/** Un mismo objeto por archivo de test: `mockToast.toast` es el `toast()` del hook. */
export const mockToast = {
  toast: vi.fn<UseToastReturn["toast"]>(() => "toast-id"),
  dismiss: vi.fn<UseToastReturn["dismiss"]>(),
  promise: vi.fn<(promise: Promise<unknown>, messages: unknown) => void>(),
  success: vi.fn<UseToastReturn["success"]>(() => "toast-id"),
  error: vi.fn<UseToastReturn["error"]>(() => "toast-id"),
  warning: vi.fn<UseToastReturn["warning"]>(() => "toast-id"),
  info: vi.fn<UseToastReturn["info"]>(() => "toast-id"),
};

const toastApi: UseToastReturn = {
  ...mockToast,
  promise: (promise, messages) => {
    mockToast.promise(promise, messages);
    return promise;
  },
};

/**
 * Solo `useToast`. Si el componente usa otros hooks de `@shared/hooks`,
 * combina con `importOriginal` (carga el barrel real):
 *
 * vi.mock("@shared/hooks", async () =>
 *   (await import("@/test/mocks/toast")).toastHooksMock());
 */
export function toastHooksMock(): Pick<typeof import("@shared/hooks"), "useToast"> {
  return { useToast: () => toastApi };
}
