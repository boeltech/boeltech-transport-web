import { describe, expect, it } from "vitest";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";

describe("company logo upload policy", () => {
  it("copy no longer mentions SVG", () => {
    expect(generalSettingsCopy.logo.hint).not.toMatch(/SVG/i);
    expect(generalSettingsCopy.logo.invalidType).not.toMatch(/SVG/i);
    expect(generalSettingsCopy.logo.hint).toMatch(/PNG/);
    expect(generalSettingsCopy.logo.hint).toMatch(/WebP/);
  });
});
