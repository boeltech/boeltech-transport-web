import { useState } from "react";
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
import { Button } from "@shared/ui/button";
import {
  FormValidationSummary,
  RHFTextareaField,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
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
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      cancellationReason: "",
      notes: "",
    },
    mode: "onChange",
  });

  const { control } = form;

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

  const handleFormSubmit = form.handleSubmit(
    (values) => {
      setShowValidationSummary(false);
      mutate({
        cancellationReason: values.cancellationReason.trim(),
        notes: values.notes?.trim() || undefined,
      });
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const validationMessages = collectFieldErrorMessages(form.formState.errors);

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

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <RHFTextareaField
            control={control}
            name="cancellationReason"
            label="Motivo de cancelación del CFDI original"
            required
            placeholder="Ej. Corrección de datos fiscales del receptor"
            rows={3}
          />

          <RHFTextareaField
            control={control}
            name="notes"
            label="Notas internas (opcional)"
            placeholder="Contexto para auditoría"
            rows={2}
          />

          {showValidationSummary && validationMessages.length > 0 ? (
            <FormValidationSummary
              title="Revisa los datos de sustitución"
              messages={validationMessages}
            />
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Procesando..." : "Confirmar sustitución"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
