import { describe, expect, it } from "vitest";
import {
  parseRegisterCollectionSearch,
  resolvePremarkedIds,
} from "./registerCollectionQuery";

describe("parseRegisterCollectionSearch", () => {
  it("parses channel, client and premarked docs", () => {
    const parsed = parseRegisterCollectionSearch(
      "channel=with_invoice&clientId=c1&invoiceId=i1&invoiceIds=i2,i3&from=/finance/payments",
    );
    expect(parsed.channel).toBe("with_invoice");
    expect(parsed.clientId).toBe("c1");
    expect(parsed.invoiceIds).toEqual(["i1", "i2", "i3"]);
    expect(parsed.from).toBe("/finance/payments");
  });
});

describe("resolvePremarkedIds", () => {
  it("falls back to all when query empty", () => {
    expect(resolvePremarkedIds([], ["a", "b"])).toEqual(new Set(["a", "b"]));
  });

  it("intersects query with available ids", () => {
    expect(resolvePremarkedIds(["a", "x"], ["a", "b"])).toEqual(new Set(["a"]));
  });
});
