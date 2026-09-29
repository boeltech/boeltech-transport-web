import { describe, expect, it } from "vitest";

import {
  countUserActivityPanelFilters,
  resolveUserActivityEmptyKind,
} from "./userActivityFilters";

describe("countUserActivityPanelFilters", () => {
  it("no cuenta el periodo ni el padrón sin recortes", () => {
    expect(
      countUserActivityPanelFilters({
        action: "",
        subjectUserId: "",
        actorUserId: "",
      }),
    ).toBe(0);
  });

  it("cuenta tipo, persona y actor", () => {
    expect(
      countUserActivityPanelFilters({
        action: "user_created",
        subjectUserId: "u1",
        actorUserId: "u2",
      }),
    ).toBe(3);
  });
});

describe("resolveUserActivityEmptyKind", () => {
  it("prioriza recortes sobre la ventana y el historial completo", () => {
    expect(
      resolveUserActivityEmptyKind({ hasRecortes: true, isEntireHistory: true }),
    ).toBe("recorte");
    expect(
      resolveUserActivityEmptyKind({ hasRecortes: true, isEntireHistory: false }),
    ).toBe("recorte");
  });

  it("distingue virgen (todo el historial) de ventana (periodo)", () => {
    expect(
      resolveUserActivityEmptyKind({
        hasRecortes: false,
        isEntireHistory: true,
      }),
    ).toBe("virgin");
    expect(
      resolveUserActivityEmptyKind({
        hasRecortes: false,
        isEntireHistory: false,
      }),
    ).toBe("window");
  });
});
