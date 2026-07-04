/**
 * Trip Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del negocio (readonly) que representan el estado actual.
 * Estas son las estructuras que se reciben del backend y se usan en la UI.
 *
 * NOTA: Los tipos para crear/actualizar están en inputs.ts
 *
 * Ubicación: src/features/trips/domain/entities.ts
 */

import type {
  TripStatusType,
  StopTypeValue,
  StopStatusValue,
  ExpenseCategoryType,
  ExpenseStatusType,
  CargoStatusType,
  CargoMovementTypeValue,
  CurrencyType,
} from "./enums";

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface Mileage {
  readonly start: number | null;
  readonly end: number | null;
}

export interface CargoInfo {
  readonly description: string | null;
  readonly weight: number | null;
  readonly volume: number | null;
  readonly units: number | null;
  readonly value: number | null;
}

export interface CostBreakdown {
  readonly baseRate: number;
  readonly fuelCost: number;
  readonly tollCost: number;
  readonly otherCosts: number;
  readonly totalCost: number;
}

export interface DetailedCostBreakdown {
  readonly fuel: number;
  readonly tolls: number;
  readonly driverAllowance: number;
  readonly lodging: number;
  readonly loadingUnloading: number;
  readonly parking: number;
  readonly maintenance: number;
  readonly insurance: number;
  readonly permits: number;
  readonly other: number;
  readonly totalExpenses: number;
}

export interface TripProfitability {
  readonly totalRevenue: number;
  readonly totalExpenses: number;
  readonly grossProfit: number;
  readonly profitMargin: number;
  readonly revenuePerKm: number | null;
  readonly costPerKm: number | null;
  readonly isEstimated: boolean;
}

// ============================================================================
// REFERENCE ENTITIES (para relaciones)
// ============================================================================

export interface VehicleRef {
  readonly id: string;
  readonly unitNumber: string;
  readonly licensePlate: string;
}

export interface DriverRef {
  readonly id: string;
  readonly fullName: string;
}

export interface ClientRef {
  readonly id: string;
  readonly legalName: string;
}

export interface TripInternalStaff {
  readonly id: string;
  readonly tripId: string;
  readonly employeeId: string;
  /** Rol en ruta (`null` si el API no envía valor reconocido). */
  readonly internalRole: "secondary_driver" | "helper" | null;
  readonly employeeFullName: string;
  readonly employeeNumber: string | null;
  readonly employeeStatus: string | null;
  readonly isPaymentResponsible: boolean;
  readonly paymentNotes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type TripInvoiceStatus =
  | "draft"
  | "stamped"
  | "cancellation_pending"
  | "cancelled";

/**
 * Contexto devuelto por el API al cancelar un viaje con CFDI vigente u operaciones fiscales pendientes.
 */
export interface TripFiscalActionRequired {
  readonly invoiceId: string;
  readonly invoiceStatus: TripInvoiceStatus;
  readonly cfdiUuid: string | null;
  readonly suggestedActions?: readonly string[];
}

export interface TripInvoicing {
  readonly hasActiveInvoice: boolean;
  readonly canGenerateInvoice: boolean;
  readonly invoiceId: string | null;
  readonly invoiceFolio: string | null;
  /** UUID del CFDI timbrado (solo lectura / operación fiscal). */
  readonly invoiceCfdiUuid: string | null;
  readonly invoiceStatus: TripInvoiceStatus | null;
  readonly blockReason: string | null;
}

// ============================================================================
// CARGO MOVEMENT ENTITY
// ============================================================================

/**
 * Movimiento de Carga
 *
 * Conecta una carga con una parada (pickup o delivery parcial/total).
 * Una carga tiene 1 pickup y 0..N deliveries.
 */
export interface CargoMovement {
  readonly id?: string;
  readonly cargoId?: string;
  readonly stopId?: string;
  readonly stopIndex: number;
  readonly movementType: CargoMovementTypeValue;
  readonly weight: number | null;
  readonly units: number | null;
  readonly completedAt: Date | null;
  readonly notes: string | null;
}

// ============================================================================
// TRIP CARGO ENTITY
// ============================================================================

/**
 * Carga (Cargo/Shipment)
 * Mercancía asociada a un viaje con movimientos pickup/delivery.
 */
export interface TripCargo {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly clientId: string;
  readonly client?: ClientRef;

