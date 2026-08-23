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

import { deepToCamel, type DeepCamelCase } from "@shared/api/utils/case-transformer";
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
  DriverTripSummary,
  LicenseTypeValue,
} from "../domain/entities";
import type {
  CreateDriverDTO,
  UpdateDriverDTO,
  UpdateDriverStatusDTO,
} from "../domain/repository";

// ============================================================================
// API RESPONSE TYPES (snake_case from backend)
// ============================================================================

/**
 * Respuesta del API para empleado anidado
 */
export interface ApiEmployeeRef {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  second_last_name: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  curp: string | null;
  rfc: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
}

/**
 * Respuesta del API para un conductor en listado
 */
export interface ApiDriverListItemResponse {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee: ApiEmployeeRef;
  federal_license_number: string | null;
  federal_license_category: string | null;
  federal_license_expiry: string | null;
  state_license_number: string | null;
  state_license_expiry: string | null;
  state_issuing_state: string | null;
  has_federal_license: boolean;
  has_state_license: boolean;
  is_federal_license_expired: boolean;
  is_state_license_expired: boolean;
  status: string;
  years_of_experience: number;
  total_trips: number;
  is_license_expired: boolean;
  is_active: boolean;
  created_at: string;
  branch_id?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
}

/**
 * Respuesta del API para estadísticas del conductor
 */
export interface ApiDriverStats {
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  average_rating: number | null;
  years_of_experience: number;
}

/**
 * Respuesta del API para un conductor completo
 */
export interface ApiDriverResponse {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee?: ApiEmployeeRef;

  // Licencias (ADR-0080 dual)
  federal_license_number: string | null;
  federal_license_category: string | null;
  federal_license_expiry: string | null;
  state_license_number: string | null;
  state_license_expiry: string | null;
  state_issuing_state: string | null;
  has_federal_license: boolean;
  has_state_license: boolean;
  is_federal_license_expired: boolean;
  is_state_license_expired: boolean;
  is_license_expired: boolean;

  // Certificado médico
  medical_certificate_number: string | null;
  medical_certificate_expiry: string | null;
  medical_certificate_issuer: string | null;

  // Examen psicométrico
  psychometric_test_date: string | null;
  psychometric_test_result: string | null;

  // Examen antidoping
  last_drug_test_date: string | null;
  drug_test_result: string | null;

  // Dispositivo
  assigned_device_id: string | null;

  // Estado
  status: string;
  is_active: boolean;
  years_of_experience: number;

  // Datos del empleado (solo lectura)
  blood_type: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;

  // Notas
  notes: string | null;

  // Stats
  stats?: ApiDriverStats;

  // Auditoría
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
}

/**
 * Respuesta de la API para viajes del conductor (snake_case)
 */
export interface ApiDriverTripResponse {
  id: string;
  trip_code: string;
  status: string;
  scheduled_departure: string;
  scheduled_arrival: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;
  origin_city: string;
  destination_city: string;
  vehicle: {
    id: string;
    unit_number: string;
    license_plate: string;
  };
  client: {
    id: string;
    legal_name: string;
  } | null;
  total_cost: number;
  distance: number | null;
}

// ============================================================================
// MAPPERS: API → Domain
// ============================================================================

/**
 * Mapea un empleado del API al dominio
 */
