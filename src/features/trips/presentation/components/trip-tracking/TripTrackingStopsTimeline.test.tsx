import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  CargoStatus,
  StopType,
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { buildTrackingItineraryRows } from "./trackingOperationalHelpers";
import { TripTrackingContactCard } from "./TripTrackingContactCard";
import { TripTrackingStopsTimeline } from "./TripTrackingStopsTimeline";
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
    description: "Bebidas embotelladas",
    productType: null,
    weight: 6200,
    volume: null,
    units: 8,
    declaredValue: null,
    aseguraCarga: null,
    polizaCarga: null,
    rate: 0,
    currency: "MXN",
    movements: [
      {
        id: "mov-1",
        stopId: "s2",
        stopIndex: 2,
        movementType: "delivery",
        weight: 6200,
        units: 8,
        completedAt: null,
        notes: null,
      },
    ],
    status: CargoStatus.IN_TRANSIT,
    pickedUpAt: new Date("2026-11-12T12:00:00.000Z"),
    deliveredAt: null,
    notes: null,
    specialInstructions: null,
    satProductCode: null,
    satProductDescription: null,
    satUnitCode: null,
    satUnitName: null,
    weightInKg: 6200,
    dimensions: null,
    hazardousMaterial: null,
    requiresHazmat: false,
    hazardousMaterialCode: null,
    packagingType: null,
    packagingDescription: null,
    ...rest,
  } as TripCargo;
}

