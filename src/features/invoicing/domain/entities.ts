/**
 * Invoicing Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Tipos e interfaces del módulo de facturación.
 * Sin dependencias de infraestructura.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type InvoiceStatus =
  | "draft"
  | "stamped"
  | "cancellation_pending"
  | "cancelled";

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  stamped: "Timbrada",
  cancellation_pending: "Cancelación pendiente",
  cancelled: "Cancelada",
};

// ============================================================================
// ENTITIES
// ============================================================================

export interface Invoice {
  readonly id: string;
  readonly tenantId: string;
  // Foliación
  readonly serie: string;
  readonly folio: number;
  readonly cfdiUuid: string | null;
  readonly invoiceType: "ingreso" | "pago";
  readonly parentInvoiceId: string | null;
  // Emisor
  readonly issuerRfc: string;
  readonly issuerName: string;
  readonly issuerTaxRegime: string;
  readonly issueLocation: string;
  // Receptor
  readonly receiverRfc: string;
  readonly receiverName: string;
  readonly cfdiUsage: string;
  readonly receiverTaxRegime: string;
  readonly receiverPostalCode: string;
  // CFDI
  readonly issuedAt: string;
  readonly paymentForm: string;
  readonly paymentMethod: string;
  readonly currency: string;
  readonly exchangeRate: number;
  // Importes
  readonly subtotal: number;
  readonly discount: number;
  readonly totalTax: number;
  readonly retainedTax: number;
  readonly total: number;
  // Estado
  readonly status: InvoiceStatus;
  readonly satCancellationStatus: string;
  readonly satCancellationMessage: string | null;
  readonly satCancellationUpdatedAt: string | null;
  readonly pacProvider: string | null;
  readonly xmlContent: string | null;
  readonly hasStampedXml: boolean;
  readonly qrCode: string | null;
  readonly pdfUrl: string | null;
  readonly stampedAt: string | null;
  // Cancelación
  readonly cancelledAt: string | null;
  readonly cancellationReason: string | null;
  readonly cancellationCode: string | null;
  readonly replacementCfdiUuid: string | null;
  // Notas
  readonly notes: string | null;
  // Viajes vinculados
  readonly trips: InvoiceTripRef[];
  /** Partidas CFDI (ADR-0061). */
  readonly concepts: InvoiceConcept[];
  // Pagos
  readonly payments: Payment[];
  readonly totalPaid: number;
  readonly balanceDue: number;
  /** API (getById): si aplica sustitución transaccional Fase 5. */
  readonly canSubstituteInvoice?: boolean;
  // Auditoría
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
  /** Nombre completo del usuario creador (LEFT JOIN users). */
  readonly createdByName: string | null;
  /** Nombre completo del usuario que realizó la última actualización. */
  readonly updatedByName: string | null;
}

export interface InvoiceListItem {
  readonly id: string;
  readonly tenantId: string;
  readonly serie: string;
  readonly folio: number;
  readonly cfdiUuid: string | null;
  readonly receiverRfc: string;
  readonly receiverName: string;
  readonly issuedAt: string;
  readonly paymentForm: string;
  readonly paymentMethod: string;
  readonly currency: string;
  readonly subtotal: number;
  readonly totalTax: number;
  readonly total: number;
  readonly status: InvoiceStatus;
  readonly satCancellationStatus: string;
  readonly satCancellationMessage: string | null;
  readonly stampedAt: string | null;
  readonly tripCount: number;
  readonly tripCodes: string[];
  readonly totalPaid: number;
  readonly balanceDue: number;
  readonly createdAt: string;
  readonly createdByName: string | null;
}

export type InvoiceBillingScope = "primary_transport" | "accessory";

export interface InvoiceTripRef {
  readonly tripId: string;
  readonly tripCode: string;
  readonly clientName: string;
  readonly scheduledDeparture: string;
  /** Resumen de ruta (alineado al listado de viajes). */
  readonly originCity: string;
  readonly originState: string | null;
  readonly destinationCity: string;
  readonly destinationState: string | null;
  /** Tarifa base del viaje (`trips.base_rate`). */
  readonly baseRate: number;
  /** ADR-0068: rol del vínculo viaje↔factura. */
  readonly billingScope: InvoiceBillingScope;
}

export type InvoiceLineConceptType = "flete" | "service";

export interface InvoiceConcept {
  readonly id?: string;
  readonly sortOrder?: number;
  readonly conceptType: InvoiceLineConceptType;
  readonly serviceConceptId?: string;
  readonly claveProdServ: string;
  readonly claveUnidad: string;
  readonly unidad: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
  readonly objectImp: "01" | "02" | "03" | "04";
  readonly ivaRate?: number;
  readonly retainedIvaRate?: number;
  readonly ivaAmount?: number;
  readonly retainedIvaAmount?: number;
}

// ============================================================================
// PAYMENTS
// ============================================================================

export type RepStatus =
  | "not_required"
  | "pending"
  | "stamped"
  | "failed"
  | "restamp_pending"
  | "cancelling"
  | "cancelled";

