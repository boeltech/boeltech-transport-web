import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  useCreateInvoice,
  useCancelInvoice,
  useSubstituteStampedInvoice,
  invoiceQueryKeys,
} from "./useInvoices";
import { tripQueryKeys } from "@features/trips/domain";
import { driverQueryKeys } from "@features/drivers/domain";
import { vehicleQueryKeys } from "@features/vehicles/domain";
import type {
  Invoice,
  SubstituteStampedInvoicePayload,
  SubstituteStampedInvoiceResult,
} from "@features/invoicing/domain";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const refetchQueries = vi.fn().mockResolvedValue(undefined);
const queryDataStore = new Map<string, unknown>();
const onSuccessSpy = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
    refetchQueries,
    getQueryData: (queryKey: readonly unknown[]) =>
      queryDataStore.get(JSON.stringify(queryKey)),
    setQueryData: (queryKey: readonly unknown[], data: unknown) => {
      queryDataStore.set(JSON.stringify(queryKey), data);
    },
  }),
}));

vi.mock("@features/invoicing/infrastructure", () => ({
  invoicingApi: {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getPayments: vi.fn(),
    getPrefillFromTrip: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    stamp: vi.fn(),
    cancel: vi.fn(),
    registerPayment: vi.fn(),
    substituteStampedInvoice: vi.fn(),
    openPdf: vi.fn(),
    downloadXml: vi.fn(),
  },
}));

describe("useCreateInvoice cache invalidation", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    refetchQueries.mockReset();
    refetchQueries.mockResolvedValue(undefined);
    onSuccessSpy.mockReset();
    useMutationMock.mockClear();
  });

  it("invalidates lists, finance root and trips without prefill", () => {
    const mutationConfig = useCreateInvoice({
      onSuccess: onSuccessSpy,
    }) as unknown as {
      onSuccess: (
        data: { id: string },
        variables: unknown,
        context: unknown,
        mutation: unknown,
      ) => void;
    };

    mutationConfig.onSuccess({ id: "inv-1" }, {}, {}, {});

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: invoiceQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["finance"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["trips"],
    });

    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ["invoices", "prefill"],
    });
    expect(onSuccessSpy).toHaveBeenCalled();
  });
});

describe("useCancelInvoice cache invalidation", () => {
  const tripId = "trip-linked-cancel";

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    refetchQueries.mockReset();
    refetchQueries.mockResolvedValue(undefined);
    onSuccessSpy.mockReset();
    useMutationMock.mockClear();
  });

  it("invalidates linked trip detail after cancellation", async () => {
    const mutationConfig = useCancelInvoice({
      onSuccess: onSuccessSpy,
    }) as unknown as {
      onSuccess: (
        data: Invoice,
        variables: { id: string; payload: unknown },
        context: unknown,
        mutation: unknown,
      ) => Promise<void>;
    };

    await mutationConfig.onSuccess(
      {
        id: "invoice-cancelled",
        trips: [
          {
            tripId,
            tripCode: "V-002",
            clientName: "Cliente",
            scheduledDeparture: "2026-06-01T10:00:00.000Z",
            originCity: "Durango",
            originState: "DUR",
            destinationCity: "Monterrey",
            destinationState: "NL",
            baseRate: 12000,
          },
        ],
      } as Invoice,
      { id: "invoice-cancelled", payload: {} },
      {},
      {},
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: invoiceQueryKeys.detail("invoice-cancelled"),
    });
    expect(onSuccessSpy).toHaveBeenCalled();
  });
});

describe("useSubstituteStampedInvoice cache invalidation", () => {
  const tripId = "trip-linked-1";
  const invoiceId = "invoice-original";

  const makeInvoice = (id: string, linkedTrips: Invoice["trips"]): Invoice =>
    ({
      id,
      trips: linkedTrips,
    }) as Invoice;

  const makeResult = (): SubstituteStampedInvoiceResult => ({
    replacement: makeInvoice("invoice-replacement", [
      {
        tripId,
        tripCode: "V-001",
        clientName: "Cliente",
        scheduledDeparture: "2026-06-01T10:00:00.000Z",
        originCity: "Monterrey",
        originState: "NL",
        destinationCity: "CDMX",
        destinationState: "CMX",
        baseRate: 43000,
      },
    ]),
    original: makeInvoice(invoiceId, [
      {
        tripId,
        tripCode: "V-001",
        clientName: "Cliente",
        scheduledDeparture: "2026-06-01T10:00:00.000Z",
        originCity: "Monterrey",
        originState: "NL",
        destinationCity: "CDMX",
        destinationState: "CMX",
        baseRate: 40000,
      },
    ]),
  });

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    refetchQueries.mockReset();
    refetchQueries.mockResolvedValue(undefined);
    onSuccessSpy.mockReset();
    useMutationMock.mockClear();
    queryDataStore.clear();
  });

  it("invalidates linked trip detail when only amount corrections were sent", async () => {
    const mutationConfig = useSubstituteStampedInvoice(invoiceId, {
      onSuccess: onSuccessSpy,
    }) as unknown as {
      onSuccess: (
        data: SubstituteStampedInvoiceResult,
        variables: {
          cancellationReason: string;
          corrections?: { subtotal?: number };
        },
        context: unknown,
        mutation: unknown,
      ) => Promise<void>;
    };

    await mutationConfig.onSuccess(
      makeResult(),
      {
        cancellationReason: "Corrección de tarifa",
        corrections: { subtotal: 43000 },
      },
      {},
      {},
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: invoiceQueryKeys.detail(invoiceId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: invoiceQueryKeys.detail("invoice-replacement"),
    });
    expect(onSuccessSpy).toHaveBeenCalled();
  });

  it("invalidates vehicle and driver caches when trip assignment corrections are sent", async () => {
    const oldVehicleId = "vehicle-old";
    const newVehicleId = "vehicle-new";
    const oldDriverId = "driver-old";
    const newDriverId = "driver-new";

    queryDataStore.set(JSON.stringify(tripQueryKeys.detail(tripId)), {
      id: tripId,
      vehicleId: oldVehicleId,
      driverId: oldDriverId,
    });

    const mutationConfig = useSubstituteStampedInvoice(invoiceId) as unknown as {
      onSuccess: (
        data: SubstituteStampedInvoiceResult,
        variables: SubstituteStampedInvoicePayload,
        context: unknown,
        mutation: unknown,
      ) => Promise<void>;
    };

    await mutationConfig.onSuccess(
      makeResult(),
      {
        cancellationReason: "Corregir unidad",
        corrections: {
          tripCorrections: [
            {
              tripId,
              vehicleId: newVehicleId,
              driverId: newDriverId,
              reason: "Unidad incorrecta en CFDI",
            },
          ],
        },
      },
      {},
      {},
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: vehicleQueryKeys.detail(oldVehicleId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: vehicleQueryKeys.detail(newVehicleId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.trips(oldDriverId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.trips(newDriverId),
    });
  });
});
