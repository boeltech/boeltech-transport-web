// Domain
export type {
  InvoiceStatus,
  Invoice,
  InvoiceListItem,
  InvoiceBillingScope,
  InvoiceTripRef,
  Payment,
  InvoicePrefill,
  PaginatedInvoices,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
  PaymentAllocationPayload,
  SubstituteStampedInvoicePayload,
  SubstituteStampedInvoiceResult,
  InvoiceFilters,
  InvoiceEmailDispatchFilter,
} from "./domain";
export {
  InvoiceStatusLabels,
  parseInvoiceBillingScope,
  isServiceOnlyBillingScope,
  getDisplayAmountsFromInvoiceFields,
} from "./domain";

// Application
export {
  invoiceQueryKeys,
  evictInvoicePrefillQueries,
  useInvoices,
  useInvoice,
  useInvoicePayments,
  useInvoicePrefill,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useStampInvoice,
  useCancelInvoice,
  useRegisterPayment,
  useSubstituteStampedInvoice,
  useResumeSubstitutionCancel,
} from "./application";

// Infrastructure
export { invoicingApi } from "./infrastructure";

// Presentation — pages
export { InvoiceDetailPage, CreateInvoicePage } from "./presentation/pages";

// Presentation — components
export {
  InvoiceStatusBadge,
  InvoiceEmailDispatchBadge,
  InvoiceTable,
  InvoiceBillingScopeBadge,
  SendInvoiceDialog,
  PaymentFormDialog,
  CancelInvoiceDialog,
  SubstituteInvoiceSheet,
  INVOICE_STATUS_CONFIG,
  getInvoiceStatusConfig,
} from "./presentation/components";

export {
  buildInvoiceCreatePathFromTrip,
  buildTripInvoicingHubPath,
  shouldOpenInvoiceCreateFromFinanceHub,
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
  type FinanceHubTripInvoiceSource,
} from "./presentation/financeInvoiceFromTripCta";
