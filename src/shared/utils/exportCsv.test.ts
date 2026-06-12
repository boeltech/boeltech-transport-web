import { describe, expect, it } from "vitest";
import { buildCsvContent } from "./exportCsv";

describe("buildCsvContent", () => {
  it("prefixes UTF-8 BOM so Excel renders special characters", () => {
    const content = buildCsvContent(["cliente"], [["ZAPATERIA HURTADO ÑERI"]]);

    expect(content.startsWith("\uFEFF")).toBe(true);
    expect(content).toContain("ZAPATERIA HURTADO ÑERI");
  });

  it("escapes commas and quotes in cells", () => {
    const content = buildCsvContent(["nota"], [['Cliente "A", SA']]);

    expect(content).toContain('"Cliente ""A"", SA"');
  });
});
