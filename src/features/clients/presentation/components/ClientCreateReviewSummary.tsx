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
import { CLIENT_TYPE_LABELS, PAYMENT_TERMS_LABELS } from "../../domain";
import { getAddressTypeConfig } from "../config/clientConfig";
import type { ClientFormData } from "../validation/clientSchema";
import type { ClientAddressFormData } from "../validation/clientAddressSchema";
import { cfdiReceptorProfileCopy } from "../copy/cfdiReceptorProfileCopy";

const EMPTY_VALUE = "—";

export interface ClientCreateReviewSummaryProps {
  clientData: ClientFormData | null;
  addressData: ClientAddressFormData | null;
}

function displayValue(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || EMPTY_VALUE;
}

function formatCreditLimit(value: number | null | undefined): string {
  if (value == null) return "Sin límite";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function ClientAddressReviewBlock({ data }: { data: ClientAddressFormData }) {
  const typeConfig = getAddressTypeConfig(data.addressType);
  const TypeIcon = typeConfig.icon;
  const hasBillingCp = Boolean(data.postalCode?.trim());

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
            {hasBillingCp ? (
              <Badge
                variant="outline"
                className="gap-1 border-success/40 text-success-soft-foreground"
              >
                <CheckCircle2 className="h-3 w-3" />
                Código postal para facturar
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-warning/40 text-warning-soft-foreground"
              >
                <AlertCircle className="h-3 w-3" />
                Falta código postal
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
        </div>
      </section>
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
  const hasContact = Boolean(
    clientData.contactName?.trim() ||
      clientData.phone?.trim() ||
      clientData.email?.trim(),
  );

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
            {clientData.taxId?.trim()
              ? `RFC ${clientData.taxId.toUpperCase()}`
              : cfdiReceptorProfileCopy.badge.comercialOnly}
            {" · "}
            {CLIENT_TYPE_LABELS[clientData.type]}
          </p>
          <div className="mt-2">
            <Badge
              variant={
                clientData.cfdiReceptorProfile === "comercial_only"
                  ? "secondary"
                  : "outline"
              }
              className="text-xs"
            >
              {clientData.cfdiReceptorProfile === "comercial_only"
                ? cfdiReceptorProfileCopy.badge.comercialOnly
                : cfdiReceptorProfileCopy.badge.receptorCfdi}
            </Badge>
          </div>
        </div>
      </div>

      <section className="rounded-lg border bg-muted/30 p-4 space-y-1">
        <h3 className="mb-2 text-sm font-medium text-foreground">
          Datos fiscales y comerciales
        </h3>
        <InfoRow
          variant="inline"
          label={cfdiReceptorProfileCopy.field.label}
          value={
            clientData.cfdiReceptorProfile === "comercial_only"
              ? cfdiReceptorProfileCopy.options.comercial_only
              : cfdiReceptorProfileCopy.options.receptor_cfdi
          }
        />
        <InfoRow
          variant="inline"
          label={cfdiReceptorProfileCopy.defaultLiquidacion.label}
          value={
            clientData.cfdiReceptorProfile === "comercial_only"
              ? cfdiReceptorProfileCopy.defaultLiquidacion.sinCfdi
              : cfdiReceptorProfileCopy.defaultLiquidacion.emitir
          }
        />
        <InfoRow
          variant="inline"
          label="Régimen fiscal"
          value={displayValue(clientData.taxRegime)}
          mono
        />
        <InfoRow
          variant="inline"
          label="Términos de pago"
          value={PAYMENT_TERMS_LABELS[clientData.paymentTerms]}
        />
        <p className="pb-1 text-xs text-muted-foreground">
          {cfdiReceptorProfileCopy.paymentTermsHint}
        </p>
        {clientData.paymentTerms === "credit" ? (
          <>
            <InfoRow
              variant="inline"
              label="Días de crédito"
              value={String(clientData.creditDays)}
            />
            <InfoRow
              variant="inline"
              label="Límite de crédito"
              value={formatCreditLimit(clientData.creditLimit)}
            />
          </>
        ) : null}
        {clientData.billingEmail?.trim() ? (
          <InfoRow
            variant="inline"
            label="Correo de facturación"
            value={clientData.billingEmail}
          />
        ) : null}
      </section>

      {hasContact ? (
        <section className="rounded-lg border bg-muted/30 p-4 space-y-1">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Contacto principal
          </h3>
          <InfoRow
            variant="inline"
            label="Nombre"
            value={displayValue(clientData.contactName)}
          />
          {clientData.contactPosition?.trim() ? (
            <InfoRow
              variant="inline"
              label="Puesto"
              value={clientData.contactPosition}
            />
          ) : null}
          {clientData.phone?.trim() ? (
            <InfoRow variant="inline" label="Teléfono" value={clientData.phone} />
          ) : null}
          {clientData.email?.trim() ? (
            <InfoRow variant="inline" label="Correo" value={clientData.email} />
          ) : null}
        </section>
      ) : null}

      {addressData ? (
        <ClientAddressReviewBlock data={addressData} />
      ) : clientData.cfdiReceptorProfile === "comercial_only" ? (
        <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          Sin domicilio fiscal. Puedes agregarlo después en Direcciones.
        </p>
      ) : null}
    </div>
  );
}
