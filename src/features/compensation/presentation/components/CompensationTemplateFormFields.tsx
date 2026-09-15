import { FormValidationSummary } from "@shared/ui/form";
import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateAllowancesSection } from "./TemplateAllowancesSection";
import { TemplateCorridorsSection } from "./TemplateCorridorsSection";
import { TemplateMetadataFields } from "./TemplateMetadataFields";
import { TemplateRulesSection } from "./TemplateRulesSection";

const copy = compensationCopy.sheet;

type CompensationTemplateFormFieldsProps = Pick<
  UseCompensationTemplateFormResult,
  | "form"
  | "ruleFields"
  | "appendRule"
  | "removeRule"
  | "allowanceFields"
  | "appendAllowance"
  | "removeAllowance"
  | "watchedRules"
  | "validationMessages"
>;

export function CompensationTemplateFormFields({
  form,
  ruleFields,
  appendRule,
  removeRule,
  allowanceFields,
  appendAllowance,
  removeAllowance,
  watchedRules,
  validationMessages,
}: CompensationTemplateFormFieldsProps) {
  const { control, register, setValue, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <TemplateRulesSection
        control={control}
        ruleFields={ruleFields}
        watchedRules={watchedRules}
        appendRule={appendRule}
        removeRule={removeRule}
      />
      <TemplateAllowancesSection
        control={control}
        setValue={setValue}
        register={register}
        allowanceFields={allowanceFields}
        appendAllowance={appendAllowance}
        removeAllowance={removeAllowance}
      />
      <TemplateCorridorsSection control={control} />
      <TemplateMetadataFields control={control} register={register} errors={errors} />

      {validationMessages.length > 0 ? (
        <FormValidationSummary title={copy.validationSummary} messages={validationMessages} />
      ) : null}
    </div>
  );
}
