/**
 * Trip Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforman respuestas del backend (snake_case) a entidades de dominio (camelCase).
 *
 * PATRÓN:
 * - ApiResponse types: snake_case (tipar respuesta exacta del backend)
 * - map*() functions: snake_case → camelCase
 * - NO hay funciones toApi*() (el apiClient hace deepToSnake automáticamente)
 *
 * Ubicación: src/features/trips/infrastructure/api/mappers.ts
 */

import type { ApiPaginatedResponse, MappedSingleResult } from "@shared/api";
import type {
  Trip,
  TripListItem,
  TripInternalStaff,
  TripStop,
  TripCargo,
  TripExpense,
  CargoMovement,
  TripStatusHistory,
  ExpensesSummary,
  TripFiscalActionRequired,
  //   TripStatusType,
  CurrencyType,
} from "@features/trips/domain";
import type {
  ApiTripResponse,
  ApiTripListItemResponse,
  ApiTripInvoicingResponse,
  ApiTripFiscalActionRequiredResponse,
  ApiTripInternalStaffResponse,
  ApiStopResponse,
  ApiCargoResponse,
  ApiCargoMovementResponse,
  ApiExpenseResponse,
  ApiStatusHistoryResponse,
  ApiCreateTripResponse,
  ApiExpensesSummaryResponse,
} from "./api-types";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convierte un valor que puede venir como string a number
 */
function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}

/**
 * Convierte a number con valor por defecto
 */
function toNumberOrDefault(
  value: string | number | null | undefined,
  defaultValue = 0,
): number {
  const num = toNumber(value);
  return num ?? defaultValue;
}

/**
 * Convierte string ISO a Date o null
 */
function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convierte string ISO a Date (requerido)
 */
function toDate(value: string): Date {
  return new Date(value);
}

function mapApiFiscalActionRequired(
  api: ApiTripFiscalActionRequiredResponse | null | undefined,
): TripFiscalActionRequired | null {
  if (!api) return null;
  return {
    invoiceId: api.invoice_id,
    invoiceStatus: api.invoice_status,
    cfdiUuid: api.cfdi_uuid ?? null,
    suggestedActions:
      api.suggested_actions && api.suggested_actions.length > 0
        ? [...api.suggested_actions]
        : undefined,
  };
}

function mapApiTripInvoicing(
  api: ApiTripInvoicingResponse | undefined,
  tripStatus: Trip["status"],
): Trip["invoicing"] {
  const invoiceId = api?.invoice_id ?? null;
  const invoiceFolio = api?.invoice_folio ?? null;
  const invoiceStatus = api?.invoice_status ?? null;
  const invoiceCfdiUuid = api?.invoice_cfdi_uuid ?? null;
  const hasActivePrimaryInvoice =
    api?.has_active_primary_invoice ?? api?.has_active_invoice ?? false;
  const hasActiveInvoice = hasActivePrimaryInvoice;
  const hasLinkedInvoiceEvidence =
    !!invoiceId ||
    !!invoiceFolio ||
    invoiceStatus !== null ||
    !!invoiceCfdiUuid;
  const canGenerateInvoice =
    api?.can_generate_invoice ??
    (tripStatus === "completed" && !hasActiveInvoice && !hasLinkedInvoiceEvidence);
  const canGenerateAccessoryInvoice =
    api?.can_generate_accessory_invoice ?? hasActivePrimaryInvoice;
  const accessoryInvoices = (api?.accessory_invoices ?? []).map((item) => ({
    id: item.id,
    folio: item.folio,
    status: item.status,
    total: Number(item.total) || 0,
  }));

  return {
    hasActiveInvoice,
    hasActivePrimaryInvoice,
    canGenerateInvoice,
    canGenerateAccessoryInvoice,
    invoiceId,
    invoiceFolio,
    invoiceCfdiUuid,
    invoiceStatus,
    accessoryInvoices,
    blockReason: api?.block_reason ?? null,
  };
}

