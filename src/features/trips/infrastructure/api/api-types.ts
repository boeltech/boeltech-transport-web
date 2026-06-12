/**
 * Trip API Response Types
 * Clean Architecture - Infrastructure Layer
 *
 * Tipos que representan la estructura exacta de las respuestas del backend.
 * Todos en snake_case para coincidir con el formato JSON del servidor.
 *
 * NOTA: Estos tipos SOLO se usan en los mappers.
 *       El resto de la aplicación usa los tipos de dominio (camelCase).
 *
 * Ubicación: src/features/trips/infrastructure/api/api-types.ts
 */

import type {
  TripStatusType,
  StopTypeValue,
  StopStatusValue,
  ExpenseCategoryType,
  ExpenseStatusType,
  CargoStatusType,
  CargoMovementTypeValue,
} from "@features/trips/domain";

// ============================================================================
// REFERENCE RESPONSES
// ============================================================================

export interface ApiVehicleRefResponse {
  id: string;
  unit_number: string;
  license_plate: string;
}

export interface ApiDriverRefResponse {
  id: string;
  full_name: string;
}

export interface ApiClientRefResponse {
  id: string;
  legal_name: string;
}

export interface ApiTripFiscalActionRequiredResponse {
  invoice_id: string;
  invoice_status: "draft" | "stamped" | "cancellation_pending" | "cancelled";
  cfdi_uuid?: string | null;
  suggested_actions?: string[];
}

export interface ApiTripInvoicingResponse {
  has_active_invoice?: boolean;
  can_generate_invoice?: boolean;
  invoice_id?: string | null;
  invoice_folio?: string | null;
  invoice_cfdi_uuid?: string | null;
  invoice_status?: "draft" | "stamped" | "cancellation_pending" | "cancelled" | null;
  block_reason?: string | null;
}

export interface ApiTripInternalStaffResponse {
  id: string;
  trip_id: string;
  employee_id: string;
  employee_full_name: string;
  employee_number: string | null;
  employee_status: string | null;
  /** Legacy: el front ya no persiste rol; el API puede seguir enviandolo. */
  internal_role?: string | null;
  is_payment_responsible: boolean;
  payment_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CARGO MOVEMENT RESPONSE
// ============================================================================

export interface ApiCargoMovementResponse {
  id: string;
  cargo_id: string;
  stop_id: string;
  stop_index: number;
  movement_type: CargoMovementTypeValue;
  weight: number | null;
  units: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CARGO RESPONSE
// ============================================================================

export interface ApiCargoResponse {
  id: string;
  tenant_id: string;
  trip_id: string;
  client_id: string;
  client?: ApiClientRefResponse;

  // Información básica
  description: string;
  product_type: string | null;
  weight: number | null;
  volume: number | null;
  units: number | null;
  declared_value: number | null;
  asegura_carga?: string | null;
  poliza_carga?: string | null;

  // Tarifa
  rate: number;
  currency: string;

  // Movimientos
  movements: ApiCargoMovementResponse[];

  // Estado
  status: CargoStatusType;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  notes: string | null;
  special_instructions: string | null;

  // Carta Porte 3.1
  sat_product_code: string | null;
  sat_product_description: string | null;
  sat_unit_code: string | null;
  sat_unit_name: string | null;
  weight_in_kg: number | null;
  dimensions: string | null;

  // Material peligroso
  hazardous_material: boolean | null;
  requires_hazmat?: boolean | null;
  hazardous_material_code: string | null;
  packaging_type: string | null;
  packaging_description: string | null;

