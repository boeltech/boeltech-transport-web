/**
 * Smoke — Orden de viaje (pedido 2026-10-12-orden-de-viaje, F3).
 * Mock de API; no requiere backend.
 *
 * Criterios PRD E1–E8 (observables en Operación):
 * - Card visible con permiso + enabled
 * - Generar → emisión + descarga PDF
 * - Descargar = reimpresión (misma versión)
 * - Desactualizada → Regenerar vN+1
 * - Sin permiso / portal → card oculta
 * - Separación copy vs «Datos para Carta Porte»
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import type { UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions/domain";
import type { TripOrderStatus } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { TripDetailOperationTab } from "@features/trips/presentation/components/trip-operation";
import { tripDetailCopy } from "@features/trips/presentation/copy";
import { fleetSnapshotTripFixture } from "@features/trips/test/tripFleetSnapshotFixture";
import {
  tripOrderEmissionFixture,
  tripOrderStatusFixture,
} from "@features/trips/test/tripOrderFixture";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { grantPermissions } from "@/test/mocks/permissions";
import { mockToast } from "@/test/mocks/toast";

const orderCopy = tripDetailCopy.tripOrder.card;
const orderToast = tripDetailCopy.tripOrder.toast;
const fleetCopy = tripDetailCopy.fleetSnapshot.card;

const { mockGetOrder, mockGenerate, mockDownload, mockGetFleet } = vi.hoisted(() => ({
  mockGetOrder: vi.fn(),
  mockGenerate: vi.fn(),
  mockDownload: vi.fn(),
  mockGetFleet: vi.fn(),
}));

vi.mock("@features/trips/infrastructure/tripOrderApi", () => ({
  tripOrderApi: {
    getStatus: mockGetOrder,
    generate: mockGenerate,
    downloadFile: mockDownload,
  },
}));

vi.mock("@features/trips/infrastructure/tripFleetSnapshotApi", () => ({
  tripFleetSnapshotApi: { get: mockGetFleet, refresh: vi.fn() },
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
    user: { id: "user-1", role: "dispatcher", email: "despacho@test.com" },
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

function grantRole(role: UserRole) {
  const permissions = getPermissionsForRole(role);
  grantPermissions((module, action) => checkPermission(role, permissions, module, action).allowed, {
    role,
  });
}

function renderOperationTab({
  isClientPortalView = false,
  isDriverPortalView = false,
  status = TripStatus.SCHEDULED,
}: {
  isClientPortalView?: boolean;
  isDriverPortalView?: boolean;
  status?: (typeof TripStatus)[keyof typeof TripStatus];
} = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/trips/trip-1"]}>
        <Routes>
          <Route
            path="/trips/:id"
            element={
              <TripDetailOperationTab
                trip={fleetSnapshotTripFixture({ status })}
                canEditStructural={false}
                showMileage={false}
                isClientPortalView={isClientPortalView}
                isDriverPortalView={isDriverPortalView}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Fleet oculto por defecto para no mezclar asserts de Orden. */
function hideFleetSnapshot() {
  mockGetFleet.mockResolvedValue({
    tripId: "trip-1",
    readEnabled: false,
    snapshot: null,
    master: null,
    diff: { vehicle: [], driver: [] },
    warnings: { vehicle: [], driver: [] },
    masterValidation: { vehicle: [], driver: [] },
    cpInvoice: null,
    cpInvoiceOutdated: false,
    lastRefresh: null,
    refresh: {
      allowed: false,
      reasonCode: null,
      vehicle: { allowed: false, reasonCode: null },
      driver: { allowed: false, reasonCode: null },
    },
  });
}