export interface Payment {
  readonly id: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly currency: string;
  readonly exchangeRate: number;
  readonly amountMxn: number;
  readonly paymentDate: string;
  readonly paymentTime: string;
  readonly paymentForm: string;
  readonly paymentFormName: string | null;
  readonly reference: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly createdByName: string | null;
  /** UUID del CFDI complemento REP (tipo P), si se timbró. */
  readonly repCfdiUuid: string | null;
  readonly repStampedAt: string | null;
  readonly repStatus: RepStatus;
  readonly repAttempts: number;
  readonly repLastError: string | null;
  readonly hasRepXml: boolean;
  readonly repNumParcialidad: number | null;
  readonly repImpSaldoAnt: number | null;
  readonly repImpSaldoInsoluto: number | null;
  readonly repImpPagado: number | null;
}

// ============================================================================
// INVOICE PREFILL
// ============================================================================

export interface InvoicePrefill {
  readonly issuerRfc: string;
  readonly issuerName: string;
  readonly issuerTaxRegime: string;
  readonly issueLocation: string;
  readonly receiverRfc: string;
  readonly receiverName: string;
  readonly receiverTaxRegime: string;
  readonly receiverPostalCode: string;
  readonly cfdiUsage: string;
  readonly serie: string;
  readonly paymentForm: string;
  readonly paymentMethod: string;
  readonly currency: string;
  readonly subtotal: number;
  readonly taxRate: number;
  readonly totalTax: number;
  readonly retainedTax: number;
  readonly retainedTaxRate: number;
  readonly total: number;
  readonly clientType: string;
  readonly tripId: string;
  readonly tripCode: string;
  readonly suggestedConcepts: InvoiceConcept[];
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface InvoicePagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedInvoices {
  readonly data: InvoiceListItem[];
  readonly pagination: InvoicePagination;
}

// ============================================================================
// PAYLOADS (for API calls)
// ============================================================================

export interface CreateInvoicePayload {
  tripIds: string[];
  /** ADR-0068: default primary_transport. */
  billingScope?: InvoiceBillingScope;
  receiverRfc: string;
  receiverName: string;
  cfdiUsage: string;
  receiverTaxRegime: string;
  receiverPostalCode: string;
  paymentForm: string;
  paymentMethod: string;
  currency: string;
  exchangeRate?: number;
  concepts?: InvoiceConcept[];
  subtotal: number;
  discount?: number;
  totalTax: number;
  retainedTax?: number;
  total: number;
  notes?: string;
}

export interface UpdateInvoicePayload {
  receiverRfc?: string;
  receiverName?: string;
  cfdiUsage?: string;
  receiverTaxRegime?: string;
  receiverPostalCode?: string;
  paymentForm?: string;
  paymentMethod?: string;
  currency?: string;
  exchangeRate?: number;
  concepts?: InvoiceConcept[];
  subtotal?: number;
  discount?: number;
  totalTax?: number;
  retainedTax?: number;
  total?: number;
  notes?: string | null;
}

export interface CancelInvoicePayload {
  cancellationReason: string;
  cancellationCode: string;
  replacementCfdiUuid?: string;
}

export interface PaymentAllocationPayload {
  readonly ingressInvoiceId: string;
  readonly amount: number;
}

import type { CreateTripStopAddressInput } from "@boeltech/cfdi-domain/validadores/address";

export interface TripCorrectionEntry {
  readonly tripId: string;
  readonly stopId?: string;
  readonly rfcRemitenteDestinatario?: string;
  readonly nombreRemitenteDestinatario?: string;
  readonly driverId?: string;
  readonly vehicleId?: string;
  readonly addressId?: string;
  readonly stopAddress?: CreateTripStopAddressInput;
  readonly reason: string;
  readonly propagateToClient?: boolean;
}

export interface SubstituteStampedInvoiceCorrections {
  readonly receiverRfc?: string;
  readonly receiverName?: string;
  readonly receiverTaxRegime?: string;
  readonly receiverPostalCode?: string;
  readonly cfdiUsage?: string;
  readonly paymentForm?: string;
  readonly paymentMethod?: "PUE" | "PPD";
  readonly subtotal?: number;
  readonly discount?: number;
  readonly totalTax?: number;
  readonly retainedTax?: number;
  readonly total?: number;
  /** Snapshot completo de partidas del sustituto (ADR-0061 x ADR-0051 §6.1). */
  readonly concepts?: InvoiceConcept[];
  readonly tripCorrections?: TripCorrectionEntry[];
  readonly propagateReceiverToClient?: boolean;
}

export interface SubstituteStampedInvoicePayload {
  readonly cancellationReason: string;
  readonly notes?: string;
  readonly corrections?: SubstituteStampedInvoiceCorrections;
}

export interface SubstituteStampedInvoiceResult {
  readonly replacement: Invoice;
  readonly original: Invoice;
}

export interface CreatePaymentPayload {
  amount: number;
  currency?: string;
  exchangeRate?: number;
  paymentDate: string;
  paymentTime?: string;
  paymentForm: string;
  reference?: string;
  notes?: string;
  /** Opcional; si se omite y hay REP, la API aplica el monto a la factura actual. */
  allocations?: PaymentAllocationPayload[];
  confirmChainRepair?: boolean;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  receiverRfc?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
