/**
 * Settings Repository Interface
 * Clean Architecture - Domain Layer (Ports)
 *
 * Define los DTOs y la interfaz del repositorio.
 *
 * Ubicación: src/features/settings/domain/repository.ts
 */

import type {
  CompanySettings,
  BillingSettings,
  NotificationSettings,
} from "./entities";

// ============================================================================
// DTOs - Company Settings
// ============================================================================

export interface UpdateCompanySettingsDTO {
  legalName?: string;
  tradeName?: string | null;
  rfc?: string;
  regimenFiscal?: string;
  email?: string;
  phone?: string | null;
  website?: string | null;
  address?: {
    street?: string;
    exteriorNumber?: string;
    interiorNumber?: string | null;
    neighborhood?: string;
    city?: string;
    municipality?: string;
    state?: string;
    stateCode?: string;
    postalCode?: string;
    country?: string;
  };
}

// ============================================================================
// DTOs - Billing Settings
// ============================================================================

export interface UpdateBillingSettingsDTO {
  pacProvider?: string;
  pacUsername?: string;
  pacPassword?: string; // Solo se envía cuando se actualiza
  defaultUsoCfdi?: string;
  defaultFormaPago?: string;
  defaultMetodoPago?: string;
  serieFactura?: string;
  folioInicial?: number;
  testMode?: boolean;
}

export interface UploadCertificateDTO {
  certificate: File;
  privateKey: File;
  password: string;
}

// ============================================================================
// DTOs - Notification Settings
// ============================================================================

export interface UpdateNotificationSettingsDTO {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  tripReminders?: boolean;
  tripReminderHours?: number;
  maintenanceAlerts?: boolean;
  maintenanceAlertDays?: number;
  documentExpiryAlerts?: boolean;
  documentExpiryDays?: number;
  dailyDigest?: boolean;
  digestTime?: string;
}

// ============================================================================
// Result Types
// ============================================================================

export interface SettingsResult<T> {
  data: T;
  message?: string;
}

export interface UploadLogoResult {
  logoUrl: string;
  message?: string;
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface ISettingsRepository {
  // ─────────────────────────────────────────────────────────────────────────
  // Company Settings
  // ─────────────────────────────────────────────────────────────────────────

  getCompanySettings(): Promise<CompanySettings>;
  updateCompanySettings(
    data: UpdateCompanySettingsDTO,
  ): Promise<SettingsResult<CompanySettings>>;
  uploadLogo(file: File): Promise<UploadLogoResult>;
  deleteLogo(): Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────
  // Billing Settings
  // ─────────────────────────────────────────────────────────────────────────

  getBillingSettings(): Promise<BillingSettings>;
  updateBillingSettings(
    data: UpdateBillingSettingsDTO,
  ): Promise<SettingsResult<BillingSettings>>;
  uploadCertificate(
    data: UploadCertificateDTO,
  ): Promise<SettingsResult<BillingSettings>>;
  testPacConnection(): Promise<{ success: boolean; message: string }>;

  // ─────────────────────────────────────────────────────────────────────────
  // Notification Settings
  // ─────────────────────────────────────────────────────────────────────────

  getNotificationSettings(): Promise<NotificationSettings>;
  updateNotificationSettings(
    data: UpdateNotificationSettingsDTO,
  ): Promise<SettingsResult<NotificationSettings>>;
}
