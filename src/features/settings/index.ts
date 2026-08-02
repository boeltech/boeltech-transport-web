/**
 * Settings Module - Public API
 *
 * Módulo de configuración del ERP.
 * Incluye: datos de empresa, facturación, notificaciones, catálogos.
 *
 * Ubicación: src/features/settings/index.ts
 *
 * @example
 * // En el router principal
 * import { SettingsRoutes } from "@features/settings";
 * <Route path="settings/*" element={<SettingsRoutes />} />
 *
 * @example
 * // Usar hooks
 * import { useCompanySettings, useBillingSettings } from "@features/settings";
 * const { data: company } = useCompanySettings();
 */

// ============================================================================
// ROUTES (main export for router integration)
// ============================================================================

export { SettingsRoutes } from "./presentation/routes";

// ============================================================================
// DOMAIN (entities, types, constants)
// ============================================================================

export {
  SettingsSection,
  SETTINGS_SECTION_LABELS,
  PacProviders,
  PAC_PROVIDER_LABELS,
  SELECTABLE_PAC_PROVIDERS,
  resolveSelectablePacProvider,
  settingsQueryKeys,
} from "./domain";

export type {
  SettingsSectionValue,
  CompanySettings,
  CompanyAddress,
  BillingSettings,
  PacProvider,
  NotificationSettings,
  UpdateCompanySettingsDTO,
  UpdateBillingSettingsDTO,
  UpdateNotificationSettingsDTO,
} from "./domain";

// ============================================================================
// APPLICATION (hooks)
// ============================================================================

export {
  // Company
  useCompanySettings,
  useUpdateCompanySettings,
  useUploadLogo,
  useDeleteLogo,
  // Billing
  useBillingSettings,
  useUpdateBillingSettings,
  useUploadCertificate,
  useTestPacConnection,
  // Notifications
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "./application";

// ============================================================================
// UI (components, pages, navigation)
// ============================================================================

export {
  // Navigation
  settingsNavItems,
  getSettingsNavItem,
  getActiveSettingsNavItem,
  // Layout components
  SettingsLayout,
  SettingsSection as SettingsSectionComponent,
  SettingsCard,
  // Account security panels (Mi cuenta)
  UserSecuritySettings,
} from "./presentation";

export type { SettingsNavItem } from "./presentation";
