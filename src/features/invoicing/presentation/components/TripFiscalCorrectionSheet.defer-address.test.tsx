import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { TripStop } from "@features/trips/domain";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";
import { TripFiscalCorrectionSheet } from "@features/trips/presentation/components/trip-fiscal/TripFiscalCorrectionSheet";
import * as addressSearchApi from "@shared/ui/address-picker/addressSearchApi";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

vi.mock("@shared/geolocation/useCoordinatesPostalCodeWarning", () => ({
  useCoordinatesPostalCodeWarning: vi.fn(() => null),
}));

vi.mock("@shared/cfdi/addressPayloadBridge", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@shared/cfdi/addressPayloadBridge")>();
  return {
    ...actual,
    parseClientAddressFormCreate: vi.fn(),
  };
});

import * as addressPayloadBridge from "@shared/cfdi/addressPayloadBridge";

vi.mock("@shared/ui/address-picker/addressSearchApi", () => ({
  searchAddresses: vi.fn(),
}));

const TRIP_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const STOP_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const CLIENT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const partnerItem: AddressSearchListItem = {
  id: "22222222-2222-4222-8222-222222222222",
  ownerType: "tenant",
  ownerId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
  ownerLabel: "Transportes Norte",
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

function buildStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: STOP_ID,
    tenantId: "tenant-1",
    tripId: TRIP_ID,
    sequenceOrder: 0,
    stopType: ["pickup"],
    addressId: null,
    clientId: CLIENT_ID,
    clientAddressId: null,
    address: "",
    city: "",
    state: null,
    postalCode: "64000",
    latitude: 25.1,
    longitude: -100.1,
    locationName: "Origen actual",
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: "pending",
    notes: null,
    idUbicacion: null,
    street: "Calle Vieja",
    exteriorNumber: "1",
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
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function renderDeferAddressSheet(
  props: Partial<ComponentProps<typeof TripFiscalCorrectionSheet>> = {},
) {
  const onDeferSave = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <TripFiscalCorrectionSheet
        mode="defer"
        tripId={TRIP_ID}
        clientId={CLIENT_ID}
        stop={buildStop()}
        correctionKind="address"
        open
        canExecute
        submitLabel="Incluir en sustitución"
        addressSubmitLabel="Incluir en sustitución"
        addressCopy={invoicingCopy.detail.substitute.address}
        onOpenChange={vi.fn()}
        onDeferSave={onDeferSave}
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onDeferSave };
}

