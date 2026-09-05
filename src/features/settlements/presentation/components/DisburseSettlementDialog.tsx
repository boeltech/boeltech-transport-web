import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FieldInlineError, RHFDateTimeField } from "@shared/ui/form";
import { AlertWithIcon } from "@shared/ui/alert";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useDisburseSettlement } from "../../application/hooks/useSettlements";
import {
  disburseSettlementFormSchema,
  type DisburseSettlementFormData,
} from "../validation/settlementSchemas";
import {
  DISBURSEMENT_METHOD_LABELS,
  type DisbursementMethod,
} from "../../domain/enums";
import type { DriverSettlement } from "../../domain/entities";

interface DisburseSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: DriverSettlement | null;
  onSuccess?: () => void;
}

function defaultDisbursedAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

export function DisburseSettlementDialog({
  open,
  onOpenChange,
  settlement,
  onSuccess,
}: DisburseSettlementDialogProps) {
  const { toast } = useToast();
  const disburseMutation = useDisburseSettlement();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DisburseSettlementFormData>({
    resolver: zodResolver(disburseSettlementFormSchema),
    defaultValues: {
      disbursementMethod: "bank_transfer",
      disbursementReference: "",
      disbursedAt: defaultDisbursedAtLocal(),
      notes: "",
    },
  });

  const selectedMethod = watch("disbursementMethod");

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({
        disbursementMethod: "bank_transfer",
        disbursementReference: "",
        disbursedAt: defaultDisbursedAtLocal(),
        notes: "",
      });
    }
  }, [open, reset]);

  if (!settlement) return null;

  const isPending = isSubmitting || disburseMutation.isPending;

  const onSubmit = async (data: DisburseSettlementFormData) => {
    setApiError(null);
    try {
      await disburseMutation.mutateAsync({
        id: settlement.id,
        data: {
          ...data,
          disbursedAt: localInputToUtcIso(data.disbursedAt),
        },
      });
      toast({
        title: "Liquidación dispersada correctamente",
        variant: "success",
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setApiError(errorMsg);
      toast({
        title: "Error al dispersar liquidación",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Registrar pago al operador</DialogTitle>
          <DialogDescription>
            Captura la referencia bancaria o folio de la transferencia efectuada para liquidar el folio{" "}
            <span className="font-semibold text-foreground">
              {settlement.settlementNumber}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <AlertWithIcon variant="destructive" title="No se pudo registrar el pago">
            {apiError}
          </AlertWithIcon>
        )}

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Operador:</span>
            <span className="font-medium">{settlement.employeeFullName ?? "—"}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">Monto neto pagado:</span>
            <span className="font-bold text-primary">
              {formatMxCurrency(settlement.netAmount)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="disb-method">Método de pago *</Label>
            <Select
              value={selectedMethod}
              disabled={isPending}
              onValueChange={(val) =>
                setValue("disbursementMethod", val as DisbursementMethod, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="disb-method">
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(DISBURSEMENT_METHOD_LABELS) as DisbursementMethod[]
                ).map((m) => (
                  <SelectItem key={m} value={m}>
                    {DISBURSEMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldInlineError fieldId="disb-method" message={errors.disbursementMethod?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="disb-ref">Referencia bancaria / Folio SPEI *</Label>
            <Input
              id="disb-ref"
              disabled={isPending}
              placeholder="Ej. SPEI-998823 o Cheque #452"
              {...register("disbursementReference")}
            />
            <FieldInlineError fieldId="disb-ref" message={errors.disbursementReference?.message} />
          </div>

          <RHFDateTimeField
            control={control}
            name="disbursedAt"
            fieldId="disb-date"
            label="Fecha y hora de transferencia"
            required
            disabled={isPending}
          />

          <div className="space-y-1">
            <Label htmlFor="disb-notes">Observaciones de tesorería</Label>
            <Textarea
              id="disb-notes"
              rows={2}
              disabled={isPending}
              placeholder="Comprobante, cuenta de destino o notas adicionales..."
              {...register("notes")}
            />
            <FieldInlineError fieldId="disb-notes" message={errors.notes?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {disburseMutation.isPending ? "Registrando..." : "Confirmar pago realizado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
