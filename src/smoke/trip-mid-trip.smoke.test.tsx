/**
 * Smoke ADR-0093 E1 — mid-trip replan pending-only (E-F3).
 * Mock de API; no requiere backend ni PAC.
 *
 * Cubre: canReplanPendingStops · composer pending-only · sin CTA append ·
 * copy fiscal/delete · contrato tripsApi.replanStops.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  StopStatus,
  TripStatus,
  type Trip,
  type TripStop,
} from "@features/trips/domain";
import { getTripDetailAccess } from "@features/trips/presentation/pages/tripDetailAccess";
import { TripDetailRouteTab } from "@features/trips/presentation/components/trip-route/TripDetailRouteTab";
import { tripDetailCopy } from "@features/trips/presentation/copy";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";
import { resolveFiscalAttentionCta } from "@features/trips/presentation/helpers/resolveFiscalAttentionCta";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useReplaceTripStops: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useReplanTripStops: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useClientCorridors: () => ({
      data: [],
      isLoading: false,
    }),
  };
});

const TRIP_ID = "550e8400-e29b-41d4-a716-446655440001";

function makeStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: "stop-1",
    sequenceOrder: 1,
    stopType: ["origin", "pickup"],
    locationName: "Origen MX",
    city: "Monterrey",
    address: "Calle Origen 12345",
    status: StopStatus.COMPLETED,
    actualDeparture: new Date("2026-05-01T10:00:00.000Z"),
    ...overrides,
  } as TripStop;
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  const stops = [
    makeStop(),
    makeStop({
      id: "stop-2",
      sequenceOrder: 2,
      stopType: ["delivery"],
      locationName: "Escala NL",
      city: "Apodaca",
      status: StopStatus.PENDING,
      actualDeparture: null,
    }),
    makeStop({
      id: "stop-3",
      sequenceOrder: 3,
      stopType: ["destination", "delivery"],
      locationName: "Destino MX",
      city: "CDMX",
      status: StopStatus.PENDING,
      actualDeparture: null,
    }),
  ];
  return {
    id: TRIP_ID,
    status: TripStatus.IN_PROGRESS,
    tripCode: "VJ-MID-001",
    clientId: "client-1",
    stops,
    cfdiDocumentIntent: "ingreso",
    requiresFiscalAttention: true,
    invoicing: tripInvoicingFixture({
      invoiceId: "inv-1",
      invoiceStatus: "stamped",
      cartaPorteAttached: true,
      hasActiveInvoice: true,
      hasActivePrimaryInvoice: true,
    }),
    ...overrides,
  } as Trip;
}

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("smoke ADR-0093 trip mid-trip flexibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("access matrix: in_progress permite replan, no structural", () => {
    const access = getTripDetailAccess("in_progress", {
      canUpdateTrip: true,
      canCreateExpense: true,
      canUpdateExpense: true,
      canDeleteExpense: true,
    });
    expect(access.canEditStructural).toBe(false);
    expect(access.canAppendCargo).toBe(true);
    expect(access.canReplanPendingStops).toBe(true);
    expect(access.canAppendStops).toBe(true);
    expect(access.canReassignFleet).toBe(true);
    expect(access.canEditBaseRate).toBe(true);
  });

  it("copy D9 + fiscal/delete mid-trip labels", () => {
    expect(tripDetailCopy.route.hint.stopsMidTrip).toMatch(/paradas pendientes/i);
    expect(tripDetailCopy.route.hint.stopsMidTrip).toMatch(/destino/i);
    expect(tripDetailCopy.route.confirm.replanFiscalTitle).toMatch(/cambio de ruta/i);
    expect(tripDetailCopy.route.action.goToCargoTab).toBe("Ir a Cargas");
    expect(tripDetailCopy.route.action.reorderUp).toMatch(/Subir/i);
    expect(tripDetailCopy.shell.alert.fiscalAttentionCta).toBe(
      "Sustituir factura",
    );
    expect(tripDetailCopy.shell.alert.fiscalAttentionChip).toBe(
      "Atención fiscal",
    );
    expect(tripDetailCopy.costs.hint.inProgress).not.toMatch(/edición completa/i);
    expect(tripDetailCopy.costs.hint.inProgress).toMatch(/tarifa/i);
  });

  /**
   * T4-041-split — flag + CTA a porción (no prin).
   * Mock: requiresFiscalAttention + hasActiveSplit + ≥2 piernas con invoiceId.
   * No diluye asserts primary del caso anterior.
   */
  it("T4-041-split: flag + CTA porción sin depender de prin.invoiceId", () => {
    const trip = makeTrip({
      requiresFiscalAttention: true,
      invoicing: tripInvoicingFixture({
        invoiceId: null,
        invoiceStatus: null,
        cartaPorteAttached: false,
        hasActiveSplit: true,
        splitLegsTotal: 2,
        splitLegsInvoiced: 2,
      }),
    });
    expect(trip.requiresFiscalAttention).toBe(true);
    expect(trip.invoicing.hasActiveSplit).toBe(true);
    expect(trip.invoicing.invoiceId).toBeNull();

    const cta = resolveFiscalAttentionCta({
      requiresFiscalAttention: true,
      hasActiveSplit: true,
      principalInvoiceId: trip.invoicing.invoiceId,
      splitLegsReady: true,
      splitLegs: [
        {
          clientId: "client-a",
          sortOrder: 0,
          invoiceId: "inv-leg-a",
          clientLegalName: "Cliente A SA",
        },
        {
          clientId: "client-b",
          sortOrder: 1,
          invoiceId: "inv-leg-b",
          clientLegalName: "Cliente B SA",
        },
      ],
    });

    expect(cta.kind).toBe("split");
    if (cta.kind !== "split") return;
    expect(cta.bodyKey).toBe("withInvoices");
    expect(cta.invoicedLegs).toEqual([
      { invoiceId: "inv-leg-a", label: "Cliente A SA" },
      { invoiceId: "inv-leg-b", label: "Cliente B SA" },
    ]);

    expect(tripDetailCopy.shell.alert.fiscalAttentionSplitBody).toMatch(
      /cada porción/i,
    );
    expect(tripDetailCopy.shell.alert.fiscalAttentionSplitCta).toMatch(
      /porción/i,
    );
    expect(tripDetailCopy.shell.alert.fiscalAttentionSplitMenuCta).toMatch(
      /porción/i,
    );
    expect(
      tripDetailCopy.shell.alert.fiscalAttentionSplitLegCta("Cliente A SA"),
    ).toMatch(/Porción · Cliente A SA/);
    // Regresión primary: copy CTA estándar intacto
    expect(tripDetailCopy.shell.alert.fiscalAttentionCta).toBe(
      "Sustituir factura",
    );
  });

  it("tab Ruta mid-trip: composer pending-only, sin CTA append", () => {
    const trip = makeTrip();
    const orderedStops = trip.stops ?? [];

    render(
      <TestProviders>
        <TripDetailRouteTab
          trip={trip}
          tripStatus={TripStatus.IN_PROGRESS}
          orderedStops={orderedStops}
          progress={0}
          canEditStructural={false}
          canReplanPendingStops
        />
      </TestProviders>,
    );

    expect(
      screen.queryByRole("button", {
        name: tripDetailCopy.route.action.appendStopAtEnd,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: tripDetailCopy.route.action.addWaypoint,
      }),
    ).toBeInTheDocument();

    expect(
      document.querySelector('[data-route-composer-mode="pending-only"]'),
    ).not.toBeNull();

    expect(screen.getByText(tripDetailCopy.route.hint.stopsMidTrip)).toBeInTheDocument();
  });

  it("tripsApi expone replanStops / patchFleet / patchBaseRate", () => {
    expect(typeof tripsApi.replanStops).toBe("function");
    expect(typeof tripsApi.appendStops).toBe("function");
    expect(typeof tripsApi.patchFleet).toBe("function");
    expect(typeof tripsApi.patchBaseRate).toBe("function");
  });

  it("replan-edit payload conserva addressId de snapshot y matching de id", async () => {
    const {
      buildReplaceStopsPayload,
      mapTripStopToStopFormData,
    } = await import(
      "@features/trips/presentation/components/trip-route/buildReplaceStopsPayload"
    );
    const { toReplanPendingStops } = await import(
      "@features/trips/presentation/components/trip-route/buildReplanStopsPayload"
    );

    const snapshotId = "8e100ce1-718f-4012-8135-5ac616ad4980";
    const dest = makeStop({
      id: "stop-3",
      sequenceOrder: 3,
      stopType: ["destination", "delivery"],
      locationName: "Destino MX",
      city: "CDMX",
      addressId: snapshotId,
      status: StopStatus.PENDING,
      actualDeparture: null,
    });
    const origin = makeStop();
    const next = buildReplaceStopsPayload({
      existingStops: [origin, dest],
      submitted: {
        ...mapTripStopToStopFormData(dest),
        street: "Calle Nueva 99",
        cityName: "Ciudad de Mexico",
        stopCategory: "destination",
      },
      editingStopId: dest.id,
      preserveEditedSnapshotAddressId: true,
    });
    const pending = toReplanPendingStops({
      next,
      existing: [origin, dest],
      editingStopId: dest.id,
    });

    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe(dest.id);
    expect(pending[0]?.addressId).toBe(snapshotId);
    expect(pending[0]?.street).toBe("Calle Nueva 99");
  });

  it("soft-warn fiscal: copy de cierre listo para toast post-API", () => {
    expect(tripDetailCopy.tracking.sheet.quickCloseFiscalAttention.length).toBeGreaterThan(
      10,
    );
    expect(tripDetailCopy.tracking.sheet.quickCloseWarningTitle.length).toBeGreaterThan(
      3,
    );
  });

  it("F2 soft-hold copy: pre sheet + post toast listos", () => {
    expect(tripDetailCopy.operation.fleetAssignment.labels.softHoldGroup).toBe(
      "En reserva",
    );
    expect(
      tripDetailCopy.operation.fleetAssignment.alerts.softHoldTitle.length,
    ).toBeGreaterThan(3);
    expect(
      tripDetailCopy.operation.fleetAssignment.toasts.overlapWarningTitle.length,
    ).toBeGreaterThan(3);
  });

  it("F3: busy hard excluye draft; soft-hold no implica bloqueo", async () => {
    const { ACTIVE_ASSIGNMENT_TRIP_STATUSES } = await import(
      "@features/trips/application/hooks/trip/fetchActiveAssignmentTrips"
    );
    expect([...ACTIVE_ASSIGNMENT_TRIP_STATUSES]).toEqual([
      TripStatus.IN_PROGRESS,
      TripStatus.SCHEDULED,
    ]);
    expect(ACTIVE_ASSIGNMENT_TRIP_STATUSES).not.toContain(TripStatus.DRAFT);

    const softBody = tripDetailCopy.operation.fleetAssignment.alerts.softHoldBody({
      resourceLabel: "unidad",
      tripCode: "TRP-DRAFT-001",
    });
    expect(softBody).toMatch(/reserva/i);
    expect(softBody).toMatch(/puedes reasignar/i);
    expect(softBody).toMatch(/no bloquea/i);
    expect(
      tripDetailCopy.operation.fleetAssignment.toasts.overlapWarningTitle,
    ).toMatch(/reserva/i);
  });
});
