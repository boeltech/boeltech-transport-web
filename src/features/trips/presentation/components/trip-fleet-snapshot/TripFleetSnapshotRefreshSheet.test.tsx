import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  fleetSnapshotTripFixture,
  fleetSnapshotViewFixture,
} from "@features/trips/test/tripFleetSnapshotFixture";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { mockToast } from "@/test/mocks/toast";
import { renderWithProviders } from "@/test/renderWithProviders";
import { tripDetailCopy } from "../../copy";
import { TripFleetSnapshotRefreshSheet } from "./TripFleetSnapshotRefreshSheet";

const copy = tripDetailCopy.fleetSnapshot.sheet;
const toastCopy = tripDetailCopy.fleetSnapshot.toast;

const { mockGet, mockRefresh } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@features/trips/infrastructure/tripFleetSnapshotApi", () => ({
  tripFleetSnapshotApi: { get: mockGet, refresh: mockRefresh },
}));

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));

const labels = {
  configVehicularLabel: () => null,
  tipoPermisoLabel: () => null,
};

const VALID_REASON = "La placa se capturó como ABC1234; la correcta es ABC1243.";

function renderSheet(onOpenChange = vi.fn()) {
  renderWithProviders(
    <TripFleetSnapshotRefreshSheet
      trip={fleetSnapshotTripFixture()}
      labels={labels}
      open
      onOpenChange={onOpenChange}
    />,
  );
  return { onOpenChange };
}

