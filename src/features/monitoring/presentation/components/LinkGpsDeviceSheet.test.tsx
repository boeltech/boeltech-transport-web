import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { monitoringCopy } from "../copy/monitoringCopy";
import { LinkGpsDeviceSheet } from "./LinkGpsDeviceSheet";

const mockLink = vi.fn();
const mockToast = vi.fn();

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    linkGpsDevice: (...args: unknown[]) => mockLink(...args),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  useToast: () => ({ toast: mockToast }),
}));

function renderSheet() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <LinkGpsDeviceSheet
        vehicleId="v-1"
        vehicleLabel="T-001"
        open
        onOpenChange={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("LinkGpsDeviceSheet — F4.3 copy", () => {
  beforeEach(() => {
    mockLink.mockReset();
    mockToast.mockReset();
  });

  it("success toast mentions auto-create / first signal", async () => {
    mockLink.mockResolvedValue({
      data: {
        id: "link-1",
        vehicleId: "v-1",
        imei: "865124074366362",
        traccarDeviceId: "42",
        linkedAt: "2026-11-13T12:00:00Z",
        linkedByName: null,
      },
      message: "ok",
    });
    const user = userEvent.setup();
    renderSheet();

    await user.type(
      screen.getByLabelText(/IMEI/i),
      "865124074366362",
    );
    await user.click(
      screen.getByRole("button", {
        name: monitoringCopy.linkSheet.submit,
      }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: monitoringCopy.linkSheet.success,
          description: monitoringCopy.linkSheet.successDescription,
          variant: "success",
        }),
      );
    });
  });

  it("keeps GPS_IMEI_NOT_IN_TRACCAR message when auto-create is off", async () => {
    mockLink.mockRejectedValue(
      new ApiError("missing", 422, "GPS_IMEI_NOT_IN_TRACCAR"),
    );
    const user = userEvent.setup();
    renderSheet();

    await user.type(
      screen.getByLabelText(/IMEI/i),
      "865124074366362",
    );
    await user.click(
      screen.getByRole("button", {
        name: monitoringCopy.linkSheet.submit,
      }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: monitoringCopy.linkSheet.errorNotInTraccar,
          variant: "error",
        }),
      );
    });
  });

  it("maps MODULE_NOT_ENTITLED to Contacta a Boeltech (no paywall)", async () => {
    mockLink.mockRejectedValue(
      new ApiError("forbidden", 403, "MODULE_NOT_ENTITLED"),
    );
    const user = userEvent.setup();
    renderSheet();

    await user.type(
      screen.getByLabelText(/IMEI/i),
      "865124074366362",
    );
    await user.click(
      screen.getByRole("button", {
        name: monitoringCopy.linkSheet.submit,
      }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: monitoringCopy.linkSheet.errorNotEntitled,
          variant: "error",
        }),
      );
    });
    expect(monitoringCopy.linkSheet.errorNotEntitled).toMatch(/Contacta a Boeltech/i);
    expect(monitoringCopy.linkSheet.errorNotEntitled).not.toMatch(
      /comprar|precio|upgrade/i,
    );
  });
});
