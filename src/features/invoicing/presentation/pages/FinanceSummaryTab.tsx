import { useEffect } from "react";
import { Receipt } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Separator } from "@shared/ui/separator";
import { EmptyState } from "@shared/ui/feedback-states";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useFinanceSummary,
  useAccountStatement,
} from "@features/invoicing/application";
import { FinanceSummaryCards } from "../components";

function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface FinanceSummaryTabProps {
  queriesEnabled: boolean;
}

export function FinanceSummaryTab({ queriesEnabled }: FinanceSummaryTabProps) {
  const { toast } = useToast();
  const {
    data: summary,
    isLoading,
    isError: summaryError,
    error: summaryErr,
  } = useFinanceSummary({ enabled: queriesEnabled });
  const {
    data: statement,
    isLoading: stmtLoading,
    isError: stmtError,
    error: stmtErr,
  } = useAccountStatement({ enabled: queriesEnabled });

  useEffect(() => {
    if (summaryError && summaryErr) {
      toast({
        variant: "destructive",
        title: "Error al cargar resumen financiero",
        description: getErrorMessage(summaryErr),
      });
    }
  }, [summaryError, summaryErr, toast]);

  useEffect(() => {
    if (stmtError && stmtErr) {
      toast({
        variant: "destructive",
        title: "Error al cargar estado de cuenta",
        description: getErrorMessage(stmtErr),
      });
    }
  }, [stmtError, stmtErr, toast]);

  const rows = statement ?? [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold mb-3">Indicadores financieros</h2>
        <FinanceSummaryCards summary={summary} isLoading={isLoading} />
      </section>

      <Separator />

      <section>
        <h2 className="text-base font-semibold mb-3">
          Estado de cuenta por cliente
        </h2>
        {stmtLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-10 w-10 text-muted-foreground" />}
            title="Sin datos de cobranza"
            description="Aún no hay facturas timbradas con saldo para mostrar por cliente."
          />
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead className="text-right">Facturado</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Vencido</TableHead>
                  <TableHead className="text-right">Facturas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.clientRfc}>
                    <TableCell className="font-medium">
                      {row.clientName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {row.clientRfc}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMXN(row.totalInvoiced)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatMXN(row.totalPaid)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.balanceDue > 0 ? (
                        <span className="text-destructive">
                          {formatMXN(row.balanceDue)}
                        </span>
                      ) : (
                        <span className="text-success">
                          {formatMXN(0)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.overdueAmount > 0 ? (
                        <span className="text-destructive font-medium">
                          {formatMXN(row.overdueAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{row.invoiceCount}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
