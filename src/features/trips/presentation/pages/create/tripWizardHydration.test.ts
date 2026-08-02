import { describe, expect, it } from "vitest";
import { shouldHydrateTripWizard } from "./tripWizardHydration";

describe("shouldHydrateTripWizard", () => {
  it("hydrates when nothing has been hydrated yet", () => {
    expect(shouldHydrateTripWizard(null, "trip-a")).toBe(true);
  });

  it("does not re-hydrate the same trip id after refetch identity change", () => {
    expect(shouldHydrateTripWizard("trip-a", "trip-a")).toBe(false);
  });

  it("hydrates when navigating to a different trip", () => {
    expect(shouldHydrateTripWizard("trip-a", "trip-b")).toBe(true);
  });
});
