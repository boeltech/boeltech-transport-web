import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateAllowancesSection } from "./TemplateAllowancesSection";
import { TemplateDeductionsSection } from "./TemplateDeductionsSection";

const copy = compensationCopy.builder;

type BuilderAllowancesSectionProps = Pick<
  UseCompensationTemplateFormResult,
  | "form"
  | "allowanceFields"
  | "appendAllowance"
  | "removeAllowance"
  | "deductionFields"
  | "appendDeduction"
  | "removeDeduction"
>;

export function BuilderAllowancesSection({
  form,
  allowanceFields,
  appendAllowance,
  removeAllowance,
  deductionFields,
  appendDeduction,
  removeDeduction,
}: BuilderAllowancesSectionProps) {
  const hasDeductions = deductionFields.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{copy.allowancesDescription}</p>
        <TemplateAllowancesSection
          control={form.control}
          register={form.register}
          setValue={form.setValue}
          allowanceFields={allowanceFields}
          appendAllowance={appendAllowance}
          removeAllowance={removeAllowance}
          stepPrefix=""
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="text-sm font-semibold">{copy.advancedSectionTitle}</span>
          {hasDeductions ? (
            <span className="text-xs text-muted-foreground">
              ({deductionFields.length})
            </span>
          ) : null}
        </div>
        <div className="space-y-4 border-t px-4 py-4">
          <p className="text-sm text-muted-foreground">{copy.advancedSectionHint}</p>
          <TemplateDeductionsSection
            control={form.control}
            register={form.register}
            setValue={form.setValue}
            deductionFields={deductionFields}
            appendDeduction={appendDeduction}
            removeDeduction={removeDeduction}
            stepPrefix=""
          />
        </div>
      </div>
    </div>
  );
}
