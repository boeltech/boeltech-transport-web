/**
 * ClientForm Component
 * Clean Architecture - Presentation Layer
 *
 * Formulario para capturar información del cliente.
 * Este es el Paso 1 del wizard de creación.
 *
 * NO incluye campos de dirección - la dirección se captura en el Paso 2.
 *
 * Ubicación: src/features/clients/presentation/components/ClientForm.tsx
 */

import { useEffect, useRef } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
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
import { Separator } from "@shared/ui/separator";
import { Building2, User, Phone, CreditCard } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import { RegimenFiscalSelect } from "@features/catalogs";

import { CLIENT_TYPE_LABELS, PAYMENT_TERMS_LABELS } from "../../domain";
import {
  clientFormSchema,
  defaultClientFormValues,
  type ClientFormData,
} from "../validation/clientSchema";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>;
  onSubmit?: (data: ClientFormData) => void;
  onChange?: (data: ClientFormData, isValid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientForm({
  defaultValues,
  onSubmit,
  onChange,
  disabled = false,
  className,
}: ClientFormProps) {
  const form = useForm<ClientFormData, unknown, ClientFormData>({
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormData>,
    defaultValues: {
      ...defaultClientFormValues,
      ...defaultValues,
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  // Watch para valores que afectan la UI
  const clientType = watch("type");
  const paymentTerms = watch("paymentTerms");

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isValidRef = useRef(isValid);
  isValidRef.current = isValid;

  // Notificar cambios al padre (onChange/isValid por ref: evita re-suscribir watch en cada render del padre)
  useEffect(() => {
    const subscription = watch((data) => {
      onChangeRef.current?.(data as ClientFormData, isValidRef.current);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Submit handler interno
  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit?.(data);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TIPO DE CLIENTE                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Tipo de Cliente</h3>
        </div>

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
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {CLIENT_TYPE_LABELS.company}
                    </div>
                  </SelectItem>
                  <SelectItem value="individual">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {CLIENT_TYPE_LABELS.individual}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* INFORMACIÓN FISCAL                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h3 className="font-medium">Información Fiscal</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Razón Social */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="legalName">
              Razón Social <span className="text-destructive">*</span>
            </Label>
            <Input
              id="legalName"
              placeholder="Ej: Transportes García SA de CV"
              disabled={disabled}
              {...register("legalName")}
            />
            {errors.legalName && (
              <p className="text-sm text-destructive">
                {errors.legalName.message}
              </p>
            )}
          </div>

          {/* Nombre Comercial */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tradeName">Nombre Comercial</Label>
            <Input
              id="tradeName"
              placeholder="Ej: Transportes García (opcional)"
              disabled={disabled}
              {...register("tradeName")}
            />
            {errors.tradeName && (
              <p className="text-sm text-destructive">
                {errors.tradeName.message}
              </p>
            )}
          </div>

          {/* RFC */}
          <div className="space-y-2">
            <Label htmlFor="taxId">
              RFC <span className="text-destructive">*</span>
            </Label>
            <Input
              id="taxId"
              placeholder={
                clientType === "company" ? "ABC123456XY0" : "GARC850101AB1"
              }
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

          {/* Régimen Fiscal */}
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
            {errors.taxRegime && (
              <p className="text-sm text-destructive">
                {errors.taxRegime.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CONTACTO PRINCIPAL                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Contacto Principal</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nombre del contacto */}
          <div className="space-y-2">
            <Label htmlFor="contactName">Nombre del Contacto</Label>
            <Input
              id="contactName"
              placeholder="Nombre completo"
              disabled={disabled}
              {...register("contactName")}
            />
          </div>

          {/* Puesto */}
          <div className="space-y-2">
            <Label htmlFor="contactPosition">Puesto</Label>
            <Input
              id="contactPosition"
              placeholder="Ej: Gerente de Logística"
              disabled={disabled}
              {...register("contactPosition")}
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="Ej: 55 1234 5678"
              disabled={disabled}
              {...register("phone")}
            />
          </div>

          {/* Teléfono secundario */}
          <div className="space-y-2">
            <Label htmlFor="secondaryPhone">Teléfono Secundario</Label>
            <Input
              id="secondaryPhone"
              placeholder="Opcional"
              disabled={disabled}
              {...register("secondaryPhone")}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@empresa.com"
              disabled={disabled}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Email de facturación */}
          <div className="space-y-2">
            <Label htmlFor="billingEmail">Correo de Facturación</Label>
            <Input
              id="billingEmail"
              type="email"
              placeholder="facturas@empresa.com"
              disabled={disabled}
              {...register("billingEmail")}
            />
            {errors.billingEmail && (
              <p className="text-sm text-destructive">
                {errors.billingEmail.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TÉRMINOS COMERCIALES                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Términos Comerciales</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Términos de pago */}
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
                    <SelectItem value="cash">
                      {PAYMENT_TERMS_LABELS.cash}
                    </SelectItem>
                    <SelectItem value="credit">
                      {PAYMENT_TERMS_LABELS.credit}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Días de crédito */}
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
              <p className="text-sm text-destructive">
                {errors.creditDays.message}
              </p>
            )}
          </div>

          {/* Límite de crédito */}
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
                  placeholder="Sin límite"
                  disabled={disabled || paymentTerms !== "credit"}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Dejar vacío para sin límite
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NOTAS                                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h3 className="font-medium">Notas</h3>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas Adicionales</Label>
          <Textarea
            id="notes"
            placeholder="Información adicional sobre el cliente..."
            rows={3}
            disabled={disabled}
            {...register("notes")}
          />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes.message}</p>
          )}
        </div>
      </div>
    </form>
  );
}

export default ClientForm;
