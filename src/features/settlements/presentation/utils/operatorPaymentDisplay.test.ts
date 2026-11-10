import { describe, expect, it } from "vitest";
import type { OperatorPaymentReadiness } from "../../domain/entities";
import {
  formatOperatorAdvancesLabel,
  formatOperatorSalaryLabel,
  formatOperatorTariffLabel,
  operatorPanelSubtitle,
} from "./operatorPaymentDisplay";
import { settlementsCopy } from "../copy/settlementsCopy";

const base = (
  overrides: Partial<OperatorPaymentReadiness> = {},
): OperatorPaymentReadiness => ({
  employeeId: "emp-1",
  fullName: "Martín Salas",
  employmentType: "permanent",
  status: "ready",
  template: {
    id: "tpl-1",
    name: "Foráneo estándar",
    version: 1,
    effectiveFrom: "2026-09-01",
    payability: "active",
  },
  salary: { amount: 2500, period: "weekly" },
  hasClabe: true,
  openAdvancesCount: 0,
  openAdvancesBalance: 0,
  attentionReasons: [],
  ...overrides,
});

describe("operatorPaymentDisplay", () => {
  it("tarifa sin asignar", () => {
    const label = formatOperatorTariffLabel(
      base({ template: null, status: "no_template" }),
    );
    expect(label).toEqual({
      title: settlementsCopy.operatorsList.noTariff,
      subtitle: null,
      muted: true,
    });
  });

  it("sueldo con ritmo en minúsculas (copy .dc.html)", () => {
    expect(formatOperatorSalaryLabel(base())).toEqual({
      amount: expect.stringContaining("2,500"),
      period: "semanal",
    });
  });

  it("anticipos — cuando no hay saldo", () => {
    expect(formatOperatorAdvancesLabel(base())).toBe(
      settlementsCopy.operatorsList.advancesNone,
    );
  });

  it("subtítulo del panel según status", () => {
    expect(operatorPanelSubtitle(base({ status: "no_template" }))).toBe(
      settlementsCopy.operatorsList.panel.blockedNoTariff,
    );
    expect(operatorPanelSubtitle(base({ status: "ready" }))).toBe(
      settlementsCopy.operatorsList.panel.readySubtitle,
    );
  });
});
