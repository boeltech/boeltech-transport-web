import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions/domain";
import { TripStatus, TripOperationalOutcome } from "@features/trips/domain";
import {
  fleetSnapshotTripFixture,
  fleetSnapshotViewFixture,
} from "@features/trips/test/tripFleetSnapshotFixture";
import { grantPermissions } from "@/test/mocks/permissions";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { tripDetailCopy } from "../../copy";
import { TripFleetSnapshotCard } from "./TripFleetSnapshotCard";

const copy = tripDetailCopy.fleetSnapshot.card;

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("@features/trips/infrastructure/tripFleetSnapshotApi", () => ({
  tripFleetSnapshotApi: { get: mockGet, refresh: vi.fn() },
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
  useCatalogOptions: () => ({
    data: [
      { code: "C2", name: "Camión unitario de 2 ejes" },
      { code: "TPAF01", name: "Autotransporte federal de carga general" },
    ],
  }),
}));

function grantRole(role: UserRole) {
  const permissions = getPermissionsForRole(role);
  grantPermissions((module, action) => checkPermission(role, permissions, module, action).allowed, {
    role,
  });
}

function renderCard(
  trip = fleetSnapshotTripFixture(),
  { canSubstituteInvoice = false }: { canSubstituteInvoice?: boolean } = {},
) {
  return renderWithProviders(
    <TripFleetSnapshotCard trip={trip} canSubstituteInvoice={canSubstituteInvoice} />,
  );
}

