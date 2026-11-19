import { describe, expect, it } from "vitest";

import type { TripLinkedInvoice } from "@features/trips/domain";
import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { resolveTripBillingSubstitution } from "./resolveTripBillingSubstitution";

const copy = billingCopy.substitute;

function linked(
  overrides: Partial<TripLinkedInvoice> & Pick<TripLinkedInvoice, "id">,
): TripLinkedInvoice {
  return {
    serie: "F",
    folio: 1,
    status: "stamped",
    billingScope: "primary_transport",
    splitLegId: null,
    attachCartaPorte: true,
    sharePercent: null,
    total: 31920,
    totalPaid: 0,
    balanceDue: 31920,
    stampedAt: "2026-11-12T14:00:00Z",
    parentInvoiceId: null,
    createdAt: "2026-11-12T13:00:00Z",
    ...overrides,
  };
}

describe("resolveTripBillingSubstitution", () => {
  it("detecta sustituta + original sin cancelar y arma historial", () => {
    const state = resolveTripBillingSubstitution([
      linked({
        id: "orig",
        folio: 1187,
        status: "stamped",
        createdAt: "2026-11-11T10:00:00Z",
        stampedAt: "2026-11-11T10:05:00Z",
      }),
      linked({
        id: "sub",
        folio: 1205,
        parentInvoiceId: "orig",
        createdAt: "2026-11-13T10:18:00Z",
        stampedAt: "2026-11-13T10:18:00Z",
      }),
    ]);

    expect(state.hasPartialSubstitution).toBe(true);
    expect(state.originalFolio).toBe("F-1187");
    expect(state.substituteFolio).toBe("F-1205");
    expect(state.originalInvoiceId).toBe("orig");
    expect(state.substituteInvoiceId).toBe("sub");
    expect(state.history[0]?.title).toBe(
      copy.historyCancelPending("F-1187"),
    );
    expect(state.history[0]?.active).toBe(true);
    expect(state.history[1]?.title).toBe(
      copy.historySubstituteStamped("F-1205", "F-1187"),
    );
    expect(state.history[2]?.title).toBe(copy.historyOriginalStamped("F-1187"));
  });

  it("cancellation_pending en original → copy de espera al receptor", () => {
    const state = resolveTripBillingSubstitution([
      linked({
        id: "orig",
        folio: 1,
        status: "cancellation_pending",
      }),
      linked({
        id: "sub",
        folio: 2,
        parentInvoiceId: "orig",
      }),
    ]);
    expect(state.hasPartialSubstitution).toBe(true);
    expect(state.history[0]?.title).toBe(copy.historyWaitingReceptor("F-1"));
  });

  it("original ya cancelada → sin parcial (historial informativo)", () => {
    const state = resolveTripBillingSubstitution([
      linked({
        id: "orig",
        folio: 1,
        status: "cancelled",
      }),
      linked({
        id: "sub",
        folio: 2,
        parentInvoiceId: "orig",
      }),
    ]);
    expect(state.hasPartialSubstitution).toBe(false);
    expect(state.history.length).toBeGreaterThan(0);
    expect(state.history.every((item) => !item.active)).toBe(true);
  });

  it("sin cadena → vacío", () => {
    const state = resolveTripBillingSubstitution([
      linked({ id: "only", folio: 3 }),
    ]);
    expect(state).toEqual({
      hasPartialSubstitution: false,
      originalInvoiceId: null,
      originalFolio: null,
      substituteInvoiceId: null,
      substituteFolio: null,
      history: [],
    });
  });
});
