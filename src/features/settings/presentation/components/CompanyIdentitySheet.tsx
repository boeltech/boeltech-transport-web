/**
 * Sheet de edición de la identidad de la empresa.
 *
 * Solo manda los campos de identidad: corregir el nombre no debe depender
 * de que el domicilio pase la validación fiscal.
 */

import { memo, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFCatalogField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { RegimenFiscalSelect } from "@features/catalogs";

import { useUpdateCompanySettings } from "../../application/hooks";
import type { CompanySettings } from "../../domain";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";
import {
  SETTINGS_SHEET_BODY_CLASS,
  SETTINGS_SHEET_CONTENT_CLASS,
  SETTINGS_SHEET_FOOTER_CLASS,
  SETTINGS_SHEET_HEADER_CLASS,
  SETTINGS_SHEET_PRIMARY_BUTTON_CLASS,
} from "./settingsSheetLayout";

const copy = generalSettingsCopy.identity;
const actionCopy = generalSettingsCopy.action;

const identitySchema = z.object({
  legalName: z.string().min(1, "La razón social es requerida"),
  tradeName: z.string().optional(),
  rfc: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC no puede tener más de 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido"),
  regimenFiscal: z.string().min(1, "El régimen fiscal es requerido"),
});

type CompanyIdentityFormData = z.infer<typeof identitySchema>;

function toFormValues(settings: CompanySettings): CompanyIdentityFormData {
  return {
    legalName: settings.legalName,
    tradeName: settings.tradeName ?? "",
    rfc: settings.rfc,
    regimenFiscal: settings.regimenFiscal,
  };
}

export interface CompanyIdentitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CompanySettings;
}

export const CompanyIdentitySheet = memo(function CompanyIdentitySheet({
  open,
  onOpenChange,
  settings,
}: CompanyIdentitySheetProps) {
  const updateMutation = useUpdateCompanySettings();
  const [showSummary, setShowSummary] = useState(false);

  const form = useForm<CompanyIdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues: toFormValues(settings),
    mode: "onChange",
  });

  const { control, formState, handleSubmit, reset } = form;
  const isSaving = updateMutation.isPending || formState.isSubmitting;

  useEffect(() => {
    if (!open) return;
    reset(toFormValues(settings));
    setShowSummary(false);
    // Rehidratar solo al abrir: no pisar lo que el usuario está capturando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) {
        setShowSummary(false);
        reset(toFormValues(settings));
      }
      onOpenChange(next);
    },
    [onOpenChange, reset, settings],
  );

  const onValid = useCallback(
    async (data: CompanyIdentityFormData) => {
      try {
        await updateMutation.mutateAsync({
          legalName: data.legalName.trim(),
          tradeName: data.tradeName?.trim() || null,
          rfc: data.rfc.trim(),
          regimenFiscal: data.regimenFiscal,
        });
        setShowSummary(false);
        onOpenChange(false);
      } catch {
        // El hook ya notifica el error.
      }
    },
    [onOpenChange, updateMutation],
  );

  const summaryMessages = collectFieldErrorMessages(formState.errors);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className={SETTINGS_SHEET_CONTENT_CLASS} side="right">
        <SheetHeader className={SETTINGS_SHEET_HEADER_CLASS}>
          <SheetTitle>{copy.sheetTitle}</SheetTitle>
          <SheetDescription>{copy.sheetDescription}</SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onValid, () => setShowSummary(true))}
        >
          <div className={SETTINGS_SHEET_BODY_CLASS}>
            <RHFTextField
              control={control}
              name="legalName"
              label={copy.legalName}
              placeholder={copy.legalNamePlaceholder}
              disabled={isSaving}
              required
            />

            <RHFTextField
              control={control}
              name="tradeName"
              label={copy.tradeName}
              placeholder={copy.tradeNamePlaceholder}
              disabled={isSaving}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="rfc"
                render={({ field, fieldState }) => (
                  <FormFieldShell
                    fieldId="company-rfc"
                    label={copy.rfc}
                    required
                    errorMessage={fieldState.error?.message}
                  >
                    <Input
                      id="company-rfc"
                      placeholder={copy.rfcPlaceholder}
                      className="font-mono uppercase"
                      maxLength={13}
                      disabled={isSaving}
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.value.toUpperCase())
                      }
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        "company-rfc",
                        fieldState.error?.message,
                      )}
                    />
                  </FormFieldShell>
                )}
              />

              <RHFCatalogField
                control={control}
                name="regimenFiscal"
                label={copy.taxRegime}
                required
              >
                {({ field, fieldState, resolvedId, errorMessage }) => (
                  <RegimenFiscalSelect
                    triggerId={resolvedId}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={copy.taxRegimePlaceholder}
                    disabled={isSaving}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                  />
                )}
              </RHFCatalogField>
            </div>

            {showSummary && summaryMessages.length > 0 ? (
              <FormValidationSummary
                title={generalSettingsCopy.validation.summaryTitle}
                messages={summaryMessages}
              />
            ) : null}
          </div>

          <SheetFooter className={SETTINGS_SHEET_FOOTER_CLASS}>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSaving}
            >
              {actionCopy.cancel}
            </Button>
            <Button
              type="submit"
              className={SETTINGS_SHEET_PRIMARY_BUTTON_CLASS}
              isLoading={isSaving}
            >
              {isSaving ? actionCopy.saving : actionCopy.save}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
});
