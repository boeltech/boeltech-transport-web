import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import {
  listEligibleTripInvoiceScopes,
  resolveTripInvoiceScopeDecision,
  type ListEligibleTripInvoiceScopesInput,
  type PendingSplitLegForScope,
} from "./listEligibleTripInvoiceScopes";

const TRIP_ID = "trip-scope-1";

function baseInput(
  overrides: Partial<ListEligibleTripInvoiceScopesInput> = {},
): ListEligibleTripInvoiceScopesInput {
  return {
    tripId: TRIP_ID,
    status: TripStatus.SCHEDULED,
    operationalOutcome: "standard",
    cfdiEmissionIntent: "con_cfdi",
    canCreateInvoices: true,
    canGenerateInvoice: false,
    canGenerateFalseTripInvoice: false,
    canGenerateAccessoryInvoice: false,
    canGenerateSplitShareInvoice: false,
    hasActiveSplit: false,
    cartaPorteAttached: false,
    pendingSplitLegs: [],
    ...overrides,
  };
}

function leg(
  id: string,
  label: string,
  opts: Partial<PendingSplitLegForScope> = {},
): PendingSplitLegForScope {
  return {
    id,
    clientId: `client-${id}`,
    clientLegalName: label,
    clientRfc: null,
    suggestedCartaPorte: false,
    invoiceId: null,
    ...opts,
  };
}

describe("listEligibleTripInvoiceScopes", () => {
  it("returns empty when sin_cfdi_efectivo despite canGenerate flags", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        cfdiEmissionIntent: "sin_cfdi_efectivo",
        canGenerateInvoice: true,
        canGenerateFalseTripInvoice: true,
        canGenerateAccessoryInvoice: true,
        canGenerateSplitShareInvoice: true,
        pendingSplitLegs: [leg("l1", "A")],
      }),
    );
    expect(scopes).toEqual([]);
  });

  it("returns empty when trip is cancelled", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        status: TripStatus.CANCELLED,
        canGenerateInvoice: true,
        canGenerateAccessoryInvoice: true,
      }),
    );
    expect(scopes).toEqual([]);
  });

  it("returns empty without invoices.create", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        canCreateInvoices: false,
        canGenerateInvoice: true,
      }),
    );
    expect(scopes).toEqual([]);
  });

  it("lists primary_transport when canGenerateInvoice", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({ canGenerateInvoice: true }),
    );
    expect(scopes).toEqual([
      {
        kind: "primary_transport",
        destinations: [{ href: `/invoices/new?trip_id=${TRIP_ID}` }],
      },
    ]);
  });

  it("lists false_trip when eligible and primary create is blocked", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        operationalOutcome: "false_trip",
        canGenerateInvoice: true,
        canGenerateFalseTripInvoice: true,
        canGenerateAccessoryInvoice: true,
      }),
    );
    expect(scopes.map((s) => s.kind)).toEqual(["false_trip"]);
    expect(scopes[0]!.destinations[0]!.href).toBe(
      `/invoices/new?trip_id=${TRIP_ID}&scope=false_trip`,
    );
  });

  it("lists primary + accessory when both create CTAs are true", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        canGenerateInvoice: true,
        canGenerateAccessoryInvoice: true,
      }),
    );
    expect(scopes.map((s) => s.kind)).toEqual([
      "primary_transport",
      "accessory",
    ]);
  });

  it("lists split_share destinations for pending legs only", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        canGenerateSplitShareInvoice: true,
        hasActiveSplit: true,
        pendingSplitLegs: [
          leg("leg-a", "Cliente A", { suggestedCartaPorte: true }),
          leg("leg-b", "Cliente B"),
        ],
      }),
    );
    expect(scopes).toHaveLength(1);
    expect(scopes[0]!.kind).toBe("split_share");
    expect(scopes[0]!.destinations).toEqual([
      {
        href: `/invoices/new?trip_id=${TRIP_ID}&scope=split_share&leg_id=leg-a&attach_carta_porte=1`,
        legId: "leg-a",
        legLabel: "Cliente A",
      },
      {
        href: `/invoices/new?trip_id=${TRIP_ID}&scope=split_share&leg_id=leg-b`,
        legId: "leg-b",
        legLabel: "Cliente B",
      },
    ]);
  });

  it("hides primary when hasActiveSplit even if canGenerateInvoice", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        canGenerateInvoice: true,
        hasActiveSplit: true,
        canGenerateSplitShareInvoice: true,
        pendingSplitLegs: [leg("leg-a", "A")],
      }),
    );
    expect(scopes.map((s) => s.kind)).toEqual(["split_share"]);
  });
});

describe("resolveTripInvoiceScopeDecision", () => {
  it("none when 0 scopes", () => {
    expect(resolveTripInvoiceScopeDecision([])).toEqual({ kind: "none" });
  });

  it("navigate when 1 scope and 1 destination", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({ canGenerateInvoice: true }),
    );
    expect(resolveTripInvoiceScopeDecision(scopes)).toEqual({
      kind: "navigate",
      href: `/invoices/new?trip_id=${TRIP_ID}`,
    });
  });

  it("open_sheet split_legs when only split with N>1 pending legs", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        canGenerateSplitShareInvoice: true,
        hasActiveSplit: true,
        pendingSplitLegs: [leg("a", "A"), leg("b", "B")],
      }),
    );
    const decision = resolveTripInvoiceScopeDecision(scopes);
    expect(decision).toMatchObject({
      kind: "open_sheet",
      variant: "split_legs",
    });
    if (decision.kind === "open_sheet") {
      expect(decision.scopes).toHaveLength(1);
      expect(decision.scopes[0]!.destinations).toHaveLength(2);
    }
  });

  it("navigate with leg_id when only split with 1 pending leg", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        canGenerateSplitShareInvoice: true,
        hasActiveSplit: true,
        pendingSplitLegs: [leg("only", "Único")],
      }),
    );
    expect(resolveTripInvoiceScopeDecision(scopes)).toEqual({
      kind: "navigate",
      href: `/invoices/new?trip_id=${TRIP_ID}&scope=split_share&leg_id=only`,
    });
  });

  it("open_sheet full when >1 scopes", () => {
    const scopes = listEligibleTripInvoiceScopes(
      baseInput({
        canGenerateInvoice: true,
        canGenerateAccessoryInvoice: true,
      }),
    );
    expect(resolveTripInvoiceScopeDecision(scopes)).toEqual({
      kind: "open_sheet",
      variant: "full",
      scopes,
    });
  });
});