function mapApiTripInternalStaffRole(
  raw: string | null | undefined,
): "secondary_driver" | "helper" | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = String(raw).toLowerCase().trim();
  if (n === "secondary_driver" || n === "secondary-driver") return "secondary_driver";
  if (n === "helper") return "helper";
  if (["ayudante", "auxiliar", "soporte", "apoyo"].includes(n)) return "helper";
  if (["copiloto", "second_driver", "conductor_secundario"].includes(n)) {
    return "secondary_driver";
  }
  return null;
}

function mapApiTripInternalStaff(
  api: ApiTripInternalStaffResponse,
): TripInternalStaff {
  return {
    id: api.id,
    tripId: api.trip_id,
    employeeId: api.employee_id,
    internalRole: mapApiTripInternalStaffRole(api.internal_role),
    employeeFullName: api.employee_full_name,
    employeeNumber: api.employee_number,
    employeeStatus: api.employee_status,
    isPaymentResponsible: api.is_payment_responsible,
    paymentNotes: api.payment_notes,
    createdAt: toDate(api.created_at),
    updatedAt: toDate(api.updated_at),
  };
}

// ============================================================================
// CARGO MOVEMENT MAPPER
// ============================================================================

/**
 * Mapea movimiento de carga de API a dominio
 */
export function mapApiCargoMovement(
  api: ApiCargoMovementResponse,
): CargoMovement {
  return {
    id: api.id,
    cargoId: api.cargo_id,
    stopId: api.stop_id,
    stopIndex: api.stop_index,
    movementType: api.movement_type,
    weight: api.weight,
    units: api.units,
    completedAt: toDateOrNull(api.completed_at),
    notes: api.notes,
  };
}

// ============================================================================
// CARGO MAPPER
// ============================================================================

/**
 * Mapea carga de API a dominio
 */
export function mapApiCargo(api: ApiCargoResponse): TripCargo {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,
    clientId: api.client_id,
    client: api.client
      ? {
          id: api.client.id,
          legalName: api.client.legal_name,
        }
      : undefined,

    // Información básica
    description: api.description,
    productType: api.product_type,
    weight: api.weight,
    volume: api.volume,
    units: api.units,
    declaredValue: api.declared_value,
    aseguraCarga: api.asegura_carga ?? null,
    polizaCarga: api.poliza_carga ?? null,

    // Tarifa
    rate: api.rate,
    currency: api.currency as CurrencyType,

    // Movimientos
    movements: api.movements?.map(mapApiCargoMovement) ?? [],

    // Estado
    status: api.status,
    pickedUpAt: toDateOrNull(api.picked_up_at),
    deliveredAt: toDateOrNull(api.delivered_at),
    notes: api.notes,
    specialInstructions: api.special_instructions,

    // Carta Porte 3.1
    satProductCode: api.sat_product_code,
    satProductDescription: api.sat_product_description,
    satUnitCode: api.sat_unit_code,
    satUnitName: api.sat_unit_name,
    weightInKg: api.weight_in_kg,
    dimensions: api.dimensions,

    // Material peligroso
    hazardousMaterial: api.hazardous_material,
    requiresHazmat: api.requires_hazmat ?? false,
    hazardousMaterialCode: api.hazardous_material_code,
    packagingType: api.packaging_type,
    packagingDescription: api.packaging_description,

    // Sectores regulados (Carta Porte 3.1 §6.4)
    sectorRequirements: api.sector_requirements ?? null,
    sectorCofepris: api.sector_cofepris ?? null,
    nombreIngredienteActivo: api.nombre_ingrediente_activo ?? null,
    nomQuimico: api.nom_quimico ?? null,
    denominacionGenericaProd: api.denominacion_generica_prod ?? null,
    denominacionDistintivaProd: api.denominacion_distintiva_prod ?? null,
    fabricante: api.fabricante ?? null,
    fechaCaducidad: api.fecha_caducidad ?? null,
    loteMedicamento: api.lote_medicamento ?? null,
    formaFarmaceutica: api.forma_farmaceutica ?? null,
    condicionesEspTransp: api.condiciones_esp_transp ?? null,
    registroSanitarioFolioAutorizacion:
      api.registro_sanitario_folio_autorizacion ?? null,
    permisoImportacion: api.permiso_importacion ?? null,
    folioImpoVucem: api.folio_impo_vucem ?? null,
    numCas: api.num_cas ?? null,
    razonSocialEmpImp: api.razon_social_emp_imp ?? null,
    numRegSanPlagCofepris: api.num_reg_san_plag_cofepris ?? null,
    datosFabricante: api.datos_fabricante ?? null,
    datosFormulador: api.datos_formulador ?? null,
    datosMaquilador: api.datos_maquilador ?? null,
    usoAutorizado: api.uso_autorizado ?? null,

    // Comercio exterior
    fraccionArancelaria: api.fraccion_arancelaria,
    uuidComercioExterior: api.uuid_comercio_exterior,

    // Auditoría
    createdAt: toDate(api.created_at),
    updatedAt: toDate(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
  };
}

