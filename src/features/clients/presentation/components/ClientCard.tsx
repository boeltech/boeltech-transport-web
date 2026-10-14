/**
 * ClientCard Component
 * Clean Architecture - Presentation Layer
 *
 * Tarjeta de cliente para vista en grid.
 * Menú ⋯ vía EntityListCard (usable sin hover — D2).
 *
 * Ubicación: src/features/clients/presentation/components/ClientCard.tsx
 */

import { useNavigate } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import { CardContent, CardHeader } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";
import { Phone, Mail } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import type { ClientListItem } from "../../domain";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
  formatCreditLimit,
  formatCreditDays,
} from "../config/clientConfig";
import {
  ClientStatusBadge,
  operationalStatusFromClient,
} from "../config/clientStatusConfig";
import { clientsCopy } from "../copy/clientsCopy";
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
  const fromState = useListQueueFromState();

  const typeConfig = getClientTypeConfig(client.type);
  const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
  const TypeIcon = typeConfig.icon;
  const PaymentIcon = paymentConfig.icon;
  const contactPhone = client.primaryContact?.phone ?? client.phone;
  const contactEmail = client.primaryContact?.email ?? client.email;
  const contactName = client.primaryContact?.fullName;

  const handleClick = () => {
    navigate(`/clients/${client.id}`, { state: fromState });
  };

  return (
    <EntityListCard
      className={cn(!client.isActive && "opacity-60", className)}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {client.clientCode}
              </span>
              <ClientStatusBadge
                status={operationalStatusFromClient(client.isActive)}
                size="sm"
                className="text-xs"
              />
            </div>

            <h3 className="truncate text-base font-semibold leading-tight">
              {client.legalName}
            </h3>
            {client.tradeName ? (
              <p className="truncate text-sm text-muted-foreground">
                {client.tradeName}
              </p>
            ) : null}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <ClientActions
              client={client}
              variant="dropdown"
              menuTriggerClassName={entityListCardMenuTriggerClassName}
              menuAriaLabel={clientsCopy.card.actionsAria}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm">{client.taxId ?? "—"}</span>
          <Badge variant={typeConfig.variant} className="gap-1">
            <TypeIcon className="h-3 w-3" />
            {typeConfig.labelShort}
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          {contactName ? (
            <div className="truncate text-sm">{contactName}</div>
          ) : null}
          {contactPhone ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{contactPhone}</span>
            </div>
          ) : null}
          {contactEmail ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{contactEmail}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t pt-2">
          <div className="flex items-center gap-2">
            <Badge variant={paymentConfig.variant} className="gap-1">
              <PaymentIcon className="h-3 w-3" />
              {paymentConfig.labelShort}
            </Badge>
            {client.paymentTerms === "credit" ? (
              <span className="text-xs text-muted-foreground">
                {formatCreditDays(client.creditDays)}
              </span>
            ) : null}
          </div>
          {client.paymentTerms === "credit" && client.creditLimit ? (
            <span className="text-xs text-muted-foreground">
              {formatCreditLimit(client.creditLimit)}
            </span>
          ) : null}
        </div>
      </CardContent>
    </EntityListCard>
  );
}

export default ClientCard;
