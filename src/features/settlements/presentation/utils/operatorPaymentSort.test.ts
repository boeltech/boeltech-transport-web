import { describe, expect, it } from "vitest";
import type { OperatorPaymentReadiness } from "../../domain/entities";
import { sortOperatorsByAttentionPriority } from "./operatorPaymentSort";

function row(
  overrides: Partial<OperatorPaymentReadiness> &
    Pick<OperatorPaymentReadiness, "employeeId" | "fullName" | "status">,
): OperatorPaymentReadiness {
  return {
    employmentType: "permanent",
    template: null,
    salary: { amount: null, period: null },
    hasClabe: false,
    openAdvancesCount: 0,
    openAdvancesBalance: 0,
    attentionReasons: [],
    ...overrides,
  };
}

describe("sortOperatorsByAttentionPriority (C5)", () => {
  it("ordena Sin tarifa antes que Sin CLABE", () => {
    const sorted = sortOperatorsByAttentionPriority([
      row({ employeeId: "2", fullName: "Beto", status: "no_clabe" }),
      row({ employeeId: "1", fullName: "Ana", status: "no_template" }),
      row({ employeeId: "3", fullName: "Carla", status: "ready" }),
    ]);
    expect(sorted.map((r) => r.status)).toEqual([
      "no_template",
      "no_clabe",
      "ready",
    ]);
  });

  it("empate de estado: por nombre", () => {
    const sorted = sortOperatorsByAttentionPriority([
      row({ employeeId: "2", fullName: "Zoe", status: "no_template" }),
      row({ employeeId: "1", fullName: "Ana", status: "no_template" }),
    ]);
    expect(sorted.map((r) => r.fullName)).toEqual(["Ana", "Zoe"]);
  });
});
