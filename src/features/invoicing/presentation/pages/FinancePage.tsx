import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  X,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Card, CardContent } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
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
import { cn } from "@shared/lib/utils/cn";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useInvoices,
  useFinanceSummary,
  useAccountStatement,
} from "@features/invoicing/application";
import type { InvoiceFilters, InvoiceStatus } from "@features/invoicing/domain";
import { FinanceSummaryCards, InvoiceTable } from "../components";

// ============================================================================
// HELPERS
// ============================================================================

function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ============================================================================
// SUB-COMPONENTS — SUMMARY TAB
// ============================================================================


function SummaryTab() {
  const { toast } = useToast();
  const {
    data: summary,
    isLoading,
    isError: summaryError,
    error: summaryErr,
  } = useFinanceSummary();
  const {
    data: statement,
    isLoading: stmtLoading,
    isError: stmtError,
    error: stmtErr,
  } = useAccountStatement();

  useEffect(() => {
    if (summaryError && summaryErr) {
      toast({
        variant: "destructive",
        title: "Error al cargar resumen financiero",
        description: getErrorMessage(summaryErr),
      });
    }
  }, [summaryError, summaryErr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stmtError && stmtErr) {
      toast({
        variant: "destructive",
        title: "Error al cargar estado de cuenta",
        description: getErrorMessage(stmtErr),
      });
    }
  }, [stmtError, stmtErr]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div>
        <h3 className="text-base font-semibold mb-3">Indicadores financieros</h3>
        <FinanceSummaryCards summary={summary} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Estado de cuenta por cliente */}
      <div>
        <h3 className="text-base font-semibold mb-3">
          Estado de cuenta por cliente
        </h3>
        {stmtLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
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
                {(statement ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin datos de cobranza
                    </TableCell>
                  </TableRow>
                ) : (
                  (statement ?? []).map((row) => (
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
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatMXN(row.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.balanceDue > 0 ? (
                          <span className="text-destructive">
                            {formatMXN(row.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS — INVOICES TAB
// ============================================================================

/** Mini-cards de resumen sobre la tabla de facturas */
function InvoicesSummaryCards({
  stamped,
  draft,
  cancellationPending,
  cancelled,
  totalReceivable,
  isLoading,
  onFilterStatus,
}: {
  stamped: number;
  draft: number;
  cancellationPending: number;
  cancelled: number;
  totalReceivable: number;
  isLoading: boolean;
  onFilterStatus: (status: InvoiceStatus) => void;
}) {
  const cards = [
    {
      label: "Timbradas",
      value: stamped,
      type: "count" as const,
      icon: CheckCircle2,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-600 dark:text-green-400",
      status: "stamped" as InvoiceStatus,
    },
    {
      label: "Borradores",
      value: draft,
      type: "count" as const,
      icon: Clock,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      valueColor: "text-yellow-600 dark:text-yellow-400",
      status: "draft" as InvoiceStatus,
    },
    {
      label: "Por cobrar",
      value: totalReceivable,
      type: "currency" as const,
      icon: DollarSign,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
      status: "stamped" as InvoiceStatus,
    },
    {
      label: "Cancelación pendiente",
      value: cancellationPending,
      type: "count" as const,
      icon: Clock,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-orange-600 dark:text-orange-400",
      status: "cancellation_pending" as InvoiceStatus,
    },
    {
      label: "Canceladas",
      value: cancelled,
      type: "count" as const,
      icon: XCircle,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-muted-foreground",
      status: "cancelled" as InvoiceStatus,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
            onClick={() => onFilterStatus(card.status)}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </p>
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    card.iconBg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", card.iconColor)} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className={cn("text-xl font-bold", card.valueColor)}>
                  {card.type === "currency"
                    ? formatMXN(card.value)
                    : card.value}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {card.type === "currency" ? "Saldo pendiente" : "facturas"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function InvoicesTab({
  initialStatus,
  onStatusChange,
}: {
  initialStatus?: InvoiceStatus;
  onStatusChange?: (status?: InvoiceStatus) => void;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  useEffect(() => {
    setStatus(initialStatus ?? "");
    setPage(1);
  }, [initialStatus]);

  const [page, setPage] = useState(1);

  const filters: InvoiceFilters = {
    search: search || undefined,
    status: status || undefined,
    page,
    limit: 20,
  };

  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useInvoices(filters);
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary();

  const hasActiveFilter = !!status || !!search;

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: "destructive",
        title: "Error al cargar facturas",
        description: getErrorMessage(error),
      });
    }
  }, [isError, error]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterStatus = (s: InvoiceStatus) => {
    setStatus((prev) => {
      const next = prev === s ? "" : s;
      onStatusChange?.(next || undefined);
      return next;
    });
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <InvoicesSummaryCards
        stamped={summary?.invoicesByStatus.stamped ?? 0}
        draft={summary?.invoicesByStatus.draft ?? 0}
        cancellationPending={summary?.invoicesByStatus.cancellationPending ?? 0}
        cancelled={summary?.invoicesByStatus.cancelled ?? 0}
        totalReceivable={summary?.totalReceivable ?? 0}
        isLoading={summaryLoading}
        onFilterStatus={handleFilterStatus}
      />

      <Separator />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por cliente, RFC, folio..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status || "all"}
            onValueChange={(v) => {
              const next = v === "all" ? "" : (v as InvoiceStatus);
              setStatus(next);
              onStatusChange?.(next || undefined);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="stamped">Timbrada</SelectItem>
              <SelectItem value="cancellation_pending">
                Cancelación pendiente
              </SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Active filter badge */}
          {hasActiveFilter && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => {
                setStatus("");
                setSearch("");
                onStatusChange?.(undefined);
                setPage(1);
              }}
            >
              {status
                ? status === "draft"
                  ? "Borrador"
                  : status === "stamped"
                    ? "Timbrada"
                    : status === "cancellation_pending"
                      ? "Cancelación pendiente"
                      : "Cancelada"
                : `"${search}"`}
              <X className="h-3 w-3" />
            </Badge>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/trips")}
            title="La creación de factura se realiza desde un viaje completado"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear desde viaje
          </Button>
        </div>
      </div>

      {/* Results summary */}
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.pagination.total === 0
            ? "No se encontraron facturas"
            : <>
                Mostrando{" "}
                <span className="font-medium">
                  {(page - 1) * data.pagination.limit + 1}–
                  {Math.min(page * data.pagination.limit, data.pagination.total)}
                </span>{" "}
                de{" "}
                <span className="font-medium">{data.pagination.total}</span>{" "}
                facturas
              </>
          }
        </p>
      )}

      {/* Table */}
      <InvoiceTable
        invoices={data?.data ?? []}
        isLoading={isLoading}
        onView={(id) => navigate(`/invoices/${id}`, { state: { from: "/finance?tab=invoices" } })}
      />

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>
            Página {page} de {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") ?? "summary";
  const statusFromParams = searchParams.get("status");
  const initialStatus =
    statusFromParams === "draft" ||
    statusFromParams === "stamped" ||
    statusFromParams === "cancellation_pending" ||
    statusFromParams === "cancelled"
      ? statusFromParams
      : undefined;

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", value);
      return params;
    });
  };

  const handleStatusChange = (status?: InvoiceStatus) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (status) {
        params.set("status", status);
      } else {
        params.delete("status");
      }
      return params;
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground text-sm">
            Cobranza, facturación CFDI y estado de cuenta
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <SummaryTab />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoicesTab
            initialStatus={initialStatus}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
