/**
 * Settings Infrastructure - Public API
 *
 * Ubicación: src/features/settings/infrastructure/index.ts
 */

export { settingsRepository, SettingsRepository } from "./settingsRepository";

export {
  mapCompanySettings,
  mapBillingSettings,
  mapNotificationSettings,
  toApiUpdateCompanySettings,
  toApiUpdateBillingSettings,
  toApiUpdateNotificationSettings,
} from "./mappers";

export type {
  ApiCompanySettingsResponse,
  ApiCompanyAddressResponse,
  ApiBillingSettingsResponse,
  ApiNotificationSettingsResponse,
} from "./mappers";
