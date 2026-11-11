import { describe, expect, it } from "vitest";
import {
  OPERATOR_PAYMENT_STATUS_LABELS,
  type OperatorPaymentReadinessStatus,
} from "../../domain/enums";
import { OPERATOR_PAYMENT_STATUS_CONFIG } from "./operatorPaymentStatusConfig";

const ALL_STATUSES: OperatorPaymentReadinessStatus[] = [
  "ready",
  "no_template",
  "template_not_payable",
  "template_scheduled",
  "dual_template",
  "no_clabe",
  "version_superseded",
];

describe("OPERATOR_PAYMENT_STATUS_CONFIG (C)", () => {
  it("cubre todos los status con labels del enum", () => {
    for (const status of ALL_STATUSES) {
      expect(OPERATOR_PAYMENT_STATUS_CONFIG[status].label).toBe(
        OPERATOR_PAYMENT_STATUS_LABELS[status],
      );
    }
  });

  it("labels de badge nuevos", () => {
    expect(OPERATOR_PAYMENT_STATUS_LABELS.template_not_payable).toBe(
      "No pagable",
    );
    expect(OPERATOR_PAYMENT_STATUS_LABELS.template_scheduled).toBe(
      "Programada",
    );
  });
});
