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

describe("sortOperatorsByAttentionPriority (C5 + C)", () => {
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

  it("No pagable y Programada antes que Sin tarifa", () => {
    const sorted = sortOperatorsByAttentionPriority([
      row({ employeeId: "3", fullName: "Carla", status: "no_template" }),
      row({ employeeId: "1", fullName: "Ana", status: "template_scheduled" }),
      row({ employeeId: "2", fullName: "Beto", status: "template_not_payable" }),
      row({ employeeId: "4", fullName: "Diana", status: "ready" }),
    ]);
    expect(sorted.map((r) => r.status)).toEqual([
      "template_not_payable",
      "template_scheduled",
      "no_template",
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
