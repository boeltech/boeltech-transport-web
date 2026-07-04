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
  InvoicePrefill,
  InvoiceConcept,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
  SubstituteStampedInvoicePayload,
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
  payment_time?: string;
  payment_form: string;
  payment_form_name: string | null;
  reference: string | null;
  notes: string | null;
  rep_cfdi_uuid?: string | null;
  rep_stamped_at?: string | null;
  rep_status?: string;
  rep_attempts?: number;
  rep_last_error?: string | null;
  has_rep_xml?: boolean;
  rep_num_parcialidad?: number | null;
  rep_imp_saldo_ant?: number | null;
  rep_imp_saldo_insoluto?: number | null;
  rep_imp_pagado?: number | null;
  created_at: string;
  created_by_name: string | null;
}

interface ApiTripRef {
  trip_id: string;
  trip_code: string;
  client_name: string;
  scheduled_departure: string;
  origin_city: string;
  origin_state: string | null;
  destination_city: string;
  destination_state: string | null;
  base_rate: number;
}

interface ApiInvoiceConcept {
  id?: string;
  sort_order?: number;
  concept_type: string;
  service_concept_id?: string | null;
  clave_prod_serv: string;
  clave_unidad: string;
  unidad: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  object_imp: string;
  iva_rate?: number;
  retained_iva_rate?: number;
  iva_amount?: number;
  retained_iva_amount?: number;
}

interface ApiInvoice {
  id: string;
  tenant_id: string;
  serie: string;
  folio: number;
  cfdi_uuid: string | null;
  invoice_type?: string | null;
  parent_invoice_id?: string | null;
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
  has_stamped_xml?: boolean;
  qr_code: string | null;
  pdf_url: string | null;
  stamped_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancellation_code: string | null;
  replacement_cfdi_uuid: string | null;
  notes: string | null;
  trips: ApiTripRef[];
  concepts?: ApiInvoiceConcept[];
  payments: ApiPayment[];
  total_paid: number;
  balance_due: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  can_substitute_invoice?: boolean;
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
  suggested_concepts?: ApiInvoiceConcept[];
}

// ============================================================================
// MAPPERS — API → Domain
// ============================================================================

export function mapPayment(raw: unknown): Payment {
  const payment = raw as ApiPayment;
  return {
    id: payment.id,
    invoiceId: payment.invoice_id,
    amount: payment.amount,
    currency: payment.currency,
    exchangeRate: payment.exchange_rate,
    amountMxn: payment.amount_mxn,
    paymentDate: payment.payment_date,
    paymentTime: payment.payment_time ?? "12:00:00",
    paymentForm: payment.payment_form,
    paymentFormName: payment.payment_form_name,
    reference: payment.reference,
    notes: payment.notes,
    createdAt: payment.created_at,
    createdByName: payment.created_by_name,
    repCfdiUuid: payment.rep_cfdi_uuid ?? null,
    repStampedAt: payment.rep_stamped_at ?? null,
    repStatus: (payment.rep_status ?? "not_required") as Payment["repStatus"],
    repAttempts: payment.rep_attempts ?? 0,
    repLastError: payment.rep_last_error ?? null,
    hasRepXml: payment.has_rep_xml ?? false,
    repNumParcialidad: payment.rep_num_parcialidad ?? null,
    repImpSaldoAnt: payment.rep_imp_saldo_ant ?? null,
    repImpSaldoInsoluto: payment.rep_imp_saldo_insoluto ?? null,
    repImpPagado: payment.rep_imp_pagado ?? null,
  };
}

