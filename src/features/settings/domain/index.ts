/**
 * Settings Domain - Public API
 *
 * Ubicación: src/features/settings/domain/index.ts
 */

// Entities & Types
export {
  SettingsSection,
  SETTINGS_SECTION_LABELS,
  PacProviders,
  PAC_PROVIDER_LABELS,
  settingsQueryKeys,
} from "./entities";

export type {
  SettingsSectionValue,
  CompanySettings,
  CompanyAddress,
  BillingSettings,
  PacProvider,
  NotificationSettings,
} from "./entities";

// Repository interface & DTOs
export type {
  ISettingsRepository,
  UpdateCompanySettingsDTO,
  UpdateBillingSettingsDTO,
  UploadCertificateDTO,
  UpdateNotificationSettingsDTO,
  SettingsResult,
  UploadLogoResult,
} from "./repository";
