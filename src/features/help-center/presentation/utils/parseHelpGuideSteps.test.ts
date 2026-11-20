import { describe, expect, it } from "vitest";
import { parseHelpGuideSteps } from "./parseHelpGuideSteps";

describe("parseHelpGuideSteps", () => {
  it("extracts numbered steps", () => {
    const steps = parseHelpGuideSteps(
      "1. Primero.\n2. Segundo con **negrita**.\n3. Tercero.",
    );
    expect(steps).toEqual([
      "Primero.",
      "Segundo con **negrita**.",
      "Tercero.",
    ]);
  });

  it("returns empty when there are no numbered lines", () => {
    expect(parseHelpGuideSteps("- solo bullets\ntexto")).toEqual([]);
  });
});
