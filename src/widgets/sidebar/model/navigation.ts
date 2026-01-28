/**
 * Navigation Configuration
 *
 * Configuración completa de la navegación del sidebar.
 * Los módulos corresponden a los definidos en el sistema de permisos.
 *
 * Ubicación: src/widgets/sidebar/model/navigation.ts
 */

import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  FileText,
  // Receipt,
  // CreditCard,
  UserCog,
  // ClipboardList,
  // Package,
  BarChart3,
  Settings,
  // Shield,
  // History,
  Wrench,
  Fuel,
  Building2,
} from "lucide-react";
import type { NavGroup } from "./types";

/**
 * Configuración completa de la navegación
 *
 * IMPORTANTE: Los valores de `module` deben coincidir con los
 * definidos en src/shared/auth/domain/entities.ts
 *
 * Módulos disponibles:
 * - dashboard, trips, vehicles, drivers, clients
 * - maintenance, fuel, invoices, reports, users, settings
 */
export const navigationConfig: NavGroup[] = [
  // ============================================
  // PRINCIPAL
  // ============================================
  {
    id: "main",
    title: "", // Sin título = sin header
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        module: "dashboard",
      },
    ],
  },

  // ============================================
  // OPERACIONES
  // ============================================
  {
    id: "operations",
    title: "Operaciones",
    items: [
      {
        id: "trips",
        label: "Viajes",
        path: "/trips",
        icon: Route,
        module: "trips",
      },
    ],
  },

  // ============================================
  // FLOTA
  // ============================================
  {
    id: "fleet",
    title: "Flota",
    items: [
      {
        id: "vehicles",
        label: "Vehículos",
        path: "/vehicles",
        icon: Truck,
        module: "vehicles",
      },
      {
        id: "drivers",
        label: "Conductores",
        path: "/drivers",
        icon: Users,
        module: "drivers",
      },
      {
        id: "maintenance",
        label: "Mantenimiento",
        path: "/maintenance",
        icon: Wrench,
        module: "maintenance",
      },
      {
        id: "fuel",
        label: "Combustible",
        path: "/fuel",
        icon: Fuel,
        module: "fuel",
      },
    ],
  },

  // ============================================
  // CLIENTES
  // ============================================
  {
    id: "clients",
    title: "Clientes",
    items: [
      {
        id: "clients-list",
        label: "Clientes",
        path: "/clients",
        icon: Building2,
        module: "clients",
      },
    ],
  },

  // ============================================
  // FINANZAS
  // ============================================
  {
    id: "finance",
    title: "Finanzas",
    items: [
      {
        id: "invoices",
        label: "Facturación",
        path: "/invoices",
        icon: FileText,
        module: "invoices",
      },
    ],
  },

  // ============================================
  // REPORTES
  // ============================================
  {
    id: "reports",
    title: "Reportes",
    items: [
      {
        id: "reports-list",
        label: "Reportes",
        path: "/reports",
        icon: BarChart3,
        module: "reports",
      },
    ],
  },

  // ============================================
  // ADMINISTRACIÓN
  // ============================================
  {
    id: "admin",
    title: "Administración",
    items: [
      {
        id: "users",
        label: "Usuarios",
        path: "/users",
        icon: UserCog,
        module: "users",
      },
      {
        id: "settings",
        label: "Configuración",
        path: "/settings",
        icon: Settings,
        module: "settings",
      },
    ],
  },
];

/**
 * Rutas que no requieren autenticación
 */
export const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Ruta por defecto después del login
 */
export const defaultAuthenticatedRoute = "/dashboard";

/**
 * Ruta de login
 */
export const loginRoute = "/login";
