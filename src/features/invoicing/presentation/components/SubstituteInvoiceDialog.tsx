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
import { Textarea } from "@shared/ui/text-area";
import { Button } from "@shared/ui/button";
import { useSubstituteStampedInvoice } from "@features/invoicing/application";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { Invoice } from "@features/invoicing/domain";

const schema = z.object({
  cancellationReason: z
    .string()
    .min(1, "Describe el motivo (se envía al SAT como parte de la cancelación 01)")
    .max(500),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubstituteInvoiceDialog({ invoice, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      cancellationReason: "",
      notes: "",
    },
  });

  const { mutate, isPending } = useSubstituteStampedInvoice(invoice.id, {
    onSuccess: (data) => {
      toast({
        title: "Sustitución completada",
        description: `Nueva factura ${data.replacement.serie}-${data.replacement.folio} timbrada; original cancelada (01).`,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error en sustitución",
        description: getErrorMessage(err),
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate({
      cancellationReason: values.cancellationReason.trim(),
      notes: values.notes?.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sustituir factura (SAT 01)</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Se emitirá una <strong>nueva factura</strong> con los mismos viajes e importes,
          se timbrará y luego se solicitará la cancelación de esta factura (
          <strong>{invoice.serie}-{invoice.folio}</strong>) con motivo{" "}
          <strong>01</strong> (errores con relación). Requiere tenant con flag de
          sustitución activo y factura sin pagos registrados.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cancellationReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de cancelación del CFDI original</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej. Corrección de datos fiscales del receptor"
                      rows={3}
                      {...field}
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
                  <FormLabel>Notas internas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Contexto para auditoría" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Procesando..." : "Confirmar sustitución"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
