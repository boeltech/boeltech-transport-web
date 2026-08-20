/**
 * Campos secundarios del canvas de reserva (PD1): llegada, tarifa, km y notas.
 */
import { Controller, type UseFormReturn } from "react-hook-form";

import {
  DateTimeField,
  FormFieldShell,
  getFieldErrorAriaProps,
  RHFMoneyField,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";

import type { TripWizardFormValues } from "./validation";
import { wizardCopy } from "../../../copy";
import { tripScheduleDateTimeFieldProps } from "../../../scheduleDateTimeField";

const shell = wizardCopy.shell;
const reserve = shell.reserve;
const basic = wizardCopy.basicInfo;

interface ReserveConfirmLaterFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
}

export function ReserveConfirmLaterFields({
  form,
}: ReserveConfirmLaterFieldsProps) {
  const { control, watch } = form;
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(basic.preset);
  const vehicleCurrentMileage = watch("vehicleCurrentMileage");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  hint={<>{reserve.hint.arrival}</>}
                />
              }
              errorMessage={fieldState.error?.message}
            >
              <DateTimeField
                id="scheduledArrival"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                {...scheduleFieldProps}
                {...getFieldErrorAriaProps(
                  "scheduledArrival",
                  fieldState.error?.message,
                )}
              />
            </FormFieldShell>
          )}
        />

        <div className="max-w-sm">
          <RHFMoneyField
            control={control}
            name="baseRate"
            label={reserve.label.baseRate}
            description={reserve.hint.baseRate}
          />
        </div>

        <Controller
          control={control}
          name="startMileage"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="reserve-startMileage"
              label={basic.label.startMileage}
              errorMessage={fieldState.error?.message}
              description={
                vehicleCurrentMileage !== undefined
                  ? basic.format.currentMileage(vehicleCurrentMileage)
                  : reserve.hint.startMileage
              }
            >
              <Input
                id="reserve-startMileage"
                type="number"
                placeholder={basic.placeholder.startMileage}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(
                  "reserve-startMileage",
                  fieldState.error?.message,
                )}
              />
            </FormFieldShell>
          )}
        />
      </div>

      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <FormFieldShell
            fieldId="notes"
            label={reserve.label.notes}
            errorMessage={fieldState.error?.message}
            description={reserve.hint.notes}
          >
            <Textarea
              id="notes"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={reserve.placeholder.notes}
              rows={3}
              error={Boolean(fieldState.error)}
              {...getFieldErrorAriaProps("notes", fieldState.error?.message)}
            />
          </FormFieldShell>
        )}
      />
    </div>
  );
}
