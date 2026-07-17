/**
 * Trip Domain Inputs
 * Clean Architecture - Domain Layer
 *
 * Tipos para crear y actualizar entidades.
 * Estos tipos se usan en UseCases y se envían al backend.
 *
 * PATRÓN:
 * - Todo en camelCase
 * - El apiClient convierte automáticamente a snake_case
 * - NO se necesitan funciones toApi*()
 *
 * Ubicación: src/features/trips/domain/inputs.ts
 */

import type {
  TripStatusType,
  StopTypeValue,
  ExpenseCategoryType,
  CargoStatusType,
  CargoMovementTypeValue,
  CurrencyType,
  ExpenseStatusType,
} from "./enums";

export interface CargoSectorRequirementsInput {
  sectorCofepris?: boolean;
  nombreIngredienteActivo?: boolean;
  nomQuimico?: boolean;
  denominacionGenericaProd?: boolean;
  denominacionDistintivaProd?: boolean;
  fabricante?: boolean;
  fechaCaducidad?: boolean;
  loteMedicamento?: boolean;
  formaFarmaceutica?: boolean;
  condicionesEspTransp?: boolean;
  registroSanitarioFolioAutorizacion?: boolean;
  permisoImportacion?: boolean;
  folioImpoVucem?: boolean;
  numCas?: boolean;
  razonSocialEmpImp?: boolean;
  numRegSanPlagCofepris?: boolean;
  datosFabricante?: boolean;
  datosFormulador?: boolean;
  datosMaquilador?: boolean;
  usoAutorizado?: boolean;
}

// ============================================================================
// CARGO MOVEMENT INPUTS
// ============================================================================

/**
 * Input para crear un movimiento de carga
 */
export interface CreateCargoMovementInput {
  stopIndex: number;
  movementType: CargoMovementTypeValue;
  weight?: number;
  units?: number;
  notes?: string;
}

/**
 * Input para completar un movimiento de carga
 */
export interface CompleteCargoMovementInput {
  completedAt?: string; // ISO 8601
  notes?: string;
}

// ============================================================================
// CARGO INPUTS
// ============================================================================

/**
 * Input para crear una carga
 */
export interface CreateCargoInput {
  // Datos básicos
  clientId: string;
  description: string;
  productType?: string;
  weight?: number;
  volume?: number;
  units?: number;
  declaredValue?: number;
  /** SAT: AseguraCarga */
  aseguraCarga?: string;
  /** SAT: PolizaCarga */
  polizaCarga?: string;

  // NOTA: El campo `rate` fue eliminado del input de creación de carga.
  // Para viajes consolidados (LTL multi-cliente), se implementará prorrateo
  // de tarifa por carga en un módulo futuro.

  // Movimientos
  movements?: CreateCargoMovementInput[];

  // Notas
  notes?: string;
  specialInstructions?: string;

  // ── Carta Porte 3.1 — Nodo Mercancía ──────────────────────────
  satProductCode?: string; // c_ClaveProdServCP (8 dígitos)
  satProductDescription?: string;
  satUnitCode?: string; // c_ClaveUnidad (ej: "KGM", "H87", "XBX")
  satUnitName?: string; // Nombre unidad (ej: "Kilogramo", "Pieza")
  currency?: CurrencyType; // Moneda SAT para valor de mercancía (v1: MXN)
  weightInKg?: number; // PesoEnKg (obligatorio para CP)
  dimensions?: string; // Largo/Alto/Ancho (ej: "50/40/30cm")

  // Material peligroso
  hazardousMaterial?: boolean;
  requiresHazmat?: boolean; // Derivado de catálogo SAT
  hazardousMaterialCode?: string; // c_MaterialPeligroso (ej: "1203")
  packagingType?: string; // c_TipoEmbalaje (ej: "4H2")
  packagingDescription?: string;

  // Sectores regulados (Carta Porte 3.1 §6.4)
  sectorRequirements?: CargoSectorRequirementsInput;
  sectorCofepris?: string;
  nombreIngredienteActivo?: string;
  nomQuimico?: string;
  denominacionGenericaProd?: string;
  denominacionDistintivaProd?: string;
  fabricante?: string;
  fechaCaducidad?: string;
  loteMedicamento?: string;
  formaFarmaceutica?: string;
  condicionesEspTransp?: string;
  registroSanitarioFolioAutorizacion?: string;
  permisoImportacion?: string;
  folioImpoVucem?: string;
  numCas?: string;
  razonSocialEmpImp?: string;
  numRegSanPlagCofepris?: string;
  datosFabricante?: string;
  datosFormulador?: string;
  datosMaquilador?: string;
  usoAutorizado?: string;

