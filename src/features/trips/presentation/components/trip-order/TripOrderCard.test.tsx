import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions/domain";
import { TripStatus } from "@features/trips/domain";
import {
  tripOrderEmissionFixture,
  tripOrderStatusFixture,
  tripOrderTripFixture,
} from "@features/trips/test/tripOrderFixture";
import { grantPermissions } from "@/test/mocks/permissions";
import { renderWithProviders } from "@/test/renderWithProviders";
import { tripDetailCopy } from "../../copy";
import { TripOrderCard } from "./TripOrderCard";

const copy = tripDetailCopy.tripOrder.card;

const { mockGet, mockGenerate, mockDownload } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockGenerate: vi.fn(),
  mockDownload: vi.fn(),
}));

vi.mock("@features/trips/infrastructure/tripOrderApi", () => ({
  tripOrderApi: {
    getStatus: mockGet,
    generate: mockGenerate,
    downloadFile: mockDownload,
  },
}));

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));

function grantRole(role: UserRole) {
  const permissions = getPermissionsForRole(role);
  grantPermissions((module, action) => checkPermission(role, permissions, module, action).allowed, {
    role,
  });
}

function renderCard(
  trip = tripOrderTripFixture(),
  props: { isClientPortalView?: boolean; isDriverPortalView?: boolean } = {},
) {
  return renderWithProviders(
    <TripOrderCard
      trip={trip}
      isClientPortalView={props.isClientPortalView}
      isDriverPortalView={props.isDriverPortalView}
    />,
  );
}

describe("TripOrderCard", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGenerate.mockReset();
    mockDownload.mockReset();
    mockGet.mockResolvedValue(tripOrderStatusFixture());
    mockGenerate.mockResolvedValue({
      emission: tripOrderEmissionFixture(),
      message: "ok",
    });
    mockDownload.mockResolvedValue(undefined);
    grantRole("dispatcher");
  });

  it("muestra empty + Generar cuando no hay emisión", async () => {
    renderCard();

    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.generate }),
    ).toBeEnabled();
    expect(mockGet).toHaveBeenCalledWith("trip-1");
  });

  it("Generar disabled en draft con motivo PRD", async () => {
    mockGet.mockResolvedValue(
      tripOrderStatusFixture({
        eligibility: {
          canGenerate: false,
          canRegenerate: false,
          canDownload: false,
          reasonCode: "TRIP_ORDER_STATUS_DRAFT",
        },
      }),
    );
    renderCard(tripOrderTripFixture({ status: TripStatus.DRAFT }));

    const btn = await screen.findByRole("button", { name: copy.action.generate });
    expect(btn).toBeDisabled();
    expect(screen.getByText(copy.disabled.draft)).toBeInTheDocument();
  });

  it("umbral incompleto: Generar disabled con motivo", async () => {
    mockGet.mockResolvedValue(
      tripOrderStatusFixture({
        threshold: { met: false, missing: ["vehicle"] },
        eligibility: {
          canGenerate: false,
          canRegenerate: false,
          canDownload: false,
          reasonCode: "TRIP_ORDER_THRESHOLD_INCOMPLETE",
        },
      }),
    );
    renderCard();

    expect(
      await screen.findByRole("button", { name: copy.action.generate }),
    ).toBeDisabled();
    expect(screen.getByText(copy.disabled.threshold)).toBeInTheDocument();
  });

  it("emisión vigente: badge Vigente + Descargar; sin Regenerar", async () => {
    mockGet.mockResolvedValue(
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
    renderCard();

    expect(await screen.findByText(copy.badge.current)).toBeInTheDocument();
    expect(screen.getByText(copy.label.version(1))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.download }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.regenerate }),
    ).not.toBeInTheDocument();
  });

  it("desactualizada: badge + Regenerar con confirmación vN+1", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(
      tripOrderStatusFixture({
        eligibility: {
          canGenerate: false,
          canRegenerate: true,
          canDownload: true,
          reasonCode: null,
        },
        currentEmission: tripOrderEmissionFixture({ version: 2, outdated: true }),
        emissionCount: 2,
      }),
    );
    mockGenerate.mockResolvedValue({
      emission: tripOrderEmissionFixture({ version: 3, outdated: false }),
      message: "ok",
    });
    renderCard();

    expect(await screen.findByText(copy.badge.outdated)).toBeInTheDocument();
    expect(screen.getByText(copy.outdatedHint)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.action.regenerate }));
    expect(
      await screen.findByText(copy.confirmRegenerate.description(3)),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.confirmRegenerate.confirm }),
    );
    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith(
        "trip-1",
        "orden-viaje-V-2026-0042-v1.pdf",
      ),
    );
  });

  it("accountant ve Descargar sin Generar/Regenerar", async () => {
    grantRole("accountant");
    mockGet.mockResolvedValue(
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
    renderCard();

    expect(
      await screen.findByRole("button", { name: copy.action.download }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.generate }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.regenerate }),
    ).not.toBeInTheDocument();
  });

  it("enabled=false oculta la card", async () => {
    mockGet.mockResolvedValue(tripOrderStatusFixture({ enabled: false }));
    const { container } = renderCard();

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
      expect(container.querySelector('[data-testid="trip-order-card"]')).toBeNull();
    });
  });

  it("portal cliente y conductor no montan ni consultan", () => {
    const client = renderCard(tripOrderTripFixture(), { isClientPortalView: true });
    expect(client.container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();

    mockGet.mockClear();
    const driver = renderCard(tripOrderTripFixture(), { isDriverPortalView: true });
    expect(driver.container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("driver sin permiso no ve la card", () => {
    grantRole("driver");
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("copy no usa Timbrar ni titula Carta Porte", async () => {
    renderCard();
    expect(await screen.findByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.queryByText(/Timbrar/i)).not.toBeInTheDocument();
    expect(screen.getByText(copy.title).textContent).toBe("Orden de viaje");
    expect(screen.getByText(copy.description).textContent).toMatch(/No es CFDI ni Carta Porte/);
  });

  it("una sola Card raíz sin Card anidada (D9)", async () => {
    renderCard();
    const root = await screen.findByTestId("trip-order-card");
    expect(root.querySelectorAll(".rounded-xl.border.bg-card").length).toBe(0);
  });
});
