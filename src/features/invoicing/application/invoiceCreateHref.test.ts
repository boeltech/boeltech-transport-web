import { describe, expect, it } from "vitest";
import { buildInvoiceCreateHref } from "./invoiceCreateHref";

describe("buildInvoiceCreateHref", () => {
  it("abre flete+CP sin scope", () => {
    expect(buildInvoiceCreateHref({ tripId: "trip-1" })).toBe(
      "/invoices/new?trip_id=trip-1",
    );
  });

  it("abre scope accessory y false_trip", () => {
    expect(
      buildInvoiceCreateHref({ tripId: "trip-1", scope: "accessory" }),
    ).toBe("/invoices/new?trip_id=trip-1&scope=accessory");
    expect(
      buildInvoiceCreateHref({ tripId: "trip-1", scope: "false_trip" }),
    ).toBe("/invoices/new?trip_id=trip-1&scope=false_trip");
  });

  it("abre split_share con leg y attach_carta_porte", () => {
    expect(
      buildInvoiceCreateHref({
        tripId: "trip-1",
        scope: "split_share",
        legId: "leg-9",
        attachCartaPorte: true,
      }),
    ).toBe(
      "/invoices/new?trip_id=trip-1&scope=split_share&leg_id=leg-9&attach_carta_porte=1",
    );
  });
});
