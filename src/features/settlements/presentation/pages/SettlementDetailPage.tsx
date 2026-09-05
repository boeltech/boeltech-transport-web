import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Banknote,
  Route,
  Printer,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { escapeHtml } from "@shared/utils/escapeHtml";
import { usePrintIframe } from "@shared/hooks";

import { useSettlementDetail } from "../../application/hooks";
import {
  SETTLEMENTS_LIST_PATH,
  settlementCreatePath,
} from "../../application/settlementsRoutes";
import { useAuth } from "@features/auth";
import { useCompanySettings } from "@features/settings";
import {
  SettlementStatusBadge,
  SettlementItemsTable,
  SettlementReceiptPrintView,
  SettlementActions,
} from "../components";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  COMPENSATION_CALCULATION_TYPE_LABELS,
  COMPENSATION_SALARY_PERIOD_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  DISBURSEMENT_METHOD_LABELS,
  type CompensationSalaryPeriod,
  type TripRouteType,
} from "../../domain/enums";
import type { AgreementSnapshot } from "../../domain/entities";

const copy = settlementsCopy;

export function SettlementDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { triggerPrint, isPrinting } = usePrintIframe(printRef);

  useEffect(() => {
    if (printDialogOpen) {
      document.body.classList.add("print-receipt-active");
    } else {
      document.body.classList.remove("print-receipt-active");
    }
    return () => {
      document.body.classList.remove("print-receipt-active");
    };
  }, [printDialogOpen]);

  const { data: settlement, isLoading, refetch } = useSettlementDetail(id);

  const { user } = useAuth();
  const { data: companySettings } = useCompanySettings();

  const companyDisplayName =
    companySettings?.legalName ||
    companySettings?.tradeName ||
    user?.tenant?.name ||
    "Empresa de Transporte";

  const companyRfc = companySettings?.rfc || undefined;

  const handlePrint = () => {
    const title = `${escapeHtml(companyDisplayName)} - ${escapeHtml(settlement?.settlementNumber || "Liquidación")}`;
    triggerPrint(title);
  };

  const agreement = settlement?.agreementSnapshot as AgreementSnapshot | undefined;
  const isComposite = Boolean(
    agreement?.hasFixedSalary ||
      (agreement?.rules && agreement.rules.length > 0),
  );

  const rawCalcType = agreement?.calculationType;
  const calculationTypeLabel = isComposite
    ? copy.detailPage.tariff.compositeLabel
    : rawCalcType
      ? COMPENSATION_CALCULATION_TYPE_LABELS[rawCalcType] ?? String(rawCalcType)
      : "Sin acuerdo";

  const dCopy = copy.detailPage;
  const expandItemsByDefault =
    settlement?.status === "draft" || settlement?.status === "rejected";
  const isDisbursed = settlement?.status === "disbursed";

  const tripsCount =
    settlement?.items?.filter((it) => it.itemType === "trip_commission").length ?? 0;

  return (
    <>
      <DetailPageShell
        isLoading={isLoading}
        notFound={!settlement}
        notFoundConfig={{
          icon: <Banknote className="h-8 w-8 text-muted-foreground" />,
          title: "Liquidación no encontrada",
          description: "No se encontró la liquidación solicitada o no tienes permisos para consultarla.",
          backHref: SETTLEMENTS_LIST_PATH,
          backLabel: copy.actions.backToList,
        }}
        header={{
          backHref: SETTLEMENTS_LIST_PATH,
          backLabel: copy.actions.backToList,
          icon: <Banknote className="h-5 w-5 text-primary" />,
          title: settlement?.settlementNumber ?? "Liquidación",
          subtitle: settlement
            ? `${settlement.employeeFullName ?? "—"} · ${formatDate(settlement.periodStart)} – ${formatDate(settlement.periodEnd)}`
            : undefined,
          statusBadge: settlement ? <SettlementStatusBadge status={settlement.status} showIcon /> : undefined,
          actions: settlement ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintDialogOpen(true)}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir recibo</span>
              </Button>
              <SettlementActions
                variant="buttons"
                settlement={settlement}
                onActionComplete={() => {
                  void refetch();
                }}
              />
            </div>
          ) : undefined,
        }}
      >
        {settlement && (
          <div className="space-y-6">
            {/* D2: strip 3 celdas — grossAmount ya incluye reembolsos */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="p-4 sm:p-5 flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {dCopy.balanceStrip.grossEarnings}
                  </span>
                  <div className="mt-2">
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {formatMxCurrency(settlement.grossAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dCopy.balanceStrip.grossEarningsSubtext}
                      {tripsCount > 0 ? ` · ${tripsCount} viajes` : ""}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col justify-between bg-destructive/5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                    {dCopy.balanceStrip.advancesDeducted}
                  </span>
                  <div className="mt-2">
                    <p className="text-2xl font-bold tabular-nums text-destructive">
                      {settlement.totalAdvancesDeducted > 0
                        ? `-${formatMxCurrency(settlement.totalAdvancesDeducted)}`
                        : formatMxCurrency(0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dCopy.balanceStrip.advancesSubtext}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col justify-between bg-primary/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {dCopy.balanceStrip.netToPay}
                  </span>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-primary">
                      {formatMxCurrency(settlement.netAmount)}
                    </p>
                    <p className="text-xs font-medium text-foreground mt-0.5">
                      {dCopy.balanceStrip.netSubtext}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                {settlement.status === "rejected" && (
                  <div className="rounded-xl border bg-destructive/10 border-destructive/20 p-4 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{dCopy.rejection.title}</span>
                      </div>
                      <p className="text-foreground text-xs">
                        <span className="font-medium text-muted-foreground">{dCopy.rejection.reasonLabel} </span>
                        {settlement.rejectionReason || "Sin motivo especificado."}
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        navigate(
                          settlementCreatePath({
                            employeeId: settlement.employeeId,
                            periodStart: settlement.periodStart,
                            periodEnd: settlement.periodEnd,
                            from: settlement.id,
                          }),
                        )
                      }
                      className="shrink-0 gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {dCopy.rejection.reopenDraftBtn}
                    </Button>
                  </div>
                )}

                {/* D3: desglose colapsable según estado */}
                <Collapsible defaultOpen={expandItemsByDefault} className="group">
                  <Card>
                    <CardHeader className="pb-3">
                      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {dCopy.items.title}
                          </CardTitle>
                          <CardDescription>{dCopy.items.subtitle}</CardDescription>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <span className="group-data-[state=open]:hidden">{dCopy.items.expandLabel}</span>
                          <span className="hidden group-data-[state=open]:inline">{dCopy.items.collapseLabel}</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        </span>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        <SettlementItemsTable
                          items={settlement.items ?? []}
                          agreementCalculationType={settlement.agreementSnapshot.calculationType}
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {settlement.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">
                        {dCopy.notes.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground bg-muted/20 p-3 rounded-lg border whitespace-pre-wrap">
                        {settlement.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-4 space-y-4">
                {/* D5: timeline compacta */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">{dCopy.workflow.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <ol className="relative space-y-3 border-l border-border ml-1.5 pl-4">
                      <li className="relative">
                        <span
                          className={cn(
                            "absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-card",
                            "border-success text-success",
                          )}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                          {dCopy.workflow.step1}
                        </p>
                        <p className="text-xs font-semibold text-foreground truncate">
                          {settlement.submittedByName ?? settlement.createdByName ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {settlement.submittedAt || settlement.createdAt
                            ? formatDate(settlement.submittedAt || settlement.createdAt)
                            : "—"}
                        </p>
                      </li>

                      <li className="relative">
                        <span
                          className={cn(
                            "absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-card",
                            settlement.approvedByName
                              ? "border-success text-success"
                              : settlement.status === "rejected"
                                ? "border-destructive text-destructive"
                                : "border-muted-foreground/40 text-muted-foreground",
                          )}
                        >
                          {settlement.approvedByName ? (
                            <Check className="h-2.5 w-2.5" />
                          ) : settlement.status === "rejected" ? (
                            <X className="h-2.5 w-2.5" />
                          ) : null}
                        </span>
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                          {dCopy.workflow.step2}
                        </p>
                        <p className="text-xs font-semibold text-foreground truncate">
                          {settlement.approvedByName ??
                            (settlement.status === "rejected"
                              ? dCopy.rejection.title
                              : dCopy.workflow.pendingManagement)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {settlement.approvedAt
                            ? formatDate(settlement.approvedAt)
                            : dCopy.workflow.notApproved}
                        </p>
                      </li>

                      <li className="relative">
                        <span
                          className={cn(
                            "absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-card",
                            settlement.disbursedByName
                              ? "border-success text-success"
                              : "border-muted-foreground/40 text-muted-foreground",
                          )}
                        >
                          {settlement.disbursedByName ? <Check className="h-2.5 w-2.5" /> : null}
                        </span>
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                          {dCopy.workflow.step3}
                        </p>
                        {isDisbursed ? (
                          <div className="mt-0.5 space-y-1 text-xs">
                            <p className="font-semibold text-foreground truncate">
                              {settlement.disbursedByName ?? "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {settlement.disbursedAt ? formatDate(settlement.disbursedAt) : "—"}
                              {" · "}
                              {settlement.disbursementMethod
                                ? (DISBURSEMENT_METHOD_LABELS[settlement.disbursementMethod] ??
                                  settlement.disbursementMethod)
                                : "SPEI"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {dCopy.paymentInfo.reference}:{" "}
                              <span className="font-mono text-foreground">
                                {settlement.disbursementReference ?? "—"}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-foreground">
                              {dCopy.workflow.pendingDisbursement}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {dCopy.workflow.notDisbursed}
                            </p>
                          </>
                        )}
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* D4: acuerdo terciario colapsado */}
                <Collapsible defaultOpen={false} className="group">
                  <Card className="bg-muted/15 border-dashed">
                    <CardHeader className="pb-2">
                      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            {dCopy.tariff.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {dCopy.tariff.subtitle}
                          </CardDescription>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-3 text-xs pt-0">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{dCopy.tariff.scheme}</span>
                          <span className="font-semibold text-foreground">{calculationTypeLabel}</span>
                        </div>

                        {isComposite ? (
                          <div className="space-y-2 pt-2 border-t">
                            {Boolean(agreement?.hasFixedSalary) && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{dCopy.tariff.fixedSalary}</span>
                                <span className="font-semibold text-primary">
                                  {formatMxCurrency(agreement?.fixedSalaryAmount ?? 0)}{" "}
                                  <span className="text-[11px] text-muted-foreground font-normal">
                                    ({COMPENSATION_SALARY_PERIOD_LABELS[agreement?.fixedSalaryPeriod as CompensationSalaryPeriod] ?? "semanal"})
                                  </span>
                                </span>
                              </div>
                            )}

                            {agreement?.rules && agreement.rules.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <Route className="h-3 w-3" /> {dCopy.tariff.routesTitle}
                                </span>
                                <div className="space-y-1">
                                  {agreement.rules.map((rule, idx) => {
                                    const routeLabel =
                                      TRIP_ROUTE_TYPE_LABELS[rule.routeType as TripRouteType] ??
                                      rule.routeType;
                                    let ruleText = "Sin comisión";
                                    if (rule.commissionType === "rate_per_km") {
                                      ruleText = `${formatMxCurrency(rule.rateValue)} / km`;
                                    } else if (rule.commissionType === "percentage_of_freight") {
                                      ruleText = `${rule.rateValue}% sobre flete`;
                                    } else if (rule.commissionType === "fixed_per_trip") {
                                      ruleText = `${formatMxCurrency(rule.rateValue)} por viaje`;
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0"
                                      >
                                        <span className="font-medium text-foreground">{routeLabel}:</span>
                                        <span className="text-primary font-semibold tabular-nums">
                                          {ruleText}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5 pt-2 border-t">
                            {agreement?.ratePerKm ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.ratePerKm}</span>
                                <span className="font-medium text-foreground">
                                  {formatMxCurrency(agreement.ratePerKm)} / km
                                </span>
                              </div>
                            ) : null}
                            {agreement?.percentageRate ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.percentageRate}</span>
                                <span className="font-medium text-foreground">
                                  {agreement.percentageRate}%
                                </span>
                              </div>
                            ) : null}
                            {agreement?.baseRate ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.fixedPerTrip}</span>
                                <span className="font-medium text-foreground">
                                  {formatMxCurrency(agreement.baseRate)}
                                </span>
                              </div>
                            ) : null}
                            {agreement?.helperDailyRate ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.helperDailyRate}</span>
                                <span className="font-medium text-foreground">
                                  {formatMxCurrency(agreement.helperDailyRate)} / día
                                </span>
                              </div>
                            ) : null}
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-dashed">
                          {dCopy.tariff.disclaimer}
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </div>
          </div>
        )}
      </DetailPageShell>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 print:border-none print:shadow-none">
          <DialogHeader className="p-4 border-b print:hidden">
            <div className="flex justify-between items-center pr-6">
              <div>
                <DialogTitle>Recibo de liquidación</DialogTitle>
                <DialogDescription>
                  Vista previa para impresión y firma del operador.
                </DialogDescription>
              </div>
              <Button onClick={handlePrint} disabled={isPrinting} className="gap-1.5">
                <Printer className="h-4 w-4" />
                <span>{isPrinting ? "Preparando..." : "Imprimir"}</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="p-4 bg-muted/10">
            {settlement && (
              <SettlementReceiptPrintView
                ref={printRef}
                settlement={settlement}
                companyName={companyDisplayName}
                rfc={companyRfc}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
