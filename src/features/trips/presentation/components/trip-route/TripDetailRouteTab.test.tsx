import { type ReactElement } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  StopType,
  TripStatus,
  type ClientCorridor,
  type Trip,
  type TripStop,
} from "@features/trips/domain";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

import { tripDetailCopy } from "../../copy";
import { TripDetailRouteTab } from "./TripDetailRouteTab";

const copy = tripDetailCopy.route;

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  toast: vi.fn(),
  isPending: false,
  corridors: [] as ClientCorridor[],
  nextPickerItems: [] as AddressSearchListItem[],
  defaultPickerItem: {
    id: "11111111-1111-4111-8111-111111111111",
    ownerType: "client" as const,
    ownerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ownerLabel: "Cliente Alpha",
    addressType: "shipping" as const,
    locationName: "Bodega Alpha",
    street: "Av Cliente",
    exteriorNumber: "1",
    postalCode: "44100",
    satStateCode: "JAL",
    satMunicipalityCode: "039",
    neighborhoodName: null,
    satNeighborhoodCode: null,
    latitude: 20.67,
    longitude: -103.35,
    geolocationPending: false,
    isPrimary: false,
    isActive: true,
    isCartaPorteReady: true,
  } satisfies AddressSearchListItem,
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@features/trips/application", () => ({
  useReplaceTripStops: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: mocks.isPending,
  }),
  useClientCorridors: () => ({
    data: mocks.corridors,
    isLoading: false,
  }),
}));

vi.mock("../trip-fiscal", () => ({
  useTripFiscalSheets: () => ({
    sheets: null,
    shouldShowFiscalWarningChipForStop: () => false,
    shouldShowFiscalCorrectionChipForStop: () => false,
    openFixSheet: vi.fn(),
  }),
}));

vi.mock("../../pages/create/components/StopFormSheet", () => ({
  StopFormSheet: ({
    open,
    heading,
    initialData,
    onSubmit,
    variant,
    isPending,
  }: {
    open: boolean;
    heading?: string;
    variant?: "sheet" | "inline";
    isPending?: boolean;
    initialData?: { stopCategory?: string; stopType?: string[]; locationName?: string };
    onSubmit: (data: {
      stopCategory: string;
      stopType: string[];
      locationName: string;
      cityName: string;
      satCountryCode: string;
      satStateCode: string;
      satMunicipalityCode: string;
      postalCode: string;
      street: string;
      exteriorNumber: string;
      latitude: number;
      longitude: number;
    }) => Promise<void>;
  }) =>
    open ? (
      <div
        data-testid="stop-form-sheet"
        data-variant={variant ?? "sheet"}
        data-is-pending={isPending ? "true" : "false"}
      >
        <span>{heading}</span>
        <button
          type="button"
          disabled={Boolean(isPending)}
          onClick={() =>
            void onSubmit({
              stopCategory: initialData?.stopCategory ?? "origin",
              stopType: initialData?.stopType ?? ["origin", "pickup"],
              locationName: initialData?.locationName || "Patio norte",
              cityName: "Guadalajara",
              satCountryCode: "MEX",
              satStateCode: "JAL",
              satMunicipalityCode: "039",
              postalCode: "44100",
              street: "Calle Manual",
              exteriorNumber: "10",
              latitude: 20.67,
              longitude: -103.35,
            })
          }
        >
          submit-stop
        </button>
      </div>
    ) : null,
}));

const pickerItem = mocks.defaultPickerItem;

vi.mock("@shared/ui/address-picker", () => ({
  AddressPicker: ({
    onSelect,
    label,
    disabled,
  }: {
    onSelect: (item: AddressSearchListItem) => void;
    label?: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        onSelect(mocks.nextPickerItems.shift() ?? mocks.defaultPickerItem)
      }
    >
      {label}
    </button>
  ),
}));

const trip = {
  id: "trip-1",
  tripCode: "TR-001",
  status: TripStatus.DRAFT,
  clientId: "cli-1",
  originBranchId: null,
  cfdiDocumentIntent: "ingreso",
  scheduledDeparture: new Date("2026-08-14T10:00:00.000Z"),
  actualDeparture: null,
  originCity: "Guadalajara",
  originState: null,
  destinationCity: "Monterrey",
  destinationState: null,
} as Trip;

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
    sourceAddressId: pickerItem.id,
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

