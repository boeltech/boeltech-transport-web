/**
 * Invoicing Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Convierte respuestas API (snake_case) a entidades del dominio (camelCase).
 */

import type {
  Invoice,
  InvoiceListItem,
  InvoiceTripRef,
  Payment,
  FinanceSummary,
  AccountStatementItem,
  InvoicePrefill,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
} from "@features/invoicing/domain";

// ============================================================================
// RAW API TYPES (snake_case — solo usados en este archivo)
// ============================================================================

interface ApiPayment {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_mxn: number;
  payment_date: string;
  payment_form: string;
  payment_form_name: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  created_by_name: string | null;
}

interface ApiTripRef {
  trip_id: string;
  trip_code: string;
  client_name: string;
  scheduled_departure: string;
  origin: string;
  destination: string;
  total_amount: number;
}

interface ApiInvoice {
  id: string;
  tenant_id: string;
  serie: string;
  folio: number;
  cfdi_uuid: string | null;
  issuer_rfc: string;
  issuer_name: string;
  issuer_tax_regime: string;
  issue_location: string;
  receiver_rfc: string;
  receiver_name: string;
  cfdi_usage: string;
  receiver_tax_regime: string;
  receiver_postal_code: string;
  issued_at: string;
  payment_form: string;
  payment_method: string;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  discount: number;
  total_tax: number;
  retained_tax: number;
  total: number;
  status: string;
  sat_cancellation_status: string;
  sat_cancellation_message: string | null;
  sat_cancellation_updated_at: string | null;
  pac_provider: string | null;
  xml_content: string | null;
  qr_code: string | null;
  pdf_url: string | null;
  stamped_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancellation_code: string | null;
  replacement_cfdi_uuid: string | null;
  notes: string | null;
  trips: ApiTripRef[];
  payments: ApiPayment[];
  total_paid: number;
  balance_due: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ApiInvoiceListItem {
  id: string;
  tenant_id: string;
  serie: string;
  folio: number;
  cfdi_uuid: string | null;
  receiver_rfc: string;
  receiver_name: string;
  issued_at: string;
  payment_form: string;
  payment_method: string;
  currency: string;
  subtotal: number;
  total_tax: number;
  total: number;
  status: string;
  sat_cancellation_status: string;
  sat_cancellation_message: string | null;
  stamped_at: string | null;
  trip_count: number;
  trip_codes: string[];
  total_paid: number;
  balance_due: number;
  created_at: string;
  created_by_name: string | null;
}

interface ApiFinanceSummary {
  total_receivable: number;
  collected_this_month: number;
  total_overdue: number;
  expenses_this_month: number;
  invoices_by_status: {
    draft: number;
    stamped: number;
    cancellation_pending: number;
    cancelled: number;
  };
}

interface ApiAccountStatementItem {
  client_rfc: string;
  client_name: string;
  total_invoiced: number;
  total_paid: number;
  balance_due: number;
  invoice_count: number;
  overdue_amount: number;
}

interface ApiInvoicePrefill {
  issuer_rfc: string;
  issuer_name: string;
  issuer_tax_regime: string;
  issue_location: string;
  receiver_rfc: string;
  receiver_name: string;
  receiver_tax_regime: string;
  receiver_postal_code: string;
  cfdi_usage: string;
  serie: string;
  payment_form: string;
  payment_method: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  total_tax: number;
  retained_tax: number;
  retained_tax_rate: number;
  total: number;
  client_type: string;
  trip_id: string;
  trip_code: string;
}

// ============================================================================
// MAPPERS — API → Domain
// ============================================================================

export function mapPayment(raw: ApiPayment): Payment {
  return {
    id: raw.id,
    invoiceId: raw.invoice_id,
    amount: raw.amount,
    currency: raw.currency,
    exchangeRate: raw.exchange_rate,
    amountMxn: raw.amount_mxn,
    paymentDate: raw.payment_date,
    paymentForm: raw.payment_form,
    paymentFormName: raw.payment_form_name,
    reference: raw.reference,
    notes: raw.notes,
    createdAt: raw.created_at,
    createdByName: raw.created_by_name,
  };
}

function mapTripRef(raw: ApiTripRef): InvoiceTripRef {
  return {
    tripId: raw.trip_id,
    tripCode: raw.trip_code,
    clientName: raw.client_name,
    scheduledDeparture: raw.scheduled_departure,
    origin: raw.origin,
    destination: raw.destination,
    totalAmount: raw.total_amount,
  };
}

export function mapInvoice(raw: ApiInvoice): Invoice {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    serie: raw.serie,
    folio: raw.folio,
    cfdiUuid: raw.cfdi_uuid,
    issuerRfc: raw.issuer_rfc,
    issuerName: raw.issuer_name,
    issuerTaxRegime: raw.issuer_tax_regime,
    issueLocation: raw.issue_location,
    receiverRfc: raw.receiver_rfc,
    receiverName: raw.receiver_name,
    cfdiUsage: raw.cfdi_usage,
    receiverTaxRegime: raw.receiver_tax_regime,
    receiverPostalCode: raw.receiver_postal_code,
    issuedAt: raw.issued_at,
    paymentForm: raw.payment_form,
    paymentMethod: raw.payment_method,
    currency: raw.currency,
    exchangeRate: raw.exchange_rate,
    subtotal: raw.subtotal,
    discount: raw.discount,
    totalTax: raw.total_tax,
    retainedTax: raw.retained_tax ?? 0,
    total: raw.total,
    status: raw.status as Invoice["status"],
    satCancellationStatus: raw.sat_cancellation_status ?? "none",
    satCancellationMessage: raw.sat_cancellation_message,
    satCancellationUpdatedAt: raw.sat_cancellation_updated_at,
    pacProvider: raw.pac_provider,
    xmlContent: raw.xml_content,
    qrCode: raw.qr_code,
    pdfUrl: raw.pdf_url,
    stampedAt: raw.stamped_at,
    cancelledAt: raw.cancelled_at,
    cancellationReason: raw.cancellation_reason,
    cancellationCode: raw.cancellation_code,
    replacementCfdiUuid: raw.replacement_cfdi_uuid,
    notes: raw.notes,
    trips: (raw.trips ?? []).map(mapTripRef),
    payments: (raw.payments ?? []).map(mapPayment),
    totalPaid: raw.total_paid,
    balanceDue: raw.balance_due,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    createdBy: raw.created_by,
  };
}

