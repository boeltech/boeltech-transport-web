import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";
import { TripDetailOperationTab } from "./TripDetailOperationTab";

vi.mock("@features/billing", () => ({
  useInternalStaffEntitlement: () => ({
    hasModule: true,
    isFetched: true,
  }),
}));

const copy = tripDetailCopy.operation;

const CLIENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "VJ-001",
    status: TripStatus.IN_PROGRESS,
    scheduledDeparture: new Date("2026-05-28T08:00:00.000Z"),
    scheduledArrival: new Date("2026-05-28T18:00:00.000Z"),
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: 100_000, end: null },
    clientId: CLIENT_ID,
    client: { id: CLIENT_ID, legalName: "Transportes Alfa" },
    cfdiDocumentIntent: "ingreso",
    vehicle: { id: "veh-1", unitNumber: "U-12", licensePlate: "XYZ-98-76" },
    driver: { id: "drv-1", fullName: "Ana Lopez" },
    trailers: [
      {
        trailerId: "tr-1",
        position: 1,
        licensePlate: "ABC-12-34",
        satSubTipoRemCode: "CTR003",
        snapshotAt: "2026-05-28T07:00:00.000Z",
      },
    ],
    notes: null,
    statusHistory: [],
    ...overrides,
  } as Trip;
}

function renderTab(trip: Trip = makeTrip()) {
  return render(
    <MemoryRouter>
      <TripDetailOperationTab trip={trip} canEditStructural={false} />
    </MemoryRouter>,
  );
}

describe("TripDetailOperationTab — ficha operativa (Capa 1 D8 / D11)", () => {
  it("muestra cliente, unidad, conductor, placa de remolque y tipo de viaje", () => {
    renderTab();

    expect(screen.getByText("Transportes Alfa")).toBeInTheDocument();
    expect(screen.getByText("U-12")).toBeInTheDocument();
    expect(screen.getByText("Ana Lopez")).toBeInTheDocument();
    expect(screen.getByText("ABC-12-34 · 1")).toBeInTheDocument();
    expect(screen.getByText(copy.format.tripType("ingreso"))).toBeInTheDocument();
  });

  it("no muestra snapshot CP, SubTipoRem ni ID de cliente", () => {
    renderTab(
      makeTrip({
        client: undefined,
      }),
    );

    expect(screen.queryByText("CTR003")).not.toBeInTheDocument();
    expect(screen.queryByText(/snapshot/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SubTipoRem/i)).not.toBeInTheDocument();
    expect(screen.queryByText(CLIENT_ID)).not.toBeInTheDocument();
    expect(screen.getByText(copy.state.clientUnavailable)).toBeInTheDocument();
  });
});
