/**
 * CompanySettingsForm Component
 *
 * Formulario para editar los datos de la empresa.
 *
 * Ubicación: src/features/settings/ui/components/CompanySettingsForm.tsx
 */

import { memo, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Loader2 } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Skeleton } from "@shared/ui/skeleton";
import { Alert, AlertDescription } from "@shared/ui/alert";
import AddressInput from "@shared/ui/address-input/AddressInput";
import { addressSchema } from "@shared/validation/addressSchema";
import { useToast } from "@shared/hooks/useToast";

import { RegimenFiscalSelect } from "@features/catalogs";
import { useAuth } from "@features/auth";
import type { ClientAddress } from "@features/clients/domain";
import {
  clientAddressFormDataToCreateDto,
  defaultClientAddressFormValues,
  type ClientAddressFormData,
} from "@features/clients/presentation/validation/clientAddressSchema";
import {
  createTenantAddress,
  updateTenantAddress,
} from "../../infrastructure/tenantFiscalAddressApi";

import { SettingsCard } from "./SettingsLayout";
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from "../../application/hooks";
import type {
  CompanyAddress,
  CompanySettings,
  UpdateCompanySettingsDTO,
} from "../../domain";
import { settingsQueryKeys } from "../../domain/entities";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const companyFiscalSchema = addressSchema.safeExtend({
  addressType: z.literal("company"),
  isPrimary: z.literal(true),
  id: z.string().optional(),
});