async function waitForPreview() {
  return screen.findByRole("checkbox", { name: /Unidad \(U-12/ });
}

function reasonField() {
  return screen.getByRole("textbox", { name: new RegExp(copy.reason.label) });
}

function submitButton() {
  return screen.getByRole("button", { name: copy.submit });
}

describe("TripFleetSnapshotRefreshSheet", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRefresh.mockReset();
    mockToast.toast.mockClear();
    mockGet.mockResolvedValue(fleetSnapshotViewFixture());
  });

  it("marca solo los bloques refrescables y compara lo congelado con el catálogo", async () => {
    renderSheet();

    const vehicle = await waitForPreview();
    expect(vehicle).toBeChecked();
    const driver = screen.getByRole("checkbox", { name: /Operador \(Ana López\)/ });
    expect(driver).not.toBeChecked();
    expect(driver).toBeDisabled();
    expect(screen.getByText(copy.blockNoChanges)).toBeInTheDocument();

    const table = screen.getByRole("table", { name: "Unidad" });
    const plateRow = within(table).getByText("Placa").closest("tr")!;
    expect(within(plateRow).getByText("ABC1234")).toBeInTheDocument();
    expect(within(plateRow).getByText("ABC1243")).toBeInTheDocument();
    expect(within(table).queryByText("Año modelo")).not.toBeInTheDocument();

    expect(screen.getByText(copy.warnings.identity_field_changed)).toBeInTheDocument();
    expect(screen.getByText(copy.fiscal.bodyNoInvoice)).toBeInTheDocument();
  });

  it("«Mostrar también los datos sin cambios» agrega las filas iguales", async () => {
    renderSheet();
    await waitForPreview();

    await userEvent.click(screen.getByRole("switch", { name: copy.showUnchanged }));
    expect(
      within(screen.getByRole("table", { name: "Unidad" })).getByText("Año modelo"),
    ).toBeInTheDocument();
  });

  it("con factura timbrada avisa que hay que sustituirla", async () => {
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        cpInvoice: { id: "inv-1", serie: "A", folio: 15, stampedAt: "2026-10-02T10:00:00.000Z" },
      }),
    );
    renderSheet();
    await waitForPreview();

    expect(screen.getByText(copy.fiscal.bodyWithInvoice("A-15"))).toBeInTheDocument();
  });

  it("motivo corto: error en el campo y sin llamar al API", async () => {
    renderSheet();
    await waitForPreview();

    await userEvent.type(reasonField(), "corto");
    await userEvent.click(submitButton());

    expect(await screen.findAllByText(copy.reason.tooShort)).not.toHaveLength(0);
    expect(screen.getByText(copy.validationSummary)).toBeInTheDocument();
    expect(reasonField()).toHaveAttribute("aria-invalid", "true");
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("sin bloque elegido pide elegir unidad u operador", async () => {
    renderSheet();
    const vehicle = await waitForPreview();

    await userEvent.click(vehicle);
    await userEvent.type(reasonField(), VALID_REASON);
    await userEvent.click(submitButton());

    expect(await screen.findAllByText(copy.noBlockSelected)).not.toHaveLength(0);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("envía bloques, motivo y huellas; el aviso del toast sale del GET re-consultado", async () => {
    mockRefresh.mockResolvedValue({
      fleetSnapshot: fleetSnapshotViewFixture().snapshot,
      refreshedBlocks: ["vehicle"],
      changedFields: ["license_plate"],
      requiresFiscalAttention: false,
      auditLogId: "audit-1",
      message: "ok",
    });
    const { onOpenChange } = renderSheet();
    await waitForPreview();

    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        cpInvoice: { id: "inv-1", serie: "A", folio: 15, stampedAt: "2026-10-02T10:00:00.000Z" },
        cpInvoiceOutdated: true,
      }),
    );
    await userEvent.type(reasonField(), VALID_REASON);
    await userEvent.click(submitButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(mockRefresh).toHaveBeenCalledWith("trip-1", {
      blocks: { vehicle: true, driver: false },
      reason: VALID_REASON,
      expected: {
        snapshotUpdatedAt: "2026-10-01T14:00:00.000Z",
        masterFingerprint: { vehicle: "fp-veh-1", driver: "fp-drv-1" },
      },
    });
    expect(mockToast.toast).toHaveBeenCalledWith({
      variant: "success",
      title: toastCopy.successTitle,
      description: toastCopy.successWithInvoice("A-15"),
    });
  });

  it("sin factura con Carta Porte el toast avisa que la próxima factura usará los datos", async () => {
    mockRefresh.mockResolvedValue({
      fleetSnapshot: fleetSnapshotViewFixture().snapshot,
      refreshedBlocks: ["vehicle"],
      changedFields: ["license_plate"],
      requiresFiscalAttention: false,
      auditLogId: "audit-1",
      message: "ok",
    });
    const { onOpenChange } = renderSheet();
    await waitForPreview();

    await userEvent.type(reasonField(), VALID_REASON);
    await userEvent.click(submitButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(mockToast.toast).toHaveBeenCalledWith({
      variant: "success",
      title: toastCopy.successTitle,
      description: toastCopy.successNoInvoice,
    });
  });

  it.each(["FLEET_SNAPSHOT_STALE", "FLEET_MASTER_CHANGED"])(
    "409 %s: conserva el motivo y «Actualizar vista previa» recarga",
    async (code) => {
      mockRefresh.mockRejectedValue(new ApiError("Los datos cambiaron", 409, code));
      renderSheet();
      await waitForPreview();

      await userEvent.type(reasonField(), VALID_REASON);
      await userEvent.click(submitButton());

      const alert = await screen.findByTestId("fleet-refresh-stale");
      expect(within(alert).getByText(copy.error.stale.title)).toBeInTheDocument();
      expect(reasonField()).toHaveValue(VALID_REASON);
      expect(submitButton()).toBeDisabled();

      const callsBefore = mockGet.mock.calls.length;
      await userEvent.click(within(alert).getByRole("button", { name: copy.refreshPreview }));

      await waitFor(() =>
        expect(screen.queryByTestId("fleet-refresh-stale")).not.toBeInTheDocument(),
      );
      expect(mockGet.mock.calls.length).toBeGreaterThan(callsBefore);
      expect(reasonField()).toHaveValue(VALID_REASON);
      expect(submitButton()).toBeEnabled();
    },
  );

  it("409 sin cambios al enviar: muestra el error del API y recarga la comparación", async () => {
    mockRefresh.mockRejectedValue(
      new ApiError("El catálogo coincide con lo congelado.", 409, "FLEET_SNAPSHOT_NO_CHANGES"),
    );
    renderSheet();
    await waitForPreview();
    const callsBefore = mockGet.mock.calls.length;

    await userEvent.type(reasonField(), VALID_REASON);
    await userEvent.click(submitButton());

    expect(
      await screen.findByText("El catálogo coincide con lo congelado."),
    ).toBeInTheDocument();
    await waitFor(() => expect(mockGet.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(reasonField()).toHaveValue(VALID_REASON);
  });

  it("cambio de póliza y unidad dada de baja: avisos antes de refrescar", async () => {
    const base = fleetSnapshotViewFixture();
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        master: {
          ...base.master!,
          vehicle: {
            ...base.master!.vehicle,
            isActive: false,
            deactivatedAt: "2026-10-05T12:00:00.000Z",
            deactivationReasonCode: "error_captura",
          },
        },
        diff: {
          vehicle: [{ field: "insurance_expiry", snapshot: "2027-03-31", master: "2028-03-31" }],
          driver: [],
        },
        warnings: {
          vehicle: [
            { code: "insurance_or_permit_changed", fields: ["insurance_expiry"] },
            { code: "vehicle_deactivated_error_captura", fields: [] },
          ],
          driver: [],
        },
      }),
    );
    renderSheet();
    await waitForPreview();

    expect(screen.getByText(copy.warnings.title)).toBeInTheDocument();
    expect(screen.getByText(copy.warnings.insurance_or_permit_changed)).toBeInTheDocument();
    expect(screen.getByText(copy.warnings.vehicle_deactivated_error_captura)).toBeInTheDocument();
    expect(screen.getByText(/La unidad U-12 está dada de baja desde el/)).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("422 de catálogo inválido: recarga y muestra qué corregir con acceso al catálogo", async () => {
    mockRefresh.mockRejectedValue(
      new ApiError("Catálogo inválido", 422, "FLEET_MASTER_NOT_CP31_VALID"),
    );
    renderSheet();
    await waitForPreview();

    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        masterValidation: {
          vehicle: [
            { code: "REQUIRED", path: "insurance_policy", message: "Falta la póliza de responsabilidad civil." },
          ],
          driver: [],
        },
        refresh: {
          allowed: false,
          reasonCode: "FLEET_MASTER_NOT_CP31_VALID",
          vehicle: { allowed: false, reasonCode: "FLEET_MASTER_NOT_CP31_VALID" },
          driver: { allowed: false, reasonCode: "FLEET_SNAPSHOT_NO_CHANGES" },
        },
      }),
    );
    await userEvent.type(reasonField(), VALID_REASON);
    await userEvent.click(submitButton());

    const alert = await screen.findByTestId("fleet-refresh-invalid-vehicle");
    expect(within(alert).getByText("Falta la póliza de responsabilidad civil.")).toBeInTheDocument();
    expect(within(alert).getByRole("link", { name: copy.invalid.fixVehicle })).toHaveAttribute(
      "href",
      "/vehicles/veh-1",
    );
    expect(screen.getByRole("checkbox", { name: /Unidad \(U-12/ })).toBeDisabled();
    expect(screen.getByText(copy.blockInvalid)).toBeInTheDocument();
    expect(reasonField()).toHaveValue(VALID_REASON);
    expect(submitButton()).toBeDisabled();
  });

  it("403: aviso en el panel sin toast", async () => {
    mockRefresh.mockRejectedValue(new ApiError("Prohibido", 403, "FORBIDDEN"));
    renderSheet();
    await waitForPreview();

    await userEvent.type(reasonField(), VALID_REASON);
    await userEvent.click(submitButton());

    expect(await screen.findByText(copy.error.forbidden)).toBeInTheDocument();
    expect(mockToast.toast).not.toHaveBeenCalled();
  });

  it("si nada cambió lo dice y no deja enviar", async () => {
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        diff: { vehicle: [], driver: [] },
        warnings: { vehicle: [], driver: [] },
        refresh: {
          allowed: false,
          reasonCode: "FLEET_SNAPSHOT_NO_CHANGES",
          vehicle: { allowed: false, reasonCode: "FLEET_SNAPSHOT_NO_CHANGES" },
          driver: { allowed: false, reasonCode: "FLEET_SNAPSHOT_NO_CHANGES" },
        },
      }),
    );
    renderSheet();

    expect(await screen.findByText(copy.nothingToRefresh)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });
});
