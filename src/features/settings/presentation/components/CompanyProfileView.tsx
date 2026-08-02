/**
 * Ficha de la empresa en modo lectura.
 *
 * La pantalla se consulta mucho más de lo que se edita, así que el estado por
 * defecto es de lectura y cada bloque se corrige en su propio sheet.
 */

import { memo, useState } from "react";
import { Building2, Info, MapPin, Pencil, Phone } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { InfoRow } from "@shared/ui/data-display";
import { useRegimenFiscalLabel } from "@features/catalogs";
import { useClientAddressLocationLabels } from "@features/clients/presentation/hooks/useClientAddressLocationLabels";

import type { CompanySettings } from "../../domain";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";
import { CompanyContactSheet } from "./CompanyContactSheet";
import { CompanyFiscalAddressSheet } from "./CompanyFiscalAddressSheet";
import { CompanyIdentitySheet } from "./CompanyIdentitySheet";
import { CompanyLogoField } from "./CompanyLogoField";

const copy = generalSettingsCopy;

type OpenSheet = "identity" | "address" | "contact" | null;

export interface CompanyProfileViewProps {
  settings: CompanySettings;
  /** URL ya versionada del logo actual. */
  logoSrc: string | null;
  canEdit: boolean;
}

export const CompanyProfileView = memo(function CompanyProfileView({
  settings,
  logoSrc,
  canEdit,
}: CompanyProfileViewProps) {
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const address = settings.fiscalAddress;
  const legacyAddress = settings.legacyCompanyAddress;
  const hasPendingLegacyAddress = Boolean(legacyAddress) && !address;

  const regimenFiscal = useRegimenFiscalLabel(settings.regimenFiscal, {
    format: "name",
    enabled: !settings.regimenFiscalDescripcion,
  });
  const locationLabels = useClientAddressLocationLabels({
    satStateCode: address?.satStateCode,
    satMunicipalityCode: address?.satMunicipalityCode,
  });

  const regimenValue =
    settings.regimenFiscalDescripcion?.trim() ||
    (regimenFiscal.isLoading
      ? copy.identity.taxRegimeLoading
      : (regimenFiscal.label ?? ""));

  const streetLine = [
    address?.street ?? legacyAddress?.street,
    address?.exteriorNumber ?? legacyAddress?.exteriorNumber,
    (address?.interiorNumber ?? legacyAddress?.interiorNumber)
      ? `Int. ${address?.interiorNumber ?? legacyAddress?.interiorNumber}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const postalCode = address?.postalCode ?? legacyAddress?.postalCode ?? "";
  const neighborhoodLine = [
    address?.neighborhoodName ?? legacyAddress?.neighborhood,
    postalCode ? `${copy.address.postalCodePrefix} ${postalCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const municipalityValue = address
    ? locationLabels.isLoading
      ? copy.address.catalogLoading
      : (locationLabels.municipalityLabel ?? "")
    : (legacyAddress?.municipality ?? legacyAddress?.city ?? "");

  const stateValue = address
    ? locationLabels.isLoading
      ? copy.address.catalogLoading
      : (locationLabels.stateLabel ?? "")
    : (legacyAddress?.state ?? "");

  const expeditionPostalCode = settings.lugarExpedicion?.trim() ?? "";
  const expeditionValue = expeditionPostalCode
    ? `${copy.address.postalCodePrefix} ${expeditionPostalCode}${
        postalCode && expeditionPostalCode !== postalCode
          ? ` · ${copy.address.issuedFromDifferent}`
          : ""
      }`
    : "";

  const hasAddress = Boolean(address ?? legacyAddress);

  return (
    <div className="space-y-6">
      {!canEdit ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{copy.state.readOnlyTitle}</AlertTitle>
          <AlertDescription>{copy.state.readOnlyDescription}</AlertDescription>
        </Alert>
      ) : null}

      {canEdit && hasPendingLegacyAddress ? (
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>{copy.state.pendingAddressTitle}</AlertTitle>
          <AlertDescription>
            {copy.state.pendingAddressDescription}
          </AlertDescription>
        </Alert>
      ) : null}

      <FormSectionCard
        title={copy.identity.title}
        description={copy.identity.description}
        icon={<Building2 className="h-4 w-4" />}
        action={
          canEdit ? (
            <EditButton
              label={copy.identity.editAction}
              onClick={() => setOpenSheet("identity")}
            />
          ) : null
        }
        contentClassName="space-y-4"
      >
        {canEdit ? <CompanyLogoField logoSrc={logoSrc} /> : null}

        <div>
          <InfoRow
            variant="inline"
            label={copy.identity.tradeName}
            value={settings.tradeName ?? ""}
          />
          <InfoRow
            variant="inline"
            label={copy.identity.legalName}
            value={settings.legalName}
          />
          <InfoRow
            variant="inline"
            label={copy.identity.rfc}
            value={settings.rfc}
            mono
            copyable
          />
          <InfoRow
            variant="inline"
            label={copy.identity.taxRegime}
            value={regimenValue}
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title={copy.address.title}
        description={copy.address.description}
        icon={<MapPin className="h-4 w-4" />}
        action={
          canEdit && hasAddress ? (
            <EditButton
              label={copy.address.editAction}
              onClick={() => setOpenSheet("address")}
            />
          ) : null
        }
        contentClassName={hasAddress ? undefined : "pb-2"}
      >
        {hasAddress ? (
          <div>
            <InfoRow
              variant="inline"
              label={copy.address.street}
              value={streetLine}
            />
            <InfoRow
              variant="inline"
              label={copy.address.neighborhoodPostal}
              value={neighborhoodLine}
            />
            <InfoRow
              variant="inline"
              label={copy.address.municipality}
              value={municipalityValue}
            />
            <InfoRow
              variant="inline"
              label={copy.address.state}
              value={stateValue}
            />
            {address?.reference ? (
              <InfoRow
                variant="inline"
                label={copy.address.reference}
                value={address.reference}
              />
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.address.issuedFrom}
              value={expeditionValue}
            />
          </div>
        ) : (
          <EmptyState
            size="sm"
            icon={<MapPin />}
            title={copy.address.emptyTitle}
            description={copy.address.emptyDescription}
            cta={
              canEdit
                ? {
                    label: copy.address.emptyAction,
                    onClick: () => setOpenSheet("address"),
                  }
                : undefined
            }
          />
        )}
      </FormSectionCard>

      <FormSectionCard
        title={copy.contact.title}
        description={copy.contact.description}
        icon={<Phone className="h-4 w-4" />}
        action={
          canEdit ? (
            <EditButton
              label={copy.contact.editAction}
              onClick={() => setOpenSheet("contact")}
            />
          ) : null
        }
      >
        <div>
          <InfoRow
            variant="inline"
            label={copy.contact.email}
            value={settings.email}
            copyable
          />
          <InfoRow
            variant="inline"
            label={copy.contact.phone}
            value={settings.phone ?? ""}
            copyable={Boolean(settings.phone)}
          />
          <InfoRow
            variant="inline"
            label={copy.contact.website}
            value={settings.website ?? ""}
          />
        </div>
      </FormSectionCard>

      {canEdit ? (
        <>
          <CompanyIdentitySheet
            open={openSheet === "identity"}
            onOpenChange={(open) => setOpenSheet(open ? "identity" : null)}
            settings={settings}
          />
          <CompanyFiscalAddressSheet
            open={openSheet === "address"}
            onOpenChange={(open) => setOpenSheet(open ? "address" : null)}
            settings={settings}
          />
          <CompanyContactSheet
            open={openSheet === "contact"}
            onOpenChange={(open) => setOpenSheet(open ? "contact" : null)}
            settings={settings}
          />
        </>
      ) : null}
    </div>
  );
});

function EditButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={label}
    >
      <Pencil className="mr-2 h-4 w-4" />
      {generalSettingsCopy.action.edit}
    </Button>
  );
}
