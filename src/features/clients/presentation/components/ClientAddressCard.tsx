/**
 * ClientAddressCard Component
 * Clean Architecture - Presentation Layer
 *
 * Tarjeta para mostrar una dirección del cliente.
 * Muestra información resumida con opción de acciones.
 *
 * Ubicación: src/features/clients/presentation/components/ClientAddressCard.tsx
 */

import { Card, CardContent } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  MapPin,
  Phone,
  User,
  Clock,
  Star,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import type { ClientAddressListItem, ClientAddress } from "../../domain";
import { formatClientAddress, isCartaPorteReady } from "../../domain";
import { getAddressTypeConfig } from "../config/clientConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressCardProps {
  address: ClientAddressListItem | ClientAddress;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetPrimary?: () => void;
  showActions?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientAddressCard({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
  showActions = true,
  className,
}: ClientAddressCardProps) {
  const typeConfig = getAddressTypeConfig(address.addressType);
  const TypeIcon = typeConfig.icon;
  const cartaPorteReady = isCartaPorteReady(address as ClientAddress);

  return (
    <Card
      className={cn(
        "relative",
        !address.isActive && "opacity-60",
        address.isPrimary && "ring-2 ring-primary/20",
        className,
      )}
    >
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {/* Icono del tipo */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                typeConfig.bgColor,
              )}
            >
              <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
            </div>

            {/* Tipo y badges */}
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                {address.isPrimary && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    Principal
                  </Badge>
                )}
              </div>
              {address.locationName && (
                <p className="text-sm font-medium mt-0.5">
                  {address.locationName}
                </p>
              )}
            </div>
          </div>

          {/* Acciones */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onSetPrimary && !address.isPrimary && (
                  <DropdownMenuItem onClick={onSetPrimary}>
                    <Star className="mr-2 h-4 w-4" />
                    Marcar como principal
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Dirección */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">
              {formatClientAddress(address as ClientAddress)}
            </span>
          </div>

          {/* Códigos SAT (si existen) */}
          {address.satEstadoCode && (
            <div className="flex flex-wrap gap-1 ml-6">
              <Badge variant="outline" className="text-xs font-mono">
                {address.satEstadoCode}
              </Badge>
              {address.satMunicipioCode && (
                <Badge variant="outline" className="text-xs font-mono">
                  {address.satMunicipioCode}
                </Badge>
              )}
              {address.postalCode && (
                <Badge variant="outline" className="text-xs font-mono">
                  CP {address.postalCode}
                </Badge>
              )}
            </div>
          )}

          {/* Contacto */}
          {(address.contactName || address.contactPhone) && (
            <div className="flex items-center gap-4 text-sm pt-2 border-t">
              {address.contactName && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {address.contactName}
                </span>
              )}
              {address.contactPhone && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {address.contactPhone}
                </span>
              )}
            </div>
          )}

          {/* Horario (si existe en la versión completa) */}
          {"businessHours" in address && address.businessHours && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {address.businessHours}
            </div>
          )}
        </div>

        {/* Indicador Carta Porte */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t">
          {cartaPorteReady ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Carta Porte 3.1
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Datos CP incompletos
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ClientAddressCard;