describe("TripTrackingStopsTimeline (F3c layout)", () => {
  const origin = stop({
    id: "s1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN, StopType.PICKUP],
    locationName: "CEDIS Monterrey",
    status: "completed",
    actualArrival: new Date("2026-11-12T11:40:00.000Z"),
    actualDeparture: new Date("2026-11-12T12:10:00.000Z"),
  });
  const active = stop({
    id: "s2",
    sequenceOrder: 2,
    stopType: [StopType.DELIVERY],
    locationName: "Bodega Saltillo",
    status: "in_progress",
    actualArrival: new Date("2026-11-12T13:35:00.000Z"),
  });
  const dest = stop({
    id: "s3",
    sequenceOrder: 3,
    stopType: [StopType.DESTINATION, StopType.DELIVERY],
    locationName: "CEDIS Torreón",
    status: "pending",
  });

  it("renderiza timeline vertical con Paradas + cargas anidadas en parada activa", () => {
    const stops = [origin, active, dest];
    const cargos = [cargo({ id: "c1" })];
    const rows = buildTrackingItineraryRows(stops, undefined, cargos);

    render(
      <TripTrackingStopsTimeline
        rows={rows}
        orderedStops={stops}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={cargos}
        trafficLight="on_time"
        canMutateCargo
        onCargoAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Paradas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("A tiempo")).toBeInTheDocument();
    expect(screen.getByText("Bodega Saltillo")).toBeInTheDocument();
    expect(
      screen.getAllByText(trackingCopy.section.cargosAtStop).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Bebidas embotelladas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entregar/i })).toBeInTheDocument();
    expect(screen.queryByText("CEDIS Torreón")).toBeInTheDocument();
    // Destino pendiente: sin bloque de cargas anidadas
    expect(
      screen.getAllByText(trackingCopy.section.cargosAtStop),
    ).toHaveLength(1);
  });

  it("notifica selección de parada", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const stops = [origin, active, dest];
    const rows = buildTrackingItineraryRows(stops);

    render(
      <TripTrackingStopsTimeline
        rows={rows}
        orderedStops={stops}
        tripStatus={TripStatus.IN_PROGRESS}
        onSelectStop={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "CEDIS Torreón" }));
    expect(onSelect).toHaveBeenCalledWith("s3");
  });

  it("R2: Entregar+Devolver+Cancelar → stack outline + microcopy + nombre legible", () => {
    const longName =
      "Harina de trigo industrial para panificación artesanal lote 4821";
    const stops = [origin, active, dest];
    const cargos = [
      cargo({
        id: "c1",
        description: longName,
        status: CargoStatus.IN_TRANSIT,
      }),
    ];
    const rows = buildTrackingItineraryRows(stops, undefined, cargos);

    render(
      <TripTrackingStopsTimeline
        rows={rows}
        orderedStops={stops}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={cargos}
        canMutateCargo
        onCargoAction={vi.fn()}
      />,
    );

    const row = document.querySelector('[data-cargo-cta-layout="stack"]');
    expect(row).toBeTruthy();
    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.queryByText(/Harina y p…/i)).not.toBeInTheDocument();

    const deliver = screen.getByRole("button", { name: /Entregar/i });
    expect(deliver.className).not.toMatch(/bg-primary/);
    expect(screen.getByRole("button", { name: /Devolver/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Queda a bordo\. Después planea el retorno/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/La carga no se entrega ni regresa/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Más acciones/i })).not.toBeInTheDocument();
  });

  it("R2: N=2 pendientes tienen separador por ítem (L-D7)", () => {
    const stops = [origin, active, dest];
    const cargos = [
      cargo({
        id: "c1",
        description: "Caja A refrigerada",
        status: CargoStatus.IN_TRANSIT,
        movements: [
          {
            id: "mov-1",
            stopId: "s2",
            stopIndex: 2,
            movementType: "delivery",
            weight: 100,
            units: 1,
            completedAt: null,
            notes: null,
          },
        ],
      }),
      cargo({
        id: "c2",
        description: "Caja B seca",
        status: CargoStatus.IN_TRANSIT,
        movements: [
          {
            id: "mov-2",
            stopId: "s2",
            stopIndex: 2,
            movementType: "delivery",
            weight: 80,
            units: 1,
            completedAt: null,
            notes: null,
          },
        ],
      }),
    ];
    const rows = buildTrackingItineraryRows(stops, undefined, cargos);

    render(
      <TripTrackingStopsTimeline
        rows={rows}
        orderedStops={stops}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={cargos}
        canMutateCargo
        onCargoAction={vi.fn()}
      />,
    );

    const nested = document.querySelector(
      '[data-tracking-section="stop-cargos-nested"]',
    );
    expect(nested).toBeTruthy();
    const items = nested!.querySelectorAll("[data-cargo-cta-layout]");
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.className).toMatch(/border/);
    }
    expect(screen.getByText("Caja A refrigerada")).toBeInTheDocument();
    expect(screen.getByText("Caja B seca")).toBeInTheDocument();
    const delivers = screen.getAllByRole("button", { name: /Entregar/i });
    expect(delivers).toHaveLength(2);
    for (const btn of delivers) {
      expect(btn.className).not.toMatch(/bg-primary/);
    }
  });
});

describe("TripTrackingContactCard (F3c)", () => {
  it("muestra operador, Llamar y unidad", () => {
    render(
      <TripTrackingContactCard
        contact={{
          driverName: "Juan Pérez Ramírez",
          driverPhone: "8155500142",
          vehicleLabel: "TR-104 · 45-AK-9C",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: trackingCopy.section.contact }),
    ).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez Ramírez")).toBeInTheDocument();
    expect(screen.getByText("TR-104 · 45-AK-9C")).toBeInTheDocument();
    const call = screen.getByRole("link", { name: trackingCopy.action.call });
    expect(call).toHaveAttribute("href", "tel:8155500142");
  });

  it("muestra No capturado sin Llamar si falta celular", () => {
    render(
      <TripTrackingContactCard
        contact={{
          driverName: "Juan Pérez",
          driverPhone: null,
          vehicleLabel: "TR-104",
        }}
      />,
    );

    expect(
      screen.getByText(trackingCopy.label.mobileNotCaptured),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: trackingCopy.action.call }),
    ).not.toBeInTheDocument();
  });
});
