import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
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
import {
  FormValidationSummary,
  RHFSelectField,
  RHFTextField,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
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
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      cancellation_reason: "",
      cancellation_code: "02",
      replacement_cfdi_uuid: undefined,
    },
    mode: "onChange",
  });

  const { control } = form;

  const cancellationCode = useWatch({
    control,
    name: "cancellation_code",
  });

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

  const handleFormSubmit = form.handleSubmit(
    (values) => {
      setShowValidationSummary(false);
      mutate({
        id: invoiceId,
        payload: {
          cancellationReason: values.cancellation_reason,
          cancellationCode: values.cancellation_code,
          replacementCfdiUuid: values.replacement_cfdi_uuid || undefined,
        },
      });
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
          <DialogTitle>Cancelar Factura</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Esta acción cancelará la factura. Por regulación del SAT, debes
          proporcionar el motivo de cancelación.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <RHFSelectField
            control={control}
            name="cancellation_code"
            label="Motivo SAT"
            required
            placeholder="Selecciona motivo"
            options={MOTIVOS}
          />

          <RHFTextField
            control={control}
            name="cancellation_reason"
            label="Descripción"
            required
            placeholder="Describe el motivo de cancelación..."
          />

          {cancellationCode === "01" ? (
            <RHFTextField
              control={control}
              name="replacement_cfdi_uuid"
              label="UUID de CFDI sustitución"
              required
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          ) : null}

          {showValidationSummary && validationMessages.length > 0 ? (
            <FormValidationSummary
              title="Revisa los datos de cancelación"
              messages={validationMessages}
            />
          ) : null}

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
      </DialogContent>
    </Dialog>
  );
}