  // Comercio exterior (opcional)
  fraccionArancelaria?: string; // 10 dígitos
  uuidComercioExterior?: string;
}

/**
 * Input para actualizar una carga
 */
export interface UpdateCargoInput {
  // Datos básicos
  description?: string;
  productType?: string | null;
  weight?: number | null;
  volume?: number | null;
  units?: number | null;
  declaredValue?: number | null;
  aseguraCarga?: string | null;
  polizaCarga?: string | null;

  // Tarifa
  rate?: number;
  currency?: CurrencyType;

  // Estado
  status?: CargoStatusType;

  // Notas
  notes?: string | null;
  specialInstructions?: string | null;

  // ── Carta Porte 3.1 — Nodo Mercancía ──────────────────────────
  satProductCode?: string | null;
  satProductDescription?: string | null;
  satUnitCode?: string | null;
  satUnitName?: string | null;
  weightInKg?: number | null;
  dimensions?: string | null;

  // Material peligroso
  hazardousMaterial?: boolean | null;
  requiresHazmat?: boolean | null;
  hazardousMaterialCode?: string | null;
  packagingType?: string | null;
  packagingDescription?: string | null;

  // Sectores regulados
  sectorRequirements?: CargoSectorRequirementsInput | null;
  sectorCofepris?: string | null;
  nombreIngredienteActivo?: string | null;
  nomQuimico?: string | null;
  denominacionGenericaProd?: string | null;
  denominacionDistintivaProd?: string | null;
  fabricante?: string | null;
  fechaCaducidad?: string | null;
  loteMedicamento?: string | null;
  formaFarmaceutica?: string | null;
  condicionesEspTransp?: string | null;
  registroSanitarioFolioAutorizacion?: string | null;
  permisoImportacion?: string | null;
  folioImpoVucem?: string | null;
  numCas?: string | null;
  razonSocialEmpImp?: string | null;
  numRegSanPlagCofepris?: string | null;
  datosFabricante?: string | null;
  datosFormulador?: string | null;
  datosMaquilador?: string | null;
  usoAutorizado?: string | null;

  // Comercio exterior
  fraccionArancelaria?: string | null;
  uuidComercioExterior?: string | null;
}

// ============================================================================
// EXPENSE INPUTS
// ============================================================================

/**
 * Input para crear un gasto
 */
export interface CreateExpenseInput {
  // Categorización
  category: ExpenseCategoryType;
  subcategory?: string;

  // Información del gasto
  description: string;
  quantity?: number; // Cantidad (litros, días, etc.)
  unitPrice?: number; // Precio unitario
  amount: number; // Monto total

  // Moneda
  currency?: CurrencyType;
  exchangeRate?: number; // Si es moneda extranjera

  // ── CFDI 4.0 — Datos fiscales ──────────────────────────────────
  satProductCode?: string; // c_ClaveProdServ
  satProductDescription?: string;
  paymentMethod?: string; // c_FormaPago (01, 03, 04, etc.)

  // Fecha y ubicación
  expenseDate?: string | Date; // ISO 8601 o Date
  location?: string;

  // Comprobante
  hasReceipt?: boolean;
  receiptUrl?: string;
  receiptNumber?: string; // Folio

  // CFDI (si es factura)
  cfdiUuid?: string; // UUID del CFDI
  cfdiFolio?: string; // Folio fiscal

  // Proveedor
  vendorName?: string;
  vendorRfc?: string;

  // Estado
  isEstimated?: boolean;

  // Notas
  notes?: string;
}

export type TripInternalStaffRole = "secondary_driver" | "helper";

export interface CreateTripInternalStaffInput {
  employeeId: string;
  /** Rol en ruta; el API lo exige. UX v1: por defecto `helper`. */
  internalRole?: TripInternalStaffRole;
  isPaymentResponsible?: boolean;
  paymentNotes?: string;
}

/**
 * Input para actualizar un gasto
 */
export interface UpdateExpenseInput {
  // Categorización
  category?: ExpenseCategoryType;
  subcategory?: string | null;

  // Información del gasto
  description?: string;
  quantity?: number | null;
  unitPrice?: number | null;
  amount?: number;

  // Moneda
  currency?: CurrencyType;
  exchangeRate?: number | null;