function mapInvoiceConcept(raw: ApiInvoiceConcept): InvoiceConcept {
  return {
    id: raw.id,
    sortOrder: raw.sort_order,
    conceptType: raw.concept_type === "service" ? "service" : "flete",
    serviceConceptId: raw.service_concept_id ?? undefined,
    claveProdServ: raw.clave_prod_serv,
    claveUnidad: raw.clave_unidad,
    unidad: raw.unidad,
    description: raw.description,
    quantity: raw.quantity,
    unitPrice: raw.unit_price,
    amount: raw.amount,
    objectImp: (raw.object_imp ?? "02") as InvoiceConcept["objectImp"],
    ivaRate: raw.iva_rate,
    retainedIvaRate: raw.retained_iva_rate,
    ivaAmount: raw.iva_amount,
    retainedIvaAmount: raw.retained_iva_amount,
  };
}

function toApiInvoiceConcept(concept: InvoiceConcept) {
  return {
    concept_type: concept.conceptType,
    service_concept_id: concept.serviceConceptId,
    clave_prod_serv: concept.claveProdServ,
    clave_unidad: concept.claveUnidad,
    unidad: concept.unidad,
    description: concept.description,
    quantity: concept.quantity,
    unit_price: concept.unitPrice,
    amount: concept.amount,
    object_imp: concept.objectImp,
    iva_rate: concept.ivaRate,
    retained_iva_rate: concept.retainedIvaRate,
  };
}

function mapTripRef(raw: ApiTripRef): InvoiceTripRef {
  return {
    tripId: raw.trip_id,
    tripCode: raw.trip_code,
    clientName: raw.client_name,
    scheduledDeparture: raw.scheduled_departure,
    originCity: raw.origin_city,
    originState: raw.origin_state,
    destinationCity: raw.destination_city,
    destinationState: raw.destination_state,
    baseRate: raw.base_rate,
  };
}

export function mapInvoice(raw: unknown): Invoice {
  const invoice = raw as ApiInvoice;
  return {
    id: invoice.id,
    tenantId: invoice.tenant_id,
    serie: invoice.serie,
    folio: invoice.folio,
    cfdiUuid: invoice.cfdi_uuid,
    invoiceType:
      invoice.invoice_type === "pago" ? "pago" : "ingreso",
    parentInvoiceId: invoice.parent_invoice_id ?? null,
    issuerRfc: invoice.issuer_rfc,
    issuerName: invoice.issuer_name,
    issuerTaxRegime: invoice.issuer_tax_regime,
    issueLocation: invoice.issue_location,
    receiverRfc: invoice.receiver_rfc ?? "",
    receiverName: invoice.receiver_name ?? "",
    cfdiUsage: invoice.cfdi_usage ?? "S01",
    receiverTaxRegime: invoice.receiver_tax_regime ?? "",
    receiverPostalCode: invoice.receiver_postal_code ?? "",
    issuedAt: invoice.issued_at,
    paymentForm: invoice.payment_form ?? "99",
    paymentMethod: invoice.payment_method ?? "PUE",
    currency: invoice.currency ?? "MXN",
    exchangeRate: invoice.exchange_rate ?? 1,
    subtotal: invoice.subtotal ?? 0,
    discount: invoice.discount ?? 0,
    totalTax: invoice.total_tax ?? 0,
    retainedTax: invoice.retained_tax ?? 0,
    total: invoice.total ?? 0,
    status: invoice.status as Invoice["status"],
    satCancellationStatus: invoice.sat_cancellation_status ?? "none",
    satCancellationMessage: invoice.sat_cancellation_message,
    satCancellationUpdatedAt: invoice.sat_cancellation_updated_at,
    pacProvider: invoice.pac_provider,
    xmlContent: null,
    hasStampedXml:
      invoice.has_stamped_xml ?? Boolean(invoice.xml_content),
    qrCode: invoice.qr_code,
    pdfUrl: invoice.pdf_url,
    stampedAt: invoice.stamped_at,
    cancelledAt: invoice.cancelled_at,
    cancellationReason: invoice.cancellation_reason,
    cancellationCode: invoice.cancellation_code,
    replacementCfdiUuid: invoice.replacement_cfdi_uuid,
    notes: invoice.notes,
    trips: (invoice.trips ?? []).map(mapTripRef),
    concepts: (invoice.concepts ?? []).map(mapInvoiceConcept),
    payments: (invoice.payments ?? []).map(mapPayment),
    totalPaid: invoice.total_paid,
    balanceDue: invoice.balance_due,
    canSubstituteInvoice: invoice.can_substitute_invoice ?? false,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
    createdBy: invoice.created_by,
    updatedBy: invoice.updated_by ?? null,
    createdByName: invoice.created_by_name ?? null,
    updatedByName: invoice.updated_by_name ?? null,
  };
}

