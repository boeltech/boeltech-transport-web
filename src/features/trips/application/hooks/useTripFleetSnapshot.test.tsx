import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { invoiceQueryKeys } from "@features/invoicing/application";
import { tripQueryKeys, type RefreshTripFleetSnapshotInput } from "@features/trips/domain";
import { fleetSnapshotViewFixture } from "@features/trips/test/tripFleetSnapshotFixture";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { createTestWrapper } from "@/test/renderWithProviders";
import { useRefreshTripFleetSnapshot, useTripFleetSnapshot } from "./useTripFleetSnapshot";

const { mockGet, mockRefresh } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@features/trips/infrastructure/tripFleetSnapshotApi", () => ({
  tripFleetSnapshotApi: { get: mockGet, refresh: mockRefresh },
}));

const TRIP_ID = "trip-1";

const input: RefreshTripFleetSnapshotInput = {
  blocks: { vehicle: true, driver: false },
  reason: "La placa se capturó mal en el catálogo.",
  expected: {
    snapshotUpdatedAt: "2026-10-01T14:00:00.000Z",
    masterFingerprint: { vehicle: "fp-veh-1" },
  },
};

const refreshResult = {
  fleetSnapshot: fleetSnapshotViewFixture().snapshot,
  refreshedBlocks: ["vehicle"],
  changedFields: ["license_plate"],
  requiresFiscalAttention: true,
  auditLogId: "audit-1",
  message: "ok",
};

describe("useTripFleetSnapshot", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRefresh.mockReset();
  });

  it("no consulta si está deshabilitado", () => {
    const { Wrapper } = createTestWrapper({ withRouter: false });
    renderHook(() => useTripFleetSnapshot(TRIP_ID, { enabled: false }), { wrapper: Wrapper });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("guarda la vista bajo la llave del viaje", async () => {
    const view = fleetSnapshotViewFixture();
    mockGet.mockResolvedValue(view);
    const { Wrapper, queryClient } = createTestWrapper({ withRouter: false });

    const { result } = renderHook(() => useTripFleetSnapshot(TRIP_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(view));
    expect(queryClient.getQueryData(tripQueryKeys.fleetSnapshot(TRIP_ID))).toEqual(view);
  });
});

describe("useRefreshTripFleetSnapshot", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRefresh.mockReset();
  });

  it("re-consulta el GET, lo deja en caché e invalida detalle, listados y facturas", async () => {
    const refreshedView = fleetSnapshotViewFixture({
      cpInvoice: { id: "inv-1", serie: "A", folio: 15, stampedAt: null },
      cpInvoiceOutdated: true,
    });
    mockRefresh.mockResolvedValue(refreshResult);
    mockGet.mockResolvedValue(refreshedView);
    const queryClient = createTestQueryClient({
      defaultOptions: { queries: { gcTime: Infinity } },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();
    const { Wrapper } = createTestWrapper({ queryClient, withRouter: false });

    const { result } = renderHook(() => useRefreshTripFleetSnapshot(TRIP_ID, { onSuccess }), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(mockRefresh).toHaveBeenCalledWith(TRIP_ID, input);
    expect(mockGet).toHaveBeenCalledWith(TRIP_ID);
    expect(queryClient.getQueryData(tripQueryKeys.fleetSnapshot(TRIP_ID))).toEqual(refreshedView);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(TRIP_ID),
      exact: true,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: tripQueryKeys.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: invoiceQueryKeys.details() });
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: tripQueryKeys.fleetSnapshot(TRIP_ID),
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0]![0]).toMatchObject({
      refreshedBlocks: ["vehicle"],
      view: refreshedView,
    });
  });

  it("si el GET posterior falla, el refresco cuenta como hecho e invalida la vista", async () => {
    mockRefresh.mockResolvedValue(refreshResult);
    mockGet.mockRejectedValue(new Error("network"));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { Wrapper } = createTestWrapper({ queryClient, withRouter: false });

    const { result } = renderHook(() => useRefreshTripFleetSnapshot(TRIP_ID), {
      wrapper: Wrapper,
    });
    let outcome: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync(input);
    });

    expect(outcome?.view).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.fleetSnapshot(TRIP_ID),
    });
  });
});
