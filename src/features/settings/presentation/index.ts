/**
 * Settings UI - Public API
 *
 * Ubicación: src/features/settings/ui/index.ts
 */

// Routes
export { SettingsRoutes } from "./routes";

// Navigation
export {
  settingsNavItems,
  getSettingsNavItem,
  getActiveSettingsNavItem,
} from "./navigation";
export type { SettingsNavItem } from "./navigation";

// Layout Components
export {
  SettingsLayout,
  SettingsSection,
  SettingsCard,
} from "./components/SettingsLayout";
// Pages (for direct imports if needed)
export { GeneralSettingsPage } from "./pages/GeneralSettingsPage";
export { BillingSettingsPage } from "./pages/BillingSettingsPage";
export { NotificationsSettingsPage } from "./pages/NotificationsSettingsPage";
export { SecuritySettingsPage, UserSecuritySettings } from "./pages/SecuritySettingsPage";
export { IntegrationsSettingsPage } from "./pages/IntegrationsSettingsPage";