  // Sectores regulados (Carta Porte 3.1 §6.4)
  sector_requirements?: Record<string, boolean> | null;
  sector_cofepris?: string | null;
  nombre_ingrediente_activo?: string | null;
  nom_quimico?: string | null;
  denominacion_generica_prod?: string | null;
  denominacion_distintiva_prod?: string | null;
  fabricante?: string | null;
  fecha_caducidad?: string | null;
  lote_medicamento?: string | null;
  forma_farmaceutica?: string | null;
  condiciones_esp_transp?: string | null;
  registro_sanitario_folio_autorizacion?: string | null;
  permiso_importacion?: string | null;
  folio_impo_vucem?: string | null;
  num_cas?: string | null;
  razon_social_emp_imp?: string | null;
  num_reg_san_plag_cofepris?: string | null;
  datos_fabricante?: string | null;
  datos_formulador?: string | null;
  datos_maquilador?: string | null;
  uso_autorizado?: string | null;

  // Comercio exterior
  fraccion_arancelaria: string | null;
  uuid_comercio_exterior: string | null;

  // Auditoría
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ============================================================================
// EXPENSE RESPONSE
// ============================================================================

export interface ApiExpenseResponse {
  id: string;
  tenant_id: string;
  trip_id: string;

  // Categorización
  category: ExpenseCategoryType;
  subcategory: string | null;

  // CFDI 4.0
  sat_product_code: string | null;
  sat_product_description: string | null;

  // Información del gasto
  description: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  currency: string;
  exchange_rate: number | null;

  // Forma de pago
  payment_method: string | null;

  // Fecha y ubicación
  expense_date: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;

  // Comprobante
  has_receipt: boolean;
  receipt_url: string | null;
  receipt_number: string | null;

  // CFDI
  cfdi_uuid: string | null;
  cfdi_folio: string | null;

  // Proveedor
  vendor_name: string | null;
  vendor_rfc: string | null;

  // Estado
  status: ExpenseStatusType;
  is_estimated: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;

  // Notas
  notes: string | null;

  // Auditoría
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ============================================================================
// STOP RESPONSE
// ============================================================================

export interface ApiStopResponse {
  id: string;
  tenant_id: string;
  trip_id: string;
  sequence_order: number;
  stop_type: StopTypeValue[];
  address_id?: string | null;

  /** Metadato UI: cliente para precargar direcciones */
  client_id?: string | null;
  /** Metadato UI: fila de client_addresses seleccionada */
  client_address_id?: string | null;

  // Dirección
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;

  // Coordenadas
  latitude: string | number | null;
  longitude: string | number | null;

  // Contacto
  location_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;

  // Tiempos
  estimated_arrival: string | null;
  actual_arrival: string | null;
  estimated_departure: string | null;
  actual_departure: string | null;

  // Estado
  status: StopStatusValue;
  notes: string | null;

  // Carta Porte 3.1
  id_ubicacion: string | null;
  street: string | null;
  exterior_number: string | null;
  interior_number: string | null;
  colonia: string | null;
  reference: string | null;

  // Claves SAT
  sat_country_code?: string | null;
  sat_state_code?: string | null;
  sat_municipality_code?: string | null;
  sat_locality_code?: string | null;
  sat_neighborhood_code?: string | null;
  // Backward-compat aliases during rollout.
  sat_estado_code?: string | null;
  sat_municipio_code?: string | null;
  sat_localidad_code?: string | null;
  sat_colonia_code?: string | null;

  // Remitente/Destinatario
  rfc_remitente_destinatario: string | null;
  nombre_remitente_destinatario: string | null;

  delivery_rfc_remitente_destinatario?: string | null;
  delivery_nombre_remitente_destinatario?: string | null;
  remitente_partner_id?: string | null;
  destinatario_partner_id?: string | null;

  // Distancia
  distance_from_previous_km: number | null;
  distance_source?: "manual" | "mapbox_matrix" | "haversine_fallback" | null;
  distance_provider?: "mapbox" | "stub" | null;
  distance_confidence?: "high" | "medium" | "low" | null;
  distance_computed_at?: string | null;

