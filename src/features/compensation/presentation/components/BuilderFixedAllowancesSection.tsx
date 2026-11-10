import { useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { TEMPLATE_PAYMENT_PERIOD_LABELS } from "../../domain/enums";
import type { FixedAllowancePeriod } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateAllowancesSection } from "./TemplateAllowancesSection";

const copy = compensationCopy.builder;

type Props = Pick<
  UseCompensationTemplateFormResult,
  "form" | "allowanceFields" | "appendAllowance" | "removeAllowance"
> & {
  assignedOperatorPeriods?: FixedAllowancePeriod[];
};

export function BuilderFixedAllowancesSection({
  form,
  allowanceFields,
  appendAllowance,
  removeAllowance,
  assignedOperatorPeriods = [],
}: Props) {
  const paymentPeriod =
    (useWatch({ control: form.control, name: "paymentPeriod" }) as FixedAllowancePeriod) ??
    "weekly";
  const allowances = useWatch({ control: form.control, name: "fixedAllowances" }) ?? [];

  const dominantOperatorPeriod =
    assignedOperatorPeriods.length > 0
      ? modePeriod(assignedOperatorPeriods)
      : null;

  const mismatchCount =
    dominantOperatorPeriod == null
      ? 0
      : allowances.filter(
          (item) => item?.period && item.period !== dominantOperatorPeriod,
        ).length;

  return (
    <div className="space-y-4" data-testid="builder-fixed-allowances">
      <p className="text-sm text-muted-foreground">{copy.allowancesDescription}</p>
      {mismatchCount > 0 && dominantOperatorPeriod ? (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ritmo distinto al de los operadores</AlertTitle>
          <AlertDescription>
            {copy.periodMismatchAlert(
              assignedOperatorPeriods.filter((p) => p === dominantOperatorPeriod).length ||
                assignedOperatorPeriods.length,
              TEMPLATE_PAYMENT_PERIOD_LABELS[dominantOperatorPeriod].toLowerCase(),
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      <TemplateAllowancesSection
        control={form.control}
        register={form.register}
        setValue={form.setValue}
        allowanceFields={allowanceFields}
        appendAllowance={appendAllowance}
        removeAllowance={removeAllowance}
        stepPrefix=""
        defaultPeriod={paymentPeriod}
        mismatchPeriod={dominantOperatorPeriod}
      />
      <p className="text-xs text-muted-foreground">{copy.salaryNoteFooter}</p>
    </div>
  );
}

function modePeriod(periods: FixedAllowancePeriod[]): FixedAllowancePeriod | null {
  if (periods.length === 0) return null;
  const counts = new Map<FixedAllowancePeriod, number>();
  for (const period of periods) {
    counts.set(period, (counts.get(period) ?? 0) + 1);
  }
  let best: FixedAllowancePeriod | null = null;
  let bestCount = 0;
  for (const [period, count] of counts) {
    if (count > bestCount) {
      best = period;
      bestCount = count;
    }
  }
  return best;
}
