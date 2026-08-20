/**
 * TrailerForm — alta/edición de remolque (placa + tipo + notas).
 * Única UI de catálogo (Capa 1 D7'); se monta en TrailerCatalogSheet.
 */

import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubTipoRemSelect } from "@features/catalogs";
import {
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import { Button } from "@shared/ui/button";
import { SheetFooter } from "@shared/ui/sheet";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { Trailer } from "../../domain";
import {
  createTrailerFormSchema,
  type CreateTrailerFormData,
} from "../validation";
import { trailersCopy } from "../copy/trailersCopy";

const copy = trailersCopy.form;

export interface TrailerFormProps {
  trailer?: Trailer;
  onSubmit: (data: CreateTrailerFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function TrailerForm({
  trailer,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: TrailerFormProps) {
  const form = useForm<CreateTrailerFormData>({
    resolver: zodResolver(
      createTrailerFormSchema,
    ) as Resolver<CreateTrailerFormData>,
    defaultValues: {
      licensePlate: trailer?.licensePlate ?? "",
      satSubTipoRemCode: trailer?.satSubTipoRemCode ?? "",
      notes: trailer?.notes ?? "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
  } = form;

  useEffect(() => {
    reset({
      licensePlate: trailer?.licensePlate ?? "",
      satSubTipoRemCode: trailer?.satSubTipoRemCode ?? "",
      notes: trailer?.notes ?? "",
    });
  }, [trailer, reset]);

  const fieldErrors = collectFieldErrorMessages(errors);

  return (
    <form
      className="mt-6 flex flex-1 flex-col space-y-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {isSubmitted && fieldErrors.length > 0 ? (
        <FormValidationSummary messages={fieldErrors} />
      ) : null}

      <Controller
        control={control}
        name="licensePlate"
        render={({ field, fieldState }) => (
          <FormFieldShell
            fieldId="trailer-licensePlate"
            label={copy.label.licensePlate}
            required
            errorMessage={fieldState.error?.message}
          >
            <Input
              id="trailer-licensePlate"
              {...field}
              value={field.value ?? ""}
              placeholder={copy.placeholder.licensePlate}
              className="uppercase"
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps(
                "trailer-licensePlate",
                fieldState.error?.message,
              )}
            />
          </FormFieldShell>
        )}
      />

      <Controller
        control={control}
        name="satSubTipoRemCode"
        render={({ field, fieldState }) => (
          <FormFieldShell
            fieldId="trailer-satSubTipoRemCode"
            label={copy.label.satSubTipoRemCode}
            required
            errorMessage={fieldState.error?.message}
          >
            <SubTipoRemSelect
              triggerId="trailer-satSubTipoRemCode"
              value={field.value || undefined}
              onValueChange={field.onChange}
              placeholder={copy.placeholder.satSubTipoRemCode}
              displayFormat="name-code"
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps(
                "trailer-satSubTipoRemCode",
                fieldState.error?.message,
              )}
            />
          </FormFieldShell>
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <FormFieldShell
            fieldId="trailer-notes"
            label={copy.label.notes}
            errorMessage={fieldState.error?.message}
          >
            <Textarea
              id="trailer-notes"
              {...field}
              value={field.value ?? ""}
              placeholder={copy.placeholder.notes}
              rows={3}
              error={Boolean(fieldState.error)}
            />
          </FormFieldShell>
        )}
      />

      <SheetFooter className="mt-auto gap-2 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {copy.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel ??
            (trailer ? copy.submitEdit : copy.submitCreate)}
        </Button>
      </SheetFooter>
    </form>
  );
}
