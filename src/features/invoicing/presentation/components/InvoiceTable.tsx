/**
 * InvoiceTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tabla para listar facturas. Homologada con DriverTable y VehicleTable.
 *
 * Ubicación: src/features/invoicing/presentation/components/InvoiceTable.tsx
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  getInvoiceListItemDisplayAmounts,
  type InvoiceListItem,
} from "@features/invoicing/domain";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceActions } from "./InvoiceActions";
import { invoicingCopy } from "../copy/invoicingCopy";

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS = [
  { key: "folio", label: "Folio" },
  { key: "client", label: "Cliente" },
  { key: "date", label: "Fecha" },
  { key: "method", label: "Método" },
  { key: "total", label: "Total", className: "text-right" },
  { key: "balance", label: invoicingCopy.detail.label.balance, className: "text-right" },
  { key: "trips", label: "Viajes" },
  { key: "status", label: "Estado" },
  { key: "actions", label: "", className: "w-12" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {TABLE_HEADERS.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function EmptyState() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={TABLE_HEADERS.length} className="h-24 text-center">
          No se encontraron facturas.
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceTable({
  invoices,
  isLoading,
  onView,
  onDelete,
}: InvoiceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <EmptyState />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow />
        <TableBody>
          {invoices.map((inv) => (
            <TableRow
              key={inv.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(inv.id)}
            >
              {/* Folio */}
              <TableCell className="font-medium font-mono">
                {inv.serie}-{inv.folio}
              </TableCell>

              {/* Cliente */}
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{inv.receiverName}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.receiverRfc}
                  </p>
                </div>
              </TableCell>

              {/* Fecha */}
              <TableCell className="text-sm">
                {formatDate(inv.issuedAt.split("T")[0])}
              </TableCell>

              {/* Método de pago */}
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {inv.paymentMethod}
                </Badge>
              </TableCell>

              {/* Total */}
              <TableCell className="text-right font-medium">
                {formatMxCurrency(inv.total)}
              </TableCell>

              {/* Por cobrar */}
              <TableCell className="text-right">
                {(() => {
                  const { balanceDue, isPueSettled } =
                    getInvoiceListItemDisplayAmounts(inv);
                  return balanceDue > 0 ? (
                    <span className="text-destructive font-medium">
                      {formatMxCurrency(balanceDue)}
                    </span>
                  ) : (
                    <span className="text-success text-sm">
                      {isPueSettled
                        ? invoicingCopy.detail.label.listSettledPue
                        : invoicingCopy.detail.label.listSettled}
                    </span>
                  );
                })()}
              </TableCell>

              {/* Viajes */}
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {inv.tripCodes.slice(0, 2).map((code) => (
                    <Badge key={code} variant="secondary" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                  {inv.tripCodes.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{inv.tripCodes.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* Estado */}
              <TableCell>
                <InvoiceStatusBadge status={inv.status} />
              </TableCell>

              {/* Acciones */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <InvoiceActions
                  invoiceId={inv.id}
                  invoiceSerie={inv.serie}
                  invoiceFolio={inv.folio}
                  invoiceStatus={inv.status}
                  onView={onView}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
