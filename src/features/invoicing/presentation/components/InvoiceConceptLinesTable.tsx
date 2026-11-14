/**
 * InvoiceConceptLinesTable — conceptos del detalle/editor de factura (`EntityListTable`).
 *
 * Tipo · Descripción(+clave) · Cantidad · Importe · Acciones.
 * Empty = EmptyState del editor (host no aporta empty). density compact · framed false.
 */

import { Edit2, Receipt, Trash2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  isServiceOnlyBillingScope,
  type InvoiceBillingScope,
} from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceConceptFormLine } from "../validation/invoiceFormSchema";

const copy = invoicingCopy.concepts;
const tableCopy = copy.detailTable;

export type InvoiceConceptLineRow = InvoiceConceptFormLine & { id?: string };

type ConceptLineRow = InvoiceConceptLineRow & { _index: number };

export interface InvoiceConceptLinesTableProps {
  lines: InvoiceConceptLineRow[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  errorIndices?: Set<number>;
  billingScope?: InvoiceBillingScope;
}

function buildColumns(
  onEdit: (index: number) => void,
  onRemove: (index: number) => void,
): EntityListColumnDef<ConceptLineRow>[] {
  return [
    {
      id: "type",
      header: tableCopy.type,
      kind: "status",
      accessor: (line) => {
        const isFlete = line.concept_type === "flete";
        return (
          <Badge variant={isFlete ? "default" : "secondary"} className="text-xs">
            {isFlete ? tableCopy.flete : tableCopy.service}
          </Badge>
        );
      },
    },
    {
      id: "description",
      header: tableCopy.description,
      kind: "stacked",
      accessor: (line): EntityListStackedValue => ({
        primary: (
          <span className="whitespace-normal break-words">
            {line.description || "—"}
          </span>
        ),
        secondary: (
          <span className="font-mono">{line.clave_prod_serv}</span>
        ),
      }),
    },
    {
      id: "quantity",
      header: tableCopy.quantity,
      kind: "meta",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (line) =>
        tableCopy.qtyUnitSummary(
          line.quantity,
          formatMxCurrency(line.unit_price),
        ),
    },
    {
      id: "amount",
      header: tableCopy.amount,
      kind: "money",
      accessor: (line) => line.amount ?? 0,
    },
    {
      id: "actions",
      header: tableCopy.actions,
      kind: "actions",
      accessor: (line) => {
        const isFlete = line.concept_type === "flete";
        return (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(line._index)}
              aria-label={tableCopy.edit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {!isFlete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(line._index)}
                aria-label={copy.removeConcept}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];
}

export function InvoiceConceptLinesTable({
  lines,
  onEdit,
  onRemove,
  errorIndices,
  billingScope = "primary_transport",
}: InvoiceConceptLinesTableProps) {
  const isServiceOnly = isServiceOnlyBillingScope(billingScope);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
        title={copy.emptyTitle}
        description={
          billingScope === "false_trip"
            ? copy.table.emptyDescriptionFalseTrip
            : isServiceOnly
              ? copy.table.emptyDescriptionAccessory
              : copy.table.emptyDescription
        }
        size="sm"
      />
    );
  }

  const rows: ConceptLineRow[] = lines.map((line, index) => ({
    ...line,
    _index: index,
  }));

  return (
    <EntityListTable
      framed={false}
      density="compact"
      columns={buildColumns(onEdit, onRemove)}
      rows={rows}
      getRowId={(row) => row.id ?? `concept-${row._index}`}
      getRowClassName={(row) =>
        errorIndices?.has(row._index) ? "bg-destructive/5" : undefined
      }
      aria-label={tableCopy.type}
    />
  );
}
