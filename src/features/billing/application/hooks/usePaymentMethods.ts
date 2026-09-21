import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@features/auth";
import { isSubscriptionPaywallExemptRole } from "@shared/constants/roles";
import { billingQueryKeys } from "../../domain/entities";
import { billingApi } from "../../infrastructure/billingApi";
import { isStripePublishableConfigured } from "../../infrastructure/stripeClient";

function useBillingQueryEnabled(): boolean {
  const { isAuthenticated, user } = useAuth();
  return Boolean(
    isAuthenticated && user && !isSubscriptionPaywallExemptRole(user.role),
  );
}

type BillingQueryOptions = {
  /** Extra gate (e.g. billing.read for commercial payloads). */
  enabled?: boolean;
};

export const usePaymentMethods = (options?: BillingQueryOptions) => {
  const enabled =
    useBillingQueryEnabled() &&
    isStripePublishableConfigured() &&
    (options?.enabled ?? true);
  return useQuery({
    queryKey: billingQueryKeys.paymentMethods(),
    queryFn: () => billingApi.listPaymentMethods(),
    staleTime: 60_000,
    enabled,
  });
};

export const useCreateSetupIntent = () => {
  return useMutation({
    mutationFn: () => billingApi.createSetupIntent(),
  });
};

export const useConfirmSetupIntent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setupIntentId: string) =>
      billingApi.confirmSetupIntent(setupIntentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: billingQueryKeys.paymentMethods(),
      });
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      billingApi.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: billingQueryKeys.paymentMethods(),
      });
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      billingApi.deletePaymentMethod(paymentMethodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: billingQueryKeys.paymentMethods(),
      });
    },
  });
};

export const usePaySaasInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => billingApi.paySaasInvoice(invoiceId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingQueryKeys.arrears() }),
        queryClient.invalidateQueries({
          queryKey: billingQueryKeys.subscription(),
        }),
        queryClient.invalidateQueries({ queryKey: billingQueryKeys.access() }),
      ]);
    },
  });
};
