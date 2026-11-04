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
  InvoiceSendRecipients,
  DispatchDocumentKindFilter,
  DispatchDocumentItem,
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
  useInvoiceSendRecipients,
  usePaymentSendRecipients,
  useDispatchDocuments,
  useSendInvoicesBatch,
} from "./application";
export type {
  SendInvoiceBatchGroupItem,
  SendInvoiceBatchResultItem,
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
  SendRepDialog,
  PaymentFormDialog,
  CancelInvoiceDialog,
  SubstituteInvoiceSheet,
  InvoiceRecipientsChecklist,
  INVOICE_STATUS_CONFIG,
  getInvoiceStatusConfig,
} from "./presentation/components";

export {
  buildSendRecipientKeys,
  defaultSelectedRecipientKeys,
  toggleRecipientKey,
} from "./presentation/utils/invoiceSendRecipientSelection";

export { invoicingCopy } from "./presentation/copy/invoicingCopy";

export {
  buildInvoiceCreateHref,
  type InvoiceCreateHrefParams,
} from "./application/invoiceCreateHref";

export {
  buildInvoiceCreatePathFromTrip,
  buildTripInvoicingHubPath,
  shouldOpenInvoiceCreateFromFinanceHub,
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
  type FinanceHubTripInvoiceSource,
} from "./presentation/financeInvoiceFromTripCta";

export { InvoiceBulkDownloadSheet } from "./presentation/components/InvoiceBulkDownloadSheet";
export { invoiceBulkDownloadCopy } from "./presentation/copy/invoiceBulkDownloadCopy";
