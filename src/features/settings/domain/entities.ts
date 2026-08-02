/**
 * Settings Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades y tipos para el módulo de configuración.
 *
 * Ubicación: src/features/settings/domain/entities.ts
 */

import type { ClientAddress } from "@features/clients/domain";

// ============================================================================
// COMPANY SETTINGS
// ============================================================================

/**
 * Configuración de la empresa
 */
export interface CompanySettings {
  readonly id: string;
  readonly tenantId: string;
  readonly legalName: string;
  readonly tradeName: string | null;
  readonly rfc: string;
  readonly regimenFiscal: string;
  readonly regimenFiscalDescripcion: string | null;
  readonly email: string;
  readonly phone: string | null;
  readonly website: string | null;
  readonly logoUrl: string | null;
  /** Domicilio fiscal en tabla unificada `addresses` (owner tenant) */
  readonly fiscalAddress: ClientAddress | null;
  /**
   * Domicilio embebido legacy en `/settings/company` (texto libre).
   * Se usa solo para prellenar el formulario si aún no hay `fiscalAddress`.
   */
  readonly legacyCompanyAddress: CompanyAddress | null;
  /** Código postal del lugar de expedición (atributo LugarExpedicion del CFDI 4.0) */
  readonly lugarExpedicion: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CompanyAddress {
  readonly street: string;
  readonly exteriorNumber: string;
  readonly interiorNumber: string | null;
  readonly neighborhood: string;
  readonly city: string;
  readonly municipality: string;
  readonly state: string;
  readonly stateCode: string;
  readonly postalCode: string;
  readonly country: string;
}

// ============================================================================
// BILLING SETTINGS (CFDI)
// ============================================================================

/**
 * Configuración de facturación electrónica
 */
export interface BillingSettings {
  readonly id: string;
  readonly tenantId: string;
  readonly pacProvider: PacProvider;
  readonly pacUsername: string;
  readonly pacPasswordConfigured: boolean; // No exponer el password real
  readonly certificateConfigured: boolean;
  readonly certificateExpiry: string | null;
  readonly defaultUsoCfdi: string;
  readonly defaultFormaPago: string;
  readonly defaultMetodoPago: string;
  readonly serieFactura: string;
  readonly folioInicial: number;
  readonly testMode: boolean;
  // ── Claves SAT por defecto para conceptos del CFDI ────────────────────────
  /** Clave del producto/servicio SAT (ej. 78101800 = Transporte de carga) */
  readonly claveProductoServicio: string;
  /** Clave de unidad SAT (ej. E48 = Unidad de servicio) */
  readonly claveUnidad: string;
  /** Moneda por defecto (ej. MXN) */
  readonly moneda: string;
  /** Tasa de IVA por defecto (0.16 = 16%, 0 = tasa 0%) */
  readonly tasaIva: number;
  /**
   * Folio que tomará la próxima factura de `serieFactura`, calculado por el
   * servidor sobre las facturas ya emitidas. `null` si el servidor no lo envía.
   */
  readonly nextFolio: number | null;
  /**
   * True cuando ya hay facturas en la serie configurada. Bloquea la edición
   * del primer folio en pantalla (el API también lo rechaza con 422).
   */
  readonly hasIssuedInvoices: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const PacProviders = {
  PROFACT: "profact",
  FINKOK: "finkok",
  SW_SAPIEN: "sw_sapien",
  DIGISAT: "digisat",
  FACTURAPI: "facturapi",
  STUB: "stub",
} as const;

export type PacProvider = (typeof PacProviders)[keyof typeof PacProviders];

export const PAC_PROVIDER_LABELS: Record<PacProvider, string> = {
  [PacProviders.PROFACT]: "ProFact",
  [PacProviders.FINKOK]: "Finkok",
  [PacProviders.SW_SAPIEN]: "SW Sapien",
  [PacProviders.DIGISAT]: "Digisat",
  [PacProviders.FACTURAPI]: "Facturapi",
  [PacProviders.STUB]: "Stub (desarrollo)",
};

/**
 * PACs que autentican mediante credenciales por tenant (usuario + contraseña).
 * ProFact y Stub usan configuración a nivel servidor (variables de entorno).
 */
export const PAC_USES_CREDENTIALS: Record<PacProvider, boolean> = {
  [PacProviders.PROFACT]: false,
  [PacProviders.FINKOK]: true,
  [PacProviders.SW_SAPIEN]: true,
  [PacProviders.DIGISAT]: true,
  [PacProviders.FACTURAPI]: true,
  [PacProviders.STUB]: false,
};

/**
 * PACs con adapter implementado en API. Ampliar al habilitar Finkok, SW Sapien, etc.
 * Mientras solo haya uno, la UI deja ProFact fijo y deshabilita el selector.
 */
export const SELECTABLE_PAC_PROVIDERS: readonly PacProvider[] = [
  PacProviders.PROFACT,
];

export function resolveSelectablePacProvider(
  stored: string | null | undefined,
): PacProvider {
  if (
    stored &&
    SELECTABLE_PAC_PROVIDERS.includes(stored as PacProvider)
  ) {
    return stored as PacProvider;
  }
  return SELECTABLE_PAC_PROVIDERS[0] ?? PacProviders.PROFACT;
}

// ============================================================================
// PAC TEST CONNECTION
// ============================================================================

export interface TestPacConnectionPayload {
  pacProvider?: PacProvider;
  pacUsername?: string;
  pacPassword?: string;
}

export type PacTestErrorType =
  | "not_implemented"
  | "config_missing"
  | "auth"
  | "network"
  | "unknown";

export interface TestPacConnectionResult {
  success: boolean;
  message: string;
  provider: PacProvider | null;
  environment: "production" | "sandbox" | null;
  errorType: PacTestErrorType | null;
}

export type PacEmitterRegisterReason =
  | "provider_not_profact"
  | "missing_rfc"
  | "missing_csd"
  | "missing_csd_password"
  | "register_failed"
  | null;

export interface RegisterPacEmitterResult {
  success: boolean;
  attempted: boolean;
  provider: PacProvider | null;
  message: string;
  reason: PacEmitterRegisterReason;
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

/**
 * Preferencias de notificaciones
 */
export interface NotificationSettings {
  readonly id: string;
  readonly tenantId: string;
  readonly emailNotifications: boolean;
  readonly smsNotifications: boolean;
  readonly pushNotifications: boolean;
  readonly tripReminders: boolean;
  readonly tripReminderHours: number;
  readonly maintenanceAlerts: boolean;
  readonly maintenanceAlertDays: number;
  readonly documentExpiryAlerts: boolean;
  readonly documentExpiryDays: number;
  readonly dailyDigest: boolean;
  readonly digestTime: string; // HH:mm format
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================================
// SETTINGS NAVIGATION
// ============================================================================

/**
 * Secciones de configuración disponibles
 */
export const SettingsSection = {
  GENERAL: "general",
  CATALOGS: "catalogs",
  LOCATIONS: "locations",
  BILLING: "billing",
  SUBSCRIPTION: "subscription",
  NOTIFICATIONS: "notifications",
  DASHBOARD_LAYOUTS: "dashboard-layouts",
  SECURITY: "security",
  INTEGRATIONS: "integrations",
} as const;

export type SettingsSectionValue =
  (typeof SettingsSection)[keyof typeof SettingsSection];

export const SETTINGS_SECTION_LABELS: Record<SettingsSectionValue, string> = {
  [SettingsSection.GENERAL]: "General",
  [SettingsSection.CATALOGS]: "Catálogos",
  [SettingsSection.LOCATIONS]: "Directorio",
  [SettingsSection.BILLING]: "Facturación",
  [SettingsSection.SUBSCRIPTION]: "Plan y consumo",
  [SettingsSection.NOTIFICATIONS]: "Notificaciones",
  [SettingsSection.DASHBOARD_LAYOUTS]: "Dashboard",
  [SettingsSection.SECURITY]: "Seguridad",
  [SettingsSection.INTEGRATIONS]: "Integraciones",
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const settingsQueryKeys = {
  all: ["settings"] as const,
  company: () => [...settingsQueryKeys.all, "company"] as const,
  locations: () => [...settingsQueryKeys.all, "locations"] as const,
  location: (id: string) => [...settingsQueryKeys.locations(), id] as const,
  billing: () => [...settingsQueryKeys.all, "billing"] as const,
  billingServiceConcepts: (params?: { search?: string; isActive?: boolean }) =>
    [...settingsQueryKeys.all, "billing-service-concepts", params ?? {}] as const,
  notifications: () => [...settingsQueryKeys.all, "notifications"] as const,
};
