/**
 * DriverAdvancesTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar anticipos y viáticos entregados a choferes.
 * Homologado con DriverTable.
 *
 * Ubicación: src/features/settlements/presentation/components/DriverAdvancesTable.tsx
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverAdvance } from "../../domain/entities";
import {
  ADVANCE_CATEGORY_LABELS,
  type AdvanceCategory,
} from "../../domain/enums";
import { AdvanceStatusBadge } from "./SettlementStatusBadge";
import { AdvanceActions } from "./AdvanceActions";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy;

// ============================================================================
// TYPES
// ============================================================================

interface DriverAdvancesTableProps {
  advances: DriverAdvance[];
  isLoading: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS = [
  { key: "folio", label: copy.fields.folio, className: "min-w-[130px]" },
  { key: "employee", label: copy.fields.employee, className: "min-w-[160px]" },
  { key: "category", label: copy.fields.category, className: "min-w-[130px]" },
  { key: "paymentMethod", label: copy.fields.paymentMethod, className: "min-w-[160px]" },
  { key: "amount", label: copy.fields.amount, className: "text-right min-w-[120px]" },
  { key: "balanceRemaining", label: copy.fields.balanceRemaining, className: "text-right min-w-[130px] font-semibold text-foreground" },
  { key: "deliveryDate", label: copy.fields.deliveryDate, className: "min-w-[120px]" },
  { key: "status", label: copy.fields.status, className: "min-w-[110px]" },
  { key: "actions", label: "", className: "w-12 text-right" },
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
            <Skeleton className="h-4 w-28 font-mono" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-20 ml-auto" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-20 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 ml-auto" />
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
        <TableCell colSpan={TABLE_HEADERS.length} className="h-24 text-center text-muted-foreground text-sm">
          {copy.empty.advances}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverAdvancesTable({ advances, isLoading }: DriverAdvancesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label="Listado de anticipos y viáticos">
          <TableHeaderRow />
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (advances.length === 0) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label="Listado de anticipos y viáticos">
          <TableHeaderRow />
          <EmptyState />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table aria-label="Listado de anticipos y viáticos">
        <TableHeaderRow />
        <TableBody>
          {advances.map((adv) => {
            const catLabel =
              ADVANCE_CATEGORY_LABELS[adv.category as AdvanceCategory] ??
              adv.category;
            return (
              <TableRow key={adv.id} className="hover:bg-muted/50 transition-colors">
                {/* Folio */}
                <TableCell className="font-semibold text-primary font-mono whitespace-nowrap">
                  {adv.folio}
                </TableCell>

                {/* Operador / Viaje */}
                <TableCell className="font-medium whitespace-nowrap">
                  <div>{adv.employeeFullName ?? "—"}</div>
                  {adv.tripCode ? (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Viaje: {adv.tripCode}
                    </p>
                  ) : null}
                </TableCell>

                {/* Categoría */}
                <TableCell className="whitespace-nowrap">{catLabel}</TableCell>

                {/* Método / Referencia */}
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <span>{adv.paymentMethod}</span>
                  {adv.bankReference ? (
                    <span className="text-xs text-muted-foreground font-mono ml-1">
                      ({adv.bankReference})
                    </span>
                  ) : null}
                </TableCell>

                {/* Monto entregado */}
                <TableCell className="text-right tabular-nums font-medium whitespace-nowrap">
                  {formatMxCurrency(adv.amount)}
                </TableCell>

                {/* Saldo restante */}
                <TableCell className="text-right tabular-nums font-bold text-primary whitespace-nowrap">
                  {formatMxCurrency(adv.balanceRemaining)}
                </TableCell>

                {/* Fecha entrega */}
                <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                  {adv.disbursedAt ? formatDate(adv.disbursedAt) : "—"}
                </TableCell>

                {/* Estado */}
                <TableCell className="whitespace-nowrap">
                  <AdvanceStatusBadge status={adv.status} showIcon size="sm" />
                </TableCell>

                {/* Acciones */}
                <TableCell className="w-12 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <AdvanceActions advance={adv} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
