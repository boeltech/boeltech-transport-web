/**
 * Opcionales comerciales del canvas de reserva (F1 intake lean):
 * llegada, tarifa y km. Notas del pedido viven en Pedido (fuera del colapsable).
 */
import { Controller, type UseFormReturn } from "react-hook-form";

import {
  DateTimeField,
  FormFieldShell,
  getFieldErrorAriaProps,
  RHFMoneyField,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";

import type { TripWizardFormValues } from "./validation";
import { canvasCopy } from "../../../copy/canvasCopy";
import { tripScheduleDateTimeFieldProps } from "../../../scheduleDateTimeField";

const fields = canvasCopy.fields;

interface ReserveConfirmLaterFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
}

export function ReserveConfirmLaterFields({
  form,
}: ReserveConfirmLaterFieldsProps) {
  const { control, watch } = form;
  const vehicleCurrentMileage = watch("vehicleCurrentMileage");
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(fields.preset);

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
                  title={fields.label.scheduledArrival}
                  hintLabel={fields.hintLabel.scheduledArrival}
                  hint={<>{fields.hint.arrival}</>}
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
            label={fields.label.baseRate}
            description={fields.hint.baseRate}
          />
        </div>

        <Controller
          control={control}
          name="startMileage"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="reserve-startMileage"
              label={fields.label.startMileage}
              errorMessage={fieldState.error?.message}
              description={
                vehicleCurrentMileage !== undefined
                  ? fields.format.currentMileage(vehicleCurrentMileage)
                  : fields.hint.startMileage
              }
            >
              <Input
                id="reserve-startMileage"
                type="number"
                placeholder={fields.placeholder.startMileage}
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
    </div>
  );
}