describe("TripFiscalCorrectionSheet defer address", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [partnerItem],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });
    vi.mocked(addressPayloadBridge.parseClientAddressFormCreate).mockResolvedValue({
      ok: true,
      value: {
        address_type: "trip_stop",
        sat_country_code: "MEX",
        postal_code: "64000",
        sat_state_code: "19",
        sat_municipality_code: "006",
        street: "Av Nueva",
        exterior_number: "10",
      },
    });
  });

  it("swap mode saves stop_address from partner picker without address_id", async () => {
    const user = userEvent.setup();
    const { onDeferSave } = renderDeferAddressSheet();

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
      "Corregir domicilio origen",
    );

    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => {
      expect(onDeferSave).toHaveBeenCalledTimes(1);
    });

    const entry = onDeferSave.mock.calls[0]?.[0];
    expect(entry.stop_address).toBeDefined();
    expect(entry.stop_address?.street).toBe("Av Industria");
    expect(entry.address_id).toBeUndefined();
  });

  it("swap mode includes fiscal fields when search item has remitente metadata", async () => {
    const user = userEvent.setup();
    const billingItem: AddressSearchListItem = {
      ...partnerItem,
      addressType: "billing",
      locationName: "Domicilio fiscal",
      remitenteRfc: "AAA010101AAA",
      remitenteName: "Cliente Demo SA",
    };
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [billingItem],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });

    const { onDeferSave } = renderDeferAddressSheet();

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(/nombre, calle o código postal/i),
      "fiscal",
    );

    await waitFor(() => {
      expect(screen.getByText("Domicilio fiscal")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Domicilio fiscal"));
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "Corregir domicilio fiscal",
    );
    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => {
      expect(onDeferSave).toHaveBeenCalledTimes(1);
    });

    const entry = onDeferSave.mock.calls[0]?.[0];
    expect(entry.stop_address?.rfc_remitente_destinatario).toBe("AAA010101AAA");
    expect(entry.stop_address?.nombre_remitente_destinatario).toBe("Cliente Demo SA");
  });

  it("blocks swap picker when trip has no clientId", () => {
    renderDeferAddressSheet({ clientId: null });

    expect(
      screen.getByText(/El viaje debe tener cliente asignado/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Incluir en sustitución/i }),
    ).toBeEnabled();
  });

  it("shows RFC warning when selected address has no remitente metadata", async () => {
    const user = userEvent.setup();
    renderDeferAddressSheet();

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(/nombre, calle o código postal/i),
      "apodaca",
    );

    await waitFor(() => {
      expect(screen.getByText("Bodega Apodaca")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Bodega Apodaca"));

    expect(
      screen.getByText(/no tiene RFC remitente\/destinatario/i),
    ).toBeInTheDocument();
  });

  it("keeps inline mode available", async () => {
    const user = userEvent.setup();
    renderDeferAddressSheet();

    await user.click(screen.getByRole("button", { name: /Capturar domicilio corregido/i }));

    expect(screen.getByLabelText(/Nombre del lugar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Codigo postal/i)).toBeInTheDocument();
  });

  it("inline mode includes edited locationName in parse payload", async () => {
    const user = userEvent.setup();
    renderDeferAddressSheet({ stop: buildStop({ locationName: "Origen actual" }) });

    await user.click(screen.getByRole("button", { name: /Capturar domicilio corregido/i }));
    const locationInput = screen.getByLabelText(/Nombre del lugar/i);
    expect(locationInput).toHaveValue("Origen actual");

    await user.clear(locationInput);
    await user.type(locationInput, "CEDIS Norte actualizado");
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "Corregir nombre de ubicación",
    );
    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => {
      expect(addressPayloadBridge.parseClientAddressFormCreate).toHaveBeenCalled();
    });

    const payload = vi.mocked(addressPayloadBridge.parseClientAddressFormCreate).mock
      .calls[0]?.[0] as { locationName?: string } | undefined;
    expect(payload?.locationName).toBe("CEDIS Norte actualizado");
  });

  it("inline mode shows coordinates far from postal code warning", async () => {
    const { useCoordinatesPostalCodeWarning } = await import(
      "@shared/geolocation/useCoordinatesPostalCodeWarning"
    );
    vi.mocked(useCoordinatesPostalCodeWarning).mockReturnValue({
      distanceKm: 950,
      postalCode: "76240",
      reference: {
        label: "76240, El Marqués, Querétaro",
        position: { latitude: 20.74, longitude: -100.45 },
        query: "76240",
        resolutionSource: "mapbox_postcode",
        confidence: "high",
      },
    });

    const user = userEvent.setup();
    renderDeferAddressSheet();

    await user.click(screen.getByRole("button", { name: /Capturar domicilio corregido/i }));

    expect(
      screen.getByText(/950 km del centro aproximado del CP 76240/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Referencia del sistema para el CP \(consulta «76240», fuente mapbox_postcode\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/76240, El Marqués, Querétaro/i)).toBeInTheDocument();
  });

  it("inline mode saves stop_address via addressPayloadBridge", async () => {
    const user = userEvent.setup();
    const { onDeferSave } = renderDeferAddressSheet();

    await user.click(screen.getByRole("button", { name: /Capturar domicilio corregido/i }));
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "Corregir domicilio escala",
    );
    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => {
      expect(addressPayloadBridge.parseClientAddressFormCreate).toHaveBeenCalled();
      expect(onDeferSave).toHaveBeenCalledTimes(1);
    });

    const entry = onDeferSave.mock.calls[0]?.[0];
    expect(entry.stop_address?.street).toBe("Av Nueva");
    expect(entry.stop_id).toBe(STOP_ID);
  });

  it("inline mode shows validation summary when parse fails", async () => {
    vi.mocked(addressPayloadBridge.parseClientAddressFormCreate).mockResolvedValue({
      ok: false,
      errors: [
        {
          code: "SAT_NEIGHBORHOOD_REQUIRED",
          message: "Selecciona la colonia (catálogo SAT).",
          path: "sat_neighborhood_code",
        },
      ],
      fieldErrors: { satNeighborhoodCode: "Selecciona la colonia (catálogo SAT)." },
    });

    const user = userEvent.setup();
    renderDeferAddressSheet();

    await user.click(screen.getByRole("button", { name: /Capturar domicilio corregido/i }));
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "Corregir domicilio escala",
    );
    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => {
      expect(screen.getByText(/Revisa el domicilio corregido/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Selecciona la colonia \(catálogo SAT\)/i).length).toBeGreaterThan(0);
    });
  });

  it("inline mode shows unchanged error when parsed payload matches stop", async () => {
    vi.mocked(addressPayloadBridge.parseClientAddressFormCreate).mockResolvedValue({
      ok: true,
      value: {
        address_type: "trip_stop",
        sat_country_code: "MEX",
        postal_code: "64000",
        sat_state_code: "19",
        sat_municipality_code: "006",
        street: "Calle Vieja",
        exterior_number: "1",
        location_name: "Origen actual",
      },
    });

    const user = userEvent.setup();
    const { onDeferSave } = renderDeferAddressSheet();

    await user.click(screen.getByRole("button", { name: /Capturar domicilio corregido/i }));
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "Corregir domicilio escala",
    );
    await user.click(screen.getByRole("button", { name: /Incluir en sustitución/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/La dirección elegida coincide con la registrada en la parada/i),
      ).toBeInTheDocument();
    });
    expect(onDeferSave).not.toHaveBeenCalled();
  });
});