function mapEmployeeRefToDomain(raw: DeepCamelCase<ApiEmployeeRef>) {
  return {
    id: raw.id,
    employeeNumber: raw.employeeNumber,
    firstName: raw.firstName,
    lastName: raw.lastName,
    secondLastName: raw.secondLastName,
    fullName: raw.fullName,
    email: raw.email,
    phone: raw.phone,
    mobilePhone: raw.mobilePhone ?? null,
    curp: raw.curp,
    rfc: raw.rfc,
    branchId: raw.branchId ?? null,
    branchName: raw.branchName ?? null,
    branchCode: raw.branchCode ?? null,
  };
}

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
    employee: mapEmployeeRefToDomain(raw.employee),
    federalLicenseNumber: raw.federalLicenseNumber,
    federalLicenseCategory: raw.federalLicenseCategory as LicenseTypeValue | null,
    federalLicenseExpiry: raw.federalLicenseExpiry,
    stateLicenseNumber: raw.stateLicenseNumber,
    stateLicenseExpiry: raw.stateLicenseExpiry,
    stateIssuingState: raw.stateIssuingState,
    hasFederalLicense: raw.hasFederalLicense,
    hasStateLicense: raw.hasStateLicense,
    isFederalLicenseExpired: raw.isFederalLicenseExpired,
    isStateLicenseExpired: raw.isStateLicenseExpired,
    status: raw.status as DriverStatusType,
    yearsOfExperience: raw.yearsOfExperience,
    totalTrips: raw.totalTrips,
    isLicenseExpired: raw.isLicenseExpired,
    isActive: raw.isActive,
    createdAt: new Date(raw.createdAt),
    branchId: raw.branchId ?? null,
    branchName: raw.branchName ?? null,
    branchCode: raw.branchCode ?? null,
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
    employee: raw.employee ? mapEmployeeRefToDomain(raw.employee) : undefined,

    // Licencias
    federalLicenseNumber: raw.federalLicenseNumber,
    federalLicenseCategory: raw.federalLicenseCategory as LicenseTypeValue | null,
    federalLicenseExpiry: raw.federalLicenseExpiry,
    stateLicenseNumber: raw.stateLicenseNumber,
    stateLicenseExpiry: raw.stateLicenseExpiry,
    stateIssuingState: raw.stateIssuingState,
    hasFederalLicense: raw.hasFederalLicense,
    hasStateLicense: raw.hasStateLicense,
    isFederalLicenseExpired: raw.isFederalLicenseExpired,
    isStateLicenseExpired: raw.isStateLicenseExpired,
    isLicenseExpired: raw.isLicenseExpired,

    // Certificado médico
    medicalCertificateNumber: raw.medicalCertificateNumber,
    medicalCertificateExpiry: raw.medicalCertificateExpiry,
    medicalCertificateIssuer: raw.medicalCertificateIssuer,

    // Examen psicométrico
    psychometricTestDate: raw.psychometricTestDate,
    psychometricTestResult: raw.psychometricTestResult,

    // Examen antidoping
    lastDrugTestDate: raw.lastDrugTestDate,
    drugTestResult: raw.drugTestResult,

    // Dispositivo
    assignedDeviceId: raw.assignedDeviceId,

    // Estado
    status: raw.status as DriverStatusType,
    isActive: raw.isActive,
    yearsOfExperience: raw.yearsOfExperience,

    // Datos del empleado (solo lectura)
    bloodType: raw.bloodType,
    emergencyContactName: raw.emergencyContactName,
    emergencyContactPhone: raw.emergencyContactPhone,
    emergencyContactRelationship: raw.emergencyContactRelationship,

    // Notas
    notes: raw.notes,

    // Stats
    stats: raw.stats
      ? {
          totalTrips: raw.stats.totalTrips,
          completedTrips: raw.stats.completedTrips,
          cancelledTrips: raw.stats.cancelledTrips,
          averageRating: raw.stats.averageRating,
          yearsOfExperience: raw.stats.yearsOfExperience,
        }
      : undefined,

    // Auditoría
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    createdBy: raw.createdBy,
    updatedBy: raw.updatedBy,
    createdByName: raw.createdByName ?? null,
    updatedByName: raw.updatedByName ?? null,
    branchId: raw.branchId ?? null,
    branchName: raw.branchName ?? null,
    branchCode: raw.branchCode ?? null,
  };
}

/**
 * Mapea un viaje del conductor de API a dominio
 */
export function mapApiDriverTrip(
  api: ApiDriverTripResponse,
): DriverTripSummary {
  return {
    id: api.id,
    tripCode: api.trip_code,
    status: api.status as DriverTripSummary["status"],
    scheduledDeparture: new Date(api.scheduled_departure),
    scheduledArrival: api.scheduled_arrival
      ? new Date(api.scheduled_arrival)
      : null,
    actualDeparture: api.actual_departure
      ? new Date(api.actual_departure)
      : null,
    actualArrival: api.actual_arrival ? new Date(api.actual_arrival) : null,
    originCity: api.origin_city,
    destinationCity: api.destination_city,
    vehicle: {
      id: api.vehicle.id,
      unitNumber: api.vehicle.unit_number,
      licensePlate: api.vehicle.license_plate,
    },
    client: api.client
      ? {
          id: api.client.id,
          legalName: api.client.legal_name,
        }
      : null,
    totalCost: api.total_cost,
    distance: api.distance,
  };
}

