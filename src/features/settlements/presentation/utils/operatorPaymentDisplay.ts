import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { OperatorPaymentReadiness } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.operatorsList;

const SALARY_PERIOD_LABELS: Record<string, string> = {
  weekly: "semanal",
  biweekly: "quincenal",
  monthly: "mensual",
  daily: "diario",
};

export function formatOperatorTariffLabel(
  row: OperatorPaymentReadiness,
): { title: string; subtitle: string | null; muted: boolean } {
  if (!row.template) {
    return { title: copy.noTariff, subtitle: null, muted: true };
  }
  const title = copy.tariffVersion(row.template.name, row.template.version);
  const from = formatDate(row.template.effectiveFrom);
  if (row.status === "template_scheduled") {
    return {
      title,
      subtitle: from ? copy.panel.stepTariffScheduledFrom(from) : null,
      muted: false,
    };
  }
  return {
    title,
    subtitle: from ? copy.tariffFrom(from) : null,
    muted: false,
  };
}

export function formatOperatorSalaryLabel(
  row: OperatorPaymentReadiness,
): { amount: string | null; period: string | null } {
  if (row.salary.amount === null || row.salary.amount === undefined) {
    return { amount: null, period: null };
  }
  const periodKey = (row.salary.period ?? "").toLowerCase();
  return {
    amount: formatMxCurrency(row.salary.amount),
    period: SALARY_PERIOD_LABELS[periodKey] ?? row.salary.period,
  };
}

export function formatOperatorAdvancesLabel(
  row: OperatorPaymentReadiness,
): string {
  if (row.openAdvancesCount <= 0 || row.openAdvancesBalance <= 0) {
    return copy.advancesNone;
  }
  return formatMxCurrency(row.openAdvancesBalance);
}

export function operatorPanelSubtitle(row: OperatorPaymentReadiness): string {
  const panel = settlementsCopy.operatorsList.panel;
  switch (row.status) {
    case "no_template":
      return panel.blockedNoTariff;
    case "template_not_payable":
      return panel.blockedNotPayable;
    case "template_scheduled":
      return panel.blockedScheduled;
    case "dual_template":
      return panel.blockedDual;
    case "no_clabe":
      return panel.blockedNoClabe;
    case "version_superseded":
      return panel.blockedSuperseded;
    default:
      return panel.readySubtitle;
  }
}
