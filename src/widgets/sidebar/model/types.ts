import { LucideIcon } from "lucide-react";
import { Module } from "@features/permissions/model/types";

/**
 * Item de navegación individual
 */
export interface NavItem {
  /** Identificador único */
  id: string;

  /** Texto a mostrar */
  label: string;

  /** Ruta de navegación */
  path: string;

  /** Icono de Lucide */
  icon: LucideIcon;

  /** Módulo requerido para ver este item */
  module?: Module;

  /** Badge opcional (ej: contador de notificaciones) */
  badge?: number | string;
}

/**
 * Grupo de navegación (ej: "Operaciones", "Finanzas")
 */
export interface NavGroup {
  /** Identificador único */
  id: string;

  /** Título del grupo */
  title: string;

  /** Items dentro del grupo */
  items: NavItem[];

  /** Módulo requerido para ver todo el grupo */
  module?: Module;
}

/**
 * Estado del sidebar
 */
export interface SidebarState {
  /** Si está colapsado (solo iconos) */
  isCollapsed: boolean;

  /** Si está abierto en móvil */
  isMobileOpen: boolean;
}
