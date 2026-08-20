import { type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { StopType, type TripStop } from "@features/trips/domain";

import { tripDetailCopy } from "../../copy";
import { TripDetailRouteStopCard } from "./TripDetailRouteStopCard";

const copy = tripDetailCopy.route;

function tripStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: "stop-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN, StopType.PICKUP],
    addressId: null,
    clientId: "cli-1",
    clientAddressId: null,
    sourceAddressId: "addr-1",
    address: "Bodega Alpha",
    city: "Guadalajara",
    state: "JAL",
    postalCode: "44100",
    latitude: 20.67,
    longitude: -103.35,
    locationName: "Bodega Alpha",
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: "pending",
    notes: null,
    idUbicacion: null,
    street: "Av Cliente",
    exteriorNumber: "1",
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: "MEX",
    satEstadoCode: "JAL",
    satMunicipioCode: "039",
    satLocalidadCode: null,
    satColoniaCode: null,
    rfcRemitenteDestinatario: null,
    nombreRemitenteDestinatario: null,
    deliveryRfcRemitenteDestinatario: null,
    deliveryNombreRemitenteDestinatario: null,
    remitentePartnerId: null,
    destinatarioPartnerId: null,
    distanceFromPreviousKm: null,
    distanceSource: null,
    distanceProvider: null,
    distanceConfidence: null,
    distanceComputedAt: null,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    ...overrides,
  };
}

function renderCard(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("TripDetailRouteStopCard", () => {
  it("shows Completar domicilio when the address is pending, not Editar parada", async () => {
    const onCompleteAddress = vi.fn();
    const onEditStop = vi.fn();
    const user = userEvent.setup();

    renderCard(
      <TripDetailRouteStopCard
        stop={tripStop({ postalCode: null, satEstadoCode: null, latitude: null, longitude: null })}
        onCompleteAddress={onCompleteAddress}
        onEditStop={onEditStop}
      />,
    );

    expect(
      screen.queryByRole("button", { name: copy.action.editStop }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    );
    expect(onCompleteAddress).toHaveBeenCalledTimes(1);
    expect(onEditStop).not.toHaveBeenCalled();
  });

  it("shows Editar parada when the address is ready, not Completar domicilio", async () => {
    const onCompleteAddress = vi.fn();
    const onEditStop = vi.fn();
    const user = userEvent.setup();

    renderCard(
      <TripDetailRouteStopCard
        stop={tripStop()}
        onCompleteAddress={onCompleteAddress}
        onEditStop={onEditStop}
      />,
    );

    expect(
      screen.queryByRole("button", { name: copy.action.completeAddress }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.action.editStop }));
    expect(onEditStop).toHaveBeenCalledTimes(1);
    expect(onCompleteAddress).not.toHaveBeenCalled();
  });

  it("shows missing distance on destination when km is absent", () => {
    renderCard(
      <TripDetailRouteStopCard
        stop={tripStop({
          sequenceOrder: 2,
          stopType: [StopType.DESTINATION, StopType.DELIVERY],
          locationName: "CEDIS Sur",
          distanceFromPreviousKm: null,
        })}
      />,
    );

    expect(screen.getByText(copy.state.missingDistance)).toBeInTheDocument();
  });

  it("shows persisted km on destination", () => {
    renderCard(
      <TripDetailRouteStopCard
        stop={tripStop({
          sequenceOrder: 2,
          stopType: [StopType.DESTINATION, StopType.DELIVERY],
          locationName: "CEDIS Sur",
          distanceFromPreviousKm: 420.5,
        })}
      />,
    );

    expect(
      screen.getByText(copy.format.distanceKm((420.5).toLocaleString("es-MX"))),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.state.missingDistance)).not.toBeInTheDocument();
  });

  it("hides both CTAs when callbacks are omitted", () => {
    renderCard(<TripDetailRouteStopCard stop={tripStop()} />);

    expect(
      screen.queryByRole("button", { name: copy.action.completeAddress }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.editStop }),
    ).not.toBeInTheDocument();
  });
});