export function mapInvoiceListItem(raw: ApiInvoiceListItem): InvoiceListItem {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    serie: raw.serie,
    folio: raw.folio,
    cfdiUuid: raw.cfdi_uuid,
    receiverRfc: raw.receiver_rfc,
    receiverName: raw.receiver_name,
    issuedAt: raw.issued_at,
    paymentForm: raw.payment_form,
    paymentMethod: raw.payment_method,
    currency: raw.currency,
    subtotal: raw.subtotal,
    totalTax: raw.total_tax,
    total: raw.total,
    status: raw.status as InvoiceListItem["status"],
    satCancellationStatus: raw.sat_cancellation_status ?? "none",
    satCancellationMessage: raw.sat_cancellation_message,
    stampedAt: raw.stamped_at,
    tripCount: raw.trip_count,
    tripCodes: raw.trip_codes ?? [],
    totalPaid: raw.total_paid,
    balanceDue: raw.balance_due,
    createdAt: raw.created_at,
    createdByName: raw.created_by_name,
  };
}

export function mapFinanceSummary(raw: ApiFinanceSummary): FinanceSummary {
  return {
    totalReceivable: raw.total_receivable,
    collectedThisMonth: raw.collected_this_month,
    totalOverdue: raw.total_overdue,
    expensesThisMonth: raw.expenses_this_month,
    invoicesByStatus: {
      draft: raw.invoices_by_status.draft,
      stamped: raw.invoices_by_status.stamped,
      cancellationPending: raw.invoices_by_status.cancellation_pending ?? 0,
      cancelled: raw.invoices_by_status.cancelled,
    },
  };
}

