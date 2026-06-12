// Domain
export type {
  InvoiceStatus,
  Invoice,
  InvoiceListItem,
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
} from "./domain";
export { InvoiceStatusLabels } from "./domain";

// Application
export {
  invoiceQueryKeys,
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
} from "./application";

// Infrastructure
export { invoicingApi } from "./infrastructure";

// Presentation — pages
export { InvoiceDetailPage, CreateInvoicePage } from "./presentation/pages";

// Presentation — components
export {
  InvoiceStatusBadge,
  InvoiceTable,
  PaymentFormDialog,
  CancelInvoiceDialog,
  SubstituteInvoiceSheet,
  INVOICE_STATUS_CONFIG,
  getInvoiceStatusConfig,
} from "./presentation/components";
