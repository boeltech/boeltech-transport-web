/**
 * Paso 1 del wizard de reserva (ADR-0071): pedido operativo mínimo.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Building2, ExternalLink, Loader2 } from "lucide-react";

import { FormFieldShell, DateTimeField, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";

import type { TripWizardFormValues } from "./validation";
import { wizardCopy } from "../../../copy";
import { tripScheduleDateTimeFieldProps } from "../../../scheduleDateTimeField";

const shell = wizardCopy.shell;
const basic = wizardCopy.basicInfo;
const reserve = shell.reserve;

interface ReservePedidoStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  clients: Array<{ id: string; legalName: string }>;
  isLoadingClients: boolean;
  /** Slot tras el cliente (picker de corredor en el canvas ADR-0078). */
  afterClient?: ReactNode;
}

export function ReservePedidoStep({
  form,
  clients,
  isLoadingClients,
  afterClient,
}: ReservePedidoStepProps) {
  const { control } = form;
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(basic.preset);

  return (
    <div className="space-y-6">
      <section className="space-y-4" aria-labelledby="reserve-client-heading">
        <h2 id="reserve-client-heading" className="sr-only">
          {reserve.label.client}
        </h2>
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
                    title={reserve.label.client}
                    hintLabel={reserve.label.client}
                    required
                    hint={<>{reserve.hint.client}</>}
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
        {afterClient}
      </section>

      <section className="space-y-4" aria-labelledby="reserve-route-heading">
        <h2
          id="reserve-route-heading"
          className="text-sm font-medium text-foreground"
        >
          {reserve.section.routeApprox}
        </h2>
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
      </section>

      <section className="space-y-4" aria-labelledby="reserve-schedule-heading">
        <h2
          id="reserve-schedule-heading"
          className="text-sm font-medium text-foreground"
        >
          {reserve.section.schedule}
        </h2>
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
              <DateTimeField
                id="scheduledDeparture"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                {...scheduleFieldProps}
                {...getFieldErrorAriaProps(
                  "scheduledDeparture",
                  fieldState.error?.message,
                )}
              />
            </FormFieldShell>
          )}
        />
      </section>
    </div>
  );
}