describe("TripFleetSnapshotCard", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue(fleetSnapshotViewFixture());
    grantRole("manager");
  });

  it("muestra lo congelado, la insignia de diferencia y la nota (gerente con refresco)", async () => {
    renderCard();

    expect(await screen.findByText("ABC1234")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("trip-1");
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.diffBadge)).toBeInTheDocument();
    expect(screen.getByText(copy.diffNote)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.action.refresh })).toBeInTheDocument();
    expect(screen.queryByText(copy.diffNoPermission)).not.toBeInTheDocument();
    expect(screen.getByText("C2 · Camión unitario de 2 ejes")).toBeInTheDocument();
    expect(
      screen.getByText("TPAF01 · Autotransporte federal de carga general"),
    ).toBeInTheDocument();
    expect(screen.getByText("U-12")).toBeInTheDocument();
  });

  it.each<UserRole>(["dispatcher", "accountant"])(
    "%s ve la tarjeta y la diferencia, sin botón y con la nota de pedir a un gerente",
    async (role) => {
      grantRole(role);
      renderCard();

      expect(await screen.findByText(copy.diffBadge)).toBeInTheDocument();
      expect(screen.getByText(copy.diffNoPermission)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: copy.action.refresh }),
      ).not.toBeInTheDocument();
    },
  );

  it("el operador no ve la tarjeta ni consulta el API", () => {
    grantRole("operator");
    const { container } = renderCard();

    expect(container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it.each([
    ["sin CFDI efectivo", { cfdiEmissionIntent: "sin_cfdi_efectivo" as const }],
    ["viaje en falso", { operationalOutcome: TripOperationalOutcome.FALSE_TRIP }],
  ])("no aparece en %s", (_label, overrides) => {
    const { container } = renderCard(fleetSnapshotTripFixture(overrides));

    expect(container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("no aparece en el portal del cliente", () => {
    const { container } = renderWithProviders(
      <TripFleetSnapshotCard
        trip={fleetSnapshotTripFixture()}
        isClientPortalView
        canSubstituteInvoice={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("sin foto en un viaje completado muestra el estado vacío con accesos al catálogo", async () => {
    mockGet.mockResolvedValue(fleetSnapshotViewFixture({ snapshot: null, master: null }));
    renderCard(fleetSnapshotTripFixture({ status: TripStatus.COMPLETED }));

    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.empty.openVehicle })).toHaveAttribute(
      "href",
      "/vehicles/veh-1",
    );
    expect(screen.getByRole("link", { name: copy.empty.openDriver })).toHaveAttribute(
      "href",
      "/drivers/drv-1",
    );
  });

  it("sin foto en un viaje programado no muestra nada", async () => {
    mockGet.mockResolvedValue(fleetSnapshotViewFixture({ snapshot: null, master: null }));
    const { container } = renderCard(fleetSnapshotTripFixture({ status: TripStatus.SCHEDULED }));

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("con la función apagada para el tenant no muestra nada", async () => {
    mockGet.mockResolvedValue(fleetSnapshotViewFixture({ readEnabled: false }));
    const { container } = renderCard();

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("un 403 del GET oculta la tarjeta", async () => {
    mockGet.mockRejectedValue(new ApiError("Prohibido", 403, "FORBIDDEN"));
    const { container } = renderCard();

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("factura desactualizada: gerente ve «Sustituir factura» hacia el detalle de la factura", async () => {
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        cpInvoice: { id: "inv-1", serie: "A", folio: 15, stampedAt: "2026-10-02T10:00:00.000Z" },
        cpInvoiceOutdated: true,
      }),
    );
    renderCard(undefined, { canSubstituteInvoice: true });

    expect(await screen.findByText(copy.outdated.title("A-15"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.outdated.cta })).toHaveAttribute(
      "href",
      "/invoices/inv-1",
    );
    expect(screen.queryByText(copy.outdated.askManager, { exact: false })).not.toBeInTheDocument();
  });

  it("factura desactualizada: despachador ve pedir a un gerente y «Abrir factura»", async () => {
    grantRole("dispatcher");
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        cpInvoice: { id: "inv-1", serie: "A", folio: 15, stampedAt: "2026-10-02T10:00:00.000Z" },
        cpInvoiceOutdated: true,
      }),
    );
    renderCard();

    expect(await screen.findByText(copy.outdated.askManager, { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: copy.outdated.cta })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.outdated.openInvoice })).toHaveAttribute(
      "href",
      "/invoices/inv-1",
    );
  });

  it("factura vigente: sin aviso de sustitución", async () => {
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        cpInvoice: { id: "inv-1", serie: "A", folio: 15, stampedAt: "2026-10-02T10:00:00.000Z" },
        cpInvoiceOutdated: false,
      }),
    );
    renderCard(undefined, { canSubstituteInvoice: true });

    await screen.findByText("ABC1234");
    expect(screen.queryByText(copy.outdated.title("A-15"))).not.toBeInTheDocument();
  });

  it("foto tomada del catálogo al activar la función: insignia «Por revisar» y explicación", async () => {
    const base = fleetSnapshotViewFixture();
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        snapshot: {
          ...base.snapshot!,
          vehicle: { ...base.snapshot!.vehicle, source: "backfill_master" },
        },
      }),
    );
    renderCard();

    expect(await screen.findByText(copy.reviewBadge)).toBeInTheDocument();
    expect(screen.getByText(copy.reviewHint)).toBeInTheDocument();
    expect(screen.getByText(copy.source.backfill_master, { exact: false })).toBeInTheDocument();
  });

  it("refresco previo: quién y motivo, con «Ver motivo completo»", async () => {
    const base = fleetSnapshotViewFixture();
    const reason = "La placa se capturó mal; la correcta según la tarjeta de circulación es ABC1243.";
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        snapshot: {
          ...base.snapshot!,
          vehicle: { ...base.snapshot!.vehicle, source: "master_refresh" },
        },
        lastRefresh: {
          vehicle: { at: "2026-10-03T10:00:00.000Z", byName: "Juan Pérez", reason },
          driver: null,
        },
      }),
    );
    renderCard();

    expect(await screen.findByText(copy.lastRefresh("Juan Pérez", reason))).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: copy.viewFullReason }));
    expect(screen.getByRole("button", { name: copy.viewLessReason })).toBeInTheDocument();
  });

  it("refresco no permitido por el API: sin botón y con el motivo", async () => {
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        refresh: {
          allowed: false,
          reasonCode: "INVOICE_STAMPING_IN_PROGRESS",
          vehicle: { allowed: false, reasonCode: "INVOICE_STAMPING_IN_PROGRESS" },
          driver: { allowed: false, reasonCode: "INVOICE_STAMPING_IN_PROGRESS" },
        },
      }),
    );
    renderCard();

    expect(await screen.findByText(copy.blocked.stamping)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.action.refresh })).not.toBeInTheDocument();
  });

  it("unidad y operador dados de baja llevan su insignia", async () => {
    const base = fleetSnapshotViewFixture();
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        master: {
          vehicle: { ...base.master!.vehicle, isActive: false, deactivatedAt: "2026-10-05T12:00:00.000Z" },
          driver: { ...base.master!.driver, isActive: false },
        },
      }),
    );
    renderCard();

    expect(await screen.findByText(copy.deactivatedBadge)).toBeInTheDocument();
    expect(screen.getByText(copy.driverDeactivatedBadge)).toBeInTheDocument();
  });

  it("identidad distinta a la del viaje: sin botón y con el camino de corrección", async () => {
    mockGet.mockResolvedValue(
      fleetSnapshotViewFixture({
        refresh: {
          allowed: false,
          reasonCode: "FLEET_SNAPSHOT_VEHICLE_MISMATCH",
          vehicle: { allowed: false, reasonCode: "FLEET_SNAPSHOT_VEHICLE_MISMATCH" },
          driver: { allowed: false, reasonCode: "FLEET_SNAPSHOT_NO_CHANGES" },
        },
      }),
    );
    renderCard();

    expect(await screen.findByText(copy.blocked.vehicleMismatch)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.action.refresh })).not.toBeInTheDocument();
  });

  it("menciona los remolques sin incluirlos en el refresco", async () => {
    renderCard(
      fleetSnapshotTripFixture({
        trailers: [
          {
            trailerId: "tr-1",
            position: 1,
            licensePlate: "REM-01",
            satSubTipoRemCode: "CTR003",
            snapshotAt: "2026-10-01T14:00:00.000Z",
          },
        ],
      }),
    );

    expect(await screen.findByText(copy.trailersNote("REM-01"))).toBeInTheDocument();
  });

  it("«Ver todos los datos» despliega año, peso y pólizas", async () => {
    renderCard();

    await screen.findByText("ABC1234");
    expect(screen.queryByText(copy.label.grossWeight)).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: copy.expand })[0]!);
    expect(screen.getByText(copy.label.grossWeight)).toBeInTheDocument();
    expect(screen.getByText("18.00 t")).toBeInTheDocument();
    expect(screen.getByText("RC-001")).toBeInTheDocument();
  });
});