// ============================================================================
// EXPENSE MAPPER
// ============================================================================

/**
 * Mapea gasto de API a dominio
 */
export function mapApiExpense(api: ApiExpenseResponse): TripExpense {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,

    // Categorización
    category: api.category,
    subcategory: api.subcategory,

    // CFDI 4.0
    satProductCode: api.sat_product_code,
    satProductDescription: api.sat_product_description,

    // Información del gasto
    description: api.description,
    quantity: api.quantity,
    unitPrice: api.unit_price,
    amount: api.amount,
    currency: api.currency as CurrencyType,
    exchangeRate: api.exchange_rate,

    // Forma de pago
    paymentMethod: api.payment_method,

    // Fecha y ubicación
    expenseDate: toDate(api.expense_date),
    location: api.location,
    latitude: api.latitude,
    longitude: api.longitude,

    // Comprobante
    hasReceipt: api.has_receipt,
    receiptUrl: api.receipt_url,
    receiptNumber: api.receipt_number,

    // CFDI
    cfdiUuid: api.cfdi_uuid,
    cfdiFolio: api.cfdi_folio,

    // Proveedor
    vendorName: api.vendor_name,
    vendorRfc: api.vendor_rfc,

    // Estado
    status: api.status,
    isEstimated: api.is_estimated,
    approvedBy: api.approved_by,
    approvedAt: toDateOrNull(api.approved_at),
    rejectionReason: api.rejection_reason,

    // Notas
    notes: api.notes,

    // Auditoría
    createdAt: toDate(api.created_at),
    updatedAt: toDate(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
  };
}

// ============================================================================
// STOP MAPPER
// ============================================================================

/**
 * Mapea parada de API a dominio
 */
