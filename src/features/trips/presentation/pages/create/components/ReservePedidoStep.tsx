/**
 * Pedido del canvas de reserva (intake lean F1):
 * Cliente → (corredor) → ciudades → fecha salida → clase de ruta (secundaria).
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Building2, ExternalLink, Loader2 } from "lucide-react";

import {
  TRIP_ROUTE_TYPE_LABELS,
  TripRouteType,
} from "@features/trips/domain";
import { FormFieldShell, DateTimeField, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { usePermissions } from "@shared/permissions";

import type { TripWizardFormValues } from "./validation";
import { canvasCopy } from "../../../copy/canvasCopy";
import { tripScheduleDateTimeFieldProps } from "../../../scheduleDateTimeField";

const fields = canvasCopy.fields;

const ROUTE_TYPE_OPTIONS = [
  TripRouteType.LONG_HAUL,
  TripRouteType.LOCAL,
  TripRouteType.TRANSFER,
] as const;

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
  const { hasPermission } = usePermissions();
  const canCreateClient = hasPermission("clients", "create");
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(fields.preset);

  return (
    <div className="space-y-6">
      <section className="space-y-4" aria-labelledby="reserve-client-heading">
        <h2 id="reserve-client-heading" className="sr-only">
          {fields.label.client}
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
                    title={fields.label.client}
                    hintLabel={fields.label.client}
                    required
                    hint={<>{fields.hint.client}</>}
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
                    <SelectValue placeholder={fields.placeholder.selectClient} />
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
            {canCreateClient ? (
              <>
                {fields.hint.newClient}{" "}
                <Link
                  to="/clients/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  {fields.action.newClient}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              </>
            ) : (
              fields.hint.newClientEscalate
            )}
          </p>
        </div>
        {afterClient}
      </section>

      <section className="space-y-4" aria-labelledby="reserve-route-heading">
        <h2
          id="reserve-route-heading"
          className="text-sm font-medium text-foreground"
        >
          {fields.section.routeApprox}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="originCity"
            render={({ field, fieldState }) => (
              <FormFieldShell
                fieldId="originCity"
                label={fields.label.originCity}
                required
                errorMessage={fieldState.error?.message}
              >
                <Input
                  id="originCity"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={fields.placeholder.originCity}
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
                label={fields.label.destinationCity}
                required
                errorMessage={fieldState.error?.message}
              >
                <Input
                  id="destinationCity"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={fields.placeholder.destinationCity}
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
          {fields.section.schedule}
        </h2>
        <Controller
          control={control}
          name="scheduledDeparture"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="scheduledDeparture"
              label={fields.label.scheduledDeparture}
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

      {/* PD2: notas del canal — visibles en Pedido, fuera del colapsable */}
      <section className="space-y-4" aria-label={fields.label.notes}>
        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="notes"
              label={fields.label.notes}
              errorMessage={fieldState.error?.message}
              description={fields.hint.notes}
            >
              <Textarea
                id="notes"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={fields.placeholder.notes}
                rows={3}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps("notes", fieldState.error?.message)}
              />
            </FormFieldShell>
          )}
        />
      </section>

      {/* PD7: clase de ruta secundaria — default en form; no compite con el script de llamada */}
      <section
        className="space-y-3 border-t border-border/60 pt-4"
        aria-label={fields.label.routeType}
      >
        <Controller
          control={control}
          name="routeType"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="routeType"
              label={
                <SectionHeadingWithHint
                  noTitleWrap
                  title={fields.label.routeType}
                  hintLabel={fields.label.routeType}
                  hint={<>{fields.hint.routeType}</>}
                />
              }
              errorMessage={fieldState.error?.message}
            >
              <Select
                onValueChange={(value) => value && field.onChange(value)}
                value={field.value ?? TripRouteType.LONG_HAUL}
              >
                <SelectTrigger
                  id="routeType"
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps(
                    "routeType",
                    fieldState.error?.message,
                  )}
                >
                  <SelectValue placeholder={fields.placeholder.routeType} />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_TYPE_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {TRIP_ROUTE_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldShell>
          )}
        />
      </section>
    </div>
  );
}
