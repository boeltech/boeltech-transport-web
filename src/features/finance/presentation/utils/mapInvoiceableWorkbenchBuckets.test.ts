import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import type { TripListItem } from "@features/trips/domain";
import {
  classifyInvoiceableBucket,
  countTripsByBucket,
  countsFromInvoiceableSummary,
} from "./mapInvoiceableWorkbenchBuckets";

function tripListItem(
  overrides: {
    operationalOutcome?: string | null;
    invoicing?: Parameters<typeof tripInvoicingFixture>[0];
  } = {},
): TripListItem {
  return {
    id: "trip-1",
    tripCode: "TRP-1",
    status: TripStatus.COMPLETED,
    operationalOutcome: overrides.operationalOutcome ?? "standard",
    invoicing: tripInvoicingFixture(overrides.invoicing),
  } as TripListItem;
}

describe("classifyInvoiceableBucket", () => {
  it("marca ready con canGenerateInvoice y sin split", () => {
    expect(
      classifyInvoiceableBucket(
        tripListItem({ invoicing: { canGenerateInvoice: true } }),
      ),
    ).toBe("ready");
  });

  it("marca ready en false_trip con CTA", () => {
    expect(
      classifyInvoiceableBucket(
        tripListItem({
          operationalOutcome: "false_trip",
          invoicing: { canGenerateFalseTripInvoice: true },
        }),
      ),
    ).toBe("ready");
  });

  it("marca proration_pending con split + canGenerateSplitShareInvoice", () => {
    expect(
      classifyInvoiceableBucket(
        tripListItem({
          invoicing: {
            hasActiveSplit: true,
            canGenerateSplitShareInvoice: true,
            splitLegsInvoiced: 0,
            splitLegsTotal: 2,
          },
        }),
      ),
    ).toBe("proration_pending");
  });

  it("marca blocked con split activo sin CTA de porción", () => {
    expect(
      classifyInvoiceableBucket(
        tripListItem({
          invoicing: {
            hasActiveSplit: true,
            canGenerateSplitShareInvoice: false,
            blockReason: "Completa la ruta",
          },
        }),
      ),
    ).toBe("blocked");
  });

  it("marca blocked sin CTA primaria", () => {
    expect(classifyInvoiceableBucket(tripListItem())).toBe("blocked");
  });
});

describe("countTripsByBucket", () => {
  it("cuenta por bucket", () => {
    expect(
      countTripsByBucket([
        tripListItem({ invoicing: { canGenerateInvoice: true } }),
        tripListItem({
          invoicing: {
            hasActiveSplit: true,
            canGenerateSplitShareInvoice: true,
          },
        }),
        tripListItem({
          invoicing: { hasActiveSplit: true },
        }),
      ]),
    ).toEqual({
      ready: 1,
      proration_pending: 1,
      blocked: 1,
    });
  });
});

describe("countsFromInvoiceableSummary", () => {
  it("mapea camelCase del summary a ids de bucket", () => {
    expect(
      countsFromInvoiceableSummary({
        ready: 2,
        prorationPending: 3,
        blocked: 1,
      }),
    ).toEqual({
      ready: 2,
      proration_pending: 3,
      blocked: 1,
    });
  });
});