export function mapApiStop(api: ApiStopResponse): TripStop {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,
    sequenceOrder: api.sequence_order,
    stopType: api.stop_type,
    addressId: api.address_id ?? null,

    clientId: api.client_id ?? null,
    clientAddressId: api.client_address_id ?? null,

    // Dirección
    address: api.address,
    city: api.city,
    state: api.state,
    postalCode: api.postal_code,

    // Coordenadas
    latitude: toNumber(api.latitude),
    longitude: toNumber(api.longitude),

    // Contacto
    locationName: api.location_name,
    contactName: api.contact_name,
    contactPhone: api.contact_phone,

    // Tiempos
    estimatedArrival: toDateOrNull(api.estimated_arrival),
    actualArrival: toDateOrNull(api.actual_arrival),
    estimatedDeparture: toDateOrNull(api.estimated_departure),
    actualDeparture: toDateOrNull(api.actual_departure),

    // Estado
    status: api.status,
    notes: api.notes,

    // Carta Porte 3.1
    idUbicacion: api.id_ubicacion,
    street: api.street,
    exteriorNumber: api.exterior_number,
    interiorNumber: api.interior_number,
    colonia: api.colonia,
    reference: api.reference,

    // Claves SAT
    satCountryCode: api.sat_country_code ?? "MEX",
    satEstadoCode: api.sat_state_code ?? api.sat_estado_code ?? null,
    satMunicipioCode:
      api.sat_municipality_code ?? api.sat_municipio_code ?? null,
    satLocalidadCode: api.sat_locality_code ?? api.sat_localidad_code ?? null,
    satColoniaCode:
      api.sat_neighborhood_code ?? api.sat_colonia_code ?? null,

    // Remitente/Destinatario
    rfcRemitenteDestinatario: api.rfc_remitente_destinatario,
    nombreRemitenteDestinatario: api.nombre_remitente_destinatario,
    destinatarioRfc: api.destinatario_rfc ?? null,
    destinatarioNombre: api.destinatario_name ?? null,
    sourceAddressId: api.source_address_id ?? null,
    deliveryRfcRemitenteDestinatario:
      api.delivery_rfc_remitente_destinatario ?? null,
    deliveryNombreRemitenteDestinatario:
      api.delivery_nombre_remitente_destinatario ?? null,
    remitentePartnerId: api.remitente_partner_id ?? null,
    destinatarioPartnerId: api.destinatario_partner_id ?? null,

    // Distancia
    distanceFromPreviousKm: api.distance_from_previous_km,
    distanceSource: api.distance_source ?? null,
    distanceProvider: api.distance_provider ?? null,
    distanceConfidence: api.distance_confidence ?? null,
    distanceComputedAt: toDateOrNull(api.distance_computed_at),

    // Auditoría
    createdAt: toDate(api.created_at),
    updatedAt: toDate(api.updated_at),
  };
}

// ============================================================================
// STATUS HISTORY MAPPER
// ============================================================================

/**
 * Mapea historial de estado de API a dominio
 */
export function mapApiStatusHistory(
  api: ApiStatusHistoryResponse,
): TripStatusHistory {
  return {
    id: api.id,
    tripId: api.trip_id,
    previousStatus: api.previous_status,
    newStatus: api.new_status,
    changedBy: api.changed_by,
    changedByName: api.changed_by_name,
    changedAt: toDate(api.changed_at),
    mileage: api.mileage,
    latitude: toNumber(api.latitude),
    longitude: toNumber(api.longitude),
    reason: api.reason,
  };
}

// ============================================================================
// TRIP MAPPER
// ============================================================================

/**
 * Mapea viaje detallado de API a dominio
 */
