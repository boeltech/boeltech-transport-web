import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  CargoStatus,
  StopType,
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { buildTrackingItineraryRows } from "./trackingOperationalHelpers";
import { TripTrackingStopWorkbenchSheet } from "./TripTrackingStopWorkbenchSheet";
import { trackingCopy } from "../../copy";

const STOP_DEFAULTS = {
  tenantId: "tenant-1",
  tripId: "trip-1",
  addressId: null,
  clientId: null,
  clientAddressId: null,
  address: "",
  city: "",
  state: null,
  postalCode: null,
  latitude: null,
  longitude: null,
  locationName: null,
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "pending" as const,
  notes: null,
  idUbicacion: null,
  rfcRemitenteDestinatario: null,
  distanceFromPreviousKm: null,
  distanceSource: null,
} as const;

function stop(
  overrides: Partial<TripStop> & Pick<TripStop, "id" | "sequenceOrder" | "stopType">,
): TripStop {
  return { ...STOP_DEFAULTS, ...overrides } as TripStop;
}

function cargo(
  overrides: Partial<TripCargo> & Pick<TripCargo, "id">,
): TripCargo {
  const { id, ...rest } = overrides;
  return {
    id,
    tenantId: "tenant-1",
    tripId: "trip-1",
    clientId: "client-1",
    description: "Cajas",
    productType: null,
    weight: 50,
    volume: null,
    units: 5,
    declaredValue: null,
    aseguraCarga: null,
    polizaCarga: null,
    rate: 0,
    currency: "MXN",
    movements: [
      {
        id: "m1",
        cargoId: id,
        stopId: "s1",
        stopIndex: 0,
        movementType: "pickup" as const,
        weight: null,
        units: null,
        completedAt: null,
        notes: null,
      },
    ],
    status: CargoStatus.PENDING,
    pickedUpAt: null,
    deliveredAt: null,
    notes: null,
    specialInstructions: null,
    satProductCode: null,
    satProductDescription: null,
    satUnitCode: null,
    satUnitName: null,
    weightInKg: null,
    dimensions: null,
    hazardousMaterial: null,
    requiresHazmat: false,
    hazardousMaterialCode: null,
    packagingType: null,
    packagingDescription: null,
    ...rest,
  } as TripCargo;
}

describe("TripTrackingStopWorkbenchSheet (F6)", () => {
  const origin = stop({
    id: "s1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
    locationName: "Bodega QRO",
    status: "in_progress",
    actualArrival: new Date("2026-07-12T10:00:00.000Z"),
  });
  const destination = stop({
    id: "s2",
    sequenceOrder: 2,
    stopType: [StopType.DESTINATION],
    locationName: "Cliente CDMX",
  });

  it("muestra workbench de cargas cuando está abierto con la parada en curso", () => {
    const rows = buildTrackingItineraryRows([origin, destination], undefined, [
      cargo({ id: "c1" }),
    ]);
    const current = rows.find((row) => row.isActionTarget) ?? null;

    render(
      <TripTrackingStopWorkbenchSheet
        open
        onOpenChange={vi.fn()}
        row={current}
        tripStatus={TripStatus.IN_PROGRESS}
        orderedStops={[origin, destination]}
        cargos={[cargo({ id: "c1" })]}
        tripInProgress
        getCargoStatusVariant={() => "outline"}
        onCargoAction={vi.fn()}
      />,
    );

    expect(
      screen.getByText(trackingCopy.sheet.stopWorkbenchTitle),
    ).toBeInTheDocument();
    expect(screen.getByText("Cajas")).toBeInTheDocument();
    expect(
      screen.getByText(trackingCopy.section.cargosAtStop),
    ).toBeInTheDocument();
  });

  it("no monta contenido cuando open=false", () => {
    const rows = buildTrackingItineraryRows([origin, destination]);
    const current = rows.find((row) => row.isActionTarget) ?? null;

    render(
      <TripTrackingStopWorkbenchSheet
        open={false}
        onOpenChange={vi.fn()}
        row={current}
        tripStatus={TripStatus.IN_PROGRESS}
        orderedStops={[origin, destination]}
        cargos={[]}
        tripInProgress
        getCargoStatusVariant={() => "outline"}
        onCargoAction={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(trackingCopy.sheet.stopWorkbenchTitle),
    ).not.toBeInTheDocument();
  });
});
