/**
 * CompanySettingsForm Component
 *
 * Formulario para editar los datos de la empresa.
 *
 * Ubicación: src/features/settings/ui/components/CompanySettingsForm.tsx
 */

import { memo, useCallback, useEffect, useState } from "react";
import { useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Loader2, MapPin } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Skeleton } from "@shared/ui/skeleton";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  AddressInput,
  EntityAddressForm,
  buildGeocodingEntityFormSection,
} from "@shared/ui/address-input";
import { buildLugarExpedicionEntityFormSection } from "./LugarExpedicionFormSection";
import { RegimenFiscalSelect } from "@features/catalogs";
import {
  FieldInlineError,
  FormValidationSummary,
  RHFCatalogField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import type { ClientAddress } from "@features/clients/domain";
import { useToast } from "@shared/hooks/useToast";
import {
  collectFieldErrorMessages,
  formatFormValidationToastDescription,
} from "@shared/utils/formErrors";
import {
  companyFiscalFormSchema,
  companyFiscalFormToCreateDto,
  validateCompanyFiscalAddressFormComplete,
  type CompanyFiscalFormData,
} from "../validation/companyFiscalAddressSchema";

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

const companyFiscalSchema = companyFiscalFormSchema;

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
  const { toast } = useToast();
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const form = useForm<CompanySettingsFormData, unknown, CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema) as Resolver<CompanySettingsFormData>,
    defaultValues: mapSettingsToForm(settings),
    mode: "onChange",
  });

  const {
    formState: { errors, isValid, isDirty, isSubmitting },
  } = form;
  const isSaving = updateMutation.isPending || isSubmitting;
  const validationMessages = collectFieldErrorMessages(errors);
  const shouldShowValidationSummary = showValidationSummary && !isValid;
  const fiscalStateCode = useWatch({ control: form.control, name: "fiscal.satStateCode" });
  const fiscalMunicipalityCode = useWatch({
    control: form.control,
    name: "fiscal.satMunicipalityCode",
  });
  const fiscalPostalCode = useWatch({ control: form.control, name: "fiscal.postalCode" });
  const fiscalAddress = useWatch({ control: form.control, name: "fiscal" });
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

  const applyFiscalFieldErrors = useCallback(
    (fieldErrors: Record<string, string>) => {
      for (const [key, message] of Object.entries(fieldErrors)) {
        if (!key || !message) continue;
        form.setError(`fiscal.${key}` as `fiscal.${keyof CompanyFiscalFormData}`, {
          type: "sat",
          message,
        });
      }
    },
    [form],
  );

  const handleInvalidSubmit = useCallback(
    (fieldErrors: FieldErrors<CompanySettingsFormData>) => {
      setShowValidationSummary(true);
      void form.trigger(undefined, { shouldFocus: true });
      toast({
        title: "Revisa el formulario",
        description: formatFormValidationToastDescription(fieldErrors),
        variant: "destructive",
      });
    },
    [form, toast],
  );

  const handleValidSubmit = useCallback(
    async (data: CompanySettingsFormData) => {
      const fiscalResult = await validateCompanyFiscalAddressFormComplete(data.fiscal, {
        requireCoordinates: false,
      });
      if (!fiscalResult.ok) {
        applyFiscalFieldErrors(fiscalResult.fieldErrors);
        setShowValidationSummary(true);
        const fiscalMessages = Object.values(fiscalResult.fieldErrors).filter(
          (message): message is string => Boolean(message),
        );
        toast({
          title: "Revisa el formulario",
          description:
            fiscalMessages.length > 0
              ? fiscalMessages.slice(0, 3).join(" · ")
              : "Corrige los campos del domicilio fiscal antes de continuar.",
          variant: "destructive",
        });
        void form.trigger("fiscal", { shouldFocus: true });
        return;
      }

      setShowValidationSummary(false);

      const existingId = data.fiscal.id ?? settings.fiscalAddress?.id;
      const fiscalPayload = companyFiscalFormToCreateDto(data.fiscal);

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
        form.reset(mapSettingsToForm(result.data));
      } catch {
        // El hook ya muestra toast de error
      }
    },
    [applyFiscalFieldErrors, form, settings.fiscalAddress?.id, toast, updateMutation],
  );

  const handleCancel = useCallback(() => {
    setShowValidationSummary(false);
    form.reset(mapSettingsToForm(settings));
  }, [form, settings]);

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
    <form
      onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      className="space-y-6"
    >
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
              error={Boolean(form.formState.errors.legalName)}
              {...getFieldErrorAriaProps(
                "legalName",
                form.formState.errors.legalName?.message,
              )}
            />
            <FieldInlineError
              fieldId="legalName"
              message={form.formState.errors.legalName?.message}
            />
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
              error={Boolean(form.formState.errors.rfc)}
              {...getFieldErrorAriaProps("rfc", form.formState.errors.rfc?.message)}
            />
            <FieldInlineError fieldId="rfc" message={form.formState.errors.rfc?.message} />
          </div>

          <RHFCatalogField
            control={form.control}
            name="regimenFiscal"
            label="Régimen Fiscal"
            required
          >
            {({ field, fieldState, resolvedId, errorMessage }) => (
              <RegimenFiscalSelect
                triggerId={resolvedId}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Seleccionar régimen"
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
            )}
          </RHFCatalogField>

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
              error={Boolean(form.formState.errors.email)}
              {...getFieldErrorAriaProps("email", form.formState.errors.email?.message)}
            />
            <FieldInlineError fieldId="email" message={form.formState.errors.email?.message} />
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
                error={Boolean(form.formState.errors.website)}
                {...getFieldErrorAriaProps(
                  "website",
                  form.formState.errors.website?.message,
                )}
              />
            </div>
            <FieldInlineError
              fieldId="website"
              message={form.formState.errors.website?.message}
            />
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
          formContext="companyFiscal"
          addressVariant="carta-porte"
          infoMessage="Domicilio fiscal de la empresa para facturación y operación del tenant."
          satStateCode={fiscalStateCode}
          satMunicipalityCode={fiscalMunicipalityCode}
          postalCode={fiscalPostalCode}
          showGlobalNotice
          hideLocationSectionTitle
          locationSectionTitle="Domicilio"
          preAddressSections={[
            {
              id: "company-fiscal-location-name",
              title: (
                <span>
                  Nombre del lugar <span className="text-destructive text-xs">*</span>
                </span>
              ),
              icon: <MapPin className="h-4 w-4" />,
              content: (
                <div className="space-y-1.5">
                  <Input
                    id="fiscal.locationName"
                    placeholder="Ej: Matriz fiscal, Oficinas centrales"
                    disabled={form.formState.isSubmitting}
                    error={Boolean(form.formState.errors.fiscal?.locationName)}
                    {...form.register("fiscal.locationName")}
                    {...getFieldErrorAriaProps(
                      "fiscal.locationName",
                      form.formState.errors.fiscal?.locationName?.message,
                    )}
                  />
                  <FieldInlineError
                    fieldId="fiscal.locationName"
                    message={form.formState.errors.fiscal?.locationName?.message}
                  />
                </div>
              ),
            },
          ]}
          addressInputSection={
            <>
              <AddressInput<CompanySettingsFormData>
                key={fiscalAddressHydrationKey}
                variant="carta-porte"
                formContext="companyFiscal"
                addressType="company"
                control={form.control}
                setValue={form.setValue}
                namePrefix="fiscal"
                layout="compact"
                showPrimaryToggle={false}
                hideInformativeAlerts
                embedded
                disabled={form.formState.isSubmitting}
              />
            </>
          }
          postAddressSections={[
            buildGeocodingEntityFormSection({
              address: {
                street: fiscalAddress?.street,
                exteriorNumber: fiscalAddress?.exteriorNumber,
                interiorNumber: fiscalAddress?.interiorNumber,
                postalCode: fiscalAddress?.postalCode,
                satMunicipalityCode: fiscalAddress?.satMunicipalityCode,
                satStateCode: fiscalAddress?.satStateCode,
                satCountryCode: fiscalAddress?.satCountryCode,
              },
              latitude: fiscalAddress?.latitude,
              longitude: fiscalAddress?.longitude,
              latitudeError: form.formState.errors.fiscal?.latitude?.message,
              onCoordinatesChange: (coords) => {
                form.setValue("fiscal.latitude", coords.latitude, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                form.setValue("fiscal.longitude", coords.longitude, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              },
              disabled: form.formState.isSubmitting,
            }),
            buildLugarExpedicionEntityFormSection({
              expideDesdeOtroCp: Boolean(expideDesdeOtroCp),
              fiscalPostalCode,
              lugarExpedicionError: form.formState.errors.lugarExpedicion?.message,
              fiscalPostalCodeError: form.formState.errors.fiscal?.postalCode?.message,
              disabled: form.formState.isSubmitting,
              onExpideDesdeOtroCpChange: (checked) => {
                form.setValue("expideDesdeOtroCp", checked, { shouldDirty: true });
                if (!checked) {
                  const cp = fiscalPostalCode?.trim() ?? "";
                  if (cp.length === 5) {
                    form.setValue("lugarExpedicion", cp, { shouldDirty: true });
                  }
                }
              },
              lugarExpedicionRegister: form.register("lugarExpedicion"),
            }),
          ]}
        />
      </SettingsCard>

      {shouldShowValidationSummary ? (
        <FormValidationSummary messages={validationMessages} />
      ) : null}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={!isDirty || isSaving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!isDirty || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
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

function defaultFiscalForm(): CompanyFiscalFormData {
  return {
    addressType: "company",
    isPrimary: true,
    locationName: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: null,
    reference: null,
    postalCode: "",
    satCountryCode: "MEX",
    satStateCode: "",
    satMunicipalityCode: "",
    satLocalityCode: null,
    localityName: null,
    satNeighborhoodCode: null,
    neighborhoodName: null,
    latitude: null,
    longitude: null,
  };
}

function clientAddressToFiscalForm(ca: ClientAddress): CompanyFiscalFormData {
  return {
    id: ca.id,
    addressType: "company",
    isPrimary: true,
    locationName: ca.locationName?.trim() ?? "",
    street: ca.street ?? "",
    exteriorNumber: ca.exteriorNumber ?? "",
    interiorNumber: ca.interiorNumber ?? null,
    reference: ca.reference ?? null,
    postalCode: ca.postalCode ?? "",
    satCountryCode: ca.satCountryCode ?? "MEX",
    satStateCode: ca.satStateCode ?? "",
    satMunicipalityCode: ca.satMunicipalityCode ?? "",
    satLocalityCode: ca.satLocalityCode ?? null,
    localityName: ca.localityName ?? null,
    satNeighborhoodCode: ca.satNeighborhoodCode ?? null,
    neighborhoodName: ca.neighborhoodName ?? null,
    latitude: ca.latitude ?? null,
    longitude: ca.longitude ?? null,
  };
}

function legacyToFiscalForm(legacy: CompanyAddress): CompanyFiscalFormData {
  const refParts = [legacy.municipality, legacy.city, legacy.state].filter(
    Boolean,
  );
  return {
    ...defaultFiscalForm(),
    locationName: "Domicilio fiscal",
    street: legacy.street,
    exteriorNumber: legacy.exteriorNumber,
    interiorNumber: legacy.interiorNumber,
    postalCode: legacy.postalCode,
    neighborhoodName: legacy.neighborhood,
    satStateCode: legacy.stateCode || "",
    reference: refParts.length ? refParts.join(", ") : null,
  };
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