describe("smoke: orden de viaje", () => {
  beforeEach(() => {
    mockGetOrder.mockReset();
    mockGenerate.mockReset();
    mockDownload.mockReset();
    mockGetFleet.mockReset();
    mockToast.toast.mockClear();
    hideFleetSnapshot();
    grantRole("dispatcher");
  });

  it("Generar → emisión v1 + descarga; Descargar reimprime misma versión (E1, E2)", async () => {
    const user = userEvent.setup();
    let status: TripOrderStatus = tripOrderStatusFixture();
    mockGetOrder.mockImplementation(() => Promise.resolve(status));
    mockGenerate.mockImplementation(async () => {
      const emission = tripOrderEmissionFixture({ version: 1 });
      status = tripOrderStatusFixture({
        eligibility: {
          canGenerate: false,
          canRegenerate: false,
          canDownload: true,
          reasonCode: "TRIP_ORDER_NOT_OUTDATED",
        },
        currentEmission: emission,
        emissionCount: 1,
      });
      return { emission, message: "ok" };
    });
    mockDownload.mockResolvedValue(undefined);

    renderOperationTab();

    const card = await screen.findByTestId("trip-order-card");
    expect(await within(card).findByText(orderCopy.empty.title)).toBeInTheDocument();
    expect(within(card).getByText(orderCopy.title)).toBeInTheDocument();
    expect(within(card).getByText(orderCopy.description)).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: orderCopy.action.generate }));

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledWith("trip-1"));
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith(
        "trip-1",
        "orden-viaje-V-2026-0042-v1.pdf",
      ),
    );
    await waitFor(() =>
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "success",
          title: orderToast.ready,
          description: orderToast.versionGenerated(1),
        }),
      ),
    );

    expect(await within(card).findByText(orderCopy.badge.current)).toBeInTheDocument();
    expect(within(card).getByText(orderCopy.label.version(1))).toBeInTheDocument();

    mockDownload.mockClear();
    await user.click(within(card).getByRole("button", { name: orderCopy.action.download }));
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith(
        "trip-1",
        "orden-viaje-V-2026-0042-v1.pdf",
      ),
    );
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(within(card).getByText(orderCopy.label.version(1))).toBeInTheDocument();
    expect(
      within(card).queryByRole("button", { name: orderCopy.action.regenerate }),
    ).not.toBeInTheDocument();
  });

  it("Desactualizada → Regenerar crea vN+1 (E3)", async () => {
    const user = userEvent.setup();
    let status: TripOrderStatus = tripOrderStatusFixture({
      eligibility: {
        canGenerate: false,
        canRegenerate: true,
        canDownload: true,
        reasonCode: null,
      },
      currentEmission: tripOrderEmissionFixture({ version: 2, outdated: true }),
      emissionCount: 2,
    });
    mockGetOrder.mockImplementation(() => Promise.resolve(status));
    mockGenerate.mockImplementation(async () => {
      const emission = tripOrderEmissionFixture({
        version: 3,
        outdated: false,
        filename: "orden-viaje-V-2026-0042-v3.pdf",
      });
      status = tripOrderStatusFixture({
        eligibility: {
          canGenerate: false,
          canRegenerate: false,
          canDownload: true,
          reasonCode: "TRIP_ORDER_NOT_OUTDATED",
        },
        currentEmission: emission,
        emissionCount: 3,
      });
      return { emission, message: "ok" };
    });
    mockDownload.mockResolvedValue(undefined);

    renderOperationTab({ status: TripStatus.IN_PROGRESS });

    const card = await screen.findByTestId("trip-order-card");
    expect(await within(card).findByText(orderCopy.badge.outdated)).toBeInTheDocument();
    expect(within(card).getByText(orderCopy.outdatedHint)).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: orderCopy.action.regenerate }));
    expect(
      await screen.findByText(orderCopy.confirmRegenerate.description(3)),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: orderCopy.confirmRegenerate.confirm }),
    );

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith(
        "trip-1",
        "orden-viaje-V-2026-0042-v3.pdf",
      ),
    );
    expect(await within(card).findByText(orderCopy.badge.current)).toBeInTheDocument();
    expect(within(card).getByText(orderCopy.label.version(3))).toBeInTheDocument();
  });

  it("portal cliente/conductor y sin permiso ocultan la card (E8)", async () => {
    mockGetOrder.mockResolvedValue(tripOrderStatusFixture());

    const client = renderOperationTab({ isClientPortalView: true });
    await waitFor(() => expect(mockGetOrder).not.toHaveBeenCalled());
    expect(client.container.querySelector('[data-testid="trip-order-card"]')).toBeNull();
    client.unmount();

    mockGetOrder.mockClear();
    const driver = renderOperationTab({ isDriverPortalView: true });
    await waitFor(() => expect(mockGetOrder).not.toHaveBeenCalled());
    expect(driver.container.querySelector('[data-testid="trip-order-card"]')).toBeNull();
    driver.unmount();

    mockGetOrder.mockClear();
    grantRole("driver");
    const noPerm = renderOperationTab();
    expect(noPerm.container.querySelector('[data-testid="trip-order-card"]')).toBeNull();
    expect(mockGetOrder).not.toHaveBeenCalled();
  });

  it("títulos distintos: Orden de viaje vs Datos para Carta Porte (E7)", async () => {
    mockGetOrder.mockResolvedValue(
      tripOrderStatusFixture({
        eligibility: {
          canGenerate: false,
          canRegenerate: false,
          canDownload: true,
          reasonCode: "TRIP_ORDER_NOT_OUTDATED",
        },
        currentEmission: tripOrderEmissionFixture(),
        emissionCount: 1,
      }),
    );
    const { fleetSnapshotViewFixture } = await import(
      "@features/trips/test/tripFleetSnapshotFixture"
    );
    mockGetFleet.mockResolvedValue(fleetSnapshotViewFixture());

    renderOperationTab({ status: TripStatus.IN_PROGRESS });

    const orderCard = await screen.findByTestId("trip-order-card");
    const fleetCard = await screen.findByTestId("trip-fleet-snapshot-card");

    expect(within(orderCard).getByText(orderCopy.title)).toHaveTextContent("Orden de viaje");
    expect(within(fleetCard).getByText(fleetCopy.title)).toHaveTextContent(
      "Datos para Carta Porte",
    );
    expect(orderCopy.title).not.toBe(fleetCopy.title);
    expect(within(orderCard).queryByText(/Timbrar/i)).not.toBeInTheDocument();
  });
});
