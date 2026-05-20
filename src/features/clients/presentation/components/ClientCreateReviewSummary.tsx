/**
 * Resumen de revisión del wizard de alta de cliente (paso final).
 */

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Star,
  User,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import {
  CLIENT_TYPE_LABELS,
  getCartaPorteMissingFields,
  isCartaPorteReady,
} from "../../domain";
import type { ClientAddress } from "../../domain";
import { getAddressTypeConfig } from "../config/clientConfig";
import type { ClientFormData } from "../validation/clientSchema";
import type { ClientAddressFormData } from "../validation/clientAddressSchema";

const EMPTY_VALUE = "—";

export interface ClientCreateReviewSummaryProps {
  clientData: ClientFormData | null;
  addressData: ClientAddressFormData | null;
}

function displayValue(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || EMPTY_VALUE;
}

function formatCoordinates(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function formDataAsCartaPorteCheck(data: ClientAddressFormData): ClientAddress {
  return {
    id: "",
    tenantId: "",
    clientId: "",
    addressType: data.addressType,
    isPrimary: data.isPrimary,
    isActive: true,
    satCountryCode: data.satCountryCode,
    satStateCode: data.satStateCode,
    postalCode: data.postalCode,
    createdAt: "",
    updatedAt: "",
  };
}

function ClientAddressReviewBlock({ data }: { data: ClientAddressFormData }) {
  const typeConfig = getAddressTypeConfig(data.addressType);
  const TypeIcon = typeConfig.icon;
  const cartaPorteCheck = formDataAsCartaPorteCheck(data);
  const cartaPorteReady = isCartaPorteReady(cartaPorteCheck);
  const satMinMissing = cartaPorteReady
    ? []
    : getCartaPorteMissingFields(cartaPorteCheck);
  const hasGeo = data.latitude != null && data.longitude != null;
  const coordinates = formatCoordinates(data.latitude, data.longitude);

  const streetLine = [
    data.street,
    data.exteriorNumber ? `#${data.exteriorNumber}` : null,
    data.interiorNumber ? `Int. ${data.interiorNumber}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const localityLine = [
    data.neighborhoodName,
    data.postalCode ? `CP ${data.postalCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hasFiscalOps =
    Boolean(data.rfcRemitenteDestinatario?.trim()) ||
    Boolean(data.nombreRemitenteDestinatario?.trim());

  const hasContact =
    Boolean(data.contactName?.trim()) ||
    Boolean(data.contactPhone?.trim()) ||
    Boolean(data.contactEmail?.trim()) ||
    Boolean(data.businessHours?.trim());

  const hasNotes =
    Boolean(data.notes?.trim()) || Boolean(data.specialInstructions?.trim());

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <header className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            typeConfig.bgColor,
          )}
        >
          <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dirección fiscal
          </p>
          <h3 className="font-semibold text-foreground truncate">
            {data.locationName?.trim() || typeConfig.label}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
            {data.isPrimary ? (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                Principal
              </Badge>
            ) : null}
            {hasGeo ? (
              <Badge
                variant="outline"
                className="gap-1 border-success/40 text-success-soft-foreground"
              >
                <CheckCircle2 className="h-3 w-3" />
                Ubicación confirmada
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-warning/40 text-warning-soft-foreground"
              >
                <AlertCircle className="h-3 w-3" />
                Geo pendiente
              </Badge>
            )}
            {cartaPorteReady ? (
              <Badge
                variant="outline"
                className="gap-1 border-success/40 text-success-soft-foreground"
              >
                <CheckCircle2 className="h-3 w-3" />
                Carta Porte 3.1
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-warning/40 text-warning-soft-foreground"
                title={
                  satMinMissing.length > 0
                    ? `Falta mínimo SAT: ${satMinMissing.join(", ")}`
                    : undefined
                }
              >
                <AlertCircle className="h-3 w-3" />
                Mínimo SAT incompleto
              </Badge>
            )}
          </div>
        </div>
      </header>

      <section className="rounded-md border bg-card">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-medium">Ubicación</h4>
        </div>
        <div className="px-4 py-2">
          <InfoRow
            variant="inline"
            label="Calle"
            value={streetLine || EMPTY_VALUE}
          />
          <InfoRow
            variant="inline"
            label="Colonia / CP"
            value={localityLine || EMPTY_VALUE}
          />
          <InfoRow
            variant="inline"
            label="País SAT"
            value={displayValue(data.satCountryCode || "MEX")}
            mono
          />
          <InfoRow
            variant="inline"
            label="Estado SAT"
            value={displayValue(data.satStateCode)}
            mono
          />
          <InfoRow
            variant="inline"
            label="Municipio SAT"
            value={displayValue(data.satMunicipalityCode)}
            mono
          />
          {data.satLocalityCode?.trim() ? (
            <InfoRow
              variant="inline"
              label="Localidad SAT"
              value={data.satLocalityCode}
              mono
            />
          ) : null}
          {data.satNeighborhoodCode?.trim() ? (
            <InfoRow
              variant="inline"
              label="Colonia SAT"
              value={data.satNeighborhoodCode}
              mono
            />
          ) : null}
          {data.reference?.trim() ? (
            <InfoRow variant="inline" label="Referencia" value={data.reference} />
          ) : null}
          {coordinates ? (
            <InfoRow
              variant="inline"
              label="Lat / Lng"
              value={coordinates}
              mono
            />
          ) : null}
        </div>
      </section>

      {hasFiscalOps ? (
        <section className="rounded-md border bg-card">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium">Datos fiscales operativos</h4>
          </div>
          <div className="px-4 py-2">
            <InfoRow
              variant="inline"
              label="RFC remitente/dest."
              value={displayValue(data.rfcRemitenteDestinatario)}
              mono
            />
            <InfoRow
              variant="inline"
              label="Nombre"
              value={displayValue(data.nombreRemitenteDestinatario)}
            />
          </div>
        </section>
      ) : null}

      {hasContact ? (
        <section className="rounded-md border bg-card">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium">
              Contacto en esta ubicación
            </h4>
          </div>
          <div className="px-4 py-2">
            {data.contactName?.trim() ? (
              <InfoRow variant="inline" label="Nombre" value={data.contactName} />
            ) : null}
            {data.contactPhone?.trim() ? (
              <InfoRow
                variant="inline"
                label="Teléfono"
                value={data.contactPhone}
              />
            ) : null}
            {data.contactEmail?.trim() ? (
              <InfoRow variant="inline" label="Correo" value={data.contactEmail} />
            ) : null}
            {data.businessHours?.trim() ? (
              <InfoRow
                variant="inline"
                label="Horario"
                value={data.businessHours}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {hasNotes ? (
        <section className="rounded-md border bg-card">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium">Notas</h4>
          </div>
          <div className="px-4 py-2">
            {data.notes?.trim() ? (
              <InfoRow variant="inline" label="Notas" value={data.notes} />
            ) : null}
            {data.specialInstructions?.trim() ? (
              <InfoRow
                variant="inline"
                label="Instrucciones"
                value={data.specialInstructions}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ClientCreateReviewSummary({
  clientData,
  addressData,
}: ClientCreateReviewSummaryProps) {
  if (!clientData) {
    return (
      <p className="text-sm text-muted-foreground">
        Completa los pasos anteriores para ver el resumen.
      </p>
    );
  }

  const isIndividual = clientData.type === "individual";
  const Icon = isIndividual ? User : Building2;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center bg-primary/10 text-primary",
            isIndividual ? "rounded-full" : "rounded-lg",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cliente
          </p>
          <p className="font-semibold text-foreground">{clientData.legalName}</p>
          {clientData.tradeName?.trim() ? (
            <p className="text-xs text-muted-foreground">{clientData.tradeName}</p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            RFC {clientData.taxId.toUpperCase()}
            {" · "}
            {CLIENT_TYPE_LABELS[clientData.type]}
          </p>
        </div>
      </div>

      {addressData ? <ClientAddressReviewBlock data={addressData} /> : null}
    </div>
  );
}
