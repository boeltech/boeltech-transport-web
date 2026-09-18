import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateRulesSection } from "./TemplateRulesSection";
import { RHFSelectField } from "@shared/ui/form";
import { MID_TRIP_PAYOUT_POLICY_LABELS } from "@features/settlements/domain/enums";

const copy = compensationCopy.builder;

type BuilderPaymentRulesSectionProps = Pick<
  UseCompensationTemplateFormResult,
  "form" | "ruleFields" | "appendRule" | "removeRule" | "watchedRules"
>;

const MID_TRIP_OPTIONS = (
  Object.entries(MID_TRIP_PAYOUT_POLICY_LABELS) as Array<[string, string]>
).map(([value, label]) => ({ value, label }));

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
      <RHFSelectField
        control={form.control}
        name="midTripPayoutPolicy"
        label={copy.midTripPolicyLabel}
        description={copy.midTripPolicyHint}
        options={MID_TRIP_OPTIONS}
        fieldId="mid-trip-payout-policy"
      />
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
