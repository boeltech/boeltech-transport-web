/**
 * Settings Infrastructure - Public API
 *
 * Ubicación: src/features/settings/infrastructure/index.ts
 */

export { settingsRepository, SettingsRepository } from "./settingsRepository";

export {
  mapCompanySettings,
  mapBillingSettings,
  mapFinkokEmitter,
  mapNotificationSettings,
  toApiUpdateCompanySettings,
  toApiUpdateBillingSettings,
  toApiUpdateNotificationSettings,
} from "./mappers";

export type {
  ApiCompanySettingsResponse,
  ApiCompanyAddressResponse,
  ApiBillingSettingsResponse,
  ApiFinkokEmitterResponse,
  ApiNotificationSettingsResponse,
} from "./mappers";
