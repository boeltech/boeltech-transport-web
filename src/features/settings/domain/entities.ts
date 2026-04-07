/**
 * Settings Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades y tipos para el módulo de configuración.
 *
 * Ubicación: src/features/settings/domain/entities.ts
 */

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
  readonly address: CompanyAddress;
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
  readonly folioActual: number;
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
  // ── Foliación independiente para Complemento Carta Porte ──────────────────
  /** Serie para documentos con Complemento Carta Porte 3.1 */
  readonly serieCartaPorte: string;
  readonly folioInicialCartaPorte: number;
  readonly folioActualCartaPorte: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const PacProviders = {
  FINKOK: "finkok",
  SW_SAPIEN: "sw_sapien",
  DIGISAT: "digisat",
  FACTURAPI: "facturapi",
} as const;

export type PacProvider = (typeof PacProviders)[keyof typeof PacProviders];

export const PAC_PROVIDER_LABELS: Record<PacProvider, string> = {
  [PacProviders.FINKOK]: "Finkok",
  [PacProviders.SW_SAPIEN]: "SW Sapien",
  [PacProviders.DIGISAT]: "Digisat",
  [PacProviders.FACTURAPI]: "Facturapi",
};

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
  BILLING: "billing",
  NOTIFICATIONS: "notifications",
  SECURITY: "security",
  INTEGRATIONS: "integrations",
} as const;

export type SettingsSectionValue =
  (typeof SettingsSection)[keyof typeof SettingsSection];

export const SETTINGS_SECTION_LABELS: Record<SettingsSectionValue, string> = {
  [SettingsSection.GENERAL]: "General",
  [SettingsSection.CATALOGS]: "Catálogos",
  [SettingsSection.BILLING]: "Facturación",
  [SettingsSection.NOTIFICATIONS]: "Notificaciones",
  [SettingsSection.SECURITY]: "Seguridad",
  [SettingsSection.INTEGRATIONS]: "Integraciones",
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const settingsQueryKeys = {
  all: ["settings"] as const,
  company: () => [...settingsQueryKeys.all, "company"] as const,
  billing: () => [...settingsQueryKeys.all, "billing"] as const,
  notifications: () => [...settingsQueryKeys.all, "notifications"] as const,
};