export function mapApiTrip(api: ApiTripResponse): Trip {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripCode: api.trip_code,
    vehicleId: api.vehicle_id,
    driverId: api.driver_id,
    clientId: api.client_id,
    originBranchId: api.origin_branch_id ?? null,

    // Fechas
    scheduledDeparture: toDate(api.scheduled_departure),
    scheduledArrival: toDateOrNull(api.scheduled_arrival),
    actualDeparture: toDateOrNull(api.actual_departure),
    actualArrival: toDateOrNull(api.actual_arrival),

    // Kilometraje
    mileage: {
      start: api.start_mileage,
      end: api.end_mileage,
    },

    // Ubicaciones
    originCity: api.origin_city,
    originState: api.origin_state,
    destinationCity: api.destination_city,
    destinationState: api.destination_state,

    // Carga (legacy)
    cargo: {
      description: api.cargo_description,
      weight: toNumber(api.cargo_weight),
      volume: toNumber(api.cargo_volume),
      units: api.cargo_units,
      value: toNumber(api.cargo_value),
    },

    // Costos
    costs: {
      baseRate: toNumberOrDefault(api.base_rate),
      fuelCost: toNumberOrDefault(api.fuel_cost),
      tollCost: toNumberOrDefault(api.toll_cost),
      otherCosts: toNumberOrDefault(api.other_costs),
      totalCost: toNumberOrDefault(api.total_cost),
    },

    // Detailed costs y profitability se calculan aparte
    detailedCosts: null,
    profitability: null,

    // Estado
    status: api.status,
    notes: api.notes,
    cancellationReason: api.cancellation_reason,
    invoicing: mapApiTripInvoicing(api.invoicing, api.status),
    requiresFiscalAttention: api.requires_fiscal_attention ?? false,
    fiscalActionRequired: mapApiFiscalActionRequired(api.fiscal_action_required),

    // Carta Porte 3.1
    totalDistRec: api.total_dist_rec,
    idCcp: api.id_ccp,
    cfdiDocumentIntent:
      api.cfdi_document_intent === "traslado" ? "traslado" : "ingreso",

    // Auditoría
    createdAt: toDate(api.created_at),
    updatedAt: toDate(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
    createdByName: api.created_by_name ?? null,
    updatedByName: api.updated_by_name ?? null,

    // Relaciones
    vehicle: api.vehicle
      ? {
          id: api.vehicle.id,
          unitNumber: api.vehicle.unit_number,
          licensePlate: api.vehicle.license_plate,
        }
      : undefined,
    driver: api.driver
      ? {
          id: api.driver.id,
          fullName: api.driver.full_name,
        }
      : undefined,
    client: api.client
      ? {
          id: api.client.id,
          legalName: api.client.legal_name,
        }
      : undefined,
    internalStaff: api.internal_staff?.map(mapApiTripInternalStaff) ?? [],
    stops: api.stops?.map(mapApiStop),
    cargos: api.cargos?.map(mapApiCargo),
    expenses: api.expenses?.map(mapApiExpense),
    statusHistory: api.status_history?.map(mapApiStatusHistory),
  };
}

// ============================================================================
// TRIP LIST ITEM MAPPER
// ============================================================================

/**
 * Mapea item de listado de API a dominio
 */
export function mapApiTripListItem(api: ApiTripListItemResponse): TripListItem {
  return {
    id: api.id,
    tripCode: api.trip_code,
    vehicle: {
      id: api.vehicle_id,
      unitNumber: api.vehicle_unit_number,
      licensePlate: api.vehicle_license_plate,
    },
    driver: {
      id: api.driver_id,
      fullName: api.driver_full_name,
    },
    client: api.client_id
      ? {
          id: api.client_id,
          legalName: api.client_legal_name ?? "",
        }
      : null,
    originCity: api.origin_city,
    originState: api.origin_state,
    destinationCity: api.destination_city,
    destinationState: api.destination_state,
    scheduledDeparture: toDate(api.scheduled_departure),
    scheduledArrival: toDateOrNull(api.scheduled_arrival),
    status: api.status,
    cargoDescription: api.cargo_description,
    baseRate: toNumberOrDefault(api.base_rate),
    totalCost: toNumberOrDefault(api.total_cost),
    totalRevenue: toNumberOrDefault(api.total_revenue),
    estimatedProfit: toNumberOrDefault(api.estimated_profit),
    cargoCount: api.cargo_count ?? 0,
    clientCount: api.client_count ?? 0,
    invoicing: mapApiTripInvoicing(api.invoicing, api.status),
    requiresFiscalAttention: api.requires_fiscal_attention ?? false,
    internalStaffEmployeeIds: api.internal_staff_employee_ids ?? [],
    createdAt: toDate(api.created_at),
  };
}

// ============================================================================
// EXPENSES SUMMARY MAPPER
// ============================================================================

/**
 * Mapea resumen de gastos de API a dominio
 */