  // Información básica
  readonly description: string;
  readonly productType: string | null;
  readonly weight: number | null;
  readonly volume: number | null;
  readonly units: number | null;
  readonly declaredValue: number | null;
  /** Aseguradora de la carga (SAT: AseguraCarga) */
  readonly aseguraCarga: string | null;
  /** Póliza del seguro de la carga (SAT: PolizaCarga) */
  readonly polizaCarga: string | null;

  // Tarifa
  readonly rate: number;
  readonly currency: CurrencyType;

  // Movimientos (pickup/delivery)
  readonly movements: CargoMovement[];

  // Estado
  readonly status: CargoStatusType;
  readonly pickedUpAt: Date | null;
  readonly deliveredAt: Date | null;
  readonly notes: string | null;
  readonly specialInstructions: string | null;

  // ── Carta Porte 3.1 — Nodo Mercancía ──────────────────────────
  readonly satProductCode: string | null; // c_ClaveProdServCP (8 dígitos)
  readonly satProductDescription: string | null; // Descripción del catálogo SAT
  readonly satUnitCode: string | null; // c_ClaveUnidad (ej: "KGM", "H87")
  readonly satUnitName: string | null; // Nombre unidad (ej: "Kilogramo")
  readonly weightInKg: number | null; // PesoEnKg (obligatorio CP)
  readonly dimensions: string | null; // Largo/Alto/Ancho (ej: "50/40/30cm")

  // Material peligroso
  readonly hazardousMaterial: boolean | null;
  readonly requiresHazmat: boolean;
  readonly hazardousMaterialCode: string | null; // c_MaterialPeligroso
  readonly packagingType: string | null; // c_TipoEmbalaje
  readonly packagingDescription: string | null;

  // Sectores regulados (Carta Porte 3.1 §6.4)
  readonly sectorRequirements: Record<string, boolean> | null;
  readonly sectorCofepris: string | null;
  readonly nombreIngredienteActivo: string | null;
  readonly nomQuimico: string | null;
  readonly denominacionGenericaProd: string | null;
  readonly denominacionDistintivaProd: string | null;
  readonly fabricante: string | null;
  readonly fechaCaducidad: string | null;
  readonly loteMedicamento: string | null;
  readonly formaFarmaceutica: string | null;
  readonly condicionesEspTransp: string | null;
  readonly registroSanitarioFolioAutorizacion: string | null;
  readonly permisoImportacion: string | null;
  readonly folioImpoVucem: string | null;
  readonly numCas: string | null;
  readonly razonSocialEmpImp: string | null;
  readonly numRegSanPlagCofepris: string | null;
  readonly datosFabricante: string | null;
  readonly datosFormulador: string | null;
  readonly datosMaquilador: string | null;
  readonly usoAutorizado: string | null;

  // Documentación aduanera (comercio exterior)
  readonly fraccionArancelaria: string | null; // 10 dígitos
  readonly uuidComercioExterior: string | null;

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

// ============================================================================
// TRIP EXPENSE ENTITY
// ============================================================================

/**
 * Gasto del Viaje (TripExpense)
 */
export interface TripExpense {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;

  // Categorización
  readonly category: ExpenseCategoryType;
  readonly subcategory: string | null;

  // ── Carta Porte 3.1 / CFDI 4.0 — Datos fiscales ──────────────
  readonly satProductCode: string | null; // c_ClaveProdServ (para CFDI)
  readonly satProductDescription: string | null;

  // Información del gasto
  readonly description: string;
  readonly quantity: number | null; // Cantidad (litros, días, etc.)
  readonly unitPrice: number | null; // Precio unitario
  readonly amount: number; // Monto total
  readonly currency: CurrencyType;
  readonly exchangeRate: number | null; // Si es moneda extranjera

  // Forma de pago (SAT)
  readonly paymentMethod: string | null; // c_FormaPago

  // Fecha y ubicación
  readonly expenseDate: Date;
  readonly location: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;

  // Comprobante/Ticket
  readonly hasReceipt: boolean;
  readonly receiptUrl: string | null;
  readonly receiptNumber: string | null; // Folio

  // CFDI (si es factura)
  readonly cfdiUuid: string | null; // UUID del CFDI
  readonly cfdiFolio: string | null; // Folio fiscal

