import { describe, expect, it } from "vitest";

import { TripStatus } from "@features/trips/domain";

import { resolveTripNextStepActions } from "./resolveTripNextStepActions";

describe("resolveTripNextStepActions", () => {
  it("Reserva incompleta: primaria Completar ruta/cargas; secundaria Ir a Cargas", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.DRAFT,
      routeReady: false,
      cargoReady: false,
      canUpdateTrip: true,
      canInvoice: false,
    });

    expect(plan).toEqual({
      phase: "draft_incomplete",
      primary: { id: "complete_route_cargo", tab: "route" },
      secondaries: [{ id: "go_to_cargo", tab: "cargo" }],
    });
  });

  it("Reserva incompleta solo cargas: primaria tab cargo; secundaria Ir a Ruta", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.DRAFT,
      routeReady: true,
      cargoReady: false,
      canUpdateTrip: true,
      canInvoice: false,
    });

    expect(plan?.primary).toEqual({
      id: "complete_route_cargo",
      tab: "cargo",
    });
    expect(plan?.secondaries).toEqual([{ id: "go_to_route", tab: "route" }]);
  });

  it("Reserva lista: primaria Confirmar; ≤2 secundarias ajustar ruta/cargas", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.DRAFT,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
    });

    expect(plan).toEqual({
      phase: "draft_ready",
      primary: { id: "confirm_reserve" },
      secondaries: [
        { id: "go_to_route", tab: "route" },
        { id: "go_to_cargo", tab: "cargo" },
      ],
    });
  });

  it("Reserva sin permiso update: sin plan", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.DRAFT,
        routeReady: false,
        cargoReady: false,
        canUpdateTrip: false,
        canInvoice: false,
      }),
    ).toBeNull();
  });

  it("Programado billable: Facturar primaria; Seguimiento secundaria", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      activeTab: "overview",
    });

    expect(plan).toEqual({
      phase: "scheduled",
      primary: { id: "invoice" },
      secondaries: [{ id: "go_to_tracking", tab: "tracking" }],
    });
  });

  it("Programado no billable: Seguimiento primaria; sin secundarias", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: false,
      activeTab: "operation",
    });

    expect(plan).toEqual({
      phase: "scheduled",
      primary: { id: "go_to_tracking", tab: "tracking" },
      secondaries: [],
    });
  });

  it("Programado con 1 borrador (D18): primaria tracking; secundaria open_draft", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: false,
      activeTab: "operation",
      linkedDraftInvoiceIds: ["inv-draft-1"],
    });

    expect(plan).toEqual({
      phase: "scheduled",
      primary: { id: "go_to_tracking", tab: "tracking" },
      secondaries: [{ id: "open_draft", invoiceId: "inv-draft-1" }],
    });
  });

  it("Programado con N borradores (D18): secundaria view_invoices", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: false,
      activeTab: "operation",
      linkedDraftInvoiceIds: ["inv-a", "inv-b"],
    });

    expect(plan?.primary.id).toBe("go_to_tracking");
    expect(plan?.secondaries).toEqual([{ id: "view_invoices" }]);
  });

  it("Programado create eleva Facturar: no secundaria borrador (D10)", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      activeTab: "operation",
      linkedDraftInvoiceIds: ["inv-draft-1"],
    });

    expect(plan?.primary.id).toBe("invoice");
    expect(plan?.secondaries).toEqual([
      { id: "go_to_tracking", tab: "tracking" },
    ]);
  });

  it("Programado en tab Seguimiento + billable: solo Facturar", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: false,
      canInvoice: true,
      activeTab: "tracking",
    });

    expect(plan).toEqual({
      phase: "scheduled",
      primary: { id: "invoice" },
      secondaries: [],
    });
  });

  it("Programado en Seguimiento sin billable: sin plan", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.SCHEDULED,
        routeReady: true,
        cargoReady: true,
        canUpdateTrip: true,
        canInvoice: false,
        activeTab: "tracking",
      }),
    ).toBeNull();
  });

  it("Programado + Seguimiento + borradores: sin plan (D19 confirmada F10)", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.SCHEDULED,
        routeReady: true,
        cargoReady: true,
        canUpdateTrip: true,
        canInvoice: false,
        activeTab: "tracking",
        linkedDraftInvoiceIds: ["inv-a", "inv-b"],
      }),
    ).toBeNull();
  });

  it("En ruta billable: misma jerarquía que Programado", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.IN_PROGRESS,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      activeTab: "operation",
    });

    expect(plan?.phase).toBe("in_progress");
    expect(plan?.primary.id).toBe("invoice");
    expect(plan?.secondaries).toHaveLength(1);
  });

  it("En ruta con ATF: no eleva Facturar; Seguimiento es primaria (F4)", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.IN_PROGRESS,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      requiresFiscalAttention: true,
      activeTab: "operation",
    });

    expect(plan?.phase).toBe("in_progress");
    expect(plan?.primary.id).toBe("go_to_tracking");
    expect(plan?.secondaries).toEqual([]);
  });

  it("En ruta con ATF ya en Seguimiento: sin next-step (banner ATF es el job)", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.IN_PROGRESS,
        routeReady: true,
        cargoReady: true,
        canUpdateTrip: true,
        canInvoice: true,
        requiresFiscalAttention: true,
        activeTab: "tracking",
      }),
    ).toBeNull();
  });

  it("Completado billable (freight-family): Facturar; sin secundarias", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.COMPLETED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: false,
      canInvoice: true,
    });

    expect(plan).toEqual({
      phase: "completed",
      primary: { id: "invoice" },
      secondaries: [],
    });
  });

  it("Completado solo accessory (canInvoice false / D10): sin next-step", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.COMPLETED,
        routeReady: true,
        cargoReady: true,
        canUpdateTrip: false,
        canInvoice: false,
      }),
    ).toBeNull();
  });

  it("Programado solo accessory (canInvoice false / D10): Seguimiento, no Facturar", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: false,
      activeTab: "operation",
    });

    expect(plan).toEqual({
      phase: "scheduled",
      primary: { id: "go_to_tracking", tab: "tracking" },
      secondaries: [],
    });
    expect(plan?.primary.id).not.toBe("invoice");
  });

  it("nunca devuelve más de 2 secundarias", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.DRAFT,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: false,
    });
    expect(plan?.secondaries.length).toBeLessThanOrEqual(2);
  });
});
