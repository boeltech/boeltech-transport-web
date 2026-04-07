/**
 * Settings API Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforma los datos entre el formato de la API (snake_case)
 * y el formato del dominio (camelCase).
 *
 * Ubicación: src/features/settings/infrastructure/mappers.ts
 */

import type {
  CompanySettings,
  CompanyAddress,
  BillingSettings,
  NotificationSettings,
  PacProvider,
  UpdateCompanySettingsDTO,
  UpdateBillingSettingsDTO,
  UpdateNotificationSettingsDTO,
} from "../domain";

// ============================================================================
// API RESPONSE TYPES (snake_case from backend)
// ============================================================================

export interface ApiCompanyAddressResponse {
  street: string;
  exterior_number: string;
  interior_number: string | null;
  neighborhood: string;
  city: string;
  municipality: string;
  state: string;
  state_code: string;
  postal_code: string;
  country: string;
}

export interface ApiCompanySettingsResponse {
  id: string;
  tenant_id: string;
  legal_name: string;
  trade_name: string | null;
  rfc: string;
  regimen_fiscal: string;
  regimen_fiscal_descripcion: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  address: ApiCompanyAddressResponse;
  lugar_expedicion: string;
  created_at: string;
  updated_at: string;
}

export interface ApiBillingSettingsResponse {
  id: string;
  tenant_id: string;
  pac_provider: string;
  pac_username: string;
  pac_password_configured: boolean;
  certificate_configured: boolean;
  certificate_expiry: string | null;
  default_uso_cfdi: string;
  default_forma_pago: string;
  default_metodo_pago: string;
  serie_factura: string;
  folio_inicial: number;
  folio_actual: number;
  test_mode: boolean;
  clave_producto_servicio: string;
  clave_unidad: string;
  moneda: string;
  tasa_iva: number;
  serie_carta_porte: string;
  folio_inicial_carta_porte: number;
  folio_actual_carta_porte: number;
  created_at: string;
  updated_at: string;
}

export interface ApiNotificationSettingsResponse {
  id: string;
  tenant_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  trip_reminders: boolean;
  trip_reminder_hours: number;
  maintenance_alerts: boolean;
  maintenance_alert_days: number;
  document_expiry_alerts: boolean;
  document_expiry_days: number;
  daily_digest: boolean;
  digest_time: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MAPPERS: API → Domain
// ============================================================================

export function mapCompanyAddress(
  api: ApiCompanyAddressResponse,
): CompanyAddress {
  return {
    street: api.street,
    exteriorNumber: api.exterior_number,
    interiorNumber: api.interior_number,
    neighborhood: api.neighborhood,
    city: api.city,
    municipality: api.municipality,
    state: api.state,
    stateCode: api.state_code,
    postalCode: api.postal_code,
    country: api.country,
  };
}

export function mapCompanySettings(
  api: ApiCompanySettingsResponse,
): CompanySettings {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    legalName: api.legal_name,
    tradeName: api.trade_name,
    rfc: api.rfc,
    regimenFiscal: api.regimen_fiscal,
    regimenFiscalDescripcion: api.regimen_fiscal_descripcion,
    email: api.email,
    phone: api.phone,
    website: api.website,
    logoUrl: api.logo_url,
    address: mapCompanyAddress(api.address),
    lugarExpedicion: api.lugar_expedicion,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
  };
}

export function mapBillingSettings(
  api: ApiBillingSettingsResponse,
): BillingSettings {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    pacProvider: api.pac_provider as PacProvider,
    pacUsername: api.pac_username,
    pacPasswordConfigured: api.pac_password_configured,
    certificateConfigured: api.certificate_configured,
    certificateExpiry: api.certificate_expiry,
    defaultUsoCfdi: api.default_uso_cfdi,
    defaultFormaPago: api.default_forma_pago,
    defaultMetodoPago: api.default_metodo_pago,
    serieFactura: api.serie_factura,
    folioInicial: api.folio_inicial,
    folioActual: api.folio_actual,
    testMode: api.test_mode,
    claveProductoServicio: api.clave_producto_servicio,
    claveUnidad: api.clave_unidad,
    moneda: api.moneda,
    tasaIva: api.tasa_iva,
    serieCartaPorte: api.serie_carta_porte,
    folioInicialCartaPorte: api.folio_inicial_carta_porte,
    folioActualCartaPorte: api.folio_actual_carta_porte,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
  };
}

export function mapNotificationSettings(
  api: ApiNotificationSettingsResponse,
): NotificationSettings {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    emailNotifications: api.email_notifications,
    smsNotifications: api.sms_notifications,
    pushNotifications: api.push_notifications,
    tripReminders: api.trip_reminders,
    tripReminderHours: api.trip_reminder_hours,
    maintenanceAlerts: api.maintenance_alerts,
    maintenanceAlertDays: api.maintenance_alert_days,
    documentExpiryAlerts: api.document_expiry_alerts,
    documentExpiryDays: api.document_expiry_days,
    dailyDigest: api.daily_digest,
    digestTime: api.digest_time,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
  };
}