  // Auditoría
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STATUS HISTORY RESPONSE
// ============================================================================

export interface ApiStatusHistoryResponse {
  id: string;
  trip_id: string;
  previous_status: TripStatusType | null;
  new_status: TripStatusType;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
  mileage: number | null;
  latitude: string | number | null;
  longitude: string | number | null;
  reason: string | null;
}

// ============================================================================
// TRIP RESPONSE (detalle completo)
// ============================================================================

export interface ApiTripResponse {
  id: string;
  tenant_id: string;
  trip_code: string;
  vehicle_id: string;
  driver_id: string;
  client_id: string | null;

  // Fechas
  scheduled_departure: string;
  scheduled_arrival: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;

  // Kilometraje
  start_mileage: number | null;
  end_mileage: number | null;

  // Ubicaciones (resumen operativo)
  origin_city: string;
  origin_state: string | null;
  destination_city: string;
  destination_state: string | null;

  // Carga (legacy)
  cargo_description: string | null;
  cargo_weight: string | number | null;
  cargo_volume: string | number | null;
  cargo_units: number | null;
  cargo_value: string | number | null;

  // Costos
  base_rate: string | number;
  fuel_cost: string | number;
  toll_cost: string | number;
  other_costs: string | number;
  total_cost: string | number;

  // Estado
  status: TripStatusType;
  notes: string | null;
  cancellation_reason: string | null;
  invoicing?: ApiTripInvoicingResponse;
  requires_fiscal_attention?: boolean;
  fiscal_action_required?: ApiTripFiscalActionRequiredResponse | null;

  // Carta Porte 3.1 — distancia registrada / id complemento (cuando aplique)
  total_dist_rec: number | null;
  id_ccp: string | null;

  /** Ingreso vs traslado — metadato fiscal / UX */
  cfdi_document_intent?: "ingreso" | "traslado";

  // Auditoría
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;

  // Relaciones (opcionales)
  vehicle?: ApiVehicleRefResponse;
  driver?: ApiDriverRefResponse;
  client?: ApiClientRefResponse | null;
  internal_staff?: ApiTripInternalStaffResponse[];
  stops?: ApiStopResponse[];
  cargos?: ApiCargoResponse[];
  expenses?: ApiExpenseResponse[];
  status_history?: ApiStatusHistoryResponse[];
}

// ============================================================================
// TRIP LIST ITEM RESPONSE
// ============================================================================

export interface ApiTripListItemResponse {
  id: string;
  trip_code: string;
  vehicle_id: string;
  vehicle_unit_number: string;
  vehicle_license_plate: string;
  driver_id: string;
  driver_full_name: string;
  client_id: string | null;
  client_legal_name: string | null;
  origin_city: string;
  origin_state: string | null;
  destination_city: string;
  destination_state: string | null;
  scheduled_departure: string;
  scheduled_arrival: string | null;
  status: TripStatusType;
  cargo_description: string | null;
  base_rate: string | number;
  total_cost: string | number;
  total_revenue: string | number;
  estimated_profit: string | number;
  cargo_count: number;
  client_count: number;
  internal_staff_count?: number;
  internal_staff_employee_ids?: string[];
  invoicing?: ApiTripInvoicingResponse;
  requires_fiscal_attention?: boolean;
  created_at: string;
}

// ============================================================================
// CREATE TRIP RESPONSE (transaccional)
// ============================================================================

export interface ApiCreateTripResponse {
  message: string;
  data: {
    trip: ApiTripResponse;
    summary: {
      trip_id: string;
      trip_code: string;
      stops_created: number;
      cargos_created: number;
      expenses_created: number;
      final_status: string;
    };
  };
}

// ============================================================================
// EXPENSES SUMMARY RESPONSE
// ============================================================================

export interface ApiExpensesSummaryResponse {
  total: number;
  by_category: Record<string, number>;
  estimated_count: number;
  pending_count: number;
}

// ============================================================================
// PAGINATED RESPONSE
// ============================================================================

// export interface ApiPaginatedResponse<T> {
//   data: T[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     total_pages: number;
//   };
// }

// ============================================================================
// ACTION RESPONSE (para operaciones sin datos de retorno)
// ============================================================================

// export interface ApiActionResponse {
//   message: string;
//   success: boolean;
// }
