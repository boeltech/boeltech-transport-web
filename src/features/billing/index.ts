export { BillingSubscriptionPage } from "./presentation/pages/BillingSubscriptionPage";
export {
  useBillingAccess,
  useBillingSubscription,
  useBillingUsage,
  useBillingEntitlements,
  useBillingArrears,
  useHasBillingModule,
} from "./application/hooks/useBilling";
export {
  usePaymentMethods,
  useCreateSetupIntent,
  useConfirmSetupIntent,
  useSetDefaultPaymentMethod,
  useDeletePaymentMethod,
  usePaySaasInvoice,
} from "./application/hooks/usePaymentMethods";
export {
  billingQueryKeys,
  type BillingSubscription,
  type BillingCapacity,
  type BillingCapacityDimension,
  type BillingCapacityStatus,
  type BillingUsage,
  type BillingEntitlements,
  type BillingArrears,
  type BillingArrearsInvoice,
  type BillingAccess,
  type BillingPaymentMethod,
  type BillingSetupIntent,
  type SaasInvoicePayResult,
} from "./domain/index";
/** Stripe.js helpers (WS-C) — reutilizables por platform charge (WS-D). */
export {
  isStripePublishableConfigured,
  isSaasStripeNotConfiguredError,
  SAAS_STRIPE_NOT_CONFIGURED,
} from "./infrastructure/stripeClient";
export { confirmCardPaymentIfRequired } from "./presentation/utils/confirmCardPayment";
/** SoT v5 — cargo Q×P / bolsa (reutilizable por platform). */
export {
  computeBolsaStamps,
  computeMotrizCargoCents,
  formatBandQRange,
  isMotrizPricing,
  resolveMotrizBand,
  type MotrizBandId,
} from "./presentation/utils/motrizPricing";
