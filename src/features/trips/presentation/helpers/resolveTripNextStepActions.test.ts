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

  it("Programado billable: open_operate primaria; Facturar no eleva (D11)", () => {
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
      primary: { id: "open_operate" },
      secondaries: [],
    });
  });

  it("Programado no billable: open_operate primaria", () => {
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
      primary: { id: "open_operate" },
      secondaries: [],
    });
  });

  it("Programado con 1 borrador (D18): primaria open_operate; secundaria open_draft", () => {
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
      primary: { id: "open_operate" },
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

    expect(plan?.primary.id).toBe("open_operate");
    expect(plan?.secondaries).toEqual([{ id: "view_invoices" }]);
  });

  it("Programado create: sigue open_operate; borrador como secundaria", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      activeTab: "operation",
      linkedDraftInvoiceIds: ["inv-draft-1"],
    });

    expect(plan?.primary.id).toBe("open_operate");
    expect(plan?.secondaries).toEqual([
      { id: "open_draft", invoiceId: "inv-draft-1" },
    ]);
  });

  it("Programado en tab Seguimiento: sigue open_operate (abre sheet)", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.SCHEDULED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      activeTab: "tracking",
    });

    expect(plan).toEqual({
      phase: "scheduled",
      primary: { id: "open_operate" },
      secondaries: [],
    });
  });

  it("Programado sin update + billable: Facturar fallback", () => {
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

  it("Programado sin update ni billable: sin plan", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.SCHEDULED,
        routeReady: true,
        cargoReady: true,
        canUpdateTrip: false,
        canInvoice: false,
        activeTab: "tracking",
      }),
    ).toBeNull();
  });

  it("En ruta billable: open_operate primaria (D3 / HB-G2-CTA)", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.IN_PROGRESS,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      activeTab: "operation",
    });

    expect(plan?.phase).toBe("in_progress");
    expect(plan?.primary.id).toBe("open_operate");
    expect(plan?.secondaries).toHaveLength(0);
  });

  it("En ruta con ATF: open_operate (Facturar no eleva)", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.IN_PROGRESS,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
      requiresFiscalAttention: true,
      activeTab: "overview",
    });

    expect(plan?.primary.id).toBe("open_operate");
  });

  it("Completado billable: Facturar primaria", () => {
    const plan = resolveTripNextStepActions({
      status: TripStatus.COMPLETED,
      routeReady: true,
      cargoReady: true,
      canUpdateTrip: true,
      canInvoice: true,
    });

    expect(plan).toEqual({
      phase: "completed",
      primary: { id: "invoice" },
      secondaries: [],
    });
  });

  it("Completado sin billable: sin plan", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.COMPLETED,
        routeReady: true,
        cargoReady: true,
        canUpdateTrip: true,
        canInvoice: false,
      }),
    ).toBeNull();
  });

  it("Cancelado: sin plan", () => {
    expect(
      resolveTripNextStepActions({
        status: TripStatus.CANCELLED,
        routeReady: true,
        cargoReady: true,
        canUpdateTrip: true,
        canInvoice: true,
      }),
    ).toBeNull();
  });
});
