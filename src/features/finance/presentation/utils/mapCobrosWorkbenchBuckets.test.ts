import { describe, expect, it } from "vitest";
import {
  DEFAULT_COBROS_BUCKET,
  COBROS_WORKBENCH_BUCKETS,
  isCobrosBucket,
  isCobrosListBucket,
} from "../config/cobrosWorkbenchConfig";
import {
  countsFromOpenPpdSummary,
  mapCobrosWorkbenchBuckets,
} from "../utils/mapCobrosWorkbenchBuckets";
import {
  cobrosInvoicesForPageToggle,
  isCobrosInvoiceSelectable,
  resolveCobrosSelectionAnchorRfc,
} from "../utils/cobrosSelection";
import type { FinanceInvoiceListItem } from "@features/finance/domain";

function invoice(
  overrides: Partial<FinanceInvoiceListItem> = {},
): FinanceInvoiceListItem {
  return {
    id: "inv-1",
    serie: "A",
    folio: 1,
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente A",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentMethod: "PPD",
    total: 100,
    balanceDue: 100,
    totalPaid: 0,
    tripCodes: [],
    status: "stamped",
    ...overrides,
  };
}

describe("cobrosWorkbenchConfig", () => {
  it("defaults to open and excludes overdue", () => {
    expect(DEFAULT_COBROS_BUCKET).toBe("open");
    expect(COBROS_WORKBENCH_BUCKETS).toEqual([
      "open",
      "partial",
      "rep_exceptions",
    ]);
    expect(isCobrosBucket("overdue")).toBe(false);
    expect(isCobrosBucket("all")).toBe(false);
    expect(isCobrosListBucket("open")).toBe(true);
    expect(isCobrosListBucket("rep_exceptions")).toBe(false);
  });
});

describe("countsFromOpenPpdSummary", () => {
  it("maps summary fields to strip counts", () => {
    expect(
      countsFromOpenPpdSummary({
        open: 42,
        partial: 7,
        repExceptions: 3,
        totalBalance: 125000.5,
      }),
    ).toEqual({
      open: 42,
      partial: 7,
      rep_exceptions: 3,
    });
  });
});

describe("mapCobrosWorkbenchBuckets", () => {
  it("builds strip without overdue and uses total balance on open", () => {
    const onBucketChange = () => undefined;
    const buckets = mapCobrosWorkbenchBuckets({
      counts: { open: 2, partial: 1, rep_exceptions: 4 },
      activeBucket: "open",
      onBucketChange,
      totalBalance: 1500,
    });

    expect(buckets.map((b) => b.id)).toEqual([
      "open",
      "partial",
      "rep_exceptions",
    ]);
    expect(buckets[0]?.description).toMatch(/\$/);
    expect(buckets.find((b) => b.id === "overdue")).toBeUndefined();
  });
});

describe("cobrosSelection", () => {
  const invoices = [
    invoice(),
    invoice({
      id: "inv-2",
      folio: 2,
      receiverRfc: "XEXX010101000",
      receiverName: "Cliente B",
    }),
    invoice({ id: "inv-3", folio: 3 }),
  ];

  it("anchors selection to the first selected invoice RFC", () => {
    expect(
      resolveCobrosSelectionAnchorRfc(invoices, { "inv-2": true }),
    ).toBe("XEXX010101000");
    expect(
      isCobrosInvoiceSelectable(invoices[0]!, "XEXX010101000"),
    ).toBe(false);
    expect(
      isCobrosInvoiceSelectable(invoices[1]!, "XEXX010101000"),
    ).toBe(true);
  });

  it("limits page toggle to the anchor RFC group", () => {
    expect(
      cobrosInvoicesForPageToggle(invoices, null).map((i) => i.id),
    ).toEqual(["inv-1", "inv-3"]);
    expect(
      cobrosInvoicesForPageToggle(invoices, "XEXX010101000").map((i) => i.id),
    ).toEqual(["inv-2"]);
  });
});
