import { describe, expect, it } from "vitest";
import {
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_LIGHT,
  resolveMapboxStyle,
} from "./mapboxStyles";

describe("resolveMapboxStyle", () => {
  it("returns light style for light theme", () => {
    expect(resolveMapboxStyle("light")).toBe(MAPBOX_STYLE_LIGHT);
  });

  it("returns dark style for dark theme", () => {
    expect(resolveMapboxStyle("dark")).toBe(MAPBOX_STYLE_DARK);
  });
});
