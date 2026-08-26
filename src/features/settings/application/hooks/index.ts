/**
 * Settings Hooks - Public API
 *
 * Ubicación: src/features/settings/application/hooks/index.ts
 */

// Company Settings
export {
  useCompanySettings,
  useCompanyLogoObjectUrl,
  useUpdateCompanySettings,
  useUploadLogo,
  useDeleteLogo,
} from "./useCompanySettings";

// Billing Settings
export {
  useBillingSettings,
  useUpdateBillingSettings,
  useUploadCertificate,
  useTestPacConnection,
  useRegisterPacEmitter,
} from "./useBillingSettings";

// Billing Service Concepts
export { useBillingServiceConcepts } from "./useBillingServiceConcepts";

// Billing Schemes (ADR-0082)
export {
  useBillingSchemes,
  useBillingScheme,
  useCreateBillingScheme,
  useUpdateBillingScheme,
  useDeleteBillingScheme,
} from "./useBillingSchemes";

// Notification Settings
export {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "./useNotificationSettings";
