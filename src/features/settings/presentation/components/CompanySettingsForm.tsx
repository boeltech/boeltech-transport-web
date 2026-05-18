/**
 * CompanySettingsForm Component
 *
 * Formulario para editar los datos de la empresa.
 *
 * Ubicación: src/features/settings/ui/components/CompanySettingsForm.tsx
 */

import { memo, useCallback, useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Loader2 } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Skeleton } from "@shared/ui/skeleton";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Switch } from "@shared/ui/switch";
import { AddressInput, EntityAddressForm } from "@shared/ui/address-input";
import { addressSchema } from "@shared/validation/addressSchema";
import { RegimenFiscalSelect } from "@features/catalogs";
import type { ClientAddress } from "@features/clients/domain";
import {
  clientAddressFormDataToCreateDto,
  defaultClientAddressFormValues,
  type ClientAddressFormData,
} from "@features/clients/presentation/validation/clientAddressSchema";
import type { CreateClientAddressDTO } from "@features/clients/domain";

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
    expideDesdeOtroCp: z.boolean(),
    lugarExpedicion: z.string().optional(),
    fiscal: companyFiscalSchema,
  })
  .superRefine((data, ctx) => {
    const cp = data.expideDesdeOtroCp
      ? data.lugarExpedicion?.trim()
      : data.fiscal.postalCode?.trim();
    if (!cp || !/^\d{5}$/.test(cp)) {
      ctx.addIssue({
        code: "custom",
        message: data.expideDesdeOtroCp
          ? "El código postal debe tener 5 dígitos"
          : "Completa el código postal del domicilio fiscal",
        path: data.expideDesdeOtroCp ? ["lugarExpedicion"] : ["fiscal", "postalCode"],
      });
    }
  });

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export const CompanySettingsForm = memo(function CompanySettingsForm() {
  const { data: settings, isLoading, isError } = useCompanySettings();

  if (isLoading) {
    return <CompanySettingsFormSkeleton />;
  }

  if (isError || !settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Error al cargar la configuración. Por favor, intenta de nuevo.
      </div>
    );
  }

  return (
    <CompanySettingsFormLoaded
      key={settings.fiscalAddress?.id ?? `company-${settings.id}`}
      settings={settings}
    />
  );
});

