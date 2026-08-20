/**
 * InvoiceCard
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tarjeta para mostrar información resumida de una factura.
 * Usada en la vista de cards del listado.
 *
 * Ubicación: src/features/invoicing/presentation/components/InvoiceCard.tsx
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  Eye,
  FileText,
  User,
  Calendar,
  CreditCard,
  Truck,
} from "lucide-react";
import {
  getInvoiceListItemDisplayAmounts,
  type InvoiceListItem,
} from "@features/invoicing/domain";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceActions } from "./InvoiceActions";
import { invoicingCopy } from "../copy/invoicingCopy";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceCardProps {
  invoice: InvoiceListItem;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceCard({ invoice, onView, onDelete }: InvoiceCardProps) {
  const folioCombined = `${invoice.serie}-${invoice.folio}`;

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onView(invoice.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Folio & Icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none font-mono">
                {folioCombined}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(invoice.issuedAt.split("T")[0])}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <InvoiceActions
              invoiceId={invoice.id}
              invoiceSerie={invoice.serie}
              invoiceFolio={invoice.folio}
              invoiceStatus={invoice.status}
              onView={onView}
              onDelete={onDelete}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Cliente */}
          <div className="col-span-2 flex items-start gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {invoice.receiverName}
              </p>
              <p className="text-xs truncate">{invoice.receiverRfc}</p>
            </div>
          </div>

          {/* Método de pago */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4 shrink-0" />
            <Badge variant="outline" className="text-xs">
              {invoice.paymentMethod}
            </Badge>
          </div>

          {/* Fecha */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="text-xs">
              {formatDate(invoice.issuedAt.split("T")[0])}
            </span>
          </div>

          {/* Viajes */}
          {invoice.tripCodes.length > 0 && (
            <div className="col-span-2 flex items-start gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {invoice.tripCodes.slice(0, 3).map((code) => (
                  <Badge key={code} variant="secondary" className="text-xs">
                    {code}
                  </Badge>
                ))}
                {invoice.tripCodes.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{invoice.tripCodes.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between gap-2">
          <InvoiceStatusBadge status={invoice.status} />

          <div className="flex items-center gap-3">
            {/* Importes */}
            <div className="text-right">
              <p className="font-semibold text-sm">{formatMxCurrency(invoice.total)}</p>
              {(() => {
                const { balanceDue, isPueSettled } =
                  getInvoiceListItemDisplayAmounts(invoice);
                return balanceDue > 0 ? (
                  <p className="text-xs text-destructive">
                    {invoicingCopy.detail.label.balance}:{" "}
                    {formatMxCurrency(balanceDue)}
                  </p>
                ) : (
                  <p className="text-xs text-success">
                    {isPueSettled
                      ? invoicingCopy.detail.label.listSettledPue
                      : invoicingCopy.detail.label.listSettled}
                  </p>
                );
              })()}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onView(invoice.id);
              }}
            >
              Ver
              <Eye className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
