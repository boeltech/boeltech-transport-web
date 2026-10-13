import { describe, expect, it } from "vitest";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  getDispatchRunStatusLabel,
  getDispatchRunStatusTooltip,
  isEmptyScheduledCancelled,
} from "./dispatchRunStatusPresentation";

describe("dispatchRunStatusPresentation", () => {
  it("marca solo scheduled+cancelled como evaluación sin listos", () => {
    expect(isEmptyScheduledCancelled("scheduled", "cancelled")).toBe(true);
    expect(isEmptyScheduledCancelled("manual", "cancelled")).toBe(false);
    expect(isEmptyScheduledCancelled("scheduled", "completed")).toBe(false);
  });

  it("label: Sin facturas listas vs Cancelada", () => {
    expect(getDispatchRunStatusLabel("cancelled", "scheduled")).toBe(
      dispatchRunsCopy.emptyScheduled.label,
    );
    expect(getDispatchRunStatusLabel("cancelled", "manual")).toBe(
      dispatchRunsCopy.status.cancelled,
    );
    expect(getDispatchRunStatusLabel("previewed", "scheduled")).toBe(
      dispatchRunsCopy.status.previewed,
    );
  });

  it("tooltip solo en evaluación automática vacía", () => {
    expect(getDispatchRunStatusTooltip("cancelled", "scheduled")).toBe(
      dispatchRunsCopy.emptyScheduled.tooltip,
    );
    expect(getDispatchRunStatusTooltip("cancelled", "manual")).toBeUndefined();
  });
});
