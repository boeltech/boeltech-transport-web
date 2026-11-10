/**
 * Factura del viaje: badge de solo lectura y, si el gobierno lo permite,
 * diálogo con motivo para pasar a Sin factura o regularizar.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { defaultCfdiEmissionIntentFromProfile } from "@boeltech/cfdi-domain/reglas/cfdi-emission-intent";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { FieldInlineError, FormValidationSummary } from "@shared/ui/form";
import { getFieldErrorAriaProps } from "@shared/ui/form/fieldErrorAria";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Textarea } from "@shared/ui/text-area";
import { formatDateTime } from "@shared/utils/dateUtils";

import type {
  CfdiEmissionIntent,
  Trip,
  TripSettlementException,
} from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";

const copy = cfdiEmissionIntentCopy;
const g = copy.governance;

const reasonSchema = z.object({
  reason: z.string().trim().min(10, g.reasonMin).max(500, g.reasonMax),
});

type ReasonForm = z.infer<typeof reasonSchema>;
type DialogMode = "sin" | "regularize" | "reject" | "cancel" | "approve";

export interface TripLiquidacionGovernance {
  canOpenSinCfdi: boolean;
  changeKind: "apply" | "request";
  canRegularize: boolean;
  regularizeCashLocked: boolean;
  openRequest: TripSettlementException | null;
  canApprove: boolean;
  canCancel: boolean;
  approvalsHref: string | null;
}

export interface TripLiquidacionIntentActions {
  pending: boolean;
  error: string | null;
  onApply: (reason: string) => Promise<boolean>;
  onRequest: (reason: string) => Promise<boolean>;
  onRegularize: (reason: string) => Promise<boolean>;
  onCancel: (reason: string) => Promise<boolean>;
  onApprove: () => Promise<boolean>;
  onReject: (reason: string) => Promise<boolean>;
  clearError: () => void;
}

interface TripLiquidacionChipProps {
  trip: Trip;
  governance?: TripLiquidacionGovernance | null;
  actions?: TripLiquidacionIntentActions | null;
}

export function TripLiquidacionChip({
  trip,
  governance = null,
  actions = null,
}: TripLiquidacionChipProps) {
  const intent = trip.cfdiEmissionIntent ?? "emitir_cfdi";
  const isSinFactura = intent === "sin_cfdi_efectivo";
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const form = useForm<ReasonForm>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  function openDialog(mode: DialogMode) {
    actions?.clearError();
    form.reset({ reason: "" });
    setDialog(mode);
  }

  async function submitReason(values: ReasonForm) {
    if (!actions || !dialog || dialog === "approve") return;
    const reason = values.reason;
    const ok =
      dialog === "sin"
        ? governance?.changeKind === "request"
          ? await actions.onRequest(reason)
          : await actions.onApply(reason)
        : dialog === "regularize"
          ? await actions.onRegularize(reason)
          : dialog === "reject"
            ? await actions.onReject(reason)
            : await actions.onCancel(reason);
    if (ok) setDialog(null);
  }

  const primaryLabel =
    dialog === "regularize"
      ? g.regularizeCta
      : dialog === "reject"
        ? g.reject
        : dialog === "cancel"
          ? g.cancelRequest
          : governance?.changeKind === "request"
            ? g.requestSinCfdi
            : g.useSinCfdi;

  const exception = trip.settlementException ?? governance?.openRequest ?? null;
  const showSinCta =
    governance?.canOpenSinCfdi === true &&
    !isSinFactura &&
    governance.openRequest == null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant={isSinFactura ? "warning" : "outline"}
        tone="soft"
        className="text-xs"
      >
        {isSinFactura ? copy.chip.sinCfdi : copy.chip.conCfdi}
      </Badge>

      {showSinCta ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openDialog("sin")}
        >
          {g.changeCta}
        </Button>
      ) : null}

      {governance?.openRequest ? (
        <span className="text-xs text-muted-foreground">{g.pending}</span>
      ) : null}
      {governance?.canApprove ? (
        <>
          <Button type="button" size="sm" onClick={() => openDialog("approve")}>
            {g.approve}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openDialog("reject")}
          >
            {g.reject}
          </Button>
        </>
      ) : null}
      {governance?.openRequest && !governance.canApprove && governance.approvalsHref ? (
        <Button type="button" variant="link" size="sm" asChild>
          <Link to={governance.approvalsHref}>{g.approvalsLink}</Link>
        </Button>
      ) : null}
      {governance?.canCancel ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => openDialog("cancel")}
        >
          {g.cancelRequest}
        </Button>
      ) : null}

      {governance?.canRegularize ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openDialog("regularize")}
        >
          {g.regularizeCta}
        </Button>
      ) : null}
      {governance?.regularizeCashLocked ? (
        <span className="text-xs text-muted-foreground">{g.cashFreeze}</span>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setHistoryOpen(true)}
      >
        {g.history}
      </Button>

      <Dialog
        open={dialog != null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "regularize"
                ? g.dialogTitleRegularize
                : dialog === "reject"
                  ? g.dialogTitleReject
                  : dialog === "cancel"
                    ? g.dialogTitleCancel
                    : dialog === "approve"
                      ? g.approveTitle
                      : g.dialogTitleSin}
            </DialogTitle>
            <DialogDescription>
              {dialog === "approve" ? g.approveBody : copy.overrideConfirm.description}
            </DialogDescription>
          </DialogHeader>
          {dialog === "sin" || dialog === "approve" ? (
            <p className="text-sm text-foreground">{copy.complianceNotice}</p>
          ) : null}
          {actions?.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actions.error}</AlertDescription>
            </Alert>
          ) : null}
          {dialog === "approve" ? (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                {copy.overrideConfirm.cancel}
              </Button>
              <Button
                type="button"
                disabled={actions?.pending}
                onClick={() => {
                  void actions?.onApprove().then((ok) => {
                    if (ok) setDialog(null);
                  });
                }}
              >
                {g.approve}
              </Button>
            </DialogFooter>
          ) : (
            <form
              onSubmit={form.handleSubmit(submitReason)}
              className="space-y-3"
            >
              {form.formState.submitCount > 0 ? (
                <FormValidationSummary
                  messages={Object.values(form.formState.errors)
                    .map((issue) => issue?.message)
                    .filter((message): message is string => Boolean(message))}
                />
              ) : null}
              <div className="space-y-1">
                <Label htmlFor="sin-cfdi-reason">{g.reasonLabel}</Label>
                <Textarea
                  id="sin-cfdi-reason"
                  rows={4}
                  {...form.register("reason")}
                  {...getFieldErrorAriaProps(
                    "sin-cfdi-reason",
                    form.formState.errors.reason?.message,
                  )}
                />
                <p className="text-xs text-muted-foreground">{g.reasonHint}</p>
                <FieldInlineError
                  fieldId="sin-cfdi-reason"
                  message={form.formState.errors.reason?.message}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                  {copy.overrideConfirm.cancel}
                </Button>
                <Button type="submit" disabled={actions?.pending}>
                  {primaryLabel}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{g.historyTitle}</SheetTitle>
            <SheetDescription>{g.historyEmpty}</SheetDescription>
          </SheetHeader>
          {exception ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Estado</dt>
                <dd>{g.status[exception.status]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{g.reasonLabel}</dt>
                <dd>{exception.reason}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Registrada</dt>
                <dd>{formatDateTime(exception.createdAt.toISOString())}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{g.historyEmpty}</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function defaultLiquidacionForClientProfile(
  profile: "receptor_cfdi" | "comercial_only" | undefined,
): CfdiEmissionIntent {
  return defaultCfdiEmissionIntentFromProfile(
    profile === "comercial_only" ? "comercial_only" : "receptor_cfdi",
  );
}
