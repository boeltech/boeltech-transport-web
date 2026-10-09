/**
 * Smoke — Datos para Carta Porte por viaje (pedido cp31-autotransporte-por-viaje, F3b).
 * Mock de API; no requiere backend ni PAC.
 *
 * Criterios del PRD:
 * - 2: placa editada en el catálogo → la tarjeta conserva la congelada con «Distinto en catálogo».
 * - 3: contador y despachador no ven «Refrescar desde el catálogo» y sí la nota para pedirlo.
 * - 4: el panel abre con Unidad marcada, Operador deshabilitado «Sin cambios…» y solo el renglón Placa.
 * - 6: refresco válido → toast con folio, panel cerrado, placa nueva, fuente y motivo, aviso de factura.
 * - 7: «Sustituir factura» lleva al detalle de la factura.
 * - 8: catálogo de la unidad inválido → bloque deshabilitado con la lista y se refresca solo el operador.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import type { UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions/domain";
import type { TripFleetSnapshotView } from "@features/trips/domain";
import { TripDetailOperationTab } from "@features/trips/presentation/components/trip-operation";
import { tripDetailCopy } from "@features/trips/presentation/copy";
import {
  fleetSnapshotTripFixture,
  fleetSnapshotViewFixture,
} from "@features/trips/test/tripFleetSnapshotFixture";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { grantPermissions } from "@/test/mocks/permissions";
import { mockToast } from "@/test/mocks/toast";

const cardCopy = tripDetailCopy.fleetSnapshot.card;
const sheetCopy = tripDetailCopy.fleetSnapshot.sheet;
const toastCopy = tripDetailCopy.fleetSnapshot.toast;

const { mockGet, mockRefresh } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@features/trips/infrastructure/tripFleetSnapshotApi", () => ({
  tripFleetSnapshotApi: { get: mockGet, refresh: mockRefresh },
}));

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));

vi.mock("@features/catalogs/application", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/catalogs/application")>()),
  useCatalogOptions: () => ({ data: [] }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", role: "manager", email: "gerente@test.com" },
    isAuthenticated: true,
  }),
}));

vi.mock("@features/drivers/application", () => ({
  useDrivers: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@features/employees", () => ({
  useEmployees: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@features/vehicles/application", () => ({
  useAssignableVehicles: () => ({ data: [], isLoading: false }),
  useVehicle: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [], meta: undefined }, isLoading: false }),
}));

vi.mock(
  "@features/trips/presentation/components/trip-operation/TripScheduleInlineEditor",
  () => ({ TripScheduleInlineEditor: () => null }),
);

const REASON = "La placa se capturó como ABC1234; la correcta es ABC1243 según la tarjeta.";
const CP_INVOICE = { id: "inv-1", serie: "A", folio: 15, stampedAt: "2026-10-02T10:00:00.000Z" };

function grantRole(role: UserRole) {
  const permissions = getPermissionsForRole(role);
  grantPermissions((module, action) => checkPermission(role, permissions, module, action).allowed, {
    role,
  });
}

function InvoiceDetailStub() {
  const { id } = useParams();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return (
    <div data-testid="invoice-detail-stub">
      Factura {id} · desde {from}
    </div>
  );
}

function renderOperationTab({ canSubstituteInvoice = false } = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/trips/trip-1"]}>
        <Routes>
          <Route
            path="/trips/:id"
            element={
              <TripDetailOperationTab
                trip={fleetSnapshotTripFixture()}
                canEditStructural={false}
                showMileage={false}
                canSubstituteInvoice={canSubstituteInvoice}
              />
            }
          />
          <Route path="/invoices/:id" element={<InvoiceDetailStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function refreshedView(): TripFleetSnapshotView {
  const base = fleetSnapshotViewFixture();
  return fleetSnapshotViewFixture({
    snapshot: {
      ...base.snapshot!,
      vehicle: {
        ...base.snapshot!.vehicle,
        licensePlate: "ABC1243",
        source: "master_refresh",
        snapshotAt: "2026-10-08T16:00:00.000Z",
      },
      updatedAt: "2026-10-08T16:00:00.000Z",
    },
    diff: { vehicle: [], driver: [] },
    warnings: { vehicle: [], driver: [] },
    cpInvoice: CP_INVOICE,
    cpInvoiceOutdated: true,
    lastRefresh: {
      vehicle: { at: "2026-10-08T16:00:00.000Z", byName: "Gerardo Méndez", reason: REASON },
      driver: null,
    },
    refresh: {
      allowed: false,
      reasonCode: "FLEET_SNAPSHOT_NO_CHANGES",
      vehicle: { allowed: false, reasonCode: "FLEET_SNAPSHOT_NO_CHANGES" },
      driver: { allowed: false, reasonCode: "FLEET_SNAPSHOT_NO_CHANGES" },
    },
  });
}

describe("smoke: datos para Carta Porte por viaje", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRefresh.mockReset();
    mockToast.toast.mockClear();
    grantRole("manager");
  });

  it("gerente: diferencia en la tarjeta, refresco de la unidad y salto a la factura (criterios 2, 4, 6 y 7)", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(fleetSnapshotViewFixture({ cpInvoice: CP_INVOICE }));
    mockRefresh.mockResolvedValue({
      fleetSnapshot: refreshedView().snapshot,
      refreshedBlocks: ["vehicle"],
      changedFields: ["license_plate"],
      requiresFiscalAttention: true,
      auditLogId: "audit-1",
      message: "ok",
    });
    renderOperationTab({ canSubstituteInvoice: true });

    // Criterio 2
    const card = await screen.findByTestId("trip-fleet-snapshot-card");
    expect(await within(card).findByText("ABC1234")).toBeInTheDocument();
    const plateLabel = within(card).getByText(cardCopy.label.plate);
    expect(within(plateLabel).getByText(cardCopy.diffBadge)).toBeInTheDocument();
    expect(within(card).getByText(cardCopy.diffNote)).toBeInTheDocument();
    expect(within(card).queryByText(cardCopy.outdated.title("A-15"))).not.toBeInTheDocument();

    // Criterio 4
    await user.click(within(card).getByRole("button", { name: cardCopy.action.refresh }));
    const dialog = await screen.findByRole("dialog", { name: sheetCopy.title });
    const vehicleBox = await within(dialog).findByRole("checkbox", { name: /Unidad \(U-12/ });
    expect(vehicleBox).toBeChecked();
    const driverBox = within(dialog).getByRole("checkbox", { name: /Operador \(Ana López\)/ });
    expect(driverBox).toBeDisabled();
    expect(within(dialog).getByText(sheetCopy.blockNoChanges)).toBeInTheDocument();
    const table = within(dialog).getByRole("table", { name: cardCopy.block.vehicle });
    const bodyRows = within(table).getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(1);
    expect(within(bodyRows[0]!).getByText(cardCopy.label.plate)).toBeInTheDocument();
    expect(within(bodyRows[0]!).getByText("ABC1234")).toBeInTheDocument();
    expect(within(bodyRows[0]!).getByText("ABC1243")).toBeInTheDocument();

    // Criterio 6
    mockGet.mockResolvedValue(refreshedView());
    await user.type(
      within(dialog).getByRole("textbox", { name: new RegExp(sheetCopy.reason.label) }),
      REASON,
    );
    await user.click(within(dialog).getByRole("button", { name: sheetCopy.submit }));

    await waitFor(() =>
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: "success",
        title: toastCopy.successTitle,
        description: toastCopy.successWithInvoice("A-15"),
      }),
    );
    expect(mockRefresh).toHaveBeenCalledWith(
      "trip-1",
      expect.objectContaining({ blocks: { vehicle: true, driver: false }, reason: REASON }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: sheetCopy.title })).not.toBeInTheDocument(),
    );
    expect(await within(card).findByText("ABC1243")).toBeInTheDocument();
    expect(within(card).getByText(new RegExp(`^${cardCopy.source.master_refresh} · `))).toBeInTheDocument();
    expect(within(card).getByText(cardCopy.lastRefresh("Gerardo Méndez", REASON))).toBeInTheDocument();
    expect(within(card).getByText(cardCopy.outdated.title("A-15"))).toBeInTheDocument();

    // Criterio 7
    await user.click(within(card).getByRole("link", { name: cardCopy.outdated.cta }));
    expect(await screen.findByTestId("invoice-detail-stub")).toHaveTextContent(
      "Factura inv-1 · desde /trips/trip-1",
    );
  });

  it.each<UserRole>(["accountant", "dispatcher"])(
    "%s ve la diferencia sin poder refrescar (criterio 3)",
    async (role) => {
      grantRole(role);
      mockGet.mockResolvedValue(fleetSnapshotViewFixture());
      renderOperationTab();

      const card = await screen.findByTestId("trip-fleet-snapshot-card");
      expect(await within(card).findByText(cardCopy.diffBadge)).toBeInTheDocument();
      expect(within(card).getByText(cardCopy.diffNoPermission)).toBeInTheDocument();
      expect(
        within(card).queryByRole("button", { name: cardCopy.action.refresh }),
      ).not.toBeInTheDocument();
    },
  );

  it("catálogo de la unidad inválido: se refresca solo el operador (criterio 8)", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        diff: {
          vehicle: [{ field: "license_plate", snapshot: "ABC1234", master: "ABC1243" }],
          driver: [{ field: "driver_rfc", snapshot: "LOAA800101AB1", master: "LOAA800101AB2" }],
        },
        masterValidation: {
          vehicle: [
            {
              code: "REQUIRED",
              path: "insurance_policy",
              message: "Falta la póliza de responsabilidad civil.",
            },
            {
              code: "REQUIRED",
              path: "sct_permit_number",
              message: "Falta el número de permiso SCT.",
            },
          ],
          driver: [],
        },
        refresh: {
          allowed: true,
          reasonCode: null,
          vehicle: { allowed: false, reasonCode: "FLEET_MASTER_NOT_CP31_VALID" },
          driver: { allowed: true, reasonCode: null },
        },
      }),
    );
    mockRefresh.mockResolvedValue({
      fleetSnapshot: fleetSnapshotViewFixture().snapshot,
      refreshedBlocks: ["driver"],
      changedFields: ["driver_rfc"],
      requiresFiscalAttention: false,
      auditLogId: "audit-2",
      message: "ok",
    });
    renderOperationTab({ canSubstituteInvoice: true });

    const card = await screen.findByTestId("trip-fleet-snapshot-card");
    await user.click(await within(card).findByRole("button", { name: cardCopy.action.refresh }));
    const dialog = await screen.findByRole("dialog", { name: sheetCopy.title });

    const vehicleBox = await within(dialog).findByRole("checkbox", { name: /Unidad \(U-12/ });
    expect(vehicleBox).toBeDisabled();
    expect(vehicleBox).not.toBeChecked();
    expect(within(dialog).getByText(sheetCopy.blockInvalid)).toBeInTheDocument();
    const invalid = within(dialog).getByTestId("fleet-refresh-invalid-vehicle");
    expect(within(invalid).getByText("Falta la póliza de responsabilidad civil.")).toBeInTheDocument();
    expect(within(invalid).getByText("Falta el número de permiso SCT.")).toBeInTheDocument();
    expect(within(invalid).getByRole("link", { name: sheetCopy.invalid.fixVehicle })).toHaveAttribute(
      "href",
      "/vehicles/veh-1",
    );

    const driverBox = within(dialog).getByRole("checkbox", { name: /Operador \(Ana López\)/ });
    expect(driverBox).toBeChecked();
    await user.type(
      within(dialog).getByRole("textbox", { name: new RegExp(sheetCopy.reason.label) }),
      "El RFC del operador se capturó con un dígito de más.",
    );
    await user.click(within(dialog).getByRole("button", { name: sheetCopy.submit }));

    await waitFor(() =>
      expect(mockRefresh).toHaveBeenCalledWith(
        "trip-1",
        expect.objectContaining({
          blocks: { vehicle: false, driver: true },
          expected: expect.objectContaining({
            masterFingerprint: { vehicle: "fp-veh-1", driver: "fp-drv-1" },
          }),
        }),
      ),
    );
  });
});