  // ── CFDI 4.0 — Datos fiscales ──────────────────────────────────
  satProductCode?: string | null;
  satProductDescription?: string | null;
  paymentMethod?: string | null;

  // Fecha y ubicación
  expenseDate?: string | Date;
  location?: string | null;

  // Comprobante
  hasReceipt?: boolean;
  receiptUrl?: string | null;
  receiptNumber?: string | null;

  // CFDI
  cfdiUuid?: string | null;
  cfdiFolio?: string | null;

  // Proveedor
  vendorName?: string | null;
  vendorRfc?: string | null;

  // Estado
  status?: ExpenseStatusType;
  isEstimated?: boolean;

  // Notas
  notes?: string | null;
}

// ============================================================================
// STOP INPUTS
// ============================================================================

/**
 * Input para crear una parada
 */
export interface CreateStopInput {
  // Orden y tipo
  sequenceOrder: number;
  stopType: StopTypeValue[];
  /** @deprecated No enviar FK de catálogo en alta; usar snapshot inline + `sourceAddressId`. */
  addressId?: string;
  sourceAddressId?: string;

  // Dirección simplificada
  address: string;
  city: string;
  state?: string;
  postalCode?: string;

  // Coordenadas
  latitude?: number;
  longitude?: number;

  // Información de contacto
  locationName?: string;
  contactName?: string;
  contactPhone?: string;

  // Tiempos estimados (ISO 8601)
  estimatedArrival?: string;
  estimatedDeparture?: string;

  // Notas
  notes?: string;

  // ── Carta Porte 3.1 — Nodo Ubicación / Domicilio ──────────────
  // ID único (formato: OR000001, DE000001) - se puede auto-generar
  idUbicacion?: string;

  // Dirección desglosada
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  colonia?: string;
  reference?: string;

  // Claves SAT (catálogos oficiales)
  satCountryCode?: string; // c_Pais (ej: "MEX")
  satStateCode?: string; // c_Estado (ej: "MEX", "NLE")
  satMunicipalityCode?: string; // c_Municipio (ej: "028")
  satLocalityCode?: string; // c_Localidad
  satNeighborhoodCode?: string; // c_Colonia

  // Datos del remitente/destinatario
  rfcRemitenteDestinatario?: string;
  nombreRemitenteDestinatario?: string;
  destinatarioRfc?: string;
  destinatarioNombre?: string;

  /** @deprecated ADR-0055 — preferir `destinatarioRfc` / envelope CP */
  deliveryRfcRemitenteDestinatario?: string;
  deliveryNombreRemitenteDestinatario?: string;
  remitentePartnerId?: string;
  destinatarioPartnerId?: string;

  // Distancia desde parada anterior (km)
  distanceFromPreviousKm?: number;
  distanceSource?: "manual" | "mapbox_matrix" | "haversine_fallback";
  distanceProvider?: "mapbox" | "stub";
  distanceConfidence?: "high" | "medium" | "low";
  distanceComputedAt?: string;

  // Catálogo (opcional; metadato operativo, no fiscal)
  clientId?: string;
  clientAddressId?: string;
}

/**
 * Input para actualizar una parada
 */
export interface UpdateStopInput {
  // Orden y tipo
  sequenceOrder?: number;
  stopType?: StopTypeValue[];
  addressId?: string | null;

  // Dirección simplificada
  address?: string;
  city?: string;
  state?: string | null;
  postalCode?: string | null;

  // Coordenadas
  latitude?: number | null;
  longitude?: number | null;

  // Información de contacto
  locationName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;

  // Tiempos
  estimatedArrival?: string | null;
  actualArrival?: string | null;
  estimatedDeparture?: string | null;
  actualDeparture?: string | null;

  // Notas
  notes?: string | null;

  // ── Carta Porte 3.1 — Nodo Ubicación / Domicilio ──────────────
  idUbicacion?: string | null;
  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  colonia?: string | null;
  reference?: string | null;

  // Claves SAT
  satCountryCode?: string | null;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
  satLocalityCode?: string | null;
  satNeighborhoodCode?: string | null;

  // Datos del remitente/destinatario
  rfcRemitenteDestinatario?: string | null;
  nombreRemitenteDestinatario?: string | null;

  deliveryRfcRemitenteDestinatario?: string | null;
  deliveryNombreRemitenteDestinatario?: string | null;
  remitentePartnerId?: string | null;
  destinatarioPartnerId?: string | null;

