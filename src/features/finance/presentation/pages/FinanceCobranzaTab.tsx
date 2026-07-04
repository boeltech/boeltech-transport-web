import { useMemo, useState, type ReactNode } from "react";
import { getTodayMexicoDateString } from "@boeltech/cfdi-domain";
import {
  CheckCircle2,
  CircleDollarSign,
  FileText,
  ReceiptText,
  Search,
  Send,
} from "lucide-react";
import {
  useOpenPpdInvoices,
  useRegisterFinancePayment,
} from "@features/finance/application/hooks/useFinancePayments";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import type { RegisterFinancePaymentPayload } from "@features/finance/infrastructure/financePaymentsApi";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useToast } from "@shared/hooks";
import { ApiError, getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceChainRepairConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  const copy = financeCopy.cobranza.chainRepair;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </Button>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            {isPending ? financeCopy.cobranza.submitting : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceCobranzaTab() {
  const copy = financeCopy.cobranza;
  const { toast } = useToast();
  const [receiverRfc, setReceiverRfc] = useState("");
  const [searchRfc, setSearchRfc] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chainRepairOpen, setChainRepairOpen] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<RegisterFinancePaymentPayload | null>(null);

  const { data, isLoading, isError } = useOpenPpdInvoices(searchRfc);
  const invoices = useMemo(() => data?.data ?? [], [data]);

  const selectedInvoices = useMemo(
    () => invoices.filter((inv) => selected[inv.id]),
    [invoices, selected],
  );

  const selectedTotal = useMemo(
    () =>
      selectedInvoices.reduce(
        (sum, inv) => sum + Number(inv.balanceDue.toFixed(2)),
        0,
      ),
    [selectedInvoices],
  );

  const openBalance = useMemo(
    () => invoices.reduce((sum, inv) => sum + Number(inv.balanceDue.toFixed(2)), 0),
    [invoices],
  );

  const { mutate, isPending } = useRegisterFinancePayment({
    onSuccess: () => {
      toast({ title: copy.toastSuccess });
      setSheetOpen(false);
      setChainRepairOpen(false);
      setPendingPayload(null);
      setSelected({});
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "CHAIN_REORDER_REQUIRED") {
        setChainRepairOpen(true);
        return;
      }
      toast({
        variant: "destructive",
        title: copy.toastError,
        description: getErrorMessage(err),
      });
    },
  });

  const toggleInvoice = (invoice: FinanceInvoiceListItem, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [invoice.id]: checked }));
  };

  const buildPayload = (
    confirmChainRepair?: boolean,
  ): RegisterFinancePaymentPayload | null => {
    if (!searchRfc || selectedInvoices.length === 0) return null;
    const allocations = selectedInvoices.map((inv) => ({
      ingressInvoiceId: inv.id,
      amount: Number(inv.balanceDue.toFixed(2)),
    }));
    const amount = allocations.reduce((sum, a) => sum + a.amount, 0);
    return {
      receiverRfc: searchRfc,
      amount,
      currency: "MXN",
      exchangeRate: 1,
      paymentDate: getTodayMexicoDateString(),
      paymentTime: "12:00:00",
      paymentForm: "03",
      allocations,
      confirmChainRepair,
    };
  };

  const submitPayload = (payload: RegisterFinancePaymentPayload) => {
    setPendingPayload(payload);
    mutate(payload);
  };

  const handleRegister = () => {
    const payload = buildPayload();
    if (!payload) return;
    submitPayload(payload);
  };

  const handleSearch = () => {
    setSelected({});
    setSearchRfc(receiverRfc.trim() || null);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{copy.hero.badge}</Badge>
              <Badge variant="outline">{copy.hero.secondaryBadge}</Badge>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{copy.hero.title}</h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {copy.hero.description}
              </p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              {copy.hero.steps.map((step, index) => (
                <div key={step.title} className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {copy.hero.stepPrefix(index + 1)}
                  </p>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/5 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" aria-hidden />
                {copy.searchCard.title}
              </CardTitle>
              <CardDescription>{copy.searchCard.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1">
                  <label className="text-sm font-medium" htmlFor="receiver-rfc">
                    {copy.receiverRfcLabel}
                  </label>
                  <Input
                    id="receiver-rfc"
                    value={receiverRfc}
                    onChange={(e) => setReceiverRfc(e.target.value.toUpperCase())}
                    placeholder="XAXX010101000"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSearch}
                  disabled={!receiverRfc.trim()}
                  className="sm:w-auto"
                >
                  {copy.search}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {searchRfc ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<FileText className="h-4 w-4" aria-hidden />}
            label={copy.metrics.openInvoices}
            value={String(invoices.length)}
            hint={copy.metrics.forRfc(searchRfc)}
          />
          <MetricCard
            icon={<CircleDollarSign className="h-4 w-4" aria-hidden />}
            label={copy.metrics.openBalance}
            value={formatMxCurrency(openBalance)}
            hint={copy.metrics.pendingPpd}
          />
          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
            label={copy.metrics.selectedInvoices}
            value={String(selectedInvoices.length)}
            hint={copy.metrics.readyToApply}
          />
          <MetricCard
            icon={<ReceiptText className="h-4 w-4" aria-hidden />}
            label={copy.metrics.selectedTotal}
            value={formatMxCurrency(selectedTotal)}
            hint={copy.metrics.repHint}
          />
        </div>
      ) : null}

      {isLoading ? (
        <AlertWithIcon variant="info" title={copy.loadingTitle}>
          {copy.loading}
        </AlertWithIcon>
      ) : null}
      {isError ? (
        <AlertWithIcon variant="destructive" title={copy.loadErrorTitle}>
          {copy.loadError}
        </AlertWithIcon>
      ) : null}

      {searchRfc && !isLoading && invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-8 w-8 text-muted-foreground" />}
          title={copy.emptyTitle}
          description={copy.empty}
          size="md"
        />
      ) : null}

      {!searchRfc ? (
        <AlertWithIcon variant="info" title={copy.initialState.title}>
          {copy.initialState.description}
        </AlertWithIcon>
      ) : null}

      {invoices.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{copy.tableTitle}</CardTitle>
                <CardDescription>{copy.tableDescription}</CardDescription>
              </div>
              <Badge variant="secondary">{copy.tableBadge(invoices.length)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>{copy.columns.invoice}</TableHead>
                    <TableHead>{copy.columns.client}</TableHead>
                    <TableHead>{copy.columns.issuedAt}</TableHead>
                    <TableHead className="text-right">{copy.columns.total}</TableHead>
                    <TableHead className="text-right">{copy.columns.balance}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Checkbox
                          checked={Boolean(selected[inv.id])}
                          onCheckedChange={(checked) =>
                            toggleInvoice(inv, checked === true)
                          }
                          aria-label={copy.selectInvoice(`${inv.serie}-${inv.folio}`)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {inv.serie}-{inv.folio}
                        <p className="text-xs text-muted-foreground">{inv.paymentMethod}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{inv.receiverName}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {inv.receiverRfc}
                        </p>
                      </TableCell>
                      <TableCell>{formatDate(inv.issuedAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMxCurrency(inv.total)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatMxCurrency(inv.balanceDue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="divide-y md:hidden">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-start gap-3 py-3">
                  <div className="pt-1">
                    <Checkbox
                      checked={Boolean(selected[inv.id])}
                      onCheckedChange={(checked) =>
                        toggleInvoice(inv, checked === true)
                      }
                      aria-label={copy.selectInvoice(`${inv.serie}-${inv.folio}`)}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {inv.serie}-{inv.folio}
                      </p>
                      <Badge variant="outline">{inv.paymentMethod}</Badge>
                    </div>
                    <p className="truncate text-sm">{inv.receiverName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{inv.receiverRfc}</p>
                    <p className="text-xs text-muted-foreground">
                      {copy.columns.issuedAt}: {formatDate(inv.issuedAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{copy.columns.balance}</p>
                    <p className="font-semibold tabular-nums">
                      {formatMxCurrency(inv.balanceDue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedInvoices.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {copy.selectedSummary(selectedInvoices.length, formatMxCurrency(selectedTotal))}
              </p>
              <p className="text-xs text-muted-foreground">{copy.selectedHint}</p>
            </div>
            <Button type="button" onClick={() => setSheetOpen(true)}>
              <Send className="mr-2 h-4 w-4" aria-hidden />
              {copy.register}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{copy.sheetTitle}</SheetTitle>
            <SheetDescription>{copy.sheetDescription}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {copy.sheetTotal}
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {formatMxCurrency(selectedTotal)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">{copy.sheetInvoicesTitle}</p>
              {selectedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2"
                >
                  <span className="font-medium">
                    {inv.serie}-{inv.folio}
                  </span>
                  <span className="tabular-nums">{formatMxCurrency(inv.balanceDue)}</span>
                </div>
              ))}
            </div>

            <AlertWithIcon variant="info" title={copy.sheetNoticeTitle}>
              {copy.sheetNoticeDescription}
            </AlertWithIcon>
          </div>
          <SheetFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleRegister}
              disabled={isPending || selectedTotal <= 0}
            >
              {isPending ? copy.submitting : copy.confirm}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FinanceChainRepairConfirmDialog
        open={chainRepairOpen}
        onOpenChange={setChainRepairOpen}
        isPending={isPending}
        onConfirm={() => {
          if (!pendingPayload) {
            const payload = buildPayload(true);
            if (payload) submitPayload(payload);
            return;
          }
          mutate({ ...pendingPayload, confirmChainRepair: true });
        }}
      />
    </div>
  );
}
