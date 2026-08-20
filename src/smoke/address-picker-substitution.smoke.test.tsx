/**
 * Smoke WS-ADDR-PRELOAD — precarga partner en sustitución fiscal (ADR-0053 Fase 4).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { TripStop } from "@features/trips/domain";
import { TripFiscalCorrectionSheet } from "@features/trips/presentation/components/trip-fiscal/TripFiscalCorrectionSheet";
import * as addressSearchApi from "@shared/ui/address-picker/addressSearchApi";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

vi.mock("@shared/ui/address-picker/addressSearchApi", () => ({
  searchAddresses: vi.fn(),
}));

const partnerItem: AddressSearchListItem = {
  id: "22222222-2222-4222-8222-222222222222",
  ownerType: "tenant",
  ownerId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
  ownerLabel: "Transportes Norte SA",
  addressType: "warehouse",
  locationName: "Bodega Apodaca",
  street: "Av Industria",
  exteriorNumber: "120",
  postalCode: "66600",
  satStateCode: "19",
  satMunicipalityCode: "006",
  neighborhoodName: "Parque Industrial",
  satNeighborhoodCode: "0001",
  latitude: 25.78,
  longitude: -100.18,
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

const stop: TripStop = {
  id: "stop-smoke-1",
  tenantId: "tenant-1",
  tripId: "trip-smoke-1",
  sequenceOrder: 0,
  stopType: ["pickup"],
  addressId: "old-address-id",
  clientId: "client-smoke-1",
  clientAddressId: null,
  address: "",
  city: "",
  state: null,
  postalCode: "64000",
  latitude: 25.1,
  longitude: -100.1,
  locationName: "CEDIS actual",
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "pending",
  notes: null,
  idUbicacion: null,
  street: "Calle anterior",
  exteriorNumber: "50",
  interiorNumber: null,
  colonia: null,
  reference: null,
  satCountryCode: "MEX",
  satEstadoCode: "19",
  satMunicipioCode: "006",
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

type OnDeferSave = NonNullable<
  ComponentProps<typeof TripFiscalCorrectionSheet>["onDeferSave"]
>;

function renderDeferAddressSheet(onDeferSave: ReturnType<typeof vi.fn>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TripFiscalCorrectionSheet
        mode="defer"
        tripId="trip-smoke-1"
        clientId="client-smoke-1"
        stop={stop}
        correctionKind="address"
        open
        canExecute
        submitLabel="Incluir en sustitución"
        addressSubmitLabel="Incluir en sustitución"
        onOpenChange={vi.fn()}
        onDeferSave={onDeferSave as OnDeferSave}
      />
    </QueryClientProvider>,
  );
}

describe("address-picker substitution smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [partnerItem],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });
  });

  it("corrección de domicilio vía picker emite stop_address snapshot", async () => {
    const user = userEvent.setup();
    const onDeferSave = vi.fn();

    renderDeferAddressSheet(onDeferSave);

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(/nombre, calle o código postal/i),
      "apodaca",
    );

    await waitFor(() => {
      expect(screen.getByText("Bodega Apodaca")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Bodega Apodaca"));
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "Alinear domicilio con bodega partner",
    );
    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => expect(onDeferSave).toHaveBeenCalledTimes(1));

    const entry = onDeferSave.mock.calls[0]?.[0];
    expect(entry.stop_address?.postal_code).toBe("66600");
    expect(entry.address_id).toBeUndefined();
  });

  it("corrección vía picker con RFC en fuente emite stop_address fiscal", async () => {
    const user = userEvent.setup();
    const onDeferSave = vi.fn();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [
        {
          ...partnerItem,
          addressType: "warehouse" as const,
          locationName: "Bodega con RFC",
          remitenteRfc: "AAA010101AAA",
          remitenteName: "Cliente Demo SA",
        },
      ],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });

    renderDeferAddressSheet(onDeferSave);

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(/nombre, calle o código postal/i),
      "bodega",
    );

    await waitFor(() => {
      expect(screen.getByText("Bodega con RFC")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Bodega con RFC"));
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "Corregir domicilio fiscal origen",
    );
    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => expect(onDeferSave).toHaveBeenCalledTimes(1));

    const entry = onDeferSave.mock.calls[0]?.[0];
    expect(entry.stop_address?.rfc_remitente_destinatario).toBe("AAA010101AAA");
    expect(entry.stop_address?.nombre_remitente_destinatario).toBe("Cliente Demo SA");
  });
});