const companySettingsSchema = z
  .object({
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
    lugarExpedicion: z
      .string()
      .length(5, "El código postal debe tener 5 dígitos")
      .regex(/^\d{5}$/, "Código postal inválido"),
  })
  .merge(z.object({ fiscal: companyFiscalSchema }));

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export const CompanySettingsForm = memo(function CompanySettingsForm() {
  const { data: settings, isLoading, isError } = useCompanySettings();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateCompanySettings({
    onSuccess: (result) => {
      queryClient.setQueryData(settingsQueryKeys.company(), result.data);
    },
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<CompanySettingsFormData, unknown, CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema) as Resolver<CompanySettingsFormData>,
    values: settings ? mapSettingsToForm(settings) : undefined,
  });

  const onSubmit = useCallback(
    async (data: CompanySettingsFormData) => {
      if (!user?.tenant.id) {
        toast({
          title: "Sesión incompleta",
          description: "No se pudo determinar el tenant.",
          variant: "destructive",
        });
        return;
      }

      const dto: UpdateCompanySettingsDTO = {
        legalName: data.legalName,
        tradeName: data.tradeName || null,
        rfc: data.rfc,
        regimenFiscal: data.regimenFiscal,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
        lugarExpedicion: data.lugarExpedicion,
      };

      try {
        await updateMutation.mutateAsync(dto);
      } catch {
        return;
      }

      const fiscalPayload = clientAddressFormDataToCreateDto({
        ...defaultClientAddressFormValues,
        ...data.fiscal,
        addressType: "company",
        isPrimary: true,
      } as ClientAddressFormData);

      const existingId = settings?.fiscalAddress?.id;
      try {
        if (existingId) {
          await updateTenantAddress(existingId, fiscalPayload);
        } else {
          await createTenantAddress(user.tenant.id, fiscalPayload);
        }

        await queryClient.invalidateQueries({
          queryKey: settingsQueryKeys.company(),
        });

        toast({
          title: "Configuración actualizada",
          description:
            "Los datos de la empresa y el domicilio fiscal se guardaron correctamente.",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        toast({
          title: "Error al guardar domicilio fiscal",
          description: message,
          variant: "destructive",
        });
      }
    },
    [
      queryClient,
      settings?.fiscalAddress?.id,
      toast,
      updateMutation,
      user?.tenant.id,
    ],
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

  const showLegacyHint =
    settings &&
    settings.legacyCompanyAddress &&
    !settings.fiscalAddress;

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
        description="Domicilio fiscal con catálogos SAT (tabla unificada de direcciones)"
      >
        {showLegacyHint && (
          <Alert className="mb-4">
            <AlertDescription>
              Detectamos un domicilio fiscal en formato anterior. Completa estado,
              municipio y colonia SAT usando el código postal para guardar la
              nueva dirección unificada.
            </AlertDescription>
          </Alert>
        )}

        <AddressInput<CompanySettingsFormData>
          mode="cfdi"
          control={form.control}
          namePrefix="fiscal"
          layout="compact"
          showLatLng
          showPrimaryToggle={false}
        />
        {form.formState.errors.fiscal && (
          <p className="text-sm text-destructive mt-2">
            Revisa los campos de domicilio fiscal.
          </p>
        )}

        <div className="mt-6 pt-4 border-t">
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
            Código postal donde se expiden las facturas (atributo{" "}
            <code className="font-mono">LugarExpedicion</code> en CFDI 4.0).
          </p>
          {form.formState.errors.lugarExpedicion && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.lugarExpedicion.message}
            </p>
          )}
        </div>
      </SettingsCard>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {(form.formState.isSubmitting || updateMutation.isPending) && (
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

function defaultFiscalForm(): CompanySettingsFormData["fiscal"] {
  return {
    addressType: "company",
    isPrimary: true,
    street: "",
    exteriorNumber: "",
    interiorNumber: null,
    reference: null,
    postalCode: "",
    satCountryCode: "MEX",
    satStateCode: "",
    satMunicipalityCode: "",
    satLocalityCode: null,
    satNeighborhoodCode: null,
    neighborhoodName: null,
    latitude: null,
    longitude: null,
  };
}

function clientAddressToFiscalForm(
  ca: ClientAddress,
): CompanySettingsFormData["fiscal"] {
  return {
    id: ca.id,
    addressType: "company",
    isPrimary: true,
    street: ca.street ?? "",
    exteriorNumber: ca.exteriorNumber ?? "",
    interiorNumber: ca.interiorNumber ?? null,
    reference: ca.reference ?? null,
    postalCode: ca.postalCode ?? "",
    satCountryCode: ca.satCountryCode ?? "MEX",
    satStateCode: ca.satStateCode ?? "",
    satMunicipalityCode: ca.satMunicipalityCode ?? "",
    satLocalityCode: ca.satLocalityCode ?? null,
    satNeighborhoodCode: ca.satNeighborhoodCode ?? null,
    neighborhoodName: ca.neighborhoodName ?? null,
    latitude: ca.latitude ?? null,
    longitude: ca.longitude ?? null,
  };
}

function legacyToFiscalForm(
  legacy: CompanyAddress,
): CompanySettingsFormData["fiscal"] {
  const refParts = [legacy.municipality, legacy.city, legacy.state].filter(
    Boolean,
  );
  return {
    ...defaultFiscalForm(),
    street: legacy.street,
    exteriorNumber: legacy.exteriorNumber,
    interiorNumber: legacy.interiorNumber,
    postalCode: legacy.postalCode,
    neighborhoodName: legacy.neighborhood,
    satStateCode: legacy.stateCode || "",
    reference: refParts.length ? refParts.join(", ") : null,
  };
}

function mapSettingsToForm(settings: CompanySettings): CompanySettingsFormData {
  let fiscal: CompanySettingsFormData["fiscal"];
  if (settings.fiscalAddress) {
    fiscal = clientAddressToFiscalForm(settings.fiscalAddress);
  } else if (settings.legacyCompanyAddress) {
    fiscal = legacyToFiscalForm(settings.legacyCompanyAddress);
  } else {
    fiscal = defaultFiscalForm();
  }

  return {
    legalName: settings.legalName,
    tradeName: settings.tradeName ?? "",
    rfc: settings.rfc,
    regimenFiscal: settings.regimenFiscal,
    email: settings.email,
    phone: settings.phone ?? "",
    website: settings.website ?? "",
    fiscal,
    lugarExpedicion: settings.lugarExpedicion,
  };
}
