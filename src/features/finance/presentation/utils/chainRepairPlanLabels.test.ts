import { describe, expect, it } from "vitest";
import { getChainRepairAffectedLabels } from "./chainRepairPlanLabels";

describe("getChainRepairAffectedLabels", () => {
  it("returns empty when details or plan are missing", () => {
    expect(getChainRepairAffectedLabels(undefined)).toEqual([]);
    expect(getChainRepairAffectedLabels({})).toEqual([]);
    expect(getChainRepairAffectedLabels({ repair_plan: null })).toEqual([]);
  });

  it("collects serie-folio from snake_case and camelCase plan shapes", () => {
    expect(
      getChainRepairAffectedLabels({
        repair_plan: {
          cancel_phase: [{ serie: "A", folio: 12, payment_id: "uuid-1" }],
        },
      }),
    ).toEqual(["A-12"]);

    expect(
      getChainRepairAffectedLabels({
        repairPlan: {
          cancelPhase: [{ invoiceSerie: "B", invoiceFolio: "7" }],
        },
      }),
    ).toEqual(["B-7"]);
  });

  it("does not list payment UUIDs when there is no folio", () => {
    expect(
      getChainRepairAffectedLabels({
        repair_plan: {
          cancelPhase: [{ paymentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }],
        },
      }),
    ).toEqual([]);
  });
});
