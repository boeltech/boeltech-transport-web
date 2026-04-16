// Domain
export type {
  InvoiceStatus,
  Invoice,
  InvoiceListItem,
  InvoiceTripRef,
  Payment,
  FinanceSummary,
  AccountStatementItem,
  InvoicePrefill,
  PaginatedInvoices,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
  InvoiceFilters,
} from "./domain";
export { InvoiceStatusLabels } from "./domain";

// Application
export {
  invoiceQueryKeys,
  useInvoices,
  useInvoice,
  useInvoicePayments,
  useFinanceSummary,
  useAccountStatement,
  useInvoicePrefill,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useStampInvoice,
  useCancelInvoice,
  useRegisterPayment,
} from "./application";

// Infrastructure
export { invoicingApi } from "./infrastructure";

// Presentation — pages
export { FinancePage, InvoiceDetailPage, CreateInvoicePage } from "./presentation/pages";

// Presentation — components
export {
  InvoiceStatusBadge,
  InvoiceTable,
  PaymentFormDialog,
  CancelInvoiceDialog,
  FinanceSummaryCards,
  invoiceStatusConfig,
} from "./presentation/components";
