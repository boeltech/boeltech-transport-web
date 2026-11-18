export { BillingSubscriptionPage } from "./presentation/pages/BillingSubscriptionPage";
export {
  useBillingAccess,
  useBillingSubscription,
  useBillingUsage,
  useBillingEntitlements,
  useBillingArrears,
  useBillingSaasInvoices,
  useHasBillingModule,
} from "./application/hooks/useBilling";
export {
  useEntitlement,
  deriveEntitlementState,
  type UseEntitlementResult,
} from "./application/hooks/useEntitlement";
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
  type BillingAvailableModule,
  type BillingArrears,
  type BillingArrearsInvoice,
  type BillingAccess,
  type BillingPaymentMethod,
  type BillingSetupIntent,
  type SaasInvoicePayResult,
  type BillingSaasInvoice,
  type BillingSaasLastPayment,
  type EntitlementState,
} from "./domain/index";
/** Stripe.js helpers (WS-C) — reutilizables por platform charge (WS-D). */
export {
  isStripePublishableConfigured,
  isSaasStripeNotConfiguredError,
  SAAS_STRIPE_NOT_CONFIGURED,
} from "./infrastructure/stripeClient";
export { confirmCardPaymentIfRequired } from "./presentation/utils/confirmCardPayment";
/** Mailto v1 solicitud activación GPS (PRD §X3) — F3 presentación + F4 Complementos. */
export {
  buildGpsActivationMailto,
  GPS_ACTIVATION_BILLING_EMAIL,
  type GpsActivationMailtoParams,
} from "./presentation/utils/buildGpsActivationMailto";
/** SoT v5 — cargo Q×P / bolsa (reutilizable por platform). */
export {
  computeBolsaStamps,
  computeMotrizCargoCents,
  formatBandQRange,
  isMotrizPricing,
  resolveMotrizBand,
  type MotrizBandId,
} from "./presentation/utils/motrizPricing";
