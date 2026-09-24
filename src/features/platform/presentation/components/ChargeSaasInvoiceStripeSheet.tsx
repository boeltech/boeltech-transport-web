import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  confirmCardPaymentIfRequired,
  isSaasStripeNotConfiguredError,
} from "@features/billing";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { platformQueryKeys } from "../../domain/entities";
import {
  useChargeSaasInvoiceStripe,
  usePlatformTenantPaymentMethods,
} from "../../application/hooks/usePlatformSaasAr";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";

interface ChargeSaasInvoiceStripeSheetProps {
  invoice: PlatformSaasInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when Stripe gateway is not configured (hide CTAs upstream). */
  onGatewayUnavailable?: () => void;
}

export function ChargeSaasInvoiceStripeSheet({
  invoice,
  open,
  onOpenChange,
  onGatewayUnavailable,
}: ChargeSaasInvoiceStripeSheetProps) {
  const copy = platformCopy.ar.chargeStripe;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authenticating, setAuthenticating] = useState(false);

  const tenantId = invoice?.tenantId ?? "";
  const paymentMethods = usePlatformTenantPaymentMethods(tenantId, {
    enabled: open && !!tenantId,
  });

  const defaultPm = useMemo(() => {
    const items = paymentMethods.data ?? [];
    return items.find((pm) => pm.isDefault) ?? null;
  }, [paymentMethods.data]);

  const chargeMutation = useChargeSaasInvoiceStripe();

  useEffect(() => {
    if (!open) setAuthenticating(false);
  }, [open]);

  useEffect(() => {
    if (!open || !paymentMethods.isError) return;
    if (isSaasStripeNotConfiguredError(paymentMethods.error)) {
      onGatewayUnavailable?.();
      toast({
        title: copy.gatewayUnavailable,
        variant: "error",
      });
      onOpenChange(false);
    }
  }, [
    open,
    paymentMethods.isError,
    paymentMethods.error,
    onGatewayUnavailable,
    onOpenChange,
    toast,
    copy.gatewayUnavailable,
  ]);

  const busy = chargeMutation.isPending || authenticating;
  const canSubmit = Boolean(invoice && defaultPm);

  const handleConfirm = async () => {
    if (!invoice || !defaultPm) return;
    try {
      const result = await chargeMutation.mutateAsync({
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
      });

      if (result.status === "requires_action") {
        const secret = result.clientSecret?.trim();
        if (!secret) {
          toast({ title: copy.failed, variant: "error" });
          return;
        }
        toast({ title: copy.requiresAction, variant: "default" });
        setAuthenticating(true);
        const confirmed = await confirmCardPaymentIfRequired(secret);
        setAuthenticating(false);
        if (!confirmed.ok) {
          toast({
            title: copy.failed,
            description: confirmed.message,
            variant: "error",
          });
          return;
        }
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ar() });
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.tenantSaasInvoices(invoice.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.tenantSubscription(invoice.tenantId),
        });
        toast({ title: copy.success, variant: "success" });
        onOpenChange(false);
        return;
      }

      if (result.status === "failed") {
        toast({ title: copy.failed, variant: "error" });
        return;
      }

      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    } catch (error) {
      setAuthenticating(false);
      if (isSaasStripeNotConfiguredError(error)) {
        onGatewayUnavailable?.();
        toast({
          title: copy.gatewayUnavailable,
          variant: "error",
        });
        onOpenChange(false);
        return;
      }
      toast({
        title: copy.error,
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const cardBadge = defaultPm?.last4
    ? platformCopy.ar.card.cardOnFile(defaultPm.last4)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>
            {copy.description}
            {invoice ? (
              <>
                {" "}
                · {formatBillingPeriodKey(invoice.periodKey)}
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
            <p className="text-sm text-muted-foreground">{copy.amountLabel}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {invoice
                ? formatBillingPriceCents(invoice.amountDueCents)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{copy.amountHint}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{copy.cardLabel}</p>
            {paymentMethods.isLoading ? (
              <p className="text-sm text-muted-foreground">
                {platformCopy.ar.card.cardLoading}
              </p>
            ) : cardBadge ? (
              <Badge tone="soft" variant="secondary">
                {cardBadge}
                {defaultPm?.brand ? ` · ${defaultPm.brand}` : null}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">{copy.cardMissing}</p>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || busy}
            isLoading={busy}
            onClick={() => void handleConfirm()}
          >
            {authenticating
              ? copy.authenticating
              : chargeMutation.isPending
                ? copy.submitting
                : copy.submit}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
