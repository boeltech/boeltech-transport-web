/**
 * Sheet de edición del domicilio de la empresa.
 *
 * Incluye el código postal desde el que se emiten facturas, porque se deriva
 * del domicilio y cambiar uno sin ver el otro genera facturas con datos
 * inconsistentes.
 *
 * Reglas SAT: única pasada por `@boeltech/cfdi-domain` al guardar (ADR-0043).
 */

import { memo, useCallback, useEffect, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  AddressInput,
  EntityAddressForm,
  buildGeocodingEntityFormSection,
  setFormCoordinates,
} from "@shared/ui/address-input";
import { FormValidationSummary } from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { ClientAddress } from "@features/clients/domain";

import { useUpdateCompanySettings } from "../../application/hooks";
import type { CompanyAddress, CompanySettings } from "../../domain";
import {
  companyFiscalFormSchema,
  companyFiscalFormToCreateDto,
  validateCompanyFiscalAddressFormComplete,
  type CompanyFiscalFormData,
} from "../validation/companyFiscalAddressSchema";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";
import { buildLugarExpedicionEntityFormSection } from "./buildLugarExpedicionEntityFormSection";
import {
  SETTINGS_SHEET_BODY_CLASS,
  SETTINGS_SHEET_FOOTER_CLASS,
  SETTINGS_SHEET_HEADER_CLASS,
  SETTINGS_SHEET_PRIMARY_BUTTON_CLASS,
  SETTINGS_SHEET_WIDE_CONTENT_CLASS,
} from "./settingsSheetLayout";

const copy = generalSettingsCopy.address;
const actionCopy = generalSettingsCopy.action;

/**
 * El domicilio de la empresa es único, así que pedir un nombre para él solo
 * añade un campo sin decisión detrás. El schema lo sigue exigiendo.
 */
const DEFAULT_LOCATION_NAME = "Domicilio fiscal";

const fiscalAddressSheetSchema = z
  .object({
    expideDesdeOtroCp: z.boolean(),
    lugarExpedicion: z.string().optional(),
    fiscal: companyFiscalFormSchema,
  })
  .superRefine((data, ctx) => {
    const postalCode = data.expideDesdeOtroCp
      ? data.lugarExpedicion?.trim()
      : data.fiscal.postalCode?.trim();
    if (!postalCode || !/^\d{5}$/.test(postalCode)) {
      ctx.addIssue({
        code: "custom",
        message: data.expideDesdeOtroCp
          ? "El código postal debe tener 5 dígitos"
          : "Completa el código postal del domicilio",
        path: data.expideDesdeOtroCp
          ? ["lugarExpedicion"]
          : ["fiscal", "postalCode"],
      });
    }
  });

type FiscalAddressFormData = z.infer<typeof fiscalAddressSheetSchema>;

export interface CompanyFiscalAddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CompanySettings;
}