// ============================================================================
// MAPPERS: Domain → API (for requests)
// ============================================================================

export function toApiUpdateCompanySettings(
  dto: UpdateCompanySettingsDTO,
): Record<string, unknown> {
  const apiData: Record<string, unknown> = {};

  if (dto.legalName !== undefined) apiData.legal_name = dto.legalName;
  if (dto.tradeName !== undefined) apiData.trade_name = dto.tradeName;
  if (dto.rfc !== undefined) apiData.rfc = dto.rfc;
  if (dto.regimenFiscal !== undefined)
    apiData.regimen_fiscal = dto.regimenFiscal;
  if (dto.email !== undefined) apiData.email = dto.email;
  if (dto.phone !== undefined) apiData.phone = dto.phone;
  if (dto.website !== undefined) apiData.website = dto.website;

  if (dto.address) {
    apiData.address = {
      street: dto.address.street,
      exterior_number: dto.address.exteriorNumber,
      interior_number: dto.address.interiorNumber,
      neighborhood: dto.address.neighborhood,
      city: dto.address.city,
      municipality: dto.address.municipality,
      state: dto.address.state,
      state_code: dto.address.stateCode,
      postal_code: dto.address.postalCode,
      country: dto.address.country,
    };
  }

  if (dto.lugarExpedicion !== undefined)
    apiData.lugar_expedicion = dto.lugarExpedicion;

  return apiData;
}

export function toApiUpdateBillingSettings(
  dto: UpdateBillingSettingsDTO,
): Record<string, unknown> {
  const apiData: Record<string, unknown> = {};

  if (dto.pacProvider !== undefined) apiData.pac_provider = dto.pacProvider;
  if (dto.pacUsername !== undefined) apiData.pac_username = dto.pacUsername;
  if (dto.pacPassword !== undefined) apiData.pac_password = dto.pacPassword;
  if (dto.defaultUsoCfdi !== undefined)
    apiData.default_uso_cfdi = dto.defaultUsoCfdi;
  if (dto.defaultFormaPago !== undefined)
    apiData.default_forma_pago = dto.defaultFormaPago;
  if (dto.defaultMetodoPago !== undefined)
    apiData.default_metodo_pago = dto.defaultMetodoPago;
  if (dto.serieFactura !== undefined) apiData.serie_factura = dto.serieFactura;
  if (dto.folioInicial !== undefined) apiData.folio_inicial = dto.folioInicial;
  if (dto.testMode !== undefined) apiData.test_mode = dto.testMode;
  if (dto.claveProductoServicio !== undefined)
    apiData.clave_producto_servicio = dto.claveProductoServicio;
  if (dto.claveUnidad !== undefined) apiData.clave_unidad = dto.claveUnidad;
  if (dto.moneda !== undefined) apiData.moneda = dto.moneda;
  if (dto.tasaIva !== undefined) apiData.tasa_iva = dto.tasaIva;
  if (dto.serieCartaPorte !== undefined)
    apiData.serie_carta_porte = dto.serieCartaPorte;
  if (dto.folioInicialCartaPorte !== undefined)
    apiData.folio_inicial_carta_porte = dto.folioInicialCartaPorte;

  return apiData;
}

export function toApiUpdateNotificationSettings(
  dto: UpdateNotificationSettingsDTO,
): Record<string, unknown> {
  const apiData: Record<string, unknown> = {};

  if (dto.emailNotifications !== undefined)
    apiData.email_notifications = dto.emailNotifications;
  if (dto.smsNotifications !== undefined)
    apiData.sms_notifications = dto.smsNotifications;
  if (dto.pushNotifications !== undefined)
    apiData.push_notifications = dto.pushNotifications;
  if (dto.tripReminders !== undefined)
    apiData.trip_reminders = dto.tripReminders;
  if (dto.tripReminderHours !== undefined)
    apiData.trip_reminder_hours = dto.tripReminderHours;
  if (dto.maintenanceAlerts !== undefined)
    apiData.maintenance_alerts = dto.maintenanceAlerts;
  if (dto.maintenanceAlertDays !== undefined)
    apiData.maintenance_alert_days = dto.maintenanceAlertDays;
  if (dto.documentExpiryAlerts !== undefined)
    apiData.document_expiry_alerts = dto.documentExpiryAlerts;
  if (dto.documentExpiryDays !== undefined)
    apiData.document_expiry_days = dto.documentExpiryDays;
  if (dto.dailyDigest !== undefined) apiData.daily_digest = dto.dailyDigest;
  if (dto.digestTime !== undefined) apiData.digest_time = dto.digestTime;

  return apiData;
}
