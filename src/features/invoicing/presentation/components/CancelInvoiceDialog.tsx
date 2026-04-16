import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { useCancelInvoice } from "@features/invoicing/application";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";

const MOTIVOS = [
  { value: "01", label: "01 - Comprobante emitido con errores con relación" },
  { value: "02", label: "02 - Comprobante emitido con errores sin relación" },
  { value: "03", label: "03 - No se llevó a cabo la operación" },
  { value: "04", label: "04 - Operación nominativa relacionada en la factura global" },
];

const schema = z.object({
  cancellation_reason: z.string().min(1, "Motivo requerido").max(500),
  cancellation_code: z.enum(["01", "02", "03", "04"]),
  replacement_cfdi_uuid: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().uuid("UUID de sustitución inválido").optional(),
  ),
}).superRefine((data, ctx) => {
  if (data.cancellation_code === "01" && !data.replacement_cfdi_uuid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["replacement_cfdi_uuid"],
      message: "Para motivo 01, UUID de sustitución es obligatorio",
    });
  }
});

type FormValues = z.infer<typeof schema>;

interface Props {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelInvoiceDialog({ invoiceId, open, onOpenChange }: Props) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cancellation_reason: "",
      cancellation_code: "02",
      replacement_cfdi_uuid: "",
    },
  });

  const cancellationCode = form.watch("cancellation_code");

  const { mutate, isPending } = useCancelInvoice({
    onSuccess: (invoice) => {
      const isPending = invoice.status === "cancellation_pending";
      toast({
        title: isPending ? "Solicitud de cancelación enviada" : "Factura cancelada",
        description: isPending
          ? "El SAT/PAC reportó estatus pendiente de aceptación del receptor."
          : undefined,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error al cancelar factura",
        description: getErrorMessage(err),
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate({
      id: invoiceId,
      payload: {
        cancellationReason: values.cancellation_reason,
        cancellationCode: values.cancellation_code,
          replacementCfdiUuid: values.replacement_cfdi_uuid || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Factura</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Esta acción cancelará la factura. Por regulación del SAT, debes
          proporcionar el motivo de cancelación.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cancellation_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo SAT</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOTIVOS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellation_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Describe el motivo de cancelación..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {cancellationCode === "01" && (
              <FormField
                control={form.control}
                name="replacement_cfdi_uuid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UUID de CFDI sustitución</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Volver
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending}
              >
                {isPending ? "Cancelando..." : "Confirmar cancelación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