export function mapApiExpensesSummary(
  api: ApiExpensesSummaryResponse,
): ExpensesSummary {
  return {
    total: api.total,
    byCategory: api.by_category,
    estimatedCount: api.estimated_count,
    pendingCount: api.pending_count,
  };
}

// ============================================================================
// RESPONSE MAPPERS (con mensaje y estructura MappedSingleResult)
// ============================================================================

/**
 * Mapea respuesta de API con un viaje
 */
export function mapTripResponse(response: {
  data: ApiTripResponse;
  message?: string;
}): MappedSingleResult<Trip> {
  return {
    data: mapApiTrip(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con array de cargas
 */
export function mapCargosResponse(response: {
  data: ApiCargoResponse[];
  message?: string;
}): MappedSingleResult<TripCargo[]> {
  return {
    data: response.data.map(mapApiCargo),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con una carga
 */
export function mapCargoResponse(response: {
  data: ApiCargoResponse;
  message?: string;
}): MappedSingleResult<TripCargo> {
  return {
    data: mapApiCargo(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con un movimiento
 */
export function mapCargoMovementResponse(response: {
  data: ApiCargoMovementResponse;
  message?: string;
}): MappedSingleResult<CargoMovement> {
  return {
    data: mapApiCargoMovement(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con array de gastos
 */
export function mapExpensesResponse(response: {
  data: ApiExpenseResponse[];
  message?: string;
}): MappedSingleResult<TripExpense[]> {
  return {
    data: response.data.map(mapApiExpense),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con un gasto
 */
export function mapExpenseResponse(response: {
  data: ApiExpenseResponse;
  message?: string;
}): MappedSingleResult<TripExpense> {
  return {
    data: mapApiExpense(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta de resumen de gastos
 */
export function mapExpensesSummaryResponse(response: {
  data: ApiExpensesSummaryResponse;
  message?: string;
}): MappedSingleResult<ExpensesSummary> {
  return {
    data: mapApiExpensesSummary(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con array de paradas
 */
export function mapStopsResponse(response: {
  data: ApiStopResponse[];
  message?: string;
}): MappedSingleResult<TripStop[]> {
  return {
    data: response.data.map(mapApiStop),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con una parada
 */
export function mapStopResponse(response: {
  data: ApiStopResponse;
  message?: string;
}): MappedSingleResult<TripStop> {
  return {
    data: mapApiStop(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta del endpoint transaccional de crear viaje
 */
export function mapCreateTripResponse(response: ApiCreateTripResponse): {
  trip: Trip;
  summary: {
    tripId: string;
    tripCode: string;
    stopsCreated: number;
    cargosCreated: number;
    expensesCreated: number;
    finalStatus: string;
  };
  warnings?: Array<{
    code: string;
    message: string;
    vehicleId?: string;
    driverId?: string;
    conflictingTripId?: string;
    conflictingTripCode?: string;
  }>;
} {
  const warnings = response.warnings?.map((warning) => ({
    code: warning.code,
    message: warning.message,
    vehicleId: warning.vehicle_id,
    driverId: warning.driver_id,
    conflictingTripId: warning.conflicting_trip_id,
    conflictingTripCode: warning.conflicting_trip_code,
  }));

  return {
    trip: mapApiTrip(response.data.trip),
    summary: {
      tripId: response.data.summary.trip_id,
      tripCode: response.data.summary.trip_code,
      stopsCreated: response.data.summary.stops_created,
      cargosCreated: response.data.summary.cargos_created,
      expensesCreated: response.data.summary.expenses_created,
      finalStatus: response.data.summary.final_status,
    },
    ...(warnings && warnings.length > 0 ? { warnings } : {}),
  };
}

/**
 * Mapea respuesta paginada de viajes
 */
export function mapPaginatedTripsResponse(
  response: ApiPaginatedResponse<ApiTripListItemResponse>,
): {
  data: TripListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} {
  return {
    data: response.data.map(mapApiTripListItem),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}