// ============================================================================
// PUBLIC MAPPERS
// ============================================================================

/**
 * Mapea respuesta de lista sin paginación (GET /drivers/available).
 */
export function mapDriverListItemsResponse(
  response: { data: ApiDriverListItemResponse[] },
): DriverListItem[] {
  return response.data.map((item) =>
    mapDriverListItemToDomain(deepToCamel(item)),
  );
}

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
  return {
    data: response.data.map(mapApiDriverTrip),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}

// ============================================================================
// MAPPERS: Domain → API (for requests)
// ============================================================================

/**
 * Convierte DTO de creación de conductor a formato API (snake_case)
 */
export function toApiCreateDriver(
  dto: CreateDriverDTO,
): Record<string, unknown> {
  return {
    employee_id: dto.employeeId,

    // Licencias
    federal_license_number: dto.federalLicenseNumber ?? undefined,
    federal_license_category: dto.federalLicenseCategory ?? undefined,
    federal_license_expiry: dto.federalLicenseExpiry ?? undefined,
    state_license_number: dto.stateLicenseNumber ?? undefined,
    state_license_expiry: dto.stateLicenseExpiry ?? undefined,
    state_issuing_state: dto.stateIssuingState ?? undefined,

    // Certificado médico
    medical_certificate_number: dto.medicalCertificateNumber || undefined,
    medical_certificate_expiry: dto.medicalCertificateExpiry || undefined,
    medical_certificate_issuer: dto.medicalCertificateIssuer || undefined,

    // Examen psicométrico
    psychometric_test_date: dto.psychometricTestDate || undefined,
    psychometric_test_result: dto.psychometricTestResult || undefined,

    // Examen antidoping
    last_drug_test_date: dto.lastDrugTestDate || undefined,
    drug_test_result: dto.drugTestResult || undefined,

    // Dispositivo
    assigned_device_id: dto.assignedDeviceId || undefined,

    // Notas
    notes: dto.notes || undefined,
  };
}

/**
 * Convierte DTO de actualización de conductor a formato API (snake_case)
 */
export function toApiUpdateDriver(
  dto: UpdateDriverDTO,
): Record<string, unknown> {
  const apiData: Record<string, unknown> = {};

  // Licencias
  if (dto.federalLicenseNumber !== undefined)
    apiData.federal_license_number = dto.federalLicenseNumber;
  if (dto.federalLicenseCategory !== undefined)
    apiData.federal_license_category = dto.federalLicenseCategory;
  if (dto.federalLicenseExpiry !== undefined)
    apiData.federal_license_expiry = dto.federalLicenseExpiry;
  if (dto.stateLicenseNumber !== undefined)
    apiData.state_license_number = dto.stateLicenseNumber;
  if (dto.stateLicenseExpiry !== undefined)
    apiData.state_license_expiry = dto.stateLicenseExpiry;
  if (dto.stateIssuingState !== undefined)
    apiData.state_issuing_state = dto.stateIssuingState;

  // Certificado médico
  if (dto.medicalCertificateNumber !== undefined)
    apiData.medical_certificate_number = dto.medicalCertificateNumber;
  if (dto.medicalCertificateExpiry !== undefined)
    apiData.medical_certificate_expiry = dto.medicalCertificateExpiry;
  if (dto.medicalCertificateIssuer !== undefined)
    apiData.medical_certificate_issuer = dto.medicalCertificateIssuer;

  // Examen psicométrico
  if (dto.psychometricTestDate !== undefined)
    apiData.psychometric_test_date = dto.psychometricTestDate;
  if (dto.psychometricTestResult !== undefined)
    apiData.psychometric_test_result = dto.psychometricTestResult;

  // Examen antidoping
  if (dto.lastDrugTestDate !== undefined)
    apiData.last_drug_test_date = dto.lastDrugTestDate;
  if (dto.drugTestResult !== undefined)
    apiData.drug_test_result = dto.drugTestResult;

  // Dispositivo
  if (dto.assignedDeviceId !== undefined)
    apiData.assigned_device_id = dto.assignedDeviceId;

  // Notas
  if (dto.notes !== undefined) apiData.notes = dto.notes;

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
