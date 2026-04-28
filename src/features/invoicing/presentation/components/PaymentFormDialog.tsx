import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { FormaPagoSelect } from "@features/catalogs/presentation/components";
import { useRegisterPayment } from "@features/invoicing/application";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { Invoice } from "@features/invoicing/domain";

// ============================================================================
// SCHEMA
// ============================================================================

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

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentFormDialog({ invoice, open, onOpenChange }: Props) {
  const { toast } = useToast();
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
  });

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

  const onSubmit = (values: FormValues) => {
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
      paymentDate: values.payment_date,
      paymentForm: values.payment_form,
      reference: values.reference || undefined,
      notes: values.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (MXN)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        max={remainingBalance}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={!hasPendingBalance}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de pago</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={!hasPendingBalance} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payment_form"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pago</FormLabel>
                  <FormControl>
                    <FormaPagoSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecciona forma de pago"
                      disabled={!hasPendingBalance}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de transferencia, cheque..."
                      {...field}
                      disabled={!hasPendingBalance}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Notas adicionales"
                      {...field}
                      disabled={!hasPendingBalance}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
