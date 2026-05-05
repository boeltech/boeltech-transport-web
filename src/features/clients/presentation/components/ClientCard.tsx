/**
 * ClientCard Component
 * Clean Architecture - Presentation Layer
 *
 * Tarjeta de cliente para vista en grid.
 *
 * Ubicación: src/features/clients/presentation/components/ClientCard.tsx
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Phone, Mail, MapPin } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import type { ClientListItem } from "../../domain";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
  formatCreditLimit,
  formatCreditDays,
} from "../config/clientConfig";
import { ClientStatusBadge, operationalStatusFromClient } from "../config/clientStatusConfig";
import { ClientActions } from "./ClientActions";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientCardProps {
  client: ClientListItem;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientCard({ client, className }: ClientCardProps) {
  const navigate = useNavigate();

  const typeConfig = getClientTypeConfig(client.type);
  const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
  const TypeIcon = typeConfig.icon;
  const PaymentIcon = paymentConfig.icon;

  const handleClick = () => {
    navigate(`/clients/${client.id}`);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        !client.isActive && "opacity-60",
        className,
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Código y badges */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-muted-foreground">
                {client.clientCode}
              </span>
              <ClientStatusBadge
                status={operationalStatusFromClient(client.isActive)}
                size="sm"
                className="text-xs"
              />
            </div>

            {/* Nombre */}
            <h3 className="font-semibold text-base leading-tight truncate">
              {client.legalName}
            </h3>
            {client.tradeName && (
              <p className="text-sm text-muted-foreground truncate">
                {client.tradeName}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div onClick={(e) => e.stopPropagation()}>
            <ClientActions client={client} variant="dropdown" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* RFC y Tipo */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm">{client.taxId}</span>
          <Badge variant={typeConfig.variant} className="gap-1">
            <TypeIcon className="h-3 w-3" />
            {typeConfig.labelShort}
          </Badge>
        </div>

        {/* Ubicación */}
        {(client.city || client.state) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {[client.city, client.state].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* Contacto */}
        <div className="flex flex-col gap-1">
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
        </div>

        {/* Términos de pago */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Badge variant={paymentConfig.variant} className="gap-1">
              <PaymentIcon className="h-3 w-3" />
              {paymentConfig.labelShort}
            </Badge>
            {client.paymentTerms === "credit" && (
              <span className="text-xs text-muted-foreground">
                {formatCreditDays(client.creditDays)}
              </span>
            )}
          </div>
          {client.paymentTerms === "credit" && client.creditLimit && (
            <span className="text-xs text-muted-foreground">
              {formatCreditLimit(client.creditLimit)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ClientCard;
