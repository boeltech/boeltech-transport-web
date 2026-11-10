import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { CompensationTemplate } from "../../domain/entities";
import type { BuilderFormulaTerm } from "@shared/ui/page-shells/BuilderPageShell";
import { compensationCopy } from "../copy/compensationCopy";
import { getTemplateSectionStatuses } from "./getTemplateCompleteness";
import type { BuilderSectionId } from "./templateCompositionTypes";

const formulaCopy = compensationCopy.builder.formulaTerms;

function sumAmounts(
  items: Array<{ amount?: number | null } | undefined>,
): number {
  return items.reduce((acc, item) => {
    const amount =
      item && typeof item.amount === "number" && Number.isFinite(item.amount)
        ? item.amount
        : 0;
    return acc + amount;
  }, 0);
}

/**
 * Construye los 4 términos de la barra de fórmula a partir del snapshot del form.
 */
export function buildFormulaTerms(
  template: Pick<
    CompensationTemplate,
    | "rules"
    | "fixedAllowances"
    | "deductions"
    | "corridorIds"
    | "salaryOnly"
    | "name"
  >,
  weekTotalFormatted: string | null,
): { terms: BuilderFormulaTerm[]; sections: BuilderSectionId[] } {
  const statuses = getTemplateSectionStatuses(template);
  const corridorCount = template.corridorIds.length;
  const classCount = template.rules.filter(
    (rule) => rule.commissionType !== "none",
  ).length;
  const allowanceSum = sumAmounts(template.fixedAllowances);
  const deductionSum = sumAmounts(template.deductions ?? []);
  const salaryOnly = Boolean(template.salaryOnly);

  const tripsValue = salaryOnly
    ? formulaCopy.tripsSalaryOnly
    : statuses.trips === "empty"
      ? formulaCopy.tripsValueEmpty
      : formulaCopy.tripsValueConfigured;

  const tripsSummary = salaryOnly
    ? formulaCopy.tripsSalaryOnly
    : formulaCopy.tripsSummary(corridorCount, classCount);

  const allowancesValue =
    statuses.allowances === "empty"
      ? formulaCopy.allowancesValueEmpty
      : formulaCopy.allowancesValue(formatMxCurrency(allowanceSum));

  const deductionsValue =
    statuses.deductions === "empty"
      ? formulaCopy.deductionsValueEmpty
      : formulaCopy.deductionsValue(formatMxCurrency(deductionSum));

  const terms: BuilderFormulaTerm[] = [
    {
      id: "trips",
      label: formulaCopy.tripsLabel,
      value: tripsValue,
      summary: tripsSummary,
      status: statuses.trips,
    },
    {
      id: "allowances",
      label: formulaCopy.allowancesLabel,
      value: allowancesValue,
      summary: formulaCopy.allowancesSummary(template.fixedAllowances.length),
      status: statuses.allowances,
    },
    {
      id: "deductions",
      label: formulaCopy.deductionsLabel,
      value: deductionsValue,
      summary: formulaCopy.deductionsSummary((template.deductions ?? []).length),
      status: statuses.deductions === "empty" ? "empty" : "complete",
    },
    {
      id: "result",
      label: formulaCopy.resultLabel,
      value: weekTotalFormatted ?? formulaCopy.resultEmpty,
      summary: weekTotalFormatted
        ? formulaCopy.resultSummary
        : formulaCopy.resultSummaryEmpty,
      status: weekTotalFormatted ? "complete" : "empty",
      isResult: true,
    },
  ];

  return { terms, sections: ["trips", "allowances", "deductions"] };
}
