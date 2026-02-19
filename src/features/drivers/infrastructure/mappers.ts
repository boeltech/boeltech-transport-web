/**
 * Driver API Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforma los datos entre el formato de la API (snake_case)
 * y el formato del dominio (camelCase).
 *
 * FLUJO:
 * API Response (snake_case) → mapDriver/mapPaginatedDriverListItems → Domain Entity (camelCase)
 * Domain DTO (camelCase) → toApiCreateDriver/toApiUpdateDriver → API Request (snake_case)
 */

import {
  deepToCamel,
  type DeepCamelCase,
} from "@shared/api/utils/case-transformer";
import {
  mapSingleResponse,
  mapPaginatedResponse,
  type MappedSingleResult,
  type MappedPaginatedResult,
  type ApiSingleResponse,
  type ApiPaginatedResponse,
} from "@shared/api";
import type {
  Driver,
  DriverListItem,
  DriverStatusType,
  LicenseTypeValue,
} from "../domain/entities";
import type {
  CreateDriverDTO,
  UpdateDriverDTO,
  UpdateDriverStatusDTO,
  DriverTripSummary,
} from "../domain/repository";

// ============================================================================
// API RESPONSE TYPES (snake_case from backend)
// ============================================================================

/**
 * Respuesta del API para un conductor en listado
 */
export interface ApiDriverListItemResponse {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  license_number: string;
  license_type: string;
  license_expiration: string;
  status: string;
  years_of_experience: number;
  total_trips: number;
  is_license_expired: boolean;
  created_at: string;
}

/**
 * Respuesta del API para un conductor completo
 */
export interface ApiDriverResponse {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee?: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  license_number: string;
  license_type: string;
  license_expiration: string;
  license_issued_date: string | null;
  license_issuing_state: string | null;
  status: string;
  years_of_experience: number;
  blood_type: string | null;
  medical_certificate_expiration: string | null;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  stats?: {
    total_trips: number;
    completed_trips: number;
    cancelled_trips: number;
    total_kilometers: number;
    average_rating: number | null;
    years_of_experience: number;
  };
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Respuesta del API para viaje del conductor
 */
export interface ApiDriverTripResponse {
  id: string;
  trip_code: string;
  status: string;
  origin_city: string;
  destination_city: string;
  scheduled_departure: string;
  scheduled_arrival: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;
  total_cost: number;
  created_at: string;
}

// ============================================================================
// MAPPERS: API → Domain
// ============================================================================

/**
 * Mapea un conductor de listado del API al dominio
 */
function mapDriverListItemToDomain(
  raw: DeepCamelCase<ApiDriverListItemResponse>,
): DriverListItem {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    employeeId: raw.employeeId,
    employee: {
      id: raw.employee.id,
      employeeNumber: raw.employee.employeeNumber,
      firstName: raw.employee.firstName,
      lastName: raw.employee.lastName,
      email: raw.employee.email,
      phone: raw.employee.phone,
    },
    licenseNumber: raw.licenseNumber,
    licenseType: raw.licenseType as LicenseTypeValue,
    licenseExpiration: new Date(raw.licenseExpiration),
    status: raw.status as DriverStatusType,
    yearsOfExperience: raw.yearsOfExperience,
    totalTrips: raw.totalTrips,
    isLicenseExpired: raw.isLicenseExpired,
    createdAt: new Date(raw.createdAt),
  };
}

/**
 * Mapea un conductor completo del API al dominio
 */
function mapDriverToDomain(raw: DeepCamelCase<ApiDriverResponse>): Driver {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    employeeId: raw.employeeId,
    employee: raw.employee
      ? {
          id: raw.employee.id,
          employeeNumber: raw.employee.employeeNumber,
          firstName: raw.employee.firstName,
          lastName: raw.employee.lastName,
          email: raw.employee.email,
          phone: raw.employee.phone,
        }
      : undefined,
    licenseNumber: raw.licenseNumber,
    licenseType: raw.licenseType as LicenseTypeValue,
    licenseExpiration: new Date(raw.licenseExpiration),
    licenseIssuedDate: raw.licenseIssuedDate
      ? new Date(raw.licenseIssuedDate)
      : null,
    licenseIssuingState: raw.licenseIssuingState,
    status: raw.status as DriverStatusType,
    yearsOfExperience: raw.yearsOfExperience,
    bloodType: raw.bloodType,
    medicalCertificateExpiration: raw.medicalCertificateExpiration
      ? new Date(raw.medicalCertificateExpiration)
      : null,
    notes: raw.notes,
    emergencyContactName: raw.emergencyContactName,
    emergencyContactPhone: raw.emergencyContactPhone,
    emergencyContactRelationship: raw.emergencyContactRelationship,
    stats: raw.stats
      ? {
          totalTrips: raw.stats.totalTrips,
          completedTrips: raw.stats.completedTrips,
          cancelledTrips: raw.stats.cancelledTrips,
          totalKilometers: raw.stats.totalKilometers,
          averageRating: raw.stats.averageRating,
          yearsOfExperience: raw.stats.yearsOfExperience,
        }
      : undefined,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    createdBy: raw.createdBy,
    updatedBy: raw.updatedBy,
  };
}

/**
 * Mapea un viaje del conductor del API al dominio
 */
