/**
 * ClientAddressListItem
 * Clean Architecture - Presentation Layer
 *
 * Versión compacta del card de dirección, diseñada para la columna master
 * del master-detail. Solo muestra lo esencial para identificar y elegir
 * (tipo, nombre del lugar, ciudad/CP, badges principal/inactiva).
 *
 * Para la vista completa, usar `<ClientAddressDetailView>`.
 *
 * Ubicación: src/features/clients/presentation/components/ClientAddressListItem.tsx
 */

import { Star } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import type { ClientAddressListItem as ClientAddressListItemEntity } from "../../domain";
import { getAddressTypeConfig } from "../config/clientConfig";
import { showsClientUbicacionFields } from "../config/clientAddressPurpose";
import { clientDetailCopy } from "../copy/clientDetailCopy";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressListRowProps {
  address: ClientAddressListItemEntity;
  /** Si esta dirección es la seleccionada en el master-detail. */
  selected?: boolean;
  /** Click en cualquier parte del item. */
  onClick: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientAddressListRow({
  address,
  selected = false,
  onClick,
  className,
}: ClientAddressListRowProps) {
  const typeConfig = getAddressTypeConfig(address.addressType);
  const TypeIcon = typeConfig.icon;

  // Línea 2: ciudad / CP
  const cityLine = [
    address.neighborhoodName,
    address.postalCode ? `CP ${address.postalCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-md border p-3 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-background shadow-sm"
          : "border-transparent bg-card hover:border-border",
        !address.isActive && "opacity-60",
        className,
      )}
    >
      {/* ── Header: icono tipo + título + badges ─────────────────────────── */}
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            typeConfig.bgColor,
          )}
        >
          <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {address.locationName || typeConfig.label}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {typeConfig.label}
            {cityLine ? ` · ${cityLine}` : null}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {typeConfig.labelShort}
            </Badge>
            {address.isPrimary ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {clientDetailCopy.address.primary}
              </Badge>
            ) : null}
            {!address.isActive ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {clientDetailCopy.address.inactive}
              </Badge>
            ) : null}
            {showsClientUbicacionFields(address.addressType) &&
            address.geolocationPending ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {clientDetailCopy.address.geoPending}
              </Badge>
            ) : null}
          </div>
        </div>
        {address.isPrimary ? (
          <Star
            className="h-3.5 w-3.5 shrink-0 fill-warning text-warning"
            aria-label="Dirección principal"
          />
        ) : null}
      </div>
    </button>
  );
}

export default ClientAddressListRow;
