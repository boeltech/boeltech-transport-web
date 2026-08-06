import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useToast } from "@shared/hooks";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { usePlatformTenantSaasInvoices } from "../../application/hooks/usePlatformSaasAr";
import { platformApi } from "../../infrastructure/platformApi";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";
import {
  getLastClosedMexicoCityPeriodKey,
  isClosedBillingPeriodKey,
  isValidBillingPeriodKey,
} from "../utils/billingPeriod";
import { formatDate } from "@shared/utils/dateUtils";
import { IssueSaasInvoiceSheet } from "./IssueSaasInvoiceSheet";
import { MarkSaasInvoicePaidSheet } from "./MarkSaasInvoicePaidSheet";
import { VoidSaasInvoiceDialog } from "./VoidSaasInvoiceDialog";

interface TenantSaasArCardProps {
  tenantId: string;
  tenantLabel?: string;
  canMutate: boolean;
  /** Export CSV cierre (owner + support). Default true. */
  canExport?: boolean;
}

export function TenantSaasArCard({
  tenantId,
  tenantLabel,
  canMutate,
  canExport = true,
}: TenantSaasArCardProps) {
  const copy = platformCopy.ar;
  const { toast } = useToast();
  const lastClosed = getLastClosedMexicoCityPeriodKey();
  const { data: invoices = [], isLoading } =
    usePlatformTenantSaasInvoices(tenantId);

  const [issueOpen, setIssueOpen] = useState(false);
  const [closePeriodKey, setClosePeriodKey] = useState(lastClosed);
  const [exporting, setExporting] = useState(false);
  const [payInvoice, setPayInvoice] = useState<PlatformSaasInvoice | null>(
    null,
  );
  const [voidInvoice, setVoidInvoice] = useState<PlatformSaasInvoice | null>(
    null,
  );

  const openCount = useMemo(
    () => invoices.filter((i) => i.status === "open").length,
    [invoices],
  );

  const handleExportClose = async () => {
    const periodKey = closePeriodKey.trim();
    if (!isValidBillingPeriodKey(periodKey)) {
      toast({
        title: copy.card.exportCloseError,
        description: copy.card.exportCloseInvalidPeriod,
        variant: "destructive",
      });
      return;
    }
    if (!isClosedBillingPeriodKey(periodKey)) {
      toast({
        title: copy.card.exportCloseError,
        description: copy.card.exportCloseNotClosed,
        variant: "destructive",
      });
      return;
    }
    setExporting(true);
    try {
      await platformApi.downloadTenantReconciliationCsv(tenantId, periodKey);
      toast({ title: copy.card.exportCloseSuccess, variant: "success" });
    } catch (error) {
      toast({
        title: copy.card.exportCloseError,
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">{copy.card.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.card.description}
            </p>
            {openCount > 0 ? (
              <Badge variant="warning" className="mt-2">
                {copy.card.openBadge(openCount)}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link
                to={`/platform/billing/ar?status=open&tenant_id=${tenantId}`}
              >
                {copy.actions.viewAr}
              </Link>
            </Button>
            {canMutate ? (
              <Button size="sm" onClick={() => setIssueOpen(true)}>
                {copy.actions.issue}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {canExport ? (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">{copy.card.closeExportTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {copy.card.closeExportDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`close-period-${tenantId}`}>
                    {copy.card.closePeriodLabel}
                  </Label>
                  <Input
                    id={`close-period-${tenantId}`}
                    className="w-[130px]"
                    placeholder={copy.card.closePeriodPlaceholder}
                    value={closePeriodKey}
                    onChange={(e) => setClosePeriodKey(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={exporting}
                  onClick={() => void handleExportClose()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {copy.card.exportClose}
                </Button>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.card.empty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.columns.period}</TableHead>
                  <TableHead>{copy.columns.status}</TableHead>
                  <TableHead>{copy.columns.total}</TableHead>
                  <TableHead>{copy.columns.dueAndOverdue}</TableHead>
                  {canMutate ? (
                    <TableHead>{copy.columns.actions}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const isOverdue =
                    invoice.status === "open" && invoice.daysOverdue > 0;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {formatBillingPeriodKey(invoice.periodKey)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone="soft"
                          variant={
                            invoice.status === "open"
                              ? "warning"
                              : invoice.status === "paid"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {copy.status[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatBillingPriceCents(invoice.totalCents)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {invoice.dueDate
                              ? formatDate(invoice.dueDate)
                              : "—"}
                          </span>
                          {isOverdue ? (
                            <Badge
                              tone="soft"
                              variant="warning"
                              className="w-fit"
                            >
                              {copy.card.daysOverdue(invoice.daysOverdue)}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      {canMutate ? (
                        <TableCell>
                          {invoice.status === "open" ? (
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                onClick={() => setPayInvoice(invoice)}
                              >
                                {copy.actions.markPaid}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setVoidInvoice(invoice)}
                              >
                                {copy.actions.void}
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IssueSaasInvoiceSheet
        tenantId={tenantId}
        tenantLabel={tenantLabel}
        open={issueOpen}
        onOpenChange={setIssueOpen}
        defaultPeriodKey={
          isValidBillingPeriodKey(closePeriodKey.trim()) &&
          isClosedBillingPeriodKey(closePeriodKey.trim())
            ? closePeriodKey.trim()
            : lastClosed
        }
      />
      <MarkSaasInvoicePaidSheet
        invoice={payInvoice}
        open={!!payInvoice}
        onOpenChange={(open) => {
          if (!open) setPayInvoice(null);
        }}
      />
      <VoidSaasInvoiceDialog
        invoice={voidInvoice}
        open={!!voidInvoice}
        onOpenChange={(open) => {
          if (!open) setVoidInvoice(null);
        }}
      />
    </>
  );
}
