import { useCallback, useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useUpdateCompensationTemplate } from "../../application/hooks";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  DEFAULT_TEMPLATE_FORM_VALUES,
  TEMPLATE_FORM_ID,
  templateInlineFormId,
  templateToForm,
} from "../utils/templateFormMappers";
import {
  compensationTemplateFormSchema,
  type CompensationTemplateFormData,
} from "../validation/compensationSchemas";

interface UseCompensationTemplateFormOptions {
  template?: CompensationTemplate | null;
  /** When false, skips reset-on-open behavior (e.g. sheet closed). */
  enabled?: boolean;
  formId?: string;
  onSuccess?: () => void;
}

export interface UseCompensationTemplateFormResult {
  form: UseFormReturn<CompensationTemplateFormData>;
  formId: string;
  ruleFields: ReturnType<typeof useFieldArray<CompensationTemplateFormData, "rules">>["fields"];
  appendRule: ReturnType<typeof useFieldArray<CompensationTemplateFormData, "rules">>["append"];
  removeRule: ReturnType<typeof useFieldArray<CompensationTemplateFormData, "rules">>["remove"];
  allowanceFields: ReturnType<
    typeof useFieldArray<CompensationTemplateFormData, "fixedAllowances">
  >["fields"];
  appendAllowance: ReturnType<
    typeof useFieldArray<CompensationTemplateFormData, "fixedAllowances">
  >["append"];
  removeAllowance: ReturnType<
    typeof useFieldArray<CompensationTemplateFormData, "fixedAllowances">
  >["remove"];
  watchedRules: CompensationTemplateFormData["rules"] | undefined;
  validationMessages: string[];
  apiError: string | null;
  isSaving: boolean;
  onSubmit: () => Promise<void>;
}

export function useCompensationTemplateForm({
  template,
  enabled = true,
  formId,
  onSuccess,
}: UseCompensationTemplateFormOptions): UseCompensationTemplateFormResult {
  const { toast } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  const updateMutation = useUpdateCompensationTemplate();
  const resolvedFormId =
    formId ?? (template?.id ? templateInlineFormId(template.id) : TEMPLATE_FORM_ID);

  const form = useForm<CompensationTemplateFormData>({
    resolver: zodResolver(compensationTemplateFormSchema) as Resolver<CompensationTemplateFormData>,
    defaultValues: DEFAULT_TEMPLATE_FORM_VALUES,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control,
    name: "rules",
  });

  const {
    fields: allowanceFields,
    append: appendAllowance,
    remove: removeAllowance,
  } = useFieldArray({
    control,
    name: "fixedAllowances",
  });

  useEffect(() => {
    if (!enabled) return;

    setApiError(null);
    if (template) {
      reset(templateToForm(template));
      return;
    }
    reset(DEFAULT_TEMPLATE_FORM_VALUES);
  }, [enabled, template, reset]);

  const watchedRules = useWatch({ control, name: "rules" });
  const validationMessages = collectFieldErrorMessages(errors);
  const isSaving = isSubmitting || updateMutation.isPending;

  const onSubmit = useCallback(
    () =>
      handleSubmit(async (values) => {
        if (!template?.id) return;

        setApiError(null);

        try {
          await updateMutation.mutateAsync({
            id: template.id,
            name: values.name,
            description: values.description?.trim() ? values.description.trim() : null,
            isActive: values.isActive,
            midTripPayoutPolicy: values.midTripPayoutPolicy,
            rules: values.rules,
            fixedAllowances: values.fixedAllowances,
            corridorIds: values.corridorIds,
          });
          toast({ title: compensationCopy.toasts.templateUpdated, variant: "success" });
          onSuccess?.();
        } catch (error) {
          setApiError(getErrorMessage(error));
        }
      })(),
    [handleSubmit, onSuccess, template?.id, toast, updateMutation],
  );

  return {
    form,
    formId: resolvedFormId,
    ruleFields,
    appendRule,
    removeRule,
    allowanceFields,
    appendAllowance,
    removeAllowance,
    watchedRules,
    validationMessages,
    apiError,
    isSaving,
    onSubmit,
  };
}
