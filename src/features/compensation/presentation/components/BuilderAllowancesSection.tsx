import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateAllowancesSection } from "./TemplateAllowancesSection";

const copy = compensationCopy.builder;

type BuilderAllowancesSectionProps = Pick<
  UseCompensationTemplateFormResult,
  "form" | "allowanceFields" | "appendAllowance" | "removeAllowance"
>;

export function BuilderAllowancesSection({
  form,
  allowanceFields,
  appendAllowance,
  removeAllowance,
}: BuilderAllowancesSectionProps) {
  return (
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
  );
}
