import { useMemo, useState, type FormEvent } from "react";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Trash2 } from "lucide-react";
import { getErrorMessage, isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  useConfirmSetupIntent,
  useCreateSetupIntent,
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "../../application/hooks/usePaymentMethods";
import type { BillingPaymentMethod } from "../../domain/entities";
import {
  getStripePromise,
  isSaasStripeNotConfiguredError,
  isStripePublishableConfigured,
} from "../../infrastructure/stripeClient";
import { billingCopy } from "../copy/billingCopy";

interface PaymentMethodsCardProps {
  /** When API returns SAAS_STRIPE_NOT_CONFIGURED, parent can hide pay CTAs. */
  onGatewayUnavailable?: () => void;
  enabled?: boolean;
}

function formatCardLabel(pm: BillingPaymentMethod): string {
  const brand = (pm.brand ?? billingCopy.paymentMethods.brandFallback).trim();
  const last4 = pm.last4?.trim() || "••••";
  return billingCopy.paymentMethods.cardLabel(brand, last4);
}

function formatExpiry(pm: BillingPaymentMethod): string | null {
  if (pm.expMonth == null || pm.expYear == null) return null;
  const month = String(pm.expMonth).padStart(2, "0");
  const year = String(pm.expYear).slice(-2);
  return billingCopy.paymentMethods.expires(month, year);
}

function SetupCardForm({
  clientSecret,
  setupIntentId,
  onCancel,
  onSuccess,
  onGatewayUnavailable,
}: {
  clientSecret: string;
  setupIntentId: string;
  onCancel: () => void;
  onSuccess: () => void;
  onGatewayUnavailable?: () => void;
}) {
  const copy = billingCopy.paymentMethods;
  const stripe = useStripe();
  const elements = useElements();
  const { success: toastSuccess, error: toastError } = useToast();
  const confirmMutation = useConfirmSetupIntent();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setSubmitting(true);
    try {
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        toastError(result.error.message ?? copy.setupError);
        return;
      }

      const intentId =
        result.setupIntent?.id?.trim() || setupIntentId.trim();
      if (!intentId) {
        toastError(copy.setupError);
        return;
      }

      await confirmMutation.mutateAsync(intentId);
      toastSuccess(copy.setupSuccess);
      onSuccess();
    } catch (error) {
      if (isSaasStripeNotConfiguredError(error)) {
        onGatewayUnavailable?.();
        toastError(copy.gatewayUnavailable);
        return;
      }
      toastError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <p className="text-xs text-muted-foreground">{copy.elementsHint}</p>
      <div className="rounded-lg border border-border bg-background px-3 py-2.5">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "14px",
                color: "hsl(var(--foreground))",
                "::placeholder": { color: "hsl(var(--muted-foreground))" },
              },
            },
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={!stripe || submitting}>
          {submitting ? copy.saving : copy.saveCard}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={onCancel}
        >
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}

export function PaymentMethodsCard({
  onGatewayUnavailable,
  enabled = true,
}: PaymentMethodsCardProps) {
  const copy = billingCopy.paymentMethods;
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("billing", "update");
  const stripeReady = isStripePublishableConfigured();
  const { success: toastSuccess, error: toastError } = useToast();

  const methodsQuery = usePaymentMethods({ enabled: enabled && stripeReady });
  const createSetup = useCreateSetupIntent();
  const setDefault = useSetDefaultPaymentMethod();
  const deletePm = useDeletePaymentMethod();

  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(
    null,
  );
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BillingPaymentMethod | null>(
    null,
  );
  const [gatewayDown, setGatewayDown] = useState(false);

  const stripePromise = useMemo(
    () => (stripeReady ? getStripePromise() : null),
    [stripeReady],
  );

  if (!stripeReady) {
    return null;
  }

  const markGatewayDown = () => {
    setGatewayDown(true);
    setSetupClientSecret(null);
    setSetupIntentId(null);
    onGatewayUnavailable?.();
  };

  const handleStartSetup = async () => {
    try {
      const intent = await createSetup.mutateAsync();
      setSetupClientSecret(intent.clientSecret);
      setSetupIntentId(intent.setupIntentId);
    } catch (error) {
      if (isSaasStripeNotConfiguredError(error)) {
        markGatewayDown();
        toastError(copy.gatewayUnavailable);
        return;
      }
      toastError(getErrorMessage(error));
    }
  };

  const handleSetDefault = async (pm: BillingPaymentMethod) => {
    try {
      await setDefault.mutateAsync(pm.id);
      toastSuccess(copy.defaultSuccess);
    } catch (error) {
      if (isSaasStripeNotConfiguredError(error)) {
        markGatewayDown();
        toastError(copy.gatewayUnavailable);
        return;
      }
      toastError(getErrorMessage(error));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePm.mutateAsync(deleteTarget.id);
      toastSuccess(copy.deleteSuccess);
      setDeleteTarget(null);
    } catch (error) {
      if (isSaasStripeNotConfiguredError(error)) {
        markGatewayDown();
        toastError(copy.gatewayUnavailable);
        return;
      }
      toastError(getErrorMessage(error));
    }
  };

  const methods = methodsQuery.data ?? [];
  const showMutations = canUpdate && !gatewayDown;
  const listError =
    methodsQuery.isError && isApiError(methodsQuery.error)
      ? getErrorMessage(methodsQuery.error)
      : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gatewayDown ? (
            <p className="text-sm text-muted-foreground">
              {copy.gatewayUnavailable}
            </p>
          ) : methodsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{copy.loading}</p>
          ) : listError ? (
            <p className="text-sm text-destructive">{listError}</p>
          ) : methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            <>
            <p className="text-sm text-muted-foreground">{copy.autoChargeHint}</p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {methods.map((pm) => {
                const expiry = formatExpiry(pm);
                return (
                  <li
                    key={pm.id}
                    className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{formatCardLabel(pm)}</p>
                        {pm.isDefault ? (
                          <Badge variant="secondary">{copy.defaultBadge}</Badge>
                        ) : null}
                      </div>
                      {expiry ? (
                        <p className="text-xs text-muted-foreground">{expiry}</p>
                      ) : null}
                    </div>
                    {showMutations ? (
                      <div className="flex flex-wrap gap-2">
                        {!pm.isDefault ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={setDefault.isPending}
                            onClick={() => void handleSetDefault(pm)}
                          >
                            {copy.setDefault}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={deletePm.isPending}
                          onClick={() => setDeleteTarget(pm)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          {copy.delete}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            </>
          )}

          {showMutations && !setupClientSecret ? (
            <Button
              type="button"
              size="sm"
              disabled={createSetup.isPending}
              onClick={() => void handleStartSetup()}
            >
              {createSetup.isPending ? copy.startingSetup : copy.addCard}
            </Button>
          ) : null}

          {showMutations && setupClientSecret && setupIntentId && stripePromise ? (
            <Elements stripe={stripePromise}>
              <SetupCardForm
                clientSecret={setupClientSecret}
                setupIntentId={setupIntentId}
                onCancel={() => {
                  setSetupClientSecret(null);
                  setSetupIntentId(null);
                }}
                onSuccess={() => {
                  setSetupClientSecret(null);
                  setSetupIntentId(null);
                }}
                onGatewayUnavailable={markGatewayDown}
              />
            </Elements>
          ) : null}

          {!canUpdate ? (
            <p className="text-xs text-muted-foreground">{copy.readOnlyHint}</p>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? copy.deleteDescription(formatCardLabel(deleteTarget))
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