export const CompanyFiscalAddressSheet = memo(
  function CompanyFiscalAddressSheet({
    open,
    onOpenChange,
    settings,
  }: CompanyFiscalAddressSheetProps) {
    const updateMutation = useUpdateCompanySettings();
    const [showSummary, setShowSummary] = useState(false);

    const form = useForm<FiscalAddressFormData, unknown, FiscalAddressFormData>({
      resolver: zodResolver(
        fiscalAddressSheetSchema,
      ) as Resolver<FiscalAddressFormData>,
      defaultValues: toFormValues(settings),
      mode: "onChange",
    });

    const { control, formState, handleSubmit, register, reset, setValue, trigger } =
      form;
    const isSaving = updateMutation.isPending || formState.isSubmitting;

    useEffect(() => {
      if (!open) return;
      reset(toFormValues(settings));
      setShowSummary(false);
      // Rehidratar solo al abrir: no pisar lo que el usuario está capturando.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fiscalStateCode = useWatch({ control, name: "fiscal.satStateCode" });
    const fiscalMunicipalityCode = useWatch({
      control,
      name: "fiscal.satMunicipalityCode",
    });
    const fiscalPostalCode = useWatch({ control, name: "fiscal.postalCode" });
    const fiscalAddress = useWatch({ control, name: "fiscal" });
    const expideDesdeOtroCp = useWatch({ control, name: "expideDesdeOtroCp" });

    useEffect(() => {
      if (expideDesdeOtroCp) return;
      const postalCode = fiscalPostalCode?.trim() ?? "";
      if (/^\d{5}$/.test(postalCode)) {
        setValue("lugarExpedicion", postalCode, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
    }, [expideDesdeOtroCp, fiscalPostalCode, setValue]);

    const handleClose = useCallback(
      (next: boolean) => {
        if (!next) {
          setShowSummary(false);
          reset(toFormValues(settings));
        }
        onOpenChange(next);
      },
      [onOpenChange, reset, settings],
    );

    const onValid = useCallback(
      async (data: FiscalAddressFormData) => {
        const fiscal: CompanyFiscalFormData = {
          ...data.fiscal,
          locationName: data.fiscal.locationName?.trim() || DEFAULT_LOCATION_NAME,
        };

        const validation = await validateCompanyFiscalAddressFormComplete(fiscal, {
          requireCoordinates: false,
        });

        if (!validation.ok) {
          // Sin `trigger` después: revalidar con Zod borraría estos mensajes,
          // que vienen del paquete y no del schema local.
          let firstFieldWithError: string | undefined;
          for (const [field, message] of Object.entries(validation.fieldErrors)) {
            if (!field || !message) continue;
            firstFieldWithError ??= field;
            form.setError(
              `fiscal.${field}` as `fiscal.${keyof CompanyFiscalFormData}`,
              { type: "sat", message },
            );
          }
          setShowSummary(true);
          if (firstFieldWithError) {
            form.setFocus(
              `fiscal.${firstFieldWithError}` as `fiscal.${keyof CompanyFiscalFormData}`,
            );
          }
          return;
        }

        const existingId = data.fiscal.id ?? settings.fiscalAddress?.id;

        try {
          await updateMutation.mutateAsync({
            lugarExpedicion: data.expideDesdeOtroCp
              ? (data.lugarExpedicion?.trim() ?? "")
              : fiscal.postalCode.trim(),
            fiscalAddress: {
              ...companyFiscalFormToCreateDto(fiscal),
              ...(existingId ? { id: existingId } : {}),
            },
          });
          setShowSummary(false);
          onOpenChange(false);
        } catch {
          // El hook ya notifica el error.
        }
      },
      [form, onOpenChange, settings.fiscalAddress?.id, updateMutation],
    );

    const summaryMessages = collectFieldErrorMessages(formState.errors);

    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className={SETTINGS_SHEET_WIDE_CONTENT_CLASS} side="right">
          <SheetHeader className={SETTINGS_SHEET_HEADER_CLASS}>
            <SheetTitle>{copy.sheetTitle}</SheetTitle>
            <SheetDescription>{copy.sheetDescription}</SheetDescription>
          </SheetHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit(onValid, () => setShowSummary(true))}
          >
            <div className={SETTINGS_SHEET_BODY_CLASS}>
              <EntityAddressForm
                asForm={false}
                className="space-y-4"
                formContext="companyFiscal"
                addressVariant="carta-porte"
                infoMessage={copy.notice}
                satStateCode={fiscalStateCode}
                satMunicipalityCode={fiscalMunicipalityCode}
                postalCode={fiscalPostalCode}
                showGlobalNotice
                locationSectionTitle={copy.title}
                addressInputSection={
                  <AddressInput<FiscalAddressFormData>
                    key={hydrationKey(settings)}
                    variant="carta-porte"
                    formContext="companyFiscal"
                    addressType="company"
                    control={control}
                    setValue={setValue}
                    namePrefix="fiscal"
                    layout="compact"
                    showLatLng={false}
                    showPrimaryToggle={false}
                    hideInformativeAlerts
                    embedded
                    disabled={isSaving}
                  />
                }
                postAddressSections={[
                  buildLugarExpedicionEntityFormSection({
                    expideDesdeOtroCp: Boolean(expideDesdeOtroCp),
                    fiscalPostalCode,
                    lugarExpedicionError:
                      formState.errors.lugarExpedicion?.message,
                    fiscalPostalCodeError:
                      formState.errors.fiscal?.postalCode?.message,
                    disabled: isSaving,
                    onExpideDesdeOtroCpChange: (checked) => {
                      setValue("expideDesdeOtroCp", checked, {
                        shouldDirty: true,
                      });
                      if (!checked) {
                        const postalCode = fiscalPostalCode?.trim() ?? "";
                        if (postalCode.length === 5) {
                          setValue("lugarExpedicion", postalCode, {
                            shouldDirty: true,
                          });
                        }
                      }
                    },
                    lugarExpedicionRegister: register("lugarExpedicion"),
                  }),
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
                    latitudeError: formState.errors.fiscal?.latitude?.message,
                    onCoordinatesChange: (coords) => {
                      void setFormCoordinates(
                        setValue,
                        trigger,
                        coords,
                        "fiscal",
                      );
                    },
                    disabled: isSaving,
                  }),
                ]}
              />

              {showSummary && summaryMessages.length > 0 ? (
                <FormValidationSummary
                  title={generalSettingsCopy.validation.summaryTitle}
                  messages={summaryMessages}
                />
              ) : null}
            </div>

            <SheetFooter className={SETTINGS_SHEET_FOOTER_CLASS}>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSaving}
              >
                {actionCopy.cancel}
              </Button>
              <Button
                type="submit"
                className={SETTINGS_SHEET_PRIMARY_BUTTON_CLASS}
                isLoading={isSaving}
              >
                {isSaving ? actionCopy.saving : actionCopy.save}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  },
);

