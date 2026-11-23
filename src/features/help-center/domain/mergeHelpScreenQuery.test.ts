import { describe, expect, it } from "vitest";
import { mergeHelpScreenQuery } from "./mergeHelpScreenQuery";

describe("mergeHelpScreenQuery", () => {
  it("returns pathname when search and extras are empty", () => {
    expect(mergeHelpScreenQuery("/trips/abc", "", null)).toBe("/trips/abc");
    expect(mergeHelpScreenQuery("/trips/abc", "", undefined)).toBe("/trips/abc");
    expect(mergeHelpScreenQuery("/trips/abc", "?", {})).toBe("/trips/abc");
  });

  it("preserves location search without extras", () => {
    expect(mergeHelpScreenQuery("/trips/abc", "?tab=costs", null)).toBe(
      "/trips/abc?tab=costs",
    );
    expect(mergeHelpScreenQuery("/trips/abc", "tab=billing", null)).toBe(
      "/trips/abc?tab=billing",
    );
  });

  it("appends extras when search is empty", () => {
    expect(
      mergeHelpScreenQuery("/trips/abc", "", { status: "draft" }),
    ).toBe("/trips/abc?status=draft");
  });

  it("merges extras with search; extras win on the same key", () => {
    expect(
      mergeHelpScreenQuery("/trips/abc", "?tab=route&status=scheduled", {
        status: "draft",
      }),
    ).toBe("/trips/abc?tab=route&status=draft");
  });

  it("keeps unrelated search keys when adding status", () => {
    expect(
      mergeHelpScreenQuery("/trips/abc", "?tab=tracking", {
        status: "in_progress",
      }),
    ).toBe("/trips/abc?tab=tracking&status=in_progress");
  });
});
