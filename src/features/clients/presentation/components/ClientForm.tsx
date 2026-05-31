import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useForm,
  Controller,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form/FieldInlineError";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Button } from "@shared/ui/button";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Building2, Phone, CreditCard, FileText, Landmark, Loader2 } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { useToast } from "@shared/hooks";
import {
  collectFieldErrorMessages,
  formatFormValidationToastDescription,
} from "@shared/utils/formErrors";
import { RegimenFiscalSelect } from "@features/catalogs";
import { FormValidationSummary } from "@shared/ui/form";

import {
  CLIENT_TYPE_LABELS,
  PAYMENT_TERMS_LABELS,
  type Client,
} from "../../domain";
import {
  clientFormSchema,
  clientToFormValues,
  defaultClientFormValues,
  type ClientFormData,
} from "../validation/clientSchema";

export interface ClientFormRef {
  /** Valida todos los campos y muestra errores si falla. */
  triggerValidation: () => Promise<boolean>;
}

export interface ClientFormProps {
  /** Entidad cargada (edición): hidrata el formulario vía reset. */
  client?: Client;
  defaultValues?: Partial<ClientFormData>;
  /** Alta en wizard: notifica cambios al padre sin footer propio. */
  onChange?: (data: ClientFormData, isValid: boolean) => void;
  /** Edición / submit directo (p. ej. ClientEditPage). */
  onSubmit?: (data: ClientFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  disabled?: boolean;
  className?: string;
}

/** Firma rápida (evita `JSON.stringify` en cada tecla al notificar al padre). */
const CLIENT_NOTIFY_KEYS = [
  "type",
  "legalName",
  "tradeName",
  "taxId",
  "taxRegime",
  "contactName",
  "contactPosition",
  "phone",
  "secondaryPhone",
  "email",
  "billingEmail",
  "paymentTerms",
  "creditDays",
  "creditLimit",
  "notes",
] as const satisfies readonly (keyof ClientFormData)[];

function clientFormNotifyKey(values: ClientFormData, valid: boolean): string {
  let out = "";
  for (const k of CLIENT_NOTIFY_KEYS) {
    const v = values[k];
    out += `${
      k
    }:${
      v === undefined || v === null ? "" : String(v)
    }\x1f`;
  }
  return `${out}|${String(valid)}`;
}

/**
 * `defaultValues` no se compara: RHF sólo usa el merge inicial por montaje y el
 * wizard recrea el ref al cambiar de paso. El padre no debe disparar un re-render
 * completo en cada pulsación porque `clientData` es un objeto nuevo.
 */
function clientFormOuterPropsAreEqual(
  prev: ClientFormProps,
  next: ClientFormProps,
): boolean {
  return (
    prev.disabled === next.disabled &&
    prev.onChange === next.onChange &&
    prev.onSubmit === next.onSubmit &&
    prev.onCancel === next.onCancel &&
    prev.isSubmitting === next.isSubmitting &&
    prev.mode === next.mode &&
    prev.client?.id === next.client?.id &&
    prev.className === next.className
  );
}

const ClientFormInner = forwardRef<ClientFormRef, ClientFormProps>(
  function ClientForm(
    {
      client,
      defaultValues,
      onSubmit,
      onChange,
      onCancel,
      isSubmitting = false,
      mode = "create",
      disabled = false,
      className,
    },
    ref,
  ) {
  const { toast } = useToast();
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  /**
   * En edición el contenedor monta el formulario solo cuando `client` existe.
   * Usar `defaultValues` iniciales (no `reset` post-mount) evita selects Radix
   * sin etiqueta y campos vacíos en el primer render (patrón EmployeeFormInner).
   */
  const initialFormValues = useMemo((): ClientFormData => {
    if (mode === "edit" && client) {
      return clientToFormValues(client);
    }
    return { ...defaultClientFormValues, ...defaultValues };
  }, [mode, client, defaultValues]);

  const form = useForm<ClientFormData, unknown, ClientFormData>({
    // Schema del paquete (Zod 4); @hookform/resolvers tipa Zod 3 — cast acotado al formulario.
    resolver: zodResolver(clientFormSchema as never) as Resolver<ClientFormData>,
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isValid, isDirty },
  } = form;
  const showFormActions = Boolean(onCancel);
  const formValues = useWatch({ control }) as ClientFormData | undefined;
  const clientType = formValues?.type ?? defaultClientFormValues.type;
  const paymentTerms =
    formValues?.paymentTerms ?? defaultClientFormValues.paymentTerms;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const lastParentNotifyKey = useRef("");

  const validationMessages = collectFieldErrorMessages(errors);
  const shouldShowValidationSummary = showValidationSummary && !isValid;

  const runValidation = useCallback(async () => {
    const ok = await trigger(undefined, { shouldFocus: true });
    if (!ok) setShowValidationSummary(true);
    else setShowValidationSummary(false);
    return ok;
  }, [trigger]);

  useImperativeHandle(
    ref,
    () => ({
      triggerValidation: runValidation,
    }),
    [runValidation],
  );

  const handleInvalidSubmit = useCallback(
    (fieldErrors: FieldErrors<ClientFormData>) => {
      setShowValidationSummary(true);
      void trigger(undefined, { shouldFocus: true });
      toast({
        title: "Revisa el formulario",
        description: formatFormValidationToastDescription(fieldErrors),
        variant: "destructive",
      });
    },
    [toast, trigger],
  );

  const handleValidSubmit = useCallback(
    (data: ClientFormData) => {
      setShowValidationSummary(false);
      onSubmit?.(data);
    },
    [onSubmit],
  );

  useEffect(() => {
    if (!onChange || !formValues) return;
    const key = clientFormNotifyKey(formValues, isValid);
    if (key === lastParentNotifyKey.current) return;
    lastParentNotifyKey.current = key;
    onChangeRef.current?.(formValues, isValid);
  }, [formValues, isValid, onChange]);

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      className={cn("space-y-6", className)}
    >
      <FormSectionCard
        title="Tipo de Cliente"
        icon={<Building2 className="h-4 w-4" />}
      >
        <div className="space-y-2">
          <Label htmlFor="type">
            Tipo <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                key={mode === "edit" ? `type-${field.value}` : "type"}
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger
                  id="type"
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps("type", fieldState.error?.message)}
                >
                  <SelectValue placeholder="Seleccione el tipo de cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">
                    {CLIENT_TYPE_LABELS.company}
                  </SelectItem>
                  <SelectItem value="individual">
                    {CLIENT_TYPE_LABELS.individual}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldInlineError fieldId="type" message={errors.type?.message} />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Información Fiscal"
        icon={<Landmark className="h-4 w-4" />}
        contentClassName="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="legalName">
            Razón Social <span className="text-destructive">*</span>
          </Label>
          <Input
            id="legalName"
            disabled={disabled}
            error={Boolean(errors.legalName)}
            {...register("legalName")}
            {...getFieldErrorAriaProps("legalName", errors.legalName?.message)}
          />
          <FieldInlineError fieldId="legalName" message={errors.legalName?.message} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tradeName">Nombre Comercial</Label>
          <Input id="tradeName" disabled={disabled} {...register("tradeName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">
            RFC <span className="text-destructive">*</span>
          </Label>
          <Input
            id="taxId"
            className="uppercase"
            maxLength={13}
            disabled={disabled}
            error={Boolean(errors.taxId)}
            {...register("taxId", {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
              },
            })}
            {...getFieldErrorAriaProps("taxId", errors.taxId?.message)}
          />
          <p className="text-xs text-muted-foreground">
            {clientType === "company"
              ? "12 caracteres para persona moral"
              : "13 caracteres para persona física"}
          </p>
          <FieldInlineError fieldId="taxId" message={errors.taxId?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRegime">
            Régimen Fiscal <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="taxRegime"
            control={control}
            render={({ field, fieldState }) => (
              <RegimenFiscalSelect
                key={
                  mode === "edit"
                    ? `taxRegime-${field.value || "empty"}`
                    : "taxRegime"
                }
                triggerId="taxRegime"
                error={Boolean(fieldState.error)}
                value={field.value || ""}
                onValueChange={field.onChange}
                disabled={disabled}
                placeholder="Seleccione régimen"
                {...getFieldErrorAriaProps(
                  "taxRegime",
                  fieldState.error?.message,
                )}
              />
            )}
          />
          <FieldInlineError fieldId="taxRegime" message={errors.taxRegime?.message} />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Contacto Principal"
        icon={<Phone className="h-4 w-4" />}
        contentClassName="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor="contactName">Nombre del Contacto</Label>
          <Input
            id="contactName"
            disabled={disabled}
            {...register("contactName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPosition">Puesto</Label>
          <Input
            id="contactPosition"
            disabled={disabled}
            {...register("contactPosition")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" disabled={disabled} {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryPhone">Teléfono Secundario</Label>
          <Input
            id="secondaryPhone"
            disabled={disabled}
            {...register("secondaryPhone")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            type="email"
            disabled={disabled}
            error={Boolean(errors.email)}
            {...register("email")}
            {...getFieldErrorAriaProps("email", errors.email?.message)}
          />
          <FieldInlineError fieldId="email" message={errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingEmail">Correo de Facturación</Label>
          <Input
            id="billingEmail"
            type="email"
            disabled={disabled}
            error={Boolean(errors.billingEmail)}
            {...register("billingEmail")}
            {...getFieldErrorAriaProps("billingEmail", errors.billingEmail?.message)}
          />
          <FieldInlineError fieldId="billingEmail" message={errors.billingEmail?.message} />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Términos Comerciales"
        icon={<CreditCard className="h-4 w-4" />}
        contentClassName="grid gap-4 sm:grid-cols-3"
      >
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">
            Términos de Pago <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                key={
                  mode === "edit"
                    ? `paymentTerms-${field.value}`
                    : "paymentTerms"
                }
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger
                  id="paymentTerms"
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps(
                    "paymentTerms",
                    fieldState.error?.message,
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{PAYMENT_TERMS_LABELS.cash}</SelectItem>
                  <SelectItem value="credit">
                    {PAYMENT_TERMS_LABELS.credit}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldInlineError fieldId="paymentTerms" message={errors.paymentTerms?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditDays">
            Días de Crédito
            {paymentTerms === "credit" && (
              <span className="text-destructive"> *</span>
            )}
          </Label>
          <Controller
            name="creditDays"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                id="creditDays"
                type="number"
                min={0}
                max={180}
                disabled={disabled || paymentTerms !== "credit"}
                value={field.value}
                error={Boolean(fieldState.error)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                {...getFieldErrorAriaProps(
                  "creditDays",
                  fieldState.error?.message,
                )}
              />
            )}
          />
          <FieldInlineError fieldId="creditDays" message={errors.creditDays?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditLimit">Límite de Crédito</Label>
          <Controller
            name="creditLimit"
            control={control}
            render={({ field }) => (
              <Input
                id="creditLimit"
                type="number"
                min={0}
                disabled={disabled || paymentTerms !== "credit"}
                value={field.value || ""}
                onChange={(e) =>
                  field.onChange(e.target.value ? Number(e.target.value) : undefined)
                }
              />
            )}
          />
          <p className="text-xs text-muted-foreground">Dejar vacío para sin límite</p>
        </div>
      </FormSectionCard>

      <FormSectionCard title="Notas" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-2">
          <Label htmlFor="notes">Notas Adicionales</Label>
          <Textarea
            id="notes"
            rows={3}
            disabled={disabled}
            error={Boolean(errors.notes)}
            {...register("notes")}
            {...getFieldErrorAriaProps("notes", errors.notes?.message)}
          />
          <FieldInlineError fieldId="notes" message={errors.notes?.message} />
        </div>
      </FormSectionCard>

      {shouldShowValidationSummary ? (
        <FormValidationSummary
          messages={validationMessages}
          title={
            onChange ? "Revisa la información del cliente" : "Revisa los siguientes campos"
          }
        />
      ) : null}

      {showFormActions ? (
        <div className="flex items-center justify-end gap-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || disabled}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || disabled || (!isDirty && mode === "edit")}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      ) : null}
    </form>
  );
},
);

export const ClientForm = memo(ClientFormInner, clientFormOuterPropsAreEqual);

export default ClientForm;