function mapDriverTripToDomain(
  raw: DeepCamelCase<ApiDriverTripResponse>,
): DriverTripSummary {
  return {
    id: raw.id,
    tripCode: raw.tripCode,
    status: raw.status,
    originCity: raw.originCity,
    destinationCity: raw.destinationCity,
    scheduledDeparture: new Date(raw.scheduledDeparture),
    scheduledArrival: raw.scheduledArrival
      ? new Date(raw.scheduledArrival)
      : null,
    actualDeparture: raw.actualDeparture ? new Date(raw.actualDeparture) : null,
    actualArrival: raw.actualArrival ? new Date(raw.actualArrival) : null,
    totalCost: raw.totalCost,
    createdAt: new Date(raw.createdAt),
  };
}

// ============================================================================
// PUBLIC MAPPERS
// ============================================================================

/**
 * Mapea respuesta paginada de conductores para listado
 */
export function mapPaginatedDriverListItems(
  response: ApiPaginatedResponse<ApiDriverListItemResponse>,
): MappedPaginatedResult<DriverListItem> {
  const mapped = mapPaginatedResponse(response);
  return {
    data: mapped.data.map(mapDriverListItemToDomain),
    pagination: mapped.pagination,
  };
}

/**
 * Mapea respuesta de conductor único
 */
export function mapDriver(
  response: ApiSingleResponse<ApiDriverResponse>,
): MappedSingleResult<Driver> {
  const mapped = mapSingleResponse(response);
  return {
    data: mapDriverToDomain(mapped.data),
    message: mapped.message,
  };
}

/**
 * Mapea respuesta de conductor o null
 */
export function mapDriverOrNull(
  response: ApiSingleResponse<ApiDriverResponse | null>,
): MappedSingleResult<Driver | null> {
  if (!response.data) {
    return { data: null };
  }
  const mapped = mapSingleResponse(
    response as ApiSingleResponse<ApiDriverResponse>,
  );
  return {
    data: mapDriverToDomain(mapped.data),
    message: mapped.message,
  };
}

/**
 * Mapea respuesta paginada de viajes del conductor
 */
export function mapPaginatedDriverTrips(
  response: ApiPaginatedResponse<ApiDriverTripResponse>,
): MappedPaginatedResult<DriverTripSummary> {
  const mapped = mapPaginatedResponse(response);
  return {
    data: mapped.data.map(mapDriverTripToDomain),
    pagination: mapped.pagination,
  };
}

// ============================================================================
// MAPPERS: Domain → API (for requests)
// ============================================================================

/**
 * Convierte DTO de creación de conductor a formato API
 */
export function toApiCreateDriver(
  dto: CreateDriverDTO,
): Record<string, unknown> {
  return {
    employee_id: dto.employeeId,
    license_number: dto.licenseNumber,
    license_type: dto.licenseType,
    license_expiration: dto.licenseExpiration,
    license_issued_date: dto.licenseIssuedDate,
    license_issuing_state: dto.licenseIssuingState,
    years_of_experience: dto.yearsOfExperience ?? 0,
    blood_type: dto.bloodType,
    medical_certificate_expiration: dto.medicalCertificateExpiration,
    notes: dto.notes,
    emergency_contact_name: dto.emergencyContactName,
    emergency_contact_phone: dto.emergencyContactPhone,
    emergency_contact_relationship: dto.emergencyContactRelationship,
  };
}

/**
 * Convierte DTO de actualización de conductor a formato API
 */
export function toApiUpdateDriver(
  dto: UpdateDriverDTO,
): Record<string, unknown> {
  const apiData: Record<string, unknown> = {};

  if (dto.employeeId !== undefined) apiData.employee_id = dto.employeeId;
  if (dto.licenseNumber !== undefined)
    apiData.license_number = dto.licenseNumber;
  if (dto.licenseType !== undefined) apiData.license_type = dto.licenseType;
  if (dto.licenseExpiration !== undefined)
    apiData.license_expiration = dto.licenseExpiration;
  if (dto.licenseIssuedDate !== undefined)
    apiData.license_issued_date = dto.licenseIssuedDate;
  if (dto.licenseIssuingState !== undefined)
    apiData.license_issuing_state = dto.licenseIssuingState;
  if (dto.yearsOfExperience !== undefined)
    apiData.years_of_experience = dto.yearsOfExperience;
  if (dto.bloodType !== undefined) apiData.blood_type = dto.bloodType;
  if (dto.medicalCertificateExpiration !== undefined)
    apiData.medical_certificate_expiration = dto.medicalCertificateExpiration;
  if (dto.notes !== undefined) apiData.notes = dto.notes;
  if (dto.emergencyContactName !== undefined)
    apiData.emergency_contact_name = dto.emergencyContactName;
  if (dto.emergencyContactPhone !== undefined)
    apiData.emergency_contact_phone = dto.emergencyContactPhone;
  if (dto.emergencyContactRelationship !== undefined)
    apiData.emergency_contact_relationship = dto.emergencyContactRelationship;

  return apiData;
}

/**
 * Convierte DTO de actualización de estado a formato API
 */
export function toApiUpdateStatus(
  dto: UpdateDriverStatusDTO,
): Record<string, unknown> {
  return {
    status: dto.status,
    reason: dto.reason,
  };
}
