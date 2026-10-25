import { describe, expect, it } from "vitest";

import { tripInvoicingFixture } from "../../test/tripInvoicingFixture";
import { listLinkedTripInvoiceDrafts } from "./listLinkedTripInvoiceDrafts";

describe("listLinkedTripInvoiceDrafts (F9 / D18)", () => {
  it("sin borradores → vacío", () => {
    expect(
      listLinkedTripInvoiceDrafts(
        tripInvoicingFixture({
          invoiceId: "inv-1",
          invoiceStatus: "stamped",
        }),
      ),
    ).toEqual([]);
  });

  it("principal draft → un id", () => {
    expect(
      listLinkedTripInvoiceDrafts(
        tripInvoicingFixture({
          invoiceId: "inv-draft",
          invoiceStatus: "draft",
          invoiceFolio: "F-9",
        }),
      ),
    ).toEqual([{ id: "inv-draft", source: "principal", folio: "F-9" }]);
  });

  it("principal + accesoria draft → dos ids (con folio)", () => {
    expect(
      listLinkedTripInvoiceDrafts(
        tripInvoicingFixture({
          invoiceId: "inv-flete",
          invoiceStatus: "draft",
          invoiceFolio: "  ",
          accessoryInvoices: [
            { id: "inv-acc", folio: "A-1", status: "draft", total: 100 },
            { id: "inv-acc-stamped", folio: "A-2", status: "stamped", total: 50 },
          ],
        }),
      ),
    ).toEqual([
      { id: "inv-flete", source: "principal", folio: null },
      { id: "inv-acc", source: "accessory", folio: "A-1" },
    ]);
  });

  it("solo accesoria draft (flete stamped) → un id", () => {
    expect(
      listLinkedTripInvoiceDrafts(
        tripInvoicingFixture({
          invoiceId: "inv-flete",
          invoiceStatus: "stamped",
          accessoryInvoices: [
            { id: "inv-acc", folio: "A-1", status: "draft", total: 100 },
          ],
        }),
      ),
    ).toEqual([{ id: "inv-acc", source: "accessory", folio: "A-1" }]);
  });
});
