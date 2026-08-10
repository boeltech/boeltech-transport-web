/**
 * Settings Navigation Configuration
 *
 * Configuración de la navegación interna del módulo Settings.
 */

import {
  Building2,
  Database,
  FileText,
  Bell,
  LayoutDashboard,
  MapPin,
  CreditCard,
  FileUp,
  type LucideIcon,
} from "lucide-react";
import { SettingsSection, type SettingsSectionValue } from "../domain";
import type { Module, Action } from "@shared/permissions/domain/entities";

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

export const settingsNavItems: SettingsNavItem[] = [
  {
    id: SettingsSection.GENERAL,
    label: "General",
    description: "Identidad, domicilio y contacto de la empresa",
    path: "/settings/general",
    icon: Building2,
    permission: { module: "settings", action: "read" },
  },
  {
    id: SettingsSection.CATALOGS,
    label: "Catálogos",
    description:
      "Consulta los valores que el sistema usa en viajes, facturas y domicilios",
    path: "/settings/catalogs",
    icon: Database,
    permission: { module: "catalogs", action: "read" },
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
    id: SettingsSection.IMPORTS,
    label: "Cargas",
    description:
      "Sube clientes, direcciones, empleados, vehículos o conductores desde un archivo",
    path: "/settings/imports",
    icon: FileUp,
    permission: { module: "imports", action: "read" },
  },
  {
    id: SettingsSection.BILLING,
    label: "Datos para facturar",
    description:
      "Sello digital, numeración y valores con los que emites tus facturas",
    path: "/settings/billing",
    icon: FileText,
    permission: { module: "settings", action: "read" },
  },
  {
    id: SettingsSection.SUBSCRIPTION,
    label: "Tu plan",
    description: "Cupo para facturar, plan y saldo pendiente",
    path: "/settings/subscription",
    icon: CreditCard,
    permission: { module: "billing", action: "read" },
  },
  {
    id: SettingsSection.NOTIFICATIONS,
    label: "Avisos de la empresa",
    description: "Qué avisos ve el equipo en la campana",
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
  // Integraciones: oculto del nav (placeholder «Próximamente»). Ruta
  // /settings/integrations sigue registrada por si se reactiva el tab.
];

export function getSettingsNavItem(
  id: SettingsSectionValue,
): SettingsNavItem | undefined {
  return settingsNavItems.find((item) => item.id === id);
}

export function getActiveSettingsNavItem(
  pathname: string,
): SettingsNavItem | undefined {
  const exactMatch = settingsNavItems.find((item) => item.path === pathname);
  if (exactMatch) return exactMatch;

  return settingsNavItems.find(
    (item) => pathname.startsWith(item.path) && item.path !== "/settings",
  );
}
