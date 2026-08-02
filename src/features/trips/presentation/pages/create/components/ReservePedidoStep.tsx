/**
 * Paso 1 del wizard de reserva (ADR-0071): pedido comercial mínimo.
 */
import { Link } from "react-router-dom";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Building2, ExternalLink, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Textarea } from "@shared/ui/text-area";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";

import type { TripWizardFormValues } from "./validation";
import { wizardCopy } from "../../../copy";

const shell = wizardCopy.shell;
const basic = wizardCopy.basicInfo;
const reserve = shell.reserve;

interface ReservePedidoStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  clients: Array<{ id: string; legalName: string }>;
  isLoadingClients: boolean;
}

export function ReservePedidoStep({
  form,
  clients,
  isLoadingClients,
}: ReservePedidoStepProps) {
  const { control } = form;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{shell.step.pedido.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {shell.step.pedido.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Controller
              control={control}
              name="clientId"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="clientId"
                  label={
                    <SectionHeadingWithHint
                      noTitleWrap
                      title={basic.label.client}
                      hintLabel={basic.hintLabel.client}
                      required
                      hint={<>{basic.hint.client}</>}
                    />
                  }
                  errorMessage={fieldState.error?.message}
                >
                  <Select
                    onValueChange={(value) => value && field.onChange(value)}
                    value={field.value ?? ""}
                    disabled={isLoadingClients}
                  >
                    <SelectTrigger
                      id="clientId"
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        "clientId",
                        fieldState.error?.message,
                      )}
                    >
                      {isLoadingClients ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      <SelectValue placeholder={basic.placeholder.selectClient} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldShell>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {reserve.hint.newClient}{" "}
              <Link
                to="/clients/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                {reserve.action.newClient}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="originCity"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="originCity"
                  label={reserve.label.originCity}
                  required
                  errorMessage={fieldState.error?.message}
                >
                  <Input
                    id="originCity"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={reserve.placeholder.originCity}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "originCity",
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />
            <Controller
              control={control}
              name="destinationCity"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="destinationCity"
                  label={reserve.label.destinationCity}
                  required
                  errorMessage={fieldState.error?.message}
                >
                  <Input
                    id="destinationCity"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={reserve.placeholder.destinationCity}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "destinationCity",
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="scheduledDeparture"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="scheduledDeparture"
                  label={basic.label.scheduledDeparture}
                  required
                  errorMessage={fieldState.error?.message}
                >
                  <Input
                    id="scheduledDeparture"
                    type="datetime-local"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "scheduledDeparture",
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />
            <Controller
              control={control}
              name="scheduledArrival"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="scheduledArrival"
                  label={
                    <SectionHeadingWithHint
                      noTitleWrap
                      title={basic.label.scheduledArrival}
                      hintLabel={basic.hintLabel.scheduledArrival}
                      hint={<>Opcional en la reserva; conviene al confirmar.</>}
                    />
                  }
                  errorMessage={fieldState.error?.message}
                >
                  <Input
                    id="scheduledArrival"
                    type="datetime-local"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "scheduledArrival",
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{reserve.label.notes}</Label>
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="notes"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={reserve.placeholder.notes}
                    rows={3}
                    aria-invalid={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "notes",
                      fieldState.error?.message,
                    )}
                  />
                  {fieldState.error?.message ? (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {reserve.hint.notes}
                    </p>
                  )}
                </>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
