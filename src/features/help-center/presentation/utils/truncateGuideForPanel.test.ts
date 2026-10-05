import { describe, expect, it } from "vitest";
import { truncateGuideForPanel } from "./truncateGuideForPanel";

describe("truncateGuideForPanel", () => {
  it("keeps short guides intact", () => {
    const guide = "1. Uno\n2. Dos";
    expect(truncateGuideForPanel(guide)).toEqual({
      preview: guide,
      truncated: false,
    });
  });

  it("stops after maxSteps", () => {
    const guide = [
      "1. Uno",
      "2. Dos",
      "3. Tres",
      "4. Cuatro",
      "5. Cinco",
      "6. Seis",
      "7. Siete",
    ].join("\n");
    const result = truncateGuideForPanel(guide, { maxSteps: 5 });
    expect(result.truncated).toBe(true);
    expect(result.preview).toContain("5. Cinco");
    expect(result.preview).not.toContain("6. Seis");
  });

  it("stops when maxChars would be exceeded", () => {
    const guide = `1. ${"x".repeat(200)}\n2. ${"y".repeat(200)}\n3. ${"z".repeat(200)}`;
    const result = truncateGuideForPanel(guide, {
      maxSteps: 8,
      maxChars: 250,
    });
    expect(result.truncated).toBe(true);
    expect(result.preview.length).toBeLessThanOrEqual(250);
  });
});
