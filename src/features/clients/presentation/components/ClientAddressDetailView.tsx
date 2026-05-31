/**
 * ClientAddressDetailView
 * Clean Architecture - Presentation Layer
 *
 * Vista read-only del panel detail en el master-detail de direcciones.
 * Muestra todos los campos de la dirección seleccionada con `InfoRow`
 * variant="inline" (estilo editorial, denso, copyable para identificadores)
 * Acciones (Marcar principal, Editar, Eliminar) en el header del panel (`readOnly` las oculta).
 *
 * Cuando el usuario hace click en "Editar", el componente padre
 * (`ClientAddressMasterDetail`) muta este panel al `ClientAddressForm`
 * inline — esta vista no maneja transición, solo expone callbacks.
 *
 * Ubicación: src/features/clients/presentation/components/ClientAddressDetailView.tsx
 */

import { Pencil, Star, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import type { ClientAddress } from "../../domain";
import { getCartaPorteMissingFields, isCartaPorteReady } from "../../domain";
import { getAddressTypeConfig } from "../config/clientConfig";

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
  const cartaPorteReady = address.isCartaPorteReady ?? isCartaPorteReady(address);
  const satMinMissing = cartaPorteReady ? [] : getCartaPorteMissingFields(address);

  // ── Líneas calculadas ───────────────────────────────────────────────────
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

  const showActions = !readOnly && Boolean(onEdit && onDelete);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Header                                                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
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
                  Principal
                </Badge>
              ) : null}
              {!address.isActive ? (
                <Badge variant="secondary">Inactiva</Badge>
              ) : null}
              {address.geolocationPending ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-warning/40 text-warning-soft-foreground"
                >
                  <AlertCircle className="h-3 w-3" />
                  Geo pendiente
                </Badge>
              ) : null}
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
                Marcar principal
              </Button>
            ) : null}
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              disabled={isPending}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        ) : null}
      </header>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Datos de ubicación                                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <section className="rounded-md border bg-card">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-medium">Ubicación</h4>
        </div>
        <div className="px-4 py-2">
          <InfoRow
            variant="inline"
            label="Calle"
            value={streetLine || "—"}
          />
          <InfoRow
            variant="inline"
            label="Colonia / CP"
            value={localityLine || "—"}
          />
          <InfoRow
            variant="inline"
            label="Estado SAT"
            value={address.satStateCode ?? "—"}
            mono
          />
          <InfoRow
            variant="inline"
            label="Municipio SAT"
            value={address.satMunicipalityCode ?? "—"}
            mono
          />
          {address.reference ? (
            <InfoRow
              variant="inline"
              label="Referencia"
              value={address.reference}
            />
          ) : null}
          {address.latitude != null && address.longitude != null ? (
            <InfoRow
              variant="inline"
              label="Lat / Lng"
              value={`${address.latitude}, ${address.longitude}`}
              mono
            />
          ) : null}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Datos fiscales operativos (Carta Porte)                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {(address.rfcRemitenteDestinatario ||
        address.nombreRemitenteDestinatario) ? (
        <section className="rounded-md border bg-card">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium">Datos fiscales operativos</h4>
          </div>
          <div className="px-4 py-2">
            <InfoRow
              variant="inline"
              label="RFC remitente/dest."
              value={address.rfcRemitenteDestinatario ?? "—"}
              mono
              copyable={!!address.rfcRemitenteDestinatario}
            />
            <InfoRow
              variant="inline"
              label="Nombre"
              value={address.nombreRemitenteDestinatario ?? "—"}
            />
          </div>
        </section>
      ) : null}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Contacto                                                            */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {(address.contactName ||
        address.contactPhone ||
        address.contactEmail ||
        address.businessHours) ? (
        <section className="rounded-md border bg-card">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium">Contacto en esta ubicación</h4>
          </div>
          <div className="px-4 py-2">
            {address.contactName ? (
              <InfoRow
                variant="inline"
                label="Nombre"
                value={address.contactName}
              />
            ) : null}
            {address.contactPhone ? (
              <InfoRow
                variant="inline"
                label="Teléfono"
                value={address.contactPhone}
                copyable
              />
            ) : null}
            {address.contactEmail ? (
              <InfoRow
                variant="inline"
                label="Email"
                value={address.contactEmail}
                copyable
              />
            ) : null}
            {address.businessHours ? (
              <InfoRow
                variant="inline"
                label="Horario"
                value={address.businessHours}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Notas                                                               */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {(address.specialInstructions || address.notes) ? (
        <section className="rounded-md border bg-card px-4 py-3 space-y-3">
          {address.specialInstructions ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Instrucciones especiales
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {address.specialInstructions}
              </p>
            </div>
          ) : null}
          {address.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Notas
              </p>
              <p className="text-sm whitespace-pre-wrap">{address.notes}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export default ClientAddressDetailView;
