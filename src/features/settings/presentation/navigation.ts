/**
 * Settings Navigation Configuration
 *
 * Configuración de la navegación interna del módulo Settings.
 *
 * Ubicación: src/features/settings/ui/navigation.ts
 */

import {
  Building2,
  Database,
  FileText,
  Bell,
  Shield,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { SettingsSection, type SettingsSectionValue } from "../domain";

// ============================================================================
// TYPES
// ============================================================================

export interface SettingsNavItem {
  id: SettingsSectionValue;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  /** Módulo de permisos requerido (si aplica) */
  permission?: {
    module: string;
    action: string;
  };
  /** Si está deshabilitado temporalmente */
  disabled?: boolean;
  /** Badge opcional */
  badge?: string;
}

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

export const settingsNavItems: SettingsNavItem[] = [
  {
    id: SettingsSection.GENERAL,
    label: "General",
    description: "Datos de la empresa, logo y dirección fiscal",
    path: "/settings/general",
    icon: Building2,
  },
  {
    id: SettingsSection.CATALOGS,
    label: "Catálogos",
    description: "Catálogos SAT e internos del sistema",
    path: "/settings/catalogs",
    icon: Database,
  },
  {
    id: SettingsSection.BILLING,
    label: "Facturación",
    description: "Configuración de CFDI, PAC y certificados",
    path: "/settings/billing",
    icon: FileText,
    permission: { module: "invoices", action: "manage" },
  },
  {
    id: SettingsSection.NOTIFICATIONS,
    label: "Notificaciones",
    description: "Preferencias de alertas y notificaciones",
    path: "/settings/notifications",
    icon: Bell,
  },
  {
    id: SettingsSection.SECURITY,
    label: "Seguridad",
    description: "Políticas de contraseñas y autenticación",
    path: "/settings/security",
    icon: Shield,
    disabled: true,
    badge: "Próximamente",
  },
  {
    id: SettingsSection.INTEGRATIONS,
    label: "Integraciones",
    description: "APIs externas y webhooks",
    path: "/settings/integrations",
    icon: Plug,
    disabled: true,
    badge: "Próximamente",
  },
];

/**
 * Obtiene un item de navegación por su ID
 */
export function getSettingsNavItem(
  id: SettingsSectionValue,
): SettingsNavItem | undefined {
  return settingsNavItems.find((item) => item.id === id);
}

/**
 * Obtiene el item activo basado en el pathname
 */
export function getActiveSettingsNavItem(
  pathname: string,
): SettingsNavItem | undefined {
  // Buscar coincidencia exacta primero
  const exactMatch = settingsNavItems.find((item) => item.path === pathname);
  if (exactMatch) return exactMatch;

  // Buscar por prefijo (para subrutas como /settings/catalogs/sat_estado)
  return settingsNavItems.find(
    (item) => pathname.startsWith(item.path) && item.path !== "/settings",
  );
}
