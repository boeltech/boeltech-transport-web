import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TripStop } from "@features/trips/domain";
import { StopPickerSheet } from "./StopPickerSheet";

const stop: TripStop = {
  id: "stop-1",
  tenantId: "t1",
  tripId: "trip-1",
  sequenceOrder: 2,
  stopType: ["destination"],
  addressId: "addr-1",
  clientId: null,
  clientAddressId: null,
  address: "Calle 1",
  city: "Monterrey",
  state: "NL",
  postalCode: "64000",
  latitude: null,
  longitude: null,
  locationName: null,
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "completed",
  notes: null,
  idUbicacion: null,
  street: null,
  exteriorNumber: null,
  interiorNumber: null,
  colonia: null,
  reference: null,
  satCountryCode: null,
  satEstadoCode: null,
  satMunicipioCode: null,
  satLocalidadCode: null,
  satColoniaCode: null,
  rfcRemitenteDestinatario: "XAXX010101000",
  nombreRemitenteDestinatario: "Cliente",
  deliveryRfcRemitenteDestinatario: null,
  deliveryNombreRemitenteDestinatario: null,
  remitentePartnerId: null,
  destinatarioPartnerId: null,
  distanceFromPreviousKm: 100,
  distanceSource: "manual",
  distanceProvider: null,
  distanceConfidence: null,
  distanceComputedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("StopPickerSheet", () => {
  it("lists stops with invalid-format copy by default", () => {
    render(
      <StopPickerSheet
        open
        onOpenChange={vi.fn()}
        stops={[stop]}
        onSelectStop={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "El PAC rechazó el timbrado por RFC inválido. Elige la parada que debes corregir.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Parada #2")).toBeInTheDocument();
  });

  it("uses fallback copy and lists all stops when listMode is all-stops-fallback", async () => {
    const user = userEvent.setup();
    const onSelectStop = vi.fn();

    render(
      <StopPickerSheet
        open
        onOpenChange={vi.fn()}
        stops={[stop]}
        listMode="all-stops-fallback"
        onSelectStop={onSelectStop}
      />,
    );

    expect(
      screen.getByText(
        "El PAC rechazó el timbrado, pero no se identificó la parada automáticamente. Revisa el RFC de cada parada y corrige la que corresponda.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Corregir RFC" }));
    expect(onSelectStop).toHaveBeenCalledWith("stop-1");
  });

  it("shows empty state when no stops are available", () => {
    render(
      <StopPickerSheet
        open
        onOpenChange={vi.fn()}
        stops={[]}
        listMode="all-stops-fallback"
        onSelectStop={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "No hay paradas disponibles en este contexto. Cierra y vuelve a abrir el detalle del viaje o de la factura.",
      ),
    ).toBeInTheDocument();
  });
});