function renderTab(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("TripDetailRouteTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({});
    mocks.isPending = false;
    mocks.corridors = [];
    mocks.nextPickerItems = [];
  });

  it("shows the composer on empty route instead of Agregar parada opening a create sheet", () => {
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.getByText(copy.composer.title)).toBeInTheDocument();
    expect(screen.getAllByText(copy.composer.originSlot).length).toBeGreaterThan(0);
    expect(screen.getAllByText(copy.composer.destinationSlot).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: copy.action.addStop })).not.toBeInTheDocument();
    expect(screen.queryByTestId("stop-form-sheet")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.action.openFullEdit)).not.toBeInTheDocument();
  });

  it("shows read-only empty without composer when the route cannot be edited", () => {
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural={false}
      />,
    );

    expect(screen.getByText(copy.state.readOnlyEmpty)).toBeInTheDocument();
    expect(screen.queryByText(copy.composer.title)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.action.addStop })).not.toBeInTheDocument();
  });

  it("shows city hints without creating stops", () => {
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    expect(
      screen.getAllByText(copy.composer.cityHint("Guadalajara")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(copy.composer.cityHint("Monterrey")).length,
    ).toBeGreaterThan(0);
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("buffers origin alone and rejects the same address for destination", async () => {
    const user = userEvent.setup();
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.originSlot}: ${copy.composer.pickerLabel}`,
      }),
    );

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.getByText(`${copy.composer.selectedStop}: ${pickerItem.locationName}`),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}. ${copy.composer.cityHint("Monterrey")}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}: ${copy.composer.pickerLabel}`,
      }),
    );

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: copy.composer.duplicateEndpointAddress,
      }),
    );
    expect(screen.getByText(copy.alert.captureTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.composer.duplicateEndpointAddress)).toBeInTheDocument();
  });

  it("PUTs distinct origin and destination without owned addressId", async () => {
    const user = userEvent.setup();
    const destItem: AddressSearchListItem = {
      ...pickerItem,
      id: "22222222-2222-4222-8222-222222222222",
      locationName: "CEDIS Sur",
      latitude: 25.67,
      longitude: -100.32,
    };
    mocks.nextPickerItems = [pickerItem, destItem];

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.originSlot}: ${copy.composer.pickerLabel}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}. ${copy.composer.cityHint("Monterrey")}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}: ${copy.composer.pickerLabel}`,
      }),
    );

    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mocks.mutateAsync.mock.calls[0]?.[0] as Array<{
      stopType: string[];
      addressId?: string;
      sourceAddressId?: string;
      locationName?: string;
      distanceFromPreviousKm?: number;
    }>;
    expect(payload).toHaveLength(2);
    expect(payload[0]?.stopType).toContain(StopType.ORIGIN);
    expect(payload[1]?.stopType).toContain(StopType.DESTINATION);
    expect(payload[1]?.locationName).toBe("CEDIS Sur");
    expect(payload[1]?.distanceFromPreviousKm).toBeGreaterThan(0);
    expect(payload.every((stop) => stop.addressId == null)).toBe(true);
  });

  it("PUTs tenant warehouse without RFC plus client destination with RFC without a save-error toast", async () => {
    const user = userEvent.setup();
    const warehouseItem: AddressSearchListItem = {
      ...pickerItem,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      ownerType: "tenant",
      ownerId: "tenant-1",
      ownerLabel: "Empresa",
      addressType: "warehouse",
      locationName: "Almacen Norte",
      remitenteRfc: null,
      remitenteName: null,
    };
    const destItem: AddressSearchListItem = {
      ...pickerItem,
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      ownerType: "client",
      addressType: "shipping",
      locationName: "CEDIS cliente",
      remitenteRfc: "EKU9003173C9",
      remitenteName: "Cliente Destino SA",
      latitude: 25.67,
      longitude: -100.32,
    };
    mocks.nextPickerItems = [warehouseItem, destItem];

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.originSlot}: ${copy.composer.pickerLabel}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}. ${copy.composer.cityHint("Monterrey")}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}: ${copy.composer.pickerLabel}`,
      }),
    );

    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mocks.mutateAsync.mock.calls[0]?.[0] as Array<{
      sourceAddressId?: string;
      rfcRemitenteDestinatario?: string;
      nombreRemitenteDestinatario?: string;
      locationName?: string;
    }>;
    expect(payload).toHaveLength(2);
    expect(payload[0]?.sourceAddressId).toBe(warehouseItem.id);
    expect(payload[0]?.rfcRemitenteDestinatario).toBeUndefined();
    expect(payload[1]?.rfcRemitenteDestinatario).toBe("EKU9003173C9");
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.toast.stopsSaved }),
    );
    expect(mocks.toast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.toast.stopSaveError }),
    );
  });


  it("does not PUT a label-only name; Completar domicilio opens the form", async () => {
    const user = userEvent.setup();
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(
      screen.getByRole("button", { name: copy.composer.labelHatchToggle }),
    );
    await user.type(
      screen.getByLabelText(copy.composer.labelPlaceholder, {
        selector: "#trip-route-composer-origin-label",
      }),
      "Patio norte",
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    const sheet = screen.getByTestId("stop-form-sheet");
    expect(sheet).toHaveTextContent(copy.action.completeAddress);
    expect(sheet).toHaveAttribute("data-variant", "sheet");
    expect(
      screen.getByRole("button", { name: copy.composer.labelHatchToggle }),
    ).toBeInTheDocument();
  });

  it("PUTs picker destination together with origin captured in Completar domicilio", async () => {
    const user = userEvent.setup();
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}. ${copy.composer.cityHint("Monterrey")}`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}: ${copy.composer.pickerLabel}`,
      }),
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.getByText(`${copy.composer.selectedStop}: ${pickerItem.locationName}`),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.originSlot}. ${copy.composer.cityHint("Guadalajara")}`,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: copy.composer.labelHatchToggle }),
    );
    await user.type(
      screen.getByLabelText(copy.composer.labelPlaceholder, {
        selector: "#trip-route-composer-origin-label",
      }),
      "Tecnológico de Monterrey",
    );
    await user.click(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mocks.mutateAsync.mock.calls[0]?.[0] as Array<{
      stopType: string[];
      locationName?: string;
      sourceAddressId?: string;
    }>;
    expect(payload).toHaveLength(2);
    expect(payload[0]?.stopType).toContain(StopType.ORIGIN);
    expect(payload[0]?.locationName).toBe("Tecnológico de Monterrey");
    expect(payload[1]?.stopType).toContain(StopType.DESTINATION);
    expect(payload[1]?.locationName).toBe(pickerItem.locationName);
    expect(payload[1]?.sourceAddressId).toBe(pickerItem.id);
  });

  it("shows Sin domicilio on pending stops and Completar domicilio opens the form", async () => {
    const user = userEvent.setup();
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
      postalCode: null,
      satEstadoCode: null,
      latitude: null,
      longitude: null,
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.queryByText(/domicilio completo/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(copy.chip.missingAddress).length).toBeGreaterThan(0);
    expect(screen.getByText(copy.section.stops)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Destino\. CEDIS Sur/ }),
    );
    const completeButtons = screen.getAllByRole("button", {
      name: copy.action.completeAddress,
    });
    await user.click(completeButtons[0]!);
    const sheet = screen.getByTestId("stop-form-sheet");
    expect(sheet).toHaveTextContent(copy.format.completeAddressTitle(2));
    expect(sheet).toHaveAttribute("data-variant", "sheet");
    expect(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    ).toBeInTheDocument();
  });

  it("shows CorridorPicker when the tab is empty and corridors exist", () => {
    mocks.corridors = [
      {
        corridorKey: "gdl-mty",
        originCity: "Guadalajara",
        originState: "JAL",
        destinationCity: "Monterrey",
        destinationState: "NLE",
        stopCount: 2,
        tripCount: 3,
        lastUsedAt: "2026-08-10T18:00:00.000Z",
        sampleTripId: "trip-sample",
        stopsSnapshot: [],
      },
    ];

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.getByText("Guadalajara, JAL → Monterrey, NLE")).toBeInTheDocument();
  });

  it("does not show CorridorPicker when the trip already has stops", () => {
    mocks.corridors = [
      {
        corridorKey: "gdl-mty",
        originCity: "Guadalajara",
        originState: "JAL",
        destinationCity: "Monterrey",
        destinationState: "NLE",
        stopCount: 2,
        tripCount: 3,
        lastUsedAt: "2026-08-10T18:00:00.000Z",
        sampleTripId: "trip-sample",
        stopsSnapshot: [],
      },
    ];
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.queryByText("Guadalajara, JAL → Monterrey, NLE")).not.toBeInTheDocument();
    expect(screen.getByText(copy.section.stops)).toBeInTheDocument();
    expect(screen.queryByText(copy.composer.title)).not.toBeInTheDocument();
  });

  it("requires origin and destination before adding a waypoint", async () => {
    const user = userEvent.setup();
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.action.addWaypoint }));
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(screen.getByText(copy.alert.captureTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.composer.needBothEnds)).toBeInTheDocument();
  });

  it("uses the same itinerary in read-only without picker or add waypoint", () => {
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.IN_PROGRESS}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural={false}
      />,
    );

    expect(screen.getByText(copy.section.stops)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Origen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Destino/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.action.addWaypoint })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: `${copy.composer.originSlot}: ${copy.composer.pickerLabel}`,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.editStop }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.completeAddress }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.calculateDistances }),
    ).not.toBeInTheDocument();
  });

  it("opens Editar parada on a persisted stop with domicilio listo", async () => {
    const user = userEvent.setup();
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural
      />,
    );

    expect(
      screen.queryByRole("button", { name: copy.action.completeAddress }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.action.editStop }));
    const sheet = screen.getByTestId("stop-form-sheet");
    expect(sheet).toHaveTextContent(copy.format.editStopTitle(1));
    expect(sheet).toHaveAttribute("data-variant", "sheet");
    expect(
      screen.getByRole("button", { name: copy.action.editStop }),
    ).toBeInTheDocument();
  });

  it("does not show Editar parada together with Completar domicilio", async () => {
    const user = userEvent.setup();
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
      postalCode: null,
      satEstadoCode: null,
      latitude: null,
      longitude: null,
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Destino\. CEDIS Sur/ }),
    );
    expect(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.editStop }),
    ).not.toBeInTheDocument();
  });

  it("calculates missing segment distances when consecutive stops have coordinates", async () => {
    const user = userEvent.setup();
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
      latitude: 25.67,
      longitude: -100.31,
      distanceFromPreviousKm: null,
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.getByText(copy.alert.missingDistanceTitle)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.action.calculateDistances }),
    );

    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mocks.mutateAsync.mock.calls[0]?.[0] as Array<{
      stopType: string[];
      distanceFromPreviousKm?: number;
      distanceSource?: string;
    }>;
    expect(payload).toHaveLength(2);
    expect(payload[0]?.distanceFromPreviousKm).toBeUndefined();
    expect(payload[1]?.distanceFromPreviousKm).toBeGreaterThan(0);
    expect(payload[1]?.distanceSource).toBe("haversine_fallback");
  });

  it("asks to complete the address when missing distance cannot be calculated", () => {
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
      latitude: null,
      longitude: null,
      distanceFromPreviousKm: null,
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.getByText(copy.alert.missingDistanceTitle)).toBeInTheDocument();
    expect(
      screen.getByText(copy.alert.missingDistanceNeedsCoordsBody),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.calculateDistances }),
    ).not.toBeInTheDocument();
  });

  it("does not mount StopFormSheet while the sheet is closed", () => {
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop()]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.queryByTestId("stop-form-sheet")).not.toBeInTheDocument();
  });

  it("does not call replaceStops while a mutation is already pending", async () => {
    const user = userEvent.setup();
    mocks.isPending = true;
    mocks.corridors = [
      {
        corridorKey: "gdl-mty",
        originCity: "Guadalajara",
        originState: "JAL",
        destinationCity: "Monterrey",
        destinationState: "NLE",
        stopCount: 2,
        tripCount: 3,
        lastUsedAt: "2026-08-10T18:00:00.000Z",
        sampleTripId: "trip-sample",
        stopsSnapshot: [],
      },
    ];

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    const corridorButton = screen.getByRole("button", {
      name: /Guadalajara, JAL → Monterrey, NLE/i,
    });
    expect(corridorButton).toBeDisabled();
    await user.click(corridorButton);

    const originPicker = screen.getByRole("button", {
      name: `${copy.composer.originSlot}: ${copy.composer.pickerLabel}`,
    });
    expect(originPicker).toBeDisabled();
    await user.click(originPicker);

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("forwards isPending to StopFormSheet when editing a stop", async () => {
    const user = userEvent.setup();
    mocks.isPending = true;
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop(), dest]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.action.editStop }));

    const sheet = await screen.findByTestId("stop-form-sheet");
    expect(sheet).toHaveAttribute("data-is-pending", "true");
    expect(screen.getByRole("button", { name: "submit-stop" })).toBeDisabled();
  });
});
