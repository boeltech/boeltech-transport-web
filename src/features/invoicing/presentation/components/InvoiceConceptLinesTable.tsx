import { Edit2, Receipt, Trash2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { InvoiceBillingScope } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceConceptFormLine } from "../validation/invoiceFormSchema";

const copy = invoicingCopy.concepts;
const tableCopy = copy.detailTable;

export type InvoiceConceptLineRow = InvoiceConceptFormLine & { id?: string };

export interface InvoiceConceptLinesTableProps {
  lines: InvoiceConceptLineRow[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  errorIndices?: Set<number>;
  billingScope?: InvoiceBillingScope;
}

function countServiceLinesBefore(lines: InvoiceConceptFormLine[], index: number): number {
  return lines.slice(0, index).filter((line) => line.concept_type === "service").length;
}

function getRowLabel(line: InvoiceConceptFormLine, index: number, lines: InvoiceConceptFormLine[]): string {
  if (line.concept_type === "flete") return copy.fleteRowTitle;
  return copy.serviceRowTitle(countServiceLinesBefore(lines, index) + 1);
}

export function InvoiceConceptLinesTable({
  lines,
  onEdit,
  onRemove,
  errorIndices,
  billingScope = "primary_transport",
}: InvoiceConceptLinesTableProps) {
  const isAccessory = billingScope === "accessory";
  const serviceOnlyCount = lines.filter((l) => l.concept_type === "service").length;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
        title={isAccessory ? copy.emptyAccessoryTitle : copy.fleteRowTitle}
        description={
          isAccessory ? copy.table.emptyDescriptionAccessory : copy.table.emptyDescription
        }
        size="sm"
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tableCopy.type}</TableHead>
              <TableHead>{tableCopy.description}</TableHead>
              <TableHead className="text-right">{tableCopy.quantity}</TableHead>
              <TableHead className="text-right">{tableCopy.amount}</TableHead>
              <TableHead className="w-[100px] text-right">{tableCopy.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => {
              const isFlete = line.concept_type === "flete";
              const hasError = errorIndices?.has(index);
              return (
                <TableRow
                  key={line.id ?? `concept-${index}`}
                  className={cn(hasError && "bg-destructive/5")}
                >
                  <TableCell>
                    <Badge variant={isFlete ? "default" : "secondary"} className="text-xs">
                      {isFlete ? tableCopy.flete : tableCopy.service}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <p className="truncate text-sm">{line.description || "—"}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {line.clave_prod_serv}
                    </p>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {tableCopy.qtyUnitSummary(
                      line.quantity,
                      formatMxCurrency(line.unit_price),
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMxCurrency(line.amount ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(index)}
                        aria-label={tableCopy.edit}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!isFlete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(index)}
                          aria-label={copy.removeService}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile compact rows */}
      <div className="divide-y md:hidden">
        {lines.map((line, index) => {
          const isFlete = line.concept_type === "flete";
          const hasError = errorIndices?.has(index);
          const rowLabel = getRowLabel(line, index, lines);
          return (
            <div
              key={line.id ?? `concept-mobile-${index}`}
              className={cn(
                "flex items-start gap-3 py-3",
                hasError && "rounded-md bg-destructive/5 px-2",
              )}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{rowLabel}</p>
                  <Badge variant={isFlete ? "default" : "secondary"} className="text-xs">
                    {isFlete ? tableCopy.flete : tableCopy.service}
                  </Badge>
                </div>
                <p className="truncate text-sm">{line.description || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {tableCopy.qtyUnitSummary(
                    line.quantity,
                    formatMxCurrency(line.unit_price),
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-sm font-medium tabular-nums">
                  {formatMxCurrency(line.amount ?? 0)}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(index)}
                    aria-label={tableCopy.edit}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!isFlete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(index)}
                      aria-label={copy.removeService}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {serviceOnlyCount === 0 &&
      !isAccessory &&
      lines.some((l) => l.concept_type === "flete") ? (
        <p className="mt-2 text-xs text-muted-foreground">{copy.table.emptyDescription}</p>
      ) : null}
    </>
  );
}
