import { type ReactElement, useState } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import {
  StopType,
  TripStatus,
  type ClientCorridor,
  type Trip,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { TooltipProvider } from "@shared/ui/tooltip";

import { DESTINATION_ETA_MUST_BE_AFTER_DEPARTURE } from "../trip-detail-patch";
import { tripDetailCopy } from "../../copy";
import { TripDetailRouteTab } from "./TripDetailRouteTab";

const copy = tripDetailCopy.route;

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  replaceMutateAsync: vi.fn(),
  replanMutateAsync: vi.fn(),
  updateTripMutateAsync: vi.fn(),
  toast: vi.fn(),
  isPending: false,
  corridors: [] as ClientCorridor[],
  nextPickerItems: [] as AddressSearchListItem[],
  nextLocationValues: [] as import("@shared/ui/location").LocationValue[],
  /** Override ETA on next sheet submit (F9e). */
  nextEstimatedArrival: undefined as string | undefined,
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
    geocodingAccuracy: null,
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
    mutateAsync: (...args: unknown[]) => {
      mocks.replaceMutateAsync(...args);
      return mocks.mutateAsync(...args);
    },
    isPending: mocks.isPending,
  }),
  useReplanTripStops: () => ({
    mutateAsync: (...args: unknown[]) => {
      mocks.replanMutateAsync(...args);
      return mocks.mutateAsync(...args);
    },
    isPending: mocks.isPending,
  }),
  useUpdateTrip: () => ({
    mutateAsync: (...args: unknown[]) => mocks.updateTripMutateAsync(...args),
    isPending: false,
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

vi.mock("./TripStopSearchConfirmSheet", () => ({
  TripStopSearchConfirmSheet: ({
    open,
    heading,
    initialData,
    onSubmit,
    onOpenChange,
    isPending,
    initialStep,
    contextLine,
  }: {
    open: boolean;
    heading?: string;
    isPending?: boolean;
    initialStep?: "search" | "confirm";
    contextLine?: string | null;
    initialData?: {
      stopCategory?: string;
      stopType?: string[];
      locationName?: string;
      previousStopLabel?: string;
    };
    onOpenChange?: (open: boolean) => void;
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
  }) => {
    const [fieldError, setFieldError] = useState<string | null>(null);
    if (!open) return null;
    return (
      <div
        role="dialog"
        data-testid="stop-form-sheet"
        data-variant="sheet"
        data-step={initialStep ?? "confirm"}
        data-is-pending={isPending ? "true" : "false"}
        data-location-name={initialData?.locationName ?? ""}
        data-previous-stop-label={initialData?.previousStopLabel ?? ""}
      >
        <span data-testid="trip-stop-panel-stepper">Buscar Confirmar</span>
        {contextLine ? (
          <span data-testid="trip-stop-panel-context">{contextLine}</span>
        ) : null}
        <span>{heading}</span>
        {initialData?.locationName ? (
          <span data-testid="sheet-location-name">{initialData.locationName}</span>
        ) : null}
        {fieldError ? (
          <span data-testid="estimated-arrival-error">{fieldError}</span>
        ) : null}
        <button type="button" onClick={() => onOpenChange?.(false)}>
          dismiss-sheet
        </button>
        <button
          type="button"
          disabled={Boolean(isPending)}
          onClick={() => {
            const category = initialData?.stopCategory ?? "origin";
            const isOrigin = category === "origin";
            const queuedItem = mocks.nextPickerItems.shift();
            const queuedValue = mocks.nextLocationValues.shift();
            const etaOverride = mocks.nextEstimatedArrival;
            mocks.nextEstimatedArrival = undefined;
            setFieldError(null);
            void Promise.resolve(
              onSubmit({
                ...(initialData as Record<string, unknown>),
                stopCategory: category,
                stopType: initialData?.stopType ??
                  (isOrigin ? ["origin", "pickup"] : ["destination", "delivery"]),
                locationName:
                  queuedItem?.locationName ||
                  queuedValue?.locationName ||
                  initialData?.locationName ||
                  "Patio norte",
                cityName: isOrigin ? "Guadalajara" : "Monterrey",
                satCountryCode: "MEX",
                satStateCode:
                  queuedItem?.satStateCode ||
                  (isOrigin ? "JAL" : "NLE"),
                satMunicipalityCode:
                  queuedItem?.satMunicipalityCode || "039",
                postalCode:
                  queuedItem?.postalCode ||
                  queuedValue?.postalCode ||
                  (isOrigin ? "44100" : "64000"),
                street:
                  queuedItem?.street ||
                  queuedValue?.street ||
                  "Calle Manual",
                exteriorNumber:
                  queuedItem?.exteriorNumber ||
                  queuedValue?.exteriorNumber ||
                  "10",
                latitude:
                  queuedItem?.latitude ??
                  queuedValue?.latitude ??
                  (isOrigin ? 20.67 : 25.67),
                longitude:
                  queuedItem?.longitude ??
                  queuedValue?.longitude ??
                  (isOrigin ? -103.35 : -100.32),
                sourceAddressId: queuedItem?.id,
                ...(etaOverride !== undefined
                  ? { estimatedArrival: etaOverride }
                  : {}),
                ...(queuedItem
                  ? {
                      locationName: queuedItem.locationName,
                      sourceAddressId: queuedItem.id,
                      street: queuedItem.street,
                      exteriorNumber: queuedItem.exteriorNumber,
                      postalCode: queuedItem.postalCode,
                      satStateCode: queuedItem.satStateCode,
                      satMunicipalityCode: queuedItem.satMunicipalityCode,
                      latitude: queuedItem.latitude,
                      longitude: queuedItem.longitude,
                      rfcRemitenteDestinatario:
                        queuedItem.remitenteRfc ??
                        queuedItem.destinatarioRfc ??
                        "",
                      nombreRemitenteDestinatario:
                        queuedItem.remitenteName ??
                        queuedItem.destinatarioName ??
                        "",
                    }
                  : {}),
              }),
            ).catch((error: unknown) => {
              const fieldErrors =
                error &&
                typeof error === "object" &&
                "fieldErrors" in error &&
                error.fieldErrors &&
                typeof error.fieldErrors === "object"
                  ? (error.fieldErrors as Record<string, string>)
                  : null;
              if (fieldErrors?.estimatedArrival) {
                setFieldError(fieldErrors.estimatedArrival);
              }
            });
          }}
        >
          submit-stop
        </button>
      </div>
    );
  },
}));

const pickerItem = mocks.defaultPickerItem;

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationField: ({
      onChange,
      label,
      disabled,
    }: {
      onChange: (value: import("@shared/ui/location").LocationValue | null) => void;
      label?: string;
      disabled?: boolean;
    }) => (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const queued = mocks.nextLocationValues.shift();
          if (queued) {
            onChange(queued);
            return;
          }
          onChange(
            actual.locationValueFromInternal(
              mocks.nextPickerItems.shift() ?? mocks.defaultPickerItem,
            ),
          );
        }}
      >
        {label}
      </button>
    ),
  };
});

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
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>{ui}</TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("TripDetailRouteTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({});
    mocks.replaceMutateAsync.mockResolvedValue({});
    mocks.replanMutateAsync.mockResolvedValue({});
    mocks.updateTripMutateAsync.mockResolvedValue({});
    mocks.isPending = false;
    mocks.corridors = [];
    mocks.nextPickerItems = [];
    mocks.nextLocationValues = [];
    mocks.nextEstimatedArrival = undefined;
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
    expect(
      screen.queryByRole("button", { name: copy.composer.choosePlace }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.action.addStop })).not.toBeInTheDocument();
  });

  it("shows AmbosCiudad city slots with Elegir lugar without creating stops", async () => {
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

    expect(
      screen.getAllByText(copy.composer.cityHint("Guadalajara")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(copy.composer.cityHint("Monterrey")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(copy.composer.cityReserveHint).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/0 de 2 paradas/)).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();

    const chooseButtons = screen.getAllByRole("button", {
      name: copy.composer.choosePlace,
    });
    await user.click(chooseButtons[0]!);
    const sheet = screen.getByTestId("stop-form-sheet");
    expect(sheet).toBeInTheDocument();
    expect(sheet).toHaveAttribute("data-step", "search");
  });

  it("clears composer endpoint draft when orderedStops change externally", async () => {
    const user = userEvent.setup();
    const originStop = tripStop({ id: "stop-origin" });

    const { rerender } = renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

    // D-R3: tras confirmar origen queda Destino seleccionado; el draft se ve en el riel.
    expect(screen.getByText("Patio norte")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).length,
    ).toBeGreaterThan(0);

    rerender(
      <MemoryRouter>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <TripDetailRouteTab
            trip={trip}
            tripStatus={TripStatus.DRAFT}
            orderedStops={[originStop]}
            progress={0}
            canEditStructural
          />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    // Draft local se limpia; el origen pasa a ser la parada persistida (N=1 → composer).
    expect(screen.getByText(copy.composer.title)).toBeInTheDocument();
    expect(screen.getByText(originStop.locationName!)).toBeInTheDocument();
  });

  it("buffers origin alone and keeps destination Elegir lugar actionable (D-R3)", async () => {
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
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.composer.pendingOriginSaved }),
    );
    // Destino sigue con Elegir lugar → Sheet F9c (AmbosCiudad / RutaPrecargada).
    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId("stop-form-sheet")).toHaveAttribute(
      "data-step",
      "search",
    );
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
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));
    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

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
    expect(payload[1]?.distanceFromPreviousKm ?? 0).toBeGreaterThan(0);
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
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));
    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

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


  it("does not PUT from Elegir lugar alone; Sheet F9c opens in search", async () => {
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

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    const sheet = screen.getByTestId("stop-form-sheet");
    expect(sheet).toHaveTextContent(copy.panel.chooseOrigin);
    expect(sheet).toHaveAttribute("data-variant", "sheet");
    expect(sheet).toHaveAttribute("role", "dialog");
    expect(sheet).toHaveAttribute("data-step", "search");
    expect(screen.getByTestId("trip-stop-panel-context")).toHaveTextContent(
      copy.panel.contextLine("TR-001", 1, 2, copy.panel.roleOrigin),
    );
  });

  it("does not PUT create-new name+CP without coords; opens panel Confirmar", async () => {
    const user = userEvent.setup();
    mocks.nextLocationValues = [
      {
        locationName: "Altea",
        postalCode: "76127",
        street: null,
        latitude: null,
        longitude: null,
        satStateCode: null,
        geolocationPending: true,
        satAmbiguities: ["neighborhood"],
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

    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    // F8c — Elegir lugar abre Sheet F9c en Buscar (sin LocationSheet ADR-0092).
    const sheet = screen.getByTestId("stop-form-sheet");
    expect(sheet).toBeInTheDocument();
    expect(sheet).toHaveAttribute("data-variant", "sheet");
    expect(sheet).toHaveAttribute("role", "dialog");
    expect(sheet).toHaveAttribute("data-step", "search");
    expect(sheet).toHaveTextContent(copy.panel.chooseOrigin);
    expect(screen.getByTestId("trip-stop-panel-stepper")).toBeInTheDocument();
  });

  it("does not PUT when both create-new ends lack coords", async () => {
    const user = userEvent.setup();
    mocks.nextLocationValues = [
      {
        locationName: "Altea",
        postalCode: "76127",
        street: null,
        latitude: null,
        longitude: null,
        satStateCode: null,
        geolocationPending: true,
      },
      {
        locationName: "Estadio BBVA",
        postalCode: "67140",
        street: null,
        latitude: null,
        longitude: null,
        satStateCode: null,
        geolocationPending: true,
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

    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    // Origen abre Confirmar; sin coords el submit del mock sí tiene coords —
    // aquí solo verificamos que el pick no hace PUT directo.
    expect(screen.getByTestId("stop-form-sheet")).toBeInTheDocument();
    expect(mocks.toast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.toast.stopSaveError }),
    );
  });

  it("keeps destination draft after failed PUT when switching slots", async () => {
    const user = userEvent.setup();
    const destItem: AddressSearchListItem = {
      ...pickerItem,
      id: "22222222-2222-4222-8222-222222222222",
      locationName: "CEDIS Sur",
      postalCode: "64000",
      satStateCode: "NLE",
      latitude: 25.67,
      longitude: -100.31,
    };
    mocks.nextPickerItems = [pickerItem, destItem];
    mocks.mutateAsync.mockRejectedValueOnce(
      new Error("Datos de ubicación de parada inválidos"),
    );

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
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));
    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

    expect(mocks.mutateAsync).toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.toast.stopSaveError }),
    );

    // Tras fallo, el draft de origen (buffer previo) sigue en el composer.
    expect(screen.getByText("Bodega Alpha")).toBeInTheDocument();
    expect(screen.getByTestId("trip-route-unsaved-bar")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).length,
    ).toBeGreaterThan(0);
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

    mocks.nextPickerItems = [
      {
        ...pickerItem,
        id: "22222222-2222-4222-8222-222222222222",
        locationName: "CEDIS Sur",
        latitude: 25.67,
        longitude: -100.32,
      },
      {
        ...pickerItem,
        locationName: "Tecnológico de Monterrey",
      },
    ];

    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    // Tras confirmar destino se selecciona Origen (simétrico a D-R3).
    expect(screen.getByText("CEDIS Sur")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).length,
    ).toBeGreaterThan(0);

    await user.click(
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
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
    expect(payload[1]?.locationName).toBe("CEDIS Sur");
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
    expect(sheet).toHaveAttribute("role", "dialog");
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
      city: "Monterrey",
      distanceFromPreviousKm: 120,
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop({ city: "Guadalajara" }), dest]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.queryByText("Guadalajara, JAL → Monterrey, NLE")).not.toBeInTheDocument();
    expect(screen.getByText(copy.section.stops)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.composer.choosePlace }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/de 2 paradas/)).not.toBeInTheDocument();
    expect(screen.getByText(copy.section.distances)).toBeInTheDocument();
    expect(screen.getByText(copy.label.totalPlanned)).toBeInTheDocument();
    expect(screen.getByText(copy.hint.distancesBilling)).toBeInTheDocument();
    expect(document.getElementById("trip-route-map")).not.toBeNull();
  });

  it("keeps Agregar escala disabled until origin and destination (D49)", () => {
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[]}
        progress={0}
        canEditStructural
      />,
    );

    const addBtn = screen.getByRole("button", { name: copy.action.addWaypoint });
    expect(addBtn).toBeDisabled();
    expect(addBtn.closest("span")).toHaveAttribute(
      "title",
      copy.composer.needBothEnds,
    );
    expect(screen.getByText(copy.composer.title)).toBeInTheDocument();
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
      screen.queryByRole("button", { name: copy.composer.choosePlace }),
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
    const editButtons = screen.getAllByRole("button", {
      name: copy.action.editStop,
    });
    await user.click(editButtons[0]!);
    const sheet = screen.getByTestId("stop-form-sheet");
    expect(sheet).toHaveTextContent(copy.format.editStopTitle(1));
    expect(sheet).toHaveAttribute("data-variant", "sheet");
    expect(sheet).toHaveAttribute("role", "dialog");
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

    expect(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    ).toBeInTheDocument();
    // Destino incompleto: Completar; origen completo sigue con Editar (timeline).
    expect(
      screen.getAllByRole("button", { name: copy.action.editStop }).length,
    ).toBeGreaterThan(0);
    await user.click(
      screen.getByRole("button", { name: /Destino\. CEDIS Sur/ }),
    );
    expect(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    ).toBeInTheDocument();
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

  it("keeps composer with destination capture after confirming put-ready origin (D-R1/D-R3)", async () => {
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
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    // F9b — pick abre Confirmar; al Usar queda el destino accionable.
    expect(screen.getByTestId("stop-form-sheet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByText(copy.composer.title)).toBeInTheDocument();
    expect(screen.getByText(/1 de 2 paradas|0 de 2 paradas/)).toBeInTheDocument();
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.composer.pendingOriginSaved }),
    );
    expect(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.addWaypoint }),
    ).toBeDisabled();
  });

  it("opens composer for legacy N=1 with destination selected (D-R1/D-R4)", () => {
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[tripStop()]}
        progress={0}
        canEditStructural
      />,
    );

    expect(screen.getByText(copy.composer.title)).toBeInTheDocument();
    expect(screen.getByText(/1 de 2 paradas/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `${copy.composer.originSlot}. Bodega Alpha`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.addWaypoint }),
    ).toBeDisabled();
  });

  it("does not PUT Completar domicilio create when only one endpoint (sheet gate)", async () => {
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
      screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.composer.pendingOriginSaved }),
    );
    expect(screen.getByText(copy.composer.title)).toBeInTheDocument();
    expect(screen.queryByTestId("stop-form-sheet")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: copy.composer.choosePlace }).at(-1)!,
    ).toBeInTheDocument();
    expect(screen.getByText("Patio norte")).toBeInTheDocument();
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

    const originPicker = screen.getAllByRole("button", { name: copy.composer.choosePlace })[0]!;
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

    await user.click(
      screen.getAllByRole("button", { name: copy.action.editStop })[0]!,
    );

    const sheet = await screen.findByTestId("stop-form-sheet");
    expect(sheet).toHaveAttribute("data-is-pending", "true");
    expect(screen.getByRole("button", { name: "submit-stop" })).toBeDisabled();
  });

  it("confirms and PUTs remaining stops when removing a waypoint without cargos", async () => {
    const user = userEvent.setup();
    const origin = tripStop();
    const waypoint = tripStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala Norte",
    });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[origin, waypoint, dest]}
        progress={0}
        canEditStructural
        cargos={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Escala Norte/i }));
    await user.click(
      screen.getByRole("button", { name: copy.action.removeWaypoint }),
    );

    expect(
      await screen.findByText(copy.confirm.removeWaypointTitle),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.action.confirmRemoveWaypoint }),
    );

    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mocks.mutateAsync.mock.calls[0]?.[0] as Array<{
      locationName?: string;
      sequenceOrder: number;
    }>;
    expect(payload.map((stop) => stop.locationName)).toEqual([
      "Bodega Alpha",
      "CEDIS Sur",
    ]);
    expect(payload.map((stop) => stop.sequenceOrder)).toEqual([1, 2]);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: copy.toast.waypointRemoved }),
    );
  });

  it("blocks remove when a cargo movement is linked to the waypoint", async () => {
    const user = userEvent.setup();
    const origin = tripStop();
    const waypoint = tripStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.DELIVERY],
      locationName: "Escala Norte",
    });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });
    const cargos = [
      {
        id: "cargo-1",
        movements: [
          {
            stopId: "stop-wp",
            stopIndex: 1,
            movementType: "delivery",
            weight: null,
            units: null,
            completedAt: null,
            notes: null,
          },
        ],
      } as TripCargo,
    ];

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[origin, waypoint, dest]}
        progress={0}
        canEditStructural
        cargos={cargos}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Escala Norte/i }));
    await user.click(
      screen.getByRole("button", { name: copy.action.removeWaypoint }),
    );

    expect(
      await screen.findByText(copy.confirm.removeWaypointBlockedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.action.goToCargoTab }),
    ).toHaveAttribute("href", "/?tab=cargo");
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("does not show Eliminar escala when canEditStructural is false", async () => {
    const user = userEvent.setup();
    const waypoint = tripStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala Norte",
    });
    const dest = tripStop({
      id: "stop-2",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });

    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.IN_PROGRESS}
        orderedStops={[tripStop(), waypoint, dest]}
        progress={0}
        canEditStructural={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Escala Norte/i }));
    expect(
      screen.queryByRole("button", { name: copy.action.removeWaypoint }),
    ).not.toBeInTheDocument();
  });

  it("removes a draft waypoint slot locally without PUT", async () => {
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

    await user.click(screen.getByRole("button", { name: copy.action.addWaypoint }));
    expect(
      screen.getByRole("button", { name: copy.action.removeDraftWaypoint }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.action.removeDraftWaypoint }),
    );

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: copy.action.removeDraftWaypoint }),
    ).not.toBeInTheDocument();
  });

  it("does not show Eliminar escala on origin", async () => {
    renderTab(
      <TripDetailRouteTab
        trip={trip}
        tripStatus={TripStatus.DRAFT}
        orderedStops={[
          tripStop(),
          tripStop({
            id: "stop-2",
            sequenceOrder: 2,
            stopType: [StopType.DESTINATION, StopType.DELIVERY],
            locationName: "CEDIS Sur",
          }),
        ]}
        progress={0}
        canEditStructural
      />,
    );

    expect(
      screen.queryByRole("button", { name: copy.action.removeWaypoint }),
    ).not.toBeInTheDocument();
  });

  describe("F9e — Destino ETA → trip.scheduledArrival", () => {
    it("projects destination ETA via updateTrip after replace success", async () => {
      const user = userEvent.setup();
      mocks.nextEstimatedArrival = "2026-08-14T18:00";
      const dest = tripStop({
        id: "stop-2",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "CEDIS Sur",
        estimatedArrival: new Date("2026-08-14T16:00:00.000Z"),
      });

      renderTab(
        <TripDetailRouteTab
          trip={{
            ...trip,
            scheduledArrival: new Date("2026-08-14T12:00:00.000Z"),
          }}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), dest]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getAllByRole("button", { name: copy.action.editStop })[1]!,
      );
      expect(screen.getByTestId("stop-form-sheet")).toHaveTextContent(
        copy.format.editStopTitle(2),
      );
      await user.click(screen.getByRole("button", { name: "submit-stop" }));

      expect(mocks.replaceMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.updateTripMutateAsync).toHaveBeenCalledTimes(1);
      const updateArg = mocks.updateTripMutateAsync.mock.calls[0]?.[0] as {
        id: string;
        data: { scheduledArrival?: string; scheduledDeparture?: string };
      };
      expect(updateArg.id).toBe("trip-1");
      expect(updateArg.data.scheduledArrival).toBeDefined();
      expect(updateArg.data.scheduledDeparture).toBeDefined();
      expect(updateArg.data).not.toHaveProperty("stops");
    });

    it("does not call updateTrip when destination has no ETA", async () => {
      const user = userEvent.setup();
      mocks.nextEstimatedArrival = "";
      const dest = tripStop({
        id: "stop-2",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "CEDIS Sur",
        estimatedArrival: null,
      });

      renderTab(
        <TripDetailRouteTab
          trip={{
            ...trip,
            scheduledArrival: new Date("2026-08-14T18:00:00.000Z"),
          }}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), dest]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getAllByRole("button", { name: copy.action.editStop })[1]!,
      );
      await user.click(screen.getByRole("button", { name: "submit-stop" }));

      expect(mocks.replaceMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.updateTripMutateAsync).not.toHaveBeenCalled();
    });

    it("does not project when saving origin", async () => {
      const user = userEvent.setup();
      mocks.nextEstimatedArrival = "2026-08-14T18:00";

      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[
            tripStop(),
            tripStop({
              id: "stop-2",
              sequenceOrder: 2,
              stopType: [StopType.DESTINATION, StopType.DELIVERY],
              locationName: "CEDIS Sur",
            }),
          ]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getAllByRole("button", { name: copy.action.editStop })[0]!,
      );
      await user.click(screen.getByRole("button", { name: "submit-stop" }));

      expect(mocks.replaceMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.updateTripMutateAsync).not.toHaveBeenCalled();
    });

    it("projects destination ETA after mid-trip replan success", async () => {
      const user = userEvent.setup();
      mocks.nextEstimatedArrival = "2026-08-14T20:00";
      const origin = tripStop({
        id: "stop-origin",
        status: "completed",
        actualDeparture: new Date("2026-05-01T10:00:00.000Z"),
      });
      const dest = tripStop({
        id: "stop-dest",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "CEDIS Sur",
        estimatedArrival: new Date("2026-08-14T16:00:00.000Z"),
      });

      renderTab(
        <TripDetailRouteTab
          trip={{
            ...trip,
            status: TripStatus.IN_PROGRESS,
            scheduledArrival: null,
          }}
          tripStatus={TripStatus.IN_PROGRESS}
          orderedStops={[origin, dest]}
          progress={0}
          canEditStructural={false}
          canReplanPendingStops
        />,
      );

      await user.click(screen.getByRole("button", { name: /Destino\. CEDIS Sur/ }));
      await user.click(
        screen.getByRole("button", { name: copy.action.editStop }),
      );
      await user.click(screen.getByRole("button", { name: "submit-stop" }));

      expect(mocks.replanMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.replaceMutateAsync).not.toHaveBeenCalled();
      expect(mocks.updateTripMutateAsync).toHaveBeenCalledTimes(1);
    });

    it("toasts schedule error without reverting stops when updateTrip fails", async () => {
      const user = userEvent.setup();
      mocks.nextEstimatedArrival = "2026-08-14T18:00";
      mocks.updateTripMutateAsync.mockRejectedValueOnce(
        new Error("schedule failed"),
      );
      const dest = tripStop({
        id: "stop-2",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "CEDIS Sur",
      });

      renderTab(
        <TripDetailRouteTab
          trip={{ ...trip, scheduledArrival: null }}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), dest]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getAllByRole("button", { name: copy.action.editStop })[1]!,
      );
      await user.click(screen.getByRole("button", { name: "submit-stop" }));

      expect(mocks.replaceMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.updateTripMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: tripDetailCopy.operation.toast.scheduleUpdateError,
        }),
      );
    });
  });

  describe("F9g — Destino ETA ≤ salida bloquea Guardar", () => {
    it("blocks replace/updateTrip, shows inline ETA error, keeps sheet open, zero toasts", async () => {
      const user = userEvent.setup();
      // trip.scheduledDeparture = 2026-08-14T10:00Z → 04:00 CDMX; ETA igual = inválida
      mocks.nextEstimatedArrival = "2026-08-14T04:00";
      const dest = tripStop({
        id: "stop-2",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "CEDIS Sur",
        estimatedArrival: new Date("2026-08-14T16:00:00.000Z"),
      });

      renderTab(
        <TripDetailRouteTab
          trip={{
            ...trip,
            scheduledArrival: new Date("2026-08-14T16:00:00.000Z"),
          }}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), dest]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getAllByRole("button", { name: copy.action.editStop })[1]!,
      );
      expect(screen.getByTestId("stop-form-sheet")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "submit-stop" }));

      expect(mocks.replaceMutateAsync).not.toHaveBeenCalled();
      expect(mocks.replanMutateAsync).not.toHaveBeenCalled();
      expect(mocks.updateTripMutateAsync).not.toHaveBeenCalled();
      expect(
        await screen.findByTestId("estimated-arrival-error"),
      ).toHaveTextContent(DESTINATION_ETA_MUST_BE_AFTER_DEPARTURE);
      expect(screen.getByTestId("stop-form-sheet")).toBeInTheDocument();
      expect(mocks.toast).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: copy.toast.stopsSaved }),
      );
      expect(mocks.toast).not.toHaveBeenCalledWith(
        expect.objectContaining({
          title: tripDetailCopy.operation.toast.scheduleUpdateError,
        }),
      );
      expect(mocks.toast).not.toHaveBeenCalled();
    });

    it("does not block origin even with ETA before departure", async () => {
      const user = userEvent.setup();
      mocks.nextEstimatedArrival = "2026-08-14T04:00";

      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[
            tripStop(),
            tripStop({
              id: "stop-2",
              sequenceOrder: 2,
              stopType: [StopType.DESTINATION, StopType.DELIVERY],
              locationName: "CEDIS Sur",
            }),
          ]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getAllByRole("button", { name: copy.action.editStop })[0]!,
      );
      await user.click(screen.getByRole("button", { name: "submit-stop" }));

      expect(mocks.replaceMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.updateTripMutateAsync).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("estimated-arrival-error"),
      ).not.toBeInTheDocument();
    });
  });

  it("opens fiscal confirm dialog on replan when trip has stamped invoice, and executes on confirm", async () => {
    const user = userEvent.setup();
    const stampedTrip = {
      ...trip,
      status: TripStatus.IN_PROGRESS,
      invoicing: {
        invoiceId: "inv-1",
        invoiceStatus: "stamped",
        cartaPorteAttached: true,
      },
    } as Trip;
    const origin = tripStop({
      id: "stop-origin",
      status: "completed",
      actualDeparture: new Date("2026-05-01T10:00:00.000Z"),
    });
    const waypoint = tripStop({
      id: "stop-wp",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT, StopType.PICKUP],
      locationName: "Escala Norte",
    });
    const dest = tripStop({
      id: "stop-dest",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
    });

    renderTab(
      <TripDetailRouteTab
        trip={stampedTrip}
        tripStatus={TripStatus.IN_PROGRESS}
        orderedStops={[origin, waypoint, dest]}
        progress={0}
        canEditStructural={false}
        canReplanPendingStops
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Escala Norte/i }),
    );
    await user.click(
      screen.getAllByRole("button", { name: copy.action.editStop })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "submit-stop" }));

    expect(
      await screen.findByText(copy.confirm.replanFiscalTitle),
    ).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: copy.action.confirmFiscalReplan }),
    );

    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("shows Calcular distancias in mid-trip replan when fillable distances are missing", async () => {
    const user = userEvent.setup();
    const origin = tripStop({
      id: "stop-origin",
      status: "completed",
      actualDeparture: new Date("2026-05-01T10:00:00.000Z"),
    });
    const dest = tripStop({
      id: "stop-dest",
      sequenceOrder: 2,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      locationName: "CEDIS Sur",
      latitude: 25.67,
      longitude: -100.31,
      distanceFromPreviousKm: null,
    });

    renderTab(
      <TripDetailRouteTab
        trip={{ ...trip, status: TripStatus.IN_PROGRESS }}
        tripStatus={TripStatus.IN_PROGRESS}
        orderedStops={[origin, dest]}
        progress={0}
        canEditStructural={false}
        canReplanPendingStops
      />,
    );

    expect(screen.getByText(copy.alert.missingDistanceTitle)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.action.calculateDistances }),
    );

    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mocks.mutateAsync.mock.calls[0]?.[0] as Array<{
      id?: string;
      distanceFromPreviousKm?: number;
      distanceSource?: string;
    }>;
    expect(payload.some((stop) => stop.id === "stop-origin")).toBe(false);
    const destPayload = payload.find((stop) => stop.id === "stop-dest");
    expect(destPayload?.distanceFromPreviousKm).toBeGreaterThan(0);
    expect(destPayload?.distanceSource).toBe("haversine_fallback");
  });

  describe("waypoint reorder arrows", () => {
    const origin = () =>
      tripStop({
        id: "stop-origin",
        sequenceOrder: 1,
        locationName: "Origen GDL",
      });
    const waypointA = () =>
      tripStop({
        id: "stop-wp-1",
        sequenceOrder: 2,
        stopType: [StopType.WAYPOINT, StopType.PICKUP],
        locationName: "Escala A",
        latitude: 21.0,
        longitude: -102.0,
      });
    const waypointB = () =>
      tripStop({
        id: "stop-wp-2",
        sequenceOrder: 3,
        stopType: [StopType.WAYPOINT, StopType.PICKUP],
        locationName: "Escala B",
        latitude: 22.0,
        longitude: -101.0,
      });
    const dest = () =>
      tripStop({
        id: "stop-dest",
        sequenceOrder: 4,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "Destino MTY",
        latitude: 25.67,
        longitude: -100.31,
      });

    it("shows ↑↓ on draft with canEditStructural + canReplanPendingStops and ≥2 waypoints", () => {
      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[origin(), waypointA(), waypointB(), dest()]}
          progress={0}
          canEditStructural
          canReplanPendingStops
        />,
      );

      expect(
        screen.getAllByRole("button", { name: copy.action.reorderUp }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: copy.action.reorderDown }).length,
      ).toBeGreaterThan(0);
    });

    it("persists reorder via stops:replan (not replace) on draft", async () => {
      const user = userEvent.setup();
      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[origin(), waypointA(), waypointB(), dest()]}
          progress={0}
          canEditStructural
          canReplanPendingStops
        />,
      );

      const downButtons = screen.getAllByRole("button", {
        name: copy.action.reorderDown,
      });
      await user.click(downButtons[0]!);

      expect(mocks.replanMutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.replaceMutateAsync).not.toHaveBeenCalled();
    });

    it("shows ↑↓ on in_progress mid-trip replan", async () => {
      const midOrigin = tripStop({
        id: "stop-origin",
        status: "completed",
        actualDeparture: new Date("2026-05-01T10:00:00.000Z"),
        locationName: "Origen GDL",
      });
      renderTab(
        <TripDetailRouteTab
          trip={{ ...trip, status: TripStatus.IN_PROGRESS }}
          tripStatus={TripStatus.IN_PROGRESS}
          orderedStops={[midOrigin, waypointA(), waypointB(), dest()]}
          progress={0}
          canEditStructural={false}
          canReplanPendingStops
        />,
      );

      expect(
        screen.getAllByRole("button", { name: copy.action.reorderUp }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: copy.action.reorderDown }).length,
      ).toBeGreaterThan(0);
    });

    it("does not show ↑↓ when canReplanPendingStops is false", () => {
      renderTab(
        <TripDetailRouteTab
          trip={{ ...trip, status: TripStatus.COMPLETED }}
          tripStatus={TripStatus.COMPLETED}
          orderedStops={[origin(), waypointA(), waypointB(), dest()]}
          progress={100}
          canEditStructural={false}
          canReplanPendingStops={false}
        />,
      );

      expect(
        screen.queryByRole("button", { name: copy.action.reorderUp }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: copy.action.reorderDown }),
      ).not.toBeInTheDocument();
    });

    it("does not show ↑↓ with only one mutable waypoint", () => {
      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[origin(), waypointA(), dest()]}
          progress={0}
          canEditStructural
          canReplanPendingStops
        />,
      );

      expect(
        screen.queryByRole("button", { name: copy.action.reorderUp }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: copy.action.reorderDown }),
      ).not.toBeInTheDocument();
    });
  });

  describe("F9f — Cambiar destino seed + draft sticky", () => {
    const bambuDest = () =>
      tripStop({
        id: "stop-bambu",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION, StopType.DELIVERY],
        locationName: "Bambú Guadalajara",
        city: "Guadalajara",
        postalCode: "45050",
        latitude: 20.66,
        longitude: -103.4,
        street: "Av Bambú",
        exteriorNumber: "100",
      });

    const nissanPick: AddressSearchListItem = {
      ...pickerItem,
      id: "33333333-3333-4333-8333-333333333333",
      locationName: "Nissan Aguascalientes",
      street: "Carretera Panamericana",
      exteriorNumber: "500",
      postalCode: "20305",
      satStateCode: "AGU",
      satMunicipalityCode: "001",
      latitude: 21.88,
      longitude: -102.29,
    };

    const destinationPickerName = `${copy.composer.destinationSlot}: ${copy.composer.pickerLabel}`;

    it("seeds Confirm sheet with catalog pick (not persisted destination)", async () => {
      const user = userEvent.setup();
      mocks.nextPickerItems = [nissanPick];

      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), bambuDest()]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getByRole("button", { name: copy.action.changeDestination }),
      );
      await user.click(
        screen.getByRole("button", { name: destinationPickerName }),
      );

      const sheet = await screen.findByTestId("stop-form-sheet");
      expect(sheet).toHaveAttribute("data-step", "confirm");
      expect(screen.getByTestId("sheet-location-name")).toHaveTextContent(
        "Nissan Aguascalientes",
      );
      expect(sheet).not.toHaveAttribute(
        "data-location-name",
        "Bambú Guadalajara",
      );
      expect(sheet).toHaveAttribute("data-previous-stop-label", "Bodega Alpha");
      expect(sheet).toHaveTextContent(copy.panel.chooseDestination);
    });

    it("clears destination draft on sheet dismiss without Usar (no sticky)", async () => {
      const user = userEvent.setup();
      mocks.nextPickerItems = [nissanPick];

      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), bambuDest()]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getByRole("button", { name: copy.action.changeDestination }),
      );
      await user.click(
        screen.getByRole("button", { name: destinationPickerName }),
      );
      expect(await screen.findByTestId("stop-form-sheet")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "dismiss-sheet" }));
      expect(screen.queryByTestId("stop-form-sheet")).not.toBeInTheDocument();
      expect(
        screen.queryByText(copy.unsaved.draftEndpoints),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: copy.action.changeDestination }),
      );
      expect(
        screen.queryByText(
          new RegExp(`${copy.composer.selectedStop}:\\s*Nissan Aguascalientes`),
        ),
      ).not.toBeInTheDocument();
    });

    it("clears destination draft when Canceling change-destination panel", async () => {
      const user = userEvent.setup();
      mocks.nextPickerItems = [nissanPick];

      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), bambuDest()]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getByRole("button", { name: copy.action.changeDestination }),
      );
      // Pick opens sheet; dismiss leaves draft sticky without F9f cleanup —
      // then re-enter change dest, Cancel before another pick.
      await user.click(
        screen.getByRole("button", { name: destinationPickerName }),
      );
      await user.click(screen.getByRole("button", { name: "dismiss-sheet" }));

      await user.click(
        screen.getByRole("button", { name: copy.action.changeDestination }),
      );
      // Re-entry clears draft (handleChangeDestination); Cancel also clears.
      await user.click(screen.getByRole("button", { name: copy.action.cancel }));

      expect(
        screen.queryByText(copy.unsaved.draftEndpoints),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("stop-form-sheet")).not.toBeInTheDocument();
    });

    it("keeps editing a persisted stop seeded with that stop (CA6)", async () => {
      const user = userEvent.setup();

      renderTab(
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[tripStop(), bambuDest()]}
          progress={0}
          canEditStructural
        />,
      );

      await user.click(
        screen.getAllByRole("button", { name: copy.action.editStop })[1]!,
      );
      const sheet = await screen.findByTestId("stop-form-sheet");
      expect(sheet).toHaveTextContent(copy.format.editStopTitle(2));
      expect(screen.getByTestId("sheet-location-name")).toHaveTextContent(
        "Bambú Guadalajara",
      );
    });
  });
});
