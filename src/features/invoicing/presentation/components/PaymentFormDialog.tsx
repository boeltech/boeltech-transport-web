import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFCatalogField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { FormaPagoSelect } from "@features/catalogs/presentation/components";
import { useRegisterPayment } from "@features/invoicing/application";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { Invoice } from "@features/invoicing/domain";

const schema = z.object({
  amount: z.coerce
    .number()
    .refine((n) => !Number.isNaN(n), { message: "Monto requerido" })
    .positive("El monto debe ser mayor a 0"),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato requerido: YYYY-MM-DD"),
  payment_form: z.string().min(1, "Forma de pago requerida"),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentFormDialog({ invoice, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const remainingBalance = Number(invoice.balanceDue.toFixed(2));
  const hasPendingBalance = remainingBalance > 0;

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      amount: invoice.balanceDue > 0 ? Number(invoice.balanceDue.toFixed(2)) : 0,
      payment_date: new Date().toISOString().split("T")[0],
      payment_form: "03",
      reference: "",
      notes: "",
    },
    mode: "onChange",
  });

  const { control } = form;

  const { mutate, isPending } = useRegisterPayment(invoice.id, {
    onSuccess: () => {
      toast({ title: "Pago registrado exitosamente" });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error al registrar pago",
        description: getErrorMessage(err),
      });
    },
  });

  const submitValues = (values: FormValues) => {
    if (!hasPendingBalance) {
      toast({
        variant: "destructive",
        title: "Sin saldo pendiente",
        description: "Esta factura ya no tiene saldo por cobrar.",
      });
      return;
    }

    if (values.amount > remainingBalance) {
      toast({
        variant: "destructive",
        title: "Monto inválido",
        description: "El pago no puede exceder el saldo pendiente.",
      });
      return;
    }

    mutate({
      amount: values.amount,
      currency: invoice.currency,
      exchangeRate: 1,
      paymentDate: values.payment_date,
      paymentForm: values.payment_form,
      reference: values.reference || undefined,
      notes: values.notes || undefined,
    });
  };

  const handleFormSubmit = form.handleSubmit(
    (values) => {
      setShowValidationSummary(false);
      submitValues(values);
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const validationMessages = collectFieldErrorMessages(form.formState.errors);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {invoice.paymentMethod === "PPD"
              ? "Registrar pago (PPD / REP)"
              : "Registrar pago"}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          Saldo pendiente:{" "}
          <span className="font-semibold text-foreground">
            {new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN",
            }).format(invoice.balanceDue)}
          </span>
        </div>
        {!hasPendingBalance && (
          <p className="text-xs text-muted-foreground mb-2">
            Esta factura ya está liquidada; no se pueden registrar más pagos.
          </p>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="amount"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="amount"
                  label="Monto (MXN)"
                  required
                  errorMessage={fieldState.error?.message}
                >
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    max={remainingBalance}
                    placeholder="0.00"
                    disabled={!hasPendingBalance}
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(parseFloat(event.target.value) || 0)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps("amount", fieldState.error?.message)}
                  />
                </FormFieldShell>
              )}
            />
            <RHFTextField
              control={control}
              name="payment_date"
              label="Fecha de pago"
              required
              type="date"
              disabled={!hasPendingBalance}
            />
          </div>

          <RHFCatalogField control={control} name="payment_form" label="Forma de pago" required>
            {({ field, fieldState, resolvedId, errorMessage }) => (
              <FormaPagoSelect
                triggerId={resolvedId}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecciona forma de pago"
                disabled={!hasPendingBalance}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
            )}
          </RHFCatalogField>

          <RHFTextField
            control={control}
            name="reference"
            label="Referencia (opcional)"
            placeholder="Número de transferencia, cheque..."
            disabled={!hasPendingBalance}
          />

          <RHFTextField
            control={control}
            name="notes"
            label="Notas (opcional)"
            placeholder="Notas adicionales"
            disabled={!hasPendingBalance}
          />

          {showValidationSummary && validationMessages.length > 0 ? (
            <FormValidationSummary
              title="Revisa los datos del pago"
              messages={validationMessages}
            />
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !hasPendingBalance}>
              {isPending ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
