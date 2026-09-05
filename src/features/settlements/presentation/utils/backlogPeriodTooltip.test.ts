import { describe, expect, it } from "vitest";
import { settlementsCopy } from "../copy/settlementsCopy";
import { resolveBacklogPeriodTooltip } from "./backlogPeriodTooltip";

describe("resolveBacklogPeriodTooltip", () => {
  it("returns trips_pending copy", () => {
    expect(resolveBacklogPeriodTooltip("trips_pending")).toBe(
      settlementsCopy.workbench.backlog.periodTooltips.trips_pending,
    );
  });

  it("returns salary_close copy without trip departure wording", () => {
    const text = resolveBacklogPeriodTooltip("salary_close");
    expect(text).toBe(settlementsCopy.workbench.backlog.periodTooltips.salary_close);
    expect(text).not.toMatch(/fecha de salida del viaje/i);
    expect(text).toMatch(/corte de sueldo/i);
  });

  it("returns mixed copy", () => {
    expect(resolveBacklogPeriodTooltip("mixed")).toBe(
      settlementsCopy.workbench.backlog.periodTooltips.mixed,
    );
  });

  it("returns fallback for missing rowType", () => {
    expect(resolveBacklogPeriodTooltip(undefined)).toBe(
      settlementsCopy.workbench.backlog.periodTooltipFallback,
    );
    expect(resolveBacklogPeriodTooltip(null)).toBe(
      settlementsCopy.workbench.backlog.periodTooltipFallback,
    );
  });
});
