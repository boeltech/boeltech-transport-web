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
  LayoutDashboard,
  Plug,
  MapPin,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { SettingsSection, type SettingsSectionValue } from "../domain";
import type { Module, Action } from "@shared/permissions/domain/entities";

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
    module: Module;
    action: Action;
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
    permission: { module: "settings", action: "update" },
  },
  {
    id: SettingsSection.CATALOGS,
    label: "Catálogos",
    description: "Consulta catálogos regulatorios y administra los internos de tu empresa",
    path: "/settings/catalogs",
    icon: Database,
    permission: { module: "settings", action: "update" },
  },
  {
    id: SettingsSection.LOCATIONS,
    label: "Directorio",
    description: "Bodegas y ubicaciones reutilizables para paradas",
    path: "/settings/locations",
    icon: MapPin,
    permission: { module: "settings", action: "update" },
  },
  {
    id: SettingsSection.BILLING,
    label: "Facturación",
    description: "Configuración de CFDI, PAC y certificados",
    path: "/settings/billing",
    icon: FileText,
    permission: { module: "settings", action: "read" },
  },
  {
    id: SettingsSection.SUBSCRIPTION,
    label: "Plan y consumo",
    description: "Plan comercial, timbres y módulos contratados",
    path: "/settings/subscription",
    icon: CreditCard,
    permission: { module: "billing", action: "read" },
  },
  {
    id: SettingsSection.NOTIFICATIONS,
    label: "Notificaciones",
    description: "Preferencias de alertas y notificaciones",
    path: "/settings/notifications",
    icon: Bell,
    permission: { module: "settings", action: "update" },
  },
  {
    id: SettingsSection.DASHBOARD_LAYOUTS,
    label: "Dashboard",
    description: "Orden y visibilidad de widgets por rol",
    path: "/settings/dashboard-layouts",
    icon: LayoutDashboard,
    permission: { module: "settings", action: "update" },
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
