import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  OpsBadge,
  OpsButton,
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetFooter,
  OpsSheetHeader,
  OpsSheetTitle,
} from "./ui";

interface OpsChargeSaasInvoiceStripeSheetProps {
  invoice: PlatformSaasInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGatewayUnavailable?: () => void;
}

export function OpsChargeSaasInvoiceStripeSheet({
  invoice,
  open,
  onOpenChange,
  onGatewayUnavailable,
}: OpsChargeSaasInvoiceStripeSheetProps) {
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
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
        data-testid="ops-charge-stripe-sheet"
      >
        <OpsSheetHeader>
          <OpsSheetTitle>{copy.title}</OpsSheetTitle>
          <OpsSheetDescription>
            {copy.description}
            {invoice ? (
              <> · {formatBillingPeriodKey(invoice.periodKey)}</>
            ) : null}
          </OpsSheetDescription>
        </OpsSheetHeader>

        <div className="mt-4 space-y-4">
          <div className="ops-preview space-y-1">
            <p className="text-sm ops-text-muted">{copy.amountLabel}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {invoice
                ? formatBillingPriceCents(invoice.amountDueCents)
                : "—"}
            </p>
            <p className="text-xs ops-text-muted">{copy.amountHint}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{copy.cardLabel}</p>
            {paymentMethods.isLoading ? (
              <p className="text-sm ops-text-muted">
                {platformCopy.ar.card.cardLoading}
              </p>
            ) : cardBadge ? (
              <OpsBadge tone="accent">
                {cardBadge}
                {defaultPm?.brand ? ` · ${defaultPm.brand}` : null}
              </OpsBadge>
            ) : (
              <p className="text-sm ops-text-muted">{copy.cardMissing}</p>
            )}
          </div>
        </div>

        <OpsSheetFooter className="mt-6 gap-2 sm:justify-end">
          <OpsButton
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {copy.cancel}
          </OpsButton>
          <OpsButton
            type="button"
            disabled={!canSubmit || busy}
            onClick={() => void handleConfirm()}
          >
            {authenticating
              ? copy.authenticating
              : chargeMutation.isPending
                ? copy.submitting
                : copy.submit}
          </OpsButton>
        </OpsSheetFooter>
      </OpsSheetContent>
    </OpsSheet>
  );
}
