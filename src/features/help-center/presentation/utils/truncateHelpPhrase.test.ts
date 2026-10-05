import { describe, expect, it } from "vitest";
import { truncateHelpPhrase } from "./truncateHelpPhrase";

describe("truncateHelpPhrase", () => {
  it("returns short phrases unchanged", () => {
    expect(truncateHelpPhrase("Factura el viaje entregado")).toBe(
      "Factura el viaje entregado",
    );
  });

  it("truncates at max with ellipsis", () => {
    const long = "a".repeat(90);
    const out = truncateHelpPhrase(long, 80);
    expect(out.length).toBe(80);
    expect(out.endsWith("…")).toBe(true);
  });
});
