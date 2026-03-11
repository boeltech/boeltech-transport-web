/**
 * Stop Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * ACTUALIZADO: Modelo Carga → Movimientos + Cargos y Expenses Response
 * - ApiCreateCargoRequest ahora envía movements[] en lugar de pickupStopIndex/deliveryStopIndex
 * - toApiCreateCargo mapea movements correctamente
 * - ApiTripCargoResponse y ApiTripExpenseResponse agregados para recibir datos del backend
 * - mapTripCargo y mapTripExpense agregan transformación API → Domain
 *
 * Transforman datos entre el formato de la API y las entidades del dominio.
 */

import {
  type TripStop,
  type StopTypeValue,
  type StopStatusValue,
} from "@features/trips/domain/entities/entities";

import { toDate, toDateRequired } from "@shared/utils/dateHelpers";
import { toNumber } from "@shared/utils/numberHelpers";

// ============================================================================
// API RESPONSE TYPES - Estructura del Backend (snake_case)
// ============================================================================

export interface ApiStopResponse {
  id: string;
  tenant_id: string;
  trip_id: string;
  sequence_order: number;
  stop_type: string;
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  location_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;

  estimated_departure: string | null;
  actual_departure: string | null;
  // cargo_action_description: string | null;
  // cargo_weight: string | number | null;
  // cargo_units: number | null;
  status: string;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// MAPPERS - API Response to Domain Entity
// ============================================================================

export function mapTripStop(api: ApiStopResponse): TripStop {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,
    sequenceOrder: api.sequence_order,
    stopType: api.stop_type as StopTypeValue,
    address: api.address,
    city: api.city,
    state: api.state,
    postalCode: api.postal_code,
    latitude: toNumber(api.latitude),
    longitude: toNumber(api.longitude),
    locationName: api.location_name,
    contactName: api.contact_name,
    contactPhone: api.contact_phone,
    estimatedArrival: toDate(api.estimated_arrival),
    actualArrival: toDate(api.actual_arrival),
    estimatedDeparture: toDate(api.estimated_departure),
    actualDeparture: toDate(api.actual_departure),
    // cargoActionDescription: api.cargo_action_description,
    // cargoWeight: toNumber(api.cargo_weight),
    // cargoUnits: api.cargo_units,
    status: api.status as StopStatusValue,
    notes: api.notes,
    createdAt: toDateRequired(api.created_at),
    updatedAt: toDateRequired(api.updated_at),
  };
}

// ============================================================================
// REVERSE MAPPERS - Domain to API Request
// ============================================================================

// export function toApiCreateStop(data: CreateTripStopDTO): ApiCreateStopRequest {
//   return {
//     sequenceOrder: data.sequenceOrder,
//     stopType: data.stopType,
//     address: data.address,
//     city: data.city,
//     state: data.state,
//     postalCode: data.postalCode,
//     latitude: data.latitude,
//     longitude: data.longitude,
//     locationName: data.locationName,
//     contactName: data.contactName,
//     contactPhone: data.contactPhone,
//     estimatedArrival: toISOStringOptional(data.estimatedArrival),
//     cargoActionDescription: data.cargoActionDescription,
//     cargoWeight: data.cargoWeight,
//     cargoUnits: data.cargoUnits,
//     notes: data.notes,

//     // Carta Porte 3.1
//     street: data.street,
//     exteriorNumber: data.exteriorNumber,
//     interiorNumber: data.interiorNumber,
//     colonia: data.colonia,
//     reference: data.reference,
//     satEstadoCode: data.satEstadoCode,
//     satMunicipioCode: data.satMunicipioCode,
//     satLocalidadCode: data.satLocalidadCode,
//     satColoniaCode: data.satColoniaCode,
//     rfcRemitenteDestinatario: data.rfcRemitenteDestinatario,
//     distanceToNextKm: data.distanceToNextKm,
//   };
// }