  // Proveedor
  readonly vendorName: string | null;
  readonly vendorRfc: string | null;

  // Estado y aprobación
  readonly status: ExpenseStatusType;
  readonly isEstimated: boolean;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly rejectionReason: string | null;

  // Notas
  readonly notes: string | null;

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

// ============================================================================
// TRIP STOP ENTITY
// ============================================================================

/**
 * Parada de viaje (TripStop)
 */
export interface TripStop {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly sequenceOrder: number;
  readonly stopType: StopTypeValue[];
  readonly addressId: string | null;

  // Catálogo de clientes (solo operativo / UI; no Carta Porte)
  readonly clientId: string | null;
  readonly clientAddressId: string | null;

  // Dirección simplificada (texto libre)
  readonly address: string;
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string | null;

  // Coordenadas
  readonly latitude: number | null;
  readonly longitude: number | null;

  // Información de contacto
  readonly locationName: string | null;
  readonly contactName: string | null;
  readonly contactPhone: string | null;

  // Tiempos
  readonly estimatedArrival: Date | null;
  readonly actualArrival: Date | null;
  readonly estimatedDeparture: Date | null;
  readonly actualDeparture: Date | null;

  // Estado
  readonly status: StopStatusValue;
  readonly notes: string | null;

  // ── Carta Porte 3.1 — Nodo Ubicación / Domicilio ──────────────
  // ID único para CP (formato: OR000001, DE000001)
  readonly idUbicacion: string | null;

  // Dirección desglosada
  readonly street: string | null;
  readonly exteriorNumber: string | null;
  readonly interiorNumber: string | null;
  readonly colonia: string | null;
  readonly reference: string | null;

  // Claves SAT (catálogos oficiales)
  readonly satCountryCode: string | null; // c_Pais (ej: "MEX")
  readonly satEstadoCode: string | null; // c_Estado (ej: "MEX", "NLE")
  readonly satMunicipioCode: string | null; // c_Municipio (ej: "028")
  readonly satLocalidadCode: string | null; // c_Localidad (ej: "05")
  readonly satColoniaCode: string | null; // c_Colonia (ej: "0001")

  // Datos del remitente/destinatario
  readonly rfcRemitenteDestinatario: string | null;
  readonly nombreRemitenteDestinatario: string | null;
  readonly destinatarioRfc?: string | null;
  readonly destinatarioNombre?: string | null;

  /** @deprecated ADR-0055 — dual-read legacy en `trip_stops` */
  readonly deliveryRfcRemitenteDestinatario: string | null;
  readonly deliveryNombreRemitenteDestinatario: string | null;

  /** Dirección catálogo origen del snapshot (auditoría). */
  readonly sourceAddressId?: string | null;

  /** FK catálogo partners + snapshot arriba (compatibilidad si el catálogo cambia). */
  readonly remitentePartnerId: string | null;
  readonly destinatarioPartnerId: string | null;

  // Distancia (obligatorio para destinos en CP)
  readonly distanceFromPreviousKm: number | null;
  readonly distanceSource:
    | "manual"
    | "mapbox_matrix"
    | "haversine_fallback"
    | null;
  readonly distanceProvider: "mapbox" | "stub" | null;
  readonly distanceConfidence: "high" | "medium" | "low" | null;
  readonly distanceComputedAt: Date | null;

  /** Resumen UI de acción de carga en la parada (opcional, backend) */
  readonly cargoActionDescription?: string | null;

  // Cargas en esta parada (opcional, para vistas)
  readonly cargos?: TripCargo[];

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// TRIP STATUS HISTORY ENTITY
// ============================================================================

/**
 * Historial de estado del viaje
 */
export interface TripStatusHistory {
  readonly id: string;
  readonly tripId: string;
  readonly previousStatus: TripStatusType | null;
  readonly newStatus: TripStatusType;
  readonly changedBy: string | null;
  readonly changedByName: string | null;
  readonly changedAt: Date;
  readonly mileage: number | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly reason: string | null;
}

// ============================================================================
// TRIP ENTITY (Aggregate Root)
// ============================================================================

/**
 * Viaje (Trip) - Aggregate Root
 */
export interface Trip {
  readonly id: string;
  readonly tenantId: string;
  readonly tripCode: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly clientId: string | null;

