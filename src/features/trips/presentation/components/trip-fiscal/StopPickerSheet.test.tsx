import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TripStop } from "@features/trips/domain";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import { StopPickerSheet } from "./StopPickerSheet";

const pickerCopy = tripFiscalCopy.pickerSheet;

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

const originStop: TripStop = {
  ...stop,
  id: "stop-origin",
  sequenceOrder: 1,
  stopType: ["origin"],
  rfcRemitenteDestinatario: "EKU9003173C9",
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
      screen.getByRole("heading", { name: pickerCopy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(pickerCopy.description)).toBeInTheDocument();
    expect(screen.queryByText(pickerCopy.fallbackTip)).not.toBeInTheDocument();
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
      screen.getByRole("heading", { name: pickerCopy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(pickerCopy.allStopsDescription)).toBeInTheDocument();
    expect(screen.getByText(pickerCopy.fallbackTip)).toBeInTheDocument();
    expect(pickerCopy.allStopsDescription).not.toMatch(/CP132|l_RFC|\bPAC\b/i);
    expect(pickerCopy.allStopsDescription).toMatch(/cliente facturado/i);

    await user.click(
      screen.getByRole("button", { name: pickerCopy.fixAction }),
    );
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

    expect(screen.getByText(pickerCopy.empty)).toBeInTheDocument();
  });

  it("renders candidate rows with Origen/Destino role and RFC from API", () => {
    render(
      <StopPickerSheet
        open
        onOpenChange={vi.fn()}
        stops={[originStop, stop]}
        listMode="candidates"
        candidates={[
          {
            stopId: "stop-origin",
            stopOrder: 1,
            tipoUbicacion: "Origen",
            currentRfc: "EKU9003173C9",
          },
          {
            stopId: "stop-1",
            stopOrder: 2,
            tipoUbicacion: "Destino",
            currentRfc: "URE180429TM6",
          },
        ]}
        onSelectStop={vi.fn()}
      />,
    );

    expect(screen.getByText("#1 · Origen")).toBeInTheDocument();
    expect(screen.getByText("#2 · Destino")).toBeInTheDocument();
    expect(screen.getByText("EKU9003173C9")).toBeInTheDocument();
    expect(screen.getByText("URE180429TM6")).toBeInTheDocument();
    expect(screen.queryByText(pickerCopy.fallbackTip)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: pickerCopy.fixAction }),
    ).toHaveLength(2);
  });
});
