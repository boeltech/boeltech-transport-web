/**
 * Sheet de edición de los datos de contacto de la empresa.
 */

import { memo, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { FormValidationSummary, RHFTextField } from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";

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

const copy = generalSettingsCopy.contact;
const actionCopy = generalSettingsCopy.action;

const contactSchema = z.object({
  email: z.string().email("Correo inválido"),
  phone: z.string().optional(),
  website: z.string().url("Dirección web inválida").optional().or(z.literal("")),
});

type CompanyContactFormData = z.infer<typeof contactSchema>;

function toFormValues(settings: CompanySettings): CompanyContactFormData {
  return {
    email: settings.email,
    phone: settings.phone ?? "",
    website: settings.website ?? "",
  };
}

export interface CompanyContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CompanySettings;
}

export const CompanyContactSheet = memo(function CompanyContactSheet({
  open,
  onOpenChange,
  settings,
}: CompanyContactSheetProps) {
  const updateMutation = useUpdateCompanySettings();
  const [showSummary, setShowSummary] = useState(false);

  const form = useForm<CompanyContactFormData>({
    resolver: zodResolver(contactSchema),
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
    async (data: CompanyContactFormData) => {
      try {
        await updateMutation.mutateAsync({
          email: data.email.trim(),
          phone: data.phone?.trim() || null,
          website: data.website?.trim() || null,
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
              name="email"
              type="email"
              label={copy.email}
              placeholder={copy.emailPlaceholder}
              disabled={isSaving}
              required
            />

            <RHFTextField
              control={control}
              name="phone"
              label={copy.phone}
              placeholder={copy.phonePlaceholder}
              disabled={isSaving}
            />

            <RHFTextField
              control={control}
              name="website"
              label={copy.website}
              placeholder={copy.websitePlaceholder}
              disabled={isSaving}
            />

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
