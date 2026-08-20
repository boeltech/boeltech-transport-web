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

  it("neutralizes formula prefixes on string cells (= + - @ tab CR)", () => {
    const content = buildCsvContent(
      ["a"],
      [
        ["=1+1"],
        ["=CMD|'/C calc'!A0"],
        ["+123"],
        ["-1500"],
        ["@SUM(A1)"],
        ["\tformula"],
        ["\rformula"],
      ],
    );

    expect(content).toContain("'=1+1");
    expect(content).toContain("'=CMD|'/C calc'!A0");
    expect(content).toContain("'+123");
    expect(content).toContain("'-1500");
    expect(content).toContain("'@SUM(A1)");
    expect(content).toContain("'\tformula");
    expect(content).toContain("'\rformula");
  });

  it("does not prefix typed negative numbers", () => {
    const content = buildCsvContent(["amount"], [[-42]]);

    expect(content).toContain("-42");
    expect(content).not.toContain("'-42");
  });

  it("quotes neutralized formula cells that also contain commas", () => {
    const content = buildCsvContent(["nota"], [["=foo,bar"]]);

    expect(content).toContain("\"'=foo,bar\"");
  });
});
