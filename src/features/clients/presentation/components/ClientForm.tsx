import { useEffect, useRef } from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Building2, Phone, CreditCard, FileText, Landmark } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { RegimenFiscalSelect } from "@features/catalogs";

import {
  CLIENT_TYPE_LABELS,
  PAYMENT_TERMS_LABELS,
} from "../../domain";
import {
  clientFormSchema,
  defaultClientFormValues,
  type ClientFormData,
} from "../validation/clientSchema";

export interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>;
  onSubmit?: (data: ClientFormData) => void;
  onChange?: (data: ClientFormData, isValid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  onChange,
  disabled = false,
  className,
}: ClientFormProps) {
  const form = useForm<ClientFormData, unknown, ClientFormData>({
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormData>,
    defaultValues: { ...defaultClientFormValues, ...defaultValues },
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = form;
  const formValues = useWatch({ control }) as ClientFormData | undefined;
  const clientType = formValues?.type ?? defaultClientFormValues.type;
  const paymentTerms =
    formValues?.paymentTerms ?? defaultClientFormValues.paymentTerms;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastParentNotifyKey = useRef("");

  useEffect(() => {
    if (!formValues) return;
    const key = JSON.stringify(formValues) + "|" + String(isValid);
    if (key === lastParentNotifyKey.current) return;
    lastParentNotifyKey.current = key;
    onChangeRef.current?.(formValues, isValid);
  }, [formValues, isValid]);

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit?.(data))}
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
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger>
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
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
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
          <Input id="legalName" disabled={disabled} {...register("legalName")} />
          {errors.legalName && (
            <p className="text-sm text-destructive">{errors.legalName.message}</p>
          )}
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
            {...register("taxId", {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
              },
            })}
          />
          <p className="text-xs text-muted-foreground">
            {clientType === "company"
              ? "12 caracteres para persona moral"
              : "13 caracteres para persona física"}
          </p>
          {errors.taxId && (
            <p className="text-sm text-destructive">{errors.taxId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRegime">Régimen Fiscal</Label>
          <Controller
            name="taxRegime"
            control={control}
            render={({ field }) => (
              <RegimenFiscalSelect
                value={field.value || ""}
                onValueChange={field.onChange}
                disabled={disabled}
                placeholder="Seleccione régimen"
              />
            )}
          />
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
          <Input id="email" type="email" disabled={disabled} {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingEmail">Correo de Facturación</Label>
          <Input
            id="billingEmail"
            type="email"
            disabled={disabled}
            {...register("billingEmail")}
          />
          {errors.billingEmail && (
            <p className="text-sm text-destructive">{errors.billingEmail.message}</p>
          )}
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
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger>
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
            render={({ field }) => (
              <Input
                id="creditDays"
                type="number"
                min={0}
                max={180}
                disabled={disabled || paymentTerms !== "credit"}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          {errors.creditDays && (
            <p className="text-sm text-destructive">{errors.creditDays.message}</p>
          )}
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
          <Textarea id="notes" rows={3} disabled={disabled} {...register("notes")} />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes.message}</p>
          )}
        </div>
      </FormSectionCard>
    </form>
  );
}

export default ClientForm;
