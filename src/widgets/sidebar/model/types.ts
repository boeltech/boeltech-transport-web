/**
 * Sidebar Types
 *
 * Tipos para el sistema de navegación del sidebar.
 *
 * Ubicación: src/widgets/sidebar/model/types.ts
 */

import type { LucideIcon } from "lucide-react";
import type { Module, Action } from "@/shared/permissions";

// ============================================
// NAVIGATION ITEM
// ============================================

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
  /** Acción requerida (default: 'read') */
  action?: Action;
  /** Badge opcional (ej: contador de notificaciones) */
  badge?: number | string;
  /** Si está deshabilitado */
  disabled?: boolean;
}

// ============================================
// NAVIGATION GROUP
// ============================================

/**
 * Grupo de navegación (ej: "Operaciones", "Finanzas")
 */
export interface NavGroup {
  /** Identificador único */
  id: string;
  /** Título del grupo (vacío = sin header) */
  title: string;
  /** Items dentro del grupo */
  items: NavItem[];
  /** Módulo requerido para ver todo el grupo */
  module?: Module;
  /** Acción requerida para el grupo */
  action?: Action;
}

// ============================================
// SIDEBAR STATE
// ============================================

/**
 * Estado del sidebar
 */
export interface SidebarState {
  /** Si está colapsado (solo iconos) */
  isCollapsed: boolean;
  /** Si está abierto en móvil */
  isMobileOpen: boolean;
}

/**
 * Acciones del sidebar
 */
export interface SidebarActions {
  /** Alternar colapsado */
  toggle: () => void;
  /** Colapsar */
  collapse: () => void;
  /** Expandir */
  expand: () => void;
  /** Abrir en móvil */
  openMobile: () => void;
  /** Cerrar en móvil */
  closeMobile: () => void;
}

/**
 * Contexto completo del sidebar
 */
export interface SidebarContextValue extends SidebarState, SidebarActions {}
