import { useState } from "react";
import { Controller } from "react-hook-form";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { Button } from "@shared/ui/button";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.builder;
const sheetCopy = compensationCopy.sheet;

type BuilderIdentitySectionProps = Pick<
  UseCompensationTemplateFormResult,
  "form" | "validationMessages"
> & {
  showValidation?: boolean;
};

/**
 * Bloque compacto de identidad (fuera del nav de secciones del Builder).
 * Nombre + toggle activo + nota opcional colapsable.
 */
export function BuilderIdentitySection({
  form,
  validationMessages,
  showValidation = false,
}: BuilderIdentitySectionProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const description = watch("description");
  /** null = derivado del valor; true/false = elección del usuario. */
  const [descriptionOpen, setDescriptionOpen] = useState<boolean | null>(null);
  const showDescription =
    descriptionOpen ?? Boolean(description?.trim());

  return (
    <div
      className="rounded-lg border bg-card p-4 shadow-sm space-y-3"
      aria-label={copy.identityBlockAriaLabel}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="builder-template-name">{sheetCopy.fields.name}</Label>
          <Input
            id="builder-template-name"
            {...register("name")}
            {...getRegisterFieldErrorProps(
              "builder-template-name",
              errors.name?.message,
            )}
          />
          <FieldInlineError
            fieldId="builder-template-name"
            message={errors.name?.message}
          />
        </div>
        <div className="flex items-center gap-2 sm:pt-7">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Checkbox
                id="builder-template-active"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label htmlFor="builder-template-active">{copy.toggleActiveLabel}</Label>
        </div>
      </div>

      {showDescription ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="builder-template-description">
              {sheetCopy.fields.description}
            </Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0"
              onClick={() => setDescriptionOpen(false)}
            >
              {copy.hideDescription}
            </Button>
          </div>
          <Textarea
            id="builder-template-description"
            rows={2}
            {...register("description")}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => setDescriptionOpen(true)}
        >
          {copy.addDescription}
        </Button>
      )}

      {showValidation && validationMessages.length > 0 ? (
        <FormValidationSummary
          title={sheetCopy.validationSummary}
          messages={validationMessages}
        />
      ) : null}
    </div>
  );
}