// ============================================================================
// HELPERS
// ============================================================================

/** Remonta el formulario cuando el domicilio cargado cambia de identidad. */
function hydrationKey(settings: CompanySettings): string {
  return [
    settings.fiscalAddress?.id ?? "new",
    settings.fiscalAddress?.satStateCode ?? "",
    settings.fiscalAddress?.satMunicipalityCode ?? "",
    settings.fiscalAddress?.satNeighborhoodCode ?? "",
    settings.fiscalAddress?.neighborhoodName ?? "",
    settings.fiscalAddress?.postalCode ?? "",
  ].join(":");
}

function defaultFiscalForm(): CompanyFiscalFormData {
  return {
    addressType: "company",
    isPrimary: true,
    locationName: DEFAULT_LOCATION_NAME,
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

function clientAddressToFiscalForm(address: ClientAddress): CompanyFiscalFormData {
  return {
    id: address.id,
    addressType: "company",
    isPrimary: true,
    locationName: address.locationName?.trim() || DEFAULT_LOCATION_NAME,
    street: address.street ?? "",
    exteriorNumber: address.exteriorNumber ?? "",
    interiorNumber: address.interiorNumber ?? null,
    reference: address.reference ?? null,
    postalCode: address.postalCode ?? "",
    satCountryCode: address.satCountryCode ?? "MEX",
    satStateCode: address.satStateCode ?? "",
    satMunicipalityCode: address.satMunicipalityCode ?? "",
    satLocalityCode: address.satLocalityCode ?? null,
    localityName: address.localityName ?? null,
    satNeighborhoodCode: address.satNeighborhoodCode ?? null,
    neighborhoodName: address.neighborhoodName ?? null,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
  };
}

function legacyToFiscalForm(legacy: CompanyAddress): CompanyFiscalFormData {
  const referenceParts = [legacy.municipality, legacy.city, legacy.state].filter(
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
    reference: referenceParts.length ? referenceParts.join(", ") : null,
  };
}

function toFormValues(settings: CompanySettings): FiscalAddressFormData {
  const fiscal = settings.fiscalAddress
    ? clientAddressToFiscalForm(settings.fiscalAddress)
    : settings.legacyCompanyAddress
      ? legacyToFiscalForm(settings.legacyCompanyAddress)
      : defaultFiscalForm();

  const fiscalPostalCode = fiscal.postalCode?.trim() ?? "";
  const expideDesdeOtroCp = shouldExpideDesdeOtroCp(
    settings.lugarExpedicion,
    fiscalPostalCode,
  );

  return {
    fiscal,
    expideDesdeOtroCp,
    lugarExpedicion: expideDesdeOtroCp
      ? settings.lugarExpedicion
      : fiscalPostalCode || settings.lugarExpedicion,
  };
}

function shouldExpideDesdeOtroCp(
  lugarExpedicion: string,
  fiscalPostalCode: string,
): boolean {
  const expedition = lugarExpedicion.trim();
  const fiscal = fiscalPostalCode.trim();
  if (!expedition) return false;
  if (!fiscal) return true;
  return expedition !== fiscal;
}
