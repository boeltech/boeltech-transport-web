/**
 * Formulario de avisos de la empresa.
 *
 * Solo expone lo que hoy afecta la campana: documentos por vencer.
 * El resto de campos del contrato se ocultan y no se envían en el PUT
 * (todos son opcionales en el API).
 */

import { memo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Bell, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  FormFieldShell,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Skeleton } from "@shared/ui/skeleton";
import { Switch } from "@shared/ui/switch";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";

import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "../../application/hooks";
import type {
  NotificationSettings,
  UpdateNotificationSettingsDTO,
} from "../../domain";
import { notificationSettingsCopy } from "../copy/notificationSettingsCopy";
import { SettingsCard } from "./SettingsLayout";

const copy = notificationSettingsCopy;

const notificationSettingsSchema = z.object({
  documentExpiryAlerts: z.boolean(),
  documentExpiryDays: z
    .number({ message: copy.validation.daysRequired })
    .int()
    .min(1, copy.validation.daysMin)
    .max(365, copy.validation.daysMax),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

function mapSettingsToForm(
  settings: NotificationSettings,
): NotificationSettingsFormData {
  return {
    documentExpiryAlerts: settings.documentExpiryAlerts,
    documentExpiryDays: settings.documentExpiryDays,
  };
}

export const NotificationSettingsForm = memo(
  function NotificationSettingsForm() {
    const { data: settings, isLoading, isError, refetch } =
      useNotificationSettings();
    const updateMutation = useUpdateNotificationSettings();
    const [showValidationSummary, setShowValidationSummary] = useState(false);

    const form = useForm<NotificationSettingsFormData>({
      resolver: zodResolver(notificationSettingsSchema),
      defaultValues: {
        documentExpiryAlerts: true,
        documentExpiryDays: 30,
      },
      values: settings ? mapSettingsToForm(settings) : undefined,
    });

    const documentExpiryAlerts = useWatch({
      control: form.control,
      name: "documentExpiryAlerts",
    });

    const onSubmit = useCallback(
      (data: NotificationSettingsFormData) => {
        setShowValidationSummary(false);
        const dto: UpdateNotificationSettingsDTO = {
          documentExpiryAlerts: data.documentExpiryAlerts,
          documentExpiryDays: data.documentExpiryDays,
        };
        updateMutation.mutate(dto);
      },
      [updateMutation],
    );

    const onInvalid = useCallback(() => {
      setShowValidationSummary(true);
    }, []);

    if (isLoading) {
      return <NotificationSettingsFormSkeleton />;
    }

    if (isError || !settings) {
      return (
        <EmptyState
          icon={<AlertTriangle />}
          title={copy.state.loadErrorTitle}
          description={copy.state.loadErrorDescription}
          cta={{
            label: copy.state.retry,
            icon: <RefreshCw />,
            onClick: () => void refetch(),
          }}
        />
      );
    }

    const fieldErrors = collectFieldErrorMessages(form.formState.errors);

    return (
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6"
        noValidate
      >
        {showValidationSummary && fieldErrors.length > 0 ? (
          <FormValidationSummary
            title={copy.validation.summaryTitle}
            messages={fieldErrors}
          />
        ) : null}

        <SettingsCard
          title={copy.documents.title}
          description={copy.documents.description}
        >
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Bell
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {copy.documents.toggleLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {copy.documents.toggleHint}
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="documentExpiryAlerts"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={copy.documents.toggleLabel}
                    />
                  )}
                />
              </div>
            </div>

            {documentExpiryAlerts ? (
              <FormFieldShell
                fieldId="documentExpiryDays"
                label={copy.documents.daysLabel}
                required
                description={copy.documents.daysHint}
                errorMessage={form.formState.errors.documentExpiryDays?.message}
              >
                <Input
                  id="documentExpiryDays"
                  type="number"
                  min={1}
                  max={365}
                  className="max-w-[8rem]"
                  {...form.register("documentExpiryDays", {
                    valueAsNumber: true,
                  })}
                  {...getRegisterFieldErrorProps(
                    "documentExpiryDays",
                    form.formState.errors.documentExpiryDays?.message,
                  )}
                />
              </FormFieldShell>
            ) : null}
          </div>
        </SettingsCard>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Button variant="link" className="h-auto px-0" asChild>
              <Link to="/notifications">{copy.action.viewInbox}</Link>
            </Button>
            <p className="text-xs text-muted-foreground">{copy.inboxLink.hint}</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset(mapSettingsToForm(settings));
                setShowValidationSummary(false);
              }}
              disabled={!form.formState.isDirty || updateMutation.isPending}
            >
              {copy.action.cancel}
            </Button>
            <Button
              type="submit"
              disabled={!form.formState.isDirty || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {copy.action.saving}
                </>
              ) : (
                copy.action.save
              )}
            </Button>
          </div>
        </div>
      </form>
    );
  },
);

function NotificationSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}
