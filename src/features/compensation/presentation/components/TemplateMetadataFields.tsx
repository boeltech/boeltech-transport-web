import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Settings2 } from "lucide-react";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  FieldInlineError,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { compensationCopy } from "../copy/compensationCopy";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";

const copy = compensationCopy.sheet;

interface TemplateMetadataFieldsProps {
  control: Control<CompensationTemplateFormData>;
  register: UseFormRegister<CompensationTemplateFormData>;
  errors: FieldErrors<CompensationTemplateFormData>;
  stepPrefix?: string;
}

/** Metadata del esquema para Sheet / composición (card). El Builder usa BuilderIdentitySection. */
export function TemplateMetadataFields({
  control,
  register,
  errors,
  stepPrefix = "4.",
}: TemplateMetadataFieldsProps) {
  return (
    <FormSectionCard
      title={
        stepPrefix.trim() ? `${stepPrefix} ${copy.schemaDataTitle}` : copy.schemaDataTitle
      }
      icon={<Settings2 className="h-4 w-4" />}
      contentClassName="space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="template-name">{copy.fields.name}</Label>
        <Input
          id="template-name"
          {...register("name")}
          {...getRegisterFieldErrorProps("template-name", errors.name?.message)}
        />
        <FieldInlineError fieldId="template-name" message={errors.name?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="template-description">{copy.fields.description}</Label>
        <Textarea id="template-description" rows={2} {...register("description")} />
      </div>
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Checkbox
              id="template-active"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="template-active">{copy.fields.templateActive}</Label>
      </div>
    </FormSectionCard>
  );
}