const CompanySettingsFormLoaded = memo(function CompanySettingsFormLoaded({
  settings,
}: {
  settings: CompanySettings;
}) {
  const updateMutation = useUpdateCompanySettings();

  const form = useForm<CompanySettingsFormData, unknown, CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema) as Resolver<CompanySettingsFormData>,
    defaultValues: mapSettingsToForm(settings),
  });
  const regimenFiscal = useWatch({ control: form.control, name: "regimenFiscal" });
  const fiscalStateCode = useWatch({ control: form.control, name: "fiscal.satStateCode" });
  const fiscalMunicipalityCode = useWatch({
    control: form.control,
    name: "fiscal.satMunicipalityCode",
  });
  const fiscalPostalCode = useWatch({ control: form.control, name: "fiscal.postalCode" });
  const expideDesdeOtroCp = useWatch({
    control: form.control,
    name: "expideDesdeOtroCp",
  });

  useEffect(() => {
    if (expideDesdeOtroCp) return;
    const cp = fiscalPostalCode?.trim() ?? "";
    if (cp.length === 5 && /^\d{5}$/.test(cp)) {
      form.setValue("lugarExpedicion", cp, {
        shouldValidate: true,
        shouldDirty: Boolean(form.formState.dirtyFields.fiscal?.postalCode),
      });
    }
  }, [expideDesdeOtroCp, fiscalPostalCode, form]);

  const onSubmit = useCallback(
    async (data: CompanySettingsFormData) => {
      const existingId = data.fiscal.id ?? settings.fiscalAddress?.id;
      const fiscalPayload = tenantFiscalFormToCreateDto(data.fiscal);

      const dto: UpdateCompanySettingsDTO = {
        legalName: data.legalName,
        tradeName: data.tradeName || null,
        rfc: data.rfc,
        regimenFiscal: data.regimenFiscal,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
        lugarExpedicion: resolveLugarExpedicionForSave(data),
        fiscalAddress: {
          ...fiscalPayload,
          ...(existingId ? { id: existingId } : {}),
        },
      };

      try {
        const result = await updateMutation.mutateAsync(dto);
        if (result.data.fiscalAddress?.id) {
          form.setValue("fiscal.id", result.data.fiscalAddress.id, {
            shouldDirty: false,
          });
        }
      } catch {
        // El hook ya muestra toast de error
      }
    },
    [form, settings.fiscalAddress?.id, updateMutation],
  );

  const showLegacyHint =
    settings.legacyCompanyAddress && !settings.fiscalAddress;

  const fiscalAddressHydrationKey = [
    settings.fiscalAddress?.id ?? "new",
    settings.fiscalAddress?.satStateCode ?? "",
    settings.fiscalAddress?.satMunicipalityCode ?? "",
    settings.fiscalAddress?.satNeighborhoodCode ?? "",
    settings.fiscalAddress?.neighborhoodName ?? "",
    settings.fiscalAddress?.postalCode ?? "",
  ].join(":");

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
              value={regimenFiscal ?? ""}
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
        {showLegacyHint ? (
          <Alert>
            <AlertDescription>
              Detectamos un domicilio fiscal en formato anterior. Completa
              estado, municipio y colonia SAT usando el código postal para
              guardar la nueva dirección unificada.
            </AlertDescription>
          </Alert>
        ) : null}

        <EntityAddressForm
          asForm={false}
          className="space-y-4"
          formContext="billingOnCreate"
          addressMode="cfdi"
          infoMessage="Esta direccion se usara para CFDI y operaciones fiscales."
          satStateCode={fiscalStateCode}
          satMunicipalityCode={fiscalMunicipalityCode}
          postalCode={fiscalPostalCode}
          showGlobalNotice
          hideLocationSectionTitle
          addressInputSection={
            <>
              <AddressInput<CompanySettingsFormData>
                key={fiscalAddressHydrationKey}
                mode="cfdi"
                control={form.control}
                setValue={form.setValue}
                namePrefix="fiscal"
                layout="compact"
                showLatLng
                showPrimaryToggle={false}
                embedded
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.fiscal && (
                <p className="text-sm text-destructive mt-2">
                  Revisa los campos de domicilio fiscal.
                </p>
              )}
            </>
          }
        />

        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Lugar de expedición (CFDI)
              </p>
              <p className="text-xs text-muted-foreground">
                Código postal del lugar de expedición de facturas (atributo{" "}
                <code className="font-mono">LugarExpedicion</code> en CFDI 4.0).
              </p>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <Switch
                id="expideDesdeOtroCp"
                checked={Boolean(expideDesdeOtroCp)}
                disabled={form.formState.isSubmitting}
                onCheckedChange={(checked) => {
                  form.setValue("expideDesdeOtroCp", checked, { shouldDirty: true });
                  if (!checked) {
                    const cp = fiscalPostalCode?.trim() ?? "";
                    if (cp.length === 5) {
                      form.setValue("lugarExpedicion", cp, { shouldDirty: true });
                    }
                  }
                }}
              />
              <Label
                htmlFor="expideDesdeOtroCp"
                className="cursor-pointer text-sm font-normal"
              >
                Expido desde otro código postal
              </Label>
            </div>
          </div>

          {expideDesdeOtroCp ? (
            <div className="space-y-2">
              <Label htmlFor="lugarExpedicion">
                Código postal de expedición{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lugarExpedicion"
                {...form.register("lugarExpedicion")}
                placeholder="03100"
                maxLength={5}
                inputMode="numeric"
                className="w-40"
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.lugarExpedicion && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lugarExpedicion.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Se usará el mismo CP del domicilio fiscal:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {fiscalPostalCode?.length === 5 ? fiscalPostalCode : "—"}
                </span>
              </p>
              {form.formState.errors.fiscal?.postalCode && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fiscal.postalCode.message}
                </p>
              )}
            </div>
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

/** DTO de domicilio fiscal del tenant sin depender de campos extra del formulario de cliente. */
function tenantFiscalFormToCreateDto(
  fiscal: CompanySettingsFormData["fiscal"],
): CreateClientAddressDTO {
  return clientAddressFormDataToCreateDto({
    ...defaultClientAddressFormValues,
    ...fiscal,
    addressType: "company",
    isPrimary: true,
  } satisfies ClientAddressFormData);
}

function shouldExpideDesdeOtroCp(
  lugarExpedicion: string,
  fiscalPostalCode: string,
): boolean {
  const lugar = lugarExpedicion.trim();
  const fiscalCp = fiscalPostalCode.trim();
  if (!lugar) return false;
  if (!fiscalCp) return true;
  return lugar !== fiscalCp;
}

function resolveLugarExpedicionForSave(
  data: CompanySettingsFormData,
): string {
  if (data.expideDesdeOtroCp) {
    return data.lugarExpedicion?.trim() ?? "";
  }
  return data.fiscal.postalCode.trim();
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

  const fiscalCp = fiscal.postalCode?.trim() ?? "";
  const expideDesdeOtroCp = shouldExpideDesdeOtroCp(
    settings.lugarExpedicion,
    fiscalCp,
  );
  const lugarExpedicion = expideDesdeOtroCp
    ? settings.lugarExpedicion
    : fiscalCp || settings.lugarExpedicion;

  return {
    legalName: settings.legalName,
    tradeName: settings.tradeName ?? "",
    rfc: settings.rfc,
    regimenFiscal: settings.regimenFiscal,
    email: settings.email,
    phone: settings.phone ?? "",
    website: settings.website ?? "",
    fiscal,
    expideDesdeOtroCp,
    lugarExpedicion,
  };
}