export function mapAccountStatementItem(
  raw: ApiAccountStatementItem,
): AccountStatementItem {
  return {
    clientRfc: raw.client_rfc,
    clientName: raw.client_name,
    totalInvoiced: raw.total_invoiced,
    totalPaid: raw.total_paid,
    balanceDue: raw.balance_due,
    invoiceCount: raw.invoice_count,
    overdueAmount: raw.overdue_amount,
  };
}

export function mapInvoicePrefill(raw: ApiInvoicePrefill): InvoicePrefill {
  return {
    issuerRfc: raw.issuer_rfc,
    issuerName: raw.issuer_name,
    issuerTaxRegime: raw.issuer_tax_regime,
    issueLocation: raw.issue_location,
    receiverRfc: raw.receiver_rfc,
    receiverName: raw.receiver_name,
    receiverTaxRegime: raw.receiver_tax_regime,
    receiverPostalCode: raw.receiver_postal_code,
    cfdiUsage: raw.cfdi_usage,
    serie: raw.serie,
    paymentForm: raw.payment_form,
    paymentMethod: raw.payment_method,
    currency: raw.currency,
    subtotal: raw.subtotal,
    taxRate: raw.tax_rate,
    totalTax: raw.total_tax,
    retainedTax: raw.retained_tax ?? 0,
    retainedTaxRate: raw.retained_tax_rate ?? 0,
    total: raw.total,
    clientType: raw.client_type ?? "individual",
    tripId: raw.trip_id,
    tripCode: raw.trip_code,
  };
}

// ============================================================================
// MAPPERS — Domain → API payload (snake_case)
// ============================================================================

export function toApiCreateInvoice(payload: CreateInvoicePayload) {
  return {
    trip_ids: payload.tripIds,
    receiver_rfc: payload.receiverRfc,
    receiver_name: payload.receiverName,
    cfdi_usage: payload.cfdiUsage,
    receiver_tax_regime: payload.receiverTaxRegime,
    receiver_postal_code: payload.receiverPostalCode,
    payment_form: payload.paymentForm,
    payment_method: payload.paymentMethod,
    currency: payload.currency,
    exchange_rate: payload.exchangeRate,
    subtotal: payload.subtotal,
    discount: payload.discount,
    total_tax: payload.totalTax,
    retained_tax: payload.retainedTax ?? 0,
    total: payload.total,
    notes: payload.notes,
  };
}

export function toApiUpdateInvoice(payload: UpdateInvoicePayload) {
  return {
    receiver_rfc: payload.receiverRfc,
    receiver_name: payload.receiverName,
    cfdi_usage: payload.cfdiUsage,
    receiver_tax_regime: payload.receiverTaxRegime,
    receiver_postal_code: payload.receiverPostalCode,
    payment_form: payload.paymentForm,
    payment_method: payload.paymentMethod,
    currency: payload.currency,
    exchange_rate: payload.exchangeRate,
    subtotal: payload.subtotal,
    discount: payload.discount,
    total_tax: payload.totalTax,
    retained_tax: payload.retainedTax,
    total: payload.total,
    notes: payload.notes,
  };
}

export function toApiCancelInvoice(payload: CancelInvoicePayload) {
  return {
    cancellation_reason: payload.cancellationReason,
    cancellation_code: payload.cancellationCode,
    replacement_cfdi_uuid: payload.replacementCfdiUuid,
  };
}

export function toApiCreatePayment(payload: CreatePaymentPayload) {
  return {
    amount: payload.amount,
    currency: payload.currency,
    exchange_rate: payload.exchangeRate,
    payment_date: payload.paymentDate,
    payment_form: payload.paymentForm,
    reference: payload.reference,
    notes: payload.notes,
  };
}
