import { describe, expect, it } from "vitest";

import { countTrailerPanelFilters } from "./trailerListFilters";

describe("countTrailerPanelFilters", () => {
  it("no cuenta el padrón sin recorte de estado", () => {
    expect(countTrailerPanelFilters({ status: "" })).toBe(0);
  });

  it("cuenta el estado como una unidad", () => {
    expect(countTrailerPanelFilters({ status: "available" })).toBe(1);
    expect(countTrailerPanelFilters({ status: "on_trip" })).toBe(1);
  });
});
