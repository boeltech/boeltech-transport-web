import { Receipt } from "lucide-react";
import type { InvoiceConcept } from "@features/invoicing/domain";
import { Badge } from "@shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.concepts.detailTable;
const detailCopy = invoicingCopy.detail;

type InvoiceDetailConceptsCardProps = {
  concepts: InvoiceConcept[];
};

export function InvoiceDetailConceptsCard({
  concepts,
}: InvoiceDetailConceptsCardProps) {
  if (concepts.length === 0) {
    return null;
  }

  const subtotal = concepts.reduce((sum, line) => sum + line.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden />
          {invoicingCopy.section.concepts}
        </CardTitle>
        <CardDescription>
          {detailCopy.hint.conceptsSummary(concepts.length, formatMxCurrency(subtotal))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.type}</TableHead>
                <TableHead>{copy.clave}</TableHead>
                <TableHead>{copy.description}</TableHead>
                <TableHead className="text-right">{copy.quantity}</TableHead>
                <TableHead className="text-right">{copy.amount}</TableHead>
                <TableHead className="text-right">{copy.iva}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concepts.map((line, index) => {
                const isFlete = line.conceptType === "flete";

                return (
                  <TableRow key={line.id ?? `${line.conceptType}-${index}`}>
                    <TableCell>
                      <Badge
                        variant={isFlete ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {isFlete ? copy.flete : copy.service}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {line.claveProdServ}
                    </TableCell>
                    <TableCell className="max-w-[360px]">
                      <p className="truncate">{line.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.claveUnidad} · {line.unidad}
                      </p>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {copy.qtyUnitSummary(
                        line.quantity,
                        formatMxCurrency(line.unitPrice),
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMxCurrency(line.amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.ivaAmount != null ? formatMxCurrency(line.ivaAmount) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y md:hidden">
          {concepts.map((line, index) => {
            const isFlete = line.conceptType === "flete";

            return (
              <div
                key={line.id ?? `${line.conceptType}-mobile-${index}`}
                className="flex items-start gap-3 py-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={isFlete ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {isFlete ? copy.flete : copy.service}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {line.claveProdServ}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium">{line.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {copy.qtyUnitSummary(
                      line.quantity,
                      formatMxCurrency(line.unitPrice),
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {copy.iva}:{" "}
                    {line.ivaAmount != null ? formatMxCurrency(line.ivaAmount) : "—"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatMxCurrency(line.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
