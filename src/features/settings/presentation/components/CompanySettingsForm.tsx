/**
 * CompanySettingsForm Component
 *
 * Formulario para editar los datos de la empresa.
 *
 * Ubicación: src/features/settings/ui/components/CompanySettingsForm.tsx
 */

import { memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Loader2 } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Skeleton } from "@shared/ui/skeleton";

import { RegimenFiscalSelect } from "@features/catalogs";

import { SettingsCard } from "./SettingsLayout";
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from "../../application/hooks";
import type { CompanySettings, UpdateCompanySettingsDTO } from "../../domain";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const companySettingsSchema = z.object({
  legalName: z.string().min(1, "La razón social es requerida"),
  tradeName: z.string().optional(),
  rfc: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC no puede tener más de 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido"),
  regimenFiscal: z.string().min(1, "El régimen fiscal es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  // Address
  street: z.string().min(1, "La calle es requerida"),
  exteriorNumber: z.string().min(1, "El número exterior es requerido"),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().min(1, "La colonia es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  municipality: z.string().min(1, "El municipio es requerido"),
  state: z.string().min(1, "El estado es requerido"),
  stateCode: z.string().min(1, "El código de estado es requerido"),
  postalCode: z
    .string()
    .length(5, "El código postal debe tener 5 dígitos")
    .regex(/^\d{5}$/, "Código postal inválido"),
  country: z.string().default("México"),
  lugarExpedicion: z
    .string()
    .length(5, "El código postal debe tener 5 dígitos")
    .regex(/^\d{5}$/, "Código postal inválido"),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export const CompanySettingsForm = memo(function CompanySettingsForm() {
  const { data: settings, isLoading, isError } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    values: settings ? mapSettingsToForm(settings) : undefined,
  });

  const onSubmit = useCallback(
    (data: CompanySettingsFormData) => {
      const dto: UpdateCompanySettingsDTO = {
        legalName: data.legalName,
        tradeName: data.tradeName || null,
        rfc: data.rfc,
        regimenFiscal: data.regimenFiscal,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
        address: {
          street: data.street,
          exteriorNumber: data.exteriorNumber,
          interiorNumber: data.interiorNumber || null,
          neighborhood: data.neighborhood,
          city: data.city,
          municipality: data.municipality,
          state: data.state,
          stateCode: data.stateCode,
          postalCode: data.postalCode,
          country: data.country,
        },
        lugarExpedicion: data.lugarExpedicion,
      };

      updateMutation.mutate(dto);
    },
    [updateMutation],
  );

  if (isLoading) {
    return <CompanySettingsFormSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Error al cargar la configuración. Por favor, intenta de nuevo.
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos de la empresa */}
      <SettingsCard
        title="Datos de la empresa"
        description="Información fiscal y de contacto de tu empresa"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Razón Social */}
          <div className="sm:col-span-2">
            <Label htmlFor="legalName">
              Razón Social <span className="text-destructive">*</span>
            </Label>
            <Input
              id="legalName"
              {...form.register("legalName")}
              placeholder="Transportes ABC S.A. de C.V."
            />
            {form.formState.errors.legalName && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.legalName.message}
              </p>
            )}
          </div>

          {/* Nombre Comercial */}
          <div className="sm:col-span-2">
            <Label htmlFor="tradeName">Nombre Comercial</Label>
            <Input
              id="tradeName"
              {...form.register("tradeName")}
              placeholder="Transportes ABC"
            />
          </div>

          {/* RFC */}
          <div>
            <Label htmlFor="rfc">
              RFC <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rfc"
              {...form.register("rfc")}
              placeholder="ABC123456XYZ"
              className="uppercase"
            />
            {form.formState.errors.rfc && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.rfc.message}
              </p>
            )}
          </div>

          {/* Régimen Fiscal (catálogo SAT c_RegimenFiscal) */}
          <div>
            <Label htmlFor="regimenFiscal">
              Régimen Fiscal <span className="text-destructive">*</span>
            </Label>
            <RegimenFiscalSelect
              value={form.watch("regimenFiscal") ?? ""}
              onValueChange={(value) => {
                form.setValue("regimenFiscal", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              placeholder="Seleccionar régimen"
            />
            {form.formState.errors.regimenFiscal && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.regimenFiscal.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="contacto@empresa.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="(55) 1234-5678"
            />
          </div>

          {/* Sitio web */}
          <div className="sm:col-span-2">
            <Label htmlFor="website">Sitio Web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                {...form.register("website")}
                placeholder="https://www.empresa.com"
                className="pl-9"
              />
            </div>
            {form.formState.errors.website && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.website.message}
              </p>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Dirección Fiscal */}
      <SettingsCard
        title="Dirección Fiscal"
        description="Domicilio fiscal registrado ante el SAT"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Calle */}
          <div className="sm:col-span-2">
            <Label htmlFor="street">
              Calle <span className="text-destructive">*</span>
            </Label>
            <Input
              id="street"
              {...form.register("street")}
              placeholder="Av. Insurgentes Sur"
            />
            {form.formState.errors.street && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.street.message}
              </p>
            )}
          </div>

          {/* Número Exterior */}
          <div>
            <Label htmlFor="exteriorNumber">
              Número Exterior <span className="text-destructive">*</span>
            </Label>
            <Input
              id="exteriorNumber"
              {...form.register("exteriorNumber")}
              placeholder="1234"
            />
            {form.formState.errors.exteriorNumber && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.exteriorNumber.message}
              </p>
            )}
          </div>

          {/* Número Interior */}
          <div>
            <Label htmlFor="interiorNumber">Número Interior</Label>
            <Input
              id="interiorNumber"
              {...form.register("interiorNumber")}
              placeholder="Piso 5, Of. 501"
            />
          </div>

          {/* Colonia */}
          <div>
            <Label htmlFor="neighborhood">
              Colonia <span className="text-destructive">*</span>
            </Label>
            <Input
              id="neighborhood"
              {...form.register("neighborhood")}
              placeholder="Del Valle"
            />
            {form.formState.errors.neighborhood && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.neighborhood.message}
              </p>
            )}
          </div>

          {/* Código Postal */}
          <div>
            <Label htmlFor="postalCode">
              Código Postal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postalCode"
              {...form.register("postalCode")}
              placeholder="03100"
              maxLength={5}
            />
            {form.formState.errors.postalCode && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.postalCode.message}
              </p>
            )}
          </div>

          {/* Ciudad */}
          <div>
            <Label htmlFor="city">
              Ciudad <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              {...form.register("city")}
              placeholder="Ciudad de México"
            />
            {form.formState.errors.city && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.city.message}
              </p>
            )}
          </div>

          {/* Municipio/Alcaldía */}
          <div>
            <Label htmlFor="municipality">
              Municipio/Alcaldía <span className="text-destructive">*</span>
            </Label>
            <Input
              id="municipality"
              {...form.register("municipality")}
              placeholder="Benito Juárez"
            />
            {form.formState.errors.municipality && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.municipality.message}
              </p>
            )}
          </div>

          {/* Estado */}
          <div>
            <Label htmlFor="state">
              Estado <span className="text-destructive">*</span>
            </Label>
            <Input
              id="state"
              {...form.register("state")}
              placeholder="Ciudad de México"
            />
            {form.formState.errors.state && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.state.message}
              </p>
            )}
          </div>

          {/* Código Estado (oculto pero requerido para CFDI) */}
          <div>
            <Label htmlFor="stateCode">
              Código Estado <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stateCode"
              {...form.register("stateCode")}
              placeholder="CMX"
              maxLength={3}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Código SAT del estado (ej: CMX, JAL, NLE)
            </p>
            {form.formState.errors.stateCode && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.stateCode.message}
              </p>
            )}
          </div>

          {/* País */}
          <div>
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              {...form.register("country")}
              placeholder="México"
              disabled
            />
          </div>

          {/* Lugar de Expedición */}
          <div className="sm:col-span-2 pt-2 border-t">
            <Label htmlFor="lugarExpedicion">
              Lugar de expedición (CFDI){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lugarExpedicion"
              {...form.register("lugarExpedicion")}
              placeholder="03100"
              maxLength={5}
              className="mt-1.5 w-40"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Código postal donde se expiden las facturas. Se incluye como
              atributo <code className="font-mono">LugarExpedicion</code> en
              cada CFDI 4.0. Generalmente coincide con el CP del domicilio
              fiscal.
            </p>
            {form.formState.errors.lugarExpedicion && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.lugarExpedicion.message}
              </p>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={!form.formState.isDirty || updateMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!form.formState.isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
});

// ============================================================================
// SKELETON
// ============================================================================

function CompanySettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function mapSettingsToForm(settings: CompanySettings): CompanySettingsFormData {
  return {
    legalName: settings.legalName,
    tradeName: settings.tradeName ?? "",
    rfc: settings.rfc,
    regimenFiscal: settings.regimenFiscal,
    email: settings.email,
    phone: settings.phone ?? "",
    website: settings.website ?? "",
    street: settings.address.street,
    exteriorNumber: settings.address.exteriorNumber,
    interiorNumber: settings.address.interiorNumber ?? "",
    neighborhood: settings.address.neighborhood,
    city: settings.address.city,
    municipality: settings.address.municipality,
    state: settings.address.state,
    stateCode: settings.address.stateCode,
    postalCode: settings.address.postalCode,
    country: settings.address.country,
    lugarExpedicion: settings.lugarExpedicion,
  };
}