  // Distancia
  distanceFromPreviousKm?: number | null;
  distanceSource?: "manual" | "mapbox_matrix" | "haversine_fallback" | null;
  distanceProvider?: "mapbox" | "stub" | null;
  distanceConfidence?: "high" | "medium" | "low" | null;
  distanceComputedAt?: string | null;

  // Catálogo (opcional)
  clientId?: string | null;
  clientAddressId?: string | null;
}

// ============================================================================
// TRIP INPUTS
// ============================================================================

/**
 * Input para crear un viaje (completo con detalles)
 */
export interface CreateTripInput {
  // Recursos asignados
  vehicleId: string;
  driverId: string;
  clientId?: string;
  originBranchId?: string;

  /** Intención CFDI (Ingreso vs Traslado) — UX y futuro timbrado. */
  cfdiDocumentIntent?: "ingreso" | "traslado";

  // Fechas programadas
  scheduledDeparture: string; // ISO 8601
  scheduledArrival?: string;

  // Kilometraje inicial
  startMileage?: number;

  // Origen
  originCity: string;
  originState?: string;

  // Destino
  destinationCity: string;
  destinationState?: string;

  // Resumen de carga (legacy)
  cargoDescription?: string;
  cargoWeight?: number;
  cargoVolume?: number;
  cargoUnits?: number;
  cargoValue?: number;

  // Tarifa base
  baseRate?: number;

  // Notas
  notes?: string;

  // ── Carta Porte 3.1 ──────────────────────────────────────────
  numTotalMercancias?: number;
  pesoBrutoTotal?: number;
  unidadPeso?: string;

  // Paradas
  stops?: CreateStopInput[];

  // Cargas
  cargos?: CreateCargoInput[];

  // Gastos estimados
  estimatedExpenses?: CreateExpenseInput[];

  // Equipo de apoyo interno (no se incluye en Carta Porte)
  internalStaff?: CreateTripInternalStaffInput[];

  // Opciones de comportamiento
  options?: {
    scheduleAfterCreate?: boolean;
    startImmediately?: boolean;
    startMileage?: number;
  };

  /** Flag transitorio: permite asignar activos con documentación vencida. */
  allowExpiredDocs?: boolean;
}

/**
 * Input para actualizar un viaje
 */
export interface UpdateTripInput {
  // Recursos asignados
  vehicleId?: string;
  driverId?: string;
  clientId?: string | null;
  originBranchId?: string | null;

  cfdiDocumentIntent?: "ingreso" | "traslado";

  // Fechas programadas
  scheduledDeparture?: string;
  scheduledArrival?: string | null;

  // Origen
  originCity?: string;
  originState?: string | null;

  // Destino
  destinationCity?: string;
  destinationState?: string | null;

  // Resumen de carga (legacy)
  cargoDescription?: string | null;
  cargoWeight?: number | null;
  cargoVolume?: number | null;
  cargoUnits?: number | null;
  cargoValue?: number | null;

  // Tarifa
  baseRate?: number;

  // Notas
  notes?: string | null;

  // ── Carta Porte 3.1 ──────────────────────────────────────────
  totalDistRec?: number | null;
  numTotalMercancias?: number | null;
  pesoBrutoTotal?: number | null;
  unidadPeso?: string | null;

  // Equipo de apoyo interno (reemplazo completo)
  internalStaff?: CreateTripInternalStaffInput[];

  /** Reemplazo completo de paradas (si el backend lo soporta en PUT /trips/:id) */
  stops?: CreateStopInput[];

  /** Reemplazo completo de cargas */
  cargos?: CreateCargoInput[];

  /** Gastos estimados (reemplazo o merge según API) */
  estimatedExpenses?: CreateExpenseInput[];

  /** Flag transitorio: permite asignar activos con documentación vencida. */
  allowExpiredDocs?: boolean;
}

/**
 * Input para actualizar el estado de un viaje
 */
export interface UpdateTripStatusInput {
  status: TripStatusType;
  mileage?: number;
  latitude?: number;
  longitude?: number;
  reason?: string;
}

/**
 * Input para cancelar un viaje
 */
export interface CancelTripInput {
  reason: string;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Resultado de crear un viaje con detalles
 */
export interface CreateTripResult {
  tripId: string;
  tripCode: string;
  stopsCreated: number;
  cargosCreated: number;
  expensesCreated: number;
  finalStatus: TripStatusType;
}

/**
 * Resultado paginado genérico
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