  // Fechas programadas
  readonly scheduledDeparture: Date;
  readonly scheduledArrival: Date | null;

  // Fechas reales
  readonly actualDeparture: Date | null;
  readonly actualArrival: Date | null;

  // Kilometraje
  readonly mileage: Mileage;

  // Ubicaciones (resumen operativo)
  readonly originCity: string;
  readonly originState: string | null;
  readonly destinationCity: string;
  readonly destinationState: string | null;

  // Resumen de carga (legacy)
  readonly cargo: CargoInfo;

  // Costos
  readonly costs: CostBreakdown;
  readonly detailedCosts: DetailedCostBreakdown | null;
  readonly profitability: TripProfitability | null;

  // Estado
  readonly status: TripStatusType;
  readonly notes: string | null;
  readonly cancellationReason: string | null;
  readonly invoicing: TripInvoicing;
  /** Marca operativa: el viaje requiere acción fiscal (SAT / facturación). */
  readonly requiresFiscalAttention: boolean;
  /**
   * Contexto puntual tras mutación (p. ej. cancelación con CFDI vigente).
   * En lecturas normales suele ser null.
   */
  readonly fiscalActionRequired: TripFiscalActionRequired | null;

  // ── Carta Porte 3.1 — Datos del complemento ──────────────────
  readonly totalDistRec: number | null; // Distancia total recorrida (km)
  readonly idCcp: string | null; // UUID del complemento (auto-generado)

  /**
   * Intención del CFDI asociado al viaje (orientación operativa / UX).
   * Validación fiscal definitiva la realiza el PAC al timbrar.
   */
  readonly cfdiDocumentIntent: "ingreso" | "traslado";

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
  readonly createdByName: string | null;
  readonly updatedByName: string | null;

  // Relaciones (opcionales, se cargan según contexto)
  readonly vehicle?: VehicleRef;
  readonly driver?: DriverRef;
  readonly client?: ClientRef;
  readonly internalStaff?: TripInternalStaff[];
  readonly stops?: TripStop[];
  readonly cargos?: TripCargo[];
  readonly expenses?: TripExpense[];
  readonly statusHistory?: TripStatusHistory[];
}

// ============================================================================
// LIST ITEM (para listados con datos resumidos)
// ============================================================================

export interface TripListItem {
  readonly id: string;
  readonly tripCode: string;
  readonly vehicle: VehicleRef;
  readonly driver: DriverRef;
  readonly client: ClientRef | null;
  readonly originCity: string;
  readonly originState: string | null;
  readonly destinationCity: string;
  readonly destinationState: string | null;
  readonly scheduledDeparture: Date;
  readonly scheduledArrival: Date | null;
  readonly status: TripStatusType;
  readonly cargoDescription: string | null;
  readonly baseRate: number;
  readonly totalCost: number;
  readonly totalRevenue: number;
  readonly estimatedProfit: number;
  readonly cargoCount: number;
  readonly clientCount: number;
  readonly invoicing: TripInvoicing;
  readonly requiresFiscalAttention: boolean;
  readonly internalStaffEmployeeIds?: readonly string[];
  readonly createdAt: Date;
}

// ============================================================================
// DETAIL VIEW (extiende Trip con relaciones garantizadas)
// ============================================================================

export interface TripDetail extends Trip {
  readonly vehicle: VehicleRef;
  readonly driver: DriverRef;
  readonly client: ClientRef | undefined;
  readonly stops: TripStop[];
  readonly cargos: TripCargo[];
  readonly expenses: TripExpense[];
  readonly statusHistory: TripStatusHistory[];
  readonly profitability: TripProfitability;
}

// ============================================================================
// SUMMARY TYPES
// ============================================================================

/**
 * Resumen de gastos de un viaje
 */
export interface ExpensesSummary {
  readonly total: number;
  readonly byCategory: Record<string, number>;
  readonly estimatedCount: number;
  readonly pendingCount: number;
}

/**
 * Resumen de cargas de un viaje
 */
export interface CargosSummary {
  readonly totalCargos: number;
  readonly totalWeight: number;
  readonly totalUnits: number;
  readonly totalRevenue: number;
  readonly pendingCount: number;
  readonly deliveredCount: number;
}
