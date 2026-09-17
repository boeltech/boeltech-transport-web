import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Checkbox } from "@shared/ui/checkbox";
import { Textarea } from "@shared/ui/text-area/textarea";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  FieldInlineError,
  MoneyInput,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { useCreateDriverAdvance } from "../../application/hooks/useAdvances";
import {
  driverAdvanceFormSchema,
  type DriverAdvanceFormData,
} from "../validation/settlementSchemas";
import {
  ADVANCE_CATEGORY_LABELS,
  DISBURSEMENT_METHOD_LABELS,
  GREENFIELD_ADVANCE_CATEGORIES,
  type AdvanceCategory,
  type DisbursementMethod,
} from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import { usePagosOperadoresGreenfield } from "../../application/hooks";

interface DriverAdvanceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmployeeId?: string;
  onSuccess?: () => void;
}

export function DriverAdvanceCreateDialog({
  open,
  onOpenChange,
  defaultEmployeeId,
  onSuccess,
}: DriverAdvanceCreateDialogProps) {
  const copy = settlementsCopy.advancesDialog;
  const { toast } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  const createMutation = useCreateDriverAdvance();
  const {
    enabled: greenfieldEnabled,
    isReady: settingsReady,
    isError: settingsError,
  } = usePagosOperadoresGreenfield();
  const categoryOptions = greenfieldEnabled
    ? GREENFIELD_ADVANCE_CATEGORIES
    : (Object.keys(ADVANCE_CATEGORY_LABELS) as AdvanceCategory[]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverAdvanceFormData>({
    resolver: zodResolver(driverAdvanceFormSchema) as never,
    defaultValues: {
      employeeId: defaultEmployeeId ?? "",
      amount: undefined,
      currency: "MXN",
      category: greenfieldEnabled ? "loan" : "travel_advance",
      paymentMethod: "bank_transfer",
      bankReference: "",
      submitForApproval: true,
      notes: "",
    } as unknown as DriverAdvanceFormData,
  });

  const selectedCategory = watch("category");
  const selectedPaymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({
        employeeId: defaultEmployeeId ?? "",
        amount: undefined,
        currency: "MXN",
        category: greenfieldEnabled ? "loan" : "travel_advance",
        paymentMethod: "bank_transfer",
        bankReference: "",
        submitForApproval: true,
        notes: "",
        tripId: "",
      } as unknown as DriverAdvanceFormData);
    }
  }, [open, defaultEmployeeId, reset, greenfieldEnabled]);

  const onSubmit = async (data: DriverAdvanceFormData) => {
    try {
      setApiError(null);
      await createMutation.mutateAsync(data);
      toast({
        title: copy.toastSuccess,
        variant: "success",
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {greenfieldEnabled ? copy.loanTitle : copy.title}
          </DialogTitle>
          <DialogDescription>
            {greenfieldEnabled ? copy.loanDescription : copy.description}
          </DialogDescription>
        </DialogHeader>

        {apiError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        {settingsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {settlementsCopy.toasts.settingsUnavailable}
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <Controller
            control={control}
            name="employeeId"
            render={({ field, fieldState }) => (
              <EmployeeAsyncCombobox
                id="adv-employee"
                label={copy.employeeLabel}
                value={field.value}
                onChange={(employeeId) =>
                  setValue("employeeId", employeeId, { shouldValidate: true })
                }
                placeholder={copy.employeePlaceholder}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="adv-amount">{copy.amountLabel}</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field, fieldState }) => (
                  <MoneyInput
                    id="adv-amount"
                    name={field.name}
                    value={
                      typeof field.value === "number" && Number.isFinite(field.value)
                        ? field.value
                        : undefined
                    }
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    currencyCode="MXN"
                    decimals={2}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps("adv-amount", fieldState.error?.message)}
                  />
                )}
              />
              <FieldInlineError fieldId="adv-amount" message={errors.amount?.message as string | undefined} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="adv-category">{copy.categoryLabel}</Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) =>
                  setValue("category", val as AdvanceCategory, { shouldValidate: true })
                }
                disabled={greenfieldEnabled}
              >
                <SelectTrigger
                  id="adv-category"
                  {...getFieldErrorAriaProps("adv-category", errors.category?.message)}
                >
                  <SelectValue placeholder={copy.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {(categoryOptions).map(
                    (cat) => (
                      <SelectItem key={cat} value={cat}>
                        {ADVANCE_CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FieldInlineError fieldId="adv-category" message={errors.category?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="adv-payment-method">{copy.paymentMethodLabel}</Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={(val) =>
                  setValue("paymentMethod", val as DisbursementMethod, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  id="adv-payment-method"
                  {...getFieldErrorAriaProps("adv-payment-method", errors.paymentMethod?.message)}
                >
                  <SelectValue placeholder={copy.paymentMethodPlaceholder} />
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
              <FieldInlineError fieldId="adv-payment-method" message={errors.paymentMethod?.message} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="adv-ref">{copy.bankReferenceLabel}</Label>
              <Input
                id="adv-ref"
                placeholder={copy.bankReferencePlaceholder}
                {...register("bankReference")}
                {...getRegisterFieldErrorProps("adv-ref", errors.bankReference?.message)}
              />
              <FieldInlineError fieldId="adv-ref" message={errors.bankReference?.message} />
            </div>
          </div>

          {/* CHECKBOX ENVIAR DIRECTAMENTE A AUTORIZACIÓN (ADR-0086) */}
          <div className="rounded-md border bg-muted/20 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="adv-submit-for-approval" className="text-xs font-semibold cursor-pointer">
                Enviar a autorización inmediatamente
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Si está activo, entra directamente a la bandeja de pendientes por autorizar.
              </p>
            </div>
            <Controller
              control={control}
              name="submitForApproval"
              render={({ field }) => (
                <Checkbox
                  id="adv-submit-for-approval"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="adv-notes">{copy.notesLabel}</Label>
            <Textarea
              id="adv-notes"
              rows={2}
              placeholder={copy.notesPlaceholder}
              {...register("notes")}
              {...getRegisterFieldErrorProps("adv-notes", errors.notes?.message)}
            />
            <FieldInlineError fieldId="adv-notes" message={errors.notes?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {settlementsCopy.actions.cancel}
            </Button>
            <Button
              type="submit"
              // Sin configuración cargada no se sabe qué categorías permite el
              // tenant: se espera en lugar de crear un anticipo que el API rechace.
              disabled={isSubmitting || createMutation.isPending || !settingsReady}
            >
              {createMutation.isPending ? copy.saving : copy.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
