import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateRulesSection } from "./TemplateRulesSection";

const copy = compensationCopy.builder;

type BuilderPaymentRulesSectionProps = Pick<
  UseCompensationTemplateFormResult,
  "form" | "ruleFields" | "appendRule" | "removeRule" | "watchedRules"
>;

export function BuilderPaymentRulesSection({
  form,
  ruleFields,
  appendRule,
  removeRule,
  watchedRules,
}: BuilderPaymentRulesSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{copy.paymentDescription}</p>
      <TemplateRulesSection
        control={form.control}
        ruleFields={ruleFields}
        watchedRules={watchedRules}
        appendRule={appendRule}
        removeRule={removeRule}
        stepPrefix=""
      />
    </div>
  );
}