export function mapInvoiceListItem(raw: unknown): InvoiceListItem {
  const item = raw as ApiInvoiceListItem;
  return {
    id: item.id,
    tenantId: item.tenant_id,
    serie: item.serie,
    folio: item.folio,
    cfdiUuid: item.cfdi_uuid,
    receiverRfc: item.receiver_rfc,
    receiverName: item.receiver_name,
    issuedAt: item.issued_at,
    paymentForm: item.payment_form,
    paymentMethod: item.payment_method,
    currency: item.currency,
    subtotal: item.subtotal,
    totalTax: item.total_tax,
    total: item.total,
    status: item.status as InvoiceListItem["status"],
    satCancellationStatus: item.sat_cancellation_status ?? "none",
    satCancellationMessage: item.sat_cancellation_message,
    stampedAt: item.stamped_at,
    tripCount: item.trip_count,
    tripCodes: item.trip_codes ?? [],
    totalPaid: item.total_paid,
    balanceDue: item.balance_due,
    createdAt: item.created_at,
    createdByName: item.created_by_name,
  };
}

export function mapInvoicePrefill(raw: unknown): InvoicePrefill {
  const prefill = raw as ApiInvoicePrefill;
  return {
    issuerRfc: prefill.issuer_rfc,
    issuerName: prefill.issuer_name,
    issuerTaxRegime: prefill.issuer_tax_regime,
    issueLocation: prefill.issue_location,
    receiverRfc: prefill.receiver_rfc,
    receiverName: prefill.receiver_name,
    receiverTaxRegime: prefill.receiver_tax_regime,
    receiverPostalCode: prefill.receiver_postal_code,
    cfdiUsage: prefill.cfdi_usage,
    serie: prefill.serie,
    paymentForm: prefill.payment_form,
    paymentMethod: prefill.payment_method,
    currency: prefill.currency,
    subtotal: prefill.subtotal,
    taxRate: prefill.tax_rate,
    totalTax: prefill.total_tax,
    retainedTax: prefill.retained_tax ?? 0,
    retainedTaxRate: prefill.retained_tax_rate ?? 0,
    total: prefill.total,
    clientType: prefill.client_type ?? "individual",
    tripId: prefill.trip_id,
    tripCode: prefill.trip_code,
    suggestedConcepts: (prefill.suggested_concepts ?? []).map(mapInvoiceConcept),
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
    concepts: payload.concepts?.map(toApiInvoiceConcept),
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
    concepts: payload.concepts?.map(toApiInvoiceConcept),
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

type ApiSubstitutionCorrectionsBody = Record<
  string,
  string | number | boolean | ReturnType<typeof toApiInvoiceConcept>[]
> & {
  concepts?: ReturnType<typeof toApiInvoiceConcept>[];
  trip_corrections?: Array<{
    trip_id: string;
    stop_id?: string;
    rfc_remitente_destinatario?: string;
    nombre_remitente_destinatario?: string;
    driver_id?: string;
    vehicle_id?: string;
    address_id?: string;
    stop_address?: Record<string, unknown>;
    reason: string;
    propagate_to_client?: boolean;
  }>;
};

function toApiSubstitutionCorrections(
  corrections: NonNullable<SubstituteStampedInvoicePayload["corrections"]>,
): ApiSubstitutionCorrectionsBody {
  const body: ApiSubstitutionCorrectionsBody = {};
  if (corrections.receiverRfc !== undefined) {
    body.receiver_rfc = corrections.receiverRfc;
  }
  if (corrections.receiverName !== undefined) {
    body.receiver_name = corrections.receiverName;
  }
  if (corrections.receiverTaxRegime !== undefined) {
    body.receiver_tax_regime = corrections.receiverTaxRegime;
  }
  if (corrections.receiverPostalCode !== undefined) {
    body.receiver_postal_code = corrections.receiverPostalCode;
  }
  if (corrections.cfdiUsage !== undefined) {
    body.cfdi_usage = corrections.cfdiUsage;
  }
  if (corrections.paymentForm !== undefined) {
    body.payment_form = corrections.paymentForm;
  }
  if (corrections.paymentMethod !== undefined) {
    body.payment_method = corrections.paymentMethod;
  }
  if (corrections.subtotal !== undefined) {
    body.subtotal = corrections.subtotal;
  }
  if (corrections.discount !== undefined) {
    body.discount = corrections.discount;
  }
  if (corrections.totalTax !== undefined) {
    body.total_tax = corrections.totalTax;
  }
  if (corrections.retainedTax !== undefined) {
    body.retained_tax = corrections.retainedTax;
  }
  if (corrections.total !== undefined) {
    body.total = corrections.total;
  }
  if (corrections.concepts?.length) {
    body.concepts = corrections.concepts.map(toApiInvoiceConcept);
  }
  if (corrections.tripCorrections?.length) {
    body.trip_corrections = corrections.tripCorrections.map((entry) => ({
      trip_id: entry.tripId,
      ...(entry.stopId ? { stop_id: entry.stopId } : {}),
      ...(entry.rfcRemitenteDestinatario !== undefined
        ? { rfc_remitente_destinatario: entry.rfcRemitenteDestinatario }
        : {}),
      ...(entry.nombreRemitenteDestinatario !== undefined
        ? { nombre_remitente_destinatario: entry.nombreRemitenteDestinatario }
        : {}),
      ...(entry.driverId ? { driver_id: entry.driverId } : {}),
      ...(entry.vehicleId ? { vehicle_id: entry.vehicleId } : {}),
      ...(entry.addressId ? { address_id: entry.addressId } : {}),
      ...(entry.stopAddress ? { stop_address: entry.stopAddress } : {}),
      reason: entry.reason,
      ...(entry.propagateToClient !== undefined
        ? { propagate_to_client: entry.propagateToClient }
        : {}),
    }));
  }
  if (corrections.propagateReceiverToClient) {
    body.propagate_receiver_to_client = true;
  }
  return body;
}

export function toApiSubstituteStampedInvoice(
  payload: SubstituteStampedInvoicePayload,
) {
  const body: Record<string, unknown> = {
    cancellation_reason: payload.cancellationReason,
    notes: payload.notes,
  };
  if (payload.corrections) {
    const mapped = toApiSubstitutionCorrections(payload.corrections);
    if (Object.keys(mapped).length > 0) {
      body.corrections = mapped;
    }
  }
  return body;
}

export function toApiCreatePayment(payload: CreatePaymentPayload) {
  const body: Record<string, unknown> = {
    amount: payload.amount,
    currency: payload.currency,
    exchange_rate: payload.exchangeRate,
    payment_date: payload.paymentDate,
    payment_form: payload.paymentForm,
    reference: payload.reference,
    notes: payload.notes,
  };
  if (payload.paymentTime) {
    body.payment_time = payload.paymentTime;
  }
  if (payload.allocations?.length) {
    body.allocations = payload.allocations.map((a) => ({
      ingress_invoice_id: a.ingressInvoiceId,
      amount: a.amount,
    }));
  }
  if (payload.confirmChainRepair) {
    body.confirm_chain_repair = true;
  }
  return body;
}
