import { describe, expect, it } from "vitest";
import { parseTripWizardStepParam } from "./wizardStepFromSearchParams";

describe("parseTripWizardStepParam", () => {
  it("maps 1-based step and aliases to 0-based index", () => {
    expect(parseTripWizardStepParam(null)).toBe(0);
    expect(parseTripWizardStepParam("")).toBe(0);
    expect(parseTripWizardStepParam("2")).toBe(1);
    expect(parseTripWizardStepParam("route")).toBe(1);
    expect(parseTripWizardStepParam("3")).toBe(2);
    expect(parseTripWizardStepParam("cargo")).toBe(2);
    expect(parseTripWizardStepParam("1")).toBe(0);
    expect(parseTripWizardStepParam("5")).toBe(4);
  });

  it("falls back to 0 for invalid values", () => {
    expect(parseTripWizardStepParam("0")).toBe(0);
    expect(parseTripWizardStepParam("99")).toBe(0);
    expect(parseTripWizardStepParam("nope")).toBe(0);
  });
});
