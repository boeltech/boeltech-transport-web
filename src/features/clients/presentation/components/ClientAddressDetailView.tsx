/**
 * ClientAddressDetailView
 * Clean Architecture - Presentation Layer
 *
 * Vista read-only del panel detail en el master-detail de direcciones.
 * Copy operativo: sin códigos SAT crudos ni tooltips con keys técnicas.
 *
 * Ubicación: src/features/clients/presentation/components/ClientAddressDetailView.tsx
 */

import { Pencil, Star, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import type { ClientAddress } from "../../domain";
import { isCartaPorteReady } from "../../domain";
import { getAddressTypeConfig } from "../config/clientConfig";
import { showsClientUbicacionFields } from "../config/clientAddressPurpose";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import { useClientAddressLocationLabels } from "../hooks/useClientAddressLocationLabels";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressDetailViewProps {
  address: ClientAddress;
  /** Solo lectura: oculta Editar / Eliminar (ej. pestaña del detalle de cliente). */
  readOnly?: boolean;
  /** Handler de "Editar" — el padre cambia a modo edit. */
  onEdit?: () => void;
  /** Handler de "Eliminar" — el padre abre el AlertDialog de confirmación. */
  onDelete?: () => void;
  /** Handler para marcar dirección como principal. */
  onSetPrimary?: () => void;
  /** Indicador de mutación en curso (deshabilita botones). */
  isPending?: boolean;
  className?: string;
}

const copy = clientDetailCopy.address;

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientAddressDetailView({
  address,
  readOnly = false,
  onEdit,
  onDelete,
  onSetPrimary,
  isPending = false,
  className,
}: ClientAddressDetailViewProps) {
  const typeConfig = getAddressTypeConfig(address.addressType);
  const TypeIcon = typeConfig.icon;
  const showUbicacion = showsClientUbicacionFields(address.addressType);
  const tripReady = address.isCartaPorteReady ?? isCartaPorteReady(address);
  const hasBillingCp = Boolean(address.postalCode?.trim());
  const locationLabels = useClientAddressLocationLabels({
    satStateCode: address.satStateCode,
    satMunicipalityCode: address.satMunicipalityCode,
  });

  const streetLine = [
    address.street,
    address.exteriorNumber ? `#${address.exteriorNumber}` : null,
    address.interiorNumber ? `Int. ${address.interiorNumber}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const localityLine = [
    address.neighborhoodName,
    address.postalCode ? `CP ${address.postalCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const stateValue = locationLabels.isLoading
    ? copy.catalogLoading
    : (locationLabels.stateLabel ?? "—");
  const municipalityValue = locationLabels.isLoading
    ? copy.catalogLoading
    : (locationLabels.municipalityLabel ?? "—");

  const showActions = !readOnly && Boolean(onEdit && onDelete);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <header className="flex shrink-0 flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              typeConfig.bgColor,
            )}
          >
            <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">
              {address.locationName || typeConfig.label}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
              {address.isPrimary ? (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {copy.primary}
                </Badge>
              ) : null}
              {!address.isActive ? (
                <Badge variant="secondary">{copy.inactive}</Badge>
              ) : null}
              {showUbicacion && address.geolocationPending ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-warning/40 text-warning-soft-foreground"
                >
                  <AlertCircle className="h-3 w-3" />
                  {copy.geoPending}
                </Badge>
              ) : null}
              {showUbicacion ? (
                tripReady ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-success/40 text-success-soft-foreground"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {copy.readyForTrip}
                </Badge>
                ) : (
                <Badge
                  variant="outline"
                  className="gap-1 border-warning/40 text-warning-soft-foreground"
                >
                  <AlertCircle className="h-3 w-3" />
                  {copy.missingTripData}
                </Badge>
                )
              ) : address.addressType === "billing" ? (
                hasBillingCp ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-success/40 text-success-soft-foreground"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {copy.fiscalReady}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-warning/40 text-warning-soft-foreground"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {copy.fiscalMissingCp}
                  </Badge>
                )
              ) : null}
            </div>
          </div>
        </div>

        {showActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {!address.isPrimary && onSetPrimary ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSetPrimary}
                disabled={isPending}
              >
                <Star className="mr-2 h-4 w-4" />
                {copy.setPrimary}
              </Button>
            ) : null}
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              disabled={isPending}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {copy.edit}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {copy.delete}
            </Button>
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-5 pr-1">
          <section className="rounded-md border bg-card">
            <div className="px-4 py-3 border-b">
              <h4 className="text-sm font-medium">{copy.locationTitle}</h4>
            </div>
            <div className="px-4 py-2">
              <InfoRow variant="inline" label={copy.street} value={streetLine || "—"} />
              <InfoRow
                variant="inline"
                label={copy.neighborhoodPostal}
                value={localityLine || "—"}
              />
              <InfoRow variant="inline" label={copy.state} value={stateValue} />
              <InfoRow variant="inline" label={copy.municipality} value={municipalityValue} />
              {address.reference ? (
                <InfoRow variant="inline" label={copy.reference} value={address.reference} />
              ) : null}
              {showUbicacion && address.latitude != null && address.longitude != null ? (
                <InfoRow
                  variant="inline"
                  label={copy.coordinates}
                  value={`${address.latitude}, ${address.longitude}`}
                  mono
                />
              ) : null}
            </div>
          </section>

          {showUbicacion &&
          (address.rfcRemitenteDestinatario ||
            address.nombreRemitenteDestinatario) ? (
            <section className="rounded-md border bg-card">
              <div className="px-4 py-3 border-b">
                <h4 className="text-sm font-medium">{copy.tripPartyTitle}</h4>
              </div>
              <div className="px-4 py-2">
                <InfoRow
                  variant="inline"
                  label={copy.tripPartyRfc}
                  value={address.rfcRemitenteDestinatario ?? "—"}
                  mono
                  copyable={!!address.rfcRemitenteDestinatario}
                />
                <InfoRow
                  variant="inline"
                  label={copy.tripPartyName}
                  value={address.nombreRemitenteDestinatario ?? "—"}
                />
              </div>
            </section>
          ) : null}

          {address.contactName ||
          address.contactPhone ||
          address.contactEmail ||
          address.businessHours ? (
            <section className="rounded-md border bg-card">
              <div className="px-4 py-3 border-b">
                <h4 className="text-sm font-medium">{copy.contactTitle}</h4>
              </div>
              <div className="px-4 py-2">
                {address.contactName ? (
                  <InfoRow
                    variant="inline"
                    label={copy.contactName}
                    value={address.contactName}
                  />
                ) : null}
                {address.contactPhone ? (
                  <InfoRow
                    variant="inline"
                    label={copy.contactPhone}
                    value={address.contactPhone}
                    copyable
                  />
                ) : null}
                {address.contactEmail ? (
                  <InfoRow
                    variant="inline"
                    label={copy.contactEmail}
                    value={address.contactEmail}
                    copyable
                  />
                ) : null}
                {address.businessHours ? (
                  <InfoRow
                    variant="inline"
                    label={copy.businessHours}
                    value={address.businessHours}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {address.specialInstructions || address.notes ? (
            <section className="rounded-md border bg-card px-4 py-3 space-y-3">
              {address.specialInstructions ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {copy.specialInstructions}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {address.specialInstructions}
                  </p>
                </div>
              ) : null}
              {address.notes ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {copy.notes}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{address.notes}</p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ClientAddressDetailView;
